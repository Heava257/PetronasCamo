import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Modal, Form, Input, Switch, Space,
  Tag, Alert, Tooltip, Row, Col
} from 'antd';
import Swal from 'sweetalert2';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined
} from '@ant-design/icons';
import { request } from '../../util/helper';
import MainPage from '../../component/layout/MainPage';

function IPManagementPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [ipList, setIpList] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingIp, setEditingIp] = useState(null);
  const [currentIp, setCurrentIp] = useState('');

  useEffect(() => {
    getIpList();
    getCurrentIp();
  }, []);

  const getCurrentIp = async () => {
    try {
      const res = await request('attendance/get-my-ip', 'get');
      if (res && !res.error) {
        setCurrentIp(res.ip);
      }
    } catch (error) {
      console.error('Failed to get current IP:', error);
    }
  };

  const getIpList = async () => {
    setLoading(true);
    try {
      const res = await request('attendance/allowed-ips', 'get');
      if (res && !res.error) {
        setIpList(res.ips || []);
      }
    } catch (error) {
      console.error('Failed to get IP list:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      const data = {
        ...values,
        is_active: values.is_active ? 1 : 0
      };

      if (editingIp) {
        data.id = editingIp.id;
      }

      const res = await request(
        'attendance/allowed-ips',
        editingIp ? 'put' : 'post',
        data
      );

      if (res && !res.error) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: res.message,
          showConfirmButton: false,
          timer: 1500
        });
        setModalVisible(false);
        form.resetFields();
        setEditingIp(null);
        getIpList();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: res.message || 'Failed to save IP',
        });
      }
    } catch (error) {
      console.error('Save IP error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to save IP',
      });
    }
  };

  const handleEdit = (record) => {
    setEditingIp(record);
    form.setFieldsValue({
      ip_address: record.ip_address,
      description: record.description,
      is_active: record.is_active === 1
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Are you sure to delete this IP?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await request('attendance/allowed-ips', 'delete', { id });
          if (res && !res.error) {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: res.message,
              showConfirmButton: false,
              timer: 1500
            });
            getIpList();
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: res.message || 'Failed to delete IP',
            });
          }
        } catch (error) {
          console.error('Delete IP error:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to delete IP',
          });
        }
      }
    });
  };

  const addCurrentIp = async () => {
    if (!currentIp) {
      Swal.fire({
        icon: 'warning',
        title: 'Warning',
        text: 'Cannot detect current IP address',
      });
      return;
    }

    // Check if IP already exists
    const exists = ipList.find(ip => ip.ip_address === currentIp);
    if (exists) {
      Swal.fire({
        icon: 'warning',
        title: 'Warning',
        text: 'Your IP is already in the list',
      });
      return;
    }

    try {
      const res = await request('attendance/allowed-ips', 'post', {
        ip_address: currentIp,
        description: 'Added from current device',
        is_active: 1
      });

      if (res && !res.error) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Your IP has been added successfully!',
          showConfirmButton: false,
          timer: 1500
        });
        getIpList();
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to add your IP',
      });
    }
  };

  const columns = [
    {
      title: 'IP Address',
      dataIndex: 'ip_address',
      key: 'ip_address',
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          {currentIp === text && (
            <Tag color="blue" size="small">Current</Tag>
          )}
        </div>
      )
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active) => (
        <Tag color={active === 1 ? 'green' : 'red'} icon={active === 1 ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {active === 1 ? 'Active' : 'Inactive'}
        </Tag>
      )
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      )
    }
  ];

  return (
    <MainPage loading={loading}>
      <Card
        title="Allowed IP Address Management"
        extra={
          <Space>
            {currentIp && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={addCurrentIp}
              >
                Add My IP ({currentIp})
              </Button>
            )}
            <Button
              icon={<ReloadOutlined />}
              onClick={getIpList}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingIp(null);
                form.resetFields();
                setModalVisible(true);
              }}
            >
              Add New IP
            </Button>
          </Space>
        }
      >
        {/* Current IP Status */}
        {currentIp && (
          <Alert
            message={`Your Current IP: ${currentIp}`}
            description={
              <div>
                <div className="mt-1">
                  Status:{' '}
                  {ipList.find(ip => ip.ip_address === currentIp && ip.is_active === 1) ? (
                    <Tag color="success">Allowed</Tag>
                  ) : (
                    <Tag color="error">Not Allowed</Tag>
                  )}
                </div>
                <Button
                  type="link"
                  size="small"
                  onClick={addCurrentIp}
                  className="mt-2 p-0"
                >
                  Click here to add your IP to allowed list
                </Button>
              </div>
            }
            type={ipList.find(ip => ip.ip_address === currentIp && ip.is_active === 1) ? 'success' : 'warning'}
            showIcon
            className="mb-4"
          />
        )}

        {/* IP Range Warning */}
        <Alert
          message="⚠️ Note About Dynamic IPs"
          description={
            <div>
              <p>If you're using mobile data or home WiFi, your IP might change frequently. Consider:</p>
              <ul className="list-disc pl-4 mt-1">
                <li>Adding your current IP using the button above</li>
                <li>Using IP ranges (e.g., 172.20.10.*) if supported</li>
                <li>Setting up VPN for static IP</li>
                <li>Contacting IT department for office network setup</li>
              </ul>
            </div>
          }
          type="info"
          className="mb-4"
        />

        <Table
          dataSource={ipList}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Add/Edit IP Modal */}
      <Modal
        title={editingIp ? 'Edit IP Address' : 'Add New IP Address'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingIp(null);
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            is_active: true
          }}
        >
          <Form.Item
            name="ip_address"
            label="IP Address"
            rules={[
              { required: true, message: 'Please enter IP address' },
              {
                pattern: /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
                message: 'Please enter valid IP address (e.g., 192.168.1.1)'
              }
            ]}
          >
            <Input placeholder="e.g., 192.168.1.100" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input placeholder="e.g., Office Main Network, Home WiFi, etc." />
          </Form.Item>

          <Form.Item
            name="is_active"
            label="Status"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="Active"
              unCheckedChildren="Inactive"
            />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => {
              setModalVisible(false);
              form.resetFields();
              setEditingIp(null);
            }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingIp ? 'Update' : 'Add'}
            </Button>
          </div>
        </Form>
      </Modal>
    </MainPage>
  );
}

export default IPManagementPage;