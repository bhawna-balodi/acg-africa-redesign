import fs from 'node:fs';
import assert from 'node:assert/strict';
fs.mkdirSync('.qa',{recursive:true});
const tabs=await(await fetch('http://127.0.0.1:9222/json/list')).json();
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let seq=0;const pending=new Map(),errors=[];ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(m.error):p?.resolve(m.result);}});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;};
const pause=()=>new Promise(r=>setTimeout(r,650));
await call('Page.enable');await call('Runtime.enable');

const requested=process.argv.slice(2).map(p=>p==="home"?"":p);
const pages=JSON.parse(fs.readFileSync('src/content/pages.json')).filter(p=>!requested.length||requested.includes(p.slug));
const report=[];
await call('Page.addScriptToEvaluateOnNewDocument',{source:"window.__shifts=[];new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__shifts.push({value:e.value,sources:e.sources.map(s=>({node:s.node?.className,previous:s.previousRect.toJSON(),current:s.currentRect.toJSON()}))})}).observe({type:'layout-shift',buffered:true})"});
for(const width of [1440,768,390,320]){
 await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
 for(const page of pages){
  await call('Page.navigate',{url:'http://127.0.0.1:4173/'+(page.slug?page.slug+'/':'')});
  await new Promise(r=>setTimeout(r,100));
  await evaluate('(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>{i.loading="eager";return i.decode().catch(()=>{});}));})()');
  await new Promise(r=>setTimeout(r,160));
  const state=await evaluate(`(()=>{
   const label=e=>e.tagName+'.'+e.className;
   const all=[...document.querySelectorAll('main *,footer *')];
   // Only the approved desktop process viewport may scroll internally. A
   // missing keyboard target, broken label or horizontal overflow still fails.
   const intentional=all.filter(e=>e.matches('.work-process .work-scroll-ready > .steps__grid')&&innerWidth>=1001&&e.tabIndex===0&&document.getElementById(e.getAttribute('aria-labelledby'))&&e.scrollWidth<=e.clientWidth+2);
   const nested=all.filter(e=>{const s=getComputedStyle(e);return /auto|scroll/.test(s.overflowY+s.overflowX)&&(e.scrollHeight>e.clientHeight+2||e.scrollWidth>e.clientWidth+2)&&!intentional.includes(e)}).map(label);
   const sticky=all.filter(e=>getComputedStyle(e).position==='sticky').map(label);
   const clipped=[...document.querySelectorAll('.story-picture img')].filter(i=>{const f=i.closest('.story-picture'),r=i.getBoundingClientRect(),b=f.getBoundingClientRect();return r.width&&b.width&&(r.left<b.left-2||r.right>b.right+2||r.top<b.top-2||r.bottom>b.bottom+2)}).map(i=>({src:i.getAttribute('src'),parent:label(i.closest('.story-picture'))}));
   window.__imagePositions=[...document.querySelectorAll('main img')].map(i=>({y:i.getBoundingClientRect().top+scrollY,x:i.getBoundingClientRect().left,width:i.getBoundingClientRect().width,height:i.getBoundingClientRect().height}));
   return {overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,nested,sticky,clipped,broken:[...document.images].filter(i=>!i.naturalWidth).length,shifts:window.__shifts};
  })()`);
  await evaluate('window.scrollTo(0,document.documentElement.scrollHeight*.45)');await new Promise(r=>setTimeout(r,200));
  const movement=await evaluate(`[...document.querySelectorAll('main img')].map((i,n)=>{const b=i.getBoundingClientRect(),a=window.__imagePositions[n];return (a.width&&a.height||b.width&&b.height)&&(Math.abs(b.top+scrollY-a.y)>1||Math.abs(b.left-a.x)>1||Math.abs(b.width-a.width)>1||Math.abs(b.height-a.height)>1)?i.getAttribute('src'):null}).filter(Boolean)`);
  report.push({slug:page.slug,width,...state,movement});
 }
 console.log('Audited '+pages.length+' routes at '+width+'px');
}
fs.writeFileSync(requested.length?'.qa/scroll-stability-followup.json':'.qa/scroll-stability-results.json',JSON.stringify({report,errors},null,2));
const failures=report.filter(r=>r.broken||r.overflow||r.nested.length||r.sticky.length||r.clipped.length||r.movement.length);
console.log(JSON.stringify({checks:report.length,failures,errors},null,2));ws.close();
assert.equal(failures.length,0);assert.equal(errors.length,0);
