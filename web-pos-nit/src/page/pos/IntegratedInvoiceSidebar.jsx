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
    AlertTriangle
} from "lucide-react";
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { Button } from "antd";
import { useTranslation } from "../../locales/TranslationContext";

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
                    icon: <Trash2 className="w-12 h-12 text-red-500" />,
                    bgColor: "bg-red-50 dark:bg-red-900/20",
                    borderColor: "border-red-200 dark:border-red-800",
                    confirmBg: "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600",
                    cancelBg: "bg-gray-300 hover:bg-gray-400 dark:bg-slate-600 dark:hover:bg-slate-500"
                };
            case "warning":
            default:
                return {
                    icon: <AlertTriangle className="w-12 h-12 text-yellow-500" />,
                    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
                    borderColor: "border-yellow-200 dark:border-yellow-800",
                    confirmBg: "bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600",
                    cancelBg: "bg-gray-300 hover:bg-gray-400 dark:bg-slate-600 dark:hover:bg-slate-500"
                };
        }
    };

    const styles = getTypeStyles();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                <div className={`${styles.bgColor} ${styles.borderColor} border-b p-6`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            {styles.icon}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{message}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="p-6">
                    <div className="flex space-x-3 justify-end">
                        <button
                            onClick={onClose}
                            className={`px-4 py-2 ${styles.cancelBg} text-gray-700 dark:text-gray-100 rounded-lg font-medium transition-colors`}
                        >
                            {t("cancel")}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`px-4 py-2 ${styles.confirmBg} text-white rounded-lg font-medium transition-colors`}
                        >
                            {t("confirm")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const IntegratedInvoiceSidebar = ({
    cartItems = [],
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
    setState = () => { }
}) => {
    const { t, language } = useTranslation();

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
        const actual = (item.actual_price || 1);
        const total = (item.cart_qty * item.unit_price) / actual;
        return sum + total;
    }, 0);

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
        const itemName = item?.category_name || t("item");
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

    // Get month names based on language
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
            <div className="w-full max-w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl dark:shadow-slate-900/50 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-500 dark:to-indigo-600 p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <ShoppingCart className="w-6 h-6" />
                            <span className="text-lg font-semibold khmer-text-medium">
                                {t("items_in_cart")} {cartItems.length}
                            </span>
                        </div>
                        <div className="flex items-center space-x-2">
                            {invoiceBackup && (
                                <button
                                    onClick={() => setShowReprintModal(true)}
                                    className="flex items-center space-x-1 px-2 py-1 bg-white/20 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 rounded-lg transition-colors text-xs khmer-text"
                                    title={t("reprint")}
                                >
                                    <span>🖨️</span>
                                </button>
                            )}
                            <button
                                onClick={handleClearCartClick}
                                disabled={cartItems.length === 0}
                                className="flex items-center space-x-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 disabled:bg-white/10 disabled:cursor-not-allowed rounded-lg transition-colors text-sm khmer-text"
                                title={t("clear_cart")}
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>{t("clear_cart")}</span>
                            </button>
                        </div>
                    </div>

                    {/* Quick Summary */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/10 dark:bg-white/5 rounded-lg p-3">
                            <div className="text-white/80 text-xs uppercase tracking-wide khmer-text">
                                {t("total_qty")}
                            </div>
                            <div className="text-lg font-bold khmer-text-semibold">
                                {Number(totalQuantity).toLocaleString()}
                                <span className="text-sm font-normal text-white/80 ml-1 khmer-text">
                                    {totalQuantity >= 1000 ? `L (≈${(totalQuantity / 1000).toFixed(3)}T)` : 'L'}
                                </span>
                            </div>
                        </div>
                        <div className="bg-white/10 dark:bg-white/5 rounded-lg p-3">
                            <div className="text-white/80 text-xs uppercase tracking-wide khmer-text">
                                {t("total_amount")}
                            </div>
                            <div className="text-lg font-bold khmer-text-semibold">
                                ${Number(totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cart Items */}
                <div className="p-4 bg-white dark:bg-slate-800">
                    <div className="max-h-60 overflow-y-auto space-y-3 mb-6 scrollbar-dark">
                        {cartItems.length === 0 ? (
                            <div className="text-center py-8">
                                <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                <p className="text-gray-500 dark:text-gray-400 khmer-text">{t("cart_empty")}</p>
                            </div>
                        ) : (
                            cartItems.map((item, index) => {
                                const getCategoryColor = (category) => {
                                    const categoryColors = {
                                        'ហ្កាស(LPG)': { 
                                            bg: 'bg-yellow-50 dark:bg-yellow-900/20', 
                                            border: 'border-yellow-200 dark:border-yellow-800', 
                                            text: 'text-yellow-800 dark:text-yellow-300' 
                                        },
                                        'ប្រេងសាំងធម្មតា(EA)': { 
                                            bg: 'bg-cyan-50 dark:bg-cyan-900/20', 
                                            border: 'border-cyan-200 dark:border-cyan-800', 
                                            text: 'text-cyan-800 dark:text-cyan-300' 
                                        },
                                        'ប្រេងម៉ាស៊ូត(Do)': { 
                                            bg: 'bg-green-50 dark:bg-green-900/20', 
                                            border: 'border-green-200 dark:border-green-800', 
                                            text: 'text-green-800 dark:text-green-300' 
                                        },
                                        'ប្រេងសាំងស៊ុបពែរ(Super)': { 
                                            bg: 'bg-blue-50 dark:bg-blue-900/20', 
                                            border: 'border-blue-200 dark:border-blue-800', 
                                            text: 'text-blue-800 dark:text-blue-300' 
                                        },
                                        'default': { 
                                            bg: 'bg-gray-50 dark:bg-gray-800', 
                                            border: 'border-gray-200 dark:border-gray-700', 
                                            text: 'text-gray-800 dark:text-gray-300' 
                                        }
                                    };
                                    return categoryColors[category] || categoryColors['default'];
                                };

                                const colors = getCategoryColor(item.category_name);

                                return (
                                    <div key={`cart-item-${item.id}-${index}`} className={`${colors.bg} ${colors.border} border rounded-xl p-4 hover:shadow-md dark:hover:shadow-slate-900/50 transition-all`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <div className={`inline-block px-2 py-1 rounded-full text-xs khmer-text-medium ${colors.bg} ${colors.text} border ${colors.border} mb-2`}>
                                                    {item.category_name}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 khmer-text">
                                                    {t("order_date")}: {convertToDisplayFormat(objSummary.order_date) || 'N/A'} | {t("delivery_date")}: {convertToDisplayFormat(objSummary.delivery_date) || 'N/A'}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                                    ${Number((item.cart_qty || 0) * (item.unit_price || 0) / (item.actual_price || 1)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    className="mt-1 p-1 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all"
                                                    title={t("remove_item")}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                       <div className="space-y-2">
                                            <div className="space-y-2">
                                                {/* Quantity Input */}
                                                <div className="flex justify-between items-center text-sm">
                                                    <div className="flex items-center space-x-1">
                                                        <span className="khmer-text-medium text-xs text-gray-600 dark:text-gray-400">
                                                            {t("quantity")}:
                                                        </span>
                                                        <input
                                                            type="number"
                                                            value={item.cart_qty === null || item.cart_qty === undefined ? '' : item.cart_qty}
                                                            step="1"
                                                            min="1"
                                                            className="w-20 px-2 py-1 text-xs border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded focus:ring-1 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent"
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                const newQty = value === '' ? 1 : parseInt(value);
                                                                
                                                                if (!isNaN(newQty) && newQty > 0) {
                                                                    console.log('🔍 Updating quantity:', { itemId: item.id, newQty });
                                                                    
                                                                    // ✅ FIXED: Call with correct parameter order (newQty, itemId)
                                                                    if (typeof handleQuantityChange === 'function') {
                                                                        handleQuantityChange(newQty, item.id);
                                                                        console.log('✅ Called handleQuantityChange(newQty, itemId)');
                                                                    } else {
                                                                        // Fallback: Direct state update
                                                                        const updatedCart = cartItems.map(cartItem => 
                                                                            cartItem.id === item.id 
                                                                                ? { ...cartItem, cart_qty: newQty }
                                                                                : cartItem
                                                                        );
                                                                        setState(prev => ({
                                                                            ...prev,
                                                                            cart_list: updatedCart
                                                                        }));
                                                                        console.log('✅ Updated quantity directly');
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">L</span>
                                                    </div>
                                                    
                                                    {/* Price Input */}
                                                    <div className="flex items-center space-x-1">
                                                        <span className="khmer-text-medium text-xs text-gray-600 dark:text-gray-400">
                                                            {t("ton_price")}:
                                                        </span>
                                                        <input
                                                            type="number"
                                                            value={item.unit_price === null || item.unit_price === undefined ? '' : item.unit_price}
                                                            step="0.001"
                                                            min="0"
                                                            className="w-18 px-2 py-1 text-xs border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                if (value === '') {
                                                                    updatePrice(item.id, null);
                                                                } else {
                                                                    const newPrice = parseFloat(value);
                                                                    if (!isNaN(newPrice) && newPrice >= 0) {
                                                                        updatePrice(item.id, newPrice);
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Form Section */}
                    <div className="space-y-4">
                        {/* Location Input */}
                        <div className="space-y-2">
                            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                <MapPin className="w-4 h-4 text-green-500 dark:text-green-400" />
                                <span className="khmer-text-medium">{t("destination_location")}</span>
                            </label>
                            <textarea
                                className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent resize-none text-sm khmer-text"
                                placeholder={t("enter_locations")}
                                onKeyDown={(e) => {
                                    if (e.code === 'Space' && e.shiftKey) {
                                        return;
                                    }
                                    if (e.code === 'Space' && !e.shiftKey) {
                                        e.preventDefault();
                                    }
                                }}
                                onChange={(e) => {
                                    const input = e.target.value;
                                    const values = input.split(/[,]+/).filter(Boolean).map(v => v.trim());
                                    setSelectedLocations(values);
                                }}
                                rows={3}
                            />
                        </div>

                        {/* Customer Selection */}
                        <div className="space-y-2">
                            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                <User className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                                <span className="khmer-text-medium">{t("customer_selection")}</span>
                            </label>
                            <select
                                value={objSummary.customer_id || ""}
                                onChange={(e) => {
                                    const selectedCustomer = customers.find(c => c.value === e.target.value);
                                    if (selectedCustomer) {
                                        setObjSummary(prev => ({
                                            ...prev,
                                            customer_id: selectedCustomer.value,
                                            customer_name: selectedCustomer.name,
                                            customer_address: selectedCustomer.address,
                                            customer_tel: selectedCustomer.tel,
                                        }));
                                    }
                                }}
                                className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-sm bg-white khmer-text"
                            >
                                <option value="">{t("select_customer")}</option>
                                {customers.map((customer) => (
                                    <option key={`customer-option-${customer.value}`} value={customer.value} className="khmer-text">
                                        {customer.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Remark */}
                        <div className="space-y-2">
                            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                <FileText className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                                <span className="khmer-text-medium">{t("remarks")}</span>
                            </label>
                            <textarea
                                value={objSummary.remark || ""}
                                onChange={(e) => setObjSummary(prev => ({ ...prev, remark: e.target.value }))}
                                placeholder={t("add_notes")}
                                className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent resize-none text-sm khmer-text"
                                rows={2}
                            />
                        </div>
{/* Date Inputs */}
                        <div className="grid grid-cols-1 gap-4">
                            {/* Order Date */}
                            <div className="space-y-2">
                                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    <Calendar className="w-4 h-4 text-green-500 dark:text-green-400" />
                                    <span className="khmer-text-medium">{t("order_date")}</span>
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
                                        className="px-2 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent text-sm khmer-text"
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
                                        className="px-2 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent text-sm khmer-text"
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
                                        className="px-2 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent text-sm khmer-text"
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
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 khmer-text">
                                    {objSummary.order_date
                                        ? t("selected_date").replace("{date}", convertToDisplayFormat(objSummary.order_date))
                                        : t("select_day_month_year")}
                                </p>
                            </div>

                            {/* Delivery Date */}
                            <div className="space-y-2">
                                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    <Calendar className="w-4 h-4 text-green-500 dark:text-green-400" />
                                    <span className="khmer-text-medium">{t("delivery_date")}</span>
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
                                        className="px-2 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent text-sm khmer-text"
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
                                        className="px-2 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent text-sm khmer-text"
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
                                        className="px-2 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent text-sm khmer-text"
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
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 khmer-text">
                                    {objSummary.delivery_date
                                        ? t("selected_date").replace("{date}", convertToDisplayFormat(objSummary.delivery_date))
                                        : t("select_day_month_year")}
                                </p>
                            </div>
                        </div>

                        {/* Checkout Button */}
                        <Button
                            type="primary"
                            size="large"
                            onClick={handleClickOut}
                            disabled={isDisabled || isCheckingOut} // ✅ បិទប៊ូតុងពេល checking out
                            loading={isCheckingOut} // ✅ បង្ហាញ loading spinner
                            style={{
                                width: '100%',
                                height: '50px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                opacity: (isDisabled || isCheckingOut) ? 0.6 : 1
                            }}
                        >
                            {isCheckingOut ? t("processing") : t("checkout")}
                        </Button>
                    </div>
                </div>

                {/* Footer Summary */}
                <div className="bg-gray-50 p-4 border-t">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-800 khmer-text-bold">
                            ${Number(totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 khmer-text-medium">
                            {t("final_total_amount")}
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
            />
        </>
    );
};

export default IntegratedInvoiceSidebar;