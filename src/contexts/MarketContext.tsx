import React, { createContext, useContext, useState } from 'react';

export type MarketId = 'us' | 'egypt' | 'abudhabi';

export interface Market {
    id: MarketId;
    name: string;
    shortName: string;
    flag: string;          // emoji flag
    indexName: string;     // display name of index
    indexSymbol: string;   // ticker symbol to fetch
    currency: string;
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
        color: '#10b981',
    },
];

interface MarketContextType {
    selectedMarket: Market;
    setMarket: (id: MarketId) => void;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selectedMarketId, setSelectedMarketId] = useState<MarketId>('us');

    const selectedMarket = MARKETS.find(m => m.id === selectedMarketId) ?? MARKETS[0];

    const setMarket = (id: MarketId) => setSelectedMarketId(id);

    return (
        <MarketContext.Provider value={{ selectedMarket, setMarket }}>
            {children}
        </MarketContext.Provider>
    );
};

export const useMarket = () => {
    const ctx = useContext(MarketContext);
    if (!ctx) throw new Error('useMarket must be used within MarketProvider');
    return ctx;
};
