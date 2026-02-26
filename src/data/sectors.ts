// GICS Sectors
export const SECTORS = [
    'Technology',
    'Healthcare',
    'Financial Services',
    'Consumer Cyclical',
    'Industrials',
    'Communication Services',
    'Consumer Defensive',
    'Energy',
    'Utilities',
    'Real Estate',
    'Basic Materials',
    'Transportation',
    'Artificial Intelligence',
] as const;

export type Sector = typeof SECTORS[number];

// Regional Indices Stocks (LOCKED: approved 2026-02-25)
export const STOCKS_BY_INDEX: Record<string, { symbol: string; name: string }[]> = {
    'S&P 500': [
        { symbol: 'AAPL', name: 'Apple Inc.' },
        { symbol: 'MSFT', name: 'Microsoft Corp.' },
        { symbol: 'NVDA', name: 'NVIDIA Corp.' },
        { symbol: 'TSM', name: 'Taiwan Semiconductor' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.' },
        { symbol: 'META', name: 'Meta Platforms' },
        { symbol: 'TSLA', name: 'Tesla Inc.' },
        { symbol: 'BRK.B', name: 'Berkshire Hathaway' },
        { symbol: 'LLY', name: 'Eli Lilly & Co.' },
        { symbol: 'AVGO', name: 'Broadcom Inc.' },
        { symbol: 'JPM', name: 'JPMorgan Chase' },
        { symbol: 'UNH', name: 'UnitedHealth Group' },
        { symbol: 'V', name: 'Visa Inc.' },
        { symbol: 'MA', name: 'Mastercard Inc.' },
        { symbol: 'HD', name: 'Home Depot' },
        { symbol: 'PG', name: 'Procter & Gamble' },
        { symbol: 'COST', name: 'Costco Wholesale' },
        { symbol: 'JNJ', name: 'Johnson & Johnson' },
        { symbol: 'ABBV', name: 'AbbVie Inc.' },
        { symbol: 'MRK', name: 'Merck & Co.' },
        { symbol: 'ORCL', name: 'Oracle Corporation' },
        { symbol: 'ADBE', name: 'Adobe Inc.' },
        { symbol: 'CRM', name: 'Salesforce Inc.' },
        { symbol: 'AMD', name: 'Advanced Micro Devices' },
        { symbol: 'NFLX', name: 'Netflix Inc.' },
        { symbol: 'DIS', name: 'The Walt Disney Company' },
        { symbol: 'WMT', name: 'Walmart Inc.' },
        { symbol: 'BAC', name: 'Bank of America' },
        { symbol: 'WFC', name: 'Wells Fargo' },
        { symbol: 'CAT', name: 'Caterpillar Inc.' },
        { symbol: 'BA', name: 'Boeing Company' },
        { symbol: 'PLTR', name: 'Palantir Technologies' },
    ],
    'EGX 30': [
        { symbol: 'COMI', name: 'Commercial Intl Bank' },
        { symbol: 'TMGH', name: 'Talaat Moustafa Group' },
        { symbol: 'HRHO', name: 'EFG Hermes' },
        { symbol: 'EAST', name: 'Eastern Company' },
        { symbol: 'EFID', name: 'e-finance' },
        { symbol: 'EMFD', name: 'Emaar Misr' },
        { symbol: 'ADIB', name: 'ADIB Egypt' },
        { symbol: 'ETEL', name: 'Telecom Egypt' },
        { symbol: 'ABUK', name: 'Abu Qir Fertilizers' },
        { symbol: 'FWRY', name: 'Fawry' },
        { symbol: 'SWDY', name: 'Elsewedy Electric' },
        { symbol: 'ORAS', name: 'Orascom Construction' },
        { symbol: 'RAYA', name: 'Raya Holding' },
        { symbol: 'PHDC', name: 'Palm Hills' },
        { symbol: 'CLHO', name: 'Cleopatra Hospitals' },
    ],
    'FTSE ADX 15': [
        { symbol: 'IHC', name: 'International Holding Co.' },
        { symbol: 'FAB', name: 'First Abu Dhabi Bank' },
        { symbol: 'ETISALAT', name: 'e& (Etisalat)' },
        { symbol: 'ADNOCDIST', name: 'ADNOC Distribution' },
        { symbol: 'ALDAR', name: 'Aldar Properties' },
        { symbol: 'ADCB', name: 'Abu Dhabi Comm. Bank' },
        { symbol: 'MULTIPLY', name: 'Multiply Group' },
        { symbol: 'ADNOCDRILL', name: 'ADNOC Drilling' },
        { symbol: 'PRESIGHT', name: 'Presight AI' },
        { symbol: 'FERTIGLBE', name: 'Fertiglobe' },
        { symbol: 'DANA', name: 'Dana Gas' },
        { symbol: 'AGTHIA', name: 'Agthia Group' },
        { symbol: 'YAHSAT', name: 'Al Yah Satellite' },
        { symbol: 'ALPHADHABI', name: 'Alpha Dhabi Holding' },
        { symbol: 'RAKPROP', name: 'RAK Properties' },
    ]
};

// Popular stocks by sector (for autocomplete and recommendations)
export const STOCKS_BY_SECTOR: Record<string, { symbol: string; name: string }[]> = {
    'Technology': [
        { symbol: 'AAPL', name: 'Apple Inc.' },
        { symbol: 'MSFT', name: 'Microsoft Corporation' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation' },
        { symbol: 'TSM', name: 'Taiwan Semiconductor' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.' },
        { symbol: 'META', name: 'Meta Platforms Inc.' },
        { symbol: 'AMD', name: 'Advanced Micro Devices' },
        { symbol: 'AVGO', name: 'Broadcom Inc.' },
        { symbol: 'ORCL', name: 'Oracle Corporation' },
        { symbol: 'ADBE', name: 'Adobe Inc.' },
        { symbol: 'CRM', name: 'Salesforce Inc.' },
        { symbol: 'MU', name: 'Micron Technology' },
        { symbol: 'WDC', name: 'Western Digital (f. SanDisk)' },
    ],
    'Healthcare': [
        { symbol: 'UNH', name: 'UnitedHealth Group' },
        { symbol: 'JNJ', name: 'Johnson & Johnson' },
        { symbol: 'LLY', name: 'Eli Lilly and Company' },
        { symbol: 'ABBV', name: 'AbbVie Inc.' },
        { symbol: 'MRK', name: 'Merck & Co.' },
        { symbol: 'PFE', name: 'Pfizer Inc.' },
        { symbol: 'TMO', name: 'Thermo Fisher Scientific' },
        { symbol: 'ABT', name: 'Abbott Laboratories' },
    ],
    'Financial Services': [
        { symbol: 'BRK.B', name: 'Berkshire Hathaway' },
        { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
        { symbol: 'V', name: 'Visa Inc.' },
        { symbol: 'MA', name: 'Mastercard Inc.' },
        { symbol: 'BAC', name: 'Bank of America' },
        { symbol: 'WFC', name: 'Wells Fargo' },
        { symbol: 'GS', name: 'Goldman Sachs' },
    ],
    'Consumer Cyclical': [
        { symbol: 'AMZN', name: 'Amazon.com Inc.' },
        { symbol: 'TSLA', name: 'Tesla Inc.' },
        { symbol: 'HD', name: 'The Home Depot' },
        { symbol: 'NKE', name: 'Nike Inc.' },
        { symbol: 'MCD', name: 'McDonald\'s Corporation' },
        { symbol: 'SBUX', name: 'Starbucks Corporation' },
    ],
    'Industrials': [
        { symbol: 'CAT', name: 'Caterpillar Inc.' },
        { symbol: 'BA', name: 'Boeing Company' },
        { symbol: 'UPS', name: 'United Parcel Service' },
        { symbol: 'HON', name: 'Honeywell International' },
        { symbol: 'GE', name: 'General Electric' },
    ],
    'Communication Services': [
        { symbol: 'NFLX', name: 'Netflix Inc.' },
        { symbol: 'DIS', name: 'The Walt Disney Company' },
        { symbol: 'CMCSA', name: 'Comcast Corporation' },
        { symbol: 'T', name: 'AT&T Inc.' },
        { symbol: 'VZ', name: 'Verizon Communications' },
    ],
    'Consumer Defensive': [
        { symbol: 'WMT', name: 'Walmart Inc.' },
        { symbol: 'PG', name: 'Procter & Gamble' },
        { symbol: 'KO', name: 'The Coca-Cola Company' },
        { symbol: 'PEP', name: 'PepsiCo Inc.' },
        { symbol: 'COST', name: 'Costco Wholesale' },
    ],
    'Energy': [
        { symbol: 'XOM', name: 'Exxon Mobil Corporation' },
        { symbol: 'CVX', name: 'Chevron Corporation' },
        { symbol: 'COP', name: 'ConocoPhillips' },
        { symbol: 'SLB', name: 'Schlumberger' },
    ],
    'Utilities': [
        { symbol: 'NEE', name: 'NextEra Energy' },
        { symbol: 'DUK', name: 'Duke Energy' },
        { symbol: 'SO', name: 'Southern Company' },
    ],
    'Real Estate': [
        { symbol: 'AMT', name: 'American Tower Corporation' },
        { symbol: 'PLD', name: 'Prologis Inc.' },
        { symbol: 'SPG', name: 'Simon Property Group' },
    ],
    'Basic Materials': [
        { symbol: 'LIN', name: 'Linde plc' },
        { symbol: 'APD', name: 'Air Products and Chemicals' },
        { symbol: 'FCX', name: 'Freeport-McMoRan' },
    ],
    'Transportation': [
        { symbol: 'UPS', name: 'United Parcel Service' },
        { symbol: 'FDX', name: 'FedEx Corporation' },
        { symbol: 'UNP', name: 'Union Pacific Corporation' },
        { symbol: 'DAL', name: 'Delta Air Lines' },
        { symbol: 'UAL', name: 'United Airlines' },
        { symbol: 'LUV', name: 'Southwest Airlines' },
    ],
    'Artificial Intelligence': [
        { symbol: 'NVDA', name: 'NVIDIA Corporation' },
        { symbol: 'PLTR', name: 'Palantir Technologies' },
        { symbol: 'AI', name: 'C3.ai Inc.' },
        { symbol: 'SMCI', name: 'Super Micro Computer' },
        { symbol: 'MSFT', name: 'Microsoft Corporation' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.' },
        { symbol: 'AMD', name: 'Advanced Micro Devices' },
    ],
};

// Popular ETFs
export const POPULAR_ETFS = [
    { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', sector: 'Diversified' },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust', sector: 'Technology' },
    { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', sector: 'Diversified' },
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', sector: 'Diversified' },
    { symbol: 'IWM', name: 'iShares Russell 2000 ETF', sector: 'Small Cap' },
    { symbol: 'DIA', name: 'SPDR Dow Jones Industrial Average ETF', sector: 'Diversified' },
    { symbol: 'VGT', name: 'Vanguard Information Technology ETF', sector: 'Technology' },
    { symbol: 'VHT', name: 'Vanguard Health Care ETF', sector: 'Healthcare' },
    { symbol: 'VFH', name: 'Vanguard Financials ETF', sector: 'Financial Services' },
    { symbol: 'XLK', name: 'Technology Select Sector SPDR Fund', sector: 'Technology' },
    { symbol: 'XLV', name: 'Health Care Select Sector SPDR Fund', sector: 'Healthcare' },
    { symbol: 'XLF', name: 'Financial Select Sector SPDR Fund', sector: 'Financial Services' },
    { symbol: 'PHO', name: 'Invesco Water Resources ETF', sector: 'Utilities' },
    { symbol: 'SLV', name: 'iShares Silver Trust', sector: 'Commodities' },
    { symbol: 'GLD', name: 'SPDR Gold Shares', sector: 'Commodities' },
    { symbol: 'USO', name: 'United States Oil Fund', sector: 'Commodities' },
    { symbol: 'TLT', name: 'iShares 20+ Year Treasury Bond ETF', sector: 'Fixed Income' },
];

// Get sector for a symbol
export const getSectorForSymbol = (symbol: string): string => {
    // Check ETFs first
    const etf = POPULAR_ETFS.find(e => e.symbol === symbol);
    if (etf) return etf.sector;

    // Check stocks
    for (const [sector, stocks] of Object.entries(STOCKS_BY_SECTOR)) {
        if (stocks.some(s => s.symbol === symbol)) {
            return sector;
        }
    }

    return 'Unknown';
};

// Get market for a symbol based on predefined indices
export const getMarketForSymbol = (symbol: string): 'us' | 'egypt' | 'abudhabi' => {
    if (STOCKS_BY_INDEX['EGX 30']?.some(s => s.symbol === symbol)) return 'egypt';
    if (STOCKS_BY_INDEX['FTSE ADX 15']?.some(s => s.symbol === symbol)) return 'abudhabi';

    // Explicit list fallback just in case
    const egyptSymbols = ['COMI', 'TMGH', 'FWRY', 'HRHO', 'EAST', 'ETEL', 'PHDC', 'ORAS', 'SWDY', 'ABUK', 'CLHO', 'EMFD', 'EFID', 'ADIB', 'RAYA'];
    if (egyptSymbols.includes(symbol)) return 'egypt';

    const adxSymbols = ['IHC', 'FAB', 'ETISALAT', 'ADNOCDIST', 'ALDAR', 'ADCB', 'MULTIPLY', 'ADNOCDRILL', 'PRESIGHT', 'FERTIGLBE', 'DANA', 'AGTHIA', 'YAHSAT', 'ALPHADHABI', 'RAKPROP'];
    if (adxSymbols.includes(symbol)) return 'abudhabi';

    return 'us';
};

// Get all symbols for autocomplete
export const getAllSymbols = (): { symbol: string; name: string; type: string; sector: string }[] => {
    const stocks = Object.entries(STOCKS_BY_SECTOR).flatMap(([sector, stocks]) =>
        stocks.map(s => ({ ...s, type: 'Stock', sector }))
    );

    const etfs = POPULAR_ETFS.map(e => ({ ...e, type: 'ETF' }));

    return [...stocks, ...etfs];
};
