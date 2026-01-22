import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  DashboardOutlined,
  BookOutlined,
  FileTextOutlined,
  CheckSquareOutlined,
  UserOutlined,
  TeamOutlined,
  BarChartOutlined,
  SettingOutlined,
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  UserAddOutlined,
  FileSearchOutlined,
  LineChartOutlined
} from '@ant-design/icons';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const getMenuItems = () => {
    switch (user?.role) {
      case 'student':
        return [
          {
            key: 'dashboard',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
            path: '/student-dashboard'
          },
          {
            key: 'assessments',
            icon: <BookOutlined />,
            label: 'Assessments',
            path: '/assessments'
          },
          {
            key: 'submissions',
            icon: <FileTextOutlined />,
            label: 'My Submissions',
            path: '/submissions'
          },
          {
            key: 'profile',
            icon: <UserOutlined />,
            label: 'Profile',
            path: '/profile'
          }
        ];

      case 'instructor':
        return [
          {
            key: 'dashboard',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
            path: '/instructor-dashboard'
          },
          {
            key: 'create-assessment',
            icon: <PlusOutlined />,
            label: 'Create Assessment',
            path: '/create-assessment'
          },
          {
            key: 'manage-assessments',
            icon: <EditOutlined />,
            label: 'Manage Assessments',
            path: '/manage-assessments'
          },
          {
            key: 'evaluate-submissions',
            icon: <CheckSquareOutlined />,
            label: 'Evaluate Submissions',
            path: '/evaluate-submissions'
          },
          {
            key: 'student-overview',
            icon: <TeamOutlined />,
            label: 'Student Overview',
            path: '/student-overview'
          },
          {
            key: 'profile',
            icon: <UserOutlined />,
            label: 'Profile',
            path: '/profile'
          }
        ];

      case 'admin':
        return [
          {
            key: 'dashboard',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
            path: '/admin-dashboard'
          },
          {
            key: 'user-management',
            icon: <UserAddOutlined />,
            label: 'User Management',
            path: '/user-management'
          },
          {
            key: 'assessment-oversight',
            icon: <FileSearchOutlined />,
            label: 'Assessment Oversight',
            path: '/assessment-oversight'
          },
          {
            key: 'logs-reports',
            icon: <BarChartOutlined />,
            label: 'Logs & Reports',
            path: '/logs-reports'
          },
          {
            key: 'platform-settings',
            icon: <SettingOutlined />,
            label: 'Platform Settings',
            path: '/platform-settings'
          }
        ];

      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="fixed left-0 top-16 h-full w-64 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700">
      <div className="p-4">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.key}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
