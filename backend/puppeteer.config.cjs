const {resolve, join} = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer.
  cacheDirectory: resolve('.', '.cache', 'puppeteer')
  //cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};