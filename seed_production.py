# seed_production.py

import uuid

from database import (
    SessionLocal,
    engine
)

import models

from engine import BOMEngine

models.Base.metadata.create_all(
    bind=engine
)

# normalized_mpn / alias generation both delegate to
# BOMEngine.normalize_mpn (engine/legacy_engine.py) instead of keeping a
# second, slightly different normalizer here. The two had drifted apart
# (this one didn't strip packaging suffixes like "-TR"/"-REEL" the way
# the real matcher does), which meant seeded normalized_mpn values could
# silently disagree with what the matching engine computes at match time.

def build_aliases(mpn: str):

    aliases = set()

    aliases.add(BOMEngine.normalize_mpn(mpn))
    aliases.add(mpn.upper())

    return aliases


def seed_enterprise_pipeline_data():

    db = SessionLocal()

    try:

        if (
            db.query(
                models.ComponentMaster
            ).first()
            is not None
        ):

            print(
                "Production component cache already initialized."
            )

            return

        production_components = [

            {
                "mpn": "STM32F103C8T6",
                "manufacturer": "STMicroelectronics",
                "description": "ARM Cortex-M3 MCU",
                "category": "Integrated Circuits (ICs)",
                "lifecycle_status": "ACTIVE",
                "rohs_status": "COMPLIANT"
            },

            {
                "mpn": "ATMEGA328P-AU",
                "manufacturer": "Microchip Technology",
                "description": "AVR 8-bit MCU",
                "category": "Integrated Circuits (ICs)",
                "lifecycle_status": "ACTIVE",
                "rohs_status": "COMPLIANT"
            },

            {
                "mpn": "ESP32-WROOM-32E-N4",
                "manufacturer": "Espressif Systems",
                "description": "WiFi + BLE Module",
                "category": "RF/Wireless Modules",
                "lifecycle_status": "ACTIVE",
                "rohs_status": "COMPLIANT"
            },

            {
                "mpn": "LM7805CT/NOPB",
                "manufacturer": "Texas Instruments",
                "description": "5V Linear Regulator",
                "category": "Power Management (PMIC)",
                "lifecycle_status": "ACTIVE",
                "rohs_status": "COMPLIANT"
            },

            {
                "mpn": "TLV62569DBVR",
                "manufacturer": "Texas Instruments",
                "description": "Buck Converter",
                "category": "Power Management (PMIC)",
                "lifecycle_status": "ACTIVE",
                "rohs_status": "COMPLIANT"
            },

            {
                "mpn": "AO3400A",
                "manufacturer": "Alpha & Omega Semiconductor",
                "description": "N-Channel MOSFET",
                "category": "Discrete Semiconductors",
                "lifecycle_status": "ACTIVE",
                "rohs_status": "COMPLIANT"
            },

            {
                "mpn": "GRM188R71H104KA93D",
                "manufacturer": "Murata Electronics",
                "description": "0.1uF 0603 MLCC",
                "category": "Passive Components",
                "lifecycle_status": "ACTIVE",
                "rohs_status": "COMPLIANT"
            },

            {
                "mpn": "GRM21BR71E105KA99L",
                "manufacturer": "Murata Electronics",
                "description": "1uF 0805 MLCC",
                "category": "Passive Components",
                "lifecycle_status": "ACTIVE",
                "rohs_status": "COMPLIANT"
            },

            {
                "mpn": "RC0603FR-0710KL",
                "manufacturer": "Yageo",
                "description": "10K 0603 Resistor",
                "category": "Passive Components",
                "lifecycle_status": "ACTIVE",
                "rohs_status": "COMPLIANT"
            },

            {
                "mpn": "RC0805FR-071KL",
                "manufacturer": "Yageo",
                "description": "1K 0805 Resistor",
                "category": "Passive Components",
                "lifecycle_status": "ACTIVE",
                "rohs_status": "COMPLIANT"
            },

            {
                "mpn": "PC817X3NSZ0F",
                "manufacturer": "Sharp Microelectronics",
                "description": "Optocoupler",
                "category": "Optoelectronics",
                "lifecycle_status": "ACTIVE",
                "rohs_status": "COMPLIANT"
            },

            {
                "mpn": "MAX3232CSE+T",
                "manufacturer": "Analog Devices",
                "description": "RS232 Transceiver",
                "category": "Interface ICs",
                "lifecycle_status": "ACTIVE",
                "rohs_status": "COMPLIANT"
            }
        ]

        print(
            "Initializing production component inventory..."
        )

        for item in production_components:

            component = models.ComponentMaster(
                id=uuid.uuid4(),
                mpn=item["mpn"],
                normalized_mpn=BOMEngine.normalize_mpn(item["mpn"]),
                manufacturer=item["manufacturer"],
                description=item["description"],
                category=item["category"],
                lifecycle_status=item["lifecycle_status"],
                rohs_status=item["rohs_status"]
            )

            db.add(component)

            db.flush()

            # -----------------------------------------
            # Pre-seed common aliases
            # -----------------------------------------

            aliases = build_aliases(
                item["mpn"]
            )

            for alias in aliases:

                existing = (
                    db.query(
                        models.PartAlias
                    )
                    .filter(
                        models.PartAlias.dirty_string
                        == alias
                    )
                    .first()
                )

                if not existing:

                    db.add(
                        models.PartAlias(
                            dirty_string=alias,
                            resolved_component_id=component.id
                        )
                    )

        db.commit()

        print(
            "Production inventory initialized successfully."
        )

    except Exception as e:

        db.rollback()

        print(
            f"Deployment Error: {e}"
        )

        raise

    finally:

        db.close()


if __name__ == "__main__":

    seed_enterprise_pipeline_data()