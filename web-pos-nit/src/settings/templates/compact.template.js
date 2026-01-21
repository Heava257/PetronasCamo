/**
 * Compact Template - Minimalist Dense Layout
 * Gray tones, smaller elements, maximum content density
 */
export const compactTemplate = {
    id: 'compact',
    name: 'Compact',
    description: 'Minimalist dense layout for power users',
    preview: {
        primaryColor: '#6366f1',
        backgroundColor: '#f9fafb',
        cardColor: '#ffffff'
    },

    // Colors
    colors: {
        primary: '#6366f1',
        primaryHover: '#4f46e5',
        primaryLight: 'rgba(99, 102, 241, 0.1)',
        secondary: '#8b5cf6',
        accent: '#6366f1',

        // Background colors
        bgMain: '#f9fafb',
        bgCard: '#ffffff',
        bgSidebar: '#1f2937',
        bgHeader: '#ffffff',

        // Text colors
        textPrimary: '#111827',
        textSecondary: '#4b5563',
        textMuted: '#9ca3af',
        textOnPrimary: '#ffffff',

        // Border colors
        borderColor: '#e5e7eb',
        borderLight: '#f3f4f6',

        // Status colors
        success: '#059669',
        warning: '#d97706',
        error: '#dc2626',
        info: '#6366f1'
    },

    // Typography
    typography: {
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontSizeBase: '13px',
        fontSizeSm: '11px',
        fontSizeLg: '14px',
        fontSizeXl: '16px',
        fontSizeTitle: '20px',
        fontWeightNormal: 400,
        fontWeightMedium: 500,
        fontWeightBold: 600,
        lineHeight: 1.4
    },

    // Layout
    layout: {
        sidebarWidth: '200px',
        sidebarCollapsedWidth: '60px',
        headerHeight: '48px',
        contentPadding: '12px',
        cardPadding: '12px',

        // Border radius
        borderRadius: '6px',
        borderRadiusLg: '8px',
        borderRadiusPill: '9999px',

        // Shadows
        shadowSm: '0 1px 2px rgba(0, 0, 0, 0.04)',
        shadowMd: '0 2px 4px rgba(0, 0, 0, 0.06)',
        shadowLg: '0 4px 8px rgba(0, 0, 0, 0.08)'
    },

    // Components
    components: {
        // Button styles
        button: {
            height: '28px',
            heightLg: '32px',
            paddingX: '12px',
            borderRadius: '6px'
        },

        // Input styles
        input: {
            height: '28px',
            heightLg: '32px',
            borderRadius: '6px',
            borderWidth: '1px'
        },

        // Card styles
        card: {
            borderRadius: '8px',
            shadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            padding: '12px'
        },

        // Table styles
        table: {
            headerBg: '#f9fafb',
            rowHoverBg: '#f3f4f6',
            borderRadius: '6px'
        },

        // Menu styles
        menu: {
            itemHeight: '32px',
            itemPaddingX: '12px',
            itemBorderRadius: '6px'
        }
    },

    // Sidebar specific (dark sidebar)
    sidebar: {
        background: '#1f2937',
        textColor: '#9ca3af',
        textColorActive: '#ffffff',
        itemHoverBg: 'rgba(255, 255, 255, 0.05)',
        itemActiveBg: '#6366f1'
    },

    // Effects
    effects: {
        glassBlur: 'none',
        glassBg: 'transparent',
        transition: '0.15s ease'
    }
};

export default compactTemplate;
