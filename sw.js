const CACHE = 'bebek-v15';
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll([
      self.registration.scope,
      self.registration.scope + 'index.html'
    ]).catch(() => {}))
  );
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => clients.claim())
  );
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(res => {
      if (res && res.status === 200) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match(e.request).then(r => r || new Response('Offline', { status: 503 })))
  );
});
self.addEventListener('push', e => {
  let title = '🤱 Emzirme Vakti!';
  let body = 'Bebek seni bekliyor!';
  let icon = self.registration.scope + 'icon-192.png';
  // Düzeltme: tag artık push verisinden okunuyor
  let tag = 'genel';
  try {
    const d = e.data.json();
    title = d.title || d.notification?.title || title;
    body  = d.body  || d.notification?.body  || body;
    icon  = d.icon  || d.notification?.icon  || icon;
    // FCM webpush notification tag'i buradan geliyor
    tag   = d.tag   || d.notification?.tag   || d.webpush?.notification?.tag || tag;
  } catch {}
  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      tag,           // artık dinamik: 'emzirme', 'gundayin', 'iyigeceler', 'surpriz'
      renotify: true,
      vibrate: [200, 100, 200]
    })
  );
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes(self.location.origin)) return c.focus();
      }
      return clients.openWindow(self.registration.scope);
    })
  );
});
