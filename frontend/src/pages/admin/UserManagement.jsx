import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, Select, Avatar, Popconfirm, Row, Col, Spin } from 'antd';
import { UserOutlined, PlusOutlined, EditOutlined, DeleteOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { userAPI } from '../../services/api';
import { toast } from 'react-toastify';

const { Option } = Select;

const UserSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  role: Yup.string().required('Role is required'),
  instituteCode: Yup.string().required('Institute code is required')
});

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    userAPI.getAll()
      .then(res => setUsers(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (values) => {
    setSaving(true);
    try {
      const res = await userAPI.create(values);
      setUsers(prev => [...prev, res.data]);
      setCreateModalVisible(false);
      toast.success('User created successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (values) => {
    setSaving(true);
    try {
      const res = await userAPI.update(editingUser._id, values);
      setUsers(prev => prev.map(u => u._id === editingUser._id ? res.data : u));
      setEditModalVisible(false);
      setEditingUser(null);
      toast.success('User updated successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await userAPI.delete(id);
      setUsers(prev => prev.filter(u => u._id !== id));
      toast.success('User deleted successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const res = await userAPI.update(user._id, { isActive: !user.isActive });
      setUsers(prev => prev.map(u => u._id === user._id ? res.data : u));
      toast.success(`User ${res.data.isActive ? 'activated' : 'suspended'} successfully!`);
    } catch (error) {
      toast.error(error.message || 'Failed to update user status');
    }
  };

  const columns = [
    {
      title: 'User', key: 'user',
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
      title: 'Role', dataIndex: 'role', key: 'role',
      render: (role) => <Tag color={role === 'admin' ? 'red' : role === 'instructor' ? 'purple' : 'blue'}>{role}</Tag>
    },
    { title: 'Institute', dataIndex: 'instituteCode', key: 'instituteCode', render: (code) => <span className="font-mono text-sm">{code}</span> },
    {
      title: 'Status', dataIndex: 'isActive', key: 'status',
      render: (isActive) => <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Active' : 'Suspended'}</Tag>
    },
    { title: 'Joined', dataIndex: 'createdAt', key: 'createdAt', render: (date) => new Date(date).toLocaleDateString() },
    {
      title: 'Actions', key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => { setEditingUser(record); setEditModalVisible(true); }}>Edit</Button>
          <Button type="link" danger={record.isActive} icon={record.isActive ? <StopOutlined /> : <CheckCircleOutlined />} size="small" onClick={() => handleToggleStatus(record)}>
            {record.isActive ? 'Suspend' : 'Activate'}
          </Button>
          <Popconfirm title="Delete User?" description="This cannot be undone." onConfirm={() => handleDelete(record._id)} okText="Delete" okButtonProps={{ danger: true }}>
            <Button type="link" danger icon={<DeleteOutlined />} size="small">Delete</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  if (loading) return <div className="flex justify-center items-center h-64"><Spin size="large" /></div>;

  const UserForm = ({ initialValues, onSubmit, onCancel }) => (
    <Formik initialValues={initialValues} validationSchema={UserSchema} onSubmit={onSubmit}>
      {({ values, errors, touched, handleChange, handleSubmit }) => (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <Input name="name" value={values.name} onChange={handleChange} placeholder="Enter full name" status={errors.name && touched.name ? 'error' : ''} />
            {errors.name && touched.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input name="email" value={values.email} onChange={handleChange} placeholder="Enter email" status={errors.email && touched.email ? 'error' : ''} />
            {errors.email && touched.email && <div className="text-red-500 text-sm mt-1">{errors.email}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <Select value={values.role} onChange={(v) => handleChange({ target: { name: 'role', value: v } })} className="w-full" placeholder="Select role">
              <Option value="student">Student</Option>
              <Option value="instructor">Instructor</Option>
              <Option value="admin">Administrator</Option>
            </Select>
            {errors.role && touched.role && <div className="text-red-500 text-sm mt-1">{errors.role}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Institute Code</label>
            <Input name="instituteCode" value={values.instituteCode} onChange={handleChange} placeholder="Enter institute code" />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={saving}>Save</Button>
          </div>
        </form>
      )}
    </Formik>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage users, roles, and permissions</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>Add User</Button>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8}><Card className="text-center"><div className="text-2xl font-bold text-blue-600">{users.length}</div><div className="text-sm text-gray-600">Total Users</div></Card></Col>
        <Col xs={24} sm={8}><Card className="text-center"><div className="text-2xl font-bold text-green-600">{users.filter(u => u.isActive).length}</div><div className="text-sm text-gray-600">Active Users</div></Card></Col>
        <Col xs={24} sm={8}><Card className="text-center"><div className="text-2xl font-bold text-red-600">{users.filter(u => !u.isActive).length}</div><div className="text-sm text-gray-600">Suspended Users</div></Card></Col>
      </Row>

      <Card>
        <Table columns={columns} dataSource={users} rowKey="_id"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users` }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Modal title="Create New User" open={createModalVisible} onCancel={() => setCreateModalVisible(false)} footer={null} width={500}>
        <UserForm initialValues={{ name: '', email: '', role: '', instituteCode: 'INST001' }} onSubmit={handleCreate} onCancel={() => setCreateModalVisible(false)} />
      </Modal>

      <Modal title="Edit User" open={editModalVisible} onCancel={() => { setEditModalVisible(false); setEditingUser(null); }} footer={null} width={500}>
        {editingUser && (
          <UserForm
            initialValues={{ name: editingUser.name, email: editingUser.email, role: editingUser.role, instituteCode: editingUser.instituteCode }}
            onSubmit={handleEdit}
            onCancel={() => { setEditModalVisible(false); setEditingUser(null); }}
          />
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;