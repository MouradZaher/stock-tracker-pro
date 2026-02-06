import axios from 'axios';

export default async function handler(req, res) {
    const { symbols, modules } = req.query;

    if (!symbols) {
        return res.status(400).json({ error: 'Missing symbols parameter' });
    }

    console.log(`📡 Yahoo Finance API Request - Symbols: ${symbols}${modules ? `, Modules: ${modules}` : ''}`);

    // Determine which endpoint to use based on requested modules
    // If modules are provided, use quoteSummary (v10)
    // Otherwise use standard quote (v7)
    const isSummary = !!modules;
    const path = isSummary ? 'v10/finance/quoteSummary' : 'v7/finance/quote';

    const endpoints = [
        `https://query2.finance.yahoo.com/${path}`,
        `https://query1.finance.yahoo.com/${path}`
    ];

    for (const endpoint of endpoints) {
        try {
            const params = isSummary
                ? { symbols, modules }
                : { symbols };

            console.log(`🔄 Attempting: ${endpoint}`);

            const response = await axios.get(endpoint, {
                params,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Origin': 'https://finance.yahoo.com',
                    'Referer': 'https://finance.yahoo.com/',
                },
                timeout: 8000
            });

            console.log(`✅ SUCCESS - Real data fetched for ${symbols}`);

            // Set CORS headers
            res.setHeader('Access-Control-Allow-Credentials', true);
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
            res.setHeader('Cache-Control', 's-maxage=2, stale-while-revalidate');

            return res.status(200).json(response.data);
        } catch (error) {
            console.error(`❌ FAILED ${endpoint}:`, error.message);

            // Continue to next endpoint if available
            if (endpoint === endpoints[endpoints.length - 1]) {
                const status = error.response ? error.response.status : 500;
                const message = error.response ? error.response.data : error.message;
                console.error(`💥 ALL ENDPOINTS FAILED for ${symbols}`);
                return res.status(status).json({ error: message, details: 'Proxy failed to fetch from Yahoo Finance' });
            }
        }
    }
}
