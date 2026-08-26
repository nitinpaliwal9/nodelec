# email_intake/poller.py

import os
import uuid
import datetime
from pathlib import Path

from database import SessionLocal
import models

from email_intake.gateway import (
    ImapSession,
    extract_attachments,
    extract_html_body,
    extract_sender
)

UPLOAD_DIR = Path("./storage/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def _save_attachment(filename: str, content: bytes) -> str:

    file_uuid = str(uuid.uuid4())
    safe_filename = f"{file_uuid}_{filename}"
    destination = UPLOAD_DIR / safe_filename

    with open(destination, "wb") as buffer:
        buffer.write(content)

    return str(destination)


def process_mailbox(db, mailbox: models.MailboxConnection) -> dict:
    """
    Polls one mailbox, ingests every attachment from its unseen
    messages as a BOMFile scoped to that mailbox's organization, and
    marks each message \\Seen only once every one of its attachments
    has been successfully saved and queued.

    A message with no attachment isn't necessarily skipped outright:
    if its HTML body contains a table (an RFQ pasted directly into
    the email rather than sent as a file), that table is saved as a
    synthetic .html "attachment" and ingested the same way -- one
    format-agnostic path (parsers.ingestion_gateway.load_raw_rows)
    handles it downstream, same as any other file. Only a message
    with neither a real attachment nor a body table is actually
    skipped.
    """

    stats = {
        "messages_seen": 0,
        "attachments_ingested": 0,
        "body_tables_ingested": 0,
        "messages_skipped_no_attachment": 0,
        "errors": 0
    }

    with ImapSession(mailbox) as session:

        for uid, message in session.fetch_unseen():

            stats["messages_seen"] += 1

            sender = extract_sender(message)
            attachments = extract_attachments(message)
            from_body = False

            if not attachments:

                html_body = extract_html_body(message)

                if html_body:
                    attachments = [(f"email-body-{uid}.html", html_body)]
                    from_body = True
                else:
                    stats["messages_skipped_no_attachment"] += 1
                    session.mark_seen(uid)
                    continue

            all_ok = True

            for filename, content in attachments:

                try:

                    file_path = _save_attachment(filename, content)

                    db_file = models.BOMFile(
                        organization_id=mailbox.organization_id,
                        distributor_id=sender,
                        status=models.FileStatus.PENDING,
                        file_path=file_path
                    )

                    db.add(db_file)
                    db.commit()
                    db.refresh(db_file)

                    # Left PENDING -- background_worker.py's poll loop
                    # (running in this same process) picks it up.

                    if from_body:
                        stats["body_tables_ingested"] += 1
                    else:
                        stats["attachments_ingested"] += 1

                except Exception as exc:

                    all_ok = False
                    stats["errors"] += 1

                    db.rollback()

                    db.add(
                        models.ProcessingError(
                            file_id=None,
                            stage="email_intake",
                            error_message=(
                                f"Failed to ingest attachment "
                                f"'{filename}' from {sender}: {exc}"
                            )
                        )
                    )
                    db.commit()

            # Only mark the message read if every attachment it carried
            # was actually saved and queued -- a partial failure should
            # come back around on the next poll, not vanish silently.
            if all_ok:
                session.mark_seen(uid)

    mailbox.last_polled_at = datetime.datetime.now(datetime.timezone.utc)

    return stats


def poll_all_mailboxes() -> dict:

    db = SessionLocal()

    totals = {
        "mailboxes_polled": 0,
        "mailboxes_failed": 0,
        "attachments_ingested": 0,
        "body_tables_ingested": 0
    }

    try:

        mailboxes = (
            db.query(models.MailboxConnection)
            .filter(models.MailboxConnection.is_active == True)  # noqa: E712
            .all()
        )

        for mailbox in mailboxes:

            try:

                stats = process_mailbox(db, mailbox)

                totals["mailboxes_polled"] += 1
                totals["attachments_ingested"] += stats["attachments_ingested"]
                totals["body_tables_ingested"] += stats["body_tables_ingested"]

                print(
                    f"[EMAIL INTAKE] {mailbox.label or mailbox.username}: "
                    f"{stats}"
                )

            except Exception as exc:

                totals["mailboxes_failed"] += 1

                print(
                    f"[EMAIL INTAKE] FAILED to poll "
                    f"{mailbox.label or mailbox.username}: {exc}"
                )

        db.commit()

    finally:
        db.close()

    return totals
