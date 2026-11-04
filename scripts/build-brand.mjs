import { chromium } from 'playwright';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const path = relative => fileURLToPath(new URL(relative, root));
await mkdir(new URL('brand/', root), { recursive: true });
await mkdir(new URL('extension/icons/', root), { recursive: true });
await mkdir(new URL('artifacts/', root), { recursive: true });
const symbol = await readFile(new URL('website/assets/symbol.svg', root), 'utf8');
await writeFile(new URL('brand/symbol.svg', root), symbol);
await writeFile(new URL('brand/symbol-mono.svg', root), symbol.replaceAll('#C7F65A', '#17231B').replaceAll('stroke="#17231B"', 'stroke="#F7F7EF"'));
for (const file of ['logo.svg', 'logo-mono.svg', 'logo-on-dark.svg']) {
  await cp(new URL(`brand/${file}`, root), new URL(`website/assets/${file}`, root));
}
const browser = await chromium.launch({ channel: 'chromium', headless: true });
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const size of [16, 32, 48, 128, 180, 512]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${symbol}`);
    const output = size <= 128 ? `extension/icons/${size}.png` : `website/assets/icon-${size}.png`;
    await page.screenshot({ path: path(output), omitBackground: true });
    if (size === 512) await cp(new URL(output, root), new URL('brand/icon-512.png', root));
  }
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.goto(new URL('brand/social-card.html', root).href);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path('brand/social-card.png') });
  await cp(new URL('brand/social-card.png', root), new URL('website/assets/social-card.png', root));
  await page.goto(new URL('website/brand-book.html', root).href);
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: path('brand/brand-book.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
  await cp(new URL('brand/brand-book.pdf', root), new URL('website/assets/brand-book.pdf', root));
} finally { await browser.close(); }
execFileSync('zip', ['-q', '-r', '-FS', path('artifacts/tabthere-brand-kit.zip'), '.'], { cwd: path('brand/') });
console.log('Símbolos, ícones, logos, cartão social, guia PDF e kit de marca prontos.');
