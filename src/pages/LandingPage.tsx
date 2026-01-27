import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, ArrowRight, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

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
            <div className="landing-container">
                <div className="login-card">
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div className="icon-circle">
                            <Mail size={32} color="var(--color-accent)" />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Check Your Email</h2>
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                            We've sent a magic link to <strong>{email}</strong>.<br />
                            Click the link to sign in instantly.
                        </p>
                    </div>
                    <button
                        className="btn btn-secondary"
                        style={{ width: '100%' }}
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
            {/* Navbar */}
            <nav className="landing-nav">
                <div className="logo">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="var(--color-accent)" opacity="0.8" />
                        <path d="M2 17L12 22L22 17" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2 12L12 17L22 12" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>StockTracker Pro</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                        <Lock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                        Private Access Only
                    </span>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">
                        Professional Grade <br />
                        <span className="gradient-text">Market Intelligence</span>
                    </h1>
                    <p className="hero-subtitle">
                        Advanced analytics, real-time S&P 500 heatmaps, and AI-powered recommendations in one secure dashboard.
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
                            <button disabled={loading} type="submit" className="btn btn-primary btn-large">
                                {loading ? 'Sending...' : <>Get Access <ArrowRight size={18} /></>}
                            </button>
                        </div>
                        <p className="form-note">
                            <Shield size={12} style={{ display: 'inline', marginRight: '4px' }} />
                            Secure passwordless login via Magic Link
                        </p>
                    </form>


                </div>

                {/* Visual Preview / Benefits Grid */}
                <BenefitsGrid />
            </div>

            <footer className="landing-footer">
                &copy; {new Date().getFullYear()} StockTracker Pro. All rights reserved.
            </footer>
        </div>
    );
};

export default LandingPage;
