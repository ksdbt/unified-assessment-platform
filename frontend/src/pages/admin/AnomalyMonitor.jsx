import React, { useState, useEffect } from 'react';
import {
    Card, Table, Button, Tag, Select, Progress, Row, Col,
    Statistic, Alert, Tooltip, Tabs, Badge, Modal, Timeline, Typography
} from 'antd';
import {
    EyeOutlined,
    SearchOutlined,
    WarningOutlined,
    LinkOutlined,
    AuditOutlined,
    CloudServerOutlined,
    SafetyOutlined,
    ReloadOutlined,
    ExclamationCircleOutlined,
    UserOutlined
} from '@ant-design/icons';
import { adminAPI, assessmentAPI } from '../../services/api';
import { toast } from 'react-toastify';
import NetworkGraph from './NetworkGraph';


const { Option } = Select;
const { Text } = Typography;

const AnomalyMonitor = () => {
    const [suspicious, setSuspicious] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [collusion, setCollusion] = useState([]);
    const [collusionLoading, setCollusionLoading] = useState(false);
    const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
    const [graphLoading, setGraphLoading] = useState(false);
    const [assessments, setAssessments] = useState([]);
    const [selectedAssessment, setSelectedAssessment] = useState(null);
    const [selectedSession, setSelectedSession] = useState(null);
    const [replayModal, setReplayModal] = useState(false);
    const [replayData, setReplayData] = useState(null);
    const [patternLoading, setPatternLoading] = useState(false);

    useEffect(() => {
        fetchSuspicious();
        assessmentAPI.getAll().then(res => setAssessments(res.data || [])).catch(console.error);
    }, []);

    const fetchSuspicious = async () => {
        setLoading(true);
        try {
            const res = await adminAPI.getSuspiciousActivity();
            if (res.data && res.data.highRiskSubmissions) {
                setSuspicious(res.data.highRiskSubmissions || []);
                setAlerts(res.data.alerts || []);
            } else {
                setSuspicious(res.data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDetectCollusion = async () => {
        if (!selectedAssessment) {
            toast.warning('Please select an assessment first');
            return;
        }
        setCollusionLoading(true);
        setGraphLoading(true);
        try {
            const [collRes, graphRes] = await Promise.all([
                adminAPI.detectCollusion(selectedAssessment),
                adminAPI.getNetworkGraphData(selectedAssessment)
            ]);
            setCollusion(collRes.data || []);
            setGraphData(graphRes.data || { nodes: [], edges: [] });

            if (collRes.data?.length === 0) {
                toast.success('No collusion detected — all submissions appear independent.');
            } else {
                toast.warning(`${collRes.data.length} suspicious pair(s) detected!`);
            }
        } catch (e) {
            toast.error('Collusion analysis failed');
        } finally {
            setCollusionLoading(false);
            setGraphLoading(false);
        }
    };

    const handleSessionReplay = async (submissionId) => {
        try {
            const res = await adminAPI.getSessionReplay(submissionId);
            setReplayData(res.data);
            setReplayModal(true);
        } catch (e) {
            toast.error('Failed to load session');
        }
    };

    const handleRunPatternAnalysis = async () => {
        setPatternLoading(true);
        try {
            await adminAPI.runPatternAnalysis();
            toast.success('Pattern analysis run! Cheating ring alerts issued to all admins.');
        } catch (e) {
            toast.error('Pattern analysis failed');
        } finally {
            setPatternLoading(false);
        }
    };

    const highRisk = Array.isArray(suspicious) ? suspicious.filter(s => s.riskLevel === 'High').length : 0;
    const medRisk = Array.isArray(suspicious) ? suspicious.filter(s => s.riskLevel === 'Medium').length : 0;

    const suspiciousColumns = [
        { title: 'Student', dataIndex: 'studentName', key: 'name', render: v => <span className="font-semibold">{v}</span> },
        {
            title: 'Risk Score', dataIndex: 'riskScore', key: 'riskScore', width: 160,
            render: (score) => (
                <div className="w-28">
                    <div className="text-xs text-gray-500 mb-1">R = {score}/100</div>
                    <Progress
                        percent={Math.min(score, 100)}
                        size="small"
                        strokeColor={score >= 70 ? '#ff4d4f' : score >= 30 ? '#faad14' : '#52c41a'}
                        format={() => null}
                    />
                </div>
            ),
            sorter: (a, b) => (a.riskScore || 0) - (b.riskScore || 0),
            defaultSortOrder: 'descend'
        },
        {
            title: 'Risk Level', dataIndex: 'riskLevel', key: 'riskLevel',
            render: (level) => {
                const color = { High: 'red', Medium: 'orange', Low: 'green' }[level] || 'default';
                return <Tag color={color}>{level || 'Low'}</Tag>;
            }
        },
        {
            title: 'Tab Switches', key: 'tabs',
            render: (_, row) => <Tag color={(row.anomalyMetrics?.tabSwitches || 0) > 3 ? 'red' : 'default'}>{row.anomalyMetrics?.tabSwitches || 0}</Tag>
        },
        {
            title: 'Paste Actions', key: 'cp',
            render: (_, row) => <Tag color={(row.anomalyMetrics?.copyPastes || 0) > 0 ? 'orange' : 'default'}>{row.anomalyMetrics?.copyPastes || 0}</Tag>
        },
        {
            title: 'Fast Answers', key: 'fastQ',
            render: (_, row) => {
                const fastCount = row.anomalyMetrics?.fastAnswers || 0;
                return <Tag color={fastCount > 0 ? 'red' : 'green'}>{fastCount} q</Tag>;
            }
        },
        {
            title: 'Exam DNA', key: 'dna',
            render: (_, row) => (
                <Tooltip title={row.examDNA || 'Not available'}>
                    <Tag color="geekblue" className="cursor-pointer">
                        <AuditOutlined className="mr-1" />
                        {row.examDNA ? `${row.examDNA.substring(0, 6)}...` : 'N/A'}
                    </Tag>
                </Tooltip>
            )
        },
        {
            title: 'Actions', key: 'actions',
            render: (_, row) => (
                <Button size="small" icon={<SearchOutlined />} onClick={() => handleSessionReplay(row._id || row.id)}>
                    Replay
                </Button>
            )
        }
    ];

    const collusionColumns = [
        {
            title: 'Student A', key: 'a',
            render: (_, row) => <span className="font-medium">{row.studentA?.name}</span>
        },
        {
            title: 'Student B', key: 'b',
            render: (_, row) => <span className="font-medium">{row.studentB?.name}</span>
        },
        {
            title: 'Similarity Score', dataIndex: 'jaccardScore', key: 'jaccard',
            render: (score) => (
                <div className="w-28">
                    <div className="text-xs font-mono mb-1">{score}% identical</div>
                    <Progress percent={score} size="small" strokeColor={score >= 90 ? '#ff4d4f' : score >= 80 ? '#faad14' : '#fa8c16'} format={() => null} />
                </div>
            ),
            sorter: (a, b) => a.jaccardScore - b.jaccardScore,
            defaultSortOrder: 'descend'
        },
        {
            title: 'Shared / Total', key: 'shared',
            render: (_, row) => <span className="text-xs font-mono">{row.sharedAnswers}/{row.totalQuestions}</span>
        },
        {
            title: 'Severity', dataIndex: 'severity', key: 'severity',
            render: (s) => <Tag color={{ Critical: 'red', High: 'orange', Medium: 'gold' }[s] || 'default'}>{s}</Tag>
        }
    ];


    const tabItems = [
        {
            key: '1',
            label: <span><WarningOutlined className="text-red-500" />Behavioral Risk Scores</span>,
            children: (
                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={17}>
                        <Card
                            title="Flagged Submissions — Multi-Factor Risk Formula"
                            extra={<Tag color="blue">TrustScore = 100 - (Ts×5) - (Cp×10) - (Ip×20) - (FastQ×3)</Tag>}
                        >
                            <Table
                                columns={suspiciousColumns}
                                dataSource={suspicious}
                                rowKey={r => r._id || r.id}
                                loading={loading}
                                size="small"
                                rowClassName={row => row.riskLevel === 'High' ? 'bg-red-50' : row.riskLevel === 'Medium' ? 'bg-orange-50' : ''}
                                scroll={{ x: 'max-content' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} lg={7}>
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
                                <div className="text-center py-8 text-gray-400">
                                    No pattern alerts detected.
                                    <div className="mt-2 text-[10px]">Run Analysis to check for patterns.</div>
                                </div>
                            )}
                        </Card>
                    </Col>
                </Row>
            )
        },
        {
            key: '2',
            label: <span><SafetyOutlined className="text-purple-500" />Collusion Detection</span>,
            children: (
                <Card
                    title="Cross-Student Answer Pattern Analysis"
                    extra={<Tag color="purple">Jaccard Similarity ≥ 75%</Tag>}
                >
                    <Alert
                        message="Jaccard Similarity Collusion Detector"
                        description={
                            <span>
                                Computes <strong>Collusion_Score(A,B) = |answers_A ∩ answers_B| / |answers_A ∪ answers_B|</strong>.
                                Pairs with ≥75% identical answers on rapidly-answered questions are flagged.
                            </span>
                        }
                        type="info"
                        showIcon
                        className="mb-4"
                    />
                    <div className="flex gap-3 mb-4">
                        <Select
                            style={{ width: 300 }}
                            placeholder="Select an assessment to analyze"
                            onChange={setSelectedAssessment}
                            allowClear
                        >
                            {assessments.map(a => (
                                <Option key={a._id} value={a._id}>{a.title}</Option>
                            ))}
                        </Select>
                        <Button
                            type="primary"
                            icon={<SearchOutlined />}
                            loading={collusionLoading}
                            onClick={handleDetectCollusion}
                        >
                            Detect Collusion
                        </Button>
                    </div>

                    {collusion.length > 0 ? (
                        <Table
                            columns={collusionColumns}
                            dataSource={collusion}
                            rowKey={(_, i) => i}
                            size="small"
                            rowClassName={row => row.severity === 'Critical' ? 'bg-red-100' : 'bg-orange-50'}
                            scroll={{ x: 'max-content' }}
                        />
                    ) : (
                        <div className="text-center py-12 text-gray-400">
                            Select an assessment and run detection to see collusion analysis results
                        </div>
                    )}
                </Card>
            )
        },
        {
            key: '3',
            label: <span><AuditOutlined className="text-blue-500" />Network Analysis</span>,
            children: (
                <Card
                    title="Cheating Network Graph (Behavioral Clusters)"
                    extra={<Tag color="blue">Multi-Factor Collusion Mapping</Tag>}
                >
                    <Alert
                        message="Collusion Cluster Identification"
                        description="Visualizes connections between students based on similarity in Answer Patterns, Behavioral DNA, and Risk Correlates. Groups of connected nodes indicate potential organized collusion."
                        type="info"
                        showIcon
                        className="mb-4"
                    />
                    <div className="flex gap-3 mb-4">
                        <Select
                            style={{ width: 300 }}
                            placeholder="Select an assessment to analyze"
                            value={selectedAssessment}
                            onChange={setSelectedAssessment}
                            allowClear
                        >
                            {assessments.map(a => (
                                <Option key={a._id} value={a._id}>{a.title}</Option>
                            ))}
                        </Select>
                        <Button
                            type="primary"
                            icon={<SearchOutlined />}
                            loading={graphLoading}
                            onClick={handleDetectCollusion}
                        >
                            Re-analyze Clusters
                        </Button>
                    </div>
                    <NetworkGraph data={graphData} loading={graphLoading} />
                </Card>
            )
        }
    ];

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Anomaly & Collusion Monitor</h1>
                    <p className="text-gray-500 text-sm">Real-time behavioral anomaly detection and cross-student collusion analysis</p>
                </div>
                <div className="flex gap-2">
                    <Button icon={<ReloadOutlined />} onClick={fetchSuspicious}>Refresh</Button>
                    <Button
                        type="primary"
                        danger
                        icon={<WarningOutlined />}
                        loading={patternLoading}
                        onClick={handleRunPatternAnalysis}
                    >
                        Run Pattern Analysis
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <Row gutter={[16, 16]} className="mb-6">
                <Col xs={24} sm={8}>
                    <Card className="border-red-200 bg-red-50">
                        <Statistic title="High Risk" value={highRisk} valueStyle={{ color: '#cf1322' }} prefix={<ExclamationCircleOutlined />} />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card className="border-yellow-200 bg-yellow-50">
                        <Statistic title="Medium Risk" value={medRisk} valueStyle={{ color: '#d46b08' }} prefix={<WarningOutlined />} />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card className="border-purple-200 bg-purple-50">
                        <Statistic title="Collusion Pairs" value={collusion.length} valueStyle={{ color: '#722ed1' }} prefix={<UserOutlined />} />
                    </Card>
                </Col>
            </Row>

            <Tabs defaultActiveKey="1" items={tabItems} />

            {/* Session Replay Modal */}
            <Modal
                open={replayModal}
                onCancel={() => setReplayModal(false)}
                title={<span><SearchOutlined className="mr-2" />Session Replay — Behavioral Timeline</span>}
                footer={null}
                width={650}
            >
                {replayData && (
                    <div className="space-y-3">
                        <Row gutter={16}>
                            <Col span={12}><div className="text-xs text-gray-400">Student</div><div className="font-bold">{replayData.studentName}</div></Col>
                            <Col span={6}>
                                <div className="text-xs text-gray-400">Risk Score</div>
                                <Tag color={replayData.riskScore >= 70 ? 'red' : replayData.riskScore >= 30 ? 'orange' : 'green'} className="text-base font-bold">
                                    {replayData.riskScore || 0}
                                </Tag>
                            </Col>
                            <Col span={6}><div className="text-xs text-gray-400">Time Taken</div><div className="font-mono">
                                {replayData.timeTaken > 3600
                                    ? `${Math.floor(replayData.timeTaken / 3600)}h ${Math.floor((replayData.timeTaken % 3600) / 60)}m`
                                    : `${Math.floor(replayData.timeTaken / 60)}m ${replayData.timeTaken % 60}s`}
                            </div></Col>
                        </Row>

                        {replayData.anomalyMetrics && (
                            <div className="bg-gray-50 rounded p-3">
                                <div className="text-xs font-bold uppercase mb-2 text-gray-500">Behavioral Metrics</div>
                                <Row gutter={[16, 8]}>
                                    <Col span={8}><div className="text-xs text-gray-400">Tab Switches</div><Tag color="orange">{replayData.anomalyMetrics.tabSwitches || 0}</Tag></Col>
                                    <Col span={8}><div className="text-xs text-gray-400">Paste Actions</div><Tag color="red">{replayData.anomalyMetrics.copyPastes || 0}</Tag></Col>
                                    <Col span={8}><div className="text-xs text-gray-400">Fast Answers</div><Tag color="purple">{replayData.anomalyMetrics.perQuestionRisk ? Math.round(replayData.anomalyMetrics.perQuestionRisk / 10) : 0}</Tag></Col>
                                </Row>
                            </div>
                        )}

                        {replayData.answers && (
                            <div>
                                <div className="text-xs font-bold uppercase mb-2 text-gray-500">Exam Behavior Timeline</div>
                                <div className="max-h-64 overflow-y-auto p-4 bg-gray-50 rounded-lg border border-gray-100 mb-4">
                                    <Timeline
                                        mode="left"
                                        items={[
                                            {
                                                label: '00:00',
                                                children: 'Assessment Started',
                                                color: 'blue'
                                            },
                                            ...(replayData.behaviorLogs || []).map(log => ({
                                                label: new Date(log.timestamp).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
                                                children: (
                                                    <span className="text-xs">
                                                        <Text strong>{log.event?.replace(/_/g, ' ')}</Text>
                                                        <br />
                                                        <Text type="secondary">{log.details}</Text>
                                                    </span>
                                                ),
                                                color: log.event?.includes('ANOMALY') || log.event?.includes('SWITCH') ? 'red' : 'green'
                                            })),
                                            {
                                                label: 'End',
                                                children: 'Assessment Submitted',
                                                color: 'gray'
                                            }
                                        ]}
                                    />
                                </div>

                                <div className="text-xs font-bold uppercase mb-2 text-gray-500">Question Performance</div>
                                <div className="max-h-64 overflow-y-auto space-y-1">
                                    {replayData.answers.map((a, i) => (
                                        <div key={i} className={`flex justify-between items-center text-xs p-2 rounded ${a.isCorrect === false ? 'bg-red-50' : a.isCorrect ? 'bg-green-50' : 'bg-gray-50'}`}>
                                            <span>Q{i + 1}</span>
                                            <Tag color={a.isCorrect ? 'green' : a.isCorrect === false ? 'red' : 'default'}>
                                                {a.isCorrect ? 'Correct' : a.isCorrect === false ? 'Wrong' : 'Pending'}
                                            </Tag>
                                            {a.timeSpent && <span className="font-mono text-gray-400">{Math.round(a.timeSpent)}s</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AnomalyMonitor;
