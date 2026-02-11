import { useEffect, useState } from "react";
import { isPermission, request } from "../../util/helper";
import { Button, Form, Input, Modal, Space, Table, Tag, Result } from "antd";
import { useTranslation } from "../../locales/TranslationContext";
import { configStore } from "../../store/configStore";
import { getProfile } from "../../store/profile.store";
import Swal from "sweetalert2";

function RolePage() {
  const { t } = useTranslation();
  const { config } = configStore();
  const user = getProfile() || {};

  // 🔒 Security Check
  if (!isPermission("role.view")) {
    return (
      <div className="p-8 flex justify-center items-center min-vh-100 bg-gray-50">
        <Result
          status="403"
          title="403"
          subTitle="Sorry, you are not authorized to access Role Management."
          extra={<Button type="primary" onClick={() => window.location.href = '/'}>Back Home</Button>}
        />
      </div>
    );
  }

  const [state, setState] = useState({
    list: [],
    loading: false,
    visible: false,
  });
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();

  useEffect(() => {
    getList();
  }, []);

  const getList = async () => {
    setState((pre) => ({ ...pre, loading: true }));
    const res = await request("role", "get");
    if (res && !res.error) {
      setState((pre) => ({
        ...pre,
        list: res.list,
        loading: false,
      }));
    } else {
      setState((pre) => ({ ...pre, loading: false }));
    }
  };

  const clickBtnEdit = (item) => {
    form.setFieldsValue({
      ...item,
    });
    handleOpenModal();
  };

  const clickBtnDelete = (item) => {
    Swal.fire({
      title: t("delete"),
      text: t("delete_confirm"),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: t("yes"),
      cancelButtonText: t("no")
    }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await request("role", "delete", {
          id: item.id,
        });
        if (res && !res.error) {
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: res.message,
            timer: 1500,
            showConfirmButton: false
          });
          const newList = state.list.filter((item1) => item1.id != item.id);
          setState((pre) => ({
            ...pre,
            list: newList,
          }));
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: res.message || 'Failed to delete role',
          });
        }
      }
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
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: res.message,
        timer: 1500,
        showConfirmButton: false
      });
      getList();
      handleCloseModal();
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Warning',
        text: res.error,
      });
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

  // Filter data based on search
  const filteredList = state.list.filter(item =>
    !searchText ||
    item.name?.toLowerCase().includes(searchText.toLowerCase()) ||
    item.code?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="p-4">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-4 mb-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 w-full sm:w-auto">
            <div className="text-xl font-semibold text-gray-900 dark:text-white">
              {t("Role")}
            </div>
            <Input.Search
              className="w-full sm:w-64"
              placeholder={t("search")}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </div>
          {isPermission("role.create") && (
            <Button type="primary" onClick={handleOpenModal} className="w-full sm:w-auto">
              {t("new")}
            </Button>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal
        title={
          form.getFieldValue("id") ? (
            <div>
              <span className="khmer-text">{t("edit")}</span>
            </div>
          ) : (
            <div>
              <span className="khmer-text">{t("new")} {t("Role")}</span>
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
                <span className="khmer-text">{t("name")}</span>
              </div>
            }
            rules={[
              {
                required: true,
                message: t("input_name"),
              },
            ]}
          >
            <Input placeholder={t("name")} />
          </Form.Item>

          <Form.Item
            name="code"
            label={
              <div>
                <span className="khmer-text">{t("code")}</span>
              </div>
            }
            rules={[
              {
                required: true,
                message: t("input_name"),
              },
            ]}
          >
            <Input placeholder={t("code")} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={handleCloseModal}>
                <span className="khmer-text">{t("cancel")}</span>
              </Button>
              <Button type="primary" htmlType="submit">
                {form.getFieldValue("id") ? (
                  <span>
                    <span className="khmer-text">{t("update")}</span>
                  </span>
                ) : (
                  <span>
                    <span className="khmer-text">{t("save")}</span>
                  </span>
                )}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <Table
          rowClassName={() => "pos-row"}
          dataSource={filteredList}
          loading={state.loading}
          pagination={{ pageSize: 10 }}
          columns={[
            {
              key: "table_no",
              title: <span className="khmer-text">{t("table_no")}</span>,
              render: (value, data, index) => index + 1,
              width: 80,
            },
            {
              key: "name",
              title: <span className="khmer-text">{t("name")}</span>,
              dataIndex: "name",
            },
            {
              key: "code",
              title: <span className="khmer-text">{t("code")}</span>,
              dataIndex: "code",
            },
            {
              key: "is_active",
              title: <span className="khmer-text">{t("status")}</span>,
              dataIndex: "is_active",
              render: (value) =>
                value ? (
                  <Tag color="green" className="khmer-text">{t("active")}</Tag>
                ) : (
                  <Tag color="red" className="khmer-text">{t("inactive")}</Tag>
                ),
            },
            {
              key: "action",
              title: <span className="khmer-text">{t("action")}</span>,
              align: "center",
              render: (value, data) => (
                <Space>
                  {isPermission("role.update") && (
                    <Button onClick={() => clickBtnEdit(data)} type="primary">
                      <span className="khmer-text">{t("edit")}</span>
                    </Button>
                  )}
                  {isPermission("role.remove") && (data.code !== 'SUPER_ADMIN' && data.code !== 'Supper Admin' && data.code !== 'SUPER_ADMIN') && (
                    <Button onClick={() => clickBtnDelete(data)} danger type="primary">
                      <span className="khmer-text">{t("delete")}</span>
                    </Button>
                  )}
                </Space>
              ),
            },
          ]}
        />
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="block md:hidden">
        {state.loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-16 px-4 text-center bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="text-6xl mb-4">🔍</div>
            <div className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
              {t("no_data")}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t("no_data_available")}
            </div>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {filteredList.map((item, index) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4 transition-all duration-300 hover:shadow-lg"
              >
                {/* Header with Number Badge */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-base font-bold text-gray-900 dark:text-gray-100">
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {t("code")}: {item.code}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {item.is_active ? (
                    <div className="px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-400 text-xs font-semibold">
                      <span className="khmer-text">{t("active")}</span>
                    </div>
                  ) : (
                    <div className="px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-400 text-xs font-semibold">
                      <span className="khmer-text">{t("inactive")}</span>
                    </div>
                  )}
                </div>

                {/* Info Grid */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium khmer-text">
                      {t("name")}:
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium khmer-text">
                      {t("code")}:
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 font-mono">
                      {item.code}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  {isPermission("role.update") && (
                    <button
                      onClick={() => clickBtnEdit(item)}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-sm"
                    >
                      <span className="text-sm khmer-text">{t("edit")}</span>
                    </button>
                  )}
                  {isPermission("role.remove") && (item.code !== 'SUPER_ADMIN' && item.code !== 'Supper Admin' && item.code !== 'SUPER_ADMIN') && (
                    <button
                      onClick={() => clickBtnDelete(item)}
                      className="flex-1 bg-red-500 hover:bg-red-600 active:scale-95 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-sm"
                    >
                      <span className="text-sm khmer-text">{t("delete")}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RolePage;