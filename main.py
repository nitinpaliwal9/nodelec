# main.py

import os
import shutil
import secrets
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

from auth import (
    get_current_organization,
    get_erp_connection_from_agent_key,
    hash_api_key
)

from crypto_utils import encrypt_secret
from email_intake.crypto import encrypt_password
from erp.sync import upsert_components_from_stock_items

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

# ==========================================================
# INTEGRATIONS -- WHATSAPP
# ==========================================================
# No Graph API call actually happens anywhere in this codebase yet
# (no webhook receiver, no send path) -- these routes just give the
# onboarding UI somewhere real to save what a customer enters, ahead
# of that integration being built.

class WhatsAppConfigRequest(BaseModel):
    phone_number_id: str
    business_account_id: str
    system_token: str


NODELEC_WHATSAPP_WEBHOOK_URL = "https://nodelec.in"


def _serialize_whatsapp(connection) -> dict:

    if connection is None:
        return {
            "connected": False,
            "phone_number_id": None,
            "business_account_id": None,
            "webhook_url": NODELEC_WHATSAPP_WEBHOOK_URL
        }

    return {
        "connected": True,
        "phone_number_id": connection.phone_number_id,
        "business_account_id": connection.business_account_id,
        "webhook_url": NODELEC_WHATSAPP_WEBHOOK_URL
    }


@app.get("/api/integrations/whatsapp")
async def get_whatsapp_integration(
    db: Session = Depends(get_db),
    organization: models.Organization = Depends(get_current_organization)
):

    connection = (
        db.query(models.WhatsAppConnection)
        .filter(models.WhatsAppConnection.organization_id == organization.id)
        .first()
    )

    return _serialize_whatsapp(connection)


@app.put("/api/integrations/whatsapp")
async def save_whatsapp_integration(
    body: WhatsAppConfigRequest,
    db: Session = Depends(get_db),
    organization: models.Organization = Depends(get_current_organization)
):

    if not body.phone_number_id.strip() or not body.business_account_id.strip():

        raise HTTPException(
            status_code=400,
            detail="phone_number_id and business_account_id are required"
        )

    if not body.system_token.strip():

        raise HTTPException(
            status_code=400,
            detail="system_token is required"
        )

    connection = (
        db.query(models.WhatsAppConnection)
        .filter(models.WhatsAppConnection.organization_id == organization.id)
        .first()
    )

    if not connection:
        connection = models.WhatsAppConnection(organization_id=organization.id)
        db.add(connection)

    connection.phone_number_id = body.phone_number_id.strip()
    connection.business_account_id = body.business_account_id.strip()
    connection.encrypted_system_token = encrypt_secret(body.system_token.strip())

    db.commit()
    db.refresh(connection)

    return _serialize_whatsapp(connection)

# ==========================================================
# INTEGRATIONS -- EMAIL
# ==========================================================
# Two independent paths, both scoped to the org:
#   - OAuth (google/outlook): a MOCK connect flow. No real OAuth
#     handshake happens, no token is stored -- see
#     models.EmailOAuthConnection's docstring. Every response from
#     these routes says so explicitly rather than implying it's live.
#   - IMAP/SMTP fallback: real. Creates/updates the same
#     MailboxConnection row email_intake/poller.py actually polls.

class EmailOAuthMockConnectRequest(BaseModel):
    provider: str  # "google" | "outlook"


class EmailImapConfigRequest(BaseModel):
    imap_host: str
    imap_port: int = 993
    username: str
    password: str
    folder: str = "INBOX"


def _serialize_email_integration(oauth_connection, mailbox) -> dict:

    return {
        "oauth": {
            "connected": oauth_connection is not None,
            "provider": oauth_connection.provider if oauth_connection else None,
            "mock": True
        },
        "imap": {
            "connected": mailbox is not None,
            "imap_host": mailbox.imap_host if mailbox else None,
            "imap_port": mailbox.imap_port if mailbox else None,
            "username": mailbox.username if mailbox else None,
            "folder": mailbox.folder if mailbox else None,
            "last_polled_at": mailbox.last_polled_at if mailbox else None
        }
    }


def _get_email_integration_state(db, organization_id):

    oauth_connection = (
        db.query(models.EmailOAuthConnection)
        .filter(models.EmailOAuthConnection.organization_id == organization_id)
        .first()
    )

    mailbox = (
        db.query(models.MailboxConnection)
        .filter(models.MailboxConnection.organization_id == organization_id)
        .first()
    )

    return oauth_connection, mailbox


@app.get("/api/integrations/email")
async def get_email_integration(
    db: Session = Depends(get_db),
    organization: models.Organization = Depends(get_current_organization)
):

    oauth_connection, mailbox = _get_email_integration_state(db, organization.id)

    return _serialize_email_integration(oauth_connection, mailbox)


@app.post("/api/integrations/email/oauth/mock-connect")
async def mock_connect_email_oauth(
    body: EmailOAuthMockConnectRequest,
    db: Session = Depends(get_db),
    organization: models.Organization = Depends(get_current_organization)
):

    if body.provider not in ("google", "outlook"):

        raise HTTPException(
            status_code=400,
            detail="provider must be 'google' or 'outlook'"
        )

    connection = (
        db.query(models.EmailOAuthConnection)
        .filter(models.EmailOAuthConnection.organization_id == organization.id)
        .first()
    )

    if not connection:
        connection = models.EmailOAuthConnection(organization_id=organization.id)
        db.add(connection)

    connection.provider = body.provider

    db.commit()
    db.refresh(connection)

    _, mailbox = _get_email_integration_state(db, organization.id)

    return _serialize_email_integration(connection, mailbox)


@app.put("/api/integrations/email/imap")
async def save_email_imap(
    body: EmailImapConfigRequest,
    db: Session = Depends(get_db),
    organization: models.Organization = Depends(get_current_organization)
):

    if not body.imap_host.strip() or not body.username.strip():

        raise HTTPException(
            status_code=400,
            detail="imap_host and username are required"
        )

    if not body.password:

        raise HTTPException(
            status_code=400,
            detail="password is required"
        )

    mailbox = (
        db.query(models.MailboxConnection)
        .filter(models.MailboxConnection.organization_id == organization.id)
        .first()
    )

    if not mailbox:
        mailbox = models.MailboxConnection(organization_id=organization.id)
        db.add(mailbox)

    mailbox.imap_host = body.imap_host.strip()
    mailbox.imap_port = body.imap_port
    mailbox.username = body.username.strip()
    mailbox.encrypted_password = encrypt_password(body.password)
    mailbox.folder = body.folder.strip() or "INBOX"
    mailbox.is_active = True

    db.commit()
    db.refresh(mailbox)

    oauth_connection, _ = _get_email_integration_state(db, organization.id)

    return _serialize_email_integration(oauth_connection, mailbox)

# ==========================================================
# INTEGRATIONS -- ERP / INVENTORY
# ==========================================================
# "tally" is the only platform with a real connector (erp/sync.py +
# erp/tally_connector.py, or the agent-push path below). "sap_b1" and
# "custom_cloud_api" are selectable so the platform choice is captured
# up front, but there's no real connector for either yet.

ERP_PLATFORMS = {"tally", "sap_b1", "custom_cloud_api"}

TALLY_AGENT_KEY_PREFIX = "nkta_"  # "Nodelec Tally Agent"


class ErpConfigRequest(BaseModel):
    platform: str
    host: str | None = None
    port: int | None = None
    company_name: str | None = None
    label: str | None = None


def _serialize_erp(connection) -> dict:

    if connection is None:
        return {
            "configured": False,
            "platform": None,
            "host": None,
            "port": None,
            "company_name": None,
            "has_agent_key": False,
            "last_synced_at": None,
            "last_sync_status": None
        }

    return {
        "configured": True,
        "platform": connection.erp_type,
        "host": connection.host,
        "port": connection.port,
        "company_name": connection.company_name,
        "has_agent_key": connection.agent_key_hash is not None,
        "last_synced_at": connection.last_synced_at,
        "last_sync_status": connection.last_sync_status
    }


