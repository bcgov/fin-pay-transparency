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

  // 2: Fill out the form in the generate report form page
  const generateReportPage = new GenerateReportPage(dashboard.instance);
  await generateReportPage.setup();
  await generateReportPage.setNaicsCode(
    '11 - Agriculture, forestry, fishing and hunting',
  );
  await generateReportPage.setEmployeeCount('50-299');
  await generateReportPage.instance.waitForTimeout(250);
  const formatter = DateTimeFormatter.ofPattern('MMMM YYYY').withLocale(
    Locale.CANADA,
  );
  await generateReportPage.instance
    .getByText('Contextual Info/Comments')
    .scrollIntoViewIfNeeded();
  const startDate = LocalDate.now().minusYears(1).withDayOfMonth(1);
  const start = generateReportPage.instance.getByText(
    startDate.format(formatter),
  );

  await generateReportPage.instance.mouse.up({ clickCount: 4 });
  await expect(start).toBeDefined();

  const endDate = LocalDate.now().minusMonths(1).withDayOfMonth(1);
  const end = generateReportPage.instance.getByText(endDate.format(formatter));
  await expect(end).toBeDefined();

  const comments = await generateReportPage.instance.locator('#comments');
  await comments.fill('Example test comment');

  await generateReportPage.instance
    .getByText('File Upload')
    .scrollIntoViewIfNeeded();

  const dataConstraints =
    await generateReportPage.instance.locator('#dataConstraints');
  await dataConstraints.fill('Example data constraint text');

  const fileChooserPromise = page.waitForEvent('filechooser');
  const csvFileInput = await generateReportPage.instance.locator('#csvFile');
  await csvFileInput.click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(path.join(__dirname, 'assets', 'CsvGood.csv'));
  await generateReportPage.instance.waitForTimeout(1000);

  await generateReportPage.instance
    .locator('#submitButton')
    .scrollIntoViewIfNeeded();
  await generateReportPage.submitForm();
});
