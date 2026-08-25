# engine/matching_core.py

import re
import dataclasses

from typing import Dict
from typing import Any
from typing import Optional
from typing import List


# ==========================================================
# RESULT OBJECT
# ==========================================================

@dataclasses.dataclass
class MatchResult:

    line_item_id: int

    input_sku: str

    matched_sku: Optional[str]

    confidence: float

    match_type: str

    resolved_price: float

    source_axis: str

    meta_notes: str


# ==========================================================
# MULTI AXIS MATCHER
# ==========================================================

class MultiAxisMatcher:

    def __init__(
        self,
        inventory_pool: Optional[List[Any]] = None
    ):

        self.inventory_pool = (
            inventory_pool or []
        )

    # ======================================================
    # SHARED NORMALIZATION
    # ======================================================

    @staticmethod
    def normalize_sku(
        sku: str
    ) -> str:

        if not sku:
            return ""

        sku = str(
            sku
        ).strip().upper()

        sku = re.sub(
            r'[-_](TR|TAPE|REEL|CUTTAPE|CT|TB|DKR)$',
            '',
            sku,
            flags=re.IGNORECASE
        )

        return re.sub(
            r'[^A-Z0-9]',
            '',
            sku
        )

    # ======================================================
    # INVENTORY LOOKUP
    # ======================================================

    def _query_inventory(
        self,
        sku_string: str
    ) -> Optional[Dict[str, Any]]:

        normalized_target = (
            self.normalize_sku(
                sku_string
            )
        )

        for component in self.inventory_pool:

            normalized_component = (
                self.normalize_sku(
                    component.mpn
                )
            )

            if (
                normalized_component
                ==
                normalized_target
            ):

                return {
                    "sku":
                        component.mpn,

                    "component_id":
                        component.id,

                    "manufacturer":
                        component.manufacturer,

                    "description":
                        component.description
                }

        return None

    # ======================================================
    # PRIMARY + SECONDARY AXIS ROUTER
    # ======================================================

    def route_dual_axis_match(
        self,
        line_id: int,
        primary_input: Any,
        secondary_input: Any
    ) -> MatchResult:

        primary = (
            str(primary_input).strip()
            if primary_input
            else ""
        )

        secondary = (
            str(secondary_input).strip()
            if secondary_input
            else ""
        )

        # --------------------------------------------------
        # PRIMARY AXIS
        # --------------------------------------------------

        if primary:

            primary_match = (
                self._query_inventory(
                    primary
                )
            )

            if primary_match:

                return MatchResult(
                    line_item_id=line_id,

                    input_sku=primary,

                    matched_sku=primary_match["sku"],

                    confidence=100.0,

                    match_type="exact",

                    resolved_price=0.0,

                    source_axis="primary_axis",

                    meta_notes=(
                        "Primary SKU match."
                    )
                )

        # --------------------------------------------------
        # SECONDARY AXIS
        # --------------------------------------------------

        if secondary:

            secondary_match = (
                self._query_inventory(
                    secondary
                )
            )

            if secondary_match:

                return MatchResult(
                    line_item_id=line_id,

                    input_sku=(
                        primary
                        if primary
                        else secondary
                    ),

                    matched_sku=secondary_match["sku"],

                    confidence=95.0,

                    match_type="cross_reference",

                    resolved_price=0.0,

                    source_axis="secondary_axis",

                    meta_notes=(
                        f"Cross-reference "
                        f"match using "
                        f"'{secondary}'."
                    )
                )

        return self._fallback(
            line_id,
            primary,
            secondary
        )

    # ======================================================
    # FALLBACK
    # ======================================================

    def _fallback(
        self,
        line_id: int,
        primary: str,
        secondary: str
    ) -> MatchResult:

        return MatchResult(

            line_item_id=line_id,

            input_sku=(
                primary
                if primary
                else secondary
            ),

            matched_sku=None,

            confidence=0.0,

            match_type="unmatched",

            resolved_price=0.0,

            source_axis="none",

            meta_notes=(
                "No inventory match found."
            )
        )