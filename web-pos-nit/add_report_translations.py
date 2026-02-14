
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
    "report": {
        "sale_summary_report": {
            "km": "របាយការណ៍សង្ខេបការលក់",
            "en": "Sales Summary Report"
        },
        "sale_summary_subtitle": {
            "km": "តាមដានដំណើរការលក់ ប្រាក់ចំណូល និងបរិមាណតាមពេលវេលាសម្រាប់ប្រេងឥន្ធនៈគ្រប់ប្រភេទ។",
            "en": "Track sales performance, revenue, and volume over time for all fuel types."
        },
        "total_revenue": {
            "km": "ប្រាក់ចំណូលសរុប",
            "en": "Total Revenue"
        },
        "total_quantity": {
            "km": "បរិមាណសរុប",
            "en": "Total Quantity"
        },
        "daily_average": {
            "km": "មធ្យមភាគប្រចាំថ្ងៃ",
            "en": "Daily Average"
        },
        "sales_performance_chart": {
            "km": "តារាងដំណើរការលក់",
            "en": "Sales Performance Chart"
        },
        "detailed_sales_data": {
            "km": "ទិន្នន័យលក់លម្អិត",
            "en": "Detailed Sales Data"
        },
        "liter": {
            "km": "លីត្រ",
            "en": "Liters"
        },
        "no_data": {
            "km": "គ្មានទិន្នន័យ",
            "en": "No Data"
        },
        "loading": {
            "km": "កំពុងដំណើរការ...",
            "en": "Loading..."
        },
        "print": {
            "km": "បោះពុម្ព",
            "en": "Print"
        },
        "pdf": {
            "km": "PDF",
            "en": "PDF"
        },
        "select_category": {
            "km": "ជ្រើសរើសប្រភេទ",
            "en": "Select Category"
        },
        "select_brand": {
            "km": "ជ្រើសរើសក្រុមហ៊ុន",
            "en": "Select Brand"
        },
        "reset": {
            "km": "កំណត់ឡើងវិញ",
            "en": "Reset"
        },
        "apply_filters": {
            "km": "អនុវត្តតម្រង",
            "en": "Apply Filters"
        },
        "order_date": {
            "km": "កាលបរិច្ឆេទ",
            "en": "Date"
        },
        "sales_amount": {
            "km": "ចំនួនទឹកប្រាក់",
            "en": "Amount"
        },
        "no": {
            "km": "ល.រ",
            "en": "No"
        },
        "total": {
            "km": "សរុប",
            "en": "Total"
        },
        "total_amount": {
            "km": "ទឹកប្រាក់សរុប",
            "en": "Total Amount"
        }
    },
    "report_label": {
        "km": "របាយការណ៍",
        "en": "Report"
    }
}

paths = {
    "km": "src/locales/km/translation.json",
    "en": "src/locales/en/translation.json"
}

for lang, path in paths.items():
    data = load_json(path)
    
    # Handle current 'report' key which might be a string
    if "report" in data:
        if isinstance(data["report"], str):
            print(f"Renaming string 'report' key to 'report_label' in {lang}")
            if "report_label" not in data:
                data["report_label"] = data["report"] # preserve existing value if needed, or overwrite
            
            # Now make report a dict
            data["report"] = {}
    else:
        data["report"] = {}

    # Add report_label explicit translation if missing or overwrite
    if "report_label" not in data:
        data["report_label"] = new_translations["report_label"][lang]

    # Add new report keys
    for key, val in new_translations["report"].items():
        data["report"][key] = val[lang]
        print(f"Updated report.{key} in {lang}")

    save_json(path, data)

print("Translations updated successfully.")
