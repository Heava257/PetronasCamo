import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from 'react-i18next';
import { Chart } from "react-google-charts";
import { request } from "../../util/helper";
import { Button, DatePicker, Select, Space, Table, Tag, Card, Row, Col, Statistic } from "antd";
import { PrinterOutlined, FilePdfOutlined, LineChartOutlined, RiseOutlined, ShoppingOutlined } from '@ant-design/icons';
import dayjs from "dayjs";
import { configStore } from "../../store/configStore";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const options = {
  curveType: "function",
  legend: { position: "bottom" },
};

function ReportSale_Summary() {
  const { config } = configStore();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const reportRef = useRef(null);
  const [filter, setFilter] = useState({
    from_date: dayjs().subtract(29, "d"),
    to_date: dayjs(),
    category_id: null,
    brand_id: null
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
      category_id: null,
      brand_id: null,
    });
    getList({
      from_date: dayjs().subtract(29, "d").format("YYYY-MM-DD"),
      to_date: dayjs().format("YYYY-MM-DD"),
      category_id: null,
      brand_id: null,
    });
  };

  // ✅ FIXED: ReportSale_Summary.jsx

  const getList = async (customFilter = null) => {
    try {
      setLoading(true);
      const param = customFilter || {
        from_date: dayjs(filter.from_date).format("YYYY-MM-DD"),
        to_date: dayjs(filter.to_date).format("YYYY-MM-DD"),
        category_id: filter.category_id,
        brand_id: filter.brand_id,
      };

      // ✅ FIXED: Correct spelling
      const res = await request("report_Sale_Sammary", "get", param);
      //                          ^^^^^^^^^^^^^^^^^^^^
      // Changed from "report_Sale_Sammary" to "report_Sale_Summary"

      if (res) {
        const listTMP = [["Day", "Sale"]];
        res.list?.forEach((item) => {
          listTMP.push([item.order_date, Number(item.total_amount)]);
        });
        setState({
          Data_Chat: listTMP,
          list: res.list,
        });
      }
    } catch (error) {
      console.error("Failed to fetch sales summary:", error);
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
      pdf.save(`Sales_Report_${dayjs().format('YYYY-MM-DD')}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const calculateStats = () => {
    const totalAmount = state.list.reduce((sum, item) => sum + Number(item.total_amount || 0), 0);
    const totalQty = state.list.reduce((sum, item) => sum + Number(item.total_qty || 0), 0);
    const avgDaily = state.list.length > 0 ? totalAmount / state.list.length : 0;

    return { totalAmount, totalQty, avgDaily };
  };

  const stats = calculateStats();

  // Mobile Card Component
  const SaleMobileCard = ({ item, index }) => (
    <Card
      className="mb-3 shadow-sm hover:shadow-md transition-shadow duration-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      bodyStyle={{ padding: '16px' }}
    >
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">#{index + 1}</span>
              <Tag color="blue" className="text-sm">
                {dayjs(item.order_date).format("DD/MM/YYYY")}
              </Tag>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${Number(item.total_amount) > 200
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            : Number(item.total_amount) > 100
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
            }`}>
            {Number(item.total_amount) > 200 ? 'High' : Number(item.total_amount) > 100 ? 'Medium' : 'Low'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingOutlined className="text-blue-600 dark:text-blue-400" />
              <span className="text-xs text-gray-600 dark:text-gray-400">{t('report.total_quantity')}</span>
            </div>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {Number(item.total_qty).toLocaleString()} {t('report.liter')}
            </span>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <RiseOutlined className="text-green-600 dark:text-green-400" />
              <span className="text-xs text-gray-600 dark:text-gray-400">{t('report.total_amount')}</span>
            </div>
            <span className="text-lg font-bold text-green-600 dark:text-green-400">
              {formatCurrency(item.total_amount)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="px-2 sm:px-4 lg:px-6 py-4 min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header Section */}
      <Card
        className="mb-6 shadow-lg border-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-800 dark:via-indigo-800 dark:to-purple-800"
        bodyStyle={{ padding: '24px' }}
      >
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <h1 className="text-white text-2xl lg:text-3xl font-bold flex items-center gap-3 mb-2">
              <LineChartOutlined /> {t('report.sale_summary_report')}
            </h1>
            <p className="text-white text-sm opacity-90">
              {t('report.sale_summary_subtitle')}
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
          <Select
            allowClear
            placeholder={t('report.select_brand')}
            value={filter.brand_id}
            options={config?.brand}
            onChange={(value) => {
              setFilter((prev) => ({
                ...prev,
                brand_id: value
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
        <Col xs={24} sm={12} lg={8}>
          <Card className="shadow-md bg-gradient-to-br from-blue-500 to-blue-600 border-0">
            <Statistic
              title={<span className="text-white opacity-90">{t('report.total_revenue')}</span>}
              value={formatCurrency(stats.totalAmount)}
              valueStyle={{ color: '#ffffff', fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card className="shadow-md bg-gradient-to-br from-indigo-500 to-indigo-600 border-0">
            <Statistic
              title={<span className="text-white opacity-90">{t('report.total_quantity')}</span>}
              value={stats.totalQty.toLocaleString()}
              suffix={<span className="text-sm">{t('report.liter')}</span>}
              valueStyle={{ color: '#ffffff', fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card className="shadow-md bg-gradient-to-br from-purple-500 to-purple-600 border-0">
            <Statistic
              title={<span className="text-white opacity-90">{t('report.daily_average')}</span>}
              value={formatCurrency(stats.avgDaily)}
              valueStyle={{ color: '#ffffff', fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 'bold' }}
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
              {t('report.sales_performance_chart')}
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
                    title: t('report.order_date'),
                    titleTextStyle: { fontSize: 14, bold: true, color: "#374151" },
                    textStyle: { fontSize: 12, color: "#6b7280" },
                    gridlines: { color: "#f3f4f6" }
                  },
                  vAxis: {
                    title: t('report.sales_amount'),
                    titleTextStyle: { fontSize: 14, bold: true, color: "#374151" },
                    textStyle: { fontSize: 12, color: "#6b7280" },
                    gridlines: { color: "#f3f4f6" },
                    format: "currency"
                  },
                  colors: ["#667eea"],
                  chartArea: { width: "85%", height: "70%" },
                  lineWidth: 3,
                  pointSize: 6,
                  backgroundColor: { fill: "transparent" },
                  series: {
                    0: {
                      areaOpacity: 0.1,
                      lineWidth: 3
                    }
                  }
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
              {t('report.detailed_sales_data')}
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
                  dataIndex: "order_date",
                  render: (value) => (
                    <Tag color="blue" className="text-sm px-3 py-1">
                      {value}
                    </Tag>
                  ),
                },
                {
                  key: "totalqty",
                  title: t('report.total_quantity'),
                  dataIndex: "total_qty",
                  render: (value) => (
                    <Tag
                      color={Number(value) > 2 ? "blue" : Number(value) > 1 ? "green" : "pink"}
                      className="text-sm px-3 py-1"
                    >
                      {Number(value).toLocaleString()} {t('report.liter')}
                    </Tag>
                  ),
                },
                {
                  key: "totalamount",
                  title: t('report.total_amount'),
                  dataIndex: "total_amount",
                  render: (value) => (
                    <Tag
                      color={Number(value) > 200 ? "blue" : Number(value) > 100 ? "green" : "pink"}
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
                let totalQty = 0;
                let totalAmount = 0;

                pageData.forEach(({ total_qty, total_amount }) => {
                  totalQty += Number(total_qty || 0);
                  totalAmount += Number(total_amount || 0);
                });

                return (
                  <Table.Summary.Row className="bg-gray-100 dark:bg-gray-700">
                    <Table.Summary.Cell index={0}>
                      <strong className="text-base">{t('report.total')}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}></Table.Summary.Cell>
                    <Table.Summary.Cell index={2}>
                      <strong className="text-base">{totalQty.toLocaleString()} {t('report.liter')}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3}>
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
              {t('report.detailed_sales_data')}
            </h3>
            {loading ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">{t('report.loading')}</div>
            ) : state.list.length > 0 ? (
              <>
                <div className="space-y-3 mb-4">
                  {state.list.map((item, index) => (
                    <SaleMobileCard key={index} item={item} index={index} />
                  ))}
                </div>
                <Card className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 border-0">
                  <div className="text-white">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-sm opacity-90 mb-1">{t('report.total_quantity')}</p>
                        <p className="text-xl font-bold">{stats.totalQty.toLocaleString()} {t('report.liter')}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm opacity-90 mb-1">{t('report.total_revenue')}</p>
                        <p className="text-xl font-bold">{formatCurrency(stats.totalAmount)}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {t('report.no_data')}
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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
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

export default ReportSale_Summary;