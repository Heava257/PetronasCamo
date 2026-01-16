// OrderListWithMap.jsx - Full Implementation
import React, { useState, useEffect } from 'react';
import { Button, Table, Tag, Modal, Input, Select, Space, Tooltip, message } from 'antd';
import { MdMap, MdLocationOn, MdLocalShipping, MdPhone } from 'react-icons/md';
import { useTranslation } from '../../locales/TranslationContext';
import { request, formatDateClient } from '../../util/helper';
import DeliveryMapView from './DeliveryMapView';
import TruckAssignmentModal from './TruckAssignmentModal'; // ✅ Import
import MainPage from '../../component/layout/MainPage';

function OrderListWithMap() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  
  // ✅ NEW: Truck assignment states
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedOrderForAssignment, setSelectedOrderForAssignment] = useState(null);
  
  const [filter, setFilter] = useState({
    search: '',
    status: '',
  });

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await request('order/with-locations', 'get', filter);
      if (res && res.success) {
        setOrders(res.list || []);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      message.error(t('failed_to_load_orders'));
    } finally {
      setLoading(false);
    }
  };

  const handleViewMap = (order) => {
    if (!order.location_id) {
      message.warning(t('no_location_assigned'));
      return;
    }
    setSelectedOrder(order);
    setMapModalVisible(true);
  };

  const handleQuickNavigate = (order) => {
    if (!order.location_latitude || !order.location_longitude) {
      message.error(t('no_coordinates_available'));
      return;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${order.location_latitude},${order.location_longitude}`;
    window.open(url, '_blank');
  };

  // ✅ NEW: Truck assignment handler
  const handleAssignTruck = (order) => {
    setSelectedOrderForAssignment(order);
    setAssignModalVisible(true);
  };

  const columns = [
    {
      title: t('order_no'),
      dataIndex: 'order_no',
      key: 'order_no',
      width: 150,
      render: (text, record) => (
        <div>
          <div className="font-semibold">{text}</div>
          <div className="text-xs text-gray-500">
            {formatDateClient(record.order_date, 'DD/MM/YYYY')}
          </div>
        </div>
      ),
    },
    {
      title: t('customer'),
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: 200,
    },
    {
      title: t('location'),
      key: 'location',
      width: 250,
      render: (_, record) => {
        if (!record.location_name) {
          return <span className="text-gray-400">-</span>;
        }
        return (
          <div className="flex items-start gap-2">
            <MdLocationOn className="text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{record.location_name}</div>
              {record.location_address && (
                <div className="text-xs text-gray-500 truncate">
                  {record.location_address}
                </div>
              )}
              {record.location_latitude && record.location_longitude && (
                <div className="text-xs text-blue-600 mt-1">
                  📍 {Number(record.location_latitude).toFixed(4)}, {Number(record.location_longitude).toFixed(4)}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: t('truck'),
      key: 'truck',
      width: 220, // ✅ Increased width for button
      render: (_, record) => {
        if (!record.truck_plate_number) {
          return (
            <div className="flex items-center gap-2">
              <Tag color="red" className="m-0">{t('no_truck')}</Tag>
              <Button
                size="small"
                type="primary"
                onClick={() => handleAssignTruck(record)}
                style={{ fontSize: '12px' }}
              >
                {t('assign_truck')}
              </Button>
            </div>
          );
        }

        return (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MdLocalShipping className="text-green-500" />
              <div className="flex-1">
                <div className="font-medium">{record.truck_plate_number}</div>
                {record.truck_driver_name && (
                  <div className="text-xs text-gray-500">
                    {record.truck_driver_name}
                  </div>
                )}
              </div>
            </div>
            <Button
              size="small"
              onClick={() => handleAssignTruck(record)}
              style={{ fontSize: '11px', marginTop: '4px' }}
              block
            >
              🔄 {t('reassign')}
            </Button>
          </div>
        );
      },
    },
    {
      title: t('status'),
      dataIndex: 'delivery_status',
      key: 'delivery_status',
      width: 120,
      render: (status) => {
        const colors = {
          pending: 'blue',
          in_transit: 'orange',
          delivered: 'green',
          cancelled: 'red',
        };
        return <Tag color={colors[status] || 'default'}>{t(status)}</Tag>;
      },
    },
    {
      title: t('amount'),
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      align: 'right',
      render: (amount) => (
        <span className="font-semibold">
          ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: t('action'),
      key: 'action',
      width: 150,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('view_on_map')}>
            <Button
              type="primary"
              icon={<MdMap />}
              onClick={() => handleViewMap(record)}
              disabled={!record.location_id}
              size="small"
            />
          </Tooltip>

          {record.location_latitude && record.location_longitude && (
            <Tooltip title={t('navigate_now')}>
              <Button
                icon={<MdLocationOn />}
                onClick={() => handleQuickNavigate(record)}
                size="small"
                style={{ color: '#10b981' }}
              />
            </Tooltip>
          )}

          {record.truck_driver_phone && (
            <Tooltip title={t('call_driver')}>
              <Button
                icon={<MdPhone />}
                onClick={() => window.open(`tel:${record.truck_driver_phone}`)}
                size="small"
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <MainPage loading={loading}>
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-4">{t('delivery_orders')}</h1>

        <div className="flex gap-3 mb-4">
          <Input.Search
            placeholder={t('search_order')}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            onSearch={loadOrders}
            style={{ width: 300 }}
            allowClear
          />

          <Select
            placeholder={t('filter_by_status')}
            style={{ width: 200 }}
            value={filter.status || undefined}
            onChange={(value) => setFilter({ ...filter, status: value || '' })}
            allowClear
          >
            <Select.Option value="pending">{t('pending')}</Select.Option>
            <Select.Option value="in_transit">{t('in_transit')}</Select.Option>
            <Select.Option value="delivered">{t('delivered')}</Select.Option>
          </Select>

          <Button type="primary" onClick={loadOrders}>
            {t('refresh')}
          </Button>
        </div>
      </div>

      <Table
        dataSource={orders}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `${t('total')} ${total} ${t('orders')}`,
        }}
      />

      {/* Map Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <MdMap className="text-blue-500" />
            <span>{t('delivery_location')} - {selectedOrder?.order_no}</span>
          </div>
        }
        open={mapModalVisible}
        onCancel={() => {
          setMapModalVisible(false);
          setSelectedOrder(null);
        }}
        footer={null}
        width="90%"
        style={{ maxWidth: 1400, top: 20 }}
        bodyStyle={{ padding: '24px' }}
      >
        {selectedOrder && (
          <DeliveryMapView orderId={selectedOrder.id} />
        )}
      </Modal>

      {/* ✅ NEW: Truck Assignment Modal */}
      <TruckAssignmentModal
        visible={assignModalVisible}
        orderId={selectedOrderForAssignment?.id}
        orderNo={selectedOrderForAssignment?.order_no}
        onClose={() => {
          setAssignModalVisible(false);
          setSelectedOrderForAssignment(null);
        }}
        onSuccess={() => {
          loadOrders(); // ✅ Reload orders to show updated truck
          setAssignModalVisible(false);
          setSelectedOrderForAssignment(null);
          message.success(t('truck_assigned_successfully'));
        }}
      />
    </MainPage>
  );
}

export default OrderListWithMap;