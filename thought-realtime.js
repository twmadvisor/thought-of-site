(()=>{
const host=document.getElementById('thoughtApp');
function findApp(){try{let w=host.contentWindow;for(let i=0;i<16;i++){if(w?.document?.getElementById('peopleList'))return w;const f=w?.document?.querySelector('iframe');if(!f)break;w=f.contentWindow}}catch(e){}return null}
function start(){
  const w=findApp();if(!w){setTimeout(start,400);return}
  const d=w.document;if(d.getElementById('thoughtRealtimeBridge'))return;
  const s=d.createElement('script');s.id='thoughtRealtimeBridge';s.textContent=`
  let thoughtWatchConnectionId=null,thoughtWatchSignature=null,thoughtWatchBusy=false;

  async function thoughtWatchGet(path){
    const r=await fetch(URL+path,{method:'GET',headers:{apikey:KEY,Authorization:'Bearer '+token,Accept:'application/json'},cache:'no-store'});
    let data=[];try{data=await r.json()}catch(e){}
    if(!r.ok)throw Error(data?.message||data?.error||('Live refresh failed '+r.status));
    return data;
  }

  async function thoughtWatchSnapshot(connectionId){
    const thoughts=await thoughtWatchGet('/rest/v1/thoughts?connection_id=eq.'+connectionId+'&select=id,sender_id,body,created_at&order=created_at.asc');
    let reactions=[];
    if(thoughts.length){
      const ids=thoughts.map(t=>t.id).join(',');
      try{reactions=await thoughtWatchGet('/rest/v1/reactions?thought_id=in.('+ids+')&select=thought_id,user_id,emoji&order=thought_id.asc,user_id.asc')}catch(e){}
    }
    return JSON.stringify({thoughts,reactions});
  }

  async function thoughtWatchTick(){
    try{
      const history=document.getElementById('history');
      const archived=(typeof relationshipArchiveMode!=='undefined'&&relationshipArchiveMode===true);
      if(!history||history.hidden||!currentConnection?.id||currentConnection.status==='ended'||archived){
        thoughtWatchConnectionId=null;thoughtWatchSignature=null;return;
      }
      const id=currentConnection.id;
      if(thoughtWatchBusy)return;
      thoughtWatchBusy=true;
      const sig=await thoughtWatchSnapshot(id);
      if(thoughtWatchConnectionId!==id){
        thoughtWatchConnectionId=id;thoughtWatchSignature=sig;return;
      }
      if(thoughtWatchSignature===null){thoughtWatchSignature=sig;return}
      if(sig!==thoughtWatchSignature){
        thoughtWatchSignature=sig;
        const y=window.scrollY,doc=document.documentElement,nearBottom=(doc.scrollHeight-(window.innerHeight+y))<160;
        await loadThoughts();
        if(typeof markOpened==='function')await markOpened();
        if(!nearBottom)window.scrollTo(0,y);
      }
    }catch(e){}finally{thoughtWatchBusy=false}
  }

  setInterval(thoughtWatchTick,400);
  setTimeout(thoughtWatchTick,80);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(thoughtWatchTick,20)});
  window.addEventListener('focus',()=>setTimeout(thoughtWatchTick,20));
  window.addEventListener('pageshow',()=>setTimeout(thoughtWatchTick,20));
  `;
  d.body.appendChild(s);
}
host.addEventListener('load',()=>setTimeout(start,800));setTimeout(start,800);
})();