import React, { useState, useEffect, useCallback } from "react";
import { Table, Tag, Button, Modal, message, Input, Badge, Row, Col, Typography, App } from "antd";
const { Title, Text } = Typography;
import {
    FaBox,
    FaList,
    FaTimes,
    FaShoppingCart
} from "react-icons/fa";
import {
    CheckCircleOutlined,
    ReloadOutlined,
    EyeOutlined,
    ShoppingCartOutlined
} from "@ant-design/icons";
import { request, formatPrice, formatQty } from "../../util/helper";
import IntegratedInvoiceSidebar from "./IntegratedInvoiceSidebar";
import dayjs from 'dayjs';
import { useTranslation } from "../../locales/TranslationContext";
import './PreOrdersFullView.css';
import PrintInvoice from "../../component/pos/PrintInvoice";

const PreOrdersFullView = ({ categories = [], customers = [], trucks = [] }) => {
    const { t } = useTranslation();
    const [messageApi, contextHolder] = message.useMessage();
    const [preOrders, setPreOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState({ txt_search: "" });
    const [selectedPreOrder, setSelectedPreOrder] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [stockStats, setStockStats] = useState([]);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const componentRef = React.useRef();

    // Cart State (for modal)
    const [cartState, setCartState] = useState({
        cart_list: [],
        customers: customers
    });

    const [objSummary, setObjSummary] = useState({
        sub_total: 0,
        total_qty: 0,
        save_discount: 0,
        tax: 10,
        total: 0,
        customer_id: null,
        customer_name: null,
        customer_address: null,
        customer_tel: null,
        user_id: null,
        remark: null,
        order_no: null,
        order_date: null,
        delivery_date: null,
        receive_date: null,
        pre_order_id: null,
        pre_order_no: null,
    });

    const [selectedLocation, setSelectedLocation] = useState(null);
    const [selectedTruck, setSelectedTruck] = useState(null);
    const [selectedLocations, setSelectedLocations] = useState([]);
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    // Fetch Pre-Orders
    const fetchPreOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await request("pre-order/list", "get");
            if (res && res.success && res.list) {
                const readyOrders = res.list.filter(
                    order => order.status === 'ready' || order.status === 'confirmed'
                );
                setPreOrders(readyOrders);
            }
        } catch (error) {
            console.error("❌ Failed to fetch pre-orders:", error);
            message.error(t("failed_to_load_orders"));
        } finally {
            setLoading(false);
        }
    }, [t]);

    // Fetch Stock Stats
    const fetchStockStats = useCallback(async () => {
        try {
            const res = await request("inventory/category-statistics", "get");
            if (res && res.success && res.data) {
                setStockStats(res.data);
            }
        } catch (error) {
            console.error("❌ Failed to fetch stock stats:", error);
        }
    }, []);

    useEffect(() => {
        fetchPreOrders();
        fetchStockStats();
    }, [fetchPreOrders, fetchStockStats]);

    // Handle Load Pre-Order into Modal
    const handleLoadPreOrder = async (preOrder) => {
        try {
            setLoading(true);
            const res = await request(`pre-order/${preOrder.id}`, "get");

            if (res && res.success && res.data) {
                const orderDetails = res.data;

                // Audio removed

                const issues = [];

                const newCartItems = orderDetails.details.map(item => {
                    const reqQty = parseFloat(item.remaining_qty || item.qty);

                    // Override available_qty with data from stock stats if possible to ensure accuracy
                    let availQty = parseFloat(item.available_qty || 0);
                    // Robust matching (trim + lowercase) to ensure we find the correct stock
                    const matchingStock = stockStats.find(s =>
                        (s.product_name || "").trim().toLowerCase() === (item.product_name || "").trim().toLowerCase()
                    );

                    if (matchingStock) {
                        availQty = parseFloat(matchingStock.total_qty || 0);
                    }

                    let finalQty = reqQty;
                    let stockWarning = null;

                    // Removed clamping logic to allow user to see and adjust invalid quantities

                    // ✅ Robust conversion factor lookup logic
                    let actual_price = 1000; // Default fallback

                    // Priority 1: Use the factor saved with the product in DB
                    const dbFactor = parseFloat(item.product_actual_price || item.actual_price || 0);

                    if (dbFactor > 1) {
                        actual_price = dbFactor;
                    } else {
                        // Priority 2: Force industry standards if DB has no factor set (>1)
                        const searchName = `${item.product_name || ""} ${item.category_name || ""}`.toLowerCase();
                        if (searchName.includes("diesel")) {
                            actual_price = 1190;
                        } else if (searchName.includes("gasoline")) {
                            actual_price = 1370; // Standard Gasoline density factor
                        } else {
                            // Priority 3: Try matching by category name
                            const category = categories.find(cat =>
                                cat.name?.toLowerCase() === item.category_name?.toLowerCase()
                            );
                            if (category && category.actual_price && parseFloat(category.actual_price) > 0) {
                                actual_price = parseFloat(category.actual_price);
                            }
                        }
                    }

                    return {
                        id: item.product_id,
                        name: item.product_name,
                        category_name: item.category_name,
                        selling_price: parseFloat(item.price),
                        actual_price: actual_price,
                        available_qty: availQty,
                        cart_qty: finalQty,
                        amount: parseFloat(item.amount),
                        unit: item.unit || "L",
                        customer_id: orderDetails.customer_id,
                        customer_name: orderDetails.customer_name,
                        discount: item.discount || 0,
                        description: item.description || "",
                        destination: item.destination || "",
                        pre_order_remaining: reqQty,
                        pre_order_original: parseFloat(item.qty)
                    };
                });

                if (issues.length > 0) {
                    // Warning removed as requested
                    console.warn("Stock Adjusted:", issues);
                }

                setCartState(prev => ({
                    ...prev,
                    cart_list: newCartItems
                }));

                setObjSummary(prev => ({
                    ...prev,
                    customer_id: orderDetails.customer_id,
                    customer_name: orderDetails.customer_name,
                    customer_address: orderDetails.delivery_address || "",
                    customer_tel: orderDetails.customer_tel || "",
                    pre_order_id: orderDetails.id,
                    pre_order_no: orderDetails.pre_order_no,
                    order_date: dayjs().format("YYYY-MM-DD"),
                    delivery_date: orderDetails.delivery_date
                        ? dayjs(orderDetails.delivery_date).format("YYYY-MM-DD")
                        : prev.delivery_date
                }));

                setSelectedPreOrder(orderDetails);
                setSelectedLocation(orderDetails.location_name || orderDetails.location_id || null);
                setSelectedTruck(orderDetails.truck_id || null);
                setIsModalVisible(true);
                messageApi.success(`✅ បានផ្ទុក Pre-Order សម្រាប់ ${orderDetails.customer_name}`);
            }
        } catch (error) {
            console.error("Error loading pre-order:", error);
            messageApi.error("មិនអាចផ្ទុក Pre-Order បានទេ");
        } finally {
            setLoading(false);
        }
    };

    // Handle Modal Actions
    const handleClearCart = () => {
        setCartState(prev => ({ ...prev, cart_list: [] }));
        setObjSummary({
            sub_total: 0,
            total_qty: 0,
            save_discount: 0,
            tax: 10,
            total: 0,
            customer_id: null,
            customer_name: null,
            customer_address: null,
            customer_tel: null,
            user_id: null,
            remark: null,
            order_no: null,
            order_date: null,
            delivery_date: null,
            receive_date: null,
            pre_order_id: null,
            pre_order_no: null,
        });
        setSelectedLocations([]);
        setSelectedLocation(null);
        setSelectedTruck(null);
    };

    const handleQuantityChange = (newQty, itemId) => {
        if (!newQty || newQty < 0) newQty = 0;

        // Audio removed

        const newCartList = cartState.cart_list.map(item => {
            if (item.id === itemId) {
                const availQty = parseFloat(item.available_qty || 0);
                const requestedQty = Number(newQty);

                // Allow user to type any quantity, validation will be handled in the UI
                return { ...item, cart_qty: requestedQty };
            }
            return item;
        });

        setCartState(prev => ({ ...prev, cart_list: newCartList }));
    };

    const handleRemoveCartItem = (itemId) => {
        const newCartList = cartState.cart_list.filter(item => item.id !== itemId);
        setCartState(prev => ({ ...prev, cart_list: newCartList }));

        if (newCartList.length === 0) {
            setObjSummary(prev => ({
                ...prev,
                customer_id: null,
                customer_name: null,
                customer_address: null,
                customer_tel: null,
                pre_order_id: null,
            }));
        }
    };

    const handleClickOut = async () => {
        if (!cartState.cart_list.length) {
            message.error(t("cart_is_empty"));
            return;
        }

        if (!selectedLocation) {
            message.error("សូមជ្រើសរើសទីតាំងដឹកជញ្ជូន");
            return;
        }

        setIsCheckingOut(true);

        try {
            const order_details = cartState.cart_list.map((item) => {
                const qty = Number(item.cart_qty) || 0;
                const price = Number(item.selling_price) || 0;
                const actualPrice = Number(item.actual_price) || 1;
                const discount = Number(item.discount) || 0;
                const total = (qty * price * (1 - discount / 100)) / actualPrice;

                return {
                    product_id: item.id,
                    qty: qty,
                    price: price,
                    discount: discount,
                    total: total,
                    actual_price: actualPrice,
                    description: item.description || '',
                    destination: item.destination || null
                };
            });

            const totalAmount = order_details.reduce((sum, item) => sum + item.total, 0);

            const customerInfo = {
                customer_id: objSummary.customer_id || null,
                customer_name: objSummary.customer_name || cartState.cart_list[0]?.customer_name || null,
                customer_address: objSummary.customer_address || cartState.cart_list[0]?.customer_address || null,
                customer_tel: objSummary.customer_tel || cartState.cart_list[0]?.customer_tel || null,
            };

            const param = {
                order: {
                    ...customerInfo,
                    location_id: selectedLocation,
                    truck_id: selectedTruck,
                    locations: selectedLocations,
                    user_id: Number(objSummary.user_id) || null,
                    total_amount: totalAmount,
                    payment_method: "Other",
                    remark: objSummary.remark || "No remark",
                    order_date: objSummary.order_date || dayjs().format('YYYY-MM-DD'),
                    delivery_date: objSummary.delivery_date || objSummary.order_date || dayjs().format('YYYY-MM-DD'),
                    receive_date: objSummary.receive_date || null,
                    pre_order_id: objSummary.pre_order_id || null,
                },
                order_details: order_details,
            };

            const res = await request("order", "post", param);

            if (res && !res.error && res.order) {
                message.success("✅ Order បានបង្កើតជោគជ័យ!");

                setObjSummary(prev => ({
                    ...prev,
                    ...customerInfo,
                    order_no: res.order?.order_no,
                    pre_order_no: res.order?.pre_order_no,
                    order_date: res.order?.order_date,
                    delivery_date: res.order?.delivery_date
                }));

                fetchPreOrders();
                fetchStockStats();

                // Close modal and show print preview
                setTimeout(() => {
                    setIsModalVisible(false);
                    setShowPreviewModal(true);
                    // Cart will be cleared when Preview Modal is closed
                }, 1000);
            } else {
                message.error("មិនអាចបង្កើត Order បានទេ");
            }
        } catch (error) {
            console.error("Order creation error:", error);
            message.error("មិនអាចបង្កើត Order បានទេ");
        } finally {
            setTimeout(() => {
                setIsCheckingOut(false);
            }, 2000);
        }
    };

    // Filter Pre-Orders
    const filteredPreOrders = preOrders.filter(preOrder => {
        const searchTerm = filter.txt_search.toLowerCase();
        const matchesName = (preOrder.customer_name || "").toLowerCase().includes(searchTerm);
        const matchesOrderNo = (preOrder.pre_order_no || "").toLowerCase().includes(searchTerm);
        return matchesName || matchesOrderNo;
    });

    // Table Columns
    const columns = [
        {
            title: <span className="font-semibold text-base">{t('pos.invoice')}</span>,
            dataIndex: "pre_order_no",
            key: "pre_order_no",
            width: 200,
            fixed: 'left',
            render: (text) => (
                <Tag color="blue" style={{ fontSize: '14px', fontWeight: '700', padding: '6px 16px', borderRadius: '8px' }}>
                    {text}
                </Tag>
            ),
        },
        {
            title: <span className="font-semibold text-base">{t('pos.customer')}</span>,
            dataIndex: "customer_name",
            key: "customer_name",
            width: 280,
            render: (text, record) => (
                <div className="customer-cell">
                    <div className="customer-avatar">
                        {text?.charAt(0) || "C"}
                    </div>
                    <div className="customer-info">
                        <div className="customer-name">{text || "N/A"}</div>
                        <div className="customer-tel">{record.customer_tel}</div>
                    </div>
                </div>
            ),
        },
        {
            title: <span className="font-semibold text-base">{t('pos.delivery_date')}</span>,
            dataIndex: "delivery_date",
            key: "delivery_date",
            width: 160,
            align: 'center',
            render: (date) => (
                <div className="delivery-date-cell">
                    📅 {date ? dayjs(date).format('DD/MM/YYYY') : 'N/A'}
                </div>
            ),
        },
        {
            title: <span className="font-semibold text-base">{t('pos.total_price')}</span>,
            dataIndex: "total_amount",
            key: "total_amount",
            width: 180,
            align: 'right',
            render: (amount) => (
                <div className="total-price-cell">
                    {formatPrice(amount)}
                </div>
            )
        },
        {
            title: <span className="font-semibold text-base">{t('pos.status')}</span>,
            dataIndex: "status",
            key: "status",
            width: 140,
            align: 'center',
            render: (status) => {
                const statusClass = status === 'ready' ? 'status-tag-ready' : 'status-tag-confirmed';
                const statusText = status === 'ready' ? 'រៀបចំរួច' : 'បានបញ្ជាក់';
                return (
                    <Tag className={`status-tag ${statusClass}`}>
                        {statusText}
                    </Tag>
                );
            }
        },
        {
            title: <span className="font-semibold text-base">{t('pos.actions')}</span>,
            key: "action",
            width: 280,
            align: 'center',
            fixed: 'right',
            render: (text, record) => (
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <Button
                        className="action-btn-view"
                        size="large"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleLoadPreOrder(record);
                        }}
                        icon={<EyeOutlined />}
                    >
                        {t('view')}
                    </Button>
                    <Button
                        className="action-btn-add"
                        type="primary"
                        size="large"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleLoadPreOrder(record);
                        }}
                        icon={<FaBox />}
                    >
                        {t('pos.add_to_cart')}
                    </Button>
                </div>
            )
        }
    ];

    return (
        <App>
            {contextHolder}
            <div className="pre-orders-full-view">
                {/* Header Section */}
                <div className="page-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                            <h1 className="header-title">
                                📦 {t('pos.pre_orders_ready')}
                            </h1>
                            <p className="header-subtitle">
                                {t('pos.pre_orders_ready_subtitle')}
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <Input.Search
                                style={{ width: 300 }}
                                onChange={(e) => setFilter(p => ({ ...p, txt_search: e.target.value }))}
                                allowClear
                                placeholder={t('ស្វែងរកតាមឈ្មោះ ឬ លេខប័ណ្ណ #...')}
                                size="large"
                            />
                            <Button
                                onClick={fetchPreOrders}
                                className="refresh-btn"
                                icon={<ReloadOutlined />}
                                size="large"
                            >
                                {t('Refresh')}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stock Overview */}
                {stockStats && stockStats.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                        <div className="stock-cards-grid" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '16px'
                        }}>
                            {stockStats.map((item, idx) => {
                                const stock = parseFloat(item.total_qty || 0);
                                const isLow = stock <= 1000;

                                const fuelType = item.product_name.toLowerCase();
                                let typeClass = "stock-card-default";

                                if (fuelType.includes('ហ្កាស') || fuelType.includes('lpg')) {
                                    typeClass = "stock-card-lpg";
                                } else if (fuelType.includes('សាំង') || fuelType.includes('gasoline')) {
                                    typeClass = "stock-card-gasoline";
                                } else if (fuelType.includes('ម៉ាស៊ូត') || fuelType.includes('diesel')) {
                                    typeClass = "stock-card-diesel";
                                }

                                return (
                                    <div
                                        key={idx}
                                        className={`stock-card ${typeClass} ${isLow ? 'low-stock-pulse-glow' : ''}`}
                                        style={{
                                            padding: '24px',
                                            borderRadius: '16px',
                                            textAlign: 'center',
                                            transition: 'all 0.3s ease',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <div className="stock-card-title">
                                            {item.product_name}
                                        </div>
                                        <div className="stock-card-value">
                                            {formatQty(stock)} <span style={{ fontSize: '16px' }}>L</span>
                                        </div>
                                        {isLow && (
                                            <div className="stock-card-low-label">
                                                ⚠️ ស្តុកទាប
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Main Table */}
                <div className="table-container">
                    <Table
                        dataSource={filteredPreOrders}
                        columns={columns}
                        loading={loading}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showTotal: (total) => `សរុប ${total} ប័ណ្ណ`
                        }}
                        rowKey="id"
                        scroll={{ x: 1400 }}
                        onRow={(record) => ({
                            style: { cursor: 'pointer' },
                            onClick: () => handleLoadPreOrder(record),
                        })}
                        rowClassName="table-row-hover"
                    />
                </div>

                {/* Order Details Modal */}
                <Modal
                    title={null}
                    open={isModalVisible}
                    onCancel={() => {
                        setIsModalVisible(false);
                        handleClearCart();
                    }}
                    footer={null}
                    width="90%"
                    style={{ top: 20, maxWidth: 1700 }}
                    styles={{ body: { padding: 0 } }}
                    closeIcon={<FaTimes style={{ fontSize: '20px', color: '#ff4d4f' }} />}
                >
                    <div className="modal-custom-header">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 className="modal-header-title">
                                    🛒 {t('pos.order_details')}
                                </h2>

                            </div>
                            <Badge count={cartState.cart_list.length} showZero>
                                <ShoppingCartOutlined className="modal-cart-icon" />
                            </Badge>
                        </div>
                    </div>

                    <div style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
                        <IntegratedInvoiceSidebar
                            t={t}
                            cartItems={cartState.cart_list}
                            objSummary={objSummary}
                            selectedLocations={selectedLocations}
                            setSelectedLocations={setSelectedLocations}
                            setObjSummary={setObjSummary}
                            customers={customers}
                            handleClearCart={handleClearCart}
                            handleQuantityChange={handleQuantityChange}
                            handleClickOut={handleClickOut}
                            handleRemoveCartItem={handleRemoveCartItem}
                            isDisabled={false}
                            isCheckingOut={isCheckingOut}
                            setState={setCartState}
                            selectedLocation={selectedLocation}
                            setSelectedLocation={setSelectedLocation}
                            selectedTruck={selectedTruck}
                            setSelectedTruck={setSelectedTruck}
                            trucks={trucks}
                            setShowPreviewModal={setShowPreviewModal}
                        />
                    </div>
                </Modal>

                {/* Preview Modal */}
                <Modal
                    open={showPreviewModal}
                    onCancel={() => {
                        setShowPreviewModal(false);
                        if (!isModalVisible) handleClearCart();
                    }}
                    footer={[
                        <Button key="back" onClick={() => {
                            setShowPreviewModal(false);
                            if (!isModalVisible) handleClearCart();
                        }}>
                            {t("close")}
                        </Button>,
                        <Button
                            key="print"
                            type="primary"
                            onClick={() => {
                                window.print();
                            }}
                        >
                            {t("print")}
                        </Button>
                    ]}
                    width={1000}
                    styles={{ body: { padding: '20px', backgroundColor: '#f5f5f5' } }}
                >
                    <div style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                        <PrintInvoice
                            ref={componentRef}
                            objSummary={{
                                ...objSummary,
                                total: formatPrice(cartState.cart_list.reduce((sum, item) => {
                                    const qty = Number(item.cart_qty || 0);
                                    const selling = Number(item.selling_price || 0);
                                    const actual = Number(item.actual_price || 1);
                                    const discount = Number(item.discount || 0) / 100;
                                    return sum + (qty * selling * (1 - discount)) / actual;
                                }, 0))
                            }}
                            cart_list={cartState.cart_list.map(item => ({
                                ...item,
                                destination: (item.destination === "Petronas Cambodia" || item.destination === "Petronas") ? null : item.destination
                            }))}
                            selectedLocations={selectedLocations}
                        />
                    </div>
                </Modal>
            </div>
        </App>
    );
};

export default PreOrdersFullView;