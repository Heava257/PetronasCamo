import { Button, Card, Col, DatePicker, Form, Input, InputNumber, message, Modal, Row, Select, Statistic, Table } from "antd";
import { useEffect, useState } from "react";
import { MdEdit, MdOutlinePayment } from "react-icons/md";
import { request } from "../../util/helper";

const PaymentHistoryModal = ({ 
  visible, 
  order_id, 
  onClose, 
  onRefresh 
}) => {
  const [payments, setPayments] = useState([]);
  const [debtSummary, setDebtSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [editFormRef] = Form.useForm();
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    if (visible && order_id) {
      fetchPaymentHistory();
    }
  }, [visible, order_id]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const res = await request(`payment-history/${order_id}`, "get");
      if (res && res.success) {
        setPayments(res.payments || []);
        setDebtSummary(res.debt_summary);
      }
    } catch (error) {
      console.error("Error fetching payment history:", error);
      message.error('មិនអាចទាក់ទងប្រវត្តិការបង់ប្រាក់');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPayment = (payment) => {
    setEditingPayment(payment);
    editFormRef.setFieldsValue({
      amount: parseFloat(payment.payment_amount),
      payment_method: payment.payment_method,
      bank: payment.bank,
      payment_date: dayjs(payment.payment_date),
      notes: payment.notes
    });
  };

  const handleUpdatePayment = async (values) => {
    try {
      setEditLoading(true);
      const res = await request(`payment-history/${editingPayment.payment_id}`, "put", {
        amount: parseFloat(values.amount),
        payment_method: values.payment_method,
        bank: values.bank,
        payment_date: values.payment_date.format('YYYY-MM-DD'),
        notes: values.notes
      });

      if (res && res.success) {
        message.success('ការកែប្រែការបង់ប្រាក់បានសម្រេចដោយជោគជ័យ');
        setEditingPayment(null);
        editFormRef.resetFields();
        await fetchPaymentHistory();
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      console.error("Error updating payment:", error);
      message.error('មិនអាចកែប្រែការបង់ប្រាក់');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MdOutlinePayment style={{ fontSize: '20px' }} />
          <span className="khmer-font">ប្រវត្តិការបង់ប្រាក់</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={null}
      className="payment-history-modal khmer-font"
    >
      {debtSummary && (
        <Row gutter={16} style={{ marginBottom: '20px' }}>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title={<span className="khmer-font">ជំពាក់សរុប</span>}
                value={debtSummary.total_owed}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title={<span className="khmer-font">បានបង់</span>}
                value={debtSummary.total_paid}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title={<span className="khmer-font">នៅជំពាក់</span>}
                value={debtSummary.total_due}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Table
        dataSource={payments}
        loading={loading}
        columns={[
          {
            title: <span className="khmer-font">ល.រ</span>,
            render: (_, __, index) => index + 1,
            width: 50
          },
          {
            title: <span className="khmer-font">ថ្ងៃបង់</span>,
            dataIndex: 'payment_date',
            render: (text) => <span className="english-text">{formatDateClient(text)}</span>,
            width: 120
          },
          {
            title: <span className="khmer-font">ចំនួនបង់</span>,
            dataIndex: 'payment_amount',
            render: (text) => <span className="english-text">{formatCurrency(text)}</span>,
            align: 'right',
            width: 120
          },
          {
            title: <span className="khmer-font">របៀបបង់</span>,
            dataIndex: 'payment_method',
            render: (text) => (
              <span className="khmer-text">{text === 'cash' ? 'សាច់ប្រាក់' : 'ធនាគារ'}</span>
            ),
            width: 100
          },
          {
            title: <span className="khmer-font">ធនាគារ</span>,
            dataIndex: 'bank',
            render: (text) => <span className="english-text">{text || '-'}</span>,
            width: 100
          },
          {
            title: <span className="khmer-font">កំណត់ចំណាំ</span>,
            dataIndex: 'notes',
            render: (text) => <span className="khmer-text">{text || '-'}</span>,
            ellipsis: true
          },
          {
            title: <span className="khmer-font">សកម្មភាព</span>,
            key: 'action',
            render: (_, record) => (
              <Button
                type="primary"
                size="small"
                icon={<MdEdit />}
                onClick={() => handleEditPayment(record)}
                className="edit-button"
              >
                <span className="khmer-text">កែប្រែ</span>
              </Button>
            ),
            width: 100
          }
        ]}
        pagination={false}
        size="small"
      />

      {/* Edit Payment Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MdEdit style={{ fontSize: '20px' }} />
            <span className="khmer-font">កែប្រែការបង់ប្រាក់</span>
          </div>
        }
        open={!!editingPayment}
        onCancel={() => {
          setEditingPayment(null);
          editFormRef.resetFields();
        }}
        width={500}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setEditingPayment(null);
              editFormRef.resetFields();
            }}
          >
            <span className="khmer-text">បោះបង់</span>
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={editLoading}
            onClick={() => editFormRef.submit()}
          >
            <span className="khmer-text">រក្សាទុក</span>
          </Button>
        ]}
      >
        <Form
          form={editFormRef}
          layout="vertical"
          onFinish={handleUpdatePayment}
        >
          <Form.Item
            name="amount"
            label={<span className="khmer-font">ចំនួនបង់</span>}
            rules={[
              { required: true, message: 'សូមបញ្ចូលចំនួនបង់' },
              { type: 'number', min: 0 }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              precision={2}
              formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item
            name="payment_method"
            label={<span className="khmer-font">របៀបបង់</span>}
          >
            <Select>
              <Option value="cash">សាច់ប្រាក់</Option>
              <Option value="bank">ធនាគារ</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="bank"
            label={<span className="khmer-font">ធនាគារ</span>}
          >
            <Input placeholder="ឈ្មោះធនាគារ" />
          </Form.Item>

          <Form.Item
            name="payment_date"
            label={<span className="khmer-font">ថ្ងៃបង់</span>}
          >
            <DatePicker format="DD-MM-YYYY" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="notes"
            label={<span className="khmer-font">កំណត់ចំណាំ</span>}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Modal>
  );
};

export default PaymentHistoryModal;