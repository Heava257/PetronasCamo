import React, { useEffect, useState } from "react";
import { formatDateServer, request } from "../../util/helper";
import {
  Avatar,
  Button,
  Col,
  Form,
  Image,
  Input,
  message,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Upload,
} from "antd";
import { configStore } from "../../store/configStore";
import { MdDelete, MdEdit, MdOutlineCreateNewFolder } from "react-icons/md";
import { UploadOutlined, UserOutlined } from "@ant-design/icons";
import { Config } from "../../util/config";
import { IoEyeOutline } from "react-icons/io5";
import imageExtensions from 'image-extensions';
import { useTranslation } from "../../locales/TranslationContext";
import dayjs from "dayjs";
import "./user.css";

function UserPage() {
  const { t } = useTranslation(); // Add this
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [imageDefault, setImageDefault] = useState([]);
  const [form] = Form.useForm();
  const { config } = configStore();
  const [filter, setFilter] = useState({
    txt_search: "",
    category_id: "",
    brand: "",
  });
  const [state, setState] = useState({
    list: [],
    role: [],
    groups: [],
    loading: false,
    visible: false,
  });

  useEffect(() => {
    getList();
    getGroups();
  }, []);

  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const getList = async () => {
    const res = await request("groups/get-list", "get");
    if (res && !res.error) {
      setState((pre) => ({
        ...pre,
        list: res.list,
        role: res.role,
        branch_name: res.branch_name,
      }));
    }
  };

  const getGroups = async () => {
    const res = await request("groups/get-list", "get");
    if (res && !res.error) {
      setState((pre) => ({
        ...pre,
        groups: res.list || res.groups,
      }));
    }
  };

  const onClickEdit = (item) => {
    form.setFieldsValue({
      ...item,
    });

    setState((pre) => ({
      ...pre,
      visible: true,
    }));

    if (item.profile_image && item.profile_image !== "") {
      const imageProduct = [
        {
          uid: "-1",
          name: item.profile_image,
          status: "done",
          url: Config.getFullImagePath(item.profile_image),
        },
      ];
      setImageDefault(imageProduct);
    } else {
      setImageDefault([]);
    }
  };

  const clickBtnDelete = (item) => {
    Modal.confirm({
      title: t("Delete"),
      content: t("Are you sure you want to remove this user?"),
      onOk: async () => {
        const res = await request("user", "delete", { id: item.id });
        if (res && !res.error) {
          message.success(res.message);
          const newList = state.list.filter((item1) => item1.id !== item.id);
          setState((prev) => ({
            ...prev,
            list: newList,
          }));
        } else {
          message.error(res.message || t("This user cannot be deleted because they are linked to other records."));
        }
      },
    });
  };

  const handleCloseModal = () => {
    setState((pre) => ({
      ...pre,
      visible: false,
    }));
    form.resetFields();
    setImageDefault([]);
  };

  const handleOpenModal = () => {
    setState((pre) => ({
      ...pre,
      visible: true,
    }));
    form.resetFields();
    setImageDefault([]);
  };

  const beforeUpload = (file) => {
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const isValidExtension = imageExtensions.includes(fileExtension);
    const isImage = file.type.startsWith('image/');

    if (!isValidExtension || !isImage) {
      message.error(t('You can only upload image files!'));
    }

    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error(t('Image must be smaller than 2MB!'));
    }

    console.log("File type:", file.type);
    console.log("File extension:", fileExtension);

    return isValidExtension && isImage && isLt2M;
  };

  const onFinish = async (items) => {
    if (items.password !== items.confirm_password) {
      message.error(t("ពាក្យសម្ងាត់មិនត្រូវគ្នា!"));
      return;
    }

    const currentUserId = form.getFieldValue("id");
    const isUpdate = !!currentUserId;

    const isEmailExist = state.list.some(
      (user) => user.username === items.username && user.id !== currentUserId
    );

    if (isEmailExist) {
      message.error(t("Email មានរួចហើយ!"));
      return;
    }

    const isTelExist = state.list.some(
      (user) => user.tel === items.tel && user.id !== currentUserId
    );

    if (isTelExist) {
      message.error(t("លេខទូរស័ព្ទមានរួចហើយ!"));
      return;
    }

    const params = new FormData();
    params.append("name", items.name);
    params.append("username", items.username);
    params.append("password", items.password);
    params.append("role_id", items.role_id);
    params.append("group_id", items.group_id);
    params.append("address", items.address);
    params.append("tel", items.tel);
    params.append("branch_name", items.branch_name);
    params.append("is_active", items.is_active);

    if (items.profile_image && items.profile_image.fileList && items.profile_image.fileList[0]) {
      const file = items.profile_image.fileList[0].originFileObj;
      console.log("File type:", file.type);
      console.log("File name:", file.name);
      console.log("File size:", file.size + " bytes");
      params.append("upload_image", file);
    }

    if (isUpdate) {
      params.append("id", currentUserId);
    }

    const method = isUpdate ? "put" : "post";
    const res = await request("auth/register", method, params);

    if (res && !res.error) {
      message.success(res.message);
      getList();
      handleCloseModal();
    } else {
      message.error(res.message || t("មានបញ្ហាកើតឡើង!"));
    }
  };

  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
  };

  const handleChangeImageDefault = ({ fileList: newFileList }) => {
    if (newFileList.length > 0 && newFileList[0].originFileObj) {
      const file = newFileList[0].originFileObj;
      console.log("Changed file type:", file.type);
      console.log("Changed file name:", file.name);
    }
    setImageDefault(newFileList);
  };

  const handleSearch = (value) => {
    const filtered = state.list.filter(user =>
      user.name.toLowerCase().includes(value.toLowerCase()) ||
      user.username.toLowerCase().includes(value.toLowerCase()) ||
      user.tel.includes(value)
    );

    setState(prev => ({
      ...prev,
      filteredList: filtered
    }));
  };

  return (
    <div className="background">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          paddingBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div>{t("User")}</div>
          <Space>
            <Input.Search
              style={{ marginLeft: 10 }}
              placeholder={t("Search")}
              onSearch={handleSearch}
            />
          </Space>
        </div>
        <Button type="primary" onClick={handleOpenModal} icon={<MdOutlineCreateNewFolder />}>
          {t("New")}
        </Button>
      </div>

      {/* Image Preview Modal */}
      <Modal
        open={previewOpen}
        title={t("Image Preview")}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
      >
        <img alt={t("Preview")} style={{ width: "100%" }} src={previewImage} />
      </Modal>

      {/* User Form Modal */}
      <Modal
      
        open={state.visible}
        onCancel={handleCloseModal}
        centered
        footer={null}
        title={form.getFieldValue("id") ? t("កែប្រែអ្នកប្រើប្រាស់") : t("បញ្ចូលអ្នកប្រើប្រាស់ថ្មី")}
      >
        <Form layout="vertical" form={form} onFinish={onFinish} className="custom-form">
          <Row justify="center" align="middle">
            <Col>
              <Form.Item
                name="profile_image"
                label={
                  <div style={{ textAlign: "center" }}>
                    <span className="khmer-text">{t("")}</span>
                    <br />
                  </div>
                }
              >
                <Upload
                  name="profile_image"
                  customRequest={({ file, onSuccess }) => {
                    onSuccess();
                  }}
                  maxCount={1}
                  listType="picture-card"
                  fileList={imageDefault}
                  onPreview={handlePreview}
                  onChange={handleChangeImageDefault}
                  beforeUpload={beforeUpload}
                  accept="image/*"
                >
                  {imageDefault.length >= 1 ? null : (
                    <div>
                      <UserOutlined style={{ fontSize: 40, color: "#aaa" }} />
                      <div style={{ marginTop: 8 }}>{t("Upload")}</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            {/* Left Column */}
            <Col span={12}>
              {/* Name */}
              <Form.Item
                name="name"
                label={
                  <div>
                    <span className="khmer-text">{t("ឈ្មោះ")}</span>
                  </div>
                }
                rules={[
                  {
                    required: true,
                    message: t("Please fill in name"),
                  },
                ]}
              >
                <Input placeholder={t("Name")} className="input-field" />
              </Form.Item>

              {/* Address */}
              <Form.Item
                name="address"
                label={
                  <div>
                    <span className="khmer-text">{t("Address")}</span>
                  </div>
                }
                rules={[
                  {
                    required: true,
                    message: t("Please fill in Address"),
                  },
                ]}
              >
                <Input placeholder={t("Address")} className="input-field" />
              </Form.Item>

              {/* Tel */}
              <Form.Item
                name="tel"
                label={
                  <div>
                    <span className="khmer-text">{t("Tel")}</span>
                  </div>
                }
                rules={[
                  {
                    required: true,
                    message: t("Please fill in Tel"),
                  },
                ]}
              >
                <Input placeholder={t("Tel")} className="input-field" />
              </Form.Item>

              {/* Username (Email) */}
              <Form.Item
                name="username"
                label={
                  <div>
                    <span className="khmer-text">{t("អ៊ីម៉ែល")}</span>
                  </div>
                }
                rules={[
                  {
                    required: true,
                    message: t("Please fill in email"),
                  },
                ]}
              >
                <Input placeholder={t("Email")} className="input-field" />
              </Form.Item>

              {/* Status */}
              <Form.Item
                name="is_active"
                label={
                  <div>
                    <span className="khmer-text">{t("ស្ថានភាព")}</span>
                  </div>
                }
                rules={[
                  {
                    required: true,
                    message: t("Please select status"),
                  },
                ]}
              >
                <Select
                  placeholder={t("Select Status")}
                  options={[
                    {
                      label: t("Active"),
                      value: 1,
                    },
                    {
                      label: t("InActive"),
                      value: 0,
                    },
                  ]}
                  className="select-field"
                />
              </Form.Item>

              {/* Group */}
              <Form.Item
                name="group_id"
                label={
                  <div>
                    <span className="khmer-text">{t("ក្រុម")}</span>
                  </div>
                }
                rules={[
                  {
                    required: true,
                    message: t("Please select group"),
                  },
                ]}
              >
                <Select
                  placeholder={t("Select Group")}
                  options={config?.groupOptions}
                  className="select-field"
                />
              </Form.Item>
            </Col>

            {/* Right Column */}
            <Col span={12}>
              {/* Password */}
              <Form.Item
                name="password"
                label={
                  <div>
                    <span className="khmer-text">{t("ពាក្យសម្ងាត់")}</span>
                  </div>
                }
                rules={[
                  {
                    required: true,
                    message: t("Please fill in password"),
                  },
                ]}
              >
                <Input.Password placeholder={t("Password")} className="input-field" />
              </Form.Item>

              {/* Confirm Password */}
              <Form.Item
                name="confirm_password"
                label={
                  <div>
                    <span className="khmer-text">{t("បញ្ជាក់ពាក្យសម្ងាត់")}</span>
                  </div>
                }
                dependencies={["password"]}
                rules={[
                  {
                    required: true,
                    message: t("សូមបញ្ជាក់ពាក្យសម្ងាត់"),
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error(t("ពាក្យសម្ងាត់មិនត្រូវគ្នា!")));
                    },
                  }),
                ]}
              >
                <Input.Password placeholder={t("បញ្ជាក់ពាក្យសម្ងាត់")} className="input-field" />
              </Form.Item>

              {/* Role */}
              <Form.Item
                name="role_id"
                label={
                  <div>
                    <span className="khmer-text">{t("តួនាទី")}</span>
                  </div>
                }
                rules={[
                  {
                    required: true,
                    message: t("Please select role"),
                  },
                ]}
              >
                <Select placeholder={t("Select Role")} options={state?.role} className="select-field" />
              </Form.Item>

              {/* Branch Name */}
              <Form.Item
                name="branch_name"
                label={
                  <div>
                    <span className="khmer-text">{t("សាខា")}</span>
                  </div>
                }
                rules={[
                  {
                    required: true,
                    message: t("Please select Branch"),
                  },
                ]}
              >
                <Select placeholder={t("Select Branch")} options={config?.branch_name} className="select-field" />
              </Form.Item>
            </Col>
          </Row>

          {/* Form Footer */}
          <div style={{ textAlign: "right" }}>
            <Space>
              <Button onClick={handleCloseModal}>{t("Cancel")}</Button>
              <Button type="primary" htmlType="submit">
                {form.getFieldValue("id") ? t("Update") : t("Save")}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      <Table
        rowClassName={() => "pos-row"}
        dataSource={state.filteredList || state.list}
        columns={[
          {
            key: "profile",
            title: (
              <div className="profile-header-wrapper">
                <div className="user-table-header-main">{t("រូបភាព")}</div>
              </div>
            ),
            width: 140,
            align: "center",
            render: (_, record) => (
              <div className="user-profile-cell-enhanced">
                <div className="profile-image-wrapper">
                  {record.profile_image ? (
                    <Image
                      src={Config.getFullImagePath(record.profile_image)}
                      alt="Profile"
                      width={70}
                      height={70}
                      className="profile-image"
                      style={{
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "3px solid #fff",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                      }}
                      preview={{
                        mask: (
                          <div className="preview-mask">
                            <IoEyeOutline size={24} />
                            <span style={{ fontSize: '12px', marginTop: '4px' }}>មើល</span>
                          </div>
                        ),
                      }}
                    />
                  ) : (
                    <div className="avatar-wrapper">
                      <Avatar
                        size={70}
                        icon={<UserOutlined style={{ fontSize: '32px' }} />}
                        className="default-avatar"
                        style={{
                          backgroundColor: "#4d6bb3",
                          border: "3px solid #fff",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                        }}
                      />
                    </div>
                  )}
                  <div className="user-code-badge-enhanced">
                    <Tag
                      color="blue"
                      className="user-id-tag"
                      style={{
                        margin: 0,
                        fontSize: '11px',
                        fontWeight: '600',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      U{record.id}
                    </Tag>
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: "name",
            title: (
              <div>
                <div className="user-table-header-main">{t("ឈ្មោះ")}</div>
              </div>
            ),
            width: 250,
            render: (_, record) => (
              <Tooltip
                title={
                  <div className="user-tooltip-content">
                    <div className="user-tooltip-name">{record.name}</div>
                    <div className="user-tooltip-details">
                      {record.role_name}
                    </div>
                  </div>
                }
                placement="topLeft"
              >
                <div className="user-name-cell">
                  <div className="user-name-main">
                    {record.name || t("គ្មាន")}
                  </div>
                  <div className="user-name-details">
                    <Tag color="purple" className="user-detail-tag">
                      {record.role_name || t("គ្មាន")}
                    </Tag>
                    <span className="user-type-separator">•</span>

                  </div>
                </div>
              </Tooltip>
            ),
          },
          {
            key: "username",
            title: (
              <div>
                <div className="user-table-header-main">{t("EMAIL")}</div>
              </div>
            ),
            dataIndex: "username",
            width: 200,
          },
          {
            key: "tel",
            title: (
              <div>
                <div className="user-table-header-main">{t("TELEPHONE")}</div>
              </div>
            ),
            dataIndex: "tel",
            width: 130,
          },
          {
            key: "branch",
            title: (
              <div>
                <div className="user-table-header-main">{t("សាខា")}</div>
              </div>
            ),
            dataIndex: "branch_name",
            width: 120,
          },
          {
            key: "address",
            title: (
              <div>
                <div className="user-table-header-main">{t("ADDRESS")}</div>
              </div>
            ),
            dataIndex: "address",
            width: 200,
            render: (text) => (
              <Tooltip title={text} placement="topLeft">
                <div className="user-address-text">
                  {text || t("គ្មាន")}
                </div>
              </Tooltip>
            ),
          },
          {
            key: "is_active",
            title: (
              <div>
                <div className="user-table-header-main">{t("STATUS")}</div>
              </div>
            ),
            dataIndex: "is_active",
            width: 100,
            align: "center",
            render: (value) =>
              value ? (
                <Tag color="green" className="user-status-tag">{t("សកម្ម")}</Tag>
              ) : (
                <Tag color="red" className="user-status-tag">{t("អសកម្ម")}</Tag>
              ),
          },
          {
            key: "create_info",
            title: (
              <div>
                <div className="user-table-header-main">{t("created_by")}</div>
              </div>
            ),
            width: 200,
            render: (_, record) => (
              <div className="user-create-info">
                <div className="user-create-name">
                  {record.create_by || t("គ្មាន")}
                </div>
                <div className="user-create-date">
                  {record.create_at ? formatDateServer(record.create_at, "DD-MM-YYYY h:mm A") : "-"}
                </div>
              </div>
            ),
          },
          {
            key: "action",
            title: (
              <div>
                <div className="user-table-header-main">{t("សកម្មភាព")}</div>
              </div>
            ),
            align: "center",
            width: 180,
            fixed: "right",
            render: (_, data) => (
              <Space size="small">
                <Button
                  onClick={() => onClickEdit(data)}
                  type="primary"
                  size="small"
                  icon={<MdEdit />}
                >
                  <span className="user-btn-text">{t("កែប្រែ")}</span>
                </Button>
                <Button
                  onClick={() => clickBtnDelete(data)}
                  danger
                  type="primary"
                  size="small"
                  icon={<MdDelete />}
                >
                  <span className="user-btn-text">{t("លុប")}</span>
                </Button>
              </Space>
            ),
          }
        ]}
      />
    </div>
  );
}

export default UserPage;