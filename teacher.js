const TEACHER_URL = 'https://hkqjmbitooohvzjrpqwl.supabase.co';
const TEACHER_KEY = 'sb_publishable_pPQjL-x6W5jMPmZomRNSGg_bdpcex76';
const teacherAuth = (path, options = {}) => fetch(`${TEACHER_URL}/auth/v1/${path}`, {
  ...options,
  headers: { apikey: TEACHER_KEY, 'Content-Type': 'application/json', ...(options.headers || {}) }
});
let teacherSession = null;
let studentRows = [];
let teacherQuestions = [];
let selectedStudent = null;
let studentDetailId=null,teacherAssignments=[],rosterComplete=false;
const $ = selector => document.querySelector(selector);
const showError = message => { $('#teacher-error').textContent = message; };
const showMessage = message => { $('#teacher-dashboard-message').textContent = message; };
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const formatDate = value => value && Number.isFinite(+new Date(value)) ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
const skillTotal = (state, skill) => (state.correctBySkillTier?.[skill] || []).reduce((sum, count) => sum + (Number(count) || 0), 0);
const missedQuestions = state => Object.values(state.missedBySkillTier || {}).flat();
function skillOverview(state) {
  return ['Listening', 'Reading', 'Writing', 'Speaking'].map(skill => {
    const counts = [0, 1, 2].map(i => Math.min(100, Number(state.correctBySkillTier?.[skill]?.[i]) || 0));
    return `<details class="teacher-skill"><summary>${skill}: ${skillTotal(state, skill)} / 300</summary>${counts.map((count, i) => `<div>Tier ${i + 1}: ${count} / 100<progress max="100" value="${count}" aria-label="${skill} tier ${i + 1} correct answers"></progress></div>`).join('')}</details>`;
  }).join('');
}
function reviewOverview(state) {
  const ids = [...new Set(missedQuestions(state))];
  if (!ids.length) return '<span class="muted">No pending tier retries</span>';
  return `<details class="teacher-review"><summary>${ids.length} to review</summary><ul>${ids.map(id => {
    const question = teacherQuestions.find(q => `${q.skill}:${q.tier}:${q.number}` === id);
    return `<li>${escapeHtml(question ? `${question.skill} · Tier ${question.tier} · Question ${question.number}: ${question.prompt}` : id)}</li>`;
  }).join('')}</ul></details>`;
}

function writingOverview(state) {
  const items = Object.entries(state.writingPortfolio || {}).sort((a,b)=>(b[1].updatedAt||0)-(a[1].updatedAt||0));
  if (!items.length) return '';
  return `<details class="teacher-writing"><summary>Writing portfolio: ${items.length} responses (${items.filter(([,item])=>item.completedAt).length} self-reviewed)</summary><p>Self-review is not a teacher grade.</p>${items.map(([id,item])=>`<details><summary>${escapeHtml(id.replaceAll(':',' · '))} · ${item.completedAt ? 'Self-reviewed' : 'In progress'}</summary><h4>Original</h4><p>${escapeHtml(item.original || item.draft || '')}</p>${item.revision ? `<h4>Latest revision</h4><p>${escapeHtml(item.revision)}</p>` : ''}<small>Saved ${escapeHtml(formatDate(item.updatedAt))}</small></details>`).join('')}</details>`;
}

function attentionOverview(state) {
  const info = studentInsights(state);
  const notes = [info.inactive ? state.lastActivityAt ? 'No recorded exercise in the last 7 days' : 'No exercise activity date recorded' : '',
    info.focus ? `Least-practised skill(s): ${info.focus} (completion, not proficiency)` : '',
    info.due ? `${info.due} delayed review(s) due` : ''].filter(Boolean);
  const repeated = info.recurring.map(([id, item]) => {
    const q = teacherQuestions.find(q => `${q.skill}:${q.tier}:${q.number}` === id);
    return `${q ? `${q.skill} · ${q.prompt.split('\n')[0]}` : id}: ${item.failures} incorrect attempts`;
  });
  return `<div class="teacher-attention">${notes.map(note => `<p>${escapeHtml(note)}</p>`).join('')}${repeated.length ? `<details><summary>Recurring difficulties (${repeated.length})</summary><ul>${repeated.map(note => `<li>${escapeHtml(note)}</li>`).join('')}</ul></details>` : ''}</div>`;
}

