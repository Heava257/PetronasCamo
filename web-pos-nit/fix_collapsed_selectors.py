
css_content = """

/* ========================================================= */
/* CRITICAL FIX 2: CORRECT SELECTORS FOR COLLAPSED STATE      */
/* ========================================================= */

/* Note: .menu-style-tree is typically on the ROOT (html), so it must be 
   ROOT .sidebar, not .sidebar .ROOT */

/* 1. DISABLE TREE LINES (Blocking Clicks) - CORRECTED SELECTOR */
:root.menu-style-tree .hierarchical-sidebar.collapsed .tree-node::before,
:root.menu-style-tree .hierarchical-sidebar.collapsed .tree-node::after,
:root.menu-style-tree .hierarchical-sidebar.collapsed .has-children::after {
  display: none !important;
  pointer-events: none !important;
  content: none !important;
}

/* 2. RESET ITEM LAYOUT & CLICKABILITY - CORRECTED SELECTOR */
:root.menu-style-tree .hierarchical-sidebar.collapsed .hierarchical-menu-item {
  width: 44px !important;
  height: 44px !important;
  margin: 4px auto !important;
  padding: 0 !important;
  border-radius: 12px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  
  cursor: pointer !important;
  pointer-events: auto !important; /* Force Clickable */
  
  position: relative !important;
  z-index: 1000 !important; /* Lift above everything */
  
  /* Reset Glass/Tree Styles for Icon View */
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
  backdrop-filter: none !important;
}

/* 3. ACTIVE STATE (Collapsed) */
:root.menu-style-tree .hierarchical-sidebar.collapsed .hierarchical-menu-item.selected {
  background: rgba(59, 130, 246, 0.2) !important;
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.2) !important;
}

:root.menu-style-tree .hierarchical-sidebar.collapsed .hierarchical-menu-item.selected .menu-icon {
  color: #3b82f6 !important;
  opacity: 1 !important;
  filter: drop-shadow(0 0 5px rgba(59, 130, 246, 0.4));
}

/* 4. HIDE TEXT/EXPANDERS in Collapsed */
:root.menu-style-tree .hierarchical-sidebar.collapsed .menu-label,
:root.menu-style-tree .hierarchical-sidebar.collapsed .expand-icon,
:root.menu-style-tree .hierarchical-sidebar.collapsed .tree-toggle-box {
  display: none !important;
}

/* 5. FIX ICON POSITIONING */
:root.menu-style-tree .hierarchical-sidebar.collapsed .menu-icon {
  display: block !important;
  margin: 0 !important;
  opacity: 0.6;
  font-size: 20px !important;
}

/* 6. GLOBAL CLEANUP FOR COLLAPSED SIDEBAR */
.hierarchical-sidebar.collapsed {
  overflow: visible !important; /* Allow tooltips if we had them, but standard prevents clipping */
}
.hierarchical-sidebar.collapsed .menu-container {
  overflow: visible !important;
  width: 100% !important;
  padding: 8px 0 !important;
}

/* 7. REMOVE ANY "DOT" INDICATORS IN COLLAPSED MODE */
:root.menu-style-tree .hierarchical-sidebar.collapsed .hierarchical-menu-item::after,
:root.menu-style-tree .hierarchical-sidebar.collapsed .hierarchical-menu-item::before {
  display: none !important;
}
"""

with open(r'c:\Users\pongc\Desktop\PO_System\family_finances\web-pos-nit\src\component\layout\CleanDarkLayout.css', 'a', encoding='utf-8') as f:
    f.write(css_content)

print("Appended Corrected CSS Selectors for Collapsed State.")
