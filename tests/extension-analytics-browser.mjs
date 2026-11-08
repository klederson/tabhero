// Actual extension/background and consent UI, synthetic WhatsApp, intercepted collector.
// The disposable test package pre-grants only the fixture collector host to avoid browser prompt automation.
import assert from 'node:assert/strict';
import {cp,mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {usageCopy} from '../extension/analytics-ui.js';
const scratch=await mkdtemp(join(tmpdir(),'extension-statistics-'));
const extension=join(scratch,'extension'),profile=join(scratch,'profile');
await cp(resolve('dist/chrome'),extension,{recursive:true});
const manifest=JSON.parse(await readFile(join(extension,'manifest.json'),'utf8'));
manifest.host_permissions.push('https://statistics.test/*');
await writeFile(join(extension,'manifest.json'),JSON.stringify(manifest));
await writeFile(join(extension,'analytics-config.js'),"export const telemetryConfig={collectorUrl:'https://statistics.test/events'};");
const adapter = await readFile(join(extension,'analytics.js'),'utf8');
const intercepted = `const actualFetch=globalThis.fetch;globalThis.__usageRequests=[];
globalThis.fetch=async(url,options)=>{if(url==='https://statistics.test/events'){globalThis.__usageRequests.push({url,body:JSON.parse(options.body),credentials:options.credentials});return new Response(null,{status:204});}return actualFetch(url,options);};\n`;
await writeFile(join(extension,'analytics.js'),intercepted+adapter);

const context=await chromium.launchPersistentContext(profile,{channel:'chromium',headless:true,args:['--disable-extensions-except='+extension,'--load-extension='+extension]});
try{
 const errors=[];context.on('page',page=>page.on('pageerror',error=>errors.push(error.message)));
 const fixture=await readFile('tests/fixtures/whatsapp.html','utf8');
 await context.route('https://web.whatsapp.com/**',route=>route.fulfill({contentType:'text/html',body:fixture}));
 const worker=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');
 const origin=worker.url().replace(/\/[^/]*$/,'');
 const whatsapp=await context.newPage();await whatsapp.goto('https://web.whatsapp.com/');
 await whatsapp.evaluate(()=>{window.__statisticsDocument=crypto.randomUUID();});
 const identity=await whatsapp.evaluate(()=>({identity:window.__statisticsDocument,url:location.href}));
 const popup=await context.newPage();await popup.goto(origin+'/popup.html');
 await popup.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await popup.locator('#privacy').click();
 await popup.locator('[data-usage-state]').waitFor();
 assert.equal((await worker.evaluate(()=>globalThis.__usageRequests)).length,0,'Default and native host grant alone send nothing');
 await popup.locator('[data-usage-enable]').click();
 await popup.waitForFunction(()=>document.querySelector('[data-usage-state]').textContent.startsWith('On.'));
 const emit=event=>popup.evaluate(event=>chrome.runtime.sendMessage({type:'usage-event',event,text:'PRIVATE-SENTINEL',phone:'555123',key:'KEY-SENTINEL'}),event);
 await emit('panel_open');await emit('panel_open');await emit('PRIVATE-SENTINEL');
 let requests=await worker.evaluate(()=>globalThis.__usageRequests);
 assert.equal(requests.length,1);assert.deepEqual(Object.keys(requests[0].body).sort(),['browser','event','version']);
 assert.equal(requests[0].body.event,'panel_open');assert.equal(requests[0].credentials,'omit');
 assert.doesNotMatch(JSON.stringify(requests),/PRIVATE-SENTINEL|KEY-SENTINEL|555123/);
 // The normal explicit Send path still works and emits only a fixed success category.
 await popup.locator('[data-back]').last().click();
 await popup.locator('#reply').fill('PRIVATE-SENTINEL');
 await popup.locator('#send').click();
 await popup.waitForTimeout(250);
 requests=await worker.evaluate(()=>globalThis.__usageRequests);
 assert.ok(requests.some(request=>request.body.event==='manual_reply_success'),'Manual sending emits a fixed outcome, never its content');
 assert.doesNotMatch(JSON.stringify(requests),/PRIVATE-SENTINEL|KEY-SENTINEL|555123/);
 assert.deepEqual(await whatsapp.evaluate(()=>({identity:window.__statisticsDocument,url:location.href})),identity);
 await popup.locator('#privacy').click();
 await popup.locator('[data-usage-disable]').click();
 await popup.waitForFunction(()=>document.querySelector('[data-usage-state]').textContent.startsWith('Off.'));
 const count=requests.length;
 await emit('saved_reply_use');
 assert.equal((await worker.evaluate(()=>globalThis.__usageRequests)).length,count);
 // Main-world WhatsApp/content-script contexts cannot enable usage statistics.
 const rejected=await worker.evaluate(async()=>{
  const tab=(await chrome.tabs.query({url:'https://web.whatsapp.com/*'}))[0];
  const [response]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:async()=>chrome.runtime.sendMessage({type:'usage-consent',enabled:true})});
  return response.result;
 });
 assert.equal(rejected.ok,false);
 const welcome=await context.newPage();await welcome.goto(origin+'/welcome.html');await welcome.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 const catalog=await welcome.evaluate(async()=> (await import('./analytics-ui.js')).usageCopy);
 assert.deepEqual(catalog,usageCopy);
 assert.equal((await worker.evaluate(()=>globalThis.__usageRequests)).length,count,'Reopening UI does not replay declined usage');
 assert.deepEqual(errors,[]);
 console.log('OK extension analytics: real Chrome opt-in UI/background, default-off, decline, safe payload, sampled counts, sending without document reload, source authorization, five bundled languages; collector mocked.');
}finally{await context.close();await rm(scratch,{recursive:true,force:true});}
