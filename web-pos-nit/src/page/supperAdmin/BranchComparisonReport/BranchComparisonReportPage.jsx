import React, { useEffect, useState, useRef } from "react";
import { Chart } from "react-google-charts";
import {
  Button, Card, Table, Tag, Row, Col, Statistic, DatePicker, Space,
  Alert, Spin, message, Progress, Tabs, Tooltip, Empty, Badge
} from "antd";
import {
  PrinterOutlined, FilePdfOutlined, ShopOutlined, DollarOutlined,
  TeamOutlined, TrophyOutlined, RiseOutlined, FallOutlined,
  PercentageOutlined, CheckCircleOutlined, ClockCircleOutlined,
  BarChartOutlined, LineChartOutlined, PieChartOutlined,
  ReloadOutlined, DownloadOutlined, EyeOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons';
import dayjs from "dayjs";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { request } from "../../../util/helper";

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

function BranchComparisonReport() {
  const reportRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [checkingRole, setCheckingRole] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(true);
  const [accessError, setAccessError] = useState(null);

  const [dateRange, setDateRange] = useState([
    dayjs().subtract(29, "d"),
    dayjs()
  ]);

  const [state, setState] = useState({
    branchComparison: [],
    summary: {
      total_revenue: 0,
      total_paid: 0,
      total_due: 0,
      total_orders: 0,
      total_customers: 0
    },
    chartData: [
      ["Branch", "Revenue", "Paid", "Due"]
    ],
    pieChartData: [
      ["Branch", "Revenue"]
    ],
    metadata: null
  });

  // ✅ Fetch real data from API
  const fetchBranchData = async () => {
    setLoading(true);
    try {
      const fromDate = dateRange[0].format('YYYY-MM-DD');
      const toDate = dateRange[1].format('YYYY-MM-DD');

      const response = await request(
        `report/branch-comparison?from_date=${fromDate}&to_date=${toDate}`,
        "get"
      );

      if (response && !response.error) {
        // Transform data for charts
        const branchList = Array.isArray(response.branchComparison)
          ? response.branchComparison
          : [];

        // Prepare column chart data
        const columnChartData = [
          ["Branch", "Revenue", "Paid", "Due"],
          ...branchList.map(branch => [
            branch.branch_name || "Unknown",
            Number(branch.total_revenue) || 0,
            Number(branch.total_paid) || 0,
            Number(branch.total_due) || 0
          ])
        ];

        // Prepare pie chart data
        const pieChartData = [
          ["Branch", "Revenue"],
          ...branchList.map(branch => [
            branch.branch_name || "Unknown",
            Number(branch.total_revenue) || 0
          ])
        ];

        setState({
          branchComparison: response.branchComparison || [],
          summary: response.summary || {},
          chartData: columnChartData,
          pieChartData: pieChartData,
          metadata: response.metadata || null
        });

        message.success('Data loaded successfully!');
      } else {
        throw new Error(response.message || 'Failed to fetch data');
      }
    } catch (error) {
      console.error("Error fetching branch data:", error);
      message.error(error.message || 'Failed to load branch data');
      setAccessError(error.message);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  // ✅ Load data on mount and when date changes
  useEffect(() => {
    fetchBranchData();
  }, []);

  // Add this effect to refetch when dateRange changes
  useEffect(() => {
    if (!initialLoading) {
      fetchBranchData();
    }
  }, [dateRange]);

  const handleDateRangeChange = (dates) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange(dates);
    }
  };

  const handleRefresh = () => {
    fetchBranchData();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;

    try {
      message.loading('Generating PDF...', 0);

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 280;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`Branch_Comparison_${dayjs().format('YYYY-MM-DD')}.pdf`);

      message.destroy();
      message.success('PDF downloaded successfully!');
    } catch (error) {
      console.error("Error generating PDF:", error);
      message.destroy();
      message.error('Failed to generate PDF');
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return '0%';
    return `${parseFloat(value).toFixed(1)}%`;
  };

  // Calculate additional metrics
  const calculateMetrics = (branch) => {
    const revenue = parseFloat(branch.total_revenue || 0);
    const paid = parseFloat(branch.total_paid || 0);
    const due = parseFloat(branch.total_due || 0);
    const orders = parseInt(branch.total_orders || 0);

    const collectionRate = revenue > 0 ? (paid / revenue * 100) : 0;
    const avgOrderValue = orders > 0 ? revenue / orders : 0;
    const revenueShare = state.summary.total_revenue > 0
      ? (revenue / state.summary.total_revenue * 100)
      : 0;

    return {
      collectionRate,
      avgOrderValue,
      revenueShare
    };
  };

  // Enhanced table columns
  const columns = [
    {
      key: "rank",
      title: "Rank",
      width: 70,
      fixed: 'left',
      render: (_, __, index) => (
        <div className="flex items-center justify-center">
          {index === 0 ? (
            <TrophyOutlined className="text-2xl text-yellow-500" />
          ) : (
            <span className="text-lg font-bold text-gray-500">#{index + 1}</span>
          )}
        </div>
      ),
    },
    {
      key: "branch",
      title: "សាខា / Branch",
      dataIndex: "branch_name",
      fixed: 'left',
      width: 200,
      render: (name, record, index) => {
        const metrics = calculateMetrics(record);
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShopOutlined className="text-blue-600 text-lg" />
              <span className="font-bold text-base">{name}</span>
              {index === 0 && (
                <Badge count="Top" className="ml-2" style={{ backgroundColor: '#52c41a' }} />
              )}
            </div>
            <div className="text-xs text-gray-500">
              {formatPercentage(metrics.revenueShare)} of total revenue
            </div>
          </div>
        );
      },
    },
    {
      key: "revenue",
      title: "ចំណូលសរុប / Total Revenue",
      dataIndex: "total_revenue",
      width: 180,
      sorter: (a, b) => parseFloat(a.total_revenue) - parseFloat(b.total_revenue),
      render: (amount, record) => {
        const metrics = calculateMetrics(record);
        return (
          <div className="space-y-1">
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(amount)}
            </div>
            <Progress
              percent={metrics.revenueShare}
              size="small"
              strokeColor="#52c41a"
              showInfo={false}
            />
          </div>
        );
      },
    },
    {
      key: "financial",
      title: "ស្ថានភាពហិរញ្ញវត្ថុ / Financial Status",
      width: 250,
      render: (_, record) => (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Paid:</span>
            <span className="font-semibold text-emerald-600">
              {formatCurrency(record.total_paid)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Due:</span>
            <span className="font-semibold text-orange-600">
              {formatCurrency(record.total_due)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t">
            <span className="text-xs text-gray-600">Collection:</span>
            <Tag color={calculateMetrics(record).collectionRate > 80 ? 'success' : 'warning'}>
              {formatPercentage(calculateMetrics(record).collectionRate)}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      key: "orders",
      title: "ការបញ្ជាទិញ / Orders",
      dataIndex: "total_orders",
      width: 150,
      sorter: (a, b) => a.total_orders - b.total_orders,
      render: (count, record) => (
        <div className="text-center space-y-1">
          <div className="text-2xl font-bold text-blue-600">{count}</div>
          <div className="text-xs text-gray-500">
            Avg: {formatCurrency(calculateMetrics(record).avgOrderValue)}
          </div>
        </div>
      ),
    },
    {
      key: "customers",
      title: "អតិថិជន / Customers",
      dataIndex: "unique_customers",
      width: 120,
      render: (count) => (
        <div className="flex items-center justify-center gap-2">
          <TeamOutlined className="text-purple-600" />
          <span className="text-lg font-semibold">{count}</span>
        </div>
      ),
    },
    {
      key: "performance",
      title: "Performance Score",
      width: 150,
      render: (_, record) => {
        const metrics = calculateMetrics(record);
        const score = (
          (metrics.collectionRate * 0.4) +
          (metrics.revenueShare * 0.6)
        );

        return (
          <div className="text-center">
            <Progress
              type="circle"
              percent={Math.round(score)}
              width={60}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
          </div>
        );
      },
    }
  ];

  // Mobile Card Component - Enhanced
  const BranchMobileCard = ({ item, index }) => {
    const metrics = calculateMetrics(item);

    return (
      <Card
        className="mb-4 shadow-lg hover:shadow-xl transition-all duration-300 border-l-4"
        style={{
          borderLeftColor: index === 0 ? '#52c41a' : '#1890ff',
          background: index === 0 ? 'linear-gradient(135deg, #f6ffed 0%, #ffffff 100%)' : 'white'
        }}
        bodyStyle={{ padding: '16px' }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-500">
              {index === 0 ? <TrophyOutlined className="text-yellow-500 text-xl" /> : `#${index + 1}`}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <ShopOutlined className="text-blue-600" />
                <h3 className="text-base font-bold">{item.branch_name}</h3>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {formatPercentage(metrics.revenueShare)} market share
              </div>
            </div>
          </div>
          {index === 0 && (
            <Badge count="Top Performer" style={{ backgroundColor: '#52c41a' }} />
          )}
        </div>

        {/* Revenue */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 mb-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-600">Total Revenue</span>
            <RiseOutlined className="text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(item.total_revenue)}
          </div>
          <Progress
            percent={metrics.revenueShare}
            size="small"
            strokeColor="#52c41a"
            className="mt-2"
          />
        </div>

        {/* Financial Status */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-emerald-50 rounded-lg p-2.5">
            <div className="flex items-center gap-1 mb-1">
              <CheckCircleOutlined className="text-emerald-600 text-xs" />
              <span className="text-xs text-gray-600">Paid</span>
            </div>
            <div className="text-base font-bold text-emerald-600">
              {formatCurrency(item.total_paid)}
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-2.5">
            <div className="flex items-center gap-1 mb-1">
              <ClockCircleOutlined className="text-orange-600 text-xs" />
              <span className="text-xs text-gray-600">Due</span>
            </div>
            <div className="text-base font-bold text-orange-600">
              {formatCurrency(item.total_due)}
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <div className="text-xs text-gray-600 mb-1">Orders</div>
            <div className="text-lg font-bold text-blue-600">{item.total_orders}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-2 text-center">
            <div className="text-xs text-gray-600 mb-1">Customers</div>
            <div className="text-lg font-bold text-purple-600">{item.unique_customers}</div>
          </div>
          <div className="bg-indigo-50 rounded-lg p-2 text-center">
            <div className="text-xs text-gray-600 mb-1">Avg Order</div>
            <div className="text-sm font-bold text-indigo-600">
              {formatCurrency(metrics.avgOrderValue)}
            </div>
          </div>
        </div>

        {/* Performance Badge */}
        <div className="flex justify-between items-center pt-3 border-t">
          <span className="text-xs text-gray-600">Collection Rate</span>
          <Tag color={metrics.collectionRate > 80 ? 'success' : 'warning'} className="text-sm">
            {formatPercentage(metrics.collectionRate)}
          </Tag>
        </div>
      </Card>
    );
  };

  // Loading state
  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Card className="text-center p-8">
          <Spin size="large" tip="Loading branch data..." />
        </Card>
      </div>
    );
  }

  // Access denied state
  if (!isSuperAdmin && accessError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <Alert
            message="Access Denied / ការបដិសេធការចូល"
            description={
              <div className="space-y-2">
                <p className="text-base">អ្នកមិនមានសិទ្ធិចូលមើលរបាយការណ៍នេះទេ។</p>
                <p className="text-base">សម្រាប់តែ Super Admin ប៉ុណ្ណោះ។</p>
                <p className="text-sm text-gray-600 mt-3">
                  You don't have permission to view this report. Super Admin access only.
                </p>
              </div>
            }
            type="error"
            showIcon
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">

        {/* Header */}
        <Card
          className="mb-6 shadow-xl border-0"
          bodyStyle={{ padding: '20px' }}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-white text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-3 mb-2">
                <ShopOutlined className="text-3xl" />
                <span>របាយការណ៍ប្រៀបធៀបរវាងសាខា</span>
              </h1>
              <p className="text-white text-sm md:text-base opacity-90">
                Branch Performance Comparison Report - Professional Analytics Dashboard
              </p>
              {state.metadata && (
                <div className="mt-2 text-white text-xs opacity-75">
                  <span>Generated: {dayjs(state.metadata.generated_at).format('DD/MM/YYYY HH:mm')}</span>
                  {state.metadata.requested_by && (
                    <span className="ml-4">
                      By: {state.metadata.requested_by.username} ({state.metadata.requested_by.role})
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={loading}
                size="large"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                Refresh
              </Button>
              <Button
                icon={<PrinterOutlined />}
                onClick={handlePrint}
                size="large"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                Print
              </Button>
              <Button
                type="primary"
                icon={<FilePdfOutlined />}
                onClick={handleDownloadPDF}
                size="large"
                className="bg-orange-500 hover:bg-orange-600 border-0"
              >
                Export PDF
              </Button>
            </div>
          </div>
        </Card>

        {/* Filters */}
        <Card className="mb-6 shadow-lg" bodyStyle={{ padding: '20px' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8}>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Date Range:</label>
                <RangePicker
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  format="DD/MM/YYYY"
                  size="large"
                  className="w-full"
                />
              </div>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Button
                type="primary"
                onClick={fetchBranchData}
                loading={loading}
                size="large"
                icon={<EyeOutlined />}
                className="w-full mt-0 sm:mt-6 bg-gradient-to-r from-blue-500 to-indigo-600 border-0"
              >
                Generate
              </Button>
            </Col>
            <Col xs={24} md={12}>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-semibold">Period:</span>{' '}
                  {dateRange[0].format('DD/MM/YY')} - {dateRange[1].format('DD/MM/YY')}
                </div>
                <div>
                  <span className="font-semibold">Branches:</span>{' '}
                  {state.branchComparison.length}
                </div>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Summary Statistics */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={12} sm={12} md={6}>
            <Card className="shadow-lg border-0 h-full" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <Statistic
                title={<span className="text-white opacity-90 text-sm">Total Revenue</span>}
                value={formatCurrency(state.summary.total_revenue || 0)}
                valueStyle={{ color: '#ffffff', fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 'bold' }}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card className="shadow-lg border-0 h-full" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <Statistic
                title={<span className="text-white opacity-90 text-sm">Total Orders</span>}
                value={state.summary.total_orders || 0}
                valueStyle={{ color: '#ffffff', fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 'bold' }}
                prefix={<ShoppingCartOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card className="shadow-lg border-0 h-full" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              <Statistic
                title={<span className="text-white opacity-90 text-sm">Total Customers</span>}
                value={state.summary.total_customers || 0}
                valueStyle={{ color: '#ffffff', fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 'bold' }}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card className="shadow-lg border-0 h-full" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
              <Statistic
                title={<span className="text-white opacity-90 text-sm">Collection Rate</span>}
                value={formatPercentage(
                  state.summary.total_revenue > 0
                    ? (state.summary.total_paid / state.summary.total_revenue * 100)
                    : 0
                )}
                valueStyle={{ color: '#ffffff', fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 'bold' }}
                prefix={<PercentageOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <div ref={reportRef}>
          {/* Charts - Fixed conditional rendering */}
          {Array.isArray(state.chartData) && state.chartData.length > 1 && (
            <Row gutter={[16, 16]} className="mb-6">
              <Col xs={24} lg={12}>
                <Card className="shadow-lg h-full" bodyStyle={{ padding: '24px' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <BarChartOutlined className="text-2xl text-blue-600" />
                    <h3 className="text-lg font-bold m-0">Revenue Comparison</h3>
                  </div>
                  <Chart
                    chartType="ColumnChart"
                    width="100%"
                    height="350px"
                    data={state.chartData}
                    options={{
                      legend: { position: "bottom" },
                      colors: ["#52c41a", "#1890ff", "#fa8c16"],
                      chartArea: { width: "75%", height: "70%" },
                      hAxis: { title: "Branch" },
                      vAxis: {
                        title: "Amount (USD)",
                        format: "$#,###.##",
                        minValue: 0
                      },
                      animation: {
                        duration: 1000,
                        easing: "out",
                        startup: true
                      }
                    }}
                  />
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card className="shadow-lg h-full" bodyStyle={{ padding: '24px' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <PieChartOutlined className="text-2xl text-purple-600" />
                    <h3 className="text-lg font-bold m-0">Revenue Distribution</h3>
                  </div>
                  {Array.isArray(state.pieChartData) && state.pieChartData.length > 1 ? (
                    <Chart
                      chartType="PieChart"
                      width="100%"
                      height="350px"
                      data={state.pieChartData}
                      options={{
                        legend: {
                          position: "right",
                          textStyle: { fontSize: 12 }
                        },
                        colors: ["#667eea", "#764ba2", "#f093fb", "#f5576c", "#4facfe"],
                        chartArea: { width: "90%", height: "85%" },
                        pieHole: 0.4,
                        pieSliceText: 'percentage',
                        animation: {
                          duration: 1000,
                          easing: 'out',
                          startup: true
                        }
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-[350px]">
                      <Empty description="No data for pie chart" />
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          )}

          {/* Data Table/Cards */}
          {state.branchComparison.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block">
                <Card className="shadow-lg" bodyStyle={{ padding: '24px' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <ShopOutlined className="text-2xl text-blue-600" />
                    <h3 className="text-xl font-bold m-0">Detailed Branch Performance</h3>
                  </div>
                  <Table
                    loading={loading}
                    dataSource={state.branchComparison}
                    columns={columns}
                    pagination={false}
                    rowKey="branch_name"
                    scroll={{ x: 1400 }}
                    rowClassName={(record, index) =>
                      index === 0 ? 'bg-green-50' : ''
                    }
                  />
                </Card>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden">
                <Card className="shadow-lg" bodyStyle={{ padding: '16px' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <ShopOutlined className="text-xl text-blue-600" />
                    <h3 className="text-base font-bold m-0">Branch Performance</h3>
                  </div>
                  {loading ? (
                    <div className="text-center py-12">
                      <Spin size="large" />
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {state.branchComparison.map((item, index) => (
                        <BranchMobileCard key={item.branch_name} item={item} index={index} />
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </>
          ) : (
            <Card className="shadow-lg">
              <Empty
                description={
                  <span className="text-gray-600">
                    No branch data available for the selected period
                  </span>
                }
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default BranchComparisonReport;