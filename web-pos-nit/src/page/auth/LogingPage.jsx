import React, { useState, useEffect } from "react";
import { Form, Button, message, Input, Alert } from "antd";
import { request } from "../../util/helper";
import { setAcccessToken, setPermission, setProfile } from "../../store/profile.store";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/petronas.png";
import WelcomeAnimation3D from "../../component/layout/WelcomeAnimation ";
import { UserOutlined, LockOutlined, ArrowRightOutlined, CustomerServiceOutlined, ClockCircleOutlined, InfoCircleOutlined, CloseOutlined } from '@ant-design/icons';
import { FaTelegramPlane, FaGoogle, FaApple } from "react-icons/fa";
import "./LoginPage.css";

function LoginPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);
  const [activeTab, setActiveTab] = useState('signin');
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();

  // Show notification function
  const showNotification = (provider) => {
    setNotification(provider);
    setTimeout(() => setNotification(null), 4000);
  };

  // Countdown timer
  useEffect(() => {
    if (remainingTime > 0) {
      const timer = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            setIsBlocked(false);
            setAttemptCount(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [remainingTime]);

  const onLogin = async (item) => {
    if (isBlocked) {
      message.warning(`សូមរង់ចាំ ${formatTime(remainingTime)}`);
      return;
    }

    setLoading(true);
    const param = {
      username: item.username,
      password: item.password,
    };
    
    try {
      const res = await request("auth/login", "post", param);

      if (res && !res.error) {
        // Login ជោគជ័យ - Reset attempts
        setAttemptCount(0);
        setIsBlocked(false);
        setRemainingTime(0);
        
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
        }, 2000);
      } else {
        // Login បរាជ័យ - Increment attempts
        const newAttemptCount = attemptCount + 1;
        setAttemptCount(newAttemptCount);

        // ពិនិត្យថាត្រូវ block ឬនៅ
        if (res.retryAfter) {
          // Server បាន return retry time
          const seconds = parseInt(res.retryAfter);
          
          // ✅ ពិនិត្យថាជា number ត្រឹមត្រូវឬទេ
          if (!isNaN(seconds) && seconds > 0) {
            setRemainingTime(seconds);
            setIsBlocked(true);
            message.error(`អ្នកបានព្យាយាម Login ច្រើនដងពេក! សូមរង់ចាំ ${formatTime(seconds)}`);
          } else {
            // ប្រើ default time ប្រសិនបើ retryAfter មិនត្រឹមត្រូវ
            setRemainingTime(900); // 15 នាទី
            setIsBlocked(true);
            message.error("អ្នកបានព្យាយាម Login ច្រើនដងពេក! សូមរង់ចាំ 15 នាទី");
          }
        } else if (newAttemptCount >= 5) {
          // Front-end blocking
          setRemainingTime(900); // 15 នាទី = 900 វិនាទី
          setIsBlocked(true);
          message.error("អ្នកបានព្យាយាម Login ច្រើនដងពេក! សូមរង់ចាំ 15 នាទី");
        } else {
          message.error(`Login failed! អ្នកនៅសល់ ${5 - newAttemptCount} ដងទៀត`);
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      
      // ពិនិត្យ error response ពី server
      if (error.response?.status === 429) {
        // Too Many Requests
        const retryAfterFromError = error.response?.data?.retryAfter;
        
        // ✅ គណនា retry time ត្រឹមត្រូវ
        let seconds = 900; // default 15 នាទី
        
        if (retryAfterFromError) {
          // ប្រសិនបើជា string រូបមន្ត "15 នាទី"
          if (typeof retryAfterFromError === 'string') {
            const match = retryAfterFromError.match(/(\d+)/);
            if (match) {
              const minutes = parseInt(match[1]);
              seconds = minutes * 60;
            }
          } 
          // ប្រសិនបើជា number
          else if (typeof retryAfterFromError === 'number') {
            seconds = retryAfterFromError;
          }
        }
        
        setRemainingTime(seconds);
        setIsBlocked(true);
        message.error(`អ្នកត្រូវបានទប់ស្កាត់! សូមរង់ចាំ ${formatTime(seconds)}`);
      } else {
        const newAttemptCount = attemptCount + 1;
        setAttemptCount(newAttemptCount);
        
        if (newAttemptCount >= 5) {
          setRemainingTime(900);
          setIsBlocked(true);
          message.error("អ្នកបានព្យាយាម Login ច្រើនដងពេក! សូមរង់ចាំ 15 នាទី");
        } else {
          message.error(`An error occurred. អ្នកនៅសល់ ${5 - newAttemptCount} ដងទៀត`);
        }
      }
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

  const handleGoogleSignIn = () => {
    showNotification('google');
  };

  const handleAppleSignIn = () => {
    showNotification('apple');
  };

  // Format time display
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes > 0) {
      return `${minutes} នាទី ${secs} វិនាទី`;
    }
    return `${secs} វិនាទី`;
  };

  if (showWelcome) {
    return <WelcomeAnimation3D />;
  }

  return (
    <div className="login-container">
      {/* Beautiful Notification Toast */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          animation: 'slideInRight 0.3s ease-out'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
            border: '1px solid #e8e8e8',
            padding: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            minWidth: '340px',
            maxWidth: '450px'
          }}>
            <div style={{
              flexShrink: 0,
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#e6f7ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <InfoCircleOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{
                fontSize: '15px',
                fontWeight: '600',
                color: '#1f1f1f',
                margin: '0 0 4px 0'
              }}>
                Coming Soon!
              </h3>
              <p style={{
                fontSize: '13px',
                color: '#666',
                margin: 0,
                lineHeight: '1.5'
              }}>
                {notification === 'google' ? 'Google' : 'Apple'} sign-in will be available shortly. We're working hard to bring you this feature.
              </p>
            </div>
            <button
              onClick={() => setNotification(null)}
              style={{
                flexShrink: 0,
                background: 'none',
                border: 'none',
                color: '#999',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.color = '#666'}
              onMouseLeave={(e) => e.target.style.color = '#999'}
            >
              <CloseOutlined style={{ fontSize: '14px' }} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>

      <div className="login-card">
        <div className="login-content">
          {/* Logo */}
          <div className="logo-container">
            <div className="logo-wrapper">
              <img src={logo} alt="Petronas Logo" />
            </div>
          </div>

          {/* Auth Tabs */}
          <div className="auth-tabs">
            <div 
              className={`auth-tab ${activeTab === 'signin' ? 'active' : ''}`}
              onClick={() => setActiveTab('signin')}
            >
              Sign in
            </div>
          </div>

          {/* Welcome Title */}
          <h1 className="welcome-title">Welcome Back</h1>
          <p className="welcome-subtitle">Please enter your details to continue</p>

          {/* Blocked Alert */}
          {isBlocked && (
            <Alert
              message="ការចូលត្រូវបានទប់ស្កាត់"
              description={
                <div>
                  <div className="countdown-timer">
                    <ClockCircleOutlined className="timer-icon" />
                    <span>សូមរង់ចាំ: {formatTime(remainingTime)}</span>
                  </div>
                </div>
              }
              type="error"
              showIcon
              className="blocked-alert"
            />
          )}

          {/* Attempt Counter */}
          {!isBlocked && attemptCount > 0 && attemptCount < 5 && (
            <div className="attempt-counter">
              ⚠️ អ្នកនៅសល់ {5 - attemptCount} ដងទៀត
            </div>
          )}

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
                    placeholder="Enter your username"
                    className="login-input"
                    disabled={isBlocked}
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
                    placeholder="Enter your password"
                    className="login-input"
                    disabled={isBlocked}
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
                  disabled={isBlocked}
                  className="login-button"
                >
                  LOG IN NOW
                  <ArrowRightOutlined />
                </Button>
              </Form.Item>
            </Form>

            {/* Social Login Divider */}
            <div className="social-login-divider">
              <span>or sign in with</span>
            </div>

            {/* Social Buttons */}
            <div className="social-buttons">
              <div 
                className="social-button" 
                onClick={handleGoogleSignIn}
                title="Sign in with Google"
              >
                <FaGoogle style={{ fontSize: '20px', color: '#DB4437' }} />
              </div>
              <div 
                className="social-button"
                onClick={handleAppleSignIn} 
                title="Sign in with Apple"
              >
                <FaApple style={{ fontSize: '22px', color: '#ffffff' }} />
              </div>
            </div>

            {/* Terms */}
            <div className="terms-text">
              By creating an account, you agree to our <a href="#">Terms & Service</a>
            </div>
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
                <FaTelegramPlane className="telegram-icon" />
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
  );
}

export default LoginPage;