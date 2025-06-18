import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');
      const userString = searchParams.get('user');

      if (error) {
        toast.error('Authentication failed. Please try again.');
        navigate('/login');
        return;
      }

      if (token && userString) {
        try {
          const user = JSON.parse(decodeURIComponent(userString));
          
          // Store token and user data
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          
          // Update auth context
          if (loginWithToken) {
            await loginWithToken(token, user);
          }
          
          toast.success(`Welcome back, ${user.firstName || user.email}!`);
          navigate('/dashboard');
        } catch (error) {
          console.error('OAuth callback error:', error);
          toast.error('Authentication failed. Please try again.');
          navigate('/login');
        }
      } else {
        toast.error('Authentication failed. Please try again.');
        navigate('/login');
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, loginWithToken]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="loading-spinner mx-auto mb-4"></div>
        <h2 className="text-lg font-medium text-gray-900">Completing sign in...</h2>
        <p className="text-sm text-gray-600">Please wait while we redirect you.</p>
      </div>
    </div>
  );
};

export default AuthCallback;