
css_content = """

/* ========================================================= */
/* OVERRIDE: Selected Item Style (Background Container + Circle) */
/* ========================================================= */
.menu-style-tree .hierarchical-menu-item.selected {
  background: var(--primary-light, rgba(59, 130, 246, 0.15)) !important;
  color: var(--primary-color, #3b82f6) !important;
  font-weight: 700 !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
  position: relative !important;
  overflow: visible !important;
  border-radius: 8px !important; 
}

.menu-style-tree .hierarchical-menu-item.selected .menu-label {
  color: var(--primary-color, #3b82f6) !important;
  font-weight: 700 !important;
}

/* Circle Indicator */
.menu-style-tree .hierarchical-menu-item.selected::after {
  content: '' !important;
  position: absolute !important;
  left: 6px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  width: 8px !important;
  height: 8px !important;
  border-radius: 50% !important;
  background-color: var(--primary-color, #3b82f6) !important;
  box-shadow: 0 0 0 2px var(--sidebar-bg, #ffffff) !important;
  z-index: 5 !important;
  display: block !important;
}
"""

with open(r'c:\Users\pongc\Desktop\PO_System\family_finances\web-pos-nit\src\component\layout\CleanDarkLayout.css', 'a', encoding='utf-8') as f:
    f.write(css_content)

print("Appended CSS successfully.")
