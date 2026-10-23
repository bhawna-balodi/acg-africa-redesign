import fs from 'node:fs';
import assert from 'node:assert/strict';
import {load} from 'cheerio';
const pages=JSON.parse(fs.readFileSync('src/content/pages.json'));
const report=[];
for(const page of pages){
 const $=load(fs.readFileSync('dist/'+(page.slug?page.slug+'/':'')+'index.html'));
 const ids=$('[id]').map((i,e)=>$(e).attr('id')).get();
 assert.equal(new Set(ids).size,ids.length,page.slug+': duplicate IDs');
 assert.equal($('main').length,1);assert.equal($('body>header').length,1);assert.equal($('body>footer').length,1);
 assert.equal($('main').attr('tabindex'),'-1','Skip target must receive keyboard focus');
 let level=0;
 $('main h1,main h2,main h3,main h4,main h5,main h6').each((i,e)=>{const next=+e.tagName[1];assert(next<=level+1,page.slug+': skipped heading level');level=next;});
 $('[aria-labelledby],[aria-describedby],[aria-controls]').each((i,e)=>{
  for(const key of ['aria-labelledby','aria-describedby','aria-controls'])for(const id of ($(e).attr(key)||'').split(/\s+/).filter(Boolean))assert.equal($('[id="'+id+'"]').length,1,page.slug+': '+key+' '+id);
 });
 $('a[href],button,summary').each((i,e)=>{
  const n=$(e);const text=n.clone();text.find('[aria-hidden="true"]').remove();
  const named=text.text().trim()||n.attr('aria-label')||n.attr('aria-labelledby')||n.find('img[alt]').filter((i,e)=>$(e).attr('alt').trim()).length;
  assert(named,page.slug+': unnamed '+e.tagName+' '+(n.attr('href')||''));
 });
 assert.equal($('a a,a button,button a,button button').length,0,page.slug+': nested interactive controls');
 $('nav').each((i,e)=>{assert($(e).attr('aria-label')||$(e).attr('aria-labelledby'),'Navigation landmark needs a distinguishing name');assert(!$(e).attr('role'),'Use native navigation semantics');});
 $('div[aria-label],div[aria-labelledby]').each((i,e)=>assert($(e).attr('role'),page.slug+': named generic container'));
 if($('.article-body').length){assert.equal($('.article-body').prop('tagName'),'ARTICLE');assert.equal($('.article-navigation').prop('tagName'),'NAV');assert.equal($('.article-body').attr('aria-labelledby'),$('.article-intro h1').attr('id'));}
 $('.leader-image').each((i,e)=>{assert.equal(e.tagName,'figure');assert.equal($(e).children('.page-block').length,0);});
 report.push({slug:page.slug,nodes:$('body *').length,divs:$('body div').length,maxDepth:Math.max(...$('body *').map((i,e)=>$(e).parents().length).get())});
}
const total=key=>report.reduce((sum,p)=>sum+p[key],0);
if(process.argv.includes('--write-reports')){
 fs.mkdirSync('.qa',{recursive:true});
 fs.writeFileSync('.qa/dom-audit-after.json',JSON.stringify(report,null,2));
}
console.log('PASS: '+pages.length+' routes; landmarks, heading order, unique IDs, ARIA references, named controls and semantic content. '+total('nodes')+' elements / '+total('divs')+' divs.');
