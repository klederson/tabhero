// Runs the unpacked Firefox add-on against synthetic web pages through BiDi.
// Conversation requests themselves are handled by the browser's redirect rules.
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { Builder, By } from "selenium-webdriver";
import firefox from "selenium-webdriver/firefox.js";
import { Network } from "selenium-webdriver/bidi/network.js";

const options = new firefox.Options().addArguments("-headless").enableBidi();
const binary = process.env.FIREFOX_BINARY
  ?? (existsSync("/snap/firefox/current/usr/lib/firefox/firefox") ? "/snap/firefox/current/usr/lib/firefox/firefox" : null);
if (binary) options.setBinary(binary);
const driver = await new Builder().forBrowser("firefox").setFirefoxOptions(options).build();
const callbackErrors = [];
const fixture = await readFile(new URL("./fixtures/whatsapp.html", import.meta.url), "utf8");
const expectedUnavailable = JSON.parse(await readFile(new URL("../extension/_locales/en/messages.json", import.meta.url), "utf8")).errorUnavailable.message;
let whatsappRequests = 0;

try {
  const network = await Network(driver);
  const bidi = await driver.getBidi();
  await network.beforeRequestSent(event => {
    if (!/^https:\/\/(web\.whatsapp\.com|fixture\.test)\//.test(event.request.url)) return;
    const isWhatsapp = event.request.url.startsWith("https://web.whatsapp.com/");
    if (isWhatsapp) whatsappRequests++;
    bidi.send({
      method: "network.provideResponse",
      params: {
        request: event.request.request,
        statusCode: 200,
        headers: [{ name: "content-type", value: { type: "string", value: "text/html; charset=utf-8" } }],
        body: { type: "string", value: isWhatsapp ? fixture : "<!doctype html><title>Fixture</title><main>Página de teste</main>" }
      }
    }).catch(error => callbackErrors.push(error));
  });
  await bidi.send({
    method: "network.addIntercept",
    params: {
      phases: ["beforeRequestSent"],
      urlPatterns: [
        { type: "pattern", protocol: "https", hostname: "web.whatsapp.com" },
        { type: "pattern", protocol: "https", hostname: "fixture.test" }
      ]
    }
  });

  await driver.installAddon(resolve("dist/firefox"), true);
  await driver.get("https://fixture.test/origem");
  const origin = await driver.getWindowHandle();
  await driver.switchTo().newWindow("tab");
  await driver.get("https://web.whatsapp.com/");
  const whatsapp = await driver.getWindowHandle();
  const originalRoot = await driver.findElement(By.css("html"));
  const originalToken = await driver.executeScript("return documentToken");
  const requestsAtStart = whatsappRequests;
  async function unchanged() {
    assert.equal(await driver.getCurrentUrl(), "https://web.whatsapp.com/");
    assert.equal(await driver.executeScript("return arguments[0] === document.documentElement", originalRoot), true);
    assert.equal(await driver.executeScript("return documentToken"), originalToken);
    assert.equal(await driver.executeScript("return appState.previousDraft"), "Rascunho anterior");
    assert.equal(await driver.executeScript("return appState.messages.length"), 0);
    assert.equal(whatsappRequests, requestsAtStart, "Não deve haver novo carregamento do WhatsApp");
  }

  // A new-tab link from an unrelated site must reuse the existing handle.
  await driver.switchTo().window(origin);
  const text = "Olá! 👋\nCampanha + 20% & orçamento #sim %26";
  await driver.executeScript(text => {
    const a = document.createElement("a");
    a.id = "conversation";
    a.href = `https://wa.me/12025550123?text=${encodeURIComponent(text)}`;
    a.target = "_blank";
    a.textContent = "Abrir conversa";
    document.body.append(a);
  }, text);
  await driver.findElement(By.id("conversation")).click();
  await driver.wait(async () => (await driver.getAllWindowHandles()).length === 2, 15_000);
  await driver.switchTo().window(whatsapp);
  await driver.wait(async () => (await driver.findElement(By.id("contact")).getText()) === "12025550123@lid", 15_000);
  assert.equal(await driver.findElement(By.id("compose")).getAttribute("value"), text);
  await unchanged();
  console.log("OK Firefox: wa.me abre dentro do app, preservando documento, estado e rascunho.");

  // A same-tab link restores the original page rather than closing that tab.
  await driver.switchTo().window(origin);
  await driver.executeScript(() => {
    const a = document.createElement("a");
    a.id = "same-tab";
    a.href = "https://api.whatsapp.com/send/?phone=12025550124&text=Ol%C3%A1%21+Campanha&type=phone_number&app_absent=0";
    a.textContent = "Abrir na mesma aba";
    document.body.append(a);
  });
  await driver.findElement(By.id("same-tab")).click();
  await driver.switchTo().window(whatsapp);
  await driver.wait(async () => (await driver.findElement(By.id("contact")).getText()) === "12025550124@lid", 15_000);
  await unchanged();
  await driver.switchTo().window(origin);
  await driver.wait(async () => (await driver.getCurrentUrl()) === "https://fixture.test/origem", 15_000);
  assert.equal((await driver.getAllWindowHandles()).length, 2);
  console.log("OK Firefox: api.whatsapp.com restaura a página de origem.");

  // Native integration failure must retain the loaded app without a URL fallback.
  await driver.switchTo().window(whatsapp);
  await driver.executeScript("document.documentElement.setAttribute('data-integration-unavailable', '')");
  await driver.switchTo().window(origin);
  await driver.executeScript(() => {
    const a = document.createElement("a");
    a.id = "failure";
    a.href = "https://wa.me/12025550128?text=Erro";
    a.target = "_blank";
    a.textContent = "Testar falha";
    document.body.append(a);
  });
  await driver.findElement(By.id("failure")).click();
  await driver.wait(async () => (await driver.getAllWindowHandles()).length === 3, 15_000, "Falha deve manter a intermediária aberta");
  const failureTab = (await driver.getAllWindowHandles()).find(handle => ![origin, whatsapp].includes(handle));
  await driver.switchTo().window(failureTab);
  await driver.wait(async () => {
    try {
      // Extension focus and WebDriver selection can race after a popup opens.
      await driver.switchTo().window(failureTab);
      return (await driver.findElement(By.id("status")).getText()) === expectedUnavailable;
    }
    catch { return false; }
  }, 15_000, "Página de erro deve oferecer nova tentativa");
  assert.equal(await driver.findElement(By.id("status")).getText(), expectedUnavailable);
  await driver.switchTo().window(whatsapp);
  await unchanged();
  assert.equal(await driver.executeScript("return appState.opens.length"), 2);
  await driver.executeScript("document.documentElement.removeAttribute('data-integration-unavailable')");
  await driver.switchTo().window(failureTab);
  await driver.findElement(By.id("retry")).click();
  await driver.wait(async () => (await driver.getAllWindowHandles()).length === 2, 15_000, "Nova tentativa deve fechar a intermediária");
  await driver.switchTo().window(whatsapp);
  await driver.wait(async () => (await driver.executeScript("return appState.opens.length")) === 3, 15_000);
  await unchanged();
  console.log("OK Firefox: falha preserva a página carregada; nova tentativa funciona sem recarga.");

  await driver.close();
  await driver.switchTo().window(origin);
  await driver.switchTo().newWindow("tab");
  await driver.get("https://wa.me/12025550125?text=Primeira+conversa").catch(() => {});
  await driver.wait(async () => (await driver.getCurrentUrl()).startsWith("https://web.whatsapp.com/send?phone=12025550125"), 15_000);
  assert.equal((await driver.getAllWindowHandles()).length, 2);
  console.log("OK Firefox: sem WhatsApp aberto, a aba intermediária vira o WhatsApp.");
  assert.deepEqual(callbackErrors, []);
} catch (error) {
  for (const handle of await driver.getAllWindowHandles()) {
    await driver.switchTo().window(handle);
    console.error("Página de teste:", await driver.getCurrentUrl());
    console.error((await driver.findElement(By.css("body")).getText()).slice(0, 500));
  }
  throw error;
} finally {
  await driver.quit();
}
