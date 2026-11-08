const VERSION='cifra-estudio-original-offline-v2-ritmos-midi';
const SHELL=[ './', './index.html', './manifest.webmanifest', './fluidsynth-engine.js',
 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
 'https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.1/lame.min.js'
];
const SOUND=['./banco-principal.sf2.part1','./banco-principal.sf2.part2','./banco-principal.sf2.part3','./banco-principal.sf2.part4'];
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const c=await caches.open(VERSION);
 for(const url of SHELL){try{const r=await fetch(url,{cache:'reload'});if(r.ok)await c.put(url,r)}catch(e){}}
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('cifra-estudio-')&&k!==VERSION).map(k=>caches.delete(k)));
 await self.clients.claim();
})()));
self.addEventListener('message',event=>{
 if(!event.data||event.data.type!=='CACHE_FULL')return;
 event.waitUntil((async()=>{
  const c=await caches.open(VERSION),all=[...SHELL,...SOUND];let done=0;
  const report=async(type,extra={})=>{const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});clients.forEach(x=>x.postMessage({type,done,total:all.length,...extra}))};
  try{
   for(const url of all){
    const req=new Request(url,{cache:'reload'});
    const res=await fetch(req);
    if(!res.ok)throw new Error(url+' HTTP '+res.status);
    await c.put(url,res.clone());done++;await report('CACHE_PROGRESS');
   }
   await report('CACHE_DONE');
  }catch(e){await report('CACHE_ERROR',{message:String(e.message||e)});}
 })());
});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 const same=url.origin===self.location.origin;
 const allowedCdn=url.hostname==='cdnjs.cloudflare.com';
 if(!same&&!allowedCdn)return;
 event.respondWith((async()=>{
  const c=await caches.open(VERSION);
  const hit=await c.match(req,{ignoreSearch:false});
  if(hit)return hit;
  try{
   const res=await fetch(req);
   if(res&&res.ok&&(same||allowedCdn))c.put(req,res.clone()).catch(()=>{});
   return res;
  }catch(e){return new Response('Recurso indisponível offline: '+url.pathname,{status:503,statusText:'Offline'});}
 })());
});