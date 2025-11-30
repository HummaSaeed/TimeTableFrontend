import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Table, Button, Badge,
  Alert, Spinner, Modal, Form
} from 'react-bootstrap';
import { timetableAPI, schoolProfileAPI } from '../../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const TodaysSchedule = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [schoolProfile, setSchoolProfile] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printOptions, setPrintOptions] = useState({
    includeTeachers: true,
    includeRooms: true,
    includeSubjects: true,
    showPeriodNumbers: true,
    showClassNumbers: true
  });

  const workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const results = await Promise.allSettled([
        timetableAPI.getAll(),
        schoolProfileAPI.getProfile(),
      ]);

      const [slotsRes, profileRes] = results;
      
      setTimetableSlots(slotsRes.status === 'fulfilled' ? (slotsRes.value.data?.results || slotsRes.value.data || []) : []);
      setSchoolProfile(profileRes.status === 'fulfilled' ? profileRes.value.data : null);
    } catch (error) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Get today's day name
  const getTodayDayName = () => {
    const today = new Date(selectedDate);
    return workingDays[today.getDay() === 0 ? 6 : today.getDay() - 1]; // Convert Sunday (0) to Saturday (6)
  };

  // Get today's timetable slots
  const getTodaysSlots = () => {
    const todayDay = getTodayDayName();
    return timetableSlots.filter(slot => slot.day === todayDay && slot.is_active);
  };

  // Group slots by period number
  const getSlotsByPeriod = () => {
    const todaysSlots = getTodaysSlots();
    const slotsByPeriod = {};
    
    todaysSlots.forEach(slot => {
      if (!slotsByPeriod[slot.period_number]) {
        slotsByPeriod[slot.period_number] = [];
      }
      slotsByPeriod[slot.period_number].push(slot);
    });
    
    return slotsByPeriod;
  };

  // Get period numbers sorted
  const getPeriodNumbers = () => {
    const slotsByPeriod = getSlotsByPeriod();
    return Object.keys(slotsByPeriod).map(Number).sort((a, b) => a - b);
  };

  // Generate PDF
  const generatePDF = () => {
    const doc = new doc();
    const slotsByPeriod = getSlotsByPeriod();
    const periodNumbers = getPeriodNumbers();
    const todaysSlots = getTodaysSlots();
    
    // Set up PDF
    doc.setFontSize(20);
    doc.text(`${schoolProfile?.school_name || 'School'} - Today's Schedule`, 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Date: ${new Date(selectedDate).toLocaleDateString()}`, 20, 35);
    doc.text(`Day: ${getTodayDayName()}`, 20, 45);
    
    // Prepare table data
    const tableData = [];
    
    periodNumbers.forEach(periodNum => {
      const slots = slotsByPeriod[periodNum];
      slots.forEach(slot => {
        const row = [
          periodNum,
          `${slot.class_name}-${slot.class_section}`,
          slot.subject_name || '-',
          slot.teacher_name || '-',
          slot.room_number || '-'
        ];
        tableData.push(row);
      });
    });
    
    // Create table
    doc.autoTable({
      startY: 60,
      head: [['Period', 'Class', 'Subject', 'Teacher', 'Room']],
      body: tableData,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 110, 72] },
      alternateRowStyles: { fillColor: [248, 249, 250] }
    });
    
    // Save PDF
    doc.save(`timetable-${selectedDate}.pdf`);
  };

  // Print table
  const printTable = () => {
    const printWindow = window.open('', '_blank');
    const todaysSlots = getTodaysSlots();
    const slotsByPeriod = getSlotsByPeriod();
    const periodNumbers = getPeriodNumbers();
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Today's Schedule - ${schoolProfile?.school_name || 'School'}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #1A6E48; margin: 0; }
            .header p { margin: 5px 0; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #1A6E48; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .period-cell { font-weight: bold; background-color: #e8f5e8; }
            .class-cell { font-weight: bold; }
            .subject-cell { color: #1A6E48; }
            .teacher-cell { color: #666; }
            .room-cell { color: #888; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${schoolProfile?.school_name || 'School'}</h1>
            <p><strong>Today's Schedule</strong></p>
            <p>Date: ${new Date(selectedDate).toLocaleDateString()}</p>
            <p>Day: ${getTodayDayName()}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Period</th>
                <th>Class</th>
                <th>Subject</th>
                <th>Teacher</th>
                <th>Room</th>
              </tr>
            </thead>
            <tbody>
              ${periodNumbers.map(periodNum => {
                const slots = slotsByPeriod[periodNum];
                return slots.map(slot => `
                  <tr>
                    <td class="period-cell">${periodNum}</td>
                    <td class="class-cell">${slot.class_name}-${slot.class_section}</td>
                    <td class="subject-cell">${slot.subject_name || '-'}</td>
                    <td class="teacher-cell">${slot.teacher_name || '-'}</td>
                    <td class="room-cell">${slot.room_number || '-'}</td>
                  </tr>
                `).join('');
              }).join('')}
            </tbody>
          </table>
          
          <div style="margin-top: 30px; text-align: center; color: #666;">
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
        <p className="mt-3">Loading today's schedule...</p>
      </Container>
    );
  }

  const todaysSlots = getTodaysSlots();
  const slotsByPeriod = getSlotsByPeriod();
  const periodNumbers = getPeriodNumbers();

  return (
    <Container fluid className="py-4 px-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-2">Today's Schedule</h2>
              <p className="text-muted mb-0">
                {schoolProfile?.school_name || 'School'} - {getTodayDayName()}, {new Date(selectedDate).toLocaleDateString()}
              </p>
            </div>
            <div className="d-flex gap-2">
              <Form.Control
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ width: '200px' }}
              />
              <Button
                variant="outline-primary"
                onClick={() => setShowPrintModal(true)}
              >
                <i className="fas fa-print me-2"></i>
                Print/PDF
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible className="mb-4">{error}</Alert>}

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm text-center">
            <Card.Body>
              <div className="h4 text-primary mb-1">{periodNumbers.length}</div>
              <small className="text-muted">Total Periods</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm text-center">
            <Card.Body>
              <div className="h4 text-success mb-1">{todaysSlots.length}</div>
              <small className="text-muted">Total Classes</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm text-center">
            <Card.Body>
              <div className="h4 text-info mb-1">
                {new Set(todaysSlots.map(slot => slot.teacher_name)).size}
              </div>
              <small className="text-muted">Teachers Active</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm text-center">
            <Card.Body>
              <div className="h4 text-warning mb-1">
                {new Set(todaysSlots.map(slot => `${slot.class_name}-${slot.class_section}`)).size}
              </div>
              <small className="text-muted">Classes Scheduled</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Today's Schedule Table */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-transparent border-0">
          <h6 className="mb-0 fw-bold">
            <i className="fas fa-calendar-day me-2 text-success"></i>
            Schedule for {getTodayDayName()}, {new Date(selectedDate).toLocaleDateString()}
          </h6>
        </Card.Header>
        <Card.Body className="p-0">
          {todaysSlots.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="fas fa-calendar-times fa-3x mb-3"></i>
              <h5>No classes scheduled for today</h5>
              <p>There are no active timetable slots for {getTodayDayName()}.</p>
            </div>
          ) : (
            <Table responsive bordered hover className="mb-0">
              <thead className="table-dark">
                <tr>
                  <th style={{ width: '80px' }}>Period</th>
                  <th style={{ width: '120px' }}>Class</th>
                  <th>Subject</th>
                  <th>Teacher</th>
                  <th style={{ width: '100px' }}>Room</th>
                </tr>
              </thead>
              <tbody>
                {periodNumbers.map(periodNum => {
                  const slots = slotsByPeriod[periodNum];
                  return slots.map((slot, index) => (
                    <tr key={`${periodNum}-${index}`}>
                      <td className="text-center fw-bold bg-light">
                        {periodNum}
                      </td>
                      <td className="fw-semibold">
                        <Badge bg="primary" className="me-2">
                          {slot.class_name}-{slot.class_section}
                        </Badge>
                      </td>
                      <td>
                        <span className="text-success fw-semibold">
                          {slot.subject_name || '-'}
                        </span>
                      </td>
                      <td>
                        <span className="text-muted">
                          {slot.teacher_name || '-'}
                        </span>
                      </td>
                      <td className="text-center">
                        <Badge bg="secondary" variant="outline">
                          {slot.room_number || '-'}
                        </Badge>
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Print/PDF Modal */}
      <Modal show={showPrintModal} onHide={() => setShowPrintModal(false)} size="lg">
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>
            <i className="fas fa-print me-2"></i>
            Print Today's Schedule
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Print Options</Form.Label>
                  <div>
                    <Form.Check
                      type="checkbox"
                      label="Include Period Numbers"
                      checked={printOptions.showPeriodNumbers}
                      onChange={(e) => setPrintOptions(prev => ({ ...prev, showPeriodNumbers: e.target.checked }))}
                    />
                    <Form.Check
                      type="checkbox"
                      label="Include Class Numbers"
                      checked={printOptions.showClassNumbers}
                      onChange={(e) => setPrintOptions(prev => ({ ...prev, showClassNumbers: e.target.checked }))}
                    />
                    <Form.Check
                      type="checkbox"
                      label="Include Subjects"
                      checked={printOptions.includeSubjects}
                      onChange={(e) => setPrintOptions(prev => ({ ...prev, includeSubjects: e.target.checked }))}
                    />
                    <Form.Check
                      type="checkbox"
                      label="Include Teachers"
                      checked={printOptions.includeTeachers}
                      onChange={(e) => setPrintOptions(prev => ({ ...prev, includeTeachers: e.target.checked }))}
                    />
                    <Form.Check
                      type="checkbox"
                      label="Include Rooms"
                      checked={printOptions.includeRooms}
                      onChange={(e) => setPrintOptions(prev => ({ ...prev, includeRooms: e.target.checked }))}
                    />
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Schedule Summary</Form.Label>
                  <div className="bg-light p-3 rounded">
                    <p className="mb-1"><strong>Date:</strong> {new Date(selectedDate).toLocaleDateString()}</p>
                    <p className="mb-1"><strong>Day:</strong> {getTodayDayName()}</p>
                    <p className="mb-1"><strong>Total Periods:</strong> {periodNumbers.length}</p>
                    <p className="mb-1"><strong>Total Classes:</strong> {todaysSlots.length}</p>
                    <p className="mb-0"><strong>Active Teachers:</strong> {new Set(todaysSlots.map(slot => slot.teacher_name)).size}</p>
                  </div>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPrintModal(false)}>
            Cancel
          </Button>
          <Button variant="outline-primary" onClick={printTable}>
            <i className="fas fa-print me-2"></i>
            Print
          </Button>
          <Button variant="success" onClick={generatePDF}>
            <i className="fas fa-file-pdf me-2"></i>
            Download PDF
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default TodaysSchedule;


