import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Table, Button, Form, 
  Modal, Badge, InputGroup, Dropdown, Alert, Spinner 
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { teachersAPI } from '../../services/api';

const TeachersList = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [error, setError] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveData, setLeaveData] = useState({
    teacher_id: '',
    start_date: '',
    end_date: '',
    reason: ''
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await teachersAPI.getAll();
      setTeachers(response.data.results || response.data);
    } catch (error) {
      setError('Failed to fetch teachers');
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        await teachersAPI.delete(id);
        fetchTeachers();
      } catch (error) {
        setError('Failed to delete teacher');
      }
    }
  };

  const handleActivate = async (id) => {
    try {
      await teachersAPI.activate(id);
      fetchTeachers();
    } catch (error) {
      setError('Failed to activate teacher');
    }
  };

  const handleGenerateTimetable = async (teacherId) => {
    try {
      setLoading(true);
      // Navigate to individual teacher timetable generation
      navigate(`/teachers/${teacherId}/timetable/generate`);
    } catch (error) {
      setError('Failed to generate timetable');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTimetable = (teacherId) => {
    navigate(`/teachers/${teacherId}/timetable`);
  };

  const handleViewWorkload = (teacherId) => {
    navigate(`/teachers/${teacherId}/workload`);
  };

  const handleManageAssignments = (teacherId) => {
    navigate(`/teachers/${teacherId}/assignments`);
  };

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (teacher.subject_specialists && teacher.subject_specialists.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())));
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && teacher.is_active) ||
                         (filterStatus === 'inactive' && !teacher.is_active);
    
    return matchesSearch && matchesFilter;
  });

  const TeacherModal = ({ teacher, show, onHide }) => (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Teacher Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {teacher && (
          <Row>
            <Col md={6}>
              <h6>Personal Information</h6>
              <p><strong>Name:</strong> {teacher.name}</p>
              <p><strong>Email:</strong> {teacher.email}</p>
              <p><strong>Phone:</strong> {teacher.phone_number || 'N/A'}</p>
              <p><strong>Gender:</strong> {teacher.gender_display || 'N/A'}</p>
            </Col>
            <Col md={6}>
              <h6>Professional Information</h6>
                                      <p><strong>Subject Specialists:</strong> {teacher.subject_specialists ? teacher.subject_specialists.join(', ') : 'Not specified'}</p>
                        {teacher.primary_subject && <p><strong>Primary Subject:</strong> {teacher.primary_subject}</p>}
                        {teacher.previous_subjects && teacher.previous_subjects.length > 0 && (
                          <p><strong>Previous Subjects:</strong> {teacher.previous_subjects.map(s => 
                            typeof s === 'string' ? s : `${s.subject} (${s.years} years at ${s.school})`
                          ).join('; ')}</p>
                        )}
              <p><strong>Designation:</strong> {teacher.designation}</p>
              <p><strong>Qualification:</strong> {teacher.qualification}</p>
              <p><strong>Experience:</strong> {teacher.experience_years || 0} years</p>
            </Col>
            <Col md={12}>
              <h6>Class Teacher Assignment</h6>
              {teacher.is_class_teacher ? (
                <p>Class Teacher of {teacher.class_teacher_class}-{teacher.class_teacher_section}</p>
              ) : (
                <p>Not assigned as class teacher</p>
              )}
            </Col>
          </Row>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );

  const openLeaveModal = (teacher) => {
    setSelectedTeacher(teacher);
    setLeaveData({
      teacher_id: teacher.id,
      start_date: new Date().toISOString().slice(0, 10),
      end_date: new Date().toISOString().slice(0, 10),
      reason: ''
    });
    setShowLeaveModal(true);
  };

  const submitLeave = async () => {
    try {
      setLoading(true);
      console.log('Submitting leave data:', leaveData);
      
      // Convert date format for backend
      const payload = {
        teacher_id: parseInt(leaveData.teacher_id),
        date: leaveData.start_date, // Backend expects single date
        reason: leaveData.reason || 'Leave'
      };
      
      console.log('Sending payload:', payload);
      const response = await teachersAPI.markAbsent(payload);
      console.log('Leave response:', response);
      
      setShowLeaveModal(false);
      setError(null);
      
      // Show success message
      alert(`Leave marked successfully! ${response.data.substitutions.length} substitutions made.`);
      
      // Refresh teachers list
      fetchTeachers();
      
    } catch (e) {
      console.error('Leave submission error:', e);
      setError(e.response?.data?.error || 'Failed to mark leave');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        padding: '24px',
        background: '#FFFFFF',
        fontFamily: 'Poppins, sans-serif',
        minHeight: '100vh'
      }}>
        <div className="text-center" style={{ paddingTop: '100px' }}>
          <Spinner animation="border" style={{ color: '#1A6E48', width: '3rem', height: '3rem' }} />
          <p style={{ marginTop: '16px', color: '#6C757D', fontFamily: 'Poppins, sans-serif' }}>
            Loading teachers...
          </p>
        </div>
      </div>
    );
  }

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
              Teachers Management
            </h1>
            <p style={{
              color: '#6C757D',
              margin: '4px 0 0 0',
              fontSize: '14px',
              fontWeight: '400'
            }}>
              Manage and oversee all teaching staff in your school
            </p>
          </div>
          <div className="d-flex gap-2 mt-2 mt-md-0">
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
              onClick={() => navigate('/teachers/add')}
            >
            <i className="fas fa-plus me-2"></i>
            Add Teacher
          </Button>
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
              onClick={fetchTeachers}
            >
              <i className="fas fa-refresh me-2"></i>
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      {/* Filters and Search */}
      <Card style={{
        background: '#FFFFFF',
        border: 'none',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
        marginBottom: '24px'
      }}>
        <Card.Body style={{ padding: '24px' }}>
          <Row>
            <Col md={6}>
              <InputGroup style={{ borderRadius: '8px' }}>
                <InputGroup.Text style={{
                  background: '#F8F9FA',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px 0 0 8px'
                }}>
                  <i className="fas fa-search" style={{ color: '#6C757D' }}></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search teachers by name, email, or subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    border: '1px solid #dee2e6',
                    borderRadius: '0 8px 8px 0',
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '14px'
                  }}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  borderRadius: '8px',
                  border: '1px solid #dee2e6',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '14px'
                }}
              >
                <option value="all">All Teachers</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <small style={{
                  color: '#6C757D',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '12px'
                }}>
                  {filteredTeachers.length} of {teachers.length} teachers
                </small>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Teachers Table */}
      <Card style={{
        background: '#FFFFFF',
        border: 'none',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)'
      }}>
        <Card.Header style={{
          background: 'transparent',
          border: 'none',
          padding: '24px 24px 0 24px'
        }}>
          <div className="d-flex justify-content-between align-items-center">
            <h5 style={{
              margin: 0,
              fontFamily: 'Poppins, sans-serif',
              fontWeight: '600',
              color: '#333333',
              fontSize: '18px'
            }}>
              Teaching Staff ({filteredTeachers.length})
            </h5>
            <Badge style={{
              background: '#D8F3DC',
              color: '#1A6E48',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: '500',
              padding: '6px 12px',
              borderRadius: '20px'
            }}>
              {teachers.filter(t => t.is_active).length} Active
            </Badge>
          </div>
        </Card.Header>
        <Card.Body style={{ padding: '0 24px 24px 24px' }}>
          <Table responsive hover className="mb-0" style={{ fontFamily: 'Poppins, sans-serif' }}>
            <thead style={{ background: '#F8F9FA' }}>
              <tr>
                <th style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: '600',
                  color: '#333333',
                  fontSize: '14px',
                  padding: '16px',
                  border: 'none'
                }}>Name</th>
                <th style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: '600',
                  color: '#333333',
                  fontSize: '14px',
                  padding: '16px',
                  border: 'none'
                }}>Email</th>
                <th style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: '600',
                  color: '#333333',
                  fontSize: '14px',
                  padding: '16px',
                  border: 'none'
                }}>Subject Specialist</th>
                <th style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: '600',
                  color: '#333333',
                  fontSize: '14px',
                  padding: '16px',
                  border: 'none'
                }}>Designation</th>
                <th style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: '600',
                  color: '#333333',
                  fontSize: '14px',
                  padding: '16px',
                  border: 'none'
                }}>Class Teacher</th>
                <th style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: '600',
                  color: '#333333',
                  fontSize: '14px',
                  padding: '16px',
                  border: 'none'
                }}>Status</th>
                <th style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: '600',
                  color: '#333333',
                  fontSize: '14px',
                  padding: '16px',
                  border: 'none'
                }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map((teacher) => (
                <tr key={teacher.id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                  <td style={{ padding: '16px', verticalAlign: 'middle' }}>
                    <div className="d-flex align-items-center">
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: '#D8F3DC',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '12px'
                      }}>
                        <i className="fas fa-chalkboard-teacher" style={{ color: '#1A6E48', fontSize: '18px' }}></i>
                      </div>
                      <div>
                        <div style={{
                          fontWeight: '600',
                          color: '#333333',
                          fontSize: '14px',
                          fontFamily: 'Poppins, sans-serif',
                          marginBottom: '2px'
                        }}>
                          {teacher.name}
                        </div>
                        <small style={{
                          color: '#6C757D',
                          fontSize: '12px',
                          fontFamily: 'Poppins, sans-serif'
                        }}>
                          {teacher.phone_number || 'No phone'}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td style={{ 
                    padding: '16px', 
                    verticalAlign: 'middle',
                    color: '#333333',
                    fontSize: '14px',
                    fontFamily: 'Poppins, sans-serif'
                  }}>
                    {teacher.email}
                  </td>
                  <td style={{ padding: '16px', verticalAlign: 'middle' }}>
                    <span style={{
                      color: '#333333',
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: '500',
                      fontSize: '14px',
                      background: '#F8F9FA',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid #E9ECEF'
                    }}>
                      {teacher.subject_specialists ? teacher.subject_specialists.join(', ') : 'Not specified'}
                    </span>
                  </td>
                  <td style={{ 
                    padding: '16px', 
                    verticalAlign: 'middle',
                    color: '#333333',
                    fontSize: '14px',
                    fontFamily: 'Poppins, sans-serif'
                  }}>
                    {teacher.designation}
                  </td>
                  <td style={{ padding: '16px', verticalAlign: 'middle' }}>
                    {teacher.is_class_teacher ? (
                      <span style={{
                        color: '#333333',
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: '500',
                        fontSize: '14px',
                        background: '#E8F5E8',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1px solid #C8E6C9'
                      }}>
                        {teacher.class_teacher_class}-{teacher.class_teacher_section}
                      </span>
                    ) : (
                      <span style={{
                        color: '#6C757D',
                        fontSize: '14px',
                        fontFamily: 'Poppins, sans-serif',
                        background: '#F8F9FA',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1px solid #E9ECEF'
                      }}>
                        Not assigned
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px', verticalAlign: 'middle' }}>
                    <Badge style={{
                      background: teacher.is_active ? '#D8F3DC' : '#FFEBEE',
                      color: teacher.is_active ? '#1A6E48' : '#E53E3E',
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: '500',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px'
                    }}>
                      {teacher.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td style={{ padding: '16px', verticalAlign: 'middle' }}>
                    <Dropdown>
                      <Dropdown.Toggle
                        style={{
                          background: '#1A6E48',
                          border: 'none',
                          borderRadius: '8px',
                          color: 'white',
                          padding: '8px 12px',
                          fontFamily: 'Poppins, sans-serif',
                          fontWeight: '500',
                          fontSize: '12px'
                        }}
                        size="sm"
                      >
                        <i className="fas fa-ellipsis-h"></i>
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => handleViewTimetable(teacher.id)}>
                          <i className="fas fa-calendar-alt me-2 text-primary"></i>
                          View Timetable
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleGenerateTimetable(teacher.id)}>
                          <i className="fas fa-magic me-2 text-warning"></i>
                          Generate Timetable
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleViewWorkload(teacher.id)}>
                          <i className="fas fa-chart-bar me-2 text-info"></i>
                          View Workload
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleManageAssignments(teacher.id)}>
                          <i className="fas fa-link me-2 text-success"></i>
                          Manage Assignments
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item onClick={() => {
                          setSelectedTeacher(teacher);
                          setShowModal(true);
                        }}>
                          <i className="fas fa-eye me-2"></i>
                          View Details
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => openLeaveModal(teacher)}>
                          <i className="fas fa-user-clock me-2 text-warning"></i>
                          Mark Leave
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => navigate(`/teachers/edit/${teacher.id}`)}>
                          <i className="fas fa-edit me-2"></i>
                          Edit Teacher
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        {teacher.is_active ? (
                          <Dropdown.Item onClick={() => handleDelete(teacher.id)} className="text-danger">
                            <i className="fas fa-pause me-2"></i>
                            Deactivate
                          </Dropdown.Item>
                        ) : (
                          <Dropdown.Item onClick={() => handleActivate(teacher.id)} className="text-success">
                            <i className="fas fa-play me-2"></i>
                            Activate
                          </Dropdown.Item>
                        )}
                      </Dropdown.Menu>
                    </Dropdown>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Leave Modal */}
      <Modal show={showLeaveModal} onHide={() => setShowLeaveModal(false)} size="lg">
        <Modal.Header 
          closeButton 
          style={{
            background: '#1A6E48',
            color: 'white',
            border: 'none'
          }}
        >
          <Modal.Title style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: '600',
            fontSize: '18px'
          }}>
            <i className="fas fa-user-times me-2"></i>
            Mark Teacher Leave
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '24px' }}>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          
          <Form>
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
                    Teacher Name
                  </Form.Label>
                  <Form.Control 
                    type="text" 
                    value={selectedTeacher?.name || ''} 
                    readOnly 
                    style={{
                      borderRadius: '8px',
                      border: '1px solid #dee2e6',
                      fontFamily: 'Poppins, sans-serif',
                      fontSize: '14px',
                      padding: '10px 12px',
                      background: '#f8f9fa'
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
                  }}>
                    Leave Date *
                  </Form.Label>
                  <Form.Control 
                    type="date" 
                    value={leaveData.start_date} 
                    onChange={(e) => setLeaveData({ ...leaveData, start_date: e.target.value })}
                    required
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
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: '500',
                color: '#333333',
                fontSize: '14px',
                marginBottom: '8px'
              }}>
                Reason for Leave
              </Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                value={leaveData.reason} 
                onChange={(e) => setLeaveData({ ...leaveData, reason: e.target.value })} 
                placeholder="Enter reason for leave (optional)"
                style={{
                  borderRadius: '8px',
                  border: '1px solid #dee2e6',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '14px',
                  padding: '10px 12px'
                }}
              />
            </Form.Group>
            
            <Alert variant="info" style={{
              borderRadius: '8px',
              fontFamily: 'Poppins, sans-serif',
              fontSize: '14px',
              background: '#E3F2FD',
              border: '1px solid #B3E5FC',
              color: '#1976D2'
            }}>
              <i className="fas fa-info-circle me-2"></i>
              <strong>Automatic Substitution:</strong> The system will automatically find substitute teachers for all periods on the selected date.
            </Alert>
          </Form>
        </Modal.Body>
        <Modal.Footer style={{
          background: '#f8f9fa',
          border: 'none',
          padding: '16px 24px'
        }}>
          <Button 
            variant="outline-secondary" 
            onClick={() => setShowLeaveModal(false)}
            style={{
              borderRadius: '8px',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: '500',
              padding: '8px 16px',
              fontSize: '14px'
            }}
          >
            Cancel
          </Button>
          <Button 
            style={{
              background: '#1A6E48',
              border: 'none',
              borderRadius: '8px',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: '500',
              padding: '8px 16px',
              fontSize: '14px'
            }}
            onClick={submitLeave}
            disabled={loading || !leaveData.start_date}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Processing...
              </>
            ) : (
              <>
                <i className="fas fa-user-times me-2"></i>
                Mark Leave & Assign Substitution
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Teacher Details Modal */}
      <TeacherModal
        teacher={selectedTeacher}
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setSelectedTeacher(null);
        }}
      />
    </div>
  );
};

export default TeachersList; 