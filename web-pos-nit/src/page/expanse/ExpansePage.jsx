import { useEffect, useState, useMemo } from "react";
import {
    Button,
    Form,
    Input,
    InputNumber,
    message,
    Modal,
    Select,
    Space,
    Table,
    DatePicker,
    Card,
    Typography,
    Row,
    Col,
    Statistic,
} from "antd";
import Swal from "sweetalert2";
import { isPermission, request } from "../../util/helper";
import { MdDelete, MdEdit, MdOutlineCreateNewFolder } from "react-icons/md";
import { EyeOutlined, DollarOutlined, CalendarOutlined } from '@ant-design/icons';
import MainPage from "../../component/layout/MainPage";
import dayjs from "dayjs";
import { FiSearch } from "react-icons/fi";
import { configStore } from "../../store/configStore";
import { useTranslation } from "../../locales/TranslationContext";

const { Text, Title } = Typography;

function ExpansePage() {
    const [formRef] = Form.useForm();
    const { config } = configStore();
    const { t } = useTranslation();

    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [state, setState] = useState({
        visibleModal: false,
        id: null,
        txtSearch: "",
    });
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

    useEffect(() => {
        getList();
    }, []);

    const getList = async () => {
        setLoading(true);
        const param = {
            txtSearch: state.txtSearch,
        };
        const res = await request("expense", "get", param);
        setLoading(false);
        if (res && !res.error) {
            setList(res.list || []);
        }
    };

    const onClickEdit = (data) => {
        setState({
            ...state,
            visibleModal: true,
            id: data.id,
        });
        formRef.setFieldsValue({
            id: data.id,
            expense_type_id: data.expense_type_id,
            ref_no: data.ref_no,
            name: data.name,
            amount: data.amount,
            remark: data.remark,
            expense_date: dayjs(data.expense_date),
        });
    };

    const onClickDelete = async (data) => {
        Swal.fire({
            title: t("លុប"),
            text: t("Are you sure to remove?"),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: t("យល់ព្រម"),
            cancelButtonText: t("បោះបង់")
        }).then(async (result) => {
            if (result.isConfirmed) {
                const res = await request(`expense/${data.id}`, "delete");
                if (res && !res.error) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: res.message,
                        showConfirmButton: false,
                        timer: 1500
                    });
                    const newList = list.filter((item) => item.id !== data.id);
                    setList(newList);
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: res?.message || "Failed to delete expense.",
                    });
                }
            }
        });
    };

    const onClickAddBtn = () => {
        setState({
            ...state,
            visibleModal: true,
            id: null,
        });
        formRef.resetFields();
    };

    const onCloseModal = () => {
        formRef.resetFields();
        setState({
            ...state,
            visibleModal: false,
            id: null,
        });
    };

    const onFinish = async (values) => {
        const data = {
            id: formRef.getFieldValue("id"),
            expense_type_id: values.expense_type_id,
            ref_no: values.ref_no,
            name: values.name,
            amount: values.amount,
            remark: values.remark,
            expense_date: values.expense_date?.format("YYYY-MM-DD"),
        };
        const method = formRef.getFieldValue("id") ? "put" : "post";
        const url = formRef.getFieldValue("id") ? `expense/${data.id}` : "expense";

        const res = await request(url, method, data);
        if (res && !res.error) {
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: res.message,
                showConfirmButton: false,
                timer: 1500
            });
            getList();
            onCloseModal();
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: res?.message || "Failed to save expense.",
            });
        }
    };

    const showDetailModal = (expense) => {
        setSelectedExpense(expense);
        setIsDetailModalVisible(true);
    };

    const handleDetailModalClose = () => {
        setIsDetailModalVisible(false);
        setSelectedExpense(null);
    };

    // Filter data based on search
    const filteredList = list.filter(expense => {
        const searchLower = state.txtSearch.toLowerCase();
        return (
            expense.name?.toLowerCase().includes(searchLower) ||
            expense.ref_no?.toLowerCase().includes(searchLower) ||
            expense.expense_type_name?.toLowerCase().includes(searchLower) ||
            expense.remark?.toLowerCase().includes(searchLower)
        );
    });

    // Calculate statistics
    const statistics = useMemo(() => {
        const totalAmount = filteredList.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
        const expensesByType = {};

        filteredList.forEach(expense => {
            const type = expense.expense_type_name || 'Other';
            if (!expensesByType[type]) {
                expensesByType[type] = {
                    count: 0,
                    total: 0
                };
            }
            expensesByType[type].count += 1;
            expensesByType[type].total += parseFloat(expense.amount || 0);
        });

        return {
            totalAmount,
            totalCount: filteredList.length,
            expensesByType,
            averageAmount: filteredList.length > 0 ? totalAmount / filteredList.length : 0
        };
    }, [filteredList]);

    // Mobile Expense Card Component
    const ExpenseMobileCard = ({ expense, index }) => {
        return (
            <Card
                className="mb-3 shadow-sm hover:shadow-md transition-shadow duration-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                bodyStyle={{ padding: '16px' }}
            >
                <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                #{index + 1}
                            </span>
                            <span className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
                                {expense.ref_no}
                            </span>
                        </div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                            {expense.name}
                        </h3>
                        <span className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                            {expense.expense_type_name}
                        </span>
                    </div>
                    <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => showDetailModal(expense)}
                        className="text-blue-500 dark:text-blue-400"
                    />
                </div>

                <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <DollarOutlined className="text-green-600 dark:text-green-400" />
                            <span className="text-sm text-gray-500 dark:text-gray-400">{t("Amount")}</span>
                        </div>
                        <span className="text-lg font-bold text-green-600 dark:text-green-400">
                            ${parseFloat(expense.amount || 0).toFixed(2)}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                        <CalendarOutlined className="text-gray-500 dark:text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">
                            {dayjs(expense.create_at).format("DD/MM/YYYY")}
                        </span>
                    </div>

                    {expense.remark && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {expense.remark}
                        </div>
                    )}
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                    {isPermission("expanse.update") && (
                        <Button
                            type="primary"
                            size="small"
                            icon={<MdEdit />}
                            onClick={() => onClickEdit(expense)}
                            className="flex-1 bg-blue-500 hover:bg-blue-600"
                        >
                            {t("EDIT")}
                        </Button>
                    )}
                    {isPermission("expanse.remove") && (
                        <Button
                            danger
                            size="small"
                            icon={<MdDelete />}
                            onClick={() => onClickDelete(expense)}
                            className="flex-1"
                        >
                            {t("DELETE")}
                        </Button>
                    )}
                </div>
            </Card>
        );
    };

    const columns = [
        {
            key: "no",
            title: t("ល.រ"),
            width: 60,
            render: (_, __, index) => index + 1,
        },
        {
            key: "expense_type_name",
            title: t("Expense Type"),
            dataIndex: "expense_type_name",
        },
        {
            key: "ref_no",
            title: t("Reference Number"),
            dataIndex: "ref_no",
        },
        {
            key: "name",
            title: t("Name"),
            dataIndex: "name",
        },
        {
            key: "amount",
            title: t("Amount"),
            dataIndex: "amount",
            render: (value) => {
                const numericValue = parseFloat(value);
                return !isNaN(numericValue) ? (
                    <span className="font-semibold text-green-600 dark:text-green-400">
                        ${numericValue.toFixed(2)}
                    </span>
                ) : "N/A";
            },
        },
        {
            key: "remark",
            title: t("Remark"),
            dataIndex: "remark",
        },
        {
            key: "expense_date",
            title: t("Expense Date"),
            dataIndex: "create_at",
            render: (value) => dayjs(value).format("DD/MM/YYYY h:mm A"),
        },
        {
            key: "action",
            title: t("Action"),
            align: "center",
            width: 150,
            render: (_, record) => (
                <Space>
                    {isPermission("expanse.update") && (
                        <Button
                            type="primary"
                            size="small"
                            icon={<MdEdit />}
                            onClick={() => onClickEdit(record)}
                        />
                    )}
                    {isPermission("expanse.remove") && (
                        <Button
                            type="primary"
                            danger
                            size="small"
                            icon={<MdDelete />}
                            onClick={() => onClickDelete(record)}
                        />
                    )}
                </Space>
            ),
        },
    ];

    return (
        <MainPage loading={loading}>
            <div className="expanse-page-container px-2 sm:px-4 lg:px-6">
                {/* Header Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        {/* Title and Search */}
                        <div className="flex-1">
                            <Title level={4} className="mb-3 lg:mb-2 text-gray-900 dark:text-white">
                                {t("Expense Management")}
                            </Title>
                            <Space direction="vertical" size="middle" className="w-full lg:w-auto">
                                <Space wrap className="w-full">
                                    <Input.Search
                                        onChange={(e) =>
                                            setState((p) => ({ ...p, txtSearch: e.target.value }))
                                        }
                                        allowClear
                                        onSearch={getList}
                                        placeholder={t("Search")}
                                        size="large"
                                        className="w-full sm:w-64"
                                    />
                                    <Button
                                        type="primary"
                                        onClick={getList}
                                        icon={<FiSearch />}
                                        size="large"
                                        className="bg-blue-500 hover:bg-blue-600"
                                    >
                                        {t("Filter")}
                                    </Button>
                                </Space>
                            </Space>
                        </div>

                        {/* New Button */}
                        {isPermission("expanse.create") && (
                            <Button
                                type="primary"
                                onClick={onClickAddBtn}
                                icon={<MdOutlineCreateNewFolder />}
                                size="large"
                                className="w-full lg:w-auto bg-green-500 hover:bg-green-600"
                            >
                                {t("NEW")}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border-0">
                        <Statistic
                            title={<span className="text-gray-700 dark:text-gray-300">{t("Total Expenses")}</span>}
                            value={statistics.totalCount}
                            valueStyle={{
                                color: '#1e40af',
                                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                                fontWeight: 'bold'
                            }}
                        />
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border-0">
                        <Statistic
                            title={<span className="text-gray-700 dark:text-gray-300">{t("Total Amount")}</span>}
                            value={statistics.totalAmount}
                            precision={2}
                            prefix="$"
                            valueStyle={{
                                color: '#15803d',
                                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                                fontWeight: 'bold'
                            }}
                        />
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 border-0">
                        <Statistic
                            title={<span className="text-gray-700 dark:text-gray-300">{t("Average Amount")}</span>}
                            value={statistics.averageAmount}
                            precision={2}
                            prefix="$"
                            valueStyle={{
                                color: '#7e22ce',
                                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                                fontWeight: 'bold'
                            }}
                        />
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 border-0">
                        <Statistic
                            title={<span className="text-gray-700 dark:text-gray-300">{t("Expense Types")}</span>}
                            value={Object.keys(statistics.expensesByType).length}
                            valueStyle={{
                                color: '#c2410c',
                                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                                fontWeight: 'bold'
                            }}
                        />
                    </Card>
                </div>

                {/* Expenses by Type */}
                {Object.keys(statistics.expensesByType).length > 0 && (
                    <Card className="mb-4 bg-white dark:bg-gray-800">
                        <Title level={5} className="mb-4 text-gray-900 dark:text-white">
                            {t("Expenses by Type")}
                        </Title>
                        <Row gutter={[16, 16]}>
                            {Object.entries(statistics.expensesByType).map(([type, data]) => (
                                <Col xs={24} sm={12} md={8} lg={6} key={type}>
                                    <Card
                                        size="small"
                                        className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                                    >
                                        <div className="text-center">
                                            <Text strong className="block text-sm mb-2 text-gray-900 dark:text-white">
                                                {type}
                                            </Text>
                                            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                                                ${data.total.toFixed(2)}
                                            </div>
                                            <Text type="secondary" className="text-xs">
                                                {data.count} {t("items")}
                                            </Text>
                                        </div>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </Card>
                )}

                {/* Form Modal */}
                <Modal
                    open={state.visibleModal}
                    title={
                        <span className="text-base sm:text-lg font-semibold">
                            {t(formRef.getFieldValue("id") ? "កែសម្រួលចំណាយ" : "ចំណាយថ្មី")}
                        </span>
                    }
                    footer={null}
                    onCancel={onCloseModal}
                    width="95%"
                    style={{ maxWidth: '600px', top: 20 }}
                >
                    <Form layout="vertical" onFinish={onFinish} form={formRef}>
                        <Form.Item name="id" hidden>
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="expense_type_id"
                            label={<span className="font-medium">{t("ប្រភេទនៃការចំណាយ")}</span>}
                            rules={[{ required: true, message: t("Expense Type is required") }]}
                        >
                            <Select
                                options={config.expense_type}
                                placeholder={t("ជ្រើសរើសប្រភេទចំណាយ")}
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item
                            name="ref_no"
                            label={<span className="font-medium">{t("លេខយោង")}</span>}
                            rules={[{ required: true, message: t("Reference Number is required") }]}
                        >
                            <Input placeholder={t("បញ្ចូលលេខយោង")} size="large" />
                        </Form.Item>

                        <Form.Item
                            name="name"
                            label={<span className="font-medium">{t("ឈ្មោះ")}</span>}
                            rules={[{ required: true, message: t("Name is required") }]}
                        >
                            <Input placeholder={t("បញ្ចូលឈ្មោះចំណាយ")} size="large" />
                        </Form.Item>

                        <Form.Item
                            name="amount"
                            label={<span className="font-medium">{t("ចំនួនទឹកប្រាក់")}</span>}
                            rules={[{ required: true, message: t("Amount is required") }]}
                        >
                            <InputNumber
                                style={{ width: "100%" }}
                                placeholder={t("បញ្ចូលចំនួន")}
                                min={0}
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item
                            name="remark"
                            label={<span className="font-medium">{t("ផ្សេងៗ")}</span>}
                        >
                            <Input.TextArea
                                placeholder={t("បញ្ចូលព័ត៌មានបន្ថែម")}
                                rows={4}
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item
                            name="expense_date"
                            label={<span className="font-medium">{t("កាលបរិច្ឆេទចំណាយ")}</span>}
                            rules={[{ required: true, message: t("Expense Date is required") }]}
                        >
                            <DatePicker
                                style={{ width: "100%" }}
                                format="YYYY-MM-DD"
                                placeholder={t("ជ្រើសរើសកាលបរិច្ឆេទ")}
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item className="mb-0">
                            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                                <Button onClick={onCloseModal} size="large" block className="sm:w-auto">
                                    {t("បោះបង់")}
                                </Button>
                                <Button type="primary" htmlType="submit" size="large" block className="sm:w-auto">
                                    {t(formRef.getFieldValue("id") ? "កែសម្រួល" : "រក្សាទុក")}
                                </Button>
                            </div>
                        </Form.Item>
                    </Form>
                </Modal>

                {/* Detail Modal for Mobile */}
                <Modal
                    open={isDetailModalVisible}
                    title={
                        <span className="text-base sm:text-lg font-semibold">
                            {t("Expense Details")}
                        </span>
                    }
                    onCancel={handleDetailModalClose}
                    footer={null}
                    width="95%"
                    style={{ maxWidth: '500px', top: 20 }}
                >
                    {selectedExpense && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <Text className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                                        {t("Reference Number")}
                                    </Text>
                                    <span className="inline-block px-3 py-1 text-sm font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
                                        {selectedExpense.ref_no}
                                    </span>
                                </div>

                                <div>
                                    <Text className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                                        {t("Name")}
                                    </Text>
                                    <Text className="text-base font-semibold text-gray-900 dark:text-white block">
                                        {selectedExpense.name}
                                    </Text>
                                </div>

                                <div>
                                    <Text className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                                        {t("Expense Type")}
                                    </Text>
                                    <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                                        {selectedExpense.expense_type_name}
                                    </span>
                                </div>

                                <div>
                                    <Text className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                                        {t("Amount")}
                                    </Text>
                                    <Text className="text-2xl font-bold text-green-600 dark:text-green-400 block">
                                        ${parseFloat(selectedExpense.amount || 0).toFixed(2)}
                                    </Text>
                                </div>

                                {selectedExpense.remark && (
                                    <div>
                                        <Text className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                                            {t("Remark")}
                                        </Text>
                                        <Text className="text-base text-gray-900 dark:text-white block">
                                            {selectedExpense.remark}
                                        </Text>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <Text className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                                        {t("Expense Date")}
                                    </Text>
                                    <Text className="text-base font-medium text-gray-900 dark:text-white block">
                                        {dayjs(selectedExpense.create_at).format("DD/MM/YYYY h:mm A")}
                                    </Text>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                {isPermission("expanse.update") && (
                                    <Button
                                        type="primary"
                                        icon={<MdEdit />}
                                        onClick={() => {
                                            handleDetailModalClose();
                                            onClickEdit(selectedExpense);
                                        }}
                                        block
                                        size="large"
                                    >
                                        {t("EDIT")}
                                    </Button>
                                )}
                                {isPermission("expanse.remove") && (
                                    <Button
                                        danger
                                        icon={<MdDelete />}
                                        onClick={() => {
                                            handleDetailModalClose();
                                            onClickDelete(selectedExpense);
                                        }}
                                        block
                                        size="large"
                                    >
                                        {t("DELETE")}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </Modal>

                {/* Desktop Table View */}
                <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                    <Table
                        rowClassName={(record, index) =>
                            `pos-row ${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'}`
                        }
                        dataSource={filteredList}
                        columns={columns}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showTotal: (total) => `${t("Total")} ${total} ${t("items")}`,
                        }}
                        scroll={{ x: true }}
                        rowKey="id"
                    />
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden">
                    {filteredList.length > 0 ? (
                        <div className="space-y-3">
                            {filteredList.map((expense, index) => (
                                <ExpenseMobileCard
                                    key={expense.id}
                                    expense={expense}
                                    index={index}
                                />
                            ))}
                        </div>
                    ) : (
                        <Card className="text-center py-8 bg-white dark:bg-gray-800">
                            <Text className="text-gray-500 dark:text-gray-400">
                                {t("No data available")}
                            </Text>
                        </Card>
                    )}
                </div>
            </div>

            <style>{`
                .pos-row {
                    transition: background-color 0.2s;
                }
                .pos-row:hover {
                    background-color: rgba(59, 130, 246, 0.1) !important;
                }
                .dark .pos-row:hover {
                    background-color: rgba(59, 130, 246, 0.2) !important;
                }
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </MainPage>
    );
}

export default ExpansePage;