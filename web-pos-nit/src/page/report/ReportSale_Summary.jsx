import React, { useEffect, useState, useRef } from "react";
import { Chart } from "react-google-charts";
import { request } from "../../util/helper";
import { Button, DatePicker, Select, Space, Table, Tag, Card } from "antd";
import { PrinterOutlined, FilePdfOutlined, LineChartOutlined } from '@ant-design/icons';
import dayjs from "dayjs";
import { configStore } from "../../store/configStore";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const options = {
  curveType: "function",
  legend: { position: "bottom" },
};

function ReportSale_Summary() {
  const { config } = configStore();
  const [loading, setLoading] = useState(false);
  const reportRef = useRef(null);
  const [filter, setFilter] = useState({
    from_date: dayjs().subtract(29, "d"),
    to_date: dayjs(),
    category_id: null,
    brand_id: null
  });
  const [state, setState] = useState({
    Data_Chat: [],
    list: [],
  });

  useEffect(() => {
    getList();
  }, []);

  const onreset = () => {
    setFilter({
      from_date: dayjs().subtract(29, "d"),
      to_date: dayjs(),
      category_id: null,
      brand_id: null,
    });
    getList({
      from_date: dayjs().subtract(29, "d").format("YYYY-MM-DD"),
      to_date: dayjs().format("YYYY-MM-DD"),
      category_id: null,
      brand_id: null,
    });
  };

  const getList = async (customFilter = null) => {
    try {
      setLoading(true);
      const param = customFilter || {
        from_date: dayjs(filter.from_date).format("YYYY-MM-DD"),
        to_date: dayjs(filter.to_date).format("YYYY-MM-DD"),
        category_id: filter.category_id,
        brand_id: filter.brand_id,
      };
      const res = await request("report_Sale_Sammary", "get", param);
      if (res) {
        const listTMP = [["Day", "Sale"]];
        res.list?.forEach((item) => {
          listTMP.push([item.order_date, Number(item.total_amount)]);
        });
        setState({
          Data_Chat: listTMP,
          list: res.list,
        });
      } else {
        setState({
          Data_Chat: [["Day", "Sale"]],
          list: [],
        });
      }
    } catch (error) {
      console.error("Failed to fetch sales summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(value);
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
      pdf.save(`Sales_Report_${dayjs().format('YYYY-MM-DD')}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  // Calculate summary statistics
  const calculateStats = () => {
    const totalAmount = state.list.reduce((sum, item) => sum + Number(item.total_amount || 0), 0);
    const totalQty = state.list.reduce((sum, item) => sum + Number(item.total_qty || 0), 0);
    const avgDaily = state.list.length > 0 ? totalAmount / state.list.length : 0;
    
    return { totalAmount, totalQty, avgDaily };
  };

  const stats = calculateStats();

  return (
    <div style={{ padding: "24px", background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)", minHeight: "100vh" }}>
      {/* Header Section */}
      <Card 
        style={{ 
          marginBottom: "24px", 
          borderRadius: "16px",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        }}
        bodyStyle={{ padding: "24px" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ 
              margin: 0, 
              fontWeight: "700", 
              fontSize: "28px",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              gap: "12px"
            }}>
              <LineChartOutlined /> Sales Performance Dashboard
            </h1>
            <p style={{ margin: "8px 0 0 0", color: "rgba(255, 255, 255, 0.9)", fontSize: "14px" }}>
              Track and analyze your sales performance
            </p>
          </div>
          <Space size="middle">
            <Button 
              icon={<PrinterOutlined />} 
              onClick={handlePrint}
              loading={loading}
              size="large"
              style={{ 
                borderRadius: "8px",
                height: "40px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
              }}
            >
              Print
            </Button>
            <Button 
              type="primary" 
              icon={<FilePdfOutlined />} 
              onClick={handleDownloadPDF}
              loading={loading}
              size="large"
              style={{ 
                borderRadius: "8px",
                height: "40px",
                background: "#f59e0b",
                borderColor: "#f59e0b",
                boxShadow: "0 4px 12px rgba(245, 158, 11, 0.4)"
              }}
            >
              Download PDF
            </Button>
          </Space>
        </div>
      </Card>

      {/* Filter Section */}
      <Card 
        style={{ 
          marginBottom: "24px", 
          borderRadius: "16px",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)"
        }}
        bodyStyle={{ padding: "20px" }}
      >
        <Space wrap size="middle">
          <DatePicker.RangePicker
            value={[filter.from_date, filter.to_date]}
            loading={loading}
            allowClear={false}
            format={"DD/MM/YYYY"}
            onChange={(value) => {
              setFilter((prev) => ({
                ...prev,
                from_date: value[0],
                to_date: value[1]
              }));
            }}
            size="large"
            style={{ borderRadius: "8px" }}
          />
          <Select
            allowClear
            placeholder="Select Category"
            value={filter.category_id}
            options={config?.category}
            onChange={(value) => {
              setFilter((prev) => ({
                ...prev,
                category_id: value
              }));
            }}
            size="large"
            style={{ width: 200, borderRadius: "8px" }}
          />
          <Select
            allowClear
            placeholder="Select Brand"
            value={filter.brand_id}
            options={config?.brand}
            onChange={(value) => {
              setFilter((prev) => ({
                ...prev,
                brand_id: value
              }));
            }}
            size="large"
            style={{ width: 200, borderRadius: "8px" }}
          />
          <Button 
            onClick={onreset}
            size="large"
            style={{ borderRadius: "8px" }}
          >
            Reset
          </Button>
          <Button 
            type="primary" 
            onClick={() => getList()} 
            loading={loading}
            size="large"
            style={{ borderRadius: "8px" }}
          >
            Apply Filters
          </Button>
        </Space>
      </Card>

      {/* Statistics Cards */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
        gap: "20px",
        marginBottom: "24px"
      }}>
        <Card 
          style={{ 
            borderRadius: "16px",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          }}
        >
          <div style={{ color: "#ffffff" }}>
            <p style={{ margin: 0, fontSize: "14px", opacity: 0.9 }}>Total Revenue</p>
            <h2 style={{ margin: "8px 0 0 0", fontSize: "32px", fontWeight: "700" }}>
              {formatCurrency(stats.totalAmount)}
            </h2>
          </div>
        </Card>
        
        <Card 
          style={{ 
            borderRadius: "16px",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
            background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
          }}
        >
          <div style={{ color: "#ffffff" }}>
            <p style={{ margin: 0, fontSize: "14px", opacity: 0.9 }}>Total Quantity</p>
            <h2 style={{ margin: "8px 0 0 0", fontSize: "32px", fontWeight: "700" }}>
              {stats.totalQty.toLocaleString()} L
            </h2>
          </div>
        </Card>
        
        <Card 
          style={{ 
            borderRadius: "16px",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
            background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
          }}
        >
          <div style={{ color: "#ffffff" }}>
            <p style={{ margin: 0, fontSize: "14px", opacity: 0.9 }}>Daily Average</p>
            <h2 style={{ margin: "8px 0 0 0", fontSize: "32px", fontWeight: "700" }}>
              {formatCurrency(stats.avgDaily)}
            </h2>
          </div>
        </Card>
      </div>

      {/* Report Content */}
      <div ref={reportRef}>
        <Card 
          style={{ 
            marginBottom: "24px", 
            borderRadius: "16px",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)"
          }}
          bodyStyle={{ padding: "32px" }}
        >
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#1f2937", margin: 0 }}>
              Sales Performance Chart
            </h2>
            <p style={{ color: "#6b7280", marginTop: "8px", fontSize: "14px" }}>
              {dayjs(filter.from_date).format("MMM DD, YYYY")} - {dayjs(filter.to_date).format("MMM DD, YYYY")}
            </p>
          </div>

          {state.Data_Chat.length > 1 ? (
            <div style={{ 
              background: "#ffffff",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.06)"
            }}>
              <Chart
                chartType="LineChart"
                width="100%"
                height="450px"
                data={state.Data_Chat}
                options={{
                  curveType: "function",
                  legend: { 
                    position: "bottom",
                    textStyle: { fontSize: 13, color: "#4b5563" }
                  },
                  title: "",
                  hAxis: { 
                    title: "Date",
                    titleTextStyle: { fontSize: 14, bold: true, color: "#374151" },
                    textStyle: { fontSize: 12, color: "#6b7280" },
                    gridlines: { color: "#f3f4f6" }
                  },
                  vAxis: { 
                    title: "Sales Amount ($)",
                    titleTextStyle: { fontSize: 14, bold: true, color: "#374151" },
                    textStyle: { fontSize: 12, color: "#6b7280" },
                    gridlines: { color: "#f3f4f6" },
                    format: "currency"
                  },
                  colors: ["#667eea"],
                  chartArea: { width: "85%", height: "70%" },
                  lineWidth: 3,
                  pointSize: 6,
                  pointShape: "circle",
                  backgroundColor: { fill: "transparent" },
                  series: {
                    0: { 
                      areaOpacity: 0.1,
                      lineWidth: 3
                    }
                  }
                }}
                legendToggle
              />
            </div>
          ) : (
            <div style={{ 
              textAlign: "center", 
              padding: "80px 20px",
              color: "#9ca3af",
              background: "#f9fafb",
              borderRadius: "12px"
            }}>
              <LineChartOutlined style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.5 }} />
              <p style={{ fontSize: "16px", margin: 0 }}>No data available for the selected filters.</p>
            </div>
          )}
        </Card>

        {/* Table Section */}
        <Card 
          style={{ 
            borderRadius: "16px",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)"
          }}
          bodyStyle={{ padding: "24px" }}
        >
          <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#1f2937", marginBottom: "20px" }}>
            Detailed Sales Data
          </h3>
          
          <Table
            loading={loading}
            dataSource={state.list}
            columns={[
              {
                key: "title",
                title: "Order Date",
                dataIndex: "order_date",
                render: (value) => (
                  <Tag color="blue" style={{ fontSize: "14px", padding: "4px 12px", borderRadius: "6px" }}>
                    {value}
                  </Tag>
                ),
              },
              {
                key: "totalqty",
                title: "Total QTY",
                dataIndex: "total_qty",
                render: (value) => (
                  <Tag
                    color={Number(value) > 2 ? "blue" : Number(value) > 1 ? "green" : "pink"}
                    style={{ fontSize: "14px", padding: "4px 12px", borderRadius: "6px" }}
                  >
                    {Number(value).toLocaleString()} Liter
                  </Tag>
                ),
              },
              {
                key: "totalamount",
                title: "Total Amount",
                dataIndex: "total_amount",
                render: (value) => (
                  <Tag
                    color={Number(value) > 200 ? "blue" : Number(value) > 100 ? "green" : "pink"}
                    style={{ fontSize: "14px", padding: "4px 12px", borderRadius: "6px" }}
                  >
                    {formatCurrency(value)}
                  </Tag>
                ),
              },
            ]}
            pagination={false}
            summary={(pageData) => {
              let totalQty = 0;
              let totalAmount = 0;

              pageData.forEach(({ total_qty, total_amount }) => {
                totalQty += Number(total_qty || 0);
                totalAmount += Number(total_amount || 0);
              });

              return (
                <>
                  <Table.Summary.Row style={{ background: "#f9fafb" }}>
                    <Table.Summary.Cell index={0}>
                      <strong style={{ fontSize: "15px" }}>Total</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      <strong style={{ fontSize: "15px" }}>{totalQty.toLocaleString()} Liter</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2}>
                      <strong style={{ fontSize: "15px" }}>{formatCurrency(totalAmount)}</strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </>
              );
            }}
          />
        </Card>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .report-content, .report-content * {
            visibility: visible;
          }
          .report-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .ant-tag {
            border: 1px solid #d9d9d9 !important;
            padding: 4px 8px !important;
          }
        }
        
        .ant-table {
          border-radius: 12px !important;
          overflow: hidden;
        }
        
        .ant-table-thead > tr > th {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          color: #ffffff !important;
          font-weight: 600 !important;
          border: none !important;
        }
        
        .ant-table-tbody > tr:hover > td {
          background: #f3f4f6 !important;
        }
      `}</style>
    </div>
  );
}

export default ReportSale_Summary;