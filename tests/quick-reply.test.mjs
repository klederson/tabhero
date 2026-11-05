import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { quickReplyInPage } from '../extension/quick-reply-page.js';
import { suggestReply, aiPermissions } from '../extension/quick-reply-ai.js';
import { popupCatalogs } from '../extension/popup-i18n.js';
import { createQuickReplyController, sameContext } from '../extension/quick-reply.js';
const fixture = await readFile(new URL('./fixtures/whatsapp.html', import.meta.url), 'utf8');
function app() {
  const elements = { contact: { textContent: 'Original contact' }, compose: { value: 'Unfinished original draft' } };
  const sandbox = { crypto: { randomUUID: () => 'original-document' }, document: { getElementById: id => elements[id], documentElement: { hasAttribute: () => false } },
    location: Object.freeze({ origin: 'https://web.whatsapp.com' }), setTimeout, clearTimeout };
  sandbox.window = sandbox;
  runInNewContext(fixture.match(/<script nonce="fixture">([\s\S]*?)<\/script>/)[1], sandbox);
  return { sandbox, elements, run: runInNewContext(`(${quickReplyInPage.toString()})`, sandbox) };
}
const operationId = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
test('quick reply sends to the selected recipient while preserving the active chat and composer', async () => {
  const { sandbox, elements, run } = app();
  const snapshot = await run({ action: 'snapshot' });
  assert.equal(snapshot.ok, true); assert.equal(snapshot.unread, 3);
  assert.equal(snapshot.chats[0].name, 'Bia · Padaria');
  const result = await run({ action: 'send', documentId: snapshot.documentId, chatId: snapshot.chats[1].id, text: 'Confirmado 👋\n+ pão & café', operationId });
  assert.equal(result.ok, true);
  assert.equal(sandbox.appState.messages.length, 1);
  assert.equal(sandbox.appState.messages[0].to, '12025550141@c.us');
  assert.equal(sandbox.appState.messages[0].text, 'Confirmado 👋\n+ pão & café');
  assert.equal(elements.compose.value, 'Unfinished original draft');
  assert.equal(elements.contact.textContent, 'Original contact');
  assert.equal(sandbox.appState.opens.length, 0);
  assert.equal(sandbox.require('WAWebChatCollection').ChatCollection.getModelsArray()[0].active, true);
  assert.equal(sandbox.documentToken, 'original-document');
});
test('stale documents, missing chats and unavailable modules cannot send', async () => {
  const { sandbox, run } = app();
  const payload = { action: 'send', documentId: 'original-document', chatId: '12025550140@c.us', text: 'Oi', operationId };
  assert.equal((await run({ ...payload, documentId: 'other-document' })).code, 'stale-document');
  assert.equal((await run({ ...payload, chatId: '999@c.us' })).code, 'stale-chat');
  sandbox.integrationUnavailable = true;
  assert.equal((await run(payload)).code, 'unavailable');
  assert.equal(sandbox.appState.messages.length, 0);
});
test('duplicate sends and uncertain dispatches are never automatically retried', async () => {
  for (const uncertain of [false, true]) {
    const { sandbox, run } = app(); sandbox.sendUncertain = uncertain;
    const payload = { action: 'send', documentId: 'original-document', chatId: '12025550140@c.us', text: 'Oi', operationId };
    const [first, second] = await Promise.all([run(payload), run(payload)]);
    assert.equal(first.ok, !uncertain);
    if (uncertain) assert.equal(second.code, 'send-unknown');
    await run(payload);
    assert.equal(sandbox.appState.messages.length, 1);
  }
});
test('changing the signed-in account inside one document invalidates the prepared recipient', async () => {
  const { sandbox, run } = app();
  const prepared = await run({ action: 'snapshot' });
  sandbox.fixtureAccount = '12025550999@c.us';
  sandbox.crypto.randomUUID = () => 'new-account-document';
  const result = await run({ action: 'send', documentId: prepared.documentId, chatId: '12025550140@c.us', text: 'Oi', operationId });
  assert.equal(result.code, 'stale-document');
  assert.equal(sandbox.appState.messages.length, 0);
});
test('AI sees only the explicit preview and draft, uses the free router, and returns editable text', async () => {
  let calls = 0;
  const fake = async (url, options) => {
    calls++;
    assert.equal(url, 'https://openrouter.ai/api/v1/chat/completions');
    assert.equal(options.headers.Authorization, 'Bearer fictional-key');
    assert.equal(options.redirect, 'error');
    const body = JSON.parse(options.body);
    assert.equal(body.model, 'openrouter/free');
    assert.equal(body.messages.length, 2);
    assert.deepEqual(JSON.parse(body.messages[1].content), { receivedMessage: 'Oi', myDraft: 'Já vejo' });
    assert.equal(body.tools, undefined);
    return { ok: true, json: async () => ({ choices: [{ message: { content: 'Oi! Já vou conferir.' } }] }) };
  };
  assert.equal((await suggestReply({ key: '', received: 'Oi', draft: '', language: 'pt' }, fake)).code, 'ai-connect');
  assert.equal(calls, 0);
  const result = await suggestReply({ key: 'fictional-key', received: 'Oi', draft: 'Já vejo', language: 'pt' }, fake);
  assert.equal(result.text, 'Oi! Já vou conferir.'); assert.equal(calls, 1);
  const limited = await suggestReply({ key: 'fictional-key', received: 'Oi', draft: '' }, async () => ({ ok: false, status: 429 }));
  assert.equal(limited.code, 'ai-limit');
});
test('popup has complete translations and does not cross private or container boundaries', () => {
  for (const catalog of Object.values(popupCatalogs)) { assert.deepEqual(Object.keys(catalog), Object.keys(popupCatalogs.en)); for (const value of Object.values(catalog)) assert.ok(value.trim()); }
  assert.equal(sameContext({ incognito: true }, { incognito: false }), false);
  assert.equal(sameContext({ cookieStoreId: 'work' }, { cookieStoreId: 'personal' }), false);
});
test('Firefox requests optional data consent only with the AI connection', () => {
  assert.deepEqual(aiPermissions({ runtime: {} }), { origins: ['https://openrouter.ai/*'] });
  assert.deepEqual(aiPermissions({ runtime: { getBrowserInfo() {} } }), { origins: ['https://openrouter.ai/*'], data_collection: ['authenticationInfo', 'personalCommunications'] });
});
test('background journal prevents duplicate dispatch after its controller restarts', async () => {
  const memory = {};
  const storage = { get: async key => Object.fromEntries((Array.isArray(key) ? key : [key]).map(name => [name, memory[name]])), set: async data => Object.assign(memory, data) };
  let dispatched = 0;
  const api = { storage: { local: storage, session: storage }, tabs: { get: async id => ({ id, url: id === 1 ? 'https://work.test/' : 'https://web.whatsapp.com/' }), query: async () => [{ id: 2, url: 'https://web.whatsapp.com/' }] },
    scripting: { executeScript: async () => { dispatched++; return [{ frameId: 0, result: { ok: true, status: 'accepted' } }]; } } };
  const payload = { type: 'qr-send', sourceTabId: 1, tabId: 2, documentId: 'original', chatId: '12025550140@c.us', text: 'Oi', operationId };
  assert.equal((await createQuickReplyController(api).handle(payload)).ok, true);
  assert.equal((await createQuickReplyController(api).handle(payload)).ok, true);
  assert.equal(dispatched, 1);
  assert.equal((await createQuickReplyController(api).handle({ ...payload, text: 'Different text' })).code, 'invalid-request');
});
