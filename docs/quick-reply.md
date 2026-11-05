# Quick reply acceptance criteria

The person is working on another website and wants to read enough context and send a deliberate reply through an existing WhatsApp Web session without leaving their work. This is separate from the link-routing feature, which still opens a chat and prepares a draft without sending.

- The toolbar icon opens a small panel with incoming-message previews, an explicitly selected conversation, free text, reusable replies and an optional AI suggestion button. No provider or model picker.
- Sending requires the person's explicit Send click. It uses the selected chat and selected WhatsApp document, even if the active WhatsApp chat changes. It neither activates that tab nor changes its document, URL, active conversation or existing composer draft.
- A stale document, missing chat, unavailable integration or disconnected session produces a useful error. There is no navigation, DOM-click, keyboard or reload fallback.
- Duplicate clicks and retries of one send operation must not create duplicate messages. An uncertain send must remain uncertain until the person checks WhatsApp; never silently retry it. WhatsApp accepting an outgoing message does not establish recipient delivery.
- Closing and reopening the panel retains its draft in browser-session storage. Saved replies and the explicitly supplied OpenRouter key are local to the browser profile. No chat archive is persisted.
- AI is optional and uses the person's OpenRouter key. The fixed free-model router avoids a technical model selector or automatic paid fallback. Only the visible received text and the person's draft are sent, only on Suggest. The output remains editable and is never automatically sent.
- The badge is a silent unread-message count for the selected regular WhatsApp tab. No sounds, desktop notifications or message bodies in the badge. Private/container boundaries are respected; private chats must not leak into the regular global badge. Background updates can be delayed by browser throttling.
- Interface copy is available in the existing five languages. Ordinary use must not require endpoints, provider selection, model IDs or prompt configuration.

Browser acceptance tests must retain document identity, URL, in-memory state and the original composer draft, verify the exact recipient and outgoing text, and keep the user's work tab selected. Include stale-target, integration failure, duplicate-send, draft recovery, badge updates and AI-without-send cases. These tests use a simulated WhatsApp contract; real authenticated compatibility needs separate validation and must not be claimed from the fixture.

Contract references: [native text sending](https://github.com/imoonkey/openweb/blob/main/src/sites/whatsapp/adapters/whatsapp-modules.ts), [loaded chat collection](https://github.com/wppconnect-team/wa-js/blob/main/src/chat/functions/list.ts), [OpenRouter authentication](https://openrouter.ai/docs/api-reference/authentication), [free router](https://openrouter.ai/docs/guides/routing/routers/free-router). The adapter is independently implemented and does not bundle these projects.

## User-reported check

On 5 November 2026, the project owner reported that Firefox read the latest received message, selected the intended recipient and sent a quick reply successfully. The owner also confirmed the 99+ unread badge was present but blended into the icon. These are user observations, not independently recorded document-identity or delivery measurements. The following UI revision improves badge contrast and adds search within the conversation picker without changing the send adapter.
