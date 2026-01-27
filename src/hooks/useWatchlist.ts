import { create } from 'zustand';
import { persist } from 'zustand/middleware';


interface WatchlistState {
    watchlist: string[];
    addToWatchlist: (symbol: string) => void;
    removeFromWatchlist: (symbol: string) => void;
    isInWatchlist: (symbol: string) => boolean;
}

export const useWatchlist = create<WatchlistState>()(
    persist(
        (set, get) => ({
            watchlist: [],
            addToWatchlist: (symbol) =>
                set((state) => ({
                    watchlist: state.watchlist.includes(symbol)
                        ? state.watchlist
                        : [...state.watchlist, symbol]
                })),
            removeFromWatchlist: (symbol) =>
                set((state) => ({
                    watchlist: state.watchlist.filter((s) => s !== symbol)
                })),
            isInWatchlist: (symbol) => get().watchlist.includes(symbol),
        }),
        {
            name: 'stock-watchlist',
        }
    )
);
