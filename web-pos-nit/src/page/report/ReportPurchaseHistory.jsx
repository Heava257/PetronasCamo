import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Chart } from "react-google-charts";
import { request } from "../../util/helper";
import { Button, Card, Table, Tag, Row, Col, Statistic, DatePicker, Select, Space } from "antd";
import { PrinterOutlined, FilePdfOutlined, ShoppingCartOutlined, TruckOutlined } from '@ant-design/icons';
import MainPage from "../../component/layout/MainPage";
import dayjs from "dayjs";
import { configStore } from "../../store/configStore";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function ReportPurchaseHistory() {
  const { config } = configStore();
  const { t } = useTranslation();
  const reportRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({
    from_date: dayjs().subtract(29, "d"),
    to_date: dayjs(),
    supplier_id: null
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
        supplier_id: filter.supplier_id
      };
      const res = await request("report_Purchase_History", "get", param);
      if (res) {
        // Prepare chart data
        const chartData = [["Date", "Purchase Amount"]];
        res.list?.forEach(item => {
          chartData.push([
            dayjs(item.purchase_date).format("DD/MM"),
            parseFloat(item.total_amount || 0)
          ]);
        });

        setState({
          list: res.list || [],
          summary: res.summary || {},
          chartData
        });
      }
    } catch (error) {
      console.error("Failed to fetch purchase history:", error);
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
      pdf.save(`Purchase_History_${dayjs().format('YYYY-MM-DD')}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const onReset = () => {
    setFilter({
      from_date: dayjs().subtract(29, "d"),
      to_date: dayjs(),
      supplier_id: null
    });
    getList({
      from_date: dayjs().subtract(29, "d").format("YYYY-MM-DD"),
      to_date: dayjs().format("YYYY-MM-DD"),
      supplier_id: null
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
  const PurchaseMobileCard = ({ item, index }) => (
    <Card
      className="mb-3 shadow-sm hover:shadow-md transition-shadow duration-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      bodyStyle={{ padding: '16px' }}
    >
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">#{index + 1}</span>
              <Tag color="purple" className="text-xs">
                {item.reference_no}
              </Tag>
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
              {item.supplier_name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              📞 {item.supplier_tel}
            </p>
          </div>
          <Tag color={item.status === 'Completed' ? 'green' : 'orange'} className="text-xs">
            {item.status}
          </Tag>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('report.total_amount')}</p>
            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {formatCurrency(item.total_amount)}
            </p>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('report.shipping')}</p>
            <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {formatCurrency(item.shipping_cost)}
            </p>
          </div>
        </div>

        {item.shipping_company && (
          <div className="flex items-center gap-2 text-sm">
            <TruckOutlined className="text-blue-600 dark:text-blue-400" />
            <span className="text-gray-700 dark:text-gray-300">{item.shipping_company}</span>
          </div>
        )}

        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">{t('report.purchase_date')}:</span>
            <span className="text-gray-900 dark:text-white">
              {dayjs(item.purchase_date).format("DD/MM/YYYY")}
            </span>
          </div>
          {item.payment_date && (
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">{t('report.payment_date')}:</span>
              <span className="text-gray-900 dark:text-white">
                {dayjs(item.payment_date).format("DD/MM/YYYY")}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">{t('report.created_by')}:</span>
            <span className="text-gray-900 dark:text-white">{item.created_by}</span>
          </div>
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
      key: "reference",
      title: t('report.reference_no'),
      dataIndex: "reference_no",
      render: (ref) => (
        <Tag color="purple" className="text-sm">{ref}</Tag>
      ),
    },
    {
      key: "supplier",
      title: t('report.supplier'),
      dataIndex: "supplier_name",
      render: (name, record) => (
        <div>
          <div className="font-semibold">{name}</div>
          <div className="text-xs text-gray-500">{record.supplier_tel}</div>
        </div>
      ),
    },
    {
      key: "shipping",
      title: t('report.shipping'),
      render: (_, record) => (
        <div>
          <div className="text-sm">{record.shipping_company || 'N/A'}</div>
          <div className="text-xs text-orange-600 dark:text-orange-400">
            {formatCurrency(record.shipping_cost)}
          </div>
        </div>
      ),
    },
    {
      key: "amount",
      title: t('report.total_amount'),
      dataIndex: "total_amount",
      render: (amount) => (
        <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">
          {formatCurrency(amount)}
        </span>
      ),
    },
    {
      key: "status",
      title: t('report.status'),
      dataIndex: "status",
      render: (status) => (
        <Tag color={status === 'Completed' ? 'green' : 'orange'}>{status}</Tag>
      ),
    },
    {
      key: "purchase_date",
      title: t('report.purchase_date'),
      dataIndex: "purchase_date",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      key: "created_by",
      title: t('report.created_by'),
      dataIndex: "created_by",
    },
  ];

  return (
    <MainPage loading={loading}>
      <div className="px-2 sm:px-4 lg:px-6 py-4 min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Header */}
        <Card
          className="mb-6 shadow-lg border-0 bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-800 dark:to-indigo-800"
          bodyStyle={{ padding: '24px' }}
        >
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
              <h1 className="text-white text-2xl lg:text-3xl font-bold flex items-center gap-3 mb-2">
                <ShoppingCartOutlined /> {t('report.purchase_history')}
              </h1>
              <p className="text-white text-sm opacity-90">
                {t('report.purchase_history_subtitle')}
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
              placeholder={t('report.select_customer') === 'Select Customer' ? 'Select Supplier' : t('report.select_customer').replace('អតិថិជន', 'អ្នកផ្គត់ផ្គង់')} // Fallback or new key needed, using logic for now or add key
              value={filter.supplier_id}
              options={config?.supplier || []}
              onChange={(value) => setFilter(prev => ({ ...prev, supplier_id: value }))}
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
            <Card className="shadow-md bg-gradient-to-br from-purple-500 to-purple-600 border-0">
              <Statistic
                title={<span className="text-white opacity-90">{t('report.total_purchases')}</span>}
                value={state.summary.totalPurchases || 0}
                valueStyle={{ color: '#ffffff', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'bold' }}
                prefix={<ShoppingCartOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-md bg-gradient-to-br from-indigo-500 to-indigo-600 border-0">
              <Statistic
                title={<span className="text-white opacity-90">{t('report.total_amount')}</span>}
                value={formatCurrency(state.summary.totalAmount || 0)}
                valueStyle={{ color: '#ffffff', fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-md bg-gradient-to-br from-blue-500 to-blue-600 border-0">
              <Statistic
                title={<span className="text-white opacity-90">{t('report.avg_purchase')}</span>}
                value={formatCurrency(state.summary.avgPurchaseAmount || 0)}
                valueStyle={{ color: '#ffffff', fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-md bg-gradient-to-br from-orange-500 to-orange-600 border-0">
              <Statistic
                title={<span className="text-white opacity-90">{t('report.total_shipping')}</span>}
                value={formatCurrency(state.summary.totalShipping || 0)}
                valueStyle={{ color: '#ffffff', fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 'bold' }}
                prefix={<TruckOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <div ref={reportRef}>
          {/* Chart */}
          {state.chartData.length > 1 && (
            <Card className="mb-6 shadow-md dark:bg-gray-800" bodyStyle={{ padding: '32px' }}>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {t('report.purchase_trend')}
              </h3>
              <Chart
                chartType="ColumnChart"
                width="100%"
                height="400px"
                data={state.chartData}
                options={{
                  legend: { position: "none" },
                  colors: ["#8b5cf6"],
                  chartArea: { width: "85%", height: "70%" },
                  hAxis: { title: t('report.purchase_date') },
                  vAxis: { title: `${t('report.total_amount')} ($)`, format: "currency" }
                }}
              />
            </Card>
          )}

          {/* Desktop Table */}
          <div className="hidden md:block">
            <Card className="shadow-md dark:bg-gray-800" bodyStyle={{ padding: '24px' }}>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {t('report.purchase_details')}
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
                rowKey="purchase_id"
                summary={(pageData) => {
                  let totalAmount = 0;
                  let totalShipping = 0;
                  pageData.forEach(({ total_amount, shipping_cost }) => {
                    totalAmount += parseFloat(total_amount || 0);
                    totalShipping += parseFloat(shipping_cost || 0);
                  });
                  return (
                    <Table.Summary.Row className="bg-gray-100 dark:bg-gray-700">
                      <Table.Summary.Cell index={0} colSpan={4}>
                        <strong className="text-base">{t('report.total')}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <strong className="text-base">{formatCurrency(totalAmount)}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} colSpan={3}>
                        <span className="text-sm">Shipping: <strong>{formatCurrency(totalShipping)}</strong></span>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  );
                }}
              />
            </Card>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden">
            <Card className="shadow-md dark:bg-gray-800" bodyStyle={{ padding: '16px' }}>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {t('report.purchase_details')}
              </h3>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : state.list.length > 0 ? (
                <>
                  <div className="space-y-3 mb-4">
                    {state.list.map((item, index) => (
                      <PurchaseMobileCard key={item.purchase_id} item={item} index={index} />
                    ))}
                  </div>
                  <Card className="bg-gradient-to-r from-purple-500 to-indigo-500 border-0">
                    <div className="text-white">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <p className="text-sm opacity-90 mb-1">{t('report.total_amount')}</p>
                          <p className="text-xl font-bold">{formatCurrency(state.summary.totalAmount || 0)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm opacity-90 mb-1">{t('report.total_shipping')}</p>
                          <p className="text-xl font-bold">{formatCurrency(state.summary.totalShipping || 0)}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">No purchase history</div>
              )}
            </Card>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .ant-table-thead > tr > th {
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%) !important;
          color: #ffffff !important;
          font-weight: 600 !important;
        }
      `}</style>
    </MainPage>
  );
}

export default ReportPurchaseHistory;