import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from 'react-i18next';
import { Chart } from "react-google-charts";
import { request } from "../../util/helper";
import { Button, Card, Table, Tag, Row, Col, Statistic, DatePicker, Select, Space } from "antd";
import { PrinterOutlined, FilePdfOutlined, SwapOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import MainPage from "../../component/layout/MainPage";
import dayjs from "dayjs";
import { configStore } from "../../store/configStore";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function ReportStockMovement() {
  const { config } = configStore();
  const { t } = useTranslation();
  const reportRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({
    from_date: dayjs().subtract(29, "d"),
    to_date: dayjs(),
    product_id: null
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
        from_date: dayjs(filter.from_date).format("YYYY-MM-DD"),
        to_date: dayjs(filter.to_date).format("YYYY-MM-DD"),
        product_id: filter.product_id
      };
      const res = await request("report_Stock_Movement", "get", param);
      if (res) {
        // Prepare chart data
        const chartData = [[t('report.date'), t('report.purchases'), t('report.sales')]];
        const dateMap = {};

        res.list?.forEach(item => {
          const date = dayjs(item.movement_date).format("DD/MM");
          if (!dateMap[date]) {
            dateMap[date] = { purchase: 0, sale: 0 };
          }
          if (item.movement_type === 'Purchase') {
            dateMap[date].purchase += parseFloat(item.amount || 0);
          } else {
            dateMap[date].sale += parseFloat(item.amount || 0);
          }
        });

        Object.entries(dateMap).forEach(([date, values]) => {
          chartData.push([date, values.purchase, values.sale]);
        });

        setState({
          list: res.list || [],
          summary: res.summary || {},
          chartData
        });
      }
    } catch (error) {
      console.error("Failed to fetch stock movement:", error);
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
      pdf.save(`Stock_Movement_${dayjs().format('YYYY-MM-DD')}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const onReset = () => {
    setFilter({
      from_date: dayjs().subtract(29, "d"),
      to_date: dayjs(),
      product_id: null
    });
    getList({
      from_date: dayjs().subtract(29, "d").format("YYYY-MM-DD"),
      to_date: dayjs().format("YYYY-MM-DD"),
      product_id: null
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Mobile Card Component
  const MovementMobileCard = ({ item, index }) => (
    <Card
      className={`mb-3 shadow-sm hover:shadow-md transition-shadow duration-200 border ${item.movement_type === 'Purchase'
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
        }`}
      bodyStyle={{ padding: '16px' }}
    >
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">#{index + 1}</span>
              <Tag color={item.movement_type === 'Purchase' ? 'green' : 'red'} icon={
                item.movement_type === 'Purchase' ? <ArrowDownOutlined /> : <ArrowUpOutlined />
              }>
                {item.movement_type}
              </Tag>
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
              {item.reference_no}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {item.product_name}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-lg p-3 ${item.movement_type === 'Purchase'
              ? 'bg-green-100 dark:bg-green-900/40'
              : 'bg-red-100 dark:bg-red-900/40'
            }`}>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('report.amount')}</p>
            <p className={`text-lg font-bold ${item.movement_type === 'Purchase'
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
              }`}>
              {formatCurrency(item.amount)}
            </p>
          </div>

          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('report.party')}</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {item.related_party || 'N/A'}
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {dayjs(item.movement_date).format("DD/MM/YYYY HH:mm")}
          </p>
        </div>
      </div>
    </Card>
  );

  const columns = [
    {
      key: "no",
      title: t('report.no'),
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      key: "type",
      title: t('report.type'),
      dataIndex: "movement_type",
      render: (type) => (
        <Tag
          color={type === 'Purchase' ? 'green' : 'red'}
          icon={type === 'Purchase' ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
        >
          {type}
        </Tag>
      ),
    },
    {
      key: "reference",
      title: t('report.reference_no'),
      dataIndex: "reference_no",
    },
    {
      key: "product",
      title: t('report.product_name'),
      dataIndex: "product_name",
    },
    {
      key: "amount",
      title: t('report.amount'),
      dataIndex: "amount",
      render: (amount, record) => (
        <span className={`font-bold ${record.movement_type === 'Purchase'
            ? 'text-green-600 dark:text-green-400'
            : 'text-red-600 dark:text-red-400'
          }`}>
          {formatCurrency(amount)}
        </span>
      ),
    },
    {
      key: "party",
      title: t('report.related_party'),
      dataIndex: "related_party",
    },
    {
      key: "date",
      title: t('report.date'),
      dataIndex: "movement_date",
      render: (date) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
  ];

  return (
    <MainPage loading={loading}>
      <div className="px-2 sm:px-4 lg:px-6 py-4 min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Header */}
        <Card
          className="mb-6 shadow-lg border-0 bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-800 dark:to-cyan-800"
          bodyStyle={{ padding: '24px' }}
        >
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
              <h1 className="text-white text-2xl lg:text-3xl font-bold flex items-center gap-3 mb-2">
                <SwapOutlined /> {t('report.stock_movement_report')}
              </h1>
              <p className="text-white text-sm opacity-90">
                {t('report.stock_movement_subtitle')}
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

        {/* Filters */}
        <Card className="mb-6 shadow-md dark:bg-gray-800" bodyStyle={{ padding: '20px' }}>
          <Space wrap size="middle" className="w-full">
            <DatePicker.RangePicker
              value={[filter.from_date, filter.to_date]}
              onChange={(dates) => setFilter(prev => ({ ...prev, from_date: dates[0], to_date: dates[1] }))}
              format="DD/MM/YYYY"
              size="large"
              className="w-full sm:w-auto"
            />
            <Select
              allowClear
              placeholder={t('report.select_product')}
              value={filter.product_id}
              options={config?.product || []}
              onChange={(value) => setFilter(prev => ({ ...prev, product_id: value }))}
              size="large"
              className="w-full sm:w-48"
            />
            <Button onClick={onReset} size="large" className="w-full sm:w-auto">
              {t('report.reset')}
            </Button>
            <Button type="primary" onClick={() => getList()} loading={loading} size="large" className="w-full sm:w-auto">
              {t('report.apply_filters')}
            </Button>
          </Space>
        </Card>

        {/* Statistics */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-md bg-gradient-to-br from-green-500 to-green-600 border-0">
              <Statistic
                title={<span className="text-white opacity-90">{t('report.total_purchases')}</span>}
                value={state.summary.totalPurchases || 0}
                valueStyle={{ color: '#ffffff', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'bold' }}
                prefix={<ArrowDownOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-md bg-gradient-to-br from-red-500 to-red-600 border-0">
              <Statistic
                title={<span className="text-white opacity-90">{t('report.total_sales')}</span>}
                value={state.summary.totalSales || 0}
                valueStyle={{ color: '#ffffff', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'bold' }}
                prefix={<ArrowUpOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-md bg-gradient-to-br from-blue-500 to-blue-600 border-0">
              <Statistic
                title={<span className="text-white opacity-90">{t('report.purchase_amount')}</span>}
                value={formatCurrency(state.summary.totalPurchaseAmount || 0)}
                valueStyle={{ color: '#ffffff', fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-md bg-gradient-to-br from-purple-500 to-purple-600 border-0">
              <Statistic
                title={<span className="text-white opacity-90">{t('report.sale_amount')}</span>}
                value={formatCurrency(state.summary.totalSaleAmount || 0)}
                valueStyle={{ color: '#ffffff', fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
        </Row>

        <div ref={reportRef}>
          {/* Chart */}
          {state.chartData.length > 1 && (
            <Card className="mb-6 shadow-md dark:bg-gray-800" bodyStyle={{ padding: '32px' }}>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {t('report.movement_trend')}
              </h3>
              <Chart
                chartType="LineChart"
                width="100%"
                height="400px"
                data={state.chartData}
                options={{
                  curveType: "function",
                  legend: { position: "bottom" },
                  colors: ["#10b981", "#ef4444"],
                  chartArea: { width: "85%", height: "70%" }
                }}
              />
            </Card>
          )}

          {/* Desktop Table */}
          <div className="hidden md:block">
            <Card className="shadow-md dark:bg-gray-800" bodyStyle={{ padding: '24px' }}>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {t('report.movement_details')}
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
              />
            </Card>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden">
            <Card className="shadow-md dark:bg-gray-800" bodyStyle={{ padding: '16px' }}>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {t('report.movement_details')}
              </h3>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : state.list.length > 0 ? (
                <div className="space-y-3">
                  {state.list.map((item, index) => (
                    <MovementMobileCard key={index} item={item} index={index} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">{t('report.no_data')}</div>
              )}
            </Card>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .ant-table-thead > tr > th {
          background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%) !important;
          color: #ffffff !important;
          font-weight: 600 !important;
        }
      `}</style>
    </MainPage>
  );
}

export default ReportStockMovement;