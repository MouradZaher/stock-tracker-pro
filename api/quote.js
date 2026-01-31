export default async function handler(req, res) {
    const { symbols } = req.query;

    if (!symbols) {
        return res.status(400).json({ error: 'Missing symbols parameter' });
    }

    try {
        const response = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/quote?symbols=${symbols}`,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0' // Yahoo often blocks requests without a UA
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Yahoo Finance API error: ${response.statusText}`);
        }

        const data = await response.json();

        // Set CORS headers for our frontend
        res.setHeader('Access-Control-Allow-Credentials', true);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
        res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate');

        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
