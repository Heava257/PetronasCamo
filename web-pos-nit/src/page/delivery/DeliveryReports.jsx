import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, DatePicker, Button, Space, Statistic, message, Tabs } from 'antd';
import {
  MdTrendingUp,
  MdLocalShipping,
  MdPerson,
  MdDownload,
  MdRefresh
} from 'react-icons/md';
import { useTranslation } from '../../locales/TranslationContext';
import { request } from '../../util/helper';
import moment from 'moment';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const DeliveryReports = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([
    moment().subtract(30, 'days'),
    moment()
  ]);
  
  // Performance Report
  const [performanceData, setPerformanceData] = useState([]);
  const [performanceSummary, setPerformanceSummary] = useState({});
  
  // Vehicle Report
  const [vehicleData, setVehicleData] = useState([]);
  
  // Driver Report
  const [driverData, setDriverData] = useState([]);

  useEffect(() => {
    loadAllReports();
  }, [dateRange]);

  const loadAllReports = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPerformanceReport(),
        loadVehicleReport(),
        loadDriverReport()
      ]);
    } catch (error) {
      console.error('Error loading reports:', error);
      message.error(t('failed_to_load_reports'));
    } finally {
      setLoading(false);
    }
  };

  const loadPerformanceReport = async () => {
    try {
      const [start, end] = dateRange;
      const res = await request(
        `reports/delivery-performance?start_date=${start.format('YYYY-MM-DD')}&end_date=${end.format('YYYY-MM-DD')}`,
        'get'
      );
      
      if (res && res.success) {
        setPerformanceData(res.performance || []);
        setPerformanceSummary(res.summary || {});
      }
    } catch (error) {
      console.error('Error loading performance report:', error);
    }
  };

  const loadVehicleReport = async () => {
    try {
      const [start, end] = dateRange;
      const res = await request(
        `reports/vehicle-utilization?start_date=${start.format('YYYY-MM-DD')}&end_date=${end.format('YYYY-MM-DD')}`,
        'get'
      );
      
      if (res && res.success) {
        setVehicleData(res.vehicles || []);
      }
    } catch (error) {
      console.error('Error loading vehicle report:', error);
    }
  };

  const loadDriverReport = async () => {
    try {
      const [start, end] = dateRange;
      const res = await request(
        `reports/driver-performance?start_date=${start.format('YYYY-MM-DD')}&end_date=${end.format('YYYY-MM-DD')}`,
        'get'
      );
      
      if (res && res.success) {
        setDriverData(res.drivers || []);
      }
    } catch (error) {
      console.error('Error loading driver report:', error);
    }
  };

  const handleExport = (reportType) => {
    message.info(`${t('exporting')} ${reportType} ${t('report')}...`);
    // Implement export functionality
  };

  // Performance Report Columns
  const performanceColumns = [
    {
      title: t('date'),
      dataIndex: 'delivery_date',
      key: 'date',
      render: (date) => moment(date).format('MMM DD, YYYY')
    },
    {
      title: t('total_deliveries'),
      dataIndex: 'total_deliveries',
      key: 'total',
      align: 'center'
    },
    {
      title: t('completed'),
      dataIndex: 'completed',
      key: 'completed',
      align: 'center',
      render: (value) => <span className="text-green-600 font-semibold">{value}</span>
    },
    {
      title: t('in_transit'),
      dataIndex: 'in_transit',
      key: 'in_transit',
      align: 'center',
      render: (value) => <span className="text-orange-600">{value}</span>
    },
    {
      title: t('pending'),
      dataIndex: 'pending',
      key: 'pending',
      align: 'center',
      render: (value) => <span className="text-blue-600">{value}</span>
    },
    {
      title: t('completion_rate'),
      dataIndex: 'completion_rate',
      key: 'rate',
      align: 'center',
      render: (rate) => (
        <span className={rate >= 80 ? 'text-green-600 font-semibold' : 'text-orange-600'}>
          {rate}%
        </span>
      )
    }
  ];

  // Vehicle Report Columns
  const vehicleColumns = [
    {
      title: t('plate_number'),
      dataIndex: 'plate_number',
      key: 'plate',
      render: (text) => <span className="font-semibold">{text}</span>
    },
    {
      title: t('truck_type'),
      dataIndex: 'truck_type',
      key: 'type'
    },
    {
      title: t('driver'),
      dataIndex: 'driver_name',
      key: 'driver'
    },
    {
      title: t('total_deliveries'),
      dataIndex: 'total_deliveries',
      key: 'deliveries',
      align: 'center'
    },
    {
      title: t('completed'),
      dataIndex: 'completed_deliveries',
      key: 'completed',
      align: 'center',
      render: (value) => <span className="text-green-600">{value}</span>
    },
    {
      title: t('avg_per_day'),
      dataIndex: 'avg_deliveries_per_day',
      key: 'avg',
      align: 'center',
      render: (value) => value?.toFixed(1) || '-'
    },
    {
      title: t('utilization_rate'),
      key: 'utilization',
      align: 'center',
      render: (_, record) => {
        const rate = record.total_deliveries > 0
          ? ((record.completed_deliveries / record.total_deliveries) * 100).toFixed(1)
          : 0;
        return (
          <span className={parseFloat(rate) >= 80 ? 'text-green-600 font-semibold' : 'text-orange-600'}>
            {rate}%
          </span>
        );
      }
    }
  ];

  // Driver Report Columns
  const driverColumns = [
    {
      title: t('driver_name'),
      dataIndex: 'driver_name',
      key: 'name',
      render: (text) => <span className="font-semibold">{text}</span>
    },
    {
      title: t('phone'),
      dataIndex: 'driver_phone',
      key: 'phone'
    },
    {
      title: t('total_deliveries'),
      dataIndex: 'total_deliveries',
      key: 'total',
      align: 'center'
    },
    {
      title: t('completed'),
      dataIndex: 'completed_deliveries',
      key: 'completed',
      align: 'center',
      render: (value) => <span className="text-green-600 font-semibold">{value}</span>
    },
    {
      title: t('assigned_vehicles'),
      dataIndex: 'assigned_vehicles',
      key: 'vehicles',
      align: 'center'
    },
    {
      title: t('completion_rate'),
      key: 'rate',
      align: 'center',
      render: (_, record) => {
        const rate = record.total_deliveries > 0
          ? ((record.completed_deliveries / record.total_deliveries) * 100).toFixed(1)
          : 0;
        return (
          <span className={parseFloat(rate) >= 80 ? 'text-green-600 font-semibold' : 'text-orange-600'}>
            {rate}%
          </span>
        );
      }
    }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="delivery-reports p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">{t('delivery_reports')}</h1>
          <p className="text-gray-500">{t('performance_analytics_insights')}</p>
        </div>
        
        <Space>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            format="YYYY-MM-DD"
          />
          <Button
            icon={<MdRefresh />}
            onClick={loadAllReports}
            loading={loading}
          >
            {t('refresh')}
          </Button>
        </Space>
      </div>

      <Tabs defaultActiveKey="performance">
        {/* Performance Report */}
        <TabPane
          tab={
            <span>
              <MdTrendingUp className="inline mr-2" />
              {t('performance_report')}
            </span>
          }
          key="performance"
        >
          {/* Summary Stats */}
          <Row gutter={[16, 16]} className="mb-4">
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title={t('total_orders')}
                  value={performanceSummary.total_orders || 0}
                  prefix={<MdLocalShipping className="text-blue-500" />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title={t('completed')}
                  value={performanceSummary.total_completed || 0}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title={t('in_transit')}
                  value={performanceSummary.total_in_transit || 0}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title={t('avg_delivery_time')}
                  value={performanceSummary.avg_delivery_minutes || 0}
                  suffix="min"
                />
              </Card>
            </Col>
          </Row>

          {/* Performance Chart */}
          <Card title={t('delivery_trend')} className="mb-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="delivery_date"
                  tickFormatter={(date) => moment(date).format('MMM DD')}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => moment(date).format('MMM DD, YYYY')}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#52c41a" 
                  name={t('completed')}
                />
                <Line 
                  type="monotone" 
                  dataKey="in_transit" 
                  stroke="#fa8c16"
                  name={t('in_transit')}
                />
                <Line 
                  type="monotone" 
                  dataKey="pending" 
                  stroke="#1890ff"
                  name={t('pending')}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Performance Table */}
          <Card 
            title={t('daily_performance')}
            extra={
              <Button
                icon={<MdDownload />}
                onClick={() => handleExport('performance')}
              >
                {t('export')}
              </Button>
            }
          >
            <Table
              dataSource={performanceData}
              columns={performanceColumns}
              rowKey="delivery_date"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>

        {/* Vehicle Utilization */}
        <TabPane
          tab={
            <span>
              <MdLocalShipping className="inline mr-2" />
              {t('vehicle_utilization')}
            </span>
          }
          key="vehicle"
        >
          <Row gutter={[16, 16]} className="mb-4">
            <Col xs={24} lg={12}>
              <Card title={t('top_performing_vehicles')}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={vehicleData.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="plate_number" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completed_deliveries" fill="#52c41a" name={t('completed')} />
                    <Bar dataKey="total_deliveries" fill="#1890ff" name={t('total')} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            
            <Col xs={24} lg={12}>
              <Card title={t('vehicle_statistics')}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title={t('total_vehicles')}
                      value={vehicleData.length}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title={t('avg_deliveries')}
                      value={(vehicleData.reduce((sum, v) => sum + (v.total_deliveries || 0), 0) / vehicleData.length || 0).toFixed(1)}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          <Card
            title={t('vehicle_utilization_details')}
            extra={
              <Button
                icon={<MdDownload />}
                onClick={() => handleExport('vehicle')}
              >
                {t('export')}
              </Button>
            }
          >
            <Table
              dataSource={vehicleData}
              columns={vehicleColumns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>

        {/* Driver Performance */}
        <TabPane
          tab={
            <span>
              <MdPerson className="inline mr-2" />
              {t('driver_performance')}
            </span>
          }
          key="driver"
        >
          <Row gutter={[16, 16]} className="mb-4">
            <Col xs={24} lg={12}>
              <Card title={t('top_drivers')}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={driverData.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="driver_name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completed_deliveries" fill="#52c41a" name={t('completed')} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            
            <Col xs={24} lg={12}>
              <Card title={t('driver_statistics')}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title={t('total_drivers')}
                      value={driverData.length}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title={t('avg_deliveries_per_driver')}
                      value={(driverData.reduce((sum, d) => sum + (d.total_deliveries || 0), 0) / driverData.length || 0).toFixed(1)}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          <Card
            title={t('driver_performance_details')}
            extra={
              <Button
                icon={<MdDownload />}
                onClick={() => handleExport('driver')}
              >
                {t('export')}
              </Button>
            }
          >
            <Table
              dataSource={driverData}
              columns={driverColumns}
              rowKey="driver_name"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default DeliveryReports;