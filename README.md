<p align="center"><a href="https://github.com/sponsors/klederson"><img src="brand/sponsor-badge.svg" width="224" height="40" alt="Support TabHero on GitHub Sponsors"></a></p>

<p align="center"><img src="brand/logo.svg" width="280" alt="TabHero"></p>

<h1 align="center">New chat. Same tab.</h1>

<p align="center">Not all heroes open new tabs.</p>

<p align="center"><a href="https://klederson.github.io/tabhero/">Website</a> · <a href="https://github.com/klederson/tabhero/releases">Downloads</a> · <a href="docs/brand-strategy.md">Brand strategy</a> · <a href="docs/community-insights.md">Community insights</a> · <a href="docs/research.md">Research methodology</a> · <a href="docs/internationalization.md">Languages</a> · <a href="docs/funding.md">Support</a></p>

**TabHero** is an independent, MIT-licensed browser extension for Chrome and Firefox. It opens chat links inside an already loaded WhatsApp Web tab, preserving the document and session and preparing a draft for manual sending. It does not send messages automatically.

The toolbar's **Quick reply** panel also lets you choose a loaded conversation and send a deliberate reply without leaving your work tab. Use free text, saved replies, or an editable AI suggestion through your own OpenRouter key. Sending always requires your Send click. The silent icon badge shows unread messages for the selected regular WhatsApp tab.

**Experimental.** Browser integration tests use a simulated app. Integration with a real authenticated WhatsApp session has not been validated in this development session. WhatsApp’s internal interfaces can change.

Independent project. No affiliation, sponsorship, or endorsement from WhatsApp or Meta. WhatsApp is a trademark of its respective owners.

## Privacy and public source

No developer server receives your chats. No advertising or sale of your data. Optional usage counts and broad error categories go through a statistics server to Google Analytics only after you opt in; chats and credentials never enter those statistics. TabHero intercepts supported conversation links and accesses loaded chat names, unread counts and message previews to provide its features. Sending requires your explicit click.

Saved replies and an optional OpenRouter key are stored locally in this browser profile; drafts and send-operation records use browser-session storage. AI is optional: connecting your own key and clicking Suggest sends the displayed received text, including an available caption, and your draft directly to OpenRouter and its AI provider under their policies. Media files are not sent to AI.

