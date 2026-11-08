import test from 'node:test';
import assert from 'node:assert/strict';
import {createUsageStatistics,consentKey,collectorOrigin} from '../extension/analytics.js';
import {collect} from '../analytics-collector/handler.mjs';

function fixture({firefox=false,permission=true,consent=false,configured=true}={}){
 const data={[consentKey]:{enabled:consent,at:1000000}};
 const changed=[],removed=[],requests=[];
 let native=permission;
 const api={
  runtime:{getManifest:()=>({version:'1.2.3',...(firefox?{browser_specific_settings:{gecko:{id:'fixture'}}}:{})})},
  storage:{local:{get:async key=>({[key]:data[key]}),set:async patch=>{Object.assign(data,patch);}},onChanged:{addListener:fn=>changed.push(fn)}},
  permissions:{getAll:async()=>firefox?{data_collection:native?['technicalAndInteraction']:[]}:{},contains:async()=>permission,onRemoved:{addListener:fn=>removed.push(fn)}}
 };
 const client=createUsageStatistics(api,{config:{collectorUrl:configured?'https://statistics.test/events':''},now:()=>1000000,fetcher:async(url,options)=>{requests.push({url,options});return new Response(null,{status:204});}});
 return {api,data,client,requests,revokeNative:()=>{native=false;for(const fn of removed)fn({});}};
}
test('default, website preferences, absent config, private contexts and unknown event names cannot transmit',async()=>{
 const f=fixture();
 f.data['tabhero:analytics-consent:v1']={value:'accepted',at:1000000};
 assert.equal(await f.client.track('panel_open'),false);assert.deepEqual(f.requests,[]);
 assert.equal((await f.client.setConsent(true)).enabled,true);
 assert.equal(await f.client.track('PRIVATE message SECRET'),false);
 assert.equal(await f.client.track('panel_open',{incognito:true}),false);
 const inactive=fixture({consent:true,configured:false});assert.equal(await inactive.client.track('panel_open'),false);assert.deepEqual(inactive.requests,[]);
 const denied=fixture({permission:false,consent:true});assert.equal(await denied.client.track('panel_open'),false);
});
test('only counts and bounded technical labels are sent after explicit opt-in; no cookies/referrer or replay',async()=>{
 const f=fixture();await f.client.setConsent(true);
 await f.client.track('panel_open');await f.client.track('panel_open');await f.client.track('saved_reply_use');
 assert.equal(f.requests.length,2);
 for(const {url,options}of f.requests){assert.equal(url,'https://statistics.test/events');assert.deepEqual(Object.keys(JSON.parse(options.body)).sort(),['browser','event','version']);assert.equal(options.credentials,'omit');assert.equal(options.referrerPolicy,'no-referrer');assert.equal(options.redirect,'error');assert.equal(JSON.parse(options.body).browser,'chrome');}
 await f.client.setConsent(false);
 assert.equal(await f.client.track('manual_reply_success'),false);
 assert.equal(f.requests.length,2);
 await f.client.setConsent(true);assert.equal(f.requests.length,2,'No historical backfill on opt-in');
});
test('Firefox requires both local consent and its live native permission',async()=>{
 const f=fixture({firefox:true,consent:false});
 assert.equal(await f.client.track('panel_open'),false);
 await f.client.setConsent(true);assert.equal(await f.client.track('panel_open'),true);
 f.revokeNative();assert.equal(await f.client.track('manual_reply_success'),false);
 assert.equal(f.requests.length,1);
 const legacy=fixture({firefox:true,consent:true});legacy.api.permissions.getAll=async()=>({});
 assert.equal(await legacy.client.track('panel_open'),false);
});
test('withdrawal cancels in-flight requests and wins against a pending permission check',async()=>{
 const f=fixture({consent:true});let unblock;
 f.api.permissions.getAll=()=>new Promise(resolve=>{unblock=resolve;});
 const pending=f.client.track('panel_open');
 await new Promise(resolve=>setImmediate(resolve));
 const withdraw=f.client.setConsent(false);
 f.api.permissions.getAll=async()=>({});
 unblock({});
 await withdraw;assert.equal(await pending,false);assert.deepEqual(f.requests,[]);
 const active=fixture({consent:true});let observed;
 const client=createUsageStatistics(active.api,{config:{collectorUrl:'https://statistics.test/events'},now:()=>1000000,fetcher:async(_,options)=>{observed=options.signal;return new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new Error('aborted'))));}});
 const sending=client.track('panel_open');
 await new Promise(resolve=>setImmediate(resolve));assert.ok(observed);
 await client.setConsent(false);assert.equal(observed.aborted,true);assert.equal(await sending,false);
});
test('expired consent and a transport outage fail closed without a retry',async()=>{
 const f=fixture({consent:true});f.data[consentKey].at=-181*86400*1000;
 assert.equal(await f.client.track('panel_open'),false);
 let attempts=0;
 const broken=createUsageStatistics(f.api,{config:{collectorUrl:'https://statistics.test/events'},now:()=>1000000,fetcher:async()=>{attempts++;throw new Error('PRIVATE SECRET');}});
 await broken.setConsent(true);assert.equal(await broken.track('panel_open'),false);assert.equal(attempts,1);
 assert.equal(collectorOrigin({collectorUrl:'https://user:SECRET@host.test/events'}),null);
 assert.equal(collectorOrigin({collectorUrl:'http://host.test/events'}),null);
});
const env={GA_MEASUREMENT_ID:'G-TEST123456',GA_API_SECRET:'server-only-secret',PRODUCT:'tabhero'};
const request=data=>new Request('https://collector.test/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
test('collector rejects unknown fields, free text, oversized bodies and web-page origins before forwarding',async()=>{
 let calls=0;const options={fetcher:async()=>{calls++;return new Response(null,{status:204});}};
 for(const data of [{event:'panel_open',browser:'chrome',version:'1.0',text:'PRIVATE'},{event:'PRIVATE',browser:'chrome',version:'1.0'},{event:'panel_open',browser:'chrome',version:'SECRET'},['panel_open']]){
  assert.equal((await collect(request(data),env,options)).status,400);
 }
 assert.equal((await collect(request({text:'a'.repeat(1024)}),env,options)).status,413);
 const web=request({event:'panel_open',browser:'chrome',version:'1.0'});web.headers.set('Origin','https://web.whatsapp.com');
 assert.equal((await collect(web,env,options)).status,403);assert.equal(calls,0);
 assert.equal((await collect(request({event:'panel_open',browser:'chrome',version:'1.0'}),{},options)).status,503);
});
test('collector reconstructs every GA event, hides server secret and uses unrelated event identities',async()=>{
 const forwarded=[];
 const options={fetcher:async(url,init)=>{forwarded.push({url,payload:JSON.parse(init.body)});return new Response(null,{status:204});}};
 for(let i=0;i<2;i++){
  const req=request({event:'panel_open',browser:'firefox',version:'1.0'});
  req.headers.set('x-forwarded-for','PRIVATE-IP');req.headers.set('cookie','PRIVATE');req.headers.set('referer','https://PRIVATE');
  const response=await collect(req,env,options);
  assert.equal(response.status,204);assert.equal(await response.text(),'');
  assert.doesNotMatch(JSON.stringify(Object.fromEntries(response.headers)),/server-only-secret/);
 }
 assert.notEqual(forwarded[0].payload.client_id,forwarded[1].payload.client_id);
 const {payload,url}=forwarded[0];
 assert.equal(new URL(url).searchParams.get('api_secret'),env.GA_API_SECRET);
 assert.deepEqual(payload.events,[{name:'panel_open',params:{product:'tabhero',extension_browser:'firefox',extension_version:'1.0'}}]);
 assert.doesNotMatch(JSON.stringify(payload),/PRIVATE|secret|user_id|ip_override|page_location/);
});


test('withdrawing while an enable request is pending cannot turn sharing back on', async()=>{
 const f=fixture();let unblock;
 f.api.permissions.getAll=()=>new Promise(resolve=>{unblock=resolve;});
 const enable=f.client.setConsent(true);
 await new Promise(resolve=>setImmediate(resolve));
 f.api.permissions.getAll=async()=>({});
 await f.client.setConsent(false);
 unblock({});await enable;
 assert.equal(f.data[consentKey].enabled,false);
 assert.equal(await f.client.track('panel_open'),false);
});

test('standalone collector HTTP adapter forwards only the validated payload', async()=>{
 const {createCollector}=await import('../analytics-collector/server.mjs');
 const {once}=await import('node:events');
 const sent=[];
 const server=createCollector(env,{fetcher:async(_,options)=>{sent.push(JSON.parse(options.body));return new Response(null,{status:204});}});
 server.listen(0,'127.0.0.1');await once(server,'listening');
 try{
  const response=await fetch('http://127.0.0.1:'+server.address().port+'/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event:'panel_open',browser:'chrome',version:'1.0'})});
  assert.equal(response.status,204);assert.equal(sent.length,1);
  assert.equal(sent[0].events[0].name,'panel_open');
 }finally{server.close();await once(server,'close');}
});
