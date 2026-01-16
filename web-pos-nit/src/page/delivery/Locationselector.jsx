import React, { useEffect, useState, useCallback } from "react";
import {
  Button,
  Select,
  Tag,
  message,
  Space,
  Tooltip,
  Modal,
  Form,
  Input,
} from "antd";
import { MdLocationOn, MdAdd, MdLocalShipping } from "react-icons/md";
import { request } from "../../util/helper";
import { useTranslation } from "../../locales/TranslationContext";

/**
 * Location Selector Component for PosPage
 * 
 * This component should be integrated into your existing PosPage
 * Add it to the cart/summary section
 */
function LocationSelector({ 
  customerId, 
  selectedLocation, 
  onLocationChange,
  selectedTruck,
  onTruckChange 
}) {
  const { t } = useTranslation();
  const [locations, setLocations] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [form] = Form.useForm();

  // Load locations when customer changes
  useEffect(() => {
    if (customerId) {
      loadLocations();
      loadAvailableTrucks();
    } else {
      setLocations([]);
      setTrucks([]);
    }
  }, [customerId]);

  const loadLocations = async () => {
    try {
      const res = await request(`locations/customer/${customerId}`, "get");
      if (res && res.success) {
        const locationList = res.locations || [];
        setLocations(locationList);
        
        // Auto-select default location
        const defaultLocation = locationList.find(loc => loc.is_default);
        if (defaultLocation && !selectedLocation) {
          onLocationChange(defaultLocation.id);
        }
      }
    } catch (error) {
      console.error("Error loading locations:", error);
    }
  };

  const loadAvailableTrucks = async () => {
    try {
      const res = await request("trucks/available/list", "get");
      if (res && res.success) {
        setTrucks(res.trucks || []);
      }
    } catch (error) {
      console.error("Error loading trucks:", error);
    }
  };

  const handleQuickAddLocation = async () => {
    try {
      const values = await form.validateFields();
      
      const locationData = {
        customer_id: customerId,
        location_name: values.location_name,
        address: values.address,
        status: 1,
      };
      
      const res = await request("locations", "post", locationData);
      if (res && res.success) {
        message.success(t("location_created"));
        setShowAddLocation(false);
        form.resetFields();
        loadLocations();
      } else {
        message.error(res?.message || t("failed_to_create"));
      }
    } catch (error) {
      console.error("Error creating location:", error);
      message.error(t("failed_to_create"));
    }
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      {/* Location Selector */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          marginBottom: '8px'
        }}>
          <MdLocationOn style={{ fontSize: '20px', color: '#1890ff' }} />
          <span style={{ fontWeight: '600', fontSize: '14px' }}>
            {t("delivery_location")} *
          </span>
        </div>
        
        <Space.Compact style={{ width: '100%' }}>
          <Select
            style={{ flex: 1 }}
            placeholder={t("select_delivery_location")}
            value={selectedLocation}
            onChange={onLocationChange}
            loading={loading}
            showSearch
            optionFilterProp="children"
            notFoundContent={
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <MdLocationOn style={{ fontSize: '48px', color: '#d9d9d9' }} />
                <div style={{ marginTop: '8px', color: '#888' }}>
                  {t("no_locations_found")}
                </div>
                <Button 
                  type="link" 
                  onClick={() => setShowAddLocation(true)}
                >
                  {t("add_first_location")}
                </Button>
              </div>
            }
          >
            {locations.map(location => (
              <Select.Option key={location.id} value={location.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MdLocationOn style={{ 
                    color: location.is_default ? '#faad14' : '#1890ff' 
                  }} />
                  <span>{location.location_name}</span>
                  {location.is_default && (
                    <Tag color="gold" style={{ marginLeft: 'auto' }}>
                      {t("default")}
                    </Tag>
                  )}
                </div>
                {location.address && (
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#888',
                    marginLeft: '24px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {location.address}
                  </div>
                )}
              </Select.Option>
            ))}
          </Select>
          
          <Tooltip title={t("add_new_location")}>
            <Button
              icon={<MdAdd />}
              onClick={() => setShowAddLocation(true)}
            />
          </Tooltip>
        </Space.Compact>

        {/* Show selected location details */}
        {selectedLocation && (
          <div style={{
            marginTop: '8px',
            padding: '8px 12px',
            backgroundColor: '#f0f5ff',
            borderRadius: '6px',
            border: '1px solid #adc6ff'
          }}>
            {(() => {
              const location = locations.find(l => l.id === selectedLocation);
              return location ? (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: '#1d39c4' }}>
                    📍 {location.location_name}
                  </div>
                  {location.address && (
                    <div style={{ fontSize: '12px', color: '#597ef7', marginTop: '4px' }}>
                      {location.address}
                    </div>
                  )}
                  {location.latitude && location.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}
                    >
                      {t("view_on_map")} →
                    </a>
                  )}
                </div>
              ) : null;
            })()}
          </div>
        )}
      </div>

      {/* Truck Selector */}
      <div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          marginBottom: '8px'
        }}>
          <MdLocalShipping style={{ fontSize: '20px', color: '#52c41a' }} />
          <span style={{ fontWeight: '600', fontSize: '14px' }}>
            {t("delivery_truck")}
          </span>
          <Tag color="orange" style={{ marginLeft: 'auto' }}>
            {t("optional")}
          </Tag>
        </div>
        
        <Select
          style={{ width: '100%' }}
          placeholder={t("select_delivery_truck")}
          value={selectedTruck}
          onChange={onTruckChange}
          allowClear
          showSearch
          optionFilterProp="children"
        >
          {trucks.map(truck => (
            <Select.Option key={truck.id} value={truck.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MdLocalShipping style={{ color: '#52c41a' }} />
                <span style={{ fontWeight: '500' }}>{truck.plate_number}</span>
                {truck.driver_name && (
                  <span style={{ fontSize: '12px', color: '#888' }}>
                    - {truck.driver_name}
                  </span>
                )}
                {truck.active_deliveries > 0 && (
                  <Tag color="orange" style={{ marginLeft: 'auto' }}>
                    {truck.active_deliveries} {t("active")}
                  </Tag>
                )}
              </div>
            </Select.Option>
          ))}
        </Select>

        {selectedTruck && (
          <div style={{
            marginTop: '8px',
            padding: '8px 12px',
            backgroundColor: '#f6ffed',
            borderRadius: '6px',
            border: '1px solid #b7eb8f'
          }}>
            {(() => {
              const truck = trucks.find(t => t.id === selectedTruck);
              return truck ? (
                <div style={{ fontSize: '13px' }}>
                  <div style={{ fontWeight: '500', color: '#389e0d' }}>
                    🚚 {truck.plate_number}
                  </div>
                  {truck.driver_name && (
                    <div style={{ fontSize: '12px', color: '#52c41a', marginTop: '4px' }}>
                      {t("driver")}: {truck.driver_name}
                      {truck.driver_phone && ` (${truck.driver_phone})`}
                    </div>
                  )}
                </div>
              ) : null;
            })()}
          </div>
        )}
      </div>

      {/* Quick Add Location Modal */}
      <Modal
        title={t("quick_add_location")}
        open={showAddLocation}
        onOk={handleQuickAddLocation}
        onCancel={() => {
          setShowAddLocation(false);
          form.resetFields();
        }}
        okText={t("add")}
        cancelText={t("cancel")}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="location_name"
            label={t("location_name")}
            rules={[{ required: true, message: t("location_name_required") }]}
          >
            <Input placeholder={t("enter_location_name")} />
          </Form.Item>
          
          <Form.Item
            name="address"
            label={t("address")}
            rules={[{ required: true, message: t("address_required") }]}
          >
            <Input.TextArea 
              rows={3} 
              placeholder={t("enter_full_address")} 
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default LocationSelector;

/**
 * INTEGRATION INSTRUCTIONS:
 * 
 * 1. In your PosPage.jsx, import this component:
 *    import LocationSelector from './LocationSelector';
 * 
 * 2. Add state for location and truck:
 *    const [selectedLocation, setSelectedLocation] = useState(null);
 *    const [selectedTruck, setSelectedTruck] = useState(null);
 * 
 * 3. Add the component in your cart/summary section (before checkout):
 *    <LocationSelector
 *      customerId={objSummary.customer_id}
 *      selectedLocation={selectedLocation}
 *      onLocationChange={setSelectedLocation}
 *      selectedTruck={selectedTruck}
 *      onTruckChange={setSelectedTruck}
 *    />
 * 
 * 4. Update your handleClickOut function to include location validation:
 *    if (!selectedLocation) {
 *      message.error(t("please_select_delivery_location"));
 *      return;
 *    }
 * 
 * 5. Update your order creation to include location_id and truck_id:
 *    const param = {
 *      order: {
 *        ...customerInfo,
 *        location_id: selectedLocation,
 *        truck_id: selectedTruck,
 *        // ... rest of order data
 *      },
 *      order_details: order_details,
 *    };
 * 
 * 6. Clear location/truck when clearing cart:
 *    const handleClearCart = () => {
 *      // ... existing clear logic
 *      setSelectedLocation(null);
 *      setSelectedTruck(null);
 *    };
 */