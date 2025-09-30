import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://timetableadmin.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_type');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_name');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API - Updated to match your actual backend
export const authAPI = {
  // School registration
  registerSchool: (data) => api.post('/api/register/', data),
  
  // School login
  loginSchool: (data) => api.post('/api/login/', data),
  
  // Teacher login
  loginTeacher: (data) => api.post('/api/teacher/login/', data),
  
  // Password reset
  resetPassword: (data) => {
    console.log('Teacher password reset API call with data:', data);
    return api.post('/api/teacher/password-reset/', data);
  },
  resetSchoolAdminPassword: (data) => {
    console.log('School admin password reset API call with data:', data);
    return api.post('/api/admin/password-reset/', data);
  },
  
  // Logout
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_type');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
  },

  // Legacy methods for compatibility
  login: (credentials) => api.post('/api/login/', credentials),
  register: (userData) => api.post('/api/register/', userData),
  refreshToken: () => api.post('/api/token/refresh/'),
  getProfile: () => api.get('/api/auth/profile/'),
};

// School Profile API
export const schoolProfileAPI = {
  getProfile: () => api.get('/api/school-profile/'),
  updateProfile: (data) => api.put('/api/school-profile/', data),
  createProfile: (data) => api.post('/api/school-profile/', data),
  get: () => api.get('/api/school-profile/'),
  update: (data) => api.put('/api/school-profile/', data),
  patch: (data) => api.patch('/api/school-profile/', data),
};

// Teachers API
export const teachersAPI = {
  getAll: (params) => api.get('/api/teachers/', { params }),
  getById: (id) => api.get(`/api/teachers/${id}/`),
  create: (data) => api.post('/api/teachers/', data),
  update: (id, data) => api.put(`/api/teachers/${id}/`, data),
  delete: (id) => api.delete(`/api/teachers/${id}/`),
  activate: (id) => api.put(`/api/teachers/${id}/activate/`),
  getStats: () => api.get('/api/teachers/stats/'),
  getWorkload: (params) => api.get('/api/teachers/workload/', { params }),
  markAbsent: (data) => api.post('/api/teachers/absent/', data),
  getTimetable: (id) => api.get(`/api/teachers/${id}/timetable/`),
};

// Classes API
export const classesAPI = {
  getAll: (params) => api.get('/api/classes/', { params }),
  getById: (id) => api.get(`/api/classes/${id}/`),
  create: (data) => api.post('/api/classes/', data),
  update: (id, data) => api.put(`/api/classes/${id}/`, data),
  delete: (id) => api.delete(`/api/classes/${id}/`),
  activate: (id) => api.put(`/api/classes/${id}/activate/`),
  getStats: () => api.get('/api/classes/stats/'),
  getTimetable: (id) => api.get(`/api/classes/${id}/timetable/`),
};

// Subjects API
export const subjectsAPI = {
  getAll: (params) => api.get('/api/subjects/', { params }),
  getById: (id) => api.get(`/api/subjects/${id}/`),
  create: (data) => api.post('/api/subjects/', data),
  update: (id, data) => api.put(`/api/subjects/${id}/`, data),
  delete: (id) => api.delete(`/api/subjects/${id}/`),
  activate: (id) => api.put(`/api/subjects/${id}/activate/`),
};

// Teacher Subject Assignments API
export const teacherAssignmentsAPI = {
  getAll: (params) => api.get('/api/teacher-assignments/', { params }),
  getById: (id) => api.get(`/api/teacher-assignments/${id}/`),
  create: (data) => api.post('/api/teacher-assignments/', data),
  update: (id, data) => api.put(`/api/teacher-assignments/${id}/`, data),
  delete: (id, subjectIds = []) => api.delete(`/api/teacher-assignments/${id}/`, { data: { subject_ids: subjectIds } }),
};

