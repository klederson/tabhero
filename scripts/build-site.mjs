import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const destination = new URL('website/dist/', root);
const origin = 'https://klederson.github.io/tabhero/';
const locales = ['en', 'es-419', 'pt-BR', 'id', 'hi'];
const languageLabels = { en: 'Language', 'es-419': 'Idioma', 'pt-BR': 'Idioma', id: 'Bahasa', hi: 'भाषा' };
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const brand = value => value.replaceAll('__BRAND__', 'TabHero').replaceAll('__WORDMARK__', 'tabhero.');
const template = await readFile(new URL('website/template.html', root), 'utf8');
const privacyTemplate = await readFile(new URL('website/privacy-template.html', root), 'utf8');
const researchTemplate = await readFile(new URL('website/research-template.html', root), 'utf8');
const sources = JSON.parse(await readFile(new URL('website/research-sources.json', root), 'utf8'));
const { version } = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
const catalogs = await Promise.all(locales.map(async locale => JSON.parse(await readFile(new URL(`website/locales/${locale}.json`, root), 'utf8'))));
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
for (const entry of await readdir(new URL('website/', root))) {
  if (['dist', 'index.html', 'template.html', 'privacy.html', 'privacy-template.html', 'research-template.html'].includes(entry)) continue;
  await cp(new URL(`website/${entry}`, root), new URL(entry, destination), { recursive: true });
}
const alternates = catalogs.map(catalog => `<link rel="alternate" hreflang="${catalog.locale}" href="${origin}${catalog.path ? `${catalog.path}/` : ''}">`).join('\n')
  + `\n<link rel="alternate" hreflang="x-default" href="${origin}">`;
