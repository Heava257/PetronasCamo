import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, Select, Space, DatePicker, message } from 'antd';
import {
  MdLocalShipping,
  MdCheckCircle,
  MdAccessTime,
  MdWarning,
  MdMap,
  MdPhone,
  MdRefresh
} from 'react-icons/md';
import { useTranslation } from '../../locales/TranslationContext';
import { request } from '../../util/helper';
import DeliveryTrackingModal from './DeliveryTrackingModal';
import moment from 'moment';

const DeliveryDashboard = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});
  const [todayDeliveries, setTodayDeliveries] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [selectedPeriod, filterStatus]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load stats
      const statsRes = await request(`orders/delivery-stats?period=${selectedPeriod}`, 'get');
      if (statsRes && statsRes.success) {
        setStats(statsRes.stats || {});
      }

      // Load today's deliveries
      const deliveriesRes = await request(
        `orders/delivery-today${filterStatus ? `?status=${filterStatus}` : ''}`,
        'get'
      );
      if (deliveriesRes && deliveriesRes.success) {
        setTodayDeliveries(deliveriesRes.deliveries || []);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      message.error(t('failed_to_load_data'));
    } finally {
      setLoading(false);
    }
  };

  const handleViewTracking = (orderId) => {
    setSelectedOrderId(orderId);
    setTrackingModalVisible(true);
  };

  const handleNavigate = (latitude, longitude) => {
    if (latitude && longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      window.open(url, '_blank');
    } else {
      message.warning(t('no_location_data'));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'blue',
      in_transit: 'orange',
      delivered: 'green',
      cancelled: 'red'
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: t('order_no'),
      dataIndex: 'order_no',
      key: 'order_no',
      width: 120,
      render: (text) => <span className="font-semibold">{text}</span>
    },
    {
      title: t('customer'),
      key: 'customer',
      width: 180,
      render: (_, record) => (
        <div>
          <div>{record.customer_name}</div>
          {record.customer_phone && (
            <a href={`tel:${record.customer_phone}`} className="text-xs text-blue-600">
              <MdPhone className="inline mr-1" />
              {record.customer_phone}
            </a>
          )}
        </div>
      )
    },
    {
      title: t('delivery_location'),
      key: 'location',
      width: 200,
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.location_name || '-'}</div>
          <div className="text-xs text-gray-500">{record.delivery_address || '-'}</div>
        </div>
      )
    },
    {
      title: t('truck_driver'),
      key: 'truck',
      width: 150,
      render: (_, record) => (
        <div>
          <div className="text-sm">{record.plate_number || '-'}</div>
          {record.assigned_driver && (
            <div className="text-xs text-gray-600">{record.assigned_driver}</div>
          )}
        </div>
      )
    },
    {
      title: t('status'),
      dataIndex: 'delivery_status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {t(status)}
        </Tag>
      )
    },
    {
      title: t('delivery_time'),
      dataIndex: 'delivery_date',
      key: 'delivery_date',
      width: 150,
      render: (date) => moment(date).format('HH:mm')
    },
    {
      title: t('amount'),
      dataIndex: 'total_amount',
      key: 'amount',
      width: 100,
      align: 'right',
      render: (amount) => `$${parseFloat(amount).toLocaleString()}`
    },
    {
      title: t('actions'),
      key: 'actions',
      width: 150,
      align: 'center',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<MdMap />}
            onClick={() => handleViewTracking(record.id)}
          >
            {t('track')}
          </Button>
          {record.latitude && record.longitude && (
            <Button
              size="small"
              type="primary"
              icon={<MdMap />}
              onClick={() => handleNavigate(record.latitude, record.longitude)}
            >
              {t('navigate')}
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="delivery-dashboard p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">{t('delivery_dashboard')}</h1>
          <p className="text-gray-500">{t('real_time_delivery_monitoring')}</p>
        </div>
        <Space>
          <Select
            value={selectedPeriod}
            onChange={setSelectedPeriod}
            style={{ width: 150 }}
          >
            <Select.Option value="today">{t('today')}</Select.Option>
            <Select.Option value="week">{t('this_week')}</Select.Option>
            <Select.Option value="month">{t('this_month')}</Select.Option>
            <Select.Option value="year">{t('this_year')}</Select.Option>
          </Select>
          <Button
            icon={<MdRefresh />}
            onClick={loadData}
            loading={loading}
          >
            {t('refresh')}
          </Button>
        </Space>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('total_orders')}
              value={stats.total_orders || 0}
              prefix={<MdLocalShipping className="text-blue-500" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('pending')}
              value={stats.pending_orders || 0}
              prefix={<MdAccessTime className="text-orange-500" />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('in_transit')}
              value={stats.in_transit_orders || 0}
              prefix={<MdLocalShipping className="text-purple-500" />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('delivered')}
              value={stats.delivered_orders || 0}
              prefix={<MdCheckCircle className="text-green-500" />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Performance Metrics */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} lg={12}>
          <Card title={t('financial_summary')}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title={t('total_amount')}
                  value={stats.total_amount || 0}
                  prefix="$"
                  precision={2}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={t('delivered_amount')}
                  value={stats.delivered_amount || 0}
                  prefix="$"
                  precision={2}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={t('performance')}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title={t('completion_rate')}
                  value={stats.delivery_completion_rate || 0}
                  suffix="%"
                  precision={1}
                  valueStyle={{ 
                    color: (stats.delivery_completion_rate || 0) >= 80 ? '#52c41a' : '#fa8c16' 
                  }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={t('active_trucks')}
                  value={stats.active_trucks || 0}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Today's Deliveries */}
      <Card
        title={
          <div className="flex justify-between items-center">
            <span>{t('todays_deliveries')}</span>
            <Select
              placeholder={t('filter_by_status')}
              style={{ width: 150 }}
              allowClear
              value={filterStatus}
              onChange={setFilterStatus}
            >
              <Select.Option value="pending">{t('pending')}</Select.Option>
              <Select.Option value="in_transit">{t('in_transit')}</Select.Option>
              <Select.Option value="delivered">{t('delivered')}</Select.Option>
              <Select.Option value="cancelled">{t('cancelled')}</Select.Option>
            </Select>
          </div>
        }
      >
        <Table
          dataSource={todayDeliveries}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `${t('total')} ${total} ${t('deliveries')}`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Tracking Modal */}
      <DeliveryTrackingModal
        visible={trackingModalVisible}
        orderId={selectedOrderId}
        onClose={() => {
          setTrackingModalVisible(false);
          setSelectedOrderId(null);
        }}
      />
    </div>
  );
};

export default DeliveryDashboard;