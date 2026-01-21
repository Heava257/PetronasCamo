/**
 * Festive Template - Celebration Theme
 * Bright, colorful, and cheerful design with playful elements
 */
export const festiveTemplate = {
    id: 'festive',
    name: 'Festive',
    description: 'Celebration theme with bright, cheerful colors',
    preview: {
        primaryColor: '#ec4899',
        backgroundColor: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
        cardColor: '#ffffff'
    },

    // Colors
    colors: {
        primary: '#ec4899',
        primaryHover: '#db2777',
        primaryLight: 'rgba(236, 72, 153, 0.15)',
        secondary: '#f472b6',
        accent: '#a855f7',

        // Background colors
        bgMain: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
        bgCard: '#ffffff',
        bgSidebar: 'rgba(255, 255, 255, 0.95)',
        bgHeader: 'rgba(255, 255, 255, 0.95)',

        // Text colors
        textPrimary: '#831843',
        textSecondary: '#9f1239',
        textMuted: '#be185d',
        textOnPrimary: '#ffffff',

        // Border colors
        borderColor: '#f9a8d4',
        borderLight: '#fbcfe8',

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
        borderRadius: '20px',
        borderRadiusLg: '24px',
        borderRadiusPill: '9999px',

        // Shadows
        shadowSm: '0 4px 20px rgba(236, 72, 153, 0.15)',
        shadowMd: '0 8px 30px rgba(236, 72, 153, 0.2)',
        shadowLg: '0 12px 40px rgba(236, 72, 153, 0.25)'
    },

    // Components
    components: {
        // Button styles
        button: {
            height: '40px',
            heightLg: '48px',
            paddingX: '24px',
            borderRadius: '20px'
        },

        // Input styles
        input: {
            height: '40px',
            heightLg: '48px',
            borderRadius: '20px',
            borderWidth: '1px'
        },

        // Card styles
        card: {
            borderRadius: '24px',
            shadow: '0 8px 30px rgba(236, 72, 153, 0.15)',
            padding: '24px'
        },

        // Table styles
        table: {
            headerBg: '#fce7f3',
            rowHoverBg: '#fbcfe8',
            borderRadius: '20px'
        },

        // Menu styles
        menu: {
            itemHeight: '44px',
            itemPaddingX: '16px',
            itemBorderRadius: '20px'
        }
    },

    // Sidebar specific
    sidebar: {
        background: 'rgba(255, 255, 255, 0.95)',
        textColor: '#9f1239',
        textColorActive: '#ec4899',
        itemHoverBg: 'rgba(236, 72, 153, 0.1)',
        itemActiveBg: '#ec4899'
    },

    // Effects
    effects: {
        glassBlur: 'blur(8px)',
        glassBg: 'rgba(255, 255, 255, 0.8)',
        transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }
};

export default festiveTemplate;
