import { conversationUrl, redirectRules } from "./links.js";
import { chooseTab, routeConversation, whatsappTabs } from "./router.js";
import { errorMessage, message as translatedMessage, normalizeErrorCode } from "./i18n.js";

const api = globalThis.browser ?? globalThis.chrome;
const handoffUrl = api.runtime.getURL("handoff.html");
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
  installRules().catch(() => {
    // Surface installation failures without logging a phone number or message.
    api.action.setBadgeText({ text: "!" });
    api.action.setTitle({ title: translatedMessage("activationFailed", api) });
  });
}

api.runtime.onInstalled.addListener(initialize);
api.runtime.onStartup.addListener(initialize);

api.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
    () => sendResponse({ ok: true }),
    error => {
      const code = normalizeErrorCode(error?.code);
      sendResponse({ ok: false, code, error: errorMessage(code, api) });
    }
  );
  return true;
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
