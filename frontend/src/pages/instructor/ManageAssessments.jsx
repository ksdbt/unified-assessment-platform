import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, Select, Popconfirm, Spin, Transfer } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, TeamOutlined, UserAddOutlined } from '@ant-design/icons';
import { assessmentAPI, userAPI } from '../../services/api';
import { toast } from 'react-toastify';

const { Option } = Select;

const ManageAssessments = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [enrollModalVisible, setEnrollModalVisible] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [enrollingAssessment, setEnrollingAssessment] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [form] = Form.useForm();

  // Only fetch assessments on mount
  useEffect(() => {
    assessmentAPI.getInstructorAssessments()
      .then(res => setAssessments(res.data || []))
      .catch(err => toast.error('Failed to load assessments'))
      .finally(() => setLoading(false));
  }, []);

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
      const res = await assessmentAPI.update(editingAssessment._id, values);
      setAssessments(prev => prev.map(a => a._id === editingAssessment._id ? res.data : a));
      setEditModalVisible(false);
      form.resetFields();
      toast.success('Assessment updated successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to update assessment');
    }
  };

  const handleDelete = async (id) => {
    try {
      await assessmentAPI.delete(id);
      setAssessments(prev => prev.filter(a => a._id !== id));
      toast.success('Assessment deleted successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to delete assessment');
    }
  };

  // Fetch students ONLY when enroll button is clicked
  const handleEnroll = async (assessment) => {
    setEnrollingAssessment(assessment);
    setSelectedStudents(assessment.enrolledStudents?.map(s => s._id || s) || []);
    setEnrollModalVisible(true);
    
    // Fetch students now
    setLoadingStudents(true);
    try {
      const res = await userAPI.getStudents();
      setAllStudents(res.data || []);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleEnrollSubmit = async () => {
    try {
      const res = await assessmentAPI.enroll(enrollingAssessment._id, selectedStudents);
      setAssessments(prev => prev.map(a => a._id === enrollingAssessment._id ? res.data : a));
      setEnrollModalVisible(false);
      setSelectedStudents([]);
      setEnrollingAssessment(null);
      toast.success(`${selectedStudents.length} students enrolled successfully!`);
    } catch (error) {
      toast.error(error.message || 'Failed to enroll students');
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
    { title: 'Type', dataIndex: 'type', key: 'type', render: (type) => <Tag color="blue">{type}</Tag> },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={status === 'active' ? 'green' : status === 'draft' ? 'orange' : 'gray'}>{status}</Tag>
    },
    {
      title: 'Students',
      dataIndex: 'enrolledStudents',
      key: 'students',
      render: (students) => (
        <span>
          <TeamOutlined /> {students?.length || 0}
        </span>
      )
    },
    { title: 'Questions', dataIndex: 'totalQuestions', key: 'questions', render: (q) => `${q} questions` },
    { title: 'Duration', dataIndex: 'duration', key: 'duration', render: (d) => `${d} min` },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space wrap>
          <Button
            type="link"
            icon={<UserAddOutlined />}
            size="small"
            onClick={() => handleEnroll(record)}
          >
            Enroll
          </Button>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete Assessment?"
            description="This cannot be undone."
            onConfirm={() => handleDelete(record._id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  if (loading) return <div className="flex justify-center items-center h-64"><Spin size="large" /></div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Manage Assessments</h1>
          <p className="text-gray-600 dark:text-gray-400">Create, edit, and manage your assessments</p>
        </div>
        <Link to="/create-assessment">
          <Button type="primary" icon={<PlusOutlined />}>Create Assessment</Button>
        </Link>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={assessments}
          rowKey="_id"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} assessments` }}
          locale={{ emptyText: 'No assessments created yet' }}
        />
      </Card>

      {/* Edit Modal */}
      <Modal
        title="Edit Assessment"
        open={editModalVisible}
        onCancel={() => { setEditModalVisible(false); form.resetFields(); }}
        footer={[
          <Button key="cancel" onClick={() => { setEditModalVisible(false); form.resetFields(); }}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()}>
            Update
          </Button>
        ]}
      >
        <Form form={form} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select>
              <Option value="draft">Draft</Option>
              <Option value="active">Active</Option>
              <Option value="archived">Archived</Option>
            </Select>
          </Form.Item>
          <Form.Item name="duration" label="Duration (minutes)" rules={[{ required: true }]}>
            <Input type="number" min={1} />
          </Form.Item>
          <Form.Item name="passingScore" label="Passing Score (%)" rules={[{ required: true }]}>
            <Input type="number" min={0} max={100} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Enroll Students Modal */}
      <Modal
        title={`Enroll Students - ${enrollingAssessment?.title}`}
        open={enrollModalVisible}
        onCancel={() => {
          setEnrollModalVisible(false);
          setSelectedStudents([]);
          setEnrollingAssessment(null);
        }}
        onOk={handleEnrollSubmit}
        okText="Enroll Selected Students"
        width={700}
      >
        {loadingStudents ? (
          <div className="flex justify-center items-center py-12">
            <Spin size="large" />
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-gray-600">
                Select students to enroll in this assessment. Already enrolled students are pre-selected.
              </p>
            </div>

            <Transfer
              dataSource={allStudents.map(s => ({
                key: s._id,
                title: s.name,
                description: s.email,
                chosen: selectedStudents.includes(s._id)
              }))}
              titles={['Available Students', 'Enrolled Students']}
              targetKeys={selectedStudents}
              onChange={setSelectedStudents}
              render={item => `${item.title} - ${item.description}`}
              showSearch
              filterOption={(input, option) =>
                option.title.toLowerCase().includes(input.toLowerCase()) ||
                option.description.toLowerCase().includes(input.toLowerCase())
              }
              listStyle={{
                width: 300,
                height: 400
              }}
            />

            <div className="mt-4 text-sm text-gray-500">
              {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default ManageAssessments;