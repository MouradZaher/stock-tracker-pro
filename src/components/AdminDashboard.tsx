import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Check, X, Shield, Users, LogOut, Activity, Eye, Wallet, Database, Server, Clock, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { yahooFinanceApi } from '../services/api';
import AdminPortfolioView from './AdminPortfolioView';
import { fetchUserPortfolios } from '../services/portfolioService';
import { formatCurrency } from '../utils/formatters';

interface Profile {
    id: string;
    email: string;
    role: 'admin' | 'user';
    is_approved: boolean | null;
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                    {/* API Status */}
                    <div className="admin-stat-card" style={{ padding: '0.5rem 0.75rem' }}>
                        <Server size={16} className={systemStatus.api.status === 'online' ? "text-success" : "text-error"} />
                        <div>
                            <div className="stat-value" style={{ fontSize: '0.85rem' }}>
                                {systemStatus.api.status === 'online' ? 'Online' : 'Offline'}
                            </div>
                            <div className="stat-label" style={{ fontSize: '0.65rem' }}>Market API</div>
                        </div>
                    </div>
                    {/* DB Status */}
                    <div className="admin-stat-card" style={{ padding: '0.5rem 0.75rem' }}>
                        <Database size={16} className={systemStatus.db.status === 'online' ? "text-success" : "text-error"} />
                        <div>
                            <div className="stat-value" style={{ fontSize: '0.85rem' }}>
                                {systemStatus.db.status === 'online' ? 'Connected' : 'Error'}
                            </div>
                            <div className="stat-label" style={{ fontSize: '0.65rem' }}>Database</div>
                        </div>
                    </div>
                    {/* Latency */}
                    <div className="admin-stat-card" style={{ padding: '0.5rem 0.75rem' }}>
                        <Clock size={16} className="text-accent" />
                        <div>
                            <div className="stat-value" style={{ fontSize: '0.85rem' }}>
                                {systemStatus.api.latency > 0 ? `${systemStatus.api.latency}ms` : '--'}
                            </div>
                            <div className="stat-label" style={{ fontSize: '0.65rem' }}>Latency</div>
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

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                        Loading users...
                    </div>
                ) : (
                    <div className="admin-content-container">
                        {/* Desktop Table View */}
                        <table className="admin-table desktop-only" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                                    <th style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-secondary)', fontSize: '0.75rem', width: '30%' }}>User</th>
                                    <th style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-secondary)', fontSize: '0.75rem', width: '10%' }}>Role</th>
                                    <th style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-secondary)', fontSize: '0.75rem', width: '10%' }}>Status</th>
                                    <th style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-secondary)', fontSize: '0.75rem', width: '15%' }}>AUM</th>
                                    <th style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-secondary)', fontSize: '0.75rem', width: '12%' }}>Joined</th>
                                    <th style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-secondary)', fontSize: '0.75rem', textAlign: 'right', width: '23%' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {profiles.map(profile => (
                                    <tr key={profile.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <td style={{ padding: '0.5rem 0.75rem' }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.email || 'N/A'}</div>
                                        </td>
                                        <td style={{ padding: '0.5rem 0.75rem' }}>
                                            <span style={{
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontSize: '0.65rem',
                                                background: profile.role === 'admin' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                                                color: profile.role === 'admin' ? '#10B981' : '#6366F1',
                                                textTransform: 'uppercase',
                                                fontWeight: 700
                                            }}>
                                                {profile.role}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.5rem 0.75rem' }}>
                                            <span style={{
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontSize: '0.65rem',
                                                background: profile.is_approved ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                color: profile.is_approved ? '#10B981' : '#EF4444',
                                                fontWeight: 700
                                            }}>
                                                {profile.is_approved ? 'Active' : 'Pending'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', fontWeight: 600 }}>
                                            {formatCurrency(profile.portfolioValue || 0)}
                                        </td>
                                        <td style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-tertiary)', fontSize: '0.75rem' }}>
                                            {new Date(profile.created_at).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                                <button
                                                    onClick={() => setInspectingUser({ id: profile.id, email: profile.email })}
                                                    className="glass-button"
                                                    style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                                                    title="Inspect Portfolio"
                                                >
                                                    <Eye size={12} style={{ marginRight: '2px' }} /> View
                                                </button>
                                                {!profile.is_approved && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(profile.id, profile.email)}
                                                            className="glass-button"
                                                            style={{ padding: '3px 8px', fontSize: '0.7rem', color: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                                                        >
                                                            <CheckCircle size={12} /> OK
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(profile.id, profile.email)}
                                                            className="glass-button"
                                                            style={{ padding: '3px 8px', fontSize: '0.7rem', color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                                                        >
                                                            <XCircle size={12} /> No
                                                        </button>
                                                    </>
                                                )}
                                                {profile.is_approved && (
                                                    <span style={{ fontSize: '0.65rem', color: 'var(--color-success)', fontWeight: 600, padding: '3px 6px' }}>✓</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Mobile Card View */}
                        <div className="mobile-only admin-cards">
                            {profiles.map(profile => (
                                <div key={profile.id} className="glass-card" style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: 600 }}>{profile.email}</span>
                                        <span style={{
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.7rem',
                                            background: profile.role === 'admin' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                                            color: profile.role === 'admin' ? '#10B981' : '#6366F1'
                                        }}>
                                            {profile.role}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                        <span>Joined: {new Date(profile.created_at).toLocaleDateString()}</span>
                                        <span style={{ color: profile.is_approved ? 'var(--color-success)' : 'var(--color-error)' }}>
                                            {profile.is_approved ? 'Active' : 'Pending'}
                                        </span>
                                    </div>
                                    {!profile.is_approved && (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleApprove(profile.id, profile.email)}
                                                className="glass-button"
                                                style={{ flex: 1, justifyContent: 'center', color: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleReject(profile.id, profile.email)}
                                                className="glass-button"
                                                style={{ flex: 1, justifyContent: 'center', color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

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
