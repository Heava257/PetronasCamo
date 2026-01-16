import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, Badge, Select, message, Tooltip } from 'antd';
import {
  MdMap,
  MdPhone,
  MdRefresh,
  MdLocalShipping,
  MdLocationOn,
  MdNavigation
} from 'react-icons/md';
import { useTranslation } from '../../locales/TranslationContext';
import { request } from '../../util/helper';
import DeliveryTrackingModal from './DeliveryTrackingModal';
import moment from 'moment';

const ActiveDeliveriesMonitor = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [filterDriver, setFilterDriver] = useState(null);
  const [filterTruck, setFilterTruck] = useState(null);
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadActiveDeliveries();
    
    if (autoRefresh) {
      const interval = setInterval(loadActiveDeliveries, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, filterDriver, filterTruck]);

  const loadActiveDeliveries = async (silent = false) => {
    if (!silent) setLoading(true);
    
    try {
      let url = 'delivery/active-with-location?';
      if (filterDriver) url += `driver_name=${filterDriver}&`;
      if (filterTruck) url += `truck_id=${filterTruck}&`;
      
      const res = await request(url, 'get');
      if (res && res.success) {
        setActiveDeliveries(res.active_deliveries || []);
      }
    } catch (error) {
      console.error('Error loading active deliveries:', error);
      if (!silent) message.error(t('failed_to_load_data'));
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleViewTracking = (orderId) => {
    setSelectedOrderId(orderId);
    setTrackingModalVisible(true);
  };

  const handleNavigate = (latitude, longitude, label) => {
    if (latitude && longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      window.open(url, '_blank');
    } else {
      message.warning(t('no_location_data'));
    }
  };

  const viewDriverLocation = (latitude, longitude) => {
    if (latitude && longitude) {
      const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
      window.open(url, '_blank');
    } else {
      message.warning(t('no_driver_location'));
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const getLocationStatus = (lastUpdate) => {
    if (!lastUpdate) return { status: 'default', text: 'Offline' };
    
    const minutesAgo = moment().diff(moment(lastUpdate), 'minutes');
    
    if (minutesAgo < 2) return { status: 'processing', text: 'Live' };
    if (minutesAgo < 10) return { status: 'success', text: 'Active' };
    if (minutesAgo < 60) return { status: 'warning', text: 'Delayed' };
    return { status: 'error', text: 'Offline' };
  };

  const columns = [
    {
      title: t('order_no'),
      dataIndex: 'order_no',
      key: 'order_no',
      width: 120,
      fixed: 'left',
      render: (text) => <span className="font-semibold">{text}</span>
    },
    {
      title: t('customer'),
      dataIndex: 'customer_name',
      key: 'customer',
      width: 150
    },
    {
      title: t('destination'),
      key: 'destination',
      width: 200,
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.location_name}</div>
          <div className="text-xs text-gray-500">{record.delivery_address}</div>
        </div>
      )
    },
    {
      title: t('truck_driver'),
      key: 'truck',
      width: 150,
      render: (_, record) => (
        <div>
          <div className="text-sm font-medium">{record.plate_number}</div>
          <div className="text-xs text-gray-600">{record.driver_name}</div>
        </div>
      )
    },
    {
      title: t('distance_remaining'),
      key: 'distance',
      width: 130,
      align: 'center',
      render: (_, record) => {
        if (!record.driver_lat || !record.destination_lat) {
          return <span className="text-gray-400">-</span>;
        }
        
        const distance = calculateDistance(
          record.driver_lat,
          record.driver_lng,
          record.destination_lat,
          record.destination_lng
        );
        
        if (!distance) return <span className="text-gray-400">-</span>;
        
        let color = 'blue';
        if (distance < 0.1) color = 'green';
        else if (distance < 1) color = 'orange';
        
        return (
          <Tag color={color}>
            {distance < 1 
              ? `${Math.round(distance * 1000)}m`
              : `${distance.toFixed(2)}km`}
          </Tag>
        );
      }
    },
    {
      title: t('status'),
      dataIndex: 'delivery_status',
      key: 'status',
      width: 100,
      render: (status) => {
        const colors = {
          pending: 'blue',
          in_transit: 'orange',
          delivered: 'green',
          cancelled: 'red'
        };
        return <Tag color={colors[status]}>{t(status)}</Tag>;
      }
    },
    {
      title: t('driver_location'),
      key: 'location_status',
      width: 130,
      render: (_, record) => {
        const status = getLocationStatus(record.location_updated);
        return (
          <div>
            <Badge status={status.status} text={status.text} />
            {record.location_updated && (
              <div className="text-xs text-gray-500">
                {moment(record.location_updated).fromNow()}
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: t('actions'),
      key: 'actions',
      width: 180,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('view_tracking')}>
            <Button
              size="small"
              icon={<MdMap />}
              onClick={() => handleViewTracking(record.order_id)}
            />
          </Tooltip>
          
          {record.destination_lat && record.destination_lng && (
            <Tooltip title={t('navigate_to_destination')}>
              <Button
                size="small"
                type="primary"
                icon={<MdNavigation />}
                onClick={() => handleNavigate(
                  record.destination_lat,
                  record.destination_lng,
                  record.location_name
                )}
              />
            </Tooltip>
          )}
          
          {record.driver_lat && record.driver_lng && (
            <Tooltip title={t('view_driver_location')}>
              <Button
                size="small"
                icon={<MdLocationOn />}
                onClick={() => viewDriverLocation(record.driver_lat, record.driver_lng)}
              />
            </Tooltip>
          )}
          
          {record.driver_phone && (
            <Tooltip title={t('call_driver')}>
              <Button
                size="small"
                icon={<MdPhone />}
                onClick={() => window.open(`tel:${record.driver_phone}`)}
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  const stats = {
    total: activeDeliveries.length,
    pending: activeDeliveries.filter(d => d.delivery_status === 'pending').length,
    in_transit: activeDeliveries.filter(d => d.delivery_status === 'in_transit').length,
    live: activeDeliveries.filter(d => {
      const status = getLocationStatus(d.location_updated);
      return status.status === 'processing';
    }).length
  };

  return (
    <div className="active-deliveries-monitor p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MdLocalShipping className="text-blue-500" />
            {t('active_deliveries_monitor')}
          </h1>
          <p className="text-sm text-gray-500">
            {t('real_time_monitoring')} • {t('auto_refresh')}: {autoRefresh ? t('enabled') : t('disabled')}
          </p>
        </div>
        
        <Space>
          <Button
            icon={<MdRefresh />}
            onClick={() => loadActiveDeliveries()}
            loading={loading}
          >
            {t('refresh')}
          </Button>
          
          <Button
            type={autoRefresh ? 'primary' : 'default'}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {t('auto_refresh')}: {autoRefresh ? t('on') : t('off')}
          </Button>
        </Space>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <Card className="text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-600">{t('total_active')}</div>
        </Card>
        
        <Card className="text-center">
          <div className="text-3xl font-bold text-orange-600">{stats.in_transit}</div>
          <div className="text-sm text-gray-600">{t('in_transit')}</div>
        </Card>
        
        <Card className="text-center">
          <div className="text-3xl font-bold text-purple-600">{stats.pending}</div>
          <div className="text-sm text-gray-600">{t('pending')}</div>
        </Card>
        
        <Card className="text-center">
          <div className="text-3xl font-bold text-green-600">{stats.live}</div>
          <div className="text-sm text-gray-600">{t('live_tracking')}</div>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <Table
          dataSource={activeDeliveries}
          columns={columns}
          rowKey="order_id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showTotal: (total) => `${t('total')} ${total} ${t('active_deliveries')}`
          }}
          scroll={{ x: 1400 }}
          rowClassName={(record) => {
            const status = getLocationStatus(record.location_updated);
            if (status.status === 'processing') return 'bg-green-50';
            if (status.status === 'warning') return 'bg-yellow-50';
            if (status.status === 'error') return 'bg-red-50';
            return '';
          }}
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

export default ActiveDeliveriesMonitor;