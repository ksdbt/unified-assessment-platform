import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If specific roles are required and user doesn't have permission
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on user role
    const redirectPath = getRoleBasedRedirect(user.role);
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

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

export default ProtectedRoute;
