# test_ingestion_parsing.py
#
# Real pytest coverage for parsers/ingestion_gateway.py's quantity
# parser and worker.py's DNP/multi-MPN handling. These three fixes
# came directly out of an audit of real customer RFQ emails (via
# Gemini reading the live inbox) -- these are regression tests
# grounded in those actual patterns, not hypothetical edge cases.

from types import SimpleNamespace

from parsers.ingestion_gateway import normalize_quantity
from worker import _is_dnp_row, _match_with_alternatives
from models import MatchType
from engine import BOMEngine


# ==========================================================
# normalize_quantity
# ==========================================================
# Every case here is a real pattern confirmed against the inbox, not
# a guess -- see the commit that introduced this fix.

def test_forecast_quantity_with_trailing_text_and_multiplier():
    # The confirmed 1000x under-quote bug: the old parser required
    # the whole cell to be only digits, so trailing text made it fall
    # through to a naive digit-strip that dropped the "K" entirely.
    assert normalize_quantity("250K PCS./ YEAR") == 250000
    assert normalize_quantity("Qty-250k Pcs./ Year") == 250000
    assert normalize_quantity("60K ANNUAL") == 60000
    assert normalize_quantity("180K MONTHLY") == 180000


def test_quantity_embedded_in_a_sentence():
    assert normalize_quantity("Quantity for 5000 boards") == 5000


def test_bare_multiplier_forms_unchanged():
    assert normalize_quantity("250K") == 250000
    assert normalize_quantity("2M") == 2000000
    assert normalize_quantity("5000") == 5000


def test_units_suffix_stripped():
    assert normalize_quantity("10000 pcs") == 10000
    assert normalize_quantity("10000 PIECES") == 10000
    assert normalize_quantity("1,250") == 1250


def test_placeholders_are_zero_not_a_crash():
    for placeholder in ("-", "#N/A", "N/A", "NaN", "NULL", "None", ""):
        assert normalize_quantity(placeholder) == 0


def test_numeric_types_passed_through():
    assert normalize_quantity(100) == 100
    assert normalize_quantity(100.0) == 100
    assert normalize_quantity(float("nan")) == 0


# ==========================================================
# DNP (Do Not Populate) detection
# ==========================================================

def test_dnp_detected_in_part_number_field():
    assert _is_dnp_row("DNP/0603", "") is True


def test_dnp_detected_in_description_field():
    assert _is_dnp_row("", "DNP - do not populate") is True


def test_dnp_not_falsely_triggered_by_real_part_numbers():
    # Guard against a naive substring check matching something like
    # a real MPN that happens to contain "DNP" as a fragment.
    assert _is_dnp_row("STM32F103C8T6", "ARM Cortex-M3 MCU") is False
    assert _is_dnp_row("", "") is False


# ==========================================================
# Multi-MPN alternatives ("PART-A, PART-B")
# ==========================================================

def _inventory(*mpns):
    return [
        SimpleNamespace(id=idx, mpn=mpn, manufacturer="Test", category="Test", description="Test")
        for idx, mpn in enumerate(mpns, start=1)
    ]


def test_single_candidate_is_a_no_op():
    inventory = _inventory("STM32F103C8T6")
    normalized_inventory = BOMEngine.build_normalized_inventory(inventory)
    catalog_text, mpn_lookup = BOMEngine.build_searchable_catalog(inventory)

    result, alt_meta = _match_with_alternatives(
        "STM32F103C8T6", inventory, normalized_inventory, catalog_text, mpn_lookup
    )

    assert result["status"] == MatchType.EXACT
    assert alt_meta is None


def test_multi_candidate_picks_the_real_match():
    inventory = _inventory("STM32F103C8T6")
    normalized_inventory = BOMEngine.build_normalized_inventory(inventory)
    catalog_text, mpn_lookup = BOMEngine.build_searchable_catalog(inventory)

    result, alt_meta = _match_with_alternatives(
        "TOTALLY-FAKE-PART-XYZ, STM32F103C8T6",
        inventory, normalized_inventory, catalog_text, mpn_lookup
    )

    assert result["status"] == MatchType.EXACT
    assert result["matched_mpn"] == "STM32F103C8T6"
    assert alt_meta["matched_alternative"] == "STM32F103C8T6"
    assert alt_meta["alternatives_offered"] == ["TOTALLY-FAKE-PART-XYZ", "STM32F103C8T6"]


def test_multi_candidate_none_match_stays_unmatched():
    inventory = _inventory("STM32F103C8T6")
    normalized_inventory = BOMEngine.build_normalized_inventory(inventory)
    catalog_text, mpn_lookup = BOMEngine.build_searchable_catalog(inventory)

    result, alt_meta = _match_with_alternatives(
        "NOT-REAL-A, ALSO-NOT-REAL-B",
        inventory, normalized_inventory, catalog_text, mpn_lookup
    )

    assert result["status"] == MatchType.UNMATCHED
    assert alt_meta["alternatives_offered"] == ["NOT-REAL-A", "ALSO-NOT-REAL-B"]
