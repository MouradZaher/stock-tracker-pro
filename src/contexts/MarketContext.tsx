import React, { createContext, useContext, useState } from 'react';

export type MarketId = 'us' | 'egypt' | 'abudhabi';

export interface Market {
    id: MarketId;
    name: string;
    shortName: string;
    flag: string;
    indexName: string;
    indexSymbol: string;
    currency: string;
    currencySymbol: string;     // Display prefix: "$", "EGP ", "AED "
    currencyLocale: string;     // BCP47 locale for Intl.NumberFormat
    heatmapDataSource: string;  // TradingView heatmap dataSource id
    color: string;
}

export const MARKETS: Market[] = [
    {
        id: 'us',
        name: 'United States',
        shortName: 'US',
        flag: '🇺🇸',
        indexName: 'S&P 500',
        indexSymbol: '%5EGSPC',
        currency: 'USD',
        currencySymbol: '$',
        currencyLocale: 'en-US',
        heatmapDataSource: 'SPX500',
        color: '#6366f1',
    },
    {
        id: 'egypt',
        name: 'Egypt',
        shortName: 'EGY',
        flag: '🇪🇬',
        indexName: 'EGX 30',
        indexSymbol: '%5ECASE30',
        currency: 'EGP',
        currencySymbol: 'EGP ',
        currencyLocale: 'ar-EG',
        heatmapDataSource: 'EGX',
        color: '#f59e0b',
    },
    {
        id: 'abudhabi',
        name: 'Abu Dhabi',
        shortName: 'ADX',
        flag: '🇦🇪',
        indexName: 'FTSE ADX 15',
        indexSymbol: 'FADGI.AD',
        currency: 'AED',
        currencySymbol: 'AED ',
        currencyLocale: 'ar-AE',
        heatmapDataSource: 'ADX',
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
