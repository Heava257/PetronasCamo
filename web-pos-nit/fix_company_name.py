
css_content = """

/* ========================================================= */
/* FIX: COMPANY NAME VISIBILITY (CONTRAST ISSUE)             */
/* ========================================================= */

.sidebar-header .logo-text {
  display: flex;
  flex-direction: column;
  margin-left: 12px;
}

.sidebar-header .company-name {
  font-family: 'Playfair Display', serif; /* Luxurious font */
  font-weight: 700;
  font-size: 16px;
  color: #1e293b !important; /* Dark Slate - High Contrast */
  letter-spacing: 0.5px;
  line-height: 1.2;
}

.sidebar-header .company-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  font-weight: 600;
  color: #64748b !important; /* Muted Slate */
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-top: 2px;
}

/* Ensure Logo Section Layout */
.sidebar-header .logo-section {
  display: flex;
  align-items: center;
  padding: 20px 24px;
}

.sidebar-header .logo-icon-img {
  width: 36px;
  height: 36px;
  object-fit: contain;
  /* Add subtle shadow to logo */
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
}

/* DIFFERENT STYLES FOR COLLAPSED STATE */
.hierarchical-sidebar.collapsed .sidebar-header {
  padding: 12px 0;
  justify-content: center;
}

.hierarchical-sidebar.collapsed .logo-section {
  padding: 0;
  justify-content: center;
  width: 100%;
}

.hierarchical-sidebar.collapsed .logo-text {
  display: none !important; /* Hide text when collapsed */
}

.hierarchical-sidebar.collapsed .logo-icon-img {
  width: 32px;
  height: 32px;
  margin: 0 auto;
}
"""

with open(r'c:\Users\pongc\Desktop\PO_System\family_finances\web-pos-nit\src\component\layout\CleanDarkLayout.css', 'a', encoding='utf-8') as f:
    f.write(css_content)

print("Appended CSS fixes for Company Name visibility and Sidebar Header layout.")
