// ✅ FIXED PurchasePage.jsx - With correct actual_price calculation

import React, { useEffect, useState } from "react";
import { request, formatPrice, getProfile, isPermission } from "../../util/helper";
import { Config } from "../../util/config";
import MainPage from "../../component/layout/MainPage";
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Space,
  Table,
  Card,
  Typography,
  Row,
  Col,
  Select,
  DatePicker,
  InputNumber,
  Tag,
  Divider,
  Badge,
  Tooltip,
  Upload
} from "antd";
import dayjs from "dayjs";
import {
  MdOutlineCreateNewFolder,
  MdShoppingCart,
  MdReceipt
} from "react-icons/md";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  PlusOutlined,
  MinusCircleOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { FaTruck } from "react-icons/fa";

import { useTranslation } from "../../locales/TranslationContext";
import { configStore } from "../../store/configStore";
import { useNavigate } from "react-router-dom";

const { Text, Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// ✅ Add Global Style Override for Purchase Page
const purchaseStyles = ``;

function PurchasePage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { config } = configStore();

  // 🔒 Permission Check - FIXED: Use reliable profile data
  const profile = getProfile();

  // 🔒 Permission Check - FIXED: Rely on isPermission to respect branch overrides
  // isPermission("...") already handles Super Admin bypass and branch overrides
  const canCreate = isPermission("purchase.create");
  const canRemove = isPermission("purchase.remove") || isPermission("purchase.delete");
  const canUpdate = isPermission("purchase.update");

  const [state, setState] = useState({
    list: [],
    loading: false,
    visible: false,
    txtSearch: "",
    suppliers: [],
    branches: [], // ✅ Added branches
    showBranchModal: false,
  });

  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [orderItems, setOrderItems] = useState([]);
  const [fileList, setFileList] = useState([]);

  // Distribute Modal State
  const [distributeModal, setDistributeModal] = useState({
    visible: false,
    purchase: null,
    branch_id: null,
    distributions: [] // { product_id, quantity, max_qty, product_name }
  });

  // 🚚 Stock Transfer Modal State (Global)
  const [transferModal, setTransferModal] = useState({
    visible: false,
    selectedProduct: null,
  });
  const [products, setProducts] = useState([]); // List of products with stock info (from inventory)

  // ✅ New State for Receive Modal
  const [isReceiveModalVisible, setIsReceiveModalVisible] = useState(false);
  const [receivingOrder, setReceivingOrder] = useState(null);
  const [receiverName, setReceiverName] = useState("");
  const [distributionHistory, setDistributionHistory] = useState([]); // ✅ History State

  const handleOpenReceive = (order) => {
    setReceivingOrder(order);
    setReceiverName(""); // clear previous
    setIsReceiveModalVisible(true);
  };

  const handleConfirmReceive = async () => {
    if (!receiverName) {
      message.error(t("Please enter receiver name"));
      return;
    }

    if (!receivingOrder) return;

    setState((p) => ({ ...p, loading: true }));
    setIsReceiveModalVisible(false);

    try {
      const purchaseData = {
        ...receivingOrder, // keep existing data
        status: 'delivered',
        received_by: receiverName,
        items: receivingOrder.items
      };

      const res = await request("purchase/" + receivingOrder.id, "put", purchaseData);

      if (res && !res.error) {
        message.success("Order marked as Delivered & Stock Updated!");
        getList();
      } else {
        message.error(res.message || "Failed to update order");
      }
    } catch (error) {
      message.error("An error occurred");
    } finally {
      setState((p) => ({ ...p, loading: false }));
      setReceivingOrder(null);
    }
  };

  // ... (existing code)

  // ✅ Fetch products with stock for Transfer
  const fetchProductsWithStock = async () => {
    const res = await request("inventory/pos-products", "get", { page: 1, limit: 1000 });
    if (res && !res.error) {
      setProducts(res.list || []);
    }
  };

  useEffect(() => {
    getList();
    getSuppliers();
    getBranches();
    fetchProductsWithStock();
  }, []);

  const handleTransferSubmit = async (values) => {
    setState(p => ({ ...p, loading: true }));
    try {
      const { branch_id, product_id, quantity, note } = values;
      // Find product details
      const product = products.find(p => p.id === product_id);

      const payload = {
        target_branch_name: branch_id, // branch_id in Select is branch_name
        item: {
          product_id: product.id,
          quantity: quantity,
          unit_price: product.unit_price,
          // Add explicit flag for stock transfer
          is_transfer: true,
          note: note
        }
      };

      const res = await request("inventory/transfer", "post", payload);
      if (res && !res.error) {
        message.success(t("Transfer Successful"));
        setTransferModal({ visible: false, selectedProduct: null });
        // Refresh stock/list
        fetchProductsWithStock();
        getList();
      } else {
        message.error(res.error?.message || "Transfer Failed");
      }
    } catch (err) {
      console.error(err);
      message.error("Transfer Error");
    } finally {
      setState(p => ({ ...p, loading: false }));
    }
  };

  const getBranches = async () => {
    const res = await request("branch", "get");
    if (res && !res.error) {
      setState((p) => ({
        ...p,
        branches: res.list || [],
      }));
    }
  };

  const getList = async () => {
    setState((p) => ({
      ...p,
      loading: true,
    }));
    var param = {
      txtSearch: state.txtSearch,
    };
    const res = await request("purchase", "get", param);
    if (res && !res.error) {
      setState((p) => ({
        ...p,
        list: res.list,
        loading: false,
      }));
    } else {
      setState((p) => ({ ...p, loading: false }));
    }
  };

  const getSuppliers = async () => {
    const res = await request("supplier", "get");
    if (res && !res.error) {
      setState((p) => ({
        ...p,
        suppliers: res.list || [],
      }));
    }
  };

  const openModal = () => {
    setOrderItems([{
      product_id: null,
      product_name: '',
      category_id: null,
      quantity: 1,
      unit_price: 0,
      actual_price: 1190, // default
      total: 0
    }]);
    setState((p) => ({
      ...p,
      visible: true,
    }));
  };

  const closeModal = () => {
    setState((p) => ({
      ...p,
      visible: false,
    }));
    form.resetFields();
    setOrderItems([]);
    setFileList([]);
  };

  const onFinish = async (items) => {
    var method = "post";
    var url = "purchase";

    if (form.getFieldValue("id")) {
      method = "put";
      url = "purchase/" + form.getFieldValue("id");
    }

    // ✅ Use FormData for Image Upload
    const formData = new FormData();
    formData.append("supplier_id", items.supplier_id);
    if (items.branch_id) formData.append("branch_id", items.branch_id); // ✅ Add Branch ID
    if (items.order_no) formData.append("order_no", items.order_no);

    const orderDate = items.order_date ? dayjs(items.order_date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
    formData.append("order_date", orderDate);

    if (items.expected_delivery_date) {
      formData.append("expected_delivery_date", dayjs(items.expected_delivery_date).format('YYYY-MM-DD'));
    }

    formData.append("status", items.status || 'pending');
    if (items.payment_terms) formData.append("payment_terms", items.payment_terms);
    if (items.notes) formData.append("notes", items.notes);

    formData.append("items", JSON.stringify(orderItems));
    formData.append("total_amount", calculateTotal());

    if (fileList.length > 0 && fileList[0].originFileObj) {
      formData.append("image", fileList[0].originFileObj);
    }

    setState((p) => ({
      ...p,
      loading: true,
    }));

    const res = await request(url, method, formData);

    if (res && !res.error) {
      getList();
      closeModal();
      message.success(res.message || t("purchase_order_saved_successfully"));
    } else {
      message.error(res.message || t("failed_to_save_purchase_order"));
      setState((p) => ({
        ...p,
        loading: false,
      }));
    }
  };

  const onClickBtnEdit = (purchase) => {

    // Set form fields
    form.setFieldsValue({
      id: purchase.id,
      supplier_id: purchase.supplier_id,
      branch_id: purchase.branch_id, // ✅ Populate Branch
      order_no: purchase.order_no,
      order_date: purchase.order_date ? dayjs(purchase.order_date) : null,
      expected_delivery_date: purchase.expected_delivery_date ? dayjs(purchase.expected_delivery_date) : null,
      status: purchase.status,
      payment_terms: purchase.payment_terms,
      notes: purchase.notes
    });

    if (purchase.image) {
      setFileList([{
        uid: '-1',
        name: 'image',
        status: 'done',
        url: Config.getImageUrl(purchase.image),
      }]);
    } else {
      setFileList([]);
    }

    // Load order items with proper structure
    const loadedItems = (purchase.items || []).map(item => {

      // Try to find category by multiple methods:
      // 1. By exact product_name match
      // 2. By product_id match  
      // 3. By category_id match
      // 4. By partial name match
      let category = null;

      // Method 1: Exact product_name match
      category = config.category.find(c => c.label === item.product_name);

      // Method 2: product_id match
      if (!category && item.product_id) {
        category = config.category.find(c => c.value === item.product_id);
      }

      // Method 3: category_id match
      if (!category && item.category_id) {
        category = config.category.find(c => c.value === item.category_id);
      }

      // Method 4: Partial name match (for cases where product_name might be "Category Name / Product Name")
      if (!category && item.product_name) {
        const baseName = item.product_name.split('/')[0].trim();
        category = config.category.find(c =>
          c.label.includes(baseName) || baseName.includes(c.label)
        );
      }

      // Method 5: Case-insensitive match
      if (!category && item.product_name) {
        category = config.category.find(c =>
          c.label.toLowerCase() === item.product_name.toLowerCase()
        );
      }

      // If still not found, log available categories for debugging
      if (!category) {
        console.warn("Category not found for item:", item);

        // Create a fallback category object to prevent errors
        category = {
          value: item.category_id || item.product_id,
          label: item.product_name || 'Unknown Product',
          actual_price: item.actual_price || 1190
        };
      }

      const actualPrice = category?.actual_price || item.actual_price || 1190;
      const quantity = Number(item.quantity) || 1; // Default to 1 instead of 0
      const unitPrice = Number(item.unit_price) || 0;

      return {
        product_id: item.product_id || category?.value || null,
        product_name: item.product_name || category?.label || '',
        category_id: category?.value || item.category_id || item.product_id || null,
        quantity: quantity,
        unit_price: unitPrice,
        actual_price: actualPrice,
        // ✅ Recalculate total with actual_price
        total: (quantity * unitPrice) / actualPrice
      };
    });


    // Set order items (with fallback)
    setOrderItems(loadedItems.length > 0 ? loadedItems : [{
      product_id: null,
      product_name: '',
      category_id: null,
      quantity: 1,
      unit_price: 0,
      actual_price: 1190,
      total: 0
    }]);

    // Open modal
    setState((p) => ({
      ...p,
      visible: true,
    }));
  };

  const onClickBtnDelete = (items) => {
    Modal.confirm({
      title: t("delete_purchase_order"),
      content: t("confirm_delete_purchase_order"),
      onOk: async () => {
        setState((p) => ({
          ...p,
          loading: true,
        }));
        const res = await request("purchase/" + items.id, "delete");

        if (res && !res.error) {
          const newList = state.list.filter((item) => item.id !== items.id);
          setState((p) => ({
            ...p,
            list: newList,
            loading: false,
          }));
          message.success(t("delete_success"));
        } else {
          message.error(res?.message || t("cannot_delete_in_use"));
          setState((p) => ({
            ...p,
            loading: false,
          }));
        }
      },
    });
  };

  const showDetailModal = (purchase) => {
    setSelectedPurchase(purchase);
    setIsDetailModalVisible(true);
  };

  const handleDetailModalClose = () => {
    setIsDetailModalVisible(false);
    setSelectedPurchase(null);
  };

  const addOrderItem = () => {
    setOrderItems([...orderItems, {
      product_id: null,
      product_name: '',
      category_id: null,
      quantity: 1,
      unit_price: 0,
      actual_price: 1190,
      total: 0
    }]);
  };

  const removeOrderItem = (index) => {
    const newItems = orderItems.filter((_, i) => i !== index);
    setOrderItems(newItems);
  };

  const updateOrderItem = (index, field, value) => {
    const newItems = [...orderItems];

    if (field === 'product_id') {
      // When product changes, update all related fields
      const product = config.product.find(p => p.value === value);
      if (product) {
        newItems[index] = {
          ...newItems[index],
          product_id: value,
          product_name: product.label,
          category_id: product.category_id,
          unit_price: product.unit_price || 0,
          actual_price: product.actual_price || 1190
        };
        // ✅ Recalculate total with actual_price
        const qty = newItems[index].quantity || 0;
        const unitPrice = newItems[index].unit_price || 0;
        const actualPrice = newItems[index].actual_price || 1;
        newItems[index].total = (qty * unitPrice) / actualPrice;
      }
    } else {
      newItems[index][field] = value;

      // ✅ Recalculate total when quantity or unit_price changes
      if (field === 'quantity' || field === 'unit_price') {
        const qty = newItems[index].quantity || 0;
        const unitPrice = newItems[index].unit_price || 0;
        const actualPrice = newItems[index].actual_price || 1;
        newItems[index].total = (qty * unitPrice) / actualPrice;
      }
    }

    setOrderItems(newItems);
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { color: 'orange', text: t('pending') },
      'confirmed': { color: 'blue', text: t('confirmed') },
      'shipped': { color: 'purple', text: t('shipped') },
      'delivered': { color: 'green', text: t('delivered') },
      'cancelled': { color: 'red', text: t('cancelled') }
    };

    const config = statusConfig[status] || statusConfig['pending'];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const openDistributeModal = (purchase) => {
    const items = purchase.items || [];
    const distributions = items.map(item => ({
      product_id: item.product_id || item.id,
      product_name: item.product_name,
      quantity: 0, // Input by user
      ordered_qty: Number(item.quantity) || 0,
      received_qty: Number(item.received_qty) || 0,
      remaining_qty: (Number(item.quantity) || 0) - (Number(item.received_qty) || 0)
    }));

    setDistributeModal({
      visible: true,
      purchase: purchase,
      branch_id: null,
      distributions: distributions
    });
  };

  const handleDistributeSubmit = async () => {
    if (!distributeModal.branch_id) {
      message.error(t("please_select_branch") || "Please select a branch");
      return;
    }

    // Filter only items with > 0 quantity
    const validDistributions = distributeModal.distributions.filter(d => d.quantity > 0);

    if (validDistributions.length === 0) {
      message.warning(t("please_enter_quantity") || "Please enter quantity to distribute");
      return;
    }

    // Validate quantity <= remaining
    for (const d of validDistributions) {
      if (d.quantity > d.remaining_qty) {
        message.error(`${d.product_name}: Quantity exceeds remaining (${d.remaining_qty})`);
        return;
      }
    }

    const payload = {
      purchase_id: distributeModal.purchase?.id,
      branch_id: distributeModal.branch_id,
      distributions: validDistributions,
      notes: "Distributed via Web App"
    };

    setState(p => ({ ...p, loading: true }));
    const res = await request("purchase/distribute", "post", payload);
    setState(p => ({ ...p, loading: false }));

    if (res && res.success) {
      message.success(t("distribute_success") || "Stock distributed successfully");
      setDistributeModal({ visible: false, purchase: null, branch_id: null, distributions: [] });
      getList(); // Refresh
    } else {
      message.error(res?.message || t("error_occurred"));
    }
  };

  const PurchaseMobileCard = ({ purchase, index }) => {
    return (
      <Card
        className="mb-3 shadow-sm hover:shadow-md transition-shadow duration-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        bodyStyle={{ padding: '16px' }}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                #{index + 1}
              </span>
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                {purchase.order_no}
              </span>
              {getStatusBadge(purchase.status)}
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
              {purchase.supplier_name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>📅</span>
              <span>{dayjs(purchase.order_date).format("DD/MM/YYYY")}</span>
            </div>
          </div>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => showDetailModal(purchase)}
            className="text-blue-500 dark:text-blue-400"
          />
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">{t("total_amount")}</span>
            <span className="text-base font-semibold text-gray-900 dark:text-white">
              {formatPrice(purchase.total_amount)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">{t("items")}</span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {purchase.items?.length || 0} {t("items")}
            </span>
          </div>
          {purchase.expected_delivery_date && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">{t("expected_delivery")}</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {dayjs(purchase.expected_delivery_date).format("DD/MM/YYYY")}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {dayjs(purchase.created_at || purchase.create_at).format("DD/MM/YYYY HH:mm")}
          </span>
          <Space size="small">
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onClickBtnEdit(purchase)}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {t("edit")}
            </Button>
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => onClickBtnDelete(purchase)}
            >
              {t("delete")}
            </Button>
          </Space>
        </div>
      </Card>
    );
  };

  const filteredList = state.list
    .filter(purchase => {
      const searchLower = state.txtSearch.toLowerCase();
      return (
        purchase.order_no?.toLowerCase().includes(searchLower) ||
        purchase.supplier_name?.toLowerCase().includes(searchLower) ||
        purchase.status?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => (a.id || 0) - (b.id || 0));

  const columns = [
    {
      key: "no",
      title: t("No"),
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      key: "order_no",
      title: t("order_no"),
      dataIndex: "order_no",
      render: (orderNo) => (
        <span className="font-semibold text-blue-600 dark:text-blue-400">
          {orderNo}
        </span>
      ),
    },
    {
      key: "supplier_name",
      title: t("Supplier"),
      dataIndex: "supplier_name",
    },
    {
      key: "image",
      title: t("image"),
      dataIndex: "image",
      render: (img) => img ? (
        <img
          src={Config.getImageUrl(img)}
          alt="Attachment"
          className="w-10 h-10 object-cover rounded border border-gray-200 cursor-pointer hover:scale-150 transition-transform"
          onClick={() => {
            Modal.info({
              title: "Attachment",
              content: <img src={Config.getImageUrl(img)} alt="Attachment" className="w-full" />,
              width: 500,
              maskClosable: true
            });
          }}
        />
      ) : <span className="text-gray-400">-</span>
    },
    {
      key: "order_date",
      title: t("order_date"),
      dataIndex: "order_date",
      render: (value) => dayjs(value).format("DD/MM/YYYY"),
    },
    {
      key: "expected_delivery_date",
      title: t("expected_delivery"),
      dataIndex: "expected_delivery_date",
      render: (value) => value ? dayjs(value).format("DD/MM/YYYY") : '-',
    },
    {
      key: "total_amount",
      title: t("total_amount"),
      dataIndex: "total_amount",
      render: (amount) => (
        <span className="font-semibold text-green-600 dark:text-green-400">
          {formatPrice(amount)}
        </span>
      ),
    },
    {
      key: "status",
      title: t("status"),
      dataIndex: "status",
      render: (status) => getStatusBadge(status),
    },
    {
      key: "items_count",
      title: t("items"),
      dataIndex: "items",
      render: (items) => (
        <Badge count={items?.length || 0} showZero />
      ),
    },
    {
      key: "create_at",
      title: t("created_at"),
      dataIndex: "created_at",
      render: (value, record) => dayjs(value || record.create_at).format("DD/MM/YYYY HH:mm"),
    },
    {
      key: "action",
      title: t("action"),
      width: 200,
      render: (value, data) => (
        <Space>
          {/* ✅ Add Receive Button if not delivered */}
          {data.status !== 'delivered' && data.status !== 'completed' && (
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              className="bg-green-600 hover:bg-green-700 border-green-600"
              onClick={() => handleOpenReceive(data)}
            >
              {t("receive_all") || "Receive All"}
            </Button>
          )}



          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => showDetailModal(data)}
          >
            {t("view")}
          </Button>

          {canUpdate && (
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onClickBtnEdit(data)}
            >
              {t("edit")}
            </Button>
          )}

          {canRemove && (
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => onClickBtnDelete(data)}
            >
              {t("delete")}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <MainPage loading={state.loading}>
      <style>{purchaseStyles}</style>
      <div className="purchase-page-container px-2 sm:px-4 lg:px-6">
        {/* Header Section */}
        <div className="purchase-header-card bg-white dark:bg-[#1E1E2E] dark:text-white rounded-lg shadow-sm p-4 mb-4 border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 w-full sm:w-auto">
              <Title level={4} className="mb-0 text-gray-900 dark:text-white flex items-center gap-2">
                <MdShoppingCart className="text-blue-500" />
                {t("purchase_orders")}
              </Title>
            </div>

            {canCreate && (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {/* 🆕 Global Transfer Button */}
                <Button
                  type="default"
                  size="large"
                  icon={<HistoryOutlined />}
                  onClick={() => navigate('/inventory-transactions')}
                  className="w-full sm:w-auto"
                >
                  {t("transfer_history") || "Transfer History"}
                </Button>
                <Button
                  type="primary"
                  size="large"
                  className="bg-orange-500 hover:bg-orange-600 border-orange-500 w-full sm:w-auto"
                  icon={<FaTruck />}
                  onClick={() => setTransferModal({ visible: true, selectedProduct: null })}
                >
                  {t("transfer_stock") || "Transfer Stock"}
                </Button>

                <Button
                  type="primary"
                  onClick={openModal}
                  icon={<MdOutlineCreateNewFolder />}
                  size="large"
                  className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600"
                >
                  {t("new_purchase_order")}
                </Button>
              </div>
            )}
          </div>

          {/* 🚚 Stock Transfer Modal */}
          <Modal
            title={
              <div className="flex items-center gap-2 text-orange-600">
                <FaTruck /> {t("transfer_stock") || "Transfer Stock"}
              </div>
            }
            open={transferModal.visible}
            onCancel={() => setTransferModal({ visible: false, selectedProduct: null })}
            footer={null}
            width={600}
          >
            <Form layout="vertical" onFinish={handleTransferSubmit}>
              <Form.Item
                label={t("destination_branch")}
                name="branch_id"
                rules={[{ required: true, message: t('please_select_destination_branch') }]}
              >
                <Select placeholder={t("select_branch")}>
                  {state.branches.map(b => (
                    <Option key={b.id} value={b.name}>{b.name}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label={t("select_product")}
                name="product_id"
                rules={[{ required: true, message: t('please_select_product') }]}
              >
                <Select
                  showSearch
                  placeholder={t("search_product")}
                  optionFilterProp="children"
                  onChange={(val, opt) => {
                    const prod = products.find(p => p.id === val);
                    setTransferModal(prev => ({
                      ...prev,
                      selectedProduct: prod
                    }));
                  }}
                  filterOption={(input, option) =>
                    (option?.children?.toString() ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {products.map(p => (
                    <Option key={p.id} value={p.id}>
                      {p.name} ({t('stock_label')} {p.qty} {p.unit})
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {transferModal.selectedProduct && (
                <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200 flex justify-between">
                  <span>{t('available_stock')}</span>
                  <span className={`font-bold ${transferModal.selectedProduct.qty <= 0 ? 'text-red-500' : 'text-green-600'}`}>
                    {transferModal.selectedProduct.qty} {transferModal.selectedProduct.unit}
                  </span>
                </div>
              )}

              <Form.Item
                label={t("transfer_quantity")}
                name="quantity"
                rules={[
                  { required: true, message: t('please_enter_quantity') },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || !transferModal.selectedProduct) return Promise.resolve();
                      if (value > transferModal.selectedProduct.qty) {
                        return Promise.reject(new Error(t('transfer_qty_error')));
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  placeholder={t('enter_quantity')}
                  status={transferModal.selectedProduct && transferModal.selectedProduct.qty <= 0 ? "error" : ""}
                />
              </Form.Item>

              <Form.Item label={t("note")} name="note">
                <Input.TextArea rows={2} placeholder={t('optional_note')} />
              </Form.Item>

              <div className="flex justify-end gap-2 mt-4">
                <Button onClick={() => setTransferModal({ visible: false, selectedProduct: null })}>
                  {t("cancel")}
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  className="bg-orange-500 hover:bg-orange-600 border-orange-500"
                  loading={state.loading}
                >
                  {t("transfer_now")}
                </Button>
              </div>
            </Form>
          </Modal>

          {/* Statistics */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6} md={4}>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {state.list.length}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {t("total_orders")}
                  </div>
                </div>
              </Col>
              <Col xs={12} sm={6} md={4}>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
                    {filteredList.length}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {t("filtered_results")}
                  </div>
                </div>
              </Col>
              <Col xs={12} sm={6} md={4}>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400">
                    {state.list.filter(p => p.status === 'pending').length}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {t("pending")}
                  </div>
                </div>
              </Col>
              <Col xs={12} sm={6} md={4}>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {formatPrice(state.list.reduce((sum, p) => sum + Number(p.total_amount || 0), 0))}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {t("total_value")}
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={24} md={8} className="flex sm:justify-end items-center mt-2 sm:mt-0">
                <Input.Search
                  onChange={(value) =>
                    setState((p) => ({ ...p, txtSearch: value.target.value }))
                  }
                  allowClear
                  onSearch={getList}
                  placeholder={t("search_by_order_number_or_supplier")}
                  size="large"
                  prefix={<SearchOutlined />}
                  style={{ maxWidth: 350, width: '100%' }}
                />
              </Col>
            </Row>
          </div>
        </div>

        {/* Form Modal */}
        <Modal
          title="Confirm Receipt & Stock In"
          open={isReceiveModalVisible}
          onOk={handleConfirmReceive}
          onCancel={() => setIsReceiveModalVisible(false)}
          okText="Confirm Received"
          cancelText="Cancel"
        >
          <p>This will mark the order as <b>Delivered</b> and update inventory.</p>
          <div className="mt-4">
            <Typography.Text strong>Received By (Name):</Typography.Text>
            <Input
              placeholder="Enter receiver name (e.g. Driver Name)"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              className="mt-1"
            />
          </div>
        </Modal>

        {/* Branch Selection Modal */}
        <Modal
          title={t("select_branch")}
          open={state.showBranchModal}
          onCancel={() => setState(p => ({ ...p, showBranchModal: false }))}
          footer={null}
          width={400}
        >
          <div className="space-y-2">
            {state.branches.map(branch => (
              <Button
                key={branch.id}
                block
                size="large"
                className="text-left justify-start h-auto py-3"
                onClick={() => {
                  setState(p => ({ ...p, showBranchModal: false }));
                  openModal();
                  // Short timeout to ensure Modal is mounted and Form is ready
                  setTimeout(() => {
                    form.setFieldsValue({ branch_id: branch.id });
                  }, 100);
                  message.success(`${t("selected")} ${branch.name}`);
                }}
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">{branch.name}</span>
                  {branch.description && <span className="text-xs text-gray-500">{branch.description}</span>}
                </div>
              </Button>
            ))}
            <Button
              block
              danger
              type="dashed"
              className="mt-2"
              onClick={() => {
                form.setFieldsValue({ branch_id: null });
                setState(p => ({ ...p, showBranchModal: false }));
                message.info(t("branch_cleared"));
              }}
            >
              {t("clear_selection")}
            </Button>
          </div>
        </Modal>

        <Modal
          open={state.visible}
          title={
            <span className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <MdShoppingCart className="text-blue-500" />
              {t(form.getFieldValue("id") ? "edit_purchase_order" : "new_purchase_order")}
            </span>
          }
          onCancel={closeModal}
          footer={null}
          width="95%"
          style={{ maxWidth: '900px', top: 20 }}
          className="purchase-modal"
        >
          <Form layout="vertical" form={form} onFinish={onFinish}>
            <Form.Item name="id" hidden>
              <Input />
            </Form.Item>

            {/* Hidden Branch ID field */}
            <Form.Item name="branch_id" hidden>
              <Input />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="supplier_id"
                  label={<span className="font-medium">{t("Supplier")}</span>}
                  rules={[{ required: true, message: t("please_select_supplier") }]}
                >
                  <Select
                    placeholder={t("select_supplier")}
                    showSearch
                    size="large"
                    optionFilterProp="label"
                  >
                    {state.suppliers.map(supplier => (
                      <Option key={supplier.id} value={supplier.id} label={`${supplier.name} (${supplier.code})`}>
                        {supplier.name} ({supplier.code})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="order_no"
                  label={<span className="font-medium">{t("order_number")}</span>}
                  rules={[{ required: true, message: t("required_field") }]}
                >
                  <Input placeholder="PO-001" size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="order_date"
                  label={<span className="font-medium">{t("order_date")}</span>}
                  rules={[{ required: true, message: t("order_date_is_required") }]}
                  initialValue={dayjs()}
                >
                  <DatePicker
                    size="large"
                    style={{ width: '100%' }}
                    format="DD/MM/YYYY"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="expected_delivery_date"
                  label={<span className="font-medium">{t("expected_delivery_date")}</span>}
                >
                  <DatePicker
                    size="large"
                    style={{ width: '100%' }}
                    format="DD/MM/YYYY"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="status"
                  label={<span className="font-medium">{t("status")}</span>}
                  initialValue="pending"
                >
                  <Select size="large">
                    <Option value="pending">{t("pending")}</Option>
                    <Option value="confirmed">{t("confirmed")}</Option>
                    <Option value="shipped">{t("shipped")}</Option>
                    <Option value="delivered">{t("delivered")}</Option>
                    <Option value="cancelled">{t("cancelled")}</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="payment_terms"
                  label={<span className="font-medium">{t("payment_terms")}</span>}
                >
                  <Select size="large" placeholder={t("select_payment_terms")}>
                    <Option value="cod">{t("cash_on_delivery")}</Option>
                    <Option value="net30">{t("net_30_days")}</Option>
                    <Option value="net60">{t("net_60_days")}</Option>
                    <Option value="advance">{t("advance_payment")}</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>


            {/* Order Items */}
            <Divider>{t("order_items")}</Divider>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {orderItems.map((item, index) => (
                <Card key={index} size="small" className="bg-gray-50 dark:bg-gray-700">
                  <Row gutter={[8, 8]} align="middle">
                    <Col xs={24} sm={8}>
                      <div className="text-xs text-gray-500 mb-1">{t("product")} *</div>
                      <Select
                        value={item.product_id}
                        onChange={(value) => updateOrderItem(index, 'product_id', value)}
                        placeholder={t("select_product")}
                        size="middle"
                        style={{ width: '100%' }}
                        showSearch
                        optionFilterProp="label"
                      >
                        {config.product
                          .filter(prod => Number(prod.actual_price) > 0)
                          .map(prod => (
                            <Option key={prod.value} value={prod.value} label={`${prod.label} (${prod.category_name})`}>
                              {prod.label} ({prod.category_name})
                            </Option>
                          ))}
                      </Select>
                    </Col>
                    <Col xs={8} sm={4}>
                      <div className="text-xs text-gray-500 mb-1">{t("quantity")} *</div>
                      <InputNumber
                        value={item.quantity}
                        onChange={(value) => updateOrderItem(index, 'quantity', value)}
                        min={1}
                        size="middle"
                        style={{ width: '100%' }}
                      />
                    </Col>
                    <Col xs={8} sm={4}>
                      <div className="text-xs text-gray-500 mb-1">{t("unit_price")} *</div>
                      <InputNumber
                        value={item.unit_price}
                        onChange={(value) => updateOrderItem(index, 'unit_price', value)}
                        min={0}
                        step={0.01}
                        size="middle"
                        style={{ width: '100%' }}
                        prefix="$"
                      />
                    </Col>
                    <Col xs={6} sm={4}>
                      <Tooltip title={`(${item.quantity} × ${item.unit_price}) ÷ ${item.actual_price}`}>
                        <div className="text-xs text-gray-500 mb-1">{t("total")} <InfoCircleOutlined /></div>
                        <InputNumber
                          value={item.total}
                          disabled
                          size="middle"
                          style={{ width: '100%' }}
                          prefix="$"
                        />
                      </Tooltip>
                    </Col>
                    <Col xs={2} sm={4} className="text-center">
                      {orderItems.length > 1 && (
                        <Button
                          type="text"
                          danger
                          icon={<MinusCircleOutlined />}
                          onClick={() => removeOrderItem(index)}
                          size="small"
                        />
                      )}
                    </Col>
                  </Row>
                </Card>
              ))}
            </div>

            <Button
              type="dashed"
              onClick={addOrderItem}
              icon={<PlusOutlined />}
              size="middle"
              className="w-full mt-2"
            >
              {t("add_item")}
            </Button>

            <div className="mt-4 p-3 purchase-total-card rounded">
              <div className="flex justify-between items-center">
                <Text strong className="text-lg">{t("total_amount")}:</Text>
                <Tooltip title="ប្រមាណជាគ្មាន liters - តម្លៃបម្លែងរួចហើយ">
                  <Text strong className="text-2xl text-blue-600 dark:text-blue-400">
                    ${calculateTotal().toFixed(2)} <InfoCircleOutlined className="text-sm" />
                  </Text>
                </Tooltip>
              </div>
            </div>

            <Form.Item
              name="notes"
              label={<span className="font-medium">{t("notes")}</span>}
            >
              <TextArea
                placeholder={t("add_notes")}
                rows={3}
                size="large"
              />
            </Form.Item>

            <Form.Item label={t("attachment_card_image")}>
              <Upload
                listType="picture-card"
                fileList={fileList}
                onChange={({ fileList }) => setFileList(fileList)}
                beforeUpload={() => false}
                maxCount={1}
              >
                {fileList.length < 1 && (
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>{t("upload")}</div>
                  </div>
                )}
              </Upload>
              <div style={{ marginTop: 4, fontStyle: 'italic' }}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  * {t("image_upload_note")}
                </Typography.Text>
              </div>
            </Form.Item>



            {/* Buttons */}
            <Form.Item className="mb-0">
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                <Button onClick={closeModal} size="large" block className="sm:w-auto">
                  {t("cancel")}
                </Button>
                <Button type="primary" htmlType="submit" size="large" block className="sm:w-auto bg-blue-500" loading={state.loading}>
                  {t(form.getFieldValue("id") ? "update" : "save")}
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Modal>

        {/* Detail & Table Modals - Same as before, keeping existing code */}
        <Modal
          open={isDetailModalVisible}
          title={
            <span className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <MdReceipt className="text-blue-500" />
              {t("purchase_order_details")}
            </span>
          }
          onCancel={handleDetailModalClose}
          footer={null}
          width="95%"
          style={{ maxWidth: '600px', top: 20 }}
        >
          {selectedPurchase && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <Card className="purchase-item-card border-0 mb-3" size="small">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Text className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                        {t("Order Number")}
                      </Text>
                      <Text className="text-base font-semibold text-gray-900 dark:text-white block">
                        {selectedPurchase.order_no}
                      </Text>
                    </div>
                    <div>
                      <Text className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                        {t("Status")}
                      </Text>
                      {getStatusBadge(selectedPurchase.status)}
                    </div>
                    <div>
                      <Text className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                        {t("Supplier")}
                      </Text>
                      <Text className="text-base font-semibold text-gray-900 dark:text-white block">
                        {selectedPurchase.supplier_name}
                      </Text>
                    </div>
                    <div>
                      <Text className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                        {t("Order Date")}
                      </Text>
                      <Text className="text-base text-gray-900 dark:text-white block">
                        {dayjs(selectedPurchase.order_date).format("DD/MM/YYYY")}
                      </Text>
                    </div>
                  </div>
                </Card>

                <div>
                  <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                    {t("Order Items")}
                  </Text>
                  <div className="space-y-2">
                    {selectedPurchase.items?.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                        <div>
                          <Text className="text-sm font-medium">{item.product_name}</Text>
                          <Text className="text-xs text-gray-500 block">
                            ${Number(item.unit_price).toFixed(2)} × {item.quantity}
                          </Text>
                        </div>
                        <Text className="text-sm font-semibold text-green-600">
                          ${Number(item.total || 0).toFixed(2)}
                        </Text>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-3 bg-blue-50 dark:bg-blue-900 p-3 rounded">
                  <div className="flex justify-between items-center">
                    <Text className="text-lg font-semibold">{t("Total Amount")}</Text>
                    <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      ${Number(selectedPurchase.total_amount || 0).toFixed(2)}
                    </Text>
                  </div>
                </div>

                {selectedPurchase.notes && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                    <Text className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                      {t("Notes")}
                    </Text>
                    <Text className="text-sm text-gray-700 dark:text-gray-300 block">
                      {selectedPurchase.notes}
                    </Text>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <Text className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                    {t("Created At")}
                  </Text>
                  <Text className="text-sm font-medium text-gray-900 dark:text-white block">
                    {dayjs(selectedPurchase.created_at || selectedPurchase.create_at).format("DD/MM/YYYY HH:mm")}
                  </Text>
                </div>
              </div>


              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => {
                    handleDetailModalClose();
                    onClickBtnEdit(selectedPurchase);
                  }}
                  block
                  size="large"
                  className="bg-blue-500"
                >
                  {t("edit")}
                </Button>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    handleDetailModalClose();
                    onClickBtnDelete(selectedPurchase);
                  }}
                  block
                  size="large"
                >
                  {t("delete")}
                </Button>
              </div>
            </div>
          )}
        </Modal>

        <div className="hidden md:block purchase-table-card rounded-lg shadow-sm overflow-hidden">
          <Table
            rowClassName={() => 'pos-row'}
            dataSource={filteredList}
            columns={columns}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `${t("Total")} ${total} ${t("items")}`,
            }}
            scroll={{ x: true }}
            rowKey="id"
          />
        </div>

        <div className="md:hidden">
          {state.loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500 dark:text-gray-400">{t("Loading...")}</div>
            </div>
          ) : filteredList.length > 0 ? (
            <div className="space-y-3">
              {filteredList.map((purchase, index) => (
                <PurchaseMobileCard
                  key={purchase.id}
                  purchase={purchase}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <Card className="text-center py-8 bg-white dark:bg-gray-800">
              <Text className="text-gray-500 dark:text-gray-400">
                {t("No data available")}
              </Text>
            </Card>
          )}
        </div>
      </div >


      {/* 🚚 Distribute Stock Modal */}
      <Modal
        open={distributeModal.visible}
        title={
          <div className="flex items-center gap-2">
            <FaTruck className="text-orange-500" size={24} />
            <div>
              <div className="text-lg font-bold">{t("distribute_stock") || "Distribute Stock"}</div>
              <div className="text-xs text-gray-500">{t("PO")} #{distributeModal.purchase?.order_no}</div>
            </div>
          </div>
        }
        onCancel={() => setDistributeModal(p => ({ ...p, visible: false }))}
        width={800}
        footer={
          [
            <Button key="cancel" onClick={() => setDistributeModal(p => ({ ...p, visible: false }))}>
              {t("cancel")}
            </Button>,
            <Button key="submit" type="primary" onClick={handleDistributeSubmit} className="bg-orange-500 hover:bg-orange-600">
              {t("distribute_now") || "Distribute Now"}
            </Button>
          ]}
      >
        <div className="space-y-4 pt-4">
          {/* Branch Selection */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("select_destination_branch") || "Select Destination Branch"} <span className="text-red-500">*</span>
            </label>
            <Select
              showSearch
              placeholder={t("select_branch")}
              optionFilterProp="children"
              className="w-full"
              size="large"
              onChange={(val) => setDistributeModal(p => ({ ...p, branch_id: val }))}
              value={distributeModal.branch_id}
            >
              {state.branches.map(b => (
                <Select.Option key={b.id} value={b.name}>{b.name}</Select.Option>
              ))}
            </Select>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="p-3 border-b">{t("product")}</th>
                  <th className="p-3 border-b text-center">{t("ordered")}</th>
                  <th className="p-3 border-b text-center">{t("received")}</th>
                  <th className="p-3 border-b text-center text-blue-600">{t("remaining")}</th>
                  <th className="p-3 border-b text-right header-input">{t("qty_to_send")}</th>
                </tr>
              </thead>
              <tbody>
                {distributeModal.distributions.map((item, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="p-3 font-medium">{item.product_name}</td>
                    <td className="p-3 text-center">{item.ordered_qty}</td>
                    <td className="p-3 text-center text-green-600">{item.received_qty}</td>
                    <td className="p-3 text-center font-bold text-blue-600">{item.remaining_qty}</td>
                    <td className="p-3 text-right">
                      <InputNumber
                        min={0}
                        max={item.remaining_qty}
                        value={item.quantity}
                        onChange={(val) => {
                          const newDist = [...distributeModal.distributions];
                          newDist[idx].quantity = val;
                          setDistributeModal(p => ({ ...p, distributions: newDist }));
                        }}
                        className="w-32"
                        status={item.quantity > item.remaining_qty ? 'error' : ''}
                      />
                    </td>
                  </tr>
                ))}
                {distributeModal.distributions.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-4 text-center text-gray-500">
                      {t("no_items_available")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="text-xs text-gray-500 italic mt-2">
            * {t("distribute_note") || "Only items with 'Qty to Send' > 0 will be distributed."}
          </div>
        </div>
      </Modal>

    </MainPage>
  );
}

export default PurchasePage;