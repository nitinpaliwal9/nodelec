import os
import re
import datetime

from database import SessionLocal
import models

from engine import BOMEngine
from parsers.ingestion_gateway import stream_and_clean_qrf


def _lookup_price(db, organization_id, component_id, quantity):
    """
    Prices are per-organization (see models.ComponentPrice), so a row
    only ever gets priced against its own file's org -- never a global
    or another tenant's price. Missing organization_id (legacy/
    unassigned files) or no synced price for that org+component both
    just mean "no price available", not an error.
    """

    if not organization_id or not component_id:
        return None, None, None

    price = (
        db.query(models.ComponentPrice)
        .filter(
            models.ComponentPrice.organization_id == organization_id,
            models.ComponentPrice.component_id == component_id
        )
        .first()
    )

    if not price:
        return None, None, None

    return (
        price.unit_price,
        round(price.unit_price * quantity, 2),
        price.currency
    )


def _apply_moq(db, organization_id, component_id, requested_quantity):
    """
    Returns the effective quantity to actually quote/price. Only ever
    rounds up, and only when BOTH the org has explicitly turned MOQ
    enforcement on AND the matched component has a known MOQ -- both
    are opt-in, so a row's quantity is never silently changed by
    default. Returns requested_quantity unchanged in every other case
    (no org rules row yet, enforcement off, unknown/zero MOQ).
    """

    if not organization_id or not component_id:
        return requested_quantity

    rules = (
        db.query(models.OrganizationRules)
        .filter(
            models.OrganizationRules.organization_id == organization_id
        )
        .first()
    )

    if not rules or not rules.moq_enforcement_enabled:
        return requested_quantity

    component = (
        db.query(models.ComponentMaster)
        .filter(models.ComponentMaster.id == component_id)
        .first()
    )

    if not component or not component.moq or component.moq <= 0:
        return requested_quantity

    if requested_quantity % component.moq == 0:
        return requested_quantity

    return (
        (requested_quantity // component.moq) + 1
    ) * component.moq


DNP_PATTERN = re.compile(r"\bDNP\b", re.IGNORECASE)


def _is_dnp_row(*texts: str) -> bool:
    """
    Real customer BOMs mark a "Do Not Populate" line by embedding
    "DNP" directly in the part number or description cell (e.g.
    "DNP/0603") rather than a dedicated status column/value -- there's
    nothing to match against a real component for a position that was
    never meant to be sourced, so this must be checked before the row
    reaches the matching engine at all.
    """

    return any(DNP_PATTERN.search(text) for text in texts if text)


def _match_with_alternatives(
    raw_text: str,
    master_pool,
    normalized_inventory,
    catalog_text,
    mpn_lookup
):
    """
    Some customers list more than one acceptable MPN on a single line,
    comma-separated (e.g. "AC0805KKX5R9BB225, CQ2012X7R225K250NR" --
    either is fine to quote). Matching the whole concatenated string
    as one part number never matches anything real, so split on comma
    and try each candidate independently, keeping the best result.
    A no-op for the overwhelming common case of a single part per
    line (no comma) -- one call to match_component, same as before.

    Returns (match_result, alternatives_metadata_or_None).
    """

    candidates = [c.strip() for c in raw_text.split(",") if c.strip()]

    if len(candidates) <= 1:

        return (
            BOMEngine.match_component(
                raw_text,
                master_pool,
                normalized_inventory=normalized_inventory,
                catalog_text=catalog_text,
                mpn_lookup=mpn_lookup
            ),
            None
        )

    status_rank = {
        models.MatchType.EXACT: 3,
        models.MatchType.FUZZY: 2,
        models.MatchType.REVIEW: 1,
        models.MatchType.UNMATCHED: 0
    }

    best_result = None
    best_candidate = None

    for candidate in candidates:

        result = BOMEngine.match_component(
            candidate,
            master_pool,
            normalized_inventory=normalized_inventory,
            catalog_text=catalog_text,
            mpn_lookup=mpn_lookup
        )

        rank = (status_rank[result["status"]], result["confidence"])

        best_rank = (
            (status_rank[best_result["status"]], best_result["confidence"])
            if best_result else (-1, -1)
        )

        if rank > best_rank:
            best_result = result
            best_candidate = candidate

    return (
        best_result,
        {
            "alternatives_offered": candidates,
            "matched_alternative": best_candidate
        }
    )


def process_bom_file(file_id: str):
    """
    Runs the full ingestion -> matching -> pricing pipeline for one
    file. Called by background_worker.py's poll loop -- not queued
    through Celery/Redis. That indirection existed only to let an
    HTTP request return immediately while a separate worker process
    did the work; a background poll loop inside the same process
    gets the same effect (the upload endpoint never blocks on this)
    without needing a broker to be running and reachable.
    """

    db = SessionLocal()
    bom_file = None

    try:

        # =====================================================
        # FETCH FILE
        # =====================================================

        bom_file = (
            db.query(models.BOMFile)
            .filter(
                models.BOMFile.id == file_id
            )
            .first()
        )

        if not bom_file:
            return (
                f"File record not found: {file_id}"
            )

        bom_file.status = (
            models.FileStatus.PROCESSING
        )

        db.commit()

        # =====================================================
        # LOAD FILE CONTENT
        # =====================================================

        with open(
            bom_file.file_path,
            "rb"
        ) as f:
            file_bytes = f.read()

        # =====================================================
        # INGESTION GATEWAY
        # =====================================================

        df, metadata = (
            stream_and_clean_qrf(
                file_bytes=file_bytes,
                file_name=os.path.basename(
                    bom_file.file_path
                )
            )
        )

        if df.empty:

            raise ValueError(
                "No valid BOM rows detected after parsing"
            )

        # =====================================================
        # DISTRIBUTOR METADATA
        # =====================================================

        distributor = metadata.get(
            "distributor",
            "unknown"
        )

        if distributor and distributor != "unknown":
            bom_file.distributor_id = distributor

        # =====================================================
        # VALIDATE REQUIRED COLUMN
        # =====================================================

        if "part_number" not in df.columns:

            raise ValueError(
                "Canonical column 'part_number' not found"
            )

        if "quantity" not in df.columns:

            raise ValueError(
                "Canonical column 'quantity' not found "
                "(refusing to silently default every row's "
                "quantity to 1)"
            )

        # =====================================================
        # LOAD INVENTORY ONCE
        # =====================================================

        master_pool = (
            db.query(
                models.ComponentMaster
            )
            .all()
        )

        if not master_pool:

            raise ValueError(
                "ComponentMaster inventory is empty"
            )

        # Build the normalized-MPN and description-search lookups ONCE
        # for the whole file, not per row. At a real catalog's size
        # this is the difference between a few hundred ms of setup and
        # redoing that same O(n) work for every single line item --
        # measured at ~280ms/row (mostly repeated setup, not the
        # actual match) against a ~23,000-row catalog before this fix.
        normalized_inventory = BOMEngine.build_normalized_inventory(
            master_pool
        )

        catalog_text, mpn_lookup = BOMEngine.build_searchable_catalog(
            master_pool
        )

        # =====================================================
        # PROCESS ROWS
        # =====================================================

        for index, row in df.iterrows():

            raw_text = str(
                row.get(
                    "part_number",
                    ""
                )
            ).strip()

            description_text = str(
                row.get(
                    "description",
                    ""
                )
            ).strip()

            if _is_dnp_row(raw_text, description_text):

                db.add(
                    models.BOMRow(
                        file_id=bom_file.id,
                        row_number=index + 1,
                        raw_component_text=raw_text or description_text,
                        requested_quantity=int(row.get("quantity", 1)),
                        match_status=models.MatchType.UNMATCHED,
                        match_confidence=0.0,
                        extracted_metadata={
                            "reason": "dnp_not_populated",
                            "description": description_text or None
                        }
                    )
                )

                continue

            if not raw_text:
                continue

            qty = int(
                row.get(
                    "quantity",
                    1
                )
            )

            # -------------------------------------------------
            # ALIAS CACHE
            # -------------------------------------------------

            known_alias = (
                db.query(
                    models.PartAlias
                )
                .filter(
                    models.PartAlias.dirty_string
                    == raw_text
                )
                .first()
            )

            if known_alias:

                quoted_qty = _apply_moq(
                    db,
                    bom_file.organization_id,
                    known_alias.resolved_component_id,
                    qty
                )

                unit_price, line_total, price_currency = _lookup_price(
                    db,
                    bom_file.organization_id,
                    known_alias.resolved_component_id,
                    quoted_qty
                )

                db.add(
                    models.BOMRow(
                        file_id=bom_file.id,
                        row_number=index + 1,
                        raw_component_text=raw_text,
                        requested_quantity=qty,
                        quoted_quantity=quoted_qty,
                        matched_component_id=known_alias.resolved_component_id,
                        matched_mpn=known_alias.component.mpn,
                        match_confidence=1.0,
                        match_status=models.MatchType.EXACT,
                        unit_price=unit_price,
                        line_total=line_total,
                        price_currency=price_currency,
                        extracted_metadata={
                            "source": "alias_cache_hit"
                        }
                    )
                )

                continue

            # -------------------------------------------------
            # MATCH ENGINE
            # -------------------------------------------------

            match_res, alternatives_metadata = _match_with_alternatives(
                raw_text,
                master_pool,
                normalized_inventory,
                catalog_text,
                mpn_lookup
            )

            quoted_qty = _apply_moq(
                db,
                bom_file.organization_id,
                match_res["matched_id"],
                qty
            )

            unit_price, line_total, price_currency = _lookup_price(
                db,
                bom_file.organization_id,
                match_res["matched_id"],
                quoted_qty
            )

            db.add(
                models.BOMRow(
                    file_id=bom_file.id,
                    row_number=index + 1,
                    raw_component_text=raw_text,
                    requested_quantity=qty,
                    quoted_quantity=quoted_qty,
                    matched_component_id=match_res["matched_id"],
                    matched_mpn=match_res["matched_mpn"],
                    match_confidence=match_res["confidence"],
                    match_status=match_res["status"],
                    unit_price=unit_price,
                    line_total=line_total,
                    price_currency=price_currency,
                    extracted_metadata={
                        **match_res["metadata"],
                        "distributor": distributor,
                        "customer_name": metadata.get(
                            "customer_name"
                        ),
                        **(
                            {"alternatives": alternatives_metadata}
                            if alternatives_metadata else {}
                        )
                    }
                )
            )

            # -------------------------------------------------
            # LEARN ALIASES
            # -------------------------------------------------

            if (
                match_res["status"]
                == models.MatchType.EXACT
                and match_res["matched_id"]
            ):

                existing_alias = (
                    db.query(
                        models.PartAlias
                    )
                    .filter(
                        models.PartAlias.dirty_string
                        == raw_text
                    )
                    .first()
                )

                if not existing_alias:

                    db.add(
                        models.PartAlias(
                            dirty_string=raw_text,
                            resolved_component_id=match_res[
                                "matched_id"
                            ]
                        )
                    )

            # -------------------------------------------------
            # AUDIT TRAIL
            # -------------------------------------------------

            if (
                match_res["status"]
                == models.MatchType.UNMATCHED
            ):

                db.add(
                    models.UnmatchedPart(
                        file_id=bom_file.id,
                        raw_part_number=raw_text,
                        quantity=qty,
                        reason="No matching component found"
                    )
                )

        # =====================================================
        # COMPLETE
        # =====================================================

        bom_file.status = (
            models.FileStatus.COMPLETED
        )

        org_rules = (
            db.query(models.OrganizationRules)
            .filter(
                models.OrganizationRules.organization_id
                == bom_file.organization_id
            )
            .first()
        )

        validity_hours = (
            org_rules.quote_validity_hours
            if org_rules
            else models.OrganizationRules.DEFAULT_QUOTE_VALIDITY_HOURS
        )

        bom_file.quote_expires_at = (
            datetime.datetime.now(datetime.timezone.utc)
            + datetime.timedelta(hours=validity_hours)
        )

        db.commit()

        return (
            f"Successfully processed "
            f"file {file_id}"
        )

    except Exception as e:

        db.rollback()

        # -----------------------------------------------------
        # PROCESSING ERROR LOG
        # -----------------------------------------------------

        try:

            db.add(
                models.ProcessingError(
                    file_id=file_id,
                    stage="worker_pipeline",
                    error_message=str(e)
                )
            )

            db.commit()

        except Exception:
            db.rollback()

        # -----------------------------------------------------
        # MARK FAILED
        # -----------------------------------------------------

        try:

            if bom_file:

                bom_file.status = (
                    models.FileStatus.FAILED
                )

                db.commit()

        except Exception:
            db.rollback()

        return (
            f"Pipeline failed: {str(e)}"
        )

    finally:

        db.close()