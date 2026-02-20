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
    clearWatchlist: () => void;
    clearError: () => void;
}

export const useWatchlist = create<WatchlistState>()(
    persist(
        (set, get) => {
            console.log('👀 Initializing useWatchlist store...');
            return {
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
                        const localWatchlist = get().watchlist;

                        // Sync local watchlist to Supabase (one-time migration)
                        if (localWatchlist.length > 0) {
                            await watchlistService.syncLocalToSupabase(userId, localWatchlist);
                        }

                        // Load data from Supabase
                        const cloudWatchlist = await watchlistService.fetchUserWatchlist(userId);

                        // Only overwrite if we found something
                        if (cloudWatchlist.length > 0) {
                            set({ watchlist: cloudWatchlist });
                        }

                        set({ isSyncing: false, error: null });
                    } catch (error) {
                        console.error('Error syncing watchlist:', error);
                        set({ isSyncing: false, error: 'Failed to sync watchlist' });
                    }
                },

                clearWatchlist: () => set({ watchlist: [], error: null }),

                clearError: () => set({ error: null }),
            };
        },
        {
            name: 'stock-watchlist',
            partialize: (state) => ({ watchlist: state.watchlist }),
            onRehydrateStorage: () => (state) => {
                console.log('📦 Watchlist storage rehydrated:', state?.watchlist.length || 0, 'symbols');
            }
        }
    )
);
