// ✅ IMPROVED SupplierPage.jsx - Responsive table with better organization

import React, { useEffect, useState } from "react";
import { isPermission, request } from "../../util/helper";
import MainPage from "../../component/layout/MainPage";
import { Button, Form, Input, message, Modal, Space, Table, Card, Typography, Row, Col, Select, Tag, Divider, Tooltip } from "antd";
import dayjs from "dayjs";
import { MdOutlineCreateNewFolder } from "react-icons/md";
import { EyeOutlined, EditOutlined, DeleteOutlined, SearchOutlined, EyeInvisibleOutlined, PhoneOutlined, MailOutlined, EnvironmentOutlined, GlobalOutlined } from '@ant-design/icons';
import { useTranslation } from "../../locales/TranslationContext";
import { useSettings } from "../../settings/SettingsContext"; // ✅ Added for theme detection

const { Text, Title } = Typography;
const { Option } = Select;

// ✅ Add Global Style Override for Supplier Page
const supplierStyles = `
  .supplier-main-content .ant-card,
  .supplier-table-card {
    background: rgba(255, 255, 255, 0.03) !important;
    border: 1px solid rgba(255, 215, 0, 0.2) !important;
    backdrop-filter: blur(15px);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2) !important;
  }
  .supplier-main-content .ant-table {
    background: transparent !important;
  }
  .supplier-main-content .ant-table-thead > tr > th {
    background: rgba(255, 215, 0, 0.1) !important;
    color: #e8c12f !important;
    border-bottom: 2px solid rgba(255, 215, 0, 0.3) !important;
    text-transform: uppercase;
    font-size: 11px;
    letter-spacing: 0.05em;
    backdrop-filter: blur(10px);
  }
  .supplier-main-content .ant-table-tbody > tr > td {
    background: transparent !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03) !important;
    color: #cbd5e1 !important;
  }
  .supplier-main-content .ant-table-tbody > tr:hover > td {
    background: rgba(255, 215, 0, 0.02) !important;
  }
  .supplier-main-content .ant-input, 
  .supplier-main-content .ant-input-affix-wrapper {
    background: rgba(0, 0, 0, 0.3) !important;
    border: 1px solid rgba(255, 215, 0, 0.2) !important;
    color: #f8fafc !important;
  }
  .supplier-main-content .ant-input-search-button {
    background: transparent !important;
    border: 1px solid rgba(255, 215, 0, 0.3) !important;
    color: #e8c12f !important;
  }
  .supplier-main-content .ant-input-search-button:hover {
    background: rgba(232, 193, 47, 0.1) !important;
    color: #e8c12f !important;
  }
`;

