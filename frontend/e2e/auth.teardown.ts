import { test } from './playwright/fixtures';
import {
  EXTERNAL_API_BASE_URL,
  EXTERNAL_CONSUMER_DELETE_REPORTS_API_KEY,
  PagePaths,
} from './utils';
import { PTPage, User } from './pages/page';
import { waitForApiResponses } from './utils/report';

test('logout', async ({ page, request }) => {
  const { user } = await waitForApiResponses(
    {
      user: page.waitForResponse(
        (res) => res.url().includes('/api/user') && res.status() === 200,
      ),
    },
    async () => {
      await page.goto(PagePaths.DASHBOARD);
    },
  );
  const instance = new PTPage(page);
  await instance.setup();

  await request.delete(
    `${EXTERNAL_API_BASE_URL}/api/v1/pay-transparency/reports`,
    {
      params: { companyName: (user as User).legalName },
      headers: { 'x-api-key': EXTERNAL_CONSUMER_DELETE_REPORTS_API_KEY },
    },
  );

  await instance.logout();
});
