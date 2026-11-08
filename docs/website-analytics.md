# Website analytics (Google Analytics 4)

Website only. Website tracking code is never imported into the extension. Separate, opt-in extension statistics are described in [extension analytics](extension-analytics.md). The standalone RELAYERS Bridge HTML guide also stays offline and tracking-free.

## Activation

1. In Google Analytics, use separate web streams for TabHero and RELAYERS Bridge (separate properties are also fine). Both use the same GitHub Pages hostname, so name the streams clearly and use their distinct measurement IDs.
2. Open **Admin → Data streams → the web stream**. Copy its public **G-…** measurement ID. No API secret, password or service-account key is needed or safe to put in this repository.
3. **Turn off Enhanced measurement** for each stream. Our loader sends a page view and explicit download/support click events. Automatic form, search, outbound-link, history and other collection is outside this setup. Keep Google Signals, advertising integrations, user-provided data collection and cross-domain measurement disabled. Do not connect additional tags or destinations to this tag.
4. Put the ID in the site's `analytics-config.js` file. An empty or malformed ID disables the entire integration and preferences interface. Deploy through the existing GitHub Pages workflow.
5. Visit the published site, allow statistics and check the matching stream in **Reports → Realtime**. Ad blockers may block the tag; never bypass them. Test the refusal in a fresh browser context too. Automated tests intercept the Google script and never submit fake statistics to Google.

## Visitor choice and data

The tag is not loaded until permission is granted (basic consent behavior). Refusal causes no requests to Google Analytics, including cookieless pings. The footer's **Visit statistics** button reopens the choice. Consent lasts 180 days in local storage and is separate for each project even though both are on klederson.github.io. Google Analytics cookies use a project-specific prefix, host-only domain and project path, with a 180-day expiry. Revocation disables the tag, deletes the project's prefixed cookies and reloads the website; it never reloads WhatsApp.

Events: `page_view`, `download_click`, `support_click`. Clicks represent intent, not a completed download, installation or payment. No chat data, extension events, free text, recipient, phone, token, AI prompt or key is passed to these events. Page addresses exclude query parameters and fragments; the referring URL is omitted. Google still processes technical visit information and cookies under its own policies. This is not a promise of anonymity or a substitute for reviewing your account settings and obligations.

## Verification

Run `npm run test:analytics` after preparing the site's normal build. Tests intercept all external requests, cover refusal, acceptance, persistence, expiry, revocation, isolated preferences, locale changes and safe event payloads. Keep the Google Analytics stream's Enhanced measurement disabled: repository tests cannot inspect or enforce remote dashboard settings.

Official references: [measurement ID](https://support.google.com/analytics/answer/9539598), [consent](https://developers.google.com/tag-platform/security/guides/consent), [configuration](https://developers.google.com/analytics/devguides/collection/ga4/reference/config).


Configured public website stream: `G-5N0W0XMM0Y`. This is separate from the extension stream.
