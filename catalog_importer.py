# catalog_importer.py

import os
import re
import sys

import pandas as pd

from database import SessionLocal
import models

from engine import BOMEngine


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
        "sku"
    ],

    "manufacturer": [
        "manufacturer",
        "mfr",
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
        "family"
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
    ]
}


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

    extension = os.path.splitext(file_path)[1].lower()

    if extension in (".xlsx", ".xls"):
        df = pd.read_excel(file_path)

    elif extension == ".csv":
        df = pd.read_csv(file_path)

    else:
        raise ValueError(
            f"Unsupported catalog file type '{extension}' "
            f"(expected .csv, .xlsx, or .xls)"
        )

    df.columns = [
        re.sub(
            r"\s+",
            " ",
            str(col).replace("\n", " ").strip()
        )
        for col in df.columns
    ]

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

        existing_by_mpn = {
            component.mpn: component
            for component in db.query(models.ComponentMaster).all()
        }

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
                )
            }

            normalized_mpn = BOMEngine.normalize_mpn(mpn)

            component = existing_by_mpn.get(mpn)

            if component:

                for field, value in fields.items():
                    setattr(component, field, value)

                component.normalized_mpn = normalized_mpn

                stats["updated"] += 1

            else:

                component = models.ComponentMaster(
                    mpn=mpn,
                    normalized_mpn=normalized_mpn,
                    **fields
                )

                db.add(component)

                db.flush()

                existing_by_mpn[mpn] = component

                stats["inserted"] += 1

            # -------------------------------------------------
            # SEED A DIRECT ALIAS FOR THIS MPN
            # -------------------------------------------------

            alias_exists = (
                db.query(models.PartAlias)
                .filter(models.PartAlias.dirty_string == mpn)
                .first()
            )

            if not alias_exists:

                db.add(
                    models.PartAlias(
                        dirty_string=mpn,
                        resolved_component_id=component.id
                    )
                )

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
