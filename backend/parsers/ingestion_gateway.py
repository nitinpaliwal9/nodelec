import io
import re
import os
import json
import math
import base64
import pandas as pd

from typing import Tuple, Dict, Any, List, Optional


class BOMParsingException(Exception):
    """
    Raised when the ingestion pipeline can't reliably determine a
    file's structure -- no recognizable header row anywhere, or (for
    a scanned PDF) no usable extraction path available at all.
    Deliberately distinct from a bare ValueError so this reads as "we
    don't know how to read this file's layout" specifically. No
    special handling needed in worker.py to make this visible --
    it's caught by the existing broad except there, which already
    records str(exception) on ProcessingError and marks the BOMFile
    FAILED, so the message above bubbles straight to the user.
    """
    pass


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
    ],

    # Not used for matching -- only consulted so a DNP ("Do Not
    # Populate") marker embedded here (e.g. "DNP/0603") can be
    # detected before a row is fed to the matching engine. Real
    # customer BOMs keep this clearly separate from any part-number
    # column, so mapping it doesn't risk swallowing an MPN column.
    "description": [
        "description",
        "component description",
        "part description",
        "part name"
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
        "NONE",
        "N/A",
        "#N/A"
    ):
        return 0

    qty_str = qty_str.replace(",", "")

    # Real customer quantity cells aren't always a bare number -- forecast
    # figures come as "250K PCS./ YEAR", "60K ANNUAL", "180K MONTHLY", "Qty
    # for 5000 boards". Search for the first number (with an optional K/M
    # multiplier immediately after it) anywhere in the string instead of
    # requiring the whole cell to be only digits: an anchored ^...$ match
    # silently fails the moment there's trailing text, and used to fall
    # through to a naive digit-strip that dropped the multiplier entirely
    # ("250K PCS./ YEAR" -> 250, a 1000x under-quote instead of 250,000).
    match = re.search(
        r"(\d+(?:\.\d+)?)\s*([KM])?\b",
        qty_str
    )

    if not match:
        return 0

    base_number = float(
        match.group(1)
    )

    multiplier = match.group(2)

    if multiplier == "K":
        return int(base_number * 1000)

    if multiplier == "M":
        return int(base_number * 1000000)

    return int(base_number)


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
# PDF EXTRACTION -- TEXT LAYER (pdfplumber)
# ==========================================================

def _extract_pdf_rows_via_text(file_bytes: bytes) -> List[list]:
    """
    Pulls tabular rows out of a PDF that has a real text layer (a
    native/digital export, not a scan) using pdfplumber's table-
    structure detection. Returns [] if no tables are found on any
    page -- that emptiness is exactly the signal load_raw_rows() uses
    to fall back to vision extraction, not an error on its own.
    """

    import pdfplumber

    rows: List[list] = []

    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:

        for page in pdf.pages:

            tables = page.extract_tables()

            for table in tables:
                rows.extend(table)

    return rows


# ==========================================================
# PDF EXTRACTION -- VISION FALLBACK (scanned/photographed PDFs)
# ==========================================================

VISION_EXTRACTION_PROMPT = (
    "This image is one page of a Bill of Materials (BOM) or RFQ "
    "spreadsheet that was scanned or photographed rather than a "
    "native digital file. Extract every visible row of the table "
    "exactly as printed, including the header row and any rows above "
    "it (customer name, currency, date, terms, etc -- keep those too, "
    "each as its own row; do not skip or summarize anything).\n\n"
    "Return ONLY a JSON array of arrays: one inner array per row, "
    "each cell as a string, left-to-right in reading order. Use an "
    "empty string for blank cells so column positions stay aligned "
    "across rows. No explanation, no markdown formatting, no text "
    "outside the JSON array itself."
)

VISION_MODEL = "claude-sonnet-5"


def _render_pdf_pages_as_png(file_bytes: bytes, dpi: int = 200) -> List[bytes]:

    import pymupdf

    images = []

    with pymupdf.open(stream=file_bytes, filetype="pdf") as doc:

        for page in doc:

            pixmap = page.get_pixmap(dpi=dpi)
            images.append(pixmap.tobytes("png"))

    return images


def _parse_vision_json_rows(response_text: str) -> List[list]:

    cleaned = response_text.strip()

    if cleaned.startswith("```"):

        cleaned = re.sub(r"^```[a-zA-Z]*\n?", "", cleaned)
        cleaned = re.sub(r"\n?```$", "", cleaned)

    try:
        parsed = json.loads(cleaned)

    except json.JSONDecodeError as exc:

        raise BOMParsingException(
            f"Vision-based PDF extraction did not return parseable "
            f"table data: {exc}"
        )

    if not isinstance(parsed, list) or not all(
        isinstance(row, list) for row in parsed
    ):

        raise BOMParsingException(
            "Vision-based PDF extraction returned an unexpected "
            "shape (expected a JSON array of row arrays)"
        )

    return parsed


