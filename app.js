'use strict';

const RATINGS = ['Amazeballs', 'Good', 'Ok', 'Meh', 'Sucks'];

const RATING_COLORS = {
  Amazeballs: '#15803d',
  Good:       '#4ade80',
  Ok:         '#facc15',
  Meh:        '#f97316',
  Sucks:      '#ef4444',
  '':         '#cbd5e0',
};

function ratingColor(r) {
  return RATING_COLORS[r?.trim()] ?? RATING_COLORS[''];
}

// Incrementing ID ensures each marker's SVG <clipPath> id is unique in the DOM.
let _uid = 0;

// Bootstrap Icons "cup-hot-fill" — MIT License
// https://github.com/twbs/icons  Copyright (c) 2019-2024 The Bootstrap Authors
//
// viewBox: 0 0 16 16
// Cup body occupies y=6–16; steam wisps are y=0–5 (above the clip region).
// Quadrant split: horizontal at y=11 (Vibes top / Coffee bottom),
//                 vertical   at x=8  (Izzy left / Danny right).
const CUP_BODY_PATH =
  `M.5 6a.5.5 0 0 0-.488.608l1.652 7.434A2.5 2.5 0 0 0 4.104 16h5.792` +
  `a2.5 2.5 0 0 0 2.44-1.958l.131-.59a3 3 0 0 0 1.3-5.854l.221-.99` +
  `A.5.5 0 0 0 13.5 6z`;

// Inner arc that makes the handle look hollow
const CUP_HANDLE_HOLE_PATH = `M13 12.5a2 2 0 0 1-.316-.025l.867-3.898A2.001 2.001 0 0 1 13 12.5`;

// Three wavy steam wisps (y ≈ 0–4, entirely above the cup body)
const CUP_STEAM_PATH =
  `m4.4.8-.003.004-.014.019a4 4 0 0 0-.204.31 2 2 0 0 0-.141.267` +
  `c-.026.06-.034.092-.037.103v.004a.6.6 0 0 0 .091.248c.075.133.178.272` +
  `.308.445l.01.012c.118.158.26.347.37.543.112.2.22.455.22.745` +
  ` 0 .188-.065.368-.119.494a3 3 0 0 1-.202.388 5 5 0 0 1-.253.382` +
  `l-.018.025-.005.008-.002.002A.5.5 0 0 1 3.6 4.2l.003-.004.014-.019` +
  `a4 4 0 0 0 .204-.31 2 2 0 0 0 .141-.267c.026-.06.034-.092.037-.103` +
  `a.6.6 0 0 0-.09-.252A4 4 0 0 0 3.6 2.8l-.01-.012a5 5 0 0 1-.37-.543` +
  `A1.53 1.53 0 0 1 3 1.5c0-.188.065-.368.119-.494.059-.138.134-.274` +
  `.202-.388a6 6 0 0 1 .253-.382l.025-.035A.5.5 0 0 1 4.4.8` +
  `m3 0-.003.004-.014.019a4 4 0 0 0-.204.31 2 2 0 0 0-.141.267` +
  `c-.026.06-.034.092-.037.103v.004a.6.6 0 0 0 .091.248c.075.133.178.272` +
  `.308.445l.01.012c.118.158.26.347.37.543.112.2.22.455.22.745` +
  ` 0 .188-.065.368-.119.494a3 3 0 0 1-.202.388 5 5 0 0 1-.253.382` +
  `l-.018.025-.005.008-.002.002A.5.5 0 0 1 6.6 4.2l.003-.004.014-.019` +
  `a4 4 0 0 0 .204-.31 2 2 0 0 0 .141-.267c.026-.06.034-.092.037-.103` +
  `a.6.6 0 0 0-.09-.252A4 4 0 0 0 6.6 2.8l-.01-.012a5 5 0 0 1-.37-.543` +
  `A1.53 1.53 0 0 1 6 1.5c0-.188.065-.368.119-.494.059-.138.134-.274` +
  `.202-.388a6 6 0 0 1 .253-.382l.025-.035A.5.5 0 0 1 7.4.8` +
  `m3 0-.003.004-.014.019a4 4 0 0 0-.204.31 2 2 0 0 0-.141.267` +
  `c-.026.06-.034.092-.037.103v.004a.6.6 0 0 0 .091.248c.075.133.178.272` +
  `.308.445l.01.012c.118.158.26.347.37.543.112.2.22.455.22.745` +
  ` 0 .188-.065.368-.119.494a3 3 0 0 1-.202.388 5 5 0 0 1-.252.382` +
  `l-.019.025-.005.008-.002.002A.5.5 0 0 1 9.6 4.2l.003-.004.014-.019` +
  `a4 4 0 0 0 .204-.31 2 2 0 0 0 .141-.267c.026-.06.034-.092.037-.103` +
  `a.6.6 0 0 0-.09-.252A4 4 0 0 0 9.6 2.8l-.01-.012a5 5 0 0 1-.37-.543` +
  `A1.53 1.53 0 0 1 9 1.5c0-.188.065-.368.119-.494.059-.138.134-.274` +
  `.202-.388a6 6 0 0 1 .253-.382l.025-.035A.5.5 0 0 1 10.4.8`;

