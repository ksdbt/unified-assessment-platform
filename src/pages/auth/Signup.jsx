import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Input, Select, Alert } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, TeamOutlined } from '@ant-design/icons';

const { Option } = Select;

const SignupSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .required('Name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Please confirm your password'),
  role: Yup.string()
    .oneOf(['student', 'instructor', 'admin'], 'Invalid role')
    .required('Role is required'),
  instituteCode: Yup.string()
    .required('Institute code is required')
});

const Signup = () => {
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    try {
      const { confirmPassword, ...userData } = values;
      await register(userData);
      // Navigation will be handled by AuthContext and routing
    } catch (error) {
      // Error is handled by AuthContext
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-green-600 text-white p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl font-bold">UAP</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Join Us
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create your Unified Assessment Platform account
          </p>
        </div>

        <Card className="shadow-xl">
          <Formik
            initialValues={{
              name: '',
              email: '',
              password: '',
              confirmPassword: '',
              role: '',
              instituteCode: 'INST001'
            }}
            validationSchema={SignupSchema}
            onSubmit={handleSubmit}
          >
            <Form className="space-y-6">
              {/* Error Display */}
              {error && (
                <Alert
                  message={error}
                  type="error"
                  showIcon
                  closable
                  className="mb-4"
                />
              )}

              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <Field name="name">
                  {({ field }) => (
                    <Input
                      {...field}
                      placeholder="Enter your full name"
                      prefix={<UserOutlined />}
                      size="large"
                    />
                  )}
                </Field>
                <ErrorMessage
                  name="name"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <Field name="email">
                  {({ field }) => (
                    <Input
                      {...field}
                      type="email"
                      placeholder="Enter your email"
                      prefix={<MailOutlined />}
                      size="large"
                    />
                  )}
                </Field>
                <ErrorMessage
                  name="email"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  I am a
                </label>
                <Field name="role">
                  {({ field }) => (
                    <Select
                      {...field}
                      placeholder="Select your role"
                      className="w-full"
                      size="large"
                    >
                      <Option value="student">Student</Option>
                      <Option value="instructor">Instructor</Option>
                      <Option value="admin">Administrator</Option>
                    </Select>
                  )}
                </Field>
                <ErrorMessage
                  name="role"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              {/* Institute Code Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Institute Code
                </label>
                <Field name="instituteCode">
                  {({ field }) => (
                    <Input
                      {...field}
                      placeholder="Enter institute code"
                      prefix={<TeamOutlined />}
                      size="large"
                    />
                  )}
                </Field>
                <ErrorMessage
                  name="instituteCode"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <Field name="password">
                  {({ field }) => (
                    <Input.Password
                      {...field}
                      placeholder="Create a password"
                      prefix={<LockOutlined />}
                      size="large"
                    />
                  )}
                </Field>
                <ErrorMessage
                  name="password"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password
                </label>
                <Field name="confirmPassword">
                  {({ field }) => (
                    <Input.Password
                      {...field}
                      placeholder="Confirm your password"
                      prefix={<LockOutlined />}
                      size="large"
                    />
                  )}
                </Field>
                <ErrorMessage
                  name="confirmPassword"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>

              {/* Sign In Link */}
              <div className="text-center">
                <span className="text-gray-600 dark:text-gray-400">
                  Already have an account?{' '}
                </span>
                <Link
                  to="/login"
                  className="text-green-600 hover:text-green-500 font-medium"
                >
                  Sign in
                </Link>
              </div>
            </Form>
          </Formik>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Unified Assessment Platform © 2024
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
