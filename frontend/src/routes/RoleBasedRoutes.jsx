import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Lazy load components for better performance
const StudentDashboard = React.lazy(() => import('../pages/student/Dashboard'));
const StudentAssessmentCatalog = React.lazy(() => import('../pages/student/AssessmentCatalog'));
const StudentAssessmentInterface = React.lazy(() => import('../pages/student/AssessmentInterface'));
const StudentSubmissions = React.lazy(() => import('../pages/student/Submissions'));
const StudentProfile = React.lazy(() => import('../pages/student/Profile'));

const InstructorDashboard = React.lazy(() => import('../pages/instructor/Dashboard'));
const InstructorCreateAssessment = React.lazy(() => import('../pages/instructor/CreateAssessment'));
const InstructorManageAssessments = React.lazy(() => import('../pages/instructor/ManageAssessments'));
const InstructorEvaluateSubmissions = React.lazy(() => import('../pages/instructor/EvaluateSubmissions'));
const InstructorStudentOverview = React.lazy(() => import('../pages/instructor/StudentOverview'));
const InstructorProfile = React.lazy(() => import('../pages/instructor/Profile'));

const AdminDashboard = React.lazy(() => import('../pages/admin/Dashboard'));
const AdminUserManagement = React.lazy(() => import('../pages/admin/UserManagement'));
const AdminAssessmentOversight = React.lazy(() => import('../pages/admin/AssessmentOversight'));
const AdminLogsReports = React.lazy(() => import('../pages/admin/LogsReports'));
const AdminPlatformSettings = React.lazy(() => import('../pages/admin/PlatformSettings'));

const RoleBasedRoutes = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const renderStudentRoutes = () => (
    <Routes>
      <Route path="/student-dashboard" element={<StudentDashboard />} />
      <Route path="/assessments" element={<StudentAssessmentCatalog />} />
      <Route path="/assessment/:id" element={<StudentAssessmentInterface />} />
      <Route path="/submissions" element={<StudentSubmissions />} />
      <Route path="/profile" element={<StudentProfile />} />
      <Route path="/" element={<Navigate to="/student-dashboard" replace />} />
      <Route path="*" element={<Navigate to="/student-dashboard" replace />} />
    </Routes>
  );

  const renderInstructorRoutes = () => (
    <Routes>
      <Route path="/instructor-dashboard" element={<InstructorDashboard />} />
      <Route path="/create-assessment" element={<InstructorCreateAssessment />} />
      <Route path="/manage-assessments" element={<InstructorManageAssessments />} />
      <Route path="/evaluate-submissions" element={<InstructorEvaluateSubmissions />} />
      <Route path="/student-overview" element={<InstructorStudentOverview />} />
      <Route path="/profile" element={<InstructorProfile />} />
      <Route path="/" element={<Navigate to="/instructor-dashboard" replace />} />
      <Route path="*" element={<Navigate to="/instructor-dashboard" replace />} />
    </Routes>
  );

  const renderAdminRoutes = () => (
    <Routes>
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/user-management" element={<AdminUserManagement />} />
      <Route path="/assessment-oversight" element={<AdminAssessmentOversight />} />
      <Route path="/logs-reports" element={<AdminLogsReports />} />
      <Route path="/platform-settings" element={<AdminPlatformSettings />} />
      <Route path="/" element={<Navigate to="/admin-dashboard" replace />} />
      <Route path="*" element={<Navigate to="/admin-dashboard" replace />} />
    </Routes>
  );

  switch (user?.role) {
    case 'student':
      return renderStudentRoutes();
    case 'instructor':
      return renderInstructorRoutes();
    case 'admin':
      return renderAdminRoutes();
    default:
      return <Navigate to="/login" replace />;
  }
};

export default RoleBasedRoutes;
