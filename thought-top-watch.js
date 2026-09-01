(()=>{
const host=document.getElementById('thoughtApp');
const SB='https://dlaxhooizwxitjxcjyyf.supabase.co';
const KEY='sb_publishable_cnNOjkZ1yi5uAPdFv8SDJQ_i_HwSAbA';
let lastConnection=null,lastSignature=null,busy=false;

function findApp(){
  try{
    let w=host?.contentWindow;
    for(let i=0;i<18;i++){
      if(w?.document?.getElementById('peopleList')) return w;
      const f=w?.document?.querySelector('iframe');
      if(!f) break;
      w=f.contentWindow;
    }
  }catch(e){}
  return null;
}

function ensureBridge(w){
  if(w.__thoughtTopBridgeReady) return true;
  try{
    const s=w.document.createElement('script');
    s.textContent=`
      window.__thoughtTopState=()=>({
        connectionId: currentConnection?.id||null,
        historyOpen: !!document.getElementById('history') && !document.getElementById('history').hidden,
        archived: (typeof relationshipArchiveMode!=='undefined'&&relationshipArchiveMode===true),
        ended: currentConnection?.status==='ended'
      });
      window.__thoughtTopRefresh=async()=>{try{await loadThoughts();if(typeof markOpened==='function')await markOpened()}catch(e){}};
      window.__thoughtTopBridgeReady=true;
    `;
    w.document.body.appendChild(s);
    return !!w.__thoughtTopBridgeReady;
  }catch(e){return false}
}

async function rest(path,token){
  const sep=path.includes('?')?'&':'?';
  const r=await fetch(SB+path+sep+'_rt='+Date.now(),{
    method:'GET',
    cache:'no-store',
    headers:{apikey:KEY,Authorization:'Bearer '+token,'Cache-Control':'no-cache, no-store, max-age=0',Pragma:'no-cache'}
  });
  if(!r.ok) throw Error('watch fetch '+r.status);
  return r.json();
}

async function snapshot(connectionId,token){
  const thoughts=await rest('/rest/v1/thoughts?connection_id=eq.'+encodeURIComponent(connectionId)+'&select=id,sender_id,body,created_at&order=created_at.asc',token);
  let reactions=[];
  if(thoughts.length){
    const ids=thoughts.map(t=>t.id).join(',');
    reactions=await rest('/rest/v1/reactions?thought_id=in.('+ids+')&select=thought_id,user_id,emoji&order=thought_id.asc,user_id.asc',token).catch(()=>[]);
  }
  return JSON.stringify({thoughts,reactions});
}

async function tick(){
  if(busy) return;
  const w=findApp();
  if(!w||!ensureBridge(w)) return;
  let st;
  try{st=w.__thoughtTopState()}catch(e){return}
  if(!st?.historyOpen||!st.connectionId||st.archived||st.ended){
    lastConnection=null;lastSignature=null;return;
  }
  const token=localStorage.getItem('thoughtof_token')||'';
  if(!token) return;
  busy=true;
  try{
    const sig=await snapshot(st.connectionId,token);
    if(lastConnection!==st.connectionId){
      lastConnection=st.connectionId;lastSignature=sig;return;
    }
    if(lastSignature===null){lastSignature=sig;return}
    if(sig!==lastSignature){
      lastSignature=sig;
      await w.__thoughtTopRefresh();
    }
  }catch(e){}finally{busy=false}
}

setInterval(tick,400);
setTimeout(tick,150);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(tick,0)});
window.addEventListener('focus',()=>setTimeout(tick,0));
})();