// Timetable API - Updated to match your backend structure
export const timetableAPI = {
  // Canonical endpoints
  getAllSlots: (params) => api.get('/api/timetable/slots/', { params }),
  getSlotById: (id) => api.get(`/api/timetable/slots/${id}/`),
  createSlot: (data) => api.post('/api/timetable/slots/', data),
  updateSlot: (id, data) => api.put(`/api/timetable/slots/${id}/`, data),
  deleteSlot: (id) => api.delete(`/api/timetable/slots/${id}/`),
  generateTimetable: (data) => api.post('/api/timetable/generate/', data),
  getStats: (params) => api.get('/api/timetable/stats/', { params }),
  clearTimetable: (data) => api.post('/api/timetable/clear/', data),
  
  // Import and bulk operations
  importTimetable: (formData) => api.post('/api/timetable/import/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  createMultipleSlots: (slots) => api.post('/api/timetable/slots/bulk/', { slots }),
  
  // Aliases for convenience/compatibility with UI code
  getAll: (params) => api.get('/api/timetable/slots/', { params }),
  create: (data) => api.post('/api/timetable/slots/', data),
  update: (id, data) => api.put(`/api/timetable/slots/${id}/`, data),
  delete: (id) => api.delete(`/api/timetable/slots/${id}/`),
  getByClass: (classId) => api.get(`/api/timetable/class/${classId}/`),
  getByTeacher: (teacherId) => api.get(`/api/timetable/teacher/${teacherId}/`),
  getByDay: (day) => api.get(`/api/timetable/day/${day}/`),
};

// Class Subject Management API
export const classSubjectAPI = {
  getClassSubjects: (classId) => api.get(`/api/classes/${classId}/subjects/`),
  addSubjectsToClass: (classId, subjectIds) => api.post(`/api/classes/${classId}/subjects/`, { subject_ids: subjectIds }),
  removeSubjectsFromClass: (classId, subjectIds) => api.delete(`/api/classes/${classId}/subjects/`, { data: { subject_ids: subjectIds } }),
};

// Teacher Workload API
export const teacherWorkloadAPI = {
  getWorkloadAnalysis: () => api.get('/api/teachers/workload-analysis/'),
  getWeeklyWorkload: (teacherId) => api.get(`/api/teachers/${teacherId}/weekly-workload/`),
  getMonthlyWorkload: (teacherId) => api.get(`/api/teachers/${teacherId}/monthly-workload/`),
};

// Substitution API
export const substitutionAPI = {
  getAll: () => api.get('/api/substitutions/'),
  getById: (id) => api.get(`/api/substitutions/${id}/`),
  create: (data) => api.post('/api/substitutions/', data),
  update: (id, data) => api.put(`/api/substitutions/${id}/`, data),
  delete: (id) => api.delete(`/api/substitutions/${id}/`),
  getByTeacher: (teacherId) => api.get(`/api/substitutions/teacher/${teacherId}/`),
  getByDate: (date) => api.get(`/api/substitutions/date/${date}/`),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/api/dashboard/stats/'),
  getRecentActivity: () => api.get('/api/dashboard/recent-activity/'),
  getUpcomingEvents: () => api.get('/api/dashboard/upcoming-events/'),
};

// Default Subjects API
export const defaultSubjectsAPI = {
  getDefaults: () => api.get('/api/default-subjects/'),
  createSelected: (subjects) => api.post('/api/default-subjects/create/', { subjects }),
};

// Utility functions
export const setAuthTokens = (access, refresh, userType) => {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
  localStorage.setItem('user_type', userType);
};

// API health check function
export const checkAPIHealth = async () => {
  try {
    console.log('Checking API health...');
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://timetableadmin.com'}/api/register/`, {
      method: 'OPTIONS',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    console.log('API health check response:', response);
    return response.ok;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};

export const getAuthTokens = () => ({
  access: localStorage.getItem('access_token'),
  refresh: localStorage.getItem('refresh_token'),
  userType: localStorage.getItem('user_type'),
});

export const isAuthenticated = () => {
  return !!localStorage.getItem('access_token');
};

export default api; 