import { openConversationInTab } from "./whatsapp.js";

export function chooseTab(tabs, source) {
  return tabs
    .filter(tab => tab.id !== source.id && Boolean(tab.incognito) === Boolean(source.incognito)
      && tab.cookieStoreId === source.cookieStoreId)
    .sort((a, b) =>
      Number(b.windowId === source.windowId) - Number(a.windowId === source.windowId)
      || Number(b.active) - Number(a.active)
      || (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0)
      || a.id - b.id
    )[0];
}

export async function routeConversation(api, source, url, canGoBack) {
  // A queued request may outlive its page. Don't act on a tab the user has
  // already navigated elsewhere, even when a preceding request was slow.
  const current = await api.tabs.get(source.id);
  if (current.url !== source.url) return;
  const tabs = await whatsappTabs(api);
  const target = chooseTab(tabs, source);

  if (!target) {
    // The handoff tab is already open: reuse it instead of creating another one.
    await api.tabs.update(source.id, { url, active: true });
    await api.windows.update(source.windowId, { focused: true });
    return;
  }

  // Focus only. The existing WhatsApp document must NEVER receive a URL update.
  await api.tabs.update(target.id, { active: true });
  await api.windows.update(target.windowId, { focused: true });
  // A rapid second click may find a tab whose FIRST document is still loading.
  const deadline = Date.now() + 30_000;
  while (true) {
    const loaded = await api.tabs.get(target.id);
    if (loaded.url?.startsWith("https://web.whatsapp.com/") && loaded.status !== "loading") break;
    if (Date.now() >= deadline) throw new Error("Aguarde o WhatsApp carregar e tente novamente. A aba não foi recarregada.");
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  await openConversationInTab(api, target.id, url);

  try {
    if ((await api.tabs.get(source.id)).url !== source.url) return;
    if (canGoBack) await api.tabs.goBack(source.id);
    else await api.tabs.remove(source.id);
  } catch {
    // The destination is already open. The handoff page can remain if the
    // browser refuses to close it or the user navigated/closed it in the meantime.
  }
}
export async function whatsappTabs(api) {
  // Include navigations that have started but have not committed yet. A URL
  // filter in tabs.query misses those and could open duplicate tabs on fast clicks.
  return (await api.tabs.query({})).filter(tab => {
    try {
      return new URL(tab.pendingUrl ?? tab.url).origin === "https://web.whatsapp.com";
    } catch {
      return false;
    }
  });
}


