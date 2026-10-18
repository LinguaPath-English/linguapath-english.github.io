// Shared reporting uses recorded attempts, not inferred historical exercise counts.
const classroomSkills=['Listening','Reading','Writing','Speaking'];
function practiceEvents(state){return Object.values(state.practiceActivity||{}).filter(e=>e&&classroomSkills.includes(e.skill)&&Number.isFinite(e.at)&&typeof e.correct==='boolean').sort((a,b)=>a.at-b.at)}
function weeklyPractice(state,now=Date.now()){
  const events=practiceEvents(state),week=7*86400000;
  const current=events.filter(e=>e.at>now-week&&e.at<=now),previous=events.filter(e=>e.at>now-2*week&&e.at<=now-week);
  return {current:current.length,previous:previous.length,days:new Set(current.map(e=>e.day)).size,
    correct:current.filter(e=>e.correct).length,complete:!!state.practiceTrackingSince&&state.practiceTrackingSince<=now-2*week};
}
function assignmentProgress(assignment,state){
  const start=Date.parse(assignment.created_at),due=Date.parse(assignment.due_at),target=Number(assignment.target);
  const events=practiceEvents(state).filter(e=>e.at>=start&&e.at<=Date.now()&&(assignment.skill==='Any'||e.skill===assignment.skill));
  const count=Math.min(target,events.length),completedAt=events[target-1]?.at||0;
  return {count,target,complete:count>=target,completedAt,onTime:!!completedAt&&completedAt<=due,
    overdue:Date.now()>due&&count<target};
}

if(typeof document!=='undefined'&&document.querySelector('#check-answer'))(()=>{
  const panel=document.createElement('section');panel.className='class-assignments';panel.hidden=true;
  panel.setAttribute('aria-label','Class assignments');
  document.querySelector('#today .lower-grid').after(panel);
  let assignments=[],message='';
  const text=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function display(){
    if(!window.__lpCloudUser){panel.hidden=true;return}
    panel.hidden=!assignments.length&&!message;
    panel.innerHTML='<h2>Class assignments</h2>'+(message?`<p role="status">${text(message)}</p><button class="secondary" type="button" data-assignment-refresh>Retry</button>`:'')+assignments.map(a=>{
      const p=assignmentProgress(a,st),status=p.complete?(p.onTime?'Completed':'Completed late'):p.overdue?'Past due':'In progress';
      return `<article><strong>${text(a.title)}</strong><p>${text(a.skill)} · ${p.count} / ${p.target} exercises · ${status}</p><progress max="${p.target}" value="${p.count}" aria-label="Assignment exercises completed"></progress><small>Due ${text(new Date(a.due_at).toLocaleString())}. Counts answered exercises after assignment creation, including retries.</small></article>`;
    }).join('');
  }
  async function refresh(){
    const user=window.__lpCloudUser?.id;if(!user)return;
    try{
      if(!await refreshCloudSession())throw Error('Log in again to load class assignments.');
      const response=await fetch(SUPABASE_URL+'/rest/v1/class_assignments?select=id,title,skill,target,created_at,due_at&archived=eq.false&order=due_at.asc',{headers:authHeaders(cloudSession.access_token)});
      if(!response.ok)throw Error('Class assignments could not load. Your practice is still available.');
      const rows=await response.json();if(window.__lpCloudUser?.id!==user)return;
      assignments=rows;message='';display();
    }catch(error){if(window.__lpCloudUser?.id!==user)return;assignments=[];message=error.message;display()}
  }
  document.querySelector('#check-answer').addEventListener('click',()=>{
    if(P.checked||!P.selected||!P.queue[P.i]||!classroomSkills.includes(P.skill))return;
    const at=Date.now();st.practiceTrackingSince ||= at;
    (st.practiceActivity ||= {})[crypto.randomUUID()]={at,day:todayKey(),skill:P.skill,correct:P.selected===P.queue[P.i].a};
  },true);
  const previousRender=render;render=()=>{previousRender();display()};
  panel.addEventListener('click',event=>{if(event.target.closest('[data-assignment-refresh]'))refresh()});
  window.addEventListener('lp:cloud-ready',refresh);
  window.addEventListener('focus',()=>{if(window.__lpCloudUser&&!document.querySelector('#practice-modal').classList.contains('open'))refresh()});
  window.addEventListener('lp:cloud-signed-out',()=>{assignments=[];message='';panel.hidden=true});
  if(window.lpCloudReady)refresh();
})();
