import fs from 'node:fs';
import assert from 'node:assert/strict';
fs.mkdirSync('.qa',{recursive:true});
const tabs=await(await fetch('http://127.0.0.1:9222/json/list')).json();
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let seq=0;const pending=new Map(),errors=[];ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(m.error):p?.resolve(m.result);}});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;};
const pause=()=>new Promise(r=>setTimeout(r,650));
await call('Page.enable');await call('Runtime.enable');

const requested=process.argv.slice(2);
const pages=JSON.parse(fs.readFileSync('src/content/pages.json')).filter(p=>!requested.length||requested.includes(p.slug));
const sampleArticle=pages.find(p=>p.slug.length>100)?.slug;
const report=[];
const widths=process.env.ACG_QA_WIDTHS?process.env.ACG_QA_WIDTHS.split(',').map(Number):[1440,768,390];
for(const width of widths){
 await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
 for(const [index,page] of pages.entries()){
  const path='/'+(page.slug?page.slug+'/':'');
  const response=await fetch('http://127.0.0.1:4173'+path);assert.equal(response.status,200,path);
  await call('Page.navigate',{url:'http://127.0.0.1:4173'+path});
  await new Promise(r=>setTimeout(r,180));
  await evaluate('(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>{i.loading="eager";return i.decode().catch(()=>{});}));})()');
  const state=await evaluate('({width:innerWidth,scroll:document.documentElement.scrollWidth,broken:[...document.images].filter(i=>!i.naturalWidth).length,h1:document.querySelectorAll("h1").length})');
  assert(state.scroll<=width,path+' overflow '+JSON.stringify(state));assert.equal(state.broken,0,path+' images');assert.equal(state.h1,1,path);
  report.push({path,width,...state});
  if((!page.slug.includes('/')&&page.slug.length<25)||index===pages.length-1||page.slug==='our-team/carlos-carrion'||page.slug===sampleArticle){
   const label=page.slug===sampleArticle?'sample-article':page.slug.replaceAll('/','-')||'home';
   const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync('.qa/page-'+label+'-'+width+'.png',Buffer.from(shot.data,'base64'));
  }
 }
 console.log('PASS '+pages.length+' pages at '+width+'px');
}
assert.equal(errors.length,0,errors.join('\n'));
fs.writeFileSync(requested.length?'.qa/pages-followup-results.json':'.qa/pages-results.json',JSON.stringify({report,errors},null,2));ws.close();
