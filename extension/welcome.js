import { renderDisclosures } from './privacy-i18n.js';
const api = globalThis.browser ?? globalThis.chrome;
const messages = renderDisclosures(document, api);
document.documentElement.lang = api.i18n.getMessage('language') || api.i18n.getUILanguage();
document.title = `${messages.welcomeTitle} — TabHero`;
document.querySelector('#start').addEventListener('click', () => window.close());
document.documentElement.dataset.ready = 'true';
