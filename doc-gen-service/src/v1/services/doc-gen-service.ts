import ejs from 'ejs';
import fs from 'node:fs/promises';
import { resolve } from 'path';
import { Browser, Page } from 'puppeteer';
import { config } from '../../config';
import { logger } from '../../logger';
import { getBrowser } from './puppeteer-service';

const STYLE_CLASSES = {
  REPORT: 'pay-transparency-report',
  PAGE: 'page',
  PAGE_CONTENT: 'page-content',
  BLOCK_GROUP: 'block-group',
  BLOCK: 'block',
  EXPLANATORY_NOTES: 'explanatory-notes',
  EXPLANATORY_NOTE: 'explanatory-note',
  FOOTNOTES: 'footnotes',
};

export const REPORT_FORMAT = {
  HTML: 'html' as string,
  PDF: 'pdf' as string,
};

const PDF_PPI = 96; //Pixels per inch. (Puppeteer uses this value internally.)
const PDF_PAGE_SIZE_INCHES = {
  width: 8.5,
  height: 11,
  marginX: 1,
  marginY: 0.5,
};
const PDF_PAGE_SIZE_PIXELS = {
  width: PDF_PAGE_SIZE_INCHES.width * PDF_PPI,
  height: PDF_PAGE_SIZE_INCHES.height * PDF_PPI,
  marginX: PDF_PAGE_SIZE_INCHES.marginX * PDF_PPI,
  marginY: PDF_PAGE_SIZE_INCHES.marginY * PDF_PPI,
};

const DEFAULT_FOOTNOTE_SYMBOLS = {
  genderCategorySuppressed: '*',
  quartileGenderCategorySuppressed: '†',
};

/*
Defines properties that must be submitted with any 
request to generate a report.
*/
export type SubmittedReportData = {
  companyName: string;
  companyAddress: string;
  reportStartDate: string;
  reportEndDate: string;
  naicsCode: string;
  naicsLabel: string;
  employeeCountRange: string;
  comments: string;
  referenceGenderCategory: string;
  explanatoryNotes: unknown;
  chartData: {
    meanHourlyPayGap: unknown[];
    medianHourlyPayGap: unknown[];
    meanOvertimePayGap: unknown[];
    medianOvertimePayGap: unknown[];
    meanBonusPayGap: unknown[];
    medianBonusPayGap: unknown[];
    hourlyPayQuartile1: unknown[];
    hourlyPayQuartile2: unknown[];
    hourlyPayQuartile3: unknown[];
    hourlyPayQuartile4: unknown[];
    percentReceivingOvertimePay: unknown[];
    percentReceivingBonusPay: unknown[];
    hourlyPayQuartilesLegend: unknown[];
  };
  tableData: {
    meanOvertimeHoursGap: unknown;
    medianOvertimeHoursGap: unknown;
  };
  chartSummaryText: unknown;
  chartSuppressedError: string;
  isAllCalculatedDataSuppressed: boolean;
  genderCodes: string[];
};

/*
Defines properties that are not explicitly
inlcuded in SubmittedReportData, but which are also needed
to generate a report.  For example: properties
derived from those in SubmittedReportData.
*/
type SupplementaryReportData = {
  pageSize: {
    margin: {
      top: number;
      bottom: number;
    };
    height: number;
  };
  footnoteSymbols: {
    genderCategorySuppressed: string;
    quartileGenderCategorySuppressed: string;
  };
  isGeneralSuppressedDataFootnoteVisible: boolean;
};

/* Includes everything from SubmittedReportData and SupplementaryReportData */
export type ReportData = SubmittedReportData & SupplementaryReportData;

