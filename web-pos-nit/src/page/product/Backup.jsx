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

import "./product.css"
const { Title, Text } = Typography;

function ProductPage() {
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

  // ✅ Track if we're in edit mode
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
    setIsEditMode(false); // ✅ Reset edit mode
  };

  const addProductItem = () => {
    const newKey = productItems.length > 0 ? Math.max(...productItems.map(item => item.key)) + 1 : 0;
    setProductItems([...productItems, { key: newKey, name: undefined, category_id: undefined, qty: undefined, unit_price: undefined }]);
  };

  const removeProductItem = (key) => {
    if (productItems.length > 1) {
      setProductItems(productItems.filter(item => item.key !== key));
    } else {
      message.warning("ត្រូវតែមានយ៉ាងហោចណាស់មួយផលិតផល (At least one product is required)");
    }
  };

  // ✅ NEW: Batch save function with single Telegram notification
  const handleSaveAllProducts = async (formValues) => {
    

    const { id } = getProfile();
    if (!id) {
      message.error("User ID is missing! / មិនមានលេខសម្គាល់អ្នកប្រើប្រាស់!");
      return;
    }

    // ✅ Validate customer selection
    if (!formValues.customer_id) {
      message.error("សូមជ្រើសរើសអតិថិជនសិន / Please select a customer!");
      return;
    }

    // ✅ Extract products from form
    let products = [];

    if (formValues.products) {
      if (Array.isArray(formValues.products)) {
        products = formValues.products.filter(product => product && typeof product === 'object');
      } else if (typeof formValues.products === 'object') {
        products = Object.values(formValues.products).filter(product => product && typeof product === 'object');
      }
    }

    // ✅ Validate products
    if (products.length === 0) {
      message.error("សូមបន្ថែមផលិតផលយ៉ាងហោចណាស់១ / At least one product is required!");
      return;
    }

    // ✅ Enhanced validation
    const validationErrors = [];
    products.forEach((product, index) => {
      if (!product || typeof product !== 'object') {
        validationErrors.push(`Product ${index + 1}: Invalid product data`);
        return;
      }

      if (!product.name) validationErrors.push(`Product ${index + 1}: Name is required`);
      if (!product.category_id) validationErrors.push(`Product ${index + 1}: Category is required`);

      const qty = Number(product.qty);
      if (isNaN(qty) || qty <= 0) {
        validationErrors.push(`Product ${index + 1}: Valid quantity required`);
      }

      const unitPrice = Number(product.unit_price);
      if (isNaN(unitPrice) || unitPrice <= 0) {
        validationErrors.push(`Product ${index + 1}: Valid unit price required`);
      }
    });

    if (validationErrors.length > 0) {
      console.error('Validation Errors:', validationErrors);
      message.error(`Validation failed:\n${validationErrors.join('\n')}`);
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      // ✅ Prepare products array
      const productsData = products.map(product => {
        const qty = Number(product.qty) || 1;
        const unitPrice = Number(product.unit_price) || 0.01;

        // Get actual_price from category
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
          description: formValues.description || '', // Card number
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

    
      // ✅ Call new batch endpoint
      const response = await request('product/createMultiple', 'post', {
        customer_id: formValues.customer_id,
        products: productsData
      });

      if (response && !response.error) {
        const successCount = response.data.success.length;
        const errorCount = response.data.errors.length;

        message.success(
          `បានរក្សាទុកផលិតផល ${successCount} ប្រភេទដោយជោគជ័យ! / Successfully saved ${successCount} product(s)!`
        );

        // Show errors if any
        if (errorCount > 0) {
          response.data.errors.forEach(err => {
            message.error(`កំហុស: ${err.productName} - ${err.error}`);
          });
        }

        // Refresh and close
        getList();
        onCloseModal();
      } else {
        message.error(response.message || 'មានបញ្ហាក្នុងការរក្សាទុក / Failed to save products');
      }
    } catch (error) {
      console.error('Error saving products:', error);
      message.error('មានបញ្ហាក្នុងការរក្សាទុកផលិតផល / Error occurred while saving products');
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  // ✅ Modified onFinish to handle both single edit and batch create
  const onFinish = async (formValues) => {


    // ✅ Check if we're in edit mode (single product update)
    if (isEditMode && formValues.id) {
      // Single product update logic
      const { id: userId } = getProfile();
      if (!userId) {
        message.error("User ID is missing!");
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
          message.success("បានកែប្រែផលិតផលដោយជោគជ័យ! / Product updated successfully!");
          getList();
          onCloseModal();
        } else {
          message.error(response?.message || "Failed to update product");
        }
      } catch (error) {
        console.error('Error updating product:', error);
        message.error("មានបញ្ហាក្នុងការកែប្រែផលិតផល / Error updating product");
      } finally {
        setState(prev => ({ ...prev, loading: false }));
      }
    } else {
      // ✅ Batch create mode - use new function
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
      setIsEditMode(false); // ✅ Not in edit mode
    }
  };

  const onFilter = () => {
    getList();
  };

  const onClickEdit = (data, index) => {
    setIsEditMode(true); // ✅ Set edit mode

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
      title: "Are you sure you want to delete this product?",
      content: `Product: ${data.name} (${data.barcode})`,
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      async onOk() {
        try {
          const res = await request(`product/${data.id}`, "delete");
          if (res && !res.error) {
            message.success("Product deleted successfully!");
            getList();
          } else {
            message.error(res?.message || "Failed to delete product.");
          }
        } catch (err) {
          console.error("Delete Error:", err);
          message.error("Something went wrong while deleting.");
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
      message.error("Error fetching customers!");
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
                <div className="product-title-khmer">ការគ្រប់គ្រងផលិតផល</div>
                <div className="product-title-english">Product Management</div>
                <div className="product-stats-container">
                  <RiDashboardLine className="product-stats-icon" />
                  <span className="product-stats-text">Total: {state.total} products</span>
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
                Add Product
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
              placeholder="Search products..."
              className="product-search-input"
              size="large"
            />
          </Form.Item>
          <Form.Item className="product-category-item">
            <Select
              allowClear
              style={{ width: '100%' }}
              placeholder="Select Category"
              options={config.category}
              onChange={(id) => setFilter((pre) => ({ ...pre, category_id: id }))}
              size="large"
            />
          </Form.Item>
          <Form.Item className="product-brand-item">
            <Select
              allowClear
              style={{ width: '100%' }}
              placeholder="Select Brand"
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
            Filter
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
                      <div className="product-stat-subtitle">Category</div>
                    </div>
                  </div>
                </div>
                <Divider className="product-stat-divider" />
                <div className="product-stat-metrics">
                  <div>
                    <div className="product-stat-label">Quantity</div>
                    <div className="product-stat-value">{totals.quantity.toLocaleString()}L</div>
                  </div>
                  <div>
                    <div className="product-stat-label">Total Value</div>
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
                  <div className="product-table-header-khmer">ឈ្មោះ</div>
                  <div className="product-table-header-english">Name</div>
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
                  <div className="product-table-header-khmer">លេខបាកូដ</div>
                  <div className="product-table-header-english">Barcode</div>
                </div>
              ),
              dataIndex: "category_barcode",
              render: (value) => <Tag color="blue" className="product-tag">{value}</Tag>,
            },
            {
              key: "category_name",
              title: (
                <div className="product-table-header">
                  <div className="product-table-header-khmer">ប្រភេទ</div>
                  <div className="product-table-header-english">Category</div>
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
                  <div className="product-table-header-khmer">បរិមាណ</div>
                  <div className="product-table-header-english">Quantity</div>
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
                  <div className="product-table-header-khmer">ឯកតា</div>
                  <div className="product-table-header-english">Unit</div>
                </div>
              ),
              dataIndex: "unit",
              render: (value) => <Tag color="green" className="product-tag">{value}</Tag>,
            },
            {
              key: "unit_price",
              title: (
                <div className="product-table-header">
                  <div className="product-table-header-khmer">តម្លៃតោន</div>
                  <div className="product-table-header-english">Unit Price</div>
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
                  <div className="product-table-header-khmer">តម្លៃសរុប</div>
                  <div className="product-table-header-english">Total Price</div>
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
                  <div className="product-table-header-khmer">ស្ថានភាព</div>
                  <div className="product-table-header-english">Status</div>
                </div>
              ),
              dataIndex: "status",
              render: (status) =>
                status == 1 ? (
                  <Tag color="green" className="product-tag">Active</Tag>
                ) : (
                  <Tag color="red" className="product-tag">Inactive</Tag>
                ),
            },
            {
              key: "Action",
              title: (
                <div className="product-table-header">
                  <div className="product-table-header-khmer">សកម្មភាព</div>
                  <div className="product-table-header-english">Action</div>
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
                  <div className="product-modal-title-khmer">កែប្រែព័ត៌មានផលិតផល</div>
                  <div className="product-modal-title-english">Edit Product</div>
                </div>
              ) : (
                <div>
                  <div className="product-modal-title-khmer">បន្ថែមផលិតផលច្រើនប្រភេទ</div>
                  <div className="product-modal-title-english">Add Multiple Products</div>
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
          {/* Hidden field for product ID (for edit mode) */}
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
                      <div className="product-section-title-khmer">ព័ត៌មានទូទៅ</div>
                      <div className="product-section-title-english">Common Information</div>
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
                          <div className="product-label-khmer">អតិថិជន</div>
                          <div className="product-label-english">Customer</div>
                        </div>
                      }
                      rules={[{ required: true, message: "សូមជ្រើសរើសអតិថិជន / Please select customer" }]}
                    >
                      <Select
                        showSearch
                        placeholder="Select customer"
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
                          <div className="product-label-khmer">ក្រុមហ៊ុន</div>
                          <div className="product-label-english">Company</div>
                        </div>
                      }
                      rules={[{ required: true, message: "Please Select Company Name" }]}
                    >
                      <Select
                        showSearch
                        placeholder="Select Company"
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
                          <div className="product-label-khmer">ឯកតា</div>
                          <div className="product-label-english">Unit</div>
                        </div>
                      }
                    >
                      <Select
                        placeholder="Select Unit"
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
                          <div className="product-label-khmer">ថ្ងៃទីបញ្ជាទិញ</div>
                          <div className="product-label-english">Order Date</div>
                        </div>
                      }
                      initialValue={moment()}
                    >
                      <DatePicker
                        className="product-datepicker"
                        format="DD-MM-YYYY"
                        showNow={false}
                        placeholder="Select date"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={8}>
                    <Form.Item
                      name="receive_date"
                      label={
                        <div>
                          <div className="product-label-khmer">ថ្ងៃទទួលទំនិញ</div>
                          <div className="product-label-english">Receive Date</div>
                        </div>
                      }
                      initialValue={moment()}
                    >
                      <DatePicker
                        className="product-datepicker"
                        format="DD-MM-YYYY"
                        showNow={false}
                        placeholder="Select date"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={8}>
                    <Form.Item
                      name="status"
                      label={
                        <div>
                          <div className="product-label-khmer">ស្ថានភាព</div>
                          <div className="product-label-english">Status</div>
                        </div>
                      }
                      initialValue={1}
                    >
                      <Select
                        placeholder="Select status"
                        options={[
                          { label: "Active", value: 1 },
                          { label: "Inactive", value: 0 },
                        ]}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={8}>
                    <Form.Item
                      name="description"
                      label={
                        <div>
                          <div className="product-label-khmer">លេខប័ណ្ណ</div>
                          <div className="product-label-english">Card Number</div>
                        </div>
                      }
                    >
                      <Input placeholder="វិកយប័ត្រលេខ / Invoice Number" />
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
                      <div className="product-section-title-khmer">បញ្ចូលផលិតផលច្រើនប្រភេទ</div>
                      <div className="product-section-title-english">Multiple Product Entry</div>
                    </div>
                    {!isEditMode && (
                      <Button 
                        type="primary" 
                        onClick={addProductItem} 
                        icon={<AiOutlinePlusCircle />}
                      >
                        Add Product
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
                            <div className="product-label-khmer">ផលិតផល</div>
                            <div className="product-label-english">Product Name</div>
                          </div>
                        }
                        rules={[{ required: true, message: "Select product" }]}
                      >
                        <Select
                          options={config?.product}
                          placeholder="Select product"
                          onChange={(value) => handleProductChange(value, item.key, 'name')}
                        />
                      </Form.Item>
                    </Col>

                    <Col span={5}>
                 <Form.Item
  name={['products', item.key, 'category_id']}
  label={
    <div>
      <div className="product-label-khmer">ប្រភេទផលិតផល</div>
      <div className="product-label-english">Category</div>
    </div>
  }
  rules={[{ required: true, message: "Select category" }]}
>
  <Select
    placeholder="Select category"
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
            Actual Price: ${parseFloat(option.data.actual_price).toLocaleString()}
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
                            <div className="product-label-khmer">បរិមាណ</div>
                            <div className="product-label-english">Quantity</div>
                          </div>
                        }
                        rules={[{ required: true, message: "Enter quantity" }]}
                      >
                        <InputNumber
                          placeholder="Quantity"
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
                            <div className="product-label-khmer">តម្លៃតោន</div>
                            <div className="product-label-english">Unit Price</div>
                          </div>
                        }
                        rules={[{ required: true, message: "Enter unit price" }]}
                      >
                        <InputNumber
                          placeholder="Unit Price"
                          style={{ width: "100%" }}
                          min={0.01}
                          formatter={(value) => `$ ${Math.round(value || 0).toLocaleString()}`}
                          parser={(value) => Math.round(value.replace(/[^\d]/g, ""))}
                          onChange={(value) => handleProductChange(value, item.key, 'unit_price')}
                        />
                      </Form.Item>
                    </Col>

                    {/* Hidden fields */}
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
                        <Tooltip title="Remove Product">
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
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={state.loading}
                disabled={!form.getFieldValue('customer_id')}
              >
                {isEditMode ? "Update Product" : `Save All Products (${productItems.length})`}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </MainPage>
  );
}

export default ProductPage;