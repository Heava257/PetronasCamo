import React, { useEffect, useState, useRef } from "react";
import { Chart } from "react-google-charts";
import { request } from "../../util/helper";
import { Button, DatePicker, Flex, Select, Space, Table, Tag } from "antd";
import { PrinterOutlined, FilePdfOutlined } from '@ant-design/icons';
import dayjs from "dayjs";
import { configStore } from "../../store/configStore";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const options = {
  curveType: "function",
  legend: { position: "bottom" },
};

function ReportExpense_Summary() {
  const { config } = configStore();
  const [loading, setLoading] = useState(false);
  const reportRef = useRef(null);
  const [filter, setFilter] = useState({
    from_date: dayjs().subtract(29, "d"),
    to_date: dayjs(),
    expense_type_id: ""
  });
  const [state, setState] = useState({
    Data_Chat: [],
    list: [],
    expense_type: [],
    expense_type_id: ""
  });

  useEffect(() => {
    getList();
  }, []);

  const onreset = () => {
    setFilter({
      from_date: dayjs().subtract(29, "d"),
      to_date: dayjs(),
      expense_type_id: ""
    });
    getList({
      from_date: dayjs().subtract(29, "d").format("YYYY-MM-DD"),
      to_date: dayjs().format("YYYY-MM-DD"),
      expense_type_id: ""
    });
  };

  const getList = async (customFilter = null) => {
    try {
      setLoading(true);
      const param = customFilter || {
        from_date: dayjs(filter.from_date).format("YYYY-MM-DD"),
        to_date: dayjs(filter.to_date).format("YYYY-MM-DD"),
        expense_type_id: filter.expense_type_id,
      };
      const res = await request("report_Expense_Summary", "get", param);
      if (res) {
        const listTMP = [["Day", "Expense"]];
        res.list?.forEach((item) => {
          listTMP.push([item.title, Number(item.total_amount)]);
        });
        setState({
          Data_Chat: listTMP,
          list: res.list,
        });
      } else {
        setState({
          Data_Chat: [["Day", "Expense"]],
          list: [],
        });
      }
    } catch (error) {
      console.error("Failed to fetch expense summary:", error);
    } finally {
      setLoading(false);
    }
  };

  // Format number as currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(value);
  };

  // Handle print functionality
  const handlePrint = () => {
    window.print();
  };

  // Handle PDF download
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
      pdf.save(`Expense_Report_${dayjs().format('YYYY-MM-DD')}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <h1 style={{ marginRight: "20px", fontWeight: "bold" }}>Expense Performance Chart</h1>
        <Space>
          <Button 
            icon={<PrinterOutlined />} 
            onClick={handlePrint}
            loading={loading}
          >
            Print
          </Button>
          <Button 
            type="primary" 
            icon={<FilePdfOutlined />} 
            onClick={handleDownloadPDF}
            loading={loading}
          >
            Download PDF
          </Button>
        </Space>
      </div>

      <div style={{ display: "flex", color: "#333", marginBottom: "10px", marginRight: "10px" }}>
        <Space>
          <DatePicker.RangePicker
            value={[filter.from_date, filter.to_date]}
            loading={loading}
            allowClear={false}
            defaultValue={[
              dayjs(filter.from_date, "DD/MM/YYYY"),
              dayjs(filter.to_date, "DD/MM/YYYY")
            ]}
            format={"DD/MM/YYYY"}
            onChange={(value) => {
              setFilter((prev) => ({
                ...prev,
                from_date: value[0],
                to_date: value[1]
              }));
            }}
          />
          <Select
            allowClear
            style={{ width: 130 }}
            placeholder="Name"
            value={filter.expense_type_id}
            options={config.expense}
            onChange={(id) => {
              setFilter((pre) => ({ ...pre, expense_type_id: id }));
            }}
          />
          <Button onClick={onreset}>
            Reset Filters
          </Button>
          <Button type="primary" onClick={() => getList()} loading={loading}>
            Filter
          </Button>
        </Space>
      </div>

      <div ref={reportRef} className="report-content">
        <div className="report-header" style={{ textAlign: "center", marginBottom: "20px" }}>
          <h2>Expense Report</h2>
          <p>
            {dayjs(filter.from_date).format("MMM DD, YYYY")} - {dayjs(filter.to_date).format("MMM DD, YYYY")}
          </p>
        </div>

        {state.Data_Chat.length > 1 ? (
          <Chart
            chartType="LineChart"
            width="100%"
            height="400px"
            data={state.Data_Chat}
            options={{
              ...options,
              title: "Daily Expense Performance",
              hAxis: { title: "Date" },
              vAxis: { title: "Expense Amount ($)" },
              colors: ["#e57373"],
              chartArea: { width: "80%", height: "70%" }
            }}
            legendToggle
          />
        ) : (
          <div style={{ textAlign: "center", marginTop: "20px", color: "#888", height: "400px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            No data available for the selected filters.
          </div>
        )}

        <div style={{ width: "100%", marginTop: "20px" }}>
          <Table
            style={{
              width: "100%",
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
              padding: "10px",
              boxSizing: "border-box",
            }}
            
            loading={loading}
            dataSource={state.list}
            columns={[
              {
                key: "title",
                title: "Expense Date",
                dataIndex: "title",
                render: (value) => (
                  <Tag color="blue" style={{ fontSize: "14px" }}>
                    {value}
                  </Tag>
                ),
              },
              {
                key: "totalamount",
                title: "Total Amount",
                dataIndex: "total_amount",
                render: (value) => (
                  <div>
                    <Tag
                      color={Number(value) > 200 ? "blue" : Number(value) > 100 ? "green" : "pink"}
                      style={{ fontSize: "14px" }}
                    >
                      {formatCurrency(value)}
                    </Tag>
                  </div>
                ),
              },
            ]}
            pagination={false}
            summary={(pageData) => {
              let totalAmount = 0;

              pageData.forEach(({ total_amount }) => {
                totalAmount += Number(total_amount || 0);
              });

              return (
                <>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0}>
                      <strong>Total</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      <strong>{formatCurrency(totalAmount)}</strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </>
              );
            }}
          />
        </div>
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
      `}</style>
    </div>
  );
}

export default ReportExpense_Summary;