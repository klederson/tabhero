import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { chromium } from 'playwright';

const directory = resolve('website/dist');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.png': 'image/png', '.zip': 'application/zip', '.pdf': 'application/pdf' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = resolve(directory, `.${pathname.endsWith('/') ? `${pathname}index.html` : pathname}`);
    if (!file.startsWith(`${directory}/`)) throw new Error('Forbidden');
    response.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream');
    response.end(await readFile(file));
  } catch { response.writeHead(404); response.end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ channel: 'chromium', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
await page.addInitScript(() => localStorage.setItem('tabhero:analytics-consent:v1', JSON.stringify({value:'rejected',at:Date.now()})));
const errors = [];
const badResponses = [];
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => { if (response.status() >= 400) badResponses.push(response.url()); });

try {
  const locales = ['en', 'es-419', 'pt-BR', 'id', 'hi'];
  const catalogs = [];
  const version = JSON.parse(await readFile('package.json', 'utf8')).version;
  const officialStores = {
    chrome: 'https://chromewebstore.google.com/detail/akceknbdadnbmehonkicfhicoebhalgk',
    firefox: 'https://addons.mozilla.org/en-US/firefox/addon/tabhero-new-chat-same-tab/'
  };
  const receivingEnabled = JSON.parse(await readFile('website/funding.json', 'utf8')).enabled === true;
  const load = async path => {
    await page.goto(new URL(path, url).href);
    await page.waitForFunction(() => document.documentElement.dataset.i18nReady === 'true');
    await page.evaluate(() => document.fonts.ready);
  };
  await mkdir('artifacts', { recursive: true });
  for (const locale of locales) {
    const catalog = JSON.parse(await readFile(`website/locales/${locale}.json`, 'utf8'));
    catalogs.push(catalog);
    const path = catalog.path ? `${catalog.path}/` : '';
    const staticHtml = await (await page.request.get(new URL(path, url).href)).text();
    assert.match(staticHtml, /id="download-extension" href="https:\/\/chromewebstore\.google\.com\/detail\/akceknbdadnbmehonkicfhicoebhalgk"(?![^>]*\bdownload)/, `${locale}: official store link works before JavaScript`);
    await page.setViewportSize({ width: 1440, height: 1050 });
    await load(path);
    assert.equal(await page.locator('html').getAttribute('lang'), locale);
    assert.equal(await page.locator('#language-select').inputValue(), locale);
    assert.equal(await page.locator('link[rel="alternate"]').count(), 6);
    assert.match(await page.title(), /TabHero/);
    assert.equal(await page.locator('[data-version]').textContent(), version);
    assert.doesNotMatch(await page.locator('body').textContent(), /__(?:BRAND|WORDMARK|I18N|META|LANG)/);
    assert.equal(await page.locator('#download-extension').getAttribute('href'), officialStores.chrome);
    assert.equal(await page.locator('#download-extension').getAttribute('download'), null);
    assert.match(await page.locator('#install-steps').textContent(), /Chrome Web Store/);
    assert.doesNotMatch(await page.locator('#install-steps').textContent(), /chrome:\/\/extensions/);
    await page.waitForFunction(enabled => document.querySelector('#support-submit').disabled === !enabled, receivingEnabled);
    assert.equal(await page.locator('#support-submit').isDisabled(), !receivingEnabled);
    await page.locator('#run-demo').click();
    assert.equal(await page.locator('.sim-tab').count(), 1);
    assert.equal(await page.locator('#sim-document').textContent(), catalog.ui.afterDoc);
    assert.equal(await page.locator('#sim-draft').textContent(), catalog.ui.afterDraft);
    await page.locator('[data-mode="before"]').click();
    await page.locator('#run-demo').click();
    await page.locator('#run-demo').click();
    assert.equal(await page.locator('.sim-tab').count(), 3);
    await page.locator('[data-mode="after"]').click();
    await page.locator('[data-browser="firefox"]').click();
    assert.match(await page.locator('#install-steps').textContent(), /Mozilla Add-ons/);
    assert.doesNotMatch(await page.locator('#install-steps').textContent(), /manifest.json|about:debugging/);
    assert.equal(await page.locator('#install-title').textContent(), catalog.ui.firefoxTitle);
    assert.equal(await page.locator('#download-extension').getAttribute('href'), officialStores.firefox);
    assert.equal(await page.locator('#download-extension').getAttribute('download'), null);
    assert.equal(await page.locator('#install-note').textContent(), catalog.ui.firefoxNote);
    await page.locator('[data-browser="chrome"]').click();
    assert.equal(await page.locator('#download-extension').getAttribute('href'), officialStores.chrome);
    assert.equal(await page.locator('#install-note').textContent(), catalog.ui.chromeNote);
    await page.locator('[data-amount="custom"]').click();
    assert.equal(await page.locator('#custom-note').isVisible(), true);
    assert.equal(await page.locator('#support-submit').isDisabled(), true, 'Custom amount starts empty');
    await page.locator('#support-custom-amount').fill('17');
    assert.equal(await page.locator('#support-submit').isDisabled(), !receivingEnabled);
    await page.locator('[data-amount="100"]').click();
    if (locale === 'en') {
      assert.equal(await page.locator('h1').innerText(), 'Another tab?\nIt’s already\nopen.');
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: 'artifacts/site-desktop.png' });
      await page.screenshot({ path: 'artifacts/site-full.png', fullPage: true });
    }
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${locale}: no overflow at ${width}px`);
      if (width === 390) { await page.evaluate(() => scrollTo(0, 0)); await page.screenshot({ path: `artifacts/site-${locale}-mobile.png`, fullPage: true }); }
    }
    await page.goto(new URL(`${path}privacy.html`, url).href);
    assert.equal(await page.locator('html').getAttribute('lang'), locale);
    assert.equal(await page.title(), catalog.privacy.title);
    assert.equal(await page.locator('h1').innerHTML(), catalog.privacy.heading);
    await page.goto(new URL(`${path}research.html`, url).href);
    await page.waitForFunction(() => document.documentElement.dataset.researchReady === 'true');
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.title(), catalog.community.title);
    assert.equal(await page.locator('html').getAttribute('lang'), locale);
    assert.equal(await page.locator('[data-report]:visible').count(), 8);
    assert.equal(await page.locator('link[rel="alternate"]').count(), 6);
    assert.doesNotMatch(await page.locator('body').textContent(), /__[A-Z_]+__/);
    await page.locator('[data-filter="direct"]').click();
    assert.equal(await page.locator('[data-report]:visible').count(), 4);
    assert.equal(await page.locator('#report-count').textContent(), catalog.community.count.replace('{count}', new Intl.NumberFormat(locale).format(4)));
    await page.locator('[data-filter="related"]').click();
    assert.equal(await page.locator('[data-report]:visible').count(), 4);
    assert.equal(await page.locator('[data-kind="direct"]:visible').count(), 0);
    await page.locator('[data-filter="all"]').click();
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${locale}: community no overflow at ${width}px`);
      if (locale === 'en' || locale === 'pt-BR') await page.screenshot({ path: `artifacts/community-${locale}-${width}.png`, fullPage: true });
    }
    console.log(`OK site ${locale}: official store links, UI, downloads, privacy, community filters and responsive layout.`);
  }
  // Exercise the real buttons without installing an extension or contacting a store.
  for (const [name, storeUrl] of Object.entries(officialStores)) {
    await page.route(storeUrl, route => route.abort());
    await load('');
    await page.locator(`[data-browser="${name}"]`).click();
    const [request] = await Promise.all([
      page.waitForRequest(storeUrl),
      page.locator('#download-extension').click({ noWaitAfter: true })
    ]);
    assert.equal(request.url(), storeUrl, `${name}: install button opens the official listing`);
  }
  await load('');
  await Promise.all([page.waitForURL(new URL('es/', url).href), page.locator('#language-select').selectOption('es-419')]);
  await page.waitForFunction(() => document.documentElement.dataset.i18nReady === 'true');
  assert.equal(await page.locator('html').getAttribute('lang'), 'es-419');
  await page.goto(new URL('es/privacy.html', url).href);
  await Promise.all([page.waitForURL(new URL('hi/privacy.html', url).href), page.locator('#language-select').selectOption('hi')]);
  assert.equal(await page.locator('html').getAttribute('lang'), 'hi');
  console.log('OK site: language selector preserves the privacy route.');
  await page.goto(new URL('es/research.html', url).href);
  await Promise.all([page.waitForURL(new URL('pt-br/research.html', url).href), page.locator('#language-select').selectOption('pt-BR')]);
  assert.equal(await page.locator('html').getAttribute('lang'), 'pt-BR');
  console.log('OK site: language selector preserves the research route.');
  for (const file of ['tabhero-chrome.zip','tabhero-firefox.zip','tabhero-brand-kit.zip','jata-chrome.zip']) {
    const archive = await page.request.get(new URL(`downloads/${file}`, url).href);
    assert.equal(archive.ok(), true);
    assert.equal((await archive.body()).subarray(0, 2).toString(), 'PK');
  }
  await page.goto(new URL('brand-book.html', url).href);
  await page.evaluate(() => document.fonts.ready);
  assert.match(await page.title(), /TabHero/);
  assert.equal((await page.request.get(new URL('assets/brand-book.pdf',url).href)).ok(), true);
  await page.route('**/funding.json', route => route.fulfill({ json: { provider: 'github', enabled: true, githubSponsors: 'https://github.com/sponsors/klederson' } }));
  await page.route('https://github.com/**', route => route.fulfill({ contentType: 'text/html', body: '<h1>Mock checkout</h1>' }));
  await load('');
  await page.waitForFunction(() => !document.querySelector('#support-submit').disabled);
  await page.locator('[data-amount="500"]').click();
  await page.locator('#support-submit').click();
  await page.waitForURL('https://github.com/sponsors/klederson/sponsorships?amount=5&frequency=one-time');
  assert.deepEqual(errors, []);
  assert.deepEqual(badResponses, []);
  console.log('OK site: configured Sponsors handoff; no real payment performed.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
