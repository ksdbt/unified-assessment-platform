import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, Table, Avatar, Progress, Tag, Select, Input, Space, Statistic, Row, Col } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  TrophyOutlined,
  SearchOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { getAssessmentsByInstructor } from '../../data/assessments';
import { getSubmissionsByAssessment } from '../../data/submissions';
import { getUsersByRole } from '../../data/users';

const { Option } = Select;

const StudentOverview = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [assessmentFilter, setAssessmentFilter] = useState('');

  const myAssessments = getAssessmentsByInstructor(user.id);
  const allStudents = getUsersByRole('student');

  // Get all submissions for instructor's assessments
  const allSubmissions = myAssessments.flatMap(assessment =>
    getSubmissionsByAssessment(assessment.id)
  );

  // Calculate student performance data
  const studentPerformance = allStudents.map(student => {
    const studentSubmissions = allSubmissions.filter(sub => sub.studentId === student.id);
    const evaluatedSubmissions = studentSubmissions.filter(sub => sub.status === 'evaluated');

    const totalAssessments = studentSubmissions.length;
    const completedAssessments = evaluatedSubmissions.length;
    const averageScore = evaluatedSubmissions.length > 0
      ? Math.round(evaluatedSubmissions.reduce((acc, sub) => acc + sub.percentage, 0) / evaluatedSubmissions.length)
      : 0;

    return {
      ...student,
      totalAssessments,
      completedAssessments,
      averageScore,
      submissions: studentSubmissions
    };
  }).filter(student => student.totalAssessments > 0); // Only show students with submissions

  // Filter students
  const filteredStudents = studentPerformance.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Calculate overall statistics
  const totalStudents = studentPerformance.length;
  const averageClassScore = studentPerformance.length > 0
    ? Math.round(studentPerformance.reduce((acc, student) => acc + student.averageScore, 0) / studentPerformance.length)
    : 0;
  const totalSubmissions = allSubmissions.length;
  const evaluatedSubmissions = allSubmissions.filter(sub => sub.status === 'evaluated').length;

  const columns = [
    {
      title: 'Student',
      dataIndex: 'name',
      key: 'student',
      render: (name, record) => (
        <div className="flex items-center space-x-3">
          <Avatar src={record.avatar} icon={<UserOutlined />} />
          <div>
            <div className="font-medium">{name}</div>
            <div className="text-sm text-gray-600">{record.email}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Assessments',
      dataIndex: 'totalAssessments',
      key: 'assessments',
      render: (total, record) => (
        <div className="text-center">
          <div className="font-medium">{record.completedAssessments}/{total}</div>
          <Progress
            percent={total > 0 ? Math.round((record.completedAssessments / total) * 100) : 0}
            size="small"
            showInfo={false}
          />
        </div>
      )
    },
    {
      title: 'Average Score',
      dataIndex: 'averageScore',
      key: 'averageScore',
      render: (score) => (
        <div className="text-center">
          <div className={`text-lg font-bold ${score >= 80 ? 'text-green-600' : score >= 60 ? 'text-orange-600' : 'text-red-600'}`}>
            {score}%
          </div>
        </div>
      )
    },
    {
      title: 'Performance',
      key: 'performance',
      render: (_, record) => {
        let performanceLevel = 'Poor';
        let color = 'red';

        if (record.averageScore >= 90) {
          performanceLevel = 'Excellent';
          color = 'green';
        } else if (record.averageScore >= 80) {
          performanceLevel = 'Good';
          color = 'blue';
        } else if (record.averageScore >= 70) {
          performanceLevel = 'Average';
          color = 'orange';
        }

        return <Tag color={color}>{performanceLevel}</Tag>;
      }
    },
    {
      title: 'Recent Activity',
      key: 'activity',
      render: (_, record) => {
        const latestSubmission = record.submissions
          .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0];

        if (!latestSubmission) return <span className="text-gray-500">No activity</span>;

        return (
          <div className="text-sm">
            <div>{new Date(latestSubmission.submittedAt).toLocaleDateString()}</div>
            <div className="text-gray-600">
              {latestSubmission.status === 'evaluated' ? `${latestSubmission.percentage}%` : 'Pending'}
            </div>
          </div>
        );
      }
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Student Overview
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor student performance and progress
        </p>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Students"
              value={totalStudents}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Class Average"
              value={averageClassScore}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Submissions"
              value={totalSubmissions}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Evaluated"
              value={evaluatedSubmissions}
              suffix={`/ ${totalSubmissions}`}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search students by name or email..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="large"
            />
          </div>
          <div className="w-full sm:w-64">
            <Select
              placeholder="Filter by assessment"
              value={assessmentFilter}
              onChange={setAssessmentFilter}
              className="w-full"
              size="large"
              allowClear
            >
              {myAssessments.map(assessment => (
                <Option key={assessment.id} value={assessment.id}>
                  {assessment.title}
                </Option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {/* Students Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredStudents}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} students`
          }}
          locale={{
            emptyText: 'No students found'
          }}
        />
      </Card>
    </div>
  );
};

export default StudentOverview;
