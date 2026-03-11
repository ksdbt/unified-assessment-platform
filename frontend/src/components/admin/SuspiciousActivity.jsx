import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Badge, Tooltip, Button } from 'antd';
//import { warning } from 'framer-motion';
import { adminAPI } from '../../services/api';
import {
    AlertOutlined,
    RobotOutlined,
    GlobalOutlined,
    ThunderboltOutlined
} from '@ant-design/icons';

const SuspiciousActivity = () => {
    const [activities, setActivities] = useState({ highRiskSubmissions: [], alerts: [] });
    const [loading, setLoading] = useState(true);

    const fetchActivities = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.getSuspiciousActivity();
            setActivities(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, []);

    const getIcon = (type) => {
        if (type.includes('CHEATING')) return <ThunderboltOutlined className="text-red-500" />;
        if (type.includes('TRAVEL')) return <GlobalOutlined className="text-orange-500" />;
        return <RobotOutlined className="text-blue-500" />;
    };

    return (
        <Card
            title={<span className="text-red-600"><AlertOutlined /> Anomaly Detection Engine (Live)</span>}
            className="mb-6 shadow-md border-red-100"
            extra={<Badge count={(activities?.highRiskSubmissions || []).length} offset={[10, 0]}><Button size="small" onClick={fetchActivities}>Refresh</Button></Badge>}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Pattern Alerts */}
                <div>
                    <h4 className="font-bold mb-2">System Pattern Alerts</h4>
                    <List
                        size="small"
                        loading={loading}
                        dataSource={activities?.alerts || []}
                        renderItem={item => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={getIcon(item.type || item.message || '')}
                                    title={<span className="text-xs font-mono">{item.createdAt ? new Date(item.createdAt).toLocaleTimeString() : '--:--:--'}</span>}
                                    description={<span className="text-red-700 font-medium">{item.message}</span>}
                                />
                            </List.Item>
                        )}
                    />
                </div>

                {/* High Risk Submissions */}
                <div>
                    <h4 className="font-bold mb-2">High Risk Submissions</h4>
                    <List
                        size="small"
                        loading={loading}
                        dataSource={activities?.highRiskSubmissions || []}
                        renderItem={sub => (
                            <List.Item actions={[<Button type="link" size="small">Replay</Button>]}>
                                <List.Item.Meta
                                    title={`${sub.studentId?.name || sub.studentName || 'Unknown Student'} - ${sub.assessmentId?.title || 'Unknown Assessment'}`}
                                    description={
                                        <div>
                                            <Tag color="red">Score: {sub.riskScore || 0}</Tag>
                                            <span className="text-xs text-gray-500">
                                                Tabs: {sub.anomalyMetrics?.tabSwitches || 0} | Paste: {sub.anomalyMetrics?.copyPastes || 0}
                                            </span>
                                        </div>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                </div>

            </div>
        </Card>
    );
};

export default SuspiciousActivity;
