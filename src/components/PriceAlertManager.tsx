import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePriceAlerts } from '../hooks/usePriceAlerts';
import { getMultipleQuotes } from '../services/stockDataService';

/**
 * Background component that monitors active price alerts across all symbols.
 * This runs globally in the background to ensure alerts fire even if the 
 * specific stock detail page is not open.
 */
const PriceAlertManager: React.FC = () => {
    const { alerts, checkPrice } = usePriceAlerts();

    // Get unique symbols that have active alerts
    const activeAlertSymbols = Array.from(
        new Set(alerts.filter(a => a.active).map(a => a.symbol))
    );

    // Poll for prices of alerted symbols
    const { data: quotes } = useQuery({
        queryKey: ['price-alerts-check', activeAlertSymbols],
        queryFn: () => getMultipleQuotes(activeAlertSymbols),
        // Poll every 30 seconds for alerts (less frequent than active symbol to save API credits)
        refetchInterval: 30000,
        enabled: activeAlertSymbols.length > 0,
        refetchOnWindowFocus: true,
        refetchIntervalInBackground: true,
    });

    useEffect(() => {
        if (!quotes) return;

        // Check each alerted symbol against its current price
        activeAlertSymbols.forEach(symbol => {
            const quote = quotes.get(symbol);
            if (quote && quote.price > 0) {
                checkPrice(symbol, quote.price);
            }
        });
    }, [quotes, activeAlertSymbols, checkPrice]);

    return null; // Side-effect only component
};

export default PriceAlertManager;
