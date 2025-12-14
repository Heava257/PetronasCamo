import React, { useEffect, useState, useRef } from "react";
import { request } from "../../util/helper";
import { Button, Card, Row, Col, Statistic, Divider, Select, DatePicker, Empty, Dropdown, Menu, message, Badge, Avatar, Progress, Typography } from "antd";
import {
  DownloadOutlined,
  PrinterOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  UserOutlined,
  DollarOutlined,
  MoreOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  WalletOutlined,
  ShopOutlined,
  RiseOutlined,
  FallOutlined,
  FilterOutlined,
  EyeOutlined
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import moment from "moment";
import CustomerList from "../NewCustomer/CustomerList";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

function HomePage() {
  const [dashboard, setDashboard] = useState([]);
  const [saleByMonth, setSaleByMonth] = useState([]);
  const [expenseByMonth, setExpenseByMonth] = useState([]);
  const [dateRange, setDateRange] = useState([moment().startOf('year'), moment()]);
  const [categoryId, setCategoryId] = useState(null);
  const [expenseTypeId, setExpenseTypeId] = useState(null);
  const [supplierId, setSupplierId] = useState(null);
  const [topSales, setTopSales] = useState([]);

  const [customerData, setCustomerData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid or detailed

  const dashboardRef = useRef(null);
  const cardRefs = useRef([]);
  const chartRefs = useRef({
    combinedChart: useRef(null),
    salesTrendChart: useRef(null),
    expenseTrendChart: useRef(null),
    profitChart: useRef(null)
  });

  const COLORS = [
    '#667eea',
    '#764ba2',
    '#f093fb',
    '#f5576c',
    '#4facfe',
    '#43e97b',
    '#fa709a',
    '#fee140'
  ];

  const GRADIENT_COLORS = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
  ];

  const getCardIcon = (index) => {
    const icons = [
      <TeamOutlined style={{ fontSize: 32, color: 'white' }} />,
      <UserOutlined style={{ fontSize: 32, color: 'white' }} />,
      <TeamOutlined style={{ fontSize: 32, color: 'white' }} />,
      <ShopOutlined style={{ fontSize: 32, color: 'white' }} />,
      <WalletOutlined style={{ fontSize: 32, color: 'white' }} />,
      <ShoppingCartOutlined style={{ fontSize: 32, color: 'white' }} />,
      <RiseOutlined style={{ fontSize: 32, color: 'white' }} />
    ];
    return icons[index % icons.length];
  };

  useEffect(() => {
    cardRefs.current = Array(dashboard.length).fill().map((_, i) => cardRefs.current[i] || React.createRef());
  }, [dashboard]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === '3') {
        message.info('ជ្រើសរើសផ្ទាំងដែលត្រូវការបោះពុម្ព ឬទាញយក PDF', 2);
        setSelectedCardIndex(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    getList();
  }, []);

  const formatNumber = (value) => {
    if (value === null || value === undefined) return '';

    if (typeof value === 'string') {
      if (value.includes(',')) return value;
      const numericValue = value.replace(/[^\d.-]/g, '');
      if (!isNaN(numericValue) && numericValue !== '') {
        const formattedNum = Number(numericValue).toLocaleString();
        if (value.includes('$')) {
          return formattedNum + ' $';
        }
        return formattedNum;
      }
      return value;
    }

    if (typeof value === 'number') {
      return value.toLocaleString();
    }

    return value;
  };

  const processDashboardData = (data) => {
    if (!data || !Array.isArray(data)) return [];

    return data.map(item => {
      const processedSummary = {};

      if (item.Summary) {
        Object.entries(item.Summary).forEach(([key, value]) => {
          processedSummary[key] = formatNumber(value);
        });
      }

      return {
        ...item,
        Summary: processedSummary
      };
    });
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        getList(),
      ]);
    } catch (error) {
      console.error("Error fetching all data:", error);
    } finally {
      setIsLoading(false);
    }
  };


  // In your getList function, add this code after setting the dashboard data:

  const getList = async () => {
    setIsLoading(true);
    try {
      let apiUrl = 'dashbaord';

      if (dateRange && dateRange[0] && dateRange[1]) {
        const [fromDate, toDate] = dateRange;
        const formattedFromDate = fromDate.format('YYYY-MM-DD');
        const formattedToDate = toDate.format('YYYY-MM-DD');
        apiUrl += `?from_date=${formattedFromDate}&to_date=${formattedToDate}`;
      }

      const res = await request(apiUrl, "get");
      if (res && !res.error) {
        setDashboard(processDashboardData(res.dashboard));

        if (res.Sale_Summary_By_Month) {
          const saleData = res.Sale_Summary_By_Month.map(item => ({
            month: item.title,
            sale: Number(item.total) || 0
          }));
          setSaleByMonth(saleData);
        }

        if (res.Expense_Summary_By_Month) {
          const expenseData = res.Expense_Summary_By_Month.map(item => ({
            month: item.title,
            expense: Number(item.total) || 0
          }));
          setExpenseByMonth(expenseData);
        }

        if (res.Top_Sale && Array.isArray(res.Top_Sale)) {
          const topSalesData = res.Top_Sale.slice(0, 5).map(item => ({
            name: ` (${item.category_name})`,
            value: Number(item.total_sale_amount) || 0,
            qty: Number(item.total_qty) || 0
          }));
          setTopSales(topSalesData);
        }

      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };


  const handlePrintAll = () => {
    const printContent = document.getElementById("dashboard-content");
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  const handleDownloadAllPDF = () => {
    const input = document.getElementById("dashboard-content");
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("landscape");
      const imgWidth = 280;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save("dashboard.pdf");
    });
  };

  const handlePrintIndividual = (elementRef, title) => {
    if (!elementRef.current) return;

    html2canvas(elementRef.current).then((canvas) => {
      const printWindow = window.open('', '_blank');

      if (!printWindow) {
        message.error('បិទការហាមឃាត់ popup ដើម្បីបោះពុម្ព');
        return;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                text-align: center;
                font-family: 'Khmer OS', 'Khmer OS System', sans-serif;
              }
              img {
                max-width: 100%;
              }
              @media print {
                body {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
              }
            </style>
          </head>
          <body>
            <h2>${title}</h2>
            <img src="${canvas.toDataURL('image/png')}" />
          </body>
        </html>
      `);

      printWindow.document.close();
      const img = printWindow.document.querySelector('img');
      if (img) {
        img.onload = function () {
          printWindow.print();
          setTimeout(() => {
            printWindow.close();
          }, 500);
        };
      } else {
        printWindow.print();
        setTimeout(() => {
          printWindow.close();
        }, 500);
      }
    });
  };

  const handleDownloadIndividualPDF = (elementRef, title) => {
    if (!elementRef.current) return;

    html2canvas(elementRef.current, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.setFontSize(16);
      pdf.text(title, 10, 10);
      pdf.addImage(imgData, "PNG", 10, 20, imgWidth, imgHeight);
      pdf.save(`${title.replace(/\s+/g, '_')}.pdf`);

      message.success('បានទាញយក PDF ដោយជោគជ័យ');
    });
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  const handleSearch = () => {
    fetchAllData();
  };

  const tooltipFormatter = (value) => {
    return [`$${value.toLocaleString()}`, "Amount"];
  };

  const combinedChartData = saleByMonth.map(sale => {
    const expenseEntry = expenseByMonth.find(exp => exp.month === sale.month);
    return {
      month: sale.month,
      sale: sale.sale,
      expense: expenseEntry ? expenseEntry.expense : 0,
      profit: sale.sale - (expenseEntry ? expenseEntry.expense : 0)
    };
  });

  const handleCardSelect = (index) => {
    setSelectedCardIndex(index);
    message.success(`បានជ្រើសរើសផ្ទាំង "${index >= 0 && index < dashboard.length ? dashboard[index].title : 'ក្រាហ្វិក'}"`, 1);
  };

  const handleChartSelect = (chartType) => {
    setSelectedCardIndex(chartType);
    message.success(`បានជ្រើសរើសក្រាហ្វិក "${chartType}"`, 1);
  };

  const getSelectedElementRef = () => {
    if (selectedCardIndex === null) return null;

    if (typeof selectedCardIndex === 'number' && selectedCardIndex >= 0 && selectedCardIndex < dashboard.length) {
      return cardRefs.current[selectedCardIndex];
    }

    if (selectedCardIndex === 'combinedChart') return chartRefs.current.combinedChart;
    if (selectedCardIndex === 'salesTrendChart') return chartRefs.current.salesTrendChart;
    if (selectedCardIndex === 'expenseTrendChart') return chartRefs.current.expenseTrendChart;

    return null;
  };

  const getSelectedElementTitle = () => {
    if (selectedCardIndex === null) return "";

    if (typeof selectedCardIndex === 'number' && selectedCardIndex >= 0 && selectedCardIndex < dashboard.length) {
      return dashboard[selectedCardIndex].title;
    }

    if (selectedCardIndex === 'combinedChart') return "ទិដ្ឋភាពនៃការលក់និងចំណាយ";
    if (selectedCardIndex === 'salesTrendChart') return "និន្នាការលក់";
    if (selectedCardIndex === 'expenseTrendChart') return "និន្នាការចំណាយ";

    return "";
  };

  // Calculate growth rates
  const calculateGrowth = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '0'
    }}>
      {/* Modern Header with Glass Effect */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '24px',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <Row gutter={[16, 16]} align="middle">
          <Col span={16}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Avatar
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  marginRight: 16,
                  width: 48,
                  height: 48
                }}
                icon={<BarChartOutlined style={{ fontSize: 24, color: 'white' }} />}
              />
              <div>
                <Title level={2} style={{
                  color: 'white',
                  margin: 0,
                  fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}>
                  ផ្ទាំងគ្រប់គ្រងអាជីវកម្ម
                </Title>
                <Text style={{
                  color: 'rgba(255,255,255,0.8)',
                  fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif"
                }}>
                  ទិដ្ឋភាពទូលំទូលាយនៃដំណើរការអាជីវកម្មរបស់អ្នក
                </Text>
              </div>
            </div>
          </Col>
          <Col span={8} style={{ textAlign: "right" }}>
            {selectedCardIndex !== null ? (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownloadIndividualPDF(getSelectedElementRef(), getSelectedElementTitle())}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <span style={{ fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif" }}>
                    ទាញយក PDF
                  </span>
                </Button>
                <Button
                  type="default"
                  icon={<PrinterOutlined />}
                  onClick={() => handlePrintIndividual(getSelectedElementRef(), getSelectedElementTitle())}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white'
                  }}
                >
                  <span style={{ fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif" }}>
                    បោះពុម្ព
                  </span>
                </Button>
                <Button
                  type="dashed"
                  onClick={() => setSelectedCardIndex(null)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white'
                  }}
                >
                  <span style={{ fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif" }}>
                    បិទ
                  </span>
                </Button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={handleDownloadAllPDF}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <span style={{ fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif" }}>
                    ទាញយក PDF
                  </span>
                </Button>
                <Button
                  type="default"
                  icon={<PrinterOutlined />}
                  onClick={handlePrintAll}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white'
                  }}
                >
                  <span style={{ fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif" }}>
                    បោះពុម្ព
                  </span>
                </Button>
              </div>
            )}
          </Col>
        </Row>
      </div>

      <div style={{ padding: '24px' }}>
        <Card style={{
          marginBottom: 24,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <Row gutter={16} align="middle">
            <Col span={2}>
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <FilterOutlined style={{ color: 'white', fontSize: 20 }} />
              </div>
            </Col>
            <Col span={8}>
              <Text strong style={{
                fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                color: '#1a3353',
                display: 'block',
                marginBottom: 8
              }}>
                ជ្រើសរើសកាលបរិច្ឆេទ
              </Text>
              <RangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                style={{ width: "100%", borderRadius: 8 }}
                format="YYYY-MM-DD"
                allowClear={true}
              />
            </Col>
            <Col span={6}>
              <Text strong style={{
                fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                color: '#1a3353',
                display: 'block',
                marginBottom: 8
              }}>
                របៀបមើល
              </Text>
              <Select
                value={viewMode}
                onChange={setViewMode}
                style={{ width: "100%" }}
              >
                <Option value="grid">ទិដ្ឋភាពក្រឡា</Option>
                <Option value="detailed">ទិដ្ឋភាពលម្អិត</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Button
                type="primary"
                onClick={handleSearch}
                icon={<EyeOutlined />}
                loading={isLoading}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: 8,
                  height: 40,
                  width: '100%',
                  marginTop: 24
                }}
              >
                <span style={{ fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif" }}>
                  មើលទិន្នន័យ
                </span>
              </Button>
            </Col>
            <Col span={4}>
              <Text style={{
                fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                color: '#666',
                fontSize: 12,
                marginTop: 24,
                display: 'block'
              }}>
                Ctrl+3 ជ្រើសរើស
              </Text>
            </Col>
          </Row>
        </Card>

        <div id="dashboard-content" ref={dashboardRef}>
          <Row gutter={[24, 24]}>
            {dashboard.length > 0 ? dashboard.map((item, index) => (
              <Col xs={24} sm={12} md={8} lg={8} xl={8} key={index}>
                <Card
                  ref={cardRefs.current[index]}
                  hoverable
                  style={{
                    height: viewMode === 'detailed' ? 320 : 280,
                    borderRadius: 16,
                    background: 'white',
                    border: selectedCardIndex === index ?
                      `2px solid ${COLORS[index % COLORS.length]}` :
                      '1px solid #f0f0f0',
                    boxShadow: selectedCardIndex === index ?
                      `0 8px 30px rgba(102, 126, 234, 0.2)` :
                      '0 2px 8px rgba(0, 0, 0, 0.06)',
                    cursor: 'pointer',
                    transform: selectedCardIndex === index ? 'translateY(-2px)' : 'none',
                    transition: 'all 0.3s ease',
                    overflow: 'hidden'
                  }}
                  onClick={() => handleCardSelect(index)}
                  title={null}
                  bodyStyle={{ padding: 0 }}
                >
                  {/* Header Section */}
                  <div style={{
                    padding: '24px 20px 16px 20px',
                    borderBottom: '1px solid #f5f5f5'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 8
                    }}>
                      <div style={{ flex: 1 }}>
                        <Title level={3} style={{
                          color: '#1a1a1a',
                          margin: 0,
                          fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                          fontSize: 24,
                          fontWeight: '600',
                          lineHeight: 1.2
                        }}>
                          {Object.values(item.Summary)[0] || '350'}
                        </Title>
                        <Title level={5} style={{
                          color: COLORS[index % COLORS.length],
                          margin: '4px 0 0 0',
                          fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                          fontSize: 14,
                          fontWeight: '500',
                          textTransform: 'capitalize'
                        }}>
                          {item.title}
                        </Title>
                      </div>

                      <div style={{
                        background: `${COLORS[index % COLORS.length]}15`,
                        borderRadius: '12px',
                        padding: '10px',
                        marginLeft: 12
                      }}>
                        {getCardIcon(index)}
                      </div>
                    </div>

                    <Text style={{
                      color: '#666',
                      fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                      fontSize: 13,
                      lineHeight: 1.4
                    }}>
                      Total number of {item.title.toLowerCase()} that come in.
                    </Text>
                  </div>

                  {/* Wave Chart Area */}
                  <div style={{
                    position: 'relative',
                    height: 120,
                    background: `linear-gradient(135deg, ${COLORS[index % COLORS.length]}08, ${COLORS[index % COLORS.length]}03)`,
                    overflow: 'hidden'
                  }}>
                    {/* Wave SVG */}
                    <svg
                      width="100%"
                      height="120"
                      style={{ position: 'absolute', top: 0, left: 0 }}
                      viewBox="0 0 400 120"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient id={`waveGradient${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity="0.3" />
                          <stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity="0.1" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0,60 Q100,40 200,50 T400,45 L400,120 L0,120 Z"
                        fill={`url(#waveGradient${index})`}
                      />
                      <path
                        d="M0,60 Q100,40 200,50 T400,45"
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth="2"
                        fill="none"
                        opacity="0.8"
                      />
                    </svg>
                  </div>

                  {/* Bottom Stats Section */}
                  <div style={{
                    padding: '16px 20px',
                    background: `${COLORS[index % COLORS.length]}05`
                  }}>
                    {Object.entries(item.Summary).slice(1).length > 0 ? (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-around',
                        alignItems: 'center'
                      }}>
                        {Object.entries(item.Summary).slice(1, 4).map(([key, value], idx) => (
                          <div key={idx} style={{ textAlign: 'center', flex: 1 }}>
                            <Text style={{
                              fontSize: 18,
                              fontWeight: '700',
                              color: COLORS[index % COLORS.length],
                              display: 'block',
                              fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
                              lineHeight: 1
                            }}>
                              {value}
                            </Text>
                            <Text style={{
                              color: '#666',
                              fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                              fontSize: 12,
                              fontWeight: '500',
                              marginTop: 2,
                              textTransform: 'capitalize'
                            }}>
                              {key}
                            </Text>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '8px 0' }}>
                        <Text style={{
                          color: '#999',
                          fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                          fontSize: 13
                        }}>
                          No additional data available
                        </Text>
                      </div>
                    )}
                  </div>

                  {/* Action Menu */}
                  <div style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    zIndex: 10,
                  }}>
                    <Dropdown
                      overlay={
                        <Menu>
                          <Menu.Item
                            key="select"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCardSelect(index);
                            }}
                          >
                            <span style={{
                              fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                            }}>
                              ជ្រើសរើសដើម្បីបោះពុម្ព
                            </span>
                          </Menu.Item>
                          <Menu.Item
                            key="print"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrintIndividual(cardRefs.current[index], item.title);
                            }}
                          >
                            <span style={{
                              fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                            }}>
                              បោះពុម្ព
                            </span>
                          </Menu.Item>
                          <Menu.Item
                            key="pdf"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadIndividualPDF(cardRefs.current[index], item.title);
                            }}
                          >
                            <span style={{
                              fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                            }}>
                              ទាញយក PDF
                            </span>
                          </Menu.Item>
                        </Menu>
                      }
                      trigger={['click']}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        type="text"
                        icon={<MoreOutlined />}
                        style={{
                          color: '#666',
                          background: 'rgba(255, 255, 255, 0.9)',
                          border: '1px solid #f0f0f0',
                          borderRadius: '8px',
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Dropdown>
                  </div>

                  {/* Selection Indicator */}
                  {selectedCardIndex === index && (
                    <div style={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      background: COLORS[index % COLORS.length],
                      borderRadius: '50%',
                      width: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    }}>
                      <Text style={{
                        color: 'white',
                        fontSize: 12,
                        fontWeight: 'bold',
                        lineHeight: 1
                      }}>
                        ✓
                      </Text>
                    </div>
                  )}
                </Card>
              </Col>
            )) : (
              <Col span={24}>
                <Card style={{
                  background: 'white',
                  border: '1px solid #f0f0f0',
                  borderRadius: 16,
                  textAlign: 'center',
                  padding: 40,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
                }}>
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <span style={{
                        fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                        color: '#666'
                      }}>
                        មិនមានទិន្នន័យ
                      </span>
                    }
                  />
                </Card>
              </Col>
            )}
          </Row>

          <Row gutter={[24, 24]} style={{ marginTop: 32 }}>
            <Col span={24}>
              <Card
                ref={chartRefs.current.combinedChart}
                hoverable
                style={{
                  borderRadius: 20,
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: selectedCardIndex === 'combinedChart' ?
                    '2px solid #667eea' :
                    '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: selectedCardIndex === 'combinedChart' ?
                    '0 12px 40px rgba(102, 126, 234, 0.3)' :
                    '0 8px 32px rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer',
                  transform: selectedCardIndex === 'combinedChart' ? 'translateY(-4px)' : 'none',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => handleChartSelect('combinedChart')}
                title={
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: '8px 0' }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '12px',
                        padding: '8px',
                        marginRight: 12
                      }}>
                        <BarChartOutlined style={{ fontSize: 20, color: 'white' }} />
                      </div>
                      <div>
                        <Title level={4} style={{
                          fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                          fontWeight: "600",
                          margin: 0,
                          color: '#1a3353'
                        }}>
                          ទិដ្ឋភាពនៃការលក់និងចំណាយ
                        </Title>
                        <Text style={{
                          color: '#666',
                          fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                          fontSize: 12
                        }}>
                          ការប្រៀបធៀបចំណូលនិងចំណាយប្រចាំខែ
                        </Text>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Badge
                        count={combinedChartData.length}
                        style={{
                          backgroundColor: '#52c41a',
                          fontSize: 10
                        }}
                      />
                      <Dropdown
                        overlay={
                          <Menu>
                            <Menu.Item key="select" onClick={(e) => { e.stopPropagation(); handleChartSelect('combinedChart'); }}>
                              <span style={{ fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif" }}>
                                ជ្រើសរើសដើម្បីបោះពុម្ព
                              </span>
                            </Menu.Item>
                            <Menu.Item key="print" onClick={(e) => { e.stopPropagation(); handlePrintIndividual(chartRefs.current.combinedChart, "ទិដ្ឋភាពនៃការលក់និងចំណាយ"); }}>
                              <span style={{ fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif" }}>
                                បោះពុម្ព
                              </span>
                            </Menu.Item>
                            <Menu.Item key="pdf" onClick={(e) => { e.stopPropagation(); handleDownloadIndividualPDF(chartRefs.current.combinedChart, "ទិដ្ឋភាពនៃការលក់និងចំណាយ"); }}>
                              <span style={{ fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif" }}>
                                ទាញយក PDF
                              </span>
                            </Menu.Item>
                          </Menu>
                        }
                        trigger={['click']}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          type="text"
                          icon={<MoreOutlined />}
                          style={{
                            background: 'rgba(102, 126, 234, 0.1)',
                            border: '1px solid rgba(102, 126, 234, 0.2)',
                            borderRadius: 8,
                            color: '#667eea'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Dropdown>
                    </div>
                  </div>
                }
              >
                {combinedChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={combinedChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="saleGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#667eea" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#667eea" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f5576c" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#f5576c" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#43e97b" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#43e97b" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontFamily: "'Khmer OS', sans-serif", fontSize: 12 }}
                        stroke="#666"
                      />
                      <YAxis
                        tickFormatter={(value) => `${value.toLocaleString()}`}
                        tick={{ fontFamily: "system-ui, sans-serif", fontSize: 12 }}
                        stroke="#666"
                      />
                      <Tooltip
                        formatter={tooltipFormatter}
                        contentStyle={{
                          background: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(20px)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: 12,
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend
                        wrapperStyle={{
                          fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif"
                        }}
                      />
                      <Bar dataKey="sale" name="ការលក់" fill="url(#saleGradient)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name="ចំណាយ" fill="url(#expenseGradient)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="profit" name="ប្រាក់ចំណេញ" fill="url(#profitGradient)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: 60 }}>
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <span style={{
                          fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                          color: '#666'
                        }}>
                          មិនមានទិន្នន័យសម្រាប់បង្ហាញ
                        </span>
                      }
                    />
                  </div>
                )}

                {selectedCardIndex === 'combinedChart' && (
                  <div style={{
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    background: '#667eea',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
                    zIndex: 10
                  }}>
                    <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>✓</Text>
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
            {/* Sales Trend Chart */}
            <Col xs={24} lg={12}>
              <Card
                ref={chartRefs.current.salesTrendChart}
                hoverable
                style={{
                  borderRadius: 20,
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: selectedCardIndex === 'salesTrendChart' ?
                    '2px solid #43e97b' :
                    '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: selectedCardIndex === 'salesTrendChart' ?
                    '0 12px 40px rgba(67, 233, 123, 0.3)' :
                    '0 8px 32px rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer',
                  transform: selectedCardIndex === 'salesTrendChart' ? 'translateY(-4px)' : 'none',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  height: '100%'
                }}
                onClick={() => handleChartSelect('salesTrendChart')}
                title={
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div style={{
                        background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                        borderRadius: '12px',
                        padding: '8px',
                        marginRight: 12
                      }}>
                        <MoreOutlined style={{ fontSize: 20, color: 'white' }} />
                      </div>
                      <div>
                        <Title level={5} style={{
                          fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                          fontWeight: "600",
                          margin: 0,
                          color: '#1a3353'
                        }}>
                          និន្នាការលក់
                        </Title>
                        <Text style={{
                          color: '#666',
                          fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                          fontSize: 12
                        }}>
                          ការវិភាគនិន្នាការលក់ប្រចាំខែ
                        </Text>
                      </div>
                    </div>
                  </div>
                }
              >
                {saleByMonth.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={saleByMonth} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="salesAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#43e97b" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#43e97b" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontFamily: "'Khmer OS', sans-serif", fontSize: 11 }}
                        stroke="#666"
                      />
                      <YAxis
                        tickFormatter={(value) => `${value.toLocaleString()}`}
                        tick={{ fontFamily: "system-ui, sans-serif", fontSize: 11 }}
                        stroke="#666"
                      />
                      <Tooltip
                        formatter={tooltipFormatter}
                        contentStyle={{
                          background: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(20px)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: 12
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="sale"
                        name="ការលក់"
                        stroke="#43e97b"
                        strokeWidth={3}
                        fill="url(#salesAreaGradient)"
                        dot={{ fill: '#43e97b', r: 4 }}
                        activeDot={{ r: 6, fill: '#43e97b', stroke: 'white', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: 60 }}>
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <span style={{
                          fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                          color: '#666'
                        }}>
                          មិនមានទិន្នន័យ
                        </span>
                      }
                    />
                  </div>
                )}

                {selectedCardIndex === 'salesTrendChart' && (
                  <div style={{
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    background: '#43e97b',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(67, 233, 123, 0.4)',
                    zIndex: 10
                  }}>
                    <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>✓</Text>
                  </div>
                )}
              </Card>
            </Col>

            {/* Expense Trend Chart */}
            <Col xs={24} lg={12}>
              <Card
                ref={chartRefs.current.expenseTrendChart}
                hoverable
                style={{
                  borderRadius: 20,
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: selectedCardIndex === 'expenseTrendChart' ?
                    '2px solid #f5576c' :
                    '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: selectedCardIndex === 'expenseTrendChart' ?
                    '0 12px 40px rgba(245, 87, 108, 0.3)' :
                    '0 8px 32px rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer',
                  transform: selectedCardIndex === 'expenseTrendChart' ? 'translateY(-4px)' : 'none',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  height: '100%'
                }}
                onClick={() => handleChartSelect('expenseTrendChart')}
                title={
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div style={{
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        borderRadius: '12px',
                        padding: '8px',
                        marginRight: 12
                      }}>
                        <FallOutlined style={{ fontSize: 20, color: 'white' }} />
                      </div>
                      <div>
                        <Title level={5} style={{
                          fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                          fontWeight: "600",
                          margin: 0,
                          color: '#1a3353'
                        }}>
                          និន្នាការចំណាយ
                        </Title>
                        <Text style={{
                          color: '#666',
                          fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                          fontSize: 12
                        }}>
                          ការវិភាគចំណាយប្រចាំខែ
                        </Text>
                      </div>
                    </div>

                    <Badge
                      count={expenseByMonth.length}
                      style={{
                        backgroundColor: '#f5576c',
                        fontSize: 10
                      }}
                    />
                  </div>
                }
              >
                {expenseByMonth.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={expenseByMonth} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="expenseAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f5576c" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f5576c" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontFamily: "'Khmer OS', sans-serif", fontSize: 11 }}
                        stroke="#666"
                      />
                      <YAxis
                        tickFormatter={(value) => `${value.toLocaleString()}`}
                        tick={{ fontFamily: "system-ui, sans-serif", fontSize: 11 }}
                        stroke="#666"
                      />
                      <Tooltip
                        formatter={tooltipFormatter}
                        contentStyle={{
                          background: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(20px)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: 12
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="expense"
                        name="ចំណាយ"
                        stroke="#f5576c"
                        strokeWidth={3}
                        fill="url(#expenseAreaGradient)"
                        dot={{ fill: '#f5576c', r: 4 }}
                        activeDot={{ r: 6, fill: '#f5576c', stroke: 'white', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: 60 }}>
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <span style={{
                          fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                          color: '#666'
                        }}>
                          មិនមានទិន្នន័យ
                        </span>
                      }
                    />
                  </div>
                )}

                {selectedCardIndex === 'expenseTrendChart' && (
                  <div style={{
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    background: '#f5576c',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(245, 87, 108, 0.4)',
                    zIndex: 10
                  }}>
                    <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>✓</Text>
                  </div>
                )}
              </Card>
            </Col>

            {/* Top Products Pie Chart */}
            <Col xs={24} lg={16}>
              <Card
                hoverable
                style={{
                  borderRadius: 20,
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease',
                  height: '100%'
                }}
                title={
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      borderRadius: '12px',
                      padding: '8px',
                      marginRight: 12
                    }}>
                      <PieChartOutlined style={{ fontSize: 20, color: 'white' }} />
                    </div>
                    <div>
                      <Title level={5} style={{
                        fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                        fontWeight: "600",
                        margin: 0,
                        color: '#1a3353'
                      }}>
                        ផលិតផលលក់ដាច់បំផុត
                      </Title>
                      <Text style={{
                        color: '#666',
                        fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                        fontSize: 12
                      }}>
                        Top 5 ផលិតផលលក់ដាច់
                      </Text>
                    </div>
                  </div>
                }
              >
                {topSales.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <Pie
                        data={topSales}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        stroke="white"
                        strokeWidth={2}
                      >
                        {topSales.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`$${value.toLocaleString()}`, "ចំនួនលក់"]}
                        contentStyle={{
                          background: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(20px)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: 12,
                          fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif"
                        }}
                      />
                      <Legend
                        wrapperStyle={{
                          fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                          fontSize: 12
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: 60 }}>
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <span style={{
                          fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                          color: '#666'
                        }}>
                          មិនមានទិន្នន័យផលិតផល
                        </span>
                      }
                    />
                  </div>
                )}
              </Card>
            </Col>

            {/* Customer Directory */}
            <Col xs={24} lg={8}>
              <div style={{ height: '100%' }}>
                <CustomerList />
              </div>
            </Col>
          </Row>




        </div>
      </div>
    </div>
  );
}

export default HomePage;
