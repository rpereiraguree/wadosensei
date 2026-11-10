// Service worker: app disponível sem rede e sempre atualizada quando há rede.
const CACHE='wadosensei-v19';
const SHELL=['./','index.html','app.js?v=19','logic.js?v=19','store.js?v=19','seed.js?v=19','manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable.png','icon-96.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET')return;
  // SDK do Firebase (versão fixa): cache primeiro
  if(u.hostname==='www.gstatic.com'&&u.pathname.startsWith('/firebasejs/')){e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{const c=res.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return res})));return}
  // ficheiros da app: rede primeiro (atualizações imediatas), cache se offline
  if(u.origin===location.origin){e.respondWith(fetch(e.request.mode==='navigate'?new Request(e.request.url,{cache:'no-cache',credentials:'same-origin'}):new Request(e.request,{cache:'no-cache'})).then(res=>{if(res.ok){const c=res.clone();caches.open(CACHE).then(x=>x.put(e.request,c))}return res}).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match('index.html'))))}
});
