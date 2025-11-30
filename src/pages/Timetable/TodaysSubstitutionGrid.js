import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Table, Button, Badge,
  Alert, Spinner, Form
} from 'react-bootstrap';
import { teachersAPI } from '../../services/api';
import { pdfService } from '../../services/pdfService';

const TodaysSubstitutionGrid = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gridData, setGridData] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dayName, setDayName] = useState('');
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    fetchData();
  }, [date]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await teachersAPI.getTodaysSubstitutionGrid(date);
      const data = response.data;
      
      if (data.success) {
        setGridData(data.grid_data || []);
        setPeriods(data.periods || []);
        setDayName(data.day_name || '');
        setStatistics(data.statistics || null);
      } else {
        setError(data.error || 'Failed to fetch substitution grid');
      }
    } catch (error) {
      console.error('Error fetching substitution grid:', error);
      setError(error.response?.data?.error || 'Failed to fetch substitution grid');
    } finally {
      setLoading(false);
    }
  };

  const navigateDate = (direction) => {
    const currentDate = new Date(date);
    const newDate = new Date(currentDate);
    
    if (direction === 'prev') {
      newDate.setDate(currentDate.getDate() - 1);
    } else if (direction === 'next') {
      newDate.setDate(currentDate.getDate() + 1);
    }
    
    setDate(newDate.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    setDate(new Date().toISOString().split('T')[0]);
  };

  const downloadPDF = async () => {
    try {
      const result = await pdfService.generateSubstitutionGridPDF(
        gridData,
        periods,
        date,
        dayName,
        statistics
      );
      
      if (result.success) {
        pdfService.downloadPDF(result.data, result.filename);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF. Please try again.');
    }
  };

  const printGrid = () => {
    const printWindow = window.open('', '_blank');
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Substitution Grid - ${dayName}, ${new Date(date).toLocaleDateString()}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px;
              font-size: 12px;
            }
            .header { 
              text-align: center; 
              margin-bottom: 20px;
              border-bottom: 2px solid #dc3545;
              padding-bottom: 10px;
            }
            .header h1 { 
              color: #dc3545; 
              margin: 0 0 10px 0;
              font-size: 24px;
            }
            .header p { 
              margin: 5px 0; 
              color: #666; 
            }
            .stats {
              background: #f8f9fa;
              padding: 10px;
              margin: 15px 0;
              border-radius: 5px;
              display: flex;
              justify-content: space-around;
            }
            .stat-item {
              text-align: center;
            }
            .stat-value {
              font-size: 24px;
              font-weight: bold;
              color: #dc3545;
            }
            .stat-label {
              font-size: 12px;
              color: #666;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 8px; 
              text-align: left;
              vertical-align: top;
            }
            th { 
              background-color: #dc3545; 
              color: white; 
              font-weight: bold;
              text-align: center;
            }
            .teacher-col {
              background-color: #f8f9fa;
              font-weight: bold;
              width: 150px;
            }
            .period-cell {
              min-height: 60px;
            }
            .class-info {
              font-weight: bold;
              color: #0066cc;
              margin-bottom: 3px;
            }
            .subject-info {
              color: #666;
              margin-bottom: 3px;
            }
            .substitute-info {
              color: #28a745;
              font-weight: bold;
            }
            .no-substitute {
              color: #dc3545;
              font-weight: bold;
              background-color: #ffe6e6;
              padding: 2px 5px;
              border-radius: 3px;
            }
            .free-period {
              color: #999;
              text-align: center;
              font-style: italic;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              color: #666;
              font-size: 10px;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
              @page { size: landscape; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Substitution Grid</h1>
            <p><strong>${dayName}, ${new Date(date).toLocaleDateString()}</strong></p>
            <p>Total Absent Teachers: ${gridData.length}</p>
          </div>
          
          ${statistics ? `
            <div class="stats">
              <div class="stat-item">
                <div class="stat-value">${statistics.total_periods_to_substitute}</div>
                <div class="stat-label">Total Periods</div>
              </div>
              <div class="stat-item">
                <div class="stat-value" style="color: #28a745;">${statistics.substituted_periods}</div>
                <div class="stat-label">Substituted</div>
              </div>
              <div class="stat-item">
                <div class="stat-value" style="color: #dc3545;">${statistics.unsubstituted_periods}</div>
                <div class="stat-label">Unsubstituted</div>
              </div>
            </div>
          ` : ''}
          
          <table>
            <thead>
              <tr>
                <th class="teacher-col">Teacher (Absent)</th>
                ${periods.map(p => `<th>Period ${p}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
              ${gridData.map(row => `
                <tr>
                  <td class="teacher-col">
                    ${row.teacher_name}
                    ${row.reason ? `<br><small style="color: #666;">${row.reason}</small>` : ''}
                    </td>
                  ${periods.map(period => {
                    const periodData = row.periods[period];
                    if (periodData && periodData.has_class) {
                      return `
                        <td class="period-cell">
                          <div class="class-info">${periodData.class_name}</div>
                          <div class="subject-info">${periodData.subject_name}</div>
                          ${periodData.room_number ? `<div class="subject-info">Room: ${periodData.room_number}</div>` : ''}
                          ${periodData.substitute_teacher 
                            ? `<div class="substitute-info">→ ${periodData.substitute_teacher}</div>`
                            : `<div class="no-substitute">NO SUBSTITUTE</div>`
                          }
                        </td>
                      `;
                    } else {
                      return `<td class="period-cell free-period">Free</td>`;
                    }
                  }).join('')}
                  </tr>
              `).join('')}
              </tbody>
          </table>
          
          <div class="footer">
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <Spinner animation="border" className="mb-3" />
          <h5>Loading Substitution Grid...</h5>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h2>Substitution Grid</h2>
          <p className="text-muted">
            View absent teachers and their scheduled periods with substitutes
          </p>
        </Col>
        <Col xs="auto">
          <div className="d-flex gap-2">
            <Button onClick={() => navigateDate('prev')} variant="outline-secondary" size="sm">
              <i className="fas fa-chevron-left"></i>
            </Button>
            <Button onClick={goToToday} variant="outline-primary" size="sm">
              Today
            </Button>
            <Button onClick={() => navigateDate('next')} variant="outline-secondary" size="sm">
              <i className="fas fa-chevron-right"></i>
            </Button>
            <Button onClick={fetchData} variant="outline-success" size="sm">
              <i className="fas fa-sync-alt"></i>
            </Button>
            {gridData.length > 0 && (
              <>
                <Button onClick={printGrid} variant="outline-info" size="sm">
                  <i className="fas fa-print me-1"></i> Print
            </Button>
                <Button onClick={downloadPDF} variant="danger" size="sm">
                  <i className="fas fa-file-pdf me-1"></i> PDF
            </Button>
              </>
            )}
          </div>
        </Col>
      </Row>

      {/* Date Selection */}
      <Row className="mb-3">
        <Col md={4}>
          <Card>
            <Card.Body className="py-2">
              <Form.Group className="mb-0">
                <Form.Label className="mb-1 small">Select Date:</Form.Label>
                <Form.Control
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  size="sm"
                />
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>
        <Col md={8}>
          <Card className="bg-light">
            <Card.Body className="py-2">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-0">
                    {dayName}, {new Date(date).toLocaleDateString()}
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
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      {/* Substitution Grid */}
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
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table bordered hover className="mb-0" style={{ fontSize: '0.9rem' }}>
                <thead className="table-danger">
                  <tr>
                    <th style={{ minWidth: '180px', position: 'sticky', left: 0, backgroundColor: '#dc3545', color: 'white', zIndex: 10 }}>
                      Teacher (Absent)
                    </th>
                    {periods.map(period => (
                      <th key={period} className="text-center" style={{ minWidth: '150px' }}>
                        Period {period}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gridData.map((row, rowIndex) => (
                    <tr key={row.teacher_id}>
                      <td className="fw-bold bg-light" style={{ position: 'sticky', left: 0, zIndex: 5 }}>
                        <div>
                          <i className="fas fa-user-times text-warning me-2"></i>
                          {row.teacher_name}
                        </div>
                        {row.reason && (
                          <small className="text-muted d-block mt-1">
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
                            backgroundColor: periodData.status === 'substituted' ? '#e7f5e7' : '#ffe6e6',
                            verticalAlign: 'top'
                          }}>
            <div>
                              <div className="fw-semibold text-primary small">
                                {periodData.class_name}
                              </div>
                              <div className="text-muted small">
                                {periodData.subject_name}
                              </div>
                              {periodData.room_number && (
                                <div className="text-muted small">
                                  <i className="fas fa-door-open me-1"></i>
                                  {periodData.room_number}
                                </div>
                              )}
                              {periodData.period_start_time && periodData.period_end_time && (
                                <div className="text-muted small">
                                  <i className="fas fa-clock me-1"></i>
                                  {periodData.period_start_time} - {periodData.period_end_time}
            </div>
          )}
                              <hr className="my-1" />
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
        <Row className="mt-3">
          <Col>
            <Card className="border-0 bg-light">
              <Card.Body className="py-2">
                <small className="text-muted">
                  <strong>Legend:</strong>
                  <Badge bg="success" className="ms-2 me-1">Green</Badge> Substituted
                  <Badge bg="danger" className="ms-2 me-1">Red</Badge> No Substitute
                  <Badge bg="secondary" className="ms-2 me-1">Gray</Badge> Free Period
                </small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default TodaysSubstitutionGrid;
