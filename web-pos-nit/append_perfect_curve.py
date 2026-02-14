
css_content = """

/* ========================================================= */
/* OVERRIDE: PERFECT SMOOTH CURVE CONNECTION (FIXED)         */
/* ========================================================= */

.menu-style-tree .hierarchical-menu-item.selected {
   background: var(--primary-light, #e0f2fe) !important;
   color: var(--primary-color, #3b82f6) !important;
   border-top-left-radius: 50px !important;
   border-bottom-left-radius: 50px !important;
   border-top-right-radius: 0 !important;
   border-bottom-right-radius: 0 !important;
   margin-right: -24px !important; /* Force overlap with container edge */
   padding-right: 40px !important;
   position: relative !important;
   z-index: 10 !important;
   overflow: visible !important;
   box-shadow: none !important;
}

/* 2. Top "Inverted" Curve - Using Box Shadow Trick */
.menu-style-tree .hierarchical-menu-item.selected::before {
   content: '' !important;
   position: absolute !important;
   top: -20px !important;
   right: 0 !important;
   width: 20px !important;
   height: 20px !important;
   background: transparent !important;
   border-radius: 0 0 20px 0 !important; /* Bottom-Right Curve */
   box-shadow: 8px 8px 0 8px var(--primary-light, #e0f2fe) !important;
   z-index: 1 !important;
   display: block !important;
   border: none !important;
   left: auto !important;
}

/* 3. Bottom "Inverted" Curve - Using Box Shadow Trick */
.menu-style-tree .hierarchical-menu-item.selected::after {
   content: '' !important;
   position: absolute !important;
   bottom: -20px !important;
   right: 0 !important;
   width: 20px !important;
   height: 20px !important;
   background: transparent !important;
   border-radius: 0 20px 0 0 !important; /* Top-Right Curve */
   box-shadow: 8px -8px 0 8px var(--primary-light, #e0f2fe) !important;
   z-index: 1 !important;
   display: block !important;
   left: auto !important;
   top: auto !important;
   transform: none !important;
   border: none !important;
}

/* 4. Fix Dark Mode Colors */
html.dark .menu-style-tree .hierarchical-menu-item.selected {
   background: rgba(59, 130, 246, 0.2) !important; 
   color: #60a5fa !important;
}

html.dark .menu-style-tree .hierarchical-menu-item.selected::before {
   box-shadow: 8px 8px 0 8px rgba(59, 130, 246, 0.2) !important;
}

html.dark .menu-style-tree .hierarchical-menu-item.selected::after {
   box-shadow: 8px -8px 0 8px rgba(59, 130, 246, 0.2) !important;
}

/* 5. Ensure Container doesn't clip the curve sticking out */
.menu-style-tree .menu-container {
   padding-right: 24px !important; /* Add space for the extended item */
   overflow: visible !important;
}

.hierarchical-sidebar {
   overflow: visible !important; 
}

.hierarchical-sidebar-content {
   overflow: visible !important;
}
"""

with open(r'c:\Users\pongc\Desktop\PO_System\family_finances\web-pos-nit\src\component\layout\CleanDarkLayout.css', 'a', encoding='utf-8') as f:
    f.write(css_content)

print("Appended finalized Smooth Curve CSS.")
