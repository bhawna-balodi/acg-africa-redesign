import fs from 'node:fs';
import assert from 'node:assert/strict';
fs.mkdirSync('.qa',{recursive:true});
const tabs=await(await fetch('http://127.0.0.1:9222/json/list')).json();
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let seq=0;const pending=new Map(),errors=[];ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(m.error):p?.resolve(m.result);}});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;};
const pause=()=>new Promise(r=>setTimeout(r,650));
await call('Runtime.discardConsoleEntries');await call('Page.enable');await call('Runtime.enable');

const report=[];let stageMasks;
for(const width of [1440,1024,768,390,320]){
 await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
 await call('Page.navigate',{url:'http://127.0.0.1:4173/who-we-are/'});await pause();
 await evaluate('(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>{i.loading="eager";return i.decode().catch(()=>{});}));})()');
 const state=await evaluate(`(()=>{const nodes=[...document.querySelectorAll('.accountability-rail li')];return {overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,stages:nodes.map(e=>{const r=e.getBoundingClientRect(),c=getComputedStyle(e,'::before');return {label:e.textContent.trim(),left:r.left,top:r.top,icon:c.backgroundImage,width:c.width,height:c.height};}),responsibilities:document.querySelectorAll('.acgx-list>li').length};})()`);
 assert(!state.overflow,JSON.stringify({width,...state}));assert.deepEqual(state.stages.map(s=>s.label),['Concept','Feasibility','Bankability','Delivery','Operations']);assert.equal(state.responsibilities,4);
 for(const [i,s] of state.stages.entries()){
  assert(s.icon.startsWith('url('));assert.equal(s.width,'40px');assert.equal(s.height,'40px');
  if(i)assert(width>700?s.left>state.stages[i-1].left:s.top>state.stages[i-1].top);
 }
 if(width===1440)stageMasks=state.stages.map(s=>s.icon);
 if([1440,390].includes(width)){
  await evaluate(`document.querySelector('.comparison-section').scrollIntoView({block:'start',behavior:'instant'})`);await pause();
  const clip=await evaluate(`(()=>{const r=document.querySelector('.comparison-section').getBoundingClientRect();return{x:r.x,y:r.y+scrollY,width:r.width,height:r.height,scale:1};})()`);
  const shot=await call('Page.captureScreenshot',{format:'png',clip,captureBeyondViewport:true});fs.writeFileSync('.qa/platform-'+width+'.png',Buffer.from(shot.data,'base64'));
 }
 report.push({width,...state});console.log('PASS connected five-stage diagram and icon containment at '+width+'px');
}
await call('Page.navigate',{url:'http://127.0.0.1:4173/what-we-do/'});await pause();
assert.deepEqual(await evaluate(`[...document.querySelectorAll('.gate-process .gates__step')].map(e=>getComputedStyle(e,'::before').backgroundImage)`),stageMasks,'Equivalent stage roles must use identical icons across pages');
assert.equal(errors.length,0,errors.join('\n'));fs.writeFileSync('.qa/platform-results.json',JSON.stringify(report,null,2));ws.close();
