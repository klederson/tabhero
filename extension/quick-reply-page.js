// Self-contained: executed only in the already loaded WhatsApp MAIN world.
// No DOM clicks, focus, navigation, draft writes, mark-as-read or history fetches.
export async function quickReplyInPage(request) {
  const fail = code => ({ ok: false, code });
  if (location.origin !== 'https://web.whatsapp.com') return fail('invalid-request');
  const load = name => {
    for (const loader of [globalThis.require, globalThis.importNamespace]) {
      try { if (typeof loader === 'function') { const value = loader(name); if (value) return value; } } catch { /* Capability unavailable. */ }
    }
    return null;
  };
  const serial = id => id?._serialized ?? id?.$1 ?? (typeof id === 'string' ? id : null);
  const validChat = id => typeof id === 'string' && /^[\d-]+@(?:c\.us|lid|g\.us)$/.test(id);
  try {
    const store = load('WAWebChatCollection')?.ChatCollection ?? load('WAWebCollections')?.Chat;
    if (typeof store?.getModelsArray !== 'function') return fail('unavailable');
    if (load('WAWebCmd')?.Cmd?.isMainLoaded === false) return fail('not-ready');
    const user = load('WAWebUserPrefsMeUser');
    const accountId = serial(user?.getMaybeMeLidUser?.()) ?? serial(user?.getMaybeMePnUser?.());
    if (!accountId) return fail('not-ready');
    const stateKey = Symbol.for('TabHero.quickReply.v1');
    if (globalThis[stateKey]?.accountId !== accountId) globalThis[stateKey] = { accountId, documentId: crypto.randomUUID(), operations: new Map() };
    const state = globalThis[stateKey];
    const models = store.getModelsArray().filter(chat => validChat(serial(chat.id)));
    const unread = chat => Math.max(0, Number.isFinite(chat.unreadCount) ? (chat.unreadCount === -1 ? 1 : chat.unreadCount) : (chat.hasUnread ? 1 : 0));
    const total = models.reduce((sum, chat) => sum + unread(chat), 0);
    if (request.action === 'count') return { ok: true, unread: total };
    if (request.action === 'snapshot') {
      const text = value => typeof value === 'string' ? value.slice(0, 4000) : '';
      const normalize = value => value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
      const query = normalize(typeof request.search === 'string' ? request.search.trim().slice(0, 100) : '');
      const name = chat => text(chat.formattedTitle || chat.name || chat.contact?.name || chat.contact?.pushname || serial(chat.id)).slice(0, 160);
      const candidates = models.filter(chat => (!request.chatId || serial(chat.id) === request.chatId)
        && (!query || normalize(`${name(chat)} ${serial(chat.id)}`).includes(query)));
      const chats = candidates.sort((a, b) => Number(unread(b) > 0) - Number(unread(a) > 0) || Number(b.active) - Number(a.active) || (Number(b.t) || 0) - (Number(a.t) || 0)).slice(0, 100).map(chat => {
        const messages = chat.msgs?.getModelsArray?.() ?? [];
        const incoming = [...messages].reverse().find(msg => !msg.id?.fromMe && !msg.fromMe && !msg.isSentByMe && !msg.isNotification
          && !['e2e_notification', 'notification_template', 'gp2', 'protocol', 'ciphertext'].includes(msg.type));
        const receivedType = incoming?.isViewOnce ? 'view_once' : incoming?.type ?? 'chat';
        const received = incoming?.isViewOnce ? '' : receivedType === 'chat' ? text(incoming?.body) : text(incoming?.caption);
        return { id: serial(chat.id), name: name(chat),
          unread: unread(chat), active: Boolean(chat.active), timestamp: Number(chat.t) || 0, received, receivedType };
      });
      return { ok: true, documentId: state.documentId, unread: total, chats };
    }
    if (request.action !== 'send' || !validChat(request.chatId) || typeof request.text !== 'string' || !request.text.trim() || request.text.length > 10000
      || typeof request.operationId !== 'string' || !/^[a-f\d-]{36}$/i.test(request.operationId)) return fail('invalid-request');
    if (request.documentId !== state.documentId) return fail('stale-document');
    if (state.operations.has(request.operationId)) return state.operations.get(request.operationId);
    const chat = models.find(model => serial(model.id) === request.chatId);
    if (!chat) return fail('stale-chat');
    const send = load('WAWebSendTextMsgChatAction')?.sendTextMsgToChat;
    if (typeof send !== 'function') return fail('unavailable');
    // Record before invoking the sender; a timeout or exception can be ambiguous.
    const pending = fail('send-unknown');
    state.operations.set(request.operationId, pending);
    let timer;
    try {
      const confirmation = await Promise.race([
        Promise.resolve().then(() => send(chat, request.text, {})),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), 12000); })
      ]);
      if (confirmation?.messageSendResult !== 'OK') return pending;
      const result = { ok: true, status: 'accepted' };
      state.operations.set(request.operationId, result);
      return result;
    } catch { return pending; }
    finally { clearTimeout(timer); }
  } catch { return fail('unavailable'); }
}
