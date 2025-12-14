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
import { request,isPermission } from "../../util/helper";
import { MdDelete, MdEdit, MdOutlineCreateNewFolder } from "react-icons/md";
import MainPage from "../../component/layout/MainPage";
import dayjs from "dayjs";
import { FiSearch } from "react-icons/fi";
import { configStore } from "../../store/configStore";
// import { configStore } from "../../store/configStore";
function ExpansePage() {
    const [formRef] = Form.useForm();
    const { config } = configStore();
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
            title: "លុប",
            content: "Are you sure to remove?",
            okText: "យល់ព្រម",
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
        console.log("Request URL:", url);
        console.log("Request Method:", method);
        console.log("Request Payload:", data);
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
                    <div>Expense Management</div>
                    <Input.Search
                        onChange={(e) =>
                            setState((p) => ({ ...p, txtSearch: e.target.value }))
                        }
                        allowClear
                        onSearch={getList}
                        placeholder="Search"
                    />
                    <Button type="primary" onClick={getList} icon={<FiSearch />}>
                        Filter
                    </Button>
                </Space>
                <Button type="primary" onClick={onClickAddBtn} icon={<MdOutlineCreateNewFolder />}>
                    NEW
                </Button>
            </div>
            <Modal
                open={state.visibleModal}
                title={
                    <div>
                        <div className="khmer-text">
                            {formRef.getFieldValue("id") ? "កែសម្រួលចំណាយ" : "ចំណាយថ្មី"}
                        </div>

                    </div>
                }
                footer={null}
                onCancel={onCloseModal}
            ><Form layout="vertical" onFinish={onFinish} form={formRef}>
                    {/* Hidden ID Field */}
                    <Form.Item name="id" hidden>
                        <Input />
                    </Form.Item>

                    {/* Expense Type */}
                    <Form.Item
                        name="expense_type_id"
                        label={<div className="khmer-text">ប្រភេទនៃការចំណាយ</div>}
                        rules={[{ required: true, message: "Expense Type is required" }]}
                    >
                        <Select options={config.expense_type} placeholder="ជ្រើសរើសប្រភេទចំណាយ" />
                    </Form.Item>

                    {/* Reference Number */}
                    <Form.Item
                        name="ref_no"
                        label={<div className="khmer-text">លេខយោង</div>}
                        rules={[{ required: true, message: "Reference Number is required" }]}
                    >
                        <Input placeholder="បញ្ចូលលេខយោង" />
                    </Form.Item>

                    {/* Name */}
                    <Form.Item
                        name="name"
                        label={<div className="khmer-text">ឈ្មោះ</div>}
                        rules={[{ required: true, message: "Name is required" }]}
                    >
                        <Input placeholder="បញ្ចូលឈ្មោះចំណាយ" />
                    </Form.Item>

                    {/* Amount */}
                    <Form.Item
                        name="amount"
                        label={<div className="khmer-text">ចំនួនទឹកប្រាក់</div>}
                        rules={[{ required: true, message: "Amount is required" }]}
                    >
                        <InputNumber style={{ width: "100%" }} placeholder="បញ្ចូលចំនួន" min={0} />
                    </Form.Item>

                    {/* Remark */}
                    <Form.Item name="remark" label={<div className="khmer-text">ផ្សេងៗ</div>}>
                        <Input.TextArea placeholder="បញ្ចូលព័ត៌មានបន្ថែម" />
                    </Form.Item>

                    {/* Expense Date */}
                    <Form.Item
                        name="expense_date"
                        label={<div className="khmer-text">កាលបរិច្ឆេទចំណាយ</div>}
                        rules={[{ required: true, message: "Expense Date is required" }]}
                    >
                        <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" placeholder="ជ្រើសរើសកាលបរិច្ឆេទ" />
                    </Form.Item>

                    {/* Buttons */}
                    <Space>
                        <Button onClick={onCloseModal}>
                            <div className="khmer-text">បោះបង់</div>
                        </Button>
                        <Button type="primary" htmlType="submit">
                            <div className="khmer-text">
                                {formRef.getFieldValue("id") ? "កែសម្រួល" : "រក្សាទុក"}
                            </div>
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
                        title: (
                            <div>
                                <div className="khmer-text">ល.រ</div>
                                <div className="english-text">No</div>
                            </div>
                        ),
                        render: (_, __, index) => index + 1,
                    },
                    {
                        key: "expense_type_name",
                        title: (
                            <div>
                                <div className="khmer-text">ប្រភេទចំណាយ</div>
                                <div className="english-text">Expense Type</div>
                            </div>
                        ),
                        dataIndex: "expense_type_name", // Corrected field name
                    },

                    {
                        key: "ref_no",
                        title: (
                            <div>
                                <div className="khmer-text">លេខយោង</div>
                                <div className="english-text">Reference Number</div>
                            </div>
                        ),
                        dataIndex: "ref_no",
                    },
                    {
                        key: "name",
                        title: (
                            <div>
                                <div className="khmer-text">ឈ្មោះ</div>
                                <div className="english-text">Name</div>
                            </div>
                        ),
                        dataIndex: "name",
                    },
                    {
                        key: "amount",
                        title: (
                            <div>
                                <div className="khmer-text">ចំនួនទឹកប្រាក់</div>
                                <div className="english-text">Amount</div>
                            </div>
                        ),
                        dataIndex: "amount",
                        render: (value) => {
                            const numericValue = parseFloat(value);
                            return !isNaN(numericValue) ? `$${numericValue.toFixed(2)}` : "N/A";
                        },
                    },
                    {
                        key: "remark",
                        title: (
                            <div>
                                <div className="khmer-text">ផ្សេងៗ</div>
                                <div className="english-text">Remark</div>
                            </div>
                        ),
                        dataIndex: "remark",
                    },
                    {
                        key: "expense_date",
                        title: (
                            <div>
                                <div className="khmer-text">កាលបរិច្ឆេទចំណាយ</div>
                                <div className="english-text">Expense Date</div>
                            </div>
                        ),
                        dataIndex: "create_at",
                        render: (value) => dayjs(value).format("YYYY-MM-DD h:mm A"), // Format date
                    },
                    {
                        key: "action",
                        title: (
                            <div>
                                <div className="khmer-text">សកម្មភាព</div>
                                <div className="english-text">Action</div>
                            </div>
                        ),
                        align: "center",
                        render: (_, record) => (
                            <Space>
                                {isPermission("customer.getone")&&(
                                <Button
                                    type="primary"
                                    icon={<MdEdit />}
                                    onClick={() => onClickEdit(record)}
                                />
                                )}
                                {isPermission("customer.getone")&&(
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


