self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",event=>event.waitUntil(self.clients.claim()));
self.addEventListener("push",event=>{const data=event.data?event.data.json():{};event.waitUntil(self.registration.showNotification(data.title||"Escala de Música JB",{body:data.body||"Você tem um lembrete da escala.",icon:"/favicon.svg",data:{url:data.url||"/"}}))});
self.addEventListener("notificationclick",event=>{event.notification.close();event.waitUntil(clients.openWindow(event.notification.data?.url||"/"))});
