# Help take a detour out of the conversation

TabHero has one job: open a chat inside the WhatsApp Web page that is already loaded. Preserving the tab’s document is an acceptance criterion, not an optional optimization. Read [AGENTS.md](AGENTS.md) before changing the flow.

Use Node 22+, then run `npm ci`, `npm test`, and `npm run build`. For browser checks, install Chromium with `npx playwright install chromium`, then run `npm run test:browser` and `npm run test:firefox` with Firefox and geckodriver available. These tests simulate WhatsApp’s internal contracts; they do not replace validation in a real authenticated session. That real integration has not been validated in this development session.

Report bugs with browser and extension versions, expected behavior, reproduction steps using fictional data, and the error message. Never include a real phone number, draft, cookies, QR code, access token, or customer data in an issue. For compatibility changes, record the WhatsApp version actually validated and how you verified document identity and state without sending a message. A reused tab ID does not prove the document survived.

For website work, run `npm run build:site` and `npm run test:site`. Static output is in `website/dist/`. Brand sources are in `brand/` and `website/assets/`; the wordmark is **tabhero.** and the running-text name is **TabHero**. Self-hosted fonts have OFL licenses beside their files.

English is the source language. Translation contributions should preserve catalog keys, HTML structure and attributes, URLs, brand tokens, and interpolation placeholders. Keep the meaning of error, privacy, and experimental-status messages intact. See [internationalization.md](docs/internationalization.md) for language priorities and fluent-speaker review. Be warm toward people and playful about friction; avoid swearing, personal attacks, invented endorsements, and claims of universal reliability.

Contributions follow the project’s MIT license. Do not introduce third-party logos, remote scripts, telemetry, or a fallback that navigates or reloads the loaded WhatsApp tab. Native adoption is welcome under the license; it creates no obligation to adopt, sponsor, or acquire the project.
