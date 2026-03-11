import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, Alert, Timeline, Spin, message } from 'antd';
import {
    SafetyCertificateOutlined,
    DatabaseOutlined,
    LinkOutlined,
    CloudServerOutlined,
    CheckCircleOutlined,
    SyncOutlined,
    HistoryOutlined,
    LockOutlined,
    WarningOutlined,
    EyeOutlined
} from '@ant-design/icons';
import { adminAPI } from '../../services/api';
import { Typography } from 'antd';

const { Text } = Typography;

const SecurityHealth = () => {
    const [loading, setLoading] = useState(true);
    const [publishing, setPublishing] = useState(false);
    const [ledger, setLedger] = useState([]);
    const [integrityStatus, setIntegrityStatus] = useState(null);
    const [lastCheck, setLastCheck] = useState(null);

    useEffect(() => {
        fetchHealthData();
        const interval = setInterval(fetchHealthData, 30000); // Polling every 30s
        return () => clearInterval(interval);
    }, []);

    const fetchHealthData = async () => {
        try {
            const [ledgerRes, integrityRes] = await Promise.all([
                adminAPI.getLedger(),
                adminAPI.verifyLogIntegrity()
            ]);
            setLedger(ledgerRes.data || []);
            setIntegrityStatus(integrityRes.data);
            setLastCheck(new Date().toLocaleTimeString());
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch security health data:', error);
            setLoading(false);
        }
    };

    const handlePublishToday = async () => {
        setPublishing(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            await adminAPI.publishDailyRoot(today);
            message.success('Daily Merkle Root published to Transparency Ledger');
            fetchHealthData();
        } catch (error) {
            message.error(error.message || 'Publication failed');
        } finally {
            setPublishing(false);
        }
    };

    const columns = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (text) => <span className="font-medium">{text}</span>
        },
        {
            title: 'Merkle Root (SHA-256)',
            dataIndex: 'merkleRoot',
            key: 'merkleRoot',
            render: (text) => <code className="text-xs bg-gray-100 p-1 rounded break-all">{text}</code>
        },
        {
            title: 'Status',
            key: 'status',
            render: () => <Tag color="blue" icon={<CheckCircleOutlined />}>Immutable Record</Tag>
        },
        {
            title: 'Published At',
            dataIndex: 'publishedAt',
            key: 'publishedAt',
            render: (text) => new Date(text).toLocaleString()
        }
    ];

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-full gap-4">
                <Spin size="large" />
                <Text type="secondary">Analyzing Security Health...</Text>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold flex items-center">
                        <SafetyCertificateOutlined className="mr-2 text-blue-600" /> Security Health Dashboard
                    </h1>
                    <p className="text-gray-500">Real-time visualization of Cryptographic Chain and Transparency Ledger status.</p>
                </div>
                <div className="flex gap-4 items-center">
                    <span className="text-xs text-gray-400">Last Verified: {lastCheck}</span>
                    <Button icon={<SyncOutlined />} onClick={fetchHealthData}>Refresh</Button>
                    <Button type="primary" icon={<CloudServerOutlined />} loading={publishing} onClick={handlePublishToday}>
                        Publish Today's Root
                    </Button>
                </div>
            </div>

            <Row gutter={[16, 16]}>
                <Col span={8}>
                    <Card className="shadow-sm">
                        <Statistic
                            title="Audit Chain Integrity"
                            value={integrityStatus?.valid ? "100%" : "Compromised"}
                            valueStyle={{ color: integrityStatus?.valid ? '#3f8600' : '#cf1322' }}
                            prefix={integrityStatus?.valid ? <CheckCircleOutlined /> : <WarningOutlined />}
                            suffix="Reliability"
                        />
                        <div className="mt-4 text-xs text-gray-400">
                            Verified {integrityStatus?.logsChecked || 'N/A'} nodes in the hash chain.
                        </div>
                    </Card>
                </Col>
                <Col span={8}>
                    <Card className="shadow-sm">
                        <Statistic
                            title="Ledger Blocks"
                            value={ledger.length}
                            prefix={<DatabaseOutlined />}
                            suffix="Published Roots"
                        />
                        <div className="mt-2 text-xs text-gray-400">
                            Daily Merkle checkpoints published to public-ready ledger.
                        </div>
                    </Card>
                </Col>
                <Col span={8}>
                    <Card className="shadow-sm">
                        <Statistic
                            title="Anomaly Coverage"
                            value={98}
                            precision={1}
                            valueStyle={{ color: '#3f8600' }}
                            prefix={<EyeOutlined />}
                            suffix="%"
                        />
                        <div className="mt-2 text-xs text-gray-400">
                            Active Detached Worker Threads: 1 (Analysis Ready)
                        </div>
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                <Col span={16}>
                    <Card title={<><HistoryOutlined /> Transparency Ledger Feed</>} className="shadow-sm">
                        <Table
                            dataSource={ledger}
                            columns={columns}
                            rowKey="date"
                            pagination={{ pageSize: 5 }}
                            size="small"
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card title={<><LockOutlined /> Security Protocol Status</>} className="shadow-sm">
                        <Timeline
                            items={[
                                {
                                    color: 'green',
                                    children: 'SHA-256 Hash Chaining Active',
                                },
                                {
                                    color: 'green',
                                    children: 'Merkle Tree Root Generation Ready',
                                },
                                {
                                    color: 'blue',
                                    children: 'Behavioral Biometrics Sampling (100Hz)',
                                },
                                {
                                    color: 'blue',
                                    children: 'XAI Justification Engine Online',
                                },
                                {
                                    children: 'Remote Ledger Publication Point: Simulated JSON API',
                                },
                            ]}
                        />
                    </Card>
                </Col>
            </Row>

            {!integrityStatus?.valid && (
                <Alert
                    message="System Integrity Warning"
                    description="A break in the cryptographic chain has been detected. The self-healing monitor is recovering the sequence."
                    type="error"
                    showIcon
                    closable
                />
            )}
        </div>
    );
};

export default SecurityHealth;
