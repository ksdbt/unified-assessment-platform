import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Table, Tag, Progress, Button, Row, Col, Statistic, Tooltip, Breadcrumb } from 'antd';
import {
    DashboardOutlined,
    BulbOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    ArrowLeftOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';
import { assessmentAPI } from '../../services/api';
import { toast } from 'react-toastify';

const QuestionAnalytics = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [assessment, setAssessment] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAssessment = async () => {
            try {
                const res = await assessmentAPI.getById(id);
                setAssessment(res.data);
            } catch (error) {
                toast.error('Failed to load assessment data');
                navigate('/admin/assessments');
            } finally {
                setLoading(false);
            }
        };
        fetchAssessment();
    }, [id, navigate]);

    const getDifficultyTag = (index) => {
        if (index <= 0.3) return <Tag color="green">EASY</Tag>;
        if (index <= 0.7) return <Tag color="orange">MEDIUM</Tag>;
        return <Tag color="red">HARD</Tag>;
    };

    const columns = [
        {
            title: 'Question',
            dataIndex: 'question',
            key: 'q',
            ellipsis: true,
            render: (text) => <span className="font-medium">{text}</span>
        },
        {
            title: 'Smart Difficulty',
            dataIndex: 'difficultyIndex',
            key: 'diff',
            render: (idx) => (
                <div className="flex flex-col gap-1">
                    {getDifficultyTag(idx)}
                    <Progress
                        percent={Math.round(idx * 100)}
                        size="small"
                        showInfo={false}
                        strokeColor={{ '0%': '#52c41a', '100%': '#f5222d' }}
                    />
                    <span className="text-[10px] text-gray-400">Index: {idx.toFixed(2)}</span>
                </div>
            )
        },
        {
            title: 'Correct Rate',
            key: 'rate',
            render: (_, row) => {
                const rate = row.totalAttempts > 0 ? (row.correctCount / row.totalAttempts) * 100 : 0;
                return (
                    <div>
                        <div className="font-bold">{rate.toFixed(1)}%</div>
                        <div className="text-[10px] text-gray-400">{row.correctCount || 0}/{row.totalAttempts || 0} students</div>
                    </div>
                );
            }
        },
        {
            title: 'Avg Resp Time',
            dataIndex: 'avgTime',
            key: 'time',
            render: (time) => (
                <div className="flex items-center gap-1">
                    <ClockCircleOutlined className="text-gray-400" />
                    <span>{time ? Math.round(time) : 0}s</span>
                </div>
            )
        },
        {
            title: 'Samples',
            dataIndex: 'totalAttempts',
            key: 'samples',
            render: (val) => <Tag color="blue">{val || 0} students</Tag>
        }
    ];

    if (loading) return <div className="p-10 text-center">Loading AI Analytics...</div>;

    const avgDifficulty = assessment?.questions?.reduce((acc, q) => acc + (q.difficultyIndex || 0), 0) / (assessment?.questions?.length || 1);

    return (
        <div className="p-6">
            <Breadcrumb className="mb-4">
                <Breadcrumb.Item href="/admin/assessments">Assessments</Breadcrumb.Item>
                <Breadcrumb.Item>Smart Analytics</Breadcrumb.Item>
            </Breadcrumb>

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <BulbOutlined className="text-yellow-500" />
                        Smart Question Analytics: {assessment?.title}
                    </h1>
                    <p className="text-gray-500">
                        Difficulty is automatically learned from student behavior and response timing.
                    </p>
                </div>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Back</Button>
            </div>

            <Row gutter={[16, 16]} className="mb-6">
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Overall Difficulty"
                            value={avgDifficulty.toFixed(2)}
                            prefix={<DashboardOutlined />}
                            valueStyle={{ color: avgDifficulty > 0.6 ? '#f5222d' : '#52c41a' }}
                        />
                        {getDifficultyTag(avgDifficulty)}
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Avg Success Rate"
                            value={((assessment?.questions?.reduce((acc, q) => acc + (q.correctCount || 0), 0) /
                                assessment?.questions?.reduce((acc, q) => acc + (q.totalAttempts || 0), 0) || 0) * 100).toFixed(1)}
                            suffix="%"
                            prefix={<CheckCircleOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={12}>
                    <Card className="bg-blue-50 border-blue-100">
                        <div className="flex gap-2">
                            <InfoCircleOutlined className="text-blue-500 text-lg" />
                            <div>
                                <div className="font-bold text-blue-800">Learning Algorithm</div>
                                <div className="text-xs text-blue-600">
                                    Difficulty = (1 - Correct_Rate) * 0.7 + (Response_Time_Factor) * 0.3.
                                    Any manual edits to difficulty are overridden by behavioral learning.
                                </div>
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Card title="Question Learning Metrics">
                <Table
                    dataSource={assessment?.questions || []}
                    columns={columns}
                    rowKey="_id"
                    pagination={false}
                />
            </Card>
        </div>
    );
};

export default QuestionAnalytics;
