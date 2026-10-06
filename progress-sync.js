// Three-way merge: apply this device's changes to the latest account state.
const cloneProgress = value => JSON.parse(JSON.stringify(value || {}));
const sameProgress = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const progressNumber = value => Math.max(0, Number(value) || 0);

function progressChange(base, next) {
  if ((base._resetId || '') !== (next._resetId || '')) return { base, next };
  const before = { _resetId: base._resetId || '' }, after = { _resetId: next._resetId || '' };
  for (const key of new Set([...Object.keys(base), ...Object.keys(next)])) {
    if (sameProgress(base[key], next[key])) continue;
    before[key] = base[key]; after[key] = next[key];
    if (['profile', 'practiceSessions', 'correctBySkillTier', 'missedBySkillTier', 'sessionCompletedAt', 'writingPortfolio'].includes(key)) {
      before[key] = {}; after[key] = {};
      for (const item of new Set([...Object.keys(base[key] || {}), ...Object.keys(next[key] || {})])) {
        if (sameProgress(base[key]?.[item], next[key]?.[item])) continue;
        before[key][item] = base[key]?.[item]; after[key][item] = next[key]?.[item];
      }
    }
    if (key === 'mistakes') {
      before[key] = (base[key] || []).filter(x => !(next[key] || []).some(y => sameProgress(x, y)));
      after[key] = (next[key] || []).filter(x => !(base[key] || []).some(y => sameProgress(x, y)));
    }
  }
  // Day identifies which daily counter a delta belongs to, even if the date didn't change.
  if ('today' in after) { before.dayKey = base.dayKey; after.dayKey = next.dayKey; }
  return { base: before, next: after };
}

function mergeProgress(remote, base, next) {
  remote = remote || {}; base = base || {}; next = next || {};
  if ((next._resetId || '') !== (base._resetId || '')) return cloneProgress(next);
  const result = cloneProgress(remote);
  const special = new Set(['_savedAt', '_syncReceipts', 'correct', 'correctByTier', 'correctBySkillTier',
    'exercisesCompleted', 'lessons', 'today', 'dayKey', 'profile', 'mistakes', 'missedBySkillTier',
    'practiceSession', 'practiceSessions', 'sessionCompletedAt', 'quoteUsed', 'writingPortfolio']);
  for (const key of Object.keys(next)) {
    if (!special.has(key) && !sameProgress(next[key], base[key])) result[key] = cloneProgress({ value: next[key] }).value;
  }
  const count = (r, b, n, cap = Infinity) => Math.min(cap, progressNumber(r) + Math.max(0, progressNumber(n) - progressNumber(b)));
  for (const key of ['exercisesCompleted', 'lessons']) result[key] = count(remote[key], base[key], next[key]);
  result.correctByTier = [0, 1, 2].map(i => count(remote.correctByTier?.[i], base.correctByTier?.[i], next.correctByTier?.[i], 100));
  result.correct = result.correctByTier.reduce((sum, n) => sum + n, 0);
  result.correctBySkillTier = cloneProgress(remote.correctBySkillTier);
  for (const skill of Object.keys(next.correctBySkillTier || {})) {
    result.correctBySkillTier[skill] = [0, 1, 2].map(i => count(remote.correctBySkillTier?.[skill]?.[i], base.correctBySkillTier?.[skill]?.[i], next.correctBySkillTier[skill]?.[i], 100));
  }
  result.dayKey = [remote.dayKey, next.dayKey].filter(Boolean).sort().at(-1) || '';
  result.today = result.dayKey === next.dayKey
    ? count(remote.dayKey === next.dayKey ? remote.today : 0, base.dayKey === next.dayKey ? base.today : 0, next.today)
    : progressNumber(remote.today);
  result.profile = { ...remote.profile };
  for (const key of Object.keys(next.profile || {})) if (!sameProgress(next.profile[key], base.profile?.[key])) result.profile[key] = next.profile[key];
  const mergeList = (r = [], b = [], n = []) => {
    const removed = new Set(b.filter(x => !n.some(y => sameProgress(x, y))).map(x => JSON.stringify(x)));
    return [...r, ...n.filter(x => !b.some(y => sameProgress(x, y)))].filter((x, i, all) =>
      !removed.has(JSON.stringify(x)) && all.findIndex(y => sameProgress(x, y)) === i);
  };
  result.mistakes = mergeList(remote.mistakes, base.mistakes, next.mistakes);
  result.quoteUsed = [...new Set([...(remote.quoteUsed || []), ...(next.quoteUsed || [])])];
  if ((next.quoteDate || '') > (remote.quoteDate || '')) {
    result.quoteDate = next.quoteDate; result.dailyQuote = next.dailyQuote;
    result.quoteUsed = next.quoteUsed;
  }
  result.missedBySkillTier = cloneProgress(remote.missedBySkillTier);
  for (const key of Object.keys(next.missedBySkillTier || {})) result.missedBySkillTier[key] = mergeList(remote.missedBySkillTier?.[key], base.missedBySkillTier?.[key], next.missedBySkillTier[key]);
  result.sessionCompletedAt = { ...remote.sessionCompletedAt };
  for (const [key, time] of Object.entries(next.sessionCompletedAt || {})) result.sessionCompletedAt[key] = Math.max(time, result.sessionCompletedAt[key] || 0);
  result.practiceSessions = cloneProgress(remote.practiceSessions);
  for (const [key, saved] of Object.entries(next.practiceSessions || {})) {
    if (sameProgress(saved, base.practiceSessions?.[key])) continue;
    const other = result.practiceSessions[key];
    // A stale device cannot move the same lesson backward, or revive a completed lesson.
    const rank = item => (item.phase === 'review' ? 100000 : 0) + progressNumber(item.i) * 2 + Number(!!item.checked);
    result.practiceSessions[key] = other && (rank(other) > rank(saved) || rank(other) === rank(saved) && (other.updatedAt || 0) > (saved.updatedAt || 0)) ? other : saved;
  }
  for (const [key, saved] of Object.entries(result.practiceSessions)) {
    if ((result.sessionCompletedAt[key] || 0) >= (saved.updatedAt || 0)) delete result.practiceSessions[key];
  }
  const latest = Object.values(result.practiceSessions).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
  result.practiceSession = latest || null;
  result.lastActivityAt = Math.max(remote.lastActivityAt || 0, next.lastActivityAt || 0);
  result.writingPortfolio = cloneProgress(remote.writingPortfolio);
  for (const [id, item] of Object.entries(next.writingPortfolio || {})) {
    if (sameProgress(item, base.writingPortfolio?.[id])) continue;
    const other = result.writingPortfolio[id];
    if (!other || (item.updatedAt || 0) >= (other.updatedAt || 0)) result.writingPortfolio[id] = cloneProgress(item);
  }
  // Completing the daily goal across devices should still ignite today's streak.
  if (result.today >= 10 && result.streakDay !== result.dayKey) {
    const last = Math.max(remote.lastStreakAt || 0, next.lastStreakAt || 0);
    result.streak = last && Date.now() - last < 86400000 ? Math.max(remote.streak || 0, next.streak || 0) + 1 : 1;
    result.streakDay = result.dayKey; result.lastStreakAt = Date.now();
  }
  return result;
}
