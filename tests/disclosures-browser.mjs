// Actual Chromium extension installation; no authenticated WhatsApp or AI.
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { chromium } from 'playwright';
import { disclosureCatalogs } from '../extension/privacy-i18n.js';
const profile = await mkdtemp(join(tmpdir(), 'tabhero-disclosures-'));
const extension = resolve('dist/chrome');
const context = await chromium.launchPersistentContext(profile, { channel: 'chromium', headless: true, args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`] });
const external = [];
context.on('request', request => { if (/^https?:/.test(request.url())) external.push(request.url()); });
try {
  const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
  let welcome;
  for (let attempt = 0; attempt < 100 && !welcome; attempt++) {
    welcome = context.pages().find(page => page.url().endsWith('/welcome.html'));
    if (!welcome) await new Promise(resolve => setTimeout(resolve, 50));
  }
  assert.ok(welcome, 'A fresh install must open its bundled disclosure page');
  await welcome.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  assert.match(await welcome.locator('[data-disclosure="privacySummary"]').textContent(), /No developer server/);
  assert.equal(await welcome.locator('[data-disclosure="privacySource"]').getAttribute('href'), 'https://github.com/klederson/tabhero');
  assert.equal(await worker.evaluate(() => chrome.permissions.contains({ origins: ['https://openrouter.ai/*'] })), false);
  assert.equal(await worker.evaluate(async () => (await chrome.storage.local.get('qrAiKey')).qrAiKey), undefined);
  assert.deepEqual(external, [], 'Reading installation disclosures must not contact a remote service');
  for (const [language, messages] of Object.entries(disclosureCatalogs)) {
    await welcome.evaluate(async language => {
      const { renderDisclosures } = await import('./privacy-i18n.js');
      renderDisclosures(document, { i18n: { getMessage: () => language } });
    }, language);
    for (const node of await welcome.locator('[data-disclosure]').all()) {
      const key = await node.getAttribute('data-disclosure');
      assert.equal(await node.textContent(), messages[key], `${language}:${key}`);
    }
  }
  assert.equal(await worker.evaluate(() => chrome.permissions.contains({ origins: ['https://openrouter.ai/*'] })), false);
  const closed = welcome.waitForEvent('close');
  await welcome.locator('#start').click();
  await closed;
  console.log('OK disclosures: fresh-install page, all five languages, generic source link, no AI permission/key or external request; dismiss closes only welcome.');
} finally { await context.close(); await rm(profile, { recursive: true, force: true }); }
