# main.py

import os
import shutil
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

UPLOAD_DIR = Path("./storage/uploads")
UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True
)

ALLOWED_EXTENSIONS = {
    ".csv",
    ".xlsx",
    ".xls"
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
                "Only CSV/XLS/XLSX files "
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

    return {
        "file_id":
            str(bom_file.id),

        "status":
            bom_file.status.value,

        "distributor":
            bom_file.distributor_id,

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
                len(errors)
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
                    r.match_status.value
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