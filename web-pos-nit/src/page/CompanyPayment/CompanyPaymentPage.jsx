import { useEffect, useState } from "react";
import {
    Button,
    Form,
    Input,
    message,
    Modal,
    Select,
    Space,
    Table,
    Tag,
    DatePicker,
    Card,
    Statistic,
    Row,
    Col,
    Timeline,
    InputNumber,
    Divider,
} from "antd";
import { formatDateClient, formatDateServer, request } from "../../util/helper";
import * as XLSX from 'xlsx/xlsx.mjs';
import { MdDelete, MdEdit, MdNewLabel, MdPayment, MdAdd } from "react-icons/md";
import { AiOutlineEye, AiOutlineHistory, AiOutlineDelete } from "react-icons/ai";
import MainPage from "../../component/layout/MainPage";
import { FiSearch } from "react-icons/fi";
import { IoBook } from "react-icons/io5";
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useTranslation } from '../../locales/TranslationContext';
import { configStore } from "../../store/configStore";
import dayjs from 'dayjs';

function CompanyPaymentPage() {
    const { t } = useTranslation();
    const { config } = configStore();
    const [formRef] = Form.useForm();
    const [paymentFormRef] = Form.useForm();
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [paymentHistory, setPaymentHistory] = useState([]);

    const [items, setItems] = useState([]);
    const [state, setState] = useState({
        visibleModal: false,
        visiblePaymentModal: false,
        visibleHistoryModal: false,
        visibleDetailModal: false,
        visibleCardDetailModal: false,
        id: null,
        txtSearch: "",
        statusFilter: "",
        selectedPayable: null,
        selectedItem: null,
        selectedCategory: null,
        cardItems: [],
    });

    useEffect(() => {
        getList();
    }, []);


    const getList = async () => {
        setLoading(true);
        const param = {
            txtSearch: state.txtSearch,
            status: state.statusFilter,
        };
        const res = await request("payable", "get", param);
        setLoading(false);
        if (res) {
            setList(res.list);
        }
    };

    const onClickViewCategoryCards = async (categoryItem) => {
        try {
            const res = await request("payable/category-cards", "get", {
                payable_id: state.selectedPayable.id,
                category_id: categoryItem.category_id
            });

            if (res && res.items) {
                setState({
                    ...state,
                    visibleCardDetailModal: true,
                    cardItems: res.items,
                    selectedCategory: categoryItem
                });
            }
        } catch (error) {
            message.error("Failed to load card details");
        }
    };
    const onCloseCardDetailModal = () => {
        setState({
            ...state,
            visibleCardDetailModal: false,
            cardItems: [],
            selectedCategory: null
        });
    };


    const getPaymentHistory = async (payable_id) => {
        const res = await request("payable/payment-history", "get", { payable_id });
        if (res) {
            setPaymentHistory(res.list);
        }
    };

    const onClickEdit = async (data) => {
        const res = await request("payable", "get", { id: data.id });
        if (res && res.list && res.list.length > 0) {
            const payable = res.list[0];

            setState({
                ...state,
                visibleModal: true,
                id: data.id,
            });

            formRef.setFieldsValue({
                id: data.id,
                company_name: data.company_name,
                card_number: data.card_number,
                description: data.description,
                due_date: data.due_date ? dayjs(data.due_date) : null,
            });

            setItems(payable.items || []);
        }
    };

    const onClickDelete = async (data) => {
        Modal.confirm({
            title: t('delete_payable_confirm'),
            content: t('delete_payable_message'),
            okText: t('yes'),
            cancelText: t('cancel'),
            onOk: async () => {
                const res = await request("payable", "delete", { id: data.id });
                if (res && !res.error) {
                    message.success(res.message);
                    getList();
                }
            },
        });
    };

    const onClickViewDetail = async (data) => {
        const res = await request("payable", "get", { id: data.id });
        if (res && res.list && res.list.length > 0) {
            setState({
                ...state,
                visibleDetailModal: true,
                selectedPayable: res.list[0],
            });
        }
    };

    const onClickAddPayment = (data) => {
        setState({
            ...state,
            visiblePaymentModal: true,
            selectedPayable: data,
        });
        paymentFormRef.resetFields();
        paymentFormRef.setFieldsValue({
            payment_date: dayjs(),
        });
    };
    const onClickViewHistory = async (data) => {
        await getPaymentHistory(data.id);
        setState({
            ...state,
            visibleHistoryModal: true,
            selectedPayable: data,
        });
    };

    const onClickAddBtn = () => {
        setState({
            ...state,
            visibleModal: true,
            id: null,
        });
        formRef.resetFields();
        setItems([]);
    };

    const onCloseModal = () => {
        formRef.resetFields();
        setItems([]);
        setState({
            ...state,
            visibleModal: false,
            id: null,
        });
    };

    const onCloseDetailModal = () => {
        setState({
            ...state,
            visibleDetailModal: false,
            selectedPayable: null,
        });
    };

    const onClosePaymentModal = () => {
        paymentFormRef.resetFields();
        setState({
            ...state,
            visiblePaymentModal: false,
            selectedPayable: null,
        });
    };

    const onCloseHistoryModal = () => {
        setState({
            ...state,
            visibleHistoryModal: false,
            selectedPayable: null,
        });
        setPaymentHistory([]);
    };

    // Item Management Functions
    const addItem = () => {
        setItems([...items, {
            product_id: null,
            category_id: null,
            barcode: "",
            product_name: "oil",
            description: "",
            quantity: 0,
            unit: "",
            unit_price: 0,
            actual_price: 1190,
            total_amount: 0,
        }]);
    };

    const removeItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;

        if (field === 'quantity' || field === 'unit_price') {
            const quantity = parseFloat(newItems[index].quantity) || 0;
            const unitPrice = parseFloat(newItems[index].unit_price) || 0;
            const actualPrice = parseFloat(newItems[index].actual_price) || 1190;

            newItems[index].total_amount = (quantity * unitPrice) / actualPrice;
        }

        setItems(newItems);
    };

    const onCategorySelect = (index, categoryId) => {
        const category = config.category.find(c => c.value === categoryId);
        if (category) {
            const newItems = [...items];
            newItems[index] = {
                ...newItems[index],
                category_id: categoryId,
                barcode: category.barcode || '',
                product_name: 'oil',
                actual_price: category.actual_price || 1190,
                description: category.description || '',
            };

            const quantity = parseFloat(newItems[index].quantity) || 0;
            const unitPrice = parseFloat(newItems[index].unit_price) || 0;
            const actualPrice = parseFloat(newItems[index].actual_price) || 1190;

            newItems[index].total_amount = (quantity * unitPrice) / actualPrice;

            setItems(newItems);
        }
    };

    const calculateTotalAmount = () => {
        return items.reduce((sum, item) => sum + (parseFloat(item.total_amount) || 0), 0);
    };

    const onFinish = async (values) => {
        if (items.length === 0) {
            message.warning("Please add at least one item!");
            return;
        }

        const totalAmount = calculateTotalAmount();

        const data = {
            id: state.id,
            company_name: values.company_name,
            card_number: values.card_number,
            description: values.description,
            total_amount: totalAmount,
            due_date: values.due_date ? dayjs(values.due_date).format('YYYY-MM-DD') : null,
            items: items,
        };

        const method = state.id ? "put" : "post";
        const res = await request("payable", method, data);

        if (res && !res.error) {
            message.success(res.message);
            getList();
            onCloseModal();
        }
    };

    const onFinishPayment = async (values) => {
        const selectedItem = state.selectedItem;

        const data = {
            payable_id: state.selectedPayable.id,
            payment_amount: values.payment_amount,
            payment_date: dayjs(values.payment_date).format('YYYY-MM-DD'),
            payment_method: values.payment_method,
            note: values.note,
            card_number: values.card_number,
            product_id: selectedItem?.product_id || null,
            category_id: selectedItem?.category_id || null,
        };

        const res = await request("payable/payment", "post", data);

        if (res && !res.error) {
            message.success(res.message);
            getList();
            onClosePaymentModal();
        }
    };
