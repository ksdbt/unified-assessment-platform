import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Auth pages
import Login from '../pages/auth/Login';
import Signup from '../pages/auth/Signup';
import Landing from '../pages/Landing';

// Common components
import ProtectedRoute from '../components/common/ProtectedRoute';
import RoleGuard from '../components/common/RoleGuard';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';

// Lazy load role-based routes
const RoleBasedRoutes = React.lazy(() => import('./RoleBasedRoutes'));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {isAuthenticated && <Navbar onMenuClick={toggleSidebar} />}
      <div className="flex">
        {isAuthenticated && (
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        )}
        <main
          className={`flex-1 transition-all duration-300 ${isAuthenticated ? 'md:ml-64 pt-16' : ''
            }`}
        >
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Public routes */}
              <Route
                path="/login"
                element={
                  isAuthenticated ? (
                    <Navigate to={getRoleBasedRedirect(user?.role)} replace />
                  ) : (
                    <Login />
                  )
                }
              />
              <Route
                path="/signup"
                element={
                  isAuthenticated ? (
                    <Navigate to={getRoleBasedRedirect(user?.role)} replace />
                  ) : (
                    <Signup />
                  )
                }
              />

              {/* Protected routes based on role */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <RoleBasedRoutes />
                  </ProtectedRoute>
                }
              />

              {/* Default redirect: Landing Page for guests, Dashboard for auth users */}
              <Route
                path="/"
                element={
                  isAuthenticated ? (
                    <Navigate to={getRoleBasedRedirect(user?.role)} replace />
                  ) : (
                    <Landing />
                  )
                }
              />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
};

// Helper function to get role-based redirect
const getRoleBasedRedirect = (role) => {
  switch (role) {
    case 'student':
      return '/student-dashboard';
    case 'instructor':
      return '/instructor-dashboard';
    case 'admin':
      return '/admin-dashboard';
    default:
      return '/login';
  }
};

export default AppRoutes;
