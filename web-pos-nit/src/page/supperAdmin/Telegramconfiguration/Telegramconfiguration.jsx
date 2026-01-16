import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Input,
  Select,
  Space,
  Tag,
  message,
  Form,
  Row,
  Col,
  Popconfirm,
  Divider,
  Statistic,
  Tooltip,
  Badge,
  Alert,
  Checkbox,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  RobotOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BranchesOutlined,
  CrownOutlined,
  SettingOutlined,
  BellOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { request } from "../../../util/helper";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;

function TelegramConfiguration() {
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [testLoading, setTestLoading] = useState(null);
  const [form] = Form.useForm();

  const [state, setState] = useState({
    configs: [],
    branches: [],
    eventTypes: {},
    stats: {
      total_configs: 0,
      active_configs: 0,
      branch_configs: 0,
      working_configs: 0,
    },
  });

  // ✅✅✅ Event Types Options with Colors ✅✅✅
  const eventTypeGroups = {
    customer: {
      label: "Customer Events",
      icon: "👤",
      color: "blue",
      events: [
        { value: "new_customer", label: "អតិថិជនថ្មី / New Customer" },
        { value: "customer_payment", label: "ការបង់ប្រាក់ / Payment" },
        { value: "customer_debt", label: "បំណុល / Debt" },
      ],
    },
    order: {
      label: "Order Events",
      icon: "🛒",
      color: "green",
      events: [
        { value: "order_created", label: "បញ្ជាទិញថ្មី / New Order" },
        { value: "order_paid", label: "បង់ប្រាក់ / Order Paid" },
        { value: "order_cancelled", label: "បោះបង់ / Cancelled" },
        { value: "pre_order_created", label: "កម្មង់ទុកមុន / Pre Order Created" },
      ],
    },
    purchase: {
      label: "Purchase Events",
      icon: "📦",
      color: "orange",
      events: [
        { value: "purchase_created", label: "ការទិញថ្មី / New Purchase" },
        { value: "purchase_status_changed", label: "ប្តូរស្ថានភាព / Status Changed" },
        { value: "purchase_delivered", label: "ទទួលទំនិញ / Delivered" },
      ],
    },
    inventory: {
      label: "Inventory Events",
      icon: "📊",
      color: "red",
      events: [
        { value: "low_stock_alert", label: "ស្តុកនៅសល់តិច / Low Stock" },
        { value: "stock_received", label: "ទទួលស្តុក / Stock Received" },
        { value: "stock_adjustment", label: "កែសម្រួលស្តុក / Adjustment" },
      ],
    },
    finance: {
      label: "Finance Events",
      icon: "💰",
      color: "purple",
      events: [
        { value: "payment_received", label: "ទទួលការបង់ប្រាក់ / Payment Received" },
        { value: "expense_created", label: "ចំណាយថ្មី / New Expense" },
        { value: "daily_report", label: "របាយការណ៍ប្រចាំថ្ងៃ / Daily Report" },
      ],
    },
    system: {
      label: "System Events",
      icon: "⚙️",
      color: "default",
      events: [
        { value: "system_event", label: "System Alerts" },
        { value: "user_login", label: "User Login" },
      ],
    },
  };

  // Helper to get color for event tag
  const getEventColor = (eventType) => {
    for (const group of Object.values(eventTypeGroups)) {
      if (group.events.some(e => e.value === eventType)) {
        return group.color;
      }
    }
    return "blue"; // default
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load configurations
      const configRes = await request("telegram/configs", "get");
      if (configRes && configRes.success) {
        setState((prev) => ({
          ...prev,
          configs: configRes.configs || [],
          stats: configRes.stats || {},
        }));
      }

      // Load branches
      const branchRes = await request("telegram/branches", "get");
      if (branchRes && branchRes.success) {
        setState((prev) => ({
          ...prev,
          branches: branchRes.branches || [],
        }));
      }

      // Load event types
      const eventRes = await request("telegram/event-types", "get");
      if (eventRes && eventRes.success) {
        setState((prev) => ({
          ...prev,
          eventTypes: eventRes.event_types || {},
        }));
      }
    } catch (error) {
      console.error("Error loading data:", error);
      message.error("Failed to load configurations");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    form.resetFields();
    setModalVisible(true);
  };

const handleEdit = (record) => {
  // ✅✅✅ FIXED: Parse event_types if it's a JSON string
  let parsedEventTypes = record.event_types;
  
  // If event_types is a string, parse it
  if (typeof record.event_types === 'string') {
    try {
      parsedEventTypes = JSON.parse(record.event_types);
    } catch (e) {
      console.error('Failed to parse event_types:', e);
      parsedEventTypes = null;
    }
  }
  
  console.log('📝 Edit - Original event_types:', record.event_types);
  console.log('📝 Edit - Parsed event_types:', parsedEventTypes);
  
  form.setFieldsValue({
    ...record,
    id: record.id,
    event_types: parsedEventTypes, // ✅ Now properly parsed
  });
  
  setModalVisible(true);
};

  const handleDelete = async (id) => {
    try {
      const res = await request(`telegram/configs/${id}`, "delete");
      if (res && res.success) {
        message.success(res.message);
        loadData();
      } else {
        message.error(res.message || "Failed to delete configuration");
      }
    } catch (error) {
      console.error("Error deleting config:", error);
      message.error("Failed to delete configuration");
    }
  };

  const handleTest = async (id) => {
    try {
      setTestLoading(id);
      const res = await request(`telegram/configs/${id}/test`, "post");

      if (res && res.success) {
        message.success({
          content: res.message,
          duration: 3,
        });
        loadData();
      } else {
        message.error({
          content: res.message || "Test failed",
          duration: 5,
        });
      }
    } catch (error) {
      console.error("Error testing config:", error);
      message.error("Failed to send test message");
    } finally {
      setTestLoading(null);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const configId = form.getFieldValue("id");

      const method = configId ? "put" : "post";
      const url = configId
        ? `telegram/configs/${configId}`
        : "telegram/configs";

      const res = await request(url, method, values);

      if (res && res.success) {
        message.success(res.message);
        setModalVisible(false);
        loadData();
      } else {
        message.error(res.message || "Failed to save configuration");
      }
    } catch (error) {
      console.error("Error saving config:", error);
      message.error("Failed to save configuration");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "ប្រភេទ",
      dataIndex: "config_type",
      key: "config_type",
      width: 150,
      render: (type) => {
        const typeConfig = {
          super_admin: { icon: <CrownOutlined />, color: "gold", text: "Super Admin" },
          branch: { icon: <BranchesOutlined />, color: "blue", text: "Branch" },
          system: { icon: <SettingOutlined />, color: "purple", text: "System" },
        };
        const config = typeConfig[type] || {};
        return (
          <Tag color={config.color} icon={config.icon} className="px-3 py-1">
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: "ឈ្មោះ",
      dataIndex: "config_name",
      key: "config_name",
      width: 200,
      render: (text, record) => (
        <div>
          <div className="font-semibold text-base">{text}</div>
          {record.branch_name && (
            <Tag color="cyan" className="mt-1">
              {record.branch_name}
            </Tag>
          )}
        </div>
      ),
    },
    // ✅✅✅ NEW: Event Types Column ✅✅✅
    {
      title: "Event Filters",
      dataIndex: "event_types",
      key: "event_types",
      width: 250,
      render: (eventTypes) => {
        if (!eventTypes || eventTypes.length === 0) {
          return (
            <Tag color="purple" icon={<BellOutlined />}>
              ALL EVENTS (Manager)
            </Tag>
          );
        }

        const displayLimit = 3;
        const displayEvents = eventTypes.slice(0, displayLimit);
        const remaining = eventTypes.length - displayLimit;

        return (
          <div className="flex flex-wrap gap-1">
            {displayEvents.map((event) => (
              <Tag key={event} color={getEventColor(event)} className="text-xs border-0">
                {event.replace(/_/g, " ")}
              </Tag>
            ))}
            {remaining > 0 && (
              <Tooltip title={eventTypes.slice(displayLimit).join(", ")}>
                <Tag color="default" className="text-xs">
                  +{remaining} more
                </Tag>
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      title: "Bot Token",
      dataIndex: "bot_token",
      key: "bot_token",
      width: 180,
      render: (token) => (
        <Tooltip title={token}>
          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
            {token.substring(0, 15)}...
          </code>
        </Tooltip>
      ),
    },
    {
      title: "Chat ID",
      dataIndex: "chat_id",
      key: "chat_id",
      width: 130,
      render: (chatId) => (
        <code className="text-xs bg-blue-50 px-2 py-1 rounded text-blue-600">
          {chatId}
        </code>
      ),
    },
    {
      title: "ការពិសោធន៍ចុងក្រោយ",
      key: "last_test",
      width: 150,
      render: (_, record) => {
        if (!record.last_test_at) {
          return <Tag color="default">មិនទាន់សាកល្បង</Tag>;
        }

        return (
          <div>
            <div className="text-xs text-gray-500">
              {dayjs(record.last_test_at).format("DD-MM HH:mm")}
            </div>
            {record.last_test_status === "success" ? (
              <Tag color="success" icon={<CheckCircleOutlined />} className="mt-1">
                Success
              </Tag>
            ) : (
              <Tag color="error" icon={<CloseCircleOutlined />} className="mt-1">
                Failed
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      width: 90,
      align: "center",
      render: (active) => (
        <Badge
          status={active ? "success" : "default"}
          text={active ? "Active" : "Inactive"}
        />
      ),
    },
    {
      title: "សកម្មភាព",
      key: "action",
      width: 250,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Send test message">
            <Button
              type="primary"
              icon={<SendOutlined />}
              size="small"
              onClick={() => handleTest(record.id)}
              loading={testLoading === record.id}
              className="bg-green-500 hover:bg-green-600"
            >
              Test
            </Button>
          </Tooltip>

          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            កែប្រែ
          </Button>

          <Popconfirm
            title="លុបការកំណត់នេះ?"
            description="តើអ្នកប្រាកដថាចង់លុបការកំណត់នេះ?"
            onConfirm={() => handleDelete(record.id)}
            okText="បាទ/ចាស"
            cancelText="មិន"
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              លុប
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <Card className="mb-4 shadow-lg bg-gradient-to-r from-blue-600 to-cyan-600 border-0">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-white text-3xl font-bold flex items-center gap-3">
              <RobotOutlined /> Telegram Bot Configuration
            </h1>
            <p className="text-white text-sm opacity-90 mt-1">
              គ្រប់គ្រង Telegram Bot Tokens និង Event Filters សម្រាប់សាខានីមួយៗ
            </p>
          </div>
          <Space>
            <Button
              type="default"
              size="large"
              icon={<ReloadOutlined />}
              onClick={loadData}
              loading={loading}
              className="bg-white text-blue-600 border-0 hover:bg-gray-100"
            >
              ផ្ទុកឡើងវិញ
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={handleCreate}
              className="bg-white text-blue-600 border-0 hover:bg-gray-100"
            >
              បន្ថែមថ្មី
            </Button>
          </Space>
        </div>
      </Card>

      {/* Statistics */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-md">
            <Statistic
              title="ចំនួនសរុប"
              value={state.stats.total_configs}
              prefix={<RobotOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-md">
            <Statistic
              title="កំពុងដំណើរការ"
              value={state.stats.active_configs}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-md">
            <Statistic
              title="សាខា"
              value={state.stats.branch_configs}
              prefix={<BranchesOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-md">
            <Statistic
              title="សាកល្បងជោគជ័យ"
              value={state.stats.working_configs}
              prefix={<SendOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Info Alert */}
      <Alert
        message="ℹ️ របៀបប្រើប្រាស់ Event Filters"
        description={
          <div>
            <p>
              • <strong>NULL (ទទេ):</strong> ទទួល alerts ទាំងអស់ (សម្រាប់ Manager)
            </p>
            <p>
              • <strong>Specific Events:</strong> ទទួលតែ events ដែលបានជ្រើសរើស
            </p>
            <p>
              • <strong>Multiple Groups:</strong> អាចមាន groups ច្រើនក្នុង branch តែមួយ
            </p>
            <p className="mt-2 text-xs text-gray-600">
              ឧទាហរណ៍: "Procurement Team" ទទួលតែ purchase events, "Sales Team" ទទួលតែ order events
            </p>
          </div>
        }
        type="info"
        showIcon
        className="mb-4"
      />

      {/* Main Table */}
      <Card className="shadow-md">
        <Table
          loading={loading}
          dataSource={state.configs}
          columns={columns}
          rowKey="id"
          scroll={{ x: 1500 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `ចំនួនសរុប ${total} configurations`,
          }}
        />
      </Card>

      {/* ✅✅✅ ENHANCED Modal with Event Types ✅✅✅ */}
      <Modal
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
        title={
          <div className="text-xl font-bold flex items-center gap-2">
            {form.getFieldValue("id") ? (
              <>
                <EditOutlined className="text-blue-600" /> កែប្រែការកំណត់
              </>
            ) : (
              <>
                <PlusOutlined className="text-green-600" /> បន្ថែមការកំណត់ថ្មី
              </>
            )}
          </div>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="config_type"
                label="ប្រភេទ"
                rules={[{ required: true, message: "ជ្រើសរើសប្រភេទ" }]}
              >
                <Select placeholder="ជ្រើសរើសប្រភេទ">
                  <Option value="super_admin">
                    <CrownOutlined /> Super Admin
                  </Option>
                  <Option value="branch">
                    <BranchesOutlined /> Branch
                  </Option>
                  <Option value="system">
                    <SettingOutlined /> System
                  </Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="config_name"
                label="ឈ្មោះ"
                rules={[{ required: true, message: "បញ្ចូលឈ្មោះ" }]}
              >
                <Input placeholder="ឧ. Procurement Team" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.config_type !== currentValues.config_type
            }
          >
            {({ getFieldValue }) =>
              getFieldValue("config_type") === "branch" ? (
                <Form.Item
                  name="branch_name"
                  label="សាខា"
                  rules={[{ required: true, message: "ជ្រើសរើសសាខា" }]}
                >
                  <Select placeholder="ជ្រើសរើសសាខា">
                    {state.branches.map((branch) => (
                      <Option key={branch} value={branch}>
                        {branch}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              ) : null
            }
          </Form.Item>

          {/* ✅✅✅ NEW: Event Types Selection ✅✅✅ */}
          <Form.Item
            name="event_types"
            label={
              <span className="flex items-center gap-2">
                <FilterOutlined /> Event Filters
                <Tooltip title="ទទេ = ទទួលទាំងអស់ (Manager). ជ្រើសរើស = ទទួលតែ events ដែលបានជ្រើស">
                  <BellOutlined className="text-blue-500" />
                </Tooltip>
              </span>
            }
          >
            <Select
              mode="multiple"
              placeholder="ទុកទទេដើម្បីទទួលទាំងអស់ / Select specific events"
              allowClear
              style={{ width: "100%" }}
            >
              {Object.entries(eventTypeGroups).map(([groupKey, group]) => (
                <Select.OptGroup
                  key={groupKey}
                  label={`${group.icon} ${group.label}`}
                >
                  {group.events.map((event) => (
                    <Option key={event.value} value={event.value}>
                      <Space>
                        <span>{group.icon}</span>
                        <span>{event.label}</span>
                      </Space>
                    </Option>
                  ))}
                </Select.OptGroup>
              ))}
            </Select>
          </Form.Item>

          <Alert
            message="💡 Event Filter Tips"
            description={
              <div className="text-xs">
                <p>• <strong>ទទេ (NULL):</strong> Group នេះទទួល alerts ទាំងអស់ (សម្រាប់ Manager)</p>
                <p>• <strong>ជ្រើសរើស:</strong> Group នេះទទួលតែ events ដែលបានជ្រើសរើស</p>
                <p>• <strong>ឧទាហរណ៍:</strong> "Procurement Team" → ជ្រើសរើស purchase_created, purchase_delivered</p>
              </div>
            }
            type="info"
            showIcon
            className="mb-4"
          />

          <Form.Item
            name="bot_token"
            label="Bot Token"
            rules={[
              { required: true, message: "បញ្ចូល Bot Token" },
              {
                pattern: /^[0-9]+:[a-zA-Z0-9_-]+$/,
                message: "Format មិនត្រឹមត្រូវ (ឧ. 123456:ABC-Def...)"
              }
            ]}
          >
            <Input.Password
              placeholder="7018630729:AAGHSample..."
              className="font-mono"
            />
          </Form.Item>

          <Form.Item
            name="chat_id"
            label="Chat ID"
            rules={[{ required: true, message: "បញ្ចូល Chat ID" }]}
          >
            <Input
              placeholder="-1002627306293 ឬ 123456789"
              className="font-mono"
            />
          </Form.Item>

          <Form.Item name="description" label="ពិពណ៌នា">
            <TextArea rows={3} placeholder="ពិពណ៌នាអំពីការកំណត់នេះ..." />
          </Form.Item>

          <Form.Item
            name="is_active"
            label="Status"
            rules={[{ required: true }]}
            initialValue={1}
          >
            <Select>
              <Option value={1}>Active</Option>
              <Option value={0}>Inactive</Option>
            </Select>
          </Form.Item>

          <Alert
            message="💡 របៀបយក Bot Token និង Chat ID"
            description={
              <div className="text-xs">
                <p>
                  <strong>Bot Token:</strong> @BotFather → /newbot
                </p>
                <p>
                  <strong>Chat ID:</strong> @userinfobot → /start
                </p>
                <p>
                  <strong>Group Chat ID:</strong> Add @getmyid_bot → /my_id
                </p>
              </div>
            }
            type="info"
            showIcon
            className="mb-4"
          />

          <Divider />

          <div className="flex justify-end gap-3">
            <Button onClick={() => setModalVisible(false)}>បោះបង់</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {form.getFieldValue("id") ? "កែប្រែ" : "បន្ថែម"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

export default TelegramConfiguration;