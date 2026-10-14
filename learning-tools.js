// Shared, dependency-free learning helpers. Review practice never awards tier credit.
const reviewDay = 86400000;
function scheduleReview(previous, correct, selected, now = Date.now(), revision = false) {
  const old = previous || {};
  const intervalDays = correct ? (revision ? Math.min(30, (old.intervalDays || 1) * 2 + 1) : 3) : 1;
  return { ...old, failures: (Number(old.failures) || 0) + Number(!correct),
    lastAnswer: selected, lastWrongAt: correct ? old.lastWrongAt || 0 : now,
    needsCorrection: !correct && !revision, intervalDays,
    dueAt: now + intervalDays * reviewDay, updatedAt: now };
}
function dueReviews(state, now = Date.now()) {
  return Object.entries(state.learningReview || {}).filter(([, item]) =>
    !item.needsCorrection && item.dueAt > 0 && item.dueAt <= now
  ).sort((a, b) => a[1].dueAt - b[1].dueAt).map(([id]) => id);
}
function choiceFeedback(question, selected) {
  const reason = question.explanation || '';
  if (selected === question.a) return reason;
  const contrast = `Your choice: “${selected}”\nCorrect choice: “${question.a}”`;
  const focus = question.s === 'Speaking' ? 'Your choice leaves out or changes part of the examiner’s requested response.'
    : question.s === 'Writing' ? 'Compare the requested purpose, meaning, or sentence structure—not just whether your choice sounds natural.'
    : `Compare your choice with the ${question.s === 'Listening' ? 'speaker’s words' : 'passage’s evidence'} below; a related detail is not always the answer to this question.`;
  return `${contrast}\n${focus}\n${reason || explainAnswer(question).replace(/^Why:\s*/, '')}`;
}
function studentInsights(state, now = Date.now()) {
  const names = ['Listening', 'Reading', 'Writing', 'Speaking'];
  const totals = names.map(skill => ({ skill, count: (state.correctBySkillTier?.[skill] || []).reduce((sum, n) => sum + (Number(n) || 0), 0) }));
  const min = Math.min(...totals.map(item => item.count)), max = Math.max(...totals.map(item => item.count));
  const focus = min < max ? totals.filter(item => item.count === min).map(item => item.skill).join(', ') : '';
  const inactive = !state.lastActivityAt || now - state.lastActivityAt >= 7 * reviewDay;
  const recurring = Object.entries(state.learningReview || {}).filter(([, item]) => item.failures >= 2)
    .sort((a, b) => b[1].failures - a[1].failures);
  return { focus, inactive, recurring, due: dueReviews(state, now).length };
}

