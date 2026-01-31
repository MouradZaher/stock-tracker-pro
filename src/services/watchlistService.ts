import { supabase } from './supabase';

export interface SupabaseWatchlist {
    id: string;
    user_id: string;
    symbol: string;
    created_at: string;
}

/**
 * Fetch all watchlist symbols for a user
 */
export async function fetchUserWatchlist(userId: string): Promise<string[]> {
    try {
        const { data, error } = await supabase
            .from('watchlists')
            .select('symbol')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching watchlist:', error);
            throw error;
        }

        return (data || []).map(item => item.symbol);
    } catch (error) {
        console.error('Failed to fetch user watchlist:', error);
        return [];
    }
}

/**
 * Add a symbol to the watchlist
 */
export async function addSymbol(userId: string, symbol: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('watchlists')
            .insert({
                user_id: userId,
                symbol: symbol.trim().toUpperCase(),
            });

        if (error) {
            // Ignore duplicate key errors (symbol already in watchlist)
            if (error.code === '23505') {
                console.log('Symbol already in watchlist');
                return true;
            }
            throw error;
        }

        return true;
    } catch (error) {
        console.error('Failed to add symbol to watchlist:', error);
        return false;
    }
}

/**
 * Remove a symbol from the watchlist
 */
export async function removeSymbol(userId: string, symbol: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('watchlists')
            .delete()
            .eq('user_id', userId)
            .eq('symbol', symbol.trim().toUpperCase());

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Failed to remove symbol from watchlist:', error);
        return false;
    }
}

/**
 * Sync local storage watchlist to Supabase (migration helper)
 */
export async function syncLocalToSupabase(userId: string, localSymbols: string[]): Promise<void> {
    try {
        // Fetch existing watchlist from Supabase
        const existingSymbols = await fetchUserWatchlist(userId);
        const existingSet = new Set(existingSymbols);

        // Only sync symbols that don't exist in Supabase
        const symbolsToSync = localSymbols.filter(symbol => !existingSet.has(symbol));

        if (symbolsToSync.length === 0) {
            console.log('No new watchlist symbols to sync');
            return;
        }

        // Batch insert new symbols
        const watchlistData = symbolsToSync.map(symbol => ({
            user_id: userId,
            symbol: symbol.trim().toUpperCase(),
        }));

        const { error } = await supabase
            .from('watchlists')
            .insert(watchlistData);

        if (error) throw error;

        console.log(`✅ Synced ${symbolsToSync.length} watchlist symbols to Supabase`);
    } catch (error) {
        console.error('Failed to sync local watchlist to Supabase:', error);
        throw error;
    }
}

/**
 * Clear all watchlist entries for a user
 */
export async function clearWatchlist(userId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('watchlists')
            .delete()
            .eq('user_id', userId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Failed to clear watchlist:', error);
        return false;
    }
}
