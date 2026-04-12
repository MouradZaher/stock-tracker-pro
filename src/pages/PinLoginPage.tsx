import React, { useState, useRef, useEffect } from 'react';
import { Shield, Lock, Sun, Moon, User, ArrowRight, Activity, Brain, TrendingUp, Layers, Eye, BarChart3, Zap, Globe, Cpu, Award } from 'lucide-react';
import { usePinAuth } from '../contexts/PinAuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { soundService } from '../services/soundService';
import toast from 'react-hot-toast';

import './LandingPage.css';

const PinLoginPage: React.FC = () => {
    const { checkUser, login, register } = usePinAuth();
    const { theme, toggleTheme } = useTheme();

    const [username, setUsername] = useState('');
    const [pin, setPin] = useState(['', '', '', '']);
    const [mode, setMode] = useState<'username' | 'login' | 'signup'>('username');
    const [isLoading, setIsLoading] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
        return () => clearInterval(timer);
    }, []);

    const inputRefs = [
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null)
    ];
    const usernameRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        usernameRef.current?.focus();
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const handleUsernameSubmit = async () => {
        if (!username.trim()) return toast.error('ENTER USERNAME');
        setIsLoading(true);
        soundService.playTap();
        try {
            const result = await checkUser(username.trim());
            if (result.exists) {
                setMode('login');
                toast.success(`ID_CONFIRMED: ${username}`);
            } else {
                setMode('signup');
                toast(`NEW_ENTITY: CREATE PIN`, { icon: '🔑' });
            }
            setTimeout(() => inputRefs[0].current?.focus(), 150);
        } catch (err) {
            toast.error('AUTH_SYNC_ERROR');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePinChange = (index: number, value: string) => {
        if (value && !/^\d$/.test(value)) return;
        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);
        if (value && index < 3) inputRefs[index + 1].current?.focus();
        if (index === 3 && value) handlePinSubmit(newPin.join(''));
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) inputRefs[index - 1].current?.focus();
    };

    const handlePinSubmit = async (fullPin: string) => {
        if (fullPin.length !== 4) return;
        setIsLoading(true);
        try {
            if (mode === 'signup') {
                const result = await register(username.trim(), fullPin);
                if (result.success) {
                    soundService.playSuccess();
                    toast.success('SYNC_SUCCESS. AWAITING_APPROVAL.', { duration: 5000 });
                    setMode('username');
                    setUsername('');
                    usernameRef.current?.focus();
                } else {
                    soundService.playError();
                    toast.error('REGISTRATION_DENIED');
                    resetPin();
                }
            } else {
                const result = await login(username.trim(), fullPin);
                if (result.success) {
                    soundService.playSuccess();
                    toast.success('ACCESS_GRANTED');
                } else {
                    soundService.playError();
                    toast.error('INVALID_PIN');
                    resetPin();
                }
            }
        } catch (err) {
            soundService.playError();
            toast.error('COMM_FAILURE');
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

    // Digital Rain Generator
    const rainColumns = 40;
    const generateRain = () => {
        return Array.from({ length: rainColumns }).map((_, i) => (
            <div key={i} className="rain-column" style={{ 
                animationDuration: `${2 + Math.random() * 5}s`,
                animationDelay: `${Math.random() * 5}s`
            }}>
                {Array.from({ length: 20 }).map((_, j) => (
                    <span key={j}>{Math.random() > 0.5 ? '1' : '0'}</span>
                ))}
            </div>
        ));
    };

    return (
        <div className="terminal-login-root" data-theme={theme}>
            <div className="noise-overlay"></div>
            <div className="atmosphere-blobs">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
            </div>
            
            <div className="terminal-rain">
                {generateRain()}
            </div>

            <div className="login-topbar">
                <div className="topbar-left">
                    <div className="brand">
                        <Shield size={12} className="brand-icon" />
                        <span>PRE_ACCESS_GATEWAY_v5.4</span>
                    </div>
                    <div className="status-indicator">
                        <div className="status-dot"></div>
                        <span>LINK: ACTIVE</span>
                    </div>
                </div>
                <div className="topbar-center">
                    <span className="terminal-time">{currentTime}</span>
                </div>
                <div className="topbar-right">
                    <div className="nav-private-badge">
                        <Lock size={10} />
                        <span>SECURE_SESSION</span>
                    </div>
                    <button className="theme-toggle" onClick={() => { soundService.playTap(); toggleTheme(); }}>
                        {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
                    </button>
                </div>
            </div>

            <div className="login-workspace">
                {/* 1. AUTH TERMINAL (Main Focus) */}
                <div className="login-window auth-terminal">
                    <div className="window-header">
                        <div className="header-dots">
                            <div className="dot red"></div>
                            <div className="dot yellow"></div>
                            <div className="dot green"></div>
                        </div>
                        <span className="window-title">IDENT_MODULE</span>
                    </div>
                    <div className="window-content">
                        <div className="auth-form-container">
                            <div className="form-header">
                                <h2 className="glitch-text">{mode === 'username' ? "LOG_IN" : "VERIFY_PIN"}</h2>
                                <p className="auth-meta">SYSTEM_SYNC: ENCRYPTED</p>
                            </div>

                            {mode === 'username' ? (
                                <div className="input-group-terminal">
                                    <div className="input-prefix"><User size={16} /></div>
                                    <input
                                        ref={usernameRef}
                                        type="text"
                                        className="terminal-text-input"
                                        placeholder="USERNAME"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleUsernameSubmit()}
                                        disabled={isLoading}
                                    />
                                    <button className="terminal-arrow-btn" onClick={handleUsernameSubmit} disabled={isLoading || !username.trim()}>
                                        <ArrowRight size={18} />
                                    </button>
                                </div>
                            ) : (
                                <div className="pin-auth-container">
                                    <div className="id-badge">
                                        <span className="label">ID:</span>
                                        <span className="value">{username}</span>
                                        <button className="change-btn" onClick={goBack}>[RESET]</button>
                                    </div>
                                    <div className="pin-grid">
                                        {pin.map((digit, index) => (
                                            <input
                                                key={index}
                                                ref={inputRefs[index]}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                className="pin-box"
                                                value={digit}
                                                onChange={(e) => handlePinChange(index, e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(index, e)}
                                                disabled={isLoading}
                                            />
                                        ))}
                                    </div>
                                    <p className="terminal-hint">SECURE_PIN_REQUIRED</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. FEATURE STATUS WINDOW 1 (NATIVE SCREENER & DATA) */}
                <div className="login-window intelligence-monitor">
                    <div className="window-header">
                        <span className="window-title">DATA_CORE_ENGINE</span>
                        <div className="window-actions"><Cpu size={12} /></div>
                    </div>
                    <div className="window-content status-feature-list">
                        <div className="feature-row">
                            <div className="icon-wrap accent"><BarChart3 size={16} /></div>
                            <div className="feature-info">
                                <h3>NATIVE_SCREENER</h3>
                                <p>INSTITUTIONAL_FILTER_V2</p>
                            </div>
                        </div>
                        <div className="feature-row">
                            <div className="icon-wrap blue"><Globe size={16} /></div>
                            <div className="feature-info">
                                <h3>GLOBAL_HEATMAPS</h3>
                                <p>EGX_ADX_US_COVERAGE</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. FEATURE STATUS WINDOW 2 (AI & NEWS) */}
                <div className="login-window sc-features-node">
                    <div className="window-header">
                        <span className="window-title">EXT_INTEL_STREAMS</span>
                        <div className="window-actions"><Zap size={12} /></div>
                    </div>
                    <div className="window-content status-feature-list">
                        <div className="feature-row">
                            <div className="icon-wrap accent"><Brain size={16} /></div>
                            <div className="feature-info">
                                <h3>AI_COMMAND_CENTER</h3>
                                <p>PREDICTIVE_MARKET_ALPHA</p>
                            </div>
                        </div>
                        <div className="feature-row">
                            <div className="icon-wrap blue"><Activity size={16} /></div>
                            <div className="feature-info">
                                <h3>LIVE_NEWS_FEED</h3>
                                <p>REAL_TIME_INSTITUTIONAL_PULSE</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. PERFORMANCE & STABILITY (Bottom Grid Silhouette) */}
                <div className="login-window terminal-mini-grid" style={{ gridColumn: 'span 2', height: '100px' }}>
                    <div className="window-header">
                        <span className="window-title">TERMINAL_DIAGNOSTICS</span>
                    </div>
                    <div className="window-content" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                        <div className="diag-item">
                            <span style={{ fontSize: '1.2rem', fontWeight: 900 }}>0.1s</span>
                            <p style={{ fontSize: '0.5rem', color: '#444' }}>LATENCY</p>
                        </div>
                        <div className="diag-item">
                            <span style={{ fontSize: '1.2rem', fontWeight: 900 }}>99%</span>
                            <p style={{ fontSize: '0.5rem', color: '#444' }}>UPTIME</p>
                        </div>
                        <div className="diag-item">
                            <Award size={20} color="var(--color-accent)" />
                            <p style={{ fontSize: '0.5rem', color: '#444' }}>SOC2_SECURE</p>
                        </div>
                    </div>
                </div>

            </div>

            <div className="login-footer-terminal">
                <a href="https://x.com/stocktrackerpro" target="_blank" rel="noopener noreferrer" className="footer-link">
                    @STOCKTRACKERPRO_ENCRYPTED_FEED
                </a>
            </div>
        </div>
    );
};

export default PinLoginPage;
