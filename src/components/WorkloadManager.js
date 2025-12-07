import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Tabs, Tab, Alert } from 'react-bootstrap';

const WorkloadManager = ({
  timetableSlots = [],
  teachers = [],
  viewType = 'daily', // 'daily', 'weekly', 'monthly'
  showSubstitutions = false
}) => {
  const [activeTab, setActiveTab] = useState('daily');
  const [workloadData, setWorkloadData] = useState({});

  useEffect(() => {
    calculateWorkload();
  }, [timetableSlots, teachers, viewType]);

  const calculateWorkload = () => {
    const workload = {};

    teachers.forEach(teacher => {
      const teacherSlots = timetableSlots.filter(slot =>
        slot.teacher_name === teacher.name && slot.is_active
      );

      // Daily workload (same for all cases as requested)
      const dailyWorkload = calculateDailyWorkload(teacherSlots);

      // Weekly workload (for substitutions)
      const weeklyWorkload = showSubstitutions ? calculateWeeklyWorkload(teacherSlots) : null;

      // Monthly workload (for substitutions)
      const monthlyWorkload = showSubstitutions ? calculateMonthlyWorkload(teacherSlots) : null;

      workload[teacher.name] = {
        daily: dailyWorkload,
        weekly: weeklyWorkload,
        monthly: monthlyWorkload,
        totalSlots: teacherSlots.length
      };
    });

    setWorkloadData(workload);
  };

  const calculateDailyWorkload = (slots) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dailyCounts = {};

    days.forEach(day => {
      dailyCounts[day] = slots.filter(slot => slot.day === day).length;
    });

    return {
      total: slots.length,
      daily: dailyCounts,
      average: Math.round(slots.length / days.length * 10) / 10
    };
  };

  const calculateWeeklyWorkload = (slots) => {
    // Calculate weekly workload for substitution planning
    const weeks = getWeeksInMonth();
    const weeklyCounts = {};

    weeks.forEach(week => {
      weeklyCounts[week] = slots.filter(slot =>
        isSlotInWeek(slot, week)
      ).length;
    });

    return {
      total: slots.length,
      weekly: weeklyCounts,
      average: Math.round(slots.length / weeks.length * 10) / 10
    };
  };

  const calculateMonthlyWorkload = (slots) => {
    // Calculate monthly workload for substitution planning
    const months = getMonthsInYear();
    const monthlyCounts = {};

    months.forEach(month => {
      monthlyCounts[month] = slots.filter(slot =>
        isSlotInMonth(slot, month)
      ).length;
    });

    return {
      total: slots.length,
      monthly: monthlyCounts,
      average: Math.round(slots.length / months.length * 10) / 10
    };
  };

  const getWeeksInMonth = () => {
    const now = new Date();
    const weeks = [];
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    let currentWeek = 1;
    let currentDate = new Date(firstDay);

    while (currentDate <= lastDay) {
      weeks.push(`Week ${currentWeek}`);
      currentDate.setDate(currentDate.getDate() + 7);
      currentWeek++;
    }

    return weeks;
  };

  const getMonthsInYear = () => {
    return [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
  };

  const isSlotInWeek = (slot, week) => {
    // Simplified week calculation - in real implementation, you'd use actual dates
    return true; // Placeholder
  };

  const isSlotInMonth = (slot, month) => {
    // Simplified month calculation - in real implementation, you'd use actual dates
    return true; // Placeholder
  };

  const getWorkloadStatus = (count, average) => {
    if (count === 0) return { status: 'No Workload', color: 'secondary' };
    if (count < average * 0.7) return { status: 'Under-utilized', color: 'warning' };
    if (count > average * 1.3) return { status: 'Over-utilized', color: 'danger' };
    return { status: 'Optimal', color: 'success' };
  };

  const renderDailyWorkload = () => (
    <Table responsive className="table-hover">
      <thead className="table-dark">
        <tr>
          <th>Teacher</th>
          <th>Total Periods</th>
          <th>Daily Average</th>
          <th>Monday</th>
          <th>Tuesday</th>
          <th>Wednesday</th>
          <th>Thursday</th>
          <th>Friday</th>
          <th>Saturday</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(workloadData).map(([teacherName, data]) => {
          const status = getWorkloadStatus(data.daily.total, data.daily.average);
          return (
            <tr key={teacherName}>
              <td className="fw-bold">{teacherName}</td>
              <td>
                <Badge bg="primary">{data.daily.total}</Badge>
              </td>
              <td>
                <Badge bg="info">{data.daily.average}</Badge>
              </td>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                <td key={day} className="text-center">
                  <Badge bg={data.daily.daily[day] > 0 ? 'success' : 'light'} text="dark">
                    {data.daily.daily[day]}
                  </Badge>
                </td>
              ))}
              <td>
                <Badge bg={status.color}>{status.status}</Badge>
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );

  const renderWeeklyWorkload = () => (
    <Table responsive className="table-hover">
      <thead className="table-dark">
        <tr>
          <th>Teacher</th>
          <th>Total Periods</th>
          <th>Weekly Average</th>
          {getWeeksInMonth().map(week => (
            <th key={week}>{week}</th>
          ))}
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(workloadData).map(([teacherName, data]) => {
          if (!data.weekly) return null;
          const status = getWorkloadStatus(data.weekly.total, data.weekly.average);
          return (
            <tr key={teacherName}>
              <td className="fw-bold">{teacherName}</td>
              <td>
                <Badge bg="primary">{data.weekly.total}</Badge>
              </td>
              <td>
                <Badge bg="info">{data.weekly.average}</Badge>
              </td>
              {getWeeksInMonth().map(week => (
                <td key={week} className="text-center">
                  <Badge bg={data.weekly.weekly[week] > 0 ? 'success' : 'light'} text="dark">
                    {data.weekly.weekly[week]}
                  </Badge>
                </td>
              ))}
              <td>
                <Badge bg={status.color}>{status.status}</Badge>
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );

  const renderMonthlyWorkload = () => (
    <Table responsive className="table-hover">
      <thead className="table-dark">
        <tr>
          <th>Teacher</th>
          <th>Total Periods</th>
          <th>Monthly Average</th>
          {getMonthsInYear().slice(0, 6).map(month => (
            <th key={month}>{month}</th>
          ))}
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(workloadData).map(([teacherName, data]) => {
          if (!data.monthly) return null;
          const status = getWorkloadStatus(data.monthly.total, data.monthly.average);
          return (
            <tr key={teacherName}>
              <td className="fw-bold">{teacherName}</td>
              <td>
                <Badge bg="primary">{data.monthly.total}</Badge>
              </td>
              <td>
                <Badge bg="info">{data.monthly.average}</Badge>
              </td>
              {getMonthsInYear().slice(0, 6).map(month => (
                <td key={month} className="text-center">
                  <Badge bg={data.monthly.monthly[month] > 0 ? 'success' : 'light'} text="dark">
                    {data.monthly.monthly[month]}
                  </Badge>
                </td>
              ))}
              <td>
                <Badge bg={status.color}>{status.status}</Badge>
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );

  const renderWorkloadSummary = () => {
    const totalTeachers = Object.keys(workloadData).length;
    const totalPeriods = Object.values(workloadData).reduce((sum, data) => sum + data.totalSlots, 0);
    const averagePerTeacher = totalTeachers > 0 ? Math.round(totalPeriods / totalTeachers * 10) / 10 : 0;

    return (
      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-primary">
            <Card.Body className="text-center">
              <h3 className="text-primary">{totalTeachers}</h3>
              <small className="text-muted">Total Teachers</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-success">
            <Card.Body className="text-center">
              <h3 className="text-success">{totalPeriods}</h3>
              <small className="text-muted">Total Periods</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-info">
            <Card.Body className="text-center">
              <h3 className="text-info">{averagePerTeacher}</h3>
              <small className="text-muted">Average per Teacher</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-warning">
            <Card.Body className="text-center">
              <h3 className="text-warning">
                {Object.values(workloadData).filter(data =>
                  data.daily.total > data.daily.average * 1.3
                ).length}
              </h3>
              <small className="text-muted">Over-utilized</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    );
  };

  return (
    <div className="workload-manager">
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">
            <i className="fas fa-chart-line me-2"></i>
            Teacher Workload Management
          </h5>
        </Card.Header>
        <Card.Body>
          {renderWorkloadSummary()}

          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
            <Tab eventKey="daily" title="Daily Workload">
              <Alert variant="info" className="mb-3">
                <i className="fas fa-info-circle me-2"></i>
                <strong>Daily Workload:</strong> Shows the same daily distribution for all teachers as requested.
              </Alert>
              {renderDailyWorkload()}
            </Tab>

            {showSubstitutions && (
              <Tab eventKey="weekly" title="Weekly Workload">
                <Alert variant="warning" className="mb-3">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <strong>Weekly Workload:</strong> For substitution planning and weekly analysis.
                </Alert>
                {renderWeeklyWorkload()}
              </Tab>
            )}

            {showSubstitutions && (
              <Tab eventKey="monthly" title="Monthly Workload">
                <Alert variant="warning" className="mb-3">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <strong>Monthly Workload:</strong> For substitution planning and monthly analysis.
                </Alert>
                {renderMonthlyWorkload()}
              </Tab>
            )}
          </Tabs>
        </Card.Body>
      </Card>
    </div>
  );
};

export default WorkloadManager;






