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
            <nav className="landing-nav" style={{ padding: 'var(--spacing-md) var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '100%', margin: 0, background: 'var(--landing-nav-bg)', position: 'relative', left: 0, right: 0 }}>
                <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>
                    <div style={{ background: 'var(--gradient-primary)', width: 'var(--spacing-xl)', height: 'var(--spacing-xl)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
                        </svg>
                    </div>
                    <span style={{ color: theme === 'light' ? 'var(--color-text-secondary)' : 'white' }}>StockTracker <span className="gradient-text">Pro</span></span>
                </div>
                <div className="landing-nav-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div className="access-badge" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', background: 'rgba(255,255,255,0.05)', padding: 'var(--spacing-xs) var(--spacing-sm)', borderRadius: 'var(--radius-full)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Lock size={10} color="var(--color-warning)" />
                        <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                            Private Access
                        </span>
                    </div>

                    <button
                        className="glass-button icon-btn"
                        onClick={() => {
                            soundService.playTap();
                            toggleTheme();
                        }}
                        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '50%',
                            width: 'var(--spacing-xl)',
                            height: 'var(--spacing-xl)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'var(--color-text-primary)'
                        }}
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </div>
            </nav>

            <div className="hero-section" style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%', height: '100%', overflow: 'hidden' }}>
                {/* Left Column: Login Form */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div className="hero-form-container" style={{ maxWidth: '400px', width: '100%', animation: 'fadeIn 0.6s ease-out' }}>
                        <div className="login-form-wrapper glass-card" style={{ padding: '2.5rem', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 40px 100px rgba(0,0,0,0.8)' }}>
                            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                                <div style={{ background: 'var(--gradient-primary)', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 10px 20px rgba(99,102,241,0.3)' }}>
                                    <Shield size={28} color="white" />
                                </div>
                                <h2 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: '0.3rem', color: theme === 'light' ? 'var(--color-text-secondary)' : 'white', letterSpacing: '-0.01em' }}>Login</h2>
                                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', opacity: 0.8 }}>Secure access for authorized users</p>
                            </div>
                            
                            <div className="login-form">
                                {/* Step 1: Username Input */}
                                {mode === 'username' && (
                                    <div className="form-step-container">
                                        <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div className="input-with-icon" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <User size={18} className="input-icon" style={{ color: 'var(--color-text-secondary)', marginLeft: '-8px' }} />
                                                <input
                                                    ref={usernameRef}
                                                    type="text"
                                                    className="form-input landing-input"
                                                    placeholder="Username"
                                                    value={username}
                                                    onChange={(e) => setUsername(e.target.value)}
                                                    style={{ color: theme === 'light' ? 'var(--color-text-secondary)' : 'white', height: '44px' }}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleUsernameSubmit()}
                                                    disabled={isLoading}
                                                    autoCapitalize="none"
                                                    autoCorrect="off"
                                                    spellCheck={false}
                                                    autoComplete="username"
                                                    autoFocus
                                                />
                                            </div>
                                            <button
                                                onClick={handleUsernameSubmit}
                                                disabled={isLoading || !username.trim()}
                                                className="btn btn-primary next-button"
                                                style={{
                                                    borderRadius: '12px',
                                                    width: '44px',
                                                    height: '44px',
                                                    minWidth: '44px',
                                                    padding: '0',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    lineHeight: 1,
                                                    backgroundColor: 'var(--color-surface)',
                                                    border: '1px solid var(--color-border-light)'
                                                }}
                                            >
                                                {isLoading ? '...' : <ArrowRight size={20} color="var(--color-accent)" />}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: PIN Input (Login or Signup) */}
                                {(mode === 'login' || mode === 'signup') && (
                                    <div className="form-step-container">
                                        <div className="form-back-selector" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '0.75rem', width: '100%', marginBottom: '0.8rem' }}>
                                            <button onClick={goBack} className="glass-button back-btn" style={{ minWidth: '40px', minHeight: '40px', display: 'grid', placeItems: 'center', padding: 0 }}>←</button>
                                            <span className="user-indicator" style={{ color: theme === 'light' ? 'var(--color-text-secondary)' : 'white', fontWeight: 700, fontSize: '0.95rem' }}>{username || 'User'}</span>
                                        </div>

                                        <div className="pin-input-group" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
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
                                                    className="landing-input pin-field"
                                                    style={{ width: '56px', height: '56px', textAlign: 'center', fontSize: '1.4rem', fontWeight: 700, padding: '0', borderRadius: '12px', border: '1px solid var(--color-border-light)', color: theme === 'light' ? 'var(--color-text-secondary)' : 'white' }}
                                                    onFocus={(e) => e.target.select()}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Website Overview */}
                <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                    {/* Mock Dashboard Overlay (Peek-Behind Effect) */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(168,85,247,0.1) 100%)',
                        zIndex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.3
                    }}>
                        <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                            <Eye size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <div>Live Dashboard Preview</div>
                            <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Real-time charts & analytics</div>
                        </div>
                    </div>

                    {/* Tabbed Overview Carousel */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '2rem', zIndex: 2, position: 'relative' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--color-text-primary)', textAlign: 'center' }}>
                            Discover StockTracker Pro
                        </h3>

                        {/* Tab Navigation */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            {OVERVIEW_TABS.map((tab, index) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveOverviewTab(index)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.5rem 1rem',
                                        background: activeOverviewTab === index ? 'var(--color-accent-light)' : 'rgba(255,255,255,0.05)',
                                        border: `1px solid ${activeOverviewTab === index ? 'var(--glass-border-bright)' : 'var(--glass-border)'}`,
                                        borderRadius: '12px',
                                        color: activeOverviewTab === index ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        fontWeight: activeOverviewTab === index ? 600 : 500,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <tab.icon size={16} />
                                    {tab.title}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            textAlign: 'center',
                            padding: '1rem',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '16px',
                            border: '1px solid var(--glass-border)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <OVERVIEW_TABS[activeOverviewTab].icon size={48} color="var(--color-accent)" />
                            </div>
                            <h4 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
                                {OVERVIEW_TABS[activeOverviewTab].title}
                            </h4>
                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
                                {OVERVIEW_TABS[activeOverviewTab].description}
                            </p>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, textAlign: 'left', width: '100%', maxWidth: '300px' }}>
                                {OVERVIEW_TABS[activeOverviewTab].features.map((feature, idx) => (
                                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                        <div style={{ width: '6px', height: '6px', background: 'var(--color-accent)', borderRadius: '50%' }}></div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Navigation Arrows */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                            <button
                                onClick={() => setActiveOverviewTab((activeOverviewTab - 1 + OVERVIEW_TABS.length) % OVERVIEW_TABS.length)}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '50%',
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'var(--color-text-secondary)'
                                }}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                {OVERVIEW_TABS.map((_, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: activeOverviewTab === index ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => setActiveOverviewTab(index)}
                                    />
                                ))}
                            </div>
                            <button
                                onClick={() => setActiveOverviewTab((activeOverviewTab + 1) % OVERVIEW_TABS.length)}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '50%',
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'var(--color-text-secondary)'
                                }}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Integrated Feature Grid (Compact Showcase) */}
                    <div style={{ flex: 1, padding: '1rem', zIndex: 2, position: 'relative', maxHeight: '50vh', overflow: 'hidden' }}>
                        <BenefitsGrid style={{ height: '100%', overflow: 'hidden' }} />
                        <div style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                            Explore more features after login
                        </div>
                    </div>
                </div>
            </div>

            {activeModal && (
                <div className="modal-overlay glass-blur" onClick={() => setActiveModal(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)' }}>
                    <div className="modal glass-effect" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 'clamp(320px, 90vw, 500px)', width: '90%', background: 'var(--color-bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '0', overflow: 'hidden' }}>
                        <div className="modal-header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 className="modal-title" style={{ margin: 0 }}>{FOOTER_CONTENT[activeModal].title}</h3>
                            <button className="btn btn-icon glass-button" onClick={() => setActiveModal(null)}><X size={20} /></button>
                        </div>
                        <div className="modal-body" style={{ padding: '1.5rem', fontSize: '1rem', lineHeight: '1.6', color: 'var(--color-text-secondary)' }}>
                            {FOOTER_CONTENT[activeModal].content}
                        </div>
                        <div className="modal-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn btn-primary" onClick={() => setActiveModal(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PinLoginPage;
