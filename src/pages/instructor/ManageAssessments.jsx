import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, Select, message, Popconfirm } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  TeamOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { getAssessmentsByInstructor, updateAssessment, deleteAssessment } from '../../data/assessments';
import { toast } from 'react-toastify';

const { Option } = Select;

const ManageAssessments = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState(getAssessmentsByInstructor(user.id));
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [form] = Form.useForm();

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'draft': return 'orange';
      case 'archived': return 'gray';
      default: return 'default';
    }
  };

  const handleEdit = (assessment) => {
    setEditingAssessment(assessment);
    form.setFieldsValue({
      title: assessment.title,
      description: assessment.description,
      status: assessment.status,
      duration: assessment.duration,
      passingScore: assessment.passingScore
    });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async (values) => {
    try {
      const updatedAssessment = updateAssessment(editingAssessment.id, values);
      if (updatedAssessment) {
        setAssessments(prev => prev.map(a => a.id === editingAssessment.id ? updatedAssessment : a));
        setEditModalVisible(false);
        setEditingAssessment(null);
        form.resetFields();
        toast.success('Assessment updated successfully!');
      }
    } catch (error) {
      toast.error('Failed to update assessment');
    }
  };

  const handleDelete = async (assessmentId) => {
    try {
      const success = deleteAssessment(assessmentId);
      if (success) {
        setAssessments(prev => prev.filter(a => a.id !== assessmentId));
        toast.success('Assessment deleted successfully!');
      }
    } catch (error) {
      toast.error('Failed to delete assessment');
    }
  };

  const columns = [
    {
      title: 'Title',
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
      title: 'Questions',
      dataIndex: 'totalQuestions',
      key: 'questions',
      render: (questions) => `${questions} questions`
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => `${duration} min`
    },
    {
      title: 'Deadline',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (deadline) => deadline ? new Date(deadline).toLocaleDateString() : 'No deadline'
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
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Assessment"
            description="Are you sure you want to delete this assessment? This action cannot be undone."
            onConfirm={() => handleDelete(record.id)}
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Manage Assessments
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create, edit, and manage your assessments
          </p>
        </div>
        <Link to="/create-assessment">
          <Button type="primary" icon={<PlusOutlined />}>
            Create Assessment
          </Button>
        </Link>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={assessments}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} assessments`
          }}
          locale={{
            emptyText: 'No assessments created yet'
          }}
        />
      </Card>

      {/* Edit Modal */}
      <Modal
        title="Edit Assessment"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingAssessment(null);
          form.resetFields();
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setEditModalVisible(false);
              setEditingAssessment(null);
              form.resetFields();
            }}
          >
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={() => form.submit()}
          >
            Update
          </Button>
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditSubmit}
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
        </Form>
      </Modal>
    </div>
  );
};

export default ManageAssessments;
