import React, { useState } from 'react';
import { Card, Table, Button, Space, Tag, Select, DatePicker, Row, Col, Statistic, Tabs } from 'antd';
import {
  DownloadOutlined,
  FileTextOutlined,
  UserOutlined,
  BookOutlined,
  BarChartOutlined,
  LineChartOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { users } from '../../data/users';
import { assessments } from '../../data/assessments';
import { submissions } from '../../data/submissions';
import { toast } from 'react-toastify';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const LogsReports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [dateRange, setDateRange] = useState(null);

  // Mock activity logs
  const activityLogs = [
    {
      id: 1,
      timestamp: '2024-01-25T14:30:00Z',
      user: 'John Doe',
      action: 'assessment_submitted',
      details: 'Submitted assessment: Introduction to Data Structures',
      ip: '192.168.1.100',
      userAgent: 'Chrome/120.0.0.0'
    },
    {
      id: 2,
      timestamp: '2024-01-25T14:15:00Z',
      user: 'Jane Smith',
      action: 'assessment_evaluated',
      details: 'Evaluated submission for Calculus Fundamentals',
      ip: '192.168.1.101',
      userAgent: 'Firefox/121.0.0.0'
    },
    {
      id: 3,
      timestamp: '2024-01-25T13:45:00Z',
      user: 'Alice Johnson',
      action: 'user_login',
      details: 'Logged in to the platform',
      ip: '192.168.1.102',
      userAgent: 'Safari/17.0.0.0'
    },
    {
      id: 4,
      timestamp: '2024-01-25T13:30:00Z',
      user: 'Bob Wilson',
      action: 'assessment_created',
      details: 'Created new assessment: Database Design Principles',
      ip: '192.168.1.103',
      userAgent: 'Chrome/120.0.0.0'
    },
    {
      id: 5,
      timestamp: '2024-01-25T12:00:00Z',
      user: 'Admin User',
      action: 'user_created',
      details: 'Created new user account',
      ip: '192.168.1.104',
      userAgent: 'Chrome/120.0.0.0'
    }
  ];

  const getActionColor = (action) => {
    switch (action) {
      case 'user_login': return 'blue';
      case 'user_created': return 'green';
      case 'assessment_created': return 'purple';
      case 'assessment_submitted': return 'orange';
      case 'assessment_evaluated': return 'cyan';
      case 'user_deleted': return 'red';
      default: return 'default';
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'user_login':
      case 'user_created':
      case 'user_deleted': return <UserOutlined />;
      case 'assessment_created':
      case 'assessment_submitted':
      case 'assessment_evaluated': return <BookOutlined />;
      default: return <FileTextOutlined />;
    }
  };

  const handleExportLogs = () => {
    // Mock export functionality
    toast.success('Activity logs exported successfully!');
  };

  const handleExportReport = (type) => {
    // Mock export functionality
    toast.success(`${type} report exported successfully!`);
  };

  const logColumns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => new Date(timestamp).toLocaleString(),
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    },
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
      render: (user) => <span className="font-medium">{user}</span>
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action) => (
        <Tag color={getActionColor(action)} icon={getActionIcon(action)}>
          {action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </Tag>
      ),
      filters: [
        { text: 'User Login', value: 'user_login' },
        { text: 'User Created', value: 'user_created' },
        { text: 'Assessment Created', value: 'assessment_created' },
        { text: 'Assessment Submitted', value: 'assessment_submitted' },
        { text: 'Assessment Evaluated', value: 'assessment_evaluated' }
      ],
      onFilter: (value, record) => record.action === value
    },
    {
      title: 'Details',
      dataIndex: 'details',
      key: 'details',
      ellipsis: true
    },
    {
      title: 'IP Address',
      dataIndex: 'ip',
      key: 'ip',
      render: (ip) => <span className="font-mono text-sm">{ip}</span>
    }
  ];

  // Generate mock analytics data
  const analyticsData = {
    userRegistrations: {
      today: 3,
      thisWeek: 15,
      thisMonth: 67
    },
    assessmentActivity: {
      created: 8,
      submitted: 45,
      evaluated: 38
    },
    systemHealth: {
      uptime: '99.8%',
      avgResponseTime: '1.2s',
      errorRate: '0.1%'
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Logs & Reports
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor platform activity and generate reports
        </p>
      </div>

      <Tabs defaultActiveKey="1">
        <TabPane tab="Activity Logs" key="1">
          <Card>
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
              <Select
                value={selectedPeriod}
                onChange={setSelectedPeriod}
                style={{ width: 120 }}
              >
                <Option value="1h">Last Hour</Option>
                <Option value="24h">Last 24 Hours</Option>
                <Option value="7d">Last 7 Days</Option>
                <Option value="30d">Last 30 Days</Option>
              </Select>

              <RangePicker
                onChange={(dates) => setDateRange(dates)}
                placeholder={['Start Date', 'End Date']}
              />

              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleExportLogs}
              >
                Export Logs
              </Button>
            </div>

            <Table
              columns={logColumns}
              dataSource={activityLogs}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} activities`
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Analytics & Reports" key="2">
          <div className="space-y-6">
            {/* User Analytics */}
            <Card title="User Analytics" extra={
              <Button icon={<DownloadOutlined />} onClick={() => handleExportReport('User Analytics')}>
                Export
              </Button>
            }>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Statistic
                    title="Total Users"
                    value={users.length}
                    prefix={<UserOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Statistic
                    title="Active Users"
                    value={users.filter(u => u.isActive).length}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Statistic
                    title="New Registrations (This Month)"
                    value={analyticsData.userRegistrations.thisMonth}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Col>
              </Row>
            </Card>

            {/* Assessment Analytics */}
            <Card title="Assessment Analytics" extra={
              <Button icon={<DownloadOutlined />} onClick={() => handleExportReport('Assessment Analytics')}>
                Export
              </Button>
            }>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Statistic
                    title="Total Assessments"
                    value={assessments.length}
                    prefix={<BookOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Statistic
                    title="Active Assessments"
                    value={assessments.filter(a => a.status === 'active').length}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Statistic
                    title="Total Submissions"
                    value={submissions.length}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Col>
              </Row>

              <div className="mt-6">
                <h3 className="font-medium mb-4">Recent Activity</h3>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <Card size="small" className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {analyticsData.assessmentActivity.created}
                      </div>
                      <div className="text-sm text-gray-600">Assessments Created</div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card size="small" className="text-center">
                      <div className="text-lg font-bold text-orange-600">
                        {analyticsData.assessmentActivity.submitted}
                      </div>
                      <div className="text-sm text-gray-600">Submissions</div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card size="small" className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {analyticsData.assessmentActivity.evaluated}
                      </div>
                      <div className="text-sm text-gray-600">Evaluated</div>
                    </Card>
                  </Col>
                </Row>
              </div>
            </Card>

            {/* System Health */}
            <Card title="System Health" extra={
              <Button icon={<DownloadOutlined />} onClick={() => handleExportReport('System Health')}>
                Export
              </Button>
            }>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Card size="small" className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {analyticsData.systemHealth.uptime}
                    </div>
                    <div className="text-sm text-gray-600">System Uptime</div>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small" className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {analyticsData.systemHealth.avgResponseTime}
                    </div>
                    <div className="text-sm text-gray-600">Avg Response Time</div>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small" className="text-center">
                    <div className="text-lg font-bold text-red-600">
                      {analyticsData.systemHealth.errorRate}
                    </div>
                    <div className="text-sm text-gray-600">Error Rate</div>
                  </Card>
                </Col>
              </Row>
            </Card>
          </div>
        </TabPane>

        <TabPane tab="Performance Metrics" key="3">
          <Card title="Performance Overview">
            <div className="text-center py-12">
              <BarChartOutlined className="text-6xl text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Performance Charts
              </h3>
              <p className="text-gray-500">
                Detailed performance metrics and trends will be displayed here.
                <br />
                This includes response times, user engagement, and system performance over time.
              </p>
            </div>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default LogsReports;
