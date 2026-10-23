import fs from 'node:fs';
import assert from 'node:assert/strict';
fs.mkdirSync('.qa',{recursive:true});
const tabs=await(await fetch('http://127.0.0.1:9222/json/list')).json();
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let seq=0;const pending=new Map(),errors=[];ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(m.error):p?.resolve(m.result);}});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;};
const pause=()=>new Promise(r=>setTimeout(r,650));
await call('Runtime.discardConsoleEntries');await call('Page.enable');await call('Runtime.enable');

const report=[];
for(const width of [1440,1024,768,390]){
 await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
 await call('Page.navigate',{url:'http://127.0.0.1:4173/what-we-do/'});await pause();
 await evaluate('(async()=>{await document.fonts.ready;})()');
 for(let i=0;i<6;i++){
  await evaluate(`(()=>{const list=document.querySelector('.steps__grid'),row=list.children[${i}];list.scrollTop=${width}>1000?(${i}<4?0:${i}===5?list.scrollHeight:(list.scrollHeight-list.clientHeight)/2):0;window.scrollTo(0,scrollY+row.getBoundingClientRect().bottom-8-innerHeight*.42);})()`);await pause();
  const s=await evaluate(`(()=>{const list=document.querySelector('.steps__grid'),rows=[...list.children],active=rows.findIndex(e=>e.classList.contains('is-current')),box=list.getBoundingClientRect(),r=rows[active].getBoundingClientRect(),c=getComputedStyle(rows[active]);return {active,count:rows.filter(e=>e.classList.contains('is-current')).length,visible:r.bottom>Math.max(box.top,0)&&r.top<Math.min(box.bottom,innerHeight),background:c.backgroundColor,image:c.backgroundImage,borders:rows.map(e=>getComputedStyle(e).borderTopColor),position:document.querySelector('[data-process-position]').textContent};})()`);
  assert.equal(s.active,i,JSON.stringify({width,i,...s}));assert.equal(s.count,1);assert(s.visible);assert.equal(s.image,'none');assert.equal(s.background,'rgba(30, 72, 68, 0.035)');assert(s.borders.every(b=>b==='rgba(30, 72, 68, 0.1)'));
  report.push({width,i,...s});
 }
 console.log('PASS correct row through its lower edge, one uniform fill and light separators at '+width+'px');
}
await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await pause();assert.equal(await evaluate(`getComputedStyle(document.querySelector('.steps__card')).transitionDuration`),'0s');await call('Emulation.setEmulatedMedia',{features:[]});
assert.equal(errors.length,0,errors.join('\n'));fs.writeFileSync('.qa/work-active-results.json',JSON.stringify(report,null,2));ws.close();
