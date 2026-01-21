/**
 * Settings Context - Global settings and theme management
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { templates, getTemplate, templateList } from './templates';

const SettingsContext = createContext();

// Default settings
const defaultSettings = {
    templateId: 'modern',
    darkMode: false,
    language: 'km',
    fontSize: 'medium', // small, medium, large
    sidebarCollapsed: false,
    animations: true,
    compactTables: false
};

/**
 * Font size multipliers based on user preference
 */
const FONT_SIZE_MULTIPLIERS = {
    small: 0.875,   // 87.5% of base
    medium: 1.0,    // 100% of base (default)
    large: 1.125    // 112.5% of base
};

/**
 * Calculate scaled font size
 */
const scaleFontSize = (baseSize, multiplier) => {
    const numericValue = parseFloat(baseSize);
    const unit = baseSize.replace(numericValue.toString(), '');
    return `${(numericValue * multiplier).toFixed(2)}${unit}`;
};

/**
 * Apply template CSS variables to document root
 */
const applyTemplateCSS = (template, isDarkMode, fontSize = 'medium') => {
    const root = document.documentElement;

    // Colors
    root.style.setProperty('--primary-color', template.colors.primary);
    root.style.setProperty('--primary-hover', template.colors.primaryHover);
    root.style.setProperty('--primary-light', template.colors.primaryLight);
    root.style.setProperty('--secondary-color', template.colors.secondary);
    root.style.setProperty('--accent-color', template.colors.accent);

    // Background colors (adjust for dark mode)
    if (isDarkMode) {
        root.style.setProperty('--bg-main', '#0f172a');
        root.style.setProperty('--bg-card', 'rgba(30, 41, 59, 0.8)');
        root.style.setProperty('--bg-sidebar', 'rgba(17, 24, 39, 0.9)');
        root.style.setProperty('--bg-header', 'rgba(17, 24, 39, 0.8)');
        root.style.setProperty('--text-primary', '#f1f5f9');
        root.style.setProperty('--text-secondary', '#cbd5e1');
        root.style.setProperty('--text-muted', '#94a3b8');
        root.style.setProperty('--border-color', 'rgba(255, 255, 255, 0.1)');
    } else {
        root.style.setProperty('--bg-main', template.colors.bgMain);
        root.style.setProperty('--bg-card', template.colors.bgCard);
        root.style.setProperty('--bg-sidebar', template.colors.bgSidebar);
        root.style.setProperty('--bg-header', template.colors.bgHeader);
        root.style.setProperty('--text-primary', template.colors.textPrimary);
        root.style.setProperty('--text-secondary', template.colors.textSecondary);
        root.style.setProperty('--text-muted', template.colors.textMuted);
        root.style.setProperty('--border-color', template.colors.borderColor);
    }

    root.style.setProperty('--text-on-primary', template.colors.textOnPrimary);
    root.style.setProperty('--border-light', template.colors.borderLight);

    // Status colors
    root.style.setProperty('--color-success', template.colors.success);
    root.style.setProperty('--color-warning', template.colors.warning);
    root.style.setProperty('--color-error', template.colors.error);
    root.style.setProperty('--color-info', template.colors.info);

    // Typography - Apply font size scaling based on user preference
    const multiplier = FONT_SIZE_MULTIPLIERS[fontSize] || 1.0;
    root.style.setProperty('--font-family', template.typography.fontFamily);
    root.style.setProperty('--font-size-base', scaleFontSize(template.typography.fontSizeBase, multiplier));
    root.style.setProperty('--font-size-sm', scaleFontSize(template.typography.fontSizeSm, multiplier));
    root.style.setProperty('--font-size-lg', scaleFontSize(template.typography.fontSizeLg, multiplier));
    root.style.setProperty('--font-size-xl', scaleFontSize(template.typography.fontSizeXl, multiplier));
    root.style.setProperty('--font-size-title', scaleFontSize(template.typography.fontSizeTitle, multiplier));
    root.style.setProperty('--font-weight-normal', template.typography.fontWeightNormal);
    root.style.setProperty('--font-weight-medium', template.typography.fontWeightMedium);
    root.style.setProperty('--font-weight-bold', template.typography.fontWeightBold);

    // Apply font size to body element
    document.body.style.fontSize = scaleFontSize(template.typography.fontSizeBase, multiplier);

    // Layout
    root.style.setProperty('--sidebar-width', template.layout.sidebarWidth);
    root.style.setProperty('--sidebar-collapsed-width', template.layout.sidebarCollapsedWidth);
    root.style.setProperty('--header-height', template.layout.headerHeight);
    root.style.setProperty('--content-padding', template.layout.contentPadding);
    root.style.setProperty('--card-padding', template.layout.cardPadding);

    // Border radius
    root.style.setProperty('--border-radius', template.layout.borderRadius);
    root.style.setProperty('--border-radius-lg', template.layout.borderRadiusLg);
    root.style.setProperty('--border-radius-pill', template.layout.borderRadiusPill);

    // Shadows
    root.style.setProperty('--shadow-sm', template.layout.shadowSm);
    root.style.setProperty('--shadow-md', template.layout.shadowMd);
    root.style.setProperty('--shadow-lg', template.layout.shadowLg);

    // Component sizes
    root.style.setProperty('--button-height', template.components.button.height);
    root.style.setProperty('--button-height-lg', template.components.button.heightLg);
    root.style.setProperty('--input-height', template.components.input.height);
    root.style.setProperty('--input-height-lg', template.components.input.heightLg);
    root.style.setProperty('--menu-item-height', template.components.menu.itemHeight);

    // Effects
    root.style.setProperty('--glass-blur', template.effects.glassBlur);
    root.style.setProperty('--glass-bg', template.effects.glassBg);
    root.style.setProperty('--transition-speed', template.effects.transition);

    // Sidebar specific
    root.style.setProperty('--sidebar-bg', isDarkMode ? template.sidebar.background : template.sidebar.background);
    root.style.setProperty('--sidebar-text', template.sidebar.textColor);
    root.style.setProperty('--sidebar-text-active', template.sidebar.textColorActive);
    root.style.setProperty('--sidebar-item-hover', template.sidebar.itemHoverBg);
    root.style.setProperty('--sidebar-item-active', template.sidebar.itemActiveBg);
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within SettingsProvider');
    }
    return context;
};

