import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Row, Col, Statistic, DatePicker, Button, Progress, Spin, Empty, message } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, DollarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { request } from '../../util/helper';

function ReportProfitLoss() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({
    from_date: dayjs().startOf('month'),
    to_date: dayjs().endOf('month')
  });

  // ✅ FIXED: Proper initial state with all fields
  const [data, setData] = useState({
    success: false,
    summary: {
      totalRevenue: 0,
      collectedRevenue: 0,
      pendingRevenue: 0,
      totalCOGS: 0,
      cogsFromPurchase: 0,
      cogsFromExpense: 0,
      grossProfit: 0,
      grossProfitMargin: 0,
      opexTotal: 0,
      adminTotal: 0,
      totalOperatingExpense: 0,
      netProfit: 0,
      profitMargin: 0,
      profitStatus: 'Break Even',
      collectionRate: 0
    },
    breakdown: {
      revenue: {
        total: 0,
        collected: 0,
        pending: 0,
        collectionRate: 0
      },
      expenses: {
        cogs: 0,
        opex: 0,
        admin: 0,
        total: 0
      },
      profit: {
        gross: 0,
        net: 0,
        grossMargin: 0,
        netMargin: 0
      }
    }
  });

  const fetchData = async () => {
    setLoading(true);
    try {

      const res = await request('report_Income_vs_Expense', 'get', {
        from_date: filter.from_date.format('YYYY-MM-DD'),
        to_date: filter.to_date.format('YYYY-MM-DD')
      });


      if (res && res.success && res.summary) {
        setData(res);
        message.success('Report loaded successfully');
      } else {
        console.warn("⚠️ Invalid response format:", res);
        message.warning('No data available for selected period');
        // Keep default zero values
      }
    } catch (error) {
      console.error('❌ Error fetching P&L:', error);
      message.error('Failed to load report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ✅ FIXED: Destructure with safety
  const { summary, breakdown } = data;

  // ✅ Helper function for formatting currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  };

  // ✅ Helper function for formatting percentage
  const formatPercent = (value) => {
    return `${(value || 0).toFixed(2)}%`;
  };

  return (
    <div className="report-profit-loss-container p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <Card
        className="mb-6 shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none'
        }}
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-white text-3xl font-bold mb-2">
              💰 {t('report.profit_loss')}
            </h1>
            <p className="text-white text-opacity-90">
              {t('report.profit_loss_subtitle')}
            </p>
          </div>
          <DollarOutlined className="text-white text-6xl opacity-20" />
        </div>
      </Card>

      {/* Filters */}
      <Card className="mb-6 shadow-md">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('report.date_range')}
            </label>
            <DatePicker.RangePicker
              value={[filter.from_date, filter.to_date]}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setFilter({ from_date: dates[0], to_date: dates[1] });
                }
              }}
              format="DD/MM/YYYY"
              size="large"
            />
          </div>
          <div className="flex gap-2" style={{ marginTop: '28px' }}>
            <Button
              type="primary"
              onClick={fetchData}
              loading={loading}
              size="large"
              icon={<ArrowUpOutlined />}
            >
              {t('report.generate_report')}
            </Button>
            <Button
              onClick={() => {
                setFilter({
                  from_date: dayjs().startOf('month'),
                  to_date: dayjs().endOf('month')
                });
              }}
              size="large"
            >
              {t('report.reset_current_month')}
            </Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Spin size="large" tip={t('report.loading')} />
        </div>
      ) : (
        <>
          {/* Main Metrics */}
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} lg={8}>
              <Card
                className="shadow-md hover:shadow-lg transition-shadow"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}
              >
                <Statistic
                  title={<span className="text-white text-opacity-90">{t('report.total_revenue')}</span>}
                  value={summary.totalRevenue || 0}
                  precision={2}
                  prefix={<DollarOutlined className="text-white" />}
                  valueStyle={{ color: '#ffffff', fontSize: '28px', fontWeight: 'bold' }}
                />
                <Progress
                  percent={100}
                  showInfo={false}
                  strokeColor="#fff"
                  trailColor="rgba(255,255,255,0.3)"
                  className="mt-2"
                />
                <div className="mt-2 text-white text-opacity-90 text-sm">
                  {t('report.collected')}: {formatCurrency(summary.collectedRevenue)}
                  {' '}({formatPercent(summary.collectionRate)})
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card
                className="shadow-md hover:shadow-lg transition-shadow"
                style={{
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  border: 'none'
                }}
              >
                <Statistic
                  title={<span className="text-white text-opacity-90">{t('report.total_expenses')}</span>}
                  value={(summary.totalCOGS || 0) + (summary.totalOperatingExpense || 0)}
                  precision={2}
                  prefix={<DollarOutlined className="text-white" />}
                  valueStyle={{ color: '#ffffff', fontSize: '28px', fontWeight: 'bold' }}
                />
                <Progress
                  percent={
                    summary.totalRevenue > 0
                      ? Math.min(
                        ((summary.totalCOGS + summary.totalOperatingExpense) / summary.totalRevenue) * 100,
                        100
                      )
                      : 0
                  }
                  showInfo={false}
                  strokeColor="#fff"
                  trailColor="rgba(255,255,255,0.3)"
                  className="mt-2"
                />
                <div className="mt-2 text-white text-opacity-90 text-sm">
                  {t('report.cogs')}: {formatCurrency(summary.totalCOGS)} |
                  {t('report.opex')}: {formatCurrency(summary.totalOperatingExpense)}
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card
                className="shadow-md hover:shadow-lg transition-shadow"
                style={{
                  background: summary.netProfit >= 0
                    ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                    : 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                  border: 'none'
                }}
              >
                <Statistic
                  title={<span className="text-white text-opacity-90">{t('report.net_profit')}</span>}
                  value={summary.netProfit || 0}
                  precision={2}
                  prefix={<DollarOutlined className="text-white" />}
                  valueStyle={{ color: '#ffffff', fontSize: '28px', fontWeight: 'bold' }}
                />
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <span className="text-white text-opacity-90 text-sm">{t('report.margin')}: </span>
                    <span className="text-white font-bold text-lg">
                      {formatPercent(summary.profitMargin)}
                    </span>
                  </div>
                  <div className="px-3 py-1 bg-white bg-opacity-20 rounded-full">
                    <span className="text-white font-semibold text-sm">
                      {summary.profitStatus || 'N/A'}
                    </span>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Detailed Breakdown */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card
                title={
                  <span className="text-lg font-bold">
                    💵 {t('report.revenue_breakdown')}
                  </span>
                }
                className="shadow-md h-full"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium">{t('report.total_revenue')}:</span>
                    <strong className="text-blue-600 text-lg">
                      {formatCurrency(summary.totalRevenue)}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">{t('report.collected')}:</span>
                    <span className="text-green-600 font-bold">
                      {formatCurrency(summary.collectedRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border-t-2 pt-3">
                    <span className="font-medium">{t('report.pending')}:</span>
                    <span className="text-orange-600 font-bold">
                      {formatCurrency(summary.pendingRevenue)}
                    </span>
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">{t('report.collection_rate')}</div>
                    <Progress
                      percent={summary.collectionRate || 0}
                      status={summary.collectionRate > 80 ? 'success' : 'normal'}
                      strokeColor={{
                        '0%': '#108ee9',
                        '100%': '#87d068',
                      }}
                    />
                  </div>
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card
                title={
                  <span className="text-lg font-bold">
                    📊 {t('report.expense_breakdown')}
                  </span>
                }
                className="shadow-md h-full"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="font-medium">{t('report.cogs')}:</span>
                    <strong className="text-red-600 text-lg">
                      {formatCurrency(summary.totalCOGS)}
                    </strong>
                  </div>
                  <div className="pl-4 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">• {t('report.from_purchases')}:</span>
                      <span className="font-medium">
                        {formatCurrency(summary.cogsFromPurchase)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">• {t('report.from_expenses')}:</span>
                      <span className="font-medium">
                        {formatCurrency(summary.cogsFromExpense)}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium">{t('report.opex')}:</span>
                    <span className="text-orange-600 font-bold">
                      {formatCurrency(summary.opexTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="font-medium">{t('report.admin')}:</span>
                    <span className="text-yellow-600 font-bold">
                      {formatCurrency(summary.adminTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg border-t-2 pt-3">
                    <span className="font-medium">{t('report.total_expenses')}:</span>
                    <strong className="text-red-700 text-lg">
                      {formatCurrency(
                        (summary.totalCOGS || 0) + (summary.totalOperatingExpense || 0)
                      )}
                    </strong>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Gross vs Net Profit */}
          <Row gutter={[16, 16]} className="mt-6">
            <Col xs={24} lg={12}>
              <Card
                title={`📈 ${t('report.gross_profit')}`}
                className="shadow-md"
              >
                <Statistic
                  value={summary.grossProfit || 0}
                  precision={2}
                  prefix="$"
                  valueStyle={{
                    color: summary.grossProfit >= 0 ? '#52c41a' : '#ff4d4f',
                    fontSize: '32px'
                  }}
                />
                <div className="mt-3">
                  <span className="text-gray-600">{t('report.gross_margin')}: </span>
                  <span className="font-bold text-lg">
                    {formatPercent(summary.grossProfitMargin)}
                  </span>
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  {t('report.formula_gross')}
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card
                title={`💎 ${t('report.net_profit')}`}
                className="shadow-md"
              >
                <Statistic
                  value={summary.netProfit || 0}
                  precision={2}
                  prefix="$"
                  valueStyle={{
                    color: summary.netProfit >= 0 ? '#52c41a' : '#ff4d4f',
                    fontSize: '32px'
                  }}
                />
                <div className="mt-3">
                  <span className="text-gray-600">{t('report.net_margin')}: </span>
                  <span className="font-bold text-lg">
                    {formatPercent(summary.profitMargin)}
                  </span>
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  {t('report.formula_net')}
                </div>
              </Card>
            </Col>
          </Row>

          {/* Empty State */}
          {summary.totalRevenue === 0 && summary.totalCOGS === 0 && !loading && (
            <Card className="mt-6">
              <Empty
                description={
                  <span className="text-gray-500">
                    {t('report.no_data_period')}
                  </span>
                }
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export default ReportProfitLoss;