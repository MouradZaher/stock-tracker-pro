import React, { useEffect, useState } from 'react';

const MarketStatus: React.FC = () => {
    const [cairoTime, setCairoTime] = useState('');
    const [nyStatus, setNyStatus] = useState({ isOpen: false, rangeEGP: '' });
    const [tokyoStatus, setTokyoStatus] = useState({ isOpen: false, rangeEGP: '' });
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
            const getSessionStatus = (tz: string, openH: number, openM: number, closeH: number, closeM: number, isEgypt = false) => {
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

                // Calculate EGP Range
                const getEGPTime = (h: number, m: number) => {
                    // Use a specific date in the local timezone and convert to Cairo
                    const localDateStr = now.toLocaleString('en-US', { timeZone: tz });
                    const localDateParsed = new Date(localDateStr);
                    localDateParsed.setHours(h, m, 0, 0);

                    // Find offset difference between TZ and Cairo
                    const cairoDateStr = now.toLocaleString('en-US', { timeZone: 'Africa/Cairo' });
                    const cairoDate = new Date(cairoDateStr);
                    const offsetDiff = (cairoDate.getTime() - localDateParsed.getTime()) / (1000 * 60 * 60);

                    const egpHour = (h + Math.floor(offsetDiff)) % 24;
                    const egpMin = m + (offsetDiff % 1 * 60);

                    const formatTime = (hh: number, mm: number) => {
                        const hFixed = (hh + 24) % 24;
                        const period = hFixed >= 12 ? 'PM' : 'AM';
                        const h12 = hFixed % 12 || 12;
                        return `${h12}:${mm.toString().padStart(2, '0')}${period}`;
                    };

                    return formatTime(egpHour, egpMin);
                };

                return {
                    isOpen,
                    rangeEGP: `${getEGPTime(openH, openM)} - ${getEGPTime(closeH, closeM)}`
                };
            };

            setNyStatus(getSessionStatus('America/New_York', 9, 30, 16, 0));
            setTokyoStatus(getSessionStatus('Asia/Tokyo', 9, 0, 15, 0));
            setLondonStatus(getSessionStatus('Europe/London', 8, 0, 16, 30));
            setEgyptStatus(getSessionStatus('Africa/Cairo', 10, 0, 14, 30, true));
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    const SessionBadge = ({ name, status }: { name: string, status: { isOpen: boolean, rangeEGP: string } }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem' }}>
            <span style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                backgroundColor: status.isOpen ? 'var(--color-success)' : 'rgba(255,255,255,0.1)'
            }} />
            <span style={{ color: status.isOpen ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>
                {name}: {status.rangeEGP}
            </span>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap', overflowX: 'auto', maxWidth: '300px', scrollbarWidth: 'none' }}>
                <SessionBadge name="EGX" status={egyptStatus} />
                <SessionBadge name="TKY" status={tokyoStatus} />
                <SessionBadge name="LND" status={londonStatus} />
                <SessionBadge name="NYC" status={nyStatus} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: nyStatus.isOpen ? 'var(--color-success)' : 'var(--color-error)',
                    boxShadow: nyStatus.isOpen ? '0 0 8px var(--color-success)' : 'none'
                }} />
                <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{cairoTime}</span>
                <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.65rem' }}>CAIRO</span>
            </div>
        </div>
    );
};

export default MarketStatus;
