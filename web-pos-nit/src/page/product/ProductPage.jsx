// ✅ FIXED ProductPage.jsx - Product Master Data ONLY
// NO Quantity, NO Price - These belong to Purchase Order!
// Matching CategoryPage structure with Khmer translations and mobile view

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
import { MdEdit, MdDelete, MdOutlineCreateNewFolder } from "react-icons/md";
import { BsBoxSeam, BsSearch } from "react-icons/bs";
import MainPage from "../../component/layout/MainPage";
import { configStore } from "../../store/configStore";
import "./product.css";
import { getProfile } from "../../store/profile.store";
import { useTranslation } from "../../locales/TranslationContext";

function ProductPage() {
  const { config } = configStore();
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('my');
  const [state, setState] = useState({
    visibleModal: false,
    id: null,
    name: "",
    category_id: "",
    unit: "",
    status: "",
    txtSearch: "",
    actual_price: "", // ✅ Added actual_price field
    // ❌ NO quantity
    // ❌ NO unit_price
    // These belong to Purchase Order!
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
        res = await request(`product/user/${id}`, "get");
      } else {
        res = await request(`product/my-group`, "get");
      }

      if (res) {
        setList(res.list);
      }
    } catch (error) {
      message.error(t("Error loading products"));
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
    form.setFieldsValue({
      id: data.id,
      name: data.name,
      category_id: data.category_id,
      unit: data.unit,
      status: data.status,
      actual_price: data.actual_price, // ✅ Added actual_price
      // ❌ NO quantity
      // ❌ NO unit_price
      // These belong to Purchase Order!
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
      content: t("Are you sure you want to remove this product?"),
      okText: t("confirm"),
      cancelText: t("cancel"),
      onOk: async () => {
        const { id: user_id } = getProfile();
        const res = await request(`product/${data.id}`, "delete", {
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
    form.resetFields();
    form.setFieldsValue({
      status: 1,
      unit: 'L'
    });
  };

  const onCloseModal = () => {
    form.resetFields();
    setState({
      ...state,
      visibleModal: false,
      id: null,
    });
  };

  const onFinish = async (items) => {
    const { id: user_id } = getProfile();
    const data = {
      id: form.getFieldValue("id"),
      name: items.name,
      category_id: items.category_id,
      unit: items.unit || 'L',
      status: items.status,
      actual_price: items.actual_price, // ✅ Added actual_price
      // ✅ Added required fields for backend update
      qty: 0, // Master data - no quantity
      unit_price: 0, // Master data - no unit price
      discount: 0, // Master data - no discount
      company_name: '', // Optional field
      description: '', // Optional field
      create_at: new Date().toISOString().slice(0, 19).replace('T', ' '), // Current date
      receive_date: new Date().toISOString().slice(0, 19).replace('T', ' '), // Current date
      user_id: user_id,
    };
    const method = data.id ? "put" : "post";
    const url = data.id ? `product/${data.id}` : "product";

    const res = await request(url, method, data);
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
          <div className="khmer-title1">{t("products")}</div>
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
            {form.getFieldValue("id") ? t("edit_product") : t("new_product")}
          </div>
        }
        footer={null}
        onCancel={onCloseModal}
        width={600}
      >
        <Form layout="vertical" onFinish={onFinish} form={form}>
          <Form.Item
            name="id"
            hidden
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="name"
            label={<div className="khmer-title1">{t("product_name")}</div>}
            rules={[{ required: true, message: t("Please enter product name!") }]}
          >
            <Input
              placeholder={t("product_name")}
            />
          </Form.Item>

          <Form.Item
            name="category_id"
            label={<div className="khmer-title1">{t("category")}</div>}
            rules={[{ required: true, message: t("Please select category!") }]}
          >
            <Select
              placeholder={t("Select category")}
              options={config?.category}
            />
          </Form.Item>

          <Form.Item
            name="unit"
            label={<div className="khmer-title1">{t("unit")}</div>}
            rules={[{ required: true, message: t("Please select unit!") }]}
          >
            <Select
              placeholder={t("Select unit")}
              options={config?.unit}
            />
          </Form.Item>

          {/* ❌ NO quantity field */}
          {/* ❌ NO unit_price field */}
          {/* These belong to Purchase Order! */}

          {/* ✅ Actual Price Field */}
          <Form.Item
            name="actual_price"
            label={<div className="khmer-title1">តម្លៃមេចែក (Actual Price)</div>}
            rules={[{ required: true, message: t("Please enter actual price!") }]}
          >
            <Input
              type="number"
              step="0.01"
              min={0}
              placeholder={t("Enter actual price")}
            />
          </Form.Item>

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
                {form.getFieldValue("id") ? t("edit") : t("save")}
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
            item.category_name?.toLowerCase().includes(state.txtSearch.toLowerCase())
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
              title: <div className="khmer-text1">{t("product_name")}</div>,
              dataIndex: "name",
              render: (text) => <div className="khmer-title1">{text}</div>,
              width: 150,
            },
            {
              key: "category_name",
              title: <div className="khmer-text1">{t("category")}</div>,
              dataIndex: "category_name",
              render: (text) => <div className="khmer-title1">{text}</div>,
              width: 150,
            },
            {
              key: "unit",
              title: <div className="khmer-text1">{t("unit")}</div>,
              dataIndex: "unit",
              render: (text) => <Tag color="green">{text}</Tag>,
              width: 80,
            },
            {
              key: "actual_price",
              title: <div className="khmer-text1">តម្លៃមេចែក (Actual Price)</div>,
              dataIndex: "actual_price",
              render: (text) => <div className="khmer-title1 font-medium text-purple-600">${Number(text || 0).toFixed(2)}</div>,
              width: 120,
            },
            // ❌ NO quantity column
            // ❌ NO unit_price column
            // These belong to Purchase Order!
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
                  {isPermission("product.getone") && (
                    <Button
                      type="primary"
                      icon={<MdEdit />}
                      onClick={() => onClickEdit(data)}
                    />
                  )}
                  {isPermission("product.getone") && (
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
          item.category_name?.toLowerCase().includes(state.txtSearch.toLowerCase())
        ).length === 0 ? (
          <div className="py-16 px-4 text-center bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="text-6xl mb-4">📦</div>
            <div className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100 khmer-title1">
              {t("no_products_found")}
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
                item.category_name?.toLowerCase().includes(state.txtSearch.toLowerCase())
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
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold shadow-md">
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-base font-bold text-gray-900 dark:text-gray-100 khmer-title1">
                            {item.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {item.category_name}
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

                    {/* Category and Unit */}
                    <div className="mb-4 grid grid-cols-2 gap-3">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 khmer-title1">
                          {t("category")}:
                        </div>
                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400 khmer-title1">
                          {item.category_name}
                        </div>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 khmer-title1">
                          {t("unit")}:
                        </div>
                        <div className="text-sm font-medium text-green-600 dark:text-green-400">
                          <Tag color="green">{item.unit}</Tag>
                        </div>
                      </div>
                    </div>

                    {/* Actual Price */}
                    <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 khmer-title1">
                        តម្លៃមេចែក (Actual Price):
                      </div>
                      <div className="text-sm font-medium text-purple-600 dark:text-purple-400 khmer-title1">
                        ${Number(item.actual_price || 0).toFixed(2)}
                      </div>
                    </div>

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
                    {isPermission("product.getone") && (
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

export default ProductPage;