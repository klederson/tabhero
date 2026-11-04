// Runs inside the ALREADY LOADED WhatsApp document (scripting world: MAIN).
// Native module contracts checked against WPPConnect/WA-JS and whatsapp-web.js;
// see README for sources. This function must remain self-contained for injection.
export async function openInLoadedWhatsApp({ phone, text }) {
  const fail = (code, error) => ({ ok: false, code, error });
  if (location.origin !== "https://web.whatsapp.com" || !/^\d+$/.test(phone ?? "")) {
    return fail("invalid-request", "Link de conversa inválido.");
  }

  const load = name => {
    for (const loader of [globalThis.require, globalThis.importNamespace]) {
      if (typeof loader !== "function") continue;
      try {
        const module = loader(name);
        if (module) return module;
      } catch {
        // A module may not be ready yet. Never patch the site's loader.
      }
    }
    return null;
  };

  try {
    const cmd = load("WAWebCmd")?.Cmd;
    const factory = load("WAWebWidFactory");
    const chats = load("WAWebChatCollection")?.ChatCollection ?? load("WAWebCollections")?.Chat;
    const findChat = load("WAWebFindChatAction")?.findOrCreateLatestChat;
    const compose = text !== null ? load("WAWebComposeBoxActions")?.ComposeBoxActions : null;

    // Check every required capability before changing the active chat.
    if (!cmd?.openChatBottom || !factory?.createWid || !chats?.get
      || (text !== null && typeof compose?.setTextContent !== "function")) {
      return fail("unavailable", "A integração com esta versão do WhatsApp não está disponível. A aba foi mantida sem recarga.");
    }
    if (cmd.isMainLoaded === false) {
      return fail("not-ready", "Conecte o WhatsApp Web e aguarde a lista de conversas carregar. Depois, tente novamente.");
    }

    const wid = factory.createWid(`${phone}@c.us`);
    let chat = chats.get(wid);
    if (!chat) {
      if (typeof findChat !== "function") {
        return fail("unavailable", "Não foi possível localizar este contato sem recarregar o WhatsApp.");
      }
      // Resolve a number not yet in the local chat list, including its LID.
      const result = await findChat(wid, "createChat");
      chat = result?.chat?.id ? chats.get(result.chat.id) : null;
    }
    if (!chat) {
      return fail("contact-not-found", "Não foi possível abrir uma conversa com este número. Confira o número e sua conexão.");
    }
    if (text !== null && typeof chat.setComposeContents !== "function") {
      return fail("unavailable", "O campo de mensagem desta versão do WhatsApp não é compatível. A aba não foi recarregada.");
    }

    // The app's own command changes its React state; no URL, anchor click,
    // document replacement, keyboard shortcut, or navigation is involved.
    const version = load("WAWebBuildConstants")?.VERSION_STR ?? globalThis.Debug?.VERSION;
    const parts = typeof version === "string" ? version.split(/[.-]/).slice(0, 3).map(Number) : null;
    const oldSignature = parts && parts.length === 3 && parts.every(Number.isFinite)
      && (parts[0] < 2 || (parts[0] === 2 && (parts[1] < 3000 || (parts[1] === 3000 && parts[2] <= 1029960097))));
    if (!chat.active) {
      const opened = oldSignature
        ? await cmd.openChatBottom(chat)
        : await cmd.openChatBottom({ chat });
      if (opened === false && !chat.active) return fail("open-failed", "O WhatsApp não abriu a conversa. A aba não foi recarregada.");
    }

    // Wait for the app to activate this chat before touching the compose box.
    const deadline = Date.now() + 5_000;
    while (!chat.active && Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    if (!chat.active) return fail("open-failed", "O WhatsApp não confirmou a abertura da conversa. Tente novamente.");

    if (text !== null) {
      chat.setComposeContents({ text, timestamp: Math.floor(Date.now() / 1000) });
      compose.setTextContent(chat, text);
    }
    return { ok: true };
  } catch {
    // Don't expose internal exceptions that can include phone numbers or text.
    return fail("internal-error", "Não foi possível abrir a conversa dentro do WhatsApp. A aba não foi recarregada; confira a conexão e tente novamente.");
  }
}

export async function openConversationInTab(api, tabId, url) {
  const target = new URL(url);
  const payload = { phone: target.searchParams.get("phone"), text: target.searchParams.get("text") };
  const results = await api.scripting.executeScript({
    target: { tabId, frameIds: [0] },
    world: "MAIN",
    func: openInLoadedWhatsApp,
    args: [payload]
  });
  const result = results.find(item => item.frameId === 0)?.result;
  if (!result?.ok) {
    throw new Error(result?.error ?? "Não foi possível acessar o WhatsApp carregado. A aba não foi recarregada.");
  }
}
