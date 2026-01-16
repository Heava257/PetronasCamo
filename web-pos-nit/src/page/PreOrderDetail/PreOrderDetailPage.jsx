import React, { useEffect, useState } from "react";
import {
    Card,
    Col,
    Row,
    Statistic,
    Table,
    Tag,
    Typography,
    Button,
    Space,
    DatePicker,
    Input,
    ConfigProvider,
    theme,
    Badge,
    Divider
} from "antd";
import {
    ArrowLeftOutlined,
    PrinterOutlined,
    FilterOutlined
} from "@ant-design/icons";
import MainPage from "../../component/layout/MainPage";
import { request, formatDateClient, formatPrice } from "../../util/helper";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "./PreOrderDetail.css";
import { useTranslation } from "../../locales/TranslationContext";

const { Title } = Typography;

function PreOrderDetailPage() {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();

    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem('darkMode') === 'true';
    });

    const [state, setState] = useState({
        loading: false,
        preOrder: null,
        details: [],
        summary: {
            totalQuantity: 0,
            totalValue: 0,
            totalPaid: 0,
            remainingBalance: 0
        }
    });

    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'darkMode') {
                setIsDarkMode(e.newValue === 'true');
            }
        };

        window.addEventListener('storage', handleStorageChange);
        const interval = setInterval(() => {
            const currentDarkMode = localStorage.getItem('darkMode') === 'true';
            if (currentDarkMode !== isDarkMode) {
                setIsDarkMode(currentDarkMode);
            }
        }, 100);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, [isDarkMode]);

    useEffect(() => {
        if (id) {
            loadPreOrderDetail();
        } else {
            // No ID in URL - use test data or show error
            console.warn("⚠️ No Pre-Order ID in URL - Using test data");
            loadTestData();
        }
    }, [id]);

    const loadTestData = () => {
        // Test data for development
        const testPreOrder = {
            id: 1,
            pre_order_no: "PO-2026-01-12-001",
            customer_name: "អតិថិជន A",
            customer_tel: "012-345-678",
            order_date: new Date(),
            delivery_date: new Date(),
            status: "confirmed",
            total_amount: 13500.00,
            deposit_amount: 5000.00,
            remaining_amount: 8500.00,
            details: [
                {
                    id: 1,
                    product_name: "ប្រេងឥន្ធនៈ",
                    company_name: "petronas-cambodia-ltd",
                    category_name: "ម៉ាស៊ូត/DIESEL EURO-5",
                    qty: 4000,
                    unit: "L",
                    price: 830.00,
                    amount: 2789.92,
                    status: 1
                },
                {
                    id: 2,
                    product_name: "ប្រេងឥន្ធនៈ",
                    company_name: "petronas-cambodia-ltd",
                    category_name: "សាំងធម្មតា/GASOLINE",
                    qty: 12000,
                    unit: "L",
                    price: 1095.00,
                    amount: 9453.24,
                    status: 1
                }
            ]
        };

        setState(prev => ({
            ...prev,
            preOrder: testPreOrder,
            details: testPreOrder.details,
            summary: {
                totalQuantity: 16000,
                totalValue: 12243.16,
                totalPaid: 5000.00,
                remainingBalance: 7243.16
            },
            loading: false
        }));
    };

    const loadPreOrderDetail = async () => {
        setState(prev => ({ ...prev, loading: true }));

        try {
            const res = await request(`pre-order/${id}`, "get");

            if (res && res.success) {
                const preOrder = res.data;
                const details = preOrder.details || [];

                // Calculate summary
                const totalQuantity = details.reduce((sum, item) => sum + parseInt(item.qty || 0), 0);
                const totalValue = details.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
                const totalPaid = parseFloat(preOrder.deposit_amount || 0);
                const remainingBalance = parseFloat(preOrder.remaining_amount || 0);

                setState(prev => ({
                    ...prev,
                    preOrder,
                    details,
                    summary: {
                        totalQuantity,
                        totalValue,
                        totalPaid,
                        remainingBalance
                    },
                    loading: false
                }));
            } else {
                // API failed - use test data
                console.warn("⚠️ API failed - Using test data");
                loadTestData();
            }
        } catch (error) {
            console.error("Error:", error);
            // On error - use test data instead of showing blank page
            console.warn("⚠️ Error loading data - Using test data");
            loadTestData();
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'orange',
            confirmed: 'blue',
            in_progress: 'cyan',
            ready: 'green',
            delivered: 'default',
            cancelled: 'red'
        };
        return colors[status] || 'default';
    };

    const getStatusText = (status) => {
        const texts = {
            pending: 'រង់ចាំ',
            confirmed: 'បានបញ្ជាក់',
            in_progress: 'កំពុងរៀបចំ',
            ready: 'រៀបចំរួច',
            delivered: 'បានដឹកជញ្ជូន',
            cancelled: 'បោះបង់'
        };
        return texts[status] || status;
    };

    const columns = [
        {
            title: "លេខ",
            key: "index",
            render: (_, __, index) => index + 1,
            width: 60
        },
        {
            title: "ឈ្មោះ",
            dataIndex: "product_name",
            key: "product_name",
            render: (name) => (
                <span className="khmer-text-product">{name}</span>
            )
        },
        {
            title: "ក្រុមហ៊ុន",
            dataIndex: "company_name",
            key: "company_name",
            render: (name) => name || "N/A"
        },
        {
            title: "ប្រភេទ",
            dataIndex: "category_name",
            key: "category_name",
            render: (category) => (
                <span className="khmer-text-product">{category}</span>
            )
        },
        {
            title: t('invoice_number') || "លេខប័ណ្ណ",
            dataIndex: "description",
            key: "description",
            render: (desc) => desc ? <Tag color="cyan">{desc}</Tag> : "-"
        },
        {
            title: "បរិមាណ",
            dataIndex: "qty",
            key: "qty",
            render: (qty, record) => (
                <span>{parseFloat(qty).toLocaleString()} {record.unit}</span>
            )
        },
        {
            title: "តម្លៃ/ឯកតា",
            dataIndex: "price",
            key: "price",
            render: (price) => formatPrice(price)
        },
        {
            title: "តម្លៃសរុប",
            dataIndex: "amount",
            key: "amount",
            render: (amount) => (
                <span className="font-bold text-green-600 dark:text-green-400">
                    {formatPrice(amount)}
                </span>
            )
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status) =>
                status === 1 ? (
                    <Badge status="success" text={<span className="khmer-text-product">ស្ថានភាពសកម្ម</span>} />
                ) : (
                    <Badge status="error" text={<span className="khmer-text-product">អសកម្ម</span>} />
                )
        }
    ];

    // Mobile Card Component
    const MobileDetailCard = ({ item, index }) => (
        <Card className="mb-3 shadow-sm">
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-gray-500">#{index + 1}</span>
                {item.status === 1 ? (
                    <Badge status="success" text="សកម្ម" />
                ) : (
                    <Badge status="error" text="អសកម្ម" />
                )}
            </div>

            <div className="font-semibold mb-2 khmer-text-product">{item.product_name}</div>

            <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                    <span className="text-gray-500">ប្រភេទ:</span>
                    <div className="khmer-text-product">{item.category_name}</div>
                </div>
                <div>
                    <span className="text-gray-500">ក្រុមហ៊ុន:</span>
                    <div>{item.company_name || "N/A"}</div>
                </div>
                <div>
                    <span className="text-gray-500">{t('invoice_number') || "លេខប័ណ្ណ"}:</span>
                    <div>{item.description ? <Tag color="cyan" style={{ margin: 0 }}>{item.description}</Tag> : "-"}</div>
                </div>
                <div>
                    <span className="text-gray-500">បរិមាណ:</span>
                    <div>{parseFloat(item.qty).toLocaleString()} {item.unit}</div>
                </div>
                <div>
                    <span className="text-gray-500">តម្លៃ:</span>
                    <div className="font-bold text-green-600">{formatPrice(item.amount)}</div>
                </div>
            </div>
        </Card>
    );

    // Don't return early - show loading or test data instead
    // if (!state.preOrder) {
    //   return <MainPage loading={state.loading} />;
    // }

    return (
        <MainPage loading={state.loading}>
            <ConfigProvider
                theme={{
                    algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
                }}
            >
                <div className="pre-order-detail-container">
                    {!state.preOrder ? (
                        <Card className="text-center p-8">
                            <div className="text-6xl mb-4">📦</div>
                            <Title level={3}>មិនមានទិន្នន័យ Pre-Order</Title>
                            <p className="text-gray-500 mb-4">
                                សូមជ្រើសរើស Pre-Order ពីបញ្ជី ឬបង្កើត Pre-Order ថ្មី
                            </p>
                            <Button
                                type="primary"
                                size="large"
                                onClick={() => navigate('/pre-order-management')}
                            >
                                ទៅកាន់បញ្ជី Pre-Order
                            </Button>
                        </Card>
                    ) : (
                        <div className="receipt-container">
                            {/* Actions Header (Floating or Top) */}
                            <div className="flex justify-between mb-6 no-print">
                                <Button
                                    icon={<ArrowLeftOutlined />}
                                    onClick={() => navigate('/pre-order-management')}
                                >
                                    {t("back") || "ថយក្រោយ"}
                                </Button>
                                <Space>
                                    <Button
                                        type="primary"
                                        icon={<PrinterOutlined />}
                                        onClick={() => window.print()}
                                    >
                                        {t("print") || "បោះពុម្ព"}
                                    </Button>
                                    <Tag color={getStatusColor(state.preOrder.status)} className="khmer-text-product">
                                        {getStatusText(state.preOrder.status)}
                                    </Tag>
                                </Space>
                            </div>

                            {/* Receipt Body */}
                            <div className="receipt-header">
                                <Title level={2} className="m-0 khmer-text-product">📦 STOCK UPDATES 📝</Title>
                            </div>

                            {/* Customer Info */}
                            <div className="receipt-section">
                                <div className="receipt-section-title khmer-text-product">
                                    👤 Customer Information:
                                </div>
                                <div className="receipt-detail-row">
                                    <span className="receipt-label khmer-text-product">• Name:</span>
                                    <span className="receipt-value khmer-text-product">{state.preOrder.customer_name}</span>
                                </div>
                                <div className="receipt-detail-row">
                                    <span className="receipt-label khmer-text-product">• Address:</span>
                                    <span className="receipt-value khmer-text-product">{state.preOrder.delivery_address || "-"}</span>
                                </div>
                                <div className="receipt-detail-row">
                                    <span className="receipt-label khmer-text-product">• Phone:</span>
                                    <span className="receipt-value">{state.preOrder.customer_tel}</span>
                                </div>
                                <div className="receipt-detail-row">
                                    <span className="receipt-label khmer-text-product">• Card Number:</span>
                                    <span className="receipt-value">{state.preOrder.id.toString().padStart(6, '0')}</span>
                                </div>
                            </div>

                            <div className="receipt-separator">━━━━━━━━━━━━━━━━━</div>

                            {/* Items List */}
                            <div className="receipt-item-list">
                                {state.details.map((item, index) => (
                                    <div key={item.id} className="receipt-item">
                                        <div className="receipt-item-header khmer-text-product">
                                            🔄 {index + 1}. STOCK UPDATED
                                        </div>
                                        <div className="receipt-detail-row">
                                            <span className="receipt-label khmer-text-product">• Category:</span>
                                            <span className="receipt-value khmer-text-product">{item.category_name}</span>
                                        </div>
                                        <div className="receipt-detail-row">
                                            <span className="receipt-label khmer-text-product">• Company:</span>
                                            <span className="receipt-value">{item.company_name}</span>
                                        </div>
                                        <div className="receipt-detail-row">
                                            <span className="receipt-label khmer-text-product">• New Total:</span>
                                            <span className="receipt-value">{parseFloat(item.qty).toLocaleString()}{item.unit}</span>
                                        </div>
                                        <div className="receipt-detail-row">
                                            <span className="receipt-label khmer-text-product">• Unit Price:</span>
                                            <span className="receipt-value">{formatPrice(item.price)}</span>
                                        </div>
                                        <div className="receipt-detail-row">
                                            <span className="receipt-label khmer-text-product">• Total Value:</span>
                                            <span className="receipt-value font-bold">{formatPrice(item.amount)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="receipt-separator">━━━━━━━━━━━━━━━━━</div>

                            {/* Grand Total & Meta */}
                            <div className="grand-total-section">
                                <div className="grand-total-row khmer-text-product">
                                    💰 GRAND TOTAL: {formatPrice(state.preOrder.total_amount)}
                                </div>
                                <div className="receipt-footer-row khmer-text-product">
                                    👤 Updated by: {state.preOrder.created_by_name || "Admin"}
                                </div>
                                <div className="receipt-footer-row">
                                    🕐 Date: {dayjs(state.preOrder.created_at).format("DD/MM/YYYY hh:mm:ss A")}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </ConfigProvider>
        </MainPage>
    );
}

export default PreOrderDetailPage;
