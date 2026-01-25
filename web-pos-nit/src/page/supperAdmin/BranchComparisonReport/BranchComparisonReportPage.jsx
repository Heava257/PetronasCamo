
import React, { useEffect, useState, useRef } from "react";
import { Chart } from "react-google-charts";
import {
  Button,
  Card,
  Table,
  Tag,
  Row,
  Col,
  Statistic,
  DatePicker,
  Space,
  Spin,
  message,
  Progress,
  Badge,
  Alert,
  Empty
} from "antd";
import {
  ShopOutlined,
  DollarOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  PercentageOutlined,
  RiseOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  PieChartOutlined,
  ReloadOutlined,
  PrinterOutlined,
  FilePdfOutlined,
  EyeOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import dayjs from "dayjs";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { request, formatPrice } from "../../../util/helper";

const { RangePicker } = DatePicker;

function BranchComparisonReport() {
  const reportRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
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

  // Calculate stats for a single branch
  const calculateMetrics = (branch) => {
    const revenue = parseFloat(branch.total_revenue || 0);
    const paid = parseFloat(branch.total_paid || 0);
    const due = parseFloat(branch.total_due || 0);
    const orders = parseInt(branch.total_orders || 0);
    const customers = parseInt(branch.unique_customers || 0);

    const collectionRate = revenue > 0 ? (paid / revenue * 100) : 0;
    const avgOrderValue = orders > 0 ? revenue / orders : 0;
    const revenueShare = state.summary.total_revenue > 0
      ? (revenue / state.summary.total_revenue * 100)
      : 0;

    return {
      revenue,
      paid,
      due,
      orders,
      customers,
      collectionRate,
      avgOrderValue,
      revenueShare
    };
  };

  const fetchBranchData = async () => {
    setLoading(true);
    try {
      const fromDate = dateRange[0].format('YYYY-MM-DD');
      const toDate = dateRange[1].format('YYYY-MM-DD');

      const response = await request(
        `report/branch-comparison`, // Url params handled by request helper or manually?
        "get",
        {
          from_date: fromDate,
          to_date: toDate
        }
      );

      if (response && !response.error) {
        const branchList = Array.isArray(response.branchComparison)
          ? response.branchComparison
          : [];

        // Prepare chart data
        const columnChartData = [
          ["Branch", "Revenue", "Paid", "Due"],
          ...branchList.map(branch => [
            branch.branch_name || "Unknown",
            parseFloat(branch.total_revenue || 0),
            parseFloat(branch.total_paid || 0),
            parseFloat(branch.total_due || 0)
          ])
        ];

        const pieChartData = [
          ["Branch", "Revenue"],
          ...branchList.map(branch => [
            branch.branch_name || "Unknown",
            parseFloat(branch.total_revenue || 0)
          ])
        ];

        setState({
          branchComparison: branchList,
          summary: response.summary || {},
          chartData: columnChartData,
          pieChartData: pieChartData,
          metadata: response.metadata || null
        });

      } else {
        throw new Error(response.message || 'Failed to fetch data');
      }
    } catch (error) {
      console.error("Error fetching branch data:", error);
      message.error("Failed to load branch data");
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchBranchData();
  }, []);

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

  const columns = [
    {
      key: "rank",
      title: "Rank",
      width: 70,
      fixed: 'left',
      render: (_, __, index) => (
        <div className="flex items-center justify-center">
          {index === 0 ? <TrophyOutlined className="text-2xl text-yellow-500" /> : <span className="font-bold text-gray-500">#{index + 1}</span>}
        </div>
      ),
    },
    {
      key: "branch",
      title: "Branch",
      dataIndex: "branch_name",
      fixed: 'left',
      width: 200,
      render: (text, record) => {
        const m = calculateMetrics(record);
        return (
          <div>
            <div className="font-bold text-base flex items-center gap-2">
              <ShopOutlined className="text-blue-600" /> {text}
            </div>
            <div className="text-xs text-gray-500">{m.revenueShare.toFixed(1)}% Share</div>
          </div>
        )
      }
    },
    {
      key: "revenue",
      title: "Revenue",
      dataIndex: "total_revenue",
      width: 150,
      sorter: (a, b) => parseFloat(a.total_revenue) - parseFloat(b.total_revenue),
      render: (val) => <span className="font-bold text-green-600">{formatPrice(val)}</span>
    },
    {
      title: "Rec. (Paid)",
      dataIndex: "total_paid",
      width: 130,
      render: (val) => <span className="text-emerald-600">{formatPrice(val)}</span>
    },
    {
      title: "Due (Debt)",
      dataIndex: "total_due",
      width: 130,
      render: (val) => <span className="text-orange-600 font-semibold">{formatPrice(val)}</span>
    },
    {
      title: "Collection Rate",
      width: 150,
      render: (_, record) => {
        const m = calculateMetrics(record);
        return (
          <Progress percent={Math.round(m.collectionRate)} size="small" status={m.collectionRate > 80 ? 'success' : 'active'} strokeColor={m.collectionRate > 80 ? '#52c41a' : '#faad14'} />
        )
      }
    },
    {
      title: "Orders / Customers",
      width: 180,
      render: (_, record) => (
        <div className="text-xs">
          <div><ShoppingCartOutlined /> {record.total_orders} Orders</div>
          <div><TeamOutlined /> {record.unique_customers} Customers</div>
        </div>
      )
    }
  ];

  const BranchMobileCard = ({ item, index }) => {
    const m = calculateMetrics(item);
    return (
      <Card className="mb-4 shadow-sm" bodyStyle={{ padding: '12px' }}>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-500">#{index + 1}</span>
            <span className="font-bold text-lg">{item.branch_name}</span>
          </div>
          {index === 0 && <Badge count="Top" style={{ backgroundColor: '#52c41a' }} />}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="text-xs text-gray-500">Revenue</div>
            <div className="text-lg font-bold text-green-600">{formatPrice(m.revenue)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Collection</div>
            <div className={`${m.collectionRate > 80 ? 'text-green-500' : 'text-orange-500'} font-bold`}>{m.collectionRate.toFixed(1)}%</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs bg-gray-50 p-2 rounded">
          <div>
            <div className="text-gray-400">Paid</div>
            <div className="font-semibold">{formatPrice(m.paid)}</div>
          </div>
          <div>
            <div className="text-gray-400">Due</div>
            <div className="font-semibold text-red-500">{formatPrice(m.due)}</div>
          </div>
          <div>
            <div className="text-gray-400">Orders</div>
            <div className="font-semibold">{m.orders}</div>
          </div>
        </div>
      </Card>
    )
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip="Loading comparison data..." />
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="max-w-[1600px] mx-auto">
        {/* Header Area */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
              <BarChartOutlined /> Branch Comparison Report
            </h1>
            <p className="text-gray-500 text-sm">Analyze performance across all branches</p>
          </div>
          <Space wrap>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              format="DD/MM/YYYY"
              allowClear={false}
            />
            <Button type="primary" icon={<ReloadOutlined />} onClick={fetchBranchData} loading={loading}>Refresh</Button>
            <Button icon={<PrinterOutlined />} onClick={handlePrint}>Print</Button>
            <Button icon={<FilePdfOutlined />} onClick={handleDownloadPDF}>PDF</Button>
          </Space>
        </div>

        {/* Stats Summary */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} className="shadow-sm">
              <Statistic
                title="Total Revenue"
                value={state.summary.total_revenue}
                prefix={<DollarOutlined />}
                formatter={(val) => <span className="text-green-600 font-bold">{formatPrice(val)}</span>}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} className="shadow-sm">
              <Statistic
                title="Total Orders"
                value={state.summary.total_orders}
                prefix={<ShoppingCartOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} className="shadow-sm">
              <Statistic
                title="Total Paid"
                value={state.summary.total_paid}
                prefix={<CheckCircleOutlined />}
                formatter={(val) => <span className="text-emerald-600 font-bold">{formatPrice(val)}</span>}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} className="shadow-sm">
              <Statistic
                title="Total Outstanding"
                value={state.summary.total_due}
                prefix={<ClockCircleOutlined />}
                formatter={(val) => <span className="text-orange-600 font-bold">{formatPrice(val)}</span>}
              />
            </Card>
          </Col>
        </Row>

        <div ref={reportRef}>
          {/* Charts */}
          {state.branchComparison.length > 0 && (
            <Row gutter={[16, 16]} className="mb-6">
              <Col xs={24} lg={16}>
                <Card title="Revenue Comparison" className="shadow-sm" bordered={false}>
                  <Chart
                    chartType="ColumnChart"
                    width="100%"
                    height="350px"
                    data={state.chartData}
                    options={{
                      legend: { position: "bottom" },
                      colors: ["#52c41a", "#1890ff", "#fa8c16"],
                      chartArea: { width: "85%", height: "70%" },
                      vAxis: { format: 'short' },
                      animation: { startup: true, duration: 1000, easing: 'out' }
                    }}
                  />
                </Card>
              </Col>
              <Col xs={24} lg={8}>
                <Card title="Market Share" className="shadow-sm" bordered={false}>
                  <Chart
                    chartType="PieChart"
                    width="100%"
                    height="350px"
                    data={state.pieChartData}
                    options={{
                      legend: { position: "bottom" },
                      pieHole: 0.4,
                      colors: ["#ff7875", "#ff9c6e", "#ffc069", "#d3f261", "#5cdbd3", "#096dd9", "#597ef7", "#9254de"],
                      chartArea: { width: "90%", height: "80%" }
                    }}
                  />
                </Card>
              </Col>
            </Row>
          )}

          {/* Table Data */}
          <div className="hidden md:block">
            <Card className="shadow-sm" bordered={false} bodyStyle={{ padding: 0 }}>
              <Table
                dataSource={state.branchComparison}
                columns={columns}
                rowKey="branch_name"
                pagination={false}
                rowClassName={(record, index) => index === 0 ? 'bg-green-50' : ''}
              />
            </Card>
          </div>

          {/* Mobile View */}
          <div className="md:hidden">
            {state.branchComparison.map((item, index) => (
              <BranchMobileCard key={index} item={item} index={index} />
            ))}
            {state.branchComparison.length === 0 && <Empty description="No data found" />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BranchComparisonReport;