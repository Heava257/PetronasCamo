
import json
import os

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

km_path = 'src/locales/km/translation.json'
km_data = load_json(km_path)

menu_keys = [
    "delivery", "delivery_note", "delivery_map", "delivery_reports", 
    "active_deliveries", "driver", "driver_auth", "truck",
    "pre_order_management", "supplier", "purchase_orders", 
    "inventory_transactions", "stock_reconciliation"
]

print("Checking KM keys...")
if "menu" in km_data:
    for k in menu_keys:
        if k not in km_data["menu"]:
            print(f"Missing in KM: menu.{k}")
        else:
            print(f"Found in KM: menu.{k}: {km_data['menu'][k]}")
else:
    print("Menu object missing in KM!")
