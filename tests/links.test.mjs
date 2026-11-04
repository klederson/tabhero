import test from "node:test";
import assert from "node:assert/strict";
import { conversationUrl, redirectRules } from "../extension/links.js";

test("preserva o número e a mensagem do exemplo, sem parâmetros do aplicativo", () => {
  const target = new URL(conversationUrl("https://api.whatsapp.com/send/?phone=12025550123&text=Ol%C3%A1%21+Vim+pela+campanha+e+quero+um+or%C3%A7amento&type=phone_number&app_absent=0"));
  assert.equal(target.origin, "https://web.whatsapp.com");
  assert.equal(target.pathname, "/send");
  assert.equal(target.searchParams.get("phone"), "12025550123");
  assert.equal(target.searchParams.get("text"), "Olá! Vim pela campanha e quero um orçamento");
  assert.deepEqual([...target.searchParams.keys()], ["phone", "text"]);
});

test("wa.me preserva Unicode, quebras de linha, sinais e escapes sem decodificar duas vezes", () => {
  const text = "Olá 👋\nPreço: R$ 100 + 20% & desconto? #sim %26";
  const target = new URL(conversationUrl(`https://wa.me/+5511999999999?text=${encodeURIComponent(text)}`));
  assert.equal(target.searchParams.get("phone"), "5511999999999");
  assert.equal(target.searchParams.get("text"), text);
});

test("aceita http, barra final e número formatado; deixa compartilhamento sem destinatário intacto", () => {
  assert.equal(conversationUrl("http://wa.me/5511999999999/"), "https://web.whatsapp.com/send?phone=5511999999999");
  assert.equal(new URL(conversationUrl("https://www.whatsapp.com/send?phone=%2B55+(11)+99999-9999")).searchParams.get("phone"), "5511999999999");
  assert.equal(conversationUrl("https://wa.me/?text=Ol%C3%A1"), null);
});

test("rejeita origens indevidas, convites, links de negócio e números inválidos", () => {
  for (const input of [
    "invalid", "javascript:alert(1)", "https://wa.me.evil.test/123",
    "https://evil.test/send?phone=123", "https://web.whatsapp.com/send?phone=123",
    "https://chat.whatsapp.com/123", "https://wa.me/message/ABC",
    "https://whatsapp.com/channel/123", "https://wa.me/", "https://wa.me/?text=",
    "https://api.whatsapp.com/send?phone=abc", "https://wa.me/123abc",
    "https://user:pass@wa.me/123", "https://wa.me:8443/123",
    "https://api.whatsapp.com/other?phone=123"
  ]) assert.equal(conversationUrl(input), null, input);
});

test("regras capturam apenas navegações GET de conversa, sem interceptar o destino", () => {
  const rules = redirectRules("chrome-extension://test/handoff.html");
  for (const input of [
    "https://wa.me/5511999999999", "https://wa.me/+5511999999999/?text=Oi%20%26%20ol%C3%A1",
    "http://wa.me/?phone=123&text=Ol%C3%A1", "https://api.whatsapp.com/send/?phone=123&text=Oi",
    "https://www.whatsapp.com/send?text=Oi&phone=123", "https://wa.me/?phone=123"
  ]) assert.ok(rules.some(rule => new RegExp(rule.condition.regexFilter).test(input)), input);
  for (const input of [
    "https://web.whatsapp.com/send?phone=123", "https://wa.me/message/ABCD",
    "https://chat.whatsapp.com/ABCD", "https://wa.me/", "https://wa.me.evil.test/123",
    "https://wa.me/?text=Ol%C3%A1", "https://api.whatsapp.com/send?text=Ol%C3%A1",
    "https://api.whatsapp.com/send?text=myphone=123"
  ]) assert.ok(rules.every(rule => !new RegExp(rule.condition.regexFilter).test(input)), input);
  for (const rule of rules) {
    assert.deepEqual(rule.condition.resourceTypes, ["main_frame"]);
    assert.deepEqual(rule.condition.requestMethods, ["get"]);
    assert.equal(rule.action.redirect.regexSubstitution, "chrome-extension://test/handoff.html#\\0");
  }
});
