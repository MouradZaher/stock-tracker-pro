import { create, type StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PortfolioPosition, PortfolioSummary } from '../types';
import { calculateProfitLoss } from '../utils/calculations';
import { getSectorForSymbol } from '../data/sectors';

interface PortfolioStore {
    positions: PortfolioPosition[];
    addPosition: (position: Omit<PortfolioPosition, 'id' | 'profitLoss' | 'profitLossPercent' | 'marketValue' | 'purchaseValue'>) => void;
    updatePosition: (id: string, updates: Partial<PortfolioPosition>) => void;
    removePosition: (id: string) => void;
    updatePrice: (symbol: string, price: number) => void;
    getSummary: () => PortfolioSummary;
}

export const usePortfolioStore = create<PortfolioStore>()(
    persist<PortfolioStore>(
        (set, get) => ({
            positions: [],

            addPosition: (position) => {
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

                set((state) => ({
                    positions: [...state.positions, newPosition],
                }));
            },

            updatePosition: (id, updates) => {
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
            },

            removePosition: (id) => {
                set((state) => ({
                    positions: state.positions.filter((pos) => pos.id !== id),
                }));
            },

            updatePrice: (symbol, price) => {
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
        }),
        {
            name: 'portfolio-storage',
        }
    )
);
