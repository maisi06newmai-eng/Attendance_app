import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import AttendancePage from './pages/AttendancePage';
import AttendanceHistoryPage from './pages/AttendanceHistoryPage';
import LocationPage from './pages/LocationPage';
import InsightsPage from './pages/InsightsPage';
import TimetablePage from './pages/TimetablePage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherAttendancePage from './pages/teacher/TeacherAttendancePage';
import TeacherCorrectionsPage from './pages/TeacherCorrectionsPage';
import ReportsPage from './pages/ReportsPage';
import ToastContainer from './components/common/ToastContainer';


function ProtectedRoute({ children, requiredRole }) {
  const { state } = useApp();
  if (!state.isAuthenticated) return <Navigate to="/login" replace />;
  if (requiredRole && state.role !== requiredRole) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { state } = useApp();

  if (!state.isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const defaultRoute = state.role === 'teacher' ? '/teacher' : '/dashboard';

  return (
    <Routes>
      <Route path="/" element={<Navigate to={defaultRoute} replace />} />
      <Route path="/login" element={<Navigate to={defaultRoute} replace />} />

      {/* Student Routes */}
      <Route element={<ProtectedRoute requiredRole="student"><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/history" element={<AttendanceHistoryPage />} />
        <Route path="/location" element={<LocationPage />} />
        <Route path="/corrections" element={<TeacherCorrectionsPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/timetable" element={<TimetablePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Route>

      {/* Teacher Routes */}
      <Route element={<ProtectedRoute requiredRole="teacher"><AppLayout isTeacher /></ProtectedRoute>}>
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/teacher/attendance" element={<TeacherAttendancePage />} />
        <Route path="/teacher/corrections" element={<TeacherCorrectionsPage />} />
        <Route path="/teacher/notifications" element={<NotificationsPage />} />
        <Route path="/teacher/profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to={defaultRoute} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer />
      </BrowserRouter>
    </AppProvider>
  );
}
