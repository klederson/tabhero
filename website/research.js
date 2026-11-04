const locale = document.documentElement.lang;
const catalog = await fetch(new URL(`locales/${locale}.json`, import.meta.url)).then(response => {
  if (!response.ok) throw new Error('Community translation unavailable');
  return response.json();
});
const cards = [...document.querySelectorAll('[data-report]')];
const buttons = [...document.querySelectorAll('[data-filter]')];
const update = filter => {
  for (const card of cards) card.hidden = filter !== 'all' && card.dataset.kind !== filter;
  for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.filter === filter));
  const count = new Intl.NumberFormat(locale).format(cards.filter(card => !card.hidden).length);
  document.getElementById('report-count').textContent = catalog.community.count.replace('{count}', count);
};
for (const button of buttons) button.addEventListener('click', () => update(button.dataset.filter));
update('all');
document.documentElement.dataset.researchReady = 'true';
