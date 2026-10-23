import fs from 'node:fs';
import assert from 'node:assert/strict';
fs.mkdirSync('.qa',{recursive:true});
const tabs=await(await fetch('http://127.0.0.1:9222/json/list')).json();
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let seq=0;const pending=new Map(),errors=[];ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(m.error):p?.resolve(m.result);}});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;};
const pause=()=>new Promise(r=>setTimeout(r,650));
await call('Page.enable');await call('Runtime.enable');

await call('Runtime.discardConsoleEntries');await call('Page.bringToFront');await call('Accessibility.enable');
const pages=JSON.parse(fs.readFileSync('src/content/pages.json'));
const article=pages.find(p=>p.slug.startsWith('sport-infrastructure-in-africa-bbc')).slug;
const report=[];
for(const width of [1440,390]){
 await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
 for(const slug of ['','who-we-are','what-we-do','victory-district','our-team','contact-us',article]){
  await call('Page.navigate',{url:'http://127.0.0.1:4173/'+(slug?slug+'/':'')});await pause();
  const tree=await call('Accessibility.getFullAXTree');
  const active=tree.nodes.filter(n=>!n.ignored),links=active.filter(n=>n.role?.value==='link');
  assert(links.every(n=>n.name?.value.trim()),slug+': unnamed browser accessibility link');
  if(!slug)assert(active.some(n=>n.role?.value==='group'&&n.name?.value==='The familiar failure'));
  if(slug==='our-team')assert(active.some(n=>n.role?.value==='navigation'&&n.name?.value==='Our Team sections'));
  if(slug===article){assert(active.some(n=>n.role?.value==='article'&&n.name?.value.startsWith('Sport Infrastructure')));assert(active.some(n=>n.role?.value==='navigation'&&n.name?.value==='Article navigation'));}
  await evaluate('document.querySelector(".skip").focus()');
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await pause();
  assert(await evaluate('document.activeElement===document.querySelector("main")'),slug+': skip link focus');
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  assert(await evaluate('document.querySelector("main").contains(document.activeElement)'),slug+': reading order after skip');
  report.push({slug,width,namedLinks:links.length,skipLink:'focuses main',tabOrder:'continues into content'});
 }
 console.log('PASS native accessibility roles, link names and skip-link keyboard behavior at '+width+'px');
}
fs.writeFileSync('.qa/dom-accessibility-results.json',JSON.stringify({report,errors},null,2));assert.equal(errors.length,0);ws.close();
