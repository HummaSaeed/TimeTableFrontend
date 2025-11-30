import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const ForgotPasswordScreen = () => {
  // Load Poppins font
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { resetPassword, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setLoading(true);
    setSuccess(false);

    try {
      await resetPassword({ email });
      setSuccess(true);
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setLoading(false);
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
                  <Button
                    variant="link"
                    className="position-absolute top-0 start-0 p-3"
                    onClick={() => navigate('/login')}
                  >
                    <i className="fas fa-arrow-left"></i>
                  </Button>
                  <div className="auth-header-icon">
                    <i className="fas fa-lock-open"></i>
                  </div>
                  <h3 className="fw-bold mb-2 auth-title">Reset Password</h3>
                  <p className="mb-0 auth-subtitle">Enter your email to receive reset instructions</p>
                </div>

                {error && (
                  <Alert variant="danger" onClose={clearError} dismissible>
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert variant="success" onClose={() => setSuccess(false)} dismissible>
                    Password reset email sent successfully! Please check your inbox.
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-4">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <Form.Text className="text-muted">
                      We'll send you a link to reset your password.
                    </Form.Text>
                  </Form.Group>

                  <Button
                    type="submit"
                    variant="success"
                    size="lg"
                    className="btn-auth mb-3 w-100"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Sending...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>

                  <div className="text-center">
                    <p className="text-muted mb-0 auth-footnote">
                      Remember your password?{' '}
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

export default ForgotPasswordScreen; 