# main.py

import os
import shutil
import datetime
import threading
import queue as queue_module
from pathlib import Path

from fastapi import (
    FastAPI,
    UploadFile,
    File,
    Depends,
    HTTPException,
    Form
)
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel

from sqlalchemy.orm import Session

from database import (
    get_db,
    engine,
    Base
)

import models

from auth import get_current_organization

from worker import (
    process_bom_file_async
)

# ==========================================================
# DATABASE INIT
# ==========================================================

Base.metadata.create_all(bind=engine)

# ==========================================================
# APP CONFIG
# ==========================================================

app = FastAPI(
    title="Nodelec B2B BOM Matcher Engine",
    version="2.0.0"
)

# The dashboard (a separate Next.js origin) calls this API directly
# from the browser, so it needs real CORS -- not needed while every
# caller was server-to-server (TestClient, curl, Streamlit's backend
# request). Configurable since the dashboard's deployed origin won't
# be localhost in production.
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

UPLOAD_DIR = Path("./storage/uploads")
UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True
)

ALLOWED_EXTENSIONS = {
    ".csv",
    ".xlsx",
    ".xls",
    ".pdf"
}

MAX_FILE_SIZE_MB = 25

# ==========================================================
# ENQUEUE RELIABILITY
# ==========================================================
# process_bom_file_async.delay() can hang far longer than its
# configured broker socket timeout when the broker (Redis) is
# unreachable, which would otherwise hang the HTTP request
# indefinitely. Run it on a daemon thread and bound the wait
# with a hard wall-clock timeout so the request always resolves
# quickly, whether the broker responds or not. A daemon thread
# (rather than a pooled worker) also means a permanently-hung
# enqueue attempt can never block server shutdown.

ENQUEUE_TIMEOUT_SECONDS = 5


def _enqueue_with_timeout(
    file_id: str,
    timeout: float
) -> None:

    result_queue: "queue_module.Queue" = (
        queue_module.Queue(maxsize=1)
    )

    def _worker():

        try:

            process_bom_file_async.delay(
                file_id
            )

            result_queue.put(
                (True, None)
            )

        except Exception as exc:

            result_queue.put(
                (False, exc)
            )

    threading.Thread(
        target=_worker,
        daemon=True
    ).start()

    try:

        ok, err = result_queue.get(
            timeout=timeout
        )

    except queue_module.Empty:

        raise TimeoutError(
            f"Broker did not respond "
            f"within {timeout}s"
        )

    if not ok:
        raise err

# ==========================================================
# HEALTH CHECK
# ==========================================================

@app.get("/")
async def root():

    return {
        "service": "Nodelec BOM Matcher",
        "status": "online"
    }

# ==========================================================
# FILE UPLOAD
# ==========================================================

@app.post("/api/bom/upload")
async def upload_bom_file(
    distributor_id: str = Form("unknown"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    organization: models.Organization = Depends(get_current_organization)
):

    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail="Missing filename"
        )

    extension = (
        Path(file.filename)
        .suffix
        .lower()
    )

    if extension not in ALLOWED_EXTENSIONS:

        raise HTTPException(
            status_code=400,
            detail=(
                "Only CSV/XLS/XLSX/PDF files "
                "are supported."
            )
        )

    file_uuid = str(
        models.uuid.uuid4()
    )

    safe_filename = (
        f"{file_uuid}_{file.filename}"
    )

    destination = (
        UPLOAD_DIR / safe_filename
    )

    with open(
        destination,
        "wb"
    ) as buffer:

        shutil.copyfileobj(
            file.file,
            buffer
        )

    db_file = models.BOMFile(
        organization_id=organization.id,
        distributor_id=distributor_id,
        status=models.FileStatus.PENDING,
        file_path=str(destination)
    )

    db.add(db_file)

    db.commit()

    db.refresh(db_file)

    try:

        _enqueue_with_timeout(
            str(db_file.id),
            ENQUEUE_TIMEOUT_SECONDS
        )

    except Exception as exc:

        db_file.status = (
            models.FileStatus.FAILED
        )

        db.add(
            models.ProcessingError(
                file_id=db_file.id,
                stage="enqueue",
                error_message=(
                    f"Failed to queue file for "
                    f"processing: {exc}"
                )
            )
        )

        db.commit()

        raise HTTPException(
            status_code=503,
            detail=(
                "Processing queue is currently "
                "unavailable. Please try again shortly."
            )
        )

    return {
        "message":
            "Upload accepted.",
        "file_id":
            str(db_file.id),
        "status":
            db_file.status.value
    }

# ==========================================================
# FILE STATUS
# ==========================================================