const ExportToExcel = async () => {
    if (list.length === 0) {
        message.warning("មិនមានទិន្នន័យសម្រាប់ Export / No data to export!");
        return;
    }
    
    const getCategoryName = (categoryId) => {
        if (!categoryId) return "-";
        const category = config?.category?.find(c => 
            String(c.value) === String(categoryId) ||
            String(c.id) === String(categoryId) ||
            c.value === categoryId ||
            c.id === categoryId ||
            parseInt(c.value) === parseInt(categoryId) ||
            parseInt(c.id) === parseInt(categoryId)
        );
        return category?.label || categoryId || "-";
    };
    
    const hideLoadingMessage = message.loading("កំពុងរៀបចំ... / Exporting...", 0);
    
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Company Payables', {
            pageSetup: {
                orientation: 'landscape',
                paperSize: 9,
                fitToPage: true,
                fitToWidth: 1,
                fitToHeight: 0,
                horizontalCentered: true,
                margins: { left: 0.2, right: 0.2, top: 0.4, bottom: 0.4, header: 0.3, footer: 0.3 }
            }
        });
        workbook.created = new Date();
        workbook.modified = new Date();

        // ✅ Title Row (UPDATED: Now W columns instead of V)
        worksheet.mergeCells('A1:W1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = `របាយការណ៍លម្អិតទិញ សង នៅសល់ពីក្រុមហ៊ុនប៉េត្រូណាស់`;
        titleCell.font = { size: 16, bold: true, name: 'Khmer Moul' };
        titleCell.alignment = { horizontal: 'center' };

        // ✅ Date Range Row
        worksheet.mergeCells('A2:W2');
        const dateRangeCell = worksheet.getCell('A2');
        const today = new Date();
        const firstDay = '01';
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const year = today.getFullYear();
        const formattedFirstDate = `${firstDay}.${month}.${year.toString().slice(-2)}`;
        const formattedLastDate = `${lastDay}.${month}.${year.toString().slice(-2)}`;
        dateRangeCell.value = `សំរាប់ថ្ងៃទី ${formattedFirstDate} ដល់ថ្ងៃទី ${formattedLastDate}`;
        dateRangeCell.font = { name: 'Khmer OS', size: 12 };
        dateRangeCell.alignment = { horizontal: 'center' };
        worksheet.addRow([]);

        // ✅ Top Header Row (UPDATED: Added one column)
        const topHeaderRow = worksheet.addRow([
            '', '', '', 'កំណើនក្នុងគ្រា', '', '', '', '', '', '', '', '', '',
            'សងក្នុងគ្រា', '', '', '', '',
            'ចុងគ្រា', '', '', '', '#'
        ]);
        worksheet.mergeCells('A4:C4');   // Left section
        worksheet.mergeCells('D4:M4');   // កំណើនក្នុងគ្រា (Purchase) - now includes price per liter
        worksheet.mergeCells('N4:R4');   // សងក្នុងគ្រា (Payment)
        worksheet.mergeCells('S4:V4');   // ចុងគ្រា (Remaining)
        topHeaderRow.height = 35;
        topHeaderRow.eachCell((cell) => {
            cell.font = { bold: true, name: 'Khmer OS', size: 12 };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DDDDDD' } };
            cell.border = {
                top: { style: 'thin' }, left: { style: 'thin' },
                bottom: { style: 'thin' }, right: { style: 'thin' }
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        });

        // ✅ Headers with NEW "តម្លៃក្នុង1លីត្រ" column
        const headers = [
            'ល.រ\nទី',              // A: Row number
            'ថ្ងៃខែឆ្នាំ',            // B: Date
            'លេខប័ណ្ណ',             // C: Card number
            'ប្រភេទ\nប្រេង',        // D: Fuel type
            'Extra',               // E: Extra quantity
            'Diesel',              // F: Diesel quantity
            'តម្លៃក្នុង\n1តោន',     // G: Price per ton (unit_price)
            'តម្លៃក្នុង\n1លីត្រ',    // H: Price per liter ✅ NEW
            'លីត្រ',               // I: Total liters
            'ទឹកប្រាក់\nឥន្ធនៈ',    // J: Total amount
            '',                    // K: empty
            '',                    // L: empty
            '',                    // M: empty
            'ថ្ងៃខែឆ្នាំ',            // N: Payment date
            'វិធីបង់',           // O: Payment method
            'ទឹកប្រាក់',            // P: Payment amount
            '',                    // Q: empty
            '',                    // R: empty
            'លេខប័ណ្ណ',             // S: Card remaining
            'ទឹកប្រាក់',            // T: Remaining amount
            '',                    // U: empty
            '',                    // V: empty
            '#'                    // W: #
        ];
        const headerRow = worksheet.addRow(headers);
        headerRow.font = { bold: true, name: 'Khmer OS', size: 10 };
        headerRow.height = 40;
        headerRow.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DDDDDD' } };
            cell.border = {
                top: { style: 'thin' }, left: { style: 'thin' },
                bottom: { style: 'thin' }, right: { style: 'thin' }
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        });

        // Data processing
        let rowNumber = 1;
        let grandTotalExtra = 0, grandTotalDiesel = 0;
        let grandTotalExtraAmount = 0, grandTotalDieselAmount = 0;
        let grandTotalAmount = 0, grandTotalPaid = 0;
        const cardBalances = {};
        const sortedList = [...list].sort((a, b) => new Date(a.create_at) - new Date(b.create_at));

        for (const payable of sortedList) {
            const res = await request("payable", "get", { id: payable.id });
            let payableItems = [];
            
            if (res && res.list && res.list.length > 0) {
                payableItems = res.list[0].items || [];
            }

            if (payableItems.length === 0) continue;

            const categoryGroups = {};
            payableItems.forEach(item => {
                const catId = item.category_id || 'unknown';
                if (!categoryGroups[catId]) {
                    categoryGroups[catId] = {
                        category_id: catId,
                        items: [],
                        total_quantity: 0,
                        total_amount: 0,
                        card_numbers: []
                    };
                }
                categoryGroups[catId].items.push(item);
                categoryGroups[catId].total_quantity += parseFloat(item.quantity || 0);
                categoryGroups[catId].total_amount += parseFloat(item.total_amount || 0);
                if (item.card_number || item.barcode) {
                    categoryGroups[catId].card_numbers.push(item.card_number || item.barcode);
                }
            });

            for (const [categoryId, group] of Object.entries(categoryGroups)) {
                const categoryLabel = getCategoryName(categoryId);
                
                const labelLower = (categoryLabel || '').toLowerCase();
                const categoryValueLower = (categoryId || '').toLowerCase();
                
                const isExtra = labelLower.includes('extra') || labelLower.includes('gasoline') ||
                               labelLower.includes('អ័ិចត្រា') || labelLower.includes('សាំង') ||
                               labelLower.includes('/super') || labelLower.includes('super') ||
                               categoryValueLower.includes('extra') || categoryValueLower.includes('gasoline') ||
                               categoryValueLower.includes('super');
                                   
                const isDiesel = labelLower.includes('diesel') || labelLower.includes('ម៉ាស៊ូត') ||
                                labelLower.includes('euro') || labelLower.includes('euro-5') ||
                                categoryValueLower.includes('diesel') || categoryValueLower.includes('euro');
                
                const totalQty = group.total_quantity;
                const totalAmount = group.total_amount;

                let cardItems = [];
                try {
                    const cardRes = await request("payable/category-cards", "get", {
                        payable_id: payable.id,
                        category_id: categoryId
                    });
                    
                    if (cardRes?.items && cardRes.items.length > 0) {
                        cardItems = cardRes.items;
                    }
                } catch (err) {
                    console.error('Error fetching card items:', err);
                }

                if (cardItems.length > 0) {
                    cardItems.forEach((cardItem) => {
                        const cardNumber = cardItem.card_number || cardItem.barcode || '-';
                        const cardQty = parseFloat(cardItem.quantity || 0);
                        const cardAmount = parseFloat(cardItem.total_amount || 0);
                        const cardUnitPrice = parseFloat(cardItem.unit_price || 0);
                        
                        // ✅ GET actual_price from backend
                        const actualPrice = parseFloat(cardItem.actual_price || 1190);
                        
                        // ✅ CALCULATE price per liter
                        const pricePerLiter = actualPrice > 0 ? (cardUnitPrice / actualPrice) : 0;
                        
                        if (!cardBalances[cardNumber]) {
                            cardBalances[cardNumber] = { total: 0, paid: 0, remaining: 0 };
                        }
                        cardBalances[cardNumber].total += cardAmount;
                        cardBalances[cardNumber].remaining += cardAmount;

                        const extraQty = isExtra ? cardQty : '';
                        const dieselQty = isDiesel ? cardQty : '';

                        // ✅ UPDATED: Added price per liter column (H)
                        const row = worksheet.addRow([
                            rowNumber,                           // A: ល.រទី
                            formatDateClient(payable.create_at), // B: ថ្ងៃខែឆ្នាំ
                            cardNumber,                          // C: លេខប័ណ្ណ
                            categoryLabel,                       // D: ប្រភេទប្រេង
                            extraQty,                            // E: Extra
                            dieselQty,                           // F: Diesel
                            cardUnitPrice,                       // G: តម្លៃក្នុង1តោន
                            pricePerLiter,                       // H: តម្លៃក្នុង1លីត្រ ✅ NEW
                            cardQty,                             // I: លីត្រ (was H)
                            cardAmount,                          // J: ទឹកប្រាក់ឥន្ធនៈ (was I)
                            '', '', '',                          // K, L, M: empty
                            '', '', '', '', '',                  // N, O, P, Q, R: payment
                            '', '', '', '',                      // S, T, U, V: remaining
                            '#'                                  // W: #
                        ]);
                        row.height = 25;
                        
                        row.eachCell((cell, colNumber) => {
                            cell.border = {
                                top: { style: 'thin' }, left: { style: 'thin' },
                                bottom: { style: 'thin' }, right: { style: 'thin' }
                            };
                            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                            
                            // Khmer font
                            if ([3, 4].includes(colNumber)) {
                                cell.font = { name: 'Khmer OS', size: 10 };
                            }
                            
                            // ✅ Number formatting for quantities (E, F, I)
                            if ([5, 6, 9].includes(colNumber) && cell.value) {
                                cell.numFmt = '#,##0.00';
                                cell.value = parseFloat(cell.value);
                            }
                            
                            // ✅ Number formatting for prices (G, H, J)
                            if ([7, 8, 10].includes(colNumber) && cell.value) {
                                cell.numFmt = '#,##0.00';
                                cell.value = parseFloat(cell.value);
                            }
                        });
                        
                        // ✅ Add note showing calculation
                        const amountCell = row.getCell(10);  // Column J (Total Amount)
                        amountCell.note = {
                            texts: [{
                                font: { name: 'Arial', size: 9 },
                                text: `Formula: ${cardQty.toFixed(2)} L × ${pricePerLiter.toFixed(4)} = ${cardAmount.toFixed(2)}\n` +
                                      `Unit Price: $${cardUnitPrice.toFixed(2)}\n` +
                                      `Actual Price: $${actualPrice.toFixed(2)}\n` +
                                      `Price/L: $${pricePerLiter.toFixed(4)}`
                            }]
                        };
                        
                        rowNumber++;
                    });
                    
                    if (isExtra) {
                        grandTotalExtra += totalQty;
                        grandTotalExtraAmount += totalAmount;
                    } else if (isDiesel) {
                        grandTotalDiesel += totalQty;
                        grandTotalDieselAmount += totalAmount;
                    }
                    grandTotalAmount += totalAmount;
                }
            }

            // Add payments
            const payments = await request("payable/payment-history", "get", { payable_id: payable.id });
            if (payments?.list && payments.list.length > 0) {
                const sortedPayments = payments.list.sort((a, b) => new Date(a.payment_date) - new Date(b.payment_date));
                sortedPayments.forEach(payment => {
                    const paymentAmount = parseFloat(payment.payment_amount);
                    const cardNum = payment.card_number;
                    
                    if (cardNum && cardBalances[cardNum]) {
                        cardBalances[cardNum].paid += paymentAmount;
                        cardBalances[cardNum].remaining -= paymentAmount;
                    }
                    
                    const remainingBalance = cardNum && cardBalances[cardNum] ? cardBalances[cardNum].remaining : 0;
                    
                    const paymentRow = worksheet.addRow([
                        '', '', '', '', '', '', '', '',          // A-H: empty (including new price/liter column)
                        '', '',                                  // I, J: empty
                        '', '', '',                              // K, L, M: empty
                        formatDateClient(payment.payment_date),  // N: ថ្ងៃខែឆ្នាំ
                        payment.payment_method || '',            // O: វិធីបង់
                        paymentAmount,                           // P: ទឹកប្រាក់
                        '', '',                                  // Q, R: empty
                        cardNum || '-',                          // S: លេខប័ណ្ណ
                        remainingBalance,                        // T: ទឹកប្រាក់
                        '', '',                                  // U, V: empty
                        '#'                                      // W: #
                    ]);
                    
                    paymentRow.height = 25;
                    paymentRow.eachCell((cell, colNumber) => {
                        cell.border = {
                            top: { style: 'thin' }, left: { style: 'thin' },
                            bottom: { style: 'thin' }, right: { style: 'thin' }
                        };
                        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                        if (colNumber === 15) {
                            cell.font = { name: 'Khmer OS', size: 10 };
                        }
                        if ([16, 20].includes(colNumber) && cell.value) {
                            cell.numFmt = '#,##0.00';
                            cell.value = parseFloat(cell.value);
                        }
                    });
                    grandTotalPaid += paymentAmount;
                });
            }
        }
        
        const grandTotalRemaining = grandTotalAmount - grandTotalPaid;

        // Summary section
        worksheet.addRow([]);
        const summaryHeaderRow = worksheet.addRow([
            '', '', '', 'សរុបកំណើនក្នុងគ្រា', '', '', '', '', '', '', '', '', '',
            '', 'សរុបសងក្នុងគ្រា', '', '', '',
            'សរុបចុងគ្រា', '', '', '', '#'
        ]);
        worksheet.mergeCells(`D${worksheet.rowCount}:M${worksheet.rowCount}`);
        worksheet.mergeCells(`O${worksheet.rowCount}:R${worksheet.rowCount}`);
        worksheet.mergeCells(`S${worksheet.rowCount}:V${worksheet.rowCount}`);
        
        summaryHeaderRow.eachCell((cell, colNumber) => {
            if ([4, 15, 19].includes(colNumber)) {
                cell.font = { bold: true, name: 'Khmer OS', size: 11 };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } };
            }
        });
        
        const summarySubHeaderRow = worksheet.addRow([
            '', '', '', 'ប្រភេទប្រេង', 'Extra', 'Diesel', '', '', 'សរុប\nលីត្រ', 'ទឹកប្រាក់',
            '', '', '', '', 'ទឹកប្រាក់', '', '', '', '', 'ទឹកប្រាក់\nសល់', '', '', '#'
        ]);
        summarySubHeaderRow.font = { bold: true, name: 'Khmer OS', size: 10 };
        summarySubHeaderRow.eachCell((cell) => {
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        });
        
        const extraSummaryRow = worksheet.addRow([
            '', '', '', 'Extra', grandTotalExtra, '', '', '', grandTotalExtra, grandTotalExtraAmount,
            '', '', '', '', grandTotalPaid, '', '', '', '', grandTotalRemaining, '', '', '#'
        ]);
        extraSummaryRow.eachCell((cell, colNumber) => {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.font = { name: 'Khmer OS', size: 10 };
            if ([5, 9, 10, 15, 20].includes(colNumber)) {
                cell.font = { ...cell.font, bold: true };
                if (cell.value) {
                    cell.numFmt = '#,##0.00';
                    cell.value = parseFloat(cell.value);
                }
            }
        });
        
        const dieselSummaryRow = worksheet.addRow([
            '', '', '', 'Diesel', '', grandTotalDiesel, '', '', grandTotalDiesel, grandTotalDieselAmount,
            '', '', '', '', '', '', '', '', '', '', '', '', '#'
        ]);
        dieselSummaryRow.eachCell((cell, colNumber) => {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.font = { name: 'Khmer OS', size: 10 };
            if ([6, 9, 10].includes(colNumber)) {
                cell.font = { ...cell.font, bold: true };
                if (cell.value) {
                    cell.numFmt = '#,##0.00';
                    cell.value = parseFloat(cell.value);
                }
            }
        });
        worksheet.addRow([]);

        // Date and signatures
        const currentDate = new Date();
        const formattedDay = currentDate.getDate();
        const formattedMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
        const formattedYear = currentDate.getFullYear().toString().slice(-2);
        const locationDateRow = worksheet.addRow([
            '', '', '', '', '', '', '', '', '', '', '', '', '',
            '', '', '', '', '', '', `ថ្ងៃ ខែ ឆ្នាំ ${formattedDay}.${formattedMonth}.${formattedYear}`, '', '', '#'
        ]);
        worksheet.mergeCells(`T${worksheet.rowCount}:V${worksheet.rowCount}`);
        locationDateRow.getCell(20).font = { name: 'Khmer OS', size: 11 };
        locationDateRow.getCell(20).alignment = { horizontal: 'right', vertical: 'middle' };
        worksheet.addRow([]);
        worksheet.addRow([]);

        const signatureRow = worksheet.addRow([
            '', '', '', '', '', 'អតិថិជន', '', '', '', '', '', '', '',
            '', 'ប្រធានសាខា', '', '', '', '', '', 'គណនេយ្យ', '', '#'
        ]);
        worksheet.mergeCells(`F${worksheet.rowCount}:G${worksheet.rowCount}`);
        worksheet.mergeCells(`O${worksheet.rowCount}:P${worksheet.rowCount}`);
        worksheet.mergeCells(`U${worksheet.rowCount}:V${worksheet.rowCount}`);
        signatureRow.getCell(6).font = { bold: true, name: 'Khmer Moul', size: 11 };
        signatureRow.getCell(6).alignment = { horizontal: 'center' };
        signatureRow.getCell(15).font = { bold: true, name: 'Khmer Moul', size: 11 };
        signatureRow.getCell(15).alignment = { horizontal: 'center' };
        signatureRow.getCell(21).font = { bold: true, name: 'Khmer Moul', size: 11 };
        signatureRow.getCell(21).alignment = { horizontal: 'center' };

        // ✅ Column Widths (UPDATED: Added one column)
        const columnWidths = [
            5,   // A: ល.រទី
            12,  // B: ថ្ងៃខែឆ្នាំ
            12,  // C: លេខប័ណ្ណ
            25,  // D: ប្រភេទប្រេង
            10,  // E: Extra
            10,  // F: Diesel
            10,  // G: តម្លៃក្នុង1តោន
            10,  // H: តម្លៃក្នុង1លីត្រ ✅ NEW
            10,  // I: លីត្រ
            12,  // J: ទឹកប្រាក់ឥន្ធនៈ
            3,   // K: empty
            3,   // L: empty
            3,   // M: empty
            12,  // N: ថ្ងៃខែឆ្នាំ payment
            18,  // O: វិធីបង់
            12,  // P: ទឹកប្រាក់ payment
            3,   // Q: empty
            3,   // R: empty
            15,  // S: លេខប័ណ្ណ remaining
            12,  // T: ទឹកប្រាក់ remaining
            3,   // U: empty
            3,   // V: empty
            5    // W: #
        ];
        columnWidths.forEach((width, i) => {
            worksheet.getColumn(i + 1).width = width;
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `Company_Payables_${dayjs().format('YYYY-MM-DD')}.xlsx`);
        hideLoadingMessage();
        message.success("Export ជោគជ័យ / Export successful!");
    } catch (error) {
        hideLoadingMessage();
        message.error("Export បរាជ័យ / Export failed!");
        console.error("Export error:", error); 
    }
};
const totalPayables = list.reduce((sum, item) => sum + parseFloat(item.total_amount || 0), 0);
    const totalPaid = list.reduce((sum, item) => sum + parseFloat(item.paid_amount || 0), 0);
    const totalRemaining = list.reduce((sum, item) => sum + parseFloat(item.remaining_amount || 0), 0);

     const getStatusColor = (status) => {
        switch (status) {
            case 0: return "red";
            case 1: return "orange";
            case 2: return "green";
            default: return "default";
        }
    };
    const getStatusText = (status) => {
        switch (status) {
            case 0: return "Unpaid";
            case 1: return "Partial";
            case 2: return "Paid";
            default: return "Unknown";
        }
    };

    const PayableCard = ({ item, index }) => (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-3 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-300">
                            #{index + 1}
                        </span>
                        <Tag color={getStatusColor(item.status)}>
                            {t(getStatusText(item.status).toLowerCase())}
                        </Tag>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                        {item.company_name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        {item.description}
                    </p>
                </div>
            </div>

            <div className="space-y-1.5 text-sm mb-3">
                <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-300">{t('total')}:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                        ${parseFloat(item.total_amount).toFixed(2)}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-300">{t('paid')}:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                        ${parseFloat(item.paid_amount).toFixed(2)}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-300">{t('total_remaining')}:</span>
                    <span className="font-bold text-red-600 dark:text-red-400">
                        ${parseFloat(item.remaining_amount).toFixed(2)}
                    </span>
                </div>
                {item.due_date && (
                    <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-300">{t('due_date')}:</span>
                        <span className="text-gray-900 dark:text-gray-100">
                            {formatDateClient(item.due_date)}
                        </span>
                    </div>
                )}
            </div>

            <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-600">
                <Button
                    type="default"
                    size="small"
                    icon={<AiOutlineEye />}
                    onClick={() => onClickViewDetail(item)}
                    className="flex-1"
                >
                    {t('view')}
                </Button>
                <Button
                    type="default"
                    size="small"
                    icon={<AiOutlineHistory />}
                    onClick={() => onClickViewHistory(item)}
                />
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
                            title={t('total_payables')}
                            value={totalPayables}
                            precision={2}
                            prefix="$"
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic
                            title={t('total_paid')}
                            value={totalPaid}
                            precision={2}
                            prefix="$"
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic
                            title={t('total_remaining')}
                            value={totalRemaining}
                            precision={2}
                            prefix="$"
                            valueStyle={{ color: '#f5222d' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Header */}
            <div className="pageHeader flex-col sm:flex-row gap-3">
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto flex-1">
                    <div className="text-lg font-semibold whitespace-nowrap">
                        {t('company_payables')}
                    </div>
                    <Input.Search
                        onChange={(e) =>
                            setState((prev) => ({ ...prev, txtSearch: e.target.value }))
                        }
                        allowClear
                        onSearch={getList}
                        placeholder={t('search_company_description')}
                        className="w-full sm:w-64"
                    />
                    <Select
                        placeholder={t('filter_by_status')}
                        value={state.statusFilter}
                        onChange={(value) =>
                            setState((prev) => ({ ...prev, statusFilter: value }))
                        }
                        allowClear
                        className="w-full sm:w-40"
                        options={[
                            { label: t('unpaid'), value: 0 },
                            { label: t('partial'), value: 1 },
                            { label: t('paid'), value: 2 },
                        ]}
                    />
                    <div className="flex gap-2">
                        <Button
                            type="primary"
                            onClick={getList}
                            icon={<FiSearch />}
                            className="flex-1 sm:flex-none"
                        >
                            <span className="hidden sm:inline">{t('filter')}</span>
                        </Button>
                        <Button
                            type="primary"
                            onClick={ExportToExcel}
                            icon={<IoBook />}
                            className="flex-1 sm:flex-none"
                        >
                            <span className="hidden sm:inline">{t('export')}</span>
                        </Button>
                    </div>
                </div>
                <Button
                    type="primary"
                    onClick={onClickAddBtn}
                    icon={<MdNewLabel />}
                    className="w-full sm:w-auto"
                >
                    {t('new_payable')}
                </Button>
            </div>

            {/* Modals - keeping all existing modal code ... */}
            <Modal
                open={state.visibleModal}
                title={state.id ? t('edit_payable') : t('new_payable')}
                footer={null}
                onCancel={onCloseModal}
                width={window.innerWidth < 768 ? '95%' : 900}
            >
                <Form layout="vertical" onFinish={onFinish} form={formRef}>
                    <Form.Item name="id" hidden>
                        <Input />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="company_name"
                                label={t('company_name')}
                                rules={[{ required: true, message: t('please_select_company') }]}
                            >
                                <Select
                                    showSearch
                                    placeholder={t('select_company')}
                                    optionFilterProp="label"
                                    filterOption={(input, option) =>
                                        option.label.toLowerCase().includes(input.toLowerCase())
                                    }
                                    options={
                                        config?.company_name?.map((item, index) => ({
                                            label: `${index + 1}. ${item.label}`,
                                            value: item.value,
                                        })) || []
                                    }
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="due_date" label={t('due_date')}>
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="description" label={`${t('description')} (${t('optional')})`}>
                        <Input.TextArea placeholder={t('general_description')} rows={2} />
                    </Form.Item>

                    <Divider>{t('items_products')}</Divider>

                    {/* Items List */}
                    <div className="max-h-96 overflow-y-auto mb-4">
                        {items.map((item, index) => (
                            <Card
                                key={index}
                                size="small"
                                className="mb-3"
                                extra={
                                    <Button
                                        type="text"
                                        danger
                                        icon={<AiOutlineDelete />}
                                        onClick={() => removeItem(index)}
                                    />
                                }
                            >
                                <Row gutter={8}>
                                    <Col xs={24} md={8}>
                                        <div className="mb-2">
                                            <label className="text-xs text-gray-500">{t('category')} *</label>
                                            <Select
                                                showSearch
                                                placeholder={t('select_category')}
                                                style={{ width: '100%' }}
                                                value={item.category_id}
                                                onChange={(value) => onCategorySelect(index, value)}
                                                filterOption={(input, option) =>
                                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                                }
                                                optionRender={(option) => (
                                                    <div>
                                                        <div style={{ fontWeight: 'bold' }}>{option.label}</div>
                                                        {option.data?.description && (
                                                            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                                                                {option.data.description}
                                                            </div>
                                                        )}
                                                        {option.data?.actual_price && (
                                                            <div style={{ fontSize: '12px', color: '#1890ff', marginTop: '2px', fontWeight: '500' }}>
                                                                {t('actual_price')}: ${parseFloat(option.data.actual_price).toLocaleString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                options={config?.category?.map(cat => ({
                                                    label: cat.label,
                                                    value: cat.value,
                                                    description: cat.description || '',
                                                    actual_price: cat.actual_price || 1190,
                                                    barcode: cat.barcode || ''
                                                })) || []}
                                            />
                                        </div>
                                    </Col>
                                    <Col xs={12} md={4}>
                                        <div className="mb-2">
                                            <label className="text-xs text-gray-500">{t('barcode_card')}</label>
                                            <Input
                                                value={item.barcode}
                                                onChange={(e) => updateItem(index, 'barcode', e.target.value)}
                                                placeholder="លេខកាត"
                                            />
                                        </div>
                                    </Col>
                                    <Col xs={12} md={6}>
                                        <div className="mb-2">
                                            <label className="text-xs text-gray-500">{t('product_name')}</label>
                                            <Input
                                                value={item.product_name}
                                                disabled
                                                placeholder={t('auto_oil')}
                                            />
                                        </div>
                                    </Col>
                                    <Col xs={12} md={3}>
                                        <div className="mb-2">
                                            <label className="text-xs text-gray-500">{t('quantity')} *</label>
                                            <InputNumber
                                                style={{ width: '100%' }}
                                                value={item.quantity}
                                                onChange={(value) => updateItem(index, 'quantity', value)}
                                                placeholder="0"
                                                min={0}
                                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                                parser={(value) => value.replace(/(,*)/g, "")}
                                            />
                                        </div>
                                    </Col>
                                    <Col xs={12} md={3}>
                                        <div className="mb-2">
                                            <label className="text-xs text-gray-500">{t('unit')}</label>
                                            <Select
                                                value={item.unit}
                                                onChange={(value) => updateItem(index, 'unit', value)}
                                                placeholder="L, Kg, Box"
                                                options={config?.unit || []}
                                                style={{ width: '100%' }}
                                            />
                                        </div>
                                    </Col>
                                </Row>
                                <Row gutter={8}>
                                    <Col xs={12} md={8}>
                                        <div>
                                            <label className="text-xs text-gray-500">{t('unit_price')} *</label>
                                            <InputNumber
                                                style={{ width: '100%' }}
                                                value={item.unit_price}
                                                onChange={(value) => updateItem(index, 'unit_price', value)}
                                                placeholder="0.00"
                                                prefix="$"
                                                min={0}
                                                formatter={(value) => `$ ${Math.round(value || 0).toLocaleString()}`}
                                                parser={(value) => Math.round(value.replace(/[^\d]/g, ""))}
                                            />
                                        </div>
                                    </Col>
                                    <Col xs={12} md={8}>
                                        <div>
                                            <label className="text-xs text-gray-500">{t('total_amount')}</label>
                                            <div className="font-bold text-lg text-green-600">
                                                ${parseFloat(item.total_amount || 0).toFixed(2)}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {t('formula')}: (qty × price) / {item.actual_price || 1190}
                                            </div>
                                        </div>
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <div>
                                            <label className="text-xs text-gray-500">{t('note')}</label>
                                            <Input
                                                value={item.description}
                                                onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                placeholder={t('item_note')}
                                            />
                                        </div>
                                    </Col>
                                </Row>
                            </Card>
                        ))}
                    </div>

                    <Button
                        type="dashed"
                        onClick={addItem}
                        icon={<MdAdd />}
                        className="w-full mb-4"
                    >
                        {t('add_item')}
                    </Button>

                    {/* Total Display */}
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded mb-4">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold">{t('total_amount')}:</span>
                            <span className="text-2xl font-bold text-green-600">
                                ${calculateTotalAmount().toFixed(2)}
                            </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            {items.length} {t('items')}
                        </div>
                    </div>

                    <Space className="w-full justify-end">
                        <Button onClick={onCloseModal}>{t('cancel')}</Button>
                        <Button type="primary" htmlType="submit">
                            {state.id ? t('update') : t('save')}
                        </Button>
                    </Space>
                </Form>
            </Modal>


            <Modal
                open={state.visibleDetailModal}
                title={t('payable_details')}
                footer={[
                    <Button key="close" onClick={onCloseDetailModal}>
                        {t('close')}
                    </Button>
                ]}
                onCancel={onCloseDetailModal}
                width={window.innerWidth < 768 ? '95%' : 900}
                styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
            >
                {state.selectedPayable && (
                    <div>
                        <Card size="small" className="mb-3">
                            <h3 className="font-semibold text-lg mb-2">
                                {state.selectedPayable.company_name}
                            </h3>

                            <Row gutter={16}>
                                <Col span={8}>
                                    <Statistic
                                        title={t('total')}
                                        value={state.selectedPayable.total_amount}
                                        precision={2}
                                        prefix="$"
                                    />
                                </Col>
                                <Col span={8}>
                                    <Statistic
                                        title={t('paid')}
                                        value={state.selectedPayable.paid_amount}
                                        precision={2}
                                        prefix="$"
                                        valueStyle={{ color: '#52c41a' }}
                                    />
                                </Col>
                                <Col span={8}>
                                    <Statistic
                                        title={t('remaining')}
                                        value={state.selectedPayable.remaining_amount}
                                        precision={2}
                                        prefix="$"
                                        valueStyle={{ color: '#f5222d' }}
                                    />
                                </Col>
                            </Row>
                        </Card>

                        {state.selectedPayable.items && state.selectedPayable.items.length > 0 && (
                            <Card title={t('items_products_grouped')} size="small">
                                {/* Desktop Table */}
                                <div className="hidden md:block">
                                    <Table
                                        dataSource={state.selectedPayable.items}
                                        rowKey="category_id"
                                        pagination={false}
                                        size="small"
                                        columns={[
                                            {
                                                title: t('no'),
                                                render: (_, __, index) => index + 1,
                                                width: 50,
                                            },
                                            {
                                                key: "category_id",
                                                title: t('category'),
                                                dataIndex: "category_id",
                                                width: 180,
                                                render: (categoryId) => {
                                                    const category = config?.category?.find(c => c.value === categoryId);
                                                    const label = category?.label || categoryId || "-";
                                                    const color = label.toLowerCase().includes('extra') ||
                                                        label.toLowerCase().includes('gasoline')
                                                        ? 'green'
                                                        : label.toLowerCase().includes('diesel')
                                                            ? 'orange'
                                                            : 'default';
                                                    return (
                                                        <Tag color={color} className="font-semibold text-base px-3 py-1">
                                                            {label}
                                                        </Tag>
                                                    );
                                                },
                                            },
                                            {
                                                title: t('cards_bann'),
                                                dataIndex: "card_count",
                                                width: 100,
                                                align: "center",
                                                render: (count) => (
                                                    <Tag color="purple" className="text-sm px-2 py-1">
                                                        {count} {count > 1 ? t('cards') : t('card')}
                                                    </Tag>
                                                ),
                                            },
                                            {
                                                title: t('total_quantity'),
                                                dataIndex: "quantity",
                                                align: "right",
                                                width: 130,
                                                render: (val) => (
                                                    <span className="font-medium text-base">
                                                        {parseFloat(val).toLocaleString(undefined, {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2
                                                        })}
                                                    </span>
                                                ),
                                            },
                                            {
                                                title: t('unit'),
                                                dataIndex: "unit",
                                                width: 60,
                                            },
                                            {
                                                title: t('total_amount'),
                                                dataIndex: "total_amount",
                                                align: "right",
                                                width: 140,
                                                render: (val) => (
                                                    <span className="font-bold text-green-600 text-base">
                                                        ${parseFloat(val).toFixed(2)}
                                                    </span>
                                                ),
                                            },
                                            {
                                                title: t('action'),
                                                align: "center",
                                                width: 120,
                                                render: (_, record) => (
                                                    <Button
                                                        type="primary"
                                                        size="small"
                                                        icon={<AiOutlineEye />}
                                                        onClick={() => onClickViewCategoryCards(record)}
                                                    >
                                                        {t('view_detail')}
                                                    </Button>
                                                ),
                                            },
                                        ]}
                                        summary={(pageData) => {
                                            const totalQty = pageData.reduce((sum, record) =>
                                                sum + parseFloat(record.quantity || 0), 0);
                                            const totalAmount = pageData.reduce((sum, record) =>
                                                sum + parseFloat(record.total_amount || 0), 0);
                                            const totalCards = pageData.reduce((sum, record) =>
                                                sum + parseInt(record.card_count || 0), 0);

                                            return (
                                                <Table.Summary fixed>
                                                    <Table.Summary.Row className="bg-gray-50">
                                                        <Table.Summary.Cell index={0} className="font-bold">
                                                            {t('total')}
                                                        </Table.Summary.Cell>
                                                        <Table.Summary.Cell index={1} className="font-bold">
                                                            {pageData.length} {t('categories')}
                                                        </Table.Summary.Cell>
                                                        <Table.Summary.Cell index={2} align="center" className="font-bold text-purple-600">
                                                            {totalCards} {t('cards')}
                                                        </Table.Summary.Cell>
                                                        <Table.Summary.Cell index={3} align="right" className="font-bold">
                                                            {totalQty.toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2
                                                            })}
                                                        </Table.Summary.Cell>
                                                        <Table.Summary.Cell index={4} />
                                                        <Table.Summary.Cell index={5} align="right" className="font-bold text-green-600">
                                                            ${totalAmount.toFixed(2)}
                                                        </Table.Summary.Cell>
                                                        <Table.Summary.Cell index={6} />
                                                    </Table.Summary.Row>
                                                </Table.Summary>
                                            );
                                        }}
                                    />
                                </div>

                                {/* Mobile Cards View */}
                                <div className="block md:hidden space-y-3">
                                    {state.selectedPayable.items.map((item, index) => {
                                        const category = config?.category?.find(c => c.value === item.category_id);
                                        const label = category?.label || item.category_id || "-";
                                        const color = label.toLowerCase().includes('extra') ||
                                            label.toLowerCase().includes('gasoline')
                                            ? 'green'
                                            : label.toLowerCase().includes('diesel')
                                                ? 'orange'
                                                : 'default';

                                        return (
                                            <div key={item.category_id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-semibold text-gray-500">
                                                            #{index + 1}
                                                        </span>
                                                        <Tag color={color} className="font-semibold px-2 py-1">
                                                            {label}
                                                        </Tag>
                                                    </div>
                                                    <Tag color="purple" className="text-xs px-2 py-1">
                                                        {item.card_count} {item.card_count > 1 ? t('cards') : t('card')}
                                                    </Tag>
                                                </div>

                                                <div className="space-y-1.5 text-sm mb-3">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600 dark:text-gray-300">{t('quantity')}:</span>
                                                        <span className="font-medium">
                                                            {parseFloat(item.quantity).toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2
                                                            })} {item.unit}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600 dark:text-gray-300">{t('total_amount')}:</span>
                                                        <span className="font-bold text-green-600">
                                                            ${parseFloat(item.total_amount).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <Button
                                                    type="primary"
                                                    size="small"
                                                    icon={<AiOutlineEye />}
                                                    onClick={() => onClickViewCategoryCards(item)}
                                                    className="w-full"
                                                >
                                                    {t('view_card_details')}
                                                </Button>
                                            </div>
                                        );
                                    })}

                                    {/* Mobile Summary */}
                                    <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-3 border-2 border-blue-200 dark:border-blue-700">
                                        <div className="font-bold text-center mb-2 text-blue-900 dark:text-blue-100">
                                            {t('summary')}
                                        </div>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-300">{t('categories')}:</span>
                                                <span className="font-semibold">
                                                    {state.selectedPayable.items.length}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-300">{t('total')} {t('cards')}:</span>
                                                <span className="font-semibold text-purple-600">
                                                    {state.selectedPayable.items.reduce((sum, item) =>
                                                        sum + parseInt(item.card_count || 0), 0
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-300">{t('total_quantity')}:</span>
                                                <span className="font-semibold">
                                                    {state.selectedPayable.items.reduce((sum, item) =>
                                                        sum + parseFloat(item.quantity || 0), 0
                                                    ).toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2
                                                    })}
                                                </span>
                                            </div>
                                            <div className="flex justify-between pt-2 border-t border-blue-300 dark:border-blue-600">
                                                <span className="font-bold text-gray-700 dark:text-gray-200">
                                                    {t('total_amount')}:
                                                </span>
                                                <span className="font-bold text-green-600 text-lg">
                                                    ${state.selectedPayable.items.reduce((sum, item) =>
                                                        sum + parseFloat(item.total_amount || 0), 0
                                                    ).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                )}
            </Modal>
            <Modal
                open={state.visiblePaymentModal}
                title={t('add_payment')}
                footer={null}
                onCancel={onClosePaymentModal}
                width={window.innerWidth < 768 ? '95%' : 500}
            >
                {state.selectedPayable && (
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                        <div className="font-semibold">{state.selectedPayable.company_name}</div>
                        {state.selectedItem && (
                            <div className="text-sm text-blue-600 mt-1">
                                📇 {t('card')}: {state.selectedItem.card_number}
                            </div>
                        )}
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                            {t('remaining')}: ${parseFloat(state.selectedPayable.remaining_amount).toFixed(2)}
                        </div>
                    </div>
                )}

                <Form layout="vertical" onFinish={onFinishPayment} form={paymentFormRef}>
                    {/* Card number is pre-filled and hidden */}
                    <Form.Item name="card_number" hidden>
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="payment_amount"
                        label={t('payment_amount')}
                        rules={[
                            { required: true, message: t('please_input_payment_amount') },
                            {
                                validator: (_, value) => {
                                    if (state.selectedItem && parseFloat(value) > parseFloat(state.selectedItem.total_amount)) {
                                        return Promise.reject(t('payment_exceeds_total'));
                                    }
                                    return Promise.resolve();
                                }
                            }
                        ]}
                    >
                        <Input type="number" placeholder="0.00" prefix="$" />
                    </Form.Item>

                    <Form.Item
                        name="payment_date"
                        label={t('payment_date')}
                        rules={[{ required: true, message: t('please_select_payment_date') }]}
                    >
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        name="payment_method"
                        label={t('payment_method')}
                    >
                        <Select
                            placeholder={t('select_payment_method')}
                            options={[
                                { label: "ABA Bank", value: "ABA Bank" },
                                { label: "ACLEDA Bank", value: "ACLEDA Bank" },
                                { label: "Canadia Bank", value: "Canadia Bank" },
                                { label: "ANZ Royal Bank", value: "ANZ Royal Bank" },
                                { label: "Hattha Bank", value: "Hattha Bank" },
                                { label: "Phnom Penh Commercial Bank", value: "Phnom Penh Commercial Bank" },
                                { label: "Vattanac Bank", value: "Vattanac Bank" },
                                { label: "Foreign Trade Bank", value: "Foreign Trade Bank" },
                                { label: "Maybank Cambodia", value: "Maybank Cambodia" },
                                { label: "BRED Bank (Cambodia)", value: "BRED Bank" },
                                { label: "Cash", value: "Cash" },
                                { label: "Other", value: "Other" },
                            ]}
                        />
                    </Form.Item>

                    <Form.Item name="note" label={t('note')}>
                        <Input.TextArea placeholder={t('payment_note')} rows={2} />
                    </Form.Item>

                    <Space className="w-full justify-end">
                        <Button onClick={onClosePaymentModal}>{t('cancel')}</Button>
                        <Button type="primary" htmlType="submit">
                            {t('add_payment')}
                        </Button>
                    </Space>
                </Form>
            </Modal>

            <Modal
                open={state.visibleHistoryModal}
                title={t('payment_history')}
                footer={[
                    <Button key="close" onClick={onCloseHistoryModal}>
                        {t('close')}
                    </Button>
                ]}
                onCancel={onCloseHistoryModal}
                width={window.innerWidth < 768 ? '95%' : 700}
            >
                {state.selectedPayable && (
                    <div className="mb-4">
                        <h3 className="font-semibold text-lg">{state.selectedPayable.company_name}</h3>
                        <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                            <div>
                                <span className="text-gray-500">{t('total')}:</span>
                                <span className="ml-2 font-semibold">
                                    ${parseFloat(state.selectedPayable.total_amount).toFixed(2)}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-500">{t('paid')}:</span>
                                <span className="ml-2 font-semibold text-green-600">
                                    ${parseFloat(state.selectedPayable.paid_amount).toFixed(2)}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-500">{t('remaining')}:</span>
                                <span className="ml-2 font-semibold text-red-600">
                                    ${parseFloat(state.selectedPayable.remaining_amount).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {paymentHistory.length > 0 ? (
                    <Timeline>
                        {paymentHistory.map((payment) => (
                            <Timeline.Item key={payment.id} color="green">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="font-semibold">
                                        ${parseFloat(payment.payment_amount).toFixed(2)}
                                    </div>
                                    {payment.card_number && (
                                        <Tag color="blue" className="text-xs">
                                            📇 {payment.card_number}
                                        </Tag>
                                    )}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                    {formatDateClient(payment.payment_date)}
                                    {payment.payment_method && ` • ${payment.payment_method}`}
                                </div>
                                {payment.note && (
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {payment.note}
                                    </div>
                                )}
                                <div className="text-xs text-gray-400 mt-1">
                                    {t('by')}: {payment.create_by} • {formatDateServer(payment.create_at, "YYYY-MM-DD h:mm A")}
                                </div>
                            </Timeline.Item>
                        ))}
                    </Timeline>
                ) : (
                    <div className="text-center text-gray-500 py-8">
                        {t('no_payment_history')}
                    </div>
                )}
            </Modal>
            <Modal
                open={state.visibleCardDetailModal}
                title={
                    <div>
                        <div className="text-lg font-semibold">{t('card_details')}</div>
                        {state.selectedCategory && (
                            <div className="text-sm text-gray-500 mt-1">
                                {t('category')}: {
                                    config?.category?.find(c => c.value === state.selectedCategory.category_id)?.label ||
                                    state.selectedCategory.category_id
                                } • {state.cardItems.length} {t('cards')}
                            </div>
                        )}
                    </div>
                }
                footer={[
                    <Button key="back" onClick={onCloseCardDetailModal}>
                        Back to Summary
                    </Button>
                ]}
                onCancel={onCloseCardDetailModal}
                width={window.innerWidth < 768 ? '95%' : 1000}
            >
                <Card size="small">
                    <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                        <Row gutter={16}>
                            <Col span={8}>
                                <div className="text-xs text-gray-500 mb-1">{t('category')}</div>
                                <div className="font-semibold text-lg">
                                    {config?.category?.find(c => c.value === state.selectedCategory?.category_id)?.label ||
                                        state.selectedCategory?.category_id || '-'}
                                </div>
                            </Col>
                            <Col span={8}>
                                <div className="text-xs text-gray-500 mb-1">{t('total')} {t('cards')}</div>
                                <div className="font-semibold text-lg text-purple-600">
                                    {state.cardItems.length} {t('cards')}
                                </div>
                            </Col>
                            <Col span={8}>
                                <div className="text-xs text-gray-500 mb-1">{t('category')} {t('total')}</div>
                                <div className="font-semibold text-lg text-green-600">
                                    ${parseFloat(state.selectedCategory?.total_amount || 0).toFixed(2)}
                                </div>
                            </Col>
                        </Row>
                    </div>

                    <Table
                        dataSource={state.cardItems}
                        rowKey={(record) => `${record.card_number}-${record.id}`}
                        pagination={false}
                        size="small"
                        scroll={{ x: 'max-content' }}
                        columns={[
                            {
                                title: t('no'),
                                render: (_, __, index) => index + 1,
                                width: 50,
                            },
                            {
                                title: `${t('card_number')} / លេខកាត`,
                                dataIndex: "card_number",
                                width: 140,
                                render: (value) => (
                                    <Tag color="blue" className="font-semibold text-sm px-3 py-1">
                                        📇 {value || "-"}
                                    </Tag>
                                ),
                            },
                            {
                                title: t('product'),
                                dataIndex: "product_name",
                                width: 100,
                            },
                            {
                                title: t('quantity'),
                                dataIndex: "quantity",
                                align: "right",
                                width: 120,
                                render: (val) => (
                                    <span className="font-medium">
                                        {parseFloat(val).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
                                    </span>
                                ),
                            },
                            {
                                title: t('unit'),
                                dataIndex: "unit",
                                width: 60,
                            },
                            {
                                title: t('unit_price'),
                                dataIndex: "unit_price",
                                align: "right",
                                width: 100,
                                render: (val) => `$${parseFloat(val).toFixed(2)}`,
                            },
                            {
                                title: t('total_amount'),
                                dataIndex: "total_amount",
                                align: "right",
                                width: 130,
                                render: (val) => (
                                    <span className="font-semibold text-green-600">
                                        ${parseFloat(val).toFixed(2)}
                                    </span>
                                ),
                            },
                            {
                                title: t('action'),
                                align: "center",
                                width: 100,
                                fixed: 'right',
                                render: (_, record) => (
                                    <Button
                                        type="primary"
                                        size="small"
                                        icon={<MdPayment />}
                                        onClick={() => {
                                            setState({
                                                ...state,
                                                visibleCardDetailModal: false,
                                                visibleDetailModal: false,
                                                visiblePaymentModal: true,
                                                selectedItem: record,
                                            });
                                            paymentFormRef.resetFields();
                                            paymentFormRef.setFieldsValue({
                                                payment_date: dayjs(),
                                                card_number: record.card_number,
                                            });
                                        }}
                                        disabled={state.selectedPayable?.status === 2}
                                    >
                                        {t('pay')}
                                    </Button>
                                ),
                            },
                        ]}
                        summary={(pageData) => {
                            const totalQty = pageData.reduce((sum, record) =>
                                sum + parseFloat(record.quantity || 0), 0);
                            const totalAmount = pageData.reduce((sum, record) =>
                                sum + parseFloat(record.total_amount || 0), 0);

                            return (
                                <Table.Summary fixed>
                                    <Table.Summary.Row className="bg-gray-50">
                                        <Table.Summary.Cell index={0} colSpan={3} className="font-bold">
                                            {t('total')} ({pageData.length} {t('cards')})
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={3} align="right" className="font-bold">
                                            {totalQty.toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            })}
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={4} />
                                        <Table.Summary.Cell index={5} />
                                        <Table.Summary.Cell index={6} align="right" className="font-bold text-green-600">
                                            ${totalAmount.toFixed(2)}
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={7} />
                                    </Table.Summary.Row>
                                </Table.Summary>
                            );
                        }}
                    />
                </Card>
            </Modal>

            {/* Desktop Table */}
            <div className="hidden md:block">
                <Table
                    dataSource={list}
                    rowKey="id"
                    columns={[
                        {
                            key: "no",
                            title: t('no'),
                            render: (_, __, index) => index + 1,
                            width: 60,
                        },
                        {
                            key: "company_name",
                            title: t('company_name'),
                            dataIndex: "company_name",
                            sorter: (a, b) => a.company_name.localeCompare(b.company_name),
                        },
                        {
                            key: "description",
                            title: t("description"),
                            dataIndex: "description",
                            ellipsis: true,
                        },
                        {
                            key: "total_amount",
                            title: t("total_amount"),
                            dataIndex: "total_amount",
                            render: (value) => `$${parseFloat(value).toFixed(2)}`,
                            sorter: (a, b) => parseFloat(a.total_amount) - parseFloat(b.total_amount),
                        },
                        {
                            key: "paid_amount",
                            title: t("paid"),
                            dataIndex: "paid_amount",
                            render: (value) => (
                                <span className="text-green-600 font-medium">
                                    ${parseFloat(value).toFixed(2)}
                                </span>
                            ),
                        },
                        {
                            key: "remaining_amount",
                            title: t("remaining"),
                            dataIndex: "remaining_amount",
                            render: (value) => (
                                <span className="text-red-600 font-bold">
                                    ${parseFloat(value).toFixed(2)}
                                </span>
                            ),
                        },
                        {
                            key: "status",
                            title: t("Status"),
                            dataIndex: "status",
                            render: (value) => (
                                <Tag color={getStatusColor(value)}>
                                    {getStatusText(value)}
                                </Tag>
                            ),
                            filters: [
                                { text: "Unpaid", value: 0 },
                                { text: "Partial", value: 1 },
                                { text: "Paid", value: 2 },
                            ],
                            onFilter: (value, record) => record.status === value,
                        },
                        {
                            key: "due_date",
                            title: t("due_date"),
                            dataIndex: "due_date",
                            render: (value) => value ? formatDateClient(value) : "-",
                        },
                        {
                            key: "action",
                            title: t("Action"),
                            align: "center",
                            render: (_, record) => (
                                <Space>
                                    <Button
                                        type="default"
                                        icon={<AiOutlineEye />}
                                        onClick={() => onClickViewDetail(record)}
                                    />
                                    <Button
                                        type="default"
                                        icon={<AiOutlineHistory />}
                                        onClick={() => onClickViewHistory(record)}
                                    />
                                    <Button
                                        type="primary"
                                        icon={<MdEdit />}
                                        onClick={() => onClickEdit(record)}
                                    />
                                    <Button
                                        type="primary"
                                        danger
                                        icon={<MdDelete />}
                                        onClick={() => onClickDelete(record)}
                                    />
                                </Space>
                            ),
                        },
                    ]}
                    pagination={{ pageSize: 10 }}
                />
            </div>

            {/* Mobile Cards */}
            <div className="block md:hidden">
                {list.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        {t('no_data')}
                    </div>
                ) : (
                    list.map((item, index) => (
                        <PayableCard key={item.id} item={item} index={index} />
                    ))
                )}
            </div>
        </MainPage>
    );
}

export default CompanyPaymentPage;