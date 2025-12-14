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
import { formatDateClient, formatPrice, request } from "../../util/helper";
import { MdAdd, MdDelete, MdEdit, MdOutlineCreateNewFolder } from "react-icons/md";
import { AiOutlinePlusCircle } from "react-icons/ai";
import { BsTrash, BsSearch, BsCalendar3, BsBoxSeam } from "react-icons/bs";
import MainPage from "../../component/layout/MainPage";
import { configStore } from "../../store/configStore";
import * as XLSX from 'xlsx/xlsx.mjs';
import { getProfile } from "../../store/profile.store";
import { FaFileExport, FaMoneyBillWave, FaWarehouse } from "react-icons/fa";
import { RiDashboardLine } from "react-icons/ri";
import "./product.css";

const { Title, Text } = Typography;

function ProductPage() {
  const { config } = configStore();
  const [form] = Form.useForm();
  const [list, setList] = useState([]);
  const [state, setState] = useState({
    list: [],
    total: 0,
    loading: false,
    visibleModal: false,
    is_list_all: false,
    totals: {},
  });

  // State to handle multiple products in form
  const [productItems, setProductItems] = useState([
    { key: 0, name: undefined, category_id: undefined, qty: undefined }
  ]);

  const calculateTotalPrice = (item) => {
    const { qty = 0, unit_price = 0, discount = 0, actual_price = 1 } = item;
    if (actual_price <= 0) return 0;
    const basePrice = qty * unit_price;
    const discountedPrice = discount > 0 ? basePrice * (1 - discount / 100) : basePrice;
    return parseFloat((discountedPrice / actual_price).toFixed(2));
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
  }, []);

  const getList = async () => {
    var param = {
      ...filter,
      page: 1,
      is_list_all: 1,
    };
    setState((pre) => ({ ...pre, loading: true }));
    const { id } = getProfile();
    if (!id) return;

    const res = await request(`product/${id}`, "get", param);
    if (res && !res.error) {
      const totals = res.list.reduce((acc, item) => {
        const categoryName = item.category_name || 'Uncategorized';
        if (!acc[categoryName]) acc[categoryName] = 0;
        acc[categoryName] += item.qty || 0;
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
    setProductItems([{ key: 0, name: undefined, category_id: undefined, qty: undefined }]);
  };

  const addProductItem = () => {
    const newKey = productItems.length > 0 ? Math.max(...productItems.map(item => item.key)) + 1 : 0;
    setProductItems([...productItems, { key: newKey, name: undefined, category_id: undefined, qty: undefined }]);
  };

  const removeProductItem = (key) => {
    if (productItems.length > 1) {
      setProductItems(productItems.filter(item => item.key !== key));
    } else {
      message.warning("At least one product is required");
    }
  };

  const handleProductChange = (value, key, field) => {
    const updatedItems = productItems.map(item => {
      if (item.key === key) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setProductItems(updatedItems);

    const fieldName = `products[${key}].${field}`;
    form.setFieldsValue({
      [fieldName]: value
    });

    if (field === 'name' && value) {
      const productInfo = config.product.find(p => p.value === value);
      if (productInfo?.category_id) {
        form.setFieldsValue({
          [`products[${key}].category_id`]: productInfo.category_id
        });
        const withCategory = updatedItems.map(item =>
          item.key === key ? { ...item, category_id: productInfo.category_id } : item
        );
        setProductItems(withCategory);
      }
    }
  };

  const onFinish = async (items) => {
    const { id } = getProfile();
    if (!id) {
      message.error("User ID is missing!");
      return;
    }

    const { products = [] } = items;
    const isValid = products.every(product =>
      product && product.name && product.category_id && product.qty
    );
    if (!isValid) {
      message.error("All products must have name, category, and quantity!");
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      const results = await Promise.all(
        products.map(async (product) => {
          const commonFields = {
            user_id: id,
            company_name: items.company_name,
            unit: items.unit,
            unit_price: items.unit_price,
            actual_price: items.actual_price,
            discount: items.discount || 0,
            description: items.description || '',
            status: items.status || 1,
            create_at: items.create_at ? items.create_at.format('YYYY-MM-DD HH:mm:ss') : new Date().toISOString()
          };
          const data = {
            ...commonFields,
            name: product.name,
            category_id: product.category_id,
            qty: product.qty,
            barcode: product.barcode || Date.now().toString()
          };
          return await request("product", "post", data);
        })
      );

      const allSuccessful = results.every(res => res && !res.error);
      if (allSuccessful) {
        message.success(`${results.length} products were successfully added!`);
        getList();
        onCloseModal();
      } else {
        results.forEach((res, index) => {
          if (res.error) {
            message.error(`Error adding product #${index + 1}: ${res.message}`);
          }
        });
      }
    } catch (error) {
      message.error("Failed to add products: " + (error.message || "Unknown error"));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const generateBarcode = async () => {
    const res = await request("new_barcode", "post");
    if (res && !res.error) {
      return res.barcode;
    }
    return Date.now().toString();
  };

  const onBtnNew = async () => {
    const res = await request("new_barcode", "post");
    if (res && !res.error) {
      form.setFieldValue("barcode", res.barcode);
      setState((p) => ({
        ...p,
        visibleModal: true,
      }));
      setProductItems([{ key: 0, name: undefined, category_id: undefined, qty: undefined }]);
    }
  };

  const onFilter = () => {
    getList();
  };

  const onClickEdit = (data, index) => {
    setState({
      ...state,
      visibleModal: true,
    });
    form.setFieldsValue({
      id: data.id,
      name: data.name,
      user_id: data.user_id,
      category_id: data.category_id,
      brand: data.brand,
      company_name: data.company_name,
      qty: data.qty,
      unit: data.unit,
      unit_price: data.unit_price,
      discount: data.discount,
      description: data.description,
      status: data.status,
      create_at: data.create_at ? new Date(data.create_at) : null
    });
    setProductItems([{
      key: 0,
      name: data.name,
      category_id: data.category_id,
      qty: data.qty
    }]);
  };

  const onClickDelete = (item, index) => {
    if (!item.id) {
      message.error("Product ID is missing!");
      return;
    }
    Modal.confirm({
      title: "Remove Product",
      content: "Are you sure you want to remove this product?",
      onOk: async () => {
        try {
          const res = await request(`product/${item.id}`, "delete");
          if (res && !res.error) {
            message.success(res.message);
            if (item.category_name && state.totals[item.category_name]) {
              const updatedTotals = { ...state.totals };
              updatedTotals[item.category_name] -= item.qty;
              if (updatedTotals[item.category_name] < 0) {
                updatedTotals[item.category_name] = 0;
              }
              setState(prev => ({
                ...prev,
                totals: updatedTotals
              }));
            }
            getList();
          } else {
            message.error(res.message || "Failed to delete product!");
          }
        } catch (error) {
          message.error("An error occurred while deleting the product.");
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
      <Row style={{
        marginBottom: 24,
        borderRadius: 12,
      }} gutter={[16, 16]}>
        {Object.entries(state.totals || {}).map(([category, total]) => {
          const categoryItems = state.list.filter(item => item.category_name === category);
          const totalSum = categoryItems.reduce((sum, item) => sum + calculateTotalPrice(item), 0);
          const categoryColors = {
            'ហ្កាស(LPG)': { bg: 'product-card--lpg', text: 'product-text--lpg', icon: <FaWarehouse className="product-icon--lpg" /> },
            'ប្រេងសាំងស៊ុបពែរ(Super)': { bg: 'product-card--super', text: 'product-text--super', icon: <FaMoneyBillWave className="product-icon--super" /> },
            'ប្រេងម៉ាស៊ូត(DO)': { bg: 'product-card--do', text: 'product-text--do', icon: <FaWarehouse className="product-icon--do" /> },
            'ប្រេងសាំងធម្មតា(EA)': { bg: 'product-card--ea', text: 'product-text--ea', icon: <FaMoneyBillWave className="product-icon--ea" /> },
            'default': { bg: 'product-card--gray', text: 'product-text--gray', icon: <BsBoxSeam className="product-icon--gray" /> }
          };
          const colors = categoryColors[category] || categoryColors['default'];
          return (
            <Col key={category} xs={24} sm={12} md={8} lg={6}>
              <Card className={`${colors.bg}`}>
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
                    <div className="product-stat-value">{total.toLocaleString()}L</div>
                  </div>
                  <div>
                    <div className="product-stat-label">Total Value</div>
                    <div className="product-stat-value-highlight">{formatCurrencyalltotal(totalSum)}</div>
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
          pagination={{
            pageSize: 8,
            total: state.total,
            onChange: (page) => {
              refPage.current = page;
              getList();
            },
            hideOnSinglePage: false,
            showSizeChanger: true,
            pageSizeOptions: ['8', '16', '24', '32'],
          }}
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
              dataIndex: "barcode",
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
                  <div className="product-table-header-khmer">តម្លៃរាយ</div>
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
              render: (price) => <div className="product-price-text">{formatPrice(price)}</div>,
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
              key: "create_at",
              title: (
                <div className="product-table-header">
                  <div className="product-table-header-khmer">កាលបរិច្ឆេទបង្កើត</div>
                  <div className="product-table-header-english">Created At</div>
                </div>
              ),
              dataIndex: "create_at",
              render: (value) => <div className="product-date-text">{formatDateClient(value, "DD/MM/YYYY H:mm A")}</div>,
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
                  <Button
                    type="primary"
                    icon={<MdEdit />}
                    onClick={() => onClickEdit(data, index)}
                    className="product-action-btn"
                  />
                  <Button
                    type="primary"
                    danger
                    icon={<MdDelete />}
                    onClick={() => onClickDelete(data, index)}
                    className="product-action-btn"
                  />
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
              {form.getFieldValue("id") ? (
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
        width={900}
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
          <Row gutter={