import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Button, Form, Badge, 
  Spinner, Alert, Modal, Accordion
} from 'react-bootstrap';
import { defaultSubjectsAPI } from '../../services/api';

const DefaultSubjectsSetup = ({ show, onHide, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [defaultSubjects, setDefaultSubjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (show) {
      fetchDefaultSubjects();
    }
  }, [show]);

  const fetchDefaultSubjects = async () => {
    setLoading(true);
    try {
      const response = await defaultSubjectsAPI.getDefaults();
      setDefaultSubjects(response.data.default_subjects);
      setCategories(['All', ...response.data.categories]);
    } catch (err) {
      setError('Failed to load default subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectToggle = (subject) => {
    setSelectedSubjects(prev => {
      const exists = prev.find(s => s.name === subject.name);
      if (exists) {
        return prev.filter(s => s.name !== subject.name);
      } else {
        return [...prev, subject];
      }
    });
  };

  const handleCategorySelect = (category) => {
    const categorySubjects = defaultSubjects.filter(s => s.category === category);
    const allSelected = categorySubjects.every(subject => 
      selectedSubjects.some(s => s.name === subject.name)
    );

    if (allSelected) {
      // Deselect all from this category
      setSelectedSubjects(prev => 
        prev.filter(s => !categorySubjects.some(cs => cs.name === s.name))
      );
    } else {
      // Select all from this category
      const newSelections = categorySubjects.filter(subject => 
        !selectedSubjects.some(s => s.name === subject.name)
      );
      setSelectedSubjects(prev => [...prev, ...newSelections]);
    }
  };

  const filteredSubjects = defaultSubjects.filter(subject => {
    const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subject.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || subject.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const subjectsByCategory = categories.slice(1).reduce((acc, category) => {
    acc[category] = defaultSubjects.filter(s => s.category === category);
    return acc;
  }, {});

  const handleCreateSubjects = async () => {
    if (selectedSubjects.length === 0) {
      setError('Please select at least one subject');
      return;
    }

    setSaving(true);
    setError('');
    
    try {
      const response = await defaultSubjectsAPI.createSelected(selectedSubjects);
      setSuccess(`Successfully created ${response.data.stats.created} subjects!`);
      
      setTimeout(() => {
        onComplete && onComplete(response.data);
        onHide();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create subjects');
    } finally {
      setSaving(false);
    }
  };

  const quickSelectPresets = {
    'Primary School': ['Mathematics', 'English', 'Science', 'Social Studies', 'Art & Design', 'Physical Education', 'Music'],
    'Secondary School': ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Computer Science'],
    'High School': ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Computer Science', 'Economics', 'Business Studies']
  };

  const handleQuickSelect = (preset) => {
    const presetSubjects = defaultSubjects.filter(subject => 
      quickSelectPresets[preset].includes(subject.name)
    );
    setSelectedSubjects(presetSubjects);
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-book me-2"></i>
          Setup Default Subjects
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Loading default subjects...</p>
          </div>
        ) : (
          <>
            {/* Quick Select Presets */}
            <Card className="mb-4">
              <Card.Header>
                <h6 className="mb-0">
                  <i className="fas fa-magic me-2"></i>
                  Quick Select Presets
                </h6>
              </Card.Header>
              <Card.Body>
                <div className="d-flex gap-2 flex-wrap">
                  {Object.keys(quickSelectPresets).map(preset => (
                    <Button
                      key={preset}
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleQuickSelect(preset)}
                    >
                      {preset}
                    </Button>
                  ))}
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setSelectedSubjects([])}
                  >
                    Clear All
                  </Button>
                </div>
              </Card.Body>
            </Card>

            {/* Search and Filter */}
            <Row className="mb-4">
              <Col md={8}>
                <Form.Control
                  type="text"
                  placeholder="Search subjects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Col>
              <Col md={4}>
                <Form.Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </Form.Select>
              </Col>
            </Row>

            {/* Selected Count */}
            <div className="mb-3">
              <Badge bg="primary" className="fs-6">
                {selectedSubjects.length} subjects selected
              </Badge>
            </div>

            {/* Subjects by Category */}
            <Accordion>
              {Object.entries(subjectsByCategory).map(([category, subjects]) => {
                const filteredCategorySubjects = subjects.filter(subject => {
                  const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                       subject.code.toLowerCase().includes(searchTerm.toLowerCase());
                  return selectedCategory === 'All' || selectedCategory === category ? matchesSearch : false;
                });

                if (filteredCategorySubjects.length === 0) return null;

                const allSelected = filteredCategorySubjects.every(subject => 
                  selectedSubjects.some(s => s.name === subject.name)
                );

                return (
                  <Accordion.Item key={category} eventKey={category}>
                    <Accordion.Header>
                      <div className="d-flex align-items-center justify-content-between w-100 me-3">
                        <span>
                          <i className="fas fa-folder me-2"></i>
                          {category}
                        </span>
                        <div className="d-flex align-items-center gap-2">
                          <Badge bg="secondary">
                            {filteredCategorySubjects.filter(s => selectedSubjects.some(sel => sel.name === s.name)).length}/
                            {filteredCategorySubjects.length}
                          </Badge>
                          <Button
                            size="sm"
                            variant={allSelected ? "success" : "outline-primary"}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCategorySelect(category);
                            }}
                          >
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </Button>
                        </div>
                      </div>
                    </Accordion.Header>
                    <Accordion.Body>
                      <Row>
                        {filteredCategorySubjects.map(subject => {
                          const isSelected = selectedSubjects.some(s => s.name === subject.name);
                          return (
                            <Col md={6} lg={4} key={subject.name} className="mb-2">
                              <Form.Check
                                type="checkbox"
                                id={`subject-${subject.code}`}
                                label={
                                  <div>
                                    <strong>{subject.name}</strong>
                                    <br />
                                    <small className="text-muted">({subject.code})</small>
                                  </div>
                                }
                                checked={isSelected}
                                onChange={() => handleSubjectToggle(subject)}
                              />
                            </Col>
                          );
                        })}
                      </Row>
                    </Accordion.Body>
                  </Accordion.Item>
                );
              })}
            </Accordion>

            {/* Selected Subjects Summary */}
            {selectedSubjects.length > 0 && (
              <Card className="mt-4">
                <Card.Header>
                  <h6 className="mb-0">Selected Subjects ({selectedSubjects.length})</h6>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex flex-wrap gap-2">
                    {selectedSubjects.map(subject => (
                      <Badge
                        key={subject.name}
                        bg="primary"
                        className="px-3 py-2 position-relative"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSubjectToggle(subject)}
                      >
                        {subject.name} ({subject.code})
                        <i className="fas fa-times ms-2"></i>
                      </Badge>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            )}
          </>
        )}
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={saving}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleCreateSubjects}
          disabled={saving || selectedSubjects.length === 0}
        >
          {saving ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Creating Subjects...
            </>
          ) : (
            <>
              <i className="fas fa-plus me-2"></i>
              Create {selectedSubjects.length} Subjects
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DefaultSubjectsSetup;