const docGenServicePrivate = {
  REPORT_TEMPLATE_HEADER: resolve(
    /* istanbul ignore next */
    config.get('server:templatePath') || '',
    'report-template-header.html',
  ),
  REPORT_TEMPLATE_EMPLOYEE_DATA_SUMMARY: resolve(
    /* istanbul ignore next */
    config.get('server:templatePath') || '',
    'report-template-emp-data-summary.html',
  ),
  REPORT_TEMPLATE_INSUFFICIENT_DATA: resolve(
    /* istanbul ignore next */
    config.get('server:templatePath') || '',
    'report-template-insufficient-data.html',
  ),
  REPORT_TEMPLATE_FOOTER: resolve(
    /* istanbul ignore next */
    config.get('server:templatePath') || '',
    'report-template-footer.html',
  ),
  REPORT_TEMPLATE_SCRIPT: resolve(
    /* istanbul ignore next */
    config.get('server:templatePath') || '',
    'report.script.js',
  ),

  /**
   * Builds an ejs template suitable for creating a report from
   * the given report data.
   * Not all reports will use the same template.  For example, a report
   * in which all calculations are suppressed will use a template
   * that excludes the charts.
   */
  async buildEjsTemplate(reportData: ReportData): Promise<string> {
    // Build a template by combining multiple ejs template fragments
    // (each defined in a separate file).

    const header = await fs.readFile(
      docGenServicePrivate.REPORT_TEMPLATE_HEADER,
      { encoding: 'utf8' },
    );
    const fragments = [header];

    // The template should include an area for the main body of the content.
    // This section will look different depending on whether
    // *all* calculations have been suppressed or whether at least
    // some calculations weren't suppressed.
    if (reportData.isAllCalculatedDataSuppressed) {
      const insufficientData = await fs.readFile(
        docGenServicePrivate.REPORT_TEMPLATE_INSUFFICIENT_DATA,
        { encoding: 'utf8' },
      );
      fragments.push(insufficientData);
    } else {
      const employeeDataSummary = await fs.readFile(
        docGenServicePrivate.REPORT_TEMPLATE_EMPLOYEE_DATA_SUMMARY,
        { encoding: 'utf8' },
      );
      fragments.push(employeeDataSummary);
    }

    const footer = await fs.readFile(
      docGenServicePrivate.REPORT_TEMPLATE_FOOTER,
      { encoding: 'utf8' },
    );
    fragments.push(footer);

    return fragments.join('\n');
  },

  /* 
  This function is meant to run within the context of a "puppeteer page"
  to create a new DOM element representing a "report page" with two child
  elements:  
    <div class='page'>
      <div class='block-group'></div>
      <div class='explanatory-notes'></div>
    </div>
   */
  async addReportPage(parent: any) {
    //Implementation note (banders): classNames are inline strings here because
    //I cannot find a way to pass the STYLE_CLASSES values into Puppeteer's z
    //evaluate function
    await parent.evaluate((parent) => {
      const page = document.createElement('div');
      page.className = 'page';
      const pageContent = document.createElement('div');
      pageContent.className = 'page-content';
      const blockGroup = document.createElement('div');
      blockGroup.className = 'block-group';
      const explanatoryNotes = document.createElement('div');
      explanatoryNotes.className = 'explanatory-notes';
      pageContent.appendChild(blockGroup);
      pageContent.appendChild(explanatoryNotes);
      page.appendChild(pageContent);
      parent.appendChild(page);
    }, parent);
    const allReportPages = await parent.$$(`.${STYLE_CLASSES.PAGE}`);
    const newestReportPage = allReportPages[allReportPages.length - 1];
    if (!newestReportPage) {
      throw new Error('post condition failed: page not properly created');
    }
    return newestReportPage;
  },

  /*
  Moves the given Element 'elemToMove' in the DOM so it becomes a 
  child of 'elemToBeParent'.
  */
  async moveElementInto(puppeteerPage: Page, elemToMove, elemToBeParent) {
    /* istanbul ignore next */
    await puppeteerPage.evaluate(
      (e, p) => {
        p.appendChild(e);
        return e;
      },
      elemToMove,
      elemToBeParent,
    );
  },

  /*
  Deletes the given element from the DOM
  */
  async removeFromDom(puppeteerPage, elemToDelete) {
    /* istanbul ignore next */
    await puppeteerPage.evaluate((e) => {
      if (e?.parentNode) {
        e.parentNode.removeChild(e);
      }
    }, elemToDelete);
  },

  /*
  Modifies the DOM in the given puppeteerPage.  All content blocks  
  not currently assigned to a "report page" are placed into 
  a report page in order. Takes into account block height and the 
  availability of space on the "report pages".
  */
  async organizeContentIntoPages(puppeteerPage: Page, reportPageOptions: any) {
    const MAX_ATTEMPTS = 2;
    const payTransparencyReport = await puppeteerPage.$(
      `.${STYLE_CLASSES.REPORT}`,
    );
    const blocksToOrganize = await payTransparencyReport.$$(
      `.${STYLE_CLASSES.BLOCK}`,
    );

    let currentReportPage = await docGenServicePrivate.addReportPage(
      payTransparencyReport,
    );
    for (let i = 0; i < blocksToOrganize.length; i++) {
      const block = blocksToOrganize[i];
      const blockHeightPx = (await block.boundingBox()).height;
      const blockId = await (await block.getProperty('id')).jsonValue();
      console.log(
        `processing block '${blockId}' with height ${blockHeightPx}px`,
      );

      let blockAddedToPage = false;
      let numAttempts = 0;
      while (numAttempts < MAX_ATTEMPTS) {
        console.log(
          `attempting to place block '${blockId}' on the current page`,
        );
        blockAddedToPage = await docGenServicePrivate.attemptToMoveBlockToPage(
          puppeteerPage,
          block,
          currentReportPage,
          reportPageOptions,
        );
        if (blockAddedToPage) {
          break;
        } else {
          console.log('adding new page');
          currentReportPage = await docGenServicePrivate.addReportPage(
            payTransparencyReport,
          );
        }
        numAttempts++;
      }
      if (!blockAddedToPage) {
        logger.warn(
          `Omitted block '${blockId}' (with its associated footnotes).  It is too large for page`,
        );
      }
    }
    await payTransparencyReport.dispose();
  },

  async getContentHeight(elem): Promise<number> {
    const heightPx = (await elem.boundingBox()).height;
    return heightPx;
  },

  async attemptToMoveBlockToPage(
    puppeteerPage: Page,
    block,
    reportPage,
    reportPageOptions: any,
  ): Promise<boolean> {
    if (!block) {
      throw new Error('block must be specified');
    }
    if (!reportPage) {
      throw new Error('reportPage must be specified');
    }

    const pageContentSection = await reportPage.$(
      `.${STYLE_CLASSES.PAGE_CONTENT}`,
    );
    const pageBlocksSection = await pageContentSection.$(
      `.${STYLE_CLASSES.BLOCK_GROUP}`,
    );
    const pageExplanatoryNotesSection = await pageContentSection.$(
      `.${STYLE_CLASSES.EXPLANATORY_NOTES}`,
    );

    let currentPageHeightCommittedPx =
      await docGenServicePrivate.getContentHeight(pageContentSection);
    console.log(
      ` before try adding: currentPageHeightCommittedPx: ${currentPageHeightCommittedPx}`,
    );

    // Move the .block into .page > .blocks
    await docGenServicePrivate.moveElementInto(
      puppeteerPage,
      block,
      pageBlocksSection,
    );

    //Move .block > .footnotes into .page > .explanatory-notes
    const blockFootnotesSection = await block.$(`.${STYLE_CLASSES.FOOTNOTES}`);
    if (blockFootnotesSection) {
      await docGenServicePrivate.moveElementInto(
        puppeteerPage,
        blockFootnotesSection,
        pageExplanatoryNotesSection,
      );
    }

    currentPageHeightCommittedPx =
      await docGenServicePrivate.getContentHeight(pageContentSection);
    console.log(
      ` after try adding: currentPageHeightCommittedPx: ${currentPageHeightCommittedPx}`,
    );

    const totalPageHeightPx =
      reportPageOptions.height -
      reportPageOptions.margin.top -
      reportPageOptions.margin.bottom;

    const fitsOnPage = currentPageHeightCommittedPx < totalPageHeightPx;
    if (!fitsOnPage) {
      console.log('rollback.');
      //Rollback
      //Move .page > .explanatory-notes > .footnotes (last child) back into .block
      if (blockFootnotesSection) {
        const allFootnotesSectionsOnPage =
          await pageExplanatoryNotesSection.$$(`.footnotes`);
        if (allFootnotesSectionsOnPage.length) {
          const lastFootnotesSectionsOnPage =
            allFootnotesSectionsOnPage[allFootnotesSectionsOnPage.length - 1];
          await docGenServicePrivate.moveElementInto(
            puppeteerPage,
            lastFootnotesSectionsOnPage,
            block,
          );
        }
      }
      //Removes the .block from .page > .blocks
      console.log('removing block from page');
      await docGenServicePrivate.removeFromDom(puppeteerPage, block);
    }

    return fitsOnPage;
  },

  /**
   * Determines whether any of the included charts or tables in the given
   * SubmittedReportData had one or more gender categories suppressed.
   */
  isGeneralSuppressedDataFootnoteVisible(
    submittedReportData: SubmittedReportData,
  ) {
    const chartsToConsider = [
      'meanHourlyPayGap',
      'medianHourlyPayGap',
      'meanOvertimePayGap',
      'medianOvertimePayGap',
      'meanBonusPayGap',
      'medianBonusPayGap',
    ];
    const tablesToConsider = ['meanOvertimeHoursGap', 'medianOvertimeHoursGap'];
    const numGenderCategories = submittedReportData.genderCodes.length;
    const hasAtLeastOneIncludedChartWithSuppression =
      chartsToConsider
        .map((chartName) => submittedReportData.chartData[chartName])
        .filter((c) => c.length && c.length < numGenderCategories).length > 0;

    // Note: (numGenderCategories - 1) because because the reference gender
    // category isn't displayed in the tables
    const hasAtLeastOneIncludedTableWithSuppression =
      tablesToConsider
        .map((tableName) => submittedReportData.tableData[tableName])
        .filter((c) => c.length && c.length < numGenderCategories - 1).length >
      0;
    return (
      hasAtLeastOneIncludedChartWithSuppression ||
      hasAtLeastOneIncludedTableWithSuppression
    );
  },

  /**
   * Creates a new ReportData object which includes
   * everything from the given SubmittedReportData, plus
   * some additional derived or default properties needed
   * to generate the report.
   */
  addSupplementaryReportData(
    submittedReportData: SubmittedReportData,
  ): ReportData {
    const supplementaryReportData: SupplementaryReportData = {
      pageSize: {
        margin: {
          top: PDF_PAGE_SIZE_PIXELS.marginY,
          bottom: PDF_PAGE_SIZE_PIXELS.marginY,
        },
        height: PDF_PAGE_SIZE_PIXELS.height,
      },
      footnoteSymbols: DEFAULT_FOOTNOTE_SYMBOLS,
      isGeneralSuppressedDataFootnoteVisible:
        docGenServicePrivate.isGeneralSuppressedDataFootnoteVisible(
          submittedReportData,
        ),
    };
    const reportData: ReportData = {
      ...submittedReportData,
      ...supplementaryReportData,
    };
    return reportData;
  },
};

