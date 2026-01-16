import React, { useState, useEffect } from "react";
import {
    ShoppingCart,
    Trash2,
    MapPin,
    User,
    Calendar,
    FileText,
    Package,
    X,
    AlertTriangle,
    Truck,
    Eye
} from "lucide-react";
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { Button, message } from "antd";
import { useTranslation } from "../../locales/TranslationContext";
import LocationSelector from "../delivery/Locationselector";

// Extend dayjs with custom parse format
dayjs.extend(customParseFormat);

// Load Kantumruy Pro font


const loadKantumruyProFont = () => {
    if (document.querySelector('link[href*="Kantumruy"]')) {
        return;
    }

    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Kantumruy+Pro:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.textContent = `
        :root {
            --font-kantumruy: 'Kantumruy Pro', system-ui, -apple-system, sans-serif;
        }
        
        .khmer-text {
            font-family: var(--font-kantumruy);
            font-feature-settings: 'liga' 1, 'kern' 1;
        }
        
        .khmer-text-light {
            font-family: var(--font-kantumruy);
            font-weight: 300;
        }
        
        .khmer-text-medium {
            font-family: var(--font-kantumruy);
            font-weight: 500;
        }
        
        .khmer-text-semibold {
            font-family: var(--font-kantumruy);
            font-weight: 600;
        }
        
        .khmer-text-bold {
            font-family: var(--font-kantumruy);
            font-weight: 700;
        }
        
        [class*="khmer"] {
            line-height: 1.6;
            letter-spacing: 0.02em;
        }

        /* Custom scrollbar */
        .scrollbar-custom::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }

        .scrollbar-custom::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 4px;
        }

        .scrollbar-custom::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
            transition: background 0.2s;
        }

        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }

        /* Dark mode scrollbar styles */
        .dark .scrollbar-custom::-webkit-scrollbar-track {
            background: #1e293b;
        }

        .dark .scrollbar-custom::-webkit-scrollbar-thumb {
            background: #475569;
        }

        .dark .scrollbar-custom::-webkit-scrollbar-thumb:hover {
            background: #64748b;
        }

        /* Dark mode Khmer text improvements */
        .dark .khmer-text,
        .dark .khmer-text-light,
        .dark .khmer-text-medium,
        .dark .khmer-text-semibold,
        .dark .khmer-text-bold {
            color: #f1f5f9;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .dark [class*="khmer"] {
            color: #e2e8f0;
        }

        /* Smooth animations */
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .animate-slide-in {
            animation: slideIn 0.3s ease-out;
        }
    `;
    document.head.appendChild(style);
};

const convertToDisplayFormat = (dateStr) => {
    if (!dateStr) return '';
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dayjs(dateStr).format('DD/MM/YYYY');
    }
    if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        return dateStr;
    }
    return dayjs(dateStr).format('DD/MM/YYYY');
};

