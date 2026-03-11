import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, Row, Col, Input, Select, Button, Tag, Empty, Spin } from 'antd';
import { SearchOutlined, BookOutlined, ClockCircleOutlined, UserOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { assessmentAPI, submissionAPI } from '../../services/api';

const { Option } = Select;

const AssessmentCatalog = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');

  useEffect(() => {
    Promise.all([
      assessmentAPI.getStudentAssessments(),
      submissionAPI.getStudentSubmissions()
    ]).then(([aRes, sRes]) => {
      setAssessments(aRes.data || []);
      setSubmissions(sRes.data || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const subjects = [...new Set(assessments.map(a => a.subject).filter(Boolean))];
  const types = [...new Set(assessments.map(a => a.type).filter(Boolean))];

  const filteredAssessments = assessments.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) || a.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = !subjectFilter || a.subject === subjectFilter;
    const matchesType = !typeFilter || a.type === typeFilter;
    const matchesDifficulty = !difficultyFilter || a.difficulty === difficultyFilter;
    return matchesSearch && matchesSubject && matchesType && matchesDifficulty;
  });

  const getAssessmentStatus = (assessment) => {
    const submission = submissions.find(s => {
      const aid = s.assessmentId?._id || s.assessmentId;
      return aid === assessment._id;
    });
    if (!submission) return { status: 'available', text: 'Available', color: 'blue' };
    if (submission.status === 'pending') return { status: 'submitted', text: 'Submitted', color: 'orange' };
    return { status: 'completed', text: 'Completed', color: 'green' };
  };

  const getDifficultyColor = (d) => d === 'beginner' ? 'green' : d === 'intermediate' ? 'orange' : 'red';

  if (loading) return <div className="flex justify-center items-center h-64"><Spin size="large" /></div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Assessment Catalog</h1>
        <p className="text-gray-600 dark:text-gray-400">Browse and take your enrolled assessments</p>
      </div>

      <Card className="mb-6">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Input placeholder="Search assessments..." prefix={<SearchOutlined />} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} size="large" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Select placeholder="Filter by subject" value={subjectFilter} onChange={setSubjectFilter} className="w-full" size="large" allowClear>
              {subjects.map(s => <Option key={s} value={s}>{s}</Option>)}
            </Select>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Select placeholder="Filter by type" value={typeFilter} onChange={setTypeFilter} className="w-full" size="large" allowClear>
              {types.map(t => <Option key={t} value={t}>{t && typeof t === 'string' ? t.charAt(0).toUpperCase() + t.slice(1) : 'Objective'}</Option>)}
            </Select>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Select placeholder="Filter by difficulty" value={difficultyFilter} onChange={setDifficultyFilter} className="w-full" size="large" allowClear>
              <Option value="beginner">Beginner</Option>
              <Option value="intermediate">Intermediate</Option>
              <Option value="advanced">Advanced</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {filteredAssessments.length > 0 ? (
        <Row gutter={[16, 16]}>
          {filteredAssessments.map((assessment) => {
            const status = getAssessmentStatus(assessment);
            const submission = submissions.find(s => {
              const aid = s.assessmentId?._id || s.assessmentId;
              return aid === assessment._id;
            });
            return (
              <Col xs={24} sm={12} lg={8} key={assessment._id}>
                <Card className="h-full hover:shadow-lg transition-shadow duration-200"
                  actions={[
                    <Link to={`/assessment/${assessment._id}`}>
                      <Button type="primary" icon={<PlayCircleOutlined />} disabled={status.status === 'completed'} className="w-full">
                        {status.status === 'completed' ? 'Completed' : status.status === 'submitted' ? 'Submitted' : 'Start Assessment'}
                      </Button>
                    </Link>
                  ]}>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <BookOutlined />
                        <span className="font-medium text-lg">{assessment.title}</span>
                      </div>
                      <Tag color={status.color}>{status.text}</Tag>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2">{assessment.description}</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center space-x-1"><UserOutlined /><span>{assessment.instructorName}</span></span>
                        <span className="flex items-center space-x-1"><ClockCircleOutlined /><span>{assessment.duration} min</span></span>
                      </div>
                      <div className="flex items-center justify-between">
                        <Tag color={getDifficultyColor(assessment.difficulty)}>{assessment.difficulty}</Tag>
                        <span className="text-sm text-gray-600">{assessment.totalQuestions || assessment.questions?.length || 0} questions</span>
                      </div>
                      {submission?.status === 'evaluated' && (
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="font-bold text-green-600">Score: {submission.percentage}%</div>
                        </div>
                      )}
                    </div>
                    {assessment.deadline && (
                      <div className="text-xs text-gray-500">Deadline: {new Date(assessment.deadline).toLocaleDateString()}</div>
                    )}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      ) : (
        <Empty description={searchTerm || subjectFilter || typeFilter || difficultyFilter ? 'No assessments match your filters' : 'No assessments available'} />
      )}
    </div>
  );
};

export default AssessmentCatalog;