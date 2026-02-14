
css_content = """

/* ========================================================= */
/* CRITICAL FIX: COLLAPSED STATE CLEANUP & INTERACTION       */
/* ========================================================= */

/* 1. DISABLE TREE LINES IN COLLAPSED MODE (Fixes "Can't Click" & Artifacts) */
.hierarchical-sidebar.collapsed .menu-style-tree .tree-node::before,
.hierarchical-sidebar.collapsed .menu-style-tree .tree-node::after,
.hierarchical-sidebar.collapsed .menu-style-tree .has-children::after {
  display: none !important; /* underlying lines block clicks */
}

/* 2. HIDE TEXT & EXPANDERS COMPLETELY */
.hierarchical-sidebar.collapsed .menu-style-tree .menu-label,
.hierarchical-sidebar.collapsed .menu-style-tree .expand-icon,
.hierarchical-sidebar.collapsed .menu-style-tree .tree-toggle-box {
  display: none !important;
}

/* 3. RESET ITEM LAYOUT FOR CLICKABILITY */
.hierarchical-sidebar.collapsed .menu-style-tree .hierarchical-menu-item {
  width: 48px !important;       /* Larger touch target */
  height: 48px !important;
  margin: 4px auto !important;  /* Center horizontally */
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 12px !important;
  
  /* Reset backgrounds */
  background: transparent !important;
  border: none !important; 
  box-shadow: none !important;
  
  /* Ensure it's on top */
  position: relative !important; 
  z-index: 100 !important; 
  cursor: pointer !important;
}

/* 4. ACTIVE STATE IN COLLAPSED MODE (Make it distinct) */
.hierarchical-sidebar.collapsed .menu-style-tree .hierarchical-menu-item.selected {
  background: rgba(59, 130, 246, 0.15) !important;
  color: var(--primary-color, #3b82f6) !important;
}

.hierarchical-sidebar.collapsed .menu-style-tree .hierarchical-menu-item.selected .menu-icon {
  color: var(--primary-color, #3b82f6) !important;
  opacity: 1 !important;
  filter: drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3));
}

/* 5. HOVER EFFECT */
.hierarchical-sidebar.collapsed .menu-style-tree .hierarchical-menu-item:hover {
  background: rgba(255, 255, 255, 0.05) !important;
}

/* 6. FIX ICON POSITIONING */
.hierarchical-sidebar.collapsed .menu-style-tree .menu-icon {
  margin: 0 !important; /* No margin when alone */
  font-size: 20px !important;
  width: auto !important; 
  height: auto !important;
  display: block !important;
}

/* 7. RESET CONTAINER OVERFLOW TO ALLOW CLICKS */
.hierarchical-sidebar.collapsed .menu-container {
  overflow-x: hidden !important;
  padding: 0 !important;
}

/* 8. REMOVE CATEGORY HEADERS IN COLLAPSED */
.hierarchical-sidebar.collapsed .category-header {
  display: none !important;
}
"""

with open(r'c:\Users\pongc\Desktop\PO_System\family_finances\web-pos-nit\src\component\layout\CleanDarkLayout.css', 'a', encoding='utf-8') as f:
    f.write(css_content)

print("Appended CSS to completely fix collapsed state interaction and aesthetics.")
