(()=>{
const host=document.getElementById('thoughtApp');
function findApp(){
  try{
    let w=host.contentWindow;
    for(let i=0;i<4;i++){
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
  if(d.getElementById('groupStrip')) return;
  const css=d.createElement('style');
  css.textContent=`
  .group-strip{display:flex;gap:8px;overflow-x:auto;padding:2px 0 8px;scrollbar-width:none}.group-strip::-webkit-scrollbar{display:none}
  .group-chip{flex:0 0 auto;border:1px solid #ddd;background:#fff;color:#111;border-radius:999px;padding:8px 13px;font-size:14px;font-weight:550}
  .group-chip.active{background:#111;color:#fff;border-color:#111}.group-manage-row{display:flex;justify-content:flex-end;margin:0 0 4px}.group-manage{background:none;color:#777;padding:4px 2px;font-size:13px}
  .group-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.22);z-index:120;display:flex;align-items:flex-end;justify-content:center}
  .group-sheet{width:min(480px,100%);max-height:84vh;overflow:auto;background:#fff;border-radius:24px 24px 0 0;padding:20px 20px calc(20px + env(safe-area-inset-bottom));box-shadow:0 -4px 20px rgba(0,0,0,.12)}
  .group-sheet h2{margin:0 0 6px;font-size:22px}.group-sheet .sub{margin:0 0 15px;color:#777;font-size:14px}.group-sheet label.name-label{display:block;font-size:13px;color:#777;margin-bottom:6px}
  .group-people{margin-top:18px;border-top:1px solid #eee}.group-person{display:flex;align-items:center;gap:12px;padding:13px 2px;border-bottom:1px solid #eee}.group-person input{width:auto!important;transform:scale(1.2)}
  .group-person-name{flex:1}.group-delete{background:#fff;color:#a00;border:1px solid #e5caca}.group-note{font-size:12px;color:#999;margin-top:10px}`;
  d.head.appendChild(css);

  const people=d.getElementById('people');
  const top=people.querySelector('.topbar');
  const title=top.querySelector('h1'); title.id='peopleTitle';
  const strip=d.createElement('div'); strip.id='groupStrip'; strip.className='group-strip';
  const manageRow=d.createElement('div'); manageRow.className='group-manage-row';
  const manage=d.createElement('button'); manage.id='manageGroups'; manage.className='group-manage'; manage.textContent='Manage'; manageRow.appendChild(manage);
  top.after(strip,manageRow);

  const script=d.createElement('script');
  script.textContent=`
  let groupState={defaultName:'Your People',groups:[],memberships:[],selected:null,loaded:false};
  function currentGroup(){return groupState.selected?groupState.groups.find(g=>g.id===groupState.selected):null}
  async function loadGroupState(){
    if(!me)return;
    let [prefs,gs,ms]=await Promise.all([
      api('/rest/v1/user_preferences?user_id=eq.'+me.id+'&select=default_group_name'),
      api('/rest/v1/groups?owner_id=eq.'+me.id+'&select=id,name,created_at&order=created_at.asc'),
      api('/rest/v1/group_memberships?owner_id=eq.'+me.id+'&select=group_id,connection_id')
    ]);
    groupState.defaultName=prefs[0]?.default_group_name||'Your People';groupState.groups=gs||[];groupState.memberships=ms||[];
    if(groupState.selected&&!groupState.groups.some(g=>g.id===groupState.selected))groupState.selected=null;
    groupState.loaded=true;renderGroupStrip();
  }
  function renderGroupStrip(){
    let s=document.getElementById('groupStrip');if(!s)return;s.innerHTML='';
    let all=document.createElement('button');all.className='group-chip'+(!groupState.selected?' active':'');all.textContent=groupState.defaultName;all.onclick=()=>{groupState.selected=null;renderGroupStrip();groupLoadPeople()};s.appendChild(all);
    groupState.groups.forEach(g=>{let b=document.createElement('button');b.className='group-chip'+(groupState.selected===g.id?' active':'');b.textContent=g.name;b.onclick=()=>{groupState.selected=g.id;renderGroupStrip();groupLoadPeople()};s.appendChild(b)});
    let add=document.createElement('button');add.className='group-chip';add.textContent='＋ Group';add.onclick=()=>openGroupEditor(null);s.appendChild(add);
    document.getElementById('peopleTitle').textContent=currentGroup()?.name||groupState.defaultName;
  }
  async function groupLoadPeople(){
    if(!me)return; if(!groupState.loaded)await loadGroupState();
    let b=document.getElementById('peopleList');b.innerHTML='<div class="empty">Loading…</div>';
    try{
      let cs=await api('/rest/v1/connections?status=eq.active&or=(user_a.eq.'+me.id+',user_b.eq.'+me.id+')&select=*');
      if(groupState.selected){let allowed=new Set(groupState.memberships.filter(x=>x.group_id===groupState.selected).map(x=>x.connection_id));cs=cs.filter(c=>allowed.has(c.id))}
      if(!cs.length){b.innerHTML='<div class="empty">'+(groupState.selected?'No People in this group yet.':'No People yet.')+'</div>';return}
      let cids=cs.map(c=>c.id),ids=cs.map(c=>c.user_a===me.id?c.user_b:c.user_a);
      let [ps,cms,ths]=await Promise.all([
        api('/rest/v1/profiles?id=in.('+ids.join(',')+')&select=id,display_name,avatar_path,whatsapp_enabled'),
        api('/rest/v1/connection_members?user_id=eq.'+me.id+'&connection_id=in.('+cids.join(',')+')&select=connection_id,last_opened_at'),
        api('/rest/v1/thoughts?connection_id=in.('+cids.join(',')+')&select=connection_id,sender_id,created_at&order=created_at.desc')
      ]);
      let pmap=Object.fromEntries(ps.map(p=>[p.id,p])),cmap=Object.fromEntries(cms.map(c=>[c.connection_id,c])),latest={};ths.forEach(t=>{if(t.sender_id!==me.id&&!latest[t.connection_id])latest[t.connection_id]=t});
      b.innerHTML='<div class="people-grid"></div>';let grid=b.firstChild;
      for(let c of cs){let oid=c.user_a===me.id?c.user_b:c.user_a,p=pmap[oid]||{id:oid,display_name:'New Person'},opened=cmap[c.id]?.last_opened_at,incoming=latest[c.id],unread=!!incoming&&(!opened||new Date(incoming.created_at)>new Date(opened)),x=document.createElement('button');x.className='person-float';x.innerHTML='<span class="head-wrap"><span class="head-circle"></span><span class="thought-trail"><span class="d1"></span><span class="d2"></span><span class="d3"></span></span></span><span class="head-name"></span>';x.querySelector('.head-name').textContent=p.display_name||'New Person';if(unread)x.querySelector('.thought-trail').classList.add('unread');x.onclick=()=>openHistory(c,p);grid.appendChild(x);placeAvatar(x.querySelector('.head-circle'),p)}
    }catch(e){b.innerHTML='<p class="error">'+e.message+'</p>'}
  }
  async function groupPeopleOptions(){
    let cs=await api('/rest/v1/connections?status=eq.active&or=(user_a.eq.'+me.id+',user_b.eq.'+me.id+')&select=*');if(!cs.length)return[];
    let ids=cs.map(c=>c.user_a===me.id?c.user_b:c.user_a),ps=await api('/rest/v1/profiles?id=in.('+ids.join(',')+')&select=id,display_name');let pm=Object.fromEntries(ps.map(p=>[p.id,p]));
    return cs.map(c=>{let oid=c.user_a===me.id?c.user_b:c.user_a;return{connection_id:c.id,name:pm[oid]?.display_name||'New Person'}}).sort((a,b)=>a.name.localeCompare(b.name));
  }
  async function openGroupEditor(group){
    let backdrop=document.createElement('div');backdrop.className='group-backdrop';let sh=document.createElement('div');sh.className='group-sheet';
    let isDefault=group==='default',g=isDefault?null:group,selected=new Set(g?groupState.memberships.filter(x=>x.group_id===g.id).map(x=>x.connection_id):[]);
    let h=document.createElement('h2');h.textContent=isDefault?'Rename Your People':(g?'Manage Group':'New Group');let sub=document.createElement('p');sub.className='sub';sub.textContent=isDefault?'This changes only your private name for the all-People view.':'Groups are private and never change a person’s Thought history.';
    let lab=document.createElement('label');lab.className='name-label';lab.textContent='Name';let inp=document.createElement('input');inp.maxLength=30;inp.placeholder=isDefault?'Your People':'Group name';inp.value=isDefault?groupState.defaultName:(g?.name||'');sh.append(h,sub,lab,inp);
    if(!isDefault){let opts=await groupPeopleOptions(),list=document.createElement('div');list.className='group-people';for(let o of opts){let row=document.createElement('label');row.className='group-person';let cb=document.createElement('input');cb.type='checkbox';cb.checked=selected.has(o.connection_id);cb.onchange=()=>cb.checked?selected.add(o.connection_id):selected.delete(o.connection_id);let nm=document.createElement('span');nm.className='group-person-name';nm.textContent=o.name;row.append(cb,nm);list.appendChild(row)}sh.appendChild(list)}
    let save=document.createElement('button');save.className='full';save.textContent='Save';save.onclick=async()=>{let name=inp.value.trim();if(!name)return;save.disabled=true;try{
      if(isDefault){await api('/rest/v1/user_preferences?on_conflict=user_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:{user_id:me.id,default_group_name:name}});groupState.defaultName=name}
      else{let gid=g?.id;if(gid){await api('/rest/v1/groups?id=eq.'+gid,{method:'PATCH',headers:{Prefer:'return=minimal'},body:{name}})}else{let z=await api('/rest/v1/groups',{method:'POST',headers:{Prefer:'return=representation'},body:{owner_id:me.id,name}});gid=z[0]?.id;if(!gid)throw Error('Could not create group')}
        await api('/rest/v1/group_memberships?group_id=eq.'+gid+'&owner_id=eq.'+me.id,{method:'DELETE',headers:{Prefer:'return=minimal'}});let rows=[...selected].map(cid=>({group_id:gid,connection_id:cid,owner_id:me.id}));if(rows.length)await api('/rest/v1/group_memberships',{method:'POST',headers:{Prefer:'return=minimal'},body:rows});groupState.selected=gid}
      backdrop.remove();groupState.loaded=false;await loadGroupState();await groupLoadPeople();
    }catch(e){alert(e.message)}finally{save.disabled=false}};sh.appendChild(save);
    if(g&&!isDefault){let del=document.createElement('button');del.className='group-delete full';del.textContent='Delete group';del.onclick=async()=>{if(!confirm('Delete '+g.name+'?'))return;try{await api('/rest/v1/groups?id=eq.'+g.id,{method:'DELETE',headers:{Prefer:'return=minimal'}});groupState.selected=null;backdrop.remove();groupState.loaded=false;await loadGroupState();await groupLoadPeople()}catch(e){alert(e.message)}};sh.appendChild(del)}
    let cancel=document.createElement('button');cancel.className='secondary full';cancel.textContent='Cancel';cancel.onclick=()=>backdrop.remove();sh.appendChild(cancel);backdrop.appendChild(sh);backdrop.onclick=e=>{if(e.target===backdrop)backdrop.remove()};document.body.appendChild(backdrop);setTimeout(()=>inp.focus(),100)
  }
  document.getElementById('manageGroups').onclick=()=>{let g=currentGroup();openGroupEditor(g||'default')};
  loadPeople=groupLoadPeople;
  const oldAppOnly=appOnly;appOnly=function(){groupState.loaded=false;oldAppOnly();setTimeout(async()=>{try{await loadGroupState();await groupLoadPeople()}catch(e){}},0)};
  if(me){loadGroupState().then(groupLoadPeople).catch(()=>{})}
  `;
  d.body.appendChild(script);
}
if(host.complete)start();host.addEventListener('load',()=>setTimeout(start,700));setTimeout(start,700);
})();