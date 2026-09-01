(()=>{
const host=document.getElementById('thoughtApp');
function findApp(){
  try{
    let w=host.contentWindow;
    for(let i=0;i<7;i++){
      if(w?.document?.getElementById('peopleList')) return w;
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
  if(d.getElementById('relationshipMenu')) return;

  const css=d.createElement('style');
  css.textContent=`
  .relationship-menu{width:44px;height:44px;border-radius:14px;padding:0;background:#f3f3f3;color:#111;font-size:22px;line-height:1}
  .archive-open{margin-top:12px}
  .rel-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.22);z-index:150;display:flex;align-items:flex-end;justify-content:center}
  .rel-sheet{width:min(480px,100%);max-height:86vh;overflow:auto;background:#fff;border-radius:24px 24px 0 0;padding:20px 20px calc(20px + env(safe-area-inset-bottom));box-shadow:0 -4px 20px rgba(0,0,0,.12)}
  .rel-sheet h2{margin:0 0 6px;font-size:22px}.rel-sheet .rel-sub{margin:0 0 16px;color:#777;font-size:14px;line-height:1.4}
  .rel-option{width:100%;margin-top:9px;background:#f3f3f3;color:#111;text-align:left;font-size:17px}.rel-danger{color:#a00;background:#fff;border:1px solid #ead0d0}
  .archive-row{padding:14px 0;border-bottom:1px solid #eee}.archive-top{display:flex;align-items:center;gap:12px}.archive-initial{width:48px;height:48px;border-radius:50%;background:#efefef;display:flex;align-items:center;justify-content:center;font-weight:600;flex:0 0 auto}.archive-copy{flex:1;min-width:0}.archive-name{font-size:17px;font-weight:650}.archive-meta{font-size:12px;color:#888;margin-top:3px}.archive-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}.archive-actions button{padding:8px 11px;border-radius:12px;background:#f3f3f3;color:#111;font-size:13px}.archive-actions .danger{color:#a00;background:#fff;border:1px solid #ead0d0}.archive-empty{text-align:center;color:#777;padding:28px 4px}.rel-status{font-size:13px;color:#777;margin-top:9px}`;
  d.head.appendChild(css);

  const top=d.querySelector('#history .topbar');
  const menu=d.createElement('button');
  menu.id='relationshipMenu';menu.className='relationship-menu';menu.textContent='•••';menu.setAttribute('aria-label','Person options');
  top.insertBefore(menu,top.lastElementChild);

  const logout=d.getElementById('logout');
  const archives=d.createElement('button');
  archives.id='archivePeople';archives.className='secondary full archive-open';archives.textContent='Archived People';
  logout.before(archives);

  const script=d.createElement('script');
  script.textContent=`
  let relationshipArchiveMode=false;
  function relInitials(n){return(n||'?').trim().split(/\\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'?'}
  function relDate(v){try{return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(new Date(v))}catch(e){return''}}
  function relSheet(title,sub){let back=document.createElement('div');back.className='rel-backdrop';let sh=document.createElement('div');sh.className='rel-sheet';let h=document.createElement('h2');h.textContent=title;sh.appendChild(h);if(sub){let p=document.createElement('p');p.className='rel-sub';p.textContent=sub;sh.appendChild(p)}back.appendChild(sh);back.onclick=e=>{if(e.target===back)back.remove()};document.body.appendChild(back);return{back,sh}}
  function relButton(sh,label,cls,fn){let b=document.createElement('button');b.className=(cls||'rel-option');b.textContent=label;b.onclick=fn;sh.appendChild(b);return b}
  function relConfirm(title,body,label,fn){document.querySelectorAll('.rel-backdrop').forEach(x=>x.remove());let x=relSheet(title,body);let go=relButton(x.sh,label,'rel-option rel-danger',async()=>{go.disabled=true;try{await fn();x.back.remove()}catch(e){go.disabled=false;alert(e.message)}});relButton(x.sh,'Cancel','secondary full',()=>x.back.remove())}
  function relSubtitle(){return document.getElementById('historyName')?.parentElement?.querySelector('.muted')}
  function resetActiveHistoryUI(){relationshipArchiveMode=false;let ro=document.getElementById('reachOut'),rm=document.getElementById('relationshipMenu'),st=relSubtitle();if(ro)ro.hidden=false;if(rm)rm.hidden=false;if(st)st.textContent='Thoughts'}
  const relOriginalOpenHistory=openHistory;
  openHistory=async function(c,p){resetActiveHistoryUI();return relOriginalOpenHistory(c,p)};
  const relOriginalBack=document.getElementById('back').onclick;
  document.getElementById('back').onclick=()=>{if(relationshipArchiveMode){relationshipArchiveMode=false;document.getElementById('history').hidden=true;document.getElementById('composer').hidden=true;resetActiveHistoryUI();screen('account');setTimeout(openArchiveSheet,80)}else relOriginalBack()};

  document.getElementById('relationshipMenu').onclick=()=>{
    if(relationshipArchiveMode||!currentConnection||!currentPerson)return;
    let name=currentPerson.display_name||'this person',x=relSheet(name,'Manage this connection.');
    relButton(x.sh,'Remove from People','rel-option',()=>relConfirm('Remove '+name+'?','You will both keep your own private archive of this Thought history for up to one year.','Remove',async()=>{await api('/rest/v1/rpc/remove_person',{method:'POST',body:{p_connection_id:currentConnection.id}});screen('people')}));
    relButton(x.sh,'Block','rel-option rel-danger',()=>relConfirm('Block '+name+'?','They will not be notified. They will be removed from your People, and future requests from them will be quietly suppressed. Each of you still keeps your own private archive.','Block',async()=>{await api('/rest/v1/rpc/set_person_block',{method:'POST',body:{p_connection_id:currentConnection.id,p_blocked:true}});screen('people')}));
    relButton(x.sh,'Cancel','secondary full',()=>x.back.remove());
  };

  async function openArchivedHistory(a){
    document.querySelectorAll('.rel-backdrop').forEach(x=>x.remove());relationshipArchiveMode=true;currentConnection={id:a.connection_id,status:'ended'};currentPerson={id:a.person_id,display_name:a.person_name};
    document.getElementById('app').hidden=true;document.getElementById('tabs').hidden=true;document.getElementById('history').hidden=false;document.getElementById('composer').hidden=true;document.getElementById('historyName').textContent=a.person_name||'Archived Person';let st=relSubtitle();if(st)st.textContent='Archived Thoughts';let ro=document.getElementById('reachOut'),rm=document.getElementById('relationshipMenu');if(ro)ro.hidden=true;if(rm)rm.hidden=true;message('historyMsg','');await loadThoughts();
  }

  async function openArchiveSheet(){
    document.querySelectorAll('.rel-backdrop').forEach(x=>x.remove());let x=relSheet('Archived People','Your archive is private. The other person cannot see whether you keep or delete yours.');let box=document.createElement('div');box.className='archive-list';box.innerHTML='<div class="archive-empty">Loading…</div>';x.sh.appendChild(box);relButton(x.sh,'Close','secondary full',()=>x.back.remove());
    try{let rows=await api('/rest/v1/rpc/get_archived_people',{method:'POST',body:{}});box.innerHTML='';if(!rows.length){box.innerHTML='<div class="archive-empty">No archived People.</div>';return}
      rows.forEach(a=>{let row=document.createElement('div');row.className='archive-row';let top=document.createElement('div');top.className='archive-top';let av=document.createElement('div');av.className='archive-initial';av.textContent=relInitials(a.person_name);let copy=document.createElement('div');copy.className='archive-copy';let nm=document.createElement('div');nm.className='archive-name';nm.textContent=a.person_name||'Archived Person';let meta=document.createElement('div');meta.className='archive-meta';meta.textContent='Archive kept until '+relDate(a.archive_expires_at);copy.append(nm,meta);top.append(av,copy);row.appendChild(top);let actions=document.createElement('div');actions.className='archive-actions';
        if(a.history_available){let view=document.createElement('button');view.textContent='View history';view.onclick=()=>openArchivedHistory(a);actions.appendChild(view)}
        if(!a.blocked_by_me){let rec=document.createElement('button');rec.textContent='Reconnect';rec.onclick=async()=>{rec.disabled=true;try{await api('/rest/v1/rpc/request_reconnect',{method:'POST',body:{p_connection_id:a.connection_id}});rec.textContent='Request sent'}catch(e){rec.disabled=false;alert(e.message)}};actions.appendChild(rec)}
        let block=document.createElement('button');block.textContent=a.blocked_by_me?'Unblock':'Block';block.onclick=async()=>{block.disabled=true;try{await api('/rest/v1/rpc/set_person_block',{method:'POST',body:{p_connection_id:a.connection_id,p_blocked:!a.blocked_by_me}});x.back.remove();openArchiveSheet()}catch(e){block.disabled=false;alert(e.message)}};actions.appendChild(block);
        let del=document.createElement('button');del.className='danger';del.textContent='Delete archive';del.onclick=()=>relConfirm('Delete your archive with '+(a.person_name||'this person')+'?','This deletes only your copy of the archived Thought history. It cannot be undone, and the other person’s archive is unaffected.','Delete archive',async()=>{await api('/rest/v1/rpc/delete_my_archive',{method:'POST',body:{p_connection_id:a.connection_id}});screen('account')});actions.appendChild(del);row.appendChild(actions);box.appendChild(row)})
    }catch(e){box.innerHTML='<p class="error">'+e.message+'</p>'}
  }
  window.openArchiveSheet=openArchiveSheet;
  document.getElementById('archivePeople').onclick=openArchiveSheet;
  `;
  d.body.appendChild(script);
}
if(host.complete)start();host.addEventListener('load',()=>setTimeout(start,800));setTimeout(start,800);
})();