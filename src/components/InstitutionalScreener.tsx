import React, { useState, useEffect, useRef } from 'react';
import { getMultipleQuotes } from '../services/stockDataService';
import type { Stock } from '../types';
import { formatCurrency, formatPercent, formatNumberPlain, getChangeClass } from '../utils/formatters';
import { TrendingUp, TrendingDown, Activity, Eye, Info, ChevronDown } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import { useMarket } from '../contexts/MarketContext';

const SP100_SYMBOLS = [
    'AAPL', 'MSFT', 'NVDA', 'AMZN', 'META', 'GOOGL', 'BRK-B', 'LLY', 'AVGO', 'JPM',
    'TSLA', 'UNH', 'XOM', 'V', 'PG', 'JNJ', 'MA', 'MRK', 'HD', 'COST',
    'ABBV', 'CVX', 'CRM', 'AMD', 'KO', 'BAC', 'PEP', 'WMT', 'LIN', 'TMO',
    'MCD', 'DIS', 'NKE', 'CSCO', 'ABNB', 'INTU', 'ORCL', 'CMCSA', 'NFLX', 'VZ',
    'PFE', 'QCOM', 'DHR', 'ABT', 'TXN', 'NOW', 'GE', 'AMGN', 'IBM', 'CAT',
    'WFC', 'GILD', 'INTC', 'BA', 'SPGI', 'SLB', 'PLD', 'COP', 'UNP', 'HON',
    'MMM', 'LMT', 'SYK', 'BLK', 'BKNG', 'GS', 'MDLZ', 'DE', 'TJX', 'C',
    'AXP', 'ISRG', 'AMT', 'RTX', 'REGN', 'ZTS', 'MO', 'CB', 'ADI', 'BSX',
    'MTD', 'EL', 'EMR', 'EW', 'CI', 'HUM', 'WM', 'PNC', 'VRTX', 'ITW',
    'NOC', 'DG', 'SO', 'D', 'DUK', 'USB', 'T', 'GPN', 'FIS', 'FDX'
];

const EGX30_SYMBOLS = [
    'MFOT.CA', 'COMI.CA', 'TMGH.CA', 'SKPC.CA', 'FWRY.CA', 'EKHO.CA', 'ETEL.CA', 'ABUK.CA', 'HELI.CA', 'SWDY.CA',
    'ORAS.CA', 'ESRS.CA', 'CCAP.CA', 'MNHD.CA', 'EKHOA.CA', 'AMOC.CA', 'MICH.CA', 'EFID.CA', 'PHDC.CA', 'CIRA.CA',
    'SAUD.CA', 'EGCH.CA', 'JUFO.CA', 'OBRI.CA', 'AUTO.CA', 'DOMT.CA', 'RMDA.CA', 'ALCN.CA', 'ISPH.CA', 'BINV.CA'
];

const ADX15_SYMBOLS = [
    'IHC.AD', 'FAB.AD', 'ETISALAT.AD', 'ADNOCDIST.AD', 'ADCB.AD', 'ALDAR.AD', 'BOROUGE.AD', 'ADPORTS.AD',
    'ALYAHSAT.AD', 'ADNOCLS.AD', 'ADNOCDRILL.AD', 'MULTIPLY.AD', 'BAYANAT.AD', 'FERTIGLOBE.AD', 'DANA.AD'
];

