
import React from "react";
import { Modal, Form, Input, Select, Row, Col, TimePicker, Checkbox, Divider, Button, Space } from "antd";

const EmployeeModal = ({
    visible,
    onCancel,
    onFinish,
    form,
    t,
    id
}) => {
    return (
        <Modal
            open={visible}
            title={id ? t('edit_employee') : t('new_employee')}
            footer={null}
            onCancel={onCancel}
            width={800}
            maskClosable={false}
        >
            <Form
                layout="vertical"
                onFinish={onFinish}
                form={form}
            >
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="name" label={t('name')} rules={[{ required: true, message: t('required') }]}>
                            <Input placeholder={t('name')} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="gender" label={t('gender')} rules={[{ required: true, message: t('required') }]}>
                            <Select
                                placeholder={t('gender')}
                                options={[{ label: 'Male', value: 'Male' }, { label: 'Female', value: 'Female' }]}
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="position" label={t('position')} rules={[{ required: true, message: t('required') }]}>
                            <Input placeholder={t('position')} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="salary" label={t('salary')} rules={[{ required: true, message: t('required') }]}>
                            <Input type="number" prefix="$" placeholder={t('salary')} />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="tel" label={t('telephone')} rules={[{ required: true, message: t('required') }]}>
                            <Input placeholder={t('telephone')} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="email" label={t('email')} rules={[{ type: 'email', message: t('invalid_email') }]}>
                            <Input placeholder={t('email')} />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="code" label={t('code')}>
                            <Input placeholder={t('code')} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="is_active" label={t('status')} initialValue={1}>
                            <Select options={[{ label: t('active'), value: 1 }, { label: t('inactive'), value: 0 }]} />
                        </Form.Item>
                    </Col>
                </Row>

                <Divider orientation="left" style={{ margin: '12px 0' }}>{t('work_schedule')}</Divider>

                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item name="work_type" label={t('work_type')} initialValue="full-time">
                            <Select options={[{ label: 'Full Time', value: 'full-time' }, { label: 'Part Time', value: 'part-time' }]} />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="work_start_time" label={t('start_time')}>
                            <TimePicker format="HH:mm" style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="work_end_time" label={t('end_time')}>
                            <TimePicker format="HH:mm" style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={24}>
                        <Form.Item name="working_days" label={t('working_days')}>
                            <Checkbox.Group options={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']} />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="grace_period_minutes" label={t('grace_period_minutes')} initialValue={30}>
                            <Input type="number" suffix="minutes" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="website" label={t('website')}>
                            <Input placeholder="Website/Portfolio" />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item name="address" label={t('address')}>
                    <Input.TextArea rows={2} placeholder={t('address')} />
                </Form.Item>

                <Form.Item name="note" label={t('note')}>
                    <Input.TextArea rows={2} placeholder={t('note')} />
                </Form.Item>

                <div style={{ textAlign: 'right', marginTop: 16 }}>
                    <Space>
                        <Button onClick={onCancel}>{t('cancel')}</Button>
                        <Button type="primary" htmlType="submit" className="bg-primary">{t('save')}</Button>
                    </Space>
                </div>
            </Form>
        </Modal>
    );
};

export default EmployeeModal;
