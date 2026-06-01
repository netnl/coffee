#!/usr/bin/env bash
# Run with:  cd ~/Coffee && bash update-coords.sh
# Or with a specific file:  cd ~/Coffee && bash update-coords.sh /path/to/data.csv

update_coffee_coords() {
  local csv_path="${1:-data.csv}"

  python3 - "$csv_path" <<'PYEOF'
import sys, csv, io, time, re, json
import urllib.request, urllib.parse, urllib.error

CSV_PATH = sys.argv[1] if len(sys.argv) > 1 else 'data.csv'
DELAY    = 1.2   # seconds between Nominatim requests (rate limit: 1 req/s)


def get_coords_from_maps(url):
    """Follow the Maps short URL and extract @lat,lng from the resolved address."""
    try:
        req = urllib.request.Request(
            url,
            headers={
                'User-Agent': (
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                    'AppleWebKit/537.36 (KHTML, like Gecko) '
                    'Chrome/120.0.0.0 Safari/537.36'
                )
            }
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            final_url = resp.url
        m = re.search(r'@(-?\d+\.?\d+),(-?\d+\.?\d+)', final_url)
        if m:
            return float(m.group(1)), float(m.group(2))
    except Exception as exc:
        print(f'      Maps URL error: {exc}', file=sys.stderr)
    return None, None


def get_coords_from_nominatim(name):
    """Geocode a place by name via OpenStreetMap Nominatim."""
    time.sleep(DELAY)
    q   = urllib.parse.quote(f'{name}, Bali, Indonesia')
    url = f'https://nominatim.openstreetmap.org/search?q={q}&format=json&limit=1&countrycodes=id'
    req = urllib.request.Request(
        url,
        headers={'User-Agent': 'CoffeeMapApp/1.0 (personal project)'}
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
        if data:
            return float(data[0]['lat']), float(data[0]['lon'])
    except Exception as exc:
        print(f'      Nominatim error: {exc}', file=sys.stderr)
    return None, None


# ── Read ──────────────────────────────────────────────────────────────────────

with open(CSV_PATH, newline='', encoding='utf-8') as f:
    raw_lines = f.read().splitlines()

if not raw_lines:
    sys.exit('ERROR: CSV is empty.')

header_cols = list(next(csv.reader([raw_lines[0]])))

def find_col(name):
    for i, h in enumerate(header_cols):
        if h.strip() == name:
            return i
    return None

IDX = {k: find_col(k) for k in ('Place', 'Lat', 'Lng', 'Maps')}
missing = [k for k, v in IDX.items() if v is None]
if missing:
    sys.exit(f'ERROR: column(s) not found: {missing}\nHeader: {header_cols}')

# ── Process ───────────────────────────────────────────────────────────────────

out_lines = [raw_lines[0]]
changed   = 0

for raw in raw_lines[1:]:
    if not raw.strip():
        continue

    cols = list(next(csv.reader([raw])))
    while len(cols) <= max(IDX.values()):
        cols.append('')

    place = cols[IDX['Place']].strip()
    lat   = cols[IDX['Lat']].strip()
    lng   = cols[IDX['Lng']].strip()
    maps  = cols[IDX['Maps']].strip()

    if lat and lng:
        print(f'skip  {place}')
        out_lines.append(raw)
        continue

    print(f'fetch {place} ...', flush=True)
    rlat = rlng = None

    # 1. Try to extract coords from the Google Maps URL redirect
    if maps.startswith('https://'):
        rlat, rlng = get_coords_from_maps(maps)
        if rlat is not None:
            print(f'      → {rlat:.6f},{rlng:.6f}  (Maps URL)')

    # 2. Fall back to Nominatim geocoding by place name
    if rlat is None:
        rlat, rlng = get_coords_from_nominatim(place)
        if rlat is not None:
            print(f'      → {rlat:.6f},{rlng:.6f}  (Nominatim)')
        else:
            print(f'      → FAILED — fill in Lat/Lng manually')

    if rlat is not None:
        cols[IDX['Lat']] = f'{rlat:.6f}'
        cols[IDX['Lng']] = f'{rlng:.6f}'
        changed += 1

    buf = io.StringIO()
    csv.writer(buf).writerow(cols)
    out_lines.append(buf.getvalue().rstrip('\r\n'))

# ── Write ─────────────────────────────────────────────────────────────────────

with open(CSV_PATH, 'w', encoding='utf-8', newline='') as f:
    f.write('\n'.join(out_lines) + '\n')

print(f'\nDone — {changed} row(s) updated in {CSV_PATH}')
PYEOF
}

update_coffee_coords "$@"
