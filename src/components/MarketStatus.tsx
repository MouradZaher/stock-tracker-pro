import React, { useEffect, useState } from 'react';

const MarketStatus: React.FC = () => {
    const [cairoTime, setCairoTime] = useState('');
    const [nyStatus, setNyStatus] = useState({ isOpen: false, rangeEGP: '' });
    const [tokyoStatus, setTokyoStatus] = useState({ isOpen: false, rangeEGP: '' });
    const [hongkongStatus, setHongkongStatus] = useState({ isOpen: false, rangeEGP: '' });
    const [shanghaiStatus, setShanghaiStatus] = useState({ isOpen: false, rangeEGP: '' });
    const [londonStatus, setLondonStatus] = useState({ isOpen: false, rangeEGP: '' });
    const [egyptStatus, setEgyptStatus] = useState({ isOpen: false, rangeEGP: '' });

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();

            // Format current Cairo Time
            const cairoFormatter = new Intl.DateTimeFormat('en-US', {
                timeZone: 'Africa/Cairo',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
            });
            setCairoTime(cairoFormatter.format(now));

            // Helper to check session status
            const getSessionStatus = (tz: string, openH: number, openM: number, closeH: number, closeM: number, isEgypt = false, manualRange = '') => {
                const formatter = new Intl.DateTimeFormat('en-US', {
                    timeZone: tz,
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: false,
                    weekday: 'long',
                });

                const parts = formatter.formatToParts(now);
                const hourPart = parts.find(p => p.type === 'hour')?.value || '0';
                const minutePart = parts.find(p => p.type === 'minute')?.value || '0';
                const hour = parseInt(hourPart);
                const minute = parseInt(minutePart);
                const weekday = parts.find(p => p.type === 'weekday')?.value;

                const timeInMinutes = hour * 60 + minute;
                const openMinutes = openH * 60 + openM;
                const closeMinutes = closeH * 60 + closeM;

                const isWeekend = isEgypt
                    ? (weekday === 'Friday' || weekday === 'Saturday')
                    : (weekday === 'Saturday' || weekday === 'Sunday');

                const isOpen = !isWeekend && timeInMinutes >= openMinutes && timeInMinutes < closeMinutes;

                return {
                    isOpen,
                    rangeEGP: manualRange || "09:00AM - 05:00PM" // Fallback
                };
            };

            setNyStatus(getSessionStatus('America/New_York', 9, 30, 16, 0, false, "04:30PM - 11:00PM"));
            setTokyoStatus(getSessionStatus('Asia/Tokyo', 9, 0, 15, 0, false, "02:00AM - 08:00AM"));
            setHongkongStatus(getSessionStatus('Asia/Hong_Kong', 9, 30, 16, 0, false, "04:30AM - 11:00AM"));
            setShanghaiStatus(getSessionStatus('Asia/Shanghai', 9, 30, 15, 0, false, "04:30AM - 10:00AM"));
            setLondonStatus(getSessionStatus('Europe/London', 8, 0, 16, 30, false, "10:00AM - 06:30PM"));
            setEgyptStatus(getSessionStatus('Africa/Cairo', 10, 0, 14, 30, true, "10:00AM - 02:30PM"));
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    const SessionBadge = ({ name, status }: { name: string, status: { isOpen: boolean, rangeEGP: string } }) => (
        <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            background: status.isOpen
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.05) 100%)'
                : 'rgba(255, 255, 255, 0.02)',
            border: `1px solid ${status.isOpen ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.05)'}`,
            borderRadius: '8px',
            transition: 'all 0.3s ease',
            cursor: 'default',
            whiteSpace: 'nowrap'
        }}>
            <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: status.isOpen ? '#10b981' : 'rgba(255,255,255,0.15)',
                boxShadow: status.isOpen ? '0 0 8px rgba(16, 185, 129, 0.6), 0 0 12px rgba(16, 185, 129, 0.3)' : 'none',
                animation: status.isOpen ? 'pulse-glow 2s ease-in-out infinite' : 'none'
            }} />
            <span style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: status.isOpen ? '#10b981' : 'rgba(255, 255, 255, 0.4)',
                letterSpacing: '0.5px'
            }}>
                {name}
            </span>
            <span style={{
                fontSize: '0.65rem',
                color: status.isOpen ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.3)',
                fontWeight: 500
            }}>
                {status.rangeEGP}
            </span>
        </div>
    );

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 0'
        }}>
            {/* Global Market Sessions */}
            <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <SessionBadge name="EGX" status={egyptStatus} />
                <SessionBadge name="TKY" status={tokyoStatus} />
                <SessionBadge name="HKG" status={hongkongStatus} />
                <SessionBadge name="SHA" status={shanghaiStatus} />
                <SessionBadge name="LND" status={londonStatus} />
                <SessionBadge name="NYC" status={nyStatus} />
            </div>

            {/* Cairo Time Display */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 16px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            }}>
                <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: nyStatus.isOpen ? '#10b981' : '#ef4444',
                    boxShadow: nyStatus.isOpen
                        ? '0 0 10px rgba(16, 185, 129, 0.8), 0 0 20px rgba(16, 185, 129, 0.4)'
                        : '0 0 10px rgba(239, 68, 68, 0.8)',
                    animation: 'pulse-glow 2s ease-in-out infinite'
                }} />
                <span style={{
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: 'var(--color-text-primary)',
                    fontFamily: 'monospace',
                    letterSpacing: '0.5px'
                }}>
                    {cairoTime}
                </span>
                <span style={{
                    color: 'var(--color-accent)',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    letterSpacing: '1px'
                }}>
                    CAIRO
                </span>
            </div>

            <style>{`
                @keyframes pulse-glow {
                    0%, 100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.6;
                        transform: scale(0.9);
                    }
                }
            `}</style>
        </div>
    );
};

export default MarketStatus;
