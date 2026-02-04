/**
 * DocuVerse Template
 * Clean medical/professional aesthetic with green accents and large border radius
 */
export const docuverseTemplate = {
    id: 'docuverse',
    name: 'DocuVerse',
    description: 'Clean professional style with green accents',
    preview: {
        primaryColor: '#22c55e',
        backgroundColor: '#f9fafb',
        cardColor: '#ffffff'
    },

    // Colors
    colors: {
        primary: '#22c55e', // Green-500
        primaryHover: '#16a34a', // Green-600
        primaryLight: 'rgba(34, 197, 94, 0.1)',
        secondary: '#64748b',
        accent: '#22c55e',

        // Background colors
        bgMain: '#f9fafb', // Gray-50
        bgCard: '#ffffff',
        bgSidebar: '#ffffff',
        bgHeader: 'transparent',

        // Text colors
        textPrimary: '#1f2937', // Gray-800
        textSecondary: '#6b7280', // Gray-500
        textMuted: '#9ca3af',
        textOnPrimary: '#ffffff',

        // Border colors
        borderColor: '#f3f4f6', // Gray-100
        borderLight: '#e5e7eb', // Gray-200

        // Status colors
        success: '#22c55e',
        warning: '#fbbf24',
        error: '#ef4444',
        info: '#3b82f6'
    },

    // Typography
    typography: {
        fontFamily: "'Manrope', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontSizeBase: '14px',
        fontSizeSm: '12px',
        fontSizeLg: '16px',
        fontSizeXl: '20px',
        fontSizeTitle: '24px',
        fontWeightNormal: 400,
        fontWeightMedium: 500,
        fontWeightBold: 700,
        lineHeight: 1.6
    },

    // Layout
    layout: {
        sidebarWidth: '260px',
        sidebarCollapsedWidth: '80px',
        headerHeight: '80px',
        contentPadding: '32px',
        cardPadding: '24px',

        // Border radius - DocuVerse uses very rounded corners
        borderRadius: '16px',
        borderRadiusLg: '24px',
        borderRadiusPill: '9999px',

        // Shadows
        shadowSm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    },

    // Components
    components: {
        // Button styles
        button: {
            height: '40px',
            heightLg: '48px',
            paddingX: '24px',
            borderRadius: '9999px' // Pill buttons
        },

        // Input styles
        input: {
            height: '40px',
            heightLg: '48px',
            borderRadius: '9999px', // Pill inputs
            borderWidth: '0px'
        },

        // Card styles
        card: {
            borderRadius: '24px',
            shadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            padding: '24px'
        },

        // Table styles
        table: {
            headerBg: 'transparent',
            rowHoverBg: '#f0fdf4', // Green-50
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
        background: '#ffffff',
        textColor: '#6b7280',
        textColorActive: '#1f2937',
        itemHoverBg: '#f9fafb',
        itemActiveBg: '#f0fdf4' // Light green bg for active
    },

    // Effects
    effects: {
        glassBlur: 'none',
        glassBg: 'transparent',
        transition: '0.2s ease-in-out'
    }
};

export default docuverseTemplate;
