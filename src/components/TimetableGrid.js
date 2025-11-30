import React, { useState, useEffect } from 'react';
import { Table, Badge, Card, Row, Col } from 'react-bootstrap';

const TimetableGrid = ({ 
  days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  timeSlots = [],
  timetableSlots = [],
  schoolProfile = null,
  getSlotForTimeAndDay = () => null,
  showBreakRows = true,
  viewType = 'class' // 'class', 'teacher', 'overview'
}) => {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  
  // Get break configuration from school profile
  const breakPeriods = schoolProfile?.break_periods || [];
  const totalPeriods = schoolProfile?.total_periods_per_day || timeSlots.length;
  
  const renderTimetableGrid = () => {
    if (isMobile) {
      return renderMobileView();
    }
    if (!showBreakRows) {
      return renderSimpleGrid();
    }
    return renderGridWithBreaks();
  };

  const renderMobileView = () => (
    <div className="timetable-mobile-view" style={{ padding: '0' }}>
      {/* Mobile Schedule Legend */}
      <div style={{
        background: 'linear-gradient(135deg, #1A6E48 0%, #2d5a27 100%)',
        color: 'white',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '16px',
        fontSize: '13px',
        fontWeight: '500'
      }}>
        <div style={{ marginBottom: '8px' }}>📚 {timeSlots.length} Periods | 📅 {days.length} Working Days</div>
        <div style={{ fontSize: '12px', opacity: 0.9 }}>Swipe horizontally to see more days →</div>
      </div>

      {/* Mobile Timetable - Horizontal Scrollable */}
      <div style={{ 
        overflowX: 'auto', 
        overflowY: 'hidden',
        WebkitOverflowScrolling: 'touch',
        marginBottom: '16px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          minWidth: '900px',
          fontFamily: 'Poppins, sans-serif'
        }}>
          {/* Header Row - Days */}
          <thead>
            <tr style={{ background: '#1A6E48', color: 'white' }}>
              <th style={{
                padding: '12px 10px',
                textAlign: 'center',
                fontWeight: '600',
                fontSize: '13px',
                minWidth: '90px',
                borderRight: '1px solid rgba(255,255,255,0.2)',
                whiteSpace: 'nowrap'
              }}>
                Period
              </th>
              {days.map(day => (
                <th key={day} style={{
                  padding: '12px 8px',
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '13px',
                  minWidth: '140px',
                  borderRight: '1px solid rgba(255,255,255,0.2)',
                  whiteSpace: 'nowrap'
                }}>
                  {day.substring(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          
          {/* Body - Time slots and content */}
          <tbody>
            {timeSlots.map((timeSlot, index) => {
              const periodNumber = index + 1;
              const breakPeriod = breakPeriods.find(bp => bp.period === periodNumber);
              
              return (
                <tr key={`period-${periodNumber}`} style={{ 
                  background: index % 2 === 0 ? '#ffffff' : '#f8f9fa',
                  borderBottom: '1px solid #e9ecef'
                }}>
                  {/* Period Number Column */}
                  <td style={{
                    padding: '10px',
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: '13px',
                    background: '#f0f0f0',
                    minWidth: '70px',
                    borderRight: '1px solid #dee2e6',
                    whiteSpace: 'nowrap',
                    verticalAlign: 'middle'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#1A6E48',
                      marginBottom: '2px'
                    }}>
                      P{periodNumber}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: '#6C757D',
                      whiteSpace: 'nowrap'
                    }}>
                      {timeSlot}
                    </div>
                  </td>
                  
              {/* Days columns */}
                  {days.map(day => {
                    const slot = getSlotForTimeAndDay(timeSlot, day);
                    return (
                      <td key={`${day}-${timeSlot}`} style={{
                        padding: '10px',
                        textAlign: 'center',
                        minWidth: '110px',
                        borderRight: '1px solid #dee2e6',
                        verticalAlign: 'middle',
                        height: '140px'
                      }}>
                        {slot ? (
                          <div style={{
                            background: slot.is_active ? '#d4edda' : '#f8d7da',
                            border: `2px solid ${slot.is_active ? '#28a745' : '#dc3545'}`,
                            borderRadius: '6px',
                            padding: '12px 8px',
                            minHeight: '130px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {/* Subject name - PRIMARY */}
                            <div style={{
                              fontSize: '13px',
                              fontWeight: '700',
                              color: '#1A6E48',
                              lineHeight: '1.3',
                              wordWrap: 'break-word',
                              maxWidth: '95px',
                              minHeight: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {slot.subject_name?.substring(0, 15)}
                            </div>
                            
                            {/* View-specific details */}
                            {viewType === 'class' && (
                              <>
                                <div style={{
                                  fontSize: '11px',
                                  color: '#333333',
                                  fontWeight: '500',
                                  lineHeight: '1.2',
                                  maxWidth: '95px',
                                  wordWrap: 'break-word',
                                  minHeight: '20px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  👨‍🏫 {slot.teacher_name?.substring(0, 12)}
                                </div>
                                <div style={{
                                  fontSize: '10px',
                                  color: '#6C757D',
                                  lineHeight: '1.2',
                                  minHeight: '18px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  🏠 {slot.room_number || 'N/A'}
                                </div>
                              </>
                            )}
                            
                            {viewType === 'teacher' && (
                              <>
                                <div style={{
                                  fontSize: '11px',
                                  color: '#333333',
                                  fontWeight: '500',
                                  lineHeight: '1.2',
                                  maxWidth: '95px',
                                  wordWrap: 'break-word',
                                  minHeight: '20px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  👥 {slot.class_name?.substring(0, 12)}
                                </div>
                                <div style={{
                                  fontSize: '10px',
                                  color: '#6C757D',
                                  lineHeight: '1.2',
                                  minHeight: '18px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  🏠 {slot.room_number || 'N/A'}
                                </div>
                              </>
                            )}
                            
                            {viewType === 'overview' && (
                              <>
                                <div style={{
                                  fontSize: '10px',
                                  color: '#333333',
                                  fontWeight: '500',
                                  lineHeight: '1.1',
                                  maxWidth: '95px',
                                  wordWrap: 'break-word',
                                  minHeight: '18px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  👨‍🏫 {slot.teacher_name?.substring(0, 10)}
                                </div>
                                <div style={{
                                  fontSize: '10px',
                                  color: '#333333',
                                  fontWeight: '500',
                                  lineHeight: '1.1',
                                  maxWidth: '95px',
                                  wordWrap: 'break-word',
                                  minHeight: '18px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  👥 {slot.class_name?.substring(0, 10)}
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <div style={{
                            padding: '8px',
                            color: '#ccc',
                            fontSize: '32px',
                            fontWeight: 'bold'
                          }}>
                            -
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Break periods info - if applicable */}
      {showBreakRows && breakPeriods.length > 0 && (
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          padding: '12px',
          marginTop: '16px',
          fontSize: '12px',
          color: '#856404'
        }}>
          <strong>☕ Break Periods:</strong>
          <div style={{ marginTop: '6px', fontSize: '11px', lineHeight: '1.6' }}>
            {breakPeriods.map(bp => (
              <div key={bp.period}>{bp.name} (after Period {bp.period} • {bp.duration} min)</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderSimpleGrid = () => (
    <div className="timetable-grid" style={{ overflowX: 'auto' }}>
      <Table responsive className="table-bordered">
        <thead className="table-dark">
          <tr>
            <th style={{ width: '180px', minWidth: '180px', padding: '12px 10px', whiteSpace: 'nowrap' }}>Time/Period</th>
            {days.map(day => (
              <th key={day} className="text-center" style={{ minWidth: '180px', width: '180px', padding: '12px' }}>{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map(timeSlot => (
            <tr key={timeSlot} style={{ minHeight: '100px' }}>
              <td className="fw-bold text-center" style={{ 
                backgroundColor: '#f8f9fa',
                padding: '12px 10px',
                minWidth: '180px',
                width: '180px',
                verticalAlign: 'middle',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {timeSlot}
              </td>
              {days.map(day => {
                const slot = getSlotForTimeAndDay(timeSlot, day);
                return (
                  <td key={`${day}-${timeSlot}`} 
                      className="text-center"
                      style={{
                        padding: '12px',
                        minWidth: '180px',
                        width: '180px',
                        verticalAlign: 'middle',
                        minHeight: '100px'
                      }}>
                    {slot ? renderSlotContent(slot, viewType) : (
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

  const renderGridWithBreaks = () => {
    const allRows = [];
    
    timeSlots.forEach((timeSlot, index) => {
      const periodNumber = index + 1;
      
      // Add regular period row
      allRows.push(
        <tr key={`period-${periodNumber}`} style={{ minHeight: '100px' }}>
          <td className="fw-bold text-center" style={{ 
            backgroundColor: '#f8f9fa',
            padding: '12px 10px',
            minWidth: '180px',
            width: '180px',
            verticalAlign: 'middle',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {timeSlot}
          </td>
          {days.map(day => {
            const slot = getSlotForTimeAndDay(timeSlot, day);
            return (
              <td key={`${day}-${timeSlot}`} 
                  className="text-center"
                  style={{
                    padding: '12px',
                    minWidth: '180px',
                    width: '180px',
                    verticalAlign: 'middle',
                    minHeight: '100px'
                  }}>
                {slot ? renderSlotContent(slot, viewType) : (
                  <div className="text-muted small">-</div>
                )}
              </td>
            );
          })}
        </tr>
      );
      
      // Add break row if configured for this period
      const breakPeriod = breakPeriods.find(bp => bp.period === periodNumber);
      if (breakPeriod) {
        allRows.push(
          <tr key={`break-${periodNumber}`} className="break-row">
            <td className="fw-bold text-center" style={{ 
              backgroundColor: '#fff3cd',
              padding: '10px 10px',
              minWidth: '180px',
              width: '180px',
              verticalAlign: 'middle',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              <i className="fas fa-coffee text-warning me-2"></i>
              {breakPeriod.name}
            </td>
            {days.map(day => (
              <td key={`${day}-break`} 
                  className="break-cell text-center"
                  style={{
                    backgroundColor: '#fff3cd',
                    border: '2px solid #ffeaa7',
                    height: '50px',
                    padding: '10px',
                    minWidth: '180px',
                    width: '180px',
                    verticalAlign: 'middle'
                  }}>
                <div className="break-indicator">
                  <span className="text-muted fw-bold">{breakPeriod.duration} min</span>
                </div>
              </td>
            ))}
          </tr>
        );
      }
    });
    
    return (
      <div className="timetable-grid" style={{ overflowX: 'auto' }}>
        <Table responsive className="table-bordered">
          <thead className="table-dark">
            <tr>
              <th style={{ width: '180px', minWidth: '180px', padding: '12px 10px', whiteSpace: 'nowrap' }}>Time/Period</th>
              {days.map(day => (
                <th key={day} className="text-center" style={{ minWidth: '180px', width: '180px', padding: '12px' }}>
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allRows}
          </tbody>
        </Table>
      </div>
    );
  };

  const renderSlotContent = (slot, viewType) => {
    const baseStyle = {
      backgroundColor: slot.is_active ? '#E8F5E9' : '#FFEBEE',
      border: '2px solid ' + (slot.is_active ? '#4CAF50' : '#F44336'),
      padding: '14px 12px',
      borderRadius: '8px',
      minHeight: '90px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '8px',
      textAlign: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      transition: 'all 0.2s ease'
    };

    const subjectStyle = {
      fontWeight: '700',
      fontSize: '14px',
      color: '#1A6E48',
      lineHeight: '1.4',
      wordWrap: 'break-word',
      maxWidth: '100%',
      minHeight: '28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    };

    const detailStyle = {
      fontSize: '12px',
      color: '#424242',
      lineHeight: '1.3',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px'
    };

    const mutedStyle = {
      fontSize: '11px',
      color: '#757575',
      lineHeight: '1.2'
    };

    switch (viewType) {
      case 'class':
        return (
          <div className="timetable-slot" style={baseStyle}>
            <div style={subjectStyle}>
              {slot.subject_name}
            </div>
            <div style={detailStyle}>
              👨‍🏫 {slot.teacher_name}
            </div>
            <div style={mutedStyle}>
              🏠 {slot.room_number}
            </div>
          </div>
        );
      
      case 'teacher':
        return (
          <div className="timetable-slot" style={baseStyle}>
            <div style={subjectStyle}>
              {slot.subject_name}
            </div>
            <div style={detailStyle}>
              👥 {slot.class_name}-{slot.class_section}
            </div>
            <div style={mutedStyle}>
              🏠 {slot.room_number}
            </div>
          </div>
        );
      
      case 'overview':
        return (
          <div className="timetable-slot" style={baseStyle}>
            <div style={subjectStyle}>
              {slot.subject_name}
            </div>
            <div style={{...detailStyle, fontSize: '11px'}}>
              👨‍🏫 {slot.teacher_name}
            </div>
            <div style={{...detailStyle, fontSize: '11px'}}>
              👥 {slot.class_name}-{slot.class_section}
            </div>
            <div style={mutedStyle}>
              🏠 {slot.room_number}
            </div>
          </div>
        );
      
      default:
        return (
          <div className="timetable-slot" style={baseStyle}>
            <div style={subjectStyle}>
              {slot.subject_name}
            </div>
            <div style={detailStyle}>
              {slot.teacher_name}
            </div>
            <div style={mutedStyle}>
              🏠 {slot.room_number}
            </div>
          </div>
        );
    }
  };

  return renderTimetableGrid();
};

export default TimetableGrid;
