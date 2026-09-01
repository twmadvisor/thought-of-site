(()=>{
const host=document.getElementById('thoughtApp');
function findApp(){
  try{
    let w=host.contentWindow;
    for(let i=0;i<18;i++){
      if(w?.document?.getElementById('peopleList'))return w;
      const f=w?.document?.querySelector('iframe');
      if(!f)break;
      w=f.contentWindow;
    }
  }catch(e){}
  return null;
}
function start(){
  const w=findApp();
  if(!w){setTimeout(start,400);return}
  const d=w.document;
  if(d.getElementById('thoughtTimestampStyles2'))return;

  const css=d.createElement('style');
  css.id='thoughtTimestampStyles2';
  css.textContent=`
    .thought-time{font-size:11px;line-height:1.2;color:#999;opacity:0;max-height:0;overflow:hidden;margin-top:0;transition:opacity .14s ease,max-height .14s ease,margin-top .14s ease;pointer-events:none;white-space:nowrap}
    .thought-time.shown{opacity:1;max-height:18px;margin-top:8px}
    @media (hover:hover) and (pointer:fine){.thought-row:hover .thought-time{opacity:1;max-height:18px;margin-top:8px}}
  `;
  d.head.appendChild(css);

  const timers={};
  function format(value){
    const dt=new Date(value),now=new Date();
    const sameDay=dt.getFullYear()===now.getFullYear()&&dt.getMonth()===now.getMonth()&&dt.getDate()===now.getDate();
    const time=dt.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
    if(sameDay)return time;
    const sameYear=dt.getFullYear()===now.getFullYear();
    const date=dt.toLocaleDateString([],sameYear?{month:'short',day:'numeric'}:{month:'short',day:'numeric',year:'numeric'});
    return date+', '+time;
  }

  let syncing=false,lastKey='';
  async function sync(){
    if(syncing)return;
    const list=d.getElementById('thoughtList');
    const history=d.getElementById('history');
    const c=w.currentConnection;
    if(!list||!history||history.hidden||!c?.id)return;
    const rows=[...list.querySelectorAll('.thought-row')];
    if(!rows.length)return;
    syncing=true;
    try{
      const ts=await w.api('/rest/v1/thoughts?connection_id=eq.'+c.id+'&select=id,created_at&order=created_at.asc');
      const key=c.id+'|'+ts.map(x=>x.id).join(',')+'|'+rows.length;
      if(key===lastKey && rows.every(r=>r.querySelector('.thought-time')))return;
      lastKey=key;
      rows.forEach((row,i)=>{
        const t=ts[i];
        if(!t)return;
        let stamp=row.querySelector('.thought-time');
        if(!stamp){
          stamp=d.createElement('div');
          stamp.className='thought-time';
          const bubble=row.querySelector('.bubble');
          if(bubble)bubble.after(stamp); else row.appendChild(stamp);
        }
        stamp.dataset.thoughtId=t.id;
        stamp.textContent=format(t.created_at);
      });
    }catch(e){}finally{syncing=false}
  }

  d.addEventListener('click',e=>{
    const bubble=e.target.closest?.('.bubble');
    if(!bubble)return;
    const row=bubble.closest('.thought-row');
    const stamp=row?.querySelector('.thought-time');
    if(!stamp)return;
    stamp.classList.add('shown');
    const id=stamp.dataset.thoughtId||Math.random();
    if(timers[id])clearTimeout(timers[id]);
    timers[id]=setTimeout(()=>{stamp.classList.remove('shown');delete timers[id]},3000);
  },true);

  const list=d.getElementById('thoughtList');
  if(list)new MutationObserver(()=>setTimeout(sync,0)).observe(list,{childList:true,subtree:true});
  setInterval(sync,700);
  setTimeout(sync,100);
}
host.addEventListener('load',()=>setTimeout(start,900));
setTimeout(start,900);
})();
