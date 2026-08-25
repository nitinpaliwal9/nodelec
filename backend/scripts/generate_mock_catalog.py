"""
Generates a realistic ~30,000-SKU electronics distributor catalog and
a realistic "daily BOM" sampled from it, matching real distributor
inventory composition (passives dominate by volume) and real MPN
encoding conventions (EIA value codes, package/tolerance suffixes).

Synthetic generator, not a scraped real catalog -- part numbers are
internally consistent (so matches in the generated BOM are actually
correct) but not guaranteed byte-identical to a real vendor's scheme.
"""

import csv
import os
import random
import itertools

random.seed(42)

_TEST_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "test_data")
os.makedirs(_TEST_DATA_DIR, exist_ok=True)

OUT_CATALOG = os.path.join(_TEST_DATA_DIR, "mock_formax_catalog.csv")
OUT_BOM = os.path.join(_TEST_DATA_DIR, "sample_daily_bom.csv")

rows = []  # (mpn, manufacturer, description, category, lifecycle, rohs)


def take(iterable, n):
    items = list(iterable)
    random.shuffle(items)
    return items[:n]


# ==========================================================
# RESISTORS  (~11,000 SKUs -- E96 values x packages x decades x tolerance x vendor)
# ==========================================================

E96 = [
    100, 102, 105, 107, 110, 113, 115, 118, 121, 124, 127, 130, 133, 137, 140, 143,
    147, 150, 154, 158, 162, 165, 169, 174, 178, 182, 187, 191, 196, 200, 205, 210,
    215, 221, 226, 232, 237, 243, 249, 255, 261, 267, 274, 280, 287, 294, 301, 309,
    316, 324, 332, 340, 348, 357, 365, 374, 383, 392, 402, 412, 422, 432, 442, 453,
    464, 475, 487, 499, 511, 523, 536, 549, 562, 576, 590, 604, 619, 634, 649, 665,
    681, 698, 715, 732, 750, 768, 787, 806, 825, 845, 866, 887, 909, 931, 953, 976,
]
R_PACKAGES = ["0201", "0402", "0603", "0805", "1206", "1210", "2010", "2512"]
R_DECADES = [0, 1, 2, 3, 4, 5]  # ohms .. x100k
R_TOLERANCE = ["F", "J", "G"]  # 1%, 5%, 2%
R_MFRS = ["Yageo", "Vishay", "Panasonic", "KOA Speer", "Rohm"]

resistor_combos = list(itertools.product(R_PACKAGES, E96, R_DECADES))
for package, base3, decade in take(resistor_combos, 11000):
    tol = random.choice(R_TOLERANCE)
    mfr = random.choice(R_MFRS)
    value_code = f"{base3:03d}{decade}"
    ohms = base3 / 10.0 * (10 ** decade)
    if ohms >= 1_000_000:
        value_label = f"{ohms/1_000_000:g}M"
    elif ohms >= 1000:
        value_label = f"{ohms/1000:g}K"
    else:
        value_label = f"{ohms:g}"
    watt = "1/10" if package in ("0201", "0402", "0603") else "1/8" if package in ("0805", "1206") else "1/4"
    pct = "1" if tol == "F" else "5" if tol == "J" else "2"
    mpn = f"RC{package}{tol}R-{value_code}L"
    rows.append((
        mpn, mfr,
        f"Thick Film Resistor {value_label} Ohms {watt}W {pct}% SMD {package}",
        "Passive Components - Resistors",
        "ACTIVE", "COMPLIANT"
    ))

# ==========================================================
# CAPACITORS  (~7,500 SKUs)
# ==========================================================

C_VALUE_CODES = [f"{d}{z}" for d in range(10, 100) for z in range(2, 7)]
C_PACKAGES = ["0402", "0603", "0805", "1206", "1210"]
C_DIELECTRIC = ["R71H", "R71E", "R70J"]
C_VOLTAGE = ["6R3", "10", "16", "25", "50", "100"]
C_MFRS = ["Murata Electronics", "Samsung Electro-Mechanics", "TDK", "KEMET", "AVX"]
C_PREFIX = ["GRM", "CL21", "GCM"]

