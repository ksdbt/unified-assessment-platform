import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, Avatar, Input, Button, Upload, Tabs, Statistic, Row, Col } from 'antd';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { UserOutlined, MailOutlined, PhoneOutlined, HomeOutlined, SaveOutlined, UploadOutlined, BookOutlined, CheckCircleOutlined, TrophyOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import { authAPI } from '../../services/api';

const { TabPane } = Tabs;

const ProfileSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  phone: Yup.string(),
  address: Yup.string()
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

  const handleProfileUpdate = async (values) => {
    setProfileLoading(true);
    try {
      const res = await authAPI.updateProfile(values);
      updateUser(res.user);
      toast.success('Profile updated successfully!');
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">My Profile</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your account information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="text-center">
            <Avatar size={120} src={user.avatar} icon={<UserOutlined />} className="mb-4" />
            <h2 className="text-xl font-bold mb-2">{user.name}</h2>
            <p className="text-gray-600 mb-4 capitalize">{user.role}</p>
            <div className="mt-4 space-y-2 text-left">
              <div className="flex items-center space-x-2"><MailOutlined /><span className="text-sm">{user.email}</span></div>
              <div className="text-sm">Institute: {user.instituteCode}</div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <Tabs defaultActiveKey="1">
              <TabPane tab="Personal Information" key="1">
                <Formik
                  initialValues={{ name: user.name || '', phone: user.profile?.phone || '', address: user.profile?.address || '', department: user.profile?.department || '', specialization: user.profile?.specialization || '', experience: user.profile?.experience || '' }}
                  validationSchema={ProfileSchema}
                  onSubmit={handleProfileUpdate}
                >
                  {({ values, errors, touched, handleChange, handleSubmit }) => (
                    <form onSubmit={handleSubmit}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Full Name</label>
                          <Input name="name" value={values.name} onChange={handleChange} prefix={<UserOutlined />} status={errors.name && touched.name ? 'error' : ''} />
                          {errors.name && touched.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Phone</label>
                          <Input name="phone" value={values.phone} onChange={handleChange} prefix={<PhoneOutlined />} />
                        </div>
                        {user.role === 'instructor' && (
                          <>
                            <div>
                              <label className="block text-sm font-medium mb-2">Department</label>
                              <Input name="department" value={values.department} onChange={handleChange} />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">Specialization</label>
                              <Input name="specialization" value={values.specialization} onChange={handleChange} />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">Experience (years)</label>
                              <Input name="experience" type="number" value={values.experience} onChange={handleChange} />
                            </div>
                          </>
                        )}
                        <div className={user.role === 'instructor' ? '' : 'md:col-span-2'}>
                          <label className="block text-sm font-medium mb-2">Address</label>
                          <Input name="address" value={values.address} onChange={handleChange} prefix={<HomeOutlined />} />
                        </div>
                      </div>
                      <div className="mt-6">
                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={profileLoading}>Update Profile</Button>
                      </div>
                    </form>
                  )}
                </Formik>
              </TabPane>

              <TabPane tab="Change Password" key="2">
                <Formik
                  initialValues={{ currentPassword: '', newPassword: '', confirmPassword: '' }}
                  validationSchema={PasswordSchema}
                  onSubmit={handlePasswordChange}
                >
                  {({ values, errors, touched, handleChange, handleSubmit }) => (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Current Password</label>
                        <Input.Password name="currentPassword" value={values.currentPassword} onChange={handleChange} status={errors.currentPassword && touched.currentPassword ? 'error' : ''} />
                        {errors.currentPassword && touched.currentPassword && <div className="text-red-500 text-sm mt-1">{errors.currentPassword}</div>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">New Password</label>
                        <Input.Password name="newPassword" value={values.newPassword} onChange={handleChange} status={errors.newPassword && touched.newPassword ? 'error' : ''} />
                        {errors.newPassword && touched.newPassword && <div className="text-red-500 text-sm mt-1">{errors.newPassword}</div>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                        <Input.Password name="confirmPassword" value={values.confirmPassword} onChange={handleChange} status={errors.confirmPassword && touched.confirmPassword ? 'error' : ''} />
                        {errors.confirmPassword && touched.confirmPassword && <div className="text-red-500 text-sm mt-1">{errors.confirmPassword}</div>}
                      </div>
                      <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={passwordLoading}>Change Password</Button>
                    </form>
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

export default StudentProfile;