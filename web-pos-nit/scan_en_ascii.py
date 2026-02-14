
import json
import os

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

en_path = 'src/locales/en/translation.json'
en_data = load_json(en_path)

def check_ascii(d, parent_key=''):
    for k, v in d.items():
        current_key = f"{parent_key}.{k}" if parent_key else k
        if isinstance(v, dict):
            check_ascii(v, current_key)
        elif isinstance(v, str):
            if any(ord(c) > 127 for c in v):
                print(f"Non-ASCII in EN: {current_key} = {v}")

print("Scanning en/translation.json for non-ASCII characters...")
check_ascii(en_data)
