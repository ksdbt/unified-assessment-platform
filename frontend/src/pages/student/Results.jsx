import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Progress, Button, List, Tag, Divider, Spin, Typography, Space } from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    TrophyOutlined,
    ClockCircleOutlined,
    BulbOutlined,
    ArrowRightOutlined,
    HomeOutlined
} from '@ant-design/icons';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { submissionAPI, aiAPI } from '../../services/api';
import { toast } from 'react-toastify';

const { Title, Text, Paragraph } = Typography;

const Results = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [explanations, setExplanations] = useState({});
    const [loadingAI, setLoadingAI] = useState({});

    useEffect(() => {
        // Find the specific submission from the list or fetch by ID
        // For now, we'll fetch student submissions and filter to get the latest details
        submissionAPI.getStudentSubmissions()
            .then(res => {
                const found = res.data.find(s => s._id === id);
                if (found) {
                    setSubmission(found);
                } else {
                    toast.error("Result not found");
                }
            })
            .catch(() => toast.error("Failed to load results"))
            .finally(() => setLoading(false));
    }, [id]);

    const handleGetExplanation = async (questionIndex, question, correctAnswer) => {
        setLoadingAI(prev => ({ ...prev, [questionIndex]: true }));
        try {
            const res = await aiAPI.getExplanation(question, correctAnswer);
            setExplanations(prev => ({ ...prev, [questionIndex]: res.data }));
        } catch (error) {
            toast.error("AI Explanation failed");
        } finally {
            setLoadingAI(prev => ({ ...prev, [questionIndex]: false }));
        }
    };

    if (loading) return <div className="flex flex-col justify-center items-center h-screen gap-4"><Spin size="large" /><Typography.Text>Calculating your success...</Typography.Text></div>;
    if (!submission) return <div className="p-6 text-center"><Title level={3}>Result Not Found</Title><Button onClick={() => navigate('/student-dashboard')}>Back to Dashboard</Button></div>;

    const correctCount = submission.answers.filter(a => a.isCorrect).length;
    const wrongCount = submission.answers.filter(a => a.isCorrect === false).length;
    const skippedCount = submission.answers.length - (correctCount + wrongCount);

    const chartData = [
        { name: 'Correct', value: correctCount, color: '#52c41a' },
        { name: 'Incorrect', value: wrongCount, color: '#ff4d4f' },
        { name: 'Skipped', value: skippedCount, color: '#d9d9d9' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header Summary */}
                <Card className="shadow-xl rounded-2xl border-none overflow-hidden mb-8 bg-white dark:bg-gray-800">
                    <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-10 text-center text-white relative">
                        <TrophyOutlined className="text-6xl mb-4 text-yellow-300 animate-pulse" />
                        <Title level={1} className="!text-white !mb-1">Assessment Final Report</Title>
                        <Text className="text-blue-100 text-lg">{submission.assessmentId?.title || 'Smart Assessment'}</Text>

                        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm">
                            <ClockCircleOutlined className="mr-1" />
                            {submission.timeTaken ? (
                                submission.timeTaken > 3600
                                    ? `${Math.floor(submission.timeTaken / 3600)}h ${Math.floor((submission.timeTaken % 3600) / 60)}m`
                                    : `${Math.floor(submission.timeTaken / 60)}m ${submission.timeTaken % 60}s`
                            ) : 'N/A'}
                        </div>
                    </div>

                    <div className="p-8">
                        <Row gutter={[32, 32]} align="middle">
                            <Col xs={24} md={12}>
                                <div className="text-center md:text-left space-y-6">
                                    <div>
                                        <Text type="secondary" className="uppercase tracking-widest text-xs font-bold">Overall Score</Text>
                                        <div className="flex items-baseline space-x-2">
                                            <Title level={1} className="!m-0 text-blue-600">{submission.percentage}%</Title>
                                            <Text strong className="text-xl text-gray-400">/ 100%</Text>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                                        <div>
                                            <div className="text-2xl font-bold text-green-600">{submission.totalScore}</div>
                                            <div className="text-xs text-gray-400">Total Points</div>
                                        </div>
                                        <Divider type="vertical" className="h-10 dark:border-gray-600" />
                                        <div>
                                            <div className="text-2xl font-bold text-blue-600">{correctCount}</div>
                                            <div className="text-xs text-gray-400">Correct</div>
                                        </div>
                                        <Divider type="vertical" className="h-10 dark:border-gray-600" />
                                        <div>
                                            <div className="text-2xl font-bold text-orange-600">{submission.maxScore - submission.totalScore}</div>
                                            <div className="text-xs text-gray-400">Missed</div>
                                        </div>
                                    </div>

                                    {/* Trust Score Meter */}
                                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                        <div className="flex justify-between items-center mb-2">
                                            <Text strong className="text-indigo-700 dark:text-indigo-400">Behavioral Trust Score</Text>
                                            <Tag color={submission.riskLevel === 'High' ? 'red' : submission.riskLevel === 'Medium' ? 'orange' : 'green'}>
                                                {submission.riskLevel || 'Low'} Risk
                                            </Tag>
                                        </div>
                                        <Progress
                                            percent={submission.trustScore || 100}
                                            status={submission.trustScore < 50 ? 'exception' : 'active'}
                                            strokeColor={{ '0%': '#f5222d', '100%': '#52c41a' }}
                                        />
                                        <Text type="secondary" className="text-[10px] block mt-1">
                                            Based on tab switches, copy-paste, and response patterns.
                                        </Text>
                                    </div>

                                    <Button
                                        type="primary"
                                        size="large"
                                        icon={<HomeOutlined />}
                                        block
                                        onClick={() => navigate('/student-dashboard')}
                                        className="h-12 font-bold rounded-lg shadow-md"
                                    >
                                        Return to Dashboard
                                    </Button>
                                </div>
                            </Col>

                            <Col xs={24} md={12}>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={chartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="flex justify-center space-x-4 text-xs">
                                        {chartData.map(d => (
                                            <div key={d.name} className="flex items-center space-x-1">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                                                <span>{d.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </div>
                </Card>

                {/* Review Section */}
                <Title level={3} className="mb-4 dark:text-white">Review Your Answers</Title>
                <List
                    dataSource={submission.answers}
                    renderItem={(ans, idx) => (
                        <Card
                            key={idx}
                            className={`mb-4 border-l-4 shadow-sm ${ans.isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <Title level={5} className="!m-0 flex-1">
                                    <span className="text-gray-400 mr-2">#{idx + 1}</span>
                                    {ans.questionText || `Question ${idx + 1}`}
                                </Title>
                                <Tag color={ans.isCorrect ? 'green' : 'red'} icon={ans.isCorrect ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
                                    {ans.points} Pts
                                </Tag>
                            </div>

                            <div className="space-y-2 mb-6">
                                <div className={`p-3 rounded-lg border ${ans.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                    <Text strong className="text-xs uppercase text-gray-500 block">Your Answer</Text>
                                    <Text className={ans.isCorrect ? 'text-green-700' : 'text-red-700'}>{ans.answer}</Text>
                                </div>
                                {!ans.isCorrect && (
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <Text strong className="text-xs uppercase text-gray-500 block">Correct Answer</Text>
                                        <Text className="text-blue-700">{ans.correctAnswer || 'Please consult instructor'}</Text>
                                    </div>
                                )}
                            </div>

                            {/* AI Explanation Feature (Task 12) */}
                            {!ans.isCorrect && (
                                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/10 dark:to-blue-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-2 text-indigo-600">
                                            <BulbOutlined />
                                            <Text strong className="dark:text-indigo-400">AI Deep Dive</Text>
                                        </div>
                                        {!explanations[idx] && (
                                            <Button
                                                type="link"
                                                onClick={() => handleGetExplanation(idx, ans.questionText || `Question ${idx + 1}`, ans.correctAnswer)}
                                                loading={loadingAI[idx]}
                                                className="text-indigo-600"
                                            >
                                                Learn Why
                                            </Button>
                                        )}
                                    </div>
                                    {explanations[idx] ? (
                                        <Paragraph className="text-gray-700 dark:text-gray-300 italic mb-0">
                                            "{explanations[idx]}"
                                        </Paragraph>
                                    ) : (
                                        <Text type="secondary" className="text-xs italic">
                                            Confused? Let AI explain the concept behind this correct answer.
                                        </Text>
                                    )}
                                </div>
                            )}
                        </Card>
                    )}
                />

                <div className="text-center py-8">
                    <Button
                        size="large"
                        type="dashed"
                        icon={<ArrowRightOutlined />}
                        onClick={() => navigate('/assessments')}
                    >
                        Try Another Assessment
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Results;
