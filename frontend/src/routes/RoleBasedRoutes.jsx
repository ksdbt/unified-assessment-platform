import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SectionErrorBoundary from '../components/common/SectionErrorBoundary';

// Lazy load components for better performance
const StudentDashboard = React.lazy(() => import('../pages/student/Dashboard'));
const StudentAssessmentCatalog = React.lazy(() => import('../pages/student/AssessmentCatalog'));
const StudentAssessmentConfig = React.lazy(() => import('../pages/student/AssessmentConfig'));
const StudentAssessmentInterface = React.lazy(() => import('../pages/student/AssessmentInterface'));
const StudentSubmissions = React.lazy(() => import('../pages/student/Submissions'));
const StudentResults = React.lazy(() => import('../pages/student/Results'));
const StudentProfile = React.lazy(() => import('../pages/student/Profile'));
const StudentLeaderboard = React.lazy(() => import('../pages/student/Leaderboard'));

const InstructorDashboard = React.lazy(() => import('../pages/instructor/Dashboard'));
const InstructorCreateAssessment = React.lazy(() => import('../pages/instructor/CreateAssessment'));
const InstructorManageAssessments = React.lazy(() => import('../pages/instructor/ManageAssessments'));
const InstructorEvaluateSubmissions = React.lazy(() => import('../pages/instructor/EvaluateSubmissions'));
const InstructorStudentOverview = React.lazy(() => import('../pages/instructor/StudentOverview'));
const InstructorProfile = React.lazy(() => import('../pages/instructor/Profile'));
const InstructorAnalyticsDashboard = React.lazy(() => import('../pages/instructor/AnalyticsDashboard'));

const AdminDashboard = React.lazy(() => import('../pages/admin/Dashboard'));
const AdminUserManagement = React.lazy(() => import('../pages/admin/UserManagement'));
const AdminAssessmentOversight = React.lazy(() => import('../pages/admin/AssessmentOversight'));
const AdminLogsReports = React.lazy(() => import('../pages/admin/LogsReports'));
const AdminPlatformSettings = React.lazy(() => import('../pages/admin/PlatformSettings'));
const AdminAnomalyMonitor = React.lazy(() => import('../pages/admin/AnomalyMonitor'));
const AdminSecurityHealth = React.lazy(() => import('../pages/admin/SecurityHealth'));
const AdminProfile = React.lazy(() => import('../pages/admin/Profile'));
const QuestionAnalytics = React.lazy(() => import('../pages/admin/QuestionAnalytics'));
const Notifications = React.lazy(() => import('../pages/Notifications'));

// Helper hook to wrap lazy components in both Suspense and ErrorBoundary
const withErrorBoundary = (Component) => (
  <SectionErrorBoundary>
    <Component />
  </SectionErrorBoundary>
);

const RoleBasedRoutes = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const renderStudentRoutes = () => (
    <Routes>
      <Route path="/student-dashboard" element={withErrorBoundary(StudentDashboard)} />
      <Route path="/assessments" element={withErrorBoundary(StudentAssessmentCatalog)} />
      <Route path="/assessment/:id" element={withErrorBoundary(StudentAssessmentConfig)} />
      <Route path="/assessment/:id/take" element={withErrorBoundary(StudentAssessmentInterface)} />
      <Route path="/submissions" element={withErrorBoundary(StudentSubmissions)} />
      <Route path="/assessment-result/:id" element={withErrorBoundary(StudentResults)} />
      <Route path="/profile" element={withErrorBoundary(StudentProfile)} />
      <Route path="/leaderboard" element={withErrorBoundary(StudentLeaderboard)} />
      <Route path="/notifications" element={withErrorBoundary(Notifications)} />
      <Route path="/" element={<Navigate to="/student-dashboard" replace />} />
      <Route path="*" element={<Navigate to="/student-dashboard" replace />} />
    </Routes>
  );

  const renderInstructorRoutes = () => (
    <Routes>
      <Route path="/instructor-dashboard" element={withErrorBoundary(InstructorDashboard)} />
      <Route path="/create-assessment" element={withErrorBoundary(InstructorCreateAssessment)} />
      <Route path="/manage-assessments" element={withErrorBoundary(InstructorManageAssessments)} />
      <Route path="/evaluate-submissions" element={withErrorBoundary(InstructorEvaluateSubmissions)} />
      <Route path="/student-overview" element={withErrorBoundary(InstructorStudentOverview)} />
      <Route path="/assessment-analytics/:id" element={withErrorBoundary(QuestionAnalytics)} />
      <Route path="/analytics/:id" element={withErrorBoundary(InstructorAnalyticsDashboard)} />
      <Route path="/profile" element={withErrorBoundary(InstructorProfile)} />
      <Route path="/notifications" element={withErrorBoundary(Notifications)} />
      <Route path="/" element={<Navigate to="/instructor-dashboard" replace />} />
      <Route path="*" element={<Navigate to="/instructor-dashboard" replace />} />
    </Routes>
  );

  const renderAdminRoutes = () => (
    <Routes>
      <Route path="/admin-dashboard" element={withErrorBoundary(AdminDashboard)} />
      <Route path="/user-management" element={withErrorBoundary(AdminUserManagement)} />
      <Route path="/assessment-oversight" element={withErrorBoundary(AdminAssessmentOversight)} />
      <Route path="/logs-reports" element={withErrorBoundary(AdminLogsReports)} />
      <Route path="/anomaly-monitor" element={withErrorBoundary(AdminAnomalyMonitor)} />
      <Route path="/security-health" element={withErrorBoundary(AdminSecurityHealth)} />
      <Route path="/platform-settings" element={withErrorBoundary(AdminPlatformSettings)} />
      <Route path="/profile" element={withErrorBoundary(AdminProfile)} />
      <Route path="/assessment-analytics/:id" element={withErrorBoundary(QuestionAnalytics)} />
      <Route path="/analytics/:id" element={withErrorBoundary(InstructorAnalyticsDashboard)} />
      <Route path="/notifications" element={withErrorBoundary(Notifications)} />
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
