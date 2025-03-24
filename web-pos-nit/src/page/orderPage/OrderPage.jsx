// import { useEffect, useState } from "react";
// import {
//   Button,
//   DatePicker,
//   Form,
//   Input,
//   message,
//   Modal,
//   Select,
//   Space,
//   Table,
//   Tag,
// } from "antd";
// import { formatDateClient, formatDateServer, isPermission, request } from "../../util/helper";
// import MainPage from "../../component/layout/MainPage";
// import Style from "../../page/orderPage/OrderPage.module.css"
// import { configStore } from "../../store/configStore";
// import { GrFormView } from "react-icons/gr";
// import dayjs from "dayjs";
// import { BsSearch } from "react-icons/bs";
// import { LuUserRoundSearch } from "react-icons/lu";
// import { getProfile } from "../../store/profile.store";

// function OrderPage() {
//   const { config } = configStore();
//   const [formRef] = Form.useForm();
//   const [list, setList] = useState([]);
//   const [orderDetail, seOrderDetail] = useState([]);
//   const [summary, setSummary] = useState({ total_amount: 0, total_order: 0 });
//   const [loading, setLoading] = useState(false);
//   const [state, setState] = useState({
//     visibleModal: false,
//     id: null,
//     name: "",
//     descriptoin: "",
//     status: "",
//     parentId: null,
//     txtSearch: "",
//   });
//   const [filter, setFilter] = useState({
//     from_date: dayjs(),
//     to_date: dayjs(),
//     user_id: "", // Default empty
//   });

//   // This function fetches the orders list
//   // const getList = async () => {
//   //   setLoading(true);
//   //   try {
//   //     // Prepare query parameters for API call
//   //     const param = {
//   //       txtSearch: state.txtSearch,
//   //       from_date: formatDateServer(filter.from_date),
//   //       to_date: formatDateServer(filter.to_date),
//   //       user_id: filter.user_id || "",  // Send the selected user_id (if any)
//   //     };

//   //     console.log("API Request Params:", param);
//   //     const { id } = getProfile();
//   //           if (!id) return;
//   //     // Make a single API call to the orders endpoint - use a generic endpoint
//   //     // Your backend will handle the authorization logic
//   //     const res = await request(`order/${id}`, "get", param);

//   //     if (res) {
//   //       setList(res.list || []);
//   //       setSummary(res.summary || { total_amount: 0, total_order: 0 });
//   //     }
//   //   } catch (error) {
//   //     console.error("Error fetching list: ", error);
//   //     message.error("Failed to fetch order data");
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };


//   const getList = async () => {
//     setLoading(true);
//     try {
//       // Prepare query parameters for API call
//       const param = {
//         txtSearch: state.txtSearch,
//         from_date: formatDateServer(filter.from_date),
//         to_date: formatDateServer(filter.to_date),
//         user_id: filter.user_id || getProfile().id, // Use selected user_id or default to logged-in user
//       };


//       const res = await request(`order/${param.user_id}`, "get", param);

//       if (res) {
//         setList(res.list || []);
//         setSummary(res.summary || { total_amount: 0, total_order: 0 });
//       }
//     } catch (error) {
//       console.error("Error fetching list: ", error);
//       message.error("Failed to fetch order data");
//     } finally {
//       setLoading(false);
//     }
//   };


//   // Fetch data when filter changes
//   useEffect(() => {
//     getList();
//   }, [filter.user_id, filter.from_date, filter.to_date]);

//   // Fetch data when search text changes and search button is clicked
//   const handleSearch = () => {
//     getList();
//   };

//   const getOderdetail = async (data) => {
//     setLoading(true);
//     try {
//       const res = await request("order_detail/" + data.id, "get");
//       if (res) {
//         seOrderDetail(res.list || []);
//         setState({
//           ...state,
//           visibleModal: true,
//         });
//       }
//     } catch (error) {
//       console.error("Error fetching order details: ", error);
//       message.error("Failed to fetch order details");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const onCloseModal = () => {
//     formRef.resetFields();
//     setState({
//       ...state,
//       visibleModal: false,
//       id: null,
//     });
//   };

