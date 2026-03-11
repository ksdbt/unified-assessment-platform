import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Radio, Switch, Slider, Typography, Divider, Space, Spin, Tag, Alert } from 'antd';
import {
    SettingOutlined,
    RocketOutlined,
    ClockCircleOutlined,
    BarChartOutlined,
    ArrowLeftOutlined
} from '@ant-design/icons';
import { assessmentAPI, aiAPI } from '../../services/api';
import { toast } from 'react-toastify';

const { Title, Text } = Typography;

const AssessmentConfig = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [assessment, setAssessment] = useState(null);
    const [loading, setLoading] = useState(true);

    // Settings State
    // Settings State
    const [difficulty, setDifficulty] = useState('intermediate');
    const [timerEnabled, setTimerEnabled] = useState(true);
    const [questionLimit, setQuestionLimit] = useState(1);

    useEffect(() => {
        assessmentAPI.getById(id)
            .then(res => {
                setAssessment(res.data);
                const initialDifficulty = res.data.difficulty || 'intermediate';
                setDifficulty(initialDifficulty);

                const availableQuestions = res.data.questions?.filter(q => q.difficulty === initialDifficulty).length || 0;
                setQuestionLimit(Math.min(10, availableQuestions || 1));
            })
            .catch(() => toast.error('Failed to load assessment details'))
            .finally(() => setLoading(false));
    }, [id]);

    const [generating, setGenerating] = useState(false);

    // Dynamic max questions based on difficulty
    const getAvailableQuestions = () => {
        if (!assessment || !assessment.questions) return 0;
        return assessment.questions.filter(q => q.difficulty === difficulty).length;
    };

    const maxQuestions = getAvailableQuestions();

    // Adjust limit if it exceeds max after difficulty change
    useEffect(() => {
        if (questionLimit > maxQuestions && maxQuestions > 0) {
            setQuestionLimit(maxQuestions);
        } else if (questionLimit === 0 && maxQuestions > 0) {
            setQuestionLimit(1);
        }
    }, [difficulty, maxQuestions]);

    const handleStart = () => {
        if (maxQuestions === 0) {
            toast.error(`No questions found for ${difficulty} difficulty.`);
            return;
        }
        // Navigate to interface with settings in state
        navigate(`/assessment/${id}/take`, {
            state: {
                difficulty,
                timerEnabled,
                questionLimit,
                mode: 'standard'
            }
        });
    };

    const handleAIStart = async () => {
        setGenerating(true);
        try {
            const res = await aiAPI.generateQuestions(
                assessment.subject,
                difficulty,
                questionLimit,
                'mcq',
                false // save = false for practice
            );
            if (res.success && res.data.length > 0) {
                toast.success(`Generated ${res.data.length} fresh questions via AI!`);
                navigate(`/assessment/${id}/take`, {
                    state: {
                        difficulty,
                        timerEnabled,
                        questionLimit,
                        mode: 'ai-generated',
                        aiQuestions: res.data
                    }
                });
            } else {
                toast.error("AI returned 0 questions. Falling back to standard pool.");
                handleStart();
            }
        } catch (error) {
            toast.error(error.message || "AI Generation failed. Using standard pool.");
            handleStart();
        } finally {
            setGenerating(false);
        }
    };

    if (loading) return <div className="flex flex-col justify-center items-center h-screen gap-4"><Spin size="large" /><Typography.Text>Preparing your session...</Typography.Text></div>;
    if (!assessment) return <div className="p-6 text-center"><Title level={3}>Assessment Not Found</Title><Button onClick={() => navigate('/assessments')}>Back to Catalog</Button></div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/assessments')}
                    className="mb-4 text-gray-600 dark:text-gray-400 hover:text-blue-500"
                >
                    Back to Catalog
                </Button>

                <Card className="shadow-xl rounded-2xl border-none overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-center text-white">
                        <RocketOutlined className="text-5xl mb-4 animate-bounce" />
                        <Title level={2} className="!text-white !mb-2">{assessment.title}</Title>
                        <Text className="text-blue-100 italic">{assessment.subject} • {assessment.duration} Minutes</Text>
                    </div>

                    <div className="p-8">
                        <div className="mb-8">
                            <div className="flex items-center space-x-2 text-gray-800 dark:text-white mb-4">
                                <BarChartOutlined className="text-xl text-blue-500" />
                                <Title level={4} className="!m-0 dark:!text-white font-semibold">Adaptive Difficulty</Title>
                            </div>
                            <Radio.Group
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                                className="w-full flex"
                                optionType="button"
                                buttonStyle="solid"
                            >
                                <Radio.Button value="beginner" className="flex-1 text-center h-12 flex items-center justify-center">Beginner</Radio.Button>
                                <Radio.Button value="intermediate" className="flex-1 text-center h-12 flex items-center justify-center">Moderate</Radio.Button>
                                <Radio.Button value="advanced" className="flex-1 text-center h-12 flex items-center justify-center">Expert</Radio.Button>
                            </Radio.Group>
                            <p className="mt-3 text-sm text-gray-500">Selection will filter questions to match your proficiency level.</p>
                            {maxQuestions === 0 && <Alert message="No questions available for this difficulty Level in the standard pool." type="warning" showIcon className="mt-2" />}
                        </div>

                        <Divider className="dark:border-gray-700" />

                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2 text-gray-800 dark:text-white">
                                    <ClockCircleOutlined className="text-xl text-orange-500" />
                                    <Title level={4} className="!m-0 dark:!text-white font-semibold">Speed Challenge</Title>
                                </div>
                                <Switch
                                    checked={timerEnabled}
                                    onChange={setTimerEnabled}
                                    className="bg-gray-300"
                                />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-800">
                                <Text className="dark:text-gray-300">
                                    {timerEnabled
                                        ? "Interactive timer will be visible. Session locks on expiry."
                                        : "No pressure mode. Timer will be hidden."}
                                </Text>
                                <Tag color={timerEnabled ? "orange" : "default"}>
                                    {timerEnabled ? `${assessment.duration}m Limit` : "Unlimited"}
                                </Tag>
                            </div>
                        </div>

                        <Divider className="dark:border-gray-700" />

                        <div className="mb-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2 text-gray-800 dark:text-white">
                                    <SettingOutlined className="text-xl text-green-500" />
                                    <Title level={4} className="!m-0 dark:!text-white font-semibold">Questions to Answer</Title>
                                </div>
                                <Text strong className="text-lg text-blue-600">{questionLimit} / {maxQuestions}</Text>
                            </div>
                            <Slider
                                min={1}
                                max={Math.max(1, maxQuestions)}
                                disabled={maxQuestions === 0}
                                value={questionLimit}
                                onChange={setQuestionLimit}
                                tooltip={{ open: questionLimit > 0 }}
                                marks={{
                                    1: 'Min',
                                    [Math.floor(maxQuestions / 2)]: 'Mid',
                                    [Math.max(1, maxQuestions)]: 'Max'
                                }}
                            />
                        </div>

                        <Space direction="vertical" className="w-full" size="middle">
                            <Button
                                type="primary"
                                size="large"
                                block
                                onClick={handleStart}
                                className="h-14 text-lg font-bold rounded-xl shadow-lg hover:translate-y-[-2px] transition-all bg-gradient-to-r from-blue-600 to-indigo-600 border-none"
                            >
                                Standard Start (Fixed Pool)
                            </Button>

                            <Button
                                type="default"
                                size="large"
                                block
                                loading={generating}
                                onClick={handleAIStart}
                                className="h-14 text-lg font-bold rounded-xl shadow-md border-2 border-blue-500 text-blue-600 hover:bg-blue-50"
                            >
                                {generating ? "AI Brainstorming..." : "Smart Start (AI Fresh Questions)"}
                            </Button>
                        </Space>

                        <p className="text-center mt-4 text-xs text-gray-400">
                            By starting, you agree to the platform monitoring rules for anomaly detection.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AssessmentConfig;
