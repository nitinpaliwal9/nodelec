# erp_sync_worker.py
#
# Standalone periodic price-sync loop, one process alongside the API,
# Celery worker, and email intake poller. Pricing doesn't need
# minute-level freshness the way RFQ intake does, so this defaults to
# a much longer interval.
#
# Usage:
#   python erp_sync_worker.py
#
# Config (env vars):
#   ERP_SYNC_INTERVAL_SECONDS   default 14400 (4 hours)

import os
import time

from database import SessionLocal
import models

from erp.sync import sync_organization_erp
from erp.tally_connector import TallyConnectionError, TallyResponseError

SYNC_INTERVAL_SECONDS = int(os.getenv("ERP_SYNC_INTERVAL_SECONDS", "14400"))


def sync_all_connections():

    db = SessionLocal()

    try:

        connections = (
            db.query(models.ErpConnection)
            .filter(models.ErpConnection.is_active == True)  # noqa: E712
            .all()
        )

        for connection in connections:

            try:

                stats = sync_organization_erp(db, connection)

                print(
                    f"[ERP SYNC] {connection.label or connection.host}: "
                    f"{stats}"
                )

            except (TallyConnectionError, TallyResponseError) as exc:

                print(
                    f"[ERP SYNC] FAILED for "
                    f"{connection.label or connection.host}: {exc}"
                )

    finally:
        db.close()


def run_forever():

    print(
        f"[ERP SYNC] Starting sync loop "
        f"(every {SYNC_INTERVAL_SECONDS}s)"
    )

    while True:

        try:
            sync_all_connections()

        except Exception as exc:
            print(f"[ERP SYNC] Sync cycle failed: {exc}")

        time.sleep(SYNC_INTERVAL_SECONDS)


if __name__ == "__main__":
    run_forever()