@app.get("/api/bom/status/{file_id}")
async def get_file_processing_status(
    file_id: str,
    db: Session = Depends(get_db),
    organization: models.Organization = Depends(get_current_organization)
):

    bom_file = (
        db.query(models.BOMFile)
        .filter(
            models.BOMFile.id == file_id,
            models.BOMFile.organization_id == organization.id
        )
        .first()
    )

    if not bom_file:

        # Deliberately identical to "doesn't exist" -- a file that
        # belongs to a different organization should be
        # indistinguishable from one that was never uploaded at all.
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    rows = (
        db.query(models.BOMRow)
        .filter(
            models.BOMRow.file_id
            == file_id
        )
        .order_by(
            models.BOMRow.row_number
        )
        .all()
    )

    unmatched = (
        db.query(models.UnmatchedPart)
        .filter(
            models.UnmatchedPart.file_id
            == file_id
        )
        .all()
    )

    errors = (
        db.query(models.ProcessingError)
        .filter(
            models.ProcessingError.file_id
            == file_id
        )
        .all()
    )

    exact_count = len(
        [
            r for r in rows
            if r.match_status
            == models.MatchType.EXACT
        ]
    )

    fuzzy_count = len(
        [
            r for r in rows
            if r.match_status
            == models.MatchType.FUZZY
        ]
    )

    review_count = len(
        [
            r for r in rows
            if r.match_status
            == models.MatchType.REVIEW
        ]
    )

    unmatched_count = len(
        unmatched
    )

    priced_rows = [
        r for r in rows
        if r.line_total is not None
        and r.review_action != "rejected"
    ]

    matched_rows = [
        r for r in rows
        if r.matched_component_id is not None
        and r.review_action != "rejected"
    ]

    total_quote_value = round(
        sum(r.line_total for r in priced_rows),
        2
    ) if priced_rows else None

    quote_currency = (
        priced_rows[0].price_currency
        if priced_rows else None
    )

    # total_quote_value only sums rows that actually have a synced
    # price -- a matched-but-unpriced row (no ERP sync yet, or genuinely
    # new part) is silently excluded from the sum, not counted as free.
    # Surface that gap explicitly so the total is never mistaken for
    # "the complete quote" when it isn't.
    rows_missing_price = len(matched_rows) - len(priced_rows)

    return {
        "file_id":
            str(bom_file.id),

        "status":
            bom_file.status.value,

        "distributor":
            bom_file.distributor_id,

        "quote_expires_at":
            bom_file.quote_expires_at,

        "summary": {

            "rows_processed":
                len(rows),

            "exact_matches":
                exact_count,

            "fuzzy_matches":
                fuzzy_count,

            "needs_review":
                review_count,

            "unmatched":
                unmatched_count,

            "errors":
                len(errors),

            "total_quote_value":
                total_quote_value,

            "currency":
                quote_currency,

            "rows_missing_price":
                rows_missing_price
        },

        "matches": [

            {
                "row":
                    r.row_number,

                "input":
                    r.raw_component_text,

                "matched_mpn":
                    r.matched_mpn,

                "confidence":
                    round(
                        r.match_confidence * 100,
                        2
                    ),

                "match_type":
                    r.match_status.value,

                "quantity":
                    r.requested_quantity,

                "quoted_quantity":
                    r.quoted_quantity,

                "moq_rounded":
                    (
                        r.quoted_quantity is not None
                        and r.quoted_quantity != r.requested_quantity
                    ),

                "unit_price":
                    r.unit_price,

                "line_total":
                    r.line_total,

                "currency":
                    r.price_currency,

                "review_action":
                    r.review_action,

                "row_id":
                    str(r.id)
            }

            for r in rows
        ],

        "unmatched_parts": [

            {
                "part":
                    p.raw_part_number,

                "quantity":
                    p.quantity,

                "reason":
                    p.reason
            }

            for p in unmatched
        ],

        "processing_errors": [

            {
                "stage":
                    e.stage,

                "error":
                    e.error_message
            }

            for e in errors
        ]
    }

# ==========================================================
# REVIEW QUEUE
# ==========================================================

class ReviewActionRequest(BaseModel):
    action: str  # "confirm" or "reject"


@app.get("/api/bom/review-queue")
async def get_review_queue(
    db: Session = Depends(get_db),
    organization: models.Organization = Depends(get_current_organization)
):

    rows = (
        db.query(models.BOMRow)
        .join(
            models.BOMFile,
            models.BOMRow.file_id == models.BOMFile.id
        )
        .filter(
            models.BOMFile.organization_id == organization.id,
            models.BOMRow.match_status == models.MatchType.REVIEW,
            models.BOMRow.review_action.is_(None)
        )
        .order_by(
            models.BOMFile.created_at.desc()
        )
        .all()
    )

    return [

        {
            "row_id":
                str(r.id),

            "file_id":
                str(r.file_id),

            "submitted_by":
                r.file.distributor_id,

            "uploaded_at":
                r.file.created_at,

            "input":
                r.raw_component_text,

            "quantity":
                r.requested_quantity,

            "suggested_mpn":
                r.matched_mpn,

            "confidence":
                round(r.match_confidence * 100, 2),

            "review_reason":
                (r.extracted_metadata or {}).get("review_reason"),

            "unit_price":
                r.unit_price,

            "line_total":
                r.line_total,

            "currency":
                r.price_currency
        }

        for r in rows
    ]


