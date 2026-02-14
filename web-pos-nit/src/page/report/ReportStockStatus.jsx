import React, { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { request } from "../../util/helper";
import { Button, Card, Table, Tag, Row, Col, Statistic, Empty } from "antd";
import { PrinterOutlined, FilePdfOutlined, InboxOutlined, WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';
import MainPage from "../../component/layout/MainPage";
import dayjs from "dayjs";

function ReportStockStatus() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState({
    list: [],
    summary: {}
  });

  useEffect(() => {
    getList();
  }, []);

  const getList = async () => {
    try {
      setLoading(true);
      const res = await request("report_Stock_Status", "get");
      if (res) {
        setState({
          list: res.list || [],
          summary: res.summary || {}
        });
      }
    } catch (error) {
      console.error("Failed to fetch stock status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Out of Stock': return 'red';
      case 'Low Stock': return 'orange';
      case 'Medium Stock': return 'blue';
      case 'In Stock': return 'green';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Out of Stock': return <WarningOutlined />;
      case 'Low Stock': return <WarningOutlined />;
      case 'In Stock': return <CheckCircleOutlined />;
      default: return <InboxOutlined />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'Out of Stock': return t('report.out_of_stock');
      case 'Low Stock': return t('report.low_stock');
      case 'Medium Stock': return t('report.medium_stock');
      case 'In Stock': return t('report.in_stock');
      default: return status;
    }
  };

  // Mobile Card Component
  const StockMobileCard = ({ item, index }) => (
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
                {item.barcode}
              </Tag>
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
              {item.product_name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {item.category_name}
            </p>
          </div>
          <Tag
            color={getStatusColor(item.stock_status)}
            icon={getStatusIcon(item.stock_status)}
            className="text-xs px-2 py-1"
          >
            {getStatusLabel(item.stock_status)}
          </Tag>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('report.current_stock')}</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {parseFloat(item.current_stock).toLocaleString()} {item.unit}
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('report.stock_value')}</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {formatCurrency(item.stock_value)}
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500 dark:text-gray-400">{t('report.cost')}:</span>
              <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                ${parseFloat(item.cost_price).toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">{t('report.selling')}:</span>
              <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                ${parseFloat(item.selling_price).toFixed(2)}
              </span>
            </div>
          </div>
          {item.last_receive_date && (
            <div className="mt-2">
              <span className="text-gray-500 dark:text-gray-400">{t('report.last_receive')}:</span>
              <span className="ml-1 text-gray-900 dark:text-white">
                {dayjs(item.last_receive_date).format("DD/MM/YYYY")}
              </span>
            </div>
          )}
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
      key: "barcode",
      title: t('report.barcode'),
      dataIndex: "barcode",
      render: (barcode) => (
        <Tag color="blue" className="text-sm">
          {barcode}
        </Tag>
      ),
    },
    {
      key: "product_name",
      title: t('report.product_name'),
      dataIndex: "product_name",
      render: (name) => (
        <span className="font-semibold text-gray-900 dark:text-white">
          {name}
        </span>
      ),
    },
    {
      key: "category",
      title: t('report.category'),
      dataIndex: "category_name",
    },
    {
      key: "stock",
      title: t('report.current_stock'),
      dataIndex: "current_stock",
      render: (stock, record) => (
        <span className="font-semibold">
          {parseFloat(stock).toLocaleString()} {record.unit}
        </span>
      ),
    },
    {
      key: "cost_price",
      title: t('report.cost_price'),
      dataIndex: "cost_price",
      render: (price) => (
        <span className="text-orange-600 dark:text-orange-400">
          ${parseFloat(price).toFixed(2)}
        </span>
      ),
    },
    {
      key: "selling_price",
      title: t('report.selling_price'),
      dataIndex: "selling_price",
      render: (price) => (
        <span className="text-green-600 dark:text-green-400">
          ${parseFloat(price).toFixed(2)}
        </span>
      ),
    },
    {
      key: "stock_value",
      title: t('report.stock_value'),
      dataIndex: "stock_value",
      render: (value) => (
        <span className="font-bold text-blue-600 dark:text-blue-400">
          {formatCurrency(value)}
        </span>
      ),
    },
    {
      key: "status",
      title: t('report.status'),
      dataIndex: "stock_status",
      render: (status) => (
        <Tag
          color={getStatusColor(status)}
          icon={getStatusIcon(status)}
          className="text-sm px-3 py-1"
        >
          {getStatusLabel(status)}
        </Tag>
      ),
    },
  ];

  return (
    <MainPage loading={loading}>
      <div className="report-stock-status-container px-2 sm:px-4 lg:px-6 py-4 min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Header Section */}
        <Card
          className="mb-6 shadow-lg border-0 bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-800 dark:to-blue-800"
          bodyStyle={{ padding: '24px' }}
        >
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
              <h1 className="text-white text-2xl lg:text-3xl font-bold flex items-center gap-3 mb-2">
                <InboxOutlined /> {t('report.stock_status_report')}
              </h1>
              <p className="text-white text-sm opacity-90">
                {t('report.stock_status_subtitle')}
              </p>
            </div>
            <Button
              icon={<PrinterOutlined />}
              onClick={handlePrint}
              loading={loading}
              size="large"

              className="shadow-md w-full lg:w-auto"
            >
              <span className="hidden sm:inline">{t('report.print_report')}</span>
            </Button>
          </div>
        </Card>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-md bg-gradient-to-br from-blue-500 to-blue-600 border-0">
              <Statistic
                title={<span className="text-white opacity-90">{t('report.total_products')}</span>}
                value={state.summary.totalProducts || 0}
                valueStyle={{ color: '#ffffff', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'bold' }}
                prefix={<InboxOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-md bg-gradient-to-br from-green-500 to-green-600 border-0">
              <Statistic
                title={<span className="text-white opacity-90">{t('report.total_stock_value')}</span>}
                value={formatCurrency(state.summary.totalStockValue || 0)}
                valueStyle={{ color: '#ffffff', fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-md bg-gradient-to-br from-orange-500 to-orange-600 border-0">
              <Statistic
                title={<span className="text-white opacity-90">{t('report.low_stock_items')}</span>}
                value={state.summary.lowStock || 0}
                valueStyle={{ color: '#ffffff', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'bold' }}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-md bg-gradient-to-br from-red-500 to-red-600 border-0">
              <Statistic
                title={<span className="text-white opacity-90">{t('report.out_of_stock')}</span>}
                value={state.summary.outOfStock || 0}
                valueStyle={{ color: '#ffffff', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'bold' }}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Card className="shadow-md dark:bg-gray-800" bodyStyle={{ padding: '24px' }}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {t('report.detailed_stock_info')}
            </h3>
            <Table
              loading={loading}
              dataSource={state.list}
              columns={columns}
              pagination={{ pageSize: 20, showSizeChanger: true }}
              rowClassName={(record, index) =>
                `${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'}`
              }
              scroll={{ x: true }}
              rowKey="product_id"
              locale={{
                emptyText: (
                  <Empty description={t('report.no_data')} />
                )
              }}
            />
          </Card>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden">
          <Card className="shadow-md dark:bg-gray-800" bodyStyle={{ padding: '16px' }}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {t('report.detailed_stock_info')}
            </h3>
            {loading ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
            ) : state.list.length > 0 ? (
              <div className="space-y-3">
                {state.list.map((item, index) => (
                  <StockMobileCard key={item.product_id} item={item} index={index} />
                ))}
              </div>
            ) : (
              <Empty description={t('report.no_data')} />
            )}
          </Card>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .ant-table-wrapper, .ant-table-wrapper * {
            visibility: visible;
          }
          .ant-table-wrapper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
        
        .ant-table-thead > tr > th {
          background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%) !important;
          color: #ffffff !important;
          font-weight: 600 !important;
        }
        
        .ant-table-tbody > tr:hover > td {
          background: #f3f4f6 !important;
        }
      `}</style>
    </MainPage>
  );
}

export default ReportStockStatus;