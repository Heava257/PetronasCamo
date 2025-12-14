import { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Space,
  Table,
} from "antd";
import { isPermission, request } from "../../util/helper";
import { MdDelete, MdEdit, MdOutlineCreateNewFolder } from "react-icons/md";
import MainPage from "../../component/layout/MainPage";
import { FiSearch } from "react-icons/fi";
import { useTranslation } from "../../locales/TranslationContext";

function ExpanseTypePage() {
  const [formRef] = Form.useForm();
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
    const res = await request("expense_type", "get", param);
    setLoading(false);
    if (res && res.success) {
      setList(res.data || []);
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
      code: data.code,
    });
  };

  const onClickDelete = async (data) => {
    Modal.confirm({
      title: t("Delete"),
      content: t("Are you sure to remove?"),
      okText: t("Confirm"),
      onOk: async () => {
        const res = await request(`expense_type/${data.id}`, "delete");
        if (res && res.success) {
          message.success(res.message);
          const newList = list.filter((item) => item.id !== data.id);
          setList(newList);
        } else {
          message.error(res?.message || "Failed to delete expense type.");
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
      name: values.name,
      code: values.code,
    };

    const method = formRef.getFieldValue("id") ? "put" : "post";
    const endpoint = formRef.getFieldValue("id")
      ? `expense_type/${formRef.getFieldValue("id")}`
      : "expense_type";

    const res = await request(endpoint, method, data);

    if (res && res.success) {
      message.success(res.message);
      getList();
      onCloseModal();
    } else {
      message.error(res?.message || "Failed to save expense type.");
    }
  };

  return (
    <MainPage loading={loading}>
      <div className="pageHeader">
        <Space>
          <div>{t("Expense Type Management")}</div>
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
        title={t(formRef.getFieldValue("id") ? "Edit Expense Type" : "New Expense Type")}
        footer={null}
        onCancel={onCloseModal}
      >
        <Form layout="vertical" onFinish={onFinish} form={formRef}>
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          
          <Form.Item
            name="name"
            label={t("Name")}
            rules={[{ required: true, message: t("Name is required") }]}
          >
            <Input placeholder={t("Enter Name")} />
          </Form.Item>
          
          <Form.Item
            name="code"
            label={t("Code")}
            rules={[{ required: true, message: t("Code is required") }]}
          >
            <Input placeholder={t("Enter Code")} />
          </Form.Item>
          
          <Space>
            <Button onClick={onCloseModal}>
              {t("Cancel")}
            </Button>
            <Button type="primary" htmlType="submit">
              {t(formRef.getFieldValue("id") ? "Update" : "Save")}
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
            title: t("No"),
            render: (_, __, index) => index + 1,
          },
          {
            key: "name",
            title: t("Name"),
            dataIndex: "name",
          },
          {
            key: "code",
            title: t("Code"),
            dataIndex: "code",
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

export default ExpanseTypePage;