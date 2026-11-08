// Server-side only. Never bundle this directory into a browser extension.
// No logging, cookies, client database, persistent visitor IDs, IP forwarding or request retries.
import { randomUUID } from 'node:crypto';
const events = new Set(['panel_open','saved_reply_use','ai_suggest','ai_error','manual_reply_success','manual_reply_error','conversation_open','conversation_error','bridge_open','bridge_setup','bridge_pause','bridge_resume','bridge_disconnect','bridge_error']);
export async function collect(request,env,{fetcher=fetch}={}) {
 const headers={'Cache-Control':'no-store','Vary':'Origin'};
 const origin=request.headers.get('origin');
 if(origin&&!/^(chrome-extension:\/\/[a-p]{32}|moz-extension:\/\/[a-f0-9-]{36})$/.test(origin))return new Response(null,{status:403,headers});
 if(origin)headers['Access-Control-Allow-Origin']=origin;
 headers['Access-Control-Allow-Methods']='POST, OPTIONS';
 headers['Access-Control-Allow-Headers']='Content-Type';
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(request.method!=='POST')return new Response(null,{status:405,headers});
 if(!/^G-[A-Z0-9]+$/.test(env.GA_MEASUREMENT_ID||'')||!env.GA_API_SECRET||!['tabhero','relayers-bridge'].includes(env.PRODUCT))return new Response(null,{status:503,headers});
 if(!request.headers.get('content-type')?.startsWith('application/json'))return new Response(null,{status:415,headers});
 // Stream bound also applies when Content-Length is absent or misleading.
 const reader=request.body?.getReader();
 if(!reader)return new Response(null,{status:400,headers});
 const chunks=[];let size=0;
 try {
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>512){await reader.cancel();return new Response(null,{status:413,headers});}chunks.push(value);}
 }catch{return new Response(null,{status:400,headers});}
 let data;
 try{data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks)));}
 catch{return new Response(null,{status:400,headers});}
 if(!data||Array.isArray(data)||Object.keys(data).sort().join(',')!=='browser,event,version'||!events.has(data.event)||!['chrome','firefox'].includes(data.browser)||typeof data.version!=='string'||!/^\d+(?:\.\d+){0,3}$/.test(data.version)||data.version.length>24)return new Response(null,{status:400,headers});
 const endpoint=new URL('https://www.google-analytics.com/mp/collect');
 endpoint.searchParams.set('measurement_id',env.GA_MEASUREMENT_ID);endpoint.searchParams.set('api_secret',env.GA_API_SECRET);
 // Fresh, unrelated ID per event. GA users/sessions/retention metrics are not meaningful here.
 const payload={client_id:randomUUID(),consent:{ad_user_data:'DENIED',ad_personalization:'DENIED'},events:[{name:data.event,params:{product:env.PRODUCT,extension_browser:data.browser,extension_version:data.version}}]};
 try{
  const response=await fetcher(endpoint.href,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),credentials:'omit',redirect:'error',signal:AbortSignal.timeout(2500)});
  return new Response(null,{status:response.ok?204:502,headers});
 }catch{return new Response(null,{status:502,headers});}
}