function SupplierPage() {
  const [form] = Form.useForm();
  const { t, language } = useTranslation();
  const { settings } = useSettings(); // ✅ Get current settings
  const isAcledaGold = settings.templateId === "acledagold";

  const [state, setState] = useState({
    list: [],
    loading: false,
    visible: false,
    txtSearch: "",
  });

  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

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
      fuel_types: items.fuel_types ? items.fuel_types.split(',').map(type => type.trim()) : []
    });
    openModal();
  };

  const onClickBtnDelete = (items) => {
    Modal.confirm({
      title: t("delete_supplier"),
      content: t("confirm_delete_data"),
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
          message.success(t("delete_success"));
        } else {
          const errorMessage = res?.message || "";
          if (
            errorMessage.includes("Cannot delete or update a parent row") &&
            errorMessage.includes("foreign key constraint fails")
          ) {
            message.error(t("delete_error"));
          } else {
            message.error(t("cannot_delete_in_use"));
          }

          setState((p) => ({
            ...p,
            loading: false,
          }));
        }
      },
    });
  };

  const toggleSupplierStatus = async (supplier) => {
    const newStatus = supplier.is_active === 1 ? 0 : 1;
    const res = await request("supplier", "put", {
      id: supplier.id,
      is_active: newStatus
    });

    if (res && !res.error) {
      message.success(newStatus === 1 ? t("Activated successfully") : t("Deactivated successfully"));
      getList();
    }
  };

  const showDetailModal = (supplier) => {
    setSelectedSupplier(supplier);
    setIsDetailModalVisible(true);
  };

  const handleDetailModalClose = () => {
    setIsDetailModalVisible(false);
    setSelectedSupplier(null);
  };

  // Fuel type translation helper
  const getFuelTypeLabel = (type) => {
    const fuelTypes = {
      'diesel': t('fuel_diesel'),
      'gasoline': t('fuel_gasoline'),
      'lpg': t('fuel_lpg'),
      'super': t('fuel_super')
    };
    return fuelTypes[type] || type;
  };

  // Mobile Supplier Card Component
  const SupplierMobileCard = ({ supplier, index }) => {
    const isActive = supplier.is_active === 1;

    return (
      <Card
        className={`mb-3 shadow-sm hover:shadow-md transition-all duration-200 ${isActive ? 'bg-slate-800/40' : 'bg-slate-900/60 opacity-75'
          } border border-slate-700/50 backdrop-blur-sm`}
        bodyStyle={{ padding: '16px' }}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                #{index + 1}
              </span>
              <Tag color={isActive ? "blue" : "default"} className="font-medium">
                {supplier.code}
              </Tag>
              {!isActive && (
                <Tag color="red" className="text-xs">{t("inactive")}</Tag>
              )}
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
              {supplier.name}
            </h3>

            {/* Contact Info */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <PhoneOutlined className="text-blue-500" />
                <a href={`tel:${supplier.tel}`} className="hover:text-blue-600">
                  {supplier.tel}
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <MailOutlined className="text-green-500" />
                <a href={`mailto:${supplier.email}`} className="hover:text-blue-600 break-all">
                  {supplier.email}
                </a>
              </div>
            </div>
          </div>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => showDetailModal(supplier)}
            className="text-blue-500 dark:text-blue-400"
          />
        </div>

        {/* Fuel Types */}
        {supplier.fuel_types && (
          <div className="mb-2">
            <Text className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              {t("fuel_types")}:
            </Text>
            <div className="flex flex-wrap gap-1">
              {supplier.fuel_types.split(',').map((type, idx) => (
                <Tag key={idx} color="blue" className="text-xs">
                  {getFuelTypeLabel(type.trim())}
                </Tag>
              ))}
            </div>
          </div>
        )}

        {/* Credit Terms */}
        {supplier.credit_terms && (
          <div className="mb-2">
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {t("credit_terms")}: <span className="font-medium text-gray-700 dark:text-gray-300">{supplier.credit_terms}</span>
            </Text>
          </div>
        )}

        <Divider className="my-3" />

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {dayjs(supplier.create_at).format("DD/MM/YYYY")}
          </span>
          <Space size="small">
            {isPermission("supplier.update") && (
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onClickBtnEdit(supplier)}
                disabled={!isActive}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {t("edit")}
              </Button>
            )}
            {isPermission("supplier.remove") && (
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => onClickBtnDelete(supplier)}
                disabled={!isActive}
              >
                {t("delete")}
              </Button>
            )}
          </Space>
        </div>
      </Card>
    );
  };

  // Filter data based on search
  const filteredList = state.list.filter(supplier => {
    const searchLower = state.txtSearch.toLowerCase();
    return (
      supplier.name?.toLowerCase().includes(searchLower) ||
      supplier.code?.toLowerCase().includes(searchLower) ||
      supplier.tel?.toLowerCase().includes(searchLower) ||
      supplier.email?.toLowerCase().includes(searchLower) ||
      supplier.address?.toLowerCase().includes(searchLower) ||
      supplier.contact_person?.toLowerCase().includes(searchLower)
    );
  });

  // Enhanced desktop table columns with better organization
  const columns = [
    {
      key: "no",
      title: t("table_no"),
      width: 60,
      align: 'left',
      onHeaderCell: () => ({ style: { textAlign: 'center' } }),
      render: (_, __, index) => (
        <span className="font-semibold text-gray-700 dark:text-gray-300">
          {index + 1}
        </span>
      ),
    },
    {
      key: "code",
      title: t("code"),
      dataIndex: "code",
      width: 100,
      align: 'left',
      onHeaderCell: () => ({ style: { textAlign: 'center' } }),
      render: (code, record) => (
        <div className="flex items-center gap-2">
          <Tag color={record.is_active === 1 ? "blue" : "default"} className="font-medium">
            {code}
          </Tag>
          {record.is_active === 0 && (
            <Tag color="red" className="text-xs">Inactive</Tag>
          )}
        </div>
      ),
    },
    {
      key: "name",
      title: t("name"),
      dataIndex: "name",
      width: 200,
      align: 'left',
      onHeaderCell: () => ({ style: { textAlign: 'center' } }),
      render: (name) => (
        <Text strong className="text-gray-900 dark:text-white">
          {name}
        </Text>
      ),
    },
    {
      key: "contact",
      title: t("contact_info"),
      width: 250,
      align: 'left',
      onHeaderCell: () => ({ style: { textAlign: 'center' } }),
      render: (_, record) => (
        <div className="flex flex-col items-start py-1">
          <div className="flex items-center gap-2 mb-1">
            <PhoneOutlined style={{ color: isAcledaGold ? '#e8c12f' : 'var(--primary-color)', opacity: 0.8 }} />
            <a href={`tel:${record.tel}`} className="hover:text-blue-400 transition-colors font-medium" style={{ color: isAcledaGold ? 'var(--text-primary)' : 'inherit' }}>
              {record.tel}
            </a>
          </div>
          {record.email && (
            <div className="flex items-center gap-2">
              <MailOutlined className="text-blue-400" style={{ opacity: 0.8 }} />
              <Tooltip title={record.email}>
                <a href={`mailto:${record.email}`} className="text-slate-400 hover:text-blue-400 truncate block max-w-[180px] text-xs transition-colors">
                  {record.email}
                </a>
              </Tooltip>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "address",
      title: t("address"),
      dataIndex: "address",
      width: 200,
      align: 'left',
      onHeaderCell: () => ({ style: { textAlign: 'center' } }),
      render: (address) => (
        <div className="flex items-start gap-2">
          <EnvironmentOutlined className="text-red-500 mt-1" />
          <Text style={{ color: 'var(--text-secondary)' }}>
            {address}
          </Text>
        </div>
      ),
    },
    {
      key: "fuel_types",
      title: t("fuel_types"),
      dataIndex: "fuel_types",
      width: 180,
      align: 'left',
      onHeaderCell: () => ({ style: { textAlign: 'center' } }),
      render: (fuel_types) => (
        <div className="flex flex-wrap gap-1">
          {fuel_types ? fuel_types.split(',').map((type, index) => (
            <Tag key={index} color="blue" className="text-xs">
              {getFuelTypeLabel(type.trim())}
            </Tag>
          )) : <Text type="secondary">-</Text>}
        </div>
      ),
    },
    {
      key: "credit_terms",
      title: t("credit_terms"),
      dataIndex: "credit_terms",
      width: 120,
      align: 'left',
      onHeaderCell: () => ({ style: { textAlign: 'center' } }),
      render: (credit_terms) => (
        <Tag color="orange" className="font-medium">
          {credit_terms || '-'}
        </Tag>
      ),
    },
    {
      key: "contact_person",
      title: t("contact_person"),
      dataIndex: "contact_person",
      width: 150,
      align: 'center',
      render: (contact_person) => (
        <Text className="text-gray-700 dark:text-gray-300">
          {contact_person || '-'}
        </Text>
      ),
    },
    {
      key: "website",
      title: t("Website"),
      dataIndex: "website",
      width: 150,
      align: 'center',
      render: (website) => website ? (
        <div className="flex items-center gap-2">
          <GlobalOutlined className="text-purple-500" />
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 truncate block max-w-[120px]"
          >
            {website}
          </a>
        </div>
      ) : <Text type="secondary">-</Text>,
    },
    {
      key: "create_at",
      title: t("create_at"),
      dataIndex: "create_at",
      width: 120,
      align: 'center',
      render: (value) => (
        <Text className="text-gray-600 dark:text-gray-400">
          {dayjs(value).format("DD/MM/YYYY")}
        </Text>
      ),
    },
    {
      key: "action",
      title: t("action"),
      width: 200,
      align: 'center',
      render: (value, data) => (
        <Space size="small">
          {isPermission("supplier.update") && (
            <Tooltip title={t("edit")}>
              <Button
                type="primary"
                shape="circle"
                style={{ backgroundColor: '#e8c12f', borderColor: '#e8c12f' }}
                icon={<EditOutlined />}
                onClick={() => onClickBtnEdit(data)}
                disabled={data.is_active === 0}
              />
            </Tooltip>
          )}
          {isPermission("supplier.remove") && (
            <Tooltip title={t("delete")}>
              <Button
                type="primary"
                danger
                shape="circle"
                icon={<DeleteOutlined />}
                onClick={() => onClickBtnDelete(data)}
                disabled={data.is_active === 0}
              />
            </Tooltip>
          )}
          {isPermission("supplier.update") && (
            <Tooltip title={data.is_active === 1 ? t("Deactivate") : t("Activate")}>
              <Button
                type="default"
                shape="circle"
                onClick={() => toggleSupplierStatus(data)}
                icon={data.is_active === 1 ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <MainPage loading={state.loading}>
      {isAcledaGold && <style>{supplierStyles}</style>}
      <div className="supplier-main-content px-2 sm:px-4 lg:px-6 mt-4">
        {/* 1. Title & New Button Section */}
        <Card
          className="mb-4 shadow-lg backdrop-blur-md"
          bodyStyle={{ padding: '16px 24px' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <Title level={3} className="m-0 flex items-center gap-2" style={{ color: isAcledaGold ? '#e8c12f' : 'var(--primary-color)' }}>
                <MdOutlineCreateNewFolder className="text-blue-600" />
                {t("supplier_management")}
              </Title>
              <Text style={{ color: 'var(--text-secondary)' }}>
                {t("supplier_management_subtitle")}
              </Text>
            </div>

            {isPermission("supplier.create") && (
              <Button
                type="primary"
                onClick={openModal}
                icon={<MdOutlineCreateNewFolder />}
                size="large"
                style={{
                  backgroundColor: isAcledaGold ? '#e8c12f' : 'var(--primary-color)',
                  borderColor: isAcledaGold ? '#e8c12f' : 'var(--primary-color)',
                  color: isAcledaGold ? '#000' : 'var(--text-on-primary)',
                  height: '60px',
                  paddingLeft: '30px',
                  paddingRight: '30px',
                  fontSize: '16px',
                  fontWeight: '700'
                }}
                className="w-full sm:w-auto shadow-md flex items-center justify-center"
              >
                {t("new")}
              </Button>
            )}
          </div>
        </Card>

        {/* 2. Statistics Section */}
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={12} sm={6}>
            <Card
              className="shadow-sm backdrop-blur-sm"
              bodyStyle={{ padding: '12px 16px' }}
            >
              <div className="text-xs mb-1 text-left" style={{ color: 'var(--text-secondary)' }}>
                {t("total_suppliers")}
              </div>
              <div className="text-2xl font-bold text-center" style={{ color: 'var(--primary-color)' }}>
                {state.list.length}
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card
              className="shadow-sm backdrop-blur-sm"
              bodyStyle={{ padding: '12px 16px' }}
            >
              <div className="text-xs mb-1 text-left" style={{ color: 'var(--text-secondary)' }}>
                {t("filtered_results")}
              </div>
              <div className="text-2xl font-bold text-green-500 text-center">
                {filteredList.length}
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card
              className="shadow-sm backdrop-blur-sm"
              bodyStyle={{ padding: '12px 16px' }}
            >
              <div className="text-xs mb-1 text-left" style={{ color: 'var(--text-secondary)' }}>
                {t("active")}
              </div>
              <div className="text-2xl font-bold text-amber-500 text-center">
                {state.list.filter(s => s.is_active === 1).length}
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card
              className="shadow-sm backdrop-blur-sm"
              bodyStyle={{ padding: '12px 16px' }}
            >
              <div className="text-xs mb-1 text-left" style={{ color: 'var(--text-secondary)' }}>
                {t("inactive")}
              </div>
              <div className="text-2xl font-bold text-red-500 text-center">
                {state.list.filter(s => s.is_active === 0).length}
              </div>
            </Card>
          </Col>
        </Row>

        {/* 3. Search Bar Section (Search moved to below) */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <Input.Search
            onChange={(value) =>
              setState((p) => ({ ...p, txtSearch: value.target.value }))
            }
            allowClear
            onSearch={getList}
            placeholder={t("search_suppliers")}
            size="large"
            className="max-w-md shadow-lg rounded-lg overflow-hidden backdrop-blur-sm"
          />
          <div className="flex-1 border-b border-gray-200 dark:border-gray-700 hidden sm:block opacity-50"></div>
        </div>

        {/* Form Modal */}
        <Modal
          open={state.visible}
          title={
            <div className="flex items-center gap-2">
              <MdOutlineCreateNewFolder className="text-blue-600" />
              <span className="text-lg font-semibold" style={{ color: '#e8c12f' }}>
                {t(form.getFieldValue("id") ? "edit_supplier" : "new_supplier")}
              </span>
            </div>
          }
          onCancel={closeModal}
          footer={null}
          width="95%"
          style={{ maxWidth: '900px', top: 20 }}
          className="supplier-modal"
        >
          <Form layout="vertical" form={form} onFinish={onFinish}>
            <Row gutter={[16, 16]}>
              {/* Left Column */}
              <Col xs={24} md={12}>
                <div className="supplier-form-card p-4 rounded-lg">
                  <Title level={5} className="mb-4 text-blue-600 dark:text-blue-400">
                    {t("basic_info")}
                  </Title>

                  <Form.Item
                    name="name"
                    label={<span className="font-medium">{t("name")}</span>}
                    rules={[{ required: true, message: t("name_required") }]}
                  >
                    <Input placeholder={t("name")} size="large" />
                  </Form.Item>

                  <Form.Item
                    name="code"
                    label={<span className="font-medium">{t("code")}</span>}
                    rules={[{ required: true, message: t("code_required") }]}
                  >
                    <Input placeholder={t("code")} size="large" />
                  </Form.Item>

                  <Form.Item
                    name="tel"
                    label={<span className="font-medium">{t("telephone")}</span>}
                    rules={[{ required: true, message: t("tel_required") }]}
                  >
                    <Input prefix={<PhoneOutlined />} placeholder={t("telephone")} size="large" />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    label={<span className="font-medium">{t("email")}</span>}
                    rules={[
                      { required: true, message: t("please_input_email") },
                      { type: 'email', message: t("please_input_valid_email") }
                    ]}
                  >
                    <Input prefix={<MailOutlined />} placeholder={t("email")} size="large" />
                  </Form.Item>

                  <Form.Item
                    name="address"
                    label={<span className="font-medium">{t("address")}</span>}
                    rules={[{ required: true, message: t("address_required") }]}
                  >
                    <Input.TextArea prefix={<EnvironmentOutlined />} placeholder={t("address")} size="large" rows={3} />
                  </Form.Item>

                  <Form.Item
                    name="website"
                    label={<span className="font-medium">{t("Website")}</span>}
                    rules={[
                      { required: true, message: t("website_required") },
                      { type: 'url', message: t("Please enter a valid URL!") }
                    ]}
                  >
                    <Input prefix={<GlobalOutlined />} placeholder="https://example.com" size="large" />
                  </Form.Item>
                </div>
              </Col>

              {/* Right Column */}
              <Col xs={24} md={12}>
                <div className="supplier-form-card p-4 rounded-lg">
                  <Title level={5} className="mb-4 text-green-600 dark:text-green-400">
                    {t("business_details")}
                  </Title>

                  <Form.Item
                    name="fuel_types"
                    label={<span className="font-medium">{t("fuel_types")}</span>}
                    rules={[{ required: true, message: t("fuel_types_required") }]}
                  >
                    <Select
                      mode="multiple"
                      placeholder={t("select_fuel_types")}
                      size="large"
                      options={[
                        { label: t('fuel_diesel'), value: 'diesel' },
                        { label: t('fuel_gasoline'), value: 'gasoline' },
                        { label: t('fuel_lpg'), value: 'lpg' },
                        { label: t('fuel_super'), value: 'super' },
                      ]}
                    />
                  </Form.Item>

                  <Form.Item
                    name="credit_terms"
                    label={<span className="font-medium">{t("credit_terms")}</span>}
                    rules={[{ required: true, message: t("credit_terms_required") }]}
                  >
                    <Select placeholder={t("credit_terms")} size="large">
                      <Option value="7_days">{t("day_7")}</Option>
                      <Option value="15_days">{t("day_15")}</Option>
                      <Option value="30_days">{t("day_30")}</Option>
                      <Option value="45_days">{t("day_45")}</Option>
                      <Option value="60_days">{t("day_60")}</Option>
                      <Option value="90_days">{t("day_90")}</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="contact_person"
                    label={<span className="font-medium">{t("contact_person")}</span>}
                    rules={[{ required: true, message: t("contact_person_required") }]}
                  >
                    <Input placeholder={t("enter_contact_person")} size="large" />
                  </Form.Item>

                  <Form.Item
                    name="payment_method"
                    label={<span className="font-medium">{t("payment_method")}</span>}
                  >
                    <Select placeholder={t("payment_method")} size="large">
                      <Option value="cash">💵 {t("cash")}</Option>
                      <Option value="check">📝 {t("check")}</Option>
                      <Option value="transfer">🏦 {t("transfer")}</Option>
                      <Option value="online">💳 {t("online")}</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="note"
                    label={<span className="font-medium">{t("additional_notes")}</span>}
                  >
                    <Input.TextArea
                      placeholder={t("note")}
                      rows={4}
                      size="large"
                    />
                  </Form.Item>
                </div>
              </Col>
            </Row>

            {/* Buttons */}
            <Form.Item className="mb-0 mt-4">
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                <Button onClick={closeModal} size="large" className="sm:w-auto">
                  {t("cancel")}
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  className="sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 border-0"
                >
                  {t(form.getFieldValue("id") ? "edit" : "save")}
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Modal>

        {/* Detail Modal for Mobile */}
        <Modal
          open={isDetailModalVisible}
          title={
            <div className="flex items-center gap-2">
              <EyeOutlined className="text-blue-600" />
              <span className="text-lg font-semibold" style={{ color: '#e8c12f' }}>
                {t("supplier_details")}
              </span>
            </div>
          }
          onCancel={handleDetailModalClose}
          footer={null}
          width="95%"
          style={{ maxWidth: '600px', top: 20 }}
        >
          {selectedSupplier && (
            <div className="space-y-4">
              {/* Status Badge */}
              {selectedSupplier.is_active === 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <Text className="text-red-600 dark:text-red-400 font-medium">
                    ⚠️ {t("inactive_supplier_warning")}
                  </Text>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                {/* Basic Info */}
                <Card className="bg-gray-50 dark:bg-gray-900 border-0">
                  <Title level={5} className="mb-3 text-blue-600 dark:text-blue-400">
                    {t("basic_info")}
                  </Title>

                  <Space direction="vertical" className="w-full" size="middle">
                    <div>
                      <Text className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                        {t("name")}
                      </Text>
                      <Text className="text-base font-semibold text-gray-900 dark:text-white">
                        {selectedSupplier.name}
                      </Text>
                    </div>

                    <div>
                      <Text className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                        {t("code")}
                      </Text>
                      <Tag color="blue" className="font-medium">
                        {selectedSupplier.code}
                      </Tag>
                    </div>

                    <div>
                      <Text className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                        {t("telephone")}
                      </Text>
                      <div className="flex items-center gap-2">
                        <PhoneOutlined className="text-blue-500" />
                        <a href={`tel:${selectedSupplier.tel}`} className="text-blue-500 hover:text-blue-700">
                          {selectedSupplier.tel}
                        </a>
                      </div>
                    </div>

                    <div>
                      <Text className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                        {t("email")}
                      </Text>
                      <div className="flex items-center gap-2">
                        <MailOutlined className="text-green-500" />
                        <a href={`mailto:${selectedSupplier.email}`} className="text-blue-500 hover:text-blue-700 break-all">
                          {selectedSupplier.email}
                        </a>
                      </div>
                    </div>

                    <div>
                      <Text className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                        {t("address")}
                      </Text>
                      <div className="flex items-start gap-2">
                        <EnvironmentOutlined className="text-red-500 mt-1" />
                        <Text className="text-gray-900 dark:text-white">
                          {selectedSupplier.address}
                        </Text>
                      </div>
                    </div>

                    {selectedSupplier.website && (
                      <div>
                        <Text className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                          {t("Website")}
                        </Text>
                        <div className="flex items-center gap-2">
                          <GlobalOutlined className="text-purple-500" />
                          <a
                            href={selectedSupplier.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700 break-all"
                          >
                            {selectedSupplier.website}
                          </a>
                        </div>
                      </div>
                    )}
                  </Space>
                </Card>

                {/* Business Details */}
                <Card className="bg-gray-50 dark:bg-gray-900 border-0">
                  <Title level={5} className="mb-3 text-green-600 dark:text-green-400">
                    Business Details
                  </Title>

                  <Space direction="vertical" className="w-full" size="middle">
                    {selectedSupplier.fuel_types && (
                      <div>
                        <Text className="text-xs text-gray-500 dark:text-gray-400 block mb-2">
                          Fuel Types:
                        </Text>
                        <div className="flex flex-wrap gap-1">
                          {selectedSupplier.fuel_types.split(',').map((type, idx) => (
                            <Tag key={idx} color="blue">
                              {getFuelTypeLabel(type.trim())}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedSupplier.credit_terms && (
                      <div>
                        <Text className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                          Credit Terms:
                        </Text>
                        <Tag color="orange" className="font-medium">
                          {selectedSupplier.credit_terms}
                        </Tag>
                      </div>
                    )}

                    {selectedSupplier.contact_person && (
                      <div>
                        <Text className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                          Contact Person:
                        </Text>
                        <Text className="text-gray-900 dark:text-white">
                          {selectedSupplier.contact_person}
                        </Text>
                      </div>
                    )}

                    {selectedSupplier.note && (
                      <div>
                        <Text className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                          Notes:
                        </Text>
                        <Text className="text-gray-900 dark:text-white">
                          {selectedSupplier.note}
                        </Text>
                      </div>
                    )}
                  </Space>
                </Card>

                {/* Metadata */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Text className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                    {t("Created At")}
                  </Text>
                  <Text className="text-base font-medium text-gray-900 dark:text-white">
                    {dayjs(selectedSupplier.create_at).format("DD/MM/YYYY")}
                  </Text>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => {
                    handleDetailModalClose();
                    onClickBtnEdit(selectedSupplier);
                  }}
                  block
                  size="large"
                  disabled={selectedSupplier.is_active === 0}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {t("EDIT")}
                </Button>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    handleDetailModalClose();
                    onClickBtnDelete(selectedSupplier);
                  }}
                  block
                  size="large"
                  disabled={selectedSupplier.is_active === 0}
                >
                  {t("DELETE")}
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Desktop Table View */}
        <div className="hidden md:block supplier-table-card rounded-lg shadow-md overflow-hidden">
          <Table
            rowClassName={(record) =>
              `supplier-row ${record.is_active === 0 ? 'inactive-row' : ''}`
            }
            dataSource={filteredList}
            columns={columns}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `${t("Total")} ${total} ${t("items")}`,
              pageSizeOptions: ['10', '20', '50', '100'],
            }}
            scroll={{ x: 1800 }}
            rowKey="id"
            bordered
          />
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden">
          {state.loading ? (
            <Card className="text-center py-8 bg-white dark:bg-gray-800">
              <div className="text-gray-500 dark:text-gray-400">{t("Loading...")}</div>
            </Card>
          ) : filteredList.length > 0 ? (
            <div className="space-y-3">
              {filteredList.map((supplier, index) => (
                <SupplierMobileCard
                  key={supplier.id}
                  supplier={supplier}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <Card className="text-center py-8 bg-white dark:bg-gray-800">
              <div className="text-gray-500 dark:text-gray-400">
                {t("No data available")}
              </div>
            </Card>
          )}
        </div>
      </div>


    </MainPage>
  );
}

export default SupplierPage;