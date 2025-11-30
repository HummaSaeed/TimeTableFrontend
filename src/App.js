import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import 'bootstrap/dist/css/bootstrap.min.css';
// Removed JS bundle to prevent event and DOM conflicts with React-Bootstrap
// import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './App.css';

// Import components and pages
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import EnhancedDashboard from './pages/Dashboard/EnhancedDashboard';
import TeachersList from './pages/Teachers/TeachersList';
import AddTeacher from './pages/Teachers/AddTeacher';
import EditTeacher from './pages/Teachers/EditTeacher';
import SubjectsList from './pages/Subjects/SubjectsList';
import AddSubject from './pages/Subjects/AddSubject';
import ClassesList from './pages/Classes/ClassesList';
import AddClass from './pages/Classes/AddClass';
import EditClass from './pages/Classes/EditClass';
import TimetableList from './pages/Timetable/TimetableList';
import GenerateTimetable from './pages/Timetable/GenerateTimetable';
import TimetableImport from './pages/Timetable/TimetableImport';
import SubstitutionTracking from './pages/Timetable/SubstitutionTracking';
import TodaysSubstitutionGrid from './pages/Timetable/TodaysSubstitutionGrid';
import TodaysSchedule from './pages/Timetable/TodaysSchedule';
import AssignmentsList from './pages/Assignments/AssignmentsList';
import ClassTimetable from './pages/Classes/ClassTimetable';
import TeacherTimetable from './pages/Teachers/TeacherTimetable';
import Settings from './pages/Settings/Settings';
import LoginScreen from './components/Auth/LoginScreen';
import RegisterScreen from './components/Auth/RegisterScreen';
import ForgotPasswordScreen from './components/Auth/ForgotPasswordScreen';
import PeriodTiming from './pages/School/PeriodTiming';
import SchoolProfile from './pages/School/SchoolProfile';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-success mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="text-muted">Loading...</h5>
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div>
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginScreen />} />
              <Route path="/register" element={<RegisterScreen />} />
              <Route path="/forgot-password" element={<ForgotPasswordScreen />} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <MainLayout>
                    <EnhancedDashboard />
                  </MainLayout>
                </ProtectedRoute>
              } />


              {/* Teachers Routes */}
              <Route path="/teachers" element={
                <ProtectedRoute>
                  <MainLayout>
                    <TeachersList />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/teachers/add" element={
                <ProtectedRoute>
                  <MainLayout>
                    <AddTeacher />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/teachers/edit/:teacherId" element={
                <ProtectedRoute>
                  <MainLayout>
                    <EditTeacher />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/teachers/:teacherId/timetable" element={
                <ProtectedRoute>
                  <MainLayout>
                    <TeacherTimetable />
                  </MainLayout>
                </ProtectedRoute>
              } />

              {/* Subjects Routes */}
              <Route path="/subjects" element={
                <ProtectedRoute>
                  <MainLayout>
                    <SubjectsList />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/subjects/add" element={
                <ProtectedRoute>
                  <MainLayout>
                    <AddSubject />
                  </MainLayout>
                </ProtectedRoute>
              } />

              {/* Classes Routes */}
              <Route path="/classes" element={
                <ProtectedRoute>
                  <MainLayout>
                    <ClassesList />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/classes/add" element={
                <ProtectedRoute>
                  <MainLayout>
                    <AddClass />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/classes/edit/:classId" element={
                <ProtectedRoute>
                  <MainLayout>
                    <EditClass />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/classes/:classId/timetable" element={
                <ProtectedRoute>
                  <MainLayout>
                    <ClassTimetable />
                  </MainLayout>
                </ProtectedRoute>
              } />

              {/* Timetable Routes */}
              <Route path="/timetable" element={
                <ProtectedRoute>
                  <MainLayout>
                    <TimetableList />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/timetable/generate" element={
                <ProtectedRoute>
                  <MainLayout>
                    <GenerateTimetable />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/timetable/import" element={
                <ProtectedRoute>
                  <MainLayout>
                    <TimetableImport />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/timetable/substitution" element={
                <ProtectedRoute>
                  <MainLayout>
                    <TodaysSubstitutionGrid />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/timetable/substitution-tracking" element={
                <ProtectedRoute>
                  <MainLayout>
                    <SubstitutionTracking />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/timetable/today-schedule" element={
                <ProtectedRoute>
                  <MainLayout>
                    <TodaysSchedule />
                  </MainLayout>
                </ProtectedRoute>
              } />

              {/* Assignments Routes */}
              <Route path="/assignments" element={
                <ProtectedRoute>
                  <MainLayout>
                    <AssignmentsList />
                  </MainLayout>
                </ProtectedRoute>
              } />

              {/* School Management Routes */}
              <Route path="/school/profile" element={
                <ProtectedRoute>
                  <MainLayout>
                    <SchoolProfile />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/school/period-timing" element={
                <ProtectedRoute>
                  <MainLayout>
                    <PeriodTiming />
                  </MainLayout>
                </ProtectedRoute>
              } />

              {/* Settings Routes */}
              <Route path="/settings" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Settings />
                  </MainLayout>
                </ProtectedRoute>
              } />

              {/* Default Route */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
