import io
import re
import math
import pandas as pd

from typing import Tuple, Dict, Any


# ==========================================================
# DISTRIBUTOR DETECTION
# ==========================================================

DISTRIBUTOR_SIGNATURES = {
    "mouser": [
        "mouser",
        "mouser part number"
    ],
    "digikey": [
        "digikey",
        "digi-key",
        "digikey part number"
    ],
    "arrow": [
        "arrow electronics"
    ],
    "avnet": [
        "avnet"
    ],
    "lcsc": [
        "lcsc"
    ],
    "jlcpcb": [
        "jlcpcb"
    ]
}


# ==========================================================
# CANONICAL COLUMN ALIASES
# ==========================================================

COLUMN_ALIASES = {
    "part_number": [
        "part number",
        "part no",
        "manufacturer part number",
        "manufacturer p/n",
        "mpn",
        "full part number",
        "part id",
        "sku",
        "mfr part number",
        "component part number"
    ],

    "quantity": [
        "qty",
        "quantity",
        "order qty",
        "order quantity",
        "required qty",
        "required quantity",
        "requested quantity",
        "requested qty"
    ],

    "competitor_part": [
        "competitor part number",
        "cross reference",
        "alternate part"
    ]
}


# ==========================================================
# QUANTITY NORMALIZATION
# ==========================================================

def normalize_quantity(raw_qty_val: Any) -> int:

    if isinstance(raw_qty_val, (int, float)):
        if math.isnan(raw_qty_val) or math.isinf(raw_qty_val):
            return 0
        return max(int(raw_qty_val), 0)

    qty_str = str(raw_qty_val).strip().upper()

    if not qty_str:
        return 0

    if qty_str in (
        "NAN",
        "NULL",
        "-",
        "NONE"
    ):
        return 0

    qty_str = qty_str.replace(",", "")

    qty_str = re.sub(
        r"\s*(PCS|PIECES|UNITS|NOS|PACKS)\b",
        "",
        qty_str
    )

    match = re.match(
        r"^([\d\.]+)\s*([KM])?$",
        qty_str
    )

    if match:

        base_number = float(
            match.group(1)
        )

        multiplier = match.group(2)

        if multiplier == "K":
            return int(base_number * 1000)

        if multiplier == "M":
            return int(base_number * 1000000)

        return int(base_number)

    fallback = re.sub(
        r"\D",
        "",
        qty_str
    )

    return int(fallback) if fallback else 0


# ==========================================================
# METADATA EXTRACTION
# ==========================================================

def harvest_metadata_block(
    raw_data: list
) -> Dict[str, Any]:

    metadata = {
        "customer_name": "UNKNOWN",
        "currency": "USD",
        "distributor": "unknown",
        "extraction_type": "dynamic_header_detection"
    }

    for row in raw_data:

        line_text = " ".join(
            [
                str(cell).strip()
                for cell in row
                if pd.notna(cell)
            ]
        )

        lower = line_text.lower()

        if "customer" in lower:

            metadata["customer_name"] = (
                re.sub(
                    r'[:,\s]+',
                    ' ',
                    line_text.split(":")[-1]
                )
                .strip()
                .upper()
            )

        if "currency" in lower:

            metadata["currency"] = (
                "INR"
                if any(
                    x in lower
                    for x in ["₹", "inr"]
                )
                else "USD"
            )

        for distributor, patterns in DISTRIBUTOR_SIGNATURES.items():

            if any(
                p in lower
                for p in patterns
            ):
                metadata["distributor"] = distributor

    return metadata


# ==========================================================
# HEADER DETECTION
# ==========================================================

HEADER_KEYWORDS = [
    "part",
    "part number",
    "full part number",
    "manufacturer part number",
    "mpn",
    "sku",
    "qty",
    "quantity"
]


def analyze_sheet_structure(
    file_bytes: bytes,
    file_name: str
) -> Tuple[int, Dict[str, Any]]:

    file_io = io.BytesIO(file_bytes)

    if file_name.lower().endswith(".xlsx"):
        sample_df = pd.read_excel(
            file_io,
            header=None,
            nrows=75
        )
    else:
        sample_df = pd.read_csv(
            file_io,
            header=None,
            nrows=75
        )

    raw_rows = sample_df.values.tolist()

    best_score = 0
    best_row = 0

    for idx, row in enumerate(raw_rows):

        row_text = " ".join(
            [
                str(c).lower()
                for c in row
                if pd.notna(c)
            ]
        )

        score = sum(
            1
            for keyword in HEADER_KEYWORDS
            if keyword in row_text
        )

        if score > best_score:
            best_score = score
            best_row = idx

    metadata = harvest_metadata_block(
        raw_rows[:best_row]
    )

    return best_row, metadata


# ==========================================================
# COLUMN MAPPING
# ==========================================================

def normalize_header(text: str) -> str:
    """
    Punctuation-insensitive header key so real-world variants
    like "Order Q'ty" or "Manufacturer P/N" still match their
    alias even though they contain apostrophes/slashes that the
    canonical alias list doesn't.
    """

    text = str(text).lower().strip()

    text = text.replace("'", "").replace("’", "")

    text = re.sub(
        r"[^a-z0-9]+",
        " ",
        text
    )

    return re.sub(
        r"\s+",
        " ",
        text
    ).strip()


def map_distributor_columns(
    df: pd.DataFrame
) -> pd.DataFrame:

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

    return df.rename(
        columns=rename_map
    )


# ==========================================================
# VALIDATION
# ==========================================================

def validate_dataframe(
    df: pd.DataFrame
) -> pd.DataFrame:

    if "part_number" in df.columns:

        df["part_number"] = (
            df["part_number"]
            .fillna("")
            .astype(str)
            .str.strip()
        )

        df = df[
            df["part_number"] != ""
        ]

    if "quantity" in df.columns:

        df["quantity"] = (
            df["quantity"]
            .apply(normalize_quantity)
        )

    return df


# ==========================================================
# MAIN INGESTION PIPELINE
# ==========================================================

def stream_and_clean_qrf(
    file_bytes: bytes,
    file_name: str = "data.xlsx"
) -> Tuple[pd.DataFrame, Dict[str, Any]]:

    header_offset, metadata = (
        analyze_sheet_structure(
            file_bytes,
            file_name
        )
    )

    file_io = io.BytesIO(file_bytes)

    if file_name.lower().endswith(".xlsx"):

        df = pd.read_excel(
            file_io,
            skiprows=header_offset
        )

    else:

        df = pd.read_csv(
            file_io,
            skiprows=header_offset
        )

    df.columns = [
        re.sub(
            r"\s+",
            " ",
            str(col)
            .replace("\n", " ")
            .strip()
        )
        for col in df.columns
    ]

    df = df.dropna(
        how="all"
    )

    df = map_distributor_columns(
        df
    )

    df = validate_dataframe(
        df
    )

    metadata["row_count"] = len(df)

    print(
        f"[GATEWAY] "
        f"Rows={len(df)} "
        f"Distributor={metadata.get('distributor')} "
        f"Customer={metadata.get('customer_name')}"
    )

    return df, metadata