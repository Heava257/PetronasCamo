import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Space,
  Select,
  DatePicker,
  Button,
  Progress,
  Timeline,
  Empty,
} from 'antd';
import {
  BellOutlined,
  ShopOutlined,
  UserOutlined,
  DollarOutlined,
  FileTextOutlined,
  ReloadOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  FireOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { request } from '../../../util/helper';

const { RangePicker } = DatePicker;
const { Option } = Select;

function NotificationStatistics() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});
  const [branchStats, setBranchStats] = useState([]);
  const [creatorStats, setCreatorStats] = useState([]);
  const [typeStats, setTypeStats] = useState([]);
  const [timelineData, setTimelineData] = useState([]);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'days'),
    dayjs()
  ]);

  useEffect(() => {
    fetchStatistics();
  }, [dateRange]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      
      // ✅ Fetch overall stats using request() helper
      const statsRes = await request('notifications/stats', 'get');
      if (statsRes && statsRes.success) {
        setStats(statsRes.stats || {});
      }

      // ✅ Fetch detailed analytics using request() helper
      const analyticsRes = await request('notifications/analytics', 'get', {
        from_date: dateRange[0].format('YYYY-MM-DD'),
        to_date: dateRange[1].format('YYYY-MM-DD')
      });
      
      if (analyticsRes && analyticsRes.success) {
        setBranchStats(analyticsRes.branch_stats || []);
        setCreatorStats(analyticsRes.creator_stats || []);
        setTypeStats(analyticsRes.type_stats || []);
        setTimelineData(analyticsRes.timeline || []);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const branchColumns = [
    {
      title: 'សាខា / Branch',
      dataIndex: 'branch_name',
      key: 'branch',
      render: (text) => (
        <Tag color="purple" icon={<ShopOutlined />} className="font-semibold">
          {text || 'N/A'}
        </Tag>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'total_notifications',
      key: 'total',
      align: 'center',
      render: (val) => <span className="font-bold">{val}</span>,
      sorter: (a, b) => b.total_notifications - a.total_notifications,
    },
    {
      title: 'Unread',
      dataIndex: 'unread_count',
      key: 'unread',
      align: 'center',
      render: (val) => (
        <Tag color={val > 0 ? 'red' : 'green'}>
          {val}
        </Tag>
      ),
    },
    {
      title: 'Orders',
      dataIndex: 'order_count',
      key: 'orders',
      align: 'center',
      render: (val) => <Tag color="green">{val}</Tag>,
    },
    {
      title: 'Payments',
      dataIndex: 'payment_count',
      key: 'payments',
      align: 'center',
      render: (val) => <Tag color="blue">{val}</Tag>,
    },
    {
      title: 'Total Amount',
      dataIndex: 'total_amount',
      key: 'amount',
      align: 'right',
      render: (val) => (
        <span className="font-bold text-green-600">
          ${Number(val || 0).toLocaleString()}
        </span>
      ),
      sorter: (a, b) => (b.total_amount || 0) - (a.total_amount || 0),
    },
    {
      title: 'Activity',
      key: 'activity',
      align: 'center',
      render: (_, record) => {
        const percentage = stats.total > 0 
          ? ((record.total_notifications / stats.total) * 100).toFixed(1)
          : 0;
        return (
          <div className="w-24">
            <Progress
              percent={parseFloat(percentage)}
              size="small"
              format={(percent) => `${percent}%`}
            />
          </div>
        );
      },
    },
  ];

  const creatorColumns = [
    {
      title: 'Created By',
      dataIndex: 'created_by',
      key: 'creator',
      render: (text) => (
        <Tag color="blue" icon={<UserOutlined />}>
          {text || 'System'}
        </Tag>
      ),
    },
    {
      title: 'Branch',
      dataIndex: 'branch_name',
      key: 'branch',
      render: (text) => (
        <Tag color="purple">
          {text || 'N/A'}
        </Tag>
      ),
    },
    {
      title: 'Total Created',
      dataIndex: 'notification_count',
      key: 'count',
      align: 'center',
      render: (val) => <span className="font-bold">{val}</span>,
      sorter: (a, b) => b.notification_count - a.notification_count,
      defaultSortOrder: 'descend',
    },
    {
      title: 'Last Created',
      dataIndex: 'last_created',
      key: 'last',
      render: (date) => (
        <span className="text-sm">
          {dayjs(date).format('DD-MM-YYYY HH:mm')}
        </span>
      ),
    },
  ];

  const typeColumns = [
    {
      title: 'Type',
      dataIndex: 'notification_type',
      key: 'type',
      render: (type) => {
        const colors = {
          order_created: 'green',
          payment_received: 'blue',
          stock_update: 'purple',
          alert: 'orange',
          error: 'red',
        };
        return (
          <Tag color={colors[type] || 'default'}>
            {type}
          </Tag>
        );
      },
    },
    {
      title: 'Count',
      dataIndex: 'count',
      key: 'count',
      align: 'center',
      render: (val) => <span className="font-bold text-lg">{val}</span>,
      sorter: (a, b) => b.count - a.count,
      defaultSortOrder: 'descend',
    },
    {
      title: 'Percentage',
      key: 'percentage',
      align: 'center',
      render: (_, record) => {
        const total = typeStats.reduce((sum, item) => sum + item.count, 0);
        const percentage = total > 0 ? ((record.count / total) * 100).toFixed(1) : 0;
        return (
          <div className="w-32">
            <Progress
              percent={parseFloat(percentage)}
              size="small"
              status="active"
            />
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <Card className="mb-4 shadow-lg bg-gradient-to-r from-purple-600 to-pink-600 border-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-white text-2xl md:text-3xl font-bold flex items-center gap-3">
              <BarChartOutlined />
              Notification Analytics
            </h1>
            <p className="text-white text-sm opacity-90 mt-1">
              ស្ថិតិ និង ការវិភាគលម្អិត / Detailed Statistics & Analytics
            </p>
          </div>
          <Space>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              format="DD-MM-YYYY"
              className="bg-white"
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchStatistics}
              loading={loading}
              className="bg-white text-purple-600"
            >
              Reload
            </Button>
          </Space>
        </div>
      </Card>

      {/* Overall Statistics */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={12} sm={8} lg={6}>
          <Card className="shadow-md text-center">
            <Statistic
              title="Total Notifications"
              value={stats.total || 0}
              prefix={<BellOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={6}>
          <Card className="shadow-md text-center">
            <Statistic
              title="Unread"
              value={stats.unread || 0}
              prefix={<FireOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={6}>
          <Card className="shadow-md text-center">
            <Statistic
              title="Read"
              value={stats.read || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={6}>
          <Card className="shadow-md text-center">
            <Statistic
              title="Orders"
              value={stats.orders || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={6}>
          <Card className="shadow-md text-center">
            <Statistic
              title="Payments"
              value={stats.payments || 0}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={6}>
          <Card className="shadow-md text-center">
            <Statistic
              title="Critical"
              value={stats.critical || 0}
              prefix={<FireOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Branch Statistics */}
      <Card
        title={
          <Space>
            <ShopOutlined className="text-purple-600" />
            <span>ស្ថិតិតាមសាខា / Statistics by Branch</span>
          </Space>
        }
        className="mb-4 shadow-md"
      >
        {branchStats.length === 0 ? (
          <Empty description="No branch data available" />
        ) : (
          <Table
            loading={loading}
            dataSource={branchStats}
            columns={branchColumns}
            rowKey="branch_name"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 900 }}
          />
        )}
      </Card>

      {/* Creator Statistics & Type Distribution */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <UserOutlined className="text-blue-600" />
                <span>ស្ថិតិតាមអ្នកបង្កើត / By Creator</span>
              </Space>
            }
            className="shadow-md h-full"
          >
            {creatorStats.length === 0 ? (
              <Empty description="No creator data" />
            ) : (
              <Table
                loading={loading}
                dataSource={creatorStats}
                columns={creatorColumns}
                rowKey={(record) => `${record.created_by}-${record.branch_name}`}
                pagination={{ pageSize: 5 }}
                size="small"
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <FileTextOutlined className="text-green-600" />
                <span>ស្ថិតិតាមប្រភេទ / By Type</span>
              </Space>
            }
            className="shadow-md h-full"
          >
            {typeStats.length === 0 ? (
              <Empty description="No type data" />
            ) : (
              <Table
                loading={loading}
                dataSource={typeStats}
                columns={typeColumns}
                rowKey="notification_type"
                pagination={false}
                size="small"
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Timeline */}
      <Card
        title={
          <Space>
            <ClockCircleOutlined className="text-orange-600" />
            <span>Recent Activity Timeline</span>
          </Space>
        }
        className="shadow-md"
      >
        {timelineData.length === 0 ? (
          <Empty description="No recent activity" />
        ) : (
          <Timeline
            items={timelineData.slice(0, 10).map((item) => ({
              color: item.is_read ? 'gray' : 'blue',
              children: (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold">{item.title}</span>
                    <span className="text-xs text-gray-500">
                      {dayjs(item.created_at).format('DD-MM HH:mm')}
                    </span>
                  </div>
                  <Space size={4} className="flex-wrap">
                    {item.branch_name && (
                      <Tag color="purple" className="text-xs">
                        <ShopOutlined /> {item.branch_name}
                      </Tag>
                    )}
                    <Tag color="blue" className="text-xs">
                      {item.notification_type}
                    </Tag>
                    {item.created_by && (
                      <Tag color="cyan" className="text-xs">
                        <UserOutlined /> {item.created_by}
                      </Tag>
                    )}
                  </Space>
                </div>
              ),
            }))}
          />
        )}
      </Card>
    </div>
  );
}

export default NotificationStatistics;