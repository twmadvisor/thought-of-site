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
  if(d.getElementById('thoughtTimestampBridge3'))return;

  const css=d.createElement('style');
  css.id='thoughtTimestampStyles3';
  css.textContent=`
    .thought-time{font-size:11px;line-height:1.2;color:#999;opacity:0;max-height:0;overflow:hidden;margin-top:0;transition:opacity .14s ease,max-height .14s ease,margin-top .14s ease;pointer-events:none;white-space:nowrap}
    .thought-time.shown{opacity:1;max-height:18px;margin-top:8px}
    @media (hover:hover) and (pointer:fine){.thought-row:hover .thought-time{opacity:1;max-height:18px;margin-top:8px}}
  `;
  d.head.appendChild(css);

  const s=d.createElement('script');
  s.id='thoughtTimestampBridge3';
  s.textContent=`
    const thoughtTimestampTimers3={};
    let thoughtTimestampCache3={connectionId:null,items:[],loadedAt:0};

    function formatThoughtTimestamp3(value){
      const dt=new Date(value),now=new Date();
      const sameDay=dt.getFullYear()===now.getFullYear()&&dt.getMonth()===now.getMonth()&&dt.getDate()===now.getDate();
      const time=dt.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
      if(sameDay)return time;
      const sameYear=dt.getFullYear()===now.getFullYear();
      const date=dt.toLocaleDateString([],sameYear?{month:'short',day:'numeric'}:{month:'short',day:'numeric',year:'numeric'});
      return date+', '+time;
    }

    async function getThoughtTimestampItems3(){
      if(!currentConnection?.id)return [];
      const id=currentConnection.id;
      if(thoughtTimestampCache3.connectionId===id && Date.now()-thoughtTimestampCache3.loadedAt<1500)return thoughtTimestampCache3.items;
      const items=await api('/rest/v1/thoughts?connection_id=eq.'+id+'&select=id,created_at&order=created_at.asc');
      thoughtTimestampCache3={connectionId:id,items,loadedAt:Date.now()};
      return items;
    }

    async function ensureThoughtTimestamp3(row){
      if(!row)return null;
      let stamp=row.querySelector('.thought-time');
      if(stamp)return stamp;
      const list=document.getElementById('thoughtList');
      const rows=[...list.querySelectorAll('.thought-row')];
      const index=rows.indexOf(row);
      if(index<0)return null;
      const items=await getThoughtTimestampItems3();
      const t=items[index];
      if(!t)return null;
      stamp=document.createElement('div');
      stamp.className='thought-time';
      stamp.dataset.thoughtId=t.id;
      stamp.textContent=formatThoughtTimestamp3(t.created_at);
      const bubble=row.querySelector('.bubble');
      if(bubble)bubble.after(stamp);else row.appendChild(stamp);
      return stamp;
    }

    document.addEventListener('click',async e=>{
      const bubble=e.target.closest?.('.bubble');
      if(!bubble)return;
      const row=bubble.closest('.thought-row');
      try{
        const stamp=await ensureThoughtTimestamp3(row);
        if(!stamp)return;
        stamp.classList.add('shown');
        const id=stamp.dataset.thoughtId||'x';
        if(thoughtTimestampTimers3[id])clearTimeout(thoughtTimestampTimers3[id]);
        thoughtTimestampTimers3[id]=setTimeout(()=>{stamp.classList.remove('shown');delete thoughtTimestampTimers3[id]},3000);
      }catch(err){}
    },true);

    document.addEventListener('mouseover',e=>{
      const bubble=e.target.closest?.('.bubble');
      if(!bubble)return;
      ensureThoughtTimestamp3(bubble.closest('.thought-row')).catch(()=>{});
    },true);
  `;
  d.body.appendChild(s);
}
host.addEventListener('load',()=>setTimeout(start,900));
setTimeout(start,900);
})();
