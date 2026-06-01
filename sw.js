'use strict';

const STATIC_CACHE = 'coffee-static-v5';
const TILE_CACHE   = 'coffee-tiles-v1';
const MAX_TILES    = 300;

// App shell — always cache on install
const CORE_URLS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './data.csv',
  './favicon.svg',
  './manifest.json',
];

// CDN dependencies — cache opportunistically (don't fail install if offline)
const CDN_URLS = [
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js',
];

// ── Lifecycle ─────────────────────────────────────────────────────────────────

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async cache => {
      await cache.addAll(CORE_URLS);
      await Promise.allSettled(CDN_URLS.map(url => cache.add(url)));
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== TILE_CACHE)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch strategies ──────────────────────────────────────────────────────────

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Map tiles: cache-first, evict oldest tile when limit reached
  if (url.hostname.endsWith('.tile.openstreetmap.org')) {
    event.respondWith(cacheTile(request));
    return;
  }

  // data.csv: network-first so fresh ratings are always shown; fall back to cache offline
  if (url.pathname.endsWith('data.csv')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // App shell + CDN: cache-first
  event.respondWith(cacheFirst(request));
});

// ── Strategy helpers ──────────────────────────────────────────────────────────

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline — resource not cached', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached ?? new Response('Offline — resource not cached', { status: 503 });
  }
}

async function cacheTile(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (!response.ok) return response;
    const cache = await caches.open(TILE_CACHE);
    const keys  = await cache.keys();
    if (keys.length >= MAX_TILES) await cache.delete(keys[0]);
    cache.put(request, response.clone());
    return response;
  } catch {
    return new Response('Tile unavailable offline', { status: 503 });
  }
}
