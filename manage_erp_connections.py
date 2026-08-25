# manage_erp_connections.py
#
# CLI for registering an organization's Tally instance and triggering
# a price sync.
#
# Usage:
#   python manage_erp_connections.py add <organization_id> \
#       --host 192.168.1.50 --port 9000 --company "Formax Electronics" \
#       --label "Formax Tally"
#
#   python manage_erp_connections.py sync <erp_connection_id>
#   python manage_erp_connections.py list
#   python manage_erp_connections.py deactivate <erp_connection_id>

import sys
import argparse

from database import SessionLocal
import models

from erp.sync import sync_organization_erp
from erp.tally_connector import TallyConnectionError, TallyResponseError


def add_connection(organization_id: str, host: str, port: int, company_name: str, label: str):

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

        connection = models.ErpConnection(
            organization_id=org.id,
            erp_type="tally",
            label=label,
            host=host,
            port=port,
            company_name=company_name
        )

        db.add(connection)
        db.commit()
        db.refresh(connection)

        print(f"Registered Tally connection for {org.name}")
        print(f"  id: {connection.id}")
        print(f"\nNext: python manage_erp_connections.py sync {connection.id}")

    finally:
        db.close()


def sync_connection(erp_connection_id: str):

    db = SessionLocal()

    try:

        connection = (
            db.query(models.ErpConnection)
            .filter(models.ErpConnection.id == erp_connection_id)
            .first()
        )

        if not connection:
            print(f"No ERP connection found with id {erp_connection_id}")
            sys.exit(1)

        print(f"Syncing prices from {connection.host}:{connection.port} ({connection.company_name})...")

        try:

            stats = sync_organization_erp(db, connection)

            print(f"Tally items seen:     {stats['tally_items_seen']}")
            print(f"Priced (total):       {stats['matched_to_catalog']}")
            print(f"  of which new to catalog: {stats['created_from_erp']}")
            print(f"Skipped (no name):    {stats['unmatched']}")
            print("Sync succeeded.")

        except (TallyConnectionError, TallyResponseError) as exc:

            print(f"Sync failed: {exc}")
            sys.exit(1)

    finally:
        db.close()


def list_connections():

    db = SessionLocal()

    try:

        connections = db.query(models.ErpConnection).all()

        if not connections:
            print("No ERP connections registered yet.")
            return

        for c in connections:

            state = "active" if c.is_active else "deactivated"
            last_synced = c.last_synced_at or "never"

            print(f"{c.label or c.erp_type}  [{state}]  ({c.id})")
            print(f"  org: {c.organization.name}")
            print(f"  {c.host}:{c.port}  company={c.company_name!r}")
            print(f"  last synced: {last_synced}  status: {c.last_sync_status or 'n/a'}")

    finally:
        db.close()


def deactivate_connection(erp_connection_id: str):

    db = SessionLocal()

    try:

        connection = (
            db.query(models.ErpConnection)
            .filter(models.ErpConnection.id == erp_connection_id)
            .first()
        )

        if not connection:
            print(f"No ERP connection found with id {erp_connection_id}")
            sys.exit(1)

        connection.is_active = False
        db.commit()

        print(f"Deactivated {connection.label or connection.host}")

    finally:
        db.close()


if __name__ == "__main__":

    parser = argparse.ArgumentParser(description="Manage ERP (Tally) connections and price sync")
    subparsers = parser.add_subparsers(dest="command", required=True)

    p_add = subparsers.add_parser("add")
    p_add.add_argument("organization_id")
    p_add.add_argument("--host", required=True)
    p_add.add_argument("--port", type=int, default=9000)
    p_add.add_argument("--company", required=True, dest="company_name")
    p_add.add_argument("--label", default=None)

    p_sync = subparsers.add_parser("sync")
    p_sync.add_argument("erp_connection_id")

    subparsers.add_parser("list")

    p_deactivate = subparsers.add_parser("deactivate")
    p_deactivate.add_argument("erp_connection_id")

    args = parser.parse_args()

    if args.command == "add":
        add_connection(args.organization_id, args.host, args.port, args.company_name, args.label)
    elif args.command == "sync":
        sync_connection(args.erp_connection_id)
    elif args.command == "list":
        list_connections()
    elif args.command == "deactivate":
        deactivate_connection(args.erp_connection_id)
