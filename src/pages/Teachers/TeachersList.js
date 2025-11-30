import React, { useEffect, useState } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Form,
  Modal,
  Badge,
  InputGroup,
  Dropdown,
  Alert,
  Spinner
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { teachersAPI } from '../../services/api';

// TeachersList: preserves desktop table layout; provides an improved mobile-only card view.
const TeachersList = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);

  // Modal / selection states (minimal, safe stubs)
  const [showModal, setShowModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveData, setLeaveData] = useState({ teacher_id: '', start_date: '', reason: '' });
  const [error, setError] = useState(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    onResize();
    fetchTeachers();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      if (teachersAPI && teachersAPI.getAll) {
        const res = await teachersAPI.getAll();
        // API may return { results: [...] } or an array
        setTeachers(res.data?.results ?? res.data ?? res);
      } else {
        setTeachers([]);
      }
    } catch (e) {
      console.error('Failed to fetch teachers', e);
      setError('Failed to fetch teachers');
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = teachers.filter((t) => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (t.name && t.name.toLowerCase().includes(q)) ||
      (t.email && t.email.toLowerCase().includes(q)) ||
      (t.subject_specialists && t.subject_specialists.join(',').toLowerCase().includes(q));
    const matchesStatus =
      filterStatus === 'all' || (filterStatus === 'active' && t.is_active) || (filterStatus === 'inactive' && !t.is_active);
    return matchesSearch && matchesStatus;
  });

  // Basic action handlers (kept simple so desktop behavior is unchanged)
  const handleViewTimetable = (id) => navigate(`/teachers/${id}/timetable`);
  const handleGenerateTimetable = (id) => navigate(`/teachers/${id}/timetable/generate`);
  const handleViewWorkload = (id) => navigate(`/teachers/${id}/workload`);
  const handleManageAssignments = (id) => navigate(`/teachers/${id}/assignments`);
  const handleEdit = (id) => navigate(`/teachers/edit/${id}`);

  const handleDelete = async (id) => {
    try {
      if (teachersAPI && teachersAPI.delete) {
        await teachersAPI.delete(id);
      }
      fetchTeachers();
    } catch (e) {
      setError('Failed to delete teacher');
    }
  };

  const handleActivate = async (id) => {
    try {
      if (teachersAPI && teachersAPI.activate) await teachersAPI.activate(id);
      fetchTeachers();
    } catch (e) {
      setError('Failed to activate teacher');
    }
  };

  const openLeaveModal = (teacher) => {
    setSelectedTeacher(teacher);
    setLeaveData({ teacher_id: teacher.id, start_date: new Date().toISOString().slice(0, 10), reason: '' });
    setShowLeaveModal(true);
  };

  const submitLeave = async () => {
    try {
      setLoading(true);
      const payload = { teacher_id: leaveData.teacher_id, date: leaveData.start_date, reason: leaveData.reason };
      if (teachersAPI && teachersAPI.markAbsent) await teachersAPI.markAbsent(payload);
      setShowLeaveModal(false);
      fetchTeachers();
    } catch (e) {
      setError('Failed to submit leave');
    } finally {
      setLoading(false);
    }
  };

  const TeacherModal = ({ teacher, show, onHide }) => (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Teacher Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {teacher ? (
          <div>
            <p><strong>Name:</strong> {teacher.name}</p>
            <p><strong>Email:</strong> {teacher.email}</p>
            <p><strong>Phone:</strong> {teacher.phone_number || 'N/A'}</p>
          </div>
        ) : (
          <p>No teacher selected</p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );

  return (
    <Container style={{ padding: 16 }}>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
        <div>
          <h2 style={{ margin: 0 }}>Teachers</h2>
          <small style={{ color: '#6c757d' }}>Manage teaching staff</small>
        </div>
        <div className="d-flex gap-2 mt-2 mt-md-0">
          <Button onClick={() => navigate('/teachers/add')}>Add Teacher</Button>
          <Button variant="outline-secondary" onClick={fetchTeachers}>Refresh</Button>
        </div>
      </div>

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

      <Card className="mb-3" style={{ borderRadius: 12 }}>
        <Card.Body>
          <Row className="g-2 align-items-center">
            <Col md={6} xs={12}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="fas fa-search" />
                </InputGroup.Text>
                <Form.Control placeholder="Search teachers by name, email, or subject..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </InputGroup>
            </Col>
            <Col md={3} xs={8}>
              <Form.Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
            </Col>
            <Col md={3} xs={4} className="text-end">
              <small className="text-muted">{filteredTeachers.length} of {teachers.length}</small>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : (
        // Desktop: table view (kept similar to previous layout)
        !isMobile ? (
          <Card>
            <Card.Body>
              <Table responsive hover className="mb-0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Subject Specialist</th>
                    <th>Designation</th>
                    <th>Class Teacher</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.map((teacher) => (
                    <tr key={teacher.id}>
                      <td>{teacher.name}</td>
                      <td>{teacher.email}</td>
                      <td>{teacher.subject_specialists ? teacher.subject_specialists.join(', ') : '—'}</td>
                      <td>{teacher.designation}</td>
                      <td>{teacher.is_class_teacher ? `${teacher.class_teacher_class}-${teacher.class_teacher_section}` : 'Not assigned'}</td>
                      <td><Badge bg={teacher.is_active ? 'success' : 'danger'}>{teacher.is_active ? 'Active' : 'Inactive'}</Badge></td>
                      <td>
                        <Dropdown>
                          <Dropdown.Toggle size="sm">•••</Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item onClick={() => handleViewTimetable(teacher.id)}>View Timetable</Dropdown.Item>
                            <Dropdown.Item onClick={() => handleGenerateTimetable(teacher.id)}>Generate Timetable</Dropdown.Item>
                            <Dropdown.Item onClick={() => handleViewWorkload(teacher.id)}>View Workload</Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item onClick={() => { setSelectedTeacher(teacher); setShowModal(true); }}>View Details</Dropdown.Item>
                            <Dropdown.Item onClick={() => openLeaveModal(teacher)}>Mark Leave</Dropdown.Item>
                            <Dropdown.Item onClick={() => handleEdit(teacher.id)}>Edit</Dropdown.Item>
                            <Dropdown.Divider />
                            {teacher.is_active ? (
                              <Dropdown.Item onClick={() => handleDelete(teacher.id)} className="text-danger">Deactivate</Dropdown.Item>
                            ) : (
                              <Dropdown.Item onClick={() => handleActivate(teacher.id)} className="text-success">Activate</Dropdown.Item>
                            )}
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        ) : (
          // Mobile: improved card list view (mobile-only changes)
          <div className="mobile-card-list">
            {filteredTeachers.map((teacher) => (
              <Card key={teacher.id} className="mb-3">
                <Card.Body>
                  <div className="d-flex justify-content-between">
                    <div>
                      <div style={{ fontWeight: 600 }}>{teacher.name}</div>
                      <div className="text-muted" style={{ fontSize: 13 }}>{teacher.email}</div>
                      <div className="text-muted" style={{ fontSize: 12, marginTop: 6 }}>{teacher.subject_specialists ? teacher.subject_specialists.join(', ') : 'Not specified'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Badge bg={teacher.is_active ? 'success' : 'danger'}>{teacher.is_active ? 'Active' : 'Inactive'}</Badge>
                      <div className="mt-2 d-flex gap-2 flex-column">
                        <Button size="sm" variant="outline-secondary" onClick={() => handleViewTimetable(teacher.id)}>Timetable</Button>
                        <Button size="sm" onClick={() => handleEdit(teacher.id)} style={{ background: 'var(--app-primary)', color: 'white' }}>Edit</Button>
                        <Button size="sm" variant="light" onClick={() => openLeaveModal(teacher)}>Mark Leave</Button>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Leave Modal (mobile + desktop) */}
      <Modal show={showLeaveModal} onHide={() => setShowLeaveModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Mark Leave</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Leave Date</Form.Label>
              <Form.Control type="date" value={leaveData.start_date} onChange={(e) => setLeaveData({ ...leaveData, start_date: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Reason</Form.Label>
              <Form.Control as="textarea" rows={3} value={leaveData.reason} onChange={(e) => setLeaveData({ ...leaveData, reason: e.target.value })} />
            </Form.Group>
          </Form>
          {error && <Alert variant="danger">{error}</Alert>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLeaveModal(false)}>Cancel</Button>
          <Button onClick={submitLeave} style={{ background: 'var(--app-primary)', color: 'white' }}>Submit</Button>
        </Modal.Footer>
      </Modal>

      {/* Teacher details modal (reusable) */}
      <TeacherModal teacher={selectedTeacher} show={showModal} onHide={() => { setShowModal(false); setSelectedTeacher(null); }} />
    </Container>
  );
};

export default TeachersList;