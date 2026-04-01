const CACHE = "gov24-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/styles/base.css?v=2",
  "/styles/layout.css?v=2",
  "/styles/components.css?v=2",
  "/scripts/main.js?v=3",
  "/scripts/secondview.js?v=3"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k!==CACHE).map(k => caches.delete(k)))));
});
self.addEventListener("fetch", e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});

self.addEventListener('install', (e) => {
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  clients.claim();
});
