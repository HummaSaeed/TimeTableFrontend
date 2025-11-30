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
      const result = await login(formData, 'school');
      
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
            <Card className="border-0 auth-card">
              <Card.Body>
                <div className="text-center mb-4">
                  <div className="auth-header-icon">
                    <i className="fas fa-graduation-cap"></i>
                  </div>
                  <h2 className="fw-bold mb-2 auth-title">EduScheduler Pro</h2>
                  <p className="mb-0 auth-subtitle">Professional Timetable Management System</p>
                </div>

                {localError && (
                  <Alert 
                    variant="danger" 
                    onClose={() => setLocalError(null)} 
                    dismissible
                    className="mb-3"
                  >
                    <div className="d-flex align-items-center">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      <span>{localError}</span>
                    </div>
                  </Alert>
                )}

                <Form onSubmit={handleSubmit} noValidate>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      disabled={isSubmitting}
                      autoComplete="email"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <div className="password-field-container">
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        required
                        disabled={isSubmitting}
                        autoComplete="current-password"
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

                  <div className="d-flex justify-content-between align-items-center mb-4 auth-utility">
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
                  className="btn-auth mb-3 w-100"
                  disabled={isSubmitting || loading}
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
                  <p className="text-muted mb-0 auth-footnote">
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