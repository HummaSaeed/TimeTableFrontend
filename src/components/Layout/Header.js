import React, { useEffect } from 'react';
import { Dropdown } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Load Poppins font
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  const handleLogout = () => {
    try {
    logout();
    } catch (e) {
      console.error('Logout error:', e);
    }
    navigate('/login');
  };

  const headerStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '70px',
    background: '#ffffff',
    borderBottom: '1px solid #e8f5e8',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    zIndex: 1001,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    fontFamily: 'Poppins, sans-serif'
  };

  const logoStyles = {
    display: 'flex',
    alignItems: 'center',
    fontSize: '20px',
    fontWeight: '600',
    color: '#2d5a27',
    textDecoration: 'none'
  };

  const userSectionStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  const userAvatarStyles = {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #2d5a27 0%, #4a7c59 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '14px'
  };

  const userInfoStyles = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end'
  };

  const userNameStyles = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2d5a27',
    margin: 0,
    lineHeight: 1.2
  };

  const userRoleStyles = {
    fontSize: '12px',
    color: '#666',
    margin: 0,
    lineHeight: 1.2
  };

  return (
    <div style={headerStyles}>
      {/* Mobile Menu Button */}
      <button
        onClick={onMenuClick}
        style={{
          display: window.innerWidth <= 768 ? 'block' : 'none',
          background: 'transparent',
          border: 'none',
          fontSize: '20px',
          color: '#2d5a27',
          cursor: 'pointer',
          padding: '8px',
          marginRight: '12px'
        }}
      >
        <i className="fas fa-bars"></i>
      </button>

      {/* Logo */}
      <div style={logoStyles}>
        <i className="fas fa-graduation-cap" style={{ marginRight: '12px', fontSize: '22px' }}></i>
        <span>EduScheduler Pro</span>
      </div>

      {/* User Section */}
      <div style={userSectionStyles}>
        {/* User Info - Hidden on mobile */}
        <div style={{
          ...userInfoStyles,
          display: window.innerWidth <= 768 ? 'none' : 'flex'
        }}>
          <div style={userNameStyles}>
            {user?.name || user?.email || 'User'}
          </div>
          <div style={userRoleStyles}>
            {user?.userType === 'teacher' ? 'Teacher' : 'Administrator'}
          </div>
        </div>
        
            <Dropdown align="end">
          <Dropdown.Toggle 
            as="div"
            style={{ 
              ...userAvatarStyles, 
              cursor: 'pointer',
              border: 'none',
              background: 'linear-gradient(135deg, #2d5a27 0%, #4a7c59 100%)'
            }}
          >
            {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
              </Dropdown.Toggle>

          <Dropdown.Menu 
            style={{
              fontFamily: 'Poppins, sans-serif',
              border: '1px solid #e8f5e8',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              minWidth: '180px'
            }}
          >
            <Dropdown.Item 
              onClick={() => navigate('/settings')}
              style={{ 
                fontSize: '14px', 
                padding: '12px 16px',
                color: '#2d5a27'
              }}
            >
                  <i className="fas fa-cog me-2"></i>
                  Settings
                </Dropdown.Item>
            <Dropdown.Divider style={{ margin: '4px 0' }} />
            <Dropdown.Item 
              onClick={handleLogout}
              style={{ 
                fontSize: '14px', 
                padding: '12px 16px',
                color: '#dc3545'
              }}
            >
                  <i className="fas fa-sign-out-alt me-2"></i>
                  Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
      </div>
    </div>
  );
};

export default Header; 
