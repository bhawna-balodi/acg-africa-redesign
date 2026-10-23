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
for(const width of [1440,1024,1000,768,390,320]){
 await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
 await call('Page.navigate',{url:'http://127.0.0.1:4173/who-we-are/'});await pause();
 await evaluate('(async()=>{await document.fonts.ready;})()');
 const state=await evaluate(`(()=>{const map=document.querySelector('.collaboration-map'),stats=[...document.querySelectorAll('.backing-proof>div')];return {overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,labels:[...map.querySelectorAll('li')].map(e=>({text:e.textContent,visible:e.getBoundingClientRect().height>0})),stats:stats.map(e=>{const n=e.querySelector('strong').getBoundingClientRect(),l=e.querySelector('span').getBoundingClientRect();return {numberTop:n.top,labelTop:l.top,numberBottom:n.bottom,left:n.left,labelLeft:l.left};})};})()`);
 assert(!state.overflow,JSON.stringify({width,...state}));assert.equal(state.labels.length,6);assert(state.labels.every(l=>l.visible));
 for(const stat of state.stats){assert(stat.numberBottom<=stat.labelTop);assert(Math.abs(stat.left-stat.labelLeft)<1);}
 for(const cls of ['collaboration-map','backing-feature']){
  if(![1440,390].includes(width))continue;
  const clip=await evaluate(`(()=>{const e=document.querySelector('.${cls}');e.scrollIntoView({block:'start'});const r=e.getBoundingClientRect();return {x:r.x,y:r.y+scrollY,width:r.width,height:r.height,scale:1};})()`);
  const shot=await call('Page.captureScreenshot',{format:'png',clip,captureBeyondViewport:true});fs.writeFileSync('.qa/'+cls+'-'+width+'.png',Buffer.from(shot.data,'base64'));
 }
 report.push({width,...state});console.log('PASS: consortium content, containment and number-first statistics at '+width+'px');
}
await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
await call('Page.navigate',{url:'http://127.0.0.1:4173/who-we-are/'});await pause();
const point=await evaluate(`(()=>{const e=document.querySelector('.collaboration-map li');e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,bg:getComputedStyle(e).backgroundColor};})()`);
await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:point.x,y:point.y});await pause();
assert.notEqual(await evaluate(`getComputedStyle(document.querySelector('.collaboration-map li')).backgroundColor`),point.bg);
await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await pause();
assert.equal(await evaluate(`getComputedStyle(document.querySelector('.collaboration-map li')).transitionDuration`),'0s');
await call('Emulation.setEmulatedMedia',{features:[]});
assert.equal(errors.length,0,errors.join('\n'));fs.writeFileSync('.qa/consortium-results.json',JSON.stringify({report,hover:true,reducedMotion:true},null,2));ws.close();
