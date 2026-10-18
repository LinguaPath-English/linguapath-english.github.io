const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const element = () => ({
  textContent: '', innerHTML: '', value: '', hidden: false, disabled: false, dataset: {}, listeners: {},
  addEventListener(name, handler) { this.listeners[name] = handler; },
  click() { return this.listeners.click?.(); },
  focus() {}, showModal() {}, close() { this.listeners.close?.(); }
});

async function testSync() {
  const status = element(), retry = element(), events = {};
  let cloudOk = false, throws = false;
  const window = {
    lpSaveProgress: async () => { if (throws) throw new Error('Connection interrupted'); return cloudOk; },
    lpCloudReady: false,
    __lpCloudUser: null,
    addEventListener(name, handler) { events[name] = handler; }
  };
  vm.runInNewContext(read('sync-indicator.js'), {
    document: { querySelector: selector => selector === '#sync-status' ? status : selector === '#sync-retry' ? retry : null },
    window, st: {}, matchMedia: () => ({ matches: false }), Intl, Date
  });
  assert.equal(status.textContent, 'Loading progress…');
  window.__lpCloudUser = { id: 'student-a' };
  events['lp:cloud-ready']({ detail: { updatedAt: new Date().toISOString() } });
  assert.equal(status.textContent, 'Saved to your account');
  assert.equal(await window.lpSaveProgress({}), false);
  assert.equal(status.textContent, 'Not synced · Retry');
  assert.equal(retry.hidden, false);
  cloudOk = true;
  retry.click();
  assert.equal(await window.lpCloudPending, true);
  assert.equal(status.textContent, 'Saved to your account');
  throws = true;
  assert.equal(await window.lpSaveProgress({}), false);
  assert.equal(status.dataset.state, 'pending');
  assert.equal(retry.hidden, false);
}

async function testTeacher() {
  const selectors = ['#teacher-error', '#teacher-dashboard-message', '#teacher-search', '#teacher-rows', '#teacher-empty', '#teacher-filter-empty', '#teacher-export', '#teacher-summary', '#teacher-login', '#teacher-email', '#teacher-password', '#teacher-auth', '#teacher-dashboard', '#teacher-refresh', '#teacher-delete-dialog', '#teacher-delete-description', '#teacher-delete-confirm', '#teacher-delete-error', '#teacher-delete-submit', '#teacher-delete-cancel', '#teacher-logout','#teacher-student-detail','#teacher-detail-title'];
  const elements = Object.fromEntries(selectors.map(selector => [selector, element()]));
  const student = { user_id: 'student-a', email: 'student@example.com', updated_at: new Date().toISOString(), state: { profile: { name: '=HYPERLINK("bad")' }, exercisesCompleted: 12, correct: 9, streak: 1, correctBySkillTier: { Writing: [4, 0, 0] } } };
  let deleted = false;
  const fetch = async url => ({
    ok: true,
    json: async () => url.includes('teacher_delete_student') ? (deleted = true) : deleted ? [] : [student]
  });
  const context = vm.createContext({
    document: { querySelector: selector => elements[selector], createElement: () => ({ click() {} }) },
    fetch, Blob, URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} },
    Intl, Date, setTimeout, location: { reload() {} }
  });
  vm.runInContext(read('learning-tools.js'), context);
  vm.runInContext(read('classroom.js'),context);
  vm.runInContext(read('teacher.js'), context);
  vm.runInContext('teacherSession = {access_token:"token",expires_at:Date.now()/1000+3600,user:{id:"teacher-a"}}', context);
  assert.equal(await vm.runInContext('loadStudents()', context), true);
  assert.match(elements['#teacher-rows'].innerHTML, /data-open-student/);
  assert.match(elements['#teacher-rows'].innerHTML, /Writing: 4/);
  assert.match(elements['#teacher-rows'].innerHTML, /student@example.com/);
  assert.equal((elements['#teacher-rows'].innerHTML.match(/<td>/g)||[]).length,11);
  assert.doesNotMatch(elements['#teacher-rows'].innerHTML, /data-delete-user/);
  vm.runInContext('studentDetailId="student-a";renderStudentDetail()',context);
  assert.match(elements['#teacher-student-detail'].innerHTML,/Writing: 4/);
  assert.match(elements['#teacher-student-detail'].innerHTML,/Delete student account/);
  assert.doesNotMatch(elements['#teacher-rows'].innerHTML, /<script/);
  assert.equal(vm.runInContext('csvCell("=SUM(1,2)")', context), '"\'=SUM(1,2)"');
  vm.runInContext('openDelete',context)({ target: { closest: () => ({ dataset: { deleteUser: 'student-a' } }) } });
  elements['#teacher-delete-confirm'].value = 'wrong@example.com';
  elements['#teacher-delete-confirm'].listeners.input({ target: elements['#teacher-delete-confirm'] });
  assert.equal(elements['#teacher-delete-submit'].disabled, true);
  elements['#teacher-delete-confirm'].value = 'student@example.com';
  elements['#teacher-delete-confirm'].listeners.input({ target: elements['#teacher-delete-confirm'] });
  assert.equal(elements['#teacher-delete-submit'].disabled, false);
  await elements['#teacher-delete-submit'].click();
  assert.equal(deleted, true);
  assert.equal(elements['#teacher-empty'].hidden, false);
}

function testFeedback() {
  const source = read('improvements.js');
  const start = source.indexOf('function explainAnswer(question)');
  const end = source.indexOf('\n\ndraw = () =>', start);
  assert.ok(start > 0 && end > start);
  const explain = vm.runInNewContext(`${source.slice(start, end)}; explainAnswer`);
  assert.match(explain({ s: 'Reading', p: 'Passage: "Students should use the printed index at the desk."\nWhat should they use?', a: 'Use the printed index.' }), /printed index/);
  assert.match(explain({ s: 'Listening', transcript: 'The meeting is on Thursday afternoon.', a: 'Thursday afternoon' }), /Thursday afternoon/);
  assert.match(explain({ s: 'Writing', p: 'Choose a polite email closing.', a: 'Kind regards' }), /polite/);
  assert.match(explain({ s: 'Speaking', p: 'Tell me about yourself.', a: 'I study economics.' }), /relevant detail/);
}

(async () => {
  const privacy = read('privacy.html');
  assert.match(privacy, /Privacy &amp; Help|Privacy & Help/);
  for (const section of ['data', 'recordings', 'deletion', 'help']) assert.ok(privacy.includes(`id="${section}"`));
  assert.doesNotMatch(privacy, /mailto:|Estebanthekiller|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  assert.match(privacy, /Contact your teacher/);
  assert.doesNotMatch(privacy, /<script|<form|fonts\.googleapis\.com/);
  assert.match(privacy, /does not upload your recording/);
  assert.match(privacy, /cached copies on devices/);
  assert.equal((read('index.html').match(/href="privacy\.html"/g) || []).length, 2);
  assert.ok(read('teacher.html').includes('href="privacy.html"'));
  await testSync();
  await testTeacher();
  testFeedback();
  console.log('Student sync, teacher dashboard, account confirmation, and answer feedback passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
