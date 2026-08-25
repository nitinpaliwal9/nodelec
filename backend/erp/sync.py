# erp/sync.py

import datetime

import models
from engine import BOMEngine

from erp.tally_connector import (
    fetch_stock_items,
    TallyConnectionError,
    TallyResponseError
)


def sync_organization_erp(db, erp_connection: "models.ErpConnection") -> dict:
    """
    Pulls stock items from the connection's Tally instance, matches
    each one to the shared ComponentMaster catalog by normalized name
    (the same normalization the matching engine itself uses, so a
    Tally item named "STM32F103C8T6-TR" and a BOM line for the same
    part resolve to the same normalized key), and upserts a
    ComponentPrice row per match scoped to this organization.

    Records success/failure on the connection itself either way, then
    re-raises on failure so a caller (CLI, scheduled worker) still
    sees it happened.
    """

    stats = {
        "tally_items_seen": 0,
        "matched_to_catalog": 0,
        "unmatched": 0
    }

    try:

        stock_items = fetch_stock_items(
            erp_connection.host,
            erp_connection.port,
            erp_connection.company_name
        )

    except (TallyConnectionError, TallyResponseError) as exc:

        erp_connection.last_sync_status = f"failed: {exc}"
        erp_connection.last_synced_at = datetime.datetime.now(datetime.timezone.utc)
        db.commit()

        raise

    stats["tally_items_seen"] = len(stock_items)

    catalog = db.query(models.ComponentMaster).all()

    normalized_lookup = {
        BOMEngine.normalize_mpn(component.mpn): component
        for component in catalog
    }

    for item in stock_items:

        normalized_name = BOMEngine.normalize_mpn(item["name"])

        component = normalized_lookup.get(normalized_name)

        if not component:
            stats["unmatched"] += 1
            continue

        existing = (
            db.query(models.ComponentPrice)
            .filter(
                models.ComponentPrice.organization_id == erp_connection.organization_id,
                models.ComponentPrice.component_id == component.id
            )
            .first()
        )

        if existing:

            existing.unit_price = item["rate"]
            existing.stock_quantity = item["stock_quantity"]
            existing.synced_at = datetime.datetime.now(datetime.timezone.utc)

        else:

            db.add(
                models.ComponentPrice(
                    organization_id=erp_connection.organization_id,
                    component_id=component.id,
                    unit_price=item["rate"],
                    stock_quantity=item["stock_quantity"],
                    source="tally"
                )
            )

        stats["matched_to_catalog"] += 1

    erp_connection.last_sync_status = "success"
    erp_connection.last_synced_at = datetime.datetime.now(datetime.timezone.utc)

    db.commit()

    return stats
