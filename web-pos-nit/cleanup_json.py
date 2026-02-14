
import json
import re
from collections import OrderedDict

def cleanup_json(file_path):
    print(f"Cleaning up {file_path}")
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # We want to keep the structure but remove duplicate keys.
    # Parsing as JSON and dumping back will lose comments (if any) and formatting.
    # But since it's a translation file, we probably want to keep the formatting.
    
    # Let's try to parse it with a custom object_pairs_hook to see what we have.
    def keep_last(pairs):
        return OrderedDict(pairs)

    try:
        data = json.loads(content, object_pairs_hook=keep_last)
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print("Done.")
    except Exception as e:
        print(f"Error: {e}")

cleanup_json(r'c:\Users\pongc\Desktop\PO_System\family_finances\web-pos-nit\src\locales\en\translation.json')
cleanup_json(r'c:\Users\pongc\Desktop\PO_System\family_finances\web-pos-nit\src\locales\km\translation.json')
