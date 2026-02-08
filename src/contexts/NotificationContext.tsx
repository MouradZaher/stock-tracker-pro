import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Notification } from '../types';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Load from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('stock_tracker_notifications');
        if (saved) {
            try {
                setNotifications(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse notifications', e);
            }
        }
    }, []);

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem('stock_tracker_notifications', JSON.stringify(notifications));
    }, [notifications]);


    const addNotification = useCallback((n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
        const newNotification: Notification = {
            ...n,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
            read: false
        };
        setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50
    }, []);

    // Listen for signal events from non-React code (like Zustand stores)
    useEffect(() => {
        const handleSignal = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail) {
                addNotification({
                    title: detail.title,
                    message: detail.message,
                    type: detail.type || 'alert',
                    symbol: detail.symbol
                });
            }
        };

        window.addEventListener('market-signal', handleSignal);
        return () => window.removeEventListener('market-signal', handleSignal);
    }, [addNotification]);

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const clearNotifications = () => {
        setNotifications([]);
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            addNotification,
            markAsRead,
            markAllAsRead,
            clearNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
