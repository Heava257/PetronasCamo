import React, { useState } from "react";
import { Form, Button, message, Input } from "antd";
import { request } from "../../util/helper";
import { setAcccessToken, setPermission, setProfile } from "../../store/profile.store";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/petronas.png";
import WelcomeAnimation from "../../component/layout/WelcomeAnimation ";
import { UserOutlined, LockOutlined, ArrowRightOutlined, CustomerServiceOutlined } from '@ant-design/icons';
import { FaTelegramPlane } from "react-icons/fa";

function LoginPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const navigate = useNavigate();

  const onLogin = async (item) => {
    setLoading(true);
    const param = {
      username: item.username,
      password: item.password,
    };
    try {
      const res = await request("auth/login", "post", param);
      if (res && !res.error) {
        setAcccessToken(res.access_token);
        setProfile(JSON.stringify(res.profile));
        setPermission(JSON.stringify(res.permission));
        if (res.profile?.user_id) {
          localStorage.setItem("user_id", res.profile.user_id);
        }

        message.success("Login successful!");
        setShowWelcome(true);

        setTimeout(() => {
          navigate("/");
        }, 7000);

      } else {
        message.error("Login failed! Please check your username and password.");
      }
    } catch (error) {
      console.error("Login error:", error);
      message.error("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const abouthere = () => {
    navigate("/about");
  };

  const handleTelegramSupport = () => {
    window.open('https://t.me/+fAlSFua8dSdhZWI1', '_blank');

  };

  // Show welcome animation if login is successful
  if (showWelcome) {
    return <WelcomeAnimation />;
  }

  return (
    <>
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        .login-container {
          font-family: 'Inter', sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        
        .login-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.8) 100%);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          width: 400px;
          min-height: 600px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          border: 1px solid rgba(255,255,255,0.2);
        }
        
        .login-card::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 200px;
          height: 200px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          clip-path: polygon(100% 0, 0 0, 100% 100%);
          opacity: 0.8;
        }
        
        .login-content {
          position: relative;
          z-index: 2;
          padding: 40px 35px;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .logo-container {
          display: flex;
          justify-content: center;
          margin-bottom: 30px;
        }
        
        .logo-wrapper {
          width: 70px;
          height: 70px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease;
        }
        
        .logo-wrapper:hover {
          transform: scale(1.05);
        }
        
        .logo-wrapper img {
          width: 45px;
          height: auto;
          object-fit: contain;
        }
        
        .welcome-title {
          text-align: center;
          color: #4a5568;
          margin-bottom: 40px;
          font-size: 28px;
          font-weight: 600;
          letter-spacing: -0.5px;
        }
        
        .form-section {
          flex: 1;
        }
        
        .ant-form-item {
          margin-bottom: 24px;
        }
        
        .ant-form-item-label > label {
          color: #4a5568 !important;
          font-weight: 500 !important;
          font-size: 14px !important;
        }
        
        .form-field {
          position: relative;
        }
        
        .field-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #a0aec0;
          font-size: 16px;
          z-index: 1;
        }
        
        .login-input {
          background: rgba(255, 255, 255, 0.8) !important;
          border: 2px solid rgba(160, 174, 192, 0.2) !important;
          border-radius: 12px !important;
          padding: 12px 15px 12px 45px !important;
          font-size: 15px !important;
          font-weight: 400 !important;
          color: #4a5568 !important;
          transition: all 0.3s ease !important;
          backdrop-filter: blur(10px);
        }
        
        .login-input:hover,
        .login-input:focus,
        .login-input:active {
          border-color: #667eea !important;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
          background: rgba(255, 255, 255, 0.95) !important;
        }
        
        .login-input::placeholder {
          color: #a0aec0 !important;
          font-weight: 400;
        }
        
        .login-button {
          background: linear-gradient(135deg, #667eea, #764ba2) !important;
          border: none !important;
          border-radius: 12px !important;
          height: 50px !important;
          font-size: 16px !important;
          font-weight: 600 !important;
          color: white !important;
          transition: all 0.3s ease !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin-top: 10px !important;
          gap: 8px;
        }
        
        .login-button:hover,
        .login-button:focus {
          background: linear-gradient(135deg, #5a67d8, #6b46c1) !important;
          transform: translateY(-1px);
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3) !important;
        }
        
        .login-button:active {
          transform: translateY(0);
        }
        
        .support-section {
          margin-top: auto;
          padding-top: 30px;
          text-align: center;
        }
        
        .support-title {
          color: #718096;
          font-size: 13px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 15px;
        }
        
        .support-icons {
          display: flex;
          justify-content: center;
          gap: 15px;
        }
        
        .support-icon {
          width: 45px;
          height: 45px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .support-icon:hover {
          background: rgba(255, 255, 255, 0.95);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        }
        
        .telegram-icon {
          color: #0088cc;
          font-size: 20px;
        }
        
        .support-icon-general {
          color: #667eea;
          font-size: 18px;
        }
        
        .ant-message {
          z-index: 9999;
        }
        
        .required-star {
          color: #e53e3e;
          margin-right: 4px;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .login-card {
          animation: fadeInUp 0.8s ease-out;
        }
      `}</style>

      <div className="login-container">
        <div className="login-card">
          <div className="login-content">
            {/* Logo */}
            <div className="logo-container">
              <div className="logo-wrapper">
                <img src={logo} alt="Petronas Logo" />
              </div>
            </div>

            {/* Welcome Title */}
            <h1 className="welcome-title">Welcome Back</h1>

            {/* Form Section */}
            <div className="form-section">
              <Form
                layout="vertical"
                form={form}
                onFinish={onLogin}
              >
                {/* Username Field */}
                <Form.Item
                  label={
                    <span>
                      <span className="required-star">*</span>
                      Username
                    </span>
                  }
                  name="username"
                  rules={[{ required: true, message: "Please enter your username!" }]}
                >
                  <div className="form-field">
                    <UserOutlined className="field-icon" />
                    <Input
                      placeholder="Username"
                      className="login-input"
                    />
                  </div>
                </Form.Item>

                {/* Password Field */}
                <Form.Item
                  label={
                    <span>
                      <span className="required-star">*</span>
                      Password
                    </span>
                  }
                  name="password"
                  rules={[{ required: true, message: "Please enter your password!" }]}
                >
                  <div className="form-field">
                    <LockOutlined className="field-icon" />
                    <Input.Password
                      placeholder="Password"
                      className="login-input"
                    />
                  </div>
                </Form.Item>

                {/* Submit Button */}
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    loading={loading}
                    className="login-button"
                  >
                    LOG IN NOW
                    <ArrowRightOutlined />
                  </Button>
                </Form.Item>
              </Form>
            </div>

            {/* Support Section */}
            <div className="support-section">
              <div className="support-title">Need Help?</div>
              <div className="support-icons">
                <div
                  className="support-icon"
                  onClick={handleTelegramSupport}
                  title="Contact us on Telegram"
                >
                  <span className="telegram-icon text-blue-500 text-xl">
                    <FaTelegramPlane />
                  </span>
                </div>
                <div
                  className="support-icon"
                  onClick={abouthere}
                  title="General Support"
                >
                  <CustomerServiceOutlined className="support-icon-general" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default LoginPage;