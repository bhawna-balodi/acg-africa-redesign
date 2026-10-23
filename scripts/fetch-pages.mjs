import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {load} from 'cheerio';
const main=['who-we-are','what-we-do','victory-district','our-team','acg-news','contact-us'];
const records=[];
fs.mkdirSync('sources/articles',{recursive:true});
async function download(url,file){
 const response=await fetch(url);if(!response.ok)throw Error(`${response.status}: ${url}`);
 const text=await response.text();fs.writeFileSync(file,text);return text;
}
for(const slug of main){
 const file=`sources/${slug==='acg-news'?'news':slug}.html`;
 await download(`https://acgafrica.com/${slug}/`,file);
 records.push({slug,file});
}
const queue=new Set();
function discover(html){const $=load(html);$('[data-elementor-type="wp-page"] a[href], .entry-content a[href]').each((i,e)=>{
 const href=$(e).attr('href');if(!href||href.startsWith('#'))return;
 const u=new URL(href,'https://acgafrica.com/');
 if(u.hostname!=='acgafrica.com'||u.search||u.pathname==='/'||u.pathname.startsWith('/wp-'))return;
 const slug=u.pathname.replace(/^\/+|\/+$/g,'');
 if(!main.includes(slug)&&!slug.includes('.')&&!slug.startsWith('category/')&&!slug.startsWith('tag/'))queue.add(slug);
 });}
for(const r of records)discover(fs.readFileSync(r.file,'utf8'));
for(const slug of queue){
 const file=`sources/articles/${createHash('sha256').update(slug).digest('hex').slice(0,16)}.html`;
 await download(`https://acgafrica.com/${slug}/`,file);records.push({slug,file});
 console.log(`Fetched article ${records.length-main.length}`);
}
fs.writeFileSync('sources/page-manifest.json',JSON.stringify(records,null,2));
console.log(`Fetched ${records.length} pages.`);
