import React, { useState, useEffect } from 'react';
import {
  Badge,
  Dropdown,
  Card,
  Tag,
  Space,
  Button,
  Tabs,
  Empty,
  Divider,
  Tooltip,
} from 'antd';
import {
  BellOutlined,
  CheckCircleOutlined,
  ShopOutlined,
  UserOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { request } from '../../../util/helper';

dayjs.extend(relativeTime);

const { TabPane } = Tabs;

function NotificationBell() {
  const [visible, setVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecentNotifications();

    // Poll every 30 seconds
    const interval = setInterval(fetchRecentNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchRecentNotifications = async () => {
    try {

      // ✅ Use request() helper with GET method and params
      const response = await request('notifications/recent', 'get', { limit: 10 });


      if (response && response.success) {
        // Backend returns { success: true, data: [...] }
        // request() already extracts response.data, so we get the full object
        const notificationData = response.data || [];


        setNotifications(notificationData);

        // Count unread (handle both 0/1 and true/false)
        const unread = notificationData.filter(n => !n.is_read && n.is_read !== 1).length;
        setUnreadCount(unread);

      } else {
        console.warn('⚠️ Response not successful:', response);
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const handleMarkAsRead = async (id, event) => {
    event.stopPropagation();

    try {
      // ✅ Use request() helper with PUT method
      const response = await request(`notifications/${id}/read`, 'put');

      if (response && response.success) {
        fetchRecentNotifications();
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      order_created: '✅',
      payment_received: '💰',
      stock_update: '📦',
      customer_created: '👤',
      alert: '⚠️',
      error: '❌',
    };
    return icons[type] || '🔔';
  };

  const getTypeColor = (type) => {
    const colors = {
      order_created: 'green',
      payment_received: 'blue',
      stock_update: 'purple',
      customer_created: 'cyan',
      alert: 'orange',
      error: 'red',
    };
    return colors[type] || 'default';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'default',
      normal: 'blue',
      high: 'orange',
      critical: 'red',
    };
    return colors[priority] || 'default';
  };

  // Group notifications by branch
  const groupedNotifications = notifications.reduce((acc, notif) => {
    const branch = notif.branch_name || 'Other';
    if (!acc[branch]) {
      acc[branch] = [];
    }
    acc[branch].push(notif);
    return acc;
  }, {});

  const NotificationItem = ({ notification }) => {
    const isUnread = !notification.is_read && notification.is_read !== 1;

    return (
      <div
        className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${isUnread ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
          }`}
        onClick={() => {
          navigate('/notifications');
          setVisible(false);
        }}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="text-2xl flex-shrink-0">
            {getNotificationIcon(notification.notification_type)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <div className="font-semibold text-sm truncate flex-1">
                {notification.title}
              </div>

              {isUnread && (
                <Tooltip title="សម្គាល់ថាបានអាន">
                  <Button
                    type="text"
                    size="small"
                    icon={<CheckCircleOutlined className="text-blue-600" />}
                    onClick={(e) => handleMarkAsRead(notification.id, e)}
                    className="flex-shrink-0 ml-2"
                  />
                </Tooltip>
              )}
            </div>

            {/* Branch & Type */}
            <Space size={4} className="mb-1 flex-wrap">
              {notification.branch_name && (
                <Tag color="purple" className="text-xs m-0">
                  <ShopOutlined /> {notification.branch_name}
                </Tag>
              )}
              <Tag color={getTypeColor(notification.notification_type)} className="text-xs m-0">
                {notification.notification_type}
              </Tag>
              {notification.priority !== 'normal' && (
                <Tag color={getPriorityColor(notification.priority)} className="text-xs m-0">
                  {notification.priority}
                </Tag>
              )}
            </Space>

            {/* Details */}
            <div className="text-xs text-gray-600 space-y-0.5">
              {notification.order_no && (
                <div className="truncate">📝 Order: {notification.order_no}</div>
              )}
              {notification.customer_name && (
                <div className="truncate">👤 {notification.customer_name}</div>
              )}
              {notification.total_amount && (
                <div className="font-semibold text-green-600">
                  💰 ${Number(notification.total_amount).toLocaleString()}
                </div>
              )}
            </div>

            {/* Time & Creator */}
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>
                <ClockCircleOutlined /> {notification.time_ago}
              </span>
              {notification.created_by && (
                <span>
                  <UserOutlined /> {notification.created_by}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const dropdownContent = (
    <Card
      className="w-[450px] max-w-[95vw] shadow-xl"
      bodyStyle={{ padding: 0 }}
    >
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg">Notifications</h3>
          <Badge count={unreadCount} style={{ backgroundColor: '#ff4d4f' }} />
        </div>
        <p className="text-xs opacity-90">
          {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        size="small"
        className="px-2"
        items={[
          {
            key: 'all',
            label: `All (${notifications.length})`,
            children: null,
          },
          {
            key: 'unread',
            label: `Unread (${unreadCount})`,
            children: null,
          },
          {
            key: 'byBranch',
            label: 'By Branch',
            children: null,
          },
        ]}
      />

      {/* Content */}
      <div className="max-h-[500px] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          </div>
        ) : (
          <>
            {/* All / Unread Tabs */}
            {(activeTab === 'all' || activeTab === 'unread') && (
              <>
                {notifications.length === 0 ? (
                  <Empty
                    description="No notifications"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    className="py-8"
                  />
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications
                      .filter(n => activeTab === 'all' || (!n.is_read && n.is_read !== 1))
                      .map(notification => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                        />
                      ))}

                    {/* Show message if no unread in unread tab */}
                    {activeTab === 'unread' &&
                      notifications.filter(n => !n.is_read && n.is_read !== 1).length === 0 && (
                        <Empty
                          description="No unread notifications"
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          className="py-8"
                        />
                      )}
                  </div>
                )}
              </>
            )}

            {/* By Branch Tab */}
            {activeTab === 'byBranch' && (
              <div className="p-2">
                {Object.keys(groupedNotifications).length === 0 ? (
                  <Empty
                    description="No notifications"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    className="py-8"
                  />
                ) : (
                  Object.entries(groupedNotifications).map(([branch, branchNotifs]) => {
                    const unreadInBranch = branchNotifs.filter(n => !n.is_read && n.is_read !== 1).length;

                    return (
                      <Card
                        key={branch}
                        size="small"
                        className="mb-2"
                        title={
                          <div className="flex items-center justify-between">
                            <Space>
                              <ShopOutlined className="text-purple-600" />
                              <span className="font-semibold text-sm">{branch}</span>
                            </Space>
                            <Space>
                              <Badge
                                count={branchNotifs.length}
                                style={{ backgroundColor: '#52c41a' }}
                              />
                              {unreadInBranch > 0 && (
                                <Badge
                                  count={unreadInBranch}
                                  style={{ backgroundColor: '#1890ff' }}
                                />
                              )}
                            </Space>
                          </div>
                        }
                      >
                        <div className="divide-y divide-gray-100 max-h-40 overflow-y-auto">
                          {branchNotifs.slice(0, 3).map(notif => (
                            <div
                              key={notif.id}
                              className="py-2 hover:bg-gray-50 cursor-pointer"
                              onClick={() => {
                                navigate('/notifications');
                                setVisible(false);
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium truncate">
                                    {notif.title}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {notif.time_ago}
                                  </div>
                                </div>
                                {(!notif.is_read && notif.is_read !== 1) && (
                                  <Badge status="processing" />
                                )}
                              </div>
                            </div>
                          ))}
                          {branchNotifs.length > 3 && (
                            <div className="text-center text-xs text-gray-500 pt-2">
                              +{branchNotifs.length - 3} more
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <>
          <Divider className="my-0" />
          <div className="p-3 bg-gray-50">
            <Link
              to="/notifications"
              onClick={() => setVisible(false)}
              className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              មើល Notifications ទាំងអស់
            </Link>
          </div>
        </>
      )}
    </Card>
  );

  return (
    <div className="header-icon glass-pill relative cursor-not-allowed opacity-60">
      <Badge
        count={unreadCount}
        overflowCount={99}
        offset={[-5, 5]}
        className={unreadCount > 0 ? 'animate-pulse' : ''}
      >
        <BellOutlined className="text-xl" />
      </Badge>

      {/* Animated ring for critical notifications */}
      {notifications.some(n => (!n.is_read && n.is_read !== 1) && n.priority === 'critical') && (
        <span className="absolute top-1 right-1">
          <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
        </span>
      )}
    </div>
  );
}

export default NotificationBell;