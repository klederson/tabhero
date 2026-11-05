import { popupMessages } from './popup-i18n.js';
import { aiPermissions } from './quick-reply-ai.js';
import { createRecipientPicker } from './recipient-picker.js';
import { loadSupport } from './support.js';
const api = globalThis.browser ?? globalThis.chrome;
const language = api.i18n.getMessage('language') || api.i18n.getUILanguage();
const t = popupMessages(language);
document.documentElement.lang = language;
document.title = `TabHero — ${t.title}`;
const $ = selector => document.querySelector(selector);
for (const node of document.querySelectorAll('[data-text]')) node.textContent = t[node.dataset.text];
for (const node of document.querySelectorAll('[data-title]')) { node.title = t[node.dataset.title]; node.setAttribute('aria-label', node.title); }
for (const node of document.querySelectorAll('[data-placeholder]')) node.placeholder = t[node.dataset.placeholder];
const state = { busy: false, uncertain: false, replies: [], snapshot: null, sourceTabId: null, tabId: null, chatId: null, scope: null, operationId: null, editing: null };
let draftWrites = Promise.resolve();
const status = (text = '', error = false) => { $('#status').textContent = text; $('#status').dataset.error = String(error); };
const failure = code => {
  if (code === 'send-unknown') return t.unknown;
  if (code === 'stale-document' || code === 'stale-chat') return t.stale;
  if (code === 'no-tab') return t.noTab;
  return ({ 'ai-connect': t.aiKey, 'ai-key': t.aiKey, 'ai-limit': t.aiLimit, 'ai-unavailable': t.aiUnavailable, 'ai-permission': t.aiPermission })[code] ?? t.unavailable;
};
const send = payload => api.runtime.sendMessage({ sourceTabId: state.sourceTabId, tabId: state.tabId, ...payload });
const chat = () => state.snapshot?.chats?.find(item => item.id === state.chatId);
const draftKey = () => state.scope && state.tabId && state.chatId ? `qr-draft:${state.scope}:${state.tabId}:${state.chatId}` : null;
const persist = () => {
  const key = draftKey();
  if (!key) return draftWrites;
  const draft = { text: $('#reply').value, documentId: state.snapshot?.documentId, operationId: state.operationId, uncertain: state.uncertain };
  draftWrites = draftWrites.catch(() => {}).then(() => draft.text || draft.operationId ? api.storage.session.set({ [key]: draft }) : api.storage.session.remove(key));
  return draftWrites;
};
const recipientPicker = createRecipientPicker({
  document, messages: t, blocked: () => Boolean(state.busy),
  error: () => status(t.checkFailed, true),
  openChanged: open => { state.searching = open; controls(); },
  load: async query => {
    if (!query.trim()) return state.snapshot?.chats ?? [];
    const result = await send({ type: 'qr-search', documentId: state.snapshot?.documentId, search: query });
    if (!result.ok) { status(failure(result.code), true); throw new Error('Search unavailable'); }
    return result.chats;
  },
  select: async item => {
    if (state.busy) return;
    state.busy = 'select'; controls();
    try {
      await persist();
      if (!state.snapshot.chats.some(existing => existing.id === item.id)) state.snapshot.chats.push(item);
      status(); await selectChat(item.id);
    } catch { status(t.checkFailed, true); }
    finally { state.busy = false; controls(); }
  }
});
function controls() {
  for (const id of ['account', 'refresh', 'manage', 'settings', 'support', 'support-footer']) $(`#${id}`).disabled = state.busy;
  recipientPicker.setDisabled(state.busy);
  $('#reply').disabled = state.busy || state.uncertain;
  $('#send').disabled = state.busy || state.searching || state.uncertain || !chat() || !$('#reply').value.trim();
  $('#suggest').disabled = state.busy || state.uncertain || !chat();
  for (const button of document.querySelectorAll('#saved-chips button')) button.disabled = state.busy || state.uncertain;
  $('#checked').hidden = !state.uncertain;
  $('#send').textContent = state.busy === 'send' ? t.sending : t.send;
  $('#suggest').textContent = `✦ ${state.busy === 'ai' ? t.generating : t.suggest}`;
}
function panel(id) {
  recipientPicker.close();
  for (const name of ['main-panel', 'ai-panel', 'saved-panel', 'support-panel']) $(`#${name}`).hidden = name !== id;
  status();
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}
function savedReplies() {
  $('#saved-chips').replaceChildren();
  $('#saved-list').replaceChildren();
  $('#no-saved').hidden = state.replies.length > 0;
  for (const item of state.replies) {
    const chip = document.createElement('button');
    chip.type = 'button'; chip.textContent = item.title; chip.title = item.text;
    chip.addEventListener('click', () => {
      if (state.busy || state.uncertain) return;
      $('#reply').value = $('#reply').value ? `${$('#reply').value}\n${item.text}` : item.text;
      state.operationId = null; persist().catch(() => status(t.checkFailed, true)); controls(); $('#reply').focus();
    });
    $('#saved-chips').append(chip);
    const row = document.createElement('article'); row.className = 'saved-row';
    const title = document.createElement('strong'); title.textContent = item.title;
    const text = document.createElement('p'); text.textContent = item.text;
    const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'link'; edit.textContent = t.edit;
    edit.addEventListener('click', () => editReply(item));
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'link'; remove.textContent = t.delete;
    remove.addEventListener('click', async () => {
      const next = state.replies.filter(reply => reply.id !== item.id);
      try { const result = await send({ type: 'qr-save-replies', replies: next }); if (!result.ok) throw new Error(); state.replies = next; savedReplies(); status(t.savedOk); }
      catch { status(t.checkFailed, true); }
    });
    row.append(title, text, edit, remove); $('#saved-list').append(row);
  }
  controls();
}
function editReply(item) {
  state.editing = item?.id ?? null;
  $('#saved-form').hidden = false; $('#saved-title').value = item?.title ?? ''; $('#saved-text').value = item?.text ?? ''; $('#saved-title').focus();
}
async function restoreDraft() {
  const key = draftKey();
  const draft = key ? (await api.storage.session.get(key))[key] : null;
  $('#reply').value = draft?.text ?? ''; state.operationId = draft?.operationId ?? null; state.uncertain = draft?.uncertain ?? false;
  if (state.operationId) {
    const result = await send({ type: 'qr-operation', operationId: state.operationId });
    if (result.ok) { $('#reply').value = ''; state.operationId = null; state.uncertain = false; await persist(); status(t.accepted); }
    else if (result.code === 'send-unknown') { state.uncertain = true; status(t.unknown, true); }
    else { state.operationId = null; state.uncertain = false; status(failure(result.code), true); }
  }
  if (draft?.documentId && draft.documentId !== state.snapshot?.documentId && $('#reply').value) status(t.stale, true);
  controls();
}
async function selectChat(id, restore = true) {
  state.chatId = id;
  recipientPicker.setSelected(chat());
  $('#received').textContent = chat()?.received || t.noPreview;
  if (restore) await restoreDraft();
  controls();
}
async function refresh({ tabId, keep = false } = {}) {
  if (state.busy) return;
  state.busy = 'load'; controls(); status(t.loading);
  try {
    await persist();
    const previousTab = state.tabId;
    const previousChat = state.chatId;
    const previousDocument = state.snapshot?.documentId;
    const result = await send({ type: 'qr-list', tabId });
    if (!result.ok) throw new Error();
    state.tabId = result.tabId; state.scope = result.scope; state.replies = result.replies; state.aiConnected = result.aiConnected;
    $('#disconnect').hidden = !state.aiConnected;
    $('#api-key').placeholder = state.aiConnected ? t.keyStored : '';
    $('#account').replaceChildren(...result.tabs.map(tab => new Option(tab.name, String(tab.id))));
    $('#account-field').hidden = result.tabs.length < 2; $('#account').value = String(state.tabId ?? '');
    state.snapshot = result.snapshot.ok ? result.snapshot : null;
    const chats = state.snapshot?.chats ?? [];
    $('#composer').hidden = !chats.length; $('#empty').hidden = Boolean(chats.length);
    $('#empty-copy').textContent = !result.tabId ? t.noTab : !result.snapshot.ok ? failure(result.snapshot.code) : t.noChats;
    const selected = keep && previousTab === state.tabId && chats.some(item => item.id === previousChat) ? previousChat : chats[0]?.id;
    status();
    await selectChat(selected, !keep || previousTab !== state.tabId || previousChat !== selected);
    if (keep && previousDocument && state.snapshot?.documentId !== previousDocument && $('#reply').value) status(t.stale, true);
    savedReplies(); document.documentElement.dataset.ready = 'true';
  } catch { status(t.checkFailed, true); }
  finally { state.busy = false; controls(); }
}
$('#reply').addEventListener('input', () => { state.operationId = null; status(); persist().catch(() => status(t.checkFailed, true)); controls(); });
$('#account').addEventListener('change', event => refresh({ tabId: Number(event.target.value) }));
$('#refresh').addEventListener('click', () => refresh({ tabId: state.tabId, keep: true }));
$('#settings').addEventListener('click', () => panel('ai-panel'));
for (const id of ['support', 'support-footer']) $(`#${id}`).addEventListener('click', async () => {
  await persist().catch(() => {});
  panel('support-panel');
});
loadSupport().then(config => {
  $('#support-pending').hidden = config.enabled;
  $('#sponsor-button').disabled = !config.enabled;
  $('#sponsor-button').addEventListener('click', async () => {
    if (!config.enabled || !config.url) return;
    try { await api.tabs.create({ url: config.url }); }
    catch { status(t.checkFailed, true); }
  });
  document.documentElement.dataset.supportReady = 'true';
});
$('#manage').addEventListener('click', () => { panel('saved-panel'); savedReplies(); });
for (const button of document.querySelectorAll('[data-back]')) button.addEventListener('click', () => panel('main-panel'));
$('#new-reply').addEventListener('click', () => { if (state.replies.length >= 50) status(t.maxReplies, true); else editReply(); });
$('#cancel-save').addEventListener('click', () => { $('#saved-form').hidden = true; });
$('#saved-form').addEventListener('submit', async event => {
  event.preventDefault();
  const item = { id: state.editing ?? crypto.randomUUID(), title: $('#saved-title').value.trim(), text: $('#saved-text').value.trim() };
  if (!item.title || !item.text) return;
  const replies = state.editing ? state.replies.map(reply => reply.id === state.editing ? item : reply) : [...state.replies, item];
  try {
    const result = await send({ type: 'qr-save-replies', replies });
    if (!result.ok) throw new Error();
    state.replies = replies; savedReplies(); $('#saved-form').hidden = true; status(t.savedOk);
  } catch { status(t.checkFailed, true); }
});
$('#key-form').addEventListener('submit', async event => {
  event.preventDefault();
  const key = $('#api-key').value.trim();
  if (!key) { status(t.aiKey, true); return; }
  try {
    // Must be requested directly from the person's click/submit gesture.
    const allowed = await api.permissions.request(aiPermissions(api));
    if (!allowed) { status(t.aiPermission, true); return; }
    const result = await send({ type: 'qr-save-key', key });
    if (!result.ok) { status(failure(result.code), true); return; }
    $('#api-key').value = ''; state.aiConnected = true; $('#disconnect').hidden = false; $('#api-key').placeholder = t.keyStored;
    panel('main-panel'); status(t.connected);
  } catch { status(t.aiPermission, true); }
});
$('#disconnect').addEventListener('click', async () => {
  try { const result = await send({ type: 'qr-disconnect' }); if (!result.ok) throw new Error(); state.aiConnected = false; $('#disconnect').hidden = true; $('#api-key').value = ''; $('#api-key').placeholder = ''; status(t.disconnected); }
  catch { status(t.checkFailed, true); }
});
$('#suggest').addEventListener('click', async () => {
  if (state.busy || state.uncertain || !chat()) return;
  if (!state.aiConnected) { panel('ai-panel'); return; }
  state.busy = 'ai'; controls(); status(t.generating);
  try {
    const result = await send({ type: 'qr-suggest', documentId: state.snapshot.documentId, chatId: state.chatId, received: chat().received, draft: $('#reply').value, language });
    if (!result.ok) { status(failure(result.code), true); return; }
    $('#reply').value = result.text; state.operationId = null; await persist(); status();
  } catch { status(t.aiUnavailable, true); }
  finally { state.busy = false; controls(); }
});
$('#send').addEventListener('click', async () => {
  if (state.busy || state.uncertain || !chat()) return;
  const text = $('#reply').value;
  if (!text.trim()) { status(t.noInput, true); return; }
  state.busy = 'send'; state.operationId ??= crypto.randomUUID(); controls(); status(t.sending);
  try {
    await persist();
    const result = await send({ type: 'qr-send', documentId: state.snapshot.documentId, chatId: state.chatId, text, operationId: state.operationId });
    if (result.ok) { $('#reply').value = ''; state.operationId = null; status(t.accepted); }
    else { state.uncertain = result.code === 'send-unknown'; if (!state.uncertain) state.operationId = null; status(failure(result.code), true); }
    await persist();
  } catch { state.uncertain = true; status(t.unknown, true); await persist().catch(() => {}); }
  finally { state.busy = false; controls(); }
});
$('#checked').addEventListener('click', async () => {
  state.uncertain = false; state.operationId = null; await persist(); status(); controls();
});
$('#open-whatsapp').addEventListener('click', async () => {
  try { await send({ type: 'qr-open' }); window.close(); } catch { status(t.checkFailed, true); }
});
try {
  const [source] = await api.tabs.query({ active: true, currentWindow: true });
  state.sourceTabId = source.id;
  await refresh();
} catch { status(t.checkFailed, true); }
