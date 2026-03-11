import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { user, token, isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        if (!isAuthenticated || !token) return;
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(res.data.data);
            setUnreadCount(res.data.data.filter(n => !n.isRead).length);
        } catch (error) {
            if (error.response?.status === 401) {
                // Token might be expired or invalid
                console.warn('Notification fetch: Unauthorized. Stopping polling.');
                setNotifications([]);
                // Optionally trigger logout if your AuthContext has such a function
            } else {
                console.error('Failed to fetch notifications', error);
            }
        }
    };

    useEffect(() => {
        if (!isAuthenticated || !token) return;
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [isAuthenticated, token]);

    const markAsRead = async (id) => {
        try {
            await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/notifications/read-all`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
