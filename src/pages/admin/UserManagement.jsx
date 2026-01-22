import React, { useState } from 'react';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, Select, Avatar, Popconfirm, message, Row, Col } from 'antd';
import {
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  CheckCircleOutlined,
  StopOutlined
} from '@ant-design/icons';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { users, addUser, updateUser, deleteUser, getUsersByRole } from '../../data/users';
import { toast } from 'react-toastify';

const { Option } = Select;

const UserSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  role: Yup.string().required('Role is required'),
  instituteCode: Yup.string().required('Institute code is required')
});

const UserManagement = () => {
  const [userList, setUserList] = useState(users);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'red';
      case 'instructor': return 'purple';
      case 'student': return 'blue';
      default: return 'default';
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'green' : 'red';
  };

  const handleCreateUser = async (values) => {
    setLoading(true);
    try {
      const newUser = addUser({
        ...values,
        password: 'password123', // Default password
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${values.name.replace(' ', '')}`,
        profile: {}
      });

      setUserList(prev => [...prev, newUser]);
      setCreateModalVisible(false);
      toast.success('User created successfully!');
    } catch (error) {
      toast.error('Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (values) => {
    setLoading(true);
    try {
      const updatedUser = updateUser(editingUser.id, values);
      if (updatedUser) {
        setUserList(prev => prev.map(user =>
          user.id === editingUser.id ? updatedUser : user
        ));
        setEditModalVisible(false);
        setEditingUser(null);
        toast.success('User updated successfully!');
      }
    } catch (error) {
      toast.error('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const success = deleteUser(userId);
      if (success) {
        setUserList(prev => prev.filter(user => user.id !== userId));
        toast.success('User deleted successfully!');
      }
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleToggleUserStatus = async (user) => {
    try {
      const updatedUser = updateUser(user.id, { isActive: !user.isActive });
      if (updatedUser) {
        setUserList(prev => prev.map(u =>
          u.id === user.id ? updatedUser : u
        ));
        toast.success(`User ${updatedUser.isActive ? 'activated' : 'suspended'} successfully!`);
      }
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const columns = [
    {
      title: 'User',
      dataIndex: 'name',
      key: 'user',
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
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={getRoleColor(role)}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </Tag>
      )
    },
    {
      title: 'Institute',
      dataIndex: 'instituteCode',
      key: 'instituteCode',
      render: (code) => <span className="font-mono text-sm">{code}</span>
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'status',
      render: (isActive) => (
        <Tag color={getStatusColor(isActive)}>
          {isActive ? 'Active' : 'Suspended'}
        </Tag>
      )
    },
    {
      title: 'Joined',
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
            icon={<EditOutlined />}
            size="small"
            onClick={() => {
              setEditingUser(record);
              setEditModalVisible(true);
            }}
          >
            Edit
          </Button>

          <Button
            type={record.isActive ? 'link' : 'link'}
            danger={record.isActive}
            icon={record.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
            size="small"
            onClick={() => handleToggleUserStatus(record)}
          >
            {record.isActive ? 'Suspend' : 'Activate'}
          </Button>

          <Popconfirm
            title="Delete User"
            description="Are you sure you want to delete this user? This action cannot be undone."
            onConfirm={() => handleDeleteUser(record.id)}
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
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage users, roles, and permissions
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalVisible(true)}
        >
          Add User
        </Button>
      </div>

      {/* User Statistics */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8}>
          <Card className="text-center">
            <div className="text-2xl font-bold text-blue-600">{userList.length}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {userList.filter(u => u.isActive).length}
            </div>
            <div className="text-sm text-gray-600">Active Users</div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {userList.filter(u => !u.isActive).length}
            </div>
            <div className="text-sm text-gray-600">Suspended Users</div>
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={userList}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`
          }}
        />
      </Card>

      {/* Create User Modal */}
      <Modal
        title="Create New User"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={600}
      >
        <Formik
          initialValues={{
            name: '',
            email: '',
            role: '',
            instituteCode: 'INST001'
          }}
          validationSchema={UserSchema}
          onSubmit={handleCreateUser}
        >
          {({ values, errors, touched, handleChange, handleSubmit }) => (
            <Form layout="vertical" onFinish={handleSubmit}>
              <Form.Item
                label="Full Name"
                validateStatus={errors.name && touched.name ? 'error' : ''}
                help={errors.name && touched.name ? errors.name : ''}
              >
                <Input
                  name="name"
                  value={values.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                />
              </Form.Item>

              <Form.Item
                label="Email"
                validateStatus={errors.email && touched.email ? 'error' : ''}
                help={errors.email && touched.email ? errors.email : ''}
              >
                <Input
                  name="email"
                  value={values.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                />
              </Form.Item>

              <Form.Item
                label="Role"
                validateStatus={errors.role && touched.role ? 'error' : ''}
                help={errors.role && touched.role ? errors.role : ''}
              >
                <Select
                  value={values.role}
                  onChange={(value) => handleChange({ target: { name: 'role', value } })}
                  placeholder="Select role"
                >
                  <Option value="student">Student</Option>
                  <Option value="instructor">Instructor</Option>
                  <Option value="admin">Administrator</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Institute Code"
                validateStatus={errors.instituteCode && touched.instituteCode ? 'error' : ''}
                help={errors.instituteCode && touched.instituteCode ? errors.instituteCode : ''}
              >
                <Input
                  name="instituteCode"
                  value={values.instituteCode}
                  onChange={handleChange}
                  placeholder="Enter institute code"
                />
              </Form.Item>

              <Form.Item className="mb-0 text-right">
                <Space>
                  <Button onClick={() => setCreateModalVisible(false)}>
                    Cancel
                  </Button>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    Create User
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          )}
        </Formik>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        title="Edit User"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingUser(null);
        }}
        footer={null}
        width={600}
      >
        {editingUser && (
          <Formik
            initialValues={{
              name: editingUser.name,
              email: editingUser.email,
              role: editingUser.role,
              instituteCode: editingUser.instituteCode,
              isActive: editingUser.isActive
            }}
            validationSchema={UserSchema}
            onSubmit={handleEditUser}
          >
            {({ values, errors, touched, handleChange, handleSubmit }) => (
              <Form layout="vertical" onFinish={handleSubmit}>
                <Form.Item
                  label="Full Name"
                  validateStatus={errors.name && touched.name ? 'error' : ''}
                  help={errors.name && touched.name ? errors.name : ''}
                >
                  <Input
                    name="name"
                    value={values.name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                  />
                </Form.Item>

                <Form.Item
                  label="Email"
                  validateStatus={errors.email && touched.email ? 'error' : ''}
                  help={errors.email && touched.email ? errors.email : ''}
                >
                  <Input
                    name="email"
                    value={values.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                  />
                </Form.Item>

                <Form.Item
                  label="Role"
                  validateStatus={errors.role && touched.role ? 'error' : ''}
                  help={errors.role && touched.role ? errors.role : ''}
                >
                  <Select
                    value={values.role}
                    onChange={(value) => handleChange({ target: { name: 'role', value } })}
                    placeholder="Select role"
                  >
                    <Option value="student">Student</Option>
                    <Option value="instructor">Instructor</Option>
                    <Option value="admin">Administrator</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="Institute Code"
                  validateStatus={errors.instituteCode && touched.instituteCode ? 'error' : ''}
                  help={errors.instituteCode && touched.instituteCode ? errors.instituteCode : ''}
                >
                  <Input
                    name="instituteCode"
                    value={values.instituteCode}
                    onChange={handleChange}
                    placeholder="Enter institute code"
                  />
                </Form.Item>

                <Form.Item label="Status">
                  <Select
                    value={values.isActive}
                    onChange={(value) => handleChange({ target: { name: 'isActive', value } })}
                  >
                    <Option value={true}>Active</Option>
                    <Option value={false}>Suspended</Option>
                  </Select>
                </Form.Item>

                <Form.Item className="mb-0 text-right">
                  <Space>
                    <Button onClick={() => {
                      setEditModalVisible(false);
                      setEditingUser(null);
                    }}>
                      Cancel
                    </Button>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      Update User
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            )}
          </Formik>
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;
