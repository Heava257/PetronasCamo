import React, { useEffect, useState } from "react";
import {
  Button,
  Col,
  Divider,
  Form,
  Image,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Upload,
} from "antd";
import { formatDateClient, isPermission, request } from "../../util/helper";
import { MdAdd, MdDelete, MdEdit, MdOutlineCreateNewFolder } from "react-icons/md";
import MainPage from "../../component/layout/MainPage";
import { configStore } from "../../store/configStore";
import * as XLSX from 'xlsx/xlsx.mjs';
import { getProfile } from "../../store/profile.store";
import { BsSearch } from "react-icons/bs";
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
  });


  const calculateTotalPrice = (item) => {
    const { qty = 0, unit_price = 0, discount = 0, actual_price = 1 } = item;
    
    // Handle division by zero cases
    if (actual_price <= 0) return 0;
    
    // Calculate base price
    const basePrice = qty * unit_price;
    
    // Apply discount if exists
    const discountedPrice = discount > 0 
      ? basePrice * (1 - discount / 100)
      : basePrice;
    
    // Return final price rounded to 2 decimal places
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
  const ExportToExcel = () => {
    if (list.length === 0) {
      message.warning("No data available to export.");
      return;
    }
    const data = list.map((item) => ({
      ...item,
      create_at: formatDateClient(item.create_at),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Product");
    setTimeout(() => {
      XLSX.writeFile(wb, "Product_Data.xlsx");
    }, 2000);
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
  // const getList = async () => {
  //   var param = {
  //     ...filter,
  //     page: refPage.current,
  //   };
  //   setState((pre) => ({ ...pre, loading: true }));
  //   const { id } = getProfile();
  //   if (!id) {
  //     return
  //   }
  //   const res = await request(`product/${id}`, "get", param);
  //   if (res && !res.error) {
  //     setState((pre) => ({
  //       ...pre,
  //       list: res.list,
  //       total: refPage.current == 1 ? res.total : pre.total,
  //       loading: false,
  //     }));
  //   }
  // };

  const getList = async () => {
    var param = {
      ...filter,
      page: 1, // Force first page
      is_list_all: 1, // Ensure fetching all
    };
    
    setState((pre) => ({ ...pre, loading: true }));
    const { id } = getProfile();
    if (!id) {
      return;
    }
    const res = await request(`product/${id}`, "get", param);
    if (res && !res.error) {
      // Calculate totals for each product category
      const totals = res.list.reduce((acc, item) => {
        if (!acc[item.category_name]) {
          acc[item.category_name] = 0;
        }
        acc[item.category_name] += item.qty;
        return acc;
      }, {});

      setState((pre) => ({
        ...pre,
        list: res.list,
        total: refPage.current == 1 ? res.total : pre.total,
        loading: false,
        totals, // Store totals in state
      }));
    }
  };
  const onCloseModal = () => {
    setState((p) => ({
      ...p,
      visibleModal: false,
    }));
    form.resetFields();
  };
  // const onFinish = async (items) => {
  //   const { id } = getProfile();
  //   if (!id) {
  //     message.error("User ID is missing!");
  //     return;
  //   }
  //   var data = {
  //     id: form.getFieldValue("id"),
  //     user_id: id,
  //     name: items.name,
  //     category_id: items.category_id,
  //     barcode: items.barcode,
  //     brand: items.brand,
  //     company_name: items.company_name,
  //     qty: items.qty,
  //     actual_price: items.actual_price,

  //     unit: items.unit,
  //     unit_price: items.unit_price,
  //     discount: items.discount,
  //     description: items.description,
  //     status: items.status,
  //   };
  //   var method = form.getFieldValue("id") ? "put" : "post";
  //   const res = await request("product", method, data);
  //   if (res && !res.error) {
  //     message.success(res.message);
  //     getList();
  //     onCloseModal();
  //   }
  // };

  const onFinish = async (items) => {
    const { id } = getProfile();
    if (!id) {
      message.error("User ID is missing!");
      return;
    }
  
    // បង្កើតទិន្នន័យសម្រាប់ការកម្មង
    var data = {
      id: form.getFieldValue("id"),
      user_id: id,
      name: items.name,
      category_id: items.category_id,
      barcode: items.barcode,
      brand: items.brand,
      company_name: items.company_name,
      qty: items.qty, // ចំនួនដែលត្រូវដក
      actual_price: items.actual_price,
      unit: items.unit,
      unit_price: items.unit_price,
      discount: items.discount,
      description: items.description,
      status: items.status,
    };
  
    // បញ្ជូនទិន្នន័យទៅ API
    var method = form.getFieldValue("id") ? "put" : "post";
    const res = await request("product", method, data);
  
    if (res && !res.error) {
      message.success(res.message);
  
      // ដកតម្លៃ qty ពីសរុបរួម (totals)
      const updatedTotals = { ...state.totals };
      if (updatedTotals[items.category_name]) {
        updatedTotals[items.category_name] -= items.qty;
  
        // ប្រសិនបើតម្លៃសរុបរួមធ្លាក់ខ្លួនតិចជាង 0 កំណត់វាជា 0
        if (updatedTotals[items.category_name] < 0) {
          updatedTotals[items.category_name] = 0;
        }
      }
  
      // ធ្វើបច្ចុប្បន្នភាព state ជាមួយនឹងតម្លៃសរុបរួមថ្មី
      setState((pre) => ({
        ...pre,
        totals: updatedTotals,
      }));
  
      // ទាញយកបញ្ជីថ្មី និងបិទ modal
      getList();
      onCloseModal();
    }
  };

  const onBtnNew = async () => {
    const res = await request("new_barcode", "post");
    if (res && !res.error) {
      form.setFieldValue("barcode", res.barcode);
      setState((p) => ({
        ...p,
        visibleModal: true,
      }));
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
    });
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
        // Calculate total price
        const totalPrice = (qty * unit_price) * (1 - discount / 100) / actual_price;

        // Round the total price to the nearest whole number
        const roundedTotalPrice = Math.round(totalPrice);

        // Update the form field with the rounded total price
        form.setFieldsValue({ price: roundedTotalPrice });
      }
    }
  };
  const product = [
    { label: "ប្រេងឥន្ធនៈ", value: "oil" },
  ];
  
  const handleChange = (value) => {
    console.log("Selected:", value);
  };
  return (
    <MainPage loading={state.loading}>
      <div className="pageHeader">
        <Space>
          <div className="khmer-text">ផលិតផល/{state.total}</div>
          <Input.Search
            onChange={(event) =>
              setFilter((p) => ({ ...p, txt_search: event.target.value }))
            }
            allowClear
            placeholder="Search"
          />
          <Select
            allowClear
            style={{ width: 130 }}
            placeholder="Category"
            options={config.category}
            onChange={(id) => {
              setFilter((pre) => ({ ...pre, category_id: id }));
            }}
          />
          <Select
            allowClear
            style={{ width: 160 }}
            placeholder="Brand"
            options={config.brand}
            onChange={(id) => {
              setFilter((pre) => ({ ...pre, brand: id }));
            }}
          />

          <Button onClick={onFilter} type="primary" icon={<BsSearch />}>
            Filter
          </Button>
        </Space>
        <Button type="primary" onClick={onBtnNew} icon={<MdOutlineCreateNewFolder />}>
          NEW
        </Button>
      </div>
      <Modal
        open={state.visibleModal}
        title={form.getFieldValue("id") ? "Edit Product" : "New Product"}
        footer={null}
        onCancel={onCloseModal}
        width={700}
      >
        <Form
          layout="vertical"
          onFinish={onFinish}
          form={form}
          onValuesChange={(changedValues, allValues) => {
            // Call the existing onValuesChange function if it exists
            if (onValuesChange) onValuesChange(changedValues, allValues);

            // Calculate total price based on quantity, unit price, and actual price
            const { qty, unit_price, actual_price } = allValues;
            if (qty && unit_price && actual_price) {
              const totalPrice = (qty * unit_price) / actual_price;

              // Round the total price to the nearest whole number
              const roundedTotalPrice = Math.round(totalPrice);

              // Update the form field with the rounded total price
              form.setFieldsValue({ price: roundedTotalPrice });
            }
          }}
        >
          <Row gutter={8}>
            <Col span={12}>
              <Form.Item
                name={"name"}
                label={
                  <div>
                    <div className="khmer-text">ឈ្មោះផលិតផល</div>
                    <div className="english-text">Product Name</div>
                  </div>
                }
                rules={[
                  {
                    required: true,
                    message: "Please fill in product Name",
                  },
                ]}
              >
               <Select
    options={product}
    onChange={handleChange}
    placeholder="Select a product"
    style={{ width: 200 }}
  />
              </Form.Item>
              <Form.Item
                name={"category_id"}
                label={
                  <div>
                    <div className="khmer-text">ប្រភេទផលិតផល</div>
                    <div className="english-text">Category</div>
                  </div>
                }
                rules={[
                  {
                    required: true,
                    message: "Please fill in product category",
                  },
                ]}
              >
                <Select placeholder="Select category" options={config?.category} />
              </Form.Item>
              <Form.Item
                name={"barcode"}
                label={
                  <div>
                    <div className="khmer-text">លេខបាកូដ</div>
                    <div className="english-text">Barcode</div>
                  </div>
                }
              >
                <Input disabled placeholder="Barcode" style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item
                name={"qty"}
                label={
                  <div>
                    <div className="khmer-text">បរិមាណ</div>
                    <div className="english-text">Quantity</div>
                  </div>
                }
              >
                <InputNumber
                  placeholder="Quantity"
                  style={{ width: "100%" }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} // Add commas for thousands
                  parser={(value) => value.replace(/(,*)/g, "")} // Remove commas when parsing
                />
              </Form.Item>
              {/* <Form.Item
                name={"discount"}
                label={
                  <div>
                    <div className="khmer-text">បញ្ចុះតម្លៃ (%)</div>
                    <div className="english-text">Discount (%)</div>
                  </div>
                }
              >
                <InputNumber
                  placeholder="Discount"
                  style={{ width: "100%" }}
                  onChange={(value) => {
                    // Trigger the onValuesChange function when discount changes
                    form.setFieldsValue({ discount: value });
                    onValuesChange({ discount: value }, form.getFieldsValue());
                  }}
                />
              </Form.Item> */}
              <Form.Item
                name={"description"}
                label={
                  <div>
                    <div className="khmer-text">ការពិពណ៌នា</div>
                    <div className="english-text">Description</div>
                  </div>
                }
              >
                <Input.TextArea placeholder="Description" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={"company_name"}
                label={
                  <div>
                    <div className="khmer-text">ក្រុមហ៊ុន</div>
                    <div className="english-text">Company</div>
                  </div>
                }
                rules={[
                  {
                    required: true,
                    message: "Please Select Company Name",
                  },
                ]}
              >
                <Select placeholder="Select Company" options={config?.company_name} />
              </Form.Item>
              <Form.Item
                name={"unit"}
                label={
                  <div>
                    <div className="khmer-text">ឯកតា</div>
                    <div className="english-text">Unit</div>
                  </div>
                }
              >
                <Select placeholder="Select Unit" options={config?.unit} style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item
                name={"unit_price"}
                label={
                  <div>
                    <div className="khmer-text">តម្លៃឯកតា</div>
                    <div className="english-text">Unit Price</div>
                  </div>
                }
              >
                <InputNumber
                  placeholder="Unit Price"
                  style={{ width: "100%" }}
                  formatter={(value) => `$ ${Math.round(value).toLocaleString()}`} // Round and format as currency
                  parser={(value) => Math.round(value.replace(/[^\d]/g, ""))} // Round the value when parsing
                />
              </Form.Item>
              <Form.Item
                name={"actual_price"}
                label={
                  <div>
                    <div className="khmer-text">មេចែក</div>
                    <div className="english-text">Actual Price</div>
                  </div>
                }
              >
                <InputNumber
                  placeholder="Actual Price"
                  style={{ width: "100%" }}
                  formatter={(value) => `${Math.round(value).toLocaleString()}`} // Round and format as currency
                  parser={(value) => Math.round(value.replace(/[^\d]/g, ""))} // Round the value when parsing
                />
              </Form.Item>
              <Form.Item
                name={"status"}
                label={
                  <div>
                    <div className="khmer-text">ស្ថានភាព</div>
                    <div className="english-text">Status</div>
                  </div>
                }
              >
                <Select
                  placeholder="Select status"
                  options={[
                    {
                      label: "Active",
                      value: 1,
                    },
                    {
                      label: "Inactive",
                      value: 0,
                    },
                  ]}
                />
              </Form.Item>
              <Form.Item
                name={"price"}
                label={
                  <div>
                    <div className="khmer-text">តម្លៃសរុប</div>
                    <div className="english-text">Total Price</div>
                  </div>
                }
              >
                <InputNumber
                  disabled
                  style={{ width: "100%" }}
                  formatter={(value) => `$ ${Math.round(value).toLocaleString()}`} // Round and format as currency
                  parser={(value) => Math.round(value.replace(/[^\d]/g, ""))} // Round the value when parsing
                />
              </Form.Item>
            </Col>
          </Row>
          <div style={{ textAlign: "right" }}>
            <Space>
              <Button onClick={onCloseModal}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {form.getFieldValue("id") ? "Update" : "Save"}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
      <Row style={{ 
  marginBottom: 24,
  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
  padding: '18px 20px',
  borderRadius: 12,
  border: '1px solid #dee2e6',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
}}>
  <Col span={24}>
    <Space 
      size={[14, 12]} 
      wrap
      style={{
        width: '100%',
        justifyContent: 'flex-start',
        alignItems: 'center'
      }}
    >
      {Object.entries(state.totals || {}).map(([category, total]) => {
        const categoryItems = state.list.filter(item => item.category_name === category);
        const totalSum = categoryItems.reduce((sum, item) => sum + calculateTotalPrice(item), 0);
        
        // Dynamic color based on category
        const categoryColors = {
          'ហ្កាស(LPG)': { bg: '#fff8e6', border: '#ffd666', text: '#d46b08' },
          'ប្រេងសាំងធម្មតា(EA)': { bg: '#e6fffb', border: '#5cdbd3', text: '#08979c' },
          'ប្រេងម៉ាស៊ូត(Do)': { bg: '#f6ffed', border: '#b7eb8f', text: '#389e0d' },
          'ប្រេងសាំងស៊ុបពែរ(Super)': { bg: '#f0f5ff', border: '#adc6ff', text: '#1d39c4' },
          'default': { bg: '#fafafa', border: '#d9d9d9', text: '#434343' }
        };
        
        const colors = categoryColors[category] || categoryColors['default'];
        
        return (
          <Tag 
            key={category} 
            style={{
              margin: 0,
              padding: '10px 16px',
              fontSize: 14,
              fontWeight: 500,
              borderRadius: 8,
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s ease',
              ':hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.08)'
              }
            }}
          >
            <span style={{ 
              fontWeight: 600, 
              color: colors.text,
              minWidth: 'max-content'
            }}>
              {category}
            </span>
            
            <Divider type="vertical" style={{ 
              height: 22, 
              margin: '0 6px',
              borderColor: colors.border,
              opacity: 0.6
            }} />
            
            <span style={{ 
              color: colors.text,
              minWidth: 'max-content',
              fontWeight: 500
            }}>
              {total.toLocaleString()}L
            </span>
            
            <Divider type="vertical" style={{ 
              height: 22, 
              margin: '0 6px',
              borderColor: colors.border,
              opacity: 0.6
            }} />
            
            <span style={{ 
              color: '#1d39c4',
              fontWeight: 600,
              minWidth: 'max-content',
              background: 'rgba(24, 144, 255, 0.1)',
              padding: '2px 6px',
              borderRadius: 4
            }}>
              {formatCurrencyalltotal(totalSum)}
            </span>
          </Tag>
        );
      })}
    </Space>
  </Col>
</Row>

      <Table
        className="custom-table"
        rowClassName={() => "pos-row"}
        dataSource={state.list}
        pagination={{
          pageSize: 2, // ចំនួនធាតុក្នុងមួយទំព័រ
          total: state.total, // ចំនួនសរុបនៃធាតុទាំងអស់
          onChange: (page) => {
            refPage.current = page; // កំណត់ទំព័របច្ចុប្បន្ន
            getList(); // ទាញយកទិន្នន័យសម្រាប់ទំព័រថ្មី
          },
          hideOnSinglePage: false, // បង្ហាញ pagination ទោះបីមានតែ 1 ទំព័រក៏ដោយ
        }}
        columns={[
          {
            key: "name",
            title: (
              <div className="table-header">
                <div className="khmer-text">ឈ្មោះ</div>
                <div className="english-text">Name</div>
              </div>
            ),
            dataIndex: "name",
            render: (text) => (
              <div className="truncate-text" title={text || ""}>
                {text || "N/A"}
              </div>
            ),
          },
          {
            key: "barcode",
            title: (
              <div className="table-header">
                <div className="khmer-text">លេខបាកូដ</div>
                <div className="english-text">Barcode</div>
              </div>
            ),
            dataIndex: "barcode",
            render: (value) => <Tag color="blue">{value}</Tag>,
          },
          {
            key: "description",
            title: (
              <div className="table-header">
                <div className="khmer-text">សេចក្ដីពិពណ៌នា</div>
                <div className="english-text">Description</div>
              </div>
            ),
            dataIndex: "description",
            render: (text) => (
              <div className="truncate-text" title={text || ""}>
                {text || "N/A"}
              </div>
            ),
          },
          {
            key: "category_name",
            title: (
              <div className="table-header">
                <div className="khmer-text">ប្រភេទ</div>
                <div className="english-text">Category</div>
              </div>
            ),
            dataIndex: "category_name",
          },
          // {
          //   key: "brand",
          //   title: (
          //     <div className="table-header">
          //       <div className="khmer-text">ម៉ាក</div>
          //       <div className="english-text">Brand</div>
          //     </div>
          //   ),
          //   dataIndex: "brand",
          // },
          {
            key: "company_name",
            title: (
              <div className="table-header">
                <div className="khmer-text">ឈ្មោះក្រុមហ៊ុន</div>
                <div className="english-text">Company Name</div>
              </div>
            ),
            dataIndex: "company_name",
          },
          {
            key: "qty",
            title: (
              <div className="table-header">
                <div className="khmer-text">បរិមាណ</div>
                <div className="english-text">Quantity</div>
              </div>
            ),
            dataIndex: "qty",
            render: (value) => (
              <Tag color={value > 5000 ? "green" : "red"}>
                {value.toLocaleString()}  {/* Formats number with commas */}
              </Tag>
            ),
          },

          {
            key: "unit",
            title: (
              <div className="table-header">
                <div className="khmer-text">ឯកតា</div>
                <div className="english-text">Unit</div>
              </div>
            ),
            dataIndex: "unit",
            render: (value) => <Tag color="green">{value}</Tag>,
          },
          {
            key: "unit_price",
            title: (
              <div className="table-header">
                <div className="khmer-text">តម្លៃរាយ</div>
                <div className="english-text">Unit Price</div>
              </div>
            ),
            dataIndex: "unit_price",
            render: (value) => (
              <Tag color={value > 20 ? "green" : "volcano"}>
                {formatCurrency(value)}
              </Tag>
            ),
          },
          {
            key: "total_price",
            title: (
              <div className="table-header">
                <div className="khmer-text">តម្លៃសរុប</div>
                <div className="english-text">Total Price</div>
              </div>
            ),
            dataIndex: "total_price",
            render: (text) => formatCurrency(Math.round(text)), // Round to nearest whole number
          },

          // {
          //   key: "discount",
          //   title: (
          //     <div className="table-header">
          //       <div className="khmer-text">បញ្ចុះតម្លៃ</div>
          //       <div className="english-text">Discount</div>
          //     </div>
          //   ),
          //   dataIndex: "discount",
          // },
          {
            key: "status",
            title: (
              <div className="table-header">
                <div className="khmer-text">ស្ថានភាព</div>
                <div className="english-text">Status</div>
              </div>
            ),
            dataIndex: "status",
            render: (status) =>
              status == 1 ? (
                <Tag color="green">Active</Tag>
              ) : (
                <Tag color="red">Inactive</Tag>
              ),
          },
          {
            key: "create_at",
            title: (
              <div className="table-header">
                <div className="khmer-text">កាលបរិច្ឆេទបង្កើត</div>
                <div className="english-text">Created At</div>
              </div>
            ),
            dataIndex: "create_at",
            render: (value) => formatDateClient(value, "DD/MM/YYYY H:m A"),
          },
          {
            key: "create_by",
            title: (
              <div className="table-header">
                <div className="khmer-text">បង្កើតដោយ</div>
                <div className="english-text">Created By</div>
              </div>
            ),
            dataIndex: "create_by",
          },
          {
            key: "Action",
            title: (
              <div className="table-header">
                <div className="khmer-text">សកម្មភាព</div>
                <div className="english-text">Action</div>
              </div>
            ),
            align: "center",
            render: (item, data, index) => (
              <Space>
                <Button
                  type="primary"
                  icon={<MdEdit />}
                  onClick={() => onClickEdit(data, index)}
                />
                <Button
                  type="primary"
                  danger
                  icon={<MdDelete />}
                  onClick={() => onClickDelete(data, index)}
                />
              </Space>
            ),
          },
        ]}
      />
    </MainPage>
  );
}
export default ProductPage;