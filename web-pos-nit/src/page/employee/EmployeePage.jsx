
import React, { useEffect, useState, useRef } from "react";
import { Form, Modal, Tabs, Button, Select, Space, Alert, Input, Row, Col, Typography } from "antd";
import Swal from 'sweetalert2';
import {
    CalendarOutlined,
    TeamOutlined,
    DollarOutlined,
    FileTextOutlined,
    UserAddOutlined,
    UserOutlined,
    LockOutlined,
    PrinterOutlined,
    FilePdfOutlined,
    FileExcelOutlined
} from '@ant-design/icons';
import { request, isPermission } from "../../util/helper";
import * as XLSX from 'xlsx/xlsx.mjs';
import MainPage from "../../component/layout/MainPage";
import { useTranslation } from '../../locales/TranslationContext';
import moment from 'moment';

import EmployeeList from "./components/EmployeeList";
import EmployeeModal from "./components/EmployeeModal";
import AttendanceDashboard from "./components/AttendanceDashboard";

const { Title, Text } = Typography;

function EmployeePage() {
    const { t } = useTranslation();
    const [formRef] = Form.useForm();
    const [accountForm] = Form.useForm();
    const [resetForm] = Form.useForm();

    // State
    const [activeTab, setActiveTab] = useState('attendance');
    const [loading, setLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(false);
    const [list, setList] = useState([]);
    const [attendanceList, setAttendanceList] = useState([]);
    const [dashboardStats, setDashboardStats] = useState(null);
    const [roles, setRoles] = useState([]);

    // Modal & Form State
    const [state, setState] = useState({
        visibleModal: false,
        visibleViewModal: false,
        visibleSalaryReportModal: false,
        id: null,
        selectedEmployee: null,
        accountInfo: null,
        searchText: ""
    });

    const [accountModal, setAccountModal] = useState({ visible: false, employee: null });
    const [resetModal, setResetModal] = useState({ visible: false, employee: null });

    // Salary Report State
    const [salaryReportData, setSalaryReportData] = useState([]);
    const [salaryReportSummary, setSalaryReportSummary] = useState(null);
    const [salaryReportLoading, setSalaryReportLoading] = useState(false);
    const [salaryDateRange, setSalaryDateRange] = useState([moment().startOf('month'), moment().endOf('month')]);

    useEffect(() => {
        getRoles();
        if (activeTab === 'employee') {
            getList();
        } else if (activeTab === 'attendance') {
            getDashboardStats();
            getAttendanceList();
        }
    }, [activeTab]);

    // API Calls
    const getRoles = async () => {
        const res = await request("role", "get");
        if (res && !res.error) setRoles(res.list || []);
    };

    const getDashboardStats = async () => {
        setStatsLoading(true);
        const res = await request("attendance/dashboard-stats", "get");
        setStatsLoading(false);
        if (res && !res.error) setDashboardStats(res.summary);
    };

    const getAttendanceList = async () => {
        setLoading(true);
        const res = await request("attendance/list", "get");
        setLoading(false);
        if (res && !res.error) setAttendanceList(res.attendance);
    };

    const getList = async () => {
        setLoading(true);
        const param = { txtSearch: state.searchText };
        const res = await request("employee", "get", param);
        setLoading(false);
        if (res) setList(res.list);
    };

    const getAccountInfo = async (employeeId) => {
        const res = await request(`employee/${employeeId}/has-account`, "get");
        if (res && !res.error) return res;
        return null;
    };

    // Handlers
    const handleSearch = () => getList();

    const onClickAddBtn = () => {
        setState({ ...state, visibleModal: true, id: null });
        formRef.resetFields();
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
            ...data,
            work_start_time: data.work_start_time ? moment(data.work_start_time, 'HH:mm:ss') : moment('07:00', 'HH:mm'),
            work_end_time: data.work_end_time ? moment(data.work_end_time, 'HH:mm:ss') : moment('17:00', 'HH:mm'),
            working_days: workingDays,
            is_active: data.status
        });
    };

    const onClickDelete = async (data) => {
        Swal.fire({
            title: t('delete'),
            text: t('delete_confirm'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: t('yes')
        }).then(async (result) => {
            if (result.isConfirmed) {
                const res = await request("employee", "delete", { id: data.id });
                if (res && !res.error) {
                    Swal.fire('Deleted!', res.message, 'success');
                    setList(list.filter(item => item.id !== data.id));
                } else {
                    Swal.fire('Error', res?.message || "Failed to delete", 'error');
                }
            }
        });
    };

    const onFinish = async (values) => {
        const data = {
            ...values,
            id: state.id,
            work_start_time: values.work_start_time?.format('HH:mm:ss') || '07:00:00',
            work_end_time: values.work_end_time?.format('HH:mm:ss') || '17:00:00',
            working_days: values.working_days || []
        };

        const method = state.id ? "put" : "post";
        const res = await request("employee", method, data);

        if (res && !res.error) {
            Swal.fire('Success', res.message, 'success');
            getList();
            setState({ ...state, visibleModal: false });
        } else {
            Swal.fire('Error', res.message || "An error occurred!", 'error');
        }
    };

    // Account Handlers
    const handleCreateAccount = (employee) => {
        setAccountModal({ visible: true, employee });
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
                Swal.fire('Success', res.message, 'success');
                getList();
                setAccountModal({ visible: false, employee: null });
                accountForm.resetFields();
            } else {
                Swal.fire('Error', res.message, 'error');
            }
        } catch (error) {
            Swal.fire('Error', "Failed to create account", 'error');
        }
    };

    const onResetPassword = (employee) => {
        setResetModal({ visible: true, employee });
        resetForm.setFieldsValue({ role_id: employee.account_role_id });
    };

    const onSubmitResetPassword = async (values) => {
        // Implementation similar to onCreateAccount but for reset
        try {
            const res = await request("employee/reset-password", "post", {
                employee_id: resetModal.employee.id,
                new_password: values.password,
                role_id: values.role_id
            });
            if (res && !res.error) {
                Swal.fire('Success', t('reset_password_success'), 'success');
                setResetModal({ visible: false, employee: null });
                resetForm.resetFields();
            } else {
                Swal.fire('Error', res.message || t('reset_password_failed'), 'error');
            }
        } catch (error) {
            Swal.fire('Error', t('reset_password_failed'), 'error');
        }
    };

    // View Details Logic
    const onClickView = async (data) => {
        const accountInfo = await getAccountInfo(data.id);
        setState({
            ...state,
            visibleViewModal: true,
            selectedEmployee: data,
            accountInfo: accountInfo
        });
    };

    // Excel Export
    const onExportExcel = () => {
        if (list.length === 0) {
            Swal.fire('Warning', t('no_data_export'), 'warning');
            return;
        }
        const data = list.map(item => ({
            Code: item.code,
            Name: item.name,
            Gender: item.gender,
            Position: item.position,
            Salary: item.salary,
            Tel: item.tel,
            Status: item.status === 1 ? 'Active' : 'Inactive'
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Employees");
        XLSX.writeFile(wb, "Employees.xlsx");
    };

    return (
        <MainPage loading={loading || statsLoading}>
            <div className="employee-page-container">
                <div className="flex justify-between items-center mb-6">
                    <Title level={3} style={{ margin: 0 }}>
                        {activeTab === 'attendance' ? t('Attendance Dashboard') :
                            activeTab === 'employee' ? t('Employee Management') : t('Salary Reports')}
                    </Title>

                    {activeTab === 'employee' && isPermission("employee.create") && (
                        <Button type="primary" icon={<UserAddOutlined />} onClick={onClickAddBtn}>
                            {t('new_employee')}
                        </Button>
                    )}
                </div>

                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={[
                        { key: 'attendance', label: <span className="flex items-center gap-2"><CalendarOutlined /> {t('Attendance')}</span> },
                        { key: 'employee', label: <span className="flex items-center gap-2"><TeamOutlined /> {t('Employee List')}</span> },
                        { key: 'salary', label: <span className="flex items-center gap-2"><DollarOutlined /> {t('Salary Reports')}</span> }
                    ]}
                    className="mb-6"
                />

                {activeTab === 'attendance' && (
                    <AttendanceDashboard
                        dashboardStats={dashboardStats}
                        attendanceList={attendanceList}
                        loading={loading}
                        t={t}
                        onSearch={() => { }} // Implement attendance search
                    />
                )}

                {activeTab === 'employee' && (
                    <EmployeeList
                        list={list}
                        loading={loading}
                        t={t}
                        searchText={state.searchText}
                        setSearchText={(text) => setState({ ...state, searchText: text })}
                        onSearch={handleSearch}
                        onEdit={onClickEdit}
                        onDelete={onClickDelete}
                        onView={onClickView}
                        onCreateAccount={handleCreateAccount}
                        onResetPassword={onResetPassword}
                        onExportExcel={onExportExcel}
                        isPermission={isPermission}
                    />
                )}

                {activeTab === 'salary' && (
                    <div className="bg-white p-12 rounded-xl text-center border border-gray-100 shadow-sm salary-report-card">
                        <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 salary-icon-bg">
                            <DollarOutlined className="text-3xl text-green-600 salary-icon" />
                        </div>
                        <Title level={3} className="mb-2">{t('Salary & Payroll')}</Title>
                        <Text type="secondary" className="block mb-8 text-lg">
                            {t('Manage employee salaries, view detailed reports, and process payroll calculations.')}
                        </Text>
                        <Button
                            type="primary"
                            size="large"
                            icon={<FileTextOutlined />}
                            className="bg-green-600 border-green-600 h-12 px-8 rounded-lg hover:bg-green-700"
                            onClick={() => setState({ ...state, visibleSalaryReportModal: true })}
                        >
                            {t('Open Full Salary Report')}
                        </Button>
                    </div>
                )}

                {/* Modals */}
                <EmployeeModal
                    visible={state.visibleModal}
                    onCancel={() => setState({ ...state, visibleModal: false })}
                    onFinish={onFinish}
                    form={formRef}
                    t={t}
                    id={state.id}
                />

                {/* Account Creation Modal */}
                <Modal
                    title={t('create_login_account')}
                    open={accountModal.visible}
                    onCancel={() => setAccountModal({ visible: false, employee: null })}
                    footer={null}
                >
                    <Form form={accountForm} layout="vertical" onFinish={onCreateAccount}>
                        <Alert message={`Creating account for ${accountModal.employee?.name}`} type="info" showIcon className="mb-4" />
                        <Form.Item name="username" label={t('username')} rules={[{ required: true }]}>
                            <Input prefix={<UserOutlined />} />
                        </Form.Item>
                        <Form.Item name="password" label={t('password')} rules={[{ required: true, min: 6 }]}>
                            <Input.Password prefix={<LockOutlined />} />
                        </Form.Item>
                        <Form.Item name="role_id" label={t('role')} rules={[{ required: true }]}>
                            <Select>
                                {roles.map(r => <Select.Option key={r.id} value={r.id}>{r.name}</Select.Option>)}
                            </Select>
                        </Form.Item>
                        <div className="text-right">
                            <Button onClick={() => setAccountModal({ visible: false, employee: null })} style={{ marginRight: 8 }}>{t('cancel')}</Button>
                            <Button type="primary" htmlType="submit">{t('create_account')}</Button>
                        </div>
                    </Form>
                </Modal>

                {/* Reset Password Modal */}
                <Modal
                    title={t('reset_password')}
                    open={resetModal.visible}
                    onCancel={() => setResetModal({ visible: false, employee: null })}
                    footer={null}
                >
                    <Form form={resetForm} layout="vertical" onFinish={onSubmitResetPassword}>
                        <Alert message={`Resetting password for ${resetModal.employee?.name}`} type="warning" showIcon className="mb-4" />
                        <Form.Item name="password" label={t('new_password')} rules={[{ required: true, min: 6 }]}>
                            <Input.Password prefix={<LockOutlined />} />
                        </Form.Item>
                        <Form.Item name="role_id" label={t('role')} rules={[{ required: true }]}>
                            <Select>
                                {roles.map(r => <Select.Option key={r.id} value={r.id}>{r.name}</Select.Option>)}
                            </Select>
                        </Form.Item>
                        <div className="text-right">
                            <Button onClick={() => setResetModal({ visible: false, employee: null })} style={{ marginRight: 8 }}>{t('cancel')}</Button>
                            <Button type="primary" danger htmlType="submit">{t('reset_password')}</Button>
                        </div>
                    </Form>
                </Modal>

                {/* View Employee Detail Modal */}
                <Modal
                    title={<span className="flex items-center gap-2"><UserOutlined className="text-blue-500" /> {t('employee_details')}</span>}
                    open={state.visibleViewModal}
                    footer={<Button onClick={() => setState({ ...state, visibleViewModal: false })}>{t('close')}</Button>}
                    onCancel={() => setState({ ...state, visibleViewModal: false })}
                    width={700}
                >
                    {state.selectedEmployee && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 border-b pb-4">
                                <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600 border border-blue-100">
                                    {state.selectedEmployee.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold m-0">{state.selectedEmployee.name}</h3>
                                    <p className="text-gray-500 m-0">{state.selectedEmployee.position}</p>
                                </div>
                            </div>
                            <Row gutter={[16, 16]}>
                                <Col span={12}><Text type="secondary">{t('code')}:</Text> <Text strong>{state.selectedEmployee.code}</Text></Col>
                                <Col span={12}><Text type="secondary">{t('gender')}:</Text> <Text strong>{state.selectedEmployee.gender}</Text></Col>
                                <Col span={12}><Text type="secondary">{t('salary')}:</Text> <Text strong type="success">${state.selectedEmployee.salary}</Text></Col>
                                <Col span={12}><Text type="secondary">{t('telephone')}:</Text> <Text strong>{state.selectedEmployee.tel}</Text></Col>
                                <Col span={24}><Text type="secondary">{t('email')}:</Text> <Text strong>{state.selectedEmployee.email}</Text></Col>
                                <Col span={24}><Text type="secondary">{t('address')}:</Text> <Text>{state.selectedEmployee.address}</Text></Col>
                            </Row>

                            {state.accountInfo && (
                                <Alert
                                    message={
                                        <div className="flex justify-between w-full">
                                            <span>Username: <b>{state.accountInfo.username}</b></span>
                                            <span>Role: <b>{state.accountInfo.role_name}</b></span>
                                        </div>
                                    }
                                    type="info"
                                    showIcon
                                    icon={<LockOutlined />}
                                />
                            )}
                        </div>
                    )}
                </Modal>
            </div>
        </MainPage>
    );
}

export default EmployeePage;
