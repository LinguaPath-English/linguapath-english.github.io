// Local-only browser fixtures: synthetic student/teacher data, no Supabase requests.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const banner = '<div style="padding:8px;background:#ffe6a5;color:#28251b;text-align:center">ISOLATED QA — fictitious accounts; cloud writes disabled</div>';
const networkGuard = '<script>const qaFetch=window.fetch.bind(window);window.fetch=(url,...args)=>String(url).includes("supabase.co")?Promise.reject(new Error("QA blocks Supabase requests")):qaFetch(url,...args);</script>';
const bootstrap = `<script>
const qaStore = {getItem:k=>sessionStorage.getItem('lp-qa:'+k),setItem:(k,v)=>sessionStorage.setItem('lp-qa:'+k,v),removeItem:k=>sessionStorage.removeItem('lp-qa:'+k)};
Object.defineProperty(window,'localStorage',{value:qaStore});
if(!localStorage.getItem('linguapath-users')){
 const past=Date.now()-86400000, review={failures:2,needsCorrection:false,dueAt:past,intervalDays:3,updatedAt:past};
 localStorage.setItem('linguapath-session','qa-student');
 localStorage.setItem('linguapath-users',JSON.stringify({'qa-student':{state:{onboardingSeen:true,exercisesCompleted:10,lastActivityAt:past,correctBySkillTier:{Writing:[8,0,0],Reading:[1,0,0],Listening:[0,0,0],Speaking:[0,0,0]},learningReview:{'Writing:1:1':review,'Listening:1:1':review},profile:{name:'QA Student',goal:'Reach B2',emoji:'🌱',dark:false}}}}));
}
window.__lpCloudUser={id:'qa-student'};window.lpCloudReady=true;window.lpSaveProgress=async()=>true;
document.addEventListener('DOMContentLoaded',()=>{document.body.classList.add('authenticated');document.querySelector('#auth-screen').classList.add('hidden')});
</script>`;
const teacherSeed = `<script>
teacherSession={user:{id:'qa-teacher'},access_token:'qa',expires_at:Date.now()/1000+3600};
studentRows=[{user_id:'qa-student',email:'student@example.invalid',updated_at:new Date().toISOString(),state:{profile:{name:'QA Student'},lastActivityAt:Date.now()-9*86400000,exercisesCompleted:20,correct:12,correctBySkillTier:{Writing:[8,0,0],Reading:[4,0,0],Listening:[0,0,0],Speaking:[0,0,0]},learningReview:{'Writing:1:1':{failures:3,dueAt:Date.now()-1,needsCorrection:false}}}}];
fetch('questions.json').then(r=>r.json()).then(rows=>{teacherQuestions=rows;document.querySelector('#teacher-auth').hidden=true;document.querySelector('#teacher-dashboard').hidden=false;renderStudents()});
</script>`;
http.createServer((request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1');
  if (url.pathname === '/qa' || url.pathname === '/qa-teacher') {
    const teacher = url.pathname === '/qa-teacher';
    let html = fs.readFileSync(path.join(root, teacher ? 'teacher.html' : 'index.html'), 'utf8');
    html = html.replace(/(<body[^>]*>)/, '$1' + banner + networkGuard + (teacher ? '' : bootstrap));
    html = html.replace(/<script src="supabase-auth.js[^>]*><\/script>/, '');
    if (teacher) html = html.replace('</body>', teacherSeed + '</body>');
    response.setHeader('Content-Type', 'text/html'); response.end(html); return;
  }
  const target = path.resolve(root, '.' + decodeURIComponent(url.pathname));
  if (!target.startsWith(root + path.sep) || !fs.existsSync(target) || !fs.statSync(target).isFile()) { response.writeHead(404); response.end(); return; }
  response.setHeader('Content-Type', ({'.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.html':'text/html'})[path.extname(target)] || 'text/plain');
  response.end(fs.readFileSync(target));
}).listen(8766, '127.0.0.1', () => console.log('Isolated QA: http://127.0.0.1:8766/qa and /qa-teacher'));
