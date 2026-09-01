(()=>{
const host=document.getElementById('thoughtApp');
function findApp(){try{let w=host.contentWindow;for(let i=0;i<16;i++){if(w?.document?.getElementById('peopleList'))return w;const f=w?.document?.querySelector('iframe');if(!f)break;w=f.contentWindow}}catch(e){}return null}
function start(){
  const w=findApp();if(!w){setTimeout(start,500);return}
  const d=w.document;if(d.getElementById('thoughtRealtimeBridge'))return;
  const s=d.createElement('script');s.id='thoughtRealtimeBridge';s.type='module';s.textContent=`
  let thoughtRealtimeClient=null,thoughtRealtimeChannel=null,thoughtRealtimeConnectionId=null,thoughtRealtimeTimer=null,thoughtRealtimeRefreshing=false;
  async function thoughtRealtimeInit(){
    if(!thoughtRealtimeClient){
      const mod=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      thoughtRealtimeClient=mod.createClient(URL,KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
    }
    thoughtRealtimeClient.realtime.setAuth(token);
  }
  async function stopThoughtRealtime(){
    if(thoughtRealtimeTimer){clearTimeout(thoughtRealtimeTimer);thoughtRealtimeTimer=null}
    if(thoughtRealtimeChannel&&thoughtRealtimeClient){try{await thoughtRealtimeClient.removeChannel(thoughtRealtimeChannel)}catch(e){}}
    thoughtRealtimeChannel=null;thoughtRealtimeConnectionId=null;
  }
  async function refreshThoughtRealtime(){
    if(!thoughtRealtimeConnectionId||!currentConnection||currentConnection.id!==thoughtRealtimeConnectionId||document.getElementById('history').hidden)return;
    if(thoughtRealtimeRefreshing)return;
    thoughtRealtimeRefreshing=true;
    try{await loadThoughts();if(typeof markOpened==='function')await markOpened()}catch(e){}finally{thoughtRealtimeRefreshing=false}
  }
  function queueThoughtRealtimeRefresh(){
    if(thoughtRealtimeTimer)clearTimeout(thoughtRealtimeTimer);
    thoughtRealtimeTimer=setTimeout(refreshThoughtRealtime,90);
  }
  async function startThoughtRealtime(){
    const archived=(typeof relationshipArchiveMode!=='undefined'&&relationshipArchiveMode===true);
    if(!currentConnection?.id||currentConnection.status==='ended'||archived){await stopThoughtRealtime();return}
    const id=currentConnection.id;
    if(thoughtRealtimeChannel&&thoughtRealtimeConnectionId===id)return;
    await stopThoughtRealtime();
    try{
      await thoughtRealtimeInit();
      thoughtRealtimeConnectionId=id;
      thoughtRealtimeChannel=thoughtRealtimeClient.channel('thought-window-'+id+'-'+Date.now())
        .on('postgres_changes',{event:'*',schema:'public',table:'thoughts'},queueThoughtRealtimeRefresh)
        .on('postgres_changes',{event:'*',schema:'public',table:'reactions'},queueThoughtRealtimeRefresh)
        .subscribe();
    }catch(e){console.error('Thought realtime unavailable',e)}
  }
  const oldOpenHistoryRealtime=openHistory;
  openHistory=async function(c,p){let r=await oldOpenHistoryRealtime(c,p);setTimeout(startThoughtRealtime,0);return r};
  const backRealtime=document.getElementById('back'),oldBackRealtime=backRealtime.onclick;
  backRealtime.onclick=async()=>{await stopThoughtRealtime();if(oldBackRealtime)return oldBackRealtime()};
  const oldScreenRealtime=screen;
  screen=function(n){stopThoughtRealtime();return oldScreenRealtime(n)};window.screen=screen;
  window.addEventListener('beforeunload',()=>{try{stopThoughtRealtime()}catch(e){}});
  if(currentConnection&&!document.getElementById('history').hidden)setTimeout(startThoughtRealtime,0);
  `;
  d.body.appendChild(s);
}
host.addEventListener('load',()=>setTimeout(start,1000));setTimeout(start,1000);
})();