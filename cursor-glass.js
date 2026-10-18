(()=>{
  const cursor=document.createElement('div');
  cursor.className='glass-cursor';cursor.setAttribute('aria-hidden','true');
  cursor.innerHTML=`<svg viewBox="0 0 21 28"><defs><linearGradient id="lp-cursor-rim" x1="0" y1="0" x2="1" y2="1"><stop stop-color="var(--rim-a)"/><stop offset=".45" stop-color="#e8f5f9"/><stop offset="1" stop-color="var(--rim-b)"/></linearGradient><linearGradient id="lp-cursor-glass" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="var(--glass-top)"/><stop offset=".5" stop-color="#e6f1f533"/><stop offset="1" stop-color="var(--glass-bottom)"/></linearGradient><filter id="lp-cursor-bloom" x="-60%" y="-40%" width="220%" height="180%"><feGaussianBlur stdDeviation="1.2"/></filter><path id="lp-cursor-outline" d="M0 0V20.2Q0 21.3.8 20.6L5.6 16.5 9.8 25.2Q10 25.8 10.7 25.5L13 24.4Q13.6 24.1 13.3 23.5L9.2 14.9H17.1Q18.4 14.9 17.4 13.9Z"/></defs><use href="#lp-cursor-outline" class="edge-light" fill="none"/><use href="#lp-cursor-outline" fill="url(#lp-cursor-glass)" stroke="url(#lp-cursor-rim)" stroke-width="1" stroke-linejoin="round"/><path d="M1.7 5V16.8" fill="none" stroke="#fff" stroke-width=".6" stroke-linecap="round" opacity=".5"/></svg>`;
  document.body.append(cursor);
  const enabled=matchMedia('(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference) and (forced-colors:none)');
  const hide=()=>document.body.classList.remove('glass-cursor-active');
  let dragging=false;
  window.addEventListener('pointermove',event=>{
    // Keep native hands, text cursors, selection, and top-layer dialog pointers.
    if(!enabled.matches||event.pointerType==='touch'||dragging||event.target.closest('a,button,input,textarea,select,label,[contenteditable]:not([contenteditable="false"]),[role="button"],dialog')){hide();return}
    cursor.style.setProperty('--cursor-x',event.clientX+'px');cursor.style.setProperty('--cursor-y',event.clientY+'px');
    document.body.classList.add('glass-cursor-active');
  },{passive:true});
  window.addEventListener('pointerout',event=>{if(!event.relatedTarget)hide()},{passive:true});
  window.addEventListener('pointerdown',()=>{dragging=true;hide()},{passive:true});
  window.addEventListener('pointerup',()=>{dragging=false},{passive:true});
  window.addEventListener('pointercancel',()=>{dragging=false;hide()},{passive:true});
  window.addEventListener('blur',()=>{dragging=false;hide()});
  enabled.addEventListener('change',hide);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){dragging=false;hide()}});
})();
