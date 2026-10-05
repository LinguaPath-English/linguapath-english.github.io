// Small, progressive enhancements layered over the existing practice flow.
let writingSaveTimer;
const originalPracticeDraw = draw;
const originalDashboardRender = render;
const originalPracticeOpen = openPractice;
const originalShowSpeakingOptions = showSpeakingOptions;

savePracticeSession = (active = true) => {
  if (!P.skill) return;
  st.practiceSession = {
    skill: P.skill, tier: P.tier, i: P.i, selected: P.selected,
    checked: P.checked, draft: P.draft || '', revealed: !!P.revealed,
    spoken: !!P.spoken, active
  };
  save();
};
openPractice = (skill, resume = null) => {
  const saved = resume || st.practiceSession;
  originalPracticeOpen(skill, resume);
  if (saved?.skill === skill) {
    P.draft = saved.draft || '';
    P.revealed = !!saved.revealed;
    P.spoken = !!saved.spoken;
  }
  priorExercise = P.i;
  draw();
  savePracticeSession(true);
};
showSpeakingOptions = message => {
  if (message.startsWith('Recording is not available')) message = 'Recording is unavailable here. Say the model answer aloud and compare the sounds and stress.';
  originalShowSpeakingOptions(message);
  if (speakingUrl) {
    document.querySelector('#start-speaking').style.display = '';
    document.querySelector('#start-speaking').textContent = 'Record again';
  }
  savePracticeSession(true);
};

function explainAnswer(question) {
  const answer = question.a;
  if (P.skill === 'Reading') return `Explanation: The passage supports “${answer}”. Check the sentence that gives this detail.`;
  if (P.skill === 'Listening') return `Explanation: The key spoken detail is “${answer}”. Listen for the time, action, or change described.`;
  if (P.skill === 'Writing') return `Explanation: “${answer}” best meets the writing goal stated in the prompt.`;
  return `Explanation: “${answer}” responds directly and gives the most complete answer to the examiner.`;
}

draw = () => {
  originalPracticeDraw();
  const writing = P.skill === 'Writing';
  const speaking = P.skill === 'Speaking';
  const writingPanel = document.querySelector('#writing-practice');
  const writingInput = document.querySelector('#writing-response');
  const compare = document.querySelector('#show-writing-samples');
  const answers = document.querySelector('#answer-options');
  const speakingPanel = document.querySelector('#speaking-practice');
  const speakingUnlocked = speaking && P.checked && P.selected === P.queue[P.i % P.queue.length].a;
  writingPanel.style.display = writing ? 'block' : 'none';
  if (writingInput.value !== (P.draft || '')) writingInput.value = P.draft || '';
  compare.disabled = !(P.draft || '').trim();
  answers.style.display = writing && !P.revealed && !P.checked ? 'none' : '';
  speakingPanel.style.display = speakingUnlocked ? 'block' : 'none';
  speakingPanel.querySelector('p').textContent = 'Correct! Practice saying the model answer aloud, record yourself, then listen back and check your pronunciation.';
  let model = document.querySelector('#speaking-model');
  if (!model) {
    model = document.createElement('p');
    model.id = 'speaking-model';
    model.className = 'speaking-model';
    speakingPanel.insertBefore(model, speakingPanel.querySelector('ul'));
  }
  model.textContent = P.queue[P.i % P.queue.length].a;
  const checks = speakingPanel.querySelectorAll('li');
  ['Are the sounds clear?', 'Did I stress the important words?', 'Was my speech steady and easy to understand?'].forEach((text, i) => { checks[i].textContent = text; });
  document.querySelector('#continue-speaking').style.display = 'none';
  let playModel = document.querySelector('#play-speaking-model');
  if (!playModel) {
    playModel = document.createElement('button');
    playModel.id = 'play-speaking-model';
    playModel.type = 'button';
    playModel.className = 'secondary';
    playModel.textContent = '▶ Hear model answer';
    document.querySelector('#start-speaking').before(playModel);
    playModel.addEventListener('click', () => {
      if (!window.speechSynthesis) { document.querySelector('#speaking-status').textContent = 'Audio playback is not available in this browser.'; return; }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(P.queue[P.i % P.queue.length].a);
      utterance.rate = .9;
      window.speechSynthesis.speak(utterance);
    });
  }
  document.querySelector('#start-speaking').textContent = speakingUrl ? 'Record again' : 'Start recording';
  if (P.checked) {
    const result = document.querySelector('#answer-result');
    result.textContent = `${P.selected === P.queue[P.i % P.queue.length].a ? 'Correct — great work!' : `Not quite. Correct answer: ${P.queue[P.i % P.queue.length].a}.`} ${explainAnswer(P.queue[P.i % P.queue.length])}`;
  }
};