The first-install page and popup explain these details and link to the public GitHub source. Inspect it, build it yourself and report issues. Source availability enables inspection; no independent security certification is claimed. Read the [privacy policy](https://klederson.github.io/tabhero/privacy.html) and [store submission guide](store/README.md).

The website separately offers optional Google Analytics visit statistics, only with visitor permission. See the [website analytics setup](docs/website-analytics.md) and [separate extension statistics](docs/extension-analytics.md).

## Update an existing installation

Reload **the extension only**: use the reload button on its card at `chrome://extensions`, or **Reload** beside it in Firefox’s `about:debugging`. The extension is named **TabHero**. Its integration runs on demand, so you can leave the WhatsApp tab as it is.

## Install in Chrome

Install from the [official Chrome Web Store listing](https://chromewebstore.google.com/detail/akceknbdadnbmehonkicfhicoebhalgk). Review the permissions, confirm **Add to Chrome**, and keep WhatsApp Web open in the same browser. Requires Chrome 120 or later.

For a local development installation, ready-to-use files are in `dist/chrome`:

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select this project’s `dist/chrome` folder.
5. Keep WhatsApp Web open and click a `wa.me` or `api.whatsapp.com/send` link.

If you downloaded `artifacts/tabhero-chrome.zip`, extract it first and select the extracted folder. These steps load the local build; the store button installs the published release.

## Install in Firefox

Install from the [official Mozilla Add-ons listing](https://addons.mozilla.org/en-US/firefox/addon/tabhero-new-chat-same-tab/). Review the permissions and confirm **Add to Firefox**. Requires Firefox 142 or later.

For a temporary local development installation:

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on**.
3. Select `dist/firefox/manifest.json`.
4. Keep WhatsApp Web open and try a chat link.

If using `artifacts/tabhero-firefox.zip`, extract it first. This temporary local installation must be repeated after restarting Firefox. The unsigned development ZIP differs from the signed release installed through Mozilla Add-ons.

## Behavior

### Quick reply from the toolbar

1. Keep WhatsApp Web signed in and open in the same browser profile. Pin TabHero's icon in the browser toolbar for easy access.
2. Click the icon, open the recipient picker and type a name to search inside the list, then choose the conversation, write your reply or tap a saved reply, and click **Send reply**. Search ignores case and accents and includes loaded conversations beyond the first 100 results. Typing or canceling a search does not change the selected recipient or draft. WhatsApp is neither focused nor reloaded, and its active chat and existing draft are left alone.
3. **My saved replies** lets you create, edit and delete reusable text. Closing the panel retains your current draft for the browser session.
4. AI is optional. Click **Connect AI**, follow the link to create your own [OpenRouter key](https://openrouter.ai/settings/keys), paste it once, and allow the OpenRouter connection. There is no provider, model or endpoint picker. **Suggest a reply** uses the [free-model router](https://openrouter.ai/docs/guides/routing/routers/free-router), subject to its availability and limits, with no automatic paid fallback.

Only requesting a suggestion sends the displayed received text and your draft to OpenRouter and its AI provider. Read and edit the result, then explicitly click Send. No AI request sends a WhatsApp message. A successful send means WhatsApp accepted the message; check delivery in WhatsApp. Uncertain sends retain the text and require checking WhatsApp before another attempt, rather than retrying automatically.

The badge uses a dark-red background and white text to stand apart from the lime icon. It updates silently (normally every 15 seconds while the WhatsApp document runs; background-browser throttling can delay it). No sound or desktop notification. It follows the selected regular tab rather than summing duplicate tabs; private sessions do not update the global badge. The panel only exposes sessions in the current tab's private/container context. Only messages already loaded in the app are used; no message-history archive is fetched. The latest incoming photo, video, voice note, document or other non-text message is identified with a localized placeholder and any loaded caption. No media is downloaded, played or passed to AI; view-once content remains unopened. The compact popup retains its layout with a familiar teal-and-soft-green palette. See [the acceptance criteria](docs/quick-reply.md).

### Opening conversation links

- Captures `https://wa.me/NUMBER`, `https://api.whatsapp.com/send?phone=NUMBER`, and `https://www.whatsapp.com/send?phone=NUMBER`, including trailing-slash and HTTP variants.
- Preserves the `text` message, including accents, emojis, line breaks, and special characters. Without `text`, it preserves the recipient’s existing draft.
- Prefers an existing WhatsApp tab in the same window; otherwise, focuses its window. It switches chats through internal app commands, without navigating, changing the URL, or reloading the loaded tab.
- If no WhatsApp tab exists, opens WhatsApp Web in the intermediary tab.
- Closes a newly created intermediary tab. When that tab has prior history, returns to the source page instead. A link typed into an existing blank tab may return to a blank page.
- The extension button also opens or focuses WhatsApp Web.
- Prepares the message for manual sending. It never sends it automatically.

The tab must be in the same browser and profile as the extension. A Firefox extension cannot control a WhatsApp tab in Chrome. This release targets normal windows; private browsing has not been validated.

The integration uses WhatsApp’s already loaded internal modules to resolve a contact, open the chat, and fill in the draft. These interfaces are not a stable public API. If unavailable, the extension shows an error on the intermediary page and leaves the existing WhatsApp tab intact. **There is no navigation or reload fallback.** It does not load remote scripts or libraries or modify the app’s module loader.

`https://web.whatsapp.com/send` is used only for the initial opening when no WhatsApp tab exists. If signed out, link the account through the normal WhatsApp flow.

Group invitations, channels, numberless sharing links, and business codes such as `wa.me/message/...` follow their normal flow. If that flow later reaches a supported numbered chat link, TabHero intercepts it then. Links already pointing to `web.whatsapp.com` follow their normal flow.

## Permissions and privacy

Required host access is limited to `wa.me`, `api.whatsapp.com`, `www.whatsapp.com`, and `web.whatsapp.com`. `declarativeNetRequestWithHostAccess` redirects navigations before the intermediary page; `scripting` opens the chat within the loaded document. The browser may ask for site access. Keep access to the declared sites enabled in Chrome for automatic interception.

Only the local intermediary page is web-accessible, allowing links from any site to reach it. The quick-reply popup is private to the extension. Optional usage statistics go through a separate statistics server only after opt-in, to help improve features and fix errors. Chat content never enters those statistics. It uses WhatsApp's loaded chat models for names, unread counts, latest incoming text and deliberate quick replies; it does not fetch a history archive. A content script requests the silent count but cannot ask to send messages. Only the extension popup can request a quick-reply send.

The `storage` permission keeps saved replies and the optional OpenRouter key locally, without browser sync. Drafts and operation receipts use browser-session storage; closing the browser clears them. The key is never injected into WhatsApp. Optional access to `https://openrouter.ai/*` is requested only when connecting AI and can be removed with **Disconnect AI**. Firefox also requests its optional authentication-information and personal-communications consent at that point; revoking it prevents AI requests. No chat content goes to AI in the background. Local storage is not an encrypted password vault; use a dedicated, limited OpenRouter key. No real key is included in this repository or its tests.

## Develop and test

Node 22 or later:

```sh
npm ci
npm test
npm run build
```

Packages use native JavaScript without runtime libraries or a compiler. The build generates separate manifests: a Chrome service worker and a modular Firefox background script.

```sh
npx playwright install chromium
npm run test:browser
npm run test:firefox
npm run test:popup:firefox
npm run test:quick-reply
```

Firefox tests use Selenium, an installed Firefox, and geckodriver. Selenium Manager locates the driver; `FIREFOX_BINARY` selects a custom browser executable. Tests launch isolated profiles and simulate ordinary pages and WhatsApp’s internal module contracts. Real browsers exercise redirects, execution in the page context, and tab APIs.

`npm run test:popup:firefox` also opens the real Firefox toolbar popup in an isolated profile and checks its width and height after closing and reopening. This catches popup sizing defects that loading `popup.html` in a browser tab cannot reproduce.

Link-routing checks verify that the original document, its in-memory identity, prior state, and URL remain intact while the target chat and draft change. Quick-reply checks verify the selected recipient, exact outgoing text, unchanged active WhatsApp chat and composer, unchanged work-tab selection, duplicate prevention, draft recovery and AI suggestions without sending. Both verify no navigation or reload fallback. These tests use **simulated WhatsApp and AI interfaces**, not authenticated accounts or a paid API. They do not establish real-world compatibility or recipient delivery.

Validate the Firefox manifest and generate ZIPs (`zip` is required for packaging):

```sh
npx web-ext lint --source-dir dist/firefox
npm run package
```

For a separate manual validation, use an authorized test account:

1. Open WhatsApp Web and sign in.
2. In another tab, open `wa.me/NUMBER?text=Hello` using a test number you control.
3. Confirm that the chat changes inside the loaded interface and the text is drafted without sending. Verify document identity and state, unchanged URL, and no navigation, reload, or new document request; a reused tab ID alone is insufficient.
4. Repeat with `api.whatsapp.com/send/?phone=NUMBER&text=Hello`, and record browser, app version, date, and results without personal data.

References: [Chrome redirect rules](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest), [Firefox background scripts](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background), [temporary Firefox installation](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/).

Internal contracts were consulted in public WPPConnect/WA-JS code: [opening a chat](https://github.com/wppconnect-team/wa-js/blob/main/src/chat/functions/openChatBottom.ts), [setting a draft](https://github.com/wppconnect-team/wa-js/blob/main/src/chat/functions/setInputText.ts), [resolving a contact](https://github.com/wppconnect-team/wa-js/blob/main/src/whatsapp/functions/findOrCreateLatestChat.ts). The local adapter is independent of those libraries and does not bundle them.

## Website, identity, and support

[**Sponsor TabHero on GitHub →**](https://github.com/sponsors/klederson) — optional support from US$ 1; all features stay free.

The static website has no framework or backend and is deployed to GitHub Pages by [pages.yml](.github/workflows/pages.yml). Source is in `website/`; vectors, the PDF guide, and social artwork are in `brand/`. Fonts are self-hosted with their OFL licenses. Run `npm run package` and `npm run build:site` to generate `website/dist/`. Website downloads include `tabhero-chrome.zip`, `tabhero-firefox.zip`, and `tabhero-brand-kit.zip`.

`npm run build:brand` regenerates icons, social artwork, and the PDF guide with Playwright Chromium. To regenerate outlined wordmarks, install `fonttools` in a Python environment and run `scripts/wordmark.py`. The final assets are versioned; regenerating them is not required to build or publish the site.

English is primary at the site root. Localized static pages are available at `es/`, `pt-br/`, `id/`, and `hi/`, with a visible language selector and matching privacy and community-research pages. `research.html` presents eight attributed historical reports with filters and separates reported experiences from our product interpretations. Website copy lives in `website/locales/`, the shared page structure in `website/template.html`, and native extension messages in `extension/_locales/`. The extension follows the browser UI language with English as its fallback. The website does not redirect based on location or browser language; a language choice stays in its URL. See the [internationalization plan](docs/internationalization.md) for language-review requirements and the limits of market research.

The extension has a **Support TabHero** button and its own support screen, available even without a WhatsApp session. Choose US$ 1, US$ 3, US$ 5, US$ 10 or a custom whole-dollar amount in the extension or website. The selected amount is passed to GitHub’s review form, defaulting to one-time support; users can change the frequency and must confirm the payment on GitHub. Opening the screen keeps the quick-reply draft. The extension and website share `website/funding.json`, bundled locally at build time, so an unavailable receiving profile keeps both checkout buttons disabled.

Support is optional through **GitHub Sponsors, from US$ 1**. The public receiving profile is active and the website and extension support buttons are enabled. To recheck its availability, `node scripts/enable-sponsors.mjs` checks the public page before enabling local configuration. Amount and payment type are confirmed on GitHub. GitHub charges no fee for sponsorships from personal accounts; sponsorships from organizations may incur a fee of up to 6%. A GitHub account is required. See [funding.md](docs/funding.md).

**The best version of TabHero? The one you never have to install.** Native adoption would be a welcome outcome. This is not an acquisition request or a claim of interest from Meta. The [MIT license](LICENSE) permits reuse under its terms, without obliging anyone to adopt or acquire the project. Fonts retain their own licenses. Contributions are welcome: [CONTRIBUTING.md](CONTRIBUTING.md).
