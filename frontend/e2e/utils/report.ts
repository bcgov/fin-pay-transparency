import { GenerateReportPage } from '../pages/generate-report';
import { Response, Page } from '@playwright/test';

export const validateSubmitErrors = async (page: GenerateReportPage) => {
  await page.naicsInput.scrollIntoViewIfNeeded();
  await page.fillOutForm({
    naicsCode: '11 - Agriculture, forestry, fishing and hunting',
    employeeCountRange: '50-299',
    comments: 'Example test comment',
    dataConstraints: 'Example data constraint text',
    fileName: 'CsvWithErrors.csv',
  });

  const errors = await page.submitForm(
    (res) => res.url().includes('/api/v1/file-upload') && res.status() === 400,
  );

  await page.validateUploadRowValues(errors.error);
};

export const waitForApiResponses = async (
  apiCalls: {
    [key: string]: Promise<Response>;
  },
  action: () => Promise<any>,
) => {
  await action();
  const responses = await Promise.all(
    Object.keys(apiCalls).map(async (callKey) => {
      const response = await apiCalls[callKey];
      return { [callKey]: await response.json() };
    }),
  );

  return responses.reduce((acc, current) => {
    return { ...acc, ...current };
  }, {});
};

export const waitForUserAndReports = async (
  page: Page,
  action: () => Promise<any>,
) => {
  return waitForApiResponses(
    {
      user: page.waitForResponse(
        (res) => res.url().includes('/api/user') && res.status() === 200,
      ),
      reports: page.waitForResponse(
        (res) => res.url().includes('/api/v1/report') && res.status() === 200,
      ),
    },
    action,
  );
};

export const waitForCodes = async (page: Page, action: () => Promise<void>) => {
  const employeeCountRanges = page.waitForResponse(
    (res) =>
      res.url().includes('/api/v1/codes/employee-count-ranges') &&
      res.status() === 200,
  );
  const naicsCodes = page.waitForResponse(
    (res) =>
      res.url().includes('/api/v1/codes/naics-codes') && res.status() === 200,
  );

  return waitForApiResponses(
    {
      employeeCountRanges,
      naicsCodes,
    },
    action,
  );
};