/**
 * Generates a report of the specified type, using the specified data
 * @param reportFormat The type of report to generate (e.g. 'pdf', 'html')
 * @param reportData The data to use when generating the report
 */
async function generateReport(
  reportFormat: string,
  submittedReportData: SubmittedReportData,
) {
  logger.info('Begin generate report');
  let puppeteerPage: Page = null;
  const reportData =
    docGenServicePrivate.addSupplementaryReportData(submittedReportData);

  try {
    const ejsTemplate = await docGenServicePrivate.buildEjsTemplate(reportData);

    const workingHtml: string = ejs.render(ejsTemplate, reportData, {
      rmWhitespace: false,
    });
    const browser: Browser = await getBrowser();
    puppeteerPage = await browser.newPage();
    await puppeteerPage.addScriptTag({
      path: './node_modules/d3/dist/d3.min.js',
    });
    await puppeteerPage.addScriptTag({
      path: docGenServicePrivate.REPORT_TEMPLATE_SCRIPT,
    });

    await puppeteerPage.setContent(workingHtml, { waitUntil: 'networkidle0' });

    // Generate charts as SVG, and inject the charts into the DOM of the
    // current puppeteerPage
    await puppeteerPage.evaluate(
      /* istanbul ignore next */
      (reportData) => {
        const chartData = reportData.chartData;
        document.getElementById('mean-hourly-pay-gap-chart')?.appendChild(
          // @ts-ignore
          horizontalBarChart(chartData.meanHourlyPayGap),
        );
        document.getElementById('median-hourly-pay-gap-chart')?.appendChild(
          // @ts-ignore
          horizontalBarChart(chartData.medianHourlyPayGap),
        );
        document.getElementById('mean-overtime-pay-gap-chart')?.appendChild(
          // @ts-ignore
          horizontalBarChart(chartData.meanOvertimePayGap),
        );
        document.getElementById('median-overtime-pay-gap-chart')?.appendChild(
          // @ts-ignore
          horizontalBarChart(chartData.medianOvertimePayGap),
        );
        document
          .getElementById('percent-receiving-overtime-pay-chart')
          ?.appendChild(
            // @ts-ignore
            percentFilledHorizBarChart(chartData.percentReceivingOvertimePay),
          );
        document.getElementById('mean-bonus-pay-gap-chart')?.appendChild(
          // @ts-ignore
          horizontalBarChart(chartData.meanBonusPayGap),
        );
        document.getElementById('median-bonus-pay-gap-chart')?.appendChild(
          // @ts-ignore
          horizontalBarChart(chartData.medianBonusPayGap),
        );
        document
          .getElementById('percent-receiving-bonus-pay-chart')
          ?.appendChild(
            // @ts-ignore
            percentFilledHorizBarChart(chartData.percentReceivingBonusPay),
          );
        document.getElementById('hourly-pay-quartile-4-chart')?.appendChild(
          // @ts-ignore
          horizontalStackedBarChart(chartData.hourlyPayQuartile4),
        );
        document.getElementById('hourly-pay-quartile-3-chart')?.appendChild(
          // @ts-ignore
          horizontalStackedBarChart(chartData.hourlyPayQuartile3),
        );
        document.getElementById('hourly-pay-quartile-2-chart')?.appendChild(
          // @ts-ignore
          horizontalStackedBarChart(chartData.hourlyPayQuartile2),
        );
        document.getElementById('hourly-pay-quartile-1-chart')?.appendChild(
          // @ts-ignore
          horizontalStackedBarChart(chartData.hourlyPayQuartile1),
        );
        document.getElementById('hourly-pay-quartiles-legend')?.appendChild(
          // @ts-ignore
          createLegend(chartData.hourlyPayQuartilesLegend),
        );
      },
      reportData,
    );

    //Reorganize the content in the DOM so it is grouped into <div>
    //elements with the .page class.
    await docGenServicePrivate.organizeContentIntoPages(
      puppeteerPage,
      reportData.pageSize,
    );

    let result = null;
    if (reportFormat == REPORT_FORMAT.HTML) {
      const renderedHtml = await puppeteerPage.content();
      result = renderedHtml;
    } else if (reportFormat == REPORT_FORMAT.PDF) {
      const pdfOptions = {
        margin: {
          top: `${PDF_PAGE_SIZE_PIXELS.marginY}px`,
          right: `${PDF_PAGE_SIZE_PIXELS.marginX}px`,
          bottom: `${PDF_PAGE_SIZE_PIXELS.marginY}px`,
          left: `${PDF_PAGE_SIZE_PIXELS.marginX}px`,
        },
        printBackground: false,
        width: `${PDF_PAGE_SIZE_PIXELS.width}px`,
        height: `${PDF_PAGE_SIZE_PIXELS.height}px`,
      };
      const pdf = await puppeteerPage.pdf(pdfOptions);
      result = pdf;
    }

    if (!result) {
      throw new Error(`Unable to generate report in format: '${reportFormat}'`);
    }

    logger.info(`Report generation complete (${reportFormat})`);
    return result;
  } catch (e) {
    /* istanbul ignore next */
    logger.error(e);
  } finally {
    if (puppeteerPage) {
      await puppeteerPage.close();
    }
  }
}

export { docGenServicePrivate, generateReport };
