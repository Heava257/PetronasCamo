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
  Tooltip,
  Divider,
  Alert,
  Row,
  Col,
  Statistic,
  Upload,
  Badge,
  Tabs,
  Progress,
  Empty,
} from "antd";
import Swal from "sweetalert2";
import {
  UserOutlined,
  PlusOutlined,
  StopOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  CrownOutlined,
  UploadOutlined,
  SwapOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  MailOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
  FireOutlined,
  ThunderboltOutlined,
  DashboardOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Config } from "../../../util/config";
import { formatDateServer, request } from "../../../util/helper";
import { configStore } from "../../../store/configStore";
import OnlineStatusAvatar from '../../supperAdmin/OnlineStatus/OnlineStatusAvatar';
import { useAdminActivity } from "../../supperAdmin/OnlineStatus/useOnlineStatus.hook";
import { useTranslation } from "../../../locales/TranslationContext";
import { useOnlineStatus } from "../../supperAdmin/OnlineStatus/useOnlineStatus.hook";
import "./AdminManagement.fullheight.css"; // ✅ Import external CSS

dayjs.extend(relativeTime);

const { TabPane } = Tabs;
const { TextArea } = Input;

function AdminManagementPage() {
  const { t } = useTranslation();
  const { config } = configStore();
  const { stats, loading: statsLoading, refresh: refreshStats } = useOnlineStatus(15000);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [transferMode, setTransferMode] = useState(false);
  const [notifyModalVisible, setNotifyModalVisible] = useState(false);
  const [selectedAdmins, setSelectedAdmins] = useState([]);
  const [activeTab, setActiveTab] = useState("list");

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    email: '',
    tel: '',
    address: '',
    branch_name: '',
    role_id: ''
  });

  const [state, setState] = useState({
    admins: [],
    stats: {},
    selectedAdmin: null,
    inactiveAdmins: [],
    categories: {
      never_logged_in: [],
      inactive_90_plus: [],
      inactive_60_to_89: [],
      inactive_30_to_59: [],
      inactive_14_to_29: [],
      inactive_7_to_13: [],
    },
    inactiveStats: {},
    activityStats: {
      activity_breakdown: [],
      overall: {},
    },
    filter: {
      min_days: 7,
    },
    roles: [],
  });
  const [fileList, setFileList] = useState([]);

  // Responsive detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    getAdminList();
    loadRoles();
    if (activeTab === "activity") {
      loadActivityData();
    }
  }, [activeTab]);

  const loadRoles = async () => {
    try {
      const res = await request("roles/list", "get");
      if (res && res.success) {
        setState((prev) => ({
          ...prev,
          roles: res.roles || []
        }));
      }
    } catch (error) {
      console.error("Error loading roles:", error);
    }
  };

  const getAdminList = async () => {
    try {
      setLoading(true);
      const res = await request("admin/list", "get");

      if (res && res.success) {
        setState((prev) => ({
          ...prev,
          admins: res.admins || [],
          stats: res.stats || {},
        }));
      } else {
        Swal.fire({
          icon: 'error',
          title: t('error'),
          text: res.message || t('admin_load_failed')
        });
      }
    } catch (error) {
      console.error("Error loading admins:", error);
      Swal.fire({
        icon: 'error',
        title: t('error'),
        text: t('admin_load_failed')
      });
    } finally {
      setLoading(false);
    }
  };

  const loadActivityData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        getInactiveAdmins(state.filter.min_days),
        getActivityStats(),
      ]);
    } catch (error) {
      console.error("Error loading activity data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getInactiveAdmins = async (days = 7) => {
    try {
      const res = await request(`admin/inactive?days=${days}`, "get");

      if (res && res.success) {
        if (res.inactive_admins.length === 0) {
          Swal.fire({
            icon: 'info',
            title: t('info'),
            text: t('no_inactive_found')
          });
        }

        setState((prev) => ({
          ...prev,
          inactiveAdmins: res.inactive_admins || [],
          categories: res.categories || {},
          inactiveStats: res.stats || {},
          filter: res.filter || {},
        }));
      } else {
        console.error("❌ API returned error:", res);
        Swal.fire({
          icon: 'error',
          title: t('error'),
          text: res?.message || t('inactive_admin_load_failed')
        });
      }
    } catch (error) {
      console.error("❌ Error loading inactive admins:", error);
      Swal.fire({
        icon: 'error',
        title: t('error'),
        text: t('cannot_load_data') + ": " + error.message
      });
    }
  };

  const getActivityStats = async () => {
    try {
      const res = await request("admin/activity-stats", "get");

      if (res && res.success) {
        setState((prev) => ({
          ...prev,
          activityStats: {
            activity_breakdown: res.activity_breakdown || [],
            overall: res.overall || {},
          },
        }));
      } else {
        console.error("❌ Activity stats error:", res);
      }
    } catch (error) {
      console.error("❌ Error loading activity stats:", error);
    }
  };

  const handleFilterChange = (days) => {
    setState((prev) => ({
      ...prev,
      filter: { ...prev.filter, min_days: days },
    }));
    getInactiveAdmins(days);
  };

  const handleNotify = (admins) => {
    setSelectedAdmins(Array.isArray(admins) ? admins : [admins]);
    setNotifyModalVisible(true);
  };

  const handleSendNotification = async () => {
    const messageText = document.getElementById("notification-message").value;
    if (!messageText || messageText.trim() === "") {
      message.error("សូមបញ្ចូលសារជូនដំណឹង");
      return;
    }

    try {
      const adminIds = selectedAdmins.map(a => a.id);
      const res = await request("admin/notify-inactive", "post", {
        admin_ids: adminIds,
        message_text: messageText,
      });

      if (res && res.success) {
        Swal.fire({
          icon: 'success',
          title: t('success'),
          text: t('notification_sent_success'),
          timer: 1500,
          showConfirmButton: false
        });
        setNotifyModalVisible(false);
        document.getElementById("notification-message").value = "";
      } else {
        Swal.fire({
          icon: 'error',
          title: t('error'),
          text: res.message || t('notification_send_failed')
        });
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      Swal.fire({
        icon: 'error',
        title: t('error'),
        text: t('notification_send_failed')
      });
    }
  };

  const handleCreateAdmin = () => {
    setTransferMode(false);
    setFileList([]);
    setFormData({
      name: '',
      username: '',
      password: '',
      email: '',
      tel: '',
      address: '',
      branch_name: '',
      role_id: ''
    });
    setModalVisible(true);
  };

  const handleTransferAdmin = (oldAdmin) => {
    setTransferMode(true);
    setState((prev) => ({ ...prev, selectedAdmin: oldAdmin }));
    setFileList([]);
    setFormData({
      name: '',
      username: '',
      password: '',
      email: '',
      tel: '',
      address: '',
      branch_name: oldAdmin.branch_name || '',
      role_id: oldAdmin.role_id || ''
    });
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setTransferMode(false);
    setFileList([]);
    setState((prev) => ({ ...prev, selectedAdmin: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submitData = new FormData();

    submitData.append('name', formData.name);
    submitData.append('username', formData.username);
    submitData.append('password', formData.password);
    submitData.append('email', formData.email);
    submitData.append('tel', formData.tel);
    submitData.append('address', formData.address);
    submitData.append('branch_name', formData.branch_name);
    submitData.append('role_id', formData.role_id);

    if (transferMode && state.selectedAdmin) {
      submitData.append("old_admin_id", state.selectedAdmin.id);
      submitData.append("transfer_permissions", "true");
    }

    if (fileList.length > 0 && fileList[0].originFileObj) {
      submitData.append("profile_image", fileList[0].originFileObj);
    }

    try {
      setLoading(true);

      const endpoint = transferMode ? "admin/create" : "admin/create-user";
      const res = await request(endpoint, "post", submitData);

      if (res && res.success) {
        Swal.fire({
          icon: 'success',
          title: t('success'),
          text: res.message || t('created_successfully'),
          timer: 1500,
          showConfirmButton: false
        });
        handleCloseModal();
        getAdminList();

        if (activeTab === "activity") {
          loadActivityData();
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: t('error'),
          text: res.message || t('user_create_failed')
        });
      }
    } catch (error) {
      console.error("Error creating user:", error);
      Swal.fire({
        icon: 'error',
        title: t('error'),
        text: t('user_create_failed')
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (adminId) => {
    Swal.fire({
      title: "បិទគណនី Admin នេះ?",
      text: "តើអ្នកប្រាកដថាចង់បិទគណនី Admin នេះ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "បាទ/ចាស",
      cancelButtonText: "មិន"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await request("admin/deactivate", "post", { admin_id: adminId });
          if (res && res.success) {
            Swal.fire({
              icon: 'success',
              title: t('success'),
              text: res.message || t('admin_deactivated_success'),
              timer: 1500,
              showConfirmButton: false
            });
            getAdminList();
            if (activeTab === "activity") {
              loadActivityData();
            }
          } else {
            Swal.fire({
              icon: 'error',
              title: t('error'),
              text: res.message || t('admin_deactivate_failed')
            });
          }
        } catch (error) {
          console.error("Error deactivating admin:", error);
          Swal.fire({
            icon: 'error',
            title: t('error'),
            text: t('admin_deactivate_failed')
          });
        }
      }
    });
  };

  const handleReactivate = async (adminId) => {
    Swal.fire({
      title: "បើកគណនី Admin នេះ?",
      text: "តើអ្នកប្រាកដថាចង់បើកគណនី Admin នេះ?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "បាទ/ចាស",
      cancelButtonText: "មិន"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await request("admin/reactivate", "post", { admin_id: adminId });
          if (res && res.success) {
            Swal.fire({
              icon: 'success',
              title: t('success'),
              text: res.message || t('admin_reactivated_success'),
              timer: 1500,
              showConfirmButton: false
            });
            getAdminList();
            if (activeTab === "activity") {
              loadActivityData();
            }
          } else {
            Swal.fire({
              icon: 'error',
              title: t('error'),
              text: res.message || t('admin_reactivate_failed')
            });
          }
        } catch (error) {
          console.error("Error reactivating admin:", error);
          Swal.fire({
            icon: 'error',
            title: t('error'),
            text: t('admin_reactivate_failed')
          });
        }
      }
    });
  };

  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      Swal.fire({
        icon: 'error',
        title: t('error'),
        text: t('invalid_file_image')
      });
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      Swal.fire({
        icon: 'error',
        title: t('error'),
        text: t('file_too_large')
      });
      return false;
    }
    return false;
  };

  const getStatusColor = (status) => {
    const colors = {
      "Never Logged In": "red",
      "Inactive 90+ Days": "volcano",
      "Inactive 60-89 Days": "orange",
      "Inactive 30-59 Days": "gold",
      "Inactive 14-29 Days": "lime",
      "Inactive 7-13 Days": "cyan",
      "Active (< 7 days)": "green",
    };
    return colors[status] || "default";
  };

  const getUrgencyIcon = (daysInactive) => {
    if (daysInactive >= 90) return <FireOutlined style={{ color: "#ff4d4f" }} />;
    if (daysInactive >= 60) return <WarningOutlined style={{ color: "#ff7a45" }} />;
    if (daysInactive >= 30) return <ExclamationCircleOutlined style={{ color: "#ffa940" }} />;
    return <InfoCircleOutlined style={{ color: "#52c41a" }} />;
  };

  // Mobile Admin Card
  const AdminMobileCard = ({ admin }) => (
    <Card
      className="mb-2 sm:mb-3 shadow-sm hover:shadow-md transition-all duration-200"
      bodyStyle={{ padding: '10px' }}
    >
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <OnlineStatusAvatar user={admin} size={isMobile ? 45 : 55} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-bold truncate text-gray-800 dark:text-gray-200">
                {admin.name}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                {admin.username}
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                <Tag
                  color={admin.role_code === "SUPER_ADMIN" ? "gold" : "blue"}
                  className="text-xs m-0 px-1.5 py-0.5"
                >
                  {admin.role_name}
                </Tag>
                {!admin.is_active && (
                  <Tag color="red" className="text-xs m-0 px-1.5 py-0.5">
                    Inactive
                  </Tag>
                )}
              </div>
            </div>
          </div>
          <Tag
            color={admin.is_active ? "green" : "red"}
            className="text-xs px-2 py-1 shrink-0"
          >
            {admin.is_active ? "សកម្ម" : "អសកម្ម"}
          </Tag>
        </div>

        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded p-1.5 sm:p-2">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Users</p>
            <p className="font-bold text-purple-600 dark:text-purple-400 text-base sm:text-lg">
              <TeamOutlined className="mr-1" />
              {admin.managed_users_count || 0}
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-1.5 sm:p-2">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5 truncate">Branch</p>
            <p className="font-bold text-blue-600 dark:text-blue-400 text-xs sm:text-sm truncate">
              {admin.branch_name || "N/A"}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded p-1.5 sm:p-2 text-xs space-y-0.5">
          <div className="flex items-center gap-1.5 truncate">
            <span>📱</span>
            <span className="truncate text-gray-700 dark:text-gray-300">
              {admin.tel || "N/A"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <span>📧</span>
            <span className="truncate text-gray-700 dark:text-gray-300">
              {admin.email || admin.username}
            </span>
          </div>
        </div>

        <div className="pt-1.5 sm:pt-2 border-t border-gray-200 dark:border-gray-700 text-xs">
          <div className="flex justify-between mb-0.5 sm:mb-1">
            <span className="text-gray-600 dark:text-gray-400">Last Login:</span>
            <span className="font-semibold text-gray-800 dark:text-gray-200 text-right">
              {admin.last_login ? formatDateServer(admin.last_login, "DD-MM-YYYY HH:mm") : "មិនទាន់ចូល"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Created:</span>
            <span className="text-gray-500 dark:text-gray-400">
              {formatDateServer(admin.create_at, "DD-MM-YYYY")}
            </span>
          </div>
        </div>

        {admin.role_code !== "SUPER_ADMIN" && (
          <div className="flex gap-1.5 sm:gap-2 pt-1.5 sm:pt-2 border-t border-gray-200 dark:border-gray-700">
            {admin.is_active ? (
              <>
                <Button
                  type="primary"
                  icon={<SwapOutlined />}
                  size="small"
                  onClick={() => handleTransferAdmin(admin)}
                  className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
                >
                  <span className="hidden xs:inline">ផ្ទេរ</span>
                </Button>
                <Button
                  danger
                  icon={<StopOutlined />}
                  size="small"
                  className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
                  onClick={() => handleDeactivate(admin.id)}
                >
                  <span className="hidden xs:inline">បិទ</span>
                </Button>
              </>
            ) : (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                size="small"
                block
                className="text-xs sm:text-sm h-8 sm:h-9"
                onClick={() => handleReactivate(admin.id)}
              >
                បើក
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );

  // Inactive Admin Mobile Card
  const InactiveAdminMobileCard = ({ admin }) => (
    <Card
      className="mb-2 sm:mb-3 shadow-sm hover:shadow-md transition-all duration-200"
      bodyStyle={{ padding: '10px' }}
    >
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Badge
              count={getUrgencyIcon(admin.days_inactive)}
              offset={[-3, 3]}
              size="small"
              className="flex-shrink-0"
            >
              <OnlineStatusAvatar user={admin} size={isMobile ? 45 : 55} />
            </Badge>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-bold truncate text-gray-800 dark:text-gray-200">
                {admin.name}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                {admin.username}
              </p>
              <Tag
                color={getStatusColor(admin.activity_status)}
                className="text-xs mt-1 px-1.5 py-0.5"
              >
                {admin.activity_status}
              </Tag>
            </div>
          </div>
          <div className="text-center shrink-0">
            <div className={`text-xl sm:text-2xl font-bold ${admin.days_inactive >= 90 ? "text-red-600 dark:text-red-400" :
              admin.days_inactive >= 60 ? "text-orange-500 dark:text-orange-400" :
                admin.days_inactive >= 30 ? "text-yellow-600 dark:text-yellow-500" :
                  "text-blue-600 dark:text-blue-400"
              }`}>
              {admin.days_inactive}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">ថ្ងៃ</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-1.5 sm:p-2">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Logins</p>
            <p className="font-bold text-blue-600 dark:text-blue-400 text-base sm:text-lg">
              {admin.total_logins}
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded p-1.5 sm:p-2">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Users</p>
            <p className="font-bold text-purple-600 dark:text-purple-400 text-base sm:text-lg">
              <TeamOutlined className="mr-1" />
              {admin.managed_users_count || 0}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded p-1.5 sm:p-2 text-xs space-y-0.5">
          <div className="flex items-center gap-1.5 truncate">
            <span>📱</span>
            <span className="truncate text-gray-700 dark:text-gray-300">{admin.tel || "N/A"}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <span>📧</span>
            <span className="truncate text-gray-700 dark:text-gray-300">{admin.email || admin.username}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <span>🏢</span>
            <span className="truncate text-gray-700 dark:text-gray-300">{admin.branch_name || "N/A"}</span>
          </div>
        </div>

        <div className="pt-1.5 sm:pt-2 border-t border-gray-200 dark:border-gray-700 text-xs">
          <p className="text-gray-600 dark:text-gray-400 mb-1">Last Activity:</p>
          {admin.total_logins === 0 ? (
            <Tag color="red" icon={<WarningOutlined />} className="text-xs px-2 py-1">
              មិនទាន់ចូលប្រើប្រាស់
            </Tag>
          ) : (
            <>
              <p className="font-semibold text-gray-800 dark:text-gray-200">
                {dayjs(admin.last_activity).format("DD-MM-YYYY HH:mm")}
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                {dayjs(admin.last_activity).fromNow()}
              </p>
            </>
          )}
        </div>

        <Button
          type="primary"
          icon={<MailOutlined />}
          size="small"
          onClick={() => handleNotify(admin)}
          block
          className="text-xs sm:text-sm h-8 sm:h-9"
        >
          ជូនដំណឹង
        </Button>
      </div>
    </Card>
  );

  const adminColumns = [
    {
      title: "រូបភាព",
      dataIndex: "profile_image",
      key: "profile_image",
      width: 80,
      align: "center",
      render: (image, record) => (
        <OnlineStatusAvatar
          user={record}
          size={50}
          inactiveThresholdMinutes={5}
          hideBadgeAfterMinutes={60}
        />
      ),
    },
    {
      title: "ឈ្មោះ & Username",
      key: "info",
      width: 250,
      render: (_, record) => (
        <div>
          <div className="font-semibold text-base">{record.name}</div>
          <div className="text-sm text-gray-500">{record.username}</div>
          <Space size={4} className="mt-1">
            <Tag color={record.role_code === "SUPER_ADMIN" ? "gold" : "blue"}>
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
          <div>📱 {record.tel || "N/A"}</div>
          <div className="text-gray-500">📧 {record.email || record.username}</div>
        </div>
      ),
    },
    {
      title: "សាខា",
      dataIndex: "branch_name",
      key: "branch",
      width: 150,
      render: (text) => text || "N/A",
    },
    {
      title: "អ្នកប្រើប្រាស់គ្រប់គ្រង",
      key: "managed_users",
      width: 130,
      align: "center",
      render: (_, record) => (
        <Tooltip title="Number of users this admin manages">
          <Tag color="purple" className="text-base px-3 py-1">
            <TeamOutlined /> {record.managed_users_count || 0}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: "ចូលចុងក្រោយ",
      dataIndex: "last_login",
      key: "last_login",
      width: 180,
      render: (date) => (date ? formatDateServer(date, "DD-MM-YYYY HH:mm") : "មិនទាន់ចូល"),
    },
    {
      title: "បង្កើតនៅ",
      dataIndex: "create_at",
      key: "create_at",
      width: 180,
      render: (date, record) => (
        <div className="text-sm">
          <div>{formatDateServer(date, "DD-MM-YYYY")}</div>
          <div className="text-gray-500">ដោយ: {record.create_by || "System"}</div>
        </div>
      ),
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
      width: 200,
      fixed: "right",
      render: (_, record) => {
        if (record.role_code === "SUPER_ADMIN") {
          return (
            <Tag color="gold">
              <CrownOutlined /> Protected
            </Tag>
          );
        }

        return (
          <Space size="small" wrap>
            {record.is_active ? (
              <>
                <Tooltip title="ផ្ទេរសិទ្ធិទៅ Admin ថ្មី">
                  <Button
                    type="primary"
                    icon={<SwapOutlined />}
                    size="small"
                    onClick={() => handleTransferAdmin(record)}
                  >
                    ផ្ទេរ
                  </Button>
                </Tooltip>
                <Button
                  danger
                  icon={<StopOutlined />}
                  size="small"
                  onClick={() => handleDeactivate(record.id)}
                >
                  បិទ
                </Button>
              </>
            ) : (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                size="small"
                onClick={() => handleReactivate(record.id)}
              >
                បើក
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  const inactiveColumns = [
    {
      title: "Admin",
      key: "admin",
      width: 280,
      fixed: "left",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Badge count={getUrgencyIcon(record.days_inactive)} offset={[-5, 5]}>
            <OnlineStatusAvatar user={record} size={50} />
          </Badge>
          <div>
            <div className="font-semibold text-base">{record.name}</div>
            <div className="text-sm text-gray-500">{record.username}</div>
            <Space size={4} className="mt-1">
              <Tag color={getStatusColor(record.activity_status)}>
                {record.activity_status}
              </Tag>
            </Space>
          </div>
        </div>
      ),
    },
    {
      title: "ព័ត៌មានទំនាក់ទំនង",
      key: "contact",
      width: 220,
      render: (_, record) => (
        <div className="text-sm">
          <div>📱 {record.tel || "N/A"}</div>
          <div className="text-gray-500">📧 {record.email || record.username}</div>
          <div className="mt-1">🏢 {record.branch_name || "N/A"}</div>
        </div>
      ),
    },
    {
      title: "ចូលចុងក្រោយ",
      key: "last_activity",
      width: 200,
      render: (_, record) => {
        const lastActivity = dayjs(record.last_activity);
        const isNeverLoggedIn = record.total_logins === 0;

        return (
          <div>
            {isNeverLoggedIn ? (
              <Tag color="red" icon={<WarningOutlined />}>
                មិនទាន់ចូលប្រើប្រាស់
              </Tag>
            ) : (
              <>
                <div className="text-sm font-medium">
                  {lastActivity.format("DD-MM-YYYY HH:mm")}
                </div>
                <div className="text-xs text-gray-500">
                  {lastActivity.fromNow()}
                </div>
              </>
            )}
            <div className="mt-1 text-xs text-gray-400">
              Total logins: {record.total_logins}
            </div>
          </div>
        );
      },
    },
    {
      title: "Days Inactive",
      key: "days_inactive",
      width: 150,
      align: "center",
      render: (_, record) => (
        <div className="text-center">
          <div
            className={`text-2xl font-bold ${record.days_inactive >= 90
              ? "text-red-600"
              : record.days_inactive >= 60
                ? "text-orange-500"
                : record.days_inactive >= 30
                  ? "text-yellow-600"
                  : "text-blue-600"
              }`}
          >
            {record.days_inactive}
          </div>
          <div className="text-xs text-gray-500">ថ្ងៃ</div>
        </div>
      ),
      sorter: (a, b) => b.days_inactive - a.days_inactive,
      defaultSortOrder: "descend",
    },
    {
      title: "អ្នកប្រើប្រាស់",
      key: "managed_users",
      width: 120,
      align: "center",
      render: (_, record) => (
        <Tooltip title="អ្នកប្រើប្រាស់ដែល Admin នេះគ្រប់គ្រង">
          <Tag color="purple" className="text-base px-3 py-1">
            <TeamOutlined /> {record.managed_users_count || 0}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: "សកម្មភាព",
      key: "action",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <Button
          type="primary"
          icon={<MailOutlined />}
          size="small"
          onClick={() => handleNotify(record)}
          block
        >
          ជូនដំណឹង
        </Button>
      ),
    },
  ];

  const renderCategoryCard = (title, data, icon, color) => {
    if (!data || data.length === 0) {
      return (
        <Card
          className="admin-category-card shadow-sm"
          title={
            <div className="flex items-center gap-2 text-sm sm:text-base flex-wrap">
              <span style={{ color }}>{icon}</span>
              <span className="truncate">{title}</span>
              <Badge count={0} style={{ backgroundColor: "#d9d9d9" }} />
            </div>
          }
        >
          <Empty
            description={
              <span className="text-xs sm:text-sm">
                គ្មាន Admin ក្នុងប្រភេទនេះទេ<br />
                <span className="text-gray-400 text-xs">
                  សាកល្បងប្តូរ Filter ឬពិនិត្យ Tab "ទាំងអស់"
                </span>
              </span>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      );
    }

    return (
      <Card
        className="admin-category-card shadow-sm"
        title={
          <div className="flex items-center gap-2 text-sm sm:text-base flex-wrap">
            <span style={{ color }}>{icon}</span>
            <span className="truncate">{title}</span>
            <Badge count={data.length} style={{ backgroundColor: color }} />
          </div>
        }
        extra={
          <Button
            type="link"
            icon={<MailOutlined />}
            onClick={() => handleNotify(data)}
            size="small"
            className="text-xs sm:text-sm"
          >
            <span className="hidden sm:inline">ជូនដំណឹងទាំងអស់</span>
            <span className="sm:hidden">ជូនដំណឹង</span>
          </Button>
        }
      >
        {/* Desktop Table */}
        <div className="admin-table-container activity-table">
          <Table
            dataSource={data}
            columns={inactiveColumns}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 5, size: "small" }}
            scroll={{ x: 1200 }}
          />
        </div>

        {/* Mobile Cards */}
        <div className="admin-mobile-cards">
          <div className="admin-cards-inner">
            {data.slice(0, 5).map((admin) => (
              <InactiveAdminMobileCard key={admin.id} admin={admin} />
            ))}
          </div>
          {data.length > 5 && (
            <div className="text-center text-xs sm:text-sm text-gray-500 py-2">
              +{data.length - 5} more (view in All tab)
            </div>
          )}
        </div>
      </Card>
    );
  };

  const renderActivityChart = () => {
    const { activity_breakdown } = state.activityStats;

    if (!activity_breakdown || activity_breakdown.length === 0) {
      return <Empty description="មិនមានទិន្នន័យ" />;
    }

    const total = activity_breakdown.reduce((sum, item) => sum + item.count, 0);

    return (
      <div className="space-y-3 sm:space-y-4">
        {activity_breakdown.map((item, index) => {
          const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : 0;
          const color = getStatusColor(item.period);

          return (
            <div key={index} className="p-2 sm:p-3 md:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex justify-between mb-1 sm:mb-2 text-xs sm:text-sm">
                <span className="font-medium truncate flex-1 text-gray-700 dark:text-gray-300">
                  {item.period}
                </span>
                <span className="font-bold text-gray-800 dark:text-gray-200 ml-2">
                  {item.count} Admins
                </span>
              </div>
              <Progress
                percent={parseFloat(percentage)}
                strokeColor={
                  color === "red" ? "#ff4d4f" :
                    color === "volcano" ? "#ff7a45" :
                      color === "orange" ? "#ffa940" :
                        color === "gold" ? "#ffc53d" :
                          color === "lime" ? "#a0d911" :
                            color === "cyan" ? "#13c2c2" :
                              "#52c41a"
                }
                format={() => `${percentage}%`}
                strokeWidth={isMobile ? 8 : 10}
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="admin-management-root">
      <div className="admin-content-wrapper">

        {/* Header with gradient */}
        <Card className="mb-3 sm:mb-4 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 border-0">
          <div className="flex flex-col gap-2 sm:gap-3 md:gap-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-white text-base sm:text-xl md:text-2xl lg:text-3xl font-bold flex items-center gap-1.5 sm:gap-2 flex-wrap mb-0.5 sm:mb-1">
                  <CrownOutlined className="text-base sm:text-lg md:text-xl lg:text-2xl" />
                  <span className="break-words">គ្រប់គ្រងអ្នកគ្រប់គ្រង</span>
                  <span className="hidden md:inline text-sm sm:text-base lg:text-lg">(Admin Management)</span>
                </h1>
                <p className="text-white text-xs sm:text-sm opacity-90">
                  សម្រាប់ Super Admin តែប៉ុណ្ណោះ
                </p>
              </div>
              <Space className="w-full sm:w-auto flex-wrap justify-end" size={[6, 6]}>
                <Button
                  type="default"
                  size={isMobile ? "middle" : "large"}
                  icon={<ReloadOutlined />}
                  onClick={() => activeTab === "list" ? getAdminList() : loadActivityData()}
                  loading={loading}
                  className="bg-white text-blue-600 border-0 hover:bg-gray-100 flex-1 sm:flex-none min-w-0 text-xs sm:text-sm"
                >
                  <span className="hidden xs:inline">ផ្ទុកឡើងវិញ</span>
                </Button>
                <Button
                  type="primary"
                  size={isMobile ? "middle" : "large"}
                  icon={<PlusOutlined />}
                  onClick={handleCreateAdmin}
                  className="bg-white text-blue-600 border-0 hover:bg-gray-100 flex-1 sm:flex-none min-w-0 text-xs sm:text-sm"
                >
                  <span className="hidden xs:inline">បង្កើត</span>
                  <span className="xs:hidden">+</span>
                </Button>
              </Space>
            </div>
          </div>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
          {activeTab === "list" ? (
            <>
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <Statistic
                  title={
                    <span className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
                      Admin សរុប
                    </span>
                  }
                  value={state.stats.total_admins || 0}
                  prefix={<UserOutlined className="text-sm sm:text-base md:text-lg" />}
                  valueStyle={{
                    color: "#3f8600",
                    fontSize: "clamp(1.1rem, 3.5vw, 1.5rem)",
                    fontWeight: 700
                  }}
                />
              </Card>
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <Statistic
                  title={
                    <span className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
                      សកម្ម
                    </span>
                  }
                  value={state.stats.active_admins || 0}
                  prefix={<CheckCircleOutlined className="text-sm sm:text-base md:text-lg" />}
                  valueStyle={{
                    color: "#52c41a",
                    fontSize: "clamp(1.1rem, 3.5vw, 1.5rem)",
                    fontWeight: 700
                  }}
                />
              </Card>
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <Statistic
                  title={
                    <span className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
                      អសកម្ម
                    </span>
                  }
                  value={state.stats.inactive_admins || 0}
                  prefix={<StopOutlined className="text-sm sm:text-base md:text-lg" />}
                  valueStyle={{
                    color: "#cf1322",
                    fontSize: "clamp(1.1rem, 3.5vw, 1.5rem)",
                    fontWeight: 700
                  }}
                />
              </Card>
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <Statistic
                  title={
                    <span className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
                      Super
                    </span>
                  }
                  value={state.stats.super_admins || 0}
                  prefix={<CrownOutlined className="text-sm sm:text-base md:text-lg" />}
                  valueStyle={{
                    color: "#faad14",
                    fontSize: "clamp(1.1rem, 3.5vw, 1.5rem)",
                    fontWeight: 700
                  }}
                />
              </Card>
            </>
          ) : (
            <>
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <Statistic
                  title={
                    <span className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 truncate">
                      មិនសកម្ម
                    </span>
                  }
                  value={state.inactiveStats.total_inactive || 0}
                  prefix={<WarningOutlined className="text-sm sm:text-base md:text-lg" />}
                  valueStyle={{
                    color: "#ff4d4f",
                    fontSize: "clamp(1.1rem, 3.5vw, 1.5rem)",
                    fontWeight: 700
                  }}
                />
              </Card>
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <Statistic
                  title={
                    <span className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 truncate">
                      មិនចូល
                    </span>
                  }
                  value={state.inactiveStats.never_logged_in || 0}
                  prefix={<ExclamationCircleOutlined className="text-sm sm:text-base md:text-lg" />}
                  valueStyle={{
                    color: "#ff7a45",
                    fontSize: "clamp(1.1rem, 3.5vw, 1.5rem)",
                    fontWeight: 700
                  }}
                />
              </Card>
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <Statistic
                  title={
                    <span className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 truncate">
                      90+ Days
                    </span>
                  }
                  value={state.inactiveStats.inactive_90_plus || 0}
                  prefix={<FireOutlined className="text-sm sm:text-base md:text-lg" />}
                  valueStyle={{
                    color: "#fa8c16",
                    fontSize: "clamp(1.1rem, 3.5vw, 1.5rem)",
                    fontWeight: 700
                  }}
                />
              </Card>
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <Statistic
                  title={
                    <span className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 truncate">
                      Users
                    </span>
                  }
                  value={state.inactiveStats.total_managed_users || 0}
                  prefix={<TeamOutlined className="text-sm sm:text-base md:text-lg" />}
                  valueStyle={{
                    color: "#722ed1",
                    fontSize: "clamp(1.1rem, 3.5vw, 1.5rem)",
                    fontWeight: 700
                  }}
                />
              </Card>
            </>
          )}
        </div>

        {/* Main Content Card */}
        <Card className="admin-main-card">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            className="admin-tabs-container"
            size={isMobile ? 'small' : 'default'}
          >
            <TabPane
              tab={
                <span className="text-xs sm:text-sm flex items-center gap-1">
                  <DashboardOutlined />
                  <span className="hidden xs:inline">បញ្ជី</span>
                </span>
              }
              key="list"
            >
              {/* Desktop Table */}
              <div className="admin-table-container">
                <Table
                  loading={loading}
                  dataSource={state.admins}
                  columns={adminColumns}
                  rowKey="id"
                  scroll={{ x: 1400 }}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `ចំនួនសរុប ${total} Admin`,
                    size: "small",
                    responsive: true
                  }}
                  size="small"
                />
              </div>

              {/* Mobile Cards */}
              <div className="admin-mobile-cards">
                {loading ? (
                  <div className="admin-loading-container">
                    <div className="text-center py-8 text-sm">Loading...</div>
                  </div>
                ) : (
                  <div className="admin-cards-inner">
                    {state.admins.map((admin) => (
                      <AdminMobileCard key={admin.id} admin={admin} />
                    ))}
                  </div>
                )}
              </div>
            </TabPane>

            <TabPane
              tab={
                <span className="text-xs sm:text-sm flex items-center gap-1">
                  <ClockCircleOutlined />
                  <span className="hidden xs:inline">Activity</span>
                </span>
              }
              key="activity"
            >
              {/* Filter */}
              <Card
                className="mb-3 sm:mb-4 bg-blue-50 dark:bg-blue-900/20"
                bodyStyle={{ padding: isMobile ? '10px' : '12px' }}
              >
                <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-2 xs:gap-3">
                  <Space className="flex-wrap text-xs sm:text-sm" size={[6, 6]}>
                    <CalendarOutlined className="text-blue-600 dark:text-blue-400" />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Filter:</span>
                    <Select
                      value={state.filter.min_days}
                      onChange={handleFilterChange}
                      style={{ width: isMobile ? 100 : 120 }}
                      size={isMobile ? "small" : "middle"}
                      options={[
                        { label: "7+ Days", value: 7 },
                        { label: "14+ Days", value: 14 },
                        { label: "30+ Days", value: 30 },
                        { label: "60+ Days", value: 60 },
                        { label: "90+ Days", value: 90 },
                      ]}
                    />
                  </Space>
                  <Tag color="blue" className="text-xs shrink-0">
                    {dayjs().format("DD-MM HH:mm")}
                  </Tag>
                </div>
              </Card>

              <Tabs defaultActiveKey="categories" size={isMobile ? 'small' : 'default'} className="admin-activity-tabs">
                <TabPane
                  tab={
                    <span className="text-xs sm:text-sm flex items-center gap-1">
                      <ThunderboltOutlined />
                      <span className="hidden xs:inline">ប្រភេទ</span>
                    </span>
                  }
                  key="categories"
                >
                  <div className="admin-category-section">
                    {renderCategoryCard(
                      "មិនទាន់ចូលប្រើប្រាស់",
                      state.categories.never_logged_in,
                      <ExclamationCircleOutlined />,
                      "#ff4d4f"
                    )}

                    {renderCategoryCard(
                      "Inactive 90+ Days",
                      state.categories.inactive_90_plus,
                      <FireOutlined />,
                      "#ff7a45"
                    )}

                    {renderCategoryCard(
                      "Inactive 60-89 Days",
                      state.categories.inactive_60_to_89,
                      <WarningOutlined />,
                      "#ffa940"
                    )}

                    {renderCategoryCard(
                      "Inactive 30-59 Days",
                      state.categories.inactive_30_to_59,
                      <ClockCircleOutlined />,
                      "#ffc53d"
                    )}

                    {renderCategoryCard(
                      "Inactive 14-29 Days",
                      state.categories.inactive_14_to_29,
                      <InfoCircleOutlined />,
                      "#a0d911"
                    )}

                    {renderCategoryCard(
                      "Inactive 7-13 Days",
                      state.categories.inactive_7_to_13,
                      <CheckCircleOutlined />,
                      "#13c2c2"
                    )}
                  </div>
                </TabPane>

                <TabPane
                  tab={
                    <span className="text-xs sm:text-sm flex items-center gap-1">
                      <UserOutlined />
                      <span className="hidden xs:inline">ទាំងអស់</span>
                    </span>
                  }
                  key="all"
                >
                  {/* Desktop Table */}
                  <div className="admin-table-container activity-table">
                    <Table
                      loading={loading}
                      dataSource={state.inactiveAdmins}
                      columns={inactiveColumns}
                      rowKey="id"
                      scroll={{ x: 1200 }}
                      pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `ចំនួនសរុប ${total} Admins`,
                        size: "small",
                        responsive: true
                      }}
                      size="small"
                    />
                  </div>

                  {/* Mobile Cards */}
                  <div className="admin-mobile-cards">
                    {loading ? (
                      <div className="admin-loading-container">
                        <div className="text-center py-8 text-sm">Loading...</div>
                      </div>
                    ) : (
                      <div className="admin-cards-inner">
                        {state.inactiveAdmins.map((admin) => (
                          <InactiveAdminMobileCard key={admin.id} admin={admin} />
                        ))}
                      </div>
                    )}
                  </div>
                </TabPane>

                <TabPane
                  tab={
                    <span className="text-xs sm:text-sm flex items-center gap-1">
                      <InfoCircleOutlined />
                      <span className="hidden xs:inline">ស្ថិតិ</span>
                    </span>
                  }
                  key="stats"
                >
                  <div className="admin-stats-grid">
                    <Card
                      title={<span className="text-sm sm:text-base">Activity Distribution</span>}
                      className="admin-stats-card shadow-sm"
                      bodyStyle={{ padding: isMobile ? '10px' : '16px' }}
                    >
                      {renderActivityChart()}
                    </Card>
                    <Card
                      title={<span className="text-sm sm:text-base">Overall Statistics</span>}
                      className="admin-stats-card shadow-sm"
                      bodyStyle={{ padding: isMobile ? '10px' : '16px' }}
                    >
                      <div className="space-y-2 sm:space-y-3 md:space-y-4">
                        <Statistic
                          title={<span className="text-xs sm:text-sm">Total Active Admins</span>}
                          value={state.activityStats.overall.total_active_admins || 0}
                          prefix={<CheckCircleOutlined />}
                          valueStyle={{ fontSize: "clamp(1.1rem, 3.5vw, 1.5rem)" }}
                        />
                        <Divider className="my-2" />
                        <Statistic
                          title={<span className="text-xs sm:text-sm">Never Logged In</span>}
                          value={state.activityStats.overall.never_logged_in || 0}
                          prefix={<WarningOutlined />}
                          valueStyle={{ color: "#ff4d4f", fontSize: "clamp(1.1rem, 3.5vw, 1.5rem)" }}
                        />
                        <Divider className="my-2" />
                        <Statistic
                          title={<span className="text-xs sm:text-sm">Inactive 30+ Days</span>}
                          value={state.activityStats.overall.inactive_30_plus || 0}
                          prefix={<ClockCircleOutlined />}
                          valueStyle={{ color: "#fa8c16", fontSize: "clamp(1.1rem, 3.5vw, 1.5rem)" }}
                        />
                        <Divider className="my-2" />
                        <Statistic
                          title={<span className="text-xs sm:text-sm">Active Last Week</span>}
                          value={state.activityStats.overall.active_last_week || 0}
                          prefix={<ThunderboltOutlined />}
                          valueStyle={{ color: "#52c41a", fontSize: "clamp(1.1rem, 3.5vw, 1.5rem)" }}
                        />
                      </div>
                    </Card>
                  </div>
                </TabPane>
              </Tabs>
            </TabPane>
          </Tabs>
        </Card>

        {/* Create/Transfer Modal */}
        <Modal
          open={modalVisible}
          onCancel={handleCloseModal}
          footer={null}
          width={isMobile ? '95%' : 700}
          style={isMobile ? { top: 10 } : {}}
          title={
            <div className="text-sm sm:text-base md:text-xl font-bold">
              {transferMode ? (
                <>
                  <SwapOutlined className="text-blue-600" /> ផ្ទេរសិទ្ធិទៅ Admin ថ្មី
                </>
              ) : (
                <>
                  <PlusOutlined className="text-green-600" /> បង្កើត User ថ្មី
                </>
              )}
            </div>
          }
        >
          {transferMode && state.selectedAdmin && (
            <Alert
              message="ផ្ទេរសិទ្ធិពី Admin ចាស់"
              description={
                <div className="text-xs sm:text-sm">
                  <p>
                    <strong>Admin ចាស់:</strong> {state.selectedAdmin.name} ({state.selectedAdmin.username})
                  </p>
                  <p>
                    <strong>អ្នកប្រើប្រាស់គ្រប់គ្រង:</strong> {state.selectedAdmin.managed_users_count || 0} នាក់
                  </p>
                  <p className="text-red-600 mt-2">
                    ⚠️ គណនី Admin ចាស់នឹងត្រូវបិទស្វ័យប្រវត្តិបន្ទាប់ពីផ្ទេរ
                  </p>
                </div>
              }
              type="info"
              showIcon
              className="mb-3 sm:mb-4"
            />
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
              <div className="space-y-1 sm:space-y-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  ឈ្មោះពេញ *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ឈ្មោះពេញ"
                  required
                  size={isMobile ? "middle" : "large"}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  Username *
                </label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Username"
                  required
                  size={isMobile ? "middle" : "large"}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  ពាក្យសម្ងាត់ *
                </label>
                <Input.Password
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="ពាក្យសម្ងាត់"
                  required
                  minLength={6}
                  size={isMobile ? "middle" : "large"}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  type="email"
                  placeholder="Email"
                  size={isMobile ? "middle" : "large"}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  ទូរស័ព្ទ
                </label>
                <Input
                  value={formData.tel}
                  onChange={(e) => setFormData({ ...formData, tel: e.target.value })}
                  placeholder="លេខទូរស័ព្ទ"
                  size={isMobile ? "middle" : "large"}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  សាខា *
                </label>
                <Select
                  value={formData.branch_name}
                  onChange={(value) => setFormData({ ...formData, branch_name: value })}
                  placeholder="Select Branch"
                  options={config?.branch_name}
                  className="w-full"
                  size={isMobile ? "middle" : "large"}
                />
              </div>
            </div>

            <div className="mt-2 sm:mt-3 md:mt-4 space-y-1 sm:space-y-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                Role *
                {transferMode && (
                  <span className="text-gray-500 ml-2 text-xs">(ADMIN role for transfer)</span>
                )}
              </label>
              <Select
                value={formData.role_id}
                onChange={(value) => setFormData({ ...formData, role_id: value })}
                placeholder="Select Role"
                className="w-full"
                size={isMobile ? "middle" : "large"}
                required
                disabled={transferMode}
              >
                {state.roles.map((role) => (
                  <Select.Option key={role.id} value={role.id}>
                    <Space>
                      <span className="text-xs sm:text-sm">{role.name}</span>
                      <Tag
                        color={role.code === 'SUPER_ADMIN' ? 'gold' : role.code === 'ADMIN' ? 'blue' : 'default'}
                        className="text-xs"
                      >
                        {role.code}
                      </Tag>
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </div>

            <div className="mt-2 sm:mt-3 md:mt-4 space-y-1 sm:space-y-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                អាសយដ្ឋាន
              </label>
              <TextArea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                placeholder="អាសយដ្ឋាន"
                className="text-sm"
              />
            </div>

            <div className="mt-2 sm:mt-3 md:mt-4 space-y-1 sm:space-y-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                រូបភាព Profile
              </label>
              <Upload
                listType="picture-card"
                fileList={fileList}
                onChange={handleUploadChange}
                beforeUpload={beforeUpload}
                maxCount={1}
              >
                {fileList.length === 0 && (
                  <div className="text-xs sm:text-sm">
                    <UploadOutlined />
                    <div className="mt-1">Upload</div>
                  </div>
                )}
              </Upload>
            </div>

            <Divider className="my-2 sm:my-3" />

            <div className="flex flex-col xs:flex-row justify-end gap-2">
              <Button
                onClick={handleCloseModal}
                size={isMobile ? "middle" : "large"}
                className="text-xs sm:text-sm"
              >
                បោះបង់
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size={isMobile ? "middle" : "large"}
                className="text-xs sm:text-sm"
              >
                {transferMode ? "ផ្ទេរ & បង្កើត Admin" : "បង្កើត User"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Notification Modal */}
        <Modal
          open={notifyModalVisible}
          onCancel={() => {
            setNotifyModalVisible(false);
            document.getElementById("notification-message").value = "";
          }}
          footer={null}
          width={isMobile ? '95%' : 600}
          style={isMobile ? { top: 10 } : {}}
          title={
            <div className="text-sm sm:text-base md:text-xl font-bold">
              <MailOutlined className="text-blue-600" /> ផ្ញើការជូនដំណឹង
            </div>
          }
        >
          <Alert
            message={`អ្នកកំពុងផ្ញើការជូនដំណឹងទៅកាន់ ${selectedAdmins.length} Admin${selectedAdmins.length > 1 ? 's' : ''}`}
            description={
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedAdmins.map((admin) => (
                  <Tag key={admin.id} color="blue" className="text-xs mb-1">
                    {admin.name}
                  </Tag>
                ))}
              </div>
            }
            type="info"
            showIcon
            className="mb-3 sm:mb-4"
          />

          <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-4">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
              សារជូនដំណឹង *
            </label>
            <TextArea
              id="notification-message"
              rows={isMobile ? 4 : 6}
              placeholder="សរសេរសារជូនដំណឹងទៅកាន់ Admin ដែលមិនសកម្ម..."
              className="text-sm"
            />
          </div>

          <div className="flex flex-col xs:flex-row justify-end gap-2">
            <Button
              onClick={() => setNotifyModalVisible(false)}
              size={isMobile ? "middle" : "large"}
              className="text-xs sm:text-sm"
            >
              បោះបង់
            </Button>
            <Button
              type="primary"
              onClick={handleSendNotification}
              icon={<MailOutlined />}
              size={isMobile ? "middle" : "large"}
              className="text-xs sm:text-sm"
            >
              ផ្ញើការជូនដំណឹង
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  );
}

export default AdminManagementPage;