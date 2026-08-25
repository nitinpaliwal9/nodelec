# engine/legacy_engine.py

import re
import pandas as pd
import numpy as np

from rapidfuzz import process, fuzz

from models import MatchType


class BOMEngine:

    # =====================================================
    # NORMALIZATION
    # =====================================================

    @staticmethod
    def normalize_mpn(text: str) -> str:
        """
        Converts distributor-specific variants into a
        canonical alphanumeric format.

        Examples:

        STM32F103-C8T6
        STM32F103 C8T6
        STM32F103C8T6

        become:

        STM32F103C8T6
        """

        if text is None:
            return ""

        text = str(text).strip().upper()

        if text in ("", "NAN", "NONE"):
            return ""

        # remove common packaging suffixes
        text = re.sub(
            r'[-_](TR|TAPE|REEL|CUTTAPE|CT|DKR|TB)$',
            '',
            text,
            flags=re.IGNORECASE
        )

        return re.sub(
            r'[^A-Z0-9]',
            '',
            text
        )

    # =====================================================
    # DATAFRAME PREPROCESSOR
    # =====================================================

    @staticmethod
    def preprocess_dataframe(
        df: pd.DataFrame
    ) -> pd.DataFrame:

        if "quantity" in df.columns:

            df["quantity"] = (
                pd.to_numeric(
                    df["quantity"],
                    errors="coerce"
                )
                .fillna(0)
                .astype(int)
            )

        if "part_number" in df.columns:

            df["part_number"] = (
                df["part_number"]
                .replace(
                    [np.nan, None],
                    ""
                )
                .astype(str)
                .str.strip()
            )

        return df

    # =====================================================
    # TOKEN EXTRACTION
    # =====================================================

    @staticmethod
    def tokenize_component_string(
        text: str
    ) -> dict:

        text = str(text).upper().strip()

        resistance = re.findall(
            r'(\d+K\d+|\d+M\d+|\d+[KMR])',
            text
        )

        capacitance = re.findall(
            r'(\d+\.?\d*[UNP]F|\d+PF)',
            text
        )

        package = re.findall(
            r'(0603|0805|1206|0402|SOT-23|SOP-?8|DIP-?8|LQFP-?\d+)',
            text
        )

        return {
            "normalized_input": BOMEngine.normalize_mpn(text),

            "extracted_resistance":
                resistance[0]
                if resistance else None,

            "extracted_capacitance":
                capacitance[0]
                if capacitance else None,

            "extracted_package":
                package[0]
                if package else None
        }

    # =====================================================
    # MAIN MATCHING ENGINE
    # =====================================================

    @classmethod
    def match_component(
        cls,
        raw_text: str,
        inventory_pool: list
    ) -> dict:

        raw_text = str(
            raw_text
        ).strip()

        if not raw_text:

            return {
                "matched_id": None,
                "matched_mpn": None,
                "confidence": 0.0,
                "status": MatchType.UNMATCHED,
                "metadata": {}
            }

        tokens = cls.tokenize_component_string(
            raw_text
        )

        normalized_input = (
            tokens["normalized_input"]
        )

        if not normalized_input:

            return {
                "matched_id": None,
                "matched_mpn": None,
                "confidence": 0.0,
                "status": MatchType.UNMATCHED,
                "metadata": tokens
            }

        # =================================================
        # EXACT NORMALIZED MATCH
        # =================================================

        normalized_inventory = {}

        for component in inventory_pool:

            normalized_mpn = (
                cls.normalize_mpn(
                    component.mpn
                )
            )

            normalized_inventory[
                normalized_mpn
            ] = component

        exact_match = normalized_inventory.get(
            normalized_input
        )

        if exact_match:

            return {
                "matched_id":
                    exact_match.id,

                "matched_mpn":
                    exact_match.mpn,

                "confidence":
                    1.0,

                "status":
                    MatchType.EXACT,

                "metadata":
                    {
                        **tokens,
                        "match_strategy":
                            "normalized_exact"
                    }
            }

        # =================================================
        # FUZZY MATCH
        # =================================================

        normalized_choices = list(
            normalized_inventory.keys()
        )

        if not normalized_choices:

            return {
                "matched_id": None,
                "matched_mpn": None,
                "confidence": 0.0,
                "status": MatchType.UNMATCHED,
                "metadata": tokens
            }

        best_match = process.extractOne(
            normalized_input,
            normalized_choices,
            scorer=fuzz.WRatio,
            score_cutoff=80
        )

        if best_match:

            matched_normalized = (
                best_match[0]
            )

            score = (
                float(best_match[1])
            )

            matched_component = (
                normalized_inventory[
                    matched_normalized
                ]
            )

            confidence = round(
                score / 100.0,
                2
            )

            return {
                "matched_id":
                    matched_component.id,

                "matched_mpn":
                    matched_component.mpn,

                "confidence":
                    confidence,

                "status":
                    MatchType.FUZZY,

                "metadata":
                    {
                        **tokens,
                        "match_strategy":
                            "normalized_fuzzy",
                        "fuzzy_score":
                            score
                    }
            }

        # =================================================
        # UNMATCHED
        # =================================================

        return {
            "matched_id": None,
            "matched_mpn": None,
            "confidence": 0.0,
            "status": MatchType.UNMATCHED,
            "metadata": {
                **tokens,
                "match_strategy":
                    "unmatched"
            }
        }