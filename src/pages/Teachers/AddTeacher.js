import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Form, Button, Alert, 
  InputGroup, Badge, Spinner 
} from 'react-bootstrap';
import { teachersAPI, subjectsAPI, defaultSubjectsAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import DefaultSubjectsSetup from '../../components/Setup/DefaultSubjectsSetup';

const AddTeacher = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [showDefaultSubjects, setShowDefaultSubjects] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    gender: '',
    subject_specialists: [],
    primary_subject: '',
    previous_subjects: [],
    designation: '',
    qualification: '',
    experience_years: '',
    is_class_teacher: false,
    class_teacher_class: '',
    class_teacher_section: '',
    is_active: true
  });

  useEffect(() => {
    loadSubjects();
  }, []);

  // Ensure arrays are always arrays
  useEffect(() => {
    if (!Array.isArray(formData.subject_specialists)) {
      setFormData(prev => ({ ...prev, subject_specialists: [] }));
    }
    if (!Array.isArray(formData.previous_subjects)) {
      setFormData(prev => ({ ...prev, previous_subjects: [] }));
    }
  }, []);

  const loadSubjects = async () => {
    try {
      setLoadingSubjects(true);
      const response = await subjectsAPI.getAll();
      console.log('Subjects API response:', response);
      console.log('Response data:', response?.data);
      
      let subjectsData = [];
      
      // Handle different possible response structures
      if (response?.data) {
        if (Array.isArray(response.data)) {
          subjectsData = response.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          // Handle paginated response
          subjectsData = response.data.results;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // Handle nested data structure
          subjectsData = response.data.data;
        } else {
          console.warn('Unexpected subjects response format:', response.data);
        }
      }
      
      // Validate and clean the subjects data
      const validSubjects = subjectsData.filter(subject => {
        if (!subject || typeof subject !== 'object') return false;
        if (!subject.id) return false;
        // Check if at least one of the name fields exists (using correct field names)
        return subject.name || subject.subject_name || subject.title;
      });
      
      console.log('Valid subjects:', validSubjects);
      setSubjects(validSubjects);
      
    } catch (err) {
      console.error('Failed to load subjects:', err);
      console.error('Error details:', err.response);
      // If no subjects exist, we'll show the setup option
      setSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

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

    try {
      // sanitize payload: if not class teacher, drop class fields; else coerce types
      const payload = { ...formData };
      if (!payload.is_class_teacher) {
        delete payload.class_teacher_class;
        delete payload.class_teacher_section;
      } else {
        // Ensure numeric
        const clsNum = parseInt(payload.class_teacher_class, 10);
        payload.class_teacher_class = Number.isNaN(clsNum) ? null : clsNum;
      }
      // Coerce optional numbers
      if (payload.experience_years === '') {
        delete payload.experience_years;
      } else {
        const exp = parseInt(payload.experience_years, 10);
        payload.experience_years = Number.isNaN(exp) ? 0 : exp;
      }
      
      // Filter out empty subject specialists and previous subjects
      payload.subject_specialists = payload.subject_specialists.filter(s => s.trim() !== '');
      payload.previous_subjects = payload.previous_subjects.filter(s => s.subject && s.subject.trim() !== '');
      
      // Set primary subject to first specialist if not set
      if (payload.subject_specialists.length > 0 && !payload.primary_subject) {
        payload.primary_subject = payload.subject_specialists[0];
      }

      await teachersAPI.create(payload);
      setSuccess(true);
      setTimeout(() => {
        navigate('/teachers');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to add teacher');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone_number: '',
      gender: '',
      subject_specialists: [],
      primary_subject: '',
      previous_subjects: [],
      designation: '',
      qualification: '',
      experience_years: '',
      is_class_teacher: false,
      class_teacher_class: '',
      class_teacher_section: '',
      is_active: true
    });
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
              Add New Teacher
            </h1>
            {/* Tagline removed for a cleaner header */}
          </div>
          <div className="d-flex gap-2 mt-2 mt-md-0">
              <Button variant="outline-secondary" style={{ borderRadius: '8px', fontFamily: 'Poppins, sans-serif', fontWeight: '500', padding: '10px 20px', fontSize: '14px', borderColor: '#dee2e6', color: '#6C757D' }} onClick={() => navigate('/teachers')}>
                <i className="fas fa-arrow-left me-2"></i>
                <span className="back-btn-text">Back to Teachers</span>
              </Button>
          </div>
        </div>
      </div>

      <Container fluid className="px-0">
        <Row className="justify-content-center">
          <Col lg={10} xl={8}>
            <Card className="teacher-form-card" style={{
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
                    background: '#D8F3DC',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '16px'
                  }}>
                    <i className="fas fa-user-plus" style={{ color: '#1A6E48', fontSize: '20px' }}></i>
                  </div>
                  <div>
                    <h4 style={{
                      margin: 0,
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: '600',
                      color: '#333333',
                      fontSize: '20px'
                    }}>
                      Teacher Information
                    </h4>
                    <p style={{
                      margin: '4px 0 0 0',
                      color: '#6C757D',
                      fontSize: '14px',
                      fontFamily: 'Poppins, sans-serif'
                    }}>
                      Fill in the details below to add a new teacher
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
                    Teacher added successfully! Redirecting to teachers list...
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Row>
                    {/* Personal Information */}
                    <Col md={12}>
                      <div style={{
                        background: '#F8F9FA',
                        padding: '16px',
                        borderRadius: '12px',
                        marginBottom: '24px',
                        border: '1px solid #e9ecef'
                      }}>
                        <h6 style={{
                          margin: '0 0 4px 0',
                          fontFamily: 'Poppins, sans-serif',
                          fontWeight: '600',
                          color: '#1A6E48',
                          fontSize: '16px'
                        }}>
                        <i className="fas fa-user me-2"></i>
                        Personal Information
                      </h6>
                        <p style={{
                          margin: 0,
                          color: '#6C757D',
                          fontSize: '12px',
                          fontFamily: 'Poppins, sans-serif'
                        }}>
                          Basic personal details of the teacher
                        </p>
                      </div>
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
                          Full Name *
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          placeholder="Enter full name"
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

                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Email Address *</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          placeholder="Enter email address"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Phone Number</Form.Label>
                        <Form.Control
                          type="tel"
                          name="phone_number"
                          value={formData.phone_number}
                          onChange={handleChange}
                          placeholder="Enter phone number"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Gender</Form.Label>
                        <Form.Select
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                        >
                          <option value="">Select gender</option>
                          <option value="M">Male</option>
                          <option value="F">Female</option>
                          <option value="O">Other</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    {/* Professional Information */}
                    <Col md={12}>
                      <div style={{
                        background: '#F8F9FA',
                        padding: '16px',
                        borderRadius: '12px',
                        marginBottom: '24px',
                        marginTop: '32px',
                        border: '1px solid #e9ecef'
                      }}>
                        <h6 style={{
                          margin: '0 0 4px 0',
                          fontFamily: 'Poppins, sans-serif',
                          fontWeight: '600',
                          color: '#1A6E48',
                          fontSize: '16px'
                        }}>
                        <i className="fas fa-briefcase me-2"></i>
                        Professional Information
                      </h6>
                        <p style={{
                          margin: 0,
                          color: '#6C757D',
                          fontSize: '12px',
                          fontFamily: 'Poppins, sans-serif'
                        }}>
                          Teaching qualifications and subject expertise
                        </p>
                      </div>
                    </Col>

                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Subject Specialists *</Form.Label>
                        {loadingSubjects ? (
                          <div className="text-center py-3">
                            <Spinner animation="border" size="sm" /> Loading subjects...
                          </div>
                        ) : subjects.length === 0 ? (
                          <div className="text-center py-3 border rounded">
                            <p className="text-muted mb-3">No subjects found. Set up default subjects first.</p>
                            <Button 
                              variant="primary" 
                              size="sm"
                              onClick={() => setShowDefaultSubjects(true)}
                            >
                              <i className="fas fa-plus me-2"></i>Setup Default Subjects
                            </Button>
                          </div>
                        ) : (
                          <div className="mb-2">
                            {formData.subject_specialists.map((subject, index) => (
                              <div key={index} className="d-flex align-items-center mb-2">
                                <Form.Select 
                                  value={subject} 
                                  onChange={(e) => {
                                    const newSpecialists = [...formData.subject_specialists];
                                    newSpecialists[index] = e.target.value;
                                    setFormData(prev => ({
                                      ...prev,
                                      subject_specialists: newSpecialists,
                                      primary_subject: newSpecialists[0] || ''
                                    }));
                                  }}
                                  className="me-2"
                                >
                                  <option value="">Select subject</option>
                                  {loadingSubjects ? (
                                    <option value="" disabled>Loading subjects...</option>
                                  ) : Array.isArray(subjects) && subjects.length > 0 ? (
                                    subjects.map(subject => {
                                      // Debug logging
                                      console.log('Subject data:', subject);
                                      
                                      // Use the correct field names from the Subject model
                                      const subjectName = subject.name || subject.subject_name || 'Unnamed Subject';
                                      const subjectCode = subject.code || subject.subject_code || 'N/A';
                                      
                                      // Skip subjects with empty names
                                      if (!subjectName || subjectName === 'Unnamed Subject') {
                                        console.warn('Skipping subject with empty name:', subject);
                                        return null;
                                      }
                                      
                                      return (
                                        <option key={subject.id} value={subjectName}>
                                          {subjectName} ({subjectCode})
                                        </option>
                                      );
                                    }).filter(Boolean) // Remove null entries
                                  ) : (
                                    <option value="" disabled>
                                      {loadingSubjects ? 'Loading...' : 'No subjects available'}
                                    </option>
                                  )}
                                </Form.Select>
                                <Button 
                                  variant="outline-danger" 
                                  size="sm"
                                  onClick={() => {
                                    const newSpecialists = formData.subject_specialists.filter((_, i) => i !== index);
                                    setFormData(prev => ({
                                      ...prev,
                                      subject_specialists: newSpecialists,
                                      primary_subject: newSpecialists[0] || ''
                                    }));
                                  }}
                                >
                                  <i className="fas fa-times"></i>
                                </Button>
                              </div>
                            ))}
                            <div className="d-flex gap-2">
                              <Button 
                                  style={{
                                    background: '#1A6E48',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                    padding: '8px 16px',
                                    fontFamily: 'Poppins, sans-serif',
                                    fontWeight: '500',
                                    fontSize: '12px'
                                  }}
                                size="sm"
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    subject_specialists: [...prev.subject_specialists, '']
                                  }));
                                }}
                              >
                                <i className="fas fa-plus me-2"></i>Add Subject
                              </Button>
                              <Button 
                                variant="outline-secondary" 
                                  style={{
                                    borderRadius: '8px',
                                    padding: '8px 16px',
                                    fontFamily: 'Poppins, sans-serif',
                                    fontWeight: '500',
                                    fontSize: '12px',
                                    borderColor: '#dee2e6',
                                    color: '#6C757D'
                                  }}
                                size="sm"
                                onClick={() => setShowDefaultSubjects(true)}
                              >
                                <i className="fas fa-cog me-2"></i>Manage Subjects
                              </Button>
                            </div>
                          </div>
                        )}
                        <Form.Text className="text-muted">
                          Select all subjects this teacher can teach. The first subject will be set as primary.
                        </Form.Text>
                        
                        {/* Debug info - remove this after fixing */}
                        {process.env.NODE_ENV === 'development' && (
                          <div className="mt-2 p-2 bg-light rounded small">
                            <strong>Debug Info:</strong> Loaded {subjects.length} subjects
                            {subjects.length > 0 && (
                              <div className="mt-1">
                                Sample: {JSON.stringify(subjects[0], null, 2)}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Subjects status info */}
                        {!loadingSubjects && subjects.length === 0 && (
                          <Alert variant="warning" className="mt-2">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            <strong>No subjects found.</strong> You need to create subjects first before adding teachers.
                            <div className="mt-2">
                              <Button 
                                variant="outline-warning" 
                                size="sm"
                                onClick={() => setShowDefaultSubjects(true)}
                              >
                                <i className="fas fa-plus me-2"></i>
                                Setup Default Subjects
                              </Button>
                            </div>
                          </Alert>
                        )}
                      </Form.Group>
                    </Col>

                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Designation</Form.Label>
                        <Form.Select name="designation" value={formData.designation} onChange={handleChange}>
                          <option value="">Select designation</option>
                          {[ 'EST','SST','Librarian','HOD','Assistant Teacher' ].map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Qualification</Form.Label>
                        <Form.Select name="qualification" value={formData.qualification} onChange={handleChange}>
                          <option value="">Select qualification</option>
                          {[
                            'Matric', 'FSc', 'FA', 'Diploma', 'Bachelors (BA)', 'Bachelors (BSc)', 'BS', 'BS Computer Science',
                            'B.Ed', 'M.Ed', 'Masters (MA)', 'Masters (MSc)', 'MS', 'MPhil', 'PhD'
                          ].map(q => (
                            <option key={q} value={q}>{q}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Experience (Years)</Form.Label>
                        <Form.Control
                          type="number"
                          name="experience_years"
                          value={formData.experience_years}
                          onChange={handleChange}
                          placeholder="0"
                          min="0"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={12} className="mb-3">
                      <Form.Group>
                        <Form.Label>Previous Subjects (Optional)</Form.Label>
                        <div className="mb-2">
                          {Array.isArray(formData.previous_subjects) && formData.previous_subjects.map((subjectData, index) => (
                            <div key={index} className="row g-2 mb-2">
                              <div className="col-md-4">
                                <Form.Control
                                  placeholder="Subject name"
                                  value={subjectData.subject || ''}
                                  onChange={(e) => {
                                    const newSubjects = [...formData.previous_subjects];
                                    newSubjects[index] = { ...newSubjects[index], subject: e.target.value };
                                    setFormData(prev => ({ ...prev, previous_subjects: newSubjects }));
                                  }}
                                />
                              </div>
                              <div className="col-md-3">
                                <Form.Control
                                  type="number"
                                  placeholder="Years"
                                  value={subjectData.years || ''}
                                  onChange={(e) => {
                                    const newSubjects = [...formData.previous_subjects];
                                    newSubjects[index] = { ...newSubjects[index], years: e.target.value };
                                    setFormData(prev => ({ ...prev, previous_subjects: newSubjects }));
                                  }}
                                />
                              </div>
                              <div className="col-md-4">
                                <Form.Control
                                  placeholder="School name"
                                  value={subjectData.school || ''}
                                  onChange={(e) => {
                                    const newSubjects = [...formData.previous_subjects];
                                    newSubjects[index] = { ...newSubjects[index], school: e.target.value };
                                    setFormData(prev => ({ ...prev, previous_subjects: newSubjects }));
                                  }}
                                />
                              </div>
                              <div className="col-md-1">
                                <Button 
                                  variant="outline-danger" 
                                  size="sm"
                                  onClick={() => {
                                    const newSubjects = formData.previous_subjects.filter((_, i) => i !== index);
                                    setFormData(prev => ({ ...prev, previous_subjects: newSubjects }));
                                  }}
                                >
                                  <i className="fas fa-times"></i>
                                </Button>
                              </div>
                            </div>
                          ))}
                          <Button 
                            variant="outline-secondary" 
                            size="sm"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                previous_subjects: [...prev.previous_subjects, { subject: '', years: '', school: '' }]
                              }));
                            }}
                          >
                            <i className="fas fa-plus me-2"></i>Add Previous Subject
                          </Button>
                        </div>
                        <Form.Text className="text-muted">
                          Add subjects this teacher has taught previously with details.
                        </Form.Text>
                      </Form.Group>
                    </Col>

                    {/* Class Teacher Assignment */}
                    <Col md={12}>
                      <h6 className="mb-3 text-primary mt-4">
                        <i className="fas fa-users me-2"></i>
                        Class Teacher Assignment
                      </h6>
                    </Col>

                    <Col md={12} className="mb-3">
                      <Form.Check
                        type="checkbox"
                        name="is_class_teacher"
                        checked={formData.is_class_teacher}
                        onChange={handleChange}
                        label="Assign as Class Teacher"
                      />
                    </Col>

                    {formData.is_class_teacher && (
                      <>
                        <Col md={6} className="mb-3">
                          <Form.Group>
                            <Form.Label>Class</Form.Label>
                            <Form.Control
                              type="text"
                              name="class_teacher_class"
                              value={formData.class_teacher_class}
                              onChange={handleChange}
                              placeholder="e.g., 10, 12"
                            />
                          </Form.Group>
                        </Col>

                        <Col md={6} className="mb-3">
                          <Form.Group>
                            <Form.Label>Section</Form.Label>
                            <Form.Control
                              type="text"
                              name="class_teacher_section"
                              value={formData.class_teacher_section}
                              onChange={handleChange}
                              placeholder="e.g., A, B, C"
                            />
                          </Form.Group>
                        </Col>
                      </>
                    )}

                    {/* Status */}
                    <Col md={12}>
                      <h6 className="mb-3 text-primary mt-4">
                        <i className="fas fa-toggle-on me-2"></i>
                        Status
                      </h6>
                    </Col>

                    <Col md={12} className="mb-4">
                      <Form.Check
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleChange}
                        label="Active Teacher"
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
                            Adding Teacher...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save me-2"></i>
                            Add Teacher
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

      {/* Default Subjects Setup Modal */}
      <DefaultSubjectsSetup
        show={showDefaultSubjects}
        onHide={() => setShowDefaultSubjects(false)}
        onComplete={(data) => {
          // Reload subjects after creation
          loadSubjects();
          setSuccess('Subjects created successfully! You can now select them for teachers.');
        }}
      />
    </div>
  );
};

export default AddTeacher; 