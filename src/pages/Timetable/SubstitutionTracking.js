import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Table, Button, Badge,
  Modal, Form, Alert, Spinner, Tabs, Tab, ProgressBar
} from 'react-bootstrap';
import { teachersAPI, schoolProfileAPI, timetableAPI } from '../../services/api';
import { pdfService } from '../../services/pdfService';

// Helper function to get week dates (defined outside component to avoid hoisting issues)
const getWeekDates = (date) => {
  const curr = new Date(date);
  const first = curr.getDate() - curr.getDay() + 1; // Monday
  const monday = new Date(curr.setDate(first));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: monday, end: sunday };
};

const SubstitutionTracking = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [schoolProfile, setSchoolProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('mark-absent');

  // For marking teacher absent
  const [substitutionForm, setSubstitutionForm] = useState({
    teacher_id: '',
    date: new Date().toISOString().split('T')[0],
    reason: ''
  });
  const [substitutionResult, setSubstitutionResult] = useState(null);

  // For bulk mark absent
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);
  const [bulkResult, setBulkResult] = useState(null);

  // For today's grid
  const [gridDate, setGridDate] = useState(new Date().toISOString().split('T')[0]);
  const [gridData, setGridData] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [dayName, setDayName] = useState('');
  const [statistics, setStatistics] = useState(null);

  // For records
  const [substitutionLogs, setSubstitutionLogs] = useState([]);
  const [recordView, setRecordView] = useState('weekly'); // 'weekly', 'monthly', 'total'
  const [selectedWeek, setSelectedWeek] = useState(getWeekDates(new Date()));
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // For workload tracking
  const [teacherWorkload, setTeacherWorkload] = useState({});
  const [teacherStats, setTeacherStats] = useState(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'grid' && gridDate) {
      fetchGridData();
    }
  }, [activeTab, gridDate]);

  useEffect(() => {
    if (activeTab === 'records') {
      fetchSubstitutionLogs();
    }
  }, [activeTab, recordView, selectedWeek, selectedMonth, selectedYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const results = await Promise.allSettled([
        teachersAPI.getAll(),
        schoolProfileAPI.getProfile(),
        teachersAPI.getSubstitutionStats()
      ]);

      const [teachersRes, profileRes, statsRes] = results;

      setTeachers(teachersRes.status === 'fulfilled' ? (teachersRes.value.data?.results || teachersRes.value.data || []) : []);
      setSchoolProfile(profileRes.status === 'fulfilled' ? profileRes.value.data : null);
      setTeacherStats(statsRes.status === 'fulfilled' ? statsRes.value.data : null);

    } catch (error) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchGridData = async () => {
    try {
      const response = await teachersAPI.getTodaysSubstitutionGrid(gridDate);
      const data = response.data;

      if (data.success) {
        setGridData(data.grid_data || []);
        setPeriods(data.periods || []);
        setDayName(data.day_name || '');
        setStatistics(data.statistics || null);
      } else {
        setGridData([]);
        setPeriods([]);
      }
    } catch (error) {
      console.error('Error fetching grid:', error);
      setGridData([]);
      setPeriods([]);
    }
  };

  const fetchSubstitutionLogs = async () => {
    try {
      const response = await teachersAPI.getSubstitutionLogs();
      const logs = response.data?.results || [];
      setSubstitutionLogs(logs);
      calculateWorkloadFromLogs(logs);
    } catch (error) {
      console.error('Error fetching substitution logs:', error);
      setSubstitutionLogs([]);
    }
  };

  const calculateWorkloadFromLogs = (logs) => {
    const workload = {};

    teachers.forEach(teacher => {
      workload[teacher.id] = {
        id: teacher.id,
        name: teacher.name,
        totalSubstitutions: 0,
        weeklySubstitutions: {},
        monthlySubstitutions: {},
        dailySubstitutions: {}
      };
    });

    logs.forEach(log => {
      const teacherId = log.substitute_teacher.id;
      if (workload[teacherId]) {
        const logDate = new Date(log.date);
        const weekKey = `${logDate.getFullYear()}-W${getWeekNumber(logDate)}`;
        const monthKey = `${logDate.getFullYear()}-${logDate.getMonth()}`;
        const dayKey = log.date;

        workload[teacherId].totalSubstitutions++;
        workload[teacherId].weeklySubstitutions[weekKey] =
          (workload[teacherId].weeklySubstitutions[weekKey] || 0) + 1;
        workload[teacherId].monthlySubstitutions[monthKey] =
          (workload[teacherId].monthlySubstitutions[monthKey] || 0) + 1;
        workload[teacherId].dailySubstitutions[dayKey] =
          (workload[teacherId].dailySubstitutions[dayKey] || 0) + 1;
      }
    });

    setTeacherWorkload(workload);
  };

  const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const handleMarkAbsent = async (e) => {
    e.preventDefault();

    if (bulkMode) {
      // Handle bulk mark absent
      if (selectedTeacherIds.length === 0) {
        setError('Please select at least one teacher');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setSuccess(null);

        const response = await teachersAPI.markAbsentBulk({
          teacher_ids: selectedTeacherIds,
          date: substitutionForm.date,
          reason: substitutionForm.reason || 'Not specified'
        });

        if (response.data) {
          setBulkResult(response.data);
          setSuccess(response.data.message);

          // Show warnings if any
          if (response.data.warnings && response.data.warnings.length > 0) {
            const warningMsg = response.data.warnings.join('\n');
            alert('Bulk operation completed with warnings:\n\n' + warningMsg);
          }

          // Reset form
          setSelectedTeacherIds([]);
          setSubstitutionForm({
            teacher_id: '',
            date: new Date().toISOString().split('T')[0],
            reason: ''
          });

          // Refresh data
          await fetchData();
        }
      } catch (error) {
        console.error('Error in bulk mark absent:', error);
        setError(error.response?.data?.error || 'Failed to mark teachers absent');
      } finally {
        setLoading(false);
      }
    } else {
      // Handle single teacher mark absent
      if (!substitutionForm.teacher_id || !substitutionForm.date) {
        setError('Please select a teacher and date');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setSuccess(null);

        const response = await teachersAPI.markAbsent({
          teacher_id: parseInt(substitutionForm.teacher_id),
          date: substitutionForm.date,
          reason: substitutionForm.reason || 'Not specified'
        });

        if (response.data) {
          setSubstitutionResult(response.data);
          setSuccess(response.data.message);

          // Show warnings if any
          if (response.data.warnings && response.data.warnings.length > 0) {
            const warningMsg = response.data.warnings.join('\n');
            alert('Substitutions assigned with warnings:\n\n' + warningMsg);
          }

          // Reset form
          setSubstitutionForm({
            teacher_id: '',
            date: new Date().toISOString().split('T')[0],
            reason: ''
          });

          // Refresh data
          await fetchData();
        }
      } catch (error) {
        console.error('Error marking teacher absent:', error);
        setError(error.response?.data?.error || 'Failed to mark teacher absent');
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleTeacherSelection = (teacherId) => {
    if (selectedTeacherIds.includes(teacherId)) {
      setSelectedTeacherIds(selectedTeacherIds.filter(id => id !== teacherId));
    } else {
      setSelectedTeacherIds([...selectedTeacherIds, teacherId]);
    }
  };

  const getFilteredLogs = () => {
    if (recordView === 'weekly') {
      return substitutionLogs.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= selectedWeek.start && logDate <= selectedWeek.end;
      });
    } else if (recordView === 'monthly') {
      return substitutionLogs.filter(log => {
        const logDate = new Date(log.date);
        return logDate.getMonth() === selectedMonth && logDate.getFullYear() === selectedYear;
      });
    } else {
      return substitutionLogs;
    }
  };

  const navigateWeek = (direction) => {
    const newStart = new Date(selectedWeek.start);
    newStart.setDate(newStart.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedWeek(getWeekDates(newStart));
  };

  const navigateMonth = (direction) => {
    let newMonth = selectedMonth + (direction === 'next' ? 1 : -1);
    let newYear = selectedYear;

    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const downloadGridPDF = async () => {
    try {
      const result = await pdfService.generateSubstitutionGridPDF(
        gridData,
        periods,
        gridDate,
        dayName,
        statistics
      );

      if (result.success) {
        pdfService.downloadPDF(result.data, result.filename);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF');
    }
  };

  // RENDER: Mark Teacher Absent Tab
  const renderMarkAbsentTab = () => (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-danger text-white">
        <h5 className="mb-0">
          <i className="fas fa-user-times me-2"></i>
          Mark Teacher Absent & Auto-Assign Substitutes
        </h5>
      </Card.Header>
      <Card.Body>
        <Alert variant="info">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Enhanced Fairness System:</strong> Select a teacher and date. The system automatically ensures equal distribution:
          <ul className="mb-0 mt-2">
            <li>✅ <strong>Multi-Level Fairness:</strong> Tracks daily, weekly, monthly, and all-time substitutions</li>
            <li>✅ <strong>Equal Distribution:</strong> Always assigns to teacher with fewest substitutions (most fair)</li>
            <li>✅ <strong>Weekly Limit:</strong> Maximum 5 substitutions per week (prevents overload)</li>
            <li>✅ <strong>No Conflicts:</strong> Prevents double assignments and timetable conflicts</li>
            <li>✅ <strong>Subject Preference:</strong> Prefers teachers who can teach the subject</li>
            <li>✅ <strong>Long-Term Balance:</strong> Tracks all-time substitutions for overall fairness</li>
            <li>✅ <strong>Automatic Rotation:</strong> System cycles through all teachers for equal opportunity</li>
          </ul>
        </Alert>

        {/* Mode Toggle */}
        <div className="mb-3">
          <Button
            variant={!bulkMode ? "primary" : "outline-primary"}
            onClick={() => {
              setBulkMode(false);
              setSelectedTeacherIds([]);
              setBulkResult(null);
            }}
            className="me-2"
          >
            <i className="fas fa-user me-2"></i>Single Teacher
          </Button>
          <Button
            variant={bulkMode ? "primary" : "outline-primary"}
            onClick={() => {
              setBulkMode(true);
              setSubstitutionResult(null);
            }}
          >
            <i className="fas fa-users me-2"></i>Bulk (Multiple Teachers)
          </Button>
        </div>

        <Form onSubmit={handleMarkAbsent}>
          <Row>
            {!bulkMode ? (
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Select Teacher *</Form.Label>
                  <Form.Select
                    value={substitutionForm.teacher_id}
                    onChange={(e) => setSubstitutionForm({
                      ...substitutionForm,
                      teacher_id: e.target.value
                    })}
                    required
                  >
                    <option value="">Choose teacher...</option>
                    {teachers.filter(t => t.is_active).map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            ) : (
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Select Teachers * (Select multiple)</Form.Label>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '0.375rem', padding: '10px' }}>
                    {teachers.filter(t => t.is_active).map(teacher => (
                      <Form.Check
                        key={teacher.id}
                        type="checkbox"
                        id={`teacher-${teacher.id}`}
                        label={teacher.name}
                        checked={selectedTeacherIds.includes(teacher.id)}
                        onChange={() => toggleTeacherSelection(teacher.id)}
                        className="mb-2"
                      />
                    ))}
                  </div>
                  <small className="text-muted">
                    {selectedTeacherIds.length} teacher(s) selected
                  </small>
                </Form.Group>
              </Col>
            )}

            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Date *</Form.Label>
                <Form.Control
                  type="date"
                  value={substitutionForm.date}
                  onChange={(e) => setSubstitutionForm({
                    ...substitutionForm,
                    date: e.target.value
                  })}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Reason</Form.Label>
                <Form.Control
                  type="text"
                  value={substitutionForm.reason}
                  onChange={(e) => setSubstitutionForm({
                    ...substitutionForm,
                    reason: e.target.value
                  })}
                  placeholder="e.g., Medical leave, Training"
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-end">
            <Button
              type="submit"
              variant="danger"
              size="lg"
              disabled={loading || (!bulkMode && !substitutionForm.teacher_id) || (bulkMode && selectedTeacherIds.length === 0) || !substitutionForm.date}
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Processing...
                </>
              ) : (
                <>
                  <i className={`fas ${bulkMode ? 'fa-users' : 'fa-user-times'} me-2`}></i>
                  {bulkMode ? `Mark ${selectedTeacherIds.length} Teachers Absent` : 'Mark Absent & Auto-Assign Substitutes'}
                </>
              )}
            </Button>
          </div>
        </Form>

        {/* Bulk Results */}
        {bulkMode && bulkResult && (
          <div className="mt-4">
            <Alert variant={bulkResult.summary.failed > 0 ? 'warning' : 'success'}>
              <h6>{bulkResult.message}</h6>
              <div className="mt-2">
                <Badge bg="success" className="me-2">
                  Successful: {bulkResult.summary.successful}
                </Badge>
                {bulkResult.summary.failed > 0 && (
                  <Badge bg="danger" className="me-2">
                    Failed: {bulkResult.summary.failed}
                  </Badge>
                )}
                <Badge bg="primary" className="me-2">
                  Total Substituted: {bulkResult.summary.total_substituted}
                </Badge>
                {bulkResult.summary.total_unsubstituted > 0 && (
                  <Badge bg="warning">
                    Unsubstituted: {bulkResult.summary.total_unsubstituted}
                  </Badge>
                )}
              </div>

              {bulkResult.warnings && bulkResult.warnings.length > 0 && (
                <div className="mt-3">
                  <strong>Warnings:</strong>
                  <ul className="mb-0 mt-2">
                    {bulkResult.warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Alert>

            {bulkResult.results && bulkResult.results.length > 0 && (
              <Card className="mt-3">
                <Card.Header>
                  <strong>Detailed Results</strong>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table striped bordered hover className="mb-0" size="sm">
                    <thead>
                      <tr>
                        <th>Teacher</th>
                        <th>Status</th>
                        <th>Substituted</th>
                        <th>Unsubstituted</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkResult.results.map((result, idx) => {
                        const teacher = teachers.find(t => t.id === result.teacher_id);
                        return (
                          <tr key={idx}>
                            <td>{teacher?.name || `Teacher ID: ${result.teacher_id}`}</td>
                            <td>
                              {result.success ? (
                                <Badge bg="success">Success</Badge>
                              ) : (
                                <Badge bg="danger">Failed</Badge>
                              )}
                            </td>
                            <td className="text-center">{result.substituted || 0}</td>
                            <td className="text-center">{result.unsubstituted || 0}</td>
                            <td>
                              {result.error && <small className="text-danger">{result.error}</small>}
                              {result.message && <small className="text-muted">{result.message}</small>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            )}
          </div>
        )}

        {/* Substitution Result */}
        {substitutionResult && (
          <div className="mt-4">
            <Alert variant={substitutionResult.warnings?.length > 0 ? 'warning' : 'success'}>
              <h6>{substitutionResult.message}</h6>
              <div className="mt-2">
                <Badge bg="primary" className="me-2">
                  Total Periods: {substitutionResult.total_periods}
                </Badge>
                <Badge bg="success" className="me-2">
                  Substituted: {substitutionResult.substituted}
                </Badge>
                <Badge bg="danger">
                  Unsubstituted: {substitutionResult.unsubstituted}
                </Badge>
              </div>

              {substitutionResult.warnings && substitutionResult.warnings.length > 0 && (
                <div className="mt-3">
                  <strong>Warnings:</strong>
                  <ul className="mb-0 mt-2">
                    {substitutionResult.warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Alert>

            <Card className="mt-3">
              <Card.Header>
                <strong>Substitution Details</strong>
              </Card.Header>
              <Card.Body className="p-0">
                <Table striped bordered hover className="mb-0">
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Class</th>
                      <th>Subject</th>
                      <th>Original Teacher</th>
                      <th>Substitute</th>
                      <th>Workload Info</th>
                    </tr>
                  </thead>
                  <tbody>
                    {substitutionResult.substitutions.map((sub, idx) => (
                      <tr key={idx}>
                        <td className="text-center">{sub.period}</td>
                        <td>{sub.class}</td>
                        <td>{sub.subject}</td>
                        <td>{sub.old_teacher}</td>
                        <td>
                          {sub.substitute_teacher ? (
                            <Badge bg="success">{sub.substitute_teacher}</Badge>
                          ) : (
                            <Badge bg="danger">Not Assigned</Badge>
                          )}
                        </td>
                        <td>
                          {sub.substitute_workload && (
                            <div>
                              <small className="text-muted d-block">
                                <strong>Regular:</strong> {sub.substitute_workload.regular_periods} periods
                              </small>
                              <small className="text-muted d-block">
                                <strong>Weekly:</strong> {sub.substitute_workload.weekly_substitutions} |
                                <strong> Monthly:</strong> {sub.substitute_workload.monthly_substitutions || 0} |
                                <strong> All-Time:</strong> {sub.substitute_workload.all_time_substitutions || 0}
                              </small>
                              <small className="text-muted d-block">
                                <strong>Today:</strong> {sub.substitute_workload.daily_substitutions} |
                                <strong> Batch:</strong> {sub.substitute_workload.batch_assignments || 0}
                              </small>
                              {sub.substitute_workload.fairness_score !== undefined && (
                                <small className="text-info d-block">
                                  <strong>Fairness Score:</strong> {sub.substitute_workload.fairness_score} (lower = more fair)
                                </small>
                              )}
                              {sub.subject_compatible === false && (
                                <Badge bg="warning" className="mt-1">
                                  <i className="fas fa-exclamation-triangle me-1"></i>
                                  Subject Mismatch
                                </Badge>
                              )}
                            </div>
                          )}
                          {sub.note && <small className="text-danger d-block mt-1">{sub.note}</small>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </div>
        )}
      </Card.Body>
    </Card>
  );

  // RENDER: Today's Substitution Grid Tab
  const renderGridTab = () => (
    <div>
      {/* Date Controls */}
      <Row className="mb-3">
        <Col md={4}>
          <Card>
            <Card.Body className="py-2">
              <Form.Group className="mb-0">
                <Form.Label className="mb-1 small">Select Date:</Form.Label>
                <Form.Control
                  type="date"
                  value={gridDate}
                  onChange={(e) => setGridDate(e.target.value)}
                  size="sm"
                />
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <div className="d-flex gap-2 align-items-end h-100 pb-2">
            <Button
              onClick={() => {
                const newDate = new Date(gridDate);
                newDate.setDate(newDate.getDate() - 1);
                setGridDate(newDate.toISOString().split('T')[0]);
              }}
              variant="outline-secondary"
              size="sm"
            >
              <i className="fas fa-chevron-left"></i> Previous
            </Button>
            <Button
              onClick={() => setGridDate(new Date().toISOString().split('T')[0])}
              variant="outline-primary"
              size="sm"
            >
              Today
            </Button>
            <Button
              onClick={() => {
                const newDate = new Date(gridDate);
                newDate.setDate(newDate.getDate() + 1);
                setGridDate(newDate.toISOString().split('T')[0]);
              }}
              variant="outline-secondary"
              size="sm"
            >
              Next <i className="fas fa-chevron-right"></i>
            </Button>
          </div>
        </Col>
        <Col md={4} className="text-end pb-2">
          {gridData.length > 0 && (
            <div className="d-flex gap-2 justify-content-end align-items-end h-100">
              <Button onClick={downloadGridPDF} variant="danger" size="sm">
                <i className="fas fa-file-pdf me-1"></i> Download PDF
              </Button>
            </div>
          )}
        </Col>
      </Row>

      {/* Date Summary */}
      <Card className="bg-light mb-3">
        <Card.Body className="py-2">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h6 className="mb-0">
                {dayName}, {new Date(gridDate).toLocaleDateString()}
              </h6>
              <small className="text-muted">
                {gridData.length} teacher{gridData.length !== 1 ? 's' : ''} absent
              </small>
            </div>
            {statistics && (
              <div className="d-flex gap-3">
                <div className="text-center">
                  <div className="h5 mb-0 text-primary">{statistics.total_periods_to_substitute}</div>
                  <small className="text-muted">Total</small>
                </div>
                <div className="text-center">
                  <div className="h5 mb-0 text-success">{statistics.substituted_periods}</div>
                  <small className="text-muted">Covered</small>
                </div>
                <div className="text-center">
                  <div className="h5 mb-0 text-danger">{statistics.unsubstituted_periods}</div>
                  <small className="text-muted">Pending</small>
                </div>
              </div>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Grid */}
      {gridData.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <i className="fas fa-calendar-check text-success mb-3" style={{ fontSize: '3rem' }}></i>
            <h5 className="text-success">No Teachers Absent</h5>
            <p className="text-muted">All teachers are present on {dayName}.</p>
          </Card.Body>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-danger text-white">
            <h6 className="mb-0">
              <i className="fas fa-table me-2"></i>
              Substitution Grid - {dayName}, {new Date(gridDate).toLocaleDateString()}
            </h6>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table bordered hover className="mb-0" style={{ fontSize: '0.85rem' }}>
                <thead className="table-danger">
                  <tr>
                    <th style={{
                      minWidth: '180px',
                      position: 'sticky',
                      left: 0,
                      backgroundColor: '#dc3545',
                      color: 'white',
                      zIndex: 10
                    }}>
                      Teacher (Absent)
                    </th>
                    {periods.map(period => (
                      <th key={period} className="text-center" style={{ minWidth: '140px' }}>
                        Period {period}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gridData.map((row) => (
                    <tr key={row.teacher_id}>
                      <td className="fw-bold bg-light" style={{
                        position: 'sticky',
                        left: 0,
                        zIndex: 5,
                        backgroundColor: '#f8f9fa !important'
                      }}>
                        <div>
                          <i className="fas fa-user-times text-danger me-2"></i>
                          {row.teacher_name}
                        </div>
                        {row.reason && (
                          <small className="text-muted d-block mt-1">
                            <i className="fas fa-info-circle me-1"></i>
                            {row.reason}
                          </small>
                        )}
                      </td>
                      {periods.map(period => {
                        const periodData = row.periods[period];

                        if (!periodData || !periodData.has_class) {
                          return (
                            <td key={period} className="text-center text-muted" style={{ backgroundColor: '#f8f9fa' }}>
                              <em>Free</em>
                            </td>
                          );
                        }

                        return (
                          <td key={period} style={{
                            backgroundColor: periodData.status === 'substituted' ? '#d4edda' : '#f8d7da',
                            verticalAlign: 'top',
                            padding: '8px'
                          }}>
                            <div>
                              <div className="fw-semibold text-primary small mb-1">
                                <i className="fas fa-graduation-cap me-1"></i>
                                {periodData.class_name}
                              </div>
                              <div className="text-muted small mb-1">
                                <i className="fas fa-book me-1"></i>
                                {periodData.subject_name}
                              </div>
                              {periodData.room_number && (
                                <div className="text-muted small mb-1">
                                  <i className="fas fa-door-open me-1"></i>
                                  Room {periodData.room_number}
                                </div>
                              )}
                              {periodData.period_start_time && periodData.period_end_time && (
                                <div className="text-muted small mb-2">
                                  <i className="fas fa-clock me-1"></i>
                                  {periodData.period_start_time} - {periodData.period_end_time}
                                </div>
                              )}
                              <div className="border-top pt-2 mt-1">
                                {periodData.substitute_teacher ? (
                                  <div className="text-success fw-bold small">
                                    <i className="fas fa-arrow-right me-1"></i>
                                    {periodData.substitute_teacher}
                                  </div>
                                ) : (
                                  <Badge bg="danger" className="small">
                                    NO SUBSTITUTE
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Legend */}
      {gridData.length > 0 && (
        <Card className="border-0 bg-light mt-3">
          <Card.Body className="py-2">
            <small className="text-muted">
              <strong>Legend:</strong>
              <Badge bg="success" className="ms-2 me-1">Green</Badge> Substituted
              <Badge bg="danger" className="ms-2 me-1">Red</Badge> No Substitute
              <Badge bg="secondary" className="ms-2 me-1">Gray</Badge> Free Period
            </small>
          </Card.Body>
        </Card>
      )}
    </div>
  );

  // RENDER: Substitution Records Tab
  const renderRecordsTab = () => {
    const filteredLogs = getFilteredLogs();

    // Calculate summary stats
    const teacherSubstitutionCount = {};
    filteredLogs.forEach(log => {
      const teacherId = log.substitute_teacher.id;
      teacherSubstitutionCount[teacherId] = (teacherSubstitutionCount[teacherId] || 0) + 1;
    });

    return (
      <div>
        {/* View Controls */}
        <Card className="mb-3">
          <Card.Body className="py-2">
            <Row className="align-items-center">
              <Col md={4}>
                <Form.Select
                  value={recordView}
                  onChange={(e) => setRecordView(e.target.value)}
                  size="sm"
                >
                  <option value="weekly">Weekly View</option>
                  <option value="monthly">Monthly View</option>
                  <option value="total">All Time</option>
                </Form.Select>
              </Col>

              <Col md={8} className="text-end">
                {recordView === 'weekly' && (
                  <div className="d-flex justify-content-end align-items-center gap-2">
                    <Button onClick={() => navigateWeek('prev')} variant="outline-secondary" size="sm">
                      <i className="fas fa-chevron-left"></i>
                    </Button>
                    <span className="text-muted small">
                      {selectedWeek.start.toLocaleDateString()} - {selectedWeek.end.toLocaleDateString()}
                    </span>
                    <Button onClick={() => navigateWeek('next')} variant="outline-secondary" size="sm">
                      <i className="fas fa-chevron-right"></i>
                    </Button>
                  </div>
                )}

                {recordView === 'monthly' && (
                  <div className="d-flex justify-content-end align-items-center gap-2">
                    <Button onClick={() => navigateMonth('prev')} variant="outline-secondary" size="sm">
                      <i className="fas fa-chevron-left"></i>
                    </Button>
                    <span className="text-muted small">
                      {months[selectedMonth]} {selectedYear}
                    </span>
                    <Button onClick={() => navigateMonth('next')} variant="outline-secondary" size="sm">
                      <i className="fas fa-chevron-right"></i>
                    </Button>
                  </div>
                )}
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Summary Statistics */}
        <Row className="mb-3">
          <Col md={3}>
            <Card className="border-0 shadow-sm text-center">
              <Card.Body>
                <div className="h4 text-primary mb-1">{filteredLogs.length}</div>
                <small className="text-muted">Total Substitutions</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm text-center">
              <Card.Body>
                <div className="h4 text-success mb-1">
                  {new Set(filteredLogs.map(log => log.original_teacher.id)).size}
                </div>
                <small className="text-muted">Teachers Absent</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm text-center">
              <Card.Body>
                <div className="h4 text-info mb-1">
                  {new Set(filteredLogs.map(log => log.substitute_teacher.id)).size}
                </div>
                <small className="text-muted">Substitute Teachers</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm text-center">
              <Card.Body>
                <div className="h4 text-warning mb-1">
                  {teachers.length > 0 ? Math.round(filteredLogs.length / teachers.length * 10) / 10 : 0}
                </div>
                <small className="text-muted">Avg per Teacher</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Substitution Records Table */}
        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-primary text-white">
            <h6 className="mb-0">
              <i className="fas fa-history me-2"></i>
              Substitution Records - {recordView === 'weekly' ? 'This Week' : recordView === 'monthly' ? months[selectedMonth] : 'All Time'}
            </h6>
          </Card.Header>
          <Card.Body className="p-0">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="fas fa-inbox fa-3x mb-3"></i>
                <h6>No substitution records found</h6>
                <p className="small">No substitutions were made during this period.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <Table striped bordered hover className="mb-0">
                  <thead>
                    <tr>
                      <th style={{ minWidth: '100px' }}>Date</th>
                      <th style={{ minWidth: '100px' }}>Day</th>
                      <th className="text-center" style={{ minWidth: '80px' }}>Period</th>
                      <th style={{ minWidth: '120px' }}>Class</th>
                      <th style={{ minWidth: '150px' }}>Subject</th>
                      <th style={{ minWidth: '180px' }}>Original Teacher</th>
                      <th style={{ minWidth: '180px' }}>Substitute</th>
                      <th style={{ minWidth: '150px' }}>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map(log => {
                      const logDate = new Date(log.date);
                      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][logDate.getDay()];

                      return (
                        <tr key={log.id}>
                          <td>{logDate.toLocaleDateString()}</td>
                          <td>{dayName}</td>
                          <td className="text-center">{log.timetable_slot.period_number}</td>
                          <td>{log.timetable_slot.class_name}</td>
                          <td>{log.timetable_slot.subject_name}</td>
                          <td>
                            <Badge bg="danger" className="me-1">
                              <i className="fas fa-user-times me-1"></i>
                              {log.original_teacher.name}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg="success">
                              <i className="fas fa-user-check me-1"></i>
                              {log.substitute_teacher.name}
                            </Badge>
                          </td>
                          <td><small>{log.reason || '-'}</small></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    );
  };

  // RENDER: Workload Balance Tab
  const renderWorkloadTab = () => {
    const workloadArray = Object.values(teacherWorkload).filter(w => w.id);
    workloadArray.sort((a, b) => b.totalSubstitutions - a.totalSubstitutions);

    // Current week key
    const now = new Date();
    const weekKey = `${now.getFullYear()}-W${getWeekNumber(now)}`;
    const monthKey = `${now.getFullYear()}-${now.getMonth()}`;

    return (
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-success text-white">
          <h5 className="mb-0">
            <i className="fas fa-balance-scale me-2"></i>
            Teacher Workload Balance & Fairness
          </h5>
        </Card.Header>
        <Card.Body>
          <Alert variant="info">
            <i className="fas fa-info-circle me-2"></i>
            <strong>Enhanced Fairness Algorithm:</strong>
            <ul className="mb-0 mt-2">
              <li>✅ <strong>Multi-Level Tracking:</strong> Daily, Weekly, Monthly, and All-Time substitutions</li>
              <li>✅ <strong>Equal Distribution:</strong> System always picks teacher with lowest fairness score</li>
              <li>✅ <strong>Weekly Limit:</strong> Maximum 5 substitutions per week (enforced automatically)</li>
              <li>✅ <strong>Long-Term Balance:</strong> All-time tracking ensures overall fairness over months</li>
              <li>✅ <strong>No Overload:</strong> Prevents same teacher getting multiple assignments same day</li>
              <li>✅ <strong>Fair Rotation:</strong> Automatically cycles through all available teachers</li>
              <li>✅ <strong>Result:</strong> Over time, all teachers will have approximately equal substitutions!</li>
            </ul>
          </Alert>

          {teacherStats && (
            <Row className="mb-4">
              {teacherStats.teacher_stats && teacherStats.teacher_stats.slice(0, 5).map(stat => (
                <Col md={4} lg={2} key={stat.teacher_id} className="mb-3">
                  <Card className={`border-0 text-center ${stat.weekly_substitutions >= 5 ? 'bg-danger text-white' :
                    stat.weekly_substitutions >= 4 ? 'bg-warning' :
                      'bg-light'
                    }`}>
                    <Card.Body className="py-2">
                      <div className="small fw-bold mb-1">{stat.teacher_name}</div>
                      <div className="h5 mb-0">{stat.weekly_substitutions}</div>
                      <small className="text-muted">This Week</small>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          <div className="table-responsive">
            <Table striped bordered hover className="mb-0">
              <thead className="table-dark">
                <tr>
                  <th style={{
                    minWidth: '180px',
                    position: 'sticky',
                    left: 0,
                    zIndex: 1,
                    backgroundColor: '#212529',
                    color: 'white'
                  }}>Teacher</th>
                  <th className="text-center" style={{ minWidth: '120px' }}>Regular Periods</th>
                  <th className="text-center" style={{ minWidth: '100px' }}>This Week</th>
                  <th className="text-center" style={{ minWidth: '100px' }}>This Month</th>
                  <th className="text-center" style={{ minWidth: '100px' }}>All Time</th>
                  <th className="text-center" style={{ minWidth: '120px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {workloadArray.map(teacher => {
                  const weeklySubs = teacher.weeklySubstitutions[weekKey] || 0;
                  const monthlySubs = teacher.monthlySubstitutions[monthKey] || 0;

                  let statusBg = 'success';
                  let statusText = 'Available';

                  if (weeklySubs >= 5) {
                    statusBg = 'danger';
                    statusText = 'At Limit';
                  } else if (weeklySubs >= 4) {
                    statusBg = 'warning';
                    statusText = 'Warning';
                  } else if (weeklySubs >= 2) {
                    statusBg = 'info';
                    statusText = 'Normal Load';
                  }

                  return (
                    <tr key={teacher.id}>
                      <td className="fw-semibold" style={{
                        position: 'sticky',
                        left: 0,
                        zIndex: 1,
                        backgroundColor: '#fff',
                        borderRight: '1px solid #dee2e6'
                      }}>
                        {teacher.name}
                      </td>
                      <td className="text-center">
                        <Badge bg="secondary">
                          {teacherStats?.teacher_stats?.find(s => s.teacher_id === teacher.id)?.regular_periods || 0}
                        </Badge>
                      </td>
                      <td className="text-center">
                        <Badge bg={weeklySubs >= 5 ? 'danger' : weeklySubs >= 4 ? 'warning' : 'success'}>
                          {weeklySubs}
                        </Badge>
                      </td>
                      <td className="text-center">
                        <Badge bg="info">{monthlySubs}</Badge>
                      </td>
                      <td className="text-center">
                        <Badge bg="primary">{teacher.totalSubstitutions}</Badge>
                      </td>
                      <td className="text-center">
                        <Badge bg={statusBg}>{statusText}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>

          {/* Workload Distribution Chart */}
          <Card className="border-0 bg-light mt-4">
            <Card.Body>
              <h6 className="mb-3">
                <i className="fas fa-chart-bar me-2"></i>
                Workload Distribution (This Week)
              </h6>
              {workloadArray.slice(0, 10).map(teacher => {
                const weeklySubs = teacher.weeklySubstitutions[weekKey] || 0;
                const maxSubs = Math.max(...workloadArray.map(t => t.weeklySubstitutions[weekKey] || 0), 1);
                const percentage = (weeklySubs / maxSubs) * 100;

                return (
                  <div key={teacher.id} className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="small fw-semibold">{teacher.name}</span>
                      <span className="small text-muted">{weeklySubs} substitutions</span>
                    </div>
                    <ProgressBar
                      now={percentage}
                      variant={weeklySubs >= 5 ? 'danger' : weeklySubs >= 4 ? 'warning' : weeklySubs >= 2 ? 'info' : 'success'}
                      style={{ height: '6px' }}
                    />
                  </div>
                );
              })}
            </Card.Body>
          </Card>
        </Card.Body>
      </Card>
    );
  };

  if (loading && !teachers.length) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <Spinner animation="border" className="mb-3" />
          <h5>Loading Substitution System...</h5>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h2>
            <i className="fas fa-user-clock me-2 text-danger"></i>
            Substitution Management System
          </h2>
          <p className="text-muted">
            Comprehensive teacher absence and substitution tracking with intelligent workload balancing
          </p>
        </Col>
        <Col xs="auto">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => fetchData()}
          >
            <i className="fas fa-sync-alt me-2"></i>
            Refresh All Data
          </Button>
        </Col>
      </Row>

      {/* Alerts */}
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible className="mb-3">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" onClose={() => setSuccess(null)} dismissible className="mb-3">
          <i className="fas fa-check-circle me-2"></i>
          {success}
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab
          eventKey="mark-absent"
          title={
            <span>
              <i className="fas fa-user-times me-2"></i>
              Mark Teacher Absent
            </span>
          }
        >
          <div className="mt-3">
            {renderMarkAbsentTab()}
          </div>
        </Tab>

        <Tab
          eventKey="grid"
          title={
            <span>
              <i className="fas fa-table me-2"></i>
              Substitution Grid
            </span>
          }
        >
          <div className="mt-3">
            {renderGridTab()}
          </div>
        </Tab>

        <Tab
          eventKey="records"
          title={
            <span>
              <i className="fas fa-history me-2"></i>
              Records
            </span>
          }
        >
          <div className="mt-3">
            {renderRecordsTab()}
          </div>
        </Tab>

        <Tab
          eventKey="workload"
          title={
            <span>
              <i className="fas fa-balance-scale me-2"></i>
              Workload Balance
            </span>
          }
        >
          <div className="mt-3">
            {renderWorkloadTab()}
          </div>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default SubstitutionTracking;
