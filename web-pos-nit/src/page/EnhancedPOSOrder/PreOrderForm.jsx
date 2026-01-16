// ✅ FIXED: PreOrderForm.jsx - Correct Product Fetching

import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Input, DatePicker, InputNumber, Button, message, Table, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { request } from '../../util/helper';
import dayjs from 'dayjs';

const PreOrderForm = ({ visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orderItems, setOrderItems] = useState([]);

  useEffect(() => {
    if (visible) {
      fetchCustomers();
      fetchCategories();
    }
  }, [visible]);

  const fetchCustomers = async () => {
    try {
      const res = await request('customer/my-group', 'get');
      if (res && res.list) {
        setCustomers(res.list.map(c => ({
          label: `${c.name} (${c.tel})`,
          value: c.id,
          ...c
        })));
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  // ✅ FIXED: Fetch categories AND products separately
  const fetchCategories = async () => {
    try {
      // ✅ 1. Fetch categories
      const catRes = await request('category/my-group', 'get');
      if (catRes && catRes.list) {
        setCategories(catRes.list);
      }

      // ✅ 2. Fetch products SEPARATELY
      const prodRes = await request('product/my-group', 'get');
      
      
      if (prodRes && prodRes.list) {
        // ✅ Map products with category_name
        const productsWithCategory = prodRes.list.map(p => {
          const category = catRes.list?.find(c => c.id === p.category_id);
          return {
            ...p,
            category_name: category ? category.name : 'N/A',
            category_id: p.category_id
          };
        });
        
        
        setProducts(productsWithCategory);
      } else {
        console.warn('⚠️ No products found');
        setProducts([]);
      }
    } catch (error) {
      console.error('❌ Error fetching categories/products:', error);
      setProducts([]);
    }
  };

  // ✅ Get latest selling price from inventory_transaction
  const getLatestSellingPrice = async (productId, customerId) => {
    try {
      const res = await request(
        `inventory/latest-selling-price?product_id=${productId}&customer_id=${customerId}`,
        'get'
      );
      
      
      if (res && res.success && res.selling_price !== null) {
        return res.selling_price;
      }
      
      // Fallback: Get from product
      const product = products.find(p => p.id === productId);
      if (product && product.actual_price) {
        return parseFloat(product.actual_price);
      }
      
      // Fallback: Get from category
      if (product) {
        const category = categories.find(c => c.id === product.category_id);
        if (category && category.actual_price) {
          return parseFloat(category.actual_price);
        }
      }
      
      return 1000; // Default fallback
    } catch (error) {
      console.error('Error fetching selling price:', error);
      return 1000;
    }
  };

  const handleAddProduct = async () => {
    try {
      const values = await form.validateFields([
        'selected_category',
        'selected_product',
        'quantity',
        'customer_id'
      ]);

      const product = products.find(p => p.id === values.selected_product);
      const customer_id = form.getFieldValue('customer_id');

      if (!product) {
        message.error('សូមជ្រើសរើសផលិតផល');
        return;
      }

      if (!customer_id) {
        message.error('សូមជ្រើសរើសអតិថិជន');
        return;
      }

      // ✅ Get latest selling price from inventory_transaction
      const selling_price = await getLatestSellingPrice(product.id, customer_id);
      


      // Get actual_price
      let actual_price = 1000; // Default
      
      if (product.actual_price) {
        actual_price = parseFloat(product.actual_price);
      } else {
        const category = categories.find(c => c.id === product.category_id);
        if (category && category.actual_price) {
          actual_price = parseFloat(category.actual_price);
        }
      }


      const newItem = {
        key: Date.now(),
        product_id: product.id,
        product_name: product.name,
        category_name: product.category_name,
        quantity: values.quantity,
        price: selling_price, // ✅ Use latest selling price
        actual_price: actual_price,
        discount: 0,
        amount: (values.quantity * selling_price) / actual_price,
        unit: product.unit || 'L'
      };


      setOrderItems([...orderItems, newItem]);

      // Clear selection fields
      form.setFieldsValue({
        selected_category: undefined,
        selected_product: undefined,
        quantity: undefined,
      });

      message.success('✅ បានបន្ថែមផលិតផល');
    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  const handleRemoveItem = (key) => {
    setOrderItems(orderItems.filter(item => item.key !== key));
  };

  const handlePriceChange = (key, newPrice) => {
    setOrderItems(orderItems.map(item => {
      if (item.key === key) {
        const amount = (item.quantity * newPrice) / item.actual_price;
        return { ...item, price: newPrice, amount };
      }
      return item;
    }));
  };

  const handleQuantityChange = (key, newQty) => {
    setOrderItems(orderItems.map(item => {
      if (item.key === key) {
        const amount = (newQty * item.price) / item.actual_price;
        return { ...item, quantity: newQty, amount };
      }
      return item;
    }));
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (orderItems.length === 0) {
        message.error('សូមបន្ថែមផលិតផលយ៉ាងតិច 1');
        return;
      }

      setLoading(true);

      const customer = customers.find(c => c.value === values.customer_id);

      const total_amount = orderItems.reduce((sum, item) => sum + item.amount, 0);

      const data = {
        customer_id: values.customer_id,
        delivery_date: values.delivery_date ? values.delivery_date.format('YYYY-MM-DD') : null,
        delivery_time: values.delivery_time || null,
        delivery_address: values.delivery_address || customer?.address || null,
        special_instructions: values.special_instructions || null,
        products: orderItems.map(item => ({
          product_id: item.product_id,
          qty: item.quantity,
          price: item.price, // ✅ Price from inventory_transaction or manual edit
          discount: item.discount || 0
        })),
        deposit_amount: values.deposit_amount || 0,
        payment_method: values.payment_method || 'cash'
      };


      const res = await request('pre-order/create', 'post', data);

      if (res && res.success) {
        message.success('✅ បានបង្កើត Pre-Order ជោគជ័យ!');
        form.resetFields();
        setOrderItems([]);
        onSuccess?.();
        onCancel();
      } else {
        message.error(res?.message || 'មិនអាចបង្កើត Pre-Order បានទេ');
      }
    } catch (error) {
      console.error('Error creating pre-order:', error);
      message.error('កំហុសក្នុងការបង្កើត Pre-Order');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'ផលិតផល',
      dataIndex: 'product_name',
      key: 'product_name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: '600' }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            {record.category_name}
          </div>
        </div>
      )
    },
    {
      title: 'បរិមាណ',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (value, record) => (
        <InputNumber
          value={value}
          min={1}
          onChange={(val) => handleQuantityChange(record.key, val)}
          style={{ width: '100%' }}
          addonAfter="L"
        />
      )
    },
    {
      title: 'តម្លៃ/ឯកតា',
      dataIndex: 'price',
      key: 'price',
      width: 150,
      render: (value, record) => (
        <div>
          <InputNumber
            value={value}
            min={0}
            step={0.001}
            precision={3}
            onChange={(val) => handlePriceChange(record.key, val)}
            style={{ width: '100%' }}
            addonBefore="$"
          />
          <div style={{ 
            fontSize: '11px', 
            color: '#52c41a', 
            marginTop: '4px',
            fontWeight: '600'
          }}>
            ✓ តម្លៃចុងក្រោយពី Inventory
          </div>
        </div>
      )
    },
    {
      title: 'សរុប',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (value) => (
        <span style={{ fontWeight: '600', color: '#52c41a' }}>
          ${value.toFixed(2)}
        </span>
      )
    },
    {
      title: '',
      key: 'action',
      width: 60,
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveItem(record.key)}
        />
      )
    }
  ];

  const total_amount = orderItems.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PlusOutlined style={{ color: '#1890ff' }} />
          <span>បង្កើត Pre-Order ថ្មី</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width={1000}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          បោះបង់
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
          disabled={orderItems.length === 0}
        >
          រក្សាទុក
        </Button>
      ]}
    >
      <Form form={form} layout="vertical">
        <div style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '16px', 
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <h4>ព័ត៌មានអតិថិជន</h4>
          
          <Form.Item
            label="អតិថិជន"
            name="customer_id"
            rules={[{ required: true, message: 'សូមជ្រើសរើសអតិថិជន' }]}
          >
            <Select
              showSearch
              placeholder="ជ្រើសរើសអតិថិជន"
              options={customers}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item
            label="ទីតាំងដឹកជញ្ជូន"
            name="delivery_address"
          >
            <Input.TextArea 
              placeholder="បញ្ចូលអាសយដ្ឋាន..." 
              rows={2}
            />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item label="ថ្ងៃដឹកជញ្ជូន" name="delivery_date">
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>

            <Form.Item label="ម៉ោងដឹកជញ្ជូន" name="delivery_time">
              <Input placeholder="Ex: 09:00 AM" />
            </Form.Item>
          </div>

          <Form.Item label="សំណាំងពិសេស" name="special_instructions">
            <Input.TextArea 
              placeholder="បញ្ចូលសំណាំងពិសេស (ប្រសិនបើមាន)..." 
              rows={2}
            />
          </Form.Item>
        </div>

        <div style={{ 
          backgroundColor: '#fff7e6', 
          padding: '16px', 
          borderRadius: '8px',
          marginBottom: '16px',
          border: '1px solid #ffd666'
        }}>
          <h4>បញ្ចូលផលិតផល</h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
            <Form.Item label="ប្រភេទ" name="selected_category">
              <Select
                placeholder="ជ្រើសរើសប្រភេទ"
                options={categories.map(c => ({
                  label: c.name,
                  value: c.id
                }))}
                onChange={(catId) => {
                  // Filter products by category
                  form.setFieldsValue({ selected_product: undefined });
                }}
              />
            </Form.Item>

            <Form.Item label="ផលិតផល" name="selected_product">
              <Select
                placeholder="ជ្រើសរើសផលិតផល"
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={products
                  .filter(p => {
                    const selectedCat = form.getFieldValue('selected_category');
                    return selectedCat ? p.category_id === selectedCat : true;
                  })
                  .map(p => ({
                    label: `${p.name} (${p.category_name})`,
                    value: p.id
                  }))}
              />
            </Form.Item>

            <Form.Item label="បរិមាណ (L)" name="quantity">
              <InputNumber
                placeholder="11000"
                style={{ width: '100%' }}
                min={1}
              />
            </Form.Item>

            <Form.Item label=" ">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddProduct}
              >
                បន្ថែម
              </Button>
            </Form.Item>
          </div>

          <div style={{ 
            fontSize: '12px', 
            color: '#fa8c16',
            marginTop: '-8px',
            padding: '8px',
            backgroundColor: '#fff',
            borderRadius: '4px'
          }}>
            💡 <strong>ចំណាំ:</strong> តម្លៃនឹងត្រូវបានទាញយកស្វ័យប្រវត្តិពី Inventory Transaction (តម្លៃលក់ចុងក្រោយ)
          </div>
        </div>

        {orderItems.length > 0 && (
          <>
            <Table
              columns={columns}
              dataSource={orderItems}
              pagination={false}
              size="small"
              style={{ marginBottom: '16px' }}
            />

            <div style={{
              backgroundColor: '#f6ffed',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #b7eb8f'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '16px', fontWeight: '600' }}>សរុប:</span>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
                  ${total_amount.toFixed(2)}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Form.Item label="ប្រាក់កក់" name="deposit_amount">
                  <InputNumber
                    placeholder="0.00"
                    style={{ width: '100%' }}
                    min={0}
                    max={total_amount}
                    addonBefore="$"
                  />
                </Form.Item>

                <Form.Item label="វិធីទូទាត់" name="payment_method">
                  <Select
                    placeholder="ជ្រើសរើស"
                    options={[
                      { label: 'សាច់ប្រាក់', value: 'cash' },
                      { label: 'ឆែក', value: 'check' },
                      { label: 'ផ្ទេរប្រាក់', value: 'transfer' }
                    ]}
                  />
                </Form.Item>
              </div>
            </div>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default PreOrderForm;