import React from 'react';
import { Table, Badge } from 'react-bootstrap';

const TimetableGrid = ({ 
  days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  timeSlots = [],
  timetableSlots = [],
  schoolProfile = null,
  getSlotForTimeAndDay = () => null,
  showBreakRows = true,
  viewType = 'class' // 'class', 'teacher', 'overview'
}) => {
  
  // Get break configuration from school profile
  const breakPeriods = schoolProfile?.break_periods || [];
  const totalPeriods = schoolProfile?.total_periods_per_day || timeSlots.length;
  
  const renderTimetableGrid = () => {
    if (!showBreakRows) {
      return renderSimpleGrid();
    }
    return renderGridWithBreaks();
  };

  const renderSimpleGrid = () => (
    <div className="timetable-grid">
      <Table responsive className="table-bordered">
        <thead className="table-dark">
          <tr>
            <th style={{ width: '120px' }}>Time</th>
            {days.map(day => (
              <th key={day} className="text-center">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map(timeSlot => (
            <tr key={timeSlot}>
              <td className="fw-bold text-center" style={{ backgroundColor: '#f8f9fa' }}>
                {timeSlot}
              </td>
              {days.map(day => {
                const slot = getSlotForTimeAndDay(timeSlot, day);
                return (
                  <td key={`${day}-${timeSlot}`} className="text-center p-2">
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
        <tr key={`period-${periodNumber}`}>
          <td className="fw-bold text-center" style={{ backgroundColor: '#f8f9fa' }}>
            {timeSlot}
          </td>
          {days.map(day => {
            const slot = getSlotForTimeAndDay(timeSlot, day);
            return (
              <td key={`${day}-${timeSlot}`} className="text-center p-2">
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
            <td className="fw-bold text-center" style={{ backgroundColor: '#fff3cd' }}>
              <i className="fas fa-coffee text-warning me-2"></i>
              {breakPeriod.name}
            </td>
            {days.map(day => (
              <td key={`${day}-break`} 
                  className="break-cell text-center"
                  style={{
                    backgroundColor: '#fff3cd',
                    border: '2px solid #ffeaa7',
                    height: '40px'
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
      <div className="timetable-grid">
        <Table responsive className="table-bordered">
          <thead className="table-dark">
            <tr>
              <th style={{ width: '120px' }}>Time</th>
              {days.map(day => (
                <th key={day} className="text-center">{day}</th>
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
      backgroundColor: slot.is_active ? '#d4edda' : '#f8d7da',
      border: '1px solid #c3e6cb',
      padding: '8px',
      borderRadius: '4px'
    };

    switch (viewType) {
      case 'class':
        return (
          <div className="timetable-slot" style={baseStyle}>
            <div className="fw-bold small">{slot.subject_name}</div>
            <div className="text-muted small">{slot.teacher_name}</div>
            <div className="text-muted small">{slot.room_number}</div>
          </div>
        );
      
      case 'teacher':
        return (
          <div className="timetable-slot" style={baseStyle}>
            <div className="fw-bold small">{slot.subject_name}</div>
            <div className="text-muted small">{slot.class_name}-{slot.class_section}</div>
            <div className="text-muted small">{slot.room_number}</div>
          </div>
        );
      
      case 'overview':
        return (
          <div className="timetable-slot" style={baseStyle}>
            <div className="fw-bold small">{slot.subject_name}</div>
            <div className="text-muted small">
              {slot.teacher_name} → {slot.class_name}-{slot.class_section}
            </div>
            <div className="text-muted small">{slot.room_number}</div>
          </div>
        );
      
      default:
        return (
          <div className="timetable-slot" style={baseStyle}>
            <div className="fw-bold small">{slot.subject_name}</div>
            <div className="text-muted small">{slot.teacher_name}</div>
            <div className="text-muted small">{slot.room_number}</div>
          </div>
        );
    }
  };

  return renderTimetableGrid();
};

export default TimetableGrid;
