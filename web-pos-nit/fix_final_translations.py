
import json
import os

def load_json(path):
    if not os.path.exists(path):
        return {}
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

en_path = "src/locales/en/translation.json"
data = load_json(en_path)

# 1. Add missing menu items
if "menu" not in data:
    data["menu"] = {}

if "stock_reconciliation" not in data["menu"]:
    data["menu"]["stock_reconciliation"] = "Stock Reconciliation"
    print("Added menu.stock_reconciliation")

# 2. Fix Khmer values (non-ASCII) in top-level or specific keys
# Based on scan_en_ascii.py output
fixes = {
    "warehouse_overview": "Warehouse Overview",
    "real_time_inventory_status": "Real-time Inventory Status",
    "total_products": "Total Products",
    "unique_items": "Unique Items",
    "total_quantity": "Total Quantity",
    "liters": "Liters",
    "volume": "Volume",
    "stock_value": "Stock Value"
}

for key, val in fixes.items():
    if key in data and any(ord(c) > 127 for c in data[key]): # Check if it's currently non-ASCII (Khmer)
        data[key] = val
        print(f"Fixed {key}: {val}")
    elif key in data and data[key] != val: # Or just update it to be safe if it matches known bad value
        # But wait, checking for non-ASCII is safer to avoid overwriting valid translations
        # However, for these specific keys, I am confident they should be English.
        data[key] = val
        print(f"Updated {key}: {val}")

# Fix specific nested if needed (none found in scan other than delete_permission_warning which is emoji)

save_json(en_path, data)
print("Final translation fixes applied.")
