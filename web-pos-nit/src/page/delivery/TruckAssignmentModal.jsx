import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Button, message, Card, Row, Col } from 'antd';
import { MdLocalShipping, MdPerson, MdPhone } from 'react-icons/md';
import { useTranslation } from '../../locales/TranslationContext';
import { request } from '../../util/helper';

const TruckAssignmentModal = ({ visible, orderId, orderNo, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [trucks, setTrucks] = useState([]);
  const [selectedTruck, setSelectedTruck] = useState(null);

  useEffect(() => {
    if (visible) {
      loadTrucks();
      form.resetFields();
    }
  }, [visible]);

  const loadTrucks = async () => {
    setLoading(true);
    try {
      // Assuming you have a trucks endpoint
      const res = await request('trucks?status=active', 'get');
      if (res && res.list) {
        setTrucks(res.list);
      }
    } catch (error) {
      console.error('Error loading trucks:', error);
      message.error(t('failed_to_load_trucks'));
    } finally {
      setLoading(false);
    }
  };

  const handleTruckChange = (truckId) => {
    const truck = trucks.find(t => t.id === truckId);
    setSelectedTruck(truck);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const res = await request(`orders/${orderId}/assign-truck`, 'put', {
        order_id: orderId,
        truck_id: values.truck_id,
        driver_id: selectedTruck?.driver_id || null
      });

      if (res && res.success) {
        message.success(t('truck_assigned_successfully'));

        if (onSuccess) {
          onSuccess();
        }

        onClose();
      } else {
        message.error(res.message || t('failed_to_assign_truck'));
      }
    } catch (error) {
      console.error('Error assigning truck:', error);
      message.error(t('failed_to_assign_truck'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <MdLocalShipping className="text-blue-500" />
          <span>{t('assign_truck')} - {orderNo}</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          {t('cancel')}
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={submitting}
          onClick={handleSubmit}
        >
          {t('assign')}
        </Button>
      ]}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          label={t('select_truck')}
          name="truck_id"
          rules={[{ required: true, message: t('please_select_truck') }]}
        >
          <Select
            placeholder={t('select_truck')}
            loading={loading}
            onChange={handleTruckChange}
            showSearch
            optionFilterProp="label"
          >
            {trucks.map(truck => (
              <Select.Option key={truck.id} value={truck.id} label={truck.plate_number}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{truck.plate_number}</span>
                  <span className="text-xs text-gray-500">
                    {truck.truck_type} - {truck.capacity_liters}L
                  </span>
                </div>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* Truck Details Preview */}
        {selectedTruck && (
          <Card size="small" className="mb-4 bg-blue-50">
            <Row gutter={16}>
              <Col span={12}>
                <div className="space-y-2">
                  <div>
                    <div className="text-xs text-gray-500">{t('truck_type')}</div>
                    <div className="font-medium">{selectedTruck.truck_type}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">{t('capacity')}</div>
                    <div className="font-medium">{selectedTruck.capacity_liters}L</div>
                  </div>
                  {selectedTruck.fuel_type && (
                    <div>
                      <div className="text-xs text-gray-500">{t('fuel_type')}</div>
                      <div className="font-medium">{selectedTruck.fuel_type}</div>
                    </div>
                  )}
                </div>
              </Col>
              <Col span={12}>
                {selectedTruck.driver_name && (
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <MdPerson /> {t('driver')}
                      </div>
                      <div className="font-medium">{selectedTruck.driver_name}</div>
                    </div>
                    {selectedTruck.driver_phone && (
                      <div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <MdPhone /> {t('phone')}
                        </div>
                        <a
                          href={`tel:${selectedTruck.driver_phone}`}
                          className="font-medium text-blue-600"
                        >
                          {selectedTruck.driver_phone}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </Col>
            </Row>
          </Card>
        )}

        <div className="bg-yellow-50 p-3 rounded text-sm">
          <strong>{t('note')}:</strong> {t('assigning_truck_will_update_order_status')}
        </div>
      </Form>
    </Modal>
  );
};

export default TruckAssignmentModal;