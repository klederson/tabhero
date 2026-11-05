# Support TabHero

The selected channel for [TabHero](https://github.com/klederson/tabhero) is **GitHub Sponsors**, with contributions starting at **US$ 1**. Suggested amounts are **US$ 1, US$ 3, US$ 5, and US$ 10**, with a custom amount in GitHub’s own interface. Support is voluntary and never a condition of using the extension.

The browser extension also has a Support TabHero button and a localized support screen. It uses the same `website/funding.json`, copied into both extension packages by `scripts/build.mjs`. The receiving-state check therefore controls the site and extension together. No remote check, payment tracking, banking details or sponsor authentication is added to the extension.

On 5 November 2026, the GitHub API returned a Sponsors listing for klederson with `isPublic: false`. The interface is prepared, but actual checkout remains disabled until the public receiving profile is verified.

## Fees and eligibility

GitHub charges no fee for sponsorships **sent from personal accounts**. Its documentation states that 100% of those sponsorships goes to the sponsored developer or organization. The rule depends on the account **sending** support, not whether the recipient is an individual. Sponsorships from organization accounts have a fee of up to 6%. Source: [GitHub Sponsors fees](https://docs.github.com/en/sponsors/sponsoring-open-source-contributors/about-sponsorships-fees-and-taxes).

Brazil is included among the eligible regions for receiving sponsorships. Eligibility does not replace enrollment, verification, tax forms, or approval. Source: [supported regions](https://docs.github.com/en/sponsors/getting-started-with-github-sponsors/about-github-sponsors).

The adopted minimum is US$ 1: the official API defines whole-dollar amounts from 1 to 12,000 for tiers and custom sponsorships. Source: [GraphQL Sponsors reference](https://docs.github.com/en/graphql/reference/sponsors).

## Current state and website configuration

On 4 November 2026, a public request to `https://github.com/sponsors/klederson` redirected to the profile at `https://github.com/klederson`. The receiving page was not publicly active. No enrollment, tier-creation, or payment mutation was performed while preparing this documentation.

The public `funding.json` configuration is:

```json
{
  "provider": "github",
  "currency": "USD",
  "minimum": 100,
  "presets": [100, 300, 500, 1000],
  "githubSponsors": "https://github.com/sponsors/klederson",
  "enabled": false
}
```

Internal values are in cents; the interface displays dollars. A URL in `githubSponsors` does not prove that receiving sponsorships is active. While `enabled` is `false`, show **“Financial support coming soon”**, keep the payment button unavailable, and offer starring the [repository](https://github.com/klederson/tabhero) as an alternative.

The static GitHub Pages site does not need a backend or its own account-registration system. Never store banking details, tax information, identity documents, passwords, or tokens in the website or repository. GitHub may require the supporter to sign in and provide payment details within its own flow.

## Enable the personal receiving profile

The official route is [GitHub Sponsors → Get sponsored](https://github.com/open-source/sponsors), whose button points to [github.com/sponsors/accounts](https://github.com/sponsors/accounts). Without authentication, that address leads to sign-in. Select the personal account **klederson**.

The maintainer must complete onboarding directly on GitHub and the Stripe Connect flow it presents: contact information, bank payouts, residence and bank country, tax details, two-factor authentication, and the approval request. For bank payouts, the documentation requires the bank-account region to match the region of residence. Use the account holder’s own personal details and bank account; do not put them in project files. After approval, verify that the public page actually offers sponsorship. Source: [setting up Sponsors for a personal account](https://docs.github.com/en/sponsors/receiving-sponsorships-through-github-sponsors/setting-up-github-sponsors-for-your-personal-account).

In the dashboard’s **Sponsor tiers**, create four **One-time** tiers: US$ 1, US$ 3, US$ 5, and US$ 10. Under **Custom amounts**, configure a US$ 1 minimum and a suggested amount. The custom minimum also applies to recurring sponsorships. Do not promise benefits that do not exist in tier descriptions. Source: [managing tiers and custom amounts](https://docs.github.com/en/sponsors/receiving-sponsorships-through-github-sponsors/managing-your-sponsorship-tiers).

## Supporter flow

The project page shows the four suggested amounts and offers **“Choose an amount on GitHub”**. The canonical destination is `https://github.com/sponsors/klederson`. The actual tier, custom amount, and one-time option are selected on GitHub before confirmation. Do not present a field on the project website as though its value were automatically transferred to checkout. Source: [choosing a tier or custom amount](https://docs.github.com/en/sponsors/sponsoring-open-source-contributors/sponsoring-an-open-source-contributor-through-github).

No specification for URL parameters that prefill a price or select one-time sponsorship was found in the official sources consulted. This integration therefore does not append parameters such as `amount`, `tier_id`, or `frequency=one-time`, or promise that a website preset will already be selected on GitHub. The URL documentation consulted describes tracking metadata; that metadata does not configure the contribution amount. Source: [metadata in Sponsors URLs](https://docs.github.com/en/sponsors/receiving-sponsorships-through-github-sponsors/viewing-your-sponsors-and-sponsorships).

Before changing `enabled` to `true`, check publicly that the URL stays on Sponsors, identifies Klederson Bueno, describes TabHero’s work, offers all four one-time tiers, and allows custom amounts starting at US$ 1. Review the billing summary before confirming any payment. An existing profile, a page opening, and simulated-interface tests do not prove a payment or bank payout.

## What GitHub CLI can do

The CLI supports GraphQL queries and operations through `gh api graphql`. Query only the public listing state without requesting email addresses, Stripe accounts, or banking information:

```sh
gh api graphql -f query='query { user(login: "klederson") { sponsorsListing { isPublic url } } }'
```

An absent or nonpublic listing keeps `enabled: false`. The API also documents `createSponsorsListing`, `createSponsorsTier`, and `publishSponsorsTier`. With authorization, those operations can help prepare the profile and four tiers, but they were not executed here. Creating a listing requires confirming residence and bank country; do not infer them from a public profile. Banking information, tax forms, verification, and approval remain part of the account holder’s onboarding. The consulted reference offers no operation that replaces that entire process. Sources: [Sponsors API](https://docs.github.com/en/graphql/reference/sponsors) and [gh api manual](https://cli.github.com/manual/gh_api).

## Repository Sponsor button

While the listing is inactive, do not declare `github: klederson` in `.github/FUNDING.yml` as a ready-to-use payment channel. That destination currently returns to the profile. Use `custom` with the actual public website URL followed by `/#apoie`, or keep an explanatory README link to that section. Do not invent a publication URL.

After the Sponsors page is active and verified, the following can be added:

```yaml
github: klederson
```

Source: [configuring a Sponsor button](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/displaying-a-sponsor-button-in-your-repository).
