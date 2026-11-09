# TabHero — store submission kit

Target: experimental public desktop release. TabHero has public listings in the [Chrome Web Store](https://chromewebstore.google.com/detail/akceknbdadnbmehonkicfhicoebhalgk) and [Mozilla Add-ons](https://addons.mozilla.org/en-US/firefox/addon/tabhero-new-chat-same-tab/), verified on 9 November 2026. This directory prepares update submissions; generated local packages do not establish which build the stores have approved.

## Files

- `listings/`: English primary, Brazilian Portuguese, Latin American Spanish, Indonesian and Hindi text to paste into the listing. Each description includes functionality, data access, local storage, optional AI transmission, public source and experimental status. Translations welcome fluent-speaker review.
- `privacy-and-permissions.md`: data disclosures and permission explanations for the dashboard.
- `reviewer-notes.md`: reproducible build, implementation explanation and functional review instructions.
- `assets/`: generated 1280 × 800 screenshots, 128 × 128 icon and optional 440 × 280 promo tile. Actual extension UI with fictional demonstration conversations; no real customer data. Run `npm run build:store` after building the extension.
- `../artifacts/tabhero-chrome.zip` and `../artifacts/tabhero-firefox.zip`: upload packages. Do not upload the brand kit as an extension.
- `../artifacts/tabhero-source.zip`: source archive, build inputs and documentation for reviewers, generated with the store kit.
- `../artifacts/tabhero-store-kit.zip`: convenience archive of this kit.

## Before submission

1. Create/sign in to your own [Chrome developer account](https://chrome.google.com/webstore/devconsole) and [Mozilla Add-ons account](https://addons.mozilla.org/developers/). Complete the requested publisher/contact verification, terms and Chrome registration payment personally. Never put account passwords, tokens, QR codes or payment details in this repository.
2. Choose a public support contact. GitHub Issues is the prepared support URL; verify the contact email in each publisher dashboard as required. Declare publisher/trader status truthfully if requested.
3. Choose the available productivity/communication category that best matches managing WhatsApp conversations. Desktop only: do not advertise Android support that has not been validated.
4. Upload the browser-specific ZIP. Paste the primary English listing, add translations, icon and screenshots, website, privacy and support links.
5. Complete disclosures using `privacy-and-permissions.md`, checked against the exact current form wording. Optional AI still counts as data transmission; do not select “no data” for the whole product merely because the developer runs no backend.
6. Attach reviewer notes and the source archive when requested. If functional review requires a dedicated test account or additional access, arrange it privately with reviewers; never provide the maintainer’s own WhatsApp login or API key.
7. Run the final authenticated acceptance checklist below. Automated fixtures alone cannot prove real compatibility. Submit for review, initially retaining the experimental/beta positioning. A beta label does not bypass policy review.
8. Keep the official installation links in `website/store-links.js` and the README aligned with the existing listings. Future versions must update the same listing and retain its identity. Chrome ID: `akceknbdadnbmehonkicfhicoebhalgk`; Firefox slug: `tabhero-new-chat-same-tab` (add-on ID: `whatsapp-mesma-aba@local.extension`).

## Authenticated acceptance checklist

- In Chrome and Firefox, open a known authorized test conversation through a supported link. Verify number and draft, unchanged document, URL and existing in-memory state, no reload, and no automatic send.
- Send a consented test reply through the popup to the selected recipient; preserve the active WhatsApp conversation, composer draft and work-tab focus.
- Check search, saved replies, unread badge, text and media placeholders, stale account/document handling and uncertain-send behavior.
- On a fresh install, verify the localized welcome page. Read the popup disclosure and return without losing the draft. Inspect the release-source and policy links.
- Without connecting AI, observe no OpenRouter requests. If AI is tested, explicitly consent, supply a dedicated test key and confirm that only a suggestion request sends the disclosed text/draft. Disconnect afterward.
- Verify failure leaves WhatsApp intact. Do not trigger uncertain real sends merely to test retry behavior; use fixtures for failure injection.

## Current validation and status

The project has automated unit and browser tests against simulated WhatsApp interfaces, an actual Firefox toolbar-popup sizing check, and a local Firefox add-on lint check. Prior user feedback confirms successful quick reply in an authenticated Firefox session; this is not a full authenticated audit of the release. Both store listings are public. Their availability does not establish approval of the latest local packages or a complete authenticated validation of the release.

Official references checked 5 November 2026: [Chrome publication](https://developer.chrome.com/docs/webstore/publish), [Chrome listing assets](https://developer.chrome.com/docs/webstore/cws-dashboard-listing), [Chrome disclosures](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy), [Firefox submission](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/), [Mozilla policies](https://extensionworkshop.com/documentation/publish/add-on-policies/).
