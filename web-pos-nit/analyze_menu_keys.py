
import re
import json
import os

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def flatten_dict(d, parent_key='', sep='.'):
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)

# Extract keys from MainLayout.jsx
layout_path = 'src/component/layout/MainLayout.jsx'
with open(layout_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to find label="menu.xyz" or label="report.xyz"
# Also supporting nested objects in the menuItems array if I parse strictly, but regex is easier for now.
# Matches: label: "menu.something" or label: "report.something"
keys_scanned = re.findall(r'label:\s*["\']((?:menu|report)\.[a-zA-Z0-9_]+)["\']', content)

# Load translations
en_path = 'src/locales/en/translation.json'
km_path = 'src/locales/km/translation.json'

en_data = load_json(en_path)
km_data = load_json(km_path)

en_flat = flatten_dict(en_data)
km_flat = flatten_dict(km_data)

print(f"Found {len(keys_scanned)} keys in MainLayout.jsx")

missing_en = []
missing_km = []
suspicious_en = []

for key in keys_scanned:
    if key not in en_flat:
        missing_en.append(key)
    else:
        # Check for suspicious values in English (e.g., non-ascii characters suggesting Khmer)
        val = en_flat[key]
        if any(ord(c) > 127 for c in val):
             suspicious_en.append((key, val))
        # Check for lowercase "setup"
        if val == "setup":
             suspicious_en.append((key, val))

    if key not in km_flat:
        missing_km.append(key)

print("\n--- Missing in EN ---")
for k in set(missing_en):
    print(k)

print("\n--- Suspicious in EN (Potential Khmer or Lowercase) ---")
for k, v in set(suspicious_en):
    print(f"{k}: {v}")

print("\n--- Missing in KM ---")
for k in set(missing_km):
    print(k)
