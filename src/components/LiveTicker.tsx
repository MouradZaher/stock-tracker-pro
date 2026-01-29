import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const TICKER_DATA = [
    { symbol: 'S&P 500', price: '5,892.41', change: '+0.45%', isUp: true },
    { symbol: 'NASDAQ', price: '19,258.42', change: '+0.82%', isUp: true },
    { symbol: 'DJIA', price: '43,729.11', change: '-0.12%', isUp: false },
    { symbol: 'AAPL', price: '234.12', change: '+1.20%', isUp: true },
    { symbol: 'NVDA', price: '145.67', change: '+2.45%', isUp: true },
    { symbol: 'TSLA', price: '321.05', change: '-1.50%', isUp: false },
    { symbol: 'BTC', price: '98,432.10', change: '+3.10%', isUp: true },
    { symbol: 'ETH', price: '3,421.55', change: '+1.85%', isUp: true },
];

const LiveTicker: React.FC = () => {
    return (
        <div className="ticker-wrapper">
            <div className="ticker-content">
                {[...TICKER_DATA, ...TICKER_DATA].map((item, index) => (
                    <div key={index} className="ticker-item">
                        <span className="ticker-symbol">{item.symbol}</span>
                        <span className="ticker-price">{item.price}</span>
                        <span className={`ticker-change ${item.isUp ? 'positive' : 'negative'}`}>
                            {item.isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {item.change}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LiveTicker;
