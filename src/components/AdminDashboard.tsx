import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Check, X, Shield, Users, Clock, LogOut, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { yahooFinanceApi } from '../services/api';

interface Profile {
    id: string;
    email: string;
    role: 'admin' | 'user';
    is_approved: boolean;
    created_at: string;
}

interface AdminDashboardProps {
    isOpen: boolean;
    onClose: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
    const { user, signOut } = useAuth();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'checking'>('checking');

    // Test API connection
    const testApiConnection = async () => {
        setApiStatus('checking');
        const toastId = toast.loading('Testing API connection...');
        try {
            await yahooFinanceApi.get('', { params: { symbols: 'AAPL' } });
            setApiStatus('online');
            toast.success('System Online: API is reachable', { id: toastId });
        } catch (error) {
            console.error('API Test Failed:', error);
            setApiStatus('offline');
            toast.error('System Offline: API unreachable', { id: toastId });
        }
    };

    const fetchProfiles = async () => {
        setLoading(true);
        // Check health on load
        testApiConnection();

        try {
            // Mock data for bypass/demo mode
            if (user?.id?.startsWith('bypass-')) {
                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 500));

                setProfiles([
                    { id: 'bypass-admin-id', email: 'admin@stocktracker.pro', role: 'admin', is_approved: true, created_at: new Date().toISOString() },
                    { id: 'bypass-user-1', email: 'investor@example.com', role: 'user', is_approved: true, created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
                    { id: 'bypass-user-2', email: 'newbie@example.com', role: 'user', is_approved: false, created_at: new Date(Date.now() - 86400000 * 0.5).toISOString() },
                    { id: 'bypass-user-3', email: 'trader@example.com', role: 'user', is_approved: true, created_at: new Date(Date.now() - 86400000 * 5).toISOString() },
                ]);
                return;
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Supabase profiles error:', error);
                // Don't show error toast if it's a backend RLS issue
                if (error.code !== 'PGRST301') {
                    toast.error('Failed to load users - please check Supabase configuration');
                }
                setProfiles([]);
            } else {
                setProfiles(data as Profile[] || []);
            }
        } catch (err) {
            console.error('Exception fetching profiles:', err);
            setProfiles([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchProfiles();
        }
    }, [isOpen]);

    const handleApprove = async (id: string, email: string) => {
        const { error } = await supabase
            .from('profiles')
            .update({ is_approved: true })
            .eq('id', id);

        if (error) {
            toast.error('Failed to approve user');
        } else {
            toast.success(`Approved access for ${email}`);
            setProfiles(prev => prev.map(p => p.id === id ? { ...p, is_approved: true } : p));
        }
    };

    const handleReject = async (id: string, email: string) => {
        // In a real app, you might want to soft-delete or just block
        // For now, we'll set approved to false (or keep it false)
        const { error } = await supabase
            .from('profiles')
            .update({ is_approved: false })
            .eq('id', id);

        if (error) {
            toast.error('Failed to reject user');
        } else {
            toast.success(`Revoked access for ${email}`);
            setProfiles(prev => prev.map(p => p.id === id ? { ...p, is_approved: false } : p));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="admin-overlay" onClick={onClose}>
            <div className="admin-modal" onClick={e => e.stopPropagation()}>
                <div className="admin-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="icon-badge">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h2>Admin Dashboard</h2>
                            <p className="admin-subtitle">Manage user access and permissions</p>
                        </div>
                    </div>
                    <button className="btn-icon" onClick={onClose}><X size={24} /></button>
                </div>

                <div className="admin-stats">
                    <div className="admin-stat-card">
                        <Users size={20} className="text-secondary" />
                        <span className="stat-value">{profiles.length}</span>
                        <span className="stat-label">Total Users</span>
                    </div>
                    <div className="admin-stat-card">
                        <Check size={20} className="text-success" />
                        <span className="stat-value">{profiles.filter(p => p.is_approved).length}</span>
                        <span className="stat-label">Approved</span>
                    </div>
                    <div className="admin-stat-card">
                        <Clock size={20} className="text-warning" />
                        <span className="stat-value">{profiles.filter(p => !p.is_approved).length}</span>
                        <span className="stat-label">Pending</span>
                    </div>
                    <div className="admin-stat-card" style={{ cursor: 'pointer' }} onClick={() => testApiConnection()}>
                        <Activity size={20} className={apiStatus === 'online' ? "text-success" : apiStatus === 'offline' ? "text-error" : "text-muted"} />
                        <span className="stat-value" style={{ fontSize: '1rem' }}>{apiStatus === 'online' ? 'Online' : apiStatus === 'offline' ? 'Offline' : 'Unknown'}</span>
                        <span className="stat-label">System Status</span>
                    </div>
                </div>

                <div className="admin-content">
                    {loading ? (
                        <div className="text-center p-xl">Loading users...</div>
                    ) : (
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {profiles.map(profile => (
                                    <tr key={profile.id}>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span className="user-email">{profile.email}</span>
                                                <span className="user-id">{profile.id.slice(0, 8)}...</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`role-badge ${profile.role}`}>
                                                {profile.role}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${profile.is_approved ? 'approved' : 'pending'}`}>
                                                {profile.is_approved ? 'Active' : 'Pending'}
                                            </span>
                                        </td>
                                        <td>{new Date(profile.created_at).toLocaleDateString()}</td>
                                        <td>
                                            {profile.id !== user?.id && (
                                                <div className="action-buttons">
                                                    {!profile.is_approved ? (
                                                        <button
                                                            className="btn-icon btn-approve"
                                                            onClick={() => handleApprove(profile.id, profile.email)}
                                                            title="Approve User"
                                                        >
                                                            <Check size={18} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="btn-icon btn-reject"
                                                            onClick={() => handleReject(profile.id, profile.email)}
                                                            title="Revoke Access"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            {profile.id === user?.id && (
                                                <span className="text-muted" style={{ fontSize: '0.8rem' }}> (You)</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="admin-footer">
                    <button className="btn btn-secondary btn-small" onClick={() => {
                        signOut();
                        onClose();
                    }}>
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
