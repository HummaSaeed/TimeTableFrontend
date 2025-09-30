import React, { useState } from 'react';
import { 
  Container, Row, Col, Card, Form, Button, Alert, 
  InputGroup, Badge, Spinner, ProgressBar 
} from 'react-bootstrap';
import { timetableAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const GenerateTimetable = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    academic_year: '',
    clear_existing: true,
    max_attempts: 100
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setProgress(0);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 500);

    try {
      console.log('Generating timetable with data:', formData);
      const response = await timetableAPI.generateTimetable(formData);
      console.log('Timetable generation response:', response);
      
      setProgress(100);
      setSuccess(true);
      
      // Show success message with details
      if (response.data) {
        console.log('Slots created:', response.data.slots_created);
        console.log('Output:', response.data.output);
      }
      
      setTimeout(() => {
        navigate('/timetable');
      }, 3000);
    } catch (error) {
      console.error('Timetable generation error:', error);
      console.error('Error response:', error.response);
      setError(error.response?.data?.error || error.response?.data?.message || 'Failed to generate timetable');
    } finally {
      setLoading(false);
      clearInterval(progressInterval);
    }
  };

  const resetForm = () => {
    setFormData({
      academic_year: '',
      clear_existing: true,
      max_attempts: 100
    });
  };

  return (
    <div className="generate-timetable-page">
      {/* Header Section */}
      <div className="page-header py-4 mb-4" style={{ 
        background: 'linear-gradient(135deg, #2d5a27 0%, #4a7c59 100%)', 
        borderRadius: '0 0 2rem 2rem' 
      }}>
        <Container>
          <Row className="align-items-center">
            <Col md={8}>
              <h1 className="text-white fw-bold mb-2">Generate Timetable</h1>
              <p className="text-white opacity-75 mb-0">Automatically generate optimal timetable</p>
            </Col>
            <Col md={4} className="text-end">
              <Button 
                variant="outline-light" 
                onClick={() => navigate('/timetable')}
                className="me-2"
              >
                <i className="fas fa-arrow-left me-2"></i>
                Back to Timetable
              </Button>
            </Col>
          </Row>
        </Container>
      </div>

      <Container fluid className="px-4">
        <Row className="justify-content-center">
          <Col lg={8}>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-transparent border-0 pb-0">
                <h5 className="mb-0 fw-bold">Timetable Generation Settings</h5>
              </Card.Header>
              <Card.Body className="p-4">
                {error && (
                  <Alert variant="danger" onClose={() => setError(null)} dismissible>
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert variant="success" onClose={() => setSuccess(false)} dismissible>
                    <h6>Timetable Generated Successfully!</h6>
                    <p className="mb-0">Your timetable has been generated and is ready to view. Redirecting to timetable page...</p>
                  </Alert>
                )}

                {loading && (
                  <Alert variant="info" className="mb-4">
                    <div className="d-flex align-items-center mb-2">
                      <Spinner animation="border" size="sm" className="me-2" />
                      <strong>Generating Timetable...</strong>
                    </div>
                    <ProgressBar 
                      now={progress} 
                      label={`${progress}%`}
                      className="mb-0"
                    />
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Academic Year *</Form.Label>
                        <Form.Control
                          type="text"
                          name="academic_year"
                          value={formData.academic_year}
                          onChange={handleChange}
                          required
                          placeholder="e.g., 2024-2025"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Max Attempts</Form.Label>
                        <Form.Control
                          type="number"
                          name="max_attempts"
                          value={formData.max_attempts}
                          onChange={handleChange}
                          min="1"
                          max="1000"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={12} className="mb-4">
                      <Form.Check
                        type="checkbox"
                        name="clear_existing"
                        checked={formData.clear_existing}
                        onChange={handleChange}
                        label="Clear existing timetable before generating"
                      />
                    </Col>
                  </Row>

                  {/* Generation Options */}
                  <Row className="mb-4">
                    <Col>
                      <h6 className="text-primary mb-3">
                        <i className="fas fa-cog me-2"></i>
                        Generation Options
                      </h6>
                      <div className="bg-light p-3 rounded">
                        <Row>
                          <Col md={6}>
                            <div className="d-flex align-items-center mb-2">
                              <i className="fas fa-check-circle text-success me-2"></i>
                              <span>Auto-assign teachers to subjects</span>
                            </div>
                            <div className="d-flex align-items-center mb-2">
                              <i className="fas fa-check-circle text-success me-2"></i>
                              <span>Distribute periods evenly</span>
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="d-flex align-items-center mb-2">
                              <i className="fas fa-check-circle text-success me-2"></i>
                              <span>Conflict resolution with retry logic</span>
                            </div>
                            <div className="d-flex align-items-center mb-2">
                              <i className="fas fa-check-circle text-success me-2"></i>
                              <span>School-specific configuration</span>
                            </div>
                          </Col>
                        </Row>
                      </div>
                    </Col>
                  </Row>

                  {/* Action Buttons */}
                  <Row className="mt-4">
                    <Col className="d-flex justify-content-end gap-2">
                      <Button 
                        variant="outline-secondary" 
                        onClick={resetForm}
                        disabled={loading}
                      >
                        <i className="fas fa-undo me-2"></i>
                        Reset
                      </Button>
                      <Button 
                        variant="primary" 
                        type="submit"
                        disabled={loading}
                        size="lg"
                      >
                        {loading ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-magic me-2"></i>
                            Generate Timetable
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

export default GenerateTimetable; 