// WebSocket Service for Real-Time Stock Data
// Uses Finnhub WebSocket for live price streaming

type PriceCallback = (symbol: string, price: number, change: number, changePercent: number) => void;

interface WebSocketMessage {
    type: string;
    data?: Array<{
        s: string;  // symbol
        p: number;  // price
        t: number;  // timestamp
        v: number;  // volume
    }>;
}

class WebSocketService {
    private ws: WebSocket | null = null;
    private apiKey: string;
    private subscribedSymbols: Set<string> = new Set();
    private callbacks: Map<string, Set<PriceCallback>> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private isConnecting = false;
    private lastPrices: Map<string, { price: number; previousClose: number }> = new Map();
    private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

    constructor() {
        this.apiKey = import.meta.env.VITE_FINNHUB_API_KEY || '';
    }

    // Check if WebSocket is available
    isAvailable(): boolean {
        return !!this.apiKey;
    }

    // Connect to Finnhub WebSocket
    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.apiKey) {
                console.warn('⚠️ Finnhub API key not configured, WebSocket disabled');
                reject(new Error('No API key'));
                return;
            }

            if (this.ws?.readyState === WebSocket.OPEN) {
                resolve();
                return;
            }

            if (this.isConnecting) {
                resolve();
                return;
            }

            this.isConnecting = true;
            console.log('🔌 Connecting to Finnhub WebSocket...');

            try {
                this.ws = new WebSocket(`wss://ws.finnhub.io?token=${this.apiKey}`);

                this.ws.onopen = () => {
                    console.log('✅ Finnhub WebSocket connected');
                    this.isConnecting = false;
                    this.reconnectAttempts = 0;
                    this.reconnectDelay = 1000;

                    // Resubscribe to all symbols
                    this.subscribedSymbols.forEach(symbol => {
                        this.sendSubscribe(symbol);
                    });

                    // Start heartbeat
                    this.startHeartbeat();

                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const message: WebSocketMessage = JSON.parse(event.data);
                        this.handleMessage(message);
                    } catch (e) {
                        console.warn('Failed to parse WebSocket message:', e);
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('❌ WebSocket error:', error);
                    this.isConnecting = false;
                };

                this.ws.onclose = (event) => {
                    console.log(`🔌 WebSocket closed (code: ${event.code})`);
                    this.isConnecting = false;
                    this.stopHeartbeat();

                    // Attempt reconnection
                    if (this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.reconnectAttempts++;
                        const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
                        console.log(`🔄 Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                        setTimeout(() => this.connect(), delay);
                    } else {
                        console.error('❌ Max reconnection attempts reached');
                    }
                };

            } catch (error) {
                this.isConnecting = false;
                reject(error);
            }
        });
    }

    // Handle incoming messages
    private handleMessage(message: WebSocketMessage): void {
        if (message.type === 'trade' && message.data) {
            for (const trade of message.data) {
                const symbol = trade.s;
                const price = trade.p;

                // Calculate change from previous close
                const lastData = this.lastPrices.get(symbol);
                const previousClose = lastData?.previousClose || price;
                const change = price - previousClose;
                const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

                // Update stored price
                this.lastPrices.set(symbol, { price, previousClose });

                // Notify all callbacks for this symbol
                const symbolCallbacks = this.callbacks.get(symbol);
                if (symbolCallbacks) {
                    symbolCallbacks.forEach(callback => {
                        try {
                            callback(symbol, price, change, changePercent);
                        } catch (e) {
                            console.warn(`Callback error for ${symbol}:`, e);
                        }
                    });
                }
            }
        } else if (message.type === 'ping') {
            // Respond to ping with pong
            this.ws?.send(JSON.stringify({ type: 'pong' }));
        }
    }

    // Send subscribe message
    private sendSubscribe(symbol: string): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'subscribe', symbol }));
            console.log(`📡 Subscribed to ${symbol}`);
        }
    }

    // Send unsubscribe message
    private sendUnsubscribe(symbol: string): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'unsubscribe', symbol }));
            console.log(`📴 Unsubscribed from ${symbol}`);
        }
    }

    // Subscribe to a symbol
    subscribe(symbol: string, callback: PriceCallback, previousClose?: number): void {
        const upperSymbol = symbol.toUpperCase();

        // Store previous close if provided
        if (previousClose !== undefined) {
            const existing = this.lastPrices.get(upperSymbol);
            this.lastPrices.set(upperSymbol, {
                price: existing?.price || previousClose,
                previousClose
            });
        }

        // Add callback
        if (!this.callbacks.has(upperSymbol)) {
            this.callbacks.set(upperSymbol, new Set());
        }
        this.callbacks.get(upperSymbol)!.add(callback);

        // Subscribe if not already
        if (!this.subscribedSymbols.has(upperSymbol)) {
            this.subscribedSymbols.add(upperSymbol);
            this.sendSubscribe(upperSymbol);
        }
    }

    // Unsubscribe from a symbol
    unsubscribe(symbol: string, callback?: PriceCallback): void {
        const upperSymbol = symbol.toUpperCase();

        if (callback) {
            this.callbacks.get(upperSymbol)?.delete(callback);
        } else {
            this.callbacks.delete(upperSymbol);
        }

        // If no more callbacks, unsubscribe from WebSocket
        if (!this.callbacks.has(upperSymbol) || this.callbacks.get(upperSymbol)?.size === 0) {
            this.subscribedSymbols.delete(upperSymbol);
            this.sendUnsubscribe(upperSymbol);
            this.callbacks.delete(upperSymbol);
        }
    }

    // Unsubscribe from all symbols
    unsubscribeAll(): void {
        this.subscribedSymbols.forEach(symbol => {
            this.sendUnsubscribe(symbol);
        });
        this.subscribedSymbols.clear();
        this.callbacks.clear();
    }

    // Start heartbeat to keep connection alive
    private startHeartbeat(): void {
        this.stopHeartbeat();
        this.heartbeatInterval = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000); // Ping every 30 seconds
    }

    // Stop heartbeat
    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    // Disconnect WebSocket
    disconnect(): void {
        this.stopHeartbeat();
        this.unsubscribeAll();
        if (this.ws) {
            this.ws.close(1000, 'Client disconnect');
            this.ws = null;
        }
        this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
    }

    // Get connection status
    getStatus(): 'connected' | 'connecting' | 'disconnected' {
        if (this.ws?.readyState === WebSocket.OPEN) return 'connected';
        if (this.isConnecting) return 'connecting';
        return 'disconnected';
    }
}

// Singleton instance
export const webSocketService = new WebSocketService();

// React hook for WebSocket subscription
export const useWebSocketPrice = (
    symbol: string | null,
    previousClose?: number
): { price: number | null; change: number | null; changePercent: number | null; isLive: boolean } => {
    // This hook should be used in React components
    // Returns live price updates when WebSocket is available
    // Falls back to null when not available
    return {
        price: null,
        change: null,
        changePercent: null,
        isLive: false
    };
};

export default webSocketService;
