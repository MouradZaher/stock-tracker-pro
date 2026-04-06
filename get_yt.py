import urllib.request
import re

channels = {
    'Fox News': 'UCJg9wBPyKMNA5sRDnvzmkdg',
    'Sky News': 'UCoMdktPbSTixAyNGwb-UYkQ',
    'Euronews': 'UCSrZ3UV4jOidv8ppoVuvW9Q'
}

for name, cid in channels.items():
    try:
        req = urllib.request.Request(f'https://www.youtube.com/channel/{cid}/live', headers={'User-Agent': 'Mozilla/5.0'})
        html = urllib.request.urlopen(req).read().decode('utf-8')
        match = re.search(r'"videoId":"([^"]+)"', html)
        if match:
            print(f'{name}: {match.group(1)}')
        else:
            print(f'{name}: Not found')
    except Exception as e:
        print(f'{name}: Error {e}')
