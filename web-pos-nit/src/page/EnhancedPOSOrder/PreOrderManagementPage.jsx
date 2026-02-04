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
  Badge,
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
  DeleteOutlined,
  PrinterOutlined
} from "@ant-design/icons";
import MainPage from "../../component/layout/MainPage";
import { request, formatDateClient, formatPrice } from "../../util/helper";
import { getProfile } from "../../store/profile.store";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "./PreOrderManagement.css";
import { useTranslation } from "../../locales/TranslationContext";
import PreOrderForm from "./PreOrderForm";

function PreOrderManagementPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();

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

  const parseSpecialInstructions = (str) => {
    if (!str) return {};
    const parts = str.split('|').map(s => s.trim());
    return {
      supplier: parts.find(s => s.startsWith('Supplier:'))?.replace('Supplier:', '').trim() || '',
      plate: parts.find(s => s.startsWith('Plate:'))?.replace('Plate:', '').trim() || '',
      received: parts.find(s => s.startsWith('Received:'))?.replace('Received:', '').trim() || ''
    };
  };

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
        const rawList = res.list || [];

        const list = rawList.map((item, index) => {
          const details = item.details_json || [];
          const instructions = parseSpecialInstructions(item.special_instructions);

          const row = {
            ...item,
            key: item.id,
            index: index + 1,
            supplier_name: instructions.supplier,
            plate_number: instructions.plate,
            received_date: instructions.received,

            // Initialize all product type columns
            qty_extra: 0, price_extra: 0, delivered_extra: 0, qty_extra_rem: 0,
            qty_super: 0, price_super: 0, delivered_super: 0, qty_super_rem: 0,
            qty_diesel: 0, price_diesel: 0, delivered_diesel: 0, qty_diesel_rem: 0,
            qty_lpg: 0, price_lpg: 0, delivered_lpg: 0, qty_lpg_rem: 0,
          };

          const destinations = new Set();

          details.forEach(d => {
            const name = (d.product_name || "").toLowerCase();
            const qty = Number(d.qty || 0);
            const delivered = Number(d.delivered_qty || 0);
            const remaining = Number(d.remaining_qty !== undefined ? d.remaining_qty : qty);
            const price = Number(d.price || 0);

            if (d.destination) destinations.add(d.destination);

            if (name.includes('extra') || name.includes('red')) {
              row.qty_extra = qty;
              row.price_extra = price;
              row.delivered_extra = delivered;
              row.qty_extra_rem = remaining;
            } else if (name.includes('super') || name.includes('green')) {
              row.qty_super = qty;
              row.price_super = price;
              row.delivered_super = delivered;
              row.qty_super_rem = remaining;
            } else if (name.includes('diesel')) {
              row.qty_diesel = qty;
              row.price_diesel = price;
              row.delivered_diesel = delivered;
              row.qty_diesel_rem = remaining;
            } else if (name.includes('lpg')) {
              row.qty_lpg = qty;
              row.price_lpg = price;
              row.delivered_lpg = delivered;
              row.qty_lpg_rem = remaining;
            }
          });

          row.destination_display = Array.from(destinations).join(', ');

          return row;
        });

        const stats = {
          total: list.length,
          pending: list.filter(po => po.status === 'pending').length,
          confirmed: list.filter(po => po.status === 'confirmed').length,
          ready: list.filter(po => po.status === 'ready').length,
          delivered: list.filter(po => po.status === 'delivered').length
        };

        setState(prev => ({
          ...prev,
          list: list,
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

  const handleViewDetail = (record) => {
    navigate(`/pre-order-detail/${record.id}`);
  };

  const handleEdit = (record) => {
    if (record.status !== 'pending') {
      message.warning('អាចកែបានតែកម្មង់ដែលកំពុងរង់ចាំប៉ុណ្ណោះ');
      return;
    }
    setState(prev => ({
      ...prev,
      editRecord: record,
      visibleModal: true
    }));
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

  // ✅ UPDATED COLUMNS - Matching the image structure exactly
  const columns = [
    {
      title: 'ល.រ',
      dataIndex: 'index',
      width: 50,

      align: 'center',
    },
    {
      title: 'អតិថិជនឈ្មោះ',
      dataIndex: 'customer_name',
      width: 150,

      align: 'center',
      render: (text) => <div className="font-semibold khmer-text-product">{text}</div>
    },
    {
      title: 'លេខទូរស័ព្ទ',
      dataIndex: 'customer_tel',
      width: 130,
      align: 'center',
      render: (text) => <span className="text-xs">{text}</span>
    },
    {
      title: 'ថ្ងៃទីបញ្ជាទិញ',
      dataIndex: 'order_date',
      width: 120,
      align: 'center',
      render: (date) => formatDateClient(date, "DD/MM/YYYY")
    },
    {
      title: 'ថ្ងៃទីទទួលទំនិញ',
      dataIndex: 'delivery_date',
      width: 130,
      align: 'center',
      render: (date) => date ? formatDateClient(date, "DD/MM/YYYY") : "-"
    },
    {
      title: 'ឈ្មោះក្រុមហ៊ុនផ្តល់ផ្គង់',
      dataIndex: 'supplier_name',
      width: 180,
      align: 'center',
      render: (text) => <span className="khmer-text-product">{text || "-"}</span>
    },
    {
      title: <span className="khmer-text-product">ប្រភេទប្រេង</span>,
      children: [
        {
          title: 'Extra',
          dataIndex: 'qty_extra',
          width: 80,
          align: 'center',
          render: v => v ? <span className="font-semibold">{Number(v).toLocaleString()}</span> : '-'
        },
        {
          title: 'Super',
          dataIndex: 'qty_super',
          width: 80,
          align: 'center',
          render: v => v ? <span className="font-semibold">{Number(v).toLocaleString()}</span> : '-'
        },
        {
          title: 'Diesel',
          dataIndex: 'qty_diesel',
          width: 80,
          align: 'center',
          render: v => v ? <span className="font-semibold">{Number(v).toLocaleString()}</span> : '-'
        },
        {
          title: 'LPG',
          dataIndex: 'qty_lpg',
          width: 80,
          align: 'center',
          render: v => v ? <span className="font-semibold">{Number(v).toLocaleString()}</span> : '-'
        },
      ]
    },
    {
      title: <span className="khmer-text-product">តម្លៃតោន</span>,
      children: [
        {
          title: 'Extra',
          dataIndex: 'price_extra',
          width: 80,
          align: 'center',
          render: v => v ? `$${Number(v).toFixed(2)}` : '-'
        },
        {
          title: 'Super',
          dataIndex: 'price_super',
          width: 80,
          align: 'center',
          render: v => v ? `$${Number(v).toFixed(2)}` : '-'
        },
        {
          title: 'Diesel',
          dataIndex: 'price_diesel',
          width: 80,
          align: 'center',
          render: v => v ? `$${Number(v).toFixed(2)}` : '-'
        },
        {
          title: 'LPG',
          dataIndex: 'price_lpg',
          width: 80,
          align: 'center',
          render: v => v ? `$${Number(v).toFixed(2)}` : '-'
        },
      ]
    },
    {
      title: <span className="khmer-text-product">ថ្ងៃទីបានទទួលទំនិញជាក់ស្តែង</span>,
      children: [
        {
          title: 'Extra',
          dataIndex: 'delivered_extra',
          width: 90,
          align: 'center',
          render: (v) => v ? <span className="text-green-600 font-bold">{Number(v).toLocaleString()}</span> : '-'
        },
        {
          title: 'Super',
          dataIndex: 'delivered_super',
          width: 90,
          align: 'center',
          render: (v) => v ? <span className="text-green-600 font-bold">{Number(v).toLocaleString()}</span> : '-'
        },
        {
          title: 'Diesel',
          dataIndex: 'delivered_diesel',
          width: 90,
          align: 'center',
          render: (v) => v ? <span className="text-green-600 font-bold">{Number(v).toLocaleString()}</span> : '-'
        },
        {
          title: 'LPG',
          dataIndex: 'delivered_lpg',
          width: 90,
          align: 'center',
          render: (v) => v ? <span className="text-green-600 font-bold">{Number(v).toLocaleString()}</span> : '-'
        },

      ]
    },
    {
      title: <span className="khmer-text-product">ផ្ទៀងផ្ទាត់បរិមាណនៅសល់</span>,
      children: [
        {
          title: 'Extra',
          dataIndex: 'qty_extra_rem',
          width: 90,
          align: 'center',
          render: v => v ? <span className="text-orange-600 font-bold">{Number(v).toLocaleString()}</span> : '-'
        },
        {
          title: 'Super',
          dataIndex: 'qty_super_rem',
          width: 90,
          align: 'center',
          render: v => v ? <span className="text-orange-600 font-bold">{Number(v).toLocaleString()}</span> : '-'
        },
        {
          title: 'Diesel',
          dataIndex: 'qty_diesel_rem',
          width: 90,
          align: 'center',
          render: v => v ? <span className="text-orange-600 font-bold">{Number(v).toLocaleString()}</span> : '-'
        },
        {
          title: 'LPG',
          dataIndex: 'qty_lpg_rem',
          width: 90,
          align: 'center',
          render: v => v ? <span className="text-orange-600 font-bold">{Number(v).toLocaleString()}</span> : '-'
        },
      ]
    },
    {
      title: <span className="khmer-text-product">ពិនិត្យមើល</span>,
      width: 80,
      align: 'center',

      render: (_, record) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          className="text-blue-500"
          onClick={() => handleViewDetail(record)}
        />
      )
    },
    {
      title: <span className="khmer-text-product">កែសម្រួល</span>,
      width: 80,
      align: 'center',

      render: (_, record) => record.status === 'pending' && (
        <Button
          type="text"
          icon={<EditOutlined />}
          className="text-orange-500"
          onClick={() => handleEdit(record)}
        />
      )
    },
    {
      title: <span className="khmer-text-product">កំណត់សម្គាល់</span>,
      width: 110,
      align: 'center',
      render: (_, record) => (
        <Input.TextArea
          placeholder="បញ្ចូលកំណត់សម្គាល់..."
          size="small"
          rows={1}
          style={{ fontSize: 11 }}
        />
      )
    },
    {
      title: <span className="khmer-text-product">ព្រីន</span>,
      width: 70,
      align: 'center',
      render: (_, record) => (
        <Button
          type="text"
          icon={<PrinterOutlined />}
          className="text-gray-500"
          onClick={() => message.info('មុខងារព្រីននឹងមកដល់ឆាប់ៗ')}
        />
      )
    },
    {
      title: <span className="khmer-text-product">លុបចេញ</span>,
      width: 70,
      align: 'center',

      render: (_, record) => (record.status === 'pending' || record.status === 'cancelled') && (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(record)}
        />
      )
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
          <span className="text-gray-500 khmer-text-product">ថ្ងៃកម្មង់:</span>
          <div>{formatDateClient(record.order_date, "DD/MM/YYYY")}</div>
        </div>
        <div>
          <span className="text-gray-500 khmer-text-product">តម្លៃសរុប:</span>
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
      </div>
    </Card>
  );

  return (
    <MainPage loading={state.loading}>
      <div className="pre-order-management-container">
        {/* Header */}
        <Card className="mb-4">
          <Row align="middle" justify="space-between">
            <Col>
              <div className="flex items-center gap-3">
                <ThunderboltOutlined className="text-3xl text-blue-500" />
                <div>
                  <h2 className="text-2xl font-bold m-0 khmer-text-product">គ្រប់គ្រងប្រេងកម្មង់ទុក</h2>

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
                }}
                className="khmer-text-product"
              >
                បង្កើតថ្មី
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
                valueStyle={{ color: '#1890ff', display: 'flex', justifyContent: 'center' }}
                style={{ textAlign: 'left' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6} lg={6}>
            <Card>
              <Statistic
                title={<span className="khmer-text-product">រង់ចាំ</span>}
                value={state.stats.pending}
                valueStyle={{ color: '#faad14', display: 'flex', justifyContent: 'center' }}
                style={{ textAlign: 'left' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6} lg={6}>
            <Card>
              <Statistic
                title={<span className="khmer-text-product">បានបញ្ជាក់</span>}
                value={state.stats.confirmed}
                valueStyle={{ color: '#1890ff', display: 'flex', justifyContent: 'center' }}
                style={{ textAlign: 'left' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6} lg={6}>
            <Card>
              <Statistic
                title={<span className="khmer-text-product">រួចរាល់</span>}
                value={state.stats.ready}
                valueStyle={{ color: '#52c41a', display: 'flex', justifyContent: 'center' }}
                style={{ textAlign: 'left' }}
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
                  className="khmer-text-product"
                >
                  <Select.Option value="pending">រង់ចាំ</Select.Option>
                  <Select.Option value="confirmed">បានបញ្ជាក់</Select.Option>
                  <Select.Option value="ready">រួចរាល់</Select.Option>
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
                  className="khmer-text-product"
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
                  className="khmer-text-product"
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
                  className="khmer-text-product"
                />
              </Form.Item>

              <Form.Item>
                <Button onClick={handleClearFilters} className="khmer-text-product">
                  សម្អាត
                </Button>
              </Form.Item>
            </Form>
          </div>

          <div className="lg:hidden">
            <Button
              block
              icon={<FilterOutlined />}
              onClick={() => {/* Mobile filter modal */ }}
              className="khmer-text-product"
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
              pagination={{
                pageSize: 20,
                showTotal: (total) => `សរុប ${total} កំណត់ត្រា`
              }}
              scroll={{ x: 'max-content', y: 600 }}
              bordered
            />
          </div>

          <div className="lg:hidden">
            {state.list.map(record => (
              <MobileCard key={record.id} record={record} />
            ))}
          </div>
        </Card>

        {/* PreOrderForm Modal */}
        <PreOrderForm
          visible={state.visibleModal}
          editRecord={state.editRecord}
          onCancel={() => setState(prev => ({ ...prev, visibleModal: false, editRecord: null }))}
          onSuccess={() => {
            loadPreOrders();
            setState(prev => ({ ...prev, visibleModal: false, editRecord: null }));
          }}
        />
      </div>
    </MainPage>
  );
}

export default PreOrderManagementPage;