import React, { useState, useEffect } from 'react';
import { Sparkles, Activity, Zap } from 'lucide-react';
import { aiStrategyService } from '../services/aiStrategyService';
import { useMarket } from '../contexts/MarketContext';

/**
 * AIIntelligenceStream
 * A premium, low-profile narrative hub that broadcasts pro-active AI insights.
 * Integrated as part of the "Mega Deep Dive" innovations.
 */
const AIIntelligenceStream: React.FC = () => {
    const { selectedMarket } = useMarket();
    const [insights, setInsights] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const fetchInsights = async () => {
            const data = await aiStrategyService.getNarrativeInsights(selectedMarket.id);
            setInsights(data);
        };
        fetchInsights();
    }, [selectedMarket.id]);

    useEffect(() => {
        if (insights.length === 0) return;

        const interval = setInterval(() => {
            setIsVisible(false);
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % insights.length);
                setIsVisible(true);
            }, 500); // Wait for fade out
        }, 8000); // 8 seconds per insight

        return () => clearInterval(interval);
    }, [insights]);

    if (insights.length === 0) return null;

    return (
        <div className="ai-intelligence-stream-container" style={{ padding: '0.5rem 0.5rem 0.25rem 0.5rem', width: '100%' }}>
            <div className="glass-card noise-texture glass-glow animate-mood-pulse" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem 1rem',
                borderRadius: '12px',
                background: 'var(--glass-bg)',
                backdropFilter: 'var(--glass-blur)',
                WebkitBackdropFilter: 'var(--glass-blur)',
                border: '1px solid var(--color-accent-light)',
                minHeight: '44px',
                overflow: 'hidden'
            }}>
                <div className="stream-icon-container" style={{ color: 'var(--color-accent)', display: 'flex', alignItems: 'center' }}>
                    <Sparkles size={16} className="animate-pulse" />
                </div>
                
                <div className="stream-label" style={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 800, 
                    color: 'var(--color-accent)', 
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                    borderRight: '1px solid var(--color-accent-light)',
                    paddingRight: '0.75rem'
                }}>
                    AI Intelligence
                </div>

                <div className="stream-content" style={{ 
                    flex: 1, 
                    fontSize: '0.875rem', 
                    color: 'var(--color-text-primary)',
                    fontWeight: 500,
                    transition: 'opacity 0.5s ease',
                    opacity: isVisible ? 1 : 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <Zap size={14} style={{ color: 'var(--color-warning)', opacity: 0.8 }} />
                    {insights[currentIndex]}
                </div>

                <div className="stream-stats" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>
                        <Activity size={12} />
                        <span>LIVE</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIIntelligenceStream;
