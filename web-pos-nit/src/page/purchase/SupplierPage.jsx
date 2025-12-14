import React, { useEffect, useState } from "react";
import { request } from "../../util/helper";
import MainPage from "../../component/layout/MainPage";
import { Button, Form, Input, message, Modal, Space, Table } from "antd";
import dayjs from "dayjs";
import { MdOutlineCreateNewFolder } from "react-icons/md";
import { useTranslation } from "../../locales/TranslationContext";


function SupplierPage() {
  const [form] = Form.useForm();
  const { t, language } = useTranslation(); 
  
  
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
      title: t("លុបអ្នកផ្គត់ផ្គង់"),
      content: t("តើអ្នកប្រាកដថាចង់លុបទិន្នន័យនេះឬ?"),
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
          message.success(t("លុបទិន្នន័យដោយជោគជ័យ!"));
        } else {
          const errorMessage = res?.message || "";
          if (
            errorMessage.includes("Cannot delete or update a parent row") &&
            errorMessage.includes("foreign key constraint fails")
          ) {
            message.error(t("មានបញ្ហាក្នុងការលុបទិន្នន័យ!"));
          } else {
            message.error(t("មិនអាចលុបបានទេ! ទិន្នន័យនេះកំពុងត្រូវបានប្រើនៅក្នុងការទិញ។"));
          }

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
          <div>{t("Supplier")}</div>
          <Input.Search
            onChange={(value) =>
              setState((p) => ({ ...p, txtSearch: value.target.value }))
            }
            allowClear
            onSearch={getList}
            placeholder={t("Search")}
          />
        </Space>
        <Button 
          type="primary" 
          onClick={openModal} 
          icon={<MdOutlineCreateNewFolder />}
        >
          {t("NEW")}
        </Button>
      </div>

      <Modal
        open={state.visible}
        title={t(form.getFieldValue("id") ? "កែសម្រួលអ្នកផ្គត់ផ្គង់" : "អ្នកផ្គត់ផ្គង់ថ្មី")}
        onCancel={closeModal}
        footer={null}
      >
        <Form layout="vertical" form={form} onFinish={onFinish}>
          {/* Name */}
          <Form.Item
            name="name"
            label={t("ឈ្មោះ")}
            rules={[
              {
                required: true,
                message: t("Name is required!"),
              },
            ]}
          >
            <Input placeholder={t("Name")} />
          </Form.Item>

          {/* Code */}
          <Form.Item
            name="code"
            label={t("កូដ")}
            rules={[
              {
                required: true,
                message: t("Code is required!"),
              },
            ]}
          >
            <Input placeholder={t("Code")} />
          </Form.Item>

          {/* Tel */}
          <Form.Item
            name="tel"
            label={t("ទូរស័ព្ទ")}
            rules={[
              {
                required: true,
                message: t("Tel is required!"),
              },
            ]}
          >
            <Input placeholder={t("Tel")} />
          </Form.Item>

          {/* Email */}
          <Form.Item
            name="email"
            label={t("អ៊ីមែល")}
            rules={[
              {
                required: true,
                message: t("Email is required!"),
              },
            ]}
          >
            <Input placeholder={t("Email")} />
          </Form.Item>

          {/* Address */}
          <Form.Item
            name="address"
            label={t("address")}
            rules={[
              {
                required: true,
                message: t("Address is required!"),
              },
            ]}
          >
            <Input placeholder={t("Address")} />
          </Form.Item>

          {/* Website */}
          <Form.Item
            name="website"
            label={t("Website")}
            rules={[
              {
                required: true,
                message: t("Website is required!"),
              },
            ]}
          >
            <Input placeholder={t("Website")} />
          </Form.Item>

          {/* Note */}
          <Form.Item
            name="note"
            label={t("note")}
          >
            <Input.TextArea placeholder={t("Note")} />
          </Form.Item>

          {/* Buttons */}
          <Form.Item style={{ textAlign: "right" }}>
            <Space>
              <Button onClick={closeModal}>
                {t("បោះបង់")}
              </Button>
              <Button type="primary" htmlType="submit">
                {t(form.getFieldValue("id") ? "កែសម្រួល" : "រក្សាទុក")}
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
            title: t("Name"),
            dataIndex: "name",
          },
          {
            key: "code",
            title: t("Code"),
            dataIndex: "code",
          },
          {
            key: "tel",
            title: t("Tel"),
            dataIndex: "tel",
          },
          {
            key: "email",
            title: t("Email"),
            dataIndex: "email",
          },
          {
            key: "address",
            title: t("Address"),
            dataIndex: "address",
          },
          {
            key: "website",
            title: t("Website"),
            dataIndex: "website",
          },
          {
            key: "create_at",
            title: t("Created At"),
            dataIndex: "create_at",
            render: (value) => dayjs(value).format("DD/MM/YYYY"),
          },
          {
            key: "action",
            title: t("Action"),
            render: (value, data) => (
              <Space>
                <Button type="primary" onClick={() => onClickBtnEdit(data)}>
                  {t("EDIT")}
                </Button>
                <Button type="primary" danger onClick={() => onClickBtnDelete(data)}>
                  {t("DELETE")}
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