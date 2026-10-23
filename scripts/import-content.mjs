import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {load} from 'cheerio';
const assets=new Map(),provenance=[];
const normalize=s=>s.replace(/\s+/g,' ').trim();
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function asset(url){
 if(!url)return '';
 const name=createHash('sha256').update(url).digest('hex').slice(0,12)+'-'+path.basename(new URL(url).pathname);
 assets.set(url,`/assets/original/${name}`);return assets.get(url);
}
const route=url=>{
 try{const u=new URL(url,'https://acgafrica.com'),pathname=u.pathname.endsWith('/')?u.pathname:u.pathname+'/';if(u.hostname==='acgafrica.com'&&['/','/who-we-are/','/what-we-do/','/victory-district/','/our-team/','/acg-news/','/contact-us/'].includes(pathname))return pathname==='/'?'/':u.href;return u.href;}catch{return '';}
};
const allowed=new Set(['p','h1','h2','h3','h4','h5','h6','ul','ol','li','strong','em','b','i','a','br','div','span','article','section','img','blockquote','details','summary']);
function sanitize(html){
 const $=load(`<div id="fragment">${html}</div>`,null,false),root=$('#fragment');
 root.find('script,style,svg,iframe,form,button,meta,title,link,.acgx-nav,.sr-only,[aria-hidden="true"]').remove();
 root.find('.rm-extra').each((i,e)=>{const more=$('<details><summary>Read more</summary></details>');more.append($(e).html());$(e).replaceWith(more);});
 root.find('[id^="rm-btn"]').remove();
 root.find('*').each((i,e)=>{
  const el=$(e),tag=e.tagName;
  if(!allowed.has(tag)){el.replaceWith(el.contents());return;}
  const href=el.attr('href'),src=el.attr('src'),alt=el.attr('alt')||'',width=el.attr('width'),height=el.attr('height');
  for(const k of Object.keys(e.attribs))el.removeAttr(k);
  if(tag==='a'){if(href&&!href.includes('elementor-action'))el.attr('href',route(href));else el.replaceWith(el.contents());}
  if(tag==='img'){el.attr({src:asset(src),alt,loading:'lazy',decoding:'async'});if(width&&height)el.attr({width,height});}
 });return root.html().trim();
}
const docs={};
for(const name of ['home']){
 const raw=fs.readFileSync(`sources/${name}.html`,'utf8');docs[name]={raw,$:load(raw)};
}
let current;
function w(id,kind='copy'){
 const $=docs[current].$,node=$(`[data-elementor-type="wp-page"] [data-id="${id}"]`);
 if(node.length!==1)throw Error(`Source node not unique: ${current}:${id}`);
 let html=sanitize(node.find('> .elementor-widget-container').html()??node.html());
 const frag=load(html,null,false);
 if(['h1','h2','h3','eyebrow'].includes(kind)){const tag=kind==='eyebrow'?'p':kind;html=`<${tag}${kind==='eyebrow'?' class="eyebrow"':''}>${escape(normalize(frag.text()))}</${tag}>`;}
 provenance.push({page:current,id,text:normalize(load(html,null,false).text())});
 return `<div class="source-block ${kind}" data-source-id="${id}">${html}</div>`;
}
const section=(body,cls='',id='')=>`<section${id?` id="${id}"`:''} class="source-section ${cls}"><div class="wrap">${body}</div></section>`;
const split=(left,right)=>`<div class="split"><div>${left}</div><div>${right}</div></div>`;
const grid=(items,cls='source-grid')=>`<div class="${cls}">${items.map(s=>`<article>${s}</article>`).join('')}</div>`;
function image(url,alt='',cls='source-landscape'){return `<img class="${cls}" src="${asset(url)}" alt="${escape(alt)}" loading="lazy">`;}
const pages=[];
function page(name,slug,title,build){
 current=name;const $=docs[name].$;
 const description=$('meta[name="description"]').attr('content')||normalize($('[data-id="44ae450"]').text());
 pages.push({source:`https://acgafrica.com/${name==='home'?'':name==='news'?'acg-news/':name+'/'}`,slug,title,description,body:build()});
}
const architecture='https://acgafrica.com/wp-content/uploads/2026/01/Group-148227.png';
const stadium='https://acgafrica.com/wp-content/uploads/2026/01/pexels-furknsaglam-1596977-3131406-1.png';
page('home','','African Collaborations Group (ACG)',()=>[
 section(`<div class="hero-composition"><div class="hero-title">${w('9fb7c04','eyebrow')+w('44ae450','h1')}<a class="hero-cta" href="https://acgafrica.com/contact-us/">Contact Us <span aria-hidden="true">&#8599;</span></a><div class="hero-context">${w('ab7b2c8','hero-principles')}<figure class="hero-detail">${image('https://acgafrica.com/wp-content/uploads/2025/05/Group-208.png')}</figure></div></div><figure class="hero-image">${image(stadium,'Stadium structure, stands and playing field')}</figure></div>`,'source-hero'),
 section(`<div class="editorial-intro">${w('02b31bd','h2')+w('bd9c825','h3')}</div><div class="why-story"><figure class="why-image">${image(stadium,'The scale of a stadium and its spectator stands')}</figure><div class="why-copy">${w('9c4c1ed')+w('4acfe94')+w('08d186e','closing-note')}</div></div>`,'why-section','why-this-matters'),
 section(`<div class="challenge-intro">${w('f429f26','h2')}<details class="challenge-context" open><summary>${w('eab1325')}<span class="disclosure-mark" aria-hidden="true"></span></summary>${w('b448bcd')}</details></div><div class="failure-panel"><div class="sequence-layout"><figure class="challenge-image">${image(architecture,'Sports infrastructure within an urban district')}</figure><div class="sequence-story">${w('c74291c','h3')+w('e4a86d6','failure-list')}<div class="sequence-controls" aria-label="Failure point navigation"></div></div></div></div>`,'challenge-section'),
 section(w('cd56a27','eyebrow')+`<div class="mission-heading">${w('0c0a1f7','h2')}</div><div class="mission-layout"><figure class="mission-image">${image('https://acgafrica.com/wp-content/uploads/2025/10/Group-253.png')}</figure>`+grid([['469c129','d56ab69'],['39e6971','4a741b3'],['f813a9d','df9814c'],['c0e7ab7','fcff5f2']].map(([a,b])=>w(a,'mission-icon')+w(b,'h3')),'mission-grid')+`</div><div class="mission-close">${w('87e243a','h3')+w('0110827','action')}</div>`,'mission-section')
].join(''));
const $=docs.home.$,footer=$('[data-elementor-type="footer"]');
const footerText=footer.find('[data-widget_type="text-editor.default"]').map((i,e)=>sanitize($(e).find('.elementor-widget-container').html())).get();
const common={logo:asset('https://acgafrica.com/wp-content/uploads/2026/08/Group-148335.png'),logoInverse:asset('https://acgafrica.com/wp-content/uploads/2026/08/Group-148336.png'),favicon:asset('https://acgafrica.com/wp-content/uploads/2026/01/cropped-Group-148232-192x192.png'),og:asset('https://acgafrica.com/wp-content/uploads/2025/10/Group-253.png'),footerText,linkedin:'https://www.linkedin.com/company/african-collaborations-group'};
for(const [file,value] of Object.entries({pages,common,assets:[...assets].map(([source,local])=>({source,local})),provenance}))fs.writeFileSync(`src/content/${file}.json`,JSON.stringify(value,null,2));
console.log(`Imported ${pages.length} pages, ${provenance.length} source fragments and ${assets.size} original assets.`);
