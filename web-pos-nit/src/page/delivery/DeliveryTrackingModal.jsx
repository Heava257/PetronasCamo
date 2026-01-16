// components/delivery/DeliveryTrackingModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Timeline, 
  Card, 
  Tag, 
  Button, 
  Input, 
  Space,
  message,
  Empty,
  Spin
} from 'antd';
import { 
  MdLocationOn, 
  MdCheckCircle, 
  MdSchedule, 
  MdNavigation,
  MdRefresh,
  MdPerson
} from 'react-icons/md';
import { request } from '../../util/helper';
import { useTranslation } from '../../locales/TranslationContext';

const DeliveryTrackingModal = ({ visible, onClose, orderId, orderNo }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState([]);
  const [orderInfo, setOrderInfo] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState('');
  const [noteUpdate, setNoteUpdate] = useState('');
  const [refreshingLocation, setRefreshingLocation] = useState(false);

  // 安全的坐标格式化函数
  const formatCoordinate = (value) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    
    // 尝试转换为数字
    let num;
    if (typeof value === 'string') {
      num = parseFloat(value);
    } else if (typeof value === 'number') {
      num = value;
    } else {
      return 'N/A';
    }
    
    return !isNaN(num) ? num.toFixed(6) : 'N/A';
  };

  // 解析坐标为数字
  const parseCoordinate = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    return !isNaN(num) ? num : null;
  };

  useEffect(() => {
    if (visible && orderId) {
      loadTrackingData();
      loadDriverLocation();
      
      // 如果订单在运输中，自动刷新位置
      if (orderInfo?.delivery_status === 'in_transit') {
        const interval = setInterval(() => {
          loadDriverLocation();
        }, 30000);
        
        return () => clearInterval(interval);
      }
    }
  }, [visible, orderId, orderInfo?.delivery_status]);

  const loadTrackingData = async () => {
    setLoading(true);
    try {
      const res = await request(`delivery/tracking/${orderId}`, 'get');
      if (res?.success) {
        setTrackingData(res.tracking || []);
        setOrderInfo(res.order || null);
      } else {
        message.error(res?.message || t('failed_to_load_tracking'));
      }
    } catch (error) {
      console.error('Error loading tracking:', error);
      message.error(t('load_tracking_error'));
    } finally {
      setLoading(false);
    }
  };

  const loadDriverLocation = async () => {
    setRefreshingLocation(true);
    try {
      const res = await request(`delivery/driver-location/${orderId}`, 'get');
      if (res?.success) {
        if (res.location) {
          // 确保坐标是数字类型
          const formattedLocation = {
            ...res.location,
            latitude: parseCoordinate(res.location.latitude),
            longitude: parseCoordinate(res.location.longitude),
            last_updated: res.location.last_updated || new Date().toISOString()
          };
          setDriverLocation(formattedLocation);
        }
      }
    } catch (error) {
      console.error('Error loading driver location:', error);
    } finally {
      setRefreshingLocation(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      preparing: 'blue',
      loading: 'cyan',
      in_transit: 'orange',
      arrived: 'purple',
      delivered: 'green',
      cancelled: 'red',
      pending: 'yellow'
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    const icons = {
      preparing: <MdSchedule className="text-blue-500" />,
      loading: <MdSchedule className="text-cyan-500" />,
      in_transit: <MdLocationOn className="text-orange-500" />,
      arrived: <MdCheckCircle className="text-purple-500" />,
      delivered: <MdCheckCircle className="text-green-500" />,
      cancelled: <MdCheckCircle className="text-red-500" />,
      pending: <MdSchedule className="text-yellow-500" />
    };
    return icons[status] || <MdSchedule className="text-gray-500" />;
  };

  const getStatusText = (status) => {
    const statusMap = {
      preparing: t('preparing'),
      loading: t('loading'),
      in_transit: t('in_transit'),
      arrived: t('arrived'),
      delivered: t('delivered'),
      cancelled: t('cancelled'),
      pending: t('pending')
    };
    return statusMap[status] || status;
  };

  const handleStatusUpdate = async () => {
    if (!statusUpdate) {
      message.warning(t('select_status_first'));
      return;
    }

    try {
      const res = await request('delivery/tracking/update', 'post', {
        order_id: orderId,
        status: statusUpdate,
        notes: noteUpdate
      });

      if (res?.success) {
        message.success(t('status_updated_successfully'));
        setStatusUpdate('');
        setNoteUpdate('');
        loadTrackingData();
        loadDriverLocation();
      } else {
        message.error(res?.message || t('failed_to_update_status'));
      }
    } catch (error) {
      console.error('Error updating status:', error);
      message.error(t('update_status_error'));
    }
  };

  const openLocationInMaps = (lat, lng) => {
    const formattedLat = formatCoordinate(lat);
    const formattedLng = formatCoordinate(lng);
    
    if (formattedLat === 'N/A' || formattedLng === 'N/A') {
      message.error(t('no_coordinates_available'));
      return;
    }
    
    const url = `https://www.google.com/maps?q=${formattedLat},${formattedLng}`;
    window.open(url, '_blank');
  };

  const openDirections = (lat, lng) => {
    const formattedLat = formatCoordinate(lat);
    const formattedLng = formatCoordinate(lng);
    
    if (formattedLat === 'N/A' || formattedLng === 'N/A') {
      message.error(t('no_coordinates_available'));
      return;
    }
    
    const url = `https://www.google.com/maps/dir/?api=1&destination=${formattedLat},${formattedLng}`;
    window.open(url, '_blank');
  };

  const copyCoordinates = (lat, lng) => {
    const coords = `${formatCoordinate(lat)}, ${formatCoordinate(lng)}`;
    navigator.clipboard.writeText(coords).then(() => {
      message.success(t('coordinates_copied'));
    }).catch(() => {
      message.error(t('copy_failed'));
    });
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <MdLocationOn className="text-blue-500 text-xl" />
          <div>
            <h3 className="font-semibold text-lg">{t('delivery_tracking')}</h3>
            <p className="text-sm text-gray-600">{orderNo}</p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="close" onClick={onClose}>
          {t('close')}
        </Button>
      ]}
      destroyOnClose
    >
      {/* 加载状态 */}
      {loading && !orderInfo ? (
        <div className="flex justify-center py-8">
          <Spin size="large" tip={t('loading_tracking_data')} />
        </div>
      ) : (
        <>
          {/* Order Info */}
          {orderInfo && (
            <Card size="small" className="mb-4 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="font-semibold text-gray-600 text-sm">{t('customer')}</p>
                  <p className="font-medium">{orderInfo.customer_name || 'N/A'}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    📞 {orderInfo.customer_phone || t('not_available')}
                  </p>
                </div>
                
                <div>
                  <p className="font-semibold text-gray-600 text-sm">{t('delivery_address')}</p>
                  <p className="text-sm">{orderInfo.delivery_address || t('not_specified')}</p>
                </div>
                
                <div>
                  <p className="font-semibold text-gray-600 text-sm">{t('current_status')}</p>
                  <Tag color={getStatusColor(orderInfo.delivery_status)} className="text-sm">
                    {getStatusText(orderInfo.delivery_status)}
                  </Tag>
                  {orderInfo.truck_driver && (
                    <p className="mt-2 text-sm">
                      <span className="font-semibold">{t('driver')}: </span>
                      {orderInfo.truck_driver}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Driver Current Location */}
          <Card 
            size="small" 
            className="mb-4 shadow-sm"
            title={
              <div className="flex items-center gap-2">
                <MdPerson className="text-blue-500" />
                <span>{t('current_driver_location')}</span>
              </div>
            }
            extra={
              <Button 
                icon={<MdRefresh />} 
                size="small"
                loading={refreshingLocation}
                onClick={loadDriverLocation}
              >
                {t('refresh')}
              </Button>
            }
          >
            {driverLocation ? (
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="mb-2">
                      <p className="text-sm text-gray-600 mb-1">{t('coordinates')}</p>
                      <code className="text-sm bg-gray-100 p-2 rounded block font-mono">
                        {formatCoordinate(driverLocation.latitude)}, {formatCoordinate(driverLocation.longitude)}
                      </code>
                    </div>
                    
                    {driverLocation.address && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">{t('address')}</p>
                        <p className="text-sm">{driverLocation.address}</p>
                      </div>
                    )}
                    
                    {driverLocation.last_updated && (
                      <p className="text-xs text-gray-500 mt-2">
                        {t('last_updated')}: {new Date(driverLocation.last_updated).toLocaleString('km-KH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      type="primary"
                      size="small"
                      icon={<MdNavigation />}
                      onClick={() => openDirections(driverLocation.latitude, driverLocation.longitude)}
                    >
                      {t('get_directions')}
                    </Button>
                    <Button
                      size="small"
                      icon={<MdLocationOn />}
                      onClick={() => openLocationInMaps(driverLocation.latitude, driverLocation.longitude)}
                    >
                      {t('view_on_map')}
                    </Button>
                    <Button
                      size="small"
                      onClick={() => copyCoordinates(driverLocation.latitude, driverLocation.longitude)}
                    >
                      {t('copy_coordinates')}
                    </Button>
                  </div>
                </div>
                
                {orderInfo?.delivery_status === 'in_transit' && (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-blue-500 flex items-center gap-1">
                      <MdRefresh size={12} />
                      {t('auto_refreshing_location')}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <MdLocationOn className="text-gray-300 text-4xl mx-auto mb-2" />
                <p className="text-gray-500">{t('no_location_data')}</p>
                <p className="text-sm text-gray-400">{t('location_data_unavailable')}</p>
              </div>
            )}
          </Card>

          {/* Status Update Form */}
          <Card size="small" className="mb-4 shadow-sm" title={t('update_status')}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('status')}
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={statusUpdate}
                  onChange={(e) => setStatusUpdate(e.target.value)}
                >
                  <option value="">{t('select_status')}</option>
                  <option value="preparing">{t('preparing')}</option>
                  <option value="loading">{t('loading')}</option>
                  <option value="in_transit">{t('in_transit')}</option>
                  <option value="arrived">{t('arrived')}</option>
                  <option value="delivered">{t('delivered')}</option>
                  <option value="cancelled">{t('cancelled')}</option>
                </select>
              </div>
              
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('notes')} ({t('optional')})
                </label>
                <Input.TextArea
                  placeholder={t('enter_notes_here')}
                  value={noteUpdate}
                  onChange={(e) => setNoteUpdate(e.target.value)}
                  rows={3}
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <Button 
                type="primary" 
                onClick={handleStatusUpdate}
                disabled={!statusUpdate}
                block
              >
                {t('update_status')}
              </Button>
            </Space>
          </Card>

          {/* Tracking Timeline */}
          <Card 
            title={
              <div className="flex justify-between items-center">
                <span className="font-semibold">{t('tracking_history')}</span>
                <Button 
                  icon={<MdRefresh />} 
                  size="small"
                  onClick={loadTrackingData}
                  loading={loading}
                >
                  {t('refresh')}
                </Button>
              </div>
            }
            size="small"
            className="shadow-sm"
          >
            {trackingData.length > 0 ? (
              <Timeline mode="left">
                {trackingData.map((item, index) => (
                  <Timeline.Item
                    key={item.id || index}
                    dot={getStatusIcon(item.status)}
                    color={getStatusColor(item.status)}
                    label={
                      <span className="text-xs text-gray-500">
                        {new Date(item.formatted_time || item.created_at).toLocaleString('km-KH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    }
                  >
                    <div className="pb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Tag color={getStatusColor(item.status)} className="text-xs">
                          {getStatusText(item.status)}
                        </Tag>
                        {item.driver_name && (
                          <span className="text-sm text-gray-600">
                            {t('by')}: {item.driver_name}
                          </span>
                        )}
                      </div>
                      
                      {item.notes && (
                        <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded mt-1">
                          {item.notes}
                        </p>
                      )}
                      
                      {item.latitude && item.longitude && (
                        <div className="mt-2 flex gap-2">
                          <Button
                            type="link"
                            size="small"
                            icon={<MdLocationOn size={14} />}
                            onClick={() => openLocationInMaps(item.latitude, item.longitude)}
                          >
                            {t('view_location')}
                          </Button>
                          <Button
                            type="text"
                            size="small"
                            onClick={() => copyCoordinates(item.latitude, item.longitude)}
                          >
                            {t('copy_coordinates')}
                          </Button>
                        </div>
                      )}
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <Empty 
                description={
                  <div>
                    <p>{t('no_tracking_data')}</p>
                    <p className="text-sm text-gray-400 mt-1">{t('tracking_will_appear')}</p>
                  </div>
                }
              />
            )}
          </Card>
        </>
      )}
    </Modal>
  );
};

export default DeliveryTrackingModal;