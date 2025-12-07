import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Form, Button, Alert,
  Table, Badge, Spinner, Modal
} from 'react-bootstrap';
import { timetableAPI, teachersAPI, classesAPI, subjectsAPI, schoolProfileAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const TimetableImport = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [schoolProfile, setSchoolProfile] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    selectedDays: [],
    period: '',
    class_name: '',
    section: '',
    subject: '',
    teacher: '',
    room: '',
    start_time: '',
    end_time: '',
    notes: ''
  });

  // Backend accepts Monday-Friday; keep frontend aligned to avoid choice validation errors
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = Array.from({ length: 10 }, (_, i) => i + 1);

  useEffect(() => {
    const loadAllData = async () => {
      setLoadingData(true);
      try {
        await Promise.all([
          fetchSchoolProfile(),
          loadTeachers(),
          loadClasses(),
          loadSubjects()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    loadAllData();
  }, []);

  const fetchSchoolProfile = async () => {
    try {
      const response = await schoolProfileAPI.getProfile();
      if (response.data) {
        setSchoolProfile(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch school profile:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDayToggle = (day) => {
    setFormData(prev => {
      const selectedDays = prev.selectedDays.includes(day)
        ? prev.selectedDays.filter(d => d !== day)
        : [...prev.selectedDays, day];
      return { ...prev, selectedDays };
    });
  };

  const handleSelectAllDays = () => {
    setFormData(prev => {
      const allSelected = prev.selectedDays.length === days.length;
      return { ...prev, selectedDays: allSelected ? [] : [...days] };
    });
  };

  const loadTeachers = async () => {
    try {
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
      setTeachers(teachersData);
    } catch (error) {
      console.error('Failed to load teachers:', error);
      setTeachers([]);
    }
  };

  const loadClasses = async () => {
    try {
      const response = await classesAPI.getAll();
      console.log('Classes API response:', response);

      let classesData = [];
      if (response?.data) {
        if (Array.isArray(response.data)) {
          classesData = response.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          classesData = response.data.results;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          classesData = response.data.data;
        }
      }

      console.log('Processed classes data:', classesData);
      setClasses(classesData);
    } catch (error) {
      console.error('Failed to load classes:', error);
      setClasses([]);
    }
  };

  const loadSubjects = async () => {
    try {
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
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Failed to load subjects:', error);
      setSubjects([]);
    }
  };

  const addTimetableSlot = () => {
    console.log('Adding timetable slot with data:', formData);

    if (!formData.selectedDays || formData.selectedDays.length === 0) {
      setError('Please select at least one day');
      console.error('Validation failed - no days selected');
      return;
    }

    if (!formData.period || !formData.class_name ||
      !formData.section || !formData.subject || !formData.teacher) {
      setError('Please fill in all required fields');
      console.error('Validation failed - missing required fields');
      return;
    }

    // Validate that the class, subject, and teacher exist in the system
    const classObj = classes.find(cls =>
      cls.class_name === formData.class_name && cls.section === formData.section
    );

    if (!classObj) {
      setError(`Class ${formData.class_name}-${formData.section} not found in the system. Please add this class first.`);
      return;
    }

    const subjectObj = subjects.find(sub => sub.name === formData.subject);
    if (!subjectObj) {
      setError(`Subject "${formData.subject}" not found in the system. Please add this subject first.`);
      return;
    }

    const teacherObj = teachers.find(tea => tea.name === formData.teacher);
    if (!teacherObj) {
      setError(`Teacher "${formData.teacher}" not found in the system. Please add this teacher first.`);
      return;
    }

    // Create one slot for each selected day
    const newSlots = formData.selectedDays.map(day => ({
      ...formData,
      day: day,
      id: Date.now() + Math.random(), // Unique ID for each slot
      class_obj: classObj.id
    }));

    console.log('Created new slots:', newSlots);
    console.log('Validated objects:', { classObj, subjectObj, teacherObj });

    setTimetableSlots(prev => {
      const updated = [...prev, ...newSlots];
      console.log('Updated timetable slots:', updated);
      return updated;
    });

    // Reset form
    setFormData({
      selectedDays: [],
      period: '',
      class_name: '',
      section: '',
      subject: '',
      teacher: '',
      room: '',
      start_time: '',
      end_time: '',
      notes: ''
    });

    setShowAddSlot(false);
    setError(null);
    setSuccess(`${newSlots.length} slot(s) added successfully!`);

    // Auto-hide success message after 2 seconds
    setTimeout(() => setSuccess(false), 2000);
  };

  const removeSlot = (id) => {
    setTimetableSlots(prev => prev.filter(slot => slot.id !== id));
  };

  const saveTimetableSlots = async () => {
    if (timetableSlots.length === 0) {
      setError('Please add at least one timetable slot');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      console.log('Starting to save timetable slots...');
      console.log('Slots to save:', timetableSlots);

      const slots = timetableSlots.map(slot => {

        const classObj = classes.find(cls =>
          cls.class_name === slot.class_name && cls.section === slot.section
        );

        if (!classObj) {
          throw new Error(`Class ${slot.class_name}-${slot.section} not found in the system`);
        }

        // Find the subject object to get the ID
        const subjectObj = subjects.find(sub => sub.name === slot.subject);
        if (!subjectObj) {
          throw new Error(`Subject ${slot.subject} not found in the system`);
        }

        // Find the teacher object to get the ID
        const teacherObj = teachers.find(tea => tea.name === slot.teacher);
        if (!teacherObj) {
          throw new Error(`Teacher ${slot.teacher} not found in the system`);
        }

        return {
          day: slot.day,
          period_number: parseInt(slot.period), // Convert to integer
          class_obj: classObj.id, // Use class ID - Required FK
          subject: subjectObj.id, // Use subject ID - Required FK  
          teacher: teacherObj.id, // Use teacher ID - Required FK
          period_start_time: slot.start_time || '08:00', // Correct field name
          period_end_time: slot.end_time || '09:00', // Correct field name
          is_active: true,
          academic_year: '2024-2025' // Default academic year
        };
      });

      console.log('Transformed slots for API:', slots);

      // Try to create slots one by one instead of bulk create
      const createdSlots = [];
      for (const slot of slots) {
        try {
          console.log('Creating slot:', slot);
          const response = await timetableAPI.create(slot);
          console.log('Slot created successfully:', response);
          createdSlots.push(response.data);
        } catch (slotError) {
          console.error('Failed to create slot:', slot, slotError);
          console.error('Full error response:', slotError.response);
          console.error('Error response data:', slotError.response?.data);
          console.error('Error response status:', slotError.response?.status);

          // Try to get more detailed error information
          let errorMessage = slotError.message;
          if (slotError.response?.data) {
            if (typeof slotError.response.data === 'string') {
              errorMessage = slotError.response.data;
            } else if (slotError.response.data.error) {
              errorMessage = slotError.response.data.error;
            } else if (slotError.response.data.detail) {
              errorMessage = slotError.response.data.detail;
            } else if (slotError.response.data.message) {
              errorMessage = slotError.response.data.message;
            } else {
              errorMessage = JSON.stringify(slotError.response.data);
            }
          }

          throw new Error(`Failed to create slot for ${slot.class_name}-${slot.class_section} on ${slot.day} Period ${slot.period_number}: ${errorMessage}`);
        }
      }

      console.log('All slots created successfully:', createdSlots);
      setSuccess(`Successfully saved ${createdSlots.length} timetable slots!`);

      // Clear the local slots after successful save
      setTimetableSlots([]);

      setTimeout(() => {
        navigate('/timetable');
      }, 2000);

    } catch (error) {
      console.error('Error saving timetable slots:', error);
      setError(error.message || 'Failed to save timetable slots');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      selectedDays: [],
      period: '',
      class_name: '',
      section: '',
      subject: '',
      teacher: '',
      room: '',
      start_time: '',
      end_time: '',
      notes: ''
    });
    setError(null);
  };

  if (loading) {
    return (
      <Container fluid className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" size="lg" />
          <p className="mt-3">Loading import tools...</p>
        </div>
      </Container>
    );
  }

  return (
    <div className="timetable-import-page">
      {/* Header Section */}
      <div className="page-header py-4 mb-4" style={{
        background: 'linear-gradient(135deg, #2d5a27 0%, #4a7c59 100%)',
        borderRadius: '0 0 2rem 2rem'
      }}>
        <Container>
          <Row className="align-items-center">
            <Col md={8}>
              <h1 className="text-white fw-bold mb-2">Create Timetable</h1>
              <p className="text-white opacity-75 mb-0">Build your timetable by adding slots manually</p>
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
              <Button
                variant="outline-info"
                onClick={async () => {
                  try {
                    console.log('Testing API connection...');
                    const response = await timetableAPI.getAll();
                    console.log('API test successful:', response);
                    alert('API connection successful! Found ' + (response.data?.results?.length || response.data?.length || 0) + ' existing slots');
                  } catch (error) {
                    console.error('API test failed:', error);
                    alert('API connection failed: ' + error.message);
                  }
                }}
                className="me-2"
              >
                <i className="fas fa-wifi me-2"></i>
                Test API
              </Button>
              <Button
                variant="outline-warning"
                onClick={async () => {
                  try {
                    console.log('Testing single slot creation...');

                    // Find actual class, subject, and teacher IDs for testing
                    const testClass = classes.find(cls => cls.class_name === '1' && cls.section === 'A');
                    const testSubject = subjects.find(sub => sub.name === 'English');
                    const testTeacher = teachers.find(tea => tea.name === 'Humma Saeed');

                    if (!testClass || !testSubject || !testTeacher) {
                      alert('Please ensure you have at least one class (1-A), subject (English), and teacher (Humma Saeed) in the system');
                      return;
                    }

                    const testSlot = {
                      day: 'Monday',
                      period_number: 1,
                      class_obj: testClass.id, // Use FK ID
                      subject: testSubject.id, // Use FK ID
                      teacher: testTeacher.id, // Use FK ID
                      period_start_time: '08:00', // Correct field name
                      period_end_time: '09:00', // Correct field name
                      is_active: true,
                      academic_year: '2024-2025'
                    };
                    console.log('Test slot data:', testSlot);
                    const response = await timetableAPI.create(testSlot);
                    console.log('Test slot created successfully:', response);
                    alert('Test slot created successfully! Check the timetable list to see it.');
                  } catch (error) {
                    console.error('Test slot creation failed:', error);
                    alert('Test slot creation failed: ' + error.message);
                  }
                }}
                className="me-2"
              >
                <i className="fas fa-vial me-2"></i>
                Test Create
              </Button>
            </Col>
          </Row>
        </Container>
      </div>

      <Container fluid className="px-4">
        {/* Help Note */}
        <Alert variant="info" className="mb-4">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Manual Timetable Entry:</strong> Build your timetable by adding slots one by one.
          This approach gives you full control over each entry and ensures data accuracy.
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

        {/* Debug info removed for production UI */}

        {/* Data Validation Info */}
        <Alert variant="warning" className="mb-4">
          <i className="fas fa-exclamation-triangle me-2"></i>
          <strong>Data Validation:</strong>
          <div className="mt-2">
            <span className="me-3">
              <i className="fas fa-users me-1"></i>
              Classes: {classes.length} available
            </span>
            <span className="me-3">
              <i className="fas fa-book me-1"></i>
              Subjects: {subjects.length} available
            </span>
            <span className="me-3">
              <i className="fas fa-chalkboard-teacher me-1"></i>
              Teachers: {teachers.length} available
            </span>
          </div>
          {classes.length === 0 || subjects.length === 0 || teachers.length === 0 ? (
            <div className="mt-2 text-danger">
              <strong>Warning:</strong> You need classes, subjects, and teachers in the system before creating timetable slots.
            </div>
          ) : (
            <div className="mt-2 text-success">
              <strong>✓ Ready:</strong> All required data is available for creating timetable slots.
            </div>
          )}
          <div className="mt-2">
            <small className="text-muted">
              <strong>⚠️ Important:</strong> Make sure subjects are assigned to classes and teachers are assigned to subjects in the system
              before creating timetable slots. The backend validates these relationships.
            </small>
          </div>
        </Alert>

        {/* Manual Entry Section */}
        <Row>
          <Col lg={8}>
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">
                  <i className="fas fa-plus me-2"></i>
                  Add Timetable Slots
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">Timetable Slots Added: {timetableSlots.length}</h6>
                  <div>
                    <Button variant="success" onClick={() => setShowAddSlot(true)} disabled={timetableSlots.length >= 50}>
                      <i className="fas fa-plus me-2"></i>
                      Add New Slot
                    </Button>
                  </div>
                </div>

                {timetableSlots.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <i className="fas fa-calendar-alt fa-3x mb-3"></i>
                    <p>No timetable slots added yet.</p>
                    <p className="small">Click "Add New Slot" to start building your timetable.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table striped bordered size="sm">
                      <thead>
                        <tr>
                          <th>Day</th>
                          <th>Period</th>
                          <th>Class</th>
                          <th>Section</th>
                          <th>Subject</th>
                          <th>Teacher</th>
                          <th>Room</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {timetableSlots.map((slot, index) => (
                          <tr key={slot.id}>
                            <td>{slot.day}</td>
                            <td>{slot.period}</td>
                            <td>{slot.class_name}</td>
                            <td>{slot.section}</td>
                            <td>{slot.subject}</td>
                            <td>{slot.teacher}</td>
                            <td>{slot.room || '-'}</td>
                            <td>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => removeSlot(slot.id)}
                              >
                                <i className="fas fa-trash"></i>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}

                {timetableSlots.length > 0 && (
                  <div className="d-flex justify-content-end mt-3">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={saveTimetableSlots}
                      disabled={saving}
                      className="px-4"
                    >
                      {saving ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" className="me-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save me-2"></i>
                          Save All Slots ({timetableSlots.length})
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-info text-white">
                <h6 className="mb-0">
                  <i className="fas fa-info-circle me-2"></i>
                  Manual Entry Guide
                </h6>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <h6 className="fw-bold">Required Fields:</h6>
                  <div className="d-flex flex-wrap gap-1">
                    {['Day', 'Period', 'Class', 'Section', 'Subject', 'Teacher'].map(field => (
                      <Badge key={field} bg="primary" className="me-1 mb-1">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <h6 className="fw-bold">Optional Fields:</h6>
                  <div className="d-flex flex-wrap gap-1">
                    {['Room', 'Start Time', 'End Time', 'Notes'].map(field => (
                      <Badge key={field} bg="secondary" className="me-1 mb-1">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="small text-muted">
                  <i className="fas fa-lightbulb me-1"></i>
                  <strong>Tip:</strong> Add slots one by one to build your complete timetable.
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>



        {/* Add Timetable Slot Modal - Modern Google-style Design */}
        <Modal
          show={showAddSlot}
          onHide={() => setShowAddSlot(false)}
          size="lg"
          backdrop="static"
          centered
        >
          <Modal.Header
            closeButton
            style={{
              borderBottom: 'none',
              padding: '24px 24px 16px 24px'
            }}
          >
            <Modal.Title style={{
              fontSize: '24px',
              fontWeight: '400',
              color: '#202124',
              fontFamily: "'Google Sans', 'Roboto', sans-serif"
            }}>
              Add Timetable Slot
            </Modal.Title>
          </Modal.Header>

          <Modal.Body style={{ padding: '0 24px 24px 24px' }}>
            <Form>
              {/* Days Selection Section */}
              <div style={{
                marginBottom: '28px',
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '12px',
                border: '1px solid #e8eaed'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#5f6368',
                  marginBottom: '16px',
                  letterSpacing: '0.25px'
                }}>
                  SELECT DAYS
                </div>

                {/* Select All */}
                <div style={{
                  marginBottom: '16px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid #dadce0'
                }}>
                  <Form.Check
                    type="checkbox"
                    id="select-all-days"
                    label="All Working Days"
                    checked={formData.selectedDays.length === days.length}
                    onChange={handleSelectAllDays}
                    style={{
                      fontSize: '15px',
                      fontWeight: '500',
                      color: '#202124'
                    }}
                  />
                </div>

                {/* Individual Days */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '12px'
                }}>
                  {days.map(day => (
                    <Form.Check
                      key={day}
                      type="checkbox"
                      id={`day-${day}`}
                      label={day}
                      checked={formData.selectedDays.includes(day)}
                      onChange={() => handleDayToggle(day)}
                      style={{
                        fontSize: '14px',
                        color: '#3c4043'
                      }}
                    />
                  ))}
                </div>

                {formData.selectedDays.length > 0 && (
                  <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    backgroundColor: '#e8f5e9',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#1e8e3e',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <i className="fas fa-check-circle"></i>
                    <span>{formData.selectedDays.length} day(s): {formData.selectedDays.join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Form Fields Grid */}
              <Row className="g-4">
                {/* Period */}
                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#5f6368',
                      marginBottom: '8px',
                      letterSpacing: '0.25px'
                    }}>
                      PERIOD
                    </Form.Label>
                    <Form.Select
                      name="period"
                      value={formData.period}
                      onChange={handleChange}
                      required
                      style={{
                        borderRadius: '8px',
                        border: '1px solid #dadce0',
                        padding: '12px 16px',
                        fontSize: '15px',
                        color: '#202124',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                      onBlur={(e) => e.target.style.borderColor = '#dadce0'}
                    >
                      <option value="">Select period</option>
                      {periods.map(period => (
                        <option key={period} value={period}>Period {period}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                {/* Class */}
                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#5f6368',
                      marginBottom: '8px',
                      letterSpacing: '0.25px'
                    }}>
                      CLASS
                    </Form.Label>
                    <Form.Select
                      name="class_name"
                      value={formData.class_name}
                      onChange={handleChange}
                      required
                      disabled={loadingData}
                      style={{
                        borderRadius: '8px',
                        border: '1px solid #dadce0',
                        padding: '12px 16px',
                        fontSize: '15px',
                        color: '#202124',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                      onBlur={(e) => e.target.style.borderColor = '#dadce0'}
                    >
                      <option value="">Select class</option>
                      {Array.isArray(classes) && classes.length > 0 ? (
                        classes.map(cls => (
                          <option key={cls.id} value={cls.class_name}>
                            {cls.class_name}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          {loadingData ? 'Loading...' : 'No classes available'}
                        </option>
                      )}
                    </Form.Select>
                  </Form.Group>
                </Col>

                {/* Section */}
                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#5f6368',
                      marginBottom: '8px',
                      letterSpacing: '0.25px'
                    }}>
                      SECTION
                    </Form.Label>
                    <Form.Select
                      name="section"
                      value={formData.section}
                      onChange={handleChange}
                      required
                      style={{
                        borderRadius: '8px',
                        border: '1px solid #dadce0',
                        padding: '12px 16px',
                        fontSize: '15px',
                        color: '#202124',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                      onBlur={(e) => e.target.style.borderColor = '#dadce0'}
                    >
                      <option value="">Select section</option>
                      {['A', 'B', 'C', 'D', 'E', 'F'].map(section => (
                        <option key={section} value={section}>Section {section}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                {/* Subject */}
                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#5f6368',
                      marginBottom: '8px',
                      letterSpacing: '0.25px'
                    }}>
                      SUBJECT
                    </Form.Label>
                    <Form.Select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      disabled={loadingData}
                      style={{
                        borderRadius: '8px',
                        border: '1px solid #dadce0',
                        padding: '12px 16px',
                        fontSize: '15px',
                        color: '#202124',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                      onBlur={(e) => e.target.style.borderColor = '#dadce0'}
                    >
                      <option value="">Select subject</option>
                      {Array.isArray(subjects) && subjects.length > 0 ? (
                        subjects.map(subject => (
                          <option key={subject.id} value={subject.name}>
                            {subject.name}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          {loadingData ? 'Loading...' : 'No subjects available'}
                        </option>
                      )}
                    </Form.Select>
                  </Form.Group>
                </Col>

                {/* Teacher */}
                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#5f6368',
                      marginBottom: '8px',
                      letterSpacing: '0.25px'
                    }}>
                      TEACHER
                    </Form.Label>
                    <Form.Select
                      name="teacher"
                      value={formData.teacher}
                      onChange={handleChange}
                      required
                      style={{
                        borderRadius: '8px',
                        border: '1px solid #dadce0',
                        padding: '12px 16px',
                        fontSize: '15px',
                        color: '#202124',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                      onBlur={(e) => e.target.style.borderColor = '#dadce0'}
                    >
                      <option value="">Select teacher</option>
                      {Array.isArray(teachers) && teachers.length > 0 ? (
                        teachers.map(teacher => (
                          <option key={teacher.id} value={teacher.name}>
                            {teacher.name}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>Loading...</option>
                      )}
                    </Form.Select>
                  </Form.Group>
                </Col>

                {/* Room */}
                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#5f6368',
                      marginBottom: '8px',
                      letterSpacing: '0.25px'
                    }}>
                      ROOM (OPTIONAL)
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="room"
                      value={formData.room}
                      onChange={handleChange}
                      placeholder="e.g., Room 101"
                      style={{
                        borderRadius: '8px',
                        border: '1px solid #dadce0',
                        padding: '12px 16px',
                        fontSize: '15px',
                        color: '#202124',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                      onBlur={(e) => e.target.style.borderColor = '#dadce0'}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Modal.Body>

          <Modal.Footer style={{
            borderTop: 'none',
            padding: '16px 24px 24px 24px',
            gap: '12px'
          }}>
            <Button
              variant="link"
              onClick={() => setShowAddSlot(false)}
              style={{
                color: '#1a73e8',
                textDecoration: 'none',
                fontWeight: '500',
                fontSize: '14px',
                padding: '10px 24px',
                borderRadius: '8px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f3f4'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              Cancel
            </Button>
            <Button
              onClick={addTimetableSlot}
              style={{
                backgroundColor: '#1a73e8',
                border: 'none',
                fontWeight: '500',
                fontSize: '14px',
                padding: '10px 24px',
                borderRadius: '8px',
                boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#1765cc';
                e.target.style.boxShadow = '0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#1a73e8';
                e.target.style.boxShadow = '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)';
              }}
            >
              Add Slot
            </Button>
          </Modal.Footer>
        </Modal >
      </Container >
    </div >
  );
};

export default TimetableImport;
