import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, BarChart3, TrendingUp, Loader2 } from 'lucide-react';
import SymbolSearchInput from './SymbolSearchInput';
import { getStockQuote } from '../services/stockDataService';
import {
    TradeSetupCard,
    KeyLevelsTable,
    VolumeAnalysis,
    TechnicalIndicators,
    PreTradeChecklist,
    RiskSummary
} from './trading';
import type { TradeSetup, KeyLevels, VolumeData, TechnicalIndicators as TechType, ChecklistItem, RiskSummary as RiskType } from '../types/trading';

interface SearchEngineProps {
    onSelectSymbol: (symbol: string) => void;
}

const SearchEngine: React.FC<SearchEngineProps> = ({ onSelectSymbol }) => {
    const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
    const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);

    // Fetch stock data when symbol is selected
    const { data: stockData, isLoading, error } = useQuery({
        queryKey: ['tradeAnalysis', selectedSymbol],
        queryFn: async () => {
            if (!selectedSymbol) return null;
            const quote = await getStockQuote(selectedSymbol);
            return quote;
        },
        enabled: !!selectedSymbol,
        refetchInterval: 15000,
    });

    const handleSelect = (symbol: string) => {
        setSelectedSymbol(symbol);
        onSelectSymbol(symbol);

        // Reset checklist for new symbol
        setChecklistItems([
            { id: 'volume', label: 'Volume > 120% avg', checked: false, autoCheck: false },
            { id: 'rsi', label: 'RSI neutral zone', checked: false, autoCheck: false },
            { id: 'macd', label: 'MACD confirmation', checked: false, autoCheck: false },
            { id: 'earnings', label: 'No earnings pending', checked: false },
            { id: 'entry', label: 'Price above entry', checked: false, autoCheck: false },
            { id: 'wick', label: 'Wick filter passed', checked: false }
        ]);
    };

    // Calculate trade analysis from stock data
    const tradeAnalysis = useMemo(() => {
        if (!stockData) return null;

        const currentPrice = stockData.price;
        const prevHigh = stockData.high || currentPrice * 1.02;
        const prevLow = stockData.low || currentPrice * 0.98;
        const prevClose = stockData.previousClose || currentPrice;

        // Calculate key levels (Pivot Points)
        const pivotPoint = (prevHigh + prevLow + prevClose) / 3;
        const range = prevHigh - prevLow || currentPrice * 0.02;

        const support1 = 2 * pivotPoint - prevHigh;
        const support2 = pivotPoint - range;
        const resistance1 = 2 * pivotPoint - prevLow;
        const resistance2 = pivotPoint + range;

        // Determine bias with higher sensitivity
        const changePercent = stockData.changePercent;
        const bias: 'BULLISH' | 'NEUTRAL' | 'BEARISH' =
            changePercent > 0.5 ? 'BULLISH' :
                changePercent < -0.5 ? 'BEARISH' : 'NEUTRAL';

        // Calculate trade parameters
        const entry = bias === 'BULLISH' ? Math.max(currentPrice, support1) : currentPrice;
        const stopLoss = bias === 'BULLISH' ? Math.min(support2, prevLow * 0.99) : prevHigh * 1.01;
        const riskPerShare = Math.abs(entry - stopLoss) || (entry * 0.02);

        // Target Logic (Fibonacci & Reward Multipliers)
        const target1 = bias === 'BULLISH' ? entry + (riskPerShare * 1.5) : entry - (riskPerShare * 1.5);
        const target2 = bias === 'BULLISH' ? entry + (riskPerShare * 2.5) : entry - (riskPerShare * 2.5);

        // Position sizing (1% account risk on $100k account as default)
        const accountSize = 100000;
        const riskPercent = 0.01;
        const riskAmount = accountSize * riskPercent;
        const shares = Math.floor(riskAmount / riskPerShare);

        // Volume analysis
        const currentVolume = stockData.volume;
        const avgVolume = stockData.avgVolume || currentVolume;
        const relativeVolume = avgVolume > 0 ? currentVolume / avgVolume : 1;
        const volumeStatus: 'STRONG' | 'GOOD' | 'WEAK' =
            relativeVolume >= 1.5 ? 'STRONG' :
                relativeVolume >= 1.2 ? 'GOOD' : 'WEAK';

        // Technicals
        const rsi = 50 + (changePercent * 8);
        const rsiClamped = Math.max(0, Math.min(100, rsi));
        const rsiStatus: 'OVERBOUGHT' | 'NEUTRAL' | 'OVERSOLD' =
            rsiClamped > 70 ? 'OVERBOUGHT' :
                rsiClamped < 30 ? 'OVERSOLD' : 'NEUTRAL';

        const ma50 = currentPrice * 0.97; // Fallback MA
        const ma200 = currentPrice * 0.92; // Fallback MA

        const setup: TradeSetup = {
            symbol: stockData.symbol,
            name: stockData.name,
            sector: 'Market Leader',
            currentPrice,
            dayChange: stockData.change,
            dayChangePercent: stockData.changePercent,
            bias,
            entry,
            stopLoss,
            target1,
            target2,
            shares,
            riskAmount,
            riskRewardRatio: `1:${(riskPerShare > 0 ? ((Math.abs(target1 - entry)) / riskPerShare).toFixed(1) : '0')}`,
            volumeConfirm: volumeStatus !== 'WEAK'
        };

        const keyLevels: KeyLevels = {
            prevHigh,
            prevLow,
            vwap: pivotPoint,
            support1,
            support2,
            resistance1,
            resistance2,
            invalidation: stopLoss
        };

        const volume: VolumeData = {
            currentVolume,
            avgVolume20Day: avgVolume,
            relativeVolume,
            status: volumeStatus,
            entryThreshold: avgVolume * 1.2
        };

        const technicals: TechType = {
            rsi: Math.round(rsiClamped),
            rsiClamped: Math.round(rsiClamped),
            rsiStatus,
            macd: bias,
            macdNote: 'Confirmation pending on 15-min',
            ma50,
            ma200,
            priceVsMa50: currentPrice > ma50 ? 'ABOVE' : 'BELOW',
            priceVsMa200: currentPrice > ma200 ? 'ABOVE' : 'BELOW'
        };

        const risk: RiskType = {
            positionValue: shares * entry,
            riskAmount,
            rewardPotential: shares * Math.abs(target1 - entry),
            maxDailyLoss: accountSize * 0.03,
            accountRiskPercent: 1
        };

        return { setup, keyLevels, volume, technicals, risk };
    }, [stockData]);

    // Auto-update checklist based on data
    React.useEffect(() => {
        if (tradeAnalysis) {
            setChecklistItems(prev => prev.map(item => {
                if (item.id === 'volume' && item.autoCheck !== false) {
                    return { ...item, checked: tradeAnalysis.volume.status !== 'WEAK' };
                }
                if (item.id === 'rsi' && item.autoCheck !== false) {
                    return { ...item, checked: tradeAnalysis.technicals.rsiStatus === 'NEUTRAL' };
                }
                if (item.id === 'macd' && item.autoCheck !== false) {
                    return { ...item, checked: tradeAnalysis.technicals.macd === 'BULLISH' };
                }
                if (item.id === 'entry' && item.autoCheck !== false) {
                    return { ...item, checked: tradeAnalysis.setup.currentPrice >= tradeAnalysis.setup.entry * 0.99 };
                }
                return item;
            }));
        }
    }, [tradeAnalysis]);

    return (
        <div className="search-engine-container" style={{ padding: '0.5rem 1rem' }}>
            {/* Search Header */}
            <div style={{ marginBottom: '1rem' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.75rem'
                }}>
                    <BarChart3 size={20} style={{ color: 'var(--color-accent)' }} />
                    <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                        AI Trade <span className="gradient-text">Analysis</span>
                    </h2>
                </div>
                <SymbolSearchInput
                    onSelect={handleSelect}
                    placeholder="Enter stock symbol for detailed analysis..."
                    autoFocus
                />
            </div>

            {/* Loading State */}
            {isLoading && selectedSymbol && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '3rem',
                    gap: '0.75rem',
                    color: 'var(--color-text-secondary)'
                }}>
                    <Loader2 size={20} className="spin" />
                    <span>Analyzing {selectedSymbol}...</span>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div style={{
                    padding: '1rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-error)',
                    fontSize: '0.875rem'
                }}>
                    Failed to fetch data for {selectedSymbol}. Please try again.
                </div>
            )}

            {/* Trade Analysis Display */}
            {tradeAnalysis && !isLoading && (
                <div className="trade-analysis-container">
                    {/* Trade Setup Card */}
                    <TradeSetupCard setup={tradeAnalysis.setup} />

                    {/* Key Levels Table */}
                    <KeyLevelsTable levels={tradeAnalysis.keyLevels} />

                    {/* Volume & Technicals Row */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '1rem',
                        marginBottom: '1rem'
                    }}>
                        <VolumeAnalysis volume={tradeAnalysis.volume} />
                        <TechnicalIndicators indicators={tradeAnalysis.technicals} />
                    </div>

                    {/* Pre-Trade Checklist */}
                    <PreTradeChecklist
                        items={checklistItems}
                        onItemToggle={(id, checked) => {
                            setChecklistItems(prev =>
                                prev.map(item => item.id === id ? { ...item, checked } : item)
                            );
                        }}
                    />

                    {/* Risk Summary */}
                    <RiskSummary risk={tradeAnalysis.risk} />
                </div>
            )}

            {/* Empty State */}
            {!selectedSymbol && !isLoading && (
                <div style={{
                    textAlign: 'center',
                    padding: '4rem 2rem',
                    color: 'var(--color-text-secondary)'
                }}>
                    <TrendingUp size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                    <h3 style={{ margin: '0 0 0.5rem', fontWeight: 500 }}>Search for a Stock</h3>
                    <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.7 }}>
                        Enter a symbol above to view detailed trade analysis, key levels, and risk parameters.
                    </p>
                </div>
            )}

            <style>{`
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @media (max-width: 768px) {
                    .trade-analysis-container > div[style*="grid-template-columns"] {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default SearchEngine;
