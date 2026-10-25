const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'supabase-auth.js'), 'utf8');
const handler = source.slice(source.indexOf("authForm.addEventListener('submit'"), source.indexOf("authToggle.addEventListener('click'"));

async function check(ok, result) {
  const fields = Object.fromEntries(['auth-username', 'auth-password', 'auth-confirm-password', 'auth-error', 'forgot-password', 'auth-title', 'auth-subtitle'].map(id => [id, { value: '', textContent: '', hidden: false }]));
  fields['auth-username'].value = 'learner@example.com';
  fields['auth-password'].value = fields['auth-confirm-password'].value = 'test-only-password';
  let submit, loaded = false;
  const context = { recoveryToken: '', loginMode: false, document: { querySelector: selector => fields[selector.slice(1)] },
    authForm: { addEventListener: (_, fn) => { submit = fn; } },
    authRequest: async (route) => { assert.equal(route, 'signup'); return { ok, json: async () => result }; },
    setAuthMode: login => { context.loginMode = login; fields['auth-error'].textContent = ''; },
    localStorage: { setItem() {} }, CLOUD_SESSION_KEY: 'test', cloudSession: null,
    loadCloudUser: async () => { loaded = true; }, Date };
  vm.runInNewContext(handler, context);
  await submit({ preventDefault() {}, stopImmediatePropagation() {} });
  return { fields, context, loaded };
}

(async () => {
  const success = await check(true, { user: { id: 'test' } });
  assert.equal(success.context.loginMode, true);
  assert.equal(success.fields['auth-title'].textContent, 'Check your email');
  assert.match(success.fields['auth-subtitle'].textContent, /confirmation link.*return here and log in.*spam or junk/);
  assert.equal(success.fields['auth-password'].value, '');
  assert.equal(success.fields['auth-confirm-password'].value, '');
  assert.equal(success.fields['auth-username'].value, 'learner@example.com');
  assert.equal(success.fields['auth-error'].textContent, '');
  assert.equal(success.loaded, false);
  const failure = await check(false, { message: 'Email rate limit exceeded' });
  assert.equal(failure.context.loginMode, false);
  assert.equal(failure.fields['auth-error'].textContent, 'Email rate limit exceeded');
  assert.equal((await check(true, { access_token: 'fake', user: { id: 'test' } })).loaded, true);
  console.log('Signup confirmation instructions, login transition, errors, and immediate-session behavior passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
