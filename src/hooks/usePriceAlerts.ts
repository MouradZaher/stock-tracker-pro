import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

export interface PriceAlert {
    id: string;
    symbol: string;
    targetPrice: number;
    condition: 'above' | 'below';
    active: boolean;
    createdAt: number;
}

interface PriceAlertsState {
    alerts: PriceAlert[];
    addAlert: (symbol: string, targetPrice: number, condition: 'above' | 'below') => void;
    removeAlert: (id: string) => void;
    toggleAlert: (id: string) => void;
    checkPrice: (symbol: string, currentPrice: number) => void;
}

export const usePriceAlerts = create<PriceAlertsState>()(
    persist(
        (set, get) => ({
            alerts: [],

            addAlert: (symbol, targetPrice, condition) => {
                const id = `${symbol}-${targetPrice}-${Date.now()}`;
                const newAlert: PriceAlert = {
                    id,
                    symbol,
                    targetPrice,
                    condition,
                    active: true,
                    createdAt: Date.now()
                };
                set((state) => ({ alerts: [...state.alerts, newAlert] }));
                toast.success(`Alert set for ${symbol} ${condition} ${targetPrice}`);
            },

            removeAlert: (id) => {
                set((state) => ({ alerts: state.alerts.filter(a => a.id !== id) }));
            },

            toggleAlert: (id) => {
                set((state) => ({
                    alerts: state.alerts.map(a => a.id === id ? { ...a, active: !a.active } : a)
                }));
            },

            checkPrice: (symbol, currentPrice) => {
                const { alerts, toggleAlert } = get();
                const symbolAlerts = alerts.filter(a => a.symbol === symbol && a.active);

                symbolAlerts.forEach(alert => {
                    let triggered = false;
                    if (alert.condition === 'above' && currentPrice >= alert.targetPrice) {
                        triggered = true;
                    } else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) {
                        triggered = true;
                    }

                    if (triggered) {
                        toast(`🚨 ${symbol} is now ${alert.condition} ${alert.targetPrice}! Current: ${currentPrice}`, {
                            duration: 6000,
                            icon: '💰',
                        });

                        // Dispatch event for Notification Hub
                        window.dispatchEvent(new CustomEvent('market-signal', {
                            detail: {
                                title: `${symbol} Price Alert`,
                                message: `${symbol} hit target of ${alert.targetPrice}. Current price: ${currentPrice}`,
                                type: 'alert'
                            }
                        }));

                        // Deactivate alert after trigger to avoid spam
                        toggleAlert(alert.id);
                    }
                });
            }
        }),
        {
            name: 'price-alerts-storage',
        }
    )
);
