const CACHE = 'bebek-v2';
const ASSETS = ['/', '/index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  );
  clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      if (res && res.status === 200 && e.request.method === 'GET') {
        caches.open(CACHE).then(c => c.put(e.request, res.clone()));
      }
      return res;
    }).catch(() => caches.match('/index.html')))
  );
});

// ── PUSH BİLDİRİMİ ──
self.addEventListener('push', e => {
  let data = { title: '🤱 Emzirme Vakti!', body: 'Bebek seni bekliyor!', icon: '/icon-192.png' };
  try { data = { ...data, ...e.data.json() }; } catch {}
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.icon,
      tag: data.tag || 'emzirme',
      renotify: true,
      vibrate: [200, 100, 200],
      data: data.data || {}
    })
  );
});

// Bildirime tıklanınca uygulamayı aç
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes(self.location.origin)) return c.focus();
      }
      return clients.openWindow('/');
    })
  );
});

// Client'tan zamanlı bildirim mesajı al
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE_NOTIFICATION') {
    const { delayMs, title, body } = e.data;
    setTimeout(() => {
      self.registration.showNotification(title || '🤱 Emzirme Vakti!', {
        body: body || 'Bebek seni bekliyor!',
        icon: '/icon-192.png',
        tag: 'emzirme',
        renotify: true,
        vibrate: [200, 100, 200]
      });
    }, delayMs || 0);
  }
});
