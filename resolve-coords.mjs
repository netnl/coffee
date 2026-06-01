import fs from 'fs';

// Column layout: Place,Vibes I,Coffee I,Vibes D,Coffee D,Note,Lat,Lng,Maps
const CSV_PATH = './data.csv';
const COL_LAT  = 6;
const COL_LNG  = 7;
const COL_MAPS = 8;

// Street + area lookup, extracted from Google Maps redirect URLs.
// Add new entries here when adding a place that needs geocoding.
const ADDRESS_LOOKUP = {
  'Expo Art':    ['Kayu Aya',          'Seminyak'],
  'Prince':      ['Raya Kesambi',      'Kerobokan'],
  'TheNomad':    ['Raya Uma Buluh',    'Canggu'],
  'Vinyl':       ['Umalas Tunon',      'Kerobokan'],
  'Olikopi':     ['Raya Kerobokan',    'Kerobokan'],
  'Wildflower':  ['Tegal Cupek',       'Kerobokan'],
  'Semeja':      ['Raya Kedampang',    'Kerobokan'],
  'Kurang Lebih':['Raya Semer',        'Kerobokan'],
  'Dewata':      ['Bypass Ngurah Rai', 'Nusa Dua'],
  'Japa':        ['Babadan',           'Pererenan'],
  'Kopitoko':    ['Umalas',            'Kerobokan'],
  'Campus':      ['Tibubeneng',        'Tibubeneng'],
  'Kobu':        ['Tengah',            'Kerobokan'],
  'Kenduri':     ['Dukuh Indah',       'Kerobokan'],
  'Bali Brew':   ['Pantai Seseh',      'Munggu'],
  'Meet up':     ['Raya Kerobokan',    'Kerobokan'],
  'Kongkow':     ['Pantai Batu Bolong','Canggu'],
  'Umane':       ['Pengubengan Kauh',  'Kerobokan'],
  'Grön':        ['Raya Semat',        'Tibubeneng'],
  '*7AM':        ['Bumbak Dauh',       'Kerobokan'],
  'Hasamdong':   ['Pangkung Sari',     'Seminyak'],
  'KAI':         ['Pantai Berawa',     'Tibubeneng'],
  'Culture':     ['Pantai Berawa',     'Tibubeneng'],
};

async function nominatim(q) {
  await new Promise(r => setTimeout(r, 1100));
  const resp = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=id`,
    { headers: { 'User-Agent': 'CoffeeMapApp/1.0 (personal project)' } }
  );
  const data = await resp.json();
  if (data.length > 0) return [parseFloat(data[0].lat).toFixed(6), parseFloat(data[0].lon).toFixed(6)];
  return null;
}

async function resolveCoords(name) {
  const addr = ADDRESS_LOOKUP[name];
  if (!addr) { console.warn(`  No address in lookup for "${name}" — add it to ADDRESS_LOOKUP`); return null; }

  const [street, area] = addr;
  const queries = [
    `${street}, ${area}, Bali, Indonesia`,
    `${street}, Bali, Indonesia`,
    `${area}, Bali, Indonesia`,
  ];

  for (const q of queries) {
    const coords = await nominatim(q);
    if (coords) { console.log(`  via "${q}"`); return coords; }
  }

  console.warn(`  All geocoding attempts failed`);
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

const raw = fs.readFileSync(CSV_PATH, 'utf8');
const lines = raw.trim().split('\n');

const headerCols = lines[0].split(',');

// Ensure Lat and Lng columns exist in header (idempotent)
if (headerCols[COL_LAT]?.trim() !== 'Lat' || headerCols[COL_LNG]?.trim() !== 'Lng') {
  console.error('Unexpected header layout. Expected Lat at col 6, Lng at col 7.');
  process.exit(1);
}

const outputLines = [lines[0]];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  const cols = line.split(',');
  const name = cols[0]?.trim();
  const existingLat = cols[COL_LAT]?.trim();
  const existingLng = cols[COL_LNG]?.trim();

  if (existingLat && existingLng) {
    console.log(`Skipping ${name} (already has coords)`);
    outputLines.push(line);
    continue;
  }

  process.stdout.write(`Resolving ${name}...\n`);
  const coords = await resolveCoords(name);

  if (coords) {
    cols[COL_LAT] = coords[0];
    cols[COL_LNG] = coords[1];
    console.log(`  → ${coords[0]},${coords[1]}`);
  } else {
    console.log(`  → FAILED (fill in manually)`);
  }

  outputLines.push(cols.join(','));
}

fs.writeFileSync(CSV_PATH, outputLines.join('\n') + '\n');
console.log('\nDone — coords written to data.csv');
