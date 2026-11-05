import { sponsorshipUrl } from './sponsorship.js';
const $ = selector => document.querySelector(selector);
const all = selector => [...document.querySelectorAll(selector)];
const supported = new Set(['en', 'es-419', 'pt-BR', 'id', 'hi']);
const locale = supported.has(document.documentElement.lang) ? document.documentElement.lang : 'en';
const loadCatalog = async language => {
  const response = await fetch(new URL(`locales/${language}.json`, import.meta.url));
  if (!response.ok) throw new Error('Translation unavailable');
  return response.json();
};
const catalog = await loadCatalog(locale).catch(() => loadCatalog('en'));
const t = (key, replacements = {}) => {
  if (typeof catalog.ui[key] !== 'string') throw new Error(`Missing UI translation: ${key}`);
  return catalog.ui[key].replaceAll('__BRAND__', 'TabHero').replace(/\{(\w+)\}/g, (match, name) => replacements[name] ?? match);
};
let toastTimer;
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 3000);
}
document.addEventListener('click', async event => {
  const button = event.target.closest('[data-copy]');
  if (!button) return;
  try { await navigator.clipboard.writeText(button.dataset.copy); toast(t('toastCopied')); }
  catch { toast(t('toastOpen', { address: button.dataset.copy })); }
});
let mode = 'after';
let clicks = 0;
function resetDemo() {
  clicks = 0;
  $('#simulation-tabs').replaceChildren();
  const tab = document.createElement('span'); tab.className = 'sim-tab active'; tab.textContent = t('demoTab');
  const close = document.createElement('i'); close.textContent = '×'; tab.append(close); $('#simulation-tabs').append(tab);
  for (const [id, key] of [['sim-title','readyTitle'],['sim-message','readyMessage'],['sim-draft','originalDraft'],['sim-document','docPreserved'],['demo-status','readyStatus']]) $(`#${id}`).textContent = t(key);
}
all('[data-mode]').forEach(button => button.addEventListener('click', () => {
  mode = button.dataset.mode;
  all('[data-mode]').forEach(item => { const selected = item === button; item.classList.toggle('selected', selected); item.setAttribute('aria-pressed', String(selected)); });
  resetDemo();
}));
$('#run-demo').addEventListener('click', () => {
  clicks++;
  if (mode === 'before') {
    if (clicks <= 3) { const tab = document.createElement('span'); tab.className = 'sim-tab'; tab.textContent = t('beforeTab'); $('#simulation-tabs').append(tab); }
    for (const [id,key] of [['sim-title','beforeTitle'],['sim-message','beforeMessage'],['sim-draft','beforeDraft'],['sim-document','beforeDoc']]) $(`#${id}`).textContent = t(key);
    $('#demo-status').textContent = t(clicks === 1 ? 'beforeStatusOne' : 'beforeStatusMany', { count: new Intl.NumberFormat(locale).format(clicks) });
  } else {
    for (const [id,key] of [['sim-title','afterTitle'],['sim-message','afterMessage'],['sim-draft','afterDraft'],['sim-document','afterDoc'],['demo-status','afterStatus']]) $(`#${id}`).textContent = t(key);
  }
});
all('[data-browser]').forEach(button => button.addEventListener('click', () => {
  const browser = button.dataset.browser;
  const name = browser === 'chrome' ? 'Chrome' : 'Firefox';
  all('[data-browser]').forEach(item => { const selected = item === button; item.classList.toggle('selected', selected); item.setAttribute('aria-pressed', String(selected)); });
  $('#install-title').textContent = t(`${browser}Title`);
  $('#install-steps').innerHTML = t(`${browser}Steps`);
  $('#install-note').textContent = t(`${browser}Note`);
  $('#download-extension').href = new URL(`downloads/tabhero-${browser}.zip`, import.meta.url).href;
  $('#download-extension').textContent = t('download', { browser: name });
}));
let funding = null;
let selectedAmount = '100';
function selectedLink() {
  if (!funding?.enabled || funding.provider !== 'github') return null;
  try {
    const url = new URL(funding.githubSponsors);
    if (url.origin !== 'https://github.com' || url.pathname !== '/sponsors/klederson' || url.search || url.hash) return null;
    return sponsorshipUrl(selectedAmount === 'custom' ? $('#support-custom-amount').value : String(Number(selectedAmount) / 100));
  } catch { return null; }
}
function updateSupport() {
  const link = selectedLink();
  $('#custom-note').hidden = selectedAmount !== 'custom';
  $('#support-custom-field').hidden = selectedAmount !== 'custom';
  $('#support-submit').disabled = !link;
  $('#support-submit').textContent = link ? t('supportReady') : t('supportPending');
  $('#support-status').textContent = link ? t('supportReadyStatus') : t('supportPendingStatus');
}
all('[data-amount]').forEach(button => button.addEventListener('click', () => {
  selectedAmount = button.dataset.amount;
  all('[data-amount]').forEach(item => { const selected = item === button; item.classList.toggle('selected', selected); item.setAttribute('aria-pressed', String(selected)); });
  updateSupport();
}));
$('#support-custom-amount').addEventListener('input', updateSupport);
$('#support-form').addEventListener('submit', event => {
  event.preventDefault();
  const link = selectedLink();
  if (link) window.location.assign(link);
});
fetch(new URL('funding.json', import.meta.url), { cache: 'no-store' }).then(response => {
  if (!response.ok) throw new Error('Funding configuration unavailable');
  return response.json();
}).then(config => { funding = config; updateSupport(); }).catch(() => updateSupport());

document.documentElement.dataset.i18nReady = 'true';
