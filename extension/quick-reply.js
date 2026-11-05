import { quickReplyInPage } from './quick-reply-page.js';
import { suggestReply, aiPermissions } from './quick-reply-ai.js';

const isWhatsApp = tab => { try { return new URL(tab.url).origin === 'https://web.whatsapp.com'; } catch { return false; } };
export const sameContext = (a, b) => Boolean(a.incognito) === Boolean(b.incognito) && a.cookieStoreId === b.cookieStoreId;
export async function executeQuickReply(api, tabId, request) {
  try {
    const result = await api.scripting.executeScript({ target: { tabId, frameIds: [0] }, world: 'MAIN', func: quickReplyInPage, args: [request] });
    return result.find(frame => frame.frameId === 0)?.result ?? { ok: false, code: 'unavailable' };
  } catch { return { ok: false, code: request.action === 'send' ? 'send-unknown' : 'unavailable' }; }
}

export function createQuickReplyController(api) {
  let sends = Promise.resolve();
  let badges = Promise.resolve();
  const local = api.storage.local;
  const session = api.storage.session;
  const badge = (tabId, unread) => {
    badges = badges.catch(() => {}).then(async () => {
      const tab = await api.tabs.get(tabId).catch(() => null);
      if (!tab || tab.incognito) return;
      const { qrBadgeTarget } = await session.get('qrBadgeTarget');
      if (qrBadgeTarget && qrBadgeTarget !== tabId) return;
      await session.set({ qrBadgeTarget: tabId });
      await api.action.setBadgeBackgroundColor({ color: '#C7F65A' });
      await api.action.setBadgeText({ text: unread > 99 ? '99+' : unread > 0 ? String(unread) : '' });
    });
    return badges;
  };
  const tabsFor = async sourceTabId => {
    const source = await api.tabs.get(sourceTabId);
    const tabs = (await api.tabs.query({})).filter(tab => isWhatsApp(tab) && sameContext(tab, source));
    return { source, tabs };
  };
  const targetFor = async message => {
    const { source, tabs } = await tabsFor(message.sourceTabId);
    return { source, tabs, target: tabs.find(tab => tab.id === message.tabId) };
  };
  return {
    async heartbeat(tab) {
      if (!tab || tab.incognito || !isWhatsApp(tab)) return { ok: false };
      const { qrBadgeTarget } = await session.get('qrBadgeTarget');
      if (qrBadgeTarget && qrBadgeTarget !== tab.id) return { ok: true };
      const result = await executeQuickReply(api, tab.id, { action: 'count' });
      await badge(tab.id, result.ok ? result.unread : 0);
      return { ok: true };
    },
    async removed(tabId) {
      const { qrBadgeTarget } = await session.get('qrBadgeTarget');
      if (qrBadgeTarget === tabId) {
        await session.remove('qrBadgeTarget');
        await api.action.setBadgeText({ text: '' });
      }
    },
    async handle(message) {
      if (message.type === 'qr-list') {
        const { source, tabs } = await tabsFor(message.sourceTabId);
        const { qrBadgeTarget } = await session.get('qrBadgeTarget');
        const selected = tabs.find(tab => tab.id === message.tabId) ?? tabs.find(tab => tab.id === source.id)
          ?? tabs.find(tab => tab.id === qrBadgeTarget) ?? tabs.find(tab => tab.windowId === source.windowId) ?? tabs[0];
        const { qrReplies = [], qrAiKey } = await local.get(['qrReplies', 'qrAiKey']);
        const snapshot = selected ? await executeQuickReply(api, selected.id, { action: 'snapshot' }) : { ok: false, code: 'no-tab' };
        if (selected && !selected.incognito) {
          await session.set({ qrBadgeTarget: selected.id });
          await badge(selected.id, snapshot.ok ? snapshot.unread : 0);
        }
        return { ok: true, tabs: tabs.map((tab, index) => ({ id: tab.id, name: `${tab.title || 'WhatsApp'} · ${index + 1}` })), tabId: selected?.id, snapshot,
          replies: qrReplies, aiConnected: Boolean(qrAiKey), scope: `${source.incognito ? 'private' : 'regular'}:${source.cookieStoreId ?? 'default'}:${source.windowId}` };
      }
      if (message.type === 'qr-open') {
        const { source, tabs } = await tabsFor(message.sourceTabId);
        const tab = tabs.find(item => item.id === message.tabId) ?? tabs[0];
        if (tab) { await api.tabs.update(tab.id, { active: true }); await api.windows.update(tab.windowId, { focused: true }); }
        else await api.tabs.create({ url: 'https://web.whatsapp.com/', windowId: source.windowId });
        return { ok: true };
      }
      if (message.type === 'qr-save-replies') {
        if (!Array.isArray(message.replies) || message.replies.length > 50 || message.replies.some(item => typeof item.id !== 'string' || item.id.length > 50 || typeof item.title !== 'string' || !item.title.trim() || item.title.length > 60 || typeof item.text !== 'string' || !item.text.trim() || item.text.length > 10000)) return { ok: false, code: 'invalid-request' };
        await local.set({ qrReplies: message.replies.map(({ id, title, text }) => ({ id, title, text })) });
        return { ok: true };
      }
      if (message.type === 'qr-save-key') {
        if (typeof message.key !== 'string' || !message.key.trim() || message.key.length > 300 || /\s/.test(message.key.trim())) return { ok: false, code: 'ai-key' };
        if (!await api.permissions.contains(aiPermissions(api))) return { ok: false, code: 'ai-permission' };
        await local.set({ qrAiKey: message.key.trim() });
        return { ok: true };
      }
      if (message.type === 'qr-disconnect') {
        await local.remove('qrAiKey');
        await api.permissions.remove(aiPermissions(api));
        return { ok: true };
      }
      if (message.type === 'qr-suggest') {
        const { target } = await targetFor(message);
        if (!target) return { ok: false, code: 'no-tab' };
        const snapshot = await executeQuickReply(api, target.id, { action: 'snapshot' });
        if (!snapshot.ok) return snapshot;
        if (snapshot.documentId !== message.documentId) return { ok: false, code: 'stale-document' };
        const chat = snapshot.chats.find(chat => chat.id === message.chatId);
        if (!chat || chat.received !== message.received) return { ok: false, code: 'stale-chat' };
        if (!await api.permissions.contains(aiPermissions(api))) return { ok: false, code: 'ai-connect' };
        const { qrAiKey } = await local.get('qrAiKey');
        return suggestReply({ key: qrAiKey, received: chat.received, draft: message.draft, language: message.language });
      }
      if (message.type === 'qr-send') {
        // Serialized and journaled before dispatch. Never retry ambiguous writes.
        const operation = sends.catch(() => {}).then(async () => {
          if (typeof message.operationId !== 'string' || !/^[a-f\d-]{36}$/i.test(message.operationId) || typeof message.text !== 'string' || !message.text.trim() || message.text.length > 10000) return { ok: false, code: 'invalid-request' };
          const { target } = await targetFor(message);
          if (!target) return { ok: false, code: 'no-tab' };
          const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify([target.id, message.documentId, message.chatId, message.text])));
          const fingerprint = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
          const key = `qr-send:${message.operationId}`;
          const previous = (await session.get(key))[key];
          if (previous) return previous.fingerprint === fingerprint ? previous.result : { ok: false, code: 'invalid-request' };
          const pending = { ok: false, code: 'send-unknown' };
          await session.set({ [key]: { fingerprint, result: pending } });
          const result = await executeQuickReply(api, target.id, { action: 'send', documentId: message.documentId, chatId: message.chatId, text: message.text, operationId: message.operationId });
          await session.set({ [key]: { fingerprint, result } });
          return result;
        });
        sends = operation;
        return operation;
      }
      if (message.type === 'qr-operation') {
        if (typeof message.operationId !== 'string' || !/^[a-f\d-]{36}$/i.test(message.operationId)) return { ok: false, code: 'invalid-request' };
        return (await session.get(`qr-send:${message.operationId}`))[`qr-send:${message.operationId}`]?.result ?? { ok: false, code: 'send-unknown' };
      }
      return { ok: false, code: 'invalid-request' };
    }
  };
}
