import fs from 'node:fs';
import assert from 'node:assert/strict';
fs.mkdirSync('.qa',{recursive:true});
const tabs=await(await fetch('http://127.0.0.1:9222/json/list')).json();
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let seq=0;const pending=new Map(),errors=[];ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(m.error):p?.resolve(m.result);}});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;};
const pause=()=>new Promise(r=>setTimeout(r,650));
await call('Page.enable');await call('Runtime.enable');

await call('Page.bringToFront');
for(const width of [1440,768,390,320]){
 await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
 await call('Page.navigate',{url:'http://127.0.0.1:4173/'});await pause();
 await evaluate('(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>{i.loading="eager";return i.decode().catch(()=>{});}));})()');
 await evaluate('document.querySelector(".failure-panel").scrollIntoView({block:"center"})');await pause();
 const states=[];
 for(let i=0;i<4;i++){
  states.push(await evaluate(`(()=>{const t=document.querySelector('#failure-track'),im=document.querySelector('.challenge-image img'),r=t.getBoundingClientRect();return {height:r.height,top:r.top+scrollY,crop:getComputedStyle(im).objectPosition,current:[...t.children].findIndex(e=>e.classList.contains('is-active')),visible:[...t.children].filter(e=>getComputedStyle(e).visibility==='visible').length,scroll:t.scrollWidth-t.clientWidth}})()`));
  if(i<3)await evaluate('document.querySelector(".sequence-next").click()');
 }
 assert(states.every((s,i)=>s.height===states[0].height&&s.top===states[0].top&&s.crop===states[0].crop&&s.current===i&&s.visible===1&&s.scroll===0),JSON.stringify(states));
 const before=await evaluate('scrollY');
 const point=await evaluate('(()=>{const r=document.querySelector("#failure-track").getBoundingClientRect();return {x:r.left+r.width/2,y:Math.max(150,Math.min(innerHeight-80,r.top+40))}})()');
 await call('Input.dispatchMouseEvent',{type:'mouseWheel',...point,deltaX:0,deltaY:240});await pause();
 assert((await evaluate('scrollY'))>before,'Wheel must scroll the document over the sequence');
 await evaluate('document.querySelector(".failure-panel").scrollIntoView({block:"center"})');await pause();
 const shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync('.qa/stable-challenge-'+width+'.png',Buffer.from(shot.data,'base64'));
 console.log('PASS stable sequence, fixed image crop and natural wheel scrolling at '+width);
}
assert.equal(errors.length,0);ws.close();
