// ✅ ProductPage.jsx - Refactor with Size, Statistics, and Improved Layout
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
  Row,
  Col,
  Typography
} from "antd";
import { isPermission, request } from "../../util/helper";
import { MdEdit, MdDelete, MdOutlineCreateNewFolder } from "react-icons/md";
import { MdShoppingCart } from "react-icons/md";
import { SearchOutlined } from "@ant-design/icons";
import MainPage from "../../component/layout/MainPage";
import { configStore } from "../../store/configStore";
import "./product.css";
import { getProfile } from "../../store/profile.store";
import { useTranslation } from "../../locales/TranslationContext";
import Swal from "sweetalert2";

const { Title } = Typography;

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
    txtSearch: "",
    actual_price: "",
    size: "",
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
        setList(res.list || []);
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: t("Error loading products"),
      });
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
      actual_price: data.actual_price,
      size: data.size,
    });
  };

  const onClickDelete = async (data) => {
    const { id: currentUserId } = getProfile();
    if (viewMode === 'group' && data.user_id !== currentUserId) {
      message.warning(t("can_only_delete_own"));
      return;
    }

    Swal.fire({
      title: t("delete"),
      text: t("Are you sure you want to remove this product?"),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: t("confirm") || "Confirm",
      cancelButtonText: t("cancel") || "Cancel"
    }).then(async (result) => {
      if (result.isConfirmed) {
        const { id: user_id } = getProfile();
        const res = await request(`product/${data.id}`, "delete", {
          id: data.id,
          user_id: user_id
        });
        if (res && !res.error) {
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: res.message,
            showConfirmButton: false,
            timer: 1500
          });
          getList();
        }
      }
    });
  };

  const onClickAddBtn = () => {
    setState({
      ...state,
      visibleModal: true,
      id: null,
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
      id: state.id,
      name: items.name,
      category_id: items.category_id,
      unit: items.unit || 'L',
      status: items.status,
      actual_price: items.actual_price,
      size: items.size,
      qty: 0,
      unit_price: 0,
      discount: 0,
      company_name: '',
      description: '',
      create_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      receive_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
      user_id: user_id,
    };
    const method = data.id ? "put" : "post";
    const url = data.id ? `product/${data.id}` : "product";

    const res = await request(url, method, data);
    if (res && !res.error) {
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: res.message,
        showConfirmButton: false,
        timer: 1500
      });
      getList();
      onCloseModal();
    }
  };

  const canEditOrDelete = (record) => {
    const { id: currentUserId } = getProfile();
    return viewMode === 'my' || record.user_id === currentUserId;
  };

  const filteredList = list
    .filter(item =>
      !state.txtSearch ||
      item.name?.toLowerCase().includes(state.txtSearch.toLowerCase()) ||
      item.category_name?.toLowerCase().includes(state.txtSearch.toLowerCase())
    )
    .sort((a, b) => (a.id || 0) - (b.id || 0));

  const columns = [
    {
      key: "No",
      title: <div className="khmer-text1">{t("table_no")}</div>,
      render: (text, record, index) => index + 1,
      width: 60,
      align: "left",
    },
    {
      key: "name",
      title: <div className="khmer-text1">{t("product_name")}</div>,
      dataIndex: "name",
      render: (text) => <div className="khmer-title1">{text}</div>,
      width: 150,
      align: "left",
    },
    {
      key: "category_name",
      title: <div className="khmer-text1">{t("category")}</div>,
      dataIndex: "category_name",
      render: (text) => <div className="khmer-title1">{text}</div>,
      width: 200,
      align: "left",
    },
    {
      key: "unit",
      title: <div className="khmer-text1">{t("unit")}</div>,
      dataIndex: "unit",
      render: (text) => <Tag color="green">{text}</Tag>,
      width: 80,
      align: "left",
    },
    {
      key: "actual_price",
      title: <div className="khmer-text1">{t("actual_price_label")}</div>,
      dataIndex: "actual_price",
      render: (text) => <div className="khmer-title1 font-medium text-purple-600">${Number(text || 0).toFixed(2)}</div>,
      width: 120,
      align: "left",
    },

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
      align: "left",
    },
    ...(viewMode === 'group' ? [{
      key: "creator",
      title: <div className="khmer-text1">{t("creator")}</div>,
      align: "center",
      render: (text, record) => {
        const { id: currentUserId } = getProfile();
        const isCurrentUser = record.user_id === currentUserId;
        if (isCurrentUser) return <Tag color="blue">{t("me")}</Tag>;
        if (record.created_by_name) return <Tag color="default">{record.created_by_name}</Tag>;
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
          {isPermission("product.update") && (
            <Button type="primary" icon={<MdEdit />} onClick={() => onClickEdit(data)} size="small" />
          )}
          {isPermission("product.remove") && (
            <Button type="primary" danger icon={<MdDelete />} onClick={() => onClickDelete(data)} size="small" />
          )}
        </Space>
      ),
      width: 120,
    },
  ];

  return (
    <MainPage loading={loading}>
      <div className="product-page-container">
        {/* Dynamic Header Bar */}
        <div className="pageHeader" style={{
          background: 'linear-gradient(135deg, #4e54c8, #8f94fb)',
          padding: '16px 24px',
          borderRadius: '12px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <div className="flex items-center gap-4">
            <div className="khmer-title1" style={{ color: 'white', fontSize: '26px' }}>{t("products")}</div>
          </div>

          <div className="flex items-center gap-4">
            {isPermission("product.create") && (
              <Button
                type="primary"
                onClick={onClickAddBtn}
                icon={<MdOutlineCreateNewFolder />}
                size="large"
                style={{
                  height: '45px',
                  padding: '0 25px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: '#3b82f6',
                  borderColor: '#3b82f6'
                }}
              >
                {t("new")}
              </Button>
            )}
            <Radio.Group
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              buttonStyle="solid"
              size="large"
            >
              <Radio.Button value="my"><span className="khmer-title1">{t("my_items")}</span></Radio.Button>
              <Radio.Button value="group"><span className="khmer-title1">{t("group")}</span></Radio.Button>
            </Radio.Group>


          </div>
        </div>

        {/* Statistics and Search Row (Placed in the same row as cards) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6 border border-gray-100 dark:border-gray-700">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={12} sm={6} md={4}>
              <div className="text-center">
                <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{list.length}</div>
                <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-bold">{t("Total")}</div>
              </div>
            </Col>
            <Col xs={12} sm={6} md={4}>
              <div className="text-center border-l border-gray-100 dark:border-gray-700">
                <div className="text-2xl font-black text-green-600 dark:text-green-400">
                  {list.filter(item => item.user_id === getProfile().id).length}
                </div>
                <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-bold">{t("my_items")}</div>
              </div>
            </Col>
            <Col xs={24} sm={12} md={16} className="flex sm:justify-end items-center">
              <Input.Search
                onChange={(e) => setState((prev) => ({ ...prev, txtSearch: e.target.value }))}
                allowClear
                onSearch={getList}
                placeholder={t("search")}
                size="large"
                style={{ maxWidth: 450, width: '100%', borderRadius: '8px' }}
                prefix={<SearchOutlined />}
              />
            </Col>
          </Row>
        </div>

        <Table
          dataSource={filteredList}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 15 }}
          className="product-table-custom shadow-sm rounded-lg"
        />

        <Modal
          open={state.visibleModal}
          title={
            <div className="khmer-title1" style={{ color: '#e8c12f', fontSize: '20px' }}>
              {state.id ? t("edit_product") : t("new_product")}
            </div>
          }
          footer={null}
          onCancel={onCloseModal}
          width={600}
          centered
        >
          <Form layout="vertical" onFinish={onFinish} form={form}>
            <Form.Item name="name" label={<div className="khmer-title1">{t("product_name")}</div>} rules={[{ required: true }]}>
              <Input placeholder={t("product_name")} size="large" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="category_id" label={<div className="khmer-title1">{t("category")}</div>} rules={[{ required: true }]}>
                  <Select placeholder={t("Select category")} options={config?.category} size="large" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="unit" label={<div className="khmer-title1">{t("unit")}</div>} rules={[{ required: true }]}>
                  <Select placeholder={t("Select unit")} options={config?.unit} size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="actual_price" label={<div className="khmer-title1">{t("actual_price_label")}</div>} rules={[{ required: true }]}>
                  <Input type="number" step="0.01" prefix="$" size="large" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="size" label={<div className="khmer-title1">{t("size")}</div>}>
                  <Input placeholder="e.g. 1L, 5L, Small" size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="status" label={<div className="khmer-title1">{t("status")}</div>}>
              <Select size="large" options={[{ label: t('active'), value: 1 }, { label: t('inactive'), value: 0 }]} />
            </Form.Item>

            <div className="flex justify-end gap-3 mt-4">
              <Button onClick={onCloseModal} size="large">{t("cancel")}</Button>
              <Button type="primary" htmlType="submit" size="large" className="bg-blue-600">{t("save")}</Button>
            </div>
          </Form>
        </Modal>

        {/* Mobile Card View (Hidden by default, used for small screens) */}
        <style>{`
        @media (max-width: 1024px) {
          .hidden.lg\\:block { display: none !important; }
          .block.lg\\:hidden { display: block !important; }
        }
      `}</style>
      </div>
    </MainPage>
  );
}

export default ProductPage;