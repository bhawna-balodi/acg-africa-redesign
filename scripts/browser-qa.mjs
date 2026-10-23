import fs from 'node:fs';
import assert from 'node:assert/strict';
fs.mkdirSync('.qa',{recursive:true});
const tabs=await(await fetch('http://127.0.0.1:9222/json/list')).json();
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let seq=0;const pending=new Map(),errors=[];ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(m.error):p?.resolve(m.result);}});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;};
const pause=()=>new Promise(r=>setTimeout(r,650));
await call('Page.enable');await call('Runtime.enable');
const report=[];
for(const [width,height] of [[1440,1000],[1024,900],[768,1024],[390,844],[320,740]]){
 await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
 await call('Page.navigate',{url:'http://127.0.0.1:4173/'});await pause();
 await evaluate(`(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(img=>{img.loading='eager';return img.decode().catch(()=>{});}));})()`);await pause();
 const layout=await evaluate(`({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,broken:[...document.images].filter(i=>!i.naturalWidth).length,sections:document.querySelectorAll('main>section').length})`);
 assert(layout.scrollWidth<=width,JSON.stringify(layout));assert.equal(layout.broken,0);assert.equal(layout.sections,4);
 if(width<=1000){
  assert(await evaluate(`getComputedStyle(document.querySelector('#navigation')).display==='none'`));
  await evaluate(`document.querySelector('.menu-toggle').click()`);
  assert(await evaluate(`document.querySelector('.menu-toggle').getAttribute('aria-expanded')==='true' && document.querySelector('#navigation').getBoundingClientRect().right<=innerWidth`));
  await evaluate(`document.querySelector('#team-menu').open=true`);
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape'});
  assert(await evaluate(`!document.querySelector('#team-menu').open && document.activeElement.matches('#team-menu summary')`));
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape'});
  assert(await evaluate(`document.querySelector('.menu-toggle').getAttribute('aria-expanded')==='false' && document.activeElement.matches('.menu-toggle')`));
 }
 const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync('.qa/viewport-'+width+'.png',Buffer.from(shot.data,'base64'));
 report.push({...layout,height,menu:width<=1000?'passed':'desktop'});
}
await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await call('Page.navigate',{url:'http://127.0.0.1:4173/'});await pause();
assert(await evaluate('!document.querySelector(".hero-context details") && document.querySelectorAll(".hero-principles li").length===3'));
const seen=[],seenImages=[];
await evaluate('document.querySelector(".failure-panel").scrollIntoView({block:"center"})');await pause();
for(let i=0;i<4;i++){
 const active=await evaluate('[...document.querySelectorAll(".failure-list > div > div")].findIndex(r=>r.classList.contains("is-active"))');
 assert.equal(active,i);seen.push(i);
 const image=await evaluate(`(async()=>{const image=document.querySelector('.challenge-image > img');await image.decode();const row=document.querySelector('#failure-track').children[${i}];return {src:image.getAttribute('src'),expected:row.dataset.imageSrc,alt:image.alt,expectedAlt:row.dataset.imageAlt};})()`);
 assert.equal(image.src,image.expected);assert.equal(image.alt,image.expectedAlt);seenImages.push(image.src);
 assert.equal(await evaluate('document.querySelector(".sequence-prev").disabled'),i===0);
 assert.equal(await evaluate('document.querySelector(".sequence-next").disabled'),i===3);
 if(i<3){await evaluate('document.querySelector(".sequence-next").click()');await pause();}
}
assert.equal(new Set(seenImages).size,4,'Each challenge point needs a distinct photograph');
await evaluate('document.querySelector("#failure-track").focus()');
for(const [key,expected] of [['Home',0],['ArrowRight',1],['ArrowLeft',0],['End',3]]){
 await call('Input.dispatchKeyEvent',{type:'keyDown',key,code:key});await call('Input.dispatchKeyEvent',{type:'keyUp',key,code:key});await pause();
 assert.equal(await evaluate('[...document.querySelectorAll(".failure-list > div > div")].findIndex(r=>r.classList.contains("is-active"))'),expected);
}
assert(await evaluate('document.querySelector(".challenge-explanation") && !document.querySelector(".challenge-context summary")'));
await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await pause();
await evaluate('document.querySelector(".sequence-prev").click()');await pause();
assert.equal(await evaluate('[...document.querySelectorAll(".failure-list > div > div")].findIndex(r=>r.classList.contains("is-active"))'),2);
assert(await evaluate('document.getAnimations().length===0'));
await call('Emulation.setEmulatedMedia',{features:[]});
await call('Emulation.setScriptExecutionDisabled',{value:true});await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});await call('Page.navigate',{url:'http://127.0.0.1:4173/'});await pause();
const nojs=await evaluate(`({js:document.documentElement.classList.contains('js'),nav:getComputedStyle(document.querySelector('#navigation')).display,overflow:document.documentElement.scrollWidth>innerWidth})`);
assert.equal(nojs.js,false);assert.notEqual(nojs.nav,'none');assert.equal(nojs.overflow,false);
assert(await evaluate('!document.querySelector(".sequence-ready") && getComputedStyle(document.querySelector("#failure-track")).display==="grid"')); 
await call('Emulation.setScriptExecutionDisabled',{value:false});
assert.equal(errors.length,0,errors.join('\n'));
fs.writeFileSync('.qa/results.json',JSON.stringify({report,activeSequence:seen,reducedMotion:'passed',nojs,errors},null,2));console.log(JSON.stringify({report,activeSequence:seen,reducedMotion:'passed',nojs,errors}));ws.close();

