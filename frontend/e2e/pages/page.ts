import { Page, Response } from '@playwright/test';

export class PTPage {
  constructor(public readonly instance: Page) {
  }
  
  setup() {
  }
}
