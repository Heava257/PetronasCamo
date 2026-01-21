import React, { useEffect, useState } from "react";
import {
    Card,
    Typography,
    Button,
    Space,
    Tag,
    ConfigProvider,
    theme,
    Spin
} from "antd";
import {
    ArrowLeftOutlined,
    PrinterOutlined
} from "@ant-design/icons";
import MainPage from "../../component/layout/MainPage";
import { request, formatPrice } from "../../util/helper";
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
        error: null
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
        }
    }, [id]);

    const loadPreOrderDetail = async () => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const res = await request(`pre-order/${id}`, "get");

            if (res && res.success) {
                const preOrder = res.data;
                const details = preOrder.details || [];

                setState(prev => ({
                    ...prev,
                    preOrder,
                    details,
                    loading: false
                }));
            } else {
                setState(prev => ({ ...prev, loading: false, error: "Failed to load" }));
            }
        } catch (error) {
            console.error("Error:", error);
            setState(prev => ({ ...prev, loading: false, error: error.message }));
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'orange',
            confirmed: 'blue',
            in_progress: 'cyan',
            ready: 'green',
            delivered: 'green', // changed default to green for better visibility
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

    if (!id) {
        // Redirect to management page if no ID provided
        navigate('/pre-order-management');
        return null;
    }

    if (state.loading) {
        return <MainPage><div style={{ textAlign: 'center', marginTop: 50 }}><Spin size="large" /></div></MainPage>;
    }

    if (state.error || !state.preOrder) {
        return (
            <MainPage>
                <ConfigProvider theme={{ algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
                    <div className="pre-order-detail-container">
                        <Card className="text-center p-8">
                            <div className="text-6xl mb-4">📦</div>
                            <Title level={3}>មិនមានទិន្នន័យ Pre-Order</Title>
                            <p className="text-gray-500 mb-4">{state.error || "Pre-Order Not Found"}</p>
                            <Button
                                type="primary"
                                size="large"
                                onClick={() => navigate('/pre-order-management')}
                            >
                                ទៅកាន់បញ្ជី Pre-Order
                            </Button>
                        </Card>
                    </div>
                </ConfigProvider>
            </MainPage>
        );
    }

    return (
        <MainPage loading={state.loading}>
            <ConfigProvider
                theme={{
                    algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
                }}
            >
                <div className="pre-order-detail-container">
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
                                <span className="receipt-label khmer-text-product">• PO Number:</span>
                                <span className="receipt-value">{state.preOrder.pre_order_no}</span>
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
                                <div key={item.id || index} className="receipt-item">
                                    <div className="receipt-item-header khmer-text-product">
                                        🔄 {index + 1}. STOCK UPDATED
                                    </div>
                                    <div className="receipt-detail-row">
                                        <span className="receipt-label khmer-text-product">• Category:</span>
                                        <span className="receipt-value khmer-text-product">{item.category_name}</span>
                                    </div>
                                    <div className="receipt-detail-row">
                                        <span className="receipt-label khmer-text-product">• Company:</span>
                                        <span className="receipt-value">{item.company_name || ""}</span>
                                    </div>
                                    {item.destination && (
                                        <div className="receipt-detail-row">
                                            <span className="receipt-label khmer-text-product">• Destination:</span>
                                            <span className="receipt-value">{item.destination}</span>
                                        </div>
                                    )}
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
                </div>
            </ConfigProvider>
        </MainPage>
    );
}

export default PreOrderDetailPage;
