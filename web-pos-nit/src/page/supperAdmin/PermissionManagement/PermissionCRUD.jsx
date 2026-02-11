import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Tag,
  Badge,
  Card,
  Row,
  Col,
  Switch,
  Tooltip,
} from "antd";
import Swal from "sweetalert2";
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
import { useTranslation } from "../../../locales/TranslationContext";

const { Option } = Select;
const { TextArea } = Input;

function PermissionCRUD() {
  const { t } = useTranslation();
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
      Swal.fire({
        icon: 'error',
        title: t('error'),
        text: t('failed_to_load_permissions')
      });
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
    Swal.fire({
      title: t('delete_permission_confirmation_title'),
      html: `
        <div style="text-align: left;">
          <p>${t('delete_permission_confirmation_text').replace('{name}', `<strong>${permissionName}</strong>`)}</p>
          <p style="color: #d46b08; font-size: 13px; margin-top: 10px;">
            ${t('delete_permission_warning')}
          </p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: t('delete'),
      cancelButtonText: t('cancel')
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setLoading(true);
          const res = await request(`permissions/${permissionId}`, "delete");

          if (res && res.success) {
            Swal.fire({
              icon: 'success',
              title: t('success'),
              text: res.message || t('deleted_successfully'),
              timer: 1500,
              showConfirmButton: false
            });
            loadPermissions();

            if (res.affected_roles > 0) {
              Swal.fire({
                icon: 'warning',
                title: t('attention'),
                text: t('roles_affected').replace('{count}', res.affected_roles)
              });
            }
          } else {
            Swal.fire({
              icon: 'error',
              title: t('error'),
              text: t('failed_to_delete_permission')
            });
          }
        } catch (error) {
          console.error("Error deleting permission:", error);
          Swal.fire({
            icon: 'error',
            title: t('error'),
            text: t('failed_to_delete_permission')
          });
        } finally {
          setLoading(false);
        }
      }
    });
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
        Swal.fire({
          icon: 'success',
          title: t('success'),
          text: res.message,
          timer: 1500,
          showConfirmButton: false
        });
        setModalVisible(false);
        form.resetFields();
        loadPermissions();
        loadGroups();
      } else {
        Swal.fire({
          icon: 'error',
          title: t('error'),
          text: res?.message || t('failed_to_save')
        });
      }
    } catch (error) {
      console.error("Error saving permission:", error);
      Swal.fire({
        icon: 'error',
        title: 'កំហុស',
        text: "បរាជ័យក្នុងការរក្សាទុកសិទ្ធិ"
      });
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
          <Tooltip title="លុប">
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id, record.name)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Mobile Card Component
  const PermissionMobileCard = ({ permission }) => (
    <Card
      className="mb-3 shadow-sm hover:shadow-md transition-shadow"
      styles={{ body: { padding: '12px' } }}
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
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            className="flex-1"
            onClick={() => handleDelete(permission.id, permission.name)}
          >
            លុប
          </Button>
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
        styles={{ body: { padding: window.innerWidth < 640 ? '12px' : '24px' } }}
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