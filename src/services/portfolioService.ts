import { supabase } from './supabase';
import type { PortfolioPosition, Dividend } from '../types';

export interface SupabasePortfolio {
    id: string;
    user_id: string;
    symbol: string;
    name: string;
    units: number;
    avg_cost: number;
    current_price: number;
    sector: string | null;
    dividends: Dividend[];
    created_at: string;
    updated_at: string;
}

/**
 * Fetch all portfolio positions for a user
 */
export async function fetchUserPortfolios(userId: string): Promise<PortfolioPosition[]> {
    try {
        const { data, error } = await supabase
            .from('portfolios')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching portfolios:', error);
            throw error;
        }

        // Convert database format to app format
        return (data || []).map(dbPortfolio => convertToPortfolioPosition(dbPortfolio));
    } catch (error) {
        console.error('Failed to fetch user portfolios:', error);
        return [];
    }
}

/**
 * Save or update a portfolio position
 */
export async function savePosition(userId: string, position: PortfolioPosition): Promise<boolean> {
    try {
        // Check if position exists
        const { data: existing } = await supabase
            .from('portfolios')
            .select('id')
            .eq('user_id', userId)
            .eq('symbol', position.symbol)
            .eq('created_at', position.id.split('-')[1] || new Date().toISOString())
            .single();

        const portfolioData = {
            user_id: userId,
            symbol: position.symbol,
            name: position.name,
            units: position.units,
            avg_cost: position.avgCost,
            current_price: position.currentPrice,
            sector: position.sector,
            dividends: position.dividends || [],
        };

        if (existing) {
            // Update existing position
            const { error } = await supabase
                .from('portfolios')
                .update(portfolioData)
                .eq('id', existing.id);

            if (error) throw error;
        } else {
            // Insert new position
            const { error } = await supabase
                .from('portfolios')
                .insert(portfolioData);

            if (error) throw error;
        }

        return true;
    } catch (error) {
        console.error('Failed to save position:', error);
        return false;
    }
}

/**
 * Delete a portfolio position
 */
export async function deletePosition(userId: string, positionId: string): Promise<boolean> {
    try {
        // Extract symbol and timestamp from position ID (format: SYMBOL-TIMESTAMP)
        const [symbol, timestamp] = positionId.split('-');

        const { error } = await supabase
            .from('portfolios')
            .delete()
            .eq('user_id', userId)
            .eq('symbol', symbol);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Failed to delete position:', error);
        return false;
    }
}

/**
 * Update the current price for a symbol across all positions
 */
export async function updatePriceForSymbol(userId: string, symbol: string, price: number): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('portfolios')
            .update({ current_price: price })
            .eq('user_id', userId)
            .eq('symbol', symbol);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Failed to update price:', error);
        return false;
    }
}

/**
 * Sync local storage positions to Supabase (migration helper)
 */
export async function syncLocalToSupabase(userId: string, localPositions: PortfolioPosition[]): Promise<void> {
    try {
        // Fetch existing positions from Supabase
        const existingPositions = await fetchUserPortfolios(userId);
        const existingSymbols = new Set(existingPositions.map(p => p.symbol));

        // Only sync positions that don't exist in Supabase
        const positionsToSync = localPositions.filter(p => !existingSymbols.has(p.symbol));

        if (positionsToSync.length === 0) {
            console.log('No new positions to sync');
            return;
        }

        // Batch insert new positions
        const portfolioData = positionsToSync.map(position => ({
            user_id: userId,
            symbol: position.symbol,
            name: position.name,
            units: position.units,
            avg_cost: position.avgCost,
            current_price: position.currentPrice,
            sector: position.sector,
            dividends: position.dividends || [],
        }));

        const { error } = await supabase
            .from('portfolios')
            .insert(portfolioData);

        if (error) throw error;

        console.log(`✅ Synced ${positionsToSync.length} positions to Supabase`);
    } catch (error) {
        console.error('Failed to sync local positions to Supabase:', error);
        throw error;
    }
}

/**
 * Convert database format to app PortfolioPosition format
 */
function convertToPortfolioPosition(dbPortfolio: SupabasePortfolio): PortfolioPosition {
    const purchaseValue = dbPortfolio.units * dbPortfolio.avg_cost;
    const marketValue = dbPortfolio.units * dbPortfolio.current_price;
    const profitLoss = marketValue - purchaseValue;
    const profitLossPercent = purchaseValue > 0 ? (profitLoss / purchaseValue) * 100 : 0;

    return {
        id: `${dbPortfolio.symbol}-${new Date(dbPortfolio.created_at).getTime()}`,
        symbol: dbPortfolio.symbol,
        name: dbPortfolio.name,
        units: dbPortfolio.units,
        avgCost: dbPortfolio.avg_cost,
        purchaseValue,
        currentPrice: dbPortfolio.current_price,
        marketValue,
        profitLoss,
        profitLossPercent,
        sector: dbPortfolio.sector || '',
        dividends: dbPortfolio.dividends || [],
    };
}
