const SUPABASE_URL='https://hkqjmbitooohvzjrpqwl.supabase.co';
const SUPABASE_KEY='sb_publishable_pPQjL-x6W5jMPmZomRNSGg_bdpcex76';
const CLOUD_SESSION_KEY='linguapath-cloud-session';
let cloudSession=JSON.parse(localStorage.getItem(CLOUD_SESSION_KEY)||'null');
const syncClient = crypto.randomUUID();
let syncSequence = 0, capturedProgress = null, cloudSaveQueue = Promise.resolve();
const outboxPrefix = userId => 'linguapath-outbox:' + userId + ':';
const queuedChanges = userId => Object.keys(localStorage).filter(key => key.startsWith(outboxPrefix(userId)))
  .map(key => ({ key, ...JSON.parse(localStorage.getItem(key)) }))
  .sort((a, b) => a.createdAt - b.createdAt || a.sequence - b.sequence);
const captureProgress = state => {
  const snapshot = cloneProgress(state);
  delete snapshot._savedAt; delete snapshot._syncReceipts;
  return snapshot;
};
const authHeaders=token=>({apikey:SUPABASE_KEY,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})});
const authRequest=(path,options={})=>fetch(SUPABASE_URL+'/auth/v1/'+path,{...options,headers:{...authHeaders(),...(options.headers||{})}});
let recoveryToken='';
const recoveryParams=new URLSearchParams(location.hash.replace(/^#/,''));
if(recoveryParams.get('type')==='recovery')recoveryToken=recoveryParams.get('access_token')||'';
const setRecoveryMode=enabled=>{
  document.querySelector('#auth-email-label').hidden=enabled;
  document.querySelector('#auth-username').required=!enabled;
  document.querySelector('#auth-confirm-label').hidden=!enabled;
  document.querySelector('#auth-confirm-password').required=enabled;
  document.querySelector('#auth-title').textContent=enabled?'Choose a new password':loginMode?'Welcome back':'Create your account';
  document.querySelector('#auth-subtitle').textContent=enabled?'Use a new password for your LinguaPath account.':loginMode?'Log in to continue your saved practice.':'Save your practice and pick up where you left off.';
  document.querySelector('#auth-submit').textContent=enabled?'Save new password':loginMode?'Log in':'Create account';
  document.querySelector('#forgot-password').hidden=enabled||!loginMode;
  document.querySelector('#auth-toggle').hidden=enabled;
};

async function refreshCloudSession(){
  if(cloudSession?.expires_at>Date.now()/1000+60)return true;
  if(!cloudSession?.refresh_token)return false;
  const response=await authRequest('token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:cloudSession.refresh_token})});
  const next=await response.json();
  if(!response.ok)return false;
  cloudSession={...next,expires_at:next.expires_at||Math.floor(Date.now()/1000)+next.expires_in};
  localStorage.setItem(CLOUD_SESSION_KEY,JSON.stringify(cloudSession));
  return true;
}

function restoreSavedProgress(local,cloud){
  const localState=local?.state,cloudState=cloud?.state;
  if (cloudState?._resetId && cloudState._resetId !== localState?._resetId) return { state: cloudState, restoreLocal: false };
  if(!localState||(Number(local.savedAt)||0)<=(Date.parse(cloud?.updated_at)||0))return {state:cloudState||localState,restoreLocal:false};
  const state={...cloudState,...localState};
  if(cloudState){
    state.practiceSessions = mergeProgress(cloudState, { ...localState, practiceSessions: {} }, localState).practiceSessions;
    state.practiceSession = Object.values(state.practiceSessions).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0))[0] || null;
    state.correctBySkillTier = Object.fromEntries(skills.map(([skill]) => [skill, [0,1,2].map(i => Math.max(Number(cloudState.correctBySkillTier?.[skill]?.[i])||0, Number(localState.correctBySkillTier?.[skill]?.[i])||0))]));
    state.correctByTier=[0,1,2].map(i=>Math.max(Number(cloudState.correctByTier?.[i])||0,Number(localState.correctByTier?.[i])||0));
    state.correct=state.correctByTier.reduce((sum,n)=>sum+n,0);
    state.exercisesCompleted=Math.max(Number(cloudState.exercisesCompleted)||0,Number(localState.exercisesCompleted)||0);
    state.lessons=Math.max(Number(cloudState.lessons)||0,Number(localState.lessons)||0);
    if(cloudState.dayKey===localState.dayKey)state.today=Math.max(Number(cloudState.today)||0,Number(localState.today)||0);
  }
  return {state,restoreLocal:true};
}

async function loadCloudUser(user){
  if(!await refreshCloudSession()){
    cloudSession=null;window.__lpCloudUser=null;session=null;localStorage.removeItem(CLOUD_SESSION_KEY);localStorage.removeItem(SESSION_KEY);setAuthMode(true);
    authScreen.classList.remove('hidden');document.body.classList.remove('authenticated');
    document.querySelector('#auth-error').textContent='Your session expired. Please log in again; your saved progress is still in your account.';return;
  }
  let response;
  try{response=await fetch(SUPABASE_URL+'/rest/v1/student_progress?select=state,updated_at&user_id=eq.'+encodeURIComponent(user.id),{headers:authHeaders(cloudSession.access_token)})}
  catch{showCloudLoadError('Could not connect to load saved progress. Check your connection and reload the page.');return}
  if(!response.ok){showCloudLoadError('Could not load saved progress. Reload the page or log in again. Your account data was not changed.');return}
  const rows=await response.json();
  window.__lpCloudUser=user;
  const restored=restoreSavedProgress(users()[user.id],rows[0]);
  const pending = queuedChanges(user.id);
  // Journaled changes have a known baseline; never replace cloud state with their whole snapshot.
  if (pending.length) {
    restored.state = rows[0]?.state || pending[0].base;
    for (const change of pending) {
      if ((restored.state._syncReceipts?.[change.client] || 0) >= change.sequence) continue;
      if ((restored.state._resetId || '') !== (change.base._resetId || '') && !change.reset) continue;
      restored.state = mergeProgress(restored.state, change.base, change.next);
    }
    restored.restoreLocal = false;
  }
  if(restored.state){st={...cloneProgress(D),...restored.state};st.profile={...D.profile,...st.profile};st.correctByTier=Array.isArray(st.correctByTier)?[...st.correctByTier]:[0,0,0];st.correct=st.correctByTier.reduce((a,b)=>a+b,0);if(st.dayKey!==todayKey()){st.today=0;st.dayKey=todayKey()}}else st={...cloneProgress(D),dayKey:todayKey(),profile:{...D.profile,name:user.email?.split('@')[0]||'Learner'}};normalizeSkillTierProgress(st);window.lpNormalizePracticeSessions?.();if(st.streak&&!st.lastStreakAt)st.lastStreakAt=Date.now();
  capturedProgress = captureProgress(pending.length ? st : rows[0]?.state || {});
  // Import unsynced saves made by the previous website version once, using the cloud as baseline.
  if (restored.restoreLocal) capturedProgress = captureProgress(rows[0]?.state || D);
  else if (!rows.length && !pending.length) capturedProgress = null;
  session=user.id;localStorage.setItem(SESSION_KEY,session);authScreen.classList.add('hidden');document.body.classList.add('authenticated');
  window.lpCloudReady=true;
  window.lpCloudLastSavedAt=rows[0]?.updated_at||null;
  if(restored.restoreLocal || pending.length)window.lpCloudPending=window.lpSaveProgress(st);
  render();
  window.dispatchEvent(new CustomEvent('lp:cloud-ready',{detail:{updatedAt:window.lpCloudLastSavedAt,userId:user.id}}));
  window.lpResumePractice?.();
}

function showCloudLoadError(message){
  window.__lpCloudUser=null;window.lpCloudReady=false;
  authScreen.classList.remove('hidden');document.body.classList.remove('authenticated');
  setAuthMode(true);
  document.querySelector('#auth-error').textContent=message;
  window.dispatchEvent(new CustomEvent('lp:cloud-load-failed',{detail:{message}}));
}

async function readCloudProgress(userId) {
  const response = await fetch(SUPABASE_URL + '/rest/v1/student_progress?select=state,updated_at&user_id=eq.' + encodeURIComponent(userId), { headers: authHeaders(cloudSession.access_token) });
  if (!response.ok) throw new Error('Could not read account progress (' + response.status + ')');
  return (await response.json())[0];
}

function applyCloudProgress(state, updatedAt) {
  st = { ...D, ...state, profile: { ...D.profile, ...state.profile } };
  normalizeSkillTierProgress(st);
  capturedProgress = captureProgress(st);
  const all = users(); all[session] = { ...all[session], state: st, savedAt: Date.parse(updatedAt) };
  localStorage.setItem(USERS_KEY, JSON.stringify(all));
  window.lpCloudLastSavedAt = updatedAt;
  render();
  if (modal.classList.contains('open')) draw();
}

async function flushProgress(userId) {
  if (window.__lpCloudUser?.id !== userId) return false;
  if (!await refreshCloudSession()) throw new Error('Your session expired. Log in again to sync progress.');
  for (const change of queuedChanges(userId)) {
    for (let attempt = 0; attempt < 8; attempt++) {
      if (window.__lpCloudUser?.id !== userId) return false;
      const row = await readCloudProgress(userId);
      const remote = row?.state || change.base;
      if ((remote._syncReceipts?.[change.client] || 0) >= change.sequence ||
        (!change.reset && (remote._resetId || '') !== (change.base._resetId || ''))) {
        localStorage.removeItem(change.key); break;
      }
      const merged = mergeProgress(remote, change.base, change.next);
      merged._syncReceipts = { ...remote._syncReceipts, [change.client]: change.sequence };
      const updatedAt = new Date(Math.max(Date.now(), (Date.parse(row?.updated_at) || 0) + 1)).toISOString();
      const filter = row ? '&updated_at=eq.' + encodeURIComponent(row.updated_at) : '';
      const response = await fetch(SUPABASE_URL + '/rest/v1/student_progress' + (row ? '?user_id=eq.' + encodeURIComponent(userId) + filter : ''), {
        method: row ? 'PATCH' : 'POST', headers: { ...authHeaders(cloudSession.access_token), Prefer: 'return=representation' },
        body: JSON.stringify(row ? { state: merged, updated_at: updatedAt } : { user_id: userId, state: merged, updated_at: updatedAt })
      });
      if (response.status === 409) continue; // Another device created the first row.
      if (!response.ok) throw new Error('Progress save failed (' + response.status + ')');
      if ((await response.json()).length) { localStorage.removeItem(change.key); break; }
      if (attempt === 7) throw new Error('Another device is saving. Select Retry.');
    }
  }
  const latest = await readCloudProgress(userId);
  if (latest && window.__lpCloudUser?.id === userId && !queuedChanges(userId).length) applyCloudProgress(latest.state, latest.updated_at);
  return !queuedChanges(userId).length;
}

window.lpSaveProgress=state=>{
  if(!cloudSession?.access_token||!window.__lpCloudUser)return Promise.resolve(false);
  const userId=window.__lpCloudUser.id;
  const snapshot=captureProgress(state);
  if (!sameProgress(snapshot, capturedProgress)) {
    const sequence = ++syncSequence, base = capturedProgress || captureProgress(D);
    const change = progressChange(capturedProgress ? base : {}, snapshot);
    try {
      localStorage.setItem(outboxPrefix(userId) + syncClient + ':' + sequence, JSON.stringify({ client: syncClient, sequence,
        createdAt: Date.now(), ...change, reset: (snapshot._resetId || '') !== (base._resetId || '') }));
    } catch { return Promise.resolve(false); }
    capturedProgress = snapshot;
  }
  cloudSaveQueue=cloudSaveQueue.then(() => flushProgress(userId)).catch(error=>{console.error('Progress sync failed:',error);return false});
  return cloudSaveQueue;
};

// Refresh idle screens when students return from another tab or device.
window.addEventListener('focus', () => {
  if (!window.__lpCloudUser || modal.classList.contains('open')) return;
  window.lpCloudPending = window.lpSaveProgress(st);
});

authForm.addEventListener('submit',async e=>{
  e.preventDefault();e.stopImmediatePropagation();
  if(recoveryToken){
    const password=document.querySelector('#auth-password').value,confirmation=document.querySelector('#auth-confirm-password').value;
    if(password.length<6||password!==confirmation){document.querySelector('#auth-error').textContent='Passwords must match and contain at least 6 characters.';return}
    const response=await fetch(SUPABASE_URL+'/auth/v1/user',{method:'PUT',headers:authHeaders(recoveryToken),body:JSON.stringify({password})});
    if(!response.ok){document.querySelector('#auth-error').textContent='That reset link has expired. Request a new one and try again.';return}
    recoveryToken='';history.replaceState(null,'',location.pathname+location.search);authForm.reset();setRecoveryMode(false);setAuthMode(true);document.querySelector('#auth-error').textContent='Password updated. You can now log in.';return;
  }
  const email=document.querySelector('#auth-username').value.trim().toLowerCase(),password=document.querySelector('#auth-password').value;document.querySelector('#auth-error').textContent='';
  if (!loginMode && password !== document.querySelector('#auth-confirm-password').value) { document.querySelector('#auth-error').textContent='Passwords must match.'; return; }
  const response=loginMode?await authRequest('token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})}):await authRequest('signup',{method:'POST',body:JSON.stringify({email,password})});
  const result=await response.json();
  if(!response.ok){document.querySelector('#auth-error').textContent=result.error_description||result.msg||result.message||'Unable to access your account.';return}
  if(result.access_token){cloudSession={...result,expires_at:result.expires_at||Math.floor(Date.now()/1000)+result.expires_in};localStorage.setItem(CLOUD_SESSION_KEY,JSON.stringify(cloudSession));await loadCloudUser(result.user)}else document.querySelector('#auth-error').textContent='Account created. Check your email to confirm, then log in.';
},true);
authToggle.addEventListener('click',()=>setTimeout(()=>document.querySelector('#forgot-password').hidden=!loginMode,0));
document.querySelector('#forgot-password').addEventListener('click',async()=>{
  const email=document.querySelector('#auth-username').value.trim().toLowerCase();
  if(!email){document.querySelector('#auth-error').textContent='Enter your account email first.';document.querySelector('#auth-username').focus();return}
  const response=await authRequest('recover',{method:'POST',body:JSON.stringify({email,redirect_to:location.origin+location.pathname})});
  document.querySelector('#auth-error').textContent=response.ok?'If that account exists, a password-reset email is on its way.':'We could not send the reset email. Check the address and try again.';
});

document.querySelector('#logout-button').addEventListener('click',async e=>{e.preventDefault();e.stopImmediatePropagation();if(window.lpCloudPending)await window.lpCloudPending;if(cloudSession?.access_token)await authRequest('logout',{method:'POST',headers:{Authorization:'Bearer '+cloudSession.access_token}});cloudSession=null;window.__lpCloudUser=null;window.lpCloudReady=false;window.lpCloudLastSavedAt=null;window.dispatchEvent(new Event('lp:cloud-signed-out'));localStorage.removeItem(CLOUD_SESSION_KEY);session=null;localStorage.removeItem(SESSION_KEY);authScreen.classList.remove('hidden');document.body.classList.remove('authenticated');authForm.reset();capturedProgress=null;setAuthMode(true)},true);

(async()=>{if(recoveryToken){window.__lpCloudUser=null;session=null;localStorage.removeItem(SESSION_KEY);authScreen.classList.remove('hidden');document.body.classList.remove('authenticated');setRecoveryMode(true)}else if(cloudSession?.user&&cloudSession?.access_token)await loadCloudUser(cloudSession.user);else{window.__lpCloudUser=null;session=null;localStorage.removeItem(SESSION_KEY);authScreen.classList.remove('hidden');document.body.classList.remove('authenticated');setAuthMode(true);document.querySelector('#forgot-password').hidden=false}})();
