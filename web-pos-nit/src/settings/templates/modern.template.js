/**
 * Modern Template - Glassmorphism Style
 * Blue accent, glass blur effects, rounded corners
 */
export const modernTemplate = {
    id: 'modern',
    name: 'Modern',
    description: 'Glassmorphism style with premium feel',
    preview: {
        primaryColor: '#3b82f6',
        backgroundColor: '#f8fafc',
        cardColor: 'rgba(255, 255, 255, 0.8)'
    },

    // Colors
    colors: {
        primary: '#3b82f6',
        primaryHover: '#2563eb',
        primaryLight: 'rgba(59, 130, 246, 0.1)',
        secondary: '#10b981',
        accent: '#3b82f6',

        // Background colors
        bgMain: '#f8fafc',
        bgCard: 'rgba(255, 255, 255, 0.8)',
        bgSidebar: 'rgba(255, 255, 255, 0.8)',
        bgHeader: 'rgba(255, 255, 255, 0.7)',

        // Text colors
        textPrimary: '#1e293b',
        textSecondary: '#475569',
        textMuted: '#64748b',
        textOnPrimary: '#ffffff',

        // Border colors
        borderColor: 'rgba(0, 0, 0, 0.08)',
        borderLight: 'rgba(255, 255, 255, 0.3)',

        // Status colors
        success: '#10b981',
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
        lineHeight: 1.6
    },

    // Layout
    layout: {
        sidebarWidth: '280px',
        sidebarCollapsedWidth: '80px',
        headerHeight: '64px',
        contentPadding: '24px',
        cardPadding: '24px',

        // Border radius
        borderRadius: '12px',
        borderRadiusLg: '16px',
        borderRadiusPill: '9999px',

        // Shadows
        shadowSm: '0 2px 8px rgba(0, 0, 0, 0.04)',
        shadowMd: '0 4px 20px rgba(0, 0, 0, 0.05)',
        shadowLg: '0 10px 40px rgba(0, 0, 0, 0.1)'
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
            shadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            padding: '24px'
        },

        // Table styles
        table: {
            headerBg: 'rgba(59, 130, 246, 0.05)',
            rowHoverBg: 'rgba(59, 130, 246, 0.03)',
            borderRadius: '12px'
        },

        // Menu styles
        menu: {
            itemHeight: '44px',
            itemPaddingX: '16px',
            itemBorderRadius: '12px'
        }
    },

    // Sidebar specific (glass sidebar)
    sidebar: {
        background: 'rgba(255, 255, 255, 0.8)',
        textColor: '#64748b',
        textColorActive: '#ffffff',
        itemHoverBg: 'rgba(59, 130, 246, 0.08)',
        itemActiveBg: '#3b82f6'
    },

    // Effects
    effects: {
        glassBlur: 'blur(12px)',
        glassBg: 'rgba(255, 255, 255, 0.7)',
        transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }
};

export default modernTemplate;
