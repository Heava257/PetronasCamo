/**
 * Royal Amethyst Template
 * Deep purple luxury theme with glass effects
 */
export const royalAmethystTemplate = {
    id: 'royalamethyst',
    name: 'Royal Amethyst',
    description: 'Deep purple elegance with modern layout',
    preview: {
        primaryColor: '#8b5cf6',
        backgroundColor: '#f3f4f6',
        cardColor: 'rgba(255, 255, 255, 0.9)'
    },

    // Colors
    colors: {
        primary: '#8b5cf6',
        primaryHover: '#7c3aed',
        primaryLight: 'rgba(139, 92, 246, 0.1)',
        secondary: '#ec4899',
        accent: '#8b5cf6',

        // Background colors
        bgMain: '#f3f4f6',
        bgCard: 'rgba(255, 255, 255, 0.9)',
        bgSidebar: '#1e1b4b', // Dark indigo/purple
        bgHeader: 'rgba(255, 255, 255, 0.8)',

        // Text colors
        textPrimary: '#1e293b',
        textSecondary: '#475569',
        textMuted: '#64748b',
        textOnPrimary: '#ffffff',

        // Border colors
        borderColor: 'rgba(0, 0, 0, 0.08)',
        borderLight: 'rgba(255, 255, 255, 0.2)',

        // Status colors
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',

        // Dark mode colors override
        darkColors: {
            bgMain: '#0f172a',
            bgCard: 'rgba(30, 41, 59, 0.8)',
            bgSidebar: '#020617',
            bgHeader: 'rgba(15, 23, 42, 0.8)',
            textPrimary: '#f8fafc',
            textSecondary: '#cbd5e1',
            textMuted: '#94a3b8'
        }
    },

    // Typography
    typography: {
        fontFamily: "'Inter', sans-serif",
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
        borderRadius: '16px',
        borderRadiusLg: '20px',
        borderRadiusPill: '9999px',
        shadowSm: '0 2px 8px rgba(139, 92, 246, 0.05)',
        shadowMd: '0 4px 20px rgba(139, 92, 246, 0.08)',
        shadowLg: '0 10px 40px rgba(139, 92, 246, 0.12)'
    },

    // Components
    components: {
        button: {
            height: '42px',
            heightLg: '50px',
            paddingX: '24px',
            borderRadius: '12px'
        },
        input: {
            height: '42px',
            heightLg: '50px',
            borderRadius: '12px',
            borderWidth: '1px'
        },
        menu: {
            itemHeight: '46px',
            itemPaddingX: '16px',
            itemBorderRadius: '12px'
        }
    },

    // Sidebar specific
    sidebar: {
        background: '#2e1065', // Deep purple
        textColor: '#a78bfa',
        textColorActive: '#ffffff',
        itemHoverBg: 'rgba(255, 255, 255, 0.1)',
        itemActiveBg: 'rgba(255, 255, 255, 0.15)'
    },

    // Effects
    effects: {
        glassBlur: 'blur(16px)',
        glassBg: 'rgba(255, 255, 255, 0.85)',
        transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }
};

export default royalAmethystTemplate;
