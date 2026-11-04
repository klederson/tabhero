# TabThere internationalization

English is the primary language for TabThere 1.3.0: **New chat. Same tab.** The wordmark remains **tabthere.** in every language. Translate the explanation and humor naturally; do not translate the brand or imply that WhatsApp or Meta endorses the project.

This plan was prepared by Klederson Bueno in 2026, using public sources consulted on 4 November 2026. Language priorities are editorial decisions, not a measured ranking of demand for this extension.

## Initial catalog priorities

| Priority | Language | Purpose and review needs |
| --- | --- | --- |
| Primary | English (`en`) | Shared source for product copy, documentation, and international open-source contributions. Use familiar words and clear installation instructions. |
| Initial | Latin American Spanish (`es-419`) | Serve several Spanish-speaking markets with a neutral, natural adaptation. Keep a Spanish fallback where required by the distribution platform. Regional Spanish is not one uniform voice. |
| Initial | Brazilian Portuguese (`pt-BR`) | Support the Brazilian audience and the project’s original language. Preserve the warmth of the original without forcing its jokes into other languages. |
| Initial | Indonesian (`id`) | Prioritize a substantial WhatsApp market in Southeast Asia. Require an Indonesian speaker to review phrasing, installation steps, and technical limitations. |
| Initial | Hindi (`hi`) | Offer another accessible option for part of the Indian audience. Hindi is not a substitute for every language used in India. Review Devanagari rendering and natural terminology. |

German (`de`) and Arabic (`ar`) are candidates for a later phase, based on contribution capacity and voluntary demand. Arabic requires complete right-to-left layout checks and language review. Malay (`ms`) is a distinct future candidate; Indonesian is not a replacement for it. Do not promise additional language coverage before the catalog and interface are ready.

## What the research actually measures

| Primary source and date | Method and useful implication | What it does not establish |
| --- | --- | --- |
| [SBA Research / University of Vienna announcement](https://www.sba-research.org/2025/11/19/researchers-discover-major-security-flaw-in-whatsapp/), 19 November 2025; [paper](https://publications.sba-research.org/publications/Hey_there_You_are_using_WhatsApp_NDSS_extende_Gabriel%20Gegenhuber.pdf), NDSS 2026 | Researchers enumerated phone-number-linked accounts through contact discovery. Measurement rounds ran from mid-December 2024 to mid-April 2025. The public [country table](https://github.com/sbaresearch/whatsapp-census/blob/main/country-table.md) identifies India, Indonesia, Brazil, and several Spanish-speaking countries as substantial markets. | These are discovered accounts, not unique people, MAU, language preferences, or a count of desktop users. Multi-round collection has blind spots. Country attribution does not establish residence or preferred language. |
| [Digital 2027 Global Overview Report](https://datareportal.com/reports/digital-2027-global-overview-report), launched 21 October 2026; [publisher announcement](https://www.meltwater.com/en/press-releases/digital-2027-report) | The latest global edition available at the consultation date distinguishes GWI’s self-reported use among internet users aged 16+ from Similarweb’s app-use indices. Its methodological notes flag coverage and methodology changes. | A mobile-app MAU index excludes Web sessions. Survey use, favorite-platform answers, ad reach, registered accounts, and MAU are different measures and must not be combined as one total. |
| [We Are Social: Digital 2027 United Kingdom](https://wearesocial.com/uk/blog/2026/11/digital-2027-the-latest-digital-and-social-data-from-the-uk/), 4 November 2026 | The report publisher describes WhatsApp’s strong everyday presence in the UK, supporting an English-language audience beyond open-source contributors. | Frequency and preference are not estimates of demand for TabThere or its desktop workflow. |
| [DataReportal: Digital 2026 Thailand](https://datareportal.com/reports/digital-2026-thailand), reporting late-2025 observations; consulted 4 November 2026 | The report includes monthly active user figures supplied by LINE itself, showing a strong local presence. | Evidence about Indonesia or Malaysia does not justify assuming the same messaging landscape throughout Southeast Asia. |

These sources support where to start, not a forecast of downloads. We deliberately avoid precise addressable-market totals. The SBA study’s country table supports Indonesian and Brazilian Portuguese as useful additions; Spanish offers access across multiple relevant markets. None of it makes a country equivalent to a language.

**India is not synonymous with Hindi. Southeast Asia is not synonymous with WhatsApp.** English-first is a maintenance and access choice, not a claim that all users understand English. Later Indian-language additions should follow fluent contributors and voluntary requests rather than assuming national coverage from one translation.

## Translation contract

Use the English catalog as the shared source, with a visible language selector and a fallback to English. Respect the user’s explicit language choice. Do not infer preferred language solely from geography, a phone-number country code, or the destination contact.

Every catalog must preserve all source keys, HTML structure and attributes, URLs, icons, brand tokens such as `__BRAND__` and `__WORDMARK__`, and interpolation placeholders such as `{address}`, `{count}`, and `{browser}`. Locale labels should be recognizable in their own language. Adapt jokes, sentence order, and line breaks thoughtfully, without changing the behavior being promised. Use localized browser-interface labels where appropriate.

Translation drafts need idiomatic review by a fluent speaker before being described as reviewed. Automated checks can detect missing keys or broken markup; they cannot certify natural, accurate language. Record whether a locale is a draft or has received language review. A translated catalog is also not proof that the extension’s WhatsApp integration works in that language.

## Release checks

- Review the hero, calls to action, demo states, installation steps, accessibility labels, privacy, and failure messages in context. Check long strings, small screens, keyboard navigation, and script-specific font coverage.
- Check singular and plural wording around `{count}`, punctuation, and screen-reader language. Do not assume English plural rules fit every locale.
- Keep the experimental status explicit: browser tests simulate WhatsApp interfaces; integration in a real authenticated session has not been validated in this development session.
- Preserve manual sending, document preservation, and the absence of a navigation or reload fallback. A translation must not turn an objective or limitation into a universal guarantee.
- Keep support optional and from US$ 1 through GitHub Sponsors. Receiving payments is currently pending. Once enabled, users confirm amount and payment type on GitHub. Do not translate the amount as a different currency or imply that recurring support is a one-time purchase.

Measure only available aggregate distribution totals and voluntary, nonsensitive feedback. Do not instrument chats, phone numbers, drafts, destination contacts, or WhatsApp sessions to decide language priorities. Reports from contributors are useful for prioritization, but do not estimate the general failure rate or represent all speakers of a language.
