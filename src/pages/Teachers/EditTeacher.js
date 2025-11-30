import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { teachersAPI } from '../../services/api';

const EditTeacher = () => {
  const { teacherId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
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
    is_active: true,
  });

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        setLoading(true);
        const res = await teachersAPI.getById(teacherId);
        const t = res.data;
        console.log('Fetched teacher data:', t);

        const formDataObj = {
          name: t.name || '',
          email: t.email || '',
          phone_number: t.phone_number || '',
          gender: t.gender || '',
          subject_specialists: t.subject_specialists || [],
          primary_subject: t.primary_subject || '',
          previous_subjects: t.previous_subjects || [],
          designation: t.designation || '',
          qualification: t.qualification || '',
          experience_years: t.experience_years ?? '',
          is_class_teacher: !!t.is_class_teacher,
          class_teacher_class: t.class_teacher_class ?? '',
          class_teacher_section: t.class_teacher_section ?? '',
          is_active: !!t.is_active,
        };

        console.log('Setting form data:', formDataObj);
        setFormData(formDataObj);
      } catch (e) {
        console.error('Failed to load teacher:', e);
        setError('Failed to load teacher');
      } finally {
        setLoading(false);
      }
    };
    fetchTeacher();
  }, [teacherId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Validate email format
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError('Please enter a valid email address');
        setSaving(false);
        return;
      }

      const payload = { ...formData };
      if (!payload.is_class_teacher) {
        payload.class_teacher_class = null;
        payload.class_teacher_section = null;
      } else {
        const cls = parseInt(payload.class_teacher_class, 10);
        payload.class_teacher_class = Number.isNaN(cls) ? null : cls;
      }
      if (payload.experience_years === '') delete payload.experience_years;
      else payload.experience_years = parseInt(payload.experience_years, 10) || 0;

      console.log('Updating teacher with payload:', payload);
      await teachersAPI.update(teacherId, payload);
      setSuccess(true);
      setTimeout(() => navigate('/teachers'), 1200);
    } catch (e) {
      console.error('Teacher update error:', e);

      // Handle specific error cases
      if (e.response?.data?.non_field_errors) {
        setError(e.response.data.non_field_errors.join(', '));
      } else if (e.response?.data?.email) {
        setError(`Email error: ${e.response.data.email.join(', ')}`);
      } else if (e.response?.data?.error) {
        setError(e.response.data.error);
      } else {
        setError('Failed to update teacher. Please check the console for details.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <div className="edit-teacher-page">
      <div className="page-header py-4 mb-4" style={{ background: '#1A6E48', borderRadius: '0 0 2rem 2rem' }}>
        <Container>
          <Row className="align-items-center">
            <Col md={8}>
              <h1 className="text-white fw-bold mb-2">Edit Teacher</h1>
              <p className="text-white opacity-75 mb-0">Update teacher details</p>
            </Col>
            <Col md={4} className="text-end">
              <Button variant="outline-light" onClick={() => navigate('/teachers')}>
                <i className="fas fa-arrow-left me-2"></i>
                <span className="back-btn-text">Back to Teachers</span>
              </Button>
            </Col>
          </Row>
        </Container>
      </div>

      <Container fluid className="px-4">
        <Row className="justify-content-center">
          <Col lg={8}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
                {success && <Alert variant="success" onClose={() => setSuccess(false)} dismissible>Teacher updated successfully!</Alert>}

                {/* Debug info removed for production UI */}

                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Full Name *</Form.Label>
                        <Form.Control name="name" value={formData.name} onChange={handleChange} required />
                      </Form.Group>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Email *</Form.Label>
                        <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} required />
                        <Form.Text className="text-muted">
                          <i className="fas fa-info-circle me-1"></i>
                          If you get an email conflict error, the email might be used by another teacher or user account.
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Phone</Form.Label>
                        <Form.Control name="phone_number" value={formData.phone_number} onChange={handleChange} />
                      </Form.Group>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Gender</Form.Label>
                        <Form.Select name="gender" value={formData.gender} onChange={handleChange}>
                          <option value="">Select gender</option>
                          <option value="M">Male</option>
                          <option value="F">Female</option>
                          <option value="O">Other</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Subject Specialists *</Form.Label>
                        <div className="mb-2">
                          {formData.subject_specialists.map((subject, index) => (
                            <div key={index} className="d-flex align-items-center mb-2">
                              <Form.Control
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
                                placeholder="Enter subject name"
                              />
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
                          <Button
                            variant="outline-primary"
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
                        </div>
                        <Form.Text className="text-muted">
                          Select all subjects this teacher can teach. The first subject will be set as primary.
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Designation</Form.Label>
                        <Form.Control name="designation" value={formData.designation} onChange={handleChange} />
                      </Form.Group>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Qualification</Form.Label>
                        <Form.Control name="qualification" value={formData.qualification} onChange={handleChange} />
                      </Form.Group>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Experience (Years)</Form.Label>
                        <Form.Control type="number" name="experience_years" value={formData.experience_years} onChange={handleChange} min="0" />
                      </Form.Group>
                    </Col>

                    <Col md={12} className="mt-3">
                      <Form.Check type="checkbox" name="is_class_teacher" checked={formData.is_class_teacher} onChange={handleChange} label="Assign as Class Teacher" />
                    </Col>

                    {formData.is_class_teacher && (
                      <>
                        <Col md={6} className="mb-3">
                          <Form.Group>
                            <Form.Label>Class</Form.Label>
                            <Form.Control name="class_teacher_class" value={formData.class_teacher_class} onChange={handleChange} placeholder="e.g., 10" />
                          </Form.Group>
                        </Col>
                        <Col md={6} className="mb-3">
                          <Form.Group>
                            <Form.Label>Section</Form.Label>
                            <Form.Control name="class_teacher_section" value={formData.class_teacher_section} onChange={handleChange} placeholder="e.g., A" />
                          </Form.Group>
                        </Col>
                      </>
                    )}

                    <Col md={12} className="mt-3">
                      <Form.Check type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} label="Active Teacher" />
                    </Col>
                  </Row>

                  <div className="d-flex justify-content-end gap-2 mt-4">
                    <Button variant="outline-secondary" onClick={() => navigate('/teachers')} disabled={saving}>Cancel</Button>
                    <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
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

export default EditTeacher;

