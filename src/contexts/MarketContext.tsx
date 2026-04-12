import React, { createContext, useContext, useState } from 'react';

export type MarketId = 'us' | 'egypt' | 'abudhabi';

export interface Market {
    id: MarketId;
    name: string;
    shortName: string;
    flag: string;
    flagUrl: string;            // SVG flag image URL (emoji flags don't render on Windows)
    indexName: string;
    indexSymbol: string;
    currency: string;
    currencySymbol: string;     // Display prefix: "$", "EGP ", "AED "
    currencyLocale: string;     // BCP47 locale for Intl.NumberFormat
    heatmapDataSource: string;  // TradingView heatmap dataSource id
    heatmapExchanges: string[]; // TradingView exchanges filter (empty = all)
    hasHeatmapSupport: boolean;
    color: string;
}

export const MARKETS: Market[] = [
    {
        id: 'us',
        name: 'United States',
        shortName: 'US',
        flag: '🇺🇸',
        flagUrl: 'https://flagcdn.com/w40/us.png',
        indexName: 'S&P 500',
        indexSymbol: '%5EGSPC',
        currency: 'USD',
        currencySymbol: '$',
        currencyLocale: 'en-US',
        heatmapDataSource: 'SPX500',
        heatmapExchanges: [],
        hasHeatmapSupport: true,
        color: '#6366f1',
    },
    {
        id: 'egypt',
        name: 'Egypt',
        shortName: 'EG',
        flag: '🇪🇬',
        flagUrl: 'https://flagcdn.com/w20/eg.png',
        indexName: 'EGX 30',
        indexSymbol: 'EGX:EGX30',
        currency: 'EGP',
        currencySymbol: 'EGP ',
        currencyLocale: 'ar-EG',
        heatmapDataSource: 'EGXEGX30',
        heatmapExchanges: ['EGX'],
        hasHeatmapSupport: true,
        color: '#f59e0b',
    },
    {
        id: 'abudhabi',
        name: 'Abu Dhabi',
        shortName: 'AD',
        flag: '🇦🇪',
        flagUrl: 'https://flagcdn.com/w20/ae.png',
        indexName: 'FTSE ADX 15',
        indexSymbol: 'ADX:FADGI',
        currency: 'AED',
        currencySymbol: 'AED ',
        currencyLocale: 'ar-AE',
        heatmapDataSource: 'ADXFADX15',
        heatmapExchanges: ['ADX'],
        hasHeatmapSupport: true,
        color: '#10b981',
    },
];

interface MarketContextType {
    selectedMarket: Market;
    setMarket: (id: MarketId) => void;
    favoriteMarketId: MarketId;
    setFavoriteMarket: (id: MarketId) => void;
    /** Market currently being hovered in the selector (preview only — resets when dropdown closes) */
    hoverMarketId: MarketId | null;
    setHoverMarket: (id: MarketId | null) => void;
    /** Resolves the effective market: hover preview if active, otherwise the committed selection */
    effectiveMarket: Market;
    /** Global market sentiment score (0-100) */
    sentimentScore: number;
    setSentimentScore: (score: number) => void;
    /** Home tab view mode: 'heatmap' | 'screener' */
    homeView: 'heatmap' | 'screener';
    setHomeView: (view: 'heatmap' | 'screener') => void;
    /** Favorite view mode persisted in localStorage */
    favoriteHomeView: 'heatmap' | 'screener';
    setFavoriteHomeView: (view: 'heatmap' | 'screener') => void;
    /** Global timeframe for heatmap/screener */
    timeframe: string;
    setTimeframe: (tf: string) => void;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [favoriteMarketId, setFavoriteMarketId] = useState<MarketId>(() => {
        const stored = localStorage.getItem('favorite_market');
        return (stored === 'us' || stored === 'egypt' || stored === 'abudhabi') ? stored : 'us';
    });

    const [selectedMarketId, setSelectedMarketId] = useState<MarketId>(() => {
        const preferred = localStorage.getItem('preferred_market');
        const stored = (preferred === 'us' || preferred === 'egypt' || preferred === 'abudhabi') ? preferred : null;
        return stored ? stored : favoriteMarketId;
    });
    const [hoverMarketId, setHoverMarketId] = useState<MarketId | null>(null);
    const [sentimentScore, setSentimentScore] = useState<number>(50);

    const selectedMarket = MARKETS.find(m => m.id === selectedMarketId) ?? MARKETS[0];
    const effectiveMarket = (hoverMarketId ? MARKETS.find(m => m.id === hoverMarketId) : null) ?? selectedMarket;

    const setMarket = (id: MarketId) => {
        setSelectedMarketId(id);
        localStorage.setItem('preferred_market', id);
    };

    const setFavoriteMarket = (id: MarketId) => {
        setFavoriteMarketId(id);
        localStorage.setItem('favorite_market', id);
        setSelectedMarketId(id);
        localStorage.setItem('preferred_market', id);
    };

    const [favoriteHomeView, setFavoriteHomeViewInternal] = useState<'heatmap' | 'screener'>(() => {
        const stored = localStorage.getItem('favorite_home_view');
        return (stored === 'heatmap' || stored === 'screener') ? stored : 'heatmap';
    });

    const [homeView, setHomeView] = useState<'heatmap' | 'screener'>(favoriteHomeView);

    const setFavoriteHomeView = (view: 'heatmap' | 'screener') => {
        setFavoriteHomeViewInternal(view);
        localStorage.setItem('favorite_home_view', view);
        setHomeView(view);
    };

    const [timeframe, setTimeframe] = useState<string>(() => {
        return localStorage.getItem('global_timeframe') || 'D';
    });

    const setTimeframeWithStorage = (tf: string) => {
        setTimeframe(tf);
        localStorage.setItem('global_timeframe', tf);
    };

    const setHoverMarket = (id: MarketId | null) => setHoverMarketId(id);

    return (
        <MarketContext.Provider value={{
            selectedMarket,
            setMarket,
            favoriteMarketId,
            setFavoriteMarket,
            hoverMarketId,
            setHoverMarket,
            effectiveMarket,
            sentimentScore,
            setSentimentScore,
            homeView,
            setHomeView,
            favoriteHomeView,
            setFavoriteHomeView,
            timeframe,
            setTimeframe: setTimeframeWithStorage
        }}>
            {children}
        </MarketContext.Provider>
    );
};

export const useMarket = () => {
    const ctx = useContext(MarketContext);
    if (!ctx) throw new Error('useMarket must be used within MarketProvider');
    return ctx;
};
