import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Table, Button, Badge,
  Modal, Form, Alert, InputGroup, Dropdown, Spinner, Tabs, Tab
} from 'react-bootstrap';
import { timetableAPI, classesAPI, teachersAPI, subjectsAPI, schoolProfileAPI, classSubjectAPI, teacherWorkloadAPI } from '../../services/api';
import { pdfService } from '../../services/pdfService';
import { useNavigate } from 'react-router-dom';

const TimetableList = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [schoolProfile, setSchoolProfile] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedDayGrid, setSelectedDayGrid] = useState('Monday');
  const [viewMode, setViewMode] = useState('overview'); // 'overview' | 'teachers' | 'classes' | 'conflicts'
  const [showModal, setShowModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showClassSubjectModal, setShowClassSubjectModal] = useState(false);
  const [showWorkloadModal, setShowWorkloadModal] = useState(false);
  const [formData, setFormData] = useState({
    class_name: '',
    teacher_name: '',
    subject_name: '',
    day: '',
    start_time: '',
    end_time: '',
    room_number: '',
    is_active: true
  });
  const [editingSlot, setEditingSlot] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDay, setFilterDay] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [slotForSub, setSlotForSub] = useState(null);
  const [substituteTeacher, setSubstituteTeacher] = useState('');
  const [selectedClassForSubjects, setSelectedClassForSubjects] = useState(null);
  const [classSubjects, setClassSubjects] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
  const [teacherWorkload, setTeacherWorkload] = useState(null);
  const [deleteAcademicYear, setDeleteAcademicYear] = useState('');
  const [clearTimetableData, setClearTimetableData] = useState({
    academic_year: '',
    confirm: false
  });
  const [availableAcademicYears, setAvailableAcademicYears] = useState([]);

  const navigate = useNavigate();

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
    '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00'
  ];

  const workingDays = Array.isArray(schoolProfile?.working_days) && schoolProfile.working_days.length
    ? schoolProfile.working_days
    : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const periodCount = Number(schoolProfile?.total_periods_per_day) > 0
    ? Number(schoolProfile.total_periods_per_day)
    : Math.max(0, ...timetableSlots.map(s => Number(s.period_number) || 0)) || 8;
  const periodNumbers = Array.from({ length: periodCount }, (_, i) => i + 1);

  // Pre-filter by absent teacher via query string
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const absentTeacher = params.get('absentTeacher');
    if (absentTeacher) {
      setSelectedTeacher(absentTeacher);
    }
  }, []);

  // Helper to prefill and open modal for creating a slot at a grid position
  const openAddSlotAt = ({ day, startTime, endTime, type }) => {
    const base = {
      class_name: type === 'class' ? (selectedClass || '') : '',
      teacher_name: type === 'teacher' ? (selectedTeacher || '') : '',
      subject_name: '',
      day: day,
      start_time: startTime,
      end_time: endTime,
      room_number: '',
      is_active: true
    };
    setEditingSlot(null);
    setFormData(base);
    setShowModal(true);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
    const results = await Promise.allSettled([
      timetableAPI.getAll(),
      classesAPI.getAll(),
      teachersAPI.getAll(),
      subjectsAPI.getAll(),
      schoolProfileAPI.getProfile(),
    ]);

    const [slotsRes, classesRes, teachersRes, subjectsRes, profileRes] = results;

      const getData = (res) => res.status === 'fulfilled' 
        ? (res.value.data?.results || res.value.data || [])
        : [];

      const slotsData = getData(slotsRes);
      const classesData = getData(classesRes);
      const teachersData = getData(teachersRes);
    const subjectsData = getData(subjectsRes);

      setTimetableSlots(Array.isArray(slotsData) ? slotsData : []);
      setClasses(Array.isArray(classesData) ? classesData : []);
      setTeachers(Array.isArray(teachersData) ? teachersData : []);
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
    setSchoolProfile(profileRes.status === 'fulfilled' ? profileRes.value.data : null);

    // Initialize selected day for grids from working days
    if (!selectedDayGrid && (Array.isArray(profileRes.value?.data?.working_days) && profileRes.value.data.working_days.length)) {
      setSelectedDayGrid(profileRes.value.data.working_days[0]);
    }

    // Extract unique academic years from timetable slots
    if (Array.isArray(slotsData)) {
      const academicYears = [...new Set(slotsData.map(slot => slot.academic_year).filter(Boolean))];
      setAvailableAcademicYears(academicYears);
      console.log('Available academic years:', academicYears);
    }

      const allFailed = results.every(r => r.status === 'rejected');
      setError(allFailed ? 'Failed to fetch timetable data' : null);
    } catch (e) {
      // Fallback catch: ensure UI still renders with empty arrays
      setTimetableSlots([]);
      setClasses([]);
      setTeachers([]);
      setSubjects([]);
      setError('Failed to fetch timetable data');
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh academic years list
  const refreshAcademicYears = () => {
    if (Array.isArray(timetableSlots)) {
      const academicYears = [...new Set(timetableSlots.map(slot => slot.academic_year).filter(Boolean))];
      setAvailableAcademicYears(academicYears);
      console.log('Refreshed academic years:', academicYears);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.class_name || !formData.teacher_name || !formData.subject_name || !formData.day || !formData.start_time || !formData.end_time) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Prepare data for backend
      const slotData = {
        class_name: formData.class_name,
        teacher_name: formData.teacher_name,
        subject_name: formData.subject_name,
        day: formData.day,
        start_time: formData.start_time,
        end_time: formData.end_time,
        room_number: formData.room_number || '',
        is_active: formData.is_active,
        // Add required fields for backend
        period_number: 1, // Default period number
        academic_year: deleteAcademicYear || '2024-2025' // Use current academic year
      };

      console.log('Submitting timetable slot:', slotData);

      if (editingSlot) {
        console.log('Updating slot:', editingSlot.id);
        await timetableAPI.update(editingSlot.id, slotData);
      } else {
        console.log('Creating new slot');
        await timetableAPI.create(slotData);
      }

      setShowModal(false);
      setEditingSlot(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error submitting timetable slot:', error);
      setError(error.response?.data?.error || 'Failed to save timetable slot');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (slot) => {
    setEditingSlot(slot);
    setFormData({
      class_name: slot.class_name,
      teacher_name: slot.teacher_name,
      subject_name: slot.subject_name,
      day: slot.day,
      start_time: slot.start_time,
      end_time: slot.end_time,
      room_number: slot.room_number,
      is_active: slot.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (slotId) => {
    if (window.confirm('Are you sure you want to delete this timetable slot?')) {
      try {
        await timetableAPI.delete(slotId);
        fetchData();
      } catch (error) {
        setError('Failed to delete timetable slot');
      }
    }
  };

  const handleActivate = async (slotId, isActive) => {
    try {
      await timetableAPI.update(slotId, { is_active: !isActive });
      fetchData();
    } catch (error) {
      setError('Failed to update slot status');
    }
  };

  const resetForm = () => {
    console.log('Resetting form');
    setFormData({
      class_name: '',
      teacher_name: '',
      subject_name: '',
      day: '',
      start_time: '',
      end_time: '',
      room_number: '',
      is_active: true
    });
  };

  const filteredSlots = timetableSlots.filter(slot => {
    const matchesSearch = slot.class_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         slot.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         slot.subject_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDay = !filterDay || slot.day === filterDay;
    const matchesClass = !filterClass || slot.class_name === filterClass;
    const matchesTeacher = !filterTeacher || slot.teacher_name === filterTeacher;

    return matchesSearch && matchesDay && matchesClass && matchesTeacher;
  });

  // Dashboard-only StatCards removed from Timetable screen

  const TimetableView = ({ data, type }) => {
    const renderTimetableGrid = () => {
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
              {timeSlots.map(timeSlot => {
                const [startTime, endTime] = timeSlot.split('-');
                return (
                  <tr key={timeSlot}>
                    <td className="fw-bold text-center" style={{ backgroundColor: '#f8f9fa' }}>
                      {timeSlot}
                    </td>
                    {days.map(day => {
                      const slot = data.find(s =>
                        s.day === day &&
                        s.start_time === startTime
                      );
                      const isAbsentTeacher = selectedTeacher && slot && slot.teacher_name === selectedTeacher;
                      const cellProps = editMode ? {
                        role: 'button',
                        onClick: () => {
                          if (slot) {
                            handleEdit(slot);
                          } else {
                            openAddSlotAt({ day, startTime, endTime, type });
                          }
                        },
                        style: { cursor: 'pointer' }
                      } : {};
                      return (
                        <td key={`${day}-${timeSlot}`} className="text-center p-2" {...cellProps}>
                          {slot ? (
                            <div className="timetable-slot p-2 rounded"
                                 style={{
                                   backgroundColor: slot.is_active ? '#d4edda' : '#f8d7da',
                                   border: '1px solid #c3e6cb',
                                   position: 'relative'
                                 }}>
                              <div className="fw-bold small">{slot.subject_name}</div>
                              <div className="text-muted small">{slot.teacher_name}</div>
                              <div className="text-muted small">{slot.room_number}</div>
                              {isAbsentTeacher && (
                                <div className="mt-2">
                                  <Button size="sm" variant="warning" onClick={() => openSubstitution(slot)}>
                                    <i className="fas fa-user-exchange me-2"></i>
                                    Assign Substitute
                                  </Button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-muted small">{editMode ? 'Click to add' : '-'}</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      );
    };

    return (
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-transparent border-0 pb-0">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold">
              <i className="fas fa-calendar-alt me-2 text-primary"></i>
              {type === 'class' ? `${selectedClass} Timetable` : `${selectedTeacher} Timetable`}
            </h5>
            <div className="d-flex gap-2">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => downloadTimetablePDF(data, type)}
              >
                <i className="fas fa-download me-2"></i>
                Download PDF
              </Button>
              {selectedTeacher && (
                <Button
                  variant="outline-warning"
                  size="sm"
                  onClick={() => {
                    // Highlight absent teacher by keeping selectedTeacher
                    // No-op, button acts as label
                  }}
                >
                  <i className="fas fa-user-clock me-2"></i>
                  Leave mode: {selectedTeacher}
                </Button>
              )}
            </div>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {renderTimetableGrid()}
        </Card.Body>
      </Card>
    );
  };

  const renderTeachersAggregatedGrid = () => {
    // Build representative slot per (teacher, period), prefer Monday if exists
    const repMap = new Map(); // key: teacher|period -> slot
    for (const s of timetableSlots) {
      const key = `${s.teacher_name}|${s.period_number}`;
      if (!repMap.has(key)) {
        repMap.set(key, s);
      } else {
        const existing = repMap.get(key);
        if (existing.day !== 'Monday' && s.day === 'Monday') {
          repMap.set(key, s);
        }
      }
    }
    
    // Calculate teacher workload
    const teacherWorkloads = {};
    teachers.forEach(teacher => {
      const teacherSlots = timetableSlots.filter(slot => slot.teacher_name === teacher.name);
      teacherWorkloads[teacher.name] = teacherSlots.length;
    });
    
    return (
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-transparent border-0 pb-0">
          <h5 className="mb-0 fw-bold">
            <i className="fas fa-users me-2 text-info"></i>
            Teachers × Periods (Same for all working days)
          </h5>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive bordered hover className="align-middle mb-0" style={{ tableLayout: 'fixed' }}>
            <thead className="table-dark">
              <tr>
                <th style={{ minWidth: 220, background:'#f8f9fa', color:'#212529' }}>Teacher</th>
                <th style={{ background:'#f8f9fa', color:'#212529' }}>Workload</th>
                {periodNumbers.map(p => (
                  <th key={p} className="text-center" style={{ background:'#f8f9fa', color:'#212529' }}>Period {p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teachers.map(t => (
                <tr key={t.id}>
                  <td className="fw-semibold bg-light">{t.name}</td>
                  <td className="text-center bg-light">
                    <Badge 
                      bg={
                        teacherWorkloads[t.name] >= 20 ? 'success' : 
                        teacherWorkloads[t.name] >= 15 ? 'warning' : 'danger'
                      }
                    >
                      {teacherWorkloads[t.name]} periods
                    </Badge>
                  </td>
                  {periodNumbers.map(p => {
                    const slot = repMap.get(`${t.name}|${p}`);
                    return (
                      <td key={p} className="text-center p-2" style={{ verticalAlign:'middle' }}>
                        {slot ? (
                          <div className="small">
                            <div className="fw-semibold text-primary">{slot.class_name}{slot.class_section ? `-${slot.class_section}` : ''}</div>
                            <div className="text-muted">{slot.subject_name || ''}</div>
                          </div>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    );
  };

  const renderClassesAggregatedGrid = () => {
    // Build representative slot per (class, section, period), prefer Monday
    const repMap = new Map(); // key: class|section|period -> slot
    for (const s of timetableSlots) {
      const key = `${s.class_name}|${s.class_section}|${s.period_number}`;
      if (!repMap.has(key)) {
        repMap.set(key, s);
      } else {
        const existing = repMap.get(key);
        if (existing.day !== 'Monday' && s.day === 'Monday') {
          repMap.set(key, s);
        }
      }
    }
    
    // Calculate class subject counts
    const classSubjectCounts = {};
    classes.forEach(cls => {
      const classSlots = timetableSlots.filter(slot => 
        slot.class_name === cls.class_name && slot.class_section === cls.section
      );
      const uniqueSubjects = new Set(classSlots.map(slot => slot.subject_name));
      classSubjectCounts[`${cls.class_name}-${cls.section}`] = uniqueSubjects.size;
    });
    
    return (
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-transparent border-0 pb-0">
          <h5 className="mb-0 fw-bold">
            <i className="fas fa-school me-2 text-success"></i>
            Classes × Periods (Same for all working days)
          </h5>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive bordered hover className="align-middle mb-0" style={{ tableLayout: 'fixed' }}>
            <thead className="table-dark">
              <tr>
                <th style={{ minWidth: 220, background:'#f8f9fa', color:'#212529' }}>Class</th>
                <th style={{ background:'#f8f9fa', color:'#212529' }}>Subjects</th>
                {periodNumbers.map(p => (
                  <th key={p} className="text-center" style={{ background:'#f8f9fa', color:'#212529' }}>Period {p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {classes.map(c => (
                <tr key={c.id}>
                  <td className="fw-semibold bg-light">{c.class_name}{c.section ? `-${c.section}` : ''}</td>
                  <td className="text-center bg-light">
                    <Badge 
                      bg="info"
                      onClick={() => openClassSubjectManagement(c)}
                      style={{ cursor: 'pointer' }}
                      title="Click to manage subjects"
                    >
                      {classSubjectCounts[`${c.class_name}-${c.section}`] || 0} subjects
                    </Badge>
                  </td>
                  {periodNumbers.map(p => {
                    const slot = repMap.get(`${c.class_name}|${c.section}|${p}`);
                    return (
                      <td key={p} className="text-center p-2" style={{ verticalAlign:'middle' }}>
                        {slot ? (
                          <div className="small">
                            <div className="fw-semibold text-primary">{slot.teacher_name}</div>
                            <div className="text-muted">{slot.subject_name || ''}</div>
                          </div>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    );
  };

  const openSubstitution = (slot) => {
    setSlotForSub(slot);
    setSubstituteTeacher('');
    setSubModalOpen(true);
  };

  const assignSubstitution = async () => {
    if (!slotForSub || !substituteTeacher) return;
    try {
      // Update the slot with substitute teacher name
      await timetableAPI.update(slotForSub.id, {
        teacher_name: substituteTeacher,
      });
      setSubModalOpen(false);
      setSlotForSub(null);
      fetchData();
    } catch (e) {
      setError('Failed to assign substitution');
    }
  };

  const handleClearTimetable = async () => {
    if (!clearTimetableData.academic_year.trim()) {
      setError('Please enter an academic year to clear');
      return;
    }
    
    if (!clearTimetableData.confirm) {
      setError('Please confirm that you want to clear the timetable');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Clearing timetable for academic year:', clearTimetableData.academic_year);
      
      const response = await timetableAPI.clearTimetable({ academic_year: clearTimetableData.academic_year });
      console.log('Clear timetable response:', response);
      
      setShowDeleteModal(false);
      setClearTimetableData({ academic_year: '', confirm: false });
      fetchData();
      setError(null);
      // Show success message
      alert(`Successfully cleared ${response.data.deleted_count || 'all'} timetable slots for ${clearTimetableData.academic_year}`);
    } catch (error) {
      console.error('Error clearing timetable:', error);
      console.error('Full error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      
      // Try to get more detailed error information
      let errorMessage = 'Failed to clear timetable';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = JSON.stringify(error.response.data);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(`Error clearing timetable (${error.response?.status || 'Unknown'}): ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const openClassSubjectManagement = async (classObj) => {
    try {
      setSelectedClassForSubjects(classObj);
      const response = await classSubjectAPI.getClassSubjects(classObj.id);
      setClassSubjects(response.data.subjects);
      setAvailableSubjects(response.data.available_subjects);
      setSelectedSubjectIds([]);
      setShowClassSubjectModal(true);
    } catch (error) {
      setError('Failed to load class subjects');
    }
  };

  const handleAddSubjectsToClass = async () => {
    if (selectedSubjectIds.length === 0) {
      setError('Failed to add subjects');
      return;
    }

    try {
      setLoading(true);
      await classSubjectAPI.addSubjectsToClass(selectedClassForSubjects.id, selectedSubjectIds);
      // Refresh the data
      const response = await classSubjectAPI.getClassSubjects(selectedClassForSubjects.id);
      setClassSubjects(response.data.subjects);
      setSelectedSubjectIds([]);
      setError(null);
      alert('Subjects added successfully!');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to add subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSubjectsFromClass = async (subjectIds) => {
    if (subjectIds.length === 0) return;

    try {
      setLoading(true);
      await classSubjectAPI.removeSubjectsFromClass(selectedClassForSubjects.id, subjectIds);
      // Refresh the data
      const response = await classSubjectAPI.getClassSubjects(selectedClassForSubjects.id);
      setClassSubjects(response.data.subjects);
      setError(null);
      alert('Subjects removed successfully!');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to remove subjects');
    } finally {
      setLoading(false);
    }
  };

  const openTeacherWorkloadAnalysis = async () => {
    try {
      setLoading(true);
      const response = await teacherWorkloadAPI.getWorkloadAnalysis();
      setTeacherWorkload(response.data);
      setShowWorkloadModal(true);
    } catch (error) {
      setError('Failed to load teacher workload analysis');
    } finally {
      setLoading(false);
    }
  };

  const checkTimetableConflicts = () => {
    const conflicts = [];
    
    // Check for teacher double-booking
    const teacherSchedule = {};
    timetableSlots.forEach(slot => {
      const key = `${slot.teacher_name}|${slot.day}|${slot.period_number}`;
      if (teacherSchedule[key]) {
        conflicts.push({
          type: 'Teacher Double Booking',
          message: `${slot.teacher_name} is assigned to multiple classes on ${slot.day} Period ${slot.period_number}`,
          severity: 'high',
          slot1: teacherSchedule[key],
          slot2: slot
        });
      } else {
        teacherSchedule[key] = slot;
      }
    });
    
    // Check for class double-booking
    const classSchedule = {};
    timetableSlots.forEach(slot => {
      const key = `${slot.class_name}-${slot.class_section}|${slot.day}|${slot.period_number}`;
      if (classSchedule[key]) {
        conflicts.push({
          type: 'Class Double Booking',
          message: `${slot.class_name}-${slot.class_section} has multiple subjects on ${slot.day} Period ${slot.period_number}`,
          severity: 'high',
          slot1: classSchedule[key],
          slot2: slot
        });
      } else {
        classSchedule[key] = slot;
      }
    });
    
    if (conflicts.length > 0) {
      const conflictMessages = conflicts.map(c => `${c.type}: ${c.message}`).join('\n');
      alert(`Timetable Conflicts Detected:\n\n${conflictMessages}`);
    } else {
      alert('No timetable conflicts detected!');
    }
  };

  const autoFixConflicts = async () => {
    try {
      setLoading(true);
      let attempts = 0;
      const maxAttempts = 50;
      let conflictsRemaining = 1;
      
      while (conflictsRemaining > 0 && attempts < maxAttempts) {
        attempts++;
        
        // Get current conflicts
        const conflicts = [];
        const teacherSchedule = {};
        const classSchedule = {};
        
        timetableSlots.forEach(slot => {
          // Teacher conflicts
          const teacherKey = `${slot.teacher_name}|${slot.day}|${slot.period_number}`;
          if (teacherSchedule[teacherKey]) {
            conflicts.push({
              type: 'Teacher Double Booking',
              slot1: teacherSchedule[teacherKey],
              slot2: slot
            });
          } else {
            teacherSchedule[teacherKey] = slot;
          }
          
          // Class conflicts
          const classKey = `${slot.class_name}-${slot.class_section}|${slot.day}|${slot.period_number}`;
          if (classSchedule[classKey]) {
            conflicts.push({
              type: 'Class Double Booking',
              slot1: classSchedule[classKey],
              slot2: slot
            });
          } else {
            classSchedule[classKey] = slot;
          }
        });
        
        conflictsRemaining = conflicts.length;
        
        if (conflictsRemaining > 0) {
          // Auto-fix one conflict at a time
          const conflict = conflicts[0];
          
          if (conflict.type === 'Teacher Double Booking') {
            // Find an available slot for the conflicting teacher
            const availableSlots = findAvailableSlots(conflict.slot2.teacher_name, conflict.slot2.day);
            if (availableSlots.length > 0) {
              const newSlot = availableSlots[0];
              
              // Prepare complete data for update to avoid validation errors
              const updateData = {
                day: newSlot.day,
                period_number: newSlot.period_number,
                // Keep existing data to avoid validation errors
                class_obj: conflict.slot2.class_obj || conflict.slot2.class_id,
                subject: conflict.slot2.subject || conflict.slot2.subject_id,
                teacher: conflict.slot2.teacher || conflict.slot2.teacher_id,
                period_start_time: conflict.slot2.start_time || conflict.slot2.period_start_time || '08:00',
                period_end_time: conflict.slot2.end_time || conflict.slot2.period_end_time || '09:00',
                is_active: conflict.slot2.is_active !== undefined ? conflict.slot2.is_active : true,
                academic_year: conflict.slot2.academic_year || '2024-2025'
              };
              
              console.log('Updating teacher conflict slot with data:', updateData);
              await timetableAPI.update(conflict.slot2.id, updateData);
            }
          } else if (conflict.type === 'Class Double Booking') {
            // Find an available slot for the conflicting class
            const availableSlots = findAvailableSlotsForClass(conflict.slot2.class_name, conflict.slot2.class_section, conflict.slot2.day);
            if (availableSlots.length > 0) {
              const newSlot = availableSlots[0];
              
              // Prepare complete data for update to avoid validation errors
              const updateData = {
                day: newSlot.day,
                period_number: newSlot.period_number,
                // Keep existing data to avoid validation errors
                class_obj: conflict.slot2.class_obj || conflict.slot2.class_id,
                subject: conflict.slot2.subject || conflict.slot2.subject_id,
                teacher: conflict.slot2.teacher || conflict.slot2.teacher_id,
                period_start_time: conflict.slot2.start_time || conflict.slot2.period_start_time || '08:00',
                period_end_time: conflict.slot2.end_time || conflict.slot2.period_end_time || '09:00',
                is_active: conflict.slot2.is_active !== undefined ? conflict.slot2.is_active : true,
                academic_year: conflict.slot2.academic_year || '2024-2025'
              };
              
              console.log('Updating class conflict slot with data:', updateData);
              await timetableAPI.update(conflict.slot2.id, updateData);
            }
          }
          
          // Refresh data after each fix
          await fetchData();
        }
      }
      
      if (conflictsRemaining === 0) {
        alert(`✅ All conflicts resolved successfully in ${attempts} attempts!`);
        setViewMode('conflicts'); // Show the conflicts view to confirm
      } else {
        alert(`⚠️ Some conflicts could not be resolved automatically. Please resolve manually.`);
      }
    } catch (error) {
      console.error('Error in autoFixConflicts:', error);
      console.error('Full error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      
      // Try to get more detailed error information
      let errorMessage = 'Failed to auto-fix conflicts';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = JSON.stringify(error.response.data);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(`Error auto-fixing conflicts (${error.response?.status || 'Unknown'}): ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const findAvailableSlots = (teacherName, currentDay) => {
    const availableSlots = [];
    const workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    workingDays.forEach(day => {
      if (day !== currentDay) {
        for (let period = 1; period <= periodCount; period++) {
          const isOccupied = timetableSlots.some(slot => 
            slot.teacher_name === teacherName && 
            slot.day === day && 
            slot.period_number === period
          );
          
          if (!isOccupied) {
            availableSlots.push({ day, period_number: period });
          }
        }
      }
    });
    
    return availableSlots;
  };

  const findAvailableSlotsForClass = (className, classSection, currentDay) => {
    const availableSlots = [];
    const workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    workingDays.forEach(day => {
      if (day !== currentDay) {
        for (let period = 1; period <= periodCount; period++) {
          const isOccupied = timetableSlots.some(slot => 
            slot.class_name === className && 
            slot.class_section === classSection && 
            slot.day === day && 
            slot.period_number === period
          );
          
          if (!isOccupied) {
            availableSlots.push({ day, period_number: period });
          }
        }
      }
    });
    
    return availableSlots;
  };

  const downloadTimetablePDF = async (data, type) => {
    try {
      if (type === 'class') {
        const classData = classes.find(cls => cls.class_name === selectedClass);
        const result = await pdfService.generateClassTimetablePDF(classData, data);
        pdfService.downloadPDF(result.data, result.filename);
      } else {
        const teacherData = teachers.find(teacher => teacher.name === selectedTeacher);
        const result = await pdfService.generateTeacherTimetablePDF(teacherData, data);
        pdfService.downloadPDF(result.data, result.filename);
      }
    } catch (error) {
      setError('Failed to download PDF');
    }
  };

  const downloadAllTimetablesPDF = async () => {
    try {
      const result = await pdfService.generateAllTimetablesPDF(classes, teachers, timetableSlots);
      pdfService.downloadPDF(result.data, result.filename);
    } catch (error) {
      setError('Failed to download PDF');
    }
  };

  // New Enhanced View Functions
  const renderSchoolOverview = () => {
    const totalSlots = timetableSlots.length;
    const totalClasses = classes.length;
    const totalTeachers = teachers.length;
    const workingDaysCount = workingDays.length;
    
    return (
      <div className="school-overview">
        {/* Overview Statistics */}
        <Row className="mb-4">
          <Col lg={3} md={6} className="mb-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="text-center">
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle d-inline-block mb-3">
                  <i className="fas fa-calendar-alt fa-2x text-primary"></i>
                </div>
                <h4 className="mb-1 fw-bold">{totalSlots}</h4>
                <p className="text-muted mb-0">Total Periods</p>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="text-center">
                <div className="bg-success bg-opacity-10 p-3 rounded-circle d-inline-block mb-3">
                  <i className="fas fa-users fa-2x text-success"></i>
                </div>
                <h4 className="mb-1 fw-bold">{totalClasses}</h4>
                <p className="text-muted mb-0">Active Classes</p>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="text-center">
                <div className="bg-info bg-opacity-10 p-3 rounded-circle d-inline-block mb-3">
                  <i className="fas fa-chalkboard-teacher fa-2x text-info"></i>
                </div>
                <h4 className="mb-1 fw-bold">{totalTeachers}</h4>
                <p className="text-muted mb-0">Active Teachers</p>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="text-center">
                <div className="bg-warning bg-opacity-10 p-3 rounded-circle d-inline-block mb-3">
                  <i className="fas fa-clock fa-2x text-warning"></i>
                </div>
                <h4 className="mb-1 fw-bold">{workingDaysCount}</h4>
                <p className="text-muted mb-0">Working Days</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Complete School Timetable Grid */}
        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-transparent">
            <h5 className="mb-0">
              <i className="fas fa-school me-2 text-primary"></i>
              Complete School Timetable Overview
            </h5>
            <small className="text-muted">All classes and teachers in one comprehensive view</small>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table className="mb-0">
                <thead className="table-dark">
                  <tr>
                    <th className="border-0 px-3 py-3" style={{ minWidth: '120px' }}>Time/Day</th>
                    {workingDays.map(day => (
                      <th key={day} className="border-0 px-2 py-3 text-center" style={{ minWidth: '200px' }}>
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periodNumbers.map(periodNum => (
                    <tr key={periodNum}>
                      <td className="px-3 py-2 fw-bold bg-light">
                        Period {periodNum}
                      </td>
                      {workingDays.map(day => {
                        const slots = timetableSlots.filter(
                          slot => slot.day === day && slot.period_number === periodNum
                        );
                        
                        return (
                          <td key={`${day}-${periodNum}`} className="px-2 py-2 text-center">
                            {slots.map(slot => (
                              <div key={slot.id} className="mb-1">
                                <Badge 
                                  bg="primary" 
                                  className="d-block text-white small"
                                  style={{ fontSize: '0.75rem' }}
                                >
                                  <div className="fw-bold">{slot.class_name}-{slot.class_section}</div>
                                  <div>{slot.subject_name}</div>
                                  <div className="text-white-50">{slot.teacher_name}</div>
                                </Badge>
                              </div>
                            ))}
                            {slots.length === 0 && (
                              <span className="text-muted small">-</span>
                            )}
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
      </div>
    );
  };

  const renderConflictsView = () => {
    const conflicts = [];
    
    // Check for teacher double-booking
    const teacherSchedule = {};
    timetableSlots.forEach(slot => {
      const key = `${slot.teacher_name}|${slot.day}|${slot.period_number}`;
      if (teacherSchedule[key]) {
        conflicts.push({
          type: 'Teacher Double Booking',
          message: `${slot.teacher_name} is assigned to multiple classes on ${slot.day} Period ${slot.period_number}`,
          severity: 'high',
          slot1: teacherSchedule[key],
          slot2: slot
        });
      } else {
        teacherSchedule[key] = slot;
      }
    });
    
    // Check for class double-booking
    const classSchedule = {};
    timetableSlots.forEach(slot => {
      const key = `${slot.class_name}-${slot.class_section}|${slot.day}|${slot.period_number}`;
      if (classSchedule[key]) {
        conflicts.push({
          type: 'Class Double Booking',
          message: `${slot.class_name}-${slot.class_section} has multiple subjects on ${slot.day} Period ${slot.period_number}`,
          severity: 'high',
          slot1: classSchedule[key],
          slot2: slot
        });
      } else {
        classSchedule[key] = slot;
      }
    });

    return (
      <div className="conflicts-view">
        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-transparent">
            <h5 className="mb-0">
              <i className="fas fa-exclamation-triangle me-2 text-warning"></i>
              Timetable Conflicts & Issues
            </h5>
            <small className="text-muted">
              {conflicts.length > 0 ? `${conflicts.length} conflicts detected` : 'No conflicts found'}
            </small>
          </Card.Header>
          <Card.Body>
            {conflicts.length === 0 ? (
              <div className="text-center py-5">
                <i className="fas fa-check-circle text-success mb-3" style={{ fontSize: '3rem' }}></i>
                <h5 className="text-success">No Conflicts Detected!</h5>
                <p className="text-muted">Your timetable is conflict-free and ready to use.</p>
              </div>
            ) : (
              <div>
                <Alert variant="warning" className="mb-3">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <strong>Action Required:</strong> Please resolve the following conflicts before using the timetable.
                </Alert>
                
                {conflicts.map((conflict, index) => (
                  <Card key={index} className="mb-3 border-warning">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="text-warning mb-2">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            {conflict.type}
                          </h6>
                          <p className="mb-2">{conflict.message}</p>
                          <div className="row">
                            <Col md={6}>
                              <small className="text-muted">Slot 1:</small>
                              <div className="bg-light p-2 rounded">
                                {conflict.slot1.class_name}-{conflict.slot1.class_section} | {conflict.slot1.subject_name} | {conflict.slot1.teacher_name}
                              </div>
                            </Col>
                            <Col md={6}>
                              <small className="text-muted">Slot 2:</small>
                              <div className="bg-light p-2 rounded">
                                {conflict.slot2.class_name}-{conflict.slot2.class_section} | {conflict.slot2.subject_name} | {conflict.slot2.teacher_name}
                              </div>
                            </Col>
                          </div>
                        </div>
                        <Badge bg="danger" className="ms-2">High Priority</Badge>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
                
                <div className="text-center mt-4">
                  <Button 
                    variant="success" 
                    size="lg"
                    onClick={autoFixConflicts}
                    className="me-3"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Auto-Fixing...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-magic me-2"></i>
                        Auto-Fix All Conflicts
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="warning" 
                    size="lg"
                    onClick={() => setViewMode('overview')}
                  >
                    <i className="fas fa-edit me-2"></i>
                    Go to Overview to Fix Manually
                  </Button>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="text-muted">Loading Timetable...</h5>
        </div>
      </div>
    );
  }

  return (
    <div className="timetable-page">
      {/* Header Section */}
      <div className="page-header py-4 mb-4" style={{
        background: 'linear-gradient(135deg, #2d5a27 0%, #4a7c59 100%)',
        borderRadius: '0 0 2rem 2rem'
      }}>
        <Container>
          <Row className="align-items-center">
            <Col md={8}>
              <h1 className="text-white fw-bold mb-2">Timetable Management</h1>
              <p className="text-white opacity-75 mb-0">Manage and view timetables for classes and teachers</p>
            </Col>
            <Col md={4} className="text-end">
              <Button
                variant="outline-light"
                onClick={() => setShowGenerateModal(true)}
                className="me-2"
              >
                <i className="fas fa-magic me-2"></i>
                Generate Timetable
              </Button>
              <Button
                variant="outline-danger"
                onClick={() => setShowDeleteModal(true)}
                className="me-2"
              >
                <i className="fas fa-trash me-2"></i>
                Clear Timetable
              </Button>
              <Button
                variant={editMode ? 'warning' : 'light'}
                onClick={() => setEditMode((v) => !v)}
                className="me-2"
              >
                <i className={`fas fa-${editMode ? 'unlock' : 'lock'} me-2`}></i>
                {editMode ? 'Editing Enabled' : 'Enable Edit'}
              </Button>
              <Button
                variant="light"
                onClick={() => setShowModal(true)}
              >
                <i className="fas fa-plus me-2"></i>
                Add Slot
              </Button>
            </Col>
          </Row>
        </Container>
      </div>

      <Container fluid className="px-4">
        {/* No dashboard cards here */}

        {/* Search and Filters */}
        <Row className="mb-4">
          <Col md={2}>
            <Form.Control
              type="text"
              placeholder="Search timetables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Col>
          <Col md={2}>
            <Form.Select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
            >
              <option value="">All Classes</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.class_name}>{cls.class_name}</option>
              ))}
            </Form.Select>
          </Col>
          <Col md={2}>
            <Form.Select
              value={filterTeacher}
              onChange={(e) => setFilterTeacher(e.target.value)}
            >
              <option value="">All Teachers</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.name}>{teacher.name}</option>
              ))}
            </Form.Select>
          </Col>
          <Col md={3}>
            <div className="d-flex">
              <Form.Select
                value={deleteAcademicYear}
                onChange={(e) => setDeleteAcademicYear(e.target.value)}
                className="me-2"
              >
                <option value="">All Academic Years</option>
                {availableAcademicYears.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Form.Select>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={refreshAcademicYears}
                title="Refresh academic years list"
              >
                <i className="fas fa-sync-alt"></i>
              </Button>
            </div>
          </Col>
          <Col md={4} className="text-end">
            <Button
              variant="outline-primary"
              onClick={downloadAllTimetablesPDF}
              className="me-2"
            >
              <i className="fas fa-download me-2"></i>
              Download All PDF
            </Button>
          </Col>
        </Row>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        {/* Timetable Summary Cards */}
        <Row className="mb-4">
          <Col md={2}>
            <Card className="border-0 shadow-sm text-center">
              <Card.Body>
                <div className="h4 text-primary mb-1">{timetableSlots.length}</div>
                <small className="text-muted">Total Slots</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="border-0 shadow-sm text-center">
              <Card.Body>
                <div className="h4 text-success mb-1">{classes.length}</div>
                <small className="text-muted">Total Classes</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="border-0 shadow-sm text-center">
              <Card.Body>
                <div className="h4 text-info mb-1">{teachers.length}</div>
                <small className="text-muted">Total Teachers</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="border-0 shadow-sm text-center">
              <Card.Body>
                <div className="h4 text-warning mb-1">{subjects.length}</div>
                <small className="text-muted">Total Subjects</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="border-0 shadow-sm text-center">
              <Card.Body>
                <div className="h4 text-secondary mb-1">
                  {teachers.length > 0 ? Math.round(timetableSlots.length / teachers.length) : 0}
                </div>
                <small className="text-muted">Avg Periods/Teacher</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="border-0 shadow-sm text-center">
              <Card.Body>
                <div className="h4 text-dark mb-1">
                  {classes.length > 0 ? Math.round(timetableSlots.length / classes.length) : 0}
                </div>
                <small className="text-muted">Avg Periods/Class</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Day-wise Statistics */}
        <Row className="mb-4">
          <Col md={12}>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-transparent border-0">
                <h6 className="mb-0 fw-bold">
                  <i className="fas fa-calendar-day me-2 text-info"></i>
                  Timetable Distribution by Day
                </h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  {workingDays.map(day => {
                    const daySlots = timetableSlots.filter(slot => slot.day === day);
                    const dayPercentage = timetableSlots.length > 0 ? Math.round((daySlots.length / timetableSlots.length) * 100) : 0;
                    return (
                      <Col md={2} key={day} className="text-center">
                        <div className="h5 text-primary mb-1">{daySlots.length}</div>
                        <small className="text-muted">{day}</small>
                        <div className="mt-2">
                          <div className="progress" style={{ height: '6px' }}>
                            <div 
                              className="progress-bar bg-primary" 
                              style={{ width: `${dayPercentage}%` }}
                            ></div>
                          </div>
                          <small className="text-muted">{dayPercentage}%</small>
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Timetable Tabs */}
        {/* Unified Overall Timetable View */}
        <Row className="mb-3">
          <Col md={3}>
            <Form.Select value={viewMode} onChange={(e) => setViewMode(e.target.value)}>
              <option value="overview">🏫 School Overview</option>
              <option value="teachers">👨‍🏫 Teacher Timetables</option>
              <option value="classes">👥 Class Timetables</option>
              <option value="conflicts">⚠️ Conflicts & Issues</option>
            </Form.Select>
          </Col>
          <Col md={9} className="text-end">
            <Button
              variant="outline-info"
              onClick={openTeacherWorkloadAnalysis}
              className="me-2"
            >
              <i className="fas fa-chart-bar me-2"></i>
              Teacher Workload
            </Button>
            <Button
              variant="outline-success"
              onClick={() => setShowClassSubjectModal(true)}
              className="me-2"
            >
              <i className="fas fa-book me-2"></i>
              Manage Class Subjects
            </Button>
            <Button
              variant="outline-warning"
              onClick={checkTimetableConflicts}
              className="me-2"
            >
              <i className="fas fa-exclamation-triangle me-2"></i>
              Check Conflicts
            </Button>
            <Button
              variant="outline-success"
              onClick={autoFixConflicts}
              className="me-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Auto-Fixing...
                </>
              ) : (
                <>
                  <i className="fas fa-magic me-2"></i>
                  Auto-Fix Conflicts
                </>
              )}
            </Button>
            <Button
              variant="outline-info"
              onClick={() => navigate('/timetable/weekly-workload')}
              className="me-2"
            >
              <i className="fas fa-calendar-week me-2"></i>
              Weekly Workload
            </Button>
            <Button
              variant="outline-secondary"
              onClick={() => navigate('/timetable/substitutions')}
              className="me-2"
            >
              <i className="fas fa-user-exchange me-2"></i>
              Substitutions
            </Button>
            <Button
              variant="outline-primary"
              onClick={downloadAllTimetablesPDF}
              className="me-2"
            >
              <i className="fas fa-download me-2"></i>
              Download All PDF
            </Button>
            <Button
              variant={editMode ? 'warning' : 'outline-secondary'}
              onClick={() => setEditMode((v) => !v)}
            >
              <i className={`fas fa-${editMode ? 'unlock' : 'lock'} me-2`}></i>
              {editMode ? 'Editing Enabled' : 'Enable Edit'}
            </Button>
          </Col>
        </Row>
        <div className="mb-4">
          {viewMode === 'overview' && renderSchoolOverview()}
          {viewMode === 'teachers' && renderTeachersAggregatedGrid()}
          {viewMode === 'classes' && renderClassesAggregatedGrid()}
          {viewMode === 'conflicts' && renderConflictsView()}
        </div>
      </Container>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingSlot ? 'Edit Timetable Slot' : 'Add New Timetable Slot'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Class *</Form.Label>
                  <Form.Select
                    name="class_name"
                    value={formData.class_name}
                    onChange={(e) => setFormData({...formData, class_name: e.target.value})}
                    required
                  >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.class_name}>{cls.class_name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Teacher *</Form.Label>
                  <Form.Select
                    name="teacher_name"
                    value={formData.teacher_name}
                    onChange={(e) => setFormData({...formData, teacher_name: e.target.value})}
                    required
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.name}>{teacher.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Subject *</Form.Label>
                  <Form.Select
                    name="subject_name"
                    value={formData.subject_name}
                    onChange={(e) => setFormData({...formData, subject_name: e.target.value})}
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.name}>{subject.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Day *</Form.Label>
                  <Form.Select
                    name="day"
                    value={formData.day}
                    onChange={(e) => setFormData({...formData, day: e.target.value})}
                    required
                  >
                    <option value="">Select Day</option>
                    {days.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Time *</Form.Label>
                  <Form.Control
                    type="time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>End Time *</Form.Label>
                  <Form.Control
                    type="time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Room Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="room_number"
                    value={formData.room_number}
                    onChange={(e) => setFormData({...formData, room_number: e.target.value})}
                    placeholder="e.g., 101"
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Check
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  label="Active Slot"
                />
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              editingSlot ? 'Update Slot' : 'Add Slot'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

              {/* Generate Timetable Modal */}
        <Modal show={showGenerateModal} onHide={() => setShowGenerateModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Generate Timetable</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>This will automatically generate timetables for all classes and teachers based on available subjects and constraints.</p>
            <Alert variant="info">
              <i className="fas fa-info-circle me-2"></i>
              The generation process will consider teacher availability, subject requirements, and avoid conflicts.
            </Alert>
            <Alert variant="warning">
              <i className="fas fa-exclamation-triangle me-2"></i>
              <strong>Note:</strong> The improved algorithm now calculates optimal teacher workload distribution and assigns periods more evenly.
            </Alert>
            <Form.Group className="mb-3">
              <Form.Label>Academic Year</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., 2024-2025"
                value={deleteAcademicYear}
                onChange={(e) => setDeleteAcademicYear(e.target.value)}
              />
              <Form.Text className="text-muted">
                Leave empty to use default academic year
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowGenerateModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setShowGenerateModal(false);
                navigate('/timetable/generate');
              }}
            >
              <i className="fas fa-magic me-2"></i>
              Generate Timetable
            </Button>
          </Modal.Footer>
        </Modal>

      {/* Substitution Modal */}
      <Modal show={subModalOpen} onHide={() => setSubModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Assign Substitute Teacher</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {slotForSub ? (
            <>
              <div className="mb-3">
                <div className="small text-muted">Slot</div>
                <div className="fw-semibold">
                  {slotForSub.day} {slotForSub.start_time}-{slotForSub.end_time} • {slotForSub.class_name} • {slotForSub.subject_name}
                </div>
              </div>
              <Form.Group className="mb-3">
                <Form.Label>Select Substitute</Form.Label>
                <Form.Select value={substituteTeacher} onChange={(e) => setSubstituteTeacher(e.target.value)}>
                  <option value="">Select a teacher</option>
                  {teachers
                    .filter(t => t.is_active && t.name !== slotForSub.teacher_name)
                    .map(t => (
                      <option key={t.id} value={t.name}>{t.name} ({t.subject_specialist})</option>
                    ))}
                </Form.Select>
              </Form.Group>
            </>
          ) : (
            <div className="text-muted">No slot selected.</div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSubModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={assignSubstitution} disabled={!substituteTeacher}>Assign</Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Timetable Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Clear Timetable</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <i className="fas fa-exclamation-triangle me-2"></i>
            <strong>Warning:</strong> This action will permanently delete all timetable slots for the specified academic year.
          </Alert>
          <Form.Group className="mb-3">
            <Form.Label>Academic Year (Optional)</Form.Label>
            <Form.Select
              value={clearTimetableData.academic_year}
              onChange={(e) => setClearTimetableData({...clearTimetableData, academic_year: e.target.value})}
            >
              <option value="">Clear ALL timetable slots (no filter)</option>
              {availableAcademicYears.map(year => (
                <option key={year} value={year}>
                  {year} ({timetableSlots.filter(slot => slot.academic_year === year).length} slots)
                </option>
              ))}
            </Form.Select>
                      <Form.Text className="text-muted">
            Select a specific academic year to clear, or choose "Clear ALL" to remove all timetable slots.
          </Form.Text>
          
          {/* Academic Year Summary */}
          {availableAcademicYears.length > 0 && (
            <div className="mt-3 p-3 bg-light rounded">
              <h6 className="mb-2">
                <i className="fas fa-info-circle me-2 text-info"></i>
                Academic Year Summary
              </h6>
              <div className="row">
                {availableAcademicYears.map(year => {
                  const slotCount = timetableSlots.filter(slot => slot.academic_year === year).length;
                  return (
                    <div key={year} className="col-md-3 mb-2">
                      <div className="d-flex justify-content-between align-items-center p-2 border rounded">
                        <span className="fw-semibold">{year}</span>
                        <Badge bg="primary">{slotCount} slots</Badge>
                      </div>
                    </div>
                  );
                })}
                <div className="col-md-3 mb-2">
                  <div className="d-flex justify-content-between align-items-center p-2 border rounded">
                    <span className="fw-semibold">Total</span>
                    <Badge bg="success">{timetableSlots.length} slots</Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Form.Group>
          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="I confirm that I want to permanently delete all timetable slots for this academic year"
              checked={clearTimetableData.confirm}
              onChange={(e) => setClearTimetableData({...clearTimetableData, confirm: e.target.checked})}
              required
            />
          </Form.Group>
          <Alert variant="info">
            <i className="fas fa-info-circle me-2"></i>
            <strong>Debug:</strong> Click the test button below to verify the API endpoint is working.
          </Alert>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={async () => {
              try {
                console.log('Testing clear API endpoint...');
                const response = await timetableAPI.clearTimetable({ academic_year: 'TEST' });
                console.log('Clear API test response:', response);
                alert('Clear API endpoint is working!');
              } catch (error) {
                console.error('Clear API test failed:', error);
                alert('Clear API endpoint failed: ' + error.message);
              }
            }}
            className="mb-3"
          >
            <i className="fas fa-vial me-2"></i>
            Test Clear API
          </Button>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
                      <div className="d-flex gap-2">
              <Button 
                variant="danger" 
                onClick={handleClearTimetable} 
                disabled={loading || !clearTimetableData.confirm}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash me-2"></i>
                    Clear Timetable
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline-danger" 
                onClick={async () => {
                  if (window.confirm('Are you sure you want to clear ALL timetable slots? This action cannot be undone.')) {
                    try {
                      setLoading(true);
                      const response = await timetableAPI.clearTimetable({ academic_year: '' });
                      setShowDeleteModal(false);
                      setClearTimetableData({ academic_year: '', confirm: false });
                      fetchData();
                      alert(`Successfully cleared ${response.data.deleted_count || 'all'} timetable slots!`);
                    } catch (error) {
                      setError('Failed to clear all timetables: ' + error.message);
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
                disabled={loading}
                title="Quick clear all timetables without academic year filter"
              >
                <i className="fas fa-bomb me-2"></i>
                Clear ALL
              </Button>
            </div>
        </Modal.Footer>
      </Modal>

             {/* Class Subject Management Modal */}
       <Modal show={showClassSubjectModal} onHide={() => setShowClassSubjectModal(false)} size="lg">
         <Modal.Header closeButton>
           <Modal.Title>Manage Class Subjects</Modal.Title>
         </Modal.Header>
         <Modal.Body>
           <Form.Group className="mb-3">
             <Form.Label>Select Class</Form.Label>
             <Form.Select
               value={selectedClassForSubjects?.id || ''}
               onChange={(e) => {
                 const classId = parseInt(e.target.value);
                 if (classId) {
                   const classObj = classes.find(c => c.id === classId);
                   if (classObj) {
                     openClassSubjectManagement(classObj);
                   }
                 } else {
                   setSelectedClassForSubjects(null);
                   setClassSubjects([]);
                   setAvailableSubjects([]);
                 }
               }}
             >
               <option value="">Choose a class...</option>
               {classes.map(cls => (
                 <option key={cls.id} value={cls.id}>
                   {cls.class_name}-{cls.section}
                 </option>
               ))}
             </Form.Select>
           </Form.Group>
           
           {selectedClassForSubjects ? (
             <>
               <div className="mb-3">
                 <h6>Class: {selectedClassForSubjects.class_name}-{selectedClassForSubjects.section}</h6>
               </div>
              
              <Row>
                <Col md={6}>
                  <h6>Current Subjects</h6>
                  {classSubjects.length > 0 ? (
                    <div className="mb-3">
                      {classSubjects.map(subject => (
                        <div key={subject.id} className="d-flex justify-content-between align-items-center p-2 border rounded mb-2">
                          <span>{subject.name}</span>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => handleRemoveSubjectsFromClass([subject.id])}
                          >
                            <i className="fas fa-times"></i>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted">No subjects assigned to this class.</p>
                  )}
                </Col>
                
                <Col md={6}>
                  <h6>Add New Subjects</h6>
                  <Form.Group className="mb-3">
                    <Form.Label>Select Subjects</Form.Label>
                    <Form.Select
                      multiple
                      value={selectedSubjectIds}
                      onChange={(e) => {
                        const values = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                        setSelectedSubjectIds(values);
                      }}
                    >
                      {availableSubjects
                        .filter(subject => !classSubjects.find(cs => cs.id === subject.id))
                        .map(subject => (
                          <option key={subject.id} value={subject.id}>
                            {subject.name}
                          </option>
                        ))}
                    </Form.Select>
                    <Form.Text className="text-muted">
                      Hold Ctrl/Cmd to select multiple subjects
                    </Form.Text>
                  </Form.Group>
                  <Button
                    variant="success"
                    onClick={handleAddSubjectsToClass}
                    disabled={selectedSubjectIds.length === 0}
                  >
                    <i className="fas fa-plus me-2"></i>
                    Add Selected Subjects
                  </Button>
                </Col>
              </Row>
            </>
          ) : (
            <div className="text-muted">No class selected.</div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowClassSubjectModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Teacher Workload Analysis Modal */}
      <Modal show={showWorkloadModal} onHide={() => setShowWorkloadModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Teacher Workload Analysis</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {teacherWorkload ? (
            <>
              <Row className="mb-4">
                <Col md={12}>
                  <Card className="border-0 bg-light">
                    <Card.Body>
                      <h6>Summary</h6>
                      <Row>
                        <Col md={3}>
                          <div className="text-center">
                            <div className="h4 text-primary">{teacherWorkload.summary.total_teachers}</div>
                            <small className="text-muted">Total Teachers</small>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="text-center">
                            <div className="h4 text-success">{teacherWorkload.summary.average_periods}</div>
                            <small className="text-muted">Avg Periods/Teacher</small>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="text-center">
                            <div className="h4 text-warning">{teacherWorkload.summary.under_utilized}</div>
                            <small className="text-muted">Under-utilized</small>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="text-center">
                            <div className="h4 text-danger">{teacherWorkload.summary.over_utilized}</div>
                            <small className="text-muted">Over-utilized</small>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              <Table responsive bordered hover>
                <thead className="table-dark">
                  <tr>
                    <th>Teacher</th>
                    <th>Subjects</th>
                    <th>Current Periods</th>
                    <th>Max Periods</th>
                    <th>Utilization %</th>
                    <th>Status</th>
                    <th>Deviation from Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {teacherWorkload.analysis.map((teacher, index) => (
                    <tr key={index}>
                      <td className="fw-semibold">{teacher.teacher_name}</td>
                      <td>
                        <small>
                          {teacher.subjects.join(', ')}
                        </small>
                      </td>
                      <td className="text-center">{teacher.current_periods}</td>
                      <td className="text-center">{teacher.max_periods}</td>
                      <td className="text-center">
                        <Badge 
                          bg={
                            teacher.utilization_percentage >= 80 ? 'success' : 
                            teacher.utilization_percentage >= 60 ? 'warning' : 'danger'
                          }
                        >
                          {teacher.utilization_percentage}%
                        </Badge>
                      </td>
                      <td className="text-center">
                        <Badge 
                          bg={
                            teacher.workload_status === 'Optimal' ? 'success' : 
                            teacher.workload_status === 'Under-utilized' ? 'warning' : 'danger'
                          }
                        >
                          {teacher.workload_status}
                        </Badge>
                      </td>
                      <td className="text-center">
                        <span className={
                          Math.abs(teacher.deviation_from_avg) <= 2 ? 'text-success' : 
                          teacher.deviation_from_avg < -2 ? 'text-warning' : 'text-danger'
                        }>
                          {teacher.deviation_from_avg > 0 ? '+' : ''}{teacher.deviation_from_avg}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          ) : (
            <div className="text-center">
              <Spinner animation="border" className="me-2" />
              Loading workload analysis...
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowWorkloadModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TimetableList; 