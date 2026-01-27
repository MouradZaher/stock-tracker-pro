import React, { useEffect, useState } from 'react';

const MarketStatus: React.FC = () => {
    const [cairoTime, setCairoTime] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();

            // Format time for Cairo (EGP)
            const cairoFormatter = new Intl.DateTimeFormat('en-US', {
                timeZone: 'Africa/Cairo',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
            });
            setCairoTime(cairoFormatter.format(now));

            // Check US Market Status (9:30 AM - 4:00 PM ET, Mon-Fri)
            const nyFormatter = new Intl.DateTimeFormat('en-US', {
                timeZone: 'America/New_York',
                hour: 'numeric',
                minute: 'numeric',
                hour12: false,
                weekday: 'long',
            });

            const parts = nyFormatter.formatToParts(now);
            const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
            const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
            const type = parts.find(p => p.type === 'dayPeriod')?.value; // Usually not present in hour24 but good to be safe if changing logic
            const weekday = parts.find(p => p.type === 'weekday')?.value;

            const timeInMinutes = hour * 60 + minute;
            const marketOpen = 9 * 60 + 30; // 9:30 AM
            const marketClose = 16 * 60;    // 4:00 PM

            const isWeekday = weekday !== 'Saturday' && weekday !== 'Sunday';
            const isMarketHours = timeInMinutes >= marketOpen && timeInMinutes < marketClose;

            setIsOpen(isWeekday && isMarketHours);
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isOpen ? 'var(--color-success)' : 'var(--color-text-tertiary)',
                boxShadow: isOpen ? '0 0 8px var(--color-success)' : 'none'
            }} />
            <span>{isOpen ? 'Market Open' : 'Market Closed'}</span>
            <span style={{ color: 'var(--color-text-tertiary)' }}>•</span>
            <span>{cairoTime} (Cairo)</span>
        </div>
    );
};

export default MarketStatus;
