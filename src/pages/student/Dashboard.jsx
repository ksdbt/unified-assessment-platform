import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, Row, Col, Statistic, Progress, Avatar, List } from 'antd';
import {
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  CalendarOutlined,
  UserOutlined
} from '@ant-design/icons';
import { getAssessmentsByStudent } from '../../data/assessments';
import { getSubmissionsByStudent, submissions } from '../../data/submissions';

const StudentDashboard = () => {
  const { user } = useAuth();

  // Get student-specific data
  const enrolledAssessments = getAssessmentsByStudent(user.id);
  const studentSubmissions = getSubmissionsByStudent(user.id);

  // Calculate stats
  const completedAssessments = studentSubmissions.filter(sub => sub.status === 'evaluated').length;
  const pendingAssessments = enrolledAssessments.filter(assessment => {
    const submission = studentSubmissions.find(sub => sub.assessmentId === assessment.id);
    return !submission || submission.status === 'pending';
  }).length;

  const averageScore = studentSubmissions
    .filter(sub => sub.status === 'evaluated')
    .reduce((acc, sub) => acc + sub.percentage, 0) / completedAssessments || 0;

  // Recent submissions
  const recentSubmissions = studentSubmissions
    .slice()
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    .slice(0, 3);

  // Upcoming assessments
  const upcomingAssessments = enrolledAssessments
    .filter(assessment => {
      const submission = studentSubmissions.find(sub => sub.assessmentId === assessment.id);
      return !submission && new Date(assessment.deadline) > new Date();
    })
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 3);

  const statsCards = [
    {
      title: 'Total Assessments',
      value: enrolledAssessments.length,
      icon: <BookOutlined />,
      color: '#1890ff'
    },
    {
      title: 'Completed',
      value: completedAssessments,
      icon: <CheckCircleOutlined />,
      color: '#52c41a'
    },
    {
      title: 'Pending',
      value: pendingAssessments,
      icon: <ClockCircleOutlined />,
      color: '#faad14'
    },
    {
      title: 'Average Score',
      value: averageScore.toFixed(1),
      suffix: '%',
      icon: <TrophyOutlined />,
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
            Here's your assessment overview
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
                suffix={stat.suffix}
                prefix={<span style={{ color: stat.color }}>{stat.icon}</span>}
                valueStyle={{ color: stat.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Progress Overview */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Assessment Progress" className="h-full">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Completion</span>
                  <span>{Math.round((completedAssessments / enrolledAssessments.length) * 100)}%</span>
                </div>
                <Progress
                  percent={Math.round((completedAssessments / enrolledAssessments.length) * 100)}
                  status="active"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{completedAssessments}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{pendingAssessments}</div>
                  <div className="text-sm text-gray-600">Pending</div>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Recent Performance" className="h-full">
            {recentSubmissions.length > 0 ? (
              <List
                dataSource={recentSubmissions}
                renderItem={(submission) => {
                  const assessment = enrolledAssessments.find(a => a.id === submission.assessmentId);
                  return (
                    <List.Item>
                      <div className="flex justify-between items-center w-full">
                        <div>
                          <div className="font-medium">{assessment?.title}</div>
                          <div className="text-sm text-gray-600">
                            Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${submission.percentage >= 70 ? 'text-green-600' : submission.percentage >= 50 ? 'text-orange-600' : 'text-red-600'}`}>
                            {submission.percentage}%
                          </div>
                          <div className="text-sm text-gray-600">{submission.totalScore}/{submission.maxScore}</div>
                        </div>
                      </div>
                    </List.Item>
                  );
                }}
              />
            ) : (
              <div className="text-center text-gray-500 py-8">
                No submissions yet
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Upcoming Assessments */}
      <Card title="Upcoming Assessments">
        {upcomingAssessments.length > 0 ? (
          <List
            dataSource={upcomingAssessments}
            renderItem={(assessment) => (
              <List.Item>
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center space-x-3">
                    <CalendarOutlined className="text-blue-600" />
                    <div>
                      <div className="font-medium">{assessment.title}</div>
                      <div className="text-sm text-gray-600">
                        {assessment.subject} • {assessment.duration} minutes
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Due</div>
                    <div className="font-medium">
                      {new Date(assessment.deadline).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </List.Item>
            )}
          />
        ) : (
          <div className="text-center text-gray-500 py-8">
            No upcoming assessments
          </div>
        )}
      </Card>
    </div>
  );
};

export default StudentDashboard;
