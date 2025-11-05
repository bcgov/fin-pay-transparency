import { launch, connect, type Browser } from 'puppeteer';
import { logger } from '../../logger';

/**
 * Singleton browser instance used across the service
 * @private
 */
let browser: Browser = null;

/**
 * Initializes a new browser instance with secure defaults
 * @private
 */
async function initBrowser(): Promise<void> {
  try {
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
    logger.info('New browser instance initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize browser instance', error);
    throw error;
  }
}

/**
 * Gets a connected and responsive browser instance
 * Will attempt to:
 * 1. Use existing browser if available and responsive
 * 2. Reconnect to existing browser if disconnected
 * 3. Create new browser instance if reconnection fails
 *
 * @returns Promise<Browser> A connected browser instance
 * @throws Error if unable to establish a working browser instance
 */
async function getBrowser(): Promise<Browser> {
  // Case 1: Check if existing browser is responsive
  if (browser) {
    try {
      await browser.version();
      return browser;
    } catch (versionError) {
      logger.warn('Existing browser instance is not responsive.', versionError);
      // Fall through to reconnection attempt
    }
  }

  // Case 2: No browser or unresponsive - try reconnecting if we have a connection
  if (browser && !browser.connected) {
    logger.info('Attempting to reconnect to existing browser instance.');
    try {
      browser = await connect({
        browserWSEndpoint: browser.wsEndpoint(),
      });
      logger.info('Successfully reconnected to browser instance.');
      return browser;
    } catch (connectError) {
      logger.warn('Failed to reconnect to existing browser.', connectError);
      // Fall through to new instance creation
    }
  }

  // Case 3: Create new instance as final fallback
  try {
    logger.info('Creating new browser instance.');
    await initBrowser();
    return browser;
  } catch (error) {
    logger.error('Critical error in browser management.', error);
    throw new Error('Failed to establish browser instance: ' + error.message);
  }
}

export { initBrowser, getBrowser };
