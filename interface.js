// Presentation and keyboard behavior; learning state stays in the practice flow.
(() => {
  const $ = selector => document.querySelector(selector);
  const welcome = $('#welcome-guide');
  $('#welcome-dismiss').addEventListener('click', () => {
    st.onboardingSeen = true;
    save();
    render();
    $('#today [data-skill]')?.focus();
  });
  const paths = {
    today: '<path d="m3 10 9-7 9 7v10H6V10m3 10v-7h6v7"/>',
    journey: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h7a4 4 0 0 0 0-8H9a4 4 0 0 1 0-8"/>',
    skills: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    Listening: '<path d="M4 14v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="12" width="4" height="8" rx="2"/><rect x="17" y="12" width="4" height="8" rx="2"/>',
    Reading: '<path d="M12 5v16M12 5C8 2 3 3 3 3v16s5-1 9 2c4-3 9-2 9-2V3s-5-1-9 2Z"/>',
    Writing: '<path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14v6Z"/>',
    Speaking: '<rect x="8" y="2" width="8" height="13" rx="4"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/>'
  };
  const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
  document.querySelectorAll('.nav-item').forEach(button => { button.querySelector('span').innerHTML = icon(button.dataset.nav); });
  document.querySelectorAll('.skill-card').forEach(button => { button.querySelector('.skill-icon').innerHTML = icon(button.dataset.skill); });
  $('.round-arrow').setAttribute('aria-label', 'Start a random skill warm-up');
  $('#close-practice').setAttribute('aria-label', 'Pause practice and go back');
  $('#close-edit').setAttribute('aria-label', 'Close profile editor');
  $('#profile-target').closest('label').remove(); // The actual daily goal is always ten.
  $('#profile-emoji').removeAttribute('maxlength');
  $('#profile-emoji').maxLength = 16;
  $('#profile-name').maxLength = 60;
  $('#profile-goal').maxLength = 100;
  $('#answer-result').setAttribute('role', 'status');
  $('#answer-result').setAttribute('aria-live', 'polite');
  $('.lesson-progress').setAttribute('role', 'progressbar');
  $('.lesson-progress').setAttribute('aria-label', 'Exercises completed in this session');
  $('.lesson-progress').setAttribute('aria-valuemin', '0');
  $('.lesson-progress').setAttribute('aria-valuemax', '100');

  const resumeHint = document.createElement('p');
  resumeHint.className = 'resume-hint';
  $('#today .section-heading > div').append(resumeHint);
  const keyboardHint = document.createElement('p');
  keyboardHint.className = 'keyboard-hint';
  keyboardHint.textContent = '1–4 to choose an answer · Esc to pause';
  $('#answer-options').after(keyboardHint);
  const footer = document.createElement('div');
  footer.className = 'practice-actions';
  $('#check-answer').before(footer);
  footer.append($('#check-answer'));
  const rules = document.createElement('details');
  rules.className = 'practice-rules';
  const summary = document.createElement('summary');
  summary.textContent = 'How tier progress works';
  rules.append(summary, $('.practice-note'));
  footer.after(rules);

  const renderBeforePolish = render;
  const resumeTarget = () => Object.values(st.practiceSessions || {}).filter(saved =>
    saved && tierUnlocked(saved.tier) && (st.sessionCompletedAt?.[`${saved.skill}:${saved.tier}`] || 0) < (saved.updatedAt || 1)
  ).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0))[0] || st.practiceSession;
  document.querySelectorAll('[data-action="practice"]').forEach(button => button.addEventListener('click', event => {
    event.stopImmediatePropagation();
    const saved = resumeTarget();
    openPractice(saved?.skill || 'Listening', saved || null);
  }, true));
  render = () => {
    renderBeforePolish();
    welcome.hidden = !window.__lpCloudUser || !!st.onboardingSeen || (Number(st.exercisesCompleted) || 0) > 0;
    document.body.classList.toggle('dark', !!st.profile.dark);
    const saved = resumeTarget();
    $('#today [data-action="practice"]').innerHTML = `${saved ? 'Continue practice' : 'Start practicing'} <span aria-hidden="true">→</span>`;
    resumeHint.textContent = saved
      ? `${saved.skill} · Tier ${saved.tier} · ${saved.phase === 'review' ? 'Missed-question review' : `Exercise ${saved.i + 1}`}`
      : 'Ten exercises. One small step forward.';
    const dark = document.body.classList.contains('dark');
    $('#theme-switch').setAttribute('role', 'switch');
    $('#theme-switch').setAttribute('aria-checked', String(dark));
    $('#theme-toggle').setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    $('#profile-menu-toggle').textContent = st.profile.emoji || '🌱';
  };
  new MutationObserver(() => {
    const dark = document.body.classList.contains('dark');
    $('#theme-switch').setAttribute('aria-checked', String(dark));
    $('#theme-toggle').setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  const drawBeforePolish = draw;
  let lastQuestion = '';
  draw = () => {
    drawBeforePolish();
    const question = P.queue[P.i];
    if (!question) return;
    const questionKey = `${P.skill}:${P.tier}:${P.i}:${P.phase}`;
    if (lastQuestion !== questionKey) {
      $('.practice-dialog').scrollTop = 0;
      $('#question-text').tabIndex = -1;
      if ($('#practice-modal').classList.contains('open') && $('.shell').inert) $('#question-text').focus({ preventScroll: true });
    }
    lastQuestion = questionKey;
    document.querySelectorAll('.answer-option').forEach((option, i) => {
      option.disabled = !!P.checked;
      option.setAttribute('aria-pressed', String(P.selected === question.o[i]));
      option.classList.toggle('is-correct', !!P.checked && question.o[i] === question.a);
      option.classList.toggle('is-incorrect', !!P.checked && question.o[i] === P.selected && P.selected !== question.a);
    });
    keyboardHint.hidden = P.checked || $('#answer-options').style.display === 'none';
    keyboardHint.textContent = `1–${Math.min(9, question.o.length)} to choose an answer · Esc to pause`;
    if (P.phase !== 'review') $('#practice-lesson').textContent = `Lesson ${P.i + 1} · Tier ${P.tier}`;
    $('.lesson-progress').setAttribute('aria-valuenow', String(parseFloat($('#lesson-progress-bar').style.width) || 0));
    $('#toggle-transcript').textContent = 'Show transcript';
    $('#toggle-transcript').setAttribute('aria-expanded', 'false');
    if (P.checked) {
      const result = P.selected === question.a
        ? (P.skill === 'Speaking' ? 'Correct! Now practice saying the model answer aloud.' : 'Correct — nicely done. Continue when you’re ready.')
        : 'Not quite. The correct answer is highlighted above. You’ll review this question at the end of the tier.';
      $('#answer-result').textContent = `${result} ${explainAnswer(question)}`;
    }
  };
  $('#toggle-transcript').addEventListener('click', event => {
    event.stopImmediatePropagation();
    const visible = $('.question-card').classList.toggle('show-transcript');
    event.currentTarget.textContent = visible ? 'Hide transcript' : 'Show transcript';
    event.currentTarget.setAttribute('aria-expanded', String(visible));
  }, true);
  $('#toggle-transcript').setAttribute('aria-controls', 'question-transcript');

  const originalGo = go;
  go = (id, fromHistory = false) => {
    if (!document.querySelector(`.view[id="${CSS.escape(id)}"]`)) return;
    originalGo(id);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) window.scrollTo(0, 0);
    document.querySelectorAll('.nav-item').forEach(button => {
      const active = button.dataset.nav === id || (id === 'momentum' && button.dataset.nav === 'today');
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    if (!fromHistory && location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
    const heading = document.querySelector('.view.active h1');
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  };
  window.addEventListener('popstate', () => go(location.hash.slice(1) || 'today', true));
  $('.topbar .brand').addEventListener('click', event => { event.preventDefault(); go('today'); });
  $('.momentum-link').addEventListener('keydown', event => { if (event.key === ' ') event.preventDefault(); });

  // Keep focus in an open dialog, return it to the opener, and stop background scroll.
  const panels = [$('#practice-modal'), $('#edit-modal')];
  panels.forEach(panel => {
    const dialog = panel.firstElementChild;
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', panel.id === 'practice-modal' ? 'Skill practice' : 'Edit profile');
    dialog.tabIndex = -1;
    let wasOpen = false, opener;
    new MutationObserver(() => {
      const open = panel.classList.contains('open');
      if (open === wasOpen) return;
      wasOpen = open;
      if (open) opener = document.activeElement;
      panel.setAttribute('aria-hidden', String(!open));
      const anyOpen = panels.some(item => item.classList.contains('open'));
      $('.shell').inert = anyOpen;
      document.body.classList.toggle('dialog-open', anyOpen);
      if (open) {
        dialog.focus({ preventScroll: true });
      } else {
        if (panel.id === 'practice-modal') { window.speechSynthesis?.cancel(); clearSpeakingCapture(); }
        if (opener?.isConnected) opener.focus({ preventScroll: true });
        render();
      }
    }).observe(panel, { attributes: true, attributeFilter: ['class'] });
  });
  document.addEventListener('keydown', event => {
    const panel = panels.find(item => item.classList.contains('open'));
    if (!panel) {
      if (event.key === 'Escape' && $('#profile-popout').classList.contains('open')) {
        $('#profile-menu-toggle').click();
        $('#profile-menu-toggle').focus();
      }
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      $(panel.id === 'practice-modal' ? '#close-practice' : '#close-edit').click();
      return;
    }
    const editing = event.target.closest('input,textarea,select,[contenteditable="true"]');
    if (panel.id === 'practice-modal' && !editing && !event.ctrlKey && !event.metaKey && !event.altKey && /^[1-9]$/.test(event.key)) {
      const option = document.querySelectorAll('.answer-option')[Number(event.key) - 1];
      if (option && !option.disabled && option.getClientRects().length) {
        event.preventDefault();
        option.click();
        document.querySelector('.answer-option.selected')?.focus();
      }
    }
    if (event.key !== 'Tab') return;
    const focusable = [...panel.querySelectorAll('button:not(:disabled),input,textarea,summary,a[href],[tabindex="0"],audio[controls]')].filter(el => el.getClientRects().length);
    const first = focusable[0], last = focusable.at(-1);
    if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.firstElementChild)) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  });
  render();
  go(location.hash.slice(1) || 'today', true);
  if ($('#practice-modal').classList.contains('open')) draw();
})();
