import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Upload, message, Modal } from "antd";
import {
  UserOutlined,
  ArrowLeftOutlined,
  EyeInvisibleOutlined,
  EyeOutlined
} from "@ant-design/icons";
import { request } from "../../util/helper";
import { Config } from "../../util/config";
import { getProfile, setProfile } from "../../store/profile.store";
import { useDarkMode } from "../../component/DarkModeContext.jsx";
import styles from "./ProfilePage.module.css";

const ProfilePage = () => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [personalInfoForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [profile, setProfileState] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [isInfoChanged, setIsInfoChanged] = useState(false);
  const [initialValues, setInitialValues] = useState({});
  const navigate = useNavigate();
  const currentUser = getProfile();

  // Helper function
  const getBase64 = file =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });

  // Fetch user profile data
  const fetchProfile = async () => {
    if (!currentUser?.id) {
      message.error("រកមិនឃើញអ្នកប្រើប្រាស់");
      navigate("/login");
      return;
    }

    try {
      const res = await request(`auth/user-profile/${currentUser.id}`, "get");
      if (res && !res.error && res.profile) {
        setProfileState(res.profile);

        const initialFormValues = {
          name: res.profile.name,
          username: res.profile.username,
        };

        setInitialValues(initialFormValues);
        personalInfoForm.setFieldsValue(initialFormValues);

        // ✅ FIXED: Set initial image in fileList
        if (res.profile.profile_image) {
          const imageUrl = Config.getFullImagePath(res.profile.profile_image);
          setFileList([{
            uid: "-1",
            name: res.profile.profile_image,
            status: "done",
            url: imageUrl,
          }]);
        } else {
          setFileList([]);
        }

        setIsInfoChanged(false);
      }
    } catch (error) {
      message.error("មានបញ្ហាក្នុងការទាញយកព័ត៌មាន");
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Check if personal info form changed
  const checkInfoChanged = () => {
    const values = personalInfoForm.getFieldsValue();
    const hasNewImage = fileList.length > 0 && fileList[0].originFileObj;

    return (
      values.name !== initialValues.name ||
      values.username !== initialValues.username ||
      hasNewImage
    );
  };

  const onInfoValuesChange = () => setIsInfoChanged(checkInfoChanged());

  // Save Personal Information
  const onSavePersonalInfo = async (values) => {
    if (!currentUser?.id) {
      message.error("ព័ត៌មានអ្នកប្រើប្រាស់បាត់");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", values.name.trim());
      formData.append("username", values.username.trim());

      // ✅ FIXED: Handle image upload properly
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append("upload_image", fileList[0].originFileObj);
      }


      const res = await request(`user/profile/${currentUser.id}`, "put", formData);

      if (res?.success) {
        message.success("បានរក្សាទុកព័ត៌មានដោយជោគជ័យ!");

        // ✅ Update global profile state
        if (res.profile) {
          setProfile({
            ...currentUser,
            name: res.profile.name,
            username: res.profile.username,
            email: res.profile.email,
            phone: res.profile.phone,
            profile_image: res.profile.profile_image
          });
        }

        // ✅ Refresh profile data
        await fetchProfile();
        setIsInfoChanged(false);
        // Removed forced logout and redirect
      } else {
        message.error(res.message || "មិនអាចរក្សាទុកបានទេ");
      }
    } catch (error) {
      message.error("មិនអាចរក្សាទុកបានទេ សូមព្យាយាមម្តងទៀត");
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // Update Password
  const onUpdatePassword = async (values) => {
    if (!currentUser?.id) {
      message.error("ព័ត៌មានអ្នកប្រើប្រាស់បាត់");
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await request(`user/change-password/${currentUser.id}`, "put", {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword
      });

      if (res?.success) {
        message.success("បានផ្លាស់ប្តូរពាក្យសម្ងាត់ដោយជោគជ័យ!");
        // ✅ UPDATE TOKEN: Since password change increments token_version
        if (res.access_token) {
          localStorage.setItem("access_token", res.access_token);
          console.log("✅ Session token updated successfully");
        }

        passwordForm.resetFields();
        // Removed forced logout and redirect to maintain seamless session
      } else {
        message.error(res.message || res.message_kh || "មិនអាចផ្លាស់ប្តូរពាក្យសម្ងាត់បានទេ");
      }
    } catch (error) {
      message.error("មិនអាចផ្លាស់ប្តូរពាក្យសម្ងាត់បានទេ");
      console.error("Error updating password:", error);
    } finally {
      setPasswordLoading(false);
    }
  };

  // ✅ FIXED: Image upload handlers
  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
  };

  const handleChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
    setIsInfoChanged(true);
  };

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('អ្នកអាចបញ្ចូលតែឯកសាររូបភាពប៉ុណ្ណោះ!');
      return Upload.LIST_IGNORE;
    }

    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('រូបភាពត្រូវតែតូចជាង 5MB!');
      return Upload.LIST_IGNORE;
    }

    return false; // Prevent auto upload
  };

  const getProfileImageUrl = () => {
    if (!profile?.profile_image) return null;
    try {
      return Config.getFullImagePath(profile.profile_image);
    } catch (error) {
      return null;
    }
  };

  if (!profile) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}>កំពុងផ្ទុក...</div>
      </div>
    );
  }

  return (
    <div className={`${styles.profileContainer} ${isDarkMode ? styles.darkMode : ''}`}>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        className={styles.backButton}
      >
        ត្រឡប់ក្រោយ
      </Button>

      <div className={styles.profileLayout}>
        {/* Left Sidebar - Profile Card */}
        <div className={styles.profileCard}>
          <div className={styles.avatarSection}>
            <div className={styles.avatarWrapper}>
              {getProfileImageUrl() ? (
                <img src={getProfileImageUrl()} alt="Profile" className={styles.avatar} />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  <UserOutlined className={styles.avatarIcon} />
                </div>
              )}
            </div>

            {/* ✅ FIXED: Upload component */}
            <Upload
              accept="image/*"
              fileList={fileList}
              beforeUpload={beforeUpload}
              onChange={handleChange}
              onPreview={handlePreview}
              maxCount={1}
              listType="picture"
              showUploadList={false}
            >
              <Button className={styles.changeAvatarBtn}>
                {fileList.length > 0 && fileList[0].originFileObj ? 'Change Image' : 'Upload Avatar'}
              </Button>
            </Upload>

            {fileList.length > 0 && fileList[0].originFileObj && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
                ✅ New image selected: {fileList[0].name}
              </div>
            )}
          </div>

          <h2 className={styles.profileName}>{profile.name}</h2>
          <p className={styles.profileEmail}>{profile.username}</p>

          {/* Branch & Address Info */}
          <div className={styles.profileInfo}>
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>📍</span>
              <div className={styles.infoContent}>
                <span className={styles.infoLabel}>សាខា</span>
                <span className={styles.infoValue}>{profile.branch_name || currentUser?.branch_name || 'N/A'}</span>
              </div>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>🏢</span>
              <div className={styles.infoContent}>
                <span className={styles.infoLabel}>អាសយដ្ឋាន</span>
                <span className={styles.infoValue}>{profile.address || currentUser?.address || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content - Forms */}
        <div className={styles.formsContainer}>
          {/* Personal Information Section */}
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>Personal Information</h3>

            <Form
              form={personalInfoForm}
              layout="vertical"
              onFinish={onSavePersonalInfo}
              onValuesChange={onInfoValuesChange}
              className={styles.form}
            >
              <div className={styles.formRow}>
                <Form.Item
                  label="Full Name"
                  name="name"
                  rules={[{ required: true, message: "សូមបញ្ចូលឈ្មោះ" }]}
                  className={styles.formItem}
                >
                  <Input placeholder="Enter your full name" />
                </Form.Item>

                <Form.Item
                  label="User Name(login)"
                  name="username"
                  rules={[{ required: true, message: "សូមបញ្ចូលឈ្មោះអ្នកប្រើប្រាស់" }]}
                  className={styles.formItem}
                >
                  <Input placeholder="Enter your username" />
                </Form.Item>
              </div>

              <div className={styles.formActions}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  disabled={!isInfoChanged}
                  className={styles.saveButton}
                >
                  Save Changes
                </Button>
              </div>
            </Form>
          </div>

          {/* Password Setting Section */}
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>Password Setting</h3>

            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={onUpdatePassword}
              className={styles.form}
            >
              <Form.Item
                label="Current Password"
                name="currentPassword"
                rules={[
                  { required: true, message: "សូមបញ្ចូលពាក្យសម្ងាត់បច្ចុប្បន្ន" }
                ]}
                className={styles.formItemFull}
              >
                <Input.Password
                  placeholder="Enter current password"
                  iconRender={visible => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                />
              </Form.Item>

              <Form.Item
                label="New Password"
                name="newPassword"
                rules={[
                  { required: true, message: "សូមបញ្ចូលពាក្យសម្ងាត់ថ្មី" },
                  { min: 6, message: "ពាក្យសម្ងាត់ត្រូវតែមានយ៉ាងតិច ៦ តួអក្សរ" }
                ]}
                className={styles.formItemFull}
              >
                <Input.Password
                  placeholder="Enter new password (min 6 characters)"
                  iconRender={visible => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                />
              </Form.Item>

              <Form.Item
                label="Confirm New Password"
                name="confirmPassword"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: "សូមបញ្ជាក់ពាក្យសម្ងាត់" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('ពាក្យសម្ងាត់មិនត្រូវគ្នា'));
                    },
                  }),
                ]}
                className={styles.formItemFull}
              >
                <Input.Password
                  placeholder="Confirm new password"
                  iconRender={visible => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                />
              </Form.Item>

              <div className={styles.formActions}>
                <Button
                  onClick={() => passwordForm.resetFields()}
                  className={styles.cancelButton}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={passwordLoading}
                  className={styles.updateButton}
                >
                  Update Password
                </Button>
              </div>
            </Form>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        open={previewOpen}
        title="មើលរូបភាព"
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        className={styles.previewModal}
      >
        <img alt="Preview" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </div>
  );
};

export default ProfilePage;