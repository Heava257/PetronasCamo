/**
 * Sunset Glow Template - Warm Gradient Theme
 * Energetic warm gradients with orange, pink, and purple tones
 */
export const sunsetGlowTemplate = {
    id: 'sunsetglow',
    name: 'Sunset Glow',
    description: 'Warm gradient theme with orange and purple tones',
    preview: {
        primaryColor: '#f97316',
        backgroundColor: 'linear-gradient(135deg, #fed7aa 0%, #fbbf24 50%, #c084fc 100%)',
        cardColor: 'rgba(255, 255, 255, 0.9)'
    },

    // Colors
    colors: {
        primary: '#f97316',
        primaryHover: '#ea580c',
        primaryLight: 'rgba(249, 115, 22, 0.15)',
        secondary: '#a855f7',
        accent: '#fb923c',

        // Background colors
        bgMain: 'linear-gradient(135deg, #fed7aa 0%, #fbbf24 50%, #c084fc 100%)',
        bgCard: 'rgba(255, 255, 255, 0.9)',
        bgSidebar: 'rgba(255, 255, 255, 0.85)',
        bgHeader: 'rgba(255, 255, 255, 0.85)',

        // Text colors
        textPrimary: '#78350f',
        textSecondary: '#92400e',
        textMuted: '#a16207',
        textOnPrimary: '#ffffff',

        // Border colors
        borderColor: 'rgba(249, 115, 22, 0.3)',
        borderLight: 'rgba(249, 115, 22, 0.15)',

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
        borderRadius: '16px',
        borderRadiusLg: '20px',
        borderRadiusPill: '9999px',

        // Shadows
        shadowSm: '0 4px 20px rgba(249, 115, 22, 0.15)',
        shadowMd: '0 8px 30px rgba(249, 115, 22, 0.2)',
        shadowLg: '0 12px 40px rgba(249, 115, 22, 0.25)'
    },

    // Components
    components: {
        // Button styles
        button: {
            height: '40px',
            heightLg: '48px',
            paddingX: '20px',
            borderRadius: '16px'
        },

        // Input styles
        input: {
            height: '40px',
            heightLg: '48px',
            borderRadius: '16px',
            borderWidth: '1px'
        },

        // Card styles
        card: {
            borderRadius: '20px',
            shadow: '0 8px 30px rgba(249, 115, 22, 0.15)',
            padding: '20px'
        },

        // Table styles
        table: {
            headerBg: 'rgba(251, 146, 60, 0.1)',
            rowHoverBg: 'rgba(251, 146, 60, 0.05)',
            borderRadius: '16px'
        },

        // Menu styles
        menu: {
            itemHeight: '44px',
            itemPaddingX: '16px',
            itemBorderRadius: '16px'
        }
    },

    // Sidebar specific
    sidebar: {
        background: 'rgba(255, 255, 255, 0.85)',
        textColor: '#92400e',
        textColorActive: '#f97316',
        itemHoverBg: 'rgba(249, 115, 22, 0.1)',
        itemActiveBg: '#f97316'
    },

    // Effects
    effects: {
        glassBlur: 'blur(10px)',
        glassBg: 'rgba(255, 255, 255, 0.8)',
        transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }
};

export default sunsetGlowTemplate;
