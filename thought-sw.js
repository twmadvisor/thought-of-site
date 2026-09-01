self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));

self.addEventListener('push',event=>{
  let payload={};
  try{payload=event.data?.json()||{}}catch(e){payload={body:event.data?.text()||''}}
  const title=payload.title||'Thought Of';
  const options={
    body:payload.body||'',
    icon:'./logo.png',
    data:{...(payload.data||{}),url:new URL('thought-profile-ios11.html',self.registration.scope).href}
  };
  event.waitUntil(self.registration.showNotification(title,options));
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=event.notification.data?.url||new URL('thought-profile-ios11.html',self.registration.scope).href;
  event.waitUntil((async()=>{
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of windows){
      try{
        const u=new URL(client.url);
        if(u.origin===self.location.origin){
          if('navigate' in client) await client.navigate(target);
          return client.focus();
        }
      }catch(e){}
    }
    return self.clients.openWindow(target);
  })());
});
