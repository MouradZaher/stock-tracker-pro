import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as watchlistService from '../services/watchlistService';

interface WatchlistState {
    marketWatchlists: Record<string, string[]>;
    isLoading: boolean;
    isSyncing: boolean;
    error: string | null;

    // Actions
    addToWatchlist: (symbol: string, marketId: string, userId?: string) => Promise<void>;
    removeFromWatchlist: (symbol: string, marketId: string, userId?: string) => Promise<void>;
    isInWatchlist: (symbol: string, marketId: string) => boolean;
    getWatchlistByMarket: (marketId: string) => string[];

    // Supabase sync actions
    syncWithSupabase: (userId: string) => Promise<void>;
    loadFromSupabase: (userId: string) => Promise<void>;

    // Utility actions
    clearWatchlist: (marketId?: string) => void;
    clearError: () => void;
}

export const useWatchlist = create<WatchlistState>()(
    persist(
        (set, get) => {
            return {
                marketWatchlists: {},
                isLoading: false,
                isSyncing: false,
                error: null,

                getWatchlistByMarket: (marketId) => {
                    return get().marketWatchlists[marketId] || [];
                },

                addToWatchlist: async (symbol, marketId, userId) => {
                    const normalizedSymbol = symbol.trim().toUpperCase();
                    const currentWatchlist = get().marketWatchlists[marketId] || [];

                    // Check if already in this market's watchlist
                    if (currentWatchlist.includes(normalizedSymbol)) {
                        return;
                    }

                    // Optimistic update
                    set((state) => ({
                        marketWatchlists: {
                            ...state.marketWatchlists,
                            [marketId]: [...currentWatchlist, normalizedSymbol]
                        }
                    }));

                    // Sync to Supabase only if user is logged in AND not a bypass user
                    if (userId && !userId.startsWith('bypass-')) {
                        try {
                            // In Supabase, we use a prefix or market_id if we had one.
                            // Since we don't have a market_id column yet, we'll store as "marketId:symbol"
                            const dbSymbol = `${marketId}:${normalizedSymbol}`;
                            const success = await watchlistService.addSymbol(userId, dbSymbol);
                            if (!success) {
                                // Rollback on failure
                                set((state) => ({
                                    marketWatchlists: {
                                        ...state.marketWatchlists,
                                        [marketId]: state.marketWatchlists[marketId]?.filter(s => s !== normalizedSymbol) || []
                                    },
                                    error: 'Failed to add symbol to database',
                                }));
                            }
                        } catch (error) {
                            console.error('Error adding to watchlist:', error);
                            // Rollback on error
                            set((state) => ({
                                marketWatchlists: {
                                    ...state.marketWatchlists,
                                    [marketId]: state.marketWatchlists[marketId]?.filter(s => s !== normalizedSymbol) || []
                                },
                                error: 'Failed to add symbol',
                            }));
                        }
                    }
                },

                removeFromWatchlist: async (symbol, marketId, userId) => {
                    const normalizedSymbol = symbol.trim().toUpperCase();
                    const oldWatchlists = { ...get().marketWatchlists };

                    // Optimistic update
                    set((state) => ({
                        marketWatchlists: {
                            ...state.marketWatchlists,
                            [marketId]: (state.marketWatchlists[marketId] || []).filter((s) => s !== normalizedSymbol),
                        }
                    }));

                    // Sync to Supabase only if user is logged in AND not a bypass user
                    if (userId && !userId.startsWith('bypass-')) {
                        try {
                            const dbSymbol = `${marketId}:${normalizedSymbol}`;
                            const success = await watchlistService.removeSymbol(userId, dbSymbol);
                            if (!success) {
                                // Rollback on failure
                                set({
                                    marketWatchlists: oldWatchlists,
                                    error: 'Failed to remove symbol from database',
                                });
                            }
                        } catch (error) {
                            console.error('Error removing from watchlist:', error);
                            // Rollback on error
                            set({
                                marketWatchlists: oldWatchlists,
                                error: 'Failed to remove symbol',
                            });
                        }
                    }
                },

                isInWatchlist: (symbol, marketId) => {
                    const normalizedSymbol = symbol.trim().toUpperCase();
                    return (get().marketWatchlists[marketId] || []).includes(normalizedSymbol);
                },

                loadFromSupabase: async (userId: string) => {
                    set({ isLoading: true, error: null });
                    try {
                        const rawWatchlist = await watchlistService.fetchUserWatchlist(userId);

                        // Parse prefixed symbols into marketWatchlists
                        const newMarketWatchlists: Record<string, string[]> = {};

                        rawWatchlist.forEach(item => {
                            if (item.includes(':')) {
                                const [marketId, symbol] = item.split(':');
                                if (!newMarketWatchlists[marketId]) newMarketWatchlists[marketId] = [];
                                newMarketWatchlists[marketId].push(symbol);
                            } else {
                                // Legacy support: Assume 'us' if no prefix
                                if (!newMarketWatchlists['us']) newMarketWatchlists['us'] = [];
                                newMarketWatchlists['us'].push(item);
                            }
                        });

                        set({
                            marketWatchlists: newMarketWatchlists,
                            isLoading: false,
                            error: null,
                        });
                    } catch (error) {
                        console.error('Error loading watchlist from Supabase:', error);
                        set({
                            isLoading: false,
                            error: 'Failed to load watchlist',
                        });
                    }
                },

                syncWithSupabase: async (userId: string) => {
                    if (!userId || userId.startsWith('bypass-')) return;

                    // Guard against multiple simultaneous syncs
                    if (get().isSyncing) return;

                    set({ isSyncing: true });
                    try {
                        const localMarketWatchlists = get().marketWatchlists;

                        // One-time migration: Sync all local prefixed symbols to Supabase
                        const allPrefixedSymbols: string[] = [];
                        Object.entries(localMarketWatchlists).forEach(([marketId, symbols]) => {
                            symbols.forEach(s => allPrefixedSymbols.push(`${marketId}:${s}`));
                        });

                        if (allPrefixedSymbols.length > 0) {
                            await watchlistService.syncLocalToSupabase(userId, allPrefixedSymbols);
                        }

                        // Load data from Supabase
                        const rawCloudWatchlist = await watchlistService.fetchUserWatchlist(userId);

                        if (rawCloudWatchlist.length > 0) {
                            const newMarketWatchlists: Record<string, string[]> = {};
                            rawCloudWatchlist.forEach(item => {
                                if (item.includes(':')) {
                                    const [marketId, symbol] = item.split(':');
                                    if (!newMarketWatchlists[marketId]) newMarketWatchlists[marketId] = [];
                                    newMarketWatchlists[marketId].push(symbol);
                                } else {
                                    if (!newMarketWatchlists['us']) newMarketWatchlists['us'] = [];
                                    newMarketWatchlists['us'].push(item);
                                }
                            });
                            set({ marketWatchlists: newMarketWatchlists });
                        }

                        set({ isSyncing: false, error: null });
                    } catch (error) {
                        console.error('Error syncing watchlist:', error);
                        set({ isSyncing: false, error: 'Failed to sync watchlist' });
                    }
                },

                clearWatchlist: (marketId) => {
                    if (marketId) {
                        set((state) => ({
                            marketWatchlists: {
                                ...state.marketWatchlists,
                                [marketId]: []
                            },
                            error: null
                        }));
                    } else {
                        set({ marketWatchlists: {}, error: null });
                    }
                },

                clearError: () => set({ error: null }),
            };
        },
        {
            name: 'stock-watchlist-v2', // Changed name to force re-evaluation if needed, but we can also handle migration
            partialize: (state) => ({ marketWatchlists: state.marketWatchlists }),
            version: 1,
            migrate: (persistedState: any, version) => {
                if (version === 0 && persistedState.watchlist) {
                    // Migrate from old watchlist array to US market
                    return {
                        ...persistedState,
                        marketWatchlists: {
                            us: persistedState.watchlist
                        }
                    };
                }
                return persistedState;
            }
        }
    )
);