//   return (
//     <MainPage loading={loading}>
//       <div className="pageHeader">
//         <Space>
//           <div>
//             <div style={{ fontWeight: "bold" }}>Order</div>
//             <div>
//               Total:
//               <Tag color="green">
//                 {summary?.total_order ?? 0} order
//               </Tag>
//               <Tag color="blue">
//                 {summary?.total_amount
//                   ? new Intl.NumberFormat("en-US", {
//                     style: "currency",
//                     currency: "USD",
//                   }).format(summary.total_amount)
//                   : "$0.00"}
//               </Tag>
//             </div>

//           </div>
//           <Input.Search
//             onChange={(value) =>
//               setState((p) => ({ ...p, txtSearch: value.target.value }))
//             }
//             allowClear
//             onSearch={handleSearch}
//             placeholder="Search"
//           />
//           {isPermission("customer.create") && (
//             <DatePicker.RangePicker
//               allowClear={false}
//               defaultValue={[
//                 dayjs(filter.from_date, "DD/MM/YYYY"),
//                 dayjs(filter.to_date, "DD/MM/YYYY")
//               ]}
//               format={"DD/MM/YYYY"}
//               onChange={(value) => {
//                 if (value && value.length === 2) {
//                   setFilter((prev) => ({
//                     ...prev,
//                     from_date: value[0],
//                     to_date: value[1]
//                   }));
//                 }
//               }}
//             />
//           )}
//           {isPermission("customer.create") && (
//             <Select
//               style={{ width: 300 }}
//               allowClear
//               placeholder="Select User"
//               value={filter.user_id}
//               options={config?.user || []} // Assuming config.user has list of users
//               onChange={(value) => {
//                 console.log("Selected user ID:", value);
//                 setFilter((prev) => ({
//                   ...prev,
//                   user_id: value,
//                 }));
//               }}
//               suffixIcon={<LuUserRoundSearch />}
//             />

//           )}
//           <Button type="primary" onClick={handleSearch} icon={<BsSearch />}>
//             Filter
//           </Button>
//         </Space>
//       </div>
//       <Modal
//         open={state.visibleModal}
//         title="Invoice Details"
//         footer={null}
//         onCancel={onCloseModal}
//         width={800}
//         centered={true}
//         destroyOnClose={true}
//       >
//         <Table
//           dataSource={orderDetail}
//           columns={[
//             {
//               key: "product_name",
//               title: "Product",
//               dataIndex: "product_name",
//               render: (text, data) => (
//                 <div style={{ padding: "10px", backgroundColor: "#fff", borderRadius: "8px", boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)" }}>
//                   <div style={{ fontWeight: "bold", fontSize: "16px", color: "#333" }} className="khmer-text">
//                     {data.product_name}
//                   </div>
//                   <div style={{ color: "#777", fontSize: 12 }} className="khmer-text">
//                     {data.category_name}
//                   </div>
//                   <div style={{ color: "#777", fontSize: 12, marginTop: 4 }} className="khmer-text">
//                     Unit: {data.unit}
//                   </div>
//                 </div>
//               )
//             },
//             {
//               key: "total_quantity",
//               title: "Qty",
//               dataIndex: "total_quantity",
//               width: 80,
//               render: (text) => (
//                 <div style={{ textAlign: "center", fontWeight: "bold" }}>
//                   <Tag color="green">{text}</Tag>
//                 </div>
//               ),
//             },
//             {
//               key: "unit_price",
//               title: "Unit Price",
//               dataIndex: "unit_price",
//               width: 120,
//               render: (text) => {
//                 const formattedValue = parseFloat(text).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
//                 return (
//                   <div style={{ textAlign: "right", fontWeight: "bold" }}>
//                     <Tag color="pink">${formattedValue}</Tag>
//                   </div>
//                 );
//               },
//             },
//             // {
//             //   key: "discount",
//             //   title: "Discount",
//             //   dataIndex: "discount",
//             //   width: 100,
//             //   render: (text) => (
//             //     <div style={{ textAlign: "right" }}>
//             //       <Tag color="red">{text > 0 ? `${text}%` : '-'}</Tag>
//             //     </div>
//             //   ),
//             // },
//             {
//               key: "grand_total",
//               title: "Total",
//               dataIndex: "grand_total",
//               width: 120,
//               render: (text) => {
//                 const roundedValue = Math.round(parseFloat(text) || 0);
//                 const formattedValue = roundedValue.toLocaleString();
//                 return (
//                   <div style={{ textAlign: "right", fontWeight: "bold", color: "#333" }}>
//                     <Tag color="blue">${formattedValue}</Tag>
//                   </div>
//                 );
//               },
//             }
//           ]}
//           pagination={{
//             pageSize: 5,
//             showSizeChanger: true,
//             pageSizeOptions: ['5', '10', '20'],
//             showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
//           }}
//           rowKey="id"
//           style={{ marginTop: "20px" }}
//           rowClassName="table-row-hover"
//           summary={(pageData) => {
//             let totalAmount = 0;
//             pageData.forEach(({ grand_total }) => {
//               totalAmount += parseFloat(grand_total || 0);
//             });

