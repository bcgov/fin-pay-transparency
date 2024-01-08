import { resolve } from 'path';
import { config } from '../../config';
import fs from 'node:fs/promises';
import ejs from 'ejs';
import { getBrowser } from './puppeteer-service';
import { Browser, Page } from 'puppeteer';
import { logger } from '../../logger';

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
  try{

  }catch (e) {
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
    document.getElementById('mean-hourly-pay-gap-chart').appendChild(
      chartData.medianHourlyPayGap.length ?
        // @ts-ignore
        horizontalBarChart(chartData.meanHourlyPayGap) :
        document.createTextNode(reportData.chartSuppressedError)
    );
    document.getElementById('median-hourly-pay-gap-chart').appendChild(
      chartData.medianHourlyPayGap.length ?
        // @ts-ignore
        horizontalBarChart(chartData.medianHourlyPayGap) :
        document.createTextNode(reportData.chartSuppressedError)
    );
    document.getElementById('mean-overtime-pay-gap-chart').appendChild(
      chartData.meanOvertimePayGap.length ?
        // @ts-ignore
        horizontalBarChart(chartData.meanOvertimePayGap) :
        document.createTextNode(reportData.chartSuppressedError)
    );
    document.getElementById('median-overtime-pay-gap-chart').appendChild(
      chartData.medianOvertimePayGap.length ?
        // @ts-ignore
        horizontalBarChart(chartData.medianOvertimePayGap) :
        document.createTextNode(reportData.chartSuppressedError)
    );
    document.getElementById('mean-bonus-pay-gap-chart').appendChild(
      chartData.meanBonusPayGap.length ?
        // @ts-ignore
        horizontalBarChart(chartData.meanBonusPayGap) :
        document.createTextNode(reportData.chartSuppressedError)
    );
    document.getElementById('median-bonus-pay-gap-chart').appendChild(
      chartData.medianBonusPayGap.length ?
        // @ts-ignore
        horizontalBarChart(chartData.medianBonusPayGap) :
        document.createTextNode(reportData.chartSuppressedError)
    );

  }, reportData);

  // Extract the HTML of the active DOM, which includes the injected charts
  const renderedHtml = await page.content();
  await page.close();
  return renderedHtml;
}

export { generateReport };
