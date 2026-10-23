import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {load} from 'cheerio';

const pages=JSON.parse(fs.readFileSync('src/content/pages.json','utf8'));
const fragments=JSON.parse(fs.readFileSync('src/content/provenance.json','utf8'));
const assets=JSON.parse(fs.readFileSync('src/content/assets.json','utf8'));
assert.equal(pages.length,37);
assert.equal(pages[0].slug,'');
const plain=s=>s.replace(/\s+/g,'');
let checkedLinks=0;
for(const page of pages){
 const html=fs.readFileSync(`dist/${page.slug?page.slug+'/':''}index.html`,'utf8');
 const $=load(html);
 assert.equal($('h1').length,1,`${page.slug}: one h1`);
 for(const selector of ['title','meta[name="description"]','meta[property="og:image"]','link[rel="icon"]','meta[name="viewport"]'])assert($(selector).length,selector);
 assert(!html.includes('elementor-action'),'Unresolved source popup');
 $('a, img, link, script[src]').each((i,e)=>{
  const url=$(e).attr('href')||$(e).attr('src');
  assert(url&&url!=='#','Empty destination');
  if(url.startsWith('/')){
   const [pathname,hash]=url.split('#');
   const file='dist'+(pathname.endsWith('/')?pathname+'index.html':pathname);
   assert(fs.existsSync(file),`Missing ${url}`);
   if(hash){const target=load(fs.readFileSync(file,'utf8'));assert(target(`[id="${hash}"]`).length,`Missing anchor ${url}`);}
  }else if(url.startsWith('#'))assert($(`[id="${url.slice(1)}"]`).length,`Missing ${url}`);
  if(e.tagName==='img')assert($(e).attr('alt')!==undefined,'Missing alt');
  checkedLinks++;
 });
 const sourceName=page.slug==='acg-news'?'news':page.slug||'home';
 const text=plain($('main').text());
 for(const fragment of fragments.filter(f=>f.page===sourceName)){
  assert(text.includes(plain(fragment.text)),`Content missing: ${sourceName}:${fragment.id}`);
 }
}
// Compare every imported source node directly to its original snapshot.
for(const fragment of fragments.filter(f=>!f.id.startsWith('article-'))){
 const $=load(fs.readFileSync(`sources/${fragment.page}.html`,'utf8'));
 const node=$(`[data-elementor-type="wp-page"] [data-id="${fragment.id}"]`).clone();
 node.find('style,script,svg,button,title,meta,.acgx-nav,.sr-only,[aria-hidden="true"],[id^="rm-btn"]').remove();
 const original=plain(node.text()),actual=node.find('.rm-extra').length?plain(fragment.text).replace(/Readmore/g,''):plain(fragment.text);
 assert.equal(actual,original,`Source wording changed: ${fragment.page}:${fragment.id}`);
}
for(const item of assets){
 const bytes=fs.readFileSync('public'+item.local);
 assert(bytes.length>100,item.local);
 assert(!bytes.subarray(0,80).toString().includes('<!DOCTYPE'),`Not an image: ${item.local}`);
}
const home=load(fs.readFileSync('dist/index.html','utf8'));
// Compare rendered wording, including punctuation and word boundaries, with
// the freshly fetched official homepage. Ignore only HTML whitespace.
const live=load(fs.readFileSync('sources/home-live.html','utf8'));
const normalizedText=node=>{
 const copy=node.clone();
 copy.find('style,script,svg,button,title,meta,.acgx-nav,.sr-only,[aria-hidden="true"]').remove();
 return copy.text().replace(/\s+/g,' ').trim();
};
home('[data-source-id]').each((i,e)=>{
 const id=home(e).attr('data-source-id');
 assert.equal(normalizedText(home(e)),normalizedText(live(`[data-elementor-type="wp-page"] [data-id="${id}"]`)),`Live original wording differs: ${id}`);
});
live('[data-elementor-type="footer"] [data-widget_type="text-editor.default"]').each((i,e)=>{
 assert(normalizedText(home('footer')).includes(normalizedText(live(e))),'Original footer wording missing');
});
assert.equal(home('.challenge-explanation').length,1,'Challenge explanation must remain visible');
assert.equal(home('.challenge-context summary').length,0,'The challenge statement is content, not a disclosure control');
assert.equal(home('.hero-context details').length,0,'Hero information must not be hidden in a disclosure');
assert.equal(home('.hero-principles li').length,3,'All original hero principles must remain visible');
assert(!home('body').text().includes('Explore the challenge'),'Non-original challenge copy');
assert.equal(home('a[href="mailto:info@acgafrica.com"]').length,0,'Non-original footer email');
assert.equal(home('main > section').length,4,'Original home page has four top-level sections.');
const sectionIds=[
 ['9fb7c04','44ae450','ab7b2c8'],
 ['02b31bd','bd9c825','9c4c1ed','4acfe94','08d186e'],
 ['f429f26','eab1325','b448bcd','c74291c','e4a86d6'],
 ['cd56a27','0c0a1f7','469c129','d56ab69','39e6971','4a741b3','f813a9d','df9814c','c0e7ab7','fcff5f2','87e243a','0110827']
];
home('main > section').each((i,section)=>assert.deepEqual(home(section).find('[data-source-id]').map((i,e)=>home(e).attr('data-source-id')).get(),sectionIds[i],'Original content must stay in its section and order.'));
for(const item of assets)assert(fs.readFileSync('public'+item.local).equals(fs.readFileSync('dist'+item.local)),'Source asset bytes changed.');
assert.equal(home('.action a').attr('href'),'/contact-us/');

assert.deepEqual(home('main > section').map((i,e)=>home(e).find('h1,h2,.eyebrow').first().text()).get(),[
 'African Collaborations Group (ACG)','Why this matters','The challenge we are solving','Our mission'
]);
const htmlFiles=fs.readdirSync('dist',{recursive:true}).filter(file=>file.endsWith('.html'));
assert.equal(htmlFiles.length,pages.length,'Every page must be built.');
const source=load(fs.readFileSync('sources/home.html','utf8'));
const renderedText=plain(home('main').text());
source('[data-elementor-type="wp-page"] [data-widget_type="text-editor.default"], [data-elementor-type="wp-page"] [data-widget_type="heading.default"]').each((i,e)=>{
 assert(renderedText.includes(plain(source(e).text())),`Home source text missing: ${source(e).attr('data-id')}`);
});
for(const font of ['manrope-latin.woff2'])assert.equal(fs.readFileSync('dist/assets/fonts/'+font).subarray(0,4).toString(),'wOF2');
assert.equal(home('#team-menu .submenu a').length,3);
assert(home('#team-menu summary').attr('aria-label'));
await import('./verify-interactions.mjs');
await import('./verify-pages.mjs');
await import('./verify-storytelling.mjs');
await import('./audit-official-content.mjs');
await import('./verify-contact.mjs');
await import('./verify-dom.mjs');
await import('./audit-even-pixels.mjs');
console.log(`PASS: complete local site, four original homepage sections in order, ${fragments.length} exact source fragments, ${assets.length} original image files and ${checkedLinks} links/assets.`);
console.log('Static checks passed. Browser viewport and interaction results are documented in docs/UI-REVIEW.txt.');

