import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { openInLoadedWhatsApp } from "../extension/whatsapp.js";

const fixture = await readFile(new URL("./fixtures/whatsapp.html", import.meta.url), "utf8");
const source = fixture.match(/<script nonce="fixture">([\s\S]*?)<\/script>/)[1];

function app() {
  const elements = { contact: { textContent: "Conversa anterior" }, compose: { value: "Rascunho anterior" } };
  const sandbox = {
    crypto: { randomUUID: () => "original-document" },
    document: { getElementById: id => elements[id], documentElement: { hasAttribute: () => false } },
    location: Object.freeze({ origin: "https://web.whatsapp.com" }),
    setTimeout
  };
  sandbox.window = sandbox;
  runInNewContext(source, sandbox);
  sandbox.open = runInNewContext(`(${openInLoadedWhatsApp.toString()})`, sandbox);
  return { sandbox, elements };
}

test("abre contato novo por telefone/LID no app e preenche rascunho sem envio nem navegação", async () => {
  const { sandbox, elements } = app();
  const result = await sandbox.open({ phone: "12025550123", text: "Olá 👋\n+20% & orçamento #sim" });
  assert.equal(result.ok, true);
  assert.equal(elements.contact.textContent, "12025550123@lid");
  assert.equal(elements.compose.value, "Olá 👋\n+20% & orçamento #sim");
  assert.equal(sandbox.documentToken, "original-document");
  assert.equal(sandbox.appState.previousDraft, "Rascunho anterior");
  assert.equal(sandbox.appState.messages.length, 0);
  assert.equal(sandbox.appState.lookups[0][1], "createChat");
});

test("sem text no link, preserva o rascunho já existente do destinatário", async () => {
  const { sandbox, elements } = app();
  await sandbox.open({ phone: "12025550123", text: "Não apagar" });
  const result = await sandbox.open({ phone: "12025550123", text: null });
  assert.equal(result.ok, true);
  assert.equal(elements.compose.value, "Não apagar");
  assert.equal(sandbox.appState.opens.length, 1, "Conversa já ativa não deve ser reaberta");
});

test("integração indisponível retorna erro sem mudar documento, conversa ou rascunho", async () => {
  const { sandbox, elements } = app();
  sandbox.integrationUnavailable = true;
  const result = await sandbox.open({ phone: "12025550123", text: "Olá" });
  assert.equal(result.ok, false);
  assert.equal(result.code, "unavailable");
  assert.equal(elements.contact.textContent, "Conversa anterior");
  assert.equal(elements.compose.value, "Rascunho anterior");
  assert.equal(sandbox.appState.opens.length, 0);
  assert.equal(sandbox.documentToken, "original-document");
});

test("não tenta operar em site diferente nem com telefone inválido", async () => {
  const { sandbox } = app();
  assert.equal((await sandbox.open({ phone: "abc", text: "Olá" })).code, "invalid-request");
  sandbox.location = { origin: "https://example.com" };
  assert.equal((await sandbox.open({ phone: "123", text: "Olá" })).code, "invalid-request");
  assert.equal(sandbox.appState.opens.length, 0);
});

test("versões com assinatura posicional usam o comando antigo sem navegar", async () => {
  const { sandbox, elements } = app();
  sandbox.require("WAWebBuildConstants").VERSION_STR = "2.3000.1029960097";
  sandbox.require("WAWebCmd").Cmd.openChatBottom = async chat => {
    assert.ok(chat.id);
    chat.active = true;
    return true;
  };
  assert.equal((await sandbox.open({ phone: "123", text: "Olá" })).ok, true);
  assert.equal(elements.compose.value, "Olá");
});
