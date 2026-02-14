
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

new_translations = {
    "menu": {
        "setup": {
            "km": "ការកំណត់",
            "en": "Setup"
        },
        "permission": {
            "km": "សិទ្ធិ",
            "en": "Permission"
        },
        "delivery": {
            "km": "ការដឹកជញ្ជូន",
            "en": "Delivery"
        },
        "employee": {
            "km": "បុគ្គលិក",
            "en": "Employee"
        }
    },
    "report": {
        "profit_loss": {
            "km": "ចំណេញ និងខាត",
            "en": "Profit & Loss"
        },
        "stock_movement_report": {
            "km": "របាយការណ៍ចលនាស្តុក",
            "en": "Stock Movement Report"
        },
        "outstanding_debt": {
            "km": "បំណុលដែលមិនទាន់បង់",
            "en": "Outstanding Debt"
        },
        "purchase_history": {
            "km": "ប្រវត្តិការទិញ",
            "en": "Purchase History"
        },
        "stock_status_report": {
            "km": "របាយការណ៍ស្ថានភាពស្តុក",
            "en": "Stock Status Report"
        },
        "payment_history": {
            "km": "ប្រវត្តិការបង់ប្រាក់",
            "en": "Payment History"
        }
    }
}

paths = {
    "km": "src/locales/km/translation.json",
    "en": "src/locales/en/translation.json"
}

for lang, path in paths.items():
    data = load_json(path)
    
    # Update Menu Items
    if "menu" not in data:
        data["menu"] = {}
        
    for key, val in new_translations["menu"].items():
        if key not in data["menu"] or (lang == "en" and data["menu"][key] == "setup"): # Force update setup
            data["menu"][key] = val[lang]
            print(f"Updated menu.{key} in {lang}")

    # Update Report Items
    if "report" not in data:
        data["report"] = {}
        
    # Handle potentially nested report structure if it exists differently (from previous fix)
    # The previous fix ensured report is a dict.
    
    for key, val in new_translations["report"].items():
        if key not in data["report"]:
            data["report"][key] = val[lang]
            print(f"Added report.{key} to {lang}")

    save_json(path, data)

print("Menu and Report translations updated successfully.")
