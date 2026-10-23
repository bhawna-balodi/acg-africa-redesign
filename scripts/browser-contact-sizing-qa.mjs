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
const report=[];
for(const [width,height] of [[1920,1080],[1440,900],[1366,768],[1280,720],[1024,768],[1001,768],[768,1024],[390,844],[320,740]]){
 await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
 await call('Page.navigate',{url:'http://127.0.0.1:4173/contact-us/'});await new Promise(r=>setTimeout(r,100));
 await evaluate('(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>{i.loading="eager";return i.decode().catch(()=>{});}));})()');
 const layout=await evaluate(`(()=>{const h=document.querySelector('.header-inner').getBoundingClientRect(),f=document.querySelector('form').getBoundingClientRect(),i=document.querySelector('.contact-editorial-picture').getBoundingClientRect(),logo=document.querySelector('.header-inner .brand').getBoundingClientRect(),nav=document.querySelector('#navigation').getBoundingClientRect();const prior=innerWidth<=360?156:innerWidth<=1000?176:innerWidth<=1200?156:192;return {navHeight:h.height,navTarget:(prior*271/561+18)*.7*1.15*1.1,formTop:f.top,formBottom:f.bottom,formHeight:f.height,imageWidth:i.width,imageHeight:i.height,imageRatio:i.width/i.height,headerBottom:h.bottom,logoFits:logo.top>=h.top&&logo.bottom<=h.bottom,navFits:innerWidth<=1000||nav.left>=logo.right,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,smallTargets:[...document.querySelectorAll('form input,form select,form textarea,form button')].filter(e=>e.getBoundingClientRect().height>0&&e.getBoundingClientRect().height<44).length}})()`);
 assert(Math.abs(layout.navHeight-layout.navTarget)<.1);assert(!layout.overflow&&layout.logoFits&&layout.navFits&&!layout.smallTargets,JSON.stringify(layout));
 if(width>1000){assert(layout.formHeight>0);assert(layout.formTop>=layout.headerBottom+15);assert(Math.abs(layout.imageRatio-4/3)<.01);}
 if([1440,1366,1280,390].includes(width)){const shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync('.qa/contact-sizing-'+width+'.png',Buffer.from(shot.data,'base64'));}
 report.push({width,height,...layout});console.log(JSON.stringify(report.at(-1)));
}
assert.equal(errors.length,0,errors.join('\n'));fs.writeFileSync('.qa/contact-sizing-results.json',JSON.stringify({report,errors},null,2));ws.close();
