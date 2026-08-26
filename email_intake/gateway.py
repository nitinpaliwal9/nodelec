# email_intake/gateway.py

import imaplib
import email
from email.header import decode_header
from email.message import Message
from typing import List, Tuple, Optional

from email_intake.crypto import decrypt_password

ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls", ".pdf"}


def decode_mime_filename(raw_filename: str) -> str:
    """
    Attachment filenames can arrive as RFC 2047 encoded-words
    (e.g. "=?UTF-8?B?...?=") depending on the sending mail client.
    """

    if not raw_filename:
        return raw_filename

    decoded_parts = decode_header(raw_filename)

    pieces = []

    for text, encoding in decoded_parts:

        if isinstance(text, bytes):
            pieces.append(text.decode(encoding or "utf-8", errors="replace"))
        else:
            pieces.append(text)

    return "".join(pieces)


def extract_attachments(message: Message) -> List[Tuple[str, bytes]]:
    """
    Walks a parsed email and returns (filename, raw_bytes) for every
    attachment with an extension the pipeline actually accepts.
    Anything else (inline images, signatures, PDFs, ...) is skipped --
    same allow-list the manual upload endpoint enforces.
    """

    attachments = []

    for part in message.walk():

        if part.get_content_maintype() == "multipart":
            continue

        raw_filename = part.get_filename()

        if not raw_filename:
            continue

        filename = decode_mime_filename(raw_filename)

        extension = ""

        if "." in filename:
            extension = "." + filename.rsplit(".", 1)[-1].lower()

        if extension not in ALLOWED_EXTENSIONS:
            continue

        payload = part.get_payload(decode=True)

        if not payload:
            continue

        attachments.append((filename, payload))

    return attachments


def extract_sender(message: Message) -> str:

    return message.get("From", "unknown@unknown")


def extract_html_body(message: Message) -> Optional[bytes]:
    """
    Falls back to the email's own HTML body when it carries no
    attachment at all -- some RFQs arrive as a table pasted directly
    into the message (e.g. an SAP export copied straight into the
    mail client) rather than a separate file. Returns None if there's
    no HTML part, or the HTML part has no <table> in it (a plain-text
    reply, a signature-only message, etc.), so the caller can tell
    "nothing to parse" apart from "found something".
    """

    for part in message.walk():

        if part.get_content_type() != "text/html":
            continue

        payload = part.get_payload(decode=True)

        if not payload:
            continue

        if b"<table" in payload.lower():
            return payload

    return None


class ImapSession:
    """
    A single IMAP connection scoped to one poll cycle for one mailbox.
    Kept open across fetch + mark-seen calls so a message is only ever
    marked \\Seen immediately after it's been successfully handed off
    for processing -- if something fails partway through a batch, the
    unprocessed messages simply stay unseen and get retried on the
    next poll instead of being silently dropped.
    """

    def __init__(self, mailbox):
        self.mailbox = mailbox
        self.conn: Optional[imaplib.IMAP4_SSL] = None

    def __enter__(self) -> "ImapSession":

        password = decrypt_password(self.mailbox.encrypted_password)

        self.conn = imaplib.IMAP4_SSL(
            self.mailbox.imap_host,
            self.mailbox.imap_port
        )

        self.conn.login(self.mailbox.username, password)
        self.conn.select(self.mailbox.folder)

        return self

    def __exit__(self, exc_type, exc_val, exc_tb):

        if not self.conn:
            return

        try:
            self.conn.close()
        except Exception:
            pass

        try:
            self.conn.logout()
        except Exception:
            pass

    def fetch_unseen(self) -> List[Tuple[str, Message]]:

        status, data = self.conn.search(None, "UNSEEN")

        if status != "OK" or not data or not data[0]:
            return []

        results = []

        for uid in data[0].split():

            status, msg_data = self.conn.fetch(uid, "(RFC822)")

            if status != "OK" or not msg_data or msg_data[0] is None:
                continue

            raw_bytes = msg_data[0][1]
            message = email.message_from_bytes(raw_bytes)

            results.append((uid.decode(), message))

        return results

    def mark_seen(self, uid: str) -> None:
        self.conn.store(uid, "+FLAGS", "\\Seen")
