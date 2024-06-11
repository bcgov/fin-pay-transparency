import { Page } from '@playwright/test';
import { PagePaths } from '../utils';
import { AdminPortalPage } from './admin-portal-page';

export class DashboardPage extends AdminPortalPage {
  static path = PagePaths.DASHBOARD;
  public generateReportButton;

  async setup() {
    await super.setup();
  }

  static async visit(page: Page): Promise<DashboardPage> {
    await page.goto(PagePaths.DASHBOARD);
    const dashboard = new DashboardPage(page);
    await dashboard.setup();
    return dashboard;
  }
}
