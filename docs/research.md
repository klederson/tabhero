# Public research — TabThere

Author: Klederson Bueno, 2026. Sources consulted: 4 November 2026.

## Question and limits

Are there public reports from people who want to open a chat from a link without going through the wrong app, another WhatsApp Web instance, or another loading screen?

Yes. The sources below document specific situations and related requests. They are historical, anecdotal evidence from different operating systems, browsers, and tools. They do not measure prevalence, establish consensus, or demonstrate that every reported behavior still occurs. This research was read-only: no posts, user contact, or access to private groups. Searches of indexed public communities and chans did not produce another relevant, verifiable source; that does not establish an absence of complaints in those spaces.

“Exact” means the report matches part of the user problem, not that the behavior was technically reproduced in TabThere. None of these sources demonstrates preservation of document identity, the stricter acceptance criterion adopted by the project.

## Eight sources

Dates in the table use **DD/MM/YYYY**.

| Public source | Report date | Faithful summary | Relationship and limits |
| --- | --- | --- | --- |
| [Hacker News — dearjames comment](https://news.ycombinator.com/item?id=25661105), also available in the [conversation context](https://news.ycombinator.com/item?id=25657603) | 06/01/2021 | Explains that choosing WhatsApp Web on the intermediary page loads a new instance even when another tab is already open. In the context, another person describes an attempt to open an app on Linux despite being signed in to Web. | **Exact:** ignores the existing Web instance. Individual reports from 2021, without current validation or a verifiable vote count. |
| [Stack Overflow — click-to-chat on OSX and WhatsApp Web](https://stackoverflow.com/questions/60254713/whatapp-click-to-chat-links-do-not-work-with-osx-native-client-and-whatsapp-web) | 17/02/2020 | A team uses links to chat with customers from its administrative panel. It reports that the Web flow opens another instance in a new tab or window and takes seconds to load. | **Exact:** duplicate instance and waiting in a professional workflow. The question also covers native-app failures; do not conflate the symptoms. |
| [Super User — stop the desktop app opening](https://superuser.com/questions/1634477/stop-whatsapp-desktop-app-from-opening-on-api-whatsapp-com-links-run-whatsapp-w) | 19/03/2021 | A person uses a personal account in the desktop app and a business account on Web. Links prompt them to open the app; canceling leaves them on the intermediary page instead of reaching the intended Web account. | **Exact:** routing to a different app and account from those intended. Does not describe document identity or a solution without navigation. |
| [Reddit r/chrome — protocol handler per profile](https://www.reddit.com/r/chrome/comments/whk4wd/disable_whatsapp_protocol_handler_in_specific/) | 06/08/2022 | Two numbers were used in different Chrome profiles. After installing the desktop app, links to unsaved contacts start opening the app associated with only one phone. The author asks how to disable that routing per profile. | **Exact:** the app intercepts a flow intended for Web. Date confirmed from the public creation field in the [post JSON](https://www.reddit.com/r/chrome/comments/whk4wd.json). |
| [Reddit r/whatsapp — wa.me on Firefox Ubuntu](https://www.reddit.com/r/whatsapp/comments/16pyo5e/unable_to_open_chat_using_wame_url_on_firefox/) | 23/09/2023 | wa.me and api.whatsapp.com links open an app chooser reporting that no installed app can handle the requested protocol. | **Adjacent:** routing failure between browser and app; the author does not state that a Web tab was already open. Date confirmed by the [public JSON](https://www.reddit.com/r/whatsapp/comments/16pyo5e.json). |
| [GitHub PyWhatKit — Prevent new tab from opening if already open, #190](https://github.com/Ankit404butfound/PyWhatKit/issues/190) | 02/03/2022 | A user reports that the library opens a new tab to send a message while ignoring the active WhatsApp tab. Another person confirms the next day. The issue was closed on 06/03 as a duplicate of #120. | **Adjacent, with the same inconvenience:** the trigger is a third-party automation library, not an isolated test of the native wa.me flow. Do not present it as proof of a defect exclusive to WhatsApp. |
| [GitHub Tridactyl — open a URL in an existing tab, discussion #5275](https://github.com/tridactyl/tridactyl/discussions/5275) | 29/09/2025 | A user opens chats from selected phone numbers and wants to find and activate the existing Web tab, creating another only when necessary. | **Adjacent:** an explicit request to reuse a tab. The proposed solution changes its URL; that **does not** meet TabThere’s requirement to preserve the document without navigation or reloading. |
| [Mozilla Support — WhatsApp chat not invoking from Firefox Android](https://support.mozilla.org/en-US/questions/1341933) | 25/06/2021 | A user reports that the continue-chat button started suggesting an installation even though WhatsApp is installed and the flow works in Chrome. They later report that a link variant worked. | **Adjacent:** Android routing, without evidence of a duplicate Web tab. The page marks the question as solved; retain that context. |

Reddit dates were converted from UTC creation fields. Scores are omitted: they vary, do not measure how many people experience the problem, and add little to the argument. Do not portray these authors as customers, reviewers, or supporters of TabThere; they did not evaluate the extension.

## Claims the evidence supports

- Public reports across different years and environments describe chat links opening another instance or routing to the wrong app.
- Reusing an existing WhatsApp Web instance appears as an explicit user request.
- The product demonstration should show a chat opening in the already loaded interface, with text prepared as a draft for manual sending.

The research does not support claims that “everyone complains,” thousands requested TabThere, the problem affects every browser, or the extension has already solved it in real sessions. The inconvenience can motivate a demonstration; that demonstration needs its own evidence.

## Product criterion and validation status

The desired outcome is to open the chat in WhatsApp Web that is already loaded, preserving its document and session. Reusing the tab ID is insufficient: navigating within that tab can retain the ID while destroying its state. Acceptance criteria include document identity, in-memory state, unchanged URL, correct chat, and correct text. Integration failure must show an error and leave the existing tab intact, without a silent reload.

**Integration with a real authenticated app has not been validated in this development session. Browser tests simulate WhatsApp interfaces.** Real browsers exercise extension mechanisms; that does not prove compatibility with a real signed-in session. Do not invent results, time savings, success rates, or testimonials. Record real validation separately with app version, browser, date, and results, without exposing contacts or conversations.

## Official brand reference

[Meta’s official WhatsApp brand guidelines](https://www.meta.com/brand/resources/whatsapp/whatsapp-brand/) were consulted on 04/11/2026. They restrict confusing marks, name variations, use as a product name, and implications of sponsorship. The response is an original identity: TabThere, without a phone, speech bubble, or WhatsApp-derived logo. This reduces confusion; it does not certify name availability or legal clearance. Editorial application is documented in [brand-strategy.md](brand-strategy.md).

## Proportionate measurement

Prioritize voluntary feedback: browser and version, link format using a fictional number, expected result, and observed result. Do not request chat history, real phone numbers, messages, or an authenticated profile. If sensitive material is submitted accidentally, remove it from public evidence and request a synthetic replacement.

Compare only available aggregate distribution totals, voluntary reports of success or failure, and issue response time. Identify each metric’s source and its denominator when known. Downloads are not active users; voluntary reports do not estimate the general failure rate. Do not introduce use tracking, persistent identifiers, or conversation collection to measure the proposal.
