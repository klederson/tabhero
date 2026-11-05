// Exercise the real Firefox toolbar popup, not popup.html loaded in a tab.
// Isolated profile, no WhatsApp account, no messages or AI requests.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Builder, By } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

const options = new firefox.Options().addArguments('-headless').enableBidi();
const binary = process.env.FIREFOX_BINARY ?? (existsSync('/snap/firefox/current/usr/lib/firefox/firefox') ? '/snap/firefox/current/usr/lib/firefox/firefox' : null);
if (binary) options.setBinary(binary);
// Only this test profile allows automation of the browser toolbar itself.
const service = new firefox.ServiceBuilder().addArguments('--allow-system-access');
const driver = await new Builder().forBrowser('firefox').setFirefoxService(service).setFirefoxOptions(options).build();
const buttonId = 'whatsapp-mesma-aba_local_extension-browser-action';
const button = By.css(`#${buttonId} .unified-extensions-item-action-button`);
try {
  await driver.manage().window().setRect({ width: 1100, height: 900 });
  await driver.installAddon(resolve('dist/firefox'), true);
  await driver.get('about:blank');
  await driver.setContext(firefox.Context.CHROME);
  await driver.executeScript(`
    let ui = globalThis.CustomizableUI;
    if (!ui) for (const path of ['resource:///modules/CustomizableUI.sys.mjs', 'moz-src:///browser/components/customizableui/CustomizableUI.sys.mjs']) {
      try { ui = ChromeUtils.importESModule(path).CustomizableUI; break; } catch {}
    }
    ui.addWidgetToArea(arguments[0], ui.AREA_NAVBAR);
  `, buttonId);
  const dimensions = () => driver.executeScript(`
    const view = [...document.querySelectorAll('browser')].find(browser =>
      browser.currentURI?.spec?.endsWith('/popup.html') && browser.getBoundingClientRect().width > 0);
    if (!view) return null;
    const rect = view.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  `);
  for (let opening = 0; opening < 2; opening++) {
    await driver.findElement(button).click();
    let previous;
    let stable = 0;
    await driver.wait(async () => {
      const size = await dimensions();
      if (!size) return false;
      stable = previous?.width === size.width && previous?.height === size.height ? stable + 1 : 0;
      previous = size;
      return stable >= 3;
    }, 8000, 'Firefox toolbar popup must finish sizing', 100);
    assert.ok(previous.width >= 380 && previous.width <= 420, `Readable popup width required; got ${previous.width}px`);
    assert.ok(previous.height >= 180 && previous.height <= 600, `Popup height must fit; got ${previous.height}px`);
    console.log(`OK Firefox toolbar popup ${opening + 1}: ${previous.width} × ${previous.height}px.`);
    await driver.findElement(By.id('urlbar-input')).click();
    await driver.wait(async () => !await dimensions(), 5000);
  }
} finally { await driver.quit(); }
