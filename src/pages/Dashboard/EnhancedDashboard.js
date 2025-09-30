import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Button, Alert, Spinner, 
  Badge, ProgressBar, Tabs, Tab
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
  teachersAPI, classesAPI, subjectsAPI, timetableAPI, 
  schoolProfileAPI 
} from '../../services/api';

const EnhancedDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    teachers: { total: 0, active: 0, inactive: 0 },
    classes: { total: 0, active: 0, inactive: 0 },
    subjects: { total: 0, active: 0, inactive: 0 },
    timetable: { total: 0, conflicts: 0 }
  });
  const [schoolProfile, setSchoolProfile] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [
        teachersRes, 
        classesRes, 
        subjectsRes, 
        timetableRes, 
        profileRes
      ] = await Promise.all([
        teachersAPI.getAll(),
        classesAPI.getAll(),
        subjectsAPI.getAll(),
        timetableAPI.getAll(),
        schoolProfileAPI.getProfile()
      ]);

      const teachers = teachersRes.data.results || teachersRes.data;
      const classes = classesRes.data.results || classesRes.data;
      const subjects = subjectsRes.data.results || subjectsRes.data;
      const timetableSlots = timetableRes.data.results || timetableRes.data;

      setStats({
        teachers: {
          total: teachers.length,
          active: teachers.filter(t => t.is_active).length,
          inactive: teachers.filter(t => !t.is_active).length
        },
        classes: {
          total: classes.length,
          active: classes.filter(c => c.is_active).length,
          inactive: classes.filter(c => !c.is_active).length
        },
        subjects: {
          total: subjects.length,
          active: subjects.filter(s => s.is_active).length,
          inactive: subjects.filter(s => !s.is_active).length
        },
        timetable: {
          total: timetableSlots.length,
          conflicts: 0 // Will be calculated separately
        }
      });

      setSchoolProfile(profileRes.data);
      
      // Generate recent activity
      const activities = [];
      if (teachers.length > 0) {
        activities.push({
          type: 'teacher',
          message: `${teachers.length} teachers registered`,
          timestamp: new Date().toISOString(),
          icon: 'fas fa-user-graduate'
        });
      }
      if (classes.length > 0) {
        activities.push({
          type: 'class',
          message: `${classes.length} classes configured`,
          timestamp: new Date().toISOString(),
          icon: 'fas fa-graduation-cap'
        });
      }
      if (timetableSlots.length > 0) {
        activities.push({
          type: 'timetable',
          message: `${timetableSlots.length} timetable slots created`,
          timestamp: new Date().toISOString(),
          icon: 'fas fa-calendar-alt'
        });
      }
      setRecentActivity(activities.slice(0, 5));

    } catch (err) {
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getQuickActionCards = () => [
    {
      title: 'School Profile',
      description: 'Manage school information and settings',
      icon: 'fas fa-school',
      color: 'primary',
      action: () => navigate('/school/profile')
    },
    {
      title: 'Import Existing Timetable',
      description: 'Upload your paper timetable from Excel/CSV',
      icon: 'fas fa-upload',
      color: 'success',
      action: () => navigate('/timetable/import'),
      badge: 'New'
    },
    {
      title: 'Generate Timetable',
      description: 'Automatically generate optimal timetable',
      icon: 'fas fa-magic',
      color: 'info',
      action: () => navigate('/timetable/generate')
    },
    {
      title: 'Manage Teachers',
      description: 'Add and manage teaching staff',
      icon: 'fas fa-chalkboard-teacher',
      color: 'warning',
      action: () => navigate('/teachers')
    }
  ];

  const getStatusCards = () => [
    {
      title: 'Teachers',
      count: stats.teachers.total,
      active: stats.teachers.active,
      inactive: stats.teachers.inactive,
      icon: 'fas fa-user-graduate',
      color: 'primary',
      action: () => navigate('/teachers')
    },
    {
      title: 'Classes',
      count: stats.classes.total,
      active: stats.classes.active,
      inactive: stats.classes.inactive,
      icon: 'fas fa-graduation-cap',
      color: 'success',
      action: () => navigate('/classes')
    },
    {
      title: 'Subjects',
      count: stats.subjects.total,
      active: stats.subjects.active,
      inactive: stats.subjects.inactive,
      icon: 'fas fa-book',
      color: 'warning',
      action: () => navigate('/subjects')
    },
    {
      title: 'Timetable Slots',
      count: stats.timetable.total,
      conflicts: stats.timetable.conflicts,
      icon: 'fas fa-calendar-alt',
      color: 'info',
      action: () => navigate('/timetable')
    }
  ];

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
        <p className="mt-3">Loading dashboard...</p>
      </Container>
    );
  }

  return (
    <div style={{ 
      padding: '24px', 
      background: '#FFFFFF',
      fontFamily: 'Poppins, sans-serif',
      minHeight: '100vh'
    }}>
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

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
              Dashboard
            </h1>
            <p style={{ 
              color: '#6C757D', 
              margin: '4px 0 0 0',
              fontSize: '14px',
              fontWeight: '400'
            }}>
              Welcome to {schoolProfile?.school_name || 'Your School'} - Manage your timetables efficiently
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
              onClick={() => navigate('/timetable/import')}
            >
              <i className="fas fa-upload me-2"></i>
              Import Data
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
              onClick={fetchDashboardData}
            >
              <i className="fas fa-refresh me-2"></i>
              Refresh
                      </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col lg={3} md={6} className="mb-3">
          <Card style={{
            background: '#FFFFFF',
            border: 'none',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
            padding: '8px',
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
          }}
          onClick={() => navigate('/teachers')}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p style={{ 
                    color: '#6C757D', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    margin: '0 0 8px 0',
                    fontFamily: 'Poppins, sans-serif'
                  }}>
                    Total Teachers
                  </p>
                  <h2 style={{ 
                    color: '#333333', 
                    fontSize: '32px', 
                    fontWeight: '700',
                    margin: '0 0 4px 0',
                    fontFamily: 'Poppins, sans-serif'
                  }}>
                    {stats.teachers.total}
                  </h2>
                  <p style={{ 
                    color: '#1A6E48', 
                    fontSize: '12px', 
                    fontWeight: '500',
                    margin: 0,
                    fontFamily: 'Poppins, sans-serif'
                  }}>
                    {stats.teachers.active} active
                  </p>
                </div>
                <div style={{
                  background: '#D8F3DC',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fas fa-chalkboard-teacher" style={{ 
                    color: '#1A6E48', 
                    fontSize: '24px' 
                  }}></i>
                </div>
              </div>
                    </Card.Body>
                  </Card>
                </Col>

        <Col lg={3} md={6} className="mb-3">
          <Card style={{
            background: '#FFFFFF',
            border: 'none',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
            padding: '8px',
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
          }}
          onClick={() => navigate('/classes')}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p style={{ 
                    color: '#6C757D', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    margin: '0 0 8px 0',
                    fontFamily: 'Poppins, sans-serif'
                  }}>
                    Total Classes
                  </p>
                  <h2 style={{ 
                    color: '#333333', 
                    fontSize: '32px', 
                    fontWeight: '700',
                    margin: '0 0 4px 0',
                    fontFamily: 'Poppins, sans-serif'
                  }}>
                    {stats.classes.total}
                  </h2>
                  <p style={{ 
                    color: '#1A6E48', 
                    fontSize: '12px', 
                    fontWeight: '500',
                    margin: 0,
                    fontFamily: 'Poppins, sans-serif'
                  }}>
                    {stats.classes.active} active
                  </p>
                        </div>
                <div style={{
                  background: '#D8F3DC',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fas fa-users" style={{ 
                    color: '#1A6E48', 
                    fontSize: '24px' 
                  }}></i>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

        <Col lg={3} md={6} className="mb-3">
          <Card style={{
            background: '#FFFFFF',
            border: 'none',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
            padding: '8px',
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
          }}
          onClick={() => navigate('/subjects')}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                            <div>
                  <p style={{ 
                    color: '#6C757D', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    margin: '0 0 8px 0',
                    fontFamily: 'Poppins, sans-serif'
                  }}>
                    Total Subjects
                  </p>
                  <h2 style={{ 
                    color: '#333333', 
                    fontSize: '32px', 
                    fontWeight: '700',
                    margin: '0 0 4px 0',
                    fontFamily: 'Poppins, sans-serif'
                  }}>
                    {stats.subjects.total}
                  </h2>
                  <p style={{ 
                    color: '#1A6E48', 
                    fontSize: '12px', 
                    fontWeight: '500',
                    margin: 0,
                    fontFamily: 'Poppins, sans-serif'
                  }}>
                    {stats.subjects.active} active
                  </p>
                                  </div>
                <div style={{
                  background: '#D8F3DC',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fas fa-book" style={{ 
                    color: '#1A6E48', 
                    fontSize: '24px' 
                  }}></i>
                                  </div>
                                </div>
                            </Card.Body>
                          </Card>
                        </Col>

        <Col lg={3} md={6} className="mb-3">
          <Card style={{
            background: '#FFFFFF',
            border: 'none',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
            padding: '8px',
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
          }}
          onClick={() => navigate('/timetable')}>
                            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p style={{ 
                    color: '#6C757D', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    margin: '0 0 8px 0',
                    fontFamily: 'Poppins, sans-serif'
                  }}>
                    Timetable Slots
                  </p>
                  <h2 style={{ 
                    color: '#333333', 
                    fontSize: '32px', 
                    fontWeight: '700',
                    margin: '0 0 4px 0',
                    fontFamily: 'Poppins, sans-serif'
                  }}>
                    {stats.timetable.total}
                  </h2>
                  <p style={{ 
                    color: stats.timetable.conflicts > 0 ? '#E63946' : '#1A6E48', 
                    fontSize: '12px', 
                    fontWeight: '500',
                    margin: 0,
                    fontFamily: 'Poppins, sans-serif'
                  }}>
                    {stats.timetable.conflicts > 0 ? `${stats.timetable.conflicts} conflicts` : 'No conflicts'}
                  </p>
                </div>
                <div style={{
                  background: '#D8F3DC',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fas fa-calendar-alt" style={{ 
                    color: '#1A6E48', 
                    fontSize: '24px' 
                  }}></i>
                </div>
              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>

      {/* Widget Cards */}
      <Row className="mb-4">
        {/* Quick Actions Widget */}
        <Col lg={6} className="mb-3">
          <Card style={{
            background: '#FFFFFF',
            border: 'none',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
            height: '300px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 25px rgba(0,0,0,0.1), 0 3px 8px rgba(0,0,0,0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)';
          }}>
            <Card.Body className="p-3">
              <h5 style={{
                color: '#333333',
                fontWeight: '600',
                fontSize: '18px',
                fontFamily: 'Poppins, sans-serif',
                margin: '0 0 20px 0'
              }}>
                Quick Actions
              </h5>
                      <Row>
                <Col sm={6} className="mb-3">
                  <div 
                    onClick={() => navigate('/timetable/generate')}
                    style={{
                      background: '#D8F3DC',
                      borderRadius: '12px',
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(26,110,72,0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-3px)';
                      e.target.style.boxShadow = '0 4px 15px rgba(26,110,72,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 2px 8px rgba(26,110,72,0.1)';
                    }}
                  >
                    <i className="fas fa-magic" style={{ color: '#1A6E48', fontSize: '20px', marginBottom: '8px' }}></i>
                    <h6 style={{ color: '#333333', fontWeight: '600', margin: '8px 0 4px 0', fontFamily: 'Poppins, sans-serif' }}>
                      Generate Timetable
                    </h6>
                    <p style={{ color: '#6C757D', fontSize: '12px', margin: 0, fontFamily: 'Poppins, sans-serif' }}>
                      Auto-create schedules
                    </p>
                              </div>
                </Col>
                <Col sm={6} className="mb-3">
                  <div 
                    onClick={() => navigate('/teachers')}
                    style={{
                      background: '#D8F3DC',
                      borderRadius: '12px',
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(26,110,72,0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-3px)';
                      e.target.style.boxShadow = '0 4px 15px rgba(26,110,72,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 2px 8px rgba(26,110,72,0.1)';
                    }}
                  >
                    <i className="fas fa-chalkboard-teacher" style={{ color: '#1A6E48', fontSize: '20px', marginBottom: '8px' }}></i>
                    <h6 style={{ color: '#333333', fontWeight: '600', margin: '8px 0 4px 0', fontFamily: 'Poppins, sans-serif' }}>
                                Manage Teachers
                    </h6>
                    <p style={{ color: '#6C757D', fontSize: '12px', margin: 0, fontFamily: 'Poppins, sans-serif' }}>
                      Add and manage teaching staff
                    </p>
                  </div>
                        </Col>
                <Col sm={6} className="mb-3">
                  <div 
                    onClick={() => navigate('/timetable/import')}
                    style={{
                      background: '#D8F3DC',
                      borderRadius: '12px',
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(26,110,72,0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-3px)';
                      e.target.style.boxShadow = '0 4px 15px rgba(26,110,72,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 2px 8px rgba(26,110,72,0.1)';
                    }}
                  >
                    <i className="fas fa-upload" style={{ color: '#1A6E48', fontSize: '20px', marginBottom: '8px' }}></i>
                    <h6 style={{ color: '#333333', fontWeight: '600', margin: '8px 0 4px 0', fontFamily: 'Poppins, sans-serif' }}>
                      Import Timetable
                    </h6>
                    <p style={{ color: '#6C757D', fontSize: '12px', margin: 0, fontFamily: 'Poppins, sans-serif' }}>
                      Upload existing schedules
                    </p>
                              </div>
                </Col>
                <Col sm={6} className="mb-3">
                  <div 
                    onClick={() => navigate('/settings')}
                    style={{
                      background: '#D8F3DC',
                      borderRadius: '12px',
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(26,110,72,0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-3px)';
                      e.target.style.boxShadow = '0 4px 15px rgba(26,110,72,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 2px 8px rgba(26,110,72,0.1)';
                    }}
                  >
                    <i className="fas fa-cog" style={{ color: '#1A6E48', fontSize: '20px', marginBottom: '8px' }}></i>
                    <h6 style={{ color: '#333333', fontWeight: '600', margin: '8px 0 4px 0', fontFamily: 'Poppins, sans-serif' }}>
                      Settings
                    </h6>
                    <p style={{ color: '#6C757D', fontSize: '12px', margin: 0, fontFamily: 'Poppins, sans-serif' }}>
                      System configuration
                    </p>
                  </div>
                </Col>
              </Row>
                            </Card.Body>
                          </Card>
                        </Col>

        {/* Recent Activity Widget */}
        <Col lg={6} className="mb-3">
          <Card style={{
            background: '#FFFFFF',
            border: 'none',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
            height: '300px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 25px rgba(0,0,0,0.1), 0 3px 8px rgba(0,0,0,0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)';
          }}>
            <Card.Body className="p-3">
                              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 style={{
                  color: '#333333',
                  fontWeight: '600',
                  fontSize: '18px',
                  fontFamily: 'Poppins, sans-serif',
                  margin: 0
                }}>
                  Recent Activity
                </h5>
                <span style={{
                  background: '#FFD166',
                  color: '#333333',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '500',
                  fontFamily: 'Poppins, sans-serif'
                }}>
                  {recentActivity.length} updates
                </span>
              </div>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="d-flex align-items-center mb-3 p-2">
                      <div style={{
                        background: '#D8F3DC',
                        borderRadius: '8px',
                        padding: '8px',
                        marginRight: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '32px',
                        height: '32px'
                      }}>
                        <i className={activity.icon} style={{ color: '#1A6E48', fontSize: '14px' }}></i>
                      </div>
                      <div className="flex-grow-1">
                        <p style={{ 
                          color: '#333333', 
                          fontSize: '14px', 
                          fontWeight: '500',
                          margin: '0 0 2px 0',
                          fontFamily: 'Poppins, sans-serif'
                        }}>
                          {activity.message}
                        </p>
                        <small style={{ 
                          color: '#6C757D', 
                          fontSize: '12px',
                          fontFamily: 'Poppins, sans-serif'
                        }}>
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </small>
                              </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <i className="fas fa-clock" style={{ color: '#6C757D', fontSize: '24px', marginBottom: '8px' }}></i>
                    <p style={{ color: '#6C757D', fontSize: '14px', margin: 0, fontFamily: 'Poppins, sans-serif' }}>
                      No recent activity
                    </p>
                  </div>
                )}
              </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

    </div>
  );
};

export default EnhancedDashboard;
