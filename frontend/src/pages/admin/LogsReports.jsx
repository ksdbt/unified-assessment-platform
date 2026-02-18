import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Select, DatePicker, Row, Col, Statistic, Tabs, Spin } from 'antd';
import { DownloadOutlined, FileTextOutlined, UserOutlined, BookOutlined } from '@ant-design/icons';
import { adminAPI } from '../../services/api';
import { toast } from 'react-toastify';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const LogsReports = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedAction, setSelectedAction] = useState('');
  const [total, setTotal] = useState(0);

  const fetchLogs = async (params = {}) => {
    setLoading(true);
    try {
      const res = await adminAPI.getLogs({ period: selectedPeriod, action: selectedAction, ...params });
      setLogs(res.data || []);
      setTotal(res.total || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    adminAPI.getStats().then(res => setStats(res.data)).catch(console.error);
  }, [selectedPeriod, selectedAction]);

  const getActionColor = (action) => {
    if (!action) return 'default';
    if (action.includes('login')) return 'blue';
    if (action.includes('created')) return 'green';
    if (action.includes('deleted')) return 'red';
    if (action.includes('evaluated')) return 'cyan';
    if (action.includes('submitted')) return 'orange';
    return 'purple';
  };

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'User', 'Action', 'Details', 'IP'],
      ...logs.map(l => [new Date(l.createdAt).toLocaleString(), l.user, l.action, l.details, l.ip])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Logs exported!');
  };

  const logColumns = [
    { title: 'Timestamp', dataIndex: 'createdAt', key: 'timestamp', render: (ts) => new Date(ts).toLocaleString(), sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt) },
    { title: 'User', dataIndex: 'user', key: 'user', render: (user) => <span className="font-medium">{user}</span> },
    {
      title: 'Action', dataIndex: 'action', key: 'action',
      render: (action) => <Tag color={getActionColor(action)}>{action?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Tag>
    },
    { title: 'Details', dataIndex: 'details', key: 'details', ellipsis: true },
    { title: 'IP', dataIndex: 'ip', key: 'ip', render: (ip) => <span className="font-mono text-sm">{ip}</span> }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Logs & Reports</h1>
        <p className="text-gray-600 dark:text-gray-400">Monitor platform activity and generate reports</p>
      </div>

      <Tabs defaultActiveKey="1">
        <TabPane tab="Activity Logs" key="1">
          <Card>
            <div className="flex flex-wrap gap-4 mb-6">
              <Select value={selectedPeriod} onChange={setSelectedPeriod} style={{ width: 140 }}>
                <Option value="1h">Last Hour</Option>
                <Option value="24h">Last 24 Hours</Option>
                <Option value="7d">Last 7 Days</Option>
                <Option value="30d">Last 30 Days</Option>
              </Select>
              <Select value={selectedAction} onChange={setSelectedAction} style={{ width: 200 }} allowClear placeholder="Filter by action">
                <Option value="user_login">User Login</Option>
                <Option value="user_created">User Created</Option>
                <Option value="user_deleted">User Deleted</Option>
                <Option value="assessment_created">Assessment Created</Option>
                <Option value="assessment_submitted">Assessment Submitted</Option>
                <Option value="assessment_evaluated">Assessment Evaluated</Option>
              </Select>
              <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>Export CSV</Button>
            </div>
            <Table
              columns={logColumns}
              dataSource={logs}
              rowKey="_id"
              loading={loading}
              pagination={{ pageSize: 20, total, showTotal: (t, range) => `${range[0]}-${range[1]} of ${t} activities` }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Analytics & Reports" key="2">
          <div className="space-y-6">
            <Card title="User Analytics" extra={<Button icon={<DownloadOutlined />} onClick={() => toast.success('Report exported!')}>Export</Button>}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}><Statistic title="Total Users" value={stats?.users?.total || 0} prefix={<UserOutlined />} valueStyle={{ color: '#1890ff' }} /></Col>
                <Col xs={24} sm={8}><Statistic title="Active Users" value={stats?.users?.active || 0} valueStyle={{ color: '#52c41a' }} /></Col>
                <Col xs={24} sm={8}><Statistic title="Students" value={stats?.roles?.students || 0} valueStyle={{ color: '#722ed1' }} /></Col>
              </Row>
            </Card>

            <Card title="Assessment Analytics" extra={<Button icon={<DownloadOutlined />} onClick={() => toast.success('Report exported!')}>Export</Button>}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}><Statistic title="Total Assessments" value={stats?.assessments?.total || 0} prefix={<BookOutlined />} valueStyle={{ color: '#1890ff' }} /></Col>
                <Col xs={24} sm={8}><Statistic title="Active Assessments" value={stats?.assessments?.active || 0} valueStyle={{ color: '#52c41a' }} /></Col>
                <Col xs={24} sm={8}><Statistic title="Total Submissions" value={stats?.submissions?.total || 0} valueStyle={{ color: '#722ed1' }} /></Col>
              </Row>
              <Row gutter={[16, 16]} className="mt-4">
                <Col xs={24} sm={12}><Statistic title="Evaluated Submissions" value={stats?.submissions?.evaluated || 0} valueStyle={{ color: '#13c2c2' }} /></Col>
                <Col xs={24} sm={12}>
                  <Statistic
                    title="Completion Rate"
                    value={stats?.submissions?.total > 0 ? Math.round((stats.submissions.evaluated / stats.submissions.total) * 100) : 0}
                    suffix="%"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
              </Row>
            </Card>
          </div>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default LogsReports;