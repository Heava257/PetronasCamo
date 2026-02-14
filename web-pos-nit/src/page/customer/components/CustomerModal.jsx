
import React from 'react';
import { Form, Input, Button, Modal, Row, Col, Select, Typography, DatePicker, message, Upload } from 'antd';
import {
    UserOutlined,
    PhoneOutlined,
    MailOutlined,
    EnvironmentOutlined,
    IdcardOutlined,
    TeamOutlined,
    LinkOutlined,
    PlusOutlined
} from '@ant-design/icons';
import { useSettings } from '../../../settings';


const { Title } = Typography;

const CustomerModal = ({
    visible,
    onCancel,
    onFinish,
    form,
    t,
    isEditing,
    phoneValidationRules
}) => {
    const { isDarkMode } = useSettings();

    return (
        <Modal
            open={visible}
            {...isDarkMode && {
                style: { '--label-color': '#e2e8f0', '--input-color': '#ffffff' }
            }}

            title={
                <div className={`flex items-center gap-2 border-b pb-3 mb-4 ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                    <UserOutlined className={`${isDarkMode ? 'text-blue-400 bg-blue-900/50' : 'text-blue-500 bg-blue-50'} text-lg p-2 rounded-full`} />
                    <span className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{isEditing ? t("edit_customer") : t("create_customer")}</span>
                </div>
            }

            onCancel={onCancel}
            onOk={() => form.submit()}
            width={800}
            centered
            className="customer-modal"
            okText={isEditing ? t("update") : t("create")}
            cancelText={t("cancel")}
            okButtonProps={{
                className: isEditing ? 'bg-orange-500 hover:bg-orange-600 border-orange-500' : 'bg-blue-500 hover:bg-blue-600 border-blue-500',
                size: 'large'
            }}
            cancelButtonProps={{ size: 'large' }}
            maskClosable={false}
        >
            {isDarkMode && (
                <style dangerouslySetInnerHTML={{
                    __html: `
                    .customer-modal .ant-form-item-label > label {
                        color: #f1f5f9 !important;
                        font-weight: 500 !important;
                        font-size: 14px !important;
                    }
                    .customer-modal .ant-input, 
                    .customer-modal .ant-select-selector,
                    .customer-modal .ant-picker,
                    .customer-modal .ant-input-number {
                        color: #ffffff !important;
                    }
                    .customer-modal .ant-select-selection-item {
                        color: #ffffff !important;
                    }
                ` }} />
            )}
            <Form
                form={form}

                layout="vertical"
                onFinish={onFinish}
                initialValues={{ type: 'regular', gender: 'Male' }}
                className="pt-2"
            >
                {/* Personal Information Section */}
                <div className={`p-4 rounded-xl border mb-6 relative ${isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-gray-50/50 border-gray-100'}`}>
                    <div className={`absolute -top-3 left-4 px-2 text-xs font-bold uppercase tracking-wide border rounded-full shadow-sm ${isDarkMode
                        ? 'bg-slate-800 text-blue-400 border-blue-900'
                        : 'bg-white text-blue-500 border-blue-100'
                        }`}>
                        {t('personal_info')}
                    </div>


                    <Row gutter={[24, 16]}>
                        <Col span={24} md={12}>
                            <Form.Item
                                label={t("customer_name")}
                                name="name"
                                rules={[{ required: true, message: t("required") }]}
                            >
                                <Input prefix={<UserOutlined className="text-gray-400" />} placeholder={t("enter_name")} size="large" />
                            </Form.Item>
                        </Col>

                        <Col span={24} md={12}>
                            <Form.Item
                                label={t("code")}
                                name="code"
                            >
                                <Input prefix={<span className="text-gray-400 font-bold text-[10px] mr-1">#</span>} placeholder={t("auto_generate")} size="large" />
                            </Form.Item>
                        </Col>

                        <Col span={12} md={8}>
                            <Form.Item label={t("gender")} name="gender">
                                <Select size="large">
                                    <Select.Option value="Male">{t("male")}</Select.Option>
                                    <Select.Option value="Female">{t("female")}</Select.Option>
                                    <Select.Option value="Other">{t("other")}</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col span={12} md={8}>
                            <Form.Item label={t("customer_type")} name="type">
                                <Select size="large">
                                    <Select.Option value="regular">{t("regular")}</Select.Option>
                                    <Select.Option value="special">{t("vip")}</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col span={24} md={8}>
                            <Form.Item label={t("dob")} name="dob">
                                <DatePicker className="w-full" size="large" format="YYYY-MM-DD" />
                            </Form.Item>
                        </Col>
                    </Row>
                </div>

                {/* Contact Information Section */}
                <div className={`p-4 rounded-xl border mb-6 relative ${isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-gray-50/70 border-gray-100'}`}>
                    <div className={`absolute -top-3 left-4 px-2 text-xs font-bold uppercase tracking-wide border rounded-full shadow-sm ${isDarkMode
                        ? 'bg-slate-800 text-green-400 border-green-900'
                        : 'bg-white text-green-500 border-green-100'
                        }`}>
                        {t('contact_details')}
                    </div>


                    <Row gutter={[24, 16]}>
                        <Col span={24} md={12}>
                            <Form.Item
                                label={t("phone_number")}
                                name="tel"
                                rules={phoneValidationRules}
                            >
                                <Input prefix={<PhoneOutlined className="text-gray-400" />} placeholder="012 345 678" size="large" />
                            </Form.Item>
                        </Col>

                        <Col span={24} md={12}>
                            <Form.Item
                                label={t("email")}
                                name="email"
                                rules={[{ type: 'email', message: t("invalid_email") }]}
                            >
                                <Input prefix={<MailOutlined className="text-gray-400" />} placeholder="email@example.com" size="large" />
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item label={t("address")} name="address">
                                <Input.TextArea
                                    rows={2}
                                    className="resize-none"
                                    placeholder={t("enter_full_address")}
                                    showCount
                                    maxLength={200}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={24} md={12}>
                            <Form.Item label={t("website")} name="website">
                                <Input prefix={<LinkOutlined className="text-gray-400" />} placeholder="https://example.com" />
                            </Form.Item>
                        </Col>
                        <Col span={24} md={12}>
                            <Form.Item label={t("facebook_link")} name="facebook">
                                <Input prefix={<span className="text-blue-600 font-bold text-xs mr-1">f</span>} placeholder="Facebook Profile URL" />
                            </Form.Item>
                        </Col>
                    </Row>
                </div>

                {/* Confirming Person / Additional Info */}
                <div className={`p-4 rounded-xl border relative ${isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-gray-50/30 border-gray-100'}`}>
                    <div className={`absolute -top-3 left-4 px-2 text-xs font-bold uppercase tracking-wide border rounded-full shadow-sm ${isDarkMode
                        ? 'bg-slate-800 text-purple-400 border-purple-900'
                        : 'bg-white text-purple-500 border-purple-100'
                        }`}>
                        {t('additional_details')}
                    </div>


                    <Row gutter={[24, 16]}>
                        <Col span={24} md={8}>
                            <Form.Item label={t("id_card_number")} name="id_card_number">
                                <Input prefix={<IdcardOutlined className="text-gray-400" />} placeholder="ID Number" />
                            </Form.Item>
                        </Col>

                        <Col span={24} md={8}>
                            <Form.Item label={t("spouse_name")} name="spouse_name">
                                <Input prefix={<TeamOutlined className="text-gray-400" />} placeholder="Spouse Name" />
                            </Form.Item>
                        </Col>

                        <Col span={24} md={8}>
                            <Form.Item label={t("guarantor_name")} name="guarantor_name">
                                <Input prefix={<UserOutlined className="text-gray-400" />} placeholder="Guarantor Name" />
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item label={t("note")} name="description">
                                <Input.TextArea rows={2} placeholder="Internal notes about customer..." />
                            </Form.Item>
                        </Col>
                    </Row>
                </div>
            </Form>
        </Modal>
    );
};

export default CustomerModal;
