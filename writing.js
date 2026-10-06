// Guided practice, not an automatic writing examiner.
const writingWords = text => (String(text || '').trim().match(/\S+/g) || []).length;
function writingTask(q) {
  const title = q.p.split('\n')[0], focus = title.toLowerCase();
  const number = Number(q.id?.split(':').at(-1)) || 1;
  const contexts = ['your study routine', 'a school event', 'a late delivery', 'learning online', 'your library', 'a group project', 'applying for a job', 'an activity in your town', 'a trip', 'late homework', 'a new course', 'buses and trains', 'a change at work', 'a helpful teacher', 'a local park', 'healthy habits', 'buying a phone', 'helping in your town', 'planning a meeting', 'protecting the environment'];
  const context = contexts[(number - 1) % contexts.length];
  const angles = ['Say what happened and why.', 'Describe a problem. Suggest a way to fix it.', 'Say what you think someone should do. Explain why.', 'Describe two choices. Say which you prefer and why.', 'Describe a change. Say what may happen next.'];
  const angle = angles[Math.floor((number - 1) / 20) % angles.length];
  const formal = /email|formal|request|apolog|invit|greeting|closing|complaint|thanks|enquir|congrat|sympathy|welcome/.test(focus);
  const organisation = /cohes|link|transition|flow|paragraph|conclusion|introduction|argument|essay|summary|summaris/.test(focus);
  const language = /tense|verb|passive|conditional|inversion|noun|sentence|grammar|punctuation|article|pronoun|adverb|adjective|hedg|nominali|modality|modal/.test(focus);
  const goals = [[20, 40], [60, 100], [120, 180]][q.t - 1] || [20, 40];
  const form = formal ? (q.t === 1 ? 'short message' : 'email') : q.t === 1 ? 'few sentences' : q.t === 2 ? 'paragraph' : 'short opinion text';
  const gap = q.p.split('\n').slice(1).join(' ').match(/[^.!?]*_{2,}[^.!?]*[.!?]?/)?.[0]?.trim();
  const instruction = gap
    ? `1. Fill in the missing word: “${gap}”\n2. Add more sentences about the same situation. ${angle}\n3. Read your answer again. Check that it makes sense.`
    : `Write ${form === 'few sentences' ? 'a few sentences' : form === 'email' ? 'an email' : `a ${form}`} about ${context}.\n1. ${angle}\n2. ${formal ? 'Say who you are writing to. Start with a greeting and end politely.' : 'Add a reason or an example.'}\n3. Read your answer again. Check spelling and punctuation.`;
  const specific = formal ? 'My message is polite and clear.' : organisation ? 'My ideas are in a clear order.' : language ? 'I checked the words and sentence patterns.' : 'My words are clear and easy to understand.';
  const model = gap ? gap.replace(/_{2,}/, q.a) : q.a;
  const explanation = formal ? 'This example is polite and says clearly what the writer wants. Check if your message does the same.' : organisation ? 'This example puts the ideas in a clear order. Check the order of your own ideas.' : language ? 'Look at the words and sentence pattern in this example. Check the same part of your answer.' : 'This example is clear and specific. Try to make your own answer easy to understand too.';
  return { title, instruction, goals, model, explanation, checks: ['I answered the question and added a reason or detail.', specific, 'I checked spelling and punctuation.'] };
}

