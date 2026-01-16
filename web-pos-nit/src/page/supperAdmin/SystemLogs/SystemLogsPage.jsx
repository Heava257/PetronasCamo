import React, { useState, useEffect } from 'react';
import { 
  Tabs, Table, Tag, Space, Button, Select, DatePicker, Input,
  Card, Statistic, Row, Col, Modal, Tooltip, Badge, message,
  Popconfirm
} from 'antd';
import {
  FileTextOutlined,
  LoginOutlined,
  UserOutlined,
  BarChartOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  LaptopOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Mock request function - replace with your actual API helper
const request = async (url, method = 'get', data = null) => {
  // Replace this with your actual API request function
  const response = await fetch(`/api/${url}`, {
    method: method.toUpperCase(),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: data ? JSON.stringify(data) : null
  });
  return response.json();
};

const SystemLogsPage = () => {
  const [activeTab, setActiveTab] = useState('system');
  const [loading, setLoading] = useState(false);
  const [systemLogs, setSystemLogs] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 50,
    total: 0
  });

  // Filters
  const [filters, setFilters] = useState({
    log_type: null,
    severity: null,
    status: null,
    date_range: null,
    search: '',
    days: 7
  });

  useEffect(() => {
    if (activeTab === 'system') fetchSystemLogs();
    else if (activeTab === 'login') fetchLoginHistory();
    else if (activeTab === 'activity') fetchUserActivity();
    else if (activeTab === 'stats') fetchStats();
  }, [activeTab, pagination.current_page, filters]);

  const fetchSystemLogs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.current_page,
        limit: pagination.per_page,
        ...(filters.log_type && { log_type: filters.log_type }),
        ...(filters.severity && { severity: filters.severity }),
        ...(filters.search && { search: filters.search }),
        ...(filters.date_range && {
          start_date: filters.date_range[0].format('YYYY-MM-DD'),
          end_date: filters.date_range[1].format('YYYY-MM-DD')
        })
      });

      const res = await request(`logs/system?${queryParams}`);
      if (res.success) {
        setSystemLogs(res.logs);
        setPagination(res.pagination);
      }
    } catch (error) {
      message.error('មិនអាចទាញ system logs បានទេ');
    } finally {
      setLoading(false);
    }
  };

  const fetchLoginHistory = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.current_page,
        limit: pagination.per_page,
        ...(filters.status && { status: filters.status }),
        ...(filters.date_range && {
          start_date: filters.date_range[0].format('YYYY-MM-DD'),
          end_date: filters.date_range[1].format('YYYY-MM-DD')
        })
      });

      const res = await request(`logs/login-history?${queryParams}`);
      if (res.success) {
        setLoginHistory(res.history);
        setPagination(res.pagination);
      }
    } catch (error) {
      message.error('មិនអាចទាញ login history បានទេ');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserActivity = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.current_page,
        limit: pagination.per_page,
        ...(filters.date_range && {
          start_date: filters.date_range[0].format('YYYY-MM-DD'),
          end_date: filters.date_range[1].format('YYYY-MM-DD')
        })
      });

      const res = await request(`logs/user-activity?${queryParams}`);
      if (res.success) {
        setUserActivity(res.activities);
        setPagination(res.pagination);
      }
    } catch (error) {
      message.error('មិនអាចទាញ user activity បានទេ');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await request(`logs/stats?days=${filters.days}`);
      if (res.success) {
        setStats(res.stats);
      }
    } catch (error) {
      message.error('មិនអាចទាញ statistics បានទេ');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async (days) => {
    try {
      const res = await request('logs/cleanup', 'post', { days });
      if (res.success) {
        message.success(`លុប logs ចាស់ជាង ${days} ថ្ងៃបានជោគជ័យ`);
        if (activeTab === 'system') fetchSystemLogs();
      }
    } catch (error) {
      message.error('មិនអាចលុប logs បានទេ');
    }
  };

  const getSeverityTag = (severity) => {
    const colors = {
      info: 'blue',
      warning: 'orange',
      error: 'red',
      critical: 'red'
    };
    return <Tag color={colors[severity]}>{severity?.toUpperCase()}</Tag>;
  };

  const getStatusTag = (status) => {
    const colors = {
      success: 'green',
      failed: 'red',
      'failed - wrong password': 'orange',
      'failed - account inactive': 'red'
    };
    return <Tag color={colors[status] || 'default'}>{status}</Tag>;
  };

  const getLogTypeTag = (type) => {
    const colors = {
      LOGIN: 'blue',
      LOGOUT: 'purple',
      CREATE: 'green',
      UPDATE: 'orange',
      DELETE: 'red',
      ERROR: 'red',
      NOTIFICATION: 'cyan',
      SECURITY: 'magenta'
    };
    return <Tag color={colors[type]}>{type}</Tag>;
  };

  const systemLogsColumns = [
    {
      title: 'ពេលវេលា',
      dataIndex: 'created_at',
      width: 180,
      render: (date) => (
        <Tooltip title={dayjs(date).format('YYYY-MM-DD HH:mm:ss')}>
          <Space>
            <ClockCircleOutlined />
            {dayjs(date).fromNow()}
          </Space>
        </Tooltip>
      )
    },
    {
      title: 'ប្រភេទ',
      dataIndex: 'log_type',
      width: 120,
      render: (type) => getLogTypeTag(type)
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      width: 100,
      render: (severity) => getSeverityTag(severity)
    },
    {
      title: 'អ្នកប្រើប្រាស់',
      dataIndex: 'username',
      width: 150,
      render: (username, record) => (
        <Space>
          <UserOutlined />
          {username || record.user_name || 'System'}
        </Space>
      )
    },
    {
      title: 'សកម្មភាព',
      dataIndex: 'action',
      ellipsis: true
    },
    {
      title: 'IP Address',
      dataIndex: 'ip_address',
      width: 140,
      render: (ip) => (
        <Space>
          <GlobalOutlined />
          {ip || 'N/A'}
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 100,
      render: (status) => getStatusTag(status)
    },
    {
      title: 'សកម្មភាព',
      width: 80,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => showLogDetails(record)}
        >
          មើល
        </Button>
      )
    }
  ];

  const loginHistoryColumns = [
    {
      title: 'ពេលវេលា',
      dataIndex: 'login_time',
      width: 180,
      render: (date) => (
        <Tooltip title={dayjs(date).format('YYYY-MM-DD HH:mm:ss')}>
          {dayjs(date).fromNow()}
        </Tooltip>
      )
    },
    {
      title: 'អ្នកប្រើប្រាស់',
      dataIndex: 'user_name',
      width: 150,
      render: (name, record) => (
        <Space>
          <UserOutlined />
          {name} ({record.username})
        </Space>
      )
    },
    {
      title: 'តួនាទី',
      dataIndex: 'role_name',
      width: 120
    },
    {
      title: 'IP Address',
      dataIndex: 'ip_address',
      width: 140,
      render: (ip) => (
        <Space>
          <GlobalOutlined />
          {ip}
        </Space>
      )
    },
    {
      title: 'Device',
      dataIndex: 'device_info',
      width: 200,
      render: (deviceInfo) => {
        if (!deviceInfo) return 'N/A';
        return (
          <Space>
            <LaptopOutlined />
            {deviceInfo.platform} - {deviceInfo.browser}
          </Space>
        );
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 150,
      render: (status) => getStatusTag(status)
    }
  ];

  const activityColumns = [
    {
      title: 'ពេលវេលា',
      dataIndex: 'created_at',
      width: 180,
      render: (date) => dayjs(date).fromNow()
    },
    {
      title: 'អ្នកប្រើប្រាស់',
      dataIndex: 'user_name',
      width: 150,
      render: (name, record) => `${name} (${record.username})`
    },
    {
      title: 'ប្រភេទសកម្មភាព',
      dataIndex: 'action_type',
      width: 180,
      render: (type) => <Tag color="blue">{type}</Tag>
    },
    {
      title: 'ការពិពណ៌នា',
      dataIndex: 'action_description',
      ellipsis: true
    },
    {
      title: 'IP Address',
      dataIndex: 'ip_address',
      width: 140
    }
  ];

  const showLogDetails = (log) => {
    Modal.info({
      title: 'ព័ត៌មានលម្អិត Log',
      width: 700,
      content: (
        <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
          <p><strong>Log Type:</strong> {log.log_type}</p>
          <p><strong>Severity:</strong> {getSeverityTag(log.severity)}</p>
          <p><strong>អ្នកប្រើប្រាស់:</strong> {log.username || 'System'}</p>
          <p><strong>សកម្មភាព:</strong> {log.action}</p>
          <p><strong>ការពិពណ៌នា:</strong> {log.description || 'N/A'}</p>
          <p><strong>IP Address:</strong> {log.ip_address || 'N/A'}</p>
          <p><strong>Status:</strong> {getStatusTag(log.status)}</p>
          <p><strong>ពេលវេលា:</strong> {dayjs(log.created_at).format('YYYY-MM-DD HH:mm:ss')}</p>
          
          {log.device_info && (
            <>
              <p><strong>Device Info:</strong></p>
              <pre style={{ background: '#f5f5f5', padding: 10, borderRadius: 4 }}>
                {JSON.stringify(log.device_info, null, 2)}
              </pre>
            </>
          )}
          
          {log.error_message && (
            <>
              <p><strong>Error Message:</strong></p>
              <pre style={{ background: '#fff1f0', padding: 10, borderRadius: 4, color: 'red' }}>
                {log.error_message}
              </pre>
            </>
          )}
        </div>
      )
    });
  };

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      <Card>
        <h1 style={{ marginBottom: 24 }}>
          <FileTextOutlined /> System Logs & Activity
        </h1>

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* System Logs Tab */}
          <TabPane
            tab={<span><FileTextOutlined /> System Logs</span>}
            key="system"
          >
            <Space style={{ marginBottom: 16 }} wrap>
              <Select
                placeholder="ជ្រើសរើសប្រភេទ Log"
                style={{ width: 180 }}
                allowClear
                value={filters.log_type}
                onChange={(val) => setFilters({ ...filters, log_type: val })}
              >
                <Option value="LOGIN">LOGIN</Option>
                <Option value="LOGOUT">LOGOUT</Option>
                <Option value="CREATE">CREATE</Option>
                <Option value="UPDATE">UPDATE</Option>
                <Option value="DELETE">DELETE</Option>
                <Option value="ERROR">ERROR</Option>
                <Option value="NOTIFICATION">NOTIFICATION</Option>
                <Option value="SECURITY">SECURITY</Option>
              </Select>

              <Select
                placeholder="ជ្រើសរើស Severity"
                style={{ width: 150 }}
                allowClear
                value={filters.severity}
                onChange={(val) => setFilters({ ...filters, severity: val })}
              >
                <Option value="info">Info</Option>
                <Option value="warning">Warning</Option>
                <Option value="error">Error</Option>
                <Option value="critical">Critical</Option>
              </Select>

              <RangePicker
                value={filters.date_range}
                onChange={(dates) => setFilters({ ...filters, date_range: dates })}
              />

              <Input
                placeholder="ស្វែងរក..."
                prefix={<SearchOutlined />}
                style={{ width: 250 }}
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />

              <Button icon={<ReloadOutlined />} onClick={fetchSystemLogs}>
                Refresh
              </Button>

              <Popconfirm
                title="លុប logs ចាស់?"
                description="តើអ្នកចង់លុប logs ចាស់ជាង 90 ថ្ងៃមែនទេ?"
                onConfirm={() => handleCleanup(90)}
                okText="យល់ព្រម"
                cancelText="បោះបង់"
              >
                <Button icon={<DeleteOutlined />} danger>
                  លុប Logs ចាស់
                </Button>
              </Popconfirm>
            </Space>

            <Table
              columns={systemLogsColumns}
              dataSource={systemLogs}
              loading={loading}
              rowKey="id"
              pagination={{
                current: pagination.current_page,
                pageSize: pagination.per_page,
                total: pagination.total,
                showSizeChanger: true,
                showTotal: (total) => `សរុប ${total} records`
              }}
              onChange={(pag) => setPagination({ ...pagination, current_page: pag.current })}
              scroll={{ x: 1200 }}
            />
          </TabPane>

          {/* Login History Tab */}
          <TabPane
            tab={<span><LoginOutlined /> Login History</span>}
            key="login"
          >
            <Space style={{ marginBottom: 16 }} wrap>
              <Select
                placeholder="ជ្រើសរើស Status"
                style={{ width: 180 }}
                allowClear
                value={filters.status}
                onChange={(val) => setFilters({ ...filters, status: val })}
              >
                <Option value="success">Success</Option>
                <Option value="failed">Failed</Option>
              </Select>

              <RangePicker
                value={filters.date_range}
                onChange={(dates) => setFilters({ ...filters, date_range: dates })}
              />

              <Button icon={<ReloadOutlined />} onClick={fetchLoginHistory}>
                Refresh
              </Button>
            </Space>

            <Table
              columns={loginHistoryColumns}
              dataSource={loginHistory}
              loading={loading}
              rowKey="id"
              pagination={{
                current: pagination.current_page,
                pageSize: pagination.per_page,
                total: pagination.total,
                showTotal: (total) => `សរុប ${total} records`
              }}
              onChange={(pag) => setPagination({ ...pagination, current_page: pag.current })}
              scroll={{ x: 1000 }}
            />
          </TabPane>

          {/* User Activity Tab */}
          <TabPane
            tab={<span><UserOutlined /> User Activity</span>}
            key="activity"
          >
            <Space style={{ marginBottom: 16 }} wrap>
              <RangePicker
                value={filters.date_range}
                onChange={(dates) => setFilters({ ...filters, date_range: dates })}
              />

              <Button icon={<ReloadOutlined />} onClick={fetchUserActivity}>
                Refresh
              </Button>
            </Space>

            <Table
              columns={activityColumns}
              dataSource={userActivity}
              loading={loading}
              rowKey="id"
              pagination={{
                current: pagination.current_page,
                pageSize: pagination.per_page,
                total: pagination.total,
                showTotal: (total) => `សរុប ${total} records`
              }}
              onChange={(pag) => setPagination({ ...pagination, current_page: pag.current })}
            />
          </TabPane>

          {/* Statistics Tab */}
          <TabPane
            tab={<span><BarChartOutlined /> Statistics</span>}
            key="stats"
          >
            <Space style={{ marginBottom: 16 }}>
              <Select
                value={filters.days}
                onChange={(val) => setFilters({ ...filters, days: val })}
                style={{ width: 200 }}
              >
                <Option value={1}>Last 24 Hours</Option>
                <Option value={7}>Last 7 Days</Option>
                <Option value={30}>Last 30 Days</Option>
                <Option value={90}>Last 90 Days</Option>
              </Select>

              <Button icon={<ReloadOutlined />} onClick={fetchStats}>
                Refresh
              </Button>
            </Space>

            {stats && (
              <>
                <Row gutter={16} style={{ marginBottom: 24 }}>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="Active Users"
                        value={stats.active_users}
                        prefix={<UserOutlined />}
                      />
                    </Card>
                  </Col>
                  {stats.logs_by_severity.map((item) => (
                    <Col span={6} key={item.severity}>
                      <Card>
                        <Statistic
                          title={item.severity.toUpperCase()}
                          value={item.count}
                          valueStyle={{ 
                            color: item.severity === 'error' || item.severity === 'critical' 
                              ? '#cf1322' 
                              : item.severity === 'warning' 
                              ? '#fa8c16' 
                              : '#3f8600' 
                          }}
                          prefix={<ExclamationCircleOutlined />}
                        />
                      </Card>
                    </Col>
                  ))}
                </Row>

                <Card title="Recent Errors" style={{ marginBottom: 16 }}>
                  <Table
                    columns={systemLogsColumns}
                    dataSource={stats.recent_errors}
                    rowKey="id"
                    pagination={false}
                    size="small"
                  />
                </Card>

                <Row gutter={16}>
                  <Col span={12}>
                    <Card title="Logs by Type">
                      {stats.logs_by_type.map((item) => (
                        <div key={item.log_type} style={{ marginBottom: 8 }}>
                          {getLogTypeTag(item.log_type)}
                          <Badge count={item.count} showZero style={{ marginLeft: 8 }} />
                        </div>
                      ))}
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title="Login Statistics">
                      {stats.login_stats.map((item) => (
                        <div key={item.status} style={{ marginBottom: 8 }}>
                          {getStatusTag(item.status)}
                          <Badge count={item.count} showZero style={{ marginLeft: 8 }} />
                        </div>
                      ))}
                    </Card>
                  </Col>
                </Row>
              </>
            )}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default SystemLogsPage;