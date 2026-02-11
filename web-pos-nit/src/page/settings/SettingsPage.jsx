import React, { useState } from 'react';
import { Card, Row, Col, Switch, Button, Radio, Divider, Tag, Space, Tabs } from 'antd';
import Swal from 'sweetalert2';
import {
    CheckCircleFilled,
    ReloadOutlined,
    BgColorsOutlined,
    LayoutOutlined,
    FontSizeOutlined,
    SettingOutlined,
    LockOutlined,
    EyeOutlined,
    ThunderboltOutlined,
    GlobalOutlined,
    MenuOutlined
} from '@ant-design/icons';
import MainPage from '../../component/layout/MainPage';
import { useTranslation } from 'react-i18next';
import { useTranslation as useCustomTranslation } from "../../locales/TranslationContext.jsx";
import { useSettings } from '../../settings';
import './SettingsPage.css';

function SettingsPage() {
    const { t, i18n } = useTranslation();
    const { changeLanguage: changeCustomLanguage } = useCustomTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        changeCustomLanguage(lng);
        localStorage.setItem('language', lng);
    };
    const {
        settings,
        currentTemplate,
        templates,
        applyTemplate,
        updateSetting,
        toggleDarkMode,
        resetSettings,
        isDarkMode
    } = useSettings();

    const handleTemplateChange = (templateId) => {
        applyTemplate(templateId);
        Swal.fire({
            icon: 'success',
            title: 'Template Applied',
            text: `Applied ${templateId} template successfully!`,
            timer: 1500,
            showConfirmButton: false
        });
    };

    const handleReset = () => {
        resetSettings();
        Swal.fire({
            icon: 'info',
            title: 'Settings Reset',
            text: 'Settings reset to default',
            timer: 1500,
            showConfirmButton: false
        });
    };

    // Tab items for better organization
    const tabItems = [
        {
            key: 'templates',
            label: (
                <span>
                    <BgColorsOutlined />
                    Templates
                </span>
            ),
            children: (
                <div className="settings-tab-content">
                    <div className="tab-header">
                        <h2>UI Templates</h2>
                        <p>Choose a pre-built template for your interface. Each template includes colors, fonts, and layout styles.</p>
                    </div>

                    <Row gutter={[24, 24]} className="template-grid">
                        {templates.map((template) => (
                            <Col xs={24} sm={12} lg={8} key={template.id}>
                                <div
                                    className={`template-card ${settings.templateId === template.id ? 'active' : ''}`}
                                    onClick={() => handleTemplateChange(template.id)}
                                >
                                    {/* Template Preview */}
                                    <div className="template-preview" style={{
                                        background: template.preview.backgroundColor
                                    }}>
                                        <div className="preview-sidebar" style={{
                                            background: template.sidebar.background
                                        }}>
                                            <div className="preview-menu-item active" style={{
                                                background: template.colors.primary
                                            }} />
                                            <div className="preview-menu-item" />
                                            <div className="preview-menu-item" />
                                        </div>
                                        <div className="preview-content">
                                            <div className="preview-header" style={{
                                                background: template.colors.bgHeader,
                                                borderRadius: template.layout.borderRadius
                                            }} />
                                            <div className="preview-card" style={{
                                                background: template.preview.cardColor,
                                                borderRadius: template.layout.borderRadius
                                            }}>
                                                <div className="preview-text-line" />
                                                <div className="preview-text-line short" />
                                                <div className="preview-button" style={{
                                                    background: template.colors.primary,
                                                    borderRadius: template.components.button.borderRadius
                                                }} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Template Info */}
                                    <div className="template-info">
                                        <div className="template-name">
                                            <h3>{template.name}</h3>
                                            {settings.templateId === template.id && (
                                                <Tag color="success" icon={<CheckCircleFilled />}>Active</Tag>
                                            )}
                                        </div>
                                        <p className="template-description">{template.description}</p>

                                        {/* Color Preview */}
                                        <div className="color-preview">
                                            <span className="color-label">Colors:</span>
                                            <div className="color-dots">
                                                <span
                                                    className="color-dot"
                                                    style={{ background: template.colors.primary }}
                                                    title="Primary"
                                                />
                                                <span
                                                    className="color-dot"
                                                    style={{ background: template.colors.secondary }}
                                                    title="Secondary"
                                                />
                                                <span
                                                    className="color-dot"
                                                    style={{ background: template.sidebar.background }}
                                                    title="Sidebar"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Selection Indicator */}
                                    {settings.templateId === template.id && (
                                        <div className="template-selected-badge">
                                            <CheckCircleFilled />
                                        </div>
                                    )}
                                </div>
                            </Col>
                        ))}
                    </Row>
                </div>
            )
        },
        {
            key: 'appearance',
            label: (
                <span>
                    <EyeOutlined />
                    Appearance
                </span>
            ),
            children: (
                <div className="settings-tab-content">
                    <div className="tab-header">
                        <h2>Appearance Settings</h2>
                        <p>Customize the visual experience of your application</p>
                    </div>

                    <Row gutter={[24, 24]}>
                        <Col xs={24} lg={12}>
                            <Card className="setting-card">
                                <div className="setting-card-header">
                                    <LayoutOutlined className="setting-icon" />
                                    <h3>Theme Mode</h3>
                                </div>
                                <div className="setting-item">
                                    <div className="setting-info">
                                        <span className="setting-label">Dark Mode</span>
                                        <span className="setting-description">Switch between light and dark theme</span>
                                    </div>
                                    <Switch
                                        checked={isDarkMode}
                                        onChange={toggleDarkMode}
                                        checkedChildren="🌙"
                                        unCheckedChildren="☀️"
                                        size="large"
                                    />
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} lg={12}>
                            <Card className="setting-card">
                                <div className="setting-card-header">
                                    <FontSizeOutlined className="setting-icon" />
                                    <h3>Font Size</h3>
                                </div>
                                <div className="setting-item">
                                    <div className="setting-info">
                                        <span className="setting-label">Text Size</span>
                                        <span className="setting-description">Adjust text size for better readability</span>
                                    </div>
                                    <Radio.Group
                                        value={settings.fontSize}
                                        onChange={(e) => updateSetting('fontSize', e.target.value)}
                                        buttonStyle="solid"
                                    >
                                        <Radio.Button value="small">Small</Radio.Button>
                                        <Radio.Button value="medium">Medium</Radio.Button>
                                        <Radio.Button value="large">Large</Radio.Button>
                                    </Radio.Group>
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} lg={12}>
                            <Card className="setting-card">
                                <div className="setting-card-header">
                                    <ThunderboltOutlined className="setting-icon" />
                                    <h3>Animations</h3>
                                </div>
                                <div className="setting-item">
                                    <div className="setting-info">
                                        <span className="setting-label">Enable Animations</span>
                                        <span className="setting-description">Smooth transitions and effects</span>
                                    </div>
                                    <Switch
                                        checked={settings.animations}
                                        onChange={(checked) => updateSetting('animations', checked)}
                                        size="large"
                                    />
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} lg={12}>
                            <Card className="setting-card">
                                <div className="setting-card-header">
                                    <LayoutOutlined className="setting-icon" />
                                    <h3>Table Layout</h3>
                                </div>
                                <div className="setting-item">
                                    <div className="setting-info">
                                        <span className="setting-label">Compact Tables</span>
                                        <span className="setting-description">Use denser table layouts</span>
                                    </div>
                                    <Switch
                                        checked={settings.compactTables}
                                        onChange={(checked) => updateSetting('compactTables', checked)}
                                        size="large"
                                    />
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} lg={12}>
                            <Card className="setting-card">
                                <div className="setting-card-header">
                                    <GlobalOutlined className="setting-icon" />
                                    <h3>Language</h3>
                                </div>
                                <div className="setting-item">
                                    <div className="setting-info">
                                        <span className="setting-label">System Language</span>
                                        <span className="setting-description">Change the application's language layer</span>
                                    </div>
                                    <Radio.Group
                                        value={i18n.language}
                                        onChange={(e) => changeLanguage(e.target.value)}
                                        buttonStyle="solid"
                                    >
                                        <Radio.Button value="en">
                                            <span>🇬🇧 English</span>
                                        </Radio.Button>
                                        <Radio.Button value="km">
                                            <span>🇰🇭 ភាសាខ្មែរ</span>
                                        </Radio.Button>
                                    </Radio.Group>
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} lg={12}>
                            <Card className="setting-card">
                                <div className="setting-card-header">
                                    <MenuOutlined className="setting-icon" />
                                    <h3>Menu Item Style</h3>
                                </div>
                                <div className="setting-item">
                                    <div className="setting-info">
                                        <span className="setting-label">Item Appearance</span>
                                        <span className="setting-description">Select the style for sidebar menu items</span>
                                    </div>
                                    <Radio.Group
                                        value={settings.menuItemTemplate}
                                        onChange={(e) => updateSetting('menuItemTemplate', e.target.value)}
                                        buttonStyle="solid"
                                    >
                                        <Radio.Button value="modern">Modern (Clean)</Radio.Button>
                                        <Radio.Button value="classic">Boxed (Green)</Radio.Button>
                                        <Radio.Button value="minimal">Minimal</Radio.Button>
                                        <Radio.Button value="rounded">Rounded (Pill)</Radio.Button>
                                        <Radio.Button value="glass">Glass</Radio.Button>
                                        <Radio.Button value="neon">Neon</Radio.Button>
                                    </Radio.Group>
                                </div>
                            </Card>
                        </Col>
                    </Row>
                </div >
            )
        },
        {
            key: 'security',
            label: (
                <span>
                    <LockOutlined />
                    Security
                </span>
            ),
            children: (
                <div className="settings-tab-content">
                    <div className="tab-header">
                        <h2>Security Settings</h2>
                        <p>Manage login methods and password policies</p>
                    </div>

                    <Row gutter={[24, 24]}>
                        <Col xs={24} lg={12}>
                            <Card className="setting-card">
                                <div className="setting-card-header">
                                    <LockOutlined className="setting-icon" />
                                    <h3>Authentication</h3>
                                </div>
                                <div className="setting-item">
                                    <div className="setting-info">
                                        <span className="setting-label">Face Login</span>
                                        <span className="setting-description">Enable facial recognition for login</span>
                                    </div>
                                    <Switch
                                        checked={settings.faceLogin}
                                        onChange={(checked) => {
                                            updateSetting('faceLogin', checked);
                                            Swal.fire({
                                                icon: 'success',
                                                title: checked ? 'Face Login Enabled' : 'Face Login Disabled',
                                                timer: 1500,
                                                showConfirmButton: false
                                            });
                                        }}
                                        size="large"
                                    />
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} lg={12}>
                            <Card className="setting-card">
                                <div className="setting-card-header">
                                    <LockOutlined className="setting-icon" />
                                    <h3>Password Policy</h3>
                                </div>
                                <div className="setting-item">
                                    <div className="setting-info">
                                        <span className="setting-label">Password Complexity</span>
                                        <span className="setting-description">Set requirements for user passwords</span>
                                    </div>
                                    <Radio.Group
                                        value={settings.passwordComplexity}
                                        onChange={(e) => {
                                            updateSetting('passwordComplexity', e.target.value);
                                            Swal.fire({
                                                icon: 'success',
                                                title: 'Policy Updated',
                                                text: `Password Policy set to ${e.target.value === 'high' ? 'Strong' : 'Standard'}`,
                                                timer: 1500,
                                                showConfirmButton: false
                                            });
                                        }}
                                        buttonStyle="solid"
                                    >
                                        <Radio.Button value="standard">Standard</Radio.Button>
                                        <Radio.Button value="high">Strong</Radio.Button>
                                    </Radio.Group>
                                </div>
                            </Card>
                        </Col>
                    </Row>
                </div>
            )
        }
    ];

    return (
        <MainPage>
            <div className="settings-page">
                {/* Modern Header */}
                <div className="settings-page-header">
                    <div className="header-content">
                        <div className="header-icon">
                            <SettingOutlined />
                        </div>
                        <div className="header-text">
                            <h1>Settings</h1>
                            <p>Customize your application experience and preferences</p>
                        </div>
                    </div>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={handleReset}
                        size="large"
                        className="reset-button"
                    >
                        Reset to Default
                    </Button>
                </div>

                {/* Current Template Info Banner */}
                <Card className="current-template-banner">
                    <div className="banner-content">
                        <div className="banner-icon" style={{ background: currentTemplate.colors.primary }}>
                            <BgColorsOutlined />
                        </div>
                        <div className="banner-info">
                            <div className="banner-title">
                                <span>Active Template:</span>
                                <strong style={{ color: currentTemplate.colors.primary }}>
                                    {currentTemplate.name}
                                </strong>
                            </div>
                            <p className="banner-description">{currentTemplate.description}</p>
                        </div>
                        <div className="banner-specs">
                            <Tag color="blue">Sidebar: {currentTemplate.layout.sidebarWidth}</Tag>
                            <Tag color="green">Radius: {currentTemplate.layout.borderRadius}</Tag>
                            <Tag color="purple">Header: {currentTemplate.layout.headerHeight}</Tag>
                        </div>
                    </div>
                </Card>

                {/* Organized Tabs */}
                <Card className="settings-tabs-card">
                    <Tabs
                        defaultActiveKey="templates"
                        items={tabItems}
                        size="large"
                        type="card"
                    />
                </Card>
            </div>
        </MainPage>
    );
}

export default SettingsPage;