(()=>{
const host=document.getElementById('thoughtApp');
const SUPABASE_URL='https://dlaxhooizwxitjxcjyyf.supabase.co';
const SUPABASE_KEY='sb_publishable_cnNOjkZ1yi5uAPdFv8SDJQ_i_HwSAbA';
const VAPID_PUBLIC='BLEMwSz6JHrqt-DXxzuSDcsVeBseGYZIxk5mvKzDmyWtCTBz_YkvlBP8fNZeRXh5jiPG0B9hakGApIIMVgHXoes';

function isIOS(){return /iphone|ipad|ipod/i.test(navigator.userAgent)}
function isStandalone(){return window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true}
function urlBase64ToUint8Array(base64String){
  const padding='='.repeat((4-base64String.length%4)%4);
  const base64=(base64String+padding).replace(/-/g,'+').replace(/_/g,'/');
  const raw=atob(base64),out=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);
  return out;
}
async function saveSubscription(token,userId,sub){
  const j=sub.toJSON(),common={apikey:SUPABASE_KEY,Authorization:'Bearer '+token,'Content-Type':'application/json'};
  await fetch(SUPABASE_URL+'/rest/v1/push_registrations?user_id=eq.'+encodeURIComponent(userId)+'&provider=eq.web',{method:'DELETE',headers:{...common,Prefer:'return=minimal'}});
  const r=await fetch(SUPABASE_URL+'/rest/v1/push_registrations',{method:'POST',headers:{...common,Prefer:'return=minimal'},body:JSON.stringify({user_id:userId,provider:'web',endpoint:j.endpoint,p256dh:j.keys?.p256dh,auth:j.keys?.auth})});
  if(!r.ok)throw Error('Could not register notifications.');
}
async function deleteRegistration(token,userId){
  const r=await fetch(SUPABASE_URL+'/rest/v1/push_registrations?user_id=eq.'+encodeURIComponent(userId)+'&provider=eq.web',{method:'DELETE',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+token,Prefer:'return=minimal'}});
  if(!r.ok)throw Error('Could not unregister notifications.');
}

window.thoughtPushInfo=()=>({ios:isIOS(),standalone:isStandalone(),supported:'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window,permission:('Notification' in window?Notification.permission:'unsupported')});
window.thoughtPushCheck=async(token,userId)=>{
  const info=window.thoughtPushInfo();
  if(!info.supported)return{state:'unsupported',message:'Push notifications are not supported in this browser.'};
  if(info.ios&&!info.standalone)return{state:'install',message:'Add Thought Of to your Home Screen to enable notifications.'};
  if(Notification.permission==='denied')return{state:'denied',message:'Notifications are off for Thought Of in iPhone Settings.'};
  if(Notification.permission!=='granted')return{state:'ready',message:'Know when one of your People is thinking of you.'};
  const reg=await navigator.serviceWorker.ready,sub=await reg.pushManager.getSubscription();
  if(!sub)return{state:'ready',message:'Know when one of your People is thinking of you.'};
  try{await saveSubscription(token,userId,sub)}catch(e){}
  return{state:'on',message:'Notifications are on for this iPhone.'};
};
window.thoughtPushEnable=async(token,userId)=>{
  const info=window.thoughtPushInfo();
  if(!info.supported)throw Error('Push notifications are not supported here.');
  if(info.ios&&!info.standalone)return{state:'install'};
  const permission=await Notification.requestPermission();
  if(permission!=='granted')return{state:'denied'};
  const reg=await navigator.serviceWorker.ready;
  let sub=await reg.pushManager.getSubscription();
  if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(VAPID_PUBLIC)});
  await saveSubscription(token,userId,sub);
  return{state:'on'};
};
window.thoughtPushUnregister=async(token,userId)=>{if(token&&userId)await deleteRegistration(token,userId)};

if('serviceWorker' in navigator){navigator.serviceWorker.register('./thought-sw.js',{scope:'./'}).catch(e=>console.error('service worker registration failed',e))}

