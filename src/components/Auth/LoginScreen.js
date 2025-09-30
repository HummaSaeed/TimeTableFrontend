import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const LoginScreen = () => {
  // Load Poppins font
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState('school');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    return () => setIsMounted(false);
  }, []);

  // Debug: Track error changes
  useEffect(() => {
    console.log('LocalError changed:', localError);
  }, [localError]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear local error when user starts typing (with small delay to prevent flashing)
    if (localError && isMounted) {
      setTimeout(() => {
        if (isMounted) setLocalError(null);
      }, 100);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    // Validate form fields first
    if (!formData.email.trim() || !formData.password.trim()) {
      setLocalError('Please fill in all fields');
      setIsSubmitting(false);
      return;
    }
    
    // Clear error only after validation passes
    setLocalError(null);
    
    try {
      console.log('Attempting login...');
      const result = await login(formData, userType);
      
      console.log('Login result:', result);
      
      // Check if login was successful
      if (result && !result.error) {
        console.log('Login successful, navigating...');
        navigate('/dashboard', { replace: true });
        return;
      }
      
      // If we get here, login failed
      setLocalError('Invalid credentials. Please check your email and password.');
      
    } catch (error) {
      console.error('Login error caught:', error);
      
      // Extract meaningful error message
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      if (isMounted) {
        setLocalError(errorMessage);
      }
    } finally {
      if (isMounted) {
        setIsSubmitting(false);
      }
    }
  };



  return (
    <div className="min-vh-100 d-flex align-items-center" 
         style={{ 
           background: `
             linear-gradient(135deg, rgba(45, 90, 39, 0.75) 0%, rgba(74, 124, 89, 0.75) 100%),
             url('https://images.unsplash.com/photo-1606761568499-6d2451b23c66?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80')
           `,
           backgroundSize: 'cover',
           backgroundPosition: 'center',
           backgroundAttachment: 'fixed',
           position: 'relative',
           overflow: 'hidden'
         }}>
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={5} xl={4}>
            <Card className="border-0 shadow-lg" style={{
              background: 'rgba(248, 253, 248, 0.92)',
              backdropFilter: 'blur(5px)',
              border: '1px solid rgba(45, 90, 39, 0.2)',
              boxShadow: '0 8px 32px rgba(45, 90, 39, 0.1)',
              fontFamily: 'Poppins, sans-serif'
            }}>
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                       style={{ width: '80px', height: '80px' }}>
                    <i className="fas fa-graduation-cap text-success" style={{ fontSize: '2rem' }}></i>
                  </div>
                  <h2 className="fw-bold mb-2" style={{ 
                    color: '#2d5a27', 
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '2.2rem',
                    letterSpacing: '-0.5px'
                  }}>EduScheduler Pro</h2>
                  <p className="mb-0" style={{ 
                    color: '#4a7c59', 
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '0.95rem',
                    fontWeight: '400'
                  }}>Professional Timetable Management System</p>
                </div>

                {localError && (
                  <Alert 
                    variant="danger" 
                    onClose={() => setLocalError(null)} 
                    dismissible
                    className="mb-3"
                    style={{
                      fontFamily: 'Poppins, sans-serif',
                      fontSize: '0.9rem',
                      borderRadius: '8px'
                    }}
                  >
                    <div className="d-flex align-items-center">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      <span>{localError}</span>
                    </div>
                  </Alert>
                )}

                <Form onSubmit={handleSubmit} noValidate>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ 
                      fontFamily: 'Poppins, sans-serif', 
                      fontWeight: '600',
                      color: '#2d5a27',
                      fontSize: '0.9rem'
                    }}>Login Type</Form.Label>
                    <div className="d-flex gap-3">
                      <Form.Check
                        type="radio"
                        name="userType"
                        id="school"
                        label="Administrator"
                        checked={userType === 'school'}
                        onChange={() => setUserType('school')}
                        disabled={isSubmitting}
                      />
                      <Form.Check
                        type="radio"
                        name="userType"
                        id="teacher"
                        label="Teacher"
                        checked={userType === 'teacher'}
                        onChange={() => setUserType('teacher')}
                        disabled={isSubmitting}
                      />
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label style={{ 
                      fontFamily: 'Poppins, sans-serif', 
                      fontWeight: '600',
                      color: '#2d5a27',
                      fontSize: '0.9rem'
                    }}>Email</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      disabled={isSubmitting}
                      autoComplete="email"
                      style={{
                        borderRadius: '8px',
                        border: '1px solid rgba(45, 90, 39, 0.2)',
                        padding: '12px 16px',
                        fontFamily: 'Poppins, sans-serif'
                      }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label style={{ 
                      fontFamily: 'Poppins, sans-serif', 
                      fontWeight: '600',
                      color: '#2d5a27',
                      fontSize: '0.9rem'
                    }}>Password</Form.Label>
                    <div className="password-field-container">
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        required
                        disabled={isSubmitting}
                        autoComplete="current-password"
                        style={{
                          borderRadius: '8px',
                          border: '1px solid rgba(45, 90, 39, 0.2)',
                          padding: '12px 16px',
                          fontFamily: 'Poppins, sans-serif'
                        }}
                      />
                      <Button
                        type="button"
                        variant="link"
                        className="password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isSubmitting}
                      >
                        <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </Button>
                    </div>
                  </Form.Group>

                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <Form.Check
                      type="checkbox"
                      id="remember"
                      label="Remember me"
                      disabled={isSubmitting}
                    />
                    <Link to="/forgot-password" className="text-decoration-none text-success">
                      Forgot Password?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    variant="success"
                    size="lg"
                    className="w-100 mb-3"
                    disabled={isSubmitting || loading}
                    style={{
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: '600',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #2d5a27 0%, #4a7c59 100%)',
                      border: 'none',
                      padding: '12px 0',
                      fontSize: '1rem',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Signing In...
                      </>
                    ) : (
                      'Sign In as Administrator'
                    )}
                  </Button>



                  <div className="text-center">
                    <p className="text-muted mb-0">
                      Don't have an account?{' '}
                      <Link to="/register" className="text-decoration-none text-success">
                        Sign Up
                      </Link>
                    </p>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default LoginScreen; 