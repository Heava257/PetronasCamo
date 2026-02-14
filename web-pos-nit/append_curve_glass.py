
css_content = """

/* ========================================================= */
/* OVERRIDE: Curved Tree Lines & Glassy Active Item          */
/* ========================================================= */

/* 1. Curve the Tree Connector Lines (L-Shape to Curve) */
.menu-style-tree .tree-node:not(.level-0)::before {
  border-bottom-left-radius: 12px !important; /* Curve the corner */
}

/* 2. Make Active Item See-Through (Glass Effect) */
.menu-style-tree .hierarchical-menu-item.selected {
  background: rgba(59, 130, 246, 0.08) !important; /* More transparent */
  backdrop-filter: blur(4px); /* Glassy blur */
  border: 1px solid rgba(59, 130, 246, 0.15) !important; /* Subtle border */
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.1) !important;
}

/* Keep the dot/circle */
.menu-style-tree .hierarchical-menu-item.selected::after {
  content: '' !important;
  display: block !important;
  background-color: var(--primary-color, #3b82f6) !important;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.8) !important; /* Semi-transparent ring */
}

/* Ensure text remains visible and sharp */
.menu-style-tree .hierarchical-menu-item.selected .menu-label {
  color: var(--primary-color, #3b82f6) !important;
  font-weight: 800 !important;
  text-shadow: 0 0 1px rgba(59, 130, 246, 0.1);
}
"""

with open(r'c:\Users\pongc\Desktop\PO_System\family_finances\web-pos-nit\src\component\layout\CleanDarkLayout.css', 'a', encoding='utf-8') as f:
    f.write(css_content)

print("Appended CSS for Curved Tree Lines and Glassy Active Item.")
