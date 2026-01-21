/**
 * Dark Dynamic Template - Premium Dark Mode with Gold Accents
 * Professional dark theme with gold highlights and sleek appearance
 */
export const darkDynamicTemplate = {
    id: 'darkdynamic',
    name: 'Dark Dynamic',
    description: 'Premium dark mode with gold accents',
    preview: {
        primaryColor: '#f59e0b',
        backgroundColor: '#0f172a',
        cardColor: '#1e293b'
    },

    // Colors
    colors: {
        primary: '#f59e0b',
        primaryHover: '#d97706',
        primaryLight: 'rgba(245, 158, 11, 0.15)',
        secondary: '#eab308',
        accent: '#fbbf24',

        // Background colors
        bgMain: '#0f172a',
        bgCard: '#1e293b',
        bgSidebar: '#1e293b',
        bgHeader: '#1e293b',

        // Text colors
        textPrimary: '#f1f5f9',
        textSecondary: '#cbd5e1',
        textMuted: '#94a3b8',
        textOnPrimary: '#0f172a',

        // Border colors
        borderColor: '#334155',
        borderLight: '#1e293b',

        // Status colors
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
    },

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
        headerHeight: '64px',
        contentPadding: '24px',
        cardPadding: '20px',

        // Border radius
        borderRadius: '12px',
        borderRadiusLg: '16px',
        borderRadiusPill: '9999px',

        // Shadows
        shadowSm: '0 4px 20px rgba(0, 0, 0, 0.3)',
        shadowMd: '0 8px 30px rgba(0, 0, 0, 0.4)',
        shadowLg: '0 12px 40px rgba(0, 0, 0, 0.5)'
    },

    // Components
    components: {
        // Button styles
        button: {
            height: '40px',
            heightLg: '48px',
            paddingX: '20px',
            borderRadius: '12px'
        },

        // Input styles
        input: {
            height: '40px',
            heightLg: '48px',
            borderRadius: '12px',
            borderWidth: '1px'
        },

        // Card styles
        card: {
            borderRadius: '16px',
            shadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
            padding: '20px'
        },

        // Table styles
        table: {
            headerBg: '#334155',
            rowHoverBg: '#334155',
            borderRadius: '12px'
        },

        // Menu styles
        menu: {
            itemHeight: '44px',
            itemPaddingX: '16px',
            itemBorderRadius: '12px'
        }
    },

    // Sidebar specific
    sidebar: {
        background: '#1e293b',
        textColor: '#cbd5e1',
        textColorActive: '#f59e0b',
        itemHoverBg: '#334155',
        itemActiveBg: '#f59e0b'
    },

    // Effects
    effects: {
        glassBlur: 'none',
        glassBg: 'transparent',
        transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }
};

export default darkDynamicTemplate;
