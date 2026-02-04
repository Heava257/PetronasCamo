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
  Avatar,
  Tooltip,
  Row,
  Col,
  Statistic,
  message,
  Popconfirm,
  Upload,
  Badge,
  Tabs,
  Divider,
  Form,
  Drawer,
  Result // ✅ Import Result
} from "antd";
import {
  UserOutlined,
  PlusOutlined,
  // ... (keep imports)
  StopOutlined,
  SafetyCertificateOutlined,
  ReloadOutlined,
  CrownOutlined,
  CheckCircleOutlined,
  BranchesOutlined,
  TeamOutlined,
  FilterOutlined,
  DashboardOutlined,
  BarChartOutlined,
  UploadOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { Config } from "../../../util/config";
import { formatDateServer, request } from "../../../util/helper";
import { configStore } from "../../../store/configStore";
import { getProfile } from "../../../store/profile.store"; // ✅ Import getProfile
import OnlineStatusAvatar from '../OnlineStatus/OnlineStatusAvatar';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

function SuperAdminUserManagement() {
  const { config } = configStore();
  let user = config.user || {};

  // �️ Fallback: If config.user is empty (e.g. on hard refresh), try localStorage
  if (!user.id || !user.role_id) {
    const savedProfile = getProfile();
    if (savedProfile) {
      user = savedProfile;
    }
  }

  // �🔒 Security Check: Only Super Admin (ID 29)
  // Fix: Check for 'Supper' (typo support) and string/number role_id
  const roleName = String(
    user.role_name ||
    (user.role && user.role.name) ||
    config.role ||
    config.role_name ||
    ''
  ).toLowerCase();

  const isSuperAdmin =
    Number(user.role_id) === 29 ||
    Number(config.role_id) === 29 ||
    roleName.includes('super admin') ||
    roleName.includes('supper admin');

  if (!isSuperAdmin) {
    return (
      <div className="p-8 flex justify-center items-center min-h-screen bg-gray-50">
        <Result
          status="403"
          title="403"
          subTitle="Sorry, you are not authorized to access the Super Admin Dashboard."
          extra={<Button type="primary" onClick={() => window.location.href = '/'}>Back Home</Button>}
        />
      </div>
    );
  }

  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [superAdminModalVisible, setSuperAdminModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("users");

  const [form] = Form.useForm();
  const [superAdminForm] = Form.useForm();

  const [state, setState] = useState({
    users: [],
    stats: {},
    branches: [],
    roles: [],
    systemStats: {},
    filters: {
      branch_name: 'all',
      role_code: 'all',
      is_active: 'all',
      search: ''
    }
  });
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    loadUserData();
    if (activeTab === "statistics") {
      loadSystemStatistics();
    }
  }, [activeTab]);

  // នៅក្នុង SuperAdminUserManagement.jsx
  const loadUserData = async (filters = state.filters) => {
    try {
      setLoading(true);

      const queryParams = new URLSearchParams();
      if (filters.branch_name !== 'all') queryParams.append('branch_name', filters.branch_name);
      if (filters.role_code !== 'all') queryParams.append('role_code', filters.role_code);
      if (filters.is_active !== 'all') queryParams.append('is_active', filters.is_active);
      if (filters.search) queryParams.append('search', filters.search);

      const res = await request(`superadmin/users?${queryParams.toString()}`, "get");

      if (res && res.success) {


        setState((prev) => ({
          ...prev,
          users: res.users || [],
          stats: res.stats || {},
          branches: res.branches || [],
          roles: res.roles || [],
          filters: res.filters_applied
        }));
      } else {
        message.error(res.message || "Failed to load users");
      }
    } catch (error) {
      console.error("Error loading users:", error);
      message.error("Failed to load user list");
    } finally {
      setLoading(false);
    }
  };

  const loadSystemStatistics = async () => {
    try {
      const res = await request("superadmin/statistics", "get");
      if (res && res.success) {
        setState((prev) => ({
          ...prev,
          systemStats: res.stats || {}
        }));
      }
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...state.filters, [key]: value };
    setState((prev) => ({ ...prev, filters: newFilters }));
    loadUserData(newFilters);
  };

  const handleCreateSuperAdmin = () => {
    setSuperAdminModalVisible(true);
    superAdminForm.resetFields();
    setFileList([]);
  };

  const handleCreateUser = () => {
    setModalVisible(true);
    form.resetFields();
    setFileList([]);
  };

  const handleEdit = (user) => {
    form.setFieldsValue({
      ...user,
      password: '' // Don't populate password
    });
    setModalVisible(true);

    if (user.profile_image) {
      setFileList([{
        uid: '-1',
        name: user.profile_image,
        status: 'done',
        url: Config.getFullImagePath(user.profile_image),
      }]);
    }
  };

  const handleDelete = async (userId) => {
    try {
      const res = await request("superadmin/users", "delete", { user_id: userId });

      if (res && res.success) {
        message.success(res.message);
        loadUserData();
      } else {
        message.error(res.message || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      message.error("Failed to delete user");
    }
  };

  const handleSubmitSuperAdmin = async (values) => {
    try {
      setLoading(true);
      const formData = new FormData();

      Object.keys(values).forEach(key => {
        if (values[key] !== undefined && values[key] !== null) {
          formData.append(key, values[key]);
        }
      });

      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append("upload_image", fileList[0].originFileObj);
      }

      const res = await request("superadmin/create-superadmin", "post", formData);

      if (res && res.success) {
        message.success(res.message);
        setSuperAdminModalVisible(false);
        loadUserData();
      } else {
        message.error(res.message || "Failed to create Super Admin");
      }
    } catch (error) {
      console.error("Error creating Super Admin:", error);
      message.error("Failed to create Super Admin account");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitUser = async (values) => {
    try {
      setLoading(true);
      const formData = new FormData();
      const userId = form.getFieldValue("id");

      Object.keys(values).forEach(key => {
        if (values[key] !== undefined && values[key] !== null) {
          formData.append(key, values[key]);
        }
      });

      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append("upload_image", fileList[0].originFileObj);
      }

      const method = userId ? "put" : "post";
      const url = userId ? `superadmin/users/${userId}` : "auth/register";

      const res = await request(url, method, formData);

      if (res && res.success) {
        message.success(res.message);
        setModalVisible(false);
        loadUserData();
      } else {
        message.error(res.message || "Failed to save user");
      }
    } catch (error) {
      console.error("Error saving user:", error);
      message.error("Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("You can only upload image files!");
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("Image must be smaller than 2MB!");
      return false;
    }
    return false;
  };

  const columns = [
    {
      title: "រូបភាព",
      dataIndex: "profile_image",
      key: "profile_image",
      width: 80,
      align: "center",
      render: (image, record) => (
        <OnlineStatusAvatar user={record} size={50} />
      ),
    },
    {
      title: "ព័ត៌មានអ្នកប្រើប្រាស់",
      key: "info",
      width: 250,
      render: (_, record) => (
        <div>
          <div className="font-semibold text-base">{record.name}</div>
          <div className="text-sm text-gray-500">{record.username}</div>
          <Space size={4} className="mt-1">
            <Tag color={record.role_code === "SUPER_ADMIN" ? "gold" : record.role_code === "ADMIN" ? "blue" : "green"}>
              {record.role_name}
            </Tag>
            {!record.is_active && <Tag color="red">Inactive</Tag>}
          </Space>
        </div>
      ),
    },
    {
      title: "ទំនាក់ទំនង",
      key: "contact",
      width: 200,
      render: (_, record) => (
        <div className="text-sm">
          <div>📱 {"tel:" + record.tel || "N/A"}</div>
          <div className="text-gray-500">📧 {record.email || record.username}</div>
        </div>
      ),
    },
    {
      title: "សាខា",
      dataIndex: "branch_name",
      key: "branch_name",
      width: 120,
      render: (text) => (
        <Tag color="purple" className="font-semibold">
          {text || "N/A"}
        </Tag>
      ),
    },
    {
      title: "អ្នកប្រើប្រាស់គ្រប់គ្រង",
      key: "managed_users",
      width: 130,
      align: "center",
      render: (_, record) => (
        <Tooltip title="Number of users this person manages">
          <Tag color="cyan" className="text-base px-3 py-1">
            <TeamOutlined /> {record.managed_users_count || 0}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: "ចូលចុងក្រោយ",
      dataIndex: "last_login_time",
      key: "last_login",
      width: 180,
      render: (date) => (date ? formatDateServer(date, "DD-MM-YYYY HH:mm") : "មិនទាន់ចូល"),
    },
    {
      title: "Status",
      key: "is_active",
      width: 100,
      align: "center",
      render: (_, record) => (
        <Tag color={record.is_active ? "green" : "red"} className="px-3 py-1">
          {record.is_active ? "សកម្ម" : "អសកម្ម"}
        </Tag>
      ),
    },
    {
      title: "សកម្មភាព",
      key: "action",
      width: 180,
      fixed: "right",
      render: (_, record) => {
        if (record.role_code === "SUPER_ADMIN") {
          return (
            <Space size="small">
              <Button
                type="primary"
                icon={<EditOutlined />}
                size="small"
                onClick={() => handleEdit(record)}
              >
                កែប្រែ
              </Button>
              <Tag color="gold">
                <CrownOutlined /> Protected
              </Tag>
            </Space>
          );
        }

        return (
          <Space size="small">
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
            >
              កែប្រែ
            </Button>
            <Popconfirm
              title="លុបអ្នកប្រើប្រាស់នេះ?"
              description="តើអ្នកប្រាកដថាចង់លុបអ្នកប្រើប្រាស់នេះ?"
              onConfirm={() => handleDelete(record.id)}
              okText="បាទ/ចាស"
              cancelText="មិន"
            >
              <Button danger icon={<DeleteOutlined />} size="small">
                លុប
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <Card className="mb-4 shadow-lg bg-gradient-to-r from-purple-600 to-pink-600 border-0">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-white text-3xl font-bold flex items-center gap-3">
              <SafetyCertificateOutlined /> Super Admin - User Management
            </h1>
            <p className="text-white text-sm opacity-90 mt-1">
              ការគ្រប់គ្រងអ្នកប្រើប្រាស់ទាំងអស់ក្នុងប្រព័ន្ធ / Manage All System Users
            </p>
          </div>
          <Space>
            <Button
              type="default"
              size="large"
              icon={<ReloadOutlined />}
              onClick={() => activeTab === "users" ? loadUserData() : loadSystemStatistics()}
              loading={loading}
              className="bg-white text-purple-600 border-0 hover:bg-gray-100"
            >
              ផ្ទុកឡើងវិញ
            </Button>
            <Button
              size="large"
              icon={<CrownOutlined />}
              onClick={handleCreateSuperAdmin}
              className="bg-yellow-500 text-white border-0 hover:bg-yellow-600"
            >
              បង្កើត Super Admin
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={handleCreateUser}
              className="bg-white text-purple-600 border-0 hover:bg-gray-100"
            >
              បង្កើតអ្នកប្រើប្រាស់
            </Button>
          </Space>
        </div>
      </Card>

      {/* Statistics */}
      <Row gutter={[16, 16]} className="mb-4">
        {activeTab === "users" && (
          <>
            <Col xs={24} sm={12} lg={6}>
              <Card className="shadow-md">
                <Statistic
                  title="ចំនួនអ្នកប្រើប្រាស់សរុប"
                  value={state.stats.total_users || 0}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: "#3f8600" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="shadow-md">
                <Statistic
                  title="អ្នកប្រើប្រាស់សកម្ម"
                  value={state.stats.active_users || 0}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="shadow-md">
                <Statistic
                  title="សាខាទាំងអស់"
                  value={state.stats.total_branches || 0}
                  prefix={<BranchesOutlined />}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="shadow-md">
                <Statistic
                  title="ក្រុមទាំងអស់"
                  value={state.stats.total_groups || 0}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: "#722ed1" }}
                />
              </Card>
            </Col>
          </>
        )}
      </Row>

      {/* Filters */}
      {activeTab === "users" && (
        <Card className="mb-4 bg-white shadow-md">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex items-center gap-2">
              <FilterOutlined className="text-blue-600 text-lg" />
              <span className="font-semibold">ច្រោះតាមប្រភេទ:</span>
            </div>

            <Select
              value={state.filters.branch_name}
              onChange={(value) => handleFilterChange('branch_name', value)}
              style={{ width: 200 }}
              placeholder="ជ្រើសរើសសាខា"
            >
              <Option value="all">សាខាទាំងអស់</Option>
              {state.branches.map(branch => (
                <Option key={branch} value={branch}>{branch}</Option>
              ))}
            </Select>

            <Select
              value={state.filters.role_code}
              onChange={(value) => handleFilterChange('role_code', value)}
              style={{ width: 200 }}
              placeholder="ជ្រើសរើសតួនាទី"
            >
              <Option value="all">តួនាទីទាំងអស់</Option>
              {state.roles.map(role => (
                <Option key={role.code} value={role.code}>{role.name}</Option>
              ))}
            </Select>

            <Select
              value={state.filters.is_active}
              onChange={(value) => handleFilterChange('is_active', value)}
              style={{ width: 150 }}
              placeholder="ជ្រើសរើសស្ថានភាព"
            >
              <Option value="all">ទាំងអស់</Option>
              <Option value="1">សកម្ម</Option>
              <Option value="0">អសកម្ម</Option>
            </Select>

            <Input.Search
              placeholder="ស្វែងរក..."
              style={{ width: 250 }}
              value={state.filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              allowClear
            />
          </div>
        </Card>
      )}

      {/* Main Content */}
      <Card className="shadow-md">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            tab={
              <span>
                <DashboardOutlined /> បញ្ជីអ្នកប្រើប្រាស់
              </span>
            }
            key="users"
          >
            <Table
              loading={loading}
              dataSource={state.users}
              columns={columns}
              rowKey="id"
              scroll={{ x: 1400 }}
              pagination={{
                pageSize: 15,
                showSizeChanger: true,
                showTotal: (total) => `ចំនួនសរុប ${total} users`,
              }}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <BarChartOutlined /> ស្ថិតិប្រព័ន្ធ
              </span>
            }
            key="statistics"
          >
            {/* System Statistics Content */}
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card title="ចំនួនអ្នកប្រើប្រាស់តាមតួនាទី">
                  {state.systemStats.roles?.map((role, index) => (
                    <div key={index} className="mb-3">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{role.role_name}</span>
                        <span className="font-bold">{role.user_count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(role.user_count / state.stats.total_users * 100) || 0}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card title="ចំនួនអ្នកប្រើប្រាស់តាមសាខា">
                  {state.systemStats.branches?.slice(0, 10).map((branch, index) => (
                    <div key={index} className="flex justify-between items-center mb-2 p-2 bg-gray-50 rounded">
                      <span className="font-medium">{branch.branch_name}</span>
                      <Space>
                        <Tag color="green">{branch.active_count} សកម្ម</Tag>
                        <Tag color="blue">{branch.user_count} សរុប</Tag>
                      </Space>
                    </div>
                  ))}
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Card>

      {/* Create Super Admin Modal */}
      <Modal
        open={superAdminModalVisible}
        onCancel={() => setSuperAdminModalVisible(false)}
        footer={null}
        width={700}
        title={
          <div className="text-xl font-bold flex items-center gap-2">
            <CrownOutlined className="text-yellow-600" /> បង្កើត Super Admin ថ្មី
          </div>
        }
      >
        <Form form={superAdminForm} layout="vertical" onFinish={handleSubmitSuperAdmin}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="ឈ្មោះពេញ" rules={[{ required: true, message: "ត្រូវការឈ្មោះ" }]}>
                <Input placeholder="ឈ្មោះពេញ" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="username" label="Username" rules={[{ required: true, message: "ត្រូវការ Username" }]}>
                <Input placeholder="Username" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="password" label="ពាក្យសម្ងាត់" rules={[{ required: true, message: "ត្រូវការពាក្យសម្ងាត់ (យ៉ាងតិច 8 តួអក្សរ)", min: 8 }]}>
                <Input.Password placeholder="ពាក្យសម្ងាត់" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="Email">
                <Input type="email" placeholder="Email" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="tel" label="ទូរស័ព្ទ">
                <Input placeholder="លេខទូរស័ព្ទ" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="branch_name" label="សាខា">
                <Select placeholder="ជ្រើសរើសសាខា" options={config?.branch_name} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="address" label="អាសយដ្ឋាន">
            <TextArea rows={2} placeholder="អាសយដ្ឋាន" />
          </Form.Item>

          <Form.Item label="រូបភាព Profile">
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={handleUploadChange}
              beforeUpload={beforeUpload}
              maxCount={1}
            >
              {fileList.length === 0 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Divider />

          <div className="flex justify-end gap-3">
            <Button onClick={() => setSuperAdminModalVisible(false)}>បោះបង់</Button>
            <Button type="primary" htmlType="submit" loading={loading} className="bg-yellow-500">
              បង្កើត Super Admin
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Create/Edit User Modal */}
      <Modal
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
        title={
          <div className="text-xl font-bold">
            {form.getFieldValue("id") ? (
              <>
                <EditOutlined className="text-blue-600" /> កែប្រែអ្នកប្រើប្រាស់
              </>
            ) : (
              <>
                <PlusOutlined className="text-green-600" /> បង្កើតអ្នកប្រើប្រាស់ថ្មី
              </>
            )}
          </div>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitUser}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="ឈ្មោះពេញ" rules={[{ required: true }]}>
                <Input placeholder="ឈ្មោះពេញ" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="username" label="Username" rules={[{ required: true }]}>
                <Input placeholder="Username" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="password" label="ពាក្យសម្ងាត់" rules={[{ required: !form.getFieldValue("id"), message: "យ៉ាងតិច 8 តួអក្សរ", min: 8 }]}>
                <Input.Password placeholder="ពាក្យសម្ងាត់" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="Email">
                <Input type="email" placeholder="Email" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="tel" label="ទូរស័ព្ទ">
                <Input placeholder="លេខទូរស័ព្ទ" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="branch_name" label="សាខា" rules={[{ required: true }]}>
                <Select placeholder="ជ្រើសរើសសាខា" options={config?.branch_name} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="role_id" label="តួនាទី" rules={[{ required: true }]}>
                <Select placeholder="ជ្រើសរើសតួនាទី">
                  {state.roles.map(role => (
                    <Option key={role.id} value={role.id}>{role.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="is_active" label="ស្ថានភាព" rules={[{ required: true }]}>
                <Select>
                  <Option value={1}>សកម្ម</Option>
                  <Option value={0}>អសកម្ម</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="address" label="អាសយដ្ឋាន">
            <TextArea rows={2} placeholder="អាសយដ្ឋាន" />
          </Form.Item>

          <Form.Item label="រូបភាព Profile">
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={handleUploadChange}
              beforeUpload={beforeUpload}
              maxCount={1}
            >
              {fileList.length === 0 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Divider />

          <div className="flex justify-end gap-3">
            <Button onClick={() => setModalVisible(false)}>បោះបង់</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {form.getFieldValue("id") ? "កែប្រែ" : "បង្កើត"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

export default SuperAdminUserManagement;