const https = require('https');

const channels = {
    'Fox News': 'UCJg9wBPyKMNA5sRDnvzmkdg',
    'Sky News': 'UCoMdktPbSTixAyNGwb-UYkQ',
    'Euronews': 'UCSrZ3UV4jOidv8ppoVuvW9Q'
};

for (const [name, cid] of Object.entries(channels)) {
    https.get(`https://www.youtube.com/channel/${cid}/live`, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            const match = data.match(/"videoId":"([^"]+)"/);
            if (match) {
                console.log(`${name}: ${match[1]}`);
            } else {
                console.log(`${name}: Not found`);
            }
        });
    }).on('error', err => console.log(`${name}: Error ${err.message}`));
}
