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
    """

    stats = {
        "messages_seen": 0,
        "attachments_ingested": 0,
        "messages_skipped_no_attachment": 0,
        "errors": 0
    }

    with ImapSession(mailbox) as session:

        for uid, message in session.fetch_unseen():

            stats["messages_seen"] += 1

            sender = extract_sender(message)
            attachments = extract_attachments(message)

            if not attachments:
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
        "attachments_ingested": 0
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
