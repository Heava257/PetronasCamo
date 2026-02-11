// PreOrderQuickSelect.jsx - Component for selecting Pre-Orders in POS
import React, { useEffect, useState } from 'react';
import { Select, Button, message, Tag, Spin, Alert } from 'antd';
import Swal from 'sweetalert2';
import { ThunderboltOutlined, ReloadOutlined } from '@ant-design/icons';
import { request } from '../../util/helper';
import dayjs from 'dayjs';

const PreOrderQuickSelect = ({
  onSelectPreOrder,
  onClearSelection,
  disabled = false,
  style = {}
}) => {
  const [preOrders, setPreOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedValue, setSelectedValue] = useState(null);

  useEffect(() => {
    fetchPreOrders();
  }, []);

  const fetchPreOrders = async () => {
    setLoading(true);
    try {
      // Call the backend API to get pre-orders
      const res = await request("pre-order/list", "get");


      if (res && res.success && res.list) {
        // Filter only confirmed/ready pre-orders
        const activeOrders = res.list.filter(
          order => order.status === 'confirmed' || order.status === 'ready'
        );

        setPreOrders(activeOrders);

        if (activeOrders.length === 0) {
          Swal.fire({
            icon: 'info',
            title: 'Information',
            text: "មិនមាន Pre-Order ដែលត្រៀមរួចរាល់ទេ",
          });
        }
      } else {
        console.warn("⚠️ No pre-orders found in response");
        setPreOrders([]);
      }
    } catch (error) {
      console.error("❌ Error fetching pre-orders:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: "មិនអាចផ្ទុកបញ្ជីកម្មង់ជាមុនបានទេ",
      });
      setPreOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (value) => {
    if (!value) {
      setSelectedValue(null);
      onClearSelection?.();
      return;
    }

    const selectedPreOrder = preOrders.find(po => po.id === value);
    if (!selectedPreOrder) return;

    setSelectedValue(value);

    if (onSelectPreOrder) {
      await onSelectPreOrder(selectedPreOrder);
    }
  };

  const formatPreOrderOption = (preOrder) => {
    // Handle both possible field names from backend
    const totalAmount = parseFloat(preOrder.total_amount || 0);
    const deliveryDate = preOrder.delivery_date
      ? dayjs(preOrder.delivery_date).format('DD/MM/YYYY')
      : '-';
    const orderDate = preOrder.order_date
      ? dayjs(preOrder.order_date).format('DD/MM/YYYY')
      : '-';

    return {
      value: preOrder.id,
      label: (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 0'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#1a1a1a',
              marginBottom: '4px',
              fontFamily: 'Khmer OS Battambang'
            }}>
              {preOrder.customer_name || 'N/A'}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#8c8c8c',
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <span>📋 {preOrder.pre_order_no}</span>
              <span>📅 {deliveryDate}</span>
              <span style={{
                backgroundColor: preOrder.status === 'confirmed' ? '#e6f7ff' : '#f6ffed',
                color: preOrder.status === 'confirmed' ? '#1890ff' : '#52c41a',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600'
              }}>
                {preOrder.status === 'confirmed' ? 'បានបញ្ជាក់' : 'រៀបចំរួច'}
              </span>
            </div>
          </div>
          <div style={{
            textAlign: 'right',
            marginLeft: '16px'
          }}>
            <Tag color="green" style={{
              margin: 0,
              fontSize: '13px',
              fontWeight: '600',
              padding: '4px 12px'
            }}>
              ${totalAmount.toFixed(2)}
            </Tag>
          </div>
        </div>
      ),
      searchText: `${preOrder.customer_name || ''} ${preOrder.pre_order_no || ''}`.toLowerCase(),
      preOrder: preOrder // Keep full object for reference
    };
  };

  const options = preOrders.map(formatPreOrderOption);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)',
      padding: '16px',
      borderRadius: '12px',
      border: '2px solid #91d5ff',
      marginBottom: '16px',
      ...style
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ThunderboltOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
          <span style={{
            fontSize: '15px',
            fontWeight: '700',
            color: '#0050b3'
          }}>
            Quick Select Pre-Order
          </span>
          {preOrders.length > 0 && (
            <Tag color="processing" style={{ margin: 0 }}>
              {preOrders.length} កម្មង់
            </Tag>
          )}
        </div>
        <Button
          type="text"
          size="small"
          icon={<ReloadOutlined />}
          onClick={fetchPreOrders}
          loading={loading}
          style={{
            color: '#1890ff',
            fontWeight: '600'
          }}
        >
          ផ្ទុកឡើងវិញ
        </Button>
      </div>

      {/* Info Alert */}
      {!selectedValue && (
        <Alert
          message="ជ្រើសរើសកម្មង់ជាមុន ដើម្បីបញ្ចូលទៅ Cart ភ្លាមៗ"
          type="info"
          showIcon
          style={{
            marginBottom: '12px',
            fontSize: '13px',
            backgroundColor: '#f0f5ff',
            border: '1px solid #d6e4ff'
          }}
        />
      )}

      {/* Select Dropdown */}
      <Select
        value={selectedValue}
        onChange={handleSelect}
        placeholder="🔍 ស្វែងរក Pre-Order តាមឈ្មោះអតិថិជន..."
        options={options}
        disabled={disabled}
        loading={loading}
        allowClear
        showSearch
        filterOption={(input, option) => {
          return (option?.searchText || '').includes(input.toLowerCase());
        }}
        style={{ width: '100%' }}
        size="large"
        dropdownStyle={{ maxHeight: 400 }}
        notFoundContent={
          loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin />
              <div style={{ marginTop: '8px', color: '#8c8c8c' }}>
                កំពុងផ្ទុក...
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
              <div style={{ color: '#8c8c8c' }}>
                មិនមានកម្មង់ជាមុនទេ
              </div>
            </div>
          )
        }
      />

      {/* Selected Info */}
      {selectedValue && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          background: '#f6ffed',
          border: '1px solid #b7eb8f',
          borderRadius: '8px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#52c41a',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            ✅ Pre-Order បានជ្រើសរើស - ផលិតផលត្រូវបានបញ្ចូលទៅ Cart
          </div>
        </div>
      )}
    </div>
  );
};

export default PreOrderQuickSelect;