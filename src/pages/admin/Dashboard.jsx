import React from 'react';
import { Card, Row, Col, Statistic, Progress, List, Avatar } from 'antd';
import {
  UserOutlined,
  BookOutlined,
  TeamOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { users, getUsersByRole } from '../../data/users';
import { assessments } from '../../data/assessments';
import { submissions } from '../../data/submissions';

const AdminDashboard = () => {
  // Calculate overview statistics
  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.isActive).length;
  const totalAssessments = assessments.length;
  const activeAssessments = assessments.filter(a => a.status === 'active').length;
  const totalSubmissions = submissions.length;
  const evaluatedSubmissions = submissions.filter(s => s.status === 'evaluated').length;

  const students = getUsersByRole('student');
  const instructors = getUsersByRole('instructor');
  const admins = getUsersByRole('admin');

  // Recent activity (mock data for demo)
  const recentActivity = [
    {
      id: 1,
      type: 'user_registration',
      message: 'New student registered: Alice Johnson',
      timestamp: '2024-01-25T10:30:00Z',
      user: 'Alice Johnson'
    },
    {
      id: 2,
      type: 'assessment_created',
      message: 'New assessment created: Database Design Principles',
      timestamp: '2024-01-25T09:15:00Z',
      user: 'Bob Wilson'
    },
    {
      id: 3,
      type: 'submission_evaluated',
      message: 'Submission evaluated for Introduction to Data Structures',
      timestamp: '2024-01-25T08:45:00Z',
      user: 'Jane Smith'
    },
    {
      id: 4,
      type: 'user_login',
      message: 'Admin login from IP 192.168.1.100',
      timestamp: '2024-01-25T08:00:00Z',
      user: 'Admin User'
    }
  ];

  const statsCards = [
    {
      title: 'Total Users',
      value: totalUsers,
      icon: <UserOutlined />,
      color: '#1890ff',
      subtitle: `${activeUsers} active`
    },
    {
      title: 'Students',
      value: students.length,
      icon: <TeamOutlined />,
      color: '#52c41a',
      subtitle: `${students.filter(s => s.isActive).length} active`
    },
    {
      title: 'Instructors',
      value: instructors.length,
      icon: <UserOutlined />,
      color: '#722ed1',
      subtitle: `${instructors.filter(i => i.isActive).length} active`
    },
    {
      title: 'Assessments',
      value: totalAssessments,
      icon: <BookOutlined />,
      color: '#faad14',
      subtitle: `${activeAssessments} active`
    },
    {
      title: 'Submissions',
      value: totalSubmissions,
      icon: <FileTextOutlined />,
      color: '#13c2c2',
      subtitle: `${evaluatedSubmissions} evaluated`
    },
    {
      title: 'Completion Rate',
      value: Math.round((evaluatedSubmissions / totalSubmissions) * 100),
      suffix: '%',
      icon: <CheckCircleOutlined />,
      color: '#52c41a'
    }
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_registration': return <UserOutlined className="text-blue-500" />;
      case 'assessment_created': return <BookOutlined className="text-green-500" />;
      case 'submission_evaluated': return <CheckCircleOutlined className="text-orange-500" />;
      case 'user_login': return <ClockCircleOutlined className="text-gray-500" />;
      default: return <BarChartOutlined />;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Platform overview and management statistics
        </p>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        {statsCards.map((stat, index) => (
          <Col xs={24} sm={12} lg={8} key={index}>
            <Card className="text-center">
              <Statistic
                title={stat.title}
                value={stat.value}
                suffix={stat.suffix}
                prefix={<span style={{ color: stat.color }}>{stat.icon}</span>}
                valueStyle={{ color: stat.color }}
              />
              {stat.subtitle && (
                <div className="text-sm text-gray-600 mt-2">{stat.subtitle}</div>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        {/* User Distribution */}
        <Col xs={24} lg={12}>
          <Card title="User Distribution" className="h-full">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Students</span>
                <span className="font-bold text-green-600">{students.length}</span>
              </div>
              <Progress
                percent={Math.round((students.length / totalUsers) * 100)}
                status="active"
                strokeColor="#52c41a"
              />

              <div className="flex justify-between items-center">
                <span>Instructors</span>
                <span className="font-bold text-purple-600">{instructors.length}</span>
              </div>
              <Progress
                percent={Math.round((instructors.length / totalUsers) * 100)}
                status="active"
                strokeColor="#722ed1"
              />

              <div className="flex justify-between items-center">
                <span>Administrators</span>
                <span className="font-bold text-blue-600">{admins.length}</span>
              </div>
              <Progress
                percent={Math.round((admins.length / totalUsers) * 100)}
                status="active"
                strokeColor="#1890ff"
              />
            </div>
          </Card>
        </Col>

        {/* Recent Activity */}
        <Col xs={24} lg={12}>
          <Card title="Recent Activity" className="h-full">
            <List
              dataSource={recentActivity}
              renderItem={(activity) => (
                <List.Item>
                  <div className="flex items-start space-x-3 w-full">
                    <div className="mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm">{activity.message}</div>
                      <div className="text-xs text-gray-600">
                        {new Date(activity.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* System Health */}
      <Row gutter={[16, 16]} className="mt-6">
        <Col xs={24}>
          <Card title="System Health Overview">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">98.5%</div>
                  <div className="text-sm text-gray-600">System Uptime</div>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">2.3s</div>
                  <div className="text-sm text-gray-600">Avg Response Time</div>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-2">24/7</div>
                  <div className="text-sm text-gray-600">Monitoring Status</div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