//             const roundedTotal = Math.round(totalAmount);

//             return (
//               <>
//                 <Table.Summary.Row>
//                   <Table.Summary.Cell index={0} colSpan={4} style={{ textAlign: 'right', fontWeight: 'bold' }}>
//                     Grand Total:
//                   </Table.Summary.Cell>
//                   <Table.Summary.Cell index={1} style={{ textAlign: 'right' }}>
//                     <Tag color="blue" style={{ fontSize: '16px', padding: '4px 8px' }}>
//                       ${roundedTotal.toLocaleString()}
//                     </Tag>
//                   </Table.Summary.Cell>
//                 </Table.Summary.Row>
//               </>
//             );
//           }}
//           bordered
//           scroll={{ x: 'max-content' }}
//           loading={!orderDetail || orderDetail.length === 0}
//         />
//       </Modal>
//       <div>
//         <Tag className={Style.Tag_Style}>
//           <Table
//             rowClassName={() => "pos-row"}

//             dataSource={list}
//             columns={[
//               {
//                 key: "order_no",
//                 title: (
//                   <div className="table-header">
//                     <div className="khmer-text">លេខបញ្ជា</div>
//                     <div className="english-text">Order No</div>
//                   </div>
//                 ),
//                 dataIndex: "order_no",
//                 render: (value) => (
//                   <div>
//                     <Tag color="blue">{value}</Tag>
//                   </div>
//                 ),
//               },
//               {
//                 key: "customer",
//                 title: (
//                   <div className="table-header">
//                     <div className="khmer-text">អតិថិជន</div>
//                     <div className="english-text">Customer</div>
//                   </div>
//                 ),
//                 dataIndex: "customer_name",
//                 render: (value, data) => (
//                   <>
//                     <div style={{ fontWeight: "bold" }}>{data.customer_name}</div>
//                     <div>{data.customer_tel}</div>
//                     <div>{data.customer_address}</div>
//                   </>
//                 ),
//               },
//               {
//                 key: "Total",
//                 title: (
//                   <div className="table-header">
//                     <div className="khmer-text">សរុប</div>
//                     <div className="english-text">Total</div>
//                   </div>
//                 ),
//                 dataIndex: "total_amount",
//                 render: (value) => `$${Number(value).toFixed(2)}`,
//               },
//               {
//                 key: "Paid",
//                 title: (
//                   <div className="table-header">
//                     <div className="khmer-text">បានបង់</div>
//                     <div className="english-text">Paid</div>
//                   </div>
//                 ),
//                 dataIndex: "paid_amount",
//                 render: (value) => (
//                   <div style={{ color: "green", fontWeight: "bold" }}>
//                     ${Number(value).toFixed(2)}
//                   </div>
//                 ),
//               },
//               {
//                 key: "Due",
//                 title: (
//                   <div className="table-header">
//                     <div className="khmer-text">នៅសល់</div>
//                     <div className="english-text">Due</div>
//                   </div>
//                 ),
//                 dataIndex: "Due",
//                 render: (value, data) => (
//                   <Tag color="red">
//                     ${((Number(data.total_amount) - Number(data.paid_amount)) || 0).toFixed(2)}
//                   </Tag>
//                 ),
//               },
//               {
//                 key: "PaymentMethod",
//                 title: (
//                   <div className="table-header">
//                     <div className="khmer-text">វិធីបង់ប្រាក់</div>
//                     <div className="english-text">Payment Method</div>
//                   </div>
//                 ),
//                 dataIndex: "payment_method",
//                 render: (value) => (
//                   <div style={{ textAlign: "center" }}>
//                     <Tag color="green">{value}</Tag>
//                   </div>
//                 ),
//               },
//               {
//                 key: "Remark",
//                 title: (
//                   <div className="table-header">
//                     <div className="khmer-text">កំណត់សម្គាល់</div>
//                     <div className="english-text">Remark</div>
//                   </div>
//                 ),
//                 dataIndex: "remark",
//               },
//               {
//                 key: "User",
//                 title: (
//                   <div className="table-header">
//                     <div className="khmer-text">អ្នកប្រើប្រាស់</div>
//                     <div className="english-text">User</div>
//                   </div>
//                 ),
//                 dataIndex: "create_by",
//                 render: (value) => (
//                   <div>
//                     <Tag color="pink">{value}</Tag>
//                   </div>
//                 ),
//               },
//               {
//                 key: "Order_Date",
//                 title: (
//                   <div className="table-header">
//                     <div className="khmer-text">កាលបរិច្ឆេទបញ្ជាទិញ</div>
//                     <div className="english-text">Order Date</div>
//                   </div>
//                 ),
//                 dataIndex: "create_at",
//                 render: (value) => formatDateClient(value, "DD/MM/YYYY H:m A"),
//               },
//               {
//                 key: "Action",
//                 title: (
//                   <div className="table-header">
//                     <div className="khmer-text">សកម្មភាព</div>
//                     <div className="english-text">Action</div>
//                   </div>
//                 ),
//                 align: "center",
//                 render: (item, data, index) => (
//                   <Space>
//                     <Button
//                       type="primary"
//                       icon={<GrFormView />}
//                       onClick={() => getOderdetail(data, index)}
//                     />
//                   </Space>
//                 ),
//               },
//             ]}
//           />
//         </Tag>
//       </div>
//     </MainPage>
//   );
// }

