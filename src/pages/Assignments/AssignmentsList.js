import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Alert, Badge, Spinner } from 'react-bootstrap';
import { teachersAPI, subjectsAPI, teacherAssignmentsAPI } from '../../services/api';

const AssignmentsList = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [tRes, sRes, aRes] = await Promise.all([
          teachersAPI.getAll(),
          subjectsAPI.getAll(),
          teacherAssignmentsAPI.getAll(),
        ]);
        setTeachers(tRes.data.results || tRes.data || []);
        setSubjects(sRes.data.results || sRes.data || []);
        setAssignments(aRes.data.results || aRes.data || []);
      } catch (e) {
        setError('Failed to load assignments');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const refreshAssignments = async () => {
    try {
      const aRes = await teacherAssignmentsAPI.getAll();
      setAssignments(aRes.data.results || aRes.data || []);
    } catch (e) {
      // ignore
    }
  };

  const toggleSubject = (subjectId) => {
    setSelectedSubjectIds(prev => prev.includes(subjectId)
      ? prev.filter(id => id !== subjectId)
      : [...prev, subjectId]);
  };

  const createAssignments = async () => {
    if (!selectedTeacherId || selectedSubjectIds.length === 0) {
      setError('Please select a teacher and at least one subject');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      for (const subjectId of selectedSubjectIds) {
        await teacherAssignmentsAPI.create({ teacher: selectedTeacherId, subject: subjectId, is_primary: true });
      }
      setSuccess('Assignments created');
      setSelectedSubjectIds([]);
      await refreshAssignments();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to create assignments');
    } finally {
      setSaving(false);
      setTimeout(() => setSuccess(null), 1200);
    }
  };

  const deleteAssignment = async (id) => {
    try {
      await teacherAssignmentsAPI.delete(id);
      await refreshAssignments();
    } catch (e) {
      setError('Failed to delete assignment');
    }
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <Container fluid className="py-4 px-4">
      {/* Simple Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-2">Teacher Subject Assignments</h2>
              <p className="text-muted mb-0">Map teachers to the subjects they can teach</p>
            </div>
          </div>
        </Col>
      </Row>
      
      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible className="mb-4">{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible className="mb-4">{success}</Alert>}

        <Card className="border-0 shadow-sm mb-4">
          <Card.Header className="bg-transparent border-0 pb-0">
            <h5 className="mb-0 fw-bold">Create Assignments</h5>
          </Card.Header>
          <Card.Body>
            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Teacher</Form.Label>
                  <Form.Select value={selectedTeacherId} onChange={(e) => setSelectedTeacherId(e.target.value)}>
                    <option value="">Select teacher</option>
                    {teachers.filter(t => t.is_active).map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.subject_specialists ? t.subject_specialists.join(', ') : 'Not specified'})</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={8}>
                <Form.Group>
                  <Form.Label>Subjects</Form.Label>
                  <div className="d-flex flex-wrap gap-2">
                    {subjects.filter(s => s.is_active).map(s => (
                      <Form.Check key={s.id} type="checkbox" id={`sub-${s.id}`} label={s.name}
                        checked={selectedSubjectIds.includes(String(s.id)) || selectedSubjectIds.includes(s.id)}
                        onChange={() => toggleSubject(String(s.id))} />
                    ))}
                  </div>
                </Form.Group>
              </Col>
            </Row>
            <div className="mt-3">
              <Button variant="primary" onClick={createAssignments} disabled={saving}>
                {saving ? 'Saving...' : 'Save Assignments'}
              </Button>
            </div>
          </Card.Body>
        </Card>

        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-transparent border-0 pb-0">
            <h5 className="mb-0 fw-bold">Existing Assignments</h5>
          </Card.Header>
          <Card.Body className="p-0">
            <Table responsive hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Teacher</th>
                  <th>Subject</th>
                  <th>Primary</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(a => (
                  <tr key={a.id}>
                    <td>{a.teacher_name}</td>
                    <td><Badge bg="info">{a.subject_name}</Badge></td>
                    <td>{a.is_primary ? 'Yes' : 'No'}</td>
                    <td>
                      <Button variant="outline-danger" size="sm" onClick={() => deleteAssignment(a.id)}>
                        <i className="fas fa-trash"></i>
                      </Button>
                    </td>
                  </tr>
                ))}
                {assignments.length === 0 && (
                  <tr><td colSpan={4} className="text-center text-muted py-4">No assignments yet</td></tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
    </Container>
  );
};

export default AssignmentsList;

