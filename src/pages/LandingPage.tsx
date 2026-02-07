import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, ArrowRight, Mail, Lock, X } from 'lucide-react';
import toast from 'react-hot-toast';
import LiveTicker from '../components/LiveTicker';
import BenefitsGrid from '../components/BenefitsGrid';
import { soundService } from '../services/soundService';
import './LandingPage.css';

const FOOTER_CONTENT = {
    privacy: {
        title: "Privacy Policy",
        content: "At StockTracker Pro, we prioritize the protection of your personal and financial data. We employ industry-standard encryption and security protocols to ensure your information remains confidential. We do not sell your data to third parties.\n\nStockTracker Pro adheres to all relevant financial regulations and data protection laws. We maintain strict compliance standards to ensure a safe and transparent trading environment for all users."
    },
    terms: {
        title: "Terms of Service",
        content: "By using StockTracker Pro, you agree to our terms. Our platform provides financial data for informational purposes only. We are not responsible for investment decisions made based on this data. Trading involves risk."
    },
    support: {
        title: "Support",
        content: "Our dedicated support team is available 24/7 to assist you. Whether you have technical issues or questions about our features, we are here to help. Contact us at support@stocktracker.pro."
    }
};

const LandingPage: React.FC = () => {
    const { signInWithEmail } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [linkSent, setLinkSent] = useState(false);
    const [activeModal, setActiveModal] = useState<keyof typeof FOOTER_CONTENT | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        const { error } = await signInWithEmail(email);
        setLoading(false);

        if (error) {
            soundService.playError();
            console.error('Login error:', error);
            if (error.status === 429 || error.message?.includes('Too many requests') || error.message?.includes('rate limit')) {
                toast.error('Too many attempts. Please wait 60 seconds before trying again.');
            } else {
                toast.error(error.message || 'Failed to send magic link. Please try again.');
            }
        } else {
            soundService.playSuccess();
            setLinkSent(true);
            toast.success('Check your email for the magic link!');
        }
    };

    if (linkSent) {
        return (
            <div className="landing-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: 'var(--spacing-md)' }}>
                <div className="login-card glass-effect" style={{ padding: '3rem', maxWidth: '450px', width: '100%', textAlign: 'center' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <div className="icon-circle" style={{
                            background: 'var(--color-success-light)',
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem auto',
                            boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)'
                        }}>
                            <Mail size={40} color="var(--color-success)" />
                        </div>
                        <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem', fontWeight: 800 }}>Check Your Inbox</h2>
                        <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6', fontSize: '1.1rem' }}>
                            We've sent a magic link to <br />
                            <strong style={{ color: 'var(--color-text-primary)' }}>{email}</strong>
                        </p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--glass-border)', marginBottom: '2rem' }}>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-tertiary)' }}>
                            Click the institutional secure link in your email to instantly access your dashboard.
                        </p>
                    </div>
                    <button
                        className="btn btn-secondary glass-button"
                        style={{ width: '100%', padding: '1.25rem', borderRadius: '1rem' }}
                        onClick={() => {
                            soundService.playTap();
                            setLinkSent(false);
                        }}
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
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--color-accent-light)', color: 'var(--color-accent)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>
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
                        <p className="form-note" style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Shield size={14} color="var(--color-success)" />
                            Enterprise-grade security. No password required.
                        </p>
                    </form>
                </div>

                <div className="hero-visual">
                    <BenefitsGrid />
                </div>
            </div>

            <footer className="landing-footer">
                <div className="footer-links" style={{ marginBottom: '1rem' }}>
                    <span className="footer-link" onClick={() => setActiveModal('privacy')} style={{ cursor: 'pointer' }}>Privacy Policy</span>
                    <span className="footer-link" onClick={() => setActiveModal('terms')} style={{ cursor: 'pointer' }}>Terms of Service</span>
                    <span className="footer-link" onClick={() => setActiveModal('support')} style={{ cursor: 'pointer' }}>Support</span>
                </div>
                <p>&copy; {new Date().getFullYear()} StockTracker Pro</p>
            </footer>

            {/* Footer Modal */}
            {activeModal && (
                <div className="modal-overlay glass-blur" onClick={() => setActiveModal(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)' }}>
                    <div className="modal glass-effect" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%', background: 'var(--color-bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '0', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                        <div className="modal-header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 className="modal-title" style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>{FOOTER_CONTENT[activeModal].title}</h3>
                            <button className="btn btn-icon glass-button" onClick={() => setActiveModal(null)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body" style={{ padding: '1.5rem', fontSize: '1rem', lineHeight: '1.6', color: 'var(--color-text-secondary)' }}>
                            {FOOTER_CONTENT[activeModal].content}
                        </div>
                        <div className="modal-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.2)' }}>
                            <button className="btn btn-primary" onClick={() => setActiveModal(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LandingPage;
