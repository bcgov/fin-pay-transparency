import { GenerateReportPage } from '../pages/generate-report';
import {Response} from '@playwright/test';

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
