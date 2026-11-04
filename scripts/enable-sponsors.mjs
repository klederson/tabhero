import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
// Read-only account verification. Account/bank/tax onboarding stays on GitHub.
const query = 'query { user(login:"klederson") { sponsorsListing { isPublic url } } }';
const result = JSON.parse(execFileSync('gh', ['api', 'graphql', '-f', `query=${query}`], { encoding: 'utf8' }));
const listing = result.data?.user?.sponsorsListing;
if (!listing?.isPublic || listing.url !== 'https://github.com/sponsors/klederson') {
  console.error('The receiving profile is not public yet. Enable it at https://github.com/sponsors/accounts, then run this command again.');
  process.exitCode = 1;
} else {
  const configUrl = new URL('website/funding.json', root);
  const config = JSON.parse(await readFile(configUrl, 'utf8'));
  config.enabled = true;
  await writeFile(configUrl, `${JSON.stringify(config, null, 2)}\n`);
  await writeFile(new URL('.github/FUNDING.yml', root), 'github: klederson\ncustom: ["https://klederson.github.io/tabhero/#apoie"]\n');
  console.log('Public profile verified. Local Sponsors configuration enabled; publish the commit to update the website.');
}
