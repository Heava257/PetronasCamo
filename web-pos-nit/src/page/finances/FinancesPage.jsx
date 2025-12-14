import React, { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  DatePicker,
  InputNumber
} from "antd";
import { formatDateClient, formatDateServer, request } from "../../util/helper";
import { MdAdd, MdDelete, MdEdit, MdAttachMoney } from "react-icons/md";
import MainPage from "../../component/layout/MainPage";
import { configStore } from "../../store/configStore";
import dayjs from "dayjs";
import "./Finances.module.css"; // Updated CSS path

const { Option } = Select;

function FinancePage() {
  const { config } = configStore();
  const [formRef] = Form.useForm();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState({
    visibleModal: false,
    id: null,
    txtSearch: "",
  });

  useEffect(() => {
    getList();
  }, []);


  const khmerMonths = [
    'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 
    'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
  ];
  

const formatKhmerDateDayjs = (date) => {
    const formattedDate = dayjs(date).format('D/MMMM/YYYY');
    
    // Replace English month names with Khmer month names
    return khmerMonths.reduce((formatted, khmerMonth, index) => {
      return formatted.replace(
        new RegExp(`\\b${new Date(2000, index, 1).toLocaleString('en-US', { month: 'long' })}\\b`, 'g'), 
        khmerMonth
      );
    }, formattedDate);
  };

  const getList = async () => {
    setLoading(true);
    const res = await request("family_finances", "get");
    setLoading(false);
    if (res) {
      setList(res.list);
    }
  };

  const onClickEdit = (data) => {
    setState({
      ...state,
      visibleModal: true,
      id: data.id,
    });
    formRef.setFieldsValue({
      ...data,
      transaction_date: dayjs(data.transaction_date)
    });
  };

  const onClickDelete = async (data) => {
    Modal.confirm({
      title: "លុប",
      content: "តើអ្នកប្រាកដថាចង់លុបការចំណាយ/ចំណូលនេះមែនទេ?",
      okText: "យល់ព្រម",
      cancelText: "បោះបង់",
      onOk: async () => {
        const res = await request("family_finances", "delete", { id: data.id });
        if (res && !res.error) {
          message.success(res.message);
          setList(list.filter((item) => item.id !== data.id));
        }
      },
    });
  };

  const onClickAddBtn = () => {
    setState({
      ...state,
      visibleModal: true,
    });
    formRef.resetFields();
  };

  const onCloseModal = () => {
    formRef.resetFields();
    setState({
      ...state,
      visibleModal: false,
      id: null,
    });
  };

  const onFinish = async (items) => {
    const data = {
      ...items,
      id: formRef.getFieldValue("id"),
      transaction_date: items.transaction_date.format('YYYY-MM-DD')
    };
    const method = data.id ? "put" : "post";

    const res = await request("family_finances", method, data);
    if (res && !res.error) {
      message.success(res.message);
      getList();
      onCloseModal();
    }
  };

  // Common categories for income and expenses
  const incomeCategories = [
    "ប្រាក់ខែ", "អាជីវកម្ម", "ការវិនិយោគ", "អំណោយ", "ចំណូលផ្សេងៗ"
  ];
  
  const expenseCategories = [
    "ផ្ទះ", "សេវាសាធារណៈ", "អាហារ", "ដឹកជញ្ជូន", 
    "ការអប់រំ", "សុខភាព", "កម្សាន្ត", "សម្លៀកបំពាក់"
  ];

  return (
    <MainPage loading={loading}>
      <div className="pageHeader">
        <Space>
          <div className="khmer-title">ការគ្រប់គ្រងហិរញ្ញវត្ថុគ្រួសារ</div>
          <Input.Search
            onChange={(e) => setState((prev) => ({ ...prev, txtSearch: e.target.value }))}
            allowClear
            onSearch={getList}
            placeholder="ស្វែងរក..."
          />
        </Space>
        <Button type="primary" onClick={onClickAddBtn} icon={<MdAttachMoney />}>
          បញ្ចូលថ្មី
        </Button>
      </div>

      <Modal
        open={state.visibleModal}
        title={<div className="khmer-title">{formRef.getFieldValue("id") ? "កែសម្រួល" : "បញ្ចូលថ្មី"}</div>}
        footer={null}
        onCancel={onCloseModal}
        width={700}
      >
        <Form layout="vertical" onFinish={onFinish} form={formRef}>
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            name="transaction_type"
            label={<div className="khmer-title">ប្រភេទ</div>}
            rules={[{ required: true, message: "សូមជ្រើសរើសប្រភេទ!" }]}
          >
            <Select placeholder="ជ្រើសរើសប្រភេទ">
              <Option value="income"><span className="khmer-text">ចំណូល</span></Option>
              <Option value="expense"><span className="khmer-text">ចំណាយ</span></Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="transaction_date"
            label={<div className="khmer-title">កាលបរិច្ឆេទ</div>}
            rules={[{ required: true, message: "សូមជ្រើសរើសកាលបរិច្ឆេទ!" }]}
          >
            <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="category"
            label={<div className="khmer-title">ប្រភេទ</div>}
            rules={[{ required: true, message: "សូមជ្រើសរើសប្រភេទ!" }]}
          >
            <Select placeholder="ជ្រើសរើសប្រភេទ">
              {formRef.getFieldValue("transaction_type") === "income" ? (
                incomeCategories.map(cat => (
                  <Option key={cat} value={cat}>
                    <span className="khmer-text">{cat}</span>
                  </Option>
                ))
              ) : (
                expenseCategories.map(cat => (
                  <Option key={cat} value={cat}>
                    <span className="khmer-text">{cat}</span>
                  </Option>
                ))
              )}
            </Select>
          </Form.Item>

          <Form.Item
            name="amount"
            label={<div className="khmer-title">ចំនួនទឹកប្រាក់</div>}
            rules={[{ required: true, message: "សូមបញ្ចូលចំនួនទឹកប្រាក់!" }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item
            name="payment_method"
            label={<div className="khmer-title">វិធីសាក</div>}
            rules={[{ required: true, message: "សូមជ្រើសរើសវិធីសាក!" }]}
          >
            <Select placeholder="ជ្រើសរើសវិធីសាក">
              <Option value="cash"><span className="khmer-text">សាច់ប្រាក់</span></Option>
              <Option value="bank_transfer"><span className="khmer-text">ផ្ទេរធនាគារ</span></Option>
              <Option value="credit_card"><span className="khmer-text">កាតឥណទាន</span></Option>
              <Option value="mobile_payment"><span className="khmer-text">ទូរស័ព្ទ</span></Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="person_responsible"
            label={<div className="khmer-title">អ្នកទទួលខុសត្រូវ</div>}
          >
            <Input placeholder="បញ្ចូលឈ្មោះ" />
          </Form.Item>

          <Form.Item
            name="description"
            label={<div className="khmer-title">ព័ត៌មានបន្ថែម</div>}
          >
            <Input.TextArea rows={3} placeholder="បញ្ចូលព័ត៌មានបន្ថែម..." />
          </Form.Item>

          <Space>
            <Button onClick={onCloseModal}>
              <span className="khmer-text">បោះបង់</span>
            </Button>
            <Button type="primary" htmlType="submit">
              <span className="khmer-text">{formRef.getFieldValue("id") ? "កែសម្រួល" : "រក្សាទុក"}</span>
            </Button>
          </Space>
        </Form>
      </Modal>

      <Table
        dataSource={list}
        columns={[
          {
            key: "No",
            title: <div className="khmer-text">ល.រ</div>,
            render: (item, data, index) => index + 1,
            width: 60,
          },
          {
            key: "transaction_date",
            title: <div className="khmer-text">កាលបរិច្ឆេទ</div>,
            dataIndex: "transaction_date",
            render: (date) => <div className="khmer-text">{formatKhmerDateDayjs(date)}</div>,
            width: 120,
          },
          {
            key: "transaction_type",
            title: <div className="khmer-text">ប្រភេទ</div>,
            dataIndex: "transaction_type",
            render: (type) => (
              <Tag color={type === 'income' ? 'green' : 'red'}>
                <span className="khmer-text">
                  {type === 'income' ? 'ចំណូល' : 'ចំណាយ'}
                </span>
              </Tag>
            ),
            width: 100,
          },
          {
            key: "category",
            title: <div className="khmer-text">ប្រភេទ</div>,
            dataIndex: "category",
            render: (text) => <div className="khmer-text">{text}</div>,
          },
          {
            key: "amount",
            title: <div className="khmer-text">ចំនួន</div>,
            dataIndex: "amount",
            render: (amount) => {
              const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
              return (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {numAmount.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </div>
              );
            },
            width: 120,
            align: 'center',
          },

          {
            key: "person_responsible",
            title: <div className="khmer-text">អ្នកទទួលខុសត្រូវ</div>,
            dataIndex: "person_responsible",
            render: (text) => <div className="khmer-text">{text}</div>,
          },
         
          {
            key: "payment_method",
            title: <div className="khmer-text">វិធីបង់ប្រាក់</div>,
            dataIndex: "payment_method",
            render: (method) => (
              <div className="khmer-text">
                {method === 'cash' ? 'សាច់ប្រាក់' : 
                 method === 'bank_transfer' ? 'ផ្ទេរធនាគារ' :
                 method === 'credit_card' ? 'កាតឥណទាន' : 'ទូរស័ព្ទ'}
              </div>
            ),
            width: 120,
          },
          {
            key: "description",
            title: <div className="khmer-text">ការពិពណ៌នា</div>,
            dataIndex: "description",
            render: (text) => <div className="khmer-text">{text}</div>,
          },
          {
            key: "created_at",
            title: <div className="khmer-text">កាលបរិច្ឆេទបង្កើត</div>,
            dataIndex: "created_at",
            render: (text) => <div className="khmer-text">{formatKhmerDateDayjs(text)}</div>
          },
         
          
          {
            key: "Action",
            title: <div className="khmer-text">សកម្មភាព</div>,
            align: "center",
            width: 120,
            render: (item, data) => (
              <Space>
                <Button type="primary" icon={<MdEdit />} onClick={() => onClickEdit(data)} />
                <Button type="primary" danger icon={<MdDelete />} onClick={() => onClickDelete(data)} />
              </Space>
            ),
          },
        ]}
        scroll={{ x: true }}
      />
    </MainPage>
  );
}

export default FinancePage;