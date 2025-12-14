import React, { useState } from "react";
import { User, Lock, ChevronRight, Mail } from "lucide-react";

function AnimatedLoginPage() {
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: ''
  });
  const [errors, setErrors] = useState({});

  // Placeholder for your actual request function
  const request = async (endpoint, method, data) => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ access_token: 'mock_token', profile: { user_id: '123' }, permission: {} });
      }, 1500);
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }
    
    if (isRegistering && !formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (isRegistering && formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const onLogin = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const res = await request("auth/login", "post", {
        username: formData.username,
        password: formData.password,
      });
      
      if (res && !res.error) {
        // Handle successful login
        console.log("Login successful!", res);
        // You would typically set tokens and navigate here
      } else {
        setErrors({ general: "Login failed! Please check your credentials." });
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrors({ general: "An error occurred. Please try again later." });
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const res = await request("auth/register", "post", {
        username: formData.username,
        password: formData.password,
        email: formData.email,
      });
      
      if (res && !res.error) {
        console.log("Registration successful!");
        setIsRegistering(false);
        setFormData({ username: '', password: '', email: '' });
      } else {
        setErrors({ general: "Registration failed! Please try again." });
      }
    } catch (error) {
      console.error("Registration error:", error);
      setErrors({ general: "An error occurred during registration." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{
      background: 'linear-gradient(90deg, #C7C5F4, #776BCC)'
    }}>
      <div 
        className="relative w-96 h-[600px] rounded-lg shadow-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(90deg, #5D54A4, #7C78B8)',
          boxShadow: '0px 0px 24px #5C5696'
        }}
      >
        {/* Animated Background Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute w-[520px] h-[520px] bg-white rounded-tl-[72px] transform rotate-45 transition-all duration-1000 hover:rotate-[50deg]"
            style={{ top: '-50px', right: '120px' }}
          />
          <div 
            className="absolute w-[220px] h-[220px] rounded-[32px] transform rotate-45 transition-all duration-1000 hover:rotate-[50deg]"
            style={{ 
              background: '#6C63AC',
              top: '-172px',
              right: '0'
            }}
          />
          <div 
            className="absolute w-[190px] h-[540px] rounded-[32px] transform rotate-45 transition-all duration-1000 hover:rotate-[50deg]"
            style={{
              background: 'linear-gradient(270deg, #5D54A4, #6A679E)',
              top: '-24px',
              right: '0'
            }}
          />
          <div 
            className="absolute w-[200px] h-[400px] rounded-[60px] transform rotate-45 transition-all duration-1000 hover:rotate-[50deg]"
            style={{
              background: '#7E7BB9',
              top: '420px',
              right: '50px'
            }}
          />
        </div>

        {/* Main Content */}
        <div className="relative z-10 h-full">
          {/* Logo */}
          <div className="flex justify-center pt-8 pb-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg transform transition-all duration-300 hover:scale-110">
              <span className="text-2xl font-bold text-teal-600">P</span>
            </div>
          </div>

          <div className="px-8 pt-8">
            <h1 className="text-white text-center text-2xl font-bold mb-8 opacity-90">
              {isRegistering ? 'Create Account' : 'Welcome Back'}
            </h1>

            {errors.general && (
              <div className="bg-red-500 bg-opacity-20 text-white text-sm p-3 rounded mb-4 backdrop-blur-sm">
                {errors.general}
              </div>
            )}

            {/* Email Field (Registration only) */}
            {isRegistering && (
              <div className="relative mb-6 group">
                <Mail 
                  size={20} 
                  className="absolute left-0 top-3 text-purple-300 transition-colors duration-200 group-hover:text-white" 
                />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Email"
                  className="w-full bg-transparent border-none border-b-2 border-gray-300 text-white placeholder-purple-200 pl-8 py-3 focus:outline-none focus:border-purple-200 transition-colors duration-200 font-semibold"
                />
                {errors.email && (
                  <span className="text-red-300 text-sm mt-1 block">{errors.email}</span>
                )}
              </div>
            )}

            {/* Username Field */}
            <div className="relative mb-6 group">
              <User 
                size={20} 
                className="absolute left-0 top-3 text-purple-300 transition-colors duration-200 group-hover:text-white" 
              />
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="Username"
                className="w-full bg-transparent border-none border-b-2 border-gray-300 text-white placeholder-purple-200 pl-8 py-3 focus:outline-none focus:border-purple-200 transition-colors duration-200 font-semibold"
              />
              {errors.username && (
                <span className="text-red-300 text-sm mt-1 block">{errors.username}</span>
              )}
            </div>

            {/* Password Field */}
            <div className="relative mb-8 group">
              <Lock 
                size={20} 
                className="absolute left-0 top-3 text-purple-300 transition-colors duration-200 group-hover:text-white" 
              />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Password"
                className="w-full bg-transparent border-none border-b-2 border-gray-300 text-white placeholder-purple-200 pl-8 py-3 focus:outline-none focus:border-purple-200 transition-colors duration-200 font-semibold"
              />
              {errors.password && (
                <span className="text-red-300 text-sm mt-1 block">{errors.password}</span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={isRegistering ? onRegister : onLogin}
              disabled={loading}
              className="w-full bg-white text-purple-600 font-bold py-4 px-6 rounded-full flex items-center justify-between transition-all duration-200 hover:bg-gray-100 hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ boxShadow: '0px 2px 2px #5C5696' }}
            >
              <span className="uppercase text-sm tracking-wide">
                {loading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Log In Now')}
              </span>
              <ChevronRight size={24} className="text-purple-400" />
            </button>

            {/* Toggle Register/Login */}
            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setFormData({ username: '', password: '', email: '' });
                  setErrors({});
                }}
                className="text-white text-sm hover:text-purple-200 transition-colors duration-200 underline"
              >
                {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </div>

          {/* Social Login */}
          <div className="absolute bottom-0 right-0 w-40 h-32 text-center text-white p-4">
            <h3 className="text-sm mb-4 opacity-80">Connect with</h3>
            <div className="flex justify-center space-x-2">
              <a 
                href="#" 
                className="text-white hover:text-purple-200 transition-all duration-200 hover:scale-150 text-lg"
                style={{ textShadow: '0px 0px 8px #7875B5' }}
              >
                📱
              </a>
              <a 
                href="#" 
                className="text-white hover:text-purple-200 transition-all duration-200 hover:scale-150 text-lg"
                style={{ textShadow: '0px 0px 8px #7875B5' }}
              >
                📘
              </a>
              <a 
                href="#" 
                className="text-white hover:text-purple-200 transition-all duration-200 hover:scale-150 text-lg"
                style={{ textShadow: '0px 0px 8px #7875B5' }}
              >
                🐦
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnimatedLoginPage;