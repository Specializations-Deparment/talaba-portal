
/* Student Performance Portal
   Speed Optimization V2 - Step 1
   Fast Startup & Smart Cache
   Version 9
*/

const ROOT = new URL('./', self.location.href);
const PREFIX = 'student-portal-' + ROOT.pathname + '-';
const CACHE = PREFIX + 'v9-fast-startup';

const INDEX = new URL('index.html', ROOT).href;

const SHELL = [
  'index.html',
  'logo.png',
  'icon-192.png',
  'icon-512.png',
  'manifest.json',
  'passout.js',
  'JameelNooriNastaleeq.ttf'
];

const ALLOWED = new Set(
  SHELL.map(file => new URL(file, ROOT).href)
);

const CHART =
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';

const pending = new Map();

// =====================================
// INSTALL
// =====================================

self.addEventListener('install', event => {
  event.waitUntil((async () => {

    const cache = await caches.open(CACHE);

    await cache.add(
      new Request(INDEX, { cache: 'reload' })
    );

    await Promise.allSettled(
      SHELL.slice(1).map(file =>
        cache.add(
          new Request(
            new URL(file, ROOT).href,
            { cache: 'reload' }
          )
        )
      )
    );

    await self.skipWaiting();

  })());
});

// =====================================
// ACTIVATE
// =====================================

self.addEventListener('activate', event => {
  event.waitUntil((async () => {

    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter(key =>
          key.startsWith(PREFIX) && key !== CACHE
        )
        .map(key => caches.delete(key))
    );

    await self.clients.claim();

  })());
});

// =====================================
// SAFE BACKGROUND UPDATE
// =====================================

function updateCache(request, key, navigation) {

  const id = typeof key === 'string'
    ? key
    : key.url;

  if (pending.has(id)) {
    return pending.get(id).then(r => r.clone());
  }

  const task = (async () => {

    const response = await fetch(request, {
      cache: 'no-cache'
    });

    const valid = navigation
      ? response.ok && !response.redirected
      : response.ok || response.type === 'opaque';

    if (valid) {

      const cache = await caches.open(CACHE);

      try {
        await cache.put(key, response.clone());
      } catch (error) {
        // Cache failure must not block the portal.
      }

    }

    return response;

  })();

  pending.set(id, task);

  task.then(
    () => pending.delete(id),
    () => pending.delete(id)
  );

  return task.then(r => r.clone());
}

// =====================================
// OFFLINE PAGE
// =====================================

function offlinePage() {

  return new Response(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport"
        content="width=device-width,initial-scale=1">
      <title>No Internet</title>
      <style>
        * { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 24px;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #F7F5EF;
          font-family: Arial, sans-serif;
          color: #2E7D74;
          text-align: center;
        }
        .card {
          width: 100%;
          max-width: 400px;
          background: white;
          border-radius: 20px;
          padding: 30px 20px;
          border: 1px solid #ddd;
        }
        .symbol {
          font-size: 48px;
        }
        p {
          color: #555;
          line-height: 1.8;
        }
        button {
          width: 100%;
          min-height: 48px;
          border: 0;
          border-radius: 12px;
          background: #2E7D74;
          color: white;
          font-size: 16px;
          cursor: pointer;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="symbol">&#9888;</div>
        <h2>No Internet Connection</h2>
        <h2 lang="ur" dir="rtl">
          انٹرنیٹ دستیاب نہیں
        </h2>
        <p>
          Please reconnect to access the portal.
        </p>
        <p lang="ur" dir="rtl">
          پورٹل استعمال کرنے کے لیے
          انٹرنیٹ سے دوبارہ منسلک ہوں۔
        </p>
        <button onclick="location.reload()">
          Try Again / دوبارہ کوشش کریں
        </button>
      </div>
    </body>
    </html>
  `, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }
  });

}

// =====================================
// FAST FETCH STRATEGY
// =====================================

self.addEventListener('fetch', event => {

  const request = event.request;
  const url = new URL(request.url);

  // Never cache POST requests or API data.
  if (request.method !== 'GET') return;

  // Never intercept Google Apps Script.
  if (
    url.hostname === 'script.google.com' ||
    url.hostname === 'script.googleusercontent.com'
  ) return;

  // Never cache requests with authorization.
  if (request.headers.has('Authorization')) return;

  const navigation =
    request.mode === 'navigate' &&
    url.origin === ROOT.origin &&
    !url.search &&
    (
      url.pathname === ROOT.pathname ||
      url.pathname === new URL(
        'index.html', ROOT
      ).pathname
    );

  const fontAsset =
    (
      url.origin === 'https://fonts.googleapis.com' ||
      url.origin === 'https://fonts.gstatic.com'
    ) &&
    ['style', 'font'].includes(request.destination);

  const staticAsset =
    ALLOWED.has(url.href) ||
    url.href === CHART ||
    fontAsset;

  // Private data and other requests remain untouched.
  if (!navigation && !staticAsset) return;

  const key = navigation ? INDEX : request;

  const cached = caches.open(CACHE)
    .then(cache => cache.match(key))
    .catch(() => undefined);

  const network = updateCache(
    request,
    key,
    navigation
  );

  // Keep background updates alive.
  event.waitUntil(
    network.then(() => {}, () => {})
  );

  event.respondWith((async () => {

    // FAST STARTUP:
    // Show cached interface immediately.
    const saved = await cached;

    if (saved) {
      return saved;
    }

    // First visit: use the network.
    try {
      return await network;
    } catch (error) {

      if (navigation) {
        return offlinePage();
      }

      return Response.error();

    }

  })());

});

// =====================================
// UPDATE MESSAGE SUPPORT
// =====================================

self.addEventListener('message', event => {

  if (
    event.data === 'SKIP_WAITING' ||
    (
      event.data &&
      event.data.type === 'SKIP_WAITING'
    )
  ) {
    event.waitUntil(self.skipWaiting());
  }

});
