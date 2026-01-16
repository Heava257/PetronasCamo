// ✅ FIXED CategoryPage.jsx - Removed actual_price (តម្លៃមេចែក)
// Category = Master Data only (Name, Description, Barcode, Status)

import React, { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Radio,
} from "antd";
import { isPermission, request } from "../../util/helper";
import { MdAdd, MdDelete, MdEdit, MdOutlineCreateNewFolder } from "react-icons/md";
import MainPage from "../../component/layout/MainPage";
import { configStore } from "../../store/configStore";
import "./Category.css";
import { getProfile } from "../../store/profile.store";
import { useTranslation } from "../../locales/TranslationContext";

function CategoryPage() {
  const { config } = configStore();
  const { t } = useTranslation();
  const [formRef] = Form.useForm();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('my');
  const [state, setState] = useState({
    visibleModal: false,
    id: null,
    name: "",
    description: "",
    status: "",
    parentId: null,
    txtSearch: "",
    barcode: "",
    // ❌ REMOVED: actual_price
  });

  useEffect(() => {
    getList();
  }, [viewMode]);

  const getList = async () => {
    setLoading(true);
    try {
      let res;
      if (viewMode === 'my') {
        const { id } = getProfile();
        if (!id) {
          setLoading(false);
          return;
        }
        res = await request(`category/user/${id}`, "get");
      } else {
        res = await request(`category/my-group`, "get");
      }

      if (res) {
        setList(res.list);
      }
    } catch (error) {
      message.error(t("Error loading categories"));
    } finally {
      setLoading(false);
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
      description: data.description,
      status: data.status,
      barcode: data.barcode,
      // ❌ REMOVED: actual_price
    });
  };

  const onClickDelete = async (data) => {
    const { id: currentUserId } = getProfile();
    if (viewMode === 'group' && data.user_id !== currentUserId) {
      message.warning(t("can_only_delete_own"));
      return;
    }

    Modal.confirm({
      title: t("delete"),
      content: t("Are you sure you want to remove this category?"),
      okText: t("confirm"),
      cancelText: t("cancel"),
      onOk: async () => {
        const { id: user_id } = getProfile();
        const res = await request("category", "delete", {
          id: data.id,
          user_id: user_id
        });
        if (res && !res.error) {
          message.success(res.message);
          setList(list.filter((item) => item.id !== data.id));
        }
      },
    });
  };

  const onClickAddBtn = () => {
    setState({
      ...state,
      visibleModal: true,
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

  const onFinish = async (items) => {
    const { id: user_id } = getProfile();
    const data = {
      id: formRef.getFieldValue("id"),
      name: items.name,
      description: items.description,
      status: items.status,
      parent_id: 0,
      barcode: items.barcode,
      // ❌ REMOVED: actual_price
      user_id: user_id,
    };
    const method = data.id ? "put" : "post";

    const res = await request("category", method, data);
    if (res && !res.error) {
      message.success(res.message);
      getList();
      onCloseModal();
    }
  };

  const canEditOrDelete = (record) => {
    const { id: currentUserId } = getProfile();
    return viewMode === 'my' || record.user_id === currentUserId;
  };

  return (
    <MainPage loading={loading}>
      <div className="pageHeader">
        <Space>
          <div className="khmer-title1">{t("product_category")}</div>
          <Input.Search
            onChange={(e) => setState((prev) => ({ ...prev, txtSearch: e.target.value }))}
            allowClear
            onSearch={getList}
            placeholder={t("search")}
          />
        </Space>
        <Space>
          <Radio.Group
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="my">
              <span className="khmer-title1">{t("my_items")}</span>
            </Radio.Button>
            <Radio.Button value="group">
              <span className="khmer-title1">{t("group")}</span>
            </Radio.Button>
          </Radio.Group>
          <Button type="primary" onClick={onClickAddBtn} icon={<MdOutlineCreateNewFolder />}>
            {t("new")}
          </Button>
        </Space>
      </div>

      <Modal
        open={state.visibleModal}
        title={
          <div className="khmer-title1">
            {formRef.getFieldValue("id") ? t("edit_category") : t("new_category")}
          </div>
        }
        footer={null}
        onCancel={onCloseModal}
        width={600}
      >
        <Form layout="vertical" onFinish={onFinish} form={formRef}>
          <Form.Item
            name="name"
            label={<div className="khmer-title1">{t("category_name")}</div>}
            rules={[{ required: true, message: t("Please enter category name!") }]}
          >
            <Input placeholder={t("Input Category name")} />
          </Form.Item>

          <Form.Item
            name="description"
            label={<div className="khmer-title1">{t("description")}</div>}
          >
            <Input.TextArea placeholder={t("Enter description")} />
          </Form.Item>

          <Form.Item
            name="barcode"
            label={<div className="khmer-title1">{t("barcode")}</div>}
            rules={[{ required: true, message: t("Please enter barcode!") }]}
          >
            <Input placeholder={t("Enter barcode")} />
          </Form.Item>

          {/* ❌ REMOVED: actual_price field */}

          <Form.Item
            name="status"
            label={<div className="khmer-title1">{t("status")}</div>}
          >
            <Select
              placeholder={t("Select status")}
              options={[
                { label: <div className="khmer-title1">{t("active")}</div>, value: 1 },
                { label: <div className="khmer-title1">{t("inactive")}</div>, value: 0 },
              ]}
            />
          </Form.Item>

          <Space>
            <Button onClick={onCloseModal}>
              <span className="khmer-text1">{t("cancel")}</span>
            </Button>
            <Button type="primary" htmlType="submit">
              <span className="khmer-title1">
                {formRef.getFieldValue("id") ? t("edit") : t("save")}
              </span>
            </Button>
          </Space>
        </Form>
      </Modal>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <Table
          dataSource={list.filter(item =>
            !state.txtSearch ||
            item.name?.toLowerCase().includes(state.txtSearch.toLowerCase()) ||
            item.barcode?.toLowerCase().includes(state.txtSearch.toLowerCase())
          )}
          rowKey="id"
          scroll={{ x: 1200 }}
          loading={loading}
          columns={[
            {
              key: "No",
              title: <div className="khmer-text1">{t("table_no")}</div>,
              render: (text, record, index) => index + 1,
              width: 60,
            },
            {
              key: "name",
              title: <div className="khmer-text1">{t("name")}</div>,
              dataIndex: "name",
              render: (text) => <div className="khmer-title1">{text}</div>,
              width: 150,
            },
            {
              key: "description",
              title: <div className="khmer-text1">{t("description")}</div>,
              dataIndex: "description",
              render: (text) => <div className="khmer-title1">{text}</div>,
              width: 200,
            },
            {
              key: "barcode",
              title: <div className="khmer-text1">{t("barcode_number")}</div>,
              dataIndex: "barcode",
              render: (text) => <div className="khmer-title1">{text}</div>,
              width: 120,
            },
            // ❌ REMOVED: actual_price column
            {
              key: "status",
              title: <div className="khmer-text1">{t("status")}</div>,
              dataIndex: "status",
              render: (status) => (
                status === 1
                  ? <Tag color="green">{t("Active")}</Tag>
                  : <Tag color="red">{t("Inactive")}</Tag>
              ),
              width: 100,
            },
            ...(viewMode === 'group' ? [{
              key: "creator",
              title: <div className="khmer-text1">{t("creator")}</div>,
              render: (text, record) => {
                const { id: currentUserId } = getProfile();
                const isCurrentUser = record.user_id === currentUserId;

                if (isCurrentUser) {
                  return <Tag color="blue">{t("me")}</Tag>;
                }

                if (record.created_by_name) {
                  return (
                    <div>
                      <Tag color="default">{record.created_by_name}</Tag>
                      {record.created_by_username && (
                        <div style={{ fontSize: '11px', color: '#999' }}>
                          @{record.created_by_username}
                        </div>
                      )}
                    </div>
                  );
                }

                if (record.created_by_username) {
                  return <Tag color="default">@{record.created_by_username}</Tag>;
                }

                return <Tag color="default">{t("other_staff")}</Tag>;
              },
              width: 120,
            }] : []),
            {
              key: "Action",
              title: <div className="khmer-text1">{t("action")}</div>,
              align: "center",
              render: (item, data) => (
                <Space>
                  {isPermission("customer.getone") && (
                    <Button
                      type="primary"
                      icon={<MdEdit />}
                      onClick={() => onClickEdit(data)}
                    />
                  )}
                  {isPermission("customer.getone") && (
                    <Button
                      type="primary"
                      danger
                      icon={<MdDelete />}
                      onClick={() => onClickDelete(data)}
                    />
                  )}
                </Space>
              ),
              width: 120,
              fixed: "right",
            },
          ]}
        />
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="block lg:hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : list.filter(item =>
          !state.txtSearch ||
          item.name?.toLowerCase().includes(state.txtSearch.toLowerCase()) ||
          item.barcode?.toLowerCase().includes(state.txtSearch.toLowerCase())
        ).length === 0 ? (
          <div className="py-16 px-4 text-center bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="text-6xl mb-4">📦</div>
            <div className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100 khmer-title1">
              {t("no_categories_found")}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 khmer-title1">
              {t("try_different_keywords")}
            </div>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {list
              .filter(item =>
                !state.txtSearch ||
                item.name?.toLowerCase().includes(state.txtSearch.toLowerCase()) ||
                item.barcode?.toLowerCase().includes(state.txtSearch.toLowerCase())
              )
              .map((item, index) => {
                const { id: currentUserId } = getProfile();
                const isCurrentUser = item.user_id === currentUserId;
                const canEdit = canEditOrDelete(item);

                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4 transition-all duration-300 hover:shadow-lg"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold shadow-md">
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-base font-bold text-gray-900 dark:text-gray-100 khmer-title1">
                            {item.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                            {item.barcode}
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      {item.status === 1 ? (
                        <div className="px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-400 text-xs font-semibold khmer-title1">
                          {t("Active")}
                        </div>
                      ) : (
                        <div className="px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-400 text-xs font-semibold khmer-title1">
                          {t("Inactive")}
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {item.description && (
                      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 khmer-title1">
                          {t("description")}:
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 khmer-title1">
                          {item.description}
                        </div>
                      </div>
                    )}

                    {/* Barcode Only */}
                    <div className="mb-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 khmer-title1">
                          {t("barcode_number")}
                        </div>
                        <div className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono">
                          {item.barcode}
                        </div>
                      </div>
                    </div>

                    {/* ❌ REMOVED: Actual Price display */}

                    {/* Creator Info */}
                    {viewMode === 'group' && (
                      <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 khmer-title1">
                          {t("creator")}:
                        </div>
                        <div className="flex items-center gap-2">
                          {isCurrentUser ? (
                            <div className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-400 text-xs font-semibold khmer-title1">
                              {t("me")}
                            </div>
                          ) : (
                            <div>
                              {item.created_by_name && (
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {item.created_by_name}
                                </div>
                              )}
                              {item.created_by_username && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  @{item.created_by_username}
                                </div>
                              )}
                              {!item.created_by_name && !item.created_by_username && (
                                <div className="text-sm text-gray-600 dark:text-gray-400 khmer-title1">
                                  {t("other_staff")}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {isPermission("customer.getone") && (
                      <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => onClickEdit(item)}
                          disabled={!canEdit}
                          className={`flex-1 ${canEdit
                              ? 'bg-blue-500 hover:bg-blue-600 active:scale-95'
                              : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                            } text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-sm`}
                        >
                          <MdEdit size={18} />
                          <span className="text-sm khmer-title1">{t("edit")}</span>
                        </button>
                        <button
                          onClick={() => onClickDelete(item)}
                          disabled={!canEdit}
                          className={`flex-1 ${canEdit
                              ? 'bg-red-500 hover:bg-red-600 active:scale-95'
                              : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                            } text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-sm`}
                        >
                          <MdDelete size={18} />
                          <span className="text-sm khmer-title1">{t("delete")}</span>
                        </button>
                      </div>
                    )}

                    {/* Permission Warning */}
                    {viewMode === 'group' && !canEdit && (
                      <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <div className="text-xs text-yellow-800 dark:text-yellow-400 text-center khmer-title1">
                          {t("can_only_edit_own")}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </MainPage>
  );
}

export default CategoryPage;