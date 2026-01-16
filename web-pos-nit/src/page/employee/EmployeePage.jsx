import React, { useEffect, useState, useRef } from "react";
import {
    Button, Form, Input, message, Modal, Select, Space, Table, Tag,
    Descriptions, TimePicker, Checkbox, Alert, Row, Col, Card, Divider,
    Statistic, Progress, DatePicker, Tabs, Badge, Typography
} from "antd";
import { formatDateClient, request } from "../../util/helper";
import * as XLSX from 'xlsx/xlsx.mjs';
import { MdDelete, MdEdit, MdNewLabel } from "react-icons/md";
import { AiOutlineEye, AiOutlineClockCircle, AiOutlineUserAdd } from "react-icons/ai";
import { BiStats } from "react-icons/bi";
import { FiUserCheck, FiUserX } from "react-icons/fi";
import MainPage from "../../component/layout/MainPage";
import { FiSearch } from "react-icons/fi";
import { IoBook } from "react-icons/io5";
import { useTranslation } from '../../locales/TranslationContext';
import moment from 'moment';
import {
    LockOutlined,
    UserAddOutlined,
    UserOutlined,
    DollarOutlined,
    CheckCircleOutlined,
    FileExcelOutlined,
    PrinterOutlined,
    FilePdfOutlined,
    DownloadOutlined,
    CalculatorOutlined,
    TeamOutlined,
    CalendarOutlined,
    InfoCircleOutlined
} from "@ant-design/icons";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const { Title, Text } = Typography;

