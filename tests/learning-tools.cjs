const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const context = vm.createContext({ Date, explainAnswer: () => 'Why: Match the passage’s detail.' });
vm.runInContext(read('learning-tools.js'), context);
vm.runInContext(read('progress-sync.js'), context);
const now = 1_800_000_000_000, day = 86400000;
const wrong = context.scheduleReview(null, false, 'Wrong option', now);
assert.equal(wrong.failures, 1);
assert.equal(context.dueReviews({ learningReview: { q: wrong } }, now + 20 * day).length, 0, 'Uncorrected mistakes remain in the tier review, not recall');
const corrected = context.scheduleReview(wrong, true, 'Correct option', now + day);
assert.equal(corrected.dueAt, now + 4 * day);
assert.equal(context.dueReviews({ learningReview: { q: corrected } }, now + 4 * day - 1).length, 0);
assert.equal(context.dueReviews({ learningReview: { q: corrected } }, now + 4 * day)[0], 'q');
assert.equal(context.scheduleReview(corrected, true, 'Correct option', now + 4 * day, true).intervalDays, 7);
assert.equal(context.scheduleReview(corrected, false, 'Wrong option', now + 4 * day, true).intervalDays, 1);
assert.equal(context.scheduleReview({ intervalDays: 30 }, true, 'a', now, true).intervalDays, 30);
const q = { s: 'Reading', a: 'Use the printed index.', explanation: 'The online catalogue is unavailable.' };
const feedback = context.choiceFeedback(q, 'Wait until tomorrow.');
assert.match(feedback, /Wait until tomorrow/);
assert.match(feedback, /Use the printed index/);
assert.match(feedback, /online catalogue is unavailable/);
const stats = context.studentInsights({ lastActivityAt: now - 8 * day, correctBySkillTier: { Writing: [10,0,0], Reading: [4,0,0], Speaking: [2,0,0], Listening: [7,0,0] }, learningReview: { q: { ...corrected, failures: 3 } } }, now + 5 * day);
assert.equal(stats.focus, 'Speaking');
assert.equal(stats.inactive, true);
assert.equal(stats.recurring.length, 1);
assert.equal(stats.due, 1);
assert.equal(context.studentInsights({}, now).focus, '', 'No invented proficiency diagnosis for new accounts');

// Two independent devices can add reviews without clobbering each other.
const base = { learningReview: {} }, remote = { learningReview: { a: wrong } }, next = { learningReview: { b: corrected } };
const change = context.progressChange(base, next);
assert.equal(Object.keys(context.mergeProgress(remote, change.base, change.next).learningReview).length, 2);
const newer = { ...corrected, updatedAt: now + 100 * day, dueAt: now + 107 * day };
const merged = context.mergeProgress({ learningReview: { q: newer } }, { learningReview: { q: wrong } }, { learningReview: { q: { ...wrong, failures: 2 } } });
assert.equal(merged.learningReview.q.dueAt, newer.dueAt, 'Stale schedule cannot overwrite a newer review');
assert.equal(merged.learningReview.q.failures, 2, 'Concurrent wrong attempts retained');
const reset = context.mergeProgress({ learningReview: { q: wrong } }, {}, { _resetId: 'new', learningReview: {} });
assert.equal(Object.keys(reset.learningReview).length, 0, 'Reset clears recall data');
// Review handler has no ordinary quiz path or tier award.
const handler = read('learning-tools.js').split("$('#review-check').addEventListener")[1].split("$('#review-listen')")[0];
assert.doesNotMatch(handler, /exercisesCompleted|correctByTier|correctBySkillTier|openPractice|P\.i\+\+/);
console.log('Recall scheduling, answer contrasts, teacher insights, cross-device merges, and reset safety passed.');

// Reduced motion can change while the page is open; hidden tabs stop rendering.
const events = {}, media = { matches: false, addEventListener: (_, cb) => events.motion = cb };
let requested = 0, cancelled = 0, animation;
const pointerEvents = {}, positions = {}, classes = new Set();
const canvas = { setAttribute() {}, getContext: () => ({ setTransform() {}, clearRect() {}, beginPath() {}, arc() {}, fill() {} }) };
const body = { prepend() {}, classList: { contains: name => classes.has(name), remove: name => classes.delete(name), add: name => classes.add(name) }, style: { setProperty: (name, value) => positions[name] = value } };
const doc = { body, hidden: false, createElement: () => canvas, addEventListener: (name, cb) => events[name] = cb };
vm.runInNewContext(read('ambient-background.js'), { document: doc, window: { addEventListener: (name, cb) => pointerEvents[name] = cb },
  matchMedia: query => query.includes('reduced') ? media : { matches: true },
  innerWidth: 375, innerHeight: 812, devicePixelRatio: 1, performance: { now: () => now },
  requestAnimationFrame: cb => { animation = cb; return ++requested; }, cancelAnimationFrame: () => cancelled++,
  MutationObserver: class { observe() {} } });
assert.equal(requested, 1);
events.motion({ matches: true });
assert.equal(requested, 1);
events.motion({ matches: false });
assert.equal(requested, 2);
doc.hidden = true; events.visibilitychange();
assert.equal(requested, 2);
assert.ok(cancelled >= 4);
console.log('Live reduced-motion changes and background-tab animation suspension passed.');
doc.hidden = false; events.visibilitychange();
pointerEvents.pointermove({ pointerType: 'mouse', clientX: 100, clientY: 80 }); animation(now + 16);
assert.equal(parseFloat(positions['--pointer-x']), 100, 'First entry starts at the pointer, not across the screen');
pointerEvents.pointermove({ pointerType: 'mouse', clientX: 300, clientY: 80 }); animation(now + 32);
assert.ok(parseFloat(positions['--pointer-x']) > 100 && parseFloat(positions['--pointer-x']) < 300, 'Glow eases rather than jumps');
animation(now + 2000); assert.equal(classes.has('pointer-active'), false, 'Idle glow fades out');
const beforeTouch = positions['--pointer-x'];
pointerEvents.pointermove({ pointerType: 'touch', clientX: 10, clientY: 10 }); animation(now + 2016);
assert.equal(positions['--pointer-x'], beforeTouch, 'Touch does not activate glow');
events.motion({ matches: true });
pointerEvents.pointermove({ pointerType: 'mouse', clientX: 10, clientY: 10 });
assert.equal(classes.has('pointer-active'), false, 'Reduced motion blocks pointer activation');
assert.match(read('ambient-background.css'), /pointer-events:none/);
assert.match(read('ambient-background.css'), /forced-colors:active/);
console.log('Smoothed pointer glow, idle fade, touch exclusion, and reduced-motion activation checks passed.');
