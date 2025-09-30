import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, setAuthTokens, getAuthTokens, isAuthenticated } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        if (isAuthenticated()) {
          const tokens = getAuthTokens();
          const savedEmail = localStorage.getItem('user_email');
          const savedName = localStorage.getItem('user_name');
          
          if (tokens.access && tokens.userType) {
            setUser({ 
              userType: tokens.userType, 
              email: savedEmail, 
              name: savedName 
            });
          } else {
            // Clear invalid tokens
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user_type');
            localStorage.removeItem('user_email');
            localStorage.removeItem('user_name');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Clear invalid tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_type');
        localStorage.removeItem('user_email');
        localStorage.removeItem('user_name');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials, userType = 'school') => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Attempting login with:', { credentials, userType });
      
      let response;
      
      if (userType === 'school') {
        response = await authAPI.loginSchool(credentials);
      } else {
        response = await authAPI.loginTeacher(credentials);
      }

      console.log('Login response:', response.data);
      
      // Extract tokens from the response - they might be nested under 'tokens' key
      const tokens = response.data.tokens || response.data;
      const { access, refresh } = tokens;
      
      if (!access || !refresh) {
        console.error('Missing tokens in response:', response.data);
        throw new Error('Invalid response: missing tokens');
      }
      
      setAuthTokens(access, refresh, userType);
      
      const derivedEmail = response.data?.email || credentials.email;
      const derivedName = response.data?.name || credentials.name || undefined;
      
      if (derivedEmail) localStorage.setItem('user_email', derivedEmail);
      if (derivedName) localStorage.setItem('user_name', derivedName);

      const userData = { 
        userType, 
        email: derivedEmail, 
        name: derivedName, 
        ...response.data 
      };
      
      setUser(userData);
      console.log('Login successful, user set:', userData);
      return response.data;
    } catch (error) {
      console.error('Login error details:', error);
      console.error('Login error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail ||
                          error.message || 
                          'Login failed';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.registerSchool(userData);
      // Extract tokens from the response - they might be nested under 'tokens' key
      const tokens = response.data.tokens || response.data;
      const { access, refresh } = tokens;
      
      if (!access || !refresh) {
        throw new Error('Invalid response: missing tokens');
      }
      
      setAuthTokens(access, refresh, 'school');
      
      const derivedEmail = response.data?.email || userData.email;
      if (derivedEmail) localStorage.setItem('user_email', derivedEmail);
      
      const userDataObj = { 
        userType: 'school', 
        email: derivedEmail, 
        name: userData.name || undefined, 
        ...response.data 
      };
      
      setUser(userDataObj);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.password_confirm?.[0] ||
                          error.response?.data?.email?.[0] ||
                          error.response?.data?.password?.[0] ||
                          error.message ||
                          'Registration failed';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Attempting password reset for:', email);
      
      // Try school admin password reset first
      try {
        console.log('Trying school admin password reset...');
        const response = await authAPI.resetSchoolAdminPassword({ email });
        console.log('School admin reset successful:', response.data);
        return response.data;
      } catch (adminError) {
        console.log('School admin reset failed:', adminError.response?.data || adminError.message);
        
        // If school admin reset fails, try teacher reset
        console.log('Trying teacher password reset...');
        const response = await authAPI.resetPassword({ email });
        console.log('Teacher reset successful:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Password reset failed:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail ||
                          error.response?.data?.email?.[0] ||
                          error.message ||
                          'No account found with this email address';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    resetPassword,
    clearError,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 