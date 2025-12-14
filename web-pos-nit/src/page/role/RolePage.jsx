import { useEffect, useState } from "react";
import { request } from "../../util/helper";
import { Button, Form, Input, message, Modal, Space, Table, Tag } from "antd";
import { useTranslation } from "../../locales/TranslationContext";

function RolePage() {
  const { t } = useTranslation(); // Add this
  const [state, setState] = useState({
    list: [],
    loading: false,
    visible: false,
  });
  const [form] = Form.useForm();

  useEffect(() => {
    getList();
  }, []);

  const getList = async () => {
    const res = await request("role", "get");
    if (res && !res.error) {
      setState((pre) => ({
        ...pre,
        list: res.list,
      }));
    }
  };

  const clickBtnEdit = (item) => {
    form.setFieldsValue({
      ...item,
    });
    handleOpenModal();
  };

  const clickBtnDelete = (item) => {
    Modal.confirm({
      title: t("Delete"),
      content: t("Are you sure to remove?"),
      onOk: async () => {
        const res = await request("role", "delete", {
          id: item.id,
        });
        if (res && !res.error) {
          message.success(res.message);
          const newList = state.list.filter((item1) => item1.id != item.id);
          setState((pre) => ({
            ...pre,
            list: newList,
          }));
        }
      },
    });
  };

  const onFinish = async (item) => {
    var data = {
      id: form.getFieldValue("id"),
      code: item.code,
      name: item.name,
    };
    var method = "post";
    if (form.getFieldValue("id")) {
      method = "put";
    }
    const res = await request("role", method, data);
    if (res && !res.error) {
      message.success(res.message);
      getList();
      handleCloseModal();
    } else {
      message.warning(res.error);
    }
  };

  const handleOpenModal = () => {
    setState((pre) => ({
      ...pre,
      visible: true,
    }));
  };

  const handleCloseModal = () => {
    setState((pre) => ({
      ...pre,
      visible: false,
    }));
    form.resetFields();
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          paddingBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div>{t("Role")}</div>
          <Input.Search 
            style={{ marginLeft: 10 }} 
            placeholder={t("Search")} 
          />
        </div>
        <Button type="primary" onClick={handleOpenModal}>
          {t("New")}
        </Button>
      </div>

      <Modal
        title={
          form.getFieldValue("id") ? (
            <div>
              <span className="khmer-text">{t("កែប្រែ")}</span> 
            </div>
          ) : (
            <div>
              <span className="khmer-text">{t("តួនាទីថ្មី")}</span>
            </div>
          )
        }
        open={state.visible}
        onCancel={handleCloseModal}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="name"
            label={
              <div>
                <span className="khmer-text">{t("ឈ្មោះតួនាទី")}</span> 
              </div>
            }
            rules={[
              {
                required: true,
                message: t("Please enter role name"),
              },
            ]}
          >
            <Input placeholder={t("Role Name Placeholder")} />
          </Form.Item>

          <Form.Item
            name="code"
            label={
              <div>
                <span className="khmer-text">{t("កូដតួនាទី")}</span>
              </div>
            }
            rules={[
              {
                required: true,
                message: t("Please enter role code"),
              },
            ]}
          >
            <Input placeholder={t("Role Code Placeholder")} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={handleCloseModal}>
                <span className="khmer-text">{t("បោះបង់")}</span> 
              </Button>
              <Button type="primary" htmlType="submit">
                {form.getFieldValue("id") ? (
                  <span>
                    <span className="khmer-text">{t("កែប្រែ")}</span> 
                  </span>
                ) : (
                  <span>
                    <span className="khmer-text">{t("រក្សាទុក")}</span> 
                  </span>
                )}
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
            key: "no",
            title: <span className="khmer-text">{t("ល.រ")}</span>,
            render: (value, data, index) => index + 1,
            width: 80,
          },
          {
            key: "name",
            title: <span className="khmer-text">{t("ឈ្មោះ")}</span>,
            dataIndex: "name",
          },
          {
            key: "code",
            title: <span className="khmer-text">{t("កូដ")}</span>,
            dataIndex: "code",
          },
          {
            key: "is_active",
            title: <span className="khmer-text">{t("ស្ថានភាព")}</span>,
            dataIndex: "is_active",
            render: (value) =>
              value ? (
                <Tag color="green" className="khmer-text">{t("សកម្ម")}</Tag>
              ) : (
                <Tag color="red" className="khmer-text">{t("អសកម្ម")}</Tag>
              ),
          },
          {
            key: "action",
            title: <span className="khmer-text">{t("សកម្មភាព")}</span>,
            align: "center",
            render: (value, data) => (
              <Space>
                <Button onClick={() => clickBtnEdit(data)} type="primary">
                  <span className="khmer-text">{t("កែប្រែ")}</span>
                </Button>
                <Button onClick={() => clickBtnDelete(data)} danger type="primary">
                  <span className="khmer-text">{t("លុប")}</span>
                </Button>
              </Space>
            ),
          },
        ]}
      />
    </div>
  );
}

export default RolePage;