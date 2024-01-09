import ejs from 'ejs';
import fs from 'node:fs/promises';
import { resolve } from 'path';
import { Browser, Page } from 'puppeteer';
import { config } from '../../config';
import { logger } from '../../logger';
import { getBrowser } from './puppeteer-service';

const REPORT_TEMPLATE = resolve(config.get('server:templatePath') || '', 'report.template.html');
const REPORT_TEMPLATE_SCRIPT = resolve(config.get('server:templatePath') || '', 'report.script.js');

type ReportData = {
  chartData: {
    meanHourlyPayGap: unknown[];
    medianHourlyPayGap: unknown[];
    meanOvertimePayGap: unknown[];
    medianOvertimePayGap: unknown[];
    meanBonusPayGap: unknown[];
    medianBonusPayGap: unknown[];
  };
  chartSuppressedError: string;
  reportType: string;
  reportData: {
    companyName: string;
    companyAddress: string;
    reportStartDate: string;
    reportEndDate: string;
    naicsCode: string;
    naicsLabel: string;
    employeeCountRange: string;
    comments: string;
    referenceGenderCategory: string;
    explanatoryNotes: string;

  };
};

/**
 * Generates a report of the specified type, using the specified data
 * @param reportType The type of report to generate (e.g. 'pdf', 'html')
 * @param reportData The data to use when generating the report
 */
async function generateReport(reportType: string, reportData: ReportData) {
  try {

  } catch (e) {
    logger.error(e);

  }
  const ejsTemplate = await fs.readFile(REPORT_TEMPLATE, { encoding: 'utf8' });
  const workingHtml: string = ejs.render(ejsTemplate, reportData);
  const browser: Browser = await getBrowser();
  const page: Page = await browser.newPage();
  await page.addScriptTag({ path: './node_modules/d3/dist/d3.min.js' });
  await page.addScriptTag({ path: REPORT_TEMPLATE_SCRIPT });

  await page.setContent(workingHtml, { waitUntil: 'networkidle0' });

  // Generate charts as SVG, and inject the charts into the DOM of the
  // current page
  await page.evaluate((reportData) => {
    const chartData = reportData.chartData;
    document.getElementById('mean-hourly-pay-gap-chart')?.appendChild(
      // @ts-ignore
      horizontalBarChart(chartData.meanHourlyPayGap)
    );
    document.getElementById('median-hourly-pay-gap-chart')?.appendChild(
      // @ts-ignore
      horizontalBarChart(chartData.medianHourlyPayGap)
    );
    document.getElementById('mean-overtime-pay-gap-chart')?.appendChild(
      // @ts-ignore
      horizontalBarChart(chartData.meanOvertimePayGap)
    );
    document.getElementById('median-overtime-pay-gap-chart')?.appendChild(
      // @ts-ignore
      horizontalBarChart(chartData.medianOvertimePayGap)
    );
    document.getElementById('mean-bonus-pay-gap-chart')?.appendChild(
      // @ts-ignore
      horizontalBarChart(chartData.meanBonusPayGap)
    );
    document.getElementById('median-bonus-pay-gap-chart')?.appendChild(
      // @ts-ignore
      horizontalBarChart(chartData.medianBonusPayGap)
    );

  }, reportData);

  // Extract the HTML of the active DOM, which includes the injected charts
  const renderedHtml = await page.content();
  await page.close();
  return renderedHtml;
}

export { generateReport };

