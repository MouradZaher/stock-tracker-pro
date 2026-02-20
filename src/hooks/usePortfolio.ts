import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PortfolioPosition, PortfolioSummary } from '../types';
import { calculateProfitLoss } from '../utils/calculations';
import { getSectorForSymbol } from '../data/sectors';
import * as portfolioService from '../services/portfolioService';
import { supabase } from '../services/supabase';

interface PortfolioStore {
    positions: PortfolioPosition[];
    isLoading: boolean;
    isSyncing: boolean;
    error: string | null;

    // Local state actions (with Supabase sync)
    addPosition: (position: Omit<PortfolioPosition, 'id' | 'profitLoss' | 'profitLossPercent' | 'marketValue' | 'purchaseValue'>, userId?: string) => Promise<void>;
    updatePosition: (id: string, updates: Partial<PortfolioPosition>, userId?: string) => Promise<void>;
    removePosition: (id: string, symbol: string, userId?: string) => Promise<void>;
    updatePrice: (symbol: string, price: number, userId?: string) => Promise<void>;

    // Supabase sync actions
    syncWithSupabase: (userId: string) => Promise<void>;
    loadFromSupabase: (userId: string) => Promise<void>;
    initRealtimeSubscription: (userId: string) => () => void;

    // Utility actions
    getSummary: () => PortfolioSummary;
    clearPositions: () => void;
    clearError: () => void;
}

export const usePortfolioStore = create<PortfolioStore>()(
    persist(
        (set, get) => {
            console.log('📊 Initializing usePortfolioStore...');
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
                        try {
                            const success = await portfolioService.savePosition(userId, newPosition);
                            if (!success) {
                                // Rollback on failure
                                set((state) => ({
                                    positions: state.positions.filter(p => p.id !== id),
                                    error: 'Failed to save position to database',
                                }));
                            }
                        } catch (error) {
                            console.error('Error saving position:', error);
                            // Rollback on error
                            set((state) => ({
                                positions: state.positions.filter(p => p.id !== id),
                                error: 'Failed to save position',
                            }));
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
                        try {
                            const updatedPosition = get().positions.find(p => p.id === id);
                            if (updatedPosition) {
                                const success = await portfolioService.savePosition(userId, updatedPosition);
                                if (!success) {
                                    // Rollback on failure
                                    set((state) => ({
                                        positions: state.positions.map(p => p.id === id ? oldPosition : p),
                                        error: 'Failed to update position in database',
                                    }));
                                }
                            }
                        } catch (error) {
                            console.error('Error updating position:', error);
                            // Rollback on error
                            set((state) => ({
                                positions: state.positions.map(p => p.id === id ? oldPosition : p),
                                error: 'Failed to update position',
                            }));
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
                        try {
                            const success = await portfolioService.deletePosition(userId, symbol);
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
                            });
                        }
                    }
                },

                updatePrice: async (symbol, price, userId) => {
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
                                console.log('🔄 Realtime portfolio change:', payload.eventType);

                                // Reload all positions to ensure consistency and correct derived fields
                                try {
                                    const positions = await portfolioService.fetchUserPortfolios(userId);
                                    set({ positions });
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
                    const totalProfitLoss = totalValue - totalCost;
                    const totalProfitLossPercent = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;

                    return {
                        totalValue,
                        totalCost,
                        totalProfitLoss,
                        totalProfitLossPercent,
                        positions,
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
                console.log('📦 Portfolio storage rehydrated:', state?.positions.length || 0, 'positions');
            }
        }
    )
);