def _extract_pdf_rows_via_vision(file_bytes: bytes) -> List[list]:
    """
    Last-resort path for a PDF with no usable text layer at all --
    renders each page to an image and asks Claude to transcribe the
    table. Only reached when pdfplumber's text-layer extraction found
    nothing, since this makes a real API call per page.
    """

    api_key = os.getenv("ANTHROPIC_API_KEY")

    if not api_key:

        raise BOMParsingException(
            "This PDF has no extractable text layer -- it looks "
            "scanned or photographed. Automatic vision-based "
            "extraction requires ANTHROPIC_API_KEY to be configured, "
            "which it currently isn't. Ask the customer for a native "
            "spreadsheet/PDF export instead, or set that variable to "
            "enable this path."
        )

    import anthropic

    client = anthropic.Anthropic(api_key=api_key)

    all_rows: List[list] = []

    for page_bytes in _render_pdf_pages_as_png(file_bytes):

        encoded = base64.b64encode(page_bytes).decode("utf-8")

        message = client.messages.create(
            model=VISION_MODEL,
            max_tokens=4096,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/png",
                                "data": encoded
                            }
                        },
                        {
                            "type": "text",
                            "text": VISION_EXTRACTION_PROMPT
                        }
                    ]
                }
            ]
        )

        response_text = "".join(
            block.text
            for block in message.content
            if getattr(block, "type", None) == "text"
        )

        all_rows.extend(
            _parse_vision_json_rows(response_text)
        )

    return all_rows


def _pad_ragged_rows(rows: List[list]) -> List[list]:
    """
    Spreadsheet reads (pd.read_excel/read_csv) always come back as a
    rectangular grid already. PDF extraction (either path) has no
    such guarantee -- a table row detector or a vision model can
    return rows of different lengths. Pad every row to the widest row
    so column position stays meaningful downstream.
    """

    if not rows:
        return rows

    width = max(len(row) for row in rows)

    return [
        list(row) + [""] * (width - len(row))
        for row in rows
    ]


# ==========================================================
# RAW ROW LOADING (format dispatch)
# ==========================================================

def load_raw_rows(file_bytes: bytes, file_name: str) -> List[list]:
    """
    Returns a file's contents as a plain grid (list of rows, each a
    list of cell values), regardless of source format -- the one
    place that knows how to read .csv/.xlsx/.xls/.pdf, so header
    detection and column mapping downstream never need to care which
    format they're looking at.
    """

    lower_name = file_name.lower()

    if lower_name.endswith(".xlsx") or lower_name.endswith(".xls"):

        df = pd.read_excel(
            io.BytesIO(file_bytes),
            header=None
        )

        return df.values.tolist()

    if lower_name.endswith(".pdf"):

        rows = _extract_pdf_rows_via_text(file_bytes)

        if rows:
            return _pad_ragged_rows(rows)

        # No text layer at all (or no table structure pdfplumber could
        # find) -- the scanned/photographed case, not a garbled-but-
        # real extraction, so this goes to vision rather than trying
        # to heuristically salvage nothing.
        return _pad_ragged_rows(
            _extract_pdf_rows_via_vision(file_bytes)
        )

    try:

        df = pd.read_csv(
            io.BytesIO(file_bytes),
            header=None
        )

        return df.values.tolist()

    except pd.errors.ParserError:

        # A genuinely ragged CSV (inconsistent field count per line --
        # a real hand-edited-export failure mode, not hypothetical)
        # makes the C parser give up entirely with header=None, since
        # it has no header row to infer the expected width from.
        # Fall back to reading raw lines and padding them out instead
        # of letting the whole upload die on a parser error that has
        # nothing to do with whether this is actually a valid BOM.
        import csv as csv_module

        text = file_bytes.decode("utf-8", errors="replace")
        reader = csv_module.reader(text.splitlines())

        return _pad_ragged_rows(list(reader))


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

# A fused two-row header only wins over the best single row if it
# scores at least this many more keyword hits -- keeps a normal
# single-row header (the common case) from ever being second-guessed
# by a fusion match that just happens to score equally well.
FUSION_SCORE_MARGIN = 1


def _row_text(row: list) -> str:

    return " ".join(
        str(cell).lower()
        for cell in row
        if pd.notna(cell) and str(cell).strip()
    )


