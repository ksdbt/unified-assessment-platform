import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Auth pages
import Login from '../pages/auth/Login';
import Signup from '../pages/auth/Signup';

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {isAuthenticated && <Navbar />}
      <div className="flex">
        {isAuthenticated && <Sidebar />}
        <main className={`flex-1 ${isAuthenticated ? 'ml-64' : ''}`}>
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

              {/* Default redirect */}
              <Route
                path="/"
                element={
                  isAuthenticated ? (
                    <Navigate to={getRoleBasedRedirect(user?.role)} replace />
                  ) : (
                    <Navigate to="/login" replace />
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
