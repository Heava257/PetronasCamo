import { useEffect, useState } from "react";
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
} from "antd";
import { isPermission, request } from "../../util/helper";
import { MdDelete, MdEdit, MdOutlineCreateNewFolder } from "react-icons/md";
import MainPage from "../../component/layout/MainPage";
import dayjs from "dayjs";
import { FiSearch } from "react-icons/fi";
import { configStore } from "../../store/configStore";
import { useTranslation } from "../../locales/TranslationContext";
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
        Modal.confirm({
            title: t("លុប"),
            content: t("Are you sure to remove?"),
            okText: t("យល់ព្រម"),
            onOk: async () => {
                const res = await request(`expense/${data.id}`, "delete");
                if (res && !res.error) {
                    message.success(res.message);
                    const newList = list.filter((item) => item.id !== data.id);
                    setList(newList);
                } else {
                    message.error(res?.message || "Failed to delete expense.");
                }
            },
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
            message.success(res.message);
            getList();
            onCloseModal();
        } else {
            message.error(res?.message || "Failed to save expense.");
        }
    };

    return (
        <MainPage loading={loading}>
            <div className="pageHeader">
                <Space>
                    <div>{t("Expense Management")}</div>
                    <Input.Search
                        onChange={(e) =>
                            setState((p) => ({ ...p, txtSearch: e.target.value }))
                        }
                        allowClear
                        onSearch={getList}
                        placeholder={t("Search")}
                    />
                    <Button type="primary" onClick={getList} icon={<FiSearch />}>
                        {t("Filter")}
                    </Button>
                </Space>
                <Button 
                    type="primary" 
                    onClick={onClickAddBtn} 
                    icon={<MdOutlineCreateNewFolder />}
                >
                    {t("NEW")}
                </Button>
            </div>

            <Modal
                open={state.visibleModal}
                title={t(formRef.getFieldValue("id") ? "កែសម្រួលចំណាយ" : "ចំណាយថ្មី")}
                footer={null}
                onCancel={onCloseModal}
            >
                <Form layout="vertical" onFinish={onFinish} form={formRef}>
                    {/* Hidden ID Field */}
                    <Form.Item name="id" hidden>
                        <Input />
                    </Form.Item>

                    {/* Expense Type */}
                    <Form.Item
                        name="expense_type_id"
                        label={t("ប្រភេទនៃការចំណាយ")}
                        rules={[{ required: true, message: t("Expense Type is required") }]}
                    >
                        <Select 
                            options={config.expense_type} 
                            placeholder={t("ជ្រើសរើសប្រភេទចំណាយ")} 
                        />
                    </Form.Item>

                    {/* Reference Number */}
                    <Form.Item
                        name="ref_no"
                        label={t("លេខយោង")}
                        rules={[{ required: true, message: t("Reference Number is required") }]}
                    >
                        <Input placeholder={t("បញ្ចូលលេខយោង")} />
                    </Form.Item>

                    {/* Name */}
                    <Form.Item
                        name="name"
                        label={t("ឈ្មោះ")}
                        rules={[{ required: true, message: t("Name is required") }]}
                    >
                        <Input placeholder={t("បញ្ចូលឈ្មោះចំណាយ")} />
                    </Form.Item>

                    {/* Amount */}
                    <Form.Item
                        name="amount"
                        label={t("ចំនួនទឹកប្រាក់")}
                        rules={[{ required: true, message: t("Amount is required") }]}
                    >
                        <InputNumber 
                            style={{ width: "100%" }} 
                            placeholder={t("បញ្ចូលចំនួន")} 
                            min={0} 
                        />
                    </Form.Item>

                    {/* Remark */}
                    <Form.Item name="remark" label={t("ផ្សេងៗ")}>
                        <Input.TextArea placeholder={t("បញ្ចូលព័ត៌មានបន្ថែម")} />
                    </Form.Item>

                    {/* Expense Date */}
                    <Form.Item
                        name="expense_date"
                        label={t("កាលបរិច្ឆេទចំណាយ")}
                        rules={[{ required: true, message: t("Expense Date is required") }]}
                    >
                        <DatePicker 
                            style={{ width: "100%" }} 
                            format="YYYY-MM-DD" 
                            placeholder={t("ជ្រើសរើសកាលបរិច្ឆេទ")} 
                        />
                    </Form.Item>

                    {/* Buttons */}
                    <Space>
                        <Button onClick={onCloseModal}>
                            {t("បោះបង់")}
                        </Button>
                        <Button type="primary" htmlType="submit">
                            {t(formRef.getFieldValue("id") ? "កែសម្រួល" : "រក្សាទុក")}
                        </Button>
                    </Space>
                </Form>
            </Modal>

            <Table
                rowClassName={() => "pos-row"}
                dataSource={list}
                columns={[
                    {
                        key: "no",
                        title: t("ល.រ"),
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
                            return !isNaN(numericValue) ? `$${numericValue.toFixed(2)}` : "N/A";
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
                        render: (value) => dayjs(value).format("YYYY-MM-DD h:mm A"),
                    },
                    {
                        key: "action",
                        title: t("Action"),
                        align: "center",
                        render: (_, record) => (
                            <Space>
                                {isPermission("customer.getone") && (
                                    <Button
                                        type="primary"
                                        icon={<MdEdit />}
                                        onClick={() => onClickEdit(record)}
                                    />
                                )}
                                {isPermission("customer.getone") && (
                                    <Button
                                        type="primary"
                                        danger
                                        icon={<MdDelete />}
                                        onClick={() => onClickDelete(record)}
                                    />
                                )}
                            </Space>
                        ),
                    },
                ]}
            />
        </MainPage>
    );
}

export default ExpansePage;