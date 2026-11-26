const ROOT = new URL('./', self.location.href);
const PREFIX = 'student-portal-' + ROOT.pathname + '-';
const CACHE = PREFIX + 'v5-login-2';
const SHELL = ['index.html','logo.png','icon-192.png','icon-512.png','manifest.json','passout.js','JameelNooriNastaleeq.ttf'];
const allowed = new Set(SHELL.map(p=>new URL(p,ROOT).href));
const chart = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
self.addEventListener('install', event=>event.waitUntil((async()=>{
 const c=await caches.open(CACHE);
 await c.add(new URL('index.html',ROOT).href);
 await Promise.all(SHELL.slice(1).map(p=>c.add(new URL(p,ROOT).href).catch(()=>{})));
 await c.add(chart).catch(()=>{});
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const r=event.request,u=new URL(r.url);
 if(r.method!=='GET')return;
 const nav=r.mode==='navigate'&&u.origin===ROOT.origin&&(u.pathname===ROOT.pathname||u.pathname===new URL('index.html',ROOT).pathname);
 const staticAsset=allowed.has(u.href)||u.href===chart||((u.origin==='https://fonts.googleapis.com'||u.origin==='https://fonts.gstatic.com')&&['style','font'].includes(r.destination));
 if(!nav&&!staticAsset)return;
 event.respondWith((async()=>{
  const c=await caches.open(CACHE);
  const key=nav?new URL('index.html',ROOT).href:r;
  try{
   const response=await fetch(r);
   // Never store query-bearing navigation or redirected documents.
   if((response.ok||(!nav&&response.type==='opaque'))&&(!nav||(!u.search&&!response.redirected)))await c.put(key,response.clone());
   return response;
  }catch(e){
   const cached=await c.match(key);if(cached)return cached;
   if(nav)return new Response('<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><h1>No internet / انٹرنیٹ دستیاب نہیں</h1><p>Reconnect and reopen the portal.</p>',{headers:{'Content-Type':'text/html; charset=utf-8'}});
   return Response.error();
  }
 })());
});
