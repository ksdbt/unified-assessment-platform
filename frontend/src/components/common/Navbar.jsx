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
  SearchOutlined,
  MenuOutlined
} from '@ant-design/icons';
import { Avatar, Dropdown, Input, Button, Badge, List, Typography } from 'antd';
import { useNotifications } from '../../context/NotificationContext';
import moment from 'moment';

const { Text } = Typography;

const Navbar = ({ onMenuClick }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const notificationMenu = (
    <div className="w-80 bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-semibold text-gray-900 dark:text-white m-0">Notifications</h3>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={markAllAsRead}>
            Mark all read
          </Button>
        )}
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length > 0 ? (
          <List
            itemLayout="horizontal"
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item
                className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${!item.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                onClick={() => markAsRead(item._id)}
              >
                <List.Item.Meta
                  avatar={
                    <div className={`w-2 h-2 mt-2 rounded-full ${!item.isRead ? 'bg-blue-500' : 'bg-transparent'}`} />
                  }
                  title={
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.message}
                    </div>
                  }
                  description={
                    <div className="text-xs text-gray-500 mt-1">
                      {moment(item.createdAt).fromNow()}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <div className="p-8 text-center text-gray-500">
            <BellOutlined className="text-2xl mb-2 opacity-50" />
            <p className="m-0 text-sm">No notifications</p>
          </div>
        )}
      </div>
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-center">
        <Button
          type="link"
          block
          onClick={() => {
            navigate('/notifications');
          }}
        >
          View All Notifications
        </Button>
      </div>
    </div>
  );

  const getRoleBasedMenuItems = () => {
    return [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: 'Profile',
        onClick: () => navigate('/profile')
      },
      { type: 'divider' },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Logout',
        onClick: handleLogout,
        danger: true
      }
    ];
  };

  const getDashboardPath = () => {
    switch (user?.role) {
      case 'student': return '/student-dashboard';
      case 'instructor': return '/instructor-dashboard';
      case 'admin': return '/admin-dashboard';
      default: return '/';
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 fixed top-0 left-0 right-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {isAuthenticated && (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={onMenuClick}
                className="md:hidden mr-2 flex items-center justify-center"
              />
            )}
            <Link to={getDashboardPath()} className="flex items-center">
              <div className="bg-indigo-600 text-white p-2 rounded-lg mr-3 shadow-md">
                <span className="font-bold text-lg">SAS</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                Smart Assessment System
              </span>
            </Link>
          </div>

          {isAuthenticated && (
            <div className="flex-1 flex items-center justify-center px-8">
              <div className="w-full max-w-md">
                <Input
                  placeholder="Search quizzes, categories..."
                  prefix={<SearchOutlined className="text-gray-400" />}
                  className="rounded-xl border-gray-200"
                  size="large"
                />
              </div>
            </div>
          )}

          <div className="flex items-center space-x-4">
            <Button
              type="text"
              icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleTheme}
              className="text-gray-600 dark:text-gray-300"
            />

            {isAuthenticated ? (
              <>
                <Dropdown
                  popupRender={() => notificationMenu}
                  trigger={['click']}
                  placement="bottomRight"
                >
                  <Button type="text" className="relative">
                    <Badge count={unreadCount} size="small">
                      <BellOutlined className="text-lg text-gray-600 dark:text-gray-300" />
                    </Badge>
                  </Button>
                </Dropdown>

                <Dropdown
                  menu={{ items: getRoleBasedMenuItems() }}
                  placement="bottomRight"
                  trigger={['click']}
                >
                  <div className="flex items-center cursor-pointer ml-2">
                    <Avatar
                      src={user?.avatar}
                      icon={<UserOutlined />}
                      className="border-2 border-indigo-100"
                    />
                    <div className="hidden md:block ml-2 text-left">
                      <div className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                        {user?.name}
                      </div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">
                        {user?.role}
                      </div>
                    </div>
                  </div>
                </Dropdown>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button type="text">Login</Button>
                </Link>
                <Link to="/signup">
                  <Button type="primary" className="bg-indigo-600 rounded-lg">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
