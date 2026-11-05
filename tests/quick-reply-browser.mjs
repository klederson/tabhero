// Real Chromium extension APIs; WhatsApp and the AI response are simulated.
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';
import { dismissChromiumWelcome } from './installation.mjs';
const profile = await mkdtemp(join(tmpdir(), 'tabhero-quick-reply-'));
const extension = resolve('dist/chrome');
const context = await chromium.launchPersistentContext(profile, { channel: 'chromium', headless: true, args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`] });
const errors = [];
context.on('weberror', error => errors.push(error.error().message));
const fixture = await readFile(new URL('./fixtures/whatsapp.html', import.meta.url), 'utf8');
const receivingEnabled = JSON.parse(await readFile(new URL('../website/funding.json', import.meta.url), 'utf8')).enabled === true;
let requests = 0;
try {
  await context.route('https://web.whatsapp.com/**', route => { requests++; return route.fulfill({ contentType: 'text/html', body: fixture }); });
  await context.route('https://work.test/**', route => route.fulfill({ contentType: 'text/html', body: '<title>Work</title><textarea id="work">Meu trabalho em andamento</textarea>' }));
  const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
  // Finish the first-install experience before measuring the work tab's focus.
  // Opening welcome is intentionally part of installation, not quick reply.
  await dismissChromiumWelcome(context);
  const workerUrl = new URL(worker.url());
  const extensionOrigin = `${workerUrl.protocol}//${workerUrl.host}`;
  const work = context.pages()[0]; await work.goto('https://work.test/');
  const workId = await worker.evaluate(async () => (await chrome.tabs.query({ active: true, currentWindow: true }))[0].id);
  const whatsapp = await context.newPage(); await whatsapp.goto('https://web.whatsapp.com/');
  const originalDocument = await whatsapp.evaluateHandle(() => document);
  const documentToken = await whatsapp.evaluate(() => documentToken);
  const originalDraft = await whatsapp.locator('#compose').inputValue();
  let navigations = 0;
  whatsapp.on('framenavigated', frame => { if (frame === whatsapp.mainFrame()) navigations++; });
  const ids = await worker.evaluate(async () => Object.fromEntries((await chrome.tabs.query({})).filter(tab => /https:\/\/(work\.test|web\.whatsapp\.com)/.test(tab.url ?? '')).map(tab => [new URL(tab.url).hostname, tab.id])));
  const unchanged = async () => {
    assert.equal(whatsapp.url(), 'https://web.whatsapp.com/');
    assert.equal(await whatsapp.evaluate(original => document === original, originalDocument), true);
    assert.equal(await whatsapp.evaluate(() => documentToken), documentToken);
    assert.equal(await whatsapp.locator('#compose').inputValue(), originalDraft);
    assert.equal(await whatsapp.evaluate(() => appState.opens.length), 0);
    assert.equal(navigations, 0); assert.equal(requests, 1);
    assert.equal(await work.locator('#work').inputValue(), 'Meu trabalho em andamento');
    assert.equal(await worker.evaluate(async () => (await chrome.tabs.query({ active: true, currentWindow: true }))[0].id), workId);
  };
  let popup = await context.newPage();
  const chooseRecipient = async (id, query) => {
    await popup.locator('#recipient').click();
    await popup.locator('#recipient-search').fill(query);
    await popup.locator(`[role="option"][data-chat-id="${id}"]`).click();
    await popup.waitForFunction(() => !document.querySelector('#recipient').disabled && document.querySelector('#recipient-menu').hidden);
  };
  await work.bringToFront();
  await popup.goto(`${extensionOrigin}/popup.html`);
  await popup.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  await work.bringToFront();
  await popup.locator('#recipient').click();
  await popup.locator('#recipient-options [role="option"]').first().waitFor({ state: 'visible' });
  assert.equal(await popup.locator('#recipient-options [role="option"]').count(), 2);
  await popup.locator('#recipient-search').press('Escape');
  assert.match(await popup.locator('#received').textContent(), /pão/);
  const unauthorized = await context.newPage();
  await unauthorized.goto(`${extensionOrigin}/handoff.html`);
  const rejected = await unauthorized.evaluate(() => chrome.runtime.sendMessage({ type: 'qr-send', text: 'Not authorized' }));
  assert.equal(rejected.code, 'unauthorized-source');
  await unauthorized.close();
  await work.bringToFront();
  // Background's selected-target snapshot also updates the real browser badge.
  assert.equal(await worker.evaluate(() => chrome.action.getBadgeText({})), '3');
  assert.deepEqual(await worker.evaluate(() => chrome.action.getBadgeBackgroundColor({})), [180, 35, 24, 255]);
  await popup.locator('#recipient').click();
  await popup.locator('#recipient-search').fill('joao');
  await popup.locator('#recipient-options [role="option"]').first().waitFor({ state: 'visible' });
  await popup.locator('#recipient-search').press('ArrowDown');
  await popup.locator('#recipient-search').press('Enter');
  await popup.waitForFunction(() => !document.querySelector('#recipient').disabled && document.querySelector('#recipient-value').textContent.includes('João'));
  assert.equal(await whatsapp.evaluate(() => appState.messages.length), 0, 'Searching and keyboard selection must not send');
  await chooseRecipient('12025550140@c.us', 'padaria');
  await popup.locator('#reply').fill('Oi 👋\nJá vou conferir + café & pão.');
  await popup.locator('#privacy').click();
  assert.equal(await popup.locator('#privacy-panel').isVisible(), true);
  assert.equal(await popup.locator('#main-panel').isVisible(), false);
  assert.equal(await popup.locator('[data-disclosure="privacySource"]').getAttribute('href'), 'https://github.com/klederson/tabhero');
  await popup.locator('#privacy-panel [data-back]').click();
  assert.equal(await popup.locator('#privacy-panel').isVisible(), false);
  assert.equal(await popup.locator('#reply').inputValue(), 'Oi 👋\nJá vou conferir + café & pão.');
  await popup.waitForFunction(() => document.documentElement.dataset.supportReady === 'true');
  await popup.locator('#support').click();
  assert.equal(await popup.locator('#support-panel').isVisible(), true);
  assert.equal(await popup.locator('#sponsor-button').isDisabled(), !receivingEnabled, 'Support availability must match the bundled receiving state');
  assert.equal(await popup.locator('#support-pending').isVisible(), !receivingEnabled);
  assert.match(await popup.locator('.support-price').textContent(), /US\$ 1/);
  await mkdir('artifacts', { recursive: true });
  await popup.setViewportSize({ width: 390, height: 600 });
  const supportAction = await popup.locator('#sponsor-button').boundingBox();
  assert.ok(supportAction.y + supportAction.height <= 600, 'Support action must fit in the popup without scrolling');
  await popup.screenshot({ path: 'artifacts/extension-support.png', fullPage: true });
  await popup.locator('#support-panel [data-back]').click();
  assert.equal(await popup.locator('#reply').inputValue(), 'Oi 👋\nJá vou conferir + café & pão.');
  await popup.waitForTimeout(100);
  await popup.close();
  popup = await context.newPage(); await work.bringToFront(); await popup.goto(`${extensionOrigin}/popup.html`);
  await popup.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  assert.equal(await popup.locator('#reply').inputValue(), 'Oi 👋\nJá vou conferir + café & pão.');
  await popup.locator('#recipient').click();
  await popup.locator('#recipient-search').fill('joao');
  await popup.locator('#recipient-options [role="option"]').first().waitFor({ state: 'visible' });
  assert.match(await popup.locator('#recipient-value').textContent(), /Bia/);
  assert.equal(await popup.locator('#reply').inputValue(), 'Oi 👋\nJá vou conferir + café & pão.');
  await popup.locator('#recipient-search').press('Escape');
  console.log('OK quick reply: recovered draft after closing the panel; real badge shows unread count.');

  await popup.locator('#manage').click(); await popup.locator('#new-reply').click();
  await popup.locator('#saved-title').fill('Prazo'); await popup.locator('#saved-text').fill('Em cinco minutos.');
  await popup.locator('#saved-form button[type="submit"]').click();
  await popup.waitForFunction(() => document.querySelectorAll('.saved-row').length === 1);
  await popup.locator('#saved-panel [data-back]').click();
  await popup.locator('#recipient').click();
  await popup.locator('#recipient-search').fill('nobody here');
  await popup.waitForFunction(() => document.querySelector('#recipient-empty').textContent === 'No conversations found.');
  assert.match(await popup.locator('#recipient-value').textContent(), /Bia/);
  await popup.locator('#recipient-search').press('Escape');
  await chooseRecipient('12025550141@c.us', 'JOAO');
  await popup.waitForFunction(() => !document.querySelector('#recipient').disabled);
  await popup.getByRole('button', { name: 'Prazo', exact: true }).click();
  assert.equal(await popup.locator('#reply').inputValue(), 'Em cinco minutos.');
  await work.bringToFront();
  // Evaluate a click without bringing this test panel tab to the front.
  await popup.evaluate(() => { document.querySelector('#send').click(); document.querySelector('#send').click(); });
  await popup.waitForFunction(() => document.querySelector('#status').textContent.includes('Passed to WhatsApp'));
  assert.deepEqual(await whatsapp.evaluate(() => appState.messages), [{ to: '12025550141@c.us', text: 'Em cinco minutos.' }]);
  await unchanged();
  console.log('OK quick reply: saved reply sent once to the selected chat, with work active and WhatsApp state intact.');

  // Fixture-only credentials, permissions and network response. No real AI call.
  await worker.evaluate(async () => {
    await chrome.storage.local.set({ qrAiKey: 'fictional-test-key' });
    chrome.permissions.contains = async () => true;
    globalThis.aiRequests = [];
    globalThis.fetch = async (url, options) => {
      aiRequests.push({ url, body: JSON.parse(options.body) });
      return new Response(JSON.stringify({ choices: [{ message: { content: 'Oi! Vou conferir o horário e te aviso.' } }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };
  });
  await popup.locator('#refresh').click();
  await popup.waitForFunction(() => !document.querySelector('#refresh').disabled);
  await popup.locator('#suggest').click();
  await popup.waitForFunction(() => document.querySelector('#reply').value.includes('Vou conferir'));
  assert.equal(await whatsapp.evaluate(() => appState.messages.length), 1, 'AI must not send');
  const aiRequests = await worker.evaluate(() => aiRequests);
  assert.equal(aiRequests.length, 1);
  assert.equal(aiRequests[0].body.model, 'openrouter/free');
  assert.deepEqual(JSON.parse(aiRequests[0].body.messages[1].content), { receivedMessage: 'Pode confirmar o horário?', myDraft: '' });
  await mkdir('artifacts', { recursive: true });
  await popup.setViewportSize({ width: 390, height: 600 });
  await popup.screenshot({ path: 'artifacts/quick-reply-panel.png', fullPage: true });
  await popup.locator('#reply').fill('Confirmo às quatro.');
  await work.bringToFront(); await popup.evaluate(() => document.querySelector('#send').click());
  await popup.waitForFunction(() => document.querySelector('#reply').value === '');
  await unchanged();
  assert.equal(await whatsapp.evaluate(() => appState.messages[1].text), 'Confirmo às quatro.');
  console.log('OK quick reply: AI only suggests; edited free text sends on click without changing focus.');

  await whatsapp.evaluate(() => {
    const target = require('WAWebChatCollection').ChatCollection.getModelsArray().find(chat => chat.id._serialized === '12025550141@c.us');
    target.msgs.getModelsArray = () => [{ type: 'chat', body: 'Older text', id: { fromMe: false } }, { type: 'image', caption: 'Bolo <sem HTML>', id: { fromMe: false } }];
  });
  await popup.locator('#refresh').click();
  await popup.waitForFunction(() => !document.querySelector('#refresh').disabled);
  assert.equal(await popup.locator('.received-media').textContent(), '▧ Photo');
  assert.equal(await popup.locator('.received-text').textContent(), 'Bolo <sem HTML>');
  assert.equal(await popup.locator('#received').locator('img,script').count(), 0);
  await whatsapp.evaluate(() => {
    const target = require('WAWebChatCollection').ChatCollection.getModelsArray().find(chat => chat.id._serialized === '12025550141@c.us');
    target.msgs.getModelsArray = () => [{ type: 'ptt', id: { fromMe: false } }];
  });
  await popup.locator('#refresh').click();
  await popup.waitForFunction(() => !document.querySelector('#refresh').disabled);
  assert.equal(await popup.locator('.received-media').textContent(), '◉ Voice message');
  assert.equal(await popup.locator('#suggest').isDisabled(), true, 'AI cannot pretend to hear a media placeholder');
  await popup.screenshot({ path: 'artifacts/extension-media.png', fullPage: true });
  console.log('OK preview: latest photo caption and voice placeholder; no media download or automatic send.');

  await whatsapp.evaluate(() => { integrationUnavailable = true; });
  await popup.locator('#reply').fill('Guardado na falha');
  await work.bringToFront(); await popup.evaluate(() => document.querySelector('#send').click());
  await popup.waitForFunction(() => document.querySelector('#status').dataset.error === 'true');
  assert.equal(await whatsapp.evaluate(() => appState.messages.length), 2);
  assert.equal(await popup.locator('#reply').inputValue(), 'Guardado na falha');
  await unchanged();
  await whatsapp.evaluate(() => { integrationUnavailable = false; sendUncertain = true; });
  await popup.evaluate(() => document.querySelector('#send').click());
  await popup.locator('#checked').waitFor({ state: 'visible' });
  assert.equal(await popup.locator('#send').isDisabled(), true);
  assert.equal(await whatsapp.evaluate(() => appState.messages.length), 3);
  await popup.close(); popup = await context.newPage(); await work.bringToFront(); await popup.goto(`${extensionOrigin}/popup.html`);
  await popup.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  await chooseRecipient('12025550141@c.us', 'joao');
  await popup.waitForFunction(() => !document.querySelector('#recipient').disabled);
  assert.equal(await popup.locator('#checked').isVisible(), true);
  assert.equal(await popup.locator('#send').isDisabled(), true);
  assert.equal(await whatsapp.evaluate(() => appState.messages.length), 3, 'Reopening must not resend an uncertain operation');
  await work.bringToFront(); await unchanged();
  console.log('OK quick reply: failure keeps the draft; uncertain sends stay blocked after reopening.');

  await popup.locator('#checked').click();
  await chooseRecipient('12025550140@c.us', 'padaria');
  await popup.waitForFunction(() => !document.querySelector('#recipient').disabled);
  await popup.locator('#reply').fill('Stale target');
  await whatsapp.evaluate(() => { delete globalThis[Symbol.for('TabHero.quickReply.v1')]; sendUncertain = false; });
  await work.bringToFront(); await popup.evaluate(() => document.querySelector('#send').click());
  await popup.waitForFunction(() => document.querySelector('#status').textContent.includes('conversation changed'));
  assert.equal(await whatsapp.evaluate(() => appState.messages.length), 3);
  await unchanged();
  await mkdir('artifacts', { recursive: true });
  await popup.screenshot({ path: 'artifacts/quick-reply-error.png', fullPage: true });
  // Simulate a future public Sponsors profile; never contact a real checkout.
  await context.route('https://github.com/**', route => route.fulfill({ contentType: 'text/html', body: '<h1>Simulated Sponsors page</h1>' }));
  await popup.addInitScript(() => {
    const original = globalThis.fetch.bind(globalThis);
    globalThis.fetch = (url, options) => String(url).endsWith('/funding.json')
      ? Promise.resolve(new Response(JSON.stringify({ provider: 'github', currency: 'USD', minimum: 100, githubSponsors: 'https://github.com/sponsors/klederson', enabled: true }), { status: 200 }))
      : original(url, options);
  });
  await popup.reload();
  await popup.waitForFunction(() => document.documentElement.dataset.ready === 'true' && document.documentElement.dataset.supportReady === 'true');
  await popup.locator('#support').click();
  assert.equal(await popup.locator('#sponsor-button').isEnabled(), true);
  assert.equal(await popup.locator('#support-pending').isVisible(), false);
  await popup.locator('[data-support-amount="5"]').click();
  assert.equal(await popup.locator('[data-support-amount="5"]').getAttribute('aria-pressed'), 'true');
  assert.equal(await popup.locator('#support-selected-amount').textContent(), 'US$ 5');
  // tabs.create can start navigation before Playwright attaches interception.
  // Defer this test tab's navigation, preserving and checking the requested URL.
  await popup.evaluate(() => {
    const create = chrome.tabs.create.bind(chrome.tabs);
    chrome.tabs.create = options => {
      globalThis.requestedSupportUrl = options.url;
      return create({ ...options, url: 'about:blank' });
    };
  });
  const checkSupportAmount = async amount => {
    const sponsorTabPromise = context.waitForEvent('page');
    await popup.locator('#sponsor-button').click();
    const sponsorTab = await sponsorTabPromise;
    const requestedSupportUrl = await popup.evaluate(() => requestedSupportUrl);
    assert.equal(requestedSupportUrl, `https://github.com/sponsors/klederson/sponsorships?amount=${amount}&frequency=one-time`);
    await sponsorTab.goto(requestedSupportUrl);
    assert.equal(await sponsorTab.locator('h1').textContent(), 'Simulated Sponsors page');
    await sponsorTab.close();
  };
  await checkSupportAmount(5);
  await popup.locator('[data-support-amount="custom"]').click();
  await popup.locator('#support-custom-amount').fill('0');
  assert.equal(await popup.locator('#sponsor-button').isDisabled(), true);
  await popup.locator('#support-custom-amount').fill('27');
  assert.equal(await popup.locator('#sponsor-button').isEnabled(), true);
  await checkSupportAmount(27);
  await work.bringToFront(); await unchanged();
  console.log('OK support: bundled receiving state respected; simulated handoff opens only GitHub Sponsors. No payment.');
  assert.deepEqual(errors, []);
  console.log('OK quick reply: stale document rejected, no navigation fallback. All tests used simulated services.');
} finally { await context.close(); await rm(profile, { recursive: true, force: true }); }
