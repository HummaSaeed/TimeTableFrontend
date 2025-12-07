import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Table, Button, Badge,
  Alert, Spinner, Modal, Form, Accordion
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

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Get unique classes sorted
  const getUniqueClasses = () => {
    const todaysSlots = getTodaysSlots();
    const classes = new Set();
    todaysSlots.forEach(slot => {
      classes.add(JSON.stringify({
        name: slot.class_name,
        section: slot.class_section
      }));
    });

    return Array.from(classes)
      .map(c => JSON.parse(c))
      .sort((a, b) => {
        if (a.name === b.name) {
          return a.section.localeCompare(b.section);
        }
        return a.name.localeCompare(b.name, undefined, { numeric: true });
      });
  };



  const todaysSlots = getTodaysSlots();
  const periodNumbers = getPeriodNumbers();
  const uniqueClasses = getUniqueClasses();

  const renderMobileView = () => (
    <div className="mt-3">
      {uniqueClasses.length === 0 ? (
        <Alert variant="info" className="text-center">No classes scheduled for today.</Alert>
      ) : (
        <Accordion alwaysOpen>
          {uniqueClasses.map((cls, index) => {
            const classSlots = todaysSlots.filter(s =>
              s.class_name === cls.name && s.class_section === cls.section
            ).sort((a, b) => a.period_number - b.period_number);

            return (
              <Accordion.Item eventKey={index.toString()} key={`${cls.name}-${cls.section}`} className="mb-3 border-0 shadow-sm rounded overflow-hidden">
                <Accordion.Header className="bg-light">
                  <div className="d-flex justify-content-between align-items-center w-100 pe-3">
                    <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: '600', color: '#333' }}>
                      {cls.name}-{cls.section}
                    </span>
                    <Badge bg="success" pill style={{ fontSize: '12px' }}>
                      {classSlots.length} Periods
                    </Badge>
                  </div>
                </Accordion.Header>
                <Accordion.Body className="p-0 bg-white">
                  {classSlots.map((slot, i) => (
                    <div key={i} className="p-3 border-bottom d-flex align-items-center gap-3">
                      <div className="text-center" style={{ minWidth: '60px' }}>
                        <Badge bg="light" text="dark" className="border d-block mb-1" style={{ fontSize: '12px' }}>
                          P-{slot.period_number}
                        </Badge>
                        <small className="text-muted fw-bold" style={{ fontSize: '10px' }}>{slot.room_number || 'Room -'}</small>
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="mb-0 fw-bold text-dark" style={{ fontFamily: 'Poppins, sans-serif' }}>{slot.subject_name}</h6>
                        <small className="text-muted">
                          <i className="fas fa-chalkboard-teacher me-1 text-success"></i> {slot.teacher_name || 'No Teacher'}
                        </small>
                      </div>
                    </div>
                  ))}
                  {classSlots.length === 0 && (
                    <div className="p-4 text-center text-muted small">No periods scheduled for this class today.</div>
                  )}
                </Accordion.Body>
              </Accordion.Item>
            );
          })}
        </Accordion>
      )}
    </div>
  );

  return (
    <Container fluid className="py-4 px-4">
      {/* Header Section */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
          <div style={{ flex: 1, minWidth: '200px' }}>
            <h1 style={{
              fontWeight: '700',
              color: '#333333',
              margin: 0,
              fontFamily: 'Poppins, sans-serif',
              fontSize: '28px'
            }}>
              Today's Schedule
            </h1>
            <p style={{
              color: '#6C757D',
              margin: '4px 0 0 0',
              fontSize: '14px',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: '400'
            }}>
              {schoolProfile?.school_name || 'School'} - {getTodayDayName()}, {new Date(selectedDate).toLocaleDateString()}
            </p>
          </div>
          <div className="d-flex gap-2">
            <Form.Control
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                width: '160px',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '14px',
                borderRadius: '8px',
                border: '1px solid #dee2e6'
              }}
            />
            <Button
              style={{
                background: '#1A6E48',
                border: 'none',
                borderRadius: '8px',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: '500',
                padding: '10px 20px',
                fontSize: '14px',
                whiteSpace: 'nowrap'
              }}
              onClick={() => setShowPrintModal(true)}
            >
              <i className="fas fa-print me-2"></i>
              Print/PDF
            </Button>
          </div>
        </div>
      </div>

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible className="mb-4">{error}</Alert>}

      {/* Summary Cards */}
      <Row className="mb-4 g-3">
        {/* ... (Summary Cards code remains same, omitted for brevity if not changing, but included here for completeness of replacement block if needed, but I will try to reuse if possible. Actually, previous edit replaced the whole block. I will just keep the summary cards as is or assume they are fine. Wait, I need to replace the RETURN statement block primarily.) */}
        <Col md={3}>
          <Card style={{
            background: '#FFFFFF',
            border: 'none',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)'
          }}>
            <Card.Body className="text-center p-3">
              <h3 style={{
                color: '#1A6E48',
                marginBottom: '8px',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: '700',
                fontSize: '28px'
              }}>
                {periodNumbers.length}
              </h3>
              <small style={{
                color: '#6C757D',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '12px',
                fontWeight: '500'
              }}>Total Periods</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card style={{
            background: '#FFFFFF',
            border: 'none',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)'
          }}>
            <Card.Body className="text-center p-3">
              <h3 style={{
                color: '#198754',
                marginBottom: '8px',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: '700',
                fontSize: '28px'
              }}>
                {todaysSlots.length}
              </h3>
              <small style={{
                color: '#6C757D',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '12px',
                fontWeight: '500'
              }}>Total Classes</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card style={{
            background: '#FFFFFF',
            border: 'none',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)'
          }}>
            <Card.Body className="text-center p-3">
              <h3 style={{
                color: '#0dcaf0',
                marginBottom: '8px',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: '700',
                fontSize: '28px'
              }}>
                {new Set(todaysSlots.map(slot => slot.teacher_name)).size}
              </h3>
              <small style={{
                color: '#6C757D',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '12px',
                fontWeight: '500'
              }}>Active Teachers</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card style={{
            background: '#FFFFFF',
            border: 'none',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)'
          }}>
            <Card.Body className="text-center p-3">
              <h3 style={{
                color: '#ffc107',
                marginBottom: '8px',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: '700',
                fontSize: '28px'
              }}>
                {new Set(todaysSlots.map(slot => `${slot.class_name}-${slot.class_section}`)).size}
              </h3>
              <small style={{
                color: '#6C757D',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '12px',
                fontWeight: '500'
              }}>Classes Scheduled</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Today's Schedule Render */}
      {isMobile ? renderMobileView() : (
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
            <h5 style={{
              margin: 0,
              fontFamily: 'Poppins, sans-serif',
              fontWeight: '600',
              color: '#333333',
              fontSize: '18px'
            }}>
              <i className="fas fa-calendar-day me-2" style={{ color: '#1A6E48' }}></i>
              Schedule Matrix for {getTodayDayName()}
            </h5>
          </Card.Header>
          <Card.Body className="p-0" style={{ padding: '24px' }}>
            {todaysSlots.length === 0 ? (
              <div className="text-center py-5">
                <i className="fas fa-calendar-times mb-3" style={{ fontSize: '3rem', color: '#6C757D' }}></i>
                <h5 style={{ color: '#6C757D', fontFamily: 'Poppins, sans-serif' }}>No classes scheduled for today</h5>
                <p style={{ color: '#6C757D', fontFamily: 'Poppins, sans-serif', fontSize: '14px' }}>
                  There are no active timetable slots for {getTodayDayName()}.
                </p>
              </div>
            ) : (

              <div className="table-responsive mt-3 custom-scrollbar">
                <Table bordered hover className="mb-0" style={{ verticalAlign: 'middle' }}>
                  <thead style={{ background: '#212529', color: 'white', borderBottom: 'none' }}>
                    <tr>
                      <th style={{
                        padding: '12px 16px',
                        fontWeight: '500',
                        fontFamily: 'Poppins, sans-serif',
                        minWidth: '100px',
                        position: 'sticky',
                        left: 0,
                        zIndex: 2,
                        backgroundColor: '#212529'
                      }}>
                        Class / Period
                      </th>
                      {periodNumbers.map(periodNum => (
                        <th key={periodNum} style={{
                          padding: '12px 16px',
                          fontWeight: '500',
                          fontFamily: 'Poppins, sans-serif',
                          minWidth: '140px',
                          textAlign: 'center'
                        }}>
                          Period {periodNum}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {uniqueClasses.map((cls, index) => (
                      <tr key={`${cls.name}-${cls.section}`} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{
                          padding: '12px 16px',
                          fontWeight: '600',
                          color: '#1A6E48',
                          position: 'sticky',
                          left: 0,
                          backgroundColor: '#fff',
                          zIndex: 1,
                          borderRight: '1px solid #dee2e6'
                        }}>
                          {cls.name}-{cls.section}
                        </td>
                        {periodNumbers.map(periodNum => {
                          const slot = todaysSlots.find(s =>
                            s.class_name === cls.name &&
                            s.class_section === cls.section &&
                            s.period_number === periodNum
                          );

                          return (
                            <td key={periodNum} style={{ padding: '8px', height: '100px', verticalAlign: 'top' }}>
                              {slot ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <Badge style={{
                                    background: '#E8F5E8',
                                    color: '#1A6E48',
                                    fontFamily: 'Poppins, sans-serif',
                                    fontWeight: '500',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    alignSelf: 'flex-start'
                                  }}>
                                    {slot.subject_name || '-'}
                                  </Badge>
                                  <div style={{
                                    fontWeight: '500',
                                    color: '#333',
                                    fontSize: '12px',
                                    fontFamily: 'Poppins, sans-serif'
                                  }}>
                                    {slot.teacher_name || 'No Teacher'}
                                  </div>
                                  <div style={{
                                    color: '#6C757D',
                                    fontSize: '11px',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}>
                                    <i className="fas fa-map-marker-alt me-1" style={{ fontSize: '10px' }}></i>
                                    {slot.room_number || 'No Room'}
                                  </div>
                                </div>
                              ) : (
                                <div style={{
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#dee2e6'
                                }}>
                                  -
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card >
      )}

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
    </Container >
  );
};

export default TodaysSchedule;


