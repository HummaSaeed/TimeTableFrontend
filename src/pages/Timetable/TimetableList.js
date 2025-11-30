import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Table, Button, Badge,
  Modal, Form, Alert, Dropdown, Spinner, Tabs, Tab, Accordion
} from 'react-bootstrap';
import { timetableAPI, classesAPI, teachersAPI, subjectsAPI, schoolProfileAPI } from '../../services/api';
import { pdfService } from '../../services/pdfService';
import { useNavigate } from 'react-router-dom';
import TimetableGrid from '../../components/TimetableGrid';

const TimetableList = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [schoolProfile, setSchoolProfile] = useState(null);
  const [viewMode, setViewMode] = useState('overview'); // 'overview', 'teachers', 'classes'

  const navigate = useNavigate();

  const workingDays = Array.isArray(schoolProfile?.working_days) && schoolProfile.working_days.length
    ? schoolProfile.working_days
    : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const periodCount = Number(schoolProfile?.total_periods_per_day) > 0
    ? Number(schoolProfile.total_periods_per_day)
    : Math.max(0, ...timetableSlots.map(s => Number(s.period_number) || 0)) || 8;
  const periodNumbers = Array.from({ length: periodCount }, (_, i) => i + 1);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  // Refresh data when component comes back to focus
  useEffect(() => {
    const handleFocus = () => {
      fetchData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const results = await Promise.allSettled([
        timetableAPI.getAll(),
        classesAPI.getAll(),
        teachersAPI.getAll(),
        subjectsAPI.getAll(),
        schoolProfileAPI.getProfile(),
      ]);

      const [slotsRes, classesRes, teachersRes, subjectsRes, profileRes] = results;

      const getData = (res) => res.status === 'fulfilled'
        ? (res.value.data?.results || res.value.data || [])
        : [];

      const slots = Array.isArray(getData(slotsRes)) ? getData(slotsRes) : [];

      // Normalize slot data - ensure we have the right field names
      const normalizedSlots = slots.map(slot => ({
        ...slot,
        class_id: slot.class_id || slot.class_obj,
        teacher_id: slot.teacher_id || slot.teacher,
        period_number: slot.period_number || slot.period,
        subject_name: slot.subject_name || slot.subject,
        teacher_name: slot.teacher_name,
        class_name: slot.class_name,
        class_section: slot.class_section || slot.section,
        room_number: slot.room_number || slot.room,
        is_active: slot.is_active !== undefined ? slot.is_active : true
      }));

      console.log('Fetched slots:', normalizedSlots);

      setTimetableSlots(normalizedSlots);
      setClasses(Array.isArray(getData(classesRes)) ? getData(classesRes) : []);
      setTeachers(Array.isArray(getData(teachersRes)) ? getData(teachersRes) : []);
      setSubjects(Array.isArray(getData(subjectsRes)) ? getData(subjectsRes) : []);
      setSchoolProfile(profileRes.status === 'fulfilled' ? profileRes.value.data : null);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load timetable data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSchoolPDF = async () => {
    try {
      const result = await pdfService.generateConsolidatedClassesPDF(classes, timetableSlots, schoolProfile);
      if (result.success) {
        pdfService.downloadPDF(result.data, result.filename);
      }
    } catch (err) {
      setError('Failed to generate school timetable PDF');
    }
  };

  const handleDownloadTeachersPDF = async () => {
    try {
      const result = await pdfService.generateConsolidatedTeachersPDF(teachers, timetableSlots, schoolProfile);
      if (result.success) {
        pdfService.downloadPDF(result.data, result.filename);
      }
    } catch (err) {
      setError('Failed to generate teachers timetable PDF');
    }
  };

  // ==================== SCHOOL OVERVIEW ====================
  const renderSchoolOverview = () => {
    const totalSlots = timetableSlots.length;
    const totalClasses = classes.length;
    const totalTeachers = teachers.length;

    return (
      <div className="school-overview">
        {/* Overview Statistics */}
        <Row className="mb-4 g-3">
          <Col xs={12} lg={3} md={6} className="mb-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="text-center">
                <div className="p-3 rounded-circle d-inline-block mb-3" style={{ background: '#E8F5E9' }}>
                  <i className="fas fa-calendar-alt fa-2x" style={{ color: '#1A6E48' }}></i>
                </div>
                <h4 className="mb-1 fw-bold">{totalSlots}</h4>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} lg={3} md={6} className="mb-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="text-center">
                <div className="p-3 rounded-circle d-inline-block mb-3" style={{ background: '#E8F5E9' }}>
                  <i className="fas fa-users fa-2x" style={{ color: '#1A6E48' }}></i>
                </div>
                <h4 className="mb-1 fw-bold">{totalClasses}</h4>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} lg={3} md={6} className="mb-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="text-center">
                <div className="p-3 rounded-circle d-inline-block mb-3" style={{ background: '#E8F5E9' }}>
                  <i className="fas fa-chalkboard-teacher fa-2x" style={{ color: '#1A6E48' }}></i>
                </div>
                <h4 className="mb-1 fw-bold">{totalTeachers}</h4>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} lg={3} md={6} className="mb-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="text-center">
                <div className="p-3 rounded-circle d-inline-block mb-3" style={{ background: '#E8F5E9' }}>
                  <i className="fas fa-book fa-2x" style={{ color: '#1A6E48' }}></i>
                </div>
                <h4 className="mb-1 fw-bold">{subjects.length}</h4>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Complete School Timetable - Classes View */}
        <Card className="border-0 shadow-sm mb-4">
          <Card.Header className="bg-transparent">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <h5 className="mb-0">
                <i className="fas fa-school me-2" style={{ color: '#1A6E48' }}></i>
                School Timetable - By Class
              </h5>
              <Button
                variant="outline-success"
                size="sm"
                onClick={handleDownloadSchoolPDF}
                style={{ borderColor: '#1A6E48', color: '#1A6E48' }}
              >
                <i className="fas fa-file-pdf me-2"></i>
                Download PDF
              </Button>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="table-responsive" style={{
              overflowX: 'auto',
              overflowY: 'hidden',
              WebkitOverflowScrolling: 'touch'
            }}>
              <Table className="mb-0" style={{ minWidth: isMobile ? '900px' : '100%' }}>
                <thead style={{ background: '#1A6E48' }}>
                  <tr>
                    <th className="border-0 px-3 py-3 text-white" style={{ minWidth: '150px', position: isMobile ? 'sticky' : 'static', left: 0, zIndex: 10, background: '#1A6E48' }}>
                      Class
                    </th>
                    {periodNumbers.map(periodNum => (
                      <th key={periodNum} className="border-0 px-2 py-3 text-center text-white" style={{ minWidth: '120px' }}>
                        P{periodNum}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {classes.map(classItem => (
                    <tr key={classItem.id}>
                      <td className="px-3 py-2 fw-bold" style={{
                        minWidth: '150px',
                        position: isMobile ? 'sticky' : 'static',
                        left: 0,
                        zIndex: 5,
                        background: '#f8f9fa',
                        borderRight: isMobile ? '2px solid #dee2e6' : 'none'
                      }}>
                        <i className="fas fa-graduation-cap me-2" style={{ color: '#1A6E48' }}></i>
                        {classItem.class_name}-{classItem.section}
                      </td>
                      {periodNumbers.map(periodNum => {
                        const slot = timetableSlots.find(
                          s => s.class_name === classItem.class_name &&
                            s.class_section === classItem.section &&
                            s.period_number === periodNum
                        );
                        return (
                          <td key={`${classItem.id}-${periodNum}`} className="px-2 py-2 text-center" style={{ minHeight: '80px', verticalAlign: 'middle' }}>
                            {slot ? (
                              <div style={{
                                background: slot.is_active ? '#E8F5E9' : '#FFEBEE',
                                border: `2px solid ${slot.is_active ? '#4CAF50' : '#F44336'}`,
                                borderRadius: '8px',
                                padding: '10px',
                                minHeight: '70px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#1A6E48', lineHeight: '1.3' }}>
                                  {slot.subject_name}
                                </div>
                                <div style={{ fontSize: '11px', color: '#000000', lineHeight: '1.2' }}>
                                  👨‍🏫 {slot.teacher_name}
                                </div>
                                <div style={{ fontSize: '10px', color: '#000000', lineHeight: '1.2' }}>
                                  🏠 {slot.room_number || 'N/A'}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted small">-</span>
                            )}
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
      </div>
    );
  };

  // ==================== TEACHER-WISE VIEW ====================
  const renderTeacherWiseView = () => {
    return (
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-transparent">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h5 className="mb-0">
              <i className="fas fa-chalkboard-teacher me-2" style={{ color: '#1A6E48' }}></i>
              Teacher-wise Timetable
            </h5>
            <Button
              variant="outline-success"
              size="sm"
              onClick={handleDownloadTeachersPDF}
              style={{ borderColor: '#1A6E48', color: '#1A6E48' }}
            >
              <i className="fas fa-file-pdf me-2"></i>
              Download PDF
            </Button>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive" style={{
            overflowX: 'auto',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch'
          }}>
            <Table className="mb-0" style={{ minWidth: isMobile ? '900px' : '100%' }}>
              <thead style={{ background: '#1A6E48' }}>
                <tr>
                  <th className="border-0 px-3 py-3 text-white fw-bold" style={{ minWidth: '150px', position: isMobile ? 'sticky' : 'static', left: 0, zIndex: 10, background: '#1A6E48', color: '#ffffff' }}>
                    Teacher
                  </th>
                  {periodNumbers.map(periodNum => (
                    <th key={periodNum} className="border-0 px-2 py-3 text-center text-white fw-bold" style={{ minWidth: '120px', background: '#1A6E48', color: '#ffffff', fontWeight: 'bold' }}>
                      P{periodNum}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teachers.map(teacher => (
                  <tr key={teacher.id}>
                    <td className="px-3 py-2 fw-bold" style={{
                      minWidth: '150px',
                      position: isMobile ? 'sticky' : 'static',
                      left: 0,
                      zIndex: 5,
                      background: '#f8f9fa',
                      borderRight: isMobile ? '2px solid #dee2e6' : 'none'
                    }}>
                      <i className="fas fa-chalkboard-teacher me-2" style={{ color: '#1A6E48' }}></i>
                      {teacher.name}
                    </td>
                    {periodNumbers.map(periodNum => {
                      const slot = timetableSlots.find(
                        s => s.teacher_name === teacher.name && s.period_number === periodNum
                      );
                      return (
                        <td key={`${teacher.id}-${periodNum}`} className="px-2 py-2 text-center" style={{ minHeight: '80px', verticalAlign: 'middle' }}>
                          {slot ? (
                            <div style={{
                              background: slot.is_active ? '#E8F5E9' : '#FFEBEE',
                              border: `2px solid ${slot.is_active ? '#4CAF50' : '#F44336'}`,
                              borderRadius: '8px',
                              padding: '10px',
                              minHeight: '70px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <div style={{ fontSize: '12px', fontWeight: '700', color: '#1A6E48', lineHeight: '1.3' }}>
                                {slot.subject_name}
                              </div>
                              <div style={{ fontSize: '11px', color: '#000000', lineHeight: '1.2' }}>
                                👥 {slot.class_name}-{slot.class_section}
                              </div>
                              <div style={{ fontSize: '10px', color: '#000000', lineHeight: '1.2' }}>
                                🏠 {slot.room_number || 'N/A'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted small">-</span>
                          )}
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
    );
  };

  // ==================== CLASS-WISE VIEW ====================
  const renderClassWiseView = () => {
    return (
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-transparent">
          <h5 className="mb-0">
            <i className="fas fa-graduation-cap me-2" style={{ color: '#1A6E48' }}></i>
            Class-wise Timetable
          </h5>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive" style={{
            overflowX: 'auto',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch'
          }}>
            <Table className="mb-0" style={{ minWidth: isMobile ? '900px' : '100%' }}>
              <thead style={{ background: '#1A6E48' }}>
                <tr>
                  <th className="border-0 px-3 py-3 text-white fw-bold" style={{ minWidth: '150px', position: isMobile ? 'sticky' : 'static', left: 0, zIndex: 10, background: '#1A6E48', color: '#ffffff' }}>
                    Class
                  </th>
                  {periodNumbers.map(periodNum => (
                    <th key={periodNum} className="border-0 px-2 py-3 text-center text-white fw-bold" style={{ minWidth: '120px', background: '#1A6E48', color: '#ffffff', fontWeight: 'bold' }}>
                      P{periodNum}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {classes.map(classItem => (
                  <tr key={classItem.id}>
                    <td className="px-3 py-2 fw-bold" style={{
                      minWidth: '150px',
                      position: isMobile ? 'sticky' : 'static',
                      left: 0,
                      zIndex: 5,
                      background: '#f8f9fa',
                      borderRight: isMobile ? '2px solid #dee2e6' : 'none'
                    }}>
                      <i className="fas fa-graduation-cap me-2" style={{ color: '#1A6E48' }}></i>
                      {classItem.class_name}-{classItem.section}
                    </td>
                    {periodNumbers.map(periodNum => {
                      const slot = timetableSlots.find(
                        s => s.class_id === classItem.id && s.period_number === periodNum
                      );
                      return (
                        <td key={`${classItem.id}-${periodNum}`} className="px-2 py-2 text-center" style={{ minHeight: '80px', verticalAlign: 'middle' }}>
                          {slot ? (
                            <div style={{
                              background: slot.is_active ? '#E8F5E9' : '#FFEBEE',
                              border: `2px solid ${slot.is_active ? '#4CAF50' : '#F44336'}`,
                              borderRadius: '8px',
                              padding: '10px',
                              minHeight: '70px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <div style={{ fontSize: '12px', fontWeight: '700', color: '#1A6E48', lineHeight: '1.3' }}>
                                {slot.subject_name}
                              </div>
                              <div style={{ fontSize: '11px', color: '#000000', lineHeight: '1.2' }}>
                                👨‍🏫 {slot.teacher_name}
                              </div>
                              <div style={{ fontSize: '10px', color: '#000000', lineHeight: '1.2' }}>
                                🏠 {slot.room_number || 'N/A'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted small">-</span>
                          )}
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
    );
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <Spinner animation="border" style={{ color: '#1A6E48', width: '3rem', height: '3rem' }} className="mb-3" />
          <h5 className="text-muted">Loading Timetables...</h5>
        </div>
      </div>
    );
  }

  return (
    <div className="timetable-page">
      {/* Header Section */}
      <div className="page-header py-4 mb-4" style={{
        background: 'linear-gradient(135deg, #2d5a27 0%, #4a7c59 100%)',
        borderRadius: '0 0 2rem 2rem'
      }}>
        <Container fluid className="px-3 px-md-4">
          <Row className="align-items-center g-2 g-md-3">
            <Col xs={12} md={8}>
              <h1 className="text-white fw-bold mb-0" style={{ fontSize: isMobile ? '20px' : '28px' }}>
                <i className="fas fa-calendar-alt me-2"></i>
                Timetable Management
              </h1>
            </Col>
            <Col xs={12} md={4} className={isMobile ? 'text-start' : 'text-end'}>
              <div className={`d-flex gap-2 flex-${isMobile ? 'column' : 'row'}`}>
                <Button
                  variant="outline-light"
                  onClick={() => fetchData()}
                  size={isMobile ? 'sm' : 'md'}
                  style={{ fontSize: isMobile ? '12px' : '14px' }}
                >
                  <i className="fas fa-sync me-2"></i>
                  {isMobile ? 'Refresh' : 'Refresh'}
                </Button>
                <Button
                  variant="outline-light"
                  onClick={() => navigate('/timetable/import')}
                  size={isMobile ? 'sm' : 'md'}
                  style={{ fontSize: isMobile ? '12px' : '14px' }}
                >
                  <i className="fas fa-plus me-2"></i>
                  {isMobile ? 'Add' : 'Add Slot'}
                </Button>
                <Button
                  variant="outline-light"
                  onClick={() => navigate('/timetable/generate')}
                  size={isMobile ? 'sm' : 'md'}
                  style={{ fontSize: isMobile ? '12px' : '14px' }}
                >
                  <i className="fas fa-magic me-2"></i>
                  {isMobile ? 'Generate' : 'Auto Generate'}
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <Container fluid className="px-3 px-md-4">
        {error && (
          <Alert variant="danger" className="mb-4" onClose={() => setError(null)} dismissible>
            <Alert.Heading>Error</Alert.Heading>
            <p>{error}</p>
          </Alert>
        )}

        {/* View Mode Selector */}
        <Row className="mb-4 g-2">
          <Col xs={12} className={`d-flex flex-${isMobile ? 'column' : 'row'} gap-2`}>
            <Button
              variant={viewMode === 'overview' ? 'success' : 'outline-success'}
              onClick={() => setViewMode('overview')}
              size={isMobile ? 'sm' : 'md'}
              className={isMobile ? 'w-100' : ''}
              style={viewMode === 'overview' ? { background: '#1A6E48', borderColor: '#1A6E48' } : { color: '#1A6E48', borderColor: '#1A6E48' }}
            >
              <i className="fas fa-school me-2"></i>
              {isMobile ? 'School' : 'School Overview'}
            </Button>
            <Button
              variant={viewMode === 'teachers' ? 'success' : 'outline-success'}
              onClick={() => setViewMode('teachers')}
              size={isMobile ? 'sm' : 'md'}
              className={isMobile ? 'w-100' : ''}
              style={viewMode === 'teachers' ? { background: '#1A6E48', borderColor: '#1A6E48' } : { color: '#1A6E48', borderColor: '#1A6E48' }}
            >
              <i className="fas fa-chalkboard-teacher me-2"></i>
              {isMobile ? 'Teachers' : 'Teacher-wise'}
            </Button>
            <Button
              variant={viewMode === 'classes' ? 'success' : 'outline-success'}
              onClick={() => setViewMode('classes')}
              size={isMobile ? 'sm' : 'md'}
              className={isMobile ? 'w-100' : ''}
              style={viewMode === 'classes' ? { background: '#1A6E48', borderColor: '#1A6E48' } : { color: '#1A6E48', borderColor: '#1A6E48' }}
            >
              <i className="fas fa-graduation-cap me-2"></i>
              {isMobile ? 'Classes' : 'Class-wise'}
            </Button>
          </Col>
        </Row>

        {/* Main Content Based on View Mode */}
        {viewMode === 'overview' && renderSchoolOverview()}
        {viewMode === 'teachers' && renderTeacherWiseView()}
        {viewMode === 'classes' && renderClassWiseView()}
      </Container>
    </div>
  );
};

export default TimetableList;
