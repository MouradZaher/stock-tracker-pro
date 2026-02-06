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

                    <div className="login-form" style={{ marginTop: '0.5rem', minHeight: '200px' }}>
                        {/* Step 1: Username Input */}
                        {mode === 'username' && (
                            <div className="form-step-container" style={{ animation: 'fadeIn 0.3s ease' }}>
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
                                            className="landing-input"
                                            style={{ paddingLeft: '42px' }}
                                        />
                                    </div>
                                    <button
                                        onClick={handleUsernameSubmit}
                                        disabled={isLoading || !username.trim()}
                                        className="btn btn-primary"
                                        style={{ padding: '0 20px', borderRadius: 'var(--radius-lg)' }}
                                    >
                                        {isLoading ? '...' : <ArrowRight size={18} />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: PIN Input (Login or Signup) */}
                        {(mode === 'login' || mode === 'signup') && (
                            <div className="form-step-container" style={{ animation: 'fadeIn 0.3s ease' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                    <button
                                        onClick={goBack}
                                        className="glass-button"
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid var(--glass-border)',
                                            borderRadius: '8px',
                                            padding: '4px 10px',
                                            color: 'var(--color-text-secondary)',
                                            cursor: 'pointer',
                                            fontSize: '0.75rem'
                                        }}
                                    >
                                        ← Back
                                    </button>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {mode === 'signup' ? (
                                            <>
                                                <UserPlus size={14} color="var(--color-success)" style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                                New: <strong style={{ color: 'var(--color-accent)' }}>{username}</strong>
                                            </>
                                        ) : (
                                            <>
                                                User: <strong style={{ color: 'var(--color-accent)' }}>{username}</strong>
                                            </>
                                        )}
                                    </span>
                                </div>

                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
                                    {mode === 'signup' ? 'Create a 4-Digit PIN' : 'Enter Your PIN'}
                                </label>
                                <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-start' }}>
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
                                            style={{
                                                width: '50px',
                                                height: '55px',
                                                fontSize: '1.5rem',
                                                textAlign: 'center',
                                                padding: 0
                                            }}
                                            onFocus={(e) => e.target.select()}
                                        />
                                    ))}
                                </div>
                                {mode === 'signup' && (
                                    <p style={{ marginTop: '0.4rem', fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>
                                        Create your PIN for next time.
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
