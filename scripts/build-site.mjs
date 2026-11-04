import { cp, mkdir, readFile, readdir, rm } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const destination = new URL('website/dist/', root);
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
for (const entry of await readdir(new URL('website/', root))) {
  if (entry === 'dist') continue;
  await cp(new URL(`website/${entry}`, root), new URL(entry, destination), { recursive: true });
}
await mkdir(new URL('downloads/', destination), { recursive: true });
for (const browser of ['chrome', 'firefox']) {
  await cp(new URL(`artifacts/whatsapp-mesma-aba-${browser}.zip`, root), new URL(`downloads/jata-${browser}.zip`, destination));
}
await cp(new URL('artifacts/jata-brand-kit.zip', root), new URL('downloads/jata-brand-kit.zip', destination));
const { version } = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
console.log(`Site JáTá ${version} pronto em website/dist. Todos os arquivos são estáticos.`);
