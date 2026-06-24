const CACHE='bebek-v17';
self.addEventListener('install',e=>{self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const isHTML=e.request.headers.get('accept')?.includes('text/html');
  if(isHTML||e.request.url.includes('index.html')||e.request.url===self.registration.scope){
    e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
    return;
  }
  e.respondWith(fetch(e.request).then(res=>{if(res&&res.status===200){const c=res.clone();caches.open(CACHE).then(ca=>ca.put(e.request,c));}return res;}).catch(()=>caches.match(e.request)));
});
self.addEventListener('push',e=>{
  let title='🤱 Emzirme Vakti!',body='Bebek seni bekliyor!',icon=self.registration.scope+'icon-192.png',tag='genel';
  try{const d=e.data.json();title=d.title||d.notification?.title||title;body=d.body||d.notification?.body||body;icon=d.icon||d.notification?.icon||icon;tag=d.tag||d.notification?.tag||d.webpush?.notification?.tag||tag;}catch(e){}
  e.waitUntil(self.registration.showNotification(title,{body,icon,tag,renotify:true,vibrate:[200,100,200]}));
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{for(const c of list){if(c.url.includes(self.location.origin))return c.focus();}return clients.openWindow(self.registration.scope);}));
});
