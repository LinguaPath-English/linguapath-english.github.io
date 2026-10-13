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
  const optional = document.createElement('details'); optional.className = 'writing-optional';
  const summary = document.createElement('summary'); summary.textContent = 'Try writing your own answer (optional)'; optional.append(summary, panel);
  $('#answer-result').after(optional);
  const task = document.createElement('p'); task.id = 'writing-task'; panel.prepend(task);
  const counter = document.createElement('p'); counter.id = 'writing-word-count'; input.after(counter);
  const guidance = panel.querySelector('textarea + p + p');
  guidance.textContent = 'Extra practice: write your own answer or improve one you saved. You can skip this and continue. This is not automatically graded.';
  const model = document.createElement('blockquote'); model.id = 'writing-model'; task.after(model);
  const status = document.createElement('p'); status.id = 'writing-review-status'; status.setAttribute('role', 'status'); panel.append(status);
  let activeId = '';
  const entry = () => st.writingPortfolio?.[P.queue?.[P.i]?.id];
  const current = () => P.queue?.[P.i];
  const store = (changes, q = current()) => {
    if (q?.s !== 'Writing') return;
    st.writingPortfolio ||= {};
    st.writingPortfolio[q.id] = { ...st.writingPortfolio[q.id], ...changes, updatedAt: Date.now() };
    savePracticeSession(true);
  };
  const saveWriting = (explicit = false) => {
    const q = current(), value = input.value;
    if (q?.s !== 'Writing' || !P.checked || !value.trim()) return;
    const item = entry();
    if (!explicit && value === (item?.revision ?? item?.draft ?? item?.original ?? '')) return;
    clearTimeout(writingSaveTimer);
    P.draft = value;
    store({ draft: value, original: item?.original || value, revision: value,
      submittedAt: item?.submittedAt || Date.now(), ...(explicit ? { completedAt: Date.now() } : {}) }, q);
    status.textContent = explicit ? 'Writing saved. You can continue to the next exercise.' : 'Draft saved. Check the account save status above for cloud sync.';
  };
  const beforeWriting = draw;
  draw = () => {
    const q = current();
    if (q?.s === 'Writing' && activeId !== q.id) {
      const restoredDraft = entry()?.revision ?? entry()?.draft ?? entry()?.original ?? (activeId ? '' : P.draft || '');
      activeId = q.id;
      P.draft = restoredDraft;
      optional.open = false;
    } else if (q?.s !== 'Writing') activeId = '';
    beforeWriting();
    optional.hidden = q?.s !== 'Writing' || !P.checked;
    if (q?.s !== 'Writing') return;
    const content = writingTask(q), item = entry();
    $('#answer-options').style.display = '';
    $('#practice-score').textContent = `${Number(st.correctBySkillTier.Writing?.[P.tier - 1]) || 0} / 100 quiz answers correct`;
    $('#question-text').textContent = q.p;
    task.textContent = content.instruction;
    counter.textContent = `${writingWords(P.draft)} word${writingWords(P.draft) === 1 ? '' : 's'} · Aim for ${content.goals.join('–')} words (a guide, not a rule)`;
    input.readOnly = false;
    panel.querySelector('label[for="writing-response"]').textContent = 'Your answer';
    $('#show-writing-samples').textContent = 'Save my writing';
    $('#show-writing-samples').hidden = false;
    model.textContent = `Example: ${content.model}`;
    status.textContent = item?.completedAt ? 'Writing saved. You can continue to the next exercise.' : 'Writing is optional. Your draft saves as you type.';
  };
  input.addEventListener('input', () => {
    counter.textContent = `${writingWords(input.value)} word${writingWords(input.value) === 1 ? '' : 's'} · Aim for ${writingTask(current()).goals.join('–')} words`;
    P.draft = input.value;
    clearTimeout(writingSaveTimer);
    writingSaveTimer = setTimeout(() => saveWriting(), 350);
  });
  $('#show-writing-samples').addEventListener('click', event => {
    if (current()?.s !== 'Writing') return;
    event.stopImmediatePropagation();
    saveWriting(true); render();
  }, true);
  $('#check-answer').addEventListener('click', () => {
    if (current()?.s === 'Writing' && P.checked) saveWriting();
  }, true);
  $('#close-practice').addEventListener('click', () => {
    if (current()?.s !== 'Writing') return;
    clearTimeout(writingSaveTimer);
    saveWriting();
  }, true);
  const flushWriting = () => {
    if (current()?.s !== 'Writing' || !$('#practice-modal').classList.contains('open')) return;
    clearTimeout(writingSaveTimer);
    saveWriting();
  };
  window.addEventListener('pagehide', flushWriting);
  document.addEventListener('visibilitychange', () => { if (document.hidden) flushWriting(); });
  const portfolio = document.createElement('details'); portfolio.className = 'writing-portfolio';
  portfolio.innerHTML = '<summary>My writing portfolio</summary><p>Your saved writing and latest changes. Saved writing is not a teacher grade.</p><div></div>';
  $('#profile').append(portfolio);
  const beforePortfolio = render;
  render = () => {
    beforePortfolio(); const list = portfolio.querySelector('div'); list.replaceChildren();
    const records = Object.entries(st.writingPortfolio || {}).sort((a,b)=>(b[1].updatedAt||0)-(a[1].updatedAt||0));
    portfolio.querySelector('summary').textContent = `My writing portfolio · ${records.filter(([,item])=>item.completedAt).length} saved`;
    for (const [id, item] of records) {
      const detail = document.createElement('details'), title = document.createElement('summary');
      title.textContent = `${id.replaceAll(':', ' · ')} · ${item.completedAt ? 'Saved' : 'Draft'}`; detail.append(title);
      for (const [label, value] of [['Original', item.original || item.draft], ['Latest revision', item.revision]]) {
        if (!value) continue; const heading = document.createElement('h4'), text = document.createElement('p'); heading.textContent = label; text.textContent = value; detail.append(heading, text);
      }
      list.append(detail);
    }
  };
  render();
})();
