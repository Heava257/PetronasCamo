
import re
from collections import defaultdict

file_path = r'c:\Users\pongc\Desktop\PO_System\family_finances\web-pos-nit\src\locales\TranslationContext.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

def find_range(start_marker, end_marker):
    start = -1
    end = -1
    for i, line in enumerate(lines):
        if start_marker in line and start == -1:
            start = i + 1
        if end_marker in line and start != -1:
            end = i + 1
            break # Assume first one is correct for end
    return start, end

# Simple markers for this file
km_start = 8
km_end = -1
for i, line in enumerate(lines):
    if '  en: {' in line:
        km_end = i # line before en: { and its closing brace
        break

en_start = km_end + 1
en_end = -1
for i, line in enumerate(lines[en_start:]):
    if '  }' in line:
        en_end = en_start + i + 1
        break

def find_duplicates(start_line, end_line, name):
    keys = defaultdict(list)
    key_pattern = re.compile(r'^\s*"(.*?)":')
    
    for i in range(start_line - 1, end_line):
        line = lines[i]
        match = key_pattern.search(line)
        if match:
            key = match.group(1)
            keys[key].append(i + 1)
            
    print(f"--- Duplicates in {name} (Lines {start_line}-{end_line}) ---")
    found = False
    for key, line_numbers in keys.items():
        if len(line_numbers) > 1:
            print(f"Key '{key}' found at lines: {line_numbers}")
            found = True
    if not found:
        print("No duplicates found.")

find_duplicates(8, km_end, "KM")
find_duplicates(en_start, en_end, "EN")
