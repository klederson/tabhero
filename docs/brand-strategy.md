# Brand strategy — TabHero

Author: Klederson Bueno, 2026. Identity and launch direction, 4 November 2026. Current product identity: TabHero 1.5.0.

## Make the desired outcome clear

Someone clicks a link to start a chat and wants to keep using the WhatsApp Web page already open. TabHero shortens that path: open the chat within the loaded interface, preserve the session, and prepare a draft for manual sending. Explain that result before discussing architecture.

Selected name: **TabHero**. Displayed wordmark: **tabhero.** Repository: [klederson/tabhero](https://github.com/klederson/tabhero). Choosing a name and visual direction does not establish trademark or domain availability or legal clearance.

The name connects **tab / here / hero**: the small rescue is keeping the chat right here, in the tab already loaded. Supporting brand line: **“Not all heroes open new tabs.”** The functional tagline remains the clearest promise.

Primary line: **“Another tab? It’s already open.”**

Tagline: **“New chat. Same tab.”**

Supporting copy: **“You wanted to start a chat. Not open a franchise of WhatsApp tabs.”**

The joke is about an unnecessary detour, expressed in language people recognize. The brand does not depend on swearing at a company, attacking the people who built the software, or exaggerating the size of the problem.

## Position and voice

Users first: serve people working, shopping, supporting customers, or making plans in the browser. A small, verifiable improvement is more useful than a manifesto of outrage. The [public research](research.md) provides historical context, not proof of popularity or testimonials about the extension.

Voice: warm, direct, and lightly irreverent. Use short sentences, humor about the extra tab, and clear guidance when something fails. Avoid “revolutionary,” “the whole community asked for this,” insults, manufactured urgency, and universal promises.

The subtle hope for native adoption is: **“The best version of TabHero? The one you never have to install.”** The best outcome would be for the original flow to solve the problem itself. This is not an acquisition request, job application, partnership announcement, or claim of interest from Meta. A supporting line is: “Open code. The idea can become a feature, too.”

The MIT license permits use, copying, and modification under its published terms. That includes potential adoption by Meta without an obligation to buy the project. Build usefulness, reputation, and evidence of product and maintenance capability; acquisition, hiring, or partnership would be separate possibilities, never a promised result of open source. No one is obliged to adopt or acquire the project.

## Visual system

| Element | Direction |
| --- | --- |
| Acid lime — `#C7F65A` | Signature color, primary actions, and emphasis on returning to the existing tab. |
| Ink — `#17231B` | Main text and symbol structure. |
| Cream — `#F7F7EF` | Light background, reading areas, and breathing room. |
| Coral — `#FF795A` | Visual punctuation, friction, and secondary emphasis. |
| Symbol | A browser tab with an arrow returning inside. Original, simple, and legible at icon size. |
| Typography | Bricolage Grotesque for the wordmark and headings; Manrope for body and interface text. Check language-specific character coverage and readable hierarchy. |

Do not use a speech bubble, phone, WhatsApp-derived logo, or official-looking badge. The symbol should remain recognizable without relying on color. Check text contrast and keyboard focus; coral must not be the only indication of an error. TabHero remains the most prominent identity.

## Landing-page narrative

1. **Recognize the friction.** “Another tab? It’s already open.” Follow with a concrete explanation: “TabHero opens the chat link in the WhatsApp Web page you already have loaded.”
2. **Demonstrate the result.** Show the source click, destination chat, and draft within the same interface. Use fictional numbers and content. Label a simulated interface inside its demonstration block; do not present it as an authenticated recording.
3. **Explain the scope.** A prepared draft, manual sending, the same browser and profile. Integration failure becomes a visible error and preserves the tab. Do not promise every link type or app version will work.
4. **Offer verifiable confidence.** Available source, installation instructions, explained permissions, and compatibility limits near the installation action. Distribute under **MIT**, with the license file and © 2026 Klederson Bueno notice in published artifacts.
5. **Invite useful contributions.** “View the code” and “Report a problem” are useful actions. Close with “The best version of TabHero? The one you never have to install.”

The demonstration can use “New chat. Same tab.” For an error, prefer “I couldn’t open the chat. Your tab is still as you left it.” Use that wording only when the implementation guarantees the described behavior.

## Technical credibility and limits

**Integration with a real authenticated app has not been validated in this development session. Browser tests simulate WhatsApp interfaces.** Make that readable in the documentation and compatibility block; do not hide the limitation in a generic footer.

The central criterion is preserving the already loaded document, without navigating, updating its URL, or reloading the tab to switch chats. Showing that the tab ID is reused does not establish this. Technical validation must check document identity and state, destination chat and draft, and failure without a navigation fallback.

Before claiming proven real compatibility, record an authorized authenticated test session using a test account, browser and app version, date, synthetic links, and observed result. Exclude personal data from any public recording. Until then, describe an implementation with simulated tests and real compatibility pending. Explain that updates to WhatsApp’s internal interfaces can affect the integration.

## Independence and brand care

[Meta’s official WhatsApp guidelines](https://www.meta.com/brand/resources/whatsapp/whatsapp-brand/) call for the correct “WhatsApp” spelling, avoiding prominence of its brand resources, and avoiding implications of partnership or endorsement. Use the name in ordinary text to explain compatibility. The signature and symbol belong to TabHero.

Suggested notice: **“Independent project. No affiliation, sponsorship, or endorsement from WhatsApp or Meta.”**

These choices mitigate editorial and visual confusion; they do not guarantee approval, name availability, or legal clearance. Check naming collisions and material suitability before public distribution. This research is not a complete trademark search. Do not use “official,” “approved by Meta,” or a fabricated partnership card.

## Open source and accessible documentation

Make the project easy to install, inspect, and repair. English is primary for documentation and shared source copy. Provide localized instructions, known limitations, privacy information, and contribution guidance. See [internationalization.md](internationalization.md) for initial priorities: English, Latin American Spanish, Brazilian Portuguese, Indonesian, and Hindi, including fluent-speaker review.

Name MIT explicitly in distribution files. Connect permissions to what they do for the user. Distinguish installable releases, development versions, and any signing the browser requires. Do not make registration, tracking, or sharing data a condition of using the extension.

Issue templates should request browser and extension versions, link type without a real phone number, expected result, and observed result. Encourage reproduction with fictional data. Do not request personal numbers, real text, conversations, sign-in QR codes, cookies, or profile exports. Welcome feedback in English and Portuguese and respond respectfully, including when a documented limitation is the appropriate answer.

## Optional support

GitHub Sponsors is the selected channel, from **US$ 1**, with suggested amounts of US$ 1, US$ 3, US$ 5, and US$ 10 and a custom amount on GitHub. The extension remains free without support. Receiving payments is currently pending, so the site must show that state and avoid offering an active checkout.

When enabled, the supporter confirms amount and payment type on GitHub. Sponsorships from personal accounts have no GitHub fee; sponsorships from organizations may incur a fee of up to 6%. Do not describe recurring support as a one-time payment. Keep operational details and official references in [funding.md](funding.md).

## Suggested launch plan

This plan does not authorize posting or contacting third parties; no posts were made during this research.

| Stage | Deliverable and condition |
| --- | --- |
| Prepare | Consolidate identity, MIT license, English-first documentation and localized catalogs, installable artifacts, and permission explanations. Check links and instructions. |
| Validate | Run existing tests and record a real authenticated session separately. If it remains pending, make that explicit and describe the release as experimental. |
| Demonstrate | Produce a short demonstration with fictional data, accurately identifying a simulated or real interface. Show both the outcome and failure behavior. |
| Publish, when authorized | Make the repository and release available; share in spaces that welcome the contribution, following local rules and disclosing authorship. Do not repeat the same post in bulk. |
| Listen | Monitor voluntary issues, group reproducible causes, and publish limitations and fixes. Offer useful technical detail to people investigating the idea. |

A future contribution toward native adoption can bring together the problem, reproduction, desired behavior, and evidence of document preservation. An open proposal can be useful without repeated public appeals or tagging employees.

## Measure usefulness without watching conversations

For the extension, use aggregate distribution metrics already available and voluntary contributions: downloads per release, issues by category, response time, and reproduction outcomes reported with synthetic data. Identify each total’s source, time period, and limitations.

Do not instrument extension activity, captured conversation links, phone numbers, messages, recipients, history, profiles, persistent identifiers, or WhatsApp sessions. Website visit statistics are separate and require consent; see Website statistics below. An optional anonymous survey may ask whether the extension resolved the flow, clearly identifying participation as voluntary; answers represent participants only.

Useful signals are resolved reproducible cases and understandable instructions. Downloads do not establish active users; stars do not establish compatibility; few issues do not establish an absence of failures. Publish learning with context, without manufactured social proof.

## Naming collision recorded

A separate tab-management extension called [Tab Hero](https://chromewebstore.google.com/detail/tab-hero/oghoncpoemgefilccmophihoebjmbgfl) is listed in the Chrome Web Store. The project owner selected TabHero and was informed of this existing use. The identity and chat-link scope are independent; no affiliation with that extension is claimed. This name is not presented as exclusive, registered, or legally cleared.

## Website statistics

The extension remains free of analytics. The project websites may use Google Analytics only after visitor consent, with separate choices per site. Count website visits and download/support clicks; never instrument WhatsApp activity, conversations, phone numbers, AI prompts or extension usage. See docs/website-analytics.md for deployment and dashboard controls.
