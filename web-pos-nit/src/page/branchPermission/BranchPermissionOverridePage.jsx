import { useEffect, useState } from "react";
import { request } from "../../util/helper";
import { getProfile } from "../../store/profile.store";
import { Button, Select, Table, Tag, message, Modal, Input, Spin, Result, Tooltip } from "antd";
import { useTranslation } from "../../locales/TranslationContext";
import { configStore } from "../../store/configStore";
import { PlusOutlined, DeleteOutlined, InfoCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

const { Option } = Select;
const { TextArea } = Input;

function BranchPermissionOverridePage() {
    const { t } = useTranslation();
    const { config } = configStore();
    // ✅ Fix: config.user is a list of users, NOT the logged-in user. Use getProfile() instead.
    const user = getProfile() || {};


    // 🔒 Security Check: Super Admin OR Branch Admin
    const roleName = String(user.role_name || config.role || config.role_name || '').toLowerCase();

    const isSuperAdmin =
        Number(user.role_id) === 29 ||
        Number(config.role_id) === 29 ||
        roleName.includes('super admin') ||
        roleName.includes('supper admin');

    // Admin (Branch Manager) - usually ID 1 or role 'admin'
    const isAdmin =
        Number(user.role_id) === 1 ||
        Number(config.role_id) === 1 ||
        roleName === 'admin';

    // Allow if role_id is 1 or 29 regardless of roleName string matching
    const hasAccess = isSuperAdmin || isAdmin || Number(user.role_id) === 1 || Number(user.role_id) === 29;



    // State Hooks must be called unconditionally
    const [branches, setBranches] = useState([]);
    const [roles, setRoles] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null);
    const [basePermissions, setBasePermissions] = useState([]);
    const [overrides, setOverrides] = useState([]);
    const [allPermissions, setAllPermissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState('add'); // 'add' or 'remove'
    const [selectedPermission, setSelectedPermission] = useState(null);
    const [reason, setReason] = useState('');




    useEffect(() => {
        loadInitialData();

        // If not super admin, auto-select their branch
        if (!isSuperAdmin && isAdmin && user.branch_name) {
            setSelectedBranch(user.branch_name);
        }
    }, [isSuperAdmin, isAdmin, user.branch_name]);

    useEffect(() => {
        if (selectedBranch && selectedRole) {
            loadOverrides();
        }
    }, [selectedBranch, selectedRole]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            // ✅ Load branches from Config Store (faster & reliable)
            // config.branch_name is [{label: "...", value: "..."}]
            if (config.branch_name && Array.isArray(config.branch_name)) {
                setBranches(config.branch_name.map(b => b.value));
            } else if (config.branch_select_loc && Array.isArray(config.branch_select_loc)) {
                setBranches(config.branch_select_loc.map(b => b.value));
            } else {
                // Fallback if config isn't loaded yet (though unlikely)
                const usersRes = await request("config", "get"); // Re-fetch config if needed
                if (usersRes && usersRes.branch_name) {
                    setBranches(usersRes.branch_name.map(b => b.value));
                }
            }

            // Load roles
            const rolesRes = await request("role", "get");
            if (rolesRes && !rolesRes.error) {
                setRoles(rolesRes.list);
            }

            // Load all permissions
            const permsRes = await request("permissions", "get");
            if (permsRes && !permsRes.error) {
                setAllPermissions(permsRes.list || []);
            }
        } catch (error) {
            message.error("Failed to load initial data");
        } finally {
            setLoading(false);
        }
    };

    const loadOverrides = async () => {
        if (!selectedBranch || !selectedRole) return;

        setLoading(true);
        try {
            const res = await request(`branch-permissions/overrides/${selectedBranch}/${selectedRole}`, "get");
            if (res && !res.error) {
                setOverrides(res.overrides || []);
                setBasePermissions(res.base_permissions || []);
            }
        } catch (error) {
            message.error("Failed to load overrides");
        } finally {
            setLoading(false);
        }
    };

    const handleAddOverride = async () => {
        if (!selectedPermission || !reason.trim()) {
            message.warning("Please select a permission and provide a reason");
            return;
        }

        try {
            const res = await request("branch-permissions/overrides", "post", {
                branch_name: selectedBranch,
                role_id: selectedRole,
                permission_id: selectedPermission,
                override_type: modalType,
                reason: reason.trim()
            });

            if (res && !res.error) {
                message.success(res.message || "Override added successfully");
                setModalVisible(false);
                setSelectedPermission(null);
                setReason('');
                loadOverrides();
            } else {
                message.error(res.message || "Failed to add override");
            }
        } catch (error) {
            message.error("Failed to add override");
        }
    };

    const handleDeleteOverride = (overrideId) => {
        Modal.confirm({
            title: "Delete Override",
            content: "Are you sure you want to delete this override?",
            onOk: async () => {
                try {
                    const res = await request(`branch-permissions/overrides/${overrideId}`, "delete");
                    if (res && !res.error) {
                        message.success("Override deleted successfully");
                        loadOverrides();
                    }
                } catch (error) {
                    message.error("Failed to delete override");
                }
            }
        });
    };

    const openAddModal = (type) => {
        setModalType(type);
        setModalVisible(true);
        setSelectedPermission(null);
        setReason('');
    };

    // Calculate effective permissions
    const getEffectivePermissions = () => {
        const removedIds = new Set(overrides.filter(o => o.override_type === 'remove').map(o => o.permission_id));
        const addedPerms = overrides.filter(o => o.override_type === 'add');

        let effective = basePermissions.filter(p => !removedIds.has(p.id));

        addedPerms.forEach(override => {
            if (!effective.find(p => p.id === override.permission_id)) {
                effective.push({
                    id: override.permission_id,
                    name: override.permission_name,
                    group: override.permission_group,
                    source: 'added'
                });
            }
        });

        return effective;
    };

    // Get available permissions for adding (not in base role)
    const getAvailableToAdd = () => {
        const baseIds = new Set(basePermissions.map(p => p.id));
        const alreadyAddedIds = new Set(overrides.filter(o => o.override_type === 'add').map(o => o.permission_id));
        return allPermissions.filter(p => !baseIds.has(p.id) && !alreadyAddedIds.has(p.id));
    };

    // Get available permissions for removing (in base role, not already removed)
    const getAvailableToRemove = () => {
        const alreadyRemovedIds = new Set(overrides.filter(o => o.override_type === 'remove').map(o => o.permission_id));
        return basePermissions.filter(p => !alreadyRemovedIds.has(p.id));
    };

    const effectivePermissions = getEffectivePermissions();

    const columns = [
        {
            title: "No",
            key: "no",
            width: 60,
            render: (_, __, index) => index + 1
        },
        {
            title: "Permission",
            dataIndex: "permission_name",
            key: "permission_name",
            render: (text) => <span className="font-medium">{text}</span>
        },
        {
            title: "Group",
            dataIndex: "permission_group",
            key: "permission_group",
            render: (text) => <Tag color="blue">{text}</Tag>
        },
        {
            title: "Override Type",
            dataIndex: "override_type",
            key: "override_type",
            render: (type) => (
                type === 'add' ?
                    <Tag color="green" icon={<PlusOutlined />}>Added</Tag> :
                    <Tag color="red" icon={<CloseCircleOutlined />}>Removed</Tag>
            )
        },
        {
            title: "Reason",
            dataIndex: "reason",
            key: "reason",
            render: (text) => (
                <Tooltip title={text}>
                    <span className="text-gray-600 truncate max-w-xs block">{text || '-'}</span>
                </Tooltip>
            )
        },
        {
            title: "Created By",
            dataIndex: "created_by_name",
            key: "created_by_name",
            render: (text) => text || '-'
        },
        {
            title: "Action",
            key: "action",
            align: "center",
            width: 100,
            render: (_, record) => (
                <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteOverride(record.id)}
                >
                    Delete
                </Button>
            )
        }
    ];

    if (!hasAccess) {
        return (
            <div className="p-8 flex justify-center items-center min-h-screen bg-gray-50">
                <Result
                    status="403"
                    title="403"
                    subTitle="Sorry, you are not authorized to access Branch Permission Overrides."
                    extra={<Button type="primary" onClick={() => window.location.href = '/'}>Back Home</Button>}
                />
            </div>
        );
    }

    return (
        <div className="p-4">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 p-4 mb-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Branch Permission Overrides
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Select Branch</label>
                        <Select
                            className="w-full"
                            placeholder="Select a branch"
                            value={selectedBranch}
                            onChange={setSelectedBranch}
                            showSearch
                            disabled={!isSuperAdmin} // Disable for Branch Admins
                        >
                            {branches.map(branch => (
                                <Option key={branch} value={branch}>{branch}</Option>
                            ))}
                        </Select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Select Role</label>
                        <Select
                            className="w-full"
                            placeholder="Select a role"
                            value={selectedRole}
                            onChange={setSelectedRole}
                            showSearch
                        >
                            {roles.map(role => (
                                <Option key={role.id} value={role.id}>{role.name} ({role.code})</Option>
                            ))}
                        </Select>
                    </div>
                </div>

                {/* Summary */}
                {selectedBranch && selectedRole && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-2">
                            <InfoCircleOutlined className="text-blue-600" />
                            <span className="font-semibold">Permission Summary</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <div className="text-gray-600 dark:text-gray-400">Base Permissions</div>
                                <div className="text-2xl font-bold text-blue-600">{basePermissions.length}</div>
                            </div>
                            <div>
                                <div className="text-gray-600 dark:text-gray-400">Added</div>
                                <div className="text-2xl font-bold text-green-600">
                                    {overrides.filter(o => o.override_type === 'add').length}
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-600 dark:text-gray-400">Removed</div>
                                <div className="text-2xl font-bold text-red-600">
                                    {overrides.filter(o => o.override_type === 'remove').length}
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-600 dark:text-gray-400">Effective Total</div>
                                <div className="text-2xl font-bold text-purple-600">{effectivePermissions.length}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            {selectedBranch && selectedRole && (
                <div className="bg-white dark:bg-gray-800 p-4 mb-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex gap-2">
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => openAddModal('add')}
                            disabled={getAvailableToAdd().length === 0}
                        >
                            Add Permission
                        </Button>
                        <Button
                            danger
                            icon={<CloseCircleOutlined />}
                            onClick={() => openAddModal('remove')}
                            disabled={getAvailableToRemove().length === 0}
                        >
                            Remove Permission
                        </Button>
                    </div>
                </div>
            )}

            {/* Overrides Table */}
            {selectedBranch && selectedRole && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <Table
                        dataSource={overrides}
                        columns={columns}
                        loading={loading}
                        rowKey="id"
                        pagination={{ pageSize: 10 }}
                        locale={{ emptyText: "No overrides configured for this branch and role" }}
                    />
                </div>
            )}

            {/* Add/Remove Modal */}
            <Modal
                title={modalType === 'add' ? 'Add Permission Override' : 'Remove Permission Override'}
                open={modalVisible}
                onOk={handleAddOverride}
                onCancel={() => setModalVisible(false)}
                okText="Confirm"
                cancelText="Cancel"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Select Permission to {modalType === 'add' ? 'Add' : 'Remove'}
                        </label>
                        <Select
                            className="w-full"
                            placeholder="Select a permission"
                            value={selectedPermission}
                            onChange={setSelectedPermission}
                            showSearch
                            optionFilterProp="children"
                        >
                            {(modalType === 'add' ? getAvailableToAdd() : getAvailableToRemove()).map(perm => (
                                <Option key={perm.id} value={perm.id}>
                                    {perm.name} ({perm.group})
                                </Option>
                            ))}
                        </Select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Reason (Required)</label>
                        <TextArea
                            rows={3}
                            placeholder="Explain why this override is needed..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>

                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <div className="text-sm text-yellow-800">
                            <strong>Note:</strong> This will {modalType === 'add' ? 'grant' : 'revoke'} this permission
                            for all users with <strong>{roles.find(r => r.id === selectedRole)?.name}</strong> role
                            in <strong>{selectedBranch}</strong> branch.
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}


export default BranchPermissionOverridePage;
