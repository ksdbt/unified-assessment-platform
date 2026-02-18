import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, Select, Popconfirm, Statistic, Row, Col, Spin } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, FlagOutlined, StopOutlined, BookOutlined, TeamOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { assessmentAPI } from '../../services/api';
import { toast } from 'react-toastify';

const { Option } = Select;

const AssessmentOversight = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    assessmentAPI.getAdminAssessments()
      .then(res => setAssessments(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async (values) => {
    setSaving(true);
    try {
      const res = await assessmentAPI.update(editingAssessment._id, values);
      setAssessments(prev => prev.map(a => a._id === editingAssessment._id ? res.data : a));
      setEditModalVisible(false);
      form.resetFields();
      toast.success('Assessment updated!');
    } catch (error) {
      toast.error(error.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await assessmentAPI.delete(id);
      setAssessments(prev => prev.filter(a => a._id !== id));
      toast.success('Assessment deleted!');
    } catch (error) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const handleFlag = async (assessment) => {
    const newStatus = assessment.status === 'flagged' ? 'active' : 'flagged';
    try {
      const res = await assessmentAPI.update(assessment._id, { status: newStatus });
      setAssessments(prev => prev.map(a => a._id === assessment._id ? res.data : a));
      toast.success(`Assessment ${newStatus === 'flagged' ? 'flagged' : 'unflagged'}!`);
    } catch (error) {
      toast.error(error.message || 'Failed to update');
    }
  };

  const handleArchive = async (assessment) => {
    try {
      const res = await assessmentAPI.update(assessment._id, { status: 'archived' });
      setAssessments(prev => prev.map(a => a._id === assessment._id ? res.data : a));
      toast.success('Assessment archived!');
    } catch (error) {
      toast.error(error.message || 'Failed to archive');
    }
  };

  const getStatusColor = (s) => ({ active: 'green', draft: 'orange', archived: 'gray', flagged: 'red' }[s] || 'default');

  const columns = [
    {
      title: 'Assessment', dataIndex: 'title', key: 'title',
      render: (title, record) => (<div><div className="font-medium">{title}</div><div className="text-sm text-gray-600">{record.subject}</div></div>)
    },
    { title: 'Instructor', dataIndex: 'instructorName', key: 'instructor' },
    { title: 'Type', dataIndex: 'type', key: 'type', render: (type) => <Tag color="blue">{type}</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag> },
    { title: 'Students', dataIndex: 'enrolledStudents', key: 'students', render: (students) => <span><TeamOutlined /> {students?.length || 0}</span> },
    { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', render: (date) => new Date(date).toLocaleDateString() },
    {
      title: 'Actions', key: 'actions',
      render: (_, record) => (
        <Space wrap>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => { setEditingAssessment(record); form.setFieldsValue({ title: record.title, description: record.description, status: record.status, duration: record.duration, passingScore: record.passingScore }); setEditModalVisible(true); }}>Edit</Button>
          <Button type="link" danger={record.status !== 'flagged'} icon={<FlagOutlined />} size="small" onClick={() => handleFlag(record)}>{record.status === 'flagged' ? 'Unflag' : 'Flag'}</Button>
          {record.status !== 'archived' && <Button type="link" icon={<StopOutlined />} size="small" onClick={() => handleArchive(record)}>Archive</Button>}
          <Popconfirm title="Delete Assessment?" onConfirm={() => handleDelete(record._id)} okText="Delete" okButtonProps={{ danger: true }}>
            <Button type="link" danger icon={<DeleteOutlined />} size="small">Delete</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  if (loading) return <div className="flex justify-center items-center h-64"><Spin size="large" /></div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Assessment Oversight</h1>
        <p className="text-gray-600 dark:text-gray-400">Monitor and manage all platform assessments</p>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={6}><Card className="text-center"><Statistic title="Total" value={assessments.length} prefix={<BookOutlined />} valueStyle={{ color: '#1890ff' }} /></Card></Col>
        <Col xs={24} sm={6}><Card className="text-center"><Statistic title="Active" value={assessments.filter(a => a.status === 'active').length} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col xs={24} sm={6}><Card className="text-center"><Statistic title="Flagged" value={assessments.filter(a => a.status === 'flagged').length} prefix={<FlagOutlined />} valueStyle={{ color: '#f5222d' }} /></Card></Col>
        <Col xs={24} sm={6}><Card className="text-center"><Statistic title="Archived" value={assessments.filter(a => a.status === 'archived').length} valueStyle={{ color: '#8c8c8c' }} /></Card></Col>
      </Row>

      <Card>
        <Table columns={columns} dataSource={assessments} rowKey="_id"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} assessments` }}
        />
      </Card>

      <Modal title="Edit Assessment" open={editModalVisible} onCancel={() => { setEditModalVisible(false); form.resetFields(); }}
        footer={[
          <Button key="cancel" onClick={() => { setEditModalVisible(false); form.resetFields(); }}>Cancel</Button>,
          <Button key="submit" type="primary" loading={saving} onClick={() => form.submit()}>Update</Button>
        ]}>
        <Form form={form} layout="vertical" onFinish={handleUpdate}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="status" label="Status">
            <Select><Option value="draft">Draft</Option><Option value="active">Active</Option><Option value="archived">Archived</Option><Option value="flagged">Flagged</Option></Select>
          </Form.Item>
          <Form.Item name="duration" label="Duration (minutes)" rules={[{ required: true }]}><Input type="number" min={1} /></Form.Item>
          <Form.Item name="passingScore" label="Passing Score (%)" rules={[{ required: true }]}><Input type="number" min={0} max={100} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AssessmentOversight;