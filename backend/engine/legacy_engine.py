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

    # Description-fallback matching only ever runs when MPN-based
    # matching (exact + fuzzy) found nothing, and it never auto-accepts
    # -- a description can't uniquely pin down one specific variant the
    # way an MPN can (tolerance, package, taping all get lost), so any
    # hit always lands in REVIEW regardless of score. This cutoff was
    # tuned empirically: real descriptive queries against their correct
    # part scored 70-100, unrelated/garbage queries topped out around
    # 25-26, so 65 sits well clear of that noise floor with margin.
    DESCRIPTION_MATCH_CUTOFF = 65.0

    # A description match's raw token-overlap score can legitimately
    # hit 100 -- e.g. every word in "NPN transistor general purpose"
    # appearing in some component's stored description -- but that
    # isn't the same thing as being sure it's *that* component. Unlike
    # an MPN comparison, a generic description doesn't uniquely
    # identify one part; many catalog rows could equally satisfy it.
    # Cap the confidence shown so it can never imply more certainty
    # than description matching structurally provides, and so it's
    # always visibly lower than any MPN-based fuzzy match -- the raw
    # score is kept in metadata for anyone who wants it.
    DESCRIPTION_CONFIDENCE_CEILING = 0.60

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
    # PRECOMPUTED LOOKUP BUILDERS
    # =====================================================
    # match_component() used to rebuild these from the full inventory
    # on every single call -- fine at 12 rows, but at a real catalog's
    # size (tens of thousands of rows) that means redoing the same
    # O(n) work for every line item in a BOM instead of once for the
    # whole file. Measured on a ~23,000-row catalog: rebuilding the
    # normalized-MPN dict cost ~100ms and the fuzzy search itself
    # ~75ms -- so a 120-line BOM spent the bulk of its ~30s processing
    # time on repeated setup, not on the actual matching. Callers that
    # process more than one row against the same inventory_pool (i.e.
    # worker.py) should build these once and pass them in.

    @classmethod
    def build_normalized_inventory(cls, inventory_pool: list) -> dict:

        normalized_inventory = {}

        for component in inventory_pool:

            normalized_inventory[
                cls.normalize_mpn(component.mpn)
            ] = component

        return normalized_inventory

    @classmethod
    def build_searchable_catalog(cls, inventory_pool: list):

        catalog_text = {}
        mpn_lookup = {}

        for component in inventory_pool:

            catalog_text[component.mpn] = cls.build_searchable_text(component)
            mpn_lookup[component.mpn] = component

        return catalog_text, mpn_lookup

    # =====================================================
    # DESCRIPTION / CATEGORY FALLBACK MATCHING
    # =====================================================
    # Customers frequently describe a part instead of quoting its exact
    # MPN ("10k resistor 0603" instead of "RC0603FR-0710KL"). MPN-based
    # matching never has a chance against that -- it only ever compares
    # against the .mpn string. This builds a searchable blob per
    # component (its MPN broken into word tokens, plus manufacturer/
    # category/description) and scores the input against it with
    # token-set matching, which tolerates word-order differences and
    # extra/missing words far better than the character-level scorer
    # used for MPN comparison.

    @staticmethod
    def build_searchable_text(component) -> str:

        # Break the MPN into word-like chunks too ("ESP32-WROOM-32E-N4"
        # -> "ESP32 WROOM 32E N4") so a customer naming just the family
        # prefix ("ESP32 module") still has something to match against
        # -- that prefix usually never appears in the description text.
        mpn_tokens = re.sub(
            r'[^A-Za-z0-9]+',
            ' ',
            component.mpn or ''
        )

        parts = [
            mpn_tokens,
            component.manufacturer or '',
            component.category or '',
            component.description or ''
        ]

        return ' '.join(parts).upper()

    @classmethod
    def match_by_description(
        cls,
        raw_text: str,
        inventory_pool: list,
        catalog_text: dict = None,
        mpn_lookup: dict = None
    ) -> dict:
        """
        Returns a match dict (always MatchType.REVIEW) if the input
        scores above DESCRIPTION_MATCH_CUTOFF against some component's
        searchable text, else None. Never auto-accepts -- description
        matching can identify the right *family* of part but can't
        pin down the exact variant the way an MPN comparison can.

        Pass precomputed catalog_text/mpn_lookup (see
        build_searchable_catalog) when matching many rows against the
        same inventory_pool -- otherwise this rebuilds both from
        scratch on every call.
        """

        if catalog_text is None or mpn_lookup is None:
            catalog_text, mpn_lookup = cls.build_searchable_catalog(inventory_pool)

        if not catalog_text:
            return None

        best_match = process.extractOne(
            raw_text.upper(),
            catalog_text,
            scorer=fuzz.token_set_ratio,
            score_cutoff=cls.DESCRIPTION_MATCH_CUTOFF
        )

        if not best_match:
            return None

        matched_mpn = best_match[2]

        score = float(best_match[1])

        matched_component = mpn_lookup[matched_mpn]

        return {
            "matched_id": matched_component.id,
            "matched_mpn": matched_component.mpn,
            "confidence": min(
                round(score / 100.0, 2),
                cls.DESCRIPTION_CONFIDENCE_CEILING
            ),
            "status": MatchType.REVIEW,
            "metadata": {
                "match_strategy": "description_fallback",
                "review_reason": "description_match_not_mpn",
                "description_score": score,
                "matched_against": catalog_text[matched_mpn]
            }
        }

    # =====================================================
    # MAIN MATCHING ENGINE
    # =====================================================

    @classmethod
    def match_component(
        cls,
        raw_text: str,
        inventory_pool: list,
        normalized_inventory: dict = None,
        catalog_text: dict = None,
        mpn_lookup: dict = None
    ) -> dict:
        """
        Pass precomputed normalized_inventory (build_normalized_inventory)
        and catalog_text/mpn_lookup (build_searchable_catalog) when
        matching many rows against the same inventory_pool in one batch
        -- otherwise both get rebuilt from scratch on every call, which
        is the dominant cost at real catalog sizes (see the builders'
        docstring above).
        """

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

        if normalized_inventory is None:
            normalized_inventory = cls.build_normalized_inventory(inventory_pool)

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
        # DESCRIPTION / CATEGORY FALLBACK
        # =================================================
        # Nothing matched on the MPN itself -- try matching the raw
        # text against what each component *is* (description/category/
        # manufacturer, plus the MPN broken into word tokens) before
        # giving up. Always comes back as REVIEW, never auto-accepted.

        description_match = cls.match_by_description(
            raw_text,
            inventory_pool,
            catalog_text=catalog_text,
            mpn_lookup=mpn_lookup
        )

        if description_match:

            description_match["metadata"] = {
                **tokens,
                **description_match["metadata"]
            }

            return description_match

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