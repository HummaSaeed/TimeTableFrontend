import React, { useState, useEffect } from 'react';
import { Nav, Button } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Load Poppins font
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  // Handle mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setCollapsed(false); // On mobile, sidebar should be full width when open
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Check on mount

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (window.innerWidth <= 768 && isOpen && !event.target.closest('.sidebar-container')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const navItems = [
    {
      path: '/dashboard',
      icon: 'fa-tachometer-alt',
      label: 'Dashboard'
    },
    {
      path: '/teachers',
      icon: 'fa-chalkboard-teacher',
      label: 'Teachers'
    },
    {
      path: '/classes',
      icon: 'fa-users',
      label: 'Classes'
    },
    {
      path: '/subjects',
      icon: 'fa-book',
      label: 'Subjects'
    },
        {
          path: '/timetable',
          icon: 'fa-calendar-alt',
      label: 'Timetable'
        },
        {
          path: '/timetable/generate',
          icon: 'fa-magic',
      label: 'Generate Schedule'
    },
    {
      path: '/timetable/substitution',
      icon: 'fa-exchange-alt',
      label: 'Substitution Tracking'
    },
    {
      path: '/assignments',
      icon: 'fa-link',
      label: 'Assignments'
    },
    {
      path: '/settings',
      icon: 'fa-cog',
      label: 'Settings'
    }
  ];

  const sidebarStyles = {
    fontFamily: 'Poppins, sans-serif',
    background: '#FFFFFF',
    boxShadow: '2px 0 10px rgba(0,0,0,0.05)',
    borderRight: '1px solid #dee2e6',
    height: 'calc(100vh - 70px)',
    width: window.innerWidth <= 768 
      ? (isOpen ? '100vw' : '0') 
      : (collapsed ? '80px' : '320px'),
    transition: 'all 0.3s ease',
    position: 'fixed',
    left: 0,
    top: '70px',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transform: window.innerWidth <= 768 && !isOpen ? 'translateX(-100%)' : 'translateX(0)'
  };


  const navStyles = {
    padding: '20px 0',
    flex: 1,
    overflowY: 'hidden'
  };

  const navLinkStyles = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '18px 24px',
    margin: '0',
    borderRadius: '0',
    textDecoration: 'none',
    color: isActive ? '#ffffff' : '#333333',
    background: isActive ? '#1A6E48' : 'transparent',
    transition: 'all 0.2s ease',
    fontSize: '16px',
    fontWeight: isActive ? '600' : '500',
    border: 'none',
    outline: 'none',
    borderLeft: isActive ? '4px solid #1A6E48' : '4px solid transparent'
  });

  const iconStyles = {
    width: '24px',
    textAlign: 'center',
    marginRight: collapsed ? '0' : '18px',
    fontSize: '18px'
  };

  const userSectionStyles = {
    padding: '20px',
    borderTop: '1px solid #dee2e6',
    background: '#F8F9FA'
  };

  const userAvatarStyles = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: '#1A6E48',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '16px'
  };

  return (
    <>
      {/* Mobile Overlay */}
      {window.innerWidth <= 768 && isOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999
          }}
          onClick={onClose}
        />
      )}
      
      <div style={sidebarStyles} className="sidebar-container">
        {/* Mobile Close Button */}
        {window.innerWidth <= 768 && (
          <div style={{
            padding: '15px 20px',
            borderBottom: '1px solid #dee2e6',
            display: 'flex',
            justifyContent: 'flex-end'
          }}>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={onClose}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#6C757D',
                fontSize: '20px',
                padding: '5px 10px'
              }}
            >
              <i className="fas fa-times"></i>
            </Button>
          </div>
        )}

        {/* Desktop Toggle Button */}
        {window.innerWidth > 768 && (
          <div style={{
            padding: '15px 20px',
            borderBottom: '1px solid #dee2e6',
            display: 'flex',
            justifyContent: 'flex-end'
          }}>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#6C757D',
                fontSize: '16px',
                padding: '5px 10px'
              }}
            >
              <i className={`fas ${collapsed ? 'fa-angle-right' : 'fa-angle-left'}`}></i>
            </Button>
          </div>
        )}

        {/* Navigation Menu */}
        <div style={navStyles}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
                      <Link
              key={item.path}
                to={item.path}
              style={navLinkStyles(isActive)}
              onClick={() => {
                // Close sidebar on mobile when clicking a link
                if (window.innerWidth <= 768) {
                  onClose();
                }
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.target.style.background = '#e9ecef';
                  e.target.style.color = '#1A6E48';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#333333';
                }
              }}
            >
              <i className={`fas ${item.icon}`} style={iconStyles}></i>
                {(!collapsed || window.innerWidth <= 768) && (
                <span style={{ fontSize: '16px', fontWeight: '600' }}>
                    {item.label}
                  </span>
                )}
              </Link>
          );
        })}
          </div>

      {/* User Section */}
      <div style={userSectionStyles}>
        <div className="d-flex align-items-center mb-3">
          <div style={userAvatarStyles}>
            {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          {(!collapsed || window.innerWidth <= 768) && (
            <div className="ms-3 flex-grow-1">
              <div style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#333333',
                marginBottom: '2px'
              }}>
                {user?.name || user?.email || 'User'}
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: '#6C757D',
                fontWeight: '400'
              }}>
                {user?.userType === 'teacher' ? 'Teacher' : 'School Administrator'}
              </div>
            </div>
          )}
        </div>
        
        {(!collapsed || window.innerWidth <= 768) && (
            <Button
            variant="outline-success"
              size="sm"
            className="w-100"
            style={{
              fontFamily: 'Poppins, sans-serif',
              fontWeight: '500',
              fontSize: '13px',
              padding: '8px 16px',
              border: '1px solid #1A6E48',
              color: '#1A6E48'
            }}
              onClick={() => {
              try { 
                logout(); 
              } catch (e) {
                console.error('Logout error:', e);
              }
                navigate('/login');
                // Close sidebar on mobile after logout
                if (window.innerWidth <= 768) {
                  onClose();
                }
              }}
            onMouseEnter={(e) => {
              e.target.style.background = '#1A6E48';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = '#1A6E48';
              }}
            >
              <i className="fas fa-sign-out-alt me-2"></i>
              Logout
            </Button>
        )}
      </div>
    </div>
    </>
  );
};

export default Sidebar; 