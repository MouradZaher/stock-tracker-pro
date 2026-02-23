import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useMarket } from '../contexts/MarketContext';
import type { MarketId } from '../contexts/MarketContext';

interface TickerItem {
    symbol: string;
    price: string;
    change: string;
    isPositive: boolean;
}

const TICKER_DATA: Record<MarketId, TickerItem[]> = {
    us: [
        { symbol: 'S&P 500', price: '5,085.60', change: '+0.12%', isPositive: true },
        { symbol: 'AAPL', price: '188.45', change: '+0.25%', isPositive: true },
        { symbol: 'NVDA', price: '785.30', change: '+1.15%', isPositive: true },
        { symbol: 'MSFT', price: '412.50', change: '+0.45%', isPositive: true },
        { symbol: 'NFLX', price: '635.00', change: '+1.50%', isPositive: true },
        { symbol: 'TSLA', price: '185.10', change: '-0.85%', isPositive: false },
        { symbol: 'AMZN', price: '178.35', change: '+0.32%', isPositive: true },
        { symbol: 'GOOGL', price: '146.40', change: '-0.15%', isPositive: false },
        { symbol: 'META', price: '478.15', change: '+0.75%', isPositive: true },
    ],
    egypt: [
        { symbol: 'EGX 30', price: '30,125.40', change: '+0.38%', isPositive: true },
        { symbol: 'COMI', price: '72.50', change: '+1.20%', isPositive: true },
        { symbol: 'HRHO', price: '435.00', change: '+0.65%', isPositive: true },
        { symbol: 'TMGH', price: '56.80', change: '-0.42%', isPositive: false },
        { symbol: 'EAST', price: '28.90', change: '+2.10%', isPositive: true },
        { symbol: 'EFIH', price: '21.30', change: '+0.95%', isPositive: true },
        { symbol: 'EKHO', price: '1.25', change: '-1.18%', isPositive: false },
        { symbol: 'SWDY', price: '32.15', change: '+0.78%', isPositive: true },
        { symbol: 'ORWE', price: '45.60', change: '+0.44%', isPositive: true },
        { symbol: 'PHDC', price: '6.80', change: '-0.29%', isPositive: false },
        { symbol: 'ABUK', price: '52.40', change: '+1.55%', isPositive: true },
        { symbol: 'FWRY', price: '8.45', change: '+3.20%', isPositive: true },
        { symbol: 'CLHO', price: '3.10', change: '-0.64%', isPositive: false },
    ],
    abudhabi: [
        { symbol: 'FTSE ADX', price: '9,845.30', change: '+0.22%', isPositive: true },
        { symbol: 'FAB', price: '13.50', change: '+0.45%', isPositive: true },
        { symbol: 'ADNOC', price: '3.15', change: '+0.96%', isPositive: true },
        { symbol: 'ETISALAT', price: '24.80', change: '+0.32%', isPositive: true },
        { symbol: 'IHC', price: '420.00', change: '+1.80%', isPositive: true },
        { symbol: 'ALDAR', price: '6.25', change: '-0.48%', isPositive: false },
        { symbol: 'ADCB', price: '9.10', change: '+0.55%', isPositive: true },
        { symbol: 'TAQA', price: '3.45', change: '-0.29%', isPositive: false },
        { symbol: 'ADIB', price: '11.20', change: '+0.72%', isPositive: true },
        { symbol: 'MULTIPLY', price: '2.95', change: '+1.37%', isPositive: true },
        { symbol: 'DANA', price: '1.08', change: '-0.92%', isPositive: false },
        { symbol: 'PRESIGHT', price: '4.50', change: '+2.30%', isPositive: true },
    ],
};

const LiveTicker: React.FC = () => {
    const { selectedMarket } = useMarket();
    const items = TICKER_DATA[selectedMarket.id] || TICKER_DATA.us;

    return (
        <div style={{
            width: '100%',
            height: 'clamp(40px, 6vh, 48px)',
            overflow: 'hidden',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            position: 'relative'
        }}>
            <style>
                {`
                @keyframes ticker {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                @keyframes slideDownQuick {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .ticker-content {
                    display: flex;
                    animation: ticker 45s linear infinite;
                    white-space: nowrap;
                }
                .ticker-content:hover {
                    animation-play-state: paused;
                }
                .panel-expansion {
                    animation: slideDownQuick 0.3s ease-out;
                }
                `}
            </style>
            <div className="ticker-content" key={selectedMarket.id}>
                {[...items, ...items, ...items].map((item, index) => (
                    <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-xs)',
                        padding: '0 var(--spacing-lg)',
                        fontSize: 'var(--font-size-sm)',
                        borderRight: '1px solid var(--color-border-light)'
                    }}>
                        <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{item.symbol}</span>
                        <span style={{ color: 'var(--color-text-primary)' }}>{item.price}</span>
                        <span style={{
                            color: item.isPositive ? 'var(--color-success)' : 'var(--color-error)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 600
                        }}>
                            {item.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            {item.change}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LiveTicker;
