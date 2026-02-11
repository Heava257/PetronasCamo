/**
 * Settings Context - Global settings and theme management
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ConfigProvider, theme } from 'antd';
import { templates, getTemplate, templateList } from './templates';
import { Config } from '../util/config';

const SettingsContext = createContext();

// Default settings
const defaultSettings = {
    templateId: 'modern',
    darkMode: false,
    language: 'km',
    fontSize: 'medium', // small, medium, large
    sidebarCollapsed: false,
    animations: true,
    compactTables: false,
    faceLogin: false,
    passwordComplexity: 'standard', // standard, high
    menuItemTemplate: 'tree' // modern, classic, tree
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

    // Fetch system settings from API
    useEffect(() => {
        const fetchSystemSettings = async () => {
            try {
                // We use the helper directly if available or fetch
                // Assuming request helper is available globally or we import it. 
                // Since this is a context file, let's use standard fetch or import request if we can see where it lives.
                // Looking at other files, request is in ../util/helper.
                // But I can't easily import it here if I don't see the file structure fully or if it has deps.
                // Let's rely on simple fetch for now or try to find where request helper is.
                // Index.js showed `export { request } from ...` maybe? No.
                // LogingPage.jsx imports request from "../../util/helper". Let's try that.

                // For now, I will use a simple fetch to avoid circular dependency issues if helper uses context.
                const response = await fetch(`${Config.base_url}settings`); // Use env var in real app
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data) {
                        setSettings(prev => ({
                            ...prev,
                            faceLogin: data.data.face_login_enabled === 'true',
                            passwordComplexity: data.data.password_complexity || 'standard'
                        }));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch system settings:", error);
            }
        };

        fetchSystemSettings();

        // One-time migration to 'tree' style for the user who requested it
        if (localStorage.getItem('menu_style_migrated') !== 'true') {
            setSettings(prev => ({ ...prev, menuItemTemplate: 'tree' }));
            localStorage.setItem('menu_style_migrated', 'true');
        }
    }, []);

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

        // Apply Menu Item Template Class
        document.documentElement.classList.remove(
            'menu-style-modern',
            'menu-style-classic',
            'menu-style-minimal',
            'menu-style-rounded',
            'menu-style-glass',
            'menu-style-neon',
            'menu-style-tree'
        );
        document.documentElement.classList.add(`menu-style-${settings.menuItemTemplate}`);

        // Apply Global Template Class (Critical for Modals/Portals)
        // Remove known template classes first (or all starting with template-)
        const allClasses = Array.from(document.documentElement.classList);
        const templateClasses = allClasses.filter(c => c.startsWith('template-'));
        document.documentElement.classList.remove(...templateClasses);

        // Add current template class
        document.documentElement.classList.add(`template-${settings.templateId}`);

        // Custom CSS Injection for Templates (e.g., Animations)
        const customStyleId = 'template-custom-css';
        let styleTag = document.getElementById(customStyleId);

        if (template.customCss) {
            if (!styleTag) {
                styleTag = document.createElement('style');
                styleTag.id = customStyleId;
                document.head.appendChild(styleTag);
            }
            styleTag.textContent = template.customCss;
        } else if (styleTag) {
            styleTag.remove();
        }

        // Save local preferences to localStorage
        const localPrefs = {
            templateId: settings.templateId,
            darkMode: settings.darkMode,
            language: settings.language,
            fontSize: settings.fontSize,
            sidebarCollapsed: settings.sidebarCollapsed,
            animations: settings.animations,
            compactTables: settings.compactTables,
            menuItemTemplate: settings.menuItemTemplate
        };
        localStorage.setItem('appSettings', JSON.stringify(localPrefs));
    }, [settings]);

    // Apply template
    const applyTemplate = useCallback((templateId) => {
        if (templates[templateId]) {
            setSettings(prev => ({ ...prev, templateId }));
        }
    }, []);

    // Update individual setting
    const updateSetting = useCallback(async (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));

        // If it's a system setting, save to API
        if (key === 'faceLogin' || key === 'passwordComplexity') {
            try {
                const apiValue = key === 'faceLogin' ? String(value) : value;
                const apiKey = key === 'faceLogin' ? 'face_login_enabled' : 'password_complexity';

                // We need authentication for updates. 
                // Assuming we have a token in localStorage.
                const token = localStorage.getItem('access_token');

                await fetch(`${Config.base_url}settings`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ key: apiKey, value: apiValue })
                });
            } catch (err) {
                console.error("Failed to save system setting:", err);
            }
        }
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

    // Resolve active colors for Ant Design Tokens (Dynamic calculation)
    const activeColors = settings.darkMode
        ? (currentTemplate.darkColors ? { ...currentTemplate.colors, ...currentTemplate.darkColors } : { ...currentTemplate.colors, bgCard: '#1e293b', bgMain: '#0f172a', textPrimary: '#ffffff' })
        : currentTemplate.colors;

    const isTransparentCard = activeColors.bgCard.includes('rgba') || activeColors.bgCard === 'transparent';

    // Automatically use Dark Algorithm if the template's primary text is white (implies dark theme)
    const shouldUseDarkAlgorithm = settings.darkMode || activeColors.textPrimary === '#ffffff';

    return (
        <SettingsContext.Provider value={value}>
            <ConfigProvider
                theme={{
                    algorithm: shouldUseDarkAlgorithm ? theme.darkAlgorithm : theme.defaultAlgorithm,
                    token: {
                        colorPrimary: activeColors.primary,
                        fontFamily: currentTemplate?.typography?.fontFamily,
                        borderRadius: parseInt(currentTemplate?.layout?.borderRadius) || 6,

                        // Critical for Glassmorphism
                        colorBgContainer: activeColors.bgCard,
                        colorBgElevated: activeColors.bgCard,
                        colorBgLayout: 'transparent', // Allow background image to show

                        // Text colors
                        colorText: activeColors.textPrimary,
                        colorTextHeading: activeColors.textPrimary,
                        colorTextSecondary: activeColors.textSecondary,
                        colorTextPlaceholder: (settings.darkMode || isTransparentCard) ? 'rgba(255, 255, 255, 0.45)' : '#94a3b8',
                        colorTextLabel: activeColors.textPrimary,
                        colorBorder: activeColors.borderColor,
                    },
                    components: {
                        Card: {
                            colorBgContainer: activeColors.bgCard, // Explicit override for Card
                        },
                        Table: {
                            colorBgContainer: activeColors.bgCard, // Explicit override for Table
                            colorFillAlter: isTransparentCard ? 'rgba(255,255,255,0.05)' : activeColors.bgCard, // Semi-transparent hover/stripe
                            colorTextHeading: activeColors.textPrimary,
                        },
                        Modal: {
                            contentBg: activeColors.bgCard,
                            headerBg: 'transparent',
                        },
                        Input: {
                            colorBgContainer: isTransparentCard ? 'rgba(0, 0, 0, 0.2)' : activeColors.bgCard,
                            activeBg: isTransparentCard ? 'rgba(0, 0, 0, 0.4)' : undefined,
                            colorText: activeColors.textPrimary,
                            colorTextPlaceholder: (settings.darkMode || isTransparentCard) ? 'rgba(255, 255, 255, 0.45)' : '#94a3b8',
                            colorBorder: activeColors.borderColor
                        },
                        Select: {
                            colorBgContainer: isTransparentCard ? 'rgba(0, 0, 0, 0.2)' : activeColors.bgCard,
                            colorText: activeColors.textPrimary,
                            optionSelectedBg: activeColors.primaryLight,
                            colorBorder: activeColors.borderColor,
                            colorTextPlaceholder: (settings.darkMode || isTransparentCard) ? 'rgba(255, 255, 255, 0.45)' : '#94a3b8'
                        },
                        Form: {
                            labelColor: activeColors.textPrimary
                        }
                    }
                }}
            >
                {children}
            </ConfigProvider>
        </SettingsContext.Provider>
    );
};

export default SettingsContext;
