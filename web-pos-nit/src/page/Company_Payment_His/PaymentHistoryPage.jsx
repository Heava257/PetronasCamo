import { useEffect, useState } from "react";
import {
    Button,
    Table,
    Tag,
    Space,
    Card,
    Statistic,
    Row,
    Col,
    DatePicker,
    Select,
    Input,
    message,
    Modal,
    Descriptions,
    Tooltip,
    Form,
} from "antd";
import { formatDateClient, formatDateServer, request } from "../../util/helper";
import * as ExcelJS from 'exceljs';
import { AiOutlineEye, AiOutlineFileText } from "react-icons/ai";
import MainPage from "../../component/layout/MainPage";
import { FiSearch } from "react-icons/fi";
import { IoBook, IoRefresh } from "react-icons/io5";
import { MdPayment, MdDateRange, MdEdit, MdDelete } from "react-icons/md";
import { useTranslation } from '../../locales/TranslationContext';
import { configStore } from "../../store/configStore";


import dayjs from 'dayjs';
// import { Form } from "react-router-dom";

const { RangePicker } = DatePicker;

function Company_PaymentHistoryPage() {
    const { t } = useTranslation();
    const [list, setList] = useState([]);
    const [editFormRef] = Form.useForm();
    const { config } = configStore();

    const [loading, setLoading] = useState(false);
    const [state, setState] = useState({
        txtSearch: "",
        paymentMethod: "",
        dateRange: null,
        visibleDetailModal: false,
        visibleEditModal: false,
        selectedPayment: null,
    });

    useEffect(() => {
        getList();
    }, []);

    const getList = async () => {
        setLoading(true);
        const param = {
            txtSearch: state.txtSearch,
            payment_method: state.paymentMethod,
            start_date: state.dateRange ? dayjs(state.dateRange[0]).format('YYYY-MM-DD') : null,
            end_date: state.dateRange ? dayjs(state.dateRange[1]).format('YYYY-MM-DD') : null,
        };

        // Remove null values
        Object.keys(param).forEach(key => {
            if (param[key] === null || param[key] === '') delete param[key];
        });

        const res = await request("payable/all-payments", "get", param);
        setLoading(false);
        if (res) {
            setList(res.list || []);
        }
    };
    const onClickEdit = async (payment) => {
        const res = await request("payable", "get", { id: payment.payable_id });
        if (res && res.list && res.list.length > 0) {
            setState({
                ...state,
                visibleEditModal: true,
                selectedPayment: {
                    ...payment,
                    payable: res.list[0]
                },
            });
            editFormRef.setFieldsValue({
                id: payment.id,
                payment_amount: payment.payment_amount,
                payment_date: payment.payment_date ? dayjs(payment.payment_date) : null,
                payment_method: payment.payment_method,
                note: payment.note,
                card_number: payment.card_number,
                product_id: payment.product_id,
                category_id: payment.category_id,
            });
        }
    };

    const onClickDelete = (payment) => {
        Modal.confirm({
            title: "លុប​ការទូទាត់ / Delete Payment",
            content: `តើអ្នកប្រាកដទេថាចង់លុបការទូទាត់នេះ? ទឹកប្រាក់ $${parseFloat(payment.payment_amount).toFixed(2)} នឹងត្រូវបានត្រឡប់ទៅ Remaining Amount។ / Are you sure you want to delete this payment? $${parseFloat(payment.payment_amount).toFixed(2)} will be refunded to Remaining Amount.`,
            okText: "បាទ/ចាស / Yes",
            cancelText: "បោះបង់ / Cancel",
            okButtonProps: { danger: true },
            onOk: async () => {
                const res = await request("payable/payment", "delete", { id: payment.id });
                if (res && !res.error) {
                    message.success(res.message);
                    getList();
                    if (state.visibleDetailModal) {
                        onCloseDetailModal();
                    }
                }
            },
        });
    };
    const onFinishEdit = async (values) => {
        const data = {
            id: values.id,
            payment_amount: values.payment_amount,
            payment_date: dayjs(values.payment_date).format('YYYY-MM-DD'),
            payment_method: values.payment_method,
            note: values.note,
            card_number: values.card_number,
        };

        const res = await request("payable/payment", "put", data);

        if (res && !res.error) {
            message.success(res.message);
            getList();
            onCloseEditModal();
        }
    };

    const onCloseEditModal = () => {
        editFormRef.resetFields();
        setState({
            ...state,
            visibleEditModal: false,
            selectedPayment: null,
        });
    };
    const onClickViewDetail = async (payment) => {
        // Get payable details
        const res = await request("payable", "get", { id: payment.payable_id });
        if (res && res.list && res.list.length > 0) {
            setState({
                ...state,
                visibleDetailModal: true,
                selectedPayment: {
                    ...payment,
                    payable: res.list[0]
                },
            });
        } else {
            setState({
                ...state,
                visibleDetailModal: true,
                selectedPayment: payment,
            });
        }
    };

    const onCloseDetailModal = () => {
        setState({
            ...state,
            visibleDetailModal: false,
            selectedPayment: null,
        });
    };

    const ExportToExcel = async () => {
        if (list.length === 0) {
            message.warning("មិនមានទិន្នន័យសម្រាប់ Export / No data to export!");
            return;
        }
        const hideLoadingMessage = message.loading("កំពុងរៀបចំ... / Exporting...", 0);
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Payment History', {
                pageSetup: {
                    orientation: 'landscape',
                    paperSize: 9,
                    fitToPage: true,
                    fitToWidth: 1,
                    fitToHeight: 0,
                    horizontalCentered: true,
                    margins: {
                        left: 0.2,
                        right: 0.2,
                        top: 0.4,
                        bottom: 0.4,
                        header: 0.3,
                        footer: 0.3
                    }
                }
            });
            workbook.created = new Date();
            workbook.modified = new Date();

            // ✅ Title Row
            worksheet.mergeCells('A1:O1');
            const titleCell = worksheet.getCell('A1');
            titleCell.value = `តារាងបង់ប្រាក់ក្រុមហ៊ុន - ប្រវត្តិការទូទាត់`;
            titleCell.font = {
                size: 16,
                bold: true,
                name: 'Khmer Moul'
            };
            titleCell.alignment = { horizontal: 'center' };

            // ✅ Date Range Row
            worksheet.mergeCells('A2:O2');
            const dateRangeCell = worksheet.getCell('A2');
            let fromDate, toDate;
            if (state.dateRange && state.dateRange[0] && state.dateRange[1]) {
                const startDate = dayjs(state.dateRange[0]);
                const endDate = dayjs(state.dateRange[1]);
                fromDate = startDate.format('DD.MM.YY');
                toDate = endDate.format('DD.MM.YY');
            } else {
                const today = new Date();
                const firstDay = '01';
                const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                const month = (today.getMonth() + 1).toString().padStart(2, '0');
                const year = today.getFullYear().toString().slice(-2);
                fromDate = `${firstDay}.${month}.${year}`;
                toDate = `${lastDay}.${month}.${year}`;
            }
            dateRangeCell.value = `សរុបពីថ្ងៃទី ${fromDate} ដល់ថ្ងៃទី ${toDate}`;
            dateRangeCell.font = { name: 'Khmer OS', size: 12 };
            dateRangeCell.alignment = { horizontal: 'center' };
            worksheet.addRow([]);

            // ✅ Top Header Row (Grouped Headers) - Row 4
            const topHeaderRow = worksheet.addRow([
                'ល.រ ទី គ្រា',           // A4 - will merge with A5
                'លេខប័ណ្ណ',              // B4 - will merge with B5
                'អធិប្បាយ',              // C4 - will merge with C5
                'កំណើនក្នុងគ្រា',        // D4:I4 - merged
                '', '', '', '', '',
                'ទឹកប្រាក់',             // J4 - will merge with J5
                'ចំណាយក្នុងគ្រា',        // K4:M4 - merged
                '', '',
                'ចុងគ្រា',              // N4 - will merge with N5
                '#'                      // O4 - will merge with O5
            ]);
            
            // Merge top header cells
            worksheet.mergeCells('A4:A5'); // ល.រ ទី គ្រា (2 rows)
            worksheet.mergeCells('B4:B5'); // លេខប័ណ្ណ (2 rows)
            worksheet.mergeCells('C4:C5'); // អធិប្បាយ (2 rows)
            worksheet.mergeCells('D4:I4'); // កំណើនក្នុងគ្រា (1 row, 6 cols)
            worksheet.mergeCells('J4:J5'); // ទឹកប្រាក់ (2 rows)
            worksheet.mergeCells('K4:M4'); // ចំណាយក្នុងគ្រា (1 row, 3 cols)
            worksheet.mergeCells('N4:N5'); // ចុងគ្រា (2 rows)
            worksheet.mergeCells('O4:O5'); // # (2 rows)
            
            topHeaderRow.height = 30;
            topHeaderRow.eachCell((cell) => {
                cell.font = {
                    bold: true,
                    name: 'Khmer OS',
                    size: 11
                };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'D9D9D9' }
                };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                cell.alignment = {
                    vertical: 'middle',
                    horizontal: 'center',
                    wrapText: true
                };
            });

            // ✅ Middle Sub-Header Row (for កំណើនក្នុងគ្រា and ចំណាយក្នុងគ្រា) - Row 5
            const midHeaderRow = worksheet.addRow([
                '', '', '',  // A5:C5 already merged above
                'ប្រភេទឥន្ធនៈ',          // D5:E5 - merged
                '',
                'ចំណាយក្នុងរក្សា',         // F5:I5 - merged
                '', '', '',
                '',  // J5 already merged
                'លេខបង់ប្រាក់',          // K5
                'ក្រុមហ៊ុន',            // L5
                'លេខប័ណ្ណ',              // M5
                '',  // N5 already merged
                ''   // O5 already merged
            ]);
            
            // Merge middle sub-headers
            worksheet.mergeCells('D5:E5'); // ប្រភេទឥន្ធនៈ
            worksheet.mergeCells('F5:I5'); // ចំណាយក្នុងរក្សា
            
            midHeaderRow.height = 25;
            midHeaderRow.eachCell((cell, colNumber) => {
                // Only style cells that aren't part of the upper merged cells (A, B, C, J, N, O)
                if (![1, 2, 3, 10, 14, 15].includes(colNumber)) {
                    cell.font = {
                        bold: true,
                        name: 'Khmer OS',
                        size: 10
                    };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'D9D9D9' }
                    };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                    cell.alignment = {
                        vertical: 'middle',
                        horizontal: 'center',
                        wrapText: true
                    };
                }
            });

            // ✅ Bottom Sub Header Row (Detailed Columns) - Row 6
            const headers = [
                '',  // A6 - part of merged A4:A5
                '',  // B6 - part of merged B4:B5
                '',  // C6 - part of merged C4:C5
                'Extra',              // D6
                'Diesel',             // E6
                'ចំនួនលីត្រ',           // F6
                'តម្លៃ/លីត្រ',          // G6
                'ទឹកប្រាក់ឥន្ធនៈ',      // H6
                'ឯកសារ',              // I6
                '',  // J6 - part of merged J4:J5
                '',  // K6 - keep from row 5
                '',  // L6 - keep from row 5  
                '',  // M6 - keep from row 5
                '',  // N6 - part of merged N4:N5
                ''   // O6 - part of merged O4:O5
            ];
            const headerRow = worksheet.addRow(headers);
            headerRow.font = { bold: true, name: 'Khmer OS', size: 9 };
            headerRow.height = 35;
            headerRow.eachCell((cell, colNumber) => {
                // Only style the detailed column headers (D-I)
                if ([4, 5, 6, 7, 8, 9].includes(colNumber)) {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'D9D9D9' }
                    };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                    cell.alignment = {
                        vertical: 'middle',
                        horizontal: 'center',
                        wrapText: true
                    };
                }
            });

            // ✅ Helper to get category name
            const getCategoryName = (categoryId) => {
                const category = config?.category?.find(c => c.value === categoryId);
                return category?.label || categoryId || "-";
            };

            // ✅ Track running balance per card
            const cardBalances = {};

            // ✅ Sort payments by date
            const sortedList = [...list].sort((a, b) => new Date(a.payment_date) - new Date(b.payment_date));

            // ✅ Data Rows
            let rowNumber = 1;
            let grandTotalPaid = 0;

            // Initialize summary counters for Extra & Diesel
            let totalExtra = 0;
            let totalDiesel = 0;
            let totalLiters = 0;
            let totalPurchaseAmount = 0;

            // Process each payment
            for (const payment of sortedList) {
                const cardNum = payment.card_number || '-';
                const categoryName = getCategoryName(payment.category_id);
                const paymentAmount = parseFloat(payment.payment_amount || 0);
                const companyName = payment.company_name || '-';
                const paymentMethod = payment.payment_method || '-';
                const note = payment.note || '-';
                const paymentId = payment.id || '-';

                // Initialize card balance if not exists
                if (cardNum !== '-' && !cardBalances[cardNum]) {
                    cardBalances[cardNum] = 0;
                }

                // Add payment to balance
                if (cardNum !== '-') {
                    cardBalances[cardNum] += paymentAmount;
                }
                const runningBalance = cardNum !== '-' ? cardBalances[cardNum] : 0;

                // ✅ NEW: Get individual card items for this specific payment
                let extraAmount = 0;
                let dieselAmount = 0;
                let extraLiters = 0;
                let dieselLiters = 0;
                let extraUnitPrice = 0;
                let dieselUnitPrice = 0;
                let purchaseAmount = 0;

                // Fetch items for this specific card number and category
                if (payment.payable_id) {
                    try {
                        let itemsToProcess = [];
                        
                        // Try to get specific card items first
                        if (payment.card_number && payment.category_id) {
                            
                            const itemsRes = await request("payable/card-items", "get", {
                                payable_id: payment.payable_id,
                                category_id: payment.category_id,
                                card_number: payment.card_number
                            });

                            if (itemsRes && itemsRes.items && itemsRes.items.length > 0) {
                                itemsToProcess = itemsRes.items;
                            }
                        }
                        
                        // Fallback: Get all items from payable if card_number/category not available
                        if (itemsToProcess.length === 0) {
                            const payableRes = await request("payable", "get", { id: payment.payable_id });
                            
                            if (payableRes && payableRes.list && payableRes.list.length > 0) {
                                itemsToProcess = payableRes.list[0].items || [];
                                
                                // Filter by card number if available
                                if (payment.card_number) {
                                    itemsToProcess = itemsToProcess.filter(item => 
                                        item.card_number === payment.card_number || 
                                        item.description === payment.card_number
                                    );
                                }
                            }
                        }

                        if (itemsToProcess.length > 0) {
                            // Group items by fuel type
                            const extraItems = itemsToProcess.filter(item => {
                                const productName = (item.product_name || '').toLowerCase();
                                const categoryId = String(item.category_id || '').toLowerCase();
                                return productName.includes('extra') || categoryId === 'extra';
                            });
                            const dieselItems = itemsToProcess.filter(item => {
                                const productName = (item.product_name || '').toLowerCase();
                                const categoryId = String(item.category_id || '').toLowerCase();
                                return productName.includes('diesel') || categoryId === 'diesel';
                            });


                            // Calculate totals for Extra items
                            if (extraItems.length > 0) {
                                extraAmount = extraItems.reduce((sum, item) => sum + parseFloat(item.total_amount || 0), 0);
                                extraLiters = extraItems.reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0);
                                extraUnitPrice = extraItems.reduce((sum, item) => sum + parseFloat(item.unit_price || 0), 0) / extraItems.length;
                                purchaseAmount += extraAmount;
                            }

                            // Calculate totals for Diesel items
                            if (dieselItems.length > 0) {
                                dieselAmount = dieselItems.reduce((sum, item) => sum + parseFloat(item.total_amount || 0), 0);
                                dieselLiters = dieselItems.reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0);
                                dieselUnitPrice = dieselItems.reduce((sum, item) => sum + parseFloat(item.unit_price || 0), 0) / dieselItems.length;
                                purchaseAmount += dieselAmount;
                            }
                            
                        } else {
                            console.warn(`No items found for payment #${payment.id}`);
                        }
                    } catch (error) {
                        console.error("Error fetching items:", error);
                        message.warning(`Unable to fetch fuel data for payment #${payment.id}`);
                    }
                } else {
                    console.warn(`Missing payable_id for payment #${payment.id}`);
                }

                // Update totals for summary
                totalExtra += extraAmount;
                totalDiesel += dieselAmount;
                totalLiters += extraLiters + dieselLiters;
                totalPurchaseAmount += purchaseAmount;

                const row = worksheet.addRow([
                    rowNumber,
                    cardNum,
                    categoryName,
                    extraAmount > 0 ? extraAmount.toFixed(2) : '0.00',        // Extra
                    dieselAmount > 0 ? dieselAmount.toFixed(2) : '0.00',      // Diesel
                    (extraLiters + dieselLiters).toFixed(2),                  // ចំនួនលីត្រសរុប
                    extraUnitPrice > 0 ? extraUnitPrice.toFixed(2) : (dieselUnitPrice > 0 ? dieselUnitPrice.toFixed(2) : '0.00'), // តម្លៃ/លីត្រ
                    purchaseAmount > 0 ? purchaseAmount.toFixed(2) : '0.00',  // ទឹកប្រាក់ឥន្ធនៈ
                    note,
                    paymentId,
                    companyName,
                    cardNum,
                    paymentAmount.toFixed(2),
                    runningBalance.toFixed(2),
                    '#'
                ]);
                row.height = 25;
                row.eachCell((cell, colNumber) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                    cell.alignment = {
                        vertical: 'middle',
                        horizontal: 'center'
                    };
                    // Khmer font for certain columns
                    if ([3, 9].includes(colNumber)) {
                        cell.font = { name: 'Khmer OS', size: 10 };
                    }
                });
                grandTotalPaid += paymentAmount;
                rowNumber++;
            }

            // ✅ Summary Section
            worksheet.addRow([]);
            // First Summary Row: សរុបកំណើនក្នុងគ្រា
            const summaryHeaderRow1 = worksheet.addRow([
                '', '', '', 'សរុបកំណើនក្នុងគ្រា', '', '', '', '', '',
                '', 'សរុបលើកក្នុងគ្រា', '', '', '', '#'
            ]);
            worksheet.mergeCells(`D${worksheet.rowCount}:I${worksheet.rowCount}`);
            worksheet.mergeCells(`K${worksheet.rowCount}:M${worksheet.rowCount}`);
            summaryHeaderRow1.eachCell((cell, colNumber) => {
                if ([4, 11].includes(colNumber)) {
                    cell.font = { bold: true, name: 'Khmer OS', size: 11 };
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                }
            });

            // Second Summary Row: Detailed Totals
            const summaryRow = worksheet.addRow([
                '', '', '', 'Extra', 'Diesel', totalLiters.toFixed(2), '', totalPurchaseAmount.toFixed(2), '',
                '', '', grandTotalPaid.toFixed(2), '',
                '', '#'
            ]);
            summaryRow.font = { bold: true, name: 'Khmer OS', size: 10 };
            summaryRow.eachCell((cell) => {
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            });

            // Third Summary Row: Breakdown of Extra & Diesel
            const breakdownRow = worksheet.addRow([
                '', '', '', 'Extra', totalExtra.toFixed(2), '', '', '', '',
                '', '', '', '',
                '', '#'
            ]);
            const breakdownRow2 = worksheet.addRow([
                '', '', '', 'Diesel', totalDiesel.toFixed(2), '', '', '', '',
                '', '', '', '',
                '', '#'
            ]);

            // Format breakdown rows
            [breakdownRow, breakdownRow2].forEach(row => {
                row.font = { bold: true, name: 'Khmer OS', size: 10 };
                row.eachCell((cell) => {
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                });
            });

            worksheet.addRow([]);

            // ✅ Date and Location
            const currentDate = new Date();
            const formattedDay = currentDate.getDate();
            const formattedMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
            const formattedYear = currentDate.getFullYear().toString().slice(-2);
            const locationDateRow = worksheet.addRow([
                '', '', '', '', '', '', '', '', '', '', '', '', '',
                `ថ្ងៃ ខែ ឆ្នាំ ${formattedDay}.${formattedMonth}.${formattedYear}`, ''
            ]);
            worksheet.mergeCells(`N${worksheet.rowCount}:O${worksheet.rowCount}`);
            locationDateRow.getCell(14).font = {
                name: 'Khmer OS',
                size: 11
            };
            locationDateRow.getCell(14).alignment = {
                horizontal: 'left',
                vertical: 'middle'
            };
            worksheet.addRow([]);
            worksheet.addRow([]);

            // ✅ Signature Row
            const signatureRow = worksheet.addRow([
                '', '', '', 'អតិថិជន', '', '', '', '', '', 'ប្រធានសាខា', '', '', '', 'គណនេយ្យ', ''
            ]);
            worksheet.mergeCells(`D${worksheet.rowCount}:E${worksheet.rowCount}`);
            worksheet.mergeCells(`J${worksheet.rowCount}:K${worksheet.rowCount}`);
            worksheet.mergeCells(`N${worksheet.rowCount}:O${worksheet.rowCount}`);
            signatureRow.getCell(4).font = { bold: true, name: 'Khmer Moul', size: 11 };
            signatureRow.getCell(4).alignment = { horizontal: 'center' };
            signatureRow.getCell(10).font = { bold: true, name: 'Khmer Moul', size: 11 };
            signatureRow.getCell(10).alignment = { horizontal: 'center' };
            signatureRow.getCell(14).font = { bold: true, name: 'Khmer Moul', size: 11 };
            signatureRow.getCell(14).alignment = { horizontal: 'center' };

            // ✅ Column Widths
            const columnWidths = [6, 12, 18, 10, 10, 10, 10, 12, 15, 12, 12, 12, 15, 20, 5];
            columnWidths.forEach((width, i) => {
                worksheet.getColumn(i + 1).width = width;
            });

            // ✅ Save file
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, `Payment_History_${dayjs().format('YYYY-MM-DD')}.xlsx`);
            hideLoadingMessage();
            message.success("Export ជោគជ័យ / Export successful!");
        } catch (error) {
            hideLoadingMessage();
            message.error("Export បរាជ័យ / Export failed!");
            console.error("Export error:", error);
        }
    };
    // Calculate statistics
    const totalPayments = list.length;
    const totalAmount = list.reduce((sum, item) => sum + parseFloat(item.payment_amount || 0), 0);
    const averagePayment = totalPayments > 0 ? totalAmount / totalPayments : 0;

    const getPaymentMethodColor = (method) => {
        const colors = {
            'Cash': 'green',
            'Bank Transfer': 'blue',
            'Check': 'orange',
            'Credit Card': 'purple',
            'Other': 'default',
        };
        return colors[method] || 'default';
    };
    const PaymentCard = ({ item, index }) => (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-3 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-300">
                            #{item.id}
                        </span>
                        {item.payment_method && (
                            <Tag color={getPaymentMethodColor(item.payment_method)}>
                                {item.payment_method}
                            </Tag>
                        )}
                    </div>
                    <h3 className="text-lg font-bold text-green-600 dark:text-green-400 mb-1">
                        ${parseFloat(item.payment_amount).toFixed(2)}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                        <strong>ក្រុមហ៊ុន:</strong> {item.company_name || "-"}
                    </p>

                    {(item.card_number || item.payable?.card_number) && (
                        <div className="mb-1">
                            <Tag color="blue" className="text-xs">
                                📇 Card: {item.card_number || item.payable?.card_number}
                            </Tag>
                        </div>
                    )}

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        📅 {formatDateClient(item.payment_date)}
                    </p>
                </div>
            </div>

            {item.note && (
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    📝 {item.note}
                </div>
            )}

            <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mb-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                <span>👤 {item.create_by || "-"}</span>
                <span>{formatDateServer(item.create_at, "YYYY-MM-DD h:mm A")}</span>
            </div>

            <div className="flex gap-2">
                <Button
                    type="primary"
                    size="small"
                    icon={<AiOutlineEye />}
                    onClick={() => onClickViewDetail(item)}
                    className="flex-1"
                >
                    មើលពត៌មាន / View Details
                </Button>
                <Button
                    type="primary"
                    size="small"
                    icon={<MdEdit />}
                    onClick={() => onClickEdit(item)}
                />
                <Button
                    type="primary"
                    danger
                    size="small"
                    icon={<MdDelete />}
                    onClick={() => onClickDelete(item)}
                />
            </div>
        </div>
    );

    return (
        <MainPage loading={loading}>
            {/* Statistics Cards */}
            <Row gutter={[16, 16]} className="mb-4">
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic
                            title="ចំនួនការទូទាត់ / Total Payments"
                            value={totalPayments}
                            prefix={<MdPayment />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic
                            title="ទឹកប្រាក់សរុប / Total Amount"
                            value={totalAmount}
                            precision={2}
                            prefix="$"
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic
                            title="មធ្យមភាគ / Average Payment"
                            value={averagePayment}
                            precision={2}
                            prefix="$"
                            valueStyle={{ color: '#722ed1' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Header & Filters */}
            <div className="pageHeader flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <div className="text-lg font-semibold whitespace-nowrap flex items-center gap-2">
                        <MdPayment className="text-blue-500" />
                        ប្រវត្តិការទូទាត់ / Payment History
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <Input.Search
                        onChange={(e) =>
                            setState((prev) => ({ ...prev, txtSearch: e.target.value }))
                        }
                        allowClear
                        onSearch={getList}
                        placeholder="ស្វែងរកក្រុមហ៊ុន ឬ លេខបង់ប្រាក់ / Search company or ID"
                        className="w-full sm:w-64"
                    />

                    <Select
                        placeholder="វិធីទូទាត់ / Payment Method"
                        value={state.paymentMethod}
                        onChange={(value) =>
                            setState((prev) => ({ ...prev, paymentMethod: value }))
                        }
                        allowClear
                        className="w-full sm:w-48"
                        options={[
                            { label: "សាច់ប្រាក់ / Cash", value: "Cash" },
                            { label: "ផ្ទេរប្រាក់ / Bank Transfer", value: "Bank Transfer" },
                            { label: "ឆែក / Check", value: "Check" },
                            { label: "កាតឥណទាន / Credit Card", value: "Credit Card" },
                            { label: "ផ្សេងៗ / Other", value: "Other" },
                        ]}
                    />

                    <RangePicker
                        value={state.dateRange}
                        onChange={(dates) => setState((prev) => ({ ...prev, dateRange: dates }))}
                        format="YYYY-MM-DD"
                        placeholder={['ចាប់ផ្តើម / Start', 'បញ្ចប់ / End']}
                        className="w-full sm:w-auto"
                        suffixIcon={<MdDateRange />}
                    />

                    <div className="flex gap-2 w-full sm:w-auto">
                        <Tooltip title="ស្វែងរក / Search">
                            <Button
                                type="primary"
                                onClick={getList}
                                icon={<FiSearch />}
                                className="flex-1 sm:flex-none"
                            />
                        </Tooltip>
                        <Tooltip title="ផ្ទុកឡើងវិញ / Refresh">
                            <Button
                                type="default"
                                onClick={() => {
                                    setState({
                                        txtSearch: "",
                                        paymentMethod: "",
                                        dateRange: null,
                                        visibleDetailModal: false,
                                        selectedPayment: null,
                                    });
                                    setTimeout(getList, 100);
                                }}
                                icon={<IoRefresh />}
                                className="flex-1 sm:flex-none"
                            />
                        </Tooltip>
                        <Tooltip title="នាំចេញ / Export">
                            <Button
                                type="primary"
                                onClick={ExportToExcel}
                                icon={<IoBook />}
                                className="flex-1 sm:flex-none"
                            >
                                <span className="hidden sm:inline">Export</span>
                            </Button>
                        </Tooltip>
                    </div>
                </div>
            </div>

            {/* Payment Detail Modal */}
            <Modal
                open={state.visibleEditModal}
                title={
                    <div className="flex items-center gap-2">
                        <MdEdit className="text-blue-500" />
                        <span>កែប្រែការទូទាត់ / Edit Payment</span>
                    </div>
                }
                footer={null}
                onCancel={onCloseEditModal}
                width={window.innerWidth < 768 ? '95%' : 600}
            >
                {state.selectedPayment && (
                    <div>
                        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                            <div className="font-semibold">{state.selectedPayment.company_name}</div>
                            {state.selectedPayment.card_number && (
                                <div className="text-sm text-blue-600 mt-1">
                                    📇 Card: {state.selectedPayment.card_number}
                                </div>
                            )}
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                                Payment ID: #{state.selectedPayment.id}
                            </div>
                        </div>

                        <Form layout="vertical" onFinish={onFinishEdit} form={editFormRef}>
                            <Form.Item name="id" hidden>
                                <Input />
                            </Form.Item>
                            <Form.Item name="product_id" hidden>
                                <Input />
                            </Form.Item>
                            <Form.Item name="category_id" hidden>
                                <Input />
                            </Form.Item>
                            <Form.Item
                                name="card_number"
                                label="លេខកាត / Card Number"
                                rules={[{ required: true, message: "សូមបញ្ចូលលេខកាត / Please input card number!" }]}
                            >
                                <Input placeholder="លេខកាត / Card Number" disabled />
                            </Form.Item>

                            <Form.Item
                                name="payment_amount"
                                label="ចំនួនទឹកប្រាក់ / Payment Amount"
                                rules={[{ required: true, message: "សូមបញ្ចូលចំនួនទឹកប្រាក់ / Please input payment amount!" }]}
                            >
                                <Input type="number" placeholder="0.00" prefix="$" />
                            </Form.Item>

                            <Form.Item
                                name="payment_date"
                                label="កាលបរិច្ឆេទទូទាត់ / Payment Date"
                                rules={[{ required: true, message: "សូមជ្រើសរើសកាលបរិច្ឆេទ / Please select payment date!" }]}
                            >
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>

                            <Form.Item
                                name="payment_method"
                                label="វិធីទូទាត់ / Payment Method"
                            >
                                <Select
                                    placeholder="ជ្រើសរើសវិធីទូទាត់ / Select payment method"
                                    options={[
                                        { label: "សាច់ប្រាក់ / Cash", value: "Cash" },
                                        { label: "ផ្ទេរប្រាក់ / Bank Transfer", value: "Bank Transfer" },
                                        { label: "ឆែក / Check", value: "Check" },
                                        { label: "កាតឥណទាន / Credit Card", value: "Credit Card" },
                                        { label: "ផ្សេងៗ / Other", value: "Other" },
                                    ]}
                                />
                            </Form.Item>

                            <Form.Item name="note" label="កំណត់ចំណាំ / Note">
                                <Input.TextArea placeholder="កំណត់ចំណាំ / Payment note" rows={2} />
                            </Form.Item>

                            <Space className="w-full justify-end">
                                <Button onClick={onCloseEditModal}>បោះបង់ / Cancel</Button>
                                <Button type="primary" htmlType="submit">
                                    រក្សាទុក / Save
                                </Button>
                            </Space>
                        </Form>
                    </div>
                )}
            </Modal>
            <Modal
                open={state.visibleDetailModal}
                title={
                    <div className="flex items-center gap-2">
                        <AiOutlineEye className="text-blue-500" />
                        <span>ពត៌មានការទូទាត់ / Payment Detail</span>
                    </div>
                }
                footer={[
                    <Button key="close" onClick={onCloseDetailModal}>
                        បិទ / Close
                    </Button>
                ]}
                onCancel={onCloseDetailModal}
                width={window.innerWidth < 768 ? '95%' : 600}
                className="payment-detail-modal"
            >
                {state.selectedPayment && (
                    <div>
                        {/* Desktop View - Descriptions Table */}
                        <div className="hidden md:block">
                            <Descriptions bordered column={1} size="middle">
                                <Descriptions.Item label="Payment ID">
                                    #{state.selectedPayment.id}
                                </Descriptions.Item>

                                <Descriptions.Item label="Company">
                                    {state.selectedPayment.company_name || "-"}
                                </Descriptions.Item>

                                <Descriptions.Item label="Amount">
                                    <span className="font-bold text-green-600">
                                        ${parseFloat(state.selectedPayment.payment_amount).toFixed(2)}
                                    </span>
                                </Descriptions.Item>

                                <Descriptions.Item label="Payment Method">
                                    {state.selectedPayment.payment_method ? (
                                        <Tag color={getPaymentMethodColor(state.selectedPayment.payment_method)}>
                                            {state.selectedPayment.payment_method}
                                        </Tag>
                                    ) : "-"}
                                </Descriptions.Item>

                                <Descriptions.Item label="Card Number">
                                    {state.selectedPayment.card_number ||
                                        state.selectedPayment.payable?.card_number ||
                                        "-"}
                                </Descriptions.Item>

                                <Descriptions.Item label="Payment Date">
                                    {formatDateClient(state.selectedPayment.payment_date)}
                                </Descriptions.Item>

                                <Descriptions.Item label="Note">
                                    {state.selectedPayment.note || "-"}
                                </Descriptions.Item>

                                <Descriptions.Item label="Created By">
                                    {state.selectedPayment.create_by || "-"}
                                </Descriptions.Item>

                                <Descriptions.Item label="Created At">
                                    {formatDateServer(state.selectedPayment.create_at, "YYYY-MM-DD h:mm A")}
                                </Descriptions.Item>
                            </Descriptions>
                        </div>

                        {/* Mobile View - Card Layout */}
                        <div className="block md:hidden space-y-3">
                            {/* Payment ID */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    Payment ID
                                </div>
                                <div className="font-semibold text-gray-900 dark:text-gray-100">
                                    #{state.selectedPayment.id}
                                </div>
                            </div>

                            {/* Company */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    Company / ក្រុមហ៊ុន
                                </div>
                                <div className="font-semibold text-gray-900 dark:text-gray-100">
                                    {state.selectedPayment.company_name || "-"}
                                </div>
                            </div>

                            {/* Amount */}
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg p-4 border-2 border-green-200 dark:border-green-700">
                                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                                    Amount / ចំនួនទឹកប្រាក់
                                </div>
                                <div className="font-bold text-2xl text-green-600 dark:text-green-400">
                                    ${parseFloat(state.selectedPayment.payment_amount).toFixed(2)}
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                    Payment Method / វិធីទូទាត់
                                </div>
                                <div>
                                    {state.selectedPayment.payment_method ? (
                                        <Tag color={getPaymentMethodColor(state.selectedPayment.payment_method)}>
                                            {state.selectedPayment.payment_method}
                                        </Tag>
                                    ) : (
                                        <span className="text-gray-500 dark:text-gray-400">-</span>
                                    )}
                                </div>
                            </div>

                            {/* Card Number */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                    Card Number / លេខកាត
                                </div>
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                    {state.selectedPayment.card_number ||
                                        state.selectedPayment.payable?.card_number ? (
                                        <Tag color="blue" className="text-sm px-3 py-1">
                                            📇 {state.selectedPayment.card_number ||
                                                state.selectedPayment.payable?.card_number}
                                        </Tag>
                                    ) : (
                                        <span className="text-gray-500 dark:text-gray-400">-</span>
                                    )}
                                </div>
                            </div>

                            {/* Payment Date */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    Payment Date / កាលបរិច្ឆេទទូទាត់
                                </div>
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                    📅 {formatDateClient(state.selectedPayment.payment_date)}
                                </div>
                            </div>

                            {/* Note */}
                            {state.selectedPayment.note && (
                                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                                    <div className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                                        Note / កំណត់ចំណាំ
                                    </div>
                                    <div className="text-sm text-gray-800 dark:text-gray-200">
                                        📝 {state.selectedPayment.note}
                                    </div>
                                </div>
                            )}

                            {/* Created Info */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border-t-2 border-gray-200 dark:border-gray-600">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            Created By
                                        </span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            👤 {state.selectedPayment.create_by || "-"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            Created At
                                        </span>
                                        <span className="text-xs text-gray-600 dark:text-gray-300">
                                            {formatDateServer(state.selectedPayment.create_at, "YYYY-MM-DD h:mm A")}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-2">
                                <Button
                                    type="primary"
                                    icon={<MdEdit />}
                                    onClick={() => {
                                        onCloseDetailModal();
                                        onClickEdit(state.selectedPayment);
                                    }}
                                    className="flex-1"
                                >
                                    កែប្រែ / Edit
                                </Button>
                                <Button
                                    type="primary"
                                    danger
                                    icon={<MdDelete />}
                                    onClick={() => onClickDelete(state.selectedPayment)}
                                    className="flex-1"
                                >
                                    លុប / Delete
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>


            {/* Desktop Table */}
            <div className="hidden md:block">
                <Table
                    dataSource={list}
                    rowKey="id"
                    columns={[
                        {
                            key: "no",
                            title: "ល.រ / No",
                            render: (_, __, index) => index + 1,
                            width: 60,
                        },
                        {
                            key: "card_number",
                            title: "លេខកាត / Card Number",
                            dataIndex: "card_number",
                            render: (value, record) => {
                                const cardNum = value || record.payable?.card_number;
                                return cardNum ? (
                                    <Tag color="blue" className="text-xs">
                                        📇 {cardNum}
                                    </Tag>
                                ) : "-";
                            },
                            width: 140,
                        },
                        {
                            key: "category_id",
                            title: "Category",
                            dataIndex: "category_id",
                            width: 120,
                            render: (categoryId) => {
                                const category = config?.category?.find(c => c.value === categoryId);
                                return (
                                    <Tag color="green">
                                        {category?.label || categoryId || "-"}
                                    </Tag>
                                );
                            },
                        },
                        {
                            title: "Product",
                            dataIndex: "product_name",
                            width: 100,
                        },
                        {
                            key: "id",
                            title: "លេខបង់ប្រាក់ / Payment ID",
                            dataIndex: "id",
                            render: (text) => <strong>#{text}</strong>,
                            width: 100,
                        },
                        {
                            key: "company_name",
                            title: "ក្រុមហ៊ុន / Company",
                            dataIndex: "company_name",
                            render: (text) => text || "-",
                            sorter: (a, b) => (a.company_name || "").localeCompare(b.company_name || ""),
                        },
                        {
                            key: "payment_amount",
                            title: "ចំនួនទឹកប្រាក់ / Amount",
                            dataIndex: "payment_amount",
                            render: (value) => (
                                <span className="font-bold text-green-600">
                                    ${parseFloat(value).toFixed(2)}
                                </span>
                            ),
                            sorter: (a, b) => parseFloat(a.payment_amount) - parseFloat(b.payment_amount),
                            width: 130,
                        },
                        {
                            key: "payment_date",
                            title: "កាលបរិច្ឆេទ / Date",
                            dataIndex: "payment_date",
                            render: (value) => formatDateClient(value),
                            sorter: (a, b) => new Date(a.payment_date) - new Date(b.payment_date),
                            width: 120,
                        },
                        {
                            key: "payment_method",
                            title: "វិធីសាស្ត្រ / Method",
                            dataIndex: "payment_method",
                            render: (value) => value ? (
                                <Tag color={getPaymentMethodColor(value)}>{value}</Tag>
                            ) : "-",
                            filters: [
                                { text: "Cash", value: "Cash" },
                                { text: "Bank Transfer", value: "Bank Transfer" },
                                { text: "Check", value: "Check" },
                                { text: "Credit Card", value: "Credit Card" },
                                { text: "Other", value: "Other" },
                            ],
                            onFilter: (value, record) => record.payment_method === value,
                            width: 140,
                        },
                        {
                            key: "note",
                            title: "កំណត់ចំណាំ / Note",
                            dataIndex: "note",
                            ellipsis: true,
                            render: (text) => (
                                <Tooltip title={text}>
                                    <span>{text || "-"}</span>
                                </Tooltip>
                            ),
                        },
                        {
                            key: "create_by",
                            title: "អ្នកបង្កើត / Created By",
                            dataIndex: "create_by",
                            render: (text) => text || "-",
                            width: 120,
                        },
                        {
                            key: "create_at",
                            title: "បង្កើតនៅ / Created At",
                            dataIndex: "create_at",
                            render: (value) => formatDateServer(value, "YYYY-MM-DD h:mm A"),
                            width: 160,
                        },
                        {
                            key: "action",
                            title: "សកម្មភាព / Action",
                            align: "center",
                            render: (_, record) => (
                                <Space>
                                    <Tooltip title="មើលពត៌មាន / View Details">
                                        <Button
                                            type="default"
                                            icon={<AiOutlineEye />}
                                            onClick={() => onClickViewDetail(record)}
                                            size="small"
                                        />
                                    </Tooltip>
                                    <Tooltip title="កែប្រែ / Edit">
                                        <Button
                                            type="primary"
                                            icon={<MdEdit />}
                                            onClick={() => onClickEdit(record)}
                                            size="small"
                                        />
                                    </Tooltip>
                                    <Tooltip title="លុប/Refund / Delete/Refund">
                                        <Button
                                            type="primary"
                                            danger
                                            icon={<MdDelete />}
                                            onClick={() => onClickDelete(record)}
                                            size="small"
                                        />
                                    </Tooltip>
                                </Space>
                            ),
                            width: 140,
                        },
                    ]}
                    pagination={{
                        pageSize: 10,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} នៃ ${total} ធាតុ / of ${total} items`,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50', '100'],
                    }}
                    scroll={{ x: 1200 }}
                />
            </div>

            {/* Mobile Cards */}
            <div className="block md:hidden">
                {list.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <MdPayment className="text-6xl mx-auto mb-3 opacity-30" />
                        <div className="text-lg">មិនមានទិន្នន័យ / No data available</div>
                    </div>
                ) : (
                    list.map((item, index) => (
                        <PaymentCard key={item.id} item={item} index={index} />
                    ))
                )}
            </div>
        </MainPage>
    );
}

export default Company_PaymentHistoryPage;