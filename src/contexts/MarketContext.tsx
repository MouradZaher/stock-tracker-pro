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
        color: '#6366f1',
    },
    {
        id: 'egypt',
        name: 'Egypt',
        shortName: 'EGY',
        flag: '🇪🇬',
        flagUrl: 'https://flagcdn.com/w40/eg.png',
        indexName: 'EGX 30',
        indexSymbol: '%5ECASE30',
        currency: 'EGP',
        currencySymbol: 'EGP ',
        currencyLocale: 'ar-EG',
        heatmapDataSource: 'EGXEGX30',
        heatmapExchanges: [],
        color: '#f59e0b',
    },
    {
        id: 'abudhabi',
        name: 'Abu Dhabi',
        shortName: 'ADX',
        flag: '🇦🇪',
        flagUrl: 'https://flagcdn.com/w40/ae.png',
        indexName: 'FTSE ADX 15',
        indexSymbol: 'FADGI.AD',
        currency: 'AED',
        currencySymbol: 'AED ',
        currencyLocale: 'ar-AE',
        heatmapDataSource: 'ADXFADX15',
        heatmapExchanges: [],
        color: '#10b981',
    },
];

interface MarketContextType {
    selectedMarket: Market;
    setMarket: (id: MarketId) => void;
    /** Market currently being hovered in the selector (preview only — resets when dropdown closes) */
    hoverMarketId: MarketId | null;
    setHoverMarket: (id: MarketId | null) => void;
    /** Resolves the effective market: hover preview if active, otherwise the committed selection */
    effectiveMarket: Market;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selectedMarketId, setSelectedMarketId] = useState<MarketId>('us');
    const [hoverMarketId, setHoverMarketId] = useState<MarketId | null>(null);

    const selectedMarket = MARKETS.find(m => m.id === selectedMarketId) ?? MARKETS[0];
    const effectiveMarket = (hoverMarketId ? MARKETS.find(m => m.id === hoverMarketId) : null) ?? selectedMarket;

    const setMarket = (id: MarketId) => setSelectedMarketId(id);
    const setHoverMarket = (id: MarketId | null) => setHoverMarketId(id);

    return (
        <MarketContext.Provider value={{ selectedMarket, setMarket, hoverMarketId, setHoverMarket, effectiveMarket }}>
            {children}
        </MarketContext.Provider>
    );
};

export const useMarket = () => {
    const ctx = useContext(MarketContext);
    if (!ctx) throw new Error('useMarket must be used within MarketProvider');
    return ctx;
};
