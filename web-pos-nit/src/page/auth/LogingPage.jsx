import React, { useState } from "react";
import { Form, Button, message, Input, Space } from "antd";
import { request } from "../../util/helper";
import { setAcccessToken, setPermission, setProfile } from "../../store/profile.store";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/petronas.png"
function LoginPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
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
        navigate("/");
        message.success("Login successful!");
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
  const onRegister = async (item) => {
    setLoading(true);
    const param = {
      username: item.username,
      password: item.password,
      email: item.email,
    };
    try {
      const res = await request("auth/register", "post", param);
      if (res && !res.error) {
        message.success("Registration successful! You can now log in.");
        setIsRegistering(false);
      } else {
        message.error("Registration failed! Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      message.error("An error occurred during registration. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const abouthere = () => {
    navigate("/about")
  }
  return (
    <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      background: "radial-gradient(circle,#08a699,rgba(8,166,153,255) 100%)",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      animation: "gradientAnimation 10s ease infinite", // Optional: Add animation
    }}
  >
      <div
        style={{
          maxWidth: 320,
          width: "100%",
          margin: "0 auto",
          padding: 30,
          backgroundColor: "rgba(255, 255, 255, 0.4)", // Increased opacity for better visibility
          borderRadius: "8px",
          backdropFilter: "blur(10px)",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 24
        }}>
          <img
            src={logo}
            alt="Logo"
            style={{
              height: 80,
              width: "auto",
            }}
          />
        </div>
        <h1 style={{ textAlign: "center", color: "#333", marginBottom: 24 }}>
          {isRegistering ? "Register" : "Login"}
        </h1>
        <Form layout="vertical" form={form} onFinish={isRegistering ? onRegister : onLogin}>
          {isRegistering && (
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Please enter your email!" },
                { type: "email", message: "Please enter a valid email!" },
              ]}
            >
              <Input placeholder="Email" style={{ borderRadius: "4px" }} />
            </Form.Item>
          )}
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: "Please enter your username!" }]}
          >
            <Input placeholder="Username" style={{ borderRadius: "4px" }} />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Please enter your password!" }]}
          >
            <Input.Password placeholder="Password" style={{ borderRadius: "4px" }} />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: "100%" }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                style={{
                  backgroundColor: "#1890ff",
                  borderColor: "#1890ff",
                  borderRadius: "4px",
                  fontWeight: 500,
                }}
              >
                {isRegistering ? "Register" : "Login"}
              </Button>
            </Space>
          </Form.Item>
        </Form>

      </div>
    </div>
  );
}
export default LoginPage;