cap_combos = list(itertools.product(C_PACKAGES, C_VALUE_CODES, C_PREFIX))
for package, code, prefix in take(cap_combos, 7500):
    dielectric = random.choice(C_DIELECTRIC)
    voltage = random.choice(C_VOLTAGE)
    mfr = random.choice(C_MFRS)
    tolerance_char = random.choice(["K", "M", "J"])
    packaging_suffix = random.choice(["A93D", "A99L", "B93D"])
    mpn = f"{prefix}{package}{dielectric}{code}{tolerance_char}{packaging_suffix}"
    base, mult = int(code[:-1]), int(code[-1])
    pf_value = base * (10 ** mult)
    if pf_value >= 1_000_000:
        value_label = f"{pf_value/1_000_000:g}uF"
    elif pf_value >= 1000:
        value_label = f"{pf_value/1000:g}nF"
    else:
        value_label = f"{pf_value:g}pF"
    rows.append((
        mpn, mfr,
        f"Capacitor Ceramic {value_label} {voltage}V X7R {tolerance_char} SMD {package}",
        "Passive Components - Capacitors",
        "ACTIVE", "COMPLIANT"
    ))

# ==========================================================
# ICs  (~4,500 SKUs)
# ==========================================================

IC_FAMILIES = [
    ("STM32F1{:02d}{}{}T6", "STMicroelectronics", "ARM Cortex-M3 MCU", "Integrated Circuits (ICs)"),
    ("STM32F4{:02d}{}{}H6", "STMicroelectronics", "ARM Cortex-M4 MCU", "Integrated Circuits (ICs)"),
    ("STM32L0{:02d}{}{}T6", "STMicroelectronics", "ARM Cortex-M0+ Low Power MCU", "Integrated Circuits (ICs)"),
    ("ATMEGA{}{}-{}U", "Microchip Technology", "AVR 8-bit MCU", "Integrated Circuits (ICs)"),
    ("ATTINY{}{}-{}U", "Microchip Technology", "AVR 8-bit MCU (Tiny)", "Integrated Circuits (ICs)"),
    ("TPS{}{}{}DBVR", "Texas Instruments", "Buck/Boost Converter", "Power Management (PMIC)"),
    ("LM{}{}{}CM6", "Texas Instruments", "Operational Amplifier", "Interface ICs"),
    ("MAX{}{}{}ESAT", "Analog Devices / Maxim Integrated", "Precision Analog IC", "Interface ICs"),
]
IC_SUFFIXES = list(itertools.product(range(1, 90), ["A", "B", "C", "D"], ["6", "8", "U", "P"]))

ic_target = 4500
per_family = ic_target // len(IC_FAMILIES)
for template, mfr, desc, category in IC_FAMILIES:
    for n1, n2, n3 in take(IC_SUFFIXES, per_family):
        mpn = template.format(n1, n2, n3)
        rows.append((mpn, mfr, desc, category, "ACTIVE", "COMPLIANT"))

# ==========================================================
# DIODES / TRANSISTORS / MOSFETS  (~4,500 SKUs)
# ==========================================================

DISCRETE_FAMILIES = [
    ("1N{}{}WS", "Diodes Inc", "Small Signal Switching Diode", "Discrete Semiconductors"),
    ("BAV{}{}W", "Nexperia", "General Purpose Diode", "Discrete Semiconductors"),
    ("BAS{}{}L", "Nexperia", "Small Signal Diode", "Discrete Semiconductors"),
    ("2N{}{}A", "onsemi", "General Purpose NPN Transistor", "Discrete Semiconductors"),
    ("BC{}{}B", "onsemi", "General Purpose NPN Transistor", "Discrete Semiconductors"),
    ("AO{}{}A", "Alpha & Omega Semiconductor", "N-Channel MOSFET", "Discrete Semiconductors"),
    ("IRF{}{}N", "Infineon", "N-Channel Power MOSFET", "Discrete Semiconductors"),
]
DISCRETE_SUFFIXES = list(itertools.product(range(10, 999), ["", "A", "L"]))

discrete_target = 4500
per_family = discrete_target // len(DISCRETE_FAMILIES)
for template, mfr, desc, category in DISCRETE_FAMILIES:
    for n1, n2 in take(DISCRETE_SUFFIXES, per_family):
        mpn = template.format(n1, n2)
        rows.append((mpn, mfr, desc, category, "ACTIVE", "COMPLIANT"))

