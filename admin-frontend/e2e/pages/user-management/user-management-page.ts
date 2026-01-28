import { expect, Locator } from 'playwright/test';
import { AdminPortalPage } from '../admin-portal-page';
import { PagePaths } from '../../utils';

export class UserManagementPage extends AdminPortalPage {
  pendingAccessButton: Locator;
  addUserButton: Locator;

  constructor(page) {
    super(page);
    this.pendingAccessButton = page.getByRole('button', {
      name: 'Pending Access',
    });
    this.addUserButton = page.getByRole('button', { name: 'Add New User' });
  }

  async visit() {
    await this.page.goto(PagePaths.USER_MANAGEMENT);
  }

  async validatePage() {
    await expect(this.pendingAccessButton).toBeVisible();
    await expect(this.addUserButton).toBeVisible();
  }

  async verifyOpenAndClosePendingAccess() {
    const waitForAccessResponse = this.waitForUserInvitesToLoad();
    await this.pendingAccessButton.click();
    const modalTitle = await this.page.getByText('Pending User Access');
    await expect(modalTitle).toBeVisible();
    const response = await waitForAccessResponse;
    const data = await response.json();
    if (data.length === 0) {
      const noPendingAccess = await this.page.getByText(
        'No pending invitations',
      );
      await expect(noPendingAccess).toBeVisible();
    } else {
      for (const { admin_user_onboarding_id, first_name, email } of data) {
        const inviteName = await this.page.getByTestId(
          `name-${admin_user_onboarding_id}`,
        );
        await expect(inviteName).toBeVisible();
        await expect(inviteName).toContainText(first_name);
        const inviteEmail = await this.page.getByTestId(
          `email-${admin_user_onboarding_id}`,
        );
        await expect(inviteEmail).toBeVisible();
        await expect(inviteEmail).toContainText(email);
      }
    }

    const closeButton = await this.page.getByRole('button', { name: 'Close' });
    await closeButton.click();
    await expect(modalTitle).not.toBeVisible();
  }

  async addNewUserAndVerify(user: { name: string; email: string }) {
    await this.addUserButton.click();
    const nameInput = await this.page.getByLabel('Name');
    await expect(nameInput).toBeVisible();
    const emailInput = await this.page.getByLabel('Email');
    await expect(emailInput).toBeVisible();
    const submitButton = await this.page.getByRole('button', {
      name: 'Add',
      exact: true,
    });

    // Fill out form
    await nameInput.fill(user.name);
    await emailInput.fill(user.email);
    const addUserResponse = this.waitForUserToBeAdded();
    await submitButton.click();
    const continueButton = await this.page.getByRole('button', {
      name: 'Continue',
    });
    await continueButton.click();
    const response = await addUserResponse;
    await response.json();
    const snackbar = await this.page.getByText(
      'User successfully onboarded. An email has been sent for them to activate their account for the application. Once they activate their account the user will be displayed for user management',
    );
    await expect(snackbar).toBeVisible();
  }

  waitForUserToBeAdded() {
    return this.page.waitForResponse(
      (response) =>
        response.url().includes('/v1/user-invites') &&
        response.status() === 200 &&
        response.request().method() === 'POST',
    );
  }

  async waitForUserInvitesToLoad() {
    return this.page.waitForResponse(
      (response) =>
        response.url().includes('/v1/user-invites') &&
        response.status() === 200 &&
        response.request().method() === 'GET',
    );
  }
}
