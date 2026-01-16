import React, { useState, useEffect, useRef } from "react";
import { Badge, Empty, Spin, message, Input } from "antd";
import { 
  BellOutlined, 
  CloseOutlined, 
  CheckOutlined, 
  DeleteOutlined,
  SendOutlined,
  ClockCircleOutlined,
  CommentOutlined
} from "@ant-design/icons";
import { request } from "../../../util/helper";
import { Config } from "../../../util/config";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "./NotificationPanel.css";

dayjs.extend(relativeTime);

const { TextArea } = Input;

const NotificationPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const panelRef = useRef(null);
  const autoDeleteTimers = useRef({});

  useEffect(() => {
    // Poll for unread count every 30 seconds
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => {
      clearInterval(interval);
      // Clear all auto-delete timers
      Object.values(autoDeleteTimers.current).forEach(timer => clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const fetchUnreadCount = async () => {
    try {
      const res = await request("notification/unread-count", "get");
      if (res && res.success) {
        setUnreadCount(res.unread_count || 0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const fetchNotifications = async () => {
  try {
    setLoading(true);
    
    const res = await request("notification/my-notifications?limit=50", "get");
    
    
    if (res && res.success) {
      setNotifications(res.notifications || []);
      setUnreadCount(res.unread_count || 0);
      // ... rest of the code

        // ✅ Setup auto-delete timers for notifications with auto_delete_at
        res.notifications.forEach(notif => {
          if (notif.seconds_until_delete && notif.seconds_until_delete > 0) {
            setupAutoDeleteTimer(notif.id, notif.seconds_until_delete);
          }
        });
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      message.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Setup auto-delete timer
  const setupAutoDeleteTimer = (notificationId, seconds) => {
    // Clear existing timer if any
    if (autoDeleteTimers.current[notificationId]) {
      clearTimeout(autoDeleteTimers.current[notificationId]);
    }

    // Set new timer
    autoDeleteTimers.current[notificationId] = setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      delete autoDeleteTimers.current[notificationId];
    }, seconds * 1000);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const res = await request("notification/mark-read", "post", {
        notification_id: notificationId,
      });

      if (res && res.success) {
        const notification = notifications.find(n => n.id === notificationId);
        const wasUnread = notification?.is_read === 0;

        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId 
              ? { 
                  ...n, 
                  is_read: 1, 
                  read_at: new Date(),
                  auto_delete_at: res.auto_delete_at,
                  seconds_until_delete: res.auto_delete_in
                } 
              : n
          )
        );

        if (wasUnread) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }

        // ✅ Setup auto-delete timer (5 minutes)
        if (res.auto_delete_in) {
          setupAutoDeleteTimer(notificationId, res.auto_delete_in);
          message.success("សម្គាល់ថាបានអានហើយ - នឹងលុបស្វ័យប្រវត្តិក្នុង 5 នាទី", 3);
        }
      }
    } catch (error) {
      console.error("Error marking as read:", error);
      message.error("Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await request("notification/mark-all-read", "post");

      if (res && res.success) {
        const now = new Date();
        const deleteAt = new Date(now.getTime() + 300000); // +5 minutes

        setNotifications((prev) =>
          prev.map((n) => ({
            ...n,
            is_read: 1,
            read_at: now,
            auto_delete_at: deleteAt.toISOString(),
            seconds_until_delete: 300
          }))
        );

        // ✅ Setup auto-delete timers for all
        notifications.forEach(notif => {
          if (notif.is_read === 0) {
            setupAutoDeleteTimer(notif.id, 300);
          }
        });

        setUnreadCount(0);
        message.success("សម្គាល់ទាំងអស់ថាបានអានហើយ - នឹងលុបស្វ័យប្រវត្តិក្នុង 5 នាទី", 3);
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
      message.error("Failed to mark all as read");
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      const res = await request(`notification/${notificationId}`, "delete");

      if (res && res.success) {
        const wasUnread = notifications.find((n) => n.id === notificationId)?.is_read === 0;
        
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        
        if (wasUnread) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }

        // Clear auto-delete timer
        if (autoDeleteTimers.current[notificationId]) {
          clearTimeout(autoDeleteTimers.current[notificationId]);
          delete autoDeleteTimers.current[notificationId];
        }

        message.success("Notification deleted");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      message.error("Failed to delete notification");
    }
  };

  // ✅ បើក reply box
  const handleReply = (notification) => {
    setReplyingTo(notification);
    setReplyMessage("");
  };

  // ✅ ផ្ញើ reply
  const handleSendReply = async (notificationId) => {
    if (!replyMessage.trim()) {
      message.error("សូមបញ្ចូលសារឆ្លើយតប");
      return;
    }

    try {
      setSendingReply(true);
      const res = await request("notification/reply", "post", {
        notification_id: notificationId,
        reply_message: replyMessage,
      });

      if (res && res.success) {
        message.success("ផ្ញើការឆ្លើយតបបានជោគជ័យ ✅");
        
        // ✅ បិទ reply box
        setReplyingTo(null);
        setReplyMessage("");
        
        // ✅ Update notification status
        const now = new Date();
        const deleteAt = new Date(now.getTime() + 300000);

        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId 
              ? { 
                  ...n, 
                  is_read: 1, 
                  read_at: now,
                  auto_delete_at: deleteAt.toISOString(),
                  seconds_until_delete: 300
                } 
              : n
          )
        );

        const wasUnread = notifications.find(n => n.id === notificationId)?.is_read === 0;
        if (wasUnread) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }

        // ✅ Setup auto-delete timer
        setupAutoDeleteTimer(notificationId, 300);

        // ✅ Refresh to show reply might have arrived
        setTimeout(() => {
          fetchUnreadCount();
        }, 1000);
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      message.error("មិនអាចផ្ញើការឆ្លើយតបបានទេ");
    } finally {
      setSendingReply(false);
    }
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyMessage("");
  };

  const getProfileImageUrl = (imagePath) => {
    if (!imagePath) return null;
    try {
      return Config.getFullImagePath(imagePath);
    } catch {
      return null;
    }
  };

  // ✅ Format time remaining
  const formatTimeRemaining = (seconds) => {
    if (!seconds || seconds <= 0) return null;
    
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // ✅ Check if notification is reply type
  const isReplyNotification = (notif) => {
    return notif.type === 'reply' || notif.reply_to_id;
  };

  return (
    <div className="notification-container" ref={panelRef}>
      {/* Notification Bell Button */}
      <button
        className="notification-bell-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Badge count={unreadCount} offset={[-5, 5]} className="notification-badge-container">
          <BellOutlined className="notification-bell-icon" />
        </Badge>
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="notification-panel">
          {/* Header */}
          <div className="notification-panel-header">
            <div className="notification-header-left">
              <BellOutlined className="notification-header-icon" />
              <span className="notification-header-title">ការជូនដំណឹង</span>
              {unreadCount > 0 && (
                <span className="notification-unread-badge">{unreadCount}</span>
              )}
            </div>
            <button
              className="notification-close-button"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
            >
              <CloseOutlined />
            </button>
          </div>

          {/* Mark All Read Button */}
          {unreadCount > 0 && (
            <div className="notification-actions">
              <button
                className="notification-mark-all-button"
                onClick={handleMarkAllAsRead}
              >
                <CheckOutlined /> សម្គាល់ទាំងអស់ថាបានអាន
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">
                <Spin size="large" />
                <p>កំពុងផ្ទុក...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="គ្មានការជូនដំណឹង"
                />
              </div>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} className="notification-item-wrapper">
                  <div
                    className={`notification-item ${
                      notif.is_read ? "notification-read" : "notification-unread"
                    } ${
                      notif.auto_delete_at ? "notification-auto-delete" : ""
                    } ${
                      isReplyNotification(notif) ? "notification-reply" : ""
                    }`}
                  >
                    {/* Sender Avatar */}
                    <div className="notification-avatar">
                      {notif.sender_image ? (
                        <img
                          src={getProfileImageUrl(notif.sender_image)}
                          alt={notif.sender_name}
                          className="notification-avatar-img"
                        />
                      ) : (
                        <div className="notification-avatar-placeholder">
                          {notif.sender_name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {!notif.is_read && <span className="notification-unread-dot"></span>}
                    </div>

                    {/* Content */}
                    <div className="notification-content">
                      <div className="notification-sender">
                        <span className="notification-sender-name">
                          {notif.sender_name}
                          {isReplyNotification(notif) && (
                            <span className="notification-reply-badge"> ឆ្លើយតប</span>
                          )}
                        </span>
                        <span className="notification-time">
                          {dayjs(notif.created_at).fromNow()}
                        </span>
                      </div>
                      <p className="notification-message">{notif.message}</p>
                      
                      {/* ✅ Auto-delete countdown */}
                      {notif.auto_delete_at && notif.seconds_until_delete > 0 && (
                        <div className="notification-auto-delete-timer">
                          <ClockCircleOutlined />
                          <span>
                            លុបក្នុង: {formatTimeRemaining(notif.seconds_until_delete)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="notification-item-actions">
                      {!notif.is_read && (
                        <button
                          className="notification-action-button notification-read-button"
                          onClick={() => handleMarkAsRead(notif.id)}
                          title="សម្គាល់ថាបានអាន"
                        >
                          <CheckOutlined />
                        </button>
                      )}
                      <button
                        className="notification-action-button notification-reply-button"
                        onClick={() => handleReply(notif)}
                        title="ឆ្លើយតប"
                        disabled={replyingTo?.id === notif.id}
                      >
                        <CommentOutlined />
                      </button>
                      <button
                        className="notification-action-button notification-delete-button"
                        onClick={() => handleDelete(notif.id)}
                        title="លុប"
                      >
                        <DeleteOutlined />
                      </button>
                    </div>
                  </div>

                  {/* ✅ Reply Box */}
                  {replyingTo?.id === notif.id && (
                    <div className="notification-reply-box">
                      <div className="notification-reply-header">
                        <span>ឆ្លើយតបទៅ {notif.sender_name}</span>
                      </div>
                      <TextArea
                        placeholder="សរសេរការឆ្លើយតប..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        autoSize={{ minRows: 2, maxRows: 4 }}
                        className="notification-reply-textarea"
                        autoFocus
                      />
                      <div className="notification-reply-actions">
                        <button
                          className="notification-reply-cancel-btn"
                          onClick={handleCancelReply}
                          disabled={sendingReply}
                        >
                          បោះបង់
                        </button>
                        <button
                          className="notification-reply-send-btn"
                          onClick={() => handleSendReply(notif.id)}
                          disabled={sendingReply || !replyMessage.trim()}
                        >
                          {sendingReply ? (
                            <Spin size="small" />
                          ) : (
                            <>
                              <SendOutlined /> ផ្ញើ
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;