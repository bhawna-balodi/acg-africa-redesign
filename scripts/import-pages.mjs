import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {load} from 'cheerio';
import {renderContactForm} from '../src/templates/contact-form.mjs';
const records=JSON.parse(fs.readFileSync('sources/page-manifest.json'));
const pages=JSON.parse(fs.readFileSync('src/content/pages.json')).filter(p=>p.slug==='');
const assets=new Map(JSON.parse(fs.readFileSync('src/content/assets.json')).map(a=>[a.source,a.local]));
const provenance=[];
const formSource=load(fs.readFileSync('sources/contact-us.html','utf8'));
const specifications=[['1','firstName','text','given-name',false],['3','lastName','text','family-name',false],['10','email','email','email',true],['12','message','textarea','',true],['7','countryCode','select','tel-country-code',false],['8','phone','tel','tel-national',false]];
const formSchema={
 requiredLegend:formSource('.gform_required_legend').first().text().trim(),
 submit:formSource('#gform_submit_button_1').attr('value'),
 defaultCountry:formSource('#input_1_7 option').first().attr('value'),
 fields:specifications.map(([id,key,type,autocomplete,fullWidth])=>{
  const label=formSource('#field_1_'+id+' .gfield_label').first().clone();label.find('.gfield_required').remove();
  return {key,type,autocomplete,fullWidth,label:label.text().trim(),required:true,...(type==='select'?{options:formSource('#input_1_'+id+' option').map((i,e)=>({value:formSource(e).attr('value')||'',text:formSource(e).text()})).get()}:{})};
 })
};
fs.writeFileSync('src/content/contact-form.json',JSON.stringify(formSchema,null,2));
const norm=s=>s.replace(/\s+/g,' ').trim();
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function localRoute(href){
 if(!href||href.startsWith('#'))return href;
 const url=new URL(href,'https://acgafrica.com');
 if(url.hostname==='acgafrica.com'&&!url.pathname.startsWith('/wp-')){
  const slug=url.pathname.replace(/^\/+|\/+$/g,'');
  if(!slug||records.some(r=>r.slug===slug))return '/'+(slug?slug+'/':'')+url.search+url.hash;
 }
 return url.href;
}
function asset(url){if(!url)return '';url=new URL(url,'https://acgafrica.com').href;if(!assets.has(url))assets.set(url,'/assets/original/'+createHash('sha256').update(url).digest('hex').slice(0,12)+'-'+path.basename(new URL(url).pathname));return assets.get(url);}
function clean(html){
 const $=load('<div id="clean">'+html+'</div>',null,false),root=$('#clean');
 root.find('script,style,svg,meta,title,link,form,button,.acgx-nav,.sr-only,[aria-hidden="true"],[id^="rm-btn"]').remove();
 root.find('.rm-extra').each((i,e)=>$(e).replaceWith($(e).contents()));
 root.find('*').each((i,e)=>{const n=$(e),href=n.attr('href'),src=n.attr('src'),alt=n.attr('alt')||'',cls=n.attr('class')||'';
  for(const k of Object.keys(e.attribs))n.removeAttr(k);
  if(cls)n.attr('class',cls.split(' ').filter(c=>/^(acgx-|gates|steps|apoc-|elementor-icon-box|elementor-icon-list|elementor-post|elementor-screen-only)/.test(c)).join(' '));
  if(e.tagName==='a'){
   if(!href||href.includes('elementor-action')||href.startsWith('javascript:'))n.replaceWith(n.contents());else n.attr('href',localRoute(href));
  }
  if(e.tagName==='img')n.attr({src:asset(src),alt,loading:'lazy',decoding:'async'});
  if(e.tagName==='iframe')n.attr({src,title:'Video',loading:'lazy',allowfullscreen:''});
 });return root.html();
}
let $,current;
function w(id,tag){
 const n=$(`[data-id="${id}"]`).first();if(!n.length)throw Error('Missing '+current.slug+':'+id);
 let html=clean(n.find('>.elementor-widget-container').html()??n.html());
 if(tag)html=`<${tag}>${esc(norm(load(html,null,false).text()))}</${tag}>`;
 provenance.push({slug:current.slug,id,text:norm(load(html,null,false).text())});
 return `<div class="page-block" data-page-source="${id}">${html}</div>`;
}
const section=(body,cls='',id='')=>`<section class="inner-section ${cls}"${id?` id="${id}"`:''}><div class="wrap">${body}</div></section>`;
const intro=(title,desc)=>section(title+desc,'page-intro');
const row=(title,body)=>`<div class="editorial-row"><div>${title}</div><div class="prose">${body}</div></div>`;
const action=html=>`<div class="page-actions">${html}</div>`;
for(const record of records){
 current=record;$=load(fs.readFileSync(record.file,'utf8'));let body='';
 const slug=record.slug;
 if(slug==='who-we-are'){
  body=intro(w('74b4da0','h1'),w('a18604f')+action(w('3e18676')+w('eb0ff41')));
  body+=section(row(w('1de6558','h2'),w('289880c','h3')+w('2907031')+action(w('975c81e')))+row(w('3980b80','h2'),w('a7b340c','h3')+w('289b37a'))+row(w('47a1a4d','h2'),w('7895466','h3')+w('8d4af70'))+row(w('363c6c8','h2'),w('cd4115d','h3')+w('1d1449e')+action(w('36b0d69'))));
  body+=section(w('13d6c37'),'platform-section');
 }else if(slug==='what-we-do'){
  body=intro(w('88292e1','h1'),w('2f67c93'))+section(w('4142626'),'process-section')+section(w('c531741','h2')+w('746db41'))+section(row(w('f9622b0','h2'),w('493cbe3')+action(w('3603959'))),'feature-section');
 }else if(slug==='victory-district'){
  body=intro(w('c126568','h1'),w('b7e7f38'));
  body+=section(row(w('bef884a','h2'),w('644f0ff')+w('5fc98b9')+w('537ede8'))+row(w('f54164c','h2'),w('7e9cd87')+w('0819a32')+w('0421f19')));
  body+=section(row(w('6fd0be5','h2'),w('0e71bb1')+w('e501cd5')),'feature-section');
  body+=section(w('55097c5','h2')+`<div class="prose">${w('2a853e3')}</div><div class="vertical-grid">`+[['8e89583','7fe0508'],['a76f318','484c89b'],['867392d','56c48a1']].map(([h,p])=>`<article>${w(h,'h3')+w(p)}</article>`).join('')+'</div>'+row(w('4977219','h3'),w('a7936a9'))+w('439e846','h3'));
  body+=section(w('5da2d04','h2')+w('c0ae67a')+'<div class="vertical-grid stakeholders">'+['1790f8c','adcbd0f','387a125','df3ff1b','3620511'].map(id=>`<article>${id==='387a125'?`<div class="source-desktop">${w(id)}</div><div class="source-compact">${w('cb7b7c0')}</div>`:w(id)}</article>`).join('')+'</div>'+action(w('0ff58c7')),'feature-section');
 }else if(slug==='our-team'){
  body=intro(w('365a7d8','h1'),w('3864f07'));
  for(const [container,heading,photo,name,role,bio,link] of [['founder-and-executive-chairman','dfda882','ec4c563','0d689b5','ff4a67e','cb4e749','04335ee'],['founding-chief-executive-officer','a0fe1fa','6eaa80b','e72a3f1','4a1151f','44b3e25','acec944']]){
   body+=section(w(heading,'h2')+`<div class="leader-layout"><div class="leader-image">${w(photo)}</div><div class="prose">${w(name,'h3')+w(role)+w(bio)+w(link)}</div></div>`,'leader-section',container);
  }
  for(const [id,anchor] of [['cc7f720','our-advisory-board'],['d29d2ce','our-research-and-impact-advisory-panel']]){
   const widgets=$(`[data-id="${id}"] [data-widget_type]`).toArray();
   let content=w($(widgets[0]).attr('data-id'),'h2')+`<div class="prose">${w($(widgets[1]).attr('data-id'))}</div><div class="people-grid">`;
   for(let i=2;i<widgets.length;i+=3){const photo=$(widgets[i]),name=$(widgets[i+1]),role=$(widgets[i+2]);let link=photo.closest('a[href]').attr('href');
    if(link?.includes('elementor-action')){
     const encoded=decodeURIComponent(link).split('settings=')[1];
     const popupId=JSON.parse(Buffer.from(encoded,'base64').toString()).id;
     const popup=$(`[data-elementor-type="popup"][data-elementor-id="${popupId}"]`);
     if(!popup.length)throw Error('Missing team profile '+popupId);
     const profileSlug='our-team/'+norm(name.text()).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
     link='/'+profileSlug+'/';
     const profileTitle=norm(popup.find('[data-widget_type="heading.default"]').first().text());
     const profileCopy=popup.find('[data-widget_type="text-editor.default"]').map((i,e)=>clean($(e).find('>.elementor-widget-container').html()??$(e).html())).get().join('');
     const profileBody=intro('<h1>'+esc(profileTitle)+'</h1>','<a class="text-link" href="/our-team/#our-advisory-board">← Our Advisory Board</a>')+section(`<div class="leader-layout"><div class="leader-image">${clean(photo.html())}</div><div class="prose" data-page-source="profile-${popupId}">${profileCopy}</div></div>`);
     provenance.push({slug:profileSlug,id:'profile-'+popupId,text:norm(load(profileCopy,null,false).text())});
     pages.push({slug:profileSlug,title:profileTitle,description:norm(role.text()),body:profileBody,inner:true,source:'https://acgafrica.com/our-team/'});
    }
    content+=`<article class="person">${link?`<a href="${esc(localRoute(link))}">`:''}${w(photo.attr('data-id'))+w(name.attr('data-id'),'h3')+w(role.attr('data-id'))}${link?'</a>':''}</article>`;
   }
   body+=section(content+'</div>','people-section',anchor);
  }
 }else if(slug==='acg-news'){
  body=intro(w('92e1515','h1'),w('5292063'));
  const cards=$('.apoc-card').map((i,e)=>`<article class="news-card">${clean($(e).html())}</article>`).get().join('');
  provenance.push({slug,id:'news-cards',text:norm(load(cards,null,false).text())});
  body+=section('<div class="news-grid" data-page-source="news-cards">'+cards+'</div>');
 }else if(slug==='contact-us'){
  const info=$('.gfield--type-html').first();
  const markup=clean(info.html()||'');const h=load(markup,null,false);h('h1,h2,h3').first().replaceWith('<h1>'+esc(h('h1,h2,h3').first().text()||'Get in Touch')+'</h1>');
  body=section('<div class="contact-introduction">'+h.html()+'</div>'+renderContactForm(formSchema,'contact-us'),'page-intro contact-page contact-form-section');
 }else{
  const title=$('[data-widget_type="theme-post-title.default"]').first(),content=$('[data-widget_type="theme-post-content.default"]').first(),photo=$('[data-widget_type="theme-post-featured-image.default"]').first();
  if(!title.length||!content.length)throw Error('Unrecognised article '+slug);
  const share=load(w('2364451f'),null,false);
  const icons=$('[data-id="2364451f"] svg').toArray();
  share('.elementor-icon-list-icon').each((i,e)=>share(e).append($(icons[i]).prop('outerHTML')||''));
  body=section('<div class="article-return">'+w('5802990')+'</div>'+w(title.attr('data-id'),'h1'),'page-intro article-intro')
   +section(`<div class="article-photo">${w(photo.attr('data-id'))}</div><div class="article-prose">${w(content.attr('data-id'))}</div><div class="article-share">${w('5ca6ebf','h2')+share.html()}</div>`,'article-body')
   +section(w('7209f22b','h2')+w('c58a13d'),'article-related')
   +section(w('2e850037'),'article-navigation');
 }
 if(['who-we-are','our-team'].includes(slug)){
  const contact=clean($('.gfield--type-html').first().html()||'');
  provenance.push({slug,id:'contact-intro',text:norm(load(contact,null,false).text())});
  body+=section(`<div class="contact-introduction"><div class="prose" data-page-source="contact-intro">${contact}</div></div>`+renderContactForm(formSchema,slug),'feature-section contact-form-section');
 }
 const photography={
  'who-we-are':'https://acgafrica.com/wp-content/uploads/2026/01/Group-148230.png',
  'what-we-do':'https://acgafrica.com/wp-content/uploads/2025/10/Group-253-1.png',
  'victory-district':'https://acgafrica.com/wp-content/uploads/2026/01/Group-148227.png'
 };
 const parsed=load(body);
 if(photography[slug])parsed('.page-intro .wrap').append(`<figure class="page-cover"><img src="${asset(photography[slug])}" alt="" loading="eager"></figure>`);
 body=parsed('body').html();
 const title=norm(parsed('h1').text());
 pages.push({slug,title,description:$('meta[name="description"]').attr('content')||title,source:'https://acgafrica.com/'+slug+'/',body,inner:true});
}
fs.writeFileSync('src/content/pages.json',JSON.stringify(pages,null,2));
fs.writeFileSync('src/content/assets.json',JSON.stringify([...assets].map(([source,local])=>({source,local})),null,2));
fs.writeFileSync('src/content/page-provenance.json',JSON.stringify(provenance,null,2));
console.log(`Imported ${pages.length} pages with ${provenance.length} additional source fragments.`);
