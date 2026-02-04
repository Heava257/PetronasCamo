/**
 * Crimson Pro Template
 * Professional dark red theme for enterprise
 */
export const crimsonProTemplate = {
    id: 'crimsonpro',
    name: 'Crimson Pro',
    description: 'Professional enterprise theme with red accents',
    preview: {
        primaryColor: '#dc2626',
        backgroundColor: '#fef2f2',
        cardColor: '#ffffff'
    },

    // Colors
    colors: {
        primary: '#dc2626',
        primaryHover: '#b91c1c',
        primaryLight: 'rgba(220, 38, 38, 0.1)',
        secondary: '#4b5563',
        accent: '#dc2626',

        // Background colors
        bgMain: '#fef2f2',
        bgCard: '#ffffff',
        bgSidebar: '#450a0a', // Dark red
        bgHeader: 'rgba(255, 255, 255, 0.9)',

        // Text colors
        textPrimary: '#111827',
        textSecondary: '#374151',
        textMuted: '#6b7280',
        textOnPrimary: '#ffffff',

        // Border colors
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderLight: 'rgba(0, 0, 0, 0.05)',

        // Status colors
        success: '#059669',
        warning: '#d97706',
        error: '#dc2626',
        info: '#2563eb',

        // Dark mode colors override
        darkColors: {
            bgMain: '#18181b',
            bgCard: '#27272a',
            bgSidebar: '#000000',
            bgHeader: '#18181b',
            textPrimary: '#f9fafb',
            textSecondary: '#d1d5db',
            textMuted: '#9ca3af'
        }
    },

    // Typography
    typography: {
        fontFamily: "'Roboto', sans-serif",
        fontSizeBase: '14px',
        fontSizeSm: '13px',
        fontSizeLg: '16px',
        fontSizeXl: '20px',
        fontSizeTitle: '26px',
        fontWeightNormal: 400,
        fontWeightMedium: 500,
        fontWeightBold: 700,
        lineHeight: 1.5
    },

    // Layout
    layout: {
        sidebarWidth: '260px',
        sidebarCollapsedWidth: '80px',
        headerHeight: '60px',
        contentPadding: '20px',
        cardPadding: '20px',
        borderRadius: '8px',
        borderRadiusLg: '12px',
        borderRadiusPill: '50px',
        shadowSm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
    },

    // Components
    components: {
        button: {
            height: '38px',
            heightLg: '44px',
            paddingX: '16px',
            borderRadius: '6px'
        },
        input: {
            height: '38px',
            heightLg: '44px',
            borderRadius: '6px',
            borderWidth: '1px'
        },
        menu: {
            itemHeight: '40px',
            itemPaddingX: '12px',
            itemBorderRadius: '6px'
        }
    },

    // Sidebar specific
    sidebar: {
        background: '#450a0a',
        textColor: '#fca5a5',
        textColorActive: '#ffffff',
        itemHoverBg: 'rgba(255, 255, 255, 0.1)',
        itemActiveBg: '#dc2626'
    },

    // Effects
    effects: {
        glassBlur: 'none', // No blur for pro feel
        glassBg: '#ffffff',
        transition: '0.2s ease-in-out'
    }
};

export default crimsonProTemplate;
