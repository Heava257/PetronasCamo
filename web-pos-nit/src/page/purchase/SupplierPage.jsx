// ✅ IMPROVED SupplierPage.jsx - Responsive table with better organization

import React, { useEffect, useState } from "react";
import { request } from "../../util/helper";
import MainPage from "../../component/layout/MainPage";
import { Button, Form, Input, message, Modal, Space, Table, Card, Typography, Row, Col, Select, Tag, Divider, Tooltip } from "antd";
import dayjs from "dayjs";
import { MdOutlineCreateNewFolder } from "react-icons/md";
import { EyeOutlined, EditOutlined, DeleteOutlined, SearchOutlined, EyeInvisibleOutlined, PhoneOutlined, MailOutlined, EnvironmentOutlined, GlobalOutlined } from '@ant-design/icons';
import { useTranslation } from "../../locales/TranslationContext";

const { Text, Title } = Typography;
const { Option } = Select;

function SupplierPage() {
  const [form] = Form.useForm();
  const { t, language } = useTranslation(); 
  
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
      'diesel': 'ម៉ាស៊ូត (Diesel)',
      'gasoline': 'សាំង (Gasoline)',
      'lpg': 'LPG',
      'super': 'Super'
    };
    return fuelTypes[type] || type;
  };

  // Mobile Supplier Card Component
  const SupplierMobileCard = ({ supplier, index }) => {
    const isActive = supplier.is_active === 1;
    
    return (
      <Card 
        className={`mb-3 shadow-sm hover:shadow-md transition-all duration-200 ${
          isActive ? 'bg-white dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-900 opacity-75'
        } border border-gray-200 dark:border-gray-700`}
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
                <Tag color="red" className="text-xs">Inactive</Tag>
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
              Fuel Types:
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
              Credit Terms: <span className="font-medium text-gray-700 dark:text-gray-300">{supplier.credit_terms}</span>
            </Text>
          </div>
        )}

        <Divider className="my-3" />

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {dayjs(supplier.create_at).format("DD/MM/YYYY")}
          </span>
          <Space size="small">
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onClickBtnEdit(supplier)}
              disabled={!isActive}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {t("EDIT")}
            </Button>
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => onClickBtnDelete(supplier)}
              disabled={!isActive}
            >
              {t("DELETE")}
            </Button>
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
      title: t("NO"),
      width: 60,
      fixed: 'left',
      align: 'center',
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
      fixed: 'left',
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
      render: (name) => (
        <Text strong className="text-gray-900 dark:text-white">
          {name}
        </Text>
      ),
    },
    {
      key: "contact",
      title: "Contact Info",
      width: 250,
      render: (_, record) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <PhoneOutlined className="text-blue-500" />
            <a href={`tel:${record.tel}`} className="text-gray-700 dark:text-gray-300 hover:text-blue-600">
              {record.tel}
            </a>
          </div>
          <div className="flex items-center gap-2">
            <MailOutlined className="text-green-500" />
            <Tooltip title={record.email}>
              <a href={`mailto:${record.email}`} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 truncate block max-w-[200px]">
                {record.email}
              </a>
            </Tooltip>
          </div>
        </div>
      ),
    },
    {
      key: "address",
      title: t("address"),
      dataIndex: "address",
      width: 200,
      render: (address) => (
        <div className="flex items-start gap-2">
          <EnvironmentOutlined className="text-red-500 mt-1" />
          <Text className="text-gray-700 dark:text-gray-300">
            {address}
          </Text>
        </div>
      ),
    },
    {
      key: "fuel_types",
      title: "Fuel Types",
      dataIndex: "fuel_types",
      width: 180,
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
      title: "Credit Terms",
      dataIndex: "credit_terms",
      width: 120,
      align: 'center',
      render: (credit_terms) => (
        <Tag color="orange" className="font-medium">
          {credit_terms || '-'}
        </Tag>
      ),
    },
    {
      key: "contact_person",
      title: "Contact Person",
      dataIndex: "contact_person",
      width: 150,
      render: (contact_person) => (
        <Text className="text-gray-700 dark:text-gray-300">
          {contact_person || '-'}
        </Text>
      ),
    },
    {
      key: "website",
      title: t("website"),
      dataIndex: "website",
      width: 150,
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
      width: 250,
      fixed: 'right',
      align: 'center',
      render: (value, data) => (
        <Space size="small">
          <Tooltip title={t("EDIT")}>
            <Button 
              type="primary" 
              size="small"
              icon={<EditOutlined />}
              onClick={() => onClickBtnEdit(data)}
              disabled={data.is_active === 0}
            />
          </Tooltip>
          <Tooltip title={t("DELETE")}>
            <Button 
              type="primary" 
              danger 
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => onClickBtnDelete(data)}
              disabled={data.is_active === 0}
            />
          </Tooltip>
          <Tooltip title={data.is_active === 1 ? t("Deactivate") : t("Activate")}>
            <Button 
              type="default"
              size="small"
              onClick={() => toggleSupplierStatus(data)}
              icon={data.is_active === 1 ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <MainPage loading={state.loading}>
      <div className="px-2 sm:px-4 lg:px-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            {/* Title */}
            <div className="flex-1">
              <Title level={3} className="mb-2 text-gray-900 dark:text-white flex items-center gap-2">
                <MdOutlineCreateNewFolder className="text-blue-600" />
                {t("Supplier")}
              </Title>
              <Text className="text-gray-600 dark:text-gray-400">
                Manage your supplier database and contacts
              </Text>
            </div>

            {/* New Button */}
            <Button 
              type="primary" 
              onClick={openModal} 
              icon={<MdOutlineCreateNewFolder />}
              size="large"
              className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 border-0 shadow-lg"
            >
              {t("NEW")}
            </Button>
          </div>

          {/* Search Bar */}
          <Input.Search
            onChange={(value) =>
              setState((p) => ({ ...p, txtSearch: value.target.value }))
            }
            allowClear
            onSearch={getList}
            placeholder={t("Search")}
            size="large"
            prefix={<SearchOutlined />}
            className="max-w-md"
          />

          {/* Statistics */}
          <Divider className="my-4" />
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Card className="text-center bg-white dark:bg-gray-800 border-0 shadow-sm">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {state.list.length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t("Total Suppliers")}
                </div>
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card className="text-center bg-white dark:bg-gray-800 border-0 shadow-sm">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {filteredList.length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t("Filtered Results")}
                </div>
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card className="text-center bg-white dark:bg-gray-800 border-0 shadow-sm">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {state.list.filter(s => s.is_active === 1).length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Active
                </div>
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card className="text-center bg-white dark:bg-gray-800 border-0 shadow-sm">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {state.list.filter(s => s.is_active === 0).length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Inactive
                </div>
              </Card>
            </Col>
          </Row>
        </div>

        {/* Form Modal */}
        <Modal
          open={state.visible}
          title={
            <div className="flex items-center gap-2">
              <MdOutlineCreateNewFolder className="text-blue-600" />
              <span className="text-lg font-semibold">
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
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <Title level={5} className="mb-4 text-blue-600 dark:text-blue-400">
                    Basic Information
                  </Title>
                  
                  <Form.Item
                    name="name"
                    label={<span className="font-medium">{t("name")}</span>}
                    rules={[{ required: true, message: t("Name is required!") }]}
                  >
                    <Input placeholder={t("name")} size="large" />
                  </Form.Item>

                  <Form.Item
                    name="code"
                    label={<span className="font-medium">{t("code")}</span>}
                    rules={[{ required: true, message: t("Code is required!") }]}
                  >
                    <Input placeholder={t("code")} size="large" />
                  </Form.Item>

                  <Form.Item
                    name="tel"
                    label={<span className="font-medium">{t("telephone")}</span>}
                    rules={[{ required: true, message: t("Tel is required!") }]}
                  >
                    <Input prefix={<PhoneOutlined />} placeholder={t("telephone")} size="large" />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    label={<span className="font-medium">{t("email")}</span>}
                    rules={[
                      { required: true, message: t("Email is required!") },
                      { type: 'email', message: t("Please enter a valid email!") }
                    ]}
                  >
                    <Input prefix={<MailOutlined />} placeholder={t("email")} size="large" />
                  </Form.Item>

                  <Form.Item
                    name="address"
                    label={<span className="font-medium">{t("address")}</span>}
                    rules={[{ required: true, message: t("Address is required!") }]}
                  >
                    <Input.TextArea prefix={<EnvironmentOutlined />} placeholder={t("address")} size="large" rows={3} />
                  </Form.Item>

                  <Form.Item
                    name="website"
                    label={<span className="font-medium">{t("Website")}</span>}
                    rules={[
                      { required: true, message: t("Website is required!") },
                      { type: 'url', message: t("Please enter a valid URL!") }
                    ]}
                  >
                    <Input prefix={<GlobalOutlined />} placeholder="https://example.com" size="large" />
                  </Form.Item>
                </div>
              </Col>

              {/* Right Column */}
              <Col xs={24} md={12}>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <Title level={5} className="mb-4 text-green-600 dark:text-green-400">
                    Business Details
                  </Title>
                  
                  <Form.Item
                    name="fuel_types"
                    label={<span className="font-medium">Fuel Types</span>}
                    rules={[{ required: true, message: "Fuel types are required!" }]}
                  >
                    <Select
                      mode="multiple"
                      placeholder="Select fuel types..."
                      size="large"
                      options={[
                        { label: 'ម៉ាស៊ូត (Diesel)', value: 'diesel' },
                        { label: 'សាំង (Gasoline)', value: 'gasoline' },
                        { label: 'LPG', value: 'lpg' },
                        { label: 'Super', value: 'super' },
                      ]}
                    />
                  </Form.Item>

                  <Form.Item
                    name="credit_terms"
                    label={<span className="font-medium">Credit Terms</span>}
                    rules={[{ required: true, message: "Credit terms are required!" }]}
                  >
                    <Select placeholder="Select credit terms..." size="large">
                      <Option value="7_days">7 ថ្ងៃ (7 days)</Option>
                      <Option value="15_days">15 ថ្ងៃ (15 days)</Option>
                      <Option value="30_days">30 ថ្ងៃ (30 days)</Option>
                      <Option value="45_days">45 ថ្ងៃ (45 days)</Option>
                      <Option value="60_days">60 ថ្ងៃ (60 days)</Option>
                      <Option value="90_days">90 ថ្ងៃ (90 days)</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="contact_person"
                    label={<span className="font-medium">Contact Person</span>}
                    rules={[{ required: true, message: "Contact person is required!" }]}
                  >
                    <Input placeholder="Enter contact person name" size="large" />
                  </Form.Item>

                  <Form.Item
                    name="payment_method"
                    label={<span className="font-medium">Payment Method</span>}
                  >
                    <Select placeholder="Select payment method..." size="large">
                      <Option value="cash">💵 Cash</Option>
                      <Option value="check">📝 Check</Option>
                      <Option value="transfer">🏦 Bank Transfer</Option>
                      <Option value="online">💳 Online Payment</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="note"
                    label={<span className="font-medium">Additional Notes</span>}
                  >
                    <Input.TextArea 
                      placeholder="Enter additional notes or special requirements..." 
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
              <span className="text-lg font-semibold">
                {t("Supplier Details")}
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
                    ⚠️ This supplier is currently inactive
                  </Text>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                {/* Basic Info */}
                <Card className="bg-gray-50 dark:bg-gray-900 border-0">
                  <Title level={5} className="mb-3 text-blue-600 dark:text-blue-400">
                    Basic Information
                  </Title>
                  
                  <Space direction="vertical" className="w-full" size="middle">
                    <div>
                      <Text className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                        {t("Name")}
                      </Text>
                      <Text className="text-base font-semibold text-gray-900 dark:text-white">
                        {selectedSupplier.name}
                      </Text>
                    </div>

                    <div>
                      <Text className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                        {t("Code")}
                      </Text>
                      <Tag color="blue" className="font-medium">
                        {selectedSupplier.code}
                      </Tag>
                    </div>

                    <div>
                      <Text className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                        {t("Tel")}
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
                        {t("Email")}
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
                        {t("Address")}
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
        <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <Table
            rowClassName={(record, index) => 
              `supplier-row ${record.is_active === 0 ? 'inactive-row' : ''} ${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'}`
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

      <style jsx>{`
        .supplier-row {
          transition: all 0.3s ease;
        }
        
        .supplier-row:hover {
          background-color: rgba(59, 130, 246, 0.08) !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        
        .inactive-row {
          opacity: 0.6;
          background-color: rgba(229, 231, 235, 0.5) !important;
        }
        
        .dark .supplier-row:hover {
          background-color: rgba(59, 130, 246, 0.15) !important;
        }
        
        .ant-table-thead > tr > th {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          color: white !important;
          font-weight: 600 !important;
          text-align: center !important;
        }
        
        .ant-table-tbody > tr > td {
          border-bottom: 1px solid #e5e7eb;
        }
        
        .dark .ant-table-tbody > tr > td {
          border-bottom: 1px solid #374151;
        }
        
        @media (max-width: 768px) {
          .ant-modal-body {
            padding: 16px;
          }
        }
      `}</style>
    </MainPage>
  );
}

export default SupplierPage;