import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Tag, Select, Row, Col, Statistic,
  Tabs, Spin, Alert, Badge, Timeline, Tooltip, Modal, Progress
} from 'antd';
import {
  DownloadOutlined, SafetyOutlined, WarningOutlined, CheckCircleOutlined,
  CloseCircleOutlined, LockOutlined, UserOutlined, BookOutlined,
  ReloadOutlined, ExclamationCircleOutlined, FileTextOutlined
} from '@ant-design/icons';
import { adminAPI } from '../../services/api';
import { toast } from 'react-toastify';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, LineChart, Line
} from 'recharts';

const { Option } = Select;
const LogsReports = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedAction, setSelectedAction] = useState('');
  const [total, setTotal] = useState(0);

  // Audit Chain Integrity State
  const [integrityResult, setIntegrityResult] = useState(null);
  const [integrityLoading, setIntegrityLoading] = useState(false);

  // Suspicious Activity State
  const [suspicious, setSuspicious] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [suspiciousLoading, setSuspiciousLoading] = useState(false);

  const [selectedLog, setSelectedLog] = useState(null);
  const [logDetailModal, setLogDetailModal] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getLogs({ period: selectedPeriod, action: selectedAction });
      setLogs(res.data || []);
      setTotal(res.total || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, selectedAction]);

  const fetchSuspicious = useCallback(async () => {
    setSuspiciousLoading(true);
    try {
      const res = await adminAPI.getSuspiciousActivity();
      // Handle both old array and new object structures
      if (res.data && res.data.highRiskSubmissions) {
        setSuspicious(res.data.highRiskSubmissions || []);
        setAlerts(res.data.alerts || []);
      } else {
        setSuspicious(res.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSuspiciousLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    adminAPI.getStats().then(res => setStats(res.data)).catch(console.error);
    fetchSuspicious();
  }, [fetchLogs, fetchSuspicious]);

  // ─── Audit Chain Integrity Verification ─────────────────
  const handleVerifyIntegrity = async () => {
    setIntegrityLoading(true);
    setIntegrityResult(null);
    try {
      const res = await adminAPI.verifyLogIntegrity();
      setIntegrityResult(res.data);
      if (res.data?.valid) {
        toast.success('✅ Audit chain integrity verified — no tampering detected!');
      } else {
        toast.error(`🚨 Chain broken at sequence #${res.data?.brokenIndex}!`);
      }
    } catch (e) {
      toast.error('Verification failed');
    } finally {
      setIntegrityLoading(false);
    }
  };

  const getActionColor = (action) => {
    if (!action) return 'default';
    if (action.toLowerCase().includes('login')) return 'blue';
    if (action.toLowerCase().includes('created')) return 'green';
    if (action.toLowerCase().includes('deleted')) return 'red';
    if (action.toLowerCase().includes('evaluated')) return 'cyan';
    if (action.toLowerCase().includes('submitted')) return 'orange';
    if (action.toLowerCase().includes('anomaly') || action.toLowerCase().includes('risk')) return 'red';
    return 'purple';
  };

  const getRiskBadge = (risk) => {
    if (!risk) return null;
    const colors = { High: 'error', Medium: 'warning', Low: 'success' };
    return <Badge status={colors[risk] || 'default'} text={risk} />;
  };

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'User', 'Role', 'Action', 'Details', 'IP', 'Seq#', 'Hash'],
      ...logs.map(l => [
        new Date(l.createdAt).toLocaleString(), l.user, l.role, l.action,
        l.details, l.ip, l.sequenceIndex, l.currentHash?.substring(0, 16) + '...'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Audit logs exported!');
  };

  // Action frequency chart data
  const actionFreq = logs.reduce((acc, l) => {
    const key = (l.action || 'unknown').replace(/_/g, ' ');
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const chartData = Object.entries(actionFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  const logColumns = [
    {
      title: '#', dataIndex: 'sequenceIndex', key: 'seq', width: 60,
      render: (idx) => <span className="font-mono text-xs text-gray-400">#{idx}</span>
    },
    {
      title: 'Timestamp', dataIndex: 'createdAt', key: 'timestamp', width: 160,
      render: (ts) => <span className="text-xs">{new Date(ts).toLocaleString()}</span>,
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    },
    {
      title: 'User', dataIndex: 'user', key: 'user',
      render: (user, row) => (
        <div>
          <div className="font-medium text-sm">{user}</div>
          <Tag color="blue" className="text-xs">{row.role}</Tag>
        </div>
      )
    },
    {
      title: 'Action', dataIndex: 'action', key: 'action',
      render: (action) => (
        <Tag color={getActionColor(action)}>
          {action?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </Tag>
      )
    },
    { title: 'Details', dataIndex: 'details', key: 'details', ellipsis: true },
    {
      title: 'IP Address', dataIndex: 'ip', key: 'ip',
      render: (ip) => <span className="font-mono text-xs bg-gray-100 px-1 rounded">{ip}</span>
    },
    {
      title: 'Hash', dataIndex: 'currentHash', key: 'hash',
      render: (hash) => (
        <Tooltip title={hash}>
          <span className="font-mono text-xs text-gray-400 cursor-help">
            <LockOutlined className="mr-1" />
            {hash?.substring(0, 8)}...
          </span>
        </Tooltip>
      )
    },
    {
      title: 'Actions', key: 'actions',
      render: (_, row) => (
        <Button size="small" onClick={() => { setSelectedLog(row); setLogDetailModal(true); }}>
          Inspect
        </Button>
      )
    }
  ];

  const suspiciousColumns = [
    { title: 'Student', dataIndex: 'studentName', key: 'name', render: v => <span className="font-medium">{v}</span> },
    {
      title: 'Risk Score', dataIndex: 'riskScore', key: 'riskScore',
      render: (score) => (
        <div className="w-24">
          <Progress
            percent={Math.min(score, 100)}
            size="small"
            strokeColor={score >= 70 ? '#ff4d4f' : score >= 30 ? '#faad14' : '#52c41a'}
            format={() => score}
          />
        </div>
      ),
      sorter: (a, b) => a.riskScore - b.riskScore
    },
    {
      title: 'Risk Level', dataIndex: 'riskLevel', key: 'riskLevel',
      render: getRiskBadge
    },
    {
      title: 'Tab Switches', dataIndex: ['anomalyMetrics', 'tabSwitches'], key: 'tabs',
      render: (v) => <Tag color={v > 3 ? 'red' : 'default'}>{v || 0}</Tag>
    },
    {
      title: 'Copy-Pastes', dataIndex: ['anomalyMetrics', 'copyPastes'], key: 'cp',
      render: (v) => <Tag color={v > 1 ? 'orange' : 'default'}>{v || 0}</Tag>
    },
    {
      title: 'Time Deviation', dataIndex: ['anomalyMetrics', 'timeDeviation'], key: 'td',
      render: (v) => v > 1 ? <Tag color="red">Severe</Tag> : v > 0 ? <Tag color="orange">Moderate</Tag> : <Tag color="green">Normal</Tag>
    },
    { title: 'Assessment', dataIndex: ['assessmentId', 'title'], key: 'assessment', ellipsis: true },
    { title: 'Date', dataIndex: 'submittedAt', key: 'date', render: (d) => new Date(d).toLocaleDateString() }
  ];

  const tabItems = [
    {
      key: '1',
      label: <span><FileTextOutlined />Activity Logs</span>,
      children: (
        <>
          {/* Chain Integrity Panel */}
          <Card className="mb-4 border-blue-200 bg-blue-50" styles={{ body: { padding: '16px' } }}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <SafetyOutlined className="text-blue-600 text-lg" />
                  <span className="font-bold text-blue-800">Hash-Chain Integrity Verification</span>
                  <Tag color="blue" className="text-xs">System Feature</Tag>
                </div>
                <p className="text-blue-600 text-xs m-0">
                  Each log entry is linked via SHA-256 hash. Verify the entire chain has not been tampered with.
                </p>
              </div>
              <div className="flex items-center gap-4">
                {integrityResult && (
                  <div className="flex items-center gap-2">
                    {integrityResult.valid ? (
                      <Alert message="Chain INTACT — No tampering detected" type="success" icon={<CheckCircleOutlined />} showIcon banner className="text-xs" />
                    ) : (
                      <Alert
                        message={`TAMPERED! Chain broken at sequence #${integrityResult.brokenIndex}`}
                        type="error" icon={<CloseCircleOutlined />} showIcon banner className="text-xs"
                      />
                    )}
                  </div>
                )}
                <Button
                  type="primary"
                  icon={<SafetyOutlined />}
                  loading={integrityLoading}
                  onClick={handleVerifyIntegrity}
                  style={{ background: '#1d4ed8' }}
                >
                  Verify Chain
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex flex-wrap gap-3 mb-4">
              <Select value={selectedPeriod} onChange={setSelectedPeriod} style={{ width: 140 }}>
                <Option value="1h">Last Hour</Option>
                <Option value="24h">Last 24 Hours</Option>
                <Option value="7d">Last 7 Days</Option>
                <Option value="30d">Last 30 Days</Option>
              </Select>
              <Select value={selectedAction} onChange={setSelectedAction} style={{ width: 220 }} allowClear placeholder="Filter by action">
                <Option value="USER_LOGIN">User Login</Option>
                <Option value="USER_CREATED">User Created</Option>
                <Option value="USER_DELETED">User Deleted</Option>
                <Option value="ASSESSMENT_CREATED">Assessment Created</Option>
                <Option value="ASSESSMENT_SUBMITTED">Assessment Submitted</Option>
                <Option value="ASSESSMENT_EVALUATED">Assessment Evaluated</Option>
                <Option value="ANOMALY_DETECTED">Anomaly Detected</Option>
              </Select>
            </div>
            <Table
              columns={logColumns}
              dataSource={logs}
              rowKey="_id"
              loading={loading}
              size="small"
              rowClassName={(row) => row.action?.toLowerCase().includes('anomaly') ? 'bg-red-50' : ''}
              pagination={{ pageSize: 20, total, showTotal: (t, r) => `${r[0]}-${r[1]} of ${t}` }}
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </>
      )
    },
    {
      key: '2',
      label: <span><WarningOutlined className="text-red-500" />Anomaly Monitor</span>,
      children: (
        <>
          <Row gutter={[16, 16]} className="mb-4">
            <Col xs={24} sm={8}>
              <Card className="border-red-200 bg-red-50">
                <Statistic
                  title="High Risk Submissions"
                  value={Array.isArray(suspicious) ? suspicious.filter(s => s.riskLevel === 'High').length : 0}
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<ExclamationCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card className="border-yellow-200 bg-yellow-50">
                <Statistic
                  title="Medium Risk Submissions"
                  value={Array.isArray(suspicious) ? suspicious.filter(s => s.riskLevel === 'Medium').length : 0}
                  valueStyle={{ color: '#d46b08' }}
                  prefix={<WarningOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card className="border-green-200 bg-green-50">
                <Statistic
                  title="Clean Submissions"
                  value={Array.isArray(suspicious) ? suspicious.filter(s => s.riskLevel === 'Low' || !s.riskLevel).length : 0}
                  valueStyle={{ color: '#389e0d' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card
                title={<span><WarningOutlined className="mr-2 text-orange-500" />Flagged Submissions — Risk Score Analysis</span>}
                extra={<Tag color="blue">Multi-Factor Scoring</Tag>}
              >
                <p className="text-xs text-gray-500 mb-3">
                  TrustScore = 100 - (TabSwitches × 5) - (Copy-Pastes × 10) - (IP-Change × 20) - (FastAnswer × 3)
                </p>
                <Table
                  columns={suspiciousColumns}
                  dataSource={suspicious}
                  rowKey="_id"
                  loading={suspiciousLoading}
                  size="small"
                  rowClassName={(row) => {
                    if (row.riskLevel === 'High') return 'bg-red-50';
                    if (row.riskLevel === 'Medium') return 'bg-yellow-50';
                    return '';
                  }}
                  scroll={{ x: 'max-content' }}
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title={<span><ReloadOutlined className="mr-2" />System Pattern Alerts</span>}>
                {alerts.length > 0 ? (
                  <Timeline
                    mode="left"
                    items={alerts.map(alert => ({
                      color: alert.type.includes('CHEATING') ? 'red' : 'orange',
                      children: (
                        <div>
                          <div className="font-bold text-xs">{alert.type.replace(/_/g, ' ')}</div>
                          <div className="text-xs text-gray-600 mb-1">{alert.message}</div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            {new Date(alert.createdAt).toLocaleString()}
                          </div>
                        </div>
                      )
                    }))}
                  />
                ) : (
                  <div className="text-center py-8 text-gray-400">No pattern alerts detected recently</div>
                )}
              </Card>
            </Col>
          </Row>
        </>
      )
    },
    {
      key: '3',
      label: <span><BookOutlined />Analytics</span>,
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="Platform Activity Overview">
              <Row gutter={[16, 16]}>
                <Col span={12}><Statistic title="Total Users" value={stats?.users?.total || 0} prefix={<UserOutlined />} valueStyle={{ color: '#1890ff' }} /></Col>
                <Col span={12}><Statistic title="Active Users" value={stats?.users?.active || 0} valueStyle={{ color: '#52c41a' }} /></Col>
                <Col span={12}><Statistic title="Assessments" value={stats?.assessments?.total || 0} prefix={<BookOutlined />} valueStyle={{ color: '#722ed1' }} /></Col>
                <Col span={12}><Statistic title="Submissions" value={stats?.submissions?.total || 0} valueStyle={{ color: '#13c2c2' }} /></Col>
              </Row>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Action Frequency Distribution">
              {chartData.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis />
                      <RechartTooltip />
                      <Bar dataKey="count" fill="#1890ff" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-400">No log data yet</div>
              )}
            </Card>
          </Col>
        </Row>
      )
    }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Audit Logs & Security Reports</h1>
          <p className="text-gray-500 text-sm">Cryptographic hash-chained audit trail with real-time integrity verification</p>
        </div>
        <div className="flex gap-2">
          <Button icon={<ReloadOutlined />} onClick={fetchLogs}>Refresh</Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>Export CSV</Button>
        </div>
      </div>

      <Tabs defaultActiveKey="1" items={tabItems} />

      {/* Log Detail Modal */}
      <Modal
        open={logDetailModal}
        onCancel={() => setLogDetailModal(false)}
        title={<span><LockOutlined className="mr-2" />Audit Log Entry — Cryptographic Detail</span>}
        footer={null}
        width={700}
      >
        {selectedLog && (
          <div className="space-y-3">
            <Row gutter={16}>
              <Col span={12}>
                <div className="text-xs text-gray-400 uppercase mb-1">Sequence Index</div>
                <div className="font-mono font-bold text-lg">#{selectedLog.sequenceIndex}</div>
              </Col>
              <Col span={12}>
                <div className="text-xs text-gray-400 uppercase mb-1">Action</div>
                <Tag color={getActionColor(selectedLog.action)} className="text-sm">{selectedLog.action}</Tag>
              </Col>
            </Row>
            <div>
              <div className="text-xs text-gray-400 uppercase mb-1">User</div>
              <span className="font-medium">{selectedLog.user}</span>
              <Tag className="ml-2">{selectedLog.role}</Tag>
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase mb-1">Details</div>
              <div className="bg-gray-50 p-2 rounded text-sm">{selectedLog.details}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase mb-1">IP Address</div>
              <span className="font-mono">{selectedLog.ip}</span>
            </div>
            {selectedLog.anomalyJustification && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <div className="text-xs text-red-600 uppercase font-bold mb-2">🤖 XAI Justification (Explainable AI)</div>
                <div className="text-sm text-red-800">{selectedLog.anomalyJustification}</div>
              </div>
            )}
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="text-xs text-blue-600 uppercase font-bold mb-2">🔒 Cryptographic Chain</div>
              <div className="mb-2">
                <div className="text-xs text-gray-500">Previous Hash</div>
                <div className="font-mono text-xs break-all text-gray-600">{selectedLog.previousHash}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Current Hash (SHA-256)</div>
                <div className="font-mono text-xs break-all text-blue-700 font-bold">{selectedLog.currentHash}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LogsReports;