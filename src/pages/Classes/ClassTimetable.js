import React, { useState, useEffect } from 'react';
import {
  Row, Col, Card, Button, Badge,
  Alert, Spinner, Tabs, Tab, Table, Dropdown, Container, Modal, Form
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
  const [success, setSuccess] = useState(null);
  const [classData, setClassData] = useState(null);
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [schoolProfile, setSchoolProfile] = useState(null);
  const [selectedView, setSelectedView] = useState('grid'); // grid or list
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);

  // Edit/Delete state
  const [editingSlot, setEditingSlot] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingSlotId, setDeletingSlotId] = useState(null);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8]; // Period numbers


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

      // Load class timetable using specific endpoint
      console.log('Fetching timetable for class ID:', classId);
      const timetableResponse = await timetableAPI.getByClass(classId);
      console.log('Timetable API Response:', timetableResponse);

      const classSlots = timetableResponse.data.results || timetableResponse.data || [];
      console.log('Loaded class slots:', classSlots);

      setTimetableSlots(classSlots);
    } catch (err) {
      console.error('Error fetching class data:', err);
      setError('Failed to load class data');
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

  const handleEditSlot = (slot) => {
    setEditingSlot(slot);
    setShowEditModal(true);
  };

  const handleUpdateSlot = async (updatedSlot) => {
    try {
      await timetableAPI.update(updatedSlot.id, updatedSlot);
      setSuccess('Slot updated successfully!');
      setShowEditModal(false);
      setEditingSlot(null);
      fetchClassData(); // Refresh data
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Failed to update slot');
      console.error('Error updating slot:', error);
    }
  };

  const handleDeleteSlot = (slotId) => {
    setDeletingSlotId(slotId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      await timetableAPI.delete(deletingSlotId);
      setSuccess('Slot deleted successfully!');
      setShowDeleteDialog(false);
      setDeletingSlotId(null);
      fetchClassData(); // Refresh data
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Failed to delete slot');
      console.error('Error deleting slot:', error);
    }
  };

  const getSlotForPeriodAndDay = (period, day) => {
    return timetableSlots.find(slot =>
      slot.day === day && slot.period_number === period
    );
  };

  const renderTimetableGrid = () => {
    return (
      <div className="timetable-grid">
        <Table responsive className="table-bordered">
          <thead className="table-dark">
            <tr>
              <th style={{ width: '100px' }}>Period</th>
              {days.map(day => (
                <th key={day} className="text-center">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map(period => (
              <tr key={period}>
                <td className="fw-bold text-center" style={{ backgroundColor: '#f8f9fa' }}>
                  Period {period}
                </td>
                {days.map(day => {
                  const slot = getSlotForPeriodAndDay(period, day);
                  return (
                    <td key={`${day}-${period}`} className="text-center p-2">
                      {slot ? (
                        <div
                          className="timetable-slot p-2 rounded position-relative"
                          style={{
                            backgroundColor: slot.is_active ? '#d4edda' : '#f8d7da',
                            border: '1px solid #c3e6cb',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                            e.currentTarget.querySelector('.slot-actions').style.opacity = '1';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.querySelector('.slot-actions').style.opacity = '0';
                          }}
                        >
                          <div className="fw-bold small">{slot.subject}</div>
                          <div className="text-muted small">{slot.teacher}</div>
                          {slot.room && <div className="text-muted small">Room: {slot.room}</div>}

                          {/* Action Buttons */}
                          <div
                            className="slot-actions"
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              display: 'flex',
                              gap: '4px',
                              opacity: '0',
                              transition: 'opacity 0.2s'
                            }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditSlot(slot);
                              }}
                              style={{
                                background: '#1a73e8',
                                border: 'none',
                                borderRadius: '4px',
                                color: 'white',
                                padding: '4px 8px',
                                fontSize: '11px',
                                cursor: 'pointer'
                              }}
                              title="Edit slot"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSlot(slot.id);
                              }}
                              style={{
                                background: '#dc3545',
                                border: 'none',
                                borderRadius: '4px',
                                color: 'white',
                                padding: '4px 8px',
                                fontSize: '11px',
                                cursor: 'pointer'
                              }}
                              title="Delete slot"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
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

        {/* Success Alert */}
        {success && (
          <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
            <i className="fas fa-check-circle me-2"></i>
            {success}
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

        {/* Edit Slot Modal */}
        {editingSlot && (
          <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
            <Modal.Header closeButton style={{ borderBottom: 'none', padding: '24px 24px 16px 24px' }}>
              <Modal.Title style={{ fontSize: '24px', fontWeight: '400', color: '#202124' }}>
                Edit Timetable Slot
              </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ padding: '0 24px 24px 24px' }}>
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#e8f5e9', borderRadius: '8px' }}>
                <strong>Current:</strong> {editingSlot.day}, Period {editingSlot.period_number} - {editingSlot.subject_name}
              </div>
              <p style={{ color: '#5f6368', fontSize: '14px' }}>
                Note: Editing functionality will be fully implemented in the next update. For now, please delete and recreate the slot.
              </p>
            </Modal.Body>
            <Modal.Footer style={{ borderTop: 'none', padding: '16px 24px 24px 24px' }}>
              <Button variant="link" onClick={() => setShowEditModal(false)} style={{ color: '#1a73e8' }}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        )}

        {/* Delete Confirmation Dialog */}
        <Modal show={showDeleteDialog} onHide={() => setShowDeleteDialog(false)} centered>
          <Modal.Header closeButton style={{ borderBottom: 'none', padding: '24px 24px 16px 24px' }}>
            <Modal.Title style={{ fontSize: '20px', fontWeight: '500', color: '#202124' }}>
              Delete Timetable Slot?
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ padding: '0 24px 24px 24px' }}>
            {deletingSlotId && (
              <>
                <p style={{ color: '#5f6368', marginBottom: '16px' }}>
                  Are you sure you want to delete this slot? This action cannot be undone.
                </p>
                <div style={{
                  padding: '16px',
                  backgroundColor: '#fff3cd',
                  borderRadius: '8px',
                  border: '1px solid #ffc107'
                }}>
                  {(() => {
                    const slot = timetableSlots.find(s => s.id === deletingSlotId);
                    return slot ? (
                      <>
                        <div><strong>Day:</strong> {slot.day}</div>
                        <div><strong>Period:</strong> {slot.period_number}</div>
                        <div><strong>Subject:</strong> {slot.subject}</div>
                        <div><strong>Teacher:</strong> {slot.teacher}</div>
                        {slot.room && <div><strong>Room:</strong> {slot.room}</div>}
                      </>
                    ) : null;
                  })()}
                </div>
              </>
            )}
          </Modal.Body>
          <Modal.Footer style={{ borderTop: 'none', padding: '16px 24px 24px 24px', gap: '12px' }}>
            <Button
              variant="link"
              onClick={() => setShowDeleteDialog(false)}
              style={{ color: '#1a73e8', textDecoration: 'none' }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              style={{
                backgroundColor: '#dc3545',
                border: 'none',
                fontWeight: '500',
                padding: '10px 24px',
                borderRadius: '8px'
              }}
            >
              Delete
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default ClassTimetable; 