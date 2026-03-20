import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useMarket } from '../contexts/MarketContext';

// Market sessions in UTC offset (hours)
const MARKET_SESSIONS: Record<string, { open: number; close: number; tz: string; days: number[] }> = {
    us: { open: 14.5, close: 21, tz: 'EST', days: [1, 2, 3, 4, 5] },
    egypt: { open: 8, close: 14.5, tz: 'EET', days: [0, 1, 2, 3, 4] }, // Sun-Thu
    abudhabi: { open: 6, close: 12, tz: 'GST', days: [0, 1, 2, 3, 4] },
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

    useEffect(() => {
        const session = MARKET_SESSIONS[selectedMarket?.id || 'us'];
        if (!session) return;

        const tick = () => {
            const now = new Date();
            const utcHour = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
            const dayOfWeek = now.getUTCDay();
            const isWeekday = session.days.includes(dayOfWeek);

            const isOpen = isWeekday && utcHour >= session.open && utcHour < session.close;

            let msToNext: number;
            if (isOpen) {
                // time until close
                const closeMs = session.close * 3600000;
                const nowMs = (now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds()) * 1000;
                msToNext = closeMs - nowMs;
            } else {
                // time until next open
                const nowMs = (now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds()) * 1000;
                let openMs = session.open * 3600000;
                if (nowMs >= openMs) openMs += 86400000; // next day
                msToNext = openMs - nowMs;
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

    if (!status.countdown) return null;

    return (
        <div 
            className={`market-countdown-badge ${status.isOpen ? 'market-open-glow' : ''}`}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '100px',
                background: status.isOpen ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${status.isOpen ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)'}`,
                color: status.isOpen ? 'var(--color-success)' : 'var(--color-text-tertiary)',
                fontSize: '0.8rem',
                fontWeight: 800,
                letterSpacing: '0.02em',
                boxShadow: status.isOpen ? '0 0 15px rgba(16, 185, 129, 0.2)' : 'none',
                transition: 'all 0.5s ease',
                fontFamily: 'JetBrains Mono, monospace',
            }}
        >
            <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: status.isOpen ? 'var(--color-success)' : 'currentColor',
                boxShadow: status.isOpen ? '0 0 8px var(--color-success)' : 'none'
            }} />
            <span style={{ whiteSpace: 'nowrap' }}>
                {selectedMarket.shortName}: {status.label} {status.countdown}
            </span>

            <style>{`
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
