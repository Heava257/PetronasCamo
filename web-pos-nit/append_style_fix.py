
css_content = """

/* ========================================================= */
/* OVERRIDE: Refined Tree Active Style (Pill Shape + Dot)    */
/* ========================================================= */

/* 1. The Container - Pill Shape */
.menu-style-tree .hierarchical-menu-item.selected {
  background: var(--primary-light, rgba(59, 130, 246, 0.15)) !important;
  color: var(--primary-color, #3b82f6) !important;
  font-weight: 700 !important;
  border-radius: 50px !important; /* Circle/Pill Style */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
  position: relative !important;
  overflow: visible !important;
  padding-left: 32px !important; /* Space for the dot */
}

/* 2. The Text */
.menu-style-tree .hierarchical-menu-item.selected .menu-label {
  color: var(--primary-color, #3b82f6) !important;
  font-weight: 700 !important;
}

/* 3. The Circle (Dot) Indicator */
.menu-style-tree .hierarchical-menu-item.selected::after {
  content: '' !important;
  position: absolute !important;
  left: 10px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  width: 10px !important;
  height: 10px !important;
  border-radius: 50% !important;
  background-color: var(--primary-color, #3b82f6) !important;
  box-shadow: 0 0 0 3px var(--sidebar-bg, #ffffff) !important;
  z-index: 10 !important;
  display: block !important;
}

/* Force hidden icon in tree view to avoid clutter if dot is used */
.menu-style-tree .hierarchical-menu-item .menu-icon {
  display: none !important;
}
"""

with open(r'c:\Users\pongc\Desktop\PO_System\family_finances\web-pos-nit\src\component\layout\CleanDarkLayout.css', 'a', encoding='utf-8') as f:
    f.write(css_content)

print("Appended refined Tree Menu CSS active styles.")
