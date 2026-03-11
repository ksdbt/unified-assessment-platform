import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, Avatar, Input, Button, Tabs, Descriptions, Space } from 'antd';
import { Formik } from 'formik';
import * as Yup from 'yup';
import {
  UserOutlined, MailOutlined, PhoneOutlined, HomeOutlined,
  SaveOutlined, EditOutlined, CloseOutlined, BookOutlined
} from '@ant-design/icons';
import { toast } from 'react-toastify';
import { authAPI } from '../../services/api';

const ProfileSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  phone: Yup.string(),
  address: Yup.string(),
  bio: Yup.string().max(500, 'Bio must be less than 500 characters')
});

const PasswordSchema = Yup.object().shape({
  currentPassword: Yup.string().required('Current password is required'),
  newPassword: Yup.string().min(6).required('New password is required'),
  confirmPassword: Yup.string().oneOf([Yup.ref('newPassword'), null], 'Passwords must match').required()
});

const StudentProfile = () => {
  const { user, updateUser } = useAuth();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleProfileUpdate = async (values) => {
    setProfileLoading(true);
    try {
      const res = await authAPI.updateProfile(values);
      updateUser(res.user);
      toast.success('Profile updated successfully!');
      setIsEditing(false); // Switch back to view mode on success
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (values, { resetForm }) => {
    setPasswordLoading(true);
    try {
      await authAPI.changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      toast.success('Password changed successfully!');
      resetForm();
    } catch (error) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const profileItems = [
    {
      key: '1',
      label: 'Personal Information',
      children: (
        <div className="pt-2">
          {!isEditing ? (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Profile Details</h3>
                <Button type="primary" icon={<EditOutlined />} onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              </div>
              <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
                <Descriptions.Item label="Full Name">{user.name || 'Not provided'}</Descriptions.Item>
                <Descriptions.Item label="Phone Number">{user.profile?.phone || 'Not provided'}</Descriptions.Item>
                <Descriptions.Item label="Department">{user.profile?.department || 'Not provided'}</Descriptions.Item>
                <Descriptions.Item label="Address">{user.profile?.address || 'Not provided'}</Descriptions.Item>
                <Descriptions.Item label="Profile Bio" span={2}>
                  {user.profile?.bio || 'No bio available...'}
                </Descriptions.Item>
              </Descriptions>
            </div>
          ) : (
            <div className="animate-fadeIn">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Edit Profile</h3>
                <Button icon={<CloseOutlined />} onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
              <Formik
                initialValues={{
                  name: user.name || '',
                  phone: user.profile?.phone || '',
                  address: user.profile?.address || '',
                  department: user.profile?.department || '',
                  bio: user.profile?.bio || ''
                }}
                validationSchema={ProfileSchema}
                onSubmit={handleProfileUpdate}
              >
                {({ values, errors, touched, handleChange, handleSubmit }) => (
                  <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Full Name</label>
                        <Input size="large" name="name" value={values.name} onChange={handleChange} prefix={<UserOutlined className="text-gray-400" />} status={errors.name && touched.name ? 'error' : ''} />
                        {errors.name && touched.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Phone</label>
                        <Input size="large" name="phone" value={values.phone} onChange={handleChange} prefix={<PhoneOutlined className="text-gray-400" />} />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Department</label>
                        <Input size="large" name="department" value={values.department} onChange={handleChange} prefix={<BookOutlined className="text-gray-400" />} placeholder="e.g. Computer Science" />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Address</label>
                        <Input size="large" name="address" value={values.address} onChange={handleChange} prefix={<HomeOutlined className="text-gray-400" />} />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Profile Bio</label>
                        <Input.TextArea
                          name="bio"
                          value={values.bio}
                          onChange={handleChange}
                          placeholder="Tell us about yourself..."
                          rows={4}
                          maxLength={500}
                          showCount
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div className="mt-8 flex justify-end space-x-4">
                      <Button onClick={() => setIsEditing(false)}>Cancel</Button>
                      <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={profileLoading}>Save Changes</Button>
                    </div>
                  </form>
                )}
              </Formik>
            </div>
          )}
        </div>
      )
    },
    {
      key: '2',
      label: 'Change Password',
      children: (
        <div className="pt-2">
          <Formik
            initialValues={{ currentPassword: '', newPassword: '', confirmPassword: '' }}
            validationSchema={PasswordSchema}
            onSubmit={handlePasswordChange}
          >
            {({ values, errors, touched, handleChange, handleSubmit }) => (
              <form onSubmit={handleSubmit} className="space-y-6 bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 max-w-md">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Current Password</label>
                  <Input.Password size="large" name="currentPassword" value={values.currentPassword} onChange={handleChange} status={errors.currentPassword && touched.currentPassword ? 'error' : ''} />
                  {errors.currentPassword && touched.currentPassword && <div className="text-red-500 text-sm mt-1">{errors.currentPassword}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">New Password</label>
                  <Input.Password size="large" name="newPassword" value={values.newPassword} onChange={handleChange} status={errors.newPassword && touched.newPassword ? 'error' : ''} />
                  {errors.newPassword && touched.newPassword && <div className="text-red-500 text-sm mt-1">{errors.newPassword}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Confirm New Password</label>
                  <Input.Password size="large" name="confirmPassword" value={values.confirmPassword} onChange={handleChange} status={errors.confirmPassword && touched.confirmPassword ? 'error' : ''} />
                  {errors.confirmPassword && touched.confirmPassword && <div className="text-red-500 text-sm mt-1">{errors.confirmPassword}</div>}
                </div>
                <Button type="primary" size="large" htmlType="submit" icon={<SaveOutlined />} loading={passwordLoading} className="w-full">Update Password</Button>
              </form>
            )}
          </Formik>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Profile</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Manage your account information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card className="text-center shadow-lg border-0 h-full">
            <Avatar size={140} src={user.avatar} icon={<UserOutlined />} className="mb-6 border-4 border-blue-50 shadow-md" />
            <h2 className="text-2xl font-bold mb-1 text-gray-800 dark:text-white">{user.name}</h2>
            <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-6 capitalize">
              {user.role}
            </div>

            <div className="mt-2 space-y-4 text-left border-t border-gray-100 dark:border-gray-700 pt-6">
              <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-300">
                <MailOutlined className="text-lg text-blue-500" />
                <span className="text-md truncate">{user.email}</span>
              </div>
              {user.instituteCode && (
                <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-300">
                  <BookOutlined className="text-lg text-blue-500" />
                  <span className="text-md">Institute: <span className="font-semibold">{user.instituteCode}</span></span>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="shadow-lg border-0 h-full">
            <Tabs defaultActiveKey="1" items={profileItems} size="large" />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;