import fs from 'node:fs';
import assert from 'node:assert/strict';
import {load} from 'cheerio';
const pages=JSON.parse(fs.readFileSync('src/content/pages.json'));
const home=load(fs.readFileSync('dist/index.html'));
const who=load(fs.readFileSync('dist/who-we-are/index.html'));
const work=load(fs.readFileSync('dist/what-we-do/index.html'));
const model=load(fs.readFileSync('dist/victory-district/index.html'));
assert.deepEqual(home('.range-caption strong').map((i,e)=>home(e).text()).get(),['25 to 30','335 to 340']);
assert(home('[data-source-id="9c4c1ed"]').text().includes('25 to 30 event days a year'));
assert(home('[data-source-id="9c4c1ed"]').text().includes('335 to 340 days'));
who('.collaboration-map li').each((i,e)=>assert(who('[data-page-source="289b37a"]').text().includes(who(e).text()),'Diagram labels must come from the original consortium description'));
assert(who('[data-page-source="8d4af70"]').text().includes('2007'));
assert(who('[data-page-source="8d4af70"]').text().includes('over 300'));
assert.equal(who('.backing-proof figcaption').text(),'APO Group','Backing figures belong to APO Group');
assert.equal(work('[data-process-step]').length,6);
assert.equal(work('[data-process-marker]').length,6);
assert.equal(model('.ecosystem-diagram .model-verticals article').length,3);
for(const page of pages){
 const $=load(fs.readFileSync('dist/'+(page.slug?page.slug+'/':'')+'index.html'));
 assert.equal($('script[src="/motion.js"]').length,1,'Motion enhancement must load once per route');
 const compositions=$('main>[data-composition]').map((i,e)=>$(e).attr('data-composition')).get();
 assert(compositions.every(Boolean),'Every section needs an intentional composition');
 for(let i=1;i<compositions.length;i++)assert.notEqual(compositions[i],compositions[i-1],page.slug+': consecutive compositions should differ');
 assert.equal($('main [data-source-id][aria-hidden="true"],main [data-page-source][aria-hidden="true"]').length,0,'Original copy must remain accessible');
 if($('.article-body').length)assert.equal($('.story-opening .story-cover').length,1,'Article imagery belongs with its own title');
}
console.log('PASS: original infographic facts, meaningful section variation, source accessibility and sitewide motion loading.');
