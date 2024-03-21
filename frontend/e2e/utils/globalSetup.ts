const { FullConfig } = require('@playwright/test');
const dotenv = require('dotenv');

const globalSetup = (config) => {
  dotenv.config({
    path: '.env.playwright',
    override: true,
  });
}

export default globalSetup;