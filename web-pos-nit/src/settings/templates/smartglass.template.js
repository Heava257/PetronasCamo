/**
 * Smart Glass Template - Modern Glassmorphism Design
 * Vibrant blue with glass effects, blur, and semi-transparent elements
 */
export const smartGlassTemplate = {
    id: 'smartglass',
    name: 'Smart Glass',
    description: 'Modern glassmorphism with vibrant blue accents',
    preview: {
        primaryColor: '#3b82f6',
        backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        cardColor: 'rgba(255, 255, 255, 0.15)'
    },

    // Colors
    colors: {
        primary: '#3b82f6',
        primaryHover: '#2563eb',
        primaryLight: 'rgba(59, 130, 246, 0.15)',
        secondary: '#8b5cf6',
        accent: '#06b6d4',

        // Background colors
        bgMain: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        bgCard: 'rgba(255, 255, 255, 0.15)',
        bgSidebar: 'rgba(255, 255, 255, 0.1)',
        bgHeader: 'rgba(255, 255, 255, 0.1)',

        // Text colors
        textPrimary: '#ffffff',
        textSecondary: 'rgba(255, 255, 255, 0.9)',
        textMuted: 'rgba(255, 255, 255, 0.7)',
        textOnPrimary: '#ffffff',

        // Border colors
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderLight: 'rgba(255, 255, 255, 0.1)',

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
        shadowSm: '0 4px 20px rgba(0, 0, 0, 0.1)',
        shadowMd: '0 8px 30px rgba(0, 0, 0, 0.15)',
        shadowLg: '0 12px 40px rgba(0, 0, 0, 0.2)'
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
            shadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
            padding: '20px'
        },

        // Table styles
        table: {
            headerBg: 'rgba(255, 255, 255, 0.1)',
            rowHoverBg: 'rgba(255, 255, 255, 0.05)',
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
        background: 'rgba(255, 255, 255, 0.1)',
        textColor: 'rgba(255, 255, 255, 0.8)',
        textColorActive: '#ffffff',
        itemHoverBg: 'rgba(255, 255, 255, 0.1)',
        itemActiveBg: '#3b82f6'
    },

    // Effects
    effects: {
        glassBlur: 'blur(12px)',
        glassBg: 'rgba(255, 255, 255, 0.1)',
        transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }
};

export default smartGlassTemplate;
