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
// import BillItem from "../../component/pos/BillItem";
import "./PosPage.module.css";
import { useReactToPrint } from "react-to-print";
import PrintInvoice from "../../component/pos/PrintInvoice";
import { getProfile } from "../../store/profile.store";
import { MdAddToPhotos } from "react-icons/md";
import { BsPrinter } from "react-icons/bs";
import { FiSearch } from "react-icons/fi";
import { FcDeleteRow } from "react-icons/fc";
import './PosPage.responsive.css';
import dayjs from 'dayjs';
import IntegratedInvoiceSidebar from "./IntegratedInvoiceSidebar";

function PosPage() {
  const [isDisabled, setIsDisabled] = useState(false);
  const { config } = configStore();
  const refInvoice = React.useRef(null);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
   const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [categories, setCategories] = useState([]);
  const [lastCheckoutTime, setLastCheckoutTime] = useState(0);
  const [customerDetail, setCustomerDetail] = useState({
    visible: false,
    loading: false,
    data: null,
  });
  const [invoiceBackup, setInvoiceBackup] = useState(null);
  const [backupTimestamp, setBackupTimestamp] = useState(null);
  const [showReprintModal, setShowReprintModal] = useState(false);
  const [printCompleted, setPrintCompleted] = useState(false);
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
    if (categories.length > 0 && state.list.length === 0) {
      getList();
    }
  }, [categories]);
  useEffect(() => {
    if (categories.length > 0) {
      updateCartActualPrices();
    }
  }, [categories]);

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
    customer_name: null,
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

  // ✅ Show unique customers instead of all products
  const getUniqueCustomers = () => {
    if (!state.list || state.list.length === 0) return [];

    const customerMap = new Map();

    state.list.forEach(product => {
      const customerId = product.customer_id;
      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          customer_id: customerId,
          customer_name: product.customer_name,
          customer_address: product.customer_address,
          customer_tel: product.customer_tel,
          // Aggregate product data for this customer
          products: [],
          totalQty: 0,
          categories: new Set()
        });
      }

      const customerData = customerMap.get(customerId);
      customerData.products.push(product);
      customerData.totalQty += product.qty || 0;
      customerData.categories.add(product.category_name);
    });

    return Array.from(customerMap.values());
  };

  const displayCustomers = getUniqueCustomers();

  const clearBackupAfterOneHour = useCallback(() => {
    const timer = setTimeout(() => {
      setInvoiceBackup(null);
      setBackupTimestamp(null);
      setPrintCompleted(false);
      message.info("Invoice backup cleared after 1 hour");
    }, 60 * 60 * 1000);

    return timer;
  }, []);

  const isBackupValid = useCallback(() => {
    if (!backupTimestamp) return false;
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    return backupTimestamp > oneHourAgo;
  }, [backupTimestamp]);

  useEffect(() => {
    if (backupTimestamp && !isBackupValid()) {
      setInvoiceBackup(null);
      setBackupTimestamp(null);
      setPrintCompleted(false);
    }
  }, [backupTimestamp, isBackupValid]);

  const fetchCategories = async () => {
    try {
      const { id } = getProfile();
      if (!id) {
        console.error("User ID is missing.");
        return;
      }
      const res = await request(`category/my-group`, "get");
      if (res && !res.error) {
        const categoriesData = res.list || [];
        setCategories(categoriesData);

      } else {
        console.error("Failed to fetch categories:", res?.error);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const getActualPriceByCategory = useCallback((categoryName) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category ? Number(category.actual_price) : 1;
  }, [categories]);


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
      const res = await request(`customer/my-group`, "get", param);
      if (res && !res.error) {
        const customers = (res.list || []).map((customer, i) => ({
          label: `${i + 1}. ${customer.name}`,
          value: customer.id,
          name: customer.name,
          address: customer.address,
          tel: customer.tel,
          index: i + 1,
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

  const getList = useCallback(async () => {
    var param = {
      ...filter,
      page: refPage.current,
      is_list_all: 1,
    };

    setState((pre) => ({ ...pre, loading: true }));

    const { id } = getProfile();
    if (!id) {
      setState((pre) => ({ ...pre, loading: false }));
      return;
    }

    try {
      const res = await request(`product/my-group`, "get", param);
      if (res && !res.error) {
        const products = res.list || [];
        const productsWithActualPrice = products.map(product => ({
          ...product,
          actual_price: getActualPriceByCategory(product.category_name)
        }));

        setState((pre) => ({
          ...pre,
          list: productsWithActualPrice,
          total: refPage.current == 1 ? productsWithActualPrice.length : pre.total,
          loading: false,
        }));
      } else {
        setState((pre) => ({ ...pre, loading: false }));
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setState((pre) => ({ ...pre, loading: false }));
    }
  }, [filter, getActualPriceByCategory]); // Fixed dependencies
  const onFilter = () => {
    getList();
  };

  const handleAdd = (item) => {
    if (!item.customer_id) {
      message.error("Missing customer information.");
      return;
    }
    if (state.cart_list.length > 0) {
      const existingCustomerId = state.cart_list[0].customer_id;
      if (existingCustomerId !== item.customer_id) {
        message.error("You can only sell to one customer at a time.");
        return;
      }
    }

    // Find the customer details from state.customers
    const selectedCustomer = state.customers.find(c => c.value === item.customer_id);
    if (!selectedCustomer) {
      message.error("Customer details not found.");
      return;
    }

    const existingCartItemIndex = state.cart_list.findIndex(
      cartItem => cartItem.customer_id === item.customer_id &&
        cartItem.category_name === item.category_name &&
        cartItem.id === item.id
    );

    if (existingCartItemIndex !== -1) {
      // ... existing quantity update logic ...
    } else {
      const newCartItem = {
        ...item,
        cart_qty: 1,
        customer_tel: item.customer_tel,         
        customer_address: item.customer_address,
         description: item.description || ''
      };

      setState(prev => ({
        ...prev,
        cart_list: [...prev.cart_list, newCartItem]
      }));

      // Set customer details from selectedCustomer
      if (state.cart_list.length === 0) {
        setObjSummary(prev => ({
          ...prev,
          customer_id: selectedCustomer.value,
          customer_name: selectedCustomer.name,
          customer_address: selectedCustomer.address,
          customer_tel: selectedCustomer.tel
        }));
      }

      message.success(`បានបន្ថែម ${item.category_name} ចូលទៅក្នុងវិក័យប័ត្រ`);
    }
  };
  const handleAddAllCustomerProducts = (customerData) => {
    if (!customerData.customer_id) {
      message.error("Missing customer information.");
      return;
    }

    if (state.cart_list.length > 0) {
      const existingCustomerId = state.cart_list[0].customer_id;
      if (existingCustomerId !== customerData.customer_id) {
        message.error("You can only sell to one customer at a time.");
        return;
      }
    }
    const allProductsOfCustomer = state.list.filter(p =>
      p.customer_id === customerData.customer_id && p.qty > 0
    );

    if (!allProductsOfCustomer.length) {
      message.error("No products found for this customer.");
      return;
    }
    const newCartItems = [];
    allProductsOfCustomer.forEach(product => {
      const existingIndex = state.cart_list.findIndex(cartItem =>
        cartItem.id === product.id && cartItem.customer_id === product.customer_id
      );

      if (existingIndex === -1) {
        newCartItems.push({
          ...product,
          cart_qty: product.qty,
        });
      }
    });

    if (newCartItems.length === 0) {
      message.warning("All products of this customer are already in the cart.");
      return;
    }

    setState(prev => ({
      ...prev,
      cart_list: [...prev.cart_list, ...newCartItems],
    }));

    if (state.cart_list.length === 0) {
      setObjSummary(prev => ({
        ...prev,
        customer_id: customerData.customer_id,
        customer_name: customerData.customer_name,
        customer_address: customerData.customer_address,
        customer_tel: customerData.customer_tel
      }));
    }

    message.success(`បានបន្ថែម ${newCartItems.length} ផលិតផលរបស់ ${customerData.customer_name} ចូលក្នុងវិក័យប័ត្រ`);
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

    if (printCompleted) {
      setInvoiceBackup(null);
      setBackupTimestamp(null);
      setPrintCompleted(false);
    }

    form.resetFields();
    fetchCustomers();
  };

  const handleViewDetail = async (customer_id) => {
    const { id: user_id } = getProfile();
    setCustomerDetail(prev => ({ ...prev, loading: true, visible: true }));

    try {
      // ✅ Corrected: Include customer_id in the URL path
      const res = await request(`customer-products/my-group/${customer_id}`, 'get');

      if (res && !res.error) {
        setCustomerDetail({
          visible: true,
          loading: false,
          data: res.data,
        });
      } else {
        // Check if it's a 404 error specifically
        if (res && res.status === 404) {
          message.error({
            content: "រកមិនឃើញព័ត៌មានអតិថិជននេះទេ។ សូមពិនិត្យមើលម្តងទៀត។",
            duration: 5,
          });
        } else {
          message.error({
            content: "មានបញ្ហាក្នុងការទាញយកព័ត៌មានអតិថិជន។ សូមព្យាយាមម្តងទៀត។",
            duration: 5,
          });
        }
        setCustomerDetail(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error("Error fetching customer detail:", error);

      // Handle different types of errors
      if (error.response && error.response.status === 404) {
        message.error({
          content: "មិនអាចរកឃើញអតិថិជននេះទេ។ អាចជាព័ត៌មានត្រូវបានលុប ឬមិនមានសិទ្ធិចូលដំណើរការ។",
          duration: 6,
        });
      } else if (error.response && error.response.status === 403) {
        message.error({
          content: "អ្នកមិនមានសិទ្ធិមើលព័ត៌មានអតិថិជននេះទេ។",
          duration: 5,
        });
      } else {
        message.error({
          content: "មានបញ្ហាក្នុងការភ្ជាប់ទៅកាន់ម៉ាស៊ីនមេ។ សូមពិនិត្យអ៊ីនធឺណិត និងព្យាយាមម្តងទៀត។",
          duration: 5,
        });
      }

      setCustomerDetail(prev => ({ ...prev, loading: false }));
    }
  };

  const handleCalSummary = useCallback(() => {
    let total_qty = 0;
    let sub_total = 0;
    let total = 0;

    state.cart_list.forEach((item) => {
      const qty = item.cart_qty || 0;
      const unit_price = item.unit_price || 0;
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
  }, [state.cart_list, getActualPriceByCategory]); // Fixed dependencies

  const filteredCustomers = displayCustomers.filter(customerData => {
    const searchTerm = filter.txt_search.toLowerCase();
    return (
      customerData.customer_name?.toLowerCase().includes(searchTerm) ||
      Array.from(customerData.categories).some(category =>
        category?.toLowerCase().includes(searchTerm)
      )
    );
  });

  const updateCartActualPrices = useCallback(() => {
    if (categories.length > 0 && state.cart_list.length > 0) {
      const updatedCartList = state.cart_list.map(item => ({
        ...item,
        actual_price: getActualPriceByCategory(item.category_name)
      }));

      // Only update if there are actual changes
      const hasChanges = updatedCartList.some((item, index) =>
        item.actual_price !== state.cart_list[index].actual_price
      );

      if (hasChanges) {
        setState(prev => ({
          ...prev,
          cart_list: updatedCartList
        }));
      }
    }
  }, [categories, state.cart_list, getActualPriceByCategory]);
  const handleRemoveCartItem = (index) => {
    const newCartList = [...state.cart_list];
    newCartList.splice(index, 1);

    setState(prev => ({
      ...prev,
      cart_list: newCartList
    }));

    // If cart becomes empty, reset customer info
    if (newCartList.length === 0) {
      setObjSummary(prev => ({
        ...prev,
        customer_id: null,
        customer_name: null,
        customer_address: null,
        customer_tel: null
      }));
    }
  };


const handleClickOut = async () => {
  // ✅ 1. ពិនិត្យ Cart មិនទទេ
  if (!state.cart_list.length) {
    message.error("Cart is empty!");
    return;
  }

  // ✅ 2. ការពារ Double-Click (ចាំបាច់បំផុត!)
  if (isCheckingOut) {
    message.warning("កំពុងដំណើរការ... សូមរង់ចាំ!");
    return;
  }

  // ✅ 3. ការពារ Rapid Clicking (2 វិនាទី)
  const now = Date.now();
  if (now - lastCheckoutTime < 2000) {
    message.warning("សូមរង់ចាំ 2 វិនាទីមុននឹងចុចម្តងទៀត!");
    return;
  }

  // ✅ 4. ពិនិត្យ Location
  if (selectedLocations.length === 0) {
    message.error("Please select at least one location/branch!");
    return;
  }

  // ✅ 5. ពិនិត្យ Stock
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

  // ✅ 6. LOCK ដំណើរការ (សំខាន់ណាស់!)
  setIsCheckingOut(true);
  setLastCheckoutTime(now);

  try {
    // ✅ 7. រៀបចំ Order Details
    const order_details = state.cart_list.map((item) => {
      const qty = Number(item.cart_qty) || 0;
      const price = Number(item.unit_price) || 0;
      const discount = Number(item.discount) || 0;
      const total = qty * price * (1 - discount / 100);

      return {
        product_id: item.id,
        qty: qty,
        price: price,
        discount: discount,
        total: total,
      };
    });

    // ✅ 8. រៀបចំ Customer Info
    const customerInfo = {
      customer_id: objSummary.customer_id || null,
      customer_name: objSummary.customer_name || state.cart_list[0]?.customer_name || null,
      customer_address: objSummary.customer_address || state.cart_list[0]?.customer_address || null,
      customer_tel: objSummary.customer_tel || state.cart_list[0]?.customer_tel || null,
    };

    // ✅ 9. រៀបចំ Order Request
    const param = {
      order: {
        ...customerInfo,
        locations: selectedLocations,
        user_id: Number(objSummary.user_id) || null,
        total_amount: Number(objSummary.total),
        payment_method: "Other",
        remark: objSummary.remark || "No remark",
        order_date: objSummary.order_date || dayjs().format('YYYY-MM-DD'),
        delivery_date: objSummary.delivery_date || objSummary.order_date || dayjs().format('YYYY-MM-DD'),
        receive_date: objSummary.receive_date || null
      },
      order_details: order_details,
    };

    // ✅ 10. ស្នើសុំបង្កើត Order
    const res = await request("order", "post", param);

    if (res && !res.error && res.order) {
      message.success("Order created successfully!");

      // ✅ 11. Update Summary
      const updatedSummary = {
        ...objSummary,
        ...customerInfo,
        order_no: res.order?.order_no,
        order_date: res.order?.order_date,
        delivery_date: res.order?.delivery_date
      };

      setObjSummary(updatedSummary);

      // ✅ 12. បង្កើត Backup សម្រាប់ Reprint
      const locationObjects = selectedLocations.map(locId => {
        const locInfo = config?.branch_select_loc?.find(b => b.value === locId);
        return {
          value: locId,
          label: locInfo?.label || locId
        };
      });

      const backup = {
        cart_list: [...state.cart_list],
        objSummary: updatedSummary,
        selectedLocations: locationObjects
      };

      setInvoiceBackup(backup);
      setBackupTimestamp(Date.now());
      setPrintCompleted(false);
      clearBackupAfterOneHour();

      setTimeout(() => {
        handlePrintInvoice();
      }, 1000);
    } else {
      message.error("Failed to create order. Please try again.");
    }
  } catch (error) {
    console.error("Order creation error:", error);
    message.error("Failed to create order. Please try again.");
  } finally {

    setTimeout(() => {
      setIsCheckingOut(false);
    }, 2000);
  }
};
  const handleTableKeyNavigation = useCallback((e, record, rowIndex) => {
    if (e.key === 'Enter') {
      handleAddAllCustomerProducts(record);
      e.preventDefault();
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const nextIndex = e.key === 'ArrowDown' ? rowIndex + 1 : rowIndex - 1;
      if (nextIndex >= 0 && nextIndex < filteredCustomers.length) {
        const nextRow = document.getElementById(`customer-row-${nextIndex}`);
        if (nextRow) nextRow.focus();
      }
      e.preventDefault();
    }
  }, [filteredCustomers, handleAddAllCustomerProducts]);

  const onBeforePrint = React.useCallback(() => {
    return Promise.resolve();
  }, []);
  const onAfterPrint = React.useCallback(() => {
    message.success("វិក័យប័ត្រត្រូវបាន Print បានជោគជ័យ!");
    setPrintCompleted(true);
    setTimeout(() => {
      handleClearCart();
    }, 1000);
  }, [handleClearCart]);
  const onPrintError = React.useCallback(() => {
    message.error("មានបញ្ហាក្នុងការ Print!");
    setPrintCompleted(false);
    setShowReprintModal(true);
  }, []);
  const handlePrintInvoice = useReactToPrint({
    contentRef: refInvoice,
    onBeforePrint: onBeforePrint,
    onAfterPrint: onAfterPrint,
    onPrintError: onPrintError,
    // បន្ថែម documentTitle ដើម្បីកំណត់ឈ្មោះ file ដោយស្វ័យប្រវត្តិ
    documentTitle: (() => {
      const customerName = objSummary.customer_name ||
        (state.cart_list[0]?.customer_name) ||
        "Customer";
      const orderNo = objSummary.order_no || "ORDER";
      const orderDate = objSummary.order_date ?
        dayjs(objSummary.order_date).format('DD/MM/YYYY') :
        dayjs().format('DD/MM/YYYY');

      // Format: "នី រតនា - INV666 - 04/09/2025"
      return `${customerName} - ${orderNo} - ${orderDate}`;
    })(),
  });

  const handleReprintInvoice = () => {
    if (invoiceBackup && isBackupValid()) {
      setState(prev => ({
        ...prev,
        cart_list: invoiceBackup.cart_list
      }));
      setObjSummary(invoiceBackup.objSummary);
      setSelectedLocations(invoiceBackup.selectedLocations.map(loc => loc.value));
      setTimeout(() => {
        handlePrintInvoice();
      }, 500);
      setShowReprintModal(false);
    } else {
      message.error("Invoice backup has expired or is not available");
      setInvoiceBackup(null);
      setBackupTimestamp(null);
      setPrintCompleted(false);
      setShowReprintModal(false);
    }
  };
  const handleQuantityChange = (newQty, itemId) => {
    if (!newQty || newQty < 0) newQty = 0;

    const newCartList = state.cart_list.map(item =>
      item.id === itemId
        ? { ...item, cart_qty: Number(newQty) }
        : item
    );

    setState(prev => ({ ...prev, cart_list: newCartList }));
  };

  const calculateCustomerProducts = (products) => {
    return (products || []).map(product => {
      const actualPrice = getActualPriceByCategory(product.category_name) || 1;
      const totalPrice = (product.qty * product.unit_price) / actualPrice;
      return {
        ...product,
        total_price: totalPrice
      };
    });
  };
  const customerProducts = customerDetail.data?.products
    ? calculateCustomerProducts(customerDetail.data.products)
    : [];
  const handlePriceChange = (newPrice, itemId) => {
    if (newPrice < 0) return;

    const newCartList = state.cart_list.map(item =>
      item.id === itemId
        ? { ...item, unit_price: newPrice }
        : item
    );

    setState(prev => ({ ...prev, cart_list: newCartList }));
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
      if (e.key === 'F3' && invoiceBackup && isBackupValid()) {
        setShowReprintModal(true);
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleClickOut, handleClearCart, invoiceBackup, isBackupValid]);

  useEffect(() => {
    handleCalSummary();
  }, [state.cart_list, handleCalSummary]);
  useEffect(() => {
    const initializeData = async () => {
      await fetchCategories();
      await fetchCustomers();
      await getList();
    };
    initializeData();
  }, []);
  useEffect(() => {
    updateCartActualPrices();
  }, [categories, updateCartActualPrices]);
  useEffect(() => {
    if (categories.length > 0) {
      getList();
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
  const columns = [
    {
      title: (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '2px'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#262626',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#1890ff',
              borderRadius: '50%'
            }} />
            អតិថិជន
          </div>
          <div style={{
            fontSize: '11px',
            color: '#8c8c8c',
            fontWeight: '400'
          }}>
            Customer
          </div>
        </div>
      ),
      dataIndex: "customer_name",
      key: "customer_name",
      width: 200,
      render: (text, record) => (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 0'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#1890ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px',
            boxShadow: '0 2px 4px rgba(24, 144, 255, 0.2)'
          }}>
            {text?.charAt(0) || "C"}
          </div>
          <div>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#262626',
              marginBottom: '2px'
            }}>
              {text || "N/A"}
            </div>
            <div style={{
              fontSize: '11px',
              color: '#8c8c8c'
            }}>
              ID: {record.customer_id}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#262626',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#52c41a',
              borderRadius: '50%'
            }} />
            ចំនួនផលិតផល
          </div>
          <div style={{
            fontSize: '11px',
            color: '#8c8c8c',
            fontWeight: '400'
          }}>
            Total Products
          </div>
        </div>
      ),
      key: "product_count",
      width: 150,
      align: 'center',
      render: (_, record) => {
        const productCount = record.products.length;
        const categoryCount = record.categories.size;

        return (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            padding: '8px'
          }}>
            <div style={{
              backgroundColor: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: '16px',
              padding: '4px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#52c41a'
              }}>
                {productCount}
              </span>
              <span style={{
                fontSize: '12px',
                color: '#389e0d'
              }}>
                ផលិតផល
              </span>
            </div>
            <div style={{
              fontSize: '10px',
              color: '#8c8c8c',
              backgroundColor: '#fafafa',
              padding: '2px 6px',
              borderRadius: '8px',
              border: '1px solid #f0f0f0'
            }}>
              {categoryCount} ប្រភេទ
            </div>
          </div>
        );
      },
    },
    {
      title: (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#262626',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#faad14',
              borderRadius: '50%'
            }} />
            បរិមាណសរុប
          </div>
          <div style={{
            fontSize: '11px',
            color: '#8c8c8c',
            fontWeight: '400'
          }}>
            Total QTY
          </div>
        </div>
      ),
      key: "total_qty",
      width: 140,
      align: 'center',
      render: (_, record) => (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px'
        }}>
          <div style={{
            backgroundColor: '#fff7e6',
            border: '1px solid #ffd666',
            borderRadius: '20px',
            padding: '6px 16px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(250, 173, 20, 0.1) 0%, rgba(255, 214, 102, 0.1) 100%)'
            }} />
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#d46b08'
              }}>
                {Number(record.totalQty).toLocaleString()}
              </span>
              <span style={{
                fontSize: '12px',
                color: '#ad6800',
                fontWeight: '500'
              }}>
                L
              </span>
            </div>
          </div>
          <div style={{
            fontSize: '10px',
            color: '#8c8c8c',
            backgroundColor: '#fafafa',
            padding: '2px 6px',
            borderRadius: '6px',
            border: '1px solid #f0f0f0'
          }}>
            ລິທ
          </div>
        </div>
      ),
    },
    {
      title: (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#262626',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#722ed1',
              borderRadius: '50%'
            }} />
            សកម្មភាព
          </div>
          <div style={{
            fontSize: '11px',
            color: '#8c8c8c',
            fontWeight: '400'
          }}>
            Actions
          </div>
        </div>
      ),
      key: "action",
      width: 180,
      align: 'center',
      render: (text, record) => (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '8px'
        }}>
          <Button
            type="primary"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleAddAllCustomerProducts(record);
            }}
            style={{
              height: '32px',
              borderRadius: '16px',
              fontWeight: '500',
              fontSize: '12px',
              background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
              border: 'none',
              boxShadow: '0 2px 4px rgba(24, 144, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 8px rgba(24, 144, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 4px rgba(24, 144, 255, 0.3)';
            }}
          >
            <MdAddToPhotos size={14} />
            Add All Products
          </Button>

          <Button
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetail(record.customer_id);
            }}
            style={{
              height: '28px',
              borderRadius: '14px',
              fontWeight: '400',
              fontSize: '11px',
              backgroundColor: '#fafafa',
              borderColor: '#d9d9d9',
              color: '#595959',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f0f0f0';
              e.target.style.borderColor = '#bfbfbf';
              e.target.style.color = '#262626';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#fafafa';
              e.target.style.borderColor = '#d9d9d9';
              e.target.style.color = '#595959';
            }}
          >
            <FiSearch size={12} />
            View Detail
          </Button>
        </div>
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
          objSummary={{
            ...objSummary,
            customer_name: objSummary.customer_name || "N/A",
            customer_address: objSummary.customer_address || "N/A",
            customer_tel: objSummary.customer_tel || "N/A"
          }}
          selectedLocations={locationObjects}
        />
      </div>
      <Modal
        title={
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 0',
            borderBottom: '1px solid #f0f0f0',
            marginBottom: '16px'
          }}>
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
              {customerDetail.data?.customer?.name?.charAt(0) || "C"}
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#262626' }}>
                {customerDetail.data?.customer?.name || "N/A"}
              </div>
              <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                អតិថិជនលេខ: {customerDetail.data?.customer?.id || "N/A"}
              </div>
            </div>
          </div>
        }
        open={customerDetail.visible}
        onCancel={() => setCustomerDetail({ visible: false, data: null, loading: false })}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setCustomerDetail({ visible: false, data: null, loading: false })}
            style={{ minWidth: '80px' }}
          >
            បិទ
          </Button>
        ]}
        width={1000}
        centered
        bodyStyle={{ padding: '20px' }}
      >
        {customerDetail.loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '200px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div className="loading-spinner" style={{
                width: '40px',
                height: '40px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #1890ff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
              }} />
              <div style={{ color: '#8c8c8c' }}>កំពុងទាញយកទិន្នន័យ...</div>
            </div>
          </div>
        ) : (
          <div>
            <div style={{
              backgroundColor: '#fafafa',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #f0f0f0'
            }}>
              <Row gutter={[16, 12]}>
                <Col xs={24} sm={12} md={8}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#52c41a',
                      borderRadius: '50%'
                    }} />
                    <span style={{ fontWeight: '500', color: '#595959' }}>អាសយដ្ឋាន:</span>
                  </div>
                  <div style={{ marginTop: '4px', color: '#262626' }}>
                    {customerDetail.data?.customer?.address || "មិនបានបញ្ជាក់"}
                  </div>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#1890ff',
                      borderRadius: '50%'
                    }} />
                    <span style={{ fontWeight: '500', color: '#595959' }}>លេខទូរស័ព្ទ:</span>
                  </div>
                  <div style={{ marginTop: '4px', color: '#262626' }}>
                    {customerDetail.data?.customer?.tel || "មិនបានបញ្ជាក់"}
                  </div>
                </Col>
              </Row>
            </div>
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
              <Col xs={12} sm={6}>
                <div style={{
                  backgroundColor: '#fff2e8',
                  border: '1px solid #ffbb96',
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d46b08' }}>
                    {customerDetail.data?.summary?.total_categories || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                    ប្រភេទសរុប
                  </div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{
                  backgroundColor: '#f6ffed',
                  border: '1px solid #b7eb8f',
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                    {Number(customerDetail.data?.summary?.total_quantity || 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                    បរិមាណសរុប (L)
                  </div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{
                  backgroundColor: '#fff1f0',
                  border: '1px solid #ffa39e',
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#cf1322' }}>
                    {(() => {
                      let total = 0;
                      if (customerDetail.data?.products && categories.length > 0) {
                        customerDetail.data.products.forEach(item => {
                          const actualPrice = getActualPriceByCategory(item.category_name) || 1;
                          total += (item.qty * item.unit_price) / actualPrice;
                        });
                      }
                      return `$${Number(total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    })()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                    តម្លៃសរុប
                  </div>
                </div>
              </Col>

            </Row>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid #f0f0f0'
            }}>
              <div style={{
                backgroundColor: '#fafafa',
                padding: '12px 16px',
                borderBottom: '1px solid #f0f0f0',
                fontWeight: '600',
                color: '#262626'
              }}>
                បញ្ជីផលិតផលលម្អិត
              </div>
              <Table
                dataSource={customerProducts}
                rowKey="id"
                size="small"
                pagination={false}
                scroll={{ x: 800 }}
                columns={[
                  {
                    title: (
                      <div style={{ fontWeight: '600' }}>
                        <div>ប្រភេទ</div>
                        <div style={{ fontSize: '11px', fontWeight: '400', color: '#8c8c8c' }}>
                          Category
                        </div>
                      </div>
                    ),
                    dataIndex: 'category_name',
                    key: 'category_name',
                    width: 150,
                    render: (text) => {
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
                      const colors = getCategoryColor(text);
                      return (
                        <Tag
                          style={{
                            backgroundColor: colors.bg,
                            borderColor: colors.border,
                            color: colors.text,
                            margin: 0
                          }}
                        >
                          {text}
                        </Tag>
                      );
                    }
                  },
                  {
                    title: (
                      <div style={{ fontWeight: '600', textAlign: 'center' }}>
                        <div>បរិមាណ</div>
                        <div style={{ fontSize: '11px', fontWeight: '400', color: '#8c8c8c' }}>
                          Quantity (L)
                        </div>
                      </div>
                    ),
                    dataIndex: 'qty',
                    key: 'qty',
                    width: 120,
                    align: 'center',
                    render: (qty) => (
                      <div style={{
                        fontWeight: '600',
                        color: qty > 0 ? '#52c41a' : '#ff4d4f',
                        backgroundColor: qty > 0 ? '#f6ffed' : '#fff2f0',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        display: 'inline-block'
                      }}>
                        {Number(qty || 0).toLocaleString()} L
                      </div>
                    )
                  },
                  {
                    title: (
                      <div style={{ fontWeight: '600', textAlign: 'right' }}>
                        <div>តម្លៃតោន</div>
                        <div style={{ fontSize: '11px', fontWeight: '400', color: '#8c8c8c' }}>
                          Ton Price
                        </div>
                      </div>
                    ),
                    dataIndex: 'unit_price',
                    key: 'unit_price',
                    width: 120,
                    align: 'right',
                    render: (price) => (
                      <div style={{ fontWeight: '500', color: '#262626' }}>
                        ${Number(price || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </div>
                    )
                  },
                  {
                    title: (
                      <div style={{ fontWeight: '600', textAlign: 'right' }}>
                        <div>តម្លៃសរុប</div>
                        <div style={{ fontSize: '11px', fontWeight: '400', color: '#8c8c8c' }}>
                          Total Price
                        </div>
                      </div>
                    ),
                    dataIndex: 'total_price',
                    key: 'total_price',
                    width: 130,
                    align: 'right',
                    render: (totalPrice) => (
                      <div style={{
                        fontWeight: '600',
                        color: '#1890ff',
                        backgroundColor: '#f0f5ff',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        display: 'inline-block'
                      }}>
                        ${Number(totalPrice || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </div>
                    )
                  }
                ]}
                locale={{
                  emptyText: (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                      <div style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }}>
                        📦
                      </div>
                      <div style={{ color: '#8c8c8c' }}>
                        មិនមានផលិតផលសម្រាប់អតិថិជននេះទេ
                      </div>
                    </div>
                  )
                }}
              />
            </div>
          </div>
        )}
      </Modal>
      <style jsx>{`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .loading-spinner {
    animation: spin 1s linear infinite;
  }
`}</style>
      <Modal
        title="Print បរាជ័យ - តើអ្នកចង់ Print ម្តងទៀតទេ?"
        open={showReprintModal}
        onOk={handleReprintInvoice}
        onCancel={() => setShowReprintModal(false)}
        okText="Print ម្តងទៀត"
        cancelText="បោះបង់"
        centered
      >
        <div style={{ padding: '20px 0' }}>
          <p>វិក័យប័ត្រមិនត្រូវបាន Print បានជោគជ័យទេ។</p>
          <p>តើអ្នកចង់ព្យាយាម Print ម្តងទៀតទេ?</p>
          <p style={{ color: '#1890ff', marginTop: '10px' }}>
            💡 ជំនួយ: អ្នកអាចចុច F3 ដើម្បី Print ម្តងទៀតបាន
          </p>
        </div>
      </Modal>
      <Row gutter={[16, 16]} style={{ margin: 0 }}>
        <Col
          xs={24}
          sm={24}
          md={14}
          lg={14}
          style={{ padding: '0 8px' }}
        >
          <div className="enhanced-pos-table" style={{ overflowX: 'auto', marginTop: 8 }}>
            {/* Enhanced page header */}
            <div className="enhanced-page-header">
              <div className="khmer-text">
                ផលិតផល/ {state.total}
                {invoiceBackup && (
                  <Button
                    type="link"
                    icon={<BsPrinter />}
                    onClick={() => setShowReprintModal(true)}
                    style={{
                      marginLeft: 16,
                      color: '#1890ff',
                      borderRadius: '16px',
                      fontSize: '12px',
                      height: '28px'
                    }}
                  >
                    Print ម្តងទៀត (F3)
                  </Button>
                )}
              </div>

              {/* Enhanced category buttons */}
              <div className="category-buttons-container">
                {Object.keys(categoryTotals).map((category) => (
                  <Button
                    key={category}
                    className="category-button"
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
                      backgroundColor: getCategoryColor(category).bg,
                      borderColor: getCategoryColor(category).border,
                      color: getCategoryColor(category).text
                    }}
                  >
                    {category} ({categoryTotals[category].toLocaleString()}L)
                  </Button>
                ))}
              </div>

              {/* Enhanced search container */}
              <div className="enhanced-search-container">
                <Input.Search
                  style={{ flex: 1, minWidth: 200 }}
                  onChange={(e) => setFilter(p => ({ ...p, txt_search: e.target.value }))}
                  allowClear
                  placeholder="ស្វែងរកអតិថិជន ឬ ប្រភេទផលិតផល..."
                  onSearch={getList}
                  size="large"
                />
                <Button
                  onClick={onFilter}
                  type="primary"
                  icon={<FiSearch />}
                  size="large"
                  style={{
                    background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                    border: 'none',
                    borderRadius: '20px',
                    fontWeight: '500'
                  }}
                >
                  Search
                </Button>
              </div>
            </div>
          </div>
          <div style={{ overflowX: 'auto', marginTop: 8 }}>
            <Table
              dataSource={filteredCustomers}
              columns={columns} // Use the enhanced columns from the first artifact
              loading={state.loading}
              pagination={false}
              rowKey="customer_id"
              onRow={(record, rowIndex) => ({
                tabIndex: 0,
                id: `customer-row-${rowIndex}`,
                style: { cursor: 'pointer' },
                onClick: () => handleAddAllCustomerProducts(record),
                onKeyDown: (e) => handleTableKeyNavigation(e, record, rowIndex)
              })}
              locale={{
                emptyText: (
                  <div style={{
                    padding: '60px 40px',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
                    borderRadius: '8px',
                    margin: '20px'
                  }}>
                    <div style={{
                      fontSize: '64px',
                      marginBottom: '16px',
                      opacity: 0.6
                    }}>
                      🔍
                    </div>
                    <div style={{
                      fontSize: '16px',
                      color: '#8c8c8c',
                      marginBottom: '8px',
                      fontWeight: '500'
                    }}>
                      រកមិនឃើញអតិថិជន
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#bfbfbf'
                    }}>
                      សូមព្យាយាមស្វែងរកជាមួយពាក្យគន្លឹះផ្សេង
                    </div>
                  </div>
                )
              }}
              rowClassName={(record, index) =>
                index % 2 === 0 ? 'table-row-light' : 'table-row-dark'
              }
            />
          </div>

          {/* Add this CSS to your component or CSS file */}
          <style jsx>{`
  .table-row-light {
    background-color: #ffffff;
  }
  
  .table-row-dark {
    background-color: #fafafa;
  }
  
  .enhanced-pos-table .ant-table-tbody > tr.table-row-light:hover,
  .enhanced-pos-table .ant-table-tbody > tr.table-row-dark:hover {
    background-color: #f8f9ff !important;
  }
`}</style>
        </Col>
        <Col
          xs={24}
          sm={24}
          md={10}
          lg={10}
          style={{ padding: '0 8px' }}
        >
          <IntegratedInvoiceSidebar
            cartItems={state.cart_list}
            objSummary={objSummary}
            selectedLocations={selectedLocations}
            setSelectedLocations={setSelectedLocations}
            setObjSummary={setObjSummary}
            customers={state.customers}
            handleClearCart={handleClearCart}
            handleQuantityChange={handleQuantityChange}
            handlePriceChange={handlePriceChange}
            handleClickOut={handleClickOut}
            handleRemoveCartItem={handleRemoveCartItem} // Add this line
            isDisabled={isDisabled}
            invoiceBackup={invoiceBackup}
            setShowReprintModal={setShowReprintModal}
          />
        </Col>
      </Row>

    </MainPage>
  );
}
export default PosPage;
