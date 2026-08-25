# test_matching_engine.py
#
# Real pytest coverage for engine/legacy_engine.py's matching gate --
# specifically the value-aware digit-run check that was the direct
# result of an earlier accuracy audit against adversarial cases
# (BC653B vs BC65B, STM32F407D9H6 vs D8H6). These are regression
# tests for that gate, not new exploration: if this file ever fails,
# the review-tier safety net has broken.

from types import SimpleNamespace

import pytest

from models import MatchType
from engine import BOMEngine


def _inventory(*rows):
    """rows: (mpn, manufacturer, category, description) tuples."""
    return [
        SimpleNamespace(id=idx, mpn=mpn, manufacturer=mfr, category=cat, description=desc)
        for idx, (mpn, mfr, cat, desc) in enumerate(rows, start=1)
    ]


def test_exact_match_on_identical_mpn():
    inventory = _inventory(
        ("STM32F103C8T6", "STMicroelectronics", "ICs", "ARM Cortex-M3 MCU")
    )

    result = BOMEngine.match_component("STM32F103C8T6", inventory)

    assert result["status"] == MatchType.EXACT
    assert result["matched_mpn"] == "STM32F103C8T6"
    assert result["confidence"] == 1.0


def test_exact_match_survives_distributor_formatting_noise():
    inventory = _inventory(
        ("STM32F103C8T6", "STMicroelectronics", "ICs", "ARM Cortex-M3 MCU")
    )

    # Real customer text: dashes, spaces, and a reel/tape suffix a
    # distributor catalog wouldn't include.
    result = BOMEngine.match_component("STM32F103-C8T6 TR", inventory)

    assert result["status"] == MatchType.EXACT
    assert result["matched_mpn"] == "STM32F103C8T6"


def test_digit_value_mismatch_forces_review_not_autoaccept():
    """
    The core regression case from the original accuracy audit: two
    genuinely different transistors (BC65B vs BC653B -- different
    digit runs, "65" vs "653") that scored high enough on raw text
    similarity to have been auto-accepted before the digit-run gate
    existed. Must always land in REVIEW, never FUZZY, regardless of
    how high the text-similarity score is.
    """
    inventory = _inventory(
        ("BC65B", "onsemi", "Discrete Semiconductors", "NPN transistor")
    )

    result = BOMEngine.match_component("BC653B", inventory)

    assert result["status"] == MatchType.REVIEW
    assert result["metadata"]["review_reason"] == "digit_value_mismatch"
    assert result["metadata"]["input_digit_signature"] != result["metadata"]["matched_digit_signature"]


def test_digit_value_mismatch_stm32_variant_suffix():
    """
    Same regression class, second real audit case: D9H6 vs D8H6 is a
    different flash-size/package variant, not a formatting difference.
    """
    inventory = _inventory(
        ("STM32F407D8H6", "STMicroelectronics", "ICs", "ARM Cortex-M4 MCU")
    )

    result = BOMEngine.match_component("STM32F407D9H6", inventory)

    assert result["status"] == MatchType.REVIEW
    assert result["metadata"]["review_reason"] == "digit_value_mismatch"


def test_letters_only_difference_below_floor_still_goes_to_review():
    """
    A trailing letter with no digit involved (e.g. "...C8T6B") scores
    96.3 by WRatio -- textually very close, but below
    FUZZY_AUTO_ACCEPT_FLOOR (97), so it must still land in REVIEW even
    though no digit disagreement is involved. Pins the actual score
    this specific pair produces so a future scoring-library upgrade
    that shifts it is caught here, not discovered in production.
    """
    inventory = _inventory(
        ("STM32F103C8T6", "STMicroelectronics", "ICs", "ARM Cortex-M3 MCU")
    )

    result = BOMEngine.match_component("STM32F103C8T6B", inventory)

    assert result["metadata"]["input_digit_signature"] == result["metadata"]["matched_digit_signature"]
    assert result["metadata"]["fuzzy_score"] == pytest.approx(96.3, abs=0.1)
    assert result["status"] == MatchType.REVIEW
    assert result["metadata"]["review_reason"] == "below_auto_accept_confidence"


def test_fuzzy_auto_accepts_above_floor_when_digits_agree():
    """
    The other side of the same gate: a near-identical MPN with no
    digit disagreement and a score comfortably above the 97 floor
    (a single trailing-letter difference on a long enough MPN that
    WRatio's length-relative scoring clears the floor) auto-accepts
    as FUZZY. A short MPN's single-char difference (see the REVIEW
    case above) does not clear it -- length matters to this score,
    which is exactly why the floor exists rather than a fixed
    edit-distance rule.
    """
    inventory = _inventory(
        ("CL211210R70J905MB93D", "Samsung", "Passives", "Chip inductor")
    )

    result = BOMEngine.match_component("CL211210R70J905MB93DX", inventory)

    assert result["metadata"]["input_digit_signature"] == result["metadata"]["matched_digit_signature"]
    assert result["metadata"]["fuzzy_score"] == pytest.approx(97.6, abs=0.1)
    assert result["metadata"]["fuzzy_score"] >= BOMEngine.FUZZY_AUTO_ACCEPT_FLOOR
    assert result["status"] == MatchType.FUZZY


def test_description_fallback_never_auto_accepts_and_caps_confidence():
    """
    When nothing matches by MPN at all, a description-text match can
    suggest the right part but must never be treated as certain --
    always REVIEW, and confidence capped at DESCRIPTION_CONFIDENCE_CEILING
    even if the raw token-overlap score was a perfect 100.
    """
    inventory = _inventory(
        ("2N945AA", "Generic", "Discrete Semiconductors", "NPN transistor general purpose")
    )

    result = BOMEngine.match_component("NPN transistor general purpose", inventory)

    assert result["status"] == MatchType.REVIEW
    assert result["matched_mpn"] == "2N945AA"
    assert result["confidence"] <= BOMEngine.DESCRIPTION_CONFIDENCE_CEILING
    assert result["metadata"]["match_strategy"] == "description_fallback"


def test_completely_unrelated_input_is_unmatched():
    inventory = _inventory(
        ("STM32F103C8T6", "STMicroelectronics", "ICs", "ARM Cortex-M3 MCU")
    )

    result = BOMEngine.match_component("XYZQ-NONSENSE-000-NOT-A-PART", inventory)

    assert result["status"] == MatchType.UNMATCHED
    assert result["matched_id"] is None


def test_blank_input_is_unmatched_not_an_error():
    inventory = _inventory(
        ("STM32F103C8T6", "STMicroelectronics", "ICs", "ARM Cortex-M3 MCU")
    )

    result = BOMEngine.match_component("   ", inventory)

    assert result["status"] == MatchType.UNMATCHED
    assert result["confidence"] == 0.0


def test_empty_inventory_pool_is_unmatched_not_a_crash():
    result = BOMEngine.match_component("STM32F103C8T6", [])

    assert result["status"] == MatchType.UNMATCHED
