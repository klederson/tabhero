// Capture actual bundled extension UI with fictional, isolated test data.
import { chromium } from 'playwright';
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const { version } = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
const manifest = JSON.parse(await readFile(new URL('dist/chrome/manifest.json', root), 'utf8'));
if (manifest.version !== version) throw new Error('Build the current extension before capturing store assets');
const profile = await mkdtemp(join(tmpdir(), 'tabhero-store-'));
await mkdir(new URL('store/assets/', root), { recursive: true });
await mkdir(new URL('artifacts/', root), { recursive: true });
const extension = resolve('dist/chrome');
const context = await chromium.launchPersistentContext(profile, { channel: 'chromium', headless: true, args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`] });
try {
  let fixture = await readFile(new URL('tests/fixtures/whatsapp.html', root), 'utf8');
  fixture = fixture.replaceAll('Bia · Padaria', 'Alex · Bakery').replaceAll('João', 'Sam').replaceAll('Oi! O pão fica pronto às quatro?', 'Hi! Will my order be ready at four?').replaceAll('Pode confirmar o horário?', 'Can you confirm the time?');
  await context.route('https://web.whatsapp.com/**', route => route.fulfill({ contentType: 'text/html', body: fixture }));
  await context.route('https://work.test/**', route => route.fulfill({ contentType: 'text/html', body: '<title>Your work</title><p>Your work stays right here.</p>' }));
  const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
  const origin = new URL(worker.url()).origin;
  // URL.origin is "null" for chrome-extension in some URL implementations.
  const extensionOrigin = origin === 'null' ? worker.url().replace(/\/[^/]*$/, '') : origin;
  await worker.evaluate(() => chrome.storage.local.set({ qrReplies: [{ id: 'demo-confirmation', title: 'Confirm time', text: 'Yes! Your order will be ready at four. See you then.' }] }));
  const whatsapp = await context.newPage(); await whatsapp.goto('https://web.whatsapp.com/');
  const work = await context.newPage(); await work.goto('https://work.test/');
  const popup = await context.newPage(); await work.bringToFront();
  await popup.setViewportSize({ width: 390, height: 600 });
  await popup.goto(`${extensionOrigin}/popup.html`);
  await popup.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  await popup.locator('#reply').fill('Yes! Your order will be ready at four. See you then.');
  const captures = [];
  captures.push({ file: '01-quick-reply.png', kicker: 'NEW CHAT. SAME TAB.', title: 'One little reply.\nZero detours.', detail: 'Write a reply, pick a saved answer, and keep your work right where it is.', points: ['Your existing WhatsApp session', 'You choose when to send', 'A compact toolbar popup'], image: await popup.screenshot() });
  await popup.locator('#recipient').click(); await popup.locator('#recipient-search').fill('Sam');
  await popup.locator('[role="option"]').first().waitFor();
  captures.push({ file: '02-conversation-search.png', kicker: 'FIND. REPLY. CARRY ON.', title: 'The right chat.\nRight here.', detail: 'Search conversations already loaded in WhatsApp, without leaving the page you are on.', points: ['Search by name or identifier', 'Saved replies and free text', 'Silent unread counter'], image: await popup.screenshot() });
  await popup.locator('#recipient-search').press('Escape');
  await popup.locator('#privacy').click();
  captures.push({ file: '03-privacy-and-source.png', kicker: 'OPEN SOURCE. OPEN ABOUT DATA.', title: 'Your chats.\nYour control.', detail: 'No ads or developer chat server. Optional usage statistics, local-storage details and AI disclosure.', points: ['Public source under the MIT license', 'Local saved replies and drafts', 'AI only when you connect and ask'], image: await popup.screenshot() });
  const displayFont = (await readFile(new URL('website/assets/fonts/bricolage-grotesque.ttf', root))).toString('base64');
  const symbol = await readFile(new URL('brand/symbol.svg', root), 'utf8');
  const artwork = await context.newPage(); await artwork.setViewportSize({ width: 1280, height: 800 });
  const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
  for (const capture of captures) {
    await artwork.setContent(`<!doctype html><html><meta charset="utf-8"><style>@font-face{font-family:B;src:url(data:font/ttf;base64,${displayFont})}*{box-sizing:border-box}body{margin:0;background:#F0F6F2;color:#183D35;font:20px/1.5 system-ui}.art{width:1280px;height:800px;padding:64px 72px;display:grid;grid-template-columns:1fr 390px;gap:65px;background:radial-gradient(ellipse at 100% 0,#D9FDD3,transparent 60%)}.brand{display:flex;align-items:center;gap:12px;font:750 36px B,system-ui;letter-spacing:-1.5px}.brand svg{width:42px;height:42px}.kicker{font-size:12px;font-weight:750;letter-spacing:.14em;margin:55px 0 20px;color:#3D715F}h1{font:750 74px/1.03 B,system-ui;letter-spacing:-3px;margin:0 0 26px;white-space:pre-line}.detail{font-size:20px;max-width:510px;color:#587068;margin:0 0 25px}ul{padding-left:20px;color:#386B5B;font-size:16px;line-height:2}.shot{width:390px;border-radius:16px;overflow:hidden;border:1px solid #B7D9C4;box-shadow:0 20px 50px #183d351a;align-self:center;height:600px;background:#F8FBF9}.shot img{display:block;width:390px;height:600px}.caption{font-size:11px;letter-spacing:.02em;color:#587068;margin-top:30px}</style><main class="art"><section><div class="brand">${symbol}<span>tabhero.</span></div><p class="kicker">${escape(capture.kicker)}</p><h1>${escape(capture.title)}</h1><p class="detail">${escape(capture.detail)}</p><ul>${capture.points.map(point => `<li>${escape(point)}</li>`).join('')}</ul><p class="caption">Actual extension UI · Fictional demo conversation · Experimental</p></section><div class="shot"><img alt="TabHero popup" src="data:image/png;base64,${capture.image.toString('base64')}"></div></main></html>`);
    await artwork.evaluate(() => document.fonts.ready);
    await artwork.screenshot({ path: resolve('store/assets', capture.file) });
  }
  await artwork.setViewportSize({ width: 440, height: 280 });
  await artwork.setContent(`<style>*{box-sizing:border-box}body{margin:0;background:#D9FDD3;color:#183D35;padding:32px;font:700 34px/1.1 system-ui}.brand{display:flex;gap:10px;align-items:center;font-size:25px}.brand svg{width:34px;height:34px}h1{font-size:43px;letter-spacing:-2px;margin:30px 0 15px}p{font-size:13px;font-weight:500}</style><div class="brand">${symbol}<span>tabhero.</span></div><h1>New chat.<br>Same tab.</h1><p>Quick replies. Fewer detours. Open source.</p>`);
  await artwork.screenshot({ path: resolve('store/assets/promo-440x280.png') });
  await cp(new URL('extension/icons/128.png', root), new URL('store/assets/icon-128.png', root));
} finally { await context.close(); await rm(profile, { recursive: true, force: true }); }

const source = await mkdtemp(join(tmpdir(), 'tabhero-review-source-'));
try {
  for (const name of ['extension', 'analytics-collector', 'docs', 'scripts', 'tests', 'brand', 'website', 'package.json', 'package-lock.json', 'README.md', 'LICENSE', 'SECURITY.md']) {
    await cp(new URL(name, root), join(source, name), { recursive: true, filter: path => !path.endsWith('/website/dist') });
  }
  const sourceZip = resolve('artifacts/tabhero-source.zip');
  await rm(sourceZip, { force: true });
  execFileSync('zip', ['-q', '-r', sourceZip, '.'], { cwd: source });
} finally { await rm(source, { recursive: true, force: true }); }
const hashes = {};
for (const file of ['tabhero-chrome.zip', 'tabhero-firefox.zip', 'tabhero-source.zip']) {
  hashes[file] = createHash('sha256').update(await readFile(new URL(`artifacts/${file}`, root))).digest('hex');
}
await writeFile(new URL('store/packages.json', root), JSON.stringify({ version, generatedAt: new Date().toISOString(), status: 'prepared-not-submitted', sha256: hashes }, null, 2) + '\n');
const kit = resolve('artifacts/tabhero-store-kit.zip');
await rm(kit, { force: true });
execFileSync('zip', ['-q', '-r', kit, '.'], { cwd: resolve('store') });
console.log('Store screenshots, icon, source archive and submission kit ready. No store submission, customer message or AI request was made.');
