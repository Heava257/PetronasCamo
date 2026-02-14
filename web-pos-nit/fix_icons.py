
css_content = """

/* ========================================================= */
/* FIX: ICON VISIBILITY & COLLAPSED STATE                    */
/* ========================================================= */

/* 1. RESTORE MENU ICONS (The "Real" Icons) */
.menu-style-tree .hierarchical-menu-item .menu-icon {
  display: block !important; /* Force icons to appear */
  width: 20px !important;
  height: 20px !important;
  min-width: 20px !important;
  margin-right: 12px !important; /* Space between icon and text */
  opacity: 0.5;
}

/* Selected State Icon */
.menu-style-tree .hierarchical-menu-item.selected .menu-icon {
  opacity: 1 !important;
  color: var(--primary-color, #3b82f6) !important;
  filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.5));
}

/* 2. REMOVE THE "DOT" (Since we are using real icons now) */
.menu-style-tree .hierarchical-menu-item.selected::after {
  display: none !important;
}

/* 3. FIX COLLAPSED STATE (Sidebar Closed) */
.hierarchical-sidebar.collapsed .menu-style-tree .hierarchical-menu-item {
  justify-content: center !important;
  padding: 0 !important;
  width: 44px !important; /* Fixed width square/circle */
  height: 44px !important;
  margin: 0 auto 4px auto !important; /* Center in sidebar */
  border-radius: 12px !important; /* Soft square */
}

/* Collapsed Selected State */
.hierarchical-sidebar.collapsed .menu-style-tree .hierarchical-menu-item.selected {
  width: 44px !important;
  height: 44px !important;
  border-radius: 12px !important;
  padding: 0 !important;
  margin: 0 auto 4px auto !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.hierarchical-sidebar.collapsed .menu-style-tree .hierarchical-menu-item .menu-icon {
  margin-right: 0 !important; /* Remove margin when icons are alone */
}

/* Hide text in collapsed state (just to be safe) */
.hierarchical-sidebar.collapsed .menu-style-tree .menu-label {
  display: none !important;
}

/* 4. ADJUST EXPANDED SELECTED STATE */
.menu-style-tree .hierarchical-menu-item.selected {
  /* Restore padding for expanded state */
  padding-left: 16px !important;
  padding-right: 16px !important;
}
"""

with open(r'c:\Users\pongc\Desktop\PO_System\family_finances\web-pos-nit\src\component\layout\CleanDarkLayout.css', 'a', encoding='utf-8') as f:
    f.write(css_content)

print("Appended CSS to restore icons and fix collapsed state.")
