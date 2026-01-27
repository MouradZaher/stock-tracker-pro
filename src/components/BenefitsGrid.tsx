import React from 'react';
import { Shield, TrendingUp, CheckCircle, List, Calendar } from 'lucide-react';

const BenefitsGrid: React.FC = () => {
    return (
        <div className="hero-visual">
            <div
                className="visual-card"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '2.5rem'
                }}
            >
                <div className="card-header" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                    <TrendingUp size={20} color="var(--color-accent)" />
                    <span style={{ fontSize: '1.1rem' }}>Included with Premium Access</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', rowGap: '2rem' }}>
                    <div className="benefit-item" style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                        <div style={{ background: 'rgba(57, 255, 20, 0.1)', padding: '10px', borderRadius: '10px', height: '42px', width: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <TrendingUp size={20} color="#39FF14" />
                        </div>
                        <div>
                            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px', lineHeight: '1.2' }}>Real-time Data</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>Live prices & charts for US markets</p>
                        </div>
                    </div>

                    <div className="benefit-item" style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                        <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '10px', borderRadius: '10px', height: '42px', width: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Shield size={20} color="#38bdf8" />
                        </div>
                        <div>
                            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px', lineHeight: '1.2' }}>AI Insights</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>Smart buy/sell signals & analysis</p>
                        </div>
                    </div>

                    <div className="benefit-item" style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                        <div style={{ background: 'rgba(250, 204, 21, 0.1)', padding: '10px', borderRadius: '10px', height: '42px', width: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <CheckCircle size={20} color="#facc15" />
                        </div>
                        <div>
                            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px', lineHeight: '1.2' }}>Portfolio Tracker</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>Track P/L and dividends easily</p>
                        </div>
                    </div>

                    <div className="benefit-item" style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                        <div style={{ background: 'rgba(244, 63, 94, 0.1)', padding: '10px', borderRadius: '10px', height: '42px', width: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <TrendingUp size={20} color="#f43f5e" />
                        </div>
                        <div>
                            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px', lineHeight: '1.2' }}>Market Heatmap</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>Visualize S&P 500 performance</p>
                        </div>
                    </div>

                    <div className="benefit-item" style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                        <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '10px', borderRadius: '10px', height: '42px', width: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <List size={20} color="#a855f7" />
                        </div>
                        <div>
                            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px', lineHeight: '1.2' }}>Smart Watchlists</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>Organize & track favorites</p>
                        </div>
                    </div>

                    <div className="benefit-item" style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '10px', height: '42px', width: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Calendar size={20} color="#10b981" />
                        </div>
                        <div>
                            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px', lineHeight: '1.2' }}>Dividend Calendar</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>Track upcoming payouts</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BenefitsGrid;
