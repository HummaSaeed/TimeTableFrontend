import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Button, Badge,
  Alert, Spinner, Dropdown, Tabs, Tab
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
  const [activeTab, setActiveTab] = useState('timetable');

  useEffect(() => {
    loadTeacherData();
  }, [teacherId]);

  const loadTeacherData = async () => {
    try {
      setLoading(true);
      
      // Load teacher details
      const teacherResponse = await teachersAPI.getTeacher(teacherId);
      setTeacher(teacherResponse.data);
      
      // Load school profile for break periods
      const profileResponse = await schoolProfileAPI.getProfile();
      setSchoolProfile(profileResponse.data);
      
      // Load teacher's timetable
      const timetableResponse = await timetableAPI.getByTeacher(teacherId);
      setTimetableSlots(timetableResponse.data.results || []);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load teacher data');
    } finally {
      setLoading(false);
    }
  };

  const getSlotForTimeAndDay = (timeSlot, day) => {
    return timetableSlots.find(slot => 
      slot.time_slot === timeSlot && slot.day === day
    );
  };

  const handleExportPDF = async () => {
    try {
      const data = {
        teacher: teacher,
        timetable: timetableSlots,
        schoolProfile: schoolProfile
      };
      await pdfService.exportTeacherTimetable(data);
    } catch (err) {
      setError('Failed to export PDF');
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
            Loading teacher timetable...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
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
            Back to Teachers
          </Button>
        </Alert>
      </div>
    );
  }

  const timeSlots = schoolProfile?.time_slots || [];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
              <i className="fas fa-calendar-alt me-3" style={{ color: '#1A6E48' }}></i>
              {teacher.name}'s Timetable
            </h1>
            <p style={{
              color: '#6C757D',
              margin: '4px 0 0 0',
              fontSize: '14px',
              fontWeight: '400'
            }}>
              Weekly schedule for {teacher.email} • View and manage teaching assignments
            </p>
          </div>
          <div className="d-flex gap-2 mt-2 mt-md-0">
            <Button
              onClick={handleExportPDF}
              style={{
                background: '#1A6E48',
                border: 'none',
                borderRadius: '8px',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: '500',
                padding: '10px 20px',
                fontSize: '14px'
              }}
            >
              <i className="fas fa-download me-2"></i>
              Export PDF
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
              onClick={() => navigate('/teachers')}
            >
              <i className="fas fa-arrow-left me-2"></i>
              Back to Teachers
            </Button>
          </div>
        </div>
      </div>

      <Row className="mb-4">
        <Col>
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
              padding: '24px'
            }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="d-flex align-items-center mb-2">
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '16px'
                    }}>
                      <i className="fas fa-chalkboard-teacher" style={{ fontSize: '20px', color: 'white' }}></i>
                    </div>
                    <div>
                      <h4 style={{
                        margin: 0,
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: '600',
                        fontSize: '20px'
                      }}>
                        {teacher.name}
                      </h4>
                      <p style={{
                        margin: 0,
                        fontSize: '14px',
                        opacity: 0.9,
                        fontFamily: 'Poppins, sans-serif'
                      }}>
                        {teacher.subject_specialists ? teacher.subject_specialists.join(', ') : 'Teacher'} • {teacher.email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card.Header>
            <Card.Body style={{ padding: '24px' }}>
              <Tabs 
                activeKey={activeTab} 
                onSelect={(k) => setActiveTab(k)}
                className="border-0"
              >
                <Tab eventKey="timetable" title={
                  <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: '500' }}>
                    <i className="fas fa-calendar-week me-2"></i>
                    Timetable View
                  </span>
                }>
                  <div style={{ marginTop: '16px', marginBottom: '24px' }}>
                    <Alert style={{
                      background: '#E3F2FD',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#1976D2',
                      fontFamily: 'Poppins, sans-serif'
                    }}>
                      <i className="fas fa-info-circle me-2"></i>
                      <strong>Weekly Schedule:</strong> Complete timetable view showing all assigned classes and periods.
                    </Alert>
                  </div>
                  
                  <TimetableGrid
                    days={days}
                    timeSlots={timeSlots}
                    timetableSlots={timetableSlots}
                    schoolProfile={schoolProfile}
                    getSlotForTimeAndDay={getSlotForTimeAndDay}
                    showBreakRows={true}
                    viewType="teacher"
                  />
                </Tab>
                
                <Tab eventKey="workload" title={
                  <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: '500' }}>
                    <i className="fas fa-chart-bar me-2"></i>
                    Workload Analysis
                  </span>
                }>
                  <div style={{ marginTop: '16px' }}>
                    <WorkloadManager
                      timetableSlots={timetableSlots}
                      teachers={[teacher]}
                      viewType="daily"
                      showSubstitutions={true}
                    />
                  </div>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TeacherTimetable; 