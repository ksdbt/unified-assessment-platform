import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, List, Spin } from 'antd';
import {
  UserOutlined, BookOutlined, TeamOutlined, FileTextOutlined,
  CheckCircleOutlined, ClockCircleOutlined, BarChartOutlined
} from '@ant-design/icons';
import { adminAPI } from '../../services/api';

 

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getStats()
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spin size="large" /></div>;
  }

  const { users, roles, assessments, submissions, recentActivity } = stats || {};
  const totalUsers = users?.total || 0;

  const statsCards = [
    { title: 'Total Users', value: users?.total || 0, icon: <UserOutlined />, color: '#1890ff', subtitle: `${users?.active || 0} active` },
    { title: 'Students', value: roles?.students || 0, icon: <TeamOutlined />, color: '#52c41a' },
    { title: 'Instructors', value: roles?.instructors || 0, icon: <UserOutlined />, color: '#722ed1' },
    { title: 'Assessments', value: assessments?.total || 0, icon: <BookOutlined />, color: '#faad14', subtitle: `${assessments?.active || 0} active` },
    { title: 'Submissions', value: submissions?.total || 0, icon: <FileTextOutlined />, color: '#13c2c2', subtitle: `${submissions?.evaluated || 0} evaluated` },
    {
      title: 'Completion Rate',
      value: submissions?.total > 0 ? Math.round((submissions.evaluated / submissions.total) * 100) : 0,
      suffix: '%',
      icon: <CheckCircleOutlined />,
      color: '#52c41a'
    }
  ];

  const getActivityIcon = (action) => {
    if (action?.includes('user')) return <UserOutlined className="text-blue-500" />;
    if (action?.includes('assessment')) return <BookOutlined className="text-green-500" />;
    return <ClockCircleOutlined className="text-gray-500" />;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Platform overview and management statistics</p>
      </div>

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
              {stat.subtitle && <div className="text-sm text-gray-600 mt-2">{stat.subtitle}</div>}
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="User Distribution" className="h-full">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Students</span>
                <span className="font-bold text-green-600">{roles?.students || 0}</span>
              </div>
              <Progress percent={totalUsers > 0 ? Math.round(((roles?.students || 0) / totalUsers) * 100) : 0} status="active" strokeColor="#52c41a" />
              <div className="flex justify-between items-center">
                <span>Instructors</span>
                <span className="font-bold text-purple-600">{roles?.instructors || 0}</span>
              </div>
              <Progress percent={totalUsers > 0 ? Math.round(((roles?.instructors || 0) / totalUsers) * 100) : 0} status="active" strokeColor="#722ed1" />
              <div className="flex justify-between items-center">
                <span>Administrators</span>
                <span className="font-bold text-blue-600">{roles?.admins || 0}</span>
              </div>
              <Progress percent={totalUsers > 0 ? Math.round(((roles?.admins || 0) / totalUsers) * 100) : 0} status="active" strokeColor="#1890ff" />
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Recent Activity" className="h-full">
            {recentActivity?.length > 0 ? (
              <List
                dataSource={recentActivity}
                renderItem={(activity) => (
                  <List.Item>
                    <div className="flex items-start space-x-3 w-full">
                      <div className="mt-1">{getActivityIcon(activity.action)}</div>
                      <div className="flex-1">
                        <div className="text-sm">{activity.details}</div>
                        <div className="text-xs text-gray-600">{new Date(activity.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <div className="text-center text-gray-500 py-8">No recent activity</div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;