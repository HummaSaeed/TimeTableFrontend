import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Form, Button, Alert, 
  InputGroup, Badge, Spinner, Table 
} from 'react-bootstrap';
import { schoolProfileAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const PeriodTiming = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    period_duration_minutes: 45,
    total_periods_per_day: 8,
    assembly_time: '08:00',
    assembly_duration_minutes: 15,
    break_periods: [],
    period_durations: []
  });

  const [periodTimingInfo, setPeriodTimingInfo] = useState(null);

  useEffect(() => {
    fetchPeriodTiming();
    
    // Add keyboard shortcut for quick period addition (Ctrl+Shift+P)
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        addCustomPeriod();
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  const fetchPeriodTiming = async () => {
    try {
      setLoading(true);
      const response = await schoolProfileAPI.getPeriodTiming();
      const data = response.data.data;
      
      setFormData({
        period_duration_minutes: data.period_duration_minutes || 45,
        total_periods_per_day: data.total_periods_per_day || 8,
        assembly_time: data.assembly_time || '08:00',
        assembly_duration_minutes: data.assembly_duration_minutes || 15,
        break_periods: data.break_periods || [],
        period_durations: data.period_durations || []
      });
      
      setPeriodTimingInfo(data.period_timing_info);
    } catch (error) {
      setError('Failed to fetch period timing configuration');
      console.error('Error fetching period timing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value
    }));
  };

  const handleBreakPeriodChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      break_periods: prev.break_periods.map((bp, i) => 
        i === index ? { ...bp, [field]: value } : bp
      )
    }));
  };

  const addBreakPeriod = () => {
    const newPeriod = formData.break_periods.length + 1;
    setFormData(prev => ({
      ...prev,
      break_periods: [...prev.break_periods, { 
        period: newPeriod, 
        duration: 15, 
        name: 'Break Period',
        type: 'break'
      }]
    }));
  };

  const removeBreakPeriod = (index) => {
    setFormData(prev => ({
      ...prev,
      break_periods: prev.break_periods.filter((_, i) => i !== index)
    }));
  };

  const handlePeriodDurationChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      period_durations: prev.period_durations.map((pd, i) => 
        i === index ? { ...pd, [field]: value } : pd
      )
    }));
  };

  const addPeriodDuration = () => {
    const newPeriod = formData.period_durations.length + 1;
    setFormData(prev => ({
      ...prev,
      period_durations: [...prev.period_durations, { 
        period: newPeriod, 
        duration: 45, 
        name: 'Period ' + newPeriod,
        type: 'class' // 'class' or 'break'
      }]
    }));
  };

  const removePeriodDuration = (index) => {
    setFormData(prev => ({
      ...prev,
      period_durations: prev.period_durations.filter((_, i) => i !== index)
    }));
  };

  const addCustomPeriod = () => {
    const newPeriod = formData.period_durations.length + 1;
    setFormData(prev => ({
      ...prev,
      period_durations: [...prev.period_durations, { 
        period: newPeriod, 
        duration: 45, 
        name: 'Custom Period',
        type: 'class'
      }]
    }));
  };

  const addAssemblyPeriod = () => {
    const newPeriod = formData.period_durations.length + 1;
    setFormData(prev => ({
      ...prev,
      period_durations: [...prev.period_durations, { 
        period: newPeriod, 
        duration: 60, 
        name: 'Assembly Period',
        type: 'assembly'
      }]
    }));
  };

  const reorderPeriods = () => {
    setFormData(prev => ({
      ...prev,
      period_durations: prev.period_durations.map((pd, index) => ({
        ...pd,
        period: index + 1
      }))
    }));
  };

  const movePeriodUp = (index) => {
    if (index === 0) return;
    setFormData(prev => {
      const newPeriods = [...prev.period_durations];
      [newPeriods[index], newPeriods[index - 1]] = [newPeriods[index - 1], newPeriods[index]];
      return {
        ...prev,
        period_durations: newPeriods.map((pd, i) => ({ ...pd, period: i + 1 }))
      };
    });
  };

  const movePeriodDown = (index) => {
    if (index === formData.period_durations.length - 1) return;
    setFormData(prev => {
      const newPeriods = [...prev.period_durations];
      [newPeriods[index], newPeriods[index + 1]] = [newPeriods[index + 1], newPeriods[index]];
      return {
        ...prev,
        period_durations: newPeriods.map((pd, i) => ({ ...pd, period: i + 1 }))
      };
    });
  };

  // Validate and fix period numbers
  const validatePeriodNumbers = () => {
    const periods = [...formData.period_durations];
    const sortedPeriods = periods.sort((a, b) => a.period - b.period);
    
    // Check for duplicate period numbers
    const periodNumbers = sortedPeriods.map(p => p.period);
    const duplicates = periodNumbers.filter((num, index) => periodNumbers.indexOf(num) !== index);
    
    if (duplicates.length > 0) {
      // Auto-fix by reassigning sequential numbers
      const fixedPeriods = sortedPeriods.map((pd, index) => ({
        ...pd,
        period: index + 1
      }));
      
      setFormData(prev => ({
        ...prev,
        period_durations: fixedPeriods
      }));
      
      return true; // Fixed
    }
    
    return false; // No issues
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Validate data before submitting
      const validationResult = validatePeriodNumbers();
      if (validationResult) {
        console.log('Period numbers were automatically fixed during validation');
      }

      // Additional validation
      if (formData.period_durations.length === 0) {
        throw new Error('Please add at least one period before saving');
      }

      // Check for duplicate period names
      const periodNames = formData.period_durations.map(p => p.name);
      const duplicateNames = periodNames.filter((name, index) => periodNames.indexOf(name) !== index);
      if (duplicateNames.length > 0) {
        throw new Error('Period names must be unique. Please fix duplicate names.');
      }

      await schoolProfileAPI.updatePeriodTiming(formData);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        fetchPeriodTiming(); // Refresh data
      }, 3000);
    } catch (error) {
      setError(error.response?.data?.error || error.message || 'Failed to update period timing');
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '--:--';
    return timeString.substring(0, 5);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" size="lg" />
        <p className="mt-3">Loading period timing configuration...</p>
      </div>
    );
  }

  return (
    <div className="period-timing-page">
      {/* Header Section */}
      <div className="page-header py-4 mb-4" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        borderRadius: '0 0 2rem 2rem' 
      }}>
        <Container>
          <Row className="align-items-center">
            <Col md={8}>
              <h1 className="text-white fw-bold mb-2">Period Timing Configuration</h1>
              <p className="text-white opacity-75 mb-0">Manage school periods, break times, and assembly schedule</p>
            </Col>
            <Col md={4} className="text-end">
              <Button 
                variant="outline-light" 
                onClick={() => navigate('/school/profile')}
                className="me-2"
              >
                <i className="fas fa-arrow-left me-2"></i>
                Back to Profile
              </Button>
            </Col>
          </Row>
        </Container>
      </div>

      <Container fluid className="px-4">
        {/* Help Note */}
        <Alert variant="info" className="mb-4">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Complete Period Customization:</strong> You can now create your own period structure from scratch! 
          Add assembly periods, class periods, break periods, or any custom periods with your preferred durations. 
          No fixed defaults - build your schedule exactly how you want it.
          <div className="mt-2">
            <Badge bg="info" className="me-2">
              <i className="fas fa-arrows-alt me-1"></i>
              Drag & Drop Reordering
            </Badge>
            <Badge bg="success" className="me-2">
              <i className="fas fa-clock me-1"></i>
              Flexible Durations
            </Badge>
            <Badge bg="warning" className="me-2">
              <i className="fas fa-cog me-1"></i>
              Custom Period Types
            </Badge>
          </div>
        </Alert>

        <Row>
          {/* Configuration Form */}
          <Col lg={6}>
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-transparent border-0 pb-0">
                <h5 className="mb-0 fw-bold">Period Configuration</h5>
              </Card.Header>
              <Card.Body className="p-4">
                {error && (
                  <Alert variant="danger" onClose={() => setError(null)} dismissible>
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert variant="success" onClose={() => setSuccess(false)} dismissible>
                    Period timing configuration updated successfully!
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Period Duration (minutes)</Form.Label>
                        <Form.Control
                          type="number"
                          name="period_duration_minutes"
                          value={formData.period_duration_minutes}
                          onChange={handleChange}
                          min="30"
                          max="120"
                          required
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Total Periods per Day</Form.Label>
                        <Form.Control
                          type="number"
                          name="total_periods_per_day"
                          value={formData.total_periods_per_day}
                          onChange={handleChange}
                          min="1"
                          max="10"
                          required
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Assembly Time</Form.Label>
                        <Form.Control
                          type="time"
                          name="assembly_time"
                          value={formData.assembly_time}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Assembly Duration (minutes)</Form.Label>
                        <Form.Control
                          type="number"
                          name="assembly_duration_minutes"
                          value={formData.assembly_duration_minutes}
                          onChange={handleChange}
                          min="0"
                          max="60"
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Break Periods Configuration */}
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="mb-0 fw-bold">Break Periods</h6>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={addBreakPeriod}
                      >
                        <i className="fas fa-plus me-2"></i>
                        Add Break
                      </Button>
                    </div>

                    {formData.break_periods.map((breakPeriod, index) => (
                      <Card key={index} className="mb-3 border-light">
                        <Card.Body className="p-3">
                          <Row>
                            <Col md={3}>
                              <Form.Group>
                                <Form.Label className="small">Period</Form.Label>
                                <Form.Control
                                  type="number"
                                  value={breakPeriod.period}
                                  onChange={(e) => handleBreakPeriodChange(index, 'period', parseInt(e.target.value))}
                                  min="1"
                                  max={formData.total_periods_per_day}
                                  size="sm"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={3}>
                              <Form.Group>
                                <Form.Label className="small">Duration (min)</Form.Label>
                                <Form.Control
                                  type="number"
                                  value={breakPeriod.duration}
                                  onChange={(e) => handleBreakPeriodChange(index, 'duration', parseInt(e.target.value))}
                                  min="5"
                                  max="60"
                                  size="sm"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={4}>
                              <Form.Group>
                                <Form.Label className="small">Name</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={breakPeriod.name}
                                  onChange={(e) => handleBreakPeriodChange(index, 'name', e.target.value)}
                                  placeholder="e.g., Lunch Break"
                                  size="sm"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={2} className="d-flex align-items-end">
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => removeBreakPeriod(index)}
                                className="w-100"
                              >
                                <i className="fas fa-trash"></i>
                              </Button>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>

                  {/* Period Durations Configuration */}
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="mb-0 fw-bold">Period Durations</h6>
                      <div className="d-flex gap-2">
                        <Button 
                          variant="outline-warning" 
                          size="sm"
                          onClick={reorderPeriods}
                          disabled={formData.period_durations.length === 0}
                          title="Automatically fix period numbers to be sequential"
                        >
                          <i className="fas fa-sort-numeric-up me-2"></i>
                          Reorder
                        </Button>
                        <Button 
                          variant="outline-info" 
                          size="sm"
                          onClick={validatePeriodNumbers}
                          disabled={formData.period_durations.length === 0}
                          title="Check and fix any duplicate period numbers"
                        >
                          <i className="fas fa-check-circle me-2"></i>
                          Validate
                        </Button>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={addAssemblyPeriod}
                        >
                          <i className="fas fa-flag me-2"></i>
                          Add Assembly
                        </Button>
                        <Button 
                          variant="outline-success" 
                          size="sm"
                          onClick={addCustomPeriod}
                        >
                          <i className="fas fa-plus me-2"></i>
                          Add Period
                        </Button>
                        <Button 
                          variant="outline-secondary" 
                          size="sm"
                          onClick={() => {
                            if (window.confirm('This will add 5 default periods. Continue?')) {
                              // Add 5 default periods at once
                              for (let i = 0; i < 5; i++) {
                                addCustomPeriod();
                              }
                            }
                          }}
                          title="Add 5 default periods at once for quick setup"
                        >
                          <i className="fas fa-layer-group me-2"></i>
                          Quick Setup
                        </Button>
                      </div>
                    </div>

                    {formData.period_durations.length === 0 ? (
                      <div className="text-center py-4 text-muted">
                        <i className="fas fa-clock fa-3x mb-3"></i>
                        <p>No periods configured yet.</p>
                        <p className="small">Start by adding periods using the buttons above.</p>
                        <p className="small text-muted">
                          <i className="fas fa-keyboard me-1"></i>
                          Tip: Use Ctrl+Shift+P to quickly add a new period
                        </p>
                      </div>
                    ) : (
                      formData.period_durations.map((periodDuration, index) => (
                        <Card key={index} className="mb-3 border-light">
                          <Card.Body className="p-3">
                            <Row>
                              <Col md={2}>
                                <Form.Group>
                                  <Form.Label className="small">Period</Form.Label>
                                  <Form.Control
                                    type="number"
                                    value={periodDuration.period}
                                    onChange={(e) => handlePeriodDurationChange(index, 'period', parseInt(e.target.value))}
                                    min="1"
                                    max={formData.total_periods_per_day}
                                    size="sm"
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={3}>
                                <Form.Group>
                                  <Form.Label className="small">Duration (min)</Form.Label>
                                  <Form.Control
                                    type="number"
                                    value={periodDuration.duration}
                                    onChange={(e) => handlePeriodDurationChange(index, 'duration', parseInt(e.target.value))}
                                    min="15"
                                    max="120"
                                    size="sm"
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={3}>
                                <Form.Group>
                                  <Form.Label className="small">Type</Form.Label>
                                  <Form.Select
                                    value={periodDuration.type || 'class'}
                                    onChange={(e) => handlePeriodDurationChange(index, 'type', e.target.value)}
                                    size="sm"
                                  >
                                    <option value="class">Class Period</option>
                                    <option value="assembly">Assembly</option>
                                    <option value="break">Break</option>
                                  </Form.Select>
                                </Form.Group>
                              </Col>
                              <Col md={4}>
                                <Form.Group>
                                  <Form.Label className="small">Name</Form.Label>
                                  <Form.Control
                                    type="text"
                                    value={periodDuration.name}
                                    onChange={(e) => handlePeriodDurationChange(index, 'name', e.target.value)}
                                    placeholder="e.g., Assembly Period, Regular Period"
                                    size="sm"
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={3} className="d-flex align-items-end gap-1">
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  onClick={() => movePeriodUp(index)}
                                  disabled={index === 0}
                                  title="Move Up"
                                >
                                  <i className="fas fa-arrow-up"></i>
                                </Button>
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  onClick={() => movePeriodDown(index)}
                                  disabled={index === formData.period_durations.length - 1}
                                  title="Move Down"
                                >
                                  <i className="fas fa-arrow-down"></i>
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => removePeriodDuration(index)}
                                  title="Remove Period"
                                >
                                  <i className="fas fa-trash"></i>
                                </Button>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      ))
                    )}
                  </div>

                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={saving}
                    className="w-100"
                  >
                    {saving ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Updating Configuration...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Update Period Timing
                      </>
                    )}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          {/* Preview and Information */}
          <Col lg={6}>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-transparent border-0 pb-0">
                <h5 className="mb-0 fw-bold">Period Timing Preview</h5>
              </Card.Header>
              <Card.Body className="p-4">
                {periodTimingInfo && (
                  <>
                    {/* Sample Period Times */}
                    <div className="mb-4">
                      <h6 className="fw-bold mb-3">Sample Period Times</h6>
                      <Table striped bordered size="sm">
                        <thead>
                          <tr>
                            <th>Period</th>
                            <th>Start Time</th>
                            <th>End Time</th>
                            <th>Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(periodTimingInfo.sample_period_times).map(([periodKey, timing]) => {
                            const periodNum = periodKey.split('_')[1];
                            const breakPeriod = formData.break_periods.find(bp => bp.period === parseInt(periodNum));
                            
                            return (
                              <tr key={periodKey}>
                                <td className="fw-bold">Period {periodNum}</td>
                                <td>{formatTime(timing.start_time)}</td>
                                <td>{formatTime(timing.end_time)}</td>
                                <td>
                                  {breakPeriod ? (
                                    <Badge bg="warning" text="dark">
                                      {breakPeriod.name}
                                    </Badge>
                                  ) : (
                                    <Badge bg="primary">Class</Badge>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </div>

                    {/* Break Periods Summary */}
                    <div className="mb-3">
                      <h6 className="fw-bold mb-3">Break Periods Summary</h6>
                      <div className="d-flex flex-wrap gap-2">
                        {periodTimingInfo.break_periods_info.map((bp, index) => (
                          <Badge key={index} bg="info" className="px-3 py-2">
                            <div className="fw-bold">{bp.name}</div>
                            <small>Period {bp.period} • {bp.duration} min</small>
                            <div className="small mt-1">
                              {formatTime(bp.start_time)} - {formatTime(bp.end_time)}
                            </div>
                          </Badge>
                        ))}
                      </div>
                    </div>

                                      {/* Period Durations Summary */}
                  <div className="mb-3">
                    <h6 className="fw-bold mb-3">Period Durations Summary</h6>
                    <div className="d-flex flex-wrap gap-2">
                      {formData.period_durations.map((pd, index) => (
                        <Badge key={index} bg="success" className="px-3 py-2">
                          <div className="fw-bold">{pd.name}</div>
                          <small>Period {pd.period} • {pd.duration} min</small>
                        </Badge>
                      ))}
                    </div>
                    
                    {/* Schedule Summary */}
                    {formData.period_durations.length > 0 && (
                      <div className="mt-3 p-3 bg-light rounded">
                        <div className="row text-center">
                          <div className="col-md-3">
                            <div className="fw-bold text-primary">{formData.period_durations.length}</div>
                            <small className="text-muted">Total Periods</small>
                          </div>
                          <div className="col-md-3">
                            <div className="fw-bold text-success">
                              {formData.period_durations.reduce((sum, p) => sum + p.duration, 0)} min
                            </div>
                            <small className="text-muted">Total Duration</small>
                          </div>
                          <div className="col-md-3">
                            <div className="fw-bold text-info">
                              {formData.period_durations.filter(p => p.type === 'class').length}
                            </div>
                            <small className="text-muted">Class Periods</small>
                          </div>
                          <div className="col-md-3">
                            <div className="fw-bold text-warning">
                              {formData.period_durations.filter(p => p.type === 'break').length}
                            </div>
                            <small className="text-muted">Break Periods</small>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  </>
                )}

                {!periodTimingInfo && (
                  <div className="text-center text-muted py-4">
                    <i className="fas fa-clock fa-3x mb-3"></i>
                    <p>Configure period timing to see preview</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Period Schedule Summary */}
        {formData.period_durations.length > 0 && (
          <Row className="mt-4">
            <Col>
              <Card className="border-success">
                <Card.Header className="bg-success text-white">
                  <h6 className="mb-0">
                    <i className="fas fa-calendar-alt me-2"></i>
                    Complete Period Schedule
                  </h6>
                </Card.Header>
                <Card.Body>
                  <div className="row g-3">
                    {formData.period_durations.map((period, index) => (
                      <div key={index} className="col-md-3 col-sm-6">
                        <div className={`p-3 rounded text-center ${
                          period.type === 'assembly' ? 'bg-primary text-white' :
                          period.type === 'break' ? 'bg-warning text-dark' :
                          'bg-light text-dark'
                        }`}>
                          <div className="fw-bold">Period {period.period}</div>
                          <div className="small">{period.name}</div>
                          <div className="small">
                            {period.duration} min
                            {period.type === 'assembly' && <i className="fas fa-flag ms-1"></i>}
                            {period.type === 'break' && <i className="fas fa-coffee ms-1"></i>}
                            {period.type === 'class' && <i className="fas fa-book ms-1"></i>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-center">
                    <small className="text-muted">
                      <i className="fas fa-info-circle me-1"></i>
                      Total: {formData.period_durations.length} periods | 
                      Total Duration: {formData.period_durations.reduce((sum, p) => sum + p.duration, 0)} minutes
                    </small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Help Section */}
        <Row className="mt-4">
          <Col>
            <Card className="border-info">
              <Card.Header className="bg-info text-white">
                <h6 className="mb-0">
                  <i className="fas fa-question-circle me-2"></i>
                  How to Use This System
                </h6>
              </Card.Header>
              <Card.Body>
                <div className="row">
                  <div className="col-md-6">
                    <h6>Getting Started:</h6>
                    <ul className="small">
                      <li>Set your school's start time and total periods per day</li>
                      <li>Add periods using "Add Period" button</li>
                      <li>Configure break periods for recess and lunch</li>
                      <li>Add assembly periods if needed</li>
                    </ul>
                  </div>
                  <div className="col-md-6">
                    <h6>Customization Tips:</h6>
                    <ul className="small">
                      <li>Use the arrow buttons to reorder periods</li>
                      <li>Click "Reorder" to automatically fix period numbers</li>
                      <li>Set different durations for different period types</li>
                      <li>Save your configuration when satisfied</li>
                    </ul>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Next Steps Guide */}
        <Row className="mt-4">
          <Col>
            <Card className="border-success">
              <Card.Header className="bg-success text-white">
                <h6 className="mb-0">
                  <i className="fas fa-lightbulb me-2"></i>
                  Next Steps After Configuration
                </h6>
              </Card.Header>
              <Card.Body>
                <div className="row">
                  <div className="col-md-4">
                    <div className="text-center p-3">
                      <i className="fas fa-users fa-2x text-primary mb-2"></i>
                      <h6>Assign Teachers</h6>
                      <small className="text-muted">Go to Teachers section to assign subjects and specializations</small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="text-center p-3">
                      <i className="fas fa-chalkboard-teacher fa-2x text-success mb-2"></i>
                      <h6>Create Classes</h6>
                      <small className="text-muted">Set up class sections and assign subjects</small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="text-center p-3">
                      <i className="fas fa-calendar-alt fa-2x text-warning mb-2"></i>
                      <h6>Generate Timetable</h6>
                      <small className="text-muted">Use the Timetable section to create your schedule</small>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default PeriodTiming;


