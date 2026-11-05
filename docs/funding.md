# Support TabHero

The selected channel for [TabHero](https://github.com/klederson/tabhero) is **GitHub Sponsors**, with contributions starting at **US$ 1**. Choose **US$ 1, US$ 3, US$ 5, US$ 10**, or a custom whole-dollar amount in the extension or website, then review it on GitHub. Support is voluntary and never a condition of using the extension.

The browser extension also has a Support TabHero button and a localized support screen. It uses the same `website/funding.json`, copied into both extension packages by `scripts/build.mjs`. The receiving-state check therefore controls the site and extension together. No remote check, payment tracking, banking details or sponsor authentication is added to the extension.

On 5 November 2026, the GitHub API returned a Sponsors listing for klederson with `isPublic: false`. Later that day, the API returned `isPublic: true` and a fresh unauthenticated request stayed on the Sponsors page with Monthly, One-time and custom-amount controls. The shared configuration is now enabled. No tiers were created or payments made by this project; the GitHub page currently offers custom support.

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
  "enabled": true
}
```

Internal values are in cents; the interface displays dollars. A URL in `githubSponsors` does not prove that receiving sponsorships is active. While `enabled` is `false`, show **“Financial support coming soon”**, keep the payment button unavailable, and offer starring the [repository](https://github.com/klederson/tabhero) as an alternative.

The static GitHub Pages site does not need a backend or its own account-registration system. Never store banking details, tax information, identity documents, passwords, or tokens in the website or repository. GitHub may require the supporter to sign in and provide payment details within its own flow.

## Enable the personal receiving profile

The official route is [GitHub Sponsors → Get sponsored](https://github.com/open-source/sponsors), whose button points to [github.com/sponsors/accounts](https://github.com/sponsors/accounts). Without authentication, that address leads to sign-in. Select the personal account **klederson**.

The maintainer must complete onboarding directly on GitHub and the Stripe Connect flow it presents: contact information, bank payouts, residence and bank country, tax details, two-factor authentication, and the approval request. For bank payouts, the documentation requires the bank-account region to match the region of residence. Use the account holder’s own personal details and bank account; do not put them in project files. After approval, verify that the public page actually offers sponsorship. Source: [setting up Sponsors for a personal account](https://docs.github.com/en/sponsors/receiving-sponsorships-through-github-sponsors/setting-up-github-sponsors-for-your-personal-account).

The custom-amount flow supports the project’s presets without dedicated tiers. Optional **One-time** tiers of US$ 1, US$ 3, US$ 5 and US$ 10 can also be created in the dashboard. Keep custom support available from US$ 1. The custom minimum also applies to recurring sponsorships. Do not promise benefits that do not exist in tier descriptions. Source: [managing tiers and custom amounts](https://docs.github.com/en/sponsors/receiving-sponsorships-through-github-sponsors/managing-your-sponsorship-tiers).

## Supporter flow

The project page shows the four suggested amounts and offers **“Choose an amount on GitHub”**. The canonical destination is `https://github.com/sponsors/klederson`. The selected amount is sent to GitHub’s native GET review form. Users review it and can change the amount or frequency on GitHub before confirmation. Source: [choosing a tier or custom amount](https://docs.github.com/en/sponsors/sponsoring-open-source-contributors/sponsoring-an-open-source-contributor-through-github).

On 5 November 2026, the live public GitHub Sponsors page exposed its native custom-amount form as a GET to `/sponsors/klederson/sponsorships`, with `amount` and `frequency` fields. The One-time view uses `frequency=one-time`. The extension and website now reuse those fields for selected and custom whole-dollar amounts. An unauthenticated request for `?amount=5&frequency=one-time` reached GitHub sign-in with both values preserved in `return_to`. This opens review, not payment confirmation; no transaction is submitted automatically. The shared builder is `extension/sponsorship.js`, also copied into the static site at build time.

This replaces the earlier profile-only link based on documentation that did not describe amount selection. The link is now grounded in GitHub’s actual public form; maintainers should recheck it if GitHub changes that form.

Before changing `enabled` to `true`, verify the public receiving URL and recipient and check the support controls. Suggested values can be chosen through GitHub’s custom-amount flow; dedicated tiers are optional. Review the billing summary before confirming any payment. An existing profile, a page opening, and simulated-interface tests do not prove a payment or bank payout.

## What GitHub CLI can do

The CLI supports GraphQL queries and operations through `gh api graphql`. Query only the public listing state without requesting email addresses, Stripe accounts, or banking information:

```sh
gh api graphql -f query='query { user(login: "klederson") { sponsorsListing { isPublic url } } }'
```

An absent or nonpublic listing keeps `enabled: false`. The API also documents `createSponsorsListing`, `createSponsorsTier`, and `publishSponsorsTier`. With authorization, those operations can help prepare the profile and four tiers, but they were not executed here. Creating a listing requires confirming residence and bank country; do not infer them from a public profile. Banking information, tax forms, verification, and approval remain part of the account holder’s onboarding. The consulted reference offers no operation that replaces that entire process. Sources: [Sponsors API](https://docs.github.com/en/graphql/reference/sponsors) and [gh api manual](https://cli.github.com/manual/gh_api).

## Repository Sponsor button

While the listing is inactive, do not declare `github: klederson` in `.github/FUNDING.yml` as a ready-to-use payment channel. An inactive destination can return to the profile. Use `custom` with the actual public website URL followed by `/#apoie`, or keep an explanatory README link to that section. Do not invent a publication URL.

For the verified public Sponsors profile, the repository now includes:

```yaml
github: klederson
```

Source: [configuring a Sponsor button](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/displaying-a-sponsor-button-in-your-repository).
