import { test } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { PagePaths } from './utils';
import { UserManagementPage } from './pages/user-management/user-management-page';

const user = {
  name: faker.person.fullName(),
  email: faker.internet.userName(),
};
test.describe.serial('User Management', () => {
  let userManagementPage: UserManagementPage;
  test.beforeEach(async ({ page }) => {
    await page.goto(PagePaths.USER_MANAGEMENT);
    userManagementPage = new UserManagementPage(page);
    await userManagementPage.setup();
  });
  test('add new user', async () => {
    await userManagementPage.addNewUserAndVerify(user);
  });
  test('verify open and close pending access', async () => {
    await userManagementPage.verifyOpenAndClosePendingAccess();
  });
});
