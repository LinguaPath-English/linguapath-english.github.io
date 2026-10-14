(()=>{
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  if(!ctx)return;
  canvas.className='ambient-canvas';canvas.setAttribute('aria-hidden','true');document.body.prepend(canvas);
  const motion=matchMedia('(prefers-reduced-motion: reduce)'),mouse={x:0,y:0,active:false,lastMove:0};let reduced=motion.matches,dots=[],width=0,height=0,dpr=1,frame=0,last=0;
  function resize(){
    width=innerWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
    const count=Math.min(150,Math.max(55,Math.round(width*height/10000))),cols=Math.ceil(Math.sqrt(count*width/height)),rows=Math.ceil(count/cols),cellW=width/cols,cellH=height/rows;
    dots=Array.from({length:count},(_,i)=>{const x=i%cols,y=Math.floor(i/cols),homeX=(x+.12+Math.random()*.76)*cellW,homeY=(y+.12+Math.random()*.76)*cellH;return{x:homeX,y:homeY,homeX,homeY,r:.8+Math.random()*1.6,a:.2+Math.random()*.32,vx:0,vy:0}});
    draw();
  }
  function draw(){
    ctx.clearRect(0,0,width,height);const color=document.body.classList.contains('dark')?'183,244,208':'31,119,82';
    dots.forEach(dot=>{
      if(mouse.active&&!reduced&&performance.now()-mouse.lastMove<120){const dx=dot.x-mouse.x,dy=dot.y-mouse.y,d=Math.hypot(dx,dy);if(d<130&&d>0){const push=(130-d)/130*.16;dot.vx+=dx/d*push;dot.vy+=dy/d*push}}
      dot.vx+=(dot.homeX-dot.x)*.0004;dot.vy+=(dot.homeY-dot.y)*.0004;
      dot.vx*=.94;dot.vy*=.94;dot.x+=dot.vx;dot.y+=dot.vy;
      ctx.beginPath();ctx.fillStyle='rgba('+color+','+dot.a+')';ctx.arc(dot.x,dot.y,dot.r,0,Math.PI*2);ctx.fill();
    });
  }
  resize();window.addEventListener('resize',resize,{passive:true});
  if(matchMedia('(pointer:fine)').matches){
    window.addEventListener('pointermove',event=>{if(reduced||event.pointerType==='touch')return;mouse.x=event.clientX;mouse.y=event.clientY;mouse.lastMove=performance.now();mouse.active=true;document.body.style.setProperty('--pointer-x',mouse.x+'px');document.body.style.setProperty('--pointer-y',mouse.y+'px');document.body.classList.add('pointer-active')},{passive:true});
    window.addEventListener('pointerout',event=>{if(!event.relatedTarget){mouse.active=false;document.body.classList.remove('pointer-active')}},{passive:true});
  }
  function animate(time){if(time-last>32){draw();last=time}frame=requestAnimationFrame(animate)}
  function updateAnimation(){cancelAnimationFrame(frame);if(!reduced&&!document.hidden)frame=requestAnimationFrame(animate);else draw()}
  motion.addEventListener('change',event=>{reduced=event.matches;mouse.active=false;document.body.classList.remove('pointer-active');dots.forEach(dot=>{dot.x=dot.homeX;dot.y=dot.homeY;dot.vx=dot.vy=0});updateAnimation()});
  document.addEventListener('visibilitychange',updateAnimation);
  new MutationObserver(()=>{if(reduced)draw()}).observe(document.body,{attributes:true,attributeFilter:['class']});
  updateAnimation();
})();
