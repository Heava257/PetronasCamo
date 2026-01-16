
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Row, Col, Statistic, Table, DatePicker, Select, Button, Tag } from 'antd';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import dayjs from 'dayjs';
import { request } from '../../util/helper';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);


function ReportExpense_Summary() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({
    from_date: dayjs().subtract(30, 'days'),
    to_date: dayjs()
  });
  const [data, setData] = useState({ list: [], summary: {} });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await request('report_Expense_Category', 'get', {
        from_date: filter.from_date.format('YYYY-MM-DD'),
        to_date: filter.to_date.format('YYYY-MM-DD')
      });
      setData(res);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Pie Chart Data
  const pieData = {
    labels: ['COGS', 'OPEX', 'ADMIN'],
    datasets: [{
      data: [
        data.summary.cogsTotal || 0,
        data.summary.opexTotal || 0,
        data.summary.adminTotal || 0
      ],
      backgroundColor: ['#ef4444', '#f59e0b', '#10b981']
    }]
  };

  // Table Columns
  const columns = [
    {
      title: t('report.category'),
      dataIndex: 'expense_category',
      key: 'expense_category'
    },
    {
      title: t('report.type'),
      dataIndex: 'category_type',
      key: 'category_type',
      render: (type) => <Tag color={type === 'COGS' ? 'red' : type === 'OPEX' ? 'orange' : 'green'}>{type}</Tag>
    },
    {
      title: t('report.branch'),
      dataIndex: 'branch_name',
      key: 'branch_name'
    },
    {
      title: t('report.transactions'),
      dataIndex: 'transaction_count',
      key: 'transaction_count'
    },
    {
      title: t('report.total_amount'),
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount) => `$${Number(amount).toFixed(2)}`
    }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <Card className="mb-6">
        <h1 className="text-2xl font-bold">{t('report.expense_category_report')}</h1>
      </Card>

      {/* Filters */}
      <Card className="mb-6">
        <DatePicker.RangePicker
          value={[filter.from_date, filter.to_date]}
          onChange={(dates) => setFilter({ from_date: dates[0], to_date: dates[1] })}
        />
        <Button type="primary" onClick={fetchData} className="ml-4">{t('report.apply_filters')}</Button>
      </Card>

      {/* Statistics */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('report.total_expense')}
              value={data.summary.totalExpense}
              prefix="$"
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="COGS"
              value={data.summary.cogsTotal}
              prefix="$"
              valueStyle={{ color: '#ef4444' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="OPEX"
              value={data.summary.opexTotal}
              prefix="$"
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="ADMIN"
              value={data.summary.adminTotal}
              prefix="$"
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Chart */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={12}>
          <Card title={t('report.expense_distribution')}>
            <Doughnut data={pieData} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={t('report.category_breakdown')}>
            <Table
              columns={columns}
              dataSource={data.list}
              loading={loading}
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default ReportExpense_Summary