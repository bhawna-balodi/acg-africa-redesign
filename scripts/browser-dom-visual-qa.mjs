import fs from 'node:fs';
import assert from 'node:assert/strict';
fs.mkdirSync('.qa',{recursive:true});
const tabs=await(await fetch('http://127.0.0.1:9222/json/list')).json();
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let seq=0;const pending=new Map(),errors=[];ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(m.error):p?.resolve(m.result);}});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;};
const pause=()=>new Promise(r=>setTimeout(r,650));
await call('Page.enable');await call('Runtime.enable');

const mode=process.argv[2]||'before';
await call('Runtime.discardConsoleEntries');await call('Page.bringToFront');
await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
const pages=JSON.parse(fs.readFileSync('src/content/pages.json')),results=[];
fs.mkdirSync('.qa/dom-'+mode,{recursive:true});
for(const width of [1440,768,390]){
 await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
 for(const [index,page] of pages.entries()){
  await call('Page.navigate',{url:'http://127.0.0.1:4173/'+(page.slug?page.slug+'/':'')});await new Promise(r=>setTimeout(r,70));
  await evaluate('(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>{i.loading="eager";return i.decode().catch(()=>{});}));window.scrollTo(0,0)})()');
  await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});
  const name=index+'-'+width;
  const geometry=await evaluate(`({height:document.documentElement.scrollHeight,width:document.documentElement.scrollWidth,targets:[...document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,img,input,select,textarea,button,a')].map(e=>{const r=e.getBoundingClientRect();return {tag:e.tagName,text:e.textContent.replace(/\s+/g,' ').trim(),src:e.getAttribute('src'),href:e.getAttribute('href'),rect:[r.x,r.y,r.width,r.height]}})})`);
  const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});const bytes=Buffer.from(shot.data,'base64');fs.writeFileSync('.qa/dom-'+mode+'/'+name+'.png',bytes);
  fs.writeFileSync('.qa/dom-'+mode+'/'+name+'.json',JSON.stringify(geometry));
  if(mode==='after'){
   const before=fs.readFileSync('.qa/dom-before/'+name+'.png');
   results.push({slug:page.slug,width,pixelsIdentical:before.equals(bytes),geometryIdentical:JSON.stringify(geometry)===fs.readFileSync('.qa/dom-before/'+name+'.json','utf8')});
  }
 }
 console.log(mode+': captured '+pages.length+' routes at '+width+'px');
}
await call('Emulation.setEmulatedMedia',{features:[]});ws.close();
if(mode==='after'){fs.writeFileSync('.qa/dom-visual-results.json',JSON.stringify({results,errors},null,2));const changed=results.filter(r=>!r.pixelsIdentical);console.log(JSON.stringify({screenshots:results.length,changed,errors}));assert.equal(changed.length,0);}
