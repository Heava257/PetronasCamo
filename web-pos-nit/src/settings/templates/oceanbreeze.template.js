/**
 * Ocean Breeze Template - Aquatic Gradient Theme
 * Calming blue gradients inspired by water and ocean themes
 */
export const oceanBreezeTemplate = {
    id: 'oceanbreeze',
    name: 'Ocean Breeze',
    description: 'Aquatic gradient theme with calming blue tones',
    preview: {
        primaryColor: '#06b6d4',
        backgroundColor: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
        cardColor: '#ffffff'
    },

    // Colors
    colors: {
        primary: '#06b6d4',
        primaryHover: '#0284c7',
        primaryLight: 'rgba(6, 182, 212, 0.1)',
        secondary: '#0891b2',
        accent: '#22d3ee',

        // Background colors
        bgMain: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
        bgCard: '#ffffff',
        bgSidebar: 'rgba(255, 255, 255, 0.9)',
        bgHeader: 'rgba(255, 255, 255, 0.9)',

        // Text colors
        textPrimary: '#0c4a6e',
        textSecondary: '#075985',
        textMuted: '#0369a1',
        textOnPrimary: '#ffffff',

        // Border colors
        borderColor: '#7dd3fc',
        borderLight: '#bae6fd',

        // Status colors
        success: '#14b8a6',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#06b6d4'
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
        shadowSm: '0 4px 20px rgba(6, 182, 212, 0.1)',
        shadowMd: '0 8px 30px rgba(6, 182, 212, 0.15)',
        shadowLg: '0 12px 40px rgba(6, 182, 212, 0.2)'
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
            shadow: '0 8px 30px rgba(6, 182, 212, 0.12)',
            padding: '20px'
        },

        // Table styles
        table: {
            headerBg: '#f0f9ff',
            rowHoverBg: '#e0f2fe',
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
        background: 'rgba(255, 255, 255, 0.9)',
        textColor: '#0369a1',
        textColorActive: '#06b6d4',
        itemHoverBg: 'rgba(6, 182, 212, 0.1)',
        itemActiveBg: '#06b6d4'
    },

    // Effects
    effects: {
        glassBlur: 'blur(8px)',
        glassBg: 'rgba(255, 255, 255, 0.7)',
        transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }
};

export default oceanBreezeTemplate;
