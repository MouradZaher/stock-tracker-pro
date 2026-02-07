import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Check, X, Shield, Users, LogOut, Activity, Eye, Wallet, Database, Server, Clock } from 'lucide-react';
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
    const [inspectingUser, setInspectingUser] = useState<{ id: string; email: string } | null>(null);

    // Detailed System Status
    const [systemStatus, setSystemStatus] = useState({
        api: { status: 'checking', latency: 0 },
        db: { status: 'checking', latency: 0 }
    });

    const checkSystemHealth = async () => {
        // Check API
        const apiStart = performance.now();
        try {
            await yahooFinanceApi.get('', { params: { symbols: 'SPY' }, timeout: 5000 });
            const apiLatency = Math.round(performance.now() - apiStart);
            setSystemStatus(prev => ({ ...prev, api: { status: 'online', latency: apiLatency } }));
        } catch (e) {
            setSystemStatus(prev => ({ ...prev, api: { status: 'offline', latency: 0 } }));
        }

        // Check Database
        const dbStart = performance.now();
        try {
            const { count, error } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
            if (error) throw error;
            const dbLatency = Math.round(performance.now() - dbStart);
            setSystemStatus(prev => ({ ...prev, db: { status: 'online', latency: dbLatency } }));
        } catch (e) {
            setSystemStatus(prev => ({ ...prev, db: { status: 'error', latency: 0 } }));
        }
    };

    const fetchProfiles = async () => {
        setLoading(true);
        checkSystemHealth();

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .neq('is_approved', false) // Exclude revoked users
                .order('created_at', { ascending: false });

            if (data) {
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
                            <p className="admin-subtitle">System Overview & User Management</p>
                        </div>
                    </div>
                    <button className="btn-icon" onClick={onClose}><X size={24} /></button>
                </div>

                {/* System Status Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    {/* API Status */}
                    <div className="admin-stat-card">
                        <Server size={20} className={systemStatus.api.status === 'online' ? "text-success" : "text-error"} />
                        <div>
                            <div className="stat-value" style={{ fontSize: '1rem' }}>
                                {systemStatus.api.status === 'online' ? 'Online' : 'Offline'}
                            </div>
                            <div className="stat-label">Market Data API</div>
                        </div>
                    </div>
                    {/* DB Status */}
                    <div className="admin-stat-card">
                        <Database size={20} className={systemStatus.db.status === 'online' ? "text-success" : "text-error"} />
                        <div>
                            <div className="stat-value" style={{ fontSize: '1rem' }}>
                                {systemStatus.db.status === 'online' ? 'Connected' : 'Error'}
                            </div>
                            <div className="stat-label">User Database</div>
                        </div>
                    </div>
                    {/* Latency */}
                    <div className="admin-stat-card">
                        <Clock size={20} className="text-accent" />
                        <div>
                            <div className="stat-value" style={{ fontSize: '1rem' }}>
                                {systemStatus.api.latency > 0 ? `${systemStatus.api.latency}ms` : '--'}
                            </div>
                            <div className="stat-label">Avg. Latency</div>
                        </div>
                    </div>
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
