import fs from 'node:fs';
import assert from 'node:assert/strict';
fs.mkdirSync('.qa',{recursive:true});
const tabs=await(await fetch('http://127.0.0.1:9222/json/list')).json();
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let seq=0;const pending=new Map(),errors=[];ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(m.error):p?.resolve(m.result);}});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;};
const pause=()=>new Promise(r=>setTimeout(r,650));
await call('Page.enable');await call('Runtime.enable');await call('Page.bringToFront');

const pages=JSON.parse(fs.readFileSync('src/content/pages.json'));
const routes=['','who-we-are','what-we-do','victory-district','our-team','acg-news','contact-us','our-team/carlos-carrion',pages.find(p=>p.slug.length>100).slug];
const report=[];
for(const width of [320,1024]){
 await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
 for(const slug of routes){
  await call('Page.navigate',{url:'http://127.0.0.1:4173/'+(slug?slug+'/':'')});await pause();
  await evaluate('(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>{i.loading="eager";return i.decode().catch(()=>{});}));})()');
  const metrics=await evaluate('({overflow:document.documentElement.scrollWidth>innerWidth,small:[...document.querySelectorAll("main p")].filter(p=>p.textContent.trim()&&p.getBoundingClientRect().height>0&&!p.closest(".eyebrow")&&parseFloat(getComputedStyle(p).fontSize)<16).map(p=>p.textContent.slice(0,60)),badActions:[...document.querySelectorAll(".cta")].filter(a=>a.getBoundingClientRect().height>0&&a.getBoundingClientRect().height<44).map(a=>a.textContent),role:getComputedStyle(document.querySelector("h1")).fontFamily})');
  assert(!metrics.overflow,slug+' overflow');assert.deepEqual(metrics.small,[],slug+' small copy');assert.deepEqual(metrics.badActions,[],slug+' action target');assert(metrics.role.includes('Manrope'));
  if(slug==='our-team'){
   assert.equal(await evaluate('document.querySelectorAll(".biography-more").length'),2);
   await evaluate('document.querySelector(".biography-more summary").focus()');
   assert(await evaluate('document.activeElement.matches(".biography-more summary")'));
   await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',windowsVirtualKeyCode:13});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await pause();
   assert(await evaluate('document.querySelector(".biography-more").open'));
   assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
   await evaluate('document.querySelectorAll(".biography-more").forEach(d=>d.open=true)');
   assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
  }
  if(!slug){assert(await evaluate('getComputedStyle(document.querySelector(".mission-section p.eyebrow")).color!==getComputedStyle(document.querySelector(".mission-section")).backgroundColor'));}
  report.push({slug,width,...metrics});
 }
 console.log('PASS hierarchy, readable copy, touch targets and expanded biographies at '+width+'px');
}
await call('Emulation.setScriptExecutionDisabled',{value:true});await call('Page.navigate',{url:'http://127.0.0.1:4173/our-team/'});await pause();
assert(await evaluate('getComputedStyle(document.querySelector("#navigation")).display!=="none"'));
await evaluate('document.querySelector(".biography-more summary").click()');assert(await evaluate('document.querySelector(".biography-more").open'));
assert(await evaluate('document.querySelector(".biography-history").textContent.length>500'));
await call('Emulation.setScriptExecutionDisabled',{value:false});
assert.equal(errors.length,0,errors.join('\n'));
fs.writeFileSync('.qa/context-results.json',JSON.stringify({report,nojsBiography:'passed',errors},null,2));ws.close();
