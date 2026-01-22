import React, { useState } from 'react';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, Select, Popconfirm, Statistic, Row, Col } from 'antd';
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  FlagOutlined,
  CheckCircleOutlined,
  StopOutlined,
  BookOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { assessments, updateAssessment, deleteAssessment } from '../../data/assessments';
import { submissions } from '../../data/submissions';
import { toast } from 'react-toastify';

const { Option } = Select;

const AssessmentOversight = () => {
  const [assessmentList, setAssessmentList] = useState(assessments);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [loading, setLoading] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'draft': return 'orange';
      case 'archived': return 'gray';
      case 'flagged': return 'red';
      default: return 'default';
    }
  };

  const handleEditAssessment = async (values) => {
    setLoading(true);
    try {
      const updatedAssessment = updateAssessment(editingAssessment.id, values);
      if (updatedAssessment) {
        setAssessmentList(prev => prev.map(assessment =>
          assessment.id === editingAssessment.id ? updatedAssessment : assessment
        ));
        setEditModalVisible(false);
        setEditingAssessment(null);
        toast.success('Assessment updated successfully!');
      }
    } catch (error) {
      toast.error('Failed to update assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssessment = async (assessmentId) => {
    try {
      const success = deleteAssessment(assessmentId);
      if (success) {
        setAssessmentList(prev => prev.filter(assessment => assessment.id !== assessmentId));
        toast.success('Assessment deleted successfully!');
      }
    } catch (error) {
      toast.error('Failed to delete assessment');
    }
  };

  const handleFlagAssessment = async (assessment) => {
    try {
      const newStatus = assessment.status === 'flagged' ? 'active' : 'flagged';
      const updatedAssessment = updateAssessment(assessment.id, { status: newStatus });
      if (updatedAssessment) {
        setAssessmentList(prev => prev.map(a =>
          a.id === assessment.id ? updatedAssessment : a
        ));
        toast.success(`Assessment ${newStatus === 'flagged' ? 'flagged' : 'unflagged'} successfully!`);
      }
    } catch (error) {
      toast.error('Failed to update assessment status');
    }
  };

  const handleArchiveAssessment = async (assessment) => {
    try {
      const updatedAssessment = updateAssessment(assessment.id, { status: 'archived' });
      if (updatedAssessment) {
        setAssessmentList(prev => prev.map(a =>
          a.id === assessment.id ? updatedAssessment : a
        ));
        toast.success('Assessment archived successfully!');
      }
    } catch (error) {
      toast.error('Failed to archive assessment');
    }
  };

  const getAssessmentStats = (assessmentId) => {
    const assessmentSubmissions = submissions.filter(s => s.assessmentId === assessmentId);
    const evaluated = assessmentSubmissions.filter(s => s.status === 'evaluated');
    const avgScore = evaluated.length > 0
      ? Math.round(evaluated.reduce((acc, s) => acc + s.percentage, 0) / evaluated.length)
      : 0;

    return {
      totalSubmissions: assessmentSubmissions.length,
      evaluatedSubmissions: evaluated.length,
      averageScore: avgScore
    };
  };

  const columns = [
    {
      title: 'Assessment',
      dataIndex: 'title',
      key: 'title',
      render: (title, record) => (
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-sm text-gray-600">{record.subject}</div>
        </div>
      )
    },
    {
      title: 'Instructor',
      dataIndex: 'instructorName',
      key: 'instructor',
      render: (name) => <span>{name}</span>
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color="blue">{type.charAt(0).toUpperCase() + type.slice(1)}</Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Tag>
      )
    },
    {
      title: 'Students',
      dataIndex: 'enrolledStudents',
      key: 'students',
      render: (students) => (
        <div className="flex items-center space-x-1">
          <TeamOutlined />
          <span>{students.length}</span>
        </div>
      )
    },
    {
      title: 'Submissions',
      key: 'submissions',
      render: (_, record) => {
        const stats = getAssessmentStats(record.id);
        return (
          <div className="text-center">
            <div className="font-medium">{stats.evaluatedSubmissions}/{stats.totalSubmissions}</div>
            <div className="text-sm text-gray-600">
              {stats.averageScore > 0 ? `${stats.averageScore}% avg` : 'No scores'}
            </div>
          </div>
        );
      }
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            size="small"
          >
            View
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            size="small"
            onClick={() => {
              setEditingAssessment(record);
              setEditModalVisible(true);
            }}
          >
            Edit
          </Button>
          <Button
            type={record.status === 'flagged' ? 'link' : 'link'}
            danger={record.status !== 'flagged'}
            icon={<FlagOutlined />}
            size="small"
            onClick={() => handleFlagAssessment(record)}
          >
            {record.status === 'flagged' ? 'Unflag' : 'Flag'}
          </Button>
          {record.status !== 'archived' && (
            <Button
              type="link"
              icon={<StopOutlined />}
              size="small"
              onClick={() => handleArchiveAssessment(record)}
            >
              Archive
            </Button>
          )}
          <Popconfirm
            title="Delete Assessment"
            description="Are you sure you want to delete this assessment? This action cannot be undone."
            onConfirm={() => handleDeleteAssessment(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // Calculate overview statistics
  const totalAssessments = assessmentList.length;
  const activeAssessments = assessmentList.filter(a => a.status === 'active').length;
  const flaggedAssessments = assessmentList.filter(a => a.status === 'flagged').length;
  const totalSubmissions = submissions.length;
  const evaluatedSubmissions = submissions.filter(s => s.status === 'evaluated').length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Assessment Oversight
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor and manage all assessments on the platform
        </p>
      </div>

      {/* Overview Statistics */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={6}>
          <Card className="text-center">
            <Statistic
              title="Total Assessments"
              value={totalAssessments}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="text-center">
            <Statistic
              title="Active Assessments"
              value={activeAssessments}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="text-center">
            <Statistic
              title="Flagged Assessments"
              value={flaggedAssessments}
              prefix={<FlagOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="text-center">
            <Statistic
              title="Total Submissions"
              value={totalSubmissions}
              valueStyle={{ color: '#722ed1' }}
            />
            <div className="text-sm text-gray-600 mt-2">
              {evaluatedSubmissions} evaluated
            </div>
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={assessmentList}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} assessments`
          }}
        />
      </Card>

      {/* Edit Assessment Modal */}
      <Modal
        title="Edit Assessment"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingAssessment(null);
        }}
        footer={null}
        width={600}
      >
        {editingAssessment && (
          <Form
            layout="vertical"
            onFinish={handleEditAssessment}
            initialValues={{
              title: editingAssessment.title,
              description: editingAssessment.description,
              status: editingAssessment.status,
              duration: editingAssessment.duration,
              passingScore: editingAssessment.passingScore
            }}
          >
            <Form.Item
              name="title"
              label="Title"
              rules={[{ required: true, message: 'Please enter assessment title' }]}
            >
              <Input placeholder="Enter assessment title" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: 'Please enter assessment description' }]}
            >
              <Input.TextArea rows={3} placeholder="Enter assessment description" />
            </Form.Item>

            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: 'Please select status' }]}
            >
              <Select placeholder="Select status">
                <Option value="draft">Draft</Option>
                <Option value="active">Active</Option>
                <Option value="archived">Archived</Option>
                <Option value="flagged">Flagged</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="duration"
              label="Duration (minutes)"
              rules={[{ required: true, message: 'Please enter duration' }]}
            >
              <Input type="number" min={1} placeholder="Enter duration in minutes" />
            </Form.Item>

            <Form.Item
              name="passingScore"
              label="Passing Score (%)"
              rules={[{ required: true, message: 'Please enter passing score' }]}
            >
              <Input type="number" min={0} max={100} placeholder="Enter passing score" />
            </Form.Item>

            <Form.Item className="mb-0 text-right">
              <Space>
                <Button onClick={() => {
                  setEditModalVisible(false);
                  setEditingAssessment(null);
                }}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Update Assessment
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default AssessmentOversight;
