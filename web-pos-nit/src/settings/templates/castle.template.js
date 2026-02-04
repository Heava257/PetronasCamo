/**
 * Castle Template
 * Clean, minimal white UI with strong typography and subtle blue accents
 */
export const castleTemplate = {
    id: 'castle',
    name: 'Castle Dashboard',
    description: 'Minimal white UI with serif typography accents',
    preview: {
        primaryColor: '#2563eb', // Blue-600
        backgroundColor: '#f1f5f9', // Slate-100
        cardColor: '#ffffff'
    },

    // Colors
    colors: {
        primary: '#2563eb',
        primaryHover: '#1d4ed8',
        primaryLight: 'rgba(37, 99, 235, 0.05)',
        secondary: '#64748b',
        accent: '#0f172a', // Dark Slate (simulating black)

        // Background colors
        bgMain: '#f8fafc', // Very light slate
        bgCard: '#ffffff',
        bgSidebar: '#ffffff',
        bgHeader: '#ffffff',

        // Text colors
        textPrimary: '#1e293b',
        textSecondary: '#64748b',
        textMuted: '#94a3b8',
        textOnPrimary: '#ffffff',

        // Border colors
        borderColor: '#e2e8f0',
        borderLight: '#f1f5f9',

        // Status colors
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
    },

    // Typography
    typography: {
        fontFamily: "'DM Sans', 'Inter', sans-serif",
        headingFontFamily: "'Playfair Display', serif", // The unique feature
        fontSizeBase: '14px',
        fontSizeSm: '13px',
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
        sidebarWidth: '260px',
        sidebarCollapsedWidth: '80px',
        headerHeight: '70px',
        contentPadding: '32px',
        cardPadding: '24px',

        // Border radius
        borderRadius: '16px',
        borderRadiusLg: '24px',
        borderRadiusPill: '8px', // Slightly squared off pills compared to others

        // Shadows
        shadowSm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
        shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)'
    },

    // Components
    components: {
        // Button styles
        button: {
            height: '40px',
            heightLg: '48px',
            paddingX: '20px',
            borderRadius: '10px' // Rounded squares
        },

        // Input styles
        input: {
            height: '40px',
            heightLg: '48px',
            borderRadius: '10px',
            borderWidth: '1px'
        },

        // Card styles
        card: {
            borderRadius: '20px',
            shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
            padding: '24px'
        },

        // Table styles
        table: {
            headerBg: '#f8fafc',
            rowHoverBg: '#f1f5f9',
            borderRadius: '12px'
        },

        // Menu styles
        menu: {
            itemHeight: '44px',
            itemPaddingX: '16px',
            itemBorderRadius: '8px'
        }
    },

    // Sidebar specific
    sidebar: {
        background: '#ffffff',
        textColor: '#64748b',
        textColorActive: '#2563eb',
        itemHoverBg: '#f8fafc',
        itemActiveBg: '#eff6ff'
    },

    // Effects
    effects: {
        glassBlur: 'none',
        glassBg: 'transparent',
        transition: '0.2s ease-out'
    }
};

export default castleTemplate;
