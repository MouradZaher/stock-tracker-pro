import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Check, X, Shield, Users, Clock, LogOut, Activity, Eye, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { yahooFinanceApi } from '../services/api';
import AdminPortfolioView from './AdminPortfolioView';
import { fetchUserPortfolios } from '../services/portfolioService';
import { formatCurrency } from '../utils/formatters';

interface Profile {
    id: string;
    email: string;
    role: 'admin' | 'user';
    is_approved: boolean;
    created_at: string;
    portfolioValue?: number;
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
    const [inspectingUser, setInspectingUser] = useState<{ id: string; email: string } | null>(null);

    // Test API connection silently
    const testApiConnection = async () => {
        setApiStatus('checking');
        try {
            // Test with a simple endpoint - don't show loading toast
            await yahooFinanceApi.get('', { params: { symbols: 'AAPL' }, timeout: 3000 });
            setApiStatus('online');
            // Only show success toast on manual click, not on auto-load
        } catch (error) {
            console.log('API health check: Yahoo Finance API currently unreachable (normal on localhost)');
            setApiStatus('offline');
            // Don't show error toast - this is expected on localhost
        }
    };

    const fetchProfiles = async () => {
        setLoading(true);
        // Check health on load
        testApiConnection();

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Supabase profiles error:', error);
                toast.error('Failed to load real profile data');
                setProfiles([]);
            } else {
                // Fetch portfolio values for each user
                const profilesWithValues = await Promise.all((data as Profile[]).map(async (profile) => {
                    try {
                        const positions = await fetchUserPortfolios(profile.id);
                        const value = positions.reduce((sum, p) => sum + (p.units * p.currentPrice), 0);
                        return { ...profile, portfolioValue: value };
                    } catch (e) {
                        return { ...profile, portfolioValue: 0 };
                    }
                }));
                setProfiles(profilesWithValues);
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

    if (inspectingUser) {
        return (
            <AdminPortfolioView
                userId={inspectingUser.id}
                userEmail={inspectingUser.email}
                onClose={() => setInspectingUser(null)}
            />
        );
    }

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
                        <Wallet size={20} className="text-accent" />
                        <span className="stat-value">
                            {formatCurrency(profiles.reduce((sum, p) => sum + (p.portfolioValue || 0), 0))}
                        </span>
                        <span className="stat-label">Total AUM</span>
                    </div>
                    <div className="admin-stat-card"
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                            toast.promise(
                                testApiConnection(),
                                {
                                    loading: 'Testing API connection...',
                                    success: 'API is online and reachable',
                                    error: 'API unreachable (normal on localhost)'
                                }
                            );
                        }}
                        title="Click to test API connection"
                    >
                        <Activity size={20} className={apiStatus === 'online' ? "text-success" : apiStatus === 'offline' ? "text-warning" : "text-muted"} />
                        <span className="stat-value" style={{ fontSize: '1rem' }}>
                            {apiStatus === 'online' ? 'Online' : apiStatus === 'offline' ? 'Offline' : 'Unknown'}
                        </span>
                        <span className="stat-label">System Status{apiStatus === 'offline' ? ' (click to retry)' : ''}</span>
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
                                    <th style={{ textAlign: 'right' }}>Portfolio Value</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {profiles.map(profile => (
                                    <tr key={profile.id}>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span className="user-email">{profile.email}</span>
                                                <span className="user-id">{profile.id}</span>
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
                                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                            {formatCurrency(profile.portfolioValue || 0)}
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => setInspectingUser({ id: profile.id, email: profile.email })}
                                                    title="View Portfolio"
                                                >
                                                    <Eye size={18} />
                                                </button>

                                                {profile.id !== user?.id && (
                                                    <>
                                                        {profile.is_approved ? (
                                                            <button
                                                                className="btn-icon btn-reject"
                                                                onClick={() => handleReject(profile.id, profile.email)}
                                                                title="Revoke Access"
                                                            >
                                                                <X size={18} />
                                                            </button>
                                                        ) : (
                                                            <span className="text-muted" style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>Auto-approving...</span>
                                                        )}
                                                    </>
                                                )}
                                            </div>
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
