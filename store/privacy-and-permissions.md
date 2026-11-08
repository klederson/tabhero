# Privacy and permission declarations

Single purpose: manage WhatsApp conversations in the existing WhatsApp Web session, opening supported conversation links and allowing deliberate quick replies from the browser toolbar.

Public policy: https://klederson.github.io/tabhero/privacy.html
Source: https://github.com/klederson/tabhero
Support: https://github.com/klederson/tabhero/issues
Maintainer: Klederson Bueno.

## Data use

The developer operates no chat server or advertising and does not sell user data. Separate, optional usage statistics send only fixed feature/error categories, browser family and extension version through the disclosed statistics server to Google Analytics, after explicit opt-in and optional permissions. No message data enters statistics. The extension does handle data locally: phone/recipient identifiers and draft text in intercepted links; loaded chat names, unread counts and latest incoming text/captions for quick reply; user-authored replies; and the optional user-supplied OpenRouter key. It never silently navigates or reloads the loaded WhatsApp document.

Saved replies and the optional AI key use local extension storage, not browser sync. Drafts and send-operation records use browser-session storage. No message-history archive is built or uploaded by TabHero. Local storage is not a promise of encryption or isolation from other users of the same browser profile.

AI is off until the user connects their own key and grants the required optional permissions. Each Suggest click sends the currently displayed received text/caption and draft to `https://openrouter.ai/api/v1/chat/completions`. The key is sent as authentication, not injected into WhatsApp. OpenRouter routes the request to an AI provider under their policies; the developer cannot promise those providers’ retention or training practices. Media files are not sent to AI. Suggestion output stays editable and never sends automatically.

Sending a WhatsApp reply requires an explicit Send click and uses the existing WhatsApp session. Success is local acceptance by WhatsApp, not proof of delivery/read status. Saved replies are deleted in the manager; Disconnect AI removes its saved key and requested permissions. Browser-session data expires with that session. Uninstalling uses the browser’s normal extension-data removal behavior; it does not delete data already sent to an external provider or to WhatsApp.

Dashboard categories must reflect the actual form and optional paths. At minimum, account for personal communications and authentication information. Names/phone identifiers and arbitrary message content can also contain personally identifying information and website content. Do not claim the extension never accesses data, never intercepts anything, or never stores data. It intentionally intercepts supported conversation links and uses disclosed local storage.

Certify only practices supported by the code: no sale, no unrelated advertising/marketing, no unrelated tracking, and data use limited to the described user-facing functionality. Do not represent public source or passing tests as an independent audit, certification or guarantee of safety.

## Permission justifications

| Permission/origin | Explanation |
| --- | --- |
| `declarativeNetRequestWithHostAccess` | Redirect only supported top-level conversation GET links to the bundled handoff page for in-app routing. |
| `scripting` | Execute the locally bundled adapter in the existing WhatsApp Web document to open chats, read the disclosed loaded snapshot and explicitly send replies without navigation/reload. |
| `storage` | Store saved replies, optional AI key, session drafts and send-operation records needed to prevent accidental retries. |
| `*://wa.me/*`, `*://api.whatsapp.com/*`, `*://www.whatsapp.com/*` | Recognize supported conversation link formats; unsupported paths stay outside the redirect rules. |
| `https://web.whatsapp.com/*` | Integrate with the already loaded WhatsApp session and maintain the silent unread badge. |
| Optional `https://openrouter.ai/*` | User-initiated AI suggestions only after connection and permission grant. |
| `handoff.html` accessible from all page origins | A supported conversation link can originate on any website. Only this bundled handoff resource is exposed; this is not access to the content of all websites. |

Firefox declares no required extension-origin external collection and optional authentication information and personal communications for AI, plus optional technicalAndInteraction for usage statistics, using native permission consent. Review the complete transmission model against the latest Mozilla taxonomy before submitting, including the intentional WhatsApp send path; local lint does not settle policy classification.

All extension-owned executable code is bundled. The MAIN-world adapter invokes internal modules already loaded by the WhatsApp website; it does not fetch/inject a remote extension SDK, evaluate AI responses, run scripts supplied by a server, or weaken page CSP. Explain this interaction to reviewers transparently; their assessment determines acceptability.

Donations open GitHub’s own review page with the selected whole-dollar amount and one-time frequency. No card data, sponsor authentication or payment webhook is collected by TabHero. Every feature remains free.

Usage statistics are off by default, with separate in-extension consent and a collector host permission. Firefox also checks technicalAndInteraction on every event. Declare usage/technical data truthfully in Chrome dashboards. No Google API secret or remotely hosted executable code is in the package. Follow docs/extension-analytics.md for activation, hosting/logging disclosure and review. The collector server is not in the extension ZIP.