// export default OrderPage;



import { useEffect, useState, useRef } from "react";
import {
  Button,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
} from "antd";
import { formatDateClient, formatDateServer, isPermission, request } from "../../util/helper";
import MainPage from "../../component/layout/MainPage";
import Style from "../../page/orderPage/OrderPage.module.css";
import { configStore } from "../../store/configStore";
import { GrFormView } from "react-icons/gr";
import { FiPrinter } from "react-icons/fi";
import { HiOutlineDocumentDownload } from "react-icons/hi";
import dayjs from "dayjs";
import { BsSearch } from "react-icons/bs";
import { LuUserRoundSearch } from "react-icons/lu";
import { getProfile } from "../../store/profile.store";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"

function OrderPage() {
  const printRef = useRef();
  const { config } = configStore();
  const [formRef] = Form.useForm();
  const [list, setList] = useState([]);
  const [orderDetail, setOrderDetail] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [summary, setSummary] = useState({ total_amount: 0, total_order: 0 });
  const [loading, setLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [state, setState] = useState({
    visibleModal: false,
    id: null,
    name: "",
    description: "",
    status: "",
    parentId: null,
    txtSearch: "",
  });
  const [filter, setFilter] = useState({
    from_date: dayjs(),
    to_date: dayjs(),
    user_id: "", // Default empty
  });

  const getList = async () => {
    setLoading(true);
    try {
      // Prepare query parameters for API call
      const param = {
        txtSearch: state.txtSearch,
        from_date: formatDateServer(filter.from_date),
        to_date: formatDateServer(filter.to_date),
        user_id: filter.user_id || getProfile().id, // Use selected user_id or default to logged-in user
      };

      const res = await request(`order/${param.user_id}`, "get", param);

      if (res) {
        setList(res.list || []);
        setSummary(res.summary || { total_amount: 0, total_order: 0 });
      }
    } catch (error) {
      console.error("Error fetching list: ", error);
      message.error("Failed to fetch order data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when filter changes
  useEffect(() => {
    getList();
  }, [filter.user_id, filter.from_date, filter.to_date]);

  // Fetch data when search text changes and search button is clicked
  const handleSearch = () => {
    getList();
  };

  const getOrderDetail = async (data) => {
    setLoading(true);
    try {
      const res = await request("order_detail/" + data.id, "get");
      if (res) {
        setOrderDetail(res.list || []);
        setSelectedOrder(data);
        setState({
          ...state,
          visibleModal: true,
        });
      }
    } catch (error) {
      console.error("Error fetching order details: ", error);
      message.error("Failed to fetch order details");
    } finally {
      setLoading(false);
    }
  };
  
  // Function to load order details without showing modal
  const loadOrderDetailForAction = async (data, action) => {
    setLoading(true);
    try {
      const res = await request("order_detail/" + data.id, "get");
      if (res) {
        setOrderDetail(res.list || []);
        setSelectedOrder(data);
        
        // Execute the requested action after loading data
        if (action === 'print') {
          setTimeout(() => {
            setIsPrinting(true);
            // Add a small delay to ensure the content is rendered before printing
            setTimeout(handlePrint, 300);
          }, 300);
        } else if (action === 'download') {
          handleDownloadPDF(data, res.list || []);
        }
      }
    } catch (error) {
      console.error("Error fetching order details: ", error);
      message.error("Failed to fetch order details");
    } finally {
      setLoading(false);
    }
  };

  const onCloseModal = () => {
    formRef.resetFields();
    setState({
      ...state,
      visibleModal: false,
      id: null,
    });
    setSelectedOrder(null);
  };

  // Handle print functionality with improved configuration
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Order_${selectedOrder?.order_no || "Details"}`,
    onBeforeGetContent: () => {
      return new Promise((resolve) => {
        setIsPrinting(true);
        setTimeout(resolve, 500);
      });
    },
    onAfterPrint: () => {
      message.success("Print successful!");
      setIsPrinting(false);
    },
    onPrintError: (error) => {
      console.error("Print error:", error);
      message.error("Print failed");
      setIsPrinting(false);
    },
    // Improve print styles
    pageStyle: `
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
          print-color-adjust: exact;
        }
        @page {
          size: auto;
          margin: 10mm;
        }
      }
    `,
    removeAfterPrint: true,
  });

  // Handle PDF download - can be called directly with order data
  const handleDownloadPDF = (order = selectedOrder, details = orderDetail) => {
    try {
      if (!order) {
        message.error("Order information not available");
        return;
      }
  
      const doc = new jsPDF();
  
      // Add company header
      doc.setFontSize(18);
      doc.text("INVOICE", 105, 15, { align: "center" });
  
      // Order information
      doc.setFontSize(10);
      doc.text(`Order No: ${order?.order_no || ""}`, 14, 30);
      doc.text(`Date: ${formatDateClient(order?.create_at, "DD/MM/YYYY H:mm A")}`, 14, 35);
      doc.text(`Customer: ${order?.customer_name || ""}`, 14, 40);
      doc.text(`Tel: ${order?.customer_tel || ""}`, 14, 45);
      doc.text(`Address: ${order?.customer_address || ""}`, 14, 50);
  
      // Create table for order details
      const tableColumn = ["Product", "Qty", "Unit Price", "Total"];
      const tableRows = [];
  
      details.forEach((item) => {
        const roundedTotal = Math.round(parseFloat(item.grand_total) || 0);
        const formattedUnitPrice = parseFloat(item.unit_price).toFixed(2);
  
        const productData = [
          item.product_name,
          item.total_quantity,
          `$${formattedUnitPrice}`,
          `$${roundedTotal.toLocaleString()}`,
        ];
        tableRows.push(productData);
      });
  
      // Calculate grand total
      let grandTotal = 0;
      details.forEach(({ grand_total }) => {
        grandTotal += parseFloat(grand_total || 0);
      });
      const roundedGrandTotal = Math.round(grandTotal);
  
      // Add table to document
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 60,
        theme: "grid",
        styles: { fontSize: 9 },
        headStyles: { fillColor: [66, 139, 202] },
      });
  
      // Add total row
      const finalY = doc.lastAutoTable.finalY || 60;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`Grand Total: $${roundedGrandTotal.toLocaleString()}`, 150, finalY + 10, { align: "right" });
  
      // Payment information
      doc.setFont("helvetica", "normal");
      doc.text(`Payment Method: ${order?.payment_method || ""}`, 14, finalY + 20);
      doc.text(`Paid Amount: $${Number(order?.paid_amount || 0).toFixed(2)}`, 14, finalY + 25);
      doc.text(`Due Amount: $${((Number(order?.total_amount) - Number(order?.paid_amount)) || 0).toFixed(2)}`, 14, finalY + 30);
  
      // Footer
      doc.text("Thank you for your business!", 105, finalY + 40, { align: "center" });
  
      // Save the PDF
      doc.save(`Order_${order?.order_no || "Details"}.pdf`);
      message.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF: ", error);
      message.error("Failed to download PDF");
    }
  };

  return (
    <MainPage loading={loading}>
      <div className="pageHeader">
        <Space>
          <div>
            <div style={{ fontWeight: "bold" }}>Order</div>
            <div>
              Total:
              <Tag color="green">
                {summary?.total_order ?? 0} order
              </Tag>
              <Tag color="blue">
                {summary?.total_amount
                  ? new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(summary.total_amount)
                  : "$0.00"}
              </Tag>
            </div>
          </div>
          <Input.Search
            onChange={(value) =>
              setState((p) => ({ ...p, txtSearch: value.target.value }))
            }
            allowClear
            onSearch={handleSearch}
            placeholder="Search"
          />
          {isPermission("customer.create") && (
            <DatePicker.RangePicker
              allowClear={false}
              defaultValue={[
                dayjs(filter.from_date, "DD/MM/YYYY"),
                dayjs(filter.to_date, "DD/MM/YYYY")
              ]}
              format={"DD/MM/YYYY"}
              onChange={(value) => {
                if (value && value.length === 2) {
                  setFilter((prev) => ({
                    ...prev,
                    from_date: value[0],
                    to_date: value[1]
                  }));
                }
              }}
            />
          )}
          {isPermission("customer.create") && (
            <Select
              style={{ width: 300 }}
              allowClear
              placeholder="Select User"
              value={filter.user_id}
              options={config?.user || []} // Assuming config.user has list of users
              onChange={(value) => {
                console.log("Selected user ID:", value);
                setFilter((prev) => ({
                  ...prev,
                  user_id: value,
                }));
              }}
              suffixIcon={<LuUserRoundSearch />}
            />
          )}
          <Button type="primary" onClick={handleSearch} icon={<BsSearch />}>
            Filter
          </Button>
        </Space>
      </div>
      
      {/* Printable Area - with improved styling and positioning */}
      <div 
        ref={printRef} 
        style={{
          display: isPrinting ? "block" : "none",
          width: "100%",
          padding: "20px",
          backgroundColor: "white", 
          position: "absolute",
          left: "0",
          top: "0",
          zIndex: isPrinting ? 1000 : -1000,
        }}
        className="print-content"
      >
        {selectedOrder && (
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ textAlign: "center", marginBottom: "20px" }}>INVOICE</h2>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <p><strong>Order No:</strong> {selectedOrder.order_no}</p>
                <p><strong>Date:</strong> {formatDateClient(selectedOrder.create_at, "DD/MM/YYYY H:mm A")}</p>
              </div>
              <div>
                <p><strong>Customer:</strong> {selectedOrder.customer_name}</p>
                <p><strong>Tel:</strong> {selectedOrder.customer_tel}</p>
                <p><strong>Address:</strong> {selectedOrder.customer_address}</p>
              </div>
            </div>
          </div>
        )}
        
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f0f0f0" }}>
              <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Product</th>
              <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "center" }}>Qty</th>
              <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right" }}>Unit Price</th>
              <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {orderDetail.map((item, index) => (
              <tr key={index}>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  <div style={{ fontWeight: "bold" }}>{item.product_name}</div>
                  <div style={{ fontSize: "12px", color: "#777" }}>{item.category_name}</div>
                  <div style={{ fontSize: "12px", color: "#777" }}>Unit: {item.unit}</div>
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "center" }}>{item.total_quantity}</td>
                <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right" }}>
                  ${parseFloat(item.unit_price).toFixed(2)}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right" }}>
                  ${Math.round(parseFloat(item.grand_total) || 0).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="3" style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right", fontWeight: "bold" }}>
                Grand Total:
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right", fontWeight: "bold" }}>
                ${Math.round(orderDetail.reduce((total, item) => total + parseFloat(item.grand_total || 0), 0)).toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
        
        {selectedOrder && (
          <div style={{ marginTop: "20px" }}>
            <p><strong>Payment Method:</strong> {selectedOrder.payment_method}</p>
            <p><strong>Paid Amount:</strong> ${Number(selectedOrder.paid_amount).toFixed(2)}</p>
            <p><strong>Due Amount:</strong> ${((Number(selectedOrder.total_amount) - Number(selectedOrder.paid_amount)) || 0).toFixed(2)}</p>
          </div>
        )}
        
        <div style={{ marginTop: "30px", textAlign: "center" }}>
          <p>Thank you for your business!</p>
        </div>
      </div>
      
      {/* Invoice Details Modal */}
      <Modal
        open={state.visibleModal}
        title="Invoice Details"
        footer={[
          <Button key="close" onClick={onCloseModal}>
            Close
          </Button>,
          <Button 
            key="print" 
            type="primary" 
            icon={<FiPrinter />} 
            onClick={() => {
              setIsPrinting(true);
              setTimeout(handlePrint, 500);
            }}
          >
            Print
          </Button>,
          <Button key="download" type="primary" icon={<HiOutlineDocumentDownload />} onClick={() => handleDownloadPDF()}>
            Download PDF
          </Button>,
        ]}
        onCancel={onCloseModal}
        width={800}
        centered={true}
        destroyOnClose={true}
      >
        <Table
          dataSource={orderDetail}
          columns={[
            {
              key: "product_name",
              title: "Product",
              dataIndex: "product_name",
              render: (text, data) => (
                <div style={{ padding: "10px", backgroundColor: "#fff", borderRadius: "8px", boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)" }}>
                  <div style={{ fontWeight: "bold", fontSize: "16px", color: "#333" }} className="khmer-text">
                    {data.product_name}
                  </div>
                  <div style={{ color: "#777", fontSize: 12 }} className="khmer-text">
                    {data.category_name}
                  </div>
                  <div style={{ color: "#777", fontSize: 12, marginTop: 4 }} className="khmer-text">
                    Unit: {data.unit}
                  </div>
                </div>
              )
            },
            {
              key: "total_quantity",
              title: "Qty",
              dataIndex: "total_quantity",
              width: 80,
              render: (text) => (
                <div style={{ textAlign: "center", fontWeight: "bold" }}>
                  <Tag color="green">{text}</Tag>
                </div>
              ),
            },
            {
              key: "unit_price",
              title: "Unit Price",
              dataIndex: "unit_price",
              width: 120,
              render: (text) => {
                const formattedValue = parseFloat(text).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                return (
                  <div style={{ textAlign: "right", fontWeight: "bold" }}>
                    <Tag color="pink">${formattedValue}</Tag>
                  </div>
                );
              },
            },
            {
              key: "grand_total",
              title: "Total",
              dataIndex: "grand_total",
              width: 120,
              render: (text) => {
                const roundedValue = Math.round(parseFloat(text) || 0);
                const formattedValue = roundedValue.toLocaleString();
                return (
                  <div style={{ textAlign: "right", fontWeight: "bold", color: "#333" }}>
                    <Tag color="blue">${formattedValue}</Tag>
                  </div>
                );
              },
            }
          ]}
          pagination={{
            pageSize: 5,
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '20'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
          }}
          rowKey="id"
          style={{ marginTop: "20px" }}
          rowClassName="table-row-hover"
          summary={(pageData) => {
            let totalAmount = 0;
            pageData.forEach(({ grand_total }) => {
              totalAmount += parseFloat(grand_total || 0);
            });

            const roundedTotal = Math.round(totalAmount);

            return (
              <>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={3} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    Grand Total:
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} style={{ textAlign: 'right' }}>
                    <Tag color="blue" style={{ fontSize: '16px', padding: '4px 8px' }}>
                      ${roundedTotal.toLocaleString()}
                    </Tag>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </>
            );
          }}
          bordered
          scroll={{ x: 'max-content' }}
          loading={!orderDetail || orderDetail.length === 0}
        />
      </Modal>
      
      {/* Orders Table */}
      <div>
        <Tag className={Style.Tag_Style}>
          <Table
            rowClassName={() => "pos-row"}
            dataSource={list}
            columns={[
              {
                key: "order_no",
                title: (
                  <div className="table-header">
                    <div className="khmer-text">លេខបញ្ជា</div>
                    <div className="english-text">Order No</div>
                  </div>
                ),
                dataIndex: "order_no",
                render: (value) => (
                  <div>
                    <Tag color="blue">{value}</Tag>
                  </div>
                ),
              },
              {
                key: "customer",
                title: (
                  <div className="table-header">
                    <div className="khmer-text">អតិថិជន</div>
                    <div className="english-text">Customer</div>
                  </div>
                ),
                dataIndex: "customer_name",
                render: (value, data) => (
                  <>
                    <div style={{ fontWeight: "bold" }}>{data.customer_name}</div>
                    <div>{data.customer_tel}</div>
                    <div>{data.customer_address}</div>
                  </>
                ),
              },
              {
                key: "Total",
                title: (
                  <div className="table-header">
                    <div className="khmer-text">សរុប</div>
                    <div className="english-text">Total</div>
                  </div>
                ),
                dataIndex: "total_amount",
                render: (value) => `$${Number(value).toFixed(2)}`,
              },
              {
                key: "Paid",
                title: (
                  <div className="table-header">
                    <div className="khmer-text">បានបង់</div>
                    <div className="english-text">Paid</div>
                  </div>
                ),
                dataIndex: "paid_amount",
                render: (value) => (
                  <div style={{ color: "green", fontWeight: "bold" }}>
                    ${Number(value).toFixed(2)}
                  </div>
                ),
              },
              {
                key: "Due",
                title: (
                  <div className="table-header">
                    <div className="khmer-text">នៅសល់</div>
                    <div className="english-text">Due</div>
                  </div>
                ),
                dataIndex: "Due",
                render: ( value, data) => (
                  <Tag color="red">
                    ${((Number(data.total_amount) - Number(data.paid_amount)) || 0).toFixed(2)}
                  </Tag>
                ),
              },
              {
                key: "PaymentMethod",
                title: (
                  <div className="table-header">
                    <div className="khmer-text">វិធីបង់ប្រាក់</div>
                    <div className="english-text">Payment Method</div>
                  </div>
                ),
                dataIndex: "payment_method",
                render: (value) => (
                  <div style={{ textAlign: "center" }}>
                    <Tag color="green">{value}</Tag>
                  </div>
                ),
              },
              {
                key: "Remark",
                title: (
                  <div className="table-header">
                    <div className="khmer-text">កំណត់សម្គាល់</div>
                    <div className="english-text">Remark</div>
                  </div>
                ),
                dataIndex: "remark",
              },
              {
                key: "User",
                title: (
                  <div className="table-header">
                    <div className="khmer-text">អ្នកប្រើប្រាស់</div>
                    <div className="english-text">User</div>
                  </div>
                ),
                dataIndex: "create_by",
                render: (value) => (
                  <div>
                    <Tag color="pink">{value}</Tag>
                  </div>
                ),
              },
              {
                key: "Order_Date",
                title: (
                  <div className="table-header">
                    <div className="khmer-text">កាលបរិច្ឆេទបញ្ជាទិញ</div>
                    <div className="english-text">Order Date</div>
                  </div>
                ),
                dataIndex: "create_at",
                render: (value) => formatDateClient(value, "DD/MM/YYYY H:m A"),
              },
              {
                key: "Action",
                title: (
                  <div className="table-header">
                    <div className="khmer-text">សកម្មភាព</div>
                    <div className="english-text">Action</div>
                  </div>
                ),
                align: "center",
                render: (item, data, index) => (
                  <Space>
                    <Tooltip title="View">
                      <Button
                        type="primary"
                        icon={<GrFormView />}
                        onClick={() => getOrderDetail(data, index)}
                      />
                    </Tooltip>
                    <Tooltip title="Print">
                      <Button
                        type="primary"
                        style={{ backgroundColor: "#52c41a" }}
                        icon={<FiPrinter />}
                        onClick={() => loadOrderDetailForAction(data, 'print')}
                      />
                    </Tooltip>
                    <Tooltip title="Download PDF">
                      <Button
                        type="primary"
                        style={{ backgroundColor: "#f5222d" }}
                        icon={<HiOutlineDocumentDownload />}
                        onClick={() => loadOrderDetailForAction(data, 'download')}
                      />
                    </Tooltip>
                  </Space>
                ),
              },
            ]}
          />
        </Tag>
      </div>
      
      {/* Add a style tag to handle print media queries */}
      <style>
        {`
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
            }
          }
        `}
      </style>
    </MainPage>
  );
}

export default OrderPage;