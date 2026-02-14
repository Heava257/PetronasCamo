
css_content = """

/* ========================================================= */
/* OVERRIDE: PREMIUM GLASS PILL (Clean, Contained, Beautiful) */
/* ========================================================= */

/* 1. Reset & Container Style */
.menu-style-tree .hierarchical-menu-item.selected {
  /* Margin & Padding Reset - Keep it INSIDE the sideboard */
  margin-right: 8px !important; 
  margin-left: 8px !important;
  padding-right: 16px !important;
  
  /* Shape: Fully Rounded Floating Pill */
  border-radius: 16px !important; /* Modern soft curve, not full pill, distinct from buttons */
  
  /* Glass Effect */
  background: rgba(59, 130, 246, 0.1) !important; /* Subtle tint */
  backdrop-filter: blur(12px) !important; /* distinct glass blur */
  -webkit-backdrop-filter: blur(12px) !important;
  
  /* Border & Glow */
  border: 1px solid rgba(59, 130, 246, 0.15) !important;
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.15) !important; /* Premium Glow */
  
  /* Layout */
  position: relative !important;
  overflow: hidden !important; /* Contain inner effects */
  z-index: 1 !important;
  
  width: auto !important; /* Let it fit the container */
}

/* 2. Remove the "Ears" (Curve Hacks) which were breaking layout */
.menu-style-tree .hierarchical-menu-item.selected::before {
  display: none !important;
}

/* 3. Redesign the Indicator (Glowing Vertical Bar or Dot) */
/* Let's stick to a premium glowing bar on the left for this "Glass" look, or a Dot if preferred.
   The user liked the "Curve", so let's simulate curve with a gradient background potentially.
   Let's use a nice gradient background for the item itself.
*/

.menu-style-tree .hierarchical-menu-item.selected {
   background: linear-gradient(90deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%) !important;
}

/* Re-add the Dot, but cleaner */
.menu-style-tree .hierarchical-menu-item.selected::after {
  content: '' !important;
  position: absolute !important;
  left: 12px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  width: 8px !important;
  height: 8px !important;
  border-radius: 50% !important;
  background-color: var(--primary-color, #3b82f6) !important;
  box-shadow: 0 0 10px var(--primary-color, #3b82f6) !important; /* Glowing Dot */
  z-index: 2 !important;
  display: block !important;
  bottom: auto !important;
  right: auto !important;
}

/* Text Style */
.menu-style-tree .hierarchical-menu-item.selected .menu-label {
  color: var(--primary-color, #3b82f6) !important;
  font-weight: 700 !important;
  text-shadow: none !important;
  padding-left: 4px; /* Space from dot */
}

/* Icon Style - Ensure Visible */
.menu-style-tree .hierarchical-menu-item .menu-icon {
    display: block !important;
    opacity: 0.7;
}

.menu-style-tree .hierarchical-menu-item.selected .menu-icon {
    color: var(--primary-color, #3b82f6) !important;
    opacity: 1 !important;
    filter: drop-shadow(0 0 5px rgba(59, 130, 246, 0.4));
}
"""

with open(r'c:\Users\pongc\Desktop\PO_System\family_finances\web-pos-nit\src\component\layout\CleanDarkLayout.css', 'a', encoding='utf-8') as f:
    f.write(css_content)

print("Appended Premium Glass Pill CSS.")
