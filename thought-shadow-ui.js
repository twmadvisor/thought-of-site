(()=>{
const host=document.getElementById('thoughtApp');
function findApp(){
  try{
    let w=host.contentWindow;
    for(let i=0;i<8;i++){
      if(w?.document?.getElementById('relationshipMenu')) return w;
      const f=w?.document?.querySelector('iframe');
      if(!f) break;
      w=f.contentWindow;
    }
  }catch(e){}
  return null;
}
function start(){
  const w=findApp();
  if(!w){setTimeout(start,500);return}
  const d=w.document;
  if(d.getElementById('shadowBlockPatch')) return;
  const s=d.createElement('script');
  s.id='shadowBlockPatch';
  s.textContent=`
  document.getElementById('relationshipMenu').onclick=()=>{
    if(relationshipArchiveMode||!currentConnection||!currentPerson)return;
    let name=currentPerson.display_name||'this person',x=relSheet(name,'Manage this connection.');
    relButton(x.sh,'Remove from People','rel-option',()=>relConfirm('Remove '+name+'?','You will both keep your own private archive of this Thought history for up to one year.','Remove',async()=>{await api('/rest/v1/rpc/remove_person',{method:'POST',body:{p_connection_id:currentConnection.id}});screen('people')}));
    relButton(x.sh,'Block','rel-option rel-danger',()=>relConfirm('Block '+name+'?','They will not be notified. They will still see you in their People and their Thoughts will appear to send normally, but you will not receive those Thoughts inside Thought Of. Text/iMessage and WhatsApp outside Thought Of are not affected.','Block',async()=>{await api('/rest/v1/rpc/set_person_block',{method:'POST',body:{p_connection_id:currentConnection.id,p_blocked:true}});screen('people')}));
    relButton(x.sh,'Cancel','secondary full',()=>x.back.remove());
  };
  const shadowArchiveOpen=openArchiveSheet;
  function openShadowArchiveSheet(){
    shadowArchiveOpen();
    setTimeout(()=>{
      document.querySelectorAll('.archive-meta').forEach(m=>{
        if(/1970/.test(m.textContent||''))m.textContent='No archived history.';
      });
    },80);
  }
  window.openArchiveSheet=openShadowArchiveSheet;
  document.getElementById('archivePeople').onclick=openShadowArchiveSheet;
  `;
  d.body.appendChild(s);
}
host.addEventListener('load',()=>setTimeout(start,900));
setTimeout(start,900);
})();