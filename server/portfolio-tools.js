export const portfolioTools = [
  {
    type: "function",
    function: {
      name: "get_portfolio",
      description: "Get the user's current crypto and stock portfolio holdings, including unrealized gains and losses.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "execute_trade",
      description: "Simulates executing a market order trade for a given symbol and quantity.",
      parameters: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "The stock or crypto symbol to trade (e.g., AAPL, SOL-USD)."
          },
          action: {
            type: "string",
            description: "The action to take: 'BUY' or 'SELL'."
          },
          quantity: {
            type: "number",
            description: "The number of shares or tokens to trade."
          }
        },
        required: ["symbol", "action", "quantity"]
      }
    }
  }
];

// In a real app, these would come from a database or a wallet API.
export async function executePortfolioTool(toolName, args, history = []) {
  if (toolName === "get_portfolio") {
    // Return mock portfolio data mimicking the frontend Zustand store
    const mockPortfolio = [
      { id: '1', symbol: 'NVDA', name: 'NVIDIA Corp', shares: 50, avgPrice: 130.50, currentPrice: 145.20, marketValue: 7260, profitLoss: 735, profitLossPercent: 11.2, sector: 'Technology' },
      { id: '2', symbol: 'SOL-USD', name: 'Solana', shares: 120, avgPrice: 105.00, currentPrice: 142.10, marketValue: 17052, profitLoss: 4452, profitLossPercent: 35.33, sector: 'Crypto' },
      { id: '3', symbol: 'TSLA', name: 'Tesla Inc', shares: 20, avgPrice: 200.00, currentPrice: 185.50, marketValue: 3710, profitLoss: -290, profitLossPercent: -7.25, sector: 'Consumer Cyclical' }
    ];
    return JSON.stringify({ status: "success", holdings: mockPortfolio });
  }

  if (toolName === "execute_trade") {
    const { symbol, action, quantity } = args;
    // In reality, this would submit an order to an exchange.
    console.log(`[TRADE EXECUTED] ${action} ${quantity} ${symbol}`);
    
    return JSON.stringify({
      status: "success",
      message: `Successfully executed ${action} for ${quantity} shares/tokens of ${symbol}. The transaction has been recorded.`,
      transactionId: `TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    });
  }

  throw new Error(`Unknown portfolio tool: ${toolName}`);
}
