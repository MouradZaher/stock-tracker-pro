import React, { useState, useRef, useEffect } from 'react';
import { Shield, Lock, Sun, Moon, User, ArrowRight, UserPlus, X, BarChart3, TrendingUp, Zap, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePinAuth } from '../contexts/PinAuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { soundService } from '../services/soundService';
import toast from 'react-hot-toast';
import BenefitsGrid from '../components/BenefitsGrid';
import AIPerformanceTracker from '../components/AIPerformanceTracker';
import TopBar from '../components/TopBar';
import './LandingPage.css';

const PinLoginPage: React.FC = () => {
    const { checkUser, login, register } = usePinAuth();
    const { theme, toggleTheme } = useTheme();

    // Form state
    const [username, setUsername] = useState('');
    const [pin, setPin] = useState(['', '', '', '']);
    const [mode, setMode] = useState<'username' | 'login' | 'signup'>('username');
    const [isLoading, setIsLoading] = useState(false);
    const [userExists, setUserExists] = useState(false);
    const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'support' | 'compliance' | null>(null);
    const [activeOverviewTab, setActiveOverviewTab] = useState(0);

    const OVERVIEW_TABS = [
        {
            id: 'ai-insights',
            title: 'AI-Powered Insights',
            icon: Zap,
            description: 'Advanced algorithms analyze market sentiment, predict trends, and provide actionable recommendations.',
            features: [
                'Sentiment analysis from news & social media',
                'Predictive modeling for price movements',
                'Automated trading signals',
                'Risk assessment reports'
            ]
        },
        {
            id: 'portfolio-tracking',
            title: 'Live Portfolio Tracking',
            icon: BarChart3,
            description: 'Real-time monitoring of your investments with comprehensive performance analytics.',
            features: [
                'Real-time P&L calculations',
                'Custom performance charts',
                'Dividend tracking & alerts',
                'Tax lot management'
            ]
        },
        {
            id: 'market-intelligence',
            title: 'Market Intelligence',
            icon: TrendingUp,
            description: 'Comprehensive market data visualization and correlation analysis tools.',
            features: [
                'Interactive heatmaps',
                'Correlation matrix analysis',
                'Real-time news aggregation',
                'Sector performance tracking'
            ]
        }
    ];

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

    const inputRefs = [
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null)
    ];
    const usernameRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Focus username input on mount
        usernameRef.current?.focus();

        // Disable scrolling for login page to ensure no vertical scroll
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    // Check if username exists when user submits
    const handleUsernameSubmit = async () => {
        if (!username.trim()) {
            toast.error('Please enter a username');
            return;
        }

        setIsLoading(true);
        soundService.playTap();

        try {
            const result = await checkUser(username.trim());
            setUserExists(result.exists);

            if (result.exists) {
                setMode('login');
                toast.success(`Welcome back, ${username}!`);
            } else {
                setMode('signup');
                toast(`New user! Create a 4-digit PIN to register.`, { icon: '👋' });
            }

            // Focus first PIN input
            setTimeout(() => inputRefs[0].current?.focus(), 100);
        } catch (err) {
            toast.error('Error checking username. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePinChange = (index: number, value: string) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);

        // Auto-focus next input
        if (value && index < 3) {
            inputRefs[index + 1].current?.focus();
        }

        // Auto-submit when all 4 digits entered
        if (index === 3 && value) {
            const fullPin = newPin.join('');
            handlePinSubmit(fullPin);
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            inputRefs[index - 1].current?.focus();
        }
    };

    const handlePinSubmit = async (fullPin: string) => {
        if (fullPin.length !== 4) return;

        setIsLoading(true);

        try {
            if (mode === 'signup') {
                // Register new user
                const result = await register(username.trim(), fullPin);
                if (result.success) {
                    soundService.playSuccess();
                    toast.success('Registration successful! Please wait for Admin approval.', { duration: 5000 });
                    setMode('username');
                    setUsername('');
                    if (usernameRef.current) usernameRef.current.focus();
                } else {
                    soundService.playError();
                    toast.error(result.error || 'Registration failed');
                    resetPin();
                }
            } else {
                // Login existing user
                const result = await login(username.trim(), fullPin);
                if (result.success) {
                    soundService.playSuccess();
                    toast.success('Welcome back! Access granted.');
                } else {
                    soundService.playError();
                    toast.error(result.error || 'Invalid PIN');
                    resetPin();
                }
            }
        } catch (err) {
            soundService.playError();
            toast.error('Authentication failed. Please try again.');
            resetPin();
        } finally {
            setIsLoading(false);
        }
    };

    const resetPin = () => {
        setPin(['', '', '', '']);
        inputRefs[0].current?.focus();
    };

    const goBack = () => {
        setMode('username');
        setPin(['', '', '', '']);
        setUsername('');
        usernameRef.current?.focus();
    };

    return (
        <div className="landing-page">
            <TopBar />
            
            {/* Background elements */}
            <div className="landing-bg-elements">
                <div className="bg-blob blob-1"></div>
                <div className="bg-blob blob-2"></div>
                <div className="bg-blob blob-3"></div>
            </div>

            <nav className="landing-nav">
                <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: '1.25rem', fontWeight: 700 }}>
                    <div style={{ background: 'var(--gradient-primary)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Shield size={18} color="white" />
                    </div>
                    <span>StockTracker <span className="gradient-text">Pro</span></span>
                </div>
                <div className="landing-nav-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="access-badge" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-full)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Lock size={12} color="var(--color-warning)" />
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Secure Channel
                        </span>
                    </div>

                    <button
                        className="glass-button"
                        onClick={() => {
                            soundService.playTap();
                            toggleTheme();
                        }}
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'white'
                        }}
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </div>
            </nav>

            <div className="hero-section">
                {/* Left: Login Sidebar */}
                <div className="login-sidebar">
                    <div className="login-form-wrapper">
                        <div style={{ marginBottom: '2.5rem' }}>
                            <div style={{ display: 'inline-flex', background: 'rgba(99,102,241,0.1)', padding: '8px', borderRadius: '12px', marginBottom: '1.25rem' }}>
                                <Shield size={24} color="var(--color-accent)" />
                            </div>
                            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'white', letterSpacing: '-0.02em' }}>
                                {mode === 'username' ? 'Access Terminal' : 'Verify Identity'}
                            </h2>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem' }}>
                                {mode === 'username' ? 'Enter your institutional credentials' : `Confirming access for ${username}`}
                            </p>
                        </div>
                        
                        <div className="login-form">
                            {/* Step 1: Username Input */}
                            {mode === 'username' && (
                                <div className="form-step-container">
                                    <div className="input-group" style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }}>
                                            <User size={20} />
                                        </div>
                                        <input
                                            ref={usernameRef}
                                            type="text"
                                            className="landing-input"
                                            placeholder="Standard ID"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            style={{ height: '60px', paddingLeft: '52px', fontSize: '1rem', color: 'white' }}
                                            onKeyDown={(e) => e.key === 'Enter' && handleUsernameSubmit()}
                                            disabled={isLoading}
                                            autoCapitalize="none"
                                            autoComplete="username"
                                        />
                                        <button
                                            onClick={handleUsernameSubmit}
                                            disabled={isLoading || !username.trim()}
                                            className="btn btn-primary"
                                            style={{
                                                position: 'absolute',
                                                right: '8px',
                                                top: '8px',
                                                bottom: '8px',
                                                borderRadius: '10px',
                                                padding: '0 16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                fontWeight: 600,
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            {isLoading ? '...' : <><ArrowRight size={18} /></>}
                                        </button>
                                    </div>
                                    <div style={{ marginTop: '1.5rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Zap size={14} />
                                        <span>Authorized access points only</span>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: PIN Input */}
                            {(mode === 'login' || mode === 'signup') && (
                                <div className="form-step-container" style={{ animation: 'slideInUp 0.4s ease-out' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                        <button onClick={goBack} className="glass-button" style={{ width: '36px', height: '36px', borderRadius: '10px', padding: 0 }}>←</button>
                                        <span style={{ color: 'white', fontWeight: 600 }}>{username}</span>
                                    </div>

                                    <div className="pin-input-group" style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
                                        {pin.map((digit, index) => (
                                            <input
                                                key={index}
                                                ref={inputRefs[index]}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handlePinChange(index, e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(index, e)}
                                                disabled={isLoading}
                                                className="landing-input"
                                                style={{ width: '100%', height: '70px', textAlign: 'center', fontSize: '1.75rem', fontWeight: 800, padding: 0, color: 'white' }}
                                                onFocus={(e) => e.target.select()}
                                            />
                                        ))}
                                    </div>
                                    <p style={{ marginTop: '1.5rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', textAlign: 'center' }}>
                                        {mode === 'signup' ? 'Create a secure 4-digit PIN' : 'Enter your 4-digit security PIN'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Content Showcase */}
                <div className="content-showcase">
                    <div className="showcase-header">
                        <div className="access-badge" style={{ display: 'inline-flex', marginBottom: '1.5rem' }}>
                            <span className="gradient-text" style={{ fontWeight: 800, letterSpacing: '0.1em', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                                The Future of Trading
                            </span>
                        </div>
                        <h1 className="showcase-title">
                            Institutional Grade <br />
                            <span className="gradient-text">Intelligence.</span>
                        </h1>
                        <p className="showcase-subtitle">
                            Supercharge your portfolio with AI-driven sentiment analysis, real-time market breadth, and institutional-grade risk management tools.
                        </p>
                    </div>

                    <div className="features-compact-grid">
                        <div className="feature-item-card">
                            <div className="feature-icon-box">
                                <Zap size={22} />
                            </div>
                            <h3 className="feature-card-title">Smart Momentum</h3>
                            <p className="feature-card-desc">AI-detected trend shifts before they manifest in price action.</p>
                        </div>
                        <div className="feature-item-card">
                            <div className="feature-icon-box">
                                <BarChart3 size={22} />
                            </div>
                            <h3 className="feature-card-title">Market Breadth</h3>
                            <p className="feature-card-desc">Deep sector rotation analysis and institutional positioning data.</p>
                        </div>
                        <div className="feature-item-card">
                            <div className="feature-icon-box">
                                <Shield size={22} />
                            </div>
                            <h3 className="feature-card-title">Risk Engine</h3>
                            <p className="feature-card-desc">Advanced correlation matrix and volatility clustering models.</p>
                        </div>
                        <div className="feature-item-card">
                            <div className="feature-icon-box">
                                <TrendingUp size={22} />
                            </div>
                            <h3 className="feature-card-title">Global Sentiment</h3>
                            <p className="feature-card-desc">Multi-channel NLP processing for real-time market psychology.</p>
                        </div>
                    </div>

                    {/* Integrated mini-tracker peeking from bottom */}
                    <div style={{ 
                        position: 'absolute', 
                        bottom: '-50px', 
                        right: '4rem', 
                        width: '400px', 
                        opacity: 0.4,
                        pointerEvents: 'none' 
                    }}>
                        <AIPerformanceTracker />
                    </div>
                </div>
            </div>

            {activeModal && (
                <div className="modal-overlay glass-blur" onClick={() => setActiveModal(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}>
                    <div className="modal glass-effect" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 'clamp(320px, 90vw, 500px)', width: '90%', background: 'rgb(10, 11, 20)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '0', overflow: 'hidden' }}>
                        <div className="modal-header" style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 className="modal-title" style={{ margin: 0, color: 'white' }}>{FOOTER_CONTENT[activeModal].title}</h3>
                            <button className="btn btn-icon glass-button" onClick={() => setActiveModal(null)} style={{ color: 'white' }}><X size={20} /></button>
                        </div>
                        <div className="modal-body" style={{ padding: '1.5rem', fontSize: '1rem', lineHeight: '1.6', color: 'rgba(255,255,255,0.6)' }}>
                            {FOOTER_CONTENT[activeModal].content}
                        </div>
                        <div className="modal-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn btn-primary" onClick={() => setActiveModal(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PinLoginPage;

