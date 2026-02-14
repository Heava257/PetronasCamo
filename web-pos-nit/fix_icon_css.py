
import os

file_path = r'c:\Users\pongc\Desktop\PO_System\family_finances\web-pos-nit\src\component\layout\CleanDarkLayout.css'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Target block to disable
target_block = """/* Force hidden icon in tree view to avoid clutter if dot is used */
.menu-style-tree .hierarchical-menu-item .menu-icon {
  display: none !important;
}"""

replacement_block = """/* Force hidden icon in tree view to avoid clutter if dot is used */
.menu-style-tree .hierarchical-menu-item .menu-icon {
  /* display: none !important; DISABLED */
}"""

if target_block in content:
    new_content = content.replace(target_block, replacement_block)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully commented out icon hiding CSS.")
else:
    print("Could not find the target CSS block. Trying fuzzy match or manual check needed.")
    # Attempt more robust replacement if exact match fails due to line endings
    normalized_content = content.replace('\r\n', '\n')
    normalized_target = target_block.replace('\r\n', '\n')
    if normalized_target in normalized_content:
        print("Found with normalized line endings. Applying fix...")
        new_content = normalized_content.replace(normalized_target, replacement_block)
        with open(file_path, 'w', encoding='utf-8') as f: # write with default line endings
            f.write(new_content)
        print("Successfully commented out icon hiding CSS (normalized).")
    else:
        print("Still could not find target block.")
