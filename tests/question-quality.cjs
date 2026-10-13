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
assert.equal(changedSpeaking.length,300);
const curriculum=require('../speaking-curriculum.cjs');
assert.equal(curriculum.length,300);
for(const q of changedSpeaking) {
  const expected=curriculum.find(item=>id(item)===id(q));
  for(const key of ['prompt','answer','options','explanation']) assert.deepEqual(q[key],expected[key],id(q));
  assert.ok(q.explanation.length>60,id(q));
  assert.ok(!/best response|I don't know\.|^Maybe\.$/.test(q.prompt),id(q));
  assert.ok(q.options.every(option=>option.length>=15),id(q));
}
for(let tier=1;tier<=3;tier++) {
  const rows=changedSpeaking.filter(q=>q.tier===tier);
  assert.equal(new Set(rows.map(q=>q.prompt)).size,100);
  const longest=rows.filter(q=>q.answer.length>Math.max(...q.options.filter(o=>o!==q.answer).map(o=>o.length))).length;
  const shortest=rows.filter(q=>q.answer.length<Math.min(...q.options.filter(o=>o!==q.answer).map(o=>o.length))).length;
  assert.ok(longest<40,`Tier ${tier}: longest-answer cue`);
  assert.ok(shortest<40,`Tier ${tier}: shortest-answer cue`);
  assert.deepEqual(rows.reduce((counts,q)=>(counts[q.options.indexOf(q.answer)]++,counts),[0,0,0,0]),[25,25,25,25]);
}
const context = vm.createContext({});
vm.runInContext(read('script.js').split('\n')[1],context);
const parsed = context.parseQuestion(get('Speaking:1:1'));
assert.ok(parsed.p.includes('Choose the response that meets the stated goal.'));
assert.ok(parsed.p.includes('Introduce yourself with all three details.'));
assert.ok(parsed.explanation);
const source=read('improvements.js');
vm.runInContext(source.slice(source.indexOf('function savedQuestionForSession'),source.indexOf('function practiceSessions()')),context);
const current=context.parseQuestion(get('Writing:1:75'));
const previous=context.savedQuestionForSession(current,{checked:true,updatedAt:1});
assert.equal(previous.a,'saw'); // already-graded answers keep their original question
assert.equal(context.savedQuestionForSession(current,{checked:false,updatedAt:1}),current);
const snapshot={...previous,p:'A saved question snapshot'};
assert.equal(context.savedQuestionForSession(current,{checked:true,question:snapshot}).p,snapshot.p);
const speaking=context.parseQuestion(get('Speaking:1:2'));
const legacyPrompt=speaking.previousQuestion.p.replace(/(Examiner: “[\s\S]*?”)[\s\S]*$/, '$1');
context.Q=[speaking];
context.st={mistakes:[{skill:'Speaking',tier:1,prompt:legacyPrompt}]};
vm.runInContext(source.slice(source.indexOf('function missedList'),source.indexOf('function hasMissesInTier')),context);
assert.equal(context.missedList('Speaking',1)[0],'Speaking:1:2');
context.st.missedBySkillTier['Speaking:1']=[];
assert.equal(context.missedList('Speaking',1).length,0); // do not resurrect cleared reviews
context.Q=[context.parseQuestion(get('Reading:1:1'))];
context.st={mistakes:[{skill:'Reading',tier:1}]};
assert.equal(context.missedList('Reading',1).length,0); // ignore malformed legacy records
console.log('All 1,200 stable IDs, answer integrity, 300 aligned writing tasks, duplicate removal, and graded-session compatibility passed.');
console.log('All 300 authored speaking goals, explanations, balanced answer positions, and length-cue checks passed.');
