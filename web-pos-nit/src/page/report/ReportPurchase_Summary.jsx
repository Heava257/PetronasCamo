import React, { useEffect, useState, useRef } from "react";
import { Chart } from "react-google-charts";
import { request } from "../../util/helper";
import { Button, DatePicker, Space, Table, Tag, Card, Row, Col, Statistic } from "antd";
import { PrinterOutlined, FilePdfOutlined, ShoppingCartOutlined, LineChartOutlined } from '@ant-design/icons';
import dayjs from "dayjs";
import { configStore } from "../../store/configStore";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const options = {
  curveType: "function",
  legend: { position: "bottom" },
};

function ReportPurchase_Summary() {
  const { config } = configStore();
  const [loading, setLoading] = useState(false);
  const reportRef = useRef(null);
  const [filter, setFilter] = useState({
    from_date: dayjs().subtract(29, "d"),
    to_date: dayjs(),
  });
  const [state, setState] = useState({
    Data_Chat: [],
    list: [],
  });

  useEffect(() => {
    getList();
  }, []);

  const onreset = () => {
    setFilter({
      from_date: dayjs().subtract(29, "d"),
      to_date: dayjs(),
    });
    getList({
      from_date: dayjs().subtract(29, "d").format("YYYY-MM-DD"),
      to_date: dayjs().format("YYYY-MM-DD"),
    });
  };

  const getList = async (customFilter = null) => {
    try {
      setLoading(true);
      const param = customFilter || {
        from_date: dayjs(filter.from_date).format("YYYY-MM-DD"),
        to_date: dayjs(filter.to_date).format("YYYY-MM-DD"),
      };
      const res = await request("report_Purchase_Summary", "get", param);
      if (res) {
        const listTMP = [["Day", "Purchase"]];
        res.list?.forEach((item) => {
          listTMP.push([item.title, Number(item.total_amount)]);
        });
        setState({
          Data_Chat: listTMP,
          list: res.list,
        });
      } else {
        setState({
          Data_Chat: [["Day", "Purchase"]],
          list: [],
        });
      }
    } catch (error) {
      console.error("Failed to fetch purchase summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(value);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    
    try {
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
      pdf.save(`Purchase_Report_${dayjs().format('YYYY-MM-DD')}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const calculateStats = () => {
    const totalPurchase = state.list.reduce((sum, item) => sum + Number(item.total_amount || 0), 0);
    const avgDaily = state.list.length > 0 ? totalPurchase / state.list.length : 0;
    const maxDaily = state.list.length > 0 ? Math.max(...state.list.map(item => Number(item.total_amount || 0))) : 0;
    
    return { totalPurchase, avgDaily, maxDaily, totalDays: state.list.length };
  };

  const stats = calculateStats();

  // Mobile Card Component
  const PurchaseMobileCard = ({ item, index }) => (
    <Card 
      className="mb-3 shadow-sm hover:shadow-md transition-shadow duration-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      bodyStyle={{ padding: '16px' }}
    >
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">#{index + 1}</span>
            <Tag color="blue" className="text-sm">
              {item.title}
            </Tag>
          </div>
          <div className="flex items-center gap-2">
            <ShoppingCartOutlined className="text-indigo-600 dark:text-indigo-400" />
            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {formatCurrency(item.total_amount)}
            </span>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          Number(item.total_amount) > 200
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            : Number(item.total_amount) > 100 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
        }`}>
          {Number(item.total_amount) > 200 ? 'High' : Number(item.total_amount) > 100 ? 'Medium' : 'Low'}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="px-2 sm:px-4 lg:px-6 py-4 min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header Section */}
      <Card 
        className="mb-6 shadow-lg border-0 bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-800 dark:to-blue-800"
        bodyStyle={{ padding: '24px' }}
      >
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <h1 className="text-white text-2xl lg:text-3xl font-bold flex items-center gap-3 mb-2">
              <ShoppingCartOutlined /> Purchase Performance Dashboard
            </h1>
            <p className="text-white text-sm opacity-90">
              Track and analyze your purchase activities
            </p>
          </div>
          <Space size="middle" className="flex-wrap">
            <Button 
              icon={<PrinterOutlined />} 
              onClick={handlePrint}
              loading={loading}
              size="large"
              className="shadow-md"
            >
              <span className="hidden sm:inline">Print</span>
            </Button>
            <Button 
              type="primary" 
              icon={<FilePdfOutlined />} 
              onClick={handleDownloadPDF}
              loading={loading}
              size="large"
              className="bg-orange-500 hover:bg-orange-600 border-0 shadow-md"
            >
              <span className="hidden sm:inline">PDF</span>
            </Button>
          </Space>
        </div>
      </Card>

      {/* Filter Section */}
      <Card className="mb-6 shadow-md dark:bg-gray-800" bodyStyle={{ padding: '20px' }}>
        <Space wrap size="middle" className="w-full">
          <DatePicker.RangePicker
            value={[filter.from_date, filter.to_date]}
            loading={loading}
            allowClear={false}
            format={"DD/MM/YYYY"}
            onChange={(value) => {
              setFilter((prev) => ({
                ...prev,
                from_date: value[0],
                to_date: value[1]
              }));
            }}
            size="large"
            className="w-full sm:w-auto"
          />
          <Button 
            onClick={onreset}
            size="large"
            className="w-full sm:w-auto"
          >
            Reset Filters
          </Button>
          <Button 
            type="primary" 
            onClick={() => getList()} 
            loading={loading}
            size="large"
            className="w-full sm:w-auto"
          >
            Apply Filters
          </Button>
        </Space>
      </Card>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-md bg-gradient-to-br from-indigo-500 to-indigo-600 border-0">
            <Statistic
              title={<span className="text-white opacity-90">Total Purchase</span>}
              value={formatCurrency(stats.totalPurchase)}
              valueStyle={{ color: '#ffffff', fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-md bg-gradient-to-br from-blue-500 to-blue-600 border-0">
            <Statistic
              title={<span className="text-white opacity-90">Daily Average</span>}
              value={formatCurrency(stats.avgDaily)}
              valueStyle={{ color: '#ffffff', fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-md bg-gradient-to-br from-cyan-500 to-cyan-600 border-0">
            <Statistic
              title={<span className="text-white opacity-90">Peak Day</span>}
              value={formatCurrency(stats.maxDaily)}
              valueStyle={{ color: '#ffffff', fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-md bg-gradient-to-br from-teal-500 to-teal-600 border-0">
            <Statistic
              title={<span className="text-white opacity-90">Total Days</span>}
              value={stats.totalDays}
              valueStyle={{ color: '#ffffff', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'bold' }}
              suffix={<span className="text-sm">days</span>}
            />
          </Card>
        </Col>
      </Row>

      {/* Report Content */}
      <div ref={reportRef}>
        {/* Chart Section */}
        <Card className="mb-6 shadow-md dark:bg-gray-800" bodyStyle={{ padding: '32px' }}>
          <div className="text-center mb-6">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Purchase Performance Chart
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {dayjs(filter.from_date).format("MMM DD, YYYY")} - {dayjs(filter.to_date).format("MMM DD, YYYY")}
            </p>
          </div>

          {state.Data_Chat.length > 1 ? (
            <div className="bg-white dark:bg-gray-700 rounded-xl p-4 lg:p-6 shadow-inner">
              <Chart
                chartType="LineChart"
                width="100%"
                height="400px"
                data={state.Data_Chat}
                options={{
                  curveType: "function",
                  legend: { 
                    position: "bottom",
                    textStyle: { fontSize: 13, color: "#4b5563" }
                  },
                  hAxis: { 
                    title: "Date",
                    titleTextStyle: { fontSize: 14, bold: true, color: "#374151" },
                    textStyle: { fontSize: 12, color: "#6b7280" },
                    gridlines: { color: "#f3f4f6" }
                  },
                  vAxis: { 
                    title: "Purchase Amount ($)",
                    titleTextStyle: { fontSize: 14, bold: true, color: "#374151" },
                    textStyle: { fontSize: 12, color: "#6b7280" },
                    gridlines: { color: "#f3f4f6" },
                    format: "currency"
                  },
                  colors: ["#6366f1"],
                  chartArea: { width: "85%", height: "70%" },
                  lineWidth: 3,
                  pointSize: 6,
                  backgroundColor: { fill: "transparent" }
                }}
                legendToggle
              />
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <LineChartOutlined className="text-5xl mb-4 opacity-50" />
              <p className="text-lg">No data available for the selected filters.</p>
            </div>
          )}
        </Card>

        {/* Table Section - Desktop */}
        <div className="hidden md:block">
          <Card className="shadow-md dark:bg-gray-800" bodyStyle={{ padding: '24px' }}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Detailed Purchase Data
            </h3>
            <Table
              loading={loading}
              dataSource={state.list}
              columns={[
                {
                  key: "no",
                  title: "No",
                  width: 60,
                  render: (_, __, index) => index + 1,
                },
                {
                  key: "title",
                  title: "Purchase Date",
                  dataIndex: "title",
                  render: (value) => (
                    <Tag color="blue" className="text-sm px-3 py-1">
                      {value}
                    </Tag>
                  ),
                },
                {
                  key: "totalamount",
                  title: "Total Amount",
                  dataIndex: "total_amount",
                  render: (value) => (
                    <Tag
                      color={value > 200 ? "blue" : value > 100 ? "green" : "pink"}
                      className="text-sm px-3 py-1"
                    >
                      {formatCurrency(value)}
                    </Tag>
                  ),
                },
              ]}
              pagination={{ pageSize: 10, showSizeChanger: true }}
              rowClassName={(_, index) => 
                index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'
              }
              summary={(pageData) => {
                let totalAmount = 0;
                pageData.forEach(({ total_amount }) => {
                  totalAmount += Number(total_amount || 0);
                });

                return (
                  <Table.Summary.Row className="bg-gray-100 dark:bg-gray-700">
                    <Table.Summary.Cell index={0}>
                      <strong className="text-base">Total</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}></Table.Summary.Cell>
                    <Table.Summary.Cell index={2}>
                      <strong className="text-base">{formatCurrency(totalAmount)}</strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                );
              }}
            />
          </Card>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden">
          <Card className="shadow-md dark:bg-gray-800" bodyStyle={{ padding: '16px' }}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Detailed Purchase Data
            </h3>
            {loading ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
            ) : state.list.length > 0 ? (
              <>
                <div className="space-y-3 mb-4">
                  {state.list.map((item, index) => (
                    <PurchaseMobileCard key={index} item={item} index={index} />
                  ))}
                </div>
                <Card className="bg-gradient-to-r from-indigo-500 to-blue-500 border-0">
                  <div className="text-white text-center">
                    <p className="text-sm opacity-90 mb-1">Total Purchase</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats.totalPurchase)}</p>
                  </div>
                </Card>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No data available
              </div>
            )}
          </Card>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .report-content, .report-content * {
            visibility: visible;
          }
          .report-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
        
        .ant-table-thead > tr > th {
          background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%) !important;
          color: #ffffff !important;
          font-weight: 600 !important;
        }
        
        .ant-table-tbody > tr:hover > td {
          background: #f3f4f6 !important;
        }
      `}</style>
    </div>
  );
}

export default ReportPurchase_Summary;