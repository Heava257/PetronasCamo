import React, { useState } from 'react';
import { Modal, Card, Row, Col, Typography, Button, Switch, Tooltip, Divider } from 'antd';
import { useSettings } from '../../settings';
import { CheckOutlined, BgColorsOutlined, BulbOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const TemplateSelector = ({ isMobile }) => {
    const {
        settings,
        templates,
        currentTemplate,
        applyTemplate,
        toggleDarkMode,
        updateSetting,
        isDarkMode
    } = useSettings();

    const [visible, setVisible] = useState(false);

    const themeStyles = `
        .dark .theme-settings-modal .ant-modal-content,
        .dark .theme-settings-modal .ant-modal-header {
            background-color: #0f172a !important;
            background: rgba(15, 23, 42, 0.98) !important;
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }

        .dark .theme-settings-modal .ant-modal-title,
        .dark .theme-settings-modal .ant-typography,
        .dark .theme-settings-modal h5,
        .dark .theme-settings-modal .ant-modal-close {
            color: #f8fafc !important;
        }

        .dark .theme-settings-modal .ant-typography-secondary {
            color: #94a3b8 !important;
        }

        .dark .theme-settings-modal .ant-divider {
            border-top-color: rgba(255, 255, 255, 0.1) !important;
        }

        .dark .theme-settings-modal .ant-card {
            background: rgba(30, 41, 59, 0.6) !important;
            border-color: rgba(255, 255, 255, 0.1) !important;
            backdrop-filter: blur(8px);
        }

        .dark .theme-settings-modal .ant-card-body {
             background: transparent !important;
             color: #f8fafc !important;
        }

        .dark .theme-settings-modal .ant-card-body .ant-typography {
             color: #f8fafc !important;
        }

        .dark .theme-settings-modal .ant-card:hover {
            border-color: var(--primary-color) !important;
            box-shadow: 0 0 15px rgba(59, 130, 246, 0.3) !important;
        }

        .dark .theme-settings-modal .ant-btn {
            background: rgba(255, 255, 255, 0.05) !important;
            border-color: rgba(255, 255, 255, 0.1) !important;
            color: #f8fafc !important;
        }
        
        .dark .theme-settings-modal .ant-btn:hover {
            border-color: var(--primary-color) !important;
            color: var(--primary-color) !important;
        }

        /* Fix for white line in card footer area */
        .dark .theme-settings-modal .ant-card-actions {
            background: rgba(30, 41, 59, 0.8) !important;
            border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
    `;

    const handleTemplateSelect = (templateId) => {
        applyTemplate(templateId);
    };

    return (
        <>
            <style>{themeStyles}</style>
            <div
                className={`header-icon glass-pill ${visible ? "active" : ""}`}
                onClick={() => setVisible(true)}
                title="Theme Settings"
            >
                <BgColorsOutlined />
                {!isMobile && <span className="pill-label">Theme</span>}
            </div>

            <Modal
                title="Theme Settings"
                open={visible}
                onCancel={() => setVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setVisible(false)}>
                        Close
                    </Button>
                ]}
                width={700}
                className="theme-settings-modal"
            >
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Title level={5} style={{ margin: 0 }}>Dark Mode</Title>
                        <Switch
                            checked={isDarkMode}
                            onChange={toggleDarkMode}
                            checkedChildren={<BulbOutlined />}
                            unCheckedChildren={<BulbOutlined />}
                        />
                    </div>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                        Switch between light and dark versions of the selected template.
                    </Text>
                </div>

                <Divider />

                <Title level={5} style={{ marginBottom: 16 }}>Select Template</Title>
                <Row gutter={[16, 16]}>
                    {templates.map(template => (
                        <Col span={12} md={8} key={template.id}>
                            <Card
                                hoverable
                                onClick={() => handleTemplateSelect(template.id)}
                                style={{
                                    border: settings.templateId === template.id ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                                    height: '100%',
                                    background: isDarkMode ? 'rgba(30, 41, 59, 0.6)' : '#ffffff',
                                    overflow: 'hidden'
                                }}
                                styles={{ body: { padding: '12px', background: 'transparent' } }}
                                cover={
                                    <div style={{
                                        height: 80,
                                        background: template.preview?.backgroundColor || '#f0f0f0',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        borderTopLeftRadius: '8px',
                                        borderTopRightRadius: '8px',
                                        borderBottom: '1px solid rgba(0,0,0,0.05)'
                                    }}>
                                        {/* Simple abstract preview */}
                                        <div style={{
                                            position: 'absolute',
                                            left: 10, top: 10,
                                            width: 40, height: 40,
                                            background: template.preview?.cardColor || '#ffffff',
                                            borderRadius: 4,
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }} />
                                        <div style={{
                                            position: 'absolute',
                                            left: 60, top: 20,
                                            width: 60, height: 8,
                                            background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.6)',
                                            borderRadius: 4
                                        }} />
                                        <div style={{
                                            position: 'absolute',
                                            left: 60, top: 35,
                                            width: 40, height: 8,
                                            background: isDarkMode ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.4)',
                                            borderRadius: 4
                                        }} />
                                    </div>
                                }
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text strong style={{
                                        fontSize: '13px',
                                        color: isDarkMode ? '#f8fafc' : 'inherit'
                                    }}>
                                        {template.name}
                                    </Text>
                                    {settings.templateId === template.id && (
                                        <CheckOutlined style={{ color: 'var(--primary-color)', fontSize: '14px', fontWeight: 'bold' }} />
                                    )}
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>

                <Divider />

                <Title level={5} style={{ marginBottom: 16 }}>Menu Style</Title>
                <Row gutter={[8, 8]}>
                    {[
                        { id: 'modern', name: 'Modern' },
                        { id: 'classic', name: 'Classic' },
                        { id: 'tree', name: 'Diagram (Tree)' }
                    ].map(style => (
                        <Col span={8} key={style.id}>
                            <Button
                                block
                                type={settings.menuItemTemplate === style.id ? 'primary' : 'default'}
                                onClick={() => updateSetting('menuItemTemplate', style.id)}
                                style={{
                                    height: 'auto',
                                    padding: '8px 4px',
                                    fontSize: '12px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 4
                                }}
                            >
                                {style.name}
                                {settings.menuItemTemplate === style.id && <CheckOutlined />}
                            </Button>
                        </Col>
                    ))}
                </Row>

            </Modal>
        </>
    );
};

export default TemplateSelector;
