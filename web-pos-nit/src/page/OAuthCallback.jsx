import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setAcccessToken, setPermission, setProfile } from '../store/profile.store';
import { message, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import WelcomeAnimation3D from '../component/layout/WelcomeAnimation ';

function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showWelcome, setShowWelcome] = useState(false);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const error = searchParams.get('error');
        const errorMessage = searchParams.get('message');

        // Check for errors first
        if (error) {
          message.error(errorMessage || 'OAuth authentication failed');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        // Check if we have tokens
        if (!accessToken || !refreshToken) {
          message.error('No authentication tokens received');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        // Decode JWT to get profile data
        const base64Url = accessToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        
        const decoded = JSON.parse(jsonPayload);
        
        // Store tokens and profile data
        setAcccessToken(accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        
        if (decoded.data) {
          setProfile(JSON.stringify(decoded.data.profile));
          setPermission(JSON.stringify(decoded.data.permission));
          
          if (decoded.data.profile?.id) {
            localStorage.setItem('user_id', decoded.data.profile.id);
          }
        }

        // Show success message and welcome animation
        message.success('🎉 Login successful!');
        setProcessing(false);
        setShowWelcome(true);

        // Navigate to dashboard after animation
        setTimeout(() => {
          navigate('/');
        }, 2000);

      } catch (error) {
        console.error('OAuth callback error:', error);
        message.error('Failed to process authentication');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate]);

  // Show welcome animation after successful login
  if (showWelcome) {
    return <WelcomeAnimation3D />;
  }

  // Show processing state
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Spin 
        indicator={<LoadingOutlined style={{ fontSize: 48, color: '#fff' }} spin />} 
        size="large"
      />
      <h2 style={{ color: '#fff', marginTop: '20px', fontSize: '24px' }}>
        {processing ? 'Processing your login...' : 'Redirecting...'}
      </h2>
      <p style={{ color: '#fff', opacity: 0.8 }}>Please wait a moment</p>
    </div>
  );
}

export default OAuthCallback;