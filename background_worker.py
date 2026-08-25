# background_worker.py
#
# Runs the three periodic jobs that used to be separate processes
# (Celery worker, email_intake_worker.py, erp_sync_worker.py) as
# daemon threads inside the single FastAPI process instead. This
# exists specifically so the whole app fits inside one free-tier
# host that only runs one process/service -- no Redis broker, no
# second container, no separate worker dyno to pay for.
#
# Each job is a plain "loop forever, sleep between cycles" thread,
# same shape the two existing standalone scripts already used --
# just started here instead of run as `python email_intake_worker.py`
# in a second process. Started from main.py's FastAPI startup event
# via start_background_workers(), stopped implicitly on process exit
# (all threads are daemon=True).

import os
import time
import threading

from database import SessionLocal
import models

from worker import process_bom_file
from email_intake.poller import poll_all_mailboxes
from erp.sync import sync_organization_erp
from erp.tally_connector import TallyConnectionError, TallyResponseError

BOM_POLL_INTERVAL_SECONDS = int(os.getenv("BOM_POLL_INTERVAL_SECONDS", "10"))
EMAIL_POLL_INTERVAL_SECONDS = int(os.getenv("EMAIL_POLL_INTERVAL_SECONDS", "60"))
ERP_SYNC_INTERVAL_SECONDS = int(os.getenv("ERP_SYNC_INTERVAL_SECONDS", "14400"))


def _bom_processing_loop():
    """
    Picks up any BOMFile left in PENDING (a fresh upload, or one an
    email/ERP path just created) and runs it through the pipeline.
    Single thread, sequential within a cycle -- a file's status flips
    to PROCESSING inside process_bom_file() itself before any real
    work starts, so there's no double-processing risk even if a cycle
    runs long.
    """

    print(f"[BOM WORKER] Starting poll loop (every {BOM_POLL_INTERVAL_SECONDS}s)")

    while True:

        try:

            db = SessionLocal()

            try:
                pending_ids = [
                    str(f.id)
                    for f in db.query(models.BOMFile)
                    .filter(models.BOMFile.status == models.FileStatus.PENDING)
                    .all()
                ]
            finally:
                db.close()

            for file_id in pending_ids:

                try:
                    result = process_bom_file(file_id)
                    print(f"[BOM WORKER] {result}")

                except Exception as exc:
                    print(f"[BOM WORKER] Failed processing {file_id}: {exc}")

        except Exception as exc:
            print(f"[BOM WORKER] Poll cycle failed: {exc}")

        time.sleep(BOM_POLL_INTERVAL_SECONDS)


def _email_intake_loop():

    if not os.getenv("MAILBOX_CREDENTIAL_KEY"):
        print("[EMAIL INTAKE] MAILBOX_CREDENTIAL_KEY not set -- email intake loop disabled")
        return

    print(f"[EMAIL INTAKE] Starting poll loop (every {EMAIL_POLL_INTERVAL_SECONDS}s)")

    while True:

        try:
            poll_all_mailboxes()

        except Exception as exc:
            print(f"[EMAIL INTAKE] Poll cycle failed: {exc}")

        time.sleep(EMAIL_POLL_INTERVAL_SECONDS)


def _erp_sync_loop():

    print(f"[ERP SYNC] Starting sync loop (every {ERP_SYNC_INTERVAL_SECONDS}s)")

    while True:

        try:

            db = SessionLocal()

            try:

                connections = (
                    db.query(models.ErpConnection)
                    .filter(
                        models.ErpConnection.is_active == True,  # noqa: E712
                        models.ErpConnection.erp_type == "tally"
                    )
                    .all()
                )

                for connection in connections:

                    try:
                        stats = sync_organization_erp(db, connection)
                        print(f"[ERP SYNC] {connection.label or connection.host}: {stats}")

                    except (TallyConnectionError, TallyResponseError) as exc:
                        print(f"[ERP SYNC] Failed for {connection.label or connection.host}: {exc}")

            finally:
                db.close()

        except Exception as exc:
            print(f"[ERP SYNC] Sync cycle failed: {exc}")

        time.sleep(ERP_SYNC_INTERVAL_SECONDS)


def start_background_workers():

    for target in (_bom_processing_loop, _email_intake_loop, _erp_sync_loop):
        threading.Thread(target=target, daemon=True).start()
