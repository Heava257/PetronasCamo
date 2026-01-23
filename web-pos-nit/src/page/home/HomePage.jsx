import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { request } from "../../util/helper";
import {
  Button, Card, Row, Col, Typography, Badge, Spin, Empty, DatePicker,
  message, Alert, Modal, Descriptions, Tag
} from "antd";
import {
  UserOutlined,
  DollarOutlined,
  TeamOutlined,
  TrophyOutlined,
  ShopOutlined,
  WalletOutlined,
  ReloadOutlined,
  CalendarOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  EyeOutlined,
  UsergroupAddOutlined,
  ArrowRightOutlined,
  PrinterOutlined
} from "@ant-design/icons";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { useTranslation } from "../../locales/TranslationContext";
import { getProfile } from "../../store/profile.store";
import { useSettings } from "../../settings/SettingsContext";
import moment from "moment";
import "./HomePage.css";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

function HomePage() {
  const { t } = useTranslation();
  const profile = getProfile();
  const navigate = useNavigate();
  const { isDarkMode } = useSettings();

  // State management
  const [dashboard, setDashboard] = useState([]);
  const [saleByMonth, setSaleByMonth] = useState([]);
  const [expenseByMonth, setExpenseByMonth] = useState([]);
  const [productByMonth, setProductByMonth] = useState([]);
  const [topSales, setTopSales] = useState([]);
  const [filterInfo, setFilterInfo] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [startDate, setStartDate] = useState(moment().startOf('year'));
  const [endDate, setEndDate] = useState(moment());
  const [profitByMonth, setProfitByMonth] = useState([]);
  const [dateRange, setDateRange] = useState([
    moment().startOf('year'),
    moment()
  ]);
  const [showDateWarning, setShowDateWarning] = useState(false);

  const COLORS = [
    '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
    '#ef4444', '#06b6d4', '#ec4899', '#84cc16'
  ];

  // Fetch data on mount
  useEffect(() => {
    getList();
  }, []);

  // Main API call
  const getList = async () => {
    setIsLoading(true);
    setShowDateWarning(false);

    try {
      let apiUrl = 'dashbaord';

      if (dateRange && dateRange[0] && dateRange[1]) {
        const formattedFromDate = dateRange[0].format('YYYY-MM-DD');
        const formattedToDate = dateRange[1].format('YYYY-MM-DD');
        apiUrl += `?from_date=${formattedFromDate}&to_date=${formattedToDate}`;

      }

      const res = await request(apiUrl, "get");


      if (res && !res.error) {
        setDashboard(res.dashboard || []);
        setFilterInfo(res.filter_info || null);
        setUserDetails(res.user_details || null);

        // Process Sale Summary
        if (res.Sale_Summary_By_Month && Array.isArray(res.Sale_Summary_By_Month)) {
          const saleData = res.Sale_Summary_By_Month.map(item => ({
            month: item.title,
            value: parseFloat(item.total) || 0
          }));
          setSaleByMonth(saleData);
        } else {
          setSaleByMonth([]);
        }

        // Process Expense Summary
        if (res.Expense_Summary_By_Month && Array.isArray(res.Expense_Summary_By_Month)) {
          const expenseData = res.Expense_Summary_By_Month.map(item => ({
            month: item.title,
            value: parseFloat(item.total) || 0
          }));
          setExpenseByMonth(expenseData);

          if (expenseData.length === 0 || expenseData.every(e => e.value === 0)) {
            setShowDateWarning(true);
          }
        } else {
          setExpenseByMonth([]);
        }
        if (res.Profit_Summary_By_Month && Array.isArray(res.Profit_Summary_By_Month)) {
          const profitData = res.Profit_Summary_By_Month.map(item => ({
            month: item.title,
            value: parseFloat(item.total) || 0
          }));
          setProfitByMonth(profitData);
        } else {
          setProfitByMonth([]);
        }

        // Process Product Summary
        if (res.Product_Summary_By_Month && Array.isArray(res.Product_Summary_By_Month)) {
          const productData = res.Product_Summary_By_Month.map(item => ({
            month: item.title,
            value: parseFloat(item.total) || 0
          }));
          setProductByMonth(productData);
        } else {
          setProductByMonth([]);
        }

        // Process Top Sales
        if (res.Top_Sale && Array.isArray(res.Top_Sale)) {
          const topSalesData = res.Top_Sale.map(item => ({
            name: item.category_name || 'Unknown',
            value: parseFloat(item.total_sale_amount) || 0,
            qty: parseInt(item.total_qty) || 0
          }));
          setTopSales(topSalesData);
        } else {
          setTopSales([]);
        }

        message.success(t('Dashboard loaded successfully!') || 'Dashboard loaded successfully!');
      } else {
        message.error(res.message || t('Failed to load dashboard data'));
      }
    } catch (error) {
      console.error("❌ Error fetching dashboard:", error);
      message.error(t('Failed to load dashboard data'));
    } finally {
      setIsLoading(false);
    }
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('អរុណសួស្តី') || t('Good morning');
    if (hour < 18) return t('ល្ងាចសួស្តី') || t('Good afternoon');
    return t('សាយ័ណសួស្តី') || t('Good evening');
  };

  const getProfitByMonth = () => {
    const profitData = profitByMonth.map(item => ({
      month: item.month,
      value: parseFloat(item.value) || 0
    }));
    return profitData;
  };
  // In HomePage.jsx - Add new title mapping
  const getCardIcon = (title) => {
    const iconMap = {
      'អ្នកប្រើប្រាស់': <TeamOutlined />,
      'អតិថិជន': <UserOutlined />,
      'ប្រព័ន្ធចំណាយទូទៅ': <WalletOutlined />,
      'ផលិតផល': <ShopOutlined />,
      'ផលិតផល / ស្តុក': <ShopOutlined />,  // ✅ បន្ថែមនេះ!
      'ការលក់': <TrophyOutlined />
    };
    return iconMap[title] || <DollarOutlined />;
  };

  const getCardRoute = (title) => {
    const routeMap = {
      'អ្នកប្រើប្រាស់': '/user',
      'អតិថិជន': '/customer',
      'ប្រព័ន្ធចំណាយទូទៅ': '/expense',
      'ផលិតផល': '/product',
      'ផលិតផល / ស្តុក': '/product',  // ✅ បន្ថែមនេះ!
      'ការលក់': '/order'
    };
    return routeMap[title] || '/';
  };
  // Get color scheme for cards
  const getCardColor = (index) => {
    const colors = [
      { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' },
      { bg: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' },
      { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' },
      { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' },
      { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }
    ];
    return colors[index % colors.length];
  };

  const calculateSatisfactionRate = () => {
    if (saleByMonth.length === 0) return 75;
    const totalSales = saleByMonth.reduce((sum, item) => sum + item.value, 0);
    const avgSales = totalSales / saleByMonth.length;
    const maxSales = Math.max(...saleByMonth.map(item => item.value), 1);
    return Math.min(Math.round((avgSales / maxSales) * 100), 100);
  };

  const calculateCustomerScore = () => {
    const customerCard = dashboard.find(d => d.title === 'អតិថិជន');
    if (!customerCard || !customerCard.Summary) return 5.0;

    const totalText = customerCard.Summary['សរុប'] || '0';
    const total = parseInt(totalText.replace(/\D/g, '')) || 0;

    return Math.min((total / 10).toFixed(1), 10);
  };

  const satisfactionRate = calculateSatisfactionRate();
  const customerScore = calculateCustomerScore();

  const satisfactionData = [{
    name: 'Satisfaction',
    value: satisfactionRate,
    fill: '#3b82f6'
  }];

  const customerScoreData = [{
    name: 'Score',
    value: (customerScore / 10) * 100,
    fill: '#10b981'
  }];

  const combinedData = saleByMonth.map((sale, index) => {
    const expense = expenseByMonth.find(e => e.month === sale.month) || { value: 0 };
    return {
      month: sale.month,
      sales: sale.value,
      expenses: expense.value,
      profit: sale.value - expense.value
    };
  });

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
    setShowDateWarning(false);
  };

  const handleFilter = () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      message.warning(t('Please select a date range'));
      return;
    }
    getList();
  };

  const handleQuickDateRange = (type) => {
    const today = moment();
    let newRange = [];

    switch (type) {
      case 'today':
        newRange = [today, today];
        break;
      case 'this_week':
        newRange = [moment().startOf('week'), today];
        break;
      case 'this_month':
        newRange = [moment().startOf('month'), today];
        break;
      case 'this_year':
        newRange = [moment().startOf('year'), today];
        break;
      case 'last_year':
        newRange = [moment().subtract(1, 'year').startOf('year'), moment().subtract(1, 'year').endOf('year')];
        break;
      case 'all_time':
        newRange = [moment('2020-01-01'), today];
        break;
      default:
        newRange = [moment().startOf('year'), today];
    }

    setDateRange(newRange);
    setTimeout(() => getList(), 100);
  };

  const handlePrint = () => {
    window.print();
  };

  const getMainValue = (summary) => {
    if (!summary) return '0';
    const firstKey = Object.keys(summary)[0];
    return summary[firstKey] || '0';
  };

  // Handle card click
  const handleCardClick = (title) => {
    // Special handling for user card - show modal
    if (title === 'អ្នកប្រើប្រាស់') {
      setShowUserModal(true);
      return;
    }

    const route = getCardRoute(title);
    navigate(route);
  };

  // Render User Details Modal
  const renderUserModal = () => {
    if (!userDetails) return null;

    return (
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UsergroupAddOutlined style={{ fontSize: 24, color: '#3b82f6' }} />
            <span>{t('អ្នកប្រើប្រាស់ប្រព័ន្ធ')} - {t('User Details')}</span>
          </div>
        }
        open={showUserModal}
        onCancel={() => setShowUserModal(false)}
        footer={[
          <Button key="navigate" type="primary" onClick={() => {
            setShowUserModal(false);
            navigate('/user');
          }}>
            {t('Go to User Management')}
          </Button>,
          <Button key="close" onClick={() => setShowUserModal(false)}>
            {t('Close')}
          </Button>
        ]}
        width={700}
      >
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label={t('Total Users')} span={2}>
            <Tag color="blue" style={{ fontSize: 16, padding: '4px 12px' }}>
              {userDetails.active_users} {t('Active Users')}
            </Tag>
            <Tag color="red" style={{ fontSize: 16, padding: '4px 12px', marginLeft: 8 }}>
              {userDetails.inactive_users} {t('Inactive')}
            </Tag>
          </Descriptions.Item>
        </Descriptions>

        <Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>
          👥 {t('Users by Role')}:
        </Title>

        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {userDetails.roles_breakdown && userDetails.roles_breakdown.map((role, index) => (
            <Card
              key={role.role_id}
              size="small"
              style={{ marginBottom: 8 }}
              bodyStyle={{ padding: '12px 16px' }}
            >
              <Row justify="space-between" align="middle">
                <Col>
                  <Text strong style={{ fontSize: 15 }}>
                    {role.role_name}
                  </Text>
                  <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                    ({role.role_code})
                  </Text>
                </Col>
                <Col>
                  <Badge
                    count={role.total_users}
                    style={{
                      backgroundColor: COLORS[index % COLORS.length],
                      fontSize: 14,
                      height: 24,
                      lineHeight: '24px',
                      minWidth: 24
                    }}
                  />
                </Col>
              </Row>

              {role.user_names && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
                  <UserOutlined style={{ marginRight: 4 }} />
                  {role.user_names.length > 100
                    ? role.user_names.substring(0, 100) + '...'
                    : role.user_names}
                </div>
              )}
            </Card>
          ))}
        </div>
      </Modal>
    );
  };

  return (
    <div className={`dashboard-container ${isDarkMode ? 'dark' : 'light'}`}>
      {/* User Details Modal */}
      {renderUserModal()}

      {/* Header with Filters */}
      <Card className="dashboard-header-card">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <div className="header-title-section">
              <div className="header-icon-wrapper">
                <FilterOutlined className="header-icon" />
              </div>
              <div>
                <Title level={3} className="header-title">
                  {t('ផ្ទាំងគ្រប់គ្រង')}
                </Title>
                {filterInfo && (
                  <Text className="header-subtitle">
                    📍 {filterInfo.branch}
                  </Text>
                )}
              </div>
            </div>
          </Col>

          <Col xs={24} md={16}>
            <Row gutter={[8, 8]} justify="end">
              <Col xs={24} sm={12}>
                <RangePicker
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col xs={8} sm={4}>
                <Button
                  type="primary"
                  icon={<CalendarOutlined />}
                  onClick={handleFilter}
                  loading={isLoading}
                  className="filter-button"
                  block
                >
                  {t('Filter')}
                </Button>
              </Col>
              <Col xs={8} sm={4}>
                <Button
                  icon={<PrinterOutlined />}
                  onClick={handlePrint}
                  className="print-button"
                  block
                >
                  {t('Print')}
                </Button>
              </Col>
              <Col xs={8} sm={4}>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={getList}
                  loading={isLoading}
                  className="refresh-button"
                  block
                >
                  {t('Refresh')}
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>

        {/* Quick Date Range Buttons */}
        <Row gutter={[8, 8]} style={{ marginTop: 16 }}>
          <Col>
            <Button size="small" onClick={() => handleQuickDateRange('today')}>
              {t('Today')}
            </Button>
          </Col>
          <Col>
            <Button size="small" onClick={() => handleQuickDateRange('this_week')}>
              {t('This Week')}
            </Button>
          </Col>
          <Col>
            <Button size="small" onClick={() => handleQuickDateRange('this_month')}>
              {t('This Month')}
            </Button>
          </Col>
          <Col>
            <Button size="small" onClick={() => handleQuickDateRange('this_year')}>
              {t('This Year')}
            </Button>
          </Col>
          <Col>
            <Button size="small" onClick={() => handleQuickDateRange('last_year')}>
              {t('Last Year')} (2025)
            </Button>
          </Col>
          <Col>
            <Button size="small" onClick={() => handleQuickDateRange('all_time')}>
              {t('All Time')}
            </Button>
          </Col>
        </Row>

        {filterInfo?.date_range_applied && (
          <div className="filter-info-banner">
            <Text className="filter-info-text">
              📅 {filterInfo.from_date} → {filterInfo.to_date}
              {filterInfo.is_super_admin && (
                <Badge
                  count="Super Admin"
                  className="admin-badge"
                  style={{ marginLeft: 8 }}
                />
              )}
            </Text>
          </div>
        )}

        {showDateWarning && (
          <Alert
            message={t('No data found for selected date range')}
            description={
              <>
                {t('Your expense data may be from a different year. Try selecting')}{' '}
                <Button
                  type="link"
                  size="small"
                  onClick={() => handleQuickDateRange('last_year')}
                  style={{ padding: 0 }}
                >
                  Last Year (2025)
                </Button>
                {' '}or{' '}
                <Button
                  type="link"
                  size="small"
                  onClick={() => handleQuickDateRange('all_time')}
                  style={{ padding: 0 }}
                >
                  All Time
                </Button>
              </>
            }
            type="warning"
            showIcon
            icon={<InfoCircleOutlined />}
            closable
            onClose={() => setShowDateWarning(false)}
            style={{ marginTop: 16 }}
          />
        )}
      </Card>

      {isLoading ? (
        <div className="loading-container">
          <Spin size="large" />
          <div className="loading-text">
            {t('កំពុងផ្ទុកទិន្នន័យ...')}
          </div>
        </div>
      ) : (
        <>
          {/* Top Metrics Cards */}
          <Row gutter={[24, 24]} className="metrics-row">
            {dashboard.map((item, index) => {
              const cardColor = getCardColor(index);
              const mainValue = getMainValue(item.Summary);
              const isUserCard = item.title === 'អ្នកប្រើប្រាស់';

              return (
                <Col xs={24} sm={12} lg={index < 4 ? 6 : 24} key={index}>
                  <Card
                    hoverable
                    className="metric-card"
                    onClick={() => handleCardClick(item.title)}
                  >
                    <div className="metric-card-header">
                      <div className="metric-card-content">
                        <Text className="metric-label">
                          {t(item.title)}
                          {isUserCard && userDetails && (
                            <EyeOutlined
                              style={{
                                marginLeft: 8,
                                fontSize: 12,
                                color: '#3b82f6',
                                cursor: 'pointer'
                              }}
                            />
                          )}
                        </Text>
                        <Title level={3} className="metric-value">
                          {typeof mainValue === 'string' ? mainValue.replace(/នាក់/g, t('People')).replace(/ប្រុស/g, t('Male')).replace(/ស្រី/g, t('Female')) : mainValue}
                        </Title>
                      </div>
                      <div
                        className="metric-icon-wrapper"
                        style={{ background: cardColor.bg }}
                      >
                        {React.cloneElement(getCardIcon(item.title), {
                          style: { fontSize: 20, color: cardColor.color }
                        })}
                      </div>
                    </div>

                    <div className="metric-card-footer">
                      {Object.entries(item.Summary).slice(1, 3).map(([key, value], idx) => (
                        <div key={idx} className="metric-detail-row">
                          <Text className="metric-detail-label">{t(key)}:</Text>
                          <Text className="metric-detail-value">
                            {typeof value === 'string' ? value.replace(/នាក់/g, t('People')).replace(/ប្រុស/g, t('Male')).replace(/ស្រី/g, t('Female')) : value}
                          </Text>
                        </div>
                      ))}

                      {/* Show "View All" for user card if more than 2 roles */}
                      {isUserCard && Object.keys(item.Summary).length > 3 && (
                        <div style={{ marginTop: 8, textAlign: 'center' }}>
                          <Button
                            type="link"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowUserModal(true);
                            }}
                          >
                            {t('View All')} {Object.keys(item.Summary).length - 1} {t('Roles')}
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>

          {/* Rest of the dashboard - Welcome, Gauges, Charts */}
          <Row gutter={[24, 24]} className="welcome-row">
            <Col xs={24} lg={12}>
              <Card className="welcome-card">
                <div className="welcome-bg-gradient" />
                <div className="welcome-content">
                  <Text className="welcome-greeting">
                    {getGreeting()},
                  </Text>
                  <Title level={2} className="welcome-name">
                    {profile?.name || 'User'}
                  </Title>
                  <Text className="welcome-message">
                    {t('Glad to see you again!')}
                    <br />
                    {t('Check your dashboard metrics below.')}
                  </Text>

                  {dashboard.length > 0 && (
                    <div className="welcome-stats">
                      <Row gutter={[12, 12]}>
                        <Col span={12}>
                          <Text className="welcome-stat-label">
                            {t('Total Records')}
                          </Text>
                          <div className="welcome-stat-value primary">
                            {dashboard.reduce((sum, item) => {
                              const val = getMainValue(item.Summary);
                              // Extract first number from string (e.g., "4 នាក់" → 4)
                              const match = val.match(/\d+/);
                              const num = match ? parseInt(match[0], 10) : 0;
                              return sum + num;
                            }, 0).toLocaleString()}
                          </div>
                        </Col>
                        <Col span={12}>
                          <Text className="welcome-stat-label">
                            {t('Data Sources')}
                          </Text>
                          <div className="welcome-stat-value success">
                            {dashboard.length}
                          </div>
                        </Col>
                      </Row>
                    </div>
                  )}
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card className="gauge-card">
                <Title level={5} className="gauge-title">
                  {t('Performance Rate')}
                </Title>
                <Text className="gauge-subtitle">
                  {t('Based on sales data')}
                </Text>

                <div className="gauge-chart-container">
                  <ResponsiveContainer width="100%" height={140}>
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="70%"
                      outerRadius="100%"
                      data={satisfactionData}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar
                        background
                        dataKey="value"
                        cornerRadius={10}
                        fill="#3b82f6"
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="gauge-value-overlay">
                    <Title level={1} className="gauge-percentage">
                      {satisfactionRate}%
                    </Title>
                  </div>
                </div>

                <div className="gauge-info">
                  <Text className="gauge-info-text">
                    {saleByMonth.length} {t('months of data')}
                  </Text>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card className="gauge-card">
                <Title level={5} className="gauge-title">
                  {t('Customer Score')}
                </Title>
                <Text className="gauge-subtitle">
                  {t('Overall rating')}
                </Text>

                <div className="gauge-chart-container">
                  <ResponsiveContainer width="100%" height={100}>
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="70%"
                      outerRadius="100%"
                      data={customerScoreData}
                      startAngle={180}
                      endAngle={0}
                    >
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar
                        background
                        dataKey="value"
                        cornerRadius={10}
                        fill="#10b981"
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="gauge-value-overlay score">
                    <Title level={1} className="gauge-score">
                      {customerScore}
                    </Title>
                    <Text className="gauge-score-divider">/ 10</Text>
                  </div>
                </div>

                <div className="gauge-info">
                  <Text className="gauge-info-text">
                    {dashboard.find(d => d.title === 'អតិថិជន')?.Summary?.['សរុប'] || '0'}
                  </Text>
                </div>
              </Card>
            </Col>
          </Row>

          <Row gutter={[24, 24]} className="charts-row">
            <Col xs={24} lg={14}>
              <Card className="chart-card">
                <div className="chart-header">
                  <div>
                    <Title level={4} className="chart-title">
                      {t('Financial Overview')}
                    </Title>
                    <Text className="chart-subtitle">
                      {t('Sales vs Expenses vs Profit')}
                    </Text>
                  </div>
                  <Badge count={combinedData.length} className="chart-badge" />
                </div>

                {combinedData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={combinedData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                        </linearGradient>
                        {/* ✅ NEW: Profit gradient */}
                        <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid strokeDasharray="3 3" className="chart-grid" />
                      <XAxis dataKey="month" className="chart-axis" />
                      <YAxis
                        className="chart-axis"
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--card-bg)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 12,
                          color: 'var(--text-primary)'
                        }}
                        formatter={(value, name) => {
                          const labels = {
                            sales: 'Sales',
                            expenses: 'Expenses',
                            profit: 'Profit'
                          };
                          const colors = {
                            sales: '#3b82f6',
                            expenses: '#ef4444',
                            profit: '#10b981'
                          };
                          return [
                            <span style={{ color: colors[name] }}>
                              ${value.toLocaleString()}
                            </span>,
                            t(labels[name])
                          ];
                        }}
                      />
                      <Legend />

                      {/* Sales Area */}
                      <Area
                        type="monotone"
                        dataKey="sales"
                        name={t('Sales')}
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fill="url(#salesGradient)"
                        dot={{ fill: '#3b82f6', r: 4 }}
                      />

                      {/* Expenses Area */}
                      <Area
                        type="monotone"
                        dataKey="expenses"
                        name={t('Expenses')}
                        stroke="#ef4444"
                        strokeWidth={3}
                        fill="url(#expensesGradient)"
                        dot={{ fill: '#ef4444', r: 4 }}
                      />

                      {/* ✅✅✅ NEW: Profit Area ✅✅✅ */}
                      <Area
                        type="monotone"
                        dataKey="profit"
                        name={t('Profit')}
                        stroke="#10b981"
                        strokeWidth={3}
                        fill="url(#profitGradient)"
                        dot={{ fill: '#10b981', r: 4 }}
                        strokeDasharray="5 5"  // ✅ Dashed line
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state">
                    <Empty description={t('No chart data available')} />
                  </div>
                )}
              </Card>
            </Col>

            <Col xs={24} lg={10}>
              <Card className="chart-card">
                <div className="chart-header">
                  <div>
                    <Title level={4} className="chart-title">
                      {t('Top 5 Categories')}
                    </Title>
                    <Text className="chart-subtitle">
                      {t('By sales amount')}
                    </Text>
                  </div>
                  <Badge count={topSales.length} className="chart-badge success" />
                </div>

                {topSales.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={topSales}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        dataKey="value"
                        stroke="var(--card-bg)"
                        strokeWidth={2}
                      >
                        {topSales.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'var(--card-bg)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 12,
                          color: 'var(--text-primary)'
                        }}
                        formatter={(value, name, props) => [
                          <>
                            <div>${value.toLocaleString()}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                              Qty: {props.payload.qty.toLocaleString()}
                            </div>
                          </>,
                          props.payload.name
                        ]}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 11 }}
                        formatter={(value, entry) => (
                          <span style={{ color: 'var(--text-primary)' }}>
                            {entry.payload.name}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state">
                    <Empty
                      description={
                        <>
                          <div>{t('No sales data available')}</div>
                          <div style={{ fontSize: 12, marginTop: 8 }}>
                            {t('Try changing the date range to see data')}
                          </div>
                        </>
                      }
                    />
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}

export default HomePage;