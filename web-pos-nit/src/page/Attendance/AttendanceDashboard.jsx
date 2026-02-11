import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Typography,
  Badge,
  Avatar,
  Statistic,
  Table,
  Tag,
  Space,
  Modal,
  message,
  Spin,
  Timeline,
  DatePicker,
  Empty,
  Progress,
  Tooltip,
  Divider,
  Select
} from "antd";
import {
  ClockCircleOutlined,
  LoginOutlined,
  LogoutOutlined,
  SafetyOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  ReloadOutlined,
  WarningOutlined,
  FireOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  InfoCircleOutlined
} from "@ant-design/icons";
import { request } from "../../util/helper";
import { getProfile } from "../../store/profile.store";
import { useTranslation } from "../../locales/TranslationContext";
import moment from "moment";
import * as XLSX from 'xlsx';
import MainPage from "../../component/layout/MainPage";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

function AttendanceManagement() {
  const { t } = useTranslation();
  const profile = getProfile();

  // State
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [statistics, setStatistics] = useState({
    total: 0,
    on_time: 0,
    late_grace: 0,
    late_penalty: 0,
    absent: 0,
    avg_late_minutes: 0,
    total_late_minutes: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [userIP, setUserIP] = useState('');
  const [isIPAllowed, setIsIPAllowed] = useState(false);
  const [ipInfo, setIpInfo] = useState(null);
  const [dateRange, setDateRange] = useState([
    moment().startOf('month'),
    moment()
  ]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentTime, setCurrentTime] = useState(moment());

  // Theme
  const theme = {
    background: 'var(--bg-main, #f8fafc)',
    cardBg: 'var(--bg-card, #ffffff)',
    primary: 'var(--primary-color, #3b82f6)',
    success: 'var(--color-success, #10b981)',
    warning: 'var(--color-warning, #f59e0b)',
    danger: 'var(--color-error, #ef4444)',
    info: 'var(--color-info, #06b6d4)',
    purple: 'var(--secondary-color, #8b5cf6)',
    textPrimary: 'var(--text-primary, #1e293b)',
    textSecondary: 'var(--text-secondary, #64748b)',
    borderColor: 'var(--border-color, #e2e8f0)'
  };

  useEffect(() => {
    fetchUserIP();
    fetchTodayAttendance();
    fetchAttendanceList();

    // Update clock
    const timer = setInterval(() => {
      setCurrentTime(moment());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchAttendanceList();
  }, [dateRange, statusFilter]);

  // Fetch IP
  const fetchUserIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      setUserIP(data.ip);
      checkIPAllowed(data.ip);
    } catch (error) {
      console.error('Error fetching IP:', error);
      setUserIP('Unknown');
      setIsIPAllowed(false);
    }
  };

  // Check IP allowed
  const checkIPAllowed = async (ip) => {
    try {
      const res = await request(`attendance/check-ip?ip=${ip}`, 'get');
      if (res && !res.error) {
        setIsIPAllowed(res.allowed);
        setIpInfo(res.ip_info);
      } else {
        setIsIPAllowed(false);
      }
    } catch (error) {
      setIsIPAllowed(false);
    }
  };

  // Fetch today attendance
  const fetchTodayAttendance = async () => {
    try {
      const res = await request('attendance/today', 'get');
      if (res && !res.error) {
        setTodayAttendance(res.attendance);
      } else {
        setTodayAttendance(null);
      }
    } catch (error) {
      setTodayAttendance(null);
    }
  };

  // Fetch attendance list
  const fetchAttendanceList = async () => {
    setIsLoading(true);
    // Also refresh IP status
    fetchUserIP();

    try {
      let apiUrl = 'attendance/list';

      const params = [];
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.push(`from_date=${dateRange[0].format('YYYY-MM-DD')}`);
        params.push(`to_date=${dateRange[1].format('YYYY-MM-DD')}`);
      }

      if (statusFilter && statusFilter !== 'all') {
        params.push(`status_filter=${statusFilter}`);
      }

      if (params.length > 0) {
        apiUrl += '?' + params.join('&');
      }

      const res = await request(apiUrl, 'get');
      if (res && !res.error) {
        setAttendanceList(res.attendance || []);
        setStatistics(res.statistics || {
          total: 0,
          on_time: 0,
          late_grace: 0,
          late_penalty: 0,
          absent: 0,
          avg_late_minutes: 0,
          total_late_minutes: 0
        });
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setAttendanceList([]);
    } finally {
      setIsLoading(false);
      // Re-check IP status just in case
      if (userIP) {
        checkIPAllowed(userIP);
      }
    }
  };

  // Check In
  const handleCheckIn = async () => {
    if (!isIPAllowed) {
      Modal.error({
        title: (
          <div style={{ color: theme.textPrimary }}>
            <SafetyOutlined style={{ marginRight: 8, color: theme.danger }} />
            {t('IP Address Not Allowed')}
          </div>
        ),
        content: (
          <div style={{ color: theme.textSecondary }}>
            <p>{t('Your IP address is not in the allowed list.')}</p>
            <div style={{
              padding: 12,
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: 8,
              marginTop: 12,
              border: `1px solid ${theme.danger}40`
            }}>
              <Space direction="vertical" size={4}>
                <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                  {t('Your IP')}: <strong style={{ color: theme.danger }}>{userIP}</strong>
                </Text>
                <Text style={{ fontSize: 11, color: theme.textSecondary }}>
                  {t('Location')}: {ipInfo?.description || 'Unknown'}
                </Text>
              </Space>
            </div>
            <p style={{ marginTop: 12, fontSize: 13 }}>
              {t('Contact administrator to add your IP address to the allowed list.')}
            </p>
          </div>
        ),
        okText: t('I Understand'),
        centered: true,
        okButtonProps: {
          style: {
            background: theme.danger,
            borderColor: theme.danger
          }
        }
      });
      return;
    }

    setCheckingIn(true);
    try {
      // Get location
      let location = null;
      if (navigator.geolocation) {
        await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              location = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              };
              resolve();
            },
            () => resolve()
          );
        });
      }

      const payload = {
        ip_address: userIP,
        location: location ? `${location.latitude},${location.longitude}` : null,
        check_in_time: moment().format('YYYY-MM-DD HH:mm:ss')
      };

      const res = await request('attendance/check-in', 'post', payload);

      if (res && !res.error) {
        // Show success with late info
        const lateInfo = res.late_info;
        const isLate = lateInfo?.is_late;
        const hasPenalty = lateInfo?.has_penalty;

        let icon = '✅';
        let messageType = 'success';

        if (hasPenalty) {
          icon = '⚠️';
          messageType = 'warning';
        } else if (isLate) {
          icon = '⏰';
          messageType = 'info';
        }

        Modal[messageType]({
          title: (
            <div style={{ color: theme.textPrimary }}>
              {icon} {res.message}
            </div>
          ),
          content: res.late_info && (
            <div style={{ color: theme.textSecondary }}>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <div style={{
                  padding: 12,
                  background: hasPenalty ? 'rgba(239, 68, 68, 0.1)' :
                    isLate ? 'rgba(245, 158, 11, 0.1)' :
                      'rgba(16, 185, 129, 0.1)',
                  borderRadius: 8,
                  border: `1px solid ${hasPenalty ? theme.danger : isLate ? theme.warning : theme.success}40`
                }}>
                  <Space direction="vertical" size={4}>
                    <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                      {t('Scheduled Start')}: <strong>{lateInfo.scheduled_start}</strong>
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                      {t('Actual Check In')}: <strong>{lateInfo.actual_check_in}</strong>
                    </Text>
                    {isLate && (
                      <>
                        <Divider style={{ margin: '8px 0', borderColor: theme.borderColor }} />
                        <Text style={{
                          fontSize: 13,
                          color: hasPenalty ? theme.danger : theme.warning,
                          fontWeight: 600
                        }}>
                          {hasPenalty ? '⚠️ ' : '⏰ '}
                          {t('Late by')} {lateInfo.late_time_formatted?.en || `${lateInfo.late_minutes} minutes`}
                        </Text>
                        {!hasPenalty && (
                          <Text style={{ fontSize: 11, color: theme.success }}>
                            ✓ {t('Within grace period')} ({lateInfo.grace_period} {t('min')})
                          </Text>
                        )}
                        {hasPenalty && (
                          <Text style={{ fontSize: 11, color: theme.danger }}>
                            ⚠️ {t('Exceeds grace period')} ({lateInfo.grace_period} {t('min')})
                          </Text>
                        )}
                      </>
                    )}
                  </Space>
                </div>
              </Space>
            </div>
          ),
          okText: t('Got it'),
          centered: true
        });

        fetchTodayAttendance();
        fetchAttendanceList();
      } else {
        message.error(res.message || t('Failed to check in'));
      }
    } catch (error) {
      console.error('Check in error:', error);
      message.error(t('Failed to check in'));
    } finally {
      setCheckingIn(false);
    }
  };

  // Check Out
  const handleCheckOut = async () => {
    if (!todayAttendance || !todayAttendance.id) {
      message.error(t('No check-in record found'));
      return;
    }

    setCheckingIn(true);
    try {
      const res = await request('attendance/check-out', 'post', {
        attendance_id: todayAttendance.id,
        check_out_time: moment().format('YYYY-MM-DD HH:mm:ss')
      });

      if (res && !res.error) {
        const earlyInfo = res.early_departure_info;
        const leftEarly = earlyInfo?.left_early;
        const overtime = earlyInfo?.worked_overtime;

        Modal.success({
          title: (
            <div style={{ color: theme.textPrimary }}>
              👋 {res.message}
            </div>
          ),
          content: (
            <div style={{ color: theme.textSecondary }}>
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <div style={{
                  padding: 12,
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: 8,
                  border: `1px solid ${theme.success}40`
                }}>
                  <Text style={{
                    fontSize: 16,
                    color: theme.success,
                    fontWeight: 600
                  }}>
                    {t('Total Working Hours')}: {res.working_hours}h
                  </Text>
                </div>

                {earlyInfo && (
                  <div style={{
                    padding: 12,
                    background: leftEarly ? 'rgba(245, 158, 11, 0.1)' :
                      overtime ? 'rgba(59, 130, 246, 0.1)' :
                        'rgba(16, 185, 129, 0.1)',
                    borderRadius: 8,
                    border: `1px solid ${leftEarly ? theme.warning : overtime ? theme.primary : theme.success}40`
                  }}>
                    <Space direction="vertical" size={4}>
                      <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                        {t('Scheduled End')}: <strong>{earlyInfo.scheduled_end}</strong>
                      </Text>
                      <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                        {t('Actual Check Out')}: <strong>{earlyInfo.actual_check_out}</strong>
                      </Text>
                      <Divider style={{ margin: '8px 0', borderColor: theme.borderColor }} />
                      {leftEarly && (
                        <Text style={{ fontSize: 13, color: theme.warning, fontWeight: 600 }}>
                          ⏰ {t('Left')} {earlyInfo.early_time_formatted?.en || `${earlyInfo.early_departure_minutes} minutes`} {t('early')}
                        </Text>
                      )}
                      {overtime && (
                        <Text style={{ fontSize: 13, color: theme.primary, fontWeight: 600 }}>
                          💪 {t('Overtime')}: {earlyInfo.early_time_formatted?.en || `${Math.abs(earlyInfo.early_departure_minutes)} minutes`}
                        </Text>
                      )}
                    </Space>
                  </div>
                )}

                <Text style={{ fontSize: 12, color: theme.textSecondary, textAlign: 'center' }}>
                  {t('See you tomorrow!')} 🌟
                </Text>
              </Space>
            </div>
          ),
          okText: t('Done'),
          centered: true
        });

        fetchTodayAttendance();
        fetchAttendanceList();
      } else {
        message.error(res.message || t('Failed to check out'));
      }
    } catch (error) {
      console.error('Check out error:', error);
      message.error(t('Failed to check out'));
    } finally {
      setCheckingIn(false);
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    if (attendanceList.length === 0) {
      message.warning(t('No data to export'));
      return;
    }

    const exportData = attendanceList.map(record => ({
      'Date': moment(record.date).format('YYYY-MM-DD'),
      'Employee': record.user_name || record.employee_name,
      'Position': record.position || '-',
      'Check In': record.check_in_time || '-',
      'Check Out': record.check_out_time || '-',
      'Scheduled Start': record.scheduled_start_time || '-',
      'Scheduled End': record.scheduled_end_time || '-',
      'Working Hours': record.working_hours || '-',
      'Late Minutes': record.late_minutes || 0,
      'Status': record.status || 'present',
      'Late Status': record.late_status_display || '-',
      'IP Address': record.ip_address || '-',
      'Location': record.location || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');

    // Add summary sheet
    const summaryData = [
      { 'Metric': 'Total Records', 'Value': statistics.total },
      { 'Metric': 'On Time', 'Value': statistics.on_time },
      { 'Metric': 'Late (Grace Period)', 'Value': statistics.late_grace },
      { 'Metric': 'Late (Penalty)', 'Value': statistics.late_penalty },
      { 'Metric': 'Absent', 'Value': statistics.absent },
      { 'Metric': 'Average Late Minutes', 'Value': statistics.avg_late_minutes },
      { 'Metric': 'Total Late Minutes', 'Value': statistics.total_late_minutes },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    XLSX.writeFile(wb, `Attendance_Report_${moment().format('YYYY-MM-DD')}.xlsx`);
    message.success(t('Report exported successfully!'));
  };

  // Status color & icon
  const getStatusConfig = (status) => {
    const configs = {
      'on-time': {
        color: theme.success,
        icon: <CheckCircleOutlined />,
        text: 'ON TIME',
        bgColor: 'rgba(16, 185, 129, 0.1)'
      },
      'late-grace': {
        color: theme.warning,
        icon: <ClockCircleOutlined />,
        text: 'LATE (GRACE)',
        bgColor: 'rgba(245, 158, 11, 0.1)'
      },
      'late-penalty': {
        color: theme.danger,
        icon: <WarningOutlined />,
        text: 'LATE (PENALTY)',
        bgColor: 'rgba(239, 68, 68, 0.1)'
      },
      'absent': {
        color: theme.textSecondary,
        icon: <CloseCircleOutlined />,
        text: 'ABSENT',
        bgColor: 'rgba(148, 163, 184, 0.1)'
      }
    };
    return configs[status] || configs['on-time'];
  };

  // Calculate punctuality rate
  const getPunctualityRate = () => {
    if (statistics.total === 0) return 0;
    return ((statistics.on_time / statistics.total) * 100).toFixed(1);
  };

  // Table columns
  const columns = [
    {
      title: t('Date'),
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date) => (
        <Space>
          <CalendarOutlined style={{ color: theme.primary, fontSize: 12 }} />
          <Text style={{ color: theme.textPrimary, fontSize: 13 }}>
            {moment(date).format('MMM DD')}
          </Text>
        </Space>
      ),
      sorter: (a, b) => moment(a.date).unix() - moment(b.date).unix()
    },
    {
      title: t('Employee'),
      key: 'employee',
      width: 180,
      render: (_, record) => (
        <Space>
          <Avatar
            style={{
              background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.purple} 100%)`,
              fontSize: 14
            }}
          >
            {(record.user_name || record.employee_name || 'U').charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <Text style={{ color: theme.textPrimary, fontSize: 13, display: 'block' }}>
              {record.user_name || record.employee_name || 'Unknown'}
            </Text>
            {record.position && (
              <Text style={{ color: theme.textSecondary, fontSize: 11 }}>
                {record.position}
              </Text>
            )}
          </div>
        </Space>
      )
    },
    {
      title: t('Schedule'),
      key: 'schedule',
      width: 140,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text style={{ color: theme.textSecondary, fontSize: 11 }}>
            {record.scheduled_start_display || record.scheduled_start_time || '-'} -
            {record.scheduled_end_display || record.scheduled_end_time || '-'}
          </Text>
          {record.work_type && (
            <Tag
              style={{
                fontSize: 10,
                padding: '0 6px',
                background: theme.cardBg,
                border: `1px solid ${theme.borderColor}`,
                color: theme.textSecondary
              }}
            >
              {record.work_type}
            </Tag>
          )}
        </Space>
      )
    },
    {
      title: t('Check In'),
      key: 'check_in',
      width: 120,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Space size={4}>
            <LoginOutlined style={{ color: theme.success, fontSize: 12 }} />
            <Text style={{ color: theme.textPrimary, fontSize: 13 }}>
              {record.check_in_display ||
                (record.check_in_time ? moment(record.check_in_time).format('HH:mm') : '-')}
            </Text>
          </Space>
          {record.late_minutes > 0 && (
            <Text style={{
              color: record.status === 'late-penalty' ? theme.danger : theme.warning,
              fontSize: 10
            }}>
              +{record.late_time_formatted?.en || `${record.late_minutes}min`}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: t('Check Out'),
      key: 'check_out',
      width: 100,
      render: (_, record) => (
        <Space>
          <LogoutOutlined style={{ color: theme.danger, fontSize: 12 }} />
          <Text style={{ color: theme.textPrimary, fontSize: 13 }}>
            {record.check_out_display ||
              (record.check_out_time ? moment(record.check_out_time).format('HH:mm') : '-')}
          </Text>
        </Space>
      )
    },
    {
      title: t('Hours'),
      dataIndex: 'working_hours',
      key: 'hours',
      width: 80,
      render: (hours) => (
        <Text style={{
          color: theme.primary,
          fontWeight: 600,
          fontSize: 13
        }}>
          {hours ? `${parseFloat(hours).toFixed(1)}h` : '-'}
        </Text>
      )
    },
    {
      title: t('Status'),
      key: 'status',
      width: 150,
      render: (_, record) => {
        const config = getStatusConfig(record.status);
        return (
          <Tooltip title={record.late_status_display || record.status}>
            <div style={{
              padding: '4px 10px',
              background: config.bgColor,
              border: `1px solid ${config.color}40`,
              borderRadius: 6,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span style={{ color: config.color, fontSize: 12 }}>
                {config.icon}
              </span>
              <Text style={{ color: config.color, fontSize: 11, fontWeight: 600 }}>
                {config.text}
              </Text>
            </div>
          </Tooltip>
        );
      },
      filters: [
        { text: 'On Time', value: 'on-time' },
        { text: 'Late (Grace)', value: 'late-grace' },
        { text: 'Late (Penalty)', value: 'late-penalty' },
        { text: 'Absent', value: 'absent' }
      ],
      onFilter: (value, record) => record.status === value
    },
    {
      title: t('IP'),
      dataIndex: 'ip_address',
      key: 'ip',
      width: 140,
      render: (ip) => (
        <Space size={4}>
          <SafetyOutlined style={{ color: theme.info, fontSize: 11 }} />
          <Text style={{ color: theme.textSecondary, fontSize: 11, fontFamily: 'monospace' }}>
            {ip || '-'}
          </Text>
        </Space>
      )
    }
  ];

  return (
    <MainPage loading={isLoading || checkingIn}>
      <div
        className="min-h-screen p-4 md:p-6"
        style={{
          background: theme.background,
          backgroundColor: theme.background, // Explicit solid color override
          fontFamily: "'Khmer OS', 'Khmer OS System', 'Inter', sans-serif"
        }}
      >
        {/* Header */}
        <Card
          className="mb-6"
          style={{
            background: 'white',
            border: `1px solid ${theme.borderColor}`,
            borderRadius: 20,
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'
          }}
          bodyStyle={{ padding: 24 }}
        >
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={12}>
              <div className="flex items-center gap-4">
                <div
                  className="p-4 rounded-2xl"
                  style={{
                    background: theme.primary,
                    boxShadow: `0 4px 12px ${theme.primary}30`
                  }}
                >
                  <ClockCircleOutlined style={{ fontSize: 32, color: 'white' }} />
                </div>
                <div>
                  <Title level={2} style={{ color: theme.textPrimary, margin: 0, fontSize: 28 }}>
                    {t('Attendance System')}
                  </Title>
                  <Space size={12} style={{ marginTop: 8 }}>
                    <Badge
                      status={isIPAllowed ? "success" : "error"}
                      text={
                        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                          IP: {userIP}
                        </Text>
                      }
                    />
                    {ipInfo && (
                      <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                        <EnvironmentOutlined style={{ marginRight: 4 }} />
                        {ipInfo.description}
                      </Text>
                    )}
                  </Space>
                </div>
              </div>
            </Col>
            <Col xs={24} md={12} className="text-right">
              <div className="flex flex-col items-end gap-2">
                <Text style={{
                  color: theme.textPrimary,
                  fontSize: 24,
                  fontWeight: 600,
                  fontFamily: 'monospace'
                }}>
                  {currentTime.format('HH:mm:ss')}
                </Text>
                <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                  {currentTime.format('dddd, MMMM DD, YYYY')}
                </Text>
              </div>
            </Col>
          </Row>
        </Card>

        <Row gutter={[24, 24]}>
          {/* Check In/Out Widget */}
          <Col xs={24} lg={8}>
            <Card
              style={{
                background: 'white',
                border: `1px solid ${theme.borderColor}`,
                borderRadius: 20,
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
                minHeight: 520
              }}
              bodyStyle={{ padding: 24 }}
            >
              {/* User Info */}
              <div className="text-center mb-6">
                <Avatar
                  size={100}
                  style={{
                    background: theme.primary,
                    marginBottom: 16,
                    boxShadow: `0 4px 12px ${theme.primary}30`
                  }}
                >
                  <UserOutlined style={{ fontSize: 50 }} />
                </Avatar>
                <Title level={4} style={{ color: theme.textPrimary, marginBottom: 4 }}>
                  {profile?.name || 'User'}
                </Title>
                <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                  {profile?.role || 'Employee'}
                </Text>
              </div>

              {/* Today's Status */}
              <div className="mb-6">
                {todayAttendance ? (
                  <div>
                    <Timeline>
                      {/* Check In */}
                      <Timeline.Item
                        color={todayAttendance.status === 'on-time' ? theme.success :
                          todayAttendance.status === 'late-grace' ? theme.warning : theme.danger}
                        dot={todayAttendance.status === 'on-time' ? <CheckCircleOutlined /> :
                          todayAttendance.status === 'late-grace' ? <ClockCircleOutlined /> :
                            <WarningOutlined />}
                      >
                        <div style={{ marginBottom: 4 }}>
                          <Text style={{ color: theme.textPrimary, fontWeight: 600, fontSize: 14 }}>
                            {t('Checked In')}
                          </Text>
                          {todayAttendance.late_minutes > 0 && (
                            <Tag
                              style={{
                                marginLeft: 8,
                                background: todayAttendance.status === 'late-penalty' ?
                                  'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                border: 'none',
                                color: todayAttendance.status === 'late-penalty' ?
                                  theme.danger : theme.warning,
                                fontSize: 10
                              }}
                            >
                              +{todayAttendance.late_time_formatted?.en || `${todayAttendance.late_minutes} min`}
                            </Tag>
                          )}
                        </div>
                        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                          {moment(todayAttendance.check_in_time).format('HH:mm:ss')}
                        </Text>
                        {todayAttendance.scheduled_start_time && (
                          <div style={{ marginTop: 6, fontSize: 11, color: theme.textSecondary }}>
                            {t('Scheduled')}: {todayAttendance.scheduled_start_time}
                          </div>
                        )}
                      </Timeline.Item>

                      {/* Check Out */}
                      {todayAttendance.check_out_time ? (
                        <Timeline.Item
                          color={theme.success}
                          dot={<CheckCircleOutlined />}
                        >
                          <div style={{ marginBottom: 4 }}>
                            <Text style={{ color: theme.textPrimary, fontWeight: 600, fontSize: 14 }}>
                              {t('Checked Out')}
                            </Text>
                          </div>
                          <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                            {moment(todayAttendance.check_out_time).format('HH:mm:ss')}
                          </Text>
                          <div
                            style={{
                              marginTop: 12,
                              padding: 12,
                              background: 'rgba(16, 185, 129, 0.1)',
                              borderRadius: 10,
                              border: `1px solid ${theme.success}40`
                            }}
                          >
                            <Space direction="vertical" size={4} style={{ width: '100%' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                                  {t('Working Hours')}:
                                </Text>
                                <Text style={{ color: theme.success, fontSize: 14, fontWeight: 600 }}>
                                  {todayAttendance.working_hours}h
                                </Text>
                              </div>
                              {todayAttendance.early_departure_minutes && todayAttendance.early_departure_minutes !== 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Text style={{ color: theme.textSecondary, fontSize: 11 }}>
                                    {todayAttendance.early_departure_minutes > 0 ?
                                      t('Left Early') : t('Overtime')}:
                                  </Text>
                                  <Text style={{
                                    color: todayAttendance.early_departure_minutes > 0 ?
                                      theme.warning : theme.primary,
                                    fontSize: 11,
                                    fontWeight: 600
                                  }}>
                                    {todayAttendance.early_time_formatted?.en || `${Math.abs(todayAttendance.early_departure_minutes)} min`}
                                  </Text>
                                </div>
                              )}
                            </Space>
                          </div>
                        </Timeline.Item>
                      ) : (
                        <Timeline.Item
                          color={theme.textSecondary}
                          dot={<ClockCircleOutlined />}
                        >
                          <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                            {t('Still working...')}
                          </Text>
                          <div style={{
                            marginTop: 8,
                            padding: 8,
                            background: 'rgba(59, 130, 246, 0.1)',
                            borderRadius: 8,
                            border: `1px dashed ${theme.primary}40`
                          }}>
                            <Text style={{ color: theme.primary, fontSize: 11 }}>
                              <ThunderboltOutlined style={{ marginRight: 4 }} />
                              {t('Keep up the good work!')}
                            </Text>
                          </div>
                        </Timeline.Item>
                      )}
                    </Timeline>

                    {/* Status Badge */}
                    {todayAttendance.status && (
                      <div style={{ marginTop: 16, textAlign: 'center' }}>
                        {(() => {
                          const config = getStatusConfig(todayAttendance.status);
                          return (
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '8px 16px',
                              background: config.bgColor,
                              border: `2px solid ${config.color}40`,
                              borderRadius: 12
                            }}>
                              <span style={{ color: config.color, fontSize: 16 }}>
                                {config.icon}
                              </span>
                              <Text style={{ color: config.color, fontSize: 13, fontWeight: 600 }}>
                                {config.text}
                              </Text>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="text-center p-10"
                    style={{
                      background: 'rgba(59, 130, 246, 0.05)',
                      borderRadius: 16,
                      border: `2px dashed ${theme.primary}40`
                    }}
                  >
                    <ClockCircleOutlined
                      style={{
                        fontSize: 56,
                        color: theme.primary,
                        marginBottom: 16,
                        opacity: 0.5
                      }}
                    />
                    <Text style={{
                      display: 'block',
                      color: theme.textSecondary,
                      fontSize: 14,
                      marginBottom: 8
                    }}>
                      {t('Haven\'t checked in today')}
                    </Text>
                    <Text style={{
                      display: 'block',
                      color: theme.textSecondary,
                      fontSize: 12
                    }}>
                      {t('Ready to start your day?')}
                    </Text>
                  </div>
                )}
              </div>

              {/* Action Button */}
              {todayAttendance?.check_out_time ? (
                <div
                  className="text-center p-5"
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: 16,
                    border: `1px solid ${theme.success}40`
                  }}
                >
                  <TrophyOutlined
                    style={{
                      fontSize: 40,
                      color: theme.success,
                      marginBottom: 12
                    }}
                  />
                  <Text style={{
                    display: 'block',
                    color: theme.success,
                    fontWeight: 600,
                    fontSize: 18,
                    marginBottom: 4
                  }}>
                    {t('Work Complete!')}
                  </Text>
                  <Text style={{
                    display: 'block',
                    color: theme.textSecondary,
                    fontSize: 13
                  }}>
                    {t('Have a great evening!')} 🌙
                  </Text>
                </div>
              ) : todayAttendance?.check_in_time ? (
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<LogoutOutlined />}
                  onClick={handleCheckOut}
                  loading={checkingIn}
                  style={{
                    background: theme.danger,
                    border: 'none',
                    height: 60,
                    borderRadius: 16,
                    fontSize: 17,
                    fontWeight: 600,
                    boxShadow: `0 6px 20px ${theme.danger}40`
                  }}
                >
                  {t('Check Out')} 👋
                </Button>
              ) : (
                <>
                  <Button
                    type="primary"
                    size="large"
                    block
                    icon={<LoginOutlined />}
                    onClick={handleCheckIn}
                    loading={checkingIn}
                    disabled={!isIPAllowed}
                    style={{
                      background: isIPAllowed ? theme.success : '#94a3b8',
                      border: 'none',
                      height: 60,
                      borderRadius: 16,
                      fontSize: 17,
                      fontWeight: 600,
                      boxShadow: isIPAllowed ? `0 6px 20px ${theme.success}40` : 'none'
                    }}
                  >
                    {t('Check In')} ✓
                  </Button>

                  {!isIPAllowed && (
                    <div
                      className="mt-4 p-4 text-center"
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        borderRadius: 12,
                        border: `1px solid ${theme.danger}40`
                      }}
                    >
                      <WarningOutlined style={{
                        color: theme.danger,
                        marginRight: 8,
                        fontSize: 16
                      }} />
                      <Text style={{ color: theme.danger, fontSize: 13 }}>
                        {t('IP not allowed. Contact admin.')}
                      </Text>
                    </div>
                  )}
                </>
              )}
            </Card>
          </Col>

          {/* Statistics & Table */}
          <Col xs={24} lg={16}>
            {/* Stats Cards */}
            <Row gutter={[16, 16]} className="mb-4">
              <Col xs={12} sm={6}>
                <Card
                  style={{
                    background: 'white',
                    border: `1px solid ${theme.success}30`,
                    borderRadius: 16,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
                  }}
                  bodyStyle={{ padding: 16 }}
                >
                  <Statistic
                    title={
                      <span style={{ color: theme.textSecondary, fontSize: 12 }}>
                        <CheckCircleOutlined style={{ marginRight: 6 }} />
                        {t('On Time')}
                      </span>
                    }
                    value={statistics.on_time}
                    valueStyle={{ color: theme.success, fontSize: 28, fontWeight: 700 }}
                  />
                </Card>
              </Col>

              <Col xs={12} sm={6}>
                <Card
                  style={{
                    background: 'white',
                    border: `1px solid ${theme.warning}30`,
                    borderRadius: 16,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
                  }}
                  bodyStyle={{ padding: 16 }}
                >
                  <Statistic
                    title={
                      <span style={{ color: theme.textSecondary, fontSize: 12 }}>
                        <ClockCircleOutlined style={{ marginRight: 6 }} />
                        {t('Late (Grace)')}
                      </span>
                    }
                    value={statistics.late_grace}
                    valueStyle={{ color: theme.warning, fontSize: 28, fontWeight: 700 }}
                  />
                </Card>
              </Col>

              <Col xs={12} sm={6}>
                <Card
                  style={{
                    background: 'white',
                    border: `1px solid ${theme.danger}30`,
                    borderRadius: 16,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
                  }}
                  bodyStyle={{ padding: 16 }}
                >
                  <Statistic
                    title={
                      <span style={{ color: theme.textSecondary, fontSize: 12 }}>
                        <WarningOutlined style={{ marginRight: 6 }} />
                        {t('Late (Penalty)')}
                      </span>
                    }
                    value={statistics.late_penalty}
                    valueStyle={{ color: theme.danger, fontSize: 28, fontWeight: 700 }}
                  />
                </Card>
              </Col>

              <Col xs={12} sm={6}>
                <Card
                  style={{
                    background: 'white',
                    border: `1px solid ${theme.textSecondary}30`,
                    borderRadius: 16,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
                  }}
                  bodyStyle={{ padding: 16 }}
                >
                  <Statistic
                    title={
                      <span style={{ color: theme.textSecondary, fontSize: 12 }}>
                        <CloseCircleOutlined style={{ marginRight: 6 }} />
                        {t('Absent')}
                      </span>
                    }
                    value={statistics.absent}
                    valueStyle={{ color: theme.textSecondary, fontSize: 28, fontWeight: 700 }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Punctuality Insights */}
            <Card
              style={{
                background: 'white',
                border: `1px solid ${theme.borderColor}`,
                borderRadius: 16,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
                marginBottom: 16
              }}
              bodyStyle={{ padding: 20 }}
            >
              <Row gutter={[24, 16]} align="middle">
                <Col xs={24} md={12}>
                  <div>
                    <Text style={{ color: theme.textSecondary, fontSize: 13, display: 'block', marginBottom: 8 }}>
                      <FireOutlined style={{ marginRight: 6, color: theme.primary }} />
                      {t('Punctuality Rate')}
                    </Text>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <Text style={{ color: theme.primary, fontSize: 36, fontWeight: 700 }}>
                        {getPunctualityRate()}%
                      </Text>
                      <Text style={{ color: theme.textSecondary, fontSize: 14 }}>
                        / 100%
                      </Text>
                    </div>
                    <Progress
                      percent={parseFloat(getPunctualityRate())}
                      showInfo={false}
                      strokeColor={{
                        '0%': theme.danger,
                        '50%': theme.warning,
                        '100%': theme.success
                      }}
                      trailColor={`${theme.borderColor}40`}
                      style={{ marginTop: 12 }}
                    />
                  </div>
                </Col>

                <Col xs={24} md={12}>
                  <Row gutter={[16, 12]}>
                    <Col span={12}>
                      <div style={{
                        padding: 12,
                        background: 'rgba(59, 130, 246, 0.1)',
                        borderRadius: 12,
                        border: `1px solid ${theme.primary}40`
                      }}>
                        <Text style={{ color: theme.textSecondary, fontSize: 11, display: 'block' }}>
                          {t('Avg Late')}
                        </Text>
                        <Text style={{ color: theme.primary, fontSize: 18, fontWeight: 600 }}>
                          {statistics.avg_late_minutes} min
                        </Text>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{
                        padding: 12,
                        background: 'rgba(239, 68, 68, 0.1)',
                        borderRadius: 12,
                        border: `1px solid ${theme.danger}40`
                      }}>
                        <Text style={{ color: theme.textSecondary, fontSize: 11, display: 'block' }}>
                          {t('Total Late')}
                        </Text>
                        <Text style={{ color: theme.danger, fontSize: 18, fontWeight: 600 }}>
                          {statistics.total_late_minutes} min
                        </Text>
                      </div>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Card>

            {/* Filters */}
            <Card
              style={{
                background: 'white',
                border: `1px solid ${theme.borderColor}`,
                borderRadius: 16,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
                marginBottom: 16
              }}
              bodyStyle={{ padding: 16 }}
            >
              <Row gutter={[12, 12]} align="middle">
                <Col xs={24} sm={10}>
                  <RangePicker
                    value={dateRange}
                    onChange={setDateRange}
                    format="YYYY-MM-DD"
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col xs={24} sm={6}>
                  <Select
                    value={statusFilter}
                    onChange={setStatusFilter}
                    style={{ width: '100%' }}
                  >
                    <Option value="all">{t('All Status')}</Option>
                    <Option value="on-time">{t('On Time')}</Option>
                    <Option value="late-grace">{t('Late (Grace)')}</Option>
                    <Option value="late-penalty">{t('Late (Penalty)')}</Option>
                    <Option value="absent">{t('Absent')}</Option>
                  </Select>
                </Col>
                <Col xs={24} sm={8}>
                  <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={fetchAttendanceList}
                      loading={isLoading}
                    >
                      {t('Refresh')}
                    </Button>
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      onClick={handleExportExcel}
                      style={{
                        background: theme.primary,
                        border: 'none',
                        boxShadow: `0 4px 12px ${theme.primary}40`
                      }}
                    >
                      {t('Export')}
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Card>

            {/* Table */}
            <Card
              style={{
                background: 'white',
                border: `1px solid ${theme.borderColor}`,
                borderRadius: 16,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
              }}
              bodyStyle={{ padding: 16 }}
            >
              <div className="flex justify-between items-center mb-4">
                <Title level={5} style={{ color: theme.textPrimary, margin: 0 }}>
                  {t('Attendance Records')}
                </Title>
                <Badge
                  count={attendanceList.length}
                  style={{ background: theme.primary }}
                  overflowCount={999}
                />
              </div>

              <Table
                columns={columns}
                dataSource={attendanceList}
                rowKey={(record) => record.id || Math.random()}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => (
                    <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                      {t('Total')}: {total} {t('records')}
                    </Text>
                  ),
                  pageSizeOptions: ['5', '10', '20', '50']
                }}
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <span style={{ color: theme.textSecondary }}>
                          {t('No attendance records')}
                        </span>
                      }
                    />
                  )
                }}
                scroll={{ x: 1200 }}
              />
            </Card>
          </Col>
        </Row>

        {/* Global Styles */}
        <style jsx global>{`
        .ant-table {
          background: transparent !important;
        }
        .ant-table-thead > tr > th {
          background: ${theme.cardBg} !important;
          color: ${theme.textSecondary} !important;
          border-bottom: 1px solid ${theme.borderColor} !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          padding: 12px 16px !important;
        }
        .ant-table-tbody > tr > td {
          background: transparent !important;
          border-bottom: 1px solid ${theme.borderColor}60 !important;
          padding: 14px 16px !important;
        }
        .ant-table-tbody > tr:hover > td {
          background: var(--primary-light, rgba(59, 130, 246, 0.05)) !important;
        }
        .ant-pagination {
          margin-top: 16px !important;
        }
        .ant-pagination-item {
          background: ${theme.cardBg} !important;
          border-color: ${theme.borderColor} !important;
        }
        .ant-pagination-item a {
          color: ${theme.textPrimary} !important;
        }
        .ant-pagination-item-active {
          border-color: ${theme.primary} !important;
          background: ${theme.primary}20 !important;
        }
        .ant-pagination-item-active a {
          color: ${theme.primary} !important;
        }
        .ant-picker {
          background: ${theme.cardBg} !important;
          border-color: ${theme.borderColor} !important;
        }
        .ant-picker-input > input {
          color: ${theme.textPrimary} !important;
        }
        .ant-select-selector {
          background: ${theme.cardBg} !important;
          border-color: ${theme.borderColor} !important;
          color: ${theme.textPrimary} !important;
        }
        .ant-select-arrow {
          color: ${theme.textSecondary} !important;
        }
        .ant-modal-content {
          background: ${theme.cardBg} !important;
        }
        .ant-modal-header {
          background: ${theme.cardBg} !important;
          border-bottom-color: ${theme.borderColor} !important;
        }
        .ant-modal-title {
          color: ${theme.textPrimary} !important;
        }
        .ant-btn-default {
          background: ${theme.cardBg} !important;
          border-color: ${theme.borderColor} !important;
          color: ${theme.textPrimary} !important;
        }
        .ant-btn-default:hover {
          border-color: ${theme.primary} !important;
          color: ${theme.primary} !important;
        }
      `}</style>
      </div>
    </MainPage>
  );
}

export default AttendanceManagement;