import React, { useState } from 'react';
import { Card, List, Badge, Button, Typography, Tag, Space, Empty, Spin } from 'antd';
import {
    BellOutlined,
    CheckCircleOutlined,
    InfoCircleOutlined,
    WarningOutlined,
    CloseCircleOutlined,
    CalendarOutlined,
    EyeOutlined
} from '@ant-design/icons';
import { useNotifications } from '../context/NotificationContext';
import moment from 'moment';

const { Title, Text } = Typography;

const Notifications = () => {
    const { notifications, markAsRead, markAllAsRead, fetchNotifications } = useNotifications();
    const [filter, setFilter] = useState('all'); // 'all', 'unread', 'important'

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircleOutlined className="text-green-500" />;
            case 'warning': return <WarningOutlined className="text-yellow-500" />;
            case 'error': return <CloseCircleOutlined className="text-red-500" />;
            default: return <InfoCircleOutlined className="text-blue-500" />;
        }
    };

    const isImportant = (item) => {
        return item.type === 'warning' || item.type === 'error' ||
            item.message.toLowerCase().includes('tamper') ||
            item.message.toLowerCase().includes('assessment');
    };

    const filteredNotifications = notifications.filter(item => {
        if (filter === 'unread') return !item.isRead;
        if (filter === 'important') return isImportant(item);
        return true;
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <Space size="middle">
                    <Title level={2} style={{ margin: 0 }}>
                        <BellOutlined className="mr-3" />
                        Notifications
                    </Title>
                    <Badge count={unreadCount} style={{ backgroundColor: '#1890ff' }} />
                </Space>
                <Space>
                    <Button onClick={() => fetchNotifications()}>Refresh</Button>
                    <Button type="primary" onClick={markAllAsRead} disabled={unreadCount === 0}>
                        Mark all as read
                    </Button>
                </Space>
            </div>

            <Card className="shadow-sm rounded-xl overflow-hidden border-0">
                <div className="flex gap-2 mb-6 p-1 bg-gray-50 dark:bg-gray-800 rounded-lg w-fit">
                    <Button
                        type={filter === 'all' ? 'primary' : 'text'}
                        onClick={() => setFilter('all')}
                        className="rounded-md"
                    >
                        All
                    </Button>
                    <Button
                        type={filter === 'unread' ? 'primary' : 'text'}
                        onClick={() => setFilter('unread')}
                        className="rounded-md"
                    >
                        Unread
                    </Button>
                    <Button
                        type={filter === 'important' ? 'primary' : 'text'}
                        onClick={() => setFilter('important')}
                        className="rounded-md"
                    >
                        Important
                    </Button>
                </div>

                <List
                    itemLayout="vertical"
                    dataSource={filteredNotifications}
                    locale={{ emptyText: <Empty description="No notifications found" /> }}
                    renderItem={(item) => (
                        <List.Item
                            key={item._id}
                            className={`px-6 py-4 transition-all duration-200 border-l-4 ${!item.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-500' : 'border-transparent'
                                } hover:bg-gray-50 dark:hover:bg-gray-800/50`}
                            actions={[
                                <Space key="time" className="text-gray-400 text-xs">
                                    <CalendarOutlined />
                                    {moment(item.createdAt).format('MMM DD, YYYY • hh:mm A')}
                                    <span>({moment(item.createdAt).fromNow()})</span>
                                </Space>,
                                !item.isRead && (
                                    <Button
                                        type="link"
                                        size="small"
                                        onClick={() => markAsRead(item._id)}
                                        icon={<EyeOutlined />}
                                    >
                                        Mark as read
                                    </Button>
                                )
                            ].filter(Boolean)}
                        >
                            <div className="flex items-start gap-4">
                                <div className="text-xl mt-1">
                                    {getIcon(item.type)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Text strong className="text-lg">
                                            {item.type.charAt(0).toUpperCase() + item.type.slice(1)} Alert
                                        </Text>
                                        {isImportant(item) && <Tag color="red">Important</Tag>}
                                    </div>
                                    <Text className="text-gray-600 dark:text-gray-300">
                                        {item.message}
                                    </Text>
                                </div>
                            </div>
                        </List.Item>
                    )}
                />
            </Card>
        </div>
    );
};

export default Notifications;
