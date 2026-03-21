import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PortfolioPosition, PortfolioSummary } from '../types';
import { calculateProfitLoss } from '../utils/calculations';
import { getSectorForSymbol } from '../data/sectors';
import * as portfolioService from '../services/portfolioService';
import { supabase } from '../services/supabase';
import { getMarketForSymbol } from '../data/sectors';

export interface AdvancedMetrics {
    diversificationScore: number; // 0-100 (Higher is better)
    concentrationRisk: 'Low' | 'Medium' | 'High';
    weightedRsi: number | null;
    regionalBreakdown: {
        us: number;
        egypt: number;
        uae: number;
    };
    sectorMomentum: Record<string, number>;
}

interface PortfolioStore {
    positions: PortfolioPosition[];
    isLoading: boolean;
    isSyncing: boolean;
    error: string | null;

    // Local state actions (with Supabase sync)
    addPosition: (position: Omit<PortfolioPosition, 'id' | 'profitLoss' | 'profitLossPercent' | 'marketValue' | 'purchaseValue'>, userId?: string) => Promise<void>;
    updatePosition: (id: string, updates: Partial<PortfolioPosition>, userId?: string) => Promise<void>;
    removePosition: (id: string, symbol: string, userId?: string) => Promise<void>;
    addMultiplePositions: (positions: Omit<PortfolioPosition, 'id' | 'profitLoss' | 'profitLossPercent' | 'marketValue' | 'purchaseValue'>[], userId?: string) => Promise<void>;
    updatePrice: (symbol: string, price: number, userId?: string, isFallback?: boolean) => Promise<void>;
    syncPrices: () => Promise<void>;

    // Supabase sync actions
    syncWithSupabase: (userId: string) => Promise<void>;
    loadFromSupabase: (userId: string) => Promise<void>;
    initRealtimeSubscription: (userId: string) => () => void;

    // Utility actions
    getSummary: () => PortfolioSummary;
    getAdvancedMetrics: () => AdvancedMetrics;
    clearPositions: () => void;
    clearError: () => void;
}

