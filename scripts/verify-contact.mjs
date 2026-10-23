import fs from 'node:fs';
import assert from 'node:assert/strict';
import {load} from 'cheerio';
import {buildEmailDraft,initializeContactForms} from '../src/scripts/contact.js';
const source=load(fs.readFileSync('sources/contact-us.html','utf8'));
const schema=JSON.parse(fs.readFileSync('src/content/contact-form.json'));
const normalize=s=>s.replace(/\s/g,'');
const sourceIds=['1','3','10','12','7','8'];
for(const slug of ['contact-us','who-we-are','our-team']){
 const $=load(fs.readFileSync('dist/'+slug+'/index.html','utf8')),form=$('[data-contact-form]');
 assert.equal(form.length,1);assert.equal(form.attr('action'),'mailto:info@acgafrica.com');
 const fields=form.find('[data-contact-field]');assert.equal(fields.length,6);
 fields.each((i,e)=>{
  const field=$(e),label=form.find('label[for="'+field.attr('id')+'"]');
  assert.equal(normalize(label.text()),normalize(source('#field_1_'+sourceIds[i]+' .gfield_label').text()),slug+' exact official label');
  assert(field.is('[required][aria-required="true"]'));
  assert(form.find('#'+field.attr('aria-describedby')).length);
 });
 const options=form.find('select option').map((i,e)=>({text:$(e).text(),value:$(e).attr('value')})).get();
 assert.deepEqual(options,schema.fields.find(f=>f.key==='countryCode').options);
 assert.equal(form.find('select option[selected]').attr('value'),'South Africa: +27');
 assert.equal(form.find('.contact-required').text(),source('.gform_required_legend').text());
 const submit=form.find('[type="submit"]').clone();submit.find('[aria-hidden]').remove();assert.equal(submit.text().trim(),'Submit');
 assert.equal(form.find('[data-sitekey],iframe').length,0,'No fake CAPTCHA or external form iframe');
 assert.equal($('script[src="/contact.js"]').length,1);assert.equal($('[data-official-form]').length,0);
 assert.equal(form.find('[role="status"][aria-live="polite"]').length,1,'Retain the dynamic enquiry status region');
}
const values={firstName:'A & B',lastName:'Sample',email:'example@example.test',countryCode:'South Africa: +27',phone:'012 345 6789',message:'First line\nSecond line & question? # / '+String.fromCodePoint(0xE9)};
const draft=buildEmailDraft(values),url=new URL(draft.url);
assert.equal(url.protocol,'mailto:');assert.equal(url.pathname,'info@acgafrica.com');
assert.equal(url.searchParams.get('body'),draft.body);assert.equal(url.searchParams.size,2);
for(const value of Object.values(values))assert(draft.body.includes(value));
assert(!draft.url.includes('\n'));assert(draft.body.includes('Your Message:\r\n'));
console.log('PASS: official contact fields/options, native email fallback and correctly encoded email draft.');

// Exercise Submit with an isolated email editor, never the operating system.
const listeners={},errors=new Map();
const fields=schema.fields.map(f=>({id:'test-'+f.key,dataset:{contactField:f.key},value:values[f.key],custom:'',attributes:{},
 setCustomValidity(v){this.custom=v},get validity(){return {valid:!this.custom&&!!this.value.trim()}},get validationMessage(){return this.custom},
 setAttribute(k,v){this.attributes[k]=v},getAttribute(k){return this.attributes[k]},addEventListener(){},focus(){this.focused=true}}));
const status={textContent:''},copy={hidden:true,addEventListener(){}},fallback={hidden:true};
const form={querySelectorAll:()=>fields,querySelector(selector){if(selector==='.contact-status')return status;if(selector==='[data-copy-enquiry]')return copy;if(selector==='.contact-copy-fallback')return fallback;if(!errors.has(selector))errors.set(selector,{textContent:''});return errors.get(selector)},addEventListener(k,v){listeners[k]=v},reportValidity(){this.reported=true}};
const originalWindow=globalThis.window;globalThis.window={location:{href:''}};
try{
 initializeContactForms({querySelectorAll:()=>[form]});
 let prevented=false;listeners.submit({preventDefault(){prevented=true}});
 assert(prevented);assert.equal(window.location.href,draft.url);
 assert.deepEqual(Object.fromEntries(fields.map(f=>[f.dataset.contactField,f.value])),values,'Submit must preserve entered values');
 assert(status.textContent.includes('Send the email to complete it'));
 window.location.href='';fields[0].value='   ';listeners.submit({preventDefault(){}});
 assert.equal(window.location.href,'');assert(form.reported&&fields[0].focused,'Incomplete drafts must not open');
}finally{if(originalWindow===undefined)delete globalThis.window;else globalThis.window=originalWindow;}
console.log('PASS: Submit opens only the prepared email draft, preserves inputs and blocks incomplete enquiries.');
