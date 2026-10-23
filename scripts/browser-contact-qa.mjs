import fs from 'node:fs';
import assert from 'node:assert/strict';
fs.mkdirSync('.qa',{recursive:true});
const tabs=await(await fetch('http://127.0.0.1:9222/json/list')).json();
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let seq=0;const pending=new Map(),errors=[];ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(m.error):p?.resolve(m.result);}});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;};
const pause=()=>new Promise(r=>setTimeout(r,650));
await call('Runtime.discardConsoleEntries');await call('Page.enable');await call('Runtime.enable');

await call('Page.bringToFront');
const report=[];
for(const width of [1440,1024,768,390,320]){
 await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
 for(const slug of ['contact-us','who-we-are','our-team']){
  await call('Page.navigate',{url:'http://127.0.0.1:4173/'+slug+'/'});await new Promise(r=>setTimeout(r,150));
  await evaluate('(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>{i.loading="eager";return i.decode().catch(()=>{});}));})()');
  const layout=await evaluate(`(()=>{const f=document.querySelector('[data-contact-form]');return {overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,fields:f.querySelectorAll('[data-contact-field]').length,copyVisible:!f.querySelector('[data-copy-enquiry]').hidden,options:f.querySelectorAll('option').length,small:[...f.querySelectorAll('label,input,select,textarea,p,button')].filter(e=>getComputedStyle(e).display!=='none'&&parseFloat(getComputedStyle(e).fontSize)<16).length,targets:[...f.querySelectorAll('input,select,textarea,button')].filter(e=>e.getBoundingClientRect().height>0&&e.getBoundingClientRect().height<44).length}})()`);
  assert(!layout.overflow&&layout.fields===6&&layout.copyVisible&&!layout.small&&!layout.targets,JSON.stringify(layout));
  if(slug==='contact-us'&&[1440,390].includes(width)){
   const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync('.qa/contact-'+width+'.png',Buffer.from(shot.data,'base64'));
  }
  if(width===390){
   await evaluate('document.querySelector("[type=submit]").click()');
   assert(await evaluate('document.querySelector("[data-contact-field=firstName]").getAttribute("aria-invalid")==="true" && document.activeElement===document.querySelector("[data-contact-field=firstName]")'));
   await evaluate(`(()=>{const vals={firstName:'Example',lastName:'Tester',email:'not-an-email',message:'Enquiry test & details',phone:'0123456789'};for(const [k,v] of Object.entries(vals)){const e=document.querySelector('[data-contact-field="'+k+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));}})()`);
   assert.equal(await evaluate('document.querySelector("[data-contact-form]").checkValidity()'),false);
   await evaluate('(()=>{const e=document.querySelector("[data-contact-field=email]");e.value="example@example.test";e.dispatchEvent(new Event("input",{bubbles:true}));Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async text=>window.__copied=text}});document.querySelector("[data-copy-enquiry]").click()})()');await new Promise(r=>setTimeout(r,50));
   assert(await evaluate('window.__copied.includes("Email Address: example@example.test") && window.__copied.includes("Country Code: South Africa: +27") && document.querySelector("[data-contact-field=message]").value==="Enquiry test & details" && document.querySelector(".contact-status").textContent.includes("Enquiry copied")'));
   await evaluate('(()=>{navigator.clipboard.writeText=async()=>{throw Error("Clipboard unavailable")};document.querySelector("[data-copy-enquiry]").click()})()');await new Promise(r=>setTimeout(r,50));
   assert(await evaluate('!document.querySelector(".contact-copy-fallback").hidden && document.activeElement.matches(".contact-copy-fallback") && document.activeElement.value.includes("Your Message:")'));
  }
  report.push({slug,width,...layout});
 }
 console.log('PASS themed forms and responsive controls at '+width+'px');
}
await call('Emulation.setScriptExecutionDisabled',{value:true});await call('Page.navigate',{url:'http://127.0.0.1:4173/contact-us/'});await pause();
assert(await evaluate('document.querySelector("form").getAttribute("action")==="mailto:info@acgafrica.com" && getComputedStyle(document.querySelector("[data-copy-enquiry]")).display==="none" && document.querySelectorAll("[data-contact-field]").length===6'));
await call('Emulation.setScriptExecutionDisabled',{value:false});
assert.equal(errors.length,0,errors.join('\n'));fs.writeFileSync('.qa/contact-results.json',JSON.stringify({report,validation:'passed',copy:'passed',clipboardFallback:'passed',nojs:'native email fallback',errors},null,2));ws.close();
