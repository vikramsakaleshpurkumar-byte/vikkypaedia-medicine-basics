/**
 * Vikkypaedia Medicine Basics (Harrison's 22e) — Offline-First PWA Service Worker (v9.4)
 * Uses Network-First with Offline Cache Fallback so GitHub Pages updates apply immediately
 * while hospital wards with zero signal still load 100% from cache.
 */
const CACHE_NAME = 'vikkypaedia-med-basics-v9-5';
const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './components/quiz-engine.js',
  './components/clinical-sim.js',
  './components/flashcard-engine.js',
  './components/algorithm-viewer.js',
  './components/progress-tracker.js',
  './components/tap-sequence-puzzle.js',
  './components/bedside-sandboxes.js',
  './components/parameterized-engine.js',
  './components/chapter-reader.js',
  './components/mindmap-viewer.js',
  './components/visual-gallery.js',
  './data/curriculum.json',
  './data/chapters.json',
  './data/visuals.json',
  './data/references.js',
  './data/sim-cases.js',
  './data/algorithms.js',
  './data/vital-signs.json',
  './data/medications.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true }))
  );
});
