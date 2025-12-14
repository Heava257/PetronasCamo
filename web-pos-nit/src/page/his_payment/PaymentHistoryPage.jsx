import React, { useEffect, useState } from "react";
import { EditOutlined, DeleteOutlined, ExclamationCircleOutlined, FilterOutlined, SearchOutlined } from '@ant-design/icons';
import { Form, InputNumber } from 'antd';

import {
  Button,
  Table,
  Tag,
  DatePicker,
  Space,
  Input,
  Card,
  Typography,
  Descriptions,
  Modal,
  Select,
  message,
  Image,
  List,
  Row, Col,
  Divider,
  Statistic,
  Avatar
} from "antd";
import { PrinterOutlined, UserOutlined, DollarOutlined, CalendarOutlined } from '@ant-design/icons';
import moment from 'moment';
import { IoEyeOutline } from 'react-icons/io5';
import { formatDateClient, isPermission, request } from "../../util/helper";
import MainPage from "../../component/layout/MainPage";
import { getProfile } from "../../store/profile.store";
import './PaymentHistoryPage.css';
import { Config } from "../../util/config";
import { FaLeaf } from "react-icons/fa";
import { useTranslation } from '../../locales/TranslationContext';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Option } = Select;

const khmerStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Khmer:wght@300;400;500;600;700&display=swap');
  
  * {
    font-family: 'Noto Sans Khmer', 'Khmer OS', 'Khmer OS System', sans-serif;
  }
  
  .payment-history-wrapper {
    min-height: 100vh;
    padding: 20px;
    transition: background-color 0.3s, color 0.3s;
  }
  
  /* Light Mode */
  .payment-history-wrapper {
    background: #f0f2f5;
    color: #333;
  }
  
  /* Dark Mode */
  .dark .payment-history-wrapper {
    background: #111827;
    color: #e5e7eb;
  }
  
  .payment-container {
    max-width: 1600px;
    margin: 0 auto;
  }
  
  /* Header Styles */
  .payment-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    padding: 32px;
    margin-bottom: 20px;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }
  
  .dark .payment-header {
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
  }
  
  .payment-header h1 {
    color: white !important;
    font-size: 28px;
    margin: 0 0 8px 0;
    font-weight: 600;
  }
  
  .payment-header p {
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
    font-size: 15px;
  }
  
  /* Filter Card */
  .filter-card {
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 20px;
    transition: background-color 0.3s, box-shadow 0.3s;
  }
  
  .filter-card {
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
  
  .dark .filter-card {
    background: #1f2937;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
  
  .filter-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 16px;
  }
  
  .filter-item label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 8px;
    transition: color 0.3s;
  }
  
  .filter-item label {
    color: #374151;
  }
  
  .dark .filter-item label {
    color: #d1d5db;
  }
  
  .filter-input,
  .filter-select,
  .filter-date {
    width: 100%;
    height: 40px;
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.3s;
  }
  
  .filter-input,
  .filter-select,
  .filter-date {
    border: 1px solid #d1d5db;
    background: white;
    color: #111827;
  }
  
  .dark .filter-input,
  .dark .filter-select,
  .dark .filter-date {
    border: 1px solid #374151;
    background: #374151;
    color: #e5e7eb;
  }
  
  .filter-input:focus,
  .filter-select:focus,
  .filter-date:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  .filter-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
  
  .btn-reset {
    height: 40px;
    padding: 0 20px;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-reset {
    border: 1px solid #d1d5db;
    background: white;
    color: #6b7280;
  }
  
  .dark .btn-reset {
    border: 1px solid #374151;
    background: #374151;
    color: #9ca3af;
  }
  
  .btn-reset:hover {
    border-color: #667eea;
    color: #667eea;
  }
  
  /* Stats Cards */
  .stats-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
  }
  
  .stat-card {
    border-radius: 12px;
    padding: 24px;
    border-left: 4px solid #667eea;
    transition: all 0.3s;
  }
  
  .stat-card {
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
  
  .dark .stat-card {
    background: #1f2937;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
  
  .stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
  
  .dark .stat-card:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  }
  
  .stat-card.customer {
    border-left-color: #8b5cf6;
  }
  
  .stat-card.payment {
    border-left-color: #ec4899;
  }
  
  .stat-card.amount {
    border-left-color: #10b981;
  }
  
  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    margin-bottom: 12px;
  }
  
  .stat-card.customer .stat-icon {
    background: #f3e8ff;
    color: #8b5cf6;
  }
  
  .dark .stat-card.customer .stat-icon {
    background: rgba(139, 92, 246, 0.2);
    color: #a78bfa;
  }
  
  .stat-card.payment .stat-icon {
    background: #fce7f3;
    color: #ec4899;
  }
  
  .dark .stat-card.payment .stat-icon {
    background: rgba(236, 72, 153, 0.2);
    color: #f9a8d4;
  }
  
  .stat-card.amount .stat-icon {
    background: #d1fae5;
    color: #10b981;
  }
  
  .dark .stat-card.amount .stat-icon {
    background: rgba(16, 185, 129, 0.2);
    color: #34d399;
  }
  
  .stat-label {
    font-size: 14px;
    margin-bottom: 8px;
    transition: color 0.3s;
  }
  
  .stat-label {
    color: #6b7280;
  }
  
  .dark .stat-label {
    color: #9ca3af;
  }
  
  .stat-value {
    font-size: 28px;
    font-weight: 700;
    line-height: 1;
    transition: color 0.3s;
  }
  
  .stat-value {
    color: #111827;
  }
  
  .dark .stat-value {
    color: #f3f4f6;
  }
  
  /* View Toggle */
  .view-toggle-card {
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    transition: background-color 0.3s, box-shadow 0.3s;
  }
  
  .view-toggle-card {
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
  
  .dark .view-toggle-card {
    background: #1f2937;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
  
  .view-toggle-wrapper {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .view-toggle-label {
    font-size: 15px;
    font-weight: 600;
    transition: color 0.3s;
  }
  
  .view-toggle-label {
    color: #374151;
  }
  
  .dark .view-toggle-label {
    color: #d1d5db;
  }
  
  .view-btn {
    height: 44px;
    padding: 0 24px;
    border-radius: 8px;
    border: 2px solid #e5e7eb;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .view-btn {
    background: white;
    color: #6b7280;
  }
  
  .dark .view-btn {
    background: #374151;
    border-color: #4b5563;
    color: #9ca3af;
  }
  
  .view-btn:hover {
    border-color: #667eea;
    color: #667eea;
  }
  
  .view-btn.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-color: #667eea;
    color: white;
  }
  
  /* Table Card */
  .table-card {
    border-radius: 12px;
    padding: 24px;
    min-height: 500px;
    transition: background-color 0.3s, box-shadow 0.3s;
  }
  
  .table-card {
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
  
  .dark .table-card {
    background: #1f2937;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
  
  .modern-table .ant-table {
    border-radius: 8px;
    overflow: hidden;
  }
  
  .modern-table .ant-table-thead > tr > th {
    font-weight: 600;
    font-size: 14px;
    padding: 16px;
    border-bottom: 2px solid #e5e7eb;
    transition: background-color 0.3s, color 0.3s;
  }
  
  .modern-table .ant-table-thead > tr > th {
    background: #f9fafb !important;
    color: #374151 !important;
  }
  
  .dark .modern-table .ant-table-thead > tr > th {
    background: #374151 !important;
    color: #d1d5db !important;
    border-bottom-color: #4b5563 !important;
  }
  
  .modern-table .ant-table-tbody > tr {
    transition: all 0.2s;
  }
  
  .modern-table .ant-table-tbody > tr > td {
    padding: 16px;
    font-size: 14px;
    transition: background-color 0.3s, color 0.3s, border-color 0.3s;
  }
  
  .modern-table .ant-table-tbody > tr > td {
    border-bottom: 1px solid #f3f4f6;
    color: #111827;
  }
  
  .dark .modern-table .ant-table-tbody > tr > td {
    border-bottom: 1px solid #374151;
    color: #e5e7eb;
  }
  
 .modern-table .ant-table-tbody > tr:hover > td {
    background: transparent !important;
  }
  
.modern-table .ant-table-tbody > tr:hover {
    background: #f9fafb !important;
  }
  
.dark .modern-table .ant-table-tbody > tr:hover {
    background: #374151 !important;
  }
    
  
  .dark .modern-table .ant-table {
    background: #1f2937 !important;
    color: #e5e7eb !important;
  }
  
  .dark .modern-table .ant-table-container {
    background: #1f2937 !important;
  }
  
  .dark .modern-table .ant-table-tbody {
    background: #1f2937 !important;
  }
  
  .dark .modern-table .ant-table-placeholder {
    background: #1f2937 !important;
    color: #9ca3af !important;
  }
  
  .dark .ant-empty-description {
    color: #9ca3af !important;
  }
  
  .modern-table .ant-empty {
    padding: 80px 0;
  }
  
  /* Action Buttons */
  .action-btn {
    height: 32px;
    padding: 0 12px;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  
  .action-btn {
    border: 1px solid #e5e7eb;
    background: white;
    color: #6b7280;
  }
  
  .dark .action-btn {
    border: 1px solid #4b5563;
    background: #374151;
    color: #9ca3af;
  }
  
  .action-btn:hover {
    border-color: #667eea;
    color: #667eea;
  }
  
  .dark .action-btn:hover {
    background: #4b5563;
  }
  
  .action-btn.primary {
    background: #667eea;
    border-color: #667eea;
    color: white;
  }
  
  .action-btn.primary:hover {
    background: #5568d3;
  }
  
  .action-btn.danger:hover {
    border-color: #ef4444;
    color: #ef4444;
  }
  
  /* Tags */
  .tag-modern {
    padding: 4px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    border: none;
  }
  
  .tag-green {
    background: #d1fae5;
    color: #065f46;
  }
  
  .dark .tag-green {
    background: rgba(16, 185, 129, 0.2);
    color: #34d399;
  }
  
  .tag-blue {
    background: #dbeafe;
    color: #1e40af;
  }
  
  .dark .tag-blue {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
  }
  
  .tag-orange {
    background: #fed7aa;
    color: #92400e;
  }
  
  .dark .tag-orange {
    background: rgba(251, 146, 60, 0.2);
    color: #fb923c;
  }
  
  .tag-purple {
    background: #e9d5ff;
    color: #6b21a8;
  }
  
  .dark .tag-purple {
    background: rgba(139, 92, 246, 0.2);
    color: #a78bfa;
  }
  
  /* Customer Info */
  .customer-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .customer-avatar {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 18px;
  }
  
  .customer-details {
    flex: 1;
  }
  
  .customer-name {
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 2px;
    transition: color 0.3s;
  }
  
  .customer-name {
    color: #111827;
  }
  
  .dark .customer-name {
    color: #f3f4f6;
  }
  
  .customer-contact {
    font-size: 12px;
    transition: color 0.3s;
  }
  
  .customer-contact {
    color: #6b7280;
  }
  
  .dark .customer-contact {
    color: #9ca3af;
  }
  
  /* Amount Display */
  .amount-text {
    font-size: 16px;
    font-weight: 700;
    color: #10b981;
  }
  
  .dark .amount-text {
    color: #34d399;
  }
  
  /* Date Display */
  .date-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    transition: color 0.3s;
  }
  
  .date-wrapper {
    color: #6b7280;
  }
  
  .dark .date-wrapper {
    color: #9ca3af;
  }
  
  /* Modal Styles */
  .modal-header {
    font-size: 18px;
    font-weight: 600;
    transition: color 0.3s;
  }
  
  .modal-header {
    color: #111827;
  }
  
  .dark .modal-header {
    color: #f3f4f6;
  }
  
  .ant-modal-content {
    border-radius: 12px;
  }
  
  .dark .ant-modal-content {
    background: #1f2937 !important;
  }
  
  .dark .ant-modal-header {
    background: #1f2937 !important;
    border-bottom-color: #374151 !important;
  }
  
  .dark .ant-modal-footer {
    background: #1f2937 !important;
    border-top-color: #374151 !important;
  }
  
  .dark .ant-modal-title {
    color: #f3f4f6 !important;
  }
  
  .dark .ant-modal-close {
    color: #9ca3af !important;
  }
  
  .dark .ant-modal-close:hover {
    color: #f3f4f6 !important;
  }
  
  /* Card Styles */
  .dark .ant-card {
    background: #374151 !important;
    border-color: #4b5563 !important;
  }
  
  .dark .ant-card-head {
    background: #374151 !important;
    border-bottom-color: #4b5563 !important;
    color: #f3f4f6 !important;
  }
  
  .dark .ant-card-body {
    background: #374151 !important;
    color: #e5e7eb !important;
  }
  
  .dark .ant-descriptions {
    background: #374151 !important;
  }
  
  .dark .ant-descriptions-view {
    border-color: #4b5563 !important;
  }
  
  .dark .ant-descriptions-row {
    border-bottom-color: #4b5563 !important;
  }
  
  .dark .ant-descriptions-item-label {
    background: #1f2937 !important;
    color: #9ca3af !important;
  }
  
  .dark .ant-descriptions-item-content {
    background: #374151 !important;
    color: #e5e7eb !important;
  }
  
  /* Form Styles */
  .ant-form-item-label > label {
    font-weight: 600;
    transition: color 0.3s;
  }
  
  .ant-form-item-label > label {
    color: #374151;
  }
  
  .dark .ant-form-item-label > label {
    color: #d1d5db !important;
  }
  
  .dark .ant-input,
  .dark .ant-input-number,
  .dark .ant-select-selector,
  .dark .ant-picker {
    background: #374151 !important;
    border-color: #4b5563 !important;
    color: #e5e7eb !important;
  }
  
  .dark .ant-input::placeholder,
  .dark .ant-select-selection-placeholder {
    color: #6b7280 !important;
  }
  
  .dark .ant-select-dropdown {
    background: #374151 !important;
  }
  
  .dark .ant-select-item {
    background: #374151 !important;
    color: #e5e7eb !important;
  }
  
  .dark .ant-select-item-option-selected {
    background: #4b5563 !important;
  }
  
  .dark .ant-select-item-option-active {
    background: #4b5563 !important;
  }
  
  .dark .ant-picker-panel-container {
    background: #374151 !important;
  }
  
  .dark .ant-picker-panel {
    background: #374151 !important;
    border-color: #4b5563 !important;
  }
  
  .dark .ant-picker-header,
  .dark .ant-picker-body,
  .dark .ant-picker-footer {
    background: #374151 !important;
    color: #e5e7eb !important;
  }
  
  .dark .ant-picker-cell {
    color: #e5e7eb !important;
  }
  
  .dark .ant-picker-cell:hover .ant-picker-cell-inner {
    background: #4b5563 !important;
  }
  
  .dark .ant-picker-cell-in-view.ant-picker-cell-selected .ant-picker-cell-inner {
    background: #667eea !important;
  }
  
  .dark .ant-btn {
    border-color: #4b5563 !important;
    background: #374151 !important;
    color: #e5e7eb !important;
  }
  
  .dark .ant-btn-primary {
    background: #667eea !important;
    border-color: #667eea !important;
    color: white !important;
  }
  
  .dark .ant-btn:hover {
    border-color: #667eea !important;
    color: #667eea !important;
  }
  
  .dark .ant-btn-primary:hover {
    background: #5568d3 !important;
    border-color: #5568d3 !important;
    color: white !important;
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .payment-history-wrapper {
      padding: 12px;
    }
    
    .payment-header {
      padding: 20px;
    }
    
    .payment-header h1 {
      font-size: 22px;
    }
    
    .filter-grid {
      grid-template-columns: 1fr;
    }
    
    .stats-container {
      grid-template-columns: 1fr;
    }
    
    .view-toggle-wrapper {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .table-card {
      padding: 16px;
      min-height: 400px;
    }
  }
  
  /* Scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: #f3f4f6;
    border-radius: 4px;
  }
  
  .dark ::-webkit-scrollbar-track {
    background: #374151;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 4px;
  }
  
  .dark ::-webkit-scrollbar-thumb {
    background: #4b5563;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }
  
  .dark ::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
  }
`;
const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);
};
const printCustomerPaymentReport = (customerData) => {
  const { customer_name, customer_phone, customer_email, payments } = customerData;
  const totalAmount = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  const printContent = `
    <html>
      <head>
        <title>របាយការណ៍ការទូទាត់អតិថិជន</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body { 
            font-family: 'Khmer OS Siemreap', 'Khmer OS', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.4;
            color: #333;
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .print-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: white !important;
          }

          .header { 
            text-align: center; 
            border-bottom: 3px solid #2c3e50;
            padding-bottom: 20px; 
            margin-bottom: 30px;
            background: white !important;
          }

          .header h1 {
            font-size: 28px;
            color: #2c3e50;
            margin-bottom: 8px;
            font-weight: 600;
          }

          .header .subtitle {
            font-size: 14px;
            color: #7f8c8d;
            font-weight: normal;
          }

          .customer-section {
            margin-bottom: 30px;
            background: white !important;
          }

          .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #ecf0f1;
          }

          .customer-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
          }

          .info-item {
            display: flex;
            align-items: center;
          }

          .info-label {
            font-weight: 600;
            color: #34495e;
            min-width: 120px;
            margin-right: 10px;
          }

          .info-value {
            color: #2c3e50;
            flex: 1;
          }

          .payments-section {
            margin-top: 30px;
            background: white !important;
          }

          .payment-card {
            border: 1px solid #ddd;
            margin-bottom: 20px;
            border-radius: 8px;
            overflow: hidden;
            background: white !important;
            box-shadow: none !important;
          }

          .payment-header {
            background: #34495e !important;
            color: white !important;
            padding: 12px 16px;
            font-weight: 600;
            font-size: 14px;
          }

          .payment-body {
            padding: 16px;
            background: white !important;
          }

          .payment-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 12px;
          }

          .payment-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 0;
            border-bottom: 1px dotted #ddd;
          }

          .payment-row:last-child {
            border-bottom: none;
            margin-top: 8px;
            padding-top: 12px;
          }

          .payment-label {
            font-weight: 500;
            color: #7f8c8d;
            font-size: 13px;
          }

          .payment-value {
            font-weight: 500;
            color: #2c3e50;
            text-align: right;
          }

          .amount-highlight {
            font-size: 16px !important;
            font-weight: 700 !important;
            color: #27ae60 !important;
          }

          .method-tag {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .method-cash { 
            background: #d5f4e6 !important; 
            color: #27ae60 !important; 
            border: 1px solid #27ae60;
          }
          
          .method-card { 
            background: #dae8fc !important; 
            color: #3498db !important; 
            border: 1px solid #3498db;
          }
          
          .method-transfer { 
            background: #fdeaa7 !important; 
            color: #f39c12 !important; 
            border: 1px solid #f39c12;
          }

          .summary-section {
            margin-top: 30px;
            padding: 20px;
            border: 2px solid #34495e;
            border-radius: 8px;
            background: white !important;
          }

          .summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 15px;
          }

          .summary-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
          }

          .summary-label {
            font-weight: 600;
            color: #34495e;
          }

          .summary-value {
            font-weight: 700;
            color: #2c3e50;
          }

          .total-amount {
            font-size: 20px !important;
            color: #27ae60 !important;
          }

          .footer {
            margin-top: 40px;
            text-align: center;
            color: #95a5a6;
            font-size: 12px;
            border-top: 1px solid #ecf0f1;
            padding-top: 20px;
          }

          @media print {
            body { 
              margin: 0 !important;
              background: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            * {
              background: white !important;
              box-shadow: none !important;
            }
            
            .print-container {
              max-width: none;
              margin: 0;
              padding: 15px;
            }
            
            .payment-header {
              background: #34495e !important;
              color: white !important;
            }
            
            .method-cash { 
              background: #d5f4e6 !important; 
              color: #27ae60 !important; 
            }
            
            .method-card { 
              background: #dae8fc !important; 
              color: #3498db !important; 
            }
            
            .method-transfer { 
              background: #fdeaa7 !important; 
              color: #f39c12 !important; 
            }

            .no-print { 
              display: none !important; 
            }

            .page-break {
              page-break-before: always;
            }
          }

          @page {
            margin: 1cm;
            size: A4;
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <div class="header">
            <h1>របាយការណ៍ការទូទាត់អតិថិជន</h1>
            <div class="subtitle">បង្កើតនៅថ្ងៃទី ${moment().format('DD/MM/YYYY HH:mm')}</div>
          </div>
          
          <div class="customer-section">
            <div class="section-title">ព័ត៌មានអតិថិជន</div>
            <div class="customer-grid">
              <div class="info-item">
                <span class="info-label">ឈ្មោះ៖</span>
                <span class="info-value">${customer_name || 'មិនមាន'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">លេខទូរស័ព្ទ៖</span>
                <span class="info-value">${customer_phone || 'មិនមាន'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">អ៊ីមែល៖</span>
                <span class="info-value">${customer_email || 'មិនមាន'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">ចំនួនទូទាត់៖</span>
                <span class="info-value">${payments.length} ប្រតិបត្តិការ</span>
              </div>
            </div>
          </div>

          <div class="payments-section">
            <div class="section-title">ប្រវត្តិការទូទាត់ (${payments.length} ការទូទាត់)</div>
            
            ${payments.map((payment, index) => `
              <div class="payment-card">
                <div class="payment-header">
                  ការទូទាត់ #${index + 1} - លេខប័ណ្ណ ${payment.product_description ? payment.product_description.toString().padStart(4, '0') : 'មិនមាន'}
                </div>
                <div class="payment-body">
                  <div class="payment-grid">
                    <div class="payment-row">
                      <span class="payment-label">កាលបរិច្ឆេទ៖</span>
                      <span class="payment-value">${formatDateClient(payment.payment_date)}</span>
                    </div>
                    <div class="payment-row">
                      <span class="payment-label">ចំនួនទឹកប្រាក់៖</span>
                      <span class="payment-value amount-highlight">${formatCurrency(payment.amount)}</span>
                    </div>
                    <div class="payment-row">
                      <span class="payment-label">វិធីសាស្ត្រ៖</span>
                      <span class="payment-value">
                        <span class="method-tag method-${payment.payment_method === 'cash' ? 'cash' : payment.payment_method === 'credit_card' ? 'card' : 'transfer'}">
                          ${payment.payment_method === 'cash' ? 'សាច់ប្រាក់' :
      payment.payment_method === 'credit_card' ? 'កាតឥណទាន' :
        payment.payment_method === 'bank_transfer' ? 'ប្រេវេសប្រាក់' : 'មិនមាន'}
                        </span>
                      </span>
                    </div>
                    <div class="payment-row">
                      <span class="payment-label">ប្រមូលដោយ៖</span>
                      <span class="payment-value">${payment.collected_by || 'មិនមាន'}</span>
                    </div>
                    <div class="payment-row">
                      <span class="payment-label">ប្រភេទ៖</span>
                      <span class="payment-value">${payment.category_name || 'មិនមាន'}</span>
                    </div>
                    ${payment.notes ? `
                      <div class="payment-row">
                        <span class="payment-label">កំណត់ចំណាំ៖</span>
                        <span class="payment-value">${payment.notes}</span>
                      </div>
                    ` : ''}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="summary-section">
            <div class="section-title">សង្ខេប</div>
            <div class="summary-grid">
              <div class="summary-item">
                <span class="summary-label">ការទូទាត់សរុប៖</span>
                <span class="summary-value">${payments.length}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">ចំនួនទឹកប្រាក់សរុប៖</span>
                <span class="summary-value total-amount">${formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>សូមអរគុណសម្រាប់ការធ្វើអាជីវកម្មរបស់អ្នក!</p>
            <p>នេះជារបាយការណ៍ដែលបង្កើតដោយកុំព្យូទ័រ។</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  printWindow.document.open();
  printWindow.document.write(printContent);
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };
};

const printSinglePaymentReport = (payment) => {
  const printContent = `
      <html>
        <head>
          <title>បង្កាន់ដៃការទូទាត់</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body { 
              font-family: 'Khmer OS Siemreap', 'Khmer OS', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.5;
              color: #333;
              background: white !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
  
            .receipt-container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background: white !important;
            }
  
            .receipt-header { 
              text-align: center; 
              border-bottom: 3px solid #2c3e50;
              padding-bottom: 20px; 
              margin-bottom: 30px;
              background: white !important;
            }
  
            .receipt-header h1 {
              font-size: 32px;
              color: #2c3e50;
              margin-bottom: 8px;
              font-weight: 700;
            }
  
            .receipt-header h2 {
              font-size: 20px;
              color: #3498db;
              margin-bottom: 8px;
              font-weight: 600;
            }
  
            .receipt-header .date {
              font-size: 14px;
              color: #7f8c8d;
              font-weight: normal;
            }
  
            .receipt-body {
              background: white !important;
              border: 1px solid #ddd;
              border-radius: 8px;
              overflow: hidden;
              margin-bottom: 25px;
            }
  
            .info-section {
              padding: 20px;
              background: white !important;
            }
  
            .info-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 12px 0;
              border-bottom: 1px dotted #ddd;
            }
  
            .info-row:last-child {
              border-bottom: none;
            }
  
            .info-label {
              font-weight: 600;
              color: #34495e;
              min-width: 180px;
              font-size: 14px;
            }
  
            .info-value {
              text-align: right;
              flex: 1;
              font-weight: 500;
              color: #2c3e50;
              font-size: 14px;
            }
  
            .amount-section {
              background: #ecf0f1 !important;
              padding: 25px;
              text-align: center;
              border-top: 3px solid #3498db;
              margin: 25px 0;
              border-radius: 8px;
            }
  
            .amount-section h2 {
              color: #2c3e50;
              margin-bottom: 10px;
              font-size: 18px;
              font-weight: 600;
            }
  
            .amount-section .amount {
              font-size: 36px;
              font-weight: 700;
              color: #27ae60;
              margin: 0;
            }
  
            .method-tag {
              display: inline-block;
              padding: 6px 12px;
              border-radius: 6px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
  
            .method-cash { 
              background: #d5f4e6 !important; 
              color: #27ae60 !important; 
              border: 1px solid #27ae60;
            }
            
            .method-card { 
              background: #dae8fc !important; 
              color: #3498db !important; 
              border: 1px solid #3498db;
            }
            
            .method-transfer { 
              background: #fdeaa7 !important; 
              color: #f39c12 !important; 
              border: 1px solid #f39c12;
            }
  
            .receipt-footer {
              text-align: center;
              margin-top: 40px;
              color: #95a5a6;
              font-size: 12px;
              border-top: 1px solid #ecf0f1;
              padding-top: 20px;
            }
  
            .receipt-footer p {
              margin-bottom: 5px;
            }
  
            @media print {
              body { 
                margin: 0 !important;
                background: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              * {
                background: white !important;
                box-shadow: none !important;
              }
              
              .receipt-container {
                max-width: none;
                margin: 0;
                padding: 15px;
              }
              
              .amount-section {
                background: #ecf0f1 !important;
              }
              
              .method-cash { 
                background: #d5f4e6 !important; 
                color: #27ae60 !important; 
              }
              
              .method-card { 
                background: #dae8fc !important; 
                color: #3498db !important; 
              }
              
              .method-transfer { 
                background: #fdeaa7 !important; 
                color: #f39c12 !important; 
              }
  
              .no-print { 
                display: none !important; 
              }
            }
  
            @page {
              margin: 1cm;
              size: A4;
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="receipt-header">
              <h1>បង្កាន់ដៃការទូទាត់</h1>
              <h2>លេខប័ណ្ណ #${payment.product_description ? payment.product_description.toString().padStart(4, '0') : 'មិនមាន'}</h2>
              <div class="date">បង្កើតនៅថ្ងៃទី ${moment().format('DD/MM/YYYY HH:mm')}</div>
            </div>
            
            <div class="receipt-body">
              <div class="info-section">
                <div class="info-row">
                  <span class="info-label">កាលបរិច្ឆេទទូទាត់៖</span>
                  <span class="info-value">${payment.payment_date ? formatDateClient(payment.payment_date) : 'មិនមាន'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">ឈ្មោះអតិថិជន៖</span>
                  <span class="info-value">${payment.customer_name || 'មិនមាន'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">លេខទូរស័ព្ទអតិថិជន៖</span>
                  <span class="info-value">${payment.customer_phone || 'មិនមាន'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">អ៊ីមែលអតិថិជន៖</span>
                  <span class="info-value">${payment.customer_email || 'មិនមាន'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">វិធីសាស្ត្រទូទាត់៖</span>
                  <span class="info-value">
                    <span class="method-tag method-${payment.payment_method === 'cash' ? 'cash' : payment.payment_method === 'credit_card' ? 'card' : 'transfer'}">
                      ${payment.payment_method === 'cash' ? 'សាច់ប្រាក់' :
      payment.payment_method === 'credit_card' ? 'កាតឥណទាន' :
        payment.payment_method === 'bank_transfer' ? 'ប្រេវេសប្រាក់' : 'មិនមាន'}
                    </span>
                  </span>
                </div>
                <div class="info-row">
                  <span class="info-label">ប្រមូលដោយ៖</span>
                  <span class="info-value">${payment.collected_by || 'មិនមាន'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">ប្រភេទ៖</span>
                  <span class="info-value">${payment.category_name || 'មិនមាន'}</span>
                </div>
                ${payment.notes ? `
                  <div class="info-row">
                    <span class="info-label">កំណត់ចំណាំ៖</span>
                    <span class="info-value">${payment.notes}</span>
                  </div>
                ` : ''}
              </div>
            </div>
  
            <div class="amount-section">
              <h2>ចំនួនទឹកប្រាក់សរុបដែលបានទូទាត់</h2>
              <div class="amount">${formatCurrency(payment.amount)}</div>
            </div>
  
            <div class="receipt-footer">
              <p><strong>សូមអរគុណសម្រាប់ការទូទាត់របស់អ្នក!</strong></p>
              <p>នេះជាបង្កាន់ដៃដែលបង្កើតដោយកុំព្យូទ័រ។</p>
              <p>សូមរក្សាបង្កាន់ដៃនេះសម្រាប់កំណត់ត្រារបស់អ្នក។</p>
            </div>
          </div>
        </body>
      </html>
    `;

  const printWindow = window.open('', '_blank');
  printWindow.document.open();
  printWindow.document.write(printContent);
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };
};

function PaymentHistoryPage() {
  const [state, setState] = useState({
    payments: [],
    consolidatedCustomers: [],
    loading: false,
    total: 0,
    error: null
  });
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const [filter, setFilter] = useState({
    search: "",
    dateRange: null,
    payment_method: ""
  });

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = khmerStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5000,
  });

  const [editModal, setEditModal] = useState({
    visible: false,
    data: null,
    loading: false
  });

  const [form] = Form.useForm();

  const profile = getProfile();
  const userId = profile?.id;
  const [viewMode, setViewMode] = useState('customer');

  // Auto-search with debounce - only for filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination(prev => ({ ...prev, current: 1 }));
      getPaymentHistory();
    }, 500);

    return () => clearTimeout(timer);
  }, [filter.search, filter.dateRange, filter.payment_method, viewMode]);

  // Separate effect for pagination changes only
  useEffect(() => {
    if (pagination.current !== 1) {
      getPaymentHistory();
    }
  }, [pagination.current, pagination.pageSize]);

  // Initial load with default date range
  useEffect(() => {
    const defaultEndDate = moment();
    const defaultStartDate = moment().subtract(30, 'days');

    setFilter(prev => ({
      ...prev,
      dateRange: [defaultStartDate, defaultEndDate]
    }));

    getPaymentHistory();
  }, []);

  const consolidateCustomers = (payments) => {
    const customerMap = new Map();

    payments.forEach(payment => {
      const customerKey = [
        payment.customer_name?.trim().toLowerCase() || '',
        payment.customer_phone?.trim() || '',
        payment.customer_email?.trim().toLowerCase() || ''
      ].join('|');

      if (customerMap.has(customerKey)) {
        const existing = customerMap.get(customerKey);
        existing.payments.push(payment);
        existing.totalAmount += parseFloat(payment.amount || 0);
        existing.paymentCount = existing.payments.length;
        if (new Date(payment.payment_date) > new Date(existing.lastPaymentDate)) {
          existing.lastPaymentDate = payment.payment_date;
        }
      } else {
        customerMap.set(customerKey, {
          customer_name: payment.customer_name,
          customer_phone: payment.customer_phone,
          customer_email: payment.customer_email,
          payments: [payment],
          totalAmount: parseFloat(payment.amount || 0),
          paymentCount: 1,
          lastPaymentDate: payment.payment_date
        });
      }
    });

    return Array.from(customerMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  };

  const deletePayment = async (paymentId) => {
    Modal.confirm({
      title: <span>លុបការទូទាត់</span>,
      icon: <ExclamationCircleOutlined />,
      content: <span>តើអ្នកប្រាកដថាចង់លុបការទូទាត់នេះមែនទេ? ការលុបនេះមិនអាចត្រឡប់វិញបានទេ។</span>,
      okText: <span>លុប</span>,
      cancelText: <span>បោះបង់</span>,
      okType: 'danger',
      onOk: async () => {
        try {
          const res = await request(`payment/${paymentId}`, "delete");
          if (res?.success) {
            message.success('ការទូទាត់ត្រូវបានលុបដោយជោគជ័យ');
            await getPaymentHistory();
            if (customerDetailModal.visible) {
              await refreshCustomerModal();
            }
            if (paymentDetailModal.visible && paymentDetailModal.data?.id === paymentId) {
              setPaymentDetailModal({ visible: false, data: null });
            }
          } else {
            throw new Error(res?.error || "Failed to delete payment");
          }
        } catch (error) {
          message.error(error.message);
        }
      }
    });
  };

  const showEditModal = (payment) => {
    setEditModal({
      visible: true,
      data: payment,
      loading: false
    });

    form.setFieldsValue({
      amount: parseFloat(payment.amount) || 0,
      payment_method: payment.payment_method || 'cash',
      bank: payment.bank || null,
      payment_date: payment.payment_date ? moment(payment.payment_date) : moment(),
      notes: payment.notes || ''
    });
  };

  const updatePayment = async (values) => {
    try {
      setEditModal(prev => ({ ...prev, loading: true }));

      const updateData = {
        amount: parseFloat(values.amount),
        payment_method: values.payment_method,
        bank: values.bank || null,
        payment_date: values.payment_date.format('YYYY-MM-DD'),
        notes: values.notes || ''
      };

      const res = await request(`payment/${editModal.data.id}`, "put", updateData);

      if (res?.success) {
        message.success('ការទូទាត់ត្រូវបានកែប្រែដោយជោគជ័យ');

        if (res.data?.difference !== 0) {
          const diffAmount = Math.abs(res.data.difference);
          const diffType = res.data.difference > 0 ? 'បន្ថែម' : 'កាត់បន្ថយ';
          message.info(`បានកែប្រែចំនួនទឹកប្រាក់ ${diffType} ${formatCurrency(diffAmount)}`);
        }

        setEditModal({ visible: false, data: null, loading: false });
        form.resetFields();

        await getPaymentHistory();

        if (customerDetailModal.visible) {
          await refreshCustomerModal();
        }

        if (paymentDetailModal.visible && paymentDetailModal.data?.id === editModal.data.id) {
          setPaymentDetailModal({ visible: false, data: null });
        }
      } else {
        throw new Error(res?.error || "Failed to update payment");
      }
    } catch (error) {
      console.error('Update payment error:', error);
      message.error(error.response?.data?.error || error.message || 'មានបញ្ហាក្នុងការកែប្រែការទូទាត់');
      setEditModal(prev => ({ ...prev, loading: false }));
    }
  };

  const getPaymentHistory = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const params = {
        page: viewMode === 'customer' ? 1 : pagination.current,
        limit: viewMode === 'customer' ? 1000 : pagination.pageSize,
        search: filter.search,
        payment_method: filter.payment_method,
        ...(filter.dateRange && {
          from_date: filter.dateRange[0]?.format('YYYY-MM-DD'),
          to_date: filter.dateRange[1]?.format('YYYY-MM-DD')
        })
      };

      const res = await request(`payment/history/my-group`, "get", params);

      if (res?.success) {
        const payments = res.data.list;
        const consolidatedCustomers = consolidateCustomers(payments);

        setState({
          payments: payments,
          consolidatedCustomers: consolidatedCustomers,
          loading: false,
          total: res.data.pagination.total,
          error: null
        });
      } else {
        throw new Error(res?.error || "Failed to load payment history");
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
      message.error(error.message);
    }
  };

  const handleTableChange = (pagination) => {
    setPagination(pagination);
    getPaymentHistory();
  };

  const [customerDetailModal, setCustomerDetailModal] = useState({
    visible: false,
    data: null
  });

  const [paymentDetailModal, setPaymentDetailModal] = useState({
    visible: false,
    data: null
  });


  const showCustomerDetails = (customerData) => {
    setCustomerDetailModal({
      visible: true,
      data: customerData
    });
  };

  const showPaymentDetails = (paymentData) => {
    setPaymentDetailModal({
      visible: true,
      data: paymentData
    });
  };

  const refreshCustomerModal = async () => {
    if (customerDetailModal.visible && customerDetailModal.data) {
      await getPaymentHistory();
      const updatedCustomer = state.consolidatedCustomers.find(customer => {
        const currentCustomer = customerDetailModal.data;
        return (
          customer.customer_name === currentCustomer.customer_name &&
          customer.customer_phone === currentCustomer.customer_phone &&
          customer.customer_email === currentCustomer.customer_email
        );
      });

      if (updatedCustomer && updatedCustomer.payments.length > 0) {
        setCustomerDetailModal(prev => ({
          ...prev,
          data: updatedCustomer
        }));
      } else {
        setCustomerDetailModal({ visible: false, data: null });
        message.info('អតិថិជននេះមិនមានការទូទាត់នៅសល់ទេ');
      }
    }
  };
  const customerColumns = [
    {
      title: '',
      key: 'avatar',
      width: 60,
      align: 'center',
      render: (_, record) => (
        <div className="customer-avatar">
          <UserOutlined />
        </div>
      )
    },
    {
      title: t('customer_info'),
      key: 'customer_info',
      render: (_, record) => (
        <div className="customer-details">
          <div className="customer-name">{record.customer_name || t('no_data')}</div>
          <div className="customer-contact">
            {record.customer_phone || t('no_data')} • {record.customer_email || t('no_data')}
          </div>
        </div>
      )
    },
    {
      title: t('payments_count'),
      dataIndex: 'paymentCount',
      key: 'paymentCount',
      align: 'center',
      render: (count) => (
        <Tag className="tag-modern tag-blue">
          {count} {t('payments')}
        </Tag>
      )
    },
    {
      title: t('total_amount'),
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right',
      render: (amount) => (
        <div className="amount-text">
          {formatCurrency(amount)}
        </div>
      )
    },
    {
      title: t('actions'),
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space>
          <button
            className="action-btn"
            onClick={() => showCustomerDetails(record)}
          >
            <IoEyeOutline /> {t('view')}
          </button>
        </Space>
      )
    }
  ];

  const paymentColumns = [
    {
      title: t('card_number'),
      dataIndex: 'product_description',
      key: 'order_no',
      render: (text) => (
        <Tag className="tag-modern tag-purple">
          #{text ? text.toString().padStart(4, '0') : t('no_data')}
        </Tag>
      )
    },
    {
      title: t('date'),
      dataIndex: 'payment_date',
      key: 'payment_date',
      render: (date) => (
        <div className="date-wrapper">
          <CalendarOutlined />
          <span>{formatDateClient(date)}</span>
        </div>
      )
    },
    {
      title: t('customer'),
      key: 'customer_info',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: '4px' }}>
            {record.customer_name || t('no_data')}
          </div>
          <div style={{ color: '#6b7280', fontSize: '12px' }}>
            {record.customer_phone || t('no_data')}
          </div>
        </div>
      )
    },
    {
      title: t('amount'),
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (amount) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
          <DollarOutlined style={{ color: '#10b981' }} />
          <span className="amount-text">
            {formatCurrency(amount)}
          </span>
        </div>
      )
    },
    {
      title: t('method'),
      dataIndex: 'payment_method',
      key: 'payment_method',
      render: (method) => {
        const methodMap = {
          'cash': { className: 'tag-green', text: t('cash') },
          'credit_card': { className: 'tag-blue', text: t('credit_card') },
          'bank_transfer': { className: 'tag-orange', text: t('bank_transfer') }
        };
        const methodInfo = methodMap[method] || { className: 'tag-modern', text: t('no_data') };
        return (
          <Tag className={`tag-modern ${methodInfo.className}`}>
            {methodInfo.text}
          </Tag>
        );
      }
    },
    {
      title: t('actions'),
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space>
          <button
            className="action-btn"
            onClick={() => showPaymentDetails(record)}
          >
            <IoEyeOutline /> {t('view')}
          </button>
          <button
            className="action-btn"
            onClick={() => printSinglePaymentReport(record)}
          >
            <PrinterOutlined /> {t('print')}
          </button>
        </Space>
      )
    }
  ];
  const handleReset = () => {
    setFilter({
      search: "",
      dateRange: null,
      payment_method: ""
    });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  useEffect(() => {
    if (filter.search === "" && !filter.dateRange && filter.payment_method === "") {
    }
  }, [filter]);

  return (
    <MainPage loading={loading}>
      <div className="payment-history-wrapper">
        <div className="payment-container">
          {/* Header */}
          <div className="payment-header">
            <h1>{t('payment_history')}</h1>
            <p>{t('manage_track_payments')}</p>
          </div>

          {/* Filter Card */}
          <div className="filter-card">
            <div className="filter-grid">
              <div className="filter-item">
                <label>{t('search')}</label>
                <Input
                  className="filter-input"
                  placeholder={t('search_by_name_phone_email')}
                  value={filter.search}
                  onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                  prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                  allowClear
                />
              </div>

              <div className="filter-item">
                <label>{t('select_date_range')}</label>
                <RangePicker
                  className="filter-date"
                  value={filter.dateRange}
                  onChange={(dates) => setFilter(prev => ({ ...prev, dateRange: dates }))}
                  format="DD/MM/YYYY"
                  placeholder={[t('from_date'), t('to_date')]}
                />
              </div>

              <div className="filter-item">
                <label>{t('payment_method')}</label>
                <Select
                  className="filter-select"
                  placeholder={t('select_payment_method')}
                  value={filter.payment_method || undefined}
                  onChange={(value) => setFilter(prev => ({ ...prev, payment_method: value }))}
                  allowClear
                  suffixIcon={<FilterOutlined style={{ color: '#9ca3af' }} />}
                >
                  <Option value="cash">{t('cash')}</Option>
                  <Option value="credit_card">{t('credit_card')}</Option>
                  <Option value="bank_transfer">{t('bank_transfer')}</Option>
                </Select>
              </div>

              <div className="filter-item">
                <label style={{ visibility: 'hidden' }}>{t('actions')}</label>
                <button className="btn-reset" onClick={handleReset}>
                  {t('clear')}
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stats-container">
            <div className="stat-card customer">
              <div className="stat-icon">
                <UserOutlined />
              </div>
              <div className="stat-label">{t('total_customers')}</div>
              <div className="stat-value">{state.consolidatedCustomers.length}</div>
            </div>

            <div className="stat-card payment">
              <div className="stat-icon">
                <DollarOutlined />
              </div>
              <div className="stat-label">{t('total_payments')}</div>
              <div className="stat-value">{state.payments.length}</div>
            </div>

            <div className="stat-card amount">
              <div className="stat-icon">
                <DollarOutlined />
              </div>
              <div className="stat-label">{t('total_amount')}</div>
              <div className="stat-value" style={{ fontSize: '20px' }}>
                {formatCurrency(state.payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0))}
              </div>
            </div>
          </div>

          {/* View Toggle Card */}
          <div className="view-toggle-card">
            <div className="view-toggle-wrapper">
              <span className="view-toggle-label">{t('view_by')}</span>
              <button
                className={`view-btn ${viewMode === 'customer' ? 'active' : ''}`}
                onClick={() => setViewMode('customer')}
              >
                <UserOutlined />
                {t('customer')} ({state.consolidatedCustomers.length})
              </button>
              <button
                className={`view-btn ${viewMode === 'payment' ? 'active' : ''}`}
                onClick={() => setViewMode('payment')}
              >
                <DollarOutlined />
                {t('payment')} ({state.payments.length})
              </button>
            </div>
          </div>

          {/* Error Display */}
          {state.error && (
            <div style={{
              marginBottom: 20,
              padding: 16,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#dc2626'
            }}>
              <Text>{t('error_loading_data')}: {state.error}</Text>
            </div>
          )}

          {/* Table Card */}
          <div className="table-card">
            <div className="modern-table">
              <Table
                columns={viewMode === 'customer' ? customerColumns : paymentColumns}
                dataSource={viewMode === 'customer' ? state.consolidatedCustomers : state.payments}
                loading={state.loading}
                pagination={false}
                onChange={handleTableChange}
                rowKey={(record, index) =>
                  viewMode === 'customer'
                    ? `${record.customer_name}-${record.customer_phone}-${index}`
                    : record.id || index
                }
                scroll={{ x: 'max-content' }}
                size="middle"
              />
            </div>
          </div>
        </div>

        {/* Edit Payment Modal */}
        <Modal
          title={<span className="modal-header">{t('edit_payment')}</span>}
          open={editModal.visible}
          onCancel={() => {
            setEditModal({ visible: false, data: null, loading: false });
            form.resetFields();
          }}
          footer={[
            <Button
              key="cancel"
              onClick={() => {
                setEditModal({ visible: false, data: null, loading: false });
                form.resetFields();
              }}
            >
              {t('cancel')}
            </Button>,
            <Button
              key="submit"
              type="primary"
              loading={editModal.loading}
              onClick={() => form.submit()}
            >
              {t('save')}
            </Button>
          ]}
          width={700}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={updatePayment}
            style={{ marginTop: '20px' }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="amount"
                  label={t('payment_amount')}
                  rules={[
                    { required: true, message: t('enter_payment_amount') },
                    { type: 'number', min: 0.01, message: t('amount_greater_than_zero') }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder={t('enter_amount')}
                    min={0.01}
                    step={0.01}
                    formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="payment_method"
                  label={t('payment_method')}
                  rules={[{ required: true, message: t('select_payment_method_required') }]}
                >
                  <Select placeholder={t('select_payment_method')}>
                    <Option value="cash">{t('cash')}</Option>
                    <Option value="bank_transfer">{t('bank_transfer')}</Option>
                    <Option value="mobile_banking">{t('mobile_banking')}</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) =>
                prevValues.payment_method !== currentValues.payment_method
              }
            >
              {({ getFieldValue }) =>
                getFieldValue('payment_method') !== 'cash' && (
                  <Form.Item name="bank" label={t('select_bank')}>
                    <Select placeholder={t('select_bank')} allowClear>
                      <Option value="aba">{t('aba_bank')}</Option>
                      <Option value="acleda">{t('acleda_bank')}</Option>
                      <Option value="canadia">{t('canadia_bank')}</Option>
                      <Option value="wing">{t('wing_bank')}</Option>
                      <Option value="truemoney">{t('true_money')}</Option>
                      <Option value="pipay">{t('pi_pay')}</Option>
                      <Option value="bakong">{t('bakong')}</Option>
                    </Select>
                  </Form.Item>
                )
              }
            </Form.Item>

            <Form.Item
              name="payment_date"
              label={t('payment_date')}
              rules={[{ required: true, message: t('select_date_required') }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                placeholder={t('select_date')}
              />
            </Form.Item>

            <Form.Item name="notes" label={t('notes')}>
              <Input.TextArea
                rows={4}
                placeholder={t('enter_remarks')}
              />
            </Form.Item>

            {editModal.data && (
              <div style={{
                background: '#f0f9ff',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #bae6fd'
              }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <div style={{ color: '#0369a1', marginBottom: '4px', fontWeight: 600 }}>
                      {t('old_amount')}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#6b7280' }}>
                      {formatCurrency(editModal.data.amount)}
                    </div>
                  </Col>
                  <Col span={12}>
                    <Form.Item noStyle shouldUpdate>
                      {({ getFieldValue }) => {
                        const newAmount = getFieldValue('amount');
                        const difference = newAmount - parseFloat(editModal.data.amount);
                        return (
                          <>
                            <div style={{ color: '#0369a1', marginBottom: '4px', fontWeight: 600 }}>
                              {t('new_amount')}
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#16a34a' }}>
                              {formatCurrency(newAmount || 0)}
                            </div>
                            {difference !== 0 && (
                              <div style={{
                                fontSize: '13px',
                                color: difference > 0 ? '#16a34a' : '#dc2626',
                                marginTop: '4px'
                              }}>
                                {difference > 0 ? '↑' : '↓'} {formatCurrency(Math.abs(difference))}
                              </div>
                            )}
                          </>
                        );
                      }}
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            )}
          </Form>
        </Modal>

        <Modal
          title={<span className="modal-header">{t('customer_details')} - {customerDetailModal.data?.customer_name || t('no_data')}</span>}
          open={customerDetailModal.visible}
          onCancel={() => setCustomerDetailModal({ visible: false, data: null })}
          footer={[
            <Button key="print" icon={<PrinterOutlined />} onClick={() => printCustomerPaymentReport(customerDetailModal.data)}>
              {t('print_report')}
            </Button>,
            <Button key="close" onClick={() => setCustomerDetailModal({ visible: false, data: null })}>
              {t('close')}
            </Button>
          ]}
          width={1400}
        >
          {customerDetailModal.data && (
            <div>
              <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
                <Descriptions.Item label={t('customer_name')}>
                  {customerDetailModal.data.customer_name || t('no_data')}
                </Descriptions.Item>
                <Descriptions.Item label={t('customer_phone')}>
                  {customerDetailModal.data.customer_phone || t('no_data')}
                </Descriptions.Item>
                <Descriptions.Item label={t('customer_email')}>
                  {customerDetailModal.data.customer_email || t('no_data')}
                </Descriptions.Item>
                <Descriptions.Item label={t('payment_count')}>
                  <Tag color="blue">{customerDetailModal.data.paymentCount}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label={t('total_amount')} span={2}>
                  <span style={{ fontSize: 18, fontWeight: 'bold', color: '#27ae60' }}>
                    {formatCurrency(customerDetailModal.data.totalAmount)}
                  </span>
                </Descriptions.Item>
              </Descriptions>

              <Title level={4}>{t('payment_history')}</Title>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {customerDetailModal.data.payments.map((payment, index) => (
                  <Card
                    key={index}
                    size="small"
                    style={{
                      border: '1px solid #d9d9d9',
                      borderRadius: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    extra={
                      <Space>
                        <button className="action-btn" onClick={() => showPaymentDetails(payment)}>
                          <IoEyeOutline /> {t('view_details')}
                        </button>
                        {isPermission("customer.getone") && (
                          <button className="action-btn" onClick={() => showEditModal(payment)}>
                            <EditOutlined /> {t('edit')}
                          </button>
                        )}
                        {isPermission("customer.getone") && (
                          <button className="action-btn danger" onClick={() => deletePayment(payment.id)}>
                            <DeleteOutlined /> {t('delete')}
                          </button>
                        )}
                        <button className="action-btn" onClick={() => printSinglePaymentReport(payment)}>
                          <PrinterOutlined /> {t('print')}
                        </button>
                      </Space>
                    }
                  >
                    <Row gutter={[16, 8]}>
                      <Col span={24}>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: 'bold',
                          marginBottom: '8px',
                          color: '#1890ff'
                        }}>
                          {t('payment_number')} #{index + 1} - {t('card_number')} {payment.product_description ? payment.product_description.toString().padStart(4, '0') : t('no_data')}
                        </div>
                      </Col>

                      <Col span={6}>
                        <div>
                          <strong>{t('date')}:</strong>
                          <br />
                          {formatDateClient(payment.payment_date)}
                        </div>
                      </Col>

                      <Col span={6}>
                        <div>
                          <strong>{t('amount')}:</strong>
                          <br />
                          <span style={{ color: '#27ae60', fontWeight: 'bold', fontSize: '16px' }}>
                            {formatCurrency(payment.amount)}
                          </span>
                        </div>
                      </Col>

                      <Col span={6}>
                        <div>
                          <strong>{t('method')}:</strong>
                          <br />
                          {payment.payment_method === 'cash' ? t('cash') :
                            payment.payment_method === 'credit_card' ? t('credit_card') :
                              payment.payment_method === 'bank_transfer' ? t('bank_transfer') : t('no_data')}
                        </div>
                      </Col>

                      <Col span={6}>
                        <div>
                          <strong>{t('notes')}:</strong>
                          <br />
                          {payment.notes || t('no_data')}
                        </div>
                      </Col>

                      {payment.slips?.length > 0 && (
                        <Col span={24}>
                          <div style={{ marginTop: '8px' }}>
                            <strong>{t('slip_image')}:</strong>
                            <div style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '8px',
                              marginTop: '8px'
                            }}>
                              {payment.slips.map((imagePath, slipIndex) => {
                                const isBase64 = imagePath.startsWith('data:image');
                                const fullImageUrl = isBase64 ? imagePath : Config.getFullImagePath(imagePath);

                                return (
                                  <Image
                                    key={slipIndex}
                                    src={fullImageUrl}
                                    alt={`${t('slip_image')} ${slipIndex + 1}`}
                                    width={80}
                                    height={80}
                                    style={{
                                      borderRadius: '8px',
                                      objectFit: 'cover',
                                      border: '2px solid #d9d9d9',
                                    }}
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = '/path/to/placeholder.png';
                                    }}
                                    preview={{
                                      mask: <IoEyeOutline size={16} />
                                    }}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        </Col>
                      )}
                    </Row>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </Modal>

        {/* Payment Details Modal */}
        <Modal
          title={<span className="modal-header">{t('payment_details')} - {t('card_number')} #{paymentDetailModal.data?.product_description?.toString().padStart(4, '0') || t('no_data')}</span>}
          open={paymentDetailModal.visible}
          onCancel={() => setPaymentDetailModal({ visible: false, data: null })}
          footer={[
            <Button key="print" icon={<PrinterOutlined />} onClick={() => printSinglePaymentReport(paymentDetailModal.data)}>
              {t('print_receipt')}
            </Button>,
            <Button key="close" onClick={() => setPaymentDetailModal({ visible: false, data: null })}>
              {t('close')}
            </Button>
          ]}
          width={600}
        >
          {paymentDetailModal.data && (
            <Descriptions bordered column={1}>
              <Descriptions.Item label={t('payment_date')}>
                {formatDateClient(paymentDetailModal.data.payment_date)}
              </Descriptions.Item>
              <Descriptions.Item label={t('customer_name')}>
                {paymentDetailModal.data.customer_name || t('no_data')}
              </Descriptions.Item>
              <Descriptions.Item label={t('customer_phone')}>
                {paymentDetailModal.data.customer_phone || t('no_data')}
              </Descriptions.Item>
              <Descriptions.Item label={t('customer_email')}>
                {paymentDetailModal.data.customer_email || t('no_data')}
              </Descriptions.Item>
              <Descriptions.Item label={t('amount')}>
                <span style={{ fontSize: 18, fontWeight: 'bold', color: '#27ae60' }}>
                  {formatCurrency(paymentDetailModal.data.amount)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label={t('payment_method')}>
                <Tag color={
                  paymentDetailModal.data.payment_method === 'cash' ? 'green' :
                    paymentDetailModal.data.payment_method === 'credit_card' ? 'blue' : 'orange'
                }>
                  {paymentDetailModal.data.payment_method === 'cash' ? t('cash') :
                    paymentDetailModal.data.payment_method === 'credit_card' ? t('credit_card') :
                      paymentDetailModal.data.payment_method === 'bank_transfer' ? t('bank_transfer') : t('no_data')}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('collected_by')}>
                {paymentDetailModal.data.collected_by || t('no_data')}
              </Descriptions.Item>
              <Descriptions.Item label={t('category')}>
                {paymentDetailModal.data.category_name || t('no_data')}
              </Descriptions.Item>
              {paymentDetailModal.data.notes && (
                <Descriptions.Item label={t('notes')}>
                  {paymentDetailModal.data.notes}
                </Descriptions.Item>
              )}
            </Descriptions>
          )}
        </Modal>
      </div>
    </MainPage>
  );
}

export default PaymentHistoryPage;