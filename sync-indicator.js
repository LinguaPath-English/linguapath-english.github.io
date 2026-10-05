const syncLabel = document.querySelector('#sync-status');
const syncRetry = document.querySelector('#sync-retry');
const saveToCloud = window.lpSaveProgress;
let saveRevision = 0;
let saveFailed = false;
let saving = false;

function showSync(message, detail = message, canRetry = false) {
  syncLabel.textContent = matchMedia('(max-width: 600px)').matches && message === 'Saved to your account' ? 'Saved' : message;
  syncLabel.title = detail;
  syncRetry.hidden = !canRetry;
  saveFailed = canRetry;
}

function showSaved(time = new Date()) {
  const when = new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(time);
  showSync('Saved to your account', `Saved to your account at ${when}`);
}

window.lpSaveProgress = state => {
  if (!window.__lpCloudUser) return saveToCloud(state);
  const revision = ++saveRevision;
  saving = true;
  showSync('Saving…');
  return saveToCloud(state).then(ok => {
    if (revision === saveRevision) {
      saving = false;
      if (ok) showSaved();
      else showSync('Save failed', 'Progress is on this device. Select Retry to save it to your account.', true);
    }
    return ok;
  });
};

syncRetry.addEventListener('click', () => {
  if (window.__lpCloudUser) window.lpCloudPending = window.lpSaveProgress(st);
});
window.addEventListener('online', () => {
  if (saveFailed && window.__lpCloudUser) syncRetry.click();
});
window.addEventListener('lp:cloud-ready', event => {
  if (saving) return;
  if (event.detail?.updatedAt) showSaved(new Date(event.detail.updatedAt));
  else showSync('Ready to save', 'Your first exercise will be saved to your account.');
});
window.addEventListener('lp:cloud-signed-out', () => showSync('Sign in to save'));
window.addEventListener('lp:cloud-load-failed', event => showSync('Could not load progress', event.detail?.message));
if (window.lpCloudReady) {
  if (window.lpCloudPending) {
    showSync('Saving…');
    window.lpCloudPending.then(ok => ok ? showSaved() : showSync('Save failed', 'Select Retry to save your progress.', true));
  } else if (window.lpCloudLastSavedAt) showSaved(new Date(window.lpCloudLastSavedAt));
  else showSync('Ready to save', 'Your first exercise will be saved to your account.');
} else showSync('Loading progress…');
