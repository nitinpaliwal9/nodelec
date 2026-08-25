# manage_api_keys.py
#
# CLI for provisioning tenants until a real admin UI exists (Tier 1+).
#
# Usage:
#   python manage_api_keys.py create-org "Formax Electronics"
#   python manage_api_keys.py issue-key <organization_id> [--label "Production"]
#   python manage_api_keys.py list-orgs
#   python manage_api_keys.py revoke-key <api_key_id>

import sys
import argparse

from database import SessionLocal
import models

from auth import generate_api_key, hash_api_key, PREFIX_DISPLAY_CHARS


def create_org(name: str):

    db = SessionLocal()

    try:

        org = models.Organization(name=name)
        db.add(org)
        db.commit()
        db.refresh(org)

        print(f"Created organization: {org.name}")
        print(f"  id: {org.id}")
        print(f"\nNext: python manage_api_keys.py issue-key {org.id}")

    finally:
        db.close()


def issue_key(organization_id: str, label: str = None):

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

        raw_key = generate_api_key()

        api_key = models.ApiKey(
            organization_id=org.id,
            key_hash=hash_api_key(raw_key),
            key_prefix=raw_key[:PREFIX_DISPLAY_CHARS],
            label=label
        )

        db.add(api_key)
        db.commit()

        print(f"Issued API key for: {org.name}")
        print(f"  key id: {api_key.id}")
        print(f"\n  {raw_key}\n")
        print(
            "This is shown ONCE -- only its hash is stored. "
            "Save it now; it can't be recovered later."
        )

    finally:
        db.close()


def list_orgs():

    db = SessionLocal()

    try:

        orgs = db.query(models.Organization).all()

        if not orgs:
            print("No organizations yet.")
            return

        for org in orgs:

            active_keys = [
                k for k in org.api_keys
                if k.revoked_at is None
            ]

            print(f"{org.name}  ({org.id})")
            print(f"  active keys: {len(active_keys)}")

            for k in active_keys:
                last_used = k.last_used_at or "never"
                print(f"    - {k.key_prefix}...  [{k.label or 'unlabeled'}]  last used: {last_used}")

    finally:
        db.close()


def revoke_key(api_key_id: str):

    db = SessionLocal()

    try:

        import datetime

        api_key = (
            db.query(models.ApiKey)
            .filter(models.ApiKey.id == api_key_id)
            .first()
        )

        if not api_key:
            print(f"No API key found with id {api_key_id}")
            sys.exit(1)

        api_key.revoked_at = datetime.datetime.now(datetime.timezone.utc)
        db.commit()

        print(f"Revoked key {api_key.key_prefix}...")

    finally:
        db.close()


if __name__ == "__main__":

    parser = argparse.ArgumentParser(description="Manage Nodelec tenant organizations and API keys")
    subparsers = parser.add_subparsers(dest="command", required=True)

    p_create = subparsers.add_parser("create-org")
    p_create.add_argument("name")

    p_issue = subparsers.add_parser("issue-key")
    p_issue.add_argument("organization_id")
    p_issue.add_argument("--label", default=None)

    subparsers.add_parser("list-orgs")

    p_revoke = subparsers.add_parser("revoke-key")
    p_revoke.add_argument("api_key_id")

    args = parser.parse_args()

    if args.command == "create-org":
        create_org(args.name)
    elif args.command == "issue-key":
        issue_key(args.organization_id, args.label)
    elif args.command == "list-orgs":
        list_orgs()
    elif args.command == "revoke-key":
        revoke_key(args.api_key_id)
