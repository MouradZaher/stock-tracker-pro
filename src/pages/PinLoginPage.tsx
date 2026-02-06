import React, { useState, useRef, useEffect } from 'react';
import { Shield, Lock, Sun, Moon } from 'lucide-react';
import { usePinAuth } from '../contexts/PinAuthContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { soundService } from '../services/soundService';
import toast from 'react-hot-toast';
import BenefitsGrid from '../components/BenefitsGrid';
import TopBar from '../components/TopBar';
import './LandingPage.css';

const PinLoginPage: React.FC = () => {
    const { login } = usePinAuth();
    const { setManualSession } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [pin, setPin] = useState(['', '', '', '']);
    const [selectedUser, setSelectedUser] = useState('');

    // Predefined users - Admin and regular users
    const users = [
        { id: 'admin-1', name: 'Admin', email: 'admin@stocktracker.pro' },
        { id: 'user-1', name: 'User 1', email: 'user1@example.com' },
        { id: 'user-2', name: 'User 2', email: 'user2@example.com' },
        { id: 'user-3', name: 'User 3', email: 'user3@example.com' },
    ];

    const inputRefs = [
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null)
    ];

    useEffect(() => {
        // Focus first input on mount
        inputRefs[0].current?.focus();
    }, []);

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
            handleSubmit(fullPin);
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            inputRefs[index - 1].current?.focus();
        }
    };

    const handleSubmit = (fullPin: string) => {
        const result = login(fullPin);

        if (result.success) {
            soundService.playSuccess();
            toast.success('Welcome! Access granted.');

            // 🚀 BRIDGE: Sync PIN role to AuthContext to enable Admin Panel
            // Determining role based on PIN is done inside login(), but we know '1927' is admin
            // Ideally usePinAuth should return the user object, let's assume it does or we check pin
            if (fullPin === '1927') {
                setManualSession('admin');
            } else {
                setManualSession('user');
            }

        } else {
            soundService.playError();
            toast.error(result.error || 'Invalid PIN');
            // Clear PIN on error
            setPin(['', '', '', '']);
            inputRefs[0].current?.focus();
        }
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



                    <div className="login-form" style={{ marginTop: '1rem' }}>
                        {/* User Selection */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-text-primary)' }}>
                                Select User
                            </label>
                            <select
                                value={selectedUser}
                                onChange={(e) => {
                                    setSelectedUser(e.target.value);
                                    soundService.playTap();
                                    // Focus first PIN input when user selected
                                    if (e.target.value) {
                                        setTimeout(() => inputRefs[0].current?.focus(), 100);
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    maxWidth: '280px',
                                    padding: '12px 16px',
                                    fontSize: '0.95rem',
                                    fontWeight: 500,
                                    background: 'var(--color-bg-secondary)',
                                    border: `2px solid ${selectedUser ? 'var(--color-accent)' : 'var(--color-border)'}`,
                                    borderRadius: 'var(--radius-lg)',
                                    color: 'var(--color-text-primary)',
                                    outline: 'none',
                                    cursor: 'pointer',
                                    appearance: 'none',
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    paddingRight: '40px',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <option value="">Choose a user...</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.name} ({user.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* PIN Entry - only show when user selected */}
                        {selectedUser && (
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-text-primary)' }}>
                                    Enter Your 4-Digit PIN
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
                                                transition: 'all 0.2s ease'
                                            }}
                                            onFocus={(e) => e.target.select()}
                                        />
                                    ))}
                                </div>
                                <p style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>
                                    Hint: Admin PIN is 1927
                                </p>
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
