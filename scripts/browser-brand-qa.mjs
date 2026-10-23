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
const pages=JSON.parse(fs.readFileSync('src/content/pages.json'));
const article=pages.find(p=>p.slug.length>100).slug;
const report=[];
for(const width of [1440,1024,1001,768,390,320]){
 await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
 for(const slug of ['', 'who-we-are','what-we-do','victory-district',article]){
  await call('Page.navigate',{url:'http://127.0.0.1:4173/'+(slug?slug+'/':'')});await new Promise(r=>setTimeout(r,100));
  await evaluate('(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>{i.loading="eager";return i.decode().catch(()=>{});}));})()');await new Promise(r=>setTimeout(r,500));
  const state=await evaluate(`(()=>{
   const h=document.querySelector('.header-inner').getBoundingClientRect();
   const prior=innerWidth<=360?156:innerWidth<=1000?176:innerWidth<=1200?156:192;
   const markers=[...document.querySelectorAll('[data-brand-corner]')].map(f=>{const b=f.getBoundingClientRect(),m=f.querySelector('.image-brand-mark').getBoundingClientRect(),s=getComputedStyle(f);const pos=f.dataset.brandCorner.split('-'),inset=parseFloat(s.getPropertyValue('--brand-inset'));return {corner:f.dataset.brandCorner,vertical:Math.abs((pos[0]==='top'?m.top-b.top:b.bottom-m.bottom)-inset),horizontal:Math.abs((pos[1]==='left'?m.left-b.left:b.right-m.right)-inset),crop:getComputedStyle(f.querySelector('.brand-photo')).objectViewBox};});
   const logo=document.querySelector('.header-inner .brand').getBoundingClientRect(),nav=document.querySelector('#navigation').getBoundingClientRect();
   return {height:h.height,target:(prior*271/561+18)*.7*1.15*1.1,markers,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,logoInside:logo.top>=h.top&&logo.bottom<=h.bottom,navFits:innerWidth<=1000||nav.left>=logo.right,broken:[...document.images].filter(i=>!i.naturalWidth).length};
  })()`);
  assert(Math.abs(state.height-state.target)<.1,slug+': navbar '+JSON.stringify(state));assert(!state.overflow&&state.logoInside&&state.navFits&&!state.broken,JSON.stringify(state));
  assert(state.markers.every(m=>m.vertical<.5&&m.horizontal<.5&&m.crop.includes('36%')),slug+': corner placement');
  if(slug==='victory-district')assert(await evaluate(`getComputedStyle(document.querySelector('.source-compact')).display===${width<=1024?'"block"':'"none"'}`));
  report.push({slug,width,...state});
  if([1440,390].includes(width)){
   const label=slug===article?'article':slug||'home';
   const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync('.qa/brand-'+label+'-'+width+'.png',Buffer.from(shot.data,'base64'));
  }
 }
 console.log('PASS navbar height, logo/navigation fit and image corners at '+width+'px');
}
fs.writeFileSync('.qa/brand-refinement-results.json',JSON.stringify({report,errors},null,2));assert.equal(errors.length,0);ws.close();
