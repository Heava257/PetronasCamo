import React, { useEffect, useState } from "react";
import { request, formatPrice } from "../../util/helper";
import MainPage from "../../component/layout/MainPage";
import {
    Button,
    Select,
    DatePicker,
    Table,
    Card,
    Typography,
    Row,
    Col,
    Modal,
    Form,
    Input,
    message,
    InputNumber,
    Space,
    Tag,
    Upload,
    Popconfirm,
    Alert
} from "antd";
import dayjs from "dayjs";
import {
    DownloadOutlined,
    PrinterOutlined,
    PlusOutlined,
    EyeOutlined,
    DeleteOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    PhoneOutlined
} from '@ant-design/icons';
import { useTranslation } from "../../locales/TranslationContext";
import * as XLSX from 'xlsx';
import { Image } from "antd";
import { Config } from "../../util/config";
import { debounce } from "lodash";
import { useSettings } from "../../settings";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Custom styles for ledger table
const getTableStyles = (isDarkMode) => `
    .ledger-table .ant-table-thead > tr > th {
        background-color: ${isDarkMode ? '#1f1f1f' : '#d4d4d4'} !important;
        color: ${isDarkMode ? '#d9d9d9' : '#1a1a1a'} !important;
        font-weight: 600;
        text-align: center;
        border: 1px solid ${isDarkMode ? '#303030' : '#b0b0b0'};
    }
    .ledger-table .ant-table-thead > tr > th .ant-table-column-title {
        color: ${isDarkMode ? '#d9d9d9' : '#1a1a1a'} !important;
    }
    .ledger-table .ant-table-tbody > tr > td {
        border: 1px solid ${isDarkMode ? '#303030' : '#d4d4d4'};
    }
    .ledger-table .ant-table-summary {
        background-color: ${isDarkMode ? '#141414' : '#f5f5f5'};
        font-weight: bold;
    }
`;

