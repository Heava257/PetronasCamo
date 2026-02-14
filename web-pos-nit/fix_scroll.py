
css_content = """

/* ========================================================= */
/* FIX: RESTORE SCROLLING (Critical)                         */
/* ========================================================= */

.hierarchical-sidebar {
  overflow: hidden !important; /* Restore border radius clipping */
}

.hierarchical-sidebar-content {
  overflow: hidden !important; /* Ensure content stays within sidebar */
}

/* Enable scrolling on the menu text container */
.menu-style-tree .menu-container,
.menu-container {
  overflow-y: auto !important; /* FORCE SCROLLING */
  overflow-x: hidden !important;
  flex: 1 1 auto !important;
  height: auto !important;
  min-height: 0 !important; /* Flexbox scroll fix */
  overscroll-behavior: contain;
}

/* Ensure the selected item fits comfortably without triggering horiz scroll */
.menu-style-tree .hierarchical-menu-item.selected {
  margin-right: 12px !important;
  margin-left: 8px !important;
  width: auto !important;
  max-width: 100% !important;
}
"""

with open(r'c:\Users\pongc\Desktop\PO_System\family_finances\web-pos-nit\src\component\layout\CleanDarkLayout.css', 'a', encoding='utf-8') as f:
    f.write(css_content)

print("Appended CSS to restore scrolling functionality.")
