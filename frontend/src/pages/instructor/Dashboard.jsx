import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, Row, Col, Statistic, List, Progress, Avatar, Spin } from 'antd';
import {
  BookOutlined, TeamOutlined, ClockCircleOutlined,
  CheckCircleOutlined, FileTextOutlined, UserOutlined
} from '@ant-design/icons';
import { assessmentAPI, submissionAPI, userAPI } from '../../services/api';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';

const InstructorDashboard = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [totalStudentsCount, setTotalStudentsCount] = useState(0);
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assessmentsRes, submissionsRes, studentsRes] = await Promise.all([
          assessmentAPI.getInstructorAssessments(),
          submissionAPI.getPendingSubmissions(),
          userAPI.getInstructorStudentOverview()
        ]);
        setAssessments(assessmentsRes.data || []);
        setPendingSubmissions(submissionsRes.data || []);
        setTotalStudentsCount(studentsRes.data?.length || 0);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spin size="large" /></div>;
  }

  const totalAssessments = assessments.length;
  const activeAssessments = assessments.filter(a => a.status === 'active').length;
  const draftAssessments = assessments.filter(a => a.status === 'draft').length;
  const totalStudents = totalStudentsCount;

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const startsOnDate = assessments.filter(a =>
        a.scheduledAt && moment(a.scheduledAt).isSame(date, 'day')
      );
      const deadlinesOnDate = assessments.filter(a =>
        (a.expiresAt || a.deadline) && moment(a.expiresAt || a.deadline).isSame(date, 'day')
      );

      if (startsOnDate.length > 0 || deadlinesOnDate.length > 0) {
        return (
          <div className="flex flex-col items-center gap-0.5 mt-1">
            {startsOnDate.length > 0 && (
              <div className="flex gap-0.5">
                {startsOnDate.slice(0, 3).map((_, i) => <div key={`s-${i}`} className="w-1 h-1 bg-blue-500 rounded-full"></div>)}
                {startsOnDate.length > 3 && <div className="w-1 h-1 bg-blue-500 rounded-full opacity-50"></div>}
              </div>
            )}
            {deadlinesOnDate.length > 0 && (
              <div className="flex gap-0.5">
                {deadlinesOnDate.slice(0, 3).map((_, i) => <div key={`d-${i}`} className="w-1 h-1 bg-red-500 rounded-full"></div>)}
                {deadlinesOnDate.length > 3 && <div className="w-1 h-1 bg-red-500 rounded-full opacity-50"></div>}
              </div>
            )}
          </div>
        );
      }
    }
  };

  const recentAssessments = [...assessments]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  const statsCards = [
    { title: 'Total Assessments', value: totalAssessments, icon: <BookOutlined />, color: '#1890ff' },
    { title: 'Active Assessments', value: activeAssessments, icon: <CheckCircleOutlined />, color: '#52c41a' },
    { title: 'Pending Reviews', value: pendingSubmissions.length, icon: <ClockCircleOutlined />, color: '#faad14' },
    { title: 'Total Students', value: totalStudents, icon: <TeamOutlined />, color: '#722ed1' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <Avatar src={user.avatar} size={64} icon={<UserOutlined />} />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back, {user.name}!</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your assessments and evaluate student submissions</p>
        </div>
      </div>

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
        <Col xs={24} lg={12}>
          <Card title="Assessment Overview" className="h-full">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Active Assessments</span>
                <span className="font-bold text-green-600">{activeAssessments}</span>
              </div>
              <Progress percent={totalAssessments > 0 ? (activeAssessments / totalAssessments) * 100 : 0} status="active" strokeColor="#52c41a" />
              <div className="flex justify-between items-center">
                <span>Draft Assessments</span>
                <span className="font-bold text-orange-600">{draftAssessments}</span>
              </div>
              <Progress percent={totalAssessments > 0 ? (draftAssessments / totalAssessments) * 100 : 0} status="active" strokeColor="#faad14" />
            </div>
          </Card>
        </Col>

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
                        <div className="text-sm text-gray-600">{assessment.subject} • {assessment.questions?.length || assessment.totalQuestions || 0} questions</div>
                      </div>
                      <div className={`text-sm px-2 py-1 rounded ${assessment.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                        {assessment.status}
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <div className="text-center text-gray-500 py-8">No assessments created yet</div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title="Assessment Schedule"
            variant="borderless"
            className="shadow-sm h-full"
            styles={{ body: { padding: '0px' } }}
          >
            <div className="p-4 flex justify-center">
              <Calendar
                onChange={setDate}
                value={date}
                tileContent={tileContent}
                className="border-none w-full"
              />
            </div>
            <div className="px-4 pb-4">
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase mb-2">Starts on {moment(date).format('MMM DD')}</div>
                  {assessments.filter(a => a.scheduledAt && moment(a.scheduledAt).isSame(date, 'day')).length > 0 ? (
                    assessments.filter(a => a.scheduledAt && moment(a.scheduledAt).isSame(date, 'day')).map(a => (
                      <div key={`s-${a._id}`} className="text-xs py-1.5 px-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300 mb-1 flex justify-between">
                        <span>• {a.title}</span>
                        <span>{moment(a.scheduledAt).format('hh:mm A')}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-[10px] text-gray-400 italic px-2">No assessments start today</div>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase mb-2">Deadlines on {moment(date).format('MMM DD')}</div>
                  {assessments.filter(a => (a.expiresAt || a.deadline) && moment(a.expiresAt || a.deadline).isSame(date, 'day')).length > 0 ? (
                    assessments.filter(a => (a.expiresAt || a.deadline) && moment(a.expiresAt || a.deadline).isSame(date, 'day')).map(a => (
                      <div key={`d-${a._id}`} className="text-xs py-1.5 px-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-100 dark:border-red-800 text-red-700 dark:text-red-300 mb-1 flex justify-between">
                        <span>• {a.title}</span>
                        <span>{moment(a.expiresAt || a.deadline).format('hh:mm A')}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-[10px] text-gray-400 italic px-2">No deadlines today</div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Pending Evaluations" className="h-full">
            {pendingSubmissions.length > 0 ? (
              <List
                dataSource={pendingSubmissions}
                renderItem={(submission) => (
                  <List.Item>
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center space-x-3">
                        <Avatar icon={<UserOutlined />} size="small" />
                        <div>
                          <div className="font-medium">{submission.studentName}</div>
                          <div className="text-sm text-gray-600">
                            {submission.assessmentId?.title || 'Assessment Details Unavailable'} • Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Time taken</div>
                        <div className="font-medium">
                          {submission.timeTaken ? (
                            submission.timeTaken > 3600
                              ? `${Math.floor(submission.timeTaken / 3600)}h ${Math.floor((submission.timeTaken % 3600) / 60)}m`
                              : `${Math.floor(submission.timeTaken / 60)}m ${submission.timeTaken % 60}s`
                          ) : '-'}
                        </div>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <div className="text-center text-gray-500 py-8">
                <FileTextOutlined className="text-3xl mb-2" />
                <p>No pending evaluations</p>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div >
  );
};

export default InstructorDashboard;