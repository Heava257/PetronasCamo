import React, { useState, useEffect, useRef } from "react";
import { Modal, Form, Select, Input, InputNumber, Button, DatePicker, message, Row, Col, Space, Typography, Divider } from "antd";
import Swal from "sweetalert2";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { request, formatPrice } from "../../util/helper";
import dayjs from "dayjs";
import "./PreOrderManagement.css";
import { debounce } from "lodash";
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from "@ant-design/icons";
import { useTranslation } from "../../locales/TranslationContext";

const { Text } = Typography;

const PreOrderForm = ({ visible, editRecord, onCancel, onSuccess }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [duplicateStatus, setDuplicateStatus] = useState(null); // null, 'checking', 'exists', 'available'
  const editRecordRef = useRef(editRecord);

  useEffect(() => {
    editRecordRef.current = editRecord;
  }, [editRecord]);

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
          location_name: data.location_name,
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
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: "Failed to load data",
      });
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
        setCustomers(res.list.map((c, index) => ({
          label: `${index + 1}. ${c.name} (${c.tel})`,
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

  // Recalculate total when products are loaded to ensure conversion factor is applied
  useEffect(() => {
    if (products.length > 0) {
      calculateTotal();
    }
  }, [products]);

  const checkPreOrderNo = async (value) => {
    if (!value) {
      setDuplicateStatus(null);
      return;
    }
    setDuplicateStatus('checking');
    try {
      let url = `pre-order/check-duplicate?no=${value}`;
      if (editRecordRef.current?.id) {
        url += `&exclude_id=${editRecordRef.current.id}`;
      }
      const res = await request(url, "get");
      if (res && res.exists) {
        setDuplicateStatus('exists');
        form.setFields([
          {
            name: 'pre_order_no',
            errors: [t("pre_order.duplicate_po_error") || 'លេខវិក្កយបត្រនេះមានរួចហើយ (Duplicate)'],
          },
        ]);
      } else {
        setDuplicateStatus('available');
        form.setFields([
          {
            name: 'pre_order_no',
            errors: [],
          },
        ]);
      }
    } catch (error) {
      console.error("Check duplicate error", error);
      setDuplicateStatus(null);
    }
  };

  // Create a memoized debounced function
  const debouncedCheck = React.useCallback(debounce((val) => checkPreOrderNo(val), 500), []);

  const onFinish = async (values) => {
    setLoading(true);

    const validProducts = (values.products || []).filter(p => p.product_id && p.qty > 0);

    if (validProducts.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: t("pre_order.please_select_at_least_one") || "សូមជ្រើសរើសមុខទំនិញយ៉ាងហោចណាស់មួយ",
      });
      setLoading(false);
      return;
    }

    const payload = {
      pre_order_no: values.pre_order_no,
      customer_id: values.customer_id,
      order_date: values.order_date ? values.order_date.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
      delivery_date: values.delivery_date ? values.delivery_date.format('YYYY-MM-DD') : null,
      delivery_address: values.delivery_address,
      location_name: values.location_name,
      special_instructions: `Supplier: ${values.supplier_name || 'N/A'} | Received: Pending`,
      status: 'pending',
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
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: res.message || (isEdit ? (t("pre_order.updated_success") || "បានកែប្រែជោគជ័យ") : (t("pre_order.created_success") || "Pre-Order created successfully")),
          showConfirmButton: false,
          timer: 1500
        });
        onSuccess();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: res.message || "Failed to save Pre-Order",
        });
      }
    } catch (error) {
      console.error("Submit error", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: "System Error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <span style={{ fontSize: 20, fontWeight: 'bold', color: '#FFD700' }} className="khmer-text-product">
          {editRecord ? (t("pre_order.edit_order") || 'កែសម្រួល Pre-Order') : (t("pre_order.new_order") || 'ការកម្ម៉ង់ថ្មី')}
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
              label={<span className="khmer-text-product" style={{ fontWeight: 'bold' }}>{t("pre_order.po_no") || "លេខប័ណ្ណ"}</span>}
              rules={[{ required: true, message: 'Please enter PO No' }]}
              hasFeedback
              validateStatus={
                duplicateStatus === 'checking' ? 'validating' :
                  duplicateStatus === 'exists' ? 'error' :
                    duplicateStatus === 'available' ? 'success' : ''
              }
            >
              <Input
                placeholder="Ex: PO-2025-001"
                size="large"
                onChange={(e) => {
                  form.setFieldsValue({ pre_order_no: e.target.value });
                  debouncedCheck(e.target.value);
                }}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="customer_id"
              label={<span className="khmer-text-product" style={{ fontWeight: 'bold' }}>{t("pre_order.customer") || "អតិថិជន"}</span>}
              rules={[{ required: true, message: 'Please select customer' }]}
            >
              <Select
                placeholder={t("pre_order.select_customer") || "ជ្រើសរើសអតិថិជន"}
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
              label={<span className="khmer-text-product" style={{ fontWeight: 'bold' }}>{t("pre_order.order_date") || "ថ្ងៃបញ្ជាទិញ"}</span>}
            >
              <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
        </Row>

        {/* Header Row 2 */}
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              name="delivery_date"
              label={<span className="khmer-text-product" style={{ fontWeight: 'bold' }}>{t("pre_order.delivery_date") || "ថ្ងៃទីទទួលទំនិញ"}</span>}
            >
              <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" placeholder={t("pre_order.delivery_date") || "ជ្រើសរើសថ្ងៃទទួលទំនិញ"} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="supplier_name"
              label={<span className="khmer-text-product" style={{ fontWeight: 'bold' }}>{t("pre_order.supplier") || "ក្រុមហ៊ុនផ្គត់ផ្គង់"}</span>}
            >
              <Select
                placeholder={t("pre_order.select_supplier") || "ជ្រើសរើសក្រុមហ៊ុនផ្គត់ផ្គង់"}
                size="large"
                showSearch
                options={suppliers}
                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="location_name"
              label={<span className="khmer-text-product" style={{ fontWeight: 'bold' }}>{t("pre_order.delivery_location") || "ទីតាំងដឹក"}</span>}
            >
              <Input placeholder={t("pre_order.enter_location") || "បញ្ចូលទីតាំង..."} size="large" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="delivery_address"
              label={<span className="khmer-text-product" style={{ fontWeight: 'bold' }}>{t("pre_order.delivery_address") || "អាស័យដ្ឋាន"}</span>}
            >
              <Input size="large" placeholder={t("pre_order.enter_address") || "អាសយដ្ឋានដឹកជញ្ជូន..."} />
            </Form.Item>
          </Col>
        </Row>

        <Divider style={{ margin: '15px 0' }} />

        {/* Product List Section */}
        <div style={{ marginBottom: 20 }}>
          <h3 className="khmer-text-product" style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>
            {t("pre_order.product_list") || "បញ្ជីមុខទំនិញ"}
          </h3>

          <Form.List name="products">
            {(fields, { add, remove }) => (
              <>
                {/* Table Header */}
                <Row gutter={10} style={{ marginBottom: 10, fontWeight: 'bold', borderBottom: '2px solid #e8e8e8', paddingBottom: 8 }}>
                  <Col span={8} className="khmer-text-product">
                    <span>{t("pre_order.product") || "មុខទំនិញ"}</span>
                  </Col>
                  <Col span={4} className="khmer-text-product" style={{ textAlign: 'center' }}>
                    <span>{t("pre_order.qty_l") || "បរិមាណ (L)"}</span>
                  </Col>
                  <Col span={4} className="khmer-text-product" style={{ textAlign: 'center' }}>
                    <span>{t("pre_order.price_per_ton") || "តម្លៃ/តោន"}</span>
                  </Col>
                  <Col span={6} className="khmer-text-product" style={{ textAlign: 'center' }}>
                    {t("pre_order.destination") || "គោលដៅ"}
                  </Col>
                  <Col span={2} style={{ textAlign: 'center' }} className="khmer-text-product">
                    {t("remove") || "លុប"}
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
                          placeholder={t("pre_order.select_product") || "ជ្រើសរើសផលិតផល"}
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
                        <Input placeholder={t("pre_order.enter_destination") || "គោលដៅ..."} size="large" />
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
                  {t("pre_order.add_product") || "បន្ថែមមុខទំនិញ"}
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
            {t("pre_order.total_amount") || "តម្លៃសរុប"}: <span className="pre-order-total-amount" style={{ fontWeight: 'bold' }}>{formatPrice(totalAmount)}</span>
          </div>
          <Space size="middle">
            <Button
              onClick={onCancel}
              size="large"
              style={{ borderRadius: 20, padding: '0 30px' }}
              className="khmer-text-product"
            >
              {t("cancel") || "បោះបង់"}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              style={{ borderRadius: 20, padding: '0 30px' }}
              className="khmer-text-product"
            >
              {editRecord ? (t("pre_order.save_changes") || 'រក្សាទុកការកែប្រែ') : (t("pre_order.save") || 'រក្សាទុក')}
            </Button>
          </Space>
        </div>

        <div className="pre-order-note" style={{ marginTop: 15, padding: '10px', borderRadius: 6 }}>
          <Text type="secondary" className="khmer-text-product" style={{ fontSize: 12 }}>
            {(t("pre_order.stage1_note") || "ចំណាំ: នេះជា Stage 1 (ការកម្មង់ដំបូង)។ ការដឹកជញ្ជូនជាក់ស្តែង (Stage 2) នឹងត្រូវបានកត់ត្រានៅពេលចេញវិក្កយបត្រ។")}
          </Text>
        </div>

      </Form>
    </Modal>
  );
};

export default PreOrderForm;