
import re
from collections import defaultdict

def check_json_keys(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Match keys
    key_pattern = re.compile(r'"([^"]+)"\s*:')
    keys = key_pattern.findall(content)
    
    counts = defaultdict(int)
    for k in keys:
        counts[k] += 1
    
    dupes = {k: v for k, v in counts.items() if v > 1}
    if dupes:
        print(f"Duplicates in {file_path}:")
        for k, v in dupes.items():
            print(f"  '{k}': {v} times")
    else:
        print(f"No duplicates in {file_path}")

check_json_keys(r'c:\Users\pongc\Desktop\PO_System\family_finances\web-pos-nit\src\locales\km\translation.json')
check_json_keys(r'c:\Users\pongc\Desktop\PO_System\family_finances\web-pos-nit\src\locales\en\translation.json')
