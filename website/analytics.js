// Website only. Never import this module into an extension.
import { analytics } from './analytics-config.js';
import { storeLinks } from './store-links.js';

const copy = {
 en: {title:'Help us improve this site?', body:'Allow Google Analytics to count visits and downloads? It uses cookies. Your WhatsApp messages and extension activity are never included.', accept:'Allow statistics', reject:'No thanks', settings:'Visit statistics', privacy:'Google privacy', status:'You can change your choice here at any time.'},
 pt: {title:'Ajuda a melhorar este site?', body:'Permite que o Google Analytics conte visitas e downloads? Ele usa cookies. Suas mensagens do WhatsApp e o uso da extensão ficam fora dessa medição.', accept:'Permitir estatísticas', reject:'Não, obrigado', settings:'Estatísticas de visitas', privacy:'Privacidade do Google', status:'Você pode mudar sua escolha aqui quando quiser.'},
 es: {title:'¿Nos ayudas a mejorar este sitio?', body:'¿Permites que Google Analytics cuente visitas y descargas? Usa cookies. Tus mensajes de WhatsApp y el uso de la extensión quedan fuera de esta medición.', accept:'Permitir estadísticas', reject:'No, gracias', settings:'Estadísticas de visitas', privacy:'Privacidad de Google', status:'Puedes cambiar tu elección aquí cuando quieras.'},
 id: {title:'Bantu kami memperbaiki situs ini?', body:'Izinkan Google Analytics menghitung kunjungan dan unduhan? Layanan ini memakai cookie. Pesan WhatsApp dan aktivitas ekstensi Anda tidak disertakan.', accept:'Izinkan statistik', reject:'Tidak, terima kasih', settings:'Statistik kunjungan', privacy:'Privasi Google', status:'Anda dapat mengubah pilihan di sini kapan saja.'},
 hi: {title:'इस साइट को बेहतर बनाने में मदद करेंगे?', body:'क्या Google Analytics को विज़िट और डाउनलोड गिनने दें? यह कुकी इस्तेमाल करता है। आपके WhatsApp संदेश और एक्सटेंशन का इस्तेमाल इस माप में शामिल नहीं हैं।', accept:'आँकड़ों की अनुमति दें', reject:'नहीं, धन्यवाद', settings:'विज़िट के आँकड़े', privacy:'Google की निजता नीति', status:'आप यहाँ कभी भी अपनी पसंद बदल सकते हैं।'}
};
const valid = /^G-[A-Z0-9]+$/.test(analytics.measurementId);
const hosted = location.protocol === 'https:' || location.hostname === '127.0.0.1' || location.hostname === 'localhost';
if (valid && hosted) init();

