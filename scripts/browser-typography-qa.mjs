import fs from 'node:fs';
import assert from 'node:assert/strict';
import {load} from 'cheerio';
const phase=process.argv[2]||'after';
const pages=JSON.parse(fs.readFileSync('src/content/pages.json'));
const dom=Object.fromEntries(pages.map(p=>[p.slug,load(fs.readFileSync('dist/'+p.slug+'/index.html'))('body').html()]));
if(phase==='before')fs.writeFileSync('.qa/type-dom-before.json',JSON.stringify(dom));
else assert.deepEqual(dom,JSON.parse(fs.readFileSync('.qa/type-dom-before.json')),'Body DOM/content must remain identical');
const tabs=await(await fetch('http://127.0.0.1:9222/json/list')).json();
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let seq=0;const pending=new Map();
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;};
const report=[];
await call('Page.enable');
for(const width of [1440,768,390,320]){
 await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
 for(const page of pages){
  await call('Page.navigate',{url:'http://127.0.0.1:4173/'+(page.slug?page.slug+'/':'')});
  await new Promise(r=>setTimeout(r,100));
  await evaluate('(async()=>{await document.fonts.ready;})()');
  const state=await evaluate(`(()=>{const nodes=[...document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,a,span,strong,em,figcaption,summary,button,label,input,select,textarea,.eyebrow,.person-role,.headline-line')].filter(e=>e.getBoundingClientRect().width&&e.getBoundingClientRect().height&&!e.closest('[inert]'));return {overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,items:nodes.map(e=>{const c=getComputedStyle(e);return {iconOnly:e.matches('.sequence-controls button[aria-label]')&&c.fontSize==='0px'&&getComputedStyle(e,'::before').maskImage!=='none',tag:e.tagName,cls:e.className,text:e.textContent.trim().slice(0,100),size:c.fontSize,weight:c.fontWeight,line:c.lineHeight,tracking:c.letterSpacing,family:c.fontFamily};})};})()`);
  if(phase==='after'){
   assert(!state.overflow,page.slug+' overflow at '+width);
   for(const item of state.items){
    assert(item.family.startsWith('Manrope'),page.slug+' non-Manrope '+JSON.stringify(item));
    assert(item.iconOnly||parseFloat(item.size)>=13,page.slug+' tiny type '+JSON.stringify(item));
    // Standard body copy is the explicitly requested 18px exception.
    assert(parseFloat(item.size)===18||Math.abs(parseFloat(item.size)/4-Math.round(parseFloat(item.size)/4))<.001,page.slug+' unexpected type size '+JSON.stringify(item));
    if(['INPUT','SELECT','TEXTAREA'].includes(item.tag))assert(parseFloat(item.size)>=16,'Form text must remain 16px or above');
   }
  }
  report.push({slug:page.slug,width,...state});
 }
 console.log(phase+': audited all '+pages.length+' pages at '+width+'px');
}
if(phase==='after'){
 const before=JSON.parse(fs.readFileSync('.qa/typography-before.json'));
 for(const page of report.filter(p=>p.slug==='')){
  const original=before.find(p=>p.slug===''&&p.width===page.width);
  const roles=item=>item.cls==='headline-line'||item.cls==='headline-line headline-accent'||item.tag==='H2';
  const expected=original.items.filter(roles),actual=page.items.filter(roles);
  assert.equal(actual.length,expected.length);
  actual.forEach((item,i)=>{
   assert.equal(parseFloat(item.size),Math.round(parseFloat(expected[i].size)/4)*4,'Homepage role must preserve its original scale with nearest-4px rounding');
   assert.equal(item.weight,expected[i].weight,'Homepage role weight must remain unchanged');
  });
 }
}
fs.writeFileSync('.qa/typography-'+phase+'.json',JSON.stringify(report,null,2));
ws.close();