document.querySelector('#writing-response').addEventListener('input', event => {
  P.draft = event.target.value;
  document.querySelector('#show-writing-samples').disabled = !P.draft.trim();
  clearTimeout(writingSaveTimer);
  writingSaveTimer = setTimeout(() => savePracticeSession(true), 350);
});
document.querySelector('#show-writing-samples').addEventListener('click', () => {
  if (!P.draft?.trim()) return;
  clearTimeout(writingSaveTimer);
  P.revealed = true;
  draw();
  savePracticeSession(true);
});
document.querySelector('#continue-speaking').addEventListener('click', () => {
  P.spoken = true;
  savePracticeSession(true);
});
document.querySelector('#start-speaking').addEventListener('click', () => window.speechSynthesis?.cancel(), true);
document.querySelector('#close-practice').addEventListener('click', () => clearTimeout(writingSaveTimer));

const checkButton = document.querySelector('#check-answer');
let priorExercise = 0;
checkButton.addEventListener('click', () => {
  setTimeout(() => {
    if (!P.checked && P.i > priorExercise) {
      P.draft = '';
      P.revealed = false;
      P.spoken = false;
      draw();
      savePracticeSession(true);
    }
    priorExercise = P.i;
  }, 0);
});

render = () => {
  originalDashboardRender();
  const count = Math.max(0, Number(st.today) || 0);
  const goalCount = Math.min(10, count);
  const extra = count - goalCount;
  const tier = currentTier();
  const accent = document.querySelector('.momentum .accent-text');
  if (accent) accent.textContent = extra ? `Daily goal complete · ${extra} extra exercise${extra === 1 ? '' : 's'}` : `${goalCount}/10 exercises answered today`;
  document.querySelector('#momentum-today').textContent = `${goalCount} / 10`;
  document.querySelector('#momentum-extra').textContent = extra ? `${extra} extra exercise${extra === 1 ? '' : 's'} today` : 'Exercises completed';
  document.querySelector('#momentum-next').textContent = tier < 3 ? `${Math.max(0, 100 - st.correctByTier[tier - 1])} left` : 'All unlocked';
  const tierNote = document.querySelector('.tier-card .muted');
  if (tierNote) tierNote.textContent = tier < 3 ? `${Math.max(0, 100 - st.correctByTier[tier - 1])} correct answers across all skills to the next tier` : 'All tiers unlocked';
  document.querySelectorAll('#daily-dots span').forEach((dot, i) => dot.classList.toggle('done', i < goalCount));
};
render();

function missedList(skill, tier) {
  if (!st.missedBySkillTier || typeof st.missedBySkillTier !== 'object' || Array.isArray(st.missedBySkillTier)) st.missedBySkillTier = {};
  const key = `${skill}:${tier}`;
  if (!Array.isArray(st.missedBySkillTier[key])) {
    const base = Q.filter(q => q.s === skill && q.t === tier);
    if (!base.length) return [];
    const oldMistakes = (st.mistakes || []).filter(m => m.skill === skill && Number(m.tier) === tier);
    st.missedBySkillTier[key] = [...new Set(oldMistakes.flatMap(m => base.filter(q => q.p === m.prompt).map(q => q.id)))];
  }
  return st.missedBySkillTier[key];
}
function hasMissesInTier(tier) { return skills.some(([skill]) => missedList(skill, tier).length > 0); }
const tierFromCorrectCount = currentTier;
currentTier = () => {
  if (st.correctByTier[0] < 100 || hasMissesInTier(1)) return 1;
  if (st.correctByTier[1] < 100 || hasMissesInTier(2)) return 2;
  return 3;
};
tierUnlocked = tier => tier === 1 || st.correctByTier[tier - 2] >= 100 && !hasMissesInTier(tier - 1);

