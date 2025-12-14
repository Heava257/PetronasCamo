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
    Tag
} from "antd";
import { formatDateClient, formatDateServer, request } from "../../util/helper";
import * as XLSX from 'xlsx/xlsx.mjs';
import { MdDelete, MdEdit, MdNewLabel } from "react-icons/md";
import MainPage from "../../component/layout/MainPage";
import { FiSearch } from "react-icons/fi";
import { IoBook } from "react-icons/io5";
import { useTranslation } from '../../locales/TranslationContext'; 

function EmployeePage() {
    const { t } = useTranslation(); // ✅ Use translation
    const [formRef] = Form.useForm();
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
        const res = await request("employee", "get", param);
        setLoading(false);
        if (res) {
            setList(res.list);
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
            status: data.status,
        });
    };

    const onClickDelete = async (data) => {
        Modal.confirm({
            title: t('delete'),
            content: t('delete_confirm'),
            okText: t('yes'),
            cancelText: t('no_cancel'),
            onOk: async () => {
                const res = await request("employee", "delete", {
                    id: data.id,
                });
                if (res && !res.error) {
                    message.success(res.message);
                    const newList = list.filter((item) => item.id !== data.id);
                    setList(newList);
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
        // Check if email already exists
        const isEmailExist = list.some(
            (employee) => employee.email === values.email && employee.id !== state.id
        );

        if (isEmailExist) {
            message.error(t('email_exists'));
            return;
        }

        // Check if telephone number already exists
        const isTelExist = list.some(
            (employee) => employee.tel === values.tel && employee.id !== state.id
        );

        if (isTelExist) {
            message.error(t('tel_exists'));
            return;
        }

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
            status: values.status,
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

        const hideLoadingMessage = message.loading(t('please_wait'), 0);

        setTimeout(() => {
            try {
                const data = list.map((item) => ({
                    ...item,
                    create_at: formatDateClient(item.create_at),
                }));

                const ws = XLSX.utils.json_to_sheet(data);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Employee");

                XLSX.writeFile(wb, "Employee_Data.xlsx");

                hideLoadingMessage();
                message.success(t('export_success'));
            } catch (error) {
                hideLoadingMessage();
                message.error(t('export_failed'));
                console.error("Export error:", error);
            }
        }, 2000);
    };

    return (
        <MainPage loading={loading}>
            <div className="pageHeader">
                <Space>
                    <div>{t('manage_employee')}</div>
                    <Input.Search
                        onChange={(e) =>
                            setState((prev) => ({ ...prev, txtSearch: e.target.value }))
                        }
                        allowClear
                        onSearch={getList}
                        placeholder={t('search_by_name')}
                    />
                    <Button type="primary" onClick={getList} icon={<FiSearch />}>
                        {t('filter')}
                    </Button>
                    <Button type="primary" onClick={ExportToExcel} icon={<IoBook />}>
                        {t('export_excel')}
                    </Button>
                </Space>
                <Button type="primary" onClick={onClickAddBtn} icon={<MdNewLabel />}>
                    {t('new')}
                </Button>
            </div>
            <Modal
                open={state.visibleModal}
                title={state.id ? t('edit_employee') : t('new_employee')}
                footer={null}
                onCancel={onCloseModal}
            >
                <Form layout="vertical" onFinish={onFinish} form={formRef}>
                    <Form.Item name="id" hidden>
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="name"
                        label={t('employee_name')}
                        rules={[{ required: true, message: t('input_name') }]}
                    >
                        <Input placeholder={t('input_name')} />
                    </Form.Item>


                    <Form.Item
                        name="gender"
                        label={t('gender')}
                        rules={[{ required: true, message: t('select_gender') }]}
                    >
                        <Select
                            placeholder={t('select_gender')}
                            options={[
                                { label: t('male'), value: 'Male' },
                                { label: t('female'), value: 'Female' },
                            ]}
                        />
                    </Form.Item>


                    <Form.Item name="code" label={t('code')}>
                        <Input placeholder={t('code')} />
                    </Form.Item>

                    <Form.Item
                        name="position"
                        label={t('position')}
                        rules={[{ required: true, message: t('input_position') }]}
                    >
                        <Input placeholder={t('input_position')} />
                    </Form.Item>

                    <Form.Item
                        name="salary"
                        label={t('salary')}
                        rules={[{ required: true, message: t('input_salary') }]}
                    >
                        <Input type="number" placeholder={t('input_salary')} />
                    </Form.Item>

                    <Form.Item
                        name="tel"
                        label={t('telephone')}
                        rules={[{ required: true, message: t('input_telephone') }]}
                    >
                        <Input placeholder={t('input_telephone')} />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label={t('email')}
                        rules={[{ type: "email", message: t('valid_email') }]}
                    >
                        <Input placeholder={t('email')} />
                    </Form.Item>

                    <Form.Item name="address" label={t('address')}>
                        <Input.TextArea placeholder={t('address')} />
                    </Form.Item>

                    <Form.Item name="website" label={t('website')}>
                        <Input placeholder={t('website')} />
                    </Form.Item>

                    <Form.Item name="note" label={t('note')}>
                        <Input.TextArea placeholder={t('note')} />
                    </Form.Item>

                    <Form.Item
                        name="status"
                        label={t('status')}
                        rules={[{ required: true, message: t('select_status') }]}
                    >
                        <Select
                            placeholder={t('select_status')}
                            options={[
                                { label: t('active'), value: 1 },
                                { label: t('inactive'), value: 0 },
                            ]}
                        />
                    </Form.Item>

                    <Space>
                        <Button onClick={onCloseModal}>
                            {t('cancel')}
                        </Button>
                        <Button type="primary" htmlType="submit">
                            {state.id ? t('edit') : t('save')}
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
                        title: t('no'),
                        render: (_, __, index) => index + 1,
                    },
                    {
                        key: "name",
                        title: t('employee_name'),
                        dataIndex: "name",
                        sorter: (a, b) => a.name.localeCompare(b.name),
                    },
                    {
                        key: "gender",
                        title: t('gender'),
                        dataIndex: "gender",
                        render: (gender) => {
                            if (gender === "Male") {
                                return t('male');
                            } else if (gender === "Female") {
                                return t('female');
                            }
                            return gender;
                        },
                    },
                    {
                        key: "position",
                        title: t('position'),
                        dataIndex: "position",
                    },
                    {
                        key: "salary",
                        title: t('salary'),
                        dataIndex: "salary",
                        render: (value) => `$${value}`,
                    },
                    {
                        key: "tel",
                        title: t('telephone'),
                        dataIndex: "tel",
                    },
                    {
                        key: "email",
                        title: t('email'),
                        dataIndex: "email",
                    },
                    {
                        key: "address",
                        title: t('address'),
                        dataIndex: "address",
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
                    },
                    {
                        key: "create_at",
                        title: t('created_date'),
                        dataIndex: "create_at",
                        render: (value) => formatDateServer(value, "YYYY-MM-DD h:mm A"),
                    },
                    {
                        key: "action",
                        title: t('action'),
                        align: "center",
                        render: (_, record) => (
                            <Space>
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
        </MainPage>
    );
}

export default EmployeePage;