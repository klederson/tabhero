import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
// Read-only account verification. Account/bank/tax onboarding stays on GitHub.
const query = 'query { user(login:"klederson") { sponsorsListing { isPublic url } } }';
const result = JSON.parse(execFileSync('gh', ['api', 'graphql', '-f', `query=${query}`], { encoding: 'utf8' }));
const listing = result.data?.user?.sponsorsListing;
if (!listing?.isPublic || listing.url !== 'https://github.com/sponsors/klederson') {
  console.error('O perfil de recebimento ainda não está público. Habilite-o em https://github.com/sponsors/accounts e execute novamente.');
  process.exitCode = 1;
} else {
  const configUrl = new URL('website/funding.json', root);
  const config = JSON.parse(await readFile(configUrl, 'utf8'));
  config.enabled = true;
  await writeFile(configUrl, `${JSON.stringify(config, null, 2)}\n`);
  await writeFile(new URL('.github/FUNDING.yml', root), 'github: klederson\ncustom: ["https://klederson.github.io/jata/#apoie"]\n');
  console.log('Perfil público verificado. Configuração local de Sponsors ativada; publique o commit para atualizar o site.');
}