function idForQuestion(q) { return q.id || `${q.s}:${q.t}:${q.p}`; }
function queueFor(skill, tier) {
  const queue = Q.filter(q => q.s === skill && q.t === tier);
  return queue.length ? queue : Q.filter(q => q.s === skill);
}
function missedTierFor(skill, limit) {
  for (let tier = 1; tier <= limit; tier++) if (missedList(skill, tier).length) return tier;
  return 0;
}

function sessionKey(skill, tier) { return `${skill}:${tier}`; }
function practiceSessions() {
  const sessions = st.practiceSessions && typeof st.practiceSessions === 'object' && !Array.isArray(st.practiceSessions)
    ? st.practiceSessions : (st.practiceSessions = {});
  const legacy = st.practiceSession;
  if (legacy?.skill && legacy.tier && !sessions[sessionKey(legacy.skill, legacy.tier)]) {
    sessions[sessionKey(legacy.skill, legacy.tier)] = legacy;
  }
  return sessions;
}
window.lpNormalizePracticeSessions = () => { practiceSessions(); };

savePracticeSession = (active = true) => {
  if (!P.skill) return;
  const saved = {
    skill: P.skill, tier: P.tier, i: P.i, selected: P.selected,
    checked: P.checked, draft: P.draft || '', revealed: !!P.revealed,
    spoken: !!P.spoken, phase: P.phase || 'base',
    queueIds: P.queue.map(idForQuestion), active, updatedAt: Date.now()
  };
  practiceSessions()[sessionKey(P.skill, P.tier)] = saved;
  st.practiceSession = saved;
  save();
};

openPractice = (skill, resume = null) => {
  if (!questionsReady) { note('Loading practice questions. Try again in a moment.'); return; }
  const normalTier = tierFromCorrectCount();
  const firstMissedTier = missedTierFor(skill, currentTier());
  const sessions = Object.values(practiceSessions()).filter(item => item.skill === skill);
  const saved = resume || sessions.find(item => item.tier === (firstMissedTier || currentTier())) ||
    sessions.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
  const keep = saved?.skill === skill && tierUnlocked(saved.tier);
  const tier = firstMissedTier || (keep ? saved.tier : currentTier());
  const reviewOnly = !!firstMissedTier && firstMissedTier < normalTier &&
    !(keep && saved.tier === firstMissedTier);
  const session = keep && saved.tier === tier ? saved : { skill, tier, i: 0, active: true };
  originalPracticeOpen(skill, { ...session, skill, tier, active: true });
  const base = queueFor(skill, tier);
  const byId = new Map(base.map(q => [idForQuestion(q), q]));
  const phase = reviewOnly || session.phase === 'review' ? 'review' : 'base';
  if (phase === 'review') {
    for (const q of base) byId.set(idForQuestion(q), q);
    P.queue = reviewOnly ? missedList(skill, tier).map(id => byId.get(id)).filter(Boolean)
      : (session.queueIds || []).map(id => byId.get(id)).filter(Boolean);
    if (!P.queue.length) P.queue = [...base, ...missedList(skill, tier).map(id => byId.get(id)).filter(Boolean)];
  } else P.queue = base;
  P.baseLength = reviewOnly ? 0 : base.length;
  P.phase = phase;
  P.i = Math.min(Math.max(0, Number(session.i) || 0), P.queue.length - 1);
  P.selected = session.selected || '';
  P.checked = !!session.checked;
  P.draft = session.draft || '';
  P.revealed = !!session.revealed;
  P.spoken = !!session.spoken;
  priorExercise = P.i;
  draw();
  savePracticeSession(true);
};

