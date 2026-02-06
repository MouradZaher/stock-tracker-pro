import React, { useState, useRef, useEffect } from 'react';
import { Shield, Lock, Sun, Moon, User, ArrowRight, UserPlus } from 'lucide-react';
import { usePinAuth } from '../contexts/PinAuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { soundService } from '../services/soundService';
import toast from 'react-hot-toast';
import BenefitsGrid from '../components/BenefitsGrid';
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
                    toast.success('Account created! Welcome to StockTracker Pro.');
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
                            width: '32px',
                            height: '32px',
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

            <div className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">
                        Master the Market <br />
                        <span className="gradient-text">with Precision.</span>
                    </h1>
                    <p className="hero-subtitle">
                        The ultimate dashboard for S&P 500 investors. Real-time insights, automated portfolio tracking, and institutional-grade analytics.
                    </p>

                    <div className="login-form" style={{ marginTop: '0.5rem' }}>
                        {/* Step 1: Username Input */}
                        {mode === 'username' && (
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-text-primary)' }}>
                                    Enter Username
                                </label>
                                <div style={{ display: 'flex', gap: '0.75rem', maxWidth: '320px' }}>
                                    <div style={{ flex: 1, position: 'relative' }}>
                                        <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                                        <input
                                            ref={usernameRef}
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleUsernameSubmit()}
                                            placeholder="Your username..."
                                            style={{
                                                width: '100%',
                                                padding: '14px 14px 14px 42px',
                                                fontSize: '1rem',
                                                fontWeight: 500,
                                                background: 'var(--color-bg-secondary)',
                                                border: `2px solid ${username ? 'var(--color-accent)' : 'var(--color-border)'}`,
                                                borderRadius: 'var(--radius-lg)',
                                                color: 'var(--color-text-primary)',
                                                outline: 'none',
                                                transition: 'all 0.2s ease'
                                            }}
                                        />
                                    </div>
                                    <button
                                        onClick={handleUsernameSubmit}
                                        disabled={isLoading || !username.trim()}
                                        style={{
                                            padding: '14px 20px',
                                            background: 'var(--gradient-primary)',
                                            border: 'none',
                                            borderRadius: 'var(--radius-lg)',
                                            color: 'white',
                                            fontWeight: 600,
                                            cursor: isLoading || !username.trim() ? 'not-allowed' : 'pointer',
                                            opacity: isLoading || !username.trim() ? 0.6 : 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        {isLoading ? '...' : <ArrowRight size={18} />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: PIN Input (Login or Signup) */}
                        {(mode === 'login' || mode === 'signup') && (
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <button
                                        onClick={goBack}
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid var(--glass-border)',
                                            borderRadius: '8px',
                                            padding: '6px 10px',
                                            color: 'var(--color-text-secondary)',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem'
                                        }}
                                    >
                                        ← Back
                                    </button>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                        {mode === 'signup' ? (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <UserPlus size={16} color="var(--color-success)" />
                                                Creating account for <strong style={{ color: 'var(--color-accent)' }}>{username}</strong>
                                            </span>
                                        ) : (
                                            <span>
                                                Logging in as <strong style={{ color: 'var(--color-accent)' }}>{username}</strong>
                                            </span>
                                        )}
                                    </span>
                                </div>

                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-text-primary)' }}>
                                    {mode === 'signup' ? 'Create a 4-Digit PIN' : 'Enter Your PIN'}
                                </label>
                                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-start', maxWidth: '280px' }}>
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
                                            style={{
                                                width: '55px',
                                                height: '60px',
                                                fontSize: '1.75rem',
                                                fontWeight: 700,
                                                textAlign: 'center',
                                                background: 'var(--color-bg-secondary)',
                                                border: `2px solid ${digit ? 'var(--color-accent)' : 'var(--color-border)'}`,
                                                borderRadius: 'var(--radius-lg)',
                                                color: 'var(--color-text-primary)',
                                                outline: 'none',
                                                transition: 'all 0.2s ease',
                                                opacity: isLoading ? 0.6 : 1
                                            }}
                                            onFocus={(e) => e.target.select()}
                                        />
                                    ))}
                                </div>
                                {mode === 'signup' && (
                                    <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                                        Remember this PIN - you'll use it to log in next time.
                                    </p>
                                )}
                            </div>
                        )}

                        <p className="form-note" style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Shield size={12} color="var(--color-success)" />
                            Enterprise-grade security
                        </p>
                    </div>
                </div>

                <BenefitsGrid />
            </div>

            <footer className="landing-footer" style={{ padding: '2rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-tertiary)', borderTop: '1px solid var(--color-border)' }}>
                &copy; {new Date().getFullYear()} StockTracker Pro. Designed for high-frequency insights.
            </footer>
        </div>
    );
};

export default PinLoginPage;