export const usePortfolioStore = create<PortfolioStore>()(
    persist(
        (set, get) => {
            return {
                positions: [],
                isLoading: false,
                isSyncing: false,
                error: null,

                addPosition: async (position, userId) => {
                    const id = `${position.symbol}-${Date.now()}`;
                    const purchaseValue = position.units * position.avgCost;
                    const marketValue = position.units * position.currentPrice;
                    const { amount, percent } = calculateProfitLoss(position.currentPrice, position.avgCost, position.units);

                    const newPosition: PortfolioPosition = {
                        ...position,
                        id,
                        purchaseValue,
                        marketValue,
                        profitLoss: amount,
                        profitLossPercent: percent,
                        sector: position.sector || getSectorForSymbol(position.symbol),
                    };

                    // Optimistic update
                    set((state) => ({
                        positions: [...state.positions, newPosition],
                    }));

                    // Sync to Supabase only if user is logged in AND not a bypass user
                    if (userId && !userId.startsWith('bypass-')) {
                        set({ isSyncing: true });
                        try {
                            const success = await portfolioService.savePosition(userId, newPosition);
                            set({ isSyncing: false });
                            if (!success) {
                                set({ error: 'Failed to sync position to cloud. Saved locally.' });
                            }
                        } catch (error) {
                            console.error('Error saving position:', error);
                            set({
                                error: 'Failed to sync position to cloud. Saved locally.',
                                isSyncing: false
                            });
                        }
                    }
                },

                updatePosition: async (id, updates, userId) => {
                    // Store old position for potential rollback
                    const oldPosition = get().positions.find(p => p.id === id);

                    // Optimistic update
                    set((state) => ({
                        positions: state.positions.map((pos) => {
                            if (pos.id !== id) return pos;

                            const updated = { ...pos, ...updates };
                            const purchaseValue = updated.units * updated.avgCost;
                            const marketValue = updated.units * updated.currentPrice;
                            const { amount, percent } = calculateProfitLoss(updated.currentPrice, updated.avgCost, updated.units);

                            return {
                                ...updated,
                                purchaseValue,
                                marketValue,
                                profitLoss: amount,
                                profitLossPercent: percent,
                            };
                        }),
                    }));

                    // Sync to Supabase only if user is logged in AND not a bypass user
                    if (userId && oldPosition && !userId.startsWith('bypass-')) {
                        set({ isSyncing: true });
                        try {
                            const updatedPosition = get().positions.find(p => p.id === id);
                            if (updatedPosition) {
                                const success = await portfolioService.savePosition(userId, updatedPosition);
                                set({ isSyncing: false });
                                if (!success) {
                                    set({ error: 'Failed to sync update to cloud. Saved locally.' });
                                }
                            }
                        } catch (error) {
                            console.error('Error updating position:', error);
                            set({
                                error: 'Failed to sync update to cloud. Saved locally.',
                                isSyncing: false
                            });
                        }
                    }
                },

                addMultiplePositions: async (newPositions, userId) => {
                    const positionsToSave = newPositions.map(p => {
                        const id = `${p.symbol}-${Math.random().toString(36).substr(2, 9)}`;
                        const purchaseValue = p.units * p.avgCost;
                        const marketValue = p.units * p.currentPrice;
                        const { amount, percent } = calculateProfitLoss(p.currentPrice, p.avgCost, p.units);
                        
                        return {
                            ...p,
                            id,
                            purchaseValue,
                            marketValue,
                            profitLoss: amount,
                            profitLossPercent: percent,
                            sector: p.sector || getSectorForSymbol(p.symbol),
                        } as PortfolioPosition;
                    });

                    // Optimistic update
                    set((state) => ({
                        positions: [...state.positions, ...positionsToSave],
                    }));

                    // Sync to Supabase
                    if (userId && !userId.startsWith('bypass-')) {
                        set({ isSyncing: true });
                        try {
                            await portfolioService.syncLocalToSupabase(userId, positionsToSave);
                            set({ isSyncing: false });
                        } catch (error) {
                            console.error('Error batch saving positions:', error);
                            set({
                                error: 'Failed to sync some positions to cloud. Saved locally.',
                                isSyncing: false
                            });
                        }
                    }
                },

                removePosition: async (id, symbol, userId) => {
                    // Store old positions for potential rollback
                    const oldPositions = get().positions;

                    // Optimistic update — instant UI response
                    set((state) => ({
                        positions: state.positions.filter((pos) => pos.id !== id),
                    }));

                    // Sync to Supabase only if user is logged in AND not a bypass user
                    if (userId && !userId.startsWith('bypass-')) {
                        set({ isSyncing: true });
                        try {
                            const success = await portfolioService.deletePosition(userId, symbol);
                            set({ isSyncing: false });
                            if (!success) {
                                // Rollback on failure
                                set({
                                    positions: oldPositions,
                                    error: 'Failed to delete position from database',
                                });
                            }
                        } catch (error) {
                            console.error('Error deleting position:', error);
                            // Rollback on error
                            set({
                                positions: oldPositions,
                                error: 'Failed to delete position',
                                isSyncing: false
                            });
                        }
                    }
                },

                updatePrice: async (symbol, price, userId, isFallback?: boolean) => {
                    // Optimistic update
                    set((state) => ({
                        positions: state.positions.map((pos) => {
                            if (pos.symbol !== symbol) return pos;

                            const marketValue = pos.units * price;
                            const { amount, percent } = calculateProfitLoss(price, pos.avgCost, pos.units);

                            return {
                                ...pos,
                                currentPrice: price,
                                marketValue,
                                profitLoss: amount,
                                profitLossPercent: percent,
                                isFallback: isFallback ?? pos.isFallback,
                            };
                        }),
                    }));

                    // Sync to Supabase only if user is logged in AND not a bypass user
                    if (userId && !userId.startsWith('bypass-')) {
                        try {
                            await portfolioService.updatePriceForSymbol(userId, symbol, price);
                        } catch (error) {
                            console.error('Error updating price in database:', error);
                            // Don't rollback price updates as they're frequently updated
                        }
                    }
                },

                syncPrices: async () => {
                    const positions = get().positions;
                    if (positions.length === 0) return;

                    try {
                        const { getMultipleQuotes } = await import('../services/stockDataService');
                        const { fetchExchangeRates, convertToUSD } = await import('../services/currencyService');
                        
                        // Parallel fetch exchange rates and quotes
                        const [quotes, rates] = await Promise.all([
                            getMultipleQuotes(positions.map(p => p.symbol)),
                            fetchExchangeRates()
                        ]);

                        set((state) => ({
                            positions: state.positions.map(pos => {
                                const quote = quotes.get(pos.symbol);
                                if (!quote || quote.price <= 0) return pos;

                                const marketValue = pos.units * quote.price;
                                const { amount, percent } = calculateProfitLoss(quote.price, pos.avgCost, pos.units);
                                
                                // Normalized value calculation
                                const currency = pos.currency || (pos.symbol.includes('.CA') ? 'EGP' : pos.symbol.includes('.AD') ? 'AED' : 'USD');
                                const marketValueUSD = convertToUSD(marketValue, currency, rates);
                                const purchaseValueUSD = convertToUSD(pos.purchaseValue, currency, rates);

                                return {
                                    ...pos,
                                    currentPrice: quote.price,
                                    marketValue,
                                    marketValueUSD,
                                    purchaseValueUSD, // Added new field to state
                                    currency,
                                    profitLoss: amount,
                                    profitLossPercent: percent,
                                    isFallback: quote.isFallback,
                                };
                            })
                        }));
                    } catch (error) {
                        console.error('Error syncing portfolio prices:', error);
                    }
                },

                loadFromSupabase: async (userId: string) => {
                    if (!userId || userId.startsWith('bypass-')) return;
                    set({ isLoading: true, error: null });
                    try {
                        const positions = await portfolioService.fetchUserPortfolios(userId);
                        set({
                            positions,
                            isLoading: false,
                            error: null,
                        });
                        // Trigger immediate sync to get fresh prices and normalization
                        get().syncPrices();
                    } catch (error) {
                        console.error('Error loading portfolios from Supabase:', error);
                        set({
                            isLoading: false,
                            error: 'Failed to load portfolios',
                        });
                    }
                },

                syncWithSupabase: async (userId: string) => {
                    if (!userId || userId.startsWith('bypass-')) return;

                    // Guard against multiple simultaneous syncs
                    if (get().isSyncing) return;

                    set({ isSyncing: true });
                    try {
                        // 1. Load what's in the cloud first — this is the source of truth
                        const cloudPositions = await portfolioService.fetchUserPortfolios(userId);
                        const cloudSymbols = new Set(cloudPositions.map(p => p.symbol));

                        // 2. Only upload local positions that don't exist in the cloud yet
                        //    (never re-upload items that may have been deleted from the cloud)
                        const localPositions = get().positions;
                        const newLocalPositions = localPositions.filter(p => !cloudSymbols.has(p.symbol));
                        if (newLocalPositions.length > 0) {
                            await portfolioService.syncLocalToSupabase(userId, newLocalPositions);
                            // Re-fetch after uploading new ones
                            const updatedPositions = await portfolioService.fetchUserPortfolios(userId);
                            set({ positions: updatedPositions, isSyncing: false, error: null });
                        } else {
                            // Cloud is the authority — use it directly
                            set({ positions: cloudPositions, isSyncing: false, error: null });
                        }
                        // Refresh prices after sync
                        get().syncPrices();
                    } catch (error) {
                        console.error('Error syncing portfolios:', error);
                        set({ isSyncing: false, error: 'Failed to sync portfolios' });
                    }
                },

                initRealtimeSubscription: (userId: string) => {
                    if (!userId || userId.startsWith('bypass-')) return () => { };

                    const channel = supabase
                        .channel(`portfolio-changes-${userId}`)
                        .on(
                            'postgres_changes',
                            {
                                event: '*',
                                schema: 'public',
                                table: 'portfolios',
                                filter: `user_id=eq.${userId}`
                            },
                            async (payload) => {

                                // Reload all positions to ensure consistency and correct derived fields
                                try {
                                    const positions = await portfolioService.fetchUserPortfolios(userId);
                                    set({ positions });
                                    get().syncPrices();
                                } catch (err) {
                                    console.error('Failed to reload positions on realtime event:', err);
                                }
                            }
                        )
                        .subscribe();

                    return () => {
                        supabase.removeChannel(channel);
                    };
                },

                getSummary: () => {
                    const positions = get().positions;
                    const totalValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
                    const totalCost = positions.reduce((sum, pos) => sum + pos.purchaseValue, 0);
                    
                    // Normalized sum in USD
                    const normalizedTotalValueUSD = positions.reduce((sum, pos) => sum + (pos.marketValueUSD || 0), 0);
                    const normalizedTotalCostUSD = positions.reduce((sum, pos) => sum + (pos.purchaseValueUSD || 0), 0);
                    
                    // Global P/L based on normalized USD values
                    const totalProfitLossUSD = normalizedTotalValueUSD - normalizedTotalCostUSD;
                    const totalProfitLossPercentUSD = normalizedTotalCostUSD > 0 ? (totalProfitLossUSD / normalizedTotalCostUSD) * 100 : 0;

                    return {
                        totalValue,
                        normalizedTotalValueUSD,
                        totalCost,
                        normalizedTotalCostUSD,
                        totalProfitLoss: totalProfitLossUSD, // We give preference to the normalized USD profit/loss
                        totalProfitLossPercent: totalProfitLossPercentUSD,
                        positions,
                    };
                },

                getAdvancedMetrics: () => {
                    const positions = get().positions;
                    const totalValue = positions.reduce((sum, p) => sum + p.marketValue, 0);

                    if (totalValue === 0) {
                        return {
                            diversificationScore: 0,
                            concentrationRisk: 'Low',
                            weightedRsi: null,
                            regionalBreakdown: { us: 0, egypt: 0, uae: 0 },
                            sectorMomentum: {}
                        };
                    }

                    // 1. Diversification (HHI)
                    // HHI = sum of (weight^2) * 100
                    const hhi = positions.reduce((sum, p) => {
                        const weight = (p.marketValue / totalValue) * 100;
                        return sum + (weight * weight);
                    }, 0);

                    // Normalize HHI (10000 = max concentration, 0 = min concentration)
                    // We want 100 to be "Highly Diversified"
                    const divScore = Math.max(0, 100 - (hhi / 100)); // Simple normalization
                    const concentrationRisk = divScore > 80 ? 'Low' : divScore > 50 ? 'Medium' : 'High';

                    // 2. Regional Breakdown
                    const regional = { us: 0, egypt: 0, uae: 0 };
                    positions.forEach(p => {
                        const market = getMarketForSymbol(p.symbol);
                        if (market === 'us') regional.us += p.marketValue;
                        else if (market === 'egypt') regional.egypt += p.marketValue;
                        else if (market === 'abudhabi') regional.uae += p.marketValue;
                    });

                    // Convert to percentages
                    regional.us = (regional.us / totalValue) * 100;
                    regional.egypt = (regional.egypt / totalValue) * 100;
                    regional.uae = (regional.uae / totalValue) * 100;

                    // 3. Sector Momentum (Simplified as avg. P/L % per sector)
                    const sectorPL: Record<string, { total: number, count: number }> = {};
                    positions.forEach(p => {
                        const sector = p.sector || 'Other';
                        if (!sectorPL[sector]) sectorPL[sector] = { total: 0, count: 0 };
                        sectorPL[sector].total += p.profitLossPercent || 0;
                        sectorPL[sector].count += 1;
                    });

                    const sectorMomentum: Record<string, number> = {};
                    Object.entries(sectorPL).forEach(([sector, data]) => {
                        sectorMomentum[sector] = data.total / data.count;
                    });

                    return {
                        diversificationScore: divScore,
                        concentrationRisk,
                        weightedRsi: null, // RSI requires separate fetching logic
                        regionalBreakdown: regional,
                        sectorMomentum
                    };
                },

                clearPositions: () => set({ positions: [], error: null }),

                clearError: () => set({ error: null }),
            };
        },
        {
            name: 'portfolio-storage',
            partialize: (state) => ({ positions: state.positions }),
            onRehydrateStorage: () => (state) => {
            }
        }
    )
);