function buildCoffeeIcon(vibesI, coffeeI, vibesD, coffeeD) {
  const id = `cp${++_uid}`;

  const cVI = ratingColor(vibesI);  // top-left:     Vibes  Izzy
  const cVD = ratingColor(vibesD);  // top-right:    Vibes  Danny
  const cCI = ratingColor(coffeeI); // bottom-left:  Coffee Izzy
  const cCD = ratingColor(coffeeD); // bottom-right: Coffee Danny

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16" aria-hidden="true">` +
      `<defs>` +
        `<clipPath id="${id}"><path d="${CUP_BODY_PATH}"/></clipPath>` +
      `</defs>` +
      // Quadrant fills, clipped to the cup body shape.
      // Vertical split at x=7: cup bowl runs x≈0.5–10, handle ear is x≈10–14.
      `<rect x="0" y="0"  width="7" height="11" fill="${cVI}" clip-path="url(#${id})"/>` +
      `<rect x="7" y="0"  width="9" height="11" fill="${cVD}" clip-path="url(#${id})"/>` +
      `<rect x="0" y="11" width="7" height="5"  fill="${cCI}" clip-path="url(#${id})"/>` +
      `<rect x="7" y="11" width="9" height="5"  fill="${cCD}" clip-path="url(#${id})"/>` +
      // Quadrant dividers (clipped so they don't bleed outside cup)
      `<line x1="0" y1="11" x2="16" y2="11"  stroke="rgba(255,255,255,0.55)" stroke-width="0.45" clip-path="url(#${id})"/>` +
      `<line x1="7" y1="6"  x2="7"  y2="16"  stroke="rgba(255,255,255,0.55)" stroke-width="0.45" clip-path="url(#${id})"/>` +
      // Handle hole — white fill so the handle reads as hollow
      `<path d="${CUP_HANDLE_HOLE_PATH}" fill="rgba(255,255,255,0.88)"/>` +
      // Cup outline
      `<path d="${CUP_BODY_PATH}" fill="none" stroke="rgba(0,0,0,0.32)" stroke-width="0.55"/>` +
      // Steam wisps
      `<path d="${CUP_STEAM_PATH}" fill="rgba(100,100,100,0.65)"/>` +
    `</svg>`;

  return L.divIcon({
    className: 'coffee-marker',
    html: svg,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34],
  });
}

function isSafeHttpsUrl(url) {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

function buildPopup(row) {
  const wrap = document.createElement('div');
  wrap.className = 'coffee-popup';

  const title = document.createElement('h3');
  title.className = 'coffee-popup__title';
  title.textContent = row.Place;
  wrap.appendChild(title);

  // Ratings table
  const table = document.createElement('table');
  table.className = 'coffee-popup__ratings';

  const thead = table.createTHead();
  const headRow = thead.insertRow();
  [' ', 'Izzy', 'Danny'].forEach((text, i) => {
    const th = document.createElement('th');
    th.textContent = text;
    if (i === 0) th.style.textAlign = 'left';
    headRow.appendChild(th);
  });

  const tbody = table.createTBody();
  [
    ['Vibes',  row['Vibes I'],  row['Vibes D']],
    ['Coffee', row['Coffee I'], row['Coffee D']],
  ].forEach(([label, valI, valD]) => {
    const tr = tbody.insertRow();
    const labelCell = tr.insertCell();
    labelCell.textContent = label;

    [valI, valD].forEach(val => {
      const td = tr.insertCell();
      const chip = document.createElement('span');
      chip.className = val?.trim() ? 'rating-chip' : 'rating-chip rating-chip--empty';
      chip.textContent = val?.trim() || '–';
      if (val?.trim()) chip.style.background = ratingColor(val.trim());
      td.appendChild(chip);
    });
  });

  wrap.appendChild(table);

  if (row.Note?.trim()) {
    const note = document.createElement('p');
    note.className = 'coffee-popup__note';
    note.textContent = row.Note.trim();
    wrap.appendChild(note);
  }

  const mapsUrl = row.Maps?.trim();
  if (mapsUrl && isSafeHttpsUrl(mapsUrl)) {
    const link = document.createElement('a');
    link.className = 'coffee-popup__link';
    link.href = mapsUrl;
    link.textContent = 'Open in Google Maps';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    wrap.appendChild(link);
  }

  return wrap;
}


function initMap() {
  const map = L.map('map', { zoomControl: true }).setView([-8.66, 115.155], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  fetch('./data.csv')
    .then(response => {
      if (!response.ok) throw new Error(`CSV load failed: ${response.status}`);
      return response.text();
    })
    .then(csv => {
      const result = Papa.parse(csv, {
        header: true,
        transformHeader: h => h.trim(),
        skipEmptyLines: true,
      });

      result.data.forEach(row => {
        const lat = parseFloat(row.Lat);
        const lng = parseFloat(row.Lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const icon = buildCoffeeIcon(
          row['Vibes I'],
          row['Coffee I'],
          row['Vibes D'],
          row['Coffee D'],
        );

        L.marker([lat, lng], { icon, title: row.Place, alt: row.Place })
          .bindPopup(buildPopup(row), { maxWidth: 300 })
          .addTo(map);
      });
    })
    .catch(err => console.error('Failed to load coffee data:', err));
}

initMap();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .catch(err => console.error('Service worker registration failed:', err));
  });
}
