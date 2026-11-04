import test from "node:test";
import assert from "node:assert/strict";
import { chooseTab, routeConversation, whatsappTabs } from "../extension/router.js";

const source = { id: 10, windowId: 1, incognito: false, url: "extension://handoff#https://wa.me/123" };
const destination = "https://web.whatsapp.com/send?phone=123&text=Oi";

function mockApi(candidates = [], { failNavigation = false, changedSource = false } = {}) {
  const calls = [];
  let reads = 0;
  return {
    calls,
    tabs: {
      get: async id => id === source.id
        ? ({ ...source, url: changedSource && ++reads > 1 ? "https://example.com/" : source.url })
        : ({ id, url: "https://web.whatsapp.com/", status: "complete" }),
      query: async () => candidates.map(tab => ({ url: "https://web.whatsapp.com/", ...tab })),
      update: async (...args) => {
        calls.push(["update", ...args]);
      },
      goBack: async id => calls.push(["back", id]),
      remove: async id => calls.push(["remove", id])
    },
    windows: { update: async (...args) => calls.push(["focus", ...args]) },
    scripting: {
      executeScript: async options => {
        calls.push(["open-in-app", options.target.tabId, ...options.args]);
        if (failNavigation) return [{ frameId: 0, result: { ok: false, error: "Integração indisponível." } }];
        assert.equal(options.world, "MAIN");
        return [{ frameId: 0, result: { ok: true } }];
      }
    }
  };
}

test("prefere a mesma janela, depois aba ativa e último acesso", () => {
  assert.equal(chooseTab([
    { id: 1, windowId: 2, active: true },
    { id: 2, windowId: 1, active: false, lastAccessed: 100 },
    { id: 3, windowId: 1, active: true, lastAccessed: 50 }
  ], source).id, 3);
  assert.equal(chooseTab([
    { id: 1, windowId: 2, lastAccessed: 100 },
    { id: 2, windowId: 2, lastAccessed: 200 }
  ], source).id, 2);
});

test("não mistura navegação privada nem containers, nem escolhe a aba de origem", () => {
  assert.equal(chooseTab([
    source, { id: 2, incognito: true }, { id: 3, cookieStoreId: "firefox-container-1" }
  ], source), undefined);
});

test("abre dentro do WhatsApp sem mudar a URL ou recarregar e fecha só a intermediária", async () => {
  const api = mockApi([{ id: 20, windowId: 2 }]);
  await routeConversation(api, source, destination, false);
  assert.deepEqual(api.calls, [
    ["update", 20, { active: true }],
    ["focus", 2, { focused: true }],
    ["open-in-app", 20, { phone: "123", text: "Oi" }],
    ["remove", 10]
  ]);
});

test("restaura a página anterior quando o link foi aberto na aba atual", async () => {
  const api = mockApi([{ id: 20, windowId: 1 }]);
  await routeConversation(api, source, destination, true);
  assert.deepEqual(api.calls.at(-1), ["back", 10]);
  assert.ok(!api.calls.some(([type]) => type === "remove"));
});

test("sem WhatsApp aberto, transforma a aba intermediária no WhatsApp", async () => {
  const api = mockApi();
  await routeConversation(api, source, destination, false);
  assert.deepEqual(api.calls, [
    ["update", 10, { url: destination, active: true }], ["focus", 1, { focused: true }]
  ]);
});

test("falha interna mantém a origem e nunca navega nem recarrega a aba existente", async () => {
  const api = mockApi([{ id: 20, windowId: 1 }], { failNavigation: true });
  await assert.rejects(routeConversation(api, source, destination, false));
  assert.ok(!api.calls.some(([type]) => ["remove", "back"].includes(type)));
  assert.ok(!api.calls.some(([type, , details]) => type === "update" && "url" in details));
});

test("não fecha a origem se a pessoa navegar para outra página durante a operação", async () => {
  const api = mockApi([{ id: 20, windowId: 1 }], { changedSource: true });
  await routeConversation(api, source, destination, false);
  assert.ok(!api.calls.some(([type]) => ["remove", "back"].includes(type)));
});

test("ignora uma solicitação cuja aba já navegou para outra página", async () => {
  const api = mockApi();
  api.tabs.get = async () => ({ ...source, url: "https://example.com/" });
  await routeConversation(api, source, destination, false);
  assert.deepEqual(api.calls, []);
});

test("reconhece aba do WhatsApp que ainda está carregando e respeita saída pendente", async () => {
  const tabs = [
    { id: 1, url: "extension://handoff", pendingUrl: "https://web.whatsapp.com/send?phone=123" },
    { id: 2, url: "https://web.whatsapp.com/", pendingUrl: "https://example.com/" },
    { id: 3, url: "https://web.whatsapp.com/" },
    { id: 4 },
    { id: 5, url: "https://web.whatsapp.com.evil.test/" }
  ];
  assert.deepEqual((await whatsappTabs({ tabs: { query: async () => tabs } })).map(tab => tab.id), [1, 3]);
});
