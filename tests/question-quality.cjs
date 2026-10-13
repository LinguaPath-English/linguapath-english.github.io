const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const bank = JSON.parse(read('questions.json'));
const id = q => `${q.skill}:${q.tier}:${q.number}`;
assert.equal(bank.length, 1200);
assert.equal(new Set(bank.map(id)).size, 1200);
for (const skill of ['Reading','Writing','Listening','Speaking']) for (let tier = 1; tier <= 3; tier++) {
  const rows = bank.filter(q=>q.skill===skill&&q.tier===tier);
  assert.equal(rows.length,100);
  assert.deepEqual(rows.map(q=>q.number).sort((a,b)=>a-b),Array.from({length:100},(_,i)=>i+1));
}
for (const q of bank) {
  assert.ok(q.options.length >= 3 && q.options.length <= 5, id(q));
  assert.equal(new Set(q.options).size,q.options.length,id(q));
  assert.equal(q.options.filter(o=>o===q.answer).length,1,id(q));
  if(q.previousQuestion) assert.equal(id(q.previousQuestion),id(q));
  if(q.skill==='Writing') {
    assert.ok(q.explanation.length>20,id(q));
    assert.ok(q.writingTask.length>50,id(q));
    assert.ok(q.writingModel && !q.writingModel.includes('___'),id(q));
    assert.ok(!q.answer.includes('Both A') && !q.answer.includes('\\260'),id(q));
  }
}
const get = key => bank.find(q=>id(q)===key);
assert.equal(get('Writing:1:75').answer,'was watching');
assert.equal(get('Reading:1:9').answer,"The professor was suddenly ill.");
assert.equal(get('Reading:1:23').answer,'In designated areas behind the building.');
assert.equal(get('Writing:2:46').answer,'2, 3, 1');
assert.equal(get('Writing:3:11').writingModel,'Had the policy been implemented earlier, the crisis might have been avoided.');
for (let tier=1;tier<=3;tier++) {
  const writing = bank.filter(q=>q.skill==='Writing'&&q.tier===tier);
  assert.equal(new Set(writing.map(q=>q.prompt+'|'+[...q.options].sort().join('|'))).size,100);
}
const changedSpeaking = bank.filter(q=>q.skill==='Speaking'&&q.previousQuestion);
assert.equal(changedSpeaking.length,18);
assert.ok(changedSpeaking.filter(q=>q.answer.length>Math.max(...q.options.filter(o=>o!==q.answer).map(o=>o.length))).length < 9);
const context = vm.createContext({});
vm.runInContext(read('script.js').split('\n')[1],context);
const parsed = context.parseQuestion(get('Speaking:1:1'));
assert.ok(parsed.p.includes('Choose a response that covers all three points.'));
assert.ok(parsed.explanation);
const source=read('improvements.js');
vm.runInContext(source.slice(source.indexOf('function savedQuestionForSession'),source.indexOf('function practiceSessions()')),context);
const current=context.parseQuestion(get('Writing:1:75'));
const previous=context.savedQuestionForSession(current,{checked:true,updatedAt:1});
assert.equal(previous.a,'saw'); // already-graded answers keep their original question
assert.equal(context.savedQuestionForSession(current,{checked:false,updatedAt:1}),current);
const snapshot={...previous,p:'A saved question snapshot'};
assert.equal(context.savedQuestionForSession(current,{checked:true,question:snapshot}).p,snapshot.p);
console.log('All 1,200 stable IDs, answer integrity, 300 aligned writing tasks, duplicate removal, and graded-session compatibility passed.');
