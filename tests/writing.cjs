const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const context = vm.createContext({ console });
vm.runInContext(fs.readFileSync(path.join(root, 'writing.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'progress-sync.js'), 'utf8'), context);
const questions = JSON.parse(fs.readFileSync(path.join(root, 'questions.json'), 'utf8')).filter(q => q.skill === 'Writing');
assert.equal(questions.length, 300);
const tasks = questions.map(q => context.writingTask({ id: `Writing:${q.tier}:${q.number}`, t: q.tier, p: q.prompt, a: q.answer, explanation: q.explanation, writingTask: q.writingTask, writingModel: q.writingModel }));
assert.equal(new Set(questions.map(q => `${q.tier}:${q.number}`)).size, 300);
for (const task of tasks) {
  assert.ok(task.instruction.length > 50);
  assert.ok(task.model && task.explanation);
  assert.ok(!task.model.includes('__'));
  assert.ok(task.goals[1] > task.goals[0]);
}
assert.equal(vm.runInContext("writingWords('  A clear\\nshort response. ')", context), 4);
const base = { writingPortfolio: {} };
const remote = { writingPortfolio: { 'Writing:1:1': { original: 'First device', updatedAt: 3 } } };
const next = { writingPortfolio: { 'Writing:1:2': { original: 'Second device', updatedAt: 2 } } };
const delta = context.progressChange(base, next);
const merged = context.mergeProgress(remote, delta.base, delta.next);
assert.equal(Object.keys(merged.writingPortfolio).length, 2);
const stale = context.mergeProgress(remote, base, { writingPortfolio: { 'Writing:1:1': { original: 'Older', updatedAt: 1 } } });
assert.equal(stale.writingPortfolio['Writing:1:1'].original, 'First device');
assert.equal(context.writingTask({id:'Writing:1:22',t:1,p:'Past Simple\nHe ___ late yesterday.',a:'arrived'}).model, 'He arrived late yesterday.');
const teacher = vm.createContext({ document: {}, Intl, Date });
vm.runInContext(fs.readFileSync(path.join(root, 'teacher.js'), 'utf8').split('async function teacherToken')[0], teacher);
const html = teacher.writingOverview({writingPortfolio:{'Writing:1:1':{original:'<script>not HTML</script>',revision:'A clearer response.',updatedAt:1,completedAt:1}}});
assert.ok(html.includes('&lt;script&gt;'));
assert.ok(!html.includes('<script>'));
assert.ok(html.includes('A clearer response.'));
// Exercise the optional-writing UI without touching real accounts.
const nodes = new Map(), listeners = {};
function node(selector = '') {
  if (nodes.has(selector)) return nodes.get(selector);
  const el = { style: {}, value: '', hidden: false, disabled: false, children: [], events: {},
    classList: { contains: () => true },
    setAttribute() {}, prepend(...items) { this.children.unshift(...items); },
    append(...items) { this.children.push(...items); }, after(...items) { this.children.push(...items); },
    replaceChildren(...items) { this.children = items; },
    querySelector: selector => node(selector),
    addEventListener(type, handler, capture) { (this.events[type] ||= []).push({ handler, capture }); },
    fire(type) { const event = { target: this, stopImmediatePropagation() { this.stopped = true; } };
      for (const listener of [...(this.events[type] || [])].sort((a,b)=>Number(!!b.capture)-Number(!!a.capture))) {
        listener.handler(event); if (event.stopped) break;
      }
    }
  };
  nodes.set(selector, el); return el;
}
const state = { correctBySkillTier: { Writing: [0,0,0] }, writingPortfolio: {} };
const practice = { skill: 'Writing', tier: 1, i: 0, selected: '', checked: false, queue: [
  { id:'Writing:1:1', s:'Writing', t:1, p:'Formal email\nChoose the polite sentence.', a:'Please help me.' },
  { id:'Writing:1:2', s:'Writing', t:1, p:'Past simple\nHe ___ yesterday.', a:'arrived' }
] };
let saves = 0, elementNumber = 0;
const ui = vm.createContext({
  document: { querySelector: node, createElement: () => node(`created-${++elementNumber}`),
    addEventListener(type, handler) { listeners[type] = handler; } },
  window: { addEventListener(type, handler) { listeners[type] = handler; } },
  st: state, P: practice, writingSaveTimer: null,
  setTimeout: handler => { listeners.timer = handler; return 1; }, clearTimeout: () => { delete listeners.timer; },
  savePracticeSession: () => saves++, render() {},
  draw() { node('#writing-response').value = practice.draft || '';
    node('#check-answer').disabled = !practice.selected;
    node('#answer-result').textContent = practice.checked ? 'Correct. Why: it is polite.' : '';
  }
});
// Simulate the existing quiz handler, registered before writing.js.
node('#check-answer').addEventListener('click', () => {
  if (!practice.checked) practice.checked = true;
  else { practice.i++; practice.checked = false; practice.selected = ''; }
  vm.runInContext('draw()', ui);
});
vm.runInContext(fs.readFileSync(path.join(root, 'writing.js'), 'utf8'), ui);
vm.runInContext('draw()', ui);
const optional = [...nodes.values()].find(el => el.className === 'writing-optional');
assert.equal(node('#answer-options').style.display, '');
assert.equal(optional.hidden, true);
practice.selected = practice.queue[0].a;
vm.runInContext('draw()', ui);
assert.equal(node('#check-answer').disabled, false); // no draft required
node('#check-answer').fire('click');
assert.equal(optional.hidden, false);
assert.equal(node('#check-answer').disabled, false); // no review required
assert.match(node('#answer-result').textContent, /Why:/);
node('#writing-response').value = 'My optional writing.';
node('#writing-response').fire('input');
node('#check-answer').fire('click'); // immediate Next flushes pending draft
assert.equal(practice.i, 1);
assert.equal(state.writingPortfolio['Writing:1:1'].revision, 'My optional writing.');
assert.equal(node('#writing-response').value, ''); // no previous answer leaking
assert.equal(optional.hidden, true);
assert.ok(saves > 0);
practice.i = 0; practice.checked = true; practice.selected = practice.queue[0].a;
vm.runInContext('draw()', ui);
assert.equal(node('#writing-response').value, 'My optional writing.');
node('#writing-response').value = 'My improved optional writing.';
node('#show-writing-samples').fire('click');
assert.equal(state.writingPortfolio['Writing:1:1'].original, 'My optional writing.');
assert.equal(state.writingPortfolio['Writing:1:1'].revision, 'My improved optional writing.');
assert.ok(state.writingPortfolio['Writing:1:1'].completedAt);
assert.equal(node('#check-answer').disabled, false);
console.log('All 300 guided tasks, word counts, completed model sentences, and portfolio merge checks passed.');
console.log('Quiz-first flow, optional writing, immediate Next saves, and restored originals passed.');
