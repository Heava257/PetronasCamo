import React, { useState, useEffect, useLayoutEffect } from "react";
import { Form, Button, message, Input, Alert, ConfigProvider, theme } from "antd";
import { request } from "../../util/helper";
import { setAcccessToken, setPermission, setProfile } from "../../store/profile.store";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/petronas_header.png";
import WelcomeAnimation3D from "../../component/layout/WelcomeAnimation ";
import { UserOutlined, LockOutlined, ArrowRightOutlined, CustomerServiceOutlined, ClockCircleOutlined, InfoCircleOutlined, CloseOutlined, ScanOutlined, CameraOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { FaTelegramPlane, FaGoogle, FaApple } from "react-icons/fa";
import { ScanFace, ShieldCheck } from "lucide-react";
import "./LoginPage.css";
import { useSettings } from "../../settings";
import { Modal } from "antd";
import { getFaceApi } from '../../util/faceApiLoader';

function LoginPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);
  const [activeTab, setActiveTab] = useState('signin');
  const [notification, setNotification] = useState(null);
  const [faceLoginVisible, setFaceLoginVisible] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('idle'); // idle, scanning, success, failed
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const videoRef = React.useRef(null);
  const streamRef = React.useRef(null);

  const { settings } = useSettings();
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

  // ✅✅✅ NEW: Check if user is driver ✅✅✅
  const checkIfDriver = async () => {
    try {
      const res = await request('driver/check-auth', 'get');

      if (res && res.success) {
        // ✅ User IS a driver

        // Save driver info
        localStorage.setItem('is_driver', 'true');
        localStorage.setItem('driver_info', JSON.stringify(res.driver_info));

        return true;
      } else {
        // ❌ User is NOT a driver
        localStorage.setItem('is_driver', 'false');
        return false;
      }
    } catch (error) {
      localStorage.setItem('is_driver', 'false');
      return false;
    }
  };

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

        // ✅ Save tokens and profile
        setAcccessToken(res.access_token);
        setProfile(JSON.stringify(res.profile));
        setPermission(JSON.stringify(res.permission));
        if (res.profile?.user_id) {
          localStorage.setItem("user_id", res.profile.user_id);
        }

        message.success("Login successful!");
        setShowWelcome(true);

        // ✅✅✅ NEW: Check if driver and redirect accordingly ✅✅✅
        setTimeout(async () => {
          const isDriver = await checkIfDriver();

          if (isDriver) {
            // ✅ Redirect to Driver App
            navigate("/driver");
          } else {
            // ✅ Redirect to Normal Dashboard
            navigate("/");
          }
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
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        // Handle Wrong Password or Inactive account
        const newAttemptCount = attemptCount + 1;
        setAttemptCount(newAttemptCount);

        const rawData = error.response?.data;
        const serverMessage = rawData?.error?.message_kh || rawData?.error?.password_kh || rawData?.error?.username_kh || rawData?.message_kh || "ព័ត៌មានមិនត្រឹមត្រូវ";
        console.log("Debug Auth Error:", rawData);

        if (newAttemptCount >= 5) {
          setRemainingTime(900);
          setIsBlocked(true);
          message.error("អ្នកបានព្យាយាម Login ច្រើនដងពេក! សូមរង់ចាំ 15 នាទី");
        } else {
          message.error(`${serverMessage}! អ្នកនៅសល់ ${5 - newAttemptCount} ដងទៀត`);
        }
      } else {
        const newAttemptCount = attemptCount + 1;
        setAttemptCount(newAttemptCount);

        if (newAttemptCount >= 5) {
          setRemainingTime(900);
          setIsBlocked(true);
          message.error("អ្នកបានព្យាយាម Login ច្រើនដងពេក! សូមរង់ចាំ 15 នាទី");
        } else {
          message.error(`មានបញ្ហាក្នុងការភ្ជាប់ទៅកាន់ Server។ អ្នកនៅសល់ ${5 - newAttemptCount} ដងទៀត`);
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

  // Face Login Logic - Load Models
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      try {
        const api = getFaceApi();
        if (!api) return;

        // Check if already loaded
        if (api.nets.ssdMobilenetv1.params) {
          setModelsLoaded(true);
          return;
        }

        console.log("Loading Face API Models...");
        // Load sequentially
        await api.loadSsdMobilenetv1Model(MODEL_URL);
        await api.loadFaceLandmarkModel(MODEL_URL);
        await api.loadFaceRecognitionModel(MODEL_URL);

        console.log("Models loaded successfully");
        setModelsLoaded(true);
      } catch (e) {
        console.error("Failed to load face models", e);
        message.error("Failed to load AI models");
      }
    };
    loadModels();
  }, []);

  // Handle Face Login Start/Stop and Stream
  // ✅ AGGRESSIVE: Remove global template class using MutationObserver
  useLayoutEffect(() => {
    const removeTemplateClass = () => {
      const list = document.documentElement.classList;
      const templateClasses = Array.from(list).filter(c => c.startsWith('template-'));
      if (templateClasses.length > 0) {
        list.remove(...templateClasses);
      }
    };

    // Initial removal
    removeTemplateClass();

    // Observe changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          removeTemplateClass();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => {
      observer.disconnect();
      // Restore on unmount
      if (settings?.templateId) {
        document.documentElement.classList.add(`template-${settings.templateId}`);
      }
    };
  }, [settings.templateId]);

  useEffect(() => {
    let isMounted = true;
    let stream = null;



    const startScanning = async () => {
      const api = getFaceApi();

      // ✅ Critical Check: Wait for models
      if (!api || !modelsLoaded || !api.nets.ssdMobilenetv1.params) {
        console.log("Models not ready yet...");
        return;
      }

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream = mediaStream;
        streamRef.current = mediaStream;

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          try {
            await videoRef.current.play();
          } catch (e) { console.error("Play error", e) }
        }

        setIsScanning(true);
        setScanStatus('scanning');

        // Fast Detection Loop
        const detectLoop = async () => {
          if (!isMounted || !videoRef.current || videoRef.current.paused || videoRef.current.ended || !faceLoginVisible) {
            return;
          }

          try {
            // Double check model ready state inside loop to be safe
            if (!api.nets.ssdMobilenetv1.params) {
              setTimeout(detectLoop, 500);
              return;
            }

            const detection = await api.detectSingleFace(videoRef.current, new api.SsdMobilenetv1Options({ minConfidence: 0.5 }))
              .withFaceLandmarks()
              .withFaceDescriptor();


            if (detection) {
              setIsScanning(false);
              setScanStatus('verifying');

              // API Call
              const descriptor = Array.from(detection.descriptor);
              const res = await request("auth/login-face", "post", { descriptor });

              if (res && res.success) {
                setScanStatus('success');
                message.success("Face Recognized!");

                if (streamRef.current) {
                  streamRef.current.getTracks().forEach(track => track.stop());
                }

                setAcccessToken(res.access_token);
                setProfile(JSON.stringify(res.profile));
                setPermission(JSON.stringify(res.permission));
                if (res.profile?.id) localStorage.setItem("user_id", res.profile.id);

                setTimeout(() => {
                  setFaceLoginVisible(false);
                  navigate("/");
                }, 500); // Fast redirect
                return; // Stop loop
              } else {
                // Only show error if explicitly failed multiple times or just silent retry?
                // For banking feel, silent retry is better until timeout
              }
            }
          } catch (err) {
            // Ignore specific detection errors
          }

          // Loop rapidly (100ms delay)
          setTimeout(detectLoop, 100);
        };

        detectLoop();

      } catch (err) {
        console.error("Camera Error", err);
        // Don't show error immediately on auto-login to avoid annoyance
        // message.error("Camera access denied"); 
        setFaceLoginVisible(false);
      }
    };

    if (faceLoginVisible) {
      // Short timeout to allow Modal to mount
      setTimeout(startScanning, 100);
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setIsScanning(false);
    }
    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [faceLoginVisible, modelsLoaded]);

  const startFaceLogin = () => {
    setFaceLoginVisible(true);
  };

  const cancelFaceLogin = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setFaceLoginVisible(false);
    setScanStatus('idle');
    setIsScanning(false);
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
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#776BCC',
          fontFamily: "'Inter', sans-serif"
        },
        components: {
          Input: {
            colorBgContainer: '#ffffff',
            colorText: '#333333',
            colorBorder: '#d9d9d9',
            colorTextPlaceholder: '#bfbfbf'
          },
          Button: {
            colorPrimary: '#5D54A4',
            colorPrimaryHover: '#4e4589'
          },
          Form: {
            labelColor: '#5D54A4'
          }
        }
      }}
    >
      <div className="login-container">
        {/* Abstract Header Art */}
        <div className="login-header-art">
          <div className="abstract-blob"></div>
          <div className="abstract-blob-small"></div>
        </div>

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
                  {notification === 'google' ? 'Google' : notification === 'facebook' ? 'Facebook' : 'Twitter'} sign-in will be available shortly.
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
            {/* Welcome Title */}
            <h1 className="welcome-title">Welcome Back</h1>

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
                {/* Email/Username Field */}
                <Form.Item
                  label="Email"
                  name="username"
                  rules={[{ required: true, message: "Please enter your email!" }]}
                >
                  <Input
                    placeholder="Enter Email"
                    className="login-input"
                    disabled={isBlocked}
                  />
                </Form.Item>

                {/* Password Field */}
                <Form.Item
                  label="Password"
                  name="password"
                  rules={[{ required: true, message: "Please enter your password!" }]}
                >
                  <Input.Password
                    placeholder="Enter Password"
                    className="login-input"
                    disabled={isBlocked}
                  />
                </Form.Item>

                {/* Remember Me & Forgot Password */}
                <div className="remember-forgot-row">
                  <label className="remember-me">
                    <input type="checkbox" style={{
                      width: '20px',
                      height: '20px',
                      accentColor: '#4f46e5',
                      borderRadius: '4px'
                    }} />
                    Remember me
                  </label>
                  <a href="#" className="forgot-password">Forgot Password?</a>
                </div>

                {/* Submit Button */}
                <Form.Item style={{ marginBottom: 0 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    loading={loading}
                    disabled={isBlocked}
                    className="login-button"
                  >
                    Sign in
                    <ArrowRightOutlined />
                  </Button>

                  {settings.faceLogin && (
                    <Button
                      type="default"
                      block
                      onClick={startFaceLogin}
                      className="face-login-button"
                      style={{ marginTop: '10px' }}
                      icon={<ScanFace size={20} />}
                    >
                      Face Login
                    </Button>
                  )}
                </Form.Item>
              </Form>

              {/* Social Login Divider */}
              <div className="social-login-divider">
                <span>sign in with</span>
              </div>

              {/* Social Buttons */}
              <div className="social-buttons">
                <div
                  className="social-button"
                  onClick={handleGoogleSignIn}
                  title="Sign in with Google"
                >
                  <FaGoogle style={{ fontSize: '18px', color: '#DB4437' }} />
                </div>
                <div
                  className="social-button"
                  onClick={() => showNotification('facebook')}
                  title="Sign in with Facebook"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </div>
                <div
                  className="social-button"
                  onClick={() => showNotification('twitter')}
                  title="Sign in with Twitter"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1DA1F2">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </div>
              </div>

              {/* Sign Up Link */}
              <div className="signup-link">
                Don't have an account? <a href="#">Sign in</a>
              </div>
            </div>
          </div>
        </div>

        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={24} color="#1e3a8a" />
              <span style={{ fontSize: '18px', fontWeight: '600', color: '#1e3a8a' }}>Secure Identity Verification</span>
            </div>
          }
          open={faceLoginVisible}
          onCancel={cancelFaceLogin}
          footer={null}
          width={400}
          centered
        >
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: '100%',
              height: '300px',
              backgroundColor: '#000',
              borderRadius: '12px',
              overflow: 'hidden',
              position: 'relative',
              marginBottom: '20px'
            }}>
              {/* Hidden Video for API */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)', // Mirror effect
                  borderRadius: '12px'
                }}
              />

              {/* Scanning Animation UI - Transparent Overlay */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.1)', // Slight dark tint for contrast
                zIndex: 10
              }}>
                {/* Viewfinder Corners */}
                <div style={{ position: 'absolute', top: 20, left: 20, width: 40, height: 40, borderTop: '4px solid #1e3a8a', borderLeft: '4px solid #1e3a8a', borderTopLeftRadius: 12 }}></div>
                <div style={{ position: 'absolute', top: 20, right: 20, width: 40, height: 40, borderTop: '4px solid #1e3a8a', borderRight: '4px solid #1e3a8a', borderTopRightRadius: 12 }}></div>
                <div style={{ position: 'absolute', bottom: 20, left: 20, width: 40, height: 40, borderBottom: '4px solid #1e3a8a', borderLeft: '4px solid #1e3a8a', borderBottomLeftRadius: 12 }}></div>
                <div style={{ position: 'absolute', bottom: 20, right: 20, width: 40, height: 40, borderBottom: '4px solid #1e3a8a', borderRight: '4px solid #1e3a8a', borderBottomRightRadius: 12 }}></div>

                {/* Scanning Line Animation */}
                {isScanning && (
                  <div style={{
                    position: 'absolute',
                    top: '10%',
                    left: '10%',
                    right: '10%',
                    height: '2px',
                    background: '#00ff00',
                    boxShadow: '0 0 10px #00ff00',
                    animation: 'scanLine 2s infinite linear'
                  }}></div>
                )}

                {isScanning ? (
                  <>
                    <div className="face-scan-pulse">
                      <ScanOutlined style={{ fontSize: '60px', color: '#1890ff' }} />
                    </div>
                    <p style={{ marginTop: 20, fontSize: '16px', color: '#666' }}>Scanning...</p>
                  </>
                ) : scanStatus === 'success' ? (
                  <>
                    <SafetyCertificateOutlined style={{ fontSize: '60px', color: '#52c41a' }} />
                    <p style={{ marginTop: 20, fontSize: '18px', color: '#52c41a', fontWeight: 'bold' }}>Verified</p>
                  </>
                ) : (
                  <p>Initializing Camera...</p>
                )}
              </div>
            </div>

            <style>{`
            .face-scan-pulse {
               width: 100px;
               height: 100px;
               border-radius: 50%;
               background: rgba(30, 58, 138, 0.2);
               display: flex;
               alignItems: center;
               justifyContent: center;
               border: 1px solid rgba(30, 58, 138, 0.5);
               backdrop-filter: blur(4px);
            }
            @keyframes scanLine {
              0% { top: 10%; opacity: 0; }
              5% { opacity: 1; }
              95% { opacity: 1; }
              100% { top: 90%; opacity: 0; }
            }
            @keyframes pulse {
              0% { box-shadow: 0 0 0 0 rgba(30, 58, 138, 0.4); }
              70% { box-shadow: 0 0 0 20px rgba(24, 144, 255, 0); }
              100% { box-shadow: 0 0 0 0 rgba(24, 144, 255, 0); }
            }
          `}</style>
          </div>
        </Modal>
      </div >
    </ConfigProvider>
  );
}

export default LoginPage;