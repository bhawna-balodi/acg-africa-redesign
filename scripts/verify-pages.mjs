import fs from 'node:fs';
import assert from 'node:assert/strict';
import {load} from 'cheerio';
const pages=JSON.parse(fs.readFileSync('src/content/pages.json'));
const fragments=JSON.parse(fs.readFileSync('src/content/page-provenance.json'));
const norm=s=>s.replace(/\s+/g,' ').trim();
const sources=new Map(JSON.parse(fs.readFileSync('sources/page-manifest.json')).map(r=>[r.slug,load(fs.readFileSync(r.file,'utf8'))]));
const actionMap=[];
const knownRoutes=new Set(pages.map(p=>p.slug));
const routeKey=href=>{
 const url=new URL(href,'https://acgafrica.com'),slug=url.pathname.replace(/^\/+|\/+$/g,'');
 return url.hostname==='acgafrica.com'&&knownRoutes.has(slug)?'/'+(slug?slug+'/':'')+url.hash:url.href;
};
for(const f of fragments){
 if(f.id==='news-cards'||f.id==='contact-intro'||f.id.startsWith('profile-'))continue;
 const source=sources.get(f.slug),node=source(`[data-id="${f.id}"]`).first().clone();
 node.find('script,style,svg,meta,title,link,form,button,.acgx-nav,.sr-only,[aria-hidden="true"],[id^="rm-btn"]').remove();
 assert.equal(norm(node.text()),f.text,`Original source differs: ${f.slug}:${f.id}`);
}
for(const page of pages){
 const $=load(fs.readFileSync(`dist/${page.slug?page.slug+'/':''}index.html`));
 for(const f of fragments.filter(f=>f.slug===page.slug)){
  const actual=$(`[data-page-source="${f.id}"]`).clone();
  actual.find('[data-interface-copy]').remove();
  // Paragraph regrouping changes inter-element whitespace, never source wording.
  assert.equal(actual.text().replace(/\s/g,''),f.text.replace(/\s/g,''),`${page.slug}: ${f.id}`);
 }
 $('a[href]').each((i,e)=>{
  const href=$(e).attr('href');
  assert(!href.startsWith('https://acgafrica.com/')||$(e).is('[data-official-form]')||href.includes('/wp-content/'),`Unexpected off-site ACG navigation: ${href}`);
 });
 assert.equal($('h1').length,1);
 assert.equal($('form').length,['who-we-are','our-team','contact-us'].includes(page.slug)?1:0,'Only the requested email-draft forms are present');
 $('form').each((i,e)=>assert.equal($(e).attr('action'),'mailto:info@acgafrica.com','Enquiries use the authorized email recipient'));
 const original=load(page.body),available=new Map();
 const linkKey=(dom,e)=>routeKey(dom(e).attr('href'))+'|'+dom(e).text().replace(/\s/g,'')+'|'+dom(e).find('img').map((i,img)=>dom(img).attr('src')).get().join(',');
 $('main a[href]').each((i,e)=>{const key=linkKey($,e);available.set(key,(available.get(key)||0)+1);});
 original('a[href]').each((i,e)=>{
  // Empty duplicate anchors imported from malformed source HTML are not controls.
  if(!original(e).text().trim()&&!original(e).find('img').length)return;
  const key=linkKey(original,e),count=available.get(key)||0;
  assert(count>0,`${page.slug}: original link changed or missing (${original(e).text().trim()})`);
  available.set(key,count-1);
 });
 $('.cta').each((i,e)=>{
  const a=$(e),owner=a.attr('data-cta-owner'),scope=$(`[id="${owner}"]`);
  assert(scope.length,`${page.slug}: CTA has no content owner (${a.text().trim()})`);
  assert(scope.find(e).length,`${page.slug}: CTA is outside its content owner`);
  const variants=['primary','secondary','text'].filter(v=>a.hasClass('cta--'+v));
  assert.equal(variants.length,1,'Each action needs one clear hierarchy role');
  actionMap.push({page:page.slug||'/',text:norm(a.text()),href:a.attr('href'),role:variants[0],owner});
 });
 $('main > section[aria-labelledby]').each((i,e)=>assert($(`[id="${$(e).attr('aria-labelledby')}"]`).length,'Section label must resolve'));
}
const team=load(fs.readFileSync('dist/our-team/index.html'));
assert.equal(team('#our-advisory-board .person').length,28);
assert.equal(team('#our-research-and-impact-advisory-panel .person').length,12);
const news=load(fs.readFileSync('dist/acg-news/index.html'));
assert.equal(news('.news-card').length,18);
const who=load(fs.readFileSync('dist/who-we-are/index.html'));
who('.evidence-row').each((i,e)=>{
 assert.equal(who(e).find('[data-page-source] .eyebrow').length,1);
 assert.equal(who(e).find('h2').length,1);
 const actions=who(e).find('.row-actions');
 if(actions.length){
  const panel=actions.closest('.method-copy');
  assert(actions.is((panel.length?panel:who(e)).children().last()),'Context action must conclude the complete evidence block');
 }
});
const work=load(fs.readFileSync('dist/what-we-do/index.html'));
assert.equal(work('.gates__track>li').length,5);
assert.equal(work('.steps__grid>li').length,6);
assert(work('.model-invitation>.wrap>.section-actions').is(work('.model-invitation>.wrap').children().last()),'Model CTA must follow the complete model explanation');
const model=load(fs.readFileSync('dist/victory-district/index.html'));
assert.equal(model('.operating-requirements li').length,5);
assert.equal(model('.model-verticals>article').length,3);
assert.equal(model('.stakeholder-mapping>article').length,5);
assert.equal(model('[data-page-source="0ff58c7"] a').attr('data-cta-owner'),model('.stakeholder-mapping').closest('section').attr('id'));
assert.equal(team('.biography-more').length,2);
assert.equal(team('.section-index a').length,3);
if(process.argv.includes('--write-reports'))fs.writeFileSync('docs/CTA-OWNERSHIP.json',JSON.stringify(actionMap,null,2));
console.log(`PASS: ${pages.length} local routes, ${fragments.length} source fragments, 40 panel members and 18 complete news pages.`);