async function teacherToken() {
  if (teacherSession?.expires_at > Date.now() / 1000 + 60) return teacherSession.access_token;
  if (!teacherSession?.refresh_token) throw new Error('Teacher session expired. Sign in again.');
  const response = await teacherAuth('token?grant_type=refresh_token', { method: 'POST', body: JSON.stringify({ refresh_token: teacherSession.refresh_token }) });
  if (!response.ok) throw new Error('Teacher session expired. Sign in again.');
  teacherSession = await response.json();
  return teacherSession.access_token;
}

async function teacherRpc(name, body = {}) {
  const token = await teacherToken();
  return fetch(`${TEACHER_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: TEACHER_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

function renderStudents() {
  const search = $('#teacher-search').value.trim().toLowerCase();
  const visible = studentRows.filter(row => {
    const info = studentInsights(row.state || {});
    return `${row.state?.profile?.name || ''} ${row.email || ''}`.toLowerCase().includes(search) &&
      (!$('#teacher-attention-only')?.checked || !row.state?.exercisesCompleted || info.inactive || info.due || info.recurring.length);
  });
  $('#teacher-rows').innerHTML = visible.map(row => {
    const state = row.state || {};
    const week=weeklyPractice(state);
    const streak=state.lastStreakAt&&Date.now()-state.lastStreakAt>=reviewDay?0:Number(state.streak)||0;
    return `<tr><td><button class="teacher-student-button" type="button" data-open-student="${escapeHtml(row.user_id)}">${escapeHtml(state.profile?.name || row.email?.split('@')[0] || 'Learner')}</button></td><td>${escapeHtml(row.email||'')}</td><td>${Number(state.exercisesCompleted)||0}</td><td>${Number(state.correct)||0}</td><td>${skillOverview(state)}${writingOverview(state)}</td><td>${reviewOverview(state)}${attentionOverview(state)}</td><td>${streak} days</td><td>${state.lastActivityAt?escapeHtml(formatDate(state.lastActivityAt)):'No exercise activity recorded'}</td><td>${row.updated_at?escapeHtml(formatDate(row.updated_at)):'No progress received'}</td><td>${studentStatus(row)}</td><td>${state.practiceTrackingSince?`${week.current} recorded exercises · ${week.days} practice days`:'History not yet recorded'}</td></tr>`;
  }).join('');
  $('#teacher-empty').hidden = studentRows.length > 0;
  $('#teacher-filter-empty').hidden = !studentRows.length || !!visible.length;
  $('#teacher-export').disabled = !studentRows.length;
  const recent = studentRows.filter(row => row.state?.lastActivityAt && Date.now() - row.state.lastActivityAt < 7 * reviewDay).length;
  const notStarted=studentRows.filter(row=>!row.state?.exercisesCompleted).length;
  const attention=studentRows.filter(row=>{const i=studentInsights(row.state||{});return !row.state?.exercisesCompleted||i.inactive||i.due||i.recurring.length}).length;
  $('#teacher-summary').innerHTML = [['Enrolled students',studentRows.length],['Not started',notStarted],['Needs attention',attention],['Active in last 7 days',recent]].map(([label,n])=>`<div class="teacher-stat"><p class="eyebrow">${label}</p><strong>${n}</strong></div>`).join('');
  renderStudentDetail();renderAssignments();
}

function studentStatus(row){
  const state=row.state||{},info=studentInsights(state),labels=[];
  if(row.email_confirmed_at===null)labels.push('Email not confirmed');
  if(!state.exercisesCompleted)labels.push('Not started');
  else if(info.inactive)labels.push(state.lastActivityAt?'Inactive 7+ days':'Activity date unavailable');
  if(info.due)labels.push(`${info.due} review${info.due===1?'':'s'} due`);
  if(info.recurring.length)labels.push(`${info.recurring.length} recurring difficult${info.recurring.length===1?'y':'ies'}`);
  return `<div class="teacher-badges">${(labels.length?labels:['Practising']).map(label=>`<span class="teacher-badge ${labels.length?'attention':''}">${escapeHtml(label)}</span>`).join('')}</div>`;
}
function renderStudentDetail(){
  const panel=$('#teacher-student-detail');if(!panel)return;
  const row=studentRows.find(r=>r.user_id===studentDetailId);panel.hidden=!row;if(!row){panel.innerHTML='';return}
  const state=row.state||{},week=weeklyPractice(state);
  const trend=week.complete?`${week.current-week.previous>=0?'+':''}${week.current-week.previous} exercises versus the previous 7 days.`:'A full 14 days of recorded history is needed for a fair week-to-week comparison.';
  const action=row.user_id===teacherSession?.user?.id?'':`<details class="teacher-account-settings"><summary>Account settings</summary><p>Permanent removal deletes this login and saved progress. Export anything you need first.</p><button class="teacher-delete-button" type="button" data-delete-user="${escapeHtml(row.user_id)}">Delete student account</button></details>`;
  panel.innerHTML=`<div class="teacher-detail-header"><div><p class="eyebrow">Student details</p><h2 id="teacher-detail-title" tabindex="-1">${escapeHtml(state.profile?.name||row.email?.split('@')[0]||'Learner')}</h2><p>${escapeHtml(row.email||'')}</p>${studentStatus(row)}</div><button class="secondary" type="button" data-close-student>Close details</button></div><p class="teacher-data-note">Enrolled: ${escapeHtml(formatDate(row.created_at))} · Last exercise: ${escapeHtml(formatDate(state.lastActivityAt))}<br>Last progress received: ${escapeHtml(formatDate(row.updated_at))}. This is not an online/offline indicator.</p><div class="teacher-detail-grid"><section><h3>Last 7 days</h3><p>${week.current} recorded exercises · ${week.correct} correct · ${week.days} practice days</p><p class="teacher-data-note">${trend} Tracking started ${escapeHtml(formatDate(state.practiceTrackingSince))}. Older activity is not reconstructed.</p><h3>Lifetime progress</h3><p>${Number(state.exercisesCompleted)||0} exercises answered. Tier scores below count correct quiz answers, not an assessed proficiency level.</p>${skillOverview(state)}</section><section><h3>Support and review</h3>${reviewOverview(state)}${attentionOverview(state)}<h3>Class assignments</h3>${teacherAssignments.filter(a=>!a.archived).map(a=>{const p=assignmentProgress(a,state);return `<p>${escapeHtml(a.title)}: ${p.count}/${p.target} · ${p.complete?(p.onTime?'Completed':'Completed late'):p.overdue?'Past due':'In progress'}</p>`}).join('')||'<p>No active assignments.</p>'}</section></div><section><h3>Saved writing</h3>${writingOverview(state)||'<p>No writing responses saved.</p>'}</section>${action}`;
}

async function loadAssignments(){
  const token=await teacherToken(),response=await fetch(TEACHER_URL+'/rest/v1/class_assignments?select=id,title,skill,target,created_at,due_at,archived&order=created_at.desc',{headers:{apikey:TEACHER_KEY,Authorization:`Bearer ${token}`}});
  if(!response.ok)throw Error('Assignments unavailable. Check classroom migration or select Refresh.');
  teacherAssignments=await response.json();
}
function renderAssignments(){
  const list=$('#teacher-assignment-list');if(!list)return;
  const active=teacherAssignments.filter(a=>!a.archived);
  list.innerHTML=active.length?active.map(a=>{
    const results=studentRows.map(row=>({row,p:assignmentProgress(a,row.state||{})}));
    const done=results.filter(x=>x.p.complete).length;
    return `<article class="teacher-assignment"><h3>${escapeHtml(a.title)}</h3><p>${escapeHtml(a.skill)} · ${a.target} answered exercises · Due ${escapeHtml(formatDate(a.due_at))}</p><p>${done}/${studentRows.length} students completed · ${results.filter(x=>x.p.overdue).length} past due</p><details><summary>Student completion</summary><ul>${results.map(({row,p})=>`<li>${escapeHtml(row.state?.profile?.name||row.email||'Learner')}: ${p.count}/${p.target} · ${p.complete?(p.onTime?'Completed':'Completed late'):p.overdue?'Past due':'In progress'}</li>`).join('')}</ul></details><button type="button" class="text-button" data-archive-assignment="${escapeHtml(a.id)}">Archive assignment</button></article>`;
  }).join(''):'<p>No active assignments. Archived assignments remain stored.</p>';
}

async function loadStudents() {
  showMessage('');
  try {
    let response = await teacherRpc('teacher_roster');
    rosterComplete=response.ok;
    if(response.status===404)response=await teacherRpc('teacher_progress');
    if (!response.ok) {
      showMessage(response.status === 404 ? 'Teacher access is not set up yet. Run the teacher setup SQL in Supabase.' : response.status === 401 || response.status === 403 ? 'This account is not listed as a teacher.' : 'Could not load student progress. Try Refresh.');
      return false;
    }
    studentRows = await response.json();
    if($('#teacher-roster-note'))$('#teacher-roster-note').textContent=rosterComplete?'All student enrollments, including accounts with no saved practice.':'Limited view: only accounts with progress. Apply classroom.sql for all enrollments.';
    if($('#teacher-refreshed'))$('#teacher-refreshed').textContent='Report refreshed '+formatDate(Date.now());
    try{await loadAssignments();if($('#assignment-message'))$('#assignment-message').textContent=''}catch(error){teacherAssignments=[];if($('#assignment-message'))$('#assignment-message').textContent=error.message}
    if (!teacherQuestions.length) {
      try {
        const questions = await fetch('questions.json');
        if (questions.ok) teacherQuestions = (await questions.json()).filter(q => q.skill && q.prompt);
      } catch { /* Reports remain usable if the question descriptions cannot load. */ }
    }
    renderStudents();
    return true;
  } catch (error) {
    showMessage(error.message || 'Could not connect to Supabase.');
    return false;
  }
}

const csvCell = value => {
  let text = String(value ?? '');
  if (/^\s*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
};
function exportStudents() {
  const headers = ['Name', 'Email', 'Exercises', 'Correct', 'Listening correct', 'Reading correct', 'Writing correct', 'Speaking correct', 'Pending review', 'Streak days', 'Last exercise activity', 'Last progress received', 'Least practised (completion only)', 'Inactive 7 days', 'Delayed reviews due', 'Repeated mistakes','Enrolled','Recorded exercises last 7 days','Recorded practice days last 7 days','History tracking started'];
  const lines = studentRows.map(row => {
    const state = row.state || {};
    const info = studentInsights(state);
    return [state.profile?.name || 'Learner', row.email || '', Number(state.exercisesCompleted) || 0, Number(state.correct) || 0,
      ...['Listening', 'Reading', 'Writing', 'Speaking'].map(skill => skillTotal(state, skill)), missedQuestions(state).length, state.lastStreakAt && Date.now() - state.lastStreakAt >= reviewDay ? 0 : Number(state.streak) || 0, state.lastActivityAt ? new Date(state.lastActivityAt).toISOString() : '', row.updated_at || '', info.focus, info.inactive ? 'Yes' : 'No', info.due, info.recurring.map(([id, item]) => `${id}: ${item.failures}`).join('; '),row.created_at||'',weeklyPractice(state).current,weeklyPractice(state).days,state.practiceTrackingSince?new Date(state.practiceTrackingSince).toISOString():''];
  });
  const csv = [headers, ...lines].map(row => row.map(csvCell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `linguapath-students-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showMessage('Student report downloaded.');
}

$('#teacher-login').addEventListener('submit', async event => {
  event.preventDefault();
  showError('');
  try {
    const response = await teacherAuth('token?grant_type=password', { method: 'POST', body: JSON.stringify({ email: $('#teacher-email').value.trim().toLowerCase(), password: $('#teacher-password').value }) });
    const result = await response.json();
    if (!response.ok) { showError(result.error_description || 'The teacher login could not be completed.'); return; }
    teacherSession = result;
    $('#teacher-password').value = '';
    if (await loadStudents()) { $('#teacher-auth').hidden = true; $('#teacher-dashboard').hidden = false; }
    else showError($('#teacher-dashboard-message').textContent);
  } catch { showError('Could not connect to Supabase. Check your connection and try again.'); }
});
$('#teacher-refresh').addEventListener('click', loadStudents);
$('#teacher-search').addEventListener('input', renderStudents);
$('#teacher-attention-only')?.addEventListener('change', renderStudents);
$('#teacher-export').addEventListener('click', exportStudents);

const deleteDialog = $('#teacher-delete-dialog');
function openDelete(event) {
  const button = event.target.closest('[data-delete-user]');
  if (!button) return;
  selectedStudent = studentRows.find(row => row.user_id === button.dataset.deleteUser);
  if (!selectedStudent) return;
  $('#teacher-delete-description').textContent = `Student: ${selectedStudent.state?.profile?.name || 'Learner'} (${selectedStudent.email})`;
  $('#teacher-delete-confirm').value = '';
  $('#teacher-delete-error').textContent = '';
  $('#teacher-delete-submit').disabled = true;
  deleteDialog.showModal();
  $('#teacher-delete-confirm').focus();
}
$('#teacher-student-detail')?.addEventListener('click',event=>{
  if(event.target.closest('[data-close-student]')){const id=studentDetailId;studentDetailId=null;renderStudentDetail();document.querySelector(`[data-open-student="${CSS.escape(id)}"]`)?.focus();return}
  openDelete(event);
});
$('#teacher-rows').addEventListener('click',event=>{
  const button=event.target.closest('[data-open-student]');if(!button)return;
  studentDetailId=button.dataset.openStudent;renderStudentDetail();$('#teacher-detail-title')?.focus();
});
$('#teacher-assignment-form')?.addEventListener('submit',async event=>{
  event.preventDefault();const button=$('#assignment-create');button.disabled=true;
  try{
    const due=new Date($('#assignment-due').value+'T23:59:59');
    if(!Number.isFinite(+due)||+due<=Date.now())throw Error('Choose a future due date.');
    const response=await teacherRpc('teacher_create_assignment',{assignment_title:$('#assignment-title').value.trim(),assignment_skill:$('#assignment-skill').value,assignment_target:Number($('#assignment-target').value),assignment_due:due.toISOString()});
    if(!response.ok)throw Error('Could not create the assignment. Check the fields and retry.');
    $('#teacher-assignment-form').reset();await loadAssignments();renderAssignments();renderStudentDetail();$('#assignment-message').textContent='Assignment created for the class.';
  }catch(error){$('#assignment-message').textContent=error.message}finally{button.disabled=false}
});
$('#teacher-assignment-list')?.addEventListener('click',async event=>{
  const button=event.target.closest('[data-archive-assignment]');if(!button)return;
  if(!confirm('Archive this assignment? It will be hidden from students, but its record is retained.'))return;
  button.disabled=true;
  try{const response=await teacherRpc('teacher_archive_assignment',{assignment_id:button.dataset.archiveAssignment});if(!response.ok)throw Error('Could not archive the assignment.');await loadAssignments();renderAssignments();renderStudentDetail();$('#assignment-message').textContent='Assignment archived.'}catch(error){$('#assignment-message').textContent=error.message;button.disabled=false}
});
$('#teacher-delete-confirm').addEventListener('input', event => {
  $('#teacher-delete-submit').disabled = event.target.value.trim().toLowerCase() !== selectedStudent?.email?.toLowerCase();
});
$('#teacher-delete-cancel').addEventListener('click', () => deleteDialog.close());
deleteDialog.addEventListener('close', () => { selectedStudent = null; });
$('#teacher-delete-submit').addEventListener('click', async () => {
  if (!selectedStudent || $('#teacher-delete-confirm').value.trim().toLowerCase() !== selectedStudent.email.toLowerCase()) return;
  const target = selectedStudent;
  $('#teacher-delete-submit').disabled = true;
  $('#teacher-delete-error').textContent = 'Deleting account…';
  try {
    const response = await teacherRpc('teacher_delete_student', { target_user_id: target.user_id });
    if (!response.ok) {
      $('#teacher-delete-error').textContent = response.status === 404 ? 'Account removal is not set up yet. Ask the site owner to finish teacher setup.' : 'Could not delete this account. Its progress has not been changed.';
      return;
    }
    if (await response.json() !== true) { $('#teacher-delete-error').textContent = 'This student account was not found.'; return; }
    deleteDialog.close();
    await loadStudents();
    showMessage(`${target.email} and its saved progress were deleted.`);
  } catch { $('#teacher-delete-error').textContent = 'Could not connect to Supabase. No account was deleted.'; }
});

$('#teacher-logout').addEventListener('click', async () => {
  try { if (teacherSession) await teacherAuth('logout', { method: 'POST', headers: { Authorization: `Bearer ${teacherSession.access_token}` } }); }
  finally { teacherSession = null; location.reload(); }
});
