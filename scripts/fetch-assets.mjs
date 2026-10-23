import fs from 'node:fs';
const assets=JSON.parse(fs.readFileSync('src/content/assets.json'));
const missing=assets.filter(a=>!fs.existsSync('public'+a.local));
for(let i=0;i<missing.length;i+=4){await Promise.all(missing.slice(i,i+4).map(async a=>{
 const r=await fetch(a.source);if(!r.ok)throw Error(`${r.status}: ${a.source}`);
 fs.writeFileSync('public'+a.local,Buffer.from(await r.arrayBuffer()));
}));console.log(`Downloaded ${Math.min(i+4,missing.length)}/${missing.length}`);}
