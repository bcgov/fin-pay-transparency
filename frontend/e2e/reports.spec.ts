import { test, expect } from '@playwright/test';
import { DateTimeFormatter, LocalDate } from '@js-joda/core';
import { Locale } from '@js-joda/locale';
import { DashboardPage } from './pages/dashboard';
import { GenerateReportPage } from './pages/generate-report';
import path from 'path';

test('generate new report', async ({ page }) => {
  // 1: Click generate report button from the dashboard page
  await page.goto('/dashboard');
  const dashboard = new DashboardPage(page);
  await dashboard.setup();
  await dashboard.gotoGenerateReport();

  const generateReportPage = new GenerateReportPage(dashboard.instance);
  await generateReportPage.fillOutForm({
    naicsCode: '11 - Agriculture, forestry, fishing and hunting',
    employeeCountRange: '50-299',
    comments: 'Example test comment',
    dataConstraints: 'Example data constraint text',
    fileName: 'CsvGood.csv',
  });
  await generateReportPage.submitForm();
});
