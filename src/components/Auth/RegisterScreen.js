import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const RegisterScreen = () => {
  // Load Poppins font
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password_confirm: '',
    schoolName: '',
    schoolCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    // Frontend validation
    if (!formData.schoolName.trim()) {
      alert('Please enter a school name');
      return;
    }

    if (!formData.schoolCode.trim()) {
      alert('Please enter a school code');
      return;
    }

    if (formData.schoolName.trim().length < 3) {
      alert('School name must be at least 3 characters long');
      return;
    }

    if (formData.password !== formData.password_confirm) {
      alert('Passwords do not match!');
      return;
    }

    try {
      // Send all the required fields including school details
      const registrationData = {
        email: formData.email,
        password: formData.password,
        password_confirm: formData.password_confirm,
        school_name: formData.schoolName.trim(),        // Include school name
        school_code: formData.schoolCode.trim()         // Include school code
      };
      
      // Debug: Log what's being sent
      console.log('Sending registration data:', registrationData);
      
      await register(registrationData);
      navigate('/dashboard');
    } catch (error) {
      // Error is handled by the auth context
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center" 
         style={{ 
           background: `
             linear-gradient(135deg, rgba(45, 90, 39, 0.75) 0%, rgba(74, 124, 89, 0.75) 100%),
             url('https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')
           `,
           backgroundSize: 'cover',
           backgroundPosition: 'center',
           backgroundAttachment: 'fixed',
           position: 'relative',
           overflow: 'hidden'
         }}>
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={6} xl={5}>
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
                  <h3 className="fw-bold mb-2" style={{ 
                    color: '#2d5a27', 
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '2rem',
                    letterSpacing: '-0.5px'
                  }}>Create Account</h3>
                  <p className="mb-0" style={{ 
                    color: '#4a7c59', 
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '0.95rem',
                    fontWeight: '400'
                  }}>Join EduScheduler Pro - Professional Timetable Management</p>
                </div>

                {error && (
                  <Alert variant="danger" onClose={clearError} dismissible>
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>School Name <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="e.g., St. Mary's High School"
                          value={formData.schoolName}
                          onChange={(e) => handleInputChange('schoolName', e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>School Code <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="e.g., SMHS001"
                          value={formData.schoolCode}
                          onChange={(e) => handleInputChange('schoolCode', e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Password</Form.Label>
                        <div className="password-field-container">
                          <Form.Control
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter password"
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            required
                          />
                          <Button
                            type="button"
                            variant="link"
                            className="password-toggle-btn"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                          </Button>
                        </div>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Confirm Password</Form.Label>
                        <div className="password-field-container">
                          <Form.Control
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm password"
                            value={formData.password_confirm}
                            onChange={(e) => handleInputChange('password_confirm', e.target.value)}
                            required
                          />
                          <Button
                            type="button"
                            variant="link"
                            className="password-toggle-btn"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                          </Button>
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-4">
                    <Form.Check
                      type="checkbox"
                      id="terms"
                      label="I agree to the terms and conditions"
                      required
                    />
                  </Form.Group>

                  <Button
                    type="submit"
                    variant="success"
                    size="lg"
                    className="w-100 mb-3"
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
                    Create Account
                  </Button>

                  <div className="text-center">
                    <p className="text-muted mb-0">
                      Already have an account?{' '}
                      <Link to="/login" className="text-decoration-none text-success">
                        Sign In
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

export default RegisterScreen; 