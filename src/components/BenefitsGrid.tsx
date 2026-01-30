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
\u003cdiv className = "hero-visual"\u003e
\u003cdiv className = "benefits-grid" style = {{
    display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
                padding: '1rem'
}}\u003e
{
    benefits.map((benefit, index) =\u003e {
        const Icon = benefit.icon;
        return(
            \u003cdiv
                            key = { index }
                            className = "benefit-card glass-card"
                            style = {{
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--glass-border)',
                background: 'var(--color-bg-elevated)',
                transition: 'all 0.3s ease',
                cursor: 'default'
                            }}
        \u003e
        \u003cdiv
                                className = "icon-container"
                                style = {{
        width: '48px',
        height: '48px',
        borderRadius: 'var(--radius-md)',
        background: 'linear-gradient(135deg, var(--color-accent-light) 0%, rgba(124, 58, 237, 0.1) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1rem'
    }}
\u003e
\u003cIcon size = { 24} color = "var(--color-accent)" /\u003e
\u003c / div\u003e
\u003ch3 style = {{
    fontSize: '1.1rem',
        fontWeight: 600,
            marginBottom: '0.5rem',
                color: 'var(--color-text-primary)'
}}\u003e
{ benefit.title }
\u003c / h3\u003e
\u003cp style = {{
    fontSize: '0.9rem',
        color: 'var(--color-text-secondary)',
            lineHeight: '1.6'
}}\u003e
{ benefit.description }
\u003c / p\u003e
\u003c / div\u003e
                    );
                })}
\u003c / div\u003e
\u003c / div\u003e
    );
};

export default BenefitsGrid;
