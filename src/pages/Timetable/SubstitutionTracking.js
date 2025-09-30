import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Table, Button, Badge,
  Modal, Form, Alert, Spinner, ProgressBar
} from 'react-bootstrap';
import { teachersAPI, schoolProfileAPI } from '../../services/api';

const SubstitutionTracking = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [schoolProfile, setSchoolProfile] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddSubstitutionModal, setShowAddSubstitutionModal] = useState(false);
  const [substitutionForm, setSubstitutionForm] = useState({
    originalTeacher: '',
    substituteTeacher: '',
    date: '',
    reason: '',
    duration: 'single'
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const results = await Promise.allSettled([
        teachersAPI.getAll(),
        schoolProfileAPI.getProfile(),
      ]);

      const [teachersRes, profileRes] = results;
      
      setTeachers(teachersRes.status === 'fulfilled' ? (teachersRes.value.data?.results || teachersRes.value.data || []) : []);
      setSchoolProfile(profileRes.status === 'fulfilled' ? profileRes.value.data : null);
      
      await fetchSubstitutionData();
    } catch (error) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const [substitutionLogs, setSubstitutionLogs] = useState([]);
  const [teacherWorkload, setTeacherWorkload] = useState({});

  const fetchSubstitutionData = async () => {
    try {
      const response = await fetch('/api/substitution-logs/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const substitutions = data.results.map(log => ({
          id: log.id,
          originalTeacher: log.original_teacher.name,
          substituteTeacher: log.substitute_teacher.name,
          date: log.date,
          reason: log.reason,
          duration: 'single',
          status: 'completed'
        }));
        
        setSubstitutionLogs(substitutions);
        calculateWorkloadBalance(substitutions);
      }
    } catch (error) {
      console.error('Error fetching substitution data:', error);
      setSubstitutionLogs([]);
    }
  };

  const calculateWorkloadBalance = (substitutions) => {
    const workload = {};
    
    // Initialize workload for all teachers
    teachers.forEach(teacher => {
      workload[teacher.id] = {
        name: teacher.name,
        totalSubstitutions: 0,
        weeklySubstitutions: {},
        monthlySubstitutions: {}
      };
    });

    // Calculate substitution counts
    substitutions.forEach(sub => {
      const substituteId = teachers.find(t => t.name === sub.substituteTeacher)?.id;
      if (substituteId) {
        workload[substituteId].totalSubstitutions++;
        
        const date = new Date(sub.date);
        const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        
        workload[substituteId].weeklySubstitutions[weekKey] = 
          (workload[substituteId].weeklySubstitutions[weekKey] || 0) + 1;
        workload[substituteId].monthlySubstitutions[monthKey] = 
          (workload[substituteId].monthlySubstitutions[monthKey] || 0) + 1;
      }
    });

    setTeacherWorkload(workload);
  };

  const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const handleTeacherAbsence = async (formData) => {
    try {
      const response = await fetch('/api/teachers/absent/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          teacher_id: formData.originalTeacher,
          date: formData.date,
          reason: formData.reason
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Teacher marked absent successfully. ${result.substitutions.length} substitutions made.`);
        await fetchSubstitutionData();
        setShowAddSubstitutionModal(false);
        setSubstitutionForm({
          originalTeacher: '',
          substituteTeacher: '',
          date: '',
          reason: '',
          duration: 'single'
        });
      } else {
        alert('Failed to mark teacher absent');
      }
    } catch (error) {
      console.error('Error marking teacher absent:', error);
      alert('Error marking teacher absent');
    }
  };

  const getSubstitutionData = () => {
    return substitutionLogs.filter(sub => {
      const subDate = new Date(sub.date);
      return subDate.getMonth() === selectedMonth && subDate.getFullYear() === selectedYear;
    });
  };

  const getBestSubstitute = () => {
    const currentWeek = `${selectedYear}-W${getWeekNumber(new Date())}`;
    const currentMonth = `${selectedYear}-${selectedMonth}`;
    
    // Find teacher with least substitutions this week
    let bestTeacher = null;
    let minSubstitutions = Infinity;
    
    Object.values(teacherWorkload).forEach(teacher => {
      const weeklyCount = teacher.weeklySubstitutions[currentWeek] || 0;
      const monthlyCount = teacher.monthlySubstitutions[currentMonth] || 0;
      
      if (weeklyCount < minSubstitutions) {
        minSubstitutions = weeklyCount;
        bestTeacher = teacher;
      }
    });
    
    return bestTeacher;
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
        <p className="mt-3">Loading substitution tracking...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4 px-4">
      {/* Simple Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-2">Substitution Tracking</h2>
              <p className="text-muted mb-0">Manage teacher workload balance and substitution records</p>
            </div>
            <Button
              variant="success"
              onClick={() => setShowAddSubstitutionModal(true)}
            >
              <i className="fas fa-plus me-2"></i>
              Mark Teacher Absent
            </Button>
          </div>
        </Col>
      </Row>

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible className="mb-4">{error}</Alert>}

      {/* Workload Balance Overview */}
      <Row className="mb-4">
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent border-0">
              <h6 className="mb-0 fw-bold">
                <i className="fas fa-balance-scale me-2 text-success"></i>
                Teacher Workload Balance - {months[selectedMonth]} {selectedYear}
              </h6>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive bordered hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Teacher</th>
                    <th>Total Substitutions</th>
                    <th>This Week</th>
                    <th>This Month</th>
                    <th>Workload Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(teacherWorkload).map((teacher, index) => {
                    const currentWeek = `${selectedYear}-W${getWeekNumber(new Date())}`;
                    const currentMonth = `${selectedYear}-${selectedMonth}`;
                    const weeklyCount = teacher.weeklySubstitutions[currentWeek] || 0;
                    const monthlyCount = teacher.monthlySubstitutions[currentMonth] || 0;
                    
                    let status = 'Balanced';
                    let statusColor = 'success';
                    
                    if (weeklyCount > 3) {
                      status = 'Overloaded';
                      statusColor = 'danger';
                    } else if (weeklyCount > 2) {
                      status = 'Heavy';
                      statusColor = 'warning';
                    }
                    
                    return (
                      <tr key={index}>
                        <td className="fw-semibold">{teacher.name}</td>
                        <td>{teacher.totalSubstitutions}</td>
                        <td>{weeklyCount}</td>
                        <td>{monthlyCount}</td>
                        <td>
                          <Badge bg={statusColor}>{status}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent border-0">
              <h6 className="mb-0 fw-bold">
                <i className="fas fa-chart-pie me-2 text-info"></i>
                Workload Summary
              </h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small>Balanced Teachers</small>
                  <small>{Object.values(teacherWorkload).filter(t => (t.weeklySubstitutions[`${selectedYear}-W${getWeekNumber(new Date())}`] || 0) <= 2).length}</small>
                </div>
                <ProgressBar 
                  variant="success" 
                  now={Object.values(teacherWorkload).filter(t => (t.weeklySubstitutions[`${selectedYear}-W${getWeekNumber(new Date())}`] || 0) <= 2).length / teachers.length * 100}
                />
              </div>
              
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small>Heavy Workload</small>
                  <small>{Object.values(teacherWorkload).filter(t => (t.weeklySubstitutions[`${selectedYear}-W${getWeekNumber(new Date())}`] || 0) > 2).length}</small>
                </div>
                <ProgressBar 
                  variant="warning" 
                  now={Object.values(teacherWorkload).filter(t => (t.weeklySubstitutions[`${selectedYear}-W${getWeekNumber(new Date())}`] || 0) > 2).length / teachers.length * 100}
                />
              </div>

              <div className="text-center mt-3">
                <h6 className="text-success">Recommended Substitute</h6>
                <p className="mb-0 fw-bold">
                  {getBestSubstitute()?.name || 'No data available'}
                </p>
                <small className="text-muted">
                  Least substitutions this week
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Substitution Records */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-transparent border-0">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0 fw-bold">
              <i className="fas fa-list me-2 text-primary"></i>
              Substitution Records - {months[selectedMonth]} {selectedYear}
            </h6>
            <div className="d-flex gap-2">
              <Form.Select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                size="sm"
                style={{ width: '120px' }}
              >
                {months.map((month, index) => (
                  <option key={index} value={index}>{month}</option>
                ))}
              </Form.Select>
              <Form.Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                size="sm"
                style={{ width: '100px' }}
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
              </Form.Select>
            </div>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive bordered hover className="mb-0">
            <thead className="table-dark">
              <tr>
                <th>Date</th>
                <th>Original Teacher</th>
                <th>Substitute</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {getSubstitutionData().map(substitution => (
                <tr key={substitution.id}>
                  <td>{new Date(substitution.date).toLocaleDateString()}</td>
                  <td className="fw-semibold">{substitution.originalTeacher}</td>
                  <td className="fw-semibold text-success">{substitution.substituteTeacher}</td>
                  <td>
                    <small className="text-muted">{substitution.reason}</small>
                  </td>
                  <td>
                    <Badge bg="success">{substitution.status}</Badge>
                  </td>
                </tr>
              ))}
              {getSubstitutionData().length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    No substitutions recorded for {months[selectedMonth]} {selectedYear}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Add Substitution Modal */}
      <Modal show={showAddSubstitutionModal} onHide={() => setShowAddSubstitutionModal(false)} size="lg">
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>
            <i className="fas fa-user-times me-2"></i>
            Mark Teacher Absent
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info" className="mb-3">
            <i className="fas fa-info-circle me-2"></i>
            The system will automatically assign substitute teachers based on workload balance.
          </Alert>
          
          <Form onSubmit={(e) => {
            e.preventDefault();
            handleTeacherAbsence(substitutionForm);
          }}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Absent Teacher *</Form.Label>
                  <Form.Select
                    value={substitutionForm.originalTeacher}
                    onChange={(e) => setSubstitutionForm(prev => ({ ...prev, originalTeacher: e.target.value }))}
                    required
                  >
                    <option value="">Select teacher</option>
                    {teachers.filter(t => t.is_active).map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={substitutionForm.date}
                    onChange={(e) => setSubstitutionForm(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Reason for Absence *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={substitutionForm.reason}
                onChange={(e) => setSubstitutionForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter reason for absence..."
                required
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowAddSubstitutionModal(false)}>
                Cancel
              </Button>
              <Button variant="success" type="submit">
                <i className="fas fa-save me-2"></i>
                Mark Absent & Auto-Substitute
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default SubstitutionTracking;