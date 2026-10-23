// Progressive enhancement: all copy, diagrams and controls work without motion.
(() => {
  const root=document.documentElement;
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const animations=new Set(),revealed=new WeakSet();
  const process=document.querySelector('[data-process]');
  const steps=process?[...process.querySelectorAll('[data-process-step]')]:[];
  const processList=process?.querySelector('.steps__grid');
  const markers=process?[...process.querySelectorAll('[data-process-marker]')]:[];
  const position=process?.querySelector('[data-process-position]');
  const article=document.querySelector('.article-body');
  const reading=document.querySelector('.reading-progress>span');
  let processVisible=false,framePending=false,currentStep=-1;
  root.classList.add('has-story-interactions');
  root.classList.toggle('motion-enabled',!preference.matches);
  function play(element,frames,options={}){
    if(!element||preference.matches||typeof element.animate!=='function')return null;
    const animation=element.animate(frames,{duration:560,easing:'cubic-bezier(.2,.7,.3,1)',...options});
    animations.add(animation);
    animation.finished.then(()=>animations.delete(animation),()=>animations.delete(animation));
    return animation;
  }
  function reveal(element){
    if(revealed.has(element))return;
    revealed.add(element);
    if(preference.matches)return;
    const treatment=element.dataset.reveal;
    if(treatment==='picture'){
      play(element,[{opacity:.84},{opacity:1}],{duration:480});
    }else if(treatment==='diagram'){
      element.querySelectorAll('[data-flow-line]').forEach(line=>{
        line.style.strokeDasharray='1';
        const animation=play(line,[{strokeDashoffset:'1'},{strokeDashoffset:'0'}],{duration:760});
        animation?.finished.then(()=>line.style.removeProperty('stroke-dasharray'),()=>line.style.removeProperty('stroke-dasharray'));
      });
      element.querySelectorAll('.range-solid,.range-bound').forEach(bar=>{
        bar.style.transformOrigin='left';
        play(bar,[{transform:'scaleX(.15)'},{transform:'scaleX(1)'}],{duration:640});
      });
    }else if(treatment==='heading'){
      play(element,[{opacity:.72,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:480});
    }else if(treatment==='quotation'){
      play(element,[{opacity:.8,transform:'translateX(6px)'},{opacity:1,transform:'translateX(0)'}]);
    }else if(treatment==='value')element.classList.add('is-in-view');
    else play(element,[{opacity:.86},{opacity:1}],{duration:480});
  }
  function setStep(index){
    if(index===currentStep)return;
    currentStep=index;
    steps.forEach((step,i)=>{
      step.classList.toggle('is-current',i===index);
      if(i===index)step.setAttribute('aria-current','step');else step.removeAttribute('aria-current');
    });
    markers.forEach((marker,i)=>{
      marker.classList.toggle('is-current',i===index);
      marker.classList.toggle('is-complete',i<index);
    });
    if(position)position.textContent=String(index+1).padStart(2,'0')+' / '+String(steps.length).padStart(2,'0');
  }
  function update(){
    framePending=false;
    if(processVisible&&steps.length){
      const bounds=processList.getBoundingClientRect();
      const header=document.querySelector('.header-inner')?.getBoundingClientRect().bottom||0;
      const top=Math.max(bounds.top,header+16),bottom=Math.min(bounds.bottom,window.innerHeight);
      if(bottom>top){
        // Use the point containing the reading line, not the next point whose
        // top happens to be closer. Clip that line to the actual list viewport.
        const target=Math.max(top+1,Math.min(bottom-1,window.innerHeight*.42));
        let nearest=-1,distance=Infinity;
        steps.forEach((step,i)=>{
          const rect=step.getBoundingClientRect();
          const start=Math.max(rect.top,top),end=Math.min(rect.bottom,bottom);
          if(end<=start)return;
          const delta=target<start?start-target:target>=end?target-end+1:0;
          if(delta<distance){distance=delta;nearest=i;}
        });
        const last=steps[steps.length-1].getBoundingClientRect();
        if(process.classList.contains('work-scroll-ready')&&processList.scrollTop>0&&processList.scrollTop+processList.clientHeight>=processList.scrollHeight-2&&last.bottom>top&&last.top<bottom)nearest=steps.length-1;
        if(nearest>=0)setStep(nearest);
      }
    }
    if(reading&&article){
      const rect=article.getBoundingClientRect();
      const progress=Math.max(0,Math.min(1,(window.innerHeight*.3-rect.top)/Math.max(1,rect.height-window.innerHeight*.4)));
      reading.style.transform='scaleX('+progress.toFixed(4)+')';
    }
  }
  function schedule(){if(!framePending){framePending=true;requestAnimationFrame(update);}}
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{if(entry.isIntersecting){observer.unobserve(entry.target);reveal(entry.target);}});
    },{threshold:.12});
    document.querySelectorAll('[data-reveal]').forEach(element=>observer.observe(element));
    const visibility=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{if(entry.target===process)processVisible=entry.isIntersecting;});schedule();
    },{rootMargin:'80px 0px'});
    if(process)visibility.observe(process);
  }else if(process)processVisible=true;
  const started=performance.now();
  (document.fonts?.ready||Promise.resolve()).then(()=>{
    if(window.scrollY>32||performance.now()-started>1500)return;
    const lines=document.querySelectorAll('.headline-line');
    if(lines.length)lines.forEach((line,i)=>play(line,[{opacity:.65,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:480,delay:i*50}));
    else play(document.querySelector('h1'),[{opacity:.72,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:480});
  });
  document.querySelectorAll('.biography-more').forEach(details=>details.addEventListener('toggle',()=>{if(details.open)play(details.querySelector('.biography-history'),[{opacity:.8},{opacity:1}],{duration:200});}));
  preference.addEventListener('change',()=>{
    root.classList.toggle('motion-enabled',!preference.matches);
    if(preference.matches){
      for(const animation of [...animations])animation.cancel();
    }
    schedule();
  });
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  processList?.addEventListener('scroll',schedule,{passive:true});
  if(processList&&'ResizeObserver' in window)new ResizeObserver(schedule).observe(processList);
  if(steps.length)setStep(0);
  schedule();
})();