// Custom Alert Modal Component
const AlertModal = ({ isOpen, onClose, onConfirm, title, message, type = "warning", t }) => {
    if (!isOpen) return null;

    const getTypeStyles = () => {
        switch (type) {
            case "danger":
                return {
                    icon: <Trash2 className="w-10 h-10 sm:w-12 sm:h-12 text-red-500" />,
                    bgColor: "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20",
                    borderColor: "border-red-300 dark:border-red-700",
                    confirmBg: "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 dark:from-red-500 dark:to-red-600 dark:hover:from-red-600 dark:hover:to-red-700",
                    cancelBg: "bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-500"
                };
            case "warning":
            default:
                return {
                    icon: <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500" />,
                    bgColor: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20",
                    borderColor: "border-amber-300 dark:border-amber-700",
                    confirmBg: "bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 dark:from-amber-500 dark:to-amber-600 dark:hover:from-amber-600 dark:hover:to-amber-700",
                    cancelBg: "bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-500"
                };
        }
    };

    const styles = getTypeStyles();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 dark:bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-slide-in">
                <div className={`${styles.bgColor} ${styles.borderColor} border-b-2 p-6`}>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                            <div className="flex-shrink-0 p-2 bg-white dark:bg-slate-700 rounded-xl shadow-md">
                                {styles.icon}
                            </div>
                            <div className="flex-1 min-w-0 pt-1">
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 break-words khmer-text-bold">
                                    {title}
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-2 break-words khmer-text">
                                    {message}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-1.5 hover:bg-white/50 dark:hover:bg-slate-700/50 rounded-lg flex-shrink-0"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="p-6">
                    <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                        <button
                            onClick={onClose}
                            className={`w-full sm:w-auto px-6 py-3 ${styles.cancelBg} text-gray-800 dark:text-gray-100 rounded-xl font-semibold transition-all text-sm sm:text-base hover:shadow-md khmer-text-semibold`}
                        >
                            {t("cancel")}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`w-full sm:w-auto px-6 py-3 ${styles.confirmBg} text-white rounded-xl font-semibold transition-all text-sm sm:text-base shadow-md hover:shadow-lg khmer-text-semibold`}
                        >
                            {t("confirm")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Section Header Component for better organization
const SectionHeader = ({ icon: Icon, title, badge = null, className = "" }) => (
    <div className={`flex items-center justify-between mb-3 ${className}`}>
        <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 khmer-text-semibold">
                {title}
            </span>
        </div>
        {badge && (
            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full khmer-text">
                {badge}
            </span>
        )}
    </div>
);

const IntegratedInvoiceSidebar = ({
    cartItems = [],
    preOrders = [], // ✅ New: List of pending pre-orders
    handleLoadPreOrder = () => { }, // ✅ New: Quick load function
    objSummary = {},
    selectedLocations = "",
    setSelectedLocations = () => { },
    setObjSummary = () => { },
    customers = [],
    handleClearCart = () => { },
    handleQuantityChange = () => { },
    handlePriceChange = () => { },
    handleClickOut = () => { },
    isDisabled = false,
    isCheckingOut,
    invoiceBackup = null,
    setShowReprintModal = () => { },
    setShowPreviewModal = () => { },
    setState = () => { },
    selectedLocation = null,
    setSelectedLocation = () => { },
    selectedTruck = null,
    setSelectedTruck = () => { }
}) => {
    const { t, language } = useTranslation();

    useEffect(() => {
        if (objSummary.customer_address && selectedLocations.length === 0 && cartItems.length > 0) {
            setSelectedLocations([objSummary.customer_address]);
        }
    }, [objSummary.customer_address, cartItems.length]);

    useEffect(() => {
        loadKantumruyProFont();
    }, []);

    const [alertModal, setAlertModal] = useState({
        isOpen: false,
        type: "warning",
        title: "",
        message: "",
        onConfirm: null
    });

    const totalQuantity = objSummary.total_qty || 0;
    const totalAmount = cartItems.reduce((sum, item) => {
        const qty = Number(item.cart_qty || 0);
        const selling = Number(item.selling_price || 0);
        const actual = Number(item.actual_price || 1);
        const discount = Number(item.discount || 0) / 100;
        const total = (qty * selling * (1 - discount)) / actual;  // ✅ Factor in discount
        return sum + total;
    }, 0);

    const handlePreviewClick = () => {
        if (cartItems.length === 0) {
            message.error(t("cart_is_empty"));
            return;
        }

        setShowPreviewModal(true);
    };

    const showAlert = (type, title, message, onConfirm) => {
        setAlertModal({
            isOpen: true,
            type,
            title,
            message,
            onConfirm
        });
    };

    const closeAlert = () => {
        setAlertModal({
            isOpen: false,
            type: "warning",
            title: "",
            message: "",
            onConfirm: null
        });
    };

    const handleAlertConfirm = () => {
        if (alertModal.onConfirm) {
            alertModal.onConfirm();
        }
        closeAlert();
    };

    const updatePrice = (itemId, newPrice) => {
        if (!itemId) {
            console.error('No itemId provided to updatePrice');
            return;
        }

        const item = cartItems.find(item => item.id === itemId);
        if (!item) {
            console.error('Item not found in cart:', itemId);
            return;
        }

        if (isNaN(newPrice) || newPrice < 0) {
            console.error('Invalid price:', newPrice);
            return;
        }

        try {
            handlePriceChange(newPrice, itemId);
        } catch (error) {
            console.error('Error updating price:', error);
        }
    };

    const handleClearCartClick = () => {
        if (cartItems.length === 0) return;

        showAlert(
            "danger",
            t("clear_cart"),
            t("clear_cart_confirm_message")
                .replace("{count}", cartItems.length),
            () => {
                try {
                    handleClearCart();
                } catch (error) {
                    console.error('Error clearing cart:', error);
                    showAlert(
                        "danger",
                        t("error"),
                        t("failed_clear_cart"),
                        null
                    );
                }
            }
        );
    };

    const handleRemoveItem = (itemId) => {
        const item = cartItems.find(item => item.id === itemId);
        const itemName = item?.name || t("item");
        const itemQty = item?.cart_qty || 0;

        showAlert(
            "danger",
            t("remove_item"),
            t("remove_item_confirm")
                .replace("{item}", itemName)
                .replace("{qty}", Number(itemQty).toLocaleString()),
            () => {
                try {
                    const newCartList = cartItems.filter(item => item.id !== itemId);
                    setState(prev => ({
                        ...prev,
                        cart_list: newCartList
                    }));
                } catch (error) {
                    console.error('Error removing item:', error);
                    showAlert(
                        "danger",
                        t("error"),
                        t("failed_remove_item"),
                        null
                    );
                }
            }
        );
    };

    const getMonthNames = () => {
        if (language === 'km') {
            return ['មករា', 'កម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
                'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
        }
        return ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
    };

    return (
        <>
            <div className="w-full max-w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl dark:shadow-slate-900/50 overflow-hidden border-2 border-gray-100 dark:border-slate-700">
                {/* Enhanced Header with Gradient */}
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-500 dark:via-indigo-500 dark:to-purple-500 p-5 text-white relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0" style={{
                            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                            backgroundSize: '24px 24px'
                        }} />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                                    <ShoppingCart className="w-6 h-6" />
                                </div>
                                <div>
                                    <span className="text-base font-bold khmer-text-bold block">
                                        {objSummary.pre_order_id ? `${t("processing_pre_order") || "Processing Draft"} #` : t("items_in_cart")}
                                    </span>
                                    <span className="text-xs text-white/80 khmer-text">
                                        {objSummary.pre_order_id
                                            ? (preOrders.find(po => po.id === objSummary.pre_order_id)?.pre_order_no || `Pre-Order #${objSummary.pre_order_id}`)
                                            : `${cartItems.length} ${t("items")}`
                                        }
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {invoiceBackup && (
                                    <button
                                        onClick={() => setShowReprintModal(true)}
                                        className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-all text-sm khmer-text-medium shadow-lg hover:shadow-xl"
                                        title={t("reprint")}
                                    >
                                        <span className="text-lg">🖨️</span>
                                        <span className="hidden sm:inline font-semibold">F3</span>
                                    </button>
                                )}
                                <button
                                    onClick={handleClearCartClick}
                                    disabled={cartItems.length === 0}
                                    className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed backdrop-blur-sm rounded-xl transition-all text-sm khmer-text-medium shadow-lg hover:shadow-xl"
                                    title={t("clear_cart")}
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span className="hidden sm:inline font-semibold">{t("clear_cart")}</span>
                                </button>
                            </div>
                        </div>

                        {/* Enhanced Summary Cards */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/20 shadow-lg">
                                <div className="text-white/90 text-xs uppercase tracking-wider khmer-text mb-1">
                                    {t("total_qty")}
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold khmer-text-bold">
                                        {Number(totalQuantity).toLocaleString()}
                                    </span>
                                    <span className="text-sm font-medium text-white/80 khmer-text">
                                        {totalQuantity >= 1000 ? `L (≈${(totalQuantity / 1000).toFixed(2)}T)` : 'L'}
                                    </span>
                                </div>
                            </div>
                            <div className="bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/20 shadow-lg">
                                <div className="text-white/90 text-xs uppercase tracking-wider khmer-text mb-1">
                                    {t("total_amount")}
                                </div>
                                <div className="text-2xl font-bold khmer-text-bold">
                                    ${Number(totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area with Better Spacing */}
                <div className="p-5 bg-gradient-to-br from-gray-50 to-white dark:from-slate-800 dark:to-slate-900 space-y-5">
                    {/* Pre-Orders Quick Selection (Sale Orders) */}
                    {preOrders && preOrders.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-2 border-orange-100 dark:border-orange-900/30 animate-pulse-subtle">
                            <SectionHeader
                                icon={FileText}
                                title={t("pending_pre_orders") || "Sale Orders (Draft)"}
                                badge={`${preOrders.length}`}
                                className="!mb-2"
                            />
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-custom">
                                {preOrders.map((order) => (
                                    <button
                                        key={`preorder-${order.id}-${index}`}
                                        onClick={() => handleLoadPreOrder(order)}
                                        className="flex-shrink-0 flex flex-col items-start p-3 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800 rounded-xl hover:shadow-md hover:scale-105 transition-all duration-200 min-w-[140px]"
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                            <span className="text-xs font-bold text-orange-700 dark:text-orange-400 khmer-text-bold truncate">
                                                {order.customer_name}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                                            {order.pre_order_no}
                                        </span>
                                        <div className="mt-2 text-xs font-bold text-gray-800 dark:text-gray-200">
                                            {formatPrice ? formatPrice(order.total_amount) : `$${order.total_amount}`}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Cart Items Section */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border border-gray-100 dark:border-slate-700">
                        <SectionHeader
                            icon={Package}
                            title={t("cart_items")}
                            badge={`${cartItems.length} ${t("items")}`}
                        />

                        <div className="max-h-64 overflow-y-auto space-y-3 scrollbar-custom">
                            {cartItems.length === 0 ? (
                                <div className="text-center py-10">
                                    <div className="inline-flex p-4 bg-gray-100 dark:bg-slate-700 rounded-full mb-3">
                                        <Package className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 khmer-text-medium">
                                        {t("cart_empty")}
                                    </p>
                                </div>
                            ) : (
                                cartItems.map((item, index) => {
                                    const getCategoryColor = (category) => {
                                        const categoryColors = {
                                            'ហ្កាស(LPG)': {
                                                bg: 'bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/20',
                                                border: 'border-yellow-300 dark:border-yellow-700',
                                                badge: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700'
                                            },
                                            'ប្រេងសាំងធម្មតា(EA)': {
                                                bg: 'bg-gradient-to-br from-cyan-50 to-blue-100 dark:from-cyan-900/20 dark:to-blue-900/20',
                                                border: 'border-cyan-300 dark:border-cyan-700',
                                                badge: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700'
                                            },
                                            'ប្រេងម៉ាស៊ូត(Do)': {
                                                bg: 'bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20',
                                                border: 'border-green-300 dark:border-green-700',
                                                badge: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700'
                                            },
                                            'ប្រេងសាំងស៊ុបពែរ(Super)': {
                                                bg: 'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20',
                                                border: 'border-blue-300 dark:border-blue-700',
                                                badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                                            },
                                            'default': {
                                                bg: 'bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-800 dark:to-slate-800',
                                                border: 'border-gray-300 dark:border-gray-700',
                                                badge: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700'
                                            }
                                        };
                                        return categoryColors[category] || categoryColors['default'];
                                    };

                                    const colors = getCategoryColor(item.category_name);

                                    return (
                                        <div
                                            key={`cart-item-${item.id}-${index}`}
                                            className={`${colors.bg} ${colors.border} border-2 rounded-xl p-4 hover:shadow-lg dark:hover:shadow-slate-900/50 transition-all duration-200 animate-slide-in`}
                                        >
                                            {/* Header - Category & Price */}
                                            <div className="flex justify-between items-start mb-3 gap-3">
                                                <div className="flex-1 min-w-0">
                                                    {/* Category badge */}
                                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold khmer-text-semibold ${colors.badge} border mb-2`}>
                                                        <span className="w-2 h-2 rounded-full bg-current opacity-60"></span>
                                                        {item.name}
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    {/* ✅ FIXED: Use selling_price for calculation */}
                                                    <div className="text-xl font-bold text-green-600 dark:text-green-400 mb-2">
                                                        ${Number(
                                                            (item.cart_qty || 0) * (item.selling_price || 0) * (1 - (item.discount || 0) / 100) / (item.actual_price || 1)
                                                        ).toLocaleString('en-US', {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2
                                                        })}
                                                    </div>
                                                    {item.discount > 0 && (
                                                        <div className="text-[10px] text-orange-500 font-bold bg-orange-50 px-1 rounded inline-block">
                                                            -{item.discount}%
                                                        </div>
                                                    )}
                                                    <button
                                                        onClick={() => handleRemoveItem(item.id)}
                                                        className="p-2 text-red-500 dark:text-red-400 hover:text-white hover:bg-red-500 dark:hover:bg-red-600 rounded-lg transition-all shadow-sm hover:shadow-md"
                                                        title={t("remove_item")}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Input Fields */}
                                            <div className="grid grid-cols-2 gap-3">
                                                {/* Quantity Input */}
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 khmer-text-medium flex items-center justify-between gap-1 w-full">
                                                        <span className="flex items-center gap-1">
                                                            <Package className="w-3 h-3" />
                                                            {t("quantity")}
                                                        </span>
                                                        {/* ✅ Stock Visibility */}
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${Number(item.available_qty || 0) <= 1000 ? 'bg-red-50 text-red-600 border border-red-100 animate-pulse' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                                            ស្តុក: {Number(item.available_qty || 0).toLocaleString()} L
                                                        </span>
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            value={item.cart_qty === null || item.cart_qty === undefined ? '' : item.cart_qty}
                                                            step="0.001"
                                                            min="0"
                                                            disabled={true}
                                                            className="w-full pl-8 pr-3 py-2.5 text-sm border-2 border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 rounded-lg cursor-not-allowed font-semibold"
                                                            title="មានតែ Admin ទេដែលអាចកែប្រែតម្លៃនេះ ក្នុង Inventory Transaction Page"
                                                        />

                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 font-medium">L</span>
                                                    </div>
                                                </div>

                                                {/* ✅ FIXED: Selling Price Input (Disabled) */}
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 khmer-text-medium flex items-center gap-1">
                                                        <span>💲</span>
                                                        {t("selling_price")}
                                                        <span className="ml-1 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded text-xs flex items-center gap-1">
                                                            🔒 <span className="hidden sm:inline">Admin</span>
                                                        </span>
                                                    </label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400 font-semibold">$</span>
                                                        <input
                                                            type="number"
                                                            value={item.selling_price === null || item.selling_price === undefined ? '' : item.selling_price}
                                                            step="0.001"
                                                            min="0"
                                                            disabled={true}
                                                            className="w-full pl-8 pr-3 py-2.5 text-sm border-2 border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 rounded-lg cursor-not-allowed font-semibold"
                                                            title="មានតែ Admin ទេដែលអាចកែប្រែតម្លៃនេះ ក្នុង Inventory Transaction Page"
                                                        />
                                                    </div>

                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Customer Information Section */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border border-gray-100 dark:border-slate-700">
                        <SectionHeader icon={User} title={t("customer_information")} />

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 khmer-text-medium">
                                    {/* {t("customer_selection")} */}
                                </label>
                                <select
                                    disabled={true}
                                    value={objSummary.customer_id === null ? "GENERAL_STOCK" : (objSummary.customer_id || "")}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === "GENERAL_STOCK") {
                                            // ✅ Handle General Stock Selection
                                            setObjSummary(prev => ({
                                                ...prev,
                                                customer_id: null, // General Stock uses null ID
                                                customer_name: t("general_stock") || "ស្តុកក្រុមហ៊ុន",
                                                customer_address: "-",
                                                customer_tel: "-",
                                            }));
                                        } else {
                                            const selectedCustomer = customers.find(c => c.value === Number(value) || c.value === value);
                                            if (selectedCustomer) {
                                                setObjSummary(prev => ({
                                                    ...prev,
                                                    customer_id: selectedCustomer.value,
                                                    customer_name: selectedCustomer.name,
                                                    customer_address: selectedCustomer.address,
                                                    customer_tel: selectedCustomer.tel,
                                                }));
                                            }
                                        }
                                    }}
                                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-sm bg-white khmer-text font-medium transition-all"
                                >
                                    <option value="">{t("select_customer")}</option>
                                    {/* ✅ Add General Stock Option */}
                                    <option value="GENERAL_STOCK" className="khmer-text font-bold text-amber-600">
                                        {t("general_stock") || "ស្តុកក្រុមហ៊ុន"}
                                    </option>
                                    {customers.map((customer) => (
                                        <option key={`customer-option-${customer.value}`} value={customer.value} className="khmer-text">
                                            {customer.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Location & Delivery Section */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border border-gray-100 dark:border-slate-700">
                        <SectionHeader icon={MapPin} title={t("location_delivery")} />

                        <div className="space-y-4">
                            {/* Manual Location Input */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 khmer-text-medium flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-green-500" />
                                    {t("destination_location")}
                                    {selectedLocations.length > 0 && objSummary.customer_address && (
                                        <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full khmer-text flex items-center gap-1">
                                            <span>✓</span>
                                            <span>បានបំពេញស្វ័យប្រវត្តិ</span>
                                        </span>
                                    )}
                                </label>
                                <textarea
                                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent resize-none text-sm khmer-text transition-all"
                                    placeholder={t("enter_locations")}
                                    value={Array.isArray(selectedLocations) ? selectedLocations.join(', ') : selectedLocations}
                                    onChange={(e) => {
                                        const input = e.target.value;
                                        if (input.trim() === '') {
                                            setSelectedLocations([]);
                                        } else {
                                            const values = input.split(/[,]+/).filter(Boolean).map(v => v.trim());
                                            setSelectedLocations(values);
                                        }
                                    }}
                                    rows={2}
                                />
                                {selectedLocations.length > 0 && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-1 khmer-text">
                                        <span>📍</span>
                                        <span>ទីតាំងចំនួន: <strong>{selectedLocations.length}</strong></span>
                                    </p>
                                )}
                            </div>

                            {/* Location Selector Component */}
                            {objSummary.customer_id && (
                                <div className="pt-3 border-t-2 border-gray-100 dark:border-slate-700">
                                    <LocationSelector
                                        customerId={objSummary.customer_id}
                                        selectedLocation={selectedLocation}
                                        onLocationChange={setSelectedLocation}
                                        selectedTruck={selectedTruck}
                                        onTruckChange={setSelectedTruck}
                                        t={t}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Dates & Remarks Section */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border border-gray-100 dark:border-slate-700">
                        <SectionHeader icon={Calendar} title={t("dates_remarks")} />

                        <div className="space-y-4">
                            {/* Order Date */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 khmer-text-medium flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-orange-500" />
                                    {t("order_date")}
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <select
                                        value={objSummary.order_date ? dayjs(objSummary.order_date).format('DD') : ""}
                                        onChange={(e) => {
                                            const day = e.target.value;
                                            if (day && objSummary.order_date) {
                                                const currentDate = dayjs(objSummary.order_date);
                                                const newDate = currentDate.date(parseInt(day)).format('YYYY-MM-DD');
                                                setObjSummary(prev => ({ ...prev, order_date: newDate }));
                                            } else if (day) {
                                                const newDate = dayjs().date(parseInt(day)).format('YYYY-MM-DD');
                                                setObjSummary(prev => ({ ...prev, order_date: newDate }));
                                            }
                                        }}
                                        className="px-3 py-3 border-2 border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent text-sm khmer-text font-medium transition-all"
                                    >
                                        <option value="">{t("day")}</option>
                                        {Array.from({ length: 31 }, (_, i) => (
                                            <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                                                {i + 1}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        value={objSummary.order_date ? dayjs(objSummary.order_date).format('MM') : ""}
                                        onChange={(e) => {
                                            const month = e.target.value;
                                            if (month && objSummary.order_date) {
                                                const currentDate = dayjs(objSummary.order_date);
                                                const newDate = currentDate.month(parseInt(month) - 1).format('YYYY-MM-DD');
                                                setObjSummary(prev => ({ ...prev, order_date: newDate }));
                                            } else if (month) {
                                                const newDate = dayjs().month(parseInt(month) - 1).date(1).format('YYYY-MM-DD');
                                                setObjSummary(prev => ({ ...prev, order_date: newDate }));
                                            }
                                        }}
                                        className="px-3 py-3 border-2 border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent text-sm khmer-text font-medium transition-all"
                                    >
                                        <option value="">{t("month")}</option>
                                        {getMonthNames().map((month, index) => (
                                            <option key={month} value={String(index + 1).padStart(2, '0')}>
                                                {month}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        value={objSummary.order_date ? dayjs(objSummary.order_date).format('YYYY') : ""}
                                        onChange={(e) => {
                                            const year = e.target.value;
                                            if (year && objSummary.order_date) {
                                                const currentDate = dayjs(objSummary.order_date);
                                                const newDate = currentDate.year(parseInt(year)).format('YYYY-MM-DD');
                                                setObjSummary(prev => ({ ...prev, order_date: newDate }));
                                            } else if (year) {
                                                const newDate = dayjs().year(parseInt(year)).month(0).date(1).format('YYYY-MM-DD');
                                                setObjSummary(prev => ({ ...prev, order_date: newDate }));
                                            }
                                        }}
                                        className="px-3 py-3 border-2 border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent text-sm khmer-text font-medium transition-all"
                                    >
                                        <option value="">{t("year")}</option>
                                        {Array.from({ length: 10 }, (_, i) => {
                                            const year = new Date().getFullYear() - 5 + i;
                                            return (
                                                <option key={year} value={year}>
                                                    {year}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                                {objSummary.order_date && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-1 khmer-text">
                                        <span>✓</span>
                                        <span>{t("selected_date").replace("{date}", convertToDisplayFormat(objSummary.order_date))}</span>
                                    </p>
                                )}
                            </div>

                            {/* Delivery Date */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 khmer-text-medium flex items-center gap-2">
                                    <Truck className="w-3.5 h-3.5 text-green-500" />
                                    {t("delivery_date")}
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <select
                                        value={objSummary.delivery_date ? dayjs(objSummary.delivery_date).format('DD') : ""}
                                        onChange={(e) => {
                                            const day = e.target.value;
                                            if (day && objSummary.delivery_date) {
                                                const currentDate = dayjs(objSummary.delivery_date);
                                                const newDate = currentDate.date(parseInt(day)).format('YYYY-MM-DD');
                                                setObjSummary(prev => ({ ...prev, delivery_date: newDate }));
                                            } else if (day) {
                                                const newDate = dayjs().date(parseInt(day)).format('YYYY-MM-DD');
                                                setObjSummary(prev => ({ ...prev, delivery_date: newDate }));
                                            }
                                        }}
                                        className="px-3 py-3 border-2 border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent text-sm khmer-text font-medium transition-all"
                                    >
                                        <option value="">{t("day")}</option>
                                        {Array.from({ length: 31 }, (_, i) => (
                                            <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                                                {i + 1}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        value={objSummary.delivery_date ? dayjs(objSummary.delivery_date).format('MM') : ""}
                                        onChange={(e) => {
                                            const month = e.target.value;
                                            if (month && objSummary.delivery_date) {
                                                const currentDate = dayjs(objSummary.delivery_date);
                                                const newDate = currentDate.month(parseInt(month) - 1).format('YYYY-MM-DD');
                                                setObjSummary(prev => ({ ...prev, delivery_date: newDate }));
                                            } else if (month) {
                                                const newDate = dayjs().month(parseInt(month) - 1).date(1).format('YYYY-MM-DD');
                                                setObjSummary(prev => ({ ...prev, delivery_date: newDate }));
                                            }
                                        }}
                                        className="px-3 py-3 border-2 border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent text-sm khmer-text font-medium transition-all"
                                    >
                                        <option value="">{t("month")}</option>
                                        {getMonthNames().map((month, index) => (
                                            <option key={month} value={String(index + 1).padStart(2, '0')}>
                                                {month}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        value={objSummary.delivery_date ? dayjs(objSummary.delivery_date).format('YYYY') : ""}
                                        onChange={(e) => {
                                            const year = e.target.value;
                                            if (year && objSummary.delivery_date) {
                                                const currentDate = dayjs(objSummary.delivery_date);
                                                const newDate = currentDate.year(parseInt(year)).format('YYYY-MM-DD');
                                                setObjSummary(prev => ({ ...prev, delivery_date: newDate }));
                                            } else if (year) {
                                                const newDate = dayjs().year(parseInt(year)).month(0).date(1).format('YYYY-MM-DD');
                                                setObjSummary(prev => ({ ...prev, delivery_date: newDate }));
                                            }
                                        }}
                                        className="px-3 py-3 border-2 border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent text-sm khmer-text font-medium transition-all"
                                    >
                                        <option value="">{t("year")}</option>
                                        {Array.from({ length: 10 }, (_, i) => {
                                            const year = new Date().getFullYear() - 5 + i;
                                            return (
                                                <option key={year} value={year}>
                                                    {year}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                                {objSummary.delivery_date && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-1 khmer-text">
                                        <span>✓</span>
                                        <span>{t("selected_date").replace("{date}", convertToDisplayFormat(objSummary.delivery_date))}</span>
                                    </p>
                                )}
                            </div>

                            {/* Remarks */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 khmer-text-medium flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5 text-purple-500" />
                                    {t("remarks")}
                                </label>
                                <textarea
                                    value={objSummary.remark || ""}
                                    onChange={(e) => setObjSummary(prev => ({ ...prev, remark: e.target.value }))}
                                    placeholder={t("add_notes")}
                                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent resize-none text-sm khmer-text transition-all"
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Preview Button */}
                        <Button
                            size="large"
                            onClick={handlePreviewClick}
                            disabled={cartItems.length === 0}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 dark:from-purple-500 dark:to-pink-500 dark:hover:from-purple-600 dark:hover:to-pink-600 border-none shadow-lg hover:shadow-xl transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                height: '52px',
                                fontSize: '15px',
                                fontWeight: 'bold'
                            }}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Eye className="w-5 h-5" />
                                <span className="khmer-text-semibold">{t("preview")}</span>
                            </div>
                        </Button>

                        {/* Checkout Button */}
                        <Button
                            type="primary"
                            size="large"
                            onClick={handleClickOut}
                            disabled={isDisabled || isCheckingOut}
                            loading={isCheckingOut}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 border-none shadow-lg hover:shadow-xl transition-all"
                            style={{
                                height: '52px',
                                fontSize: '15px',
                                fontWeight: 'bold'
                            }}
                        >
                            <span className="khmer-text-semibold text-lg">
                                {isCheckingOut ? t("processing") : t("checkout")}
                            </span>
                        </Button>
                    </div>
                </div>

                {/* Enhanced Footer Summary */}
                <div className="bg-gradient-to-r from-slate-50 to-gray-100 dark:from-slate-800 dark:to-slate-900 p-5 border-t-2 border-gray-200 dark:border-slate-700">
                    <div className="text-center">
                        <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 khmer-text-medium">
                            {t("final_total_amount")}
                        </div>
                        <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent khmer-text-bold">
                            ${Number(totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="mt-2 flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400 khmer-text">
                            <Package className="w-3.5 h-3.5" />
                            <span>{cartItems.length} {t("items")}</span>
                            <span>•</span>
                            <span>{Number(totalQuantity).toLocaleString()} L</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Alert Modal */}
            <AlertModal
                isOpen={alertModal.isOpen}
                onClose={closeAlert}
                onConfirm={handleAlertConfirm}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
                t={t}
            />
        </>
    );
};

export default IntegratedInvoiceSidebar;