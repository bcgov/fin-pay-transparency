import { authenticator } from 'otplib';
import { PagePaths } from '../utils';
import { AdminPortalPage } from './admin-portal-page';

export class LoginPage extends AdminPortalPage {
  static path = PagePaths.LOGIN;

  async setup() {}

  async login() {
    await this.page.getByTestId('login-button').click();
    await this.page.getByLabel('Enter your email, phone, or').click();
    await this.page
      .getByPlaceholder('Email, phone, or Skype')
      .fill(process.env.E2E_ADMIN_USERNAME!);
    await this.page.getByRole('button', { name: 'Next' }).click();
    await this.page.getByPlaceholder('Password').click();
    await this.page
      .getByPlaceholder('Password')
      .fill(process.env.E2E_ADMIN_PASSWORD!);
    await this.page.getByRole('button', { name: 'Sign in' }).click();

    const totpToken = authenticator.generate(
      process.env.E2E_ADMIN_TOTP_SECRET!,
    );
    await this.page.getByPlaceholder('Code').click();
    await this.page.getByPlaceholder('Code').fill(totpToken);
    await this.page.getByRole('button', { name: 'Verify' }).click();
    await this.page.getByText("Don't show this again").click();
    await this.page.getByRole('button', { name: 'Yes' }).click();
  }
}
