import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Input, Alert, Spin } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';


const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required')
});

const Login = () => {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

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
      student: { email: 'student@example.com', password: 'password123' },
      instructor: { email: 'instructor@example.com', password: 'password123' },
      admin: { email: 'admin@example.com', password: 'password123' }
    };
    return credentials[role];
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md sm:max-w-lg">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-2xl mb-8 transform hover:scale-105 transition-transform duration-300">
            <span className="text-3xl font-bold text-white tracking-wide">UAP</span>
          </div>
          <h1 className="text-4xl font-bold text-white dark:text-gray-100 mb-4 tracking-tight leading-tight">
            Welcome Back
          </h1>
          <p className="text-xl text-white/90 dark:text-gray-300 font-medium leading-relaxed">
            Sign in to your Unified Assessment Platform
          </p>
        </div>

        {/* Login Card */}
        <Card
          className="shadow-2xl border-0 backdrop-blur-sm bg-white/95 dark:bg-gray-800/95"
          bodyStyle={{
            padding: '3rem 2.5rem',
            background: 'transparent'
          }}
          style={{
            borderRadius: '1.5rem',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.05)'
          }}
        >
          <Formik
            initialValues={{
              email: '',
              password: ''
            }}
            validationSchema={LoginSchema}
            onSubmit={handleSubmit}
          >
            {({ values }) => (
              <Form className="space-y-10">

                {/* Error Display */}
                {error && (
                  <Alert
                    message={error}
                    type="error"
                    showIcon
                    closable
                    className="mb-8 animate-fade-in border-red-200 bg-red-50 shadow-sm"
                    style={{
                      borderColor: '#FECACA',
                      backgroundColor: '#FEF2F2',
                      borderRadius: '0.75rem',
                      border: '1px solid #FECACA',
                      boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.1)'
                    }}
                  />
                )}


                {/* Email Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 tracking-wide uppercase">
                    Email Address
                  </label>
                  <Field name="email">
                    {({ field }) => (
                      <Input
                        {...field}
                        type="email"
                        placeholder="Enter your email address"
                        prefix={<MailOutlined className="text-gray-400 mr-2" />}
                        size="large"
                        className="transition-all duration-300 hover:shadow-md focus:shadow-lg"
                        style={{
                          borderRadius: '1rem',
                          border: '2px solid #E5E7EB',
                          backgroundColor: '#FAFAFA',
                          fontSize: '1rem',
                          fontWeight: '500',
                          padding: '0.75rem 1rem',
                          height: '3.25rem'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#3B82F6';
                          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#E5E7EB';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    )}
                  </Field>
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="text-red-500 text-sm mt-2 font-medium flex items-center"
                    style={{ marginTop: '0.5rem' }}
                  >
                    {(msg) => (
                      <span className="flex items-center">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                        {msg}
                      </span>
                    )}
                  </ErrorMessage>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 tracking-wide uppercase">
                    Password
                  </label>
                  <Field name="password">
                    {({ field }) => (
                      <Input.Password
                        {...field}
                        placeholder="Enter your password"
                        prefix={<LockOutlined className="text-gray-400 mr-2" />}
                        size="large"
                        className="transition-all duration-300 hover:shadow-md focus:shadow-lg"
                        style={{
                          borderRadius: '1rem',
                          border: '2px solid #E5E7EB',
                          backgroundColor: '#FAFAFA',
                          fontSize: '1rem',
                          fontWeight: '500',
                          padding: '0.75rem 1rem',
                          height: '3.25rem'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#3B82F6';
                          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#E5E7EB';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    )}
                  </Field>
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="text-red-500 text-sm mt-2 font-medium flex items-center"
                    style={{ marginTop: '0.5rem' }}
                  >
                    {(msg) => (
                      <span className="flex items-center">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                        {msg}
                      </span>
                    )}
                  </ErrorMessage>
                </div>

                {/* Submit Button */}
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={loading}
                  className="group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
                    border: 'none',
                    borderRadius: '1rem',
                    height: '3.5rem',
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    letterSpacing: '0.025em',
                    boxShadow: '0 10px 25px -5px rgba(102, 126, 234, 0.4), 0 8px 10px -6px rgba(118, 75, 162, 0.4)',
                    backgroundSize: '200% 200%',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundPosition = 'right center';
                    e.target.style.boxShadow = '0 15px 35px -5px rgba(102, 126, 234, 0.6), 0 12px 15px -6px rgba(118, 75, 162, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundPosition = 'left center';
                    e.target.style.boxShadow = '0 10px 25px -5px rgba(102, 126, 234, 0.4), 0 8px 10px -6px rgba(118, 75, 162, 0.4)';
                  }}
                >
                  <span className="relative z-10 flex items-center justify-center">
                    {loading ? (
                      <>
                        <Spin size="small" className="mr-2" />
                        Signing In...
                      </>
                    ) : (
                      <>
                        Sign In to Your Account
                        <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Button>

                {/* Sign Up Link */}
                <div className="text-center pt-8 border-t border-gray-200 mt-8">
                  <span className="text-gray-600 font-medium">
                    New to Unified Assessment Platform?{' '}
                  </span>
                  <Link
                    to="/signup"
                    className="text-blue-600 hover:text-blue-700 font-bold transition-all duration-300 hover:underline underline-offset-4 decoration-2 decoration-blue-300"
                  >
                    Create an account
                  </Link>
                </div>
              </Form>
            )}
          </Formik>
        </Card>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-white/70 text-sm font-medium tracking-wide">
            © 2026 Unified Assessment Platform. All rights reserved.
          </p>
          <p className="text-white/50 text-xs mt-2 font-medium">
            Enterprise-grade assessment management solution
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
