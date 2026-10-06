// Guided practice, not an automatic writing examiner.
const writingWords = text => (String(text || '').trim().match(/\S+/g) || []).length;
function writingTask(q) {
  const title = q.p.split('\n')[0], focus = title.toLowerCase();
  const number = Number(q.id?.split(':').at(-1)) || 1;
  const contexts = ['a study routine', 'a school event', 'a delayed delivery', 'learning online', 'a library service', 'a group project', 'a job application', 'a community activity', 'travel plans', 'a missed deadline', 'a new course', 'public transport', 'a workplace change', 'a helpful teacher', 'a local park', 'healthy habits', 'a technology purchase', 'a volunteering opportunity', 'a meeting arrangement', 'an environmental policy'];
  const context = contexts[(number - 1) % contexts.length];
  const angles = ['explain the situation and a reason', 'describe a problem and a practical solution', 'give a recommendation with supporting details', 'compare two choices and explain your preference', 'explain a change and its likely effect'];
  const angle = angles[Math.floor((number - 1) / 20) % angles.length];
  const formal = /email|formal|request|apolog|invit|greeting|closing|complaint|thanks|enquir|congrat|sympathy|welcome/.test(focus);
  const organisation = /cohes|link|transition|flow|paragraph|conclusion|introduction|argument|essay|summary|summaris/.test(focus);
  const language = /tense|verb|passive|conditional|inversion|noun|sentence|grammar|punctuation|article|pronoun|adverb|adjective|hedg|nominali|modality|modal/.test(focus);
  const goals = [[20, 40], [60, 100], [120, 180]][q.t - 1] || [20, 40];
  const form = formal ? (q.t === 1 ? 'short message' : 'email') : q.t === 1 ? 'short response' : q.t === 2 ? 'paragraph' : 'short argument';
  const gap = q.p.split('\n').slice(1).join(' ').match(/[^.!?]*_{2,}[^.!?]*[.!?]?/)?.[0]?.trim();
  const instruction = gap
    ? `First complete this sentence in your own draft: “${gap}”. Then write a ${form} about ${context}: ${angle}. Practise ${title.toLowerCase()} throughout your response.`
    : `Write a ${form} about ${context}: ${angle}. Your focus is ${title.toLowerCase()}. ${formal ? 'Address a suitable reader, explain your purpose, and use an appropriate greeting and closing.' : 'Make your main point clear and support it with a relevant example.'}`;
  const specific = formal ? 'My tone and wording suit the reader and purpose.' : organisation ? 'My ideas follow a logical order with useful links.' : language ? `I checked my use of ${title.toLowerCase()}.` : 'My wording is clear, precise, and appropriate.';
  const model = gap ? gap.replace(/_{2,}/, q.a) : q.a;
  const explanation = formal ? 'Notice the respectful wording and how the purpose is communicated without sounding demanding.' : organisation ? 'Notice how the example connects ideas or presents the main point. Use the same principle, not necessarily the same words.' : language ? `Notice the ${title.toLowerCase()} in this example. Check the same feature in your draft.` : 'Notice the clear, specific wording. Compare meaning and style, rather than copying the example.';
  return { title, instruction, goals, model, explanation, checks: ['I answered the task and included supporting detail.', specific, 'I checked grammar, spelling, and punctuation.'] };
}

