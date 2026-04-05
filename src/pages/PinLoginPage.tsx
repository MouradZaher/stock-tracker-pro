import React, { useState, useRef, useEffect } from 'react';
import { Shield, Lock, Sun, Moon, User, ArrowRight, X, BarChart3, TrendingUp, Zap, Activity, Globe, Brain, LineChart, Layers, Sparkles, Eye, Target, ChevronRight, Award, Clock, Cpu } from 'lucide-react';
import { usePinAuth } from '../contexts/PinAuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { soundService } from '../services/soundService';
import toast from 'react-hot-toast';

import TopBar from '../components/TopBar';
import './LandingPage.css';
import './PreviewStyles.css';

const PinLoginPage: React.FC = () => {
    const { checkUser, login, register } = usePinAuth();
    const { theme, toggleTheme } = useTheme();

    // Form state
    const [username, setUsername] = useState('');
    const [pin, setPin] = useState(['', '', '', '']);
    const [mode, setMode] = useState<'username' | 'login' | 'signup'>('username');
    const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleCardInteraction = (feature: string) => {
        if (hoveredFeature === feature) {
            setHoveredFeature(null);
        } else {
            setHoveredFeature(feature);
            soundService.playTap();
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
            
            {/* Premium Texture Overlay */}
            <div className="noise-overlay" style={{ opacity: 0.1, mixBlendMode: 'overlay' }}></div>
            
            {/* Background elements */}
            <div className="landing-bg-elements">
                <div className="bg-blob blob-1"></div>
                <div className="bg-blob blob-2"></div>
                <div className="bg-blob blob-3"></div>
            </div>

            <nav className="landing-nav">
                <a href="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: '1.25rem', fontWeight: 700, textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                    <div style={{ background: 'var(--gradient-primary)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Shield size={18} color="white" />
                    </div>
                    <span>StockTracker <span className="gradient-text">Pro</span></span>
                </a>
                <div className="landing-nav-actions">
                    <div className="nav-private-badge">
                        <Lock size={11} />
                        <span>Private Access</span>
                    </div>
                    <button
                        className="theme-toggle-btn"
                        onClick={() => {
                            soundService.playTap();
                            toggleTheme();
                        }}
                        title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
                    >
                        {theme === 'dark'
                            ? <span className="theme-icon theme-icon-sun">☀</span>
                            : <span className="theme-icon theme-icon-moon">☾</span>
                        }
                    </button>
                </div>
            </nav>

            <div className="hero-section">
                {/* Left: Login Sidebar */}
                <div className="login-sidebar">
                    <div className="login-form-wrapper">
                        {/* Header */}
                        <div className="login-header">
                            <div className="login-title-row" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.4rem' }}>
                                <div className="login-shield-icon" style={{ margin: 0 }}>
                                    <Shield size={22} />
                                </div>
                                <h2 className="login-title" style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>
                                    {mode === 'username' ? 'Login / Sign Up' : 'Verify Identity'}
                                </h2>
                            </div>
                            {mode !== 'username' && (
                                <p className="login-subtitle">
                                    Confirming access for: {username}
                                </p>
                            )}
                        </div>

                        <div className="login-form">
                            {/* Step 1: Username Input */}
                            {mode === 'username' && (
                                <div className="form-step-container">
                                    <div className="login-input-wrap">
                                        <div className="login-input-icon"><User size={18} /></div>
                                        <input
                                            ref={usernameRef}
                                            type="text"
                                            className="landing-input login-field"
                                            placeholder="username"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleUsernameSubmit()}
                                            disabled={isLoading}
                                            autoCapitalize="none"
                                            autoComplete="username"
                                        />
                                        <button
                                            onClick={handleUsernameSubmit}
                                            disabled={isLoading || !username.trim()}
                                            className="login-submit-btn"
                                        >
                                            {isLoading ? <span className="login-spinner" /> : <ArrowRight size={18} />}
                                        </button>
                                    </div>
                                    <div className="login-hint">
                                        <Zap size={12} />
                                        <span>Authorized access only</span>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: PIN Input */}
                            {(mode === 'login' || mode === 'signup') && (
                                <div className="form-step-container" style={{ animation: 'slideInUp 0.4s ease-out' }}>
                                    <div className="pin-back-row">
                                        <button onClick={goBack} className="pin-back-btn">←</button>
                                        <span className="pin-username-label">{username}</span>
                                    </div>
                                    <div className="pin-input-group">
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
                                                className="landing-input pin-square-input"
                                                onFocus={(e) => e.target.select()}
                                            />
                                        ))}
                                    </div>
                                    <p className="pin-hint">
                                        {mode === 'signup' ? 'Create a secure 4-digit PIN' : 'Enter your 4-digit security PIN'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Social Footer */}
                    <div className="landing-footer" style={{ marginTop: 'auto', paddingTop: '3rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
                         <a href="https://x.com/stocktrackerpro" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s', padding: '8px 16px', borderRadius: '100px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}>
                             <svg width="12" height="12" viewBox="0 0 1200 1227" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z" />
                             </svg>
                             @stocktrackerpro
                         </a>
                    </div>
                </div>

                {/* Right: Content Showcase — Premium Bento Layout */}
                <div className={`content-showcase ${hoveredFeature ? 'is-previewing' : ''}`}>
                    {/* Full Area Preview Overlay */}
                    {hoveredFeature && (
                        <div className={`sc-full-preview-overlay theme-${hoveredFeature.replace(/\s+/g, '-').toLowerCase()}`}>
                            <div className="preview-scanlines"></div>
                            
                            <div className="full-preview-header">
                                <div className="full-header-left">
                                    <div className="full-preview-rec">
                                        <div className="rec-dot"></div>
                                        <span>LIVE RECORDING</span>
                                    </div>
                                    <h2 className="full-preview-title">{hoveredFeature}</h2>
                                </div>
                                <div className="full-header-right">
                                    <div className="header-meta">
                                        <span className="meta-label">CHANNEL</span>
                                        <span className="meta-value">SECURE FEED 04</span>
                                    </div>
                                    <div className="header-meta">
                                        <span className="meta-label">STABILITY</span>
                                        <span className="meta-value">99.9%</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="full-preview-content">
                                {hoveredFeature === 'AI Command Center' && (
                                    <div className="preview-ai-module">
                                        <div className="module-stats">
                                            <div className="m-stat"><h3>0.08s</h3><span>INFERENCE</span></div>
                                            <div className="m-stat"><h3>L407</h3><span>ENGINE ID</span></div>
                                            <div className="m-stat"><h3>GPT+</h3><span>MODEL</span></div>
                                        </div>
                                        <div className="ai-intelligence-feed">
                                            <div className="ai-row active"><span>{">"} ANALYZING MARKET BREADTH...</span></div>
                                            <div className="ai-row"><span>{">"} SECTOR SCAN COMPLETE: TECH BULLISH</span></div>
                                            <div className="ai-row highlight"><span>{">"} STRATEGY GENERATED: BETA NEUTRAL HYBRID</span></div>
                                        </div>
                                    </div>
                                )}
                                {hoveredFeature === 'Smart Watchlists' && (
                                    <div className="preview-watchlist-module">
                                        <div className="watchlist-tickers">
                                            {[
                                                { s: 'NVDA', p: '942.12', c: '+2.4%' },
                                                { s: 'AAPL', p: '174.55', c: '+0.8%' },
                                                { s: 'MSFT', p: '412.3', c: '+1.2%' },
                                                { s: 'META', p: '492.3', c: '-0.3%' }
                                            ].map((t, i) => (
                                                <div key={i} className="m-ticker-card">
                                                    <div className="m-symbol">{t.s}</div>
                                                    <div className="m-price">${t.p}</div>
                                                    <div className={`m-change ${t.c.startsWith('+') ? 'up' : 'down'}`}>{t.c}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {hoveredFeature === 'Portfolio Engine' && (
                                    <div className="preview-portfolio-module">
                                        <div className="portfolio-analytics-grid">
                                            <div className="p-chart-box">
                                                <div className="p-donut-large"></div>
                                                <div className="p-donut-inner">84%</div>
                                            </div>
                                            <div className="p-metrics">
                                                <div className="p-metric-row"><span>BETA</span> <span>1.04</span></div>
                                                <div className="p-metric-row"><span>ALPHA</span> <span className="up">+0.42</span></div>
                                                <div className="p-metric-row"><span>VAR</span> <span>3.2%</span></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {hoveredFeature === 'Market Pulse' && (
                                    <div className="preview-pulse-module">
                                        <div className="pulse-heatmap-v2">
                                            {[...Array(20)].map((_, i) => (
                                                <div key={i} className="pulse-cell" style={{ opacity: 0.8 - (i * 0.03), background: i % 3 === 0 ? 'var(--emerald-500)' : i % 5 === 0 ? 'var(--rose-500)' : 'var(--slate-700)' }}></div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {hoveredFeature === 'Live Screening' && (
                                    <div className="preview-scanner-module">
                                        <div className="scanner-active-list">
                                            {[
                                                'WHALE FLOW DETECTED - TSLA CALL 200',
                                                'DARK POOL ACTIVITY - MSFT $415 LEVEL',
                                                'SCALPING SIGNAL - ES FUTURES SHORT',
                                                'MOMENTUM SPIKE - SOLANA DEX VOLUME',
                                                'LIQUIDITY SHIFT - BTC-USDT BINANCE'
                                            ].map((msg, i) => (
                                                <div key={i} className="scanner-msg">
                                                    <Activity size={14} />
                                                    <span>{msg}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {hoveredFeature === 'Risk Analytics' && (
                                    <div className="preview-risk-module">
                                        <div className="risk-visual-row">
                                            {[...Array(10)].map((_, i) => (
                                                <div key={i} className="risk-spike" style={{ height: `${20 + (i * 8)}%`, background: i > 7 ? 'var(--rose-500)' : 'var(--violet-500)' }}></div>
                                            ))}
                                        </div>
                                        <div className="risk-level-badge">EXPOSURE: LOW</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className={`showcase-inner ${hoveredFeature ? 'is-blurred' : ''}`}>
                        {/* ── Top: Hero Headline + Live Pulse ─── */}
                    <div className="sc-top-row">
                        <div className="sc-headline">
                            <h1 className="sc-title">
                                Trade Smarter with
                                <span className="gradient-text"> AI-Powered</span> Insights
                            </h1>
                            <p className="sc-subtitle">
                                Real-time analytics, risk management, and sentiment analysis — all in one institutional-grade terminal.
                            </p>
                        </div>
                        <div className="sc-pulse-card">
                            <div className="sc-pulse-dot"></div>
                            <div className="sc-pulse-info">
                                <span className="sc-pulse-label">MARKET STATUS</span>
                                <span className="sc-pulse-value">Live Tracking</span>
                            </div>
                            <Activity size={18} className="sc-pulse-icon" />
                        </div>
                    </div>

                    {/* ── Stats Row ─── */}
                    <div className="sc-stats-row">
                        <div className="sc-stat">
                            <span className="sc-stat-value">50K+</span>
                            <span className="sc-stat-label">Signals / Day</span>
                        </div>
                        <div className="sc-stat-divider"></div>
                        <div className="sc-stat">
                            <span className="sc-stat-value">0.3s</span>
                            <span className="sc-stat-label">Avg Latency</span>
                        </div>
                        <div className="sc-stat-divider"></div>
                        <div className="sc-stat">
                            <span className="sc-stat-value">99.9%</span>
                            <span className="sc-stat-label">Uptime SLA</span>
                        </div>
                        <div className="sc-stat-divider"></div>
                        <div className="sc-stat">
                            <span className="sc-stat-value">24/7</span>
                            <span className="sc-stat-label">Global Coverage</span>
                        </div>
                    </div>

                    {/* ── Bento Benefit Grid 3×2 ─── */}
                    <div className="sc-bento-grid" onMouseLeave={() => setHoveredFeature(null)}>
                        {/* Row 1: AI Command Center (wide) */}
                        <div 
                            className="sc-bento-card sc-bento-wide" 
                            tabIndex={0}
                            onMouseEnter={() => setHoveredFeature('AI Command Center')}
                            onClick={() => handleCardInteraction('AI Command Center')}
                        >
                            <div className="sc-bento-icon-wrap sc-icon-indigo"><Brain size={18} /></div>
                            <div className="sc-bento-body">
                                <h3>AI Command Center</h3>
                                <p>GPT-driven asset analysis, smart picks, and automated strategy recommendations in real-time.</p>
                            </div>
                            <ChevronRight size={14} className="sc-bento-arrow" />
                        </div>

                        {/* Row 2: 2-col */}
                        <div 
                            className="sc-bento-card" 
                            tabIndex={0}
                            onMouseEnter={() => setHoveredFeature('Smart Watchlists')}
                            onClick={() => handleCardInteraction('Smart Watchlists')}
                        >
                            <div className="sc-bento-icon-wrap sc-icon-emerald"><TrendingUp size={18} /></div>
                            <div className="sc-bento-body">
                                <h3>Smart Watchlists</h3>
                                <p>Track sectors, set alerts, and monitor momentum shifts instantly.</p>
                            </div>
                            <ChevronRight size={14} className="sc-bento-arrow" />
                        </div>

                        <div 
                            className="sc-bento-card" 
                            tabIndex={0}
                            onMouseEnter={() => setHoveredFeature('Portfolio Engine')}
                            onClick={() => handleCardInteraction('Portfolio Engine')}
                        >
                            <div className="sc-bento-icon-wrap sc-icon-amber"><Layers size={18} /></div>
                            <div className="sc-bento-body">
                                <h3>Portfolio Engine</h3>
                                <p>Correlation matrices, risk scoring, and diversification grading.</p>
                            </div>
                            <ChevronRight size={14} className="sc-bento-arrow" />
                        </div>

                        {/* Row 3: Market Pulse + Live Screening side-by-side */}
                        <div 
                            className="sc-bento-card" 
                            tabIndex={0}
                            onMouseEnter={() => setHoveredFeature('Market Pulse')}
                            onClick={() => handleCardInteraction('Market Pulse')}
                        >
                            <div className="sc-bento-icon-wrap sc-icon-rose"><Activity size={18} /></div>
                            <div className="sc-bento-body">
                                <h3>Market Pulse</h3>
                                <p>Breadth analytics, global sentiment, and sector rotation heat maps.</p>
                            </div>
                            <ChevronRight size={14} className="sc-bento-arrow" />
                        </div>

                        <div 
                            className="sc-bento-card" 
                            tabIndex={0}
                            onMouseEnter={() => setHoveredFeature('Live Screening')}
                            onClick={() => handleCardInteraction('Live Screening')}
                        >
                            <div className="sc-bento-icon-wrap sc-icon-cyan"><Eye size={18} /></div>
                            <div className="sc-bento-body">
                                <h3>Live Screening</h3>
                                <p>Multi-timeframe scanners with institutional flow detection.</p>
                            </div>
                            <ChevronRight size={14} className="sc-bento-arrow" />
                        </div>

                        {/* Row 4: New ─ Risk Analytics (wide) */}
                        <div 
                            className="sc-bento-card sc-bento-wide" 
                            tabIndex={0}
                            onMouseEnter={() => setHoveredFeature('Risk Analytics')}
                            onClick={() => handleCardInteraction('Risk Analytics')}
                        >
                            <div className="sc-bento-icon-wrap sc-icon-violet"><BarChart3 size={18} /></div>
                            <div className="sc-bento-body">
                                <h3>Risk Analytics</h3>
                                <p>VaR modeling, drawdown analysis, and live volatility scoring across all your positions.</p>
                            </div>
                            <ChevronRight size={14} className="sc-bento-arrow" />
                        </div>
                    </div>

                    {/* ── Trust Row ─── */}
                    <div className="sc-trust-row">
                        <div className="sc-trust-item">
                            <Shield size={14} className="sc-trust-icon-blue" />
                            <span>Bank-Grade Encryption</span>
                        </div>
                        <div className="sc-trust-item">
                            <Award size={14} className="sc-trust-icon-gold" />
                            <span>SOC 2 Compliant</span>
                        </div>
                        <div className="sc-trust-item">
                            <Globe size={14} className="sc-trust-icon-cyan" />
                            <span>Multi-Region Infra</span>
                        </div>
                        <div className="sc-trust-item">
                            <Cpu size={14} className="sc-trust-icon-purple" />
                            <span>Edge Computing</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        </div>
    );
};

export default PinLoginPage;

