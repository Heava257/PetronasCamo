// page/supperAdmin/OnlineStatus/OnlineStatusAvatar.jsx
import React from 'react';
import { Avatar, Badge, Tooltip } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { Config } from '../../../util/config';

const OnlineStatusAvatar = ({ 
  user, 
  size = 50, 
  showBadge = true,
  showMinutes = true,  // ✅ NEW: Show minutes on badge
  inactiveThresholdMinutes = 5,
  hideBadgeAfterMinutes = 60
}) => {
  
  // ✅ Calculate minutes since last activity
  const getMinutesSinceActivity = () => {
    if (!user || !user.last_activity) return null;
    
    const lastActivity = new Date(user.last_activity);
    const now = new Date();
    const minutesSinceActivity = (now - lastActivity) / 1000 / 60;
    
    return Math.floor(minutesSinceActivity);
  };

  // ✅ Determine online status
  const getOnlineStatus = () => {
    if (!user) return { status: 'offline', minutes: null, showBadge: false };
    
    const minutesSinceActivity = getMinutesSinceActivity();
    
    // If no activity data
    if (minutesSinceActivity === null) {
      const isOnline = user.is_online === 1 || user.is_online === true;
      return { 
        status: isOnline ? 'online' : 'offline', 
        minutes: null,
        showBadge: true 
      };
    }
    
    // Hide badge if > 60 minutes
    if (minutesSinceActivity >= hideBadgeAfterMinutes) {
      return { 
        status: 'offline', 
        minutes: minutesSinceActivity,
        showBadge: false
      };
    }
    
    // Inactive (5-60 minutes)
    if (minutesSinceActivity >= inactiveThresholdMinutes) {
      return { 
        status: 'inactive', 
        minutes: minutesSinceActivity,
        showBadge: true 
      };
    }
    
    // Away (3-5 minutes)
    if (minutesSinceActivity >= 3) {
      return { 
        status: 'away', 
        minutes: minutesSinceActivity,
        showBadge: true 
      };
    }
    
    // Online (< 3 minutes)
    return { 
      status: 'online', 
      minutes: minutesSinceActivity,
      showBadge: true 
    };
  };

  // ✅ Get badge color
  const getBadgeColor = (status) => {
    switch (status) {
      case 'online': return '#52c41a';  // 🟢 Green
      case 'away': return '#faad14';     // 🟡 Yellow
      case 'inactive': return '#ff4d4f'; // 🔴 Red
      case 'offline': return '#d9d9d9';  // ⚪ Gray
      default: return '#d9d9d9';
    }
  };

  // ✅ Get status text for tooltip
  const getStatusText = (status, minutes) => {
    if (minutes === null) {
      switch (status) {
        case 'online': return 'Online';
        case 'away': return 'Away';
        case 'inactive': return 'Inactive';
        case 'offline': return 'Offline';
        default: return 'Unknown';
      }
    }
    
    switch (status) {
      case 'online':
        return `Online (active ${minutes}m ago)`;
      case 'away':
        return `Away (${minutes} minutes ago)`;
      case 'inactive':
        return `Inactive (${minutes} minutes ago)`;
      case 'offline':
        return `Offline (${minutes} minutes ago)`;
      default:
        return 'Unknown';
    }
  };

  // ✅ Format minutes for display
  const formatMinutesDisplay = (minutes) => {
    if (minutes === null) return '';
    if (minutes < 1) return '<1m';
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      return `${hours}h`;
    }
    return `${minutes}m`;
  };

  const { status, minutes, showBadge: shouldShowBadge } = getOnlineStatus();
  const badgeColor = getBadgeColor(status);
  const statusText = getStatusText(status, minutes);
  const minutesDisplay = formatMinutesDisplay(minutes);

  // ✅ Render avatar
  const avatarElement = (
    <Avatar
      size={size}
      src={user?.profile_image ? Config.getFullImagePath(user.profile_image) : null}
      icon={!user?.profile_image && <UserOutlined />}
      style={{
        backgroundColor: !user?.profile_image ? '#1890ff' : undefined,
      }}
    />
  );

  // ✅ If don't show badge
  if (!showBadge || !shouldShowBadge) {
    return avatarElement;
  }

  // ✅✅✅ RENDER WITH MINUTES TEXT ✅✅✅
  return (
    <Tooltip title={statusText} placement="top">
      <div style={{ position: 'relative', display: 'inline-block' }}>
        {/* Avatar with status dot */}
        <Badge
          dot
          status={status}
          color={badgeColor}
          offset={[-5, size - 10]}
        >
          {avatarElement}
        </Badge>
        
        {/* ✅ Minutes badge overlay (only show if showMinutes=true and minutes exist) */}
        {showMinutes && minutes !== null && minutes >= 3 && (
          <div
            style={{
              position: 'absolute',
              bottom: -5,
              right: -5,
              backgroundColor: badgeColor,
              color: '#fff',
              fontSize: size > 40 ? 10 : 8,
              fontWeight: 'bold',
              padding: '1px 4px',
              borderRadius: 8,
              border: '1px solid #fff',
              lineHeight: 1,
              minWidth: 20,
              textAlign: 'center',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }}
          >
            {minutesDisplay}
          </div>
        )}
      </div>
    </Tooltip>
  );
};

export default OnlineStatusAvatar;