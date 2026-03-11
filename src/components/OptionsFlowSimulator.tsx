import React from 'react';
import { Zap, TrendingUp, TrendingDown, Target, MousePointerClick } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface OptionsTrade {
    symbol: string;
    type: 'CALL' | 'PUT';
    strike: number;
    expiry: string;
    value: number;
    sentiment: 'Bullish' | 'Bearish';
    details: string;
}

const MOCK_FLOW: OptionsTrade[] = [
    { symbol: 'SPY', type: 'CALL', strike: 620, expiry: 'Mar 20', value: 4500000, sentiment: 'Bullish', details: 'Institutional Sweep near the ask' },
    { symbol: 'TSLA', type: 'PUT', strike: 220, expiry: 'Mar 20', value: 890000, sentiment: 'Bearish', details: 'Block Trade detected' },
    { symbol: 'AAPL', type: 'CALL', strike: 250, expiry: 'Apr 17', value: 1200000, sentiment: 'Bullish', details: 'Unusual Out-of-the-money Activity' },
    { symbol: 'NVDA', type: 'CALL', strike: 160, expiry: 'Mar 13', value: 5600000, sentiment: 'Bullish', details: 'Whale Alert: Multi-leg transaction' },
];

const OptionsFlowSimulator: React.FC = () => {
    return (
        <div className="flex flex-column gap-3">
            <div className="flex align-items-center justify-content-between mb-2">
                <div className="flex align-items-center gap-2">
                    <Zap size={18} className="text-yellow-400" />
                    <h3 className="m-0 text-sm font-bold uppercase tracking-wider text-slate-400">Institutional Flow</h3>
                </div>
                <div className="flex align-items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-slate-500">LIVE FEED</span>
                </div>
            </div>

            {MOCK_FLOW.map((trade, i) => (
                <div key={i} className="glass-card p-3 animate-in fade-in duration-500" style={{ borderRadius: '16px', background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex align-items-center justify-content-between">
                        <div className="flex align-items-center gap-2">
                            <span className="text-sm font-black text-white">{trade.symbol}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${trade.type === 'CALL' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {trade.strike} {trade.type}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold">{trade.expiry}</span>
                        </div>
                        <div className={`text-xs font-black ${trade.sentiment === 'Bullish' ? 'text-green-400' : 'text-red-400'}`}>
                            {formatCurrency(trade.value)}
                        </div>
                    </div>
                    
                    <div className="flex align-items-center gap-2 mt-2">
                        <div className={`p-1 rounded bg-slate-800 ${trade.sentiment === 'Bullish' ? 'text-green-500' : 'text-red-500'}`}>
                            {trade.sentiment === 'Bullish' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        </div>
                        <p className="m-0 text-[10px] text-slate-400 font-medium italic">"{trade.details}"</p>
                    </div>
                </div>
            ))}

            <div className="p-3 bg-blue-600/10 border border-blue-600/20 rounded-xl flex align-items-center justify-content-center gap-2 text-blue-400 cursor-pointer hover:bg-blue-600/20 transition-all mt-2">
                <Target size={14} />
                <span className="text-xs font-bold">SCAN FOR SMART MONEY</span>
            </div>
        </div>
    );
};

export default OptionsFlowSimulator;
