import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Button, Badge,
  Alert, Spinner, Dropdown, Tabs, Tab, Table, Modal, Form
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { timetableAPI, teachersAPI, schoolProfileAPI } from '../../services/api';
import { pdfService } from '../../services/pdfService';
import TimetableGrid from '../../components/TimetableGrid';
import WorkloadManager from '../../components/WorkloadManager';

const TeacherTimetable = () => {
  const { teacherId } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [schoolProfile, setSchoolProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('timetable');
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const [selectedDay, setSelectedDay] = useState(days[0]); // Default to first day

  // Edit/Delete state
  const [editingSlot, setEditingSlot] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingSlotId, setDeletingSlotId] = useState(null);

  useEffect(() => {
    loadTeacherData();
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [teacherId]);

  const loadTeacherData = async () => {
    try {
      setLoading(true);

      // Load teacher details - Fixed: use getById instead of getTeacher
      const teacherResponse = await teachersAPI.getById(teacherId);
      setTeacher(teacherResponse.data);

      // Load school profile for break periods
      const profileResponse = await schoolProfileAPI.getProfile();
      setSchoolProfile(profileResponse.data);

      // Load teacher's timetable using specific endpoint
      console.log('Fetching timetable for teacher ID:', teacherId);
      const timetableResponse = await timetableAPI.getByTeacher(teacherId);
      console.log('Timetable API Response:', timetableResponse);

      const teacherSlots = timetableResponse.data.results || timetableResponse.data || [];
      console.log('Loaded teacher slots:', teacherSlots);

      setTimetableSlots(teacherSlots);

    } catch (err) {
      console.error('Error loading teacher data:', err);
      setError(err.response?.data?.message || 'Failed to load teacher data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const result = await pdfService.generateTeacherTimetablePDF(teacher, timetableSlots, schoolProfile);
      if (result.success) {
        pdfService.downloadPDF(result.data, result.filename);
      }
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export PDF');
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
      loadTeacherData(); // Refresh data
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
      loadTeacherData(); // Refresh data
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
            Loading teacher timetable...
          </p>
        </div>
      </div>
    );
  }

  if (error && !teacher) {
    return (
      <div style={{
        padding: '24px',
        background: '#FFFFFF',
        fontFamily: 'Poppins, sans-serif',
        minHeight: '100vh'
      }}>
        <Alert variant="danger" style={{
          borderRadius: '12px',
          border: 'none',
          background: '#FFEBEE',
          color: '#D32F2F'
        }}>
          <Alert.Heading style={{ fontFamily: 'Poppins, sans-serif', fontWeight: '600' }}>
            Error Loading Timetable
          </Alert.Heading>
          <p style={{ fontFamily: 'Poppins, sans-serif' }}>{error}</p>
          <Button
            onClick={loadTeacherData}
            style={{
              background: '#D32F2F',
              border: 'none',
              borderRadius: '8px',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: '500'
            }}
          >
            <i className="fas fa-redo me-2"></i>
            Retry
          </Button>
        </Alert>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div style={{
        padding: '24px',
        background: '#FFFFFF',
        fontFamily: 'Poppins, sans-serif',
        minHeight: '100vh'
      }}>
        <Alert variant="warning" style={{
          borderRadius: '12px',
          border: 'none',
          background: '#FFF3E0',
          color: '#F57C00'
        }}>
          <Alert.Heading style={{ fontFamily: 'Poppins, sans-serif', fontWeight: '600' }}>
            Teacher Not Found
          </Alert.Heading>
          <p style={{ fontFamily: 'Poppins, sans-serif' }}>
            The requested teacher could not be found.
          </p>
          <Button
            onClick={() => navigate('/teachers')}
            style={{
              background: '#F57C00',
              border: 'none',
              borderRadius: '8px',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: '500'
            }}
          >
            <i className="fas fa-arrow-left me-2"></i>
            <span className="back-btn-text">Back to Teachers</span>
          </Button>
        </Alert>
      </div>
    );
  }

  const periods = [1, 2, 3, 4, 5, 6, 7, 8];

  const renderMobileView = () => (
    <div className="mobile-timetable-view">
      {/* Day Navigation */}
      <div className="day-nav-container mb-3" style={{
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        padding: '4px 0',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        <div className="d-flex gap-2">
          {days.map(day => (
            <Button
              key={day}
              onClick={() => setSelectedDay(day)}
              variant={selectedDay === day ? 'success' : 'outline-secondary'}
              style={{
                borderRadius: '20px',
                padding: '6px 16px',
                fontSize: '14px',
                border: selectedDay === day ? 'none' : '1px solid #dee2e6',
                background: selectedDay === day ? '#1A6E48' : 'white',
                color: selectedDay === day ? 'white' : '#6C757D',
                flexShrink: 0
              }}
            >
              {day}
            </Button>
          ))}
        </div>
      </div>

      {/* Timeline List */}
      <div className="timeline-container">
        {periods.map(period => {
          const slot = getSlotForPeriodAndDay(period, selectedDay);
          return (
            <div key={period} className="timeline-item mb-3" style={{ position: 'relative', paddingLeft: '20px' }}>
              {/* Timeline Line/Dot */}
              <div style={{
                position: 'absolute',
                left: '0',
                top: '0',
                bottom: '-16px',
                width: '2px',
                backgroundColor: '#e9ecef',
                zIndex: 0
              }}></div>
              <div style={{
                position: 'absolute',
                left: '-4px',
                top: '12px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: slot ? (slot.is_active ? '#1A6E48' : '#dc3545') : '#adb5bd',
                zIndex: 1
              }}></div>

              {/* Content Card */}
              <Card style={{
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                backgroundColor: slot ? (slot.is_active ? '#ffffff' : '#fff5f5') : '#f8f9fa'
              }}>
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <Badge bg="light" text="dark" className="border">
                      Period {period}
                    </Badge>
                    {slot && (
                      <div className="d-flex gap-1">
                        <Button
                          size="sm"
                          variant="link"
                          className="p-0 text-primary"
                          onClick={() => handleEditSlot(slot)}
                        >
                          <i className="fas fa-edit"></i>
                        </Button>
                        <Button
                          size="sm"
                          variant="link"
                          className="p-0 text-danger ms-2"
                          onClick={() => handleDeleteSlot(slot.id)}
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </div>
                    )}
                  </div>

                  {slot ? (
                    <>
                      <h5 className="mb-1" style={{ fontSize: '16px', fontWeight: '600', color: '#2c3e50' }}>
                        {slot.subject}
                      </h5>
                      <div className="text-muted small mb-0">
                        <i className="fas fa-users me-1" style={{ width: '16px' }}></i>
                        {slot.class_name}-{slot.class_section}
                      </div>
                      {slot.room && (
                        <div className="text-muted small mt-1">
                          <i className="fas fa-map-marker-alt me-1" style={{ width: '16px' }}></i>
                          Room: {slot.room}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-muted small fst-italic">
                      Free Period
                    </div>
                  )}
                </Card.Body>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderDesktopView = () => (
    <div style={{
      overflowX: 'auto',
      overflowY: 'hidden',
      WebkitOverflowScrolling: 'touch',
      borderRadius: '8px',
      marginBottom: '24px'
    }}>
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
                        <div className="text-muted small">{slot.class_name}-{slot.class_section}</div>
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
              fontSize: isMobile ? '22px' : '28px'
            }}>
              <i className="fas fa-calendar-alt me-2" style={{ color: '#1A6E48', fontSize: isMobile ? '18px' : '24px' }}></i>
              {isMobile ? teacher.name?.split(' ')[0] : teacher.name}'s Timetable
            </h1>
          </div>
          <div className={`d-flex gap-2 ${isMobile ? 'flex-column w-100' : ''}`}>
            <Button
              onClick={handleExportPDF}
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
              className={isMobile ? 'flex-grow-1' : ''}
            >
              <i className="fas fa-download me-2"></i>
              {isMobile ? 'PDF' : 'Export PDF'}
            </Button>
            <Button
              variant="outline-secondary"
              style={{
                borderRadius: '8px',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: '500',
                padding: isMobile ? '8px 12px' : '10px 20px',
                fontSize: isMobile ? '12px' : '14px',
                borderColor: '#dee2e6',
                color: '#6C757D',
                whiteSpace: 'nowrap'
              }}
              onClick={() => navigate('/teachers')}
              className={isMobile ? 'flex-grow-1' : ''}
            >
              <i className="fas fa-arrow-left me-2"></i>
              <span className="back-btn-text">{isMobile ? 'Back' : 'Back to Teachers'}</span>
            </Button>
          </div>
        </div>
      </div>

      <Row className="mb-4">
        <Col>
          {/* Error Alert for operations */}
          {error && teacher && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible className="mb-4">
              {error}
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert variant="success" onClose={() => setSuccess(null)} dismissible className="mb-4">
              <i className="fas fa-check-circle me-2"></i>
              {success}
            </Alert>
          )}

          <Card style={{
            background: '#FFFFFF',
            border: 'none',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)'
          }}>
            <Card.Header style={{
              background: 'linear-gradient(135deg, #1A6E48 0%, #2d5a27 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '16px 16px 0 0',
              padding: isMobile ? '16px' : '24px'
            }}>
              <div className={`d-flex justify-content-between align-items-${isMobile ? 'start' : 'center'} flex-${isMobile ? 'column' : 'row'} gap-2`}>
                <div>
                  <div className="d-flex align-items-center mb-2">
                    <div style={{
                      width: isMobile ? '40px' : '48px',
                      height: isMobile ? '40px' : '48px',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '12px',
                      flexShrink: 0
                    }}>
                      <i className="fas fa-chalkboard-teacher" style={{ fontSize: isMobile ? '18px' : '20px', color: 'white' }}></i>
                    </div>
                    <div>
                      <h4 style={{
                        margin: 0,
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: '600',
                        fontSize: isMobile ? '16px' : '20px'
                      }}>
                        {teacher.name}
                      </h4>
                      <p style={{
                        margin: 0,
                        fontSize: isMobile ? '12px' : '14px',
                        opacity: 0.9,
                        fontFamily: 'Poppins, sans-serif',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: isMobile ? '100%' : 'auto'
                      }}>
                        {teacher.subject_specialists ? teacher.subject_specialists.join(', ').substring(0, isMobile ? 30 : 50) : 'Teacher'} • {teacher.email?.substring(0, isMobile ? 15 : 25)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card.Header>
            <Card.Body style={{ padding: '24px' }}>
              <div className="d-flex gap-2 mb-4 border-bottom pb-3">
                <Button
                  variant={activeTab === 'timetable' ? 'primary' : 'light'}
                  onClick={() => setActiveTab('timetable')}
                  style={{
                    background: activeTab === 'timetable' ? '#1A6E48' : 'transparent',
                    color: activeTab === 'timetable' ? 'white' : '#6C757D',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '500',
                    fontFamily: 'Poppins, sans-serif'
                  }}
                >
                  <i className="fas fa-calendar-week me-2"></i>
                  Timetable View
                </Button>
                <Button
                  variant={activeTab === 'workload' ? 'primary' : 'light'}
                  onClick={() => setActiveTab('workload')}
                  style={{
                    background: activeTab === 'workload' ? '#1A6E48' : 'transparent',
                    color: activeTab === 'workload' ? 'white' : '#6C757D',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '500',
                    fontFamily: 'Poppins, sans-serif'
                  }}
                >
                  <i className="fas fa-chart-bar me-2"></i>
                  Workload Analysis
                </Button>
              </div>

              {activeTab === 'timetable' && (
                <>
                  <div style={{ marginTop: '16px', marginBottom: '24px' }}>
                    <Alert style={{
                      background: 'var(--bs-primary-bg-subtle)',
                      border: 'none',
                      borderRadius: '12px',
                      color: 'var(--app-primary)',
                      fontFamily: 'Poppins, sans-serif'
                    }}>
                      <i className="fas fa-info-circle me-2"></i>
                      <strong>Weekly Schedule:</strong> Complete timetable view showing all assigned classes and periods.
                    </Alert>
                  </div>

                  {isMobile ? renderMobileView() : renderDesktopView()}
                </>
              )}

              {activeTab === 'workload' && (
                <div style={{ marginTop: '16px' }}>
                  <WorkloadManager
                    timetableSlots={timetableSlots}
                    teachers={[teacher]}
                    viewType="daily"
                    showSubstitutions={true}
                  />
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

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
              <strong>Current:</strong> {editingSlot.day}, Period {editingSlot.period_number} - {editingSlot.subject}
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
                      <div><strong>Class:</strong> {slot.class_name}-{slot.class_section}</div>
                      <div><strong>Subject:</strong> {slot.subject}</div>
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
    </div>
  );
};

export default TeacherTimetable;