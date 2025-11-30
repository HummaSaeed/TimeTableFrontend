import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Table, Button, Badge,
  Modal, Form, Alert, Spinner, Tabs, Tab, ProgressBar
} from 'react-bootstrap';
import { timetableAPI, teachersAPI, schoolProfileAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const TeacherWorkloadWeekly = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [schoolProfile, setSchoolProfile] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showSubstitutionModal, setShowSubstitutionModal] = useState(false);
  const [substitutionData, setSubstitutionData] = useState({
    originalTeacher: '',
    substituteTeacher: '',
    week: '',
    reason: ''
  });

  const navigate = useNavigate();

  const workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Generate dynamic time slots based on school profile
  const getTimeSlots = () => {
    if (!schoolProfile) {
      return [
        '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
        '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00'
      ];
    }
    
    const slots = [];
    const startTime = new Date(`2000-01-01T${schoolProfile.school_start_time || '08:00'}`);
    const periodDuration = schoolProfile.period_duration_minutes || 45;
    
    for (let i = 1; i <= (schoolProfile.total_periods_per_day || 8); i++) {
      const periodStart = new Date(startTime.getTime() + (i - 1) * periodDuration * 60000);
      const periodEnd = new Date(periodStart.getTime() + periodDuration * 60000);
      
      const startStr = periodStart.toTimeString().slice(0, 5);
      const endStr = periodEnd.toTimeString().slice(0, 5);
      
      slots.push(`${startStr}-${endStr}`);
    }
    
    return slots;
  };
  
  const timeSlots = getTimeSlots();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const results = await Promise.allSettled([
        timetableAPI.getAll(),
        teachersAPI.getAll(),
        schoolProfileAPI.getProfile(),
      ]);

      const [slotsRes, teachersRes, profileRes] = results;
      
      setTimetableSlots(slotsRes.status === 'fulfilled' ? (slotsRes.value.data?.results || slotsRes.value.data || []) : []);
      setTeachers(teachersRes.status === 'fulfilled' ? (teachersRes.value.data?.results || teachersRes.value.data || []) : []);
      setSchoolProfile(profileRes.status === 'fulfilled' ? profileRes.value.data : null);
    } catch (error) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const getWeekDates = (date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay() + 1); // Monday
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      dates.push(day);
    }
    return dates;
  };

  const getTeacherWorkloadForDay = (teacherName, day) => {
    return timetableSlots.filter(slot => 
      slot.teacher_name === teacherName && slot.day === day
    );
  };

  const getTeacherWeeklyWorkload = (teacherName) => {
    const weeklyWorkload = {};
    workingDays.forEach(day => {
      weeklyWorkload[day] = getTeacherWorkloadForDay(teacherName, day);
    });
    return weeklyWorkload;
  };

  const getTotalWeeklyPeriods = (teacherName) => {
    return workingDays.reduce((total, day) => {
      return total + getTeacherWorkloadForDay(teacherName, day).length;
    }, 0);
  };

  const getWorkloadStatus = (periods) => {
    if (periods >= 25) return { status: 'Overloaded', color: 'danger' };
    if (periods >= 20) return { status: 'High', color: 'warning' };
    if (periods >= 15) return { status: 'Optimal', color: 'success' };
    return { status: 'Low', color: 'info' };
  };

  const handleSubstitutionRequest = async (formData) => {
    try {
      // Call the backend API to mark teacher absent and get substitutions
      const response = await teachersAPI.markAbsent({
        teacher_id: parseInt(formData.originalTeacher),
        date: formData.date || new Date().toISOString().split('T')[0],
        reason: formData.reason || 'Substitution requested'
      });

      if (response.data) {
        const result = response.data;
        alert(`Substitution request processed successfully. ${result.substitutions.length} substitutions made.`);
        
        // Refresh data to show updated workload
        await fetchData();
        
        // Close modal
        setShowSubstitutionModal(false);
        setSubstitutionData({
          originalTeacher: '',
          substituteTeacher: '',
          week: '',
          reason: ''
        });
      }
    } catch (error) {
      console.error('Error processing substitution request:', error);
      const errorMessage = error.response?.data?.error || 'Failed to process substitution request. Please try again.';
      alert(errorMessage);
    }
  };

  const renderTeacherWeeklyGrid = (teacher) => {
    const weeklyWorkload = getTeacherWeeklyWorkload(teacher.name);
    const totalPeriods = getTotalWeeklyPeriods(teacher.name);
    const workloadStatus = getWorkloadStatus(totalPeriods);

    return (
      <Card className="border-0 shadow-sm mb-4" key={teacher.id}>
        <Card.Header className="bg-transparent border-0">
          <Row className="align-items-center">
            <Col md={6}>
              <h6 className="mb-0 fw-bold">
                <i className="fas fa-user me-2 text-primary"></i>
                {teacher.name}
              </h6>
              <small className="text-muted">{teacher.subject_specialist}</small>
            </Col>
            <Col md={6} className="text-end">
              <Badge bg={workloadStatus.color} className="me-2">
                {totalPeriods} periods/week
              </Badge>
              <Badge bg="secondary">
                {workloadStatus.status}
              </Badge>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive bordered className="mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: '120px' }}>Time</th>
                {workingDays.map(day => (
                  <th key={day} className="text-center">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(timeSlot => {
                const [startTime] = timeSlot.split('-');
                return (
                  <tr key={timeSlot}>
                    <td className="fw-bold text-center" style={{ backgroundColor: '#f8f9fa' }}>
                      {timeSlot}
                    </td>
                    {workingDays.map(day => {
                      const slots = weeklyWorkload[day].filter(slot => 
                        slot.start_time === startTime
                      );
                      return (
                        <td key={`${day}-${timeSlot}`} className="text-center p-2">
                          {slots.map((slot, index) => (
                            <div key={index} className="small p-1 mb-1 rounded" 
                                 style={{ backgroundColor: '#e3f2fd', border: '1px solid #bbdefb' }}>
                              <div className="fw-semibold text-primary">{slot.class_name}</div>
                              <div className="text-muted">{slot.subject_name}</div>
                              <div className="text-muted small">{slot.room_number}</div>
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    );
  };

  const renderWorkloadSummary = () => {
    const teacherStats = teachers.map(teacher => {
      const totalPeriods = getTotalWeeklyPeriods(teacher.name);
      const workloadStatus = getWorkloadStatus(totalPeriods);
      return { teacher, totalPeriods, workloadStatus };
    });

    const totalPeriods = teacherStats.reduce((sum, stat) => sum + stat.totalPeriods, 0);
    const averagePeriods = Math.round(totalPeriods / teachers.length);

    return (
      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm text-center">
            <Card.Body>
              <div className="h4 text-primary mb-1">{teachers.length}</div>
              <small className="text-muted">Total Teachers</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm text-center">
            <Card.Body>
              <div className="h4 text-success mb-1">{totalPeriods}</div>
              <small className="text-muted">Total Periods/Week</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm text-center">
            <Card.Body>
              <div className="h4 text-info mb-1">{averagePeriods}</div>
              <small className="text-muted">Avg Periods/Teacher</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm text-center">
            <Card.Body>
              <div className="h4 text-warning mb-1">
                {teacherStats.filter(s => s.workloadStatus.status === 'Overloaded').length}
              </div>
              <small className="text-muted">Overloaded Teachers</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    );
  };

  const renderWorkloadDistribution = () => {
    const teacherStats = teachers.map(teacher => {
      const totalPeriods = getTotalWeeklyPeriods(teacher.name);
      return { teacher, totalPeriods };
    }).sort((a, b) => b.totalPeriods - a.totalPeriods);

    const maxPeriods = Math.max(...teacherStats.map(s => s.totalPeriods));

    return (
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-transparent border-0">
          <h6 className="mb-0 fw-bold">
            <i className="fas fa-chart-bar me-2 text-info"></i>
            Weekly Workload Distribution
          </h6>
        </Card.Header>
        <Card.Body>
          {teacherStats.map((stat, index) => {
            const percentage = maxPeriods > 0 ? (stat.totalPeriods / maxPeriods) * 100 : 0;
            const workloadStatus = getWorkloadStatus(stat.totalPeriods);
            
            return (
              <div key={stat.teacher.id} className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="fw-semibold">{stat.teacher.name}</span>
                  <div>
                    <Badge bg={workloadStatus.color} className="me-2">
                      {stat.totalPeriods} periods
                    </Badge>
                    <small className="text-muted">{percentage.toFixed(1)}%</small>
                  </div>
                </div>
                <ProgressBar 
                  variant={workloadStatus.color} 
                  now={percentage} 
                  style={{ height: '8px' }}
                />
              </div>
            );
          })}
        </Card.Body>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="text-muted">Loading Weekly Workload...</h5>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-workload-weekly">
      {/* Header Section */}
      <div className="page-header py-4 mb-4" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '0 0 2rem 2rem'
      }}>
        <Container>
          <Row className="align-items-center">
            <Col md={8}>
              <h1 className="text-white fw-bold mb-2">Weekly Teacher Workload</h1>
              <p className="text-white opacity-75 mb-0">Monitor and analyze teacher workload distribution across the week</p>
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
                variant="light"
                onClick={() => setShowSubstitutionModal(true)}
              >
                <i className="fas fa-user-exchange me-2"></i>
                Manage Substitutions
              </Button>
            </Col>
          </Row>
        </Container>
      </div>

      <Container fluid className="px-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        {/* Workload Summary Cards */}
        {renderWorkloadSummary()}

        {/* Workload Distribution Chart */}
        {renderWorkloadDistribution()}

        {/* Individual Teacher Weekly Grids */}
        <Row className="mb-4">
          <Col md={12}>
            <h5 className="mb-3">
              <i className="fas fa-calendar-week me-2 text-success"></i>
              Individual Teacher Weekly Schedules
            </h5>
            {teachers.map(teacher => renderTeacherWeeklyGrid(teacher))}
          </Col>
        </Row>
      </Container>

      {/* Substitution Management Modal */}
      <Modal show={showSubstitutionModal} onHide={() => setShowSubstitutionModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Mark Teacher Absent</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Teacher *</Form.Label>
                  <Form.Select
                    value={substitutionData.originalTeacher}
                    onChange={(e) => setSubstitutionData({...substitutionData, originalTeacher: e.target.value})}
                    required
                  >
                    <option value="">Select Teacher</option>
                    {teachers.filter(teacher => teacher.is_active).map(teacher => (
                      <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={substitutionData.date || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setSubstitutionData({...substitutionData, date: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Reason *</Form.Label>
                  <Form.Control
                    type="text"
                    value={substitutionData.reason}
                    onChange={(e) => setSubstitutionData({...substitutionData, reason: e.target.value})}
                    placeholder="e.g., Medical Leave, Training, Personal"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Alert variant="info">
              <i className="fas fa-info-circle me-2"></i>
              The system will automatically find suitable substitute teachers based on subject expertise and availability.
            </Alert>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSubstitutionModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={() => handleSubstitutionRequest(substitutionData)}
            disabled={!substitutionData.originalTeacher || !substitutionData.reason}
          >
            <i className="fas fa-user-times me-2"></i>
            Mark Absent & Auto-Substitute
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TeacherWorkloadWeekly;