for (const catalog of catalogs) {
  const canonical = `${origin}${catalog.path ? `${catalog.path}/` : ''}`;
  let html = template.replace(/<!--i18n:([\w]+)-->[\s\S]*?<!--\/i18n:\1-->/g, (match, key) => {
    if (typeof catalog.strings[key] !== 'string') throw new Error(`Missing ${catalog.locale}:${key}`);
    return `<!--i18n:${key}-->${brand(catalog.strings[key])}<!--/i18n:${key}-->`;
  }).replace(/__I18N_ATTR_(\w+)__/g, (_, key) => {
    if (typeof catalog.strings[key] !== 'string') throw new Error(`Missing ${catalog.locale}:${key}`);
    return escape(brand(catalog.strings[key]));
  });
  const replacements = { __LANG__: catalog.locale, __META_TITLE__: catalog.meta.title, __META_DESCRIPTION__: catalog.meta.description, __OG_TITLE__: catalog.meta.ogTitle, __OG_DESCRIPTION__: catalog.meta.ogDescription, __OG_URL__: canonical, __OG_IMAGE__: `${origin}assets/social-card.png`, __CANONICAL__: canonical };
  for (const [token, value] of Object.entries(replacements)) html = html.replaceAll(token, escape(brand(value)));
  html = brand(html).replaceAll('__COMMUNITY_LINK__', escape(catalog.community.mainLink)).replace('</head>', `${alternates}\n<script type="module" src="language.js"></script>\n</head>`);
  html = html.replace(/(<strong data-version(?:="")?>)[^<]+/g, `$1${version}`);
  html = html.replace(/(<label[^>]+for="language-select"[^>]*>)[\s\S]*?(<\/label>)/, `$1${languageLabels[catalog.locale]}$2`);
  html = html.replace(/<option value="([^"]+)">/g, (match, locale) => `<option value="${locale}"${locale === catalog.locale ? ' selected' : ''}>`);
  if (catalog.path) html = html.replace(/\b(href|src)="(assets\/|downloads\/|style\.css|app\.js|language\.js|brand-book\.html)/g, '$1="../$2');
  if (/__(?:META|OG|I18N|LANG|BRAND|WORDMARK|CANONICAL)/.test(html)) throw new Error(`Unresolved token in ${catalog.locale}`);
  const directory = new URL(catalog.path ? `${catalog.path}/` : './', destination);
  await mkdir(directory, { recursive: true });
  await writeFile(new URL('index.html', directory), html);
  let privacy = privacyTemplate.replace(/__P_(\w+)__/g, (_, key) => {
    if (typeof catalog.privacy?.[key] !== 'string') throw new Error(`Missing ${catalog.locale}:privacy.${key}`);
    return catalog.privacy[key];
  }).replaceAll('__LANG__', catalog.locale).replaceAll('__CANONICAL__', `${canonical}privacy.html`)
    .replaceAll('__LANGUAGE_LABEL__', languageLabels[catalog.locale]);
  const privacyAlternates = catalogs.map(item => `<link rel="alternate" hreflang="${item.locale}" href="${origin}${item.path ? `${item.path}/` : ''}privacy.html">`).join('\n');
  privacy = privacy.replace('__ALTERNATES__', privacyAlternates).replace(/<option value="([^"]+)">/g, (match, locale) => `<option value="${locale}"${locale === catalog.locale ? ' selected' : ''}>`);
  if (catalog.path) privacy = privacy.replace(/\b(href|src)="(assets\/|style\.css|language\.js)/g, '$1="../$2');
  await writeFile(new URL('privacy.html', directory), privacy);
  const cards = sources.map((source, index) => {
    const report = catalog.community.reports[index];
    if (!report || Object.values(report).some(value => typeof value !== 'string')) throw new Error(`Invalid community report ${catalog.locale}:${index}`);
    const date = new Intl.DateTimeFormat(catalog.locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${source.date}T00:00:00Z`));
    return `<article class="report-card" id="${source.id}" data-report data-kind="${source.kind}"><div class="report-meta"><span class="report-number">${String(index + 1).padStart(2, '0')}</span><span>${escape(source.source)}</span><span class="report-kind">${escape(catalog.community[source.kind])}</span></div><h2>${escape(report.title)}</h2><p class="report-byline">${escape(source.author)} · <time datetime="${source.date}">${escape(date)}</time></p><div class="report-details"><div><h3>${escape(catalog.community.reported)}</h3><p>${escape(report.summary)}</p></div><div><h3>${escape(catalog.community.insight)}</h3><p>${escape(report.insight)}</p></div></div><p class="report-context"><strong>${escape(catalog.community.context)}:</strong> ${escape(report.context)}</p><a class="text-link" href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(catalog.community.original)} ↗</a></article>`;
  }).join('\n');
  const researchAlternates = catalogs.map(item => `<link rel="alternate" hreflang="${item.locale}" href="${origin}${item.path ? `${item.path}/` : ''}research.html">`).join('\n') + `\n<link rel="alternate" hreflang="x-default" href="${origin}research.html">`;
  let research = researchTemplate.replace(/__C_(\w+)__/g, (_, key) => {
    if (typeof catalog.community[key] !== 'string') throw new Error(`Missing ${catalog.locale}:community.${key}`);
    return catalog.community[key];
  }).replaceAll('__CARDS__', cards).replaceAll('__COUNT__', escape(catalog.community.count.replace('{count}', new Intl.NumberFormat(catalog.locale).format(sources.length))))
    .replaceAll('__LANG__', catalog.locale).replaceAll('__CANONICAL__', `${canonical}research.html`).replaceAll('__LANGUAGE_LABEL__', languageLabels[catalog.locale])
    .replaceAll('__ALTERNATES__', researchAlternates).replace(/<option value="([^"]+)">/g, (match, locale) => `<option value="${locale}"${locale === catalog.locale ? ' selected' : ''}>`);
  if (catalog.path) research = research.replace(/\b(href|src)="(assets\/|style\.css|language\.js|research\.js)/g, '$1="../$2');
  if (/__[A-Z_]+__/.test(research)) throw new Error(`Unresolved research token in ${catalog.locale}`);
  await writeFile(new URL('research.html', directory), research);
}
await mkdir(new URL('downloads/', destination), { recursive: true });
for (const browser of ['chrome', 'firefox']) {
  for (const name of ['tabhero', 'tabthere', 'jata']) await cp(new URL(`artifacts/whatsapp-mesma-aba-${browser}.zip`, root), new URL(`downloads/${name}-${browser}.zip`, destination));
}
for (const name of ['tabhero', 'tabthere', 'jata']) await cp(new URL('artifacts/tabhero-brand-kit.zip', root), new URL(`downloads/${name}-brand-kit.zip`, destination));
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...catalogs.flatMap(catalog => { const base = `${origin}${catalog.path ? `${catalog.path}/` : ''}`; return [base, `${base}privacy.html`, `${base}research.html`]; }), `${origin}brand-book.html`].map(url => `  <url><loc>${url}</loc></url>`).join('\n')}\n</urlset>\n`;
await writeFile(new URL('sitemap.xml', destination), sitemap);
console.log(`TabHero site ready: English default plus ${locales.slice(1).join(', ')}.`);
