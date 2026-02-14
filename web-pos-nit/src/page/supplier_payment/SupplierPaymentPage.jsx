import React, { useEffect, useState } from "react";
import { request, formatPrice, formatRiel } from "../../util/helper";
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
    InputNumber,
    Space,
    Tag,
    Alert,
    Upload,
    Image,
    Descriptions,
    Divider
} from "antd";
import dayjs from "dayjs";
import {
    DownloadOutlined,
    UploadOutlined,
    PrinterOutlined,
    PlusOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    EyeOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import { useTranslation } from "../../locales/TranslationContext";
import * as XLSX from 'xlsx';
import Swal from "sweetalert2";
import { useSettings } from "../../settings";


const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Custom styles for supplier ledger table with Dark Mode support
const tableStyles = `
    /* Aggressive Print Fixes */
    @media print {
        @page { 
            size: landscape; 
            margin: 10mm; 
        }
        html, body { 
            width: 100% !important;
            height: auto !important;
            background: white !important; 
            color: black !important; 
            font-family: 'Kantumruy Pro', sans-serif !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
        }
        .ant-layout-sider, .ant-layout-header, .ant-btn, .ant-picker, .ant-select, .ant-breadcrumb, .no-print, .ant-space, .ant-table-fixed-right, .ant-table-right { 
            display: none !important; 
        }
        .ant-layout, .ant-layout-content { background: white !important; padding: 0 !important; margin: 0 !important; display: block !important; overflow: visible !important; }
        .ant-card { border: none !important; box-shadow: none !important; padding: 0 !important; background: transparent !important; margin: 0 !important; }
        .ant-card-body { padding: 0 !important; }
        
        .supplier-ledger-table { 
            width: 100% !important; 
            table-layout: auto !important;
            margin: 0 !important;
        }
        .ant-table { background: transparent !important; color: black !important; width: 100% !important; }
        .ant-table-container { width: 100% !important; overflow: visible !important; }
        .ant-table-content { overflow: visible !important; }
        .ant-table-body { overflow: visible !important; height: auto !important; }
        .ant-table-wrapper { width: 100% !important; margin: 0 !important; overflow: visible !important; }
        
        /* Ensure headers are visible but NOT sticky in print */
        .ant-table-header { display: block !important; overflow: visible !important; }
        .ant-table-sticky-holder { display: none !important; }
        .ant-table-scroll-horizontal { display: block !important; overflow: visible !important; }
        
        .supplier-ledger-table .ant-table-thead > tr > th { 
            background-color: #f0f0f0 !important; 
            color: black !important; 
            border: 0.5px solid #000 !important;
            font-size: 8px !important;
            padding: 2px 1px !important;
            text-align: center !important;
            font-weight: bold !important;
        }
        .supplier-ledger-table .ant-table-tbody > tr > td { 
            border: 0.5px solid #000 !important;
            font-size: 8.5px !important;
            padding: 2px 4px !important;
            color: black !important;
            word-break: break-all !important;
        }
        
        .summary-print-container {
            break-inside: avoid;
            margin-top: 10px !important;
            border: 1px solid #000 !important;
            padding: 8px !important;
            width: 100% !important;
        }

        .header-banner-print {
            background-color: transparent !important;
            color: black !important;
            border-bottom: 2px solid #000 !important;
            padding: 10px 0 !important;
            margin-bottom: 15px !important;
            text-align: center !important;
            border-radius: 0 !important;
        }
        .header-banner-print h4 { color: black !important; font-size: 16pt !important; margin: 0 0 5px 0 !important; font-weight: bold !important; }
        .header-banner-print span { color: black !important; font-size: 11pt !important; font-weight: normal !important; }
        
        .supplier-ledger-table { border: 1px solid #000 !important; }
        .supplier-ledger-table .ant-table-thead > tr > th { 
            background-color: #d4d4d4 !important; 
            color: black !important; 
            border: 1px solid #000 !important;
            font-size: 9px !important;
            padding: 4px 2px !important;
            text-align: center !important;
            font-weight: bold !important;
        }
        .supplier-ledger-table .ant-table-tbody > tr > td { 
            border: 1px solid #000 !important;
            font-size: 9.5px !important;
            padding: 4px 6px !important;
            color: black !important;
            word-break: break-all !important;
        }
    }

    /* Standard Dark Mode improvements */
    .supplier-ledger-table .ant-table-thead > tr > th {
        background-color: #d4d4d4 !important;
        color: #000000 !important;
        font-weight: bold !important;
        border: 1px solid #e5e7eb !important;
    }

    .dark .ant-card {
        background: rgba(255, 255, 255, 0.03) !important;
        border-color: rgba(255, 215, 0, 0.2) !important;
        backdrop-filter: blur(15px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2) !important;
    }
    
    .dark .ant-table {
        background: transparent !important;
        color: #e2e8f0 !important;
    }

    .dark .supplier-ledger-table .ant-table-thead > tr > th {
        background-color: rgba(30, 41, 59, 1) !important;
        color: #f8fafc !important;
        border-color: rgba(255, 255, 255, 0.1) !important;
    }

    .dark .supplier-ledger-table .ant-table-thead > tr > th .ant-table-column-title {
        color: #f8fafc !important;
    }

    .dark .supplier-ledger-table .ant-table-tbody > tr > td {
        border-color: rgba(255, 255, 255, 0.05) !important;
        color: #cbd5e1 !important;
    }

    .dark .ant-modal-content,
    .dark .ant-modal-header {
        background: rgba(8, 18, 45, 0.7) !important;
        backdrop-filter: blur(25px) !important;
        color: #f8fafc !important;
        border-color: rgba(255, 215, 0, 0.3) !important;
    }

    .dark .ant-modal-title {
        color: #f8fafc !important;
    }

    .dark .ant-form-item-label > label {
        color: #94a3b8 !important;
    }

    .dark .ant-input,
    .dark .ant-select-selector,
    .dark .ant-picker,
    .dark .ant-input-number,
    .dark .ant-input-number-input,
    .dark .ant-input-textarea {
        background: rgba(0, 0, 0, 0.3) !important;
        border-color: rgba(255, 215, 0, 0.3) !important;
        color: #f8fafc !important;
    }

    .dark .ant-input::placeholder {
        color: #64748b !important;
    }

    .dark .ant-typography {
        color: #f8fafc !important;
    }

    .dark .bg-white {
        background-color: rgba(30, 41, 59, 0.4) !important;
    }

    .dark .bg-gray-50 {
        background-color: rgba(15, 23, 42, 0.5) !important;
    }
    
    .dark .ant-alert-warning {
        background: rgba(120, 53, 15, 0.3) !important;
        border-color: rgba(180, 83, 9, 0.4) !important;
    }

    .dark .ant-alert-error {
        background: rgba(127, 29, 29, 0.3) !important;
        border-color: rgba(185, 28, 28, 0.4) !important;
    }

    .dark .ant-alert-message,
    .dark .ant-alert-description {
        color: #f8fafc !important;
    }
    
    .dark .ant-alert-icon {
        color: #f8fafc !important;
    }

    /* Detailed Input overrides to fix the 'White Background' issue */
    .dark .ant-modal .ant-input,
    .dark .ant-modal .ant-select-selector,
    .dark .ant-modal .ant-picker,
    .dark .ant-modal .ant-input-number,
    .dark .ant-modal .ant-input-number-input,
    .dark .ant-modal .ant-input-textarea,
    .dark .ant-modal .ant-select-selection-item {
        background-color: #1e293b !important; /* Solid Slate-800 for visibility */
        background: rgba(30, 41, 59, 0.8) !important;
        border-color: rgba(255, 255, 255, 0.2) !important;
        color: #f8fafc !important;
    }

    /* Target nested elements for Select and InputNumber */
    .dark .ant-modal .ant-select-selection-placeholder {
        color: #94a3b8 !important;
    }
    
    .dark .ant-modal .ant-select-arrow,
    .dark .ant-modal .ant-picker-icon {
        color: #94a3b8 !important;
    }

    .dark .ant-select-dropdown {
        background-color: #0f172a !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
    }
    
    .dark .ant-select-item-option-content {
        color: #cbd5e1 !important;
    }

    .dark .ant-select-item-option-selected {
        background-color: rgba(59, 130, 246, 0.5) !important;
    }

    .dark .ant-picker-panel-container {
        background-color: #0f172a !important;
        background: rgba(15, 23, 42, 0.95) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
    }

    .dark .ant-picker-cell-inner {
        color: #cbd5e1 !important;
    }

    .dark .ant-picker-cell-selected .ant-picker-cell-inner {
        background-color: #3b82f6 !important;
        color: white !important;
    }

    /* Fix for bright white summary section in dark mode */
    .dark .bg-white.dark\\:bg-gray-800 {
        background: rgba(30, 41, 59, 0.4) !important;
        border: 1px solid rgba(255, 255, 255, 0.05) !important;
    }
`;

function SupplierPaymentPage() {
    const { t } = useTranslation();
    const { isDarkMode } = useSettings();

    const [form] = Form.useForm();

    const [state, setState] = useState({
        loading: false,
        suppliers: [],
        selectedSupplier: null,
        ledger: [],
        supplier: {},
        dateRange: [dayjs().startOf('month'), dayjs().endOf('month')],
        paymentModalVisible: false,
        exchangeRate: 4100, // Default USD to KHR rate
        submitting: false,
        duplicateSlipFound: false,
        invalidSlipFound: false,
        summary: {
            beginning_balance: 0,
            increase: 0,
            total_payments: 0,
            ending_balance: 0,
            comparison: 0
        },
        viewModalVisible: false,
        selectedRecord: null,
        slip_image: null, // To store Cloudinary URL from OCR
        unpaidInvoices: []
    });

    useEffect(() => {
        loadSuppliers();
    }, []);

    useEffect(() => {
        if (state.selectedSupplier) {
            loadLedger();
        }
    }, [state.selectedSupplier, state.dateRange]);

    const loadSuppliers = async () => {
        const res = await request("supplier", "get");
        if (res && !res.error) {
            setState(p => ({ ...p, suppliers: res.list || [] }));
        }
    };

    const loadLedger = async () => {
        if (!state.selectedSupplier) return;

        setState(p => ({ ...p, loading: true }));

        const params = {
            supplier_id: state.selectedSupplier,
            start_date: state.dateRange[0]?.format('YYYY-MM-DD'),
            end_date: state.dateRange[1]?.format('YYYY-MM-DD')
        };

        const res = await request("supplier_payment/ledger", "get", params);

        if (res && !res.error) {
            setState(p => ({
                ...p,
                ledger: res.ledger || [],
                summary: res.summary || {},
                supplier: res.supplier || {},
                loading: false
            }));
        } else {
            console.error("Ledger error:", res);
            setState(p => ({ ...p, loading: false }));
        }
    };

    const loadUnpaidInvoices = async () => {
        if (!state.selectedSupplier) return;
        const res = await request(`supplier_payment/unpaid_invoices?supplier_id=${state.selectedSupplier}`, "get");
        if (res && !res.error) {
            setState(p => ({ ...p, unpaidInvoices: res.list || [] }));
        }
    };

    const handleExport = async () => {
        if (!state.selectedSupplier) {
            Swal.fire({
                icon: 'warning',
                title: 'Warning',
                text: 'Please select a supplier',
                confirmButtonText: 'OK'
            });
            return;
        }

        const params = new URLSearchParams({
            supplier_id: state.selectedSupplier,
            start_date: state.dateRange[0]?.format('YYYY-MM-DD'),
            end_date: state.dateRange[1]?.format('YYYY-MM-DD')
        });

        window.open(`/api/supplier_payment/export?${params}`, '_blank');
        Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Export started',
            showConfirmButton: false,
            timer: 1500
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const showPaymentModal = () => {
        form.resetFields();
        loadUnpaidInvoices();
        setState(p => ({
            ...p,
            paymentModalVisible: true,
            duplicateSlipFound: false,
            invalidSlipFound: false,
            scanning: false,
            slip_image: null
        }));
        form.setFieldsValue({ slip_image_url: null });
    };

    const handleScanSlip = async (file) => {
        if (!file) return;

        setState(p => ({ ...p, scanning: true, duplicateSlipFound: false }));
        const formData = new FormData();
        formData.append('image', file);
        formData.append('type', 'supplier'); // Specify type for duplicate check

        try {
            const res = await request("ocr/scan", "post", formData);
            if (res && res.success && res.data) {
                const { amount, date, reference_no, bank_name, description, duplicate, duplicateMessage } = res.data;

                if (duplicate) {
                    setState(p => ({ ...p, duplicateSlipFound: true, invalidSlipFound: false, scanning: false }));
                    Swal.fire({
                        icon: 'error',
                        title: 'Duplicate Slip',
                        text: duplicateMessage,
                        confirmButtonText: 'OK'
                    });
                    // Fill form with nulls to clear previous stale data
                    form.setFieldsValue({
                        amount: undefined,
                        payment_date: undefined,
                        reference_no: undefined,
                        bank_ref: res.data.bank_ref,
                        bank_name: undefined,
                        note: `BLOCK: ${duplicateMessage}`
                    });
                    return;
                }

                // New: Check if it's a valid slip
                if (res.data.isValidSlip === false) {
                    setState(p => ({ ...p, invalidSlipFound: true, duplicateSlipFound: false, scanning: false }));
                    Swal.fire({
                        icon: 'warning',
                        title: 'Invalid Slip',
                        text: res.data.invalidMessage,
                        confirmButtonText: 'OK'
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

                setState(p => ({
                    ...p,
                    duplicateSlipFound: false,
                    invalidSlipFound: false,
                    slip_image: res.data.imagePath // Keep state as backup
                }));

                // Auto-fill form
                form.setFieldsValue({
                    slip_image_url: res.data.imagePath, // CRITICAL: Store in form data
                    amount: amount || undefined,
                    payment_date: date ? dayjs(date) : undefined,
                    reference_no: reference_no,
                    bank_ref: res.data.bank_ref, // Capture unique slip reference
                    bank_name: bank_name,
                    note: description || `Auto-scanned`
                });

                const dateNotice = date ? ` (Date detected: ${date})` : "";
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: `Slip scanned successfully! Details filled.${dateNotice}`,
                    showConfirmButton: false,
                    timer: 1500
                });
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'Warning',
                    text: "Could not read slip details. Please fill manually.",
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            console.error("Scan error:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: "Failed to scan slip.",
                confirmButtonText: 'OK'
            });
        } finally {
            setState(p => ({ ...p, scanning: false }));
        }
    };

    const onClickBtnView = (record) => {
        setState(p => ({
            ...p,
            selectedRecord: record,
            viewModalVisible: true
        }));
    };

    const onClickBtnDelete = (record) => {
        const typeLabel = record.transaction_type === 'purchase' ? 'Invoice' : 'Payment';

        Swal.fire({
            title: `Delete ${typeLabel}?`,
            text: `Are you sure you want to delete this ${record.transaction_type}? This will adjust the ledger balance.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                const realId = record.id.split('-')[1]; // Extract numeric ID from pur-123 or pay-456
                const url = record.transaction_type === 'purchase'
                    ? `purchase/${realId}`
                    : `supplier_payment/${realId}`;

                const res = await request(url, "delete");
                if (res && !res.error) {
                    Swal.fire({
                        title: 'Deleted!',
                        text: `${typeLabel} has been deleted.`,
                        icon: 'success',
                        showConfirmButton: false,
                        timer: 1500
                    });
                    loadLedger();
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: res.message || `Failed to delete ${record.transaction_type}`,
                        confirmButtonText: 'OK'
                    });
                }
            }
        });
    };

    const handlePaymentSubmit = async (values) => {
        if (state.duplicateSlipFound || state.invalidSlipFound) {
            Swal.fire({
                icon: 'error',
                title: 'Blocked',
                text: "This payment is blocked. Please provide a valid, unique bank slip.",
                confirmButtonText: 'OK'
            });
            return;
        }
        setState(p => ({ ...p, submitting: true })); // Start submitting, keep modal open

        try {
            const paymentData = {
                supplier_id: state.selectedSupplier,
                payment_date: values.payment_date.format('YYYY-MM-DD HH:mm:ss'),
                amount: values.amount,
                payment_method: values.payment_method || 'bank_transfer',
                reference_no: values.reference_no,
                bank_ref: values.bank_ref, // Include unique slip ref
                bank_name: values.bank_name,
                slip_image: values.slip_image_url || state.slip_image, // Use form value or state backup
                note: values.note,
                purchase_id: values.purchase_id || null
            };

            const res = await request("supplier_payment", "post", paymentData);

            if (res && !res.error) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Payment recorded successfully',
                    showConfirmButton: false,
                    timer: 1500
                });
                setState(p => ({ ...p, paymentModalVisible: false, slip_image: null })); // Close and clear
                loadLedger();
                form.resetFields();
                form.setFieldsValue({ slip_image_url: null }); // Explicit clear
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: res.message || "Failed to record payment",
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            const messageText = error.response?.data?.message || "Failed to record payment";
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: messageText,
                confirmButtonText: 'OK'
            });
        } finally {
            setState(p => ({ ...p, submitting: false })); // Stop loading
        }
    };

    // Group ledger by date for better presentation
    const groupedLedger = state.ledger.reduce((acc, item) => {
        const date = dayjs(item.transaction_date).format('DD-MM-YY');
        if (!acc[date]) acc[date] = [];
        acc[date].push(item);
        return acc;
    }, {});

    // Calculate fuel totals from ledger
    const calculateFuelTotals = () => {
        let gasolineQty = 0, gasolineAmount = 0;
        let dieselQty = 0, dieselAmount = 0;

        state.ledger.filter(l => l.transaction_type === 'purchase').forEach(purchase => {
            try {
                const items = purchase.items ? (typeof purchase.items === 'string' ? JSON.parse(purchase.items) : purchase.items) : [];
                items.forEach(item => {
                    const name = (item.product_name || item.name || '').toLowerCase();
                    const qty = parseFloat(item.quantity || item.qty || 0);
                    const amount = parseFloat(item.total || item.amount || (qty * parseFloat(item.unit_price || item.price || 0)));

                    if (name.includes('gasoline') || name.includes('extra') || name.includes('super') || name.includes('95') || name.includes('92') || name.includes('សាំង') || name.includes('benzine')) {
                        gasolineQty += qty;
                        gasolineAmount += amount;
                    } else if (name.includes('diesel') || name.includes('euro') || name.includes('ម៉ាស៊ូត') || name.includes('dầu')) {
                        dieselQty += qty;
                        dieselAmount += amount;
                    } else if (name.includes('ហ្គា') || name.includes('ហ្កា') || name.includes('lpg') || name.includes('gas')) {
                        // For future use if gas totals are needed
                    }
                });
            } catch (e) {
                console.error('Error calculating fuel totals:', e);
            }
        });

        return { gasolineQty, gasolineAmount, dieselQty, dieselAmount };
    };

    const fuelTotals = calculateFuelTotals();

    // ✅ Refactor ledger data to split multi-product purchases into separate rows
    const processedLedger = React.useMemo(() => {
        let currentBalance = parseFloat(state.summary.beginning_balance || 0);
        const result = [];

        state.ledger.forEach((entry, entryIdx) => {
            if (entry.transaction_type === 'purchase') {
                let items = [];
                try {
                    items = entry.items ? (typeof entry.items === 'string' ? JSON.parse(entry.items) : entry.items) : [];
                } catch (e) {
                    console.error("Error parsing items", e);
                }

                if (items.length > 0) {
                    items.forEach((item, itemIdx) => {
                        const name = (item.product_name || item.name || '').toLowerCase();
                        const qty = parseFloat(item.quantity || item.qty || 0);
                        const unitPrice = parseFloat(item.unit_price || item.price || 0);
                        const itemTotal = parseFloat(item.total || item.amount || (qty * unitPrice));

                        // Determine fuel type column
                        let fuel_extra = 0, fuel_regular = 0, fuel_gas = 0, fuel_diesel = 0;
                        if (name.includes('extra') || name.includes('super') || name.includes('95') || name.includes('ស៊ុបពែរ')) {
                            fuel_extra = qty;
                        } else if (name.includes('gasoline') || name.includes('regular') || name.includes('92') || name.includes('សាំង') || name.includes('benzine')) {
                            fuel_regular = qty;
                        } else if (name.includes('diesel') || name.includes('euro') || name.includes('ម៉ាស៊ូត') || name.includes('dầu')) {
                            fuel_diesel = qty;
                        } else if (name.includes('ហ្គា') || name.includes('ហ្កា') || name.includes('lpg') || name.includes('gas')) {
                            fuel_gas = qty;
                        }

                        // Update running balance locally
                        currentBalance += itemTotal;

                        result.push({
                            ...entry,
                            id: `${entry.id}-${itemIdx}`, // Unique ID for table row
                            note: items.length > 1 ? `${entry.note || 'Purchase'} (${item.product_name || item.name})` : (entry.note || 'Purchase'),
                            fuel_extra,
                            fuel_regular,
                            fuel_gas,
                            fuel_diesel,
                            unit_price_specific: unitPrice,
                            debit: itemTotal,
                            running_balance: currentBalance
                        });
                    });
                } else {
                    // Fallback if no items but have debit
                    currentBalance += parseFloat(entry.debit || 0);
                    result.push({
                        ...entry,
                        running_balance: currentBalance
                    });
                }
            } else {
                // Payment
                currentBalance -= parseFloat(entry.credit || 0);
                result.push({
                    ...entry,
                    running_balance: currentBalance
                });
            }
        });

        return result;
    }, [state.ledger, state.summary.beginning_balance]);

    const columns = [
        {
            title: "ថ្ងៃ ខែ ឆ្នាំ",
            dataIndex: "transaction_date",
            key: "date",
            width: 80,
            render: (val) => dayjs(val).format("DD-MM-YY")
        },
        {
            title: "លេខវិក្កយបត្រ",
            dataIndex: "order_no",
            key: "order_no",
            width: 'auto',
            render: (val) => val ? <span style={{ whiteSpace: 'nowrap' }}>{val}</span> : ''
        },
        {
            title: "អធិប្បាយ",
            dataIndex: "note",
            key: "note",
            width: 140,
            render: (val, record) => {
                if (record.transaction_type === 'purchase' && (!val || val === 'Purchase')) return '';
                if (!val) return 'ទូទាត់ប្រាក់';
                // Remove common English terms and any Latin letters/symbols that aren't necessary
                let cleanVal = val.replace(/Purchase/gi, 'ទិញ')
                    .replace(/Payment/gi, 'បង់ប្រាក់')
                    .replace(/[A-Za-z]/g, '') // Remove all other English letters
                    .replace(/[-_]/g, ' ') // Replace underscores/hyphens with space
                    .replace(/\/\//g, '/') // Cleanup double slashes
                    .replace(/\(\//g, '(') // Cleanup (/
                    .replace(/\/+\)/g, ')') // Cleanup /)
                    .replace(/[\/\s]+[\)]/g, ')') // Cleanup / )
                    .replace(/\s+/g, ' ') // Cleanup spaces
                    .trim();

                // If it ends up empty, use default
                return cleanVal;
            }
        },
        {
            title: "ទិញបន្ថែមក្នុងគ្រា",
            children: [
                {
                    title: "សាំងស៊ុបពែរ",
                    width: 'auto',
                    dataIndex: "fuel_extra",
                    align: 'left',
                    render: (val) => val > 0 ? <span style={{ whiteSpace: 'nowrap' }}>{val.toLocaleString()}</span> : '-'
                },
                {
                    title: "សាំងធម្មតា",
                    width: 'auto',
                    dataIndex: "fuel_regular",
                    align: 'left',
                    render: (val) => val > 0 ? <span style={{ whiteSpace: 'nowrap' }}>{val.toLocaleString()}</span> : '-'
                },
                {
                    title: "ម៉ាស៊ូត",
                    width: 'auto',
                    dataIndex: "fuel_diesel",
                    align: 'left',
                    render: (val) => val > 0 ? <span style={{ whiteSpace: 'nowrap' }}>{val.toLocaleString()}</span> : '-'
                },
                {
                    title: "ហ្គាស",
                    width: 'auto',
                    dataIndex: "fuel_gas",
                    align: 'left',
                    render: (val) => val > 0 ? <span style={{ whiteSpace: 'nowrap' }}>{val.toLocaleString()}</span> : '-'
                }
            ]
        },
        {
            title: "តម្លៃឯកតា",
            key: "unit_price",
            width: 'auto',
            align: 'left',
            render: (_, record) => {
                if (record.transaction_type !== 'purchase') return '';
                const price = record.unit_price_specific || 0;
                return price > 0 ? <span style={{ whiteSpace: 'nowrap' }}>{formatPrice(price)}</span> : '-';
            }
        },
        {
            title: "ទឹកប្រាក់សរុប",
            children: [
                {
                    title: "ដុល្លារ ($)",
                    dataIndex: "debit",
                    key: "dollar_debit",
                    width: 'auto',
                    align: 'left',
                    render: (val, record) => record.transaction_type === 'purchase' ? <span style={{ whiteSpace: 'nowrap' }}>{formatPrice(val)}</span> : ''
                },
                {
                    title: "រៀល (KH)",
                    width: 'auto',
                    align: 'left',
                    render: (_, record) => {
                        if (record.transaction_type !== 'purchase') return '';
                        const rielAmount = parseFloat(record.debit || 0) * state.exchangeRate;
                        return <span style={{ whiteSpace: 'nowrap' }}>{formatRiel(rielAmount)}</span>;
                    }
                }
            ]
        },
        {
            title: "សងក្នុងគ្រា",
            children: [
                {
                    title: <span style={{ whiteSpace: 'nowrap' }}>លេខប័ណ្ណ/យោង</span>,
                    dataIndex: "reference_no",
                    key: "ref",
                    width: 'auto',
                    render: (val, record) => {
                        if (record.transaction_type !== 'payment') return '';
                        return (
                            <div style={{ lineHeight: '1.2', whiteSpace: 'nowrap' }}>
                                {record.order_no && <div style={{ fontWeight: '600', color: '#1890ff' }}>{record.order_no}</div>}
                                {val && <div style={{ fontSize: '10px', opacity: 0.8 }}>{val}</div>}
                            </div>
                        );
                    }
                },
                {
                    title: "ដុល្លារ ($)",
                    dataIndex: "credit",
                    key: "dollar_credit",
                    width: 'auto',
                    align: 'left',
                    render: (val, record) => record.transaction_type === 'payment' ? <span style={{ whiteSpace: 'nowrap' }}>{formatPrice(val)}</span> : ''
                },
                {
                    title: "រៀល (KH)",
                    width: 'auto',
                    align: 'left',
                    render: (_, record) => {
                        if (record.transaction_type !== 'payment') return '';
                        const rielAmount = parseFloat(record.credit || 0) * state.exchangeRate;
                        return <span style={{ whiteSpace: 'nowrap' }}>{formatRiel(rielAmount)}</span>;
                    }
                }
            ]
        },
        {
            title: "សមតុល្យចុងគ្រា",
            children: [
                {
                    title: "ដុល្លារ ($)",
                    dataIndex: "running_balance",
                    key: "balance",
                    width: 'auto',
                    align: 'left',
                    render: (val) => (
                        <Text style={{ color: val > 0 ? '#d9363e' : '#389e0d', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                            {formatPrice(Math.abs(val))}
                        </Text>
                    )
                },
                {
                    title: t("riel_kh"),

                    width: 'auto',
                    align: 'left',
                    render: (_, record) => {
                        const rielBalance = parseFloat(record.running_balance || 0) * state.exchangeRate;
                        return (
                            <Text style={{ color: rielBalance > 0 ? '#d9363e' : '#389e0d', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                {formatRiel(rielBalance)}
                            </Text>
                        );
                    }
                }
            ]
        },
        {
            title: t("action"),

            key: "action",
            width: 80,
            fixed: 'right',
            className: 'no-print',
            render: (_, record) => record.transaction_type === 'payment' ? (
                <Space>
                    <Button
                        type="primary"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => onClickBtnView(record)}
                        title={t("view_details")}
                    />

                    <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => onClickBtnDelete(record)}
                        title={t("delete")}
                    />

                </Space>
            ) : null
        }
    ];

    return (
        <MainPage loading={state.loading}>
            <style>{tableStyles}</style>
            <div className="px-2 sm:px-4 lg:px-6">
                <div className="mb-6">
                    <div
                        className="text-center py-6 px-4 rounded-xl header-banner-print shadow-sm"
                        style={{
                            background: isDarkMode
                                ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
                                : 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
                            border: isDarkMode ? '1px solid #334155' : '1px solid #e5e7eb',
                            color: isDarkMode ? '#f8fafc' : '#111827'
                        }}
                    >
                        <Title level={3} style={{ color: isDarkMode ? '#f8fafc' : '#111827', marginBottom: 8, fontWeight: '700' }}>
                            {t("supplier_report_title")}
                        </Title>
                        <Text style={{ color: isDarkMode ? '#94a3b8' : '#6b7280', fontSize: '15px' }}>
                            {t("period_from")} {state.dateRange[0]?.format('DD/MM/YYYY')} {t("to_date_label")} {state.dateRange[1]?.format('DD/MM/YYYY')}
                        </Text>

                    </div>

                </div>

                <Row gutter={[16, 16]} align="middle" justify="space-between">
                    <Col xs={24} sm={12} md={6}>
                        <Select
                            showSearch
                            allowClear
                            placeholder={t("select_supplier")}
                            style={{ width: '100%' }}
                            value={state.selectedSupplier}
                            onChange={(val) => {
                                console.log("Supplier selected:", val);
                                setState(p => ({ ...p, selectedSupplier: val }));
                            }}
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            options={state.suppliers.map(s => ({
                                value: s.id,
                                label: `${s.name} (${s.code})`
                            }))}
                        />
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                        <RangePicker
                            value={state.dateRange}
                            onChange={(dates) => setState(p => ({ ...p, dateRange: dates }))}
                            format="DD/MM/YYYY"
                            style={{ width: '100%' }}
                        />
                    </Col>

                    <Col xs={24} sm={12} md={4}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Text strong style={{ whiteSpace: 'nowrap' }}>{t("exchange_rate")}</Text>

                            <InputNumber
                                value={state.exchangeRate}
                                onChange={(val) => setState(p => ({ ...p, exchangeRate: val || 4100 }))}
                                style={{ width: '100%' }}
                                min={1}
                                step={100}
                                formatter={(value) => `KH ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(value) => value.replace(/KH\s?|(,*)/g, '')}
                            />
                        </div>
                    </Col>

                    <Col xs={24} md={8}>
                        <Space wrap>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={showPaymentModal}
                                disabled={!state.selectedSupplier}
                            >
                                {t("new_payment")}
                            </Button>

                            <Button
                                icon={<DownloadOutlined />}
                                onClick={handleExport}
                                disabled={!state.selectedSupplier}
                            >
                                {t("download_excel")}
                            </Button>

                            <Button
                                icon={<PrinterOutlined />}
                                onClick={handlePrint}
                            >
                                {t("print")}
                            </Button>

                        </Space>
                    </Col>
                </Row>

                {/* Main Table */}
                <Card>
                    <Table
                        columns={columns}
                        dataSource={processedLedger}
                        rowKey={(record) => `${record.transaction_type}-${record.id}`}
                        pagination={false}
                        scroll={{ x: 'max-content' }}
                        size="small"
                        bordered
                        className="supplier-ledger-table"
                        style={{
                            '--ant-table-header-bg': isDarkMode ? '#1e293b' : '#d4d4d4',
                            '--ant-table-header-color': isDarkMode ? '#f8fafc' : '#1a1a1a'
                        }}

                    />

                    {/* Summary Section */}
                    {state.ledger.length > 0 && (
                        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 summary-print-container">
                            <Title level={5} style={{ marginBottom: 16 }}>{t("balance_summary")}</Title>

                            <Row gutter={[32, 16]}>
                                <Col xs={24} md={12}>
                                    <div className="p-4 bg-white dark:bg-gray-800 rounded border shadow-sm h-full">
                                        <Row justify="space-between" className="mb-3">
                                            <Col><Text strong>{t("beginning_balance")}</Text></Col>
                                            <Col><Text strong>{formatPrice(state.summary.beginning_balance || 0)}</Text></Col>
                                        </Row>

                                        <Row justify="space-between" className="mb-3">
                                            <Col>
                                                <Text strong style={{ color: '#1890ff' }}>{t("period_purchase")}</Text>
                                                <Text type="secondary" className="ml-2 no-print">({state.summary.increase_count || 0} ដង)</Text>
                                            </Col>
                                            <Col><Text strong style={{ color: '#1890ff' }}>+ {formatPrice(state.summary.increase || 0)}</Text></Col>
                                        </Row>

                                        <Row justify="space-between" className="mb-3">
                                            <Col>
                                                <Text strong style={{ color: '#52c41a' }}>{t("period_payment")}</Text>
                                                <Text type="secondary" className="ml-2 no-print">({state.summary.payment_count || 0} ដង)</Text>
                                            </Col>
                                            <Col><Text strong style={{ color: '#52c41a' }}>- {formatPrice(state.summary.total_payments || 0)}</Text></Col>
                                        </Row>

                                        <div className="border-t my-2" />
                                        <Row justify="space-between" className="mt-2">
                                            <Col><Title level={4} style={{ margin: 0 }}>{t("ending_balance")}</Title></Col>
                                            <Col>
                                                <Title level={4} style={{ margin: 0, color: state.summary.ending_balance > 0 ? '#d9363e' : '#389e0d' }}>
                                                    {formatPrice(Math.abs(state.summary.ending_balance || 0))}
                                                </Title>
                                            </Col>
                                        </Row>

                                    </div>
                                </Col>

                                <Col xs={24} md={12} className="no-print">
                                    <div className="p-4 bg-white dark:bg-gray-800 rounded border shadow-sm h-full flex flex-col justify-center">
                                        <Row justify="center" align="middle" className="text-center h-full">
                                            <Col span={24}>
                                                <Title level={5}>{t("comparison")}</Title>

                                                <Text type="secondary">ប្រៀបធៀបជាមួយដើមគ្រា</Text>
                                                <div className="mt-4">
                                                    {state.summary.comparison > 0 ? (
                                                        <Text strong style={{ fontSize: '24px', color: '#d9363e' }}>
                                                            <ArrowUpOutlined /> Increase: {formatPrice(state.summary.comparison)}
                                                        </Text>
                                                    ) : state.summary.comparison < 0 ? (
                                                        <Text strong style={{ fontSize: '24px', color: '#389e0d' }}>
                                                            <ArrowDownOutlined /> Decrease: {formatPrice(Math.abs(state.summary.comparison))}
                                                        </Text>
                                                    ) : (
                                                        <Text strong style={{ fontSize: '24px', color: 'gray' }}>
                                                            No Change
                                                        </Text>
                                                    )}
                                                </div>
                                            </Col>
                                        </Row>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    )}
                </Card>

                {/* Payment Modal */}
                <Modal
                    title={t("record_new_payment")}
                    open={state.paymentModalVisible}

                    onCancel={() => {
                        form.resetFields();
                        form.setFieldsValue({ slip_image_url: null, bank_ref: null });
                        setState(p => ({ ...p, paymentModalVisible: false, slip_image: null, duplicateSlipFound: false, invalidSlipFound: false }));
                    }}
                    footer={null}
                    width={700}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handlePaymentSubmit}
                        initialValues={{
                            payment_date: dayjs(),
                            payment_method: 'bank_transfer'
                        }}
                    >
                        <Form.Item
                            name="payment_method"
                            label={t("payment_method")}
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
                            >
                                <Option value="cash">Cash (សាច់ប្រាក់)</Option>
                                <Option value="bank_transfer">Bank Transfer (ផ្ទេរប្រាក់)</Option>
                                <Option value="cheque">Cheque (សែក)</Option>
                                <Option value="other">Other (ផ្សេងៗ)</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, currentValues) =>
                                prevValues.payment_method !== currentValues.payment_method ||
                                prevValues.amount !== currentValues.amount ||
                                prevValues.slip_image !== currentValues.slip_image
                            }
                        >
                            {({ getFieldValue }) => {
                                const method = getFieldValue('payment_method');
                                const isBank = method === 'bank_transfer';
                                const isCash = method === 'cash' || method === 'cheque' || method === 'other';

                                return (
                                    <>
                                        {isBank && (
                                            <Form.Item
                                                name="slip_image"
                                                label={t("upload_slip")}
                                                valuePropName="file"
                                            >

                                                <Upload
                                                    beforeUpload={() => false}
                                                    maxCount={1}
                                                    accept="image/*"
                                                    listType="picture"
                                                    onChange={(info) => {
                                                        if (info.fileList.length > 0 && info.file.status !== 'removed') {
                                                            const fileToScan = info.file.originFileObj || info.file;
                                                            handleScanSlip(fileToScan);
                                                        }
                                                    }}
                                                    onRemove={() => {
                                                        setState(p => ({ ...p, duplicateSlipFound: false, invalidSlipFound: false, slip_image: null }));
                                                        form.setFieldsValue({
                                                            amount: undefined,
                                                            bank_name: undefined,
                                                            note: undefined,
                                                            reference_no: undefined,
                                                            slip_image_url: null,
                                                            bank_ref: null
                                                        });
                                                    }}
                                                >
                                                    <Button icon={<PlusOutlined />} loading={state.scanning}>
                                                        {state.scanning ? t("scanning") : t("click_to_upload_slip")}
                                                    </Button>

                                                </Upload>
                                            </Form.Item>
                                        )}

                                        <Form.Item
                                            name="purchase_id"
                                            label={`${t("payment.invoice_no")} (Invoice No)`}
                                        >
                                            <Select
                                                placeholder={t("payment.select_invoice")}
                                                allowClear
                                                onChange={(val) => {
                                                    if (val) {
                                                        const invoice = state.unpaidInvoices.find(i => i.id === val);
                                                        if (invoice) {
                                                            form.setFieldsValue({
                                                                amount: invoice.remaining_amount
                                                            });
                                                        }
                                                    }
                                                }}
                                            >
                                                {state.unpaidInvoices.map(inv => (
                                                    <Option key={inv.id} value={inv.id}>
                                                        {inv.order_no} - {t("total")}: {formatPrice(inv.total_amount)} ({t("remaining")}: {formatPrice(inv.remaining_amount)})
                                                    </Option>
                                                ))}
                                            </Select>
                                        </Form.Item>

                                        <Form.Item
                                            noStyle
                                            shouldUpdate={(prevValues, currentValues) => prevValues.purchase_id !== currentValues.purchase_id}
                                        >
                                            {({ getFieldValue }) => {
                                                const purchaseId = getFieldValue('purchase_id');
                                                if (!purchaseId) return null;
                                                const invoice = state.unpaidInvoices.find(i => i.id === purchaseId);
                                                if (!invoice) return null;
                                                return (
                                                    <Alert
                                                        message={`${t("payment.invoice_summary")}: ${invoice.order_no}`}
                                                        description={
                                                            <div style={{ padding: '8px 0' }}>
                                                                <Row justify="space-between" className="mb-1">
                                                                    <Col><Text>{t("payment.total_amount")}:</Text></Col>
                                                                    <Col><Text strong>{formatPrice(invoice.total_amount)}</Text></Col>
                                                                </Row>
                                                                <Row justify="space-between" className="mb-1">
                                                                    <Col><Text>{t("payment.paid_amount")}:</Text></Col>
                                                                    <Col><Text style={{ color: '#52c41a' }}>{formatPrice(invoice.paid_amount)}</Text></Col>
                                                                </Row>
                                                                <Row justify="space-between">
                                                                    <Col><Text strong>{t("payment.remaining_balance")}:</Text></Col>
                                                                    <Col><Text strong style={{ color: '#ff4d4f' }}>{formatPrice(invoice.remaining_amount)}</Text></Col>
                                                                </Row>
                                                            </div>
                                                        }
                                                        type="info"
                                                        showIcon
                                                        style={{ marginBottom: 16 }}
                                                    />
                                                );
                                            }}
                                        </Form.Item>

                                        <Form.Item
                                            name="payment_date"
                                            label={t("payment_date")}
                                            rules={[{ required: true }]}
                                        >

                                            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                                        </Form.Item>

                                        <Form.Item
                                            name="amount"
                                            label={t("amount_usd")}
                                            rules={[{ required: true }]}
                                        >

                                            <InputNumber
                                                style={{ width: '100%' }}
                                                min={0}
                                                precision={2}
                                                formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            name="reference_no"
                                            label={t("reference_number")}
                                        >

                                            <Input placeholder="e.g., Acleda5337..." />
                                        </Form.Item>

                                        {isBank && (
                                            <Form.Item
                                                name="bank_name"
                                                label={t("bank_name")}
                                                rules={[{ required: true, message: 'Please select a bank' }]}
                                            >

                                                <Select placeholder="Select Bank">
                                                    <Option value="ABA Bank">ABA Bank</Option>
                                                    <Option value="ACLEDA Bank">ACLEDA Bank</Option>
                                                    <Option value="Canadia Bank">Canadia Bank</Option>
                                                    <Option value="Wing Bank">Wing Bank</Option>
                                                    <Option value="True Money">True Money</Option>
                                                    <Option value="Bakong">Bakong</Option>
                                                </Select>
                                            </Form.Item>
                                        )}

                                        <Form.Item
                                            name="note"
                                            label={t("note")}
                                        >

                                            <Input.TextArea rows={3} />
                                        </Form.Item>
                                    </>
                                );
                            }}
                        </Form.Item>

                        {/* Hidden fields for bank slip data */}
                        <Form.Item name="bank_ref" hidden><Input /></Form.Item>
                        <Form.Item name="slip_image_url" hidden><Input /></Form.Item>

                        <div style={{ textAlign: 'right', marginTop: 24 }}>
                            <Button
                                onClick={() => {
                                    form.resetFields();
                                    setState(p => ({ ...p, paymentModalVisible: false }));
                                }}
                                style={{ marginRight: 8 }}
                            >
                                {t("cancel")}
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={state.submitting}
                                disabled={state.duplicateSlipFound || state.invalidSlipFound || state.scanning}
                                style={{
                                    backgroundColor: (state.duplicateSlipFound || state.invalidSlipFound) ? '#ff4d4f' : undefined,
                                    borderColor: (state.duplicateSlipFound || state.invalidSlipFound) ? '#ff4d4f' : undefined
                                }}
                            >
                                {state.duplicateSlipFound ? t("duplicate_slip") :
                                    state.invalidSlipFound ? t("invalid_slip") :
                                        t("save_payment")}
                            </Button>

                        </div>
                    </Form>
                </Modal>

                {/* View Detail Modal */}
                <Modal
                    title={<Title level={4}>{t("invoice_summary")}</Title>}
                    open={state.viewModalVisible}
                    onCancel={() => setState(p => ({ ...p, viewModalVisible: false, selectedRecord: null }))}
                    footer={[
                        <Button key="close" onClick={() => setState(p => ({ ...p, viewModalVisible: false, selectedRecord: null }))}>
                            {t("close")}
                        </Button>
                    ]}
                    width={800}
                >
                    {state.selectedRecord && (
                        <div className="py-2">
                            <Descriptions bordered column={2}>
                                <Descriptions.Item label={`${t("payment_date")} (ថ្ងៃខែឆ្នាំ)`}>
                                    {dayjs(state.selectedRecord.transaction_date).format("DD-MM-YYYY HH:mm")}
                                </Descriptions.Item>
                                <Descriptions.Item label="Type (ប្រភេទ)">
                                    <Tag color={state.selectedRecord.transaction_type === 'purchase' ? 'orange' : 'blue'}>
                                        {(state.selectedRecord.transaction_type || '').toUpperCase()}
                                    </Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Invoice No (លេខវិក្កយបត្រ)" span={2}>
                                    <Text strong style={{ color: '#1890ff' }}>{state.selectedRecord.order_no || '-'}</Text>
                                </Descriptions.Item>

                                {state.selectedRecord.transaction_type === 'purchase' ? (
                                    <>
                                        <Descriptions.Item label="Total Amount (សរុប)">
                                            <Text strong style={{ color: 'red' }}>{formatPrice(state.selectedRecord.debit)}</Text>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Riel Equation">
                                            {formatRiel(parseFloat(state.selectedRecord.debit || 0) * state.exchangeRate)}
                                        </Descriptions.Item>
                                    </>
                                ) : (
                                    <>
                                        <Descriptions.Item label="Payment Amount (ទឹកប្រាក់សង)">
                                            <Text strong style={{ color: 'green' }}>{formatPrice(state.selectedRecord.credit)}</Text>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Riel Equation">
                                            {formatRiel(parseFloat(state.selectedRecord.credit || 0) * state.exchangeRate)}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Method (វិធីសាស្រ្តអនុវត្ត)">
                                            {state.selectedRecord.payment_method || 'Bank Transfer'}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Bank Name (ឈ្មោះធនាគារ)">
                                            {state.selectedRecord.bank_name || '-'}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Reference No (លេខយោង)" span={2}>
                                            {state.selectedRecord.reference_no || '-'}
                                        </Descriptions.Item>
                                    </>
                                )}

                                <Descriptions.Item label="Note (ចំណាំ)" span={2}>
                                    {state.selectedRecord.note || '-'}
                                </Descriptions.Item>
                            </Descriptions>

                            {state.selectedRecord.transaction_type === 'payment' && (state.selectedRecord.slip_image || (state.selectedRecord.bank_ref && state.selectedRecord.bank_ref.startsWith('dcc'))) && (
                                <>
                                    <Divider orientation="left">Bank Slip (ប័ណ្ណបង់ប្រាក់)</Divider>
                                    <div style={{ textAlign: 'center', background: '#f5f5f5', padding: 20, borderRadius: 8 }}>
                                        <Image
                                            width={300}
                                            src={state.selectedRecord.slip_image || `https://res.cloudinary.com/dt966u8p6/image/upload/v1/petronas-products/${state.selectedRecord.bank_ref}.jpg`}
                                            fallback="https://res.cloudinary.com/dt966u8p6/image/upload/v1737719602/petronas-products/no-image_o5vz6f.png"
                                            placeholder={
                                                <div style={{ width: 300, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eee' }}>
                                                    Scanning...
                                                </div>
                                            }
                                        />
                                        <div className="mt-2">
                                            <Text type="secondary">Slip Ref: {state.selectedRecord.bank_ref || state.selectedRecord.reference_no}</Text>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </Modal>
            </div>
        </MainPage >
    );
}

export default SupplierPaymentPage;
