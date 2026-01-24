/**
 * Settings Context - Global settings and theme management
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ConfigProvider, theme } from 'antd';
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

    // Initialize with template defaults
    let activeColors = { ...template.colors };
    let activeSidebar = { ...template.sidebar };

    if (isDarkMode) {
        if (template.darkColors) {
            activeColors = { ...activeColors, ...template.darkColors };
        } else {
            // Default dark mode overrides if template doesn't specify darkColors
            activeColors = {
                ...activeColors,
                bgMain: '#0f172a',
                bgCard: 'rgba(30, 41, 59, 0.8)',
                bgSidebar: 'rgba(17, 24, 39, 0.9)',
                bgHeader: 'rgba(17, 24, 39, 0.8)',
                textPrimary: '#f1f5f9',
                textSecondary: '#cbd5e1',
                textMuted: '#94a3b8',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderLight: 'rgba(255, 255, 255, 0.05)'
            };

            // Default dark mode sidebar overrides
            activeSidebar = {
                ...activeSidebar,
                background: 'rgba(17, 24, 39, 0.9)',
                textColor: '#cbd5e1'
            };
        }
    }

    // Colors
    root.style.setProperty('--primary-color', activeColors.primary);
    root.style.setProperty('--primary-hover', activeColors.primaryHover);
    root.style.setProperty('--primary-light', activeColors.primaryLight);
    root.style.setProperty('--secondary-color', activeColors.secondary);
    root.style.setProperty('--accent-color', activeColors.accent);

    // Backgrounds & Text
    root.style.setProperty('--bg-main', activeColors.bgMain);
    root.style.setProperty('--bg-card', activeColors.bgCard);
    root.style.setProperty('--bg-sidebar', activeColors.bgSidebar);
    root.style.setProperty('--bg-header', activeColors.bgHeader);
    root.style.setProperty('--text-primary', activeColors.textPrimary);
    root.style.setProperty('--text-secondary', activeColors.textSecondary);
    root.style.setProperty('--text-muted', activeColors.textMuted);
    root.style.setProperty('--border-color', activeColors.borderColor);

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
    root.style.setProperty('--sidebar-bg', activeSidebar.background);
    root.style.setProperty('--sidebar-text', activeSidebar.textColor);
    root.style.setProperty('--sidebar-text-active', activeSidebar.textColorActive);
    root.style.setProperty('--sidebar-item-hover', activeSidebar.itemHoverBg);
    root.style.setProperty('--sidebar-item-active', activeSidebar.itemActiveBg);
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
            <ConfigProvider
                theme={{
                    algorithm: settings.darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
                    token: {
                        colorPrimary: currentTemplate?.colors?.primary,
                        fontFamily: currentTemplate?.typography?.fontFamily,
                        borderRadius: parseInt(currentTemplate?.layout?.borderRadius) || 6,
                    }
                }}
            >
                {children}
            </ConfigProvider>
        </SettingsContext.Provider>
    );
};

export default SettingsContext;
