const TEACHER_URL='https://hkqjmbitooohvzjrpqwl.supabase.co';
const TEACHER_KEY='sb_publishable_pPQjL-x6W5jMPmZomRNSGg_bdpcex76';
const teacherAuth=(path,options={})=>fetch(TEACHER_URL+'/auth/v1/'+path,{...options,headers:{apikey:TEACHER_KEY,'Content-Type':'application/json',...(options.headers||{})}});
let teacherSession=null;
const errorBox=document.querySelector('#teacher-error');
const showError=message=>{errorBox.textContent=message};
const formatDate=value=>value?new Intl.DateTimeFormat('en-US',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)):'—';
const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
async function loadStudents(){
  const response=await fetch(TEACHER_URL+'/rest/v1/rpc/teacher_progress',{method:'POST',headers:{apikey:TEACHER_KEY,Authorization:'Bearer '+teacherSession.access_token,'Content-Type':'application/json'}});
  if(!response.ok){showError(response.status===404?'Teacher access is not set up yet. Run the teacher setup SQL in Supabase, then try again.':response.status===401||response.status===403?'This account is not listed as a teacher yet. Run the teacher email setup SQL in Supabase.':'Could not load student progress.');return false}
  const rows=await response.json(),body=document.querySelector('#teacher-rows');
  body.innerHTML=rows.map(row=>{const state=row.state||{},profile=state.profile||{};return `<tr><td><strong>${escapeHtml(profile.name||'Learner')}</strong></td><td>${escapeHtml(row.email||'')}</td><td>${Number(state.exercisesCompleted)||0}</td><td>${Number(state.correct)||0}</td><td>${Number(state.streak)||0} days</td><td>${formatDate(row.updated_at)}</td></tr>`}).join('');
  document.querySelector('#teacher-empty').hidden=rows.length>0;
  document.querySelector('#teacher-summary').innerHTML=`<div class="teacher-stat"><p class="eyebrow">Students with progress</p><strong>${rows.length}</strong></div><div class="teacher-stat"><p class="eyebrow">Exercises answered</p><strong>${rows.reduce((sum,row)=>sum+(Number(row.state?.exercisesCompleted)||0),0)}</strong></div><div class="teacher-stat"><p class="eyebrow">Correct answers</p><strong>${rows.reduce((sum,row)=>sum+(Number(row.state?.correct)||0),0)}</strong></div>`;
  return true;
}
document.querySelector('#teacher-login').addEventListener('submit',async event=>{event.preventDefault();showError('');const response=await teacherAuth('token?grant_type=password',{method:'POST',body:JSON.stringify({email:document.querySelector('#teacher-email').value.trim().toLowerCase(),password:document.querySelector('#teacher-password').value})});const result=await response.json();if(!response.ok){showError(result.error_description||'The teacher login could not be completed.');return}teacherSession=result;if(await loadStudents()){document.querySelector('#teacher-auth').hidden=true;document.querySelector('#teacher-dashboard').hidden=false}});
document.querySelector('#teacher-refresh').addEventListener('click',loadStudents);
document.querySelector('#teacher-logout').addEventListener('click',async()=>{if(teacherSession)await teacherAuth('logout',{method:'POST',headers:{Authorization:'Bearer '+teacherSession.access_token}});teacherSession=null;location.reload()});
