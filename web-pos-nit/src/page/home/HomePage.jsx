// import { useEffect, useState } from "react";
// import { request } from "../../util/helper";
// import HomeGrid from "../../component/home/HomeGrid";
// import HomeSaleChart from "../../component/home/HomeSaleChart";
// import HomePurchaseChart from "../../component/home/HomePurchaseChart";
// import { useNavigate } from "react-router-dom";
// function HomePage() {
//   const [dashboard, setDashboard] = useState([]);
//   const [saleBymonth, setSalebyMonth] = useState([]);
//   const [expenseBymonth, setExpensByMonth] = useState([]);
//   const navigate = useNavigate();
//   useEffect(() => {
//         getList();
//   }, []);
//   const getList = async () => {
//     const res = await request("dashbaord", "get");
//     if (res && !res.error) {
//       setDashboard(res.dashboard);
//       if (res.Sale_Summary_By_Month) {
//         let dataTmp = [["Month", "Sale"]];
//         res.Sale_Summary_By_Month.forEach((item) => {
//           dataTmp.push([item.title + "", Number(item.total) || 0]);
//         });
//         setSalebyMonth(dataTmp);
//       }
//       if (res.Expense_Summary_By_Month) {
//         let dataTmp = [["Month", "Sale"]];

//         res.Expense_Summary_By_Month.forEach((item) => {
//           dataTmp.push([item.title + "", Number(item.total) || 0]);
//         });
//         setExpensByMonth(dataTmp);
//       }
//     }
//   };
//   return (
//     <div className="home-page">
//       <div className="home-header">
//         {/* You can add content here for the header or any other section */}
//         <HomeGrid data={dashboard} />
//       </div>

//       <div className="sale-chart-section">
//         <HomeSaleChart data={saleBymonth} className="custom-sale-chart" />
//       </div>

//       <div className="purchase-chart-section">
//         <HomePurchaseChart data={expenseBymonth} className="custom-purchase-chart" />
//       </div>
//     </div>
//   );

// }
// export default HomePage;



// import { useEffect, useState, useRef } from "react";
// import { request } from "../../util/helper";
// import HomeGrid from "../../component/home/HomeGrid";
// import HomeSaleChart from "../../component/home/HomeSaleChart";
// import HomePurchaseChart from "../../component/home/HomePurchaseChart";
// import { useNavigate } from "react-router-dom";

// function HomePage() {
//   const [dashboard, setDashboard] = useState([]);
//   const [saleBymonth, setSalebyMonth] = useState([]);
//   const [expenseBymonth, setExpensByMonth] = useState([]);
//   const navigate = useNavigate();
//   const dashboardRef = useRef(null);
//   const [isLoading, setIsLoading] = useState(false);

//   useEffect(() => {
//     getList();
//   }, []);

//   const getList = async () => {
//     setIsLoading(true);
//     try {
//       const res = await request("dashbaord", "get");
//       if (res && !res.error) {
//         setDashboard(res.dashboard);
//         if (res.Sale_Summary_By_Month) {
//           let dataTmp = [["Month", "Sale"]];
//           res.Sale_Summary_By_Month.forEach((item) => {
//             dataTmp.push([item.title + "", Number(item.total) || 0]);
//           });
//           setSalebyMonth(dataTmp);
//         }
//         if (res.Expense_Summary_By_Month) {
//           let dataTmp = [["Month", "Sale"]];
//           res.Expense_Summary_By_Month.forEach((item) => {
//             dataTmp.push([item.title + "", Number(item.total) || 0]);
//           });
//           setExpensByMonth(dataTmp);
//         }
//       }
//     } catch (error) {
//       console.error("Error fetching dashboard data:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handlePrint = () => {
//     const dashboardContent = dashboardRef.current;
//     const printWindow = window.open('', '_blank');

//     printWindow.document.write(`
//       <html>
//         <head>
//           <title>Dashboard Report</title>
//           <style>
//             body {
//               font-family: Arial, sans-serif;
//               padding: 20px;
//             }
//             .dashboard-title {
//               text-align: center;
//               margin-bottom: 20px;
//             }
//             .print-container {
//               width: 100%;
//             }
//             .chart-section {
//               page-break-inside: avoid;
//               margin-bottom: 30px;
//             }
//             @media print {
//               button {
//                 display: none;
//               }
//             }
//           </style>
//         </head>
//         <body>
//           <div class="print-container">
//             <h1 class="dashboard-title">Dashboard Report</h1>
//             ${dashboardContent.innerHTML}
//           </div>
//           <script>
//             window.onload = function() {
//               setTimeout(function() {
//                 window.print();
//                 window.close();
//               }, 500);
//             }
//           </script>
//         </body>
//       </html>
//     `);
//   };

//   const handleDownloadPDF = async () => {
//     try {
//       setIsLoading(true);

//       // You would typically use a library like jsPDF or html2pdf here
//       // This is a simplified example
//       const { jsPDF } = await import('jspdf');
//       const { default: html2canvas } = await import('html2canvas');

//       const dashboardContent = dashboardRef.current;
//       const canvas = await html2canvas(dashboardContent);
//       const imgData = canvas.toDataURL('image/png');

//       const pdf = new jsPDF('p', 'mm', 'a4');
//       const pdfWidth = pdf.internal.pageSize.getWidth();
//       const pdfHeight = pdf.internal.pageSize.getHeight();
//       const imgWidth = canvas.width;
//       const imgHeight = canvas.height;
//       const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
//       const imgX = (pdfWidth - imgWidth * ratio) / 2;

//       pdf.addImage(imgData, 'PNG', imgX, 20, imgWidth * ratio, imgHeight * ratio);
//       pdf.save('dashboard-report.pdf');
//     } catch (error) {
//       console.error("Error generating PDF:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleDownloadCSV = () => {
//     // Create CSV for sale data
//     let saleCSV = "Month,Sale\n";
//     saleBymonth.slice(1).forEach(row => {
//       saleCSV += `${row[0]},${row[1]}\n`;
//     });

//     // Create CSV for expense data
//     let expenseCSV = "Month,Expense\n";
//     expenseBymonth.slice(1).forEach(row => {
//       expenseCSV += `${row[0]},${row[1]}\n`;
//     });

//     // Combine into one CSV file
//     const combinedCSV = "Sales Data\n" + saleCSV + "\nExpense Data\n" + expenseCSV;

