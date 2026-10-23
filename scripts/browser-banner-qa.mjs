import fs from 'node:fs';
import assert from 'node:assert/strict';
const tabs=await(await fetch('http://127.0.0.1:9222/json/list')).json();
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let seq=0;const pending=new Map();
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;};
const pages=JSON.parse(fs.readFileSync('src/content/pages.json'));
const article=pages.find(p=>p.slug.length>100).slug;
const routes=['','who-we-are','what-we-do','victory-district','our-team','acg-news','contact-us','our-team/carlos-carrion',article];
const report=[];
await call('Page.enable');
for(const width of [1440,768,390,320]){
 await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
 let baseline;
 for(const slug of routes){
  await call('Page.navigate',{url:'http://127.0.0.1:4173/'+(slug?slug+'/':'')});
  await new Promise(r=>setTimeout(r,150));
  await evaluate('(async()=>{await document.fonts.ready;})()');
  const s=await evaluate(`(()=>{const opening=document.querySelector('main>section'),h=opening.querySelector('h1'),header=document.querySelector('.header-inner'),c=getComputedStyle(h);return {top:opening.getBoundingClientRect().top,headerBottom:header.getBoundingClientRect().bottom,titleSize:c.fontSize,titleWeight:c.fontWeight,titleColor:c.color,overflow:document.documentElement.scrollWidth>innerWidth,imageOverflow:[...opening.querySelectorAll('figure img')].some(i=>{const a=i.getBoundingClientRect(),b=i.closest('figure').getBoundingClientRect();return getComputedStyle(i).objectFit!=='cover'&&getComputedStyle(i).objectFit!=='contain';})};})()`);
  if(baseline===undefined)baseline=s.top;
  assert(Math.abs(s.top-baseline)<1,slug+': inconsistent banner entry');
  assert(s.top-s.headerBottom>=31,slug+': insufficient header clearance');
  assert(!s.overflow,slug+': horizontal overflow');
  assert(!s.imageOverflow,slug+': image containment');
  if(slug&&slug!==article){assert.equal(s.titleWeight,'700');assert.equal(s.titleColor,'rgb(30, 72, 68)');}
  report.push({slug,width,...s});
 }
 console.log('PASS: shared banner entry, heading styles and image containment at '+width+'px');
}
fs.writeFileSync('.qa/banner-results.json',JSON.stringify(report,null,2));
ws.close();
