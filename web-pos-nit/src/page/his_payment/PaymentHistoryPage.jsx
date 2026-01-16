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
    padding: 1rem;
    transition: background-color 0.3s, color 0.3s;
  }
  
  @media (min-width: 768px) {
    .payment-history-wrapper {
      padding: 1.25rem;
    }
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
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin-bottom: 1.25rem;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }
  
  @media (min-width: 768px) {
    .payment-header {
      padding: 2rem;
    }
  }
  
  .dark .payment-header {
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
  }
  
  .payment-header h1 {
    color: white !important;
    font-size: 1.5rem;
    margin: 0 0 0.5rem 0;
    font-weight: 600;
  }
  
  @media (min-width: 768px) {
    .payment-header h1 {
      font-size: 1.75rem;
    }
  }
  
  .payment-header p {
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
    font-size: 0.875rem;
  }
  
  @media (min-width: 768px) {
    .payment-header p {
      font-size: 0.9375rem;
    }
  }
  
  /* Filter Card */
  .filter-card {
    border-radius: 0.75rem;
    padding: 1rem;
    margin-bottom: 1.25rem;
    transition: background-color 0.3s, box-shadow 0.3s;
  }
  
  @media (min-width: 768px) {
    .filter-card {
      padding: 1.5rem;
    }
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
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  @media (min-width: 640px) {
    .filter-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  @media (min-width: 1024px) {
    .filter-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }
  
  .filter-item label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
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
    height: 2.5rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
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
    gap: 0.75rem;
    justify-content: flex-end;
  }
  
  .btn-reset {
    height: 2.5rem;
    padding: 0 1.25rem;
    border-radius: 0.5rem;
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
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-bottom: 1.25rem;
  }
  
  @media (min-width: 640px) {
    .stats-container {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  @media (min-width: 1024px) {
    .stats-container {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  
  .stat-card {
    border-radius: 0.75rem;
    padding: 1.25rem;
    border-left: 4px solid #667eea;
    transition: all 0.3s;
  }
  
  @media (min-width: 768px) {
    .stat-card {
      padding: 1.5rem;
    }
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
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.625rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    margin-bottom: 0.75rem;
  }
  
  @media (min-width: 768px) {
    .stat-icon {
      width: 3rem;
      height: 3rem;
      font-size: 1.5rem;
    }
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
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
    transition: color 0.3s;
  }
  
  .stat-label {
    color: #6b7280;
  }
  
  .dark .stat-label {
    color: #9ca3af;
  }
  
  .stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1;
    transition: color 0.3s;
  }
  
  @media (min-width: 768px) {
    .stat-value {
      font-size: 1.75rem;
    }
  }
  
  .stat-value {
    color: #111827;
  }
  
  .dark .stat-value {
    color: #f3f4f6;
  }
  
  /* View Toggle */
  .view-toggle-card {
    border-radius: 0.75rem;
    padding: 1rem;
    margin-bottom: 1.25rem;
    transition: background-color 0.3s, box-shadow 0.3s;
  }
  
  @media (min-width: 768px) {
    .view-toggle-card {
      padding: 1.25rem;
    }
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
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  @media (min-width: 640px) {
    .view-toggle-wrapper {
      flex-direction: row;
      align-items: center;
    }
  }
  
  .view-toggle-label {
    font-size: 0.9375rem;
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
    height: 2.75rem;
    padding: 0 1.5rem;
    border-radius: 0.5rem;
    border: 2px solid #e5e7eb;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    flex: 1;
  }
  
  @media (min-width: 640px) {
    .view-btn {
      flex: 0 0 auto;
    }
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
    border-radius: 0.75rem;
    padding: 1rem;
    min-height: 400px;
    transition: background-color 0.3s, box-shadow 0.3s;
    overflow-x: auto;
  }
  
  @media (min-width: 768px) {
    .table-card {
      padding: 1.5rem;
      min-height: 500px;
    }
  }
  
  .table-card {
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
  
  .dark .table-card {
    background: #1f2937;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
  
  /* Mobile Card View */
  .mobile-card-view {
    display: block;
  }
  
  @media (min-width: 768px) {
    .mobile-card-view {
      display: none;
    }
  }
  
  .mobile-table-view {
    display: none;
  }
  
  @media (min-width: 768px) {
    .mobile-table-view {
      display: block;
    }
  }
  
  .payment-mobile-card {
    background: white;
    border-radius: 0.75rem;
    padding: 1rem;
    margin-bottom: 1rem;
    border: 1px solid #e5e7eb;
    transition: all 0.3s;
  }
  
  .dark .payment-mobile-card {
    background: #374151;
    border-color: #4b5563;
  }
  
  .payment-mobile-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
  
  .dark .payment-mobile-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  .mobile-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .dark .mobile-card-header {
    border-bottom-color: #4b5563;
  }
  
  .mobile-card-title {
    font-size: 1rem;
    font-weight: 600;
    color: #111827;
  }
  
  .dark .mobile-card-title {
    color: #f3f4f6;
  }
  
  .mobile-card-body {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .mobile-card-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
  }
  
  .mobile-card-label {
    color: #6b7280;
    font-weight: 500;
  }
  
  .dark .mobile-card-label {
    color: #9ca3af;
  }
  
  .mobile-card-value {
    color: #111827;
    font-weight: 600;
    text-align: right;
  }
  
  .dark .mobile-card-value {
    color: #e5e7eb;
  }
  
  .mobile-card-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid #e5e7eb;
    flex-wrap: wrap;
  }
  
  .dark .mobile-card-actions {
    border-top-color: #4b5563;
  }
  
  .modern-table .ant-table {
    border-radius: 0.5rem;
    overflow: hidden;
  }
  
  .modern-table .ant-table-thead > tr > th {
    font-weight: 600;
    font-size: 0.875rem;
    padding: 1rem;
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
    padding: 1rem;
    font-size: 0.875rem;
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
    padding: 5rem 0;
  }
  
  @media (max-width: 767px) {
    .modern-table .ant-empty {
      padding: 3rem 0;
    }
  }
  
  /* Action Buttons */
  .action-btn {
    height: 2rem;
    padding: 0 0.75rem;
    border-radius: 0.375rem;
    font-size: 0.8125rem;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    white-space: nowrap;
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
    padding: 0.25rem 0.75rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
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
    gap: 0.75rem;
  }
  
  .customer-avatar {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.625rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.125rem;
    flex-shrink: 0;
  }
  
  .customer-details {
    flex: 1;
    min-width: 0;
  }
  
  .customer-name {
    font-weight: 600;
    font-size: 0.875rem;
    margin-bottom: 0.125rem;
    transition: color 0.3s;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .customer-name {
    color: #111827;
  }
  
  .dark .customer-name {
    color: #f3f4f6;
  }
  
  .customer-contact {
    font-size: 0.75rem;
    transition: color 0.3s;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .customer-contact {
    color: #6b7280;
  }
  
  .dark .customer-contact {
    color: #9ca3af;
  }
  
  /* Amount Display */
  .amount-text {
    font-size: 1rem;
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
    gap: 0.5rem;
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
    font-size: 1.125rem;
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
    border-radius: 0.75rem;
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
    /* Responsive Modal Styles */
@media (max-width: 768px) {
  .ant-modal {
    max-width: calc(100vw - 24px) !important;
    margin: 12px auto !important;
    top: 20px !important;
  }
  
  .ant-modal-content {
    max-height: calc(100vh - 40px) !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
  }
  
  .ant-modal-header {
    padding: 12px 16px !important;
    flex-shrink: 0 !important;
  }
  
  .ant-modal-title {
    font-size: 15px !important;
    line-height: 1.4 !important;
    word-break: break-word !important;
    padding-right: 24px !important;
  }
  
  .ant-modal-close {
    top: 12px !important;
    right: 12px !important;
  }
  
  .ant-modal-body {
    padding: 10px !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    flex: 1 1 auto !important;
    -webkit-overflow-scrolling: touch !important;
  }
  
  .ant-modal-footer {
    padding: 8px 12px !important;
    flex-shrink: 0 !important;
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 8px !important;
    border-top: 1px solid #e5e7eb !important;
  }
  
  .ant-modal-footer .ant-btn {
    margin: 0 !important;
    padding: 6px 12px !important;
    font-size: 13px !important;
    height: 36px !important;
    flex: 1 1 auto !important;
    min-width: 0 !important;
  }
  
  /* Descriptions responsive - Complete Override */
  .ant-descriptions {
    overflow: visible !important;
  }
  
  .ant-descriptions-bordered .ant-descriptions-view {
    border: 1px solid #e5e7eb !important;
    border-radius: 8px !important;
    overflow: hidden !important;
  }
  
  .dark .ant-descriptions-bordered .ant-descriptions-view {
    border-color: #4b5563 !important;
  }
  
  .ant-descriptions-bordered .ant-descriptions-row {
    display: block !important;
    border: none !important;
  }
  
  .ant-descriptions-bordered .ant-descriptions-item {
    display: grid !important;
    grid-template-columns: 35% 65% !important;
    border: none !important;
    border-bottom: 1px solid #e5e7eb !important;
  }
  
  .dark .ant-descriptions-bordered .ant-descriptions-item {
    border-bottom-color: #4b5563 !important;
  }
  
  .ant-descriptions-bordered .ant-descriptions-item:last-child {
    border-bottom: none !important;
  }
  
  .ant-descriptions-bordered .ant-descriptions-item-label {
    padding: 8px 10px !important;
    font-size: 12px !important;
    line-height: 1.4 !important;
    white-space: normal !important;
    word-break: break-word !important;
    font-weight: 600 !important;
    background: rgba(249, 250, 251, 0.5) !important;
    border: none !important;
    border-right: 1px solid #e5e7eb !important;
    display: flex !important;
    align-items: center !important;
    min-height: 36px !important;
  }
  
  .dark .ant-descriptions-bordered .ant-descriptions-item-label {
    background: rgba(55, 65, 81, 0.5) !important;
    border-right-color: #4b5563 !important;
    color: #9ca3af !important;
  }
  
  .ant-descriptions-bordered .ant-descriptions-item-content {
    padding: 8px 10px !important;
    font-size: 12px !important;
    line-height: 1.4 !important;
    white-space: normal !important;
    word-break: break-word !important;
    border: none !important;
    display: flex !important;
    align-items: center !important;
    background: transparent !important;
    min-height: 36px !important;
  }
  
  .dark .ant-descriptions-bordered .ant-descriptions-item-content {
    color: #e5e7eb !important;
  }
  
  /* Handle colspan */
  .ant-descriptions-item[colspan="2"] {
    grid-column: 1 / -1 !important;
  }
  
  .ant-descriptions-item[colspan="2"] .ant-descriptions-item-label {
    border-right: none !important;
  }
  
  /* Card responsive in modal */
  .ant-card {
    margin-bottom: 12px !important;
    border-radius: 8px !important;
  }
  
  .ant-card-head {
    padding: 10px 12px !important;
    min-height: auto !important;
  }
  
  .ant-card-head-title {
    font-size: 14px !important;
    padding: 0 !important;
  }
  
  .ant-card-body {
    padding: 12px !important;
  }
  
  .ant-card-extra {
    margin-left: 0 !important;
    margin-top: 8px !important;
    width: 100% !important;
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 6px !important;
  }
  
  /* Space responsive */
  .ant-space {
    width: 100% !important;
    flex-wrap: wrap !important;
    gap: 6px !important;
  }
  
  .ant-space-item {
    flex: 1 1 auto !important;
    min-width: 0 !important;
  }
  
  /* Action buttons in modal */
  .action-btn {
    flex: 1 !important;
    min-width: 0 !important;
    font-size: 11px !important;
    padding: 0 6px !important;
    height: 32px !important;
    white-space: nowrap !important;
  }
  
  .action-btn svg {
    font-size: 14px !important;
  }
  
  .action-btn span {
    display: none !important;
  }
  
  /* Row and Col responsive */
  .ant-row {
    margin-left: -4px !important;
    margin-right: -4px !important;
  }
  
  .ant-col {
    padding-left: 4px !important;
    padding-right: 4px !important;
  }
  
  .ant-col-24 {
    max-width: 100% !important;
    flex: 0 0 100% !important;
  }
  
  .ant-col-6 {
    max-width: 50% !important;
    flex: 0 0 50% !important;
  }
  
  /* Images in modal */
  .ant-image {
    width: 70px !important;
    height: 70px !important;
  }
  
  .ant-image-img {
    border-radius: 6px !important;
  }
  
  /* Title in modal */
  .ant-typography {
    font-size: 14px !important;
    margin-bottom: 8px !important;
    margin-top: 12px !important;
    font-weight: 600 !important;
  }
  
  /* Statistics text */
  .ant-statistic-content {
    font-size: 16px !important;
  }
  
  .ant-statistic-title {
    font-size: 12px !important;
  }
  
  /* Summary section in modal */
  .ant-descriptions-bordered .ant-descriptions-item-content span {
    display: inline-block !important;
    word-break: break-word !important;
  }
  
  /* Tag responsive */
  .ant-tag {
    margin: 2px !important;
    padding: 2px 8px !important;
    font-size: 12px !important;
  }
  
  /* Form items in modal */
  .ant-form-item {
    margin-bottom: 16px !important;
  }
  
  .ant-form-item-label {
    padding-bottom: 4px !important;
  }
  
  .ant-form-item-label > label {
    font-size: 13px !important;
  }
  
  .ant-input,
  .ant-input-number,
  .ant-select-selector,
  .ant-picker {
    font-size: 14px !important;
  }
}

/* Extra small devices */
@media (max-width: 480px) {
  .ant-modal {
    max-width: calc(100vw - 16px) !important;
    margin: 8px auto !important;
  }
  
  .ant-modal-title {
    font-size: 14px !important;
    padding-right: 20px !important;
  }
  
  .ant-modal-body {
    padding: 10px !important;
  }
  
  .ant-modal-footer {
    padding: 8px 10px !important;
  }
  
  .ant-modal-footer .ant-btn {
    font-size: 12px !important;
    height: 32px !important;
    padding: 4px 10px !important;
  }
  
  /* Tighter layout for descriptions */
  .ant-descriptions-bordered .ant-descriptions-item {
    grid-template-columns: 40% 60% !important;
  }
  
  .ant-descriptions-item-label,
  .ant-descriptions-item-content {
    font-size: 11px !important;
    padding: 6px 8px !important;
    min-height: 32px !important;
  }
  
  .action-btn {
    font-size: 10px !important;
    height: 28px !important;
    padding: 0 4px !important;
  }
  
  .action-btn svg {
    font-size: 12px !important;
  }
  
  .ant-card-body {
    padding: 10px !important;
  }
  
  .ant-card-head {
    padding: 8px 10px !important;
  }
  
  .ant-card-head-title {
    font-size: 13px !important;
  }
  
  .ant-image {
    width: 60px !important;
    height: 60px !important;
  }
  
  .ant-col-6 {
    max-width: 100% !important;
    flex: 0 0 100% !important;
    margin-bottom: 8px !important;
  }
  
  .ant-typography {
    font-size: 14px !important;
  }
}

/* Landscape mode for mobile */
@media (max-height: 500px) and (orientation: landscape) {
  .ant-modal-content {
    max-height: calc(100vh - 20px) !important;
  }
  
  .ant-modal-body {
    max-height: calc(100vh - 120px) !important;
  }
}
  
  .dark .ant-select-item {
    background: #374151 !important;
    color: #e5e7eb !important;
  }`
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
          
          .method-mobile { 
            background: #e9d5ff !important; 
            color: #8b5cf6 !important; 
            border: 1px solid #8b5cf6;
          }
          
          .method-debenture { 
            background: #fecaca !important; 
            color: #ef4444 !important; 
            border: 1px solid #ef4444;
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
            
            .method-mobile { 
              background: #e9d5ff !important; 
              color: #8b5cf6 !important; 
            }
            
            .method-debenture { 
              background: #fecaca !important; 
              color: #ef4444 !important; 
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
            
            ${payments.map((payment, index) => {
    const methodClass = getPaymentMethodClassForPrint(payment.payment_method);
    const methodText = getPaymentMethodTextForPrint(payment.payment_method, 'km');

    return `
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
                        <span class="method-tag method-${methodClass}">
                          ${methodText}
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
            `}).join('')}
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


const getPaymentMethodTextForPrint = (method, language = 'km') => {
  if (!method) return language === 'km' ? 'មិនមាន' : 'No data';

  const methodLower = method.toString().toLowerCase();

  if (language === 'km') {
    if (methodLower === 'cash') return 'សាច់ប្រាក់សុទ្ធ';
    if (methodLower === 'bank_transfer') return 'ធនាគារ';
    if (methodLower.includes('mobile')) return 'មូលប្បទានបត្រ';
    if (methodLower.includes('debenture')) return 'មូលប្បទានបត្រ';
    if (methodLower === 'credit_card') return 'កាតឥណទាន';
  } else {
    if (methodLower === 'cash') return 'Cash';
    if (methodLower === 'bank_transfer') return 'Bank Transfer';
    if (methodLower.includes('mobile')) return 'Mobile Banking';
    if (methodLower.includes('debenture')) return 'Debenture';
    if (methodLower === 'credit_card') return 'Credit Card';
  }

  return method;
};

const getPaymentMethodClassForPrint = (method) => {
  if (!method) return 'transfer';
  const methodLower = method.toString().toLowerCase();
  if (methodLower === 'cash') return 'cash';
  if (methodLower === 'credit_card') return 'card';
  if (methodLower === 'bank_transfer') return 'transfer';
  if (methodLower.includes('mobile')) return 'mobile';
  if (methodLower.includes('debenture')) return 'debenture';
  return 'transfer';
};
const printSinglePaymentReport = (payment) => {
  const methodClass = getPaymentMethodClassForPrint(payment.payment_method);
  const methodText = getPaymentMethodTextForPrint(payment.payment_method, 'km');

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
            
            .method-mobile { 
              background: #e9d5ff !important; 
              color: #8b5cf6 !important; 
              border: 1px solid #8b5cf6;
            }
            
            .method-debenture { 
              background: #fecaca !important; 
              color: #ef4444 !important; 
              border: 1px solid #ef4444;
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
              
              .method-mobile { 
                background: #e9d5ff !important; 
                color: #8b5cf6 !important; 
              }
              
              .method-debenture { 
                background: #fecaca !important; 
                color: #ef4444 !important; 
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
                    <span class="method-tag method-${methodClass}">
                      ${methodText}
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

  const getPaymentMethodDisplay = (method, t) => {
    if (!method) {
      return {
        className: 'tag-modern',
        text: t('no_data'),
        color: '#9ca3af'
      };
    }

    // Normalize the method string
    const methodStr = method.toString().trim();
    const methodLower = methodStr.toLowerCase();

    // Define all possible payment methods
    const methodMap = {
      // Exact matches
      'cash': {
        className: 'tag-green',
        text: t('cash'),
        color: '#10b981'
      },
      'bank_transfer': {
        className: 'tag-blue',
        text: t('bank_transfer'),
        color: '#3b82f6'
      },
      'mobile_banking': {
        className: 'tag-purple',
        text: t('mobile_banking'),
        color: '#8b5cf6'
      },
      'mobile_ban': {
        className: 'tag-purple',
        text: t('mobile_banking'),
        color: '#8b5cf6'
      },
      'debenture': {
        className: 'tag-orange',
        text: t('debenture'),
        color: '#f59e0b'
      },
      'Debenture': { // Handle capitalized version
        className: 'tag-orange',
        text: t('debenture'),
        color: '#f59e0b'
      },
      'credit_card': {
        className: 'tag-pink',
        text: t('credit_card'),
        color: '#ec4899'
      },
    };

    // Check for exact match first
    if (methodMap[methodStr]) {
      return methodMap[methodStr];
    }

    // Check for case-insensitive match
    if (methodMap[methodLower]) {
      return methodMap[methodLower];
    }

    // Check for partial matches
    if (methodLower.includes('mobile')) {
      return methodMap['mobile_banking'];
    }

    if (methodLower.includes('bank') && !methodLower.includes('mobile')) {
      return methodMap['bank_transfer'];
    }

    if (methodLower.includes('cash')) {
      return methodMap['cash'];
    }

    if (methodLower.includes('debenture')) {
      return methodMap['debenture'];
    }

    // Default fallback - show the raw value
    return {
      className: 'tag-modern',
      text: methodStr,
      color: '#6b7280'
    };
  };

  const PaymentMobileCard = ({ record, showPaymentDetails, printSinglePaymentReport }) => {
    const { t } = useTranslation();

    const methodInfo = getPaymentMethodDisplay(record.payment_method, t);

    return (
      <div className="payment-mobile-card">
        <div className="mobile-card-header">
          <div>
            <Tag className="tag-modern tag-purple" style={{ fontSize: '0.75rem' }}>
              #{record.product_description ? record.product_description.toString().padStart(4, '0') : t('no_data')}
            </Tag>
          </div>
          <div className="date-wrapper" style={{ fontSize: '0.6875rem' }}>
            <CalendarOutlined />
            <span>{formatDateClient(record.payment_date)}</span>
          </div>
        </div>

        <div className="mobile-card-body">
          <div className="mobile-card-row">
            <span className="mobile-card-label">{t('customer')}:</span>
            <span className="mobile-card-value" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {record.customer_name || t('no_data')}
            </span>
          </div>

          <div className="mobile-card-row">
            <span className="mobile-card-label">{t('phone')}:</span>
            <span className="mobile-card-value">{record.customer_phone || t('no_data')}</span>
          </div>

          <div className="mobile-card-row">
            <span className="mobile-card-label">{t('amount')}:</span>
            <span className="mobile-card-value amount-text" style={{ fontSize: '0.9375rem' }}>
              {formatCurrency(record.amount)}
            </span>
          </div>

          <div className="mobile-card-row">
            <span className="mobile-card-label">{t('method')}:</span>
            <span className="mobile-card-value">
              <Tag className={`tag-modern ${methodInfo.className}`} style={{ fontSize: '0.6875rem', color: methodInfo.color }}>
                {methodInfo.text}
              </Tag>
            </span>
          </div>
        </div>

        <div className="mobile-card-actions">
          <button
            className="action-btn"
            onClick={() => showPaymentDetails(record)}
          >
            <IoEyeOutline /> <span>{t('view')}</span>
          </button>
          <button
            className="action-btn"
            onClick={() => printSinglePaymentReport(record)}
          >
            <PrinterOutlined /> <span>{t('print')}</span>
          </button>
        </div>
      </div>
    );
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
        const methodInfo = getPaymentMethodDisplay(method, t);
        return (
          <Tag className={`tag-modern ${methodInfo.className}`} style={{ color: methodInfo.color }}>
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
  const CustomerMobileCard = ({ record, showCustomerDetails }) => {
    const { t } = useTranslation();

    return (
      <div className="payment-mobile-card">
        <div className="mobile-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
            <div className="customer-avatar">
              <UserOutlined />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="mobile-card-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {record.customer_name || t('no_data')}
              </div>
              <div className="customer-contact" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {record.customer_phone || t('no_data')}
              </div>
            </div>
          </div>
        </div>

        <div className="mobile-card-body">
          <div className="mobile-card-row">
            <span className="mobile-card-label">{t('payments_count')}:</span>
            <span className="mobile-card-value">
              <Tag className="tag-modern tag-blue" style={{ fontSize: '0.75rem' }}>
                {record.paymentCount}
              </Tag>
            </span>
          </div>

          <div className="mobile-card-row">
            <span className="mobile-card-label">{t('total_amount')}:</span>
            <span className="mobile-card-value amount-text" style={{ fontSize: '0.9375rem' }}>
              {formatCurrency(record.totalAmount)}
            </span>
          </div>

          <div className="mobile-card-row">
            <span className="mobile-card-label">{t('email')}:</span>
            <span className="mobile-card-value" style={{ fontSize: '0.6875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {record.customer_email || t('no_data')}
            </span>
          </div>
        </div>

        <div className="mobile-card-actions">
          <button
            className="action-btn primary"
            onClick={() => showCustomerDetails(record)}
          >
            <IoEyeOutline /> <span>{t('view')}</span>
          </button>
        </div>
      </div>
    );
  };
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
                  <Option value="mobile_banking">{t('mobile_banking')}</Option>     {/* ← ADD */}
                  <Option value="Debenture">{t('debenture')}</Option>                {/* ← ADD */}
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

          <div className="table-card">
            {/* Mobile Card View */}
            <div className="mobile-card-view">
              {state.loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <Text>{t('loading')}...</Text>
                </div>
              ) : (
                <>
                  {viewMode === 'customer' ? (
                    state.consolidatedCustomers.map((record, index) => (
                      <CustomerMobileCard
                        key={`${record.customer_name}-${record.customer_phone}-${index}`}
                        record={record}
                        showCustomerDetails={showCustomerDetails}
                      />
                    ))
                  ) : (
                    state.payments.map((record, index) => (
                      <PaymentMobileCard
                        key={record.id || index}
                        record={record}
                        showPaymentDetails={showPaymentDetails}
                        printSinglePaymentReport={printSinglePaymentReport}
                      />
                    ))
                  )}

                  {((viewMode === 'customer' && state.consolidatedCustomers.length === 0) ||
                    (viewMode === 'payment' && state.payments.length === 0)) && (
                      <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        color: '#9ca3af'
                      }}>
                        <Text>{t('no_data')}</Text>
                      </div>
                    )}
                </>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="mobile-table-view">
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
                    <Option value="Debenture">{t('debenture')}</Option>
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
                          <Tag className={`tag-modern ${getPaymentMethodDisplay(payment.payment_method, t).className}`}>
                            {getPaymentMethodDisplay(payment.payment_method, t).text}
                          </Tag>
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
                {(() => {
                  const methodInfo = getPaymentMethodDisplay(paymentDetailModal.data.payment_method, t);
                  return (
                    <Tag className={`tag-modern ${methodInfo.className}`} style={{ color: methodInfo.color }}>
                      {methodInfo.text}
                    </Tag>
                  );
                })()}
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