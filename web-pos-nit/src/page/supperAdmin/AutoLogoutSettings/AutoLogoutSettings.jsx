// components/admin/AutoLogoutSettings.jsx

import React, { useState, useEffect } from 'react';
import { Form, InputNumber, Button, Card, message, Switch } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { request } from '../../util/helper';

function AutoLogoutSettings() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await request('config/auto-logout', 'get');
      if (res.success) {
        form.setFieldsValue({
          timeout_minutes: res.timeout_minutes
        });
      }
    } catch (error) {
      message.error('Failed to load configuration');
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const res = await request('config/auto-logout', 'put', values);
      
      if (res.success) {
        message.success(res.message_kh || res.message);
      } else {
        message.error('Failed to update');
      }
    } catch (error) {
      message.error('Error updating configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      title={
        <span>
          <ClockCircleOutlined /> Auto-Logout Configuration
        </span>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          timeout_minutes: 30
        }}
      >
        <Form.Item
          label="Inactivity Timeout (Minutes)"
          name="timeout_minutes"
          rules={[
            { required: true, message: 'Please enter timeout' },
            { type: 'number', min: 5, max: 1440, message: 'Must be between 5 and 1440 minutes' }
          ]}
          extra="Users will be automatically logged out after this many minutes of inactivity"
        >
          <InputNumber 
            min={5} 
            max={1440}
            style={{ width: 200 }}
            addonAfter="minutes"
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Save Configuration
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

export default AutoLogoutSettings;