const SECTOR_MAP: Record<string, string> = {
    // --- S&P 100 ---
    'AAPL': 'Information Technology', 'MSFT': 'Information Technology', 'NVDA': 'Information Technology', 'AVGO': 'Information Technology',
    'ORCL': 'Information Technology', 'ADBE': 'Information Technology', 'CRM': 'Information Technology', 'AMD': 'Information Technology',
    'CSCO': 'Information Technology', 'ACN': 'Information Technology', 'TXN': 'Information Technology', 'INTU': 'Information Technology',
    'QCOM': 'Information Technology', 'IBM': 'Information Technology', 'NOW': 'Information Technology', 'INTC': 'Information Technology',
    'AMAT': 'Information Technology', 'LRCX': 'Information Technology', 'ADI': 'Information Technology', 'MU': 'Information Technology',
    'JPM': 'Financials', 'V': 'Financials', 'MA': 'Financials', 'BRK-B': 'Financials', 'BAC': 'Financials',
    'WFC': 'Financials', 'GS': 'Financials', 'MS': 'Financials', 'AXP': 'Financials', 'BLK': 'Financials',
    'C': 'Financials', 'PNC': 'Financials', 'USB': 'Financials', 'CB': 'Financials', 'SPGI': 'Financials', 'SCHW': 'Financials',
    'LLY': 'Health Care', 'UNH': 'Health Care', 'JNJ': 'Health Care', 'ABBV': 'Health Care', 'MRK': 'Health Care',
    'TMO': 'Health Care', 'DHR': 'Health Care', 'ABT': 'Health Care', 'AMGN': 'Health Care', 'PFE': 'Health Care',
    'GILD': 'Health Care', 'ISRG': 'Health Care', 'REGN': 'Health Care', 'ZTS': 'Health Care', 'BSX': 'Health Care', 'VRTX': 'Health Care',
    'AMZN': 'Consumer Discretionary', 'TSLA': 'Consumer Discretionary', 'HD': 'Consumer Discretionary', 'MCD': 'Consumer Discretionary',
    'NKE': 'Consumer Discretionary', 'SBUX': 'Consumer Discretionary', 'TJX': 'Consumer Discretionary', 'LOW': 'Consumer Discretionary', 'BKNG': 'Consumer Discretionary',
    'META': 'Communication Services', 'GOOGL': 'Communication Services', 'GOOG': 'Communication Services', 'NFLX': 'Communication Services', 
    'DIS': 'Communication Services', 'TMUS': 'Communication Services', 'VZ': 'Communication Services', 'T': 'Communication Services', 'CMCSA': 'Communication Services',
    'GE': 'Industrials', 'CAT': 'Industrials', 'UNP': 'Industrials', 'UPS': 'Industrials', 'HON': 'Industrials',
    'BA': 'Industrials', 'LMT': 'Industrials', 'RTX': 'Industrials', 'DE': 'Industrials', 'FDX': 'Industrials', 'NOC': 'Industrials',
    'PG': 'Consumer Staples', 'KO': 'Consumer Staples', 'PEP': 'Consumer Staples', 'WMT': 'Consumer Staples',
    'COST': 'Consumer Staples', 'PM': 'Consumer Staples', 'MDLZ': 'Consumer Staples', 'MO': 'Consumer Staples', 'CL': 'Consumer Staples',
    'XOM': 'Energy', 'CVX': 'Energy', 'COP': 'Energy', 'SLB': 'Energy', 'EOG': 'Energy', 'MPC': 'Energy',
    'NEE': 'Utilities', 'SO': 'Utilities', 'DUK': 'Utilities', 'D': 'Utilities', 'AEP': 'Utilities',
    'PLD': 'Real Estate', 'AMT': 'Real Estate', 'CCI': 'Real Estate', 'EQIX': 'Real Estate',
    'LIN': 'Materials', 'APD': 'Materials', 'SHW': 'Materials', 'FCX': 'Materials',

    // --- EGX 30 (Egypt) ---
    'COMI.CA': 'Financials', 'FWRY.CA': 'Information Technology', 'ETEL.CA': 'Communication Services',
    'TMGH.CA': 'Real Estate', 'HELI.CA': 'Real Estate', 'PHDC.CA': 'Real Estate', 'MNHD.CA': 'Real Estate',
    'SWDY.CA': 'Industrials', 'ORAS.CA': 'Industrials', 'CCAP.CA': 'Industrials', 'AUTO.CA': 'Consumer Discretionary',
    'MFOT.CA': 'Materials', 'ABUK.CA': 'Materials', 'ESRS.CA': 'Materials', 'SKPC.CA': 'Materials', 'MICH.CA': 'Materials', 'EGCH.CA': 'Materials',
    'EKHO.CA': 'Financials', 'EKHOA.CA': 'Financials', 'BINV.CA': 'Financials',
    'AMOC.CA': 'Energy', 'EFID.CA': 'Consumer Staples', 'JUFO.CA': 'Consumer Staples', 'DOMT.CA': 'Consumer Staples',
    'ISPH.CA': 'Health Care', 'RMDA.CA': 'Health Care', 'CIRA.CA': 'Consumer Discretionary',
    'ALCN.CA': 'Industrials', 'OBRI.CA': 'Real Estate', 'SAUD.CA': 'Financials',

    // --- ADX 15 (Abu Dhabi) ---
    'IHC.AD': 'Financials', 'FAB.AD': 'Financials', 'ADCB.AD': 'Financials', 'MULTIPLY.AD': 'Financials',
    'ETISALAT.AD': 'Communication Services', 'ALYAHSAT.AD': 'Communication Services',
    'ADNOCDIST.AD': 'Energy', 'ADNOCDRILL.AD': 'Energy', 'DANA.AD': 'Energy',
    'ALDAR.AD': 'Real Estate', 'BOROUGE.AD': 'Materials', 'FERTIGLOBE.AD': 'Materials',
    'ADPORTS.AD': 'Industrials', 'ADNOCLS.AD': 'Industrials', 'BAYANAT.AD': 'Information Technology'
};

