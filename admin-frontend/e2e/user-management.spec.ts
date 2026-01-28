import { test } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { PagePaths } from './utils';
import { UserManagementPage } from './pages/user-management/user-management-page';

const user = {
  name: faker.person.fullName(),
  email: faker.internet.username(),
};
test.describe.serial('User Management', () => {
  let userManagementPage: UserManagementPage;
  test.beforeEach(async ({ page }) => {
    userManagementPage = new UserManagementPage(page);
    await userManagementPage.visit();
    await userManagementPage.validatePage();
  });
  test('add new user', async () => {
    await userManagementPage.addNewUserAndVerify(user);
  });
  test('verify open and close pending access', async () => {
    await userManagementPage.verifyOpenAndClosePendingAccess();
  });
});
