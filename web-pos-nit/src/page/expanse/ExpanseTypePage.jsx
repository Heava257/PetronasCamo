import { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Space,
  Table,
  Card,
  Typography,
  Row,
  Col,
  Statistic,
} from "antd";
import { isPermission, request } from "../../util/helper";
import { MdDelete, MdEdit, MdOutlineCreateNewFolder } from "react-icons/md";
import { EyeOutlined, TagOutlined } from '@ant-design/icons';
import MainPage from "../../component/layout/MainPage";
import { FiSearch } from "react-icons/fi";
import { useTranslation } from "../../locales/TranslationContext";

const { Text, Title } = Typography;

function ExpanseTypePage() {
  const [formRef] = Form.useForm();
  const { t } = useTranslation();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState({
    visibleModal: false,
    id: null,
    txtSearch: "",
  });
  const [selectedType, setSelectedType] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

  useEffect(() => {
    getList();
  }, []);

  const getList = async () => {
    setLoading(true);
    const param = {
      txtSearch: state.txtSearch,
    };
    const res = await request("expense_type", "get", param);
    setLoading(false);
    if (res && res.success) {
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
      code: data.code,
    });
  };

  const onClickDelete = async (data) => {
    Modal.confirm({
      title: t("Delete"),
      content: t("Are you sure to remove?"),
      okText: t("Confirm"),
      onOk: async () => {
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
      code: values.code,
    };

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

  const showDetailModal = (type) => {
    setSelectedType(type);
    setIsDetailModalVisible(true);
  };

  const handleDetailModalClose = () => {
    setIsDetailModalVisible(false);
    setSelectedType(null);
  };

  // Filter data based on search
  const filteredList = list.filter(type => {
    const searchLower = state.txtSearch.toLowerCase();
    return (
      type.name?.toLowerCase().includes(searchLower) ||
      type.code?.toLowerCase().includes(searchLower)
    );
  });

  // Mobile Expense Type Card Component
  const ExpenseTypeMobileCard = ({ type, index }) => {
    return (
      <Card
        className="mb-3 shadow-sm hover:shadow-md transition-shadow duration-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        bodyStyle={{ padding: '16px' }}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                #{index + 1}
              </span>
              <span className="px-2 py-1 text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded">
                {type.code}
              </span>
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <TagOutlined className="text-blue-500" />
              {type.name}
            </h3>
          </div>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => showDetailModal(type)}
            className="text-blue-500 dark:text-blue-400"
          />
        </div>

        <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
          {isPermission("expanse_type.update") && (
            <Button
              type="primary"
              size="small"
              icon={<MdEdit />}
              onClick={() => onClickEdit(type)}
              className="flex-1 bg-blue-500 hover:bg-blue-600"
            >
              {t("EDIT")}
            </Button>
          )}
          {isPermission("expanse_type.remove") && (
            <Button
              danger
              size="small"
              icon={<MdDelete />}
              onClick={() => onClickDelete(type)}
              className="flex-1"
            >
              {t("DELETE")}
            </Button>
          )}
        </div>
      </Card>
    );
  };

  const columns = [
    {
      key: "no",
      title: t("No"),
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      key: "name",
      title: t("Name"),
      dataIndex: "name",
    },
    {
      key: "code",
      title: t("Code"),
      dataIndex: "code",
      render: (code) => (
        <span className="px-2 py-1 text-sm font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded">
          {code}
        </span>
      ),
    },
    {
      key: "action",
      title: t("Action"),
      align: "center",
      width: 150,
      render: (_, record) => (
        <Space>
          {isPermission("expanse_type.update") && (
            <Button
              type="primary"
              size="small"
              icon={<MdEdit />}
              onClick={() => onClickEdit(record)}
            />
          )}
          {isPermission("expanse_type.remove") && (
            <Button
              type="primary"
              danger
              size="small"
              icon={<MdDelete />}
              onClick={() => onClickDelete(record)}
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <MainPage loading={loading}>
      <div className="px-2 sm:px-4 lg:px-6">
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Title and Search */}
            <div className="flex-1">
              <Title level={4} className="mb-3 lg:mb-2 text-gray-900 dark:text-white">
                {t("Expense Type Management")}
              </Title>
              <Space direction="vertical" size="middle" className="w-full lg:w-auto">
                <Space wrap className="w-full">
                  <Input.Search
                    onChange={(e) =>
                      setState((p) => ({ ...p, txtSearch: e.target.value }))
                    }
                    allowClear
                    onSearch={getList}
                    placeholder={t("Search")}
                    size="large"
                    className="w-full sm:w-64"
                  />
                  <Button
                    type="primary"
                    onClick={getList}
                    icon={<FiSearch />}
                    size="large"
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    {t("Filter")}
                  </Button>
                </Space>
              </Space>
            </div>

            {/* New Button */}
            {isPermission("expanse_type.create") && (
              <Button
                type="primary"
                onClick={onClickAddBtn}
                icon={<MdOutlineCreateNewFolder />}
                size="large"
                className="w-full lg:w-auto bg-green-500 hover:bg-green-600"
              >
                {t("NEW")}
              </Button>
            )}
          </div>

          {/* Statistics */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={8} md={6}>
                <Statistic
                  title={<span className="text-gray-700 dark:text-gray-300 text-sm">{t("Total Types")}</span>}
                  value={list.length}
                  valueStyle={{
                    color: '#1e40af',
                    fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                    fontWeight: 'bold'
                  }}
                  prefix={<TagOutlined />}
                />
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Statistic
                  title={<span className="text-gray-700 dark:text-gray-300 text-sm">{t("Filtered Results")}</span>}
                  value={filteredList.length}
                  valueStyle={{
                    color: '#15803d',
                    fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                    fontWeight: 'bold'
                  }}
                />
              </Col>
            </Row>
          </div>
        </div>

        {/* Form Modal */}
        <Modal
          open={state.visibleModal}
          title={
            <span className="text-base sm:text-lg font-semibold">
              {t(formRef.getFieldValue("id") ? "Edit Expense Type" : "New Expense Type")}
            </span>
          }
          footer={null}
          onCancel={onCloseModal}
          width="95%"
          style={{ maxWidth: '600px', top: 20 }}
        >
          <Form layout="vertical" onFinish={onFinish} form={formRef}>
            <Form.Item name="id" hidden>
              <Input />
            </Form.Item>

            <Form.Item
              name="name"
              label={<span className="font-medium">{t("Name")}</span>}
              rules={[{ required: true, message: t("Name is required") }]}
            >
              <Input placeholder={t("Enter Name")} size="large" />
            </Form.Item>

            <Form.Item
              name="code"
              label={<span className="font-medium">{t("Code")}</span>}
              rules={[{ required: true, message: t("Code is required") }]}
            >
              <Input placeholder={t("Enter Code")} size="large" />
            </Form.Item>

            <Form.Item className="mb-0">
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                <Button onClick={onCloseModal} size="large" block className="sm:w-auto">
                  {t("Cancel")}
                </Button>
                <Button type="primary" htmlType="submit" size="large" block className="sm:w-auto">
                  {t(formRef.getFieldValue("id") ? "Update" : "Save")}
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Modal>

        {/* Detail Modal for Mobile */}
        <Modal
          open={isDetailModalVisible}
          title={
            <span className="text-base sm:text-lg font-semibold">
              {t("Expense Type Details")}
            </span>
          }
          onCancel={handleDetailModalClose}
          footer={null}
          width="95%"
          style={{ maxWidth: '500px', top: 20 }}
        >
          {selectedType && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Text className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                    {t("Name")}
                  </Text>
                  <Text className="text-base font-semibold text-gray-900 dark:text-white block flex items-center gap-2">
                    <TagOutlined className="text-blue-500" />
                    {selectedType.name}
                  </Text>
                </div>

                <div>
                  <Text className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                    {t("Code")}
                  </Text>
                  <span className="inline-block px-3 py-1 text-sm font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded">
                    {selectedType.code}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                {isPermission("expanse_type.update") && (
                  <Button
                    type="primary"
                    icon={<MdEdit />}
                    onClick={() => {
                      handleDetailModalClose();
                      onClickEdit(selectedType);
                    }}
                    block
                    size="large"
                  >
                    {t("EDIT")}
                  </Button>
                )}
                {isPermission("expanse_type.remove") && (
                  <Button
                    danger
                    icon={<MdDelete />}
                    onClick={() => {
                      handleDetailModalClose();
                      onClickDelete(selectedType);
                    }}
                    block
                    size="large"
                  >
                    {t("DELETE")}
                  </Button>
                )}
              </div>
            </div>
          )}
        </Modal>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <Table
            rowClassName={(record, index) =>
              `pos-row ${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'}`
            }
            dataSource={filteredList}
            columns={columns}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `${t("Total")} ${total} ${t("items")}`,
            }}
            scroll={{ x: true }}
            rowKey="id"
          />
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500 dark:text-gray-400">{t("Loading...")}</div>
            </div>
          ) : filteredList.length > 0 ? (
            <div className="space-y-3">
              {filteredList.map((type, index) => (
                <ExpenseTypeMobileCard
                  key={type.id}
                  type={type}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <Card className="text-center py-8 bg-white dark:bg-gray-800">
              <Text className="text-gray-500 dark:text-gray-400">
                {t("No data available")}
              </Text>
            </Card>
          )}
        </div>
      </div>

      <style jsx>{`
        .pos-row {
          transition: background-color 0.2s;
        }
        .pos-row:hover {
          background-color: rgba(59, 130, 246, 0.1) !important;
        }
        .dark .pos-row:hover {
          background-color: rgba(59, 130, 246, 0.2) !important;
        }
      `}</style>
    </MainPage>
  );
}

export default ExpanseTypePage;