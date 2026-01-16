import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Tag,
  Avatar,
  Statistic,
  Row,
  Col,
  Select,
  Space,
  Button,
  Badge,
  Tooltip,
  Alert,
  Tabs,
  message,
} from "antd";
import {
  UserOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
  BellOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { request, formatDateServer } from "../../../util/helper";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Config } from "../../../util/config";
import OnlineStatusAvatar from '../OnlineStatus/OnlineStatusAvatar'; // ✅ ADD THIS IMPORT

dayjs.extend(relativeTime);
function InactiveAdminsReport() {
  const [loading, setLoading] = useState(false);
  const [daysFilter, setDaysFilter] = useState(7);  // ✅ Default 7 days
  const [state, setState] = useState({
    inactive_admins: [],
    categories: {},
    stats: {},
  });

  useEffect(() => {
    getInactiveAdmins();
  }, [daysFilter]);

  const getInactiveAdmins = async () => {
    try {
      setLoading(true);
      const res = await request(`admin/inactive?days=${daysFilter}`, "get");

      if (res && res.success) {
        setState({
          inactive_admins: res.inactive_admins || [],
          categories: res.categories || {},
          stats: res.stats || {},
        });
      } else {
        message.error(res.message || "Failed to load inactive admins");
      }
    } catch (error) {
      console.error("Error loading inactive admins:", error);
      message.error("Failed to load inactive admins");
    } finally {
      setLoading(false);
    }
  };

  const getActivityColor = (days) => {
    if (days >= 90) return "red";
    if (days >= 60) return "orange";
    if (days >= 30) return "gold";
    if (days >= 14) return "blue";
    return "green";
  };

  const getActivityIcon = (days) => {
    if (days >= 90) return "🔴";
    if (days >= 60) return "🟠";
    if (days >= 30) return "🟡";
    if (days >= 14) return "🔵";
    return "🟢";
  };

  const columns = [
    {
      title: "រូបភាព",
      dataIndex: "profile_image",
      key: "profile_image",
      width: 80,
      align: "center",
      render: (image, record) => (
        <Badge
          count={getActivityIcon(record.days_inactive)}
          offset={[-5, 5]}
        >
          <OnlineStatusAvatar user={record} size={50} showBadge={false} />
        </Badge>
      ),
    },
    {
      title: "Activity Status",
      dataIndex: "activity_status",
      key: "activity_status",
      width: 180,
      render: (status) => {
        const colors = {
          "Never Logged In": "red",
          "Inactive 180+ Days (6+ months)": "red",
          "Inactive 90-179 Days (3-6 months)": "red",
          "Inactive 60-89 Days (2-3 months)": "orange",
          "Inactive 30-59 Days (1-2 months)": "gold",
          "Inactive 14-29 Days": "blue",
          "Inactive 7-13 Days": "cyan",
          "Inactive 3-6 Days": "green",
          "Inactive 2-3 Days": "lime",
        };
        return (
          <Tag color={colors[status] || "default"} className="px-2 sm:px-3 py-1 text-xs sm:text-sm">
            {status}
          </Tag>
        );
      },
    },
    {
      title: "ឈ្មោះ & Username",
      key: "info",
      width: 250,
      render: (_, record) => (
        <div>
          <div className="font-semibold text-sm sm:text-base">{record.name}</div>
          <div className="text-xs sm:text-sm text-gray-500">{record.username}</div>
          <Space size={4} className="mt-1 flex-wrap">
            <Tag color={record.role_code === "SUPER_ADMIN" ? "gold" : "blue"} className="text-xs">
              {record.role_name}
            </Tag>
            {record.total_logins === 0 && (
              <Tag color="red" icon={<WarningOutlined />} className="text-xs">
                Never
              </Tag>
            )}
          </Space>
        </div>
      ),
    },
    {
      title: "ទំនាក់ទំនង",
      key: "contact",
      width: 200,
      render: (_, record) => (
        <div className="text-xs sm:text-sm">
          <div className="truncate">📱 {record.tel || "N/A"}</div>
          <div className="truncate">📧 {record.email || record.username}</div>
          <div className="truncate">🏢 {record.branch_name || "N/A"}</div>
        </div>
      ),
    },
    {
      title: "Last Activity",
      key: "last_activity",
      width: 200,
      render: (_, record) => (
        <div>
          <div className="font-semibold text-xs sm:text-sm">
            {record.total_logins === 0 ? (
              <Tag color="red" className="text-xs">Never</Tag>
            ) : (
              formatDateServer(record.last_activity, "DD-MM-YYYY HH:mm")
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Created: {formatDateServer(record.created_date, "DD-MM-YYYY")}
          </div>
        </div>
      ),
    },
    {
      title: "Days Inactive",
      dataIndex: "days_inactive",
      key: "days_inactive",
      width: 150,
      align: "center",
      sorter: (a, b) => b.days_inactive - a.days_inactive,
      render: (days) => (
        <Tag
          color={getActivityColor(days)}
          className="text-sm sm:text-lg px-2 sm:px-4 py-1 sm:py-2 font-bold"
        >
          {days}d
        </Tag>
      ),
    },
    {
      title: "Activity Status",
      dataIndex: "activity_status",
      key: "activity_status",
      width: 180,
      render: (status) => {
        const colors = {
          "Never Logged In": "red",
          "Inactive 90+ Days": "red",
          "Inactive 60-89 Days": "orange",
          "Inactive 30-59 Days": "gold",
          "Inactive 14-29 Days": "blue",
          "Inactive 7-13 Days": "cyan",
        };
        return (
          <Tag color={colors[status] || "default"} className="px-2 sm:px-3 py-1 text-xs sm:text-sm">
            {status}
          </Tag>
        );
      },
    },
    {
      title: "Total Logins",
      dataIndex: "total_logins",
      key: "total_logins",
      width: 120,
      align: "center",
      render: (count) => (
        <Badge
          count={count}
          showZero
          style={{ backgroundColor: count === 0 ? "#ff4d4f" : "#52c41a" }}
        />
      ),
    },
    {
      title: "Managed Users",
      dataIndex: "managed_users_count",
      key: "managed_users_count",
      width: 140,
      align: "center",
      render: (count) => (
        <Tooltip title="Number of users this admin manages">
          <Tag color="purple" className="px-2 sm:px-3 py-1 text-xs sm:text-sm">
            <UserOutlined /> {count || 0}
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
        <Space direction="vertical" size="small" className="w-full">
          <Button
            type="primary"
            danger
            size="small"
            icon={<StopOutlined />}
            onClick={() => handleDeactivate(record.id)}
            className="w-full"
          >
            <span className="hidden sm:inline">Deactivate</span>
          </Button>
          <Button
            size="small"
            icon={<BellOutlined />}
            onClick={() => handleNotify([record.id])}
            className="w-full"
          >
            <span className="hidden sm:inline">Notify</span>
          </Button>
        </Space>
      ),
    },
  ];

  const handleDeactivate = (adminId) => {
    message.info(`Deactivating admin ${adminId}`);
  };

  const handleNotify = (adminIds) => {
    message.info(`Sending notification to ${adminIds.length} admin(s)`);
  };

  const CategoryCard = ({ title, data, icon, color }) => (
    <Card className="mb-3 sm:mb-4 shadow-md hover:shadow-lg transition-shadow" bodyStyle={{ padding: "12px 16px" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            style={{ fontSize: "20px", background: color }}
            className="p-1.5 sm:p-2 rounded-lg"
          >
            {icon}
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold">{title}</div>
            <div className="text-xs sm:text-sm text-gray-500">{data.length} admins</div>
          </div>
        </div>
        <Badge count={data.length} showZero style={{ backgroundColor: color }} />
      </div>

      {data.length > 0 && (
        <div className="space-y-2">
          {data.slice(0, 3).map((admin) => (
            <div
              key={admin.id}
              className="flex items-center gap-2 sm:gap-3 p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
            >
              {/* ✅✅✅ REPLACE Avatar with OnlineStatusAvatar ✅✅✅ */}
              <OnlineStatusAvatar
                user={admin}
                size={window.innerWidth < 640 ? 35 : 40}
                showBadge={true}
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{admin.name}</div>
                <div className="text-xs text-gray-500 truncate">{admin.username}</div>
              </div>
              <Tag color={getActivityColor(admin.days_inactive)} className="shrink-0 text-xs">
                {admin.days_inactive}d
              </Tag>
            </div>
          ))}
          {data.length > 3 && (
            <div className="text-center text-xs sm:text-sm text-gray-500 pt-1">
              +{data.length - 3} more
            </div>
          )}
        </div>
      )}
    </Card>
  );

  // Mobile Admin Card Component
  const AdminMobileCard = ({ admin, index }) => (
    <Card
      className="mb-3 shadow-md hover:shadow-lg transition-shadow"
      bodyStyle={{ padding: '12px' }}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Badge
              count={getActivityIcon(admin.days_inactive)}
              offset={[-3, 3]}
              size="small"
            >
              {/* ✅✅✅ REPLACE Avatar with OnlineStatusAvatar ✅✅✅ */}
              <OnlineStatusAvatar user={admin} size={50} showBadge={false} />
            </Badge>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold truncate">{admin.name}</h3>
              <p className="text-xs text-gray-500 truncate">{admin.username}</p>
              <Space size={4} className="mt-1 flex-wrap">
                <Tag color={admin.role_code === "SUPER_ADMIN" ? "gold" : "blue"} className="text-xs m-0">
                  {admin.role_name}
                </Tag>
                {admin.total_logins === 0 && (
                  <Tag color="red" icon={<WarningOutlined />} className="text-xs m-0">
                    Never
                  </Tag>
                )}
              </Space>
            </div>
          </div>
          <Tag
            color={getActivityColor(admin.days_inactive)}
            className="text-base px-2 py-1 font-bold shrink-0"
          >
            {admin.days_inactive}d
          </Tag>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-blue-50 rounded p-2">
            <p className="text-gray-600 mb-1">Total Logins</p>
            <p className="font-bold text-blue-600 text-lg">{admin.total_logins}</p>
          </div>
          <div className="bg-purple-50 rounded p-2">
            <p className="text-gray-600 mb-1">Managed Users</p>
            <p className="font-bold text-purple-600 text-lg">{admin.managed_users_count || 0}</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded p-2 text-xs space-y-1">
          <div className="flex items-center gap-1">
            <span>📱</span>
            <span className="truncate">{admin.tel || "N/A"}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>📧</span>
            <span className="truncate">{admin.email || admin.username}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🏢</span>
            <span className="truncate">{admin.branch_name || "N/A"}</span>
          </div>
        </div>

        <div className="pt-2 border-t text-xs">
          <p className="text-gray-600">Last Activity:</p>
          <p className="font-semibold">
            {admin.total_logins === 0 ? (
              <Tag color="red" className="text-xs">Never Logged In</Tag>
            ) : (
              formatDateServer(admin.last_activity, "DD-MM-YYYY HH:mm")
            )}
          </p>
          <p className="text-gray-500 mt-1">
            Created: {formatDateServer(admin.created_date, "DD-MM-YYYY")}
          </p>
        </div>

        <div className="pt-2 border-t">
          <Tag color={
            admin.activity_status === "Never Logged In" ? "red" :
              admin.activity_status === "Inactive 90+ Days" ? "red" :
                admin.activity_status === "Inactive 60-89 Days" ? "orange" :
                  admin.activity_status === "Inactive 30-59 Days" ? "gold" : "blue"
          } className="text-xs w-full text-center">
            {admin.activity_status}
          </Tag>
        </div>

        <div className="flex gap-2">
          <Button
            type="primary"
            danger
            size="small"
            icon={<StopOutlined />}
            onClick={() => handleDeactivate(admin.id)}
            className="flex-1"
          >
            Deactivate
          </Button>
          <Button
            size="small"
            icon={<BellOutlined />}
            onClick={() => handleNotify([admin.id])}
            className="flex-1"
          >
            Notify
          </Button>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
        {/* Header */}
        <Card className="mb-4 shadow-lg bg-gradient-to-r from-orange-600 to-red-600 border-0">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-white text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2 sm:gap-3 mb-1">
                  <ClockCircleOutlined className="text-lg sm:text-xl lg:text-2xl" />
                  <span className="break-words">Inactive Admins Report</span>
                </h1>
                <p className="text-white text-xs sm:text-sm opacity-90">
                  Admin ដែល Active តែមិនបានចូល System
                </p>
              </div>
              <Button
                type="primary"
                size="middle"
                icon={<ReloadOutlined />}
                onClick={getInactiveAdmins}
                loading={loading}
                className="bg-white text-orange-600 border-0 w-full sm:w-auto"
              >
                Refresh
              </Button>
            </div>

            {/* ✅✅✅ UPDATED FILTER OPTIONS ✅✅✅ */}
            <Select
              value={daysFilter}
              onChange={setDaysFilter}
              className="w-full sm:w-64"
              size="middle"
            >
              <Select.Option value={2}>2+ ថ្ងៃ / 2+ Days</Select.Option>
              <Select.Option value={3}>3+ ថ្ងៃ / 3+ Days</Select.Option>
              <Select.Option value={7}>7+ ថ្ងៃ / 7+ Days</Select.Option>
              <Select.Option value={14}>14+ ថ្ងៃ / 14+ Days</Select.Option>
              <Select.Option value={30}>30+ ថ្ងៃ / 1+ ខែ</Select.Option>
              <Select.Option value={60}>60+ ថ្ងៃ / 2+ ខែ</Select.Option>
              <Select.Option value={90}>90+ ថ្ងៃ / 3+ ខែ</Select.Option>
              <Select.Option value={180}>180+ ថ្ងៃ / 6+ ខែ</Select.Option>
            </Select>
          </div>
        </Card>


        {/* Alert for high inactivity */}
        {state.stats.never_logged_in > 0 && (
          <Alert
            message="Warning: Admins Who Never Logged In"
            description={`You have ${state.stats.never_logged_in} admin account(s) that have NEVER logged into the system. Consider deactivating unused accounts.`}
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            className="mb-4 text-xs sm:text-sm"
            closable
          />
        )}

        {/* Statistics */}
        <Row gutter={[12, 12]} className="mb-4">
          <Col xs={12} sm={12} lg={6}>
            <Card className="shadow-md h-full">
              <Statistic
                title={<span className="text-xs sm:text-sm">Total Inactive</span>}
                value={state.stats.total_inactive || 0}
                prefix={<ClockCircleOutlined className="text-sm sm:text-base" />}
                valueStyle={{ color: "#ff4d4f", fontSize: "clamp(1.2rem, 4vw, 1.5rem)" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} lg={6}>
            <Card className="shadow-md h-full">
              <Statistic
                title={<span className="text-xs sm:text-sm">Never Logged</span>}
                value={state.stats.never_logged_in || 0}
                prefix={<WarningOutlined className="text-sm sm:text-base" />}
                valueStyle={{ color: "#ff4d4f", fontSize: "clamp(1.2rem, 4vw, 1.5rem)" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} lg={6}>
            <Card className="shadow-md h-full">
              <Statistic
                title={<span className="text-xs sm:text-sm">90+ Days</span>}
                value={state.stats.inactive_90_plus || 0}
                prefix={<UserOutlined className="text-sm sm:text-base" />}
                valueStyle={{ color: "#fa8c16", fontSize: "clamp(1.2rem, 4vw, 1.5rem)" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} lg={6}>
            <Card className="shadow-md h-full">
              <Statistic
                title={<span className="text-xs sm:text-sm">Users at Risk</span>}
                value={state.stats.total_managed_users || 0}
                prefix={<UserOutlined className="text-sm sm:text-base" />}
                valueStyle={{ color: "#faad14", fontSize: "clamp(1.2rem, 4vw, 1.5rem)" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Desktop/Tablet Table View */}
        <div className="hidden md:block">
          <Card className="shadow-md mb-4">
            <Tabs defaultActiveKey="all" size="small">
              <Tabs.TabPane tab={`All (${state.inactive_admins.length})`} key="all">
                <div className="overflow-x-auto">
                  <Table
                    loading={loading}
                    dataSource={state.inactive_admins}
                    columns={columns}
                    rowKey="id"
                    scroll={{ x: 1400 }}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showTotal: (total) => `Total ${total} admins`,
                      size: "small"
                    }}
                    size="small"
                  />
                </div>
              </Tabs.TabPane>

              <Tabs.TabPane
                tab={`Never (${state.categories.never_logged_in?.length || 0})`}
                key="never"
              >
                <div className="overflow-x-auto">
                  <Table
                    loading={loading}
                    dataSource={state.categories.never_logged_in || []}
                    columns={columns}
                    rowKey="id"
                    scroll={{ x: 1400 }}
                    size="small"
                  />
                </div>
              </Tabs.TabPane>

              <Tabs.TabPane
                tab={`90+ (${state.categories.inactive_90_plus?.length || 0})`}
                key="90plus"
              >
                <div className="overflow-x-auto">
                  <Table
                    loading={loading}
                    dataSource={state.categories.inactive_90_plus || []}
                    columns={columns}
                    rowKey="id"
                    scroll={{ x: 1400 }}
                    size="small"
                  />
                </div>
              </Tabs.TabPane>

              <Tabs.TabPane
                tab={`30-59 (${state.categories.inactive_30_to_59?.length || 0})`}
                key="30to59"
              >
                <div className="overflow-x-auto">
                  <Table
                    loading={loading}
                    dataSource={state.categories.inactive_30_to_59 || []}
                    columns={columns}
                    rowKey="id"
                    scroll={{ x: 1400 }}
                    size="small"
                  />
                </div>
              </Tabs.TabPane>
            </Tabs>
          </Card>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden">
          <Card className="shadow-md mb-4" bodyStyle={{ padding: '12px' }}>
            <Tabs defaultActiveKey="all" size="small">
              <Tabs.TabPane tab={`All (${state.inactive_admins.length})`} key="all">
                <div className="space-y-2">
                  {loading ? (
                    <div className="text-center py-8 text-sm">Loading...</div>
                  ) : (
                    state.inactive_admins.map((admin, index) => (
                      <AdminMobileCard key={admin.id} admin={admin} index={index} />
                    ))
                  )}
                </div>
              </Tabs.TabPane>

              <Tabs.TabPane
                tab={`Never (${state.categories.never_logged_in?.length || 0})`}
                key="never"
              >
                <div className="space-y-2">
                  {(state.categories.never_logged_in || []).map((admin, index) => (
                    <AdminMobileCard key={admin.id} admin={admin} index={index} />
                  ))}
                </div>
              </Tabs.TabPane>

              <Tabs.TabPane
                tab={`90+ (${state.categories.inactive_90_plus?.length || 0})`}
                key="90plus"
              >
                <div className="space-y-2">
                  {(state.categories.inactive_90_plus || []).map((admin, index) => (
                    <AdminMobileCard key={admin.id} admin={admin} index={index} />
                  ))}
                </div>
              </Tabs.TabPane>

              <Tabs.TabPane
                tab={`30-59 (${state.categories.inactive_30_to_59?.length || 0})`}
                key="30to59"
              >
                <div className="space-y-2">
                  {(state.categories.inactive_30_to_59 || []).map((admin, index) => (
                    <AdminMobileCard key={admin.id} admin={admin} index={index} />
                  ))}
                </div>
              </Tabs.TabPane>
            </Tabs>
          </Card>
        </div>

        {/* Category Overview */}
        <Row gutter={[12, 12]}>
          <Col xs={24} md={12} lg={8}>
            <CategoryCard
              title="Never Logged In"
              data={state.categories.never_logged_in || []}
              icon="🚫"
              color="#ff4d4f"
            />
          </Col>
          <Col xs={24} md={12} lg={8}>
            <CategoryCard
              title="90+ Days Inactive"
              data={state.categories.inactive_90_plus || []}
              icon="🔴"
              color="#ff7875"
            />
          </Col>
          <Col xs={24} md={12} lg={8}>
            <CategoryCard
              title="60-89 Days"
              data={state.categories.inactive_60_to_89 || []}
              icon="🟠"
              color="#fa8c16"
            />
          </Col>
        </Row>
      </div>

      <style jsx global>{`
        .ant-table-thead > tr > th {
          font-size: 12px !important;
          padding: 8px !important;
        }
        
        .ant-table-tbody > tr > td {
          padding: 8px !important;
        }
        
        @media (max-width: 640px) {
          .ant-tabs-tab {
            padding: 8px 12px !important;
            font-size: 12px !important;
          }
          
          .ant-card-body {
            padding: 12px !important;
          }
          
          .ant-statistic-title {
            font-size: 11px !important;
          }
        }
        
        @media (min-width: 768px) {
          .ant-table-thead > tr > th {
            font-size: 13px !important;
            padding: 12px !important;
          }
          
          .ant-table-tbody > tr > td {
            padding: 12px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default InactiveAdminsReport;