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
  if(d.getElementById('thoughtTimestampStyles'))return;

  const css=d.createElement('style');
  css.id='thoughtTimestampStyles';
  css.textContent=`
    .thought-time{font-size:11px;line-height:1.2;color:#999;opacity:0;max-height:0;overflow:hidden;margin-top:0;transition:opacity .14s ease,max-height .14s ease,margin-top .14s ease;pointer-events:none;white-space:nowrap}
    .thought-time.shown{opacity:1;max-height:18px;margin-top:8px}
    @media (hover:hover) and (pointer:fine){.thought-row:hover .thought-time{opacity:1;max-height:18px;margin-top:8px}}
  `;
  d.head.appendChild(css);

  const s=d.createElement('script');
  s.id='thoughtTimestampBridge';
  s.textContent=`
    const thoughtTimestampTimers={};
    function formatThoughtTimestamp(value){
      const dt=new Date(value),now=new Date();
      const sameDay=dt.getFullYear()===now.getFullYear()&&dt.getMonth()===now.getMonth()&&dt.getDate()===now.getDate();
      const time=dt.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
      if(sameDay)return time;
      const sameYear=dt.getFullYear()===now.getFullYear();
      const date=dt.toLocaleDateString([],sameYear?{month:'short',day:'numeric'}:{month:'short',day:'numeric',year:'numeric'});
      return date+', '+time;
    }
    function attachThoughtTimestamp(row,t){
      if(!row||!t?.created_at||row.querySelector('.thought-time'))return;
      const stamp=document.createElement('div');
      stamp.className='thought-time';
      stamp.textContent=formatThoughtTimestamp(t.created_at);
      const bubble=row.querySelector('.bubble');
      if(!bubble)return;
      bubble.after(stamp);
      bubble.addEventListener('click',()=>{
        stamp.classList.add('shown');
        if(thoughtTimestampTimers[t.id])clearTimeout(thoughtTimestampTimers[t.id]);
        thoughtTimestampTimers[t.id]=setTimeout(()=>{stamp.classList.remove('shown');delete thoughtTimestampTimers[t.id]},3000);
      });
    }
    const oldRenderThoughtTimestamp=renderThought;
    renderThought=function(t,...args){
      const before=document.querySelectorAll('#thoughtList .thought-row').length;
      const r=oldRenderThoughtTimestamp(t,...args);
      const rows=document.querySelectorAll('#thoughtList .thought-row');
      const row=rows[rows.length-1]||rows[before];
      attachThoughtTimestamp(row,t);
      return r;
    };
    if(currentConnection&&!document.getElementById('history').hidden)setTimeout(()=>loadThoughts(),0);
  `;
  d.body.appendChild(s);
}
host.addEventListener('load',()=>setTimeout(start,900));
setTimeout(start,900);
})();
