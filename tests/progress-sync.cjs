const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const copy = value => JSON.parse(JSON.stringify(value));
const initial = { dayKey: '2026-10-05', today: 0, exercisesCompleted: 0, lessons: 0, correct: 0,
  correctByTier: [0, 0, 0], correctBySkillTier: { Writing: [0, 0, 0], Reading: [0, 0, 0] },
  practiceSessions: {}, profile: { name: 'Test learner' }, mistakes: [] };
const storage = () => {
  const data = {};
  Object.defineProperties(data, {
    getItem: { value: key => data[key] || null },
    setItem: { value: (key, value) => { data[key] = value; } },
    removeItem: { value: key => { delete data[key]; } }
  });
  data.setItem('linguapath-cloud-session', JSON.stringify({ access_token: 'test', expires_at: Date.now()/1000 + 3600 }));
  return data;
};

async function main() {
  let row = { state: copy(initial), updated_at: new Date(1).toISOString() };
  let offline = false, loseResponse = false, conflicts = 0;
  const backend = async (url, options = {}) => {
    await new Promise(resolve => setImmediate(resolve));
    if (offline) throw new Error('Offline');
    if (!options.method) return { ok: true, json: async () => [copy(row)] };
    const expected = new URL(url).searchParams.get('updated_at')?.slice(3);
    if (expected !== row.updated_at) { conflicts++; return { ok: true, json: async () => [] }; }
    const update = JSON.parse(options.body); row = { state: update.state, updated_at: update.updated_at };
    if (loseResponse) { loseResponse = false; throw new Error('Response lost after server committed'); }
    return { ok: true, json: async () => [copy(row)] };
  };
  const device = (local = storage()) => {
    const context = { localStorage: local, crypto: { randomUUID }, fetch: backend, URL, URLSearchParams, location: { hash: '' }, Date, console: { error() {} },
      D: copy(initial), st: copy(initial), skills: [['Writing'], ['Reading']], session: 'student', users: () => JSON.parse(local.getItem('users') || '{}'), USERS_KEY: 'users',
      normalizeSkillTierProgress() {}, render() {}, draw() {}, modal: { classList: { contains: () => false } },
      window: { __lpCloudUser: { id: 'student' }, addEventListener() {} } };
    vm.createContext(context);
    vm.runInContext(read('progress-sync.js'), context);
    const auth = read('supabase-auth.js');
    vm.runInContext(auth.slice(0, auth.indexOf("authForm.addEventListener('submit'")), context);
    vm.runInContext('capturedProgress = captureProgress(st)', context);
    return context;
  };
  const answer = (context, skill, index) => {
    context.st.exercisesCompleted++; context.st.today++; context.st.correctByTier[0]++;
    context.st.correctBySkillTier[skill][0]++;
    context.st.practiceSessions[skill + ':1'] = { skill, tier: 1, i: index, checked: true, updatedAt: Date.now() };
    return context.window.lpSaveProgress(context.st);
  };
  const a = device(), b = device();
  assert.deepEqual(await Promise.all([answer(a, 'Writing', 4), answer(b, 'Reading', 2)]), [true, true]);
  assert.ok(conflicts > 0, 'Must exercise the conflicting-write retry');
  assert.equal(row.state.exercisesCompleted, 2);
  assert.equal(row.state.correctBySkillTier.Writing[0], 1);
  assert.equal(row.state.correctBySkillTier.Reading[0], 1);
  assert.equal(row.state.practiceSessions['Writing:1'].i, 4);
  assert.equal(row.state.practiceSessions['Reading:1'].i, 2);
  loseResponse = true;
  assert.equal(await answer(a, 'Writing', 5), false);
  const committed = row.state.exercisesCompleted;
  assert.equal(await a.window.lpSaveProgress(a.st), true);
  assert.equal(row.state.exercisesCompleted, committed, 'Retry cannot count an answer twice');
  offline = true;
  assert.equal(await answer(b, 'Reading', 3), false);
  assert.ok(Object.keys(b.localStorage).some(key => key.startsWith('linguapath-outbox:student:')));
  offline = false;
  const reloaded = device(b.localStorage);
  assert.equal(await reloaded.window.lpSaveProgress(reloaded.st), true);
  assert.equal(row.state.exercisesCompleted, committed + 1, 'Queued answer survives a reload');
  const reset = { ...copy(initial), _resetId: randomUUID() };
  assert.equal(await a.window.lpSaveProgress(reset), true);
  assert.equal(row.state.exercisesCompleted, 0);
  assert.equal(await answer(b, 'Reading', 4), true);
  assert.equal(row.state.exercisesCompleted, 0, 'Stale device cannot undo an account reset');
  const cloud = vm.runInContext('restoreSavedProgress', a)({ savedAt: Date.now() + 1000, state: initial }, row);
  assert.equal(cloud.restoreLocal, false, 'Legacy local data cannot undo a reset');
  console.log('Concurrent saves, per-skill cursors, lost-response retry, offline reload, and reset protection passed.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