if (typeof document !== 'undefined') (() => {
  const $ = s => document.querySelector(s), panel = $('#writing-practice'), input = $('#writing-response');
  input.maxLength = 2400;
  input.setAttribute('aria-describedby', 'writing-word-count');
  const task = document.createElement('p'); task.id = 'writing-task'; panel.prepend(task);
  const counter = document.createElement('p'); counter.id = 'writing-word-count'; input.after(counter);
  const guidance = panel.querySelector('textarea + p + p');
  guidance.textContent = 'Write first, then do the separate knowledge check. Your draft is saved, but is not automatically graded.';
  const review = document.createElement('section'); review.className = 'writing-review';
  review.innerHTML = '<h3>Compare, revise, and self-check</h3><p class="writing-model-label">Focus example—not the only valid answer</p><blockquote id="writing-model"></blockquote><p id="writing-explanation"></p><p id="writing-feedback" role="status"></p><label for="writing-revision">Your revised response</label><textarea id="writing-revision" rows="5" maxlength="2400" placeholder="Improve your response here…"></textarea><p id="writing-revision-count"></p><fieldset id="writing-checklist"><legend>Review your own writing</legend></fieldset><button id="writing-save-review" class="secondary" type="button">Save reviewed writing</button><p id="writing-review-status" role="status"></p>';
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
    $('#practice-score').textContent = `${Number(st.correctBySkillTier.Writing?.[P.tier - 1]) || 0} / 100 knowledge checks`;
    $('#question-text').textContent = content.title;
    task.textContent = content.instruction;
    counter.textContent = `${writingWords(P.draft)} words · Practice target ${content.goals.join('–')} words (not an exam limit)`;
    input.readOnly = !!item?.original;
    panel.querySelector('label[for="writing-response"]').textContent = item?.original ? 'Your original response' : 'Write your response';
    $('#show-writing-samples').textContent = 'Submit draft & open knowledge check';
    $('#show-writing-samples').hidden = !!P.revealed || !!P.checked;
    review.hidden = !P.checked || !item?.original;
    knowledge.textContent = `Knowledge check (separate from your writing): ${q.p.split('\n').slice(1).join(' ') || q.p}`;
    if (P.checked) {
      $('#practice-score').textContent = `${Number(st.correctBySkillTier.Writing?.[P.tier - 1]) || 0} / 100 knowledge checks`;
      $('#answer-result').textContent = `${P.selected === q.a ? 'Knowledge check correct.' : 'Knowledge check needs review; you will retry it at the end of the tier.'} Your own writing has not been graded.`;
      if (item?.original) {
        $('#writing-model').textContent = content.model;
        $('#writing-explanation').textContent = content.explanation;
        $('#writing-feedback').textContent = writingWords(item.original) < content.goals[0] ? 'Your draft is shorter than the practice target. Consider adding a reason, example, or explanation.' : 'Review the checklist below. Length alone does not show writing quality.';
        if ($('#writing-revision').value !== (item.revision || item.original)) $('#writing-revision').value = item.revision || item.original;
        $('#writing-revision-count').textContent = `${writingWords($('#writing-revision').value)} words`;
        $('#writing-checklist').replaceChildren();
        const legend = document.createElement('legend'); legend.textContent = 'Review your own writing'; $('#writing-checklist').append(legend);
        content.checks.forEach((text, i) => {
          const label = document.createElement('label'), box = document.createElement('input');
          box.type = 'checkbox'; box.dataset.check = String(i); box.checked = !!item.checks?.[i]; label.append(box, document.createTextNode(text)); $('#writing-checklist').append(label);
        });
        $('#writing-review-status').textContent = ready() ? 'Self-reviewed and saved. This is not a teacher grade.' : 'Review or improve your response, check each item, then save before continuing.';
        $('#check-answer').disabled = !ready();
      }
    }
  };
  input.addEventListener('input', () => {
    counter.textContent = `${writingWords(input.value)} words · Practice target ${writingTask(current()).goals.join('–')} words`;
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
    $('#writing-review-status').textContent = 'Revision changed. Save your self-review again before continuing.';
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
    if (!revision || !checks.every(Boolean)) { $('#writing-review-status').textContent = 'Add your response and check all three review items first.'; return; }
    clearTimeout(writingSaveTimer); store({ revision, checks, completedAt: Date.now() }); draw(); render();
  });
  $('#check-answer').addEventListener('click', event => {
    if (current()?.s === 'Writing' && P.checked && entry()?.original && !ready()) {
      event.stopImmediatePropagation(); $('#writing-review-status').textContent = 'Save your self-reviewed writing before continuing.';
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
