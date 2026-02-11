import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Typography,
  Table,
  Tag,
  Space,
  DatePicker,
  Select,
  Divider,
  Statistic
} from "antd";
import Swal from 'sweetalert2';
import {
  PrinterOutlined,
  DownloadOutlined,
  ReloadOutlined,
  DollarOutlined,
  TeamOutlined,
  WarningOutlined,
  CheckCircleOutlined
} from "@ant-design/icons";
import { request } from "../../util/helper";
import { useTranslation } from "../../locales/TranslationContext";
import moment from "moment";
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

function SalaryReport() {
  const { t } = useTranslation();

  const [report, setReport] = useState([]);
  const [summary, setSummary] = useState(null);
  const [period, setPeriod] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState([
    moment().startOf('month'),
    moment().endOf('month')
  ]);

  const theme = {
    background: '#ffffff',
    cardBg: '#f8f9fa',
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    textPrimary: '#1f2937',
    textSecondary: '#6b7280',
    borderColor: '#e5e7eb'
  };

  useEffect(() => {
    fetchSalaryReport();
  }, [dateRange]);

  const fetchSalaryReport = async () => {
    setIsLoading(true);
    try {
      const fromDate = dateRange[0].format('YYYY-MM-DD');
      const toDate = dateRange[1].format('YYYY-MM-DD');

      const res = await request(`attendance/salary-report?from_date=${fromDate}&to_date=${toDate}`, 'get');

      if (res && !res.error) {
        setReport(res.report || []);
        setSummary(res.summary || {});
        setPeriod(res.period || {});
      }
    } catch (error) {
      console.error('Error fetching salary report:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: t('Failed to fetch salary report'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (report.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Warning',
        text: t('No data to export'),
      });
      return;
    }

    const exportData = report.map((emp, index) => ({
      'No': index + 1,
      'Employee Name': emp.employee_name,
      'Position': emp.position || '-',
      'Department': emp.department_name || '-',
      'Monthly Salary ($)': parseFloat(emp.monthly_salary || 0).toFixed(2),
      'Days Worked': emp.days_worked,
      'Days On Time': emp.days_on_time,
      'Days Late (Grace)': emp.days_late_grace,
      'Days Late (Penalty)': emp.days_late_penalty,
      'Days Absent': emp.days_absent,
      'Total Late Minutes (Penalty)': emp.total_penalty_late_minutes,
      'Late Deduction ($)': parseFloat(emp.late_deduction_amount || 0).toFixed(2),
      'Absent Deduction ($)': parseFloat(emp.absent_deduction_amount || 0).toFixed(2),
      'Total Deductions ($)': parseFloat(emp.total_deductions || 0).toFixed(2),
      'Net Salary ($)': parseFloat(emp.net_salary || 0).toFixed(2),
      'Deduction %': emp.deduction_percentage + '%'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Salary Report');

    // Add summary sheet
    const summaryData = [
      { 'Metric': 'Total Employees', 'Value': summary.total_employees },
      { 'Metric': 'Total Base Salary', 'Value': `$${summary.total_base_salary}` },
      { 'Metric': 'Total Late Deductions', 'Value': `$${summary.total_late_deductions}` },
      { 'Metric': 'Total Absent Deductions', 'Value': `$${summary.total_absent_deductions}` },
      { 'Metric': 'Total Deductions', 'Value': `$${summary.total_deductions}` },
      { 'Metric': 'Total Net Salary', 'Value': `$${summary.total_net_salary}` },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    XLSX.writeFile(wb, `Salary_Report_${period.month || moment().format('YYYY-MM')}.xlsx`);
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: t('Report exported successfully!'),
      showConfirmButton: false,
      timer: 1500
    });
  };

  const columns = [
    {
      title: 'No',
      key: 'index',
      width: 50,
      render: (_, __, index) => index + 1,
      className: 'print-cell'
    },
    {
      title: t('Employee'),
      key: 'employee',
      width: 200,
      render: (_, record) => (
        <div>
          <Text strong style={{ display: 'block' }}>{record.employee_name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.position || '-'}</Text>
        </div>
      ),
      className: 'print-cell'
    },
    {
      title: t('Department'),
      dataIndex: 'department_name',
      key: 'department',
      width: 120,
      className: 'print-cell'
    },
    {
      title: t('Base Salary'),
      key: 'salary',
      width: 100,
      render: (_, record) => (
        <Text strong style={{ color: theme.primary }}>
          ${parseFloat(record.monthly_salary || 0).toLocaleString()}
        </Text>
      ),
      className: 'print-cell'
    },
    {
      title: t('Attendance'),
      key: 'attendance',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text style={{ fontSize: 12 }}>
            <CheckCircleOutlined style={{ color: theme.success, marginRight: 4 }} />
            On Time: {record.days_on_time}
          </Text>
          <Text style={{ fontSize: 12 }}>
            <WarningOutlined style={{ color: theme.warning, marginRight: 4 }} />
            Late (Grace): {record.days_late_grace}
          </Text>
          <Text style={{ fontSize: 12 }}>
            <WarningOutlined style={{ color: theme.danger, marginRight: 4 }} />
            Late (Penalty): {record.days_late_penalty}
          </Text>
          <Text style={{ fontSize: 12 }}>
            <CloseCircleOutlined style={{ color: theme.textSecondary, marginRight: 4 }} />
            Absent: {record.days_absent}
          </Text>
        </Space>
      ),
      className: 'print-cell-small'
    },
    {
      title: t('Deductions'),
      key: 'deductions',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text style={{ fontSize: 12, color: theme.danger }}>
            Late: -${parseFloat(record.late_deduction_amount || 0).toFixed(2)}
          </Text>
          <Text style={{ fontSize: 12, color: theme.danger }}>
            Absent: -${parseFloat(record.absent_deduction_amount || 0).toFixed(2)}
          </Text>
          <Divider style={{ margin: '4px 0' }} />
          <Text strong style={{ fontSize: 13, color: theme.danger }}>
            Total: -${parseFloat(record.total_deductions || 0).toFixed(2)}
          </Text>
        </Space>
      ),
      className: 'print-cell-small'
    },
    {
      title: t('Net Salary'),
      key: 'net_salary',
      width: 120,
      render: (_, record) => (
        <div>
          <Text strong style={{ fontSize: 16, color: theme.success, display: 'block' }}>
            ${parseFloat(record.net_salary || 0).toLocaleString()}
          </Text>
          <Tag color={parseFloat(record.deduction_percentage) > 10 ? 'red' : 'green'} style={{ marginTop: 4 }}>
            -{record.deduction_percentage}%
          </Tag>
        </div>
      ),
      className: 'print-cell'
    }
  ];

  return (
    <>
      <div className="salary-report-container" style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
        {/* Screen Controls (Hidden when printing) */}
        <div className="no-print" style={{ marginBottom: 24 }}>
          <Card>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} md={12}>
                <RangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  format="YYYY-MM-DD"
                  style={{ width: '100%' }}
                />
              </Col>
              <Col xs={24} md={12}>
                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={fetchSalaryReport}
                    loading={isLoading}
                  >
                    {t('Refresh')}
                  </Button>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleExportExcel}
                    style={{ background: theme.success, borderColor: theme.success }}
                  >
                    {t('Export Excel')}
                  </Button>
                  <Button
                    type="primary"
                    icon={<PrinterOutlined />}
                    onClick={handlePrint}
                  >
                    {t('Print')}
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        </div>

        {/* Printable Report */}
        <div className="print-content" style={{ background: 'white', padding: '40px' }}>
          {/* Report Header */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <Title level={2} style={{ margin: 0, color: theme.textPrimary }}>
              របាយការណ៍ប្រាក់ខែ និង ការកាត់ប្រាក់
            </Title>
            <Title level={3} style={{ margin: '8px 0', color: theme.primary }}>
              SALARY & DEDUCTION REPORT
            </Title>
            {period && (
              <Text style={{ fontSize: 16, color: theme.textSecondary }}>
                Period: {period.month} ({period.from_date} to {period.to_date})
              </Text>
            )}
            <Divider />
          </div>

          {/* Summary Statistics */}
          {summary && (
            <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
              <Col xs={24} sm={8}>
                <Card size="small">
                  <Statistic
                    title={<span><TeamOutlined /> {t('Total Employees')}</span>}
                    value={summary.total_employees}
                    valueStyle={{ color: theme.primary }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card size="small">
                  <Statistic
                    title={<span><DollarOutlined /> {t('Base Salary')}</span>}
                    value={parseFloat(summary.total_base_salary)}
                    prefix="$"
                    precision={2}
                    valueStyle={{ color: theme.success }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card size="small">
                  <Statistic
                    title={<span><WarningOutlined /> {t('Total Deductions')}</span>}
                    value={parseFloat(summary.total_deductions)}
                    prefix="-$"
                    precision={2}
                    valueStyle={{ color: theme.danger }}
                  />
                </Card>
              </Col>
            </Row>
          )}

          {/* Detailed Table */}
          <Table
            columns={columns}
            dataSource={report}
            loading={isLoading}
            rowKey={(record) => record.user_id}
            pagination={{
              pageSize: 50,
              showSizeChanger: false,
              className: 'no-print'
            }}
            size="small"
            bordered
            summary={() => summary && (
              <Table.Summary fixed>
                <Table.Summary.Row style={{ background: '#f0f9ff', fontWeight: 600 }}>
                  <Table.Summary.Cell index={0} colSpan={3}>
                    <Text strong style={{ fontSize: 14 }}>TOTAL</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <Text strong style={{ color: theme.primary }}>
                      ${parseFloat(summary.total_base_salary).toLocaleString()}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>-</Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>
                    <Text strong style={{ color: theme.danger }}>
                      -${parseFloat(summary.total_deductions).toLocaleString()}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4}>
                    <Text strong style={{ color: theme.success, fontSize: 16 }}>
                      ${parseFloat(summary.total_net_salary).toLocaleString()}
                    </Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />

          {/* Footer */}
          <div style={{ marginTop: 60, borderTop: `2px solid ${theme.borderColor}`, paddingTop: 20 }}>
            <Row gutter={[32, 32]}>
              <Col span={8} style={{ textAlign: 'center' }}>
                <div style={{ borderTop: `1px solid ${theme.borderColor}`, paddingTop: 10, marginTop: 40 }}>
                  <Text strong>Prepared By</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>HR Department</Text>
                </div>
              </Col>
              <Col span={8} style={{ textAlign: 'center' }}>
                <div style={{ borderTop: `1px solid ${theme.borderColor}`, paddingTop: 10, marginTop: 40 }}>
                  <Text strong>Reviewed By</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>Manager</Text>
                </div>
              </Col>
              <Col span={8} style={{ textAlign: 'center' }}>
                <div style={{ borderTop: `1px solid ${theme.borderColor}`, paddingTop: 10, marginTop: 40 }}>
                  <Text strong>Approved By</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>Director</Text>
                </div>
              </Col>
            </Row>
            <div style={{ textAlign: 'center', marginTop: 30 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Generated on: {moment().format('YYYY-MM-DD HH:mm:ss')} | Company Name © {moment().year()}
              </Text>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          
          .print-content, .print-content * {
            visibility: visible;
          }
          
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            padding: 20mm !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          .ant-table {
            font-size: 10px !important;
          }
          
          .ant-table-tbody > tr > td,
          .ant-table-thead > tr > th {
            padding: 8px 4px !important;
          }
          
          .print-cell {
            font-size: 10px !important;
          }
          
          .print-cell-small {
            font-size: 9px !important;
          }
          
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          
          /* Prevent page breaks inside table rows */
          .ant-table-tbody > tr {
            page-break-inside: avoid;
          }
        }
        
        /* Screen styles */
        .salary-report-container {
          min-height: 100vh;
        }
        
        .ant-table-thead > tr > th {
          background: #f0f9ff !important;
          font-weight: 600 !important;
        }
      `}</style>
    </>
  );
}

export default SalaryReport;