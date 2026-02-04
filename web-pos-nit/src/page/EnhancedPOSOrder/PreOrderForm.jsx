import React, { useState, useEffect } from "react";
import { Modal, Form, Select, Input, InputNumber, Button, DatePicker, message, Row, Col, Space, Typography, Divider } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { request, formatPrice } from "../../util/helper";
import dayjs from "dayjs";
import "./PreOrderManagement.css";

const { Text } = Typography;

const PreOrderForm = ({ visible, editRecord, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (visible) {
      if (editRecord) {
        loadEditData();
      } else {
        form.resetFields();
        setTotalAmount(0);
        form.setFieldsValue({
          products: [{}],
          order_date: dayjs()
        });
      }
      fetchCustomers();
      fetchProducts();
      fetchSuppliers();
    }
  }, [visible, editRecord]);

  const loadEditData = async () => {
    try {
      const res = await request(`pre-order/${editRecord.id}`, "get");
      if (res && res.success) {
        const data = res.data;

        const instructions = parseSpecialInstructions(data.special_instructions);

        form.setFieldsValue({
          pre_order_no: data.pre_order_no,
          customer_id: data.customer_id,
          order_date: data.order_date ? dayjs(data.order_date) : dayjs(),
          delivery_date: data.delivery_date ? dayjs(data.delivery_date) : null,
          supplier_name: instructions.supplier,
          delivery_address: data.delivery_address,
          products: data.details.map(d => ({
            product_id: d.product_id,
            qty: d.qty,
            price: d.price,
            destination: d.destination
          }))
        });

        calculateTotal();
      }
    } catch (error) {
      console.error("Error loading edit data:", error);
      message.error("Failed to load data");
    }
  };

  const parseSpecialInstructions = (str) => {
    if (!str) return {};
    const parts = str.split('|').map(s => s.trim());
    return {
      supplier: parts.find(s => s.startsWith('Supplier:'))?.replace('Supplier:', '').trim() || '',
    };
  };

  const fetchCustomers = async () => {
    try {
      const res = await request("customer/my-group", "get");
      if (res && res.list) {
        setCustomers(res.list.map(c => ({
          label: `${c.name} (${c.tel})`,
          value: c.id,
          address: c.address,
          ...c
        })));
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await request("product/my-group", "get");
      if (res && res.list) {
        setProducts(res.list);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await request("supplier", "get");
      if (res && res.list) {
        setSuppliers(res.list.map(s => ({
          label: s.name,
          value: s.name
        })));
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const handleCustomerSelect = (customerId) => {
    const customer = customers.find(c => c.value === customerId);
    if (customer && customer.address) {
      form.setFieldsValue({
        delivery_address: customer.address
      });
    }
  };

  const handleProductSelect = (productId, fieldName) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const productsList = form.getFieldValue('products');
      productsList[fieldName].price = product.unit_price;
      form.setFieldsValue({ products: productsList });
      calculateTotal();
    }
  };

  const calculateTotal = () => {
    const values = form.getFieldsValue();
    const productsList = values.products || [];
    let total = 0;

    productsList.forEach(item => {
      if (item && item.qty && item.price) {
        const prod = products.find(p => p.id === item.product_id);
        const actualPrice = prod ? (parseFloat(prod.actual_price) || 1) : 1;
        total += (parseFloat(item.qty) * parseFloat(item.price)) / actualPrice;
      }
    });
    setTotalAmount(total);
  };

  const onFinish = async (values) => {
    setLoading(true);

    const validProducts = (values.products || []).filter(p => p.product_id && p.qty > 0);

    if (validProducts.length === 0) {
      message.error("សូមជ្រើសរើសមុខទំនិញយ៉ាងហោចណាស់មួយ");
      setLoading(false);
      return;
    }

    const payload = {
      pre_order_no: values.pre_order_no,
      customer_id: values.customer_id,
      order_date: values.order_date ? values.order_date.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
      delivery_date: values.delivery_date ? values.delivery_date.format('YYYY-MM-DD') : null,
      delivery_address: values.delivery_address,
      special_instructions: `Supplier: ${values.supplier_name || 'N/A'} | Received: Pending`,
      status: 'confirmed',
      products: validProducts.map(p => ({
        product_id: p.product_id,
        qty: parseFloat(p.qty),
        price: parseFloat(p.price),
        discount: 0,
        // Fallback to global supplier_name if item destination is empty
        destination: p.destination || values.supplier_name || null
      }))
    };

    try {
      const isEdit = !!editRecord;
      const url = isEdit ? `pre-order/${editRecord.id}` : "pre-order/create";
      const method = isEdit ? "put" : "post";

      const res = await request(url, method, payload);

      if (res && res.success) {
        message.success(res.message || (isEdit ? "បានកែប្រែជោគជ័យ" : "Pre-Order created successfully"));
        onSuccess();
      } else {
        message.error(res.message || "Failed to save Pre-Order");
      }
    } catch (error) {
      console.error("Submit error", error);
      message.error("System Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <span style={{ fontSize: 20, fontWeight: 'bold', color: '#FFD700' }} className="khmer-text-product">
          {editRecord ? 'កែសម្រួល Pre-Order' : 'ការកម្ម៉ង់ថ្មី'}
        </span>
      }
      open={visible}
      onCancel={onCancel}
      width={1100}
      centered
      footer={null}
      className="pre-order-modal"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onValuesChange={calculateTotal}
      >
        {/* Header Row 1 */}
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="pre_order_no"
              label={<span className="khmer-text-product" style={{ fontWeight: 'bold', color: 'red' }}>* លេខប័ណ្ណ</span>}
              rules={[{ required: true, message: 'Please enter PO No' }]}
            >
              <Input placeholder="Ex: PO-2025-001" size="large" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="customer_id"
              label={<span className="khmer-text-product" style={{ fontWeight: 'bold', color: 'red' }}>* អតិថិជន</span>}
              rules={[{ required: true, message: 'Please select customer' }]}
            >
              <Select
                placeholder="ជ្រើសរើសអតិថិជន"
                showSearch
                size="large"
                options={customers}
                onChange={handleCustomerSelect}
                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="order_date"
              label={<span className="khmer-text-product" style={{ fontWeight: 'bold' }}>ថ្ងៃបញ្ជាទិញ</span>}
            >
              <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
        </Row>

        {/* Header Row 2 */}
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="delivery_date"
              label={<span className="khmer-text-product" style={{ fontWeight: 'bold' }}>ថ្ងៃទីទទួលទំនិញ</span>}
            >
              <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" placeholder="ជ្រើសរើសថ្ងៃទទួលទំនិញ" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="supplier_name"
              label={<span className="khmer-text-product" style={{ fontWeight: 'bold' }}>ក្រុមហ៊ុនផ្គត់ផ្គង់</span>}
            >
              <Select
                placeholder="ជ្រើសរើសក្រុមហ៊ុនផ្គត់ផ្គង់"
                size="large"
                showSearch
                options={suppliers}
                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="delivery_address"
              label={<span className="khmer-text-product" style={{ fontWeight: 'bold' }}>អាស័យដ្ឋាន</span>}
            >
              <Input size="large" placeholder="អាសយដ្ឋានដឹកជញ្ជូន..." />
            </Form.Item>
          </Col>
        </Row>

        <Divider style={{ margin: '15px 0' }} />

        {/* Product List Section */}
        <div style={{ marginBottom: 20 }}>
          <h3 className="khmer-text-product" style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>
            បញ្ជីមុខទំនិញ
          </h3>

          <Form.List name="products">
            {(fields, { add, remove }) => (
              <>
                {/* Table Header */}
                <Row gutter={10} style={{ marginBottom: 10, fontWeight: 'bold', borderBottom: '2px solid #e8e8e8', paddingBottom: 8 }}>
                  <Col span={8} className="khmer-text-product">
                    <span>មុខទំនិញ</span>
                  </Col>
                  <Col span={4} className="khmer-text-product" style={{ textAlign: 'center' }}>
                    <span>បរិមាណ (L)</span>
                  </Col>
                  <Col span={4} className="khmer-text-product" style={{ textAlign: 'center' }}>
                    <span>តម្លៃ/តោន</span>
                  </Col>
                  <Col span={6} className="khmer-text-product" style={{ textAlign: 'center' }}>
                    គោលដៅ
                  </Col>
                  <Col span={2} style={{ textAlign: 'center' }} className="khmer-text-product">
                    លុប
                  </Col>
                </Row>

                {/* Product Rows */}
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={10} align="middle" style={{ marginBottom: 10 }}>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'product_id']}
                        rules={[{ required: true, message: 'សូមជ្រើសរើស' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Select
                          placeholder="ជ្រើសរើសផលិតផល"
                          size="large"
                          showSearch
                          options={products.map(p => ({ label: p.name, value: p.id }))}
                          onChange={(val) => handleProductSelect(val, name)}
                          filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                          }
                        />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item
                        {...restField}
                        name={[name, 'qty']}
                        rules={[{ required: true, message: 'បញ្ចូល' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber
                          placeholder="0"
                          size="large"
                          style={{ width: '100%' }}
                          min={0}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item
                        {...restField}
                        name={[name, 'price']}
                        rules={[{ required: true, message: 'បញ្ចូល' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber
                          placeholder="0.00"
                          size="large"
                          style={{ width: '100%' }}
                          min={0}
                          step={0.01}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'destination']}
                        style={{ marginBottom: 0 }}
                      >
                        <Input placeholder="គោលដៅ..." size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={2} style={{ textAlign: 'center' }}>
                      {fields.length > 1 && (
                        <DeleteOutlined
                          style={{ fontSize: 20, color: '#ff4d4f', cursor: 'pointer' }}
                          onClick={() => remove(name)}
                        />
                      )}
                    </Col>
                  </Row>
                ))}

                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                  size="large"
                  style={{ marginTop: 15 }}
                  className="khmer-text-product"
                >
                  បន្ថែមមុខទំនិញ
                </Button>
              </>
            )}
          </Form.List>
        </div>

        <Divider style={{ margin: '15px 0' }} />

        {/* Footer */}
        <div className="pre-order-footer" style={{
          padding: '15px 20px',
          borderRadius: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: 18 }} className="khmer-text-product">
            តម្លៃសរុប: <span className="pre-order-total-amount" style={{ fontWeight: 'bold' }}>{formatPrice(totalAmount)}</span>
          </div>
          <Space size="middle">
            <Button
              onClick={onCancel}
              size="large"
              style={{ borderRadius: 20, padding: '0 30px' }}
              className="khmer-text-product"
            >
              បោះបង់
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              style={{ borderRadius: 20, padding: '0 30px' }}
              className="khmer-text-product"
            >
              {editRecord ? 'រក្សាទុកការកែប្រែ' : 'រក្សាទុក'}
            </Button>
          </Space>
        </div>

        <div className="pre-order-note" style={{ marginTop: 15, padding: '10px', borderRadius: 6 }}>
          <Text type="secondary" className="khmer-text-product" style={{ fontSize: 12 }}>
            <strong>ចំណាំ:</strong> នេះជា Stage 1 (ការកម្មង់ដំបូង)។
            ការដឹកជញ្ជូនជាក់ស្តែង (Stage 2) នឹងត្រូវបានកត់ត្រានៅពេលចេញវិក្កយបត្រ។
          </Text>
        </div>

      </Form>
    </Modal>
  );
};

export default PreOrderForm;