import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Select,
  Space,
  Tag,
  Tooltip,
  Row,
  Col,
  Statistic,
  message,
  Tabs,
  Badge,
  Checkbox,
  Collapse,
  Empty,
  Switch,
  Popconfirm,
  Form,
  Input,
  Divider,
  Avatar,
} from "antd";
import {
  SafetyCertificateOutlined,
  UserOutlined,
  BranchesOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  EditOutlined,
  CopyOutlined,
  SwapOutlined,
  SaveOutlined,
  RollbackOutlined,
  PlusOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";
import { request } from "../../../util/helper";
import { getProfile } from "../../../store/profile.store";
import PermissionCRUD from "./PermissionCRUD";

const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Option } = Select;

function PermissionManagement() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("by-branch");
  const profile = getProfile();
  
  const [state, setState] = useState({
    branches: [],
    selectedBranch: null,
    branchUsers: [],
    branchStats: {},
    selectedUser: null,
    userPermissions: [],
    userInfo: {},
    allPermissions: [],
    groupedPermissions: {},
    roles: [],
    selectedRole: null,
    rolePermissions: [],
    selectedPermissionIds: [],
    comparisonMatrix: [],
    matrixRoles: [],
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [cloneModalVisible, setCloneModalVisible] = useState(false);
  const [cloneForm] = Form.useForm();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === "comparison") {
      loadComparisonMatrix();
    } else if (activeTab === "role-editor") {
      loadRoles();
    }
  }, [activeTab]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const branchesRes = await request("superadmin/users", "get");
      if (branchesRes && branchesRes.success) {
        const uniqueBranches = [...new Set(
          branchesRes.users
            .map(u => u.branch_name)
            .filter(b => b)
        )];
        setState(prev => ({ ...prev, branches: uniqueBranches }));
      }

      const permRes = await request("permissions", "get");
      if (permRes && permRes.success) {
        setState(prev => ({
          ...prev,
          allPermissions: permRes.permissions,
          groupedPermissions: permRes.grouped
        }));
      }

      const rolesRes = await request("superadmin/users", "get");
      if (rolesRes && rolesRes.success && rolesRes.roles) {
        setState(prev => ({ ...prev, roles: rolesRes.roles }));
      }

    } catch (error) {
      console.error("Error loading data:", error);
      message.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const res = await request("superadmin/users", "get");
      if (res && res.success && res.roles) {
        setState(prev => ({ ...prev, roles: res.roles }));
      }
    } catch (error) {
      console.error("Error loading roles:", error);
    }
  };

  const loadBranchPermissions = async (branchName) => {
    try {
      setLoading(true);
      const res = await request(`permissions/branch/${encodeURIComponent(branchName)}`, "get");
      
      if (res && res.success) {
        setState(prev => ({
          ...prev,
          selectedBranch: branchName,
          branchUsers: res.users,
          branchStats: res.stats
        }));
      } else {
        message.error("Failed to load branch permissions");
      }
    } catch (error) {
      console.error("Error loading branch permissions:", error);
      message.error("Failed to load branch permissions");
    } finally {
      setLoading(false);
    }
  };

  const loadUserPermissions = async (userId) => {
    try {
      setLoading(true);
      const res = await request(`permissions/user/${userId}`, "get");
      
      if (res && res.success) {
        setState(prev => ({
          ...prev,
          selectedUser: userId,
          userPermissions: res.permissions,
          userInfo: res.user
        }));
        setModalType('view');
        setModalVisible(true);
      } else {
        message.error("Failed to load user permissions");
      }
    } catch (error) {
      console.error("Error loading user permissions:", error);
      message.error("Failed to load user permissions");
    } finally {
      setLoading(false);
    }
  };

  const loadRolePermissions = async (roleId) => {
    try {
      setLoading(true);
      const res = await request("permissions/comparison", "get");
      
      if (res && res.success) {
        const rolePermissions = res.matrix
          .filter(row => row[`role_${roleId}`])
          .map(row => row.permission_id);
        
        setState(prev => ({
          ...prev,
          selectedRole: roleId,
          selectedPermissionIds: rolePermissions,
          rolePermissions: res.matrix
        }));
        
        setModalType('edit-role');
        setEditMode(false);
        setModalVisible(true);
      }
    } catch (error) {
      console.error("Error loading role permissions:", error);
      message.error("Failed to load role permissions");
    } finally {
      setLoading(false);
    }
  };

  const loadComparisonMatrix = async () => {
    try {
      setLoading(true);
      const res = await request("permissions/comparison", "get");
      
      if (res && res.success) {
        setState(prev => ({
          ...prev,
          comparisonMatrix: res.matrix,
          matrixRoles: res.roles
        }));
      }
    } catch (error) {
      console.error("Error loading comparison matrix:", error);
      message.error("Failed to load comparison matrix");
    } finally {
      setLoading(false);
    }
  };
  
