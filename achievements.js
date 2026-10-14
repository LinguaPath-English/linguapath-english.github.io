// Practice evidence, never an automatic proficiency grade.
const learningBadges=[
 ['comeback','↻','Comeback',5,'different mistakes corrected','Correct 5 different questions you previously answered incorrectly.'],
 ['recall','🧠','Still Remember',10,'different recalls correct','Answer 10 different delayed-review questions correctly.'],
 ['voice','🎙️','Finding My Voice',5,'speaking self-checks','Complete pronunciation self-checks for 5 different speaking questions. Practice, not an accuracy grade.'],
 ['revision','✍️','Better Than Before',5,'responses revised','Save changed revisions to 5 different original writing responses. A habit, not a quality grade.'],
 ['balanced','🧭','Well-rounded',4,'skills practised','Answer at least one quiz question in each of the four skills.'],
 ['tier','🏅','Tier Master',1,'skill tiers finished','Finish all 100 questions and clear all missed questions in one skill’s tier.'],
 ['steady','🌿','Steady Learner',5,'goal days in a seven-day window','Reach 10 exercises on 5 days in any 7 consecutive calendar days. The practice days need not be consecutive.']
].map(([id,icon,name,target,unit,requirement])=>({id,icon,name,target,unit,requirement}));
const milestoneBadges=[['first-spark','🌱','First Spark',1],['brain-boot','🧠','Brain Boot',10],['page-turner','📖','Page Turner',25],['ear-opener','🎧','Ear Opener',50],['word-scribbler','✍️','Word Scribbler',100],['english-wizard','🚀','English Wizard',250],['lesson-legend','🏆','Lesson Legend',350],['bullseye','🎯','Bullseye',1200]].map(([id,icon,name,target])=>({id,icon,name,target,unit:'exercises answered',requirement:`Answer ${target} exercise${target===1?'':'s'}.`}));
const allBadges=[...learningBadges,...milestoneBadges];
const badgeText=value=>String(value||'').trim().replace(/\s+/g,' ');
function achievementFact(state,type,id,at=Date.now()){
 if(!id)return;state.achievementFacts||={};const key=`${type}:${id}`;
 if(!state.achievementFacts[key])state.achievementFacts[key]=at;
}
function achievementMetrics(state){
 const facts=state.achievementFacts||{},count=prefix=>Object.keys(facts).filter(key=>key.startsWith(prefix+':')).length;
 const days=Object.keys(facts).filter(key=>/^goal:\d{4}-\d{2}-\d{2}$/.test(key)).map(key=>Date.parse(key.slice(5)+'T00:00:00Z')/86400000).filter(Number.isFinite).sort((a,b)=>a-b);
 let steady=0,start=0;days.forEach((day,end)=>{while(day-days[start]>6)start++;steady=Math.max(steady,end-start+1)});
 const balanced=['Listening','Reading','Writing','Speaking'].filter(skill=>facts[`practice:${skill}`]||(state.correctBySkillTier?.[skill]||[]).some(n=>Number(n)>0)).length;
 const answered=Math.max(Number(state.exercisesCompleted)||0,(Number(state.correct)||0)+(Array.isArray(state.mistakes)?state.mistakes.length:0));
 return{comeback:count('correction'),recall:count('recall'),voice:count('voice'),revision:count('revision'),balanced,tier:count('tier'),steady,answered};
}
function prepareAchievements(state,day='',now=Date.now()){
 const before=JSON.stringify([state.achievementFacts,state.earnedAchievements]);
 if(day&&state.dayKey===day&&Number(state.today)>=10)achievementFact(state,'goal',day,now);
 for(const[id,item]of Object.entries(state.writingPortfolio||{}))if(item.completedAt&&badgeText(item.original)&&badgeText(item.revision)&&badgeText(item.original)!==badgeText(item.revision))achievementFact(state,'revision',id,item.updatedAt||now);
 const metrics=achievementMetrics(state);state.earnedAchievements||={};
 for(const b of allBadges)if((metrics[b.id]??metrics.answered)>=b.target&&!state.earnedAchievements[b.id])state.earnedAchievements[b.id]={at:now,evidence:b.requirement};
 return{metrics,changed:before!==JSON.stringify([state.achievementFacts,state.earnedAchievements])};
}
function featuredBadges(state){return[...new Set(Array.isArray(state.profile?.featuredAchievements)?state.profile.featuredAchievements:[])].filter(id=>allBadges.some(b=>b.id===id)&&state.earnedAchievements?.[id]).slice(0,3)}

