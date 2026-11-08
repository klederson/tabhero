// Run behind HTTPS and an upstream rate limiter. Node 22+, no dependencies.
import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { collect } from './handler.mjs';
export function createCollector(env=process.env,{fetcher=fetch}={}) {
 return createServer({requestTimeout:5000,headersTimeout:5000,maxHeaderSize:8192},async(req,res)=>{
  try{
   if(req.url!=='/events'){res.writeHead(404,{'Cache-Control':'no-store'}).end();return;}
   const request=new Request('https://collector.invalid/events',{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body:Readable.toWeb(req),duplex:'half'})});
   const result=await collect(request,env,{fetcher});
   res.writeHead(result.status,Object.fromEntries(result.headers));res.end();
  }catch{res.writeHead(400,{'Cache-Control':'no-store'}).end();}
 });
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 const port=Number(process.env.ANALYTICS_PORT||8787);
 createCollector().listen(port,'127.0.0.1');
}
