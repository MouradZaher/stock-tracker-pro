import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, ArrowRight, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import LiveTicker from '../components/LiveTicker';
import BenefitsGrid from '../components/BenefitsGrid';

const LandingPage: React.FC = () => {
    const { signInWithEmail } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [linkSent, setLinkSent] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        const { error } = await signInWithEmail(email);
        setLoading(false);

        if (error) {
            console.error('Login error:', error);
            if (error.status === 429 || error.message?.includes('Too many requests') || error.message?.includes('rate limit')) {
                toast.error('Too many attempts. Please wait 60 seconds before trying again.');
            } else {
                toast.error(error.message || 'Failed to send magic link. Please try again.');
            }
        } else {
            setLinkSent(true);
            toast.success('Check your email for the magic link!');
        }
    };

    if (linkSent) {
        return (
            <div className="landing-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div className="login-card" style={{ background: 'var(--color-bg-secondary)', padding: '3rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', maxWidth: '450px', width: '100%', boxShadow: 'var(--shadow-xl)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div className="icon-circle" style={{ background: 'var(--color-accent-light)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                            <Mail size={32} color="var(--color-accent)" />
                        </div>
                        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>Check Your Email</h2>
                        <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                            We've sent a magic link to <strong style={{ color: 'var(--color-text-primary)' }}>{email}</strong>.<br />
                            Click the link in your inbox to sign in securely.
                        </p>
                    </div>
                    <button
                        className="btn btn-secondary"
                        style={{ width: '100%', padding: '1rem' }}
                        onClick={() => setLinkSent(false)}
                    >
                        Use a different email
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="landing-page">
            <LiveTicker />

            <nav className="landing-nav" style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
                <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.25rem', fontWeight: 700 }}>
                    <div style={{ background: 'var(--gradient-primary)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
                        </svg>
                    </div>
                    <span>StockTracker <span className="gradient-text">Pro</span></span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '6px 14px', borderRadius: '99px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Lock size={12} color="var(--color-warning)" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Private Access Only
                        </span>
                    </div>
                </div>
            </nav>

            <div className="hero-section">
                <div className="hero-content">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--color-accent-light)', color: 'var(--color-accent)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                        <span style={{ width: '6px', height: '6px', background: 'var(--color-accent)', borderRadius: '50%' }}></span>
                        New: Advanced AI Recommendations
                    </div>
                    <h1 className="hero-title">
                        Master the Market <br />
                        <span className="gradient-text">with Precision.</span>
                    </h1>
                    <p className="hero-subtitle">
                        The ultimate dashboard for S&P 500 investors. Real-time insights, automated portfolio tracking, and institutional-grade analytics.
                    </p>

                    <form onSubmit={handleLogin} className="login-form">
                        <div className="input-group">
                            <input
                                type="email"
                                placeholder="Enter your email to request access"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="landing-input"
                            />
                            <button disabled={loading} type="submit" className="btn btn-primary" style={{ padding: '0 1.5rem', borderRadius: 'var(--radius-lg)' }}>
                                {loading ? 'Sending...' : <>Get Access <ArrowRight size={18} /></>}
                            </button>
                        </div>
                        <p className="form-note" style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Shield size={14} color="var(--color-success)" />
                            Enterprise-grade security. No password required.
                        </p>
                    </form>
                </div>

                <BenefitsGrid />
            </div>

            <footer className="landing-footer" style={{ padding: '2rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-tertiary)', borderTop: '1px solid var(--color-border)' }}>
                &copy; {new Date().getFullYear()} StockTracker Pro. Designed for high-frequency insights.
            </footer>
        </div>
    );
};

export default LandingPage;
