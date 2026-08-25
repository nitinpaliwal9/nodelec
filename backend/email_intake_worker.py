# email_intake_worker.py
#
# Standalone polling loop for RFQ email intake. Runs alongside the
# FastAPI app and the Celery worker as its own long-lived process --
# each poll reuses the exact same BOMFile-creation + enqueue path the
# manual upload endpoint uses, so ingestion and matching behave
# identically regardless of how a file arrived.
#
# Usage:
#   python email_intake_worker.py
#
# Config (env vars):
#   MAILBOX_CREDENTIAL_KEY        required -- see email_intake/crypto.py
#   EMAIL_POLL_INTERVAL_SECONDS   default 60

import os
import sys
import time

from email_intake.poller import poll_all_mailboxes

POLL_INTERVAL_SECONDS = int(os.getenv("EMAIL_POLL_INTERVAL_SECONDS", "60"))


def run_forever():

    print(
        f"[EMAIL INTAKE] Starting poll loop "
        f"(every {POLL_INTERVAL_SECONDS}s)"
    )

    while True:

        try:
            poll_all_mailboxes()

        except Exception as exc:
            print(f"[EMAIL INTAKE] Poll cycle failed: {exc}")

        time.sleep(POLL_INTERVAL_SECONDS)


if __name__ == "__main__":

    if not os.getenv("MAILBOX_CREDENTIAL_KEY"):

        print(
            "MAILBOX_CREDENTIAL_KEY is not set. Generate one with:\n"
            "  python -c \"from cryptography.fernet import Fernet; "
            "print(Fernet.generate_key().decode())\"\n"
            "and set it in the environment before running this."
        )

        sys.exit(1)

    run_forever()
