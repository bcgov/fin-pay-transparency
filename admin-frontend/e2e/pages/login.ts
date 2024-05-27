import { expect } from '@playwright/test';
import { baseURL, PagePaths } from '../utils';
import { DashboardPage } from './dashboard';
import { PTPage } from './page';

export class LoginPage extends PTPage {
  static path = PagePaths.LOGIN;
  public loginButton;

  async setup() {
    this.loginButton = await this.instance.getByRole('button', {
      name: 'Log in with IDIR',
    });
  }

  async login() {
    await this.loginButton.click();
    await this.instance.waitForTimeout(2000);
    const html = await this.instance.locator('body').innerHTML();
    if (html.includes('Sign in')) {
      expect(this.instance.getByText('Sign in'));
      await this.instance
        .getByPlaceholder('Email, phone, or Skype')
        .fill(process.env.E2E_ADMIN_USERNAME!);
      //await this.instance.click('#password');
      //await this.instance.fill('#password', process.env.E2E_ADMIN_PASSWORD!);
      await this.instance.waitForTimeout(1000);
      await this.instance.getByText('Next').click();
      await this.instance.waitForURL(baseURL!);
      const dashboard = new DashboardPage(this.instance);
      await dashboard.setup();
      await expect(dashboard.generateReportButton).toBeVisible();
      await this.instance.context().storageState({ path: 'user.json' });
    }
  }
}
