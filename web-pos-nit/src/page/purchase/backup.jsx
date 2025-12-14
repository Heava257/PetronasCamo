import React, { useEffect, useState } from "react";
import { request } from "../../util/helper";
import MainPage from "../../component/layout/MainPage";
import { Button, Form, Input, message, Modal, Space, Table } from "antd";
import dayjs from "dayjs";
import { MdOutlineCreateNewFolder } from "react-icons/md";
function SupplierPage() {
  const [form] = Form.useForm();
  const [state, setState] = useState({
    list: [],
    loading: false,
    visible: false,
    txtSearch: "",
  });
  useEffect(() => {
    getList();
  }, []);
  const getList = async () => {
    setState((p) => ({
      ...p,
      loading: true,
    }));
    var param = {
      txtSearch: state.txtSearch,
    };
    const res = await request("supplier", "get", param);
    if (res && !res.error) {
      setState((p) => ({
        ...p,
        list: res.list,
        loading: false,
      }));
    }
  };
  const openModal = () => {
    setState((p) => ({
      ...p,
      visible: true,
    }));
  };
  const closeModal = () => {
    setState((p) => ({
      ...p,
      visible: false,
    }));
    form.resetFields();
  };
  const onFinish = async (items) => {
    var method = "post";
    if (form.getFieldValue("id")) {
      method = "put";
    }
    setState((p) => ({
      ...p,
      loading: true,
    }));
    const res = await request("supplier", method, {
      ...items,
      id: form.getFieldValue("id"),
    });
    if (res && !res.error) {
      getList();
      closeModal();
      message.success(res.message);
    }
  };
  const onClickBtnEdit = (items) => {
    form.setFieldsValue({
      ...items,
      id: items.id,
    });
    openModal();
  };
  const onClickBtnDelete = (items) => {
    Modal.confirm({
      title: "លុបអ្នកផ្គត់ផ្គង់",
      content: "តើអ្នកប្រាកដថាចង់លុបទិន្នន័យនេះឬ?",
      onOk: async () => {
        setState((p) => ({
          ...p,
          loading: true,
        }));
        const res = await request("supplier", "delete", {
          id: items.id,
        });
  
        if (res && !res.error) {
          const newList = state.list.filter((item) => item.id !== items.id);
          setState((p) => ({
            ...p,
            list: newList,
            loading: false,
          }));
          message.success("លុបទិន្នន័យដោយជោគជ័យ!");
        } else {
          const errorMessage = res?.message || "";
          if (
            errorMessage.includes("Cannot delete or update a parent row") &&
            errorMessage.includes("foreign key constraint fails")
          ) {
            message.error("មានបញ្ហាក្នុងការលុបទិន្នន័យ!");
           
          } else {
            message.error("មិនអាចលុបបានទេ! ទិន្នន័យនេះកំពុងត្រូវបានប្រើនៅក្នុងការទិញ។");
          }
  
          // ✅ Ensure loading state is updated after error
          setState((p) => ({
            ...p,
            loading: false,
          }));
        }
      },
    });
  };
  
  return (
    <MainPage loading={state.loading}>
      <div className="pageHeader">
        <Space>
          <div>Supplier</div>
          <Input.Search
            onChange={(value) =>
              setState((p) => ({ ...p, txtSearch: value.target.value }))
            }
            allowClear
            onSearch={getList}
            placeholder="Search"
          />
        </Space>
        <Button type="primary" onClick={openModal} icon={<MdOutlineCreateNewFolder />}>
          បញ្ចូលអ្នកផ្គត់ផ្គង់ថ្មី
        </Button>
      </div>
      <Modal
    open={state.visible}
    title={
        <div>
            <span className="khmer-text">
                {form.getFieldValue("id") ? "កែសម្រួលអ្នកផ្គត់ផ្គង់" : "អ្នកផ្គត់ផ្គង់ថ្មី"}
            </span>
          
        </div>
    }
    onCancel={closeModal}
    footer={null}
>
    <Form layout="vertical" form={form} onFinish={onFinish}>
        {/* Name */}
        <Form.Item
            name="name"
            label={
                <div>
                    <span className="khmer-text">ឈ្មោះ</span>
                </div>
            }
            rules={[
                {
                    required: true,
                    message: "Name is required!",
                },
            ]}
        >
            <Input placeholder="Name" />
        </Form.Item>

        {/* Code */}
        <Form.Item
            name="code"
            label={
                <div>
                    <span className="khmer-text">កូដ</span>
                </div>
            }
            rules={[
                {
                    required: true,
                    message: "Code is required!",
                },
            ]}
        >
            <Input placeholder="Code" />
        </Form.Item>

        {/* Tel */}
        <Form.Item
            name="tel"
            label={
                <div>
                    <span className="khmer-text">ទូរស័ព្ទ</span>
                </div>
            }
            rules={[
                {
                    required: true,
                    message: "Tel is required!",
                },
            ]}
        >
            <Input placeholder="Tel" />
        </Form.Item>

        {/* Email */}
        <Form.Item
            name="email"
            label={
                <div>
                    <span className="khmer-text">អ៊ីមែល</span>
                </div>
            }
            rules={[
                {
                    required: true,
                    message: "Email is required!",
                },
            ]}
        >
            <Input placeholder="Email" />
        </Form.Item>

        {/* Address */}
        <Form.Item
            name="address"
            label={
                <div>
                    <span className="khmer-text">អាសយដ្ឋាន</span>
                </div>
            }
            rules={[
                {
                    required: true,
                    message: "Address is required!",
                },
            ]}
        >
            <Input placeholder="Address" />
        </Form.Item>

        {/* Website */}
        <Form.Item
            name="website"
            label={
                <div>
                    <span className="khmer-text">គេហទំព័រ</span>
                </div>
            }
            rules={[
                {
                    required: true,
                    message: "Website is required!",
                },
            ]}
        >
            <Input placeholder="Website" />
        </Form.Item>

        {/* Note */}
        <Form.Item
            name="note"
            label={
                <div>
                    <span className="khmer-text">កំណត់សម្គាល់</span>
                </div>
            }
        >
            <Input.TextArea placeholder="Note" />
        </Form.Item>

        {/* Buttons */}
        <Form.Item style={{ textAlign: "right" }}>
            <Space>
                <Button onClick={closeModal}>
                    <span className="khmer-text">បោះបង់</span>
                </Button>
                <Button type="primary" htmlType="submit">
                    <span className="khmer-text">
                        {form.getFieldValue("id") ? "កែសម្រួល" : "រក្សាទុក"}
                    </span>
                  
                </Button>
            </Space>
        </Form.Item>
    </Form>
</Modal>
      <Table
  rowClassName={() => "pos-row"}
  dataSource={state.list}
  columns={[
    {
      key: "name",
      title: (
        <div >
          <div className="khmer-text">ឈ្មោះ</div>
          <div className="english-text">Name</div>
        </div>
      ),
      dataIndex: "name",
    },
    {
      key: "code",
      title: (
        <div >
          <div className="khmer-text">កូដ</div>
          <div className="english-text">Code</div>
        </div>
      ),
      dataIndex: "code",
    },
    {
      key: "tel",
      title: (
        <div >
          <div className="khmer-text">លេខទូរស័ព្ទ</div>
          <div className="english-text">Tel</div>
        </div>
      ),
      dataIndex: "tel",
    },
    {
      key: "email",
      title: (
        <div >
          <div className="khmer-text">អ៊ីម៉ែល</div>
          <div className="english-text">Email</div>
        </div>
      ),
      dataIndex: "email",
    },
    {
      key: "address",
      title: (
        <div >
          <div className="khmer-text">អាសយដ្ឋាន</div>
          <div className="english-text">Address</div>
        </div>
      ),
      dataIndex: "address",
    },
    {
      key: "website",
      title: (
        <div >
          <div className="khmer-text">គេហទំព័រ</div>
          <div className="english-text">Website</div>
        </div>
      ),
      dataIndex: "website",
    },
    {
      key: "create_at",
      title: (
        <div >
          <div className="khmer-text">កាលបរិច្ឆេទបង្កើត</div>
          <div className="english-text">Created At</div>
        </div>
      ),
      dataIndex: "create_at",
      render: (value) => dayjs(value).format("DD/MM/YYYY"),
    },
    {
      key: "action",
      title: (
        <div >
          <div className="khmer-text">សកម្មភាព</div>
          <div className="english-text">Action</div>
        </div>
      ),
      render: (value, data) => (
        <Space>
          <Button type="primary" onClick={() => onClickBtnEdit(data)}>
            EDIT
          </Button>
          <Button type="primary" danger onClick={() => onClickBtnDelete(data)}>
            DELETE
          </Button>
        </Space>
      ),
    },
  ]}
/>
    </MainPage>
  );
}
export default SupplierPage;