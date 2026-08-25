import pandas as pd
from types import SimpleNamespace
from engine import BOMEngine

# 1. Simulating the Distributor's Active Warehouse Inventory database mirror
#    BOMEngine.match_component expects ComponentMaster-like objects
#    (with .id and .mpn attributes), not raw strings.
mock_warehouse_inventory = [
    SimpleNamespace(id=idx, mpn=mpn)
    for idx, mpn in enumerate(
        [
            "STM32F103C8T6",
            "NE555DR",
            "NE555P",
            "RC0603JR-0710KL",  # Yageo 10k Resistor
            "CL21A106KPCLRNC"   # Samsung 10uF Capacitor
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