const assert=require('node:assert/strict'),fs=require('node:fs');
const css=fs.readFileSync(__dirname+'/../teacher-upgrades.css','utf8');
const html=fs.readFileSync(__dirname+'/../teacher.html','utf8');
assert.match(css,/body\.teacher-page\s*\{\s*overflow\s*:\s*auto\s*\}/);
assert.match(html,/teacher-upgrades\.css\?v=20261017-2/);
assert(html.indexOf('teacher-upgrades.css')>html.indexOf('style.css'));
console.log('Teacher scrolling: scoped override and cache-versioned stylesheet passed.');
