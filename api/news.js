import axios from 'axios';

export default async function handler(req, res) {
    const { symbol } = req.query;

    if (!symbol) {
        return res.status(400).json({ error: 'Missing symbol parameter' });
    }

    // Yahoo Finance News RSS or API
    // Using v2/finance/news which is relatively stable
    // query2.finance.yahoo.com/v2/finance/news?symbols=AAPL
    const endpoint = 'https://query2.finance.yahoo.com/v2/finance/news';

    try {
        const response = await axios.get(endpoint, {
            params: { symbols: symbol },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json',
            },
            timeout: 5000
        });

        // Set CORS headers
        res.setHeader('Access-Control-Allow-Credentials', true);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

        // Transform data to match our app's expected format if necessary, 
        // or just pass it through and let frontend handle it. 
        // Yahoo returns { news: [ ... ] } or { content: [ ... ] } depending on endpoint version.
        // v2 returns { elements: [ ... ] } usually wrapped.

        // Let's inspect the response structure in the service, so just return raw data here.
        return res.status(200).json(response.data);
    } catch (error) {
        console.error(`Failed to fetch news for ${symbol}:`, error.message);
        return res.status(500).json({ error: 'Failed to fetch news', details: error.message });
    }
}
