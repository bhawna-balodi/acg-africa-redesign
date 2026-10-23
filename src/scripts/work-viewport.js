// Keep the source list intact. On desktop its first four complete points set
// both the image height and the viewport for a native, keyboard-focusable list.
(() => {
 const area=document.querySelector('.work-narrative');
 if(!area)return;
 const list=area.querySelector('.steps__grid'),rows=[...list.children];
 const desktop=matchMedia('(min-width:1001px)');let pending=false;
 function measure(){
  pending=false;
  area.classList.toggle('work-scroll-ready',desktop.matches);
  if(!desktop.matches){list.removeAttribute('tabindex');list.removeAttribute('aria-labelledby');area.style.removeProperty('--work-visible-height');list.scrollTop=0;return;}
  list.tabIndex=0;
  list.setAttribute('aria-labelledby',area.closest('section').querySelector('h2').id);
  const height=rows[3].getBoundingClientRect().bottom-list.getBoundingClientRect().top+list.scrollTop;
  area.style.setProperty('--work-visible-height',`${Math.ceil(height/2)*2}px`);
 }
 function schedule(){if(!pending){pending=true;requestAnimationFrame(measure);}}
 measure();document.fonts?.ready.then(schedule);
 if('ResizeObserver' in window){const observer=new ResizeObserver(schedule);rows.slice(0,4).forEach(row=>observer.observe(row));}
 desktop.addEventListener('change',schedule);window.addEventListener('resize',schedule,{passive:true});
})();
