# Report a security issue

Please do not publish account data, conversations, tokens, or an exploit containing personal information in an issue. Use the repository’s **Report a vulnerability** feature when available. If it is unavailable, open an issue asking only for a private reporting channel, without disclosing the vulnerability details.

TabHero should operate only on origins declared in its manifest, never send messages automatically, and never collect conversations. Integration failures must leave the existing WhatsApp document intact, with no navigation or reload fallback. Browser tests simulate WhatsApp interfaces and do not establish security or compatibility in an authenticated real session.

The website does not collect payment details. Optional payments take place on the active GitHub Sponsors profile and require confirmation there; no charge is made by the website.

Saved replies and the optional OpenRouter key use local extension storage. Drafts and send-operation records use browser-session storage. An explicit AI suggestion sends the displayed received text and draft directly to OpenRouter and its AI provider under their policies. The developer operates no chat relay, advertising, analytics or telemetry service. Public source makes inspection possible; it is not an independent security certification.
