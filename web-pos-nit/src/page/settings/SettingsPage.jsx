import React, { useState } from 'react';
import { Card, Row, Col, Switch, Button, Radio, Divider, message, Tag, Space } from 'antd';
import {
    CheckCircleFilled,
    ReloadOutlined,
    BgColorsOutlined,
    LayoutOutlined,
    FontSizeOutlined,
    SettingOutlined,
    LockOutlined
} from '@ant-design/icons';
import MainPage from '../../component/layout/MainPage';
import { useSettings } from '../../settings';
import './SettingsPage.css';

function SettingsPage() {
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
        message.success(`Applied ${templateId} template`);
    };

    const handleReset = () => {
        resetSettings();
        message.info('Settings reset to default');
    };

    return (
        <MainPage>
            <div className="settings-page">
                {/* Header */}
                <Card className="settings-header-card">
                    <div className="settings-header">
                        <div className="settings-header-icon">
                            <SettingOutlined />
                        </div>
                        <div className="settings-header-text">
                            <h1>Settings</h1>
                            <p>Customize your application experience</p>
                        </div>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={handleReset}
                            className="reset-button"
                        >
                            Reset to Default
                        </Button>
                    </div>
                </Card>

                {/* Template Selection */}
                <Card className="settings-section">
                    <div className="section-header">
                        <BgColorsOutlined className="section-icon" />
                        <div>
                            <h2>UI Template</h2>
                            <p>Choose a pre-built template for your interface</p>
                        </div>
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
                                            <div className="preview-menu-item" style={{
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
                                            <span>{template.name}</span>
                                            {settings.templateId === template.id && (
                                                <Tag color="blue" icon={<CheckCircleFilled />}>Active</Tag>
                                            )}
                                        </div>
                                        <p className="template-description">{template.description}</p>

                                        {/* Color Preview */}
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
                </Card>

                {/* Appearance Settings */}
                <Card className="settings-section">
                    <div className="section-header">
                        <LayoutOutlined className="section-icon" />
                        <div>
                            <h2>Appearance</h2>
                            <p>Adjust visual preferences</p>
                        </div>
                    </div>

                    <div className="settings-list">
                        <div className="setting-item">
                            <div className="setting-info">
                                <span className="setting-label">Dark Mode</span>
                                <span className="setting-description">Switch between light and dark theme</span>
                            </div>
                            <Switch
                                checked={isDarkMode}
                                onChange={toggleDarkMode}
                                checkedChildren="Dark"
                                unCheckedChildren="Light"
                            />
                        </div>

                        <Divider />

                        <div className="setting-item">
                            <div className="setting-info">
                                <span className="setting-label">Animations</span>
                                <span className="setting-description">Enable smooth transitions and effects</span>
                            </div>
                            <Switch
                                checked={settings.animations}
                                onChange={(checked) => updateSetting('animations', checked)}
                            />
                        </div>

                        <Divider />

                        <div className="setting-item">
                            <div className="setting-info">
                                <span className="setting-label">Compact Tables</span>
                                <span className="setting-description">Use denser table layouts</span>
                            </div>
                            <Switch
                                checked={settings.compactTables}
                                onChange={(checked) => updateSetting('compactTables', checked)}
                            />
                        </div>
                    </div>
                </Card>

                {/* Security Settings */}
                {/* Security Settings */}
                <Card className="settings-section">
                    <div className="section-header">
                        <LockOutlined className="section-icon" />
                        <div>
                            <h2>Security</h2>
                            <p>Manage login and password security</p>
                        </div>
                    </div>

                    <div className="settings-list">
                        <div className="setting-item">
                            <div className="setting-info">
                                <span className="setting-label">Face Login</span>
                                <span className="setting-description">Enable facial recognition for login</span>
                            </div>
                            <Switch
                                checked={settings.faceLogin}
                                onChange={(checked) => {
                                    updateSetting('faceLogin', checked);
                                    message.success(checked ? 'Face Login Enabled' : 'Face Login Disabled');
                                }}
                            />
                        </div>

                        <Divider />

                        <div className="setting-item">
                            <div className="setting-info">
                                <span className="setting-label">Password Complexity</span>
                                <span className="setting-description">Set requirements for user passwords</span>
                            </div>
                            <Radio.Group
                                value={settings.passwordComplexity}
                                onChange={(e) => {
                                    updateSetting('passwordComplexity', e.target.value);
                                    message.success(`Password Policy set to ${e.target.value === 'high' ? 'Strong' : 'Standard'}`);
                                }}
                            >
                                <Radio.Button value="standard">Standard</Radio.Button>
                                <Radio.Button value="high">High (Strong)</Radio.Button>
                            </Radio.Group>
                        </div>
                    </div>
                </Card>

                {/* Font Size */}
                <Card className="settings-section">
                    <div className="section-header">
                        <FontSizeOutlined className="section-icon" />
                        <div>
                            <h2>Font Size</h2>
                            <p>Adjust text size for better readability</p>
                        </div>
                    </div>

                    <Radio.Group
                        value={settings.fontSize}
                        onChange={(e) => updateSetting('fontSize', e.target.value)}
                        className="font-size-options"
                    >
                        <Radio.Button value="small">Small</Radio.Button>
                        <Radio.Button value="medium">Medium</Radio.Button>
                        <Radio.Button value="large">Large</Radio.Button>
                    </Radio.Group>
                </Card>

                {/* Current Template Info */}
                <Card className="settings-section template-info-card">
                    <div className="current-template-info">
                        <h3>Current Template: <span style={{ color: currentTemplate.colors.primary }}>{currentTemplate.name}</span></h3>
                        <p>{currentTemplate.description}</p>
                        <div className="template-specs">
                            <Tag>Sidebar: {currentTemplate.layout.sidebarWidth}</Tag>
                            <Tag>Border Radius: {currentTemplate.layout.borderRadius}</Tag>
                            <Tag>Header: {currentTemplate.layout.headerHeight}</Tag>
                        </div>
                    </div>
                </Card>
            </div >
        </MainPage >
    );
}

export default SettingsPage;
