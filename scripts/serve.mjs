import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve('dist');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};
http.createServer((request,response)=>{
 try{
  const pathname=decodeURIComponent(new URL(request.url,'http://127.0.0.1').pathname);
  let file=path.resolve(root,'.'+pathname);
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
   response.writeHead(404,{'Content-Type':'text/plain'}).end('Not found');return;
  }
  response.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
  fs.createReadStream(file).pipe(response);
 }catch{response.writeHead(400).end('Bad request');}
}).listen(4173,'0.0.0.0',()=>{console.log('Local:   http://localhost:4173/');console.log('Network: http://192.168.0.183:4173/')});

