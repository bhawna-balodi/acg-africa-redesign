import fs from 'node:fs';
import assert from 'node:assert/strict';
fs.mkdirSync('.qa',{recursive:true});
const tabs=await(await fetch('http://127.0.0.1:9222/json/list')).json();
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let seq=0;const pending=new Map(),errors=[];ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(m.error):p?.resolve(m.result);}});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;};
const pause=()=>new Promise(r=>setTimeout(r,650));
async function waitUntil(expression){const start=Date.now();while(Date.now()-start<3000){if(await evaluate(expression))return true;await new Promise(r=>setTimeout(r,50));}return false;}
await call('Page.enable');await call('Runtime.enable');

await call('Page.bringToFront');
await call('Emulation.setEmulatedMedia',{features:[]});
await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
const pages=JSON.parse(fs.readFileSync('src/content/pages.json'));
const articleSlug=pages.find(p=>p.slug.length>100).slug;
async function visit(slug){await call('Page.navigate',{url:'http://127.0.0.1:4173/'+(slug?slug+'/':'')});await pause();await evaluate('(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>{i.loading="eager";return i.decode().catch(()=>{});}));})()');await pause();}
await visit('what-we-do');
const states=[];
for(let i=0;i<6;i++){
 await evaluate('(()=>{const step='+i+';const list=document.querySelector(".steps__grid");list.scrollTop=step<4?0:step===5?list.scrollHeight:Math.max(0,list.scrollHeight-list.clientHeight-16);const e=list.children[step];window.scrollTo(0,scrollY+e.getBoundingClientRect().top-innerHeight*.42)})()');await pause();
 const state=await evaluate('({current:document.querySelector("[aria-current=step]")?.dataset.processStep,position:document.querySelector("[data-process-position]").textContent,complete:document.querySelectorAll(".process-track .is-complete").length})');
 assert.equal(state.current,String(i));assert.equal(state.position,String(i+1).padStart(2,'0')+' / 06');assert.equal(state.complete,i);states.push(state);
}
await evaluate('document.querySelector(".work-narrative").scrollIntoView({block:"start"})');await pause();
let shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync('.qa/process-active.png',Buffer.from(shot.data,'base64'));
const glass=await evaluate('[...document.querySelectorAll(".glass-panel")].map(e=>({background:getComputedStyle(e).backgroundColor,blur:getComputedStyle(e).backdropFilter}))');
assert(glass.some(g=>g.blur.includes('blur')),'Supported browsers should render controlled glass');
await visit(articleSlug);
const scale=()=>evaluate('Number(getComputedStyle(document.querySelector(".reading-progress>span")).transform.split(",")[0].replace("matrix(",""))');
const start=await scale();
await evaluate('(()=>{const e=document.querySelector(".article-body");window.scrollTo(0,scrollY+e.getBoundingClientRect().top+e.offsetHeight*.5-innerHeight*.3)})()');await pause();const middle=await scale();
await evaluate('window.scrollTo(0,document.documentElement.scrollHeight)');await pause();const end=await scale();
assert(start<.05);assert(middle>.3&&middle<.8);assert(end>.95);
await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'},{name:'prefers-reduced-transparency',value:'reduce'}]});
await visit('what-we-do');
assert(await evaluate('!document.documentElement.classList.contains("motion-enabled") && document.getAnimations().length===0'));
const opaque=await evaluate('[...document.querySelectorAll(".glass-panel")].every(e=>{const s=getComputedStyle(e);return s.backdropFilter==="none" && s.backgroundColor==="rgb(250, 249, 245)"})');assert(opaque);
await evaluate('document.querySelectorAll("[data-process-step]")[5].scrollIntoView({block:"center"})');await pause();
assert.equal(await evaluate('document.querySelector("[data-process-position]").textContent'),'06 / 06');
await call('Emulation.setEmulatedMedia',{features:[]});
await visit('');
await evaluate('document.querySelector(".why-section").scrollIntoView()');
await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await pause();
assert(await waitUntil('document.getAnimations().length===0 && !document.documentElement.classList.contains("motion-enabled")'),JSON.stringify(await evaluate('({reduced:matchMedia("(prefers-reduced-motion: reduce)").matches,classes:document.documentElement.className,animations:document.getAnimations().map(a=>({state:a.playState,target:a.effect?.target?.className}))})')));
await call('Emulation.setEmulatedMedia',{features:[]});
await call('Emulation.setScriptExecutionDisabled',{value:true});
for(const slug of ['','who-we-are','what-we-do','victory-district']){
 await call('Page.navigate',{url:'http://127.0.0.1:4173/'+(slug?slug+'/':'')});await pause();
 assert(await evaluate('!document.documentElement.classList.contains("motion-enabled") && [...document.querySelectorAll("[data-reveal]")].every(e=>getComputedStyle(e).opacity!=="0")'));
 assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
 if(slug==='what-we-do')assert(await evaluate('getComputedStyle(document.querySelector(".process-status")).display==="none"'));
}
await call('Emulation.setScriptExecutionDisabled',{value:false});
assert.equal(errors.length,0,errors.join('\n'));
fs.writeFileSync('.qa/storytelling-results.json',JSON.stringify({states,reading:{start,middle,end},glass,reducedMotion:'passed',reducedTransparency:'passed',nojs:'passed',errors},null,2));
console.log(JSON.stringify({process:'all six states passed',reading:{start,middle,end},reducedMotion:'passed',reducedTransparency:'passed',nojs:'passed',errors}));ws.close();
