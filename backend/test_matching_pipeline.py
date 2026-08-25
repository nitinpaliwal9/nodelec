# test_matching_pipeline.py

import os
import pandas as pd

from database import SessionLocal
import models

from parsers.ingestion_gateway import (
    stream_and_clean_qrf
)

from engine import BOMEngine


def execute_pipeline_integration_test():

    print("=" * 80)
    print("NODELEC BOM PIPELINE INTEGRATION TEST")
    print("=" * 80)

    target_file = "formax-demo-qrf.xlsx"

    if not os.path.exists(target_file):

        print(
            f"[FAIL] Missing test file: "
            f"{target_file}"
        )

        return

    with open(
        target_file,
        "rb"
    ) as f:

        file_bytes = f.read()

    # =====================================================
    # PHASE 1
    # =====================================================

    print("\n[PHASE 1]")
    print("Gateway Parsing")

    df, metadata = stream_and_clean_qrf(
        file_bytes,
        file_name=target_file
    )

    print(
        f"Rows Extracted: {len(df)}"
    )

    print(
        f"Distributor: "
        f"{metadata.get('distributor')}"
    )

    print(
        f"Customer: "
        f"{metadata.get('customer_name')}"
    )

    print(
        f"Columns: "
        f"{list(df.columns)}"
    )

    # =====================================================
    # PHASE 2
    # =====================================================

    print("\n[PHASE 2]")
    print("Inventory Loading")

    db = SessionLocal()

    try:

        master_pool = (
            db.query(
                models.ComponentMaster
            )
            .all()
        )

        print(
            f"Inventory Size: "
            f"{len(master_pool)}"
        )

        if not master_pool:

            print(
                "[FAIL] ComponentMaster empty."
            )

            return

        # =================================================
        # PHASE 3
        # =================================================

        print("\n[PHASE 3]")
        print("Matching Engine")

        compiled_results = []

        exact_hits = 0
        fuzzy_hits = 0
        unmatched_hits = 0

        for index, row in df.iterrows():

            raw_part = str(
                row.get(
                    "part_number",
                    ""
                )
            ).strip()

            qty = int(
                row.get(
                    "quantity",
                    0
                )
            )

            if not raw_part:
                continue

            result = (
                BOMEngine.match_component(
                    raw_part,
                    master_pool
                )
            )

            if (
                result["status"]
                == models.MatchType.EXACT
            ):
                exact_hits += 1

            elif (
                result["status"]
                == models.MatchType.FUZZY
            ):
                fuzzy_hits += 1

            else:
                unmatched_hits += 1

            compiled_results.append(
                {
                    "Row":
                        index + 1,

                    "Part Number":
                        raw_part,

                    "Qty":
                        qty,

                    "Matched":
                        result["matched_mpn"],

                    "Confidence":
                        round(
                            result["confidence"]
                            * 100,
                            2
                        ),

                    "Status":
                        result["status"].value
                }
            )

        # =================================================
        # OUTPUT
        # =================================================

        output_df = pd.DataFrame(
            compiled_results
        )

        print(
            "\n"
            + "=" * 80
        )

        print(
            output_df.to_string(
                index=False
            )
        )

        print(
            "=" * 80
        )

        print("\nSUMMARY")

        print(
            f"Exact Matches: "
            f"{exact_hits}"
        )

        print(
            f"Fuzzy Matches: "
            f"{fuzzy_hits}"
        )

        print(
            f"Unmatched: "
            f"{unmatched_hits}"
        )

        total = (
            exact_hits
            + fuzzy_hits
            + unmatched_hits
        )

        if total:

            success_rate = round(
                (
                    (
                        exact_hits
                        + fuzzy_hits
                    )
                    / total
                )
                * 100,
                2
            )

            print(
                f"Match Rate: "
                f"{success_rate}%"
            )

        print(
            "\n[OK] Integration Test Complete"
        )

    finally:

        db.close()


if __name__ == "__main__":

    execute_pipeline_integration_test()