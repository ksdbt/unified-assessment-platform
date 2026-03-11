import React, { useState, useEffect } from 'react';
import { Card, Table, Avatar, Progress, Tag, Input, Select, Statistic, Row, Col, Spin } from 'antd';
import { UserOutlined, TeamOutlined, TrophyOutlined, SearchOutlined } from '@ant-design/icons';
import { userAPI } from '../../services/api';

const { Option } = Select;

const StudentOverview = () => {
  const [students, setStudents] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    userAPI.getInstructorStudentOverview()
      .then(res => {
        setStudents(res.data || []);
        setAssessments(res.assessments || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);
  console.log('Fetched students:', students);
  console.log('Fetched assessments:', assessments);
  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStudents = students.length;
  const averageClassScore = students.length > 0
    ? Math.round(students.reduce((acc, s) => acc + (s.averageScore || 0), 0) / students.length)
    : 0;
  const totalSubmissions = students.reduce((acc, s) => acc + (s.totalAssessments || 0), 0);
  const evaluated = students.reduce((acc, s) => acc + (s.completedAssessments || 0), 0);

  const columns = [
    {
      title: 'Student', key: 'student',
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <Avatar src={record.avatar} icon={<UserOutlined />} />
          <div>
            <div className="font-medium">{record.name}</div>
            <div className="text-sm text-gray-600">{record.email}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Assessments', key: 'assessments',
      render: (_, record) => (
        <div className="text-center">
          <div className="font-medium">{record.completedAssessments}/{record.totalAssessments}</div>
          <Progress percent={record.totalAssessments > 0 ? Math.round((record.completedAssessments / record.totalAssessments) * 100) : 0} size="small" showInfo={false} />
        </div>
      )
    },
    {
      title: 'Average Score', dataIndex: 'averageScore', key: 'averageScore',
      render: (score) => (
        <div className={`text-lg font-bold text-center ${score >= 80 ? 'text-green-600' : score >= 60 ? 'text-orange-600' : 'text-red-600'}`}>
          {score}%
        </div>
      )
    },
    {
      title: 'Trust Score', dataIndex: 'trustScore', key: 'trustScore',
      render: (score) => {
        if (score === undefined || score === null) return <span className="text-gray-400">N/A</span>;
        const color = score >= 90 ? '#52c41a' : score >= 70 ? '#faad14' : '#f5222d';
        return (
          <div className="flex flex-col items-center">
            <Progress type="circle" percent={score} size={40} strokeColor={color} />
          </div>
        );
      }
    },
    {
      title: 'Performance', key: 'performance',
      render: (_, record) => {
        const score = record.averageScore || 0;
        const trust = record.trustScore !== undefined ? record.trustScore : 100;

        let label = score >= 90 ? 'Excellent' : score >= 80 ? 'Good' : score >= 70 ? 'Average' : 'Poor';
        let color = score >= 90 ? 'green' : score >= 80 ? 'blue' : score >= 70 ? 'orange' : 'red';

        // Override with behavioral flags if trust score is low
        if (trust < 50) {
          label = 'Critical Risk';
          color = 'red';
        } else if (trust < 80) {
          label = 'Review Needed';
          color = 'purple';
        }

        return <Tag color={color}>{label}</Tag>;
      }
    },
    {
      title: 'Recent Activity', key: 'activity',
      render: (_, record) => {
        const latest = record.submissions?.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0];
        if (!latest) return <span className="text-gray-500">No activity</span>;
        return (
          <div className="text-sm">
            <div>{new Date(latest.submittedAt).toLocaleDateString()}</div>
            <div className="text-gray-600">{latest.status === 'evaluated' ? `${latest.percentage}%` : 'Pending'}</div>
          </div>
        );
      }
    }
  ];

  if (loading) return <div className="flex justify-center items-center h-64"><Spin size="large" /></div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Student Overview</h1>
        <p className="text-gray-600 dark:text-gray-400">Monitor student performance and progress</p>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="Total Students" value={totalStudents} prefix={<TeamOutlined />} valueStyle={{ color: '#1890ff' }} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="Class Average" value={averageClassScore} suffix="%" prefix={<TrophyOutlined />} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="Total Submissions" value={totalSubmissions} valueStyle={{ color: '#722ed1' }} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="Evaluated" value={evaluated} suffix={`/ ${totalSubmissions}`} valueStyle={{ color: '#faad14' }} /></Card>
        </Col>
      </Row>

      <Card className="mb-6">
        <Input placeholder="Search students by name or email..." prefix={<SearchOutlined />} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} size="large" />
      </Card>

      <Card>
        <Table columns={columns} dataSource={filteredStudents} rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} students` }}
          locale={{ emptyText: 'No students found' }}
        />
      </Card>
    </div>
  );
};

export default StudentOverview;