# erp/sync.py

import datetime

import models
from engine import BOMEngine

from erp.tally_connector import (
    fetch_stock_items,
    TallyConnectionError,
    TallyResponseError
)


def sync_organization_erp(db, erp_connection: "models.ErpConnection") -> dict:
    """
    Pulls stock items from the connection's Tally instance and
    upserts a ComponentPrice row per item scoped to this organization.

    A Tally stock item that doesn't already match an existing
    ComponentMaster row (by the same normalization the matching engine
    itself uses) is NOT discarded -- it's created. A customer's own
    ERP is the authoritative source for what they actually stock and
    sell; skipping items just because nobody had imported them into
    the catalog yet defeats the entire point of syncing real
    inventory. New rows are tagged source="erp_sync" (see
    models.ComponentMaster) so their provenance stays visible, and get
    the same PartAlias seeding a confirmed review or a catalog import
    gets, so a BOM upload referencing this exact string next time
    hits the alias cache directly.

    Records success/failure on the connection itself either way, then
    re-raises on failure so a caller (CLI, scheduled worker) still
    sees it happened.
    """

    stats = {
        "tally_items_seen": 0,
        "matched_to_catalog": 0,
        "created_from_erp": 0,
        "unmatched": 0
    }

    try:

        stock_items = fetch_stock_items(
            erp_connection.host,
            erp_connection.port,
            erp_connection.company_name
        )

    except (TallyConnectionError, TallyResponseError) as exc:

        erp_connection.last_sync_status = f"failed: {exc}"
        erp_connection.last_synced_at = datetime.datetime.now(datetime.timezone.utc)
        db.commit()

        raise

    stats["tally_items_seen"] = len(stock_items)

    catalog = db.query(models.ComponentMaster).all()

    normalized_lookup = {
        BOMEngine.normalize_mpn(component.mpn): component
        for component in catalog
    }

    for item in stock_items:

        raw_name = (item.get("name") or "").strip()

        if not raw_name:
            stats["unmatched"] += 1
            continue

        normalized_name = BOMEngine.normalize_mpn(raw_name)

        if not normalized_name:
            stats["unmatched"] += 1
            continue

        component = normalized_lookup.get(normalized_name)

        if not component:

            # Real stock item, not yet in the shared catalog -- create
            # it rather than silently dropping real inventory data.
            component = models.ComponentMaster(
                mpn=raw_name,
                normalized_mpn=normalized_name,
                manufacturer="Unknown (from ERP sync)",
                source="erp_sync"
            )

            db.add(component)
            db.flush()

            normalized_lookup[normalized_name] = component

            # dirty_string is unique -- guard against a prior alias
            # (learned from a confirmed review, say) already claiming
            # this exact raw string before inserting a second one.
            existing_alias = (
                db.query(models.PartAlias)
                .filter(models.PartAlias.dirty_string == raw_name)
                .first()
            )

            if not existing_alias:

                db.add(
                    models.PartAlias(
                        dirty_string=raw_name,
                        resolved_component_id=component.id
                    )
                )

            stats["created_from_erp"] += 1

        existing = (
            db.query(models.ComponentPrice)
            .filter(
                models.ComponentPrice.organization_id == erp_connection.organization_id,
                models.ComponentPrice.component_id == component.id
            )
            .first()
        )

        if existing:

            existing.unit_price = item["rate"]
            existing.stock_quantity = item["stock_quantity"]
            existing.synced_at = datetime.datetime.now(datetime.timezone.utc)

        else:

            db.add(
                models.ComponentPrice(
                    organization_id=erp_connection.organization_id,
                    component_id=component.id,
                    unit_price=item["rate"],
                    stock_quantity=item["stock_quantity"],
                    source="tally"
                )
            )

        stats["matched_to_catalog"] += 1

    erp_connection.last_sync_status = "success"
    erp_connection.last_synced_at = datetime.datetime.now(datetime.timezone.utc)

    db.commit()

    return stats
