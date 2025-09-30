import React, { useState, useEffect } from 'react';
import { 
  Row, Col, Card, Form, Button, Alert, 
  InputGroup, Badge, Spinner 
} from 'react-bootstrap';
import { classesAPI, subjectsAPI, defaultSubjectsAPI, teachersAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import DefaultSubjectsSetup from '../../components/Setup/DefaultSubjectsSetup';

const AddClass = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    class_name: '',
    section: '',
    room_number: '',
    total_strength: '',
    class_teacher: '',
    selected_subjects: [],
    is_active: true
  });

  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [subjectTemplate, setSubjectTemplate] = useState('');
  const [showDefaultSubjects, setShowDefaultSubjects] = useState(false);

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

    // Validate subject selection
    if (formData.selected_subjects.length < 5) {
      setError('Please select at least 5 subjects for this class');
      setLoading(false);
      return;
    }

    if (formData.selected_subjects.length > 8) {
      setError('Maximum 8 subjects allowed per class');
      setLoading(false);
      return;
    }

    // Validate teacher if selected
    if (formData.class_teacher && !availableTeachers.find(t => t.id == formData.class_teacher)) {
      setError('Selected teacher is not valid. Please refresh and try again.');
      setLoading(false);
      return;
    }

    // Validate that selected teacher is active
    if (formData.class_teacher) {
      const selectedTeacher = availableTeachers.find(t => t.id == formData.class_teacher);
      if (selectedTeacher && !selectedTeacher.is_active) {
        setError('Selected teacher is not active. Please choose an active teacher.');
        setLoading(false);
        return;
      }
    }

    try {
      const payload = { ...formData };
      
      // Convert selected_subjects to subjects_input array (as expected by the API)
      if (Array.isArray(formData.selected_subjects) && formData.selected_subjects.length > 0) {
        payload.subjects_input = formData.selected_subjects;
      } else {
        payload.subjects_input = [];
      }
      
      // Clean up the payload
      delete payload.selected_subjects;
      
      // Handle total_strength
      if (payload.total_strength === '') delete payload.total_strength;
      else payload.total_strength = parseInt(payload.total_strength, 10) || 0;
      
      // Handle class_teacher - convert to integer if selected, or null if empty
      if (payload.class_teacher === '') {
        delete payload.class_teacher;
      } else {
        payload.class_teacher = parseInt(payload.class_teacher, 10);
      }
      
      console.log('Sending payload to API:', payload);
      console.log('Payload subjects_input:', payload.subjects_input);
      console.log('Payload subjects_input type:', typeof payload.subjects_input);
      console.log('Payload subjects_input length:', payload.subjects_input.length);
      console.log('Payload class_teacher:', payload.class_teacher);
      console.log('Selected teacher name:', availableTeachers.find(t => t.id == payload.class_teacher)?.name);
      
      await classesAPI.create(payload);
      setSuccess(true);
      setTimeout(() => {
        navigate('/classes');
      }, 2000);
    } catch (error) {
      console.error('Error creating class:', error);
      setError(error.response?.data?.error || error.response?.data?.message || 'Failed to add class');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      try {
        await Promise.all([
          fetchSubjects(),
          loadTeachers()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadAllData();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoadingSubjects(true);
      const response = await subjectsAPI.getAll();
      console.log('Subjects API response:', response);
      
      let subjectsData = [];
      if (response?.data) {
        if (Array.isArray(response.data)) {
          subjectsData = response.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          subjectsData = response.data.results;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          subjectsData = response.data.data;
        }
      }
      
      console.log('Processed subjects data:', subjectsData);
      console.log('Subjects structure:', subjectsData.map(s => ({ id: s.id, name: s.name, code: s.code })));
      setAvailableSubjects(subjectsData);
    } catch (error) {
      setError('Failed to fetch subjects');
      console.error('Error fetching subjects:', error);
      setAvailableSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const loadTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const response = await teachersAPI.getAll();
      console.log('Teachers API response:', response);
      
      let teachersData = [];
      if (response?.data) {
        if (Array.isArray(response.data)) {
          teachersData = response.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          teachersData = response.data.results;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          teachersData = response.data.data;
        }
      }
      
      console.log('Processed teachers data:', teachersData);
      setAvailableTeachers(teachersData);
    } catch (error) {
      setError('Failed to fetch teachers');
      console.error('Error fetching teachers:', error);
      setAvailableTeachers([]);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const handleSubjectToggle = (subjectId) => {
    console.log('Toggling subject:', subjectId);
    setFormData(prev => {
      const newSelectedSubjects = prev.selected_subjects.includes(subjectId)
        ? prev.selected_subjects.filter(id => id !== subjectId)
        : [...prev.selected_subjects, subjectId];
      
      console.log('New selected subjects:', newSelectedSubjects);
      return {
        ...prev,
        selected_subjects: newSelectedSubjects
      };
    });
  };
  const applyTemplate = () => {
    const byName = new Map(availableSubjects.map(s => [String(s.name).toLowerCase(), s.id]));
    const idsFromNames = (names) => names.map(n => byName.get(n.toLowerCase())).filter(Boolean);
    let names = [];
    switch (subjectTemplate) {
      case 'primary':
        names = ['English','Urdu','Mathematics','General Knowledge','Islamiat'];
        break;
      case 'middle':
        names = ['English','Urdu','Mathematics','Science','Islamiat','Social Studies','Computer Science'];
        break;
      case '9-A':
        names = ['English','Islamiat','Chemistry','Physics','Mathematics','Biology'];
        break;
      case '9-B':
        names = ['English','Islamiat','Chemistry','Physics','Mathematics','Computer Science'];
        break;
      case '10-A':
        names = ['English','Islamiat','Pakistan Studies','Chemistry','Physics','Mathematics','Biology'];
        break;
      case '10-B':
        names = ['English','Islamiat','Pakistan Studies','Chemistry','Physics','Mathematics','Computer Science'];
        break;
      default:
        names = [];
    }
    const ids = idsFromNames(names);
    console.log('Template names:', names);
    console.log('Template IDs:', ids);
    console.log('Available subjects map:', byName);
    setFormData(prev => ({ ...prev, selected_subjects: ids }));
  };

  const resetForm = () => {
    setFormData({
      class_name: '',
      section: '',
      room_number: '',
      total_strength: '',
      class_teacher: '',
      selected_subjects: [],
      is_active: true
    });
    setSubjectTemplate('');
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
              Add New Class
            </h1>
            <p style={{
              color: '#6C757D',
              margin: '4px 0 0 0',
              fontSize: '14px',
              fontWeight: '400'
            }}>
              Create a new class with sections and assign subjects
            </p>
          </div>
          <div className="d-flex gap-2 mt-2 mt-md-0">
            <Button
              style={{
                background: 'transparent',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: '500',
                padding: '10px 20px',
                fontSize: '14px',
                color: '#6C757D'
              }}
              onClick={() => navigate('/classes')}
            >
              <i className="fas fa-arrow-left me-2"></i>
              Back to Classes
            </Button>
          </div>
        </div>
      </div>
        <Row className="justify-content-center">
          <Col lg={8}>
            <Card style={{
              background: '#FFFFFF',
              border: 'none',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)'
            }}>
              <Card.Body style={{ padding: '32px' }}>
                {error && (
                  <Alert 
                    variant="danger" 
                    onClose={() => setError(null)} 
                    dismissible
                    style={{
                      fontFamily: 'Poppins, sans-serif',
                      borderRadius: '8px',
                      marginBottom: '24px'
                    }}
                  >
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert 
                    variant="success" 
                    onClose={() => setSuccess(false)} 
                    dismissible
                    style={{
                      fontFamily: 'Poppins, sans-serif',
                      borderRadius: '8px',
                      marginBottom: '24px'
                    }}
                  >
                    Class added successfully! Redirecting to classes list...
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
                        }}>Class Name *</Form.Label>
                        <Form.Select
                          name="class_name"
                          value={formData.class_name}
                          onChange={handleChange}
                          required
                          style={{
                            borderRadius: '8px',
                            border: '1px solid #dee2e6',
                            fontFamily: 'Poppins, sans-serif',
                            fontSize: '14px',
                            padding: '10px 12px'
                          }}
                        >
                          <option value="">Select Class</option>
                          <option value="1">Class 1</option>
                          <option value="2">Class 2</option>
                          <option value="3">Class 3</option>
                          <option value="4">Class 4</option>
                          <option value="5">Class 5</option>
                          <option value="6">Class 6</option>
                          <option value="7">Class 7</option>
                          <option value="8">Class 8</option>
                          <option value="9">Class 9</option>
                          <option value="10">Class 10</option>
                          <option value="11">Class 11</option>
                          <option value="12">Class 12</option>
                        </Form.Select>
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
                        }}>Section *</Form.Label>
                        <Form.Select
                          name="section"
                          value={formData.section}
                          onChange={handleChange}
                          required
                          style={{
                            borderRadius: '8px',
                            border: '1px solid #dee2e6',
                            fontFamily: 'Poppins, sans-serif',
                            fontSize: '14px',
                            padding: '10px 12px'
                          }}
                        >
                          <option value="">Select Section</option>
                          <option value="A">Section A</option>
                          <option value="B">Section B</option>
                          <option value="C">Section C</option>
                          <option value="D">Section D</option>
                        </Form.Select>
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
                        }}>Room Number</Form.Label>
                        <Form.Control
                          type="text"
                          name="room_number"
                          value={formData.room_number}
                          onChange={handleChange}
                          placeholder="e.g., 101, 201"
                          style={{
                            borderRadius: '8px',
                            border: '1px solid #dee2e6',
                            fontFamily: 'Poppins, sans-serif',
                            fontSize: '14px',
                            padding: '10px 12px'
                          }}
                        />
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
                        }}>Total Strength</Form.Label>
                        <Form.Control
                          type="number"
                          name="total_strength"
                          value={formData.total_strength}
                          onChange={handleChange}
                          placeholder="0"
                          min="0"
                          style={{
                            borderRadius: '8px',
                            border: '1px solid #dee2e6',
                            fontFamily: 'Poppins, sans-serif',
                            fontSize: '14px',
                            padding: '10px 12px'
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
                          marginBottom: '8px',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <i className="fas fa-chalkboard-teacher me-2" style={{ color: '#1A6E48' }}></i>
                          Class Teacher
                        </Form.Label>
                        <small style={{
                          color: '#6C757D',
                          fontFamily: 'Poppins, sans-serif',
                          fontSize: '12px',
                          display: 'block',
                          marginBottom: '8px'
                        }}>
                          Select a teacher to be responsible for this class (optional)
                        </small>
                        <Form.Select
                          name="class_teacher"
                          value={formData.class_teacher}
                          onChange={handleChange}
                          disabled={loadingTeachers}
                          style={{
                            borderRadius: '8px',
                            border: '1px solid #dee2e6',
                            fontFamily: 'Poppins, sans-serif',
                            fontSize: '14px',
                            padding: '10px 12px'
                          }}
                        >
                          <option value="">Select a class teacher (optional)</option>
                          {loadingTeachers ? (
                            <option value="" disabled>Loading teachers...</option>
                          ) : availableTeachers.length > 0 ? (
                            availableTeachers
                              .filter(teacher => teacher.is_active)
                              .map(teacher => (
                                <option key={teacher.id} value={teacher.id}>
                                  {teacher.name} - {teacher.subject_specialists?.length > 0 
                                    ? teacher.subject_specialists.join(', ') 
                                    : 'No subjects assigned'
                                  }
                                </option>
                              ))
                          ) : (
                            <option value="" disabled>No teachers available</option>
                          )}
                        </Form.Select>
                        {formData.class_teacher && (
                          <Form.Text style={{
                            color: '#17a2b8',
                            fontFamily: 'Poppins, sans-serif',
                            fontSize: '12px'
                          }}>
                            <i className="fas fa-info-circle me-1"></i>
                            Selected: {availableTeachers.find(t => t.id == formData.class_teacher)?.name}
                            {availableTeachers.find(t => t.id == formData.class_teacher)?.subject_specialists?.length > 0 && (
                              <span className="ms-2">
                                (Specializes in: {availableTeachers.find(t => t.id == formData.class_teacher)?.subject_specialists.join(', ')})
                              </span>
                            )}
                          </Form.Text>
                        )}
                        {!loadingTeachers && availableTeachers.length === 0 && (
                          <Form.Text style={{
                            color: '#ffc107',
                            fontFamily: 'Poppins, sans-serif',
                            fontSize: '12px'
                          }}>
                            No teachers found. Please add teachers first.
                          </Form.Text>
                        )}
                      </Form.Group>
                    </Col>

                    {/* Subject Selection */}
                    <Col md={12} className="mb-4">
                      <Form.Group className="mb-2">
                        <Form.Label style={{
                          fontFamily: 'Poppins, sans-serif',
                          fontWeight: '500',
                          color: '#333333',
                          fontSize: '14px',
                          marginBottom: '8px'
                        }}>Subject Template (optional)</Form.Label>
                        <div className="d-flex gap-2">
                          <Form.Select 
                            value={subjectTemplate} 
                            onChange={(e) => setSubjectTemplate(e.target.value)} 
                            style={{ 
                              maxWidth: 320,
                              borderRadius: '8px',
                              border: '1px solid #dee2e6',
                              fontFamily: 'Poppins, sans-serif',
                              fontSize: '14px',
                              padding: '10px 12px'
                            }}
                          >
                            <option value="">Select template</option>
                            <option value="primary">Primary (1–5)</option>
                            <option value="middle">Middle (6–8)</option>
                            <option value="9-A">9th (Section A)</option>
                            <option value="9-B">9th (Section B)</option>
                            <option value="10-A">10th (Section A)</option>
                            <option value="10-B">10th (Section B)</option>
                          </Form.Select>
                          <Button 
                            style={{
                              background: '#1A6E48',
                              border: 'none',
                              borderRadius: '8px',
                              fontFamily: 'Poppins, sans-serif',
                              fontWeight: '500',
                              padding: '10px 20px',
                              fontSize: '14px'
                            }}
                            onClick={applyTemplate} 
                            disabled={!subjectTemplate}
                          >
                            Apply
                          </Button>
                        </div>
                      </Form.Group>
                      <Form.Group>
                        <Form.Label style={{
                          fontFamily: 'Poppins, sans-serif',
                          fontWeight: '500',
                          color: '#333333',
                          fontSize: '14px',
                          marginBottom: '8px',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <i className="fas fa-book me-2" style={{ color: '#1A6E48' }}></i>
                          Select Subjects for this Class * (Choose 5-8 subjects)
                        </Form.Label>
                        
                        {/* Subject Selection Counter */}
                        <div className="mb-3">
                          <div className={`d-flex align-items-center gap-2 p-2 rounded ${
                            formData.selected_subjects.length >= 5 && formData.selected_subjects.length <= 8 
                              ? 'bg-success bg-opacity-10 text-success' 
                              : formData.selected_subjects.length < 5 
                                ? 'bg-warning bg-opacity-10 text-warning' 
                                : 'bg-danger bg-opacity-10 text-danger'
                          }`}>
                            <i className={`fas ${
                              formData.selected_subjects.length >= 5 && formData.selected_subjects.length <= 8 
                                ? 'fa-check-circle' 
                                : formData.selected_subjects.length < 5 
                                  ? 'fa-exclamation-triangle' 
                                  : 'fa-times-circle'
                            }`}></i>
                            <span className="fw-bold">
                              {formData.selected_subjects.length} subjects selected
                            </span>
                            <span className="small">
                              {formData.selected_subjects.length < 5 
                                ? `(Need ${5 - formData.selected_subjects.length} more)` 
                                : formData.selected_subjects.length > 8 
                                  ? `(Remove ${formData.selected_subjects.length - 8})` 
                                  : '(Perfect selection!)'
                              }
                            </span>
                          </div>
                        </div>

                        {loadingSubjects ? (
                          <div style={{
                            textAlign: 'center',
                            padding: '32px',
                            color: '#6C757D',
                            fontFamily: 'Poppins, sans-serif'
                          }}>
                            <Spinner animation="border" size="sm" style={{ color: '#1A6E48', marginRight: '8px' }} />
                            Loading subjects...
                          </div>
                        ) : (
                          <div style={{
                            border: '1px solid #dee2e6',
                            borderRadius: '12px',
                            padding: '24px',
                            background: '#f8f9fa'
                          }}>
                            {/* Selected Subjects Summary */}
                            {formData.selected_subjects.length > 0 && (
                              <div style={{
                                marginBottom: '24px',
                                padding: '20px',
                                background: '#D8F3DC',
                                borderRadius: '12px'
                              }}>
                                <h6 style={{
                                  color: '#1A6E48',
                                  marginBottom: '12px',
                                  fontFamily: 'Poppins, sans-serif',
                                  fontWeight: '600',
                                  fontSize: '16px'
                                }}>
                                  <i className="fas fa-check-circle me-2"></i>
                                  Selected Subjects ({formData.selected_subjects.length})
                                </h6>
                                <div className="d-flex flex-wrap gap-2">
                                  {formData.selected_subjects.map(subjectId => {
                                    const subject = availableSubjects.find(s => s.id === subjectId);
                                    return subject ? (
                                      <Badge 
                                        key={subject.id} 
                                        style={{
                                          background: '#1A6E48',
                                          color: 'white',
                                          padding: '8px 16px',
                                          borderRadius: '20px',
                                          fontSize: '13px',
                                          fontFamily: 'Poppins, sans-serif',
                                          fontWeight: '500',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          margin: '4px'
                                        }}
                                      >
                                        <i className="fas fa-book me-2"></i>
                                        {subject.name}
                                        <i 
                                          className="fas fa-times ms-2" 
                                          style={{ cursor: 'pointer' }}
                                          onClick={() => handleSubjectToggle(subject.id)}
                                          title="Remove subject"
                                        ></i>
                                      </Badge>
                                    ) : null;
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Available Subjects Grid - Small Cards */}
                            <div className="row g-2">
                              {availableSubjects.map((subject) => {
                                const isSelected = formData.selected_subjects.includes(subject.id);
                                const isDisabled = !isSelected && formData.selected_subjects.length >= 8;
                                
                                return (
                                  <div key={subject.id} className="col-md-4 col-lg-3 col-xl-2">
                                    <div 
                                      className={`subject-card p-2 rounded border cursor-pointer transition-all ${
                                        isSelected 
                                          ? 'bg-success text-white border-success shadow-sm' 
                                          : isDisabled
                                            ? 'bg-light text-muted border-light opacity-50'
                                            : 'bg-white border-light hover:shadow-sm hover:border-primary'
                                      }`}
                                      onClick={() => !isDisabled && handleSubjectToggle(subject.id)}
                                      style={{ 
                                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s ease',
                                        minHeight: '80px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                      }}
                                      title={isDisabled ? 'Maximum 8 subjects allowed' : `Click to ${isSelected ? 'remove' : 'add'} ${subject.name}`}
                                    >
                                      <div className="text-center w-100">
                                        <div className="mb-1">
                                          <i className={`fas fa-book ${
                                            isSelected ? 'text-white' : isDisabled ? 'text-muted' : 'text-primary'
                                          }`} style={{ fontSize: '1.2rem' }}></i>
                                        </div>
                                        <h6 className={`mb-1 fw-bold small ${
                                          isSelected ? 'text-white' : isDisabled ? 'text-muted' : 'text-dark'
                                        }`} style={{ fontSize: '0.8rem', lineHeight: '1.1' }}>
                                          {subject.name}
                                        </h6>
                                        <Badge 
                                          bg={isSelected ? 'light' : isDisabled ? 'secondary' : 'outline-secondary'} 
                                          className={`small ${
                                            isSelected ? 'text-dark' : isDisabled ? 'text-white' : 'text-secondary'
                                          }`}
                                          style={{ fontSize: '0.7rem' }}
                                        >
                                          {subject.code}
                                        </Badge>
                                      </div>
                                      
                                      {/* Selection Indicator */}
                                      <div className="text-center mt-1">
                                        {isSelected ? (
                                          <div className="text-white small">
                                            <i className="fas fa-check-circle me-1"></i>
                                            ✓
                                          </div>
                                        ) : isDisabled ? (
                                          <div className="text-muted small">
                                            <i className="fas fa-lock me-1"></i>
                                            Max
                                          </div>
                                        ) : (
                                          <div className="text-muted small">
                                            <i className="fas fa-plus me-1"></i>
                                            +
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {availableSubjects.length === 0 && (
                              <div style={{
                                textAlign: 'center',
                                padding: '32px',
                                border: '1px solid #dee2e6',
                                borderRadius: '12px',
                                background: '#ffffff'
                              }}>
                                <i className="fas fa-book-open" style={{ 
                                  fontSize: '32px',
                                  color: '#dee2e6',
                                  marginBottom: '16px'
                                }}></i>
                                <p style={{
                                  color: '#6C757D',
                                  marginBottom: '20px',
                                  fontFamily: 'Poppins, sans-serif',
                                  fontSize: '14px'
                                }}>No subjects available. Set up default subjects first.</p>
                                <Button 
                                  style={{
                                    background: '#1A6E48',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontFamily: 'Poppins, sans-serif',
                                    fontWeight: '500',
                                    padding: '8px 16px',
                                    fontSize: '13px',
                                    color: 'white'
                                  }}
                                  size="sm"
                                  onClick={() => setShowDefaultSubjects(true)}
                                >
                                  <i className="fas fa-plus me-2"></i>Setup Default Subjects
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </Form.Group>
                    </Col>

                    <Col md={12} className="mb-4">
                      <Form.Check
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleChange}
                        label="Active Class"
                        style={{
                          fontFamily: 'Poppins, sans-serif',
                          fontSize: '14px',
                          color: '#333333'
                        }}
                      />
                    </Col>

                    {/* Form Summary */}
                    <Col md={12} className="mb-4">
                      <Card style={{
                        border: '1px solid #B3E5FC',
                        background: '#E3F2FD',
                        borderRadius: '12px'
                      }}>
                        <Card.Body style={{ padding: '20px' }}>
                          <h6 style={{
                            color: '#1976D2',
                            marginBottom: '16px',
                            fontFamily: 'Poppins, sans-serif',
                            fontWeight: '600',
                            fontSize: '16px'
                          }}>
                            <i className="fas fa-info-circle me-2"></i>
                            Form Summary
                          </h6>
                          <div className="row g-2" style={{ fontSize: '14px', fontFamily: 'Poppins, sans-serif' }}>
                            <div className="col-md-3">
                              <strong style={{ color: '#333333' }}>Class:</strong> <span style={{ color: '#6C757D' }}>{formData.class_name || 'Not selected'} - {formData.section || 'Not selected'}</span>
                            </div>
                            <div className="col-md-3">
                              <strong style={{ color: '#333333' }}>Teacher:</strong> <span style={{ color: '#6C757D' }}>{formData.class_teacher ? availableTeachers.find(t => t.id == formData.class_teacher)?.name : 'Not assigned'}</span>
                            </div>
                            <div className="col-md-3">
                              <strong style={{ color: '#333333' }}>Subjects:</strong> <span style={{ color: '#6C757D' }}>{formData.selected_subjects.length} selected</span>
                            </div>
                            <div className="col-md-3">
                              <strong style={{ color: '#333333' }}>Status:</strong> <span style={{ color: '#6C757D' }}>{formData.is_active ? 'Active' : 'Inactive'}</span>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  {/* Action Buttons */}
                  <Row className="mt-4">
                    <Col className="d-flex justify-content-end gap-2">
                      <Button 
                        style={{
                          background: 'transparent',
                          border: '1px solid #dee2e6',
                          borderRadius: '8px',
                          fontFamily: 'Poppins, sans-serif',
                          fontWeight: '500',
                          padding: '10px 20px',
                          fontSize: '14px',
                          color: '#6C757D'
                        }}
                        onClick={resetForm}
                        disabled={loading}
                      >
                        <i className="fas fa-undo me-2"></i>
                        Reset
                      </Button>
                      
                      <Button 
                        style={{
                          background: 'transparent',
                          border: '1px solid #17a2b8',
                          borderRadius: '8px',
                          fontFamily: 'Poppins, sans-serif',
                          fontWeight: '500',
                          padding: '10px 20px',
                          fontSize: '14px',
                          color: '#17a2b8'
                        }}
                        onClick={() => {
                          console.log('Current form data:', formData);
                          console.log('Selected subjects:', formData.selected_subjects);
                          console.log('Available subjects:', availableSubjects);
                          console.log('Payload that will be sent:', {
                            ...formData,
                            subjects_input: formData.selected_subjects
                          });
                        }}
                        disabled={loading}
                      >
                        <i className="fas fa-bug me-2"></i>
                        Debug
                      </Button>
                      
                      <Button 
                        style={{
                          background: '#1A6E48',
                          border: 'none',
                          borderRadius: '8px',
                          fontFamily: 'Poppins, sans-serif',
                          fontWeight: '500',
                          padding: '10px 20px',
                          fontSize: '14px',
                          color: 'white'
                        }}
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Spinner animation="border" size="sm" style={{ marginRight: '8px' }} />
                            Adding Class...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save me-2"></i>
                            Add Class
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

      {/* Default Subjects Setup Modal */}
      <DefaultSubjectsSetup
        show={showDefaultSubjects}
        onHide={() => setShowDefaultSubjects(false)}
        onComplete={(data) => {
          // Reload subjects after creation
          fetchSubjects();
          setSuccess('Subjects created successfully! You can now select them for classes.');
        }}
      />
    </div>
  );
};

export default AddClass; 