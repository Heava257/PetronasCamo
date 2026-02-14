
import json
import os

def check_json_dupes(file_path):
    print(f"--- Checking {file_path} ---")
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple manual check for duplicates since json.load overrides them
    import re
    key_pattern = re.compile(r'"(.*?)"\s*:')
    keys = key_pattern.findall(content)
    
    seen = {}
    dupes = []
    for i, key in enumerate(keys):
        if key in seen:
            dupes.append(key)
        seen[key] = i
        
    if dupes:
        print(f"Found duplicates: {list(set(dupes))}")
    else:
        print("No duplicates found.")

check_json_dupes(r'c:\Users\pongc\Desktop\PO_System\family_finances\web-pos-nit\src\locales\en\translation.json')
check_json_dupes(r'c:\Users\pongc\Desktop\PO_System\family_finances\web-pos-nit\src\locales\km\translation.json')
