import React, { useState, useEffect } from 'react';
import { Card, Button, Input, message, Tag, Avatar } from 'antd';
import { MdPerson, MdPhone, MdLocalShipping, MdQrCode } from 'react-icons/md';
import { request } from '../../util/helper';
import { getProfile } from '../../store/profile.store';

/**
 * Driver Authentication System
 * 
 * 3 Ways to identify driver:
 * 1. Phone Number (from user account)
 * 2. Truck Assignment (manual assignment)
 * 3. QR Code Scan (quick assignment)
 */

const DriverAuthSystem = () => {
  const [loading, setLoading] = useState(false);
  const [driverInfo, setDriverInfo] = useState(null);
  const [authMethod, setAuthMethod] = useState('tel'); // phone, truck, qr

  useEffect(() => {
    checkDriverAuth();
  }, []);

  // ✅ Method 1: Phone Number Authentication
  const checkDriverAuth = async () => {
    setLoading(true);
    try {
      const profile = getProfile();
      
      // Check if user's phone matches any truck driver
      const res = await request('driver/check-auth', 'get', {
        user_id: profile.id,
        phone: profile.phone
      });

      if (res && res.success) {
        setDriverInfo(res.driver_info);
        localStorage.setItem('driver_info', JSON.stringify(res.driver_info));
      }
    } catch (error) {
      console.error('Driver auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="driver-auth-system p-4">
      <Card title="Driver Authentication">
        {driverInfo ? (
          <DriverIdentityCard driverInfo={driverInfo} />
        ) : (
          <DriverAuthMethods 
            onAuthSuccess={(info) => setDriverInfo(info)} 
          />
        )}
      </Card>
    </div>
  );
};

// Driver Identity Card
const DriverIdentityCard = ({ driverInfo }) => {
  return (
    <div className="driver-identity-card bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-xl">
      <div className="flex items-center gap-4 mb-4">
        <Avatar size={64} icon={<MdPerson />} />
        <div>
          <h2 className="text-2xl font-bold">{driverInfo.driver_name}</h2>
          <p className="text-blue-100">{driverInfo.driver_phone}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-white/10 p-3 rounded-lg">
          <div className="text-xs text-blue-100">Truck</div>
          <div className="font-semibold flex items-center gap-2">
            <MdLocalShipping />
            {driverInfo.plate_number}
          </div>
        </div>
        <div className="bg-white/10 p-3 rounded-lg">
          <div className="text-xs text-blue-100">Status</div>
          <Tag color="green">Active</Tag>
        </div>
      </div>
    </div>
  );
};

// Driver Auth Methods
const DriverAuthMethods = ({ onAuthSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [truckId, setTruckId] = useState('');

  const handlePhoneAuth = async () => {
    try {
      const res = await request('driver/auth-by-phone', 'post', {
        phone: phoneNumber
      });

      if (res && res.success) {
        onAuthSuccess(res.driver_info);
        message.success('Driver authenticated successfully!');
      } else {
        message.error('Driver not found with this phone number');
      }
    } catch (error) {
      message.error('Authentication failed');
    }
  };

  const handleTruckAuth = async () => {
    try {
      const res = await request('driver/auth-by-truck', 'post', {
        truck_id: truckId
      });

      if (res && res.success) {
        onAuthSuccess(res.driver_info);
        message.success('Driver authenticated successfully!');
      } else {
        message.error('Driver not found for this truck');
      }
    } catch (error) {
      message.error('Authentication failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Method 1: Phone Number */}
      <div className="border-b pb-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <MdPhone className="text-blue-500" />
          Method 1: Phone Number
        </h3>
        <div className="flex gap-2">
          <Input
            placeholder="Enter phone number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            prefix={<MdPhone />}
          />
          <Button type="primary" onClick={handlePhoneAuth}>
            Verify
          </Button>
        </div>
      </div>

      {/* Method 2: Truck Selection */}
      <div className="border-b pb-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <MdLocalShipping className="text-green-500" />
          Method 2: Truck Selection
        </h3>
        <div className="flex gap-2">
          <Input
            placeholder="Enter truck ID or plate number"
            value={truckId}
            onChange={(e) => setTruckId(e.target.value)}
            prefix={<MdLocalShipping />}
          />
          <Button type="primary" onClick={handleTruckAuth}>
            Verify
          </Button>
        </div>
      </div>

      {/* Method 3: QR Code */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <MdQrCode className="text-purple-500" />
          Method 3: QR Code Scan
        </h3>
        <Button type="dashed" block>
          Scan QR Code
        </Button>
      </div>
    </div>
  );
};

export default DriverAuthSystem;