def _score_row_text(text: str) -> int:

    return sum(
        1
        for keyword in HEADER_KEYWORDS
        if keyword in text
    )


def _fuse_row_pair(row_a: list, row_b: list) -> list:
    """
    Combines two physical rows into one virtual header row, column by
    column -- e.g. "Order"/"" and ""/"Qty" at the same column index
    become "Order Qty". Handles ragged rows by treating a missing
    cell as blank rather than erroring.
    """

    length = max(len(row_a), len(row_b))

    fused = []

    for i in range(length):

        top = (
            str(row_a[i]).strip()
            if i < len(row_a) and pd.notna(row_a[i])
            else ""
        )

        bottom = (
            str(row_b[i]).strip()
            if i < len(row_b) and pd.notna(row_b[i])
            else ""
        )

        fused.append(
            " ".join(part for part in (top, bottom) if part)
        )

    return fused


def analyze_sheet_structure(
    raw_rows: List[list]
) -> Tuple[int, int, Optional[list], Dict[str, Any]]:
    """
    Scans the first 75 rows for the real header. Scores every row on
    its own, and every adjacent pair fused together (for headers that
    visually span two physical rows, e.g. "Order" over "Qty") -- if a
    fused pair scores meaningfully higher than the best single row,
    that pair is used as a virtual header instead.

    Returns (header_start_row, header_end_row, fused_header_or_None,
    metadata). header_end_row equals header_start_row for a normal
    single-row header, or header_start_row + 1 for a fused pair --
    data begins the row after header_end_row either way.

    Raises BOMParsingException if nothing scores above 0 anywhere --
    silently treating row 0 as the header when nothing actually looks
    like one would hide a real problem instead of surfacing it.
    """

    sample_rows = raw_rows[:75]

    best_single_score = 0
    best_single_row = 0

    best_fused_score = 0
    best_fused_start = 0

    for idx, row in enumerate(sample_rows):

        score = _score_row_text(_row_text(row))

        if score > best_single_score:
            best_single_score = score
            best_single_row = idx

        if idx + 1 < len(sample_rows):

            fused_text = (
                _row_text(row)
                + " "
                + _row_text(sample_rows[idx + 1])
            )

            fused_score = _score_row_text(fused_text)

            if fused_score > best_fused_score:
                best_fused_score = fused_score
                best_fused_start = idx

    if best_single_score == 0 and best_fused_score == 0:

        raise BOMParsingException(
            "Unable to reliably detect table headers. "
            "Please verify column labels."
        )

    use_fused = best_fused_score >= best_single_score + FUSION_SCORE_MARGIN

    if use_fused:

        header_start = best_fused_start
        header_end = best_fused_start + 1

        fused_header = _fuse_row_pair(
            sample_rows[header_start],
            sample_rows[header_end]
        )

    else:

        header_start = best_single_row
        header_end = best_single_row
        fused_header = None

    metadata = harvest_metadata_block(
        raw_rows[:header_start]
    )

    return header_start, header_end, fused_header, metadata


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
# SHARED: RAW ROWS -> DATAFRAME (header detection applied)
# ==========================================================

def build_dataframe_from_raw_rows(
    raw_rows: List[list]
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    The "detect the header (including a fused two-row header),
    build a DataFrame from whatever's below it" step -- shared by
    stream_and_clean_qrf (BOM ingestion) and catalog_importer.py
    (catalog imports), which both need it identically and differ
    only in which column-alias map they apply afterward. Also means
    catalog imports get PDF support, multi-row header fusion, the
    hard-fail-on-undetectable-header behavior, and the ragged-CSV
    fallback for free, instead of a second, weaker parser.
    """

    header_start, header_end, fused_header, metadata = (
        analyze_sheet_structure(raw_rows)
    )

    columns_source = (
        fused_header
        if fused_header is not None
        else raw_rows[header_start]
    )

    columns = [
        re.sub(
            r"\s+",
            " ",
            str(col)
            .replace("\n", " ")
            .strip()
        )
        for col in columns_source
    ]

    data_rows = raw_rows[header_end + 1:]

    df = pd.DataFrame(
        data_rows,
        columns=columns
    )

    df = df.dropna(
        how="all"
    )

    return df, metadata


# ==========================================================
# MAIN INGESTION PIPELINE
# ==========================================================

def stream_and_clean_qrf(
    file_bytes: bytes,
    file_name: str = "data.xlsx"
) -> Tuple[pd.DataFrame, Dict[str, Any]]:

    raw_rows = load_raw_rows(
        file_bytes,
        file_name
    )

    df, metadata = build_dataframe_from_raw_rows(
        raw_rows
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