const handleUpdateRolePermissions = async () => {
  try {
    setLoading(true);
    
    // ✅ Update permissions
    const res = await request(`permissions/role/${state.selectedRole}`, "put", {
      permission_ids: state.selectedPermissionIds
    });

    if (res && res.success) {
      message.success(res.message);
      
      // ✅ Show confirmation modal for force refresh
      Modal.confirm({
        title: '🔄 Force Refresh Permissions?',
        content: (
          <div>
            <p>Permissions have been updated successfully.</p>
            <p className="mt-2 text-orange-600">
              <strong>Would you like to force all affected users to re-login?</strong>
            </p>
            <p className="text-sm text-gray-600 mt-2">
              • Yes: Users will be logged out immediately and must re-login<br/>
              • No: Users will see updated permissions on next login
            </p>
          </div>
        ),
        okText: 'បាទ/ចាស - Force Logout',
        cancelText: 'ទេ - Next Login',
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            // ✅ Force refresh permissions
            const refreshRes = await request(
              `permissions/refresh/role/${state.selectedRole}`, 
              "post"
            );
            
            if (refreshRes && refreshRes.success) {
              message.success({
                content: `✅ ${refreshRes.affected_users} users will be logged out`,
                duration: 5
              });
            }
          } catch (error) {
            console.error("Failed to force refresh:", error);
            message.error("Failed to force logout users");
          }
        },
        onCancel: () => {
          message.info('Users will see updated permissions on next login');
        }
      });
      
      loadComparisonMatrix();
      setModalVisible(false);
      setEditMode(false);
    } else {
      message.error("Failed to update permissions");
    }
  } catch (error) {
    console.error("Error updating permissions:", error);
    message.error("Failed to update permissions");
  } finally {
    setLoading(false);
  }
};
const ForceRefreshButton = ({ userId, userName }) => {
  const [loading, setLoading] = useState(false);

  const handleForceRefresh = async () => {
    Modal.confirm({
      title: 'Force Logout User?',
      content: `This will immediately log out ${userName} and require them to login again.`,
      okText: 'Force Logout',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          setLoading(true);
          const res = await request(`permissions/refresh/user/${userId}`, "post");
          
          if (res && res.success) {
            message.success(res.message_kh || res.message);
          }
        } catch (error) {
          message.error("Failed to force refresh");
        } finally {
          setLoading(false);
        }
      }
    });
  };

  return (
    <Tooltip title="Force user to re-login">
      <Button
        icon={<ReloadOutlined />}
        size="small"
        onClick={handleForceRefresh}
        loading={loading}
      >
        Force Refresh
      </Button>
    </Tooltip>
  );
};
  const handleClonePermissions = async (values) => {
    try {
      setLoading(true);
      const res = await request("permissions/clone", "post", {
        source_role_id: values.source_role_id,
        target_role_id: values.target_role_id
      });

      if (res && res.success) {
        message.success(res.message);
        loadComparisonMatrix();
        setCloneModalVisible(false);
        cloneForm.resetFields();
      } else {
        message.error("Failed to clone permissions");
      }
    } catch (error) {
      console.error("Error cloning permissions:", error);
      message.error("Failed to clone permissions");
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (permissionId) => {
    setState(prev => {
      const ids = prev.selectedPermissionIds.includes(permissionId)
        ? prev.selectedPermissionIds.filter(id => id !== permissionId)
        : [...prev.selectedPermissionIds, permissionId];
      
      return { ...prev, selectedPermissionIds: ids };
    });
  };

  const handleSelectAll = (categoryPerms) => {
    const allIds = categoryPerms.map(p => p.id);
    const allSelected = allIds.every(id => state.selectedPermissionIds.includes(id));
    
    setState(prev => {
      const ids = allSelected
        ? prev.selectedPermissionIds.filter(id => !allIds.includes(id))
        : [...new Set([...prev.selectedPermissionIds, ...allIds])];
      
      return { ...prev, selectedPermissionIds: ids };
    });
  };

  const branchUserColumns = [
    {
      title: "អ្នកប្រើប្រាស់",
      key: "user",
      width: 200,
      render: (_, record) => (
        <div>
          <div className="font-semibold text-sm">{record.name}</div>
          <div className="text-xs text-gray-500">{record.username}</div>
        </div>
      ),
    },
    {
      title: "តួនាទី",
      dataIndex: "role_name",
      key: "role",
      width: 150,
      render: (text, record) => (
        <Tag color={record.role_code === 'SUPER_ADMIN' ? 'gold' : record.role_code === 'ADMIN' ? 'blue' : 'green'} className="text-xs">
          {text}
        </Tag>
      ),
    },
    {
      title: "ចំនួនសិទ្ធិ",
      dataIndex: "permission_count",
      key: "permission_count",
      width: 120,
      align: "center",
      render: (count) => (
        <Badge 
          count={count} 
          showZero 
          style={{ backgroundColor: count > 0 ? '#52c41a' : '#d9d9d9' }}
        />
      ),
    },
    {
      title: "សិទ្ធិ (មើលខ្លះ)",
      dataIndex: "permissions",
      key: "permissions",
      render: (text) => (
        <Tooltip title={text}>
          <div className="truncate max-w-xs text-xs">{text || "គ្មានសិទ្ធិ"}</div>
        </Tooltip>
      ),
    },
    {
      title: "សកម្មភាព",
      key: "action",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => loadUserPermissions(record.id)}
        >
          <span className="hidden sm:inline">មើល</span>
        </Button>
      ),
    },
  ];

  const roleColumns = [
    {
      title: "តួនាទី",
      dataIndex: "name",
      key: "name",
      width: 200,
      render: (text, record) => (
        <div>
          <div className="font-semibold text-sm sm:text-base">{text}</div>
          <Tag color="blue" className="text-xs">{record.code}</Tag>
        </div>
      ),
    },
    {
      title: "ចំនួនសិទ្ធិ",
      key: "permission_count",
      width: 120,
      align: "center",
      render: (_, record) => {
        const count = state.comparisonMatrix.filter(
          row => row[`role_${record.id}`]
        ).length;
        return (
          <Badge 
            count={count} 
            showZero 
            style={{ backgroundColor: '#1890ff' }}
          />
        );
      },
    },
    {
      title: "សកម្មភាព",
      key: "action",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => loadRolePermissions(record.id)}
          >
            <span className="hidden sm:inline">កែប្រែ</span>
          </Button>
          <Tooltip title="ចម្លងសិទ្ធិ">
            <Button
              icon={<CopyOutlined />}
              size="small"
              onClick={() => {
                setCloneModalVisible(true);
                cloneForm.setFieldsValue({ source_role_id: record.id });
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const getMatrixColumns = () => {
    const baseColumns = [
      {
        title: "Permission",
        dataIndex: "permission_name",
        key: "permission",
        width: 250,
        fixed: "left",
        render: (text, record) => (
          <div>
            <div className="font-medium text-xs sm:text-sm">{text}</div>
            <Tag color="blue" className="text-xs">{record.category}</Tag>
          </div>
        ),
      },
    ];

    const roleColumns = state.matrixRoles.map(role => ({
      title: <span className="text-xs">{role.name}</span>,
      key: `role_${role.id}`,
      width: 100,
      align: "center",
      render: (_, record) => (
        record[`role_${role.id}`] ? (
          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
        ) : (
          <CloseCircleOutlined style={{ color: '#d9d9d9', fontSize: 18 }} />
        )
      ),
    }));

    return [...baseColumns, ...roleColumns];
  };

  const getRoleById = (roleId) => {
    return state.roles.find(r => r.id === roleId);
  };

  // Mobile User Card
  const UserMobileCard = ({ user }) => (
    <Card className="mb-3 shadow-sm hover:shadow-md transition-shadow" bodyStyle={{ padding: '12px' }}>
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Avatar size={40} icon={<UserOutlined />} className="shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold truncate">{user.name}</h3>
              <p className="text-xs text-gray-500 truncate">{user.username}</p>
            </div>
          </div>
          <Badge count={user.permission_count} showZero className="shrink-0" />
        </div>
        
        <div className="flex items-center justify-between">
          <Tag color={user.role_code === 'SUPER_ADMIN' ? 'gold' : user.role_code === 'ADMIN' ? 'blue' : 'green'} className="text-xs">
            {user.role_name}
          </Tag>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => loadUserPermissions(user.id)}
          >
            មើលសិទ្ធិ
          </Button>
        </div>
        
        {user.permissions && (
          <div className="pt-2 border-t">
            <p className="text-xs text-gray-600 truncate">{user.permissions}</p>
          </div>
        )}
      </div>
    </Card>
  );

  // Mobile Role Card
  const RoleMobileCard = ({ role }) => {
    const count = state.comparisonMatrix.filter(row => row[`role_${role.id}`]).length;
    
    return (
      <Card className="mb-3 shadow-sm hover:shadow-md transition-shadow" bodyStyle={{ padding: '12px' }}>
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold">{role.name}</h3>
              <Tag color="blue" className="text-xs mt-1">{role.code}</Tag>
            </div>
            <Badge count={count} showZero style={{ backgroundColor: '#1890ff' }} className="shrink-0" />
          </div>
          
          <div className="flex gap-2">
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => loadRolePermissions(role.id)}
              className="flex-1"
            >
              កែប្រែសិទ្ធិ
            </Button>
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={() => {
                setCloneModalVisible(true);
                cloneForm.setFieldsValue({ source_role_id: role.id });
              }}
            >
              ចម្លង
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
        {/* Header */}
        <Card className="mb-4 shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600 border-0">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-white text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2 sm:gap-3 mb-1">
                  <SafetyCertificateOutlined className="text-lg sm:text-xl lg:text-2xl" />
                  <span className="break-words">Permission Management</span>
                </h1>
                <p className="text-white text-xs sm:text-sm opacity-90">
                  ការគ្រប់គ្រងសិទ្ធិអ្នកប្រើប្រាស់
                </p>
              </div>
              <Button
                type="default"
                size="middle"
                icon={<ReloadOutlined />}
                onClick={() => {
                  loadInitialData();
                  if (activeTab === "comparison") loadComparisonMatrix();
                  if (state.selectedBranch) loadBranchPermissions(state.selectedBranch);
                }}
                loading={loading}
                className="bg-white text-indigo-600 border-0 hover:bg-gray-100 w-full sm:w-auto"
              >
                <span className="hidden xs:inline">ផ្ទុកឡើងវិញ</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Main Content */}
        <Card className="shadow-md">
          <Tabs activeKey={activeTab} onChange={setActiveTab} size="small">
            {/* Tab 1: By Branch */}
            <TabPane
              tab={
                <span className="text-xs sm:text-sm">
                  <BranchesOutlined /> <span className="hidden xs:inline">តាមសាខា</span>
                </span>
              }
              key="by-branch"
            >
              <Card className="mb-4 bg-blue-50" bodyStyle={{ padding: '12px 16px' }}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <span className="font-semibold text-sm">ជ្រើសរើសសាខា:</span>
                  <Select
                    className="w-full sm:w-64"
                    placeholder="ជ្រើសរើសសាខា"
                    value={state.selectedBranch}
                    onChange={loadBranchPermissions}
                    loading={loading}
                    size="middle"
                  >
                    {state.branches.map(branch => (
                      <Option key={branch} value={branch}>{branch}</Option>
                    ))}
                  </Select>
                </div>
              </Card>

              {state.selectedBranch && (
                <>
                  <Row gutter={[12, 12]} className="mb-4">
                    <Col xs={24} sm={8}>
                      <Card className="h-full">
                        <Statistic
                          title={<span className="text-xs sm:text-sm">ចំនួនអ្នកប្រើប្រាស់</span>}
                          value={state.branchStats.total_users || 0}
                          prefix={<UserOutlined className="text-sm" />}
                          valueStyle={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={12} sm={8}>
                      <Card className="h-full">
                        <Statistic
                          title={<span className="text-xs sm:text-sm">សិទ្ធិផ្សេងៗ</span>}
                          value={state.branchStats.total_unique_permissions || 0}
                          prefix={<SafetyCertificateOutlined className="text-sm" />}
                          valueStyle={{ color: '#3f8600', fontSize: 'clamp(1.2rem, 4vw, 1.5rem)' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={12} sm={8}>
                      <Card className="h-full">
                        <Statistic
                          title={<span className="text-xs sm:text-sm">មធ្យមភាគ/អ្នកប្រើ</span>}
                          value={parseFloat(state.branchStats.avg_permissions_per_user || 0).toFixed(1)}
                          prefix={<CheckCircleOutlined className="text-sm" />}
                          valueStyle={{ color: '#1890ff', fontSize: 'clamp(1.2rem, 4vw, 1.5rem)' }}
                        />
                      </Card>
                    </Col>
                  </Row>

                  {/* Desktop Table */}
                  <div className=" md:block">
                    <div className="overflow-x-auto">
                      <Table
                        loading={loading}
                        dataSource={state.branchUsers}
                        columns={branchUserColumns}
                        rowKey="id"
                        scroll={{ x: 800 }}
                        pagination={{
                          pageSize: 10,
                          showSizeChanger: true,
                          showTotal: (total) => `សរុប ${total}`,
                          size: "small"
                        }}
                        size="small"
                      />
                    </div>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden">
                    {loading ? (
                      <div className="text-center py-8 text-sm">Loading...</div>
                    ) : (
                      <div className="space-y-2">
                        {state.branchUsers.map(user => (
                          <UserMobileCard key={user.id} user={user} />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {!state.selectedBranch && (
                <Empty 
                  description={<span className="text-xs sm:text-sm">សូមជ្រើសរើសសាខាដើម្បីមើលព័ត៌មាន</span>}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </TabPane>

            {/* Tab 2: Role Editor */}
            <TabPane
              tab={
                <span className="text-xs sm:text-sm">
                  <EditOutlined /> <span className="hidden xs:inline">កែប្រែតួនាទី</span>
                </span>
              }
              key="role-editor"
            >
              <div className="mb-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                <p className="font-semibold mb-1 text-xs sm:text-sm">⚠️ ការជូនដំណឹង:</p>
                <p className="text-xs sm:text-sm">
                  ការកែប្រែសិទ្ធិតួនាទីនឹងប៉ះពាល់ដល់អ្នកប្រើប្រាស់ទាំងអស់ដែលមានតួនាទីនេះ។
                </p>
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <Table
                    loading={loading}
                    dataSource={state.roles}
                    columns={roleColumns}
                    rowKey="id"
                    pagination={false}
                    scroll={{ x: 600 }}
                    size="small"
                  />
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden">
                {loading ? (
                  <div className="text-center py-8 text-sm">Loading...</div>
                ) : (
                  <div className="space-y-2">
                    {state.roles.map(role => (
                      <RoleMobileCard key={role.id} role={role} />
                    ))}
                  </div>
                )}
              </div>
            </TabPane>

            {/* Tab 3: Permission Matrix */}
            <TabPane
              tab={
                <span className="text-xs sm:text-sm">
                  <SwapOutlined /> <span className="hidden xs:inline">ប្រៀបធៀប</span>
                </span>
              }
              key="comparison"
            >
              <div className="mb-4 p-3 bg-blue-50 rounded">
                <p className="mb-2 font-semibold text-xs sm:text-sm">របៀបអានតារាង:</p>
                <Space size="small" className="flex-wrap">
                  <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
                  <span className="text-xs sm:text-sm">= មានសិទ្ធិ</span>
                  <CloseCircleOutlined style={{ color: '#d9d9d9', fontSize: 18 }} />
                  <span className="text-xs sm:text-sm">= គ្មានសិទ្ធិ</span>
                </Space>
              </div>

              {state.comparisonMatrix.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table
                    loading={loading}
                    dataSource={state.comparisonMatrix}
                    columns={getMatrixColumns()}
                    rowKey="permission_id"
                    scroll={{ x: 'max-content' }}
                    pagination={{
                      pageSize: 20,
                      showSizeChanger: true,
                      size: "small"
                    }}
                    size="small"
                  />
                </div>
              ) : (
                <Empty description={<span className="text-xs sm:text-sm">មិនមានទិន្នន័យ</span>} />
              )}
            </TabPane>

            {/* Tab 4: Permission CRUD */}
            <TabPane
              tab={
                <span className="text-xs sm:text-sm">
                  <DatabaseOutlined /> <span className="hidden xs:inline">គ្រប់គ្រងសិទ្ធិ</span>
                </span>
              }
              key="permission-crud"
            >
              <PermissionCRUD />
            </TabPane>
          </Tabs>
        </Card>

{/* 1. VIEW USER PERMISSIONS MODAL - RESPONSIVE */}
<Modal
  open={modalVisible && modalType === 'view'}
  onCancel={() => setModalVisible(false)}
  footer={null}
  width={window.innerWidth < 768 ? '95%' : 900}
  title={
    <div className="text-base sm:text-xl font-bold flex items-center gap-2 flex-wrap">
      <EyeOutlined className="text-blue-600 text-lg sm:text-xl" /> 
      <span className="break-words">សិទ្ធិរបស់ {state.userInfo.name}</span>
    </div>
  }
  bodyStyle={{ padding: window.innerWidth < 640 ? '12px' : '24px' }}
>
  {/* User Info - RESPONSIVE */}
  <Card className="mb-4 bg-gradient-to-r from-blue-50 to-purple-50">
    <Row gutter={[12, 12]}>
      <Col xs={24} sm={8}>
        <div className="text-xs sm:text-sm text-gray-600">ឈ្មោះ:</div>
        <div className="font-semibold text-sm sm:text-base truncate">{state.userInfo.name}</div>
      </Col>
      <Col xs={24} sm={8}>
        <div className="text-xs sm:text-sm text-gray-600">Username:</div>
        <div className="font-semibold text-sm sm:text-base truncate">{state.userInfo.username}</div>
      </Col>
      <Col xs={24} sm={8}>
        <div className="text-xs sm:text-sm text-gray-600">តួនាទី:</div>
        <Tag color="blue" className="text-xs sm:text-sm">{state.userInfo.role_name}</Tag>
      </Col>
    </Row>
    <Row gutter={[12, 12]} className="mt-3">
      <Col xs={24} sm={12}>
        <div className="text-xs sm:text-sm text-gray-600">សាខា:</div>
        <div className="font-semibold text-sm sm:text-base">{state.userInfo.branch_name || 'N/A'}</div>
      </Col>
      <Col xs={24} sm={12}>
        <div className="text-xs sm:text-sm text-gray-600">ចំនួនសិទ្ធិសរុប:</div>
        <Badge 
          count={state.userPermissions.length} 
          showZero 
          style={{ backgroundColor: '#52c41a' }}
        />
      </Col>
    </Row>
  </Card>

  {/* Permissions grouped by category - RESPONSIVE */}
  <Collapse defaultActiveKey={['0']} className="mb-4">
    {Object.entries(
      state.userPermissions.reduce((acc, perm) => {
        const category = perm.category || 'Other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(perm);
        return acc;
      }, {})
    ).map(([category, perms], index) => (
      <Panel 
        header={
          <div className="flex justify-between items-center gap-2">
            <span className="font-semibold text-xs sm:text-sm truncate flex-1">{category}</span>
            <Badge count={perms.length} style={{ backgroundColor: '#1890ff' }} />
          </div>
        } 
        key={index}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {perms.map(perm => (
            <div key={perm.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <CheckCircleOutlined style={{ color: '#52c41a' }} className="shrink-0" />
              <span className="text-xs sm:text-sm">{perm.name}</span>
            </div>
          ))}
        </div>
      </Panel>
    ))}
  </Collapse>

  {/* Mobile-friendly Footer */}
  <div className="flex justify-end mt-4">
    <Button onClick={() => setModalVisible(false)} block={window.innerWidth < 640} size="middle">
      បិទ
    </Button>
  </div>
</Modal>

{/* 2. EDIT ROLE PERMISSIONS MODAL - RESPONSIVE */}
<Modal
  open={modalVisible && modalType === 'edit-role'}
  onCancel={() => {
    setModalVisible(false);
    setEditMode(false);
  }}
  width={window.innerWidth < 768 ? '95%' : 1000}
  footer={
    <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
      {/* Warning Message */}
      <div className="text-center sm:text-left">
        {editMode && (
          <span className="text-orange-600 text-xs sm:text-sm">
            ⚠️ កំពុងកែប្រែ - សូមចុច "រក្សាទុក" ដើម្បីធ្វើបច្ចុប្បន្នភាព
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <Space className="w-full sm:w-auto flex-wrap justify-center sm:justify-end" size={[8, 8]}>
        <Button 
          onClick={() => setModalVisible(false)}
          block={window.innerWidth < 640}
          className="sm:w-auto"
        >
          បិទ
        </Button>
        {!editMode ? (
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => setEditMode(true)}
            block={window.innerWidth < 640}
            className="sm:w-auto"
          >
            ចាប់ផ្តើមកែប្រែ
          </Button>
        ) : (
          <>
            <Button
              icon={<RollbackOutlined />}
              onClick={() => {
                setEditMode(false);
                loadRolePermissions(state.selectedRole);
              }}
              block={window.innerWidth < 640}
              className="sm:w-auto"
            >
              បោះបង់
            </Button>
            <Popconfirm
              title="រក្សាទុកការផ្លាស់ប្តូរ?"
              description={`តើអ្នកចង់រក្សាទុកការផ្លាស់ប្តូរសិទ្ធិសម្រាប់តួនាទី ${getRoleById(state.selectedRole)?.name}?`}
              onConfirm={handleUpdateRolePermissions}
              okText="បាទ/ចាស"
              cancelText="មិន"
            >
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={loading}
                className="bg-green-600 hover:bg-green-700"
                block={window.innerWidth < 640}
              >
                រក្សាទុក
              </Button>
            </Popconfirm>
          </>
        )}
      </Space>
    </div>
  }
  title={
    <div className="text-base sm:text-xl font-bold flex flex-wrap items-center gap-2">
      <EditOutlined className="text-blue-600 text-lg sm:text-xl" /> 
      <span className="break-words">កែប្រែសិទ្ធិតួនាទី: {getRoleById(state.selectedRole)?.name}</span>
      <Tag color="blue" className="text-xs sm:text-sm">{getRoleById(state.selectedRole)?.code}</Tag>
    </div>
  }
  bodyStyle={{ padding: window.innerWidth < 640 ? '12px' : '24px' }}
>
  {/* Statistics - RESPONSIVE */}
  <Card className="mb-4 bg-gradient-to-r from-purple-50 to-blue-50">
    <Row gutter={[12, 12]}>
      <Col xs={24} sm={12}>
        <Statistic
          title={<span className="text-xs sm:text-sm">ចំនួនសិទ្ធិដែលបានជ្រើសរើស</span>}
          value={state.selectedPermissionIds.length}
          prefix={<CheckCircleOutlined className="text-sm sm:text-base" />}
          valueStyle={{ color: '#52c41a', fontSize: 'clamp(1.2rem, 4vw, 1.5rem)' }}
        />
      </Col>
      <Col xs={24} sm={12}>
        <Statistic
          title={<span className="text-xs sm:text-sm">ចំនួនសិទ្ធិសរុប</span>}
          value={state.allPermissions.length}
          prefix={<SafetyCertificateOutlined className="text-sm sm:text-base" />}
          valueStyle={{ color: '#1890ff', fontSize: 'clamp(1.2rem, 4vw, 1.5rem)' }}
        />
      </Col>
    </Row>
  </Card>

  {/* Permission Selection - RESPONSIVE */}
  <Collapse defaultActiveKey={Object.keys(state.groupedPermissions)}>
    {Object.entries(state.groupedPermissions).map(([category, perms]) => {
      const selectedCount = perms.filter(p => 
        state.selectedPermissionIds.includes(p.id)
      ).length;
      const allSelected = selectedCount === perms.length;

      return (
        <Panel
          key={category}
          header={
            <div className="flex justify-between items-center gap-2">
              <Space className="flex-1 min-w-0" size={[4, 4]}>
                <span className="font-semibold text-xs sm:text-sm truncate">{category}</span>
                <Badge 
                  count={`${selectedCount}/${perms.length}`}
                  style={{ 
                    backgroundColor: allSelected ? '#52c41a' : '#1890ff',
                    fontSize: window.innerWidth < 640 ? '10px' : '12px'
                  }}
                />
              </Space>
              {editMode && (
                <Checkbox
                  checked={allSelected}
                  indeterminate={selectedCount > 0 && !allSelected}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => handleSelectAll(perms)}
                  className="shrink-0"
                >
                  <span className="text-xs sm:text-sm hidden sm:inline">ជ្រើសរើសទាំងអស់</span>
                  <span className="text-xs sm:hidden">ទាំងអស់</span>
                </Checkbox>
              )}
            </div>
          }
        >
          {/* Mobile: Single column, Desktop: 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {perms.map(perm => {
              const isSelected = state.selectedPermissionIds.includes(perm.id);
              
              return (
                <div
                  key={perm.id}
                  className={`flex items-center justify-between p-2 sm:p-3 rounded border transition-all ${
                    isSelected 
                      ? 'bg-green-50 border-green-300' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isSelected ? (
                      <CheckCircleOutlined style={{ color: '#52c41a' }} className="shrink-0" />
                    ) : (
                      <CloseCircleOutlined style={{ color: '#d9d9d9' }} className="shrink-0" />
                    )}
                    <span className={`text-xs sm:text-sm truncate ${isSelected ? 'font-medium' : ''}`}>
                      {perm.name}
                    </span>
                  </div>
                  {editMode && (
                    <Switch
                      checked={isSelected}
                      onChange={() => handlePermissionToggle(perm.id)}
                      size="small"
                      className="shrink-0"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </Panel>
      );
    })}
  </Collapse>
</Modal>

{/* 3. CLONE PERMISSIONS MODAL - RESPONSIVE */}
<Modal
  open={cloneModalVisible}
  onCancel={() => {
    setCloneModalVisible(false);
    cloneForm.resetFields();
  }}
  footer={null}
  width={window.innerWidth < 768 ? '95%' : 600}
  title={
    <div className="text-base sm:text-xl font-bold flex items-center gap-2">
      <CopyOutlined className="text-blue-600 text-lg sm:text-xl" /> 
      <span>ចម្លងសិទ្ធិ</span>
    </div>
  }
  bodyStyle={{ padding: window.innerWidth < 640 ? '12px' : '24px' }}
>
  {/* Warning Message - RESPONSIVE */}
  <div className="mb-4 p-2 sm:p-3 bg-yellow-50 rounded border border-yellow-200">
    <p className="text-xs sm:text-sm">
      ⚠️ ការចម្លងនឹងជំនួសសិទ្ធិទាំងអស់របស់តួនាទីគោលដៅជាមួយសិទ្ធិពីតួនាទីប្រភព។
    </p>
  </div>

  {/* Form - RESPONSIVE */}
  <Form form={cloneForm} layout="vertical" onFinish={handleClonePermissions}>
    <Form.Item
      name="source_role_id"
      label={<span className="text-xs sm:text-sm">តួនាទីប្រភព (ចម្លងពី)</span>}
      rules={[{ required: true, message: "សូមជ្រើសរើសតួនាទីប្រភព" }]}
    >
      <Select 
        placeholder="ជ្រើសរើសតួនាទីប្រភព"
        size={window.innerWidth < 640 ? 'middle' : 'large'}
      >
        {state.roles.map(role => (
          <Option key={role.id} value={role.id}>
            <span className="text-xs sm:text-sm">{role.name} ({role.code})</span>
          </Option>
        ))}
      </Select>
    </Form.Item>

    <Form.Item
      name="target_role_id"
      label={<span className="text-xs sm:text-sm">តួនាទីគោលដៅ (ចម្លងទៅ)</span>}
      rules={[{ required: true, message: "សូមជ្រើសរើសតួនាទីគោលដៅ" }]}
    >
      <Select 
        placeholder="ជ្រើសរើសតួនាទីគោលដៅ"
        size={window.innerWidth < 640 ? 'middle' : 'large'}
      >
        {state.roles.map(role => (
          <Option key={role.id} value={role.id}>
            <span className="text-xs sm:text-sm">{role.name} ({role.code})</span>
          </Option>
        ))}
      </Select>
    </Form.Item>

    <Divider className="my-3 sm:my-4" />

    {/* Buttons - RESPONSIVE */}
    <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
      <Button 
        onClick={() => {
          setCloneModalVisible(false);
          cloneForm.resetFields();
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
        icon={<CopyOutlined />}
        block={window.innerWidth < 640}
        className="sm:w-auto"
      >
        ចម្លងសិទ្ធិ
      </Button>
    </div>
  </Form>
</Modal>
    </div>
    </div>
  );
}

export default PermissionManagement;