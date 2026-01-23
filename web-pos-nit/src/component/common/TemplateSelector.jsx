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
        isDarkMode
    } = useSettings();

    const [visible, setVisible] = useState(false);

    const handleTemplateSelect = (templateId) => {
        applyTemplate(templateId);
    };

    return (
        <>
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
                                    // Use variable to ensure visibility in dark mode since card bg depends on theme
                                }}
                                styles={{ body: { padding: '12px' } }}
                                cover={
                                    <div style={{
                                        height: 80,
                                        background: template.preview?.backgroundColor || '#f0f0f0',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        borderTopLeftRadius: '8px',
                                        borderTopRightRadius: '8px'
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
                                            background: 'rgba(255,255,255,0.6)',
                                            borderRadius: 4
                                        }} />
                                        <div style={{
                                            position: 'absolute',
                                            left: 60, top: 35,
                                            width: 40, height: 8,
                                            background: 'rgba(255,255,255,0.4)',
                                            borderRadius: 4
                                        }} />
                                    </div>
                                }
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text strong style={{ fontSize: '13px' }}>{template.name}</Text>
                                    {settings.templateId === template.id && <CheckOutlined style={{ color: 'var(--primary-color)' }} />}
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Modal>
        </>
    );
};

export default TemplateSelector;
