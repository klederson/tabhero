import { createUsageStatistics } from './analytics.js';
import { conversationUrl, redirectRules } from "./links.js";
import { chooseTab, routeConversation, whatsappTabs } from "./router.js";
import { errorMessage, message as translatedMessage, normalizeErrorCode } from "./i18n.js";
import { createQuickReplyController } from './quick-reply.js';

const api = globalThis.browser ?? globalThis.chrome;
const usage = createUsageStatistics(api);
const handoffUrl = api.runtime.getURL("handoff.html");
const quickReply = createQuickReplyController(api);
// Chrome can restrict local storage to extension pages and background scripts.
api.storage.local.setAccessLevel?.({ accessLevel: 'TRUSTED_CONTEXTS' }).catch(() => {});
let routing = Promise.resolve();

async function installRules() {
  const rules = redirectRules(handoffUrl);
  await api.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: rules.map(rule => rule.id),
    addRules: rules
  });
  await api.action.setBadgeText({ text: "" });
  await api.action.setTitle({ title: translatedMessage("actionTitle", api) });
}

function initialize() {
  // Existing WhatsApp documents also receive the silent counter after an
  // extension update/install, without requiring a WhatsApp reload.
  whatsappTabs(api).then(tabs => Promise.allSettled(tabs.map(tab => api.scripting.executeScript({
    target: { tabId: tab.id, frameIds: [0] }, files: ['quick-reply-heartbeat.js']
  })))).catch(() => {});
  installRules().catch(() => {
    // Surface installation failures without logging a phone number or message.
    api.action.setBadgeText({ text: "!" });
    api.action.setTitle({ title: translatedMessage("activationFailed", api) });
  });
}

api.runtime.onInstalled.addListener(details => {
  initialize();
  if (details.reason === 'install') api.tabs.create({ url: api.runtime.getURL('welcome.html') }).catch(() => {});
});
api.runtime.onStartup.addListener(initialize);

api.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (typeof message?.type === 'string' && message.type.startsWith('usage-')) {
    const ownPage = sender.id === api.runtime.id && ['popup.html','welcome.html','bridge.html'].some(page => sender.url === api.runtime.getURL(page));
    if (!ownPage || sender.tab?.incognito || message.privateContext === true) { sendResponse({ ok: false }); return; }
    const task = message.type === 'usage-status' ? usage.status()
      : message.type === 'usage-consent' ? usage.setConsent(message.enabled)
      : message.type === 'usage-event' && ['panel_open','saved_reply_use','bridge_open'].includes(message.event) ? usage.track(message.event).then(() => ({ ok: true }))
      : Promise.resolve({ ok: false });
    task.then(sendResponse, () => sendResponse({ ok: false }));
    return true;
  }

  if (typeof message?.type === 'string' && message.type.startsWith('qr-')) {
    const popup = sender.id === api.runtime.id && sender.url === api.runtime.getURL('popup.html');
    const heartbeat = message.type === 'qr-heartbeat' && sender.id === api.runtime.id && sender.frameId === 0 && sender.tab && sender.url?.startsWith('https://web.whatsapp.com/');
    if (!popup && !heartbeat) { sendResponse({ ok: false, code: 'unauthorized-source' }); return; }
    const request = heartbeat ? quickReply.heartbeat(sender.tab) : quickReply.handle(message);
    if (popup && ['qr-send','qr-suggest'].includes(message.type)) request.then(result => {
      const event = message.type === 'qr-send' ? (result.ok ? 'manual_reply_success' : 'manual_reply_error') : (result.ok ? 'ai_suggest' : 'ai_error');
      recordSourceUsage(event, message, sender);
    }, () => recordSourceUsage(message.type === 'qr-send' ? 'manual_reply_error' : 'ai_error', message, sender));
    request.then(sendResponse, () => sendResponse({ ok: false, code: message.type === 'qr-send' ? 'send-unknown' : 'unavailable' }));
    return true;
  }
  if (message?.type !== "route-conversation") return;
  // Only our own handoff page may request tab navigation. Verify both sender
  // and fragment, rather than accepting a URL supplied by any web page.
  if (sender.id !== api.runtime.id || !sender.tab || sender.frameId !== 0 || !sender.url?.startsWith(`${handoffUrl}#`)) {
    sendResponse({ ok: false, code: "unauthorized-source", error: errorMessage("unauthorized-source", api) });
    return;
  }

  const original = sender.url.slice(handoffUrl.length + 1);
  const targetUrl = conversationUrl(original);
  if (!targetUrl) {
    sendResponse({ ok: false, code: "invalid-link", error: errorMessage("invalid-link", api) });
    return;
  }

  // Serialize rapid clicks so the first request creates/reuses a tab before
  // another request chooses its destination. A failure doesn't poison the queue.
  routing = routing.catch(() => {}).then(() =>
    routeConversation(api, { ...sender.tab, url: sender.url }, targetUrl, message.canGoBack === true)
  );
  routing.then(
    () => { recordSourceUsage('conversation_open', {}, sender); sendResponse({ ok: true }); },
    error => {
      recordSourceUsage('conversation_error', {}, sender);
      const code = normalizeErrorCode(error?.code);
      sendResponse({ ok: false, code, error: errorMessage(code, api) });
    }
  );
  return true;
});

api.tabs.onRemoved.addListener(tabId => { quickReply.removed(tabId).catch(() => {}); });
api.tabs.onUpdated.addListener((tabId, change) => {
  if (change.status === 'loading' || change.url) quickReply.removed(tabId).catch(() => {});
});

api.action.onClicked.addListener(tab => {
  routing = routing.catch(() => {}).then(async () => {
    const source = { ...tab, id: -1 };
    const target = chooseTab(await whatsappTabs(api), source);
    if (target) {
      await api.tabs.update(target.id, { active: true });
      await api.windows.update(target.windowId, { focused: true });
    } else {
      await api.tabs.create({ url: "https://web.whatsapp.com/", windowId: tab.windowId });
    }
  });
  routing.catch(() => {});
});

// Consult private-context flags locally; nothing from a tab or message enters analytics.
function recordSourceUsage(event, message, sender) {
  if (sender.tab?.incognito || api.extension?.inIncognitoContext) return;
  const source = Number.isInteger(message.sourceTabId) ? api.tabs.get(message.sourceTabId) : Promise.resolve(null);
  source.then(tab => { if (!tab?.incognito) usage.track(event).catch(() => {}); }).catch(() => {});
}
