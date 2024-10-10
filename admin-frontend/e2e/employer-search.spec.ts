import { test } from '@playwright/test';

import { EmployerSearchPage } from './pages/employer-search/employer-search-page';
import { PagePaths } from './utils';

test.describe('Employer Search', () => {
  let employerSearchPage: EmployerSearchPage;
  test.beforeEach(async ({ page }) => {
    await page.goto(PagePaths.EMPLOYERS);
    employerSearchPage = new EmployerSearchPage(page);
    await employerSearchPage.setup();
  });

  test('search employer by name', async () => {
    await employerSearchPage.searchEmployerByAndVerify();
  });
});
