// These tests exercise real extension APIs and redirects. Only the WhatsApp Web
// response is mocked; the wa.me/api.whatsapp.com requests reach the browser's DNR.
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { chromium } from "playwright";

const profile = await mkdtemp(join(tmpdir(), "whatsapp-extension-test-"));
const extension = resolve("dist/chrome");
const context = await chromium.launchPersistentContext(profile, {
  channel: "chromium",
  headless: true,
  args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`]
});

const errors = [];
context.on("weberror", error => errors.push(error.error().message));
const fixture = await readFile(new URL("./fixtures/whatsapp.html", import.meta.url), "utf8");
let whatsappRequests = 0;

async function eventually(check, label) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  console.error("Abas restantes:", context.pages().map(page => page.url()));
  throw new Error(`Tempo esgotado: ${label}`);
}

try {
  await context.route("https://web.whatsapp.com/**", route => {
    whatsappRequests++;
    return route.fulfill({ contentType: "text/html; charset=utf-8", body: fixture });
  });
  await context.route("https://fixture.test/**", route => route.fulfill({
    contentType: "text/html", body: "<!doctype html><title>Origem</title><main>Página de origem</main>"
  }));

  const worker = context.serviceWorkers()[0] ?? await context.waitForEvent("serviceworker");
  await eventually(async () => await worker.evaluate(async () =>
    (await chrome.declarativeNetRequest.getDynamicRules()).length === 2
  ), "ativação das regras");

  const origin = context.pages()[0];
  await origin.goto("https://fixture.test/origem");
  const whatsapp = await context.newPage();
  await whatsapp.goto("https://web.whatsapp.com/");
  const originalDocument = await whatsapp.evaluateHandle(() => document);
  const originalToken = await whatsapp.evaluate(() => documentToken);
  const requestsAtStart = whatsappRequests;
  let navigations = 0;
  whatsapp.on("framenavigated", frame => { if (frame === whatsapp.mainFrame()) navigations++; });
  const unchanged = async () => {
    assert.equal(whatsapp.url(), "https://web.whatsapp.com/");
    assert.equal(await whatsapp.evaluate(original => original === document, originalDocument), true);
    assert.equal(await whatsapp.evaluate(() => documentToken), originalToken);
    assert.equal(await whatsapp.evaluate(() => appState.previousDraft), "Rascunho anterior");
    assert.equal(await whatsapp.evaluate(() => appState.messages.length), 0);
    assert.equal(navigations, 0, "WhatsApp existente não pode navegar ou recarregar");
    assert.equal(whatsappRequests, requestsAtStart, "Nenhum novo documento do WhatsApp pode ser solicitado");
  };
  const existingId = await worker.evaluate(async () =>
    (await chrome.tabs.query({ url: "https://web.whatsapp.com/*" }))[0].id
  );
  const text = "Olá! 👋\nVim pela campanha + 20% & orçamento #sim %26";

  // A link on an unrelated website, opening a new tab.
  await origin.evaluate(text => {
    const anchor = document.createElement("a");
    anchor.href = `https://wa.me/12025550123?text=${encodeURIComponent(text)}`;
    anchor.target = "_blank";
    anchor.textContent = "Abrir conversa";
    document.body.append(anchor);
  }, text);
  await origin.getByRole("link", { name: "Abrir conversa" }).click();
  await eventually(async () => (await whatsapp.locator("#contact").textContent()) === "12025550123@lid" && context.pages().length === 2,
    "reutilização da aba e fechamento da intermediária");
  assert.equal(await whatsapp.locator("#compose").inputValue(), text);
  await unchanged();
  assert.equal(await worker.evaluate(async () =>
    (await chrome.tabs.query({ url: "https://web.whatsapp.com/*" }))[0].id
  ), existingId);
  console.log("OK Chromium: wa.me abre dentro do app, sem navegar, recarregar ou perder estado.");

  // Same-tab navigation restores the page the user was reading.
  await origin.evaluate(() => {
    const anchor = document.createElement("a");
    anchor.href = "https://api.whatsapp.com/send/?phone=12025550124&text=Ol%C3%A1%21+Campanha&type=phone_number&app_absent=0";
    anchor.textContent = "Abrir na aba atual";
    document.body.append(anchor);
  });
  await origin.getByRole("link", { name: "Abrir na aba atual" }).click();
  await eventually(async () => (await whatsapp.locator("#contact").textContent()) === "12025550124@lid" && origin.url() === "https://fixture.test/origem",
    "restauração da página anterior");
  assert.equal(await whatsapp.locator("#compose").inputValue(), "Olá! Campanha");
  await unchanged();
  assert.equal(context.pages().length, 2);
  console.log("OK Chromium: api.whatsapp.com na aba atual restaura a página de origem.");

  // Rapid requests must converge to one destination.
  await origin.evaluate(() => {
    for (const number of ["12025550126", "12025550127"]) {
      const anchor = document.createElement("a");
      anchor.href = `https://wa.me/${number}?text=Conversa`;
      anchor.target = "_blank";
      document.body.append(anchor);
      anchor.click();
    }
  });
  await eventually(async () =>
    (await whatsapp.evaluate(() => appState.opens.length)) === 4
      && context.pages().length === 2,
    "cliques simultâneos convergem para uma aba"
  );
  await unchanged();
  console.log("OK Chromium: dois cliques rápidos trocam de conversa sem recarga.");

  // Failure must show an error and preserve the loaded app. No URL fallback.
  await whatsapp.evaluate(() => { window.integrationUnavailable = true; });
  await origin.evaluate(() => {
    const a = document.createElement("a");
    a.href = "https://wa.me/12025550128?text=Erro";
    a.target = "_blank";
    document.body.append(a);
    a.click();
  });
  await eventually(async () => context.pages().some(page => page.url().includes("/handoff.html#")), "página de erro");
  const handoff = context.pages().find(page => page.url().includes("/handoff.html#"));
  await handoff.locator("#retry").waitFor({ state: "visible" });
  assert.match(await handoff.locator("#status").textContent(), /sem recarga/);
  assert.equal(await whatsapp.evaluate(() => appState.opens.length), 4);
  await unchanged();
  await whatsapp.evaluate(() => { window.integrationUnavailable = false; });
  await handoff.locator("#retry").click();
  await eventually(async () => (await whatsapp.evaluate(() => appState.opens.length)) === 5 && context.pages().length === 2, "nova tentativa dentro do app");
  await unchanged();
  console.log("OK Chromium: falha mostra erro sem fallback de navegação; nova tentativa funciona.");

  // Only a first opening, with NO existing WhatsApp, may navigate a new tab.
  await whatsapp.close();
  const fresh = await context.newPage();
  await fresh.goto("https://wa.me/12025550125?text=Primeira+conversa").catch(() => {});
  await eventually(async () => fresh.url().startsWith("https://web.whatsapp.com/send?phone=12025550125"), "abertura sem WhatsApp existente");
  assert.equal(context.pages().length, 2);
  console.log("OK Chromium: sem WhatsApp existente, abre o primeiro documento na intermediária.");
  assert.deepEqual(errors, [], "Erros JavaScript nas páginas da extensão");
} finally {
  await context.close();
  await rm(profile, { recursive: true, force: true });
}
