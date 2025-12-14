

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Upload, message, Card, Row, Col, Modal } from "antd";
import { UserOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { request } from "../../util/helper";
import { Config } from "../../util/config";
import { getProfile, setProfile } from "../../store/profile.store";
import styles from "./ProfilePage.module.css";

const ProfilePage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [profile, setProfileState] = useState(null);
  const [imageDefault, setImageDefault] = useState([]);
  const [isFormChanged, setIsFormChanged] = useState(false);
  const [initialValues, setInitialValues] = useState({ name: "", username: "" });
  
  const navigate = useNavigate();
  const currentUser = getProfile();
  
  // Khmer messages
  const msg = {
    userNotFound: "រកមិនឃើញអ្នកប្រើប្រាស់ កំពុងបញ្ជូនទៅទំព័រចូល",
    errorRetrieving: "មានបញ្ហាក្នុងការទាញយកព័ត៌មានប្រូហ្វាល",
    userMissing: "ព័ត៌មានអ្នកប្រើប្រាស់បាត់",
    updateSuccess: "បានធ្វើបច្ចុប្បន្នភាពព័ត៌មានដោយជោគជ័យ!",
    updateFailed: "មិនអាចធ្វើបច្ចុប្បន្នភាពព័ត៌មានបានទេ សូមព្យាយាមម្តងទៀត",
    passwordMismatch: "ពាក្យសម្ងាត់មិនត្រូវគ្នាទេ!",
    nameRequired: "សូមបញ្ចូលឈ្មោះរបស់អ្នក!",
    usernameRequired: "សូមបញ្ចូលឈ្មោះអ្នកប្រើប្រាស់របស់អ្នក!",
    passwordMin: "ពាក្យសម្ងាត់ត្រូវតែមានយ៉ាងតិច ៦ តួអក្សរ!",
  };

  // Helper functions
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
      message.error({ content: msg.userNotFound, className: styles.khmerMessage });
      navigate("/login");
      return;
    }

    try {
      const res = await request(`auth/user-profile/${currentUser.id}`, "get");
      if (res && !res.error) {
        setProfileState(res.profile);
        
        const initialFormValues = {
          name: res.profile.name,
          username: res.profile.username,
        };
        
        setInitialValues(initialFormValues);
        form.setFieldsValue(initialFormValues);

        if (res.profile.profile_image) {
          const imageUrl = Config.getFullImagePath(res.profile.profile_image);
          setImageDefault([{
            uid: "-1",
            name: res.profile.profile_image,
            status: "done",
            url: imageUrl,
          }]);
        } else {
          setImageDefault([]);
        }
        
        setIsFormChanged(false);
      }
    } catch (error) {
      message.error({ content: msg.errorRetrieving, className: styles.khmerMessage });
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Form handlers
  const checkFormChanged = () => {
    const values = form.getFieldsValue();
    return values.name !== initialValues.name || 
           values.username !== initialValues.username || 
           values.password || 
           values.confirmPassword;
  };

  const onValuesChange = () => setIsFormChanged(checkFormChanged());

  const onFinish = async (values) => {
    if (!currentUser?.id) {
      message.error({ content: msg.userMissing, className: styles.khmerMessage });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", values.name.trim());
      formData.append("username", values.username.trim());

      if (values.password) {
        if (values.password !== values.confirmPassword) {
          message.error({ content: msg.passwordMismatch, className: styles.khmerMessage });
          setLoading(false);
          return;
        }
        formData.append("password", values.password);
      }

      // Handle image upload
      if (imageDefault.length > 0 && imageDefault[0].originFileObj) {
        formData.append("upload_image", imageDefault[0].originFileObj);
      }

      const res = await request(`user/profile/${currentUser.id}`, "put", formData);

      if (res?.success) {
        message.success({
          content: msg.updateSuccess,
          className: styles.khmerMessageSuccess,
          duration: 3,
        });

        if (res.profile) {
          setProfile({
            ...currentUser,
            name: res.profile.name,
            username: res.profile.username,
            profile_image: res.profile.profile_image
          });
        }

        setTimeout(() => {
          fetchProfile();
          navigate("/login");
        }, 300);
      } else {
        message.error({
          content: res.message || msg.updateFailed,
          className: styles.khmerMessageError,
        });
      }
    } catch (error) {
      message.error({ content: msg.updateFailed, className: styles.khmerMessageError });
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // Image handlers
  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
  };

  const handleChangeImageDefault = ({ fileList }) => {
    setIsFormChanged(true);
    setImageDefault(fileList);
  };

  // Prevent actual upload and prepare file
  const beforeUpload = () => {
    setIsFormChanged(true);
    return false;
  };

  return (
    <div className={styles.profileContainer}>
      <Button 
        type="text" 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate(-1)}
        className={styles.backButton}
      >
        <span className={styles.khmerFont}>ត្រឡប់ក្រោយ</span>
      </Button>
      
      <Card
        title={<span className={styles.khmerFont}>ការកំណត់ប្រូហ្វាល</span>}
        bordered={false}
        className={styles.profileCard}
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} md={8} style={{ textAlign: "center" }}>
            <Form.Item
              name="profile_image"
              label={<div className={styles.khmerFont}>រូបភាព</div>}
            >
              <Upload
                name="upload_image"
                accept="image/*"
                listType="picture-card"
                fileList={imageDefault}
                onPreview={handlePreview}
                onChange={handleChangeImageDefault}
                beforeUpload={beforeUpload}
                customRequest={({ onSuccess }) => setTimeout(() => onSuccess("ok"), 0)}
                className={styles.profileUpload}
              >
                {imageDefault.length >= 1 ? null : (
                  <div>
                    <UserOutlined className={styles.uploadIcon} />
                    <div className={`${styles.uploadText} ${styles.khmerFont}`}>ផ្ទុកឡើង</div>
                  </div>
                )}
              </Upload>
            </Form.Item>
          </Col>

          <Col xs={24} md={16}>
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              onValuesChange={onValuesChange}
              initialValues={{
                name: profile?.name || "",
                username: profile?.username || "",
              }}
              className={styles.profileForm}
            >
              <Form.Item
                label={<span className={styles.khmerFont}>ឈ្មោះ</span>}
                name="name"
                rules={[{ required: true, message: msg.nameRequired }]}
              >
                <Input
                  placeholder="បញ្ចូលឈ្មោះរបស់អ្នក"
                  className={styles.khmerFont}
                />
              </Form.Item>

              <Form.Item
                label={<span className={styles.khmerFont}>ឈ្មោះអ្នកប្រើប្រាស់</span>}
                name="username"
                rules={[{ required: true, message: msg.usernameRequired }]}
              >
                <Input
                  placeholder="បញ្ចូលឈ្មោះអ្នកប្រើប្រាស់"
                  className={styles.khmerFont}
                />
              </Form.Item>

              <Form.Item
                label={<span className={styles.khmerFont}>ពាក្យសម្ងាត់ថ្មី</span>}
                name="password"
                rules={[{ min: 6, message: msg.passwordMin }]}
              >
                <Input.Password
                  placeholder="បញ្ចូលពាក្យសម្ងាត់ថ្មី (ទុកចោលដើម្បីរក្សាពាក្យសម្ងាត់បច្ចុប្បន្ន)"
                  className={styles.khmerFont}
                />
              </Form.Item>

              <Form.Item
                label={<span className={styles.khmerFont}>បញ្ជាក់ពាក្យសម្ងាត់</span>}
                name="confirmPassword"
                dependencies={["password"]}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!getFieldValue("password")) return Promise.resolve();
                      if (getFieldValue("password") === value) return Promise.resolve();
                      return Promise.reject(new Error(msg.passwordMismatch));
                    },
                  }),
                ]}
              >
                <Input.Password
                  placeholder="បញ្ជាក់ពាក្យសម្ងាត់ថ្មី"
                  className={styles.khmerFont}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  disabled={!isFormChanged}
                  className={`${styles.saveButton} ${styles.khmerFont}`}
                >
                  រក្សាទុកការផ្លាស់ប្តូរ
                </Button>
              </Form.Item>
            </Form>
          </Col>
        </Row>
      </Card>

      <Modal
        open={previewOpen}
        title={<span className={styles.khmerFont}>មើលរូបភាព</span>}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        className={styles.khmerFont}
      >
        <img alt="Preview" className={styles.previewImage} src={previewImage} />
      </Modal>
    </div>
  );
};

export default ProfilePage;