import axios from 'axios';

export default async function handler(req, res) {
    const { symbols } = req.query;

    if (!symbols) {
        return res.status(400).json({ error: 'Missing symbols parameter' });
    }

    // Use query2 as primary, fallback to query1 if needed
    const endpoints = [
        'https://query2.finance.yahoo.com/v8/finance/quote',
        'https://query1.finance.yahoo.com/v8/finance/quote'
    ];

    for (const endpoint of endpoints) {
        try {
            const response = await axios.get(endpoint, {
                params: { symbols },
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'application/json',
                    'Accept-Language': 'en-US,en;q=0.9',
                },
                timeout: 5000
            });

            // Set CORS headers
            res.setHeader('Access-Control-Allow-Credentials', true);
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
            res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate');

            return res.status(200).json(response.data);
        } catch (error) {
            console.error(`Failed to fetch from ${endpoint}:`, error.message);
            // Continue to next endpoint if available
            if (endpoint === endpoints[endpoints.length - 1]) {
                const status = error.response ? error.response.status : 500;
                const message = error.response ? error.response.data : error.message;
                return res.status(status).json({ error: message });
            }
        }
    }
}
