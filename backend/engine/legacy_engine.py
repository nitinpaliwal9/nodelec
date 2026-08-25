# engine/legacy_engine.py

import re
import pandas as pd
import numpy as np

from rapidfuzz import process, fuzz

from models import MatchType


class BOMEngine:

    # A letters-only fuzzy difference (digit runs agree) is only
    # auto-accepted above this WRatio score; anything lower goes to
    # REVIEW. Every false-positive found in testing (adversarial parts
    # that are genuinely different components) scored 92-96, so 97
    # comfortably excludes all of them while still letting through very
    # high-confidence cosmetic differences (e.g. a trailing distributor
    # suffix that isn't in the known packaging-suffix list).
    FUZZY_AUTO_ACCEPT_FLOOR = 97.0

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

        # remove common packaging suffixes (dash/underscore/space-separated --
        # real customer text uses "STM32F103C8T6 TR" as often as the
        # dashed form a distributor catalog would use)
        text = re.sub(
            r'[-_\s](TR|TAPE|REEL|CUTTAPE|CT|DKR|TB)$',
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
    # VALUE SIGNATURE (for the fuzzy-match gate below)
    # =====================================================

    @staticmethod
    def extract_digit_runs(normalized_text: str) -> list:
        """
        Every run of consecutive digits in an already-normalized MPN,
        in order. In virtually every MPN scheme (resistor/capacitor
        EIA codes, flash-size digits, revision numbers, ...) the digits
        are what actually encode the part's *value* -- letters are
        mostly package/grade/vendor codes. Two MPNs that are textually
        very similar but disagree on any digit run are, in practice,
        two different components, not a typo of each other.
        """

        return re.findall(r'\d+', normalized_text)

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

            # =============================================
            # VALUE-AWARE REVIEW GATE
            # =============================================
            # A high WRatio score only means "textually similar" --
            # it has no idea that "104" and "105" are a 10x
            # capacitance difference, or that "0710K" and "071K" are
            # different resistor values. If any digit run disagrees
            # between input and candidate, treat it as a probable
            # value/variant change and route it to REVIEW instead of
            # auto-accepting, no matter how high the text-similarity
            # score is. A letters-only difference (e.g. a distributor
            # suffix) is lower-risk, but still needs a very high score
            # before it's trusted automatically.

            input_digits = cls.extract_digit_runs(
                normalized_input
            )

            matched_digits = cls.extract_digit_runs(
                matched_normalized
            )

            digits_disagree = (
                input_digits != matched_digits
            )

            needs_review = (
                digits_disagree
                or score < cls.FUZZY_AUTO_ACCEPT_FLOOR
            )

            return {
                "matched_id":
                    matched_component.id,

                "matched_mpn":
                    matched_component.mpn,

                "confidence":
                    confidence,

                "status":
                    MatchType.REVIEW
                    if needs_review
                    else MatchType.FUZZY,

                "metadata":
                    {
                        **tokens,
                        "match_strategy":
                            "normalized_fuzzy",
                        "fuzzy_score":
                            score,
                        "input_digit_signature":
                            input_digits,
                        "matched_digit_signature":
                            matched_digits,
                        "review_reason": (
                            "digit_value_mismatch"
                            if digits_disagree
                            else "below_auto_accept_confidence"
                            if needs_review
                            else None
                        )
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