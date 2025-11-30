import React, { useState, useEffect } from 'react';
import { 
  Row, Col, Card, Table, Button, Badge, 
  Form, Alert, InputGroup, Dropdown, Spinner 
} from 'react-bootstrap';
import { classesAPI, teachersAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const ClassesList = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    onResize();
    fetchData();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesResponse, teachersResponse] = await Promise.all([
        classesAPI.getAll(),
        teachersAPI.getAll()
      ]);
      setClasses(classesResponse.data.results || classesResponse.data);
      setTeachers(teachersResponse.data.results || teachersResponse.data);
    } catch (error) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (classItem) => {
    navigate(`/classes/edit/${classItem.id}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        await classesAPI.delete(id);
        fetchData();
      } catch (error) {
        setError('Failed to delete class');
      }
    }
  };

  const handleActivate = async (id) => {
    try {
      await classesAPI.activate(id);
      fetchData();
    } catch (error) {
      setError('Failed to activate class');
    }
  };

  const handleGenerateTimetable = async (classId) => {
    try {
      setLoading(true);
      // Navigate to individual class timetable generation
      navigate(`/classes/${classId}/timetable/generate`);
    } catch (error) {
      setError('Failed to generate timetable');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTimetable = (classId) => {
    navigate(`/classes/${classId}/timetable`);
  };

  const handleManageSubjects = (classId) => {
    navigate(`/classes/${classId}/subjects`);
  };



  const filteredClasses = classes.filter(classItem => {
    const matchesSearch = classItem.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classItem.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classItem.room_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && classItem.is_active) ||
                         (filterStatus === 'inactive' && !classItem.is_active);
    return matchesSearch && matchesFilter;
  });

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
            Loading classes...
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
              Classes Management ({classes.length})
            </h1>
            <p style={{
              color: '#6C757D',
              margin: '4px 0 0 0',
              fontSize: '14px',
              fontWeight: '400'
            }}>
              Manage and organize all school classes and sections
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
              onClick={() => navigate('/classes/add')}
            >
              <i className="fas fa-plus me-2"></i>
              Add Class
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
              onClick={fetchData}
            >
              <i className="fas fa-refresh me-2"></i>
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
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
                  placeholder="Search classes by name, section, or room..."
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
                <option value="all">All Classes</option>
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
                  {filteredClasses.length} of {classes.length} classes
                </small>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Classes Table */}
        <Card style={{
          background: '#FFFFFF',
          border: 'none',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)'
        }}>
          <Card.Body style={{ padding: '24px' }}>
            {!isMobile ? (
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
                  }}>Class Details</th>
                  <th style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: '600',
                    color: '#333333',
                    fontSize: '14px',
                    padding: '16px',
                    border: 'none'
                  }}>Room</th>
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
                  }}>Students</th>
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
                {filteredClasses.map((classItem) => (
                  <tr key={classItem.id} style={{
                    transition: 'background-color 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}>
                    <td style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
                      <div className="d-flex align-items-center">
                        <div style={{
                          background: '#D8F3DC',
                          borderRadius: '50%',
                          padding: '8px',
                          marginRight: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '40px',
                          height: '40px'
                        }}>
                          <i className="fas fa-users" style={{ color: '#1A6E48', fontSize: '16px' }}></i>
                        </div>
                        <div>
                          <h6 style={{
                            margin: 0,
                            fontFamily: 'Poppins, sans-serif',
                            fontWeight: '600',
                            color: '#333333',
                            fontSize: '15px'
                          }}>
                            Class {classItem.class_name} - {classItem.section}
                          </h6>
                          <small style={{
                            color: '#6C757D',
                            fontFamily: 'Poppins, sans-serif',
                            fontSize: '12px'
                          }}>ID: {classItem.id}</small>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
                      <Badge style={{
                        background: '#1A6E48',
                        color: 'white',
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: '500',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px'
                      }}>
                        {classItem.room_number || 'N/A'}
                      </Badge>
                    </td>
                    <td style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{
                        color: '#333333',
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        {classItem.class_teacher_name || 'Not assigned'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
                      <Badge style={{
                        background: '#1A6E48',
                        color: 'white',
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: '500',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px'
                      }}>
                        {classItem.total_strength || 0} students
                      </Badge>
                    </td>
                    <td style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
                      <Badge style={{
                        background: classItem.is_active ? '#1A6E48' : '#DC3545',
                        color: 'white',
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: '500',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        {classItem.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td style={{ padding: '16px', borderBottom: '1px solid #f0f0f0', textAlign: 'right' }}>
                      <Dropdown>
                        <Dropdown.Toggle
                          style={{
                            background: '#1A6E48',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            padding: '6px 12px'
                          }}
                          size="sm"
                        >
                          <i className="fas fa-ellipsis-v"></i>
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => handleViewTimetable(classItem.id)}>
                            <i className="fas fa-calendar-alt me-2"></i>View Timetable
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleGenerateTimetable(classItem.id)}>
                            <i className="fas fa-magic me-2 text-warning"></i>Generate Timetable
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleManageSubjects(classItem.id)}>
                            <i className="fas fa-book me-2 text-info"></i>Manage Subjects
                          </Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item onClick={() => handleEdit(classItem)}>
                            <i className="fas fa-edit me-2"></i>Edit Class
                          </Dropdown.Item>
                          {classItem.is_active ? (
                            <Dropdown.Item onClick={() => handleActivate(classItem.id)}>
                              <i className="fas fa-pause me-2"></i>Deactivate
                            </Dropdown.Item>
                          ) : (
                            <Dropdown.Item onClick={() => handleActivate(classItem.id)}>
                              <i className="fas fa-play me-2"></i>Activate
                            </Dropdown.Item>
                          )}
                          <Dropdown.Divider />
                          <Dropdown.Item 
                            onClick={() => handleDelete(classItem.id)}
                            className="text-danger"
                          >
                            <i className="fas fa-trash me-2"></i>Delete Class
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
        ) : (
          <div className="mobile-card-list">
            {filteredClasses.map((classItem) => (
              <Card key={classItem.id} className="mb-3">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div style={{ fontWeight: 600 }}>{`Class ${classItem.class_name} - ${classItem.section}`}</div>
                      <div className="text-muted" style={{ fontSize: 13 }}>Room: {classItem.room_number || 'N/A'}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>Teacher: {classItem.class_teacher_name || 'Not assigned'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Badge bg={classItem.is_active ? 'success' : 'danger'}>{classItem.is_active ? 'Active' : 'Inactive'}</Badge>
                      <div className="mt-2 d-flex flex-column gap-2">
                        <Button size="sm" variant="outline-secondary" onClick={() => handleViewTimetable(classItem.id)}>Timetable</Button>
                        <Button size="sm" style={{ background: 'var(--app-primary)', color: 'white' }} onClick={() => handleEdit(classItem)}>Edit</Button>
                        <Dropdown>
                          <Dropdown.Toggle size="sm">•••</Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item onClick={() => handleGenerateTimetable(classItem.id)}>Generate Timetable</Dropdown.Item>
                            <Dropdown.Item onClick={() => handleManageSubjects(classItem.id)}>Manage Subjects</Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item onClick={() => handleDelete(classItem.id)} className="text-danger">Delete</Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
            {filteredClasses.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#6C757D'
              }}>
                <i className="fas fa-users" style={{
                  fontSize: '48px',
                  color: '#dee2e6',
                  marginBottom: '16px'
                }}></i>
                <h5 style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: '600',
                  color: '#6C757D',
                  marginBottom: '8px'
                }}>No classes found</h5>
                <p style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '14px',
                  color: '#6C757D',
                  margin: 0
                }}>Try adjusting your search or filters</p>
              </div>
            )}
          </Card.Body>
        </Card>
    </div>
  );
};

export default ClassesList; 