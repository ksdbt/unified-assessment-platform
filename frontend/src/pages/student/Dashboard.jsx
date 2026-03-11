import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, Row, Col, Statistic, Progress, Avatar, List, Spin } from 'antd';
import {
  BookOutlined, CheckCircleOutlined, ClockCircleOutlined,
  TrophyOutlined, CalendarOutlined, UserOutlined
} from '@ant-design/icons';
import { assessmentAPI, submissionAPI } from '../../services/api';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import moment from 'moment';
import CategoryCard from '../../components/dashboard/CategoryCard';
import { categoryAPI } from '../../services/api';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assessmentsRes, submissionsRes, categoriesRes, statsRes] = await Promise.all([
          assessmentAPI.getStudentAssessments(),
          submissionAPI.getStudentSubmissions(),
          categoryAPI.getCategories(),
          submissionAPI.getDashboardStats()
        ]);
        setAssessments(assessmentsRes.data || []);
        setSubmissions(submissionsRes.data || []);
        setCategories(categoriesRes.data || []);
        setStats(statsRes.data);
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
      const deadline = a.expiresAt || a.deadline;
      return !hasSubmission && deadline && new Date(deadline) > new Date();
    })
    .sort((a, b) => new Date(a.expiresAt || a.deadline) - new Date(b.expiresAt || b.deadline))
    .slice(0, 3);

  // Performance Data for Graph
  const performanceData = stats?.trends || [];
  const categoryChartData = stats?.categoryStats || [];
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const assessmentsOnDate = assessments.filter(a =>
        (a.expiresAt || a.deadline || a.scheduledAt) &&
        moment(a.expiresAt || a.deadline || a.scheduledAt).isSame(date, 'day')
      );
      return assessmentsOnDate.length > 0 ? (
        <div className="flex justify-center">
          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
        </div>
      ) : null;
    }
  };

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
    { title: 'Completed', value: stats?.totalQuizzes || 0, icon: <CheckCircleOutlined />, color: '#52c41a' },
    { title: 'Average Score', value: stats?.avgScore || 0, suffix: '%', icon: <TrophyOutlined />, color: '#722ed1' },
    { title: 'Best Score', value: stats?.bestScore || 0, suffix: '%', icon: <TrophyOutlined />, color: '#faad14' }
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

      {/* Category Selection Section (Milestone 1 Task 5) */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Explore Quiz Categories</h2>
        <Row gutter={[16, 16]}>
          {categories.map(cat => (
            <Col xs={24} sm={12} md={8} lg={6} key={cat._id}>
              <CategoryCard
                category={cat}
                onClick={async (c) => {
                  setSelectedCategory(c);
                  const res = await categoryAPI.getSubcategories(c._id);
                  setSubcategories(res.data || []);
                }}
                active={selectedCategory?._id === cat._id}
              />
            </Col>
          ))}
        </Row>

        {selectedCategory && (
          <Card className="mt-4 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 animate-fadeIn">
            <h3 className="font-bold text-indigo-800 dark:text-indigo-300 mb-3 flex items-center">
              Available in {selectedCategory.name}:
            </h3>
            <div className="flex flex-wrap gap-2">
              {subcategories.map(sub => (
                <div
                  key={sub._id}
                  className="px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-indigo-100 hover:border-indigo-400 cursor-pointer transition-colors"
                >
                  {sub.name}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Stats Row */}
      <Row gutter={[16, 16]} className="mb-6">
        {statsCards.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card variant="borderless" className="shadow-sm h-full">
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
            variant="borderless"
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
            variant="borderless"
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
                        <div className={`text-lg font-bold ${(submission.percentage || 0) >= 70
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

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={12}>
          <Card title="Performance Trends" variant="borderless" className="shadow-sm h-full">
            {performanceData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#1890ff" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <TrophyOutlined className="text-4xl mb-2" />
                <p>Complete assessments to see your trends</p>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Category Distribution" variant="borderless" className="shadow-sm h-full">
            {categoryChartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {categoryChartData.map((d, i) => (
                    <div key={d.name} className="flex items-center space-x-1 text-xs">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                      <span>{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <BookOutlined className="text-4xl mb-2" />
                <p>No data available</p>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={16}>
          <Card title="Upcoming Assessments" variant="borderless" className="shadow-sm h-full">
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
                          <div className="font-medium text-gray-800 dark:text-gray-200">{assessment.title}</div>
                          <div className="text-sm text-gray-500">{assessment.subject} • {assessment.duration} min</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-400 uppercase tracking-wide">Due</div>
                        <div className="font-semibold text-gray-700 dark:text-gray-300">{new Date(assessment.expiresAt || assessment.deadline).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 text-center">
                <CalendarOutlined className="text-4xl mb-2" />
                <p>No upcoming assessments</p>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Assessment Calendar" variant="borderless" className="shadow-sm h-full" styles={{ body: { padding: '8px' } }}>
            <Calendar onChange={setDate} value={date} tileContent={tileContent} className="border-none w-full" />
            <div className="mt-4 px-2">
              <div className="text-xs font-bold text-gray-400 uppercase mb-2">Events: {moment(date).format('MMM DD')}</div>
              {assessments.filter(a => (a.expiresAt || a.deadline || a.scheduledAt) && moment(a.expiresAt || a.deadline || a.scheduledAt).isSame(date, 'day')).map(a => (
                <div key={a._id} className="text-xs py-1 text-indigo-600 font-medium">• {a.title} ({moment(a.expiresAt || a.deadline || a.scheduledAt).format('hh:mm A')})</div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

    </div>
  );
};

export default StudentDashboard;