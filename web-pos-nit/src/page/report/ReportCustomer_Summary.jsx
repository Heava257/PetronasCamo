import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from 'react-i18next';
import { Chart } from "react-google-charts";
import { request } from "../../util/helper";
import { Button, DatePicker, Select, Space, Table, Tag, Card, Row, Col, Statistic } from "antd";
import { PrinterOutlined, FilePdfOutlined, UserOutlined, LineChartOutlined } from '@ant-design/icons';
import dayjs from "dayjs";
import { configStore } from "../../store/configStore";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const options = {
  curveType: "function",
  legend: { position: "bottom" },
};

function ReportCustomer_Summary() {
  const { config } = configStore();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const reportRef = useRef(null);
  const [filter, setFilter] = useState({
    from_date: dayjs().subtract(29, "d"),
    to_date: dayjs(),
    category_id: null
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
      category_id: null
    });
    getList({
      from_date: dayjs().subtract(29, "d").format("YYYY-MM-DD"),
      to_date: dayjs().format("YYYY-MM-DD"),
      category_id: null
    });
  };

  const getList = async (customFilter = null) => {
    try {
      setLoading(true);
      const param = customFilter || {
        from_date: dayjs(filter.from_date).format("YYYY-MM-DD"),
        to_date: dayjs(filter.to_date).format("YYYY-MM-DD"),
        category_id: filter.category_id
      };
      const res = await request("report_Customer", "get", param);
      if (res) {
        const listTMP = [["Day", "Customers"]];
        res.list?.forEach((item) => {
          listTMP.push([item.title, Number(item.total_amount)]);
        });
        setState({
          Data_Chat: listTMP,
          list: res.list,
        });
      } else {
        setState({
          Data_Chat: [["Day", "Customers"]],
          list: [],
        });
      }
    } catch (error) {
      console.error("Failed to fetch customer summary:", error);
    } finally {
      setLoading(false);
    }
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
      pdf.save(`Customer_Report_${dayjs().format('YYYY-MM-DD')}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const calculateStats = () => {
    const totalCustomers = state.list.reduce((sum, item) => sum + Number(item.total_amount || 0), 0);
    const avgDaily = state.list.length > 0 ? totalCustomers / state.list.length : 0;
    const maxDaily = state.list.length > 0 ? Math.max(...state.list.map(item => Number(item.total_amount || 0))) : 0;

    return { totalCustomers, avgDaily, maxDaily, totalDays: state.list.length };
  };

  const stats = calculateStats();

  // Mobile Card Component
  const CustomerMobileCard = ({ item, index }) => (
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
            <UserOutlined className="text-purple-600 dark:text-purple-400" />
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {item.total_amount}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{t('report.people_count')}</span>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${Number(item.total_amount) > 10
          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
          : 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
          }`}>
          {Number(item.total_amount) > 10 ? 'High' : 'Low'}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="report-customer-summary report-customer-summary-container px-2 sm:px-4 lg:px-6 py-4 min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header Section */}
      <Card
        className="mb-6 shadow-lg border-0 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-800 dark:to-pink-800"
        bodyStyle={{ padding: '24px' }}
      >
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <h1 className="text-white text-2xl lg:text-3xl font-bold flex items-center gap-3 mb-2">
              <UserOutlined /> {t('report.customer_summary_report')}
            </h1>
            <p className="text-white text-sm opacity-90">
              {t('report.customer_summary_subtitle')}
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
              <span className="hidden sm:inline">{t('report.print')}</span>
            </Button>
            <Button
              type="primary"
              icon={<FilePdfOutlined />}
              onClick={handleDownloadPDF}
              loading={loading}
              size="large"
              className="bg-orange-500 hover:bg-orange-600 border-0 shadow-md"
            >
              <span className="hidden sm:inline">{t('report.pdf')}</span>
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
          <Select
            allowClear
            placeholder={t('report.select_category')}
            value={filter.category_id}
            options={config?.category}
            onChange={(value) => {
              setFilter((prev) => ({
                ...prev,
                category_id: value
              }));
            }}
            size="large"
            className="w-full sm:w-48"
          />
          <Button
            onClick={onreset}
            size="large"
            className="w-full sm:w-auto"
          >
            {t('report.reset')}
          </Button>
          <Button
            type="primary"
            onClick={() => getList()}
            loading={loading}
            size="large"
            className="w-full sm:w-auto"
          >
            {t('report.apply_filters')}
          </Button>
        </Space>
      </Card>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-md bg-gradient-to-br from-purple-500 to-purple-600 border-0">
            <Statistic
              title={<span className="text-white opacity-90">{t('report.total_customers')}</span>}
              value={stats.totalCustomers}
              valueStyle={{ color: '#ffffff', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'bold' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-md bg-gradient-to-br from-pink-500 to-pink-600 border-0">
            <Statistic
              title={<span className="text-white opacity-90">{t('report.daily_average')}</span>}
              value={stats.avgDaily.toFixed(1)}
              valueStyle={{ color: '#ffffff', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'bold' }}
              suffix={<span className="text-sm">{t('report.people_count')}</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-md bg-gradient-to-br from-blue-500 to-blue-600 border-0">
            <Statistic
              title={<span className="text-white opacity-90">{t('report.peak_day')}</span>}
              value={stats.maxDaily}
              valueStyle={{ color: '#ffffff', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'bold' }}
              suffix={<span className="text-sm">{t('report.people_count')}</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-md bg-gradient-to-br from-green-500 to-green-600 border-0">
            <Statistic
              title={<span className="text-white opacity-90">{t('report.total_days')}</span>}
              value={stats.totalDays}
              valueStyle={{ color: '#ffffff', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'bold' }}
              suffix={<span className="text-sm">{t('report.days')}</span>}
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
              {t('report.customer_performance_chart')}
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
                    textStyle: { fontSize: 13, color: document.documentElement.classList.contains('template-chinesenewyear') ? "#FFD700" : "#4b5563" }
                  },
                  hAxis: {
                    title: t('report.order_date'),
                    titleTextStyle: { fontSize: 14, bold: true, color: document.documentElement.classList.contains('template-chinesenewyear') ? "#FFD700" : "#374151" },
                    textStyle: { fontSize: 12, color: document.documentElement.classList.contains('template-chinesenewyear') ? "#FFD700" : "#6b7280" },
                    gridlines: { color: document.documentElement.classList.contains('template-chinesenewyear') ? "#8a2d1d" : "#f3f4f6" }
                  },
                  vAxis: {
                    title: t('report.total_customers'),
                    titleTextStyle: { fontSize: 14, bold: true, color: document.documentElement.classList.contains('template-chinesenewyear') ? "#FFD700" : "#374151" },
                    textStyle: { fontSize: 12, color: document.documentElement.classList.contains('template-chinesenewyear') ? "#FFD700" : "#6b7280" },
                    gridlines: { color: document.documentElement.classList.contains('template-chinesenewyear') ? "#8a2d1d" : "#f3f4f6" }
                  },
                  colors: ["#a855f7"],
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
              <p className="text-lg">{t('report.no_data')}</p>
            </div>
          )}
        </Card>

        {/* Table Section - Desktop */}
        <div className="hidden md:block">
          <Card className="shadow-md dark:bg-gray-800" bodyStyle={{ padding: '24px' }}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {t('report.detailed_customer_data')}
            </h3>
            <Table
              loading={loading}
              dataSource={state.list}
              columns={[
                {
                  key: "no",
                  title: t('report.no'),
                  width: 60,
                  render: (_, __, index) => index + 1,
                },
                {
                  key: "title",
                  title: t('report.order_date'),
                  dataIndex: "title",
                  render: (value) => (
                    <Tag color="blue" className="text-sm px-3 py-1">
                      {value}
                    </Tag>
                  ),
                },
                {
                  key: "totalamount",
                  title: t('report.total_customers'),
                  dataIndex: "total_amount",
                  render: (value) => (
                    <Tag
                      color={value > 10 ? "green" : "pink"}
                      className="text-sm px-3 py-1"
                    >
                      {value} {t('report.people_count')}
                    </Tag>
                  ),
                },
              ]}
              pagination={{ pageSize: 10, showSizeChanger: true }}
              rowClassName={(_, index) =>
                index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'
              }
            />
          </Card>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden">
          <Card className="shadow-md dark:bg-gray-800" bodyStyle={{ padding: '16px' }}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {t('report.detailed_customer_data')}
            </h3>
            {loading ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">{t('report.loading')}</div>
            ) : state.list.length > 0 ? (
              <div className="space-y-3">
                {state.list.map((item, index) => (
                  <CustomerMobileCard key={index} item={item} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {t('report.no_data')}
              </div>
            )}
          </Card>
        </div>
      </div>

      <style>{`
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
        
        .report-customer-summary .ant-table-thead > tr > th {
          background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%) !important;
          color: #ffffff !important;
          font-weight: 600 !important;
        }
        
        .report-customer-summary .ant-table-tbody > tr:hover > td {
          background: #f3f4f6 !important;
        }
      `}</style>
    </div>
  );
}

export default ReportCustomer_Summary;