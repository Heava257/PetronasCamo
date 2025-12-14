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

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Option } = Select;

const khmerStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Khmer:wght@300;400;500;600;700&display=swap');
  
  * {
    font-family: 'Noto Sans Khmer', 'Khmer OS', 'Khmer OS System', sans-serif;
  }
  
  .payment-history-wrapper {
    background: #f0f2f5;
    min-height: 100vh;
    padding: 20px;
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
    background: white;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
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
    color: #374151;
    margin-bottom: 8px;
  }
  
  .filter-input,
  .filter-select,
  .filter-date {
    width: 100%;
    height: 40px;
    border-radius: 8px;
    border: 1px solid #d1d5db;
    font-size: 14px;
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
    border: 1px solid #d1d5db;
    background: white;
    color: #6b7280;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
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
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    border-left: 4px solid #667eea;
    transition: all 0.3s;
  }
  
  .stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
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
  
  .stat-card.payment .stat-icon {
    background: #fce7f3;
    color: #ec4899;
  }
  
  .stat-card.amount .stat-icon {
    background: #d1fae5;
    color: #10b981;
  }
  
  .stat-label {
    font-size: 14px;
    color: #6b7280;
    margin-bottom: 8px;
  }
  
  .stat-value {
    font-size: 28px;
    font-weight: 700;
    color: #111827;
    line-height: 1;
  }
  
  /* View Toggle */
  .view-toggle-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
  
  .view-toggle-wrapper {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .view-toggle-label {
    font-size: 15px;
    font-weight: 600;
    color: #374151;
  }
  
  .view-btn {
    height: 44px;
    padding: 0 24px;
    border-radius: 8px;
    border: 2px solid #e5e7eb;
    background: white;
    color: #6b7280;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
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
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    min-height: 500px;
  }
  
  .modern-table .ant-table {
    border-radius: 8px;
    overflow: hidden;
  }
  
  .modern-table .ant-table-thead > tr > th {
    background: #f9fafb;
    color: #374151;
    font-weight: 600;
    font-size: 14px;
    padding: 16px;
    border-bottom: 2px solid #e5e7eb;
  }
  
  .modern-table .ant-table-tbody > tr {
    transition: all 0.2s;
  }
  
  .modern-table .ant-table-tbody > tr > td {
    padding: 16px;
    font-size: 14px;
    border-bottom: 1px solid #f3f4f6;
  }
  
  .modern-table .ant-table-tbody > tr:hover {
    background: #f9fafb;
  }
  
  .modern-table .ant-table-tbody > tr:hover > td {
    background: transparent;
  }
  
  .modern-table .ant-empty {
    padding: 80px 0;
  }
  
  /* Action Buttons */
  .action-btn {
    height: 32px;
    padding: 0 12px;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
    background: white;
    color: #6b7280;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  
  .action-btn:hover {
    border-color: #667eea;
    color: #667eea;
    background: #f9fafb;
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
  
  .tag-blue {
    background: #dbeafe;
    color: #1e40af;
  }
  
  .tag-orange {
    background: #fed7aa;
    color: #92400e;
  }
  
  .tag-purple {
    background: #e9d5ff;
    color: #6b21a8;
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
    color: #111827;
    font-size: 14px;
    margin-bottom: 2px;
  }
  
  .customer-contact {
    font-size: 12px;
    color: #6b7280;
  }
  
  /* Amount Display */
  .amount-text {
    font-size: 16px;
    font-weight: 700;
    color: #10b981;
  }
  
  /* Date Display */
  .date-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #6b7280;
  }
  
  /* Modal Styles */
  .modal-header {
    font-size: 18px;
    font-weight: 600;
    color: #111827;
  }
  
  .ant-modal-content {
    border-radius: 12px;
  }
  
  .ant-modal-header {
    border-radius: 12px 12px 0 0;
    border-bottom: 1px solid #f3f4f6;
  }
  
  /* Form Styles */
  .ant-form-item-label > label {
    font-weight: 600;
    color: #374151;
  }
  
  .ant-input,
  .ant-input-number,
  .ant-select-selector,
  .ant-picker {
    border-radius: 8px !important;
    border-color: #d1d5db !important;
  }
  
  .ant-input:focus,
  .ant-input-number:focus,
  .ant-select-selector:focus,
  .ant-picker:focus {
    border-color: #667eea !important;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
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
  
  /* Loading State */
  .ant-spin-nested-loading {
    min-height: 200px;
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
  
  ::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 4px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
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
      title: 'អតិថិជន',
      key: 'customer_info',
      render: (_, record) => (
        <div className="customer-details">
          <div className="customer-name">{record.customer_name || 'មិនមាន'}</div>
          <div className="customer-contact">
            {record.customer_phone || 'មិនមាន'} • {record.customer_email || 'មិនមាន'}
          </div>
        </div>
      )
    },
    {
      title: 'ការទូទាត់',
      dataIndex: 'paymentCount',
      key: 'paymentCount',
      align: 'center',
      render: (count) => (
        <Tag className="tag-modern tag-blue">
          {count} ការទូទាត់
        </Tag>
      )
    },
    {
      title: 'ចំនួនទឹកប្រាក់សរុប',
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
      title: 'សកម្មភាព',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space>
          <button
            className="action-btn"
            onClick={() => showCustomerDetails(record)}
          >
            <IoEyeOutline /> មើល
          </button>
        </Space>
      )
    }
  ];

  const paymentColumns = [
    {
      title: 'លេខប័ណ្ណ',
      dataIndex: 'product_description',
      key: 'order_no',
      render: (text) => (
        <Tag className="tag-modern tag-purple">
          #{text ? text.toString().padStart(4, '0') : 'មិនមាន'}
        </Tag>
      )
    },
    {
      title: 'កាលបរិច្ឆេទ',
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
      title: 'អតិថិជន',
      key: 'customer_info',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: '4px' }}>
            {record.customer_name || 'មិនមាន'}
          </div>
          <div style={{ color: '#6b7280', fontSize: '12px' }}>
            {record.customer_phone || 'មិនមាន'}
          </div>
        </div>
      )
    },
    {
      title: 'ចំនួនទឹកប្រាក់',
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
      title: 'វិធីសាស្ត្រ',
      dataIndex: 'payment_method',
      key: 'payment_method',
      render: (method) => {
        const methodMap = {
          'cash': { className: 'tag-green', text: 'សាច់ប្រាក់' },
          'credit_card': { className: 'tag-blue', text: 'កាតឥណទាន' },
          'bank_transfer': { className: 'tag-orange', text: 'ប្រេវេសប្រាក់' }
        };
        const methodInfo = methodMap[method] || { className: 'tag-modern', text: 'មិនមាន' };
        return (
          <Tag className={`tag-modern ${methodInfo.className}`}>
            {methodInfo.text}
          </Tag>
        );
      }
    },
    {
      title: 'សកម្មភាព',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space>
          <button
            className="action-btn"
            onClick={() => showPaymentDetails(record)}
          >
            <IoEyeOutline /> មើល
          </button>
          <button
            className="action-btn"
            onClick={() => printSinglePaymentReport(record)}
          >
            <PrinterOutlined /> បោះពុម្ព
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
            <h1>ប្រវត្តិការទូទាត់</h1>
            <p>គ្រប់គ្រងនិងតាមដានការទូទាត់របស់អ្នក</p>
          </div>

          {/* Filter Card */}
          <div className="filter-card">
            <div className="filter-grid">
              <div className="filter-item">
                <label>ស្វែងរក</label>
                <Input
                  className="filter-input"
                  placeholder="ស្វែងរកតាមឈ្មោះ ទូរស័ព្ទ ឬអ៊ីមែល..."
                  value={filter.search}
                  onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                  prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                  allowClear
                />
              </div>

              <div className="filter-item">
                <label>ជ្រើសរើសកាលបរិច្ឆេទ</label>
                <RangePicker
                  className="filter-date"
                  value={filter.dateRange}
                  onChange={(dates) => setFilter(prev => ({ ...prev, dateRange: dates }))}
                  format="DD/MM/YYYY"
                  placeholder={['ចាប់ពីថ្ងៃ', 'ដល់ថ្ងៃ']}
                />
              </div>

              <div className="filter-item">
                <label>វិធីសាស្ត្រទូទាត់</label>
                <Select
                  className="filter-select"
                  placeholder="ជ្រើសរើសវិធីសាស្ត្រ"
                  value={filter.payment_method || undefined}
                  onChange={(value) => setFilter(prev => ({ ...prev, payment_method: value }))}
                  allowClear
                  suffixIcon={<FilterOutlined style={{ color: '#9ca3af' }} />}
                >
                  <Option value="cash">សាច់ប្រាក់</Option>
                  <Option value="credit_card">កាតឥណទាន</Option>
                  <Option value="bank_transfer">ប្រេវេសប្រាក់</Option>
                </Select>
              </div>

              <div className="filter-item">
                <label style={{ visibility: 'hidden' }}>សកម្មភាព</label>
                <button className="btn-reset" onClick={handleReset}>
                  សម្អាត
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
              <div className="stat-label">អតិថិជនសរុប</div>
              <div className="stat-value">{state.consolidatedCustomers.length}</div>
            </div>

            <div className="stat-card payment">
              <div className="stat-icon">
                <DollarOutlined />
              </div>
              <div className="stat-label">ការទូទាត់សរុប</div>
              <div className="stat-value">{state.payments.length}</div>
            </div>

            <div className="stat-card amount">
              <div className="stat-icon">
                <DollarOutlined />
              </div>
              <div className="stat-label">ចំនួនទឹកប្រាក់សរុប</div>
              <div className="stat-value" style={{ fontSize: '20px' }}>
                {formatCurrency(state.payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0))}
              </div>
            </div>
          </div>

          {/* View Toggle Card */}
          <div className="view-toggle-card">
            <div className="view-toggle-wrapper">
              <span className="view-toggle-label">មើលតាម:</span>
              <button
                className={`view-btn ${viewMode === 'customer' ? 'active' : ''}`}
                onClick={() => setViewMode('customer')}
              >
                <UserOutlined />
                អតិថិជន ({state.consolidatedCustomers.length})
              </button>
              <button
                className={`view-btn ${viewMode === 'payment' ? 'active' : ''}`}
                onClick={() => setViewMode('payment')}
              >
                <DollarOutlined />
                ការទូទាត់ ({state.payments.length})
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
              <Text>កំហុស: {state.error}</Text>
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
          title={<span className="modal-header">កែប្រែការទូទាត់</span>}
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
              បោះបង់
            </Button>,
            <Button
              key="submit"
              type="primary"
              loading={editModal.loading}
              onClick={() => form.submit()}
            >
              រក្សាទុក
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
                  label="ចំនួនទឹកប្រាក់"
                  rules={[
                    { required: true, message: 'សូមបញ្ចូលចំនួនទឹកប្រាក់' },
                    { type: 'number', min: 0.01, message: 'ចំនួនទឹកប្រាក់ត្រូវតែធំជាង 0' }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="បញ្ចូលចំនួនទឹកប្រាក់"
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
                  label="វិធីសាស្ត្រទូទាត់"
                  rules={[{ required: true, message: 'សូមជ្រើសរើសវិធីសាស្ត្រទូទាត់' }]}
                >
                  <Select placeholder="ជ្រើសរើសវិធីសាស្ត្រទូទាត់">
                    <Option value="cash">សាច់ប្រាក់</Option>
                    <Option value="bank_transfer">ផ្ទេរប្រាក់តាមធនាគារ</Option>
                    <Option value="mobile_banking">ធនាគារតាមទូរស័ព្ទ</Option>
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
                  <Form.Item name="bank" label="ធនាគារ">
                    <Select placeholder="ជ្រើសរើសធនាគារ" allowClear>
                      <Option value="aba">ABA Bank</Option>
                      <Option value="acleda">ACLEDA Bank</Option>
                      <Option value="canadia">Canadia Bank</Option>
                      <Option value="wing">Wing Bank</Option>
                      <Option value="truemoney">True Money</Option>
                      <Option value="pipay">Pi Pay</Option>
                      <Option value="bakong">Bakong</Option>
                    </Select>
                  </Form.Item>
                )
              }
            </Form.Item>

            <Form.Item
              name="payment_date"
              label="កាលបរិច្ឆេទទូទាត់"
              rules={[{ required: true, message: 'សូមជ្រើសរើសកាលបរិច្ឆេទ' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                placeholder="ជ្រើសរើសកាលបរិច្ឆេទ"
              />
            </Form.Item>

            <Form.Item name="notes" label="កំណត់ចំណាំ">
              <Input.TextArea
                rows={4}
                placeholder="បញ្ចូលកំណត់ចំណាំ (ស្រេចចិត្ត)"
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
                      ចំនួនចាស់:
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
                              ចំនួនថ្មី:
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

        {/* Customer Details Modal */}
        <Modal
          title={<span className="modal-header">ព័ត៌មានលម្អិតអតិថិជន - {customerDetailModal.data?.customer_name || 'មិនមាន'}</span>}
          open={customerDetailModal.visible}
          onCancel={() => setCustomerDetailModal({ visible: false, data: null })}
          footer={[
            <Button key="print" icon={<PrinterOutlined />} onClick={() => printCustomerPaymentReport(customerDetailModal.data)}>
              បោះពុម្ពរបាយការណ៍
            </Button>,
            <Button key="close" onClick={() => setCustomerDetailModal({ visible: false, data: null })}>
              បិទ
            </Button>
          ]}
          width={1400}
        >
          {customerDetailModal.data && (
            <div>
              <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
                <Descriptions.Item label="ឈ្មោះ">
                  {customerDetailModal.data.customer_name || 'មិនមាន'}
                </Descriptions.Item>
                <Descriptions.Item label="លេខទូរស័ព្ទ">
                  {customerDetailModal.data.customer_phone || 'មិនមាន'}
                </Descriptions.Item>
                <Descriptions.Item label="អ៊ីមែល">
                  {customerDetailModal.data.customer_email || 'មិនមាន'}
                </Descriptions.Item>
                <Descriptions.Item label="ចំនួនការទូទាត់">
                  <Tag color="blue">{customerDetailModal.data.paymentCount}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="ចំនួនទឹកប្រាក់សរុប" span={2}>
                  <span style={{ fontSize: 18, fontWeight: 'bold', color: '#27ae60' }}>
                    {formatCurrency(customerDetailModal.data.totalAmount)}
                  </span>
                </Descriptions.Item>
              </Descriptions>

              <Title level={4}>ប្រវត្តិការទូទាត់</Title>

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
                          <IoEyeOutline /> មើលលម្អិត
                        </button>
                        {isPermission("customer.getone") && (
                          <button className="action-btn" onClick={() => showEditModal(payment)}>
                            <EditOutlined /> កែប្រែ
                          </button>
                        )}
                        {isPermission("customer.getone") && (
                          <button className="action-btn danger" onClick={() => deletePayment(payment.id)}>
                            <DeleteOutlined /> លុប
                          </button>
                        )}
                        <button className="action-btn" onClick={() => printSinglePaymentReport(payment)}>
                          <PrinterOutlined /> បោះពុម្ព
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
                          ការទូទាត់ #{index + 1} - លេខប័ណ្ណ {payment.product_description ? payment.product_description.toString().padStart(4, '0') : 'មិនមាន'}
                        </div>
                      </Col>

                      <Col span={6}>
                        <div>
                          <strong>កាលបរិច្ឆេទ៖</strong>
                          <br />
                          {formatDateClient(payment.payment_date)}
                        </div>
                      </Col>

                      <Col span={6}>
                        <div>
                          <strong>ចំនួនទឹកប្រាក់៖</strong>
                          <br />
                          <span style={{ color: '#27ae60', fontWeight: 'bold', fontSize: '16px' }}>
                            {formatCurrency(payment.amount)}
                          </span>
                        </div>
                      </Col>

                      <Col span={6}>
                        <div>
                          <strong>វិធីសាស្ត្រ៖</strong>
                          <br />
                          {payment.payment_method === 'cash' ? 'សាច់ប្រាក់' :
                            payment.payment_method === 'credit_card' ? 'កាតឥណទាន' :
                              payment.payment_method === 'bank_transfer' ? 'ប្រេវេសប្រាក់' : 'មិនមាន'}
                        </div>
                      </Col>

                      <Col span={6}>
                        <div>
                          <strong>កំណត់ចំណាំ៖</strong>
                          <br />
                          {payment.notes || 'មិនមាន'}
                        </div>
                      </Col>

                      {payment.slips?.length > 0 && (
                        <Col span={24}>
                          <div style={{ marginTop: '8px' }}>
                            <strong>Payment Slips:</strong>
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
                                    alt={`Slip ${slipIndex + 1}`}
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
          title={<span className="modal-header">ព័ត៌មានលម្អិតការទូទាត់ - លេខប័ណ្ណ #{paymentDetailModal.data?.product_description?.toString().padStart(4, '0') || 'មិនមាន'}</span>}
          open={paymentDetailModal.visible}
          onCancel={() => setPaymentDetailModal({ visible: false, data: null })}
          footer={[
            <Button key="print" icon={<PrinterOutlined />} onClick={() => printSinglePaymentReport(paymentDetailModal.data)}>
              បោះពុម្ពបង្កាន់ដៃ
            </Button>,
            <Button key="close" onClick={() => setPaymentDetailModal({ visible: false, data: null })}>
              បិទ
            </Button>
          ]}
          width={600}
        >
          {paymentDetailModal.data && (
            <Descriptions bordered column={1}>
              <Descriptions.Item label="កាលបរិច្ឆេទទូទាត់">
                {formatDateClient(paymentDetailModal.data.payment_date)}
              </Descriptions.Item>
              <Descriptions.Item label="ឈ្មោះអតិថិជន">
                {paymentDetailModal.data.customer_name || 'មិនមាន'}
              </Descriptions.Item>
              <Descriptions.Item label="លេខទូរស័ព្ទ">
                {paymentDetailModal.data.customer_phone || 'មិនមាន'}
              </Descriptions.Item>
              <Descriptions.Item label="អ៊ីមែល">
                {paymentDetailModal.data.customer_email || 'មិនមាន'}
              </Descriptions.Item>
              <Descriptions.Item label="ចំនួនទឹកប្រាក់">
                <span style={{ fontSize: 18, fontWeight: 'bold', color: '#27ae60' }}>
                  {formatCurrency(paymentDetailModal.data.amount)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="វិធីសាស្ត្រទូទាត់">
                <Tag color={
                  paymentDetailModal.data.payment_method === 'cash' ? 'green' :
                    paymentDetailModal.data.payment_method === 'credit_card' ? 'blue' : 'orange'
                }>
                  {paymentDetailModal.data.payment_method === 'cash' ? 'សាច់ប្រាក់' :
                    paymentDetailModal.data.payment_method === 'credit_card' ? 'កាតឥណទាន' :
                      paymentDetailModal.data.payment_method === 'bank_transfer' ? 'ប្រេវេសប្រាក់' : 'មិនមាន'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="ប្រមូលដោយ">
                {paymentDetailModal.data.collected_by || 'មិនមាន'}
              </Descriptions.Item>
              <Descriptions.Item label="ប្រភេទ">
                {paymentDetailModal.data.category_name || 'មិនមាន'}
              </Descriptions.Item>
              {paymentDetailModal.data.notes && (
                <Descriptions.Item label="កំណត់ចំណាំ">
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