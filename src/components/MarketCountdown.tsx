import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Info } from 'lucide-react';
import { useMarket } from '../contexts/MarketContext';

// Market sessions in local market time (Egypt Time UTC+2 equivalents)
// Standard Egypt Time (EET) is UTC+2
const MARKET_SESSIONS: Record<string, { open: number; close: number; days: number[]; label: string }> = {
    us: { open: 15.5, close: 22, days: [1, 2, 3, 4, 5], label: 'Mon-Fri' }, // 9:30-16:00 ET -> ~15:30-22:00 EET
    egypt: { open: 10, close: 14.5, days: [0, 1, 2, 3, 4], label: 'Sun-Thu' }, // 10:00-14:30 EET
    abudhabi: { open: 8, close: 13, days: [0, 1, 2, 3, 4], label: 'Sun-Thu' }, // 10:00-15:00 GST -> 08:00-13:00 EET
};

function formatCountdown(ms: number): string {
    if (ms <= 0) return '00:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const MarketCountdown: React.FC = () => {
    const { selectedMarket } = useMarket();
    const [status, setStatus] = useState<{ label: string; countdown: string; isOpen: boolean }>({ label: '', countdown: '', isOpen: false });
    const [showTooltip, setShowTooltip] = useState(false);

    useEffect(() => {
        const session = MARKET_SESSIONS[selectedMarket?.id || 'us'];
        if (!session) return;

        const tick = () => {
            const now = new Date();
            // Convert everything to Egypt Time (UTC+2)
            const egyptOffset = 2 * 60; // 2 hours in minutes
            const userOffset = -now.getTimezoneOffset(); // in minutes
            const diffMinutes = egyptOffset - userOffset;
            
            const egyptNow = new Date(now.getTime() + diffMinutes * 60000);
            
            const egyptHour = egyptNow.getHours() + egyptNow.getMinutes() / 60 + egyptNow.getSeconds() / 3600;
            const egyptDay = egyptNow.getDay();
            const isWeekday = session.days.includes(egyptDay);

            const isOpen = isWeekday && egyptHour >= session.open && egyptHour < session.close;

            let msToNext: number;
            if (isOpen) {
                // time until close
                const closeMs = (Math.floor(session.close) * 3600 + (session.close % 1) * 60 * 60) * 1000;
                const nowInDayMs = (egyptNow.getHours() * 3600 + egyptNow.getMinutes() * 60 + egyptNow.getSeconds()) * 1000;
                msToNext = closeMs - nowInDayMs;
            } else {
                // time until next open
                const nowInDayMs = (egyptNow.getHours() * 3600 + egyptNow.getMinutes() * 60 + egyptNow.getSeconds()) * 1000;
                let openMs = (Math.floor(session.open) * 3600 + (session.open % 1) * 60 * 60) * 1000;
                
                if (nowInDayMs >= openMs || !isWeekday) {
                    // It's either after open today, or it's a weekend
                    // Simplistic: just show time to 10:00AM tomorrow or until next weekday
                    // A real next-weekday calculation would be better but this covers most cases
                    if (nowInDayMs >= openMs) openMs += 86400000;
                    msToNext = openMs - nowInDayMs;
                } else {
                    msToNext = openMs - nowInDayMs;
                }
            }

            setStatus({
                label: isOpen ? 'Closes in' : 'Opens in',
                countdown: formatCountdown(msToNext),
                isOpen,
            });
        };

        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [selectedMarket]);

    const sessionInfo = MARKET_SESSIONS[selectedMarket.id] || MARKET_SESSIONS.us;
    
    const formatSessionTime = (decimalHour: number) => {
        const h = Math.floor(decimalHour);
        const m = Math.round((decimalHour % 1) * 60);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    if (!status.countdown) return null;

    return (
        <div style={{ position: 'relative' }}>
            <div 
                className={`market-countdown-badge ${status.isOpen ? 'market-open-glow' : ''}`}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 14px',
                    borderRadius: '100px',
                    background: status.isOpen ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${status.isOpen ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255,255,255,0.1)'}`,
                    color: status.isOpen ? '#10B981' : 'var(--color-text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    letterSpacing: '0.01em',
                    boxShadow: status.isOpen ? '0 0 20px rgba(16, 185, 129, 0.25)' : 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'help'
                }}
            >
                <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: status.isOpen ? '#10B981' : '#64748B',
                    boxShadow: status.isOpen ? '0 0 8px #10B981' : 'none'
                }} />
                <span style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ opacity: 0.6, fontSize: '0.65rem' }}>{selectedMarket.shortName.toUpperCase()}</span>
                    <span>{status.label} {status.countdown}</span>
                </span>
            </div>

            {/* Tooltip */}
            {showTooltip && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 12px)',
                    right: 0,
                    width: '260px',
                    background: 'rgba(5, 5, 15, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    zIndex: 2000,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 20px rgba(99, 102, 241, 0.1)',
                    animation: 'slideUp 0.3s ease-out'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                        <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--color-accent)' }}>
                            <Clock size={16} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'white' }}>{selectedMarket.name}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)' }}>MARKET SCHEDULE</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Current Status</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: status.isOpen ? '#10B981' : '#EF4444' }}>
                                {status.isOpen ? '• OPEN' : '• CLOSED'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Session Days</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'white' }}>{sessionInfo.label}</span>
                        </div>
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', marginTop: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <span style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)' }}>Egypt Time (UTC+2)</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.7rem', color: 'white' }}>Session Hours</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-accent)' }}>
                                    {formatSessionTime(sessionInfo.open)} - {formatSessionTime(sessionInfo.close)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .market-open-glow {
                    animation: market-pulse 2s infinite ease-in-out;
                }
                @keyframes market-pulse {
                    0% { box-shadow: 0 0 5px rgba(16, 185, 129, 0.2); border-color: rgba(16, 185, 129, 0.3); }
                    50% { box-shadow: 0 0 15px rgba(16, 185, 129, 0.5); border-color: rgba(16, 185, 129, 0.6); }
                    100% { box-shadow: 0 0 5px rgba(16, 185, 129, 0.2); border-color: rgba(16, 185, 129, 0.3); }
                }
            `}</style>
        </div>
    );
};

export default MarketCountdown;
