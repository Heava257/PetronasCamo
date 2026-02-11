import React, { useEffect, useState } from "react";
import { formatDateServer, isPermission, request } from "../../util/helper";
import {
  Avatar,
  Button,
  Col,
  Form,
  Image,
  Input,
  message,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Upload,
  Drawer,
  Alert,
  Tabs,
  Card,
  Statistic,
  Divider,
  Progress,
  Badge
} from "antd";
import { configStore } from "../../store/configStore";
import {
  MdDelete,
  MdEdit,
  MdOutlineCreateNewFolder,
  MdOutlineAccountCircle,
  MdOutlineEmail,
  MdOutlinePhone,
  MdOutlineLocationOn,
  MdOutlineBusiness,
  MdOutlineSecurity,
  MdOutlineCalendarToday
} from "react-icons/md";
import {
  UploadOutlined,
  UserOutlined,
  EyeOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  FilterOutlined,
  ExportOutlined,
  ReloadOutlined,
  MenuOutlined
} from "@ant-design/icons";
import { Config } from "../../util/config";
import { IoEyeOutline, IoFilter } from "react-icons/io5";
import imageExtensions from 'image-extensions';
import { useTranslation } from "../../locales/TranslationContext";
import { getProfile } from "../../store/profile.store";
import dayjs from "dayjs";
import MainPage from "../../component/layout/MainPage";
import "./user.css";
import Swal from "sweetalert2";

const { TabPane } = Tabs;

