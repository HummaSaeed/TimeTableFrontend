import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Form, Button, Alert, 
  Spinner, Badge 
} from 'react-bootstrap';
import { schoolProfileAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const SchoolProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    school_name: '',
    school_code: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    principal_name: '',
    established_year: '',
    academic_year: '',
    timezone: 'UTC',
    working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    school_start_time: '08:00',
    school_end_time: '15:00',
    number_of_classes: 0,
    sections_per_class: 0,
    period_duration_minutes: 45,
    total_periods_per_day: 8,
    break_time: 15,
    friday_closing_time: '13:00',
    break_periods: [
      { period: 4, duration: 15, name: 'Short Break' },
      { period: 6, duration: 30, name: 'Lunch Break' }
    ],
    period_durations: [
      { period: 1, duration: 60, name: 'Assembly Period' },
      { period: 2, duration: 45, name: 'Regular Period' },
      { period: 3, duration: 45, name: 'Regular Period' },
      { period: 4, duration: 45, name: 'Regular Period' },
      { period: 5, duration: 45, name: 'Regular Period' },
      { period: 6, duration: 45, name: 'Regular Period' },
      { period: 7, duration: 45, name: 'Regular Period' },
      { period: 8, duration: 45, name: 'Regular Period' }
    ],
    assembly_time: '08:00',
    assembly_duration_minutes: 15
  });

  useEffect(() => {
    fetchSchoolProfile();
  }, []);

  const checkProfileStatus = async () => {
    try {
      const response = await schoolProfileAPI.get();
      console.log('Profile status check:', response.data);
      return response.data;
    } catch (error) {
      console.error('Profile status check failed:', error);
      return null;
    }
  };

  const fetchSchoolProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is authenticated
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('No authentication token found. Please login again.');
        setLoading(false);
        return;
      }
      
      console.log('Fetching school profile with token:', token ? 'Present' : 'Missing');
      const response = await schoolProfileAPI.getProfile();
      console.log('School profile response:', response);
      console.log('Response data:', response.data);
      
      if (response.data && response.data.data) {
        // Handle nested data structure
        setFormData(prev => ({
          ...prev,
          ...response.data.data
        }));
      } else if (response.data) {
        // Handle direct data structure
        setFormData(prev => ({
          ...prev,
          ...response.data
        }));
      } else {
        console.warn('No data in response:', response);
        setError('No data received from server');
      }
    } catch (error) {
      console.error('Error fetching school profile:', error);
      console.error('Error details:', error.response);
      
      if (error.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      } else if (error.response?.status === 404) {
        setError('School profile not found. Please create your profile first.');
      } else {
        setError(`Failed to fetch school profile: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleArrayChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => 
        i === index ? { ...item, ...value } : item
      )
    }));
  };

  const handleWorkingDaysChange = (day) => {
    setFormData(prev => ({
      ...prev,
      working_days: prev.working_days.includes(day)
        ? prev.working_days.filter(d => d !== day)
        : [...prev.working_days, day]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate required fields
      if (!formData.school_name.trim()) {
        setError('School name is required');
        return;
      }

      if (!formData.school_code.trim()) {
        setError('School code is required');
        return;
      }

      const response = await schoolProfileAPI.updateProfile(formData);
      console.log('Profile update response:', response.data);
      
      setSuccess('School profile updated successfully!');
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating school profile:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail ||
                          'Failed to update school profile';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container fluid className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" size="lg" />
          <p className="mt-3">Loading school profile...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container fluid className="py-5">
        <div className="text-center">
          <Alert variant="danger" className="max-width-600 mx-auto">
            <i className="fas fa-exclamation-triangle fa-2x mb-3"></i>
            <h4>Error Loading School Profile</h4>
            <p>{error}</p>
            <div className="mt-3">
              <Button 
                variant="primary" 
                onClick={fetchSchoolProfile}
                className="me-2"
              >
                <i className="fas fa-redo me-2"></i>
                Retry
              </Button>
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate('/dashboard')}
                className="me-2"
              >
                <i className="fas fa-home me-2"></i>
                Go to Dashboard
              </Button>
              <Button 
                variant="success" 
                onClick={() => {
                  // Try to create a default profile
                  const defaultProfile = {
                    school_name: 'My School',
                    school_code: 'SCH001',
                    address: '',
                    phone: '',
                    email: '',
                    website: '',
                    principal_name: '',
                    established_year: new Date().getFullYear(),
                    academic_year: new Date().getFullYear(),
                    timezone: 'UTC',
                    working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                    school_start_time: '08:00',
                    school_end_time: '15:00',
                    number_of_classes: 0,
                    sections_per_class: 0,
                    period_duration_minutes: 45,
                    total_periods_per_day: 8,
                    break_time: 15,
                    friday_closing_time: '13:00',
                    break_periods: [
                      { period: 4, duration: 15, name: 'Short Break' },
                      { period: 6, duration: 30, name: 'Lunch Break' }
                    ],
                    period_durations: [
                      { period: 1, duration: 60, name: 'Assembly Period' },
                      { period: 2, duration: 45, name: 'Regular Period' },
                      { period: 3, duration: 45, name: 'Regular Period' },
                      { period: 4, duration: 45, name: 'Regular Period' },
                      { period: 5, duration: 45, name: 'Regular Period' },
                      { period: 6, duration: 45, name: 'Regular Period' },
                      { period: 7, duration: 45, name: 'Regular Period' },
                      { period: 8, duration: 45, name: 'Regular Period' }
                    ],
                    assembly_time: '08:00',
                    assembly_duration_minutes: 15
                  };
                  
                  setFormData(defaultProfile);
                  setError(null);
                }}
              >
                <i className="fas fa-plus me-2"></i>
                Create Default Profile
              </Button>
            </div>
          </Alert>
        </div>
      </Container>
    );
  }

  return (
    <div className="school-profile-page">
      {/* Header Section */}
      <div className="page-header py-4 mb-4" style={{ 
        background: 'linear-gradient(135deg, #2d5a27 0%, #4a7c59 100%)', 
        borderRadius: '0 0 2rem 2rem' 
      }}>
        <Container>
          <Row className="align-items-center">
            <Col md={8}>
              <h1 className="text-white fw-bold mb-2">School Profile</h1>
              <p className="text-white opacity-75 mb-0">Manage your school information and settings</p>
            </Col>
            <Col md={4} className="text-end">
              <Button 
                variant="outline-light" 
                onClick={() => navigate('/dashboard')}
                className="me-2"
              >
                <i className="fas fa-arrow-left me-2"></i>
                Back to Dashboard
              </Button>
              <Button 
                variant="outline-light" 
                onClick={fetchSchoolProfile}
                title="Refresh profile data"
              >
                <i className="fas fa-sync-alt"></i>
              </Button>
            </Col>
          </Row>
        </Container>
      </div>

      <Container fluid className="px-4">
        {/* Help Note */}
        <Alert variant="info" className="mb-4">
          <i className="fas fa-info-circle me-2"></i>
          <strong>School Profile Management:</strong> Update your school information, contact details, and academic settings. 
          All fields marked with <span className="text-danger">*</span> are required.
        </Alert>

        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" onClose={() => setSuccess(false)} dismissible>
            <i className="fas fa-check-circle me-2"></i>
            {success}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Basic Information
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>School Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="school_name"
                      value={formData.school_name}
                      onChange={handleChange}
                      placeholder="Enter school name"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>School Code <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="school_code"
                      value={formData.school_code}
                      onChange={handleChange}
                      placeholder="Enter school code"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Principal Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="principal_name"
                      value={formData.principal_name}
                      onChange={handleChange}
                      placeholder="Enter principal name"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Established Year</Form.Label>
                    <Form.Control
                      type="number"
                      name="established_year"
                      value={formData.established_year}
                      onChange={handleChange}
                      placeholder="e.g., 1990"
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Academic Year</Form.Label>
                    <Form.Control
                      type="text"
                      name="academic_year"
                      value={formData.academic_year}
                      onChange={handleChange}
                      placeholder="e.g., 2024-2025"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Timezone</Form.Label>
                    <Form.Select
                      name="timezone"
                      value={formData.timezone}
                      onChange={handleChange}
                    >
                      <option value="UTC">UTC</option>
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Contact Information */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">
                <i className="fas fa-phone me-2"></i>
                Contact Information
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Address</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Enter school address"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Phone</Form.Label>
                    <Form.Control
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter email address"
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Website</Form.Label>
                    <Form.Control
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="Enter website URL"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Academic Settings */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">
                <i className="fas fa-graduation-cap me-2"></i>
                Academic Settings
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Number of Classes</Form.Label>
                    <Form.Control
                      type="number"
                      name="number_of_classes"
                      value={formData.number_of_classes}
                      onChange={handleChange}
                      placeholder="e.g., 12"
                      min="1"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Sections per Class</Form.Label>
                    <Form.Control
                      type="number"
                      name="sections_per_class"
                      value={formData.sections_per_class}
                      onChange={handleChange}
                      placeholder="e.g., 4"
                      min="1"
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Working Days</Form.Label>
                    <div className="d-flex flex-wrap gap-2">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                        <Form.Check
                          key={day}
                          type="checkbox"
                          id={`day-${day}`}
                          label={day}
                          checked={formData.working_days.includes(day)}
                          onChange={() => handleWorkingDaysChange(day)}
                          inline
                        />
                      ))}
                    </div>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Period Configuration */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-warning text-white">
              <h5 className="mb-0">
                <i className="fas fa-clock me-2"></i>
                Period Configuration
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Total Periods per Day</Form.Label>
                    <Form.Control
                      type="number"
                      name="total_periods_per_day"
                      value={formData.total_periods_per_day}
                      onChange={handleChange}
                      placeholder="e.g., 8"
                      min="1"
                      max="12"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Default Period Duration (minutes)</Form.Label>
                    <Form.Control
                      type="number"
                      name="period_duration_minutes"
                      value={formData.period_duration_minutes}
                      onChange={handleChange}
                      placeholder="e.g., 45"
                      min="30"
                      max="120"
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Form.Label className="mb-0">Period Durations</Form.Label>
                    <Button 
                      variant="outline-warning" 
                      size="sm"
                      onClick={() => navigate('/school/period-timing')}
                    >
                      <i className="fas fa-cog me-2"></i>
                      Configure Periods
                    </Button>
                  </div>
                  <div className="bg-light p-3 rounded">
                    <small className="text-muted">
                      Configure individual period durations (e.g., 1st period: 60 min, others: 45 min) in the Period Timing section.
                    </small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Action Buttons */}
          <Row className="mb-4">
            <Col className="d-flex justify-content-end gap-2">
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate('/dashboard')}
                disabled={saving}
              >
                <i className="fas fa-times me-2"></i>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-2"></i>
                    Save Profile
                  </>
                )}
              </Button>
            </Col>
          </Row>
        </Form>
      </Container>
    </div>
  );
};

export default SchoolProfile;
