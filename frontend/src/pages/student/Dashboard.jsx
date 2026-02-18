import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, Row, Col, Statistic, Progress, Avatar, List, Spin } from 'antd';
import {
  BookOutlined, CheckCircleOutlined, ClockCircleOutlined,
  TrophyOutlined, CalendarOutlined, UserOutlined
} from '@ant-design/icons';
import { assessmentAPI, submissionAPI } from '../../services/api';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assessmentsRes, submissionsRes] = await Promise.all([
          assessmentAPI.getStudentAssessments(),
          submissionAPI.getStudentSubmissions()
        ]);
        setAssessments(assessmentsRes.data || []);
        setSubmissions(submissionsRes.data || []);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const completedAssessments = submissions.filter(s => s.status === 'evaluated').length;
  const pendingAssessments = assessments.filter(a => {
    return !submissions.find(s => s.assessmentId?._id === a._id || s.assessmentId === a._id);
  }).length;

  const evaluated = submissions.filter(s => s.status === 'evaluated');
  const averageScore = evaluated.length > 0
    ? (evaluated.reduce((acc, s) => acc + (s.percentage || 0), 0) / evaluated.length).toFixed(1)
    : 0;

  const recentSubmissions = [...submissions]
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    .slice(0, 3);

  const upcomingAssessments = assessments
    .filter(a => {
      const hasSubmission = submissions.find(s => s.assessmentId?._id === a._id || s.assessmentId === a._id);
      return !hasSubmission && a.deadline && new Date(a.deadline) > new Date();
    })
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 3);

  const completionPercent = assessments.length > 0
    ? Math.round((completedAssessments / assessments.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  const statsCards = [
    { title: 'Total Assessments', value: assessments.length, icon: <BookOutlined />, color: '#1890ff' },
    { title: 'Completed', value: completedAssessments, icon: <CheckCircleOutlined />, color: '#52c41a' },
    { title: 'Pending', value: pendingAssessments, icon: <ClockCircleOutlined />, color: '#faad14' },
    { title: 'Average Score', value: averageScore, suffix: '%', icon: <TrophyOutlined />, color: '#722ed1' }
  ];

  return (
    <div className="p-6">

      {/* Welcome Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Avatar src={user.avatar} size={64} icon={<UserOutlined />} />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white m-0">
            Welcome back, {user.name}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 mb-0">
            Here's your assessment overview
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <Row gutter={[16, 16]} className="mb-6">
        {statsCards.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card bordered={false} className="shadow-sm h-full">
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

      {/* Progress + Recent Performance */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={12}>
          <Card
            title="Assessment Progress"
            bordered={false}
            className="shadow-sm"
            style={{ height: '100%' }}
          >
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Overall Completion</span>
                <span className="font-semibold">{completionPercent}%</span>
              </div>
              <Progress percent={completionPercent} status="active" strokeColor="#1890ff" />
            </div>
            <Row gutter={16} className="mt-6 text-center">
              <Col span={12}>
                <div className="text-3xl font-bold text-green-500">{completedAssessments}</div>
                <div className="text-sm text-gray-500 mt-1">Completed</div>
              </Col>
              <Col span={12}>
                <div className="text-3xl font-bold text-orange-400">{pendingAssessments}</div>
                <div className="text-sm text-gray-500 mt-1">Pending</div>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="Recent Performance"
            bordered={false}
            className="shadow-sm"
            style={{ height: '100%' }}
          >
            {recentSubmissions.length > 0 ? (
              <List
                dataSource={recentSubmissions}
                renderItem={(submission) => (
                  <List.Item className="px-0">
                    <div className="flex justify-between items-center w-full">
                      <div>
                        <div className="font-medium text-gray-800 dark:text-gray-200">
                          {submission.assessmentId?.title || 'Assessment'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          (submission.percentage || 0) >= 70
                            ? 'text-green-500'
                            : (submission.percentage || 0) >= 50
                            ? 'text-orange-400'
                            : 'text-red-500'
                        }`}>
                          {submission.percentage !== null ? `${submission.percentage}%` : 'Pending'}
                        </div>
                        {submission.totalScore !== null && (
                          <div className="text-xs text-gray-500">
                            {submission.totalScore}/{submission.maxScore} pts
                          </div>
                        )}
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <TrophyOutlined className="text-4xl mb-2" />
                <p className="m-0">No submissions yet</p>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Upcoming Assessments */}
      <Card title="Upcoming Assessments" bordered={false} className="shadow-sm">
        {upcomingAssessments.length > 0 ? (
          <List
            dataSource={upcomingAssessments}
            renderItem={(assessment) => (
              <List.Item className="px-0">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50">
                      <CalendarOutlined className="text-blue-500 text-lg" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-800 dark:text-gray-200">
                        {assessment.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {assessment.subject} • {assessment.duration} minutes
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400 uppercase tracking-wide">Due</div>
                    <div className="font-semibold text-gray-700 dark:text-gray-300">
                      {new Date(assessment.deadline).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </List.Item>
            )}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <CalendarOutlined className="text-4xl mb-2" />
            <p className="m-0">No upcoming assessments</p>
          </div>
        )}
      </Card>

    </div>
  );
};

export default StudentDashboard;