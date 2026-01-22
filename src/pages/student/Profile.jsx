import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, Avatar, Form, Input, Button, Upload, message, Tabs, Statistic, Row, Col } from 'antd';
import { Formik } from 'formik';
import * as Yup from 'yup';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  EditOutlined,
  SaveOutlined,
  UploadOutlined,
  TrophyOutlined,
  BookOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { toast } from 'react-toastify';
import { getSubmissionsByStudent } from '../../data/submissions';

const { TabPane } = Tabs;

const ProfileSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  phone: Yup.string(),
  address: Yup.string()
});

const PasswordSchema = Yup.object().shape({
  currentPassword: Yup.string().required('Current password is required'),
  newPassword: Yup.string().min(6, 'Password must be at least 6 characters').required('New password is required'),
  confirmPassword: Yup.string().oneOf([Yup.ref('newPassword'), null], 'Passwords must match').required('Please confirm your password')
});

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('1');
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleProfileUpdate = async (values) => {
    setProfileLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      updateUser(values);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (values, { resetForm }) => {
    setPasswordLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Password changed successfully!');
      resetForm();
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarUpload = (info) => {
    if (info.file.status === 'done') {
      // Simulate successful upload
      const newAvatar = URL.createObjectURL(info.file.originFileObj);
      updateUser({ avatar: newAvatar });
      message.success('Avatar updated successfully');
    }
  };

  // Calculate performance data from submissions
  const submissions = getSubmissionsByStudent(user.id);
  const evaluatedSubmissions = submissions.filter(sub => sub.status === 'evaluated');

  const performanceData = {
    totalAssessments: submissions.length,
    completedAssessments: evaluatedSubmissions.length,
    averageScore: evaluatedSubmissions.length > 0
      ? Math.round(evaluatedSubmissions.reduce((acc, sub) => acc + sub.percentage, 0) / evaluatedSubmissions.length)
      : 0,
    topSubject: 'Computer Science' // Would be calculated from actual data
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          My Profile
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account information and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview Card */}
        <div className="lg:col-span-1">
          <Card className="text-center">
            <Avatar
              size={120}
              src={user.avatar}
              icon={<UserOutlined />}
              className="mb-4"
            />
            <h2 className="text-xl font-bold mb-2">{user.name}</h2>
            <p className="text-gray-600 mb-4">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>

            <Upload
              showUploadList={false}
              beforeUpload={() => false}
              onChange={handleAvatarUpload}
            >
              <Button icon={<UploadOutlined />}>Change Avatar</Button>
            </Upload>

            <div className="mt-6 space-y-2 text-left">
              <div className="flex items-center space-x-2">
                <MailOutlined />
                <span className="text-sm">{user.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm">Institute: {user.instituteCode}</span>
              </div>
            </div>
          </Card>

          {/* Performance Stats */}
          <Card className="mt-6" title="Performance Overview">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="Total Assessments"
                  value={performanceData.totalAssessments}
                  prefix={<BookOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Completed"
                  value={performanceData.completedAssessments}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Average Score"
                  value={performanceData.averageScore}
                  suffix="%"
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Top Subject"
                  value={performanceData.topSubject}
                  valueStyle={{ fontSize: '14px' }}
                />
              </Col>
            </Row>
          </Card>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2">
          <Card>
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <TabPane tab="Personal Information" key="1">
                <Formik
                  initialValues={{
                    name: user.name || '',
                    email: user.email || '',
                    phone: user.profile?.phone || '',
                    address: user.profile?.address || ''
                  }}
                  validationSchema={ProfileSchema}
                  onSubmit={handleProfileUpdate}
                >
                  {({ values, errors, touched, handleChange, handleSubmit }) => (
                    <Form layout="vertical" onSubmit={handleSubmit}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Full Name</label>
                          <Input
                            name="name"
                            value={values.name}
                            onChange={handleChange}
                            prefix={<UserOutlined />}
                            status={errors.name && touched.name ? 'error' : ''}
                          />
                          {errors.name && touched.name && (
                            <div className="text-red-500 text-sm mt-1">{errors.name}</div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Email</label>
                          <Input
                            name="email"
                            value={values.email}
                            onChange={handleChange}
                            prefix={<MailOutlined />}
                            status={errors.email && touched.email ? 'error' : ''}
                          />
                          {errors.email && touched.email && (
                            <div className="text-red-500 text-sm mt-1">{errors.email}</div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Phone</label>
                          <Input
                            name="phone"
                            value={values.phone}
                            onChange={handleChange}
                            prefix={<PhoneOutlined />}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Address</label>
                          <Input
                            name="address"
                            value={values.address}
                            onChange={handleChange}
                            prefix={<HomeOutlined />}
                          />
                        </div>
                      </div>

                      <div className="mt-6">
                        <Button
                          type="primary"
                          htmlType="submit"
                          icon={<SaveOutlined />}
                          loading={profileLoading}
                        >
                          Update Profile
                        </Button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </TabPane>

              <TabPane tab="Change Password" key="2">
                <Formik
                  initialValues={{
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  }}
                  validationSchema={PasswordSchema}
                  onSubmit={handlePasswordChange}
                >
                  {({ values, errors, touched, handleChange, handleSubmit }) => (
                    <Form layout="vertical" onSubmit={handleSubmit}>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Current Password</label>
                          <Input.Password
                            name="currentPassword"
                            value={values.currentPassword}
                            onChange={handleChange}
                            status={errors.currentPassword && touched.currentPassword ? 'error' : ''}
                          />
                          {errors.currentPassword && touched.currentPassword && (
                            <div className="text-red-500 text-sm mt-1">{errors.currentPassword}</div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">New Password</label>
                          <Input.Password
                            name="newPassword"
                            value={values.newPassword}
                            onChange={handleChange}
                            status={errors.newPassword && touched.newPassword ? 'error' : ''}
                          />
                          {errors.newPassword && touched.newPassword && (
                            <div className="text-red-500 text-sm mt-1">{errors.newPassword}</div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                          <Input.Password
                            name="confirmPassword"
                            value={values.confirmPassword}
                            onChange={handleChange}
                            status={errors.confirmPassword && touched.confirmPassword ? 'error' : ''}
                          />
                          {errors.confirmPassword && touched.confirmPassword && (
                            <div className="text-red-500 text-sm mt-1">{errors.confirmPassword}</div>
                          )}
                        </div>
                      </div>

                      <div className="mt-6">
                        <Button
                          type="primary"
                          htmlType="submit"
                          icon={<SaveOutlined />}
                          loading={passwordLoading}
                        >
                          Change Password
                        </Button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </TabPane>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
