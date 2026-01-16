// ✅ StockReconciliationPage.jsx - Stock Reconciliation Report & Management

import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  Alert,
  Divider
} from "antd";
import {
  PlusOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  FileSearchOutlined,
  BarChartOutlined
} from "@ant-design/icons";
import MainPage from "../../component/layout/MainPage";
import { request } from "../../util/helper";
import "./Stockreconciliation.css"
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

function StockReconciliationPage() {
  const [form] = Form.useForm();
  
  const [state, setState] = useState({
    loading: false,
    reconciliationList: [],
    varianceReport: [],
    products: [],
    selectedDate: dayjs(),
    filters: {
      dateRange: [dayjs().subtract(7, 'days'), dayjs()],
      status: null,
      product_id: null
    }
  });

  const [reconcileModal, setReconcileModal] = useState(false);

  useEffect(() => {
    loadReconciliationList();
    loadVarianceReport();
    loadProducts();
  }, [state.filters]);

  // ========================================
  // 1. LOAD RECONCILIATION LIST
  // ========================================

  const loadReconciliationList = async () => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      const params = {};
      
      if (state.filters.dateRange) {
        params.from_date = state.filters.dateRange[0].format('YYYY-MM-DD');
        params.to_date = state.filters.dateRange[1].format('YYYY-MM-DD');
      }
      
      if (state.filters.status) {
        params.status = state.filters.status;
      }
      
      if (state.filters.product_id) {
        params.product_id = state.filters.product_id;
      }

      const queryString = new URLSearchParams(params).toString();
      const res = await request(`closing/stock/reconciliation/list?${queryString}`, "get");

      if (res && res.success) {
        setState(prev => ({
          ...prev,
          reconciliationList: res.list || [],
          loading: false
        }));
      }
    } catch (error) {
      console.error("Error loading reconciliations:", error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  // ========================================
  // 2. LOAD VARIANCE REPORT
  // ========================================

  const loadVarianceReport = async () => {
    try {
      const params = {};
      
      if (state.filters.dateRange) {
        params.from_date = state.filters.dateRange[0].format('YYYY-MM-DD');
        params.to_date = state.filters.dateRange[1].format('YYYY-MM-DD');
      }

      const queryString = new URLSearchParams(params).toString();
      const res = await request(`closing/stock/variance-report?${queryString}`, "get");

      if (res && res.success) {
        setState(prev => ({
          ...prev,
          varianceReport: res.data || []
        }));
      }
    } catch (error) {
      console.error("Error loading variance report:", error);
    }
  };

  // ========================================
  // 3. LOAD PRODUCTS
  // ========================================

  const loadProducts = async () => {
    try {
      const res = await request("inventory/pos-products", "get");
      
      if (res && res.list) {
        setState(prev => ({
          ...prev,
          products: res.list
        }));
      }
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  // ========================================
  // 4. CREATE RECONCILIATION
  // ========================================

  const handleCreateReconciliation = async (values) => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      const payload = {
        reconciliation_date: values.reconciliation_date.format('YYYY-MM-DD'),
        reconciliation_type: values.reconciliation_type || 'adhoc',
        reference_type: 'manual',
        reconciliations: values.reconciliations || []
      };

      const res = await request("closing/stock/reconciliation/create", "post", payload);

      if (res && res.success) {
        message.success("បង្កើតការផ្ទៀងផ្ទាត់បានជោគជ័យ!");
        setReconcileModal(false);
        form.resetFields();
        loadReconciliationList();
        loadVarianceReport();
      } else {
        message.error(res?.message || "មានបញ្ហា");
      }
    } catch (error) {
      console.error("Error creating reconciliation:", error);
      message.error("មានបញ្ហា");
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  // ========================================
  // 5. UPDATE STATUS
  // ========================================

  const handleUpdateStatus = async (id, status, notes) => {
    try {
      const res = await request(
        `closing/stock/reconciliation/${id}/status`,
        "put",
        { status, notes }
      );

      if (res && res.success) {
        message.success("បានធ្វើបច្ចុប្បន្នភាព status!");
        loadReconciliationList();
      } else {
        message.error(res?.message || "មានបញ្ហា");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      message.error("មានបញ្ហា");
    }
  };

  // ========================================
  // RENDER: VARIANCE REPORT CARDS
  // ========================================

  const renderVarianceCards = () => {
    const totalVariance = state.varianceReport.reduce(
      (sum, item) => sum + parseFloat(item.total_variance_value || 0),
      0
    );

    const totalLoss = state.varianceReport.reduce(
      (sum, item) => sum + parseFloat(item.total_loss_liters || 0),
      0
    );

    const totalGain = state.varianceReport.reduce(
      (sum, item) => sum + parseFloat(item.total_gain_liters || 0),
      0
    );

    return (
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="តម្លៃខុសគ្នាសរុប"
              value={Math.abs(totalVariance)}
              prefix="$"
              precision={2}
              valueStyle={{ color: totalVariance < 0 ? '#f5222d' : '#52c41a' }}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card>
            <Statistic
              title="ស្តុកបាត់បង់"
              value={totalLoss}
              suffix="L"
              precision={2}
              valueStyle={{ color: '#f5222d' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card>
            <Statistic
              title="ស្តុកបន្ថែម"
              value={totalGain}
              suffix="L"
              precision={2}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  // ========================================
  // RENDER: VARIANCE REPORT TABLE
  // ========================================

  const renderVarianceReportTable = () => {
    const columns = [
      {
        title: "ផលិតផល",
        dataIndex: "product_name"
      },
      {
        title: "ប្រភេទ",
        dataIndex: "category_name"
      },
      {
        title: "ចំនួនដងផ្ទៀងផ្ទាត់",
        dataIndex: "reconciliation_count"
      },
      {
        title: "ភាពខុសគ្នាសរុប (L)",
        dataIndex: "total_variance_liters",
        render: (variance) => {
          const val = parseFloat(variance || 0);
          return (
            <Text style={{ color: val < 0 ? '#f5222d' : '#52c41a' }}>
              {val.toFixed(2)} L
            </Text>
          );
        }
      },
      {
        title: "តម្លៃខុសគ្នា",
        dataIndex: "total_variance_value",
        render: (value) => {
          const val = parseFloat(value || 0);
          return (
            <Text strong style={{ color: val < 0 ? '#f5222d' : '#52c41a' }}>
              ${Math.abs(val).toFixed(2)}
            </Text>
          );
        }
      },
      {
        title: "ភាគរយមធ្យម",
        dataIndex: "avg_variance_percentage",
        render: (pct) => `${parseFloat(pct || 0).toFixed(2)}%`
      },
      {
        title: "ស្តុកបាត់",
        dataIndex: "total_loss_liters",
        render: (loss) => (
          <Text type="danger">{parseFloat(loss || 0).toFixed(2)} L</Text>
        )
      },
      {
        title: "ស្តុកបន្ថែម",
        dataIndex: "total_gain_liters",
        render: (gain) => (
          <Text type="success">{parseFloat(gain || 0).toFixed(2)} L</Text>
        )
      }
    ];

    return (
      <Card
        title={
          <Space>
            <BarChartOutlined />
            <span>របាយការណ៍ភាពខុសគ្នាស្តុក</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Table
          dataSource={state.varianceReport}
          columns={columns}
          rowKey="product_id"
          pagination={false}
        />
      </Card>
    );
  };

  // ========================================
  // RENDER: RECONCILIATION LIST TABLE
  // ========================================

  const renderReconciliationTable = () => {
    const columns = [
      {
        title: "ថ្ងៃផ្ទៀងផ្ទាត់",
        dataIndex: "reconciliation_date",
        render: (date) => dayjs(date).format('DD/MM/YYYY')
      },
      {
        title: "ផលិតផល",
        dataIndex: "product_name"
      },
      {
        title: "ស្តុកក្នុងប្រព័ន្ធ",
        dataIndex: "system_stock",
        render: (stock) => `${parseFloat(stock || 0).toFixed(2)} L`
      },
      {
        title: "ស្តុករូបវន្ត",
        dataIndex: "physical_stock",
        render: (stock) => `${parseFloat(stock || 0).toFixed(2)} L`
      },
      {
        title: "ភាពខុសគ្នា",
        dataIndex: "variance",
        render: (variance) => {
          const val = parseFloat(variance || 0);
          return (
            <Tag color={val < 0 ? 'red' : val > 0 ? 'green' : 'default'}>
              {val.toFixed(2)} L
            </Tag>
          );
        }
      },
      {
        title: "តម្លៃ",
        dataIndex: "variance_value",
        render: (value) => {
          const val = parseFloat(value || 0);
          return (
            <Text style={{ color: val < 0 ? '#f5222d' : '#52c41a' }}>
              ${Math.abs(val).toFixed(2)}
            </Text>
          );
        }
      },
      {
        title: "មូលហេតុ",
        dataIndex: "variance_reason",
        render: (reason) => {
          if (!reason) return '-';
          
          const labels = {
            evaporation: 'រហួត',
            theft: 'លួច',
            measurement_error: 'កំហុសវាស់',
            spillage: 'រលាក',
            other: 'ផ្សេងៗ'
          };
          return labels[reason] || reason;
        }
      },
      {
        title: "Status",
        dataIndex: "status",
        render: (status) => {
          const config = {
            pending: { color: 'orange', text: 'រង់ចាំ' },
            investigated: { color: 'blue', text: 'កំពុងស៊ើបអង្កេត' },
            resolved: { color: 'green', text: 'បានដោះស្រាយ' },
            written_off: { color: 'red', text: 'បានលុបចោល' }
          };
          const cfg = config[status] || { color: 'default', text: status };
          return <Tag color={cfg.color}>{cfg.text}</Tag>;
        }
      },
      {
        title: "សកម្មភាព",
        render: (_, record) => (
          <Space>
            {record.status === 'pending' && (
              <Button
                size="small"
                type="primary"
                onClick={() => {
                  Modal.confirm({
                    title: "ស៊ើបអង្កេត",
                    content: (
                      <TextArea
                        rows={3}
                        placeholder="កំណត់សម្គាល់..."
                        id="investigation-notes"
                      />
                    ),
                    onOk: () => {
                      const notes = document.getElementById('investigation-notes').value;
                      handleUpdateStatus(record.id, 'investigated', notes);
                    }
                  });
                }}
              >
                ស៊ើបអង្កេត
              </Button>
            )}
            
            {record.status === 'investigated' && (
              <Button
                size="small"
                type="primary"
                onClick={() => handleUpdateStatus(record.id, 'resolved', 'បានដោះស្រាយ')}
              >
                ដោះស្រាយ
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
            <FileSearchOutlined />
            <span>ប្រវត្តិការផ្ទៀងផ្ទាត់</span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setReconcileModal(true)}
          >
            បង្កើតការផ្ទៀងផ្ទាត់
          </Button>
        }
      >
        {/* Filters */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={10}>
            <RangePicker
              value={state.filters.dateRange}
              onChange={(dates) => {
                setState(prev => ({
                  ...prev,
                  filters: { ...prev.filters, dateRange: dates }
                }));
              }}
              format="DD/MM/YYYY"
              style={{ width: '100%' }}
            />
          </Col>

          <Col span={7}>
            <Select
              placeholder="ជ្រើសរើសផលិតផល"
              style={{ width: '100%' }}
              allowClear
              onChange={(value) => {
                setState(prev => ({
                  ...prev,
                  filters: { ...prev.filters, product_id: value }
                }));
              }}
            >
              {state.products.map(p => (
                <Option key={p.id} value={p.id}>{p.name}</Option>
              ))}
            </Select>
          </Col>

          <Col span={7}>
            <Select
              placeholder="ជ្រើសរើស Status"
              style={{ width: '100%' }}
              allowClear
              onChange={(value) => {
                setState(prev => ({
                  ...prev,
                  filters: { ...prev.filters, status: value }
                }));
              }}
            >
              <Option value="pending">រង់ចាំ</Option>
              <Option value="investigated">ស៊ើបអង្កេត</Option>
              <Option value="resolved">ដោះស្រាយ</Option>
              <Option value="written_off">លុបចោល</Option>
            </Select>
          </Col>
        </Row>

        <Table
          dataSource={state.reconciliationList}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 20 }}
        />
      </Card>
    );
  };

  // ========================================
  // RENDER: CREATE MODAL
  // ========================================

  const renderCreateModal = () => (
    <Modal
      title="បង្កើតការផ្ទៀងផ្ទាត់ស្តុក"
      open={reconcileModal}
      onCancel={() => {
        setReconcileModal(false);
        form.resetFields();
      }}
      footer={null}
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleCreateReconciliation}
      >
        <Form.Item
          label="ថ្ងៃផ្ទៀងផ្ទាត់"
          name="reconciliation_date"
          initialValue={dayjs()}
          rules={[{ required: true }]}
        >
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
        </Form.Item>

        <Form.Item
          label="ប្រភេទការផ្ទៀងផ្ទាត់"
          name="reconciliation_type"
          initialValue="adhoc"
        >
          <Select>
            <Option value="shift">តាមវេន</Option>
            <Option value="daily">ថ្ងៃ</Option>
            <Option value="weekly">សប្តាហ៍</Option>
            <Option value="monthly">ខែ</Option>
            <Option value="adhoc">ពិសេស</Option>
          </Select>
        </Form.Item>

        <Divider>ស្តុកផលិតផល</Divider>

        <Form.List name="reconciliations">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, index) => (
                <Card key={field.key} style={{ marginBottom: 16 }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        {...field}
                        label="ផលិតផល"
                        name={[field.name, 'product_id']}
                        rules={[{ required: true }]}
                      >
                        <Select placeholder="ជ្រើសរើសផលិតផល">
                          {state.products.map(p => (
                            <Option key={p.id} value={p.id}>{p.name}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col span={12}>
                      <Form.Item
                        {...field}
                        label="ស្តុករូបវន្ត (L)"
                        name={[field.name, 'physical_stock']}
                        rules={[{ required: true }]}
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          min={0}
                          placeholder="បរិមាណ"
                        />
                      </Form.Item>
                    </Col>

                    <Col span={12}>
                      <Form.Item
                        {...field}
                        label="មូលហេតុ (ប្រសិនបើមាន)"
                        name={[field.name, 'variance_reason']}
                      >
                        <Select placeholder="ជ្រើសរើសមូលហេតុ">
                          <Option value="evaporation">រហួត</Option>
                          <Option value="theft">លួច</Option>
                          <Option value="measurement_error">កំហុសវាស់</Option>
                          <Option value="spillage">រលាក</Option>
                          <Option value="other">ផ្សេងៗ</Option>
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col span={12}>
                      <Form.Item
                        {...field}
                        label="កំណត់សម្គាល់"
                        name={[field.name, 'notes']}
                      >
                        <Input placeholder="កំណត់សម្គាល់..." />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Button danger onClick={() => remove(field.name)}>
                    លុប
                  </Button>
                </Card>
              ))}

              <Button
                type="dashed"
                onClick={() => add()}
                block
                icon={<PlusOutlined />}
              >
                បន្ថែមផលិតផល
              </Button>
            </>
          )}
        </Form.List>

        <Divider />

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={state.loading}>
              បង្កើត
            </Button>
            <Button onClick={() => setReconcileModal(false)}>
              បោះបង់
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );

  // ========================================
  // RENDER MAIN
  // ========================================

  return (
    <MainPage loading={state.loading}>
      <div style={{ padding: '24px' }}>
        <Title level={2}>
          <FileSearchOutlined /> ផ្ទៀងផ្ទាត់ស្តុក (Stock Reconciliation)
        </Title>

        {renderVarianceCards()}
        {renderVarianceReportTable()}
        {renderReconciliationTable()}
        {renderCreateModal()}
      </div>
    </MainPage>
  );
}

export default StockReconciliationPage;