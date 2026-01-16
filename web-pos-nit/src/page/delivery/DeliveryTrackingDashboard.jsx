// DeliveryTrackingDashboard.js
import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Timeline, Button, Modal, message } from 'antd';
import { MdLocationOn, MdLocalShipping, MdRefresh } from 'react-icons/md';
import { request } from '../../util/helper';

const DeliveryTrackingDashboard = ({ orderId }) => {
  const [trackingData, setTrackingData] = useState([]);
  const [driverLocation, setDriverLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (orderId) {
      loadTrackingData();
      
      if (autoRefresh) {
        const interval = setInterval(loadTrackingData, 30000); // 30 seconds
        return () => clearInterval(interval);
      }
    }
  }, [orderId, autoRefresh]);

  const loadTrackingData = async () => {
    setLoading(true);
    try {
      // Load tracking history
      const [trackingRes, locationRes] = await Promise.all([
        request(`delivery/tracking/${orderId}`, 'get'),
        request(`delivery/driver-location/${orderId}`, 'get')
      ]);

      if (trackingRes.success) {
        setTrackingData(trackingRes.tracking);
      }

      if (locationRes.success && locationRes.location) {
        setDriverLocation(locationRes.location);
      }
    } catch (error) {
      console.error('Error loading tracking:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      preparing: 'blue',
      loading: 'cyan',
      on_road: 'orange',
      arrived: 'purple',
      delivered: 'green',
      cancelled: 'red'
    };
    return colors[status] || 'default';
  };

  const renderTimeline = () => {
    return (
      <Timeline mode="left">
        {trackingData.map((item, index) => (
          <Timeline.Item 
            key={item.id}
            color={getStatusColor(item.status)}
            label={`${item.formatted_time}`}
          >
            <div>
              <Tag color={getStatusColor(item.status)}>
                {item.status.toUpperCase()}
              </Tag>
              {item.driver_name && (
                <span style={{ marginLeft: 8 }}>
                  By: {item.driver_name}
                </span>
              )}
              {item.notes && (
                <div style={{ marginTop: 4, color: '#666' }}>
                  {item.notes}
                </div>
              )}
              {item.latitude && item.longitude && (
                <Button 
                  type="link" 
                  size="small"
                  onClick={() => window.open(
                    `https://maps.google.com/?q=${item.latitude},${item.longitude}`,
                    '_blank'
                  )}
                >
                  View Location
                </Button>
              )}
            </div>
          </Timeline.Item>
        ))}
      </Timeline>
    );
  };

  return (
    <div className="delivery-tracking-dashboard">
      <Card 
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              <MdLocalShipping style={{ marginRight: 8 }} />
              Delivery Tracking
            </span>
            <div>
              <Button 
                icon={<MdRefresh />} 
                onClick={loadTrackingData}
                loading={loading}
                style={{ marginRight: 8 }}
              >
                Refresh
              </Button>
              <Button 
                type={autoRefresh ? 'primary' : 'default'}
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? 'Auto: ON' : 'Auto: OFF'}
              </Button>
            </div>
          </div>
        }
      >
        {/* Real-time Driver Location */}
        {driverLocation && (
          <Card 
            type="inner" 
            title="Current Driver Location"
            style={{ marginBottom: 16 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p><strong>Driver:</strong> {driverLocation.driver_name}</p>
                <p><strong>Last Updated:</strong> {new Date(driverLocation.last_updated).toLocaleString()}</p>
              </div>
              
              {driverLocation.latitude && driverLocation.longitude && (
                <div>
                  <Tag color="blue">
                    {driverLocation.latitude.toFixed(6)}, {driverLocation.longitude.toFixed(6)}
                  </Tag>
                  <Button
                    type="link"
                    icon={<MdLocationOn />}
                    onClick={() => window.open(
                      `https://maps.google.com/?q=${driverLocation.latitude},${driverLocation.longitude}`,
                      '_blank'
                    )}
                  >
                    View on Map
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Delivery Timeline */}
        <Card title="Delivery Timeline">
          {trackingData.length > 0 ? (
            renderTimeline()
          ) : (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <p>No tracking data available</p>
            </div>
          )}
        </Card>

        {/* Summary */}
        <div style={{ marginTop: 16 }}>
          <Table
            dataSource={trackingData}
            columns={[
              { title: 'Time', dataIndex: 'formatted_time', key: 'time' },
              { title: 'Status', dataIndex: 'status', key: 'status',
                render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>
              },
              { title: 'Driver', dataIndex: 'driver_name', key: 'driver' },
              { title: 'Notes', dataIndex: 'notes', key: 'notes' },
              { title: 'Location', key: 'location',
                render: (_, record) => record.latitude ? (
                  <a 
                    href={`https://maps.google.com/?q=${record.latitude},${record.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View
                  </a>
                ) : '-'
              }
            ]}
            pagination={false}
            size="small"
          />
        </div>
      </Card>
    </div>
  );
};

export default DeliveryTrackingDashboard;