if (typeof document !== 'undefined') (() => {
  const $ = s => document.querySelector(s), panel = $('#writing-practice'), input = $('#writing-response');
  input.maxLength = 2400;
  input.setAttribute('aria-describedby', 'writing-word-count');
  const task = document.createElement('p'); task.id = 'writing-task'; panel.prepend(task);
  const counter = document.createElement('p'); counter.id = 'writing-word-count'; input.after(counter);
  const guidance = panel.querySelector('textarea + p + p');
  guidance.textContent = 'First write your answer. Then choose an answer in a short quiz. Your writing is saved, but the quiz score does not grade your writing.';
  const review = document.createElement('section'); review.className = 'writing-review';
  review.innerHTML = '<h3>Read the example, then check your answer</h3><p class="writing-model-label">One example. Your answer can be different.</p><blockquote id="writing-model"></blockquote><p id="writing-explanation"></p><p id="writing-feedback" role="status"></p><label for="writing-revision">Your improved answer</label><textarea id="writing-revision" rows="5" maxlength="2400" placeholder="Improve your response here…"></textarea><p id="writing-revision-count"></p><fieldset id="writing-checklist"><legend>Review your own writing</legend></fieldset><button id="writing-save-review" class="secondary" type="button">Save my answer</button><p id="writing-review-status" role="status"></p>';
  panel.append(review);
  const knowledge = document.createElement('p'); knowledge.className = 'writing-knowledge'; $('#answer-options').before(knowledge);
  let activeId = '';
  const entry = () => st.writingPortfolio?.[P.queue?.[P.i]?.id];
  const current = () => P.queue?.[P.i];
  const store = (changes, q = current()) => {
    if (q?.s !== 'Writing') return;
    st.writingPortfolio ||= {};
    st.writingPortfolio[q.id] = { ...st.writingPortfolio[q.id], ...changes, updatedAt: Date.now() };
    savePracticeSession(true);
  };
  const ready = () => {
    const item = entry();
    return item?.completedAt && item.revision?.trim();
  };
  const beforeWriting = draw;
  draw = () => {
    const q = current();
    if (q?.s === 'Writing' && activeId !== q.id) {
      activeId = q.id;
      P.draft = entry()?.draft ?? P.draft ?? '';
    } else if (q?.s !== 'Writing') activeId = '';
    beforeWriting();
    knowledge.hidden = q?.s !== 'Writing' || !P.revealed && !P.checked;
    if (q?.s !== 'Writing') return;
    const content = writingTask(q), item = entry();
    $('#practice-score').textContent = `${Number(st.correctBySkillTier.Writing?.[P.tier - 1]) || 0} / 100 quiz answers correct`;
    $('#question-text').textContent = content.title;
    task.textContent = content.instruction;
    counter.textContent = `${writingWords(P.draft)} words · Aim for ${content.goals.join('–')} words (a guide, not a rule)`;
    input.readOnly = !!item?.original;
    panel.querySelector('label[for="writing-response"]').textContent = item?.original ? 'Your first answer' : 'Write your answer';
    $('#show-writing-samples').textContent = 'Save my writing & start the quiz';
    $('#show-writing-samples').hidden = !!P.revealed || !!P.checked;
    review.hidden = !P.checked || !item?.original;
    knowledge.textContent = `Quick quiz: ${q.p.split('\n').slice(1).join(' ') || q.p}`;
    if (P.checked) {
      $('#practice-score').textContent = `${Number(st.correctBySkillTier.Writing?.[P.tier - 1]) || 0} / 100 quiz answers correct`;
      $('#answer-result').textContent = `${P.selected === q.a ? 'Quiz answer correct.' : 'Not quite. You can try this quiz again at the end of the tier.'} This quiz score does not grade your writing.`;
      if (item?.original) {
        $('#writing-model').textContent = content.model;
        $('#writing-explanation').textContent = content.explanation;
        $('#writing-feedback').textContent = writingWords(item.original) < content.goals[0] ? 'Try adding a reason or an example to make your answer longer.' : 'Read your answer again. Use the three checks below.';
        if ($('#writing-revision').value !== (item.revision || item.original)) $('#writing-revision').value = item.revision || item.original;
        $('#writing-revision-count').textContent = `${writingWords($('#writing-revision').value)} words`;
        $('#writing-checklist').replaceChildren();
        const legend = document.createElement('legend'); legend.textContent = 'Review your own writing'; $('#writing-checklist').append(legend);
        content.checks.forEach((text, i) => {
          const label = document.createElement('label'), box = document.createElement('input');
          box.type = 'checkbox'; box.dataset.check = String(i); box.checked = !!item.checks?.[i]; label.append(box, document.createTextNode(text)); $('#writing-checklist').append(label);
        });
        $('#writing-review-status').textContent = ready() ? 'Saved. Press Next exercise to continue. This is not a teacher grade.' : 'Improve your answer if needed. Tick the three boxes, then press Save my answer.';
        $('#check-answer').disabled = !ready();
      }
    }
  };
  input.addEventListener('input', () => {
    counter.textContent = `${writingWords(input.value)} words · Aim for ${writingTask(current()).goals.join('–')} words`;
    const q = current(), draft = input.value;
    clearTimeout(writingSaveTimer);
    writingSaveTimer = setTimeout(() => store({ draft }, q), 350);
  });
  $('#show-writing-samples').addEventListener('click', event => {
    if (current()?.s !== 'Writing') return;
    event.stopImmediatePropagation();
    if (!input.value.trim()) return;
    clearTimeout(writingSaveTimer);
    P.draft = input.value;
    store({ draft: P.draft, original: entry()?.original || P.draft, submittedAt: entry()?.submittedAt || Date.now() });
    P.revealed = true; draw(); savePracticeSession(true);
  }, true);
  $('#writing-revision').addEventListener('input', event => {
    $('#writing-revision-count').textContent = `${writingWords(event.target.value)} words`;
    const q = current(), revision = event.target.value;
    if (entry()) entry().completedAt = null;
    $('#check-answer').disabled = true;
    $('#writing-review-status').textContent = 'You changed your answer. Press Save my answer again when you are ready.';
    clearTimeout(writingSaveTimer);
    writingSaveTimer = setTimeout(() => store({ revision, completedAt: null }, q), 350);
  });
  $('#writing-checklist').addEventListener('change', () => {
    store({ checks: [...$('#writing-checklist').querySelectorAll('input')].map(box => box.checked), completedAt: null });
    $('#check-answer').disabled = true;
  });
  $('#writing-save-review').addEventListener('click', () => {
    const checks = [...$('#writing-checklist').querySelectorAll('input')].map(box => box.checked);
    const revision = $('#writing-revision').value.trim();
    if (!revision || !checks.every(Boolean)) { $('#writing-review-status').textContent = 'Write your answer and tick the three boxes first.'; return; }
    clearTimeout(writingSaveTimer); store({ revision, checks, completedAt: Date.now() }); draw(); render();
  });
  $('#check-answer').addEventListener('click', event => {
    if (current()?.s === 'Writing' && P.checked && entry()?.original && !ready()) {
      event.stopImmediatePropagation(); $('#writing-review-status').textContent = 'Tick the three boxes and save your answer first.';
    }
  }, true);
  $('#close-practice').addEventListener('click', () => {
    if (current()?.s !== 'Writing') return;
    clearTimeout(writingSaveTimer);
    store(P.checked && entry()?.original ? { revision: $('#writing-revision').value } : { draft: input.value });
  }, true);
  const flushWriting = () => {
    if (current()?.s !== 'Writing' || !$('#practice-modal').classList.contains('open')) return;
    clearTimeout(writingSaveTimer);
    store(P.checked && entry()?.original ? { revision: $('#writing-revision').value } : { draft: input.value });
  };
  window.addEventListener('pagehide', flushWriting);
  document.addEventListener('visibilitychange', () => { if (document.hidden) flushWriting(); });
  const portfolio = document.createElement('details'); portfolio.className = 'writing-portfolio';
  portfolio.innerHTML = '<summary>My writing portfolio</summary><p>Original and latest revised responses. Self-review is not a teacher assessment.</p><div></div>';
  $('#profile').append(portfolio);
  const beforePortfolio = render;
  render = () => {
    beforePortfolio(); const list = portfolio.querySelector('div'); list.replaceChildren();
    const records = Object.entries(st.writingPortfolio || {}).sort((a,b)=>(b[1].updatedAt||0)-(a[1].updatedAt||0));
    portfolio.querySelector('summary').textContent = `My writing portfolio · ${records.filter(([,item])=>item.completedAt).length} self-reviewed`;
    for (const [id, item] of records) {
      const detail = document.createElement('details'), title = document.createElement('summary');
      title.textContent = `${id.replaceAll(':', ' · ')} · ${item.completedAt ? 'Self-reviewed' : 'In progress'}`; detail.append(title);
      for (const [label, value] of [['Original', item.original || item.draft], ['Latest revision', item.revision]]) {
        if (!value) continue; const heading = document.createElement('h4'), text = document.createElement('p'); heading.textContent = label; text.textContent = value; detail.append(heading, text);
      }
      list.append(detail);
    }
  };
  render();
})();
