(()=>{
const host=document.getElementById('thoughtApp');
function findApp(){try{let w=host.contentWindow;for(let i=0;i<16;i++){if(w?.document?.getElementById('peopleList'))return w;const f=w?.document?.querySelector('iframe');if(!f)break;w=f.contentWindow}}catch(e){}return null}
function start(){
  const w=findApp();if(!w){setTimeout(start,500);return}
  const d=w.document;if(d.getElementById('thoughtRealtimeBridge'))return;
  const s=d.createElement('script');s.id='thoughtRealtimeBridge';s.textContent=`
  let thoughtLiveTimer=null,thoughtLiveConnectionId=null,thoughtLiveSignature=null,thoughtLiveBusy=false;

  function stopThoughtLive(){
    if(thoughtLiveTimer){clearInterval(thoughtLiveTimer);thoughtLiveTimer=null}
    thoughtLiveConnectionId=null;thoughtLiveSignature=null;thoughtLiveBusy=false;
  }

  async function thoughtLiveSnapshot(connectionId){
    const thoughts=await api('/rest/v1/thoughts?connection_id=eq.'+connectionId+'&select=id,sender_id,body,created_at&order=created_at.asc');
    let reactions=[];
    if(thoughts.length){
      const ids=thoughts.map(t=>t.id).join(',');
      try{reactions=await api('/rest/v1/reactions?thought_id=in.('+ids+')&select=thought_id,user_id,emoji&order=thought_id.asc,user_id.asc')}catch(e){}
    }
    return JSON.stringify({thoughts,reactions});
  }

  async function checkThoughtLive(){
    if(thoughtLiveBusy||!thoughtLiveConnectionId||!currentConnection||currentConnection.id!==thoughtLiveConnectionId||document.getElementById('history').hidden)return;
    const archived=(typeof relationshipArchiveMode!=='undefined'&&relationshipArchiveMode===true);
    if(archived||currentConnection.status==='ended'){stopThoughtLive();return}
    thoughtLiveBusy=true;
    try{
      const sig=await thoughtLiveSnapshot(thoughtLiveConnectionId);
      if(thoughtLiveSignature===null){thoughtLiveSignature=sig;return}
      if(sig!==thoughtLiveSignature){
        thoughtLiveSignature=sig;
        const y=window.scrollY,doc=document.documentElement,nearBottom=(doc.scrollHeight-(window.innerHeight+y))<140;
        await loadThoughts();
        if(typeof markOpened==='function')await markOpened();
        if(!nearBottom)window.scrollTo(0,y);
      }
    }catch(e){}finally{thoughtLiveBusy=false}
  }

  async function startThoughtLive(){
    const archived=(typeof relationshipArchiveMode!=='undefined'&&relationshipArchiveMode===true);
    if(!currentConnection?.id||currentConnection.status==='ended'||archived){stopThoughtLive();return}
    const id=currentConnection.id;
    if(thoughtLiveTimer&&thoughtLiveConnectionId===id)return;
    stopThoughtLive();thoughtLiveConnectionId=id;
    try{thoughtLiveSignature=await thoughtLiveSnapshot(id)}catch(e){thoughtLiveSignature=null}
    thoughtLiveTimer=setInterval(checkThoughtLive,650);
  }

  const oldOpenHistoryLive=openHistory;
  openHistory=async function(c,p){let r=await oldOpenHistoryLive(c,p);setTimeout(startThoughtLive,50);return r};

  const backThoughtLive=document.getElementById('back'),oldBackThoughtLive=backThoughtLive.onclick;
  backThoughtLive.onclick=()=>{stopThoughtLive();if(oldBackThoughtLive)return oldBackThoughtLive()};

  const oldScreenThoughtLive=screen;
  screen=function(n){stopThoughtLive();return oldScreenThoughtLive(n)};window.screen=screen;

  window.addEventListener('beforeunload',stopThoughtLive);
  if(currentConnection&&!document.getElementById('history').hidden)setTimeout(startThoughtLive,50);
  `;
  d.body.appendChild(s);
}
host.addEventListener('load',()=>setTimeout(start,900));setTimeout(start,900);
})();