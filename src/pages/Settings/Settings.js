import React, { useState } from 'react';
import { 
  Container, Row, Col, Card, Form, Button, Alert, Spinner, 
  Tabs, Tab, Badge, Table
} from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';

const Settings = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [profileForm, setProfileForm] = useState({
    school_name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    principal_name: '',
    established_year: ''
  });

  const [systemForm, setSystemForm] = useState({
    auto_backup: true,
    email_notifications: true,
    language: 'en',
    timezone: 'UTC'
  });

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSystemSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('System settings updated successfully!');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to update system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <Container fluid className="py-4">
      {/* Simple Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-2">Settings</h2>
              <p className="text-muted mb-0">Manage your account and system preferences</p>
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