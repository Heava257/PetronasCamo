import React, { useEffect, useState } from "react";
import {
  Button,
  Col,
  Form,
  Input,
  message,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  DatePicker,
  Checkbox,
  Tooltip
} from "antd";
import { CiSearch } from "react-icons/ci";
import { MdOutlineCreateNewFolder, MdSecurity } from "react-icons/md";
import { IoPersonAddSharp } from "react-icons/io5";
import { MdDelete, MdEdit } from "react-icons/md";
import { LuUserRoundSearch } from "react-icons/lu";
import { formatDateClient, isPermission, request } from "../../util/helper";
import MainPage from "../../component/layout/MainPage";
import { getProfile } from "../../store/profile.store";
import { configStore } from "../../store/configStore";
import { useTranslation } from "../../locales/TranslationContext";
import dayjs from "dayjs";
import "./customer.css"

function CustomerPage() {
  const { config } = configStore();
  const { t } = useTranslation(); // Add this
  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [profile, setProfile] = useState(null);
  const [deletePermissionModalVisible, setDeletePermissionModalVisible] = useState(false);

  const [filteredList, setFilteredList] = useState([]);
  const [blockedUserIds, setBlockedUserIds] = useState(() => {
    const saved = localStorage.getItem("blocked_user_ids");
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedPermissionType, setSelectedPermissionType] = useState("delete");
  const [blockedPermissions, setBlockedPermissions] = useState(() => {
    const saved = localStorage.getItem("blocked_permissions");
    return saved ? JSON.parse(saved) : { delete: [], create: [] };
  });

  const [state, setState] = useState({
    visibleModal: false,
    id: null,
    txtSearch: "",
    user_id: null,
    isEditing: false,
    visibleAssignModal: false,
    customerTypeFilter: null,
  });

  useEffect(() => {
    const profileData = getProfile();
    if (profileData && profileData.id) {
      setProfile(profileData);
      setState((prev) => ({ ...prev, user_id: profileData.id }));
      setPermissionsLoaded(true);
    } else {
      message.error(t("មិនមានលេខសម្គាល់អ្នកប្រើប្រាស់។ សូមចូលម្តងទៀត។"));
    }
  }, [t]);

  useEffect(() => {
    if (state.user_id) {
      getList();
    }
  }, [state.user_id]);

  useEffect(() => {
    if (state.customerTypeFilter) {
      const filtered = list.filter(item => item.type === state.customerTypeFilter);
      setFilteredList(filtered);
    } else {
      setFilteredList(list);
    }
  }, [list, state.customerTypeFilter]);

  useEffect(() => {
    const saved = localStorage.getItem("blocked_user_ids");
    if (saved) {
      setBlockedUserIds(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("blocked_permissions");
    if (saved) {
      setBlockedPermissions(JSON.parse(saved));
    }
  }, []);

  const handleCheckboxChange = (checkedValues) => {
    const updated = {
      ...blockedPermissions,
      [selectedPermissionType]: checkedValues
    };
    setBlockedPermissions(updated);
    localStorage.setItem("blocked_permissions", JSON.stringify(updated));
  };

  const onChangeBlockedUsers = (checkedValues) => {
    setBlockedUserIds(checkedValues);
    localStorage.setItem("blocked_user_ids", JSON.stringify(checkedValues));
  };

  const getList = async () => {
    if (!state.user_id) {
      message.error(t("តម្រូវឱ្យមានលេខសម្គាល់អ្នកប្រើប្រាស់!"));
      return;
    }
    const param = {
      txtSearch: state.txtSearch || "",
      type: state.customerTypeFilter || "",
    };
    try {
      setLoading(true);
      const { id } = getProfile();
      if (!id) return;
      const res = await request(`customer/my-group`, "get", param);
      setLoading(false);
      if (res?.success) {
        setList(res.list || []);
      } else {
        message.error(res?.message || t("បរាជ័យក្នុងការទាញយកបញ្ជីអតិថិជន"));
      }
    } catch (error) {
      setLoading(false);
      console.error("Error fetching customer list:", error);
      message.error(t("បរាជ័យក្នុងការទាញយកបញ្ជីអតិថិជន"));
    }
  };

  const onClickAddBtn = () => {
    setState((prev) => ({
      ...prev,
      visibleModal: true,
      isEditing: false,
      id: null,
    }));
    form.resetFields();
  };

  const phoneValidationRules = [
    { required: true, message: t("តម្រូវឱ្យមានលេខទូរស័ព្ទ") },
    {
      pattern: /^[0-9+\-\s()]+$/,
      message: t("លេខទូរស័ព្ទត្រូវតែជាលេខ")
    },
    {
      min: 8,
      max: 15,
      message: t("លេខទូរស័ព្ទត្រូវតែមានពី 8 ដល់ 15 ខ្ទង់")
    }
  ];

  const onClickEdit = (record) => {
    const formData = {
      ...record,
      id_card_expiry: record.id_card_expiry ? dayjs(record.id_card_expiry) : undefined
    };

    setState((prev) => ({
      ...prev,
      visibleModal: true,
      isEditing: true,
      id: record.id,
    }));
    form.setFieldsValue(formData);
  };

  const onClickDelete = (record) => {
    if (!record.id) {
      message.error(t("មិនមានលេខសម្គាល់អតិថិជន!"));
      return;
    }
    Modal.confirm({
      title: t("លុបអតិថិជន"),
      content: t("តើអ្នកពិតជាចង់លុបអតិថិជននេះមែនទេ?"),
      onOk: async () => {
        try {
          const res = await request(`customer/${record.id}`, "delete");
          if (res && !res.error) {
            message.success(res.message);
            getList();
          } else {
            message.error(res.message || t("អតិថិជននេះកំពុងប្រើប្រាស់និងមិនអាចលុបបានទេ!"));
          }
        } catch (error) {
          console.error("Delete Error:", error);
          message.error(t("មានបញ្ហាកើតឡើងខណៈពេលលុបអតិថិជន។"));
        }
      },
    });
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (values.id_card_expiry) {
        values.id_card_expiry = values.id_card_expiry.format('YYYY-MM-DD');
      }

      const { id, isEditing } = state;
      if (isEditing) {
        const res = await request(`customer/${id}`, "put", values);
        if (res && res.success && !res.error) {
          message.success(t("អតិថិជនត្រូវបានធ្វើបច្ចុប្បន្នភាពដោយជោគជ័យ!"));
          setState((prev) => ({ ...prev, visibleModal: false }));
          getList();
        } else {
          message.error(res?.message || t("បរាជ័យក្នុងការធ្វើបច្ចុប្បន្នភាពអតិថិជន។"));
        }
      } else {
        const res = await request("customer", "post", values);
        if (res && res.success && !res.error) {
          message.success(t("អតិថិជនត្រូវបានបង្កើតដោយជោគជ័យ!"));
          setState((prev) => ({ ...prev, visibleModal: false }));
          getList();
        } else {
          message.error(res?.message || t("លេខទូរស័ព្ទនេះមានរួចហើយ។ សូមប្រើលេខផ្សេង។"));
        }
      }
    } catch (error) {
      console.error("Validation or API error:", error);
      message.error(t("មានបញ្ហាកើតឡើងក្នុងការរក្សាទុកទិន្នន័យ។"));
    }
  };

  const handleModalCancel = () => {
    setState((prev) => ({ ...prev, visibleModal: false }));
    form.resetFields();
  };

  const onClickAssignToUser = () => {
    setState((prev) => ({
      ...prev,
      visibleAssignModal: true,
    }));
    assignForm.resetFields();
  };

  const handleAssignToUserSubmit = async () => {
    try {
      const values = await assignForm.validateFields();

      if (!values.customer_id || !values.assigned_user_id) {
        message.error(t("តម្រូវឱ្យមានអតិថិជននិងអ្នកប្រើប្រាស់!"));
        return;
      }

      const res = await request("customer/user", "post", {
        customer_id: values.customer_id,
        assigned_user_id: values.assigned_user_id
      });

      if (res && res.success) {
        message.success(t("អតិថិជនត្រូវបានកំណត់ដោយជោគជ័យ!"));
        setState((prev) => ({ ...prev, visibleAssignModal: false }));
        assignForm.resetFields();
        getList();
      } else {
        message.error(res?.message || t("បរាជ័យក្នុងការកំណត់អតិថិជន។"));
      }
    } catch (error) {
      console.error("Validation or API error:", error);
      message.error(t("មានបញ្ហាកើតឡើងខណៈពេលកំណត់អតិថិជន។"));
    }
  };

  const handleAssignModalCancel = () => {
    setState((prev) => ({ ...prev, visibleAssignModal: false }));
    assignForm.resetFields();
  };

  const canCreateCustomer = permissionsLoaded &&
    isPermission("customer.create") &&
    !blockedPermissions.create.includes(profile?.id);

  // Table columns definition
  const columns = [
    {
      key: "no",
      title: (
        <div>
          <div className="khmer-text">{t("ល.រ")}</div>
        </div>
      ),
      render: (_, __, index) => index + 1,
      width: 60,
    },
    {
      key: "name",
      title: (
        <div>
          <div className="customer-table-header-main">{t("ឈ្មោះ")}</div>
        </div>
      ),
      dataIndex: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      width: 280,
      render: (text, record) => (
        <Tooltip
          title={
            <div className="customer-tooltip-content">
              <div className="customer-tooltip-name">
                {text || t("គ្មាន")}
              </div>
              <div className="customer-tooltip-details">
                {record.gender || t("គ្មាន")} • {record.type === "special" ? t("អតិថិជនពិសេស") : t("អតិថិជនធម្មតា")}
              </div>
            </div>
          }
          placement="topLeft"
          overlayStyle={{ maxWidth: '320px' }}
        >
          <div className="customer-name-cell">
            <div className="customer-name-main">
              {text || t("គ្មាន")}
            </div>
            <div className="customer-name-details">
              <span className="customer-gender-text">
                {record.gender || t("គ្មាន")}
              </span>
              <span className="customer-type-separator">•</span>
              <Tag
                color={record.type === "special" ? "blue" : "green"}
                className="customer-type-tag"
              >
                {record.type === "special" ? t("ពិសេស") : t("ធម្មតា")}
              </Tag>
            </div>
          </div>
        </Tooltip>
      ),
    },
    {
      key: "tel",
      title: (
        <div>
          <div className="customer-table-header-main">{t("ទូរស័ព្ទ")}</div>
        </div>
      ),
      dataIndex: "tel",
      width: 140,
    },
    {
      key: "address",
      title: (
        <div>
          <div className="customer-table-header-main">{t("address")}</div>
        </div>
      ),
      dataIndex: "address",
      width: 250,
      render: (text) => (
        <Tooltip title={text} placement="topLeft">
          <div className="customer-address-text">
            {text || t("គ្មាន")}
          </div>
        </Tooltip>
      ),
    },
    {
      key: "id_card_number",
      title: (
        <div>
          <div className="customer-table-header-main">{t("លេខអត្តសញ្ញាណបណ្ណ")}</div>
        </div>
      ),
      dataIndex: "id_card_number",
      width: 160,
    },
    {
      key: "spouse_name",
      title: (
        <div>
          <div className="customer-table-header-main">{t("ឈ្មោះប្តី/ប្រពន្ធ")}</div>
        </div>
      ),
      dataIndex: "spouse_name",
      width: 150,
    },
    {
      key: "guarantor_name",
      title: (
        <div>
          <div className="customer-table-header-main">{t("ឈ្មោះអ្នកធានា")}</div>
        </div>
      ),
      dataIndex: "guarantor_name",
      width: 150,
    },
    {
      key: "create_by",
      title: (
        <div>
          <div className="customer-table-header-main">{t("create_by")}</div>
        </div>
      ),
      dataIndex: "create_by",
      width: 200,
      render: (text, record) => (
        <div className="customer-create-info">
          <div className="customer-create-name">
            {text || t("គ្មាន")}
          </div>
          <div className="customer-create-date">
            {record.create_at ? dayjs(record.create_at).format("DD-MM-YYYY h:mm A") : "-"}
          </div>
        </div>
      ),
    },
    {
      key: "action",
      title: (
        <div>
          <div className="customer-table-header-main">{t("ACTION")}</div>
          <div className="customer-table-header-sub">{t("ACTION")}</div>
        </div>
      ),
      align: "center",
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          {permissionsLoaded && isPermission("customer.update") && (
            <Button
              type="primary"
              icon={<MdEdit />}
              onClick={() => onClickEdit(record)}
              size="small"
            />
          )}

          {permissionsLoaded &&
            isPermission("customer.update") &&
            !blockedPermissions.delete.includes(profile?.id) && (
              <Button
                type="primary"
                danger
                icon={<MdDelete />}
                onClick={() => onClickDelete(record)}
                size="small"
              />
            )
          }
        </Space>
      ),
    }
  ];

  const renderCustomerForm = () => (
    <Form form={form} layout="vertical">
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label={<span className="customer-form-label">{t("ឈ្មោះ")}</span>}
            name="name"
            rules={[{ required: true, message: t("តម្រូវឱ្យមានឈ្មោះ") }]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={<span className="customer-form-label">{t("ភេទ")}</span>}
            name="gender"
            rules={[{ required: true, message: t("តម្រូវឱ្យមានភេទ") }]}
          >
            <Select placeholder={t("ជ្រើសរើសភេទ")}>
              <Select.Option value="Male">{t("ប្រុស")}</Select.Option>
              <Select.Option value="Female">{t("ស្រី")}</Select.Option>
              <Select.Option value="Other">{t("ផ្សេងៗ")}</Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label={<span className="customer-form-label">{t("អ៊ីមែល")}</span>}
            name="email"
            rules={[{ required: true, message: t("តម្រូវឱ្យមានអ៊ីមែល") }]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={<span className="customer-form-label">{t("ទូរស័ព្ទ")}</span>}
            name="tel"
            rules={phoneValidationRules}
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label={<span className="customer-form-label">{t("លេខអត្តសញ្ញាណបណ្ណ")}</span>}
            name="id_card_number"
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={<span className="customer-form-label">{t("កាលបរិច្ឆេទផុតកំណត់អត្តសញ្ញាណបណ្ណ")}</span>}
            name="id_card_expiry"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            label={<span className="customer-form-label">{t("អាសយដ្ឋាន")}</span>}
            name="address"
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label={<span className="customer-form-label">{t("ឈ្មោះប្តី/ប្រពន្ធ")}</span>}
            name="spouse_name"
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={<span className="customer-form-label">{t("លេខទូរស័ព្ទប្តី/ប្រពន្ធ")}</span>}
            name="spouse_tel"
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label={<span className="customer-form-label">{t("ឈ្មោះអ្នកធានា")}</span>}
            name="guarantor_name"
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={<span className="customer-form-label">{t("លេខទូរស័ព្ទអ្នកធានា")}</span>}
            name="guarantor_tel"
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label={<span className="customer-form-label">{t("ស្ថានភាព")}</span>}
            name="status"
            initialValue={1}
          >
            <Select>
              <Select.Option value={1}>
                <span className="customer-btn-text">{t("សកម្ម (Active)")}</span>
              </Select.Option>
              <Select.Option value={0}>
                <span className="customer-btn-text">{t("អសកម្ម (Inactive)")}</span>
              </Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={<span className="customer-form-label">{t("ប្រភេទអតិថិជន")}</span>}
            name="type"
            rules={[{ required: true, message: t("តម្រូវឱ្យមានប្រភេទអតិថិជន") }]}
          >
            <Select>
              <Select.Option value="regular">
                <span className="customer-btn-text">{t("អតិថិជនធម្មតា (Regular)")}</span>
              </Select.Option>
              <Select.Option value="special">
                <span className="customer-btn-text">{t("អតិថិជនពិសេស (Special)")}</span>
              </Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );

  const renderAssignForm = () => (
    <Form form={assignForm} layout="vertical">
      <Form.Item
        label={<span className="customer-form-label">{t("អតិថិជន")}</span>}
        name="customer_id"
        rules={[{ required: true, message: t("តម្រូវឱ្យមានអតិថិជន") }]}
      >
        <Select placeholder={t("ជ្រើសរើសអតិថិជន")}>
          {list.map((customer) => (
            <Select.Option key={customer.id} value={customer.id}>
              {customer.name} - {customer.tel || ""}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item
        label={<span className="customer-form-label">{t("អ្នកប្រើប្រាស់")}</span>}
        name="assigned_user_id"
        rules={[{ required: true, message: t("តម្រូវឱ្យមានអ្នកប្រើប្រាស់") }]}
      >
        <Select
          style={{ width: '100%' }}
          allowClear
          placeholder={t("ជ្រើសរើសអ្នកប្រើប្រាស់")}
          options={config?.user?.map(user => ({
            value: user.value,
            label: user.label
          })) || []}
          suffixIcon={<LuUserRoundSearch />}
        />
      </Form.Item>
    </Form>
  );

  return (
    <MainPage loading={loading}>
      {/* Page Header */}
      <div className="pageHeader">
        <Space>
          <div>
            <h1 className="customer-page-title">{t("ការគ្រប់គ្រងអតិថិជន")}</h1>
          </div>
          <Input.Search
            className="customer-search-input"
            onChange={(e) =>
              setState((prev) => ({ ...prev, txtSearch: e.target.value }))
            }
            allowClear
            onSearch={getList}
            placeholder={t("ស្វែងរកតាមឈ្មោះ")}
            style={{ width: 200 }}
          />
          <Select
            className="customer-type-filter"
            placeholder={t("ប្រភេទអតិថិជន")}
            allowClear
            style={{ width: 180 }}
            value={state.customerTypeFilter}
            onChange={(value) => {
              setState((prev) => ({ ...prev, customerTypeFilter: value }));
            }}
          >
            <Select.Option value="regular">
              <span className="customer-btn-text">{t("អតិថិជនធម្មតា")}</span>
            </Select.Option>
            <Select.Option value="special">
              <span className="customer-btn-text">{t("អតិថិជនពិសេស")}</span>
            </Select.Option>
          </Select>
          <Button className="customer-btn-text" type="primary" onClick={getList} icon={<CiSearch />}>
            {t("ស្វែងរក")}
          </Button>
          {permissionsLoaded && isPermission("customer.getone") && (
            <Button
              className="customer-btn-text"
              type="primary"
              icon={<MdSecurity />}
              onClick={() => setDeletePermissionModalVisible(true)}
            >
              {t("កំណត់សិទ្ធ")}
            </Button>
          )}
        </Space>
        <div>
          {permissionsLoaded && isPermission("customer.getone") && (
            <Button
              className="customer-btn-text mr-2"
              type="primary"
              onClick={onClickAssignToUser}
              icon={<IoPersonAddSharp />}
            >
              {t("បង្កើតអតិថិជនទៅអ្នកប្រើប្រាស់")}
            </Button>
          )}
          {canCreateCustomer && (
            <Button
              className="customer-btn-text"
              type="primary"
              onClick={onClickAddBtn}
              icon={<MdOutlineCreateNewFolder />}
            >
              {t("បង្កើតថ្មី")}
            </Button>
          )}
        </div>
      </div>

      <Table
        rowClassName={() => "customer-table-row"}
        rowKey="id"
        dataSource={filteredList}
        columns={columns}
        pagination={false}
        scroll={{
          x: 1600,
          y: 'calc(100vh - 350px)'
        }}
        sticky={{
          offsetHeader: 0
        }}
      />

      {/* Permission Settings Modal */}
      <Modal
        title={<span className="customer-modal-title">{t("កំណត់សិទ្ធអ្នកប្រើប្រាស់")}</span>}
        open={deletePermissionModalVisible}
        onOk={() => setDeletePermissionModalVisible(false)}
        onCancel={() => setDeletePermissionModalVisible(false)}
      >
        <div className="mb-4">
          <Select
            className="customer-type-filter"
            style={{ width: "100%" }}
            value={selectedPermissionType}
            onChange={(value) => setSelectedPermissionType(value)}
          >
            <Select.Option value="delete">{t("មិនអនុញ្ញាតឲ្យលុប")}</Select.Option>
            <Select.Option value="create">{t('មិនអនុញ្ញាតឲ្យបង្កើត')}</Select.Option>
          </Select>
        </div>

        <Checkbox.Group
          value={blockedPermissions[selectedPermissionType]}
          onChange={handleCheckboxChange}
        >
          <div className="grid grid-cols-2 gap-y-4 gap-x-8">
            {(config?.user || []).map((user) => {
              // Add null/undefined check for user.label
              const label = user.label || "";
              const [namePart, ...rest] = label.split(" - ");
              const subPart = rest.join(" - ");

              return (
                <Checkbox key={user.value} value={user.value} className="customer-permission-checkbox">
                  <span className="customer-permission-label">{namePart}</span>
                  <span className="customer-permission-sub">{subPart}</span>
                </Checkbox>
              );
            })}
          </div>
        </Checkbox.Group>
      </Modal>

      {/* Create/Edit Customer Modal */}
      <Modal
        title={
          <span className="customer-modal-title">
            {state.isEditing ? "កែសម្រួលអតិថិជន" : "បង្កើតអតិថិជន"}
          </span>
        }
        open={state.visibleModal}
        onOk={handleModalSubmit}
        onCancel={handleModalCancel}
        width={700}
      >
        {renderCustomerForm()}
      </Modal>

      {/* Assign Customer to User Modal */}
      <Modal
        title={
          <span className="customer-modal-title">ចាត់ចែងអតិថិជនទៅអ្នកប្រើប្រាស់</span>
        }
        open={state.visibleAssignModal}
        onOk={handleAssignToUserSubmit}
        onCancel={handleAssignModalCancel}
      >
        {renderAssignForm()}
      </Modal>
    </MainPage>
  );
}

export default CustomerPage;