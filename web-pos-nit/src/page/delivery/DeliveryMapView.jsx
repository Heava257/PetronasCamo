// components/delivery/DeliveryMapView.jsx
import React, { useState, useEffect } from 'react';
import { Card, Button, Tag, Spin, message, Radio } from 'antd';
import { 
  MdLocationOn, 
  MdNavigation, 
  MdPhone,
  MdDirectionsCar,
  MdSchedule,
  MdContentCopy
} from 'react-icons/md';
import { useTranslation } from '../../locales/TranslationContext';
import { request } from '../../util/helper';

const DeliveryMapView = ({ orderId, location }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [mapProvider, setMapProvider] = useState('google');
  const [locationRefreshInterval, setLocationRefreshInterval] = useState(null);

  // 坐标格式化函数
  const formatCoordinate = (value) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    const num = Number(value);
    return !isNaN(num) ? num.toFixed(6) : 'N/A';
  };

  // 状态颜色映射
  const getStatusColor = (status) => {
    const colors = {
      pending: 'orange',
      preparing: 'cyan',
      in_transit: 'blue',
      arrived: 'purple',
      delivered: 'green',
      cancelled: 'red',
      failed: 'gray'
    };
    return colors[status] || 'default';
  };

  // 状态文本映射
  const getStatusText = (status) => {
    const statusMap = {
      pending: t('pending'),
      preparing: t('preparing'),
      in_transit: t('in_transit'),
      arrived: t('arrived'),
      delivered: t('delivered'),
      cancelled: t('cancelled'),
      failed: t('failed')
    };
    return statusMap[status] || status;
  };

  useEffect(() => {
    if (orderId) {
      loadOrderData();
      loadDriverLocation();
      
      // 每30秒刷新司机位置（对于进行中的订单）
      const interval = setInterval(() => {
        if (orderData?.delivery_status === 'in_transit') {
          loadDriverLocation();
        }
      }, 30000);
      
      setLocationRefreshInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [orderId]);

  useEffect(() => {
    // 当订单状态改变时，调整位置刷新频率
    if (locationRefreshInterval && orderData?.delivery_status) {
      clearInterval(locationRefreshInterval);
      
      // 只有在运输中才刷新位置
      if (orderData.delivery_status === 'in_transit') {
        const interval = setInterval(loadDriverLocation, 30000);
        setLocationRefreshInterval(interval);
      }
    }
  }, [orderData?.delivery_status]);

  const loadOrderData = async () => {
    setLoading(true);
    try {
      const res = await request(`order/${orderId}/details`, 'get');
      if (res?.success) {
        setOrderData(res.data);
      } else {
        message.error(res?.message || t('load_order_failed'));
      }
    } catch (error) {
      console.error('Error loading order:', error);
      message.error(t('load_order_error'));
    } finally {
      setLoading(false);
    }
  };

  const loadDriverLocation = async () => {
    try {
      const res = await request(`delivery/driver-location/${orderId}`, 'get');
      if (res?.success) {
        if (res.location) {
          setDriverLocation(res.location);
        }
      }
    } catch (error) {
      console.error('Error loading driver location:', error);
      // 静默失败，不显示错误信息
    }
  };

  const openInGoogleMaps = (lat, lng, label) => {
    const formattedLat = formatCoordinate(lat);
    const formattedLng = formatCoordinate(lng);
    
    if (formattedLat === 'N/A' || formattedLng === 'N/A') {
      message.error(t('no_coordinates_available'));
      return;
    }
    
    const url = `https://www.google.com/maps/dir/?api=1&destination=${formattedLat},${formattedLng}&destination_place_id=${encodeURIComponent(label || t('delivery_location'))}`;
    window.open(url, '_blank');
  };

  const viewOnGoogleMaps = (lat, lng) => {
    const formattedLat = formatCoordinate(lat);
    const formattedLng = formatCoordinate(lng);
    
    if (formattedLat === 'N/A' || formattedLng === 'N/A') {
      message.error(t('no_coordinates_available'));
      return;
    }
    
    const url = `https://www.google.com/maps?q=${formattedLat},${formattedLng}`;
    window.open(url, '_blank');
  };

  const copyCoordinates = () => {
    const deliveryLocation = location || orderData?.location;
    if (!deliveryLocation?.latitude || !deliveryLocation?.longitude) {
      message.error(t('no_coordinates_available'));
      return;
    }
    
    const coords = `${formatCoordinate(deliveryLocation.latitude)}, ${formatCoordinate(deliveryLocation.longitude)}`;
    navigator.clipboard.writeText(coords).then(() => {
      message.success(t('coordinates_copied'));
    }).catch(() => {
      message.error(t('copy_failed'));
    });
  };

  const copyDriverCoordinates = () => {
    if (!driverLocation?.latitude || !driverLocation?.longitude) {
      message.error(t('no_coordinates_available'));
      return;
    }
    
    const coords = `${formatCoordinate(driverLocation.latitude)}, ${formatCoordinate(driverLocation.longitude)}`;
    navigator.clipboard.writeText(coords).then(() => {
      message.success(t('coordinates_copied'));
    }).catch(() => {
      message.error(t('copy_failed'));
    });
  };

  const renderMap = () => {
    const lat = location?.latitude || orderData?.location?.latitude;
    const lng = location?.longitude || orderData?.location?.longitude;
    
    const formattedLat = formatCoordinate(lat);
    const formattedLng = formatCoordinate(lng);

    if (formattedLat === 'N/A' || formattedLng === 'N/A') {
      return (
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
          <div className="text-center">
            <MdLocationOn className="text-gray-300 text-6xl mx-auto mb-4" />
            <p className="text-gray-500">{t('no_location_coordinates')}</p>
            <p className="text-sm text-gray-400 mt-2">{t('add_coordinates_instruction')}</p>
          </div>
        </div>
      );
    }

    switch (mapProvider) {
      case 'google':
        return (
          <iframe
            width="100%"
            height="500"
            frameBorder="0"
            style={{ border: 0, borderRadius: '8px' }}
            src={`https://maps.google.com/maps?q=${formattedLat},${formattedLng}&z=15&output=embed`}
            allowFullScreen
            title="Delivery Location Map"
            loading="lazy"
          />
        );
      
      case 'osm':
        return (
          <iframe
            width="100%"
            height="500"
            frameBorder="0"
            style={{ border: 0, borderRadius: '8px' }}
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${formattedLng-0.01},${formattedLat-0.01},${formattedLng+0.01},${formattedLat+0.01}&layer=mapnik&marker=${formattedLat},${formattedLng}`}
            title="OpenStreetMap"
            loading="lazy"
          />
        );
      
      default:
        return null;
    }
  };

  if (loading && !orderData) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spin size="large" tip={t('loading')} />
      </div>
    );
  }

  const deliveryLocation = location || orderData?.location;
  const customer = orderData?.customer || {};
  const truck = orderData?.truck || {};

  return (
    <div className="delivery-map-view">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Order Status Card */}
          <Card 
            title={t('delivery_status')} 
            size="small"
            extra={
              <Tag color={getStatusColor(orderData?.delivery_status)}>
                {getStatusText(orderData?.delivery_status)}
              </Tag>
            }
          >
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">{t('order_number')}</p>
                <p className="font-semibold text-lg">{orderData?.order_no || 'N/A'}</p>
              </div>
              
              {orderData?.delivery_date && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MdSchedule className="text-gray-400" />
                  <span className="text-sm">
                    {t('scheduled')}: {new Date(orderData.delivery_date).toLocaleDateString('km-KH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
              
              {orderData?.estimated_arrival && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-500">{t('estimated_arrival')}</p>
                  <p className="font-medium">
                    {new Date(orderData.estimated_arrival).toLocaleTimeString('km-KH', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Customer Info Card */}
          <Card title={t('customer_info')} size="small">
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-base">{customer.name || t('not_specified')}</p>
                {customer.company && (
                  <p className="text-sm text-gray-600">{customer.company}</p>
                )}
              </div>
              
              {customer.tel && (
                <div className="flex items-center gap-3">
                  <MdPhone className="text-gray-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">{t('phone')}</p>
                    <a href={`tel:${customer.tel}`} className="text-blue-600 hover:text-blue-800">
                      {customer.tel}
                    </a>
                  </div>
                </div>
              )}
              
              {customer.address && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('address')}</p>
                  <p className="text-sm">{customer.address}</p>
                </div>
              )}
              
              {customer.note && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-500 mb-1">{t('note')}</p>
                  <p className="text-sm italic">{customer.note}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Delivery Location Card */}
          {deliveryLocation && (
            <Card title={t('delivery_location')} size="small">
              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-base">{deliveryLocation.location_name || t('unnamed_location')}</p>
                  {deliveryLocation.address && (
                    <p className="text-sm text-gray-600 mt-1">{deliveryLocation.address}</p>
                  )}
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm text-gray-500">{t('coordinates')}</p>
                    <Button
                      type="text"
                      size="small"
                      icon={<MdContentCopy size={14} />}
                      onClick={copyCoordinates}
                    >
                      {t('copy')}
                    </Button>
                  </div>
                  <code className="text-xs bg-gray-100 p-2 rounded block font-mono">
                    {formatCoordinate(deliveryLocation.latitude)}, {formatCoordinate(deliveryLocation.longitude)}
                  </code>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    type="primary"
                    icon={<MdNavigation />}
                    onClick={() => openInGoogleMaps(
                      deliveryLocation.latitude,
                      deliveryLocation.longitude,
                      deliveryLocation.location_name
                    )}
                    block
                  >
                    {t('get_directions')}
                  </Button>
                  <Button
                    icon={<MdLocationOn />}
                    onClick={() => viewOnGoogleMaps(
                      deliveryLocation.latitude,
                      deliveryLocation.longitude
                    )}
                    block
                  >
                    {t('view_on_map')}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Driver & Truck Info Card */}
          {(truck.plate_number || truck.driver_name || driverLocation) && (
            <Card title={t('truck_info')} size="small">
              <div className="space-y-4">
                {truck.plate_number && (
                  <div className="flex items-center gap-3">
                    <MdDirectionsCar className="text-gray-500 text-lg flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">{t('plate_number')}</p>
                      <p className="font-semibold">{truck.plate_number}</p>
                    </div>
                  </div>
                )}
                
                {(truck.driver_name || truck.driver_phone) && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-gray-500 mb-2">{t('driver_info')}</p>
                    {truck.driver_name && (
                      <p className="font-medium">{truck.driver_name}</p>
                    )}
                    {truck.driver_phone && (
                      <a 
                        href={`tel:${truck.driver_phone}`} 
                        className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 mt-1"
                      >
                        <MdPhone size={14} />
                        {truck.driver_phone}
                      </a>
                    )}
                  </div>
                )}
                
                {/* Driver Current Location */}
                {driverLocation && (
                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm text-gray-500">{t('current_location')}</p>
                      <Button
                        type="text"
                        size="small"
                        icon={<MdContentCopy size={12} />}
                        onClick={copyDriverCoordinates}
                      >
                        {t('copy_coordinates')}
                      </Button>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-xs font-mono">
                        {formatCoordinate(driverLocation.latitude)}, {formatCoordinate(driverLocation.longitude)}
                      </p>
                      
                      {driverLocation.address && (
                        <p className="text-xs text-gray-600">{driverLocation.address}</p>
                      )}
                      
                      {driverLocation.last_updated && (
                        <p className="text-xs text-gray-400">
                          {t('updated')}: {new Date(driverLocation.last_updated).toLocaleTimeString('km-KH', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </p>
                      )}
                      
                      {orderData?.delivery_status === 'in_transit' && (
                        <p className="text-xs text-blue-500">
                          {t('auto_updating_location')}
                        </p>
                      )}
                    </div>
                    
                    <Button
                      type="link"
                      size="small"
                      onClick={loadDriverLocation}
                      className="mt-2 p-0"
                    >
                      {t('refresh_location')}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Map */}
        <div className="lg:col-span-2">
          <Card 
            title={
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <span className="text-lg font-medium">{t('delivery_location_map')}</span>
                <Radio.Group 
                  value={mapProvider} 
                  onChange={(e) => setMapProvider(e.target.value)}
                  size="small"
                  buttonStyle="solid"
                >
                  <Radio.Button value="google">Google Maps</Radio.Button>
                  <Radio.Button value="osm">OpenStreetMap</Radio.Button>
                </Radio.Group>
              </div>
            }
            bodyStyle={{ padding: 0 }}
          >
            {renderMap()}
            
            {/* Additional Actions */}
            <div className="p-4 border-t">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="primary"
                  icon={<MdNavigation />}
                  onClick={() => openInGoogleMaps(
                    deliveryLocation?.latitude,
                    deliveryLocation?.longitude,
                    deliveryLocation?.location_name
                  )}
                  size="middle"
                >
                  {t('open_in_navigation')}
                </Button>
                
                <Button
                  icon={<MdLocationOn />}
                  onClick={() => viewOnGoogleMaps(
                    deliveryLocation?.latitude,
                    deliveryLocation?.longitude
                  )}
                  size="middle"
                >
                  {t('view_on_map')}
                </Button>
                
                <Button
                  icon={<MdContentCopy />}
                  onClick={copyCoordinates}
                  size="middle"
                >
                  {t('copy_coordinates')}
                </Button>
                
                {driverLocation && (
                  <Button
                    onClick={() => viewOnGoogleMaps(
                      driverLocation.latitude,
                      driverLocation.longitude
                    )}
                    size="middle"
                  >
                    {t('view_driver_location')}
                  </Button>
                )}
              </div>
              
              {/* Map Tips */}
              <div className="mt-4 pt-3 border-t">
                <p className="text-xs text-gray-500">
                  {t('map_tips')}
                </p>
                <ul className="text-xs text-gray-400 list-disc pl-4 mt-1 space-y-1">
                  <li>{t('tip_google_maps')}</li>
                  <li>{t('tip_osm')}</li>
                  <li>{t('tip_refresh')}</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DeliveryMapView;