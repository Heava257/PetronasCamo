import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  DatePicker,
  Card,
  Statistic,
  Col,
  Row,
  Descriptions,
  Divider,
  Badge,
  Drawer,
  Collapse,
  Popconfirm,
  InputNumber,
  Typography
} from "antd";
import { formatDateClient, isPermission, request } from "../../util/helper";
import { MdSearch, MdOutlinePayment, MdRemoveRedEye, MdPayment, MdAttachMoney } from "react-icons/md";
import MainPage from "../../component/layout/MainPage";
import { configStore } from "../../store/configStore";
import { MdEdit, MdDelete } from "react-icons/md";
import dayjs from "dayjs";
import { getProfile } from "../../store/profile.store";
import { FaFileExcel, FaMoneyBillWave, FaUserTie, FaCalendarAlt, FaRegListAlt } from "react-icons/fa";
import { RiContactsLine, RiFileListLine } from "react-icons/ri";
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Upload } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { useTranslation } from '../../locales/TranslationContext'; 

import "./TotalDuePage.css";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

const cambodiaBanks = [
  { value: "aba", label: "ABA Bank" },
  { value: "acleda", label: "ACLEDA Bank" },
  { value: "canadia", label: "Canadia Bank" },
  { value: "wing", label: "Wing Bank" },
  { value: "truemoney", label: "True Money" },
  { value: "pipay", label: "Pi Pay" },
  { value: "bakong", label: "Bakong" }
];

