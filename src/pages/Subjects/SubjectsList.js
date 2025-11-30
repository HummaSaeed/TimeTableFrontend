import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Table, Button, Badge, 
  Modal, Form, Alert, InputGroup, Dropdown, Spinner 
} from 'react-bootstrap';
import { subjectsAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const SubjectsList = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    is_active: true
  });
  const navigate = useNavigate();

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    onResize();
    fetchSubjects();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await subjectsAPI.getAll();
      setSubjects(response.data.results || response.data);
    } catch (error) {
      setError('Failed to fetch subjects');
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        await subjectsAPI.update(editingSubject.id, formData);
      } else {
        await subjectsAPI.create(formData);
      }
      setShowModal(false);
      setEditingSubject(null);
      resetForm();
      fetchSubjects();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save subject');
    }
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      description: subject.description || '',
      is_active: subject.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        await subjectsAPI.delete(id);
        fetchSubjects();
      } catch (error) {
        setError('Failed to delete subject');
      }
    }
  };

  const handleActivate = async (id) => {
    try {
      await subjectsAPI.activate(id);
      fetchSubjects();
    } catch (error) {
      setError('Failed to activate subject');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      is_active: true
    });
  };

  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subject.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && subject.is_active) ||
                         (filterStatus === 'inactive' && !subject.is_active);
    return matchesSearch && matchesFilter;
  });

  const StatCard = ({ title, value, icon, color }) => (
    <Card style={{
      background: '#FFFFFF',
      border: 'none',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
      height: '100%',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.08)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)';
    }}>
      <Card.Body style={{ padding: '24px' }}>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <p style={{
              color: '#6C757D',
              fontSize: '14px',
              fontWeight: '500',
              margin: '0 0 8px 0',
              fontFamily: 'Poppins, sans-serif'
            }}>
              {title}
            </p>
            <h2 style={{
              color: '#333333',
              fontSize: '32px',
              fontWeight: '700',
              margin: '0',
              fontFamily: 'Poppins, sans-serif'
            }}>
              {value}
            </h2>
          </div>
            <div style={{
            background: color === 'primary' ? 'var(--bs-primary-bg-subtle)' : 
                      color === 'success' ? '#D8F3DC' : 
                      color === 'warning' ? '#FFF3E0' : '#E8F5E8',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <i className={`fas ${icon}`} style={{
              color: color === 'primary' ? 'var(--app-primary)' : 
                     color === 'success' ? '#1A6E48' : 
                     color === 'warning' ? '#F57C00' : '#1A6E48',
              fontSize: '24px'
            }}></i>
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  if (loading) {
    return (
      <div style={{
        padding: '24px',
        background: '#FFFFFF',
        fontFamily: 'Poppins, sans-serif',
        minHeight: '100vh'
      }}>
        <div className="text-center" style={{ paddingTop: '100px' }}>
          <Spinner animation="border" style={{ color: 'var(--app-primary)', width: '3rem', height: '3rem' }} />
          <p style={{ marginTop: '16px', color: '#6C757D', fontFamily: 'Poppins, sans-serif' }}>
            Loading subjects...
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
              Subjects Management
            </h1>
            <p style={{
              color: '#6C757D',
              margin: '4px 0 0 0',
              fontSize: '14px',
              fontWeight: '400'
            }}>
              Manage your school's curriculum and academic subjects
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
              onClick={() => navigate('/subjects/add')}
              >
                <i className="fas fa-plus me-2"></i>
                Add Subject
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
              onClick={fetchSubjects}
            >
              <i className="fas fa-refresh me-2"></i>
              Refresh
            </Button>
          </div>
        </div>
      </div>
        {/* Statistics */}
        <Row className="mb-4">
          <Col lg={3} md={6} className="mb-3">
            <StatCard
              title="Total Subjects"
              value={subjects.length}
              icon="fa-book"
              color="primary"
            />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <StatCard
              title="Active Subjects"
              value={subjects.filter(s => s.is_active).length}
              icon="fa-check-circle"
              color="success"
            />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <StatCard
              title="Inactive Subjects"
              value={subjects.filter(s => !s.is_active).length}
              icon="fa-pause-circle"
              color="warning"
            />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <StatCard
              title="This Month"
              value={subjects.filter(s => {
                const created = new Date(s.created_at);
                const now = new Date();
                return created.getMonth() === now.getMonth() && 
                       created.getFullYear() === now.getFullYear();
              }).length}
              icon="fa-calendar"
              color="info"
            />
          </Col>
        </Row>

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
                    placeholder="Search subjects by name or code..."
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
              <option value="all">All Subjects</option>
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
                    {filteredSubjects.length} of {subjects.length} subjects
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

        {/* Subjects Table */}
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
                Academic Subjects ({filteredSubjects.length})
              </h5>
              <Badge style={{
                background: '#D8F3DC',
                color: '#1A6E48',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: '500',
                padding: '6px 12px',
                borderRadius: '20px'
              }}>
                {subjects.filter(s => s.is_active).length} Active
              </Badge>
            </div>
          </Card.Header>
          <Card.Body style={{ padding: '0 24px 24px 24px' }}>
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
                  }}>Subject Name</th>
                  <th style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: '600',
                    color: '#333333',
                    fontSize: '14px',
                    padding: '16px',
                    border: 'none'
                  }}>Code</th>
                  <th style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: '600',
                    color: '#333333',
                    fontSize: '14px',
                    padding: '16px',
                    border: 'none'
                  }}>Description</th>
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
                  }}>Created</th>
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
                {filteredSubjects.map((subject) => (
                  <tr key={subject.id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                    <td style={{ padding: '16px', verticalAlign: 'middle' }}>
                      <div className="d-flex align-items-center">
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          background: 'var(--bs-primary-bg-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '12px'
                        }}>
                          <i className="fas fa-book" style={{ color: 'var(--app-primary)', fontSize: '18px' }}></i>
                        </div>
                        <div>
                          <div style={{
                            fontWeight: '600',
                            color: '#333333',
                            fontSize: '14px',
                            fontFamily: 'Poppins, sans-serif',
                            marginBottom: '2px'
                          }}>
                            {subject.name}
                          </div>
                          <small style={{
                            color: '#6C757D',
                            fontSize: '12px',
                            fontFamily: 'Poppins, sans-serif'
                          }}>
                            ID: {subject.id}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px', verticalAlign: 'middle' }}>
                      <Badge style={{
                        background: '#F8F9FA',
                        color: '#333333',
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: '600',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px'
                      }}>
                        {subject.code}
                      </Badge>
                    </td>
                    <td style={{ 
                      padding: '16px', 
                      verticalAlign: 'middle',
                      color: '#6C757D',
                      fontSize: '14px',
                      fontFamily: 'Poppins, sans-serif'
                    }}>
                        {subject.description || 'No description'}
                    </td>
                    <td style={{ padding: '16px', verticalAlign: 'middle' }}>
                      <Badge style={{
                        background: subject.is_active ? '#D8F3DC' : '#FFEBEE',
                        color: subject.is_active ? '#1A6E48' : '#E53E3E',
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: '500',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px'
                      }}>
                        {subject.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td style={{ 
                      padding: '16px', 
                      verticalAlign: 'middle',
                      color: '#6C757D',
                      fontSize: '12px',
                      fontFamily: 'Poppins, sans-serif'
                    }}>
                        {new Date(subject.created_at).toLocaleDateString()}
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
                          <Dropdown.Item onClick={() => handleEdit(subject)}>
                            <i className="fas fa-edit me-2"></i>Edit
                          </Dropdown.Item>
                          {subject.is_active ? (
                            <Dropdown.Item onClick={() => handleActivate(subject.id)}>
                              <i className="fas fa-pause me-2"></i>Deactivate
                            </Dropdown.Item>
                          ) : (
                            <Dropdown.Item onClick={() => handleActivate(subject.id)}>
                              <i className="fas fa-play me-2"></i>Activate
                            </Dropdown.Item>
                          )}
                          <Dropdown.Divider />
                          <Dropdown.Item 
                            onClick={() => handleDelete(subject.id)}
                            className="text-danger"
                          >
                            <i className="fas fa-trash me-2"></i>Delete
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
                {filteredSubjects.map(subject => (
                  <Card key={subject.id} className="mb-3">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div style={{ fontWeight: 600 }}>{subject.name}</div>
                          <div className="text-muted" style={{ fontSize: 13 }}>{subject.code}</div>
                          <div className="text-muted" style={{ fontSize: 12, marginTop: 6 }}>{subject.description || 'No description'}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <Badge bg={subject.is_active ? 'success' : 'danger'}>{subject.is_active ? 'Active' : 'Inactive'}</Badge>
                          <div className="mt-2 d-flex flex-column gap-2">
                            <Button size="sm" onClick={() => handleEdit(subject)}>Edit</Button>
                            <Dropdown>
                              <Dropdown.Toggle size="sm">•••</Dropdown.Toggle>
                              <Dropdown.Menu>
                                {subject.is_active ? (
                                  <Dropdown.Item onClick={() => handleActivate(subject.id)}>Deactivate</Dropdown.Item>
                                ) : (
                                  <Dropdown.Item onClick={() => handleActivate(subject.id)}>Activate</Dropdown.Item>
                                )}
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={() => handleDelete(subject.id)} className="text-danger">Delete</Dropdown.Item>
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
            {filteredSubjects.length === 0 && (
              <div className="text-center py-5">
                <i className="fas fa-book-open text-muted mb-3" style={{ fontSize: '3rem' }}></i>
                <h5 className="text-muted">No subjects found</h5>
                <p className="text-muted">Try adjusting your search or filters</p>
              </div>
            )}
          </Card.Body>
        </Card>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingSubject ? 'Edit Subject' : 'Add New Subject'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Subject Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    placeholder="Enter subject name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Subject Code *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    required
                    placeholder="e.g., MATH, ENG"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Enter subject description"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Active Subject"
                checked={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingSubject ? 'Update Subject' : 'Add Subject'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default SubjectsList; 