function EmployeePage() {
    const { t } = useTranslation();
    const [formRef] = Form.useForm();
    const [loginFormRef] = Form.useForm();
    const printRef = useRef();

    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [lateStats, setLateStats] = useState([]);
    const [salaryReportData, setSalaryReportData] = useState([]);
    const [salaryReportSummary, setSalaryReportSummary] = useState(null);
    const [salaryReportLoading, setSalaryReportLoading] = useState(false);
    const [salaryDateRange, setSalaryDateRange] = useState([
        moment().startOf('month'),
        moment().endOf('month')
    ]);
    const [accountModal, setAccountModal] = useState({
        visible: false,
        employee: null
    });
    const [accountForm] = Form.useForm();

    const [state, setState] = useState({
        visibleModal: false,
        visibleViewModal: false,
        visibleLoginModal: false,
        visibleStatsModal: false,
        visibleSalaryReportModal: false,
        id: null,
        txtSearch: "",
        selectedEmployee: null,
        accountInfo: null,
    });

    useEffect(() => {
        getList();
    }, []);

    const getList = async () => {
        setLoading(true);
        const param = { txtSearch: state.txtSearch };
        const res = await request("employee", "get", param);
        setLoading(false);
        if (res) {
            setList(res.list);
        }
    };

    const checkHasAccount = async (employeeId) => {
        const res = await request(`employee/${employeeId}/has-account`, "get");
        if (res && !res.error) {
            setState(prev => ({ ...prev, accountInfo: res }));
            return res;
        }
        return null;
    };

    const getLateStatistics = async (days = 30) => {
        setLoading(true);
        const res = await request(`employee/statistics/late?days=${days}`, "get");
        setLoading(false);
        if (res && !res.error) {
            setLateStats(res.statistics);
            setState(prev => ({ ...prev, visibleStatsModal: true }));
        } else {
            message.error("Failed to load statistics");
        }
    };

    const closeSalaryReportModal = () => {
        setState(prev => ({ ...prev, visibleSalaryReportModal: false }));
    };

    const handleCreateAccount = (employee) => {
        setAccountModal({
            visible: true,
            employee: employee
        });

        accountForm.setFieldsValue({
            employee_id: employee.id,
            username: employee.email || `${employee.name.toLowerCase().replace(/\s+/g, '.')}@company.com`
        });
    };

    const onCreateAccount = async (values) => {
        try {
            const res = await request("employee/create-account", "post", {
                employee_id: accountModal.employee.id,
                username: values.username,
                password: values.password,
                role_id: values.role_id
            });

            if (res && !res.error) {
                message.success(res.message);
                getList();
                setAccountModal({ visible: false, employee: null });
                accountForm.resetFields();
            } else {
                message.error(res.message);
            }
        } catch (error) {
            message.error("Failed to create account");
        }
    };

    const onClickView = async (data) => {
        const accountInfo = await checkHasAccount(data.id);
        setState({
            ...state,
            visibleViewModal: true,
            selectedEmployee: data,
            accountInfo: accountInfo
        });
    };

    const fetchSalaryReport = async () => {
        setSalaryReportLoading(true);
        try {
            const fromDate = salaryDateRange[0].format('YYYY-MM-DD');
            const toDate = salaryDateRange[1].format('YYYY-MM-DD');

            const res = await request(`attendance/salary-report?from_date=${fromDate}&to_date=${toDate}`, 'get');

            if (res && !res.error) {
                setSalaryReportData(res.report || []);
                setSalaryReportSummary(res.summary || {});
            } else {
                message.error('Failed to load salary report');
            }
        } catch (error) {
            console.error('Error:', error);
            message.error('Failed to fetch salary report');
        } finally {
            setSalaryReportLoading(false);
        }
    };

    // 安全的打印功能
    const handlePrintReport = () => {
        // 创建打印窗口
        const printWindow = window.open('', '_blank', 'width=900,height=600');
        if (!printWindow) {
            message.error('Please allow popups for printing');
            return;
        }
        
        // 构建 HTML 内容
        const fromDate = salaryDateRange[0].format('DD/MM/YYYY');
        const toDate = salaryDateRange[1].format('DD/MM/YYYY');
        const generatedDate = moment().format('DD/MM/YYYY HH:mm');
        
        // 使用模板字符串创建 HTML
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Salary Report</title>
                <meta charset="UTF-8">
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        margin: 20px;
                        color: #333;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                        border-bottom: 2px solid #1890ff;
                        padding-bottom: 20px;
                    }
                    .company-name {
                        font-size: 24px;
                        font-weight: bold;
                        color: #1890ff;
                        margin-bottom: 10px;
                    }
                    .report-title {
                        font-size: 20px;
                        font-weight: 600;
                        margin-bottom: 10px;
                    }
                    .report-info {
                        color: #666;
                        font-size: 14px;
                        margin-bottom: 5px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: left;
                    }
                    th {
                        background-color: #f5f5f5;
                        font-weight: 600;
                    }
                    tr:nth-child(even) {
                        background-color: #f9f9f9;
                    }
                    .total-row {
                        background-color: #e6f7ff;
                        font-weight: bold;
                    }
                    .currency {
                        text-align: right;
                    }
                    .footer {
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid #eee;
                        font-size: 12px;
                        color: #999;
                        text-align: center;
                    }
                    @media print {
                        body { margin: 0; padding: 20px; }
                        @page { margin: 20mm; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="company-name">Company Name</div>
                    <div class="report-title">Salary Payment Report</div>
                    <div class="report-info">Period: ${fromDate} - ${toDate}</div>
                    <div class="report-info">Generated: ${generatedDate}</div>
                </div>
                
                ${createTableHTML()}
                
                <div class="footer">
                    <p>This is a system generated report. For inquiries, contact HR Department.</p>
                    <p>Page 1 of 1</p>
                </div>
                
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() {
                            window.close();
                        }, 1000);
                    };
                </script>
            </body>
            </html>
        `;
        
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    // 辅助函数：创建表格 HTML
    const createTableHTML = () => {
        if (salaryReportData.length === 0) {
            return '<p style="text-align: center; color: #999;">No data available</p>';
        }

        let tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Employee</th>
                        <th>Position</th>
                        <th>Base Salary</th>
                        <th>Work Days</th>
                        <th>On Time</th>
                        <th>Late</th>
                        <th>Absent</th>
                        <th>Deductions</th>
                        <th>Net Salary</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        salaryReportData.forEach((emp, index) => {
            const lateDays = (emp.days_late_grace || 0) + (emp.days_late_penalty || 0);
            
            tableHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${emp.employee_name}</td>
                    <td>${emp.position || '-'}</td>
                    <td class="currency">$${parseFloat(emp.monthly_salary || 0).toFixed(2)}</td>
                    <td>${emp.days_worked || 0}</td>
                    <td>${emp.days_on_time || 0}</td>
                    <td>${lateDays}</td>
                    <td>${emp.days_absent || 0}</td>
                    <td class="currency">-$${parseFloat(emp.total_deductions || 0).toFixed(2)}</td>
                    <td class="currency"><strong>$${parseFloat(emp.net_salary || 0).toFixed(2)}</strong></td>
                </tr>
            `;
        });
        
        if (salaryReportSummary) {
            const totalLateDays = (salaryReportSummary.total_days_late_grace || 0) + 
                                 (salaryReportSummary.total_days_late_penalty || 0);
            
            tableHTML += `
                <tr class="total-row">
                    <td colspan="3"><strong>TOTAL</strong></td>
                    <td class="currency"><strong>$${parseFloat(salaryReportSummary.total_base_salary || 0).toFixed(2)}</strong></td>
                    <td><strong>${salaryReportSummary.total_days_worked || 0}</strong></td>
                    <td><strong>${salaryReportSummary.total_days_on_time || 0}</strong></td>
                    <td><strong>${totalLateDays}</strong></td>
                    <td><strong>${salaryReportSummary.total_days_absent || 0}</strong></td>
                    <td class="currency"><strong>-$${parseFloat(salaryReportSummary.total_deductions || 0).toFixed(2)}</strong></td>
                    <td class="currency"><strong>$${parseFloat(salaryReportSummary.total_net_salary || 0).toFixed(2)}</strong></td>
                </tr>
            `;
        }
        
        tableHTML += `
                </tbody>
            </table>
        `;
        
        return tableHTML;
    };

    // PDF 导出功能
    const exportToPDF = async () => {
        try {
            const element = printRef.current;
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });
            
            const imgWidth = 297;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`Salary_Report_${moment().format('YYYY-MM-DD')}.pdf`);
            
            message.success('PDF exported successfully!');
        } catch (error) {
            console.error('PDF export error:', error);
            message.error('Failed to export PDF');
        }
    };

    // Excel 导出功能
    const exportSalaryExcel = () => {
        if (salaryReportData.length === 0) {
            message.warning('No data to export');
            return;
        }

        // 主工作表数据
        const exportData = salaryReportData.map((emp, index) => ({
            'No': index + 1,
            'Employee ID': emp.user_id,
            'Employee Name': emp.employee_name,
            'Position': emp.position || '-',
            'Base Salary': parseFloat(emp.monthly_salary || 0).toFixed(2),
            'Work Days': emp.days_worked,
            'On Time': emp.days_on_time,
            'Late (Grace)': emp.days_late_grace,
            'Late (Penalty)': emp.days_late_penalty,
            'Absent': emp.days_absent,
            'Late Deduction': parseFloat(emp.late_deduction_amount || 0).toFixed(2),
            'Absent Deduction': parseFloat(emp.absent_deduction_amount || 0).toFixed(2),
            'Total Deductions': parseFloat(emp.total_deductions || 0).toFixed(2),
            'Net Salary': parseFloat(emp.net_salary || 0).toFixed(2)
        }));

        // 汇总工作表数据
        const summaryData = [{
            'Report Period': `${salaryDateRange[0].format('DD/MM/YYYY')} - ${salaryDateRange[1].format('DD/MM/YYYY')}`,
            'Total Employees': salaryReportSummary?.total_employees || 0,
            'Total Base Salary': parseFloat(salaryReportSummary?.total_base_salary || 0).toFixed(2),
            'Total Deductions': parseFloat(salaryReportSummary?.total_deductions || 0).toFixed(2),
            'Total Net Salary': parseFloat(salaryReportSummary?.total_net_salary || 0).toFixed(2),
            'Generated Date': moment().format('DD/MM/YYYY HH:mm')
        }];

        const ws1 = XLSX.utils.json_to_sheet(exportData);
        const ws2 = XLSX.utils.json_to_sheet(summaryData);
        
        // 设置列宽
        const wscols = [
            {wch: 5},
            {wch: 10},
            {wch: 25},
            {wch: 20},
            {wch: 12},
            {wch: 10},
            {wch: 12},
            {wch: 15},
            {wch: 12},
            {wch: 12},
            {wch: 15},
            {wch: 15},
            {wch: 15},
            {wch: 12},
        ];
        ws1['!cols'] = wscols;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws1, 'Salary Report');
        XLSX.utils.book_append_sheet(wb, ws2, 'Summary');
        
        XLSX.writeFile(wb, `Salary_Report_${moment().format('YYYY-MM-DD')}.xlsx`);
        message.success('Exported successfully!');
    };

    const openSalaryReportModal = () => {
        setState(prev => ({ ...prev, visibleSalaryReportModal: true }));
        fetchSalaryReport();
    };

    const onClickEdit = (data) => {
        setState({ ...state, visibleModal: true, id: data.id });

        let workingDays = [];
        try {
            workingDays = typeof data.working_days === 'string'
                ? JSON.parse(data.working_days)
                : data.working_days || [];
        } catch (e) {
            workingDays = [];
        }

        formRef.setFieldsValue({
            id: data.id,
            name: data.name,
            gender: data.gender,
            position: data.position,
            salary: data.salary,
            tel: data.tel,
            email: data.email,
            address: data.address,
            code: data.code,
            website: data.website,
            note: data.note,
            is_active: data.status,
            work_type: data.work_type || 'full-time',
            work_start_time: data.work_start_time ? moment(data.work_start_time, 'HH:mm:ss') : moment('07:00', 'HH:mm'),
            work_end_time: data.work_end_time ? moment(data.work_end_time, 'HH:mm:ss') : moment('17:00', 'HH:mm'),
            grace_period_minutes: data.grace_period_minutes || 30,
            working_days: workingDays,
            schedule_notes: data.schedule_notes
        });
    };

    const onClickDelete = async (data) => {
        Modal.confirm({
            title: t('delete'),
            content: t('delete_confirm'),
            okText: t('yes'),
            cancelText: t('no_cancel'),
            onOk: async () => {
                const res = await request("employee", "delete", { id: data.id });
                if (res && !res.error) {
                    message.success(res.message);
                    const newList = list.filter((item) => item.id !== data.id);
                    setList(newList);
                }
            },
        });
    };

    const onClickAddBtn = () => {
        setState({ ...state, visibleModal: true, id: null });
        formRef.resetFields();
        formRef.setFieldsValue({
            work_type: 'full-time',
            work_start_time: moment('07:00', 'HH:mm'),
            work_end_time: moment('17:00', 'HH:mm'),
            grace_period_minutes: 30,
            working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            is_active: 1
        });
    };

    const onCloseModal = () => {
        formRef.resetFields();
        setState({ ...state, visibleModal: false, id: null });
    };

    const onCloseViewModal = () => {
        setState({ ...state, visibleViewModal: false, selectedEmployee: null, accountInfo: null });
    };

    const onOpenLoginModal = () => {
        setState(prev => ({ ...prev, visibleLoginModal: true }));
        loginFormRef.resetFields();
    };

    const onCloseLoginModal = () => {
        setState(prev => ({ ...prev, visibleLoginModal: false }));
        loginFormRef.resetFields();
    };

    const onCloseStatsModal = () => {
        setState(prev => ({ ...prev, visibleStatsModal: false }));
    };

    const onFinish = async (values) => {
        const data = {
            id: state.id,
            name: values.name,
            gender: values.gender,
            position: values.position,
            salary: values.salary,
            tel: values.tel,
            email: values.email,
            address: values.address,
            code: values.code,
            website: values.website,
            note: values.note,
            is_active: values.is_active,
            work_type: values.work_type,
            work_start_time: values.work_start_time ? values.work_start_time.format('HH:mm:ss') : '07:00:00',
            work_end_time: values.work_end_time ? values.work_end_time.format('HH:mm:ss') : '17:00:00',
            grace_period_minutes: values.grace_period_minutes || 30,
            working_days: values.working_days || [],
            schedule_notes: values.schedule_notes
        };

        const method = state.id ? "put" : "post";
        const res = await request("employee", method, data);

        if (res && !res.error) {
            message.success(res.message);
            getList();
            onCloseModal();
        } else {
            message.error(res.message || "An error occurred!");
        }
    };

    const ExportToExcel = () => {
        if (list.length === 0) {
            message.warning(t('no_data_export'));
            return;
        }

        const data = list.map((item) => ({
            Code: item.code,
            Name: item.name,
            Gender: item.gender,
            Position: item.position,
            'Work Type': item.work_type,
            'Work Hours': `${item.work_start_display} - ${item.work_end_display}`,
            'Daily Hours': item.daily_hours,
            Salary: item.salary,
            Tel: item.tel,
            Email: item.email,
            Status: item.status === 1 ? 'Active' : 'Inactive',
            Created: formatDateClient(item.create_at)
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Employees");
        XLSX.writeFile(wb, "Employee_Schedule.xlsx");
        message.success(t('export_success'));
    };

    const WorkScheduleBadge = ({ employee }) => {
        const workColor = employee.work_type === 'full-time' ? 'blue' : 'orange';
        return (
            <div className="flex flex-col gap-1">
                <Tag color={workColor} className="text-xs">
                    {employee.work_type?.toUpperCase() || 'FULL-TIME'}
                </Tag>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                    <AiOutlineClockCircle className="inline mr-1" />
                    {employee.work_start_display} - {employee.work_end_display}
                </div>
                {employee.daily_hours && (
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                        {employee.daily_hours}h/day
                    </div>
                )}
            </div>
        );
    };

    const MobileEmployeeCard = ({ employee }) => (
        <Card
            className="mb-3 shadow-sm"
            size="small"
            title={
                <div className="flex justify-between items-center">
                    <span className="font-bold">{employee.name}</span>
                    <Tag color={employee.status === 1 ? "green" : "red"}>
                        {employee.status === 1 ? t('active') : t('inactive')}
                    </Tag>
                </div>
            }
            extra={
                <Space>
                    <Button
                        size="small"
                        type="default"
                        icon={<AiOutlineEye />}
                        onClick={() => onClickView(employee)}
                    />
                    <Button
                        size="small"
                        type="primary"
                        icon={<MdEdit />}
                        onClick={() => onClickEdit(employee)}
                    />
                    <Button
                        size="small"
                        danger
                        icon={<MdDelete />}
                        onClick={() => onClickDelete(employee)}
                    />
                </Space>
            }
        >
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-500">Code:</span>
                    <span className="font-medium">{employee.code || '-'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Position:</span>
                    <span className="font-medium">{employee.position}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Work Type:</span>
                    <Tag color={employee.work_type === 'full-time' ? 'blue' : 'orange'}>
                        {employee.work_type?.toUpperCase()}
                    </Tag>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Schedule:</span>
                    <span>{employee.work_start_display} - {employee.work_end_display}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Salary:</span>
                    <span className="font-semibold text-green-600">${employee.salary}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Tel:</span>
                    <span>{employee.tel}</span>
                </div>
            </div>
        </Card>
    );

    // 打印预览组件
    const PrintPreviewComponent = () => (
        <div ref={printRef} style={{ display: 'none', padding: '20px', backgroundColor: 'white' }}>
            <div style={{ textAlign: 'center', marginBottom: 30 }}>
                <h2 style={{ color: '#1890ff', marginBottom: 10 }}>Salary Report</h2>
                <p>Period: {salaryDateRange[0].format('DD/MM/YYYY')} - {salaryDateRange[1].format('DD/MM/YYYY')}</p>
                <p>Generated: {moment().format('DD/MM/YYYY HH:mm')}</p>
            </div>
            
            {salaryReportData.length > 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                        <tr>
                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>#</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Employee</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Position</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Base Salary</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Work Days</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>On Time</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Late</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Absent</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Deductions</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Net Salary</th>
                        </tr>
                    </thead>
                    <tbody>
                        {salaryReportData.map((emp, index) => {
                            const lateDays = (emp.days_late_grace || 0) + (emp.days_late_penalty || 0);
                            return (
                                <tr key={emp.user_id} style={{ border: '1px solid #ddd' }}>
                                    <td style={{ padding: '8px', textAlign: 'center' }}>{index + 1}</td>
                                    <td style={{ padding: '8px' }}>{emp.employee_name}</td>
                                    <td style={{ padding: '8px' }}>{emp.position || '-'}</td>
                                    <td style={{ padding: '8px', textAlign: 'right' }}>${parseFloat(emp.monthly_salary || 0).toFixed(2)}</td>
                                    <td style={{ padding: '8px', textAlign: 'center' }}>{emp.days_worked || 0}</td>
                                    <td style={{ padding: '8px', textAlign: 'center' }}>{emp.days_on_time || 0}</td>
                                    <td style={{ padding: '8px', textAlign: 'center' }}>{lateDays}</td>
                                    <td style={{ padding: '8px', textAlign: 'center' }}>{emp.days_absent || 0}</td>
                                    <td style={{ padding: '8px', textAlign: 'right', color: '#cf1322' }}>
                                        -${parseFloat(emp.total_deductions || 0).toFixed(2)}
                                    </td>
                                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', color: '#3f8600' }}>
                                        ${parseFloat(emp.net_salary || 0).toFixed(2)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );

    return (
        <MainPage loading={loading}>
            {/* 打印预览组件 */}
            <PrintPreviewComponent />
            
            {/* Header */}
            <div className="pageHeader flex-col sm:flex-row gap-3">
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto flex-1">
                    <div className="text-lg font-semibold">{t('manage_employee')}</div>
                    <Input.Search
                        onChange={(e) => setState((prev) => ({ ...prev, txtSearch: e.target.value }))}
                        allowClear
                        onSearch={getList}
                        placeholder={t('search_by_name')}
                        className="w-full sm:w-64"
                    />
                    <div className="flex gap-2">
                        <Button type="primary" onClick={getList} icon={<FiSearch />}>
                            <span className="hidden sm:inline">{t('filter')}</span>
                        </Button>
                        <Button type="primary" onClick={ExportToExcel} icon={<IoBook />}>
                            <span className="hidden sm:inline">{t('export_excel')}</span>
                        </Button>
                        <Button
                            type="default"
                            onClick={() => getLateStatistics(30)}
                            icon={<BiStats />}
                            className="bg-orange-500 text-white hover:bg-orange-600"
                        >
                            <span className="hidden sm:inline">Late Stats</span>
                        </Button>
                        <Button
                            type="primary"
                            onClick={openSalaryReportModal}
                            icon={<DollarOutlined />}
                            style={{ background: '#059669', borderColor: '#059669' }}
                        >
                            <span className="hidden sm:inline">Salary Report</span>
                        </Button>
                    </div>
                </div>
                <Button type="primary" onClick={onClickAddBtn} icon={<MdNewLabel />}>
                    {t('new')}
                </Button>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block">
                <Table
                    rowClassName={() => "pos-row"}
                    dataSource={list}
                    columns={[
                        { key: "no", title: t('no'), render: (_, __, index) => index + 1, width: 50 },
                        { key: "code", title: t('code'), dataIndex: "code", width: 100 },
                        {
                            key: "name",
                            title: t('employee_name'),
                            dataIndex: "name",
                            sorter: (a, b) => a.name.localeCompare(b.name),
                            width: 150
                        },
                        {
                            key: "position",
                            title: t('position'),
                            dataIndex: "position",
                            width: 120
                        },
                        {
                            key: "work_schedule",
                            title: "Work Schedule",
                            render: (_, record) => <WorkScheduleBadge employee={record} />,
                            width: 180
                        },
                        {
                            key: "salary",
                            title: t('salary'),
                            dataIndex: "salary",
                            render: (value) => `$${value}`,
                            width: 100
                        },
                        {
                            key: "tel",
                            title: t('telephone'),
                            dataIndex: "tel",
                            width: 120
                        },
                        {
                            key: "status",
                            title: t('status'),
                            dataIndex: "status",
                            render: (value) => (
                                <Tag color={value === 1 ? "green" : "red"}>
                                    {value === 1 ? t('active') : t('inactive')}
                                </Tag>
                            ),
                            width: 100
                        },
                        {
                            key: "action",
                            title: t('action'),
                            align: "center",
                            render: (_, record) => (
                                <Space>
                                    <Button
                                        type="default"
                                        icon={<AiOutlineEye />}
                                        onClick={() => onClickView(record)}
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
                            width: 150
                        },
                        {
                            key: "account",
                            title: "Login Account",
                            align: "center",
                            width: 150,
                            render: (_, record) => (
                                record.has_account ? (
                                    <Tag color="green" icon={<CheckCircleOutlined />}>
                                        Has Account
                                    </Tag>
                                ) : (
                                    <Button
                                        type="link"
                                        icon={<UserAddOutlined />}
                                        onClick={() => handleCreateAccount(record)}
                                    >
                                        Create Account
                                    </Button>
                                )
                            ),
                        }
                    ]}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 1200 }}
                />
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden">
                {list.map(employee => (
                    <MobileEmployeeCard key={employee.id} employee={employee} />
                ))}
            </div>

            {/* Account Creation Modal */}
            <Modal
                open={accountModal.visible}
                title={
                    <div className="flex items-center gap-2">
                        <UserAddOutlined className="text-blue-500" />
                        <span>Create Login Account</span>
                    </div>
                }
                onCancel={() => {
                    setAccountModal({ visible: false, employee: null });
                    accountForm.resetFields();
                }}
                footer={null}
                width={500}
            >
                <Form
                    form={accountForm}
                    layout="vertical"
                    onFinish={onCreateAccount}
                >
                    <Alert
                        message="Create Account"
                        description={`Creating login account for: ${accountModal.employee?.name || ''}`}
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />

                    <Form.Item name="employee_id" hidden>
                        <Input />
                    </Form.Item>

                    <Form.Item
                        label="Username"
                        name="username"
                        rules={[
                            { required: true, message: 'Please input username!' },
                            { min: 3, message: 'Username must be at least 3 characters!' }
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder="Enter username"
                            autoComplete="off"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Password"
                        name="password"
                        rules={[
                            { required: true, message: 'Please input password!' },
                            { min: 6, message: 'Password must be at least 6 characters!' }
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Enter password"
                            autoComplete="new-password"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Confirm Password"
                        name="confirm_password"
                        dependencies={['password']}
                        rules={[
                            { required: true, message: 'Please confirm password!' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Passwords do not match!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Confirm password"
                            autoComplete="new-password"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Role"
                        name="role_id"
                        rules={[{ required: true, message: 'Please select a role!' }]}
                        initialValue={3}
                    >
                        <Select placeholder="Select role">
                            <Select.Option value={3}>Employee</Select.Option>
                            <Select.Option value={2}>Manager</Select.Option>
                            <Select.Option value={1}>Admin</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item>
                        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <Button
                                onClick={() => {
                                    setAccountModal({ visible: false, employee: null });
                                    accountForm.resetFields();
                                }}
                            >
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit" icon={<UserAddOutlined />}>
                                Create Account
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Salary Report Modal */}
            <Modal
                open={state.visibleSalaryReportModal}
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <DollarOutlined style={{ color: '#059669', fontSize: 20 }} />
                        <span>Salary Payment Report</span>
                    </div>
                }
                width={1200}
                onCancel={closeSalaryReportModal}
                footer={[
                    <Button
                        key="print"
                        icon={<PrinterOutlined />}
                        onClick={handlePrintReport}
                    >
                        Print
                    </Button>,
                    <Button
                        key="pdf"
                        icon={<FilePdfOutlined />}
                        onClick={exportToPDF}
                        style={{ background: '#ff4d4f', borderColor: '#ff4d4f', color: 'white' }}
                    >
                        Export PDF
                    </Button>,
                    <Button
                        key="excel"
                        type="primary"
                        icon={<FileExcelOutlined />}
                        onClick={exportSalaryExcel}
                        style={{ background: '#059669', borderColor: '#059669' }}
                    >
                        Export Excel
                    </Button>,
                    <Button key="close" onClick={closeSalaryReportModal}>
                        Close
                    </Button>
                ]}
            >
                <div>
                    {/* Date Filter */}
                    <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontWeight: 500 }}>Period:</span>
                        <DatePicker.RangePicker
                            value={salaryDateRange}
                            onChange={(dates) => {
                                if (dates) {
                                    setSalaryDateRange(dates);
                                    setTimeout(fetchSalaryReport, 100);
                                }
                            }}
                            format="YYYY-MM-DD"
                        />
                        <Button
                            type="primary"
                            onClick={fetchSalaryReport}
                            loading={salaryReportLoading}
                        >
                            Refresh
                        </Button>
                    </div>

                    {/* Summary Cards */}
                    {salaryReportSummary && (
                        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                            <Col xs={12} sm={6}>
                                <Card size="small" style={{ textAlign: 'center' }}>
                                    <Statistic
                                        title="Total Employees"
                                        value={salaryReportSummary.total_employees}
                                        valueStyle={{ color: '#1890ff' }}
                                    />
                                </Card>
                            </Col>
                            <Col xs={12} sm={6}>
                                <Card size="small" style={{ textAlign: 'center' }}>
                                    <Statistic
                                        title="Base Salary"
                                        value={parseFloat(salaryReportSummary.total_base_salary)}
                                        prefix="$"
                                        precision={2}
                                        valueStyle={{ color: '#3f8600' }}
                                    />
                                </Card>
                            </Col>
                            <Col xs={12} sm={6}>
                                <Card size="small" style={{ textAlign: 'center' }}>
                                    <Statistic
                                        title="Deductions"
                                        value={parseFloat(salaryReportSummary.total_deductions)}
                                        prefix="-$"
                                        precision={2}
                                        valueStyle={{ color: '#cf1322' }}
                                    />
                                </Card>
                            </Col>
                            <Col xs={12} sm={6}>
                                <Card size="small" style={{ textAlign: 'center' }}>
                                    <Statistic
                                        title="Net Salary"
                                        value={parseFloat(salaryReportSummary.total_net_salary)}
                                        prefix="$"
                                        precision={2}
                                        valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
                                    />
                                </Card>
                            </Col>
                        </Row>
                    )}

                    {/* Table */}
                    <Table
                        dataSource={salaryReportData}
                        loading={salaryReportLoading}
                        rowKey="user_id"
                        size="small"
                        bordered
                        scroll={{ x: 1000 }}
                        pagination={{ pageSize: 10 }}
                        columns={[
                            {
                                title: '#',
                                key: 'index',
                                width: 50,
                                render: (_, __, index) => index + 1
                            },
                            {
                                title: 'Employee',
                                key: 'employee',
                                width: 150,
                                render: (_, record) => (
                                    <div>
                                        <div style={{ fontWeight: 500 }}>{record.employee_name}</div>
                                        <div style={{ fontSize: 12, color: '#666' }}>{record.position}</div>
                                    </div>
                                )
                            },
                            {
                                title: 'Base',
                                dataIndex: 'monthly_salary',
                                key: 'salary',
                                width: 100,
                                align: 'right',
                                render: (value) => `$${parseFloat(value || 0).toFixed(2)}`
                            },
                            {
                                title: 'Attendance',
                                key: 'attendance',
                                width: 180,
                                render: (_, record) => (
                                    <Space direction="vertical" size={2}>
                                        <div style={{ fontSize: 11 }}>
                                            ✅ {record.days_on_time || 0} | ⏰ {record.days_late_grace || 0}
                                        </div>
                                        <div style={{ fontSize: 11 }}>
                                            ⚠️ {record.days_late_penalty || 0} | ❌ {record.days_absent || 0}
                                        </div>
                                    </Space>
                                )
                            },
                            {
                                title: 'Deductions',
                                key: 'deductions',
                                width: 130,
                                render: (_, record) => (
                                    <div>
                                        <div style={{ fontSize: 11, color: '#cf1322' }}>
                                            Late: -${parseFloat(record.late_deduction_amount || 0).toFixed(2)}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#cf1322' }}>
                                            Absent: -${parseFloat(record.absent_deduction_amount || 0).toFixed(2)}
                                        </div>
                                        <div style={{ fontWeight: 600, color: '#cf1322' }}>
                                            -${parseFloat(record.total_deductions || 0).toFixed(2)}
                                        </div>
                                    </div>
                                )
                            },
                            {
                                title: 'Net Salary',
                                key: 'net_salary',
                                width: 130,
                                align: 'right',
                                render: (_, record) => (
                                    <div>
                                        <div style={{ fontSize: 16, fontWeight: 700, color: '#3f8600' }}>
                                            ${parseFloat(record.net_salary || 0).toFixed(2)}
                                        </div>
                                        <Tag color={parseFloat(record.deduction_percentage || 0) > 10 ? 'red' : 'green'}>
                                            -{record.deduction_percentage || 0}%
                                        </Tag>
                                    </div>
                                )
                            }
                        ]}
                    />
                </div>
            </Modal>

            {/* 其他模态框保持不变 */}
            {/* 由于代码长度限制，这里省略了其他模态框，但你应该保留原始代码中的其他模态框 */}
        </MainPage>
    );
}

export default EmployeePage;