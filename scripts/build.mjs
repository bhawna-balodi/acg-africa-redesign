import fs from 'node:fs';
import {load} from 'cheerio';
import {renderPage} from '../src/templates/layout.mjs';
import {refinePresentation} from '../src/templates/presentation.mjs';
import {addStorytelling} from '../src/templates/storytelling.mjs';
import {normalizeSemantics} from '../src/templates/semantics.mjs';
import {renderIconTokens} from '../src/templates/icons.mjs';
const pages=JSON.parse(fs.readFileSync('src/content/pages.json','utf8'));
const common=JSON.parse(fs.readFileSync('src/content/common.json','utf8'));
if(pages[0].slug!=='')throw new Error('Homepage must be the first route.');
fs.mkdirSync('dist',{recursive:true});
const assets=JSON.parse(fs.readFileSync('src/content/assets.json','utf8'));
for(const asset of assets){
 const destination='dist'+asset.local;
 fs.mkdirSync(destination.slice(0,destination.lastIndexOf('/')),{recursive:true});
 fs.copyFileSync('public'+asset.local,destination);
}
fs.copyFileSync('src/styles/site.css','dist/styles.css');
fs.copyFileSync('src/styles/content-system.css','dist/content-system.css');
fs.writeFileSync('dist/storytelling.css',fs.readFileSync('src/styles/storytelling.css','utf8')+'\n'+renderIconTokens()+fs.readFileSync('src/styles/interface.css','utf8'));
fs.copyFileSync('src/scripts/site.js','dist/app.js');
fs.writeFileSync('dist/motion.js',fs.readFileSync('src/scripts/work-viewport.js','utf8')+'\n'+fs.readFileSync('src/scripts/motion.js','utf8'));
fs.copyFileSync('src/scripts/sequence.js','dist/sequence.js');
fs.copyFileSync('src/scripts/contact.js','dist/contact.js');
fs.copyFileSync('src/styles/contact.css','dist/contact.css');
// Keep the existing stylesheet node and request; normalize type after page CSS.
fs.writeFileSync('dist/banners.css',fs.readFileSync('src/styles/banners.css','utf8')+'\n'+fs.readFileSync('src/styles/typography.css','utf8'));
fs.mkdirSync('dist/assets/fonts',{recursive:true});
for(const font of ['manrope-latin.woff2','Manrope-OFL.txt']){
 fs.copyFileSync('public/assets/fonts/'+font,'dist/assets/fonts/'+font);
}
for(const page of pages){
 const dir='dist/'+page.slug;fs.mkdirSync(dir,{recursive:true});
 const $=load(renderPage(page,common));
 const known=new Set(pages.map(p=>p.slug));
 $('a[href]').each((i,e)=>{
  const a=$(e);if(a.is('[data-official-form]'))return;
  const url=new URL(a.attr('href'),'https://acgafrica.com');
  const slug=url.pathname.replace(/^\/+|\/+$/g,'');
  if(url.hostname==='acgafrica.com'&&known.has(slug))a.attr('href','/'+(slug?slug+'/':'')+url.search+url.hash);
 });
 $('#navigation a').each((i,e)=>{if($(e).attr('href')==='/'+(page.slug?page.slug+'/':'')&&!$(e).attr('href').includes('#'))$(e).attr('aria-current','page');});
 if(!page.slug){
 $('head').append('<script src="/sequence.js" defer></script>');
 const title=$('.hero-title h1');
 if(title.text()!=='Industrialising Sport in Africa through Bankable Infrastructure Ecosystems')throw new Error('Unexpected hero source wording.');
 title.html('<span class="headline-line">Industrialising</span> <span class="headline-line headline-accent">Sport in Africa</span> <span class="headline-line headline-tail">through Bankable Infrastructure Ecosystems</span>');
 // Keep every original principle visible in a plain editorial list.
 $('.hero-context').insertAfter($('.hero-image'));
 const track=$('.failure-list > div').attr({id:'failure-track',tabindex:'0','aria-label':'The familiar failure'});
 track.children('div').each((i,e)=>$(e).attr({id:'failure-'+(i+1),'data-step':String(i)}));
 $('.sequence-controls').append('<button type="button" class="sequence-prev" aria-label="Previous failure point">&#8592;</button><span class="sequence-position" aria-live="polite" aria-atomic="true">01 / 04</span><button type="button" class="sequence-next" aria-label="Next failure point">&#8594;</button>');
 $('.action a').append('<svg class="arrow" aria-hidden="true" viewBox="0 0 24 24" width="24" height="24"><path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>');
 }
 refinePresentation($,page);
 addStorytelling($,page,assets);
 normalizeSemantics($);
 if($('[data-contact-form]').length)$('head').append('<link rel="stylesheet" href="/contact.css"><script src="/contact.js" type="module"></script>');
 $('head').append('<link rel="stylesheet" href="/banners.css">');
 $('head').append('<script src="/motion.js" defer></script>');
 $('img').each((i,element)=>{
  const img=$(element),file='dist'+img.attr('src'),bytes=fs.readFileSync(file);
  let width,height;
  if(bytes.subarray(1,4).toString()==='PNG'){
   width=bytes.readUInt32BE(16);height=bytes.readUInt32BE(20);
  }else if(bytes[0]===0xff&&bytes[1]===0xd8){
   let offset=2;
   while(offset+8<bytes.length){
    if(bytes[offset]!==0xff)break;
    const marker=bytes[offset+1],length=bytes.readUInt16BE(offset+2);
    if([0xc0,0xc1,0xc2].includes(marker)){height=bytes.readUInt16BE(offset+5);width=bytes.readUInt16BE(offset+7);break;}
    offset+=2+length;
   }
  }
  if(width&&height)img.attr({width,height});
  if(img.closest('.leader-photo').length)img.attr('alt',img.closest('.split').find('h2').first().text());
  if(img.closest('.hero-image').length)img.attr({loading:'eager',fetchpriority:'high'});
 });
 fs.writeFileSync(dir+'/index.html',$.html());
}
console.log(`Built ${pages.length} local pages with original source content.`);
