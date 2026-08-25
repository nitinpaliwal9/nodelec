# manage_mailboxes.py
#
# CLI for registering the inbox an organization's customers send RFQs
# to. Run this yourself so the raw password only ever passes through
# your own terminal, never through chat or a shared log.
#
# Usage:
#   python manage_mailboxes.py add <organization_id> \
#       --host imap.gmail.com --port 993 \
#       --username rfq@formax.example --label "Formax RFQ intake"
#     (prompts for the password interactively -- doesn't take it as a flag)
#
#   python manage_mailboxes.py list
#   python manage_mailboxes.py deactivate <mailbox_id>

import sys
import getpass
import argparse

from database import SessionLocal
import models

from email_intake.crypto import encrypt_password


def add_mailbox(organization_id: str, host: str, port: int, username: str, folder: str, label: str):

    db = SessionLocal()

    try:

        org = (
            db.query(models.Organization)
            .filter(models.Organization.id == organization_id)
            .first()
        )

        if not org:
            print(f"No organization found with id {organization_id}")
            sys.exit(1)

        password = getpass.getpass(f"IMAP password for {username}: ")

        if not password:
            print("No password entered, aborting.")
            sys.exit(1)

        mailbox = models.MailboxConnection(
            organization_id=org.id,
            label=label,
            imap_host=host,
            imap_port=port,
            username=username,
            encrypted_password=encrypt_password(password),
            folder=folder
        )

        db.add(mailbox)
        db.commit()
        db.refresh(mailbox)

        print(f"Registered mailbox {username} for {org.name}")
        print(f"  id: {mailbox.id}")

    finally:
        db.close()


def list_mailboxes():

    db = SessionLocal()

    try:

        mailboxes = db.query(models.MailboxConnection).all()

        if not mailboxes:
            print("No mailboxes registered yet.")
            return

        for mb in mailboxes:

            state = "active" if mb.is_active else "deactivated"
            last_polled = mb.last_polled_at or "never"

            print(f"{mb.username}  [{state}]  ({mb.id})")
            print(f"  org: {mb.organization.name}")
            print(f"  label: {mb.label or 'unlabeled'}")
            print(f"  {mb.imap_host}:{mb.imap_port}  folder={mb.folder}")
            print(f"  last polled: {last_polled}")

    finally:
        db.close()


def deactivate_mailbox(mailbox_id: str):

    db = SessionLocal()

    try:

        mailbox = (
            db.query(models.MailboxConnection)
            .filter(models.MailboxConnection.id == mailbox_id)
            .first()
        )

        if not mailbox:
            print(f"No mailbox found with id {mailbox_id}")
            sys.exit(1)

        mailbox.is_active = False
        db.commit()

        print(f"Deactivated {mailbox.username}")

    finally:
        db.close()


if __name__ == "__main__":

    parser = argparse.ArgumentParser(description="Manage RFQ intake mailboxes")
    subparsers = parser.add_subparsers(dest="command", required=True)

    p_add = subparsers.add_parser("add")
    p_add.add_argument("organization_id")
    p_add.add_argument("--host", required=True)
    p_add.add_argument("--port", type=int, default=993)
    p_add.add_argument("--username", required=True)
    p_add.add_argument("--folder", default="INBOX")
    p_add.add_argument("--label", default=None)

    subparsers.add_parser("list")

    p_deactivate = subparsers.add_parser("deactivate")
    p_deactivate.add_argument("mailbox_id")

    args = parser.parse_args()

    if args.command == "add":
        add_mailbox(args.organization_id, args.host, args.port, args.username, args.folder, args.label)
    elif args.command == "list":
        list_mailboxes()
    elif args.command == "deactivate":
        deactivate_mailbox(args.mailbox_id)
