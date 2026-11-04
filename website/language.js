const languages = { en: '', 'es-419': 'es', 'pt-BR': 'pt-br', id: 'id', hi: 'hi' };
const select = document.getElementById('language-select');
if (select) {
  select.value = document.documentElement.lang;
  select.addEventListener('change', () => {
    if (!Object.hasOwn(languages, select.value)) return;
    const root = new URL('./', import.meta.url);
    const path = languages[select.value];
    const target = new URL(path ? `${path}/` : './', root);
    if (location.pathname.endsWith('/privacy.html')) target.pathname += 'privacy.html';
    target.hash = location.hash;
    location.assign(target.href);
  });
}