function CustomerPaymentPage() {
    const { t } = useTranslation();
    const { isDarkMode } = useSettings();
    const [form] = Form.useForm();

    const [state, setState] = useState({
        loading: false,
        customers: [],
        selectedCustomer: null,
        ledger: [],
        summary: {
            beginning_balance: 0,
            increase: 0,
            increase_count: 0,
            total_payments: 0,
            payment_count: 0,
            ending_balance: 0,
            comparison: 0
        },
        customer: {},
        dateRange: [dayjs().startOf('month'), dayjs().endOf('month')],
        paymentModalVisible: false,
        exchangeRate: 4100, // Default USD to KHR rate
        detailModalVisible: false,
        selectedPayment: null,
        submitting: false,
        scanning: false,
        invoiceStatus: { status: '', help: '' }, // success, error, validating
        referenceStatus: { status: '', help: '' }, // success, error, validating
        linkedOrderId: null,
        pendingInvoices: [],
        duplicateSlipFound: false, // Block submission if true
        invalidSlipFound: false, // Block if not a bank slip
        selectedInvoice: null, // Track selected invoice for overpayment check
        showAllInvoices: false, // Toggle to show paid invoices in selection
        debtors: [],
        branchFilter: null,
        branches: ['All', 'PP', 'KPS', 'KPC', 'BMC', 'KPT', 'PLN', 'TKV', 'SHV'] // Pre-defined branches or load dynamically
    });

    useEffect(() => {
        loadCustomers();
        loadDebtors();
    }, []);

    const loadDebtors = async (branch = null) => {
        setState(p => ({ ...p, loading: true }));
        try {
            const query = branch && branch !== 'All' ? `?branch_name=${branch}` : '';
            const res = await request(`customer_payment/debtors${query}`, "get");
            if (res && res.success) {
                setState(p => ({ ...p, debtors: res.list || [], loading: false }));
            } else {
                setState(p => ({ ...p, loading: false }));
            }
        } catch (error) {
            console.error(error);
            setState(p => ({ ...p, loading: false }));
        }
    };

    useEffect(() => {
        if (state.selectedCustomer) {
            loadLedger();
        }
    }, [state.selectedCustomer, state.dateRange]);

    const loadCustomers = async () => {
        const res = await request("customer/my-group", "get"); // Using correct endpoint
        if (res && !res.error) {
            setState(p => ({ ...p, customers: res.list || [] }));
        }
    };

    const loadPendingInvoices = async (customerId, showAll = false) => {
        if (!customerId) return;
        try {
            const res = await request(`customer_payment/pending_invoices?customer_id=${customerId}` + (showAll ? '&show_all=true' : ''), "get");
            if (res && res.success) {
                setState(p => ({ ...p, pendingInvoices: res.list || [] }));
            }
        } catch (error) {
            console.error("Failed to load pending invoices", error);
        }
    };

    const loadLedger = async () => {
        if (!state.selectedCustomer) return;

        setState(p => ({ ...p, loading: true }));

        const params = {
            customer_id: state.selectedCustomer,
            start_date: state.dateRange[0]?.format('YYYY-MM-DD'),
            end_date: state.dateRange[1]?.format('YYYY-MM-DD')
        };

        const res = await request("customer_payment/ledger", "get", params);

        if (res && res.success) {
            setState(p => ({
                ...p,
                ledger: res.ledger || [],
                summary: res.summary || {},
                customer: res.customer || {},
                loading: false
            }));
        } else {
            setState(p => ({ ...p, loading: false }));
            message.error(res?.message || "Failed to load ledger");
        }
    };

    const handleScanSlip = async (file) => {
        if (!file) return;

        setState(p => ({ ...p, scanning: true, duplicateSlipFound: false }));
        const formData = new FormData();
        formData.append('image', file);
        formData.append('type', 'customer'); // Specify type for duplicate check

        try {
            const res = await request("ocr/scan", "post", formData);
            if (res && res.success && res.data) {
                const { amount, date, reference_no, bank_name, description, duplicate, duplicateMessage } = res.data;

                if (duplicate) {
                    setState(p => ({ ...p, duplicateSlipFound: true, invalidSlipFound: false }));
                    message.error({
                        content: duplicateMessage,
                        duration: 5,
                        style: { marginTop: '20vh' }
                    });
                    // Fill form with nulls to clear previous stale data
                    form.setFieldsValue({
                        amount: undefined,
                        payment_date: undefined,
                        reference_no: undefined,
                        bank_ref: res.data.bank_ref, // Keep bank_ref for the record
                        bank_name: undefined,
                        note: `BLOCK: ${duplicateMessage}`
                    });
                    return;
                }

                // New: Check if it's a valid slip
                if (res.data.isValidSlip === false) {
                    setState(p => ({ ...p, invalidSlipFound: true, duplicateSlipFound: false }));
                    message.warning({
                        content: res.data.invalidMessage,
                        duration: 7,
                        style: { marginTop: '20vh' }
                    });
                    form.setFieldsValue({
                        amount: undefined,
                        payment_date: undefined,
                        reference_no: undefined,
                        bank_name: undefined,
                        note: `INVALID: Non-slip image detected`
                    });
                    return;
                }

                setState(p => ({ ...p, duplicateSlipFound: false, invalidSlipFound: false }));

                // Auto-fill form
                form.setFieldsValue({
                    amount: amount || undefined,
                    payment_date: date ? dayjs(date) : undefined,
                    reference_no: reference_no,
                    bank_ref: res.data.bank_ref, // Capture unique slip reference
                    bank_name: bank_name,
                    note: description || `Auto-scanned`
                });

                // Auto-select invoice if reference matches
                if (reference_no) {
                    const matchingInv = state.pendingInvoices.find(inv =>
                        inv.invoice_no === reference_no || inv.order_no === reference_no
                    );
                    if (matchingInv) {
                        setState(p => ({
                            ...p,
                            linkedOrderId: matchingInv.id,
                            invoiceStatus: { status: 'success', help: `Auto-linked to Invoice: ${matchingInv.invoice_no}` }
                        }));
                        // Also set the Select component's value via its bound name if we were using it, 
                        // but here we manually manage the value since we don't have 'name' on the Select's Form.Item 
                        // to avoid conflicts with reference_no. Actually, let's just update state.
                    }
                }

                message.success("Slip scanned successfully! Details filled.");
            } else {
                message.warning("Could not read slip details. Please fill manually.");
            }
        } catch (error) {
            console.error("Scan error:", error);
            message.error("Failed to scan slip.");
        } finally {
            setState(p => ({ ...p, scanning: false }));
        }
    };

    // Create a debounced check function that persists across renders
    const debouncedCheck = React.useCallback(
        debounce(async (invoice_no, customerId) => {
            if (!invoice_no) {
                setState(p => ({ ...p, invoiceStatus: { status: '', help: '' }, linkedOrderId: null }));
                return;
            }

            setState(p => ({ ...p, invoiceStatus: { status: 'validating', help: 'Checking...' } }));

            try {
                const res = await request("customer_payment/check_invoice", "post", {
                    customer_id: customerId,
                    invoice_no: invoice_no
                });

                if (res && res.success && res.exists) {
                    setState(p => ({
                        ...p,
                        invoiceStatus: { status: 'success', help: `Invoice Found: Total $${res.order.total_amount}` },
                        linkedOrderId: res.order.id
                    }));

                    form.setFieldsValue({ reference_no: invoice_no });
                    debouncedCheckReference(invoice_no, customerId);
                } else {
                    setState(p => ({
                        ...p,
                        invoiceStatus: { status: 'error', help: 'Invoice does not exist!' },
                        linkedOrderId: null
                    }));
                }
            } catch (error) {
                console.error(error);
                setState(p => ({
                    ...p,
                    invoiceStatus: { status: 'error', help: 'Validation failed' },
                    linkedOrderId: null
                }));
            }
        }, 500),
        []
    );

    const handleCheckInvoice = (invoice_no) => {
        // Immediate UI feedback if empty
        if (!invoice_no) {
            setState(p => ({ ...p, invoiceStatus: { status: '', help: '' }, linkedOrderId: null }));
            debouncedCheck.cancel(); // Cancel any pending checks
            return;
        }

        // Immediate feedback: reset status while typing
        setState(p => ({ ...p, invoiceStatus: { status: 'validating', help: 'Checking...' }, linkedOrderId: null }));

        // Trigger debounced check
        debouncedCheck(invoice_no, state.selectedCustomer);
    };

    // Debounced check for existing Payment Reference
    const debouncedCheckReference = React.useCallback(
        debounce(async (ref_no, customerId) => {
            if (!ref_no) {
                setState(p => ({ ...p, referenceStatus: { status: '', help: '' } }));
                return;
            }

            setState(p => ({ ...p, referenceStatus: { status: 'validating', help: 'Checking...' } }));

            try {
                const res = await request("customer_payment/check_reference", "post", {
                    customer_id: customerId,
                    reference_no: ref_no
                });

                if (res && res.success && res.exists) {
                    setState(p => ({
                        ...p,
                        referenceStatus: { status: 'error', help: 'Payment Reference already exists!' }
                    }));
                } else {
                    setState(p => ({
                        ...p,
                        referenceStatus: { status: 'success', help: 'Reference No available' }
                    }));
                }
            } catch (error) {
                console.error(error);
                setState(p => ({
                    ...p,
                    referenceStatus: { status: 'error', help: 'Validation failed' }
                }));
            }
        }, 500),
        []
    );

    const handleCheckReference = (ref_no) => {
        if (!ref_no) {
            setState(p => ({ ...p, referenceStatus: { status: '', help: '' } }));
            debouncedCheckReference.cancel();
            return;
        }
        // Immediate feedback
        setState(p => ({ ...p, referenceStatus: { status: 'validating', help: 'Checking...' } }));
        debouncedCheckReference(ref_no, state.selectedCustomer);
    };

    const handleCreatePayment = async (values) => {
        if (state.duplicateSlipFound || state.invalidSlipFound) {
            message.error("This payment is blocked. Please provide a valid, unique bank slip.");
            return;
        }
        setState(p => ({ ...p, submitting: true }));
        try {
            const formData = new FormData();
            formData.append("customer_id", state.selectedCustomer);
            formData.append("payment_date", values.payment_date.format('YYYY-MM-DD'));
            formData.append("amount", values.amount);
            formData.append("payment_method", values.payment_method);

            if (state.linkedOrderId) {
                formData.append("order_id", state.linkedOrderId);
            }

            if (values.bank_name) formData.append("bank_name", values.bank_name);
            if (values.reference_no) formData.append("reference_no", values.reference_no);
            if (values.bank_ref) formData.append("bank_ref", values.bank_ref);
            if (values.note) formData.append("note", values.note);

            if (values.slip_image && values.slip_image.file) {
                formData.append("slip_image", values.slip_image.file);
            }

            const res = await request("customer_payment", "post", formData);
            if (res && res.payment_status === 'duplicate') { // Check specifically if backend returns structure for duplicates without throwing 400, OR if axios resolved. 
                // But wait, I set backend to return 400. So verify catch block.
            }

            if (res && res.success) {
                message.success(res.message);
                setState(p => ({ ...p, paymentModalVisible: false, shouldScrollToBottom: true }));
                form.resetFields();
                loadLedger(); // Reload ledger
            } else {
                message.error(res?.message || "Failed to create payment");
            }
        } catch (error) {
            const messageText = error.response?.data?.message || "Failed to create payment";
            message.error(messageText);
        } finally {
            setState(p => ({ ...p, submitting: false }));
        }
    };

    const handleExportExcel = async () => {
        if (!state.selectedCustomer) return;

        const params = new URLSearchParams({
            customer_id: state.selectedCustomer,
            start_date: state.dateRange[0]?.format('YYYY-MM-DD'),
            end_date: state.dateRange[1]?.format('YYYY-MM-DD')
        });

        window.open(`${Config.base_url}customer_payment/export_excel?${params.toString()}`, '_blank');
    };

    // Print functionality
    const handlePrint = () => {
        const printContent = `
            <html>
            <head>
                <title>របាយការណ៍អតិថិជន - Customer Statement</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Khmer+OS+Siemreap&display=swap');
                    body { font-family: 'Khmer OS Siemreap', sans-serif; padding: 20px; color: #333; }
                    .header { text-align: center; margin-bottom: 25px; color: #fff; background: linear-gradient(135deg, #bfa15f 0%, #a3894a 100%); padding: 25px; border-radius: 8px; -webkit-print-color-adjust: exact; print-color-adjust: exact;}
                    .header h2 { margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; }
                    .header p { margin: 10px 0 0 0; opacity: 0.9; }
                    
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; border: 1px solid #eee; padding: 15px; border-radius: 8px; }
                    .info-item { margin-bottom: 5px; }
                    .info-label { font-weight: bold; color: #888; width: 150px; display: inline-block; }

                    .summary-container { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px; }
                    .summary-card { padding: 15px; border: 1px solid #e8e8e8; border-radius: 8px; text-align: center; background-color: #fafafa; -webkit-print-color-adjust: exact; }
                    .summary-card.ending { background-color: #fff1f0; border-color: #ffa39e; }
                    .summary-card .label { font-size: 11px; color: #8c8c8c; display: block; margin-bottom: 5px; }
                    .summary-card .value { font-size: 16px; font-weight: bold; color: #262626; }
                    .summary-card.ending .value { color: #f5222d; }

                    table { width: 100%; border-collapse: collapse; font-size: 11px; table-layout: fixed; }
                    th, td { border: 1px solid #e8e8e8; padding: 10px 8px; overflow: hidden; }
                    th { background-color: #fafafa; font-weight: bold; color: #262626; -webkit-print-color-adjust: exact; }
                    
                    .col-desc { white-space: normal; overflow: visible; font-size: 9px; line-height: 1.2; }
                    .col-qty { text-align: right; white-space: nowrap; }
                    .col-money { text-align: right; white-space: nowrap; }
                    
                    .text-right { text-align: right; }
                    .text-center { text-align: center; }
                    .text-bold { font-weight: bold; }
                    
                    .footer { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 100px; padding: 0 50px; }
                    .signature-box { text-align: center; }
                    .signature-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 10px; }
                    
                    @media print {
                        body { padding: 0; }
                        @page { margin: 1cm; size: A4; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>របាយការណ៍សង្ខេបគណនីអតិថិជន</h2>
                    <h2>Customer Account Statement</h2>
                    <p>កាលបរិច្ឆេទ (Period): ${state.dateRange[0].format('DD/MM/YYYY')} - ${state.dateRange[1].format('DD/MM/YYYY')}</p>
                </div>
                
                <div class="info-grid">
                    <div>
                        <div class="info-item"><span class="info-label">អតិថិជន (Customer):</span> <strong>${state.customer.name || '-'}</strong></div>
                        <div class="info-item"><span class="info-label">ទូរស័ព្ទ (Phone):</span> ${state.customer.tel || '-'}</div>
                    </div>
                    <div>
                         <div class="info-item"><span class="info-label">អាសយដ្ឋាន (Address):</span> ${state.customer.address || '-'}</div>
                         <div class="info-item"><span class="info-label">ផ្នែក (Category):</span> ${state.customer.category_name || 'General'}</div>
                    </div>
                </div>

                <div class="summary-container">
                    <div class="summary-card">
                        <span class="label">សមតុល្យដើមគ្រា<br>Beginning Balance</span>
                        <span class="value">${formatPrice(state.summary.beginning_balance)}</span>
                    </div>
                    <div class="summary-card">
                        <span class="label">កំណើនគណនី<br>Total Purchases</span>
                        <span class="value">${formatPrice(state.summary.increase)}</span>
                    </div>
                    <div class="summary-card">
                        <span class="label">បានបង់សរុប<br>Total Payments</span>
                        <span class="value">(${formatPrice(state.summary.total_payments)})</span>
                    </div>
                    <div class="summary-card ending">
                        <span class="label">សមតុល្យត្រូវបង់<br>Ending Balance</span>
                        <span class="value">${formatPrice(state.summary.ending_balance)}</span>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th width="70">Date</th>
                            <th width="80">Ref</th>
                            <th width="160">Items / Details</th>
                            <th width="50">Extra (L)</th>
                            <th width="50">Gas (L)</th>
                            <th width="50">Diesel (L)</th>
                            <th width="75">Total ($)</th>
                            <th width="75">Paid ($)</th>
                            <th width="75">Inv. Bal</th>
                            <th width="85">Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.ledger.map(item => `
                            <tr>
                                <td class="text-center">${dayjs(item.transaction_date).format('DD/MM/YY')}</td>
                                <td class="text-center" style="color: #1890ff; font-size: 10px;">${item.reference_no || item.reference || '-'}</td>
                                <td class="col-desc">
                                    <strong>${item.description || item.transaction_type || '-'}</strong>
                                    ${item.note && item.note !== 'undefined' && item.note !== '' ? `<div style="color: #666; font-style: italic; margin-top: 2px;">${item.note}</div>` : ''}
                                </td>
                                <td class="col-qty">${item.fuel_extra > 0 ? Number(item.fuel_extra).toLocaleString() : '-'}</td>
                                <td class="col-qty">${item.fuel_gas > 0 ? Number(item.fuel_gas).toLocaleString() : '-'}</td>
                                <td class="col-qty">${item.fuel_diesel > 0 ? Number(item.fuel_diesel).toLocaleString() : '-'}</td>
                                <td class="col-money">${item.debit > 0 ? formatPrice(item.debit) : '-'}</td>
                                <td class="col-money">${item.credit > 0 ? formatPrice(item.credit) : (item.paid_amount > 0 ? formatPrice(item.paid_amount) : '-')}</td>
                                <td class="col-money" style="color: #faad14;">${item.remaining_balance > 0 ? formatPrice(item.remaining_balance) : '-'}</td>
                                <td class="col-money text-bold">${formatPrice(item.running_balance)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                         <tr style="background-color: #fafafa; font-weight: bold; border-top: 2px solid #ddd;">
                            <td colspan="9" class="text-right">សមតុល្យចុងគ្រា (Ending Balance Account):</td>
                            <td class="text-right" style="color: #f5222d; font-size: 13px;">${formatPrice(state.summary.ending_balance)}</td>
                        </tr>
                    </tfoot>
                </table>

                <div class="footer">
                    <div class="signature-box">
                        <p>ហត្ថលេខាអតិថិជន (Customer Signature)</p>
                        <div class="signature-line">កាលបរិច្ឆេទ: ...... / ...... / ......</div>
                    </div>
                    <div class="signature-box">
                        <p>ហត្ថលេខាអ្នករៀបចំ (Prepared By)</p>
                        <div class="signature-line">កាលបរិច្ឆេទ: ...... / ...... / ......</div>
                    </div>
                </div>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();

        // Wait for images if any or fonts
        setTimeout(() => {
            printWindow.print();
        }, 500);
    };


    const handleDeletePayment = async (id) => {
        const res = await request(`customer_payment/${id}`, "delete");
        if (res && res.success) {
            message.success(res.message);
            loadLedger();
        } else {
            message.error(res?.message || "Failed to delete payment");
        }
    };

    const columns = [
        {
            title: 'ថ្ងៃ ខែ ឆ្នាំ (Date)',
            dataIndex: 'transaction_date',
            key: 'transaction_date',
            render: (text) => dayjs(text).format("DD-MM-YY"),
            width: 100,
            align: 'center',
            fixed: 'left'
        },
        {
            title: 'លេខយោង (Ref)',
            dataIndex: 'reference',
            key: 'ref_no',
            width: 120,
            align: 'center',
            render: (text) => <Tag color="blue">{text || '-'}</Tag>
        },
        {
            title: 'អធិប្បាយ (Description)',
            dataIndex: 'description',
            key: 'desc',
            width: 220,
            render: (text, record) => (
                <div style={{ whiteSpace: 'normal', wordBreak: 'break-word', fontSize: '11px' }}>
                    <Text strong>{record.description || record.transaction_type}</Text>
                    {record.note && record.note !== 'undefined' && record.note !== '' && (
                        <div style={{ color: '#888', fontStyle: 'italic', marginTop: '2px' }}>
                            {record.note}
                        </div>
                    )}
                </div>
            )
        },
        {
            title: 'កំណើនក្នុងគ្រា (Increase during the period)',
            children: [
                {
                    title: 'Extra (L)',
                    dataIndex: 'fuel_extra',
                    key: 'qty_extra',
                    width: 90,
                    align: 'right',
                    render: (val) => val > 0 ? val.toLocaleString() : '-'
                },
                {
                    title: 'Gas (L)',
                    dataIndex: 'fuel_gas',
                    key: 'qty_gas',
                    width: 90,
                    align: 'right',
                    render: (val) => val > 0 ? val.toLocaleString() : '-'
                },
                {
                    title: 'Diesel (L)',
                    dataIndex: 'fuel_diesel',
                    key: 'qty_diesel',
                    width: 90,
                    align: 'right',
                    render: (val) => val > 0 ? val.toLocaleString() : '-'
                },
                {
                    title: 'Dollar',
                    dataIndex: 'debit',
                    key: 'inc_usd',
                    width: 100,
                    align: 'right',
                    render: (val, record) => record.transaction_type === 'order' && val > 0 ? formatPrice(val) : ''
                },
                {
                    title: 'Riel',
                    key: 'inc_riel',
                    width: 110,
                    align: 'right',
                    render: (_, record) => record.transaction_type === 'order' && record.debit > 0 ? `៛${(record.debit * state.exchangeRate).toLocaleString()}` : ''
                }
            ]
        },
        {
            title: 'សងក្នុងគ្រា (Payments during the period)',
            children: [
                {
                    title: 'លេខប័ណ្ណ (Ref)',
                    key: 'pay_ref',
                    width: 150,
                    align: 'left',
                    render: (_, record) => record.transaction_type.startsWith('Payment') ?
                        <Space direction="vertical" size={0}>
                            <Text strong style={{ fontSize: '12px' }}>{record.bank_name || record.payment_method}</Text>
                            {(record.manual_ref || record.bank_ref) && (
                                <Text type="secondary" style={{ fontSize: '11px' }}>
                                    {record.manual_ref && `Ref: ${record.manual_ref}`}
                                    {record.manual_ref && record.bank_ref && " | "}
                                    {record.bank_ref && `Slip: ${record.bank_ref}`}
                                </Text>
                            )}
                        </Space>
                        : '-'
                },
                {
                    title: 'Dollar',
                    dataIndex: 'credit',
                    key: 'pay_usd',
                    width: 100,
                    align: 'right',
                    render: (val, record) => record.transaction_type.startsWith('Payment') && val > 0 ? `$${formatPrice(val)}` : ''
                },
                {
                    title: 'Riel',
                    key: 'pay_riel',
                    width: 110,
                    align: 'right',
                    render: (_, record) => record.transaction_type.startsWith('Payment') && record.credit > 0 ? `៛${(record.credit * state.exchangeRate).toLocaleString()}` : '-'
                }
            ]
        },
        {
            title: 'សមតុល្យ (Balance)',
            children: [
                {
                    title: 'Paid ($)',
                    dataIndex: 'paid_amount',
                    key: 'paid_usd',
                    width: 90,
                    align: 'right',
                    render: (val, record) => record.transaction_type === 'order' && val > 0 ? formatPrice(val) : ''
                },
                {
                    title: 'Inv. Bal ($)',
                    dataIndex: 'remaining_balance',
                    key: 'inv_bal',
                    width: 100,
                    align: 'right',
                    render: (val, record) => record.transaction_type === 'order' ?
                        <Text strong style={{ color: val > 0 ? '#faad14' : '#52c41a' }}>{formatPrice(val)}</Text> : ''
                },
                {
                    title: 'Account ($)',
                    dataIndex: 'running_balance',
                    key: 'acc_bal',
                    width: 100,
                    align: 'right',
                    render: (val) => <Text strong style={{ color: val >= 0 ? '#ff4d4f' : '#52c41a' }}>{formatPrice(val)}</Text>
                },
                {
                    title: 'Account (៛)',
                    key: 'bal_riel',
                    width: 120,
                    align: 'right',
                    render: (_, record) => <Text type="secondary" style={{ fontSize: '11px' }}>៛{(record.running_balance * state.exchangeRate).toLocaleString()}</Text>
                }
            ]
        },
        {
            title: 'Action',
            key: 'action',
            width: 80,
            align: 'center',
            render: (_, record) => record.transaction_type.startsWith('Payment') ? (
                <Space>
                    <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => setState(p => ({ ...p, detailModalVisible: true, selectedPayment: record }))} />
                    <Popconfirm
                        title="Delete this payment?"
                        onConfirm={() => handleDeletePayment(record.original_id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button size="small" type="link" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ) : null
        }
    ];

    return (
        <MainPage loading={state.loading}>
            <style>{getTableStyles(isDarkMode)}</style>

            <Card style={{ marginBottom: 16, background: isDarkMode ? '#141414' : '#fff', border: isDarkMode ? '1px solid #303030' : undefined, borderRadius: '16px', boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.05)' }}>
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} md={12}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {state.selectedCustomer && (
                                <Button
                                    icon={<ArrowUpOutlined rotate={-90} />}
                                    onClick={() => setState(p => ({ ...p, selectedCustomer: null, ledger: [], summary: { beginning_balance: 0, increase: 0, total_payments: 0, ending_balance: 0 } }))}
                                >
                                    Back
                                </Button>
                            )}
                            <Select
                                showSearch
                                style={{ width: 250 }}
                                placeholder="Select Customer to View Ledger"
                                value={state.selectedCustomer}
                                onChange={(val) => setState(p => ({ ...p, selectedCustomer: val }))}
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                            >
                                {state.customers.map(c => (
                                    <Option key={c.id} value={c.id} label={`${c.name} (${c.tel})`}>
                                        {c.name} ({c.tel})
                                    </Option>
                                ))}
                            </Select>
                            {!state.selectedCustomer && (
                                <Select
                                    style={{ width: 150 }}
                                    placeholder="Filter Branch"
                                    value={state.branchFilter}
                                    allowClear
                                    onChange={(val) => {
                                        setState(p => ({ ...p, branchFilter: val }));
                                        loadDebtors(val);
                                    }}
                                >
                                    {state.branches.map(b => (
                                        <Option key={b} value={b}>{b}</Option>
                                    ))}
                                </Select>
                            )}
                            {state.selectedCustomer && (
                                <RangePicker
                                    value={state.dateRange}
                                    onChange={(val) => setState(p => ({ ...p, dateRange: val }))}
                                    format="DD/MM/YYYY"
                                />
                            )}
                        </div>
                    </Col>
                    <Col xs={24} md={4}>
                        {state.selectedCustomer && (
                            <div style={{ display: 'flex', alignItems: 'center', color: isDarkMode ? '#d9d9d9' : '#1a1a1a' }}>
                                <span style={{ marginRight: 8 }}>Rate:</span>
                                <InputNumber
                                    value={state.exchangeRate}
                                    onChange={(val) => setState(p => ({ ...p, exchangeRate: val }))}
                                    style={{ width: 100, backgroundColor: isDarkMode ? '#1f1f1f' : '#fff', color: isDarkMode ? '#fff' : '#000', borderColor: isDarkMode ? '#444' : '#d9d9d9' }}
                                />
                            </div>
                        )}
                    </Col>
                    <Col xs={24} md={8} style={{ textAlign: 'right' }}>
                        <Space>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => {
                                    if (!state.selectedCustomer) {
                                        message.warning("Please select a customer first to create payment.");
                                        return;
                                    }
                                    setState(p => ({ ...p, paymentModalVisible: true }));
                                    loadPendingInvoices(state.selectedCustomer);
                                }}
                                disabled={!state.selectedCustomer}
                            >
                                New Payment
                            </Button>
                            <Button
                                icon={<DownloadOutlined />}
                                onClick={handleExportExcel}
                                disabled={!state.selectedCustomer}
                            >
                                Export
                            </Button>
                            <Button
                                icon={<PrinterOutlined />}
                                onClick={handlePrint}
                                disabled={!state.selectedCustomer}
                            >
                                Print
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {!state.selectedCustomer ? (
                // Debtor List Table
                <Card style={{ background: isDarkMode ? '#141414' : '#fff', border: isDarkMode ? '1px solid #303030' : undefined, borderRadius: '16px' }}>
                    <div style={{ marginBottom: 16 }}>
                        <Title level={4} style={{ color: isDarkMode ? '#d9d9d9' : '#1a1a1a', margin: 0 }}>Outstanding Debtors</Title>
                    </div>
                    <Table
                        dataSource={state.debtors}
                        rowKey="customer_id"
                        pagination={{ pageSize: 10 }}
                        style={{ border: isDarkMode ? '1px solid #303030' : '1px solid #d4d4d4' }}
                        columns={[
                            {
                                title: 'No',
                                key: 'index',
                                width: 60,
                                align: 'center',
                                render: (_, __, index) => index + 1
                            },
                            {
                                title: 'Customer',
                                dataIndex: 'customer_name',
                                key: 'customer_name',
                                render: (text, record) => (
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{text}</div>
                                        <div style={{ fontSize: '12px', color: '#888' }}>{record.customer_tel}</div>
                                    </div>
                                )
                            },
                            {
                                title: 'Address',
                                dataIndex: 'address',
                                key: 'address',
                                ellipsis: true
                            },
                            {
                                title: 'Branch',
                                dataIndex: 'branch_name',
                                key: 'branch_name',
                                width: 100
                            },
                            {
                                title: 'Overdue (Days)',
                                dataIndex: 'days_overdue',
                                key: 'days_overdue',
                                align: 'center',
                                width: 120,
                                render: (days) => (
                                    <Tag color={days > 30 ? 'red' : days > 15 ? 'orange' : 'green'}>
                                        {days} Days
                                    </Tag>
                                )
                            },
                            {
                                title: 'Unpaid Invoices',
                                dataIndex: 'unpaid_invoices_count',
                                key: 'unpaid_invoices_count',
                                align: 'center',
                                width: 120
                            },
                            {
                                title: 'Total Debt',
                                dataIndex: 'total_debt',
                                key: 'total_debt',
                                align: 'right',
                                width: 150,
                                render: (val, record) => (
                                    <div title={`Billed: $${formatPrice(record.total_order_amount || 0)} | Paid: $${formatPrice(record.total_payment_amount || 0)}`}>
                                        <Text strong type="danger">${formatPrice(val)}</Text>
                                        <div style={{ fontSize: '10px', color: '#888' }}>
                                            Bill: ${formatPrice(record.total_order_amount || 0)}
                                        </div>
                                    </div>
                                )
                            },
                            {
                                title: 'Seller / Admin',
                                dataIndex: 'seller_name',
                                key: 'seller_name',
                                render: (text, record) => (
                                    <div>
                                        <div>{text || '-'}</div>
                                        {record.seller_tel && (
                                            <a href={`tel:${record.seller_tel}`} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <PhoneOutlined /> {record.seller_tel}
                                            </a>
                                        )}
                                    </div>
                                )
                            },
                            {
                                title: 'Action',
                                key: 'action',
                                align: 'center',
                                width: 100,
                                render: (_, record) => (
                                    <Button
                                        type="primary"
                                        size="small"
                                        onClick={() => setState(p => ({ ...p, selectedCustomer: record.customer_id }))}
                                    >
                                        View
                                    </Button>
                                )
                            }
                        ]}
                    />
                </Card>
            ) : (
                <>
                    <Table
                        className="ledger-table"
                        columns={columns}
                        dataSource={state.ledger}
                        rowKey="original_id" // Use original_id (p-ID or o-ID)
                        pagination={false}
                        scroll={{ x: 'max-content', y: 600 }}
                        style={{ border: isDarkMode ? '1px solid #303030' : '1px solid #d4d4d4' }}
                        summary={() => (
                            <Table.Summary fixed>
                                <Table.Summary.Row style={{ backgroundColor: isDarkMode ? '#1f1f1f' : '#f5f5f5' }}>
                                    <Table.Summary.Cell index={0} colSpan={12} style={{ textAlign: 'right', color: isDarkMode ? '#d9d9d9' : '#1a1a1a' }}>Current Ending Balance (សមតុល្យចុងគ្រា):</Table.Summary.Cell>
                                    <Table.Summary.Cell index={1} align="right" style={{ color: isDarkMode ? '#d9d9d9' : '#1a1a1a' }}>
                                        <Text strong style={{ color: '#ff4d4f', fontSize: '15px' }}>{formatPrice(state.summary.ending_balance)}</Text>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={2} align="right" style={{ color: isDarkMode ? '#d9d9d9' : '#1a1a1a' }}>
                                        <Text strong style={{ color: '#ff4d4f', fontSize: '14px' }}>៛{(state.summary.ending_balance * state.exchangeRate).toLocaleString()}</Text>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={3}></Table.Summary.Cell>
                                </Table.Summary.Row>
                            </Table.Summary>
                        )}
                    />

                    {/* Redesigned Summary Section */}
                    <Card style={{ marginTop: 20, background: isDarkMode ? '#141414' : '#fff', border: isDarkMode ? '1px solid #303030' : '1px solid #d9d9d9', borderRadius: '16px', boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.05)' }}>
                        <Row gutter={[32, 16]} align="top">
                            <Col xs={24} md={14}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 1.5fr', gap: '8px' }}>
                                    <Text style={{ color: isDarkMode ? '#aaa' : '#666' }}>- Beginning Balance (សមតុល្យដើមគ្រា) :</Text>
                                    <Text strong style={{ color: isDarkMode ? '#fff' : '#000', textAlign: 'right' }}>{formatPrice(state.summary.beginning_balance)}</Text>

                                    <Text style={{ color: isDarkMode ? '#aaa' : '#666' }}>- Increase (កំណើនក្នុងគ្រា) [{state.summary.increase_count}] :</Text>
                                    <Text strong style={{ color: isDarkMode ? '#fff' : '#000', textAlign: 'right' }}>{formatPrice(state.summary.increase)}</Text>

                                    <Text style={{ color: isDarkMode ? '#aaa' : '#666' }}>- Payments (សងក្នុងគ្រា) [{state.summary.payment_count}] :</Text>
                                    <Text strong style={{ color: '#52c41a', textAlign: 'right' }}>({formatPrice(state.summary.total_payments)})</Text>

                                    <div style={{ margin: '8px 0', gridColumn: 'span 2', borderTop: isDarkMode ? '1px solid #333' : '1px solid #eee' }}></div>

                                    <Text strong style={{ color: isDarkMode ? '#fff' : '#000' }}>Ending Balance (សមតុល្យចុងគ្រា) :</Text>
                                    <Text strong style={{ color: '#ff4d4f', textAlign: 'right', fontSize: '18px' }}>
                                        {formatPrice(state.summary.ending_balance)}
                                    </Text>
                                </div>
                            </Col>
                            <Col xs={24} md={10} style={{ borderLeft: isDarkMode ? '1px solid #333' : '1px solid #eee', paddingLeft: '32px' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <Text type="secondary" style={{ display: 'block', marginBottom: 10, color: isDarkMode ? '#aaa' : '#888' }}>Comparison with last transactions</Text>
                                    <div style={{
                                        color: state.summary.comparison >= 0 ? '#ff4d4f' : '#52c41a',
                                        fontSize: '24px',
                                        fontWeight: 'bold',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}>
                                        {state.summary.comparison >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                                        {formatPrice(Math.abs(state.summary.comparison))}
                                    </div>
                                    <Text style={{ color: state.summary.comparison >= 0 ? '#ff4d4f' : '#52c41a', fontSize: '12px' }}>
                                        {state.summary.comparison >= 0 ? 'Debt Increased this month' : 'Debt Decreased this month'}
                                    </Text>
                                </div>
                            </Col>
                        </Row>
                    </Card>
                </>
            )
            }

            {/* New Payment Modal */}
            <Modal
                title="New Payment"
                open={state.paymentModalVisible}
                onCancel={() => {
                    setState(p => ({
                        ...p,
                        paymentModalVisible: false,
                        invoiceStatus: { status: '', help: '' },
                        referenceStatus: { status: '', help: '' },
                        linkedOrderId: null,
                        pendingInvoices: [],
                        duplicateSlipFound: false,
                        invalidSlipFound: false
                    }));
                    form.resetFields();
                }}
                destroyOnClose={true} // Ensure form is reset on close/reopen
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreatePayment}
                    initialValues={{
                        payment_date: dayjs(),
                        payment_method: null // Force user to select
                    }}
                >
                    {/* Hidden fields for data not directly in visible inputs */}
                    <Form.Item name="reference_no" hidden><Input /></Form.Item>
                    <Form.Item name="bank_ref" hidden><Input /></Form.Item>

                    <Form.Item
                        name="payment_method"
                        label="Payment Method"
                        rules={[{ required: true }]}
                    >
                        {state.duplicateSlipFound && (
                            <Alert
                                message="Submission Blocked"
                                description="This bank slip has already been used. Please use a unique slip."
                                type="error"
                                showIcon
                                style={{ marginBottom: 16 }}
                            />
                        )}
                        {state.invalidSlipFound && (
                            <Alert
                                message="Invalid Image Detected"
                                description="This image doesn't look like a bank slip. Please upload a clear photo of the transaction."
                                type="warning"
                                showIcon
                                style={{ marginBottom: 16 }}
                            />
                        )}
                        <Select
                            onChange={(val) => {
                                setState(p => ({ ...p, paymentMethod: val }));
                            }}
                            placeholder="Select Payment Method"
                        >
                            <Option value="cash">Cash (សាច់ប្រាក់)</Option>
                            <Option value="debenture">Debenture (ជំពាក់សិន)</Option>
                            <Option value="bank_transfer">Bank Transfer (ផ្ទេរប្រាក់)</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="order_id"
                        label={
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '380px', alignItems: 'center' }}>
                                <span>Invoice No (Ref)</span>
                                <Space>
                                    <Text type="secondary" style={{ fontSize: '11px' }}>Show All</Text>
                                    <input
                                        type="checkbox"
                                        checked={state.showAllInvoices}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            setState(p => ({ ...p, showAllInvoices: checked }));
                                            loadPendingInvoices(state.selectedCustomer, checked);
                                        }}
                                    />
                                </Space>
                            </div>
                        }
                        validateStatus={state.referenceStatus.status || state.invoiceStatus.status}
                        help={state.referenceStatus.help || state.invoiceStatus.help}
                        hasFeedback
                    >
                        <Select
                            showSearch
                            placeholder="Select Invoice"
                            allowClear
                            optionFilterProp="label"
                            onChange={(val) => {
                                if (!val) {
                                    setState(p => ({
                                        ...p,
                                        invoiceStatus: { status: '', help: '' },
                                        referenceStatus: { status: '', help: '' },
                                        linkedOrderId: null
                                    }));
                                    form.setFieldsValue({ reference_no: undefined });
                                    return;
                                }
                                const inv = state.pendingInvoices.find(i => i.id === val);
                                if (inv) {
                                    setState(p => ({
                                        ...p,
                                        invoiceStatus: { status: 'success', help: `Invoice Found: Total $${inv.total_amount}` },
                                        linkedOrderId: inv.id,
                                        selectedInvoice: inv
                                    }));
                                    form.setFieldsValue({ reference_no: inv.invoice_no });
                                    debouncedCheckReference(inv.invoice_no, state.selectedCustomer);
                                }
                            }}
                            onClear={() => {
                                setState(p => ({ ...p, selectedInvoice: null, linkedOrderId: null }));
                            }}
                        >
                            {state.pendingInvoices.map(inv => (
                                <Option key={inv.id} value={inv.id} label={inv.invoice_no}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                        <Text strong>{inv.invoice_no}</Text>
                                        <Text type="secondary" style={{ fontSize: '11px', marginLeft: '10px' }}>
                                            Total: ${formatPrice(inv.total_amount)} | Paid: ${formatPrice(inv.paid_amount)} | <Text type="danger" strong>Owed: ${formatPrice(inv.balance)}</Text>
                                        </Text>
                                    </div>
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) =>
                            prevValues.payment_method !== currentValues.payment_method ||
                            prevValues.amount !== currentValues.amount || // To trigger re-render when amount filled
                            prevValues.slip_image !== currentValues.slip_image
                        }
                    >
                        {({ getFieldValue }) => {
                            const method = getFieldValue('payment_method');
                            const hasAmount = !!getFieldValue('amount');
                            const hasSlip = !!getFieldValue('slip_image'); // Or check fileList

                            // Logic:
                            // Cash: Show Amount, Date, Ref. (Hide Slip, Bank)
                            // Bank: Show Slip, Ref. Hide Amount/Date/Bank UNTIL filled (or force manual?)
                            // Note: User said "After uploading... automatically fill".
                            // I'll show fields if method is Cash OR (Bank AND (hasAmount OR just show them?))
                            // User said: "If it’s Bank Transfer, show only Upload Slip and Reference No."
                            // This implies Amount/Date/Bank are hidden initially.
                            // I will reveal them if `hasAmount` is true (populated by OCR).
                            // What if OCR fails/user wants manual? I'll assume they scan first.

                            const isBank = method === 'bank_transfer';
                            const isCash = method === 'cash' || method === 'debenture';

                            return (
                                <>
                                    {isBank && (
                                        <Form.Item
                                            name="slip_image"
                                            label="Upload Slip"
                                            valuePropName="file"
                                        >
                                            <Upload
                                                beforeUpload={() => false}
                                                maxCount={1}
                                                accept="image/*"
                                                listType="picture"
                                                onChange={(info) => {
                                                    // AntD specific: handle change
                                                    if (info.fileList.length > 0 && info.file.status !== 'removed') {
                                                        // Trigger scan only on new file add
                                                        const fileToScan = info.file.originFileObj || info.file;
                                                        handleScanSlip(fileToScan);
                                                    }
                                                }}
                                                onRemove={() => {
                                                    setState(p => ({ ...p, duplicateSlipFound: false, invalidSlipFound: false }));
                                                    form.setFieldsValue({
                                                        amount: undefined,
                                                        bank_name: undefined,
                                                        note: undefined,
                                                    });
                                                }}
                                            >
                                                <Button icon={<PlusOutlined />} loading={state.scanning}>
                                                    {state.scanning ? 'Scanning...' : 'Click to Upload Slip'}
                                                </Button>
                                            </Upload>
                                        </Form.Item>
                                    )}

                                    {/* Amount, Date: Visible if Cash OR (Bank AND hasAmount) */}
                                    {/* Actually, user said "show ONLY Upload Slip and Ref" for Bank. 
                                        But users need to verify Amount/Date. So I must show them once scanned.
                                        I'll use `hidden` prop or conditional rendering.
                                    */}

                                    {(isCash || (isBank && (hasAmount || hasSlip))) && (
                                        <>
                                            <Form.Item
                                                name="payment_date"
                                                label="Payment Date"
                                                rules={[{ required: true }]}
                                            >
                                                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                                            </Form.Item>

                                            <Form.Item
                                                name="amount"
                                                label={state.selectedInvoice ?
                                                    <span>Amount ($) - <Text type="danger" strong>Balance: {formatPrice(state.selectedInvoice.balance)}</Text></span> :
                                                    "Amount ($)"}
                                                rules={[
                                                    { required: true },
                                                    () => ({
                                                        validator(_, value) {
                                                            if (state.selectedInvoice && value > (parseFloat(state.selectedInvoice.balance) + 0.01)) {
                                                                return Promise.reject(new Error(`Amount exceeds invoice balance (${formatPrice(state.selectedInvoice.balance)})`));
                                                            }
                                                            return Promise.resolve();
                                                        },
                                                    }),
                                                ]}
                                            >
                                                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
                                            </Form.Item>
                                        </>
                                    )}

                                    {/* Bank Name: Valid only for Bank Transfer. 
                                         Show if Bank Transfer AND filled? Or just if Bank Transfer?
                                         User said "show ONLY Upload Slip and Ref". So Bank Name hidden too initially.
                                     */}
                                    {isBank && (hasAmount || hasSlip) && (
                                        <Form.Item
                                            name="bank_name"
                                            label="Bank Name"
                                            rules={[{ required: true, message: 'Please select a bank' }]}
                                        >
                                            <Select placeholder="Select Bank">
                                                <Option value="ABA Bank">ABA Bank</Option>
                                                <Option value="ACLEDA Bank">ACLEDA Bank</Option>
                                                <Option value="Canadia Bank">Canadia Bank</Option>
                                                <Option value="Wing Bank">Wing Bank</Option>
                                                <Option value="True Money">True Money</Option>
                                                <Option value="Pi Pay">Pi Pay</Option>
                                                <Option value="Bakong">Bakong</Option>
                                                <Option value="KHQR Payment">KHQR Payment</Option>
                                            </Select>
                                        </Form.Item>
                                    )}



                                    {/* Note: Hidden for bank_transfer as per strict user request. */}
                                    {method !== 'bank_transfer' && method && (
                                        <Form.Item
                                            name="note"
                                            label="Note"
                                        >
                                            <Input.TextArea />
                                        </Form.Item>
                                    )}
                                </>
                            );
                        }}
                    </Form.Item>

                    <Form.Item>
                        <div style={{ textAlign: 'right' }}>
                            <Button onClick={() => setState(p => ({ ...p, paymentModalVisible: false }))} style={{ marginRight: 8 }}>
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={state.submitting}
                                disabled={state.duplicateSlipFound || state.invalidSlipFound}
                            >
                                {state.duplicateSlipFound ? "BLOCKED: Duplicate Slip" :
                                    state.invalidSlipFound ? "BLOCKED: Invalid Slip" : "Save Payment"}
                            </Button>
                        </div>
                    </Form.Item>
                </Form>
            </Modal>
            {/* Payment Detail Modal */}
            <Modal
                title="Payment Details"
                open={state.detailModalVisible}
                onCancel={() => setState(p => ({ ...p, detailModalVisible: false, selectedPayment: null }))}
                footer={[
                    <Button key="close" onClick={() => setState(p => ({ ...p, detailModalVisible: false, selectedPayment: null }))}>
                        Close
                    </Button>
                ]}
            >
                {state.selectedPayment && (
                    <div style={{ padding: 10 }}>
                        <p><strong>Date:</strong> {dayjs(state.selectedPayment.transaction_date).format("DD/MM/YYYY")}</p>
                        <p><strong>Method:</strong> {state.selectedPayment.payment_method} {state.selectedPayment.bank_name ? `(${state.selectedPayment.bank_name})` : ''}</p>
                        <p><strong>Reference:</strong> {state.selectedPayment.reference || state.selectedPayment.manual_ref || '-'}</p>
                        <p><strong>Amount:</strong> <Text type="success">${formatPrice(state.selectedPayment.credit)}</Text></p>
                        <p><strong>Note:</strong> {state.selectedPayment.note || '-'}</p>

                        {state.selectedPayment.slip_image && (
                            <div style={{ marginTop: 15 }}>
                                <p><strong>Payment Slip:</strong></p>
                                <Image
                                    src={state.selectedPayment.slip_image}
                                    alt="Payment Slip"
                                    width="100%"
                                    style={{ borderRadius: 8, border: '1px solid #ddd' }}
                                />
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </MainPage >
    );
}

export default CustomerPaymentPage;
