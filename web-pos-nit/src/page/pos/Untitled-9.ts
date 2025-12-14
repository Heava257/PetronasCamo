import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  Col,
  Empty,
  Input,
  InputNumber,
  message,
  notification,
  Row,
  Select,
  Space,
  Table,
  Modal,
  Form,
  Tag,
  DatePicker,
  Divider,
} from "antd";
import { formatDateServer, request } from "../../util/helper";
import MainPage from "../../component/layout/MainPage";
import { configStore } from "../../store/configStore";
import BillItem from "../../component/pos/BillItem";
import styles from "./PosPage.module.css";
import { useReactToPrint } from "react-to-print";
import PrintInvoice from "../../component/pos/PrintInvoice";
import { getProfile } from "../../store/profile.store";
import { MdAddToPhotos } from "react-icons/md";
import { BsPrinter } from "react-icons/bs";
import { FiSearch } from "react-icons/fi";
import { FcDeleteRow } from "react-icons/fc";
import './PosPage.responsive.css';
import dayjs from 'dayjs';

function PosPage() {
  const [isDisabled, setIsDisabled] = useState(false);
  const { config } = configStore();
  const refInvoice = React.useRef(null);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [categories, setCategories] = useState([]); // ✅ Add categories state

  const [state, setState] = useState({
    list: [],
    customers: [],
    total: 0,
    loading: false,
    visibleModal: false,
    cart_list: []
  });

  const { id } = getProfile();

  useEffect(() => {
    setObjSummary((prev) => ({
      ...prev,
      user_id: id,
      order_date: dayjs().format("YYYY-MM-DD"),
    }));
  }, [id]);

  const [objSummary, setObjSummary] = useState({
    sub_total: 0,
    total_qty: 0,
    save_discount: 0,
    tax: 10,
    total: 0,
    customers: null,
    customer_id: null,
    customer_address: null,
    customer_tel: null,
    user_id: null,
    remark: null,
    order_no: null,
    order_date: null,
    delivery_date: null,
    receive_date: null,
  });

  const refPage = React.useRef(1);

  const [filter, setFilter] = useState({
    txt_search: "",
    category_id: "",
    brand: "",
  });

  const [form] = Form.useForm();
  const filteredProducts = state.list.filter((product) => product.qty > 0);

  // ✅ Function to fetch categories with actual_price
  const fetchCategories = async () => {
    try {
      const { id } = getProfile();
      if (!id) {
        console.error("User ID is missing.");
        return;
      }
      
      const res = await request(`category/${id}`, "get", { is_list_all: 1 });
      if (res && !res.error) {
        const categoriesData = res.list || [];
        setCategories(categoriesData);
        console.log("Categories fetched:", categoriesData); // Debug log
      } else {
        console.error("Failed to fetch categories:", res?.error);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  // ✅ Function to get actual_price by category name
  const getActualPriceByCategory = (categoryName) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category ? Number(category.actual_price) : 1; // Default to 1 if not found
  };

  const fetchCustomers = async () => {
    try {
      const { id } = getProfile();
      if (!id) {
        console.error("User ID is missing.");
        return;
      }
      const param = {
        ...filter,
        page: refPage.current,
        is_list_all: 1,
      };
      setState((prev) => ({ ...prev, loading: true }));
      const res = await request(`customer/${id}`, "get", param);
      if (res && !res.error) {
        const customers = (res.list || []).map((customer) => ({
          label: `${customer.name}`,
          value: customer.id,
          address: customer.address,
          tel: customer.tel,
        }));
        setState((prev) => ({ ...prev, customers, loading: false }));
      } else {
        console.error("Failed to fetch customers:", res?.error);
        setState((prev) => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const getList = async () => {
    var param = {
      ...filter,
      page: refPage.current,
      is_list_all: 1,
    };
    setState((pre) => ({ ...pre, loading: true }));
    const { id } = getProfile();
    if (!id) {
      return
    }
    const res = await request(`product/${id}`, "get", param);
    if (res && !res.error) {
      // ✅ Auto-assign actual_price from categories for ALL products
      const productsWithActualPrice = (res.list || []).map(product => ({
        ...product,
        actual_price: getActualPriceByCategory(product.category_name)
      }));
      
      // ✅ If only one product, handle add with actual_price already assigned
      if (productsWithActualPrice.length == 1) {
        handleAdd(productsWithActualPrice[0]); // Use the product with actual_price
        setState((pre) => ({ ...pre, loading: false }));
        return;
      }
      
      setState((pre) => ({
        ...pre,
        list: productsWithActualPrice,
        total: refPage.current == 1 ? res.total : pre.total,
        loading: false,
      }));
    }
  };

  const onFilter = () => {
    getList();
  };

  const handleLocationConfirm = () => {
    setDropdownVisible(false);
  };

  const handleAdd = (item) => {
    var cart_tmp = [...state.cart_list];
    var findIndex = cart_tmp.findIndex((row) => row.barcode === item.barcode);
    var isNoStock = false;

    // ✅ Ensure actual_price is properly set from category
    const actualPrice = getActualPriceByCategory(item.category_name);
    const itemWithActualPrice = {
      ...item,
      actual_price: actualPrice
    };

    if (findIndex === -1) {
      if (item.qty > 0) {
        cart_tmp.push({ ...itemWithActualPrice, cart_qty: 1 });
      } else {
        isNoStock = true;
      }
    } else {
      // ✅ Update existing item with correct actual_price
      cart_tmp[findIndex] = {
        ...cart_tmp[findIndex],
        actual_price: actualPrice,
        cart_qty: cart_tmp[findIndex].cart_qty + 1
      };
      
      if (item.qty < cart_tmp[findIndex].cart_qty) {
        isNoStock = true;
      }
    }

    if (isNoStock) {
      notification.error({
        message: "Warning",
        description: `No stock! Currently, quantity in stock available: ${item.qty}`,
        placement: "bottomRight",
        style: {
          backgroundColor: "hsl(359,100%,98%)",
          outline: "1px solid #ff4d4f",
        },
      });
      return;
    }

    setState((pre) => ({
      ...pre,
      cart_list: cart_tmp,
    }));
  };

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
    }));

    setSelectedLocations([]);
    setCurrentLocation(null);
    form.resetFields();
    fetchCustomers();
  };

  const handleCalSummary = useCallback(() => {
    let total_qty = 0;
    let sub_total = 0;
    let total = 0;

    state.cart_list.forEach((item) => {
      const qty = item.cart_qty || 0;
      const unit_price = item.unit_price || 0;
      // ✅ Ensure we get the latest actual_price for calculation
      const actual_price = item.actual_price || getActualPriceByCategory(item.category_name) || 1;

      const calculated_total = (qty * unit_price) / actual_price;
      sub_total += calculated_total;
      total_qty += qty;
    });

    total = sub_total;

    setObjSummary(prev => ({
      ...prev,
      total_qty: total_qty,
      sub_total: sub_total,
      total: total
    }));
  }, [state.cart_list, categories]);

  // ✅ Function to update actual_price for all cart items when categories change
  const updateCartActualPrices = useCallback(() => {
    if (categories.length > 0 && state.cart_list.length > 0) {
      const updatedCartList = state.cart_list.map(item => ({
        ...item,
        actual_price: getActualPriceByCategory(item.category_name)
      }));
      
      setState(prev => ({
        ...prev,
        cart_list: updatedCartList
      }));
    }
  }, [categories, state.cart_list]);

  const handleClickOut = async () => {
    if (!state.cart_list.length) {
      message.error("Cart is empty!");
      return;
    }

    if (selectedLocations.length === 0) {
      message.error("Please select at least one location/branch!");
      return;
    }

    let stockValidationPassed = true;
    let invalidItem = null;

    for (const item of state.cart_list) {
      if (item.cart_qty > item.qty) {
        stockValidationPassed = false;
        invalidItem = item;
        break;
      }
    }

    if (!stockValidationPassed) {
      notification.error({
        message: "បរិមាណមិនគ្រប់គ្រាន់",
        description: `${invalidItem.name} មានបរិមាណក្នុងស្តុកតែ ${invalidItem.qty} ប៉ុណ្ណោះ។ មិនអាចបង្កើត Invoice បានទេ។`,
        placement: "bottomRight",
        style: {
          backgroundColor: "hsl(359,100%,98%)",
          outline: "1px solid #ff4d4f",
        },
      });
      return;
    }

    var order_details = [];
    state.cart_list.forEach((item) => {
      const qty = Number(item.cart_qty) || 0;
      const price = Number(item.unit_price) || 0;
      const discount = Number(item.discount) || 0;

      var total = qty * price;
      if (discount > 0) {
        total = total - (total * discount / 100);
      }

      var objItem = {
        product_id: item.id,
        qty: qty,
        price: price,
        discount: discount,
        total: total,
      };
      order_details.push(objItem);
    });

    var param = {
      order: {
        customer_id: objSummary.customer_id || null,
        locations: selectedLocations,
        user_id: Number(objSummary.user_id) || null,
        total_amount: Number(objSummary.total),
        payment_method: "Other",
        remark: objSummary.remark || "No remark",
        order_date: objSummary.order_date || dayjs().format('YYYY-MM-DD'),
        delivery_date: objSummary.delivery_date || objSummary.order_date || dayjs().format('YYYY-MM-DD'),
        receive_date: objSummary.receive_date || null
      },
      order_details: order_details.map(item => ({
        ...item,
        total: item.qty * item.price * (1 - item.discount / 100)
      })),
    };

    try {
      const res = await request("order", "post", param);
      if (res && !res.error) {
        if (res.order) {
          message.success("Order created successfully!");
          setObjSummary((p) => ({
            ...p,
            order_no: res.order?.order_no,
            order_date: res.order?.order_date,
            delivery_date: res.order?.delivery_date
          }));
          setTimeout(() => {
            handlePrintInvoice();
          }, 1000);
        }
      }
    } catch (error) {
      message.error("Failed to create order. Please try again.");
    }
  };

  const handleBarcodeSubmit = useCallback((barcode) => {
    if (!barcode.trim()) return;

    const foundProduct = state.list.find(product => product.barcode === barcode.trim());

    if (foundProduct) {
      handleAdd(foundProduct);
      message.success(`Added ${foundProduct.name} to cart`);
    } else {
      message.error(`Product with barcode ${barcode} not found`);
    }

    setBarcodeInput("");
  }, [state.list, handleAdd]);

  const handleTableKeyNavigation = useCallback((e, record, rowIndex) => {
    if (e.key === 'Enter') {
      handleAdd(record);
      e.preventDefault();
    }

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const nextIndex = e.key === 'ArrowDown' ? rowIndex + 1 : rowIndex - 1;
      if (nextIndex >= 0 && nextIndex < filteredProducts.length) {
        const nextRow = document.getElementById(`product-row-${nextIndex}`);
        if (nextRow) nextRow.focus();
      }
      e.preventDefault();
    }
  }, [filteredProducts, handleAdd]);

  const onBeforePrint = React.useCallback(() => {
    return Promise.resolve();
  }, []);

  const onAfterPrint = React.useCallback(() => {
    handleClearCart();
  }, [handleClearCart]);

  const onPrintError = React.useCallback(() => {
  }, []);

  const handlePrintInvoice = useReactToPrint({
    contentRef: refInvoice,
    onBeforePrint: onBeforePrint,
    onAfterPrint: onAfterPrint,
    onPrintError: onPrintError,
  });

  const handleQuantityChange = (value, index) => {
    if (!value) {
      const newCartList = [...state.cart_list];
      newCartList[index].cart_qty = 0;
      setState((prev) => ({ ...prev, cart_list: newCartList }));
      return;
    }

    if (isNaN(value) || value < 0) return;

    const newCartList = [...state.cart_list];
    const item = newCartList[index];
    const availableStock = item.qty;

    if (value > availableStock) {
      notification.error({
        message: "បរិមាណមិនគ្រប់គ្រាន់",
        description: `${item.name} មានបរិមាណក្នុងស្តុកតែ ${availableStock} ប៉ុណ្ណោះ`,
        placement: "bottomRight",
        style: {
          backgroundColor: "hsl(359,100%,98%)",
          outline: "1px solid #ff4d4f",
        },
      });
      newCartList[index].cart_qty = availableStock;
    } else {
      newCartList[index].cart_qty = Number(value);
    }

    setState((prev) => ({ ...prev, cart_list: newCartList }));
  };

  const handlePriceChange = (value, index) => {
    if (value < 0) return;

    const newCartList = [...state.cart_list];
    newCartList[index] = { ...newCartList[index], unit_price: value };

    setState((prev) => ({ ...prev, cart_list: newCartList }));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key === 'a') {
        const inputElement = document.getElementById('barcode-scanner-input');
        if (inputElement) inputElement.focus();
        e.preventDefault();
      }

      if (e.key === 'F2') {
        handleClickOut();
        e.preventDefault();
      }

      if (e.key === 'Escape') {
        Modal.confirm({
          title: 'Are you sure you want to clear cart?',
          onOk: () => handleClearCart(),
        });
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleClickOut, handleClearCart]);

  useEffect(() => {
    handleCalSummary();
  }, [state.cart_list, handleCalSummary]);

  // ✅ Fetch categories first, then products and customers
  useEffect(() => {
    const initializeData = async () => {
      await fetchCategories(); // Fetch categories first
      await fetchCustomers();
      await getList(); // This will now use categories to set actual_price
    };
    
    initializeData();
  }, []);

  // ✅ Update cart items when categories are loaded/updated
  useEffect(() => {
    updateCartActualPrices();
  }, [categories, updateCartActualPrices]);

  // ✅ Re-fetch products when categories are loaded
  useEffect(() => {
    if (categories.length > 0) {
      getList(); // Re-fetch products with actual_price from categories
    }
  }, [categories]);

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      setIsDisabled(hours === 0 && minutes === 0);
    };
    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (config?.branch_select_loc?.length > 0 && !objSummary.user_id) {
      setObjSummary(prev => ({
        ...prev,
        user_id: config.branch_select_loc[0].value,
      }));
    }
  }, [config?.branch_select_loc]);

  const uniqueProducts = state.list || [];

  const columns = [
    {
      title: (
        <div className="table-header">
          <div className="khmer-text">លេខបាកូដ</div>
          <div className="english-text">Barcode</div>
        </div>
      ),
      dataIndex: "category_barcode",
      key: "barcode",
      render: (value) => <Tag className="barcode-tag" color="cyan">{value}</Tag>,
    },
    {
      key: "name",
      title: (
        <div className="table-header">
          <div className="khmer-text">ឈ្មោះ</div>
          <div className="english-text">Name</div>
        </div>
      ),
      dataIndex: "name",
      render: (text) => {
        const displayText = text === "oil" ? "ប្រេងឥន្ធនៈ" : text;
        return (
          <div className="pos-row" title={displayText || ""}>
            {displayText || "N/A"}
          </div>
        );
      },
    },
    {
      title: (
        <div className="table-header">
          <div className="khmer-text">ប្រភេទ</div>
          <div className="english-text">Category Name</div>
        </div>
      ),
      dataIndex: "category_name",
      key: "category_name",
      render: (text) => <span className="khmer-title">{text}</span>,
    },
    {
      title: (
        <div className="table-header">
          <div className="khmer-text">ឯកតា</div>
          <div className="english-text">Unit</div>
        </div>
      ),
      dataIndex: "unit",
      key: "unit",
      render: (text) => <span className="pos-row">{text}</span>,
    },
    {
      title: (
        <div className="table-header">
          <div className="khmer-text">បរិមាណ</div>
          <div className="english-text">QTY</div>
        </div>
      ),
      dataIndex: "qty",
      key: "qty",
      render: (text) => <span className="pos-row">{text}</span>,
    },
    // ✅ Add actual_price column for debugging
    {
      title: (
        <div className="table-header">
          <div className="khmer-text">មេចែក</div>
          <div className="english-text">Actual Price</div>
        </div>
      ),
      dataIndex: "actual_price",
      key: "actual_price",
      render: (text) => <span className="pos-row">{Number(text).toLocaleString()}</span>,
    },
    {
      title: (
        <div className="table-header">
          <div className="khmer-text">សកម្មភាព</div>
          <div className="english-text">Action</div>
        </div>
      ),
      key: "action",
      render: (text, record) => (
        <Button className="add-to-cart-btn" onClick={() => handleAdd(record)} type="primary" icon={<MdAddToPhotos />}>
          Add to Cart
        </Button>
      ),
    },
  ];

  const locationObjects = selectedLocations.map(locId => {
    const locInfo = config?.branch_select_loc?.find(b => b.value === locId);
    return {
      value: locId,
      label: locInfo?.label || locId
    };
  });

  const calculateCategoryTotals = () => {
    const categoryTotals = {};

    state.list.forEach(item => {
      if (!categoryTotals[item.category_name]) {
        categoryTotals[item.category_name] = 0;
      }
      categoryTotals[item.category_name] += item.qty;
    });

    return categoryTotals;
  };

  const categoryTotals = calculateCategoryTotals();

  const calculateCategoryPrices = () => {
    const categoryPrices = {};

    state.list.forEach(item => {
      if (!categoryPrices[item.category_name]) {
        categoryPrices[item.category_name] = 0;
      }
      const actual_price = item.actual_price || getActualPriceByCategory(item.category_name) || 1;
      const itemTotal = (item.qty * item.unit_price) / actual_price;
      categoryPrices[item.category_name] += itemTotal;
    });

    return categoryPrices;
  };

  const categoryPrices = calculateCategoryPrices();

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  };

  const getCategoryColor = (category) => {
    const categoryColors = {
      'ហ្កាស(LPG)': { bg: '#fff8e6', border: '#ffd666', text: '#d46b08' },
      'ប្រេងសាំងធម្មតា(EA)': { bg: '#e6fffb', border: '#5cdbd3', text: '#08979c' },
      'ប្រេងម៉ាស៊ូត(Do)': { bg: '#f6ffed', border: '#b7eb8f', text: '#389e0d' },
      'ប្រេងសាំងស៊ុបពែរ(Super)': { bg: '#f0f5ff', border: '#adc6ff', text: '#1d39c4' },
      'default': { bg: '#fafafa', border: '#d9d9d9', text: '#434343' }
    };
    return categoryColors[category] || categoryColors['default'];
  };

  return (
    <MainPage loading={state.loading}>
      <div style={{ display: "none" }}>
        <PrintInvoice
          ref={refInvoice}
          cart_list={state.cart_list}
          objSummary={objSummary}
          selectedLocations={locationObjects}
        />
      </div>

      <Row gutter={[16, 16]} style={{ margin: 0 }}>
        <Col
          xs={24}
          sm={24}
          md={14}
          lg={14}
          style={{ padding: '0 8px' }}
        >
          <div className="pageHeader">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div className="khmer-text">ផលិតផល/ {state.total}</div>

              <Space wrap style={{ marginBottom: 8 }}>
                {Object.keys(categoryTotals).map((category) => (
                  <Button
                    key={category}
                    type="primary"
                    onClick={() => {
                      const filtered = state.list.filter(item => item.category_name === category);
                      filtered.forEach(item => {
                        if (item.qty > 0) {
                          handleAdd(item);
                        }
                      });
                      message.success(`Added all ${category} products to bill`);
                    }}
                    style={{
                      marginBottom: 4,
                      backgroundColor: getCategoryColor(category).bg,
                      borderColor: getCategoryColor(category).border,
                      color: getCategoryColor(category).text
                    }}
                  >
                    {category} ({categoryTotals[category].toLocaleString()}L)
                  </Button>
                ))}
              </Space>

              <Space wrap style={{ width: '100%' }}>
                <Input.Search
                  style={{ flex: 1, minWidth: 150 }}
                  onChange={(e) => setFilter(p => ({ ...p, txt_search: e.target.value }))}
                  allowClear
                  placeholder="Search"
                  onSearch={getList}
                />
                <Button onClick={onFilter} type="primary" icon={<FiSearch />}>
                  Search
                </Button>
              </Space>

            </Space>
          </div>

          <div style={{ overflowX: 'auto', marginTop: 8 }}>
            <Table
              dataSource={filteredProducts}
              columns={columns}
              loading={state.loading}
              pagination={false}
              rowKey="id"
              scroll={{ x: true }}
              onRow={(record, rowIndex) => ({
                tabIndex: 0,
                id: `product-row-${rowIndex}`,
                style: { cursor: 'pointer' },
                onClick: () => handleAdd(record),
                onKeyDown: (e) => handleTableKeyNavigation(e, record, rowIndex)
              })}
            />
          </div>
        </Col>

        <Col
          xs={24}
          sm={24}
          md={10}
          lg={10}
          style={{ padding: '0 8px' }}
        >
          <div style={{
            background: '#fff',
            padding: 16,
            borderRadius: 8,
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            height: '100%'
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontWeight: 'bold' }}>Items {state.cart_list.length}</div>
              <Button onClick={handleClearCart} icon={<FcDeleteRow />}>Clear</Button>
            </div>

            <div style={{
              maxHeight: 'calc(100vh - 500px)',
              minHeight: 100,
              overflowY: 'auto',
              marginBottom: 16
            }}>
              {state.cart_list?.map((item, index) => (
                <BillItem
                  key={index}
                  {...item}
                  index={index}
                  orderDate={objSummary.order_date}
                  deliveryDate={objSummary.delivery_date}
                  handleQuantityChange={handleQuantityChange}
                  handlePriceChange={handlePriceChange}
                />
              ))}
              {!state.cart_list.length && <Empty />}
            </div>

            <div className={styles.rowSummary}>
              <div className="khmer-title">បរិមាណសរុប</div>
              <div>
                {Number(objSummary.total_qty).toLocaleString()}
                {objSummary.total_qty >= 1000 ? (
                  <span>
                    លីត្រ (≈ {(objSummary.total_qty / 1000).toFixed(3)} តោន)
                  </span>
                ) : (
                  <span>លីត្រ</span>
                )}
              </div>
            </div>
            <div className={styles.rowSummary}>
              <div className="khmer-title">តម្លៃសរុបចុងក្រោយ</div>
              <div>${Number(objSummary.total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>

            <div style={{ marginTop: 16 }}>
              <Row gutter={[8, 8]}>
                <Col xs={24} sm={24} md={12}>
                  <Space.Compact style={{ width: '100%' }}>
                    <Select
                      mode="multiple"
                      style={{ width: '80%' }}
                      placeholder="Select Location"
                      options={config?.branch_select_loc}
                      value={selectedLocations}
                      onChange={(values) => {
                        setSelectedLocations(values);
                      }}
                      open={dropdownVisible}
                      onDropdownVisibleChange={(visible) => setDropdownVisible(visible)}
                    />
                    <Button
                      type="primary"
                      onClick={() => setDropdownVisible(false)}
                    >
                      OK
                    </Button>
                  </Space.Compact>
                </Col>

                <Col xs={24} sm={24} md={12}>
                  <Select
                    allowClear
                    style={{ width: "100%" }}
                    placeholder="Select Customer"
                    options={state.customers}
                    loading={state.loading}
                    value={objSummary.customer_id}
                    onSelect={(value, option) => {
                      setObjSummary(prev => ({
                        ...prev,
                        customer_id: value,
                        customer_name: option.label,
                        customer_address: option.address,
                        customer_tel: option.tel,
                      }));
                    }}
                  />
                </Col>

                {/* Remark & Date (100% width on all screens) */}
                <Col span={24}>
                  <Input.TextArea
                    placeholder="Remark"
                    rows={2}
                    onChange={(e) => setObjSummary(p => ({ ...p, remark: e.target.value }))}
                  />
                </Col>
                <Col span={24}>
                  <DatePicker
                    style={{ width: "100%" }}
                    placeholder="ថ្ងៃប្រគល់ទំនិញ (Order Date)"
                    format="DD/MM/YYYY"
                    // value={objSummary.delivery_date ? dayjs(objSummary.delivery_date) : null}
                    onChange={(date) =>
                      setObjSummary((p) => ({
                        ...p,
                         order_date: date ? date.format("YYYY-MM-DD") : null,
                      }))
                    }
                  />

                </Col>


                <Col span={24}>
                  <DatePicker
                    style={{ width: "100%" }}
                    placeholder="ថ្ងៃបញ្ជាទិញ (Delivery Date)"
                    format="DD/MM/YYYY"
                    onChange={(date) => setObjSummary(p => ({
                      ...p,
                      delivery_date: date ? date.format('YYYY-MM-DD') : null
                    }))}
                  />
                </Col>
                {/* <Col span={24}>
                  <DatePicker
                    style={{ width: "100%" }}
                    placeholder="ថ្ងៃទទួលទំនិញ (Receive Date)"
                    format="DD/MM/YYYY"
                    onChange={(date) => setObjSummary(p => ({
                      ...p,
                      receive_date: date ? date.format('YYYY-MM-DD') : null
                    }))}
                  />
                </Col> */}

                {/* Checkout Button (Full width) */}
                <Col span={24}>
                  <Button
                    disabled={isDisabled || state.cart_list.length == 0}
                    block
                    type="primary"
                    size="large"
                    onClick={handleClickOut}
                  >

                    Checkout
                  </Button>


                </Col>
              </Row>
            </div>
          </div>
        </Col>
      </Row>
    </MainPage>
  );

}

export default PosPage;