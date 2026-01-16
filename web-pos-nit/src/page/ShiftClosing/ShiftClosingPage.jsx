// ✅ ShiftClosingPage.jsx - Complete Shift Closing Form

import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Divider,
  Alert,
  Steps,
  Typography
} from "antd";
import {
  ClockCircleOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined
} from "@ant-design/icons";
import MainPage from "../../component/layout/MainPage";
import { request } from "../../util/helper";
import dayjs from "dayjs";
import { getProfile } from "../../store/profile.store";
import "./ShiftClosing.css";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

function ShiftClosingPage() {
  const [form] = Form.useForm();
  const [expenseForm] = Form.useForm();
  
  const [state, setState] = useState({
    loading: false,
    currentShift: null,
    step: 0,  // 0: No shift, 1: Shift open, 2: Closing, 3: Review
    products: [],
    openingStock: {},
    closingStock: {},
    expenses: [],
    salesSummary: null
  });

  const [expenseModal, setExpenseModal] = useState(false);

  useEffect(() => {
    checkCurrentShift();
    loadProducts();
  }, []);

  // ========================================
  // 1. CHECK CURRENT OPEN SHIFT
  // ========================================

  const checkCurrentShift = async () => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const res = await request("closing/shift/current", "get");
      
      if (res && res.data) {
        setState(prev => ({
          ...prev,
          currentShift: res.data,
          step: 1,
          openingStock: res.data.opening_stock_json || {},
          loading: false
        }));
        
        message.info(`វេន ${res.data.shift_name} កំពុងបើក`);
      } else {
        setState(prev => ({ ...prev, loading: false, step: 0 }));
      }
    } catch (error) {
      console.error("Error checking shift:", error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  // ========================================
  // 2. LOAD PRODUCTS FOR STOCK INPUT
  // ========================================

  const loadProducts = async () => {
    try {
      const res = await request("inventory/pos-products", "get");
      
      if (res && res.list) {
        setState(prev => ({
          ...prev,
          products: res.list
        }));
      }
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  // ========================================
  // 3. START NEW SHIFT (បើកវេនថ្មី)
  // ========================================

  const handleStartShift = async (values) => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const profile = getProfile();
      
      const payload = {
        shift_name: values.shift_name,
        shift_date: values.shift_date.format('YYYY-MM-DD'),
        start_time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        opening_cash: values.opening_cash || 0,
        opening_stock: state.openingStock
      };

      const res = await request("closing/shift/create", "post", payload);

      if (res && res.success) {
        message.success("បើកវេនបានជោគជ័យ!");
        checkCurrentShift();
        form.resetFields();
      } else {
        message.error(res?.message || "មានបញ្ហាក្នុងការបើកវេន");
        setState(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error("Error starting shift:", error);
      message.error("មានបញ្ហាក្នុងការបើកវេន");
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  // ========================================
  // 4. CLOSE SHIFT (បិទវេន)
  // ========================================

  const handleCloseShift = async (values) => {
    if (!state.currentShift) return;

    Modal.confirm({
      title: "តើអ្នកប្រាកដថាចង់បិទវេនមែនទេ?",
      content: "សូមពិនិត្យឱ្យច្បាស់មុននឹងបិទវេន។ ការបិទវេនមិនអាចកែប្រែបានទេ។",
      okText: "បិទវេន",
      cancelText: "បោះបង់",
      onOk: async () => {
        setState(prev => ({ ...prev, loading: true }));

        try {
          const payload = {
            end_time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            closing_cash_actual: values.closing_cash_actual,
            closing_stock: state.closingStock,
            expenses: state.expenses,
            notes: values.notes || '',
            issues_reported: values.issues_reported || ''
          };

          const res = await request(
            `closing/shift/${state.currentShift.id}/close`,
            "put",
            payload
          );

          if (res && res.success) {
            message.success("បិទវេនបានជោគជ័យ!");
            
            // Show summary
            Modal.success({
              title: "វេនត្រូវបានបិទ",
              content: (
                <div>
                  <p>ស្តុកបាត់បង់: {res.data.stock_loss_liters?.toFixed(2)} L</p>
                  <p>តម្លៃបាត់បង់: ${res.data.stock_loss_value?.toFixed(2)}</p>
                  <p>សាច់ប្រាក់ខុសគ្នា: ${res.data.cash_variance?.toFixed(2)}</p>
                  <p>Status: {res.data.status}</p>
                </div>
              )
            });

            // Reset
            setState(prev => ({
              ...prev,
              currentShift: null,
              step: 0,
              closingStock: {},
              expenses: [],
              loading: false
            }));
            
            form.resetFields();
          } else {
            message.error(res?.message || "មានបញ្ហាក្នុងការបិទវេន");
            setState(prev => ({ ...prev, loading: false }));
          }
        } catch (error) {
          console.error("Error closing shift:", error);
          message.error("មានបញ្ហាក្នុងការបិទវេន");
          setState(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  // ========================================
  // 5. ADD EXPENSE
  // ========================================

  const handleAddExpense = () => {
    expenseForm.validateFields().then(values => {
      const newExpense = {
        id: Date.now(),
        ...values
      };

      setState(prev => ({
        ...prev,
        expenses: [...prev.expenses, newExpense]
      }));

      expenseForm.resetFields();
      setExpenseModal(false);
      message.success("បានបន្ថែមចំណាយ");
    });
  };

  const handleRemoveExpense = (id) => {
    setState(prev => ({
      ...prev,
      expenses: prev.expenses.filter(exp => exp.id !== id)
    }));
    message.success("បានលុបចំណាយ");
  };

  // ========================================
  // RENDER: START SHIFT FORM
  // ========================================

  const renderStartShiftForm = () => (
    <Card title={<Title level={4}>បើកវេនថ្មី</Title>}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleStartShift}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="ថ្ងៃវេន"
              name="shift_date"
              initialValue={dayjs()}
              rules={[{ required: true, message: "សូមជ្រើសរើសថ្ងៃ" }]}
            >
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="វេន"
              name="shift_name"
              rules={[{ required: true, message: "សូមជ្រើសរើសវេន" }]}
            >
              <Select placeholder="ជ្រើសរើសវេន">
                <Option value="morning">ព្រឹក (Morning)</Option>
                <Option value="afternoon">រសៀល (Afternoon)</Option>
                <Option value="evening">ល្ងាច (Evening)</Option>
                <Option value="night">យប់ (Night)</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="សាច់ប្រាក់ចាប់ផ្តើម (Opening Cash)"
              name="opening_cash"
              initialValue={0}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                prefix="$"
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider>ស្តុកប្រេងចាប់ផ្តើម (Opening Stock)</Divider>

        {state.products.map(product => (
          <Row gutter={16} key={product.id} style={{ marginBottom: 8 }}>
            <Col span={12}>
              <Text strong>{product.name}</Text>
            </Col>
            <Col span={12}>
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                placeholder="បរិមាណ (L)"
                value={state.openingStock[product.id] || 0}
                onChange={(value) => {
                  setState(prev => ({
                    ...prev,
                    openingStock: {
                      ...prev.openingStock,
                      [product.id]: value || 0
                    }
                  }));
                }}
              />
            </Col>
          </Row>
        ))}

        <Divider />

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<CheckCircleOutlined />}
            size="large"
            block
            loading={state.loading}
          >
            បើកវេន
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );

  // ========================================
  // RENDER: CLOSE SHIFT FORM
  // ========================================

  const renderCloseShiftForm = () => (
    <div>
      {/* Shift Info */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="វេន"
              value={state.currentShift?.shift_name}
              prefix={<ClockCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="ចាប់ផ្តើម"
              value={dayjs(state.currentShift?.start_time).format('HH:mm')}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="សាច់ប្រាក់ចាប់ផ្តើម"
              value={state.currentShift?.opening_cash || 0}
              prefix="$"
            />
          </Col>
          <Col span={6}>
            <Tag color="green" style={{ fontSize: 16, padding: '8px 16px' }}>
              កំពុងបើក
            </Tag>
          </Col>
        </Row>
      </Card>

      {/* Expenses */}
      <Card
        title="ចំណាយក្នុងវេន"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setExpenseModal(true)}
          >
            បន្ថែមចំណាយ
          </Button>
        }
        style={{ marginBottom: 16 }}
      >
        <Table
          dataSource={state.expenses}
          rowKey="id"
          pagination={false}
          columns={[
            {
              title: "ប្រភេទ",
              dataIndex: "category",
              render: (cat) => {
                const labels = {
                  fuel: "ប្រេង",
                  maintenance: "ថែទាំ",
                  utilities: "ថ្លៃភ្លើង/ទឹក",
                  supplies: "សម្ភារៈ",
                  wages: "ប្រាក់ខែ",
                  transport: "ដឹកជញ្ជូន",
                  other: "ផ្សេងៗ"
                };
                return labels[cat] || cat;
              }
            },
            { title: "ពិពណ៌នា", dataIndex: "description" },
            {
              title: "ចំនួនទឹកប្រាក់",
              dataIndex: "amount",
              render: (amount) => `$${parseFloat(amount).toFixed(2)}`
            },
            {
              title: "សកម្មភាព",
              render: (_, record) => (
                <Button
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveExpense(record.id)}
                >
                  លុប
                </Button>
              )
            }
          ]}
          summary={data => {
            const total = data.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell colSpan={2}>
                  <Text strong>សរុប</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell>
                  <Text strong>${total.toFixed(2)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell />
              </Table.Summary.Row>
            );
          }}
        />
      </Card>

      {/* Closing Form */}
      <Card title="បិទវេន">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCloseShift}
        >
          <Divider>ស្តុកប្រេងបិទ (Closing Stock)</Divider>

          {state.products.map(product => (
            <Row gutter={16} key={product.id} style={{ marginBottom: 8 }}>
              <Col span={8}>
                <Text strong>{product.name}</Text>
              </Col>
              <Col span={8}>
                <Text type="secondary">
                  បើក: {state.openingStock[product.id] || 0} L
                </Text>
              </Col>
              <Col span={8}>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="បរិមាណបិទ (L)"
                  value={state.closingStock[product.id] || 0}
                  onChange={(value) => {
                    setState(prev => ({
                      ...prev,
                      closingStock: {
                        ...prev.closingStock,
                        [product.id]: value || 0
                      }
                    }));
                  }}
                />
              </Col>
            </Row>
          ))}

          <Divider>សាច់ប្រាក់ (Cash Reconciliation)</Divider>

          <Form.Item
            label="សាច់ប្រាក់រាប់បាន (Actual Cash)"
            name="closing_cash_actual"
            rules={[{ required: true, message: "សូមបញ្ចូលចំនួនសាច់ប្រាក់" }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              prefix="$"
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>

          <Form.Item
            label="កំណត់សម្គាល់ (Notes)"
            name="notes"
          >
            <TextArea rows={3} placeholder="បញ្ចូលកំណត់សម្គាល់..." />
          </Form.Item>

          <Form.Item
            label="បញ្ហាជួបប្រទះ (Issues Reported)"
            name="issues_reported"
          >
            <TextArea rows={3} placeholder="បញ្ចូលបញ្ហាដែលជួបប្រទះ..." />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              danger
              htmlType="submit"
              icon={<SaveOutlined />}
              size="large"
              block
              loading={state.loading}
            >
              បិទវេន
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );

  // ========================================
  // RENDER MAIN
  // ========================================

  return (
    <MainPage loading={state.loading}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        <Title level={2}>
          <ClockCircleOutlined /> បិទវេន (Shift Closing)
        </Title>

        {state.step === 0 && renderStartShiftForm()}
        {state.step === 1 && renderCloseShiftForm()}

        {/* Expense Modal */}
        <Modal
          title="បន្ថែមចំណាយ"
          open={expenseModal}
          onOk={handleAddExpense}
          onCancel={() => {
            setExpenseModal(false);
            expenseForm.resetFields();
          }}
          okText="បន្ថែម"
          cancelText="បោះបង់"
        >
          <Form form={expenseForm} layout="vertical">
            <Form.Item
              label="ប្រភេទចំណាយ"
              name="category"
              rules={[{ required: true }]}
            >
              <Select placeholder="ជ្រើសរើសប្រភេទ">
                <Option value="fuel">ប្រេង</Option>
                <Option value="maintenance">ថែទាំ</Option>
                <Option value="utilities">ថ្លៃភ្លើង/ទឹក</Option>
                <Option value="supplies">សម្ភារៈ</Option>
                <Option value="wages">ប្រាក់ខែ</Option>
                <Option value="transport">ដឹកជញ្ជូន</Option>
                <Option value="other">ផ្សេងៗ</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="ពិពណ៌នា"
              name="description"
              rules={[{ required: true }]}
            >
              <Input placeholder="បញ្ចូលពិពណ៌នា" />
            </Form.Item>

            <Form.Item
              label="ចំនួនទឹកប្រាក់"
              name="amount"
              rules={[{ required: true }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                prefix="$"
              />
            </Form.Item>

            <Form.Item
              label="វិធីសាស្ត្របង់ប្រាក់"
              name="payment_method"
              initialValue="cash"
            >
              <Select>
                <Option value="cash">សាច់ប្រាក់</Option>
                <Option value="card">កាត</Option>
                <Option value="transfer">ផ្ទេរប្រាក់</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </MainPage>
  );
}

export default ShiftClosingPage;