function findApp(){try{let w=host.contentWindow;for(let i=0;i<14;i++){if(w?.document?.getElementById('peopleList'))return w;const f=w?.document?.querySelector('iframe');if(!f)break;w=f.contentWindow}}catch(e){}return null}
function start(){
  const w=findApp();if(!w){setTimeout(start,500);return}
  const d=w.document;if(d.getElementById('pushNotificationsCard'))return;
  const css=d.createElement('style');css.textContent=`.push-card{margin-top:12px}.push-card-title{font-size:17px;font-weight:650}.push-card-copy{margin-top:4px;color:#777;font-size:13px;line-height:1.4}.push-status{margin-top:9px;color:#777;font-size:13px;line-height:1.35}.push-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.22);z-index:180;display:flex;align-items:flex-end;justify-content:center}.push-sheet{width:min(480px,100%);background:#fff;border-radius:24px 24px 0 0;padding:20px 20px calc(20px + env(safe-area-inset-bottom));box-shadow:0 -4px 20px rgba(0,0,0,.12)}.push-sheet h2{margin:0 0 8px;font-size:22px}.push-sheet p{color:#777;font-size:14px;line-height:1.45}.push-steps{margin:16px 0 18px;padding-left:22px;line-height:1.6}`;d.head.appendChild(css);
  const anchor=d.getElementById('archivePeople')||d.getElementById('logout');
  const card=d.createElement('div');card.id='pushNotificationsCard';card.className='card push-card';card.innerHTML='<div class="push-card-title">Push notifications</div><div class="push-card-copy">Know when one of your People is thinking of you.</div><button id="pushNotificationsBtn" class="secondary full">Turn on notifications</button><div id="pushNotificationsStatus" class="push-status"></div>';anchor.before(card);
  const s=d.createElement('script');s.textContent=`
  function pushInstallSheet(){let back=document.createElement('div');back.className='push-backdrop';let sh=document.createElement('div');sh.className='push-sheet';sh.innerHTML='<h2>Add Thought Of to Home Screen</h2><p>iPhone allows web push notifications from Home Screen web apps.</p><ol class="push-steps"><li>Tap the Share button in Safari.</li><li>Choose <b>Add to Home Screen</b>.</li><li>Open Thought Of from the new Home Screen icon.</li><li>Go back to Account and tap <b>Turn on notifications</b>.</li></ol>';let done=document.createElement('button');done.className='secondary full';done.textContent='Got it';done.onclick=()=>back.remove();sh.appendChild(done);back.appendChild(sh);back.onclick=e=>{if(e.target===back)back.remove()};document.body.appendChild(back)}
  async function refreshPushUI(){if(!me)return;let btn=document.getElementById('pushNotificationsBtn'),status=document.getElementById('pushNotificationsStatus');try{let x=await window.top.thoughtPushCheck(token,me.id);status.textContent=x.message||'';if(x.state==='on'){btn.textContent='Notifications on';btn.disabled=true}else if(x.state==='install'){btn.textContent='How to turn on notifications';btn.disabled=false}else if(x.state==='denied'){btn.textContent='Notifications off';btn.disabled=true}else{btn.textContent='Turn on notifications';btn.disabled=false}}catch(e){status.textContent=e.message}}
  document.getElementById('pushNotificationsBtn').onclick=async()=>{let info=window.top.thoughtPushInfo();if(info.ios&&!info.standalone){pushInstallSheet();return}let btn=document.getElementById('pushNotificationsBtn'),status=document.getElementById('pushNotificationsStatus');btn.disabled=true;status.textContent='Turning on notifications…';try{let x=await window.top.thoughtPushEnable(token,me.id);if(x.state==='on'){btn.textContent='Notifications on';status.textContent='Notifications are on for this iPhone.'}else if(x.state==='denied'){btn.textContent='Notifications off';status.textContent='Notifications are off for Thought Of in iPhone Settings.'}else{btn.disabled=false;status.textContent='Could not turn on notifications.'}}catch(e){btn.disabled=false;status.textContent=e.message}};
  const oldScreenForPush=screen;screen=function(n){oldScreenForPush(n);if(n==='account')setTimeout(refreshPushUI,50)};window.screen=screen;
  const originalApiForPush=api;api=async function(path,o={}){let result=await originalApiForPush(path,o);let method=(o.method||'GET').toUpperCase();if(method==='POST'&&path==='/rest/v1/thoughts'&&result?.[0]?.id){setTimeout(()=>fn('send-thought-notification',{thought_id:result[0].id}).catch(()=>{}),0)}return result};
  const logoutForPush=document.getElementById('logout'),oldLogoutForPush=logoutForPush.onclick;logoutForPush.onclick=async()=>{try{if(me)await window.top.thoughtPushUnregister(token,me.id)}catch(e){}oldLogoutForPush()};
  if(me)refreshPushUI();
  `;d.body.appendChild(s);
}
host.addEventListener('load',()=>setTimeout(start,900));setTimeout(start,900);
})();
