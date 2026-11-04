import { conversationUrl, redirectRules } from "./links.js";
import { chooseTab, routeConversation, whatsappTabs } from "./router.js";

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
  await api.action.setTitle({ title: "JáTá — abrir o WhatsApp Web" });
}

function initialize() {
  installRules().catch(() => {
    // Surface installation failures without logging a phone number or message.
    api.action.setBadgeText({ text: "!" });
    api.action.setTitle({ title: "Falha ao ativar. Recarregue a extensão e confira as permissões para os sites do WhatsApp." });
  });
}

api.runtime.onInstalled.addListener(initialize);
api.runtime.onStartup.addListener(initialize);

api.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "route-conversation") return;
  // Only our own handoff page may request tab navigation. Verify both sender
  // and fragment, rather than accepting a URL supplied by any web page.
  if (sender.id !== api.runtime.id || !sender.tab || sender.frameId !== 0 || !sender.url?.startsWith(`${handoffUrl}#`)) {
    sendResponse({ ok: false, error: "Origem não autorizada." });
    return;
  }

  const original = sender.url.slice(handoffUrl.length + 1);
  const targetUrl = conversationUrl(original);
  if (!targetUrl) {
    sendResponse({ ok: false, error: "Este link não contém um número ou uma mensagem de conversa válidos." });
    return;
  }

  // Serialize rapid clicks so the first request creates/reuses a tab before
  // another request chooses its destination. A failure doesn't poison the queue.
  routing = routing.catch(() => {}).then(() =>
    routeConversation(api, { ...sender.tab, url: sender.url }, targetUrl, message.canGoBack === true)
  );
  routing.then(
    () => sendResponse({ ok: true }),
    error => sendResponse({ ok: false, error: error.message || "Não foi possível abrir a conversa. A aba não foi recarregada." })
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