function completePracticeSession(skill, tier) {
  const sessions = practiceSessions();
  delete sessions[sessionKey(skill, tier)];
  if (st.practiceSession?.skill === skill && st.practiceSession?.tier === tier) {
    st.practiceSession = Object.values(sessions).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0] || null;
  }
  save();
}

const drawWithRetries = draw;
draw = () => {
  drawWithRetries();
  if (!P.skill) return;
  const count = P.phase === 'review' ? P.queue.length - P.baseLength : P.baseLength;
  document.querySelector('#practice-count').textContent = P.phase === 'review'
    ? `Review ${P.i - P.baseLength + 1} of ${count} missed`
    : `Exercise ${P.i + 1} of ${P.baseLength}`;
  if (P.phase === 'review') {
    document.querySelector('#practice-lesson').textContent = `Missed questions · Tier ${P.tier}`;
    document.querySelector('#lesson-progress-bar').style.width = Math.min(100, ((P.i - P.baseLength + (P.checked ? 1 : 0)) / Math.max(1, count)) * 100) + '%';
  }
  if (P.checked && P.i === P.queue.length - 1) {
    const pending = missedList(P.skill, P.tier).length;
    document.querySelector('#check-answer').textContent = P.phase === 'review' ? (pending ? 'Retry missed questions' : 'Finish review') : (pending ? 'Review missed questions' : 'Finish tier');
  }
};

checkButton.addEventListener('click', event => {
  if (!P.skill || !P.queue.length) return;
  const question = P.queue[P.i];
  const pending = missedList(P.skill, P.tier);
  const id = idForQuestion(question);
  if (P.checked && P.i === P.queue.length - 1 && !pending.length) {
    const skill = P.skill, tier = P.tier;
    setTimeout(() => completePracticeSession(skill, tier), 0);
  }
  if (!P.checked) {
    if (P.selected === question.a) st.missedBySkillTier[`${P.skill}:${P.tier}`] = pending.filter(item => item !== id);
    else if (!pending.includes(id)) pending.push(id);
    const skill = P.skill, tier = P.tier, state = st, correct = P.selected === question.a;
    if (correct) setTimeout(() => {
      state.correctBySkillTier[skill][tier - 1] = Math.min(100, Number(state.correctBySkillTier[skill][tier - 1]) || 0);
      save();
    }, 0);
    return;
  }
  if (P.i !== P.queue.length - 1 || !pending.length) return;
  event.stopImmediatePropagation();
  const base = queueFor(P.skill, P.tier);
  const byId = new Map(base.map(q => [idForQuestion(q), q]));
  P.queue = [...base, ...pending.map(item => byId.get(item)).filter(Boolean)];
  P.baseLength = base.length;
  P.phase = 'review';
  P.i = P.baseLength;
  P.selected = '';
  P.checked = false;
  draw();
  savePracticeSession(true);
}, true);

const renderWithRetryGate = render;
render = () => {
  renderWithRetryGate();
  const tier = currentTier(), pending = skills.reduce((sum, [skill]) => sum + missedList(skill, tier).length, 0);
  const next = document.querySelector('#momentum-next');
  if (next) next.textContent = pending ? `${pending} to retry` : tier < 3 ? `${Math.max(0, 100 - st.correctByTier[tier - 1])} left` : 'All unlocked';
  const nextNote = document.querySelector('#momentum-next + small');
  if (nextNote) nextNote.textContent = pending ? `Clear Tier ${tier} misses to unlock the next tier` : 'Correct across all skills';
  const tierNote = document.querySelector('.tier-card .muted');
  if (tierNote) tierNote.textContent = pending
    ? `${pending} missed question${pending === 1 ? '' : 's'} must be answered correctly before Tier ${tier + 1} unlocks`
    : tier < 3 ? `${Math.max(0, 100 - st.correctByTier[tier - 1])} correct answers across all skills to the next tier` : 'All tiers unlocked';
};
render();
