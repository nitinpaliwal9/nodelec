import os
from celery import Celery

from database import SessionLocal
import models

from engine import BOMEngine
from parsers.ingestion_gateway import stream_and_clean_qrf

REDIS_URL = os.getenv(
    "REDIS_URL",
    "redis://localhost:6379/0"
)

celery_app = Celery(
    "bom_tasks",
    broker=REDIS_URL,
    backend=REDIS_URL
)

# ==========================================================
# BROKER RELIABILITY CONFIG
# ==========================================================
# Without these, a downed broker makes .delay() calls hang or
# retry silently for a long time instead of failing fast, which
# leaves the HTTP request (and the caller) hanging indefinitely.

celery_app.conf.update(
    broker_transport_options={
        "socket_connect_timeout": 3,
        "socket_timeout": 3,
    },
    broker_connection_retry_on_startup=False,
    broker_connection_retry=False,
    broker_connection_max_retries=1,
    task_publish_retry=False,
)


@celery_app.task(name="process_bom_file_async")
def process_bom_file_async(file_id: str):

    db = SessionLocal()
    bom_file = None

    try:

        # =====================================================
        # FETCH FILE
        # =====================================================

        bom_file = (
            db.query(models.BOMFile)
            .filter(
                models.BOMFile.id == file_id
            )
            .first()
        )

        if not bom_file:
            return (
                f"File record not found: {file_id}"
            )

        bom_file.status = (
            models.FileStatus.PROCESSING
        )

        db.commit()

        # =====================================================
        # LOAD FILE CONTENT
        # =====================================================

        with open(
            bom_file.file_path,
            "rb"
        ) as f:
            file_bytes = f.read()

        # =====================================================
        # INGESTION GATEWAY
        # =====================================================

        df, metadata = (
            stream_and_clean_qrf(
                file_bytes=file_bytes,
                file_name=os.path.basename(
                    bom_file.file_path
                )
            )
        )

        if df.empty:

            raise ValueError(
                "No valid BOM rows detected after parsing"
            )

        # =====================================================
        # DISTRIBUTOR METADATA
        # =====================================================

        distributor = metadata.get(
            "distributor",
            "unknown"
        )

        if distributor and distributor != "unknown":
            bom_file.distributor_id = distributor

        # =====================================================
        # VALIDATE REQUIRED COLUMN
        # =====================================================

        if "part_number" not in df.columns:

            raise ValueError(
                "Canonical column 'part_number' not found"
            )

        if "quantity" not in df.columns:

            raise ValueError(
                "Canonical column 'quantity' not found "
                "(refusing to silently default every row's "
                "quantity to 1)"
            )

        # =====================================================
        # LOAD INVENTORY ONCE
        # =====================================================

        master_pool = (
            db.query(
                models.ComponentMaster
            )
            .all()
        )

        if not master_pool:

            raise ValueError(
                "ComponentMaster inventory is empty"
            )

        # =====================================================
        # PROCESS ROWS
        # =====================================================

        for index, row in df.iterrows():

            raw_text = str(
                row.get(
                    "part_number",
                    ""
                )
            ).strip()

            if not raw_text:
                continue

            qty = int(
                row.get(
                    "quantity",
                    1
                )
            )

            # -------------------------------------------------
            # ALIAS CACHE
            # -------------------------------------------------

            known_alias = (
                db.query(
                    models.PartAlias
                )
                .filter(
                    models.PartAlias.dirty_string
                    == raw_text
                )
                .first()
            )

            if known_alias:

                db.add(
                    models.BOMRow(
                        file_id=bom_file.id,
                        row_number=index + 1,
                        raw_component_text=raw_text,
                        requested_quantity=qty,
                        matched_component_id=known_alias.resolved_component_id,
                        matched_mpn=known_alias.component.mpn,
                        match_confidence=1.0,
                        match_status=models.MatchType.EXACT,
                        extracted_metadata={
                            "source": "alias_cache_hit"
                        }
                    )
                )

                continue

            # -------------------------------------------------
            # MATCH ENGINE
            # -------------------------------------------------

            match_res = (
                BOMEngine.match_component(
                    raw_text,
                    master_pool
                )
            )

            db.add(
                models.BOMRow(
                    file_id=bom_file.id,
                    row_number=index + 1,
                    raw_component_text=raw_text,
                    requested_quantity=qty,
                    matched_component_id=match_res["matched_id"],
                    matched_mpn=match_res["matched_mpn"],
                    match_confidence=match_res["confidence"],
                    match_status=match_res["status"],
                    extracted_metadata={
                        **match_res["metadata"],
                        "distributor": distributor,
                        "customer_name": metadata.get(
                            "customer_name"
                        )
                    }
                )
            )

            # -------------------------------------------------
            # LEARN ALIASES
            # -------------------------------------------------

            if (
                match_res["status"]
                == models.MatchType.EXACT
                and match_res["matched_id"]
            ):

                existing_alias = (
                    db.query(
                        models.PartAlias
                    )
                    .filter(
                        models.PartAlias.dirty_string
                        == raw_text
                    )
                    .first()
                )

                if not existing_alias:

                    db.add(
                        models.PartAlias(
                            dirty_string=raw_text,
                            resolved_component_id=match_res[
                                "matched_id"
                            ]
                        )
                    )

            # -------------------------------------------------
            # AUDIT TRAIL
            # -------------------------------------------------

            if (
                match_res["status"]
                == models.MatchType.UNMATCHED
            ):

                db.add(
                    models.UnmatchedPart(
                        file_id=bom_file.id,
                        raw_part_number=raw_text,
                        quantity=qty,
                        reason="No matching component found"
                    )
                )

        # =====================================================
        # COMPLETE
        # =====================================================

        bom_file.status = (
            models.FileStatus.COMPLETED
        )

        db.commit()

        return (
            f"Successfully processed "
            f"file {file_id}"
        )

    except Exception as e:

        db.rollback()

        # -----------------------------------------------------
        # PROCESSING ERROR LOG
        # -----------------------------------------------------

        try:

            db.add(
                models.ProcessingError(
                    file_id=file_id,
                    stage="worker_pipeline",
                    error_message=str(e)
                )
            )

            db.commit()

        except Exception:
            db.rollback()

        # -----------------------------------------------------
        # MARK FAILED
        # -----------------------------------------------------

        try:

            if bom_file:

                bom_file.status = (
                    models.FileStatus.FAILED
                )

                db.commit()

        except Exception:
            db.rollback()

        return (
            f"Pipeline failed: {str(e)}"
        )

    finally:

        db.close()