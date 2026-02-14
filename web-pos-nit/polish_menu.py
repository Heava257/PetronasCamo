
css_content = """

/* ========================================================= */
/* POLISH: CATEGORY HEADERS & MENU ITEM REFINEMENTS         */
/* ========================================================= */

/* Category Headers - Make them more visible and professional */
.menu-category .category-header {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: #64748b !important; /* Muted slate for contrast */
  padding: 16px 24px 8px 24px;
  margin-top: 8px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.1);
  margin-bottom: 4px;
}

/* First category shouldn't have top margin */
.menu-category:first-child .category-header {
  margin-top: 0;
}

/* ========================================================= */
/* POLISH: MENU ITEM HOVER STATES                           */
/* ========================================================= */

/* Hover effect for non-selected items */
.menu-style-tree .hierarchical-menu-item:not(.selected):hover {
  background: rgba(100, 116, 139, 0.05) !important;
  transition: background 0.2s ease;
}

/* Improve icon visibility on hover */
.menu-style-tree .hierarchical-menu-item:hover .menu-icon {
  opacity: 0.8 !important;
  transition: opacity 0.2s ease;
}

/* ========================================================= */
/* POLISH: SUBMENU STYLING                                  */
/* ========================================================= */

/* Submenu container */
.menu-style-tree .submenu {
  margin-left: 12px;
  border-left: 1px solid rgba(100, 116, 139, 0.15);
  padding-left: 8px;
}

/* Submenu items */
.menu-style-tree .submenu .hierarchical-menu-item {
  font-size: 13px;
  padding: 8px 12px !important;
  margin: 2px 0 !important;
}

/* ========================================================= */
/* POLISH: SCROLLBAR STYLING                                */
/* ========================================================= */

/* Custom scrollbar for menu container */
.menu-container::-webkit-scrollbar {
  width: 6px;
}

.menu-container::-webkit-scrollbar-track {
  background: transparent;
}

.menu-container::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.2);
  border-radius: 3px;
}

.menu-container::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.3);
}

/* ========================================================= */
/* POLISH: ACTIVE ITEM REFINEMENTS                          */
/* ========================================================= */

/* Ensure active item text is bold and readable */
.menu-style-tree .hierarchical-menu-item.selected .menu-label {
  font-weight: 700 !important;
  color: var(--primary-color, #3b82f6) !important;
}

/* Active item should have smooth transitions */
.menu-style-tree .hierarchical-menu-item {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ========================================================= */
/* POLISH: FOOTER PROFILE SECTION                           */
/* ========================================================= */

.sidebar-footer {
  background: rgba(248, 250, 252, 0.5);
  backdrop-filter: blur(8px);
}

.sidebar-profile-info:hover {
  background: rgba(100, 116, 139, 0.05) !important;
  transition: background 0.2s ease;
}

.profile-logout-text:hover {
  color: var(--primary-color, #3b82f6) !important;
  transition: color 0.2s ease;
}

/* ========================================================= */
/* POLISH: TREE TOGGLE BOX                                  */
/* ========================================================= */

.tree-toggle-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  background: rgba(100, 116, 139, 0.1);
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  transition: all 0.2s ease;
}

.hierarchical-menu-item:hover .tree-toggle-box {
  background: rgba(100, 116, 139, 0.15);
  color: #475569;
}

.hierarchical-menu-item.selected .tree-toggle-box {
  background: rgba(59, 130, 246, 0.15);
  color: var(--primary-color, #3b82f6);
}
"""

with open(r'c:\Users\pongc\Desktop\PO_System\family_finances\web-pos-nit\src\component\layout\CleanDarkLayout.css', 'a', encoding='utf-8') as f:
    f.write(css_content)

print("Appended comprehensive polish CSS for menu refinements.")
