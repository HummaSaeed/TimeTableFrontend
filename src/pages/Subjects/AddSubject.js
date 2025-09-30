import React, { useState } from 'react';
import { 
  Container, Row, Col, Card, Form, Button, Alert, 
  InputGroup, Badge, Spinner 
} from 'react-bootstrap';
import { subjectsAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const AddSubject = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    is_active: true
  });
  const [showCustomInput, setShowCustomInput] = useState(false);
  const commonSubjects = [
    'English','Urdu','Mathematics','Computer','General Knowledge','Biology','Chemistry','Physics','Islamiat','Pakistan Studies','Social Studies','General Science'
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'name' && value === 'Other') {
      setShowCustomInput(true);
      setFormData(prev => ({
        ...prev,
        [name]: ''
      }));
    } else if (name === 'name' && value !== 'Other') {
      setShowCustomInput(false);
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await subjectsAPI.create(formData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/subjects');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to add subject');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      is_active: true
    });
    setShowCustomInput(false);
  };

  return (
    <div style={{
      padding: '24px',
      background: '#FFFFFF',
      fontFamily: 'Poppins, sans-serif',
      minHeight: '100vh'
    }}>
      {/* Header Section */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap">
          <div>
            <h1 style={{
              fontWeight: '700',
              color: '#333333',
              margin: 0,
              fontFamily: 'Poppins, sans-serif',
              fontSize: '28px'
            }}>
              Add New Subject
            </h1>
            <p style={{
              color: '#6C757D',
              margin: '4px 0 0 0',
              fontSize: '14px',
              fontWeight: '400'
            }}>
              Create a new academic subject for your curriculum
            </p>
          </div>
          <div className="d-flex gap-2 mt-2 mt-md-0">
            <Button
              variant="outline-secondary"
              style={{
                borderRadius: '8px',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: '500',
                padding: '10px 20px',
                fontSize: '14px',
                borderColor: '#dee2e6',
                color: '#6C757D'
              }}
              onClick={() => navigate('/subjects')}
            >
              <i className="fas fa-arrow-left me-2"></i>
              Back to Subjects
            </Button>
          </div>
        </div>
      </div>

      <Container fluid className="px-0">
        <Row className="justify-content-center">
          <Col lg={8} xl={6}>
            <Card style={{
              background: '#FFFFFF',
              border: 'none',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)'
            }}>
              <Card.Header style={{
                background: 'transparent',
                border: 'none',
                padding: '32px 32px 0 32px'
              }}>
                <div className="d-flex align-items-center mb-3">
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: '#E3F2FD',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '16px'
                  }}>
                    <i className="fas fa-book-open" style={{ color: '#1976D2', fontSize: '20px' }}></i>
                  </div>
                  <div>
                    <h4 style={{
                      margin: 0,
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: '600',
                      color: '#333333',
                      fontSize: '20px'
                    }}>
                      Subject Information
                    </h4>
                    <p style={{
                      margin: '4px 0 0 0',
                      color: '#6C757D',
                      fontSize: '14px',
                      fontFamily: 'Poppins, sans-serif'
                    }}>
                      Fill in the details below to create a new subject
                    </p>
                  </div>
                </div>
              </Card.Header>
              <Card.Body style={{ padding: '0 32px 32px 32px' }}>
                {error && (
                  <Alert variant="danger" onClose={() => setError(null)} dismissible>
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert variant="success" onClose={() => setSuccess(false)} dismissible>
                    Subject added successfully! Redirecting to subjects list...
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label style={{
                          fontFamily: 'Poppins, sans-serif',
                          fontWeight: '500',
                          color: '#333333',
                          fontSize: '14px',
                          marginBottom: '8px'
                        }}>
                          Subject Name *
                        </Form.Label>
                        {showCustomInput ? (
                          <Form.Control
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="Enter custom subject name..."
                            style={{
                              borderRadius: '8px',
                              border: '1px solid #dee2e6',
                              fontFamily: 'Poppins, sans-serif',
                              fontSize: '14px',
                              padding: '12px 16px'
                            }}
                          />
                        ) : (
                          <Form.Select
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            style={{
                              borderRadius: '8px',
                              border: '1px solid #dee2e6',
                              fontFamily: 'Poppins, sans-serif',
                              fontSize: '14px',
                              padding: '12px 16px'
                            }}
                          >
                            <option value="">Select subject</option>
                            {commonSubjects.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                            <option value="Other">Other (Custom)</option>
                          </Form.Select>
                        )}
                      </Form.Group>
                    </Col>

                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label style={{
                          fontFamily: 'Poppins, sans-serif',
                          fontWeight: '500',
                          color: '#333333',
                          fontSize: '14px',
                          marginBottom: '8px'
                        }}>
                          Subject Code *
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="code"
                          value={formData.code}
                          onChange={handleChange}
                          required
                          placeholder="e.g., MATH, SCI"
                          style={{
                            borderRadius: '8px',
                            border: '1px solid #dee2e6',
                            fontFamily: 'Poppins, sans-serif',
                            fontSize: '14px',
                            padding: '12px 16px'
                          }}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={12} className="mb-3">
                      <Form.Group>
                        <Form.Label style={{
                          fontFamily: 'Poppins, sans-serif',
                          fontWeight: '500',
                          color: '#333333',
                          fontSize: '14px',
                          marginBottom: '8px'
                        }}>
                          Description
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          placeholder="Enter subject description..."
                          style={{
                            borderRadius: '8px',
                            border: '1px solid #dee2e6',
                            fontFamily: 'Poppins, sans-serif',
                            fontSize: '14px',
                            padding: '12px 16px'
                          }}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={12} className="mb-4">
                      <Form.Check
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleChange}
                        label="Active Subject"
                        style={{
                          fontFamily: 'Poppins, sans-serif',
                          fontWeight: '500',
                          color: '#333333',
                          fontSize: '14px'
                        }}
                      />
                    </Col>
                  </Row>

                  {/* Action Buttons */}
                  <Row className="mt-5">
                    <Col className="d-flex justify-content-end gap-3">
                      <Button 
                        variant="outline-secondary"
                        onClick={resetForm}
                        disabled={loading}
                        style={{
                          borderRadius: '8px',
                          padding: '12px 24px',
                          fontFamily: 'Poppins, sans-serif',
                          fontWeight: '500',
                          fontSize: '14px',
                          borderColor: '#dee2e6',
                          color: '#6C757D'
                        }}
                      >
                        <i className="fas fa-undo me-2"></i>
                        Reset Form
                      </Button>
                      <Button 
                        type="submit"
                        disabled={loading}
                        style={{
                          background: '#1A6E48',
                          border: 'none',
                          borderRadius: '8px',
                          color: 'white',
                          padding: '12px 32px',
                          fontFamily: 'Poppins, sans-serif',
                          fontWeight: '500',
                          fontSize: '14px'
                        }}
                      >
                        {loading ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" style={{ color: 'white' }} />
                            Adding Subject...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save me-2"></i>
                            Add Subject
                          </>
                        )}
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AddSubject; 