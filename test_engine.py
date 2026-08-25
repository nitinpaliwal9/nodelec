import pandas as pd
from types import SimpleNamespace
from engine import BOMEngine

# 1. Simulating the Distributor's Active Warehouse Inventory database mirror
#    BOMEngine.match_component expects ComponentMaster-like objects --
#    id/mpn for MPN matching, manufacturer/category/description too
#    since the description-fallback path (engine/legacy_engine.py)
#    reads all three. Real ComponentMaster rows always have these;
#    this fixture needs to as well or it doesn't represent what the
#    engine actually runs against in production.
mock_warehouse_inventory = [
    SimpleNamespace(id=idx, mpn=mpn, manufacturer=mfr, category=category, description=desc)
    for idx, (mpn, mfr, category, desc) in enumerate(
        [
            ("STM32F103C8T6", "STMicroelectronics", "Integrated Circuits (ICs)", "ARM Cortex-M3 MCU"),
            ("NE555DR", "Texas Instruments", "Interface ICs", "Precision Timer SOIC-8"),
            ("NE555P", "Texas Instruments", "Interface ICs", "Precision Timer DIP-8"),
            ("RC0603JR-0710KL", "Yageo", "Passive Components", "Thick Film Resistor 10k Ohms 5% SMD 0603"),
            ("CL21A106KPCLRNC", "Samsung Electro-Mechanics", "Passive Components", "Capacitor Ceramic 10uF X5R SMD 0805"),
        ],
        start=1
    )
]

# 2. Simulating a messy incoming customer BOM spreadsheet
mock_customer_bom = {
    "Component Description": [
        "STM32F103C8T6",                 # Exact match
        "ne555 timer chip smd",          # Fuzzy match text
        "10k resistance 0603",           # Descriptive match text
        "Unknown generic chip 999XSF"    # Completely unmatched row
    ],
    "Quantity": [10, 50, 100, 5]
}

def run_local_test():
    print("--- STARTING CORE ENGINE VALIDATION TEST ---")
    df = pd.DataFrame(mock_customer_bom)
    
    for idx, row in df.iterrows():
        desc = row["Component Description"]
        qty = row["Quantity"]
        
        # Pass row parameters to the engine pipeline
        result = BOMEngine.match_component(desc, mock_warehouse_inventory)
        
        print(f"\n[Row {idx+1}] Incoming Customer Text: '{desc}'")
        print(f"       -> Matched MPN: {result['matched_mpn']}")
        print(f"       -> Match Status: {result['status'].value}")
        print(f"       -> Confidence Score: {result['confidence'] * 100}%")
        print(f"       -> Structural Tokens: {result['metadata']}")
        print("-" * 50)

if __name__ == "__main__":
    run_local_test()