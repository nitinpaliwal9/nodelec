# catalog_importer.py

import os
import re
import sys

import pandas as pd

from database import SessionLocal
import models

from engine import BOMEngine

from parsers.ingestion_gateway import (
    load_raw_rows,
    build_dataframe_from_raw_rows
)


# ==========================================================
# CANONICAL COLUMN ALIASES
# ==========================================================
# Real distributor/manufacturer catalog exports use wildly different
# header names for the same field, so map the common variants onto
# the canonical ComponentMaster field names.

COLUMN_ALIASES = {
    "mpn": [
        "mpn",
        "part number",
        "part no",
        "manufacturer part number",
        "manufacturer p/n",
        "mfr part number",
        "full part number",
        "component part number",
        "sku",
        # Tally-style stock exports identify a line item by its own
        # "Item Name" (often a real-ish part string, sometimes a
        # plain description) rather than a dedicated MPN column --
        # same tradeoff erp/sync.py already makes for live Tally
        # sync: whatever string the customer's own system uses to
        # identify the part is what a BOM upload will be matched
        # against, messy or not.
        "item name"
    ],

    "manufacturer": [
        "manufacturer",
        "manufacturer name",
        "mfr",
        "mfr name",
        "mfg",
        "brand"
    ],

    "description": [
        "description",
        "desc",
        "part description"
    ],

    "category": [
        "category",
        "product category",
        "family",
        "item group"
    ],

    "lifecycle_status": [
        "lifecycle status",
        "lifecycle",
        "status"
    ],

    "rohs_status": [
        "rohs status",
        "rohs",
        "rohs compliance"
    ],

    # Standard Pack Quantity -- the same real-world concept as
    # ComponentMaster.moq (MOQ enforcement rounds a quoted quantity
    # up to this). Not every distributor sheet has it, hence a
    # separate optional field rather than folding it into "mpn"-style
    # required handling.
    "moq": [
        "moq",
        "spq",
        "minimum order quantity",
        "standard pack quantity"
    ]
}


def _parse_moq(raw_value) -> int | None:
    """
    None means "unknown" (MOQ enforcement already no-ops on that --
    see models.ComponentMaster.moq), not zero. Real sheets mostly
    have this as a clean integer, but strip commas/whitespace
    defensively rather than assume.
    """

    if raw_value is None or (isinstance(raw_value, float) and pd.isna(raw_value)):
        return None

    text = str(raw_value).strip().replace(",", "")

    if not text:
        return None

    try:
        value = int(float(text))
    except ValueError:
        return None

    return value if value > 0 else None


def normalize_header(text: str) -> str:
    """
    Punctuation-insensitive header key, mirroring
    parsers.ingestion_gateway.normalize_header so catalog files and
    BOM files are matched the same way (e.g. "Manufacturer P/N").
    """

    text = str(text).lower().strip()

    text = text.replace("'", "").replace("’", "")

    text = re.sub(r"[^a-z0-9]+", " ", text)

    return re.sub(r"\s+", " ", text).strip()


def map_catalog_columns(df: pd.DataFrame) -> pd.DataFrame:

    normalized_columns = {
        normalize_header(col): col
        for col in df.columns
    }

    rename_map = {}

    for canonical, aliases in COLUMN_ALIASES.items():

        for alias in aliases:

            normalized_alias = normalize_header(alias)

            if normalized_alias in normalized_columns:

                rename_map[
                    normalized_columns[normalized_alias]
                ] = canonical

                break

    return df.rename(columns=rename_map)


# ==========================================================
# FILE LOADING
# ==========================================================

def load_catalog_dataframe(file_path: str) -> pd.DataFrame:
    """
    Delegates header detection to the same pipeline BOM uploads use
    (parsers.ingestion_gateway) instead of a plain pd.read_excel/
    read_csv, which assumed row 0 was always the header -- real
    catalog-shaped files (a KiCad/EDA BOM export repurposed as a
    catalog seed, a distributor sheet with a title row above the
    real headers, ...) commonly aren't that clean. Also picks up
    PDF support and multi-row header fusion for free.
    """

    extension = os.path.splitext(file_path)[1].lower()

    if extension not in (".xlsx", ".xls", ".csv", ".pdf"):
        raise ValueError(
            f"Unsupported catalog file type '{extension}' "
            f"(expected .csv, .xlsx, .xls, or .pdf)"
        )

    with open(file_path, "rb") as f:
        file_bytes = f.read()

    raw_rows = load_raw_rows(
        file_bytes,
        os.path.basename(file_path)
    )

    df, _ = build_dataframe_from_raw_rows(raw_rows)

    return map_catalog_columns(df)