@app.patch("/api/bom/rows/{row_id}/review")
async def review_bom_row(
    row_id: str,
    body: ReviewActionRequest,
    db: Session = Depends(get_db),
    organization: models.Organization = Depends(get_current_organization)
):

    if body.action not in ("confirm", "reject"):

        raise HTTPException(
            status_code=400,
            detail="action must be 'confirm' or 'reject'"
        )

    row = (
        db.query(models.BOMRow)
        .join(
            models.BOMFile,
            models.BOMRow.file_id == models.BOMFile.id
        )
        .filter(
            models.BOMRow.id == row_id,
            models.BOMFile.organization_id == organization.id
        )
        .first()
    )

    if not row:

        # Same principle as file lookups: a row belonging to another
        # organization looks identical to one that doesn't exist.
        raise HTTPException(
            status_code=404,
            detail="Row not found"
        )

    if row.match_status != models.MatchType.REVIEW:

        raise HTTPException(
            status_code=400,
            detail=(
                f"Row is not pending review "
                f"(status: {row.match_status.value})"
            )
        )

    if row.review_action is not None:

        raise HTTPException(
            status_code=400,
            detail=f"Row was already {row.review_action}"
        )

    row.review_action = (
        "confirmed" if body.action == "confirm" else "rejected"
    )

    row.reviewed_at = datetime.datetime.now(datetime.timezone.utc)

    # A confirmed match is exactly the human-in-the-loop signal the
    # alias cache is for -- learn it now so the next time this same
    # messy string comes in, it resolves instantly instead of needing
    # review again.
    if body.action == "confirm" and row.matched_component_id:

        existing_alias = (
            db.query(models.PartAlias)
            .filter(
                models.PartAlias.dirty_string == row.raw_component_text
            )
            .first()
        )

        if not existing_alias:

            db.add(
                models.PartAlias(
                    dirty_string=row.raw_component_text,
                    resolved_component_id=row.matched_component_id
                )
            )

    db.commit()
    db.refresh(row)

    return {
        "row_id": str(row.id),
        "review_action": row.review_action,
        "reviewed_at": row.reviewed_at
    }


# ==========================================================
# FILE LISTING
# ==========================================================

@app.get("/api/bom/files")
async def list_uploaded_files(
    db: Session = Depends(get_db),
    organization: models.Organization = Depends(get_current_organization)
):

    files = (
        db.query(models.BOMFile)
        .filter(
            models.BOMFile.organization_id == organization.id
        )
        .order_by(
            models.BOMFile.created_at.desc()
        )
        .all()
    )

    return [

        {
            "file_id":
                str(f.id),

            "status":
                f.status.value,

            "distributor":
                f.distributor_id,

            "created_at":
                f.created_at
        }

        for f in files
    ]

# ==========================================================
# ORGANIZATION RULES
# ==========================================================

class OrganizationRulesRequest(BaseModel):
    quote_validity_hours: int
    default_margin_percent: float
    moq_enforcement_enabled: bool


def _serialize_rules(rules) -> dict:

    if rules is None:

        return {
            "quote_validity_hours":
                models.OrganizationRules.DEFAULT_QUOTE_VALIDITY_HOURS,
            "default_margin_percent":
                models.OrganizationRules.DEFAULT_MARGIN_PERCENT,
            "moq_enforcement_enabled":
                False,
            "is_default":
                True
        }

    return {
        "quote_validity_hours": rules.quote_validity_hours,
        "default_margin_percent": rules.default_margin_percent,
        "moq_enforcement_enabled": rules.moq_enforcement_enabled,
        "is_default": False
    }


@app.get("/api/organization/rules")
async def get_organization_rules(
    db: Session = Depends(get_db),
    organization: models.Organization = Depends(get_current_organization)
):

    rules = (
        db.query(models.OrganizationRules)
        .filter(
            models.OrganizationRules.organization_id == organization.id
        )
        .first()
    )

    return _serialize_rules(rules)


@app.put("/api/organization/rules")
async def update_organization_rules(
    body: OrganizationRulesRequest,
    db: Session = Depends(get_db),
    organization: models.Organization = Depends(get_current_organization)
):

    if not (1 <= body.quote_validity_hours <= 168):

        raise HTTPException(
            status_code=400,
            detail="quote_validity_hours must be between 1 and 168 (a week)"
        )

    if not (0 <= body.default_margin_percent <= 500):

        raise HTTPException(
            status_code=400,
            detail="default_margin_percent must be between 0 and 500"
        )

    rules = (
        db.query(models.OrganizationRules)
        .filter(
            models.OrganizationRules.organization_id == organization.id
        )
        .first()
    )

    if not rules:

        rules = models.OrganizationRules(
            organization_id=organization.id
        )

        db.add(rules)

    rules.quote_validity_hours = body.quote_validity_hours
    rules.default_margin_percent = body.default_margin_percent
    rules.moq_enforcement_enabled = body.moq_enforcement_enabled

    db.commit()
    db.refresh(rules)

    return _serialize_rules(rules)