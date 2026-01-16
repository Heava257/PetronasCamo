import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Space,
  Tag,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CarOutlined,
  PhoneOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { useTranslation } from '../../../locales/TranslationContext';
import { request } from '../../../util/helper';

const TrucksManagement = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  
  const [state, setState] = useState({
    trucks: [],
    loading: false,
    modalVisible: false,
    editingTruck: null,
    statistics: {
      total: 0,
      active: 0,
      on_delivery: 0,
      maintenance: 0,
      inactive: 0
    }
  });

  useEffect(() => {
    loadTrucks();
  }, []);

  // ✅ Load all trucks
  const loadTrucks = async () => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const res = await request('trucks', 'get');
      
      if (res && res.list) {
        // Calculate statistics
        const stats = {
          total: res.list.length,
          active: res.list.filter(truck => truck.status === 'active').length,
          on_delivery: res.list.filter(truck => truck.status === 'on_delivery').length,
          maintenance: res.list.filter(truck => truck.status === 'maintenance').length,
          inactive: res.list.filter(truck => !truck.status || truck.status === 'inactive').length
        };
        
        setState(prev => ({
          ...prev,
          trucks: res.list,
          statistics: stats,
          loading: false
        }));
      }
    } catch (error) {
      console.error('Error loading trucks:', error);
      message.error(t('Failed to load trucks') || 'មិនអាចទាញបញ្ជីឡានបានទេ');
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  // ✅ Open modal for create/edit
  const openModal = (truck = null) => {
    if (truck) {
      // Editing
      form.setFieldsValue({
        ...truck,
        status: truck.status || 'active' // ✅ Set default if null
      });
      setState(prev => ({
        ...prev,
        modalVisible: true,
        editingTruck: truck
      }));
    } else {
      // Creating new
      form.resetFields();
      form.setFieldsValue({
        status: 'active', // ✅ Default to active
        fuel_type: 'diesel'
      });
      setState(prev => ({
        ...prev,
        modalVisible: true,
        editingTruck: null
      }));
    }
  };

  // ✅ Close modal
  const closeModal = () => {
    form.resetFields();
    setState(prev => ({
      ...prev,
      modalVisible: false,
      editingTruck: null
    }));
  };

  // ✅ Save truck (create or update)
  const saveTruck = async (values) => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const data = {
        ...values,
        status: values.status || 'active', // ✅ Ensure status is set
        capacity_liters: parseFloat(values.capacity_liters || 0),
        current_odo_reading: parseFloat(values.current_odo_reading || 0)
      };

      if (state.editingTruck) {
        // Update
        data.id = state.editingTruck.id;
        const res = await request('trucks', 'put', data);
        
        if (res && !res.error) {
          message.success(t('Truck updated successfully') || 'កែប្រែឡានបានជោគជ័យ');
          loadTrucks();
          closeModal();
        } else {
          message.error(res.message || t('Failed to update truck'));
        }
      } else {
        // Create
        const res = await request('trucks', 'post', data);
        
        if (res && !res.error) {
          message.success(t('Truck created successfully') || 'បង្កើតឡានបានជោគជ័យ');
          loadTrucks();
          closeModal();
        } else {
          message.error(res.message || t('Failed to create truck'));
        }
      }
    } catch (error) {
      console.error('Error saving truck:', error);
      message.error(t('An error occurred') || 'មានបញ្ហាកើតឡើង');
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  // ✅ Delete truck
  const deleteTruck = async (id) => {
    try {
      const res = await request('trucks', 'delete', { id });
      
      if (res && !res.error) {
        message.success(t('Truck deleted successfully') || 'លុបឡានបានជោគជ័យ');
        loadTrucks();
      } else {
        message.error(res.message || t('Failed to delete truck'));
      }
    } catch (error) {
      console.error('Error deleting truck:', error);
      message.error(t('Cannot delete truck with active deliveries') || 'មិនអាចលុបឡានដែលមានការដឹកជញ្ជូនសកម្ម');
    }
  };

  // Status badge
  const getStatusBadge = (status) => {
    const statusMap = {
      'active': {
        color: 'green',
        icon: <CheckCircleOutlined />,
        text: t('Active')
      },
      'on_delivery': {
        color: 'blue',
        icon: <CarOutlined />,
        text: t('On Delivery')
      },
      'maintenance': {
        color: 'orange',
        icon: <CarOutlined />,
        text: t('Maintenance')
      },
      'inactive': {
        color: 'red',
        icon: <CloseCircleOutlined />,
        text: t('Inactive')
      }
    };

    const statusInfo = statusMap[status] || statusMap['inactive'];
    
    return (
      <Tag color={statusInfo.color} icon={statusInfo.icon}>
        {statusInfo.text}
      </Tag>
    );
  };

  // ✅ Table columns
  const columns = [
    {
      title: t('Plate Number') || 'លេខផ្លាក',
      dataIndex: 'plate_number',
      key: 'plate_number',
      width: 120,
      render: (text) => (
        <span className="font-semibold text-blue-600">
          <CarOutlined className="mr-2" />
          {text}
        </span>
      )
    },
    {
      title: t('Truck Type') || 'ប្រភេទឡាន',
      dataIndex: 'truck_type',
      key: 'truck_type',
      width: 100
    },
    {
      title: t('Capacity') || 'ចំណុះ',
      dataIndex: 'capacity_liters',
      key: 'capacity_liters',
      width: 100,
      render: (text) => `${text || 0} L`
    },
    {
      title: t('Driver Name') || 'អ្នកបើកបរ',
      dataIndex: 'driver_name',
      key: 'driver_name',
      width: 150,
      render: (text, record) => (
        <div>
          <div>
            <UserOutlined className="mr-2" />
            {text || '-'}
          </div>
          {record.driver_phone && (
            <div className="text-xs text-gray-500">
              <PhoneOutlined className="mr-1" />
              {record.driver_phone}
            </div>
          )}
        </div>
      )
    },
    {
      title: t('Fuel Type') || 'ប្រភេទឥន្ធនៈ',
      dataIndex: 'fuel_type',
      key: 'fuel_type',
      width: 100,
      render: (text) => text || 'diesel'
    },
    {
      title: t('Status') || 'ស្ថានភាព',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => getStatusBadge(status)
    },
    {
      title: t('ODO Reading') || 'ODO',
      dataIndex: 'current_odo_reading',
      key: 'current_odo_reading',
      width: 100,
      render: (text) => `${text || 0} km`
    },
    {
      title: t('Actions') || 'សកម្មភាព',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('Edit') || 'កែប្រែ'}>
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openModal(record)}
            />
          </Tooltip>
          <Tooltip title={t('Delete') || 'លុប'}>
            <Popconfirm
              title={t('Delete this truck?') || 'លុបឡាននេះ?'}
              onConfirm={() => deleteTruck(record.id)}
              okText={t('Yes') || 'បាទ/ចាស'}
              cancelText={t('No') || 'ទេ'}
            >
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div className="p-4">
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={12} md={6} lg={4}>
          <Card>
            <Statistic
              title={t('Total Trucks') || 'ឡានសរុប'}
              value={state.statistics.total}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={4}>
          <Card>
            <Statistic
              title={t('Active') || 'សកម្ម'}
              value={state.statistics.active}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={4}>
          <Card>
            <Statistic
              title={t('On Delivery') || 'កំពុងដឹក'}
              value={state.statistics.on_delivery}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={4}>
          <Card>
            <Statistic
              title={t('Maintenance') || 'ជួសជុល'}
              value={state.statistics.maintenance}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={4}>
          <Card>
            <Statistic
              title={t('Inactive') || 'អសកម្ម'}
              value={state.statistics.inactive}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Table Card */}
      <Card
        title={
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">
              <CarOutlined className="mr-2" />
              {t('Trucks Management') || 'គ្រប់គ្រងឡាន'}
            </span>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openModal()}
            >
              {t('New Truck') || 'បង្កើតឡានថ្មី'}
            </Button>
          </div>
        }
      >
        <Table
          columns={columns}
          dataSource={state.trucks}
          rowKey="id"
          loading={state.loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `សរុប ${total} ឡាន`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={
          state.editingTruck
            ? t('Edit Truck') || 'កែប្រែឡាន'
            : t('Create New Truck') || 'បង្កើតឡានថ្មី'
        }
        open={state.modalVisible}
        onCancel={closeModal}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={saveTruck}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="plate_number"
                label={t('Plate Number') || 'លេខផ្លាក'}
                rules={[{ required: true, message: t('Please enter plate number') || 'សូមបញ្ចូលលេខផ្លាក' }]}
              >
                <Input placeholder="PP-1234" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="truck_type"
                label={t('Truck Type') || 'ប្រភេទឡាន'}
                rules={[{ required: true, message: t('Please select truck type') }]}
              >
                <Select placeholder={t('Select type')}>
                  <Select.Option value="tanker">Tanker</Select.Option>
                  <Select.Option value="medium">Medium</Select.Option>
                  <Select.Option value="small">Small</Select.Option>
                  <Select.Option value="pickup">Pickup</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="capacity_liters"
                label={t('Capacity (Liters)') || 'ចំណុះ (លីត្រ)'}
                rules={[{ required: true, message: t('Please enter capacity') }]}
              >
                <Input type="number" placeholder="10000" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="fuel_type"
                label={t('Fuel Type') || 'ប្រភេទឥន្ធនៈ'}
                rules={[{ required: true }]}
              >
                <Select placeholder={t('Select fuel type')}>
                  <Select.Option value="diesel">Diesel</Select.Option>
                  <Select.Option value="gasoline">Gasoline</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="driver_name"
                label={t('Driver Name') || 'ឈ្មោះអ្នកបើកបរ'}
              >
                <Input placeholder={t('Driver name')} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="driver_phone"
                label={t('Driver Phone') || 'លេខទូរស័ព្ទអ្នកបើកបរ'}
                rules={[
                  {
                    pattern: /^[0-9]{8,10}$/,
                    message: t('Please enter valid phone number')
                  }
                ]}
              >
                <Input placeholder="012345678" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="status"
                label={t('Status') || 'ស្ថានភាព'}
                rules={[{ required: true, message: t('Please select status') }]}
                initialValue="active"
              >
                <Select placeholder={t('Select status')}>
                  <Select.Option value="active">
                    <Tag color="green">សកម្ម (Active)</Tag>
                  </Select.Option>
                  <Select.Option value="on_delivery">
                    <Tag color="blue">កំពុងដឹក (On Delivery)</Tag>
                  </Select.Option>
                  <Select.Option value="maintenance">
                    <Tag color="orange">ជួសជុល (Maintenance)</Tag>
                  </Select.Option>
                  <Select.Option value="inactive">
                    <Tag color="red">អសកម្ម (Inactive)</Tag>
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="current_odo_reading"
                label={t('ODO Reading (km)') || 'ODO (គីឡូម៉ែត្រ)'}
              >
                <Input type="number" placeholder="0" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="notes"
                label={t('Notes') || 'ចំណាំ'}
              >
                <Input.TextArea rows={3} placeholder={t('Additional notes')} />
              </Form.Item>
            </Col>
          </Row>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={closeModal}>
              {t('Cancel') || 'បោះបង់'}
            </Button>
            <Button type="primary" htmlType="submit" loading={state.loading}>
              {state.editingTruck
                ? t('Update') || 'កែប្រែ'
                : t('Create') || 'បង្កើត'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default TrucksManagement;