/**
 * Care Concierge Template
 * Soft, rounded UI with Blue accents and pill-shaped elements 
 */
export const careConciergeTemplate = {
    id: 'careconcierge',
    name: 'Care Concierge',
    description: 'Friendly, rounded UI with pill navigation',
    preview: {
        primaryColor: '#2563eb',
        backgroundColor: '#f0f2f5',
        cardColor: '#ffffff'
    },

    // Colors
    colors: {
        primary: '#2563eb', // Blue-600
        primaryHover: '#1d4ed8', // Blue-700
        primaryLight: 'rgba(37, 99, 235, 0.1)',
        secondary: '#64748b',
        accent: '#fbbf24', // Amber/Yellow

        // Background colors
        bgMain: '#f0f2f5', // Light gray background
        bgCard: '#ffffff',
        bgSidebar: '#ffffff',
        bgHeader: 'transparent',

        // Text colors
        textPrimary: '#1e293b',
        textSecondary: '#64748b',
        textMuted: '#94a3b8',
        textOnPrimary: '#ffffff',

        // Border colors
        borderColor: '#e2e8f0',
        borderLight: '#f1f5f9',

        // Status colors
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
    },

    // Typography
    typography: {
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
        fontSizeBase: '14px',
        fontSizeSm: '13px',
        fontSizeLg: '16px',
        fontSizeXl: '20px',
        fontSizeTitle: '28px',
        fontWeightNormal: 400,
        fontWeightMedium: 500,
        fontWeightBold: 700,
        lineHeight: 1.5
    },

    // Layout
    layout: {
        sidebarWidth: '280px',
        sidebarCollapsedWidth: '80px',
        headerHeight: '80px',
        contentPadding: '30px',
        cardPadding: '24px',

        // Border radius - Extreme rounding
        borderRadius: '20px',
        borderRadiusLg: '30px',
        borderRadiusPill: '9999px',

        // Shadows
        shadowSm: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        shadowLg: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)'
    },

    // Components
    components: {
        // Button styles
        button: {
            height: '44px',
            heightLg: '52px',
            paddingX: '30px',
            borderRadius: '9999px' // Pill buttons
        },

        // Input styles
        input: {
            height: '44px',
            heightLg: '52px',
            borderRadius: '16px',
            borderWidth: '0px'
        },

        // Card styles
        card: {
            borderRadius: '30px',
            shadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
            padding: '24px'
        },

        // Table styles
        table: {
            headerBg: 'transparent',
            rowHoverBg: '#eff6ff', // Blue-50
            borderRadius: '20px'
        },

        // Menu styles
        menu: {
            itemHeight: '48px',
            itemPaddingX: '20px',
            itemBorderRadius: '9999px' // Pill format for menu items
        }
    },

    // Sidebar specific
    sidebar: {
        background: '#ffffff',
        textColor: '#64748b',
        textColorActive: '#2563eb',
        itemHoverBg: '#f1f5f9',
        itemActiveBg: '#eff6ff'
    },

    // Effects
    effects: {
        glassBlur: 'none',
        glassBg: 'transparent',
        transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }
};

export default careConciergeTemplate;