//     // Create download link
//     const blob = new Blob([combinedCSV], { type: 'text/csv;charset=utf-8;' });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement("a");
//     link.setAttribute("href", url);
//     link.setAttribute("download", "dashboard-data.csv");
//     link.style.visibility = 'hidden';
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   return (
//     <div className="home-page">
//       <div className="dashboard-controls">
//         <h1>Dashboard</h1>
//         <div className="dashboard-actions">
//           <button 
//             className="action-button print-button" 
//             onClick={handlePrint}
//             disabled={isLoading}
//           >
//             <span className="icon">🖨️</span> Print Dashboard
//           </button>
//           <button 
//             className="action-button download-pdf-button" 
//             onClick={handleDownloadPDF}
//             disabled={isLoading}
//           >
//             <span className="icon">📄</span> Download PDF
//           </button>
//           <button 
//             className="action-button download-csv-button" 
//             onClick={handleDownloadCSV}
//             disabled={isLoading}
//           >
//             <span className="icon">📊</span> Download CSV
//           </button>
//         </div>
//       </div>

//       {isLoading ? (
//         <div className="loading-indicator">Loading dashboard data...</div>
//       ) : (
//         <div className="dashboard-content" ref={dashboardRef}>
//           <div className="home-header">
//             <HomeGrid data={dashboard} />
//           </div>

//           <div className="sale-chart-section">
//             <h2>Sales Summary</h2>
//             <HomeSaleChart data={saleBymonth} className="custom-sale-chart" />
//           </div>

//           <div className="purchase-chart-section">
//             <h2>Expense Summary</h2>
//             <HomePurchaseChart data={expenseBymonth} className="custom-purchase-chart" />
//           </div>
//         </div>
//       )}

//       <style jsx>{`
//         .home-page {
//           padding: 20px;
//           background-color: #f5f5f5;
//           min-height: 100vh;
//         }

//         .dashboard-controls {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           margin-bottom: 20px;
//           background-color: white;
//           padding: 15px;
//           border-radius: 8px;
//           box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
//         }

//         .dashboard-actions {
//           display: flex;
//           gap: 10px;
//         }

//         .action-button {
//           padding: 8px 16px;
//           border: none;
//           border-radius: 4px;
//           cursor: pointer;
//           display: flex;
//           align-items: center;
//           gap: 5px;
//           font-weight: 500;
//           transition: background-color 0.3s;
//         }

//         .print-button {
//           background-color: #4caf50;
//           color: white;
//         }

//         .download-pdf-button {
//           background-color: #f44336;
//           color: white;
//         }

//         .download-csv-button {
//           background-color: #2196f3;
//           color: white;
//         }

//         .action-button:hover {
//           opacity: 0.9;
//         }

//         .action-button:disabled {
//           background-color: #cccccc;
//           cursor: not-allowed;
//         }

//         .loading-indicator {
//           text-align: center;
//           padding: 40px;
//           font-size: 18px;
//           color: #666;
//         }

//         .dashboard-content {
//           background-color: white;
//           padding: 20px;
//           border-radius: 8px;
//           box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
//         }

//         .sale-chart-section,
//         .purchase-chart-section {
//           margin-top: 30px;
//           padding: 15px;
//           background-color: #fafafa;
//           border-radius: 8px;
//           box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
//         }

//         h2 {
//           margin-top: 0;
//           color: #333;
//           font-size: 18px;
//           margin-bottom: 15px;
//         }

//         @media print {
//           .dashboard-controls {
//             display: none;
//           }

//           .home-page {
//             padding: 0;
//             background-color: white;
//           }

//           .dashboard-content {
//             box-shadow: none;
//             padding: 0;
//           }
//         }
//       `}</style>
//     </div>
//   );
// }

// export default HomePage;


// import { useEffect, useState, useRef } from "react";
// import { request } from "../../util/helper";
// import { Button, Card, Row, Col, Statistic, Divider, Select, DatePicker } from "antd";
// import { DownloadOutlined, PrinterOutlined, BarChartOutlined, LineChartOutlined, PieChartOutlined, UserOutlined, DollarOutlined } from "@ant-design/icons";
// import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from "recharts";
// import html2canvas from "html2canvas";
// import jsPDF from "jspdf";
// import moment from "moment";
// import { BsSearch } from "react-icons/bs";

// const { RangePicker } = DatePicker;
// const { Option } = Select;

// function HomePage() {
//   const [dashboard, setDashboard] = useState([]);
//   const [saleByMonth, setSaleByMonth] = useState([]);
//   const [expenseByMonth, setExpenseByMonth] = useState([]);
//   const [dateRange, setDateRange] = useState([moment().startOf('year'), moment()]);
//   const [categoryId, setCategoryId] = useState(null);
//   const [expenseTypeId, setExpenseTypeId] = useState(null);
//   const [supplierId, setSupplierId] = useState(null);
//   const [topSales, setTopSales] = useState([]);
//   const [customerData, setCustomerData] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);

//   const dashboardRef = useRef(null);

//   // Colors for charts
//   const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

//   useEffect(() => {
//     getList();
//     fetchTopSales();
//     fetchReports();
//   }, [dateRange, categoryId, expenseTypeId, supplierId]);

//   const getList = async () => {
//     setIsLoading(true);
//     try {
//       const res = await request("dashbaord", "get");
//       if (res && !res.error) {
//         setDashboard(res.dashboard);

//         if (res.Sale_Summary_By_Month) {
//           const saleData = res.Sale_Summary_By_Month.map(item => ({
//             month: item.title,
//             sale: Number(item.total) || 0
//           }));
//           setSaleByMonth(saleData);
//         }

//         if (res.Expense_Summary_By_Month) {
//           const expenseData = res.Expense_Summary_By_Month.map(item => ({
//             month: item.title,
//             expense: Number(item.total) || 0
//           }));
//           setExpenseByMonth(expenseData);
//         }
//       }
//     } catch (error) {
//       console.error("Error fetching dashboard data:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const fetchTopSales = async () => {
//     try {
//       const res = await request("report/top_sale", "get");
//       if (res && res.list) {
//         // Transform for pie chart
//         const topProducts = res.list.map(item => ({
//           name: item.product_name,
//           value: Number(item.total_sale_amount),
//           category: item.category_name
//         }));
//         setTopSales(topProducts);
//       }
//     } catch (error) {
//       console.error("Error fetching top sales data:", error);
//     }
//   };

//   const fetchReports = async () => {
//     try {
//       const [fromDate, toDate] = dateRange;
//       const formattedFromDate = fromDate.format('YYYY-MM-DD');
//       const formattedToDate = toDate.format('YYYY-MM-DD');

//       // Fetch customer data
//       const customerRes = await request(`report/customer?from_date=${formattedFromDate}&to_date=${formattedToDate}`, "get");
//       if (customerRes && customerRes.list) {
//         setCustomerData(customerRes.list.map(item => ({
//           date: item.title,
//           count: Number(item.total_amount)
//         })));
//       }
//     } catch (error) {
//       console.error("Error fetching report data:", error);
//     }
//   };

//   const handlePrint = () => {
//     const printContent = document.getElementById("dashboard-content");
//     const originalContents = document.body.innerHTML;
//     document.body.innerHTML = printContent.innerHTML;
//     window.print();
//     document.body.innerHTML = originalContents;
//     window.location.reload();
//   };

//   const handleDownloadPDF = () => {
//     const input = document.getElementById("dashboard-content");
//     html2canvas(input, { scale: 2 }).then((canvas) => {
//       const imgData = canvas.toDataURL("image/png");
//       const pdf = new jsPDF("landscape");
//       const imgWidth = 280;
//       const imgHeight = (canvas.height * imgWidth) / canvas.width;
//       pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
//       pdf.save("dashboard.pdf");
//     });
//   };

//   const handleDateRangeChange = (dates) => {
//     setDateRange(dates);
//   };

//   // Custom tooltip formatter for charts
//   const tooltipFormatter = (value) => {
//     return [`$${value.toFixed(2)}`, "Amount"];
//   };

//   // Combined chart data
//   const combinedChartData = saleByMonth.map(sale => {
//     const expenseEntry = expenseByMonth.find(exp => exp.month === sale.month);
//     return {
//       month: sale.month,
//       sale: sale.sale,
//       expense: expenseEntry ? expenseEntry.expense : 0,
//       profit: sale.sale - (expenseEntry ? expenseEntry.expense : 0)
//     };
//   });
//   const handleSearch=()=>{

//   }

//   return (
//     <div className="home-page" style={{ padding: "20px", backgroundColor: "#f0f2f5" }}>
//       {/* Dashboard Header */}
//       <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
//         <Col span={18}>
//           <h1 style={{ fontSize: 28, margin: 0, color: "#1a3353" }}>Business Intelligence Dashboard</h1>
//           <p style={{ color: "#666" }}>Comprehensive overview of your business performance</p>
//         </Col>
//         <Col span={6} style={{ textAlign: "right" }}>
//           <Button
//             type="primary"
//             icon={<DownloadOutlined />}
//             onClick={handleDownloadPDF}
//             style={{ marginRight: 8, backgroundColor: "#1a3353" }}
//           >
//             Download PDF
//           </Button>
//           <Button
//             type="default"
//             icon={<PrinterOutlined />}
//             onClick={handlePrint}
//           >
//             Print
//           </Button>
//         </Col>
//       </Row>

//       {/* Filters */}
//       <Card style={{ marginBottom: 20, backgroundColor: "#fff", borderRadius: 8 }}>
//         <Row gutter={16}>
//           <Col span={8}>
//             <RangePicker 
//               value={dateRange}
//               onChange={handleDateRangeChange}
//               style={{ width: "100%" }}
//             />
//           </Col>
//          <Button type="primary" onClick={handleSearch} icon={<BsSearch />}>
//                     Filter
//                   </Button>
//         </Row>
//       </Card>

//       {/* Dashboard Content */}
//       <div id="dashboard-content" ref={dashboardRef}>
//         {/* Summary Cards */}
//         <Row gutter={[16, 16]}>
//           {dashboard.map((item, index) => (
//             <Col xs={24} sm={12} md={8} lg={8} xl={8} key={index}>
//               <Card 
//                 style={{ 
//                   height: 200, 
//                   borderRadius: 8,
//                   background: `linear-gradient(135deg, ${COLORS[index % COLORS.length]}33, ${COLORS[index % COLORS.length]}22)`,
//                   border: `1px solid ${COLORS[index % COLORS.length]}44`
//                 }}
//                 title={
//                   <div style={{ display: "flex", alignItems: "center" }}>
//                     {index === 0 && <UserOutlined style={{ marginRight: 8, fontSize: 20, color: COLORS[index % COLORS.length] }} />}
//                     {index === 1 && <UserOutlined style={{ marginRight: 8, fontSize: 20, color: COLORS[index % COLORS.length] }} />}
//                     {index === 2 && <UserOutlined style={{ marginRight: 8, fontSize: 20, color: COLORS[index % COLORS.length] }} />}
//                     {index === 3 && <DollarOutlined style={{ marginRight: 8, fontSize: 20, color: COLORS[index % COLORS.length] }} />}
//                     {index === 4 && <DollarOutlined style={{ marginRight: 8, fontSize: 20, color: COLORS[index % COLORS.length] }} />}
//                     <span style={{ color: "#1a3353" }}>{item.title}</span>
//                   </div>
//                 }
//               >
//                 <div style={{ display: "flex", flexDirection: "column", height: "calc(100% - 40px)" }}>
//                   {Object.entries(item.Summary).map(([key, value], idx) => (
//                     <div key={idx} style={{ marginBottom: 10 }}>
//                       <Row>
//                         <Col span={12}>
//                           <span style={{ color: "#666" }}>{key}:</span>
//                         </Col>
//                         <Col span={12} style={{ textAlign: "right" }}>
//                           <span style={{ fontSize: idx === 0 ? 18 : 16, fontWeight: idx === 0 ? "bold" : "normal" }}>
//                             {value}
//                           </span>
//                         </Col>
//                       </Row>
//                     </div>
//                   ))}
//                 </div>
//               </Card>
//             </Col>
//           ))}
//         </Row>

//         {/* Charts Section */}
//         <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
//           {/* Combined Sales and Expenses Chart */}
//           <Col span={24}>
//             <Card 
//               title={
//                 <div style={{ display: "flex", alignItems: "center" }}>
//                   <BarChartOutlined style={{ marginRight: 8, fontSize: 20, color: "#1a3353" }} />
//                   <span>Sales & Expenses Overview</span>
//                 </div>
//               }
//               style={{ borderRadius: 8 }}
//             >
//               <ResponsiveContainer width="100%" height={300}>
//                 <BarChart data={combinedChartData}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="month" />
//                   <YAxis />
//                   <Tooltip formatter={tooltipFormatter} />
//                   <Legend />
//                   <Bar dataKey="sale" name="Sales" fill="#0088FE" />
//                   <Bar dataKey="expense" name="Expenses" fill="#FF8042" />
//                   <Bar dataKey="profit" name="Profit" fill="#00C49F" />
//                 </BarChart>
//               </ResponsiveContainer>
//             </Card>
//           </Col>
//         </Row>

//         <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
//           {/* Sales Trend Line Chart */}
//           <Col xs={24} lg={12}>
//             <Card 
//               title={
//                 <div style={{ display: "flex", alignItems: "center" }}>
//                   <LineChartOutlined style={{ marginRight: 8, fontSize: 20, color: "#1a3353" }} />
//                   <span>Sales Trend</span>
//                 </div>
//               }
//               style={{ borderRadius: 8 }}
//             >
//               <ResponsiveContainer width="100%" height={300}>
//                 <LineChart data={saleByMonth}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="month" />
//                   <YAxis />
//                   <Tooltip formatter={tooltipFormatter} />
//                   <Legend />
//                   <Line type="monotone" dataKey="sale" stroke="#8884d8" activeDot={{ r: 8 }} />
//                 </LineChart>
//               </ResponsiveContainer>
//             </Card>
//           </Col>

//           {/* Expense Trend Line Chart */}
//           <Col xs={24} lg={12}>
//             <Card 
//               title={
//                 <div style={{ display: "flex", alignItems: "center" }}>
//                   <LineChartOutlined style={{ marginRight: 8, fontSize: 20, color: "#1a3353" }} />
//                   <span>Expense Trend</span>
//                 </div>
//               }
//               style={{ borderRadius: 8 }}
//             >
//               <ResponsiveContainer width="100%" height={300}>
//                 <LineChart data={expenseByMonth}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="month" />
//                   <YAxis />
//                   <Tooltip formatter={tooltipFormatter} />
//                   <Legend />
//                   <Line type="monotone" dataKey="expense" stroke="#82ca9d" activeDot={{ r: 8 }} />
//                 </LineChart>
//               </ResponsiveContainer>
//             </Card>
//           </Col>
//         </Row>


//       </div>

//       <style jsx>{`
//         @media print {
//           body {
//             -webkit-print-color-adjust: exact !important;
//             print-color-adjust: exact !important;
//           }
//           .home-page {
//             padding: 0 !important;
//             background-color: white !important;
//           }
//         }
//       `}</style>
//     </div>
//   );
// }

// export default HomePage;



// import { useEffect, useState, useRef } from "react";
// import { request } from "../../util/helper";
// import { Button, Card, Row, Col, Statistic, Divider, Select, DatePicker } from "antd";
// import { DownloadOutlined, PrinterOutlined, BarChartOutlined, LineChartOutlined, PieChartOutlined, UserOutlined, DollarOutlined } from "@ant-design/icons";
// import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from "recharts";
// import html2canvas from "html2canvas";
// import jsPDF from "jspdf";
// import moment from "moment";
// import { BsSearch } from "react-icons/bs";

// const { RangePicker } = DatePicker;
// const { Option } = Select;

// function HomePage() {
//   const [dashboard, setDashboard] = useState([]);
//   const [saleByMonth, setSaleByMonth] = useState([]);
//   const [expenseByMonth, setExpenseByMonth] = useState([]);
//   const [dateRange, setDateRange] = useState([moment().startOf('year'), moment()]);
//   const [categoryId, setCategoryId] = useState(null);
//   const [expenseTypeId, setExpenseTypeId] = useState(null);
//   const [supplierId, setSupplierId] = useState(null);
//   const [topSales, setTopSales] = useState([]);
//   const [customerData, setCustomerData] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);

//   const dashboardRef = useRef(null);

//   // Colors for charts
//   const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

//   useEffect(() => {
//     // Initial data load
//     getList();
//   }, []); // Empty dependency array for initial load only

//   // Fetch all data with date filters
//   const fetchAllData = () => {
//     getList();
//     fetchTopSales();
//     fetchReports();
//   };

//   const getList = async () => {
//     setIsLoading(true);
//     try {
//       // Format dates for API
//       const [fromDate, toDate] = dateRange;
//       const formattedFromDate = fromDate.format('YYYY-MM-DD');
//       const formattedToDate = toDate.format('YYYY-MM-DD');

//       // Update API call to include date parameters
//       const res = await request(`dashbaord?from_date=${formattedFromDate}&to_date=${formattedToDate}`, "get");
//       if (res && !res.error) {
//         setDashboard(res.dashboard);

//         if (res.Sale_Summary_By_Month) {
//           const saleData = res.Sale_Summary_By_Month.map(item => ({
//             month: item.title,
//             sale: Number(item.total) || 0
//           }));
//           setSaleByMonth(saleData);
//         }

//         if (res.Expense_Summary_By_Month) {
//           const expenseData = res.Expense_Summary_By_Month.map(item => ({
//             month: item.title,
//             expense: Number(item.total) || 0
//           }));
//           setExpenseByMonth(expenseData);
//         }
//       }
//     } catch (error) {
//       console.error("Error fetching dashboard data:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const fetchTopSales = async () => {
//     try {
//       // Format dates for API
//       const [fromDate, toDate] = dateRange;
//       const formattedFromDate = fromDate.format('YYYY-MM-DD');
//       const formattedToDate = toDate.format('YYYY-MM-DD');

//       // Update API call to include date parameters
//       const res = await request(`report/top_sale?from_date=${formattedFromDate}&to_date=${formattedToDate}`, "get");
//       if (res && res.list) {
//         // Transform for pie chart
//         const topProducts = res.list.map(item => ({
//           name: item.product_name,
//           value: Number(item.total_sale_amount),
//           category: item.category_name
//         }));
//         setTopSales(topProducts);
//       }
//     } catch (error) {
//       console.error("Error fetching top sales data:", error);
//     }
//   };

//   const fetchReports = async () => {
//     try {
//       const [fromDate, toDate] = dateRange;
//       const formattedFromDate = fromDate.format('YYYY-MM-DD');
//       const formattedToDate = toDate.format('YYYY-MM-DD');

//       // Fetch customer data with date filters
//       const customerRes = await request(`report/customer?from_date=${formattedFromDate}&to_date=${formattedToDate}`, "get");
//       if (customerRes && customerRes.list) {
//         setCustomerData(customerRes.list.map(item => ({
//           date: item.title,
//           count: Number(item.total_amount)
//         })));
//       }
//     } catch (error) {
//       console.error("Error fetching report data:", error);
//     }
//   };

//   const handlePrint = () => {
//     const printContent = document.getElementById("dashboard-content");
//     const originalContents = document.body.innerHTML;
//     document.body.innerHTML = printContent.innerHTML;
//     window.print();
//     document.body.innerHTML = originalContents;
//     window.location.reload();
//   };

//   const handleDownloadPDF = () => {
//     const input = document.getElementById("dashboard-content");
//     html2canvas(input, { scale: 2 }).then((canvas) => {
//       const imgData = canvas.toDataURL("image/png");
//       const pdf = new jsPDF("landscape");
//       const imgWidth = 280;
//       const imgHeight = (canvas.height * imgWidth) / canvas.width;
//       pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
//       pdf.save("dashboard.pdf");
//     });
//   };

//   const handleDateRangeChange = (dates) => {
//     setDateRange(dates);
//   };

//   // Handler for the search/filter button
//   const handleSearch = () => {
//     fetchAllData();
//   };

//   // Custom tooltip formatter for charts
//   const tooltipFormatter = (value) => {
//     return [`$${value.toFixed(2)}`, "Amount"];
//   };

//   // Combined chart data
//   const combinedChartData = saleByMonth.map(sale => {
//     const expenseEntry = expenseByMonth.find(exp => exp.month === sale.month);
//     return {
//       month: sale.month,
//       sale: sale.sale,
//       expense: expenseEntry ? expenseEntry.expense : 0,
//       profit: sale.sale - (expenseEntry ? expenseEntry.expense : 0)
//     };
//   });

//   return (
//     <div className="home-page" style={{ padding: "20px", backgroundColor: "#f0f2f5" }}>
//       {/* Dashboard Header */}
//       <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
//         <Col span={18}>
//           <h1 style={{ fontSize: 28, margin: 0, color: "#1a3353" }}>Business Intelligence Dashboard</h1>
//           <p style={{ color: "#666" }}>Comprehensive overview of your business performance</p>
//         </Col>
//         <Col span={6} style={{ textAlign: "right" }}>
//           <Button
//             type="primary"
//             icon={<DownloadOutlined />}
//             onClick={handleDownloadPDF}
//             style={{ marginRight: 8, backgroundColor: "#1a3353" }}
//           >
//             Download PDF
//           </Button>
//           <Button
//             type="default"
//             icon={<PrinterOutlined />}
//             onClick={handlePrint}
//           >
//             Print
//           </Button>
//         </Col>
//       </Row>

//       {/* Filters */}
//       <Card style={{ marginBottom: 20, backgroundColor: "#fff", borderRadius: 8 }}>
//         <Row gutter={16} align="middle">
//           <Col span={8}>
//             <DatePicker.RangePicker
//               value={dateRange}
//               onChange={handleDateRangeChange}
//               style={{ width: "100%" }}
//               format="YYYY-MM-DD"
//             />
//           </Col>
//           <Col>
//             <Button 
//               type="primary" 
//               onClick={handleSearch} 
//               icon={<BsSearch />}
//               loading={isLoading}
//             >
//               Filter
//             </Button>
//           </Col>
//         </Row>
//       </Card>

//       {/* Dashboard Content */}
//       <div id="dashboard-content" ref={dashboardRef}>
//         {/* Summary Cards */}
//         <Row gutter={[16, 16]}>
//           {dashboard.map((item, index) => (
//             <Col xs={24} sm={12} md={8} lg={8} xl={8} key={index}>
//               <Card 
//                 style={{ 
//                   height: 200, 
//                   borderRadius: 8,
//                   background: `linear-gradient(135deg, ${COLORS[index % COLORS.length]}33, ${COLORS[index % COLORS.length]}22)`,
//                   border: `1px solid ${COLORS[index % COLORS.length]}44`
//                 }}
//                 title={
//                   <div style={{ display: "flex", alignItems: "center" }}>
//                     {index === 0 && <UserOutlined style={{ marginRight: 8, fontSize: 20, color: COLORS[index % COLORS.length] }} />}
//                     {index === 1 && <UserOutlined style={{ marginRight: 8, fontSize: 20, color: COLORS[index % COLORS.length] }} />}
//                     {index === 2 && <UserOutlined style={{ marginRight: 8, fontSize: 20, color: COLORS[index % COLORS.length] }} />}
//                     {index === 3 && <DollarOutlined style={{ marginRight: 8, fontSize: 20, color: COLORS[index % COLORS.length] }} />}
//                     {index === 4 && <DollarOutlined style={{ marginRight: 8, fontSize: 20, color: COLORS[index % COLORS.length] }} />}
//                     <span style={{ color: "#1a3353" }}>{item.title}</span>
//                   </div>
//                 }
//               >
//                 <div style={{ display: "flex", flexDirection: "column", height: "calc(100% - 40px)" }}>
//                   {Object.entries(item.Summary).map(([key, value], idx) => (
//                     <div key={idx} style={{ marginBottom: 10 }}>
//                       <Row>
//                         <Col span={12}>
//                           <span style={{ color: "#666" }}>{key}:</span>
//                         </Col>
//                         <Col span={12} style={{ textAlign: "right" }}>
//                           <span style={{ fontSize: idx === 0 ? 18 : 16, fontWeight: idx === 0 ? "bold" : "normal" }}>
//                             {value}
//                           </span>
//                         </Col>
//                       </Row>
//                     </div>
//                   ))}
//                 </div>
//               </Card>
//             </Col>
//           ))}
//         </Row>

//         {/* Charts Section */}
//         <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
//           {/* Combined Sales and Expenses Chart */}
//           <Col span={24}>
//             <Card 
//               title={
//                 <div style={{ display: "flex", alignItems: "center" }}>
//                   <BarChartOutlined style={{ marginRight: 8, fontSize: 20, color: "#1a3353" }} />
//                   <span>Sales & Expenses Overview</span>
//                 </div>
//               }
//               style={{ borderRadius: 8 }}
//             >
//               <ResponsiveContainer width="100%" height={300}>
//                 <BarChart data={combinedChartData}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="month" />
//                   <YAxis />
//                   <Tooltip formatter={tooltipFormatter} />
//                   <Legend />
//                   <Bar dataKey="sale" name="Sales" fill="#0088FE" />
//                   <Bar dataKey="expense" name="Expenses" fill="#FF8042" />
//                   <Bar dataKey="profit" name="Profit" fill="#00C49F" />
//                 </BarChart>
//               </ResponsiveContainer>
//             </Card>
//           </Col>
//         </Row>

//         <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
//           {/* Sales Trend Line Chart */}
//           <Col xs={24} lg={12}>
//             <Card 
//               title={
//                 <div style={{ display: "flex", alignItems: "center" }}>
//                   <LineChartOutlined style={{ marginRight: 8, fontSize: 20, color: "#1a3353" }} />
//                   <span>Sales Trend</span>
//                 </div>
//               }
//               style={{ borderRadius: 8 }}
//             >
//               <ResponsiveContainer width="100%" height={300}>
//                 <LineChart data={saleByMonth}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="month" />
//                   <YAxis />
//                   <Tooltip formatter={tooltipFormatter} />
//                   <Legend />
//                   <Line type="monotone" dataKey="sale" stroke="#8884d8" activeDot={{ r: 8 }} />
//                 </LineChart>
//               </ResponsiveContainer>
//             </Card>
//           </Col>

//           {/* Expense Trend Line Chart */}
//           <Col xs={24} lg={12}>
//             <Card 
//               title={
//                 <div style={{ display: "flex", alignItems: "center" }}>
//                   <LineChartOutlined style={{ marginRight: 8, fontSize: 20, color: "#1a3353" }} />
//                   <span>Expense Trend</span>
//                 </div>
//               }
//               style={{ borderRadius: 8 }}
//             >
//               <ResponsiveContainer width="100%" height={300}>
//                 <LineChart data={expenseByMonth}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="month" />
//                   <YAxis />
//                   <Tooltip formatter={tooltipFormatter} />
//                   <Legend />
//                   <Line type="monotone" dataKey="expense" stroke="#82ca9d" activeDot={{ r: 8 }} />
//                 </LineChart>
//               </ResponsiveContainer>
//             </Card>
//           </Col>
//         </Row>
//       </div>

//       <style jsx>{`
//         @media print {
//           body {
//             -webkit-print-color-adjust: exact !important;
//             print-color-adjust: exact !important;
//           }
//           .home-page {
//             padding: 0 !important;
//             background-color: white !important;
//           }
//         }
//       `}</style>
//     </div>
//   );
// }

// export default HomePage;


// import { useEffect, useState, useRef } from "react";
// import { request } from "../../util/helper";
// import { Button, Card, Row, Col, Statistic, Divider, Select, DatePicker, Empty } from "antd";
// import { DownloadOutlined, PrinterOutlined, BarChartOutlined, LineChartOutlined, PieChartOutlined, UserOutlined, DollarOutlined } from "@ant-design/icons";
// import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from "recharts";
// import html2canvas from "html2canvas";
// import jsPDF from "jspdf";
// import moment from "moment";
// import { BsSearch } from "react-icons/bs";

// const { RangePicker } = DatePicker;
// const { Option } = Select;

// function HomePage() {
//   const [dashboard, setDashboard] = useState([]);
//   const [saleByMonth, setSaleByMonth] = useState([]);
//   const [expenseByMonth, setExpenseByMonth] = useState([]);
//   const [dateRange, setDateRange] = useState([moment().startOf('year'), moment()]);
//   const [categoryId, setCategoryId] = useState(null);
//   const [expenseTypeId, setExpenseTypeId] = useState(null);
//   const [supplierId, setSupplierId] = useState(null);
//   const [topSales, setTopSales] = useState([]);
//   const [customerData, setCustomerData] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);

//   const dashboardRef = useRef(null);

//   // Colors for charts
//   const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

//   useEffect(() => {
//     // Initial data load
//     getList();
//   }, []); // Empty dependency array for initial load only

//   // Format numbers with commas for thousands
//   const formatNumber = (value) => {
//     if (typeof value === 'number') {
//       return value.toLocaleString();
//     } else if (typeof value === 'string' && !isNaN(value)) {
//       return Number(value).toLocaleString();
//     }
//     return value;
//   };

//   // Fetch all data with date filters
//   const fetchAllData = () => {
//     getList();
//     fetchTopSales();
//     fetchReports();
//   };

//   const getList = async () => {
//     setIsLoading(true);
//     try {
//       let apiUrl = 'dashbaord';

//       // Only add date parameters if dateRange is not null
//       if (dateRange && dateRange[0] && dateRange[1]) {
//         const [fromDate, toDate] = dateRange;
//         const formattedFromDate = fromDate.format('YYYY-MM-DD');
//         const formattedToDate = toDate.format('YYYY-MM-DD');
//         apiUrl += `?from_date=${formattedFromDate}&to_date=${formattedToDate}`;
//       }

//       // Update API call with or without date parameters
//       const res = await request(apiUrl, "get");
//       if (res && !res.error) {
//         setDashboard(res.dashboard);

//         if (res.Sale_Summary_By_Month) {
//           const saleData = res.Sale_Summary_By_Month.map(item => ({
//             month: item.title,
//             sale: Number(item.total) || 0
//           }));
//           setSaleByMonth(saleData);
//         }

//         if (res.Expense_Summary_By_Month) {
//           const expenseData = res.Expense_Summary_By_Month.map(item => ({
//             month: item.title,
//             expense: Number(item.total) || 0
//           }));
//           setExpenseByMonth(expenseData);
//         }
//       }
//     } catch (error) {
//       console.error("Error fetching dashboard data:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const fetchTopSales = async () => {
//     try {
//       let apiUrl = 'report/top_sale';

//       // Only add date parameters if dateRange is not null
//       if (dateRange && dateRange[0] && dateRange[1]) {
//         const [fromDate, toDate] = dateRange;
//         const formattedFromDate = fromDate.format('YYYY-MM-DD');
//         const formattedToDate = toDate.format('YYYY-MM-DD');
//         apiUrl += `?from_date=${formattedFromDate}&to_date=${formattedToDate}`;
//       }

//       // Update API call with or without date parameters
//       const res = await request(apiUrl, "get");
//       if (res && res.list) {
//         // Transform for pie chart
//         const topProducts = res.list.map(item => ({
//           name: item.product_name,
//           value: Number(item.total_sale_amount),
//           category: item.category_name
//         }));
//         setTopSales(topProducts);
//       }
//     } catch (error) {
//       console.error("Error fetching top sales data:", error);
//     }
//   };

//   const fetchReports = async () => {
//     try {
//       let apiUrl = 'report/customer';

//       // Only add date parameters if dateRange is not null
//       if (dateRange && dateRange[0] && dateRange[1]) {
//         const [fromDate, toDate] = dateRange;
//         const formattedFromDate = fromDate.format('YYYY-MM-DD');
//         const formattedToDate = toDate.format('YYYY-MM-DD');
//         apiUrl += `?from_date=${formattedFromDate}&to_date=${formattedToDate}`;
//       }

//       // Fetch customer data with or without date filters
//       const customerRes = await request(apiUrl, "get");
//       if (customerRes && customerRes.list) {
//         setCustomerData(customerRes.list.map(item => ({
//           date: item.title,
//           count: Number(item.total_amount)
//         })));
//       }
//     } catch (error) {
//       console.error("Error fetching report data:", error);
//     }
//   };

//   const handlePrint = () => {
//     const printContent = document.getElementById("dashboard-content");
//     const originalContents = document.body.innerHTML;
//     document.body.innerHTML = printContent.innerHTML;
//     window.print();
//     document.body.innerHTML = originalContents;
//     window.location.reload();
//   };

//   const handleDownloadPDF = () => {
//     const input = document.getElementById("dashboard-content");
//     html2canvas(input, { scale: 2 }).then((canvas) => {
//       const imgData = canvas.toDataURL("image/png");
//       const pdf = new jsPDF("landscape");
//       const imgWidth = 280;
//       const imgHeight = (canvas.height * imgWidth) / canvas.width;
//       pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
//       pdf.save("dashboard.pdf");
//     });
//   };

//   const handleDateRangeChange = (dates) => {
//     setDateRange(dates); // This can be null when clearing
//   };

//   // Handler for the search/filter button
//   const handleSearch = () => {
//     fetchAllData();
//   };

//   // Custom tooltip formatter for charts
//   const tooltipFormatter = (value) => {
//     return [`$${value.toLocaleString()}`, "Amount"];
//   };

//   // Combined chart data
//   const combinedChartData = saleByMonth.map(sale => {
//     const expenseEntry = expenseByMonth.find(exp => exp.month === sale.month);
//     return {
//       month: sale.month,
//       sale: sale.sale,
//       expense: expenseEntry ? expenseEntry.expense : 0,
//       profit: sale.sale - (expenseEntry ? expenseEntry.expense : 0)
//     };
//   });

//   return (
//     <div className="home-page" style={{ padding: "20px", backgroundColor: "#f0f2f5" }}>
//       {/* Dashboard Header */}
//       <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
//         <Col span={18}>
//                     <h1 style={{ fontSize: 28, margin: 0, color: "#1a3353", fontFamily: "Khmer OS" ,fontWeight:"bold"}}>
//             ផ្ទាំងគ្រប់គ្រងអាជីវកម្ម
//           </h1>
//           <p style={{ color: "#666", fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif" }}>
//             ទិដ្ឋភាពទូលំទូលាយនៃដំណើរការអាជីវកម្មរបស់អ្នក
//           </p>
//         </Col>
//         <Col span={6} style={{ textAlign: "right" }}>
//           <Button
//             type="primary"
//             icon={<DownloadOutlined />}
//             onClick={handleDownloadPDF}
//             style={{ marginRight: 8, backgroundColor: "#1a3353" }}
//           >
//             <span style={{ fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif" }}>
//               ទាញយក PDF
//             </span>
//           </Button>
//           <Button
//             type="default"
//             icon={<PrinterOutlined />}
//             onClick={handlePrint}
//           >
//             <span style={{ fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif" }}>
//               បោះពុម្ព
//             </span>
//           </Button>
//         </Col>
//       </Row>

//       {/* Filters */}
//       <Card style={{ marginBottom: 20, backgroundColor: "#fff", borderRadius: 8 }}>
//         <Row gutter={16} align="middle">
//           <Col span={8}>
//             <DatePicker.RangePicker
//               value={dateRange}
//               onChange={handleDateRangeChange}
//               style={{ width: "100%" }}
//               format="YYYY-MM-DD"
//               allowClear={true}
//             />
//           </Col>
//           <Col>
//             <Button 
//               type="primary" 
//               onClick={handleSearch} 
//               icon={<BsSearch />}
//               loading={isLoading}
//             >
//               <span style={{ fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif" }}>
//                 ស្វែងរក
//               </span>
//             </Button>
//           </Col>
//         </Row>
//       </Card>

//       {/* Dashboard Content */}
//       <div id="dashboard-content" ref={dashboardRef}>
//         {/* Summary Cards */}
//         <Row gutter={[16, 16]}>
//           {dashboard.length > 0 ? dashboard.map((item, index) => (
//             <Col xs={24} sm={12} md={8} lg={8} xl={8} key={index}>
//               <Card 
//                 style={{ 
//                   height: 200, 
//                   borderRadius: 8,
//                   background: `linear-gradient(135deg, ${COLORS[index % COLORS.length]}33, ${COLORS[index % COLORS.length]}22)`,
//                   border: `1px solid ${COLORS[index % COLORS.length]}44`
//                 }}
//                 title={
//                   <div style={{ display: "flex", alignItems: "center" }}>
//                     {index === 0 && <UserOutlined style={{ marginRight: 8, fontSize: 20, color: COLORS[index % COLORS.length] }} />}
//                     {index === 1 && <UserOutlined style={{ marginRight: 8, fontSize: 20, color: COLORS[index % COLORS.length] }} />}
//                     {index === 2 && <UserOutlined style={{ marginRight: 8, fontSize: 20, color: COLORS[index % COLORS.length] }} />}
//                     {index === 3 && <DollarOutlined style={{ marginRight: 8, fontSize: 20, color: COLORS[index % COLORS.length] }} />}
//                     {index === 4 && <DollarOutlined style={{ marginRight: 8, fontSize: 20, color: COLORS[index % COLORS.length] }} />}
//                     <span style={{ 
//                       color: "#1a3353", 
//                       fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
//                       fontWeight: "bold"
//                     }}>{item.title}</span>
//                   </div>
//                 }
//               >
//                 <div style={{ display: "flex", flexDirection: "column", height: "calc(100% - 40px)" }}>
//                   {Object.entries(item.Summary).map(([key, value], idx) => (
//                     <div key={idx} style={{ marginBottom: 10 }}>
//                       <Row>
//                         <Col span={12}>
//                           <span style={{ 
//                             color: "#666",
//                             fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif"
//                           }}>{key}:</span>
//                         </Col>
//                         <Col span={12} style={{ textAlign: "right" }}>
//                           <span style={{ 
//                             fontSize: idx === 0 ? 18 : 16, 
//                             fontWeight: idx === 0 ? "bold" : "normal" 
//                           }}>
//                             {formatNumber(value)}
//                           </span>
//                         </Col>
//                       </Row>
//                     </div>
//                   ))}
//                 </div>
//               </Card>
//             </Col>
//           )) : (
//             <Col span={24}>
//               <Empty 
//                 description={
//                   <span style={{ 
//                     fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif"
//                   }}>
//                     មិនមានទិន្នន័យ
//                   </span>
//                 } 
//               />
//             </Col>
//           )}
//         </Row>

//         {/* Charts Section */}
//         <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
//           {/* Combined Sales and Expenses Chart */}
//           <Col span={24}>
//             <Card 
//               title={
//                 <div style={{ display: "flex", alignItems: "center" }}>
//                   <BarChartOutlined style={{ marginRight: 8, fontSize: 20, color: "#1a3353" }} />
//                   <span style={{ 
//                     fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
//                     fontWeight: "bold" 
//                   }}>ទិដ្ឋភាពនៃការលក់និងចំណាយ</span>
//                 </div>
//               }
//               style={{ borderRadius: 8 }}
//             >
//               {combinedChartData.length > 0 ? (
//                 <ResponsiveContainer width="100%" height={300}>
//                   <BarChart data={combinedChartData}>
//                     <CartesianGrid strokeDasharray="3 3" />
//                     <XAxis dataKey="month" />
//                     <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
//                     <Tooltip formatter={tooltipFormatter} />
//                     <Legend />
//                     <Bar dataKey="sale" name="ការលក់" fill="#0088FE" />
//                     <Bar dataKey="expense" name="ចំណាយ" fill="#FF8042" />
//                     <Bar dataKey="profit" name="ប្រាក់ចំណេញ" fill="#00C49F" />
//                   </BarChart>
//                 </ResponsiveContainer>
//               ) : (
//                 <Empty 
//                   description={
//                     <span style={{ 
//                       fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif"
//                     }}>
//                       មិនមានទិន្នន័យ
//                     </span>
//                   } 
//                 />
//               )}
//             </Card>
//           </Col>
//         </Row>

//         <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
//           {/* Sales Trend Line Chart */}
//           <Col xs={24} lg={12}>
//             <Card 
//               title={
//                 <div style={{ display: "flex", alignItems: "center" }}>
//                   <LineChartOutlined style={{ marginRight: 8, fontSize: 20, color: "#1a3353" }} />
//                   <span style={{ 
//                     fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
//                     fontWeight: "bold" 
//                   }}>និន្នាការលក់</span>
//                 </div>
//               }
//               style={{ borderRadius: 8 }}
//             >
//               {saleByMonth.length > 0 ? (
//                 <ResponsiveContainer width="100%" height={300}>
//                   <LineChart data={saleByMonth}>
//                     <CartesianGrid strokeDasharray="3 3" />
//                     <XAxis dataKey="month" />
//                     <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
//                     <Tooltip formatter={tooltipFormatter} />
//                     <Legend />
//                     <Line type="monotone" dataKey="sale" name="ការលក់" stroke="#8884d8" activeDot={{ r: 8 }} />
//                   </LineChart>
//                 </ResponsiveContainer>
//               ) : (
//                 <Empty 
//                   description={
//                     <span style={{ 
//                       fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif"
//                     }}>
//                       មិនមានទិន្នន័យ
//                     </span>
//                   } 
//                 />
//               )}
//             </Card>
//           </Col>

//           {/* Expense Trend Line Chart */}
//           <Col xs={24} lg={12}>
//             <Card 
//               title={
//                 <div style={{ display: "flex", alignItems: "center" }}>
//                   <LineChartOutlined style={{ marginRight: 8, fontSize: 20, color: "#1a3353" }} />
//                   <span style={{ 
//                     fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
//                     fontWeight: "bold" 
//                   }}>និន្នាការចំណាយ</span>
//                 </div>
//               }
//               style={{ borderRadius: 8 }}
//             >
//               {expenseByMonth.length > 0 ? (
//                 <ResponsiveContainer width="100%" height={300}>
//                   <LineChart data={expenseByMonth}>
//                     <CartesianGrid strokeDasharray="3 3" />
//                     <XAxis dataKey="month" />
//                     <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
//                     <Tooltip formatter={tooltipFormatter} />
//                     <Legend />
//                     <Line type="monotone" dataKey="expense" name="ចំណាយ" stroke="#82ca9d" activeDot={{ r: 8 }} />
//                   </LineChart>
//                 </ResponsiveContainer>
//               ) : (
//                 <Empty 
//                   description={
//                     <span style={{ 
//                       fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif"
//                     }}>
//                       មិនមានទិន្នន័យ
//                     </span>
//                   } 
//                 />
//               )}
//             </Card>
//           </Col>
//         </Row>
//       </div>

//       <style jsx>{`
//         @media print {
//           body {
//             -webkit-print-color-adjust: exact !important;
//             print-color-adjust: exact !important;
//           }
//           .home-page {
//             padding: 0 !important;
//             background-color: white !important;
//           }
//         }

//         /* Add Khmer font import - make sure these fonts are available */
//         @font-face {
//           font-family: 'Khmer OS';
//           src: url('/fonts/KhmerOS.ttf') format('truetype');
//           font-weight: normal;
//           font-style: normal;
//         }

//         @font-face {
//           font-family: 'Khmer OS System';
//           src: url('/fonts/KhmerOSsys.ttf') format('truetype');
//           font-weight: normal;
//           font-style: normal;
//         }

//         @font-face {
//           font-family: 'Khmer OS Battambang';
//           src: url('/fonts/KhmerOSbattambang.ttf') format('truetype');
//           font-weight: normal;
//           font-style: normal;
//         }
//       `}</style>
//     </div>
//   );
// }

// export default HomePage;






import React, { useEffect, useState, useRef } from "react";
import { request } from "../../util/helper";
import { Button, Card, Row, Col, Statistic, Divider, Select, DatePicker, Empty, Dropdown, Menu, message } from "antd";
import { DownloadOutlined, PrinterOutlined, BarChartOutlined, LineChartOutlined, PieChartOutlined, UserOutlined, DollarOutlined, MoreOutlined } from "@ant-design/icons";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import moment from "moment";
import { BsSearch } from "react-icons/bs";

const { RangePicker } = DatePicker;
const { Option } = Select;

function HomePage() {
  const [dashboard, setDashboard] = useState([]);
  const [saleByMonth, setSaleByMonth] = useState([]);
  const [expenseByMonth, setExpenseByMonth] = useState([]);
  const [dateRange, setDateRange] = useState([moment().startOf('year'), moment()]);
  const [categoryId, setCategoryId] = useState(null);
  const [expenseTypeId, setExpenseTypeId] = useState(null);
  const [supplierId, setSupplierId] = useState(null);
  const [topSales, setTopSales] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState(null);

  const dashboardRef = useRef(null);
  const cardRefs = useRef([]);
  const chartRefs = useRef({
    combinedChart: useRef(null),
    salesTrendChart: useRef(null),
    expenseTrendChart: useRef(null)
  });

  // Initialize refs for cards
  useEffect(() => {
    cardRefs.current = Array(dashboard.length).fill().map((_, i) => cardRefs.current[i] || React.createRef());
  }, [dashboard]);

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Set up keyboard shortcut for Ctrl+3
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === '3') {
        message.info('ជ្រើសរើសផ្ទាំងដែលត្រូវការបោះពុម្ព ឬទាញយក PDF', 2);
        setSelectedCardIndex(0); // Select first card by default
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    // Initial data load
    getList();
  }, []); // Empty dependency array for initial load only

  // Format numbers with commas for thousands separator
  const formatNumber = (value) => {
    if (value === null || value === undefined) return '';

    // If the value already contains a currency symbol or is formatted
    if (typeof value === 'string') {
      // Check if it's already formatted properly
      if (value.includes(',')) return value;

      // Extract number from string that might contain "$" or other characters
      const numericValue = value.replace(/[^\d.-]/g, '');
      if (!isNaN(numericValue) && numericValue !== '') {
        const formattedNum = Number(numericValue).toLocaleString();
        // If original value had dollar sign, keep it
        if (value.includes('$')) {
          return formattedNum + ' $';
        }
        return formattedNum;
      }
      return value;
    }

    // For numeric values
    if (typeof value === 'number') {
      return value.toLocaleString();
    }

    return value;
  };

  // Process dashboard data to ensure all numeric values are properly formatted
  const processDashboardData = (data) => {
    if (!data || !Array.isArray(data)) return [];

    return data.map(item => {
      const processedSummary = {};

      if (item.Summary) {
        Object.entries(item.Summary).forEach(([key, value]) => {
          // Format only if it's a number or contains a number
          processedSummary[key] = formatNumber(value);
        });
      }

      return {
        ...item,
        Summary: processedSummary
      };
    });
  };

  // Fetch all data with date filters
  const fetchAllData = () => {
    getList();
    fetchTopSales();
    fetchReports();
  };

  const getList = async () => {
    setIsLoading(true);
    try {
      let apiUrl = 'dashbaord';

      // Only add date parameters if dateRange is not null
      if (dateRange && dateRange[0] && dateRange[1]) {
        const [fromDate, toDate] = dateRange;
        const formattedFromDate = fromDate.format('YYYY-MM-DD');
        const formattedToDate = toDate.format('YYYY-MM-DD');
        apiUrl += `?from_date=${formattedFromDate}&to_date=${formattedToDate}`;
      }

      // Update API call with or without date parameters
      const res = await request(apiUrl, "get");
      if (res && !res.error) {
        // Process dashboard data to ensure proper formatting
        setDashboard(processDashboardData(res.dashboard));

        if (res.Sale_Summary_By_Month) {
          const saleData = res.Sale_Summary_By_Month.map(item => ({
            month: item.title,
            sale: Number(item.total) || 0
          }));
          setSaleByMonth(saleData);
        }

        if (res.Expense_Summary_By_Month) {
          const expenseData = res.Expense_Summary_By_Month.map(item => ({
            month: item.title,
            expense: Number(item.total) || 0
          }));
          setExpenseByMonth(expenseData);
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTopSales = async () => {
    try {
      let apiUrl = 'report/top_sale';

      // Only add date parameters if dateRange is not null
      if (dateRange && dateRange[0] && dateRange[1]) {
        const [fromDate, toDate] = dateRange;
        const formattedFromDate = fromDate.format('YYYY-MM-DD');
        const formattedToDate = toDate.format('YYYY-MM-DD');
        apiUrl += `?from_date=${formattedFromDate}&to_date=${formattedToDate}`;
      }

      // Update API call with or without date parameters
      const res = await request(apiUrl, "get");
      if (res && res.list) {
        // Transform for pie chart
        const topProducts = res.list.map(item => ({
          name: item.product_name,
          value: Number(item.total_sale_amount),
          category: item.category_name
        }));
        setTopSales(topProducts);
      }
    } catch (error) {
      console.error("Error fetching top sales data:", error);
    }
  };

  const fetchReports = async () => {
    try {
      let apiUrl = 'report/customer';

      // Only add date parameters if dateRange is not null
      if (dateRange && dateRange[0] && dateRange[1]) {
        const [fromDate, toDate] = dateRange;
        const formattedFromDate = fromDate.format('YYYY-MM-DD');
        const formattedToDate = toDate.format('YYYY-MM-DD');
        apiUrl += `?from_date=${formattedFromDate}&to_date=${formattedToDate}`;
      }

      // Fetch customer data with or without date filters
      const customerRes = await request(apiUrl, "get");
      if (customerRes && customerRes.list) {
        setCustomerData(customerRes.list.map(item => ({
          date: item.title,
          count: Number(item.total_amount)
        })));
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
    }
  };

  // Print the entire dashboard
  const handlePrintAll = () => {
    const printContent = document.getElementById("dashboard-content");
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  // Download the entire dashboard as PDF
  const handleDownloadAllPDF = () => {
    const input = document.getElementById("dashboard-content");
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("landscape");
      const imgWidth = 280;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save("dashboard.pdf");
    });
  };

  // Print individual card or chart
  const handlePrintIndividual = (elementRef, title) => {
    if (!elementRef.current) return;

    html2canvas(elementRef.current).then((canvas) => {
      const printWindow = window.open('', '_blank');

      if (!printWindow) {
        message.error('បិទការហាមឃាត់ popup ដើម្បីបោះពុម្ព');
        return;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                text-align: center;
              }
              img {
                max-width: 100%;
              }
              @media print {
                body {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
              }
            </style>
          </head>
          <body>
            <h2>${title}</h2>
            <img src="${canvas.toDataURL('image/png')}" />
          </body>
        </html>
      `);

      printWindow.document.close();

      // Print after the image loads
      const img = printWindow.document.querySelector('img');
      if (img) {
        img.onload = function () {
          printWindow.print();
          // Close window after print dialog closes (setTimeout to give user time to cancel)
          setTimeout(() => {
            printWindow.close();
          }, 500);
        };
      } else {
        printWindow.print();
        setTimeout(() => {
          printWindow.close();
        }, 500);
      }
    });
  };

  // Download individual card or chart as PDF
  const handleDownloadIndividualPDF = (elementRef, title) => {
    if (!elementRef.current) return;

    html2canvas(elementRef.current, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();

      // Calculate dimensions to fit the PDF page
      const imgWidth = 190; // A4 page width (210mm) minus margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add title
      pdf.setFontSize(16);
      pdf.text(title, 10, 10);

      // Add image below title
      pdf.addImage(imgData, "PNG", 10, 20, imgWidth, imgHeight);
      pdf.save(`${title.replace(/\s+/g, '_')}.pdf`);

      message.success('បានទាញយក PDF ដោយជោគជ័យ');
    });
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates); // This can be null when clearing
  };

  // Handler for the search/filter button
  const handleSearch = () => {
    fetchAllData();
  };

  // Custom tooltip formatter for charts
  const tooltipFormatter = (value) => {
    return [`$${value.toLocaleString()}`, "Amount"];
  };

  // Combined chart data
  const combinedChartData = saleByMonth.map(sale => {
    const expenseEntry = expenseByMonth.find(exp => exp.month === sale.month);
    return {
      month: sale.month,
      sale: sale.sale,
      expense: expenseEntry ? expenseEntry.expense : 0,
      profit: sale.sale - (expenseEntry ? expenseEntry.expense : 0)
    };
  });

  // Handle card selection
  const handleCardSelect = (index) => {
    setSelectedCardIndex(index);
    message.success(`បានជ្រើសរើសផ្ទាំង "${index >= 0 && index < dashboard.length ? dashboard[index].title : 'ក្រាហ្វិក'}"`, 1);
  };

  // Handle chart selection
  const handleChartSelect = (chartType) => {
    setSelectedCardIndex(chartType);
    message.success(`បានជ្រើសរើសក្រាហ្វិក "${chartType}"`, 1);
  };

  // Get the currently selected element reference
  const getSelectedElementRef = () => {
    if (selectedCardIndex === null) return null;

    // For summary cards
    if (typeof selectedCardIndex === 'number' && selectedCardIndex >= 0 && selectedCardIndex < dashboard.length) {
      return cardRefs.current[selectedCardIndex];
    }

    // For charts
    if (selectedCardIndex === 'combinedChart') return chartRefs.current.combinedChart;
    if (selectedCardIndex === 'salesTrendChart') return chartRefs.current.salesTrendChart;
    if (selectedCardIndex === 'expenseTrendChart') return chartRefs.current.expenseTrendChart;

    return null;
  };

  // Get the title of the selected element
  const getSelectedElementTitle = () => {
    if (selectedCardIndex === null) return "";

    // For summary cards
    if (typeof selectedCardIndex === 'number' && selectedCardIndex >= 0 && selectedCardIndex < dashboard.length) {
      return dashboard[selectedCardIndex].title;
    }

    // For charts
    if (selectedCardIndex === 'combinedChart') return "ទិដ្ឋភាពនៃការលក់និងចំណាយ";
    if (selectedCardIndex === 'salesTrendChart') return "និន្នាការលក់";
    if (selectedCardIndex === 'expenseTrendChart') return "និន្នាការចំណាយ";

    return "";
  };

  return (
    <div className="home-page" style={{ padding: "20px", backgroundColor: "#f0f2f5" }}>
      {/* Dashboard Header */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col span={14}>
          <h1 style={{ fontSize: 28, margin: 0, color: "#1a3353", fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif" }}>
            ផ្ទាំងគ្រប់គ្រងអាជីវកម្ម
          </h1>
          <p style={{ color: "#666", fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif" }}>
            ទិដ្ឋភាពទូលំទូលាយនៃដំណើរការអាជីវកម្មរបស់អ្នក
          </p>
        </Col>
        <Col span={10} style={{ textAlign: "right" }}>
          {/* Individual printing buttons (only shown when a card is selected) */}
          {selectedCardIndex !== null && (
            <>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => handleDownloadIndividualPDF(getSelectedElementRef(), getSelectedElementTitle())}
                style={{ marginRight: 8, backgroundColor: "#1a3353" }}
              >
                <span style={{ fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif" }}>
                  ទាញយក PDF ជ្រើសរើស
                </span>
              </Button>
              <Button
                type="default"
                icon={<PrinterOutlined />}
                onClick={() => handlePrintIndividual(getSelectedElementRef(), getSelectedElementTitle())}
                style={{ marginRight: 16 }}
              >
                <span style={{ fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif" }}>
                  បោះពុម្ពជ្រើសរើស
                </span>
              </Button>
              <Button
                type="dashed"
                onClick={() => setSelectedCardIndex(null)}
                style={{ marginRight: 8 }}
              >
                <span style={{ fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif" }}>
                  បិទការជ្រើសរើស
                </span>
              </Button>
            </>
          )}

          {/* Regular buttons for all content */}
          {selectedCardIndex === null && (
            <>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleDownloadAllPDF}
                style={{ marginRight: 8, backgroundColor: "#1a3353" }}
              >
                <span style={{ fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif" }}>
                  ទាញយក PDF
                </span>
              </Button>
              <Button
                type="default"
                icon={<PrinterOutlined />}
                onClick={handlePrintAll}
              >
                <span style={{ fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif" }}>
                  បោះពុម្ព
                </span>
              </Button>
            </>
          )}
        </Col>
      </Row>

      {/* Keyboard shortcut instructions */}
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <p style={{ fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif", color: "#1a3353" }}>
          ចុច Ctrl+3 ដើម្បីជ្រើសរើសផ្ទាំងមួយៗសម្រាប់ការបោះពុម្ព ឬទាញយក PDF
        </p>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 20, backgroundColor: "#fff", borderRadius: 8 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <DatePicker.RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              style={{ width: "100%" }}
              format="YYYY-MM-DD"
              allowClear={true}
            />
          </Col>
          <Col>
            <Button
              type="primary"
              onClick={handleSearch}
              icon={<BsSearch />}
              loading={isLoading}
            >
              <span style={{ fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif" }}>
                ស្វែងរក
              </span>
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Dashboard Content */}
      <div id="dashboard-content" ref={dashboardRef}>
        {/* Summary Cards */}
        <Row gutter={[16, 16]}>
          {dashboard.length > 0 ? dashboard.map((item, index) => (
            <Col xs={24} sm={12} md={8} lg={8} xl={8} key={index}>
              <Card
                ref={cardRefs.current[index]}
                style={{
                  height: 200,
                  borderRadius: 8,
                  background: `linear-gradient(135deg, ${COLORS[index % COLORS.length]}33, ${COLORS[index % COLORS.length]}22)`,
                  border: selectedCardIndex === index ?
                    `2px solid ${COLORS[index % COLORS.length]}` :
                    `1px solid ${COLORS[index % COLORS.length]}44`,
                  boxShadow: selectedCardIndex === index ? '0 0 10px rgba(0,0,0,0.2)' : 'none',
                  position: 'relative'
                }}
                title={
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      {index === 0 && <UserOutlined style={{ marginRight: 8, fontSize: 20, color: COLORS[index % COLORS.length] }} />}
                      {index === 1 && <UserOutlined style={{ marginRight: 8, fontSize: 20, color: COLORS[index % COLORS.length] }} />}
                      {index === 2 && <UserOutlined style={{ marginRight: 8, fontSize: 20, color: COLORS[index % COLORS.length] }} />}
                      {index === 3 && <DollarOutlined style={{ marginRight: 8, fontSize: 20, color: COLORS[index % COLORS.length] }} />}
                      {index === 4 && <DollarOutlined style={{ marginRight: 8, fontSize: 20, color: COLORS[index % COLORS.length] }} />}
                      <span style={{
                        color: "#1a3353",
                        fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                        fontWeight: "bold"
                      }}>{item.title}</span>
                    </div>
                    <Dropdown
                      overlay={
                        <Menu>
                          <Menu.Item key="select" onClick={() => handleCardSelect(index)}>
                            <span style={{ fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif" }}>
                              ជ្រើសរើសដើម្បីបោះពុម្ព
                            </span>
                          </Menu.Item>
                          <Menu.Item key="print" onClick={() => handlePrintIndividual(cardRefs.current[index], item.title)}>
                            <span style={{ fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif" }}>
                              បោះពុម្ព
                            </span>
                          </Menu.Item>
                          <Menu.Item key="pdf" onClick={() => handleDownloadIndividualPDF(cardRefs.current[index], item.title)}>
                            <span style={{ fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif" }}>
                              ទាញយក PDF
                            </span>
                          </Menu.Item>
                        </Menu>
                      }
                      trigger={['click']}
                    >
                      <Button type="text" icon={<MoreOutlined />} />
                    </Dropdown>
                  </div>
                }
              >
                <div style={{ display: "flex", flexDirection: "column", height: "calc(100% - 40px)" }}>
                  {Object.entries(item.Summary).map(([key, value], idx) => (
                    <div key={idx} style={{ marginBottom: 10 }}>
                      <Row>
                        <Col span={12}>
                          <span style={{
                            color: "#666",
                            fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif"
                          }}>{key}:</span>
                        </Col>
                        <Col span={12} style={{ textAlign: "right" }}>
                          <span style={{
                            fontSize: idx === 0 ? 18 : 16,
                            fontWeight: idx === 0 ? "normal" : "bold",
                            color: idx === 0 ? "#666" : "#1a3353"
                          }}>
                            {/* Value is already formatted by processDashboardData */}
                            {value}
                          </span>
                        </Col>
                      </Row>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          )) : (
            <Col span={24}>
              <Empty
                description={
                  <span style={{
                    fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif"
                  }}>
                    មិនមានទិន្នន័យ
                  </span>
                }
              />
            </Col>
          )}
        </Row>

        {/* Charts Section */}
        <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
          {/* Combined Sales and Expenses Chart */}
          <Col span={24}>
            <Card
              ref={chartRefs.current.combinedChart}
              title={
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <BarChartOutlined style={{ marginRight: 8, fontSize: 20, color: "#1a3353" }} />
                    <span style={{
                      fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                      fontWeight: "bold"
                    }}>ទិដ្ឋភាពនៃការលក់និងចំណាយ</span>
                  </div>
                  <Dropdown
                    overlay={
                      <Menu>
                        <Menu.Item key="select" onClick={() => handleChartSelect('combinedChart')}>
                          <span style={{ fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif" }}>
                            ជ្រើសរើសដើម្បីបោះពុម្ព
                          </span>
                        </Menu.Item>
                        <Menu.Item key="print" onClick={() => handlePrintIndividual(chartRefs.current.combinedChart, "ទិដ្ឋភាពនៃការលក់និងចំណាយ")}>
                          <span style={{ fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif" }}>
                            បោះពុម្ព
                          </span>
                        </Menu.Item>
                        <Menu.Item key="pdf" onClick={() => handleDownloadIndividualPDF(chartRefs.current.combinedChart, "ទិដ្ឋភាពនៃការលក់និងចំណាយ")}>
                          <span style={{ fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif" }}>
                            ទាញយក PDF
                          </span>
                        </Menu.Item>
                      </Menu>
                    }
                    trigger={['click']}
                  >
                    <Button type="text" icon={<MoreOutlined />} />
                  </Dropdown>
                </div>
              }
              style={{
                borderRadius: 8,
                border: selectedCardIndex === 'combinedChart' ? '2px solid #1a3353' : '1px solid #e8e8e8',
                boxShadow: selectedCardIndex === 'combinedChart' ? '0 0 10px rgba(0,0,0,0.2)' : 'none'
              }}
            >
              {combinedChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={combinedChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                    <Tooltip formatter={tooltipFormatter} />
                    <Legend />
                    <Bar dataKey="sale" name="ការលក់" fill="#0088FE" />
                    <Bar dataKey="expense" name="ចំណាយ" fill="#FF8042" />
                    <Bar dataKey="profit" name="ប្រាក់ចំណេញ" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty
                  description={
                    <span style={{
                      fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif"
                    }}>
                      មិនមានទិន្នន័យ
                    </span>
                  }
                />
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
          {/* Sales Trend Line Chart */}
          <Col xs={24} lg={12}>
            <Card
              ref={chartRefs.current.salesTrendChart}
              title={
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <LineChartOutlined style={{ marginRight: 8, fontSize: 20, color: "#1a3353" }} />
                    <span style={{
                      fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                      fontWeight: "bold"
                    }}>
                      និន្នាការលក់
                    </span>
                  </div>
                  
                </div>
              }
              style={{ borderRadius: 8 }}
            >
              {saleByMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={saleByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                    <Tooltip formatter={tooltipFormatter} />
                    <Legend />
                    <Line type="monotone" dataKey="sale" name="ការលក់" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Empty
                  description={
                    <span style={{
                      fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif"
                    }}>
                      មិនមានទិន្នន័យ
                    </span>
                  }
                />
              )}
            </Card>
          </Col>

          {/* Expense Trend Line Chart */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <div style={{ display: "flex", alignItems: "center" }}>
                  <LineChartOutlined style={{ marginRight: 8, fontSize: 20, color: "#1a3353" }} />
                  <span style={{
                    fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                    fontWeight: "bold"
                  }}>
                    និន្នាការចំណាយ
                  </span>
                </div>
              }
              style={{ borderRadius: 8 }}
            >
              {expenseByMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={expenseByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                    <Tooltip formatter={tooltipFormatter} />
                    <Legend />
                    <Line type="monotone" dataKey="expense" name="ចំណាយ" stroke="#82ca9d" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Empty
                  description={
                    <span style={{
                      fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif"
                    }}>
                      មិនមានទិន្នន័យ
                    </span>
                  }
                />
              )}
            </Card>
          </Col>
        </Row>
      </div>

      <style jsx>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .home-page {
            padding: 0 !important;
            background-color: white !important;
          }
        }
        
        /* Add Khmer font import - make sure these fonts are available */
        @font-face {
          font-family: 'Khmer OS';
          src: url('/fonts/KhmerOS.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
        }
        
        @font-face {
          font-family: 'Khmer OS System';
          src: url('/fonts/KhmerOSsys.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
        }
        
        @font-face {
          font-family: 'Khmer OS Battambang';
          src: url('/fonts/KhmerOSbattambang.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
        }
      `}</style>
    </div>
  );
}

export default HomePage;