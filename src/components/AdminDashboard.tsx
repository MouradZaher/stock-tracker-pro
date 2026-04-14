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
            await supabase.from('portfolios').delete().eq('user_id', profile.id);
            await supabase.from('watchlists').delete().eq('user_id', profile.id);
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
        <div className="admin-modal" style={{
            width: '100%', height: '100%',
            background: 'var(--color-bg-primary)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="custom-scrollbar">
                
                {/* System Health Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {[
                        { label: 'MARKET BRIDGE', status: systemStatus.api.status, val: `${systemStatus.api.latency}ms`, icon: Server, sub: 'YF-REST-v8' },
                        { label: 'NEURAL CORE', status: systemStatus.db.status, val: 'SYNCED', icon: Database, sub: 'SUPA-SGP-1' },
                        { label: 'ACTIVE OPERATIVES', status: 'online', val: profiles.length.toString(), icon: Users, sub: 'IDENTIFIED' },
                        { label: 'TOTAL AUM', status: 'online', val: formatCurrency(profiles.reduce((sum, p) => sum + (p.portfolioValue || 0), 0)), icon: Wallet, sub: 'AGGREGATED' }
                    ].map((stat, i) => (
                        <div key={i} style={{ 
                            background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', padding: '1rem', borderRadius: '12px',
                            borderLeft: `3px solid ${stat.status === 'online' ? 'var(--color-accent)' : StatStatusColor(stat.status)}`
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <span style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--color-text-tertiary)', letterSpacing: '0.05em' }}>{stat.label}</span>
                                <stat.icon size={12} color="var(--color-text-tertiary)" />
                            </div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--color-text-primary)' }}>{stat.val}</div>
                            <div style={{ fontSize: '0.55rem', color: 'var(--color-text-tertiary)', fontWeight: 700, marginTop: '4px' }}>{stat.sub}</div>
                        </div>
                    ))}
                </div>

                {/* Directory */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                        <Activity size={14} color="var(--color-accent)" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Operative Directory</span>
                    </div>

                    {loading ? (
                        <div style={{ padding: '4rem', textAlign: 'center' }}>
                            <div style={{ width: '8px', height: '8px', background: 'var(--color-accent)', borderRadius: '50%', margin: '0 auto 1rem', animation: 'pulse 1.5s infinite' }} />
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-tertiary)' }}>SYNCHRONIZING SECURE TUNNEL...</span>
                        </div>
                    ) : (
                        <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'var(--color-bg-elevated)', textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>
                                        <th style={thStyle}>IDENTITY</th>
                                        <th style={thStyle}>CLEARANCE</th>
                                        <th style={thStyle}>STATUS</th>
                                        <th style={thStyle}>AUM</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>COMMAND</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {profiles.map(profile => (
                                        <tr key={profile.id} style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)' }}>
                                            <td style={tdStyle}>
                                                <div style={{ fontWeight: 800, color: 'var(--color-text-primary)', fontSize: '0.8rem' }}>{profile.email || 'ENCRYPTED_ID'}</div>
                                                <div style={{ fontSize: '0.55rem', color: 'var(--color-text-tertiary)', fontWeight: 700 }}>HEX: {profile.id.slice(0, 12)}</div>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={{ 
                                                    fontSize: '0.55rem', fontWeight: 900, padding: '2px 6px', border: `1px solid ${profile.role === 'admin' ? 'var(--color-accent)' : '#222'}`,
                                                    color: profile.role === 'admin' ? 'var(--color-accent)' : '#555', borderRadius: '4px'
                                                }}>
                                                    {profile.role.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem', fontWeight: 800, color: profile.is_approved ? 'var(--color-accent)' : '#ef4444' }}>
                                                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor', boxShadow: '0 0 6px currentColor' }} />
                                                    {profile.is_approved ? 'VERIFIED' : 'RESTRICTED'}
                                                </div>
                                            </td>
                                            <td style={{ ...tdStyle, color: 'var(--color-text-primary)', fontWeight: 800, fontSize: '0.8rem' }}>
                                                {formatCurrency(profile.portfolioValue || 0)}
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                                    <button 
                                                        onClick={() => setInspectingUser({ id: profile.id, email: profile.email || 'Encrypted' })}
                                                        style={actionBtnStyle('#888')} title="Audit Portfolio"
                                                    >
                                                        <Eye size={12} />
                                                    </button>
                                                    {profile.is_approved ? (
                                                        profile.role !== 'admin' && (
                                                            <button onClick={() => handleReject(profile.id, profile.email || '')} style={actionBtnStyle('#ef4444')} title="Revoke Access">
                                                                <XCircle size={12} />
                                                            </button>
                                                        )
                                                    ) : (
                                                        <button onClick={() => handleApprove(profile.id, profile.email || '')} style={actionBtnStyle('var(--color-accent)')} title="Authorize">
                                                            <Check size={12} />
                                                        </button>
                                                    )}
                                                    {profile.role !== 'admin' && (
                                                        <button onClick={() => handleDeleteUser(profile)} style={actionBtnStyle('#441111')} title="Purge Data">
                                                            <Trash2 size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '0.75rem 1.5rem', background: 'var(--color-bg-elevated)', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.5rem', color: 'var(--color-text-tertiary)', fontWeight: 900, letterSpacing: '0.1em' }}>KERNEL_V4.0.2 // SECURE_HANDSHAKE_VALIDATED</div>
                <button onClick={() => { signOut(); }} style={{
                    background: 'transparent', border: '1px solid #441111', color: '#ef4444', 
                    fontSize: '0.55rem', fontWeight: 900, padding: '4px 10px', borderRadius: '4px', cursor: 'pointer'
                }}>
                    TERMINATE ALL SESSIONS
                </button>
            </div>
        </div>
    );
};

const StatStatusColor = (status: string) => {
    switch (status) {
        case 'online': return 'var(--color-accent)';
        case 'offline': return '#ef4444';
        default: return '#555';
    }
};

const thStyle: React.CSSProperties = {
    padding: '0.75rem 1rem', fontSize: '0.55rem', fontWeight: 900, color: 'var(--color-text-tertiary)', letterSpacing: '0.1em'
};

const tdStyle: React.CSSProperties = {
    padding: '0.75rem 1rem', verticalAlign: 'middle'
};

const actionBtnStyle = (color: string): React.CSSProperties => ({
    width: '24px', height: '24px', background: 'transparent', border: `1px solid ${color}33`,
    color: color, borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', 
    justifyContent: 'center', transition: 'all 0.2s'
});

export default AdminDashboard;