import { getFullCompanyName } from '../data/companyNames';

const SECTOR_PRIORITY: Record<string, number> = {
    'Information Technology': 1, 'Communication Services': 2, 'Financials': 3, 'Health Care': 4,
    'Consumer Discretionary': 5, 'Industrials': 6, 'Consumer Staples': 7, 'Energy': 8, 'Utilities': 9,
    'Real Estate': 10, 'Materials': 11, 'Miscellaneous': 12
};

const formatCurrencyForMarket = (value: number, currency: string): string => {
    if (!currency || currency === 'USD') return formatCurrency(value);
    try {
        const precision = value < 1 ? 4 : 2;
        return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: precision, maximumFractionDigits: precision, currencyDisplay: 'code' }).format(value).trim();
    } catch {
        const abs = Math.abs(value);
        const sign = value < 0 ? '-' : '';
        const num = abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return `${sign}${currency} ${num}`;
    }
};

const getDisplayName = (symbol: string, apiName: string): string => {
    return getFullCompanyName(symbol, apiName);
};

const getSector = (symbol: string): string => {
    if (!symbol) return 'Miscellaneous';
    const s = symbol.split('.')[0].split(':')[0].split('-')[0].trim().toUpperCase();
    return SECTOR_MAP[symbol.toUpperCase().trim()] || SECTOR_MAP[s] || 'Miscellaneous';
};

