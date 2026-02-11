/**
 * Acleda Gold Template - Banking App Style
 * Premium dark blue background with gold accents and glassmorphism
 */
export const acledaGoldTemplate = {
    id: 'acledagold',
    name: 'Acleda Gold',
    description: 'Premium dark blue and gold theme inspired by banking elegance',
    preview: {
        primaryColor: '#FFD700', // Gold
        backgroundColor: '#0f204b',
        cardColor: 'rgba(255, 255, 255, 0.1)'
    },

    // Colors
    colors: {
        primary: '#FFD700', // Gold
        primaryHover: '#FFC107', // Amber
        primaryLight: 'rgba(255, 215, 0, 0.2)',
        secondary: '#0F2027', // Dark Blue/Black
        accent: '#FFD700',

        // Background colors
        // Animated Deep Night Sky Gradient with Gold Accents
        bgMain: 'linear-gradient(135deg, #050a14 0%, #081533 50%, #0f204b 100%)',
        bgCard: 'rgba(255, 255, 255, 0.1)', // White Glass Effect (10% opacity)
        bgSidebar: 'rgba(255, 255, 255, 0.05)', // Even lighter glass for sidebar
        bgHeader: 'rgba(8, 16, 32, 0.6)', // Dark glass header

        // Text colors
        textPrimary: '#ffffff',
        textSecondary: '#cbd5e1', // Slate-300
        textMuted: '#94a3b8',
        textOnPrimary: '#0f204b', // Dark text on Gold buttons

        // Border colors
        borderColor: 'rgba(255, 215, 0, 0.2)', // Subtle gold border
        borderLight: 'rgba(255, 255, 255, 0.1)',

        // Status colors
        success: '#4ade80',
        warning: '#facc15',
        error: '#f87171',
        info: '#60a5fa'
    },

    // Custom CSS for Background Animation
    // This will be injected by SettingsContext if supported, otherwise it stays as data
    customCss: `
        @keyframes drift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        @keyframes twinkle {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.1); }
        }
        
        /* Animated Background Layer */
        .layout-root.template-acledagold::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
                radial-gradient(circle at 20% 30%, rgba(255, 215, 0, 0.15) 0%, transparent 20%),
                radial-gradient(circle at 80% 10%, rgba(255, 215, 0, 0.1) 0%, transparent 20%),
                radial-gradient(circle at 50% 80%, rgba(60, 100, 255, 0.1) 0%, transparent 30%),
                url("https://images.template.net/123509/chinese-new-year-high-resolution-background-tmp69.jpg") center/cover no-repeat;
            z-index: -1;
            opacity: 0.4;
            mix-blend-mode: screen;
            pointer-events: none;
            animation: twinkle 10s infinite ease-in-out alternate;
        }

        /* Gradient Overlay for Depth - Softened to let background patterns shine */
        .layout-root.template-acledagold::after {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(5,10,20,0.8) 0%, rgba(8,21,51,0.7) 100%);
            z-index: -1;
            pointer-events: none;
        }

        /* --- CRITICAL FORCE OVERRIDES FOR VISIBILITY --- */
        
        /* --- CRITICAL FORCE OVERRIDES FOR VISIBILITY --- */
        
        /* Force Form Labels Gold - HIGH SPECIFICITY */
        /* Force Form Labels Gold - HIGH SPECIFICITY */
        html.template-acledagold .ant-form-item-label > label,
        html.template-acledagold .ant-form-item-label > label > span {
            color: #FFD700 !important; /* Gold Label */
            font-weight: 500;
        }
        
        /* Inputs - Force Lighter Background & White Text */
        /* Inputs - Force Lighter Background & White Text */
        html.template-acledagold .ant-input,
        html.template-acledagold .ant-input-number,
        html.template-acledagold .ant-input-password,
        html.template-acledagold .ant-picker,
        html.template-acledagold .ant-select:not(.ant-select-customize-input) .ant-select-selector,
        html.template-acledagold textarea.ant-input {
             background-color: rgba(255, 255, 255, 0.1) !important; /* Visible light glass */
             border: 1px solid rgba(255, 215, 0, 0.3) !important;
             color: #ffffff !important;
        }

        /* --- FIX BROWSER AUTOFILL WHITE BACKGROUND --- */
        /* --- FIX BROWSER AUTOFILL WHITE BACKGROUND --- */
        html.template-acledagold input:-webkit-autofill,
        html.template-acledagold input:-webkit-autofill:hover, 
        html.template-acledagold input:-webkit-autofill:focus, 
        html.template-acledagold textarea:-webkit-autofill,
        html.template-acledagold textarea:-webkit-autofill:hover,
        html.template-acledagold textarea:-webkit-autofill:focus,
        html.template-acledagold select:-webkit-autofill,
        html.template-acledagold select:-webkit-autofill:hover,
        html.template-acledagold select:-webkit-autofill:focus {
            -webkit-text-fill-color: #ffffff !important;
            -webkit-box-shadow: 0 0 0px 1000px rgba(15, 32, 75, 0.9) inset !important; /* Match Modal BG */
            transition: background-color 5000s ease-in-out 0s;
            caret-color: #ffffff;
        }

        /* Fix Select/Picker Text Color specifics */
        /* Fix Select/Picker Text Color specifics */
        html.template-acledagold .ant-select-selection-item,
        html.template-acledagold .ant-picker-input > input {
            color: #ffffff !important;
        }
        
        /* Placeholders */
        html.template-acledagold .ant-input::placeholder,
        html.template-acledagold .ant-picker-input > input::placeholder,
        html.template-acledagold .ant-select-selection-placeholder {
             color: rgba(255, 255, 255, 0.6) !important;
        }
        
        
        /* Arrows/Icons in Inputs */
        .ant-select-arrow, 
        .ant-select-clear, 
        .ant-picker-suffix,
        .ant-picker-clear {
            color: #FFD700 !important; /* Gold icons */
        }
        
        /* Table Expanded Row & Descriptions */
        html.template-acledagold .ant-descriptions-item-label,
        .ant-descriptions-item-label {
            color: #FFD700 !important; /* Gold Labels */
        }
        
        html.template-acledagold .ant-descriptions-item-content,
        .ant-descriptions-item-content {
            color: #ffffff !important;
        }
        
        html.template-acledagold .ant-descriptions-title,
        .ant-descriptions-title {
            color: #FFD700 !important;
        }
        
        /* Force any grey text in expanded rows to be white */
        /* Force any grey text in expanded rows to be white */
        html.template-acledagold .ant-table-expanded-row .ant-descriptions-row > td,
        html.template-acledagold .ant-table-expanded-row,
        html.template-acledagold .ant-table-expanded-row *,
        html.template-acledagold .ant-table-expanded-row span {
             color: #ffffff; /* Default expands to white */
        }
        
        /* Re-apply Gold to specific headers within expanded rows if they got overridden */
        .ant-table-expanded-row h3, 
        .ant-table-expanded-row h4, 
        .ant-table-expanded-row h5, 
        .ant-table-expanded-row strong,
        .ant-table-expanded-row b {
            color: #FFD700 !important;
        }
        
        /* Ensure Table Pagination and Footer text is visible */
        /* Ensure Table Pagination and Footer text is visible */
        html.template-acledagold .ant-pagination-item a,
        html.template-acledagold .ant-pagination-prev .ant-pagination-item-link,
        html.template-acledagold .ant-pagination-next .ant-pagination-item-link,
        html.template-acledagold .ant-pagination-total-text {
             color: #ffffff !important;
        }
        
        /* Fix Table Filters & Search Bar */
        /* Fix Table Filters & Search Bar */
        html.template-acledagold .ant-input-search .ant-input,
        html.template-acledagold .ant-input-group-addon button,
        html.template-acledagold .ant-select-selector {
            background-color: rgba(255, 255, 255, 0.15) !important; /* Slightly more visible */
            border-color: rgba(255, 215, 0, 0.4) !important;
            color: #ffffff !important;
        }
        
        .ant-input-search .ant-input::placeholder {
            color: rgba(255, 255, 255, 0.8) !important; /* Brighter placeholder */
        }
        
        /* Fix top toolbar buttons */
        /* Fix top toolbar buttons */
        html.template-acledagold .ant-btn-default, 
        html.template-acledagold .ant-btn-dashed {
            background-color: rgba(255, 255, 255, 0.1) !important;
            border-color: rgba(255, 215, 0, 0.3) !important;
            color: #ffffff !important;
        }
        
        /* Force Table Cell Transparency */
        html.template-acledagold .ant-table-cell,
        .layout-root.template-acledagold .ant-table-cell {
            background: transparent !important;
            background-color: transparent !important;
        }

        /* Hover Effect for Table Rows - Premium Gold Glow */
        .ant-table-tbody > tr:hover > td {
            background-color: rgba(255, 215, 0, 0.1) !important;
            transition: background-color 0.3s ease;
        }

        /* --- FIX CUSTOMER TABLE TELEPHONE CHIPS --- */
        /* Override inline styles from CustomerPage.jsx */
        .ant-table-cell a[href^="tel:"] {
            background-color: rgba(255, 255, 255, 0.05) !important;
            border: 1px solid rgba(255, 215, 0, 0.3) !important;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        
        /* Force text inside phone chips to be white/gold */
        .ant-table-cell a[href^="tel:"] span {
            color: #ffffff !important;
            text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }
        
        /* General Table Cell Text (e.g. Gender, Name) */
        .ant-table-cell, 
        .ant-table-cell span,
        .customer-gender-text,
        .customer-name-main {
            color: #ffffff !important;
        }

        /* Tags in Table */
        .ant-tag {
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        /* Layout - Maximize Table Height */
        .ant-table-wrapper, 
        .ant-spin-nested-loading, 
        .ant-spin-container,
        .ant-table,
        .ant-table-container {
             height: 100%;
             display: flex;
             flex-direction: column;
        }
        
        /* Ensure table body fills available space */
        .ant-table-body {
             flex: 1;
             min-height: 500px; /* Force minimum height */
        }
        
        /* Pagination Position */
        .ant-pagination {
             margin-top: auto !important;
             padding-top: 16px;
        }

        /* ✅ IMPROVED: GLASS BACKGROUND FOR STICKY COLUMNS */
        html.template-acledagold .ant-table-cell-fix-left,
        html.template-acledagold .ant-table-cell-fix-right,
        html.template-acledagold .ant-table-thead > tr > th.ant-table-cell-fix-left,
        html.template-acledagold .ant-table-thead > tr > th.ant-table-cell-fix-right {
             background-color: rgba(15, 32, 75, 0.9) !important; /* Glassy Dark Blue */
             backdrop-filter: blur(10px) !important;
             -webkit-backdrop-filter: blur(10px) !important;
             z-index: 99 !important;
        }

        /* --- DASHBOARD / POS CUSTOM COMPONENTS --- */

        /* Fuel Stock Cards (POS Page) */
        .stock-card {
            background: rgba(20, 30, 60, 0.6) !important; /* Dark Glass */
            backdrop-filter: blur(12px) !important;
            border: 1px solid rgba(255, 215, 0, 0.3) !important; /* Gold Border */
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3) !important;
        }
        .stock-card > div:first-child { /* Type Label */
            color: rgba(255, 255, 255, 0.7) !important;
        }
        .stock-card > div:nth-child(2) { /* Amount */
            color: #FFD700 !important; /* Gold Text */
        }
        .stock-card span {
            color: #ffffff !important;
        }

        /* Summary Cards (Order/Invoice Page) */
        .global-summary-card {
            background: rgba(15, 23, 42, 0.6) !important;
            border: 1px solid rgba(255, 215, 0, 0.3) !important;
            backdrop-filter: blur(20px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important;
        }
        .global-summary-card div[class*="summaryTitle"] {
            color: rgba(255, 255, 255, 0.8) !important;
        }
        .global-summary-card div[class*="summaryValue"] {
            color: #FFD700 !important;
        }
        .global-summary-card div[class*="summaryIcon"] {
            background: rgba(255, 215, 0, 0.1) !important;
            color: #FFD700 !important;
        }

        /* Page Header - Remove Background (User requested removal) */
        html.template-acledagold .pageHeader {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
        }

        /* FORCE OrderPage Table Headers to be White Text */
        html.template-acledagold .table-header,
        html.template-acledagold .column-header-product {
             background: transparent !important;
             color: #ffffff !important;
             border-bottom: none !important;
        }

        /* FORCE TEXT CONTENT IN HEADERS TO BE VISIBLE */
        html.template-acledagold .tableHeaderGroup,
        html.template-acledagold .khmerText,
        html.template-acledagold .khmer-text,
        html.template-acledagold .khmer-text1,
        html.template-acledagold .englishText,
        html.template-acledagold .customerName,
        html.template-acledagold .customerTel, 
        html.template-acledagold .customerAddress {
             color: #ffffff !important;
        }
        
        html.template-acledagold .khmerText,
        html.template-acledagold .khmer-text,
        html.template-acledagold .khmer-text1 {
            font-weight: bold;
            color: #FFD700 !important; /* Gold for Khmer Header */
        }



        /* POS Right Sidebar (Cart) - FORCE DARK MODE OVERRIDES */
        .global-pos-sidebar-wrapper,
        .global-pos-sidebar-wrapper > div { 
            background: transparent !important;
            background-color: rgba(15, 23, 42, 0.95) !important; /* Dark Blue Slate */
            color: white !important;
            box-shadow: none !important;
            border: none !important;
        }

        /* FORCE ALL INNER DIVS TO BE TRANSPARENT OR DARK GLASS */
        .global-pos-sidebar-wrapper div {
            background-color: transparent !important;
            border-color: rgba(255, 215, 0, 0.2) !important;
            color: white !important;
        }
        
        /* Re-apply glass effect to specific containers (optional, if structure permits) */
        .global-pos-sidebar-wrapper > div > div {
             background-color: rgba(255, 255, 255, 0.05) !important;
             backdrop-filter: blur(5px);
             margin-bottom: 10px;
             border-radius: 12px;
             padding: 10px;
        }

        /* Inputs & Selects in Sidebar */
        .global-pos-sidebar-wrapper input,
        .global-pos-sidebar-wrapper select,
        .global-pos-sidebar-wrapper textarea,
        .global-pos-sidebar-wrapper .ant-select-selector {
            background-color: rgba(0, 0, 0, 0.3) !important; /* Lighter/Glassier dark bg */
            backdrop-filter: blur(5px);
            color: #FFD700 !important;
            border: 1px solid rgba(255, 215, 0, 0.5) !important;
        }

        /* Fix Ant Design Select Dropdown in Sidebar */
        .global-pos-sidebar-wrapper .ant-select-arrow {
            color: #FFD700 !important;
        }
        
        /* Buttons inside sidebar */
        .global-pos-sidebar-wrapper button {
             color: white !important;
             border-color: rgba(255, 255, 255, 0.3) !important;
        }

        /* Input Labels & Text */
        .global-pos-sidebar-wrapper label,
        .global-pos-sidebar-wrapper span,
        .global-pos-sidebar-wrapper p,
        .global-pos-sidebar-wrapper h3,
        .global-pos-sidebar-wrapper h4,
        .global-pos-sidebar-wrapper div {
           color: #ffffff !important;
        }
        
        /* Specific Fix for Icons */
        .global-pos-sidebar-wrapper svg {
            color: #FFD700 !important;
        }
        /* --- INTEGRATED INVOICE SIDEBAR SPECIFIC OVERRIDES --- */
        
        /* Main Container */
        .layout-root.template-acledagold .invoice-sidebar-container,
        .global-pos-sidebar-wrapper .invoice-sidebar-container {
            background-color: rgba(15, 23, 42, 0.95) !important;
            border-color: rgba(255, 215, 0, 0.3) !important;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4) !important;
        }

        /* Header - Remove Blue/Purple Gradient */
        .layout-root.template-acledagold .invoice-sidebar-header,
        .global-pos-sidebar-wrapper .invoice-sidebar-header {
            background: linear-gradient(135deg, rgba(5,10,20,0.95) 0%, rgba(8,21,51,0.95) 100%) !important;
            border-bottom: 1px solid rgba(255, 215, 0, 0.2);
        }

        /* Summary Cards (Qty/Total) */
        .layout-root.template-acledagold .invoice-sidebar-summary-card,
        .global-pos-sidebar-wrapper .invoice-sidebar-summary-card,
        .layout-root.template-acledagold .invoice-sidebar-total-card,
        .global-pos-sidebar-wrapper .invoice-sidebar-total-card {
            background: rgba(255, 255, 255, 0.05) !important;
            border: 1px solid rgba(255, 215, 0, 0.2) !important;
        }

        /* Total Amount Text - Force Gold */
        .global-pos-sidebar-wrapper .invoice-sidebar-total-card .text-2xl,
        .global-pos-sidebar-wrapper .invoice-sidebar-summary-card .text-2xl {
            color: #FFD700 !important;
            text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
        }

        /* Sidebar Body */
        .layout-root.template-acledagold .invoice-sidebar-body,
        .global-pos-sidebar-wrapper .invoice-sidebar-body {
            background: transparent !important;
        }

        /* Inner Cards (Cart Items, Customer Info, etc) - Ensure Glass Effect */
        .global-pos-sidebar-wrapper .invoice-sidebar-body > div {
             background-color: rgba(255, 255, 255, 0.03) !important;
             border: 1px solid rgba(255, 215, 0, 0.15) !important;
             backdrop-filter: blur(5px);
        }
        
        /* Buttons inside Sidebar */
        .global-pos-sidebar-wrapper button {
            border-color: rgba(255, 215, 0, 0.3) !important;
        }
        
        /* Section Headers (Icon + Title) */
        .global-pos-sidebar-wrapper .invoice-sidebar-body .p-1.5.rounded-lg {
             background-color: rgba(255, 215, 0, 0.1) !important;
        }
        
        .global-pos-sidebar-wrapper .invoice-sidebar-body svg.text-blue-600,
        .global-pos-sidebar-wrapper .invoice-sidebar-body svg.dark\:text-blue-400 {
             color: #FFD700 !important;
        }

        /* Inputs in the Sidebar body */
        .global-pos-sidebar-wrapper input,
        .global-pos-sidebar-wrapper select {
             background: rgba(0, 0, 0, 0.3) !important;
             border: 1px solid rgba(255, 215, 0, 0.3) !important;
             color: white !important;
        }

        /* --- CART ITEMS OVERRIDE --- */
        .global-pos-sidebar-wrapper .invoice-sidebar-cart-item {
            background: rgba(255, 255, 255, 0.05) !important; /* Force transparent dark */
            border-color: rgba(255, 215, 0, 0.2) !important;
            box-shadow: none !important;
        }

        /* Ensure text inside cart item is visible */
        .global-pos-sidebar-wrapper .invoice-sidebar-cart-item .text-gray-800 {
            color: #e2e8f0 !important; /* Light gray for labels */
        }
        
        .global-pos-sidebar-wrapper .invoice-sidebar-cart-item .text-green-600 {
            color: #4ade80 !important; /* Bright green for price */
        }

        /* Quantity Input inside Cart Item */
        .global-pos-sidebar-wrapper .invoice-sidebar-cart-item input {
             background-color: rgba(0, 0, 0, 0.4) !important;
             border: 1px solid rgba(255, 215, 0, 0.3) !important;
             color: white !important;
        }

        /* --- FOOTER OVERRIDE --- */
        .global-pos-sidebar-wrapper .invoice-sidebar-footer {
            background: linear-gradient(to right, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95)) !important;
            border-top: 1px solid rgba(255, 215, 0, 0.2) !important;
        }

        .global-pos-sidebar-wrapper .invoice-sidebar-footer .text-gray-500 {
             color: rgba(255, 255, 255, 0.6) !important;
        }
        
        /* Total Amount in Footer */
        .global-pos-sidebar-wrapper .invoice-sidebar-footer .text-4xl {
             background: none !important;
             -webkit-text-fill-color: #FFD700 !important; /* Solid Gold */
             text-shadow: 0 0 15px rgba(255, 215, 0, 0.4);
        }

        /* --- Pre-Order Management Specifics --- */
        .layout-root.template-acledagold .pre-order-total-amount,
        .pre-order-modal .pre-order-total-amount {
             color: #FFD700 !important; /* Gold for Total Amount */
             text-shadow: 0 0 10px rgba(255, 215, 0, 0.4);
        }

        /* Ensure Khmer Text is legible in dark mode with this template */
        .layout-root.template-acledagold .khmer-text-product,
        .pre-order-modal .khmer-text-product {
             font-family: 'Kantumruy Pro', sans-serif !important;
        }
        
        .layout-root.template-acledagold .ant-table-thead > tr > th,
        .layout-root.template-acledagold .ant-table-cell-thead,
        .layout-root.template-acledagold .ant-table-thead > tr > th .ant-table-column-title,
        .layout-root.template-acledagold .ant-table-thead > tr > th .ant-table-column-sorters,
        .layout-root.template-acledagold .ant-table-thead > tr > th span,
        .layout-root.template-acledagold .ant-table-thead > tr > th i,
        .layout-root.template-acledagold .ant-table-thead > tr > th svg {
             color: #FFD700 !important;
        }

        /* Modal Footer in Pre-Order Form - NEW CLASS OVERRIDE */
        .layout-root.template-acledagold .pre-order-footer,
        .pre-order-modal .pre-order-footer {
             background-color: rgba(255, 255, 255, 0.05) !important;
             border: 1px solid rgba(255, 215, 0, 0.2) !important;
             color: white !important;
        }

        /* Note Section - NEW CLASS OVERRIDE */
        .layout-root.template-acledagold .pre-order-note,
        .pre-order-modal .pre-order-note {
             background-color: rgba(59, 130, 246, 0.1) !important; /* Slight blue tint */
             border: 1px solid rgba(59, 130, 246, 0.3) !important;
             color: #cbd5e1 !important;
        }

        .layout-root.template-acledagold .pre-order-note strong,
        .pre-order-modal .pre-order-note strong {
             color: #60a5fa !important; /* Blue-400 */
        }

        .layout-root.template-acledagold .pre-order-note span,
        .pre-order-modal .pre-order-note span {
             color: #cbd5e1 !important; /* Light Slate */
        }

        /* --- FAKE INVOICE PAGE OVERRIDES --- */
        
        /* Force dark glass background for the page header */
        .layout-root.template-acledagold .fake-invoice-page-container .pageHeader {
            background: linear-gradient(135deg, rgba(5,10,20,0.95) 0%, rgba(8,21,51,0.95) 100%) !important;
            border: 1px solid rgba(255, 215, 0, 0.2) !important;
            box-shadow: 0 4px 15px rgba(0,0,0,0.4) !important;
        }

        /* Force gold text for header title */
        .layout-root.template-acledagold .fake-invoice-page-container .invoice-khmer-title {
            color: #FFD700 !important;
            text-shadow: 0 0 5px rgba(255, 215, 0, 0.3);
        }


        /* Stat Cards */
        .layout-root.template-acledagold .fake-invoice-stat-card {
            background: rgba(255, 255, 255, 0.05) !important;
            border: 1px solid rgba(255, 215, 0, 0.2) !important;
            backdrop-filter: blur(10px) !important;
        }
        
        .layout-root.template-acledagold .fake-invoice-stat-card .ant-statistic-content-value {
             color: white !important;
        }

        /* Table Card Container */
        .layout-root.template-acledagold .fake-invoice-page-container .fake-invoice-table-card {
            background-color: rgba(15, 23, 42, 0.95) !important; /* Dark Blue Slate */
            border: 1px solid rgba(255, 215, 0, 0.2) !important;
            box-shadow: 0 4px 15px rgba(0,0,0,0.4) !important;
        }


        /* Table Overrides for Fake Invoice */
        .layout-root.template-acledagold .fake-invoice-page-container .ant-table {
            background: transparent !important;
            color: white !important;
        }

        /* Stat Cards & Table Cards & Form Cards */
        .layout-root.template-acledagold .purchase-header-card,
        .layout-root.template-acledagold .supplier-table-card,
        .layout-root.template-acledagold .purchase-table-card,
        .layout-root.template-acledagold .inventory-transaction-table-card,
        .layout-root.template-acledagold .supplier-form-card,
        .layout-root.template-acledagold .purchase-item-card,
        .layout-root.template-acledagold .purchase-total-card {
             background: rgba(255, 255, 255, 0.05) !important;
             border: 1px solid rgba(255, 215, 0, 0.2) !important;
             backdrop-filter: blur(10px) !important;
             color: #e2e8f0 !important;
        }

        .layout-root.template-acledagold .supplier-form-card h5 {
             color: #FFD700 !important;
        }

        .layout-root.template-acledagold .inventory-transaction-container .ant-card .ant-card-body {
             background: transparent !important;
        }

        /* Titles & Text */
        .layout-root.template-acledagold .supplier-page-container h3,
        .layout-root.template-acledagold .purchase-page-container h4,
        .layout-root.template-acledagold .inventory-transaction-container h4,
        .layout-root.template-acledagold .inventory-transaction-container .ant-typography {
             color: #FFD700 !important;
        }

        /* Tables */
        .layout-root.template-acledagold .supplier-page-container .ant-table,
        .layout-root.template-acledagold .purchase-page-container .ant-table,
        .layout-root.template-acledagold .inventory-transaction-container .ant-table {
             background: transparent !important;
             color: white !important;
        }

        .layout-root.template-acledagold .supplier-page-container .ant-table-thead > tr > th,
        html.template-acledagold .supplier-page-container .ant-table-thead > tr > th,
        .layout-root.template-acledagold .purchase-page-container .ant-table-thead > tr > th,
        html.template-acledagold .purchase-page-container .ant-table-thead > tr > th,
        .layout-root.template-acledagold .inventory-transaction-container .ant-table-thead > tr > th,
        html.template-acledagold .inventory-transaction-container .ant-table-thead > tr > th {
             background: rgba(255, 215, 0, 0.15) !important; /* Slightly more opaque gold tint */
             backdrop-filter: blur(10px) !important;
             color: #FFD700 !important;
             border-bottom: 1px solid rgba(255, 215, 0, 0.3) !important;
             font-weight: bold !important;
        }

        .layout-root.template-acledagold .supplier-page-container .ant-table-tbody > tr > td,
        .layout-root.template-acledagold .purchase-page-container .ant-table-tbody > tr > td,
        .layout-root.template-acledagold .inventory-transaction-container .ant-table-tbody > tr > td {
             background: transparent !important;
             border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
             color: #e2e8f0 !important;
        }

        .layout-root.template-acledagold .inventory-summary-row > td {
             background: rgba(255, 215, 0, 0.05) !important;
             color: #FFD700 !important;
             font-weight: bold;
        }

        /* 🏠 HOMEPAGE / DASHBOARD PREMIUM THEMING 🏠 */
        /* Remove the main black/dark background from the dashboard container */
        .layout-root.template-acledagold .dashboard-container {
             background: transparent !important;
             padding: 24px !important;
        }

        /* Header Card - Transparent Glass */
        .layout-root.template-acledagold .dashboard-header-card {
             background: rgba(255, 255, 255, 0.05) !important;
             backdrop-filter: blur(12px) !important;
             border: 1px solid rgba(255, 215, 0, 0.2) !important;
             box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
        }

        /* Metric/Stat Cards - Aggressively Compact & Clean */
        .layout-root.template-acledagold .metric-card {
             background: var(--bg-card, rgba(15, 23, 42, 0.8)) !important;
             backdrop-filter: blur(12px) !important;
             border: 1px solid rgba(255, 215, 0, 0.2) !important;
             border-radius: 12px !important;
             transition: all 0.2s ease !important;
             padding: 12px 14px !important; /* Very tight padding */
             min-height: 140px !important; /* Low profile */
             display: flex !important;
             flex-direction: column !important;
             justify-content: flex-start !important;
        }

        .layout-root.template-acledagold .metric-card-header {
             display: flex !important;
             justify-content: space-between !important;
             align-items: center !important;
             margin-bottom: 8px !important;
        }

        .layout-root.template-acledagold .metric-value-section {
             margin: 4px 0 !important;
             padding: 0 !important;
             border: none !important;
             text-align: center !important;
        }

        .layout-root.template-acledagold .metric-value {
             font-size: 1.6rem !important; /* Compact but clear */
             font-weight: 700 !important;
             margin: 0 !important;
             padding: 0 !important;
             line-height: 1.2 !important;
             color: #ffffff !important;
        }

        .layout-root.template-acledagold .metric-card:hover {
             border-color: rgba(255, 215, 0, 0.6) !important;
             transform: translateY(-5px);
             box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2) !important;
        }

        /* Chart Cards - Large Glass Panel */
        .layout-root.template-acledagold .chart-card {
             background: var(--bg-card, rgba(15, 23, 42, 0.7)) !important;
             backdrop-filter: blur(15px) !important;
             border: 1px solid rgba(255, 215, 0, 0.2) !important;
             border-radius: 24px !important;
        }

        /* Text Fixes for Dashboard */
        .layout-root.template-acledagold .dashboard-container .header-title,
        .layout-root.template-acledagold .dashboard-container .metric-label,
        .layout-root.template-acledagold .dashboard-container .chart-title {
             color: #FFD700 !important; /* Gold Title */
             text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }

        .layout-root.template-acledagold .dashboard-container .metric-value,
        .layout-root.template-acledagold .dashboard-container .metric-detail-value,
        .layout-root.template-acledagold .dashboard-container .chart-subtitle {
             color: #ffffff !important; /* Bright White */
        }

        .layout-root.template-acledagold .dashboard-container .header-subtitle,
        .layout-root.template-acledagold .dashboard-container .metric-detail-label {
             color: rgba(255, 255, 255, 0.5) !important;
             font-size: 11px !important; /* Minimalist label */
        }

        .layout-root.template-acledagold .dashboard-container .metric-detail-value {
             color: #FFD700 !important;
             font-weight: 600;
             font-size: 13px;
        }

        /* Detail Rows Tighter Spacing */
        .layout-root.template-acledagold .metric-card-footer {
             margin-top: auto !important;
             padding-top: 6px !important;
             border-top: 1px solid rgba(255, 215, 0, 0.1) !important;
        }

        .layout-root.template-acledagold .metric-detail-row {
             display: flex;
             justify-content: space-between;
             align-items: center;
             padding: 2px 0 !important; /* Ultra-tight */
             border: none !important;
        }

        .layout-root.template-acledagold .metric-detail-row:last-child {
             border-bottom: none;
        }

        /* Fix the icons in the stat cards */
        .layout-root.template-acledagold .metric-icon-wrapper {
             border: 1px solid rgba(255, 215, 0, 0.2);
             border-radius: 12px !important;
             width: 40px; /* Smaller icon wrapper */
             height: 40px;
             display: flex;
             align-items: center;
             justify-content: center;
        }

        /* Chart Elements Readability */
        .layout-root.template-acledagold .recharts-cartesian-grid-horizontal line,
        .layout-root.template-acledagold .recharts-cartesian-grid-vertical line {
             stroke: rgba(255, 255, 255, 0.1) !important;
        }

        .layout-root.template-acledagold .recharts-text-tick {
             fill: rgba(255, 255, 255, 0.6) !important;
        }

        .layout-root.template-acledagold .recharts-legend-item-text {
             color: white !important;
        }

        /* Quick Filter Buttons */
        .layout-root.template-acledagold .dashboard-header-card .ant-btn {
             background: rgba(255, 255, 255, 0.1) !important;
             border-color: rgba(255, 215, 0, 0.2) !important;
             color: white !important;
        }

        .layout-root.template-acledagold .dashboard-header-card .ant-btn:hover {
             border-color: #FFD700 !important;
             color: #FFD700 !important;
        }

        /* 💎 PREMIUM MODAL FIXES 💎 */
        /* Force Modal Background to be Dark Gradient */
        .layout-root.template-acledagold .ant-modal-content,
        html.template-acledagold .ant-modal-content {
            background-image: linear-gradient(135deg, #050a14 0%, #0c1b3d 100%) !important;
            border: 1px solid rgba(255, 215, 0, 0.3) !important;
            box-shadow: 0 0 30px rgba(0, 0, 0, 0.8) !important;
            padding: 0 !important; /* Ant design uses padding, we set it specifically in body */
            overflow: hidden;
        }

        .layout-root.template-acledagold .ant-modal-header,
        html.template-acledagold .ant-modal-header {
            background: rgba(255, 215, 0, 0.05) !important;
            border-bottom: 1px solid rgba(255, 215, 0, 0.2) !important;
            padding: 16px 24px !important;
            margin-bottom: 0 !important;
        }

        .layout-root.template-acledagold .ant-modal-title,
        html.template-acledagold .ant-modal-title {
            color: #FFD700 !important;
            font-size: 1.2rem !important;
            font-weight: 700 !important;
        }

        .layout-root.template-acledagold .ant-modal-body,
        html.template-acledagold .ant-modal-body {
            padding: 24px !important;
            color: white !important;
        }
        
        .layout-root.template-acledagold .ant-modal-close {
            color: #FFD700 !important;
        }

        /* Fix internal Cards and colored blocks inside modals (e.g. Purchase Order Form) */
        .layout-root.template-acledagold .ant-modal-content .ant-card,
        .layout-root.template-acledagold .ant-modal-content .bg-gray-50,
        .layout-root.template-acledagold .ant-modal-content .bg-white,
        .layout-root.template-acledagold .ant-modal-content .bg-blue-50 {
            background: rgba(255, 255, 255, 0.03) !important;
            border: 1px solid rgba(255, 215, 0, 0.15) !important;
            backdrop-filter: blur(5px) !important;
            color: white !important;
        }

        /* Input Labels inside Modal Cards */
        .layout-root.template-acledagold .ant-modal-content .ant-card .text-gray-500,
        .layout-root.template-acledagold .ant-modal-content .ant-card .text-xs {
            color: #FFD700 !important; 
            opacity: 0.8;
            font-weight: 500;
        }

        /* Divider text inside Modals */
        .layout-root.template-acledagold .ant-modal-content .ant-divider-inner-text {
            color: #FFD700 !important;
            background: transparent !important;
            font-weight: bold;
        }

        /* --- AGGRESSIVE GLOBAL VISIBILITY FIXES --- */
        /* Kill ALL legacy light backgrounds regardless of where they are */
        html.template-acledagold .bg-white,
        html.template-acledagold .bg-gray-50,
        html.template-acledagold .bg-blue-50,
        html.template-acledagold .bg-slate-50,
        html.template-acledagold .bg-gray-100,
        html.template-acledagold .bg-gray-200,
        .layout-root.template-acledagold .bg-white,
        .layout-root.template-acledagold .bg-gray-50,
        .layout-root.template-acledagold .bg-gray-100 {
            background-color: rgba(255, 255, 255, 0.03) !important;
            background: rgba(255, 255, 255, 0.03) !important;
            color: #ffffff !important;
        }

        html.template-acledagold .ant-card,
        html.template-acledagold .ant-card-body,
        html.template-acledagold .ant-modal-content .ant-card,
        html.template-acledagold .ant-modal-content .ant-card-body,
        .layout-root.template-acledagold .ant-card,
        .layout-root.template-acledagold .ant-card-body {
            background-color: rgba(255, 255, 255, 0.02) !important;
            background: rgba(255, 255, 255, 0.02) !important;
            border-color: rgba(255, 215, 0, 0.2) !important;
        }

        .layout-root.template-acledagold .ant-modal-content .ant-divider-horizontal {
             border-top-color: rgba(255, 215, 0, 0.2) !important;
        }

        /* Footer Buttons Fix */
        .layout-root.template-acledagold .ant-modal-footer,
        html.template-acledagold .ant-modal-footer {
            border-top: 1px solid rgba(255, 215, 0, 0.1) !important;
            padding: 12px 24px !important;
            background: rgba(0, 0, 0, 0.2) !important;
        }

        /* --- INVENTORY TRANSACTION CARD FORMATTING --- */
        .layout-root.template-acledagold .inventory-transaction-container .ant-card {
            background: rgba(15, 23, 42, 0.85) !important;
            border: 1px solid rgba(255, 215, 0, 0.3) !important;
            backdrop-filter: blur(12px) !important;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
            border-radius: 20px !important;
        }

        .layout-root.template-acledagold .inventory-transaction-container .ant-statistic-title {
             color: #FFD700 !important;
             font-size: 14px !important;
             margin-bottom: 12px !important;
             font-weight: 600 !important;
        }

        .layout-root.template-acledagold .inventory-transaction-container .ant-statistic-content-value {
             font-size: 2rem !important;
             font-weight: 800 !important;
             letter-spacing: -1px;
             color: #ffffff !important;
        }

        .layout-root.template-acledagold .inventory-transaction-container .ant-statistic-content-suffix {
             color: rgba(255, 255, 255, 0.6) !important;
             font-size: 1.2rem !important;
             margin-left: 8px;
        }

        /* Right side values in inventory cards */
        .layout-root.template-acledagold .inventory-transaction-container .text-lg.font-bold,
        .layout-root.template-acledagold .inventory-transaction-container .text-xl.font-bold {
             color: #FFD700 !important;
        }

        .layout-root.template-acledagold .inventory-transaction-container .text-xs {
             color: rgba(255, 255, 255, 0.5) !important;
             text-transform: uppercase;
             letter-spacing: 1px;
             font-weight: 700;
        }
        /* Default targeting for Inputs/Selects in Modals Cards */
        .layout-root.template-acledagold .ant-modal-content .ant-input,
        .layout-root.template-acledagold .ant-modal-content .ant-input-number,
        .layout-root.template-acledagold .ant-modal-content .ant-select-selector,
        .layout-root.template-acledagold .ant-modal-content .ant-picker,
        .layout-root.template-acledagold .ant-modal-content .ant-input-number-input,
        .layout-root.template-acledagold .ant-modal-content .ant-select-selection-item {
            background-color: rgba(0, 0, 0, 0.4) !important;
            border-color: rgba(255, 215, 0, 0.5) !important;
            color: white !important;
        }

        /* Specific fix for inputs and selects inside modal card blocks */
        .layout-root.template-acledagold .ant-modal-content .ant-card .ant-input,
        .layout-root.template-acledagold .ant-modal-content .ant-card .ant-input-number,
        .layout-root.template-acledagold .ant-modal-content .ant-card .ant-select-selector,
        .layout-root.template-acledagold .ant-modal-content .ant-card .ant-picker {
            background-color: rgba(0, 0, 0, 0.3) !important;
            border-color: rgba(255, 215, 0, 0.4) !important;
        }

        .layout-root.template-acledagold .supplier-page-container .ant-table-tbody > tr:hover > td,
        .layout-root.template-acledagold .purchase-page-container .ant-table-tbody > tr:hover > td,
        .layout-root.template-acledagold .inventory-transaction-container .ant-table-tbody > tr:hover > td {
             background: rgba(255, 215, 0, 0.05) !important;
        }

        /* --- INVENTORY FIXES (Step 3) --- */

        /* 1. Remove the white background from the MAIN container box */
        .layout-root.template-acledagold .inventory-transaction-container .bg-white {
             background: transparent !important;
             background-color: transparent !important;
             box-shadow: none !important;
             border: none !important;
        }

        /* 2. Target ALL Statistic Cards (Top & Bottom) -> Dark Glass & Clean */
        .layout-root.template-acledagold .inventory-transaction-container .ant-card {
             background: rgba(15, 23, 42, 0.85) !important; /* Unified Dark Background */
             background-color: rgba(15, 23, 42, 0.85) !important;
             background-image: none !important; /* ID 60: Kill all gradients */
             border: 1px solid rgba(255, 215, 0, 0.3) !important; /* Gold Border */
             backdrop-filter: blur(12px) !important;
             box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4) !important;
        }

        /* Specific Kill for the Tailwind Gradients on Top Cards */
        .layout-root.template-acledagold .inventory-transaction-container div[class*="from-green"],
        .layout-root.template-acledagold .inventory-transaction-container div[class*="to-green"],
        .layout-root.template-acledagold .inventory-transaction-container div[class*="from-blue"],
        .layout-root.template-acledagold .inventory-transaction-container div[class*="to-blue"],
        .layout-root.template-acledagold .inventory-transaction-container div[class*="from-purple"],
        .layout-root.template-acledagold .inventory-transaction-container div[class*="to-purple"] {
             background: rgba(15, 23, 42, 0.85) !important;
             background-image: none !important;
        }

        /* 3. Text Clean Up - Value & Titles */
        .layout-root.template-acledagold .inventory-transaction-container .ant-statistic-title {
             color: rgba(255, 255, 255, 0.7) !important; /* Clean White-ish title */
             font-size: 14px;
        }
        
        .layout-root.template-acledagold .inventory-transaction-container .ant-statistic-content-value {
             color: #FFD700 !important; /* Gold Value */
             font-weight: bold;
        }

        /* Override the colored text inside charts */
        .layout-root.template-acledagold .inventory-transaction-container .text-green-700,
        .layout-root.template-acledagold .inventory-transaction-container .text-blue-700,
        .layout-root.template-acledagold .inventory-transaction-container .text-purple-700 {
             color: #ffffff !important; /* Secondary info to White */
        }

        /* Small labels inside cards */
        .layout-root.template-acledagold .inventory-transaction-container .text-xs.text-gray-500 {
             color: rgba(255, 255, 255, 0.5) !important;
        }

        /* 3. Ensure inner structure is transparent */
        .layout-root.template-acledagold .inventory-transaction-container .ant-card .ant-card-body {
             background: transparent !important;
        }

        /* 4. Fix Title Readability caused by removing the white box */
        .layout-root.template-acledagold .inventory-transaction-container h4 {
             text-shadow: 0 2px 4px rgba(0,0,0,0.8);
             margin-bottom: 16px !important;
        }

        /* 5. Inputs and Dropdowns - Make them visible */
        .layout-root.template-acledagold .inventory-transaction-container .ant-picker,
        .layout-root.template-acledagold .inventory-transaction-container .ant-select-selector,
        .layout-root.template-acledagold .inventory-transaction-container input {
             background-color: rgba(15, 23, 42, 0.8) !important;
             border-color: rgba(255, 215, 0, 0.3) !important;
             color: white !important;
             backdrop-filter: blur(5px);
        }

        /* Kill the white badge on net value */
        .layout-root.template-acledagold .inventory-transaction-container .bg-white\/50 {
             background-color: rgba(255, 255, 255, 0.1) !important;
             color: #FFD700 !important;
             border: 1px solid rgba(255, 215, 0, 0.5) !important;
        }

        /* Fix Titles & Text inside Inventory to be Gold/White */
        .layout-root.template-acledagold .inventory-transaction-container h4,
        .layout-root.template-acledagold .inventory-transaction-container h5,
        .layout-root.template-acledagold .inventory-transaction-container .ant-typography {
             color: #FFD700 !important;
        }
        
        /* Force Text-Gray-600 (used in headers) to be Gold in this container */
        .layout-root.template-acledagold .inventory-transaction-container .text-gray-600 {
             color: #FFD700 !important;
        }

        /* Statistic Values - Make them white for contrast against Gold titles */
        .layout-root.template-acledagold .inventory-transaction-container .ant-statistic-content-value {
             color: #ffffff !important;
        }
        
        .layout-root.template-acledagold .inventory-transaction-container .ant-statistic-title,
        .layout-root.template-acledagold .inventory-transaction-container .ant-statistic-content-suffix,
        .layout-root.template-acledagold .inventory-transaction-container .ant-statistic-content-prefix {
             color: #FFD700 !important;
        }

        /* Override dark text utility classes to be visible on dark background */
        .layout-root.template-acledagold .inventory-transaction-container .text-blue-700,
        .layout-root.template-acledagold .inventory-transaction-container .text-blue-600 {
             color: #60a5fa !important; /* blue-400 */
        }
        
        .layout-root.template-acledagold .inventory-transaction-container .text-green-700,
        .layout-root.template-acledagold .inventory-transaction-container .text-green-600 {
             color: #4ade80 !important; /* green-400 */
        }
        
        .layout-root.template-acledagold .inventory-transaction-container .text-orange-600 {
             color: #fbbf24 !important; /* amber-400 */
        }
        
        .layout-root.template-acledagold .inventory-transaction-container .text-purple-700,
        .layout-root.template-acledagold .inventory-transaction-container .text-purple-600 {
             color: #c084fc !important; /* purple-400 */
        }
        
        /* Note: text-red-500 is usually visible enough, but let's brighten it slightly */
        .layout-root.template-acledagold .inventory-transaction-container .text-red-500,
        .layout-root.template-acledagold .inventory-transaction-container .text-red-600 {
             color: #f87171 !important; /* red-400 */
        }

        /* Re-applying Fake Invoice Table Specifics (that got broken) */
        .layout-root.template-acledagold .fake-invoice-page-container .ant-table-thead > tr > th {
            background: rgba(255, 215, 0, 0.1) !important;
            backdrop-filter: blur(8px) !important;
            color: #FFD700 !important;
            border-bottom: 1px solid rgba(255, 215, 0, 0.2) !important;
        }

        .layout-root.template-acledagold .fake-invoice-page-container .ant-table-tbody > tr > td {
            background: transparent !important;
             color: #e2e8f0 !important;
             border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
        }

        .layout-root.template-acledagold .fake-invoice-page-container .ant-table-tbody > tr:hover > td {
            background: rgba(255, 215, 0, 0.1) !important;
        }

        /* ✅ CLEAN CUSTOMER TABLE HEADER FOR ACLEDA GOLD */
        html.template-acledagold .customer-table-modern .ant-table-thead > tr > th {
            background: rgba(255, 215, 0, 0.15) !important;
            backdrop-filter: blur(12px) !important;
            -webkit-backdrop-filter: blur(12px) !important;
            color: #FFD700 !important;
            border-bottom: 1px solid rgba(255, 215, 0, 0.3) !important;
        }
        
        /* Modal Overrides */
        .layout-root.template-acledagold .ant-modal-content,
        .layout-root.template-acledagold .ant-modal-header {
            background-color: rgba(15, 23, 42, 0.98) !important; /* Dark Blue Slate */
            border: 1px solid rgba(255, 215, 0, 0.2) !important;
        }

        .layout-root.template-acledagold .invoice-modal-title {
             color: #FFD700 !important;
        }

        /* --- PRINT INVOICE COMPONENT OVERRIDES (Petronas Styling) --- */
        
        /* Force Modal Body to be white for the preview if needed, or just the component */
        /* The component has class .battambang-font */
        
        .layout-root.template-acledagold .battambang-font,
        .battambang-font { 
            background-color: white !important;
            color: black !important;
        }
        
        /* Force all text inside to be black by default */
        .battambang-font *, .battambang-font p, .battambang-font span, .battambang-font div {
            color: black !important;
        }

        /* Main Headers - Petronas Teal */
        .battambang-font .moul-regular, 
        .battambang-font h2.text-xl {
            color: #00A19B !important;
            text-shadow: none !important;
        }
        
        /* Table Styling */
        .battambang-font table {
            border-color: black !important;
        }
        
        .battambang-font table th, 
        .battambang-font table td {
            border-color: black !important;
            color: black !important;
        }
        
        /* Table Header Row */
        .battambang-font table thead tr {
            background-color: rgba(0, 161, 155, 0.1) !important; /* Petronas Teal Tint for background only */
        }
        
        /* Ensure Table Header text is BLACK */
        .battambang-font table th,
        .battambang-font table th span,
        .battambang-font table th div {
             color: black !important;
        }
        
        /* Fix Grand Total Row to be Black */
        .battambang-font tr.font-bold td,
        .battambang-font tr.font-bold td span,
        .battambang-font tr.font-bold td div {
             color: black !important;
        }
        
        /* General Bold Text - FORCE BLACK (Undo previous teal override) */
        .battambang-font p.font-bold, 
        .battambang-font span.font-bold,
        .battambang-font strong,
        .battambang-font b {
             color: black !important; 
        }

        /* ONLY Main Titles should be Teal */
        .battambang-font .moul-regular, 
        .battambang-font h2.text-xl {
            color: #00A19B !important;
        }

        /* --- FIX POS SIDEBAR INPUTS (Quantity & Selling Price) --- */
        /* Use direct class matching to ensure it hits even if wrapper is missing */
        html.template-acledagold .sidebar-input-qty,
        html.template-acledagold .sidebar-input-price-readonly {
            background-color: rgba(5, 10, 20, 0.85) !important; /* Almost solid dark for clarity */
            border: 1px solid rgba(255, 215, 0, 0.3) !important;
            color: #ffffff !important;
            border-radius: 8px !important;
            height: 42px !important;
            font-weight: 700 !important;
            font-size: 15px !important;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
        }

        /* Quantity Input Specifics */
        html.template-acledagold .sidebar-input-qty {
             padding-right: 50px !important; /* Space for 'L' unit */
             padding-left: 50px !important; /* LARGE Space for Box Icon */
        }

        /* Price Input Specifics */
        html.template-acledagold .sidebar-input-price-readonly {
            padding-left: 40px !important; /* LARGE Space for $ Icon */
            text-align: left !important;
        }

        /* --- FIX ANT DESIGN SELECT DROPDOWNS (GLOBAL FOR THIS THEME) --- */
        html.template-acledagold .ant-select-dropdown {
            background-color: #0c152e !important; /* Deep Dark Blue */
            border: 1px solid rgba(255, 215, 0, 0.3) !important;
            box-shadow: 0 8px 30px rgba(0,0,0,0.8) !important;
            padding: 4px !important;
        }

        html.template-acledagold .ant-select-item {
            color: #e2e8f0 !important;
            border-radius: 6px !important;
            margin-bottom: 2px !important;
        }

        html.template-acledagold .ant-select-item-option-selected {
            background-color: rgba(255, 215, 0, 0.15) !important;
            color: #FFD700 !important;
            font-weight: 700;
        }

        html.template-acledagold .ant-select-item-option-active {
            background-color: rgba(255, 255, 255, 0.08) !important;
        }

        /* --- LOCATION SELECTOR CLEANUP --- */
        .global-pos-sidebar-wrapper .location-selector-container {
             margin-top: 10px;
        }
        
        .global-pos-sidebar-wrapper .location-selector-container .ant-select-selector {
            background-color: rgba(5, 10, 20, 0.6) !important;
            border-color: rgba(255, 215, 0, 0.3) !important;
            color: #FFD700 !important; /* Gold text for selected value */
            height: 42px !important;
            border-radius: 8px !important;
            display: flex;
            align-items: center;
        }

        /* Hide the redundant details box if it's confusing, or style it cleaner */
        /* It seems the user sees 'Main Office' twice because of the details box below */
        .global-pos-sidebar-wrapper .location-selector-container .selected-location-details,
        .global-pos-sidebar-wrapper .location-selector-container .selected-truck-details {
            background: rgba(255, 255, 255, 0.03) !important;
            border: 1px dashed rgba(255, 255, 255, 0.1) !important;
            padding: 8px 12px !important;
            margin-top: 6px;
            border-radius: 6px;
        }
        
        /* Make the inner text of details smaller/subtle */
        .global-pos-sidebar-wrapper .location-selector-container .selected-location-name {
            font-size: 13px !important;
            color: #94a3b8 !important;
            font-weight: normal !important;
        }
        
        /* Tags cleanup */
        .global-pos-sidebar-wrapper .optional-tag {
             background: transparent !important;
             border: 1px solid rgba(255, 165, 0, 0.5) !important;
             color: orange !important;
             font-size: 9px !important;
             padding: 0 4px !important;
        }
        
        /* --- GLOBAL TRUE GLASS OVERRIDES --- */
        /* Applied to all pages using the Acleda Gold template */
        
        /* Force Cards to be Glass */
        html.template-acledagold .ant-card,
        .template-acledagold .ant-card {
            background: rgba(255, 255, 255, 0.03) !important;
            backdrop-filter: blur(15px) !important;
            border: 1px solid rgba(255, 215, 0, 0.2) !important;
            border-radius: 16px !important;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2) !important;
        }
        
        /* Modal & Drawer Glass */
        html.template-acledagold .ant-modal-content,
        html.template-acledagold .ant-drawer-content {
            background: rgba(8, 18, 45, 0.7) !important;
            backdrop-filter: blur(25px) !important;
            border: 1px solid rgba(255, 215, 0, 0.3) !important;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8) !important;
            color: white !important;
        }
        
        html.template-acledagold .ant-modal-header,
        html.template-acledagold .ant-drawer-header {
            background: transparent !important;
            border-bottom: 1px solid rgba(255, 215, 0, 0.2) !important;
        }
        
        /* Table Global Transparency */
        html.template-acledagold .ant-table,
        html.template-acledagold .ant-table-thead > tr > th {
            background: transparent !important;
        }
        
        html.template-acledagold .ant-table-thead > tr > th {
            background: rgba(255, 215, 0, 0.1) !important;
            backdrop-filter: blur(8px) !important;
            color: #FFD700 !important;
            border-bottom: 2px solid rgba(255, 215, 0, 0.3) !important;
        }
        
        /* Tabs Glass */
        html.template-acledagold .ant-tabs-nav::before {
            border-bottom: 1px solid rgba(255, 215, 0, 0.2) !important;
        }
        
        /* Typography - Enforce Khmer & Gold */
        html.template-acledagold h1, 
        html.template-acledagold h2, 
        html.template-acledagold h3,
        html.template-acledagold .ant-typography {
            color: #FFD700 !important;
            font-family: 'Kantumruy Pro', sans-serif !important;
        }
        
        /* Ensure Inputs/Selects (if any) are hidden or styled for print */
        /* (The invoice is mostly text) */
    `,

    // Typography
    typography: {
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontSizeBase: '14px',
        fontSizeSm: '12px',
        fontSizeLg: '16px',
        fontSizeXl: '20px',
        fontSizeTitle: '24px',
        fontWeightNormal: 400,
        fontWeightMedium: 500,
        fontWeightBold: 700,
        lineHeight: 1.5
    },

    // Layout
    layout: {
        sidebarWidth: '280px',
        sidebarCollapsedWidth: '80px',
        headerHeight: '70px',
        contentPadding: '24px',
        cardPadding: '20px',

        // Border radius - Slightly rounded like the app cards
        borderRadius: '16px',
        borderRadiusLg: '24px',
        borderRadiusPill: '9999px',

        // Shadows
        shadowSm: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        shadowMd: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
        shadowLg: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
    },

    // Components
    components: {
        // Button styles
        button: {
            height: '44px',
            heightLg: '50px',
            paddingX: '24px',
            borderRadius: '12px'
        },

        // Input styles
        input: {
            height: '44px',
            heightLg: '50px',
            borderRadius: '12px',
            borderWidth: '1px'
        },

        // Card styles
        card: {
            borderRadius: '20px',
            shadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            padding: '24px'
        },

        // Table styles (Dark transparent)
        table: {
            headerBg: 'rgba(255, 215, 0, 0.1)', // Gold tint
            rowHoverBg: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px'
        },

        // Menu styles
        menu: {
            itemHeight: '48px',
            itemPaddingX: '16px',
            itemBorderRadius: '12px'
        }
    },

    // Sidebar specific
    sidebar: {
        background: 'rgba(8, 16, 32, 0.85)',
        textColor: '#cbd5e1',
        textColorActive: '#FFD700', // Gold text for active
        itemHoverBg: 'rgba(255, 255, 255, 0.05)',
        itemActiveBg: 'rgba(255, 215, 0, 0.1)' // Gold tint background
    },

    // Effects
    effects: {
        glassBlur: 'blur(16px)', // Heavy blur for premium feel
        glassBg: 'rgba(15, 32, 75, 0.6)',
        transition: '0.3s ease-out'
    },

    // Dark Mode overrides
    darkColors: {
        bgMain: 'transparent', // Let fixed gradients show
        bgCard: 'rgba(15, 25, 50, 0.8)',
        textPrimary: '#ffffff'
    }
};

export default acledaGoldTemplate;
