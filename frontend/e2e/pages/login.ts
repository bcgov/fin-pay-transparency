import { expect } from '@playwright/test';
import { PTPage } from './page';
import { baseURL, PagePaths } from '../utils';
import { DashboardPage } from './dashboard';

export class LoginPage extends PTPage {
  static path = PagePaths.LOGIN;
  public loginButton;

  async setup() {
    this.loginButton = await this.instance.getByRole('button', {
      name: 'Log In with Business BCeID',
    });
  }

  async login() {
    await this.loginButton.click();
    await this.instance.waitForTimeout(2000);
    const html = await this.instance.locator('body').innerHTML();
    if (html.includes('Use a Business BCeID')) {
      expect(this.instance.getByText('Use a Business BCeID'));
      await this.instance.fill('#user', process.env.E2E_USERNAME!);
      await this.instance.click('#password');
      await this.instance.fill('#password', process.env.E2E_PASSWORD!);
      await this.instance.waitForTimeout(1000);
      await this.instance.locator('#login-form').press('Enter');
      await this.instance.waitForURL(baseURL!);
      const dashboard = new DashboardPage(this.instance);
      await dashboard.setup();
      await expect(dashboard.generateReportButton).toBeVisible();
      await this.instance.context().storageState({ path: 'user.json' });
    }
  }
}
