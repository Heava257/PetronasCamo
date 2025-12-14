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
} from "antd";
import { request ,isPermission} from "../../util/helper";
import { MdDelete, MdEdit } from "react-icons/md";
import MainPage from "../../component/layout/MainPage";

function ExpanseTypePage() {
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
    // Updated endpoint to match backend
    const res = await request("expense_type", "get", param);
    setLoading(false);
    if (res && res.success) {
      // Updated to use 'data' property instead of 'list'
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
      code: data.code, // Added 'code' field, which is in the backend
    });
  };

  const onClickDelete = async (data) => {
    Modal.confirm({
      title: "Delete",
      content: "Are you sure to remove?",
      okText: "Confirm",
      onOk: async () => {
        // Updated endpoint to match backend
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
      code: values.code, // Changed from description to code
    };

    // Updated endpoint to match backend
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
          <div>Expense Type Management</div>
          <Input.Search
            onChange={(e) =>
              setState((p) => ({ ...p, txtSearch: e.target.value }))
            }
            allowClear
            onSearch={getList}
            placeholder="Search"
          />
          <Button type="primary" onClick={getList}>
            Filter
          </Button>
        </Space>
        <Button type="primary" onClick={onClickAddBtn}>
          NEW
        </Button>
      </div>

      <Modal
        open={state.visibleModal}
        title={formRef.getFieldValue("id") ? "Edit Expense Type" : "New Expense Type"}
        footer={null}
        onCancel={onCloseModal}
      >
        <Form layout="vertical" onFinish={onFinish} form={formRef}>
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input placeholder="Enter Name" />
          </Form.Item>
          <Form.Item
            name="code"
            label="Code"
            rules={[{ required: true, message: "Code is required" }]}
          >
            <Input placeholder="Enter Code" />
          </Form.Item>
          <Space>
            <Button onClick={onCloseModal}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              {formRef.getFieldValue("id") ? "Update" : "Save"}
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
            title: "No",
            render: (_, __, index) => index + 1,
          },
          {
            key: "name",
            title: "Name",
            dataIndex: "name",
          },
          {
            key: "code",
            title: "Code",
            dataIndex: "code",
          },
          {
            key: "action",
            title: "Action",
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