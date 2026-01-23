import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  Col,
  Input,
  message,
  Row,
  Table,
  Modal,
  Tag,
} from "antd";
import { request } from "../../util/helper";
import MainPage from "../../component/layout/MainPage";
import { configStore } from "../../store/configStore";
import { useReactToPrint } from "react-to-print";
import PrintInvoice from "../../component/pos/PrintInvoice";
import { getProfile } from "../../store/profile.store";
import { MdAddToPhotos } from "react-icons/md";
import { BsPrinter } from "react-icons/bs";
import { FiSearch } from "react-icons/fi";
import { FaBox } from "react-icons/fa";
import './PosPage.responsive.css';
import dayjs from 'dayjs';
import './PosPage.module.css';
import IntegratedInvoiceSidebar from "./IntegratedInvoiceSidebar";
import { useTranslation } from "../../locales/TranslationContext";
import './PosPage.stock.css'; // ✅ New modular styles

function PosPage() {
  const [isDisabled, setIsDisabled] = useState(false);
  const { config } = configStore();
  const refInvoice = React.useRef(null);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [categories, setCategories] = useState([]);
  const [lastCheckoutTime, setLastCheckoutTime] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const { t } = useTranslation();

  const [invoiceBackup, setInvoiceBackup] = useState(null);
  const [backupTimestamp, setBackupTimestamp] = useState(null);
  const [showReprintModal, setShowReprintModal] = useState(false);
  const [printCompleted, setPrintCompleted] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [stockStats, setStockStats] = useState([]); // ✅ Track fuel stocks

  const [state, setState] = useState({
    preOrders: [],
    customers: [],
    total: 0,
    loading: false,
    cart_list: [],
  });

  const [objSummary, setObjSummary] = useState({
    sub_total: 0,
    total_qty: 0,
    save_discount: 0,
    tax: 10,
    total: 0,
    customers: null,
    customer_id: null,
    customer_name: null,
    customer_address: null,
    customer_tel: null,
    user_id: null,
    remark: null,
    order_no: null,
    order_date: null,
    delivery_date: null,
    receive_date: null,
    pre_order_id: null, // ✅ Track which pre-order
    pre_order_no: null,
  });

  const [filter, setFilter] = useState({
    txt_search: "",
  });

  // ✅ PosPage.jsx - fetchPreOrders function

  const fetchPreOrders = useCallback(async () => {
    try {
      const res = await request("pre-order/list", "get");

      if (res && res.success && res.list) {
        // ✅ Filter only ready/confirmed pre-orders (NOT delivered)
        const readyOrders = res.list.filter(
          order => order.status === 'ready' || order.status === 'confirmed'
        );

        setState(prev => ({
          ...prev,
          preOrders: readyOrders,
          loading: false
        }));
      }
    } catch (error) {
      console.error("❌ Failed to fetch pre-orders:", error);
    }
  }, []);

  const fetchStockStats = useCallback(async () => {
    try {
      const res = await request("inventory/category-statistics", "get");
      if (res && res.success && res.data) {
        setStockStats(res.data);
      }
    } catch (error) {
      console.error("❌ Failed to fetch stock stats:", error);
    }
  }, []);

  const fetchCategories = async () => {
    try {
      const { id } = getProfile();
      if (!id) return;

      const res = await request(`category/my-group`, "get");
      if (res && !res.error) {
        setCategories(res.list || []);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { id } = getProfile();
      if (!id) return;

      const res = await request(`customer/my-group`, "get");

      if (res && !res.error) {
        const customers = (res.list || []).map((customer, i) => ({
          label: `${i + 1}. ${customer.name}`,
          value: customer.id,
          name: customer.name,
          address: customer.address,
          tel: customer.tel,
          index: i + 1,
        }));

        setState((prev) => ({ ...prev, customers }));
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    }
  };

  // ========== CART MANAGEMENT ==========

  const handleClearCart = () => {
    setState((p) => ({
      ...p,
      cart_list: []
    }));

    setObjSummary((p) => ({
      ...p,
      sub_total: 0,
      total_qty: 0,
      save_discount: 0,
      tax: 10,
      total: 0,
      customer_id: null,
      customer_address: null,
      customer_tel: null,
      remark: null,
      order_date: null,
      delivery_date: null,
      pre_order_id: null,
    }));

    setSelectedLocations([]);
    setSelectedLocation(null);
    setSelectedTruck(null);

    if (printCompleted) {
      setInvoiceBackup(null);
      setBackupTimestamp(null);
      setPrintCompleted(false);
    }
  };

  const handleLoadPreOrder = async (preOrder) => {
    try {
      handleClearCart();
      setState(prev => ({ ...prev, loading: true }));

      const res = await request(`pre-order/${preOrder.id}`, "get");

      if (res && res.success && res.data) {
        const orderDetails = res.data;


        // ✅ Use a louder and more reliable alert sound
        const audio = new Audio("https://cdn.pixabay.com/audio/2021/08/04/audio_0625c153b1.mp3");
        audio.volume = 1.0;

        let hasStockIssue = false;
        const issues = [];

        // ✅ Map with stock validation
        const newCartItems = orderDetails.details.map(item => {
          const reqQty = parseFloat(item.remaining_qty || item.qty);
          const availQty = parseFloat(item.available_qty || 0);

          if (reqQty > availQty) {
            hasStockIssue = true;
            issues.push(`${item.product_name} (ត្រូវការ: ${reqQty}L, មានត្រឹម: ${availQty}L)`);
          }

          // Get actual_price with priority
          let actual_price = 1000; // Default

          if (item.actual_price && item.actual_price > 0) {
            actual_price = parseFloat(item.actual_price);
          } else {
            const category = categories.find(cat => cat.name === item.category_name);
            if (category && category.actual_price) {
              actual_price = parseFloat(category.actual_price);
            }
          }

          return {
            id: item.product_id,
            name: item.product_name,
            category_name: item.category_name,
            selling_price: parseFloat(item.price),
            actual_price: actual_price,
            available_qty: availQty, // ✅ Pass to cart for further validation
            cart_qty: reqQty,
            amount: parseFloat(item.amount),
            unit: item.unit || "L",
            customer_id: orderDetails.customer_id,
            customer_name: orderDetails.customer_name,
            discount: item.discount || 0,
            description: item.description || "", // ✅ Preserve Batch Ref
            destination: item.destination || ""  // ✅ Capture Destination
          };
        });

        if (hasStockIssue) {
          audio.play().catch(e => console.log("Audio play blocked"));
          message.warning({
            content: (
              <div>
                <div style={{ fontWeight: 'bold', color: '#d4380d', marginBottom: '4px' }}>⚠️ ស្តុកមិនគ្រប់គ្រាន់ (Insufficient Stock)</div>
                {issues.map((msg, i) => <div key={i} style={{ fontSize: '12px' }}>- {msg}</div>)}
              </div>
            ),
            duration: 5
          });
          setState(prev => ({ ...prev, loading: false }));
          return; // ✅ STOP: Don't load if stock is insufficient
        }

        // ✅ UPDATE STATE WITH NEW CART ITEMS:
        // console.log("🔍 DEBUG: newCartItems with destinations:", newCartItems.map(i => ({ name: i.name, destination: i.destination })));
        setState(prev => ({
          ...prev,
          cart_list: newCartItems,
          loading: false
        }));

        // ✅ SET CUSTOMER INFO & PRE_ORDER_ID IN SUMMARY
        setObjSummary(prev => ({
          ...prev,
          customer_id: orderDetails.customer_id,
          customer_name: orderDetails.customer_name,
          customer_address: orderDetails.delivery_address || "",
          customer_tel: orderDetails.customer_tel || "",
          pre_order_id: orderDetails.id,
          pre_order_no: orderDetails.pre_order_no, // ✅ Capture Pre-Order Number
          order_date: dayjs().format("YYYY-MM-DD"), // ✅ Default to today for preview
          delivery_date: orderDetails.delivery_date
            ? dayjs(orderDetails.delivery_date).format("YYYY-MM-DD")
            : prev.delivery_date
        }));

        message.success(`✅ បានផ្ទុក Pre-Order សម្រាប់ ${orderDetails.customer_name}`);
      }
    } catch (error) {
      console.error("Error loading pre-order:", error);
      message.error("មិនអាចផ្ទុក Pre-Order បានទេ");
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleQuantityChange = (newQty, itemId) => {
    if (!newQty || newQty < 0) newQty = 0;

    // ✅ Use a louder and more reliable alert sound
    const audio = new Audio("https://cdn.pixabay.com/audio/2021/08/04/audio_0625c153b1.mp3");
    audio.volume = 1.0;

    const newCartList = state.cart_list.map(item => {
      if (item.id === itemId) {
        const availQty = parseFloat(item.available_qty || 0);
        const requestedQty = Number(newQty);

        if (requestedQty > availQty) {
          audio.play().catch(e => console.log("Audio play blocked"));
          message.warning({
            content: `⚠️ ស្តុកមិនគ្រប់គ្រាន់សម្រាប់ ${item.name} (មានត្រឹម ${availQty} L)`,
            key: 'stock_warning'
          });
          return { ...item, cart_qty: availQty }; // Snap back to max available
        }
        return { ...item, cart_qty: requestedQty };
      }
      return item;
    });

    setState(prev => ({ ...prev, cart_list: newCartList }));
  };

  // ✅ Add Destination Handler
  const handleDestinationChange = (newDest, itemId) => {
    const newCartList = state.cart_list.map(item => {
      if (item.id === itemId) {
        return { ...item, destination: newDest };
      }
      return item;
    });
    setState(prev => ({ ...prev, cart_list: newCartList }));
  };


  const handleRemoveCartItem = (index) => {
    const newCartList = [...state.cart_list];
    newCartList.splice(index, 1);

    setState(prev => ({
      ...prev,
      cart_list: newCartList
    }));

    if (newCartList.length === 0) {
      setObjSummary(prev => ({
        ...prev,
        customer_id: null,
        customer_name: null,
        customer_address: null,
        customer_tel: null,
        pre_order_id: null,
      }));
    }
  };

  // ✅ CORRECT: Calculate using selling_price AND discount
  const handleCalSummary = useCallback(() => {
    let total_qty = 0;
    let sub_total = 0;
    let total = 0;

    state.cart_list.forEach((item) => {
      const qty = Number(item.cart_qty) || 0;
      const selling_price = Number(item.selling_price) || 0;
      const actual_price = Number(item.actual_price) || 1;
      const discount = Number(item.discount || 0) / 100;

      // ✅ CORRECT FORMULA: (qty × selling_price × (1 - discount)) ÷ actual_price
      const calculated_total = (qty * selling_price * (1 - discount)) / actual_price;
      sub_total += calculated_total;
      total_qty += qty;
    });

    total = sub_total;
    setObjSummary(prev => ({ ...prev, total_qty, sub_total, total }));
  }, [state.cart_list]);

  // ========== CHECKOUT ==========
  // ✅ PosPage.jsx - handleClickOut function (around line 280)

  const handleClickOut = async () => {
    if (!state.cart_list.length) {
      message.error(t("cart_is_empty"));
      return;
    }

    if (!selectedLocation) {
      message.error("សូមជ្រើសរើសទីតាំងដឹកជញ្ជូន");
      return;
    }

    if (isCheckingOut) {
      message.warning("សូមរង់ចាំ...");
      return;
    }

    const now = Date.now();
    if (now - lastCheckoutTime < 2000) {
      message.warning("សូមរង់ចាំ 2 វិនាទី");
      return;
    }

    setIsCheckingOut(true);
    setLastCheckoutTime(now);

    try {
      const order_details = state.cart_list.map((item) => {
        const qty = Number(item.cart_qty) || 0;
        const price = Number(item.selling_price) || 0;
        const actualPrice = Number(item.actual_price) || 1;
        const discount = Number(item.discount) || 0;
        const total = (qty * price * (1 - discount / 100)) / actualPrice;

        return {
          product_id: item.id,
          qty: qty,
          price: price,
          discount: discount,
          total: total,
          actual_price: actualPrice,
          description: item.description || '',
          destination: item.destination || null // ✅ Add Destination Payload
        };
      });

      const customerInfo = {
        customer_id: objSummary.customer_id || null,
        customer_name: objSummary.customer_name || state.cart_list[0]?.customer_name || null,
        customer_address: objSummary.customer_address || state.cart_list[0]?.customer_address || null,
        customer_tel: objSummary.customer_tel || state.cart_list[0]?.customer_tel || null,
      };

      const param = {
        order: {
          ...customerInfo,
          location_id: selectedLocation,
          truck_id: selectedTruck,
          locations: selectedLocations,
          user_id: Number(objSummary.user_id) || null,
          total_amount: Number(objSummary.total),
          payment_method: "Other",
          remark: objSummary.remark || "No remark",
          order_date: objSummary.order_date || dayjs().format('YYYY-MM-DD'),
          delivery_date: objSummary.delivery_date || objSummary.order_date || dayjs().format('YYYY-MM-DD'),
          receive_date: objSummary.receive_date || null,
          pre_order_id: objSummary.pre_order_id || null, // ✅ IMPORTANT!
        },
        order_details: order_details,
      };


      const res = await request("order", "post", param);

      if (res && !res.error && res.order) {
        message.success("✅ Order បានបង្កើតជោគជ័យ!");


        // ✅ Update objSummary with pre_order_no from response
        const updatedSummary = {
          ...objSummary,
          ...customerInfo,
          order_no: res.order?.order_no,
          pre_order_no: res.order?.pre_order_no,  // ✅ ADD THIS
          order_date: res.order?.order_date,
          delivery_date: res.order?.delivery_date
        };

        setObjSummary(updatedSummary);

        // Refresh pre-orders list if this was from a pre-order
        if (objSummary.pre_order_id) {
          fetchPreOrders();
        }

        // ✅ Refresh stock after checkout
        fetchStockStats();

        setTimeout(() => {
          handlePrintInvoice();
        }, 1000);
      } else {
        message.error("មិនអាចបង្កើត Order បានទេ");
      }
    } catch (error) {
      console.error("Order creation error:", error);
      message.error("មិនអាចបង្កើត Order បានទេ");
    } finally {
      setTimeout(() => {
        setIsCheckingOut(false);
      }, 2000);
    }
  };

  // ========== PRINTING ==========

  const onBeforePrint = React.useCallback(() => {
    return Promise.resolve();
  }, []);

  const onAfterPrint = React.useCallback(() => {
    message.success("✅ Print ជោគជ័យ");
    setPrintCompleted(true);
    setTimeout(() => {
      handleClearCart();
    }, 1000);
  }, [handleClearCart]);

  const onPrintError = React.useCallback(() => {
    message.error("❌ Print បរាជ័យ");
    setPrintCompleted(false);
    setShowReprintModal(true);
  }, []);

  const handlePrintInvoice = useReactToPrint({
    contentRef: refInvoice,
    onBeforePrint: onBeforePrint,
    onAfterPrint: onAfterPrint,
    onPrintError: onPrintError,
    documentTitle: (() => {
      const customerName = objSummary.customer_name || "Customer";
      const orderNo = objSummary.order_no || "ORDER";
      const orderDate = objSummary.order_date ?
        dayjs(objSummary.order_date).format('DD/MM/YYYY') :
        dayjs().format('DD/MM/YYYY');

      return `${customerName} - ${orderNo} - ${orderDate}`;
    })(),
  });

  // ========== EFFECTS ==========

  useEffect(() => {
    handleCalSummary();
  }, [state.cart_list, handleCalSummary]);

  useEffect(() => {
    const initializeData = async () => {
      await fetchCategories();
      await fetchCustomers();
      await fetchPreOrders(); // ✅ Fetch pre-orders instead of inventory
      await fetchStockStats(); // ✅ Fetch fuel stocks
    };
    initializeData();
  }, []);

  // ========== TABLE COLUMNS ==========

  const filteredPreOrders = state.preOrders.filter(preOrder => {
    const searchTerm = filter.txt_search.toLowerCase();
    const matchesName = (preOrder.customer_name || "").toLowerCase().includes(searchTerm);
    const matchesOrderNo = (preOrder.pre_order_no || "").toLowerCase().includes(searchTerm);
    return matchesName || matchesOrderNo;
  });

  const columns = [
    {
      title: <span className="font-semibold">លេខប័ណ្ណ</span>,
      dataIndex: "pre_order_no",
      key: "pre_order_no",
      width: 180,
      fixed: 'left',
      render: (text) => (
        <Tag color="blue" style={{ fontSize: '13px', fontWeight: '600', padding: '4px 12px' }}>
          {text}
        </Tag>
      ),
    },
    {
      title: <span className="font-semibold">អតិថិជន</span>,
      dataIndex: "customer_name",
      key: "customer_name",
      width: 200,
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#1890ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '16px'
          }}>
            {text?.charAt(0) || "C"}
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>{text || "N/A"}</div>
            <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{record.customer_tel}</div>
          </div>
        </div>
      ),
    },
    {
      title: <span className="font-semibold">តម្លៃសរុប</span>,
      dataIndex: "total_amount",
      key: "total_amount",
      width: 140,
      align: 'right',
      render: (amount) => (
        <div style={{
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#52c41a',
          backgroundColor: '#f6ffed',
          padding: '6px 12px',
          borderRadius: '8px',
          display: 'inline-block'
        }}>
          ${Number(amount || 0).toFixed(2)}
        </div>
      ),
    },
    {
      title: <span className="font-semibold">Status</span>,
      dataIndex: "status",
      key: "status",
      width: 120,
      align: 'center',
      render: (status) => {
        const colors = {
          confirmed: { color: 'blue', text: 'បានបញ្ជាក់' },
          ready: { color: 'green', text: 'រៀបចំរួច' },
        };
        const statusInfo = colors[status] || { color: 'default', text: status };
        return (
          <Tag color={statusInfo.color} style={{ fontSize: '12px', fontWeight: '600' }}>
            {statusInfo.text}
          </Tag>
        );
      },
    },
    {
      title: <span className="font-semibold">សកម្មភាព</span>,
      key: "action",
      width: 150,
      align: 'center',
      fixed: 'right',
      render: (text, record) => (
        <Button
          type="primary"
          size="large"
          onClick={() => handleLoadPreOrder(record)}
          icon={<FaBox />}
          style={{
            borderRadius: '8px',
            fontWeight: '600',
            height: '40px'
          }}
        >
          ផ្ទុកទៅ Cart
        </Button>
      )
    }
  ];

  const locationObjects = selectedLocations.map(locId => {
    const locInfo = config?.branch_select_loc?.find(b => b.value === locId);
    return {
      value: locId,
      label: locInfo?.label || locId
    };
  });

  // ========== RENDER ==========

  return (
    <MainPage loading={state.loading}>
      {/* Hidden Print Invoice */}
      <div style={{ display: "none" }}>
        <PrintInvoice
          ref={refInvoice}
          cart_list={state.cart_list}
          objSummary={{
            ...objSummary,
            customer_name: objSummary.customer_name || "N/A",
            customer_address: objSummary.customer_address || "N/A",
            customer_tel: objSummary.customer_tel || "N/A"
          }}
          selectedLocations={locationObjects}
        />
      </div>

      {/* ✅ STOCK OVERVIEW SECTION */}
      {stockStats && stockStats.length > 0 && (
        <div className="stock-overview-container" style={{ margin: '8px 8px 16px 8px' }}>
          <div className="section-title" style={{ marginBottom: '16px' }}>
            <Tag color="cyan" style={{
              fontSize: '14px',
              fontWeight: 'bold',
              padding: '6px 16px',
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0 4px 12px rgba(6, 182, 212, 0.2)',
              background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
              color: 'white'
            }}>
              📊 បរិមាណស្តុកប្រេងបច្ចុប្បន្ន (Fuel Stock Summary)
            </Tag>
          </div>
          <Row gutter={[16, 16]}>
            {stockStats.map((item, idx) => {
              const stock = parseFloat(item.total_qty || 0);
              const isLow = stock <= 1000;

              // Fuel-specific colors
              const fuelType = item.product_name.toLowerCase();
              let gradient = 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)';
              let borderColor = 'rgba(226, 232, 240, 0.8)';
              let iconColor = '#64748b';

              if (fuelType.includes('ហ្កាស') || fuelType.includes('lpg')) {
                gradient = 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)';
                borderColor = '#fde68a';
                iconColor = '#b45309';
              } else if (fuelType.includes('សាំង') || fuelType.includes('gasoline')) {
                gradient = 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)';
                borderColor = '#bfdbfe';
                iconColor = '#1d4ed8';
              } else if (fuelType.includes('ម៉ាស៊ូត') || fuelType.includes('diesel')) {
                gradient = 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)';
                borderColor = '#bbf7d0';
                iconColor = '#15803d';
              }

              return (
                <Col key={idx} xs={24} sm={12} md={8} lg={6} xl={4}>
                  <div className={`stock-card ${isLow ? 'low-stock-pulse-glow' : ''}`} style={{
                    background: gradient,
                    backdropFilter: 'blur(12px)',
                    border: `2px solid ${borderColor}`,
                    padding: '16px',
                    borderRadius: '20px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    textAlign: 'center',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      fontSize: '11px',
                      color: iconColor,
                      fontWeight: '800',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      marginBottom: '8px'
                    }}>
                      {item.product_name}
                    </div>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: '900',
                      color: isLow ? '#ef4444' : '#1e293b',
                      lineHeight: '1'
                    }}>
                      {stock.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: '500' }}>L</span>
                    </div>
                    {isLow && (
                      <div style={{
                        marginTop: '8px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        color: '#ef4444',
                        background: '#fee2e2',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        display: 'inline-block'
                      }}>
                        ⚠️ ស្តុកទាប (Low Stock)
                      </div>
                    )}
                  </div>
                </Col>
              );
            })}
          </Row>
        </div>
      )}

      <Row gutter={[16, 16]} style={{ margin: 0 }}>
        {/* LEFT SIDE - Pre-Orders */}
        <Col xs={24} sm={24} md={14} lg={14} style={{ padding: '0 8px' }}>

          {/* Page Header */}
          <div className="enhanced-pos-table" style={{ overflowX: 'auto', marginTop: 8 }}>
            <div className="enhanced-page-header">
              <div className="khmer-text">
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                  📦 Pre-Orders រៀបចំរួច
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#8c8c8c' }}>
                  បញ្ជីកម្មង់ដែលរៀបចំរួចរាល់ហើយ
                </p>
              </div>

              {/* Search */}
              <div className="enhanced-search-container">
                <Input.Search
                  style={{ flex: 1, minWidth: 200 }}
                  onChange={(e) => setFilter(p => ({ ...p, txt_search: e.target.value }))}
                  allowClear
                  placeholder="ស្វែងរកតាមឈ្មោះ ឬ លេខប័ណ្ណ #..."
                  size="large"
                />
                <Button
                  onClick={fetchPreOrders}
                  type="primary"
                  icon={<FiSearch />}
                  size="large"
                >
                  ផ្ទុកឡើងវិញ
                </Button>
              </div>
            </div>
          </div>

          {/* ✅ Pre-Orders Table */}
          <div className="mt-2">
            <Table
              dataSource={filteredPreOrders}
              columns={columns}
              loading={state.loading}
              pagination={false}
              rowKey="id"
              scroll={{ x: 800 }}
              onRow={(record) => ({
                style: { cursor: 'pointer' },
                onClick: () => handleLoadPreOrder(record),
              })}
              locale={{
                emptyText: (
                  <div style={{ padding: '40px', textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
                    <div style={{ fontSize: '16px', color: '#8c8c8c', marginBottom: '8px' }}>
                      មិនមាន Pre-Order រៀបចំរួចទេ
                    </div>
                    <div style={{ fontSize: '13px', color: '#bfbfbf' }}>
                      Pre-Orders នឹងបង្ហាញនៅទីនេះបន្ទាប់ពី Status ជា "រៀបចំរួច"
                    </div>
                  </div>
                )
              }}
            />
          </div>
        </Col>

        {/* RIGHT SIDE - Cart */}
        <Col xs={24} sm={24} md={10} lg={10} style={{ padding: '0 8px' }}>
          <IntegratedInvoiceSidebar
            t={t}
            cartItems={state.cart_list}
            objSummary={objSummary}
            selectedLocations={selectedLocations}
            setSelectedLocations={setSelectedLocations}
            setObjSummary={setObjSummary}
            customers={state.customers}
            handleClearCart={handleClearCart}
            handleQuantityChange={handleQuantityChange}
            handleClickOut={handleClickOut}
            handleRemoveCartItem={handleRemoveCartItem}
            isDisabled={isDisabled}
            isCheckingOut={isCheckingOut}
            invoiceBackup={invoiceBackup}
            setShowReprintModal={setShowReprintModal}
            setShowPreviewModal={setShowPreviewModal}
            setState={setState}
            selectedLocation={selectedLocation}
            setSelectedLocation={setSelectedLocation}
            selectedTruck={selectedTruck}
            setSelectedTruck={setSelectedTruck}
          />
        </Col>
      </Row>

      {/* Reprint Modal */}
      <Modal
        title="Print បរាជ័យ - តើអ្នកចង់ Print ម្តងទៀតទេ?"
        open={showReprintModal}
        onCancel={() => setShowReprintModal(false)}
        footer={null}
      >
        <p>វិក័យប័ត្រមិនត្រូវបាន Print បានជោគជ័យទេ។</p>
        <p>តើអ្នកចង់ព្យាយាម Print ម្តងទៀតទេ?</p>
      </Modal>

      {/* ✅ Preview Modal */}
      <Modal
        title={<span className="khmer-text-bold">មើលវិក័យប័ត្រសាកល្បង (Preview Invoice)</span>}
        open={showPreviewModal}
        onCancel={() => setShowPreviewModal(false)}
        width={1000}
        footer={[
          <Button key="close" onClick={() => setShowPreviewModal(false)} className="khmer-text">
            បិទ (Close)
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={<BsPrinter />}
            onClick={() => {
              setShowPreviewModal(false);
              handlePrintInvoice();
            }}
            className="khmer-text"
          >
            បោះពុម្ព (Print)
          </Button>
        ]}
      >
        <div className="preview-container" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <PrintInvoice
            ref={refInvoice}
            cart_list={state.cart_list}
            objSummary={{
              ...objSummary,
              customer_name: objSummary.customer_name || "N/A",
              customer_address: objSummary.customer_address || "N/A",
              customer_tel: objSummary.customer_tel || "N/A"
            }}
            selectedLocations={locationObjects}
          />
        </div>
      </Modal>
    </MainPage>
  );
}

export default PosPage;