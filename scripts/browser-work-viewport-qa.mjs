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
for(const width of [1920,1440,1280,1024,1001,1000,768,390,320]){
 await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
 await call('Page.navigate',{url:'http://127.0.0.1:4173/what-we-do/'});await pause();
 await evaluate('(async()=>{await document.fonts.ready;})()');await pause();
 const s=await evaluate(`(()=>{const list=document.querySelector('.steps__grid'),rows=[...list.children],image=document.querySelector('.work-picture').getBoundingClientRect(),box=list.getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,imageHeight:image.height,height:box.height,client:list.clientHeight,scroll:list.scrollHeight,fourthBottom:rows[3].getBoundingClientRect().bottom-box.top,fifthTop:rows[4].getBoundingClientRect().top-box.top,tab:list.getAttribute('tabindex'),labelled:list.getAttribute('aria-labelledby'),count:rows.length};})()`);
 assert(!s.overflow);assert.equal(s.count,6);
 if(width>1000){assert(Math.abs(s.imageHeight-s.height)<1);assert(Math.abs(s.height-s.fourthBottom)<3);assert(s.fifthTop>=s.height-2);assert(s.scroll>s.client);assert.equal(s.tab,'0');assert(s.labelled);
  await evaluate('document.querySelector(".steps__grid").focus();document.querySelector(".work-narrative").scrollIntoView({block:"center"})');
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'End',code:'End',windowsVirtualKeyCode:35,nativeVirtualKeyCode:35});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'End',code:'End',windowsVirtualKeyCode:35,nativeVirtualKeyCode:35});await pause();
  const last=await evaluate(`(()=>{const list=document.querySelector('.steps__grid'),box=list.getBoundingClientRect(),row=list.lastElementChild.getBoundingClientRect();return {end:list.scrollTop+list.clientHeight>=list.scrollHeight-2,lastVisible:row.bottom<=box.bottom+2,position:document.querySelector('[data-process-position]').textContent};})()`);
  assert(last.end&&last.lastVisible,JSON.stringify(last));assert.equal(last.position,'06 / 06');
 }else{assert(s.scroll<=s.client+1);assert.equal(s.tab,null);}
 report.push({width,...s});console.log('PASS four complete points, matched image and native keyboard reveal at '+width+'px');
}
assert.equal(errors.length,0,errors.join('\n'));fs.writeFileSync('.qa/work-viewport-results.json',JSON.stringify(report,null,2));ws.close();
