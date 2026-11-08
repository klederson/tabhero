// Real Firefox native permission state in an isolated profile. Simulated collector, no live GA.
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {cp,mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {Builder,By} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
const scratch=await mkdtemp(join(tmpdir(),'firefox-statistics-'));
const extension=join(scratch,'extension');
await cp(resolve('dist/firefox'),extension,{recursive:true});
const manifest=JSON.parse(await readFile(join(extension,'manifest.json'),'utf8'));
const id=manifest.browser_specific_settings.gecko.id;
assert.ok(manifest.browser_specific_settings.gecko.data_collection_permissions.optional.includes('technicalAndInteraction'));
manifest.optional_host_permissions.push('https://statistics.test/*');
await writeFile(join(extension,'manifest.json'),JSON.stringify(manifest));
await writeFile(join(extension,'analytics-config.js'),"export const telemetryConfig={collectorUrl:'https://statistics.test/events'};");
const source=await readFile(join(extension,'analytics.js'),'utf8');
await writeFile(join(extension,'analytics.js'),"globalThis.__usageRequests=[];globalThis.fetch=async(url,options)=>{globalThis.__usageRequests.push(JSON.parse(options.body));return new Response(null,{status:204});};\n"+source);
const options=new firefox.Options().addArguments('-headless').enableBidi();
const binary=process.env.FIREFOX_BINARY??(existsSync('/snap/firefox/current/usr/lib/firefox/firefox')?'/snap/firefox/current/usr/lib/firefox/firefox':null);
if(binary)options.setBinary(binary);
const service=new firefox.ServiceBuilder().addArguments('--allow-system-access');
const driver=await new Builder().forBrowser('firefox').setFirefoxService(service).setFirefoxOptions(options).build();
try{
 await driver.installAddon(extension,true);
 await driver.setContext(firefox.Context.CHROME);
 const welcome=await driver.executeScript("return WebExtensionPolicy.getByID(arguments[0]).getURL('welcome.html')",id);
 await driver.setContext(firefox.Context.CONTENT);
 await driver.get(welcome);
 await driver.wait(()=>driver.executeScript("return document.documentElement.dataset.ready==='true'"),15000);
 const send=message=>driver.executeAsyncScript("const done=arguments[arguments.length-1];browser.runtime.sendMessage(arguments[0]).then(done,error=>done({error:String(error)}));",message);
 const count=()=>driver.executeAsyncScript("const done=arguments[arguments.length-1];browser.runtime.getBackgroundPage().then(bg=>done(bg.__usageRequests.length));");
 assert.equal((await send({type:'usage-status'})).enabled,false);
 await send({type:'usage-event',event:'panel_open'});assert.equal(await count(),0);
 // Grant only the test host and native technical data in this disposable profile.
 await driver.setContext(firefox.Context.CHROME);
 await driver.executeAsyncScript("const done=arguments[arguments.length-1];const {ExtensionPermissions}=ChromeUtils.importESModule('resource://gre/modules/ExtensionPermissions.sys.mjs');ExtensionPermissions.add(arguments[0],{permissions:[],origins:['https://statistics.test/*'],data_collection:['technicalAndInteraction']},WebExtensionPolicy.getByID(arguments[0]).extension).then(()=>done(true),error=>done(String(error)));",id);
 await driver.setContext(firefox.Context.CONTENT);
 assert.equal((await send({type:'usage-status'})).enabled,false,'Native installation permission is insufficient without the local opt-in');
 await driver.findElement(By.css('[data-usage-enable]')).click();
 await driver.wait(async()=>(await send({type:'usage-status'})).enabled,10000);
 await send({type:'usage-event',event:'panel_open'});
 assert.equal(await count(),1);
 const data=await driver.executeAsyncScript("const done=arguments[arguments.length-1];browser.runtime.getBackgroundPage().then(bg=>done(bg.__usageRequests[0]));");
 assert.deepEqual(Object.keys(data).sort(),['browser','event','version']);assert.equal(data.browser,'firefox');
 // Removing native permission through Firefox blocks the already opted-in extension.
 await driver.executeAsyncScript("const done=arguments[arguments.length-1];browser.permissions.remove({data_collection:['technicalAndInteraction']}).then(done);");
 assert.equal((await send({type:'usage-status'})).enabled,false);
 await send({type:'usage-event',event:'saved_reply_use'});assert.equal(await count(),1);
 await driver.findElement(By.css('[data-usage-disable]')).click();
 assert.equal((await send({type:'usage-status'})).enabled,false);
 console.log('OK Firefox extension analytics: native technical permission plus separate local opt-in, real enable click with pre-granted native permission, clean payload and immediate native revocation; isolated profile, fake collector.');
}finally{await driver.quit();await rm(scratch,{recursive:true,force:true});}
