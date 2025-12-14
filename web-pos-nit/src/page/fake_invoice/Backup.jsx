import React, { useEffect, useState, useRef, useCallback } from "react";
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
  Col,
  Card,
  Statistic
} from "antd";
import moment from 'moment';
import dayjs from 'dayjs';
import { formatDateClient, formatDateServer, isPermission, request } from "../../util/helper";
import {
  MdAdd,
  MdDelete,
  MdEdit,
  MdOutlineCreateNewFolder,
  MdPrint,
  MdReceipt,
} from "react-icons/md";
import MainPage from "../../component/layout/MainPage";
import { configStore } from "../../store/configStore";
import "./FakeInvoicePage.css";
import { getProfile } from "../../store/profile.store";
import FakeInvoicePrint from "../../component/pos/FakeInvoicePrint";
import { useReactToPrint } from 'react-to-print';

function FakeInvoicePage() {
  const { config } = configStore();
  const [form] = Form.useForm();
  const printRef = useRef();

  // States
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [statistics, setStatistics] = useState({
    totalInvoices: 0,
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    partialAmount: 0
  });

  const [state, setState] = useState({
    visibleModal: false,
    id: null,
    txtSearch: "",
  });

  // Load all data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  // Load all required data
  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.allSettled([
        loadCategories(),
        loadCustomers(),
        getList()
      ]);
    } catch (error) {
      message.error("មិនអាចទាញយកទិន្នន័យបានទេ! សូមព្យាយាមម្តងទៀត");
    } finally {
      setLoading(false);
    }
  };

  // Get invoice list
  const getList = async () => {
    try {
      const res = await request("fakeinvoice/group", "get");
      if (res && !res.error) {
        setList(res.list || []);
        calculateStatistics(res.list || []);
      } else {
        message.error("មិនអាចទាញយកបញ្ជីវិក្កយបត្របានទេ");
      }
    } catch (error) {
      message.error("កំហុសក្នុងការទាញយកទិន្នន័យ");
    }
  };

  const calculateStatistics = (invoices = []) => {
    // ✅ group by order_no
    const grouped = Object.values(invoices.reduce((acc, item) => {
      const key = item.order_no;
      if (!acc[key]) {
        acc[key] = {
          ...item,
          total_amount: 0,
          paid_amount: 0,
          total_due: 0
        };
      }

      acc[key].total_amount += parseFloat(item.total_amount || 0);
      acc[key].paid_amount += parseFloat(item.paid_amount || 0);
      acc[key].total_due += parseFloat(item.total_due || 0);

      return acc;
    }, {}));

    const stats = grouped.reduce((acc, invoice) => {
      acc.totalInvoices += 1;
      acc.totalAmount += invoice.total_amount;

      switch (invoice.payment_status) {
        case 'Paid':
          acc.paidAmount += invoice.total_amount;
          break;
        case 'Partial':
          acc.partialAmount += invoice.paid_amount;
          acc.unpaidAmount += invoice.total_due;
          break;
        case 'Unpaid':
        default:
          acc.unpaidAmount += invoice.total_amount;
          break;
      }

      return acc;
    }, {
      totalInvoices: 0,
      totalAmount: 0,
      paidAmount: 0,
      unpaidAmount: 0,
      partialAmount: 0
    });

    setStatistics(stats);
  };


  // Load categories
  const loadCategories = async () => {
    setCategoryLoading(true);
    try {
      const res = await request(`category/my-group`, "get");
      if (res && !res.error) {
        setCategories(res.list || []);
      }
    } catch (error) {
    } finally {
      setCategoryLoading(false);
    }
  };

  // Load customers
  const loadCustomers = async () => {
    try {
      const res = await request(`customer/my-group`, "get");
      if (res && !res.error) {
        setCustomers(res.list || []);
      }
    } catch (error) {
    }
  };

  // Handle print functionality
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice-${printData?.order_no || 'Unknown'}`,
    onBeforeGetContent: () => {
      return new Promise((resolve) => {
        setIsPrinting(true);
        setTimeout(() => resolve(), 100);
      });
    },
    onAfterPrint: () => {
      setIsPrinting(false);
      setPrintData(null);
    },
  });

  const onClickEdit = async (data) => {
    setState(prev => ({
      ...prev,
      visibleModal: true,
      id: data.id,
    }));

    try {
      const res = await request(`fakeinvoice/detail/${data.id}`, "get");

      if (res && res.success && res.items) {
        const items = res.items.map((item) => ({
          category_id: item.category_id,
          quantity: item.quantity,
          // Format unit_price to 4 decimal places when loading for edit
          unit_price: parseFloat(parseFloat(item.unit_price || 0).toFixed(4)),
          actual_price: item.actual_price
        }));

        // Safe date parsing specifically for Ant Design DatePicker
        const parseDate = (dateString) => {
          if (!dateString || typeof dateString !== "string" || dateString === "0000-00-00") return null;

          const clean = dateString.trim();

          // Try parsing with moment (for Ant Design DatePicker compatibility)
          try {
            const parsed = moment(clean);
            if (parsed.isValid()) {
              return parsed;
            }
          } catch (error) {
          }

          return null;
        };


        // Get invoice info
        const invoiceInfo = res.invoice || res.items[0] || data;

        // Prepare form data with safe date parsing
        const formData = {
          id: data.id,
          order_no: invoiceInfo.order_no || data.order_no,
          customer_id: invoiceInfo.customer_id || data.customer_id,
          items,
          total_amount: invoiceInfo.total_amount || data.total_amount,
          paid_amount: invoiceInfo.paid_amount || data.paid_amount,
          payment_method: invoiceInfo.payment_method || data.payment_method,
          remark: invoiceInfo.remark || data.remark,
          create_by: invoiceInfo.create_by || data.create_by,
          total_due: invoiceInfo.total_due || data.total_due,
          payment_status: invoiceInfo.payment_status || data.payment_status,
          additional_notes: invoiceInfo.additional_notes || data.additional_notes || "",
          destination: invoiceInfo.destination || data.destination || "",
        };

        // Parse dates safely
        const dates = {
          order_date: parseDate(invoiceInfo.order_date || data.order_date),
          delivery_date: parseDate(invoiceInfo.delivery_date || data.delivery_date),
          due_date: parseDate(invoiceInfo.due_date || data.due_date),
          receive_date: parseDate(invoiceInfo.receive_date || data.receive_date),
        };

        // Add dates to form data
        Object.assign(formData, dates);

        // Set form values
        form.setFieldsValue(formData);

      } else {
        message.error("មិនអាចទាញយកទំនិញសម្រាប់កែប្រែបានទេ!");
      }

    } catch (error) {
      message.error("កំហុសក្នុងការទាញទិន្នន័យ: " + error.message);
    }
  };


  const formatUnitPrice = (price) => {
  if (!price) return '0';
  const num = parseFloat(price);
  if (isNaN(num)) return '0';
  
  // Format to 4 decimal places, then remove trailing zeros
  return num.toFixed(4).replace(/\.?0+$/, '');
};
  const onClickDelete = async (data) => {
    Modal.confirm({
      title: <span className="invoice-khmer-title">លុបវិក្កយបត្រ</span>,
      content: "តើអ្នកពិតជាចង់លុបវិក្កយបត្រនេះមែនទេ?",
      okText: <span className="khmer-text">យល់ព្រម</span>,
      cancelText: <span className="khmer-text">បោះបង់</span>,
      onOk: async () => {
        try {
          const res = await request("fakeinvoice", "delete", {
            order_no: data.order_no, // 🔄 send order_no instead of id
          });

          if (res && !res.error) {
            message.success("បានលុបដោយជោគជ័យ");
            // 🔄 remove by order_no
            setList((prev) => prev.filter((item) => item.order_no !== data.order_no));
            calculateStatistics();
          } else {
            message.error("មិនអាចលុបបានទេ");
          }
        } catch (error) {
          message.error("កំហុសក្នុងការលុប");
        }
      },
    });
  };


  const groupedInvoices = Object.values(
    list.reduce((acc, item) => {
      const key = item.order_no;

      if (!acc[key]) {
        acc[key] = {
          ...item,
          quantity: 0,
          total_amount: 0,
          paid_amount: 0,
          total_due: 0,
          detail_ids: [],
        };
      }

      acc[key].quantity += Number(item.quantity || 0);
      acc[key].total_amount += parseFloat(item.total_amount || 0);
      acc[key].paid_amount += parseFloat(item.paid_amount || 0);
      acc[key].total_due += parseFloat(item.total_due || 0);
      acc[key].detail_ids.push(item.id);

      return acc;
    }, {})
  );



  const onCloseModal = () => {
    form.resetFields();
    setState(prev => ({
      ...prev,
      visibleModal: false,
      id: null,
    }));
  };
  const modalFooter = (
    <Space style={{ float: 'right' }}>
      <Button onClick={onCloseModal}>
        <span className="invoice-button-text">បោះបង់</span>
      </Button>
      <Button
        type="primary"
        onClick={() => form.submit()}
        loading={loading}
      >
        <span className="invoice-button-text">
          {state.id ? "កែសម្រួល" : "រក្សាទុក"}
        </span>
      </Button>
    </Space>
  );
  // ✅ Updated onClickPrint function to work with the fixed API
  // ✅ Fixed onClickPrint function
  const onClickPrint = async (data) => {
    try {
      setIsPrinting(true);

      const customer = customers.find(c => c.id === data.customer_id) || {};

      const res = await request(`fakeinvoice/detail/${data.id}`, "get");

      if (res && res.success && res.items) {
        const items = res.items;

        // ✅ FINAL FIX: Based on your database showing actual_price = 0.86
       const cart_list = items.map((item) => {
  const quantity = parseFloat(item.quantity) || 0;
  // Format unit_price for printing with proper precision
  const unit_price = parseFloat(parseFloat(item.unit_price || 0).toFixed(4));
  const actual_price = parseFloat(item.actual_price);

  let line_total = quantity * unit_price;

  if (!isFinite(line_total) || isNaN(line_total)) {
    line_total = 0;
  }

  return {
    category_name: item.category_name || "Product",
    cart_qty: quantity,
    unit_price: unit_price,
    actual_price: actual_price || 0,
    line_total: line_total
  };
});

        // ✅ Calculate totals from the corrected line totals
        const calculated_total = cart_list.reduce((sum, item) => sum + item.line_total, 0);
        const total_qty = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

        const invoiceInfo = res.invoice || items[0] || {};

        const objSummary = {
          sub_total: calculated_total,
          total_qty: total_qty,
          save_discount: 0,
          tax: 0,
          total: invoiceInfo.total_amount || calculated_total,
          total_paid: invoiceInfo.paid_amount || 0,
          total_due: invoiceInfo.total_due || (invoiceInfo.total_amount - invoiceInfo.paid_amount),
          customer_name: invoiceInfo.customer_name || customer.name || data.customer_name || "N/A",
          customer_address: invoiceInfo.customer_address || customer.address || data.customer_address || "N/A",
          customer_tel: invoiceInfo.customer_tel || customer.tel || data.customer_tel || "N/A",
          user_name: invoiceInfo.create_by || data.create_by || getProfile()?.name || "N/A",
          order_no: invoiceInfo.order_no || data.order_no || "N/A",
          order_date: invoiceInfo.order_date ? new Date(invoiceInfo.order_date) : new Date(),
          delivery_date: invoiceInfo.delivery_date ? new Date(invoiceInfo.delivery_date) : null,
          receive_date: invoiceInfo.receive_date ? new Date(invoiceInfo.receive_date) : null,
          destination: invoiceInfo.destination || data.destination || "N/A",
          payment_method: invoiceInfo.payment_method || data.payment_method || "N/A",
          payment_status: invoiceInfo.payment_status || data.payment_status || "Unpaid",
          remark: invoiceInfo.remark || data.remark || "N/A",
          additional_notes: invoiceInfo.additional_notes || data.additional_notes || "N/A"
        };

        setPrintData({
          objSummary,
          cart_list,
          selectedLocations: [],
          ...data
        });

        setTimeout(() => handlePrint(), 200);

      } else {
        message.error("មិនអាចរកឃើញទិន្នន័យផលិតផលសម្រាប់វិក្កយបត្រនេះទេ");
        setIsPrinting(false);
      }

    } catch (error) {
      message.error("មិនអាចរៀបចំការបោះពុម្ពបានទេ: " + error.message);
      setIsPrinting(false);
    }
  };
  const ItemCalculationPreview = ({ item, index }) => {
    const quantity = parseFloat(item?.quantity) || 0;
    const unitPrice = parseFloat(item?.unit_price) || 0;
    const actualPrice = parseFloat(item?.actual_price) || 0;

    let itemTotal = 0;
    let calculationText = "";

    if (quantity > 0 && unitPrice > 0) {
      // Format unit price to show relevant decimal places
      const formattedUnitPrice = unitPrice.toFixed(4).replace(/\.?0+$/, '');

      if (actualPrice === 0) {
        itemTotal = quantity * unitPrice;
        calculationText = `${quantity} × $${formattedUnitPrice} = $${itemTotal.toFixed(2)}`;
      } else {
        itemTotal = (quantity * unitPrice) / actualPrice;
        calculationText = `(${quantity} × $${formattedUnitPrice}) ÷ ${actualPrice} = $${itemTotal.toFixed(2)}`;
      }
    }

    return (
      <div style={{
        fontSize: '12px',
        color: '#666',
        marginTop: '4px',
        fontStyle: 'italic'
      }}>
        {calculationText}
      </div>
    );
  };
  const onClickAddBtn = () => {
    setState(prev => ({
      ...prev,
      visibleModal: true,
      id: null,
    }));
    form.resetFields();
    form.setFieldsValue({
      order_no: "",
      payment_status: "Unpaid",
      order_date: moment(), // Current date as moment object
      delivery_date: null,  // Explicitly null
      due_date: null,       // Explicitly null
      receive_date: null,   // Explicitly null
      items: [{ quantity: 1, unit_price: 0 }],
      total_amount: 0,
      paid_amount: 0,
      total_due: 0,
      additional_notes: "",
      destination: "",
      payment_method: "",
      remark: "",
    });
  };


  const onFinish = async (values) => {
    try {
      const user_id = getProfile()?.id;
      if (!values.order_no) {
        message.error("សូមបញ្ចូលលេខវិក្កយបត្រ");
        return;
      }

      if (!values.customer_id) {
        message.error("សូមជ្រើសរើសអតិថិជន");
        return;
      }

      if (!values.items || values.items.length === 0) {
        message.error("សូមបន្ថែមមុខទំនិញយ៉ាងហោចណាស់មួយ");
        return;
      }

      for (let i = 0; i < values.items.length; i++) {
        const item = values.items[i];
        if (!item.category_id || !item.quantity || !item.unit_price) {
          message.error(`សូមបំពេញព័ត៌មានពេញលេញសម្រាប់មុខទំនិញទី ${i + 1}`);
          return;
        }
      }

      const items = values.items.map((item) => {
        const category = categories.find(cat => cat.id === item.category_id);
        if (!category) {
          throw new Error(`ប្រភេទមុខទំនិញមិនត្រូវបានរកឃើញ: ${item.category_id}`);
        }
        const actual_price = category.actual_price || 0;
        return {
          category_id: item.category_id,
          category_name: category.name || "Product",
          quantity: parseInt(item.quantity) || 0,
          // Preserve 4 decimal places for unit_price
          unit_price: parseFloat(parseFloat(item.unit_price || 0).toFixed(4)),
          actual_price,
        };
      });

      const total_amount = parseFloat(values.total_amount) || 0;
      const paid_amount = parseFloat(values.paid_amount) || 0;

      let payment_status = "Unpaid";
      if (paid_amount >= total_amount && total_amount > 0) {
        payment_status = "Paid";
      } else if (paid_amount > 0) {
        payment_status = "Partial";
      }

      const payload = {
        order_no: values.order_no,
        customer_id: values.customer_id,
        items,
        total_amount,
        paid_amount,
        payment_status,
        payment_method: values.payment_method || "",
        remark: values.remark || "",
        create_by: values.create_by || getProfile()?.name || "",
        order_date: formatDateServer(values.order_date),
        delivery_date: formatDateServer(values.delivery_date),
        due_date: formatDateServer(values.due_date),
        receive_date: formatDateServer(values.receive_date),
        destination: values.destination || "",
        additional_notes: values.additional_notes || "",
        user_id
      };

      if (state.id) {
        payload.id = state.id;
      }

      const method = payload.id ? "put" : "post";
      const res = await request("fakeinvoice", method, payload);

      if (res && res.success && !res.error) {
        message.success(res.message || "បានរក្សាទុកដោយជោគជ័យ");
        await getList(); // Refresh the list
        onCloseModal();
      } else {
        message.error(res?.message || res?.error || "មិនអាចរក្សាទុកបានទេ");
      }
    } catch (error) {
      message.error("កំហុសក្នុងការរក្សាទុក: " + error.message);
    }
  };


  const DatePickerComponent = ({ name, label, placeholder }) => (
    <Form.Item
      name={name}
      label={<div className="invoice-form-label">{label}</div>}
    >
      <DatePicker
        style={{ width: '100%' }}
        format="DD/MM/YYYY"
        placeholder={placeholder}
        allowClear
        showToday
        disabledDate={() => false}
      />
    </Form.Item>
  );
  const calculateTotalAmount = useCallback(() => {
  const items = form.getFieldValue('items') || [];
  let totalAmount = 0;

  items.forEach((item, index) => {
    if (item && item.quantity && item.unit_price && item.category_id) {
      const quantity = parseFloat(item.quantity) || 0;
      // Ensure unit_price maintains precision
      const unitPrice = parseFloat(parseFloat(item.unit_price || 0).toFixed(4));
      const actualPrice = parseFloat(item.actual_price) || 0;

      let itemTotal = 0;

      if (actualPrice === 0) {
        itemTotal = quantity * unitPrice;
      } else {
        itemTotal = (quantity * unitPrice) / actualPrice;
      }

      if (!isFinite(itemTotal) || isNaN(itemTotal)) {
        itemTotal = 0;
      }

      totalAmount += itemTotal;
    }
  });

  const paidAmount = parseFloat(form.getFieldValue('paid_amount')) || 0;
  const totalDue = totalAmount - paidAmount;

  let paymentStatus = "Unpaid";
  if (paidAmount >= totalAmount && totalAmount > 0) {
    paymentStatus = "Paid";
  } else if (paidAmount > 0) {
    paymentStatus = "Partial";
  }

  form.setFieldsValue({
    total_amount: parseFloat(totalAmount.toFixed(2)),
    total_due: parseFloat(totalDue.toFixed(2)),
    payment_status: paymentStatus
  });
}, [form, categories]);

  return (
    <MainPage loading={loading}>
      {/* Hidden print component */}
      <div style={{ display: "none" }}>
        {printData && (
          <FakeInvoicePrint
            ref={printRef}
            objSummary={printData.objSummary}
            cart_list={printData.cart_list}
            selectedLocations={printData.selectedLocations}
          />
        )}
      </div>

      {/* Header */}
      <div className="pageHeader">
        <Space>
          <div className="invoice-khmer-title">បញ្ជីវិក្កយបត្រ</div>
          <Input.Search
            onChange={(e) => setState(prev => ({ ...prev, txtSearch: e.target.value }))}
            allowClear
            onSearch={getList}
            placeholder="ស្វែងរកតាមលេខវិក្កយបត្រ ឬ ឈ្មោះអតិថិជន..."
            className="invoice-input"
            style={{ width: 300 }}
          />
        </Space>
        <Button type="primary" onClick={onClickAddBtn} icon={<MdOutlineCreateNewFolder />}>
          វិក្កយបត្រថ្មី
        </Button>
      </div>
      <Modal
        open={state.visibleModal}
        title={<div className="invoice-modal-title">{state.id ? "កែសម្រួលវិក្កយបត្រ" : "វិក្កយបត្រថ្មី"}</div>}
        footer={modalFooter} // Use the footer from the artifact
        onCancel={onCloseModal}
        width={1000}
        destroyOnClose
      >
        <Form layout="vertical" onFinish={onFinish} form={form}>
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>

          {/* Basic Info */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="order_no"
                label={<div className="invoice-form-label">លេខវិក្កយបត្រ</div>}
                rules={[{ required: true, message: "សូមបញ្ចូលលេខវិក្កយបត្រ!" }]}
              >
                <Input
                  placeholder="បញ្ចូលលេខវិក្កយបត្រ"
                  className="invoice-input"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="customer_id"
                label={<div className="invoice-form-label">អតិថិជន</div>}
                rules={[{ required: true, message: "សូមជ្រើសរើសអតិថិជន!" }]}
              >
                <Select
                  placeholder="ជ្រើសរើសអតិថិជន"
                  showSearch
                  optionFilterProp="children"
                  className="invoice-select"
                  options={customers.map((customer, index) => ({
                    label: `${index + 1}. ${customer.name}`,
                    value: customer.id
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Divider orientation="left">
            <div className="invoice-form-label">ព័ត៌មានផលិតផល</div>
          </Divider>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row gutter={16} key={key} style={{ marginBottom: 16 }}>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'category_id']}
                        label="ប្រភេទផលិតផល"
                        rules={[{ required: true, message: 'ជ្រើសរើសប្រភេទ' }]}
                      >
                        <Select
                          placeholder="ជ្រើសរើសប្រភេទ"
                          options={categories.map((c) => ({
                            label: `${c.name} (មេចែក: ${c.actual_price || 0})`, // Show actual_price in dropdown
                            value: c.id
                          }))}
                          onChange={(value) => {
                            const selected = categories.find(cat => cat.id === value);
                            if (selected) {
                              // ✅ Always set the default actual_price from category
                              form.setFieldValue(['items', name, 'actual_price'], selected.actual_price || 0);

                              // ✅ Recalculate immediately
                              calculateTotalAmount();
                            }
                          }}
                        />
                      </Form.Item>
                    </Col>

                    <Col span={4}>
                      <Form.Item
                        {...restField}
                        name={[name, 'quantity']}
                        label="បរិមាណ"
                        rules={[{ required: true, message: 'បញ្ចូលបរិមាណ' }]}
                      >
                        <InputNumber
                          min={1}
                          style={{ width: '100%' }}
                          onChange={calculateTotalAmount}
                        />
                      </Form.Item>
                    </Col>

                    <Col span={4}>
                      <Form.Item
                        {...restField}
                        name={[name, 'unit_price']}
                        label="តម្លៃតោន"
                        rules={[{ required: true, message: 'បញ្ចូលតម្លៃ' }]}
                      >
                        <InputNumber
                          min={0}
                          step={0.0001}  // Allow 4 decimal places input
                          precision={4}  // Display 4 decimal places
                          style={{ width: '100%' }}
                          onChange={calculateTotalAmount}
                          placeholder="0.0000"
                          formatter={value => {
                            if (!value) return '';
                            // Format to 4 decimal places, remove trailing zeros
                            const num = parseFloat(value);
                            return num.toFixed(4).replace(/\.?0+$/, '');
                          }}
                          parser={value => {
                            if (!value) return '';
                            return parseFloat(value.replace(/[^\d.-]/g, ''));
                          }}
                        />
                      </Form.Item>
                    </Col>

                    <Col span={4}>
                      <Form.Item
                        {...restField}
                        name={[name, 'actual_price']}
                        label="មេចែក"
                        tooltip="តម្លៃមេចែកសម្រាប់គណនា (អាចកែប្រែបាន)"
                      >
                        <InputNumber
                          min={0}
                          step={0.01}
                          style={{ width: '100%' }}
                          onChange={() => {
                            // ✅ Small delay to ensure form value is updated
                            setTimeout(calculateTotalAmount, 10);
                          }}
                          placeholder="0.00"
                          formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={value => value.replace(/\$\s?|(,*)/g, '')}
                        />
                      </Form.Item>
                    </Col>

                    <Col span={4}>
                      <Button
                        danger
                        onClick={() => {
                          remove(name);
                          calculateTotalAmount();
                        }}
                        style={{ marginTop: 30 }}
                      >
                        លុប
                      </Button>
                    </Col>
                  </Row>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block>
                    បន្ថែមមុខទំនិញ
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
          <Row>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <DatePickerComponent
                name="order_date"
                label="ថ្ងៃបញ្ជាទិញ"
                placeholder="ជ្រើសរើសថ្ងៃបញ្ជាទិញ"
              />
            </Col>
            <Col span={12}>
              <DatePickerComponent
                name="delivery_date"
                label="ថ្ងៃប្រគល់ទំនិញ"
                placeholder="ជ្រើសរើសថ្ងៃដឹកជញ្ជូន"
              />
            </Col>
          </Row>




          <Row gutter={16}>


            <Col span={12}>
              <Form.Item
                name="destination"
                label={<div className="invoice-form-label">គោលដៅ</div>}
                tooltip="បញ្ចូលទីតាំងគោលដៅ ដឹកជញ្ជូន"
              >
                <Input placeholder="ឧ. រោងចក្រ A / ផ្ទះលេខ xx" className="invoice-input" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="remark" label={<div className="invoice-form-label">កំណត់ចំណាំ</div>}>
                <Input.TextArea placeholder="Enter remarks" rows={3} className="invoice-input" />
              </Form.Item>


            </Col>

          </Row>

        </Form>

      </Modal>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title={<div className="invoice-khmer-title">វិក្កយបត្រសរុប</div>}
              value={statistics.totalInvoices}
              prefix={<MdReceipt />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={<div className="invoice-khmer-title">ចំនួនសរុប</div>}
              value={statistics.totalAmount}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>

      </Row>

      <Table
        dataSource={groupedInvoices.filter(item => {
          const text = state.txtSearch.toLowerCase();
          return (
            item.order_no?.toLowerCase().includes(text) ||
            item.customer_name?.toLowerCase().includes(text)
          );
        })}

        rowKey="id"
        scroll={{ x: 1400 }}
        pagination={false}
        loading={loading}
        columns={[
          {
            key: "No",
            title: <div className="delivery-table-header">លេខ</div>,
            render: (item, data, index) => index + 1,
            width: 70,
            fixed: 'left'
          },
          {
            key: "order_no",
            title: <div className="delivery-table-header">លេខវិក្កយបត្រ</div>,
            dataIndex: "order_no",
            width: 150,
            fixed: 'left'
          },
          {
            key: "customer_name",
            title: <div className="delivery-table-header">អតិថិជន</div>,
            dataIndex: "customer_name",
            render: (text) => <div className="khmer-text">{text}</div>,
            width: 150,
          },
          {
            key: "customer_address",
            title: <div className="delivery-table-header">អាសយដ្ឋាន</div>,
            dataIndex: "customer_address",
            render: (text) => <div className="invoice-khmer-text">{text}</div>,
            width: 150,
          },
          {
            key: "customer_tel",
            title: <div className="delivery-table-header">លេខទូរស័ព្ទ</div>,
            dataIndex: "customer_tel",
            render: (text) => <div className="delivery-khmer-text">{text}</div>,
            width: 150,
          },



          {
            key: "total_amount",
            title: <div className="delivery-table-header">ចំនួនសរុប</div>,
            dataIndex: "total_amount",
            render: (amount) =>
              `$${parseFloat(amount || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`,
            width: 120,
          }
          ,

          {
            key: "order_date",
            title: <div className="delivery-table-header">ថ្ងៃបញ្ជាទិញ</div>,
            dataIndex: "order_date",
            render: (date) => date ? formatDateClient(date, "DD/MM/YYYY") : "",
            width: 120,
          },
          {
            key: "delivery_date",
            title: <div className="delivery-table-header">ថ្ងៃដឹកជញ្ជូន</div>,
            dataIndex: "delivery_date",
            render: (date) => date ? formatDateClient(date, "DD/MM/YYYY") : "",
            width: 120,
          },
          {
            key: "create_by",
            title: <div className="delivery-table-header">អ្នកបង្កើត</div>,
            dataIndex: "create_by",
            render: (text) => (
              <Tag color="blue" className="delivery-khmer-text">
                {text}
              </Tag>
            ),
            width: 120,
          }
          ,
          {
            key: "additional_notes",
            title: <div className="delivery-table-header">ចំណាំពិសេស</div>,
            dataIndex: "additional_notes",
            render: (text) => <div className="khmer-text">{text}</div>,
            width: 150,
          },
          {
            key: "action",
            title: <div className="delivery-table-header">សកម្មភាព</div>,
            render: (item, data) => (
              <Space>
                {isPermission("customer.getone") && (
                  <Button
                    size="small"
                    type="primary"
                    icon={<MdEdit />}
                    onClick={() => onClickEdit(data)}
                    title="Edit Invoice"
                  />
                )}

                <Button
                  size="small"
                  type="default"
                  icon={<MdPrint />}
                  onClick={() => onClickPrint(data)}
                  loading={isPrinting}
                  title="Print Invoice"
                  style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', color: 'white' }}
                />

                {isPermission("customer.getone") && (
                  <Button
                    size="small"
                    danger
                    icon={<MdDelete />}
                    onClick={() => onClickDelete(data)}
                    title="Delete Invoice"
                  />
                )}
              </Space>
            ),
            width: 200,
            fixed: 'right',
          },
        ]}

        summary={(pageData) => {
          const totalAmount = pageData.reduce((sum, record) => sum + parseFloat(record.total_amount || 0), 0);
          const totalPaid = pageData.reduce((sum, record) => sum + parseFloat(record.paid_amount || 0), 0);
          const totalDue = pageData.reduce((sum, record) => sum + parseFloat(record.total_due || 0), 0);

          return (
            <Table.Summary fixed>
              <Table.Summary.Row>


              </Table.Summary.Row>
            </Table.Summary>
          );
        }}
      />
    </MainPage>
  );
}

export default FakeInvoicePage;