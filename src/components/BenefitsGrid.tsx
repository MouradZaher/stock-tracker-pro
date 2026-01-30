import React from 'react';
import { TrendingUp, Shield, Zap, PieChart, Bell, BarChart3 } from 'lucide-react';

const BenefitsGrid: React.FC = () => {
    const benefits = [
        {
            icon: TrendingUp,
            title: 'Real-Time Market Data',
            description: 'Track S&P 500 stocks with live prices, charts, and comprehensive financial metrics.'
        },
        {
            icon: PieChart,
            title: 'Portfolio Management',
            description: 'Monitor your investments, track performance, and optimize your asset allocation.'
        },
        {
            icon: Zap,
            title: 'AI-Powered Insights',
            description: 'Get smart recommendations based on advanced analysis and market trends.'
        },
        {
            icon: BarChart3,
            title: 'Advanced Analytics',
            description: 'Deep dive into company financials, ratios, and historical performance data.'
        },
        {
            icon: Bell,
            title: 'Custom Watchlists',
            description: 'Create personalized watchlists and stay updated on your favorite stocks.'
        },
        {
            icon: Shield,
            title: 'Institutional Security',
            description: 'Enterprise-grade security with magic link authentication. No passwords needed.'
        }
    ];

    return (
        <div className="hero-visual">
            <div className="benefits-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.75rem',
                padding: '0.5rem'
            }}>
                {benefits.map((benefit, index) => {
                    const Icon = benefit.icon;
                    return (
                        <div
                            key={index}
                            className="benefit-card glass-card"
                            style={{
                                padding: '1.25rem',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--glass-border)',
                                background: 'var(--color-bg-elevated)',
                                transition: 'all 0.3s ease',
                                cursor: 'default'
                            }}
                        >
                            <div
                                className="icon-container"
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'linear-gradient(135deg, var(--color-accent-light) 0%, rgba(124, 58, 237, 0.1) 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '0.75rem'
                                }}
                            >
                                <Icon size={20} color="var(--color-accent)" />
                            </div>
                            <h3 style={{
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                marginBottom: '0.4rem',
                                color: 'var(--color-text-primary)'
                            }}>
                                {benefit.title}
                            </h3>
                            <p style={{
                                fontSize: '0.8rem',
                                color: 'var(--color-text-secondary)',
                                lineHeight: '1.4'
                            }}>
                                {benefit.description}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default BenefitsGrid;
