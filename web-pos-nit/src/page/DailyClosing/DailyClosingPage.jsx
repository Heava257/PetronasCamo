// ✅ DailyClosingPage.jsx - Complete Daily Closing Dashboard

import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Divider,
  Modal,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Timeline,
  Typography,
  message,
  Progress,
  Alert
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  WarningOutlined,
  FileTextOutlined,
  BarChartOutlined,
  PlusOutlined,
  EyeOutlined
} from "@ant-design/icons";
import MainPage from "../../component/layout/MainPage";
import { request } from "../../util/helper";
import dayjs from "dayjs";
import "./DailyClosing.css";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

function DailyClosingPage() {
  const [state, setState] = useState({
    loading: false,
    selectedDate: dayjs(),
    dailyClosingList: [],
    shiftList: [],
    dashboardStats: null,
    selectedClosing: null
  });

  const [detailModal, setDetailModal] = useState(false);

  useEffect(() => {
    loadDashboardStats();
    loadShiftList();
    loadDailyClosingList();
  }, [state.selectedDate]);

  // ========================================
  // 1. LOAD DASHBOARD STATISTICS
  // ========================================

  const loadDashboardStats = async () => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      const res = await request(
        `closing/daily/dashboard/stats?date=${state.selectedDate.format('YYYY-MM-DD')}`,
        "get"
      );

      if (res && res.success) {
        setState(prev => ({
          ...prev,
          dashboardStats: res.data,
          loading: false
        }));
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  // ========================================
  // 2. LOAD SHIFT LIST FOR DATE
  // ========================================

  const loadShiftList = async () => {
    try {
      const res = await request(
        `closing/shift/list?from_date=${state.selectedDate.format('YYYY-MM-DD')}&to_date=${state.selectedDate.format('YYYY-MM-DD')}`,
        "get"
      );

      if (res && res.success) {
        setState(prev => ({
          ...prev,
          shiftList: res.list || []
        }));
      }
    } catch (error) {
      console.error("Error loading shifts:", error);
    }
  };

  // ========================================
  // 3. LOAD DAILY CLOSING LIST
  // ========================================

  const loadDailyClosingList = async () => {
    try {
      const res = await request("closing/daily/list", "get");

      if (res && res.success) {
        setState(prev => ({
          ...prev,
          dailyClosingList: res.list || []
        }));
      }
    } catch (error) {
      console.error("Error loading daily closings:", error);
    }
  };

  // ========================================
  // 4. CREATE DAILY CLOSING
  // ========================================

  const handleCreateDailyClosing = async () => {
    const approvedShifts = state.shiftList.filter(s => s.status === 'approved');

    if (approvedShifts.length === 0) {
      message.warning("មិនមានវេនដែលបានអនុម័តសម្រាប់ថ្ងៃនេះទេ!");
      return;
    }

    Modal.confirm({
      title: "បង្កើតបិទថ្ងៃ",
      content: `តើអ្នកចង់បង្កើតបិទថ្ងៃសម្រាប់ ${state.selectedDate.format('DD/MM/YYYY')} មែនទេ?`,
      okText: "បង្កើត",
      cancelText: "បោះបង់",
      onOk: async () => {
        setState(prev => ({ ...prev, loading: true }));

        try {
          const res = await request("closing/daily/create", "post", {
            closing_date: state.selectedDate.format('YYYY-MM-DD')
          });

          if (res && res.success) {
            message.success("បង្កើតបិទថ្ងៃបានជោគជ័យ!");
            
            Modal.info({
              title: "សង្ខេបបិទថ្ងៃ",
              content: (
                <div>
                  <p><strong>ចំណេញសុទ្ធ:</strong> ${res.data.net_profit?.toFixed(2)}</p>
                  <p><strong>ប្រាក់ចំណេញ:</strong> {res.data.profit_margin}%</p>
                </div>
              )
            });

            loadDashboardStats();
            loadDailyClosingList();
          } else {
            message.error(res?.message || "មានបញ្ហា");
          }
        } catch (error) {
          console.error("Error creating daily closing:", error);
          message.error("មានបញ្ហា");
        } finally {
          setState(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  // ========================================
  // 5. APPROVE DAILY CLOSING
  // ========================================

  const handleApproveDailyClosing = async (id) => {
    Modal.confirm({
      title: "អនុម័តបិទថ្ងៃ",
      content: "តើអ្នកប្រាកដថាចង់អនុម័តបិទថ្ងៃនេះមែនទេ?",
      okText: "អនុម័ត",
      cancelText: "បោះបង់",
      onOk: async () => {
        try {
          const res = await request(`closing/daily/${id}/approve`, "put", {});

          if (res && res.success) {
            message.success("អនុម័តបានជោគជ័យ!");
            loadDailyClosingList();
          } else {
            message.error(res?.message || "មានបញ្ហា");
          }
        } catch (error) {
          console.error("Error approving:", error);
          message.error("មានបញ្ហា");
        }
      }
    });
  };

  // ========================================
  // 6. VIEW CLOSING DETAILS
  // ========================================

  const handleViewDetails = async (record) => {
    try {
      const res = await request(`closing/daily/${record.id}`, "get");

      if (res && res.success) {
        setState(prev => ({
          ...prev,
          selectedClosing: res.data
        }));
        setDetailModal(true);
      }
    } catch (error) {
      console.error("Error loading details:", error);
    }
  };

  // ========================================
  // RENDER: DASHBOARD CARDS
  // ========================================

  const renderDashboardCards = () => {
    const stats = state.dashboardStats;
    const dailyClosing = stats?.daily_closing;
    const shiftSummary = stats?.shift_summary || {};

    return (
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="វេនសរុប"
              value={shiftSummary.total_shifts || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>

        <Col span={6}>
          <Card>
            <Statistic
              title="វេនអនុម័ត"
              value={shiftSummary.approved_shifts || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>

        <Col span={6}>
          <Card>
            <Statistic
              title="វេនរង់ចាំ"
              value={shiftSummary.pending_shifts || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>

        <Col span={6}>
          <Card>
            <Statistic
              title="ការលក់សរុប"
              value={dailyClosing?.total_sales_amount || 0}
              prefix="$"
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  // ========================================
  // RENDER: SHIFT LIST TABLE
  // ========================================

  const renderShiftTable = () => {
    const columns = [
      {
        title: "វេន",
        dataIndex: "shift_name",
        render: (name) => {
          const labels = {
            morning: "ព្រឹក",
            afternoon: "រសៀល",
            evening: "ល្ងាច",
            night: "យប់"
          };
          return labels[name] || name;
        }
      },
      {
        title: "បុគ្គលិក",
        dataIndex: "staff_name"
      },
      {
        title: "ម៉ោងចាប់ផ្តើម",
        dataIndex: "start_time",
        render: (time) => dayjs(time).format('HH:mm')
      },
      {
        title: "ម៉ោងបិទ",
        dataIndex: "end_time",
        render: (time) => time ? dayjs(time).format('HH:mm') : '-'
      },
      {
        title: "ការលក់",
        dataIndex: "total_sales_amount",
        render: (amount) => `$${parseFloat(amount || 0).toFixed(2)}`
      },
      {
        title: "ស្តុកបាត់",
        dataIndex: "total_stock_loss_liters",
        render: (loss) => `${parseFloat(loss || 0).toFixed(2)} L`
      },
      {
        title: "សាច់ប្រាក់ខុសគ្នា",
        dataIndex: "cash_variance",
        render: (variance) => {
          const val = parseFloat(variance || 0);
          return (
            <Text style={{ color: val >= 0 ? '#52c41a' : '#f5222d' }}>
              ${Math.abs(val).toFixed(2)}
            </Text>
          );
        }
      },
      {
        title: "Status",
        dataIndex: "status",
        render: (status) => {
          const config = {
            open: { color: 'blue', text: 'កំពុងបើក' },
            pending_approval: { color: 'orange', text: 'រង់ចាំអនុម័ត' },
            approved: { color: 'green', text: 'បានអនុម័ត' },
            rejected: { color: 'red', text: 'បានបដិសេធ' }
          };
          const cfg = config[status] || { color: 'default', text: status };
          return <Tag color={cfg.color}>{cfg.text}</Tag>;
        }
      }
    ];

    return (
      <Card
        title={
          <Space>
            <ClockCircleOutlined />
            <span>វេនទាំងអស់ថ្ងៃនេះ</span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateDailyClosing}
            disabled={state.shiftList.filter(s => s.status === 'approved').length === 0}
          >
            បង្កើតបិទថ្ងៃ
          </Button>
        }
        style={{ marginBottom: 24 }}
      >
        <Table
          dataSource={state.shiftList}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    );
  };

  // ========================================
  // RENDER: DAILY CLOSING HISTORY
  // ========================================

  const renderDailyClosingTable = () => {
    const columns = [
      {
        title: "ថ្ងៃបិទ",
        dataIndex: "closing_date",
        render: (date) => dayjs(date).format('DD/MM/YYYY')
      },
      {
        title: "វេនសរុប",
        dataIndex: "total_shifts"
      },
      {
        title: "ការលក់សរុប",
        dataIndex: "total_sales_amount",
        render: (amount) => `$${parseFloat(amount || 0).toFixed(2)}`
      },
      {
        title: "លីត្រលក់",
        dataIndex: "total_sales_liters",
        render: (liters) => `${parseFloat(liters || 0).toFixed(2)} L`
      },
      {
        title: "ចំណាយ",
        dataIndex: "total_expenses",
        render: (expenses) => `$${parseFloat(expenses || 0).toFixed(2)}`
      },
      {
        title: "ស្តុកបាត់",
        dataIndex: "total_stock_loss_value",
        render: (loss) => `$${parseFloat(loss || 0).toFixed(2)}`
      },
      {
        title: "ចំណេញសុទ្ធ",
        dataIndex: "net_profit",
        render: (profit) => {
          const val = parseFloat(profit || 0);
          return (
            <Text strong style={{ color: val >= 0 ? '#52c41a' : '#f5222d' }}>
              ${val.toFixed(2)}
            </Text>
          );
        }
      },
      {
        title: "ប្រាក់ចំណេញ",
        dataIndex: "profit_margin",
        render: (margin) => `${parseFloat(margin || 0).toFixed(2)}%`
      },
      {
        title: "Status",
        dataIndex: "status",
        render: (status) => {
          const config = {
            draft: { color: 'default', text: 'ព្រាង' },
            pending_review: { color: 'orange', text: 'រង់ចាំពិនិត្យ' },
            approved: { color: 'green', text: 'បានអនុម័ត' },
            finalized: { color: 'blue', text: 'បានបញ្ចប់' }
          };
          const cfg = config[status] || { color: 'default', text: status };
          return <Tag color={cfg.color}>{cfg.text}</Tag>;
        }
      },
      {
        title: "សកម្មភាព",
        render: (_, record) => (
          <Space>
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            >
              មើល
            </Button>
            {record.status === 'draft' && (
              <Button
                size="small"
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => handleApproveDailyClosing(record.id)}
              >
                អនុម័ត
              </Button>
            )}
          </Space>
        )
      }
    ];

    return (
      <Card
        title={
          <Space>
            <FileTextOutlined />
            <span>ប្រវត្តិបិទថ្ងៃ</span>
          </Space>
        }
      >
        <Table
          dataSource={state.dailyClosingList}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    );
  };

  // ========================================
  // RENDER: DETAIL MODAL
  // ========================================

  const renderDetailModal = () => {
    const closing = state.selectedClosing;
    if (!closing) return null;

    return (
      <Modal
        title="ព័ត៌មានលម្អិតបិទថ្ងៃ"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={null}
        width={900}
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="ថ្ងៃបិទ" span={2}>
            {dayjs(closing.closing_date).format('DD/MM/YYYY')}
          </Descriptions.Item>

          <Descriptions.Item label="វេនសរុប">
            {closing.total_shifts}
          </Descriptions.Item>

          <Descriptions.Item label="ការលក់សរុប">
            ${parseFloat(closing.total_sales_amount || 0).toFixed(2)}
          </Descriptions.Item>

          <Descriptions.Item label="លីត្រលក់">
            {parseFloat(closing.total_sales_liters || 0).toFixed(2)} L
          </Descriptions.Item>

          <Descriptions.Item label="ការបញ្ជាទិញសរុប">
            {closing.total_orders}
          </Descriptions.Item>

          <Descriptions.Item label="សាច់ប្រាក់" span={2}>
            <Row gutter={16}>
              <Col span={6}>Cash: ${parseFloat(closing.total_cash || 0).toFixed(2)}</Col>
              <Col span={6}>Card: ${parseFloat(closing.total_card || 0).toFixed(2)}</Col>
              <Col span={6}>Transfer: ${parseFloat(closing.total_transfer || 0).toFixed(2)}</Col>
              <Col span={6}>Credit: ${parseFloat(closing.total_credit || 0).toFixed(2)}</Col>
            </Row>
          </Descriptions.Item>

          <Descriptions.Item label="ចំណាយសរុប">
            ${parseFloat(closing.total_expenses || 0).toFixed(2)}
          </Descriptions.Item>

          <Descriptions.Item label="ស្តុកបាត់">
            {parseFloat(closing.total_stock_loss_liters || 0).toFixed(2)} L
            (${parseFloat(closing.total_stock_loss_value || 0).toFixed(2)})
          </Descriptions.Item>

          <Descriptions.Item label="ចំណូលសរុប">
            ${parseFloat(closing.gross_revenue || 0).toFixed(2)}
          </Descriptions.Item>

          <Descriptions.Item label="ចំណាយសរុប">
            ${parseFloat(closing.total_costs || 0).toFixed(2)}
          </Descriptions.Item>

          <Descriptions.Item label="ចំណេញសុទ្ធ" span={2}>
            <Text strong style={{ 
              fontSize: 18,
              color: parseFloat(closing.net_profit || 0) >= 0 ? '#52c41a' : '#f5222d'
            }}>
              ${parseFloat(closing.net_profit || 0).toFixed(2)}
            </Text>
          </Descriptions.Item>

          <Descriptions.Item label="ប្រាក់ចំណេញ" span={2}>
            <Progress 
              percent={parseFloat(closing.profit_margin || 0)} 
              status={parseFloat(closing.profit_margin || 0) >= 10 ? 'success' : 'exception'}
            />
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    );
  };

  // ========================================
  // RENDER MAIN
  // ========================================

  return (
    <MainPage loading={state.loading}>
      <div style={{ padding: '24px' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Title level={2}>
              <BarChartOutlined /> បិទថ្ងៃ (Daily Closing Dashboard)
            </Title>
          </Col>
          <Col>
            <DatePicker
              value={state.selectedDate}
              onChange={(date) => {
                setState(prev => ({ ...prev, selectedDate: date || dayjs() }));
              }}
              format="DD/MM/YYYY"
              style={{ width: 200 }}
            />
          </Col>
        </Row>

        {renderDashboardCards()}
        {renderShiftTable()}
        {renderDailyClosingTable()}
        {renderDetailModal()}
      </div>
    </MainPage>
  );
}

export default DailyClosingPage;