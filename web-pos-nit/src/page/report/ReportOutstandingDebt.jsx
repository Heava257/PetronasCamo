import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Chart } from "react-google-charts";
import { request } from "../../util/helper";
import { Button, Card, Table, Tag, Row, Col, Statistic, Select, Space, Progress } from "antd";
import { PrinterOutlined, FilePdfOutlined, DollarOutlined, WarningOutlined, ClockCircleOutlined } from '@ant-design/icons';
import MainPage from "../../component/layout/MainPage";
import dayjs from "dayjs";
import { configStore } from "../../store/configStore";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function ReportOutstandingDebt() {
  const { config } = configStore();
  const { t } = useTranslation();
  const reportRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({
    customer_id: null
  });
  const [state, setState] = useState({
    list: [],
    summary: {},
    chartData: []
  });

  useEffect(() => {
    getList();
  }, []);

  const getList = async (customFilter = null) => {
    try {
      setLoading(true);
      const param = customFilter || {
        customer_id: filter.customer_id
      };
      const res = await request("report_Outstanding_Debt", "get", param);
      if (res) {
        // Prepare aging chart data
        const agingData = [
          ["Aging Category", "Count"],
          ["Current", res.summary?.agingBreakdown?.current || 0],
          ["1-30 Days", res.summary?.agingBreakdown?.days1_30 || 0],
          ["31-60 Days", res.summary?.agingBreakdown?.days31_60 || 0],
          ["61-90 Days", res.summary?.agingBreakdown?.days61_90 || 0],
          ["90+ Days", res.summary?.agingBreakdown?.days90Plus || 0],
        ];

        setState({
          list: res.list || [],
          summary: res.summary || {},
          chartData: agingData
        });
      }
    } catch (error) {
      console.error("Failed to fetch outstanding debt:", error);
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
      pdf.save(`Outstanding_Debt_${dayjs().format('YYYY-MM-DD')}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const getAgingColor = (category) => {
    switch (category) {
      case 'Current': return 'green';
      case '1-30 Days': return 'blue';
      case '31-60 Days': return 'orange';
      case '61-90 Days': return 'volcano';
      case '90+ Days': return 'red';
      default: return 'default';
    }
  };

  const getProgressColor = (days) => {
    if (days <= 0) return '#52c41a';
    if (days <= 30) return '#1890ff';
    if (days <= 60) return '#faad14';
    if (days <= 90) return '#fa541c';
    return '#f5222d';
  };

  // Mobile Card Component
  const DebtMobileCard = ({ item, index }) => {
    const percentage = item.total_amount > 0
      ? ((item.total_amount - item.outstanding_amount) / item.total_amount) * 100
      : 0;

    return (
      <Card
        className="mb-3 shadow-sm hover:shadow-md transition-shadow duration-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        bodyStyle={{ padding: '16px' }}
      >
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">#{index + 1}</span>
                <Tag color="blue" className="text-xs">
                  Debt #{item.debt_id}
                </Tag>
                {item.order_id && (
                  <Tag color="purple" className="text-xs">
                    Order #{item.order_id}
                  </Tag>
                )}
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                {item.customer_name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                📞 {item.customer_tel}
              </p>
            </div>
            <Tag color={getAgingColor(item.aging_category)} className="text-xs px-2 py-1">
              {item.aging_category}
            </Tag>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{t('report.total_amount')}:</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {formatCurrency(item.total_amount)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{t('report.paid_amount')}:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(item.paid_amount)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{t('report.outstanding')}:</span>
              <span className="font-bold text-red-600 dark:text-red-400 text-lg">
                {formatCurrency(item.outstanding_amount)}
              </span>
            </div>
          </div>

          <Progress
            percent={percentage}
            strokeColor={getProgressColor(item.days_overdue)}
            size="small"
          />

          <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Created Date:</span>
              <span className="text-gray-900 dark:text-white">
                {item.formatted_date}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">{t('report.due_date')}:</span>
              <span className={item.days_overdue > 0 ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-900 dark:text-white'}>
                {dayjs(item.due_date).format("DD/MM/YYYY")}
              </span>
            </div>
            {item.days_overdue > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Overdue:</span>
                <span className="text-red-600 dark:text-red-400 font-bold">
                  {item.days_overdue} {t('report.days')}
                </span>
              </div>
            )}
            {item.last_payment_date && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Last Payment:</span>
                <span className="text-green-600 dark:text-green-400">
                  {dayjs(item.last_payment_date).format("DD/MM/YYYY")}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const columns = [
    {
      key: "no",
      title: t('report.no'),
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      key: "reference",
      title: t('report.reference_no'),
      dataIndex: "reference_no",
      render: (ref) => (
        <Tag color="purple" className="text-sm">{ref}</Tag>
      ),
    },
    {
      key: "customer",
      title: t('report.customer'),
      dataIndex: "customer_name",
      render: (name, record) => (
        <div>
          <div className="font-semibold">{name}</div>
          <div className="text-xs text-gray-500">{record.customer_tel}</div>
        </div>
      ),
    },
    {
      key: "total",
      title: t('report.total_amount'),
      dataIndex: "total_amount",
      render: (amount) => (
        <span className="font-semibold">{formatCurrency(amount)}</span>
      ),
    },
    {
      key: "paid",
      title: t('report.paid_amount'),
      dataIndex: "paid_amount",
      render: (amount) => (
        <span className="text-green-600 dark:text-green-400">
          {formatCurrency(amount)}
        </span>
      ),
    },
    {
      key: "outstanding",
      title: t('report.outstanding'),
      dataIndex: "outstanding_amount",
      render: (amount) => (
        <span className="font-bold text-red-600 dark:text-red-400 text-lg">
          {formatCurrency(amount)}
        </span>
      ),
    },
    {
      key: "aging",
      title: t('report.aging'),
      dataIndex: "aging_category",
      render: (category) => (
        <Tag color={getAgingColor(category)}>{category}</Tag>
      ),
    },
    {
      key: "overdue",
      title: t('report.days_overdue'),
      dataIndex: "days_overdue",
      render: (days) => (
        <span className={days > 0 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-green-600 dark:text-green-400'}>
          {days > 0 ? `${days} ${t('report.days')}` : t('report.on_time')}
        </span>
      ),
    },
    {
      key: "due_date",
      title: t('report.due_date'),
      dataIndex: "due_date",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
  ];

  return (
    <MainPage loading={loading}>
      <div className="px-2 sm:px-4 lg:px-6 py-4 min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Header */}
        <Card
          className="mb-6 shadow-lg border-0 bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-800 dark:to-orange-800"
          bodyStyle={{ padding: '24px' }}
        >
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
              <h1 className="text-white text-2xl lg:text-3xl font-bold flex items-center gap-3 mb-2">
                <WarningOutlined /> {t('report.outstanding_debt')}
              </h1>
              <p className="text-white text-sm opacity-90">
                {t('report.outstanding_debt_subtitle')}
              </p>
            </div>
            <Space size="middle" className="flex-wrap">
              <Button
                icon={<PrinterOutlined />}
                onClick={handlePrint}
                loading={loading}
                size="large"
              >
                <span className="hidden sm:inline">{t('report.print')}</span>
              </Button>
              <Button
                type="primary"
                icon={<FilePdfOutlined />}
                onClick={handleDownloadPDF}
                loading={loading}
                size="large"
                className="bg-orange-500 hover:bg-orange-600 border-0"
              >
                <span className="hidden sm:inline">{t('report.pdf')}</span>
              </Button>
            </Space>
          </div>
        </Card>

        {/* Filter */}
        <Card className="mb-6 shadow-md dark:bg-gray-800" bodyStyle={{ padding: '20px' }}>
          <Space wrap size="middle" className="w-full">
            <Select
              allowClear
              placeholder={t('report.select_customer')}
              value={filter.customer_id}
              options={config?.customer || []}
              onChange={(value) => {
                setFilter({ customer_id: value });
                getList({ customer_id: value });
              }}
              size="large"
              className="w-full sm:w-64"
            />
            <Button
              onClick={() => {
                setFilter({ customer_id: null });
                getList({ customer_id: null });
              }}
              size="large"
              className="w-full sm:w-auto"
            >
              {t('report.show_all')}
            </Button>
          </Space>
        </Card>

        {/* Statistics */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={8}>
            <Card className="shadow-md bg-gradient-to-br from-red-500 to-red-600 border-0">
              <Statistic
                title={<span className="text-white opacity-90">{t('report.total_outstanding')}</span>}
                value={formatCurrency(state.summary.totalOutstanding || 0)}
                valueStyle={{ color: '#ffffff', fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 'bold' }}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card className="shadow-md bg-gradient-to-br from-orange-500 to-orange-600 border-0">
              <Statistic
                title={<span className="text-white opacity-90">{t('report.total_orders')}</span>}
                value={state.summary.totalOrders || 0}
                valueStyle={{ color: '#ffffff', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'bold' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card className="shadow-md bg-gradient-to-br from-yellow-500 to-yellow-600 border-0">
              <Statistic
                title={<span className="text-white opacity-90">{t('report.critical_90_days')}</span>}
                value={state.summary.agingBreakdown?.days90Plus || 0}
                valueStyle={{ color: '#ffffff', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'bold' }}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <div ref={reportRef}>
          {/* Aging Chart */}
          {state.chartData.length > 1 && (
            <Card className="mb-6 shadow-md dark:bg-gray-800" bodyStyle={{ padding: '32px' }}>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {t('report.aging_analysis')}
              </h3>
              <Chart
                chartType="PieChart"
                width="100%"
                height="400px"
                data={state.chartData}
                options={{
                  legend: { position: "bottom" },
                  colors: ["#52c41a", "#1890ff", "#faad14", "#fa541c", "#f5222d"],
                  chartArea: { width: "90%", height: "80%" }
                }}
              />
            </Card>
          )}

          {/* Desktop Table */}
          <div className="hidden md:block">
            <Card className="shadow-md dark:bg-gray-800" bodyStyle={{ padding: '24px' }}>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {t('report.debt_details')}
              </h3>
              <Table
                loading={loading}
                dataSource={state.list}
                columns={columns}
                pagination={{ pageSize: 20, showSizeChanger: true }}
                rowClassName={(_, index) =>
                  index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'
                }
                scroll={{ x: true }}
                rowKey="debt_id"
              />
            </Card>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden">
            <Card className="shadow-md dark:bg-gray-800" bodyStyle={{ padding: '16px' }}>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {t('report.debt_details')}
              </h3>
              {loading ? (
                <div className="text-center py-8">{t('report.loading')}</div>
              ) : state.list.length > 0 ? (
                <div className="space-y-3">
                  {state.list.map((item, index) => (
                    <DebtMobileCard key={item.order_id} item={item} index={index} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">{t('report.no_payment_history')}</div>
              )}
            </Card>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .ant-table-thead > tr > th {
          background: linear-gradient(135deg, #dc2626 0%, #f97316 100%) !important;
          color: #ffffff !important;
          font-weight: 600 !important;
        }
      `}</style>
    </MainPage>
  );
}

export default ReportOutstandingDebt;