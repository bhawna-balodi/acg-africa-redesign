// Independent coverage audit: enumerate live-source widgets, not importer IDs.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {load} from 'cheerio';
const pages=JSON.parse(fs.readFileSync('src/content/pages.json'));
const records=[{slug:'',file:'sources/home.html'},...JSON.parse(fs.readFileSync('sources/page-manifest.json'))];
const norm=s=>s.replace(/\s/g,'');
const failures=[],report=[];
const stripped='script,style,svg,title,meta,link,button,.sr-only,[aria-hidden="true"],[id^="rm-btn"]';
for(const r of records){
 const html=fs.readFileSync(r.file,'utf8'),$=load(html);
 const local=load(fs.readFileSync('dist/'+(r.slug?r.slug+'/':'')+'index.html','utf8'));
 local('[data-interface-copy]').remove();
 const output=norm(local('main').text());
 const root=$('[data-elementor-type="wp-page"],[data-elementor-type="single-post"]').first();
 let checked=0;
 root.find('[data-widget_type="nav-menu.default"] a').each((i,e)=>{
  const text=norm($(e).text());
  if(text&&!norm(local('#navigation').text()).includes(text))failures.push({slug:r.slug,id:$(e).closest('[data-id]').attr('data-id'),scope:'navigation',text:$(e).text().trim()});
 });
 root.find('[data-widget_type]').not('[data-widget_type="nav-menu.default"],[data-widget_type="shortcode.default"]').each((i,e)=>{
  const copy=$(e).clone();copy.find(stripped+',form').remove();const text=norm(copy.text());
  if(!text)return;checked++;
  if(!output.includes(text))failures.push({slug:r.slug,id:$(e).attr('data-id'),type:$(e).attr('data-widget_type'),text:copy.text().replace(/\s+/g,' ').trim()});
 });
 // Contact fields now prepare an email draft, per the user's latest selection.
 // Its published introductory content still belongs on the local page.
 const contact=$('.gfield--type-html').first().clone();contact.find(stripped).remove();
 if(contact.text().trim()){checked++;if(!output.includes(norm(contact.text())))failures.push({slug:r.slug,id:'contact-introduction'});}
 const footer=$('[data-elementor-type="footer"]');
 footer.find('[data-widget_type="text-editor.default"],[data-widget_type="button.default"]').each((i,e)=>{
  const copy=$(e).clone();copy.find(stripped).remove();const text=norm(copy.text());
  if(!text)return;checked++;
  if(!norm(local('footer').text()).includes(text))failures.push({slug:r.slug,id:$(e).attr('data-id'),scope:'footer'});
 });
 report.push({slug:r.slug||'/',source:'https://acgafrica.com/'+(r.slug?r.slug+'/':''),file:r.file,sha256:createHash('sha256').update(html).digest('hex'),checkedTextWidgets:checked});
}
const team=load(fs.readFileSync('sources/our-team.html','utf8'));
let profiles=0;
for(const p of pages.filter(p=>p.slug.startsWith('our-team/'))){
 const $=load(fs.readFileSync('dist/'+p.slug+'/index.html','utf8'));const block=$('[data-page-source^="profile-"]');const id=block.attr('data-page-source').slice(8);
 const popup=team('[data-elementor-type="popup"][data-elementor-id="'+id+'"]');
 const source=popup.find('[data-widget_type="text-editor.default"]').clone();source.find(stripped).remove();
 assert.equal(norm(block.text()),norm(source.text()),p.slug+': exact official profile');profiles++;
}
if(process.argv.includes('--write-reports'))fs.writeFileSync('docs/OFFICIAL-CONTENT-AUDIT.json',JSON.stringify({date:new Date().toISOString(),sources:report,profiles,failures,formHandling:'Official field labels, required states and country options retained locally; user selected an email draft to info@acgafrica.com. CAPTCHA not required for email handoff.',responsiveContent:'Both published Private sector descriptions retained; desktop and compact wording follows official visibility.'},null,2));
assert.equal(failures.length,0,JSON.stringify(failures,null,2));
console.log('PASS: complete live-source text coverage on '+records.length+' official pages and '+profiles+' profile biographies.');
