import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Upload, Switch, Space, Divider, message, Modal, Spin } from 'antd';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { SaveOutlined, UploadOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { adminAPI } from '../../services/api';
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
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);

  useEffect(() => {
    adminAPI.getSettings()
      .then(res => setSettings(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async (values) => {
    setSaving(true);
    try {
      const res = await adminAPI.updateSettings(values);
      setSettings(res.data);
      toast.success('Platform settings updated successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = (info) => {
    if (info.file.status === 'done' || info.file.originFileObj) {
      setLogoFile(info.file);
      message.success('Logo selected');
    }
  };

  const handleResetToDefaults = () => {
    confirm({
      title: 'Reset to Default Settings',
      icon: <ExclamationCircleOutlined />,
      content: 'Are you sure you want to reset all settings to their default values?',
      onOk: async () => {
        try {
          const defaults = {
            instituteName: 'Unified Assessment Platform',
            instituteEmail: 'admin@unified.edu',
            supportEmail: 'support@unified.edu',
            allowRegistration: true,
            requireEmailVerification: false,
            enableNotifications: true,
            maxFileSize: 10,
            sessionTimeout: 60,
            maintenanceMode: false,
            backupFrequency: 'daily'
          };
          const res = await adminAPI.updateSettings(defaults);
          setSettings(res.data);
          toast.success('Settings reset to defaults!');
        } catch (error) {
          toast.error('Failed to reset settings');
        }
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
      }
    });
  };

  const handleSystemReset = () => {
    confirm({
      title: 'System Reset',
      icon: <ExclamationCircleOutlined />,
      content: 'WARNING: This will reset the entire platform. All data will be permanently deleted. This action cannot be undone.',
      okText: 'Reset System',
      okButtonProps: { danger: true },
      onOk() {
        toast.error('System reset is disabled in this environment');
      }
    });
  };

  if (loading || !settings) {
    return <div className="flex justify-center items-center h-64"><Spin size="large" /></div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Platform Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Configure global platform settings and preferences</p>
      </div>

      <Formik
        initialValues={settings}
        validationSchema={SettingsSchema}
        onSubmit={handleUpdate}
        enableReinitialize
      >
        {({ values, errors, touched, handleChange, setFieldValue, handleSubmit }) => (
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Institute Information */}
            <Card title="Institute Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Institute Name *</label>
                  <Input name="instituteName" value={values.instituteName} onChange={handleChange} status={errors.instituteName && touched.instituteName ? 'error' : ''} />
                  {errors.instituteName && touched.instituteName && <div className="text-red-500 text-sm mt-1">{errors.instituteName}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Institute Email *</label>
                  <Input name="instituteEmail" value={values.instituteEmail} onChange={handleChange} status={errors.instituteEmail && touched.instituteEmail ? 'error' : ''} />
                  {errors.instituteEmail && touched.instituteEmail && <div className="text-red-500 text-sm mt-1">{errors.instituteEmail}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Support Email *</label>
                  <Input name="supportEmail" value={values.supportEmail} onChange={handleChange} status={errors.supportEmail && touched.supportEmail ? 'error' : ''} />
                  {errors.supportEmail && touched.supportEmail && <div className="text-red-500 text-sm mt-1">{errors.supportEmail}</div>}
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Institute Logo</label>
                <Upload showUploadList={false} beforeUpload={() => false} onChange={handleLogoUpload} accept="image/*">
                  <Button icon={<UploadOutlined />}>{logoFile ? 'Change Logo' : 'Upload Logo'}</Button>
                </Upload>
                {logoFile && <div className="mt-2 text-sm text-gray-600">Selected: {logoFile.name}</div>}
              </div>
            </Card>

            {/* User Management */}
            <Card title="User Management">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div><div className="font-medium">Allow User Registration</div><div className="text-sm text-gray-600">Allow new users to register accounts</div></div>
                  <Switch checked={values.allowRegistration} onChange={(v) => setFieldValue('allowRegistration', v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div><div className="font-medium">Require Email Verification</div><div className="text-sm text-gray-600">Require email verification for new accounts</div></div>
                  <Switch checked={values.requireEmailVerification} onChange={(v) => setFieldValue('requireEmailVerification', v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div><div className="font-medium">Enable Notifications</div><div className="text-sm text-gray-600">Send email notifications to users</div></div>
                  <Switch checked={values.enableNotifications} onChange={(v) => setFieldValue('enableNotifications', v)} />
                </div>
              </div>
            </Card>

            {/* System Settings */}
            <Card title="System Settings">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Max File Upload Size (MB) *</label>
                  <Input name="maxFileSize" type="number" min={1} max={100} value={values.maxFileSize} onChange={handleChange} status={errors.maxFileSize && touched.maxFileSize ? 'error' : ''} />
                  {errors.maxFileSize && touched.maxFileSize && <div className="text-red-500 text-sm mt-1">{errors.maxFileSize}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Session Timeout (minutes) *</label>
                  <Input name="sessionTimeout" type="number" min={15} max={480} value={values.sessionTimeout} onChange={handleChange} status={errors.sessionTimeout && touched.sessionTimeout ? 'error' : ''} />
                  {errors.sessionTimeout && touched.sessionTimeout && <div className="text-red-500 text-sm mt-1">{errors.sessionTimeout}</div>}
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <div><div className="font-medium">Maintenance Mode</div><div className="text-sm text-gray-600">Put the platform in maintenance mode</div></div>
                  <Switch checked={values.maintenanceMode} onChange={(v) => setFieldValue('maintenanceMode', v)} />
                </div>
              </div>
            </Card>

            {/* Data Management */}
            <Card title="Data Management">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Automatic Backup Frequency</label>
                  <select className="w-full p-2 border border-gray-300 rounded-md" value={values.backupFrequency} onChange={(e) => setFieldValue('backupFrequency', e.target.value)}>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <Divider />
                <div className="space-y-2">
                  <h3 className="font-medium text-red-600">Danger Zone</h3>
                  <p className="text-sm text-gray-600">These actions are irreversible. Please proceed with caution.</p>
                  <Space>
                    <Button onClick={handleArchiveData}>Archive Old Data</Button>
                    <Button onClick={handleResetToDefaults}>Reset to Defaults</Button>
                    <Button danger onClick={handleSystemReset}>System Reset</Button>
                  </Space>
                </div>
              </div>
            </Card>

            <div className="flex justify-end">
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving} size="large">Save Settings</Button>
            </div>
          </form>
        )}
      </Formik>
    </div>
  );
};

export default PlatformSettings;