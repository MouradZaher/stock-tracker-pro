import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as watchlistService from '../services/watchlistService';

interface WatchlistState {
    watchlist: string[];
    isLoading: boolean;
    isSyncing: boolean;
    error: string | null;

    // Local state actions (with Supabase sync)
    addToWatchlist: (symbol: string, userId?: string) => Promise<void>;
    removeFromWatchlist: (symbol: string, userId?: string) => Promise<void>;
    isInWatchlist: (symbol: string) => boolean;

    // Supabase sync actions
    syncWithSupabase: (userId: string) => Promise<void>;
    loadFromSupabase: (userId: string) => Promise<void>;

    // Utility actions
    clearError: () => void;
}

export const useWatchlist = create<WatchlistState>()(
    persist<WatchlistState>(
        (set, get) => ({
            watchlist: [],
            isLoading: false,
            isSyncing: false,
            error: null,

            addToWatchlist: async (symbol, userId) => {
                const normalizedSymbol = symbol.trim().toUpperCase();

                // Check if already in watchlist
                if (get().watchlist.includes(normalizedSymbol)) {
                    return;
                }

                // Optimistic update
                set((state) => ({
                    watchlist: [...state.watchlist, normalizedSymbol],
                }));

                // Sync to Supabase only if user is logged in AND not a bypass user
                if (userId && !userId.startsWith('bypass-')) {
                    try {
                        const success = await watchlistService.addSymbol(userId, normalizedSymbol);
                        if (!success) {
                            // Rollback on failure
                            set((state) => ({
                                watchlist: state.watchlist.filter(s => s !== normalizedSymbol),
                                error: 'Failed to add symbol to database',
                            }));
                        }
                    } catch (error) {
                        console.error('Error adding to watchlist:', error);
                        // Rollback on error
                        set((state) => ({
                            watchlist: state.watchlist.filter(s => s !== normalizedSymbol),
                            error: 'Failed to add symbol',
                        }));
                    }
                }
            },

            removeFromWatchlist: async (symbol, userId) => {
                const normalizedSymbol = symbol.trim().toUpperCase();

                // Store old watchlist for potential rollback
                const oldWatchlist = get().watchlist;

                // Optimistic update
                set((state) => ({
                    watchlist: state.watchlist.filter((s) => s !== normalizedSymbol),
                }));

                // Sync to Supabase only if user is logged in AND not a bypass user
                if (userId && !userId.startsWith('bypass-')) {
                    try {
                        const success = await watchlistService.removeSymbol(userId, normalizedSymbol);
                        if (!success) {
                            // Rollback on failure
                            set({
                                watchlist: oldWatchlist,
                                error: 'Failed to remove symbol from database',
                            });
                        }
                    } catch (error) {
                        console.error('Error removing from watchlist:', error);
                        // Rollback on error
                        set({
                            watchlist: oldWatchlist,
                            error: 'Failed to remove symbol',
                        });
                    }
                }
            },

            isInWatchlist: (symbol) => {
                const normalizedSymbol = symbol.trim().toUpperCase();
                return get().watchlist.includes(normalizedSymbol);
            },

            loadFromSupabase: async (userId: string) => {
                set({ isLoading: true, error: null });
                try {
                    const watchlist = await watchlistService.fetchUserWatchlist(userId);
                    set({
                        watchlist,
                        isLoading: false,
                        error: null,
                    });
                    console.log(`✅ Loaded ${watchlist.length} symbols from Supabase`);
                } catch (error) {
                    console.error('Error loading watchlist from Supabase:', error);
                    set({
                        isLoading: false,
                        error: 'Failed to load watchlist',
                    });
                }
            },

            syncWithSupabase: async (userId: string) => {
                set({ isSyncing: true, error: null });
                try {
                    const localWatchlist = get().watchlist;

                    // Sync local watchlist to Supabase (one-time migration)
                    await watchlistService.syncLocalToSupabase(userId, localWatchlist);

                    // Load the merged data from Supabase
                    const watchlist = await watchlistService.fetchUserWatchlist(userId);
                    set({
                        watchlist,
                        isSyncing: false,
                        error: null,
                    });

                    console.log('✅ Watchlist sync completed');
                } catch (error) {
                    console.error('Error syncing watchlist:', error);
                    set({
                        isSyncing: false,
                        error: 'Failed to sync watchlist',
                    });
                }
            },

            clearError: () => set({ error: null }),
        }),
        {
            name: 'stock-watchlist',
        }
    )
);
