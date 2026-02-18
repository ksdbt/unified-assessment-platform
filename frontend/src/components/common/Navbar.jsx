import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  UserOutlined,
  LogoutOutlined,
  MoonOutlined,
  SunOutlined,
  BellOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { Avatar, Dropdown, Input, Button } from 'antd';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBasedMenuItems = () => {
    const baseItems = [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: 'Profile',
        onClick: () => navigate('/profile')
      },
      {
        type: 'divider'
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Logout',
        onClick: handleLogout,
        danger: true
      }
    ];

    return baseItems;
  };

  const getDashboardPath = () => {
    switch (user?.role) {
      case 'student':
        return '/student-dashboard';
      case 'instructor':
        return '/instructor-dashboard';
      case 'admin':
        return '/admin-dashboard';
      default:
        return '/';
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <Link to={getDashboardPath()} className="flex items-center">
              <div className="bg-blue-600 text-white p-2 rounded-lg mr-3">
                <span className="font-bold text-lg">UAP</span>
              </div>
              <span className="text-xl font-semibold text-gray-900 dark:text-white">
                Unified Assessment Platform
              </span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 flex items-center justify-center px-8">
            <div className="w-full max-w-md">
              <Input
                placeholder="Search assessments, users..."
                prefix={<SearchOutlined />}
                className="rounded-lg"
                size="large"
              />
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <Button
              type="text"
              icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleTheme}
              className="text-gray-600 dark:text-gray-300"
            />

            {/* Notifications */}
            <Button
              type="text"
              icon={<BellOutlined />}
              className="text-gray-600 dark:text-gray-300"
            />

            {/* User Menu */}
            <Dropdown
              menu={{
                items: getRoleBasedMenuItems()
              }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div className="flex items-center cursor-pointer">
                <Avatar
                  src={user?.avatar}
                  icon={<UserOutlined />}
                  className="mr-2"
                />
                <div className="hidden md:block">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {user?.role}
                  </div>
                </div>
              </div>
            </Dropdown>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
