import React, { useEffect, useState } from "react";
import {
  Button,
  Col,
  Divider,
  Form,
  DatePicker,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Card,
  Tooltip,
  Typography
} from "antd";
import { formatDateClient, formatPrice, isPermission, request } from "../../util/helper";
import { MdAdd, MdDelete, MdEdit, MdOutlineCreateNewFolder } from "react-icons/md";
import { AiOutlinePlusCircle } from "react-icons/ai";
import { BsTrash, BsSearch, BsCalendar3, BsBoxSeam } from "react-icons/bs";
import MainPage from "../../component/layout/MainPage";
import { configStore } from "../../store/configStore";
import * as XLSX from 'xlsx/xlsx.mjs';
import { getProfile } from "../../store/profile.store";
import { FaFileExport, FaMoneyBillWave, FaWarehouse } from "react-icons/fa";
import { RiDashboardLine } from "react-icons/ri";
import moment from 'moment';
import dayjs from 'dayjs';
import { useTranslation } from "../../locales/TranslationContext";

import "./product.css"
const { Title, Text } = Typography;

function ProductPage() {
  const { t } = useTranslation();
  const { config } = configStore();
  const [form] = Form.useForm();
  const [list, setList] = useState([]);
  const [viewMode, setViewMode] = useState('my');

  const [customers, setCustomers] = useState([]);
  const [datePickerOpen, setDatePickerOpen] = useState({
    create_at: false,
    receive_date: false
  });
  const [state, setState] = useState({
    list: [],
    total: 0,
    loading: false,
    visibleModal: false,
    is_list_all: false,
    totals: {},
  });

  const [productItems, setProductItems] = useState([
    { key: 0, name: undefined, category_id: undefined, qty: undefined, unit_price: undefined }
  ]);

  const [isEditMode, setIsEditMode] = useState(false);

  const getTotalPrice = (item) => {
    return parseFloat(item.total_price || 0);
  };

  const formatCurrencyalltotal = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  };

  const refPage = React.useRef(1);
  const [filter, setFilter] = useState({
    txt_search: "",
    category_id: "",
    brand: "",
  });

  useEffect(() => {
    getList();
    fetchCustomers();
  }, []);

  const getList = async () => {
    var param = {
      ...filter,
      page: 1,
      is_list_all: 1,
    };

    setState((pre) => ({ ...pre, loading: true }));
    const { id } = getProfile();
    if (!id) {
      return;
    }
    const res = await request(`product/my-group`, "get", param);
    if (res && !res.error) {
      const totals = res.list.reduce((acc, item) => {
        const categoryName = item.category_name || 'Uncategorized';

        if (!acc[categoryName]) {
          acc[categoryName] = {
            quantity: 0,
            totalValue: 0
          };
        }

        acc[categoryName].quantity += Number(item.qty) || 0;
        acc[categoryName].totalValue += Number(item.total_price) || 0;

        return acc;
      }, {});

      setState((pre) => ({
        ...pre,
        list: res.list,
        total: refPage.current === 1 ? res.total : pre.total,
        loading: false,
        totals,
      }));

      setList(res.list);
    }
  };

  const onCloseModal = () => {
    setState((p) => ({
      ...p,
      visibleModal: false,
    }));
    form.resetFields();
    setProductItems([{ key: 0, name: undefined, category_id: undefined, qty: undefined, unit_price: undefined }]);
    setIsEditMode(false);
  };

  const addProductItem = () => {
    const newKey = productItems.length > 0 ? Math.max(...productItems.map(item => item.key)) + 1 : 0;
    setProductItems([...productItems, { key: newKey, name: undefined, category_id: undefined, qty: undefined, unit_price: undefined }]);
  };

  const removeProductItem = (key) => {
    if (productItems.length > 1) {
      setProductItems(productItems.filter(item => item.key !== key));
    } else {
      message.warning(t("at_least_one_product_required"));
    }
  };

  const handleSaveAllProducts = async (formValues) => {
    const { id } = getProfile();
    if (!id) {
      message.error(t("user_id_missing"));
      return;
    }

    if (!formValues.customer_id) {
      message.error(t("please_select_customer"));
      return;
    }

    let products = [];

    if (formValues.products) {
      if (Array.isArray(formValues.products)) {
        products = formValues.products.filter(product => product && typeof product === 'object');
      } else if (typeof formValues.products === 'object') {
        products = Object.values(formValues.products).filter(product => product && typeof product === 'object');
      }
    }

    if (products.length === 0) {
      message.error(t("please_add_at_least_one_product"));
      return;
    }

    const validationErrors = [];
    products.forEach((product, index) => {
      if (!product || typeof product !== 'object') {
        validationErrors.push(`${t("product")} ${index + 1}: ${t("invalid_product_data")}`);
        return;
      }

      if (!product.name) validationErrors.push(`${t("product")} ${index + 1}: ${t("name_required")}`);
      if (!product.category_id) validationErrors.push(`${t("product")} ${index + 1}: ${t("category_required")}`);

      const qty = Number(product.qty);
      if (isNaN(qty) || qty <= 0) {
        validationErrors.push(`${t("product")} ${index + 1}: ${t("valid_quantity_required")}`);
      }

      const unitPrice = Number(product.unit_price);
      if (isNaN(unitPrice) || unitPrice <= 0) {
        validationErrors.push(`${t("product")} ${index + 1}: ${t("valid_unit_price_required")}`);
      }
    });

    if (validationErrors.length > 0) {
      console.error('Validation Errors:', validationErrors);
      message.error(`${t("validation_failed")}:\n${validationErrors.join('\n')}`);
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      const productsData = products.map(product => {
        const qty = Number(product.qty) || 1;
        const unitPrice = Number(product.unit_price) || 0.01;

        let actualPrice = Number(product.actual_price);
        if (!actualPrice || isNaN(actualPrice)) {
          const categoryInfo = config.category.find(c => c.value === product.category_id);
          actualPrice = Number(categoryInfo?.actual_price) || 1190;
        }

        return {
          user_id: id,
          name: product.name,
          category_id: product.category_id,
          company_name: formValues.company_name || '',
          description: formValues.description || '',
          qty: qty,
          unit: formValues.unit || 'L',
          unit_price: unitPrice,
          discount: Number(formValues.discount) || 0,
          actual_price: actualPrice,
          status: formValues.status || 1,
          create_at: formValues.create_at
            ? formValues.create_at.format('YYYY-MM-DD HH:mm:ss')
            : new Date().toISOString().slice(0, 19).replace('T', ' '),
          receive_date: formValues.receive_date
            ? formValues.receive_date.format('YYYY-MM-DD HH:mm:ss')
            : new Date().toISOString().slice(0, 19).replace('T', ' ')
        };
      });

      const response = await request('product/createMultiple', 'post', {
        customer_id: formValues.customer_id,
        products: productsData
      });

      if (response && !response.error) {
        const successCount = response.data.success.length;
        const errorCount = response.data.errors.length;

        message.success(t("products_saved_successfully", { count: successCount }));

        if (errorCount > 0) {
          response.data.errors.forEach(err => {
            message.error(`${t("error")}: ${err.productName} - ${err.error}`);
          });
        }

        getList();
        onCloseModal();
      } else {
        message.error(response.message || t("failed_to_save_products"));
      }
    } catch (error) {
      console.error('Error saving products:', error);
      message.error(t("error_saving_products"));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const onFinish = async (formValues) => {
    if (isEditMode && formValues.id) {
      const { id: userId } = getProfile();
      if (!userId) {
        message.error(t("user_id_missing"));
        return;
      }

      setState(prev => ({ ...prev, loading: true }));

      try {
        const updateData = {
          user_id: userId,
          name: formValues.products[0].name,
          category_id: formValues.products[0].category_id,
          company_name: formValues.company_name,
          description: formValues.description,
          qty: Number(formValues.products[0].qty),
          unit: formValues.unit,
          unit_price: Number(formValues.products[0].unit_price),
          discount: Number(formValues.discount) || 0,
          actual_price: Number(formValues.products[0].actual_price) || 1190,
          status: formValues.status,
          create_at: formValues.create_at?.format('YYYY-MM-DD HH:mm:ss'),
          receive_date: formValues.receive_date?.format('YYYY-MM-DD HH:mm:ss'),
          customer_id: formValues.customer_id
        };

        const response = await request(`product/${formValues.id}`, "put", updateData);

        if (response && !response.error) {
          message.success(t("product_updated_successfully"));
          getList();
          onCloseModal();
        } else {
          message.error(response?.message || t("failed_to_update_product"));
        }
      } catch (error) {
        console.error('Error updating product:', error);
        message.error(t("error_updating_product"));
      } finally {
        setState(prev => ({ ...prev, loading: false }));
      }
    } else {
      await handleSaveAllProducts(formValues);
    }
  };

  const handleProductChange = async (value, key, field) => {
    const updatedItems = productItems.map(item => {
      if (item.key === key) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setProductItems(updatedItems);

    const fieldName = `products[${key}].${field}`;

    if (field === 'category_id' && value) {
      const categoryInfo = config.category.find(c => c.value === value);
      const categoryBarcode = categoryInfo?.barcode || '';
      const actualPrice = categoryInfo?.actual_price || 1190;

      const updatedItemsWithBarcode = productItems.map(item => {
        if (item.key === key) {
          return {
            ...item,
            [field]: value,
            barcode: categoryBarcode,
            actual_price: actualPrice
          };
        }
        return item;
      });

      setProductItems(updatedItemsWithBarcode);

      form.setFieldsValue({
        [fieldName]: value,
        [`products[${key}].barcode`]: categoryBarcode,
        [`products[${key}].actual_price`]: actualPrice
      });
    } else {
      let processedValue = value;
      if (field === 'qty' || field === 'unit_price') {
        processedValue = Number(value);
      }

      form.setFieldsValue({
        [fieldName]: processedValue
      });
    }
  };

  const onBtnNew = async () => {
    const res = await request("new_barcode", "post");
    if (res && !res.error) {
      form.setFieldsValue({
        barcode: res.barcode,
        create_at: moment(),
        receive_date: moment(),
      });

      setState((p) => ({
        ...p,
        visibleModal: true,
      }));

      setProductItems([{ key: 0, name: undefined, category_id: undefined, qty: undefined, unit_price: undefined }]);
      setIsEditMode(false);
    }
  };

  const onFilter = () => {
    getList();
  };

  const onClickEdit = (data, index) => {
    setIsEditMode(true);

    setState({
      ...state,
      visibleModal: true,
    });

    form.setFieldsValue({
      id: data.id,
      user_id: data.user_id,
      company_name: data.company_name,
      unit: data.unit,
      description: data.description,
      status: data.status,
      create_at: data.create_at ? dayjs(data.create_at) : null,
      receive_date: data.receive_date ? dayjs(data.receive_date) : null,
      customer_id: data.customer_id,
      products: [{
        name: data.name,
        category_id: data.category_id,
        qty: data.qty,
        unit_price: data.unit_price,
        actual_price: data.actual_price || 1190,
        barcode: data.barcode,
      }]
    });

    setProductItems([
      {
        key: 0,
        name: data.name,
        category_id: data.category_id,
        qty: data.qty,
        unit_price: data.unit_price,
        actual_price: data.actual_price || 1190,
        barcode: data.barcode,
      },
    ]);
  };

  const onClickDelete = async (data, index) => {
    Modal.confirm({
      title: t("delete_product_confirm"),
      content: `${t("product")}: ${data.name} (${data.barcode})`,
      okText: t("yes_delete"),
      okType: "danger",
      cancelText: t("cancel"),
      async onOk() {
        try {
          const res = await request(`product/${data.id}`, "delete");
          if (res && !res.error) {
            message.success(t("product_deleted_successfully"));
            getList();
          } else {
            message.error(res?.message || t("failed_to_delete_product"));
          }
        } catch (err) {
          console.error("Delete Error:", err);
          message.error(t("error_deleting_product"));
        }
      },
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const onValuesChange = (changedValues, allValues) => {
    if (changedValues.qty || changedValues.unit_price || changedValues.discount || changedValues.actual_price) {
      const { qty, unit_price, discount = 0, actual_price } = allValues;

      if (qty && unit_price && actual_price) {
        const totalPrice = (qty * unit_price) * (1 - discount / 100) / actual_price;
        const roundedTotalPrice = Math.round(totalPrice);
        form.setFieldsValue({ price: roundedTotalPrice });
      }
    }
  };

  const fetchCustomers = async () => {
    const { id } = getProfile();
    if (!id) return;

    try {
      const res = await request(`customer/my-group`, "get");
      if (res && res.list) {
        const customers = res.list.map(cust => ({
          label: `${cust.name} (${cust.tel})`,
          value: cust.id,
          address: cust.address,
          tel: cust.tel
        }));
        setCustomers(customers);
      }
    } catch (error) {
      message.error(t("error_fetching_customers"));
    }
  };

  return (
    <MainPage loading={state.loading}>
      {/* Header Section */}
      <Card className="product-header-card">
        <Row align="middle" justify="space-between" gutter={16}>
          <Col>
            <div className="product-header-flex">
              <div className="product-icon-container">
                <BsBoxSeam size={24} className="product-icon-blue" />
              </div>
              <div>
                <div className="product-title-khmer">{t("product_management")}</div>
                <div className="product-stats-container">
                  <RiDashboardLine className="product-stats-icon" />
                  <span className="product-stats-text">{t("total")}: {state.total} {t("products")}</span>
                </div>
              </div>
            </div>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                onClick={onBtnNew}
                icon={<MdOutlineCreateNewFolder />}
                className="product-add-btn"
              >
                {t("add_product")}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Filter Section */}
      <Card className="product-filter-card">
        <Form layout="horizontal" className="product-filter-form">
          <Form.Item className="product-search-item">
            <Input.Search
              onChange={(event) => setFilter((p) => ({ ...p, txt_search: event.target.value }))}
              allowClear
              placeholder={t("search_products")}
              className="product-search-input"
              size="large"
            />
          </Form.Item>
          <Form.Item className="product-category-item">
            <Select
              allowClear
              style={{ width: '100%' }}
              placeholder={t("select_category")}
              options={config.category}
              onChange={(id) => setFilter((pre) => ({ ...pre, category_id: id }))}
              size="large"
            />
          </Form.Item>
          <Form.Item className="product-brand-item">
            <Select
              allowClear
              style={{ width: '100%' }}
              placeholder={t("select_brand")}
              options={config.brand}
              onChange={(id) => setFilter((pre) => ({ ...pre, brand: id }))}
              size="large"
            />
          </Form.Item>
          <Button
            onClick={onFilter}
            type="primary"
            icon={<BsSearch />}
            size="large"
            className="product-filter-btn"
          >
            {t("filter")}
          </Button>
        </Form>
      </Card>

      {/* Stats Cards */}
      <Row style={{ marginBottom: 24, borderRadius: 12 }} gutter={[16, 16]}>
        {Object.entries(state.totals || {}).map(([category, totals]) => {
          const categoryColors = {
            'ហ្កាស(LPG)': { bg: 'product-card-amber', text: 'product-text-amber', icon: <FaWarehouse className="product-icon-amber" /> },
            'ប្រេងសាំងធម្មតា(EA)': { bg: 'product-card-cyan', text: 'product-text-cyan', icon: <FaMoneyBillWave className="product-icon-cyan" /> },
            'ប្រេងម៉ាស៊ូត(Do)': { bg: 'product-card-green', text: 'product-text-green', icon: <FaWarehouse className="product-icon-green" /> },
            'ប្រេងសាំងស៊ុបពែរ(Super)': { bg: 'product-card-blue', text: 'product-text-blue', icon: <FaMoneyBillWave className="product-icon-blue" /> },
            'default': { bg: 'product-card-gray', text: 'product-text-gray', icon: <BsBoxSeam className="product-icon-gray" /> }
          };

          const colors = categoryColors[category] || categoryColors['default'];

          return (
            <Col key={category} xs={24} sm={12} md={8} lg={6}>
              <Card className={`product-stat-card ${colors.bg}`}>
                <div className="product-stat-header">
                  <div className="product-stat-icon-container">
                    <div className="product-stat-icon-wrapper">
                      {colors.icon}
                    </div>
                    <div>
                      <div className={`product-stat-title ${colors.text}`}>{category}</div>
                      <div className="product-stat-subtitle">{t("category")}</div>
                    </div>
                  </div>
                </div>
                <Divider className="product-stat-divider" />
                <div className="product-stat-metrics">
                  <div>
                    <div className="product-stat-label">{t("quantity")}</div>
                    <div className="product-stat-value">{totals.quantity.toLocaleString()}L</div>
                  </div>
                  <div>
                    <div className="product-stat-label">{t("total_value")}</div>
                    <div className="product-stat-value-highlight">{formatCurrencyalltotal(totals.totalValue)}</div>
                  </div>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Product Table */}
      <Card className="product-table-card">
        <Table
          className="product-table"
          rowClassName={() => "product-table-row"}
          dataSource={state.list}
          pagination={false}
          columns={[
            {
              key: "name",
              title: (
                <div className="product-table-header">
                  <div className="product-table-header-khmer">{t("name")}</div>
                </div>
              ),
              dataIndex: "name",
              render: (text) => {
                const displayText = text === "oil" ? "ប្រេងឥន្ធនៈ" : text;
                return (
                  <div className="product-table-text" title={displayText || ""}>
                    {displayText || "N/A"}
                  </div>
                );
              },
            },
            {
              key: "barcode",
              title: (
                <div className="product-table-header">
                  <div className="product-table-header-khmer">{t("barcode")}</div>
                </div>
              ),
              dataIndex: "category_barcode",
              render: (value) => <Tag color="blue" className="product-tag">{value}</Tag>,
            },
            {
              key: "category_name",
              title: (
                <div className="product-table-header">
                  <div className="product-table-header-khmer">{t("category")}</div>
                </div>
              ),
              dataIndex: "category_name",
              render: (text) => (
                <div className="product-table-text" title={text || ""}>
                  {text || "N/A"}
                </div>
              ),
            },
            {
              key: "qty",
              title: (
                <div className="product-table-header">
                  <div className="product-table-header-khmer">{t("quantity")}</div>
                </div>
              ),
              dataIndex: "qty",
              render: (value) => (
                <Tag color={value > 5000 ? "green" : "red"} className="product-tag">
                  {value.toLocaleString()}
                </Tag>
              ),
            },
            {
              key: "unit",
              title: (
                <div className="product-table-header">
                  <div className="product-table-header-khmer">{t("unit")}</div>
                </div>
              ),
              dataIndex: "unit",
              render: (value) => <Tag color="green" className="product-tag">{value}</Tag>,
            },
            {
              key: "unit_price",
              title: (
                <div className="product-table-header">
                  <div className="product-table-header-khmer">{t("unit_price")}</div>
                </div>
              ),
              dataIndex: "unit_price",
              render: (value) => (
                <Tag color={value > 20 ? "green" : "volcano"} className="product-tag">
                  {formatCurrency(value)}
                </Tag>
              ),
            },
            {
              key: "total_price",
              title: (
                <div className="product-table-header">
                  <div className="product-table-header-khmer">{t("total_price")}</div>
                </div>
              ),
              dataIndex: "total_price",
              render: (price, record) => {
                const totalPrice = Number(price) || 0;
                return (
                  <div className="product-price-text">
                    {formatPrice(totalPrice)}
                  </div>
                );
              },
            },
            {
              key: "status",
              title: (
                <div className="product-table-header">
                  <div className="product-table-header-khmer">{t("status")}</div>
                </div>
              ),
              dataIndex: "status",
              render: (status) =>
                status == 1 ? (
                  <Tag color="green" className="product-tag">{t("active")}</Tag>
                ) : (
                  <Tag color="red" className="product-tag">{t("inactive")}</Tag>
                ),
            },
            {
              key: "Action",
              title: (
                <div className="product-table-header">
                  <div className="product-table-header-khmer">{t("actions")}</div>
                </div>
              ),
              align: "center",
              width: 120,
              render: (item, data, index) => (
                <Space>
                  {isPermission("customer.getone") && (
                    <Button
                      type="primary"
                      icon={<MdEdit />}
                      onClick={() => onClickEdit(data, index)}
                      className="product-action-btn"
                    />
                  )}
                  {isPermission("customer.getone") && (
                    <Button
                      type="primary"
                      danger
                      icon={<MdDelete />}
                      onClick={() => onClickDelete(data, index)}
                      className="product-action-btn"
                    />
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Card>

      {/* Add/Edit Product Modal */}
      <Modal
        open={state.visibleModal}
        title={
          <div className="product-modal-title">
            <BsBoxSeam className="product-modal-icon" size={20} />
            <span>
              {isEditMode ? (
                <div>
                  <div className="product-modal-title-khmer">{t("edit_product")}</div>
                </div>
              ) : (
                <div>
                  <div className="product-modal-title-khmer">{t("add_multiple_products")}</div>
                </div>
              )}
            </span>
          </div>
        }
        footer={null}
        onCancel={onCloseModal}
        width={1400}
        bodyStyle={{ maxHeight: '80vh', overflow: 'auto' }}
        className="product-modal"
      >
        <Form
          layout="vertical"
          onFinish={onFinish}
          form={form}
          onValuesChange={onValuesChange}
          className="product-form"
        >
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>

          <Row gutter={16}>
            {/* Common Fields Section */}
            <Col span={24}>
              <Card
                title={
                  <div className="product-section-title">
                    <div className="product-section-icon-container">
                      <FaWarehouse className="product-section-icon" />
                    </div>
                    <div>
                      <div className="product-section-title-khmer">{t("common_information")}</div>
                    </div>
                  </div>
                }
                className="product-section-card"
              >
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      name="customer_id"
                      label={
                        <div>
                          <div className="product-label-khmer">{t("customer")}</div>
                        </div>
                      }
                      rules={[{ required: true, message: t("please_select_customer") }]}
                    >
                      <Select
                        showSearch
                        placeholder={t("select_customer")}
                        options={customers.map((customer, index) => ({
                          ...customer,
                          label: `${index + 1}. ${customer.label}`,
                          value: customer.value,
                          index: index + 1
                        }))}
                        optionFilterProp="children"
                        filterOption={(input, option) => {
                          const searchValue = input.toLowerCase();
                          const label = option.label.toLowerCase();
                          const indexStr = option.index.toString();
                          return indexStr.includes(searchValue) || label.includes(searchValue);
                        }}
                        onSelect={(value, option) => {
                          form.setFieldsValue({
                            customer_address: option.address,
                            customer_tel: option.tel
                          });
                        }}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={8}>
                    <Form.Item
                      name="company_name"
                      label={
                        <div>
                          <div className="product-label-khmer">{t("company")}</div>
                        </div>
                      }
                      rules={[{ required: true, message: t("please_select_company") }]}
                    >
                      <Select
                        showSearch
                        placeholder={t("select_company")}
                        optionFilterProp="label"
                        className="product-select"
                        filterOption={(input, option) =>
                          option.label.toLowerCase().includes(input.toLowerCase())
                        }
                        options={
                          config?.company_name?.map((item, index) => ({
                            label: `${index + 1}. ${item.label}`,
                            value: item.value,
                          })) || []
                        }
                      />
                    </Form.Item>
                  </Col>

                  <Col span={8}>
                    <Form.Item
                      name="unit"
                      label={
                        <div>
                          <div className="product-label-khmer">{t("unit")}</div>
                        </div>
                      }
                      rules={[{ required: true, message: t("please_select_unit") }]}
                    >
                      <Select
                        placeholder={t("select_unit")}
                        options={config?.unit}
                        className="product-select"
                      />
                    </Form.Item>
                  </Col>

                  <Col span={8}>
                    <Form.Item
                      name="create_at"
                      label={
                        <div>
                          <div className="product-label-khmer">{t("order_date")}</div>
                        </div>
                      }
                      initialValue={moment()}
                    >
                      <DatePicker
                        className="product-datepicker"
                        format="DD-MM-YYYY"
                        showNow={false}
                        placeholder={t("select_date")}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={8}>
                    <Form.Item
                      name="receive_date"
                      label={
                        <div>
                          <div className="product-label-khmer">{t("receive_date")}</div>
                        </div>
                      }
                      initialValue={moment()}
                    >
                      <DatePicker
                        className="product-datepicker"
                        format="DD-MM-YYYY"
                        showNow={false}
                        placeholder={t("select_date")}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={8}>
                    <Form.Item
                      name="status"
                      label={
                        <div>
                          <div className="product-label-khmer">{t("status")}</div>
                        </div>
                      }
                      initialValue={1}
                    >
                      <Select
                        placeholder={t("select_status")}
                        options={[
                          { label: t("active"), value: 1 },
                          { label: t("inactive"), value: 0 },
                        ]}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={8}>
                    <Form.Item
                      name="description"
                      label={
                        <div>
                          <div className="product-label-khmer">{t("card_number")}</div>
                        </div>
                      }
                      rules={[{ required: true, message: t("please_input_card_number") }]}
                    >
                      <Input placeholder={t("invoice_number")} />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>

            {/* Multiple Products Section */}
            <Col span={24}>
              <Card
                title={
                  <div style={{ fontSize: '16px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div className="product-section-title-khmer">{t("multiple_product_entry")}</div>
                    </div>
                    {!isEditMode && (
                      <Button
                        type="primary"
                        onClick={addProductItem}
                        icon={<AiOutlinePlusCircle />}
                      >
                        {t("add_product")}
                      </Button>
                    )}
                  </div>
                }
                style={{ marginBottom: 16 }}
              >
                {productItems.map((item) => (
                  <Row key={item.key} gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={5}>
                      <Form.Item
                        name={['products', item.key, 'name']}
                        label={
                          <div>
                            <div className="product-label-khmer">{t("product_name")}</div>
                          </div>
                        }
                        rules={[{ required: true, message: t("select_product") }]}
                      >
                        <Select
                          options={config?.product}
                          placeholder={t("select_product")}
                          onChange={(value) => handleProductChange(value, item.key, 'name')}
                        />
                      </Form.Item>
                    </Col>

                    <Col span={5}>
                      <Form.Item
                        name={['products', item.key, 'category_id']}
                        label={
                          <div>
                            <div className="product-label-khmer">{t("product_category")}</div>
                          </div>
                        }
                        rules={[{ required: true, message: t("select_category") }]}
                      >
                        <Select
                          placeholder={t("select_category")}
                          optionRender={(option) => (
                            <div>
                              <div style={{ fontWeight: 'bold' }}>{option.label}</div>
                              {option.data?.description && (
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                                  {option.data.description}
                                </div>
                              )}
                              {option.data?.actual_price && (
                                <div style={{ fontSize: '12px', color: '#1890ff', marginTop: '2px', fontWeight: '500' }}>
                                  {t("actual_price")}: ${parseFloat(option.data.actual_price).toLocaleString()}
                                </div>
                              )}
                            </div>
                          )}
                          options={config?.category?.map(cat => ({
                            ...cat,
                            label: cat.label,
                            value: cat.value,
                            description: cat.description || '',
                            actual_price: cat.actual_price || 1190
                          }))}
                          onChange={(value) => handleProductChange(value, item.key, 'category_id')}
                        />
                      </Form.Item>
                    </Col>

                    <Col span={4}>
                      <Form.Item
                        name={['products', item.key, 'qty']}
                        label={
                          <div>
                            <div className="product-label-khmer">{t("quantity")}</div>
                          </div>
                        }
                        rules={[{ required: true, message: t("enter_quantity") }]}
                      >
                        <InputNumber
                          placeholder={t("quantity")}
                          style={{ width: "100%" }}
                          min={1}
                          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                          parser={(value) => value.replace(/(,*)/g, "")}
                          onChange={(value) => handleProductChange(value, item.key, 'qty')}
                        />
                      </Form.Item>
                    </Col>

                    <Col span={5}>
                      <Form.Item
                        name={['products', item.key, 'unit_price']}
                        label={
                          <div>
                            <div className="product-label-khmer">{t("unit_price")}</div>
                          </div>
                        }
                        rules={[{ required: true, message: t("enter_unit_price") }]}
                      >
                        <InputNumber
                          placeholder={t("unit_price")}
                          style={{ width: "100%" }}
                          min={0.01}
                          formatter={(value) => `$ ${Math.round(value || 0).toLocaleString()}`}
                          parser={(value) => Math.round(value.replace(/[^\d]/g, ""))}
                          onChange={(value) => handleProductChange(value, item.key, 'unit_price')}
                        />
                      </Form.Item>
                    </Col>

                    <Form.Item
                      name={['products', item.key, 'actual_price']}
                      style={{ display: 'none' }}
                    >
                      <InputNumber />
                    </Form.Item>

                    <Form.Item
                      name={['products', item.key, 'barcode']}
                      style={{ display: 'none' }}
                    >
                      <Input />
                    </Form.Item>

                    {!isEditMode && (
                      <Col span={2} style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <Tooltip title={t("remove_product")}>
                          <Button
                            danger
                            icon={<BsTrash />}
                            onClick={() => removeProductItem(item.key)}
                            disabled={productItems.length <= 1}
                            style={{ marginBottom: '24px' }}
                          />
                        </Tooltip>
                      </Col>
                    )}
                  </Row>
                ))}
              </Card>
            </Col>
          </Row>

          <div style={{ textAlign: "right", marginTop: 16 }}>
            <Space>
              <Button onClick={onCloseModal}>
                {t("cancel")}
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={state.loading}
                disabled={!form.getFieldValue('customer_id')}
              >
                {isEditMode ? t("update_product") : `${t("save_all_products")} (${productItems.length})`}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </MainPage>
  );
}

export default ProductPage;