import { launch, Browser } from 'puppeteer';

let browser: Browser;

async function initBrowser() {
  browser = await launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
    headless: true,
    env: {
      ELECTRON_DISABLE_SANDBOX: '1',
    },
  });
}

async function getBrowser() {
  if (!browser || browser.connected === false) {
    await initBrowser();
  }
  return browser;
}

export { initBrowser, getBrowser };
