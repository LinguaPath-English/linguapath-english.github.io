const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const events={},classes=new Set(),style={},media={matches:true,addEventListener:(name,fn)=>events.media=fn};
const cursor={setAttribute(){},style:{setProperty:(key,value)=>style[key]=value}};
const document={hidden:false,createElement:()=>cursor,body:{append(){},classList:{add:key=>classes.add(key),remove:key=>classes.delete(key)}},addEventListener:(name,fn)=>events[name]=fn};
vm.runInNewContext(fs.readFileSync(__dirname+'/../cursor-glass.js','utf8'),{document,matchMedia:()=>media,window:{addEventListener:(name,fn)=>events[name]=fn}});
const move=(native=false,type='mouse')=>events.pointermove({target:{closest:()=>native},pointerType:type,clientX:320,clientY:240});
const active=()=>classes.has('glass-cursor-active');
move();assert(active());assert.equal(style['--cursor-x'],'320px');assert.equal(style['--cursor-y'],'240px');
move(true);assert(!active()); // Native input / hand / dialog cursor.
move();events.pointerdown();move();assert(!active());events.pointerup();move();assert(active());
events.blur();assert(!active());move(false,'touch');assert(!active());
media.matches=false;move();assert(!active());media.matches=true;move();events.media();assert(!active());
move();events.pointerout({relatedTarget:null});assert(!active());
move();document.hidden=true;events.visibilitychange();assert(!active());
const css=fs.readFileSync(__dirname+'/../cursor-glass.css','utf8');assert.match(css,/pointer-events:none/);assert.match(css,/forced-colors:active/);assert.match(css,/width:16px;height:21.33px/);
assert.match(cursor.innerHTML,/lp-cursor-bloom/);
console.log('Glass cursor: tracking, native controls, drag selection, touch, media, blur and visibility passed.');
