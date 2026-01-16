
import React, { useState, useEffect } from "react";
import {
    ShoppingCart,
    Trash2,
    MapPin,
    User,
    Calendar,
    FileText,
    DollarSign,
    Package,
    Plus,
    Minus,
    Edit3,
    AlertTriangle,
    X
} from "lucide-react";
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';


// Extend dayjs with custom parse format
dayjs.extend(customParseFormat);

// Load Kantumruy Pro font
const loadKantumruyProFont = () => {
    // Check if font is already loaded
    if (document.querySelector('link[href*="Kantumruy"]')) {
        return;
    }

    // Create link element for Google Fonts
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Kantumruy+Pro:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Add CSS custom properties and classes
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
        
        /* Apply to all elements with Khmer text */
        [class*="khmer"] {
            line-height: 1.6;
            letter-spacing: 0.02em;
        }
    `;
    document.head.appendChild(style);
};

const convertToInputFormat = (date) => {
    if (!date) return ""; // null or undefined
    const d = new Date(date);
    if (d instanceof Date && !isNaN(d)) {
        return d.toISOString().split("T")[0]; // YYYY-MM-DD
    }
    return ""; // fallback if invalid
};


const convertToDisplayFormat = (dateStr) => {
    if (!dateStr) return '';

    // If in YYYY-MM-DD format, convert to DD/MM/YYYY
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dayjs(dateStr).format('DD/MM/YYYY');
    }

    // If already in DD/MM/YYYY format
    if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        return dateStr;
    }

    return dayjs(dateStr).format('DD/MM/YYYY');
};

// Custom Alert Modal Component
const AlertModal = ({ isOpen, onClose, onConfirm, title, message, type = "warning" }) => {
    if (!isOpen) return null;

    const getTypeStyles = () => {
        switch (type) {
            case "danger":
                return {
                    icon: <Trash2 className="w-12 h-12 text-red-500" />,
                    bgColor: "bg-red-50",
                    borderColor: "border-red-200",
                    confirmBg: "bg-red-600 hover:bg-red-700",
                    cancelBg: "bg-gray-300 hover:bg-gray-400"
                };
            case "warning":
            default:
                return {
                    icon: <AlertTriangle className="w-12 h-12 text-yellow-500" />,
                    bgColor: "bg-yellow-50",
                    borderColor: "border-yellow-200",
                    confirmBg: "bg-yellow-600 hover:bg-yellow-700",
                    cancelBg: "bg-gray-300 hover:bg-gray-400"
                };
        }
    };

    const styles = getTypeStyles();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                <div className={`${styles.bgColor} ${styles.borderColor} border-b p-6`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            {styles.icon}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                                <p className="text-sm text-gray-600 mt-1">{message}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="p-6">
                    <div className="flex space-x-3 justify-end">
                        <button
                            onClick={onClose}
                            className={`px-4 py-2 ${styles.cancelBg} text-gray-700 rounded-lg font-medium transition-colors`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`px-4 py-2 ${styles.confirmBg} text-white rounded-lg font-medium transition-colors`}
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const IntegratedInvoiceSidebar = ({
    // Props from your MainPage
    cartItems = [], // state.cart_list
    objSummary = {},
    selectedLocations = "",
    setSelectedLocations = () => { },
    setObjSummary = () => { },
    customers = [], // state.customers
    handleClearCart = () => { },
    handleQuantityChange = () => { },
    handlePriceChange = () => { },
    handleClickOut = () => { },
    isDisabled = false,
    invoiceBackup = null,
    setShowReprintModal = () => { },
    // ✅ Add setState prop to handle item removal
    setState = () => { }
}) => {
    // Load Kantumruy Pro font on component mount
    useEffect(() => {
        loadKantumruyProFont();
    }, []);

    // State for alert modals
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
        const total = (item.cart_qty * item.unit_price) / actual; // ✅ Use cart_qty instead of qty
        return sum + total;
    }, 0);

    // Show alert modal
    const showAlert = (type, title, message, onConfirm) => {
        setAlertModal({
            isOpen: true,
            type,
            title,
            message,
            onConfirm
        });
    };

    // Close alert modal
    const closeAlert = () => {
        setAlertModal({
            isOpen: false,
            type: "warning",
            title: "",
            message: "",
            onConfirm: null
        });
    };

    // Handle alert confirmation
    const handleAlertConfirm = () => {
        if (alertModal.onConfirm) {
            alertModal.onConfirm();
        }
        closeAlert();
    };

    // ✅ Fixed: Use cart_qty consistently and pass correct id with better error handling
    const updateQuantity = (itemId, change) => {

        if (!itemId) {
            console.error('No itemId provided to updateQuantity');
            return;
        }

        const item = cartItems.find(item => item.id === itemId);
        if (!item) {
            console.error('Item not found in cart for quantity update:', itemId);
            return;
        }

        const newQty = Math.max(0, (item.cart_qty || 0) + change);

        try {
            handleQuantityChange(newQty, itemId);  // ✅ Pass correct parameters
        } catch (error) {
            console.error('Error updating quantity:', error);
        }
    };

    const updatePrice = (itemId, newPrice) => {

        // Validate itemId exists
        if (!itemId) {
            console.error('No itemId provided to updatePrice');
            return;
        }

        // Validate item exists in cart
        const item = cartItems.find(item => item.id === itemId);
        if (!item) {
            console.error('Item not found in cart:', itemId);
            return;
        }

        // Validate price is a valid number
        if (isNaN(newPrice) || newPrice < 0) {
            console.error('Invalid price:', newPrice);
            return;
        }

        try {
            handlePriceChange(newPrice, itemId); // ✅ Pass correct parameters
        } catch (error) {
            console.error('Error updating price:', error);
        }
    };

    // Enhanced clear cart handler with custom alert
    const handleClearCartClick = () => {
        if (cartItems.length === 0) return;

        showAlert(
            "danger",
            "Clear All Items",
            `Are you sure you want to remove all ${cartItems.length} items from your cart? This action cannot be undone.`,
            () => {
                try {
                    handleClearCart();
                } catch (error) {
                    console.error('Error clearing cart:', error);
                    // You could show another alert here for the error
                    showAlert(
                        "danger",
                        "Error",
                        "Failed to clear cart. Please try again.",
                        null
                    );
                }
            }
        );
    };

    // ✅ Enhanced individual item remove handler with custom alert
    const handleRemoveItem = (itemId) => {
        const item = cartItems.find(item => item.id === itemId);
        const itemName = item?.category_name || 'item';
        const itemQty = item?.cart_qty || 0;

        showAlert(
            "danger",
            "Remove Item",
            `Remove "${itemName}" (${Number(itemQty).toLocaleString()}L) from cart?`,
            () => {
                try {
                    // Filter out the item with the specified id
                    const newCartList = cartItems.filter(item => item.id !== itemId);
                    setState(prev => ({
                        ...prev,
                        cart_list: newCartList
                    }));
                } catch (error) {
                    console.error('Error removing item:', error);
                    showAlert(
                        "danger",
                        "Error",
                        "Failed to remove item. Please try again.",
                        null
                    );
                }
            }
        );
    };

    return (
        <>
            <div className="w-full max-w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <ShoppingCart className="w-6 h-6" />
                            <span className="text-lg font-semibold khmer-text-medium">Items {cartItems.length}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            {invoiceBackup && (
                                <button
                                    onClick={() => setShowReprintModal(true)}
                                    className="flex items-center space-x-1 px-2 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-xs khmer-text"
                                    title="Print ម្តងទៀត (F3)"
                                >
                                    <span>🖨️</span>
                                </button>
                            )}
                            <button
                                onClick={handleClearCartClick}
                                disabled={cartItems.length === 0}
                                className="flex items-center space-x-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed rounded-lg transition-colors text-sm khmer-text"
                                title="Clear all items from cart"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>Clear</span>
                            </button>
                        </div>
                    </div>

                    {/* Quick Summary */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/10 rounded-lg p-3">
                            <div className="text-white/80 text-xs uppercase tracking-wide khmer-text">Total Qty</div>
                            <div className="text-lg font-bold khmer-text-semibold">
                                {Number(totalQuantity).toLocaleString()}
                                <span className="text-sm font-normal text-white/80 ml-1 khmer-text">
                                    {totalQuantity >= 1000 ? `L (≈${(totalQuantity / 1000).toFixed(3)}T)` : 'L'}
                                </span>
                            </div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                            <div className="text-white/80 text-xs uppercase tracking-wide khmer-text">Total Amount</div>
                            <div className="text-lg font-bold khmer-text-semibold">
                                ${Number(totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cart Items */}
                <div className="p-4">
                    <div className="max-h-60 overflow-y-auto space-y-3 mb-6">
                        {cartItems.length === 0 ? (
                            <div className="text-center py-8">
                                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 khmer-text">No items in cart</p>
                            </div>
                        ) : (
                            cartItems.map((item, index) => {
                                const getCategoryColor = (category) => {
                                    const categoryColors = {
                                        'ហ្កាស(LPG)': { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800' },
                                        'ប្រេងសាំងធម្មតា(EA)': { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-800' },
                                        'ប្រេងម៉ាស៊ូត(Do)': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' },
                                        'ប្រេងសាំងស៊ុបពែរ(Super)': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' },
                                        'default': { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800' }
                                    };
                                    return categoryColors[category] || categoryColors['default'];
                                };

                                const colors = getCategoryColor(item.category_name);

                                return (
                                    <div key={`cart-item-${item.id}-${index}`} className={`${colors.bg} ${colors.border} border rounded-xl p-4 hover:shadow-md transition-all`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <div className={`inline-block px-2 py-1 rounded-full text-xs khmer-text-medium bg-green-100 text-green-800 ${colors.bg} ${colors.text} border ${colors.border} mb-2`}>
                                                    {item.category_name}
                                                </div>
                                                <div className="text-xs text-gray-500 khmer-text">
                                                    Order: {convertToDisplayFormat(objSummary.order_date) || 'N/A'} | Delivery: {convertToDisplayFormat(objSummary.delivery_date) || 'N/A'}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-green-600">
                                                    ${Number((item.cart_qty || 0) * (item.unit_price || 0) / (item.actual_price || 1)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    className="mt-1 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-all"
                                                    title="Remove item from cart"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {/* Quantity Controls */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="khmer-text-medium">បរិមាណ: {Number(item.cart_qty || 0).toLocaleString()}L</span>
                                                    <div className="flex items-center space-x-1">
                                                        <span className="khmer-text-medium text-xs">តម្លៃតោន:</span>
                                                       <input
  type="number"
  value={item.unit_price === null || item.unit_price === undefined ? '' : item.unit_price}
  step="0.001"
  min="0"
  className="w-18 px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
  onChange={(e) => {
    const value = e.target.value;

    if (value === '') {
      updatePrice(item.id, null); // Or '' if you want to clear it visually only
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
                            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                                <MapPin className="w-4 h-4 text-green-500" />
                                <span className="khmer-text-medium">គោលដៅ / Location</span>
                            </label>
                            <textarea

                                style={{ width: '100%' }}
                                placeholder="Enter locations here (use Shift+Space for spaces)"
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
                            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                                <User className="w-4 h-4 text-blue-500" />
                                <span className="khmer-text-medium">អតិថិជន / Customer</span>
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
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white khmer-text"
                            >
                                <option value="">Select Customer</option>
                                {customers.map((customer) => (
                                    <option key={`customer-option-${customer.value}`} value={customer.value} className="khmer-text">
                                        {customer.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Remark */}
                        <div className="space-y-2">
                            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                                <FileText className="w-4 h-4 text-purple-500" />
                                <span className="khmer-text-medium">Remark</span>
                            </label>
                            <textarea
                                value={objSummary.remark || ""}
                                onChange={(e) => setObjSummary(prev => ({ ...prev, remark: e.target.value }))}
                                placeholder="Add any notes..."
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm khmer-text"
                                rows={2}
                            />
                        </div>

                       {/* Date Inputs */}
                        <div className="grid grid-cols-1 gap-4">
                            {/* Order Date */}
                            <div className="space-y-2">
                                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                                    <Calendar className="w-4 h-4 text-green-500" />
                                    <span className="khmer-text-medium">ថ្ងៃបញ្ជាទីញ / Order Date</span>
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {/* Day */}
                                    <select
                                        value={objSummary.order_date ? dayjs(objSummary.order_date).format('DD') : ""}
                                        onChange={(e) => {
                                            const day = e.target.value;
                                            if (day && objSummary.order_date) {
                                                const currentDate = dayjs(objSummary.order_date);
                                                const newDate = currentDate.date(parseInt(day)).format('YYYY-MM-DD');
                                                setObjSummary(prev => ({ ...prev, order_date: newDate }));
                                            } else if (day) {
                                                // If no existing date, create with current month/year
                                                const newDate = dayjs().date(parseInt(day)).format('YYYY-MM-DD');
                                                setObjSummary(prev => ({ ...prev, order_date: newDate }));
                                            }
                                        }}
                                        className="px-2 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm khmer-text"
                                    >
                                        <option value="">Day</option>
                                        {Array.from({ length: 31 }, (_, i) => (
                                            <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                                                {i + 1}
                                            </option>
                                        ))}
                                    </select>
                                    
                                    {/* Month */}
                                    <select
                                        value={objSummary.order_date ? dayjs(objSummary.order_date).format('MM') : ""}
                                        onChange={(e) => {
                                            const month = e.target.value;
                                            if (month && objSummary.order_date) {
                                                const currentDate = dayjs(objSummary.order_date);
                                                const newDate = currentDate.month(parseInt(month) - 1).format('YYYY-MM-DD');
                                                setObjSummary(prev => ({ ...prev, order_date: newDate }));
                                            } else if (month) {
                                                // If no existing date, create with current year and day 1
                                                const newDate = dayjs().month(parseInt(month) - 1).date(1).format('YYYY-MM-DD');
                                                setObjSummary(prev => ({ ...prev, order_date: newDate }));
                                            }
                                        }}
                                        className="px-2 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm khmer-text"
                                    >
                                        <option value="">Month</option>
                                        {[
                                            'មករា', 'កម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
                                            'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
                                        ].map((month, index) => (
                                            <option key={month} value={String(index + 1).padStart(2, '0')}>
                                                {month}
                                            </option>
                                        ))}
                                    </select>
                                    
                                    {/* Year */}
                                    <select
                                        value={objSummary.order_date ? dayjs(objSummary.order_date).format('YYYY') : ""}
                                        onChange={(e) => {
                                            const year = e.target.value;
                                            if (year && objSummary.order_date) {
                                                const currentDate = dayjs(objSummary.order_date);
                                                const newDate = currentDate.year(parseInt(year)).format('YYYY-MM-DD');
                                                setObjSummary(prev => ({ ...prev, order_date: newDate }));
                                            } else if (year) {
                                                // If no existing date, create with January 1st of selected year
                                                const newDate = dayjs().year(parseInt(year)).month(0).date(1).format('YYYY-MM-DD');
                                                setObjSummary(prev => ({ ...prev, order_date: newDate }));
                                            }
                                        }}
                                        className="px-2 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm khmer-text"
                                    >
                                        <option value="">Year</option>
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
                                <p className="text-xs text-gray-500 mt-1 khmer-text">
                                    {objSummary.order_date ? `Selected: ${convertToDisplayFormat(objSummary.order_date)}` : "Select day, month, and year"}
                                </p>
                            </div>

                            {/* Delivery Date */}
                            <div className="space-y-2">
                                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                                    <Calendar className="w-4 h-4 text-green-500" />
                                    <span className="khmer-text-medium">ថ្ងៃប្រគល់ទំនិញ / Delivery Date</span>
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {/* Day */}
                                    <select
                                        value={objSummary.delivery_date ? dayjs(objSummary.delivery_date).format('DD') : ""}
                                        onChange={(e) => {
                                            const day = e.target.value;
                                            if (day && objSummary.delivery_date) {
                                                const currentDate = dayjs(objSummary.delivery_date);
                                                const newDate = currentDate.date(parseInt(day)).format('YYYY-MM-DD');
                                                setObjSummary(prev => ({ ...prev, delivery_date: newDate }));
                                            } else if (day) {
                                                // If no existing date, create with current month/year
                                                const newDate = dayjs().date(parseInt(day)).format('YYYY-MM-DD');
                                                setObjSummary(prev => ({ ...prev, delivery_date: newDate }));
                                            }
                                        }}
                                        className="px-2 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm khmer-text"
                                    >
                                        <option value="">Day</option>
                                        {Array.from({ length: 31 }, (_, i) => (
                                            <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                                                {i + 1}
                                            </option>
                                        ))}
                                    </select>
                                    
                                    {/* Month */}
                                    <select
                                        value={objSummary.delivery_date ? dayjs(objSummary.delivery_date).format('MM') : ""}
                                        onChange={(e) => {
                                            const month = e.target.value;
                                            if (month && objSummary.delivery_date) {
                                                const currentDate = dayjs(objSummary.delivery_date);
                                                const newDate = currentDate.month(parseInt(month) - 1).format('YYYY-MM-DD');
                                                setObjSummary(prev => ({ ...prev, delivery_date: newDate }));
                                            } else if (month) {
                                                // If no existing date, create with current year and day 1
                                                const newDate = dayjs().month(parseInt(month) - 1).date(1).format('YYYY-MM-DD');
                                                setObjSummary(prev => ({ ...prev, delivery_date: newDate }));
                                            }
                                        }}
                                        className="px-2 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm khmer-text"
                                    >
                                        <option value="">Month</option>
                                        {[
                                            'មករា', 'កម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
                                            'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
                                        ].map((month, index) => (
                                            <option key={month} value={String(index + 1).padStart(2, '0')}>
                                                {month}
                                            </option>
                                        ))}
                                    </select>
                                    
                                    {/* Year */}
                                    <select
                                        value={objSummary.delivery_date ? dayjs(objSummary.delivery_date).format('YYYY') : ""}
                                        onChange={(e) => {
                                            const year = e.target.value;
                                            if (year && objSummary.delivery_date) {
                                                const currentDate = dayjs(objSummary.delivery_date);
                                                const newDate = currentDate.year(parseInt(year)).format('YYYY-MM-DD');
                                                setObjSummary(prev => ({ ...prev, delivery_date: newDate }));
                                            } else if (year) {
                                                // If no existing date, create with January 1st of selected year
                                                const newDate = dayjs().year(parseInt(year)).month(0).date(1).format('YYYY-MM-DD');
                                                setObjSummary(prev => ({ ...prev, delivery_date: newDate }));
                                            }
                                        }}
                                        className="px-2 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm khmer-text"
                                    >
                                        <option value="">Year</option>
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
                                <p className="text-xs text-gray-500 mt-1 khmer-text">
                                    {objSummary.delivery_date ? `Selected: ${convertToDisplayFormat(objSummary.delivery_date)}` : "Select day, month, and year"}
                                </p>
                            </div>
                        </div>

                        {/* Checkout Button */}
                        <button
                            disabled={isDisabled || cartItems.length === 0}
                            onClick={handleClickOut}
                            className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-800 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 khmer-text-medium"
                        >
                            <DollarSign className="w-5 h-5" />
                            <span>Checkout</span>
                        </button>
                    </div>
                </div>

                {/* Footer Summary */}
                <div className="bg-gray-50 p-4 border-t">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-800 khmer-text-bold">
                            ${Number(totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 khmer-text-medium">
                            បរិមាណសរុបចុងក្រោយ
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