# ==========================================================
# CONNECTORS / INDUCTORS / CRYSTALS / MISC  (~3,000 SKUs)
# ==========================================================

MISC_FAMILIES = [
    ("HDR-{}-{}P", "Molex", "Board-to-Board Header Connector", "Connectors"),
    ("SL-{}-{}P", "JST", "Wire-to-Board Connector", "Connectors"),
    ("LQH{}N{}J", "Murata Electronics", "Chip Inductor", "Passive Components - Inductors"),
    ("XTAL-{}-{}M", "TXC Corporation", "Crystal Oscillator", "Frequency Control"),
]
MISC_SUFFIXES = list(itertools.product(range(1, 400), ["A", "B", "R2", "32"]))

misc_target = 3000
per_family = misc_target // len(MISC_FAMILIES)
for template, mfr, desc, category in MISC_FAMILIES:
    for n1, n2 in take(MISC_SUFFIXES, per_family):
        mpn = template.format(n1, n2)
        rows.append((mpn, mfr, desc, category, "ACTIVE", "COMPLIANT"))

# dedupe (families can occasionally collide)
seen = set()
deduped = []
for r in rows:
    if r[0] not in seen:
        seen.add(r[0])
        deduped.append(r)
rows = deduped

print(f"Generated {len(rows)} unique catalog rows")

with open(OUT_CATALOG, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["Manufacturer Part Number", "Manufacturer", "Description", "Category", "Lifecycle Status", "RoHS"])
    writer.writerows(rows)

# ==========================================================
# DAILY BOM -- realistic mix sampled from the catalog
# ==========================================================

BOM_SIZE = 120
bom_rows = []

catalog_mpns = [r[0] for r in rows]


def dirty_variant(mpn):
    style = random.choice(["space_suffix", "dash_drop", "case_lower", "extra_suffix", "digit_typo"])
    if style == "space_suffix" and "-" in mpn:
        return mpn.replace("-", " ", 1)
    if style == "dash_drop":
        return mpn.replace("-", "")
    if style == "case_lower":
        return mpn.lower()
    if style == "extra_suffix":
        return mpn + random.choice(["-TR", "-ND", " REEL"])
    if style == "digit_typo" and any(c.isdigit() for c in mpn):
        chars = list(mpn)
        idx = random.choice([i for i, c in enumerate(chars) if c.isdigit()])
        chars[idx] = random.choice("0123456789")
        return "".join(chars)
    return mpn


DESCRIPTIVE_TEMPLATES = [
    "10k resistor 0603",
    "0.1uF capacitor 0603",
    "N-channel mosfet",
    "small signal diode",
    "ARM cortex M3 MCU",
    "1uF ceramic cap 0805",
    "NPN transistor general purpose",
]

n_exact = int(BOM_SIZE * 0.50)
n_dirty = int(BOM_SIZE * 0.20)
n_descriptive = int(BOM_SIZE * 0.15)
n_unmatched = BOM_SIZE - n_exact - n_dirty - n_descriptive

sample_pool = random.sample(catalog_mpns, n_exact + n_dirty)

for mpn in sample_pool[:n_exact]:
    bom_rows.append((mpn, random.choice([5, 10, 25, 50, 100, 500, 1000])))

for mpn in sample_pool[n_exact:n_exact + n_dirty]:
    bom_rows.append((dirty_variant(mpn), random.choice([5, 10, 25, 50, 100])))

for _ in range(n_descriptive):
    bom_rows.append((random.choice(DESCRIPTIVE_TEMPLATES), random.choice([10, 50, 100])))

for i in range(n_unmatched):
    bom_rows.append((f"CUSTOMER-LEGACY-PART-{1000+i}", random.choice([1, 2, 5])))

random.shuffle(bom_rows)

with open(OUT_BOM, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["Part Number", "Quantity"])
    writer.writerows(bom_rows)

print(f"Generated daily BOM: {len(bom_rows)} lines "
      f"({n_exact} exact, {n_dirty} dirty, {n_descriptive} descriptive, {n_unmatched} unmatched)")