# ==========================================================
# MAIN IMPORT PIPELINE
# ==========================================================

def import_catalog_file(file_path: str) -> dict:
    """
    Bulk-imports (or updates) real component records into
    ComponentMaster from a distributor/manufacturer catalog file.

    Upserts by MPN: a row whose MPN already exists updates that
    component in place, otherwise a new ComponentMaster row is
    created. A direct PartAlias (dirty_string == mpn) is seeded for
    every imported row so the very first BOM upload referencing it
    hits the alias cache instead of the fuzzy matcher.
    """

    if not os.path.exists(file_path):

        raise FileNotFoundError(
            f"Catalog file not found: {file_path}"
        )

    df = load_catalog_dataframe(file_path)

    if "mpn" not in df.columns:

        raise ValueError(
            "Catalog file has no recognizable MPN/part number column"
        )

    df["mpn"] = (
        df["mpn"]
        .fillna("")
        .astype(str)
        .str.strip()
    )

    stats = {
        "total_rows": len(df),
        "inserted": 0,
        "updated": 0,
        "skipped": 0
    }

    db = SessionLocal()

    try:

        # Both pre-fetched once, up front -- the previous version
        # queried PartAlias once PER ROW (11,000+ individual
        # round-trips to the database for a real-size catalog file),
        # which is fine against a local DB but takes the better part
        # of an hour against a remote one. Everything below runs
        # in-memory against these two dicts/sets instead.
        existing_by_mpn = {
            component.mpn: component
            for component in db.query(models.ComponentMaster).all()
        }

        existing_aliases = {
            dirty_string
            for (dirty_string,) in db.query(models.PartAlias.dirty_string).all()
        }

        aliases_added_this_run = set()

        for _, row in df.iterrows():

            mpn = row["mpn"].strip()

            if not mpn:

                stats["skipped"] += 1

                continue

            fields = {
                "manufacturer": (
                    str(row["manufacturer"]).strip()
                    if pd.notna(row.get("manufacturer"))
                    and str(row.get("manufacturer")).strip()
                    else "UNKNOWN"
                ),

                "description": (
                    str(row["description"]).strip()
                    if pd.notna(row.get("description"))
                    else None
                ),

                "category": (
                    str(row["category"]).strip()
                    if pd.notna(row.get("category"))
                    else None
                ),

                "lifecycle_status": (
                    str(row["lifecycle_status"]).strip().upper()
                    if pd.notna(row.get("lifecycle_status"))
                    else "ACTIVE"
                ),

                "rohs_status": (
                    str(row["rohs_status"]).strip().upper()
                    if pd.notna(row.get("rohs_status"))
                    else None
                ),

                "moq": _parse_moq(row.get("moq"))
            }

            normalized_mpn = BOMEngine.normalize_mpn(mpn)

            component = existing_by_mpn.get(mpn)

            if component:

                for field, value in fields.items():
                    setattr(component, field, value)

                component.normalized_mpn = normalized_mpn

                stats["updated"] += 1

            else:

                # id set explicitly (client-side, via the same
                # uuid.uuid4() the column's own default would call)
                # rather than left to the DB default + db.flush() --
                # flush() sends a real round-trip per new row, which
                # was the other half of what made this slow at real
                # catalog size.
                component = models.ComponentMaster(
                    id=models.uuid.uuid4(),
                    mpn=mpn,
                    normalized_mpn=normalized_mpn,
                    **fields
                )

                db.add(component)

                existing_by_mpn[mpn] = component

                stats["inserted"] += 1

            # -------------------------------------------------
            # SEED A DIRECT ALIAS FOR THIS MPN
            # -------------------------------------------------

            if mpn not in existing_aliases and mpn not in aliases_added_this_run:

                db.add(
                    models.PartAlias(
                        dirty_string=mpn,
                        resolved_component_id=component.id
                    )
                )

                aliases_added_this_run.add(mpn)

        db.commit()

    except Exception:

        db.rollback()

        raise

    finally:

        db.close()

    return stats


# ==========================================================
# CLI ENTRY POINT
# ==========================================================

if __name__ == "__main__":

    if len(sys.argv) < 2:

        print(
            "Usage: python catalog_importer.py "
            "<path-to-catalog.csv|.xlsx|.xls>"
        )

        sys.exit(1)

    target_file = sys.argv[1]

    print(f"Importing catalog from: {target_file}")

    result = import_catalog_file(target_file)

    print(f"Rows processed: {result['total_rows']}")
    print(f"Inserted: {result['inserted']}")
    print(f"Updated: {result['updated']}")
    print(f"Skipped (missing MPN): {result['skipped']}")
