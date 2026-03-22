import React, { useState, useEffect, useRef } from 'react';
import { Zap, TrendingUp, TrendingDown, Target, MousePointerClick, Activity, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import CompanyLogo from './CompanyLogo';

interface OptionsTrade {
    id: string;
    symbol: string;
    type: 'CALL' | 'PUT';
    strike: number;
    expiry: string;
    value: number;
    sentiment: 'Bullish' | 'Bearish';
    details: string;
    timestamp: number;
}

const INITIAL_FLOW: OptionsTrade[] = [
    { id: '1', symbol: 'SPY', type: 'CALL', strike: 620, expiry: 'Mar 20', value: 4500000, sentiment: 'Bullish', details: 'Institutional Sweep near the ask', timestamp: Date.now() - 5000 },
    { id: '2', symbol: 'TSLA', type: 'PUT', strike: 220, expiry: 'Mar 20', value: 890000, sentiment: 'Bearish', details: 'Block Trade detected', timestamp: Date.now() - 15000 },
    { id: '3', symbol: 'AAPL', type: 'CALL', strike: 250, expiry: 'Apr 17', value: 1200000, sentiment: 'Bullish', details: 'Unusual Out-of-the-money Activity', timestamp: Date.now() - 30000 },
    { id: '4', symbol: 'NVDA', type: 'CALL', strike: 160, expiry: 'Mar 13', value: 5600000, sentiment: 'Bullish', details: 'Whale Alert: Multi-leg transaction', timestamp: Date.now() - 45000 },
];

const SYMBOLS = ['AMD', 'META', 'GOOGL', 'MSFT', 'AMZN', 'NFLX', 'COIN', 'MSTR', 'SMCI', 'AVGO'];
const DETAILS = [
    'Golden Sweep: Above Ask',
    'Opening Transaction: Large Print',
    'Gamma Hedge: Systematic Flow',
    'Dark Pool Activity: Delayed Print',
    'Aggressive Ask Side Pressure',
    'Institutional Block: Unusual Vol',
    'Earnings Front-run Detection',
    'Long-term LEAP Accumulation'
];

const OptionsFlowSimulator: React.FC = () => {
    const [trades, setTrades] = useState<OptionsTrade[]>(INITIAL_FLOW);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Simulate real-time flow
    useEffect(() => {
        const interval = setInterval(() => {
            const randomSymbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
            const randomType = Math.random() > 0.6 ? 'CALL' : 'PUT';
            const randomSentiment = randomType === 'CALL' ? 'Bullish' : 'Bearish';
            const randomValue = Math.floor(Math.random() * 5000000) + 100000;
            const randomDetail = DETAILS[Math.floor(Math.random() * DETAILS.length)];
            
            const newTrade: OptionsTrade = {
                id: Math.random().toString(36).substr(2, 9),
                symbol: randomSymbol,
                type: randomType,
                strike: Math.floor(Math.random() * 500) + 50,
                expiry: 'Apr 17',
                value: randomValue,
                sentiment: randomSentiment,
                details: randomDetail,
                timestamp: Date.now()
            };

            setTrades(prev => [newTrade, ...prev.slice(0, 5)]); // Keep last 6 trades
        }, 7000); // New trade every 7s

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-column gap-4">
            {/* Header Section */}
            <div className="flex align-items-center justify-content-between">
                <div className="flex align-items-center gap-2">
                    <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                        <Activity size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="m-0 text-sm font-black uppercase tracking-[0.1em] text-white">Institutional Flow</h3>
                        <div className="flex align-items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live HFT Feed</span>
                        </div>
                    </div>
                </div>
                <div className="flex align-items-center gap-3">
                    <div className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 flex align-items-center gap-2">
                        <ShieldCheck size={10} /> ENCRYPTED
                    </div>
                </div>
            </div>

            {/* Trades List */}
            <div className="flex flex-column gap-2 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar" ref={scrollRef}>
                {trades.map((trade) => (
                    <div 
                        key={trade.id} 
                        className={`glass-card p-3 animate-in slide-in-from-right-4 fade-in duration-700 relative overflow-hidden group hover:bg-white/[0.04] transition-all cursor-crosshair ${trade.timestamp > Date.now() - 2000 ? 'flash-up border-blue-500/40' : 'border-white/5'}`} 
                        style={{ borderRadius: '16px' }}
                    >
                        {/* Background subtle glow for new entries */}
                        {trade.timestamp > Date.now() - 2000 && (
                            <div className="absolute inset-0 bg-blue-500/5 animate-pulse pointer-events-none" />
                        )}

                        <div className="flex align-items-center justify-content-between relative z-10">
                            <div className="flex align-items-center gap-3">
                                <div className="p-1.5 bg-white/5 rounded-lg border border-white/5 shadow-inner">
                                    <CompanyLogo symbol={trade.symbol} size={28} />
                                </div>
                                <div className="flex flex-column">
                                    <div className="flex align-items-center gap-2">
                                        <span className="text-sm font-black text-white tracking-tight">{trade.symbol}</span>
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest ${trade.type === 'CALL' ? 'bg-green-500/10 text-green-400 border border-green-500/10' : 'bg-red-500/10 text-red-400 border border-red-500/10'}`}>
                                            {trade.strike} {trade.type}
                                        </span>
                                    </div>
                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{trade.expiry} • {new Date(trade.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`text-sm font-black tracking-tight ${trade.sentiment === 'Bullish' ? 'text-green-400' : 'text-red-400'}`}>
                                    {formatCurrency(trade.value)}
                                </div>
                                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter mt-0.5">{trade.sentiment} FLOW</div>
                            </div>
                        </div>
                        
                        <div className="flex align-items-center gap-2 mt-3 p-2 bg-black/20 rounded-lg border border-white/5 group-hover:border-white/10 transition-colors">
                            <div className={`p-1 rounded-md ${trade.sentiment === 'Bullish' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                {trade.sentiment === 'Bullish' ? <TrendingUp size={12} strokeWidth={3} /> : <TrendingDown size={12} strokeWidth={3} />}
                            </div>
                            <p className="m-0 text-[10px] text-slate-400 font-bold italic tracking-tight opacity-70 group-hover:opacity-100 transition-opacity">"{trade.details}"</p>
                        </div>
                    </div>
                ))}
            </div>

            <button className="p-3.5 bg-blue-600/10 border border-blue-600/20 rounded-2xl flex align-items-center justify-content-center gap-3 text-blue-400 cursor-pointer hover:bg-blue-600/20 hover:border-blue-600/40 transition-all mt-1 group">
                <Target size={18} className="group-hover:scale-110 transition-transform" />
                <span className="text-xs font-black uppercase tracking-widest">Scan For Smart Money</span>
            </button>
        </div>
    );
};

export default OptionsFlowSimulator;