@app.get("/api/integrations/erp")
async def get_erp_integration(
    db: Session = Depends(get_db),
    organization: models.Organization = Depends(get_current_organization)
):

    connection = (
        db.query(models.ErpConnection)
        .filter(models.ErpConnection.organization_id == organization.id)
        .first()
    )

    return _serialize_erp(connection)


@app.put("/api/integrations/erp")
async def save_erp_integration(
    body: ErpConfigRequest,
    db: Session = Depends(get_db),
    organization: models.Organization = Depends(get_current_organization)
):

    if body.platform not in ERP_PLATFORMS:

        raise HTTPException(
            status_code=400,
            detail=f"platform must be one of {sorted(ERP_PLATFORMS)}"
        )

    if body.platform == "tally":

        if not (body.host or "").strip() or not (body.company_name or "").strip():

            raise HTTPException(
                status_code=400,
                detail="host and company_name are required for Tally"
            )

    connection = (
        db.query(models.ErpConnection)
        .filter(models.ErpConnection.organization_id == organization.id)
        .first()
    )

    if not connection:
        connection = models.ErpConnection(organization_id=organization.id)
        db.add(connection)

    connection.erp_type = body.platform
    connection.label = body.label

    if body.platform == "tally":
        connection.host = body.host.strip()
        connection.port = body.port or 9000
        connection.company_name = body.company_name.strip()
    else:
        connection.host = None
        connection.port = None
        connection.company_name = None

    db.commit()
    db.refresh(connection)

    return _serialize_erp(connection)


@app.post("/api/integrations/erp/tally-agent-key")
async def generate_tally_agent_key(
    db: Session = Depends(get_db),
    organization: models.Organization = Depends(get_current_organization)
):
    """
    Generates a fresh Tally Agent Key and returns it ONCE, in plain
    text -- only its SHA-256 hash is stored (models.ErpConnection.
    agent_key_hash), the same non-recoverable pattern as the org's own
    API keys. Calling this again invalidates any previously-issued
    key for this org's Tally connection, exactly like re-issuing an
    API key.
    """

    connection = (
        db.query(models.ErpConnection)
        .filter(
            models.ErpConnection.organization_id == organization.id,
            models.ErpConnection.erp_type == "tally"
        )
        .first()
    )

    if not connection:

        raise HTTPException(
            status_code=400,
            detail=(
                "No Tally connection configured yet -- save your "
                "Tally host/company via PUT /api/integrations/erp "
                "first."
            )
        )

    raw_key = TALLY_AGENT_KEY_PREFIX + secrets.token_urlsafe(32)

    connection.agent_key_hash = hash_api_key(raw_key)

    db.commit()

    return {
        "agent_key": raw_key,
        "warning": "This key is shown once and cannot be recovered. Store it securely."
    }


class TallyAgentPushRequest(BaseModel):
    stock_items: list[dict]


@app.post("/api/integrations/erp/tally-agent/push")
async def tally_agent_push(
    body: TallyAgentPushRequest,
    db: Session = Depends(get_db),
    erp_connection: models.ErpConnection = Depends(get_erp_connection_from_agent_key)
):
    """
    Receives inventory pushed by the Nodelec Tally Agent script
    running on a distributor's own machine -- the inverse of
    erp/sync.py's direct pull, for the (typical) case where our
    server cannot reach the distributor's LAN but their own machine
    can reach both Tally and us. Auth is the dedicated Tally Agent
    Key (X-Tally-Agent-Key header), not the org's general API key.
    """

    stats = upsert_components_from_stock_items(
        db,
        erp_connection.organization_id,
        body.stock_items
    )

    erp_connection.last_sync_status = "success"
    erp_connection.last_synced_at = datetime.datetime.now(datetime.timezone.utc)

    db.commit()

    return stats