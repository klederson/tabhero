// Exercises website consent in real pages. Google endpoints are intercepted: no live statistics.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {once} from 'node:events';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';

const project=JSON.parse(await readFile('package.json','utf8')).name;
const bridge=project==='relayers-bridge';
const siteKey=bridge?'relayers-bridge':'tabhero';
const root=resolve(bridge?'site':'website/dist');
const prefix='/'+siteKey+'/';
const cookiePrefix=bridge?'relayers_bridge':'tabhero';
const consentKey=siteKey+':analytics-consent:v1';
const id='G-TEST123456';
const config={measurementId:id,siteKey,repository:siteKey,cookiePrefix,cookiePath:prefix};
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.ttf':'font/ttf'};
const server=createServer(async(req,res)=>{
 try{
  const path=new URL(req.url,'http://localhost').pathname;
  if(!path.startsWith(prefix)){res.writeHead(404).end();return;}
  const relative=decodeURIComponent(path.slice(prefix.length));
  const file=resolve(root,relative.endsWith('/')||!relative?relative+'index.html':relative);
  if(!file.startsWith(root+'/')){res.writeHead(403).end();return;}
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'}).end(await readFile(file));
 }catch{res.writeHead(404).end();}
});
server.listen(0,'127.0.0.1');await once(server,'listening');
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({channel:process.env.SITE_BROWSER_CHANNEL||'chromium',headless:true});
try{
 const context=await browser.newContext({viewport:{width:390,height:844}});
 const external=[],errors=[];
 await context.route('**/*',route=>{
  const url=new URL(route.request().url());
  if(url.origin===origin){
   if(url.pathname.endsWith('/analytics-config.js'))return route.fulfill({contentType:'text/javascript',body:'export const analytics='+JSON.stringify(config)});
   return route.continue();
  }
  external.push(route.request().url());
  if(url.hostname==='www.googletagmanager.com')return route.fulfill({contentType:'text/javascript',body:'window.__analyticsLoaded=true;'});
  return route.abort();
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const load=()=>page.goto(origin+prefix+'?phone=SECRET&text=PRIVATE#sensitive');
 const box=page.locator('#visit-statistics');
 const choice=value=>page.locator('[data-analytics-choice="'+value+'"]').click();
 // A different project's acceptance does not consent to this one.
 await context.addInitScript(({other})=>{
  if(!localStorage.getItem(other))localStorage.setItem(other,JSON.stringify({value:'accepted',at:Date.now()}));
 },{other:(bridge?'tabhero':'relayers-bridge')+':analytics-consent:v1'});
 await load();await box.waitFor({state:'visible'});
 assert.deepEqual(external,[]);
 await choice('rejected');await page.reload();
 await page.locator('#visit-settings').waitFor();
 assert.equal(await box.isHidden(),true);assert.deepEqual(external,[]);
 assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).value,consentKey),'rejected');
 await page.locator('#visit-settings').click();await choice('accepted');
 await page.waitForFunction(()=>window.__analyticsLoaded===true);
 assert.equal(external.length,1);
 assert.equal(new URL(external[0]).searchParams.get('id'),id);
 let commands=await page.evaluate(()=>window.dataLayer.map(args=>Array.from(args)));
 const consent=commands.find(c=>c[0]==='consent')[2];
 assert.equal(consent.analytics_storage,'granted');
 for(const key of ['ad_storage','ad_user_data','ad_personalization'])assert.equal(consent[key],'denied');
 const settings=commands.find(c=>c[0]==='config')[2];
 assert.equal(settings.allow_google_signals,false);
 assert.equal(settings.allow_ad_personalization_signals,false);
 assert.equal(settings.cookie_path,prefix);assert.equal(settings.cookie_prefix,cookiePrefix);
 assert.equal(settings.cookie_domain,'none');assert.equal(settings.send_page_view,false);
 assert.equal(settings.page_location,origin+prefix);assert.equal(settings.page_referrer,'');
 assert.equal(commands.filter(c=>c[0]==='event'&&c[1]==='page_view').length,1);
 assert.doesNotMatch(JSON.stringify(commands),/SECRET|PRIVATE|sensitive/);
 // Only allowlisted click categories; never forward hrefs, text, amounts or form contents.
 await page.evaluate(({project})=>{
  const a=document.createElement('a');
  a.href='https://github.com/klederson/'+project+'/releases/latest?token=SECRET';
  a.textContent='PRIVATE';
  document.body.append(a);
  a.addEventListener('click',e=>e.preventDefault());
  a.click();a.href='https://github.com/sponsors/klederson';a.click();
  a.href='https://unrelated.invalid/?text=PRIVATE';a.click();a.remove();
 },{project:siteKey});
 commands=await page.evaluate(()=>window.dataLayer.map(args=>Array.from(args)));
 assert.equal(commands.filter(c=>c[1]==='download_click').length,1);
 assert.equal(commands.filter(c=>c[1]==='support_click').length,1);
 assert.doesNotMatch(JSON.stringify(commands),/SECRET|PRIVATE|sensitive|unrelated/);
 if(!bridge){
  // The install button now opens a store. It still counts only after consent,
  // and never sends the listing URL or its query parameters.
  await page.evaluate(()=>{
   const install=document.querySelector('#download-extension');
   install.addEventListener('click',e=>e.preventDefault());
   install.href+='?private=SECRET';
   install.click();
  });
  commands=await page.evaluate(()=>window.dataLayer.map(args=>Array.from(args)));
  assert.equal(commands.filter(c=>c[1]==='download_click').length,2);
  assert.doesNotMatch(JSON.stringify(commands),/SECRET|chromewebstore|akceknbd/);
 }
 await page.reload();await page.waitForFunction(()=>window.__analyticsLoaded===true);
 assert.equal(await box.isHidden(),true);assert.equal(external.length,2);
 // Revoking clears only project cookies and persists before a website-only reload.
 await page.evaluate(({cookiePrefix,prefix})=>{
  document.cookie=cookiePrefix+'_ga=fixture; Path='+prefix;
  document.cookie='other_project_ga=preserve; Path=/';
 },{cookiePrefix,prefix});
 await page.locator('#visit-settings').click();
 await Promise.all([page.waitForNavigation(),choice('rejected')]);
 await page.locator('#visit-settings').waitFor();
 assert.equal(external.length,2);
 assert.equal(await box.isHidden(),true);
 const cookies=await page.evaluate(()=>document.cookie);
 assert.ok(!cookies.includes(cookiePrefix+'_ga=fixture'));assert.ok(cookies.includes('other_project_ga=preserve'));
 // Expired acceptance cannot silently restart tracking.
 await page.evaluate(({key})=>localStorage.setItem(key,JSON.stringify({value:'accepted',at:Date.now()-181*86400*1000})),{key:consentKey});
 await page.reload();await box.waitFor({state:'visible'});assert.equal(external.length,2);
 // Every translation and small-screen consent controls stay usable.
 for(const lang of ['en','pt-BR','es','id','hi']){
  await page.evaluate(lang=>document.documentElement.lang=lang,lang);
  await page.waitForTimeout(20);
  assert.ok((await box.locator('h2').innerText()).length>0);
  assert.ok(await box.locator('button').first().isVisible());
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 assert.deepEqual(errors,[]);
 await context.close();
 // No code means no UI and no Google requests, even with accepted preferences.
 const inactive=await browser.newContext();
 const inactiveExternal=[];
 await inactive.route('**/*',route=>{
  const url=new URL(route.request().url());
  if(url.origin!==origin){inactiveExternal.push(url.href);return route.abort();}
  if(url.pathname.endsWith('/analytics-config.js'))return route.fulfill({contentType:'text/javascript',body:'export const analytics='+JSON.stringify({...config,measurementId:''})});
  return route.continue();
 });
 const quiet=await inactive.newPage();
 await quiet.goto(origin+prefix);
 await quiet.waitForLoadState('networkidle');
 assert.equal(await quiet.locator('#visit-settings').count(),0);
 assert.deepEqual(inactiveExternal,[]);
 await inactive.close();
 console.log(siteKey+': website analytics consent, isolated storage, safe payloads, revocation and translations passed (mock Google script; no live hits).');
}finally{await browser.close();server.close();await once(server,'close');}