function AdminPage() {
  const { t } = useTranslation();
  const profile = getProfile();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [imageDefault, setImageDefault] = useState([]);
  const [form] = Form.useForm();
  const { config } = configStore();

  const [activeTab, setActiveTab] = useState("1");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedRole, setSelectedRole] = useState("all");
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);

  const [state, setState] = useState({
    list: [],
    filteredList: [],
    role: [],
    groups: [],
    loading: false,
    visible: false,
    isSuperAdmin: false,
    currentUserRole: null,
    stats: {
      total: 0,
      active: 0,
      inactive: 0,
      byRole: {}
    }
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    getList();
    getRoles();
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    filterUsers();
  }, [filterStatus, selectedRole, state.list]);

  useEffect(() => {
    calculateStats();
  }, [state.list]);

  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };

  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const calculateStats = () => {
    const stats = {
      total: state.list.length,
      active: state.list.filter(user => user.is_active === 1).length,
      inactive: state.list.filter(user => user.is_active === 0).length,
      byRole: {}
    };

    state.list.forEach(user => {
      if (user.role_name) {
        stats.byRole[user.role_name] = (stats.byRole[user.role_name] || 0) + 1;
      }
    });

    setState(prev => ({ ...prev, stats }));
  };

  const filterUsers = () => {
    let filtered = [...state.list];

    if (filterStatus === "active") {
      filtered = filtered.filter(user => user.is_active === 1);
    } else if (filterStatus === "inactive") {
      filtered = filtered.filter(user => user.is_active === 0);
    }

    if (selectedRole !== "all") {
      filtered = filtered.filter(user => user.role_name === selectedRole);
    }

    setState(prev => ({ ...prev, filteredList: filtered }));
  };

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;

        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          const maxSize = 800;
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height / width) * maxSize;
              width = maxSize;
            } else {
              width = (width / height) * maxSize;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Canvas is empty'));
              }
            },
            'image/jpeg',
            0.7
          );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  const getList = async () => {
    setState(prev => ({ ...prev, loading: true }));
    const res = await request("groups/get-list", "get");
    if (res && !res.error) {
      setState((pre) => ({
        ...pre,
        list: res.list || [],
        filteredList: res.list || [],
        isSuperAdmin: res.is_super_admin || false,
        currentUserRole: profile?.role_code || null,
        loading: false
      }));
    } else {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const getRoles = async () => {
    try {
      const res = await request("role", "get");

      if (res && res.list && Array.isArray(res.list)) {
        const transformedRoles = res.list.map(role => ({
          value: role.id,
          label: role.name,
          code: role.code,
          id: role.id
        }));

        setState((pre) => ({
          ...pre,
          role: transformedRoles,
        }));
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load roles',
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load roles',
      });
    }
  };

  const onClickEdit = (item) => {
    form.setFieldsValue({
      ...item,
    });

    setState((pre) => ({
      ...pre,
      visible: true,
    }));

    if (item.profile_image && item.profile_image !== "") {
      const imageProduct = [
        {
          uid: "-1",
          name: item.profile_image,
          status: "done",
          url: Config.getFullImagePath(item.profile_image),
        },
      ];
      setImageDefault(imageProduct);
    } else {
      setImageDefault([]);
    }
  };

  const clickBtnDelete = (item) => {
    Swal.fire({
      title: t("Delete User"),
      text: `${t("Are you sure you want to delete")} ${item.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: t("Delete"),
      cancelButtonText: t("Cancel")
    }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await request("user", "delete", { id: item.id });
        if (res && !res.error) {
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: res.message,
            showConfirmButton: false,
            timer: 1500
          });
          getList();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: res.message || t("Cannot delete user"),
          });
        }
      }
    });
  };

  const handleCloseModal = () => {
    setState((pre) => ({
      ...pre,
      visible: false,
    }));
    form.resetFields();
    setImageDefault([]);
  };

  const handleOpenModal = () => {
    if (!state.isSuperAdmin && profile?.branch_name) {
      form.setFieldsValue({
        branch_name: profile.branch_name,
        group_id: profile.group_id,
      });
    }

    setState((pre) => ({
      ...pre,
      visible: true,
    }));
  };

  const beforeUpload = (file) => {
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const isValidExtension = imageExtensions.includes(fileExtension);
    const isImage = file.type.startsWith('image/');

    if (!isValidExtension || !isImage) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: t('You can only upload image files!'),
      });
      return false;
    }

    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: t('Image must be smaller than 2MB!'),
      });
      return false;
    }

    return true;
  };

  const onFinish = async (items) => {
    try {
      if (items.password !== items.confirm_password) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: t("Passwords do not match"),
        });
        return;
      }

      const currentUserId = form.getFieldValue("id");
      const isUpdate = !!currentUserId;

      const isEmailExist = state.list.some(
        (user) => user.username === items.username && user.id !== currentUserId
      );

      if (isEmailExist) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: t("Email already exists"),
        });
        return;
      }

      const isTelExist = state.list.some(
        (user) => user.tel === items.tel && user.id !== currentUserId
      );

      if (isTelExist) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: t("Phone number already exists"),
        });
        return;
      }

      setState(prev => ({ ...prev, loading: true }));

      const params = new FormData();
      params.append("name", items.name || "");
      params.append("username", items.username || "");
      params.append("password", items.password || "");
      params.append("role_id", items.role_id || "");
      params.append("group_id", items.group_id || "");
      params.append("address", items.address || "");
      params.append("tel", items.tel || "");
      params.append("is_active", items.is_active !== undefined ? items.is_active : 1);

      if (!state.isSuperAdmin) {
        params.append("branch_name", profile.branch_name || "");
      } else {
        params.append("branch_name", items.branch_name || "");
      }

      if (items.profile_image?.fileList?.[0]) {
        let file = items.profile_image.fileList[0].originFileObj;

        const originalSizeMB = file.size / 1024 / 1024;

        if (originalSizeMB > 1) {
          try {
            file = await compressImage(file);
          } catch (error) {
            console.error('Compression failed:', error);
          }
        }

        params.append("upload_image", file);
      }

      if (isUpdate) {
        params.append("id", currentUserId);
      }

      const method = isUpdate ? "put" : "post";
      const res = await request("auth/register", method, params);

      setState(prev => ({ ...prev, loading: false }));

      if (res && !res.error) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: res.message || t('User saved successfully!'),
          showConfirmButton: false,
          timer: 1500
        });
        getList();
        handleCloseModal();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: res.message || t("An error occurred"),
        });
      }
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: t('Failed to save user'),
      });
    }
  };

  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
  };

  const handleChangeImageDefault = ({ fileList: newFileList }) => {
    setImageDefault(newFileList);
  };

  const handleSearch = (value) => {
    if (!value) {
      setState(prev => ({ ...prev, filteredList: state.list }));
      return;
    }

    const filtered = state.list.filter(user =>
      user.name?.toLowerCase().includes(value.toLowerCase()) ||
      user.username?.toLowerCase().includes(value.toLowerCase()) ||
      user.tel?.includes(value) ||
      user.role_name?.toLowerCase().includes(value.toLowerCase())
    );

    setState(prev => ({
      ...prev,
      filteredList: filtered
    }));
  };

  const getAvailableRoles = () => {
    if (!state.role || !Array.isArray(state.role)) {
      return [];
    }

    if (state.isSuperAdmin) {
      return state.role;
    }

    const filteredRoles = state.role.filter(role => {
      if (!role) return false;

      const roleId = parseInt(role.value || role.id);
      const roleCode = String(role.code || '').toUpperCase();

      const isAdminRole = roleId === 1 || roleId === 29 ||
        ['SUPER_ADMIN', 'ADMIN', 'BRANCH_ADMIN', 'super_admin', 'admin'].includes(roleCode);

      return !isAdminRole;
    });

    return filteredRoles;
  };

  const getUniqueRoles = () => {
    const roles = [...new Set(state.list.map(user => user.role_name).filter(Boolean))];
    return ["all", ...roles];
  };

  const exportToExcel = () => {
    Swal.fire({
      icon: 'info',
      title: 'Info',
      text: "Export function would be implemented here",
    });
  };

  // ✅ Mobile Stats Cards - Compact Version
  const renderStatsCards = () => (
    <Row gutter={[8, 8]} className="mb-4">
      <Col xs={8} sm={8} md={8}>
        <Card
          size="small"
          className="stats-card text-center"
          styles={{ body: { padding: isMobile ? '8px' : '16px' } }}
        >
          <Statistic
            title={<span style={{ fontSize: isMobile ? '11px' : '14px' }}>Total</span>}
            value={state.stats.total}
            prefix={<TeamOutlined />}
            valueStyle={{
              color: '#1890ff',
              fontSize: isMobile ? '18px' : '24px'
            }}
          />
        </Card>
      </Col>
      <Col xs={8} sm={8} md={8}>
        <Card
          size="small"
          className="stats-card text-center"
          styles={{ body: { padding: isMobile ? '8px' : '16px' } }}
        >
          <Statistic
            title={<span style={{ fontSize: isMobile ? '11px' : '14px' }}>Active</span>}
            value={state.stats.active}
            prefix={<CheckCircleOutlined />}
            valueStyle={{
              color: '#52c41a',
              fontSize: isMobile ? '18px' : '24px'
            }}
          />
        </Card>
      </Col>
      <Col xs={8} sm={8} md={8}>
        <Card
          size="small"
          className="stats-card text-center"
          styles={{ body: { padding: isMobile ? '8px' : '16px' } }}
        >
          <Statistic
            title={<span style={{ fontSize: isMobile ? '11px' : '14px' }}>Inactive</span>}
            value={state.stats.inactive}
            prefix={<CloseCircleOutlined />}
            valueStyle={{
              color: '#ff4d4f',
              fontSize: isMobile ? '18px' : '24px'
            }}
          />
        </Card>
      </Col>
    </Row>
  );

  // ✅ Mobile Filter Drawer
  const renderFilterDrawer = () => (
    <Drawer
      title="Filters"
      placement="right"
      onClose={() => setFilterDrawerVisible(false)}
      open={filterDrawerVisible}
      width={280}
    >
      <div className="space-y-4">
        <div>
          <label className="block mb-2 font-medium">Status</label>
          <Select
            value={filterStatus}
            onChange={(value) => {
              setFilterStatus(value);
              setFilterDrawerVisible(false);
            }}
            style={{ width: '100%' }}
          >
            <Select.Option value="all">All Status</Select.Option>
            <Select.Option value="active">Active</Select.Option>
            <Select.Option value="inactive">Inactive</Select.Option>
          </Select>
        </div>

        <div>
          <label className="block mb-2 font-medium">Role</label>
          <Select
            value={selectedRole}
            onChange={(value) => {
              setSelectedRole(value);
              setFilterDrawerVisible(false);
            }}
            style={{ width: '100%' }}
          >
            {getUniqueRoles().map(role => (
              <Select.Option key={role} value={role}>
                {role === "all" ? "All Roles" : role}
              </Select.Option>
            ))}
          </Select>
        </div>

        <Divider />

        <Space direction="vertical" style={{ width: '100%' }}>
          <Button
            block
            icon={<ReloadOutlined />}
            onClick={() => {
              setFilterStatus("all");
              setSelectedRole("all");
              setFilterDrawerVisible(false);
            }}
          >
            Reset Filters
          </Button>
          <Button
            block
            type="primary"
            icon={<ExportOutlined />}
            onClick={() => {
              exportToExcel();
              setFilterDrawerVisible(false);
            }}
          >
            Export Excel
          </Button>
        </Space>
      </div>
    </Drawer>
  );

  // ✅ Desktop Filters - Inline
  const renderDesktopFilters = () => (
    <Card size="small" className="mb-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <Space wrap>
          <FilterOutlined />
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            style={{ width: 130 }}
          >
            <Select.Option value="all">All Status</Select.Option>
            <Select.Option value="active">Active</Select.Option>
            <Select.Option value="inactive">Inactive</Select.Option>
          </Select>

          <Select
            value={selectedRole}
            onChange={setSelectedRole}
            style={{ width: 150 }}
          >
            {getUniqueRoles().map(role => (
              <Select.Option key={role} value={role}>
                {role === "all" ? "All Roles" : role}
              </Select.Option>
            ))}
          </Select>

          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setFilterStatus("all");
              setSelectedRole("all");
            }}
          >
            Reset
          </Button>
        </Space>

        <Button
          type="primary"
          icon={<ExportOutlined />}
          onClick={exportToExcel}
        >
          Export
        </Button>
      </div>
    </Card>
  );

  // ✅ Mobile User Card
  const renderMobileUserCard = (user) => (
    <Card
      key={user.id}
      className="mb-3"
      size="small"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {user.profile_image ? (
            <Image
              src={Config.getFullImagePath(user.profile_image)}
              alt={user.name}
              width={60}
              height={60}
              className="rounded-full object-cover"
              preview={false}
            />
          ) : (
            <Avatar
              size={60}
              icon={<UserOutlined />}
              className="bg-blue-100 text-blue-600"
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-semibold text-base mb-1 dark:text-gray-200">
                {user.name}
              </h4>
              <Tag color="blue" className="text-xs mb-1">
                {user.role_name}
              </Tag>
              <div>
                <Tag color={user.is_active ? "green" : "red"} className="text-xs">
                  {user.is_active ? "Active" : "Inactive"}
                </Tag>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 mb-3">
            <div className="flex items-center gap-1">
              <MdOutlineEmail className="flex-shrink-0" />
              <span className="truncate">{user.username}</span>
            </div>
            <div className="flex items-center gap-1">
              <MdOutlinePhone className="flex-shrink-0" />
              <span>{user.tel}</span>
            </div>
            <div className="flex items-center gap-1">
              <MdOutlineBusiness className="flex-shrink-0" />
              <span className="truncate">{user.branch_name}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {isPermission("user.update") && (
              <Button
                size="small"
                type="primary"
                icon={<EditOutlined />}
                onClick={() => onClickEdit(user)}
                block
              >
                Edit
              </Button>
            )}
            {isPermission("user.remove") && (
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => clickBtnDelete(user)}
                block
              >
                {t("delete")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  // Desktop table columns
  const columns = [
    {
      title: t("user"),
      key: "user",
      width: 250,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          {record.profile_image ? (
            <Image
              src={Config.getFullImagePath(record.profile_image)}
              alt="Profile"
              width={40}
              height={40}
              className="rounded-full object-cover"
              preview={false}
            />
          ) : (
            <Avatar
              size={40}
              icon={<UserOutlined />}
              className="bg-blue-100 text-blue-600"
            />
          )}
          <div>
            <div className="font-medium dark:text-gray-200">{record.name}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{record.username}</div>
          </div>
        </div>
      ),
    },
    {
      title: t("role"),
      align: "center",
      dataIndex: "role_name",
      key: "role",
      width: 150,
      render: (role) => <Tag color="blue">{role}</Tag>,
    },
    {
      title: t("contact"),
      align: "center",
      key: "contact",
      width: 150,
      render: (_, record) => (
        <div className="text-sm">
          <div className="text-gray-600 dark:text-gray-400">{record.tel}</div>
        </div>
      ),
    },
    {
      title: t("branch"),
      align: "center",
      dataIndex: "branch_name",
      key: "branch",
      width: 120,
    },
    {
      title: t("status"),
      dataIndex: "is_active",
      key: "status",
      width: 100,
      align: "center",
      render: (status) => (
        <Tag color={status ? "green" : "red"}>
          {status ? t("active") : t("inactive")}
        </Tag>
      ),
    },
    {
      title: t("actions"),
      key: "actions",
      width: 120,
      align: "center",
      render: (_, record) => (
        <Space size="small">
          {isPermission("user.update") && (
            <Button
              size="small"
              type="primary"
              icon={<EditOutlined />}
              onClick={() => onClickEdit(record)}
            />
          )}
          {isPermission("user.remove") && (
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => clickBtnDelete(record)}
            />
          )}
        </Space>
      ),
    },
  ];

  // ✅ Responsive Form Modal
  const FormContent = () => (
    <Form layout="vertical" form={form} onFinish={onFinish}>
      {/* Profile Image */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Form.Item
            name="profile_image"
            label={t("profile_image")}
          >
            <Upload
              name="profile_image"
              maxCount={1}
              listType="picture-card"
              fileList={imageDefault}
              onPreview={handlePreview}
              onChange={handleChangeImageDefault}
              beforeUpload={beforeUpload}
              accept="image/*"
            >
              {imageDefault.length >= 1 ? null : (
                <div>
                  <UserOutlined />
                  <div className="mt-2">{t("upload")}</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Col>
      </Row>

      {/* Name & Email */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Form.Item
            name="name"
            label={t("fullname")}
            rules={[{ required: true, message: t('please_input_name') }]}
          >
            <Input placeholder={t("fullname")} size={isMobile ? "large" : "middle"} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="username"
            label={t("email")}
            rules={[
              { required: true, message: t('please_input_email') },
              { type: 'email', message: t('please_input_valid_email') }
            ]}
          >
            <Input placeholder={t("email")} size={isMobile ? "large" : "middle"} />
          </Form.Item>
        </Col>
      </Row>

      {/* Phone & Role */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Form.Item
            name="tel"
            label={t("phone")}
            rules={[{ required: true, message: t('please_input_phone') }]}
          >
            <Input placeholder={t("phone")} size={isMobile ? "large" : "middle"} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="role_id"
            label={t("role")}
            rules={[{ required: true, message: t('Please select role!') }]}
          >
            <Select
              placeholder={t("select_role")}
              options={getAvailableRoles()}
              size={isMobile ? "large" : "middle"}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* Passwords */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Form.Item
            name="password"
            label={t("password")}
            rules={[{ required: !form.getFieldValue("id"), message: t('please_input_password') }]}
          >
            <Input.Password placeholder={t("password")} size={isMobile ? "large" : "middle"} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="confirm_password"
            label={t("confirm_password")}
            dependencies={['password']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t('passwords_not_match')));
                },
              }),
            ]}
          >
            <Input.Password placeholder={t("confirm_password")} size={isMobile ? "large" : "middle"} />
          </Form.Item>
        </Col>
      </Row>

      {/* Branch & Status */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Form.Item
            name="branch_name"
            label={t("branch")}
            rules={[{ required: true, message: t('Please select branch!') }]}
          >
            {state.isSuperAdmin ? (
              <Select
                placeholder={t("Select Branch")}
                options={config?.branch_name}
                size={isMobile ? "large" : "middle"}
              />
            ) : (
              <Input
                value={profile?.branch_name}
                disabled
                size={isMobile ? "large" : "middle"}
              />
            )}
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="is_active"
            label="Status"
            initialValue={1}
          >
            <Select size={isMobile ? "large" : "middle"}>
              <Select.Option value={1}>{t("active")}</Select.Option>
              <Select.Option value={0}>{t("inactive")}</Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      {/* Address */}
      <Form.Item
        name="address"
        label="Address"
      >
        <Input.TextArea
          rows={3}
          placeholder={t("full_address")}
          size={isMobile ? "large" : "middle"}
        />
      </Form.Item>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        <Button onClick={handleCloseModal} size={isMobile ? "large" : "middle"}>
          {t("cancel")}
        </Button>
        <Button
          type="primary"
          htmlType="submit"
          loading={state.loading}
          size={isMobile ? "large" : "middle"}
          block={isMobile}
        >
          {form.getFieldValue("id") ? t("update") : t("create")}
        </Button>
      </div>
    </Form>
  );

  return (
    <MainPage loading={state.loading}>
      <div className="min-h-screen p-2 sm:p-4 bg-gray-50 dark:bg-gray-900">
        {/* ✅ Responsive Header */}
        <div className="mb-4">
          {/* Title & New Button */}
          <div className="flex justify-between items-center gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold dark:text-white truncate">
                {t("user_management")}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                {t("user_management_subtitle")}
              </p>
            </div>

            {isPermission("user.create") && (
              <Button
                type="primary"
                onClick={handleOpenModal}
                icon={<MdOutlineCreateNewFolder />}
                size={isMobile ? "middle" : "large"}
              >
                {isMobile ? "New" : "New User"}
              </Button>
            )}
          </div>

          {/* Statistics */}
          {renderStatsCards()}

          {/* Search Bar */}
          <div className="mb-3">
            <Input.Search
              placeholder={t("search_users")}
              onSearch={handleSearch}
              allowClear
              size={isMobile ? "large" : "middle"}
              enterButton
            />
          </div>

          {/* Filters */}
          {isMobile ? (
            <>
              <Button
                block
                icon={<FilterOutlined />}
                onClick={() => setFilterDrawerVisible(true)}
                className="mb-3"
                size="large"
              >
                Filters & Export
                {(filterStatus !== "all" || selectedRole !== "all") && (
                  <Badge
                    count={
                      (filterStatus !== "all" ? 1 : 0) +
                      (selectedRole !== "all" ? 1 : 0)
                    }
                    className="ml-2"
                  />
                )}
              </Button>
              {renderFilterDrawer()}
            </>
          ) : (
            renderDesktopFilters()
          )}
        </div>

        {/* ✅ Main Content - Responsive */}
        {isMobile ? (
          /* Mobile: Card View */
          <div>
            <div className="mb-3 flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {state.filteredList.length} {t("users_found")}
              </span>
            </div>
            <div className="space-y-3">
              {state.filteredList.map(user => renderMobileUserCard(user))}
            </div>
          </div>
        ) : (
          /* Desktop: Table View */
          <Card>
            <Table
              dataSource={state.filteredList}
              columns={columns}
              rowKey="id"
              scroll={{ x: 800 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `${t("total_users_count")}: ${total}`,
                responsive: true
              }}
            />
          </Card>
        )}

        {/* ✅ Responsive Modal */}
        <Modal
          open={state.visible}
          onCancel={handleCloseModal}
          title={
            <div className="khmer-title1" style={{ color: '#e8c12f' }}>
              {form.getFieldValue("id") ? t("edit_user") : t("new_user")}
            </div>
          }
          footer={null}
          width={isMobile ? "100%" : 700}
          style={isMobile ? { top: 0, paddingBottom: 0, maxWidth: "100vw" } : {}}
          styles={isMobile ? {
            body: {
              maxHeight: 'calc(100vh - 100px)',
              overflowY: 'auto'
            }
          } : {}}
          centered={!isMobile}
        >
          <FormContent />
        </Modal>

        {/* Image Preview Modal */}
        <Modal
          open={previewOpen}
          title="Image Preview"
          footer={null}
          onCancel={() => setPreviewOpen(false)}
          centered
          width={isMobile ? "90%" : 600}
        >
          <img alt="Preview" className="w-full rounded-lg" src={previewImage} />
        </Modal>
      </div>
    </MainPage>
  );
}

export default AdminPage;