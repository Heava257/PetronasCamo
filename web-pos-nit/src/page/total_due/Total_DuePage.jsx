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
import Swal from "sweetalert2";

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
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: t('invalid_amount'),
        });
        return;
      }

      const maxPayable = parseFloat(currentInvoice.due_amount) || 0;
      if (paymentAmount > maxPayable) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: `${t('amount_exceeds')} ${formatCurrency(maxPayable)}`,
        });
        return;
      }

      if (!paymentMethod) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: t('select_payment_method'),
        });
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

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: t('payment_success'),
        showConfirmButton: false,
        timer: 1500
      });

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

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: `${t('payment_success')} ${formatCurrency(paymentAmount)} ${t('invoice_number')}: ${currentInvoice.product_description}`,
        showConfirmButton: false,
        timer: 2000
      });

    } catch (error) {
      console.error("Payment error:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || t('payment_failed'),
      });
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

      await getList();
      if (selectedCustomer) {
        await getList();
      }

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: t('edit_success'),
        showConfirmButton: false,
        timer: 1500
      });

      setEditModalVisible(false);
      editFormRef.resetFields();
      setEditInvoiceData(null);

    } catch (error) {
      console.error("Edit error:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || error.message || t('edit_failed'),
      });
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

  const handleDeleteInvoice = (invoice) => {
    Swal.fire({
      title: t('delete_confirm'),
      text: t('are_you_sure_to_delete_this_debt'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: t('yes'),
      cancelButtonText: t('no')
    }).then(async (result) => {
      if (result.isConfirmed) {
        setDeleteLoading(true);
        try {
          const res = await request(`debt/${invoice.debt_id}`, "delete");

          if (res && res.message) {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: t('delete_success'),
              showConfirmButton: false,
              timer: 1500
            });

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
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || t('delete_failed'),
          });
        } finally {
          setDeleteLoading(false);
        }
      }
    });
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
      <div className="px-2 sm:px-4 lg:px-6 py-4 dark:bg-gray-900 min-h-screen">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4 sm:mb-6">
          <FaUserTie className="text-2xl sm:text-3xl text-blue-600 dark:text-blue-400" />
          <Title level={3} className="!mb-0 khmer-title dark:text-white text-lg sm:text-xl md:text-2xl">
            {t('customer_debt')}
          </Title>
        </div>

        {/* Filter Card */}
        <Card className="mb-4 sm:mb-6 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex flex-col gap-3">
            <Input.Search
              placeholder={t('search_customer_phone')}
              allowClear
              value={state.search}
              onChange={(e) => setState(prev => ({ ...prev, search: e.target.value, page: 1 }))}
              onSearch={getList}
              className="w-full dark:bg-gray-700 dark:text-white"
              prefix={<MdSearch className="search-icon dark:text-gray-300" />}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Select
                showSearch
                placeholder={t('select_customer')}
                className="w-full"
                allowClear
                value={state.customer_id}
                onChange={(value) => setState(prev => ({ ...prev, customer_id: value, page: 1 }))}
                filterOption={(input, option) => {
                  const searchText = input.toLowerCase();
                  const optionText = String(option.children).toLowerCase();
                  const indexText = option.key.toString();
                  return optionText.indexOf(searchText) >= 0 || indexText.indexOf(searchText) >= 0;
                }}
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
                className="w-full"
                suffixIcon={<FaCalendarAlt className="calendar-icon dark:text-gray-300" />}
              />

              <Select
                placeholder={t('show_debt')}
                className="w-full"
                value={state.show_paid}
                onChange={(value) => setState(prev => ({ ...prev, show_paid: value, page: 1 }))}
              >
                <Option value={false}>{t('unpaid_only')}</Option>
                <Option value={true}>{t('all_debts')}</Option>
              </Select>
            </div>
          </div>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Card className="dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <Statistic
              title={
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <MdAttachMoney className="text-green-600 dark:text-green-400" />
                  <span className="dark:text-gray-300">{t('purchase_amount')}</span>
                </div>
              }
              value={totalAmount}
              precision={2}
              valueStyle={{ color: '#3f8600', fontSize: 'clamp(1.25rem, 4vw, 1.75rem)' }}
              prefix="$"
              className="dark:text-white"
            />
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <Statistic
              title={
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <FaMoneyBillWave className="text-blue-600 dark:text-blue-400" />
                  <span className="dark:text-gray-300">{t('paid_amount')}</span>
                </div>
              }
              value={paidAmount}
              precision={2}
              valueStyle={{ color: '#1890ff', fontSize: 'clamp(1.25rem, 4vw, 1.75rem)' }}
              prefix="$"
              className="dark:text-white"
            />
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
            <Statistic
              title={
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <MdOutlinePayment className="text-red-600 dark:text-red-400" />
                  <span className="dark:text-gray-300">{t('remaining_debt')}</span>
                </div>
              }
              value={dueAmount}
              precision={2}
              valueStyle={{ color: '#cf1322', fontSize: 'clamp(1.25rem, 4vw, 1.75rem)' }}
              prefix="$"
              className="dark:text-white"
            />
          </Card>
        </div>

        {/* Customer List Table */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <RiContactsLine className="text-xl sm:text-2xl text-blue-600 dark:text-blue-400" />
            <Title level={4} className="!mb-0 dark:text-white text-base sm:text-lg">
              {t('customer_debt_list')}
            </Title>
          </div>

          {/* Mobile Card View */}
          <div className="block lg:hidden space-y-3">
            {customerSummary.map((customer, index) => (
              <Card
                key={index}
                size="small"
                className="dark:bg-gray-700 dark:border-gray-600 hover:shadow-md transition-shadow"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Tag color="blue" className="text-xs">{index + 1}</Tag>
                        <span className="font-semibold dark:text-white khmer-text text-sm">
                          {customer.customer_name}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 english-text">
                        {customer.tel}
                      </div>
                    </div>
                    <Tag color="orange" className="text-xs">
                      {customer.order_count} {t('invoices')}
                    </Tag>
                  </div>

                  {customer.branch_name && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 khmer-text">
                      <span className="font-medium">{t('customer_address')}: </span>
                      {customer.branch_name}
                    </div>
                  )}

                  <Divider className="my-2 dark:border-gray-600" />

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 khmer-text mb-1">
                        {t('total_debt')}
                      </div>
                      <div className="text-lg font-bold text-red-600 dark:text-red-400 english-text">
                        {formatCurrency(customer.total_due)}
                      </div>
                    </div>
                    <Button
                      type="primary"
                      icon={<MdRemoveRedEye />}
                      onClick={() => onViewCustomerDetails(customer)}
                      size="small"
                    >
                      <span className="khmer-text">{t('view_details')}</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {/* Mobile Pagination */}
            {customerSummary.length > 0 && (
              <div className="flex justify-center items-center gap-2 mt-4 pt-4 border-t dark:border-gray-700">
                <Button
                  size="small"
                  disabled={state.page === 1}
                  onClick={() => setState(prev => ({ ...prev, page: prev.page - 1 }))}
                  className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                >
                  Previous
                </Button>
                <span className="text-sm dark:text-gray-300">
                  Page {state.page} of {state.pagination?.totalPages || 1}
                </span>
                <Button
                  size="small"
                  disabled={state.page >= (state.pagination?.totalPages || 1)}
                  onClick={() => setState(prev => ({ ...prev, page: prev.page + 1 }))}
                  className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                >
                  Next
                </Button>
              </div>
            )}

            {customerSummary.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <span className="khmer-text">{t('no_data')}</span>
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <Table
              dataSource={customerSummary}
              columns={[
                {
                  key: "No",
                  title: <div className="khmer-text1 dark:text-gray-300">{t('no')}</div>,
                  render: (text, record, index) => <span className="dark:text-gray-300">{index + 1}</span>,
                  width: 60,
                  fixed: 'left',
                },
                {
                  title: <span className="khmer-text dark:text-gray-300" style={{ fontSize: '17px', fontWeight: 600 }}>{t('customer')}</span>,
                  dataIndex: "customer_name",
                  render: (text, record) => (
                    <div className="customer-info">
                      <div className="customer-name khmer-text dark:text-white" style={{ fontSize: '17px', fontWeight: 600 }}>{text}</div>
                      <small className="customer-phone english-text dark:text-gray-400" style={{ fontSize: '15px' }}>{record.tel}</small>
                    </div>
                  ),
                  width: 200,
                },
                {
                  title: <span className="khmer-text dark:text-gray-300">{t('customer_address')}</span>,
                  dataIndex: "branch_name",
                  render: (text) => <span className="address-text khmer-text dark:text-gray-300">{text || '-'}</span>,
                },
                {
                  title: <span className="khmer-text dark:text-gray-300">{t('invoice_count')}</span>,
                  dataIndex: "order_count",
                  align: 'center',
                  render: (text) => <Tag color="blue" className="invoice-count-tag english-text">{text}</Tag>,
                  width: 100,
                },
                {
                  title: <span className="khmer-text dark:text-gray-300">{t('total_debt')}</span>,
                  dataIndex: "total_due",
                  render: (text) => <strong className="due-amount-text english-text dark:text-red-400">{formatCurrency(text)}</strong>,
                  align: 'right',
                  width: 130,
                },
                {
                  title: <span className="khmer-text dark:text-gray-300">{t('actions')}</span>,
                  key: "action",
                  render: (_, record) => (
                    <Button
                      type="primary"
                      icon={<MdRemoveRedEye />}
                      onClick={() => onViewCustomerDetails(record)}
                      size="small"
                    >
                      <span className="khmer-text">{t('view_details')}</span>
                    </Button>
                  ),
                  width: 140,
                  fixed: 'right',
                }
              ]}
              pagination={{
                current: state.pagination?.currentPage || state.page || 1,
                pageSize: state.pagination?.limit || state.limit || 10,
                total: state.pagination?.total || 0,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} items`,
                responsive: true,
                onChange: (page, pageSize) => {
                  setState(prev => ({ ...prev, page, limit: pageSize }));
                },
              }}
              scroll={{ x: 800 }}
              size="small"
              className="dark:bg-gray-800"
            />
          </div>
        </Card>

        <Drawer
          title={
            <div className="drawer-title flex items-center gap-2">
              <FaUserTie className="drawer-title-icon text-lg" />
              <span className="khmer-font text-base md:text-lg">
                {t('customer_details')}: {selectedCustomer?.customer_name || ''}
              </span>
              <Button
                type="text"
                icon={
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                }
                onClick={() => setCustomerDetailVisible(false)}
                className="lg:hidden absolute right-4 top-4 z-10 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                size="large"
              />
            </div>

          }

          width="100%"
          styles={{
            body: { padding: '12px' }
          }}
          className="customer-drawer khmer-font [&_.ant-drawer-wrapper-body]:!w-full md:[&_.ant-drawer-wrapper-body]:!w-[90%] lg:[&_.ant-drawer-wrapper-body]:!w-[1200px]"
          open={customerDetailVisible}
          onClose={() => setCustomerDetailVisible(false)}
          extra={
            <Button
              type="primary"
              icon={<FaFileExcel />}
              onClick={() => selectedCustomer && exportToExcel(selectedCustomer)}
              loading={excelExportLoading}
              className="drawer-export-button hidden md:flex"
            >
              {t('export_excel')}
            </Button>
          }
        >
          {selectedCustomer && (
            <>
              {/* Export button for mobile */}
              <div className="mb-4 md:hidden">
                <Button
                  type="primary"
                  icon={<FaFileExcel />}
                  onClick={() => selectedCustomer && exportToExcel(selectedCustomer)}
                  loading={excelExportLoading}
                  className="w-full"
                  block
                >
                  {t('export_excel')}
                </Button>
              </div>

              {/* Customer Info Card */}
              <div className="customer-card mb-4">
                <Descriptions
                  bordered
                  column={1}
                  className="english-font customer-descriptions"
                  size="small"
                >
                  <Descriptions.Item
                    label={
                      <span className="khmer-font description-label flex items-center gap-2">
                        <FaUserTie className="description-icon" /> {t('customer')}
                      </span>
                    }
                    className="description-item"
                  >
                    <span className="description-value break-words">{selectedCustomer.customer_name}</span>
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={
                      <span className="khmer-font description-label flex items-center gap-2">
                        <MdSearch className="description-icon" /> {t('phone_number')}
                      </span>
                    }
                    className="description-item"
                  >
                    <span className="description-value">{selectedCustomer.tel}</span>
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={
                      <span className="khmer-font description-label flex items-center gap-2">
                        <RiContactsLine className="description-icon" /> {t('customer_address')}
                      </span>
                    }
                    className="description-item"
                  >
                    <span className="description-value break-words">
                      {selectedCustomer.branch_name || selectedCustomer.address || '-'}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={
                      <span className="khmer-font description-label flex items-center gap-2">
                        <MdAttachMoney className="description-icon" /> {t('total_debt_amount')}
                      </span>
                    }
                    className="description-item"
                  >
                    <Tag color="red" className="english-font amount-tag">
                      {formatCurrency(selectedCustomer.total_due)}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={
                      <span className="khmer-font description-label flex items-center gap-2">
                        <RiFileListLine className="description-icon" /> {t('total_invoices')}
                      </span>
                    }
                    className="description-item"
                  >
                    <Tag color="orange" className="invoice-count">
                      {formatNumber(selectedCustomer.orders.length)} {t('invoices')}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              </div>

              <Divider className="section-divider my-4">
                <div className="flex items-center gap-2">
                  <FaRegListAlt className="divider-icon" />
                  <span className="khmer-font divider-text text-sm md:text-base">
                    {t('outstanding_invoices')}
                  </span>
                </div>
              </Divider>

              {/* Statistics Cards */}
              <div className="customer-stats mb-4">
                <Row gutter={[8, 8]}>
                  <Col xs={24} sm={8}>
                    <Card size="small" className="stat-card customer-stat-card total">
                      <Statistic
                        title={
                          <div className="stat-title flex items-center gap-1 text-xs md:text-sm">
                            <MdAttachMoney className="stat-icon" /> {t('total_amount')}
                          </div>
                        }
                        value={selectedCustomer.orders.reduce(
                          (sum, order) => sum + parseFloat(order.total_amount || 0),
                          0
                        )}
                        precision={2}
                        valueStyle={{ color: '#3f8600', fontSize: 'clamp(16px, 4vw, 24px)' }}
                        formatter={(value) => formatCurrency(value)}
                        className="statistic-value"
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card size="small" className="stat-card customer-stat-card paid">
                      <Statistic
                        title={
                          <div className="stat-title flex items-center gap-1 text-xs md:text-sm">
                            <FaMoneyBillWave className="stat-icon" /> {t('paid_amount')}
                          </div>
                        }
                        value={selectedCustomer.orders.reduce(
                          (sum, order) => sum + parseFloat(order.paid_amount || 0),
                          0
                        )}
                        precision={2}
                        valueStyle={{ color: '#1890ff', fontSize: 'clamp(16px, 4vw, 24px)' }}
                        formatter={(value) => formatCurrency(value)}
                        className="statistic-value"
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card size="small" className="stat-card customer-stat-card due">
                      <Statistic
                        title={
                          <div className="stat-title flex items-center gap-1 text-xs md:text-sm">
                            <MdOutlinePayment className="stat-icon" /> {t('due_amount')}
                          </div>
                        }
                        value={selectedCustomer.total_due}
                        precision={2}
                        valueStyle={{ color: '#cf1322', fontSize: 'clamp(16px, 4vw, 24px)' }}
                        formatter={(value) => formatCurrency(value)}
                        className="statistic-value"
                      />
                    </Card>
                  </Col>
                </Row>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block">
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
                      render: (text) => <Tag color="cyan" className="english-text invoice-number">{text}</Tag>
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

                          {isPermission("customer.getone") && (
                            <Button
                              type="primary"
                              danger
                              size="small"
                              icon={<MdDelete />}
                              onClick={() => handleDeleteInvoice(record)}
                              className="delete-button"
                              loading={deleteLoading}
                            >
                              <span className="khmer-text">{t('delete')}</span>
                            </Button>
                          )}
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
              </div>

              {/* Mobile Card View */}
              <div className="block md:hidden space-y-3">
                {groupedOrders.map((record, index) => {
                  const dueAmount = parseFloat(record.due_amount) || 0;
                  let statusColor = 'green';
                  let statusText = t('paid');

                  if (dueAmount > 0.01) {
                    statusColor = 'orange';
                    statusText = t('partial_payment');
                  }

                  if (parseFloat(record.paid_amount) === 0) {
                    statusColor = 'red';
                    statusText = t('unpaid');
                  }

                  return (
                    <Card
                      key={record.debt_id || index}
                      className="shadow-sm border border-gray-200 dark:border-gray-700"
                      size="small"
                    >
                      <div className="space-y-2">
                        {/* Header with Invoice Number and Status */}
                        <div className="flex justify-between items-start pb-2 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 dark:text-gray-400 khmer-text mb-1">
                              {t('invoice_number')}
                            </div>
                            <div className="font-semibold text-sm english-text">
                              <Tag color="cyan" style={{ margin: 0 }}>{record.product_description}</Tag>
                            </div>
                          </div>
                          <Tag color={statusColor} className="status-tag khmer-text text-xs">
                            {statusText}
                          </Tag>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <div className="text-gray-500 dark:text-gray-400 khmer-text mb-1">
                              {t('order_date')}
                            </div>
                            <div className="english-text font-medium">
                              {record.order_date ? formatDateClient(record.order_date) : '-'}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500 dark:text-gray-400 khmer-text mb-1">
                              {t('delivery_date')}
                            </div>
                            <div className="english-text font-medium text-red-500">
                              {record.delivery_date ? formatDateClient(record.delivery_date) : '-'}
                            </div>
                          </div>
                        </div>

                        {/* Amounts */}
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="text-center">
                            <div className="text-xs text-gray-500 dark:text-gray-400 khmer-text mb-1">
                              {t('total_amount')}
                            </div>
                            <div className="font-semibold text-sm text-green-600 dark:text-green-400 english-text">
                              {formatCurrency(record.total_amount)}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-500 dark:text-gray-400 khmer-text mb-1">
                              {t('paid_amount')}
                            </div>
                            <div className="font-semibold text-sm text-blue-600 dark:text-blue-400 english-text">
                              {formatCurrency(record.paid_amount)}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-500 dark:text-gray-400 khmer-text mb-1">
                              {t('due_amount')}
                            </div>
                            <div className="font-semibold text-sm text-red-600 dark:text-red-400 english-text">
                              {formatCurrency(record.due_amount)}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          {parseFloat(record.due_amount) > 0 && (
                            <Button
                              type="primary"
                              size="small"
                              icon={<MdPayment />}
                              onClick={() => handleMakePayment(record)}
                              className="pay-button flex-1"
                              block
                            >
                              <span className="khmer-text text-xs">{t('pay_now')}</span>
                            </Button>
                          )}

                          {isPermission("customer.getone") && (
                            <Button
                              type="primary"
                              danger
                              size="small"
                              icon={<MdDelete />}
                              onClick={() => handleDeleteInvoice(record)}
                              className="delete-button"
                              loading={deleteLoading}
                            >
                              <span className="khmer-text text-xs">{t('delete')}</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </Drawer>

        {/* Payment Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <MdPayment className="text-blue-600 dark:text-blue-400" />
              <span className="khmer-font dark:text-white text-sm sm:text-base">
                {t('payment_for_invoice')}: <Tag color="cyan">{currentInvoice?.product_description}</Tag>
              </span>
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
          width="100%"
          style={{ maxWidth: '900px', top: 20 }}
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
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              <span className="khmer-text">{t('cancel')}</span>
            </Button>,
            <Button
              key="submit"
              type="primary"
              loading={paymentLoading}
              onClick={handlePaymentSubmit}
            >
              <span className="khmer-text">{t('pay_now')}</span>
            </Button>
          ]}
          className="dark:bg-gray-900"
        >
          {currentInvoice && (
            <div className="space-y-4">
              <Card size="small" className="dark:bg-gray-800 dark:border-gray-700">
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item
                    label={<span className="khmer-font dark:text-gray-300">{t('customer')}</span>}
                  >
                    <span className="dark:text-white">{currentInvoice.customer_name}</span>
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={<span className="khmer-font dark:text-gray-300">{t('invoice_number')}</span>}
                  >
                    <Tag color="cyan" className="english-text dark:text-white">{currentInvoice.product_description}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={<span className="khmer-font dark:text-gray-300">{t('total_amount')}</span>}
                  >
                    <span className="english-text dark:text-white">{formatCurrency(currentInvoice.total_amount)}</span>
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={<span className="khmer-font dark:text-gray-300">{t('paid_amount')}</span>}
                  >
                    <span className="english-text dark:text-white">{formatCurrency(currentInvoice.paid_amount)}</span>
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={<span className="khmer-font dark:text-gray-300">{t('due_amount')}</span>}
                  >
                    <Tag color="red" className="text-base">
                      {formatCurrency(currentInvoice.due_amount)}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Divider className="dark:border-gray-700" />

              <Form layout="vertical" className="space-y-4">
                {/* Amount to Pay */}
                <Form.Item
                  label={<span className="khmer-font dark:text-gray-300 text-sm sm:text-base font-medium">{t("payment_amount")}</span>}
                  required
                >
                  <InputNumber
                    className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    value={paymentAmount}
                    onChange={setPaymentAmount}
                    min={0}
                    precision={2}
                    formatter={(value) =>
                      `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                    }
                    parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                    placeholder="0.00"
                  />
                </Form.Item>

                {/* Payment Method */}
                <Form.Item
                  label={<span className="khmer-font dark:text-gray-300 text-sm sm:text-base font-medium">{t("payment_method")}</span>}
                  required
                >
                  <Select
                    value={paymentMethod}
                    onChange={(value) => {
                      setPaymentMethod(value);
                      if (value === "cash" || value === "mobile_banking") {
                        setBank(null);
                      }
                    }}
                    className="w-full text-sm sm:text-base"
                  >
                    <Option value="cash">
                      <span className="khmer-text">{t("cash")}</span>
                    </Option>
                    <Option value="bank_transfer">
                      <span className="khmer-text">{t("bank_transfer")}</span>
                    </Option>
                    <Option value="mobile_banking">
                      <span className="khmer-text">{t("debenture")}</span>
                    </Option>
                  </Select>
                </Form.Item>

                {/* Bank Selector - Only shows for Bank Transfer */}
                {paymentMethod === "bank_transfer" && (
                  <Form.Item
                    label={<span className="khmer-font dark:text-gray-300 text-sm sm:text-base font-medium">{t("select_bank")}</span>}
                    required
                  >
                    <Select
                      value={bank}
                      onChange={setBank}
                      placeholder={t("select_bank")}
                      className="w-full text-sm sm:text-base"
                      allowClear
                    >
                      {cambodiaBanks.map((bankOption) => (
                        <Option key={bankOption.value} value={bankOption.value}>
                          {bankOption.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                )}

                {/* Bank Slip Upload - Shows for Bank Transfer and Mobile Banking */}
                {paymentMethod === "bank_transfer" && (
                  <Form.Item
                    label={<span className="khmer-font dark:text-gray-300 text-sm sm:text-base font-medium">{t("slip_optional")}</span>}
                  >
                    <Upload
                      listType="picture-card"
                      fileList={slipImages}
                      onChange={({ fileList }) => setSlipImages(fileList)}
                      beforeUpload={() => false}
                      accept="image/*"
                      maxCount={5}
                      className="dark:bg-gray-700"
                    >
                      {slipImages.length < 5 && (
                        <div>
                          <InboxOutlined style={{ fontSize: 24 }} />
                          <div style={{ marginTop: 8 }} className="khmer-text text-xs sm:text-sm">
                            {t("slip_image")}
                          </div>
                        </div>
                      )}
                    </Upload>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 khmer-text">
                      {t("upload_slip")}
                    </div>
                  </Form.Item>
                )}

                {/* Payment Date */}
                <Form.Item
                  label={<span className="khmer-font dark:text-gray-300 text-sm sm:text-base font-medium">{t("payment_date")}</span>}
                  required
                >
                  <DatePicker
                    value={paymentDate}
                    onChange={setPaymentDate}
                    format="DD/MM/YYYY"
                    className="w-full text-sm sm:text-base dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    placeholder="ជ្រើសរើសកាលបរិច្ឆេទ"
                  />
                </Form.Item>
              </Form>
            </div>
          )}
        </Modal>

        {/* Edit Modal - Keep existing edit modal code with dark mode classes added */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <MdEdit className="text-blue-600 dark:text-blue-400" />
              <span className="khmer-font dark:text-white text-sm sm:text-base">
                {t('edit_invoice')}: <Tag color="cyan">{editInvoiceData?.product_description}</Tag>
              </span>
            </div>
          }
          open={editModalVisible}
          onCancel={() => {
            setEditModalVisible(false);
            editFormRef.resetFields();
            setEditInvoiceData(null);
          }}
          width="100%"
          style={{ maxWidth: '900px', top: 20 }}
          footer={[
            <Button
              key="cancel"
              onClick={() => {
                setEditModalVisible(false);
                editFormRef.resetFields();
                setEditInvoiceData(null);
              }}
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              <span className="khmer-text">{t('cancel')}</span>
            </Button>,
            <Button
              key="submit"
              type="primary"
              loading={editLoading}
              onClick={() => editFormRef.submit()}
            >
              <span className="khmer-text">{t('save')}</span>
            </Button>
          ]}
          className="dark:bg-gray-900"
        >
          <Form
            form={editFormRef}
            layout="vertical"
            onFinish={handleEditSubmit}
            className="space-y-4"
          >
            <Divider orientation="left" className="dark:border-gray-700">
              <span className="khmer-font dark:text-gray-300">{t('product_information')}</span>
            </Divider>

            <Form.List name="product_details">
              {(fields) => (
                <>
                  {fields.length > 0 && (
                    <div className="hidden lg:grid grid-cols-12 gap-2 font-bold mb-2 dark:text-gray-300">
                      <div className="col-span-3 khmer-font">{t('product_category')}</div>
                      <div className="col-span-2 khmer-font">{t('ton_price')}</div>
                      <div className="col-span-2 khmer-font">{t('actual_price')}</div>
                      <div className="col-span-2 khmer-font">{t('quantity')}</div>
                      <div className="col-span-3 khmer-font">{t('due_amount')}</div>
                    </div>
                  )}

                  {fields.map(({ key, name }) => (
                    <div key={key} className="grid grid-cols-1 lg:grid-cols-12 gap-2 mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="lg:col-span-3">
                        <label className="block lg:hidden khmer-font dark:text-gray-300 mb-1">{t('product_category')}</label>
                        <Form.Item name={[name, 'category_name']} noStyle>
                          <Input disabled className="khmer-font dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                        </Form.Item>
                      </div>
                      <div className="lg:col-span-2">
                        <label className="block lg:hidden khmer-font dark:text-gray-300 mb-1">{t('ton_price')}</label>
                        <Form.Item name={[name, 'unit_price']} noStyle>
                          <InputNumber
                            className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            min={0}
                            precision={2}
                            formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                            onChange={(value) => handleUnitPriceChange(value, ['product_details', name, 'unit_price'])}
                          />
                        </Form.Item>
                      </div>
                      <div className="lg:col-span-2">
                        <label className="block lg:hidden khmer-font dark:text-gray-300 mb-1">{t('actual_price')}</label>
                        <Form.Item name={[name, 'actual_price']} noStyle>
                          <InputNumber
                            disabled
                            className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            min={0}
                            precision={2}
                            formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                          />
                        </Form.Item>
                      </div>
                      <div className="lg:col-span-2">
                        <label className="block lg:hidden khmer-font dark:text-gray-300 mb-1">{t('quantity')}</label>
                        <Form.Item name={[name, 'quantity']} noStyle>
                          <InputNumber
                            className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            min={0}
                            precision={0}
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value.replace(/(,*)/g, '')}
                            onChange={(value) => handleQuantityChange(value, ['product_details', name, 'quantity'])}
                          />
                        </Form.Item>
                      </div>
                      <div className="lg:col-span-3">
                        <label className="block lg:hidden khmer-font dark:text-gray-300 mb-1">{t('due_amount')}</label>
                        <Form.Item name={[name, 'due_amount']} noStyle>
                          <InputNumber
                            disabled
                            className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            min={0}
                            precision={2}
                            formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                            readOnly
                          />
                        </Form.Item>
                      </div>
                    </div>
                  ))}

                  {fields.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <span className="khmer-font">{t('no_product_info')}</span>
                    </div>
                  )}
                </>
              )}
            </Form.List>

            <Divider orientation="left" className="dark:border-gray-700">
              <span className="khmer-font dark:text-gray-300">{t('payment_information')}</span>
            </Divider>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Form.Item
                name="paid_amount"
                label={<span className="khmer-font dark:text-gray-300">{t('paid_amount')}</span>}
                rules={[
                  { required: true, message: t('enter_valid_amount') },
                  { type: 'number', min: 0, message: t('amount_must_positive') }
                ]}
              >
                <InputNumber
                  className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  min={0}
                  precision={2}
                  formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                  placeholder={t('enter_valid_amount')}
                  onChange={handlePaidAmountChange}
                />
              </Form.Item>

              <Form.Item
                name="due_amount"
                label={<span className="khmer-font dark:text-gray-300">{t('due_amount')}</span>}
                rules={[
                  { required: true, message: t('enter_valid_amount') },
                  { type: 'number', min: 0, message: t('amount_must_positive') }
                ]}
              >
                <InputNumber
                  className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  min={0}
                  precision={2}
                  readOnly
                  formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Form.Item
                name="payment_status"
                label={<span className="khmer-font dark:text-gray-300">{t('payment_status')}</span>}
                rules={[{ required: true, message: t('select_payment_method') }]}
              >
                <Select placeholder={t('payment_status')} className="w-full">
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

              <Form.Item
                name="order_date"
                label={<span className="khmer-font dark:text-gray-300">{t('order_date')}</span>}
              >
                <DatePicker
                  className="w-full"
                  format="DD-MM-YYYY"
                  placeholder={t('select_date')}
                />
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Form.Item
                name="delivery_date"
                label={<span className="khmer-font dark:text-gray-300">{t('delivery_date')}</span>}
              >
                <DatePicker
                  className="w-full"
                  format="DD-MM-YYYY"
                  placeholder={t('select_date')}
                />
              </Form.Item>
            </div>

            <Form.Item
              name="notes"
              label={<span className="khmer-font dark:text-gray-300">{t('notes')}</span>}
            >
              <Input.TextArea
                rows={3}
                placeholder={t('enter_note')}
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* Excel Export Function */}
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
                Swal.fire({
                  icon: 'warning',
                  title: 'Warning',
                  text: t('no_data_export'),
                });
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
              Swal.fire({
                icon: 'success',
                title: 'Success',
                text: t('export_success'),
                showConfirmButton: false,
                timer: 1500
              });
            } catch (error) {
              console.error('Export error:', error);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: t('export_failed'),
              });
            } finally {
              setExcelExportLoading(false);
            }
          };
          window.exportToExcel = exportToExcel;
          return null;
        }, [list, selectedCustomer, t, state.from_date, state.to_date])}
      </div>
    </MainPage>
  );
}

export default TotalDuePage;