import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Input, Select, Alert, Spin } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';

const { Option } = Select;

const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  role: Yup.string()
    .oneOf(['student', 'instructor', 'admin'], 'Invalid role')
    .required('Role is required')
});

const Login = () => {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [demoCredentials, setDemoCredentials] = useState(false);

  const handleSubmit = async (values) => {
    try {
      await login(values.email, values.password);
      // Navigation will be handled by AuthContext and routing
    } catch (error) {
      // Error is handled by AuthContext
    }
  };

  const fillDemoCredentials = (role) => {
    const credentials = {
      student: { email: 'student@example.com', password: 'password123', role: 'student' },
      instructor: { email: 'instructor@example.com', password: 'password123', role: 'instructor' },
      admin: { email: 'admin@example.com', password: 'password123', role: 'admin' }
    };
    return credentials[role];
  };

  const getRoleBasedRedirect = (role) => {
    switch (role) {
      case 'student':
        return '/student-dashboard';
      case 'instructor':
        return '/instructor-dashboard';
      case 'admin':
        return '/admin-dashboard';
      default:
        return '/login';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-blue-600 text-white p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl font-bold">UAP</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in to your Unified Assessment Platform account
          </p>
        </div>

        <Card className="shadow-xl">
          <Formik
            initialValues={{
              email: '',
              password: '',
              role: ''
            }}
            validationSchema={LoginSchema}
            onSubmit={handleSubmit}
          >
            {({ values, setValues }) => (
              <Form className="space-y-6">
                {/* Demo Credentials Section */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">
                    Demo Credentials
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      type="link"
                      size="small"
                      className="text-left p-0 h-auto"
                      onClick={() => setValues(fillDemoCredentials('student'))}
                    >
                      <span className="text-blue-600 dark:text-blue-400">
                        Student: student@example.com / password123
                      </span>
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      className="text-left p-0 h-auto"
                      onClick={() => setValues(fillDemoCredentials('instructor'))}
                    >
                      <span className="text-blue-600 dark:text-blue-400">
                        Instructor: instructor@example.com / password123
                      </span>
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      className="text-left p-0 h-auto"
                      onClick={() => setValues(fillDemoCredentials('admin'))}
                    >
                      <span className="text-blue-600 dark:text-blue-400">
                        Admin: admin@example.com / password123
                      </span>
                    </Button>
                  </div>
                </div>

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

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <Field name="password">
                    {({ field }) => (
                      <Input.Password
                        {...field}
                        placeholder="Enter your password"
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

                {/* Submit Button */}
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>

                {/* Sign Up Link */}
                <div className="text-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    Don't have an account?{' '}
                  </span>
                  <Link
                    to="/signup"
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Sign up
                  </Link>
                </div>
              </Form>
            )}
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

export default Login;
