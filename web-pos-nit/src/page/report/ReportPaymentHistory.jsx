import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Chart } from "react-google-charts";
import { request } from "../../util/helper";
import { Button, Card, Table, Tag, Row, Col, Statistic, DatePicker, Select, Space } from "antd";
import { PrinterOutlined, FilePdfOutlined, DollarOutlined, CreditCardOutlined, BankOutlined } from '@ant-design/icons';
import MainPage from "../../component/layout/MainPage";
import dayjs from "dayjs";
import { configStore } from "../../store/configStore";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function ReportPaymentHistory() {
  const { config } = configStore();
  const { t } = useTranslation();
  const reportRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({
    from_date: dayjs().subtract(29, "d"),
    to_date: dayjs(),
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
        from_date: dayjs(filter.from_date).format("YYYY-MM-DD"),
        to_date: dayjs(filter.to_date).format("YYYY-MM-DD"),
        customer_id: filter.customer_id
      };
      const res = await request("report_Payment_History", "get", param);
      if (res) {
        // Prepare payment methods chart
        const methodsData = [["Payment Method", "Amount"]];
        if (res.summary?.paymentMethods) {
          Object.entries(res.summary.paymentMethods).forEach(([method, amount]) => {
            methodsData.push([method, parseFloat(amount)]);
          });
        }

        setState({
          list: res.list || [],
          summary: res.summary || {},
          chartData: methodsData
        });
      }
    } catch (error) {
      console.error("Failed to fetch payment history:", error);
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
      pdf.save(`Payment_History_${dayjs().format('YYYY-MM-DD')}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const onReset = () => {
    setFilter({
      from_date: dayjs().subtract(29, "d"),
      to_date: dayjs(),
      customer_id: null
    });
    getList({
      from_date: dayjs().subtract(29, "d").format("YYYY-MM-DD"),
      to_date: dayjs().format("YYYY-MM-DD"),
      customer_id: null
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const getMethodIcon = (method) => {
    if (!method) return <CreditCardOutlined />;
    const methodLower = method.toLowerCase();
    if (methodLower.includes('cash')) return <DollarOutlined />;
    if (methodLower.includes('bank') || methodLower.includes('transfer')) return <BankOutlined />;
    return <CreditCardOutlined />;
  };

  const getMethodColor = (method) => {
    if (!method) return 'default';
    const methodLower = method.toLowerCase();
    if (methodLower.includes('cash')) return 'green';
    if (methodLower.includes('bank') || methodLower.includes('transfer')) return 'blue';
    if (methodLower.includes('card')) return 'purple';
    return 'default';
  };

  // Mobile Card Component
  const PaymentMobileCard = ({ item, index }) => (
    <Card
      className="mb-3 shadow-sm hover:shadow-md transition-shadow duration-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      bodyStyle={{ padding: '16px' }}
    >
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">#{index + 1}</span>
              {item.order_id && (
                <Tag color="blue" className="text-xs">
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
          <Tag
            color={getMethodColor(item.payment_method)}
            icon={getMethodIcon(item.payment_method)}
            className="text-xs"
          >
            {item.payment_method}
          </Tag>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('report.payment')}</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {formatCurrency(item.payment_amount)}
            </p>
          </div>

          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('report.remaining')}</p>
            <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {formatCurrency(item.remaining_balance || 0)}
            </p>
          </div>
        </div>

        {item.bank && (
          <div className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-900/20 rounded p-2">
            <BankOutlined className="text-blue-600 dark:text-blue-400" />
            <span className="text-gray-700 dark:text-gray-300">{item.bank}</span>
          </div>
        )}

        {item.description && (
          <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded p-2">
            {item.description}
          </div>
        )}

        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">{t('report.payment_date')}:</span>
            <span className="text-gray-900 dark:text-white">
              {dayjs(item.payment_date).format("DD/MM/YYYY")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">{t('report.debt_total')}:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {formatCurrency(item.debt_total || 0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">{t('report.total_paid')}:</span>
            <span className="font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(item.total_paid || 0)}
            </span>
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
      key: "order_no",
      title: t('report.order_no'),
      dataIndex: "order_no",
      render: (orderNo) => (
        <Tag color="blue">{orderNo}</Tag>
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
      key: "payment_amount",
      title: t('report.payment_amount'),
      dataIndex: "payment_amount",
      render: (amount) => (
        <span className="font-bold text-green-600 dark:text-green-400 text-lg">
          {formatCurrency(amount)}
        </span>
      ),
    },
    {
      key: "payment_method",
      title: t('report.payment_method'),
      dataIndex: "payment_method",
      render: (method) => (
        <Tag color={getMethodColor(method)} icon={getMethodIcon(method)}>
          {method}
        </Tag>
      ),
    },
    {
      key: "bank",
      title: t('report.bank'),
      dataIndex: "bank",
      render: (bank) => bank || '-',
    },
    {
      key: "remaining",
      title: t('report.remaining'),
      dataIndex: "remaining_balance",
      render: (balance) => (
        <span className={balance > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}>
          {formatCurrency(balance)}
        </span>
      ),
    },
    {
      key: "payment_date",
      title: t('report.payment_date'),
      dataIndex: "payment_date",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
  ];

  return (
    <MainPage loading={loading}>
      <div className="px-2 sm:px-4 lg:px-6 py-4 min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Header */}
        <Card
          className="mb-6 shadow-lg border-0 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-800 dark:to-emerald-800"
          bodyStyle={{ padding: '24px' }}
        >
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
              <h1 className="text-white text-2xl lg:text-3xl font-bold flex items-center gap-3 mb-2">
                <CreditCardOutlined /> {t('report.payment_history')}
              </h1>
              <p className="text-white text-sm opacity-90">
                {t('report.payment_history_subtitle')}
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
              placeholder={t('report.select_customer')}
              value={filter.customer_id}
              options={config?.customer || []}
              onChange={(value) => setFilter(prev => ({ ...prev, customer_id: value }))}
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
          <Col xs={24} sm={12} lg={8}>
            <Card className="shadow-md bg-gradient-to-br from-green-500 to-green-600 border-0">
              <Statistic
                title={<span className="text-white opacity-90">{t('report.total_collected')}</span>}
                value={formatCurrency(state.summary.totalCollected || 0)}
                valueStyle={{ color: '#ffffff', fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 'bold' }}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card className="shadow-md bg-gradient-to-br from-emerald-500 to-emerald-600 border-0">
              <Statistic
                title={<span className="text-white opacity-90">{t('report.total_payments')}</span>}
                value={state.summary.totalPayments || 0}
                valueStyle={{ color: '#ffffff', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'bold' }}
                prefix={<CreditCardOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card className="shadow-md bg-gradient-to-br from-teal-500 to-teal-600 border-0">
              <Statistic
                title={<span className="text-white opacity-90">{t('report.remaining_balance')}</span>}
                value={formatCurrency(state.summary.totalRemaining || 0)}
                valueStyle={{ color: '#ffffff', fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
        </Row>

        <div ref={reportRef}>
          {/* Payment Methods Chart */}
          {state.chartData.length > 1 && (
            <Card className="mb-6 shadow-md dark:bg-gray-800" bodyStyle={{ padding: '32px' }}>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {t('report.payment_methods_dist')}
              </h3>
              <Chart
                chartType="PieChart"
                width="100%"
                height="400px"
                data={state.chartData}
                options={{
                  legend: { position: "bottom" },
                  colors: ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b"],
                  chartArea: { width: "90%", height: "80%" },
                  pieHole: 0.4
                }}
              />
            </Card>
          )}

          {/* Desktop Table */}
          <div className="hidden md:block">
            <Card className="shadow-md dark:bg-gray-800" bodyStyle={{ padding: '24px' }}>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {t('report.payment_details')}
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
                rowKey="payment_id"
                summary={(pageData) => {
                  let totalPaid = 0;
                  let totalRemaining = 0;
                  pageData.forEach(({ payment_amount, remaining_balance }) => {
                    totalPaid += parseFloat(payment_amount || 0);
                    totalRemaining += parseFloat(remaining_balance || 0);
                  });
                  return (
                    <Table.Summary.Row className="bg-gray-100 dark:bg-gray-700">
                      <Table.Summary.Cell index={0} colSpan={3}>
                        <strong className="text-base">{t('report.total')}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <strong className="text-base text-green-600">{formatCurrency(totalPaid)}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} colSpan={2}></Table.Summary.Cell>
                      <Table.Summary.Cell index={3}>
                        <strong className="text-base text-orange-600">{formatCurrency(totalRemaining)}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4}></Table.Summary.Cell>
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
                {t('report.payment_details')}
              </h3>
              {loading ? (
                <div className="text-center py-8">{t('report.loading')}</div>
              ) : state.list.length > 0 ? (
                <>
                  <div className="space-y-3 mb-4">
                    {state.list.map((item, index) => (
                      <PaymentMobileCard key={item.payment_id} item={item} index={index} />
                    ))}
                  </div>
                  <Card className="bg-gradient-to-r from-green-500 to-emerald-500 border-0">
                    <div className="text-white text-center">
                      <p className="text-sm opacity-90 mb-1">{t('report.total_collected')}</p>
                      <p className="text-2xl font-bold">{formatCurrency(state.summary.totalCollected || 0)}</p>
                    </div>
                  </Card>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">{t('report.no_payment_history')}</div>
              )}
            </Card>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .ant-table-thead > tr > th {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
          color: #ffffff !important;
          font-weight: 600 !important;
        }
      `}</style>
    </MainPage>
  );
}

export default ReportPaymentHistory;