// ✅ FIXED PurchasePage.jsx - With correct actual_price calculation

import React, { useEffect, useState } from "react";
import { request, formatPrice } from "../../util/helper";
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
  Tooltip
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
  CheckCircleOutlined
} from '@ant-design/icons';

import { useTranslation } from "../../locales/TranslationContext";
import { configStore } from "../../store/configStore";

const { Text, Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// ✅ Add Global Style Override for Purchase Page
const purchaseStyles = `
  /* Dark Mode Glass Effect */
  :global(.dark) .ant-card {
    background: rgba(255, 255, 255, 0.85) !important;
    border-color: rgba(255, 255, 255, 0.4) !important;
    backdrop-filter: blur(12px);
  }
  
  :global(.dark) .ant-table {
    background: transparent !important;
  }

  :global(.dark) .ant-table-thead > tr > th {
    background: rgba(243, 244, 246, 0.9) !important;
    color: #1f2937 !important;
  }

  :global(.dark) .ant-table-tbody > tr > td {
     color: #374151 !important;
  }

  :global(.dark) .ant-modal-content,
  :global(.dark) .ant-modal-header {
    background: rgba(255, 255, 255, 0.95) !important;
    color: #1f2937 !important;
  }

  :global(.dark) .ant-input,
  :global(.dark) .ant-select-selector,
  :global(.dark) .ant-picker,
  :global(.dark) .ant-input-number {
    background: white !important;
    border-color: #d1d5db !important;
    color: #1f2937 !important;
  }
`;

function PurchasePage() {
  const [form] = Form.useForm();
  const { t } = useTranslation();
  const { config } = configStore();

  const [state, setState] = useState({
    list: [],
    loading: false,
    visible: false,
    txtSearch: "",
    suppliers: [],
  });

  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [orderItems, setOrderItems] = useState([]);

  // ✅ New State for Receive Modal
  const [isReceiveModalVisible, setIsReceiveModalVisible] = useState(false);
  const [receivingOrder, setReceivingOrder] = useState(null);
  const [receiverName, setReceiverName] = useState("");

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

  useEffect(() => {
    getList();
    getSuppliers();
  }, []);

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
  };

  const onFinish = async (items) => {
    var method = "post";
    var url = "purchase";

    if (form.getFieldValue("id")) {
      method = "put";
      url = "purchase/" + form.getFieldValue("id");
    }

    const purchaseData = {
      ...items,
      order_date: items.order_date ? dayjs(items.order_date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
      expected_delivery_date: items.expected_delivery_date ? dayjs(items.expected_delivery_date).format('YYYY-MM-DD') : null,
      items: orderItems,
      total_amount: calculateTotal(),
      status: items.status || 'pending'
    };

    setState((p) => ({
      ...p,
      loading: true,
    }));

    const res = await request(url, method, purchaseData);

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
      order_no: purchase.order_no,
      order_date: purchase.order_date ? dayjs(purchase.order_date) : null,
      expected_delivery_date: purchase.expected_delivery_date ? dayjs(purchase.expected_delivery_date) : null,
      status: purchase.status,
      payment_terms: purchase.payment_terms,
      notes: purchase.notes
    });

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

  const filteredList = state.list.filter(purchase => {
    const searchLower = state.txtSearch.toLowerCase();
    return (
      purchase.order_no?.toLowerCase().includes(searchLower) ||
      purchase.supplier_name?.toLowerCase().includes(searchLower) ||
      purchase.status?.toLowerCase().includes(searchLower)
    );
  });

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
              Receive
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
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onClickBtnEdit(data)}
          >
            {t("edit")}
          </Button>
          <Button
            type="primary"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => onClickBtnDelete(data)}
          >
            {t("delete")}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <MainPage loading={state.loading}>
      <style>{purchaseStyles}</style>
      <div className="px-2 sm:px-4 lg:px-6">
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 w-full sm:w-auto">
              <Title level={4} className="mb-3 sm:mb-2 text-gray-900 dark:text-white flex items-center gap-2">
                <MdShoppingCart className="text-blue-500" />
                {t("purchase_orders")}
              </Title>
              <Input.Search
                onChange={(value) =>
                  setState((p) => ({ ...p, txtSearch: value.target.value }))
                }
                allowClear
                onSearch={getList}
                placeholder={t("search_by_order_number_or_supplier")}
                size="large"
                prefix={<SearchOutlined />}
                className="w-full sm:w-64"
              />
            </div>

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
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {state.suppliers.map(supplier => (
                      <Option key={supplier.id} value={supplier.id}>
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
                        filterOption={(input, option) =>
                          option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                        }
                      >
                        {config.product
                          .filter(prod => Number(prod.actual_price) > 0)
                          .map(prod => (
                            <Option key={prod.value} value={prod.value}>
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

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded">
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

            {/* Buttons */}
            <Form.Item className="mb-0">
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                <Button onClick={closeModal} size="large" block className="sm:w-auto">
                  {t("cancel")}
                </Button>
                <Button type="primary" htmlType="submit" size="large" block className="sm:w-auto bg-blue-500">
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
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
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
                </div>

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

        <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <Table
            rowClassName={(record, index) =>
              `pos-row ${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'}`
            }
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
      </div>

      <style jsx>{`
        .pos-row {
          transition: background-color 0.2s;
        }
        .pos-row:hover {
          background-color: rgba(59, 130, 246, 0.1) !important;
        }
        .dark .pos-row:hover {
          background-color: rgba(59, 130, 246, 0.2) !important;
        }
        
        @media (max-width: 640px) {
          .ant-modal-body {
            padding: 16px;
          }
        }
      `}</style>
    </MainPage>
  );
}

export default PurchasePage;