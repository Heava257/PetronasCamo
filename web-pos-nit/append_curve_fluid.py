
css_content = """

/* ========================================================= */
/* OVERRIDE: FLUID CURVED MENU ITEM (Round Left, Connected Right) */
/* ========================================================= */

/* 1. Item Container Shape (Round Left, Flat Right) */
.menu-style-tree .hierarchical-menu-item.selected {
  /* Use a lighter background Color */
  background: var(--primary-light, #e0f2fe) !important;
  color: var(--primary-color, #3b82f6) !important;
  
  /* Round Start, Flat End */
  border-top-left-radius: 40px !important;
  border-bottom-left-radius: 40px !important;
  border-top-right-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
  
  /* Extend to the right edge to connect with curves */
  margin-right: -15px !important; 
  padding-right: 20px !important;
  
  /* Ensure visibility */
  position: relative !important;
  overflow: visible !important;
  z-index: 10 !important;
  box-shadow: none !important; /* Clean flat look or update if needed */
  opacity: 1 !important;
  backdrop-filter: blur(5px);
}

/* 2. Top "Inverted" Curve */
.menu-style-tree .hierarchical-menu-item.selected::before {
  content: '' !important;
  position: absolute !important;
  top: -20px !important;
  right: 0 !important;
  width: 20px !important;
  height: 20px !important;
  background: transparent !important;
  border-bottom-right-radius: 20px !important;
  /* Shadow color must match the item background */
  box-shadow: 10px 10px 0 10px var(--primary-light, #e0f2fe) !important; 
  z-index: -1 !important;
  display: block !important;
  left: auto !important; /* Reset any previous positioning */
  border: none !important;
}

/* 3. Bottom "Inverted" Curve (Replaces the Dot) */
.menu-style-tree .hierarchical-menu-item.selected::after {
  content: '' !important;
  position: absolute !important;
  bottom: -20px !important;
  right: 0 !important;
  width: 20px !important;
  height: 20px !important;
  background: transparent !important;
  border-top-right-radius: 20px !important;
  /* Shadow color must match the item background */
  box-shadow: 10px -10px 0 10px var(--primary-light, #e0f2fe) !important;
  z-index: -1 !important;
  display: block !important;
  left: auto !important; /* Reset any previous positioning */
  top: auto !important;
  transform: none !important; /* Remove center transform from Dot */
  border-radius: 0 !important; /* Reset dot radius */
  border: none !important;
}

/* Restore Menu Icon Visibility (was hidden for dot) */
.menu-style-tree .hierarchical-menu-item .menu-icon {
  display: block !important;
  color: inherit !important;
  margin-right: 8px; 
}

/* Ensure Label Color */
.menu-style-tree .hierarchical-menu-item.selected .menu-label {
  color: var(--primary-color, #3b82f6) !important;
  font-weight: 700 !important;
}

/* Force padding adjustment in container to allow negative margin overlap */
.menu-style-tree .menu-container {
  overflow-x: hidden !important; /* Allow the 'stick out' visual without scrollbar */
}
"""

with open(r'c:\Users\pongc\Desktop\PO_System\family_finances\web-pos-nit\src\component\layout\CleanDarkLayout.css', 'a', encoding='utf-8') as f:
    f.write(css_content)

print("Appended CSS for Curve Top and Curve Bottom style matching the image.")
