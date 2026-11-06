import { defineConfig, devices } from '@playwright/test';
import { baseURL } from './e2e/utils';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  timeout: 120000,
  testDir: './e2e',
  globalSetup: './e2e/utils/globalSetup.ts',
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI
    ? [['blob'], ['list', { printSteps: true }]]
    : [
        ['list', { printSteps: true }],
        ['html', { open: 'always' }],
        ['json', { outputFile: './test-results.json' }],
      ],
  // developer-machine-snapshots are in a different folder to prevent conflicts
  // developer snapshots should not be committed to the repository
  snapshotDir: process.env.CI ? 'e2e/snapshots.ci' : 'e2e/snapshots.user',

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: baseURL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    headless: true,
    launchOptions: {
      ignoreDefaultArgs: ['--headless=old'],
      args: ['--headless=new'],
    },
  },
  /* Configure projects for major browsers */
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'teardown',
      testMatch: /.*\.teardown\.ts/,
      use: {
        storageState: 'user.json',
      },
    },
    {
      name: 'chrome',
      testIgnore: /visual-regression\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        baseURL: baseURL,
        storageState: 'user.json',
      },
      dependencies: ['setup'],
      teardown: 'teardown',
    },
    {
      name: 'firefox',
      testIgnore: /visual-regression\.spec\.ts$/,
      use: {
        ...devices['Desktop Firefox'],
        baseURL: baseURL,
        storageState: 'user.json',
      },
      dependencies: ['setup'],
      teardown: 'teardown',
    },
    {
      name: 'safari',
      testIgnore: /visual-regression\.spec\.ts$/,
      use: {
        ...devices['Desktop Safari'],
        baseURL: baseURL,
        storageState: 'user.json',
      },
      dependencies: ['setup'],
      teardown: 'teardown',
    },
    {
      name: 'edge',
      testIgnore: /visual-regression\.spec\.ts$/,
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
        baseURL: baseURL,
        storageState: 'user.json',
      },
      dependencies: ['setup'],
      teardown: 'teardown',
    },
    // Visual regression only projects
    {
      name: 'chrome-visual',
      testMatch: /visual-regression\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        baseURL: baseURL,
        storageState: 'user.json',
      },
      dependencies: ['setup'],
      teardown: 'teardown',
    },
    {
      name: 'firefox-visual',
      testMatch: /visual-regression\.spec\.ts$/,
      use: {
        ...devices['Desktop Firefox'],
        baseURL: baseURL,
        storageState: 'user.json',
      },
      dependencies: ['setup'],
      teardown: 'teardown',
    },
    {
      name: 'safari-visual',
      testMatch: /visual-regression\.spec\.ts$/,
      use: {
        ...devices['Desktop Safari'],
        baseURL: baseURL,
        storageState: 'user.json',
      },
      dependencies: ['setup'],
      teardown: 'teardown',
    },
    {
      name: 'edge-visual',
      testMatch: /visual-regression\.spec\.ts$/,
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
        baseURL: baseURL,
        storageState: 'user.json',
      },
      dependencies: ['setup'],
      teardown: 'teardown',
    },
  ],
});
