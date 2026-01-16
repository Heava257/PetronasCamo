import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  message,
  Popconfirm,
  Tag,
  Badge,
  Card,
  Row,
  Col,
  Switch,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  AppstoreOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { request } from "../../../util/helper";

const { Option } = Select;
const { TextArea } = Input;

function PermissionCRUD() {
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [groups, setGroups] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPermission, setEditingPermission] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadPermissions();
    loadGroups();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const res = await request("permissions", "get");
      if (res && res.success) {
        setPermissions(res.permissions || []);
      }
    } catch (error) {
      console.error("Error loading permissions:", error);
      message.error("Failed to load permissions");
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const res = await request("permissions/groups", "get");
      if (res && res.success) {
        setGroups(res.groups || []);
      }
    } catch (error) {
      console.error("Error loading groups:", error);
    }
  };

  const handleCreate = () => {
    setEditingPermission(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingPermission(record);
    form.setFieldsValue({
      name: record.name,
      group: record.category,
      is_menu_web: record.is_menu_web === 1,
      web_route_key: record.web_route_key,
      description: record.description,
    });
    setModalVisible(true);
  };

  const handleDelete = async (permissionId, permissionName) => {
    try {
      setLoading(true);
      const res = await request(`permissions/${permissionId}`, "delete");
      
      if (res && res.success) {
        message.success(res.message);
        loadPermissions();
        
        if (res.affected_roles > 0) {
          message.warning(
            `${res.affected_roles} roles were affected by this deletion`,
            5
          );
        }
      } else {
        message.error("Failed to delete permission");
      }
    } catch (error) {
      console.error("Error deleting permission:", error);
      message.error("Failed to delete permission");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      const payload = {
        name: values.name,
        group: values.group,
        is_menu_web: values.is_menu_web || false,
        web_route_key: values.web_route_key || null,
        description: values.description || null,
      };

      let res;
      if (editingPermission) {
        res = await request(`permissions/${editingPermission.id}`, "put", payload);
      } else {
        res = await request("permissions", "post", payload);
      }

      if (res && res.success) {
        message.success(res.message);
        setModalVisible(false);
        form.resetFields();
        loadPermissions();
        loadGroups();
      } else {
        message.error(res?.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error saving permission:", error);
      message.error("Failed to save permission");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Permission Name",
      dataIndex: "name",
      key: "name",
      width: 300,
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text) => <span className="font-mono text-xs sm:text-sm break-all">{text}</span>,
    },
    {
      title: "Group",
      dataIndex: "category",
      key: "category",
      width: 150,
      filters: [...new Set(permissions.map(p => p.category))].map(cat => ({
        text: cat,
        value: cat,
      })),
      onFilter: (value, record) => record.category === value,
      render: (text) => <Tag color="blue" className="text-xs">{text}</Tag>,
    },
    {
      title: "Menu Item",
      dataIndex: "is_menu_web",
      key: "is_menu_web",
      width: 120,
      align: "center",
      filters: [
        { text: 'Yes', value: 1 },
        { text: 'No', value: 0 },
      ],
      onFilter: (value, record) => record.is_menu_web === value,
      render: (val) => (
        val === 1 ? (
          <Tag color="green" className="text-xs">Menu</Tag>
        ) : (
          <Tag color="default" className="text-xs">Function</Tag>
        )
      ),
    },
    {
      title: "Route",
      dataIndex: "web_route_key",
      key: "web_route_key",
      width: 200,
      render: (text) => (
        text ? (
          <span className="text-xs font-mono text-blue-600 break-all">
            <LinkOutlined /> {text}
          </span>
        ) : (
          <span className="text-gray-400 text-xs">N/A</span>
        )
      ),
    },
    {
      title: "Usage",
      key: "usage",
      width: 100,
      align: "center",
      render: (_, record) => {
        return <Badge count={0} showZero style={{ backgroundColor: '#d9d9d9' }} />;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="កែប្រែ">
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="លុបសិទ្ធិនេះ?"
            description={
              <div className="max-w-xs">
                <p className="text-xs sm:text-sm">តើអ្នកប្រាកដថាចង់លុបសិទ្ធិ <strong>{record.name}</strong>?</p>
                <p className="text-orange-600 text-xs mt-2">
                  ⚠️ សិទ្ធិនេះនឹងត្រូវបានដកចេញពីតួនាទីទាំងអស់
                </p>
              </div>
            }
            onConfirm={() => handleDelete(record.id, record.name)}
            okText="លុប"
            cancelText="បោះបង់"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="លុប">
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Mobile Card Component
  const PermissionMobileCard = ({ permission }) => (
    <Card 
      className="mb-3 shadow-sm hover:shadow-md transition-shadow" 
      bodyStyle={{ padding: '12px' }}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-mono font-bold break-all mb-1">{permission.name}</h3>
            <div className="flex flex-wrap gap-1">
              <Tag color="blue" className="text-xs">{permission.category}</Tag>
              {permission.is_menu_web === 1 ? (
                <Tag color="green" className="text-xs">Menu</Tag>
              ) : (
                <Tag color="default" className="text-xs">Function</Tag>
              )}
            </div>
          </div>
          <Badge count={0} showZero style={{ backgroundColor: '#d9d9d9' }} className="shrink-0" />
        </div>

        {/* Route */}
        {permission.web_route_key && (
          <div className="pt-2 border-t">
            <div className="text-xs text-gray-500 mb-1">Route:</div>
            <span className="text-xs font-mono text-blue-600 break-all">
              <LinkOutlined /> {permission.web_route_key}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(permission)}
            className="flex-1"
          >
            កែប្រែ
          </Button>
          <Popconfirm
            title="លុបសិទ្ធិនេះ?"
            description={
              <div className="max-w-xs">
                <p className="text-xs">តើអ្នកប្រាកដថាចង់លុបសិទ្ធិ <strong>{permission.name}</strong>?</p>
                <p className="text-orange-600 text-xs mt-2">
                  ⚠️ សិទ្ធិនេះនឹងត្រូវបានដកចេញពីតួនាទីទាំងអស់
                </p>
              </div>
            }
            onConfirm={() => handleDelete(permission.id, permission.name)}
            okText="លុប"
            cancelText="បោះបង់"
            okButtonProps={{ danger: true }}
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              className="flex-1"
            >
              លុប
            </Button>
          </Popconfirm>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="w-full">
      {/* Header Actions - RESPONSIVE */}
      <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 mb-1">
            <SafetyCertificateOutlined className="text-blue-600 text-lg sm:text-xl" />
            <span className="break-words text-sm sm:text-base">គ្រប់គ្រងសិទ្ធិ / Permission Management</span>
          </h3>
          <p className="text-xs sm:text-sm text-gray-500">
            បង្កើត, កែប្រែ, និងលុបសិទ្ធិផ្សេងៗ
          </p>
        </div>
        <Space className="w-full sm:w-auto" size={[8, 8]} wrap>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              loadPermissions();
              loadGroups();
            }}
            loading={loading}
            className="flex-1 sm:flex-none"
            size="middle"
          >
            <span className="hidden xs:inline">ផ្ទុកឡើងវិញ</span>
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
            size="middle"
          >
            បង្កើតសិទ្ធិថ្មី
          </Button>
        </Space>
      </div>

      {/* Statistics Cards - RESPONSIVE */}
      <Row gutter={[12, 12]} className="mb-4">
        <Col xs={24} sm={8}>
          <Card className="h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm">ចំនួនសិទ្ធិសរុប</p>
                <p className="text-xl sm:text-2xl font-bold">{permissions.length}</p>
              </div>
              <SafetyCertificateOutlined className="text-3xl sm:text-4xl text-blue-500" />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm">ចំនួន Groups</p>
                <p className="text-xl sm:text-2xl font-bold">{groups.length}</p>
              </div>
              <AppstoreOutlined className="text-3xl sm:text-4xl text-green-500" />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm">Menu Items</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {permissions.filter(p => p.is_menu_web === 1).length}
                </p>
              </div>
              <LinkOutlined className="text-3xl sm:text-4xl text-purple-500" />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <Table
            loading={loading}
            dataSource={permissions}
            columns={columns}
            rowKey="id"
            scroll={{ x: 1200 }}
            pagination={{
              pageSize: 15,
              showSizeChanger: true,
              showTotal: (total) => `សរុប ${total} permissions`,
            }}
            size="small"
          />
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden">
        {loading ? (
          <div className="text-center py-8">
            <div className="text-sm text-gray-500">Loading...</div>
          </div>
        ) : (
          <div className="space-y-2">
            {permissions.map(permission => (
              <PermissionMobileCard key={permission.id} permission={permission} />
            ))}
          </div>
        )}
        {!loading && permissions.length > 0 && (
          <div className="text-center text-xs text-gray-500 mt-3 py-2">
            សរុប {permissions.length} permissions
          </div>
        )}
      </div>

      {/* Create/Edit Modal - RESPONSIVE */}
      <Modal
        open={modalVisible}
        title={
          <div className="text-base sm:text-lg font-bold flex items-center gap-2">
            {editingPermission ? (
              <>
                <EditOutlined className="text-blue-600" />
                <span className="text-sm sm:text-base">កែប្រែសិទ្ធិ</span>
              </>
            ) : (
              <>
                <PlusOutlined className="text-green-600" />
                <span className="text-sm sm:text-base">បង្កើតសិទ្ធិថ្មី</span>
              </>
            )}
          </div>
        }
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingPermission(null);
        }}
        footer={null}
        width={window.innerWidth < 768 ? '95%' : 600}
        bodyStyle={{ padding: window.innerWidth < 640 ? '12px' : '24px' }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            is_menu_web: false,
          }}
        >
          <Form.Item
            name="name"
            label={<span className="text-xs sm:text-sm">Permission Name</span>}
            rules={[
              { required: true, message: "សូមបញ្ចូល permission name" },
              { 
                pattern: /^[a-z0-9._-]+$/,
                message: "អនុញ្ញាតតែ lowercase, numbers, dots, underscores, dashes" 
              },
            ]}
            extra={<span className="text-xs">Example: customer.create, product.getlist</span>}
          >
            <Input 
              placeholder="e.g., customer.create" 
              className="font-mono text-sm"
              size={window.innerWidth < 640 ? 'middle' : 'large'}
            />
          </Form.Item>

          <Form.Item
            name="group"
            label={<span className="text-xs sm:text-sm">Group/Category</span>}
            rules={[{ required: true, message: "សូមជ្រើសរើស group" }]}
            extra={<span className="text-xs">ជ្រើសរើសពី groups ដែលមាន ឬបញ្ចូលថ្មី</span>}
          >
            <Select
              showSearch
              placeholder="ជ្រើសរើស ឬបញ្ចូលថ្មី"
              mode="tags"
              maxTagCount={1}
              options={groups.map(g => ({
                label: `${g.name} (${g.permission_count})`,
                value: g.name,
              }))}
              size={window.innerWidth < 640 ? 'middle' : 'large'}
            />
          </Form.Item>

          <Form.Item
            name="is_menu_web"
            label={<span className="text-xs sm:text-sm">Menu Item</span>}
            valuePropName="checked"
            extra={<span className="text-xs">បើកប្រសិនបើ permission នេះជា menu item</span>}
          >
            <Switch
              checkedChildren={<span className="text-xs">Menu</span>}
              unCheckedChildren={<span className="text-xs">Function</span>}
            />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => 
              prevValues.is_menu_web !== currentValues.is_menu_web
            }
          >
            {({ getFieldValue }) =>
              getFieldValue('is_menu_web') ? (
                <Form.Item
                  name="web_route_key"
                  label={<span className="text-xs sm:text-sm">Web Route</span>}
                  rules={[
                    { 
                      required: true, 
                      message: "សូមបញ្ចូល route" 
                    },
                  ]}
                  extra={<span className="text-xs">Example: /customer, /product, /dashboard</span>}
                >
                  <Input 
                    placeholder="/customer" 
                    prefix={<LinkOutlined />}
                    className="text-sm"
                    size={window.innerWidth < 640 ? 'middle' : 'large'}
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item
            name="description"
            label={<span className="text-xs sm:text-sm">Description (Optional)</span>}
          >
            <TextArea 
              rows={3}
              placeholder="ពិពណ៌នាអំពីសិទ្ធិនេះ..."
              className="text-sm"
              size={window.innerWidth < 640 ? 'middle' : 'large'}
            />
          </Form.Item>

          <div className="mt-6 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
            <Button
              onClick={() => {
                setModalVisible(false);
                form.resetFields();
                setEditingPermission(null);
              }}
              block={window.innerWidth < 640}
              className="sm:w-auto"
            >
              បោះបង់
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={editingPermission ? <EditOutlined /> : <PlusOutlined />}
              className={editingPermission ? "" : "bg-green-600 hover:bg-green-700"}
              block={window.innerWidth < 640}
            >
              {editingPermission ? "រក្សាទុក" : "បង្កើត"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

export default PermissionCRUD;