import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
const queue=JSON.parse(fs.readFileSync('src/content/assets.json','utf8'));
let completed=0;
async function worker(){
 while(queue.length){
  const item=queue.shift(),file='public'+item.local;
  if(fs.existsSync(file)&&fs.statSync(file).size>100){completed++;continue;}
  fs.mkdirSync(path.dirname(file),{recursive:true});
  await new Promise((resolve,reject)=>{
   const p=spawn('curl.exe',['-L','--fail','--silent','--show-error','--retry','2',item.source,'-o',file],{stdio:['ignore','ignore','pipe']});
   let error='';p.stderr.on('data',d=>error+=d);
   p.on('error',reject);p.on('close',code=>code?reject(Error(`${item.source}: ${error}`)):resolve());
  });completed++;
 }
}
await Promise.all(Array.from({length:4},worker));
console.log(`Downloaded ${completed} original assets.`);