function init() {
 const key = analytics.siteKey + ':analytics-consent:v1';
 const duration = 180 * 86400 * 1000;
 let choice = null, started = false;
 try {
  const saved = JSON.parse(localStorage.getItem(key));
  if (saved && Date.now() >= saved.at && Date.now() - saved.at < duration && ['accepted','rejected'].includes(saved.value)) choice = saved.value;
 } catch {}
 const style = document.createElement('style');
 style.textContent = '#visit-statistics{position:fixed;inset:auto 16px 16px auto;z-index:1000;width:min(420px,calc(100% - 32px));padding:20px;border:1px solid #667085;border-radius:16px;background:var(--analytics-bg,#fff);color:var(--analytics-fg,#172b29);box-shadow:0 12px 48px #0003;font:14px/1.6 system-ui,sans-serif}#visit-statistics[hidden]{display:none}#visit-statistics h2{font:700 19px/1.3 system-ui,sans-serif;margin:0 0 8px}#visit-statistics p{margin:8px 0}#visit-statistics .visit-actions{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}#visit-statistics button{flex:1;min-height:44px;padding:8px 12px;border:1px solid currentColor;border-radius:8px;background:transparent;color:inherit;font:600 14px system-ui,sans-serif;cursor:pointer}#visit-statistics a{color:inherit;text-decoration:underline}#visit-settings{display:block;margin:12px auto;padding:8px 12px;min-height:44px;font:inherit;background:transparent;color:inherit;border:1px solid currentColor;border-radius:8px;cursor:pointer}';
 document.head.append(style);
 const box = document.createElement('section');
 box.id = 'visit-statistics';
 box.setAttribute('aria-labelledby','visit-title');
 const title = document.createElement('h2'); title.id = 'visit-title';
 const body = document.createElement('p');
 const actions = document.createElement('div'); actions.className = 'visit-actions';
 const reject = document.createElement('button'); reject.type = 'button'; reject.dataset.analyticsChoice = 'rejected';
 const accept = document.createElement('button'); accept.type = 'button'; accept.dataset.analyticsChoice = 'accepted';
 const privacy = document.createElement('a');
 privacy.href = 'https://policies.google.com/privacy'; privacy.target = '_blank'; privacy.rel = 'noopener noreferrer';
 const status = document.createElement('p');
 actions.append(reject,accept); box.append(title,body,actions,privacy,status);
 const settings = document.createElement('button'); settings.id = 'visit-settings'; settings.type = 'button';
 const footer = document.querySelector('footer') || document.body;
 footer.append(settings); document.body.append(box);
 function render() {
  const t = copy[document.documentElement.lang.split('-')[0]] || copy.en;
  title.textContent=t.title; body.textContent=t.body; reject.textContent=t.reject; accept.textContent=t.accept;
  settings.textContent=t.settings; privacy.textContent=t.privacy; status.textContent=t.status;
 }
 render();
 new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 box.hidden = choice !== null;
 settings.addEventListener('click',()=>{box.hidden=false;reject.focus();});
 reject.addEventListener('click',()=>save('rejected'));
 accept.addEventListener('click',()=>save('accepted'));
 function clearCookies() {
  for (const cookie of document.cookie.split(';')) {
   const name = cookie.split('=')[0].trim();
   if (!name.startsWith(analytics.cookiePrefix + '_')) continue;
   document.cookie = name + '=; Max-Age=0; Path=' + analytics.cookiePath + '; SameSite=Lax';
  }
 }
 function save(value) {
  const wasStarted=started;
  choice=value;
  try {localStorage.setItem(key,JSON.stringify({value,at:Date.now()}));} catch {}
  box.hidden=true; settings.focus();
  if (value==='accepted') start();
  else {
   // Disable before removing cookies. A fresh document removes the already loaded tag.
   window['ga-disable-'+analytics.measurementId]=true;
   clearCookies();
   if (wasStarted) location.reload();
  }
 }
 function start() {
  if(started || choice!=='accepted')return;
  started=true;
  window['ga-disable-'+analytics.measurementId]=false;
  window.dataLayer=window.dataLayer||[];
  window.gtag=function(){window.dataLayer.push(arguments);};
  const gtag=window.gtag;
  gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  gtag('js',new Date());
  gtag('config',analytics.measurementId,{
   send_page_view:false,
   allow_google_signals:false,
   allow_ad_personalization_signals:false,
   cookie_domain:'none', cookie_path:analytics.cookiePath, cookie_prefix:analytics.cookiePrefix,
   cookie_expires:180*86400, cookie_update:false, cookie_flags:'SameSite=Lax;Secure',
   page_location:location.origin+location.pathname, page_referrer:''
  });
  gtag('event','page_view',{send_to:analytics.measurementId,page_location:location.origin+location.pathname,page_referrer:''});
  const script=document.createElement('script');
  script.async=true; script.referrerPolicy='no-referrer';
  script.src='https://www.googletagmanager.com/gtag/js?id='+analytics.measurementId;
  document.head.append(script);
 }
 // A choice in the other tab of this SAME project also applies here.
 window.addEventListener('storage',event=>{
  if(event.key!==key)return;
  window['ga-disable-'+analytics.measurementId]=true;
  clearCookies();
  location.reload();
 });
 document.addEventListener('click',event=>{
  if(choice!=='accepted'||!started)return;
  const target=event.target instanceof Element?event.target.closest('a[href]'):null;
  if(!target)return;
  const url=new URL(target.href,location.href);
  let kind=null;
  if(url.origin===location.origin&&url.pathname.includes('/downloads/')&&url.pathname.endsWith('.zip'))kind='download';
  if(url.hostname==='github.com'&&url.pathname.startsWith('/klederson/'+analytics.repository+'/releases'))kind='download';
  if(Object.values(storeLinks).some(link=>url.origin+url.pathname===link))kind='download';
  if(url.hostname==='github.com'&&url.pathname==='/sponsors/klederson')kind='support';
  if(kind)window.gtag('event',kind==='download'?'download_click':'support_click',{send_to:analytics.measurementId});
 });
 if(choice==='accepted')start();
 else {window['ga-disable-'+analytics.measurementId]=true;clearCookies();}
}

