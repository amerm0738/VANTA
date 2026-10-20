const CACHE="vanta-shell-v5";
const CORE=["/","/index.html","/admin.html","/manifest.json","/icon.svg"];
self.addEventListener("install",event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cache.addAll(CORE);
    await self.skipWaiting();
  })());
});
self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch",event=>{
  const request=event.request;
  const url=new URL(request.url);
  if(request.method!=="GET"||url.origin!==self.location.origin)return;
  if(request.mode==="navigate"||request.destination==="document"){
    event.respondWith(fetch(new Request(request,{cache:"no-store"})).then(response=>{
      if(response&&response.ok)caches.open(CACHE).then(cache=>cache.put("/index.html",response.clone()));
      return response;
    }).catch(()=>caches.match(request).then(hit=>hit||caches.match("/index.html"))));
    return;
  }
  event.respondWith(fetch(request).then(response=>{
    if(response&&response.ok)caches.open(CACHE).then(cache=>cache.put(request,response.clone()));
    return response;
  }).catch(()=>caches.match(request)));
});
self.addEventListener("push",event=>{
  let data={title:"VANTA",body:"تم استلام إشعار جديد"};
  try{data={...data,...event.data.json()}}catch(_){if(event.data)data.body=event.data.text()}
  event.waitUntil(self.registration.showNotification(data.title||"VANTA",{body:data.body||"لديك تحديث جديد",icon:"/icon.svg",badge:"/icon.svg",data:data.url||"/admin.html",tag:data.tag||"vanta-update"}));
});
self.addEventListener("notificationclick",event=>{
  event.notification.close();
  const url=event.notification.data||"/admin.html";
  event.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(list=>{
    for(const client of list){if("focus"in client){client.navigate(url);return client.focus()}}
    return self.clients.openWindow(url);
  }));
});