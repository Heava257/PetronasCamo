/**
 * Chinese New Year Template - Festive Red & Gold Theme
 * Celebrates Lunar New Year with traditional colors
 */
export const chineseNewYearTemplate = {
    id: 'chinesenewyear',
    name: 'Chinese New Year',
    description: 'Festive red and gold theme celebrating Lunar New Year',
    preview: {
        primaryColor: '#FF0000',
        backgroundColor: '#1a0000',
        cardColor: 'rgba(139, 0, 0, 0.4)'
    },

    // Colors
    colors: {
        primary: '#FF0000', // Chinese Red
        primaryHover: '#CC0000',
        primaryLight: 'rgba(255, 0, 0, 0.2)',
        secondary: '#FFD700', // Gold
        accent: '#FFD700', // Gold accent

        // Background colors
        bgMain: 'transparent',
        bgCard: 'rgba(139, 0, 0, 0.4)', // Dark red glass
        bgSidebar: 'rgba(139, 0, 0, 0.3)',
        bgHeader: 'rgba(255, 0, 0, 0.15)',

        // Text colors
        textPrimary: '#ffffff',
        textSecondary: '#FFD700', // Gold
        textMuted: 'rgba(255, 255, 255, 0.7)',
        textOnPrimary: '#ffffff',

        // Border colors
        borderColor: 'rgba(255, 215, 0, 0.4)',
        borderLight: 'rgba(255, 215, 0, 0.2)',

        // Status colors
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
    },

    sidebar: {
        background: 'rgba(139, 0, 0, 0.3)',
        textColor: '#ffffff',
        textColorActive: '#FFD700',
        itemHoverBg: 'rgba(255, 215, 0, 0.15)',
        itemActiveBg: 'rgba(255, 215, 0, 0.25)'
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
        /* Background with red gradient */
        html.template-chinesenewyear::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(139, 0, 0, 0.9) 0%, rgba(25, 0, 0, 0.95) 100%);
            z-index: -2;
        }

        /* Gold sparkle overlay */
        html.template-chinesenewyear::after {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 20% 20%, rgba(255, 215, 0, 0.1) 0%, transparent 50%);
            z-index: -1;
            pointer-events: none;
        }

        /* Sidebar */
        html.template-chinesenewyear .hierarchical-sidebar,
        html.template-chinesenewyear .ant-layout-sider {
            background: rgba(139, 0, 0, 0.3) !important;
            backdrop-filter: blur(25px) !important;
            border-right: 1px solid rgba(255, 215, 0, 0.3) !important;
        }

        /* Header */
        html.template-chinesenewyear .clean-dark-header {
            background: rgba(255, 0, 0, 0.15) !important;
            backdrop-filter: blur(15px) !important;
            border-bottom: 1px solid rgba(255, 215, 0, 0.3) !important;
        }

        /* All Cards */
        html.template-chinesenewyear .ant-card {
            background: linear-gradient(135deg, rgba(139, 0, 0, 0.4) 0%, rgba(255, 69, 0, 0.3) 100%) !important;
            backdrop-filter: blur(20px) !important;
            border: 1px solid rgba(255, 215, 0, 0.3) !important;
        }

        /* Table Headers */
        html.template-chinesenewyear .ant-table-thead > tr > th {
            background: rgba(139, 0, 0, 0.6) !important;
            color: #FFD700 !important;
            border-color: rgba(255, 215, 0, 0.3) !important;
        }

        /* Table Cells */
        html.template-chinesenewyear .ant-table-tbody > tr > td {
            background: transparent !important;
            color: #ffffff !important;
            border-color: rgba(255, 215, 0, 0.1) !important;
        }

        /* Table Hover */
        html.template-chinesenewyear .ant-table-tbody > tr:hover > td {
            background: rgba(255, 215, 0, 0.15) !important;
        }

        /* Inputs */
        html.template-chinesenewyear .ant-input,
        html.template-chinesenewyear .ant-select-selector,
        html.template-chinesenewyear .ant-picker {
            background: rgba(0, 0, 0, 0.3) !important;
            border-color: rgba(255, 215, 0, 0.4) !important;
            color: #ffffff !important;
        }

        /* Buttons */
        html.template-chinesenewyear .ant-btn-primary {
            background: linear-gradient(135deg, #FF0000 0%, #CC0000 100%) !important;
            border-color: #FF0000 !important;
            color: #ffffff !important;
        }

        html.template-chinesenewyear .ant-btn-default {
            background: rgba(255, 215, 0, 0.1) !important;
            border-color: rgba(255, 215, 0, 0.4) !important;
            color: #FFD700 !important;
        }

        /* Modals */
        html.template-chinesenewyear .ant-modal-content {
            background: rgba(25, 0, 0, 0.95) !important;
            backdrop-filter: blur(20px) !important;
            border: 1px solid rgba(255, 215, 0, 0.3) !important;
        }

        /* Text Colors */
        html.template-chinesenewyear .ant-typography,
        html.template-chinesenewyear h1,
        html.template-chinesenewyear h2,
        html.template-chinesenewyear h3,
        html.template-chinesenewyear h4,
        html.template-chinesenewyear p {
            color: #ffffff !important;
        }

        /* Form Labels */
        html.template-chinesenewyear .ant-form-item-label > label {
            color: #FFD700 !important;
        }

        /* Statistic Values */
        html.template-chinesenewyear .ant-statistic-content-value {
            color: #FFD700 !important;
        }

        /* ==========================================
           POS / PRE-ORDERS PAGE STYLES
           ========================================== */

        /* Force transparent background */
        html.template-chinesenewyear .pre-orders-full-view {
            background: transparent !important;
        }

        /* Page Header - Replace ALL pink/salmon with red/gold */
        html.template-chinesenewyear .page-header,
        html.template-chinesenewyear .pre-orders-full-view .page-header {
            background: linear-gradient(135deg, rgba(139, 0, 0, 0.6) 0%, rgba(255, 69, 0, 0.4) 100%) !important;
            backdrop-filter: blur(20px) !important;
            border: 1px solid rgba(255, 215, 0, 0.3) !important;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3) !important;
        }

        html.template-chinesenewyear .header-title,
        html.template-chinesenewyear .pre-orders-full-view .header-title {
            color: #FFD700 !important;
            text-shadow: 0 0 15px rgba(255, 215, 0, 0.4);
        }

        html.template-chinesenewyear .header-subtitle,
        html.template-chinesenewyear .pre-orders-full-view .header-subtitle {
            color: rgba(255, 255, 255, 0.9) !important;
        }

        /* Table Container - Remove pink background */
        html.template-chinesenewyear .table-container,
        html.template-chinesenewyear .pre-orders-full-view .table-container {
            background: rgba(139, 0, 0, 0.3) !important;
            backdrop-filter: blur(12px) !important;
            border: 1px solid rgba(255, 215, 0, 0.2) !important;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2) !important;
        }

        /* Stock Cards - Remove ALL pink/salmon */
        html.template-chinesenewyear .stock-card,
        html.template-chinesenewyear .stock-card-lpg,
        html.template-chinesenewyear .stock-card-gasoline,
        html.template-chinesenewyear .stock-card-diesel,
        html.template-chinesenewyear .pre-orders-full-view .stock-card {
            background: rgba(139, 0, 0, 0.4) !important;
            border: 1px solid rgba(255, 215, 0, 0.3) !important;
            backdrop-filter: blur(16px) !important;
        }

        html.template-chinesenewyear .stock-card-title {
            color: rgba(255, 255, 255, 0.8) !important;
        }

        html.template-chinesenewyear .stock-card-value {
            color: #FFD700 !important;
        }

        /* Action Buttons */
        html.template-chinesenewyear .action-btn-add {
            background: linear-gradient(135deg, #FF0000 0%, #CC0000 100%) !important;
            color: #ffffff !important;
            border: none !important;
        }

        html.template-chinesenewyear .action-btn-view {
            background: rgba(255, 215, 0, 0.1) !important;
            border-color: rgba(255, 215, 0, 0.4) !important;
            color: #FFD700 !important;
        }

        /* Refresh Button */
        html.template-chinesenewyear .refresh-btn {
            background: rgba(255, 215, 0, 0.1) !important;
            border-color: rgba(255, 215, 0, 0.3) !important;
            color: #FFD700 !important;
        }

        /* Status Tags */
        html.template-chinesenewyear .status-tag-ready {
            background: rgba(34, 197, 94, 0.2) !important;
            color: #4ade80 !important;
            border: 1px solid #22c55e !important;
        }

        html.template-chinesenewyear .status-tag-confirmed {
            background: rgba(59, 130, 246, 0.2) !important;
            color: #60a5fa !important;
            border: 1px solid #3b82f6 !important;
        }

        html.template-chinesenewyear .status-tag-pending {
            background: rgba(245, 158, 11, 0.2) !important;
            color: #fbbf24 !important;
            border: 1px solid #f59e0b !important;
        }

        /* Modal Header */
        html.template-chinesenewyear .modal-custom-header {
            background: linear-gradient(135deg, rgba(139, 0, 0, 0.9) 0%, rgba(255, 69, 0, 0.7) 100%) !important;
            border-bottom: 2px solid #FFD700 !important;
        }

        html.template-chinesenewyear .modal-header-title {
            color: #FFD700 !important;
        }

        html.template-chinesenewyear .modal-header-subtitle {
            color: rgba(255, 255, 255, 0.8) !important;
        }

        /* ==========================================
           GLOBAL SUMMARY CARDS (Order Page etc.)
           ========================================== */
        html.template-chinesenewyear .global-summary-card {
            background-color: #641d0e !important;
            background: #641d0e !important;
            border: 1px solid #8a2d1d !important;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3) !important;
            color: #FFD700 !important;
        }

        html.template-chinesenewyear .global-summary-card:hover {
            border-color: #a33623 !important;
            transform: translateY(-2px);
            transition: all 0.3s ease;
        }

        html.template-chinesenewyear .global-summary-card span,
        html.template-chinesenewyear .global-summary-card div {
            color: #FFD700 !important;
        }

        html.template-chinesenewyear .global-summary-card svg {
            color: #FFD700 !important;
            fill: #FFD700 !important;
        }


        /* ==========================================
           CART MODAL / SIDEBAR STYLES
           ========================================== */

        /* Modal/Sidebar Container */
        html.template-chinesenewyear .invoice-sidebar-container,
        html.template-chinesenewyear .sidebar-body-section {
            background: rgba(25, 0, 0, 0.95) !important;
            backdrop-filter: blur(20px) !important;
            border: 1px solid rgba(255, 215, 0, 0.3) !important;
        }

        /* Section Cards - Remove beige/cream */
        html.template-chinesenewyear .sidebar-section-card,
        html.template-chinesenewyear .sidebar-quick-orders-card {
            background: rgba(139, 0, 0, 0.3) !important;
            border: 1px solid rgba(255, 215, 0, 0.2) !important;
            backdrop-filter: blur(10px) !important;
        }

        /* Section Headers */
        html.template-chinesenewyear .sidebar-section-title {
            color: #FFD700 !important;
        }

        /* Inputs - Remove gray/beige backgrounds */
        html.template-chinesenewyear .sidebar-input-qty,
        html.template-chinesenewyear .sidebar-input-price-readonly,
        html.template-chinesenewyear .sidebar-select-customer,
        html.template-chinesenewyear .sidebar-select-date,
        html.template-chinesenewyear .sidebar-textarea,
        html.template-chinesenewyear .invoice-sidebar-container input,
        html.template-chinesenewyear .invoice-sidebar-container select,
        html.template-chinesenewyear .invoice-sidebar-container textarea {
            background: rgba(0, 0, 0, 0.4) !important;
            border: 1px solid rgba(255, 215, 0, 0.3) !important;
            color: #ffffff !important;
        }

        /* Select dropdowns */
        html.template-chinesenewyear .ant-select-selector,
        html.template-chinesenewyear .invoice-sidebar-container .ant-select-selector {
            background: rgba(0, 0, 0, 0.4) !important;
            border: 1px solid rgba(255, 215, 0, 0.3) !important;
            color: #ffffff !important;
        }

        html.template-chinesenewyear .ant-select-selection-item {
            color: #ffffff !important;
        }

        /* Cart Items */
        html.template-chinesenewyear .sidebar-cart-item-card {
            background: rgba(139, 0, 0, 0.4) !important;
            border: 1px solid rgba(255, 215, 0, 0.2) !important;
        }

        /* Badges */
        html.template-chinesenewyear .sidebar-cat-badge {
            background: rgba(255, 215, 0, 0.15) !important;
            color: #FFD700 !important;
            border-left: 3px solid #FFD700 !important;
        }

        /* Footer */
        html.template-chinesenewyear .sidebar-footer-section {
            background: rgba(25, 0, 0, 0.95) !important;
            border-top: 1px solid rgba(255, 215, 0, 0.3) !important;
        }

        html.template-chinesenewyear .sidebar-total-value {
            color: #FFD700 !important;
        }

        /* Checkout Buttons */
        html.template-chinesenewyear .sidebar-btn-checkout {
            background: linear-gradient(135deg, #FF0000 0%, #CC0000 100%) !important;
            color: #ffffff !important;
            border: none !important;
        }

        html.template-chinesenewyear .sidebar-btn-preview {
            background: rgba(255, 215, 0, 0.1) !important;
            border: 1px solid rgba(255, 215, 0, 0.4) !important;
            color: #FFD700 !important;
        }

        /* Override ANY beige/cream/gray backgrounds in sidebar */
        html.template-chinesenewyear .invoice-sidebar-container [style*="background: rgb(229"],
        html.template-chinesenewyear .invoice-sidebar-container [style*="background: rgb(243"],
        html.template-chinesenewyear .invoice-sidebar-container [style*="background: rgb(245"],
        html.template-chinesenewyear .invoice-sidebar-container [style*="background: rgb(249"],
        html.template-chinesenewyear .invoice-sidebar-container [style*="background-color: rgb(229"],
        html.template-chinesenewyear .invoice-sidebar-container [style*="background-color: rgb(243"],
        html.template-chinesenewyear .invoice-sidebar-container [style*="background-color: rgb(245"],
        html.template-chinesenewyear .invoice-sidebar-container [style*="background-color: rgb(249"] {
            background: rgba(0, 0, 0, 0.4) !important;
            background-color: rgba(0, 0, 0, 0.4) !important;
        }

        /* ==========================================
           INTEGRATED INVOICE SIDEBAR STYLES
           ========================================== */

        /* Main Container */
        html.template-chinesenewyear .invoice-sidebar-no-scroll {
            background: rgba(25, 0, 0, 0.95) !important;
        }

        /* Grid Columns - Remove beige/cream */
        html.template-chinesenewyear .grid-column,
        html.template-chinesenewyear .cart-column,
        html.template-chinesenewyear .info-column,
        html.template-chinesenewyear .summary-column {
            background: rgba(139, 0, 0, 0.3) !important;
            border-color: rgba(255, 215, 0, 0.2) !important;
            backdrop-filter: blur(10px) !important;
        }

        /* Column Titles */
        html.template-chinesenewyear .column-title {
            color: #FFD700 !important;
            border-bottom-color: #FFD700 !important;
        }

        /* Cart Items */
        html.template-chinesenewyear .cart-item-compact {
            background: rgba(0, 0, 0, 0.4) !important;
            border-color: rgba(255, 215, 0, 0.2) !important;
        }

        html.template-chinesenewyear .cart-item-compact:hover {
            border-color: #FFD700 !important;
        }

        html.template-chinesenewyear .item-number {
            background: #FFD700 !important;
            color: #000000 !important;
        }

        html.template-chinesenewyear .item-name {
            color: #ffffff !important;
        }

        html.template-chinesenewyear .item-category-tag {
            background: rgba(255, 215, 0, 0.15) !important;
            color: #FFD700 !important;
            border-left-color: #FFD700 !important;
        }

        /* Inputs */
        html.template-chinesenewyear .qty-input-compact {
            background: rgba(0, 0, 0, 0.5) !important;
            border-color: rgba(255, 215, 0, 0.3) !important;
            color: #ffffff !important;
        }

        html.template-chinesenewyear .qty-input-compact:focus {
            border-color: #FFD700 !important;
        }

        /* Price Display - Remove green background */
        html.template-chinesenewyear .item-price-display {
            background: rgba(139, 0, 0, 0.3) !important;
        }

        html.template-chinesenewyear .item-row-total {
            color: #FFD700 !important;
        }

        html.template-chinesenewyear .price-label,
        html.template-chinesenewyear .price-value {
            color: #FFD700 !important;
        }

        /* Pre-order Context - Remove yellow background */
        html.template-chinesenewyear .item-preorder-context {
            background: rgba(255, 215, 0, 0.1) !important;
            border-color: rgba(255, 215, 0, 0.3) !important;
        }

        /* Form Elements */
        html.template-chinesenewyear .form-label-compact {
            color: #FFD700 !important;
        }

        html.template-chinesenewyear .select-compact .ant-select-selector,
        html.template-chinesenewyear .date-picker-compact input,
        html.template-chinesenewyear .textarea-compact {
            background: rgba(0, 0, 0, 0.5) !important;
            border-color: rgba(255, 215, 0, 0.3) !important;
            color: #ffffff !important;
        }

        html.template-chinesenewyear .ant-select-selection-item,
        html.template-chinesenewyear .ant-select-selection-placeholder {
            color: #ffffff !important;
        }

        /* Selected Info Display */
        html.template-chinesenewyear .selected-info-display {
            background: rgba(0, 0, 0, 0.4) !important;
            border-color: rgba(255, 215, 0, 0.2) !important;
        }

        html.template-chinesenewyear .info-name {
            color: #FFD700 !important;
        }

        html.template-chinesenewyear .info-address {
            color: rgba(255, 255, 255, 0.7) !important;
        }

        /* Summary Section */
        html.template-chinesenewyear .po-badge {
            background: linear-gradient(135deg, #FF0000 0%, #CC0000 100%) !important;
            color: #ffffff !important;
        }

        html.template-chinesenewyear .stat-card {
            background: rgba(0, 0, 0, 0.4) !important;
            border-color: rgba(255, 215, 0, 0.3) !important;
        }

        html.template-chinesenewyear .stat-label {
            color: rgba(255, 255, 255, 0.7) !important;
        }

        html.template-chinesenewyear .stat-value {
            color: #FFD700 !important;
        }

        html.template-chinesenewyear .summary-breakdown {
            background: rgba(0, 0, 0, 0.4) !important;
            border-color: rgba(255, 215, 0, 0.2) !important;
        }

        html.template-chinesenewyear .breakdown-label {
            color: rgba(255, 255, 255, 0.8) !important;
        }

        html.template-chinesenewyear .breakdown-value {
            color: #ffffff !important;
        }

        html.template-chinesenewyear .total-value {
            color: #FFD700 !important;
        }

        /* Action Buttons */
        html.template-chinesenewyear .btn-checkout-compact {
            background: linear-gradient(135deg, #FF0000 0%, #CC0000 100%) !important;
            color: #ffffff !important;
        }

        html.template-chinesenewyear .btn-preview-compact {
            background: rgba(255, 215, 0, 0.1) !important;
            border-color: rgba(255, 215, 0, 0.4) !important;
            color: #FFD700 !important;
        }

        html.template-chinesenewyear .btn-preview-compact:hover:not(:disabled) {
            background: rgba(255, 215, 0, 0.2) !important;
            color: #FFD700 !important;
        }

        html.template-chinesenewyear .validation-note {
            background: rgba(34, 197, 94, 0.2) !important;
            color: #4ade80 !important;
            border-left-color: #22c55e !important;
        }

        /* Override ANY remaining pink/salmon backgrounds */
        html.template-chinesenewyear [style*="background: rgb(244"],
        html.template-chinesenewyear [style*="background: rgb(251"],
        html.template-chinesenewyear [style*="background: rgb(253"],
        html.template-chinesenewyear [style*="background-color: rgb(244"],
        html.template-chinesenewyear [style*="background-color: rgb(251"],
        html.template-chinesenewyear [style*="background-color: rgb(253"] {
            background: rgba(139, 0, 0, 0.4) !important;
            background-color: rgba(139, 0, 0, 0.4) !important;
        }

        /* ==========================================
           CUSTOMER MODAL STYLES
           ========================================== */

        /* Modal Container */
        html.template-chinesenewyear .customer-modal .ant-modal-content {
            background: linear-gradient(135deg, rgba(25, 0, 0, 0.98) 0%, rgba(50, 0, 0, 0.95) 100%) !important;
            border: 1px solid rgba(255, 215, 0, 0.3) !important;
            color: white !important;
        }

        /* Modal Title */
        html.template-chinesenewyear .customer-modal .text-gray-800 {
            color: #FFD700 !important;
        }

        html.template-chinesenewyear .customer-modal .border-gray-100 {
            border-color: rgba(255, 215, 0, 0.2) !important;
        }

        /* Icons in Title */
        html.template-chinesenewyear .customer-modal .text-blue-500.bg-blue-50 {
            color: #FFD700 !important;
            background-color: rgba(255, 215, 0, 0.15) !important;
        }

        /* Section Containers - Wildcard to catch all gray backgrounds */
        html.template-chinesenewyear .customer-modal div[class*="bg-gray-"],
        html.template-chinesenewyear .customer-modal div[class*="bg-white"] {
            background: rgba(40, 0, 0, 0.6) !important;
            border-color: rgba(255, 215, 0, 0.2) !important;
            backdrop-filter: blur(5px);
        }

        /* Section Badges (The little pills on top of sections) */
        html.template-chinesenewyear .customer-modal .absolute.-top-3 {
            background: #2a0a0a !important;
            border: 1px solid #FFD700 !important;
            color: #FFD700 !important;
            box-shadow: 0 0 10px rgba(255, 215, 0, 0.2) !important;
            z-index: 10;
        }

        /* Override specific badge text colors */
        html.template-chinesenewyear .customer-modal .text-blue-500,
        html.template-chinesenewyear .customer-modal .text-green-500,
        html.template-chinesenewyear .customer-modal .text-purple-500 {
            color: #FFD700 !important;
        }

        /* Form Labels */
        html.template-chinesenewyear .customer-modal label {
            color: rgba(255, 255, 255, 0.8) !important;
        }

        html.template-chinesenewyear .customer-modal .ant-form-item-label > label {
            color: #FFD700 !important;
        }

        /* INPUT & TEXTAREA FIX */
        html.template-chinesenewyear .customer-modal input,
        html.template-chinesenewyear .customer-modal textarea,
        html.template-chinesenewyear .customer-modal .ant-input,
        html.template-chinesenewyear .customer-modal .ant-input-affix-wrapper,
        html.template-chinesenewyear .customer-modal .ant-select-selector,
        html.template-chinesenewyear .customer-modal .ant-picker {
            background-color: rgba(0, 0, 0, 0.6) !important;
            border-color: rgba(255, 215, 0, 0.3) !important;
            color: #FFD700 !important;
        }

        /* Fix for inputs inside Affix Wrappers */
        html.template-chinesenewyear .customer-modal .ant-input-affix-wrapper input.ant-input {
            background-color: transparent !important;
            border: none !important;
        }

        /* AUTOFILL FIX - Forces dark background for autofilled inputs */
        html.template-chinesenewyear .customer-modal input:-webkit-autofill,
        html.template-chinesenewyear .customer-modal input:-webkit-autofill:hover,
        html.template-chinesenewyear .customer-modal input:-webkit-autofill:focus,
        html.template-chinesenewyear .customer-modal input:-webkit-autofill:active,
        html.template-chinesenewyear .customer-modal textarea:-webkit-autofill,
        html.template-chinesenewyear .customer-modal textarea:-webkit-autofill:hover {
            -webkit-box-shadow: 0 0 0 1000px #1a0505 inset !important; /* Dark Red Background */
            -webkit-text-fill-color: #FFD700 !important;
            transition: background-color 5000s ease-in-out 0s;
        }

        html.template-chinesenewyear .customer-modal .ant-input::placeholder,
        html.template-chinesenewyear .customer-modal input::placeholder,
        html.template-chinesenewyear .customer-modal textarea::placeholder {
            color: rgba(255, 255, 255, 0.4) !important;
        }

        /* ==========================================
           INVENTORY TRANSACTION STYLES
           ========================================== */

        /* Statistics Cards - Match HomePage Style */
        html.template-chinesenewyear .inventory-transaction-container .ant-card {
            background-color: #641d0e !important;
            background: #641d0e !important;
            border: 1px solid #8a2d1d !important;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3) !important;
        }

        /* Hover Effect for Cards to match Home */
        html.template-chinesenewyear .inventory-transaction-container .ant-card:hover {
            border-color: #a33623 !important;
            transform: translateY(-2px);
            transition: all 0.3s ease;
        }

        html.template-chinesenewyear .inventory-transaction-container .ant-statistic-title {
            color: rgba(255, 255, 255, 0.8) !important;
        }

        html.template-chinesenewyear .inventory-transaction-container .ant-statistic-content-value {
            color: #FFD700 !important;
        }

        /* Override Green/Blue/Purple backgrounds on stats */
        html.template-chinesenewyear .inventory-transaction-container .from-green-50,
        html.template-chinesenewyear .inventory-transaction-container .from-blue-50,
        html.template-chinesenewyear .inventory-transaction-container .from-purple-50,
        html.template-chinesenewyear .inventory-transaction-container .bg-blue-50\/30 {
            background: rgba(139, 0, 0, 0.3) !important;
            border-color: rgba(255, 215, 0, 0.2) !important;
        }

        /* FORCE CLEAR WHITE BACKGROUND */
        html.template-chinesenewyear .inventory-transaction-container,
        html.template-chinesenewyear .inventory-transaction-container > div.bg-white,
        html.template-chinesenewyear .inventory-transaction-container .rounded-lg.bg-white {
            background-color: transparent !important;
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
        }

        /* Update Text Colors for Transparent Background */
        html.template-chinesenewyear .inventory-transaction-container h4.ant-typography,
        html.template-chinesenewyear .inventory-transaction-container h5.ant-typography,
        html.template-chinesenewyear .inventory-transaction-container .ant-typography {
            color: #FFD700 !important;
        }

         html.template-chinesenewyear .inventory-transaction-container .text-gray-600,
         html.template-chinesenewyear .inventory-transaction-container .text-gray-500 {
            color: rgba(255, 255, 255, 0.8) !important;
         }

        /* Specific Stat Text Overrides */
        html.template-chinesenewyear .inventory-transaction-container .text-green-700,
        html.template-chinesenewyear .inventory-transaction-container .text-blue-700,
        html.template-chinesenewyear .inventory-transaction-container .text-purple-700 {
            color: #FFD700 !important; /* Gold for values */
        }
        
        html.template-chinesenewyear .inventory-transaction-container .text-green-600,
        html.template-chinesenewyear .inventory-transaction-container .text-blue-600,
        html.template-chinesenewyear .inventory-transaction-container .text-purple-600,
        html.template-chinesenewyear .inventory-transaction-container .text-orange-600 {
             color: #ff9f43 !important; /* Orange/Gold for secondary values */
        }


        /* Buttons */
        html.template-chinesenewyear .customer-modal .ant-btn-primary,
        html.template-chinesenewyear .customer-modal .bg-blue-500,
        html.template-chinesenewyear .customer-modal .bg-orange-500 {
            background: linear-gradient(135deg, #FF0000 0%, #CC0000 100%) !important;
            border-color: #FF0000 !important;
            color: white !important;
        }
        /* ==========================================
           ORDER PAGE TABLE STYLES
           ========================================== */
        
        /* Transparent Table Container */
        html.template-chinesenewyear .ant-table-wrapper,
        html.template-chinesenewyear .ant-table,
        html.template-chinesenewyear .ant-table-container,
        html.template-chinesenewyear .ant-table-content {
            background: transparent !important;
        }

        /* Table Headers */
        html.template-chinesenewyear .ant-table-thead > tr > th {
            background: rgba(139, 0, 0, 0.6) !important;
            color: #FFD700 !important; 
            border-bottom: 2px solid rgba(255, 215, 0, 0.3) !important;
        }

        /* Table Rows */
        html.template-chinesenewyear .ant-table-tbody > tr > td {
            background: rgba(25, 0, 0, 0.4) !important;
            color: white !important;
            border-bottom: 1px solid rgba(255, 215, 0, 0.1) !important;
        }

        /* Hover Rows */
        html.template-chinesenewyear .ant-table-tbody > tr:hover > td {
             background: rgba(139, 0, 0, 0.6) !important;
        }

        /* Pagination */
        html.template-chinesenewyear .ant-pagination-item a {
             color: #FFD700 !important;
        }

        html.template-chinesenewyear .ant-pagination-item-active {
            background: transparent !important;
             border-color: #FFD700 !important;
        }
        
        html.template-chinesenewyear .ant-pagination-prev .ant-pagination-item-link,
        html.template-chinesenewyear .ant-pagination-next .ant-pagination-item-link {
             color: #FFD700 !important;
             background: transparent !important;
        }

        /* Search & Date Picker on Order Page */
         html.template-chinesenewyear .ant-picker,
         html.template-chinesenewyear .ant-input-affix-wrapper {
             background: rgba(0, 0, 0, 0.5) !important;
             border-color: rgba(255, 215, 0, 0.3) !important;
             color: white !important;
         }

         html.template-chinesenewyear .ant-picker-input > input,
         html.template-chinesenewyear .ant-input {
             color: white !important;
         }

         html.template-chinesenewyear .ant-picker-suffix,
         html.template-chinesenewyear .ant-input-prefix,
         html.template-chinesenewyear .ant-input-suffix {
             color: #FFD700 !important;
         }
        /* ==========================================
           PRE-ORDER MANAGEMENT STYLES
           ========================================== */
        
        /* Main Container Cards (Header, Stats, Filters) */
        html.template-chinesenewyear .pre-order-management-container .ant-card {
            background-color: #641d0e !important;
            background: #641d0e !important;
            border: 1px solid #8a2d1d !important;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3) !important;
            color: #FFD700 !important;
        }

        /* Hover Effect for Cards */
        html.template-chinesenewyear .pre-order-management-container .ant-card:hover {
            border-color: #a33623 !important;
        }

        /* Statistic Titles */
        html.template-chinesenewyear .pre-order-management-container .ant-statistic-title,
        html.template-chinesenewyear .pre-order-management-container .ant-statistic-title span {
            color: rgba(255, 255, 255, 0.8) !important;
        }

        /* Statistic Values - Override inline colors */
        html.template-chinesenewyear .pre-order-management-container .ant-statistic-content-value,
        html.template-chinesenewyear .pre-order-management-container .ant-statistic-content-value span {
            color: #FFD700 !important;
        }

        /* Filter Inputs & Selects */
        html.template-chinesenewyear .pre-order-management-container .ant-select-selector,
        html.template-chinesenewyear .pre-order-management-container .ant-picker,
        html.template-chinesenewyear .pre-order-management-container .ant-input {
            background: rgba(0, 0, 0, 0.5) !important;
            border-color: rgba(255, 215, 0, 0.3) !important;
            color: white !important;
        }

        html.template-chinesenewyear .pre-order-management-container .ant-select-arrow,
        html.template-chinesenewyear .pre-order-management-container .ant-picker-suffix {
             color: #FFD700 !important;
        }
        
        /* Table Override for Pre-Order Page specifically if needed, 
           otherwise generic Order Table styles might apply. 
           But let's ensure transparency here too. */
        html.template-chinesenewyear .pre-order-management-container .ant-table {
            background: transparent !important;
        }

        /* Tag Colors inside Table - ensure text is readable */
        html.template-chinesenewyear .pre-order-management-container .ant-tag {
            border-color: transparent !important;
        }

        /* Text Colors */
        html.template-chinesenewyear .pre-order-management-container .khmer-text-product {
            color: #FFD700 !important;
        }
        
        html.template-chinesenewyear .pre-order-management-container h2 {
            color: #FFD700 !important;
        }
        /* ==========================================
           PURCHASE PAGE STYLES
           ========================================== */

        /* Header Card */
        html.template-chinesenewyear .purchase-header-card {
            background-color: #641d0e !important;
            background: #641d0e !important;
            border: 1px solid #8a2d1d !important;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3) !important;
            color: #FFD700 !important;
        }

        /* Stats Values - Override Tailwind Colors */
        html.template-chinesenewyear .purchase-header-card .text-blue-600,
        html.template-chinesenewyear .purchase-header-card .text-green-600,
        html.template-chinesenewyear .purchase-header-card .text-orange-600,
        html.template-chinesenewyear .purchase-header-card .text-purple-600,
        html.template-chinesenewyear .purchase-header-card .text-gray-900,
        html.template-chinesenewyear .purchase-header-card .text-gray-500 {
            color: #FFD700 !important;
        }
        
        /* Stats Labels */
        html.template-chinesenewyear .purchase-header-card .text-gray-500,
        html.template-chinesenewyear .purchase-header-card .text-gray-400 {
             color: rgba(255, 255, 255, 0.8) !important;
        }

        /* Search Input in Header */
        html.template-chinesenewyear .purchase-header-card .ant-input-affix-wrapper,
        html.template-chinesenewyear .purchase-header-card .ant-input {
            background: rgba(0, 0, 0, 0.5) !important;
            border-color: rgba(255, 215, 0, 0.3) !important;
            color: white !important;
        }

        /* Table Card Container */
        html.template-chinesenewyear .purchase-table-card {
            background: transparent !important;
             box-shadow: none !important;
        }

        /* Purchase Table Overrides (reuse generic order table styles but being specific helps) */
        html.template-chinesenewyear .purchase-table-card .ant-table-thead > tr > th {
             background: rgba(139, 0, 0, 0.6) !important;
             color: #FFD700 !important;
        }
        
        html.template-chinesenewyear .purchase-table-card .ant-table-tbody > tr > td {
             border-bottom-color: rgba(255, 215, 0, 0.1) !important;
        }

        /* Remove white background from any internal cards if they exist */
        html.template-chinesenewyear .purchase-page-container .bg-white {
             background-color: transparent !important;
        }
        /* ==========================================
           PURCHASE ORDER DETAIL MODAL STYLES
           ========================================== */

        /* Modal Content Wrapper */
        html.template-chinesenewyear .ant-modal-content {
            background-color: #641d0e !important;
            background: #641d0e !important;
            border: 2px solid #8a2d1d !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
            color: #FFD700 !important;
        }

        /* Modal Header */
        html.template-chinesenewyear .ant-modal-header {
            background: transparent !important;
            border-bottom: 1px solid #8a2d1d !important;
        }

        html.template-chinesenewyear .ant-modal-title {
             color: #FFD700 !important;
        }

        html.template-chinesenewyear .ant-modal-close {
             color: #FFD700 !important;
        }

        /* Override Gray Backgrounds in Modal (Items List) */
        html.template-chinesenewyear .ant-modal-content .bg-gray-50,
        html.template-chinesenewyear .ant-modal-content .bg-gray-100 {
            background: rgba(0, 0, 0, 0.3) !important;
            border: 1px solid rgba(255, 215, 0, 0.1) !important;
        }

        /* Override Blue Backgrounds in Modal (Total Amount) */
        html.template-chinesenewyear .ant-modal-content .bg-blue-50,
        html.template-chinesenewyear .ant-modal-content .bg-blue-100 {
            background: rgba(255, 215, 0, 0.1) !important;
            border: 1px solid rgba(255, 215, 0, 0.2) !important;
        }

        /* Text Colors Inside Modal */
        html.template-chinesenewyear .ant-modal-content .text-gray-900, 
        html.template-chinesenewyear .ant-modal-content .text-gray-700,
        html.template-chinesenewyear .ant-modal-content .text-gray-600,
        html.template-chinesenewyear .ant-modal-content .text-gray-500 {
            color: rgba(255, 255, 255, 0.9) !important;
        }

        /* Top Info Card inside Modal */
        html.template-chinesenewyear .purchase-item-card {
            background: rgba(139, 0, 0, 0.4) !important;
            border: 1px solid rgba(255, 215, 0, 0.2) !important;
        }

        /* Buttons inside Modal */
        html.template-chinesenewyear .ant-modal-content .bg-blue-500,
        html.template-chinesenewyear .ant-modal-footer .ant-btn-primary {
             background: linear-gradient(135deg, #FF0000 0%, #CC0000 100%) !important;
             border-color: #FF0000 !important;
             color: white !important;
        }

        /* Labels */
        html.template-chinesenewyear .ant-modal-content .text-xs,
        html.template-chinesenewyear .ant-modal-content .text-sm {
             color: #FFD700 !important;
        }
        
        /* Secondary Text (Notes etc) */
        html.template-chinesenewyear .ant-modal-content .text-gray-400 {
             color: rgba(255, 255, 255, 0.6) !important;
        }
        /* ==========================================
           EXPENSE & EXPENSE TYPE PAGE STYLES
           ========================================== */

        /* Main Containers */
        html.template-chinesenewyear .expanse-page-container,
        html.template-chinesenewyear .expanse-type-page-container {
            /* Ensure container doesn't block background */
        }

        /* All Cards inside Expense Pages */
        html.template-chinesenewyear .expanse-page-container .ant-card,
        html.template-chinesenewyear .expanse-type-page-container .ant-card,
        html.template-chinesenewyear .expanse-page-container .shadow-sm, /* Target the div with shadow-sm used as card */
        html.template-chinesenewyear .expanse-type-page-container .shadow-sm {
            background-color: #641d0e !important;
            background: #641d0e !important;
            border: 1px solid #8a2d1d !important;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3) !important;
            color: #FFD700 !important;
        }

        /* Specific Header Div Override (since it's not an ant-card but has bg-white class) */
        html.template-chinesenewyear .expanse-page-container .bg-white,
        html.template-chinesenewyear .expanse-type-page-container .bg-white,
        html.template-chinesenewyear .expanse-page-container .dark\:bg-gray-800,
        html.template-chinesenewyear .expanse-type-page-container .dark\:bg-gray-800 {
            background-color: #641d0e !important;
            border: 1px solid #8a2d1d !important;
        }

        /* Stats Cards - Remove Gradient Backgrounds */
        html.template-chinesenewyear .expanse-page-container .bg-gradient-to-br,
        html.template-chinesenewyear .expanse-type-page-container .bg-gradient-to-br {
             background: #641d0e !important;
             border: 1px solid #8a2d1d !important;
        }

        /* Statistic Titles & Values */
        html.template-chinesenewyear .expanse-page-container .ant-statistic-title,
        html.template-chinesenewyear .expanse-page-container .ant-statistic-content-value,
        html.template-chinesenewyear .expanse-type-page-container .ant-statistic-title,
        html.template-chinesenewyear .expanse-type-page-container .ant-statistic-content-value,
        html.template-chinesenewyear .expanse-page-container .ant-statistic-title span,
        html.template-chinesenewyear .expanse-page-container .ant-statistic-content-value span,
        /* Target generic text classes inside these containers */
        html.template-chinesenewyear .expanse-page-container .text-gray-700,
        html.template-chinesenewyear .expanse-page-container .text-gray-900,
        html.template-chinesenewyear .expanse-type-page-container .text-gray-900 {
            color: #FFD700 !important;
        }
        
        /* Override specific stat value colors (blue, green, purple, orange) */
        html.template-chinesenewyear .expanse-page-container .ant-statistic-content-value span[style*="color"],
        html.template-chinesenewyear .expanse-type-page-container .ant-statistic-content-value span[style*="color"] {
             color: #FFD700 !important;
        }

        /* Table Styles - reusable from other pages but scoped here for safety */
        html.template-chinesenewyear .expanse-page-container .ant-table,
        html.template-chinesenewyear .expanse-type-page-container .ant-table {
            background: transparent !important;
        }
        
        html.template-chinesenewyear .expanse-page-container .ant-table-thead > tr > th,
        html.template-chinesenewyear .expanse-type-page-container .ant-table-thead > tr > th {
             background: rgba(139, 0, 0, 0.6) !important;
             color: #FFD700 !important;
             border-bottom: 1px solid #8a2d1d !important;
        }

        html.template-chinesenewyear .expanse-page-container .ant-table-tbody > tr > td,
        html.template-chinesenewyear .expanse-type-page-container .ant-table-tbody > tr > td {
             background: transparent !important; /* Let page bg show through or use dark red */
             color: white !important;
             border-bottom: 1px solid rgba(255, 215, 0, 0.1) !important;
        }
        
        html.template-chinesenewyear .expanse-page-container .ant-table-tbody > tr:hover > td,
        html.template-chinesenewyear .expanse-type-page-container .ant-table-tbody > tr:hover > td {
             background: rgba(255, 215, 0, 0.1) !important;
        }

        /* Search Inputs */
        html.template-chinesenewyear .expanse-page-container .ant-input-affix-wrapper,
        html.template-chinesenewyear .expanse-type-page-container .ant-input-affix-wrapper,
        html.template-chinesenewyear .expanse-page-container .ant-input,
        html.template-chinesenewyear .expanse-type-page-container .ant-input {
            background: rgba(0, 0, 0, 0.5) !important;
            border-color: rgba(255, 215, 0, 0.3) !important;
            color: white !important;
        }

        /* Expenses by Type - Inner Cards */
        html.template-chinesenewyear .expanse-page-container .bg-gray-50 {
             background: rgba(0, 0, 0, 0.3) !important;
             border: 1px solid rgba(138, 45, 29, 0.5) !important;
        }
        
        html.template-chinesenewyear .expanse-page-container .text-green-600 {
             color: #FFD700 !important;
        }
        /* ==========================================
           EMPLOYEE PAGE STYLES
           ========================================== */

        /* Main Container Background - ensure transparency */
        html.template-chinesenewyear .employee-page-container {
            /* No specific bg needed, let page bg shine */
        }
        
        /* Heading Styles */
        html.template-chinesenewyear .employee-page-container h3,
        html.template-chinesenewyear .employee-page-container .ant-typography {
            color: #FFD700 !important;
        }

        /* Tabs Styles */
        html.template-chinesenewyear .employee-page-container .ant-tabs-nav::before {
             border-bottom-color: #8a2d1d !important;
        }
        
        html.template-chinesenewyear .employee-page-container .ant-tabs-tab {
             color: rgba(255, 215, 0, 0.7) !important;
        }
        
        html.template-chinesenewyear .employee-page-container .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
             color: #FFD700 !important;
             text-shadow: 0 0 5px rgba(255, 215, 0, 0.5) !important;
        }
        
        html.template-chinesenewyear .employee-page-container .ant-tabs-ink-bar {
             background: #FFD700 !important;
        }

        /* Employee List Container */
        html.template-chinesenewyear .employee-list-container {
            background-color: #641d0e !important;
            border: 1px solid #8a2d1d !important;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3) !important;
            color: #FFD700 !important;
        }
        
        /* Table overrides inside Employee List */
        html.template-chinesenewyear .employee-list-container .ant-table {
            background: transparent !important;
        }
        
        html.template-chinesenewyear .employee-list-container .ant-table-thead > tr > th {
             background: rgba(139, 0, 0, 0.6) !important;
             color: #FFD700 !important;
             border-bottom: 1px solid #8a2d1d !important;
        }
        
        html.template-chinesenewyear .employee-list-container .ant-table-tbody > tr > td {
             background: transparent !important;
             border-bottom: 1px solid rgba(255, 215, 0, 0.1) !important;
             color: white !important;
        }
        
        html.template-chinesenewyear .employee-list-container .ant-table-tbody > tr:hover > td {
             background: rgba(255, 215, 0, 0.1) !important;
        }
        
        /* Input & Search Fields in List */
        html.template-chinesenewyear .employee-list-container .ant-input-affix-wrapper,
        html.template-chinesenewyear .employee-list-container .ant-input {
            background: rgba(0, 0, 0, 0.5) !important;
            border-color: rgba(255, 215, 0, 0.3) !important;
            color: white !important;
        }
        
        html.template-chinesenewyear .employee-list-container .ant-btn-default {
             background: transparent !important;
             border-color: #FFD700 !important;
             color: #FFD700 !important;
        }
        
        html.template-chinesenewyear .employee-list-container .ant-btn-default:hover {
             background: rgba(255, 215, 0, 0.1) !important;
        }
        
        /* Salary Reports Tab Content */
        html.template-chinesenewyear .employee-page-container .bg-white {
            background-color: #641d0e !important;
            border: 1px solid #8a2d1d !important;
        }
        
        /* Salary Icon Circle Background (was green-50) */
        html.template-chinesenewyear .employee-page-container .bg-green-50 {
             background-color: rgba(0, 0, 0, 0.3) !important;
             border: 1px solid rgba(255, 215, 0, 0.3) !important;
        }
        
        /* Salary Icon Color (was green-600) */
        html.template-chinesenewyear .employee-page-container .text-green-600 {
             color: #FFD700 !important;
        }
        
        /* Salary Button (was green-600 background) */
        html.template-chinesenewyear .employee-page-container .bg-green-600 {
             background: linear-gradient(135deg, #FF0000 0%, #CC0000 100%) !important;
             border-color: #FF0000 !important;
             color: white !important;
        }
        
        /* Text Secondary */
        html.template-chinesenewyear .employee-page-container .ant-typography-secondary {
             color: rgba(255, 255, 255, 0.7) !important;
        }
        
        /* Modals inside Employee Page (specifically View Modal elements) */
        html.template-chinesenewyear .ant-modal-content .bg-blue-50 {
             background-color: rgba(0, 0, 0, 0.3) !important;
             border: 1px solid rgba(255, 215, 0, 0.2) !important;
        }
        
        html.template-chinesenewyear .ant-modal-content .text-blue-600 {
             color: #FFD700 !important;
        }
        
        html.template-chinesenewyear .ant-modal-content .border-blue-100 {
             border-color: rgba(255, 215, 0, 0.2) !important;
        }
        /* ==========================================
           PRODUCT PAGE STYLES
           ========================================== */

        /* Header Bar Override */
        html.template-chinesenewyear .product-page-container .pageHeader {
            background: #641d0e !important;
            border: 1px solid #8a2d1d !important;
            box-shadow: 0 4px 15px rgba(0,0,0,0.5) !important;
        }
        
        /* Stats & Search Bar Container */
        html.template-chinesenewyear .product-page-container .bg-white {
            background-color: #641d0e !important;
            border: 1px solid #8a2d1d !important;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3) !important;
        }

        /* Stats Numbers */
        html.template-chinesenewyear .product-page-container .text-blue-600,
        html.template-chinesenewyear .product-page-container .text-green-600 {
            color: #FFD700 !important;
        }

        /* Stats Labels */
        html.template-chinesenewyear .product-page-container .text-gray-400 {
            color: rgba(255, 255, 255, 0.7) !important;
        }

        /* Search Input */
        html.template-chinesenewyear .product-page-container .ant-input-search .ant-input,
        html.template-chinesenewyear .product-page-container .ant-input-group-addon {
             background: rgba(0, 0, 0, 0.5) !important;
             border-color: rgba(255, 215, 0, 0.3) !important;
             color: white !important;
        }
        
        html.template-chinesenewyear .product-page-container .ant-input-search .ant-btn {
             background: linear-gradient(135deg, #FF0000 0%, #CC0000 100%) !important;
             border-color: #FF0000 !important;
             color: white !important;
        }

        /* New Product Button (Blue by default) */
        html.template-chinesenewyear .product-page-container .ant-btn-primary[style*="background: #3b82f6"],
        html.template-chinesenewyear .product-page-container .ant-btn-primary[style*="background: rgb(59, 130, 246)"] {
             background: linear-gradient(135deg, #FF0000 0%, #CC0000 100%) !important;
             border-color: #FF0000 !important;
        }

        /* Table Styles */
        html.template-chinesenewyear .product-page-container .ant-table {
            background: transparent !important;
        }
        
        html.template-chinesenewyear .product-page-container .ant-table-thead > tr > th {
             background: rgba(139, 0, 0, 0.6) !important;
             color: #FFD700 !important;
             border-bottom: 1px solid #8a2d1d !important;
        }
        
        html.template-chinesenewyear .product-page-container .ant-table-tbody > tr > td {
             background: transparent !important;
             color: white !important;
             border-bottom: 1px solid rgba(255, 215, 0, 0.1) !important;
        }
        
        html.template-chinesenewyear .product-page-container .ant-table-tbody > tr:hover > td {
             background: rgba(255, 215, 0, 0.1) !important;
        }
        
        /* Modal Form Inputs */
        html.template-chinesenewyear .ant-modal .ant-form-item-label > label {
             color: #FFD700 !important;
        }
        
        html.template-chinesenewyear .ant-modal .ant-input,
        html.template-chinesenewyear .ant-modal .ant-select-selector {
             background: rgba(0, 0, 0, 0.3) !important;
             border-color: rgba(255, 215, 0, 0.3) !important;
             color: white !important;
        }

        /* Radio Group Text */
        html.template-chinesenewyear .product-page-container .ant-radio-button-wrapper {
             background: transparent !important;
             border-color: #8a2d1d !important;
             color: white !important;
        }
        
        html.template-chinesenewyear .product-page-container .ant-radio-button-wrapper-checked {
             background: #FFD700 !important;
             border-color: #FFD700 !important;
             color: #641d0e !important;
        }

        /* Ensure Table Text Colors (Name, Price) are visible */
        html.template-chinesenewyear .product-page-container .khmer-title1 {
             color: #FFD700 !important; /* Gold */
        }
        
        html.template-chinesenewyear .product-page-container .text-purple-600 {
             color: #FFD700 !important;
        }
        /* ==========================================
           REPORT PAGES STYLES
           (Sale Summary, Customer, Stock Status, Stock Movement)
           ========================================== */

        /* SHARED: Container & Backgrounds */
        html.template-chinesenewyear .report-sale-summary-container,
        html.template-chinesenewyear .report-customer-summary-container,
        html.template-chinesenewyear .report-stock-status-container,
        html.template-chinesenewyear .report-stock-movement-container,
        html.template-chinesenewyear .report-purchase-history-container,
        html.template-chinesenewyear .report-outstanding-debt-container,
        html.template-chinesenewyear .report-payment-history-container,
        html.template-chinesenewyear .report-profit-loss-container {
            background: transparent !important; /* Let body bg show through or reset */
        }
        
        /* Remove original gradients on these containers */
        html.template-chinesenewyear .report-sale-summary-container.bg-gradient-to-br,
        html.template-chinesenewyear .report-customer-summary-container.bg-gradient-to-br,
        html.template-chinesenewyear .report-stock-status-container.bg-gradient-to-br,
        html.template-chinesenewyear .report-stock-movement-container.bg-gradient-to-br,
        html.template-chinesenewyear .report-purchase-history-container.bg-gradient-to-br,
        html.template-chinesenewyear .report-outstanding-debt-container.bg-gradient-to-br,
        html.template-chinesenewyear .report-payment-history-container.bg-gradient-to-br,
        html.template-chinesenewyear .report-profit-loss-container.bg-gray-50 {
             background: transparent !important;
        }

        /* SHARED: Header Cards & Filter Cards & Content Cards */
        html.template-chinesenewyear .report-sale-summary-container .ant-card,
        html.template-chinesenewyear .report-customer-summary-container .ant-card,
        html.template-chinesenewyear .report-stock-status-container .ant-card,
        html.template-chinesenewyear .report-stock-movement-container .ant-card,
        html.template-chinesenewyear .report-purchase-history-container .ant-card,
        html.template-chinesenewyear .report-outstanding-debt-container .ant-card,
        html.template-chinesenewyear .report-payment-history-container .ant-card,
        html.template-chinesenewyear .report-profit-loss-container .ant-card {
            background: #641d0e !important;
            border: 1px solid #8a2d1d !important;
            color: white !important;
        }
        
        /* Specific Header Gradients Override (e.g. blue-600 via indigo-600) */
        html.template-chinesenewyear .report-sale-summary-container .bg-gradient-to-r,
        html.template-chinesenewyear .report-customer-summary-container .bg-gradient-to-r,
        html.template-chinesenewyear .report-stock-status-container .bg-gradient-to-r,
        html.template-chinesenewyear .report-stock-movement-container .bg-gradient-to-r,
        html.template-chinesenewyear .report-purchase-history-container .bg-gradient-to-r,
        html.template-chinesenewyear .report-outstanding-debt-container .bg-gradient-to-r,
        html.template-chinesenewyear .report-payment-history-container .bg-gradient-to-r,
        html.template-chinesenewyear .report-profit-loss-container .ant-card[style*="linear-gradient"] {
             background: #641d0e !important; /* Consistent with header */
             border-bottom: 2px solid #FFD700 !important;
        }

        /* SHARED: Statistics Cards Gradients Override */
        /* We'll make them all a rich red/gold gradient or distinct festive colors */
        
        /* Blue/green/purple/pink gradient overrides for statistic cards */
        html.template-chinesenewyear .report-sale-summary-container .bg-gradient-to-br,
        html.template-chinesenewyear .report-customer-summary-container .bg-gradient-to-br,
        html.template-chinesenewyear .report-stock-status-container .bg-gradient-to-br,
        html.template-chinesenewyear .report-stock-movement-container .bg-gradient-to-br,
        html.template-chinesenewyear .report-purchase-history-container .bg-gradient-to-br,
        html.template-chinesenewyear .report-outstanding-debt-container .bg-gradient-to-br,
        html.template-chinesenewyear .report-payment-history-container .bg-gradient-to-br,
        html.template-chinesenewyear .report-profit-loss-container .ant-statistic-title {
             /* Note: profit loss stats are inside cards styled above, so mostly handled there. */
             /* But for consistency, let's ensure gradients are red/gold */
        }
        
        /* Force specific statistic card backgrounds in P&L */
        html.template-chinesenewyear .report-profit-loss-container .ant-card[style*="linear-gradient"] {
            background: linear-gradient(135deg, #8B0000 0%, #A52A2A 100%) !important;
            border: 1px solid #FFD700 !important;
        }

        html.template-chinesenewyear .report-sale-summary-container .bg-gradient-to-br,
        html.template-chinesenewyear .report-customer-summary-container .bg-gradient-to-br,
        html.template-chinesenewyear .report-stock-status-container .bg-gradient-to-br,
        html.template-chinesenewyear .report-stock-movement-container .bg-gradient-to-br,
        html.template-chinesenewyear .report-purchase-history-container .bg-gradient-to-br,
        html.template-chinesenewyear .report-outstanding-debt-container .bg-gradient-to-br,
        html.template-chinesenewyear .report-payment-history-container .bg-gradient-to-br {
             background: linear-gradient(135deg, #8B0000 0%, #A52A2A 100%) !important; /* Dark Red */
             border: 1px solid #FFD700 !important;
        }

        /* Statistic Text Colors */
        html.template-chinesenewyear .report-sale-summary-container .ant-statistic-title,
        html.template-chinesenewyear .report-customer-summary-container .ant-statistic-title,
        html.template-chinesenewyear .report-stock-status-container .ant-statistic-title,
        html.template-chinesenewyear .report-stock-movement-container .ant-statistic-title,
        html.template-chinesenewyear .report-purchase-history-container .ant-statistic-title,
        html.template-chinesenewyear .report-outstanding-debt-container .ant-statistic-title,
        html.template-chinesenewyear .report-payment-history-container .ant-statistic-title,
        html.template-chinesenewyear .report-profit-loss-container .ant-statistic-title {
             color: #FFD700 !important; /* Gold */
             opacity: 1 !important;
        }
        
        html.template-chinesenewyear .report-sale-summary-container .ant-statistic-content-value,
        html.template-chinesenewyear .report-customer-summary-container .ant-statistic-content-value,
        html.template-chinesenewyear .report-stock-status-container .ant-statistic-content-value,
        html.template-chinesenewyear .report-stock-movement-container .ant-statistic-content-value,
        html.template-chinesenewyear .report-purchase-history-container .ant-statistic-content-value,
        html.template-chinesenewyear .report-outstanding-debt-container .ant-statistic-content-value,
        html.template-chinesenewyear .report-payment-history-container .ant-statistic-content-value,
        html.template-chinesenewyear .report-profit-loss-container .ant-statistic-content-value {
             color: #ffffff !important;
             text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }

        /* SHARED: Inputs and DatePickers */
        html.template-chinesenewyear .report-sale-summary-container .ant-picker,
        html.template-chinesenewyear .report-customer-summary-container .ant-picker,
        html.template-chinesenewyear .report-stock-status-container .ant-picker,
        html.template-chinesenewyear .report-stock-movement-container .ant-picker,
        html.template-chinesenewyear .report-purchase-history-container .ant-picker,
        html.template-chinesenewyear .report-outstanding-debt-container .ant-picker,
        html.template-chinesenewyear .report-payment-history-container .ant-picker,
        html.template-chinesenewyear .report-profit-loss-container .ant-picker,
        html.template-chinesenewyear .report-sale-summary-container .ant-select-selector,
        html.template-chinesenewyear .report-customer-summary-container .ant-select-selector,
        html.template-chinesenewyear .report-stock-status-container .ant-select-selector,
        html.template-chinesenewyear .report-stock-movement-container .ant-select-selector,
        html.template-chinesenewyear .report-purchase-history-container .ant-select-selector,
        html.template-chinesenewyear .report-outstanding-debt-container .ant-select-selector,
        html.template-chinesenewyear .report-payment-history-container .ant-select-selector,
        html.template-chinesenewyear .report-profit-loss-container .ant-select-selector {
             background: rgba(0, 0, 0, 0.5) !important;
             border-color: rgba(255, 215, 0, 0.3) !important;
             color: white !important;
        }
        
        html.template-chinesenewyear .report-sale-summary-container .ant-select-selection-placeholder,
        html.template-chinesenewyear .report-customer-summary-container .ant-select-selection-placeholder,
        html.template-chinesenewyear .report-stock-status-container .ant-select-selection-placeholder,
        html.template-chinesenewyear .report-stock-movement-container .ant-select-selection-placeholder,
        html.template-chinesenewyear .report-purchase-history-container .ant-select-selection-placeholder,
        html.template-chinesenewyear .report-outstanding-debt-container .ant-select-selection-placeholder,
        html.template-chinesenewyear .report-payment-history-container .ant-select-selection-placeholder,
        html.template-chinesenewyear .report-profit-loss-container .ant-select-selection-placeholder {
             color: rgba(255, 255, 255, 0.6) !important;
        }

        /* SHARED: Buttons */
        /* Reset/Apply buttons usually default or primary */
        html.template-chinesenewyear .report-sale-summary-container .ant-btn-default,
        html.template-chinesenewyear .report-customer-summary-container .ant-btn-default,
        html.template-chinesenewyear .report-stock-status-container .ant-btn-default,
        html.template-chinesenewyear .report-stock-movement-container .ant-btn-default,
        html.template-chinesenewyear .report-purchase-history-container .ant-btn-default,
        html.template-chinesenewyear .report-outstanding-debt-container .ant-btn-default,
        html.template-chinesenewyear .report-payment-history-container .ant-btn-default,
        html.template-chinesenewyear .report-profit-loss-container .ant-btn-default {
             background: transparent !important;
             border-color: #FFD700 !important;
             color: #FFD700 !important;
        }
        
        html.template-chinesenewyear .report-sale-summary-container .ant-btn-primary,
        html.template-chinesenewyear .report-customer-summary-container .ant-btn-primary,
        html.template-chinesenewyear .report-stock-status-container .ant-btn-primary,
        html.template-chinesenewyear .report-stock-movement-container .ant-btn-primary,
        html.template-chinesenewyear .report-purchase-history-container .ant-btn-primary,
        html.template-chinesenewyear .report-outstanding-debt-container .ant-btn-primary,
        html.template-chinesenewyear .report-payment-history-container .ant-btn-primary,
        html.template-chinesenewyear .report-profit-loss-container .ant-btn-primary {
             background: linear-gradient(135deg, #FF0000 0%, #CC0000 100%) !important;
             border-color: #FF0000 !important;
             color: white !important;
        }

        /* SHARED: Tables */
        html.template-chinesenewyear .report-sale-summary-container .ant-table,
        html.template-chinesenewyear .report-customer-summary-container .ant-table,
        html.template-chinesenewyear .report-stock-status-container .ant-table,
        html.template-chinesenewyear .report-stock-movement-container .ant-table,
        html.template-chinesenewyear .report-purchase-history-container .ant-table,
        html.template-chinesenewyear .report-outstanding-debt-container .ant-table,
        html.template-chinesenewyear .report-payment-history-container .ant-table,
        html.template-chinesenewyear .report-profit-loss-container .ant-table {
            background: transparent !important;
            color: white !important;
        }

        html.template-chinesenewyear .report-sale-summary-container .ant-table-thead > tr > th,
        html.template-chinesenewyear .report-customer-summary-container .ant-table-thead > tr > th,
        html.template-chinesenewyear .report-stock-status-container .ant-table-thead > tr > th,
        html.template-chinesenewyear .report-stock-movement-container .ant-table-thead > tr > th,
        html.template-chinesenewyear .report-purchase-history-container .ant-table-thead > tr > th,
        html.template-chinesenewyear .report-outstanding-debt-container .ant-table-thead > tr > th,
        html.template-chinesenewyear .report-payment-history-container .ant-table-thead > tr > th,
        html.template-chinesenewyear .report-profit-loss-container .ant-table-thead > tr > th {
             background: rgba(139, 0, 0, 0.8) !important;
             color: #FFD700 !important;
             border-bottom: 1px solid #8a2d1d !important;
        }

        html.template-chinesenewyear .report-sale-summary-container .ant-table-tbody > tr > td,
        html.template-chinesenewyear .report-customer-summary-container .ant-table-tbody > tr > td,
        html.template-chinesenewyear .report-stock-status-container .ant-table-tbody > tr > td,
        html.template-chinesenewyear .report-stock-movement-container .ant-table-tbody > tr > td,
        html.template-chinesenewyear .report-purchase-history-container .ant-table-tbody > tr > td,
        html.template-chinesenewyear .report-outstanding-debt-container .ant-table-tbody > tr > td,
        html.template-chinesenewyear .report-payment-history-container .ant-table-tbody > tr > td,
        html.template-chinesenewyear .report-profit-loss-container .ant-table-tbody > tr > td {
             background: transparent !important;
             color: white !important;
             border-bottom: 1px solid rgba(255, 215, 0, 0.1) !important;
        }

        html.template-chinesenewyear .report-sale-summary-container .ant-table-tbody > tr:hover > td,
        html.template-chinesenewyear .report-customer-summary-container .ant-table-tbody > tr:hover > td,
        html.template-chinesenewyear .report-stock-status-container .ant-table-tbody > tr:hover > td,
        html.template-chinesenewyear .report-stock-movement-container .ant-table-tbody > tr:hover > td,
        html.template-chinesenewyear .report-purchase-history-container .ant-table-tbody > tr:hover > td,
        html.template-chinesenewyear .report-outstanding-debt-container .ant-table-tbody > tr:hover > td,
        html.template-chinesenewyear .report-payment-history-container .ant-table-tbody > tr:hover > td,
        html.template-chinesenewyear .report-profit-loss-container .ant-table-tbody > tr:hover > td {
             background: rgba(255, 215, 0, 0.1) !important;
        }
        
        /* Table Summary Row */
        html.template-chinesenewyear .report-sale-summary-container .ant-table-summary,
        html.template-chinesenewyear .ant-table-summary .ant-table-cell {
             background: rgba(255, 215, 0, 0.1) !important;
             color: #FFD700 !important;
             font-weight: bold !important;
        }

        /* Charts Container */
        html.template-chinesenewyear .report-sale-summary-container .bg-white,
        html.template-chinesenewyear .report-customer-summary-container .bg-white,
        html.template-chinesenewyear .report-stock-status-container .bg-white,
        html.template-chinesenewyear .report-stock-movement-container .bg-white,
        html.template-chinesenewyear .report-purchase-history-container .bg-white,
        html.template-chinesenewyear .report-outstanding-debt-container .bg-white,
        html.template-chinesenewyear .report-payment-history-container .bg-white,
        html.template-chinesenewyear .report-profit-loss-container .bg-white {
             background-color: #641d0e !important;
        }
        
        /* Typography overrides */
        html.template-chinesenewyear .report-sale-summary-container h1,
        html.template-chinesenewyear .report-sale-summary-container h2,
        html.template-chinesenewyear .report-sale-summary-container h3,
        html.template-chinesenewyear .report-customer-summary-container h1,
        html.template-chinesenewyear .report-customer-summary-container h2,
        html.template-chinesenewyear .report-customer-summary-container h3,
        html.template-chinesenewyear .report-stock-status-container h1,
        html.template-chinesenewyear .report-stock-status-container h2,
        html.template-chinesenewyear .report-stock-status-container h3,
        html.template-chinesenewyear .report-stock-movement-container h1,
        html.template-chinesenewyear .report-stock-movement-container h2,
        html.template-chinesenewyear .report-stock-movement-container h3,
        html.template-chinesenewyear .report-purchase-history-container h1,
        html.template-chinesenewyear .report-purchase-history-container h2,
        html.template-chinesenewyear .report-purchase-history-container h3,
        html.template-chinesenewyear .report-outstanding-debt-container h1,
        html.template-chinesenewyear .report-outstanding-debt-container h2,
        html.template-chinesenewyear .report-outstanding-debt-container h3,
        html.template-chinesenewyear .report-payment-history-container h1,
        html.template-chinesenewyear .report-payment-history-container h2,
        html.template-chinesenewyear .report-payment-history-container h3,
        html.template-chinesenewyear .report-profit-loss-container h1,
        html.template-chinesenewyear .report-profit-loss-container h2,
        html.template-chinesenewyear .report-profit-loss-container h3 {
             color: #FFD700 !important;
        }
        
        html.template-chinesenewyear .report-sale-summary-container .text-gray-500,
        html.template-chinesenewyear .report-sale-summary-container .text-gray-600,
        html.template-chinesenewyear .report-customer-summary-container .text-gray-500,
        html.template-chinesenewyear .report-customer-summary-container .text-gray-600,
        html.template-chinesenewyear .report-stock-status-container .text-gray-500,
        html.template-chinesenewyear .report-stock-status-container .text-gray-600,
        html.template-chinesenewyear .report-stock-movement-container .text-gray-500,
        html.template-chinesenewyear .report-stock-movement-container .text-gray-600,
        html.template-chinesenewyear .report-purchase-history-container .text-gray-500,
        html.template-chinesenewyear .report-purchase-history-container .text-gray-600,
        html.template-chinesenewyear .report-outstanding-debt-container .text-gray-500,
        html.template-chinesenewyear .report-outstanding-debt-container .text-gray-600,
        html.template-chinesenewyear .report-payment-history-container .text-gray-500,
        html.template-chinesenewyear .report-payment-history-container .text-gray-600,
        html.template-chinesenewyear .report-profit-loss-container .text-gray-500,
        html.template-chinesenewyear .report-profit-loss-container .text-gray-600 {
             color: rgba(255, 255, 255, 0.7) !important;
        }

        /* SHARED: Inner Content Boxes (Breakdowns, Mobile Cards) - Override light backgrounds */
        html.template-chinesenewyear .report-sale-summary-container .bg-blue-50,
        html.template-chinesenewyear .report-customer-summary-container .bg-blue-50,
        html.template-chinesenewyear .report-stock-status-container .bg-blue-50,
        html.template-chinesenewyear .report-stock-movement-container .bg-blue-50,
        html.template-chinesenewyear .report-purchase-history-container .bg-blue-50,
        html.template-chinesenewyear .report-outstanding-debt-container .bg-blue-50,
        html.template-chinesenewyear .report-payment-history-container .bg-blue-50,
        html.template-chinesenewyear .report-payment-history-container .bg-green-50,
        html.template-chinesenewyear .report-payment-history-container .bg-gray-50,
        html.template-chinesenewyear .report-payment-history-container .bg-gray-100,
        html.template-chinesenewyear .report-profit-loss-container .bg-blue-50,
        html.template-chinesenewyear .report-profit-loss-container .bg-green-50,
        html.template-chinesenewyear .report-profit-loss-container .bg-orange-50,
        html.template-chinesenewyear .report-profit-loss-container .bg-yellow-50,
        html.template-chinesenewyear .report-profit-loss-container .bg-red-50,
        html.template-chinesenewyear .report-profit-loss-container .bg-gray-50,
        html.template-chinesenewyear .report-profit-loss-container .bg-gray-100 {
             background-color: rgba(0, 0, 0, 0.4) !important;
             border: 1px solid rgba(255, 215, 0, 0.2) !important;
        }
        
        /* Mobile card specific backgrounds */
        html.template-chinesenewyear .report-sale-summary-container .bg-pink-100,
        html.template-chinesenewyear .report-customer-summary-container .bg-pink-100 {
             background-color: rgba(0, 0, 0, 0.4) !important;
             border: 1px solid rgba(255, 215, 0, 0.2) !important;
        }

        /* Text colors inside these boxes - Force Gold for readability on dark bg */
        html.template-chinesenewyear .report-profit-loss-container .text-blue-600,
        html.template-chinesenewyear .report-profit-loss-container .text-green-600,
        html.template-chinesenewyear .report-profit-loss-container .text-orange-600,
        html.template-chinesenewyear .report-profit-loss-container .text-yellow-600,
        html.template-chinesenewyear .report-profit-loss-container .text-red-600,
        html.template-chinesenewyear .report-profit-loss-container .text-red-700,
        html.template-chinesenewyear .report-payment-history-container .text-green-600,
        html.template-chinesenewyear .report-payment-history-container .text-orange-600,
        html.template-chinesenewyear .report-payment-history-container .text-blue-600 {
             color: #FFD700 !important;
        }
    `
};
