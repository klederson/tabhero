import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { englishMessages, errorMessage, localizedError, message } from '../extension/i18n.js';

const json = async path => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const placeholders = value => [...value.matchAll(/\{\w+\}|__BRAND__|__WORDMARK__/g)].map(match => match[0]).sort();
const markup = value => value.match(/<[^>]+>/g) ?? [];

test('all five website locales cover the English page, interactive UI and privacy policy', async () => {
  const reference = await json('../website/locales/en.json');
  assert.equal(reference.locale, 'en');
  assert.equal(reference.path, '');
  for (const locale of ['en', 'es-419', 'pt-BR', 'id', 'hi']) {
    const catalog = await json(`../website/locales/${locale}.json`);
    assert.equal(catalog.locale, locale);
    for (const section of ['strings', 'ui', 'privacy']) {
      assert.deepEqual(Object.keys(catalog[section]).sort(), Object.keys(reference[section]).sort(), `${locale}:${section}`);
      for (const [key, value] of Object.entries(catalog[section])) {
        assert.equal(typeof value, 'string');
        assert.ok(value.trim().length > 0, `${locale}:${key}`);
        assert.deepEqual(placeholders(value), placeholders(reference[section][key]), `${locale}:${key} substitutions`);
        assert.deepEqual(markup(value), markup(reference[section][key]), `${locale}:${key} HTML and interactive attributes`);
      }
    }
  }
});

test('native extension locales have complete messages and an English manifest fallback', async () => {
  const manifest = await json('../extension/manifest.json');
  assert.equal(manifest.default_locale, 'en');
  assert.equal(manifest.name, '__MSG_extensionName__');
  for (const locale of ['en', 'es', 'pt_BR', 'id', 'hi']) {
    const catalog = await json(`../extension/_locales/${locale}/messages.json`);
    assert.deepEqual(Object.keys(catalog).sort(), Object.keys(englishMessages).sort(), locale);
    assert.match(catalog.brandName.message, /^TabThere$/);
    assert.equal(message('retry', { i18n: { getMessage: key => catalog[key]?.message ?? '' } }), catalog.retry.message);
  }
  assert.equal(message('retry', {}), 'Try again');
});

test('localization preserves stable error codes without exposing internal exceptions', () => {
  const api = { i18n: { getMessage: key => key === 'errorUnavailable' ? 'Local translation' : '' } };
  const error = localizedError('unavailable', api);
  assert.equal(error.code, 'unavailable');
  assert.equal(error.message, 'Local translation');
  assert.equal(localizedError('private internal error').code, 'routing-failed');
  assert.doesNotMatch(errorMessage('private internal error'), /private internal error/);
});
