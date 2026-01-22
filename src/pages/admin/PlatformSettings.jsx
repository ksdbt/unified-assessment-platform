import React, { useState } from 'react';
import { Card, Form, Input, Button, Upload, Switch, Space, Divider, message, Modal } from 'antd';
import { Formik } from 'formik';
import * as Yup from 'yup';
import {
  SaveOutlined,
  UploadOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { toast } from 'react-toastify';

const { confirm } = Modal;

const SettingsSchema = Yup.object().shape({
  instituteName: Yup.string().required('Institute name is required'),
  instituteEmail: Yup.string().email('Invalid email').required('Institute email is required'),
  supportEmail: Yup.string().email('Invalid email').required('Support email is required'),
  maxFileSize: Yup.number().min(1).max(100).required('Max file size is required'),
  sessionTimeout: Yup.number().min(15).max(480).required('Session timeout is required')
});

const PlatformSettings = () => {
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState(null);

  // Mock current settings
  const currentSettings = {
    instituteName: 'Unified Assessment Platform',
    instituteEmail: 'admin@unified.edu',
    supportEmail: 'support@unified.edu',
    logoUrl: null,
    allowRegistration: true,
    requireEmailVerification: true,
    enableNotifications: true,
    maxFileSize: 10, // MB
    sessionTimeout: 60, // minutes
    maintenanceMode: false,
    backupFrequency: 'daily'
  };

  const handleSettingsUpdate = async (values) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success('Platform settings updated successfully!');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (info) => {
    if (info.file.status === 'done') {
      setLogoFile(info.file);
      message.success('Logo uploaded successfully');
    }
  };

  const handleResetToDefaults = () => {
    confirm({
      title: 'Reset to Default Settings',
      icon: <ExclamationCircleOutlined />,
      content: 'Are you sure you want to reset all settings to their default values? This action cannot be undone.',
      onOk() {
        toast.success('Settings reset to defaults successfully!');
      },
      onCancel() {
        // Do nothing
      }
    });
  };

  const handleArchiveData = () => {
    confirm({
      title: 'Archive Platform Data',
      icon: <ExclamationCircleOutlined />,
      content: 'This will archive old assessment data and submissions. Archived data will be stored but not accessible through the UI.',
      onOk() {
        toast.success('Data archiving initiated successfully!');
      },
      onCancel() {
        // Do nothing
      }
    });
  };

  const handleSystemReset = () => {
    confirm({
      title: 'System Reset',
      icon: <ExclamationCircleOutlined />,
      content: 'WARNING: This will reset the entire platform to its initial state. All data will be permanently deleted. This action cannot be undone.',
      okText: 'Reset System',
      okButtonProps: { danger: true },
      onOk() {
        toast.error('System reset is not allowed in demo mode');
      },
      onCancel() {
        // Do nothing
      }
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Platform Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configure global platform settings and preferences
        </p>
      </div>

      <Formik
        initialValues={currentSettings}
        validationSchema={SettingsSchema}
        onSubmit={handleSettingsUpdate}
      >
        {({ values, errors, touched, handleChange, setFieldValue, handleSubmit }) => (
          <Form layout="vertical" onFinish={handleSubmit}>
            {/* Institute Information */}
            <Card title="Institute Information" className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Institute Name *</label>
                  <Input
                    name="instituteName"
                    value={values.instituteName}
                    onChange={handleChange}
                    status={errors.instituteName && touched.instituteName ? 'error' : ''}
                  />
                  {errors.instituteName && touched.instituteName && (
                    <div className="text-red-500 text-sm mt-1">{errors.instituteName}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Institute Email *</label>
                  <Input
                    name="instituteEmail"
                    value={values.instituteEmail}
                    onChange={handleChange}
                    status={errors.instituteEmail && touched.instituteEmail ? 'error' : ''}
                  />
                  {errors.instituteEmail && touched.instituteEmail && (
                    <div className="text-red-500 text-sm mt-1">{errors.instituteEmail}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Support Email *</label>
                  <Input
                    name="supportEmail"
                    value={values.supportEmail}
                    onChange={handleChange}
                    status={errors.supportEmail && touched.supportEmail ? 'error' : ''}
                  />
                  {errors.supportEmail && touched.supportEmail && (
                    <div className="text-red-500 text-sm mt-1">{errors.supportEmail}</div>
                  )}
                </div>
              </div>

              {/* Logo Upload */}
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Institute Logo</label>
                <Upload
                  showUploadList={false}
                  beforeUpload={() => false}
                  onChange={handleLogoUpload}
                  accept="image/*"
                >
                  <Button icon={<UploadOutlined />}>
                    {logoFile ? 'Change Logo' : 'Upload Logo'}
                  </Button>
                </Upload>
                {logoFile && (
                  <div className="mt-2 text-sm text-gray-600">
                    Selected: {logoFile.name}
                  </div>
                )}
              </div>
            </Card>

            {/* User Management Settings */}
            <Card title="User Management" className="mb-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Allow User Registration</div>
                    <div className="text-sm text-gray-600">Allow new users to register accounts</div>
                  </div>
                  <Switch
                    checked={values.allowRegistration}
                    onChange={(checked) => setFieldValue('allowRegistration', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Require Email Verification</div>
                    <div className="text-sm text-gray-600">Require email verification for new accounts</div>
                  </div>
                  <Switch
                    checked={values.requireEmailVerification}
                    onChange={(checked) => setFieldValue('requireEmailVerification', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Enable Notifications</div>
                    <div className="text-sm text-gray-600">Send email notifications to users</div>
                  </div>
                  <Switch
                    checked={values.enableNotifications}
                    onChange={(checked) => setFieldValue('enableNotifications', checked)}
                  />
                </div>
              </div>
            </Card>

            {/* System Settings */}
            <Card title="System Settings" className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Max File Upload Size (MB) *</label>
                  <Input
                    name="maxFileSize"
                    type="number"
                    min={1}
                    max={100}
                    value={values.maxFileSize}
                    onChange={handleChange}
                    status={errors.maxFileSize && touched.maxFileSize ? 'error' : ''}
                  />
                  {errors.maxFileSize && touched.maxFileSize && (
                    <div className="text-red-500 text-sm mt-1">{errors.maxFileSize}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Session Timeout (minutes) *</label>
                  <Input
                    name="sessionTimeout"
                    type="number"
                    min={15}
                    max={480}
                    value={values.sessionTimeout}
                    onChange={handleChange}
                    status={errors.sessionTimeout && touched.sessionTimeout ? 'error' : ''}
                  />
                  {errors.sessionTimeout && touched.sessionTimeout && (
                    <div className="text-red-500 text-sm mt-1">{errors.sessionTimeout}</div>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Maintenance Mode</div>
                    <div className="text-sm text-gray-600">Put the platform in maintenance mode</div>
                  </div>
                  <Switch
                    checked={values.maintenanceMode}
                    onChange={(checked) => setFieldValue('maintenanceMode', checked)}
                  />
                </div>
              </div>
            </Card>

            {/* Data Management */}
            <Card title="Data Management" className="mb-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Automatic Backup Frequency</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={values.backupFrequency}
                    onChange={(e) => setFieldValue('backupFrequency', e.target.value)}
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <Divider />

                <div className="space-y-2">
                  <h3 className="font-medium text-red-600">Danger Zone</h3>
                  <p className="text-sm text-gray-600">
                    These actions are irreversible. Please proceed with caution.
                  </p>

                  <Space>
                    <Button onClick={handleArchiveData}>
                      Archive Old Data
                    </Button>
                    <Button onClick={handleResetToDefaults}>
                      Reset to Defaults
                    </Button>
                    <Button danger onClick={handleSystemReset}>
                      System Reset
                    </Button>
                  </Space>
                </div>
              </div>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading}
                size="large"
              >
                Save Settings
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default PlatformSettings;
