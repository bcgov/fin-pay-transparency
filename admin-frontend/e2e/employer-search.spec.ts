import { test } from '@playwright/test';

import { EmployerSearchPage } from './pages/employer-search/employer-search-page';

test.describe('Employer Search', () => {
  let employerSearchPage: EmployerSearchPage;
  test.beforeEach(async ({ page }) => {
    employerSearchPage = new EmployerSearchPage(page);
    await employerSearchPage.visit();
    await employerSearchPage.validatePage();
  });

  test('search employer by name', async () => {
    await employerSearchPage.searchEmployerByAndVerify();
  });
});
