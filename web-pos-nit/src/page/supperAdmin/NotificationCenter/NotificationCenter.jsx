// ═══════════════════════════════════════════════════════════════
// COMPLETE NotificationCenter.jsx
// Includes ALL notification types: Payment, Login, Order, Customer, Stock
// Ready to use - just replace your existing NotificationCenter.jsx
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from 'react';
import {
  Bell, Check, Copy, Trash2, X, Lock, Calendar, User, MapPin, Phone,
  Filter, RefreshCw, Search, Home, CreditCard, Droplet, UserCheck,
  Package, Mail, Tag, Heart, Users, ShoppingCart, DollarSign,
  CalendarRange
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { request } from '../../../util/helper';
import { Config } from '../../../util/config';

const TelegramNotificationCard = ({ notification, onMarkAsRead, onDelete, onCopy, isNew }) => {
  const formatCurrency = (amount) => {
    return `${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatLiters = (liters) => {
    return `${Number(liters).toLocaleString('en-US')}L`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const type = (notification.notification_type || '').toLowerCase();

  const isLoginAlert = type === 'login_alert';
  const isOrderCreated = type === 'order_created';
  const isStockUpdate = type === 'stock_update';
  const isCustomerCreated = type === 'customer_created';
  const isPaymentReceived = type === 'payment_received';

  const copyToClipboard = () => {
    let text = `${notification.title}\n\n`;
    if (notification.branch_name) text += `🏢 Branch: ${notification.branch_name}\n`;
    if (notification.created_at) text += `📅 Date: ${formatDate(notification.created_at)}\n`;
    if (notification.card_number) text += `💳 Card Number: ${notification.card_number}\n\n`;

    // Login Alert Copy
    if (isLoginAlert && notification.data?.login_info) {
      const login = notification.data?.login_info;
      text += `\n👤 User Information:\n`;
      text += `Name: ${login.name}\n`;
      text += `Username: ${login.username}\n`;
      text += `Email: ${login.email || 'N/A'}\n`;
      text += `Role: ${login.role_name}\n`;
      text += `Branch: ${login.branch_name || 'N/A'}\n\n`;
      text += `🔐 Login Details:\n`;
      text += `Time: ${login.login_time}\n`;
      text += `IP Address: ${login.ip_address}\n`;
      text += `Device: ${login.device}\n`;
      text += `Browser: ${login.browser}\n`;
    }

    // Payment Copy
    if (isPaymentReceived && notification.data?.payment_info) {
      const payment = notification.data.payment_info;
      const customer = notification.data.customer_info;

      text += `\n💰 Payment Information:\n`;
      text += `Invoice Number: ${payment.invoice_number || 'N/A'}\n`;
      text += `Amount: $${Number(payment.amount).toFixed(2)}\n`;
      text += `Method: ${payment.payment_method}\n`;
      if (payment.bank) text += `Bank: ${payment.bank}\n`;
      text += `Date: ${payment.payment_date_formatted}\n\n`;
      
      text += `👤 Customer Information:\n`;
      text += `Name: ${customer.name}\n`;
      text += `Phone: ${customer.phone}\n`;
      text += `Address: ${customer.address}\n\n`;
      
      if (payment.debts_updated > 0) {
        text += `📊 Payment Summary:\n`;
        text += `Total Paid: $${payment.total_paid}\n`;
        text += `Total Due: $${payment.total_due}\n`;
        text += `Debts Updated: ${payment.debts_updated}\n`;
      }
      
      if (payment.notes) {
        text += `\n📝 Notes: ${payment.notes}\n`;
      }
      
      text += `\n✅ Processed by: ${payment.processed_by}\n`;
    }

    // Customer Info (for orders, etc)
    if (!isLoginAlert && !isPaymentReceived && notification.customer_name) {
      text += `👤 Customer: ${notification.customer_name}\n`;
      if (notification.customer_address) text += `🏠 Address: ${notification.customer_address}\n`;
      if (notification.customer_tel) text += `📞 Phone: ${notification.customer_tel}\n`;

      if (isCustomerCreated && notification.data?.customer_info) {
        const customer = notification.data.customer_info;
        if (customer.email) text += `📧 Email: ${customer.email}\n`;
        if (customer.type) text += `📌 Type: ${customer.type}\n`;
        if (customer.id_card_number) text += `🎫 ID Card: ${customer.id_card_number}\n`;
        if (customer.spouse_name) text += `👩‍❤️‍👨 Spouse: ${customer.spouse_name}\n`;
        if (customer.guarantor_name) text += `👥 Guarantor: ${customer.guarantor_name}\n`;
      }
    }

    if (notification.created_by) text += `📝 Created By: ${notification.created_by}\n\n`;

    // Items
    if (notification.data?.items) {
      text += `📦 Items:\n`;
      notification.data.items.forEach((item, idx) => {
        text += `${idx + 1}. ${item.name} - ${formatLiters(item.quantity)}\n`;
        text += `   • Unit Price: $${item.unit_price}\n`;
      });
    }

    if (notification.total_liters) text += `\n💧 Total Liters: ${formatLiters(notification.total_liters)}\n`;
    if (notification.total_amount) text += `💰 Total: ${formatCurrency(notification.total_amount)}`;

    navigator.clipboard.writeText(text);
    onCopy?.();
  };

  return (
    <div className={`relative mb-4 rounded-xl overflow-hidden shadow-2xl transition-all duration-300 ${
      isNew ? 'animate-slide-in-telegram border-4 border-green-400' : 'border-2 border-gray-700'
    }`}>

      {/* Header Bar */}
      <div className={`px-4 py-3 flex items-center justify-between ${
        isPaymentReceived
          ? 'bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500'
          : isStockUpdate
          ? 'bg-gradient-to-r from-purple-600 via-pink-500 to-red-500'
          : isCustomerCreated
          ? 'bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500'
          : isLoginAlert
          ? 'bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-500'
          : 'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 bg-white/20 rounded-full ${isNew ? 'animate-bounce' : ''}`}>
            {isPaymentReceived ? (
              <DollarSign className="w-6 h-6 text-white" />
            ) : isStockUpdate ? (
              <Package className="w-6 h-6 text-white" />
            ) : isCustomerCreated ? (
              <UserCheck className="w-6 h-6 text-white" />
            ) : isLoginAlert ? (
              <Lock className="w-6 h-6 text-white" />
            ) : (
              <Bell className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-lg uppercase tracking-wide">
                {isPaymentReceived
                  ? 'PAYMENT ALERT'
                  : isStockUpdate
                  ? 'STOCK ALERT'
                  : isCustomerCreated
                  ? 'CUSTOMER ALERT'
                  : isLoginAlert
                  ? 'LOGIN ALERT'
                  : (notification.branch_name || 'SYSTEM') + ' ALERT'}
              </span>
              {isNew && (
                <span className="bg-green-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                  ថ្មី NEW
                </span>
              )}
            </div>
            <div className="text-white/90 text-sm flex items-center gap-2 mt-1">
              <Calendar className="w-3 h-3" />
              <span>{notification.time_ago}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className="p-2 hover:bg-white/20 rounded-lg transition-all"
            title="Copy"
          >
            <Copy className="w-5 h-5 text-white" />
          </button>

          {!notification.is_read && (
            <button
              onClick={() => onMarkAsRead(notification.id)}
              className="p-2 hover:bg-white/20 rounded-lg transition-all"
              title="Mark as read"
            >
              <Check className="w-5 h-5 text-white" />
            </button>
          )}

          <button
            onClick={() => onDelete(notification.id)}
            className="p-2 hover:bg-white/20 rounded-lg transition-all"
            title="Delete"
          >
            <Trash2 className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 text-white">

        {/* Success/Info Badge */}
        <div className="px-4 pt-4">
          <div className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 border-2 ${
            isPaymentReceived
              ? 'bg-green-500/20 border-green-500'
              : isStockUpdate
              ? 'bg-purple-500/20 border-purple-500'
              : isCustomerCreated
              ? 'bg-green-500/20 border-green-500'
              : isLoginAlert
              ? 'bg-blue-500/20 border-blue-500'
              : 'bg-green-500/20 border-green-500'
          }`}>
            {isPaymentReceived ? (
              <>
                <DollarSign className="w-5 h-5 text-green-400" />
                <span className="text-green-300 font-bold text-lg">
                  Payment Received! 💰
                </span>
              </>
            ) : isStockUpdate ? (
              <>
                <Package className="w-5 h-5 text-purple-400" />
                <span className="text-purple-300 font-bold text-lg">
                  Stock {notification.data?.is_new ? 'Added' : 'Updated'}!
                </span>
              </>
            ) : isCustomerCreated ? (
              <>
                <UserCheck className="w-5 h-5 text-green-400" />
                <span className="text-green-300 font-bold text-lg">New Customer Added! 🎉</span>
              </>
            ) : isLoginAlert ? (
              <>
                <Lock className="w-5 h-5 text-blue-400" />
                <span className="text-blue-300 font-bold text-lg">Login Alert</span>
              </>
            ) : isOrderCreated ? (
              <>
                <Check className="w-5 h-5 text-green-400" />
                <span className="text-green-300 font-bold text-lg">Order Completed!</span>
              </>
            ) : (
              <span className="text-gray-400">Unknown Notification</span>
            )}
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent my-3" />

        {/* Info Grid */}
        <div className="px-4 py-2 space-y-3">

          {/* Date */}
          {notification.created_at && (
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-400" />
              <div>
                <span className="text-gray-400 text-sm">Date:</span>
                <span className="text-white font-semibold ml-2">
                  {formatDate(notification.created_at)}
                </span>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════ */}
          {/* PAYMENT SECTION */}
          {/* ═══════════════════════════════════════════════════ */}
          {isPaymentReceived && notification.data?.payment_info && (
            <>
              {/* Payment Details */}
              <div className="bg-gradient-to-r from-green-700/50 to-emerald-700/50 rounded-lg p-4 space-y-3 border-2 border-green-500">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-6 h-6 text-green-400" />
                  <div>
                    <span className="text-gray-300 text-sm">Payment Amount:</span>
                    <span className="text-green-300 font-bold ml-2 text-2xl">
                      ${Number(notification.data.payment_info.amount).toFixed(2)}
                    </span>
                  </div>
                </div>

                {notification.data.payment_info.invoice_number && (
                  <div className="flex items-center gap-3">
                    <Tag className="w-5 h-5 text-blue-400" />
                    <div>
                      <span className="text-gray-300 text-sm">Invoice:</span>
                      <span className="text-blue-300 font-mono ml-2">
                        {notification.data.payment_info.invoice_number}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-purple-400" />
                  <div>
                    <span className="text-gray-300 text-sm">Method:</span>
                    <span className="text-purple-300 font-semibold ml-2 capitalize">
                      {notification.data.payment_info.payment_method}
                    </span>
                  </div>
                </div>

                {notification.data.payment_info.bank && (
                  <div className="flex items-center gap-3">
                    <Home className="w-5 h-5 text-orange-400" />
                    <div>
                      <span className="text-gray-300 text-sm">Bank:</span>
                      <span className="text-orange-300 font-semibold ml-2">
                        {notification.data.payment_info.bank}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                  <div>
                    <span className="text-gray-300 text-sm">Payment Date:</span>
                    <span className="text-cyan-300 ml-2">
                      {notification.data.payment_info.payment_date_formatted}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Section */}
              {notification.data.customer_info && (
                <div className="bg-gray-700/50 rounded-lg p-4 space-y-3 border border-gray-600">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-5 h-5 text-cyan-400" />
                    <span className="text-cyan-300 font-bold">Customer Details:</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <UserCheck className="w-5 h-5 text-green-400" />
                    <div>
                      <span className="text-gray-400 text-sm">Name:</span>
                      <span className="text-white font-bold ml-2 text-lg">
                        {notification.data.customer_info.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-blue-400" />
                    <div>
                      <span className="text-gray-400 text-sm">Phone:</span>
                      <span className="text-blue-300 font-mono ml-2">
                        {notification.data.customer_info.phone}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-red-400 mt-1" />
                    <div className="flex-1">
                      <span className="text-gray-400 text-sm">Address:</span>
                      <span className="text-gray-200 ml-2">
                        {notification.data.customer_info.address}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Summary */}
              {notification.data.payment_info.debts_updated > 0 && (
                <div className="bg-gradient-to-r from-blue-700/30 to-purple-700/30 rounded-lg p-4 border border-blue-500">
                  <div className="flex items-center gap-2 mb-3">
                    <ShoppingCart className="w-5 h-5 text-blue-400" />
                    <span className="text-blue-300 font-bold">Payment Summary:</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-gray-400">Total Paid:</div>
                      <div className="text-green-400 font-bold text-lg">
                        ${notification.data.payment_info.total_paid}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">Remaining Due:</div>
                      <div className="text-yellow-400 font-bold text-lg">
                        ${notification.data.payment_info.total_due}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-gray-400">Debts Updated:</div>
                      <div className="text-cyan-400 font-bold">
                        {notification.data.payment_info.debts_updated} records
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Slips */}
              {notification.data.payment_info.slip_count > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-purple-400" />
                    <span className="text-purple-300 font-bold">
                      Payment Slips ({notification.data.payment_info.slip_count}):
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {notification.data.payment_info.slip_images?.slice(0, 4).map((slip, idx) => (
                      <div key={idx} className="relative aspect-video rounded-lg overflow-hidden bg-gray-700">
                        <img
                          src={Config.getFullImagePath(slip)}
                          alt={`Payment slip ${idx + 1}`}
                          className="w-full h-full object-cover hover:scale-110 transition-transform cursor-pointer"
                          onClick={() => window.open(`${window.location.origin}/uploads/${slip}`, '_blank')}
                        />
                        <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          Slip {idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                  {notification.data.payment_info.slip_count > 4 && (
                    <div className="text-center text-sm text-gray-400">
                      +{notification.data.payment_info.slip_count - 4} more slips
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {notification.data.payment_info.notes && (
                <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600">
                  <div className="flex items-start gap-2">
                    <Tag className="w-4 h-4 text-yellow-400 mt-1" />
                    <div className="flex-1">
                      <div className="text-gray-400 text-xs mb-1">Notes:</div>
                      <div className="text-gray-200 text-sm">
                        {notification.data.payment_info.notes}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Processed By */}
              {notification.data.payment_info.processed_by && (
                <div className="flex items-center gap-3">
                  <UserCheck className="w-5 h-5 text-yellow-400" />
                  <div>
                    <span className="text-gray-400 text-sm">Processed By:</span>
                    <span className="text-yellow-300 font-semibold ml-2">
                      {notification.data.payment_info.processed_by}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

        
          {isLoginAlert && notification.data?.login_info && (
            <>
              {/* User Section */}
              <div className="bg-gradient-to-r from-blue-700/50 to-indigo-700/50 rounded-lg p-4 space-y-3 border-2 border-blue-500">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-cyan-400" />
                  <div>
                    <span className="text-gray-300 text-sm">User:</span>
                    <span className="text-white font-bold ml-2 text-lg">
                      {notification.data.login_info.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <UserCheck className="w-5 h-5 text-green-400" />
                  <div>
                    <span className="text-gray-300 text-sm">Username:</span>
                    <span className="text-green-300 font-mono ml-2">
                      {notification.data.login_info.username}
                    </span>
                  </div>
                </div>

                {notification.data.login_info.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-400" />
                    <div className="flex-1">
                      <span className="text-gray-300 text-sm">Email:</span>
                      <span className="text-blue-300 ml-2 break-all">
                        {notification.data.login_info.email}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Tag className="w-5 h-5 text-purple-400" />
                  <div>
                    <span className="text-gray-300 text-sm">Role:</span>
                    <span className="text-purple-300 font-semibold ml-2">
                      {notification.data.login_info.role_name}
                    </span>
                  </div>
                </div>

                {notification.data.login_info.branch_name && (
                  <div className="flex items-center gap-3">
                    <Home className="w-5 h-5 text-orange-400" />
                    <div>
                      <span className="text-gray-300 text-sm">Branch:</span>
                      <span className="text-orange-300 font-semibold ml-2">
                        {notification.data.login_info.branch_name}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Login Details Section */}
              <div className="bg-gray-700/50 rounded-lg p-4 space-y-3 border border-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-5 h-5 text-cyan-400" />
                  <span className="text-cyan-300 font-bold">Login Details:</span>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-green-400" />
                  <div className="flex-1">
                    <span className="text-gray-400 text-sm">Time:</span>
                    <span className="text-green-300 ml-2">
                      {notification.data.login_info.login_time}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-red-400" />
                  <div className="flex-1">
                    <span className="text-gray-400 text-sm">IP Address:</span>
                    <span className="text-red-300 font-mono ml-2">
                      {notification.data.login_info.ip_address}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-purple-400" />
                  <div className="flex-1">
                    <span className="text-gray-400 text-sm">Device:</span>
                    <span className="text-purple-300 ml-2">
                      {notification.data.login_info.device}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Tag className="w-5 h-5 text-yellow-400" />
                  <div className="flex-1">
                    <span className="text-gray-400 text-sm">Browser:</span>
                    <span className="text-yellow-300 ml-2">
                      {notification.data.login_info.browser}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════════════════ */}
          {/* CARD NUMBER (for Orders/Customers) */}
          {/* ═══════════════════════════════════════════════════ */}
          {!isLoginAlert && !isPaymentReceived && notification.card_number && (
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-purple-400" />
              <div>
                <span className="text-gray-400 text-sm">Card Number:</span>
                <span className="text-purple-300 font-mono font-bold ml-2 text-lg">
                  {notification.card_number}
                </span>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════ */}
          {/* CUSTOMER SECTION (for Orders/Customers) */}
          {/* ═══════════════════════════════════════════════════ */}
          {!isLoginAlert && !isPaymentReceived && notification.customer_name && (
            <div className="bg-gray-700/50 rounded-lg p-4 space-y-3 border border-gray-600">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-cyan-400" />
                <div>
                  <span className="text-gray-400 text-sm">Customer:</span>
                  <span className="text-white font-bold ml-2 text-lg">
                    {notification.customer_name}
                  </span>
                </div>
              </div>

              {notification.customer_address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-red-400 mt-1" />
                  <div className="flex-1">
                    <span className="text-gray-400 text-sm">Address:</span>
                    <span className="text-gray-200 ml-2">
                      {notification.customer_address}
                    </span>
                  </div>
                </div>
              )}

              {notification.customer_tel && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-green-400" />
                  <div>
                    <span className="text-gray-400 text-sm">Phone:</span>
                    <span className="text-green-300 font-mono ml-2">
                      {notification.customer_tel}
                    </span>
                  </div>
                </div>
              )}

              {/* Customer Created specific fields */}
              {isCustomerCreated && notification.data?.customer_info && (
                <>
                  {notification.data.customer_info.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-blue-400" />
                      <div className="flex-1">
                        <span className="text-gray-400 text-sm">Email:</span>
                        <span className="text-blue-300 ml-2 break-all">
                          {notification.data.customer_info.email}
                        </span>
                      </div>
                    </div>
                  )}

                  {notification.data.customer_info.type && (
                    <div className="flex items-center gap-3">
                      <Tag className="w-5 h-5 text-purple-400" />
                      <div>
                        <span className="text-gray-400 text-sm">Type:</span>
                        <span className="text-purple-300 font-semibold ml-2">
                          {notification.data.customer_info.type}
                        </span>
                      </div>
                    </div>
                  )}

                  {notification.data.customer_info.id_card_number && (
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-yellow-400" />
                      <div>
                        <span className="text-gray-400 text-sm">ID Card:</span>
                        <span className="text-yellow-300 font-mono ml-2">
                          {notification.data.customer_info.id_card_number}
                        </span>
                      </div>
                    </div>
                  )}

                  {notification.data.customer_info.spouse_name && (
                    <div className="flex items-center gap-3">
                      <Heart className="w-5 h-5 text-pink-400" />
                      <div>
                        <span className="text-gray-400 text-sm">Spouse:</span>
                        <span className="text-pink-300 ml-2">
                          {notification.data.customer_info.spouse_name}
                        </span>
                      </div>
                    </div>
                  )}

                  {notification.data.customer_info.guarantor_name && (
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-orange-400" />
                      <div>
                        <span className="text-gray-400 text-sm">Guarantor:</span>
                        <span className="text-orange-300 ml-2">
                          {notification.data.customer_info.guarantor_name}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════ */}
          {/* CREATED BY */}
          {/* ═══════════════════════════════════════════════════ */}
          {notification.created_by && (
            <div className="flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-yellow-400" />
              <div>
                <span className="text-gray-400 text-sm">Created By:</span>
                <span className="text-yellow-300 font-semibold ml-2">
                  {notification.created_by}
                </span>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════ */}
          {/* ITEMS SECTION (for Orders/Stock) */}
          {/* ═══════════════════════════════════════════════════ */}
          {!isLoginAlert && !isPaymentReceived && notification.data?.items && notification.data.items.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-orange-400" />
                <span className="text-orange-300 font-bold">
                  {isStockUpdate ? 'Products:' : 'Items:'}
                </span>
              </div>

              {notification.data.items.map((item, idx) => (
                <div key={idx} className="bg-gray-700/30 rounded-lg p-3 border border-gray-600">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {isStockUpdate && item.is_new && (
                        <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded font-bold">
                          🆕 NEW
                        </span>
                      )}
                      {isStockUpdate && !item.is_new && (
                        <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded font-bold">
                          🔄 UPDATED
                        </span>
                      )}
                      <span className="text-white font-bold">
                        {idx + 1}. {item.name}
                      </span>
                    </div>
                    <span className="text-cyan-300 font-bold text-lg">
                      {isStockUpdate
                        ? `${Number(item.quantity).toLocaleString()}${item.unit || ''}`
                        : formatLiters(item.quantity)
                      }
                    </span>
                  </div>
                  <div className="text-gray-400 text-sm space-y-1">
                    <div>• Unit Price: <span className="text-green-400 font-bold">${item.unit_price}</span></div>
                    {isStockUpdate && item.total_value && (
                      <div>• Total Value: <span className="text-yellow-400 font-bold">${item.total_value.toFixed(2)}</span></div>
                    )}
                    {item.discount > 0 && (
                      <div>• Discount: <span className="text-red-400 font-bold">{item.discount}%</span></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent my-3" />

          {/* ═══════════════════════════════════════════════════ */}
          {/* TOTALS SECTION (for Orders/Stock) */}
          {/* ═══════════════════════════════════════════════════ */}
          {!isLoginAlert && !isPaymentReceived && (notification.total_amount || notification.total_liters) && (
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg p-4 border-2 border-blue-500/50">
              {isStockUpdate ? (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <DollarSign className="w-6 h-6 text-green-400" />
                    <span className="text-gray-400 text-sm">Grand Total:</span>
                  </div>
                  <div className="text-green-400 font-bold text-3xl">
                    {formatCurrency(notification.total_amount)}
                  </div>
                  {notification.data?.product_count && (
                    <div className="text-gray-400 text-sm mt-2">
                      {notification.data.product_count} {notification.data.product_count > 1 ? 'Products' : 'Product'}
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {notification.total_liters && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Droplet className="w-5 h-5 text-blue-400" />
                        <span className="text-gray-400 text-sm">Total Liters:</span>
                      </div>
                      <div className="text-blue-300 font-bold text-2xl">
                        {formatLiters(notification.total_liters)}
                      </div>
                    </div>
                  )}

                  {notification.total_amount && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <DollarSign className="w-5 h-5 text-green-400" />
                        <span className="text-gray-400 text-sm">Total:</span>
                      </div>
                      <div className="text-green-400 font-bold text-2xl">
                        {formatCurrency(notification.total_amount)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-900/50 border-t border-gray-700">
          <div className="text-center text-gray-500 text-sm">
            ©2025 Created by PETRONAS CO.,LTD
          </div>
        </div>
      </div>

      {/* Unread Indicator */}
      {!notification.is_read && (
        <div className="absolute top-2 right-2">
          <span className="relative flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
          </span>
        </div>
      )}
    </div>
  );
};

export default function NotificationCenter() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [newNotificationIds, setNewNotificationIds] = useState(new Set());
  const [stats, setStats] = useState({});
  const [branches, setBranches] = useState([]);
  const [toast, setToast] = useState(null);
  
  // ✅ NEW: Date range state
  const [dateRange, setDateRange] = useState({
    from: '', // Empty = no limit
    to: ''    // Empty = no limit
  });
  
  const [filters, setFilters] = useState({
    branch_name: 'all',
    notification_type: 'all',
    priority: 'all',
    is_read: 'all',
    search: ''
  });

  const previousNotificationIdsRef = useRef(new Set());
  const autoRefreshIntervalRef = useRef(null);

  // ✅ NEW: Quick date presets
  const setQuickDate = (preset) => {
    const today = new Date();
    const formatDate = (date) => date.toISOString().split('T')[0];
    
    switch(preset) {
      case 'today':
        setDateRange({
          from: formatDate(today),
          to: formatDate(today)
        });
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        setDateRange({
          from: formatDate(yesterday),
          to: formatDate(yesterday)
        });
        break;
      case 'last7days':
        const last7 = new Date(today);
        last7.setDate(last7.getDate() - 7);
        setDateRange({
          from: formatDate(last7),
          to: formatDate(today)
        });
        break;
      case 'last30days':
        const last30 = new Date(today);
        last30.setDate(last30.getDate() - 30);
        setDateRange({
          from: formatDate(last30),
          to: formatDate(today)
        });
        break;
      case 'thisMonth':
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        setDateRange({
          from: formatDate(firstDay),
          to: formatDate(today)
        });
        break;
      case 'lastMonth':
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        setDateRange({
          from: formatDate(lastMonthStart),
          to: formatDate(lastMonthEnd)
        });
        break;
      case 'clear':
        setDateRange({ from: '', to: '' });
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    checkPermissionAndFetch();
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isSuperAdmin === true) {
      fetchNotifications();
      fetchStats();

      autoRefreshIntervalRef.current = setInterval(() => {
        fetchNotifications(true);
        fetchStats();
      }, 15000);
    }

    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, [filters, dateRange, isSuperAdmin]); // ✅ Added dateRange dependency

  const checkPermissionAndFetch = async () => {
    try {
      setLoading(true);
      const response = await request('notifications', 'get', { limit: 1 });

      if (response?.success) {
        setIsSuperAdmin(true);
      } else {
        setIsSuperAdmin(false);
      }
    } catch (error) {
      console.error('❌ Error checking permission:', error);
      if (error.response?.status === 403 || error.response?.data?.is_super_admin === false) {
        setIsSuperAdmin(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const params = { limit: 100 };

      if (filters.branch_name !== 'all') params.branch_name = filters.branch_name;
      if (filters.notification_type !== 'all') params.notification_type = filters.notification_type;
      if (filters.priority !== 'all') params.priority = filters.priority;
      if (filters.is_read !== 'all') params.is_read = filters.is_read;
      if (filters.search) params.search = filters.search;
      
      // ✅ NEW: Add date range parameters
      if (dateRange.from) params.date_from = dateRange.from;
      if (dateRange.to) params.date_to = dateRange.to;

      const response = await request('notifications', 'get', params);

      if (response?.success) {
        const newNotifs = response.data || [];

        const currentIds = new Set(newNotifs.map(n => n.id));
        const previousIds = previousNotificationIdsRef.current;

        const newIds = new Set();
        currentIds.forEach(id => {
          if (!previousIds.has(id)) {
            newIds.add(id);
          }
        });

        if (newIds.size > 0 && silent) {
          showToast(`📢 ${newIds.size} ការជូនដំណឹងថ្មី!`, 'info');
          playNotificationSound();

          setNewNotificationIds(newIds);
          setTimeout(() => {
            setNewNotificationIds(new Set());
          }, 10000);
        }

        previousNotificationIdsRef.current = currentIds;
        setNotifications(newNotifs);
        setBranches(response.available_branches || []);
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);

      if (error.response?.status === 403) {
        setIsSuperAdmin(false);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwPUKzn77tuHgg2j9n0yXksBSh+zPLaizsKGGS56+mnVBELTKXh8bllHAU2jdXzzn0vBSZ8y/HajDwKF2O56+qoVRILSqPg8LhlHgU0i9Txz34xBSR6yu/bjT0KFmG36OqoVRMKSKDe77h3HwU0idPx0YA0BSN4yO7cjD4KFV+16OmoVhQKRp3c7rp5IAUzhs/x04I2BSJ2xe3bjD8LFFu06OmoVxUKRJrb7bp6IgU0hM3y1YQ4BSB0wu7cjUALFFiz5+ipWBYKQpja7bt8IgY0gc3y1oU6BR90v+3cjkELE1ex5+iqWRYKQJfY7b1+JAY0fsz32Ic8BR1yvOzbjkILE1au5uiqWhYLP5XW7b5/JQY0fM/y2Yg+BRxwuuvbjkMLElOs5uirWxgLPZPU7byBJgY0es/z2ok/BRxuuOvcj0QMElGp5emrXBkLO5DR7b2CKAc0eM/z24lBBRxsuuvdkEQMEE+n5OirXRoLOpDQ7b2DKgc0dsz03IlDBRxrt+vdkEQND06k4+mrXhsLOY7P7r6FKwg0dMr03YpFBRxqtuvdkEQND0yi4umrXxwLOIzN7sCHLAg0csr034pHBR1otOrcjkUOD0uf4emsYBwMOIrL78GILAk1cMj03oxIBh1ntOrcjkYODkqd4OmsYR0MOInJ78KJLQk1bsb034xKBh5ltOrcjkYPDkib3+msYh4MOIfH8MSKLwo2bMP14Y1MBh5ks+ncjkgPDUaZ3emsYyAMN4XF8MWKLwo2asH14I5OBx9js+ncjkkPDUSX3OmsZCEMNoTD8MaKMAo2aMD14I9QCB9is+rdkUkQDUOV2+mtZCINN4K/8MeKMQo3Z730449RCCBhsunckkoPDUGT2umtZSMNN4C98MqKMgs3Zrz145BRCCBgsOndkkoQDUCS2emuZiQNNoC78MqKMws2ZLr145FSCSBfr+ndkkgQDT6Q2OmuZyUNN328746LNAw2Yrn045FSCSBfr+ndkkgPDT2O2OmvaCYNN324746LNQs2Yrj045RWCSB');
      audio.play().catch(e => e);
    } catch (e) {
    }
  };

  const fetchStats = async () => {
    try {
      const params = {};
      
      // ✅ NEW: Add date range to stats
      if (dateRange.from) params.date_from = dateRange.from;
      if (dateRange.to) params.date_to = dateRange.to;
      
      const response = await request('notifications/stats', 'get', params);
      if (response?.success) {
        setStats(response.stats || {});
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const response = await request(`notifications/${id}/read`, 'put');
      if (response?.success) {
        showToast('បានសម្គាល់ថាបានអាន ✓', 'success');
        fetchNotifications();
        fetchStats();
      }
    } catch (error) {
      showToast('មានបញ្ហា', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('តើអ្នកប្រាកដថាចង់លុប?')) return;

    try {
      const response = await request(`notifications/${id}`, 'delete');
      if (response?.success) {
        showToast('បានលុបជោគជ័យ 🗑️', 'success');
        fetchNotifications();
        fetchStats();
      }
    } catch (error) {
      showToast('មានបញ្ហា', 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const unreadCount = notifications.filter(n => !n.is_read && n.is_read !== 1).length;

  if (isSuperAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">កំពុងពិនិត្យសិទ្ធិ...</p>
        </div>
      </div>
    );
  }

  if (isSuperAdmin === false) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg shadow-2xl p-8 max-w-2xl w-full text-center border border-gray-700">
          <Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <h3 className="text-xl text-gray-400 mb-4">ការចូលប្រើប្រាស់ត្រូវបានបដិសេធ</h3>
          <p className="text-gray-400 mb-6">
            អ្នកមិនមានសិទ្ធិចូលមើលទំព័រនេះទេ។ សូមទាក់ទង Super Admin។
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              ត្រលប់ទៅ Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className="w-8 h-8 text-white" />
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </div>

              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  Notification Center
                  <span className="text-xs bg-yellow-500 px-2 py-1 rounded">SUPER ADMIN</span>
                  <span className="text-xs bg-green-500 px-2 py-1 rounded animate-pulse">AUTO 15s</span>
                </h1>
                <p className="text-sm text-white/90">
                  ការជូនដំណឹងពីប្រព័ន្ធទាំងអស់ / All System Notifications
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                fetchNotifications();
                fetchStats();
              }}
              disabled={loading}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Reload
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-white">{stats.total || 0}</div>
              <div className="text-xs text-white/80">Total</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-300">{stats.unread || 0}</div>
              <div className="text-xs text-white/80">Unread</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-300">{stats.orders || 0}</div>
              <div className="text-xs text-white/80">Orders</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-300">{stats.payments || 0}</div>
              <div className="text-xs text-white/80">Payments</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center border-2 border-cyan-400">
              <div className="text-2xl font-bold text-cyan-300">
                {notifications.filter(n => n.notification_type === 'login_alert').length}
              </div>
              <div className="text-xs text-white/80">🔐 Logins</div>
            </div>
          </div>
        </div>

        {/* ✅✅✅ DATE RANGE FILTER ✅✅✅ */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 mb-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <CalendarRange className="w-5 h-5 text-green-400" />
            <span className="font-semibold text-white">Date Range Filter:</span>
            {(dateRange.from || dateRange.to) && (
              <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                {dateRange.from && `From: ${dateRange.from}`} {dateRange.to && `To: ${dateRange.to}`}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-3">
            {/* From Date */}
            <div className="lg:col-span-2">
              <label className="block text-xs text-gray-400 mb-1">From Date:</label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* To Date */}
            <div className="lg:col-span-2">
              <label className="block text-xs text-gray-400 mb-1">To Date:</label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Quick Presets */}
            <div className="lg:col-span-4 flex flex-wrap gap-2 items-end">
              <button
                onClick={() => setQuickDate('today')}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Today
              </button>
              <button
                onClick={() => setQuickDate('yesterday')}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Yesterday
              </button>
              <button
                onClick={() => setQuickDate('last7days')}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setQuickDate('last30days')}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
              >
                Last 30 Days
              </button>
              <button
                onClick={() => setQuickDate('thisMonth')}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                This Month
              </button>
              <button
                onClick={() => setQuickDate('lastMonth')}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                Last Month
              </button>
              <button
                onClick={() => setQuickDate('clear')}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Regular Filters */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 mb-6 border border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-white">Filters:</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <select
              value={filters.branch_name}
              onChange={(e) => setFilters(prev => ({ ...prev, branch_name: e.target.value }))}
              className="px-3 py-2 border rounded-lg bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">សាខាទាំងអស់</option>
              {branches.map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>

            <select
              value={filters.notification_type}
              onChange={(e) => setFilters(prev => ({ ...prev, notification_type: e.target.value }))}
              className="px-3 py-2 border rounded-lg bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="order_created">📝 Orders</option>
              <option value="stock_update">📦 Stock Updates</option>
              <option value="customer_created">👤 Customers</option>
              <option value="login_alert">🔐 Login Alerts</option>
              <option value="payment_received">💰 Payments</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="px-3 py-2 border rounded-lg bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priority</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
            </select>

            <select
              value={filters.is_read}
              onChange={(e) => setFilters(prev => ({ ...prev, is_read: e.target.value }))}
              className="px-3 py-2 border rounded-lg bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="0">Unread</option>
              <option value="1">Read</option>
            </select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="ស្វែងរក..."
                className="w-full pl-10 pr-3 py-2 border rounded-lg bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
              <p className="text-gray-400 mt-4">Loading...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-gray-800 rounded-lg shadow-lg p-12 text-center border border-gray-700">
              <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No notifications</p>
              <p className="text-gray-500 text-sm mt-2">
                {filters.branch_name !== 'all' || filters.notification_type !== 'all' || filters.is_read !== 'all' || dateRange.from || dateRange.to
                  ? 'Try adjusting your filters or date range'
                  : 'Notifications will appear here'}
              </p>
            </div>
          ) : (
            <>
              {/* Results count */}
              <div className="mb-4 text-gray-400 text-sm">
                Showing {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                {(dateRange.from || dateRange.to) && (
                  <span className="ml-2 text-green-400">
                    (Filtered by date)
                  </span>
                )}
              </div>

              {/* Notification Cards */}
              {notifications.map(notification => (
                <TelegramNotificationCard
                  key={notification.id}
                  notification={notification}
                  isNew={newNotificationIds.has(notification.id)}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                  onCopy={() => showToast('Copied to clipboard! 📋', 'success')}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white flex items-center gap-3 animate-slide-in z-50 ${
          toast.type === 'success' ? 'bg-green-500' :
          toast.type === 'error' ? 'bg-red-500' :
          'bg-blue-500'
        }`}>
          {toast.type === 'success' && <Check className="w-5 h-5" />}
          {toast.type === 'error' && <X className="w-5 h-5" />}
          {toast.type === 'info' && <Bell className="w-5 h-5" />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="hover:bg-white/20 rounded p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slide-in-telegram {
          0% { 
            transform: translateX(100%) scale(0.8); 
            opacity: 0; 
          }
          50% {
            transform: translateX(-20px) scale(1.05);
          }
          100% { 
            transform: translateX(0) scale(1); 
            opacity: 1; 
          }
        }
        
        .animate-slide-in { 
          animation: slide-in 0.3s ease-out; 
        }
        
        .animate-slide-in-telegram {
          animation: slide-in-telegram 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>
    </div>
  );
}