import React, { useEffect, useState } from "react";
import {
    Table, Tag, Button, Card, Row, Col, Select,
    Spin, Typography, Tabs, Checkbox,
    Divider, Space, Alert
} from "antd";
import Swal from 'sweetalert2';
import {
    SaveOutlined,
    ReloadOutlined,
    SafetyCertificateOutlined,
    CheckCircleOutlined
} from "@ant-design/icons";
import { request } from "../../util/helper";
import { useTranslation } from "../../locales/TranslationContext";

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const PermissionPage = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [selectedRole, setSelectedRole] = useState(null);
    const [rolePermissions, setRolePermissions] = useState([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const res = await request("permission", "get");
            if (res && !res.error) {
                setRoles(res.roles || []);
                setPermissions(res.permissions || []);

            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: res.message || t("Failed to load permissions"),
                });
            }
        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: t("Failed to load data"),
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (roleId) => {
        setSelectedRole(roleId);
        setLoading(true);
        try {
            const res = await request(`permission/role/${roleId}`, "get");
            if (res && !res.error) {
                // Extract permission IDs from the response
                const permissionIds = res.permissions.map(p => p.id);
                setRolePermissions(permissionIds);
            }
        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: t("Failed to load role permissions"),
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePermissionToggle = (permissionId) => {
        setRolePermissions(prev => {
            if (prev.includes(permissionId)) {
                return prev.filter(id => id !== permissionId);
            } else {
                return [...prev, permissionId];
            }
        });
    };

    const handleGroupToggle = (groupIds, checked) => {
        if (checked) {
            // Add all IDs from this group that aren't already selected
            const newIds = groupIds.filter(id => !rolePermissions.includes(id));
            setRolePermissions(prev => [...prev, ...newIds]);
        } else {
            // Remove all IDs from this group
            setRolePermissions(prev => prev.filter(id => !groupIds.includes(id)));
        }
    };

    const handleSave = async () => {
        if (!selectedRole) return;

        setSaving(true);
        try {
            const res = await request("permission/role", "put", {
                role_id: selectedRole,
                permission_ids: rolePermissions
            });

            if (res && !res.error) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: t(res.message_kh || "Permissions updated successfully"),
                    showConfirmButton: false,
                    timer: 1500
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: res.message || t("Failed to update permissions"),
                });
            }
        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: t("Failed to save changes"),
            });
        } finally {
            setSaving(false);
        }
    };

    // Group permissions by 'group' field
    const groupedPermissions = permissions.reduce((acc, perm) => {
        const group = perm.group || "Other";
        if (!acc[group]) acc[group] = [];
        acc[group].push(perm);
        return acc;
    }, {});

    const renderPermissionGroups = () => {
        return Object.entries(groupedPermissions).map(([groupName, groupPermissions]) => {
            const allSelected = groupPermissions.every(p => rolePermissions.includes(p.id));
            const indeterminate = groupPermissions.some(p => rolePermissions.includes(p.id)) && !allSelected;
            const groupIds = groupPermissions.map(p => p.id);

            return (
                <Card
                    key={groupName}
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text strong>{t(groupName)}</Text>
                            <Checkbox
                                checked={allSelected}
                                indeterminate={indeterminate}
                                onChange={(e) => handleGroupToggle(groupIds, e.target.checked)}
                            >
                                {t("Select All")}
                            </Checkbox>
                        </div>
                    }
                    size="small"
                    style={{ marginBottom: 16, borderColor: '#d9d9d9' }}
                    headStyle={{ backgroundColor: '#fafafa' }}
                >
                    <Row gutter={[16, 16]}>
                        {groupPermissions.map(perm => (
                            <Col span={8} key={perm.id} xs={24} sm={12} md={8} lg={6}>
                                <Checkbox
                                    checked={rolePermissions.includes(perm.id)}
                                    onChange={() => handlePermissionToggle(perm.id)}
                                >
                                    <span title={perm.web_route_key || perm.name}>
                                        {t(perm.name)}
                                    </span>
                                </Checkbox>
                            </Col>
                        ))}
                    </Row>
                </Card>
            );
        });
    };

    const selectedRoleName = roles.find(r => r.id === selectedRole)?.name;

    return (
        <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <Title level={4} style={{ margin: 0 }}>
                        <SafetyCertificateOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                        {t("Permission Management")}
                    </Title>
                    <Text type="secondary">{t("Manage roles and access rights for your branch")}</Text>
                </div>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={fetchInitialData}>
                        {t("Refresh")}
                    </Button>
                    <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={handleSave}
                        loading={saving}
                        disabled={!selectedRole}
                    >
                        {t("Save Changes")}
                    </Button>
                </Space>
            </div>

            <Alert
                message={t("Branch Manager Notice")}
                description={t("You can only configure permissions available to your branch level. Super Admin permissions are managed separately.")}
                type="info"
                showIcon
                style={{ marginBottom: 20 }}
            />

            <Row gutter={[24, 24]}>
                <Col xs={24} md={6}>
                    <Card title={t("Roles")} style={{ height: '100%' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {roles.map(role => (
                                <Button
                                    key={role.id}
                                    type={selectedRole === role.id ? "primary" : "text"}
                                    block
                                    style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                                    onClick={() => handleRoleChange(role.id)}
                                >
                                    {role.name}
                                    {selectedRole === role.id && <CheckCircleOutlined style={{ marginLeft: 'auto' }} />}
                                </Button>
                            ))}
                            {roles.length === 0 && !loading && <Text type="secondary">{t("No roles found")}</Text>}
                        </div>
                    </Card>
                </Col>

                <Col xs={24} md={18}>
                    <Spin spinning={loading}>
                        {selectedRole ? (
                            <div style={{ maxHeight: '75vh', overflowY: 'auto', paddingRight: 8 }}>
                                <div style={{ marginBottom: 16 }}>
                                    <Text strong style={{ fontSize: 16 }}>
                                        {t("Permissions for")}: <Tag color="blue" style={{ fontSize: 14, padding: '4px 8px' }}>{selectedRoleName}</Tag>
                                    </Text>
                                </div>
                                {renderPermissionGroups()}
                            </div>
                        ) : (
                            <Card>
                                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                    <Text type="secondary">{t("Select a role to view permissions")}</Text>
                                </div>
                            </Card>
                        )}
                    </Spin>
                </Col>
            </Row>
        </div>
    );
};

export default PermissionPage;
