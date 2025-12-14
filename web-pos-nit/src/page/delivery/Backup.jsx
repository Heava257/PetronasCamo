import React, { useEffect, useState, useRef } from "react";
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
  InputNumber,
  Divider,
  Row,
  Col
} from "antd";
import moment from 'moment';
import { formatDateClient,isPermission, request } from "../../util/helper";
import { MdAdd, MdDelete, MdEdit, MdOutlineCreateNewFolder, MdPrint } from "react-icons/md";
import MainPage from "../../component/layout/MainPage";
import { configStore } from "../../store/configStore";
import "./DeliveryNotePage.css";
import { getProfile } from "../../store/profile.store";
import DeliveryNotePrint from "../../component/printer/DeliveryNotePrint";

function DeliveryNotePage() {
  const { config } = configStore();
  const [form] = Form.useForm();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [dataLoading, setDataLoading] = useState({
    categories: true,
    customers: true
  });

  // Reference to the DeliveryNotePrint component
  const printRef = useRef();

  const [state, setState] = useState({
    visibleModal: false,
    id: null,
    delivery_number: "",
    customer_id: null,
    delivery_date: null,
    order_date: null,
    order_number: "",
    driver_name: "",
    driver_phone: "",
    vehicle_number: "",
    note: "",
    status: 1,
    txtSearch: "",
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);

    try {
      // Load all data in parallel with individual error handling
      const [categoriesResult, customersResult, listResult] = await Promise.allSettled([
        loadCategories(),
        loadCustomers(),
        getList()
      ]);

      // Check for any failures
     
    } catch (error) {
      console.error("Error loading data:", error);
      message.error("Failed to load data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const getList = async () => {
    setLoading(true);
    try {
      const res = await request("delivery-note", "get");
      if (res && !res.error) {
        setList(res.list || []);
      } else {
        console.error("Error fetching delivery notes:", res?.error);
      }
    } catch (error) {
      console.error("Error in getList:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    setDataLoading(prev => ({ ...prev, categories: true }));
    const { id: user_id } = getProfile();
    if (!user_id) return;

    try {
      const res = await request(`category/my-group`, "get");
      if (res && !res.error) {
       
        setCategories(res.list || []);
      } else {
        console.error("Error in category response:", res?.error);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setDataLoading(prev => ({ ...prev, categories: false }));
    }
  };

  const loadCustomers = async () => {
    setDataLoading(prev => ({ ...prev, customers: true }));
    const { id } = getProfile();
    if (!id) return;

    try {
      const res = await request(`customer/my-group`, "get");
      if (res && !res.error) {
       
        setCustomers(res.list || []);
      } else {
        console.error("Error in customers response:", res?.error);
      }
    } catch (error) {
      console.error("Error loading customers:", error);
    } finally {
      setDataLoading(prev => ({ ...prev, customers: false }));
    }
  };

  const onClickEdit = async (data) => {
    setState({
      ...state,
      visibleModal: true,
      id: data.id,
    });

    // Fetch delivery note details
    const detailRes = await request(`delivery-note/${data.id}/detail`, "get");
    const items = detailRes && !detailRes.error ? detailRes.items || [] : [];

    // Add keys to items for proper React rendering
    const itemsWithKeys = items.map((item, index) => ({
      ...item,
      key: item.id || `item-${index}-${Date.now()}`
    }));

    form.setFieldsValue({
      id: data.id,
      delivery_number: data.delivery_number,
      customer_id: data.customer_id,
      delivery_date: data.delivery_date ? moment(data.delivery_date) : null,
      order_date: data.order_date ? moment(data.order_date) : null,
      order_number: data.order_number || "",
      driver_name: data.driver_name,
      driver_phone: data.driver_phone,
      vehicle_number: data.vehicle_number,
      note: data.note,
      status: data.status,
      items: itemsWithKeys,
      top_tank_number: data.top_tank_number || "",
      bottom_tank_number: data.bottom_tank_number || "",
    });

    setSelectedItems(itemsWithKeys);
  };

  const onClickDelete = async (data) => {
    Modal.confirm({
      title: <span className="delivery-khmer-title">លុប</span>,
      content: "Are you sure you want to remove this delivery note?",
      okText: <span className="delivery-khmer-text">យល់ព្រម</span>,
      cancelText: <span className="delivery-khmer-text">បោះបង់</span>,
      onOk: async () => {
        const res = await request("delivery-note", "delete", { id: data.id });
        if (res && !res.error) {
          message.success(res.message || "Deleted successfully");
          setList(list.filter((item) => item.id !== data.id));
        }
      },
    });
  };

  const getCategoryInfo = (categoryId) => {
    const categoryInfo = categories.find(c => c.id === categoryId);
    return {
      category_name: categoryInfo ? categoryInfo.name : "",
      category_id: categoryId
    };
  };


  const onClickPrint = async (data) => {
    try {
      setIsPrinting(true);

      // Fetch the items
      const detailRes = await request(`delivery-note/${data.id}/detail`, "get");
      const items = detailRes && !detailRes.error ? detailRes.items || [] : [];

      // Find customer information
      const customer = customers.find(c => c.id === data.customer_id) || {};

      // Use created_at as a fallback for order_date if it's missing
      const orderDate = data.order_date || data.created_at;

      // Prepare data for printing with proper date formatting
      const printData = {
        ...data,
        customer_name: customer.name || "",
        customer_phone: customer.tel || "",
        customer_address: customer.address || "",
        order_date_formatted: data.order_date ? formatDateClient(data.order_date, "DD/MM/YYYY") : "",
        delivery_date_formatted: data.delivery_date ? formatDateClient(data.delivery_date, "DD/MM/YYYY") : "",
        top_tank_number: data.top_tank_number || "",
        bottom_tank_number: data.bottom_tank_number || "",
      };

      // Get category info
      const getCategoryInfo = async (categoryId) => {
        try {
          const categoryInfo = categories.find(c => c.id === categoryId);
          return {
            category_name: categoryInfo ? categoryInfo.name : "",
            category_id: categoryId
          };
        } catch (error) {
          console.error("Error getting category info:", error);
          return { category_name: "", category_id: null };
        }
      };

      // Prepare items with category names
      const printItems = await Promise.all(items.map(async (item) => {
        const info = await getCategoryInfo(item.category_id);
        return {
          ...item,
          category_name: info.category_name || "",
          product_name: item.description || "" // Use description field instead of product name
        };
      }));

      console.log("Print data:", printData);
      console.log("Print items:", printItems);

      // Now call print directly from the component
      if (printRef.current && printRef.current.print) {
        printRef.current.print({
          data: printData,
          items: printItems
        });
      } else {
        message.error("Print function not available");
      }
    } catch (error) {
      console.error("Error preparing print:", error);
    } finally {
      setIsPrinting(false);
    }
  };

  const onClickAddBtn = () => {
    setState({
      ...state,
      visibleModal: true,
    });
    form.resetFields();
    setSelectedItems([]);

    // Current date for defaults
    const today = moment();
    const dateStr = today.format('YYYYMMDD');
    const randomSeq = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

    // Generate numbers
    const newDeliveryNumber = `DN-${dateStr}-${randomSeq}`;
    const newOrderNumber = `ORD-${dateStr}-${randomSeq}`;

    form.setFieldsValue({
      delivery_number: newDeliveryNumber,
      order_number: newOrderNumber,
      delivery_date: null,
      order_date: null,
      status: 1,
    });
  };

  const onCloseModal = () => {
    form.resetFields();
    setState({
      ...state,
      visibleModal: false,
      id: null,
    });
    setSelectedItems([]);
  };

  const handleAddItem = () => {
    const newItem = {
      key: `new-item-${Date.now()}`,
      category_id: null,
      description: "",
      quantity: 1,
      unit: "",
      unit_price: 0,
      amount: 0,
    };

    setSelectedItems([...selectedItems, newItem]);
  };

  const handleRemoveItem = (key) => {
    setSelectedItems(selectedItems.filter(item => item.key !== key));
  };

  const handleItemChange = (key, field, value) => {
    const updatedItems = selectedItems.map(item => {
      if (item.key === key) {
        const updatedItem = { ...item, [field]: value };

        // Auto calculate amount if quantity or unit_price changes
        if (field === 'quantity' || field === 'unit_price') {
          updatedItem.amount = (updatedItem.quantity || 0) * (updatedItem.unit_price || 0);
        }

        // If category_id changes, get category details
        if (field === 'category_id') {
          const selectedCategory = categories.find(c => c.id === value);
          if (selectedCategory) {
            updatedItem.category_name = selectedCategory.name || "";
            console.log("Selected category info:", {
              category: selectedCategory.name,
              id: value
            });
          }
        }

        return updatedItem;
      }
      return item;
    });

    setSelectedItems(updatedItems);
  };

  const onFinish = async (values) => {
    // Validate that we have items and all items have category_id
    if (selectedItems.length === 0) {
      message.error("Please add at least one item");
      return;
    }

    // Check if any item has null category_id
    const invalidItems = selectedItems.filter(item => !item.category_id);
    if (invalidItems.length > 0) {
      message.error("Please select a category for all items");
      return;
    }

    // Additional validation for required fields in items
    const incompleteItems = selectedItems.filter(item =>
      !item.category_id ||
      !item.quantity ||
      item.quantity <= 0 ||
      !item.unit
    );

    if (incompleteItems.length > 0) {
      message.error("Please complete all item details (category, quantity, unit)");
      return;
    }

    const formattedOrderDate = values.order_date ? values.order_date.format('YYYY-MM-DD') : null;
    const formattedDeliveryDate = values.delivery_date ? values.delivery_date.format('YYYY-MM-DD') : null;

    const data = {
      id: form.getFieldValue("id"),
      delivery_number: values.delivery_number,
      customer_id: values.customer_id,
      delivery_date: formattedDeliveryDate,
      order_date: formattedOrderDate,
      order_number: values.order_number || "",
      driver_name: values.driver_name || "",
      driver_phone: values.driver_phone || "",
      vehicle_number: values.vehicle_number || "",
      note: values.note || "",
      status: values.status,
      top_tank_number: values.top_tank_number || "",
      bottom_tank_number: values.bottom_tank_number || "",
      items: selectedItems.map(item => ({
        category_id: item.category_id,
        description: item.description || "",
        quantity: item.quantity,
        unit: item.unit || "",
        unit_price: item.unit_price || 0,
        amount: item.amount || 0,
      }))
    };

    console.log("Submitting data:", data);

    const method = data.id ? "put" : "post";
    const res = await request("delivery-note", method, data);

    if (res && !res.error) {
      message.success(res.message || "Saved successfully");
      getList();
      onCloseModal();
    } else {
      message.error(res?.message || "Failed to save");
    }
  };

  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => total + (parseFloat(item.amount) || 0), 0);
  };

  return (
    <MainPage loading={loading}>
      {/* Hidden print component */}
      <div style={{ display: "none" }}>
        <DeliveryNotePrint ref={printRef} />
      </div>

      <div className="pageHeader">
        <Space>
          <div className="delivery-khmer-title">បញ្ជីបញ្ជាដឹកជញ្ជូន</div>
          <Input.Search
            onChange={(e) => setState((prev) => ({ ...prev, txtSearch: e.target.value }))}
            allowClear
            onSearch={getList}
            placeholder="Search"
            className="delivery-input"
          />
        </Space>
        <Button type="primary" onClick={onClickAddBtn} icon={<MdOutlineCreateNewFolder />}>
          NEW
        </Button>
      </div>

      <Modal
        open={state.visibleModal}
        title={<div className="delivery-modal-title">{form.getFieldValue("id") ? "កែសម្រួលបញ្ជាដឹកជញ្ជូន" : "បញ្ជាដឹកជញ្ជូនថ្មី"}</div>}
        footer={null}
        onCancel={onCloseModal}
        width={800}
      >
        <Form layout="vertical" onFinish={onFinish} form={form}>
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="delivery_number"
                label={<div className="delivery-form-label">លេខបញ្ជាដឹកជញ្ជូន</div>}
                rules={[{ required: true, message: "Please enter delivery note number!" }]}
              >
                <Input placeholder="Input Delivery Note Number" readOnly className="delivery-input" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="delivery_date"
                label={<div className="delivery-form-label">ថ្ងែទីបញ្ចាទិញ</div>}
                rules={[{ required: true, message: "Please select date!" }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="order_number"
                label={<div className="delivery-form-label">លេខរៀងបញ្ចាទិញ</div>}
              >
                <Input placeholder="Order Number" className="delivery-input" readOnly />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="order_date"
                label={<div className="delivery-form-label">ថ្ងៃទទួលទំនិញ</div>}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="top_tank_number"
                label={<div className="delivery-form-label">លេខឃ្លុំបេផ្នែកខាងលើ</div>}
              >
                <Input.TextArea
                  placeholder="លេខ 5 ខ្ទង់\nលេខ 10 ខ្ទង់"
                  className="delivery-input"
                  autoSize={{ minRows: 2, maxRows: 2 }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="bottom_tank_number"
                label={<div className="delivery-form-label">លេខឃ្លុំបេផ្នែកខាងក្រោម</div>}
              >
                <Input.TextArea
                  placeholder="លេខ 5 ខ្ទង់\nលេខ 10 ខ្ទង់"
                  className="delivery-input"
                  autoSize={{ minRows: 2, maxRows: 2 }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="customer_id"
            label={<div className="delivery-form-label">អតិថិជន</div>}
            rules={[{ required: true, message: "Please select customer!" }]}
          >
            <Select
              placeholder="Select customer"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option?.label?.toLowerCase().includes(input.toLowerCase()) ||
                option?.label?.toLowerCase().includes(input) // Allows searching by index
              }
              className="delivery-select"
              options={customers.map((customer, index) => ({
                label: `${index + 1}. ${customer.name}`,
                value: customer.id
              }))}
            />
          </Form.Item>


          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="driver_name"
                label={<div className="delivery-form-label">ឈ្មោះអ្នកបើកបរ</div>}
              >
                <Input placeholder="Input driver name" className="delivery-input" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="driver_phone"
                label={<div className="delivery-form-label">លេខទូរស័ព្ទទំនាក់ទំនង</div>}
              >
                <Input placeholder="Input phone number" className="delivery-input" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="vehicle_number"
                label={<div className="delivery-form-label">លេខរថយន្ត</div>}
              >
                <Input placeholder="Input vehicle number" className="delivery-input" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">
            <div className="delivery-khmer-title">មុខទំនិញ</div>
          </Divider>

          <div style={{ marginBottom: 16 }}>
            <Button type="dashed" onClick={handleAddItem} block icon={<MdAdd />}>
              <span className="delivery-button-text">បន្ថែមមុខទំនិញ</span>
            </Button>
          </div>

          <Table
            dataSource={selectedItems}
          
            rowKey="key"
            size="small"
            columns={[
              {
                title: <div className="delivery-table-header">ប្រភេទ</div>,
                dataIndex: 'category_id',
                key: 'category_id',
                render: (categoryId, record) => (
                  <Select
                    value={categoryId}
                    onChange={(value) => handleItemChange(record.key, 'category_id', value)}
                    placeholder="Select Category"
                    style={{ width: '100%' }}
                    showSearch
                    optionFilterProp="children"
                    loading={dataLoading.categories}
                    options={categories.map(category => ({
                      label: category.name,
                      value: category.id
                    }))}
                  />
                ),
              },

              {
                title: <div className="delivery-table-header">បរិមាណ</div>,
                dataIndex: 'quantity',
                key: 'quantity',
                width: 100,
                render: (quantity, record) => (
                  <InputNumber
                    min={1}
                    value={quantity}
                    onChange={(value) => handleItemChange(record.key, 'quantity', value)}
                    style={{ width: '100%' }}
                  />
                ),
              },
              {
                title: <div className="delivery-table-header">ឯកតា</div>,
                dataIndex: 'unit',
                key: 'unit',
                width: 100,
                render: (unit, record) => (
                  <Select
                    value={unit}
                    onChange={(value) => handleItemChange(record.key, 'unit', value)}
                    className="delivery-select"
                    placeholder="Unit"
                    style={{ width: '100%' }}
                    options={[
                      { label: "L", value: "L" },
                      { label: "T", value: "T" },
                      { label: "KG", value: "KG" },
                      { label: "PC", value: "PC" }
                    ]}
                  />
                ),
              },



            ]}
              pagination={false}
          />

          {selectedItems.length > 0 && (
            <div style={{ marginTop: 16, textAlign: 'right', fontSize: '16px', fontWeight: 'bold' }}>
              <div className="delivery-khmer-title">
                សរុប: {calculateTotal().toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
            </div>
          )}

          <Form.Item name="note" label={<div className="delivery-form-label">កំណត់ចំណាំ</div>} style={{ marginTop: 16 }}>
            <Input.TextArea placeholder="Enter note" rows={3} className="delivery-input" />
          </Form.Item>

          <Form.Item name="status" label={<div className="delivery-form-label">ស្ថានភាព</div>}>
            <Select
              placeholder="Select status"
              options={[
                { label: <div className="delivery-khmer-text">សកម្ម</div>, value: 1 },
                { label: <div className="delivery-khmer-text">អសកម្ម</div>, value: 0 },
                { label: <div className="delivery-khmer-text">បានបញ្ជូន</div>, value: 2 },
              ]}
              className="delivery-select"
            />
          </Form.Item>

          <Space>
            <Button onClick={onCloseModal}>
              <span className="delivery-button-text">បោះបង់</span>
            </Button>
            <Button type="primary" htmlType="submit">
              <span className="delivery-button-text">{form.getFieldValue("id") ? "កែសម្រួល" : "រក្សាទុក"}</span>
            </Button>
          </Space>
        </Form>
      </Modal>

      <Table
        dataSource={list}
        rowKey="id"
        columns={[
          {
            key: "No",
            title: <div className="delivery-table-header">លេខ</div>,
            render: (item, data, index) => index + 1,
            width: 70,
          },
          {
            key: "delivery_number",
            title: <div className="delivery-table-header">លេខបញ្ជាដឹកជញ្ជូន</div>,
            dataIndex: "delivery_number",
          },
          {
            key: "customer_name",
            title: <div className="delivery-table-header">អតិថិជន</div>,
            dataIndex: "customer_name",
            render: (text) => <div className="delivery-khmer-text">{text}</div>,
          },
          {
            key: "delivery_date",
            title: <div className="delivery-table-header">កាលបរិច្ឆេទ</div>,
            dataIndex: "created_at",
            render: (date) => formatDateClient(date, "DD/MM/YYYY H:m A"),
          },
          {
            key: "created_by",
            title: <div className="delivery-table-header">អ្នកបង្កើត</div>,
            dataIndex: "created_by_name",
            render: (text) => <div className="delivery-khmer-text">{text}</div>,
          },

          {
            key: "status",
            title: <div className="delivery-table-header">ស្ថានភាព</div>,
            dataIndex: "status",
            render: (status) => {
              if (status === 2) return <Tag color="blue" className="delivery-status-tag">បានបញ្ជូន</Tag>;
              return status === 1 ?
                <Tag color="green" className="delivery-status-tag">សកម្ម</Tag> :
                <Tag color="red" className="delivery-status-tag">អសកម្ម</Tag>;
            },
            width: 120,
          },

          {
            title: <div className="delivery-table-header">សកម្មភាព</div>,
            align: "center",
            width: 180,
            render: (item, data) => (
            
              <Space>
                
              {isPermission("customer.getone")&&(

                <Button type="primary" icon={<MdEdit />} onClick={() => onClickEdit(data)} />
                 )}
                   {isPermission("customer.getone")&&(
                <Button type="primary" danger icon={<MdDelete />} onClick={() => onClickDelete(data)} />
                    )}
                <Button
                  type="default"
                  icon={<MdPrint />}
                  onClick={() => onClickPrint(data)}
                  loading={isPrinting}
                />
              </Space>
            ),
          }
        ]}
        pagination={false}
      />
    </MainPage>
  );
}

export default DeliveryNotePage;