if (typeof document !== 'undefined' && document.querySelector('#review-dialog')) (() => {
  const $ = selector => document.querySelector(selector);
  const dialog = $('#review-dialog');
  const card = document.createElement('section');
  card.className = 'recall-card';
  card.setAttribute('aria-labelledby', 'review-count');
  card.innerHTML = '<div><p class="eyebrow">Remember what you learn</p><h2 id="review-count">Build lasting recall</h2><p id="review-description" class="muted"></p></div><button id="start-review" type="button" class="secondary" disabled>Review now</button>';
  $('#today .lower-grid').after(card);
  let queue = [], index = 0, selected = '', checked = false, owner = null;
  const reviewMap = () => st.learningReview ||= {};
  const previousRender = render;
  render = () => {
    previousRender();
    const due = dueReviews(st).filter(id => Q.some(q => q.id === id));
    $('#review-count').textContent = due.length ? `${due.length} question${due.length === 1 ? '' : 's'} ready to revisit` : 'Build lasting recall';
    const future = Object.values(st.learningReview || {}).filter(item => !item.needsCorrection && item.dueAt > Date.now()).sort((a,b) => a.dueAt - b.dueAt)[0];
    $('#review-description').textContent = due.length ? 'A short check of questions you previously found difficult. No extra tier points.'
      : future ? `Next review: ${new Date(future.dueAt).toLocaleDateString()}. Corrected mistakes return after three days.` : 'After you correct a mistake, it will return a few days later. Your normal practice stays where you left it.';
    $('#start-review').disabled = !due.length;
    if (dialog.open && owner !== session) dialog.close();
  };
  const previousDraw = draw;
  draw = () => {
    previousDraw();
    const q = P.queue[P.i];
    if (q && P.checked && P.selected !== q.a) $('#answer-result').textContent = `Not quite. ${choiceFeedback(q, P.selected)}\nYou’ll retry this question at the end of the tier.`;
  };
  // Capture only new answers, never redraws/restored answers or the Next button.
  $('#check-answer').addEventListener('click', () => {
    if (P.checked || !P.selected) return;
    const q = P.queue[P.i];
    if (!q?.id) return;
    const old = reviewMap()[q.id], correct = P.selected === q.a;
    if (!correct || old) reviewMap()[q.id] = scheduleReview(old, correct, P.selected);
    // The existing answer handler persists this along with the score in one save.
  }, true);

  function drawReview() {
    const q = queue[index];
    $('#review-position').textContent = `${q.s} · Tier ${q.t} · Review ${index + 1} of ${queue.length}`;
    $('#review-question').textContent = q.p;
    $('#review-options').replaceChildren(...q.o.map(option => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'answer-option'; button.textContent = option;
      button.disabled = checked;
      button.setAttribute('aria-pressed', String(selected === option));
      button.classList.toggle('selected', selected === option);
      button.classList.toggle('is-correct', checked && option === q.a);
      button.classList.toggle('is-incorrect', checked && option === selected && selected !== q.a);
      button.addEventListener('click', () => { selected = option; drawReview(); $('#review-check').focus(); });
      return button;
    }));
    $('#review-listen').hidden = q.s !== 'Listening';
    $('#review-transcript').hidden = !checked || q.s !== 'Listening';
    $('#review-transcript').textContent = q.transcript || q.audio || '';
    $('#review-feedback').textContent = checked ? `${selected === q.a ? 'Correct. ' : 'Not quite. '}${choiceFeedback(q, selected)}\nWe’ll revisit this in ${reviewMap()[q.id].intervalDays} day(s).` : '';
    $('#review-check').textContent = !checked ? 'Check answer' : index === queue.length - 1 ? 'Finish review' : 'Next review';
    $('#review-check').disabled = !selected;
  }
  $('#start-review').addEventListener('click', () => {
    queue = dueReviews(st).map(id => Q.find(q => q.id === id)).filter(Boolean).slice(0, 10);
    if (!queue.length) return;
    owner = session; index = 0; selected = ''; checked = false;
    drawReview(); dialog.showModal(); document.body.classList.add('recall-open'); $('#review-heading').focus();
  });
  $('#review-check').addEventListener('click', () => {
    if (owner !== session || !selected) { dialog.close(); return; }
    if (!checked) {
      const q = queue[index];
      reviewMap()[q.id] = scheduleReview(reviewMap()[q.id], selected === q.a, selected, Date.now(), true);
      checked = true; save(); drawReview(); render();
    } else if (index === queue.length - 1) dialog.close();
    else { index++; selected = ''; checked = false; drawReview(); $('#review-heading').focus(); }
  });
  $('#review-listen').addEventListener('click', () => {
    if (!window.speechSynthesis) { $('#review-feedback').textContent = 'Audio unavailable. Try a browser with speech playback.'; return; }
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(queue[index].audio || queue[index].transcript);
    speech.rate = .9; window.speechSynthesis.speak(speech);
  });
  $('#close-review').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.body.classList.remove('recall-open'); window.speechSynthesis?.cancel(); render();
    const target = $('#start-review').disabled ? $('#review-count') : $('#start-review');
    target.tabIndex = target.id === 'review-count' ? -1 : 0; target.focus();
  });
  // Native dialog supplies focus containment, Escape, and an inert page behind it.
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
  window.addEventListener('lp:questions-ready', () => render());
  setInterval(() => { if (!dialog.open) render(); }, 60000);
  render();
})();
