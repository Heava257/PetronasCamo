import React, { useEffect, useState } from "react";
import {
  Table,
  Input,
  Space,
  message,
  Button,
  Typography,
  Card,
  DatePicker,
  Statistic,
  Row,
  Col,
  Select,
  Tag,
  Divider
} from "antd";
import {
  FilterOutlined,
  FileExcelOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from "@ant-design/icons";
import MainPage from "../../component/layout/MainPage";
import { formatDateClient, formatPrice, request } from "../../util/helper";
import { useTranslation } from "../../locales/TranslationContext";
import dayjs from "dayjs";
import * as XLSX from "xlsx";

const { RangePicker } = DatePicker;
const { Option } = Select;

function PaymentHistoryPage() {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [summaryData, setSummaryData] = useState({
    totalAmount: 0,
    totalPaid: 0,
    totalRemaining: 0,
    paymentCount: 0
  });
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    fetchPaymentHistory();
    fetchCompanies();
  }, [dateRange, selectedCompany, selectedPaymentMethod]);

  const fetchCompanies = async () => {
    try {
      const res = await request("company-payments/summary/report", "get");
      if (res?.success) {
        setCompanies(res.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch companies:", error);
    }
  };

  const fetchPaymentHistory = async () => {
    setLoading(true);
    try {
      let queryParams = ["is_list_all=true"];

      if (dateRange && dateRange[0] && dateRange[1]) {
        const fromDate = dayjs(dateRange[0]).format("YYYY-MM-DD");
        const toDate = dayjs(dateRange[1]).format("YYYY-MM-DD");
        queryParams.push(`from_date=${fromDate}`);
        queryParams.push(`to_date=${toDate}`);
      }

      if (selectedCompany) {
        queryParams.push(`company_name=${encodeURIComponent(selectedCompany)}`);
      }

      if (selectedPaymentMethod) {
        queryParams.push(`payment_method=${selectedPaymentMethod}`);
      }

      if (searchText) {
        queryParams.push(`txt_search=${encodeURIComponent(searchText)}`);
      }

      const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
      const res = await request(`company-payments${queryString}`, "get");

      if (res?.success) {
        // Fetch details for each payment
        const paymentsWithDetails = await Promise.all(
          (res.data || []).map(async (payment) => {
            try {
              const detailRes = await request(`company-payments/${payment.id}`, "get");
              return {
                ...payment,
                details: detailRes?.success ? detailRes.data.details : []
              };
            } catch {
              return { ...payment, details: [] };
            }
          })
        );

        setData(paymentsWithDetails);

        if (res.summary) {
          setSummaryData({
            totalAmount: parseFloat(res.summary.totalAmount || 0),
            totalPaid: parseFloat(res.summary.totalPaid || 0),
            totalRemaining: parseFloat(res.summary.totalRemaining || 0),
            paymentCount: parseInt(res.summary.paymentCount || 0)
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch payment history:", error);
      message.error("Failed to load payment history");
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = () => {
    // Prepare data grouped by date and company similar to the image
    const workbookData = [];

    // Group payments by date
    const groupedByDate = {};
    data.forEach(payment => {
      const date = dayjs(payment.payment_date).format("DD-MM-YY");
      if (!groupedByDate[date]) {
        groupedByDate[date] = [];
      }
      groupedByDate[date].push(payment);
    });

    // Header row
    workbookData.push({
      "កាលបរិច្ឆេទ": "កាលបរិច្ឆេទ",
      "លេខវិក័យប័ត្រ": "លេខវិក័យប័ត្រ",
      "ក្រុមហ៊ុន": "ក្រុមហ៊ុន",
      "ប្រភេទសាំង (Extra)": "Extra",
      "ប្រភេទសាំង (Diesel)": "Diesel",
      "តម្លៃសាំងលីត្រ": "លីត្រ",
      "លីត្រ": "លីត្រ",
      "ចំនួនទឹកប្រាក់": "ចំនួនទឹកប្រាក់",
      "ការបង់ប្រាក់": "ការបង់ប្រាក់",
      "កាលបរិច្ឆេទបង់": "កាលបរិច្ឆេទបង់",
      "ចំនួនដែលបានបង់": "ចំនួនដែលបានបង់",
      "សមតុល្យ": "សមតុល្យ"
    });

    // Data rows
    Object.keys(groupedByDate).sort().forEach(date => {
      const payments = groupedByDate[date];
      
      payments.forEach((payment, index) => {
        const details = payment.details || [];
        
        if (details.length === 0) {
          // No details, show payment summary
          workbookData.push({
            "កាលបរិច្ឆេទ": index === 0 ? date : "",
            "លេខវិក័យប័ត្រ": payment.payment_number || "",
            "ក្រុមហ៊ុន": payment.company_name || "",
            "ប្រភេទសាំង (Extra)": "",
            "ប្រភេទសាំង (Diesel)": "",
            "តម្លៃសាំងលីត្រ": "",
            "លីត្រ": "",
            "ចំនួនទឹកប្រាក់": parseFloat(payment.total_amount || 0).toFixed(2),
            "ការបង់ប្រាក់": payment.reference_number || "",
            "កាលបរិច្ឆេទបង់": payment.paid_amount > 0 ? dayjs(payment.payment_date).format("DD-MM-YYYY") : "",
            "ចំនួនដែលបានបង់": parseFloat(payment.paid_amount || 0).toFixed(2),
            "សមតុល្យ": parseFloat(payment.remaining_balance || 0).toFixed(2)
          });
        } else {
          // Show each detail row
          details.forEach((detail, detailIndex) => {
            const isExtra = detail.category_name?.toLowerCase().includes('extra');
            const isDiesel = detail.category_name?.toLowerCase().includes('diesel');
            
            workbookData.push({
              "កាលបរិច្ឆេទ": index === 0 && detailIndex === 0 ? date : "",
              "លេខវិក័យប័ត្រ": detailIndex === 0 ? payment.payment_number : "",
              "ក្រុមហ៊ុន": detailIndex === 0 ? payment.company_name : "",
              "ប្រភេទសាំង (Extra)": isExtra ? parseFloat(detail.qty || 0).toFixed(2) : "",
              "ប្រភេទសាំង (Diesel)": isDiesel ? parseFloat(detail.qty || 0).toFixed(2) : "",
              "តម្លៃសាំងលីត្រ": parseFloat(detail.unit_price || 0).toFixed(2),
              "លីត្រ": parseFloat(detail.qty || 0).toFixed(2),
              "ចំនួនទឹកប្រាក់": parseFloat(detail.total_price || 0).toFixed(2),
              "ការបង់ប្រាក់": detailIndex === details.length - 1 ? payment.reference_number || "" : "",
              "កាលបរិច្ឆេទបង់": detailIndex === details.length - 1 && payment.paid_amount > 0 ? dayjs(payment.payment_date).format("DD-MM-YYYY") : "",
              "ចំនួនដែលបានបង់": detailIndex === details.length - 1 ? parseFloat(payment.paid_amount || 0).toFixed(2) : "",
              "សមតុល្យ": detailIndex === details.length - 1 ? parseFloat(payment.remaining_balance || 0).toFixed(2) : ""
            });
          });
        }
      });

      // Add empty row between dates
      workbookData.push({});
    });

    // Summary section
    workbookData.push({});
    workbookData.push({
      "កាលបរិច្ឆេទ": "សរុបទឹកប្រាក់ប្រចាំថ្ងៃ",
      "លេខវិក័យប័ត្រ": "",
      "ក្រុមហ៊ុន": "",
      "ប្រភេទសាំង (Extra)": "",
      "ប្រភេទសាំង (Diesel)": "",
      "តម្លៃសាំងលីត្រ": "",
      "លីត្រ": "",
      "ចំនួនទឹកប្រាក់": "",
      "ការបង់ប្រាក់": "",
      "កាលបរិច្ឆេទបង់": "សរុបសង្គ្រោះប្រចាំថ្ងៃ",
      "ចំនួនដែលបានបង់": "",
      "សមតុល្យ": ""
    });

    // Calculate totals
    const extraTotal = data.reduce((sum, p) => {
      const extraDetails = (p.details || []).filter(d => 
        d.category_name?.toLowerCase().includes('extra')
      );
      return sum + extraDetails.reduce((s, d) => s + parseFloat(d.qty || 0), 0);
    }, 0);

    const dieselTotal = data.reduce((sum, p) => {
      const dieselDetails = (p.details || []).filter(d => 
        d.category_name?.toLowerCase().includes('diesel')
      );
      return sum + dieselDetails.reduce((s, d) => s + parseFloat(d.qty || 0), 0);
    }, 0);

    workbookData.push({
      "កាលបរិច្ឆេទ": "",
      "លេខវិក័យប័ត្រ": "",
      "ក្រុមហ៊ុន": "Extra",
      "ប្រភេទសាំង (Extra)": extraTotal.toFixed(2),
      "ប្រភេទសាំង (Diesel)": "",
      "តម្លៃសាំងលីត្រ": summaryData.totalAmount.toFixed(2),
      "លីត្រ": "",
      "ចំនួនទឹកប្រាក់": "",
      "ការបង់ប្រាក់": "",
      "កាលបរិច្ឆេទបង់": "",
      "ចំនួនដែលបានបង់": summaryData.totalPaid.toFixed(2),
      "សមតុល្យ": ""
    });

    workbookData.push({
      "កាលបរិច្ឆេទ": "",
      "លេខវិក័យប័ត្រ": "",
      "ក្រុមហ៊ុន": "Diesel",
      "ប្រភេទសាំង (Extra)": "",
      "ប្រភេទសាំង (Diesel)": dieselTotal.toFixed(2),
      "តម្លៃសាំងលីត្រ": summaryData.totalAmount.toFixed(2),
      "លីត្រ": "",
      "ចំនួនទឹកប្រាក់": "",
      "ការបង់ប្រាក់": "",
      "កាលបរិច្ឆេទបង់": "",
      "ចំនួនដែលបានបង់": "",
      "សមតុល្យ": ""
    });

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(workbookData, { skipHeader: true });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payment History");

    // Set column widths
    ws['!cols'] = [
      { width: 12 },  // Date
      { width: 12 },  // Invoice
      { width: 20 },  // Company
      { width: 12 },  // Extra
      { width: 12 },  // Diesel
      { width: 12 },  // Price
      { width: 10 },  // Liters
      { width: 12 },  // Amount
      { width: 20 },  // Payment ref
      { width: 15 },  // Payment date
      { width: 12 },  // Paid amount
      { width: 12 }   // Balance
    ];

    const fileName = `PaymentHistory_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`;
    XLSX.writeFile(wb, fileName);
    message.success("Exported to Excel successfully!");
  };

  const handleClearFilters = () => {
    setDateRange([null, null]);
    setSearchText("");
    setSelectedCompany(null);
    setSelectedPaymentMethod(null);
  };

  // Prepare expandable rows
  const expandedRowRender = (record) => {
    if (!record.details || record.details.length === 0) {
      return <div style={{ padding: 16 }}>No payment details available</div>;
    }

    const detailColumns = [
      {
        title: "Category",
        dataIndex: "category_name",
        key: "category",
      },
      {
        title: "Description",
        dataIndex: "description",
        key: "description",
      },
      {
        title: "Quantity",
        key: "qty",
        render: (_, detail) => `${detail.qty} ${detail.unit || ""}`,
      },
      {
        title: "Unit Price",
        dataIndex: "unit_price",
        key: "unit_price",
        render: (price) => formatPrice(price),
      },
      {
        title: "Total",
        dataIndex: "total_price",
        key: "total_price",
        render: (price) => formatPrice(price),
      },
      {
        title: "Status",
        dataIndex: "is_completed",
        key: "status",
        render: (completed) => (
          <Tag color={completed ? "success" : "warning"} icon={completed ? <CheckCircleOutlined /> : <ClockCircleOutlined />}>
            {completed ? "Completed" : "Pending"}
          </Tag>
        ),
      },
    ];

    return (
      <Table
        columns={detailColumns}
        dataSource={record.details}
        pagination={false}
        size="small"
        rowKey="id"
      />
    );
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "payment_date",
      key: "date",
      render: (date) => formatDateClient(date, "DD/MM/YYYY"),
      width: 100,
    },
    {
      title: "Payment #",
      dataIndex: "payment_number",
      key: "payment_number",
      width: 120,
    },
    {
      title: "Company",
      dataIndex: "company_name",
      key: "company",
      width: 150,
    },
    {
      title: "Total Amount",
      dataIndex: "total_amount",
      key: "total",
      render: (amount) => (
        <span style={{ color: '#f5222d', fontWeight: 600 }}>
          {formatPrice(amount)}
        </span>
      ),
      width: 120,
    },
    {
      title: "Paid",
      dataIndex: "paid_amount",
      key: "paid",
      render: (amount) => (
        <span style={{ color: '#52c41a', fontWeight: 600 }}>
          {formatPrice(amount)}
        </span>
      ),
      width: 120,
    },
    {
      title: "Remaining",
      dataIndex: "remaining_balance",
      key: "remaining",
      render: (amount) => (
        <span style={{ 
          color: amount > 0 ? '#faad14' : '#52c41a', 
          fontWeight: 600 
        }}>
          {formatPrice(amount)}
        </span>
      ),
      width: 120,
    },
    {
      title: "Method",
      dataIndex: "payment_method",
      key: "method",
      render: (method) => (
        <Tag color="blue">{method?.toUpperCase()}</Tag>
      ),
      width: 100,
    },
    {
      title: "Items",
      dataIndex: "item_count",
      key: "items",
      render: (count) => <Tag>{count || 0}</Tag>,
      width: 80,
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => {
        const isPaid = record.remaining_balance <= 0;
        return (
          <Tag 
            color={isPaid ? "success" : "warning"}
            icon={isPaid ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
          >
            {isPaid ? "Fully Paid" : "Pending"}
          </Tag>
        );
      },
      width: 120,
    },
  ];

  return (
    <MainPage loading={loading}>
      <div className="px-2 sm:px-4 lg:px-6">
        <Card>
          {/* Header */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-4">
              <Typography.Title level={4} className="m-0">
                <DollarOutlined className="mr-2" />
                Payment History to Companies
              </Typography.Title>
              <Button
                icon={<FileExcelOutlined />}
                onClick={handleExportToExcel}
                type="primary"
              >
                Export to Excel
              </Button>
            </div>

            {/* Filters */}
            <Space wrap>
              <Input.Search
                placeholder="Search..."
                allowClear
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onSearch={fetchPaymentHistory}
                style={{ width: 200 }}
              />

              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                format="DD/MM/YYYY"
                placeholder={["From Date", "To Date"]}
              />

              <Select
                placeholder="Select Company"
                allowClear
                style={{ width: 200 }}
                value={selectedCompany}
                onChange={setSelectedCompany}
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
              >
                {companies.map(company => (
                  <Option key={company.company_name} value={company.company_name}>
                    {company.company_name}
                  </Option>
                ))}
              </Select>

              <Select
                placeholder="Payment Method"
                allowClear
                style={{ width: 150 }}
                value={selectedPaymentMethod}
                onChange={setSelectedPaymentMethod}
              >
                <Option value="cash">Cash</Option>
                <Option value="bank_transfer">Bank Transfer</Option>
                <Option value="aba">ABA</Option>
                <Option value="acleda">ACLEDA</Option>
                <Option value="wing">Wing</Option>
                <Option value="other">Other</Option>
              </Select>

              <Button onClick={handleClearFilters} icon={<FilterOutlined />}>
                Clear Filters
              </Button>
            </Space>
          </div>

          {/* Summary Cards */}
          <Card className="mb-4" style={{ background: '#f0f2f5' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Total Payments"
                  value={summaryData.paymentCount}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Total Amount"
                  value={summaryData.totalAmount}
                  precision={2}
                  prefix="$"
                  valueStyle={{ color: '#f5222d', fontWeight: 600 }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Total Paid"
                  value={summaryData.totalPaid}
                  precision={2}
                  prefix="$"
                  valueStyle={{ color: '#52c41a', fontWeight: 600 }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Total Remaining"
                  value={summaryData.totalRemaining}
                  precision={2}
                  prefix="$"
                  valueStyle={{ 
                    color: summaryData.totalRemaining > 0 ? '#faad14' : '#52c41a',
                    fontWeight: 600
                  }}
                />
              </Col>
            </Row>
          </Card>

          <Divider />

          {/* Table with Expandable Rows */}
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            loading={loading}
            expandable={{
              expandedRowRender,
              rowExpandable: (record) => record.details && record.details.length > 0,
            }}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} payments`,
            }}
            scroll={{ x: 1200 }}
          />
        </Card>
      </div>
    </MainPage>
  );
}

export default PaymentHistoryPage;