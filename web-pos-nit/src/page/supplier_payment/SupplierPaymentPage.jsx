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
    DeleteOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import { useTranslation } from "../../locales/TranslationContext";
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Custom styles for supplier ledger table with Dark Mode support
const tableStyles = `
    .supplier-ledger-table .ant-table-thead > tr > th {
        background-color: #d4d4d4 !important;
        color: #1a1a1a !important;
        font-weight: 600;
        text-align: center;
        border: 1px solid #b0b0b0;
    }
    .supplier-ledger-table .ant-table-thead > tr > th .ant-table-column-title {
        color: #1a1a1a !important;
    }
    .supplier-ledger-table .ant-table-tbody > tr > td {
        border: 1px solid #d4d4d4;
    }

    /* Dark Mode Specific Overrides */
    .dark .ant-card {
        background: rgba(15, 23, 42, 0.8) !important;
        border-color: rgba(255, 255, 255, 0.1) !important;
        backdrop-filter: blur(12px);
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
        background: rgba(15, 23, 42, 0.95) !important;
        color: #f8fafc !important;
        border-color: rgba(255, 255, 255, 0.1) !important;
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
        background: rgba(30, 41, 59, 0.6) !important;
        border-color: rgba(255, 255, 255, 0.1) !important;
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
    const [form] = Form.useForm();

    const [state, setState] = useState({
        loading: false,
        suppliers: [],
        selectedSupplier: null,
        ledger: [],
        summary: {},
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
            message.error("Please select a supplier");
            return;
        }

        const params = new URLSearchParams({
            supplier_id: state.selectedSupplier,
            start_date: state.dateRange[0]?.format('YYYY-MM-DD'),
            end_date: state.dateRange[1]?.format('YYYY-MM-DD')
        });

        window.open(`/api/supplier_payment/export?${params}`, '_blank');
        message.success("Export started");
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
                        bank_ref: res.data.bank_ref,
                        bank_name: undefined,
                        note: `BLOCK: ${duplicateMessage}`
                    });
                    return;
                }

                // New: Check if it's a valid slip
                if (res.data.isValidSlip === false) {
                    setState(p => ({ ...p, invalidSlipFound: true, duplicateSlipFound: false, scanning: false }));
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
                message.success(`Slip scanned successfully! Details filled.${dateNotice}`);
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

    const onClickBtnView = (record) => {
        setState(p => ({
            ...p,
            selectedRecord: record,
            viewModalVisible: true
        }));
    };

    const onClickBtnDelete = (record) => {
        const typeLabel = record.transaction_type === 'purchase' ? 'Invoice' : 'Payment';
        Modal.confirm({
            title: `Delete ${typeLabel}`,
            icon: <ExclamationCircleOutlined />,
            content: `Are you sure you want to delete this ${record.transaction_type}? This will adjust the ledger balance.`,
            okText: 'Yes, Delete',
            okType: 'danger',
            cancelText: 'No',
            onOk: async () => {
                const realId = record.id.split('-')[1]; // Extract numeric ID from pur-123 or pay-456
                const url = record.transaction_type === 'purchase'
                    ? `purchase/${realId}`
                    : `supplier_payment/${realId}`;

                const res = await request(url, "delete");
                if (res && !res.error) {
                    message.success(`${typeLabel} deleted successfully`);
                    loadLedger();
                } else {
                    message.error(res.message || `Failed to delete ${record.transaction_type}`);
                }
            }
        });
    };

    const handlePaymentSubmit = async (values) => {
        if (state.duplicateSlipFound || state.invalidSlipFound) {
            message.error("This payment is blocked. Please provide a valid, unique bank slip.");
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
                message.success("Payment recorded successfully");
                setState(p => ({ ...p, paymentModalVisible: false, slip_image: null })); // Close and clear
                loadLedger();
                form.resetFields();
                form.setFieldsValue({ slip_image_url: null }); // Explicit clear
            } else {
                message.error(res.message || "Failed to record payment");
            }
        } catch (error) {
            const messageText = error.response?.data?.message || "Failed to record payment";
            message.error(messageText);
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
                        let fuel_extra = 0, fuel_gas = 0, fuel_diesel = 0;
                        if (name.includes('gasoline') || name.includes('extra') || name.includes('super') || name.includes('95') || name.includes('92') || name.includes('សាំង') || name.includes('benzine')) {
                            fuel_extra = qty;
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
            title: "ថ្ងៃ ខែ ឆ្នាំ / Date",
            dataIndex: "transaction_date",
            key: "date",
            width: 100,
            render: (val) => dayjs(val).format("DD-MM-YY")
        },
        {
            title: "លេខបំណុល / Invoice No",
            dataIndex: "order_no",
            key: "order_no",
            width: 120,
            render: (val) => val || ''
        },
        {
            title: "អធិប្បាយ / Description",
            dataIndex: "note",
            key: "note",
            width: 150,
            render: (val, record) => {
                if (record.transaction_type === 'purchase') {
                    // Try to show first product or truck info if in note
                    return val || 'Purchase';
                }
                return val;
            }
        },
        {
            title: "កំណើនក្នុងគ្រា / Increase during the period",
            children: [
                {
                    title: "Extra (L)",
                    width: 100,
                    dataIndex: "fuel_extra",
                    render: (val) => val > 0 ? val.toLocaleString() : '-'
                },
                {
                    title: "Gas (L)",
                    width: 100,
                    dataIndex: "fuel_gas",
                    render: (val) => val > 0 ? val.toLocaleString() : '-'
                },
                {
                    title: "Diesel (L)",
                    width: 100,
                    dataIndex: "fuel_diesel",
                    render: (val) => val > 0 ? val.toLocaleString() : '-'
                }
            ]
        },
        {
            title: "តំលៃក្នុង / Unit Price",
            key: "unit_price",
            width: 100,
            render: (_, record) => {
                if (record.transaction_type !== 'purchase') return '';
                // Use specific price if we split the rows, otherwise fallback to average
                if (record.unit_price_specific !== undefined) {
                    return `USD ${formatPrice(record.unit_price_specific)}`;
                }
                try {
                    const items = record.items ? (typeof record.items === 'string' ? JSON.parse(record.items) : record.items) : [];
                    if (items.length > 0) {
                        const avgPrice = items.reduce((sum, i) => sum + parseFloat(i.unit_price || i.price || 0), 0) / items.length;
                        return `USD ${formatPrice(avgPrice)}`;
                    }
                    return '-';
                } catch (e) {
                    return '-';
                }
            }
        },
        {
            title: "ទឹកប្រាក់សរុប / Total Amount",
            children: [
                {
                    title: "Dollar",
                    dataIndex: "debit",
                    key: "dollar_debit",
                    width: 100,
                    render: (val, record) => record.transaction_type === 'purchase' ? `USD ${formatPrice(val)}` : ''
                },
                {
                    title: "Riel",
                    width: 100,
                    render: (_, record) => {
                        if (record.transaction_type !== 'purchase') return '';
                        const rielAmount = parseFloat(record.debit || 0) * state.exchangeRate;
                        return `KHR ${rielAmount.toLocaleString()}`;
                    }
                }
            ]
        },
        {
            title: "សងក្នុងគ្រា / Payments during the period",
            children: [
                {
                    title: "លេខប័ណ្ណ / Ref",
                    dataIndex: "reference_no",
                    key: "ref",
                    width: 150,
                    render: (val, record) => {
                        if (record.transaction_type !== 'payment') return '';
                        return (
                            <div style={{ lineHeight: '1.2' }}>
                                {record.order_no && <div style={{ fontWeight: '600', color: '#1890ff' }}>{record.order_no}</div>}
                                {val && <div style={{ fontSize: '11px', opacity: 0.8 }}>{val}</div>}
                                {!record.order_no && !val && '-'}
                            </div>
                        );
                    }
                },
                {
                    title: "Dollar",
                    dataIndex: "credit",
                    key: "dollar_credit",
                    width: 100,
                    render: (val, record) => record.transaction_type === 'payment' ? `USD ${formatPrice(val)}` : ''
                },
                {
                    title: "Riel",
                    width: 100,
                    render: (_, record) => {
                        if (record.transaction_type !== 'payment') return '';
                        const rielAmount = parseFloat(record.credit || 0) * state.exchangeRate;
                        return `KHR ${rielAmount.toLocaleString()}`;
                    }
                }
            ]
        },
        {
            title: "ចុងគ្រា / Balance",
            children: [
                {
                    title: "Dollar",
                    dataIndex: "running_balance",
                    key: "balance",
                    width: 120,
                    render: (val) => (
                        <Text style={{ color: val > 0 ? 'red' : 'green', fontWeight: 'bold' }}>
                            USD {formatPrice(Math.abs(val))}
                        </Text>
                    )
                },
                {
                    title: "Riel",
                    width: 120,
                    render: (_, record) => {
                        const rielBalance = parseFloat(record.running_balance || 0) * state.exchangeRate;
                        return (
                            <Text style={{ color: rielBalance > 0 ? 'red' : 'green', fontWeight: 'bold' }}>
                                KHR {Math.abs(rielBalance).toLocaleString()}
                            </Text>
                        );
                    }
                }
            ]
        },
        {
            title: "សកម្មភាព / Action",
            key: "action",
            width: 100,
            fixed: 'right',
            render: (_, record) => record.transaction_type === 'payment' ? (
                <Space>
                    <Button
                        type="primary"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => onClickBtnView(record)}
                        title="View Details"
                    />
                    <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => onClickBtnDelete(record)}
                        title="Delete"
                    />
                </Space>
            ) : null
        }
    ];

    return (
        <MainPage loading={state.loading}>
            <style>{tableStyles}</style>
            <div className="px-2 sm:px-4 lg:px-6">
                {/* Header Banner */}
                <Card className="mb-4">
                    <div
                        className="text-center py-3 mb-4 rounded-lg"
                        style={{ backgroundColor: '#8B4513', color: 'white' }}
                    >
                        <Title level={4} style={{ color: 'white', marginBottom: 4 }}>
                            របាយការណ៍សម្អិតទិញ សង នៅសល់ពីក្រុមហ៊ុនប៉េត្រូណាស់
                        </Title>
                        <Text style={{ color: 'white' }}>
                            សំរាប់ថ្ងៃ {state.dateRange[0]?.format('DD.MM.YY')} ដល់ថ្ងៃ {state.dateRange[1]?.format('DD.MM.YY')}
                        </Text>
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
                                <Text strong style={{ whiteSpace: 'nowrap' }}>អត្រាប្តូរ:</Text>
                                <InputNumber
                                    value={state.exchangeRate}
                                    onChange={(val) => setState(p => ({ ...p, exchangeRate: val || 4100 }))}
                                    style={{ width: '100%' }}
                                    min={1}
                                    step={100}
                                    formatter={(value) => `KHR ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={(value) => value.replace(/KHR\s?|(,*)/g, '')}
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
                                    New Payment
                                </Button>
                                <Button
                                    icon={<DownloadOutlined />}
                                    onClick={handleExport}
                                    disabled={!state.selectedSupplier}
                                >
                                    Export
                                </Button>
                                <Button
                                    icon={<PrinterOutlined />}
                                    onClick={handlePrint}
                                >
                                    Print
                                </Button>
                            </Space>
                        </Col>
                    </Row>
                </Card>

                {/* Main Table */}
                <Card>
                    <Table
                        columns={columns}
                        dataSource={processedLedger}
                        rowKey={(record) => `${record.transaction_type}-${record.id}`}
                        pagination={false}
                        scroll={{ x: 1400 }}
                        size="small"
                        bordered
                        className="supplier-ledger-table"
                        style={{
                            '--ant-table-header-bg': '#d4d4d4',
                            '--ant-table-header-color': '#1a1a1a'
                        }}
                    />

                    {/* Summary Section */}
                    {state.ledger.length > 0 && (
                        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200">
                            <Title level={5} style={{ marginBottom: 16 }}>សេចក្តីសង្ខេបសមតុល្យ / Balance Summary</Title>
                            <Row gutter={[32, 16]}>
                                <Col xs={24} md={12}>
                                    <div className="p-4 bg-white dark:bg-gray-800 rounded border shadow-sm">
                                        <Row justify="space-between" className="mb-3">
                                            <Col><Text strong>Beginning Balance (សមតុល្យដើមគ្រា):</Text></Col>
                                            <Col><Text>USD {formatPrice(state.summary.beginning_balance || 0)}</Text></Col>
                                        </Row>
                                        <Row justify="space-between" className="mb-3">
                                            <Col>
                                                <Text strong style={{ color: '#1890ff' }}>Increase (ទិញបន្ថែមក្នុងគ្រា):</Text>
                                                <Text type="secondary" className="ml-2">({state.summary.increase_count || 0} times)</Text>
                                            </Col>
                                            <Col><Text style={{ color: '#1890ff' }}>+ USD {formatPrice(state.summary.increase || 0)}</Text></Col>
                                        </Row>
                                        <Row justify="space-between" className="mb-3">
                                            <Col>
                                                <Text strong style={{ color: '#52c41a' }}>Payments (សងក្នុងគ្រា):</Text>
                                                <Text type="secondary" className="ml-2">({state.summary.payment_count || 0} times)</Text>
                                            </Col>
                                            <Col><Text style={{ color: '#52c41a' }}>- USD {formatPrice(state.summary.total_payments || 0)}</Text></Col>
                                        </Row>
                                        <div className="border-t my-2" />
                                        <Row justify="space-between" className="mt-2">
                                            <Col><Title level={4}>Ending Balance (សមតុល្យចុងគ្រា):</Title></Col>
                                            <Col>
                                                <Title level={4} style={{ color: state.summary.ending_balance > 0 ? 'red' : 'green' }}>
                                                    USD {formatPrice(Math.abs(state.summary.ending_balance || 0))}
                                                </Title>
                                            </Col>
                                        </Row>
                                    </div>
                                </Col>

                                <Col xs={24} md={12}>
                                    <div className="p-4 bg-white dark:bg-gray-800 rounded border shadow-sm h-full flex flex-col justify-center">
                                        <Row justify="center" align="middle" className="text-center h-full">
                                            <Col span={24}>
                                                <Title level={5}>ការប្រៀបធៀប (Comparison)</Title>
                                                <Text type="secondary">ប្រៀបធៀបជាមួយដើមគ្រា</Text>
                                                <div className="mt-4">
                                                    {state.summary.comparison > 0 ? (
                                                        <Text strong style={{ fontSize: '24px', color: 'red' }}>
                                                            <ArrowUpOutlined /> Increase: USD {formatPrice(state.summary.comparison)}
                                                        </Text>
                                                    ) : state.summary.comparison < 0 ? (
                                                        <Text strong style={{ fontSize: '24px', color: 'green' }}>
                                                            <ArrowDownOutlined /> Decrease: USD {formatPrice(Math.abs(state.summary.comparison))}
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
                    title="Record New Payment"
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
                                                label="Upload Slip"
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
                                                        {state.scanning ? 'Scanning...' : 'Click to Upload Slip'}
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
                                                        {inv.order_no} - {t("total")}: ${formatPrice(inv.total_amount)} ({t("remaining")}: ${formatPrice(inv.remaining_amount)})
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
                                                                    <Col><Text strong>USD {formatPrice(invoice.total_amount)}</Text></Col>
                                                                </Row>
                                                                <Row justify="space-between" className="mb-1">
                                                                    <Col><Text>{t("payment.paid_amount")}:</Text></Col>
                                                                    <Col><Text style={{ color: '#52c41a' }}>USD {formatPrice(invoice.paid_amount)}</Text></Col>
                                                                </Row>
                                                                <Row justify="space-between">
                                                                    <Col><Text strong>{t("payment.remaining_balance")}:</Text></Col>
                                                                    <Col><Text strong style={{ color: '#ff4d4f' }}>USD {formatPrice(invoice.remaining_amount)}</Text></Col>
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
                                            label="Payment Date"
                                            rules={[{ required: true }]}
                                        >
                                            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                                        </Form.Item>

                                        <Form.Item
                                            name="amount"
                                            label="Amount (USD)"
                                            rules={[{ required: true }]}
                                        >
                                            <InputNumber
                                                style={{ width: '100%' }}
                                                min={0}
                                                precision={2}
                                                formatter={(value) => `USD ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                parser={(value) => value.replace(/USD\s?|(,*)/g, '')}
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            name="reference_no"
                                            label="Reference Number"
                                        >
                                            <Input placeholder="e.g., Acleda5337..." />
                                        </Form.Item>

                                        {isBank && (
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
                                                    <Option value="Bakong">Bakong</Option>
                                                </Select>
                                            </Form.Item>
                                        )}

                                        <Form.Item
                                            name="note"
                                            label="Note"
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
                                Cancel
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
                                {state.duplicateSlipFound ? 'BLOCKED: Duplicate Slip' :
                                    state.invalidSlipFound ? 'BLOCKED: Invalid Slip' :
                                        'Save Payment'}
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
                                            <Text strong style={{ color: 'red' }}>USD {formatPrice(state.selectedRecord.debit)}</Text>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Riel Equation">
                                            KHR {(parseFloat(state.selectedRecord.debit || 0) * state.exchangeRate).toLocaleString()}
                                        </Descriptions.Item>
                                    </>
                                ) : (
                                    <>
                                        <Descriptions.Item label="Payment Amount (ទឹកប្រាក់សង)">
                                            <Text strong style={{ color: 'green' }}>USD {formatPrice(state.selectedRecord.credit)}</Text>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Riel Equation">
                                            KHR {(parseFloat(state.selectedRecord.credit || 0) * state.exchangeRate).toLocaleString()}
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
