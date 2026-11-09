import { collectorOrigin } from './analytics.js';
export const usageCopy = {
 en:{title:'Help improve the extension',body:'We use these statistics to improve features and fix errors. Optional: share counts of features used and broad error categories, plus browser name and extension version. Counts go through our statistics server to Google Analytics. No messages, contacts, phone numbers, page addresses, keys or persistent user ID. No cookies. Refusing changes no features.',enable:'Share usage counts',disable:'Keep statistics off',on:'On. You can turn this off here at any time.',off:'Off. No usage statistics are sent.',unavailable:'Statistics are not available yet. All features work.',error:'Permission was not granted. Statistics stay off.'},
 pt:{title:'Ajude a melhorar a extensão',body:'Usamos essas estatísticas para melhorar os recursos e corrigir erros. Opcional: compartilhe contagens dos recursos usados e categorias gerais de erro, além do nome do navegador e da versão da extensão. Elas passam pelo nosso servidor de estatísticas e vão ao Google Analytics. Sem mensagens, contatos, números, endereços de páginas, chaves ou identificação permanente do usuário. Sem cookies. Recusar não muda os recursos.',enable:'Compartilhar contagens de uso',disable:'Manter estatísticas desligadas',on:'Ligado. Você pode desligar aqui quando quiser.',off:'Desligado. Nenhuma estatística de uso é enviada.',unavailable:'As estatísticas ainda não estão disponíveis. Todos os recursos funcionam.',error:'A permissão não foi concedida. As estatísticas continuam desligadas.'},
 es:{title:'Ayuda a mejorar la extensión',body:'Usamos estas estadísticas para mejorar las funciones y corregir errores. Opcional: comparte conteos de funciones usadas y categorías generales de errores, además del navegador y la versión de la extensión. Pasan por nuestro servidor de estadísticas hacia Google Analytics. Sin mensajes, contactos, números, direcciones de páginas, claves ni identificación permanente. Sin cookies. Rechazar no cambia las funciones.',enable:'Compartir conteos de uso',disable:'Mantener estadísticas apagadas',on:'Activado. Puedes apagarlo aquí cuando quieras.',off:'Apagado. No se envían estadísticas de uso.',unavailable:'Las estadísticas aún no están disponibles. Todas las funciones siguen disponibles.',error:'No se concedió el permiso. Las estadísticas siguen apagadas.'},
 id:{title:'Bantu perbaiki ekstensi',body:'Kami memakai statistik ini untuk memperbaiki fitur dan mengatasi kesalahan. Opsional: bagikan hitungan fitur yang dipakai dan kategori kesalahan umum, serta nama browser dan versi ekstensi. Data melewati server statistik kami ke Google Analytics. Tanpa pesan, kontak, nomor telepon, alamat halaman, kunci, atau ID pengguna tetap. Tanpa cookie. Menolak tidak mengubah fitur.',enable:'Bagikan hitungan penggunaan',disable:'Biarkan statistik mati',on:'Aktif. Anda dapat mematikannya di sini kapan saja.',off:'Mati. Statistik penggunaan tidak dikirim.',unavailable:'Statistik belum tersedia. Semua fitur tetap berfungsi.',error:'Izin tidak diberikan. Statistik tetap mati.'},
 hi:{title:'एक्सटेंशन को बेहतर बनाने में मदद करें',body:'हम इन आँकड़ों से सुविधाएँ बेहतर बनाते हैं और त्रुटियाँ सुधारते हैं। वैकल्पिक: इस्तेमाल की गई सुविधाओं की गिनती और सामान्य त्रुटि श्रेणियाँ, ब्राउज़र का नाम और एक्सटेंशन का संस्करण साझा करें। ये हमारे आँकड़ों के सर्वर से Google Analytics तक जाते हैं। संदेश, संपर्क, फ़ोन नंबर, पेज के पते, कुंजियाँ या स्थायी उपयोगकर्ता पहचान शामिल नहीं हैं। कोई कुकी नहीं। मना करने से कोई सुविधा नहीं बदलती।',enable:'इस्तेमाल की गिनती साझा करें',disable:'आँकड़े बंद रखें',on:'चालू है। आप यहाँ कभी भी बंद कर सकते हैं।',off:'बंद है। इस्तेमाल के आँकड़े नहीं भेजे जाते।',unavailable:'आँकड़े अभी उपलब्ध नहीं हैं। सभी सुविधाएँ काम करती हैं।',error:'अनुमति नहीं मिली। आँकड़े बंद हैं।'}
};
export function mountUsageStatistics(root,api=globalThis.browser??globalThis.chrome) {
 const language=(api.i18n.getMessage('language')||api.i18n.getUILanguage()).split(/[-_]/)[0];
 const t=usageCopy[language]||usageCopy.en;
 const section=document.createElement('section');section.className='usage-statistics';
 const heading=document.createElement('h2');heading.textContent=t.title;
 const body=document.createElement('p');body.textContent=t.body;
 const allow=document.createElement('button');allow.type='button';allow.dataset.usageEnable='';allow.textContent=t.enable;allow.disabled=true;
 const deny=document.createElement('button');deny.type='button';deny.dataset.usageDisable='';deny.textContent=t.disable;
 const state=document.createElement('p');state.setAttribute('role','status');state.dataset.usageState='';
 section.append(heading,body,allow,deny,state);root.append(section);
 let native=false;
 const send=message=>api.runtime.sendMessage({...message,privateContext:Boolean(api.extension?.inIncognitoContext)});
 const refresh=async()=>{const s=await send({type:'usage-status'});native=s?.native;allow.disabled=!s?.configured||!s?.native||s?.enabled;state.textContent=!s?.configured||!s?.native?t.unavailable:s.enabled?t.on:t.off;return s;};
 allow.addEventListener('click',async()=>{
  // Keep the permission request directly inside the user's click, before any await.
  const firefox=Boolean(api.runtime.getManifest().browser_specific_settings?.gecko);
  const origins=collectorOrigin();
  if(!origins||!native)return;
  const request=api.permissions.request({origins:[origins],...(firefox?{data_collection:['technicalAndInteraction']}:{})});
  allow.disabled=true;
  try {const granted=await request;if(!granted){await refresh();state.textContent=t.error;return;}const result=await send({type:'usage-consent',enabled:true});await refresh();if(!result?.enabled)state.textContent=t.error;}
  catch {await refresh().catch(()=>{});state.textContent=t.error;}
 });
 deny.addEventListener('click',async()=>{
  allow.disabled=true;
  try {await send({type:'usage-consent',enabled:false});if(native&&api.runtime.getManifest().browser_specific_settings?.gecko)await api.permissions.remove({data_collection:['technicalAndInteraction']});await refresh();}catch{state.textContent=t.error;}
 });
 if(api.extension?.inIncognitoContext){allow.disabled=true;deny.disabled=true;state.textContent=t.off;}
 else refresh().catch(()=>{state.textContent=t.unavailable;});
 return section;
}
export function recordUsage(event,api=globalThis.browser??globalThis.chrome){
 if(api.extension?.inIncognitoContext)return;
 api.runtime.sendMessage({type:'usage-event',event,privateContext:Boolean(api.extension?.inIncognitoContext)}).catch(()=>{});
}
