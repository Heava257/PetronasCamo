/**
 * Classic Template - Traditional Business Style
 * Blue primary color, square corners, compact layout
 */
export const classicTemplate = {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional business style with clean lines',
    preview: {
        primaryColor: '#1890ff',
        backgroundColor: '#f0f2f5',
        cardColor: '#ffffff'
    },

    // Colors
    colors: {
        primary: '#1890ff',
        primaryHover: '#40a9ff',
        primaryLight: 'rgba(24, 144, 255, 0.1)',
        secondary: '#52c41a',
        accent: '#1890ff',

        // Background colors
        bgMain: '#f0f2f5',
        bgCard: '#ffffff',
        bgSidebar: '#001529',
        bgHeader: '#ffffff',

        // Text colors
        textPrimary: '#262626',
        textSecondary: '#595959',
        textMuted: '#8c8c8c',
        textOnPrimary: '#ffffff',

        // Border colors
        borderColor: '#d9d9d9',
        borderLight: '#f0f0f0',

        // Status colors
        success: '#52c41a',
        warning: '#faad14',
        error: '#ff4d4f',
        info: '#1890ff'
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
        fontWeightBold: 600,
        lineHeight: 1.5
    },

    // Layout
    layout: {
        sidebarWidth: '240px',
        sidebarCollapsedWidth: '80px',
        headerHeight: '56px',
        contentPadding: '16px',
        cardPadding: '16px',

        // Border radius
        borderRadius: '4px',
        borderRadiusLg: '6px',
        borderRadiusPill: '20px',

        // Shadows
        shadowSm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        shadowMd: '0 2px 8px rgba(0, 0, 0, 0.1)',
        shadowLg: '0 4px 16px rgba(0, 0, 0, 0.12)'
    },

    // Components
    components: {
        // Button styles
        button: {
            height: '32px',
            heightLg: '40px',
            paddingX: '16px',
            borderRadius: '4px'
        },

        // Input styles
        input: {
            height: '32px',
            heightLg: '40px',
            borderRadius: '4px',
            borderWidth: '1px'
        },

        // Card styles
        card: {
            borderRadius: '4px',
            shadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            padding: '16px'
        },

        // Table styles
        table: {
            headerBg: '#fafafa',
            rowHoverBg: '#f5f5f5',
            borderRadius: '4px'
        },

        // Menu styles
        menu: {
            itemHeight: '40px',
            itemPaddingX: '16px',
            itemBorderRadius: '4px'
        }
    },

    // Sidebar specific (dark sidebar)
    sidebar: {
        background: '#001529',
        textColor: 'rgba(255, 255, 255, 0.65)',
        textColorActive: '#ffffff',
        itemHoverBg: 'rgba(255, 255, 255, 0.08)',
        itemActiveBg: '#1890ff'
    },

    // Effects
    effects: {
        glassBlur: 'none',
        glassBg: 'transparent',
        transition: '0.2s ease'
    }
};

export default classicTemplate;
