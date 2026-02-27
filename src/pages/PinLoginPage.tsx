import React, { useState, useRef, useEffect } from 'react';
import { Shield, Lock, Sun, Moon, User, ArrowRight, UserPlus, X } from 'lucide-react';
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

        // Enable scrolling for landing page
        document.body.classList.add('landing-scrolling');
        return () => {
            document.body.classList.remove('landing-scrolling');
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
            <nav className="landing-nav" style={{ padding: 'var(--spacing-md) var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
                <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>
                    <div style={{ background: 'var(--gradient-primary)', width: 'var(--spacing-xl)', height: 'var(--spacing-xl)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
                        </svg>
                    </div>
                    <span>StockTracker <span className="gradient-text">Pro</span></span>
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

            <div className="hero-section" style={{ animation: 'fadeIn 0.8s ease-out both' }}>
                <div className="hero-content">
                    <h1 className="hero-title" style={{ animation: 'slideUp 0.8s ease-out 0.2s both' }}>
                        Master the Market <span className="gradient-text">with Precision.</span>
                    </h1>
                    <p className="hero-subtitle" style={{ animation: 'slideUp 0.8s ease-out 0.4s both' }}>
                        The ultimate dashboard for S&P 500 investors. Real-time insights, automated portfolio tracking, and institutional-grade analytics.
                    </p>
                </div>

                <div className="hero-form-container">
                    <div className="login-form-wrapper glass-card">
                        <div className="login-form">
                            {/* Step 1: Username Input */}
                            {mode === 'username' && (
                                <div className="form-step-container">
                                    <label className="form-label">Enter Username</label>
                                    <div className="input-group">
                                        <div className="input-with-icon">
                                            <User size={18} className="input-icon" />
                                            <input
                                                ref={usernameRef}
                                                type="text"
                                                className="form-input landing-input"
                                                placeholder="Your username..."
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
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
                                        >
                                            {isLoading ? '...' : (
                                                <>
                                                    Next
                                                    <ArrowRight size={18} />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: PIN Input (Login or Signup) */}
                            {(mode === 'login' || mode === 'signup') && (
                                <div className="form-step-container">
                                    <div className="form-back-selector">
                                        <button onClick={goBack} className="glass-button back-btn">← Back</button>
                                        <span className="user-indicator">
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

                                    <label className="form-label">
                                        {mode === 'signup' ? 'Create a 4-Digit PIN' : 'Enter Your PIN'}
                                    </label>
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
                                                className="landing-input pin-field"
                                                onFocus={(e) => e.target.select()}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            <p className="form-note">
                                <Shield size={12} color="var(--color-success)" />
                                Enterprise-grade security
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="landing-section benefits-section">
                <div className="section-container">
                    <BenefitsGrid />
                </div>
            </div>

            <div className="landing-section performance-section">
                <div className="section-container">
                    <AIPerformanceTracker />
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

            {activeModal && (
                <div className="modal-overlay glass-blur" onClick={() => setActiveModal(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)' }}>
                    <div className="modal glass-effect" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 'clamp(320px, 90vw, 500px)', width: '90%', background: 'var(--color-bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '0', overflow: 'hidden', boxShadow: 'var(--shadow-xl)' }}>
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

export default PinLoginPage;
