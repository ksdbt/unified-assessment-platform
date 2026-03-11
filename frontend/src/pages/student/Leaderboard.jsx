import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Tag, Avatar, Space, Spin, Tooltip } from 'antd';
import { TrophyFilled, StarFilled, FireFilled, CrownFilled } from '@ant-design/icons';
import { submissionAPI } from '../../services/api';

const { Title, Text } = Typography;

const Leaderboard = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);

    useEffect(() => {
        // In a real app, this would be a dedicated leaderboard endpoint
        // For now, we'll simulate it with recent submissions or a mock
        const fetchLeaderboard = async () => {
            try {
                // Mocking leaderboard data inspired by WebWeave's ranking system
                const mockData = [
                    { key: '1', name: 'Yugananthan P', score: 950, assignments: 12, streak: 5, rank: 1 },
                    { key: '2', name: 'Alice Smith', score: 880, assignments: 10, streak: 3, rank: 2 },
                    { key: '3', name: 'Bob Johnson', score: 820, assignments: 9, streak: 4, rank: 3 },
                    { key: '4', name: 'Charlie Brown', score: 750, assignments: 8, streak: 2, rank: 4 },
                    { key: '5', name: 'Diana Prince', score: 710, assignments: 7, streak: 1, rank: 5 },
                ];
                setData(mockData);
            } catch (err) {
                console.error('Failed to fetch leaderboard', err);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    const columns = [
        {
            title: 'Rank',
            dataIndex: 'rank',
            key: 'rank',
            width: 80,
            render: (rank) => (
                <div className="flex justify-center">
                    {rank === 1 ? <CrownFilled style={{ color: '#FFD700', fontSize: '24px' }} /> :
                        rank === 2 ? <TrophyFilled style={{ color: '#C0C0C0', fontSize: '20px' }} /> :
                            rank === 3 ? <TrophyFilled style={{ color: '#CD7F32', fontSize: '18px' }} /> :
                                <Text strong>{rank}</Text>}
                </div>
            ),
        },
        {
            title: 'Student',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <Space>
                    <Avatar src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${record.name}`} />
                    <Text strong>{text}</Text>
                </Space>
            ),
        },
        {
            title: 'Total Score',
            dataIndex: 'score',
            key: 'score',
            sorter: (a, b) => a.score - b.score,
            render: (score) => (
                <Tag color="gold" icon={<StarFilled />}>
                    {score.toLocaleString()}
                </Tag>
            ),
        },
        {
            title: 'Assignments',
            dataIndex: 'assignments',
            key: 'assignments',
            render: (count) => <Tag color="blue">{count} Completed</Tag>,
        },
        {
            title: 'Streak',
            dataIndex: 'streak',
            key: 'streak',
            render: (streak) => (
                <Tooltip title="Daily Learning Streak">
                    <Tag color="orange" icon={<FireFilled />}>
                        {streak} Days
                    </Tag>
                </Tooltip>
            ),
        },
    ];

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="max-w-5xl mx-auto">
                <header className="mb-8 text-center">
                    <Title level={1} className="!mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Global Leaderboard
                    </Title>
                    <Text type="secondary" className="text-lg">
                        Celebrating our top performers and consistent learners
                    </Text>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {data.slice(0, 3).map((player, idx) => (
                        <Card
                            key={player.key}
                            className={`text-center border-2 ${idx === 0 ? 'border-yellow-400 shadow-xl scale-105' : 'border-transparent shadow-md'}`}
                            bodyStyle={{ padding: '24px' }}
                        >
                            <div className="mb-4">
                                {idx === 0 ? <CrownFilled className="text-4xl text-yellow-400 mb-2" /> : <TrophyFilled className={`text-3xl ${idx === 1 ? 'text-gray-400' : 'text-orange-400'} mb-2`} />}
                                <Avatar size={80} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`} border />
                            </div>
                            <Title level={4} className="!mb-1">{player.name}</Title>
                            <Text strong className="text-xl text-indigo-600">{player.score} pts</Text>
                            <div className="mt-2 text-xs text-gray-400 uppercase tracking-widest">
                                Rank #{player.rank}
                            </div>
                        </Card>
                    ))}
                </div>

                <Card className="shadow-lg rounded-2xl overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center p-20"><Spin size="large" /></div>
                    ) : (
                        <Table
                            columns={columns}
                            dataSource={data}
                            pagination={false}
                            className="leaderboard-table"
                        />
                    )}
                </Card>
            </div>
        </div>
    );
};

export default Leaderboard;
