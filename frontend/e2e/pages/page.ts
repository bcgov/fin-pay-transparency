import { Page, Response } from '@playwright/test';

export class PTPage {
  public getCurrentUser: Promise<Response>;
  constructor(public readonly instance: Page) {
    this.getCurrentUser = instance.waitForResponse('**/api/user');
    this.initialize();
  }

  initialize() {}
}
