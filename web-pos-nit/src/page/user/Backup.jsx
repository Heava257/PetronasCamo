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
  Upload,
} from "antd";
import { configStore } from "../../store/configStore";
import { MdOutlineCreateNewFolder } from "react-icons/md";
import { UploadOutlined, UserOutlined } from "@ant-design/icons";
import { Config } from "../../util/config";
import { IoEyeOutline } from "react-icons/io5";
import imageExtensions from 'image-extensions';
import dayjs from "dayjs";

function UserPage() {
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
    groups: [], // Add groups to state
    loading: false,
    visible: false,
  });

  useEffect(() => {
    getList();
    getGroups(); // Fetch groups on component mount
  }, []);

  // Function to convert file to base64
  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Fetch user list
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

  // Fetch groups list
  const getGroups = async () => {
    const res = await request("groups/get-list", "get"); // Adjust endpoint as needed
    if (res && !res.error) {
      setState((pre) => ({
        ...pre,
        groups: res.list || res.groups, // Adjust based on your API response structure
      }));
    }
  };

  // Handle edit user
  const onClickEdit = (item) => {
    // Set form values
    form.setFieldsValue({
      ...item,
    });

    // Open the modal
    setState((pre) => ({
      ...pre,
      visible: true,
    }));

    // Initialize imageDefault if the user has a profile image
    if (item.profile_image && item.profile_image !== "") {
      const imageProduct = [
        {
          uid: "-1", // Unique ID for the file
          name: item.profile_image, // File name
          status: "done", // File status
          url: Config.getFullImagePath(item.profile_image), // Use Config helper function
        },
      ];
      setImageDefault(imageProduct); // Set the imageDefault state
    } else {
      setImageDefault([]); // Clear the imageDefault state if no image exists
    }
  };

  // Handle delete user
  const clickBtnDelete = (item) => {
    Modal.confirm({
      title: "Delete",
      content: "Are you sure you want to remove this user?",
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
          message.error(res.message || "This user cannot be deleted because they are linked to other records.");
        }
      },
    });
  };

  // Close modal
  const handleCloseModal = () => {
    setState((pre) => ({
      ...pre,
      visible: false,
    }));
    form.resetFields();
    setImageDefault([]);
  };

  // Open modal
  const handleOpenModal = () => {
    setState((pre) => ({
      ...pre,
      visible: true,
    }));
    form.resetFields();
    setImageDefault([]);
  };

  // Validate file before upload
  const beforeUpload = (file) => {
    // Get the file extension
    const fileExtension = file.name.split('.').pop().toLowerCase();

    // Check if the extension is in the list of valid image extensions
    const isValidExtension = imageExtensions.includes(fileExtension);

    // Check if the file type starts with 'image/'
    const isImage = file.type.startsWith('image/');

    if (!isValidExtension || !isImage) {
      message.error('You can only upload image files!');
    }

    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must be smaller than 2MB!');
    }



    return isValidExtension && isImage && isLt2M;
  };

  // Handle form submission
  const onFinish = async (items) => {
    // Check if passwords match
    if (items.password !== items.confirm_password) {
      message.error("ពាក្យសម្ងាត់មិនត្រូវគ្នា!");
      return;
    }

    const currentUserId = form.getFieldValue("id");
    const isUpdate = !!currentUserId;

    // For email validation - only check other users' emails
    const isEmailExist = state.list.some(
      (user) => user.username === items.username && user.id !== currentUserId
    );

    // Only validate email for new users or if email has changed
    if (isEmailExist) {
      message.error("Email មានរួចហើយ!");
      return;
    }

    // For phone validation - only check other users' phone numbers
    const isTelExist = state.list.some(
      (user) => user.tel === items.tel && user.id !== currentUserId
    );

    // Only validate phone for new users or if phone has changed
    if (isTelExist) {
      message.error("លេខទូរស័ព្ទមានរួចហើយ!");
      return;
    }

    // Continue with user creation or update
    const params = new FormData();
    params.append("name", items.name);
    params.append("username", items.username);
    params.append("password", items.password);
    params.append("role_id", items.role_id);
    params.append("group_id", items.group_id); // Add group_id to form data
    params.append("address", items.address);
    params.append("tel", items.tel);
    params.append("branch_name", items.branch_name);
    params.append("is_active", items.is_active);

    // Check if there's a file to upload
    if (items.profile_image && items.profile_image.fileList && items.profile_image.fileList[0]) {
      const file = items.profile_image.fileList[0].originFileObj;

      // Log file info

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
      message.error(res.message || "មានបញ្ហាកើតឡើង!");
    }
  };

  // Handle image preview
  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
  };

  // Handle file list changes
  const handleChangeImageDefault = ({ fileList: newFileList }) => {
    // Log information about the files
    if (newFileList.length > 0 && newFileList[0].originFileObj) {
      const file = newFileList[0].originFileObj;

    }

    setImageDefault(newFileList);
  };

  // Handle search 
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
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          paddingBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div>User</div>
          <Space>
            <Input.Search
              style={{ marginLeft: 10 }}
              placeholder="Search"
              onSearch={handleSearch}
            />
          </Space>
        </div>
        <Button type="primary" onClick={handleOpenModal} icon={<MdOutlineCreateNewFolder />}>
          New
        </Button>
      </div>

      {/* Image Preview Modal */}
      <Modal
        open={previewOpen}
        title="Image Preview"
        footer={null}
        onCancel={() => setPreviewOpen(false)}
      >
        <img alt="Preview" style={{ width: "100%" }} src={previewImage} />
      </Modal>

      {/* User Form Modal */}
      <Modal
        className="khmer-branch"
        open={state.visible}
        onCancel={handleCloseModal}
        centered
        footer={null}
        title={form.getFieldValue("id") ? "កែប្រែអ្នកប្រើប្រាស់" : "បញ្ចូលអ្នកប្រើប្រាស់ថ្មី"}
      >
        <Form layout="vertical" form={form} onFinish={onFinish} className="custom-form">
          <Row justify="center" align="middle">
            <Col>
              <Form.Item
                name="profile_image"
                label={
                  <div style={{ textAlign: "center" }}>
                    <span className="khmer-text">រូបភាព</span>
                    <br />
                    <span className="english-text">Profile Image</span>
                  </div>
                }
              >
                <Upload
                  name="profile_image"
                  customRequest={({ file, onSuccess }) => {
                    // Just call onSuccess immediately to handle the file later in onFinish
                    // This allows us to capture the file type and other metadata
                    onSuccess();
                  }}
                  maxCount={1}
                  listType="picture-card"
                  fileList={imageDefault}
                  onPreview={handlePreview}
                  onChange={handleChangeImageDefault}
                  beforeUpload={beforeUpload}
                  accept="image/*" // Only accept image files
                >
                  {imageDefault.length >= 1 ? null : (
                    <div>
                      <UserOutlined style={{ fontSize: 40, color: "#aaa" }} />
                      <div style={{ marginTop: 8 }}>Upload</div>
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
                    <span className="khmer-text">ឈ្មោះ</span>
                    <span className="english-text">Name</span>
                  </div>
                }
                rules={[
                  {
                    required: true,
                    message: "Please fill in name",
                  },
                ]}
              >
                <Input placeholder="Name" className="input-field" />
              </Form.Item>

              {/* Address */}
              <Form.Item
                name="address"
                label={
                  <div>
                    <span className="khmer-text">អាសយដ្ឋាន</span>
                    <span className="english-text">Address</span>
                  </div>
                }
                rules={[
                  {
                    required: true,
                    message: "Please fill in Address",
                  },
                ]}
              >
                <Input placeholder="Address" className="input-field" />
              </Form.Item>

              {/* Tel */}
              <Form.Item
                name="tel"
                label={
                  <div>
                    <span className="khmer-text">លេខទូរស័ព្ទ</span>
                    <span className="english-text">Tel</span>
                  </div>
                }
                rules={[
                  {
                    required: true,
                    message: "Please fill in Tel",
                  },
                ]}
              >
                <Input placeholder="Tel" className="input-field" />
              </Form.Item>

              {/* Username (Email) */}
              <Form.Item
                name="username"
                label={
                  <div>
                    <span className="khmer-text">អ៊ីម៉ែល</span>
                    <span className="english-text">Email</span>
                  </div>
                }
                rules={[
                  {
                    required: true,
                    message: "Please fill in email",
                  },
                ]}
              >
                <Input placeholder="Email" className="input-field" />
              </Form.Item>

              {/* Status */}
              <Form.Item
                name="is_active"
                label={
                  <div>
                    <span className="khmer-text">ស្ថានភាព</span>
                    <span className="english-text">Status</span>
                  </div>
                }
                rules={[
                  {
                    required: true,
                    message: "Please select status",
                  },
                ]}
              >
                <Select
                  placeholder="Select Status"
                  options={[
                    {
                      label: "Active",
                      value: 1,
                    },
                    {
                      label: "InActive",
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
                    <span className="khmer-text">ក្រុម</span>
                    <span className="english-text">Group</span>
                  </div>
                }
                rules={[
                  {
                    required: true,
                    message: "Please select group",
                  },
                ]}
              >

                <Select
                  placeholder="Select Group"
                  options={config?.groupOptions } // ប្រើពី config
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
                    <span className="khmer-text">ពាក្យសម្ងាត់</span>
                    <span className="english-text">Password</span>
                  </div>
                }
                rules={[
                  {
                    required: true,
                    message: "Please fill in password",
                  },
                ]}
              >
                <Input.Password placeholder="Password" className="input-field" />
              </Form.Item>

              {/* Confirm Password */}
              <Form.Item
                name="confirm_password"
                label={
                  <div>
                    <span className="khmer-text">បញ្ជាក់ពាក្យសម្ងាត់</span>
                    <span className="english-text">Confirm Password</span>
                  </div>
                }
                dependencies={["password"]}
                rules={[
                  {
                    required: true,
                    message: "សូមបញ្ជាក់ពាក្យសម្ងាត់",
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("ពាក្យសម្ងាត់មិនត្រូវគ្នា!"));
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="បញ្ជាក់ពាក្យសម្ងាត់" className="input-field" />
              </Form.Item>

              {/* Role */}
              <Form.Item
                name="role_id"
                label={
                  <div>
                    <span className="khmer-text">តួនាទី</span>
                    <span className="english-text">Role</span>
                  </div>
                }
                rules={[
                  {
                    required: true,
                    message: "Please select role",
                  },
                ]}
              >
                <Select placeholder="Select Role" options={state?.role} className="select-field" />
              </Form.Item>

              {/* Branch Name */}
              <Form.Item
                name="branch_name"
                label={
                  <div>
                    <span className="khmer-text">សាខា</span>
                    <span className="english-text">Branch</span>
                  </div>
                }
                rules={[
                  {
                    required: true,
                    message: "Please select Branch",
                  },
                ]}
              >
                <Select placeholder="Select Branch" options={config?.branch_name} className="select-field" />
              </Form.Item>
            </Col>
          </Row>

          {/* Form Footer */}
          <div style={{ textAlign: "right" }}>
            <Space>
              <Button onClick={handleCloseModal}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {form.getFieldValue("id") ? "Update" : "Save"}
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
            key: "profile_image",
            title: (
              <div>
                <div className="khmer-text">រូបភាព</div>
                <div className="english-text">Profile Image</div>
              </div>
            ),
            dataIndex: "profile_image",
            render: (profileImage) =>
              profileImage ? (
                <Image
                  src={Config.getFullImagePath(profileImage)}
                  alt="Profile"
                  width={50}
                  height={50}
                  style={{
                    borderRadius: "50%", // Make the image circular
                    objectFit: "cover", // Ensure the image covers the area
                  }}
                  preview={{
                    mask: <div className="khmer-text">{<IoEyeOutline />}</div>, // Preview mask text
                  }}
                />
              ) : (
                <Avatar
                  size={50}
                  icon={<UserOutlined />}
                  style={{ backgroundColor: "#f0f2f5" }}
                />
              ),
          },

          {
            key: "no",
            title: (
              <div>
                <div className="khmer-text">លេខកូដ</div>
                <div className="english-text">Code</div>
              </div>
            ),
            dataIndex: "id",
            render: (text) => (
              <Tag color="blue">
                {"U" + text}
              </Tag>
            ),
          },
          {
            key: "name",
            title: (
              <div>
                <div className="khmer-text">ឈ្មោះ</div>
                <div className="english-text">Name</div>
              </div>
            ),
            dataIndex: "name",
          },
          {
            key: "role_name",
            title: (
              <div>
                <div className="khmer-text">តួនាទី</div>
                <div className="english-text">Role Name</div>
              </div>
            ),
            dataIndex: "role_name",
          },
          {
            key: "group_name",
            title: (
              <div>
                <div className="khmer-text">ក្រុម</div>
                <div className="english-text">Group</div>
              </div>
            ),
            dataIndex: "group_id",
          },
          {
            key: "username",
            title: (
              <div>
                <div className="khmer-text">អ៊ីមែល</div>
                <div className="english-text">Email</div>
              </div>
            ),
            dataIndex: "username",
          },
          {
            key: "tel",
            title: (
              <div>
                <div className="khmer-text">លេខទូរស័ព្ទ</div>
                <div className="english-text">Tel</div>
              </div>
            ),
            dataIndex: "tel",
          },
          {
            key: "branch",
            title: (
              <div>
                <div className="khmer-text">សាខា</div>
                <div className="english-text">Branch</div>
              </div>
            ),
            dataIndex: "branch_name",
          },
          {
            key: "address",
            title: (
              <div>
                <div className="khmer-text">អាសយដ្ឋាន</div>
                <div className="english-text">Address</div>
              </div>
            ),
            dataIndex: "address",
          },
          {
            key: "is_active",
            title: (
              <div>
                <div className="khmer-text">ស្ថានភាព</div>
                <div className="english-text">Status</div>
              </div>
            ),
            dataIndex: "is_active",
            render: (value) =>
              value ? (
                <Tag color="green">សកម្ម | Active</Tag>
              ) : (
                <Tag color="red">អសកម្ម | Inactive</Tag>
              ),
          },
          {
            key: "create_by",
            title: (
              <div>
                <div className="khmer-text">បង្កើតដោយ</div>
                <div className="english-text">Create By</div>
              </div>
            ),
            dataIndex: "create_by",
          },
          {
            key: "create_at",
            title: (
              <div>
                <div className="khmer-text">កាលបរិច្ឆេទបង្កើត</div>
                <div className="english-text">Created Date</div>
              </div>
            ),
            dataIndex: "create_at", // Match your database field
            render: (value) => formatDateServer(value, "YYYY-MM-DD h:mm A"), // Correct function usage
          },

          {
            key: "action",
            title: (
              <div>
                <div className="khmer-text">សកម្មភាព</div>
                <div className="english-text">Action</div>
              </div>
            ),
            align: "center",
            render: (value, data) => (
              <Space>
                <Button onClick={() => onClickEdit(data)} type="primary" className="dual-text">
                  <span className="khmer-text">កែប្រែ</span> | <span className="english-text">Edit</span>
                </Button>
                <Button onClick={() => clickBtnDelete(data)} danger type="primary" className="dual-text">
                  <span className="khmer-text">លុប</span> | <span className="english-text">Delete</span>
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
