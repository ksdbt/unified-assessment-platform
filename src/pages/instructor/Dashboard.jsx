import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, Row, Col, Statistic, List, Progress, Avatar } from 'antd';
import {
  BookOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  UserOutlined
} from '@ant-design/icons';
import { getAssessmentsByInstructor } from '../../data/assessments';
import { getPendingSubmissions } from '../../data/submissions';

const InstructorDashboard = () => {
  const { user } = useAuth();

  // Get instructor-specific data
  const myAssessments = getAssessmentsByInstructor(user.id);
  const pendingSubmissions = getPendingSubmissions().filter(submission => {
    const assessment = myAssessments.find(a => a.id === submission.assessmentId);
    return assessment !== undefined;
  });

  // Calculate stats
  const totalAssessments = myAssessments.length;
  const activeAssessments = myAssessments.filter(a => a.status === 'active').length;
  const draftAssessments = myAssessments.filter(a => a.status === 'draft').length;
  const totalSubmissions = myAssessments.reduce((acc, assessment) => acc + assessment.enrolledStudents.length, 0);

  // Recent assessments
  const recentAssessments = myAssessments
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  const statsCards = [
    {
      title: 'Total Assessments',
      value: totalAssessments,
      icon: <BookOutlined />,
      color: '#1890ff'
    },
    {
      title: 'Active Assessments',
      value: activeAssessments,
      icon: <CheckCircleOutlined />,
      color: '#52c41a'
    },
    {
      title: 'Pending Reviews',
      value: pendingSubmissions.length,
      icon: <ClockCircleOutlined />,
      color: '#faad14'
    },
    {
      title: 'Total Students',
      value: totalSubmissions,
      icon: <TeamOutlined />,
      color: '#722ed1'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Avatar
          src={user.avatar}
          size={64}
          icon={<UserOutlined />}
        />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user.name}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your assessments and evaluate student submissions
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]}>
        {statsCards.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card className="text-center">
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={<span style={{ color: stat.color }}>{stat.icon}</span>}
                valueStyle={{ color: stat.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        {/* Assessment Overview */}
        <Col xs={24} lg={12}>
          <Card title="Assessment Overview" className="h-full">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Active Assessments</span>
                <span className="font-bold text-green-600">{activeAssessments}</span>
              </div>
              <Progress
                percent={totalAssessments > 0 ? (activeAssessments / totalAssessments) * 100 : 0}
                status="active"
                strokeColor="#52c41a"
              />

              <div className="flex justify-between items-center">
                <span>Draft Assessments</span>
                <span className="font-bold text-orange-600">{draftAssessments}</span>
              </div>
              <Progress
                percent={totalAssessments > 0 ? (draftAssessments / totalAssessments) * 100 : 0}
                status="active"
                strokeColor="#faad14"
              />
            </div>
          </Card>
        </Col>

        {/* Recent Assessments */}
        <Col xs={24} lg={12}>
          <Card title="Recent Assessments" className="h-full">
            {recentAssessments.length > 0 ? (
              <List
                dataSource={recentAssessments}
                renderItem={(assessment) => (
                  <List.Item>
                    <div className="flex justify-between items-center w-full">
                      <div>
                        <div className="font-medium">{assessment.title}</div>
                        <div className="text-sm text-gray-600 flex items-center space-x-2">
                          <span>{assessment.subject}</span>
                          <span>•</span>
                          <span>{assessment.totalQuestions} questions</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm px-2 py-1 rounded ${
                          assessment.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {assessment.status}
                        </div>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <div className="text-center text-gray-500 py-8">
                No assessments created yet
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Pending Submissions */}
      <Card title="Pending Evaluations">
        {pendingSubmissions.length > 0 ? (
          <List
            dataSource={pendingSubmissions}
            renderItem={(submission) => {
              const assessment = myAssessments.find(a => a.id === submission.assessmentId);
              return (
                <List.Item>
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center space-x-3">
                      <Avatar icon={<UserOutlined />} size="small" />
                      <div>
                        <div className="font-medium">{submission.studentName}</div>
                        <div className="text-sm text-gray-600">
                          {assessment?.title} • Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Time taken</div>
                      <div className="font-medium">
                        {submission.timeTaken ? `${Math.floor(submission.timeTaken / 60)}h ${submission.timeTaken % 60}m` : '-'}
                      </div>
                    </div>
                  </div>
                </List.Item>
              );
            }}
          />
        ) : (
          <div className="text-center text-gray-500 py-8">
            <FileTextOutlined className="text-3xl mb-2" />
            <p>No pending evaluations</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default InstructorDashboard;
