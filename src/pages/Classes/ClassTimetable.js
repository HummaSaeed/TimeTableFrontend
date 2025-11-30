import React, { useState, useEffect } from 'react';
import {
  Row, Col, Card, Button, Badge,
  Alert, Spinner, Tabs, Tab, Table, Dropdown, Container
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { timetableAPI, classesAPI, schoolProfileAPI } from '../../services/api';
import { pdfService } from '../../services/pdfService';
import TimetableGrid from '../../components/TimetableGrid';
import WorkloadManager from '../../components/WorkloadManager';

const ClassTimetable = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classData, setClassData] = useState(null);
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [schoolProfile, setSchoolProfile] = useState(null);
  const [selectedView, setSelectedView] = useState('grid'); // grid or list
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
    '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00'
  ];


  useEffect(() => {
    fetchClassData();
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [classId]);

  const fetchClassData = async () => {
    try {
      setLoading(true);
      const [classResponse, slotsResponse, profileResponse] = await Promise.all([
        classesAPI.getById(classId),
        timetableAPI.getAll(),
        schoolProfileAPI.getProfile()
      ]);

      setClassData(classResponse.data);
      setSchoolProfile(profileResponse.data);
      const classSlots = (slotsResponse.data.results || slotsResponse.data)
        .filter(slot => slot.class_name === classResponse.data.class_name);
      setTimetableSlots(classSlots);
    } catch (error) {
      setError('Failed to fetch class timetable data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadClassTimetablePDF = async () => {
    try {
      const result = await pdfService.generateClassTimetablePDF(classData, timetableSlots, schoolProfile);
      pdfService.downloadPDF(result.data, result.filename);
    } catch (error) {
      setError('Failed to download PDF');
    }
  };

  const getSlotForTimeAndDay = (timeSlot, day) => {
    const [startTime] = timeSlot.split('-');
    return timetableSlots.find(slot =>
      slot.day === day && slot.start_time === startTime
    );
  };

  const renderTimetableGrid = () => {
    return (
      <div className="timetable-grid">
        <Table responsive className="table-bordered">
          <thead className="table-dark">
            <tr>
              <th style={{ width: '120px' }}>Time</th>
              {days.map(day => (
                <th key={day} className="text-center">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map(timeSlot => (
              <tr key={timeSlot}>
                <td className="fw-bold text-center" style={{ backgroundColor: '#f8f9fa' }}>
                  {timeSlot}
                </td>
                {days.map(day => {
                  const slot = getSlotForTimeAndDay(timeSlot, day);
                  return (
                    <td key={`${day}-${timeSlot}`} className="text-center p-2">
                      {slot ? (
                        <div className="timetable-slot p-2 rounded"
                          style={{
                            backgroundColor: slot.is_active ? '#d4edda' : '#f8d7da',
                            border: '1px solid #c3e6cb'
                          }}>
                          <div className="fw-bold small">{slot.subject_name}</div>
                          <div className="text-muted small">{slot.teacher_name}</div>
                          <div className="text-muted small">{slot.room_number}</div>
                        </div>
                      ) : (
                        <div className="text-muted small">-</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  const renderTimetableList = () => {
    return (
      <Table responsive className="table-hover">
        <thead className="table-dark">
          <tr>
            <th>Day</th>
            <th>Time</th>
            <th>Subject</th>
            <th>Teacher</th>
            <th>Room</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {timetableSlots.map(slot => (
            <tr key={slot.id}>
              <td>
                <Badge style={{
                  background: '#6C757D',
                  color: 'white',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: '500',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}>{slot.day}</Badge>
              </td>
              <td>
                <span className="fw-medium">{slot.start_time} - {slot.end_time}</span>
              </td>
              <td>
                <Badge style={{
                  background: '#E8F5E8',
                  color: '#1A6E48',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: '500',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}>{slot.subject_name}</Badge>
              </td>
              <td>{slot.teacher_name}</td>
              <td>{slot.room_number}</td>
              <td>
                <Badge bg={slot.is_active ? 'success' : 'danger'}>
                  {slot.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  };

  if (loading) {
    return (
      <div style={{
        padding: '24px',
        background: '#FFFFFF',
        fontFamily: 'Poppins, sans-serif',
        minHeight: '100vh'
      }}>
        <div style={{
          textAlign: 'center',
          paddingTop: '100px'
        }}>
          <Spinner animation="border" style={{ color: '#1A6E48', width: '3rem', height: '3rem', marginBottom: '16px' }} />
          <p style={{
            marginTop: '16px',
            color: '#6C757D',
            fontFamily: 'Poppins, sans-serif',
            fontSize: '16px',
            fontWeight: '500'
          }}>
            Loading Class Timetable...
          </p>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div style={{
        padding: '24px',
        background: '#FFFFFF',
        fontFamily: 'Poppins, sans-serif',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fas fa-exclamation-triangle" style={{ fontSize: '48px', color: '#ffc107', marginBottom: '16px' }}></i>
          <h5 style={{
            color: '#6C757D',
            marginTop: '16px',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: '600'
          }}>Class not found</h5>
          <Button
            style={{
              background: '#1A6E48',
              border: 'none',
              borderRadius: '8px',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: '500',
              padding: '10px 20px',
              fontSize: '14px',
              marginTop: '16px'
            }}
            onClick={() => navigate('/classes')}
          >
            Back to Classes
          </Button>
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
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
          <div style={{ flex: 1, minWidth: '200px' }}>
            <h1 style={{
              fontWeight: '700',
              color: '#333333',
              margin: 0,
              fontFamily: 'Poppins, sans-serif',
              fontSize: isMobile ? '20px' : '28px'
            }}>
              {isMobile ? classData.class_name : `${classData.class_name} - ${classData.section}`} Timetable
            </h1>
            {!isMobile && (
              <p style={{
                color: '#6C757D',
                margin: '4px 0 0 0',
                fontSize: '14px',
                fontWeight: '400'
              }}>
                View and manage timetable for this class
              </p>
            )}
          </div>
          <div className={`d-flex gap-2 ${isMobile ? 'flex-column w-100' : ''}`}>
            <Button
              style={{
                background: 'transparent',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: '500',
                padding: isMobile ? '8px 12px' : '10px 20px',
                fontSize: isMobile ? '12px' : '14px',
                color: '#6C757D',
                whiteSpace: 'nowrap'
              }}
              onClick={() => navigate('/classes')}
              className={isMobile ? 'flex-grow-1' : ''}
            >
              <i className="fas fa-arrow-left me-2"></i>
              <span className="back-btn-text">{isMobile ? 'Back' : 'Back to Classes'}</span>
            </Button>
            <Button
              style={{
                background: '#1A6E48',
                border: 'none',
                borderRadius: '8px',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: '500',
                padding: isMobile ? '8px 12px' : '10px 20px',
                fontSize: isMobile ? '12px' : '14px',
                whiteSpace: 'nowrap'
              }}
              onClick={downloadClassTimetablePDF}
              className={isMobile ? 'flex-grow-1' : ''}
            >
              <i className="fas fa-download me-2"></i>
              {isMobile ? 'PDF' : 'Download PDF'}
            </Button>
          </div>
        </div>
      </div>
      <Container fluid={isMobile} className={isMobile ? 'px-0' : ''}>
        {/* Class Information */}
        <Row className="mb-4 g-3">
          <Col xs={12} md={6}>
            <Card style={{
              background: '#FFFFFF',
              border: 'none',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)'
            }}>
              <Card.Body style={{ padding: isMobile ? '16px' : '24px' }}>
                <h5 style={{
                  fontWeight: '600',
                  marginBottom: '20px',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: isMobile ? '16px' : '18px',
                  color: '#333333'
                }}>
                  <i className="fas fa-info-circle me-2" style={{ color: '#1A6E48' }}></i>
                  Class Information
                </h5>
                <Row>
                  <Col xs={12} md={6}>
                    <p style={{
                      marginBottom: '12px',
                      fontFamily: 'Poppins, sans-serif',
                      fontSize: '14px',
                      color: '#333333'
                    }}>
                      <strong>Class:</strong> <span style={{ color: '#6C757D' }}>{classData.class_name}</span>
                    </p>
                    <p style={{
                      marginBottom: '12px',
                      fontFamily: 'Poppins, sans-serif',
                      fontSize: '14px',
                      color: '#333333'
                    }}>
                      <strong>Section:</strong> <span style={{ color: '#6C757D' }}>{classData.section}</span>
                    </p>
                    <p style={{
                      marginBottom: '12px',
                      fontFamily: 'Poppins, sans-serif',
                      fontSize: '14px',
                      color: '#333333'
                    }}>
                      <strong>Room:</strong> <span style={{ color: '#6C757D' }}>{classData.room_number || 'Not assigned'}</span>
                    </p>
                  </Col>
                  <Col md={6}>
                    <p style={{
                      marginBottom: '12px',
                      fontFamily: 'Poppins, sans-serif',
                      fontSize: '14px',
                      color: '#333333'
                    }}>
                      <strong>Strength:</strong> <span style={{ color: '#6C757D' }}>{classData.total_strength || 'Not set'}</span>
                    </p>
                    <p style={{
                      marginBottom: '12px',
                      fontFamily: 'Poppins, sans-serif',
                      fontSize: '14px',
                      color: '#333333'
                    }}>
                      <strong>Teacher:</strong> <span style={{ color: '#6C757D' }}>{classData.class_teacher || 'Not assigned'}</span>
                    </p>
                    <p style={{
                      marginBottom: '12px',
                      fontFamily: 'Poppins, sans-serif',
                      fontSize: '14px',
                      color: '#333333',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <strong>Status:</strong>
                      <Badge style={{
                        background: classData.is_active ? '#D8F3DC' : '#FFEBEE',
                        color: classData.is_active ? '#1A6E48' : '#C62828',
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: '500',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        marginLeft: '8px'
                      }}>
                        {classData.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </p>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card style={{
              background: '#FFFFFF',
              border: 'none',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)'
            }}>
              <Card.Body style={{ padding: '24px' }}>
                <h5 style={{
                  fontWeight: '600',
                  marginBottom: '20px',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '18px',
                  color: '#333333'
                }}>
                  <i className="fas fa-chart-bar me-2" style={{ color: '#1A6E48' }}></i>
                  Timetable Statistics
                </h5>
                <Row>
                  <Col md={6}>
                    <div style={{ textAlign: 'center' }}>
                      <h3 style={{
                        color: '#1A6E48',
                        marginBottom: '8px',
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: '700',
                        fontSize: '32px'
                      }}>
                        {timetableSlots.length}
                      </h3>
                      <small style={{
                        color: '#6C757D',
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>Total Slots</small>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div style={{ textAlign: 'center' }}>
                      <h3 style={{
                        color: '#1A6E48',
                        marginBottom: '8px',
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: '700',
                        fontSize: '32px'
                      }}>
                        {timetableSlots.filter(slot => slot.is_active).length}
                      </h3>
                      <small style={{
                        color: '#6C757D',
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>Active Slots</small>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        {/* Timetable View */}
        <Card style={{
          background: '#FFFFFF',
          border: 'none',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)'
        }}>
          <Card.Header style={{
            background: 'transparent',
            border: 'none',
            paddingBottom: '0',
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
                <i className="fas fa-calendar-alt me-2" style={{ color: '#1A6E48' }}></i>
                Timetable View
              </h5>
              <div className="d-flex gap-2">
                <Dropdown>
                  <Dropdown.Toggle
                    style={{
                      background: 'transparent',
                      border: '1px solid #1A6E48',
                      borderRadius: '8px',
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: '500',
                      padding: '6px 12px',
                      fontSize: '13px',
                      color: '#1A6E48'
                    }}
                    size="sm"
                  >
                    <i className="fas fa-eye me-2"></i>
                    {selectedView === 'grid' ? 'Grid View' : 'List View'}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => setSelectedView('grid')}>
                      <i className="fas fa-th me-2"></i>Grid View
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => setSelectedView('list')}>
                      <i className="fas fa-list me-2"></i>List View
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </div>
          </Card.Header>
          <Card.Body className="p-0" style={{ overflowX: 'auto' }}>
            {timetableSlots.length === 0 ? (
              <div className="text-center py-5">
                <i className="fas fa-calendar-times text-muted mb-3" style={{ fontSize: '3rem' }}></i>
                <h5 className="text-muted">No timetable slots found</h5>
                <p className="text-muted">This class doesn't have any timetable slots assigned yet.</p>
                <Button
                  variant="primary"
                  onClick={() => navigate('/timetable')}
                >
                  <i className="fas fa-plus me-2"></i>
                  Add Timetable Slots
                </Button>
              </div>
            ) : (
              selectedView === 'grid' ? renderTimetableGrid() : renderTimetableList()
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default ClassTimetable; 