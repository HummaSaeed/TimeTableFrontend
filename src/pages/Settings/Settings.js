import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Form, Button, Alert, Spinner,
  Tabs, Tab, Badge, Table
} from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { schoolProfileAPI } from '../../services/api';

const Settings = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [schoolProfile, setSchoolProfile] = useState(null);

  const [profileForm, setProfileForm] = useState({
    school_name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    principal_name: '',
    established_year: ''
  });

  const [timetableForm, setTimetableForm] = useState({
    total_periods_per_day: 8,
    period_duration_minutes: 45,
    school_start_time: '08:00',
    school_end_time: '15:00'
  });

  const [systemForm, setSystemForm] = useState({
    auto_backup: true,
    email_notifications: true,
    language: 'en',
    timezone: 'UTC'
  });

  useEffect(() => {
    fetchSchoolProfile();
  }, []);

  const fetchSchoolProfile = async () => {
    try {
      setLoading(true);
      const response = await schoolProfileAPI.getProfile();
      const data = response.data;
      setSchoolProfile(data);

      // Populate forms with fetched data
      setProfileForm({
        school_name: data.school_name || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        website: data.website || '',
        principal_name: data.principal_name || '',
        established_year: data.established_year || ''
      });

      setTimetableForm({
        total_periods_per_day: data.total_periods_per_day || 8,
        period_duration_minutes: data.period_duration_minutes || 45,
        school_start_time: data.school_start_time || '08:00',
        school_end_time: data.school_end_time || '15:00'
      });

      setSystemForm({
        auto_backup: data.auto_backup ?? true,
        email_notifications: data.email_notifications ?? true,
        language: data.language || 'en',
        timezone: data.timezone || 'UTC'
      });
    } catch (error) {
      console.error('Error fetching school profile:', error);
      setError('Failed to load school profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await schoolProfileAPI.update(profileForm);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(false), 3000);
      await fetchSchoolProfile(); // Refresh data
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleTimetableSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await schoolProfileAPI.update(timetableForm);
      setSuccess('Timetable configuration updated successfully!');
      setTimeout(() => setSuccess(false), 3000);
      await fetchSchoolProfile(); // Refresh data
    } catch (err) {
      console.error('Error updating timetable config:', err);
      setError(err.response?.data?.error || 'Failed to update timetable configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSystemSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await schoolProfileAPI.update(systemForm);
      setSuccess('System settings updated successfully!');
      setTimeout(() => setSuccess(false), 3000);
      await fetchSchoolProfile(); // Refresh data
    } catch (err) {
      console.error('Error updating system settings:', err);
      setError(err.response?.data?.error || 'Failed to update system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (loading && !schoolProfile) {
    return (
      <Container fluid className="py-4">
        <div className="text-center py-5">
          <Spinner animation="border" variant="success" />
          <p className="mt-3 text-muted">Loading settings...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      {/* Simple Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-2">Settings</h2>
              <p className="text-muted mb-0">Manage your school profile and system preferences</p>
            </div>
            <Button
              variant="outline-danger"
              onClick={handleLogout}
            >
              <i className="fas fa-sign-out-alt me-2"></i>
              Logout
            </Button>
          </div>
        </Col>
      </Row>
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible className="mb-4">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" onClose={() => setSuccess(false)} dismissible className="mb-4">
          {success}
        </Alert>
      )}

      <Row>
        <Col lg={8} className="mx-auto">
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-0">
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="border-0"
              >
                {/* Profile Settings */}
                <Tab eventKey="profile" title={
                  <span className="d-flex align-items-center">
                    <i className="fas fa-user me-2"></i>
                    Profile
                  </span>
                }>
                  <div className="p-4">
                    <h5 className="mb-4 text-dark">School Profile</h5>
                    <Form onSubmit={handleProfileSubmit}>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>School Name *</Form.Label>
                            <Form.Control
                              type="text"
                              value={profileForm.school_name}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, school_name: e.target.value }))}
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Principal Name</Form.Label>
                            <Form.Control
                              type="text"
                              value={profileForm.principal_name}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, principal_name: e.target.value }))}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                              type="email"
                              value={profileForm.email}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Phone</Form.Label>
                            <Form.Control
                              type="tel"
                              value={profileForm.phone}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={12}>
                          <Form.Group className="mb-3">
                            <Form.Label>Address</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={3}
                              value={profileForm.address}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Website</Form.Label>
                            <Form.Control
                              type="url"
                              value={profileForm.website}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, website: e.target.value }))}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Established Year</Form.Label>
                            <Form.Control
                              type="number"
                              min="1900"
                              max={new Date().getFullYear()}
                              value={profileForm.established_year}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, established_year: e.target.value }))}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <div className="d-flex justify-content-end mt-4">
                        <Button
                          type="submit"
                          variant="success"
                          disabled={loading}
                          className="px-4"
                        >
                          {loading ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-save me-2"></i>
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    </Form>
                  </div>
                </Tab>

                {/* Timetable Configuration */}
                <Tab eventKey="timetable" title={
                  <span className="d-flex align-items-center">
                    <i className="fas fa-clock me-2"></i>
                    Timetable
                  </span>
                }>
                  <div className="p-4">
                    <h5 className="mb-4 text-dark">Timetable Configuration</h5>
                    <Form onSubmit={handleTimetableSubmit}>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Total Periods Per Day *</Form.Label>
                            <Form.Control
                              type="number"
                              min="4"
                              max="10"
                              value={timetableForm.total_periods_per_day}
                              onChange={(e) => setTimetableForm(prev => ({ ...prev, total_periods_per_day: parseInt(e.target.value) }))}
                              required
                            />
                            <Form.Text className="text-muted">
                              Number of teaching periods per day (4-10)
                            </Form.Text>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Period Duration (Minutes) *</Form.Label>
                            <Form.Control
                              type="number"
                              min="30"
                              max="120"
                              value={timetableForm.period_duration_minutes}
                              onChange={(e) => setTimetableForm(prev => ({ ...prev, period_duration_minutes: parseInt(e.target.value) }))}
                              required
                            />
                            <Form.Text className="text-muted">
                              Duration of each period in minutes (30-120)
                            </Form.Text>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>School Start Time</Form.Label>
                            <Form.Control
                              type="time"
                              value={timetableForm.school_start_time}
                              onChange={(e) => setTimetableForm(prev => ({ ...prev, school_start_time: e.target.value }))}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>School End Time</Form.Label>
                            <Form.Control
                              type="time"
                              value={timetableForm.school_end_time}
                              onChange={(e) => setTimetableForm(prev => ({ ...prev, school_end_time: e.target.value }))}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Alert variant="info" className="mt-3">
                        <i className="fas fa-info-circle me-2"></i>
                        <strong>Note:</strong> Changing the total periods will affect all timetable views, substitution grids, and PDF exports.
                      </Alert>
                      <div className="d-flex justify-content-end mt-4">
                        <Button
                          type="submit"
                          variant="success"
                          disabled={loading}
                          className="px-4"
                        >
                          {loading ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-save me-2"></i>
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    </Form>
                  </div>
                </Tab>

                {/* System Settings */}
                <Tab eventKey="system" title={
                  <span className="d-flex align-items-center">
                    <i className="fas fa-cog me-2"></i>
                    System
                  </span>
                }>
                  <div className="p-4">
                    <h5 className="mb-4 text-dark">System Preferences</h5>
                    <Form onSubmit={handleSystemSubmit}>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Check
                              type="checkbox"
                              label="Auto Backup"
                              checked={systemForm.auto_backup}
                              onChange={(e) => setSystemForm(prev => ({ ...prev, auto_backup: e.target.checked }))}
                            />
                            <Form.Text className="text-muted">
                              Automatically backup data daily
                            </Form.Text>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Check
                              type="checkbox"
                              label="Email Notifications"
                              checked={systemForm.email_notifications}
                              onChange={(e) => setSystemForm(prev => ({ ...prev, email_notifications: e.target.checked }))}
                            />
                            <Form.Text className="text-muted">
                              Send email alerts for important events
                            </Form.Text>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Language</Form.Label>
                            <Form.Select
                              value={systemForm.language}
                              onChange={(e) => setSystemForm(prev => ({ ...prev, language: e.target.value }))}
                            >
                              <option value="en">English</option>
                              <option value="es">Spanish</option>
                              <option value="fr">French</option>
                              <option value="de">German</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Timezone</Form.Label>
                            <Form.Select
                              value={systemForm.timezone}
                              onChange={(e) => setSystemForm(prev => ({ ...prev, timezone: e.target.value }))}
                            >
                              <option value="UTC">UTC</option>
                              <option value="EST">Eastern Time</option>
                              <option value="PST">Pacific Time</option>
                              <option value="GMT">GMT</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>
                      <div className="d-flex justify-content-end mt-4">
                        <Button
                          type="submit"
                          variant="success"
                          disabled={loading}
                          className="px-4"
                        >
                          {loading ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-save me-2"></i>
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    </Form>
                  </div>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Settings; 