<p align="center"><img src="brand/logo.svg" width="280" alt="TabHero"></p>

<h1 align="center">New chat. Same tab.</h1>

<p align="center">Not all heroes open new tabs.</p>

<p align="center"><a href="https://klederson.github.io/tabhero/">Website</a> · <a href="https://github.com/klederson/tabhero/releases">Downloads</a> · <a href="docs/brand-strategy.md">Brand strategy</a> · <a href="docs/community-insights.md">Community insights</a> · <a href="docs/research.md">Research methodology</a> · <a href="docs/internationalization.md">Languages</a> · <a href="docs/funding.md">Support</a></p>

**TabHero** is an independent, MIT-licensed browser extension for Chrome and Firefox. It opens chat links inside an already loaded WhatsApp Web tab, preserving the document and session and preparing a draft for manual sending. It does not send messages automatically.

**Experimental — version 1.4.0.** Browser integration tests use a simulated app. Integration with a real authenticated WhatsApp session has not been validated in this development session. WhatsApp’s internal interfaces can change.

Independent project. No affiliation, sponsorship, or endorsement from WhatsApp or Meta. WhatsApp is a trademark of its respective owners.

## Update an existing installation

Reload **the extension only**: use the reload button on its card at `chrome://extensions`, or **Reload** beside it in Firefox’s `about:debugging`. The extension is now named **TabHero**, version **1.4.0**. Its integration runs on demand, so you can leave the WhatsApp tab as it is.

## Install in Chrome

Ready-to-use files are in `dist/chrome`. Using the extension does not require Node or terminal commands.

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select this project’s `dist/chrome` folder.
5. Keep WhatsApp Web open and click a `wa.me` or `api.whatsapp.com/send` link.

If you downloaded `artifacts/tabhero-chrome.zip`, extract it first and select the extracted folder. Requires Chrome 120 or later. This is a local installation, not a Chrome Web Store listing.

## Install in Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on**.
3. Select `dist/firefox/manifest.json`.
4. Keep WhatsApp Web open and try a chat link.

If using `artifacts/tabhero-firefox.zip`, extract it first. Requires Firefox 142 or later. This temporary installation must be repeated after restarting Firefox. Permanent installation in standard Firefox requires Mozilla signing; the supplied package is not signed or published in an add-on store.

## Behavior

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

Host access is limited to `wa.me`, `api.whatsapp.com`, `www.whatsapp.com`, and `web.whatsapp.com`. `declarativeNetRequestWithHostAccess` redirects navigations before the intermediary page; `scripting` opens the chat within the loaded document. The browser may ask for site access. Keep access to the declared sites enabled in Chrome for automatic interception.

Only the local intermediary page is web-accessible, allowing links from any site to reach it. This does not grant access to read other sites. On-demand execution is restricted to WhatsApp Web and uses the destination contact model to open the chat and fill in its draft. It does not query message history. The extension has no telemetry, server, or storage of phone numbers and messages.

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
```

Firefox tests use Selenium, an installed Firefox, and geckodriver. Selenium Manager locates the driver; `FIREFOX_BINARY` selects a custom browser executable. Tests launch isolated profiles and simulate ordinary pages and WhatsApp’s internal module contracts. Real browsers exercise redirects, execution in the page context, and tab APIs.

Checks verify that the original document, its in-memory identity, prior draft, and URL remain intact while the target chat and draft change. They also check that no new WhatsApp document is requested and an integration failure preserves the tab without navigation fallback. These tests **do not prove compatibility with a real authenticated session** and do not send messages.

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

The static website has no framework or backend and is deployed to GitHub Pages by [pages.yml](.github/workflows/pages.yml). Source is in `website/`; vectors, the PDF guide, and social artwork are in `brand/`. Fonts are self-hosted with their OFL licenses. Run `npm run package` and `npm run build:site` to generate `website/dist/`. Website downloads include `tabhero-chrome.zip`, `tabhero-firefox.zip`, and `tabhero-brand-kit.zip`.

`npm run build:brand` regenerates icons, social artwork, and the PDF guide with Playwright Chromium. To regenerate outlined wordmarks, install `fonttools` in a Python environment and run `scripts/wordmark.py`. The final assets are versioned; regenerating them is not required to build or publish the site.

English is primary at the site root. Localized static pages are available at `es/`, `pt-br/`, `id/`, and `hi/`, with a visible language selector and matching privacy and community-research pages. `research.html` presents eight attributed historical reports with filters and separates reported experiences from our product interpretations. Website copy lives in `website/locales/`, the shared page structure in `website/template.html`, and native extension messages in `extension/_locales/`. The extension follows the browser UI language with English as its fallback. The website does not redirect based on location or browser language; a language choice stays in its URL. See the [internationalization plan](docs/internationalization.md) for language-review requirements and the limits of market research.

Support is optional through **GitHub Sponsors, from US$ 1**. Receiving payments is not enabled yet; the website shows a pending state and does not offer a nonexistent checkout. Once enrollment is complete, `node scripts/enable-sponsors.mjs` checks the public page before enabling local configuration. Amount and payment type are confirmed on GitHub. GitHub charges no fee for sponsorships from personal accounts; sponsorships from organizations may incur a fee of up to 6%. A GitHub account is required. See [funding.md](docs/funding.md).

**The best version of TabHero? The one you never have to install.** Native adoption would be a welcome outcome. This is not an acquisition request or a claim of interest from Meta. The [MIT license](LICENSE) permits reuse under its terms, without obliging anyone to adopt or acquire the project. Fonts retain their own licenses. Contributions are welcome: [CONTRIBUTING.md](CONTRIBUTING.md).
