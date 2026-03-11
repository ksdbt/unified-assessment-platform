import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import ForceGraph2D from 'react-force-graph-2d';
import axios from 'axios';
import { Card, Table, Typography, Spin, Alert, Tag, Space, Modal } from 'antd';
import { WarningOutlined, SafetyCertificateOutlined, CodeOutlined, ExceptionOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';

const { Title, Text } = Typography;

const AnalyticsDashboard = () => {
    const { id } = useParams(); // Assessment ID
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const [loadingGraph, setLoadingGraph] = useState(true);

    const [selectedUser, setSelectedUser] = useState(null);
    const [auditLogs, setAuditLogs] = useState([]);
    const [examSession, setExamSession] = useState(null);
    const [chainValid, setChainValid] = useState(true);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [showLogsModal, setShowLogsModal] = useState(false);

    const graphRef = useRef();

    // Fetch Collusion Network Data
    useEffect(() => {
        const fetchCollusionData = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/analytics/collusion/${id}`, { withCredentials: true });
                setGraphData(res.data);
            } catch (err) {
                toast.error('Failed to load collusion network');
            } finally {
                setLoadingGraph(false);
            }
        };
        fetchCollusionData();
    }, [id]);

    // Handle Node Click (Fetch Audit Logs for User)
    const handleNodeClick = async (node) => {
        setSelectedUser(node);
        setLoadingLogs(true);
        setShowLogsModal(true);
        try {
            const res = await axios.get(`http://localhost:5000/api/analytics/audit-logs/${id}/${node.id}`, { withCredentials: true });
            setAuditLogs(res.data.logs);
            setExamSession(res.data.session);
            setChainValid(res.data.chainValid);
        } catch (err) {
            toast.error('Failed to load audit logs for this student');
        } finally {
            setLoadingLogs(false);
        }
    };

    const columns = [
        { title: 'Time', dataIndex: 'timestamp', key: 'timestamp', render: t => new Date(t).toLocaleTimeString() },
        { title: 'Action', dataIndex: 'action', key: 'action', render: a => <Tag color={a === 'TAB_SWITCH' || a === 'COPY_PASTE' ? 'red' : 'blue'}>{a}</Tag> },
        { title: 'Previous Hash', dataIndex: 'previousHash', key: 'previousHash', render: h => <Text code className="text-xs">{h.substring(0, 16)}...</Text> },
        { title: 'Current Hash', dataIndex: 'currentHash', key: 'currentHash', render: h => <Text code className="text-xs text-green-600">{h.substring(0, 16)}...</Text> }
    ];

    if (loadingGraph) return <div className="flex justify-center items-center h-64"><Spin size="large" /></div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <Title level={2}>Assessment Analytics & Integrity</Title>
            </div>

            <Card title={<span><ExceptionOutlined /> Collusion Detection Network</span>} bordered={false} className="shadow-sm">
                <p className="mb-4 text-gray-500">
                    This force-directed graph highlights potential answer-sharing. Nodes represent students, and thick edges represent highly similar answer submission vectors (Jaccard Similarity &gt; 85%).
                    Click on any node to view their cryptographically verifiable audit log.
                </p>
                <div className="border border-gray-200 rounded-lg overflow-hidden h-[500px] bg-gray-50 flex items-center justify-center">
                    {graphData.nodes.length < 2 ? (
                        <Text type="secondary">Not enough submissions to calculate collusion.</Text>
                    ) : (
                        <ForceGraph2D
                            ref={graphRef}
                            width={800}
                            height={500}
                            graphData={graphData}
                            nodeLabel="name"
                            nodeAutoColorBy="score"
                            linkColor={() => 'red'}
                            linkWidth={link => link.similarity * 5}
                            onNodeClick={handleNodeClick}
                            nodeCanvasObject={(node, ctx, globalScale) => {
                                const label = node.name;
                                const fontSize = 12 / globalScale;
                                ctx.font = `${fontSize}px Sans-Serif`;
                                const textWidth = ctx.measureText(label).width;
                                const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding
                                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                                ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'middle';
                                ctx.fillStyle = node.color || '#3b82f6';
                                ctx.fillText(label, node.x, node.y);
                                node.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
                            }}
                            nodePointerAreaPaint={(node, color, ctx) => {
                                ctx.fillStyle = color;
                                const bckgDimensions = node.__bckgDimensions;
                                bckgDimensions && ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);
                            }}
                        />
                    )}
                </div>
            </Card>

            <Modal
                title={`Audit Log & Telemetry: ${selectedUser?.name}`}
                open={showLogsModal}
                onCancel={() => setShowLogsModal(false)}
                width={900}
                footer={null}
            >
                {loadingLogs ? <div className="p-10 text-center"><Spin /></div> : (
                    <div className="space-y-6">
                        {!chainValid && (
                            <Alert
                                message="Tamper Evidence Detected"
                                description="The cryptographic hash chain for this audit log is broken. Data may have been modified maliciously!"
                                type="error"
                                showIcon
                                icon={<WarningOutlined />}
                            />
                        )}
                        {chainValid && examSession && (
                            <Alert
                                message="Cryptographic Chain Valid"
                                description="This audit log is verified against tampering via SHA-256 block chaining."
                                type="success"
                                showIcon
                                icon={<SafetyCertificateOutlined />}
                            />
                        )}

                        {examSession && (
                            <Card title="Behavioral Integrity Metrics" size="small" bordered={false} className="bg-gray-50">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Text strong>Integrity Score: </Text>
                                        <Tag color={examSession.integrityScore > 80 ? 'green' : examSession.integrityScore > 50 ? 'orange' : 'red'}>
                                            {examSession.integrityScore}
                                        </Tag>
                                    </div>
                                    <div>
                                        <Text strong>Risk Level: </Text>
                                        <Tag color={examSession.riskLevel === 'LOW' ? 'green' : examSession.riskLevel === 'MEDIUM' ? 'orange' : 'red'}>
                                            {examSession.riskLevel}
                                        </Tag>
                                    </div>
                                    <div>
                                        <Text strong>Tab Switches: </Text> {examSession.telemetry?.tabSwitches || 0}
                                    </div>
                                    <div>
                                        <Text strong>Paste Actions: </Text> {examSession.telemetry?.clipboardEvents || 0}
                                    </div>
                                    <div className="col-span-2 mt-2">
                                        <Text strong><CodeOutlined /> Exam DNA (Interaction Fingerprint Hash): </Text><br />
                                        <Text code className="text-xs break-all text-indigo-700">{examSession.examDna || 'N/A'}</Text>
                                    </div>
                                </div>
                            </Card>
                        )}

                        <Table
                            dataSource={auditLogs}
                            columns={columns}
                            rowKey="_id"
                            pagination={{ pageSize: 5 }}
                            size="small"
                        />
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AnalyticsDashboard;
