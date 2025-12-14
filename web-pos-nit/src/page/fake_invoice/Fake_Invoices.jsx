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
import { useTranslation } from '../../locales/TranslationContext';
import { useDarkMode } from "../../component/DarkModeContext"; // 👈 Import dark mode

function FakeInvoicePage() {
  const { t } = useTranslation();
  const { config } = configStore();
  const [form] = Form.useForm();
  const printRef = useRef();
  const { isDarkMode } = useDarkMode(); // 👈 ប្រើ dark mode

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

  // ... (រក្សាទុក functions ទាំងអស់ដដែល)
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.allSettled([
        loadCategories(),
        loadCustomers(),
        getList()
      ]);
    } catch (error) {
      message.error(t('cannot_load_data'));
    } finally {
      setLoading(false);
    }
  };

  const getList = async () => {
    try {
      const res = await request("fakeinvoice/group", "get");
      if (res && !res.error) {
        setList(res.list || []);
        calculateStatistics(res.list || []);
      } else {
        message.error(t('cannot_load_invoice_list'));
      }
    } catch (error) {
      message.error(t('error_loading_data'));
    }
  };

  const calculateStatistics = (invoices = []) => {
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

  const loadCustomers = async () => {
    try {
      const res = await request(`customer/my-group`, "get");
      if (res && !res.error) {
        setCustomers(res.list || []);
      }
    } catch (error) {
    }
  };

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
    setState(prev => ({ ...prev, visibleModal: true, id: data.id }));
    try {
      const res = await request(`fakeinvoice/detail/${data.id}`, "get");
      if (res && res.success && res.items) {
        const items = res.items.map((item) => ({
          category_id: item.category_id,
          quantity: item.quantity,
          unit_price: parseFloat(parseFloat(item.unit_price || 0).toFixed(4)),
          actual_price: item.actual_price
        }));

        const parseDate = (dateString) => {
          if (!dateString || typeof dateString !== "string" || dateString === "0000-00-00") return null;
          const clean = dateString.trim();
          try {
            const parsed = moment(clean);
            if (parsed.isValid()) return parsed;
          } catch (error) { }
          return null;
        };

        const invoiceInfo = res.invoice || res.items[0] || data;
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

        const dates = {
          order_date: parseDate(invoiceInfo.order_date || data.order_date),
          delivery_date: parseDate(invoiceInfo.delivery_date || data.delivery_date),
          due_date: parseDate(invoiceInfo.due_date || data.due_date),
          receive_date: parseDate(invoiceInfo.receive_date || data.receive_date),
        };

        Object.assign(formData, dates);
        form.setFieldsValue(formData);
      } else {
        message.error(t('cannot_load_products_for_edit'));
      }
    } catch (error) {
      message.error(t('error_loading_details') + ": " + error.message);
    }
  };

  const onClickDelete = async (data) => {
    Modal.confirm({
      title: <span className="invoice-khmer-title">{t('delete_invoice')}</span>,
      content: t('delete_invoice_confirm'),
      okText: <span className="khmer-text">{t('confirm')}</span>,
      cancelText: <span className="khmer-text">{t('cancel')}</span>,
      onOk: async () => {
        try {
          const res = await request("fakeinvoice", "delete", { order_no: data.order_no });
          if (res && !res.error) {
            message.success(t('deleted_successfully'));
            setList((prev) => prev.filter((item) => item.order_no !== data.order_no));
            calculateStatistics();
          } else {
            message.error(t('cannot_delete'));
          }
        } catch (error) {
          message.error(t('delete_error'));
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
    setState(prev => ({ ...prev, visibleModal: false, id: null }));
  };

  const modalFooter = (
    <Space style={{ float: 'right' }}>
      <Button onClick={onCloseModal}>
        <span className="invoice-button-text">{t('cancel')}</span>
      </Button>
      <Button type="primary" onClick={() => form.submit()} loading={loading}>
        <span className="invoice-button-text">
          {state.id ? t('edit') : t('save')}
        </span>
      </Button>
    </Space>
  );

  const onClickPrint = async (data) => {
    try {
      setIsPrinting(true);
      const customer = customers.find(c => c.id === data.customer_id) || {};
      const res = await request(`fakeinvoice/detail/${data.id}`, "get");

      if (res && res.success && res.items) {
        const items = res.items;
        const cart_list = items.map((item) => {
          const quantity = parseFloat(item.quantity) || 0;
          const unit_price = parseFloat(parseFloat(item.unit_price || 0).toFixed(4));
          const actual_price = parseFloat(item.actual_price);
          let line_total = quantity * unit_price;
          if (!isFinite(line_total) || isNaN(line_total)) line_total = 0;

          return {
            category_name: item.category_name || "Product",
            cart_qty: quantity,
            unit_price: unit_price,
            actual_price: actual_price || 0,
            line_total: line_total
          };
        });

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
          customer_name: invoiceInfo.customer_name || customer.name || data.customer_name || t('not_available'),
          customer_address: invoiceInfo.customer_address || customer.address || data.customer_address || t('not_available'),
          customer_tel: invoiceInfo.customer_tel || customer.tel || data.customer_tel || t('not_available'),
          user_name: invoiceInfo.create_by || data.create_by || getProfile()?.name || t('not_available'),
          order_no: invoiceInfo.order_no || data.order_no || t('not_available'),
          order_date: invoiceInfo.order_date ? new Date(invoiceInfo.order_date) : new Date(),
          delivery_date: invoiceInfo.delivery_date ? new Date(invoiceInfo.delivery_date) : null,
          receive_date: invoiceInfo.receive_date ? new Date(invoiceInfo.receive_date) : null,
          destination: invoiceInfo.destination || data.destination || t('not_available'),
          payment_method: invoiceInfo.payment_method || data.payment_method || t('not_available'),
          payment_status: invoiceInfo.payment_status || data.payment_status || "Unpaid",
          remark: invoiceInfo.remark || data.remark || t('not_available'),
          additional_notes: invoiceInfo.additional_notes || data.additional_notes || t('not_available')
        };

        setPrintData({
          objSummary,
          cart_list,
          selectedLocations: [],
          ...data
        });

        setTimeout(() => handlePrint(), 200);
      } else {
        message.error(t('cannot_find_product_data'));
        setIsPrinting(false);
      }
    } catch (error) {
      message.error(t('cannot_prepare_print') + ": " + error.message);
      setIsPrinting(false);
    }
  };

  const onClickAddBtn = () => {
    setState(prev => ({ ...prev, visibleModal: true, id: null }));
    form.resetFields();
    form.setFieldsValue({
      order_no: "",
      payment_status: "Unpaid",
      order_date: moment(),
      delivery_date: null,
      due_date: null,
      receive_date: null,
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
        message.error(t('please_enter_invoice_number'));
        return;
      }
      if (!values.customer_id) {
        message.error(t('please_select_customer'));
        return;
      }
      if (!values.items || values.items.length === 0) {
        message.error(t('please_add_at_least_one_product'));
        return;
      }

      for (let i = 0; i < values.items.length; i++) {
        const item = values.items[i];
        if (!item.category_id || !item.quantity || !item.unit_price) {
          message.error(t('please_complete_product_info') + ` ${i + 1}`);
          return;
        }
      }

      const items = values.items.map((item) => {
        const category = categories.find(cat => cat.id === item.category_id);
        if (!category) {
          throw new Error(t('category_not_found') + `: ${item.category_id}`);
        }
        const actual_price = category.actual_price || 0;
        return {
          category_id: item.category_id,
          category_name: category.name || "Product",
          quantity: parseInt(item.quantity) || 0,
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
        message.success(res.message || t('saved_successfully'));
        await getList();
        onCloseModal();
      } else {
        message.error(res?.message || res?.error || t('cannot_save'));
      }
    } catch (error) {
      message.error(t('save_error') + ": " + error.message);
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

    items.forEach((item) => {
      if (item && item.quantity && item.unit_price && item.category_id) {
        const quantity = parseFloat(item.quantity) || 0;
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

      {/* Header - បន្ថែម dark mode classes */}
      <div className="pageHeader bg-white dark:bg-gray-800 p-4 mb-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
        <Space>
          <div className="invoice-khmer-title text-gray-900 dark:text-white text-xl font-semibold">
            {t('invoice_list')}
          </div>
          <Input.Search
            onChange={(e) => setState(prev => ({ ...prev, txtSearch: e.target.value }))}
            allowClear
            onSearch={getList}
            placeholder={t('search_by_invoice_or_customer')}
            className="invoice-input "
            style={{ width: 300, background: isDarkMode ? '#374151' : '#ffffff',
    borderColor: isDarkMode ? '#4b5563' : '#d9d9d9' }}
          />
        </Space>
        <Button type="primary" onClick={onClickAddBtn} icon={<MdOutlineCreateNewFolder />}>
          {t('new_invoice')}
        </Button>
      </div>

      {/* Statistics Cards - បន្ថែម dark mode classes */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card className="transition-colors hover:shadow-md">
            <Statistic
              title={<div className="invoice-khmer-title text-gray-700 dark:text-gray-300">
                {t('total_invoices_stat')}
              </div>}
              value={statistics.totalInvoices}
              prefix={<MdReceipt className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />}
              valueStyle={{ color: isDarkMode ? '#60a5fa' : '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="transition-colors hover:shadow-md">
            <Statistic
              title={<div className="invoice-khmer-title text-gray-700 dark:text-gray-300">
                {t('total_amount')}
              </div>}
              value={statistics.totalAmount}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Modal - បន្ថែម dark mode classes */}
      <Modal
        open={state.visibleModal}
        title={<div className="invoice-modal-title text-gray-900 dark:text-white">
          {state.id ? t('edit_invoice') : t('new_invoice')}
        </div>}
        footer={modalFooter}
        onCancel={onCloseModal}
        width={1000}
        destroyOnClose
      >
        <Form layout="vertical" onFinish={onFinish} form={form}>
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>


              <Form.Item
                name="order_no"
                label={<div className="invoice-form-label">{t('invoice_number')}</div>}
                rules={[{ required: true, message: t('please_enter_invoice_number') }]}
              >
                <Input placeholder={t('enter_invoice_number')} className="invoice-input" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="customer_id"
                label={<div className="invoice-form-label">{t('customer')}</div>}
                rules={[{ required: true, message: t('please_select_customer') }]}
              >
                <Select
                  placeholder={t('select_customer')}
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
            <div className="invoice-form-label">{t('product_info')}</div>
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
                        label={t('product_category')}
                        rules={[{ required: true, message: t('select_category') }]}
                      >
                        <Select
                          placeholder={t('select_category')}
                          options={categories.map((c) => ({
                            label: `${c.name} (${t('divisor')}: ${c.actual_price || 0})`,
                            value: c.id
                          }))}
                          onChange={(value) => {
                            const selected = categories.find(cat => cat.id === value);
                            if (selected) {
                              form.setFieldValue(['items', name, 'actual_price'], selected.actual_price || 0);
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
                        label={t('quantity')}
                        rules={[{ required: true, message: t('enter_quantity') }]}
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
                        label={t('ton_price')}
                        rules={[{ required: true, message: t('enter_price') }]}
                      >
                        <InputNumber
                          min={0}
                          step={0.0001}
                          precision={4}
                          style={{ width: '100%' }}
                          onChange={calculateTotalAmount}
                          placeholder="0.0000"
                          formatter={value => {
                            if (!value) return '';
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
                        label={t('divisor')}
                        tooltip={t('divisor_tooltip')}
                      >
                        <InputNumber
                          min={0}
                          step={0.01}
                          style={{ width: '100%' }}
                          onChange={() => setTimeout(calculateTotalAmount, 10)}
                          placeholder="0.00"
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
                        {t('remove')}
                      </Button>
                    </Col>
                  </Row>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block>
                    {t('add_product')}
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Row gutter={16}>
            <Col span={12}>
              <DatePickerComponent
                name="order_date"
                label={t('order_date_label')}
                placeholder={t('select_order_date')}
              />
            </Col>
            <Col span={12}>
              <DatePickerComponent
                name="delivery_date"
                label={t('delivery_date_label')}
                placeholder={t('select_delivery_date')}
              />
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="destination"
                label={<div className="invoice-form-label">{t('destination')}</div>}
                tooltip={t('destination_tooltip')}
              >
                <Input placeholder={t('destination_placeholder')} className="invoice-input" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="remark" label={<div className="invoice-form-label">{t('remarks')}</div>}>
                <Input.TextArea placeholder={t('enter_remarks')} rows={3} className="invoice-input" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title={<div className="invoice-khmer-title">{t('total_invoices_stat')}</div>}
              value={statistics.totalInvoices}
              prefix={<MdReceipt />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={<div className="invoice-khmer-title">{t('total_amount')}</div>}
              value={statistics.totalAmount}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>

      </Row>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 transition-colors">
        <Table
          className="invoice-table"
          dataSource={groupedInvoices.filter(item =>
            !state.txtSearch ||
            item.order_no.toLowerCase().includes(state.txtSearch.toLowerCase()) ||
            item.customer_name.toLowerCase().includes(state.txtSearch.toLowerCase())
          )}
          columns={[
            {
              title: "No",
              dataIndex: "no",
              key: "no",
              render: (text, record, index) => index + 1,
              width: 50,
              className: 'text-center'
            },
            {
              title: t('invoice_number'),
              dataIndex: "order_no",
              key: "order_no",
              width: 120,
              sorter: (a, b) => (a.order_no || "").localeCompare(b.order_no || ""),
              render: (text) => <span className="font-semibold">{text}</span>
            },
            {
              title: t('customer'),
              dataIndex: "customer_name",
              key: "customer_name",
              sorter: (a, b) => (a.customer_name || "").localeCompare(b.customer_name || ""),
              render: (text) => <span className="text-center">{text}</span>,
            },
            {
              title: t('address'),
              dataIndex: "customer_address",
              key: "customer_address",
              render: (text) => <span className="text-center text-sm">{text}</span>
            },
            {
              title: t('phone'),
              dataIndex: "customer_tel",
              key: "customer_tel",
              width: 120,
              className: 'text-center'
            },
            {
              title: t('total_amount'),
              dataIndex: "total_amount",
              key: "total_amount",
              width: 120,
              sorter: (a, b) => (a.total_amount || 0) - (b.total_amount || 0),
              render: (text) => <span className="font-mono font-medium text-green-500">${parseFloat(text || 0).toFixed(2)}</span>,
              className: 'text-right'
            },
            {
              title: t('paid_amount'),
              dataIndex: "paid_amount",
              key: "paid_amount",
              width: 120,
              sorter: (a, b) => (a.paid_amount || 0) - (b.paid_amount || 0),
              render: (text) => <span className="font-mono font-medium text-blue-500">${parseFloat(text || 0).toFixed(2)}</span>,
              className: 'text-right'
            },
            {
              title: t('total_due'),
              dataIndex: "total_due",
              key: "total_due",
              width: 120,
              sorter: (a, b) => (a.total_due || 0) - (b.total_due || 0),
              render: (text) => <span className="font-mono font-medium text-red-500">${parseFloat(text || 0).toFixed(2)}</span>,
              className: 'text-right'
            },
            {
              title: t('payment_status'),
              dataIndex: "payment_status",
              key: "payment_status",
              width: 100,
              className: 'text-center',
              render: (text) => {
                let color = 'gray';
                if (text === 'Paid') color = 'green';
                else if (text === 'Partial') color = 'blue';
                else if (text === 'Unpaid') color = 'red';
                return <Tag color={color}>{t(text.toLowerCase())}</Tag>;
              }
            },
            {
              title: t('order_date'),
              dataIndex: "order_date",
              key: "order_date",
              width: 100,
              className: 'text-center',
              render: (text) => formatDateClient(text)
            },
            {
              title: t('delivery_date'),
              dataIndex: "delivery_date",
              key: "delivery_date",
              width: 100,
              className: 'text-center',
              render: (text) => formatDateClient(text)
            },
            {
              title: t('created_by'),
              dataIndex: "create_by",
              key: "create_by",
              width: 100,
              render: (text) => <span className="text-center">{text}</span>
            },
            {
              title: t('additional_notes'),
              dataIndex: "additional_notes",
              key: "additional_notes",
              render: (text) => <span className="text-center text-sm">{text}</span>
            },
            {
              key: "action",
              title: <div className="delivery-table-header">{t('action')}</div>,
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
      </div>
    </MainPage>
  );
}

export default FakeInvoicePage;