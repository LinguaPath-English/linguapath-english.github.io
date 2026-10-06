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
const $ = selector => document.querySelector(selector);
const showError = message => { $('#teacher-error').textContent = message; };
const showMessage = message => { $('#teacher-dashboard-message').textContent = message; };
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const formatDate = value => value ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
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
  if (!ids.length) return '<span class="muted">Up to date</span>';
  return `<details class="teacher-review"><summary>${ids.length} to review</summary><ul>${ids.map(id => {
    const question = teacherQuestions.find(q => `${q.skill}:${q.tier}:${q.number}` === id);
    return `<li>${escapeHtml(question ? `${question.skill} · Tier ${question.tier} · Question ${question.number}: ${question.prompt}` : id)}</li>`;
  }).join('')}</ul></details>`;
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
  const visible = studentRows.filter(row => `${row.state?.profile?.name || ''} ${row.email || ''}`.toLowerCase().includes(search));
  $('#teacher-rows').innerHTML = visible.map(row => {
    const state = row.state || {};
    const action = row.user_id === teacherSession.user?.id ? '—' : `<button class="teacher-delete-button" type="button" data-delete-user="${escapeHtml(row.user_id)}">Delete</button>`;
    const activity = state.lastActivityAt ? formatDate(state.lastActivityAt) : 'No exercise activity recorded';
    return `<tr><td><strong>${escapeHtml(state.profile?.name || 'Learner')}</strong></td><td>${escapeHtml(row.email || '')}</td><td>${Number(state.exercisesCompleted) || 0}</td><td>${Number(state.correct) || 0}</td><td>${skillOverview(state)}</td><td>${reviewOverview(state)}</td><td>${Number(state.streak) || 0} days</td><td>${escapeHtml(activity)}<small class="teacher-skills">Saved ${escapeHtml(formatDate(row.updated_at))}</small></td><td>${action}</td></tr>`;
  }).join('');
  $('#teacher-empty').hidden = studentRows.length > 0;
  $('#teacher-filter-empty').hidden = !studentRows.length || !!visible.length;
  $('#teacher-export').disabled = !studentRows.length;
  const recent = studentRows.filter(row => Date.now() - Date.parse(row.updated_at) < 7 * 86400000).length;
  $('#teacher-summary').innerHTML = `<div class="teacher-stat"><p class="eyebrow">Students with progress</p><strong>${studentRows.length}</strong></div><div class="teacher-stat"><p class="eyebrow">Saved this week</p><strong>${recent}</strong></div><div class="teacher-stat"><p class="eyebrow">Exercises answered</p><strong>${studentRows.reduce((sum, row) => sum + (Number(row.state?.exercisesCompleted) || 0), 0)}</strong></div><div class="teacher-stat"><p class="eyebrow">Correct answers</p><strong>${studentRows.reduce((sum, row) => sum + (Number(row.state?.correct) || 0), 0)}</strong></div>`;
}

async function loadStudents() {
  showMessage('');
  try {
    const response = await teacherRpc('teacher_progress');
    if (!response.ok) {
      showMessage(response.status === 404 ? 'Teacher access is not set up yet. Run the teacher setup SQL in Supabase.' : response.status === 401 || response.status === 403 ? 'This account is not listed as a teacher.' : 'Could not load student progress. Try Refresh.');
      return false;
    }
    studentRows = await response.json();
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
  const headers = ['Name', 'Email', 'Exercises', 'Correct', 'Listening correct', 'Reading correct', 'Writing correct', 'Speaking correct', 'Pending review', 'Streak days', 'Last exercise activity', 'Last saved'];
  const lines = studentRows.map(row => {
    const state = row.state || {};
    return [state.profile?.name || 'Learner', row.email || '', Number(state.exercisesCompleted) || 0, Number(state.correct) || 0,
      ...['Listening', 'Reading', 'Writing', 'Speaking'].map(skill => skillTotal(state, skill)), missedQuestions(state).length, Number(state.streak) || 0, state.lastActivityAt ? new Date(state.lastActivityAt).toISOString() : '', row.updated_at || ''];
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
$('#teacher-export').addEventListener('click', exportStudents);

const deleteDialog = $('#teacher-delete-dialog');
$('#teacher-rows').addEventListener('click', event => {
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
