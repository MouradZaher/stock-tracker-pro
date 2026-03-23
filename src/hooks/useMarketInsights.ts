import { useState, useEffect } from 'react';
import { useMarket } from '../contexts/MarketContext';
import { getSectorPerformance } from '../services/stockDataService';

export const useMarketInsights = () => {
    const { effectiveMarket, setSentimentScore } = useMarket();
    const [sectorData, setSectorData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const sectors = await getSectorPerformance(effectiveMarket.id);
                setSectorData(sectors);

                // Calculate sentiment score
                const bullishCount = sectors.filter((s: any) => s.change > 0).length;
                const score = sectors.length > 0 ? (bullishCount / sectors.length) * 100 : 50;
                setSentimentScore(score);
            } catch (error) {
                console.error('Failed to fetch market insights:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 5000); // 5s refresh
        return () => clearInterval(interval);
    }, [effectiveMarket.id, setSentimentScore]);

    const sentimentScore = sectorsToScore(sectorData);
    const overallSentiment = sentimentScore >= 60 ? 'Bullish' : sentimentScore <= 40 ? 'Bearish' : 'Neutral';
    const sentimentColor = overallSentiment === 'Bullish' ? '#10B981' : overallSentiment === 'Bearish' ? '#EF4444' : '#F59E0B';

    return {
        sectorData,
        sentimentScore,
        overallSentiment,
        sentimentColor,
        isLoading
    };
};

function sectorsToScore(sectors: any[]) {
    const bullishCount = sectors.filter(s => s.change > 0).length;
    return sectors.length > 0 ? (bullishCount / sectors.length) * 100 : 50;
}
