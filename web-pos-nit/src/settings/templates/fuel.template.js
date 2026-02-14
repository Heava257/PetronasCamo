/**
 * Fuel System Template - Modern Petroleum Theme
 * Cool system with blue/cyan petroleum colors
 */
export const fuelTemplate = {
    id: 'fuel',
    name: 'Fuel System',
    description: 'Modern petroleum theme with cool blue tones',
    preview: {
        primaryColor: '#0ea5e9',
        backgroundColor: '#0a1929',
        cardColor: 'rgba(14, 165, 233, 0.15)'
    },

    // Colors - Petroleum/Fuel inspired
    colors: {
        primary: '#0ea5e9', // Sky Blue
        primaryHover: '#0284c7',
        primaryLight: 'rgba(14, 165, 233, 0.2)',
        secondary: '#06b6d4', // Cyan
        accent: '#22d3ee', // Bright Cyan

        // Background colors
        bgMain: 'transparent',
        bgCard: 'rgba(14, 116, 144, 0.25)',
        bgSidebar: 'rgba(8, 47, 73, 0.4)',
        bgHeader: 'rgba(14, 165, 233, 0.1)',

        // Text colors
        textPrimary: '#ffffff',
        textSecondary: '#22d3ee',
        textMuted: 'rgba(255, 255, 255, 0.7)',
        textOnPrimary: '#ffffff',

        // Border colors
        borderColor: 'rgba(34, 211, 238, 0.3)',
        borderLight: 'rgba(34, 211, 238, 0.15)',

        // Status colors
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
    },

    sidebar: {
        background: 'rgba(8, 47, 73, 0.4)',
        textColor: '#ffffff',
        textColorActive: '#22d3ee',
        itemHoverBg: 'rgba(34, 211, 238, 0.15)',
        itemActiveBg: 'rgba(34, 211, 238, 0.25)'
    },

    typography: {
        fontFamily: "'Inter', 'Khmer OS System', sans-serif",
        fontSizeBase: '14px',
        fontSizeSm: '12px',
        fontSizeLg: '16px',
        fontSizeXl: '18px',
        fontSizeTitle: '24px',
        fontWeightNormal: '400',
        fontWeightMedium: '500',
        fontWeightBold: '700'
    },

    layout: {
        sidebarWidth: '260px',
        sidebarCollapsedWidth: '80px',
        headerHeight: '64px',
        contentPadding: '24px',
        cardPadding: '24px',
        borderRadius: '16px',
        borderRadiusLg: '24px',
        borderRadiusPill: '50px',
        shadowSm: '0 2px 8px rgba(0, 0, 0, 0.1)',
        shadowMd: '0 8px 16px rgba(0, 0, 0, 0.15)',
        shadowLg: '0 16px 32px rgba(0, 0, 0, 0.2)'
    },

    components: {
        button: {
            height: '40px',
            heightLg: '48px'
        },
        input: {
            height: '40px',
            heightLg: '48px'
        },
        menu: {
            itemHeight: '44px'
        }
    },

    effects: {
        glassBlur: '12px',
        glassBg: 'rgba(255, 255, 255, 0.05)',
        transition: '0.3s'
    },

    customCss: `
        /* Background with blue gradient */
        html.template-fuel::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(10, 25, 41, 0.95) 0%, rgba(3, 7, 18, 0.98) 100%);
            z-index: -2;
        }

        /* Cyan glow overlay */
        html.template-fuel::after {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 30% 30%, rgba(34, 211, 238, 0.08) 0%, transparent 60%);
            z-index: -1;
            pointer-events: none;
            animation: fuelPulse 8s ease-in-out infinite;
        }

        @keyframes fuelPulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
        }

        /* Sidebar */
        html.template-fuel .hierarchical-sidebar,
        html.template-fuel .ant-layout-sider {
            background: rgba(8, 47, 73, 0.4) !important;
            backdrop-filter: blur(25px) !important;
            border-right: 1px solid rgba(34, 211, 238, 0.2) !important;
        }

        /* Header */
        html.template-fuel .clean-dark-header {
            background: rgba(14, 165, 233, 0.1) !important;
            backdrop-filter: blur(15px) !important;
            border-bottom: 1px solid rgba(34, 211, 238, 0.2) !important;
        }

        /* All Cards */
        html.template-fuel .ant-card {
            background: linear-gradient(135deg, rgba(14, 116, 144, 0.25) 0%, rgba(8, 47, 73, 0.3) 100%) !important;
            backdrop-filter: blur(20px) !important;
            border: 1px solid rgba(34, 211, 238, 0.2) !important;
        }

        /* Table Headers */
        html.template-fuel .ant-table-thead > tr > th {
            background: rgba(8, 47, 73, 0.7) !important;
            color: #22d3ee !important;
            border-color: rgba(34, 211, 238, 0.2) !important;
        }

        /* Table Cells */
        html.template-fuel .ant-table-tbody > tr > td {
            background: transparent !important;
            color: #ffffff !important;
            border-color: rgba(34, 211, 238, 0.1) !important;
        }

        /* Table Hover */
        html.template-fuel .ant-table-tbody > tr:hover > td {
            background: rgba(34, 211, 238, 0.1) !important;
        }

        /* Inputs */
        html.template-fuel .ant-input,
        html.template-fuel .ant-select-selector,
        html.template-fuel .ant-picker {
            background: rgba(0, 0, 0, 0.4) !important;
            border-color: rgba(34, 211, 238, 0.3) !important;
            color: #ffffff !important;
        }

        /* Buttons */
        html.template-fuel .ant-btn-primary {
            background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%) !important;
            border-color: #0ea5e9 !important;
            color: #ffffff !important;
        }

        html.template-fuel .ant-btn-default {
            background: rgba(34, 211, 238, 0.1) !important;
            border-color: rgba(34, 211, 238, 0.3) !important;
            color: #22d3ee !important;
        }

        /* Modals */
        html.template-fuel .ant-modal-content {
            background: rgba(10, 25, 41, 0.95) !important;
            backdrop-filter: blur(20px) !important;
            border: 1px solid rgba(34, 211, 238, 0.3) !important;
        }

        /* Text Colors */
        html.template-fuel .ant-typography,
        html.template-fuel h1,
        html.template-fuel h2,
        html.template-fuel h3,
        html.template-fuel h4,
        html.template-fuel p {
            color: #ffffff !important;
        }

        /* Form Labels */
        html.template-fuel .ant-form-item-label > label {
            color: #22d3ee !important;
        }

        /* Statistic Values */
        html.template-fuel .ant-statistic-content-value {
            color: #22d3ee !important;
        }

        /* ==========================================
           UNIVERSAL MODAL STYLES (ALL MODALS)
           ========================================== */

        /* All Modal Containers */
        html.template-fuel .ant-modal-content {
            background: linear-gradient(135deg, rgba(10, 25, 41, 0.98) 0%, rgba(8, 47, 73, 0.95) 100%) !important;
            border: 1px solid rgba(34, 211, 238, 0.3) !important;
            color: white !important;
        }

        /* All Modal Headers */
        html.template-fuel .ant-modal-header {
            background: transparent !important;
            border-bottom: 1px solid rgba(34, 211, 238, 0.2) !important;
        }

        html.template-fuel .ant-modal-title {
            color: #22d3ee !important;
        }

        /* All Modal Bodies */
        html.template-fuel .ant-modal-body {
            color: white !important;
        }

        /* All Form Labels in Modals */
        html.template-fuel .ant-modal label,
        html.template-fuel .ant-modal .ant-form-item-label > label {
            color: #22d3ee !important;
        }

        /* ALL Input Fields in ALL Modals */
        html.template-fuel .ant-modal input,
        html.template-fuel .ant-modal textarea,
        html.template-fuel .ant-modal .ant-input,
        html.template-fuel .ant-modal .ant-input-number,
        html.template-fuel .ant-modal .ant-input-number-input,
        html.template-fuel .ant-modal .ant-input-affix-wrapper,
        html.template-fuel .ant-modal .ant-select-selector,
        html.template-fuel .ant-modal .ant-picker,
        html.template-fuel .ant-modal .ant-picker-input > input {
            background: rgba(0, 0, 0, 0.6) !important;
            background-color: rgba(0, 0, 0, 0.6) !important;
            border-color: rgba(34, 211, 238, 0.3) !important;
            color: #ffffff !important;
        }

        /* Fix for inputs inside Affix Wrappers */
        html.template-fuel .ant-modal .ant-input-affix-wrapper input.ant-input {
            background-color: transparent !important;
            border: none !important;
        }

        /* Disabled/Readonly Inputs in Modals */
        html.template-fuel .ant-modal input:disabled,
        html.template-fuel .ant-modal input[readonly],
        html.template-fuel .ant-modal .ant-input:disabled,
        html.template-fuel .ant-modal .ant-input[readonly],
        html.template-fuel .ant-modal .ant-input-disabled {
            background: rgba(0, 0, 0, 0.5) !important;
            background-color: rgba(0, 0, 0, 0.5) !important;
            border-color: rgba(34, 211, 238, 0.2) !important;
            color: rgba(255, 255, 255, 0.6) !important;
        }

        /* Input Focus State */
        html.template-fuel .ant-modal input:focus,
        html.template-fuel .ant-modal .ant-input:focus,
        html.template-fuel .ant-modal .ant-input-number:focus,
        html.template-fuel .ant-modal .ant-select-focused .ant-select-selector,
        html.template-fuel .ant-modal .ant-picker-focused {
            background: rgba(0, 0, 0, 0.7) !important;
            background-color: rgba(0, 0, 0, 0.7) !important;
            border-color: #22d3ee !important;
            box-shadow: 0 0 0 2px rgba(34, 211, 238, 0.2) !important;
        }

        /* Input Number Handlers */
        html.template-fuel .ant-modal .ant-input-number-handler-wrap {
            background: rgba(0, 0, 0, 0.4) !important;
            border-left-color: rgba(34, 211, 238, 0.3) !important;
        }

        html.template-fuel .ant-modal .ant-input-number-handler {
            border-color: rgba(34, 211, 238, 0.2) !important;
            color: #22d3ee !important;
        }

        html.template-fuel .ant-modal .ant-input-number-handler:hover {
            background: rgba(34, 211, 238, 0.1) !important;
        }

        /* Select Dropdown Items */
        html.template-fuel .ant-modal .ant-select-selection-item,
        html.template-fuel .ant-modal .ant-select-selection-placeholder {
            color: #ffffff !important;
        }

        /* Date Picker Icons */
        html.template-fuel .ant-modal .ant-picker-suffix,
        html.template-fuel .ant-modal .ant-picker-clear {
            color: #22d3ee !important;
        }

        /* Input Icons */
        html.template-fuel .ant-modal .ant-input-prefix,
        html.template-fuel .ant-modal .ant-input-suffix {
            color: rgba(34, 211, 238, 0.6) !important;
        }

        /* Placeholder Text */
        html.template-fuel .ant-modal input::placeholder,
        html.template-fuel .ant-modal textarea::placeholder {
            color: rgba(255, 255, 255, 0.4) !important;
        }

        /* Autofill Fix for ALL Modals */
        html.template-fuel .ant-modal input:-webkit-autofill,
        html.template-fuel .ant-modal input:-webkit-autofill:hover,
        html.template-fuel .ant-modal input:-webkit-autofill:focus,
        html.template-fuel .ant-modal textarea:-webkit-autofill {
            -webkit-box-shadow: 0 0 0 1000px #0a1929 inset !important;
            -webkit-text-fill-color: #ffffff !important;
            transition: background-color 5000s ease-in-out 0s;
        }

        /* Modal Footer Buttons */
        html.template-fuel .ant-modal-footer .ant-btn-default {
            background: rgba(34, 211, 238, 0.1) !important;
            border-color: rgba(34, 211, 238, 0.3) !important;
            color: #22d3ee !important;
        }

        html.template-fuel .ant-modal-footer .ant-btn-primary {
            background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%) !important;
            border-color: #0ea5e9 !important;
            color: white !important;
        }

        /* Tables inside Modals */
        html.template-fuel .ant-modal table {
            border-color: rgba(34, 211, 238, 0.2) !important;
        }

        html.template-fuel .ant-modal th {
            background: rgba(8, 47, 73, 0.5) !important;
            color: #22d3ee !important;
            border-color: rgba(34, 211, 238, 0.2) !important;
        }

        html.template-fuel .ant-modal td {
            border-color: rgba(34, 211, 238, 0.1) !important;
            color: white !important;
        }

        /* Dashed Buttons in Modals */
        html.template-fuel .ant-modal .ant-btn-dashed {
            background: rgba(34, 211, 238, 0.05) !important;
            border-color: rgba(34, 211, 238, 0.3) !important;
            color: #22d3ee !important;
        }

        html.template-fuel .ant-modal .ant-btn-dashed:hover {
            background: rgba(34, 211, 238, 0.15) !important;
            border-color: #22d3ee !important;
        }

        /* Remove ALL white backgrounds in modals */
        html.template-fuel .ant-modal .bg-white,
        html.template-fuel .ant-modal [class*="bg-white"],
        html.template-fuel .ant-modal .bg-gray-50,
        html.template-fuel .ant-modal .bg-gray-100,
        html.template-fuel .ant-modal [class*="bg-gray"],
        html.template-fuel .ant-modal div[style*="background: white"],
        html.template-fuel .ant-modal div[style*="background-color: white"],
        html.template-fuel .ant-modal div[style*="background: #fff"],
        html.template-fuel .ant-modal div[style*="background-color: #fff"] {
            background: rgba(8, 47, 73, 0.4) !important;
            background-color: rgba(8, 47, 73, 0.4) !important;
            border-color: rgba(34, 211, 238, 0.2) !important;
        }

        /* Modal Content Sections */
        html.template-fuel .ant-modal .ant-card,
        html.template-fuel .ant-modal .ant-card-body {
            background: rgba(8, 47, 73, 0.4) !important;
            border-color: rgba(34, 211, 238, 0.2) !important;
        }

        /* List items in modals */
        html.template-fuel .ant-modal .ant-list-item {
            background: rgba(8, 47, 73, 0.3) !important;
            border-color: rgba(34, 211, 238, 0.1) !important;
            color: white !important;
        }

        /* Descriptions in modals */
        html.template-fuel .ant-modal .ant-descriptions-item-label {
            color: #22d3ee !important;
        }

        html.template-fuel .ant-modal .ant-descriptions-item-content {
            color: white !important;
        }

        /* All text in modals */
        html.template-fuel .ant-modal p,
        html.template-fuel .ant-modal span,
        html.template-fuel .ant-modal div {
            color: inherit !important;
        }

        /* Specific text colors */
        html.template-fuel .ant-modal .text-gray-500,
        html.template-fuel .ant-modal .text-gray-600,
        html.template-fuel .ant-modal .text-gray-700,
        html.template-fuel .ant-modal .text-gray-800,
        html.template-fuel .ant-modal .text-gray-900 {
            color: rgba(255, 255, 255, 0.8) !important;
        }

        /* Order Items / Product Lists in Modals */
        html.template-fuel .ant-modal .order-items,
        html.template-fuel .ant-modal .product-list,
        html.template-fuel .ant-modal [class*="items"],
        html.template-fuel .ant-modal [class*="list"] {
            background: transparent !important;
        }

        /* Item cards/boxes in modals */
        html.template-fuel .ant-modal .item-card,
        html.template-fuel .ant-modal .product-card,
        html.template-fuel .ant-modal [class*="card"] {
            background: rgba(8, 47, 73, 0.4) !important;
            border-color: rgba(34, 211, 238, 0.2) !important;
        }

        /* AGGRESSIVE: Force ALL divs in modals to have dark background */
        html.template-fuel .ant-modal-body > div,
        html.template-fuel .ant-modal-body > div > div,
        html.template-fuel .ant-modal-body > div > div > div,
        html.template-fuel .ant-modal-body div[class*="bg"],
        html.template-fuel .ant-modal-body div[class*="rounded"],
        html.template-fuel .ant-modal-body div[class*="shadow"],
        html.template-fuel .ant-modal-body div[class*="border"],
        html.template-fuel .ant-modal-body div[class*="p-"],
        html.template-fuel .ant-modal-body div[class*="px-"],
        html.template-fuel .ant-modal-body div[class*="py-"],
        html.template-fuel .ant-modal-body section,
        html.template-fuel .ant-modal-body article {
            background-color: transparent !important;
        }

        /* Target specific white/light backgrounds */
        html.template-fuel .ant-modal-body div[style*="background"],
        html.template-fuel .ant-modal-body div[style*="backgroundColor"] {
            background: rgba(8, 47, 73, 0.4) !important;
            background-color: rgba(8, 47, 73, 0.4) !important;
        }

        /* Force override for Tailwind classes */
        html.template-fuel .ant-modal .bg-white,
        html.template-fuel .ant-modal .dark\:bg-white,
        html.template-fuel .ant-modal .bg-gray-50,
        html.template-fuel .ant-modal .bg-gray-100,
        html.template-fuel .ant-modal .bg-gray-200,
        html.template-fuel .ant-modal .dark\:bg-gray-50,
        html.template-fuel .ant-modal .dark\:bg-gray-100,
        html.template-fuel .ant-modal .dark\:bg-gray-800,
        html.template-fuel .ant-modal .dark\:bg-gray-900 {
            background: rgba(8, 47, 73, 0.4) !important;
            background-color: rgba(8, 47, 73, 0.4) !important;
        }

        /* Specific for order items / product displays */
        html.template-fuel .ant-modal div[class*="order"],
        html.template-fuel .ant-modal div[class*="Order"],
        html.template-fuel .ant-modal div[class*="item"],
        html.template-fuel .ant-modal div[class*="Item"],
        html.template-fuel .ant-modal div[class*="product"],
        html.template-fuel .ant-modal div[class*="Product"] {
            background-color: transparent !important;
        }

        /* Content wrappers */
        html.template-fuel .ant-modal .content,
        html.template-fuel .ant-modal .container,
        html.template-fuel .ant-modal .wrapper,
        html.template-fuel .ant-modal [class*="content"],
        html.template-fuel .ant-modal [class*="Container"],
        html.template-fuel .ant-modal [class*="wrapper"] {
            background: transparent !important;
            background-color: transparent !important;
        }

        /* Space/padding containers */
        html.template-fuel .ant-modal .space-y-2,
        html.template-fuel .ant-modal .space-y-3,
        html.template-fuel .ant-modal .space-y-4,
        html.template-fuel .ant-modal [class*="space-"] {
            background: transparent !important;
        }

        /* Flex/Grid containers */
        html.template-fuel .ant-modal .flex,
        html.template-fuel .ant-modal .grid,
        html.template-fuel .ant-modal [class*="flex"],
        html.template-fuel .ant-modal [class*="grid"] {
            background: transparent !important;
        }

        /* Any element with padding/margin classes */
        html.template-fuel .ant-modal [class*="p-4"],
        html.template-fuel .ant-modal [class*="p-6"],
        html.template-fuel .ant-modal [class*="p-8"],
        html.template-fuel .ant-modal [class*="m-4"],
        html.template-fuel .ant-modal [class*="m-6"] {
            background: transparent !important;
        }

        /* Override any remaining white boxes */
        html.template-fuel .ant-modal * {
            background-color: inherit;
        }

        html.template-fuel .ant-modal *[style*="background: white"],
        html.template-fuel .ant-modal *[style*="background-color: white"],
        html.template-fuel .ant-modal *[style*="background: #fff"],
        html.template-fuel .ant-modal *[style*="background-color: #fff"],
        html.template-fuel .ant-modal *[style*="background: rgb(255"],
        html.template-fuel .ant-modal *[style*="background-color: rgb(255"] {
            background: rgba(8, 47, 73, 0.4) !important;
            background-color: rgba(8, 47, 73, 0.4) !important;
        }




        /* POS / PRE-ORDERS PAGE */
        html.template-fuel .pre-orders-full-view {
            background: transparent !important;
        }

        html.template-fuel .page-header,
        html.template-fuel .pre-orders-full-view .page-header {
            background: linear-gradient(135deg, rgba(14, 116, 144, 0.4) 0%, rgba(8, 47, 73, 0.5) 100%) !important;
            backdrop-filter: blur(20px) !important;
            border: 1px solid rgba(34, 211, 238, 0.2) !important;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3) !important;
        }

        html.template-fuel .header-title,
        html.template-fuel .pre-orders-full-view .header-title {
            color: #22d3ee !important;
            text-shadow: 0 0 15px rgba(34, 211, 238, 0.3);
        }

        html.template-fuel .table-container,
        html.template-fuel .pre-orders-full-view .table-container {
            background: rgba(8, 47, 73, 0.3) !important;
            backdrop-filter: blur(12px) !important;
            border: 1px solid rgba(34, 211, 238, 0.2) !important;
        }

        /* Stock Cards */
        html.template-fuel .stock-card,
        html.template-fuel .stock-card-lpg,
        html.template-fuel .stock-card-gasoline,
        html.template-fuel .stock-card-diesel {
            background: rgba(14, 116, 144, 0.25) !important;
            border: 1px solid rgba(34, 211, 238, 0.2) !important;
            backdrop-filter: blur(16px) !important;
        }

        html.template-fuel .stock-card-value {
            color: #22d3ee !important;
        }

        /* Action Buttons */
        html.template-fuel .action-btn-add {
            background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%) !important;
            color: #ffffff !important;
            border: none !important;
        }

        html.template-fuel .action-btn-view {
            background: rgba(34, 211, 238, 0.1) !important;
            border-color: rgba(34, 211, 238, 0.3) !important;
            color: #22d3ee !important;
        }

        /* GLOBAL SUMMARY CARDS */
        html.template-fuel .global-summary-card {
            background-color: #0e4a5f !important;
            background: #0e4a5f !important;
            border: 1px solid #1a6b85 !important;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3) !important;
            color: #22d3ee !important;
        }

        html.template-fuel .global-summary-card:hover {
            border-color: #22d3ee !important;
            transform: translateY(-2px);
            transition: all 0.3s ease;
        }

        html.template-fuel .global-summary-card span,
        html.template-fuel .global-summary-card div {
            color: #22d3ee !important;
        }

        html.template-fuel .global-summary-card svg {
            color: #22d3ee !important;
            fill: #22d3ee !important;
        }

        /* ==========================================
           INTEGRATED INVOICE SIDEBAR / POS PAGE
           ========================================== */

        /* Main Container */
        html.template-fuel .invoice-sidebar-no-scroll {
            background: rgba(10, 25, 41, 0.95) !important;
        }

        /* Grid Columns */
        html.template-fuel .grid-column,
        html.template-fuel .cart-column,
        html.template-fuel .info-column,
        html.template-fuel .summary-column {
            background: rgba(8, 47, 73, 0.3) !important;
            border-color: rgba(34, 211, 238, 0.2) !important;
            backdrop-filter: blur(10px) !important;
        }

        /* Column Titles */
        html.template-fuel .column-title {
            color: #22d3ee !important;
            border-bottom-color: #22d3ee !important;
        }

        /* Cart Items */
        html.template-fuel .cart-item-compact {
            background: rgba(0, 0, 0, 0.4) !important;
            border-color: rgba(34, 211, 238, 0.2) !important;
        }

        html.template-fuel .cart-item-compact:hover {
            border-color: #22d3ee !important;
        }

        html.template-fuel .item-number {
            background: #22d3ee !important;
            color: #000000 !important;
        }

        html.template-fuel .item-name {
            color: #ffffff !important;
        }

        html.template-fuel .item-category-tag {
            background: rgba(34, 211, 238, 0.15) !important;
            color: #22d3ee !important;
            border-left-color: #22d3ee !important;
        }

        /* Inputs */
        html.template-fuel .qty-input-compact {
            background: rgba(0, 0, 0, 0.5) !important;
            border-color: rgba(34, 211, 238, 0.3) !important;
            color: #ffffff !important;
        }

        html.template-fuel .qty-input-compact:focus {
            border-color: #22d3ee !important;
        }

        /* Price Display */
        html.template-fuel .item-price-display {
            background: rgba(8, 47, 73, 0.3) !important;
        }

        html.template-fuel .item-row-total {
            color: #22d3ee !important;
        }

        html.template-fuel .price-label,
        html.template-fuel .price-value {
            color: #22d3ee !important;
        }

        /* Pre-order Context */
        html.template-fuel .item-preorder-context {
            background: rgba(34, 211, 238, 0.1) !important;
            border-color: rgba(34, 211, 238, 0.3) !important;
        }

        /* Form Elements */
        html.template-fuel .form-label-compact {
            color: #22d3ee !important;
        }

        html.template-fuel .select-compact .ant-select-selector,
        html.template-fuel .date-picker-compact input,
        html.template-fuel .textarea-compact {
            background: rgba(0, 0, 0, 0.5) !important;
            border-color: rgba(34, 211, 238, 0.3) !important;
            color: #ffffff !important;
        }

        html.template-fuel .ant-select-selection-item,
        html.template-fuel .ant-select-selection-placeholder {
            color: #ffffff !important;
        }

        /* Selected Info Display */
        html.template-fuel .selected-info-display {
            background: rgba(0, 0, 0, 0.4) !important;
            border-color: rgba(34, 211, 238, 0.2) !important;
        }

        html.template-fuel .info-name {
            color: #22d3ee !important;
        }

        html.template-fuel .info-address {
            color: rgba(255, 255, 255, 0.7) !important;
        }

        /* Summary Section */
        html.template-fuel .po-badge {
            background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%) !important;
            color: #ffffff !important;
        }

        html.template-fuel .stat-card {
            background: rgba(0, 0, 0, 0.4) !important;
            border-color: rgba(34, 211, 238, 0.3) !important;
        }

        html.template-fuel .stat-label {
            color: rgba(255, 255, 255, 0.7) !important;
        }

        html.template-fuel .stat-value {
            color: #22d3ee !important;
        }

        html.template-fuel .summary-breakdown {
            background: rgba(0, 0, 0, 0.4) !important;
            border-color: rgba(34, 211, 238, 0.2) !important;
        }

        html.template-fuel .breakdown-label {
            color: rgba(255, 255, 255, 0.8) !important;
        }

        html.template-fuel .breakdown-value {
            color: #ffffff !important;
        }

        html.template-fuel .total-value {
            color: #22d3ee !important;
        }

        /* Action Buttons */
        html.template-fuel .btn-checkout-compact {
            background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%) !important;
            color: #ffffff !important;
        }

        html.template-fuel .btn-preview-compact {
            background: rgba(34, 211, 238, 0.1) !important;
            border-color: rgba(34, 211, 238, 0.4) !important;
            color: #22d3ee !important;
        }

        html.template-fuel .btn-preview-compact:hover:not(:disabled) {
            background: rgba(34, 211, 238, 0.2) !important;
            color: #22d3ee !important;
        }

        html.template-fuel .validation-note {
            background: rgba(34, 197, 94, 0.2) !important;
            color: #4ade80 !important;
            border-left-color: #22c55e !important;
        }

        /* ==========================================
           CUSTOMER MODAL STYLES
           ========================================== */

        /* Modal Container */
        html.template-fuel .customer-modal .ant-modal-content {
            background: linear-gradient(135deg, rgba(10, 25, 41, 0.98) 0%, rgba(8, 47, 73, 0.95) 100%) !important;
            border: 1px solid rgba(34, 211, 238, 0.3) !important;
            color: white !important;
        }

        /* Modal Title */
        html.template-fuel .customer-modal .text-gray-800 {
            color: #22d3ee !important;
        }

        html.template-fuel .customer-modal .border-gray-100 {
            border-color: rgba(34, 211, 238, 0.2) !important;
        }

        /* Icons in Title */
        html.template-fuel .customer-modal .text-blue-500.bg-blue-50 {
            color: #22d3ee !important;
            background-color: rgba(34, 211, 238, 0.15) !important;
        }

        /* Section Containers */
        html.template-fuel .customer-modal div[class*="bg-gray-"],
        html.template-fuel .customer-modal div[class*="bg-white"] {
            background: rgba(8, 47, 73, 0.6) !important;
            border-color: rgba(34, 211, 238, 0.2) !important;
            backdrop-filter: blur(5px);
        }

        /* Section Badges */
        html.template-fuel .customer-modal .absolute.-top-3 {
            background: #082f49 !important;
            border: 1px solid #22d3ee !important;
            color: #22d3ee !important;
            box-shadow: 0 0 10px rgba(34, 211, 238, 0.2) !important;
            z-index: 10;
        }

        /* Override badge text colors */
        html.template-fuel .customer-modal .text-blue-500,
        html.template-fuel .customer-modal .text-green-500,
        html.template-fuel .customer-modal .text-purple-500 {
            color: #22d3ee !important;
        }

        /* Form Labels */
        html.template-fuel .customer-modal label {
            color: rgba(255, 255, 255, 0.8) !important;
        }

        html.template-fuel .customer-modal .ant-form-item-label > label {
            color: #22d3ee !important;
        }

        /* INPUT & TEXTAREA FIX */
        html.template-fuel .customer-modal input,
        html.template-fuel .customer-modal textarea,
        html.template-fuel .customer-modal .ant-input,
        html.template-fuel .customer-modal .ant-input-affix-wrapper,
        html.template-fuel .customer-modal .ant-select-selector,
        html.template-fuel .customer-modal .ant-picker {
            background-color: rgba(0, 0, 0, 0.6) !important;
            border-color: rgba(34, 211, 238, 0.3) !important;
            color: #22d3ee !important;
        }

        /* Fix for inputs inside Affix Wrappers */
        html.template-fuel .customer-modal .ant-input-affix-wrapper input.ant-input {
            background-color: transparent !important;
            border: none !important;
        }

        /* AUTOFILL FIX */
        html.template-fuel .customer-modal input:-webkit-autofill,
        html.template-fuel .customer-modal input:-webkit-autofill:hover,
        html.template-fuel .customer-modal input:-webkit-autofill:focus,
        html.template-fuel .customer-modal input:-webkit-autofill:active,
        html.template-fuel .customer-modal textarea:-webkit-autofill,
        html.template-fuel .customer-modal textarea:-webkit-autofill:hover {
            -webkit-box-shadow: 0 0 0 1000px #0a1929 inset !important;
            -webkit-text-fill-color: #22d3ee !important;
            transition: background-color 5000s ease-in-out 0s;
        }

        html.template-fuel .customer-modal .ant-input::placeholder,
        html.template-fuel .customer-modal input::placeholder,
        html.template-fuel .customer-modal textarea::placeholder {
            color: rgba(255, 255, 255, 0.4) !important;
        }

        /* Buttons */
        html.template-fuel .customer-modal .ant-btn-primary,
        html.template-fuel .customer-modal .bg-blue-500,
        html.template-fuel .customer-modal .bg-orange-500 {
            background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%) !important;
            border-color: #0ea5e9 !important;
            color: white !important;
        }

        /* ==========================================
           INVENTORY TRANSACTION STYLES
           ========================================== */

        /* Statistics Cards */
        html.template-fuel .inventory-transaction-container .ant-card {
            background-color: #0e4a5f !important;
            background: #0e4a5f !important;
            border: 1px solid #1a6b85 !important;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3) !important;
        }

        html.template-fuel .inventory-transaction-container .ant-card:hover {
            border-color: #22d3ee !important;
            transform: translateY(-2px);
            transition: all 0.3s ease;
        }

        html.template-fuel .inventory-transaction-container .ant-statistic-title {
            color: rgba(255, 255, 255, 0.8) !important;
        }

        html.template-fuel .inventory-transaction-container .ant-statistic-content-value {
            color: #22d3ee !important;
        }

        /* Override colored backgrounds */
        html.template-fuel .inventory-transaction-container .from-green-50,
        html.template-fuel .inventory-transaction-container .from-blue-50,
        html.template-fuel .inventory-transaction-container .from-purple-50,
        html.template-fuel .inventory-transaction-container .bg-blue-50\\/30 {
            background: rgba(8, 47, 73, 0.3) !important;
            border-color: rgba(34, 211, 238, 0.2) !important;
        }

        /* FORCE CLEAR WHITE BACKGROUND */
        html.template-fuel .inventory-transaction-container,
        html.template-fuel .inventory-transaction-container > div.bg-white,
        html.template-fuel .inventory-transaction-container .rounded-lg.bg-white {
            background-color: transparent !important;
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
        }

        /* Text Colors */
        html.template-fuel .inventory-transaction-container h4.ant-typography,
        html.template-fuel .inventory-transaction-container h5.ant-typography,
        html.template-fuel .inventory-transaction-container .ant-typography {
            color: #22d3ee !important;
        }

        html.template-fuel .inventory-transaction-container .text-gray-600,
        html.template-fuel .inventory-transaction-container .text-gray-500 {
            color: rgba(255, 255, 255, 0.8) !important;
        }

        html.template-fuel .inventory-transaction-container .text-green-700,
        html.template-fuel .inventory-transaction-container .text-blue-700,
        html.template-fuel .inventory-transaction-container .text-purple-700 {
            color: #22d3ee !important;
        }

        /* ==========================================
           SUPPLIER PAYMENT PAGE STYLES
           ========================================== */

        html.template-fuel .supplier-payment-container {
            background: transparent !important;
        }

        html.template-fuel .supplier-payment-container .ant-card {
            background-color: #0e4a5f !important;
            border: 1px solid #1a6b85 !important;
            color: white !important;
        }

        html.template-fuel .supplier-payment-container .ant-table-thead > tr > th {
            background: rgba(8, 47, 73, 0.7) !important;
            color: #22d3ee !important;
        }

        html.template-fuel .supplier-payment-container .ant-table-tbody > tr > td {
            color: white !important;
        }

        html.template-fuel .supplier-payment-container .ant-input,
        html.template-fuel .supplier-payment-container .ant-select-selector {
            background: rgba(0, 0, 0, 0.5) !important;
            border-color: rgba(34, 211, 238, 0.3) !important;
            color: white !important;
        }

        /* ==========================================
           PURCHASE ORDERS PAGE STYLES
           ========================================== */

        /* Main Container */
        html.template-fuel .purchase-orders-container {
            background: transparent !important;
        }

        /* Header Cards & Stats */
        html.template-fuel .purchase-orders-container .ant-card {
            background-color: #0e4a5f !important;
            border: 1px solid #1a6b85 !important;
            color: white !important;
        }

        /* Statistics */
        html.template-fuel .purchase-orders-container .ant-statistic-title {
            color: rgba(255, 255, 255, 0.8) !important;
        }

        html.template-fuel .purchase-orders-container .ant-statistic-content-value {
            color: #22d3ee !important;
        }

        /* Table */
        html.template-fuel .purchase-orders-container .ant-table {
            background: transparent !important;
        }

        html.template-fuel .purchase-orders-container .ant-table-thead > tr > th {
            background: rgba(8, 47, 73, 0.7) !important;
            color: #22d3ee !important;
            border-bottom: 1px solid #1a6b85 !important;
        }

        html.template-fuel .purchase-orders-container .ant-table-tbody > tr > td {
            background: transparent !important;
            color: white !important;
            border-bottom: 1px solid rgba(34, 211, 238, 0.1) !important;
        }

        html.template-fuel .purchase-orders-container .ant-table-tbody > tr:hover > td {
            background: rgba(34, 211, 238, 0.1) !important;
        }

        /* Search Input */
        html.template-fuel .purchase-orders-container .ant-input-affix-wrapper,
        html.template-fuel .purchase-orders-container .ant-input {
            background: rgba(0, 0, 0, 0.5) !important;
            border-color: rgba(34, 211, 238, 0.3) !important;
            color: white !important;
        }

        /* AGGRESSIVE: Remove ALL white backgrounds on purchase orders page */
        html.template-fuel .purchase-orders-container .bg-white,
        html.template-fuel .purchase-orders-container [class*="bg-white"],
        html.template-fuel .purchase-orders-container .bg-gray-50,
        html.template-fuel .purchase-orders-container .bg-gray-100,
        html.template-fuel .purchase-orders-container [class*="bg-gray"],
        html.template-fuel .purchase-orders-container div[style*="background: white"],
        html.template-fuel .purchase-orders-container div[style*="background-color: white"],
        html.template-fuel .purchase-orders-container div[style*="background: #fff"],
        html.template-fuel .purchase-orders-container div[style*="background-color: #fff"] {
            background: transparent !important;
            background-color: transparent !important;
        }

        /* Override any card-like containers */
        html.template-fuel .purchase-orders-container > div,
        html.template-fuel .purchase-orders-container > div > div,
        html.template-fuel .purchase-orders-container .rounded,
        html.template-fuel .purchase-orders-container .shadow,
        html.template-fuel .purchase-orders-container [class*="rounded"],
        html.template-fuel .purchase-orders-container [class*="shadow"] {
            background-color: transparent !important;
        }

        /* Specific override for top stats card */
        html.template-fuel .purchase-orders-container > div:first-child,
        html.template-fuel .purchase-orders-container .stats-container,
        html.template-fuel .purchase-orders-container .header-stats {
            background: transparent !important;
            background-color: transparent !important;
        }

        /* ULTRA AGGRESSIVE: Target statistics section by border-t class */
        html.template-fuel div.border-t,
        html.template-fuel div[class*="border-t"],
        html.template-fuel .mt-4.pt-4,
        html.template-fuel [class*="mt-4"][class*="pt-4"] {
            background: transparent !important;
            background-color: transparent !important;
        }

        /* Target Ant Design Row components */
        html.template-fuel .ant-row {
            background: transparent !important;
            background-color: transparent !important;
        }

        /* Target all divs with text-center class (statistics) */
        html.template-fuel div.text-center {
            background: transparent !important;
        }

        /* NUCLEAR OPTION: Force ALL divs to transparent unless they're cards or modals */
        html.template-fuel div:not(.ant-card):not(.ant-modal-content):not(.ant-modal-header):not(.ant-table) {
            background-color: transparent !important;
        }



        /* NEW ORDER MODAL */
        html.template-fuel .purchase-order-modal .ant-modal-content {
            background: linear-gradient(135deg, rgba(10, 25, 41, 0.98) 0%, rgba(8, 47, 73, 0.95) 100%) !important;
            border: 1px solid rgba(34, 211, 238, 0.3) !important;
            color: white !important;
        }

        /* Modal Header */
        html.template-fuel .purchase-order-modal .ant-modal-header {
            background: transparent !important;
            border-bottom: 1px solid rgba(34, 211, 238, 0.2) !important;
        }

        html.template-fuel .purchase-order-modal .ant-modal-title {
            color: #22d3ee !important;
        }

        /* Form Labels */
        html.template-fuel .purchase-order-modal label {
            color: #22d3ee !important;
        }

        /* All Input Fields */
        html.template-fuel .purchase-order-modal input,
        html.template-fuel .purchase-order-modal textarea,
        html.template-fuel .purchase-order-modal .ant-input,
        html.template-fuel .purchase-order-modal .ant-input-number,
        html.template-fuel .purchase-order-modal .ant-input-number-input,
        html.template-fuel .purchase-order-modal .ant-select-selector,
        html.template-fuel .purchase-order-modal .ant-picker {
            background: rgba(0, 0, 0, 0.6) !important;
            background-color: rgba(0, 0, 0, 0.6) !important;
            border-color: rgba(34, 211, 238, 0.3) !important;
            color: #ffffff !important;
        }

        /* Disabled and Readonly Inputs */
        html.template-fuel .purchase-order-modal input:disabled,
        html.template-fuel .purchase-order-modal input[readonly],
        html.template-fuel .purchase-order-modal .ant-input:disabled,
        html.template-fuel .purchase-order-modal .ant-input[readonly],
        html.template-fuel .purchase-order-modal .ant-input-disabled,
        html.template-fuel .purchase-order-modal .ant-picker-input > input:disabled {
            background: rgba(0, 0, 0, 0.5) !important;
            background-color: rgba(0, 0, 0, 0.5) !important;
            border-color: rgba(34, 211, 238, 0.2) !important;
            color: rgba(255, 255, 255, 0.6) !important;
            cursor: not-allowed;
        }

        /* Input Focus State */
        html.template-fuel .purchase-order-modal input:focus,
        html.template-fuel .purchase-order-modal .ant-input:focus,
        html.template-fuel .purchase-order-modal .ant-input-number:focus,
        html.template-fuel .purchase-order-modal .ant-select-focused .ant-select-selector,
        html.template-fuel .purchase-order-modal .ant-picker-focused {
            background: rgba(0, 0, 0, 0.7) !important;
            background-color: rgba(0, 0, 0, 0.7) !important;
            border-color: #22d3ee !important;
            box-shadow: 0 0 0 2px rgba(34, 211, 238, 0.2) !important;
        }

        /* Input Number Handlers */
        html.template-fuel .purchase-order-modal .ant-input-number-handler-wrap {
            background: rgba(0, 0, 0, 0.4) !important;
            border-left-color: rgba(34, 211, 238, 0.3) !important;
        }

        html.template-fuel .purchase-order-modal .ant-input-number-handler {
            border-color: rgba(34, 211, 238, 0.2) !important;
            color: #22d3ee !important;
        }

        html.template-fuel .purchase-order-modal .ant-input-number-handler:hover {
            background: rgba(34, 211, 238, 0.1) !important;
        }

        /* Select Dropdown Items */
        html.template-fuel .purchase-order-modal .ant-select-selection-item,
        html.template-fuel .purchase-order-modal .ant-select-selection-placeholder {
            color: #ffffff !important;
        }

        /* Date Picker */
        html.template-fuel .purchase-order-modal .ant-picker-input > input {
            color: #ffffff !important;
        }

        html.template-fuel .purchase-order-modal .ant-picker-suffix {
            color: #22d3ee !important;
        }

        /* Product List Table in Modal */
        html.template-fuel .purchase-order-modal table {
            border-color: rgba(34, 211, 238, 0.2) !important;
        }

        html.template-fuel .purchase-order-modal th {
            background: rgba(8, 47, 73, 0.5) !important;
            color: #22d3ee !important;
            border-color: rgba(34, 211, 238, 0.2) !important;
        }

        html.template-fuel .purchase-order-modal td {
            border-color: rgba(34, 211, 238, 0.1) !important;
        }

        /* Add Product Button */
        html.template-fuel .purchase-order-modal .ant-btn-dashed {
            background: rgba(34, 211, 238, 0.05) !important;
            border-color: rgba(34, 211, 238, 0.3) !important;
            color: #22d3ee !important;
        }

        html.template-fuel .purchase-order-modal .ant-btn-dashed:hover {
            background: rgba(34, 211, 238, 0.15) !important;
            border-color: #22d3ee !important;
        }

        /* Total Amount Display */
        html.template-fuel .purchase-order-modal .text-xl,
        html.template-fuel .purchase-order-modal .text-2xl {
            color: #22d3ee !important;
        }

        /* Modal Footer Buttons */
        html.template-fuel .purchase-order-modal .ant-modal-footer .ant-btn-default {
            background: rgba(34, 211, 238, 0.1) !important;
            border-color: rgba(34, 211, 238, 0.3) !important;
            color: #22d3ee !important;
        }

        html.template-fuel .purchase-order-modal .ant-modal-footer .ant-btn-primary {
            background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%) !important;
            border-color: #0ea5e9 !important;
            color: white !important;
        }

        /* Note Text */
        html.template-fuel .purchase-order-modal .text-sm,
        html.template-fuel .purchase-order-modal .text-xs {
            color: rgba(255, 255, 255, 0.7) !important;
        }

        /* Placeholder Text */
        html.template-fuel .purchase-order-modal input::placeholder,
        html.template-fuel .purchase-order-modal textarea::placeholder {
            color: rgba(255, 255, 255, 0.4) !important;
        }

        /* Autofill Fix for Purchase Order Modal */
        html.template-fuel .purchase-order-modal input:-webkit-autofill,
        html.template-fuel .purchase-order-modal input:-webkit-autofill:hover,
        html.template-fuel .purchase-order-modal input:-webkit-autofill:focus {
            -webkit-box-shadow: 0 0 0 1000px #0a1929 inset !important;
            -webkit-text-fill-color: #ffffff !important;
            transition: background-color 5000s ease-in-out 0s;
        }


        /* ==========================================
           SUPPLIER MODAL STYLES
           ========================================== */

        /* Modal Container */
        html.template-fuel .supplier-modal .ant-modal-content,
        html.template-fuel [class*="supplier"] .ant-modal-content {
            background: linear-gradient(135deg, rgba(10, 25, 41, 0.98) 0%, rgba(8, 47, 73, 0.95) 100%) !important;
            border: 1px solid rgba(34, 211, 238, 0.3) !important;
            color: white !important;
        }

        /* Modal Header */
        html.template-fuel .supplier-modal .ant-modal-header,
        html.template-fuel [class*="supplier"] .ant-modal-header {
            background: transparent !important;
            border-bottom: 1px solid rgba(34, 211, 238, 0.2) !important;
        }

        html.template-fuel .supplier-modal .ant-modal-title,
        html.template-fuel [class*="supplier"] .ant-modal-title {
            color: #22d3ee !important;
        }

        /* Section Headers */
        html.template-fuel .supplier-modal h3,
        html.template-fuel .supplier-modal h4,
        html.template-fuel [class*="supplier"] h3,
        html.template-fuel [class*="supplier"] h4 {
            color: #22d3ee !important;
        }

        /* Form Labels */
        html.template-fuel .supplier-modal label,
        html.template-fuel [class*="supplier"] label {
            color: #22d3ee !important;
        }

        /* All Input Fields */
        html.template-fuel .supplier-modal input,
        html.template-fuel .supplier-modal textarea,
        html.template-fuel .supplier-modal .ant-input,
        html.template-fuel .supplier-modal .ant-input-affix-wrapper,
        html.template-fuel .supplier-modal .ant-select-selector,
        html.template-fuel .supplier-modal .ant-picker,
        html.template-fuel [class*="supplier"] input,
        html.template-fuel [class*="supplier"] textarea,
        html.template-fuel [class*="supplier"] .ant-input,
        html.template-fuel [class*="supplier"] .ant-input-affix-wrapper,
        html.template-fuel [class*="supplier"] .ant-select-selector,
        html.template-fuel [class*="supplier"] .ant-picker {
            background: rgba(0, 0, 0, 0.6) !important;
            background-color: rgba(0, 0, 0, 0.6) !important;
            border-color: rgba(34, 211, 238, 0.3) !important;
            color: #ffffff !important;
        }

        /* Fix for inputs inside Affix Wrappers */
        html.template-fuel .supplier-modal .ant-input-affix-wrapper input.ant-input,
        html.template-fuel [class*="supplier"] .ant-input-affix-wrapper input.ant-input {
            background-color: transparent !important;
            border: none !important;
        }

        /* Input Icons */
        html.template-fuel .supplier-modal .ant-input-prefix,
        html.template-fuel .supplier-modal .ant-input-suffix,
        html.template-fuel [class*="supplier"] .ant-input-prefix,
        html.template-fuel [class*="supplier"] .ant-input-suffix {
            color: rgba(34, 211, 238, 0.6) !important;
        }

        /* Select Dropdown Items */
        html.template-fuel .supplier-modal .ant-select-selection-item,
        html.template-fuel .supplier-modal .ant-select-selection-placeholder,
        html.template-fuel [class*="supplier"] .ant-select-selection-item,
        html.template-fuel [class*="supplier"] .ant-select-selection-placeholder {
            color: #ffffff !important;
        }

        /* Placeholder Text */
        html.template-fuel .supplier-modal input::placeholder,
        html.template-fuel .supplier-modal textarea::placeholder,
        html.template-fuel [class*="supplier"] input::placeholder,
        html.template-fuel [class*="supplier"] textarea::placeholder {
            color: rgba(255, 255, 255, 0.4) !important;
        }

        /* Autofill Fix */
        html.template-fuel .supplier-modal input:-webkit-autofill,
        html.template-fuel .supplier-modal input:-webkit-autofill:hover,
        html.template-fuel .supplier-modal input:-webkit-autofill:focus,
        html.template-fuel .supplier-modal textarea:-webkit-autofill,
        html.template-fuel [class*="supplier"] input:-webkit-autofill,
        html.template-fuel [class*="supplier"] input:-webkit-autofill:hover,
        html.template-fuel [class*="supplier"] input:-webkit-autofill:focus,
        html.template-fuel [class*="supplier"] textarea:-webkit-autofill {
            -webkit-box-shadow: 0 0 0 1000px #0a1929 inset !important;
            -webkit-text-fill-color: #ffffff !important;
            transition: background-color 5000s ease-in-out 0s;
        }

        /* Modal Footer Buttons */
        html.template-fuel .supplier-modal .ant-modal-footer .ant-btn-default,
        html.template-fuel [class*="supplier"] .ant-modal-footer .ant-btn-default {
            background: rgba(34, 211, 238, 0.1) !important;
            border-color: rgba(34, 211, 238, 0.3) !important;
            color: #22d3ee !important;
        }

        html.template-fuel .supplier-modal .ant-modal-footer .ant-btn-primary,
        html.template-fuel [class*="supplier"] .ant-modal-footer .ant-btn-primary {
            background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%) !important;
            border-color: #0ea5e9 !important;
            color: white !important;
        }



        /* ==========================================
           EXPENSE & EXPENSE TYPE PAGE STYLES
           ========================================== */

        html.template-fuel .expanse-page-container,
        html.template-fuel .expanse-type-page-container {
            background: transparent !important;
        }

        /* All Cards */
        html.template-fuel .expanse-page-container .ant-card,
        html.template-fuel .expanse-type-page-container .ant-card,
        html.template-fuel .expanse-page-container .shadow-sm,
        html.template-fuel .expanse-type-page-container .shadow-sm {
            background-color: #0e4a5f !important;
            background: #0e4a5f !important;
            border: 1px solid #1a6b85 !important;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3) !important;
            color: #22d3ee !important;
        }

        /* Override white backgrounds */
        html.template-fuel .expanse-page-container .bg-white,
        html.template-fuel .expanse-type-page-container .bg-white,
        html.template-fuel .expanse-page-container .dark\\:bg-gray-800,
        html.template-fuel .expanse-type-page-container .dark\\:bg-gray-800 {
            background-color: #0e4a5f !important;
            border: 1px solid #1a6b85 !important;
        }

        /* Stats Cards */
        html.template-fuel .expanse-page-container .bg-gradient-to-br,
        html.template-fuel .expanse-type-page-container .bg-gradient-to-br {
            background: #0e4a5f !important;
            border: 1px solid #1a6b85 !important;
        }

        /* Statistic Values */
        html.template-fuel .expanse-page-container .ant-statistic-title,
        html.template-fuel .expanse-page-container .ant-statistic-content-value,
        html.template-fuel .expanse-type-page-container .ant-statistic-title,
        html.template-fuel .expanse-type-page-container .ant-statistic-content-value,
        html.template-fuel .expanse-page-container .text-gray-700,
        html.template-fuel .expanse-page-container .text-gray-900,
        html.template-fuel .expanse-type-page-container .text-gray-900 {
            color: #22d3ee !important;
        }

        /* Table Styles */
        html.template-fuel .expanse-page-container .ant-table,
        html.template-fuel .expanse-type-page-container .ant-table {
            background: transparent !important;
        }

        html.template-fuel .expanse-page-container .ant-table-thead > tr > th,
        html.template-fuel .expanse-type-page-container .ant-table-thead > tr > th {
            background: rgba(8, 47, 73, 0.6) !important;
            color: #22d3ee !important;
            border-bottom: 1px solid #1a6b85 !important;
        }

        html.template-fuel .expanse-page-container .ant-table-tbody > tr > td,
        html.template-fuel .expanse-type-page-container .ant-table-tbody > tr > td {
            background: transparent !important;
            color: white !important;
            border-bottom: 1px solid rgba(34, 211, 238, 0.1) !important;
        }

        html.template-fuel .expanse-page-container .ant-table-tbody > tr:hover > td,
        html.template-fuel .expanse-type-page-container .ant-table-tbody > tr:hover > td {
            background: rgba(34, 211, 238, 0.1) !important;
        }

        /* Search Inputs */
        html.template-fuel .expanse-page-container .ant-input-affix-wrapper,
        html.template-fuel .expanse-type-page-container .ant-input-affix-wrapper,
        html.template-fuel .expanse-page-container .ant-input,
        html.template-fuel .expanse-type-page-container .ant-input {
            background: rgba(0, 0, 0, 0.5) !important;
            border-color: rgba(34, 211, 238, 0.3) !important;
            color: white !important;
        }

        /* Inner Cards */
        html.template-fuel .expanse-page-container .bg-gray-50 {
            background: rgba(0, 0, 0, 0.3) !important;
            border: 1px solid rgba(26, 107, 133, 0.5) !important;
        }

        html.template-fuel .expanse-page-container .text-green-600 {
            color: #22d3ee !important;
        }

        /* ==========================================
           EMPLOYEE PAGE STYLES
           ========================================== */

        html.template-fuel .employee-page-container {
            background: transparent !important;
        }

        html.template-fuel .employee-page-container h3,
        html.template-fuel .employee-page-container .ant-typography {
            color: #22d3ee !important;
        }

        /* Tabs */
        html.template-fuel .employee-page-container .ant-tabs-nav::before {
            border-bottom-color: #1a6b85 !important;
        }

        html.template-fuel .employee-page-container .ant-tabs-tab {
            color: rgba(34, 211, 238, 0.7) !important;
        }

        html.template-fuel .employee-page-container .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
            color: #22d3ee !important;
            text-shadow: 0 0 5px rgba(34, 211, 238, 0.5) !important;
        }

        html.template-fuel .employee-page-container .ant-tabs-ink-bar {
            background: #22d3ee !important;
        }

        /* Employee List Container */
        html.template-fuel .employee-list-container {
            background-color: #0e4a5f !important;
            border: 1px solid #1a6b85 !important;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3) !important;
            color: #22d3ee !important;
        }

        html.template-fuel .employee-list-container .ant-table {
            background: transparent !important;
        }

        html.template-fuel .employee-list-container .ant-table-thead > tr > th {
            background: rgba(8, 47, 73, 0.6) !important;
            color: #22d3ee !important;
            border-bottom: 1px solid #1a6b85 !important;
        }

        html.template-fuel .employee-list-container .ant-table-tbody > tr > td {
            background: transparent !important;
            border-bottom: 1px solid rgba(34, 211, 238, 0.1) !important;
            color: white !important;
        }

        html.template-fuel .employee-list-container .ant-table-tbody > tr:hover > td {
            background: rgba(34, 211, 238, 0.1) !important;
        }

        html.template-fuel .employee-list-container .ant-input-affix-wrapper,
        html.template-fuel .employee-list-container .ant-input {
            background: rgba(0, 0, 0, 0.5) !important;
            border-color: rgba(34, 211, 238, 0.3) !important;
            color: white !important;
        }

        html.template-fuel .employee-list-container .ant-btn-default {
            background: transparent !important;
            border-color: #22d3ee !important;
            color: #22d3ee !important;
        }

        html.template-fuel .employee-list-container .ant-btn-default:hover {
            background: rgba(34, 211, 238, 0.1) !important;
        }

        /* Salary Reports Tab */
        html.template-fuel .employee-page-container .bg-white {
            background-color: #0e4a5f !important;
            border: 1px solid #1a6b85 !important;
        }

        html.template-fuel .employee-page-container .bg-green-50 {
            background-color: rgba(0, 0, 0, 0.3) !important;
            border: 1px solid rgba(34, 211, 238, 0.3) !important;
        }

        html.template-fuel .employee-page-container .text-green-600 {
            color: #22d3ee !important;
        }

        html.template-fuel .employee-page-container .bg-green-600 {
            background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%) !important;
            border-color: #0ea5e9 !important;
            color: white !important;
        }

        html.template-fuel .employee-page-container .ant-typography-secondary {
            color: rgba(255, 255, 255, 0.7) !important;
        }

        /* ==========================================
           REPORT PAGES STYLES (ALL)
           ========================================== */

        /* Container Backgrounds */
        html.template-fuel .report-sale-summary-container,
        html.template-fuel .report-customer-summary-container,
        html.template-fuel .report-stock-status-container,
        html.template-fuel .report-stock-movement-container,
        html.template-fuel .report-purchase-history-container,
        html.template-fuel .report-outstanding-debt-container,
        html.template-fuel .report-payment-history-container,
        html.template-fuel .report-profit-loss-container {
            background: transparent !important;
        }

        /* All Report Cards */
        html.template-fuel .report-sale-summary-container .ant-card,
        html.template-fuel .report-customer-summary-container .ant-card,
        html.template-fuel .report-stock-status-container .ant-card,
        html.template-fuel .report-stock-movement-container .ant-card,
        html.template-fuel .report-purchase-history-container .ant-card,
        html.template-fuel .report-outstanding-debt-container .ant-card,
        html.template-fuel .report-payment-history-container .ant-card,
        html.template-fuel .report-profit-loss-container .ant-card {
            background: #0e4a5f !important;
            border: 1px solid #1a6b85 !important;
            color: white !important;
        }

        /* Gradient Overrides */
        html.template-fuel .report-sale-summary-container .bg-gradient-to-br,
        html.template-fuel .report-customer-summary-container .bg-gradient-to-br,
        html.template-fuel .report-stock-status-container .bg-gradient-to-br,
        html.template-fuel .report-stock-movement-container .bg-gradient-to-br,
        html.template-fuel .report-purchase-history-container .bg-gradient-to-br,
        html.template-fuel .report-outstanding-debt-container .bg-gradient-to-br,
        html.template-fuel .report-payment-history-container .bg-gradient-to-br {
            background: linear-gradient(135deg, #0e4a5f 0%, #1a6b85 100%) !important;
            border: 1px solid #22d3ee !important;
        }

        /* Statistic Titles */
        html.template-fuel .report-sale-summary-container .ant-statistic-title,
        html.template-fuel .report-customer-summary-container .ant-statistic-title,
        html.template-fuel .report-stock-status-container .ant-statistic-title,
        html.template-fuel .report-stock-movement-container .ant-statistic-title,
        html.template-fuel .report-purchase-history-container .ant-statistic-title,
        html.template-fuel .report-outstanding-debt-container .ant-statistic-title,
        html.template-fuel .report-payment-history-container .ant-statistic-title,
        html.template-fuel .report-profit-loss-container .ant-statistic-title {
            color: #22d3ee !important;
            opacity: 1 !important;
        }

        /* Statistic Values */
        html.template-fuel .report-sale-summary-container .ant-statistic-content-value,
        html.template-fuel .report-customer-summary-container .ant-statistic-content-value,
        html.template-fuel .report-stock-status-container .ant-statistic-content-value,
        html.template-fuel .report-stock-movement-container .ant-statistic-content-value,
        html.template-fuel .report-purchase-history-container .ant-statistic-content-value,
        html.template-fuel .report-outstanding-debt-container .ant-statistic-content-value,
        html.template-fuel .report-payment-history-container .ant-statistic-content-value,
        html.template-fuel .report-profit-loss-container .ant-statistic-content-value {
            color: #ffffff !important;
            text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }

        /* Inputs and DatePickers */
        html.template-fuel .report-sale-summary-container .ant-picker,
        html.template-fuel .report-customer-summary-container .ant-picker,
        html.template-fuel .report-stock-status-container .ant-picker,
        html.template-fuel .report-profit-loss-container .ant-picker,
        html.template-fuel .report-sale-summary-container .ant-select-selector,
        html.template-fuel .report-customer-summary-container .ant-select-selector,
        html.template-fuel .report-stock-status-container .ant-select-selector,
        html.template-fuel .report-profit-loss-container .ant-select-selector {
            background: rgba(0, 0, 0, 0.5) !important;
            border-color: rgba(34, 211, 238, 0.3) !important;
            color: white !important;
        }

        /* Buttons */
        html.template-fuel .report-sale-summary-container .ant-btn-default,
        html.template-fuel .report-customer-summary-container .ant-btn-default,
        html.template-fuel .report-stock-status-container .ant-btn-default,
        html.template-fuel .report-profit-loss-container .ant-btn-default {
            background: transparent !important;
            border-color: #22d3ee !important;
            color: #22d3ee !important;
        }

        html.template-fuel .report-sale-summary-container .ant-btn-primary,
        html.template-fuel .report-customer-summary-container .ant-btn-primary,
        html.template-fuel .report-stock-status-container .ant-btn-primary,
        html.template-fuel .report-profit-loss-container .ant-btn-primary {
            background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%) !important;
            border-color: #0ea5e9 !important;
            color: white !important;
        }

        /* Tables */
        html.template-fuel .report-sale-summary-container .ant-table,
        html.template-fuel .report-customer-summary-container .ant-table,
        html.template-fuel .report-stock-status-container .ant-table,
        html.template-fuel .report-profit-loss-container .ant-table {
            background: transparent !important;
            color: white !important;
        }

        html.template-fuel .report-sale-summary-container .ant-table-thead > tr > th,
        html.template-fuel .report-customer-summary-container .ant-table-thead > tr > th,
        html.template-fuel .report-stock-status-container .ant-table-thead > tr > th,
        html.template-fuel .report-profit-loss-container .ant-table-thead > tr > th {
            background: rgba(8, 47, 73, 0.8) !important;
            color: #22d3ee !important;
            border-bottom: 1px solid #1a6b85 !important;
        }

        html.template-fuel .report-sale-summary-container .ant-table-tbody > tr > td,
        html.template-fuel .report-customer-summary-container .ant-table-tbody > tr > td,
        html.template-fuel .report-stock-status-container .ant-table-tbody > tr > td,
        html.template-fuel .report-profit-loss-container .ant-table-tbody > tr > td {
            background: transparent !important;
            color: white !important;
            border-bottom: 1px solid rgba(34, 211, 238, 0.1) !important;
        }

        html.template-fuel .report-sale-summary-container .ant-table-tbody > tr:hover > td,
        html.template-fuel .report-customer-summary-container .ant-table-tbody > tr:hover > td,
        html.template-fuel .report-stock-status-container .ant-table-tbody > tr:hover > td,
        html.template-fuel .report-profit-loss-container .ant-table-tbody > tr:hover > td {
            background: rgba(34, 211, 238, 0.1) !important;
        }

        /* Typography */
        html.template-fuel .report-sale-summary-container h1,
        html.template-fuel .report-sale-summary-container h2,
        html.template-fuel .report-sale-summary-container h3,
        html.template-fuel .report-customer-summary-container h1,
        html.template-fuel .report-customer-summary-container h2,
        html.template-fuel .report-customer-summary-container h3,
        html.template-fuel .report-stock-status-container h1,
        html.template-fuel .report-stock-status-container h2,
        html.template-fuel .report-stock-status-container h3,
        html.template-fuel .report-profit-loss-container h1,
        html.template-fuel .report-profit-loss-container h2,
        html.template-fuel .report-profit-loss-container h3 {
            color: #22d3ee !important;
        }

        html.template-fuel .report-sale-summary-container .text-gray-500,
        html.template-fuel .report-sale-summary-container .text-gray-600,
        html.template-fuel .report-customer-summary-container .text-gray-500,
        html.template-fuel .report-customer-summary-container .text-gray-600,
        html.template-fuel .report-stock-status-container .text-gray-500,
        html.template-fuel .report-stock-status-container .text-gray-600,
        html.template-fuel .report-profit-loss-container .text-gray-500,
        html.template-fuel .report-profit-loss-container .text-gray-600 {
            color: rgba(255, 255, 255, 0.7) !important;
        }

        /* Inner Content Boxes */
        html.template-fuel .report-sale-summary-container .bg-blue-50,
        html.template-fuel .report-customer-summary-container .bg-blue-50,
        html.template-fuel .report-stock-status-container .bg-blue-50,
        html.template-fuel .report-profit-loss-container .bg-blue-50,
        html.template-fuel .report-profit-loss-container .bg-green-50,
        html.template-fuel .report-profit-loss-container .bg-orange-50,
        html.template-fuel .report-profit-loss-container .bg-yellow-50,
        html.template-fuel .report-profit-loss-container .bg-red-50,
        html.template-fuel .report-profit-loss-container .bg-gray-50,
        html.template-fuel .report-profit-loss-container .bg-gray-100 {
            background-color: rgba(0, 0, 0, 0.4) !important;
            border: 1px solid rgba(34, 211, 238, 0.2) !important;
        }

        /* Text colors inside boxes */
        html.template-fuel .report-profit-loss-container .text-blue-600,
        html.template-fuel .report-profit-loss-container .text-green-600,
        html.template-fuel .report-profit-loss-container .text-orange-600,
        html.template-fuel .report-profit-loss-container .text-yellow-600,
        html.template-fuel .report-profit-loss-container .text-red-600,
        html.template-fuel .report-profit-loss-container .text-red-700 {
            color: #22d3ee !important;
        }
    `
};
