import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Button, Tag, Badge, Switch, message, Modal, Input, Upload, Alert } from 'antd';
import {
  MdLocalShipping,
  MdLocationOn,
  MdNavigation,
  MdPhone,
  MdCheckCircle,
  MdCamera,
  MdNote,
  MdWarning,
  MdRefresh,
  MdLocationOff,
  MdWifiTethering,
  MdSignalWifi4Bar,
  MdSignalWifiOff
} from 'react-icons/md';
import { request } from '../../util/helper';
import moment from 'moment';

/**
 * Complete Driver Mobile App
 * 
 * សកម្មភាពទាំងអស់របស់ Driver:
 * 1. មើល deliveries assigned
 * 2. បើក GPS tracking
 * 3. Navigate ទៅទីតាំង
 * 4. ហៅអតិថិជន
 * 5. Update status (Start → Arrived → Delivered)
 * 6. Take delivery photos
 * 7. Add notes/issues
 * 8. View delivery history
 */

const CompleteDriverApp = () => {
  const [loading, setLoading] = useState(false);
  const [driverInfo, setDriverInfo] = useState(null);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [distanceToDestination, setDistanceToDestination] = useState(null);
  
  // GPS States
  const [gpsStatus, setGpsStatus] = useState('idle'); // 'idle', 'getting', 'tracking', 'error'
  const [gpsError, setGpsError] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [gpsRetryCount, setGpsRetryCount] = useState(0);
  const [networkLocation, setNetworkLocation] = useState(null);
  
  // Modals
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [issueModalVisible, setIssueModalVisible] = useState(false);
  const [gpsModalVisible, setGpsModalVisible] = useState(false);

  // Refs
  const gpsWatchIdRef = useRef(null);
  const locationTimeoutRef = useRef(null);
  const locationUpdateIntervalRef = useRef(null);

  useEffect(() => {
    checkDriverAuth();
    // Check if browser supports geolocation
    checkGeolocationSupport();
  }, []);

  useEffect(() => {
    if (driverInfo) {
      loadMyDeliveries();
      // Auto-refresh every 30 seconds
      const interval = setInterval(loadMyDeliveries, 30000);
      return () => clearInterval(interval);
    }
  }, [driverInfo]);

  useEffect(() => {
    if (trackingEnabled) {
      startGPSTracking();
    } else {
      stopGPSTracking();
    }
  }, [trackingEnabled]);

  const checkGeolocationSupport = () => {
    if (!navigator.geolocation) {
      setGpsError('GPS not supported by your browser');
      setGpsStatus('error');
      return false;
    }
    return true;
  };

  const checkLocationPermission = async () => {
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      
      if (permission.state === 'granted') {
        return true;
      } else if (permission.state === 'prompt') {
        // Request permission
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => resolve(true),
            () => resolve(false),
            { timeout: 5000 }
          );
        });
      } else {
        setGpsError('Location permission denied. Please enable location services in browser settings.');
        setGpsStatus('error');
        return false;
      }
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  };

  // ✅ 1. ពិនិត្យថាជា Driver មែនទេ
  const checkDriverAuth = async () => {
    try {
      const res = await request('driver/check-auth', 'get');
      if (res && res.success) {
        setDriverInfo(res.driver_info);
      } else {
        message.error('You are not authorized as a driver');
      }
    } catch (error) {
      console.error('Driver auth error:', error);
    }
  };

  // ✅ 2. ទាញ deliveries ដែល assigned ទៅខ្ញុំ
  const loadMyDeliveries = async () => {
    setLoading(true);
    try {
      const res = await request('driver/my-assignments', 'get');
      if (res && res.success) {
        setMyDeliveries(res.list || []);
        
        // Auto-select first pending delivery
        if (!selectedDelivery && res.list && res.list.length > 0) {
          const firstPending = res.list.find(
            d => d.status === 'assigned' || d.status === 'in_transit'
          );
          if (firstPending) {
            setSelectedDelivery(firstPending);
          }
        }
      }
    } catch (error) {
      console.error('Error loading deliveries:', error);
      message.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  // ✅ 3. បើក GPS Tracking - Improved with error handling
  const startGPSTracking = async () => {
    if (!checkGeolocationSupport()) return;

    setGpsStatus('getting');
    setGpsError(null);
    
    const hasPermission = await checkLocationPermission();
    if (!hasPermission) {
      setTrackingEnabled(false);
      setGpsModalVisible(true);
      return;
    }

    // Clear any existing timeout
    if (locationTimeoutRef.current) {
      clearTimeout(locationTimeoutRef.current);
    }

    // Use a more relaxed timeout for first location
    locationTimeoutRef.current = setTimeout(() => {
      if (gpsStatus === 'getting') {
        getNetworkLocation();
      }
    }, 15000); // 15 second timeout for first fix

    // High accuracy options (slower but more accurate)
    const highAccuracyOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    // Medium accuracy options (fallback)
    const mediumAccuracyOptions = {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 60000 // Accept cached location up to 1 minute old
    };

    const handlePositionSuccess = (position) => {
      clearTimeout(locationTimeoutRef.current);
      
      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp,
        source: 'gps'
      };
      
      setCurrentLocation(location);
      setGpsAccuracy(position.coords.accuracy);
      setGpsStatus('tracking');
      setGpsRetryCount(0);
      
      // Send to server
      if (selectedDelivery) {
        sendLocationUpdate(location);
      }

      // Switch to watch position after first success
      startWatchPosition();
    };

    const handlePositionError = (error) => {
      
      if (gpsRetryCount < 2) {
        // Try with lower accuracy
        setGpsRetryCount(prev => prev + 1);
        
        navigator.geolocation.getCurrentPosition(
          handlePositionSuccess,
          handlePositionError,
          mediumAccuracyOptions
        );
      } else {
        // Fallback to network location
        setGpsStatus('error');
        setGpsError(`GPS Error: ${error.message} (Code: ${error.code})`);
        getNetworkLocation();
      }
    };

    try {
      navigator.geolocation.getCurrentPosition(
        handlePositionSuccess,
        handlePositionError,
        highAccuracyOptions
      );
    } catch (error) {
      console.error('GPS setup error:', error);
      setGpsStatus('error');
      setGpsError('Failed to start GPS');
    }
  };

  const startWatchPosition = () => {
    if (gpsWatchIdRef.current) {
      navigator.geolocation.clearWatch(gpsWatchIdRef.current);
    }

    const watchOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    gpsWatchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: 'gps',
          timestamp: new Date().toISOString()
        };
        
        setCurrentLocation(location);
        setGpsAccuracy(position.coords.accuracy);
        
        // Send to server every 30 seconds
        if (selectedDelivery) {
          sendLocationUpdate(location);
        }
      },
      (error) => {
        // Continue tracking even with errors
        setGpsAccuracy(null);
      },
      watchOptions
    );

    // Start regular location updates
    if (locationUpdateIntervalRef.current) {
      clearInterval(locationUpdateIntervalRef.current);
    }

    locationUpdateIntervalRef.current = setInterval(() => {
      if (selectedDelivery && currentLocation) {
        sendLocationUpdate(currentLocation);
      }
    }, 30000); // Every 30 seconds
  };

  const getNetworkLocation = () => {
    setGpsStatus('getting_network');
    
    // Try HTML5 Geolocation with lower accuracy
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: 'network',
          timestamp: new Date().toISOString()
        };
        
        setNetworkLocation(location);
        setCurrentLocation(location);
        setGpsAccuracy(position.coords.accuracy);
        setGpsStatus('tracking_network');
        setGpsError(null);
        
        if (selectedDelivery) {
          sendLocationUpdate(location);
        }
      },
      (error) => {
        setGpsStatus('error');
        setGpsError('Unable to get any location data. Please check internet connection.');
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const stopGPSTracking = () => {
    if (gpsWatchIdRef.current) {
      navigator.geolocation.clearWatch(gpsWatchIdRef.current);
      gpsWatchIdRef.current = null;
    }
    
    if (locationTimeoutRef.current) {
      clearTimeout(locationTimeoutRef.current);
    }
    
    if (locationUpdateIntervalRef.current) {
      clearInterval(locationUpdateIntervalRef.current);
    }
    
    setGpsStatus('idle');
    setGpsAccuracy(null);
    message.info('GPS tracking stopped');
  };

  const sendLocationUpdate = async (location) => {
    if (!selectedDelivery) return;

    try {
      await request('order/update-location', 'post', {
        order_id: selectedDelivery.order_id,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        source: location.source,
        status: 'in_transit',
        notes: `Driver location update - Accuracy: ${Math.round(location.accuracy || 0)}m`
      });
    } catch (error) {
      console.error('Failed to send location:', error);
    }
  };

  // ✅ 4. គណនាចម្ងាយទៅទីតាំង
  const calculateDistance = useCallback(() => {
    if (!currentLocation || !selectedDelivery?.location) return;

    const R = 6371; // Earth's radius in km
    const lat1 = currentLocation.latitude * Math.PI / 180;
    const lat2 = selectedDelivery.location.latitude * Math.PI / 180;
    const dLat = (selectedDelivery.location.latitude - currentLocation.latitude) * Math.PI / 180;
    const dLon = (selectedDelivery.location.longitude - currentLocation.longitude) * Math.PI / 180;

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    setDistanceToDestination(distance);
  }, [currentLocation, selectedDelivery]);

  useEffect(() => {
    calculateDistance();
  }, [calculateDistance]);

  // ✅ 5. Navigate ទៅទីតាំង
  const handleNavigate = () => {
    if (!selectedDelivery?.location) {
      message.error('No destination location');
      return;
    }

    const { latitude, longitude } = selectedDelivery.location;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
    window.open(url, '_blank');
  };

  // ✅ 6. ហៅអតិថិជន
  const handleCallCustomer = () => {
    if (!selectedDelivery?.customer_phone) {
      message.error('No customer phone number');
      return;
    }
    window.open(`tel:${selectedDelivery.customer_phone}`);
  };

  // ✅ 7. Update Status - Start Delivery
  const handleStartDelivery = async () => {
    try {
      await request('order/update-location', 'post', {
        order_id: selectedDelivery.order_id,
        latitude: currentLocation?.latitude,
        longitude: currentLocation?.longitude,
        accuracy: currentLocation?.accuracy,
        status: 'in_transit',
        notes: 'Driver started delivery'
      });

      message.success('Delivery started');
      loadMyDeliveries();
    } catch (error) {
      message.error('Failed to start delivery');
    }
  };

  // ✅ 8. Update Status - Arrived
  const handleMarkArrived = async () => {
    // Check if at location (within 200m or within accuracy range)
    if (distanceToDestination && distanceToDestination > 0.2) {
      const distanceMeters = Math.round(distanceToDestination * 1000);
      message.warning(`You are ${distanceMeters}m away from destination`);
      return;
    }

    try {
      await request('order/update-location', 'post', {
        order_id: selectedDelivery.order_id,
        latitude: currentLocation?.latitude,
        longitude: currentLocation?.longitude,
        accuracy: currentLocation?.accuracy,
        status: 'arrived',
        notes: 'Driver arrived at destination'
      });

      message.success('Marked as arrived');
      loadMyDeliveries();
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  // ✅ 9. Update Status - Delivered (with photo)
  const handleCompleteDelivery = async (photoUrls, notes) => {
    try {
      await request('order/complete-delivery', 'post', {
        order_id: selectedDelivery.order_id,
        latitude: currentLocation?.latitude,
        longitude: currentLocation?.longitude,
        accuracy: currentLocation?.accuracy,
        status: 'delivered',
        notes: notes || 'Delivery completed',
        photos: photoUrls
      });

      message.success('Delivery completed successfully!');
      setPhotoModalVisible(false);
      loadMyDeliveries();
      
      // Move to next delivery
      const nextDelivery = myDeliveries.find(
        d => d.order_id !== selectedDelivery.order_id && 
        (d.status === 'assigned' || d.status === 'in_transit')
      );
      setSelectedDelivery(nextDelivery);
    } catch (error) {
      message.error('Failed to complete delivery');
    }
  };

  // ✅ 10. រាយការណ៍បញ្ហា
  const handleReportIssue = async (issueType, description) => {
    try {
      await request('order/report-issue', 'post', {
        order_id: selectedDelivery.order_id,
        issue_type: issueType,
        description: description,
        latitude: currentLocation?.latitude,
        longitude: currentLocation?.longitude,
        accuracy: currentLocation?.accuracy
      });

      message.success('Issue reported successfully');
      setIssueModalVisible(false);
    } catch (error) {
      message.error('Failed to report issue');
    }
  };

  const handleEnableGPS = () => {
    setGpsModalVisible(true);
  };

  const getGpsStatusIcon = () => {
    switch(gpsStatus) {
      case 'tracking':
        return <MdLocationOn className="text-green-500 animate-pulse" />;
      case 'tracking_network':
        return <MdWifiTethering className="text-blue-500" />;
      case 'getting':
      case 'getting_network':
        return <MdRefresh className="text-yellow-500 animate-spin" />;
      case 'error':
        return <MdLocationOff className="text-red-500" />;
      default:
        return <MdLocationOff className="text-gray-400" />;
    }
  };

  const getGpsStatusText = () => {
    switch(gpsStatus) {
      case 'tracking':
        return `GPS Active (Accuracy: ${gpsAccuracy ? Math.round(gpsAccuracy) + 'm' : 'Good'})`;
      case 'tracking_network':
        return 'Network Location Active';
      case 'getting':
        return 'Acquiring GPS signal...';
      case 'getting_network':
        return 'Getting network location...';
      case 'error':
        return 'Location Error';
      default:
        return 'GPS Off';
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      assigned: 'blue',
      in_transit: 'orange',
      arrived: 'purple',
      delivered: 'green'
    };
    return colors[status] || 'default';
  };

  const isAtLocation = distanceToDestination !== null && distanceToDestination < 0.2;

  return (
    <div className="driver-app min-h-screen bg-gray-50 p-4">
      {/* GPS Status Alert */}
      {gpsError && gpsStatus === 'error' && (
        <Alert
          message="Location Error"
          description={gpsError}
          type="warning"
          showIcon
          action={
            <Button size="small" onClick={getNetworkLocation}>
              Try Network
            </Button>
          }
          closable
          onClose={() => setGpsError(null)}
          className="mb-4"
        />
      )}

      {/* Header - Driver Info */}
      <Card className="mb-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <MdLocalShipping />
              {driverInfo?.driver_name || 'Driver'}
            </h1>
            <p className="text-sm opacity-90">{driverInfo?.plate_number}</p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">GPS Tracking</span>
              <Switch
                checked={trackingEnabled}
                onChange={setTrackingEnabled}
                checkedChildren="ON"
                unCheckedChildren="OFF"
                disabled={gpsStatus === 'error'}
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              {getGpsStatusIcon()}
              <span>{getGpsStatusText()}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-white/10 rounded-lg p-2 text-center">
            <div className="text-2xl font-bold">{myDeliveries.length}</div>
            <div className="text-xs">Total</div>
          </div>
          <div className="bg-white/10 rounded-lg p-2 text-center">
            <div className="text-2xl font-bold">
              {myDeliveries.filter(d => d.status === 'in_transit' || d.status === 'assigned').length}
            </div>
            <div className="text-xs">Pending</div>
          </div>
          <div className="bg-white/10 rounded-lg p-2 text-center">
            <div className="text-2xl font-bold">
              {myDeliveries.filter(d => d.status === 'delivered').length}
            </div>
            <div className="text-xs">Completed</div>
          </div>
        </div>
      </Card>

      {/* Current Delivery */}
      {selectedDelivery && (
        <Card className="mb-4" title="Current Delivery">
          <div className="space-y-3">
            {/* Order Info */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg">{selectedDelivery.order_no}</h3>
                <p className="text-sm text-gray-500">
                  {moment(selectedDelivery.delivery_date).format('DD/MM/YYYY HH:mm')}
                </p>
              </div>
              <Tag color={getStatusColor(selectedDelivery.status)}>
                {selectedDelivery.status?.toUpperCase()}
              </Tag>
            </div>

            {/* Customer Info */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">{selectedDelivery.customer_name}</span>
                <Button
                  size="small"
                  icon={<MdPhone />}
                  onClick={handleCallCustomer}
                  type="primary"
                >
                  Call
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                📍 {selectedDelivery.location?.location_name}
              </p>
              <p className="text-xs text-gray-500">
                {selectedDelivery.location?.address}
              </p>
            </div>

            {/* GPS Status */}
            {trackingEnabled && (
              <div className={`p-3 rounded-lg ${gpsStatus === 'tracking' ? 'bg-green-50' : 'bg-yellow-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {getGpsStatusIcon()}
                  <span className="font-semibold">{getGpsStatusText()}</span>
                </div>
                
                {currentLocation && (
                  <div className="text-sm">
                    <p>Current Location:</p>
                    <code className="text-xs bg-gray-100 p-1 rounded">
                      {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                    </code>
                    {currentLocation.source === 'network' && (
                      <p className="text-xs text-yellow-600 mt-1">
                        ⚠️ Using network location (less accurate)
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Distance & Location Status */}
            {trackingEnabled && currentLocation && (
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Distance to destination</span>
                  <Badge
                    count={
                      distanceToDestination !== null
                        ? distanceToDestination < 1
                          ? `${Math.round(distanceToDestination * 1000)}m`
                          : `${distanceToDestination.toFixed(2)}km`
                        : '...'
                    }
                    style={{
                      backgroundColor: isAtLocation ? '#52c41a' : '#faad14'
                    }}
                  />
                </div>

                {isAtLocation && (
                  <div className="mt-2 flex items-center gap-2 text-green-600">
                    <MdCheckCircle />
                    <span className="font-semibold">At Destination!</span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              {/* Navigate */}
              <Button
                type="primary"
                size="large"
                block
                icon={<MdNavigation />}
                onClick={handleNavigate}
                disabled={!selectedDelivery?.location}
              >
                Navigate to Location
              </Button>

              {/* Status Actions */}
              {selectedDelivery.status === 'assigned' && (
                <Button
                  size="large"
                  block
                  onClick={handleStartDelivery}
                  style={{ backgroundColor: '#1890ff', color: 'white' }}
                >
                  Start Delivery
                </Button>
              )}

              {selectedDelivery.status === 'in_transit' && (
                <Button
                  size="large"
                  block
                  onClick={handleMarkArrived}
                  disabled={!isAtLocation}
                  style={{
                    backgroundColor: isAtLocation ? '#faad14' : undefined,
                    color: isAtLocation ? 'white' : undefined
                  }}
                >
                  {isAtLocation ? 'Mark as Arrived' : 'Not at Location'}
                </Button>
              )}

              {selectedDelivery.status === 'arrived' && (
                <Button
                  size="large"
                  block
                  onClick={() => setPhotoModalVisible(true)}
                  style={{ backgroundColor: '#52c41a', color: 'white' }}
                >
                  Complete Delivery
                </Button>
              )}

              {/* Additional Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  icon={<MdCamera />}
                  onClick={() => setPhotoModalVisible(true)}
                  disabled={!selectedDelivery}
                >
                  Add Photo
                </Button>
                <Button
                  icon={<MdNote />}
                  onClick={() => setNoteModalVisible(true)}
                  disabled={!selectedDelivery}
                >
                  Add Note
                </Button>
              </div>

              {/* Report Issue */}
              <Button
                danger
                icon={<MdWarning />}
                onClick={() => setIssueModalVisible(true)}
                block
                disabled={!selectedDelivery}
              >
                Report Issue
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* All Deliveries List */}
      <Card title="All Deliveries">
        {myDeliveries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No deliveries assigned
          </div>
        ) : (
          <div className="space-y-3">
            {myDeliveries.map((delivery) => (
              <div
                key={delivery.order_id}
                className={`p-3 border rounded-lg cursor-pointer ${
                  selectedDelivery?.order_id === delivery.order_id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
                onClick={() => setSelectedDelivery(delivery)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{delivery.order_no}</p>
                    <p className="text-sm text-gray-600">{delivery.customer_name}</p>
                    <p className="text-xs text-gray-500">
                      {delivery.location?.location_name}
                    </p>
                  </div>
                  <Tag color={getStatusColor(delivery.status)}>
                    {delivery.status}
                  </Tag>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Photo Upload Modal */}
      <DeliveryPhotoModal
        visible={photoModalVisible}
        onClose={() => setPhotoModalVisible(false)}
        onComplete={handleCompleteDelivery}
        orderId={selectedDelivery?.order_id}
      />

      {/* Note Modal */}
      <DeliveryNoteModal
        visible={noteModalVisible}
        onClose={() => setNoteModalVisible(false)}
        orderId={selectedDelivery?.order_id}
      />

      {/* Issue Report Modal */}
      <IssueReportModal
        visible={issueModalVisible}
        onClose={() => setIssueModalVisible(false)}
        onSubmit={handleReportIssue}
      />

      {/* GPS Permission Modal */}
      <GPSPermissionModal
        visible={gpsModalVisible}
        onClose={() => setGpsModalVisible(false)}
        onEnable={startGPSTracking}
      />
    </div>
  );
};

// GPS Permission Modal
const GPSPermissionModal = ({ visible, onClose, onEnable }) => {
  const instructions = [
    '1. Click the location icon in your browser address bar',
    '2. Select "Allow" or "Always allow"',
    '3. Refresh this page if needed',
    '4. Ensure your device GPS is turned on',
    '5. Go outside for better satellite signal'
  ];

  return (
    <Modal
      title="Enable Location Services"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="enable" type="primary" onClick={onEnable}>
          Try Again
        </Button>
      ]}
    >
      <div className="space-y-4">
        <Alert
          message="Location Permission Required"
          description="This app needs location access to track your deliveries."
          type="info"
          showIcon
        />
        
        <div>
          <h4 className="font-semibold mb-2">How to enable:</h4>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {instructions.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ul>
        </div>
        
        <div className="text-xs text-gray-500">
          <p>💡 <strong>Tip:</strong> For best results:</p>
          <p>- Use Chrome or Safari browser</p>
          <p>- Enable location services on your device</p>
          <p>- Connect to WiFi for initial location</p>
        </div>
      </div>
    </Modal>
  );
};

// Photo Upload Modal Component
const DeliveryPhotoModal = ({ visible, onClose, onComplete, orderId }) => {
  const [photos, setPhotos] = useState([]);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('order_id', orderId);

      const res = await request('delivery/upload-photo', 'post', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res && res.success) {
        setPhotos([...photos, res.photo_url]);
        message.success('Photo uploaded');
      }
    } catch (error) {
      message.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      title="Complete Delivery"
      open={visible}
      onCancel={onClose}
      onOk={() => onComplete(photos, notes)}
      okText="Complete"
      confirmLoading={uploading}
    >
      <div className="space-y-4">
        <div>
          <label className="block mb-2">Upload Photos (Optional)</label>
          <Upload
            beforeUpload={handleUpload}
            showUploadList={true}
            multiple
            disabled={uploading}
          >
            <Button icon={<MdCamera />} loading={uploading}>
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </Button>
          </Upload>
        </div>

        <div>
          <label className="block mb-2">Delivery Notes</label>
          <Input.TextArea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about the delivery..."
            rows={4}
          />
        </div>
      </div>
    </Modal>
  );
};

// Note Modal Component
const DeliveryNoteModal = ({ visible, onClose, orderId }) => {
  const [note, setNote] = useState('');

  const handleSave = async () => {
    try {
      await request('delivery/add-note', 'post', {
        order_id: orderId,
        note: note
      });
      message.success('Note saved');
      onClose();
    } catch (error) {
      message.error('Failed to save note');
    }
  };

  return (
    <Modal
      title="Add Note"
      open={visible}
      onCancel={onClose}
      onOk={handleSave}
    >
      <Input.TextArea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add your note here..."
        rows={6}
      />
    </Modal>
  );
};

// Issue Report Modal Component
const IssueReportModal = ({ visible, onClose, onSubmit }) => {
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');

  const issueTypes = [
    { value: 'customer_not_available', label: 'Customer Not Available' },
    { value: 'wrong_address', label: 'Wrong Address' },
    { value: 'road_closed', label: 'Road Closed' },
    { value: 'vehicle_issue', label: 'Vehicle Issue' },
    { value: 'weather', label: 'Bad Weather' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmit = () => {
    if (!issueType) {
      message.warning('Please select an issue type');
      return;
    }
    onSubmit(issueType, description);
  };

  return (
    <Modal
      title="Report Issue"
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Submit"
      okButtonProps={{ danger: true }}
    >
      <div className="space-y-4">
        <div>
          <label className="block mb-2">Issue Type *</label>
          <select
            className="w-full p-2 border rounded"
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            required
          >
            <option value="">Select issue type</option>
            {issueTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-2">Description</label>
          <Input.TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue in detail..."
            rows={6}
          />
        </div>
      </div>
    </Modal>
  );
};

export default CompleteDriverApp;