if(typeof document!=='undefined')(()=>{
 const $=s=>document.querySelector(s),grid=$('.achievement-grid');
 const milestone=document.createElement('details');milestone.className='achievement-milestones';milestone.innerHTML='<summary>Exercise milestones — your existing badges</summary><div class="achievement-grid milestone-grid"></div>';grid.after(milestone);
 const intro=document.createElement('p');intro.className='muted badge-intro';intro.textContent='Earned badges stay yours, even if you miss a day. New correction, recall, speaking, and daily-goal tracking starts with this update; verified saved writing and skill progress count too. An intentional progress reset clears badges.';grid.before(intro);
 const profile=document.createElement('section');profile.className='featured-achievements';profile.innerHTML='<h2>My featured badges</h2><p class="muted">Choose up to three earned badges in Skills. These celebrate practice, not an exam grade.</p><div class="featured-badge-list"></div><button class="secondary" type="button">Choose badges</button>';$('.profile-card').after(profile);profile.querySelector('button').addEventListener('click',()=>go('skills'));
 const notice=document.createElement('div');notice.className='achievement-announcement';notice.hidden=true;notice.innerHTML='<span role="status" aria-live="polite"></span><button type="button" aria-label="Dismiss achievement celebration">×</button>';notice.querySelector('button').addEventListener('click',()=>{notice.hidden=true});
 let account='',seen=new Set(),persistTimer,noticeTimer;
 const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 window.lpRecordAchievementFact=(type,id,at)=>achievementFact(st,type,id,at);
 function renderBadges(){
  const{metrics,changed}=prepareAchievements(st,todayKey()),owner=`${session||''}:${st._resetId||''}`,ready=!!window.__lpCloudUser&&!!window.lpCloudReady;
  if(owner!==account){account=owner;seen=new Set(Object.keys(st.earnedAchievements));speakingId='';notice.hidden=true;clearTimeout(noticeTimer)}
  $('#today-date').textContent=new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric'}).format(new Date());
  const newly=allBadges.filter(b=>st.earnedAchievements[b.id]&&!seen.has(b.id));seen=new Set(Object.keys(st.earnedAchievements));const featured=featuredBadges(st);
  const openEvidence=new Set([...document.querySelectorAll('.achievement[data-badge-id] .badge-evidence[open]')].map(el=>el.closest('.achievement').dataset.badgeId));
  const markup=b=>{
   const earned=st.earnedAchievements[b.id],value=metrics[b.id]??metrics.answered,current=Math.min(value,b.target),on=featured.includes(b.id),display=earned?b.target:current;
   return `<article data-badge-id="${b.id}" class="achievement ${earned?'unlocked':'locked'}"><span class="achievement-icon" aria-hidden="true">${b.icon}</span><strong>${b.name}</strong><p class="badge-requirement">${b.requirement}</p><small>${earned?'Earned · '+new Date(earned.at).toLocaleDateString():`${Math.max(0,b.target-current)} remaining`}</small><span class="achievement-progress-meta"><span>${display} / ${b.target} ${b.unit}</span></span><span class="achievement-progress-track" role="progressbar" aria-label="${b.name} progress" aria-valuemin="0" aria-valuemax="${b.target}" aria-valuenow="${display}"><span style="width:${display/b.target*100}%"></span></span>${earned?`<details class="badge-evidence" ${openEvidence.has(b.id)?'open':''}><summary>Why I earned this</summary><p>${escape(earned.evidence||b.requirement)}</p></details><button class="badge-feature" type="button" data-feature-badge="${b.id}" aria-pressed="${on}" ${!on&&featured.length>=3?'disabled':''}>${on?'★ Featured':'☆ Feature on profile'}</button>`:'<small>Keep practising—you’re building this habit.</small>'}</article>`;
  };
  grid.innerHTML=learningBadges.map(markup).join('');milestone.querySelector('.milestone-grid').innerHTML=milestoneBadges.map(markup).join('');
  $('.achievement-head .pill').textContent=`${allBadges.filter(b=>st.earnedAchievements[b.id]).length} of ${allBadges.length} earned`;$('.achievement-head .muted').textContent='Correction, recall, confidence, and steady practice.';
  profile.querySelector('.featured-badge-list').innerHTML=featured.length?featured.map(id=>{const b=allBadges.find(b=>b.id===id);return `<div class="featured-badge"><span aria-hidden="true">${b.icon}</span><strong>${b.name}</strong><button class="text-button" type="button" data-feature-badge="${id}" aria-label="Remove ${b.name} from featured badges">Remove</button></div>`}).join(''):'<p class="muted">Your three favorite earned badges can go here.</p>';
  if(ready&&newly.length){clearTimeout(noticeTimer);notice.hidden=false;($('#review-dialog').open?$('#review-position'):modal.classList.contains('open')?$('.practice-save-feedback'):$('.view.active h1')).after(notice);notice.querySelector('[role="status"]').textContent=`✦ Achievement earned: ${newly.map(b=>b.name).join(', ')}. Nice progress!`;noticeTimer=setTimeout(()=>{notice.hidden=true},8000)}
  if(ready&&changed){clearTimeout(persistTimer);persistTimer=setTimeout(()=>{if(owner===`${session||''}:${st._resetId||''}`)save()},0)}
  if(!ready)notice.hidden=true;
 }
 window.lpRefreshAchievements=renderBadges;
 document.addEventListener('click',event=>{
  const button=event.target.closest('[data-feature-badge]');if(!button)return;const fromProfile=!!button.closest('.featured-achievements'),id=button.dataset.featureBadge;if(!st.earnedAchievements?.[id])return;const featured=featuredBadges(st);
  if(featured.includes(id))st.profile.featuredAchievements=featured.filter(item=>item!==id);else if(featured.length<3)st.profile.featuredAchievements=[...featured,id];else return;
  save();renderBadges();(fromProfile?profile.querySelector('button'):document.querySelector(`[data-feature-badge="${CSS.escape(id)}"]`))?.focus({preventScroll:true});
 });
 $('#check-answer').addEventListener('click',()=>{
  if(P.checked||!P.selected||!P.queue?.[P.i])return;
  achievementFact(st,'practice',P.skill);
  if(st.dayKey===todayKey()&&Number(st.today)+1>=10)achievementFact(st,'goal',todayKey());
  if(P.phase!=='review'&&P.baseLength===100&&P.i===99)achievementFact(st,'covered',`${P.skill}:${P.tier}`);
 },true);
 const beforeComplete=completePracticeSession;
 completePracticeSession=(skill,tier)=>{if(st.achievementFacts?.[`covered:${skill}:${tier}`]&&!missedList(skill,tier).length)achievementFact(st,'tier',`${skill}:${tier}`);beforeComplete(skill,tier);render()};
 const selfcheck=document.createElement('fieldset');selfcheck.className='speaking-selfcheck';selfcheck.innerHTML='<legend>Pronunciation self-check</legend><p>Listen to your recording or say the model aloud. This is practice—not an automatic pronunciation score.</p><label><input type="checkbox"> I checked the word sounds.</label><label><input type="checkbox"> I checked stress and rhythm.</label><label><input type="checkbox"> I tried again or identified what to improve.</label><button class="secondary" type="button" disabled>Save pronunciation self-check</button><p class="selfcheck-status" role="status"></p>';$('#speaking-practice').append(selfcheck);
 const selfcheckButton=selfcheck.querySelector('button'),checks=[...selfcheck.querySelectorAll('input')];let speakingId='';
 selfcheck.addEventListener('change',()=>{selfcheckButton.disabled=!checks.every(input=>input.checked)||!!st.achievementFacts?.[`voice:${speakingId}`]});
 selfcheckButton.addEventListener('click',()=>{const q=P.queue?.[P.i];if(q?.s!=='Speaking'||!P.checked||P.selected!==q.a||!checks.every(input=>input.checked))return;achievementFact(st,'voice',q.id);save();draw();render();$('#check-answer').focus()});
 const beforeDraw=draw;
 draw=()=>{beforeDraw();const q=P.queue?.[P.i];if(q?.s!=='Speaking')return;const done=!!st.achievementFacts?.[`voice:${q.id}`];if(speakingId!==q.id||done)checks.forEach(input=>{input.checked=done});speakingId=q.id;checks.forEach(input=>{input.disabled=done});selfcheckButton.disabled=done||!checks.every(input=>input.checked);selfcheck.querySelector('.selfcheck-status').textContent=done?'Self-check saved for this question.':'One self-check per question counts toward Finding My Voice.'};
 const beforeRender=render;render=()=>{beforeRender();renderBadges()};
 window.addEventListener('lp:cloud-signed-out',()=>{account='';seen.clear();notice.hidden=true;clearTimeout(persistTimer)});
 render();if(modal.classList.contains('open'))draw();
})();
