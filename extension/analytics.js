import { telemetryConfig } from './analytics-config.js';
export const usageEvents = Object.freeze(['panel_open','saved_reply_use','ai_suggest','ai_error','manual_reply_success','manual_reply_error','conversation_open','conversation_error','bridge_open','bridge_setup','bridge_pause','bridge_resume','bridge_disconnect','bridge_error']);
export const consentKey = 'usageStatisticsConsentV1';
export function collectorOrigin(config=telemetryConfig) {
 try { const url=new URL(config.collectorUrl); return url.protocol==='https:'&&!url.username&&!url.password&&!url.search&&!url.hash?url.origin+'/*':null; } catch { return null; }
}
export function createUsageStatistics(api,{config=telemetryConfig,fetcher=globalThis.fetch,now=Date.now}={}) {
 const origin=collectorOrigin(config);
 const firefox=Boolean(api.runtime.getManifest().browser_specific_settings?.gecko);
 const pending=new Set(),last=new Map();
 let epoch=0;
 const stop=()=>{epoch++;for(const request of pending)request.abort();pending.clear();last.clear();};
 api.storage.onChanged?.addListener((changes,area)=>{if(area==='local'&&changes[consentKey]&&changes[consentKey].newValue?.enabled!==true)stop();});
 api.permissions.onRemoved?.addListener(()=>stop());
 const local=api.storage.local;
 async function status(){
  const record=(await local.get(consentKey))[consentKey];
  const saved=record?.enabled===true&&Number.isFinite(record.at)&&record.at<=now()&&now()-record.at<180*86400*1000;
  const granted=await api.permissions.getAll();
  const native=!firefox||Array.isArray(granted.data_collection);
  const dataAllowed=!firefox||granted.data_collection?.includes('technicalAndInteraction');
  const host=origin&&await api.permissions.contains({origins:[origin]});
  return {ok:true,configured:Boolean(origin),native,enabled:Boolean(origin&&saved&&native&&dataAllowed&&host)};
 }
 async function setConsent(enabled){
  if(typeof enabled!=='boolean')return {ok:false};
  // Serialize no network operation here. Withdrawal aborts before the storage write.
  stop();
  const generation=epoch;
  if(enabled){const s=await status();if(!s.configured||!s.native)return {ok:false};const granted=await api.permissions.getAll();if(firefox&&!granted.data_collection?.includes('technicalAndInteraction'))return {ok:false};if(!await api.permissions.contains({origins:[origin]}))return {ok:false};}
  if (enabled && generation!==epoch) return status();
  await local.set({[consentKey]:{enabled,at:now()}});
  return status();
 }
 async function track(name,{incognito=false}={}){
  if(incognito||!usageEvents.includes(name)||!origin)return false;
  const generation=epoch;
  try {
   const s=await status();
   if(!s.enabled||generation!==epoch)return false;
   // Best-effort sampled counts: no queue, replay, persistent identity or message-derived parameters.
   const previous=last.get(name);
   if(previous!==undefined&&now()-previous<60000)return false;
   last.set(name,now());
   const abort=new AbortController();pending.add(abort);
   const timer=setTimeout(()=>abort.abort(),3000);
   try {
    if(generation!==epoch)return false;
    const version=api.runtime.getManifest().version;
    if(!/^\d+(?:\.\d+){0,3}$/.test(version))return false;
    await fetcher(config.collectorUrl,{method:'POST',credentials:'omit',cache:'no-store',redirect:'error',referrerPolicy:'no-referrer',headers:{'Content-Type':'application/json'},body:JSON.stringify({event:name,browser:firefox?'firefox':'chrome',version}),signal:abort.signal});
    return true;
   }finally{clearTimeout(timer);pending.delete(abort);}
  } catch {return false;}
 }
 return {status,setConsent,track};
}
