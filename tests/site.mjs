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
const errors = [];
const badResponses = [];
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => { if (response.status() >= 400) badResponses.push(response.url()); });

try {
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => document.querySelector('#support-status').textContent.includes('não foi ativado'));
  assert.equal(await page.locator('#support-submit').isDisabled(), true, 'Sem perfil ativo, não oferecer cobrança falsa');
  assert.equal(await page.locator('h1').innerText(), 'Outra aba?\nPoxa, já tá\naberto.');
  await page.locator('#run-demo').click();
  assert.equal(await page.locator('.sim-tab').count(), 1);
  assert.match(await page.locator('#sim-document').textContent(), /Documento preservado/);
  await page.locator('[data-mode="before"]').click();
  await page.locator('#run-demo').click();
  await page.locator('#run-demo').click();
  assert.equal(await page.locator('.sim-tab').count(), 3);
  await page.locator('[data-mode="after"]').click();
  assert.equal(await page.locator('.sim-tab').count(), 1);
  console.log('OK site: demonstração ilustrativa diferencia os fluxos sem abrir WhatsApp.');

  await page.locator('[data-browser="firefox"]').click();
  assert.match(await page.locator('#install-steps').textContent(), /manifest.json/);
  assert.match(await page.locator('#download-extension').getAttribute('href'), /jata-firefox.zip$/);
  await page.locator('[data-browser="chrome"]').click();
  const downloadUrl = new URL(await page.locator('#download-extension').getAttribute('href'), url);
  const archive = await page.request.get(downloadUrl.href);
  assert.equal(archive.ok(), true);
  assert.equal((await archive.body()).subarray(0, 2).toString(), 'PK');
  const kit = await page.request.get(`${url}downloads/jata-brand-kit.zip`);
  assert.equal(kit.ok(), true);
  assert.equal((await kit.body()).subarray(0, 2).toString(), 'PK');
  console.log('OK site: instruções dos navegadores e pacotes ZIP funcionam.');

  await page.locator('[data-amount="custom"]').click();
  assert.equal(await page.locator('#custom-note').isVisible(), true);
  assert.match(await page.locator('#custom-note').textContent(), /GitHub Sponsors/);
  assert.equal(await page.locator('#support-submit').isDisabled(), true);
  await page.locator('[data-amount="100"]').click();
  await page.locator('summary').filter({ hasText: 'Está tudo pronto' }).click();
  assert.match(await page.locator('details[open]').textContent(), /não comprovam/);
  await page.locator('summary').filter({ hasText: 'Está tudo pronto' }).click();

  await mkdir('artifacts', { recursive: true });
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: 'artifacts/site-desktop.png' });
  await page.screenshot({ path: 'artifacts/site-full.png', fullPage: true });
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Sem overflow horizontal em ${width}px`);
    if (width === 390) await page.screenshot({ path: 'artifacts/site-mobile.png', fullPage: true });
  }
  console.log('OK site: responsivo em 390, 768 e 1440px; capturas salvas em artifacts.');

  await page.goto(`${url}brand-book.html`);
  await page.evaluate(() => document.fonts.ready);
  assert.match(await page.title(), /JáTá/);
  assert.equal((await page.request.get(`${url}assets/brand-book.pdf`)).ok(), true);
  await page.goto(`${url}privacy.html`);
  assert.match(await page.locator('h1').textContent(), /Conversa sua/);

  // A configured destination enables the handoff; the actual payment page is
  // mocked here, and no sponsorship/payment is made by this test.
  await page.route('**/funding.json', route => route.fulfill({ json: { provider: 'github', enabled: true, githubSponsors: 'https://github.com/sponsors/klederson' } }));
  await page.route('https://github.com/sponsors/klederson', route => route.fulfill({ contentType: 'text/html', body: '<h1>Checkout simulado</h1>' }));
  await page.goto(url);
  await page.waitForFunction(() => !document.querySelector('#support-submit').disabled);
  await page.locator('#support-submit').click();
  await page.waitForURL('https://github.com/sponsors/klederson');
  console.log('OK site: encaminhamento para Sponsors configurado; nenhum pagamento real executado.');
  assert.deepEqual(errors, []);
  assert.deepEqual(badResponses, []);
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
