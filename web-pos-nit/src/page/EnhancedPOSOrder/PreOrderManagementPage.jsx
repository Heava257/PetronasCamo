
import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  message,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  DatePicker,
  ConfigProvider,
  theme,
  Badge,
  InputNumber,
  Divider
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  ThunderboltOutlined,
  EditOutlined,
  DeleteOutlined
} from "@ant-design/icons";
import MainPage from "../../component/layout/MainPage";
import { request, formatDateClient, formatPrice } from "../../util/helper";
import { getProfile } from "../../store/profile.store";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "./PreOrderManagement.css";
import { useTranslation } from "../../locales/TranslationContext";
import { Trash2 } from "lucide-react";

function PreOrderManagementPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  const [state, setState] = useState({
    loading: false,
    list: [],
    total: 0,
    visibleModal: false,
    editRecord: null,
    stats: {
      total: 0,
      pending: 0,
      confirmed: 0,
      ready: 0,
      delivered: 0
    }
  });

  const [filter, setFilter] = useState({
    status: null,
    customer_id: null,
    from_date: null,
    to_date: null,
    txt_search: ""
  });

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    loadPreOrders();
    loadCustomers();
    loadProducts();
  }, [filter]);

  const loadProducts = async () => {
    try {
      const res = await request("product/my-group", "get");
      if (res && res.list) {
        setProducts(res.list);
      }
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'darkMode') {
        setIsDarkMode(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(() => {
      const currentDarkMode = localStorage.getItem('darkMode') === 'true';
      if (currentDarkMode !== isDarkMode) {
        setIsDarkMode(currentDarkMode);
      }
    }, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [isDarkMode]);

  const loadPreOrders = async () => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      const { id } = getProfile();
      if (!id) return;

      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.customer_id) params.append('customer_id', filter.customer_id);
      if (filter.from_date) params.append('from_date', filter.from_date);
      if (filter.to_date) params.append('to_date', filter.to_date);
      if (filter.txt_search) params.append('search', filter.txt_search);

      const res = await request(`pre-order/list?${params.toString()}`, "get");

      if (res && res.success) {
        const list = res.list || [];

        const stats = {
          total: list.length,
          pending: list.filter(po => po.status === 'pending').length,
          confirmed: list.filter(po => po.status === 'confirmed').length,
          ready: list.filter(po => po.status === 'ready').length,
          delivered: list.filter(po => po.status === 'delivered').length
        };

        setState(prev => ({
          ...prev,
          list,
          total: res.total || list.length,
          stats,
          loading: false
        }));
      }
    } catch (error) {
      console.error("Error:", error);
      message.error(t("failed_load_pre_orders") || "Failed to load pre-orders");
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const loadCustomers = async () => {
    try {
      const { id } = getProfile();
      if (!id) return;

      const res = await request("customer/my-group", "get");
      if (res && res.list) {
        setCustomers(res.list.map(c => ({
          label: `${c.name} (${c.tel})`,
          value: c.id,
          ...c
        })));
      }
    } catch (error) {
      console.error("Error loading customers:", error);
    }
  };

  const handleCustomerChange = (customerId) => {
    const customer = customers.find(c => c.value === customerId);
    if (customer && customer.address) {
      form.setFieldsValue({
        delivery_address: customer.address
      });
    }
  };

  const handleViewDetail = (record) => {
    navigate(`/pre-order-detail/${record.id}`);
  };

  const handleEdit = async (record) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const res = await request(`pre-order/${record.id}`, "get");
      if (res && res.success) {
        const data = res.data;
        setState(prev => ({
          ...prev,
          editRecord: data,
          visibleModal: true,
          loading: false
        }));

        form.setFieldsValue({
          pre_order_no: data.pre_order_no, // ✅ Include pre_order_no
          customer_id: data.customer_id,
          delivery_date: data.delivery_date ? dayjs(data.delivery_date) : null,
          deposit_amount: data.deposit_amount,
          delivery_address: data.delivery_address,
          payment_method: data.payment_method || 'cash',
          products: data.details.map(d => ({
            product_id: d.product_id,
            qty: d.qty,
            price: d.price,
            discount: d.discount
          }))
        });

        calculateTotal(null, form.getFieldsValue());
      }
    } catch (error) {
      console.error("Error fetching pre-order details:", error);
      message.error("Failed to fetch details");
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleUpdateStatus = async (id, status) => {
    const profile = getProfile();
    const adminRoles = [1, 29];

    if (['confirmed', 'ready'].includes(status) && !adminRoles.includes(profile.role_id)) {
      message.error(t("admin_permission_required") || "មានតែអ្នកគ្រប់គ្រងប៉ុណ្ណោះដែលអាចបញ្ជាក់បាន");
      return;
    }

    try {
      const res = await request(`pre-order/${id}/status`, "put", { status });
      if (res && res.success) {
        message.success(t("status_updated") || "បច្ចុប្បន្នភាព Status បានជោគជ័យ");
        loadPreOrders();
      } else {
        message.error(res.message || "Something went wrong");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      message.error("Failed to update status");
    }
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: 'តើអ្នកប្រាកដថាចង់លុប Pre-Order នេះមែនទេ?',
      content: 'សកម្មភាពនេះមិនអាចត្រឡប់ក្រោយបានទេ។',
      okText: 'លុប',
      okType: 'danger',
      cancelText: 'បោះបង់',
      onOk: async () => {
        try {
          const res = await request(`pre-order/${record.id}`, "delete");
          if (res && res.success) {
            message.success('បានលុបជោគជ័យ');
            loadPreOrders();
          } else {
            message.error(res.message || 'លុបមិនបានជោគជ័យ');
          }
        } catch (error) {
          message.error('មានបញ្ហាពេលលុប');
        }
      }
    });
  };

  const handleClearFilters = () => {
    setFilter({
      status: null,
      customer_id: null,
      from_date: null,
      to_date: null,
      txt_search: ""
    });
  };

  const onFinish = async (values) => {
    console.log("🚀 PreOrder Submit Values:", values);
    try {
      setState(prev => ({ ...prev, loading: true }));
      const isEdit = !!state.editRecord;
      const url = isEdit ? `pre-order/${state.editRecord.id}` : "pre-order/create";
      const method = isEdit ? "put" : "post";

      // ✅ Include pre_order_no in request
      const res = await request(url, method, {
        pre_order_no: values.pre_order_no, // ✅ Manual input
        customer_id: values.customer_id,
        delivery_date: values.delivery_date ? values.delivery_date.format('YYYY-MM-DD') : null,
        delivery_address: values.delivery_address,
        deposit_amount: values.deposit_amount || 0,
        payment_method: values.payment_method || 'cash',
        products: values.products.map(p => ({
          product_id: p.product_id,
          qty: p.qty,
          price: p.price,
          discount: p.discount || 0,
          destination: p.destination || null // ✅ Include destination
        }))
      });

      if (res && res.success) {
        message.success(isEdit ? "Updated successfully" : (t("pre_order_created") || "Pre-order created successfully"));
        setState(prev => ({ ...prev, visibleModal: false, editRecord: null, loading: false }));
        form.resetFields();
        loadPreOrders();
      } else {
        message.error(res.message || "Something went wrong");
        setState(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error("Error:", error);
      message.error(t("failed_operation") || "Operation failed");
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const [totalAmount, setTotalAmount] = useState(0);

  const calculateTotal = (changedValues, allValues) => {
    if (allValues.products) {
      const total = allValues.products.reduce((sum, item) => {
        if (!item || !item.product_id || !item.qty || !item.price) return sum;
        const prod = products.find(p => p.id === item.product_id);
        const actual_price = prod ? parseFloat(prod.actual_price || 1) : 1;
        const discount = parseFloat(item.discount || 0) / 100;
        const amount = (item.qty * item.price * (1 - discount)) / (actual_price || 1);
        return sum + amount;
      }, 0);
      setTotalAmount(total);
    }
  };

  const getLatestSellingPrice = async (productId, customerId) => {
    try {
      if (!productId || !customerId) return 0;
      const res = await request(
        `inventory/latest-selling-price?product_id=${productId}&customer_id=${customerId}`,
        'get'
      );
      if (res && res.success && res.selling_price !== null) {
        return res.selling_price;
      }
      const product = products.find(p => p.id === productId);
      return product ? product.unit_price : 0;
    } catch (error) {
      console.error('Error fetching selling price:', error);
      return 0;
    }
  };

  const handleProductSelect = async (productId, index) => {
    const customerId = form.getFieldValue('customer_id');
    if (!customerId) {
      message.warning('សូមជ្រើសរើសអតិថិជនជាមុនសិន!');
      return;
    }
    const selling_price = await getLatestSellingPrice(productId, customerId);
    const currentProducts = form.getFieldValue('products');
    if (currentProducts && currentProducts[index]) {
      currentProducts[index] = {
        ...currentProducts[index],
        price: selling_price,
        qty: 1
      };
      form.setFieldsValue({ products: currentProducts });
      calculateTotal(null, form.getFieldsValue());
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'orange',
      confirmed: 'blue',
      in_progress: 'cyan',
      ready: 'green',
      delivered: 'default',
      cancelled: 'red'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'រង់ចាំ',
      confirmed: 'បានបញ្ជាក់',
      in_progress: 'កំពុងរៀបចំ',
      ready: 'រៀបចំរួច',
      delivered: 'បានដឹកជញ្ជូន',
      cancelled: 'បោះបង់'
    };
    return texts[status] || status;
  };

  const columns = [
    {
      title: "Pre-Order #",
      dataIndex: "pre_order_no",
      key: "pre_order_no",
      render: (no) => (
        <Tag color="blue" className="font-mono">
          {no}
        </Tag>
      )
    },
    {
      title: "អតិថិជន",
      dataIndex: "customer_name",
      key: "customer_name",
      render: (name, record) => (
        <div>
          <div className="font-semibold khmer-text-product">{name}</div>
          <div className="text-xs text-gray-500">{record.customer_tel}</div>
        </div>
      )
    },
    {
      title: "ថ្ងៃកម្មង់",
      dataIndex: "order_date",
      key: "order_date",
      render: (date) => formatDateClient(date, "DD/MM/YYYY")
    },
    {
      title: "ទំនិញ",
      dataIndex: "products_display",
      key: "products_display",
      render: (text) => <div className="max-w-[150px] truncate" title={text}>{text}</div>
    },
    {
      title: "បរិមាណ",
      dataIndex: "total_qty",
      key: "total_qty",
      render: (qty) => <Tag color="blue">{Number(qty || 0).toLocaleString()} L</Tag>
    },
    {
      title: "តម្លៃឯកតា",
      dataIndex: "first_price",
      key: "first_price",
      render: (price) => <span className="text-orange-600">${Number(price || 0).toLocaleString()}</span>
    },
    {
      title: "តម្លៃសរុប",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (amount) => (
        <span className="font-bold text-green-600 dark:text-green-400">
          {formatPrice(amount)}
        </span>
      )
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={getStatusColor(status)} className="khmer-text-product">
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: "សកម្មភាព",
      key: "action",
      render: (_, record) => {
        const profile = getProfile();
        const isAdmin = [1, 29].includes(profile.role_id);

        return (
          <Space>
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
              className="text-blue-500"
              size="small"
            >
              មើល
            </Button>

            {record.status === 'pending' && (
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
                size="small"
                className="text-orange-500"
              >
                កែប្រែ
              </Button>
            )}

            {(record.status === 'pending' || record.status === 'cancelled') && (
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record)}
                size="small"
              >
                លុប
              </Button>
            )}

            {record.status === 'pending' && isAdmin && (
              <Button
                type="primary"
                size="small"
                onClick={() => handleUpdateStatus(record.id, 'confirmed')}
                className="bg-green-500 hover:bg-green-600"
              >
                បញ្ជាក់
              </Button>
            )}

            {record.status === 'confirmed' && isAdmin && (
              <Button
                type="primary"
                size="small"
                onClick={() => handleUpdateStatus(record.id, 'ready')}
              >
                ម្រេចរួច
              </Button>
            )}
          </Space>
        );
      }
    }
  ];

  const MobileCard = ({ record }) => (
    <Card className="mb-3 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div>
          <Tag color="blue" className="font-mono mb-2">
            {record.pre_order_no}
          </Tag>
          <div className="font-semibold khmer-text-product">{record.customer_name}</div>
          <div className="text-xs text-gray-500">{record.customer_tel}</div>
        </div>
        <Tag color={getStatusColor(record.status)} className="khmer-text-product">
          {getStatusText(record.status)}
        </Tag>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div>
          <span className="text-gray-500">ថ្ងៃកម្មង់:</span>
          <div>{formatDateClient(record.order_date, "DD/MM/YYYY")}</div>
        </div>
        <div>
          <span className="text-gray-500">តម្លៃសរុប:</span>
          <div className="font-bold text-green-600">{formatPrice(record.total_amount)}</div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          block
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          មើល
        </Button>
        {record.status === 'pending' && (
          <Button
            block
            type="primary"
            onClick={() => handleUpdateStatus(record.id, 'confirmed')}
          >
            បញ្ជាក់
          </Button>
        )}
        {record.status === 'confirmed' && (
          <Button
            block
            type="primary"
            onClick={() => handleUpdateStatus(record.id, 'ready')}
          >
            ម្រេចរួច
          </Button>
        )}
      </div>
    </Card>
  );

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <MainPage loading={state.loading}>
        <div className="pre-order-management-container">
          {/* Header */}
          <Card className="mb-4">
            <Row align="middle" justify="space-between">
              <Col>
                <div className="flex items-center gap-3">
                  <ThunderboltOutlined className="text-3xl text-blue-500" />
                  <div>
                    <h2 className="text-2xl font-bold m-0">Pre-Order Management</h2>
                    <p className="text-sm text-gray-500 m-0">
                      គ្រប់គ្រងកម្មង់ជាមុន
                    </p>
                  </div>
                </div>
              </Col>
              <Col>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  size="large"
                  onClick={() => {
                    setState(prev => ({ ...prev, visibleModal: true, editRecord: null }));
                    form.resetFields();
                    setTotalAmount(0);
                  }}
                >
                  បង្កើត
                </Button>
              </Col>
            </Row>
          </Card>

          {/* Statistics Cards */}
          <Row gutter={[16, 16]} className="mb-4">
            <Col xs={12} sm={12} md={6} lg={6}>
              <Card>
                <Statistic
                  title={<span className="khmer-text-product">សរុប</span>}
                  value={state.stats.total}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6} lg={6}>
              <Card>
                <Statistic
                  title={<span className="khmer-text-product">រង់ចាំ</span>}
                  value={state.stats.pending}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6} lg={6}>
              <Card>
                <Statistic
                  title={<span className="khmer-text-product">បានបញ្ជាក់</span>}
                  value={state.stats.confirmed}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6} lg={6}>
              <Card>
                <Statistic
                  title={<span className="khmer-text-product">ម្រេចរួច</span>}
                  value={state.stats.ready}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Filters */}
          <Card className="mb-4">
            <div className="hidden lg:block">
              <Form layout="inline">
                <Form.Item>
                  <Select
                    placeholder="Status"
                    style={{ width: 150 }}
                    allowClear
                    value={filter.status}
                    onChange={(value) => setFilter(prev => ({ ...prev, status: value }))}
                  >
                    <Select.Option value="pending">រង់ចាំ</Select.Option>
                    <Select.Option value="confirmed">បានបញ្ជាក់</Select.Option>
                    <Select.Option value="ready">ម្រេចរួច</Select.Option>
                    <Select.Option value="delivered">បានដឹកជញ្ជូន</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item>
                  <Select
                    placeholder="អតិថិជន"
                    style={{ width: 200 }}
                    allowClear
                    showSearch
                    value={filter.customer_id}
                    onChange={(value) => setFilter(prev => ({ ...prev, customer_id: value }))}
                    options={customers}
                    filterOption={(input, option) => {
                      const search = input.toLowerCase();
                      const name = (option?.name || "").toLowerCase();
                      const tel = (option?.tel || "").toLowerCase();
                      const id = String(option?.value || "").toLowerCase();

                      return (
                        name.includes(search) ||
                        tel.includes(search) ||
                        id.includes(search) ||
                        (option?.label || "").toLowerCase().includes(search)
                      );
                    }}
                  />
                </Form.Item>

                <Form.Item>
                  <DatePicker
                    placeholder="ពីថ្ងៃ"
                    format="DD/MM/YYYY"
                    onChange={(date) => setFilter(prev => ({
                      ...prev,
                      from_date: date ? date.format('YYYY-MM-DD') : null
                    }))}
                  />
                </Form.Item>

                <Form.Item>
                  <DatePicker
                    placeholder="ដល់ថ្ងៃ"
                    format="DD/MM/YYYY"
                    onChange={(date) => setFilter(prev => ({
                      ...prev,
                      to_date: date ? date.format('YYYY-MM-DD') : null
                    }))}
                  />
                </Form.Item>

                <Form.Item>
                  <Button onClick={handleClearFilters}>
                    clear_filters
                  </Button>
                </Form.Item>
              </Form>
            </div>

            <div className="lg:hidden">
              <Button
                block
                icon={<FilterOutlined />}
                onClick={() => {/* Mobile filter modal */ }}
              >
                តម្រង
              </Button>
            </div>
          </Card>

          {/* Table / Cards */}
          <Card>
            <div className="hidden lg:block">
              <Table
                columns={columns}
                dataSource={state.list}
                rowKey="id"
                loading={state.loading}
                pagination={{ pageSize: 10 }}
              />
            </div>

            <div className="lg:hidden">
              {state.list.map(record => (
                <MobileCard key={record.id} record={record} />
              ))}
            </div>
          </Card>

          {/* Create Pre-Order Modal */}
          <Modal
            title={
              <div className="flex items-center gap-2">
                <PlusOutlined className="text-blue-500" />
                <span className="khmer-text-product text-xl">
                  {state.editRecord ? "កែប្រែ Pre-Order" : "បង្កើត Pre-Order ថ្មី"}
                </span>
              </div>
            }
            open={state.visibleModal}
            onCancel={() => {
              setState(prev => ({ ...prev, visibleModal: false, editRecord: null }));
              form.resetFields();
              setTotalAmount(0);
            }}
            footer={null}
            width={1000}
            className="pre-order-modal"
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              onValuesChange={calculateTotal}
              initialValues={{
                products: [{}]
              }}
            >
              {/* ✅ UPDATED: Manual Pre-Order Number Input */}
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="pre_order_no"
                    label={<span className="khmer-text-product">លេខប័ណ្ណ</span>}
                    rules={[{ required: true, message: 'សូមបញ្ចូលលេខប័ណ្ណ' }]}
                  >
                    <Input
                      placeholder="Ex: PO-2025-001"
                      disabled={!!state.editRecord} // Disable when editing
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="customer_id"
                    label={<span className="khmer-text-product">អតិថិជន</span>}
                    rules={[{ required: true, message: 'Please select customer' }]}
                  >
                    <Select
                      placeholder="ជ្រើសរើសអតិថិជន"
                      showSearch
                      options={customers}
                      onChange={handleCustomerChange}
                      filterOption={(input, option) => {
                        const search = input.toLowerCase();
                        const name = (option?.name || "").toLowerCase();
                        const tel = (option?.tel || "").toLowerCase();
                        const id = String(option?.value || "").toLowerCase();

                        return (
                          name.includes(search) ||
                          tel.includes(search) ||
                          id.includes(search) ||
                          (option?.label || "").toLowerCase().includes(search)
                        );
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="delivery_date"
                    label={<span className="khmer-text-product">ថ្ងៃដឹកជញ្ជូន</span>}
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>


              </Row>

              <Form.Item
                name="delivery_address"
                label={<span className="khmer-text-product">គោលដៅតែមួយ</span>}
              >
                <Input.TextArea rows={2} placeholder="បញ្ជាក់ទីតាំងដឹកជញ្ជូន..." />
              </Form.Item>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-bold khmer-text-product">បញ្ជីមុខទំនិញ</span>
                </div>
                <Form.List name="products">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <Row key={key} gutter={8} align="bottom" className="mb-2">
                          <Col span={8}>
                            <Form.Item
                              {...restField}
                              name={[name, 'product_id']}
                              label={name === 0 ? <span className="khmer-text-product text-xs text-gray-500">មុខទំនិញ</span> : null}
                              rules={[{ required: true, message: 'Missing product' }]}
                            >
                              <Select
                                placeholder="ជ្រើសរើសផលិតផល"
                                showSearch
                                options={products
                                  .filter(p => Number(p.actual_price) > 0)
                                  .map(p => ({
                                    label: `${p.name} (${p.category_name || 'N/A'})`,
                                    value: p.id
                                  }))}
                                onChange={(productId) => handleProductSelect(productId, name)}
                                filterOption={(input, option) =>
                                  (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                }
                              />
                            </Form.Item>
                          </Col>
                          <Col span={4}>
                            <Form.Item
                              {...restField}
                              name={[name, 'qty']}
                              label={name === 0 ? <span className="khmer-text-product text-xs text-gray-500">បរិមាណ</span> : null}
                              rules={[{ required: true, message: 'Missing qty' }]}
                            >
                              <InputNumber placeholder="0" style={{ width: '100%' }} />
                            </Form.Item>
                          </Col>
                          <Col span={4}>
                            <Form.Item
                              {...restField}
                              name={[name, 'price']}
                              label={name === 0 ? <span className="khmer-text-product text-xs text-gray-500">តម្លៃ/ឯកតា</span> : null}
                              rules={[{ required: true, message: 'Missing price' }]}
                            >
                              <InputNumber placeholder="0.00" style={{ width: '100%' }} />
                            </Form.Item>
                          </Col>
                          <Col span={6}>
                            <Form.Item
                              {...restField}
                              name={[name, 'destination']}
                              label={name === 0 ? <span className="khmer-text-product text-xs text-gray-500">គោលដៅពីរឬច្រើន</span> : null}
                            >
                              <Input placeholder="គោលដៅ" />
                            </Form.Item>
                          </Col>
                          <Col span={2}>
                            <Form.Item label={name === 0 ? <span className="khmer-text-product text-xs text-gray-500">លុប</span> : null}>
                              <Button
                                type="text"
                                danger
                                icon={<Trash2 />}
                                onClick={() => remove(name)}
                                disabled={fields.length === 1}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      ))}
                      <Form.Item>
                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                          បន្ថែមមុខទំនិញ
                        </Button>
                      </Form.Item>
                    </>
                  )}
                </Form.List>
              </div>

              <Divider />

              <div className="flex justify-between items-center">
                <div className="text-xl">
                  <span className="khmer-text-product text-gray-500 mr-2">សរុប:</span>
                  <span className="font-bold text-blue-600">{formatPrice(totalAmount)}</span>
                </div>
                <Space>
                  <Button onClick={() => setState(prev => ({ ...prev, visibleModal: false }))}>
                    បោះបង់
                  </Button>
                  <Button type="primary" htmlType="submit" size="large">
                    រក្សាទុក
                  </Button>
                </Space>
              </div>
            </Form>
          </Modal>
        </div>
      </MainPage>
    </ConfigProvider>
  );
}

export default PreOrderManagementPage;