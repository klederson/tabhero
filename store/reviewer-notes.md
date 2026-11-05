# TabHero — notes for reviewers

Independent MIT-licensed project. Not affiliated with WhatsApp or Meta. Experimental desktop integration. Public source: https://github.com/klederson/tabhero

## Reproduce the packages

Requirements: Node.js 22+, npm and the `zip` command. From the source archive/repository root:

```sh
npm ci
npm test
npm run package
```

`scripts/build.mjs` copies human-readable extension sources, bundles the local `website/funding.json`, and writes browser-specific manifests. Chrome uses a module service worker; Firefox uses a module background script. No runtime dependencies, transpiler, minifier, downloaded extension SDK, source maps, eval or remote executable configuration are required. Browser-test/render tools are development dependencies and are not shipped inside the extension packages. Generated PNG icons are included in source; icon regeneration is not required.

The Firefox ID `whatsapp-mesma-aba@local.extension` is intentionally retained for identity continuity. Firefox minimum version is 142 for the consent/API model. Chrome target is desktop 120+ as documented; browser capability testing remains part of review.

## Functional review

1. Install the browser-specific package. The first-install page explains access, local storage, optional AI, deletion, source and experimental status. Reading it or dismissing it does not enable AI or transmit chat content to an AI provider. Updates do not deliberately open a new welcome page.
2. Sign into an authorized WhatsApp Web test session. Keep the tab loaded. Open a supported numbered `wa.me` or `api.whatsapp.com/send` link with a harmless draft and a known test recipient. The extension selects the existing session and opens that conversation inside the app, preserving its document and URL. It does not send the link’s text automatically. If no session exists, initial navigation into WhatsApp Web is allowed.
3. From another tab open the toolbar popup, search a loaded conversation, read its last incoming preview, write a reply and click Send to an authorized test recipient. The active WhatsApp chat, draft and work-tab focus should remain unchanged. Do not use a real customer’s conversation for review.
4. Create and use a saved reply. Verify the silent unread badge. Latest media is represented by a type placeholder and loaded caption, without downloading or playing attachments or opening view-once content.
5. Click the privacy shortcut in the popup, inspect the source/policy links and return. Drafts should survive opening that panel.
6. AI is optional; all non-AI functionality works without an OpenRouter account/key. Only Connect requests the optional AI permissions. If reviewing AI, use a dedicated reviewer/test key and harmless text. Suggest sends the displayed text/caption and draft to OpenRouter for an editable suggestion; Send remains a separate action. Disconnect removes the saved key and permission grant. Provider availability/free limits may affect results.
7. The voluntary Donate screen preserves the draft and opens GitHub Sponsors review. Do not make a payment to test it. It does not unlock features.

If an account or additional review access must be supplied, coordinate it privately through the store’s review channel. This archive intentionally contains no password, WhatsApp QR/session token, API key, recipient contact or customer conversation.

## Implementation boundaries

`links.js` restricts redirect patterns. `background.js` accepts routing only from the extension’s own handoff page. Quick-reply commands are accepted only from the popup; the page heartbeat can only request a count refresh. Account/private/container context and document identity are checked before sending. Chrome local storage is restricted to trusted extension contexts where supported.

The bundled `whatsapp.js` and `quick-reply-page.js` adapters execute in the page MAIN world and call capability-checked internal WhatsApp modules already loaded by that website. They do not inject a downloaded third-party library or execute AI response text. Internal interfaces may change. Failure returns an error; navigation/reload is never a fallback for a loaded session.

Uncertain send results retain the draft and block automatic retry. A repeated operation ID does not deliberately send a second message. Local acceptance is not a delivery/read receipt.

## Validation limits

Automated Chrome/Firefox integration tests use `tests/fixtures/whatsapp.html`, a simulated internal API. They assert exact document identity, URL, state, composer, focus, recipient and text. They do not demonstrate authenticated compatibility or serve as store approval. The toolbar sizing test uses an actual Firefox action popup in an isolated test profile. No real customer data, real paid AI request or real payment is necessary for the automated tests.