function TotalDuePage() {
  const { t } = useTranslation(); 
  const { config } = configStore();
  const [formRef] = Form.useForm();
  const [editFormRef] = Form.useForm();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [customerDetailVisible, setCustomerDetailVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [excelExportLoading, setExcelExportLoading] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [profile, setProfile] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [bank, setBank] = useState(null);
  const [slipImages, setSlipImages] = useState([]);
  const [paymentDate, setPaymentDate] = useState(dayjs());
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editInvoiceData, setEditInvoiceData] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const userProfile = getProfile();
      setProfile(userProfile);
    };
    loadProfile();
  }, []);

  useEffect(() => {
    if (editInvoiceData && editFormRef) {
      const totalDue = editInvoiceData.product_details?.reduce((sum, item) =>
        sum + (parseFloat(item.due_amount) || 0), 0
      ) || 0;

      const totalPaid = editInvoiceData.product_details?.reduce((sum, item) =>
        sum + (parseFloat(item.paid_amount) || 0), 0
      ) || 0;

      editFormRef.setFieldsValue({
        product_details: editInvoiceData.product_details || [],
        paid_amount: totalPaid,
        due_amount: totalDue,
        payment_status: editInvoiceData.payment_status || 'Pending',
        order_date: editInvoiceData.order_date ? dayjs(editInvoiceData.order_date) : null,
        delivery_date: editInvoiceData.delivery_date ? dayjs(editInvoiceData.delivery_date) : null,
        notes: editInvoiceData.notes || ''
      });
    }
  }, [editInvoiceData, editFormRef]);

  const [filter, setFilter] = useState({
    search: "",
    dateRange: null
  });

  const [state, setState] = useState({
    visibleModal: false,
    id: null,
    search: "",
    customer_id: null,
    from_date: null,
    to_date: null,
    page: 1,
    limit: 10,
    show_paid: false,
    pagination: {
      total: 0,
      totalPages: 0,
      currentPage: 1,
      limit: 10,
    }
  });

  useEffect(() => {
    getList();
    getCustomers();
  }, [state.page, state.limit, state.search, state.customer_id, state.from_date, state.to_date, state.show_paid]);

  const getList = async () => {
    setLoading(true);
    const params = {
      search: state.search,
      customer_id: state.customer_id,
      from_date: state.from_date,
      to_date: state.to_date,
      page: state.page,
      limit: state.limit,
      show_paid: state.show_paid
    };

    const { id } = getProfile();
    if (!id) {
      return;
    }
    const res = await request(`gettotal_due/my-group`, "get", params);
    setLoading(false);
    if (res) {
      setList(res.list);
      setState(prev => ({
        ...prev,
        pagination: res.pagination
      }));
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value || 0);
  };

  const getCustomers = async () => {
    const { id } = getProfile();
    if (!id) {
      return;
    }
    const res = await request(`customer/my-group`, "get");
    if (res) {
      setCustomers(res.list);
    }
  };

  const handleDateChange = (dates) => {
    if (dates && dates.length === 2) {
      setState(prev => ({
        ...prev,
        from_date: dayjs(dates[0]).format('YYYY-MM-DD'),
        to_date: dayjs(dates[1]).format('YYYY-MM-DD'),
        page: 1
      }));
    } else {
      setState(prev => ({
        ...prev,
        from_date: null,
        to_date: null,
        page: 1
      }));
    }
  };

  const getTotalStats = () => {
    const totalAmount = list.reduce((sum, item) => sum + parseFloat(item.total_amount), 0);
    const paidAmount = list.reduce((sum, item) => sum + parseFloat(item.paid_amount), 0);
    const dueAmount = list.reduce((sum, item) => sum + parseFloat(item.due_amount), 0);

    return { totalAmount, paidAmount, dueAmount };
  };

  const onViewCustomerDetails = (customer) => {
    const customerOrders = list.filter(item =>
      item.customer_id === customer.customer_id &&
      item.tel === customer.tel
    );

    const customerData = {
      ...customer,
      orders: customerOrders.filter(o => !!o.debt_id),
      total_due: customerOrders.reduce((sum, o) => sum + parseFloat(o.due_amount), 0)
    };

    setSelectedCustomer(customerData);
    setCustomerDetailVisible(true);
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-US').format(number);
  };

  const handleMakePayment = (record) => {
    const relatedRecords = list.filter(item => item.order_id === record.order_id);

    const productDetails = relatedRecords.map(item => ({
      debt_id: item.debt_id,
      category_name: item.product_category || item.debt_type,
      unit_price: parseFloat(item.unit_price) || 0,
      due_amount: parseFloat(item.due_amount) || 0,
      paid_amount: parseFloat(item.paid_amount) || 0,
      total_amount: parseFloat(item.total_amount) || 0,
      quantity: parseFloat(item.quantity) || 0
    }));

    const totalPaid = productDetails.reduce((sum, item) => sum + item.paid_amount, 0);
    const totalDue = productDetails.reduce((sum, item) => sum + item.due_amount, 0);
    const totalAmount = productDetails.reduce((sum, item) => sum + item.total_amount, 0);

    setCurrentInvoice({
      ...record,
      product_details: productDetails,
      related_records: relatedRecords,
      paid_amount: totalPaid,
      due_amount: totalDue,
      total_amount: totalAmount
    });

    setPaymentAmount(totalDue);
    setPaymentModalVisible(true);
  };

  const handlePaymentSubmit = async () => {
    setPaymentLoading(true);
    try {
      const { id } = getProfile();

      if (!currentInvoice || !paymentAmount || isNaN(paymentAmount) || paymentAmount <= 0) {
        message.error(t('invalid_amount'));
        return;
      }

      const maxPayable = parseFloat(currentInvoice.due_amount) || 0;
      if (paymentAmount > maxPayable) {
        message.error(`${t('amount_exceeds')} ${formatCurrency(maxPayable)}`);
        return;
      }

      if (!paymentMethod) {
        message.error(t('select_payment_method'));
        return;
      }

      const formData = new FormData();
      formData.append("customer_id", currentInvoice.customer_id);
      formData.append("amount", parseFloat(paymentAmount));
      formData.append("payment_method", paymentMethod);
      formData.append("bank", paymentMethod !== "cash" ? (bank || paymentMethod) : "");
      formData.append("payment_date", paymentDate.format("YYYY-MM-DD"));
      formData.append("user_id", id);
      formData.append("notes", "");
      formData.append("description", currentInvoice.product_description || "");

      slipImages.forEach((file) => {
        if (file.originFileObj) {
          formData.append("upload_image_optional", file.originFileObj);
        }
      });

      const res = await request(
        `updateCustomerDebt/${currentInvoice.order_id}`,
        "put",
        formData
      );

      if (!res || !res.success) {
        throw new Error(res?.error || res?.message || t('payment_failed'));
      }

      message.success(t('payment_success'));

      setPaymentAmount(0);
      setPaymentMethod("cash");
      setBank(null);
      setSlipImages([]);
      setPaymentDate(dayjs());
      setPaymentModalVisible(false);

      await getList();

      if (selectedCustomer) {
        const relatedRecords = selectedCustomer.orders.filter(o => o.order_id === currentInvoice.order_id);
        const totalOrderAmount = relatedRecords.reduce((sum, r) => sum + parseFloat(r.total_amount || 0), 0);
        
        const updatedOrders = selectedCustomer.orders.map(order => {
          if (order.order_id === currentInvoice.order_id) {
            const recordTotal = parseFloat(order.total_amount) || 0;
            const proportionalPayment = totalOrderAmount > 0 
              ? (recordTotal / totalOrderAmount) * parseFloat(paymentAmount)
              : 0;
            
            const newPaidAmount = parseFloat(order.paid_amount) + proportionalPayment;
            const newDueAmount = Math.max(0, recordTotal - newPaidAmount);

            return {
              ...order,
              due_amount: newDueAmount,
              paid_amount: newPaidAmount,
              payment_status: newDueAmount <= 0.01 ? 'Paid' : 'Partial',
              last_payment_date: paymentDate.format("YYYY-MM-DD")
            };
          }
          return order;
        });

        const newTotalDue = updatedOrders.reduce((sum, order) =>
          sum + parseFloat(order.due_amount || 0), 0);

        setSelectedCustomer(prev => ({
          ...prev,
          orders: updatedOrders,
          total_due: newTotalDue
        }));
      }

      message.success({
        content: `${t('payment_success')} ${formatCurrency(paymentAmount)} ${t('invoice_number')}: ${currentInvoice.product_description}`,
        duration: 5
      });

    } catch (error) {
      console.error("Payment error:", error);
      message.error(error.message || t('payment_failed'));
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleEditSubmit = async (values) => {
    setEditLoading(true);
    try {
      if (editInvoiceData.related_records && editInvoiceData.related_records.length > 1) {
        const updatePromises = editInvoiceData.related_records.map(async (record, index) => {
          const productDetail = values.product_details?.[index];

          const unitPrice = productDetail?.unit_price || record.unit_price;
          const quantity = productDetail?.quantity || record.quantity;
          const actualPrice = productDetail?.actual_price || record.actual_price || 1;

          const totalAmount = (unitPrice * quantity) / actualPrice;

          const totalOrderAmount = editInvoiceData.related_records.reduce((sum, r, i) => {
            const pd = values.product_details?.[i];
            const up = pd?.unit_price || r.unit_price;
            const qty = pd?.quantity || r.quantity;
            const ap = pd?.actual_price || r.actual_price || 1;
            return sum + (up * qty) / ap;
          }, 0);

          const proportionalPaidAmount = totalOrderAmount > 0
            ? (totalAmount / totalOrderAmount) * (values.paid_amount || 0)
            : 0;

          const dueAmount = totalAmount - proportionalPaidAmount;

          const editData = {
            total_amount: totalAmount,
            paid_amount: proportionalPaidAmount,
            due_amount: dueAmount,
            payment_status: values.payment_status || record.payment_status,
            due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : record.due_date,
            last_payment_date: values.last_payment_date ? values.last_payment_date.format('YYYY-MM-DD') : record.last_payment_date,
            notes: values.notes || record.notes || '',
            unit_price: unitPrice,
            qty: quantity,
            order_date: values.order_date ? values.order_date.format('YYYY-MM-DD') : record.order_date,
            delivery_date: values.delivery_date ? values.delivery_date.format('YYYY-MM-DD') : record.delivery_date,
            category_id: record.category_id
          };

          return request(`debt/${record.debt_id}`, "put", editData);
        });

        await Promise.all(updatePromises);

      } else {
        const productDetail = values.product_details?.[0];

        const unitPrice = productDetail?.unit_price || editInvoiceData.unit_price;
        const quantity = productDetail?.quantity || editInvoiceData.quantity;
        const actualPrice = productDetail?.actual_price || editInvoiceData.actual_price || 1;

        const totalAmount = (unitPrice * quantity) / actualPrice;
        const paidAmount = values.paid_amount || editInvoiceData.paid_amount;
        const dueAmount = totalAmount - paidAmount;

        const editData = {
          total_amount: totalAmount,
          paid_amount: paidAmount,
          due_amount: dueAmount,
          payment_status: values.payment_status || editInvoiceData.payment_status,
          due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : editInvoiceData.due_date,
          last_payment_date: values.last_payment_date ? values.last_payment_date.format('YYYY-MM-DD') : editInvoiceData.last_payment_date,
          notes: values.notes || editInvoiceData.notes || '',
          unit_price: unitPrice,
          qty: quantity,
          order_date: values.order_date ? values.order_date.format('YYYY-MM-DD') : editInvoiceData.order_date,
          delivery_date: values.delivery_date ? values.delivery_date.format('YYYY-MM-DD') : editInvoiceData.delivery_date,
          category_id: editInvoiceData.category_id
        };

        await request(`debt/${editInvoiceData.debt_id}`, "put", editData);
      }

      message.success(t('edit_success'));
      setEditModalVisible(false);
      editFormRef.resetFields();
      setEditInvoiceData(null);

      await getList();
      if (selectedCustomer) {
        await getList();
      }

    } catch (error) {
      console.error("Edit error:", error);
      message.error(error.response?.data?.error || error.message || t('edit_failed'));
    } finally {
      setEditLoading(false);
    }
  };

  const handleUnitPriceChange = (value, fieldPath) => {
    const currentValues = editFormRef.getFieldsValue();
    const productDetails = currentValues.product_details || [];
    const currentPaidAmount = currentValues.paid_amount || 0;

    const productIndex = fieldPath[1];

    if (productDetails[productIndex]) {
      const quantity = productDetails[productIndex].quantity || 0;
      const actualPrice = productDetails[productIndex].actual_price || 1;

      const calculatedAmount = quantity > 0 && actualPrice > 0
        ? ((value || 0) * quantity) / actualPrice
        : 0;

      const roundedAmount = Math.round(calculatedAmount * 100) / 100;

      const updatedProductDetails = [...productDetails];
      updatedProductDetails[productIndex] = {
        ...updatedProductDetails[productIndex],
        unit_price: value,
        calculated_amount: roundedAmount,
        total_amount: roundedAmount
      };

      const newOverallTotal = updatedProductDetails.reduce((sum, item) => item.total_amount + sum, 0);
      const newOverallDue = Math.max(0, newOverallTotal - currentPaidAmount);

      const finalProductDetails = updatedProductDetails.map(item => {
        const itemTotal = item.calculated_amount || 0;
        const proportionalPaid = newOverallTotal > 0
          ? (itemTotal / newOverallTotal) * currentPaidAmount
          : 0;
        const itemDue = Math.max(0, itemTotal - proportionalPaid);

        return {
          ...item,
          due_amount: Math.round(itemDue * 100) / 100,
          paid_amount: Math.round(proportionalPaid * 100) / 100
        };
      });

      editFormRef.setFieldsValue({
        product_details: finalProductDetails,
        due_amount: Math.round(newOverallDue * 100) / 100
      });
    }
  };

  const handleQuantityChange = (value, fieldPath) => {
    const currentValues = editFormRef.getFieldsValue();
    const productDetails = currentValues.product_details || [];
    const currentPaidAmount = currentValues.paid_amount || 0;

    const productIndex = fieldPath[1];

    if (productDetails[productIndex]) {
      const unitPrice = productDetails[productIndex].unit_price || 0;
      const actualPrice = productDetails[productIndex].actual_price || 1;

      const calculatedAmount = value > 0 && actualPrice > 0
        ? (unitPrice * value) / actualPrice
        : 0;

      const roundedAmount = Math.round(calculatedAmount * 100) / 100;

      const updatedProductDetails = [...productDetails];
      updatedProductDetails[productIndex] = {
        ...updatedProductDetails[productIndex],
        quantity: value,
        calculated_amount: roundedAmount,
        total_amount: roundedAmount
      };

      const newOverallTotal = updatedProductDetails.reduce((sum, item) => item.total_amount + sum, 0);
      const newOverallDue = Math.max(0, newOverallTotal - currentPaidAmount);

      const finalProductDetails = updatedProductDetails.map(item => {
        const itemTotal = item.calculated_amount || 0;
        const proportionalPaid = newOverallTotal > 0
          ? (itemTotal / newOverallTotal) * currentPaidAmount
          : 0;
        const itemDue = Math.max(0, itemTotal - proportionalPaid);

        return {
          ...item,
          due_amount: Math.round(itemDue * 100) / 100,
          paid_amount: Math.round(proportionalPaid * 100) / 100
        };
      });

      editFormRef.setFieldsValue({
        product_details: finalProductDetails,
        due_amount: Math.round(newOverallDue * 100) / 100
      });
    }
  };

  const handleDeleteInvoice = async (invoice) => {
    setDeleteLoading(true);
    try {
      const res = await request(`debt/${invoice.debt_id}`, "delete");

      if (res && res.message) {
        message.success(t('delete_success'));

        await getList();

        if (selectedCustomer) {
          const updatedOrders = selectedCustomer.orders.filter(order => order.debt_id !== invoice.debt_id);
          const newTotalDue = updatedOrders.reduce((sum, order) => sum + parseFloat(order.due_amount || 0), 0);

          setSelectedCustomer(prev => ({
            ...prev,
            orders: updatedOrders,
            total_due: newTotalDue
          }));
        }
      } else {
        throw new Error(res?.error || t('delete_failed'));
      }
    } catch (error) {
      console.error("Delete error:", error);
      message.error(error.message || t('delete_failed'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const { totalAmount, paidAmount, dueAmount } = getTotalStats();
  
  const customerSummary = useMemo(() => {
    const customerMap = new Map();

    list.forEach(item => {
      if (!item.customer_id) return;

      const key = `${item.customer_id}-${item.tel}`;
      if (!customerMap.has(key)) {
        customerMap.set(key, {
          customer_id: item.customer_id,
          customer_name: item.customer_name,
          tel: item.tel,
          branch_name: item.branch_name,
          total_due: 0,
          order_count: 0,
          seen_orders: new Set()
        });
      }

      const customer = customerMap.get(key);

      if (!customer.seen_orders.has(item.order_id)) {
        customer.order_count += 1;
        customer.seen_orders.add(item.order_id);
      }

      customer.total_due += parseFloat(item.due_amount) || 0;
    });

    const cleanData = Array.from(customerMap.values()).map(c => {
      delete c.seen_orders;
      return c;
    });

    return cleanData;
  }, [list]);

  const groupedOrders = Object.values(
    (selectedCustomer?.orders || []).reduce((acc, order) => {
      const key = order.order_id;

      if (!acc[key]) {
        const relatedOrders = (selectedCustomer.orders || []).filter(o => o.order_id === order.order_id);

        const orderTotal = relatedOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
        const orderPaid = relatedOrders.reduce((sum, o) => sum + parseFloat(o.paid_amount || 0), 0);
        const orderDue = Math.max(0, orderTotal - orderPaid);

        acc[key] = {
          ...order,
          product_details: [],
          total_amount: orderTotal,
          paid_amount: orderPaid,
          due_amount: orderDue,
          payment_status: orderDue <= 0.01 ? 'Paid' : (orderPaid > 0 ? 'Partial' : 'Pending')
        };
      }

      acc[key].product_details.push({
        category_name: order.category_name,
        unit_price: order.unit_price,
        due_amount: parseFloat(order.due_amount || 0),
        total_amount: parseFloat(order.total_amount || 0),
        quantity: parseFloat(order.quantity || order.product_qty || 0)
      });

      return acc;
    }, {})
  );

  const handlePaidAmountChange = (value) => {
    const currentValues = editFormRef.getFieldsValue();
    const productDetails = currentValues.product_details || [];
    const paidAmount = value || 0;

    const totalAmount = productDetails.reduce((sum, item) => {
      const unitPrice = item.unit_price || 0;
      const quantity = item.quantity || 0;
      return sum + (unitPrice * quantity);
    }, 0);

    const newDueAmount = Math.max(0, totalAmount - paidAmount);

    const updatedProductDetails = productDetails.map(item => {
      const itemTotal = (item.unit_price || 0) * (item.quantity || 0);

      if (totalAmount > 0) {
        const proportionalPaid = (itemTotal / totalAmount) * paidAmount;
        const itemDue = Math.max(0, itemTotal - proportionalPaid);

        return {
          ...item,
          due_amount: itemDue,
          paid_amount: proportionalPaid
        };
      } else {
        return {
          ...item,
          due_amount: 0,
          paid_amount: 0
        };
      }
    });

    editFormRef.setFieldsValue({
      product_details: updatedProductDetails,
      due_amount: newDueAmount
    });
  };

  const handleEditInvoice = (record) => {
    const relatedRecords = list.filter(item => item.order_id === record.order_id);

    const formattedProductDetails = relatedRecords.map((item) => {
      return {
        debt_id: item.debt_id,
        category_id: item.category_id,
        category_name: item.product_category || item.debt_type,
        unit_price: parseFloat(item.unit_price) || 0,
        due_amount: parseFloat(item.due_amount) || 0,
        paid_amount: parseFloat(item.paid_amount) || 0,
        total_amount: parseFloat(item.total_amount) || 0,
        quantity: parseFloat(item.quantity) || parseFloat(item.product_qty) || parseFloat(item.qty) || 0,
        actual_price: item.effective_actual_price,
      };
    });

    const totalDueAmount = formattedProductDetails.reduce((sum, item) =>
      sum + (item.due_amount || 0), 0
    );

    const totalPaidAmount = formattedProductDetails.reduce((sum, item) =>
      sum + (item.paid_amount || 0), 0
    );

    setEditInvoiceData({
      ...record,
      product_details: formattedProductDetails,
      related_records: relatedRecords,
      total_due_all_categories: totalDueAmount,
      total_paid_all_categories: totalPaidAmount
    });

    editFormRef.setFieldsValue({
      product_details: formattedProductDetails,
      paid_amount: totalPaidAmount,
      due_amount: totalDueAmount,
      payment_status: record.payment_status || "Pending",
      order_date: record.order_date ? dayjs(record.order_date) : null,
      delivery_date: record.delivery_date ? dayjs(record.delivery_date) : null,
      notes: record.notes || ''
    });

    setEditModalVisible(true);
  };

  return (
    <MainPage loading={loading}>
      <div className="pageHeader">
        <div className="title-container">
          <FaUserTie className="title-icon" />
          <Title level={3} className="khmer-title">{t('customer_debt')}</Title>
        </div>
      </div>

      <Card className="filter-card">
        <Space size="large" wrap>
          <Input.Search
            placeholder={t('search_customer_phone')}
            allowClear
            value={state.search}
            onChange={(e) => setState(prev => ({ ...prev, search: e.target.value, page: 1 }))}
            onSearch={getList}
            style={{ width: 300 }}
            prefix={<MdSearch className="search-icon" />}
            className="search-input"
          />
          <Select
            showSearch
            placeholder={t('select_customer')}
            style={{ width: 250 }}
            allowClear
            value={state.customer_id}
            onChange={(value) => setState(prev => ({ ...prev, customer_id: value, page: 1 }))}
            filterOption={(input, option) => {
              const searchText = input.toLowerCase();
              const optionText = String(option.children).toLowerCase();
              const indexText = option.key.toString();

              return optionText.indexOf(searchText) >= 0 ||
                indexText.indexOf(searchText) >= 0;
            }}
            className="custom-select"
          >
            {customers.map((customer, index) => (
              <Option key={index + 1} value={customer.id}>
                {index + 1}. {customer.name} - {customer.phone}
              </Option>
            ))}
          </Select>

          <RangePicker
            format="YYYY-MM-DD"
            onChange={handleDateChange}
            placeholder={[t('start_date'), t('end_date')]}
            style={{ width: 250 }}
            className="date-picker"
            suffixIcon={<FaCalendarAlt className="calendar-icon" />}
          />

          <Select
            placeholder={t('show_debt')}
            style={{ width: 150 }}
            value={state.show_paid}
            onChange={(value) => setState(prev => ({ ...prev, show_paid: value, page: 1 }))}
            className="status-select"
          >
            <Option value={false}>{t('unpaid_only')}</Option>
            <Option value={true}>{t('all_debts')}</Option>
          </Select>
        </Space>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card className="stat-card total-amount">
            <Statistic
              title={<div className="stat-title"><MdAttachMoney className="stat-icon" /> {t('purchase_amount')}</div>}
              value={totalAmount}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix="$"
              className="statistic-value"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="stat-card paid-amount">
            <Statistic
              title={<div className="stat-title"><FaMoneyBillWave className="stat-icon" /> {t('paid_amount')}</div>}
              value={paidAmount}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix="$"
              className="statistic-value"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="stat-card due-amount">
            <Statistic
              title={<div className="stat-title"><MdOutlinePayment className="stat-icon" /> {t('remaining_debt')}</div>}
              value={dueAmount}
              precision={2}
              valueStyle={{ color: '#cf1322' }}
              prefix="$"
              className="statistic-value"
            />
          </Card>
        </Col>
      </Row>

      <Card className="table-card">
        <div className="card-title-container">
          <RiContactsLine className="card-title-icon" />
          <Title level={4} className="card-title">{t('customer_debt_list')}</Title>
        </div>

        <Table
          dataSource={customerSummary}
          columns={[
            {
              key: "No",
              title: <div className="khmer-text1">{t('no')}</div>,
              render: (text, record, index) => index + 1,
            },
            {
              title: <span className="khmer-text">{t('customer')}</span>,
              dataIndex: "customer_name",
              render: (text, record) => (
                <div className="customer-info">
                  <div className="customer-name khmer-text">{text}</div>
                  <small className="customer-phone english-text">{record.tel}</small>
                </div>
              )
            },
            {
              title: <span className="khmer-text">{t('customer_address')}</span>,
              dataIndex: "branch_name",
              render: (text) => <span className="address-text khmer-text">{text || '-'}</span>
            },
            {
              title: <span className="khmer-text">{t('invoice_count')}</span>,
              dataIndex: "order_count",
              align: 'center',
              render: (text) => <Tag color="blue" className="invoice-count-tag english-text">{text}</Tag>
            },
            {
              title: <span className="khmer-text">{t('total_debt')}</span>,
              dataIndex: "total_due",
              render: (text) => <strong className="due-amount-text english-text">{formatCurrency(text)}</strong>,
              align: 'right'
            },
            {
              title: <span className="khmer-text">{t('actions')}</span>,
              key: "action",
              render: (_, record) => (
                <Button
                  type="primary"
                  icon={<MdRemoveRedEye />}
                  onClick={() => onViewCustomerDetails(record)}
                  className="view-details-btn"
                >
                  <span className="khmer-text">{t('view_details')}</span>
                </Button>
              )
            }
          ]}
          pagination={false}
          scroll={true}
          rowClassName="table-row"
          className="custom-table"
        />
      </Card>

      <Drawer
        title={
          <div className="drawer-title">
            <FaUserTie className="drawer-title-icon" />
            <span className="khmer-font">{t('customer_details')}: {selectedCustomer?.customer_name || ''}</span>
          </div>
        }
        width={1200}
        open={customerDetailVisible}
        onClose={() => setCustomerDetailVisible(false)}
        className="customer-drawer khmer-font"
        extra={
          <Button
            type="primary"
            icon={<FaFileExcel />}
            onClick={() => selectedCustomer && exportToExcel(selectedCustomer)}
            loading={excelExportLoading}
            className="drawer-export-button"
          >
            {t('export_excel')}
          </Button>
        }
      >
        {selectedCustomer && (
          <>
            <div className="customer-card">
              <Descriptions bordered column={1} className="english-font customer-descriptions">
                <Descriptions.Item
                  label={<span className="khmer-font description-label"><FaUserTie className="description-icon" /> {t('customer')}</span>}
                  className="description-item"
                >
                  <span className="description-value">{selectedCustomer.customer_name}</span>
                </Descriptions.Item>
                <Descriptions.Item
                  label={<span className="khmer-font description-label"><MdSearch className="description-icon" /> {t('phone_number')}</span>}
                  className="description-item"
                >
                  <span className="description-value">{selectedCustomer.tel}</span>
                </Descriptions.Item>
                <Descriptions.Item
                  label={<span className="khmer-font description-label"><RiContactsLine className="description-icon" /> {t('customer_address')}</span>}
                  className="description-item"
                >
                  <span className="description-value">{selectedCustomer.branch_name || selectedCustomer.address || '-'}</span>
                </Descriptions.Item>
                <Descriptions.Item
                  label={<span className="khmer-font description-label"><MdAttachMoney className="description-icon" /> {t('total_debt_amount')}</span>}
                  className="description-item"
                >
                  <Tag color="red" className="english-font amount-tag">
                    {formatCurrency(selectedCustomer.total_due)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item
                  label={<span className="khmer-font description-label"><RiFileListLine className="description-icon" /> {t('total_invoices')}</span>}
                  className="description-item"
                >
                  <Tag color="orange" className="invoice-count">{formatNumber(selectedCustomer.orders.length)} {t('invoices')}</Tag>
                </Descriptions.Item>
              </Descriptions>
            </div>

            <Divider className="section-divider">
              <FaRegListAlt className="divider-icon" />
              <span className="khmer-font divider-text">{t('outstanding_invoices')}</span>
            </Divider>

            <div className="customer-stats">
              <Row gutter={16}>
                <Col span={8}>
                  <Card size="small" className="stat-card customer-stat-card total">
                    <Statistic
                      title={<div className="stat-title"><MdAttachMoney className="stat-icon" /> {t('total_amount')}</div>}
                      value={selectedCustomer.orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0)}
                      precision={2}
                      valueStyle={{ color: '#3f8600' }}
                      formatter={(value) => formatCurrency(value)}
                      className="statistic-value"
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" className="stat-card customer-stat-card paid">
                    <Statistic
                      title={<div className="stat-title"><FaMoneyBillWave className="stat-icon" /> {t('paid_amount')}</div>}
                      value={selectedCustomer.orders.reduce((sum, order) => sum + parseFloat(order.paid_amount || 0), 0)}
                      precision={2}
                      valueStyle={{ color: '#1890ff' }}
                      formatter={(value) => formatCurrency(value)}
                      className="statistic-value"
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" className="stat-card customer-stat-card due">
                    <Statistic
                      title={<div className="stat-title"><MdOutlinePayment className="stat-icon" /> {t('due_amount')}</div>}
                      value={selectedCustomer.total_due}
                      precision={2}
                      valueStyle={{ color: '#cf1322' }}
                      formatter={(value) => formatCurrency(value)}
                      className="statistic-value"
                    />
                  </Card>
                </Col>
              </Row>
            </div>

            <Table
              dataSource={groupedOrders}
              columns={[
                {
                  key: "No",
                  title: <div className="khmer-text1">{t('no')}</div>,
                  render: (text, record, index) => index + 1,
                  width: 60
                },
                {
                  title: <span className="khmer-text">{t('invoice_number')}</span>,
                  dataIndex: "product_description",
                  render: (text) => <span className="english-text invoice-number">{text}</span>
                },
                {
                  title: <span className="khmer-text">{t('order_date')}</span>,
                  dataIndex: "order_date",
                  render: (text) => (
                    <span className="english-text">{text ? formatDateClient(text) : '-'}</span>
                  )
                },
                {
                  title: <span className="khmer-text">{t('delivery_date')}</span>,
                  dataIndex: "delivery_date",
                  render: (text) => (
                    <span className="english-text" style={{ color: '#ff4d4f' }}>
                      {text ? formatDateClient(text) : '-'}
                    </span>
                  )
                },
                {
                  title: <span className="khmer-text">{t('total_amount')}</span>,
                  dataIndex: "total_amount",
                  render: (text) => <span className="english-text amount-text">{formatCurrency(text)}</span>,
                  align: 'right'
                },
                {
                  title: <span className="khmer-text">{t('paid_amount')}</span>,
                  dataIndex: "paid_amount",
                  render: (text) => <span className="english-text amount-text paid">{formatCurrency(text)}</span>,
                  align: 'right'
                },
                {
                  title: <span className="khmer-text">{t('due_amount')}</span>,
                  dataIndex: "due_amount",
                  render: (text) => <span className="english-text amount-text due">{formatCurrency(text)}</span>,
                  align: 'right'
                },
                {
                  title: <span className="khmer-text">{t('payment_status')}</span>,
                  dataIndex: "payment_status",
                  render: (status, record) => {
                    const dueAmount = parseFloat(record.due_amount) || 0;
                    let color = 'green';
                    let text = t('paid');

                    if (dueAmount > 0.01) {
                      color = 'orange';
                      text = t('partial_payment');
                    }

                    if (parseFloat(record.paid_amount) === 0) {
                      color = 'red';
                      text = t('unpaid');
                    }

                    return <Tag color={color} className="status-tag khmer-text">{text}</Tag>;
                  }
                },
                {
                  title: <span className="khmer-text">{t('actions')}</span>,
                  key: "action",
                  render: (_, record) => (
                    <Space size="small">
                      {parseFloat(record.due_amount) > 0 && (
                        <Button
                          type="primary"
                          size="small"
                          icon={<MdPayment />}
                          onClick={() => handleMakePayment(record)}
                          className="pay-button"
                        >
                          <span className="khmer-text">{t('pay_now')}</span>
                        </Button>
                      )}

                      <Popconfirm
                        title={<span className="khmer-text">{t('delete_confirm')}</span>}
                        onConfirm={() => handleDeleteInvoice(record)}
                        okText={<span className="khmer-text">{t('yes')}</span>}
                        cancelText={<span className="khmer-text">{t('no')}</span>}
                        okButtonProps={{ loading: deleteLoading }}
                      >
                        {isPermission("customer.getone") && (
                          <Button
                            type="primary"
                            danger
                            size="small"
                            icon={<MdDelete />}
                            className="delete-button"
                          >
                            <span className="khmer-text">{t('delete')}</span>
                          </Button>
                        )}
                      </Popconfirm>
                    </Space>
                  ),
                  width: 200
                }
              ]}
              pagination={false}
              scroll={{ x: 800 }}
              size="small"
              className="customer-orders-table"
            />
          </>
        )}
      </Drawer>

      <Modal
        title={
          <div className="modal-title">
            <MdPayment className="modal-title-icon" />
            <span className="khmer-font">{t('payment_for_invoice')}: {currentInvoice?.product_description}</span>
          </div>
        }
        open={paymentModalVisible}
        onCancel={() => {
          setPaymentModalVisible(false);
          setPaymentAmount(0);
          setPaymentMethod("cash");
          setBank(null);
          setSlipImages([]);
          setPaymentDate(dayjs());
        }}
        width={600}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setPaymentModalVisible(false);
              setPaymentAmount(0);
              setPaymentMethod("cash");
              setBank(null);
              setSlipImages([]);
              setPaymentDate(dayjs());
            }}
            className="cancel-button"
          >
            <span className="khmer-text">{t('cancel')}</span>
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={paymentLoading}
            onClick={handlePaymentSubmit}
            className="submit-button"
          >
            <span className="khmer-text">{t('pay_now')}</span>
          </Button>
        ]}
        className="payment-modal khmer-font"
      >
        {currentInvoice && (
          <div className="payment-form">
            <div className="invoice-details">
              <Descriptions bordered column={1} size="small" className="invoice-descriptions">
                <Descriptions.Item
                  label={<span className="khmer-font">{t('customer')}</span>}
                >
                  <span className="description-value">{currentInvoice.customer_name}</span>
                </Descriptions.Item>
                <Descriptions.Item
                  label={<span className="khmer-font">{t('invoice_number')}</span>}
                >
                  <span className="description-value english-text">{currentInvoice.product_description}</span>
                </Descriptions.Item>
                <Descriptions.Item
                  label={<span className="khmer-font">{t('total_amount')}</span>}
                >
                  <span className="description-value english-text">{formatCurrency(currentInvoice.total_amount)}</span>
                </Descriptions.Item>
                <Descriptions.Item
                  label={<span className="khmer-font">{t('paid_amount')}</span>}
                >
                  <span className="description-value english-text">{formatCurrency(currentInvoice.paid_amount)}</span>
                </Descriptions.Item>
                <Descriptions.Item
                  label={<span className="khmer-font">{t('due_amount')}</span>}
                >
                  <Tag color="red" className="english-text amount-tag">
                    {formatCurrency(currentInvoice.due_amount)}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </div>
            <Divider />
            <Form layout="vertical" className="payment-details-form">
              <Form.Item
                label={<span className="khmer-font">{t('amount_to_pay')}</span>}
                required
              >
                <InputNumber
                  style={{ width: '100%' }}
                  value={paymentAmount}
                  onChange={setPaymentAmount}
                  min={0}
                  precision={2}
                  formatter={(value) =>
                    `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                  }
                  parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>

              <Form.Item
                label={<span className="khmer-font">{t('payment_method')}</span>}
                required
              >
                <Select
                  value={paymentMethod}
                  onChange={(value) => {
                    setPaymentMethod(value);
                    if (value === "cash") {
                      setBank(null);
                    }
                  }}
                  style={{ width: '100%' }}
                  className="payment-method-select"
                >
                  <Option value="cash">
                    <span className="khmer-text">{t('cash')}</span>
                  </Option>
                  <Option value="bank_transfer">
                    <span className="khmer-text">{t('bank_transfer')}</span>
                  </Option>
                  <Option value="mobile_banking">
                    <span className="khmer-text">{t('mobile_banking')}</span>
                  </Option>
                </Select>
              </Form.Item>
              {paymentMethod !== "cash" && (
                <Form.Item
                  label={<span className="khmer-font">{t('select_bank')}</span>}
                  required
                >
                  <Select
                    value={bank}
                    onChange={setBank}
                    placeholder={t('select_bank')}
                    style={{ width: '100%' }}
                    allowClear
                    className="bank-select"
                  >
                    {cambodiaBanks.map((bankOption) => (
                      <Option key={bankOption.value} value={bankOption.value}>
                        {bankOption.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              )}
              <Form.Item
                label={<span className="khmer-font">{t('payment_date')}</span>}
                required
              >
                <DatePicker
                  value={paymentDate}
                  onChange={setPaymentDate}
                  format="DD-MM-YYYY"
                  style={{ width: '100%' }}
                  className="payment-date-picker"
                />
              </Form.Item>
              {paymentMethod !== "cash" && (
                <Form.Item
                  label={<span className="khmer-font">{t('slip_optional')}</span>}
                >
                  <Upload.Dragger
                    multiple
                    listType="picture-card"
                    fileList={slipImages}
                    onChange={(info) => setSlipImages(info.fileList)}
                    beforeUpload={() => false}
                    accept="image/*"
                    className="slip-upload"
                  >
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text khmer-text">
                      {t('upload_slip')}
                    </p>
                    <p className="ant-upload-hint khmer-text">
                      {t('multiple_images')}
                    </p>
                  </Upload.Dragger>
                </Form.Item>
              )}
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title={
          <div className="modal-title">
            <MdEdit className="modal-title-icon" />
            <span className="khmer-font">{t('edit_invoice')}: {editInvoiceData?.product_description}</span>
          </div>
        }
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          editFormRef.resetFields();
          setEditInvoiceData(null);
        }}
        width={900}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setEditModalVisible(false);
              editFormRef.resetFields();
              setEditInvoiceData(null);
            }}
            className="cancel-button"
          >
            <span className="khmer-text">{t('cancel')}</span>
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={editLoading}
            onClick={() => editFormRef.submit()}
            className="submit-button"
          >
            <span className="khmer-text">{t('save')}</span>
          </Button>
        ]}
        className="edit-modal khmer-font"
      >
        <Form
          form={editFormRef}
          layout="vertical"
          onFinish={handleEditSubmit}
          className="edit-form"
        >
          <Divider orientation="left">
            <span className="khmer-font">{t('product_information')}</span>
          </Divider>

          <Form.List name="product_details">
            {(fields, { add, remove }) => (
              <>
                {fields.length > 0 && (
                  <Row gutter={16} style={{ fontWeight: 'bold', marginBottom: 8 }}>
                    <Col span={5}><span className="khmer-font">{t('product_category')}</span></Col>
                    <Col span={5}><span className="khmer-font">{t('ton_price')}</span></Col>
                    <Col span={4}><span className="khmer-font">{t('actual_price')}</span></Col>
                    <Col span={5}><span className="khmer-font">{t('quantity')}</span></Col>
                    <Col span={5}><span className="khmer-font">{t('due_amount')}</span></Col>
                  </Row>
                )}

                {fields.map(({ key, name, fieldKey, ...restField }) => (
                  <Row gutter={16} key={key} style={{ marginBottom: 12 }}>
                    <Col span={5}>
                      <Form.Item name={[name, 'category_name']} noStyle>
                        <Input disabled className="khmer-font" />
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item name={[name, 'unit_price']} noStyle>
                        <InputNumber
                          style={{ width: '100%' }}
                          min={0}
                          precision={2}
                          formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                          onChange={(value) => handleUnitPriceChange(value, ['product_details', name, 'unit_price'])}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item name={[name, 'actual_price']} noStyle>
                        <InputNumber
                          disabled
                          style={{ width: '100%' }}
                          min={0}
                          precision={2}
                          formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item name={[name, 'quantity']} noStyle>
                        <InputNumber
                          style={{ width: '100%' }}
                          min={0}
                          precision={0}
                          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={(value) => value.replace(/(,*)/g, '')}
                          onChange={(value) => handleQuantityChange(value, ['product_details', name, 'quantity'])}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item name={[name, 'due_amount']} noStyle>
                        <InputNumber
                          disabled
                          style={{ width: '100%' }}
                          min={0}
                          precision={2}
                          formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                          readOnly
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                ))}

                {fields.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    <span className="khmer-font">{t('no_product_info')}</span>
                  </div>
                )}
              </>
            )}
          </Form.List>

          <Divider orientation="left">
            <span className="khmer-font">{t('payment_information')}</span>
          </Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="paid_amount"
                label={<span className="khmer-font">{t('paid_amount')}</span>}
                rules={[
                  { required: true, message: t('enter_valid_amount') },
                  { type: 'number', min: 0, message: t('amount_must_positive') }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                  placeholder={t('enter_valid_amount')}
                  onChange={handlePaidAmountChange}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="due_amount"
                label={<span className="khmer-font">{t('due_amount')}</span>}
                rules={[
                  { required: true, message: t('enter_valid_amount') },
                  { type: 'number', min: 0, message: t('amount_must_positive') }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  readOnly
                  formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="payment_status"
                label={<span className="khmer-font">{t('payment_status')}</span>}
                rules={[{ required: true, message: t('select_payment_method') }]}
              >
                <Select placeholder={t('payment_status')} style={{ width: '100%' }}>
                  <Option value="Pending">
                    <span className="khmer-text">{t('unpaid')}</span>
                  </Option>
                  <Option value="Partial">
                    <span className="khmer-text">{t('partial_payment')}</span>
                  </Option>
                  <Option value="Paid">
                    <span className="khmer-text">{t('paid')}</span>
                  </Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="order_date"
                label={<span className="khmer-font">{t('order_date')}</span>}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD-MM-YYYY"
                  placeholder={t('select_date')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="delivery_date"
                label={<span className="khmer-font">{t('delivery_date')}</span>}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD-MM-YYYY"
                  placeholder={t('select_date')}
                />
              </Form.Item>
            </Col>
            <Col span={12}></Col>
          </Row>

          <Form.Item
            name="notes"
            label={<span className="khmer-font">{t('notes')}</span>}
          >
            <Input.TextArea
              rows={3}
              placeholder={t('enter_note')}
            />
          </Form.Item>
        </Form>
      </Modal>

      {React.useMemo(() => {
        const exportToExcel = async (customer) => {
          try {
            setExcelExportLoading(true);

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Customer Orders', {
              pageSetup: {
                orientation: 'landscape',
                paperSize: 9,
                fitToPage: true,
                fitToWidth: 1,
                fitToHeight: 0,
                horizontalCentered: true,
                margins: {
                  left: 0.2,
                  right: 0.2,
                  top: 0.4,
                  bottom: 0.4,
                  header: 0.3,
                  footer: 0.3
                }
              }
            });
            
            workbook.created = new Date();
            workbook.modified = new Date();
            
            worksheet.mergeCells('A1:K1');
            const titleCell = worksheet.getCell('A1');
            titleCell.value = `តារាងបញ្ជីទិញលក់ប្រេងឥន្ធន:អតិថិជន ${customer.customer_name || ''}`;
            titleCell.font = {
              size: 16,
              bold: true,
              name: 'Khmer Moul'
            };
            titleCell.alignment = { horizontal: 'center' };
            
            worksheet.mergeCells('A2:K2');
            const dateRangeCell = worksheet.getCell('A2');
            const today = new Date();
            const firstDay = '01';
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            const month = (today.getMonth() + 1).toString().padStart(2, '0');
            const year = today.getFullYear();
            let fromDate = `${firstDay}/${month}/${year}`;
            let toDate = `${lastDay}/${month}/${year}`;
            
            if (state.from_date) {
              if (state.from_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const parts = state.from_date.split('-');
                fromDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
              } else {
                fromDate = state.from_date;
              }
            }
            if (state.to_date) {
              if (state.to_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const parts = state.to_date.split('-');
                toDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
              } else {
                toDate = state.to_date;
              }
            }
            
            dateRangeCell.value = `ចាប់ពីថ្ងៃទី ${fromDate} ដល់ថ្ងៃទី ${toDate}`;
            dateRangeCell.font = { name: 'Khmer OS', size: 12 };
            dateRangeCell.alignment = { horizontal: 'center' };
            
            worksheet.addRow([]);
            
            const topHeaderRow = worksheet.addRow([
              'កំនើនក្នុងគ្រា',
              '', '', '', '', '', '',
              'ទឹកប្រាក់',
              'សងក្នុងគ្រា',
              'ចុងគ្រា',
              '#'
            ]);
            worksheet.mergeCells('A4:G4');
            topHeaderRow.height = 35;
            topHeaderRow.eachCell((cell, colNumber) => {
              if ([1, 8, 9, 10, 11].includes(colNumber)) {
                cell.font = {
                  bold: true,
                  name: 'Khmer OS',
                  size: 12
                };
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'DDDDDD' }
                };
              }
              cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
              };
              cell.alignment = {
                vertical: 'middle',
                horizontal: 'center',
                wrapText: true
              };
            });
            
            const headers = [
              'ល.រ',
              'កាលបរិច្ឆេទ',
              'លេខប័ណ្ណ',
              'ប្រភេទឥន្ធនៈ',
              'បរិមាណ',
              'តម្លៃតោន',
              'តម្លៃឯកតា',
              'សរុបដុល្លារ',
              'ដុល្លារ',
              'ដុល្លារ',
              '#'
            ];
            const headerRow = worksheet.addRow(headers);
            headerRow.font = { bold: true, name: 'Khmer OS', size: 11 };
            headerRow.height = 30;
            headerRow.eachCell((cell) => {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'DDDDDD' }
              };
              cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
              };
              cell.alignment = {
                vertical: 'middle',
                horizontal: 'center',
                wrapText: true
              };
            });
            
            let rowNumber = 1;
            let totalAmountUSD = 0;
            let totalPaymentsUSD = 0;
            let totalRemainingBalanceUSD = 0;
            
            const allOrders = customer.orders || [];
            if (allOrders.length === 0) {
              console.error("No orders found for customer:", customer.customer_name);
              message.warning(t('no_data_export'));
            }
            
            allOrders.forEach(order => {
              let quantity = 0;
              if (order.qty !== undefined && order.qty !== null) {
                quantity = parseFloat(order.qty);
              } else if (order.quantity !== undefined && order.quantity !== null) {
                quantity = parseFloat(order.quantity);
              } else if (order.total_items !== undefined && order.total_items !== null) {
                quantity = parseFloat(order.total_items);
              } else if (typeof order === 'object' && Object.keys(order).some(key => key.includes('qty') || key.includes('quant'))) {
                const qtyKey = Object.keys(order).find(key => key.includes('qty') || key.includes('quant'));
                if (qtyKey && order[qtyKey] !== undefined) {
                  quantity = parseFloat(order[qtyKey]);
                }
              }
              
              let fuelType = 'មិនស្គាល់';
              if (order.product_category) {
                fuelType = order.product_category;
              } else if (order.category_name) {
                fuelType = order.category_name;
              } else if (order.Category_Name) {
                fuelType = order.Category_Name;
              } else if (order.product_name) {
                fuelType = order.product_name;
              } else if (order.product) {
                fuelType = order.product;
              }

              const unitPrice = parseFloat(order.unit_price) || 0;
              const totalAmount = parseFloat(order.total_amount) || 0;
              const dueAmount = parseFloat(order.due_amount) || 0;
              const formattedQty = quantity.toLocaleString('en-US');
              const formattedUnitPrice = unitPrice.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              });
              const formattedTotalAmount = totalAmount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              });
              const payment = totalAmount - dueAmount;
              const remainingBalance = dueAmount;
              const formattedPayment = payment.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              });
              const formattedRemainingBalance = remainingBalance.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              });
              const invoiceNumber = order.INV_NUMBER || order.product_description || order.invoice_number || `-${rowNumber}`;
              
              const row = worksheet.addRow([
                rowNumber,
                formatDateClient(order.order_date),
                invoiceNumber,
                fuelType,
                formattedQty,
                formattedUnitPrice,
                order.exchange_rate || '0.83',
                `${formattedTotalAmount}`,
                `${formattedPayment}`,
                `${formattedRemainingBalance}`,
                '#'
              ]);
              
              row.getCell(4).font = { name: 'Khmer OS', size: 11 };
              row.height = 25;
              row.eachCell((cell) => {
                cell.border = {
                  top: { style: 'thin' },
                  left: { style: 'thin' },
                  bottom: { style: 'thin' },
                  right: { style: 'thin' }
                };
                cell.alignment = {
                  vertical: 'middle',
                  horizontal: 'center',
                  wrapText: true
                };
              });
              
              rowNumber++;
              totalAmountUSD += totalAmount;
              totalPaymentsUSD += payment;
              totalRemainingBalanceUSD += remainingBalance;
            });
            
            const formattedTotalAmountUSD = totalAmountUSD.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            });
            const formattedTotalPaymentsUSD = totalPaymentsUSD.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            });
            const formattedTotalRemainingBalanceUSD = totalRemainingBalanceUSD.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            });
            
            const totalsRow = worksheet.addRow([
              '', '', '', '', '', '',
              'សរុប:',
              `${formattedTotalAmountUSD}`,
              `${formattedTotalPaymentsUSD}`,
              `${formattedTotalRemainingBalanceUSD}`,
              '#'
            ]);
            totalsRow.height = 30;
            totalsRow.eachCell((cell, colNumber) => {
              cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
              };
              if ([7, 8, 9, 10].includes(colNumber)) {
                cell.font = { bold: true, size: 11, name: 'Khmer OS' };
              }
              if ([8, 9, 10].includes(colNumber)) {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'EEEEEE' }
                };
              }
              cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });
            
            worksheet.addRow([]);
            
            const currentDate = new Date();
            const formattedDay = currentDate.getDate();
            const formattedMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
            const formattedYear = currentDate.getFullYear();
            const locationDateRow = worksheet.addRow([
              '', '', '', '', '', '',
              '',
              '',
              `ថ្ងៃទី ${formattedDay} ខែ ${formattedMonth} ឆ្នាំ ${formattedYear}`,
              '', ''
            ]);
            worksheet.mergeCells(`I${worksheet.rowCount}:J${worksheet.rowCount}`);
            locationDateRow.getCell(9).font = {
              name: 'Khmer OS',
              size: 11,
              bold: true
            };
            locationDateRow.getCell(9).alignment = {
              horizontal: 'left',
              vertical: 'middle'
            };
            
            worksheet.addRow([]);
            worksheet.addRow([]);
            
            const signatureRow = worksheet.addRow(['អតិថិជន', '', '', '', 'ប្រធានសាខា', '', '', '', '', 'គណនេយ្យ', '']);
            worksheet.mergeCells(`A${worksheet.rowCount}:B${worksheet.rowCount}`);
            worksheet.mergeCells(`E${worksheet.rowCount}:G${worksheet.rowCount}`);
            worksheet.mergeCells(`J${worksheet.rowCount}:K${worksheet.rowCount}`);
            signatureRow.getCell(1).font = { bold: true, name: 'Khmer Moul', size: 11 };
            signatureRow.getCell(1).alignment = { horizontal: 'center' };
            signatureRow.getCell(5).font = { bold: true, name: 'Khmer Moul', size: 11 };
            signatureRow.getCell(5).alignment = { horizontal: 'center' };
            signatureRow.getCell(10).font = { bold: true, name: 'Khmer Moul', size: 11 };
            signatureRow.getCell(10).alignment = { horizontal: 'center' };
            
            const columnWidths = [6, 18, 18, 25, 12, 12, 15, 15, 15, 15, 5];
            columnWidths.forEach((width, i) => {
              worksheet.getColumn(i + 1).width = width;
            });
            
            workbook.definedNames.add('_xlnm.Print_Titles', `'Customer Orders'!$4:$5`);
            worksheet.views = [
              {
                state: 'frozen',
                ySplit: 5,
                activeCell: 'A6'
              }
            ];
            
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, `Customer_${customer.customer_name.replace(/\s+/g, '_')}_Orders_${new Date().toISOString().slice(0, 10)}.xlsx`);
            message.success(t('export_success'));
          } catch (error) {
            console.error('Error exporting to Excel:', error);
            message.error(t('export_failed'));
          } finally {
            setExcelExportLoading(false);
          }
        };
        window.exportToExcel = exportToExcel;
        return null;
      }, [list, selectedCustomer, t])}
    </MainPage>
  );
}

export default TotalDuePage;