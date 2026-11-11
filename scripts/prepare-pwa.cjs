// Run after Expo's static web export. No dependency or credentials required.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const htmlFile = path.join(dist, 'index.html');
let html = fs.readFileSync(htmlFile, 'utf8');
html = html.replace(
  /<html([^>]*)>/,
  (_, attributes) => `<html${attributes.replace(/\s+lang="[^"]*"/g, '')} lang="pt-BR">`,
);
html = html.replace(
  '</head>',
  `
<link rel="manifest" href="/manifest.webmanifest">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<link rel="icon" type="image/png" href="/icons/icon-192.png">
<meta name="theme-color" content="#266749">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="PedeAê">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
</head>`,
);
fs.writeFileSync(htmlFile, html);
const version = crypto
  .createHash('sha256')
  .update(html)
  .update(fs.readFileSync(path.join(dist, 'offline.html')))
  .digest('hex')
  .slice(0, 16);
// Only cache our offline notice. Never cache API responses, auth, checkout,
// cart, customer data or old JS bundles. New pages always use the current build.
fs.writeFileSync(
  path.join(dist, 'sw.js'),
  `
const CACHE = 'pedeae-offline-${version}';
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.add(new Request('/offline.html', {cache:'reload'}))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('pedeae-offline-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || event.request.mode !== 'navigate' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).catch(async () => (await caches.open(CACHE)).match('/offline.html')));
});
`,
);
for (const icon of ['icon-192.png', 'icon-512.png', 'icon-maskable.png', 'apple-touch-icon.png']) {
  if (!fs.existsSync(path.join(dist, 'icons', icon)))
    throw new Error(`Missing installation icon: ${icon}`);
}
console.log(`PWA ready: manifest, icons, offline notice and worker ${version}`);
