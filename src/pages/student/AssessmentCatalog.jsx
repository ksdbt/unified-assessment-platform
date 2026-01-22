import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, Row, Col, Input, Select, Button, Tag, Badge, Empty } from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  BookOutlined,
  ClockCircleOutlined,
  UserOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { assessments, getAssessmentsByStudent } from '../../data/assessments';
import { submissions } from '../../data/submissions';

const { Option } = Select;

const AssessmentCatalog = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');

  // Get enrolled assessments
  const enrolledAssessments = getAssessmentsByStudent(user.id);
  const studentSubmissions = submissions.filter(sub => sub.studentId === user.id);

  // Get unique subjects and types
  const subjects = [...new Set(assessments.map(a => a.subject))];
  const types = [...new Set(assessments.map(a => a.type))];

  // Filter assessments
  const filteredAssessments = enrolledAssessments.filter(assessment => {
    const matchesSearch = assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessment.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = !subjectFilter || assessment.subject === subjectFilter;
    const matchesType = !typeFilter || assessment.type === typeFilter;
    const matchesDifficulty = !difficultyFilter || assessment.difficulty === difficultyFilter;

    return matchesSearch && matchesSubject && matchesType && matchesDifficulty;
  });

  const getAssessmentStatus = (assessment) => {
    const submission = studentSubmissions.find(sub => sub.assessmentId === assessment.id);
    if (!submission) {
      return { status: 'available', text: 'Available', color: 'blue' };
    }
    if (submission.status === 'pending') {
      return { status: 'pending', text: 'Submitted', color: 'orange' };
    }
    return { status: 'completed', text: 'Completed', color: 'green' };
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'green';
      case 'intermediate': return 'orange';
      case 'advanced': return 'red';
      default: return 'default';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'quiz': return <BookOutlined />;
      case 'exam': return <BookOutlined />;
      case 'assignment': return <BookOutlined />;
      default: return <BookOutlined />;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Assessment Catalog
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Browse and take your enrolled assessments
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Input
              placeholder="Search assessments..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="large"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Select
              placeholder="Filter by subject"
              value={subjectFilter}
              onChange={setSubjectFilter}
              className="w-full"
              size="large"
              allowClear
            >
              {subjects.map(subject => (
                <Option key={subject} value={subject}>{subject}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Select
              placeholder="Filter by type"
              value={typeFilter}
              onChange={setTypeFilter}
              className="w-full"
              size="large"
              allowClear
            >
              {types.map(type => (
                <Option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Select
              placeholder="Filter by difficulty"
              value={difficultyFilter}
              onChange={setDifficultyFilter}
              className="w-full"
              size="large"
              allowClear
            >
              <Option value="beginner">Beginner</Option>
              <Option value="intermediate">Intermediate</Option>
              <Option value="advanced">Advanced</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Assessment Cards */}
      {filteredAssessments.length > 0 ? (
        <Row gutter={[16, 16]}>
          {filteredAssessments.map((assessment) => {
            const status = getAssessmentStatus(assessment);
            const submission = studentSubmissions.find(sub => sub.assessmentId === assessment.id);

            return (
              <Col xs={24} sm={12} lg={8} key={assessment.id}>
                <Card
                  className="h-full hover:shadow-lg transition-shadow duration-200"
                  actions={[
                    <Link to={`/assessment/${assessment.id}`}>
                      <Button
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        disabled={status.status === 'completed'}
                        className="w-full"
                      >
                        {status.status === 'completed' ? 'View Results' : 'Start Assessment'}
                      </Button>
                    </Link>
                  ]}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(assessment.type)}
                        <span className="font-medium text-lg">{assessment.title}</span>
                      </div>
                      <Badge status={status.color} text={status.text} />
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                      {assessment.description}
                    </p>

                    {/* Metadata */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center space-x-1">
                          <UserOutlined />
                          <span>{assessment.instructorName}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <ClockCircleOutlined />
                          <span>{assessment.duration} min</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <Tag color={getDifficultyColor(assessment.difficulty)}>
                          {assessment.difficulty}
                        </Tag>
                        <span className="text-sm text-gray-600">
                          {assessment.totalQuestions} questions
                        </span>
                      </div>

                      {submission && submission.status === 'evaluated' && (
                        <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <div className="font-bold text-green-600">
                            Score: {submission.percentage}%
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Deadline */}
                    <div className="text-xs text-gray-500">
                      Deadline: {new Date(assessment.deadline).toLocaleDateString()}
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      ) : (
        <Empty
          description={
            searchTerm || subjectFilter || typeFilter || difficultyFilter
              ? "No assessments match your filters"
              : "No assessments available"
          }
        />
      )}
    </div>
  );
};

export default AssessmentCatalog;