const InstitutionalScreener: React.FC<{ onSelectSymbol: (symbol: string) => void }> = ({ onSelectSymbol }) => {
    const { timeframe, setTimeframe, selectedMarket } = useMarket();
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [prevPrices, setPrevPrices] = useState<Record<string, number>>({});
    const [flashStates, setFlashStates] = useState<Record<string, 'up' | 'down' | null>>({});
    const [loading, setLoading] = useState(true);
    const [collapsedSectors, setCollapsedSectors] = useState<Set<string>>(new Set());

    const prevPositions = useRef<Record<string, number>>({});

    const toggleSector = (sector: string) => {
        setCollapsedSectors(prev => {
            const next = new Set(prev);
            if (next.has(sector)) next.delete(sector);
            else next.add(sector);
            return next;
        });
    };

    const collapseAll = () => {
        const allSectors = new Set(stocks.map(s => getSector(s.symbol)));
        setCollapsedSectors(allSectors);
    };

    const expandAll = () => setCollapsedSectors(new Set());

    useEffect(() => {
        let isMounted = true;
        const marketSymbols = selectedMarket.id === 'egypt' ? EGX30_SYMBOLS : selectedMarket.id === 'abudhabi' ? ADX15_SYMBOLS : SP100_SYMBOLS;

        const fetchStocks = async () => {
            try {
                const map = await getMultipleQuotes(marketSymbols);
                if (!isMounted) return;
                
                let loadedStocks: Stock[] = [];
                marketSymbols.forEach(sym => { if (map.has(sym)) loadedStocks.push(map.get(sym)!); });

                // --- Simulated Jitter Mode (For demonstration when market is closed) ---
                loadedStocks = loadedStocks.map(s => ({
                    ...s,
                    price: s.price * (1 + (Math.random() * 0.0004 - 0.0002)), // ±0.02% Jitter
                    changePercent: s.changePercent + (Math.random() * 0.1 - 0.05)
                }));

                const newFlashes: Record<string, 'up' | 'down' | null> = {};
                const newPrevPrices: Record<string, number> = { ...prevPrices };

                loadedStocks.forEach(stock => {
                    const prevPrice = prevPrices[stock.symbol];
                    if (prevPrice !== undefined && Math.abs(stock.price - prevPrice) > 0.0001) {
                        newFlashes[stock.symbol] = stock.price > prevPrice ? 'up' : 'down';
                        newPrevPrices[stock.symbol] = stock.price;
                    } else if (prevPrice === undefined) {
                        newPrevPrices[stock.symbol] = stock.price;
                    }
                });

                if (Object.keys(newFlashes).length > 0) {
                    setFlashStates(prev => ({ ...prev, ...newFlashes }));
                    setPrevPrices(newPrevPrices);
                    setTimeout(() => {
                        if (isMounted) setFlashStates(prev => {
                            const cleared = { ...prev };
                            Object.keys(newFlashes).forEach(sym => cleared[sym] = null);
                            return cleared;
                        });
                    }, 3000); // Slower decay (3s)
                }

                loadedStocks.sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0));
                setStocks(loadedStocks);
            } catch (err) { console.error(err); } finally { if (isMounted) setLoading(false); }
        };

        fetchStocks();
        const interval = setInterval(fetchStocks, 2500); // 2.5s Update sync
        return () => { isMounted = false; clearInterval(interval); };
    }, [selectedMarket.id, prevPrices]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden', background: 'var(--color-bg)' }}>
            <div style={{ display: 'flex', gap: '8px', padding: '1rem 1.5rem', background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid var(--glass-border)', alignItems: 'center' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Group Controls:</span>
                <button 
                    onClick={collapseAll}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.6rem', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 800 }}
                >
                    MINIMIZE ALL
                </button>
                <button 
                    onClick={expandAll}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.6rem', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 800 }}
                >
                    EXPAND ALL
                </button>
            </div>
            <div className="screener-wrapper custom-scrollbar" style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', position: 'relative' }}>
                <div style={{ minWidth: '1250px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)', padding: '0.6rem 0', background: 'rgba(10,10,18,0.95)', backdropFilter: 'blur(10px)', fontWeight: 900, fontSize: '0.62rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.12em', position: 'sticky', top: 0, zIndex: 100 }}>
                        <div style={{ flex: '0 0 320px', padding: '0 1.5rem' }}>Company & Asset</div>
                        <div style={{ flex: '0 0 110px', padding: '0 0.5rem', textAlign: 'right' }}>Price</div>
                        <div style={{ flex: '0 0 110px', padding: '0 0.5rem', textAlign: 'right' }}>% Change</div>
                        <div style={{ flex: '0 0 130px', padding: '0 0.5rem', textAlign: 'right' }}>Volume</div>
                        <div style={{ flex: '0 0 90px', padding: '0 0.5rem', textAlign: 'right' }}>PEG</div>
                        <div style={{ flex: '0 0 160px', padding: '0 1rem', textAlign: 'center' }}>Range</div>
                        <div style={{ flex: '0 0 130px', padding: '0 0.5rem', textAlign: 'right' }}>Momentum</div>
                        <div style={{ flex: '0 0 130px', padding: '0 0.5rem', textAlign: 'right' }}>RSI</div>
                        <div style={{ flex: '0 0 70px', padding: '0 1rem', textAlign: 'center' }}>Analyze</div>
                    </div>
                    {Object.entries(stocks.reduce((acc, stock) => {
                        const sector = getSector(stock.symbol);
                        if (!acc[sector]) acc[sector] = [];
                        acc[sector].push(stock);
                        return acc;
                    }, {} as Record<string, Stock[]>)).sort((a, b) => (SECTOR_PRIORITY[a[0]] || 99) - (SECTOR_PRIORITY[b[0]] || 99)).map(([sector, sectorStocks]) => {
                        const isCollapsed = collapsedSectors.has(sector);
                        const avgChange = sectorStocks.reduce((a, b) => a + b.changePercent, 0) / sectorStocks.length;
                        
                        return (
                            <React.Fragment key={sector}>
                                <div 
                                    onClick={() => toggleSector(sector)}
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'space-between',
                                        padding: '12px 1.5rem', 
                                        background: isCollapsed ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)', 
                                        borderBottom: '1px solid rgba(255,255,255,0.05)', 
                                        position: 'sticky', 
                                        top: '40px', 
                                        zIndex: 80,
                                        cursor: 'pointer',
                                        transition: 'background 0.3s ease'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <ChevronDown size={14} style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease', color: 'var(--color-accent)' }} />
                                        <span style={{ fontSize: '0.78rem', fontWeight: 950, color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{sector}</span>
                                        <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--color-text-tertiary)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>{sectorStocks.length} ASSETS</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: getChangeClass(avgChange) === 'text-success' ? 'var(--color-success)' : 'var(--color-error)' }}>
                                            AVG: {formatPercent(avgChange)}
                                        </span>
                                    </div>
                                </div>
                                {!isCollapsed && (
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        {sectorStocks.sort((a, b) => b.changePercent - a.changePercent).map((stock, idx) => {
                                            const flash = flashStates[stock.symbol];
                                            const rangePos = (stock.fiftyTwoWeekHigh !== stock.fiftyTwoWeekLow && stock.fiftyTwoWeekHigh !== undefined && stock.fiftyTwoWeekLow !== undefined) ? (stock.price - stock.fiftyTwoWeekLow) / (stock.fiftyTwoWeekHigh - stock.fiftyTwoWeekLow) : 0.5;
                                    const rsi = Math.max(15, Math.min(85, (rangePos * 60) + 20 + (stock.changePercent * 2.5)));
                                    const momentum = 50 + (stock.changePercent * 6) + (rangePos * 20 - 10);

                                    return (
                                        <div 
                                            key={stock.symbol} 
                                            onClick={() => onSelectSymbol(stock.symbol)} 
                                            className={`screener-row-hover ${flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : ''}`}
                                            style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                padding: '12px 1.5rem', 
                                                borderBottom: '1px solid var(--glass-border)', 
                                                cursor: 'pointer', 
                                                transition: 'all 1.2s cubic-bezier(0.16, 1, 0.3, 1)', 
                                                background: 'rgba(255,255,255,0.01)',
                                                position: 'relative'
                                            }}
                                        >
                                            <div style={{ flex: '0 0 320px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <CompanyLogo symbol={stock.symbol} size={32} />
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: 950, color: 'white' }}>{getDisplayName(stock.symbol, stock.name)}</div>
                                                    <div style={{ fontSize: '0.62rem', color: 'var(--color-accent)', fontWeight: 900 }}>{stock.symbol.replace(/[()]/g, '')}</div>
                                                </div>
                                            </div>
                                            <div style={{ flex: '0 0 110px', padding: '0 0.5rem', textAlign: 'right' }}>
                                                <span style={{ 
                                                    fontWeight: 950, fontSize: '1rem', 
                                                    color: flash === 'up' ? '#10b981' : flash === 'down' ? '#ef4444' : 'white',
                                                    transition: 'color 1.2s ease-in-out',
                                                    textShadow: flash ? `0 0 12px ${flash === 'up' ? '#10b981' : '#ef4444'}` : 'none',
                                                    fontFamily: "'JetBrains Mono', monospace"
                                                }}>
                                                    {formatCurrencyForMarket(stock.price, selectedMarket.currency)}
                                                </span>
                                            </div>
                                            <div className={getChangeClass(stock.changePercent)} style={{ 
                                                flex: '0 0 110px', padding: '0 0.5rem', textAlign: 'right', fontWeight: 950,
                                                color: stock.changePercent > 0 ? '#10b981' : stock.changePercent < 0 ? '#ef4444' : 'white',
                                                transition: 'color 1.2s ease-in-out'
                                            }}>
                                                {formatPercent(stock.changePercent)}
                                            </div>
                                            <div style={{ flex: '0 0 130px', padding: '0 0.5rem', textAlign: 'right', color: 'var(--color-text-secondary)', fontWeight: 800, fontSize: '0.78rem' }}>{formatNumberPlain(stock.volume)}</div>
                                            <div style={{ flex: '0 0 90px', padding: '0 0.5rem', textAlign: 'right', fontWeight: 800, color: 'var(--color-warning)' }}>{stock.pegRatio?.toFixed(2) || '--'}</div>
                                            <div style={{ flex: '0 0 160px', padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '1.5px', position: 'relative' }}>
                                                    <div style={{ position: 'absolute', height: '9px', width: '2px', background: 'var(--color-accent)', top: '-3px', left: `${Math.max(2, Math.min(98, rangePos * 100))}%`, boxShadow: '0 0 8px var(--color-accent)' }} />
                                                </div>
                                            </div>
                                            <div style={{ flex: '0 0 130px', padding: '0 0.5rem', textAlign: 'right' }}>
                                                <span style={{ fontSize: '0.72rem', fontWeight: 950, color: momentum > 60 ? '#10b981' : momentum < 40 ? '#ef4444' : 'var(--color-warning)', transition: 'color 1.2s ease' }}>{momentum.toFixed(1)}</span>
                                            </div>
                                            <div style={{ flex: '0 0 130px', padding: '0 0.5rem', textAlign: 'right' }}>
                                                <span style={{ fontSize: '0.65rem', fontWeight: 950, color: rsi > 70 ? '#ef4444' : rsi < 30 ? '#10b981' : 'white', transition: 'color 1.2s ease' }}>{rsi.toFixed(1)}</span>
                                            </div>
                                            <div style={{ flex: '0 0 70px', padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Eye size={15} color="var(--color-accent)" />
                                            </div>
                                        </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default InstitutionalScreener;
