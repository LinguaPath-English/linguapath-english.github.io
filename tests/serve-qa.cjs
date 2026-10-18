// Local-only browser fixtures: synthetic student/teacher data, no Supabase requests.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const banner = '<div style="padding:8px;background:#ffe6a5;color:#28251b;text-align:center">ISOLATED QA — fictitious accounts; cloud writes disabled</div>';
const networkGuard = `<script>
const qaFetch=window.fetch.bind(window),qaAssignments=[{id:'qa-assignment',title:'Listening for Friday',skill:'Listening',target:10,created_at:new Date(Date.now()-86400000).toISOString(),due_at:new Date(Date.now()+86400000).toISOString(),archived:false}];
window.fetch=(url,...args)=>{
 if(String(url).includes('/class_assignments?'))return Promise.resolve({ok:true,json:async()=>JSON.parse(JSON.stringify(qaAssignments))});
 if(String(url).includes('/rpc/teacher_create_assignment')){const a=JSON.parse(args[0].body),id='qa-created-'+qaAssignments.length;qaAssignments.push({id,title:a.assignment_title,skill:a.assignment_skill,target:a.assignment_target,due_at:a.assignment_due,created_at:new Date().toISOString(),archived:false});return Promise.resolve({ok:true,json:async()=>id})}
 if(String(url).includes('/rpc/teacher_archive_assignment')){const a=JSON.parse(args[0].body);const item=qaAssignments.find(x=>x.id===a.assignment_id);if(item)item.archived=true;return Promise.resolve({ok:true,json:async()=>!!item})}
 return String(url).includes('supabase.co')||String(url).includes('qa.invalid')?Promise.reject(new Error('QA blocks Supabase requests')):qaFetch(url,...args);
};</script>`;
const bootstrap = `<script>
const qaStore = {getItem:k=>sessionStorage.getItem('lp-qa:'+k),setItem:(k,v)=>sessionStorage.setItem('lp-qa:'+k,v),removeItem:k=>sessionStorage.removeItem('lp-qa:'+k)};
Object.defineProperty(window,'localStorage',{value:qaStore});
if(!localStorage.getItem('linguapath-users')){
 const past=Date.now()-86400000, review={failures:2,needsCorrection:false,dueAt:past,intervalDays:3,updatedAt:past};
 localStorage.setItem('linguapath-session','qa-student');
 localStorage.setItem('linguapath-users',JSON.stringify({'qa-student':{state:{onboardingSeen:true,exercisesCompleted:10,lastActivityAt:past,correctBySkillTier:{Writing:[8,0,0],Reading:[1,0,0],Listening:[0,0,0],Speaking:[0,0,0]},learningReview:{'Writing:1:1':review,'Listening:1:1':review},profile:{name:'QA Student',goal:'Reach B2',emoji:'🌱',dark:false}}}}));
}
window.__lpCloudUser={id:'qa-student'};window.lpCloudReady=true;window.lpSaveProgress=async()=>true;
const SUPABASE_URL='https://qa.invalid';let cloudSession={access_token:'qa'};const refreshCloudSession=async()=>true,authHeaders=()=>({});
document.addEventListener('DOMContentLoaded',()=>{document.body.classList.add('authenticated');document.querySelector('#auth-screen').classList.add('hidden')});
</script>`;
const teacherSeed = `<script>
teacherSession={user:{id:'qa-teacher'},access_token:'qa',expires_at:Date.now()/1000+3600};
studentRows=[{user_id:'qa-student',email:'student@example.invalid',updated_at:new Date().toISOString(),state:{profile:{name:'QA Student'},lastActivityAt:Date.now()-9*86400000,exercisesCompleted:20,correct:12,correctBySkillTier:{Writing:[8,0,0],Reading:[4,0,0],Listening:[0,0,0],Speaking:[0,0,0]},learningReview:{'Writing:1:1':{failures:3,dueAt:Date.now()-1,needsCorrection:false}}}}];
studentRows.push({user_id:'qa-new',email:'new-student@example.invalid',created_at:new Date().toISOString(),email_confirmed_at:null,state:{}});
teacherAssignments=[{id:'qa-assignment',title:'Listening for Friday',skill:'Listening',target:10,created_at:new Date(Date.now()-86400000).toISOString(),due_at:new Date(Date.now()+86400000).toISOString(),archived:false}];
fetch('questions.json').then(r=>r.json()).then(rows=>{teacherQuestions=rows;document.querySelector('#teacher-auth').hidden=true;document.querySelector('#teacher-dashboard').hidden=false;renderStudents()});
</script>`;
const achievementSeed = `<script>
if(!localStorage.getItem('achievement-qa-seeded')){
 const all=JSON.parse(localStorage.getItem('linguapath-users')),s=all['qa-student'].state,at=Date.now()-86400000;
 const day=n=>{const d=new Date();d.setDate(d.getDate()+n);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
 s.dayKey=day(0);s.today=9;s.exercisesCompleted=349;s.correctByTier=[99,0,0];s.correctBySkillTier={Writing:[8,0,0],Reading:[99,0,0],Listening:[1,0,0],Speaking:[0,0,0]};s.achievementFacts={};
 for(let i=0;i<4;i++)for(const type of ['correction','voice','revision'])s.achievementFacts[type+':seed-'+i]=at;
 for(let i=0;i<9;i++)s.achievementFacts['recall:seed-'+i]=at;
 for(const n of [-6,-4,-2,-1])s.achievementFacts['goal:'+day(n)]=at;
 s.writingPortfolio={'Writing:1:1':{original:'I need more time for my assignment.',revision:'I need more time for my assignment.',completedAt:at,updatedAt:at}};
 s.learningReview={'Speaking:1:1':{failures:1,needsCorrection:true,lastWrongAt:at},'Listening:1:1':{failures:1,needsCorrection:false,dueAt:at,intervalDays:3,updatedAt:at}};
 s.missedBySkillTier={'Speaking:1':['Speaking:1:1']};
 s.practiceSessions={'Writing:1':{skill:'Writing',tier:1,i:0,checked:false,active:false,updatedAt:at},'Reading:1':{skill:'Reading',tier:1,i:99,checked:false,active:false,updatedAt:at}};
 localStorage.setItem('linguapath-users',JSON.stringify(all));localStorage.setItem('achievement-qa-seeded','yes');
}
</script>`;
http.createServer((request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1');
  if (url.pathname === '/qa' || url.pathname === '/qa-teacher' || url.pathname === '/qa-achievements') {
    const teacher = url.pathname === '/qa-teacher';
    let html = fs.readFileSync(path.join(root, teacher ? 'teacher.html' : 'index.html'), 'utf8');
    html = html.replace(/(<body[^>]*>)/, '$1' + banner + networkGuard + (teacher ? '' : bootstrap));
    if (url.pathname === '/qa-achievements') html = html.replace('<script src="script.js', achievementSeed + '<script src="script.js');
    html = html.replace(/<script src="supabase-auth.js[^>]*><\/script>/, '');
    if (teacher) html = html.replace('</body>', teacherSeed + '</body>');
    response.setHeader('Content-Type', 'text/html'); response.end(html); return;
  }
  const target = path.resolve(root, '.' + decodeURIComponent(url.pathname));
  if (!target.startsWith(root + path.sep) || !fs.existsSync(target) || !fs.statSync(target).isFile()) { response.writeHead(404); response.end(); return; }
  response.setHeader('Content-Type', ({'.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.html':'text/html'})[path.extname(target)] || 'text/plain');
  response.end(fs.readFileSync(target));
}).listen(8766, '127.0.0.1', () => console.log('Isolated QA: http://127.0.0.1:8766/qa and /qa-teacher'));
