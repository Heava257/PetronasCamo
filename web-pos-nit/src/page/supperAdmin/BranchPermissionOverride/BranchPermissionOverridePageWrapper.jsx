import React, { useState, useEffect } from "react";
import {
  Card,
  Select,
  Button,
  Table,
  Space,
  Tag,
  Popconfirm,
  message,
  Badge,
  Row,
  Col,
  Statistic,
  Input,
  Form,
  Radio,
  Alert,
  Divider,
  Empty,
  Spin,
  Modal
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
  BranchesOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { request } from "../../../util/helper";

const { Option } = Select;
const { TextArea } = Input;

/**
 * Standalone Branch Permission Override Page
 */
function BranchPermissionOverridePage({ isIntegrated = false, initialBranch = null }) {
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [overrides, setOverrides] = useState([]);
  const [basePermissions, setBasePermissions] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [stats, setStats] = useState({
    base_count: 0,
    added_count: 0,
    removed_count: 0,
    effective_count: 0
  });
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [form] = Form.useForm();

  // ✅ Load initial data on mount
  useEffect(() => {
    loadInitialData();
    if (initialBranch) {
      setSelectedBranch(initialBranch);
    }
  }, [initialBranch]);

  // ✅ Load overrides when branch and role are selected
  useEffect(() => {
    if (selectedBranch && selectedRole) {
      loadOverrides();
    }
  }, [selectedBranch, selectedRole]);
  const loadInitialData = async () => {
    try {
      setLoading(true);

      // ✅ Load branches and roles
      const branchesRes = await request("superadmin/users", "get");

      if (branchesRes && branchesRes.success) {
        // ✅ FIXED: Use the branches array directly from API response
        if (branchesRes.branches && Array.isArray(branchesRes.branches)) {
          setBranches(branchesRes.branches);
        } else {
          console.warn('⚠️ No branches array in response');
        }

        // ✅ Extract roles
        if (branchesRes.roles && Array.isArray(branchesRes.roles)) {
          setRoles(branchesRes.roles);
        } else {
          console.warn('⚠️ No roles array in response');
        }
      } else {
        console.error('❌ branchesRes failed:', branchesRes);
      }

      // ✅ Load all permissions
      const permRes = await request("permissions", "get");

      if (permRes && permRes.success && permRes.permissions) {
        setAllPermissions(permRes.permissions);
      } else {
        console.error('❌ permRes failed:', permRes);
      }

    } catch (error) {
      console.error("❌ Error loading initial data:", error);
      message.error("Failed to load data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadOverrides = async () => {
    if (!selectedBranch || !selectedRole) {
      return;
    }

    try {
      setLoading(true);

      const res = await request(
        `branch-permissions/overrides/${encodeURIComponent(selectedBranch)}/${selectedRole}`,
        "get"
      );

      if (res && res.success) {
        setOverrides(res.overrides || []);
        setBasePermissions(res.base_permissions || []);
        setStats({
          base_count: res.base_permissions_count || 0,
          added_count: res.added_count || 0,
          removed_count: res.removed_count || 0,
          effective_count: res.effective_count || 0
        });
      } else {
        console.error('❌ Failed to load overrides:', res);
        message.error(res?.message || "Failed to load overrides");
      }
    } catch (error) {
      console.error("❌ Error loading overrides:", error);
      message.error("Failed to load overrides");
    } finally {
      setLoading(false);
    }
  };

  const handleAddOverride = async (values) => {
    try {
      setLoading(true);

      const res = await request("branch-permissions/overrides", "post", {
        branch_name: selectedBranch,
        role_id: selectedRole,
        permission_id: values.permission_id,
        override_type: values.override_type,
        reason: values.reason
      });

      if (res && res.success) {
        message.success(res.message || "Override added successfully");
        setAddModalVisible(false);
        form.resetFields();
        loadOverrides();
      } else {
        message.error(res?.message || "Failed to add override");
      }
    } catch (error) {
      console.error("❌ Error adding override:", error);
      message.error("Failed to add override");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOverride = async (overrideId) => {
    try {
      setLoading(true);

      const res = await request(
        `branch-permissions/overrides/${overrideId}`,
        "delete"
      );

      if (res && res.success) {
        message.success(res.message || "Override deleted successfully");
        loadOverrides();
      } else {
        message.error("Failed to delete override");
      }
    } catch (error) {
      console.error("❌ Error deleting override:", error);
      message.error("Failed to delete override");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Permission",
      dataIndex: "permission_name",
      key: "permission",
      width: 300,
      render: (text, record) => (
        <div>
          <div className="font-medium text-sm">{text}</div>
          <Tag color="blue" className="text-xs mt-1">{record.permission_group}</Tag>
        </div>
      ),
    },
    {
      title: "Override Type",
      dataIndex: "override_type",
      key: "type",
      width: 120,
      align: "center",
      render: (type) => (
        type === 'add' ? (
          <Tag color="green" icon={<PlusCircleOutlined />} className="text-xs">
            ADDED
          </Tag>
        ) : (
          <Tag color="red" icon={<MinusCircleOutlined />} className="text-xs">
            REMOVED
          </Tag>
        )
      ),
    },
    {
      title: "Reason",
      dataIndex: "reason",
      key: "reason",
      render: (text) => text || <span className="text-gray-400 text-xs">N/A</span>,
    },
    {
      title: "Created By",
      dataIndex: "created_by_name",
      key: "created_by",
      width: 150,
      render: (text, record) => (
        <div>
          <div className="text-xs">{text || 'N/A'}</div>
          <div className="text-xs text-gray-500">
            {record.created_at ? new Date(record.created_at).toLocaleString() : 'N/A'}
          </div>
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <Popconfirm
          title="Delete this override?"
          description="The permission will revert to the base role setting."
          onConfirm={() => handleDeleteOverride(record.id)}
          okText="Delete"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
        >
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
          >
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </Popconfirm>
      ),
    },
  ];

  // Mobile Card Component
  const OverrideMobileCard = ({ override }) => (
    <Card
      className="mb-3 shadow-sm hover:shadow-md transition-shadow"
      styles={{ body: { padding: '12px' } }}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium break-all mb-1">
              {override.permission_name || 'N/A'}
            </h3>
            <Tag color="blue" className="text-xs">
              {override.permission_group || 'N/A'}
            </Tag>
          </div>
          {override.override_type === 'add' ? (
            <Tag color="green" icon={<PlusCircleOutlined />} className="text-xs shrink-0">
              ADDED
            </Tag>
          ) : (
            <Tag color="red" icon={<MinusCircleOutlined />} className="text-xs shrink-0">
              REMOVED
            </Tag>
          )}
        </div>

        {override.reason && (
          <div className="pt-2 border-t">
            <div className="text-xs text-gray-500 mb-1">Reason:</div>
            <div className="text-xs">{override.reason}</div>
          </div>
        )}

        <div className="pt-2 border-t">
          <div className="text-xs text-gray-500">
            Created by {override.created_by_name || 'N/A'} on{' '}
            {override.created_at ? new Date(override.created_at).toLocaleString() : 'N/A'}
          </div>
        </div>

        <div className="pt-2 border-t">
          <Popconfirm
            title="Delete this override?"
            description="The permission will revert to the base role setting."
            onConfirm={() => handleDeleteOverride(override.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              block
            >
              Delete Override
            </Button>
          </Popconfirm>
        </div>
      </div>
    </Card>
  );

  return (
    <div className={`w-full ${!isIntegrated ? 'min-h-screen bg-gray-50' : ''}`}>
      <div className={`${!isIntegrated ? 'max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6' : ''}`}>
        {/* Header - Only show if standalone */}
        {!isIntegrated && (
          <Card className="mb-4 shadow-lg bg-gradient-to-r from-purple-600 to-blue-600 border-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-white text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2 sm:gap-3 mb-1">
                  <BranchesOutlined className="text-lg sm:text-xl lg:text-2xl" />
                  <span className="break-words">Branch Permission Override</span>
                </h1>
                <p className="text-white text-xs sm:text-sm opacity-90">
                  Customize role permissions for specific branches
                </p>
              </div>
              <Button
                type="default"
                size="middle"
                icon={<ReloadOutlined />}
                onClick={loadInitialData}
                loading={loading}
                className="bg-white text-purple-600 border-0 hover:bg-gray-100 w-full sm:w-auto"
              >
                <span className="hidden xs:inline">Reload</span>
              </Button>
            </div>
          </Card>
        )}

        {/* Selection Card */}
        <Card className={`mb-4 shadow-md ${isIntegrated ? 'bg-indigo-50 border-indigo-100' : ''}`}>
          {!isIntegrated && (
            <Alert
              message="Instructions"
              description="Select a branch and role to view and manage permission overrides for that specific combination. This allows you to customize permissions on a per-branch basis."
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
              className="mb-4"
            />
          )}

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <div className="mb-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <BranchesOutlined /> Select Branch
                </label>
              </div>
              <Select
                className="w-full"
                placeholder="Choose a branch"
                value={selectedBranch}
                onChange={(value) => {
                  setSelectedBranch(value);
                  setOverrides([]);
                }}
                loading={loading}
                size="large"
                showSearch
                optionFilterProp="label"
              >
                {branches.map(branch => (
                  <Option key={branch} value={branch} label={branch}>{branch}</Option>
                ))}
              </Select>
              {branches.length === 0 && !loading && (
                <div className="text-xs text-orange-600 mt-1">
                  ⚠️ No branches found. Check API response.
                </div>
              )}
            </Col>

            <Col xs={24} sm={12}>
              <div className="mb-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircleOutlined /> Select Role
                </label>
              </div>
              <Select
                className="w-full"
                placeholder="Choose a role"
                value={selectedRole}
                onChange={(value) => {
                  setSelectedRole(value);
                  setOverrides([]);
                }}
                loading={loading}
                size="large"
                showSearch
                optionFilterProp="label"
              >
                {roles.map(role => (
                  <Option key={role.id} value={role.id} label={`${role.name} (${role.code})`}>
                    {role.name} ({role.code})
                  </Option>
                ))}
              </Select>
              {roles.length === 0 && !loading && (
                <div className="text-xs text-orange-600 mt-1">
                  ⚠️ No roles found. Check API response.
                </div>
              )}
            </Col>
          </Row>

          {/* Debug Info - Only show for developers in console if integrated */}
          {!loading && !isIntegrated && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
              <strong>Debug Info:</strong><br />
              Branches loaded: {branches.length}<br />
              Roles loaded: {roles.length}<br />
              Permissions loaded: {allPermissions.length}<br />
              Selected Branch: {selectedBranch || 'None'}<br />
              Selected Role: {selectedRole || 'None'}
            </div>
          )}
        </Card>

        {/* Content Area */}
        {selectedBranch && selectedRole ? (
          <Card className="shadow-md">
            {/* Statistics */}
            <Card className="mb-4 bg-gradient-to-r from-blue-50 to-purple-50">
              <Row gutter={[12, 12]}>
                <Col xs={24} sm={6}>
                  <Statistic
                    title={<span className="text-xs sm:text-sm">Base Role</span>}
                    value={stats.base_count}
                    prefix={<CheckCircleOutlined className="text-sm" />}
                    valueStyle={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', color: '#1890ff' }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title={<span className="text-xs sm:text-sm">Added</span>}
                    value={stats.added_count}
                    prefix={<PlusCircleOutlined className="text-sm" />}
                    valueStyle={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', color: '#52c41a' }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title={<span className="text-xs sm:text-sm">Removed</span>}
                    value={stats.removed_count}
                    prefix={<MinusCircleOutlined className="text-sm" />}
                    valueStyle={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', color: '#ff4d4f' }}
                  />
                </Col>
                <Col xs={24} sm={6}>
                  <Statistic
                    title={<span className="text-xs sm:text-sm">Effective Total</span>}
                    value={stats.effective_count}
                    prefix={<CheckCircleOutlined className="text-sm" />}
                    valueStyle={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', color: '#722ed1' }}
                  />
                </Col>
              </Row>
            </Card>

            {/* Add Override Button */}
            <div className="mb-4">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setAddModalVisible(true)}
                block={typeof window !== 'undefined' && window.innerWidth < 640}
                className="bg-green-600 hover:bg-green-700"
                size="large"
              >
                Add Override
              </Button>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table
                loading={loading}
                dataSource={overrides}
                columns={columns}
                rowKey="id"
                scroll={{ x: 1000 }}
                pagination={{
                  pageSize: 10,
                  showTotal: (total) => `Total ${total} overrides`,
                }}
                size="small"
                locale={{
                  emptyText: (
                    <Empty
                      description="No overrides yet. This branch uses the base role permissions."
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  )
                }}
              />
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden">
              {loading ? (
                <div className="text-center py-8"><Spin /></div>
              ) : overrides.length > 0 ? (
                <div className="space-y-2">
                  {overrides.map(override => (
                    <OverrideMobileCard key={override.id} override={override} />
                  ))}
                </div>
              ) : (
                <Card className="text-center">
                  <Empty
                    description="No overrides yet. This branch uses the base role permissions."
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                </Card>
              )}
            </div>
          </Card>
        ) : (
          <Card className="shadow-md">
            <Empty
              description={
                <div className="text-center">
                  <p className="text-sm mb-2">Please select both a branch and a role to continue</p>
                  <p className="text-xs text-gray-500">
                    Select from the dropdowns above to view and manage overrides
                  </p>
                </div>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </Card>
        )}

        {/* Add Override Modal */}
        <Modal
          open={addModalVisible}
          onCancel={() => {
            setAddModalVisible(false);
            form.resetFields();
          }}
          footer={null}
          width={typeof window !== 'undefined' && window.innerWidth < 768 ? '95%' : 600}
          title={
            <div className="text-base sm:text-lg font-bold flex items-center gap-2">
              <PlusOutlined className="text-green-600" />
              <span>Add Permission Override</span>
            </div>
          }
        >
          <Alert
            message="How it works"
            description={
              <div className="text-xs sm:text-sm">
                <p><strong>ADD:</strong> Grant a permission that's not in the base role</p>
                <p><strong>REMOVE:</strong> Revoke a permission that's in the base role</p>
              </div>
            }
            type="info"
            showIcon
            className="mb-4"
          />

          <Form
            form={form}
            layout="vertical"
            onFinish={handleAddOverride}
            initialValues={{ override_type: 'remove' }}
          >
            <Form.Item
              name="override_type"
              label="Override Type"
              rules={[{ required: true }]}
            >
              <Radio.Group size="large">
                <Radio.Button value="add">
                  <PlusCircleOutlined /> Add Permission
                </Radio.Button>
                <Radio.Button value="remove">
                  <MinusCircleOutlined /> Remove Permission
                </Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) =>
                prevValues.override_type !== currentValues.override_type
              }
            >
              {({ getFieldValue }) => {
                const overrideType = getFieldValue('override_type');
                let availablePermissions = [];

                if (overrideType === 'add') {
                  const basePermIds = basePermissions.map(p => p.id);
                  availablePermissions = allPermissions.filter(
                    p => !basePermIds.includes(p.id)
                  );
                } else {
                  availablePermissions = basePermissions;
                }

                return (
                  <Form.Item
                    name="permission_id"
                    label="Permission"
                    rules={[{ required: true, message: "Please select permission" }]}
                  >
                    <Select
                      placeholder="Select permission"
                      showSearch
                      size="large"
                      optionFilterProp="label"
                    >
                      {availablePermissions.map(perm => (
                        <Option key={perm.id} value={perm.id} label={`${perm.name} (${perm.category || perm.group || 'Other'})`}>
                          {perm.name} ({perm.category || perm.group || 'Other'})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                );
              }}
            </Form.Item>

            <Form.Item name="reason" label="Reason (Optional)">
              <TextArea rows={3} placeholder="Why is this override needed?" />
            </Form.Item>

            <Divider />

            <div className="flex justify-end gap-3">
              <Button onClick={() => {
                setAddModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<PlusOutlined />}
                className="bg-green-600 hover:bg-green-700"
              >
                Add Override
              </Button>
            </div>
          </Form>
        </Modal>
      </div>
    </div>
  );
}

export default BranchPermissionOverridePage;