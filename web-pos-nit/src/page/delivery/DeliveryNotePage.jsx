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
import { formatDateClient, isPermission, request } from "../../util/helper";
import { MdAdd, MdDelete, MdEdit, MdOutlineCreateNewFolder, MdPrint } from "react-icons/md";
import MainPage from "../../component/layout/MainPage";
import { configStore } from "../../store/configStore";
import "./DeliveryNotePage.css";
import { getProfile } from "../../store/profile.store";
import DeliveryNotePrint from "../../component/printer/DeliveryNotePrint";
import { useTranslation } from '../../locales/TranslationContext'; 

function DeliveryNotePage() {
  const { config } = configStore();
  const { t } = useTranslation(); // Use translation
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
      const failures = [categoriesResult, customersResult, listResult].filter(
        result => result.status === 'rejected'
      );
      
      if (failures.length > 0) {
        message.error(t('failed_load_data'));
      }
    } catch (error) {
      console.error("Error loading data:", error);
      message.error(t('failed_load_data'));
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
        message.error(t('failed_load_delivery_notes'));
      }
    } catch (error) {
      console.error("Error in getList:", error);
      message.error(t('failed_load_delivery_notes'));
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
        message.error(t('failed_load_categories'));
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      message.error(t('failed_load_categories'));
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
        message.error(t('failed_load_customers'));
      }
    } catch (error) {
      console.error("Error loading customers:", error);
      message.error(t('failed_load_customers'));
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
      title: t('delete'),
      content: t('delete_delivery_confirm'),
      okText: t('yes'),
      cancelText: t('cancel'),
      onOk: async () => {
        const res = await request("delivery-note", "delete", { id: data.id });
        if (res && !res.error) {
          message.success(res.message || t('deleted_successfully'));
          setList(list.filter((item) => item.id !== data.id));
        } else {
          message.error(t('failed_to_delete'));
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
      const getCategoryInfoAsync = async (categoryId) => {
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
        const info = await getCategoryInfoAsync(item.category_id);
        return {
          ...item,
          category_name: info.category_name || "",
          product_name: item.description || ""
        };
      }));

      // Now call print directly from the component
      if (printRef.current && printRef.current.print) {
        printRef.current.print({
          data: printData,
          items: printItems
        });
      } else {
        message.error(t('print_failed'));
      }
    } catch (error) {
      console.error("Error preparing print:", error);
      message.error(t('print_failed'));
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
      message.error(t('please_add_item'));
      return;
    }

    // Check if any item has null category_id
    const invalidItems = selectedItems.filter(item => !item.category_id);
    if (invalidItems.length > 0) {
      message.error(t('please_select_category_all'));
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
      message.error(t('please_complete_item_details'));
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

    const method = data.id ? "put" : "post";
    const res = await request("delivery-note", method, data);

    if (res && !res.error) {
      message.success(res.message || t('saved_successfully'));
      getList();
      onCloseModal();
    } else {
      message.error(res?.message || t('failed_to_save'));
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
          <div className="delivery-khmer-title">{t('delivery_note_list')}</div>
          <Input.Search
            onChange={(e) => setState((prev) => ({ ...prev, txtSearch: e.target.value }))}
            allowClear
            onSearch={getList}
            placeholder={t('search_placeholder')}
            className="delivery-input"
          />
        </Space>
        <Button type="primary" onClick={onClickAddBtn} icon={<MdOutlineCreateNewFolder />}>
          {t('new')}
        </Button>
      </div>

      <Modal
        open={state.visibleModal}
        title={
          <div className="delivery-modal-title">
            {form.getFieldValue("id") ? t('edit_delivery_note') : t('new_delivery_note')}
          </div>
        }
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
                label={<div className="delivery-form-label">{t('delivery_number')}</div>}
                rules={[{ required: true, message: t('please_enter_delivery_number') }]}
              >
                <Input placeholder={t('input_delivery_number')} readOnly className="delivery-input" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="delivery_date"
                label={<div className="delivery-form-label">{t('delivery_date_label')}</div>}
                rules={[{ required: true, message: t('please_select_date') }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  placeholder={t('select_date')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="order_number"
                label={<div className="delivery-form-label">{t('order_number')}</div>}
              >
                <Input placeholder={t('input_order_number')} className="delivery-input" readOnly />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="order_date"
                label={<div className="delivery-form-label">{t('order_date_receive')}</div>}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  placeholder={t('select_date')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="top_tank_number"
                label={<div className="delivery-form-label">{t('top_tank_number')}</div>}
              >
                <Input.TextArea
                  placeholder={t('tank_number_placeholder')}
                  className="delivery-input"
                  autoSize={{ minRows: 2, maxRows: 2 }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="bottom_tank_number"
                label={<div className="delivery-form-label">{t('bottom_tank_number')}</div>}
              >
                <Input.TextArea
                  placeholder={t('tank_number_placeholder')}
                  className="delivery-input"
                  autoSize={{ minRows: 2, maxRows: 2 }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="customer_id"
            label={<div className="delivery-form-label">{t('customer')}</div>}
            rules={[{ required: true, message: t('please_select_customer') }]}
          >
            <Select
              placeholder={t('select_customer')}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option?.label?.toLowerCase().includes(input.toLowerCase())
              }
              className="delivery-select"
              loading={dataLoading.customers}
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
                label={<div className="delivery-form-label">{t('driver_name')}</div>}
              >
                <Input placeholder={t('input_driver_name')} className="delivery-input" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="driver_phone"
                label={<div className="delivery-form-label">{t('driver_phone')}</div>}
              >
                <Input placeholder={t('input_phone_number')} className="delivery-input" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="vehicle_number"
                label={<div className="delivery-form-label">{t('vehicle_number')}</div>}
              >
                <Input placeholder={t('input_vehicle_number')} className="delivery-input" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">
            <div className="delivery-khmer-title">{t('items')}</div>
          </Divider>

          <div style={{ marginBottom: 16 }}>
            <Button type="dashed" onClick={handleAddItem} block icon={<MdAdd />}>
              <span className="delivery-button-text">{t('add_item')}</span>
            </Button>
          </div>

          <Table
            dataSource={selectedItems}
            rowKey="key"
            size="small"
            columns={[
              {
                title: <div className="delivery-table-header">{t('category')}</div>,
                dataIndex: 'category_id',
                key: 'category_id',
                render: (categoryId, record) => (
                  <Select
                    value={categoryId}
                    onChange={(value) => handleItemChange(record.key, 'category_id', value)}
                    placeholder={t('select_category')}
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
                title: <div className="delivery-table-header">{t('quantity')}</div>,
                dataIndex: 'quantity',
                key: 'quantity',
                width: 100,
                render: (quantity, record) => (
                  <InputNumber
                    min={1}
                    value={quantity}
                    onChange={(value) => handleItemChange(record.key, 'quantity', value)}
                    style={{ width: '100%' }}
                    placeholder={t('enter_quantity')}
                  />
                ),
              },
              {
                title: <div className="delivery-table-header">{t('unit')}</div>,
                dataIndex: 'unit',
                key: 'unit',
                width: 100,
                render: (unit, record) => (
                  <Select
                    value={unit}
                    onChange={(value) => handleItemChange(record.key, 'unit', value)}
                    className="delivery-select"
                    placeholder={t('select_unit')}
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
                {t('total')}: {calculateTotal().toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
            </div>
          )}

          <Form.Item 
            name="note" 
            label={<div className="delivery-form-label">{t('note')}</div>} 
            style={{ marginTop: 16 }}
          >
            <Input.TextArea placeholder={t('enter_note')} rows={3} className="delivery-input" />
          </Form.Item>

          <Form.Item name="status" label={<div className="delivery-form-label">{t('status')}</div>}>
            <Select
              placeholder={t('select_status')}
              options={[
                { label: t('active'), value: 1 },
                { label: t('inactive'), value: 0 },
                { label: t('delivered_status'), value: 2 },
              ]}
              className="delivery-select"
            />
          </Form.Item>

          <Space>
            <Button onClick={onCloseModal}>
              <span className="delivery-button-text">{t('cancel')}</span>
            </Button>
            <Button type="primary" htmlType="submit">
              <span className="delivery-button-text">
                {form.getFieldValue("id") ? t('edit') : t('save')}
              </span>
            </Button>
          </Space>
        </Form>
      </Modal>

      <Table
        dataSource={list}
        rowKey="id"
        loading={loading}
        columns={[
          {
            key: "No",
            title: <div className="delivery-table-header">{t('no')}</div>,
            render: (item, data, index) => index + 1,
            width: 70,
          },
          {
            key: "delivery_number",
            title: <div className="delivery-table-header">{t('delivery_number')}</div>,
            dataIndex: "delivery_number",
          },
          {
            key: "customer_name",
            title: <div className="delivery-table-header">{t('customer')}</div>,
            dataIndex: "customer_name",
            render: (text) => <div className="delivery-khmer-text">{text}</div>,
          },
          {
            key: "delivery_date",
            title: <div className="delivery-table-header">{t('date')}</div>,
            dataIndex: "created_at",
            render: (date) => formatDateClient(date, "DD/MM/YYYY H:m A"),
          },
          {
            key: "created_by",
            title: <div className="delivery-table-header">{t('created_by')}</div>,
            dataIndex: "created_by_name",
            render: (text) => <div className="delivery-khmer-text">{text}</div>,
          },
          {
            key: "status",
            title: <div className="delivery-table-header">{t('status')}</div>,
            dataIndex: "status",
            render: (status) => {
              if (status === 2) return <Tag color="blue" className="delivery-status-tag">{t('delivered_status')}</Tag>;
              return status === 1 ?
                <Tag color="green" className="delivery-status-tag">{t('active')}</Tag> :
                <Tag color="red" className="delivery-status-tag">{t('inactive')}</Tag>;
            },
            width: 120,
          },
          {
            title: <div className="delivery-table-header">{t('actions')}</div>,
            align: "center",
            width: 180,
            render: (item, data) => (
              <Space>
                {isPermission("customer.getone") && (
                  <Button type="primary" icon={<MdEdit />} onClick={() => onClickEdit(data)} />
                )}
                {isPermission("customer.getone") && (
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