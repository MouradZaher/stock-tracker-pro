import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Check, X, Shield, Users, LogOut, Activity, Eye, Wallet, Database, Server, Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { yahooFinanceApi } from '../services/api';
import AdminPortfolioView from './AdminPortfolioView';
import { fetchUserPortfolios } from '../services/portfolioService';
import { formatCurrency } from '../utils/formatters';

interface Profile {
    id: string;
    email: string;
    username?: string;
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

    const handleDeleteUser = async (profile: Profile) => {
        const email = profile.email || profile.username || 'Encrypted User';
        if (!window.confirm(`⚠️ EXTREME ACTION: PERMANENTLY DELETE USER ${email}?\n\nThis will purge all portfolio and watchlist data associated with this ID. This cannot be undone.`)) {
            return;
        }

        try {
            // 1. Delete Portfolios (manual cascade for safety/clarity)
            await supabase.from('portfolios').delete().eq('user_id', profile.id);

            // 2. Delete Watchlist
            await supabase.from('watchlists').delete().eq('user_id', profile.id);

            // 3. Delete Profile
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', profile.id);

            if (error) throw error;

            toast.success(`User ${email} and all associated data purged.`);
            setProfiles(prev => prev.filter(p => p.id !== profile.id));
        } catch (err) {
            console.error('Purge error:', err);
            toast.error('Failed to fully purge user data.');
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
        <div className="admin-overlay glass-blur" onClick={onClose}>
            <div className="admin-modal glass-effect" onClick={e => e.stopPropagation()} style={{
                maxWidth: '900px',
                width: '95%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid var(--glass-border-bright)'
            }}>
                <div className="admin-header" style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid var(--glass-border)',
                    background: 'rgba(255,255,255,0.02)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="icon-badge" style={{
                            background: 'var(--gradient-primary)',
                            padding: '10px',
                            borderRadius: '12px',
                            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
                        }}>
                            <Shield size={24} color="white" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Admin Dashboard</h2>
                            <p className="admin-subtitle" style={{ fontSize: '0.8rem', opacity: 0.7, margin: 0 }}>System Management & Oversight</p>
                        </div>
                    </div>
                    <button className="btn btn-icon glass-button" onClick={onClose} style={{ borderRadius: '50%' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: window.innerWidth < 768 ? '1rem' : '1.5rem' }}>
                    {/* System Pulse Grid - High Tech Version */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: window.innerWidth < 480 ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '1rem',
                        marginBottom: '2rem'
                    }}>
                        <div className="glass-card" style={{
                            padding: '1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                            borderLeft: `4px solid ${systemStatus.api.status === 'online' ? 'var(--color-success)' : 'var(--color-error)'}`,
                            background: 'rgba(255,255,255,0.01)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Market Bridge</div>
                                <Server size={14} color={systemStatus.api.status === 'online' ? 'var(--color-success)' : 'var(--color-error)'} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{systemStatus.api.status === 'online' ? 'NOMINAL' : 'FAULT'}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', fontFamily: 'monospace' }}>YF-API-v8</div>
                            </div>
                            <div style={{ height: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div className="shimmer" style={{ width: '40%', height: '100%', background: systemStatus.api.status === 'online' ? 'var(--color-success)' : 'var(--color-error)', opacity: 0.3 }} />
                            </div>
                        </div>

                        <div className="glass-card" style={{
                            padding: '1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                            borderLeft: `4px solid ${systemStatus.db.status === 'online' ? 'var(--color-success)' : 'var(--color-error)'}`,
                            background: 'rgba(255,255,255,0.01)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Neural Core</div>
                                <Database size={14} color={systemStatus.db.status === 'online' ? 'var(--color-success)' : 'var(--color-error)'} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{systemStatus.db.status === 'online' ? 'SYNCED' : 'ERR_TIMEOUT'}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', fontFamily: 'monospace' }}>DB-SGP-1</div>
                            </div>
                            <div style={{ height: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div className="shimmer" style={{ width: '70%', height: '100%', background: systemStatus.db.status === 'online' ? 'var(--color-success)' : 'var(--color-error)', opacity: 0.3 }} />
                            </div>
                        </div>

                        <div className="glass-card" style={{
                            padding: '1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                            borderLeft: '4px solid var(--color-accent)',
                            background: 'rgba(255,255,255,0.01)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ping response</div>
                                <Clock size={14} color="var(--color-accent)" />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{systemStatus.api.latency}ms</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', fontFamily: 'monospace' }}>GLOBAL</div>
                            </div>
                            <div style={{ height: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ width: '100%', height: '100%', background: 'var(--color-accent)', opacity: 0.1 }} />
                            </div>
                        </div>
                    </div>

                    <div className="admin-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
                        <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: -5, right: -5, opacity: 0.05 }}><Users size={40} /></div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--color-accent)' }}>{profiles.length}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>OPERATIVES</div>
                        </div>
                        <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: -5, right: -5, opacity: 0.05 }}><CheckCircle size={40} /></div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--color-success)' }}>{profiles.filter(p => p.is_approved).length}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>VERIFIED</div>
                        </div>
                        <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: -5, right: -5, opacity: 0.05 }}><Wallet size={40} /></div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-warning)', marginTop: '4px' }}>{formatCurrency(profiles.reduce((sum, p) => sum + (p.portfolioValue || 0), 0))}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>TOTAL AUM</div>
                        </div>
                    </div>

                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)' }}>
                        <Activity size={16} /> USER DIRECTORY
                    </h3>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '4rem' }}>
                            <div className="spinner" style={{ margin: '0 auto 1.5rem', width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--color-accent)' }} />
                            <p style={{ color: 'var(--color-text-tertiary)' }}>Syncing encrypted profiles...</p>
                        </div>
                    ) : (
                        <div className="admin-content-container">
                            {/* Desktop Table View */}
                            <div className="desktop-only" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(255,255,255,0.03)', textAlign: 'left' }}>
                                            <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Identity</th>
                                            <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Privilege</th>
                                            <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Status</th>
                                            <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>AUM</th>
                                            <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', textAlign: 'right' }}>Authorization</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {profiles.map(profile => (
                                            <tr key={profile.id} style={{ borderTop: '1px solid var(--glass-border)', transition: 'background 0.2s' }}>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{profile.email || profile.username || 'Anonymous'}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>ID: {profile.id.slice(0, 8)}...</div>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{
                                                        fontSize: '0.65rem',
                                                        fontWeight: 800,
                                                        padding: '4px 8px',
                                                        borderRadius: '6px',
                                                        background: profile.role === 'admin' ? 'var(--color-success-light)' : 'var(--color-accent-light)',
                                                        color: profile.role === 'admin' ? 'var(--color-success)' : 'var(--color-accent)'
                                                    }}>
                                                        {profile.role.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: profile.is_approved ? 'var(--color-success)' : 'var(--color-error)' }}>
                                                        {profile.is_approved ? <Check size={14} /> : <Clock size={14} />}
                                                        {profile.is_approved ? 'Authorized' : 'Pending'}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 700 }}>
                                                    {formatCurrency(profile.portfolioValue || 0)}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                        <button
                                                            onClick={() => setInspectingUser({ id: profile.id, email: profile.email || profile.username })}
                                                            className="btn btn-icon glass-button"
                                                            title="Inspect"
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                        {!profile.is_approved && (
                                                            <button
                                                                onClick={() => handleApprove(profile.id, profile.email || profile.username)}
                                                                className="btn btn-icon glass-button"
                                                                style={{ color: 'var(--color-success)' }}
                                                            >
                                                                <Check size={14} />
                                                            </button>
                                                        )}
                                                        {profile.is_approved && profile.role !== 'admin' && (
                                                            <button
                                                                onClick={() => handleReject(profile.id, profile.email || profile.username)}
                                                                className="btn btn-icon glass-button"
                                                                style={{ color: 'var(--color-error)' }}
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        )}
                                                        {profile.role !== 'admin' && (
                                                            <button
                                                                onClick={() => handleDeleteUser(profile)}
                                                                className="btn btn-icon glass-button hover-danger"
                                                                style={{ color: 'rgba(239, 68, 68, 0.6)' }}
                                                                title="Purge User"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View - iOS Optimized */}
                            <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {profiles.map(profile => (
                                    <div key={profile.id} className="glass-card" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
                                        {profile.role === 'admin' && (
                                            <div style={{ position: 'absolute', top: 0, right: 0, width: '40px', height: '40px', background: 'var(--color-success-light)', borderRadius: '0 0 0 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Shield size={14} color="var(--color-success)" />
                                            </div>
                                        )}

                                        <div style={{ marginBottom: '1rem' }}>
                                            <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '0.25rem' }}>{profile.email || profile.username || 'Encrypted User'}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                                                <span style={{ fontSize: '1.2rem', lineHeight: 0.5 }}>·</span>
                                                <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{formatCurrency(profile.portfolioValue || 0)}</span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                                            <button
                                                onClick={() => setInspectingUser({ id: profile.id, email: profile.email || profile.username })}
                                                className="btn glass-button"
                                                style={{ flex: 1, padding: '10px', fontSize: '0.8rem', fontWeight: 700, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                            >
                                                <Eye size={16} /> Audit
                                            </button>

                                            {!profile.is_approved ? (
                                                <button
                                                    onClick={() => handleApprove(profile.id, profile.email || profile.username)}
                                                    className="btn btn-primary"
                                                    style={{ flex: 1.5, padding: '10px', fontSize: '0.8rem', fontWeight: 700, borderRadius: '12px', background: 'var(--color-success)' }}
                                                >
                                                    Authorize
                                                </button>
                                            ) : (
                                                <div style={{
                                                    flex: 1.5,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '6px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 700,
                                                    color: 'var(--color-success)',
                                                    background: 'var(--color-success-light)',
                                                    borderRadius: '12px'
                                                }}>
                                                    <CheckCircle size={16} /> SECURE
                                                </div>
                                            )}

                                            {profile.role !== 'admin' && (
                                                <button
                                                    onClick={() => handleDeleteUser(profile)}
                                                    className="btn glass-button"
                                                    style={{
                                                        width: '44px',
                                                        padding: '0',
                                                        borderRadius: '12px',
                                                        color: '#EF4444',
                                                        borderColor: 'rgba(239, 68, 68, 0.2)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="admin-footer" style={{
                    padding: '1.25rem 1.5rem',
                    borderTop: '1px solid var(--glass-border)',
                    background: 'rgba(0,0,0,0.2)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', fontFamily: 'monospace' }}>
                        v4.0.2 / SECURE_TUNNEL_ESTABLISHED
                    </div>
                    <button className="btn btn-secondary glass-button" style={{
                        borderRadius: '10px',
                        fontSize: '0.75rem',
                        gap: '8px',
                        padding: '8px 16px',
                        fontWeight: 700,
                        letterSpacing: '0.05em'
                    }} onClick={() => {
                        signOut();
                        onClose();
                    }}>
                        <LogOut size={14} /> TERMINATE SESSION
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
