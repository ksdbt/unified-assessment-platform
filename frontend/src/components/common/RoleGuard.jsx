import React from 'react';
import { useAuth } from '../../context/AuthContext';

const RoleGuard = ({ children, allowedRoles = [], fallback = null }) => {
  const { user } = useAuth();

  if (!user) {
    return fallback;
  }

  // Check if user has required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return fallback || (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to access this resource.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default RoleGuard;