export const SettingsProvider = ({ children }) => {
    // Load initial settings from localStorage
    const [settings, setSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('appSettings');
            if (saved) {
                return { ...defaultSettings, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.error('Error loading settings:', e);
        }
        return defaultSettings;
    });

    // Get current template
    const currentTemplate = getTemplate(settings.templateId);

    // Apply template when settings change
    useEffect(() => {
        const template = getTemplate(settings.templateId);
        applyTemplateCSS(template, settings.darkMode, settings.fontSize);

        // Apply dark mode class
        if (settings.darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // Save to localStorage
        localStorage.setItem('appSettings', JSON.stringify(settings));
    }, [settings]);

    // Apply template
    const applyTemplate = useCallback((templateId) => {
        if (templates[templateId]) {
            setSettings(prev => ({ ...prev, templateId }));
        }
    }, []);

    // Update individual setting
    const updateSetting = useCallback((key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    }, []);

    // Toggle dark mode
    const toggleDarkMode = useCallback(() => {
        setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }));
    }, []);

    // Reset to default
    const resetSettings = useCallback(() => {
        setSettings(defaultSettings);
        localStorage.removeItem('appSettings');
    }, []);

    const value = {
        settings,
        currentTemplate,
        templates: templateList,
        applyTemplate,
        updateSetting,
        toggleDarkMode,
        resetSettings,
        isDarkMode: settings.darkMode
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

export default SettingsContext;
